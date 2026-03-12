import type { AccessAction, VexAccessConfig, PermissionCheck, FieldPermissionResult } from "./types";
import { VexAccessError } from "../errors";

/**
 * The result of resolving field permissions for a resource action.
 * Maps each field key to whether the action is allowed on that field.
 */
export type ResolvedFieldPermissions = Record<string, boolean>;

/**
 * Resolve a permission check value (boolean, mode object, or function)
 * into a result for the requested fields.
 *
 * When `fields` is provided, returns a `Record<field, boolean>` for those fields.
 * When `fields` is omitted, returns a single `boolean` for overall action access.
 *
 * @param props.check - The permission check value to resolve
 * @param props.fields - Specific fields to check. When omitted, returns overall boolean.
 * @param props.data - The document data (for dynamic checks)
 * @param props.user - The user object (for dynamic checks)
 * @param props.organization - Optional organization object (for dynamic checks)
 * @returns Field permission map when fields provided, boolean when omitted
 */
export function resolvePermissionCheck(props: {
  check: PermissionCheck<string, any, any, any> | undefined;
  fields?: string[];
  data: Record<string, any>;
  user: Record<string, any>;
  organization?: Record<string, any>;
}): ResolvedFieldPermissions | boolean {
  // Permissive default for missing actions
  if (props.check === undefined) {
    if (props.fields === undefined) return true;
    return Object.fromEntries(props.fields.map((k) => [k, true]));
  }

  // Resolve function checks
  let resolved: FieldPermissionResult<string>;
  if (typeof props.check === "function") {
    const callbackProps: any = props.organization !== undefined
      ? { data: props.data, user: props.user, organization: props.organization }
      : { data: props.data, user: props.user };
    resolved = props.check(callbackProps);
  } else {
    resolved = props.check;
  }

  // Handle undefined function return as deny-all
  if (resolved === undefined) {
    if (props.fields === undefined) return false;
    return Object.fromEntries(props.fields.map((k) => [k, false]));
  }

  // Boolean result
  if (typeof resolved === "boolean") {
    if (props.fields === undefined) return resolved;
    return Object.fromEntries(props.fields.map((k) => [k, resolved as boolean]));
  }

  // Mode object result — need fields to check against
  if (props.fields === undefined) {
    // No specific fields requested — for mode objects, we can't give a single boolean
    // without knowing what fields exist. Default to true (allow mode with fields means
    // "some fields allowed", deny mode with fields means "some fields denied").
    // Callers wanting field-level granularity must pass fields.
    if (resolved.mode === "allow") return resolved.fields.length > 0;
    if (resolved.mode === "deny") return resolved.fields.length === 0;
    return true;
  }

  if (resolved.mode === "allow") {
    const allowSet = new Set(resolved.fields);
    return Object.fromEntries(
      props.fields.map((k) => [k, allowSet.has(k)]),
    );
  }

  // mode === "deny"
  const denySet = new Set(resolved.fields);
  return Object.fromEntries(
    props.fields.map((k) => [k, !denySet.has(k)]),
  );
}

/**
 * Merge field permission maps from multiple roles using OR logic.
 * If any role grants access to a field, that field is allowed.
 * Allow always wins over deny in cross-role merges.
 *
 * When all entries are booleans (no fields mode), merges with OR logic on booleans.
 *
 * @param props.results - Array of resolved permission results (one per role)
 * @param props.fields - The specific fields being checked (when field-level)
 * @returns Merged result: Record<string, boolean> when fields provided, boolean otherwise
 */
export function mergeRolePermissions(props: {
  results: (ResolvedFieldPermissions | boolean)[];
  fields?: string[];
}): ResolvedFieldPermissions | boolean {
  if (props.results.length === 0) {
    if (props.fields === undefined) return true;
    return Object.fromEntries(props.fields.map((k) => [k, true]));
  }

  // No fields — merge booleans with OR
  if (props.fields === undefined) {
    return props.results.some((r) => r === true);
  }

  // With fields — merge field maps with OR
  return Object.fromEntries(
    props.fields.map((k) => [
      k,
      props.results.some((r) =>
        typeof r === "boolean" ? r : (r[k] === true),
      ),
    ]),
  );
}

/**
 * Check permissions for a user on a resource action.
 *
 * Without `fields` param → returns `boolean` (overall action access)
 * With `fields` param → returns `Record<string, boolean>` for those specific fields
 *
 * @param props.access - The VexAccessConfig from defineAccess
 * @param props.user - The user object
 * @param props.userRoles - The user's role(s) as a string array
 * @param props.resource - The resource slug (collection or global slug)
 * @param props.action - The CRUD action to check
 * @param props.data - Document data for dynamic permission checks. Defaults to `{}`.
 * @param props.organization - Optional organization object for org-aware permission checks.
 * @param props.fields - Specific fields to check. When provided, returns Record<string, boolean>.
 * @param props.throwOnDenied - When true, throws VexAccessError instead of returning false. Default: false.
 * @returns `boolean` when fields is omitted, `Record<string, boolean>` when fields is provided
 * @throws {VexAccessError} When `throwOnDenied` is true and access is denied
 */
export function hasPermission(props: {
  access: VexAccessConfig | undefined;
  user: Record<string, any>;
  userRoles: string[];
  resource: string;
  action: AccessAction;
  data?: Record<string, any>;
  organization?: Record<string, any>;
  fields?: string[];
  throwOnDenied?: boolean;
}): ResolvedFieldPermissions | boolean {
  // Permissive default when no access config
  if (props.access === undefined) {
    if (props.fields === undefined) return true;
    return Object.fromEntries(props.fields.map((k) => [k, true]));
  }

  // Deny all when no roles
  if (props.userRoles.length === 0) {
    if (props.throwOnDenied) {
      throw new VexAccessError(props.resource, props.action);
    }
    if (props.fields === undefined) return false;
    return Object.fromEntries(props.fields.map((k) => [k, false]));
  }

  // Filter to only known roles
  const knownRolesSet = new Set(props.access.roles);
  const knownRoles = props.userRoles.filter((r) => knownRolesSet.has(r));

  // All roles unknown → deny all
  if (knownRoles.length === 0) {
    if (props.throwOnDenied) {
      throw new VexAccessError(props.resource, props.action);
    }
    if (props.fields === undefined) return false;
    return Object.fromEntries(props.fields.map((k) => [k, false]));
  }

  // Resolve permissions for each known role
  const results: (ResolvedFieldPermissions | boolean)[] = [];
  const data = props.data ?? {};

  for (const role of knownRoles) {
    const rolePerms = props.access.permissions[role];
    if (rolePerms === undefined) {
      // Role has no permissions object → skip (contributes nothing)
      continue;
    }

    const resourcePerms = rolePerms[props.resource];
    if (resourcePerms === undefined) {
      // Role has no entry for this resource → permissive default
      results.push(true);
      continue;
    }

    // Boolean shorthand at resource level: true = all actions allowed, false = all denied
    if (typeof resourcePerms === "boolean") {
      results.push(resourcePerms);
      continue;
    }

    const actionCheck = resourcePerms[props.action];
    results.push(
      resolvePermissionCheck({
        check: actionCheck,
        fields: props.fields,
        data,
        user: props.user,
        organization: props.organization,
      }),
    );
  }

  // Merge all role results with OR logic
  const merged = mergeRolePermissions({
    results,
    fields: props.fields,
  });

  // Handle throwOnDenied
  if (props.throwOnDenied) {
    if (typeof merged === "boolean") {
      if (!merged) {
        throw new VexAccessError(props.resource, props.action);
      }
    } else {
      const deniedField = Object.entries(merged).find(([, v]) => v === false);
      if (deniedField) {
        throw new VexAccessError(props.resource, props.action, deniedField[0]);
      }
    }
  }

  return merged;
}
