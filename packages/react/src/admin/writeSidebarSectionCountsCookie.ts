"use client";

import { applySidebarSectionCountsUpdate, type SidebarSection } from "@vexcms/core";
import { writeAdminCookie } from "../adminCookie";

/**
 * Writes one sidebar section's settled item count cookie client-side —
 * `AppSidebar` (`AdminSidebar.tsx`) calls this once per section whenever its
 * own permission-filtered array settles to a new length, so the NEXT server
 * render's `<Suspense>` fallback (`AdminSidebarSkeleton`, read via
 * `parseSidebarSectionCountsCookie`) shows the SAME per-section header/row
 * count instead of the config's declared (unfiltered) count or a stale one.
 *
 * Merges into the EXISTING map (every other section's own last-settled
 * count — {@link applySidebarSectionCountsUpdate}) rather than overwriting
 * it, via {@link writeAdminCookie}'s functional-patch form so the merge
 * reads the SAME fresh `current` the write itself commits on top of (no
 * separate, earlier read that could observe a different cookie state).
 *
 * @param props.basePath - The project's `config.basePath` — the cookie's `Path` attribute.
 * @param props.section - The section whose item count just settled.
 * @param props.count - The settled item count, including `0`.
 */
export function writeSidebarSectionCountsCookie(props: {
  basePath: string;
  section: SidebarSection;
  count: number;
}): void {
  writeAdminCookie({
    basePath: props.basePath,
    patch: (current) => ({
      sidebarCounts: applySidebarSectionCountsUpdate({
        counts: current.sidebarCounts ?? {},
        section: props.section,
        count: props.count,
      }),
    }),
  });
}
