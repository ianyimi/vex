---
"@vexcms/core": minor
"@vexcms/next": minor
"create-vexcms": patch
---

Fixes a live-preview bug where signing out — in the pop-out preview tab, or in any tab
while a preview was open elsewhere — left the `__prerender_bypass` (Next Draft Mode)
and `vex-live-preview` marker cookies set. A public page's `getBySlugPreview` query,
now running for an anonymous caller, used to come back `[]` under those stale cookies,
so the page rendered its "not found"/welcome fallback instead of the published content.

**`getBySlugPreview` no longer denies the published row.** Every project's
`convex/pages.ts` and `convex/posts.ts` (apps, and the `create-vexcms` templates) passed
`drafts: true` alongside an explicit `access: { action: DRAFT_ACTIONS.readDrafts }` —
that override made `find`'s own published-row fallback run under the `readDrafts`
action too, so a caller without that permission (anonymous included) was denied the
query outright instead of falling back to the published row. Dropping the override
restores `find`'s normal per-caller behavior: a session with `readDrafts` still gets the
draft-merged row; everyone else gets the published row, or `[]` if none exists — never
draft content either way.

**New `@vexcms/next/livePreview/client` export: `disableLivePreview(path?)`.** Call it from
every sign-out entry point, alongside the existing identity-transition hook and before
the hard navigation/refresh that follows. It issues a same-origin, credentialed,
non-following `GET <path>?disable=1` (default path `/api/vex/live-preview`) against the
project's Draft Mode route, clearing both cookies. Fire-and-forget and never throws, so
a failed request can never block sign-out. `apps/www`, `apps/test`, and both
`create-vexcms` templates' sign-out wrappers (`BetterAuthClientProvider`'s `signOut`,
and `SessionButton`) now call it.

**New setting: `admin.livePreview.expiredSessions: "allow" | "deny"`** (default
`"allow"`, matching today's behavior). Setting it to `"deny"` closes the remaining gap
for a preview left open in an unrelated tab: every `proxy.ts` now checks the session
once on any request carrying either preview cookie — with or without
`?vexLivePreview=1` — and redirects an unauthenticated one through
`/api/vex/live-preview?disable=1&redirect=<path>` before it reaches your route
handlers, reloading the page published.
