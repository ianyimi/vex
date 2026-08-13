import type { CollectionConfig } from "../collections";
import type { GlobalConfig } from "../globals";
import type {
  DocumentBySlug,
  GlobalDocumentBySlug,
  CollectionsFieldTypeMap,
  GlobalsFieldTypeMap,
} from "../types/generated";
/**
 * CRUD action set — the four core database operations.
 *
 * All resource subjects (collections and globals) support these actions.
 * Draft actions ({@link DraftAction}) are added conditionally when a resource
 * has `versions.drafts === true`.
 */
export type CrudAction = "create" | "read" | "update" | "delete";

/**
 * Draft-specific actions — conditional, only present on resources with versioning.
 *
 * Collections and globals that declare `versions.drafts: true` gain this set
 * of actions for controlling read access to unpublished versions and draft
 * publication/unpublication workflows.
 */
export type DraftAction = "readDrafts" | "saveDraft" | "publish" | "unpublish";

/**
 * Default permission posture when a role, subject, or action is not explicitly
 * declared in the permission matrix.
 *
 * - `"allow"` (default): undeclared = allow.
 * - `"deny"`: undeclared = deny, require explicit permission.
 */
export type AccessDefaults = "allow" | "deny";

/**
 * Single permission check result — boolean (shorthand: all fields or no fields)
 * or field-mode object (restrict to named fields).
 *
 * @typeParam TFieldKeys - Union of valid field keys for this resource.
 */
export type FieldPermissionResult<TFieldKeys extends string> =
  | boolean
  | { mode: "allow" | "deny"; fields: TFieldKeys[] };

/**
 * Resolved field-level permissions after a check with fields requested.
 *
 * A map of field name → access boolean (true = allowed, false = denied).
 */
export type ResolvedFieldPermissions = Record<string, boolean>;

/**
 * Props passed to a permission callback — typed conditionally based on resource
 * and organization support.
 *
 * When `TData` is `never`, the `data` key is omitted.
 * When `TOrg` is `never`, the `organization` key is omitted.
 *
 * @typeParam TData - Document type for the resource; `never` if not applicable.
 * @typeParam TUser - User object shape.
 * @typeParam TOrg - Organization object shape; `never` if not configured.
 */
export type PermissionCallbackProps<TData, TUser, TOrg> = {
  ...(TData extends never ? {} : { data: TData }),
  user: TUser,
  ...(TOrg extends never ? {} : { organization: TOrg }),
};

/**
 * A single permission check — static boolean, field-mode object, or async callback.
 *
 * The callback receives context (user, data, organization) and may return a field
 * permission result or `undefined` (interpreted as deny).
 *
 * @typeParam TData - Document type for the resource.
 * @typeParam TUser - User object shape.
 * @typeParam TOrg - Organization object shape; `never` if not configured.
 * @typeParam TFieldKeys - Union of valid field keys for this resource.
 */
export type PermissionCheck<TData, TUser, TOrg, TFieldKeys extends string> =
  | FieldPermissionResult<TFieldKeys>
  | ((props: PermissionCallbackProps<TData, TUser, TOrg>) => FieldPermissionResult<TFieldKeys> | undefined);

/**
 * A subject entry — the union of possible actions and the shape of data and
 * field names for a single checkable resource or gate.
 *
 * All subjects carry an `action` union (set of checkable action strings),
 * a `data` type (the document shape if data-aware, or `never` if not),
 * and a `fields` union (field names available in field-level checks).
 */
export interface SubjectEntry {
  /** Union of actions this subject supports (e.g., `"read" | "write" | "delete"`). */
  action: string;
  /** Document or context type; `never` for contexts without data. */
  data: unknown;
  /** Union of field keys; `never` for non-field-aware subjects. */
  fields: string;
}

// ──── Inference helpers (local, since rebuild lacks cross-config type inference) ────

/**
 * Extract the slug from a CollectionConfig or GlobalConfig.
 *
 * @internal
 */
type ExtractSlug<T> = T extends CollectionConfig<any, any, infer S, any, any>
  ? S
  : T extends GlobalConfig<any, any, infer S, any, any>
    ? S
    : never;

/**
 * Infer the document type from a CollectionConfig or GlobalConfig.
 *
 * For now, all resources are treated as `Record<string, unknown>` since
 * the rebuild does not yet synthesize doc types from field definitions.
 * This placeholder ensures type consistency; future builds may generate
 * precise types.
 *
 * @internal
 */
type InferDocType<T> = Record<string, unknown>;

/**
 * Extract the union of field keys from a CollectionConfig or GlobalConfig.
 *
 * For now, returns `never` as a placeholder since the rebuild does not yet
 * synthesize field-key unions from field definitions. This ensures type consistency;
 * future builds may generate precise unions.
 *
 * @internal
 */
type ExtractFieldKeys<T> = never;

/**
 * Test whether a resource config has versioning with drafts enabled.
 *
 * @internal
 */
type HasDrafts<T> = T extends GlobalConfig<any, any, any, any, any>
  ? T["versions"]["drafts"] extends true
    ? true
    : false
  : T extends CollectionConfig<any, any, any, any, any>
    ? false // Collections do not yet have versions; only globals do
    : false;

/**
 * The complete subject registry — a record mapping resource slugs and custom
 * subject names to their entry (action union, data type, field keys).
 *
 * Includes:
 * - All resources (collections + globals) keyed by slug, with conditional
 *   DraftAction inclusion.
 * - Custom subjects, each with its declared action union and no data/fields.
// ──── Inference helpers (registry-based via GeneratedVexTypes augmentation) ────

/**
 * Extract the slug from a resource config (collection or global, or minimal { slug }).
 *
 * @internal
 */
type ExtractSlug<T> = T extends { slug: infer S extends string } ? S : never;

/**
 * Infer the document type from a resource slug via the generated registry.
 *
 * Reads `DocumentBySlug[slug]` for collections, `GlobalDocumentBySlug[slug]` for globals,
 * falling back to `Record<string, unknown>` before the build generates types.
 *
 * @internal
 */
type InferDocType<T> = T extends { slug: infer S extends string }
  ? S extends keyof DocumentBySlug
    ? DocumentBySlug[S]
    : S extends keyof GlobalDocumentBySlug
      ? GlobalDocumentBySlug[S]
      : Record<string, unknown>
  : Record<string, unknown>;

/**
 * Extract the union of all field keys for a resource slug via CollectionsFieldTypeMap or GlobalsFieldTypeMap.
 *
 * Returns the union of all field names (all values across all field types in the map).
 * Falls back to `string` when the slug is not yet augmented by `vex generate`.
 *
 * @internal
 */
type ExtractFieldKeys<T> = T extends { slug: infer S extends string }
  ? S extends keyof CollectionsFieldTypeMap
    ? CollectionsFieldTypeMap[S][keyof CollectionsFieldTypeMap[S]] & string
    : S extends keyof GlobalsFieldTypeMap
      ? GlobalsFieldTypeMap[S][keyof GlobalsFieldTypeMap[S]] & string
      : string
  : string;

/**
 * Test whether a resource config has versioning with drafts enabled.
 *
 * @internal
 */
type HasDrafts<T> = T extends { versions?: { drafts?: infer D extends boolean } }
  ? D extends true
    ? true
    : false
  : false;
 * @example
 * ```ts
 * customResources: {
 *   apiKey: {
 *     actions: ["create", "revoke"],
 *     data: dataType<{ key: string; secret: string }>(),
 *   },
 * }
 * ```
 *
 * @ignore
/**
 * Input shape for the `defineAccess` builder.
 *
 * Specifies roles, resources (collections + globals), custom subjects, user/org
 * collection bindings, and the permission matrix.
 *
 * @typeParam TRoles - Union of valid role names (inferred from `roles` array).
 * @typeParam TResources - Tuple of resource configs (collections + globals).
 * @typeParam TCustom - Record of custom subject names → action arrays.
/**
 * The complete subject registry — a record mapping resource slugs and custom
 * subject names to their entry (action union, data type, field keys).
 *
 * Includes:
 * - All resources (collections + globals) keyed by slug, with conditional
 *   DraftAction inclusion gated on `versions.drafts` flag.
 * - Custom subjects, each with its declared action union and no data/fields.
 * - The built-in `adminPanel` subject (actions: `"access" | "impersonate"`).
 *
 * @typeParam TResources - Tuple of resource configs ({ slug: string; versions?: { drafts?: boolean } }).
 * @typeParam TCustom - Record of custom subject names to action-union arrays.
 */
export type SubjectMap<
  TResources extends readonly { slug: string; versions?: { drafts?: boolean } }[],
  TCustom extends Record<string, readonly unknown[]>
> =
  // Resources: map each to its subject entry
  & {
    [R in TResources[number] as ExtractSlug<R>]: {
      action: CrudAction | (HasDrafts<R> extends true ? DraftAction : never);
      data: InferDocType<R>;
      fields: ExtractFieldKeys<R>;
    };
  }
  // Custom resources: map action arrays
  & {
    [K in keyof TCustom]: {
      action: TCustom[K][number];
      data: never;
      fields: never;
    };
  }
  // Built-in admin subject
  & {
    adminPanel: {
      action: "access" | "impersonate";
      data: never;
      fields: never;
    };
  };
  /**
   * List of role identifiers in this system.
   *
   * Role names are used as keys in the `permissions` matrix.
   * Example: `["admin", "editor", "viewer"]`.
   */
  roles: TRoles;

  /**
   * Resource configs (collections and globals) to include in the subject registry.
   *
   * Each resource contributes a subject keyed by its slug.
   */
  resources: TResources;

  /**
   * Custom, non-resource subjects with arbitrary action unions.
   *
   * Each entry is a subject name → action array mapping.
   * Actions are strings; the runtime does not restrict them.
   * Example: `{ apiKeys: ["create", "revoke"], analytics: ["view", "export"] }`.
   */
  customResources?: TCustom;

  /**
   * Collection config used to identify users and bind to the `organization` context.
   *
   * Callback permissions may reference `user` (a doc from this collection).
   */
  userCollection: TUserCollection;

  /**
   * Collection config for organizations (if applicable).
   *
   * When provided, the `organization` context is available in permission callbacks.
   * When omitted, organization context is never available.
   */
  organizationCollection?: TOrgCollection;

  /**
   * Default permission posture for undeclared subjects, actions, or fields.
   *
   * - `"allow"` (default): assume allow when no explicit rule is declared.
   * - `"deny"`: assume deny when no explicit rule is declared (whitelist model).
   *
   * @defaultValue `"allow"`
   */
  defaults?: AccessDefaults;

  /**
   * Permission matrix: role name → subject name → per-action checks.
   *
   * Each role maps to a record of subject checks. Subject checks may be:
   * - `boolean` — shorthand for all actions (true = allow all, false = deny all).
   * - Object with action keys — fine-grained per-action control.
   *   - Special key `"*"`: wildcard (true = allow all actions, false = deny all).
   *   - Each action value is a {@link PermissionCheck}.
   *
   * Example:
   * ```ts
   * permissions: {
   *   admin: { "*": true },
   *   editor: {
   *     pages: {
   *       create: true, read: true, update: true,
   *       delete: ({ data }) => !["home", "pricing"].includes(data.slug),
   *     },
   *     adminPanel: false,
   *   },
   * }
   * ```
   */
  permissions: Record<TRoles[number], Record<string, unknown>>;
}
export type CustomResourceInput =
  | readonly string[]
  | { actions: readonly string[]; data?: DataTypeCarrier<unknown> };

/**
 * Create a data-type carrier for use in custom resource declarations.
 *
 * This function has no runtime implementation; it exists solely to carry
 * type information. Call it with a generic type parameter to create a
 * carrier that preserves the type for callbacks and field inference.
 *
 * @typeParam T - The data type for this custom resource.
 * @returns A carrier object (purely for type inference).
 *
 * @example
 * ```ts
 * customResources: {
 *   audit: {
 *     actions: ["read", "export"],
 *     data: dataType<AuditLog>(),
 *   },
 * }
 * ```
 */
export function dataType<T>(): DataTypeCarrier<T> {
/**
 * Input shape for the `defineAccess` builder.
 *
 * Specifies roles, resources (collections + globals), custom subjects, user/org
 * collection bindings, and the permission matrix.
 *
 * @typeParam TRoles - Union of valid role names (inferred from `roles` array).
 * @typeParam TResources - Tuple of resource configs with `{ slug: string; versions?: { drafts?: boolean } }` shape.
 * @typeParam TCustom - Record of custom subject names → action arrays.
 * @typeParam TUserCollection - User resource with `{ slug: string }` shape (types inferred from registry).
 * @typeParam TOrgCollection - Organization resource with `{ slug: string }` shape; `undefined` if omitted.
 *
 * @see {@link VexAccessConfig} for the resolved runtime shape.
 */
export interface VexAccessInput<
  TRoles extends readonly string[],
  TResources extends readonly { slug: string; versions?: { drafts?: boolean } }[] = readonly [],
  TCustom extends Record<string, readonly unknown[]> = {},
  TUserCollection extends { slug: string } = { slug: string },
  TOrgCollection extends { slug: string } | undefined = undefined,
> {
  TUserCollection,
  TOrgCollection,
> {
  /**
   * List of role identifiers in this system.
   *
   * Role names are used as keys in the `permissions` matrix.
   * Example: `["admin", "editor", "viewer"]`.
   */
  roles: TRoles;

  /**
   * Resource configs (collections and globals) to include in the subject registry.
   *
   * Each resource contributes a subject keyed by its slug.
   */
  resources: TResources;

  /**
   * Custom, non-resource subjects with arbitrary action unions.
   *
   * Each entry is a subject name → action array mapping.
   * Actions are strings; the runtime does not restrict them.
   * Example: `{ apiKeys: ["create", "revoke"], analytics: ["view", "export"] }`.
   */
  customResources?: TCustom;

  /**
   * Collection config used to identify users and bind to the `organization` context.
   *
   * Callback permissions may reference `user` (a doc from this collection).
   */
  userCollection: TUserCollection;

  /**
   * Collection config for organizations (if applicable).
   *
   * When provided, the `organization` context is available in permission callbacks.
   * When omitted, organization context is never available.
   */
  organizationCollection?: TOrgCollection;

  /**
   * Default permission posture for undeclared subjects, actions, or fields.
   *
   * - `"allow"` (default): assume allow when no explicit rule is declared.
   * - `"deny"`: assume deny when no explicit rule is declared (whitelist model).
   *
   * @defaultValue `"allow"`
   */
  defaults?: AccessDefaults;

  /**
   * Permission matrix: role name → subject name → per-action checks.
   *
   * Each role maps to a record of subject checks. Subject checks may be:
   * - `boolean` — shorthand for all actions (true = allow all, false = deny all).
   * - Object with action keys — fine-grained per-action control.
   *   - Special key `"*"`: wildcard (true = allow all actions, false = deny all).
   *   - Each action value is a {@link PermissionCheck}.
   *
   * Example:
   * ```ts
   * permissions: {
   *   admin: { "*": true },
   *   editor: {
   *     pages: {
   *       create: true, read: true, update: true,
   *       delete: ({ data }) => !["home", "pricing"].includes(data.slug),
   *     },
   *     adminPanel: false,
   *   },
   * }
   * ```
   */
  permissions: Record<TRoles[number], Record<string, unknown>>;
}

/**
 * Resolved access configuration — the runtime shape returned by `defineAccess`.
 *
 * This type is intentionally minimal and type-erased at the value level; most
 * inference happens via the phantom `TSubjects` type parameter, which the builder
 * uses to preserve subject shape for `hasPermission` inference.
 *
 * The runtime config carries: roles, defaults, user/org collections, and the
 * permission matrix in normalized form.
 *
 * @typeParam TSubjects - Phantom type parameter: the resolved {@link SubjectMap}.
 *   Used for inference in {@link hasPermission} signatures; erased at runtime.
 *
 * @see {@link VexAccessInput} for the input shape.
 * @see {@link hasPermission} for how this config is consumed.
 */
export interface VexAccessConfig<TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>> {
  /**
   * List of role names in this system.
   *
   * @internal
   */
  roles: readonly string[];

  /**
   * Default permission posture.
   *
   * @internal
   */
  defaults: AccessDefaults;

  /**
   * The user collection config bound to this access system.
   *
   * @internal
   */
  userCollection: unknown;

  /**
   * Organization collection config (if configured).
   *
   * @internal
   */
  organizationCollection?: unknown;

  /**
   * Permission matrix in normalized form.
   *
   * @internal
   */
  permissions: Record<string, Record<string, unknown>>;

  /**
   * Phantom field: carries the {@link SubjectMap} type for inference.
   *
   * This field is declared but never assigned or read at runtime.
   * TypeScript uses it to infer subject shape in {@link hasPermission} overloads.
   *
   * @internal
   */
  declare readonly __subjects: TSubjects;
}

/**
 * Runtime error thrown when a permission check fails with `throwOnDenied: true`.
 *
 * Carries the resource, action, and (if applicable) the first denied field name.
 *
 * @example
 * ```ts
 * try {
 *   hasPermission({
 *     access, user, userRoles,
 *     resource: "pages", action: "delete",
 *     data: page,
 *     throwOnDenied: true,
 *   });
 * } catch (err) {
 *   if (err instanceof VexAccessError) {
 *     console.error(`Access denied: ${err.resource}.${err.action} on field ${err.field || "(all)"}`);
 *   }
 * }
 * ```
 */
export class VexAccessError extends Error {
  /**
   * The resource on which access was denied.
   */
  resource: string;

  /**
   * The action on the resource that was denied.
   */
  action: string;

  /**
   * The first field that was denied (if `fields` were checked); undefined otherwise.
   */
  field?: string;

  /**
   * @param message — Human-readable error message.
   * @param options — Additional error details.
   * @param options.resource — Resource name.
   * @param options.action — Action name.
   * @param options.field — First denied field name (optional).
   */
  constructor(
    message: string,
    options: {
      resource: string;
      action: string;
      field?: string;
    }
  ) {
    super(message);
    this.name = "VexAccessError";
    this.resource = options.resource;
    this.action = options.action;
    this.field = options.field;
  }
}

/**
 * Error thrown when access configuration is invalid.
 *
 * Raised by `defineAccess` when builders detects invalid input: role mismatches,
 * missing collections, or misconfigured resource/organization bindings.
 *
 * @example
 * ```ts
 * try {
 *   defineAccess({
 *     roles: ["admin"],
 *     resources: [pages, posts],
 *     permissions: {
 *       admin: { unknown_resource: true }, // unknown_resource not in resources
 *     },
 *   });
 * } catch (err) {
 *   if (err instanceof VexAccessConfigError) {
 *     console.error("Access config is invalid:", err.message);
 *   }
 * }
 * ```
 */
export class VexAccessConfigError extends Error {
  /**
   * @param message — Human-readable description of the configuration error.
   */
  constructor(message: string) {
    super(message);
    this.name = "VexAccessConfigError";
  }
}
