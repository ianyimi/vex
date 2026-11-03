"use client";

import { isViewOrganizationScopingEnabled, resolveViewOrganizationId } from "@vexcms/core";
import { useVexAccess } from "../../../config/VexConfigContext";
import { useVexAuth } from "../../../auth/VexAuthContext";

/**
 * Whether the current caller may use shared (`vex_views`) saved views at
 * all — `true` unless organization scoping (`config.access.organizations`,
 * NOT `orgCollectionSlug` alone — developer-approved binding correction)
 * is enabled AND the caller's own resolved organization doesn't exist.
 * Under scoping, an org-less caller can never create, read, update, or
 * delete a shared view server-side (`listViews`/`saveView`/`removeView`/
 * `loadSharedSavedListViewWheres`) — this hook lets the UI hide the shared-view
 * affordances entirely for them, rather than show one that will always
 * fail.
 *
 * Calls `isViewOrganizationScopingEnabled`/`resolveViewOrganizationId`
 * (`@vexcms/core`) — the EXACT same shared predicate every server
 * `vex_views` read/write calls, so client and server can never
 * independently drift on whether scoping is active or whose organization
 * a caller belongs to.
 *
 * Reads `useVexAccess()`/`useVexAuth()` — the SAME two context values
 * `usePermission` itself reads, both seeded server-side by the admin
 * layout's `VexConfigProvider`/`VexAuthProvider` with no extra client
 * fetch. That makes this correct on the very first render, server and
 * client alike — no flash of the shared option before it's hidden, unlike
 * a value that only resolves after a client-side effect/query.
 *
 * Deliberately does NOT fold into `canCreateViews`/`canUpdateViews`/
 * `canDeleteViews` (RBAC-only, unchanged): those stay purely
 * permission-based so a caller lacking a role still sees (disabled, not
 * hidden) what they could do if granted it — a different, pre-existing UX
 * than "this is structurally unavailable regardless of role."
 *
 * @returns `true` when shared views are usable (scoping is off, or the
 *   caller's own organization resolves); `false` otherwise.
 */
export function useCanAccessSharedSavedListViews(): boolean {
  const access = useVexAccess();
  const { organization } = useVexAuth();
  if (!isViewOrganizationScopingEnabled(access)) return true;
  return resolveViewOrganizationId({ access, organization }) !== undefined;
}
