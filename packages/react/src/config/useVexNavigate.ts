"use client";

import { useCallback, useContext } from "react";
import { UnsavedChangesGuardContext } from "../documents/useUnsavedChangesGuard";
import { useFrameworkComponents } from "./useFrameworkComponents";

/**
 * Client-side programmatic navigation (spec decision 2), for a built-in's
 * post-mutation redirect ONLY — after `vex.delete` resolves (Step 4), after
 * `vex.duplicate`'s create resolves (Step 6). Everything clickable keeps
 * using `VexLink`; a raw `next/navigation` `useRouter().push` from
 * third-party code is NOT guarded by `UnsavedChangesGuardContext` — only
 * this hook is.
 *
 * Reads `useFrameworkComponents().useNavigate` — called unconditionally,
 * like `navigationBlocker?.useBlocker` in `useUnsavedChangesGuard`, since an
 * adapter's presence doesn't change render to render — and falls back to
 * `window.location.assign` (a full page navigation) when the adapter has
 * none.
 *
 * Before navigating, consults the active `UnsavedChangesGuardContext` (the
 * nearest edit view's `useUnsavedChangesGuard()`, provided by
 * `CollectionEditView`/`GlobalEditView`): if the guard is currently
 * blocking, it opens the SAME `UnsavedChangesDialog` already mounted by
 * that guard and navigates only on Leave. A built-in that just
 * saved/deleted/duplicated calls `useReleaseUnsavedChangesGuard()()` first,
 * so no prompt appears for ITS OWN navigation.
 *
 * @returns A stable `(href: string) => void`. Call it with an internal
 *   admin route, e.g. `/admin/posts`.
 */
export function useVexNavigate(): (href: string) => void {
  const components = useFrameworkComponents();
  const navigateFromAdapter = components.useNavigate?.();
  const guard = useContext(UnsavedChangesGuardContext);

  const navigate = useCallback(
    (href: string) => {
      (navigateFromAdapter ?? ((target: string) => window.location.assign(target)))(href);
    },
    [navigateFromAdapter],
  );

  return useCallback(
    (href: string) => {
      if (guard) {
        guard.attemptNavigation(() => navigate(href));
      } else {
        navigate(href);
      }
    },
    [guard, navigate],
  );
}
