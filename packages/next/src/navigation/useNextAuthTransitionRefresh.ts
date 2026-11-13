"use client";

import { useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthTransition } from "@vexcms/react";

/**
 * Forces the admin layout's server-resolved `authPromise` to re-resolve under
 * the CURRENT identity whenever that identity changes with no navigation of
 * its own to carry the refetch — another browser tab signing out/in, or a
 * session expiring while this tab sits idle on an already-rendered admin
 * page.
 *
 * Developer-reported bug: `NextAdminLayout`'s `authPromise` is resolved ONCE
 * per server render (`AdminLayout`'s `AuthedSidebar` calls `use()` on it
 * exactly once) and never re-evaluated on its own — a caller who signs out
 * (or whose session dies) in ANOTHER tab left this tab's sidebar showing
 * their stale, signed-in nav indefinitely; it only self-corrected the moment
 * SOME navigation happened to occur (a sidebar link click), because Next
 * re-fetches the dynamic `/admin` layout — including a brand-new
 * `authPromise` — on every navigation already. A sign-OUT from THIS tab
 * never needed this: it hard-navigates (`VexAdminAuthAdapterContext`'s own
 * `signOut`), which already gets a fully fresh server render.
 *
 * Reads `useAuthTransition()`'s `expectedIdentity` (`@vexcms/react`) — the
 * SAME reactive identity signal `usePaginatedQuery`/`useVexListQuery` already
 * key their own "is this push stale" check off, itself driven by the host
 * app's own `authClient.useSession()` watcher
 * (`useBeginAuthTransitionOnSessionChange`, mirrored per-app) — so this hook
 * needs no Better-Auth-specific (or any other auth library's) import of its
 * own; whatever reactive session source an app wires up already flows
 * through this one, framework-agnostic signal.
 *
 * `router.refresh()`, not `router.push`/a remount: it re-invokes every
 * server component down this route's tree (including `NextAdminLayout`)
 * in place, feeding `NextAdminLayoutClient` a BRAND NEW `authPromise` prop —
 * `AdminLayout`'s existing `<Suspense>` boundary re-suspends to
 * `AdminSidebarSkeleton` the instant it sees a still-pending promise, same
 * as any other streamed first paint, then resolves to `AuthedSidebar` with
 * the CURRENT identity's own permission-filtered nav (which re-persists the
 * sidebar section-count cookie for that identity via its own existing
 * effects — no separate cookie-specific handling needed here).
 *
 * Two refresh-worthy-LOOKING transitions this hook must NOT act on, both
 * developer-reported:
 *
 * 1. **The bootstrap transition.** `AuthTransitionProvider`'s
 *    `expectedIdentity` always STARTS `null` (`@vexcms/react`) — including
 *    for an already-signed-in caller, since the host app's own
 *    `authClient.useSession()` watcher resolves asynchronously, a tick or
 *    more after this hook's own first render. Every fresh `/admin` load for
 *    a signed-in caller therefore produces a `null → <their id>` transition
 *    moments after mount, even though the SSR'd page already reflects that
 *    SAME identity — there is nothing stale to refresh. Reacting to this one
 *    anyway fired `router.refresh()` on effectively every admin page load,
 *    re-suspending the sidebar's `<Suspense>` boundary each time and
 *    contributing to the "sidebar briefly settles, then visibly re-flashes"
 *    report. `isInitialBootstrap` below exempts exactly this ONE transition
 *    — the first one observed, and only when it moves away from the
 *    not-yet-resolved `null` baseline — while still refreshing for every
 *    later transition, including a LATER `<id> → null` (the hook's actual
 *    reason to exist: a real sign-out, in another tab or this one).
 * 2. **A same-tab sign-out already navigating.** `VexAdminAuthAdapterContext`'s
 *    `signOut` contract calls `beginTransition(null, { skipRefresh: true })`
 *    (`@vexcms/react`) BEFORE its own hard navigation — a `router.refresh()`
 *    fired for that SAME transition starts a soft, client-side re-render of
 *    the (now signed-out) admin route WHILE the hard navigation's own
 *    `signOut()` round trip is still in flight, which can complete, redirect
 *    to the sign-in route via the admin's own guard, and paint, all before
 *    the hard navigation finally takes over — the developer-reported
 *    "sidebar lingers, sign-in page flashes, then the real destination
 *    lands" sequence. `consumeSkipRefresh()` (`@vexcms/react`) is this
 *    hook's side of that contract: a same-tab sign-out already has its own
 *    navigation, so this hook's refresh would only ever race it, never help.
 *
 * Mount once, high in the admin tree (`NextAdminLayoutClient`) — needs an
 * `AuthTransitionProvider` ancestor (the app's own `ConvexClientProvider`
 * mounts one) to ever observe a real identity change; with none mounted,
 * `expectedIdentity` stays permanently `null` and this hook is a no-op,
 * same as every other `useAuthTransition()` caller's default-safe contract.
 */
export function useNextAuthTransitionRefresh(): void {
  const router = useRouter();
  const { expectedIdentity, consumeSkipRefresh } = useAuthTransition();
  const lastIdentityRef = useRef(expectedIdentity);
  // `false` until this hook has reacted to its first REAL transition —
  // distinguishes "the bootstrap `null → <id>` catch-up" (ONLY possible
  // while this is still `false`, see `isInitialBootstrap` below) from every
  // later transition, which always refreshes normally regardless of
  // direction (`<id> → null` and `null → <id>` alike).
  const hasObservedTransitionRef = useRef(false);
  useLayoutEffect(() => {
    if (expectedIdentity === lastIdentityRef.current) {
      return;
    }
    const isInitialBootstrap = !hasObservedTransitionRef.current && lastIdentityRef.current === null;
    lastIdentityRef.current = expectedIdentity;
    hasObservedTransitionRef.current = true;
    if (isInitialBootstrap) {
      return;
    }
    if (consumeSkipRefresh()) {
      return;
    }
    router.refresh();
  }, [expectedIdentity, router, consumeSkipRefresh]);
}
