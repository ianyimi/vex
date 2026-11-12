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
 * Skips the very first render (a mount is not an identity CHANGE) via a ref
 * seeded with the current identity, the same "only react to a transition"
 * pattern `useBeginAuthTransitionOnSessionChange` itself already uses.
 *
 * Mount once, high in the admin tree (`NextAdminLayoutClient`) — needs an
 * `AuthTransitionProvider` ancestor (the app's own `ConvexClientProvider`
 * mounts one) to ever observe a real identity change; with none mounted,
 * `expectedIdentity` stays permanently `null` and this hook is a no-op,
 * same as every other `useAuthTransition()` caller's default-safe contract.
 */
export function useNextAuthTransitionRefresh(): void {
  const router = useRouter();
  const { expectedIdentity } = useAuthTransition();
  const lastIdentityRef = useRef(expectedIdentity);
  useLayoutEffect(() => {
    if (expectedIdentity !== lastIdentityRef.current) {
      lastIdentityRef.current = expectedIdentity;
      router.refresh();
    }
  }, [expectedIdentity, router]);
}
