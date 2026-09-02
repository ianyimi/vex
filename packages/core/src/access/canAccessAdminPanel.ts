import { ADMIN_CUSTOM_SUBJECTS, PERMISSION_SCOPES } from "./constants";
import { hasPermission } from "./hasPermission";
import type { VexAccessConfig } from "./types";

/**
 * Props for {@link canAccessAdminPanel}.
 */
export interface CanAccessAdminPanelProps {
  /**
   * The resolved config from `defineAccess()`. `undefined` means RBAC is not
   * configured, which grants access — the same escape hatch `hasPermission`
   * uses, so a project without an access matrix keeps working.
   */
  access?: VexAccessConfig;
  /**
   * The authenticated caller. `null`/`{}` (unauthenticated) resolves to an empty
   * role list and therefore denies.
   */
  user: Record<string, unknown> | null;
  /** The caller's active organization, forwarded to permission callbacks. */
  organization?: Record<string, unknown>;
}

/**
 * Answers whether a caller may open the admin panel at all — the
 * `adminPanel.access` gate.
 *
 * This is the coarse entry check. It is deliberately separate from the
 * per-collection checks: a caller who fails this should never reach the panel,
 * whereas a caller who passes it may still be denied individual collections.
 *
 * Call it in the host app's admin route (a server component, layout, or
 * middleware) and redirect on `false`. It never throws: the `adminPanel.access`
 * subject carries no document, so it is evaluated with
 * `scope: "any"` — a permission callback that only reads `user`/`organization`
 * resolves normally, and one that reaches for a document resolves to `true`
 * rather than throwing, since "can this caller use the panel" is inherently a
 * subject-level question.
 *
 * Prefer this over hand-writing `hasPermission({ resource: "adminPanel", … })`
 * so the subject key and action are never spelled by hand.
 *
 * @param props - The access config plus the resolved caller.
 * @returns `true` when the caller may open the admin panel; `false` to deny.
 *   Also `true` when `access` is `undefined` (RBAC not configured).
 * @example
 * ```tsx
 * // app/admin/[[...path]]/page.tsx
 * const auth = await fetchAuthQuery(api.auth.api.getUserOrg, {});
 * if (!canAccessAdminPanel({ access, user: auth.user, organization: auth.organization })) {
 *   redirect("/unauthorized");
 * }
 * ```
 * @see {@link hasPermission} for the general check this delegates to
 */
export function canAccessAdminPanel(props: CanAccessAdminPanelProps): boolean {
  return hasPermission({
    access: props.access,
    user: props.user,
    organization: props.organization,
    resource: ADMIN_CUSTOM_SUBJECTS.adminPanel.key,
    action: ADMIN_CUSTOM_SUBJECTS.adminPanel.actions[0],
    scope: PERMISSION_SCOPES.any,
  });
}
