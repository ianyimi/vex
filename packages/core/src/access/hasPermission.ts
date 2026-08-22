import { PERMISSION_MODES, PERMISSION_SCOPES, PermissionScope, WILDCARD_KEY } from "./constants";
import { VexAccessError } from "./types";
import type {
  FieldPermissionResult,
  PermissionCallbackProps,
  PermissionCheck,
  ResolvedFieldPermissions,
  SubjectEntry,
  VexAccessConfig,
} from "./types";

/**
 * Props required for the hasPermission({...}) function
 *
 * @param access - The resolved config from `defineAccess()`. `undefined`
 *   disables access control entirely — every check passes.
 * @param user - The authenticated user document. Roles are derived from
 *   `user[access.userRolesField]` (`string` or `string[]`); a missing or empty
 *   value denies. There is no separate roles parameter.
 * @param organization - The organization document forwarded to callbacks.
 *   Only surfaces when `access.orgCollectionSlug` is configured.
 * @param resource - Subject name — a resource slug, a built-in subject
 *   (e.g. `"adminPanel"`), or a custom resource name.
 * @param action - Action on `resource`, typed per subject.
 * @param data - Document/context forwarded to permission callbacks.
 * @param fields - When provided, shapes the result into a per-field map
 *   covering exactly these fields.
 * @param throwOnDenied - When `true`, throws `VexAccessError` instead of
 * @param scope Which question to answer when a role's check is a callback that
 * needs the document and `data` was not supplied:
 * `"all"` (default) asks "may they do this to every document" and resolves such
 * a check to `false` — fail-closed, never throws; `"any"` asks "may they do this
 * to at least one document" and resolves it to `true` (nav/sidebar/list gating —
 * row-level filtering happens separately in `find`/`get`); `"doc"` demands an
 * exact per-document answer and throws `VexAccessError` when `data` is missing,
 * which is what you want in edit views. Has no effect on static boolean checks,
 * and no effect when `data` is provided (the callback is always run against it).
 * @default "all"
 */
export interface HasPermissionProps<
  TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>,
  TSubject extends keyof TSubjects & string = keyof TSubjects & string,
  TData extends {} = {},
> {
  access?: VexAccessConfig<TSubjects>;
  user: Record<string, unknown> | null;
  organization?: Record<string, unknown>;
  resource: TSubject;
  action: TSubjects[TSubject]["action"];
  data?: TData;
  fields?: TSubjects[TSubject]["fields"][];
  throwOnDenied?: boolean;
  scope?: PermissionScope;
}

/**
 * Resolves runtime role-based access for a single subject + action, merging
 * every role the user holds into one decision.
 *
 * This is the single runtime entry point — every server API guard, admin panel
 * gate, and custom-subject check calls it; the resolution helpers below are
 * module-private. When `fields` is provided, returns a per-field permission
 * map instead of a single boolean.
 *
 * Resolution, per role, first hit wins: subject boolean shorthand → explicit
 * action key → subject-level `WILDCARD_KEY` → role-level `WILDCARD_KEY`
 * (undeclared subjects only) → `defaultPermissionMode`. Roles then OR-merge:
 * any role allowing (per field, when `fields` is given) allows.
 *
 * @param props @see {@link HasPermissionProps}
 * @returns `boolean` when `fields` is omitted; `ResolvedFieldPermissions`
 *   (one entry per requested field) when `fields` is provided.
 * @throws {VexAccessError} When `throwOnDenied` is `true` and access is denied —
 *   carries `resource`, `action`, and (for field checks) the first denied field.
 *
 * @example
 * ```ts
 * hasPermission({ access, user, resource: "posts", action: "update" }); // boolean
 * hasPermission({ access, user, resource: "posts", action: "delete",
 *   data: post, throwOnDenied: true }); // throws VexAccessError on deny
 * hasPermission({ access, user, resource: "posts", action: "update",
 *   fields: ["title", "slug"] }); // { title: boolean, slug: boolean }
 * ```
 */
export function hasPermission<
  TSubjects extends Record<string, SubjectEntry>,
  TSubject extends keyof TSubjects & string,
  TData extends {},
>(props: HasPermissionProps<TSubjects, TSubject, TData>): boolean {
  const { access } = props;

  if (!access || access === undefined || !access.enabled) {
    return true;
  }

  const rawRoles = props.user ? props.user[access.userRolesField] : [];
  const userRoles =
    typeof rawRoles === "string"
      ? [rawRoles]
      : Array.isArray(rawRoles)
        ? rawRoles.filter((role): role is string => typeof role === "string")
        : [];
  const knownRoles = userRoles.filter((role) => access.roles.includes(role));

  const defaultAllowed = access.defaultPermissionMode === PERMISSION_MODES.allow;
  let allPermissions: boolean | ResolvedFieldPermissions;

  if (knownRoles.length === 0) {
    allPermissions = false;
  } else {
    const resolved = knownRoles.map((userRole): FieldPermissionResult<string> => {
      const role = access.permissions[userRole];
      const resource = role?.[props.resource];

      let check: PermissionCheck;
      if (typeof resource === "boolean") {
        // { posts: true }
        check = resource;
      } else if (resource !== null && resource !== undefined && typeof resource === "object") {
        // { posts: { "*": true, update: () => {}, delete: false } }
        check =
          resolveActionCheck({
            resource: resource as Record<string, unknown>,
            action: props.action,
          }) ?? defaultAllowed;
      } else {
        // { posts: undefined }
        const roleWildcard = role?.[WILDCARD_KEY];
        check = typeof roleWildcard === "boolean" ? roleWildcard : defaultAllowed;
      }

      return (
        resolvePermissionCheck({
          check,
          user: props.user,
          data: props.data,
          organization: access.orgCollectionSlug !== undefined ? props.organization : undefined,
          resource: props.resource,
          action: props.action,
          scope: props.scope ?? PERMISSION_SCOPES.all,
        }) ?? defaultAllowed
      );
    });

    allPermissions = mergeRolePermissions({ resolved, fields: props.fields });
  }

  if (typeof allPermissions === "object") {
    // Boolean-only API: every relevant field must be allowed (AND). When the
    // caller supplies `data`, its keys are the field set being gated;
    // otherwise the explicitly requested `fields`.
    const fields = props.data ? Object.keys(props.data) : (props.fields ?? []);
    for (const field of fields) {
      if (allPermissions[field] === false) {
        if (props.throwOnDenied) {
          throw new VexAccessError({
            resource: props.resource,
            action: props.action,
            field,
          });
        }
        return false;
      }
    }
    // No relevant field was denied → the action is allowed.
    return true;
  }

  if (allPermissions === false) {
    if (props.throwOnDenied) {
      throw new VexAccessError({
        resource: props.resource,
        action: props.action,
      });
    }
    return false;
  }
  return true;
}

const CAPABILITY_PROBE = Symbol("vex.capabilityProbe");
/**
 * Resolves one role's `PermissionCheck` into a concrete result: booleans and
 * mode objects pass through; callbacks are invoked with `{ user, data?,
 * organization? }`.
 *
 * Module-private. The caller resolves "not declared" to the configured
 * `defaultPermissionMode` BEFORE calling — `check` is always a real check
 * here. A callback returning `undefined` resolves to `false` (deny), so an
 * inconclusive callback can never be mistaken for an undeclared action.
 *
 * @throws VexAccessError when trying to call hasPermission without passing data
 * when a permission check requires the data to execture and determine the result
 * @returns The check's boolean or field-mode object; for callbacks, the
 *   callback's result with `undefined` normalized to `false`.
 */
function resolvePermissionCheck<TData, TUser, TOrg, TFieldKeys extends string>(props: {
  check: PermissionCheck;
  user: TUser;
  data?: TData;
  organization?: TOrg;
  resource: string;
  action: string;
  scope: PermissionScope;
}): FieldPermissionResult<TFieldKeys> {
  if (typeof props.check !== "function") {
    return props.check as FieldPermissionResult<TFieldKeys>;
  }

  const callbackProps = {
    user: props.user,
    data: props.data !== undefined ? props.data : undefined,
    organization: props.organization !== undefined ? props.organization : undefined,
  } as PermissionCallbackProps;
  if (props.data !== undefined) {
    const result = props.check(callbackProps);
    return result === undefined ? false : (result as FieldPermissionResult<TFieldKeys>);
  }

  try {
    // no data → probe whether the callback DEPENDS on data (throws the sentinel on ANY access;
    // Proxy is truthy so `?.` doesn't short-circuit, unlike a bare `undefined`)
    const probe = new Proxy(
      {},
      {
        get() {
          throw { [CAPABILITY_PROBE]: true };
        },
        has() {
          throw { [CAPABILITY_PROBE]: true };
        },
        ownKeys() {
          throw { [CAPABILITY_PROBE]: true };
        },
      },
    );
    const result = props.check({ ...callbackProps, data: probe });
    return result === undefined ? false : (result as FieldPermissionResult<TFieldKeys>);
  } catch (e) {
    const touchedData =
      typeof e === "object" &&
      e !== null &&
      (e as Record<symbol, unknown>)[CAPABILITY_PROBE] === true;
    if (!touchedData) throw e; // a real error from the callback body — never swallow it
    // The callback needs the document and none was supplied — answer the
    // quantified question the caller asked for. See `PERMISSION_SCOPES`.
    if (props.scope === PERMISSION_SCOPES.any) {
      // "at least one document" — a per-doc condition may hold for some row.
      return true;
    }
    if (props.scope === PERMISSION_SCOPES.all) {
      // "every document" — a per-doc condition means it cannot hold for all.
      return false;
    }
    throw new VexAccessError({
      resource: props.resource,
      action: props.action,
      message:
        `hasPermission: "${props.resource}.${props.action}" needs a "data" object (its check reads the document). ` +
        `Pass "data" for an exact check, or use scope: "any" (nav/list gating) or scope: "all" (bulk actions).`,
    });
  }
}

/**
 * Merges one resolved `FieldPermissionResult` per role into a single result —
 * OR across roles (allow wins over deny), per field when `fields` is given.
 *
 * Module-private. Field-map semantics with no `fields` param: allow-mode with
 * nonempty `fields` → `true` ("can touch something"); allow-mode with empty
 * `fields` → `false`; deny-mode with nonempty `fields` → `false` ("something
 * is denied"); deny-mode with empty `fields` → `true`.
 *
 * @returns A single OR-merged boolean when `fields` is omitted; otherwise a
 *   field map keyed by exactly the requested fields.
 */
function mergeRolePermissions<TFieldKeys extends string>(props: {
  resolved: Array<FieldPermissionResult<TFieldKeys>>;
  fields?: TFieldKeys[];
}): boolean | ResolvedFieldPermissions {
  const collapse = (check: FieldPermissionResult<TFieldKeys>, field?: TFieldKeys): boolean => {
    if (typeof check === "boolean") {
      return check;
    }
    if (check.mode === PERMISSION_MODES.allow) {
      return field === undefined ? check.fields.length > 0 : check.fields.includes(field);
    }
    return field === undefined ? check.fields.length === 0 : !check.fields.includes(field);
  };

  if (props.fields === undefined) {
    return props.resolved.some((check) => collapse(check));
  }
  const result: ResolvedFieldPermissions = {};
  for (const field of props.fields) {
    result[field] = props.resolved.some((check) => collapse(check, field));
  }
  return result;
}

/**
 * Resolves a single action's check from a per-action map, consulting the
 * action-level wildcard when the explicit action isn't declared.
 *
 * Module-private — the wildcard precedence lives in exactly one place so
 * `hasPermission` (and any future evaluator, e.g. DB-backed roles) shares it.
 * Presence, not truthiness, decides: an explicit `false` still wins over the
 * wildcard.
 *
 * @returns The declared check for `action`, else the wildcard's check, else
 *   `undefined` (caller falls through to `defaultPermissionMode`).
 */
function resolveActionCheck(props: {
  resource: Record<string, unknown>;
  action: string;
}): PermissionCheck | undefined {
  if (props.action in props.resource) {
    return props.resource[props.action] as PermissionCheck;
  }
  if (WILDCARD_KEY in props.resource) {
    return props.resource[WILDCARD_KEY] as PermissionCheck;
  }
  return undefined;
}
