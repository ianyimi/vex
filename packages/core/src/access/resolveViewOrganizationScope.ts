import type { VexAccessConfig } from "./types";

/**
 * Whether saved (`vex_views`) shared views are scoped to the caller's own
 * organization at ALL — `access?.organizations === true` is the SOLE
 * trigger. `orgCollectionSlug`
 * alone does NOT turn this on: it only says WHERE organization data lives,
 * so a project's own permission callbacks can read `organization` — a
 * project that declares `orgCollectionSlug` for that reason alone, with no
 * intent to scope views by it, must NOT have every shared view and "Save
 * as shared" silently vanish for every caller the moment it sets the slug.
 *
 * The ONE place this decision is made — `listViews`/`loadSharedSavedListViewWheres`/
 * `saveView`/`removeView` (server, `@vexcms/core/server`) and
 * `useCanAccessSharedSavedListViews` (client, `@vexcms/react`) all call this
 * directly (or through {@link resolveViewOrganizationId}), so none of them
 * can independently drift on whether scoping is active.
 *
 * @param access - `config.access` (server) or `useVexAccess()` (client) — `undefined` when RBAC isn't configured at all.
 * @returns `true` only when `access.organizations` is explicitly `true`.
 */
export function isViewOrganizationScopingEnabled(access: VexAccessConfig | undefined): boolean {
  return access?.organizations === true;
}

/**
 * Resolves the caller's own organization id for view scoping — `undefined`
 * both when scoping is off ({@link isViewOrganizationScopingEnabled} is
 * `false`) and when it's on but the caller's own organization doesn't
 * resolve. Callers that need to tell those two cases apart (e.g. to
 * short-circuit to `[]` only in the second) should call
 * {@link isViewOrganizationScopingEnabled} separately first — this
 * function alone cannot distinguish them, by design: from "what id do I
 * scope reads/writes by", they're the same answer (none).
 *
 * @param props.access - `config.access` (server) or `useVexAccess()` (client).
 * @param props.organization - `auth.organization` (server) or `useVexAuth().organization` (client) — the
 *   server-resolved caller identity's own organization record, never a client-supplied id.
 * @returns The caller's own organization id, or `undefined`.
 */
export function resolveViewOrganizationId(props: {
  access: VexAccessConfig | undefined;
  organization: unknown;
}): string | undefined {
  if (!isViewOrganizationScopingEnabled(props.access)) return undefined;
  return (props.organization as { _id?: string } | undefined)?._id;
}
