---
"@vexcms/next": patch
---

**Fix: live preview of a never-published document 404'd instead of rendering the
draft.** `[slug]/page.tsx`-style public routes call their published-only query on
the server and `notFound()` when nothing comes back, so a document that has only a
draft row — never published — 404'd before the client-side live-preview layer (which
reads a second, `readDrafts`-gated query) ever got a chance to render it.

Adds `createVexDraftModeRoute` (`@vexcms/next/livePreview`), a Route Handler factory
that enables Next.js Draft Mode for a verified live-preview session and redirects
back to the previewed page — `draftMode().enable()` can only be called from a Route
Handler or Server Action, never from middleware, so the project's own
`proxy.ts`/middleware now hands a `?vexLivePreview=1` request off to this route
(once it verifies the session itself) instead of setting the live-preview cookie
directly. A public page checks `(await draftMode()).isEnabled` as the fallback when
its published-only query comes back empty, letting the client-side preview layer
take over instead of 404ing — every visitor outside Draft Mode is unaffected, and
the route stays statically prerendered.

**Migration (apps/www, apps/test, and any project using
`admin.livePreview.url`):** add a session-authorized `GET /api/vex/live-preview`
route handler wired with `createVexDraftModeRoute({ getToken })`, and update your
project's `proxy.ts`/middleware to redirect an unhandled `?vexLivePreview=1` request
there (guarding against re-entering with the existing `vex-live-preview` cookie)
instead of setting that cookie itself. See the "Security: the gate is yours to set"
section of the live-preview guide for the full before/after.

**Fix: the loop-break cookie could outlive Draft Mode itself.** `proxy.ts`'s
hand-off check previously short-circuited on the advisory `vex-live-preview`
marker cookie alone, but that cookie is set for `LIVE_PREVIEW_COOKIE_MAX_AGE_SECONDS`
(1h) while Next's own Draft Mode cookie (`__prerender_bypass`, now exported as
`DRAFT_MODE_BYPASS_COOKIE` from `@vexcms/next/livePreview`) is a browser-session
cookie that can disappear well before that. A stale marker then skipped the
hand-off — and never re-enabled Draft Mode — for up to the rest of that hour.
The check now requires BOTH cookies.

**Fix: no way to leave preview mode.** `createVexDraftModeRoute` only ever called
`draftMode().enable()`. It now also disables: an explicit `?disable=1` (no
session required — leaving preview needs no authorization) clears Draft Mode and
`vex-live-preview` and redirects to `redirect` (or `/`); a signed-out request that
still carries a `redirect` param — the shape the proxy's hand-off always uses —
gets the same disable-and-redirect treatment instead of a bare `401`, so a
session that expires mid-preview doesn't leave Draft Mode stuck on for an
anonymous visitor. No session AND no `redirect` param still returns `401`,
keeping a direct, non-hand-off call distinguishable. The open-redirect guard on
`redirect` applies to every outcome, enable or disable.

**Migration (apps/www, apps/test, and any project using
`admin.livePreview.url`):** update your `proxy.ts`/middleware's loop-break check
to require both `LIVE_PREVIEW_COOKIE` and the new `DRAFT_MODE_BYPASS_COOKIE`
export — see the updated code sample in the "Security: the gate is yours to set"
section of the live-preview guide. No route handler change is required; the
disable path is additive.
