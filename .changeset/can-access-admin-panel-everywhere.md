---
"@vexcms/react": patch
"create-vexcms": patch
---

`useCanAccessAdminPanel()` now works on public pages, not just inside `/admin`.

**Root cause.** The hook read `VexAuthContext`, seeded only by `VexAuthProvider` in the
admin server layout — on a site header (every public route) no provider was mounted, so
the hook silently returned `false` for every visitor, including a real signed-in admin.
`create-vexcms`'s `marketing-site` template hit this directly: its seeded header called the
hook to gate an "Admin" link, and the link could never render for anyone.

**Fix.** The hook now resolves the caller from either of two sources, picked by whether a
`VexAuthProvider` ancestor exists:

- **Inside `/admin`** — unchanged: the server-resolved `{ user, organization }`
  `VexAuthProvider` seeds, synchronous, `isPending` always `false`.
- **Outside `/admin`** — new `VexSessionAdapterProvider`/`VexSessionAdapter`, a thin bridge
  around the host app's own reactive client session (Better Auth's
  `authClient.useSession()`, typically), mounted once at the app root beside the existing
  root `VexConfigProvider` (which already carries `access` to every route per P-004).

**Breaking:** the hook now returns `{ canAccess: boolean; isPending: boolean }` instead of a
plain `boolean` — a public-page caller resolves asynchronously, so a header has to decide
what to render *before* the session settles. Reserve the link's own fixed-size slot
invisibly (`aria-hidden`, same classes, no text) while `isPending`, instead of omitting it,
so the link never pops in after the rest of the header has already painted (zero layout
shift) — the same "always occupy the slot" treatment `SessionButton`-style sign-in/out
controls already use. Both branches still fail closed: no access config, no adapter
mounted, a resolved signed-out caller, or a resolved role lacking `adminPanel.access` all
answer `{ canAccess: false, isPending: false }`.

`apps/test`, `apps/www`, and both `create-vexcms` templates (`base-nextjs`,
`marketing-site`) now mount `VexSessionAdapterProvider` at the app root. The
`marketing-site` template's seeded header updates to the new tri-state return and the
zero-layout-shift placeholder.
