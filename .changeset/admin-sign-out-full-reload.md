---
"@vexcms/react": patch
"@vexcms/next": patch
"create-vexcms": patch
---

Admin sign-out now full-reloads the current page (`window.location.reload()`) instead of
hard-navigating to `config.auth.signOut.redirectTo`. The reload re-requests the exact URL
the caller was on, so the app's own server-side access guards decide what it shows signed
out — the same page if it's readable by `anonRole` (a public, read-only admin page), a
redirect to sign-in, or `/unauthorized`, same as any other fresh request to that URL. This
replaces the previous fixed-destination hard navigation, which always sent a signed-out
admin visitor to `redirectTo` even when the page they signed out from was itself readable
by `anonRole` — losing their place in the panel for no reason.

`FrameworkAuthAdapter.signOut`'s contract changes accordingly: it must sign out, then
full-reload the current document, never `router.push`/`router.refresh`/a navigation to a
different destination. `apps/test`, `apps/www`, and the `base-nextjs` template's
`BetterAuthClientProvider.signOut` all switch from
`window.location.href = config.auth.signOut.redirectTo` to `window.location.reload()`, and
no longer import `~/vex.config` for this.

`config.auth.signOut.redirectTo` itself is unchanged in `@vexcms/core` — it is no longer
read by any of the reference `signOut` wrappers this change ships, but the option remains
available on `defineConfig()` for a project that wants to resolve its own custom
destination inside a hand-written `signOut`.
