# Hand-off to GU — cross-page live preview in `vex-examples`

From spec `2026-11-11-live-preview-cross-page` (vexcms repo side). This file is the examples
half. It is owned by the GU session (`2026-11-09-golden-use-cases`), applied to
`~/Documents/Projects/vex-examples`. Background and evidence:
`.agent/docs/research/live-preview-cross-page.md`.

Goal: an editor can navigate anywhere inside the admin's preview panel and see their edits on
every page, without a second browser window.

## How each kind of collection reaches every page

| Collection shape | How its edits reach every page | Needs |
|---|---|---|
| `drafts` + `autosave` (magazine `articles`/`pages`, every `pages`) | autosave writes the draft about 1s after typing; every preview-aware query re-runs | Part 1 below |
| `drafts`, no autosave (restaurant `menus`) | after "Save draft" | Part 1 below |
| no `drafts` (conference `sessions`/`speakers`, restaurant `locations`, real-estate `listings`/`agents`) | after Save, through Convex reactivity, but only where the page reads through a client query | Part 1's client-query conversions |
| any, per keystroke | `useLivePreview*` overlay, only on components that hand it the document | already wired where it exists; deep overlay is backlogged |

## Part 1: apply in the same pass as Part 2, after the next alpha ships (developer decision 2026-11-11: one version, no interim alpha.37 fixes)

1. **Mount the provider in magazine and real-estate.** Neither `src/app/layout.tsx` renders
   `<LivePreviewProvider>`, so the overlay never runs. Verified at :3200, where a
   BroadcastChannel update for an article was ignored. What looks like preview in magazine
   today is autosave plus the reactive `getBySlugPreview` query. Mirror conference's and
   restaurant's `layout.tsx`: wrap `ThemeLive`/`children`/`auth` in `<LivePreviewProvider>`
   inside `ClientProviders`.
2. **Make public list queries preview-aware.** Give every list query that feeds a public page a
   `preview: v.optional(v.boolean())` arg. When it is true, call `find` with `drafts: true` and
   no `access.bypass`. `find` already returns ONE row per logical document with the draft
   merged over its published row (`mergeDraftCounterparts`), and silently falls back to
   published-only for a caller without `readDrafts`. Then pass
   `preview: useIsLivePreviewActive() || Boolean(draftMode)` from the block or page. Known call
   sites:
   - magazine: `articles.listPublished` (`ArticleList`, `FeaturedArticles`, `BlockDataContext`
     prefetch), `categories.listArticlesByCategory`, `authors.listArticlesByAuthor`,
     `authors.listAll`, `categories.listAll`
   - restaurant: `menus.listAllPublished` (`MenuPreview`)
   - conference/real-estate: only if a list reads a drafts-enabled collection. Today only
     `pages` is drafts-enabled there, so nothing changes.

   Keep server prefetches (`initialData`) in step: in Draft Mode, prefetch with
   `preview: true` and the session token, the way `[slug]/page.tsx` already does for
   `getBySlugPreview`.
3. **Convert server-only content pages to the client-query pattern** (`page.tsx` fetches
   `initialData` server-side; a `"use client"` component re-reads it through `useQuery`, or
   `useLivePreviewQuery` for the page's own document). Server components never re-render in
   the iframe, so neither a save nor the overlay ever reaches them:
   - magazine `authors/[slug]/AuthorContent.tsx`, `categories/[slug]/CategoryContent.tsx`
   - restaurant `locations/[slug]/page.tsx`. `locations` has a `livePreview.url`, but its
     target page never consumes the overlay. Confirmed: no `locations` handshake fired on
     `/locations/downtown`.
   - real-estate `listings/[slug]`, `agents/[slug]`, `listings`, `agents`. Check each first:
     some may already render a client child that does its own query.
4. Fix the `BlockDataContext` doc comment in magazine. It claims "the admin live-preview overlay
   [is] unaffected", but the blocks read through plain `useQuery`, so no overlay ever reached
   them.
5. **Fix the anonymous redirect loop in magazine's and real-estate's `proxy.ts`.** Their
   hand-off skips the session check. For a signed-out visitor, `/api/vex/live-preview`
   disables Draft Mode and redirects back to the same `?vexLivePreview=1` URL, and the proxy
   hands it off again. Verified: `curl -L --max-redirs 6` on
   `:3200/articles/<slug>?vexLivePreview=1` ends on a 307 after 6 redirects, while
   restaurant's session-checked proxy returns 200 on `:3230/locations?vexLivePreview=1`.
   Mirror conference's/restaurant's `resolveSessionStatus` check: hand off only when the
   session is `"authenticated"`.

Verify in the running app (P-024 exception already granted for GU): open an article's edit view
with the preview panel, type in the title, click through to `/`, `/authors/<slug>` and
`/categories/<slug>` inside the panel. The card titles follow within about 1–2s.

## Part 2: after the alpha that ships `2026-11-11-live-preview-cross-page`

1. Replace every `src/lib/useSitePreviewMode.ts` copy (all four examples) with
   `useIsLivePreviewActive` from `@vexcms/react`, update the call sites, and delete the files.
2. Re-verify a **hard** navigation inside the panel: reload the iframe on a page with no
   `?vexLivePreview=1` (right-click → Reload frame). The overlay must stay on and the current
   unsaved values must re-appear without typing.
3. `--bare` scaffolds created after that alpha get the provider, the
   `/api/vex/live-preview` route and the proxy hand-off from `base-nextjs`. Diff magazine's
   and real-estate's `proxy.ts` against the template's and adopt its shape: one
   `resolveSessionStatus` call shared by the hand-off and the gate.
4. Magazine is the runtime proof for the bare template's preview wiring (spec Step 3
   Verify). Record the result in the coordination board's § Log.

## Part 3: sign-out leaves live-preview cookies stale (apply alongside Parts 1–2)

From the vexcms-repo bug fix "signing out while live preview is open leaves Draft Mode
stuck on for an anonymous visitor". Three changes, same shape in all four examples
(`conference`, `magazine`, `real-estate`, `restaurant`):

1. **Drop the `access` override in every `getBySlugPreview`.** Each example's
   `convex/pages.ts` (plus magazine's `convex/articles.ts`) passes `drafts: true`
   alongside `access: { action: DRAFT_ACTIONS.readDrafts }`. Delete the `access` line
   (and the now-unused `DRAFT_ACTIONS` import if nothing else in the file uses it) so
   `find`'s own fallback decides: a caller with `readDrafts` still gets the
   draft-merged row, everyone else silently falls back to the published row instead of
   being denied the query outright. Without this, an anonymous caller — including one
   whose live-preview session just expired — gets `[]` where `getBySlug` would have
   returned a row. Rewrite each query's doc comment the same way
   `apps/www/convex/pages.ts`'s was rewritten: no `access` override, fallback decides,
   draft never reaches a caller without `readDrafts`.
2. **Call `disableLivePreview()` from every sign-out entry point.** Each example's
   `src/auth/client.tsx` has one `signOut: () => { beginTransition(null); … }` closure
   inside `VexAdminAuthAdapterProvider`'s value. Import `disableLivePreview` from
   `@vexcms/next/livePreview` and add `void disableLivePreview()` immediately after
   `beginTransition(null)`, before the `return signOut().then(...)` line — it is
   fire-and-forget and never throws, so it cannot block or delay sign-out either way.
3. **Add `admin.livePreview.expiredSessions: "deny"`** to each example's root
   `vex.config.ts` (`admin.livePreview` block), and port the `"deny"` check into each
   `src/proxy.ts`: read `vexConfig.admin.livePreview.expiredSessions` (import the
   project's own `~/vex.config`, aliased to avoid colliding with the exported
   `middleware`/`proxy` `config` object), compute `hasPreviewMarker` (either
   `LIVE_PREVIEW_COOKIE` or `DRAFT_MODE_BYPASS_COOKIE` present, not both), and when
   `expiredSessions === "deny"` and `hasPreviewMarker`, call `resolveSessionStatus`
   even on a request with no `?vexLivePreview=1` param — redirect to
   `/api/vex/live-preview?disable=1&redirect=<path+search>` when it comes back
   anything other than `"authenticated"`. Mirror `apps/www/src/proxy.ts`'s exact
   branching (vexcms repo, after this fix) rather than reinventing it — magazine's and
   real-estate's `proxy.ts` still need Part 1 step 5's session-check fix first, so
   apply that before layering this on top. Exclude `/api/vex/live-preview` from each
   `config.matcher` if it is not excluded already, so the disable redirect can never
   loop.
