import type { AccessAction, VexAccessConfig, PermissionCheck, FieldPermissionResult } from "./types";
import { VexAccessError } from "../errors";

/**
 * The result of resolving field permissions for a resource action.
 * Maps each field key to whether the action is allowed on that field.
 */
export type ResolvedFieldPermissions = Record<string, boolean>;

/**
 * Resolve a permission check value (boolean, mode object, or function)
 * into a full `Record<fieldKey, boolean>` for a given resource.
 *
 * @param props.check - The permission check value to resolve
 * @param props.fieldKeys - All field keys for this resource
 * @param props.data - The document data (for dynamic checks)
 * @param props.user - The user object (for dynamic checks)
 * @param props.organization - Optional organization object (for dynamic checks)
 * @returns Full field permission map where every field has an explicit boolean
 */
export function resolvePermissionCheck(props: {
  check: PermissionCheck<string, any, any, any> | undefined;
  fieldKeys: string[];
  data: Record<string, any>;
  user: Record<string, any>;
  organization?: Record<string, any>;
}): ResolvedFieldPermissions {
  // Permissive default for missing actions
  if (props.check === undefined) {
    return Object.fromEntries(props.fieldKeys.map((k) => [k, true]));
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
    return Object.fromEntries(props.fieldKeys.map((k) => [k, false]));
  }

  // Boolean result
  if (typeof resolved === "boolean") {
    return Object.fromEntries(props.fieldKeys.map((k) => [k, resolved as boolean]));
  }

  // Mode object result
  if (resolved.mode === "allow") {
    return Object.fromEntries(
      props.fieldKeys.map((k) => [k, resolved.fields.includes(k)]),
    );
  }

  // mode === "deny"
  return Object.fromEntries(
    props.fieldKeys.map((k) => [k, !resolved.fields.includes(k)]),
  );
}

/**
 * Merge field permission maps from multiple roles using OR logic.
 * If any role grants access to a field, that field is allowed.
 * Allow always wins over deny in cross-role merges.
 *
 * @param props.permissionMaps - Array of resolved field permission maps (one per role)
 * @param props.fieldKeys - All field keys for this resource
 * @returns Merged field permission map
 */
export function mergeRolePermissions(props: {
  permissionMaps: ResolvedFieldPermissions[];
  fieldKeys: string[];
}): ResolvedFieldPermissions {
  if (props.permissionMaps.length === 0) {
    return Object.fromEntries(props.fieldKeys.map((k) => [k, true]));
  }

  return Object.fromEntries(
    props.fieldKeys.map((k) => [
      k,
      props.permissionMaps.some((map) => map[k] === true),
    ]),
  );
}

/**
 * Check permissions for a user on a resource action.
 *
 * Without `field` param → returns `Record<fieldKey, boolean>` (full field map)
 * With `field` param → returns `boolean` for that specific field
 *
 * @param props.access - The VexAccessConfig from defineAccess
 * @param props.user - The user object
 * @param props.userRoles - The user's role(s) as a string array
 * @param props.resource - The resource slug (collection or global slug)
 * @param props.action - The CRUD action to check
 * @param props.fieldKeys - All field keys for this resource (required for resolution)
 * @param props.data - Document data for dynamic permission checks. Defaults to `{}`.
 * @param props.organization - Optional organization object for org-aware permission checks.
 * @param props.field - Optional specific field to check. When provided, returns boolean instead of Record.
 * @param props.throwOnDenied - When true, throws VexAccessError instead of returning false/all-false. Default: false.
 * @returns `Record<string, boolean>` when field is omitted, `boolean` when field is provided
 * @throws {VexAccessError} When `throwOnDenied` is true and access is denied
 */
export function hasPermission(props: {
  access: VexAccessConfig | undefined;
  user: Record<string, any>;
  userRoles: string[];
  resource: string;
  action: AccessAction;
  fieldKeys: string[];
  data?: Record<string, any>;
  organization?: Record<string, any>;
  field?: string;
  throwOnDenied?: boolean;
}): ResolvedFieldPermissions | boolean {
  // Permissive default when no access config
  if (props.access === undefined) {
    if (props.field !== undefined) return true;
    return Object.fromEntries(props.fieldKeys.map((k) => [k, true]));
  }

  // Deny all when no roles
  if (props.userRoles.length === 0) {
    if (props.throwOnDenied) {
      throw new VexAccessError(props.resource, props.action, props.field);
    }
    if (props.field !== undefined) return false;
    return Object.fromEntries(props.fieldKeys.map((k) => [k, false]));
  }

  // Filter to only known roles
  const knownRolesSet = new Set(props.access.roles);
  const knownRoles = props.userRoles.filter((r) => knownRolesSet.has(r));

  // All roles unknown → deny all
  if (knownRoles.length === 0) {
    if (props.throwOnDenied) {
      throw new VexAccessError(props.resource, props.action, props.field);
    }
    if (props.field !== undefined) return false;
    return Object.fromEntries(props.fieldKeys.map((k) => [k, false]));
  }

  // Resolve permission maps for each known role
  const permissionMaps: ResolvedFieldPermissions[] = [];
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
      permissionMaps.push(
        Object.fromEntries(props.fieldKeys.map((k) => [k, true])),
      );
      continue;
    }

    // Boolean shorthand at resource level: true = all actions allowed, false = all denied
    if (typeof resourcePerms === "boolean") {
      permissionMaps.push(
        Object.fromEntries(props.fieldKeys.map((k) => [k, resourcePerms])),
      );
      continue;
    }

    const actionCheck = resourcePerms[props.action];
    permissionMaps.push(
      resolvePermissionCheck({
        check: actionCheck,
        fieldKeys: props.fieldKeys,
        data,
        user: props.user,
        organization: props.organization,
      }),
    );
  }

  // Merge all role maps with OR logic
  const merged = mergeRolePermissions({
    permissionMaps,
    fieldKeys: props.fieldKeys,
  });

  // Single field check
  if (props.field !== undefined) {
    const result = merged[props.field] ?? false;
    if (props.throwOnDenied && !result) {
      throw new VexAccessError(props.resource, props.action, props.field);
    }
    return result;
  }

  // Full field map — throw if any field is denied
  if (props.throwOnDenied && Object.values(merged).some((v) => v === false)) {
    throw new VexAccessError(props.resource, props.action);
  }

  return merged;
}
