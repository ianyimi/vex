---
"@vexcms/react": patch
"@vexcms/next": patch
---

Two developer-reported `useNextAuthTransitionRefresh` (`@vexcms/next`) races fixed:

1. **Admin sidebar flash on every page load.** `AuthTransitionProvider`'s `expectedIdentity`
   (`@vexcms/react`) always starts `null`; an already-signed-in caller's own
   `authClient.useSession()` watcher resolves asynchronously a tick after mount, producing a
   `null → <id>` "bootstrap" transition on effectively every `/admin` load even though the
   SSR'd page already reflects that identity. `useNextAuthTransitionRefresh` treated this as a
   real change and called `router.refresh()`, re-suspending the sidebar's `<Suspense>`
   boundary right after first paint — the sidebar settles, then visibly re-flashes. The hook
   now exempts exactly this one bootstrap transition (the first observed, only when moving
   away from the unresolved `null` baseline) while still refreshing for every later
   transition, including a later `<id> → null` (the hook's actual purpose: another tab signing
   out, or a session dying while this tab sits idle).
2. **Sign-out: admin shell lingers, sign-in page flashes, before the real destination lands.**
   A same-tab sign-out's `beginTransition(null)` call (made synchronously, before the sign-out
   adapter's own hard navigation, which only runs after an async `signOut()` round trip)
   ALSO triggered this hook's `router.refresh()` — a soft, client-side re-render of the now
   signed-out admin route that can complete, redirect to the sign-in route via the admin's own
   guard, and paint, all before the hard navigation takes over. `AuthTransitionState.beginTransition`
   (`@vexcms/react`) gains an optional second argument, `{ skipRefresh?: boolean }`; a new
   `AuthTransitionState.consumeSkipRefresh()` lets `useNextAuthTransitionRefresh` skip its own
   refresh for a transition the caller already knows triggers its own navigation.
   `VexAdminAuthAdapterContext`'s documented `signOut` contract (`@vexcms/next`) now calls
   `beginTransition(null, { skipRefresh: true })`; `create-vexcms`'s `base-nextjs` template and
   `apps/test`/`apps/www` are updated to match.

**Breaking:** none — `options` is optional; every existing `beginTransition(identity)` call
site keeps working unchanged.
