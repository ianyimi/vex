---
"@vexcms/core": minor
"@vexcms/react": patch
"@vexcms/next": patch
---

Admin sign-out now lands immediately on a configurable destination instead of lingering on
the signed-out admin shell for seconds. `defineConfig()` gains a client-safe `auth.signOut.redirectTo`
option (default `"/"`) alongside the existing server-only `auth.adapter` — both resolve onto
the SAME `config.auth` group, merged by `defineServerConfig()` rather than replaced, so
`config.auth` is now always present (check `config.auth.adapter` to test whether an adapter
was registered, not `config.auth` itself).

`FrameworkAuthAdapter.signOut`'s contract changes: it must now sign out, then hard-navigate
(a full document load, never `router.push`/`router.refresh`/any client-side transition) to the
resolved `config.auth.signOut.redirectTo` once the session cookie clears. The admin shell must
never re-render in a signed-out state — a client-side refresh previously kept the sidebar/top
bar mounted while queries re-ran anonymously and the route guard redirected underneath it,
producing a multi-second "sidebar lingers, then a sign-in flash" sequence. `apps/test`,
`apps/www`, and the `base-nextjs` template's `BetterAuthClientProvider.signOut` all switch to
`window.location.href = config.auth.signOut.redirectTo`.

The same client/server navigation race affected sign-IN: the templates' shared
`AuthViewProvider` previously passed `router.push`/`router.replace` as `@daveyplate/better-auth-ui`'s
`navigate`/`replace`, with `onSessionChange: () => router.refresh()`. Because `router.refresh()`
returns no real promise, the library's `navigate(redirectTo)` call fired immediately after,
while the refresh's own RSC re-fetch for the pre-navigation route was still in flight — when
that refresh resolved after the push had already started (worse under a slow first compile),
Next's router could reconcile the stale pre-navigation tree over the pushed route: credentials
accepted, nothing visibly happened, yet the session was real (confirmed on back/forward).
`AuthViewProvider` now passes hard-navigating `navigate`/`replace` (`window.location.href`/`.replace`)
and drops `onSessionChange` entirely — there is no client-side router state left to race.
