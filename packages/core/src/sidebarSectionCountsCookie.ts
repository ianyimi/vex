import { parseAdminCookie } from "./adminCookie";

/**
 * One of the admin sidebar's three fixed nav sections (`AppSidebar`,
 * `@vexcms/react`) — never a dynamic/unbounded set of keys, unlike
 * {@link ListViewSkeletonRowCountMap}'s per-view id map.
 */
export type SidebarSection = "collections" | "globals" | "media";

/**
 * The admin sidebar's last-settled item count per section — the `<Suspense>`
 * fallback (`AdminSidebarSkeleton`, `@vexcms/react`'s `AdminLayout`) reads
 * this server-side so it can render each section's header AND exactly as
 * many skeleton rows as that section is about to settle with, instead of
 * one fixed generic row count that pops into a different shape (headers
 * appearing, far more/fewer rows) once the real, permission-filtered nav
 * items arrive — the same "skeleton reproduces the settled shape" contract
 * {@link ListViewSkeletonRowCountMap} already established for a list view's
 * own `<Suspense>` fallback.
 *
 * A section is only written once its OWN real item count is known (never a
 * partial/intermediate value) — `0` is a valid, explicitly-remembered
 * count: that section's header stays hidden on the NEXT first paint too,
 * the same way `AppSidebar` already hides it today once `auth` resolves,
 * until the caller regains access to at least one item in it.
 */
export type SidebarSectionCounts = Partial<Record<SidebarSection, number>>;

/**
 * Parses the `sidebarCounts` field off the consolidated `vex-admin`
 * cookie's value. Tolerant of a missing, malformed, or stale-shaped
 * cookie, the same contract {@link parseAdminCookie} itself already
 * establishes — degrades to `{}` (every section falls back to the
 * config's own declared item count, `AdminSidebarSkeleton`'s job, not
 * this function's) rather than throwing.
 *
 * @param props.cookieValue - The raw `vex-admin` cookie value, or `undefined` when unset.
 * @returns The parsed per-section count map, with any unknown/malformed section dropped.
 */
export function parseSidebarSectionCountsCookie(props: { cookieValue: string | undefined }): SidebarSectionCounts {
  return parseAdminCookie({ cookieValue: props.cookieValue }).sidebarCounts ?? {};
}

/**
 * Updates `counts` with `section`'s new settled item count. Unlike
 * {@link applyListViewSkeletonRowCountUpdate}, there is no LRU cap here —
 * `"collections"`/`"globals"`/`"media"` are the sidebar's own fixed,
 * never-growing set of keys (no per-view-id-style unbounded growth to cap
 * in the first place), so this is a plain merge.
 *
 * @param props.counts - The current map (from {@link parseSidebarSectionCountsCookie}).
 * @param props.section - The section whose item count just settled.
 * @param props.count - The settled item count, including `0`.
 * @returns The updated map — a new object, `counts` is never mutated.
 */
export function applySidebarSectionCountsUpdate(props: {
  counts: SidebarSectionCounts;
  section: SidebarSection;
  count: number;
}): SidebarSectionCounts {
  return { ...props.counts, [props.section]: props.count };
}
