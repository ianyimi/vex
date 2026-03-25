import type { VexAccessConfig } from "./types";

/**
 * Check whether a user has access to the admin panel.
 *
 * Evaluates the `admin` permission on each of the user's roles.
 * If any role has `admin: true` (or a callback that returns true),
 * the user is granted access. Returns false if no role grants access
 * or if the access config is not defined.
 *
 * @param props.access - The VexAccessConfig from defineAccess
 * @param props.user - The user object (passed to dynamic permission callbacks)
 * @param props.userRoles - The user's role(s) as a string array
 * @param props.organization - Optional organization object (passed to callbacks if org support is configured)
 * @returns Whether the user can access the admin panel
 */
export function checkAdminAccess(props: {
  access: VexAccessConfig | undefined;
  user: Record<string, any>;
  userRoles: string[];
  organization?: Record<string, any>;
}): boolean {
  // No access config — deny by default (admin should be explicitly granted)
  if (props.access === undefined) {
    return false;
  }

  // No roles — deny
  if (props.userRoles.length === 0) {
    return false;
  }

  const knownRolesSet = new Set(props.access.roles);

  for (const role of props.userRoles) {
    if (!knownRolesSet.has(role)) continue;

    const rolePerms = props.access.permissions[role];
    if (rolePerms === undefined) continue;

    const adminPerm = (rolePerms as Record<string, unknown>).admin;

    // Not specified — defaults to false
    if (adminPerm === undefined) continue;

    // Static boolean
    if (typeof adminPerm === "boolean") {
      if (adminPerm) return true;
      continue;
    }

    // Dynamic callback
    if (typeof adminPerm === "function") {
      const callbackProps: any = props.organization !== undefined
        ? { user: props.user, organization: props.organization }
        : { user: props.user };
      if (adminPerm(callbackProps)) return true;
    }
  }

  return false;
}
