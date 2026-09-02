import { CollectionSlug } from "../types/generated";
import { PERMISSION_MODES, ADMIN_CUSTOM_SUBJECTS, WILDCARD_KEY } from "./constants";
import {
  CustomActionsInput,
  VexAccessConfigError,
  type AccessResource,
  type CustomResourceInput,
  type SubjectMap,
  type VexAccessConfig,
  type VexAccessConfigInput,
} from "./types";

/**
 * Defines the RBAC configuration for a VexCMS project.
 *
 * Builder in the `defineCollection`/`defineGlobal` family: infers the
 * per-subject action/data/field registry (`SubjectMap`) from `resources` and
 * `customResources` so `hasPermission()` calls against the returned config are
 * fully typed; validates the matrix in dev; returns a frozen `VexAccessConfig`
 * for `defineConfig({ access })`.
 *
 * @typeParam TRoles - Tuple of role name literals.
 * @typeParam TResources - Tuple of collection/global configs contributing subjects.
 * @typeParam TCustomResources - Custom subject declarations (`{ actions, data? }`).
 * @typeParam TUserSlug - Slug literal of the user collection; drives the callback
 *   `user` type via the generated registry.
 * @typeParam TOrgSlug - Slug literal of the organization collection, when
 *   multi-tenant. Presence gates the `organization` callback key; `undefined`
 *   when single-tenant.
 * @param props - The access configuration.
 * @param props.roles - All role names the matrix may reference.
 * @param props.resources - Collections/globals to expose as subjects, keyed by slug.
 * @param props.customResources - Non-resource subjects, keyed by name.
 * @param props.userCollectionSlug - Slug of the collection whose documents are
 *   `user` in callbacks. A plain string — the merged user collection
 *   (auth-adapter fields included) does not exist yet at authoring time; the
 *   document type resolves from the generated registry by slug.
 * @param props.userRolesField - Field on the user document holding role(s)
 *   (`string` or `string[]` value); `hasPermission` reads roles from it.
 * @param props.orgCollectionSlug - Optional org collection slug enabling
 *   org-scoped callbacks.
 * @param props.permissions - Role → subject → check matrix (see `RolePermissions`).
 * @returns Frozen `VexAccessConfig` carrying the `SubjectMap` phantom for inference.
 * @throws {VexAccessConfigError} When `userCollectionSlug` or `userRolesField` is
 *   empty, when a `customResources` key collides with a resource slug, or when a
 *   `customResources` entry declares an empty `actions` array. Also when a rule's
 *   recorded constraints are not an in-order prefix of a declared index or violate
 *   Convex's operator rule (see `validateAccessConstraints`), and when a
 *   `constraints` callback throws while being recorded — every rule's callback runs
 *   once here, at module load, so a rule that reached past its types surfaces as a
 *   config error naming the role, resource and action rather than as a bare
 *   `TypeError` from whichever method was missing.
 * @example
 * ```ts
 * export const access = defineAccess({
 *   roles: ["admin", "editor"],
 *   resources: [pages, users],
 *   customResources: { apiKeys: { actions: ["create", "revoke"] } },
 *   userCollectionSlug: "users",
 *   userRolesField: "roles",
 *   permissions: {
 *     admin: { [WILDCARD_KEY]: true },
 *     editor: { pages: { read: true, update: true }, apiKeys: false },
 *   },
 * });
 * ```
 *
 * @see {@link VexAccessConfigInput} for the input type
 * @see {@link VexAccessConfig} for the resolved return type
 */
export function defineAccess<
  const TRoles extends readonly string[],
  const TResources extends readonly AccessResource[],
  const TCustomResources extends Record<string, CustomResourceInput> = {},
  const TUserSlug extends CollectionSlug = CollectionSlug,
  const TOrgSlug extends CollectionSlug | undefined = undefined,
  const TCustomActions extends Partial<
    Record<TResources[number]["slug"] | TUserSlug | Extract<TOrgSlug, string>, CustomActionsInput>
  > = {},
>(
  props: VexAccessConfigInput<
    TRoles,
    TResources,
    TCustomResources,
    TUserSlug,
    TOrgSlug,
    TCustomActions
  >,
): VexAccessConfig<
  SubjectMap<TResources, TCustomResources, TUserSlug, TOrgSlug, TCustomActions>,
  TResources,
  TUserSlug,
  TOrgSlug,
  TCustomActions
> {
  // Hard errors — always run, regardless of NODE_ENV. The user collection
  // itself cannot be validated here (auth-adapter fields merge later, inside
  // `defineConfig`), so validation is limited to the config's own shape.
  if (props.userCollectionSlug.length === 0) {
    throw new VexAccessConfigError(`userCollectionSlug cannot be empty`);
  }
  if (props.userRolesField.length === 0) {
    throw new VexAccessConfigError(`userRolesField cannot be empty`);
  }
  if (props.anonRole !== undefined && props.anonRole.length === 0) {
    throw new VexAccessConfigError(`anonRole must not be empty if provided`);
  }

  const resourceSlugs = new Set<string>(
    props.resources
      .map((resource) => resource.slug)
      .concat(
        props.orgCollectionSlug
          ? [props.userCollectionSlug, props.orgCollectionSlug]
          : [props.userCollectionSlug],
      ),
  );
  for (const [key, customResource] of Object.entries(props.customResources ?? {})) {
    if (resourceSlugs.has(key)) {
      throw new VexAccessConfigError(`customResources "${key}" collides with a resource slug`);
    }
    if (customResource.actions.length === 0) {
      throw new VexAccessConfigError(`customResources "${key}" must declare at least one action`);
    }
  }

  // Dev-only validation warnings — a typo'd role or subject would otherwise
  // silently resolve via `defaultPermissionMode` at runtime.
  if (process.env.NODE_ENV !== "production") {
    const knownSubjects = new Set<string>([
      ...resourceSlugs,
      props.userCollectionSlug,
      ...(props.orgCollectionSlug ? [props.orgCollectionSlug] : []),
      ...Object.keys(props.customResources ?? {}),
      ...Object.keys(ADMIN_CUSTOM_SUBJECTS),
    ]);
    const roleSet = new Set<string>(props.roles);
    for (const [role, subjects] of Object.entries(props.permissions)) {
      if (!roleSet.has(role)) {
        console.warn(`permission role "${role}" not in roles array`);
        continue;
      }
      for (const subjectKey of Object.keys(subjects as Record<string, unknown>)) {
        if (subjectKey !== WILDCARD_KEY && !knownSubjects.has(subjectKey)) {
          console.warn(
            `permission subject "${subjectKey}" not found in resources, customResources, or adminPanel`,
          );
        }
      }
    }
    if (props.orgCollectionSlug !== undefined && props.orgCollectionSlug.length === 0) {
      console.warn(`orgCollectionSlug must not be empty`);
    }
  }

  return Object.freeze({
    anonRole: props.anonRole,
    enabled: props.enabled ?? true,
    roles: props.roles,
    resources: props.resources,
    customActions: props.customActions,
    // Pinned, not defaulted: an allow posture applies at two different fallthrough
    // points (one of which never consults the role wildcard), which made it an
    // invisible global grant. Use a role-level `"*": true` instead.
    defaultPermissionMode: PERMISSION_MODES.deny,
    userCollectionSlug: props.userCollectionSlug,
    userRolesField: props.userRolesField,
    orgCollectionSlug: props.orgCollectionSlug,
    permissions: props.permissions,
  });
}
