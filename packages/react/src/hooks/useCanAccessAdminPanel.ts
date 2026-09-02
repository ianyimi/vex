"use client";

import { canAccessAdminPanel } from "@vexcms/core";

import { useVexAccess } from "../context/VexAccessContext";
import { useVexAuth } from "../context/VexAuthContext";

/**
 * Whether the signed-in user may reach the admin panel.
 *
 * Evaluates the *same* predicate the server route uses
 * (`canAccessAdminPanel`), so an "Admin" affordance in site chrome cannot
 * disagree with what happens on navigation — the alternative, reading a role
 * off the session by hand, silently breaks whenever `access.userRolesField`
 * is anything other than what the caller guessed.
 *
 * Advisory only, like `usePermission`: the server route still redirects an
 * unauthorized caller. This exists so the UI does not offer a link that leads
 * to `/unauthorized`.
 *
 * @returns `true` when the current user passes the admin-panel check;
 *   `false` when signed out, when no access config is in context, or when
 *   denied.
 */
export function useCanAccessAdminPanel(): boolean {
  const access = useVexAccess();
  const { organization, user } = useVexAuth();

  // Fail closed on missing context, which `hasPermission` alone does not do:
  // it returns `true` when no access config is supplied, because server-side
  // that legitimately means "RBAC is not configured for this project".
  //
  // In the client the same absence means something else entirely — no
  // `VexAccessProvider` is mounted on this route, which is the normal state of
  // every public page. Deferring to `hasPermission` there renders an "Admin"
  // link for anonymous visitors. Absence of information is not permission.
  if (!access || !user) return false;

  return canAccessAdminPanel({ access, organization, user });
}
