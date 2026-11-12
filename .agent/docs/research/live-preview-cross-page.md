# Live preview on every page (cross-page overlay) — feasibility

Date: 2026-11-11 · Status: research only, nothing implemented

## Question

Can live preview cover every page the editor navigates to inside the preview iframe, so
every query whose result contains the edited document reflects unsaved changes? What
would it take, and is it worth doing before 0.1.0, given the goal of testing the four
golden demo apps (`vex-examples/`) without a second browser window?

## Answer

**Partly works today. The rest splits into one cheap, low-risk slice and one slice that
needs its own spec.**

### What already works (observed, restaurant demo :3230)

`LivePreviewProvider` is mounted in the root layout. Its `enabled` flag is computed once
on mount (`useLivePreviewEnabled`, `LivePreviewContext.tsx:61-74`), and the
`valuesById` overlay map lives in provider state. A **soft navigation** (Next `<Link>`)
keeps both, so any component that calls `useLivePreview*` keeps updating live on every
page.

Smoke test. I drove the consumer side by posting `vex-live-preview-update` on the
`vexcms-live-preview` BroadcastChannel from a second same-origin tab, so no admin form
and no autosave writes were involved:

| Step | Result |
|---|---|
| `/?vexLivePreview=1`, update `hours.bannerText` | banner overlaid ✅ |
| soft-nav to `/locations` | banner still overlaid ✅ |
| new update while on `/locations` | applied ✅ |
| hard reload `/locations` (no query param) | update dropped; saved banner shown ❌ |
| update `hours.weekly`, same page | `OpeningHours` block unchanged ❌ (plain `useQuery`) |
| `/locations/downtown?vexLivePreview=1` | no `locations` handshake; page is a pure server component, overlay impossible ❌ |

So globals rendered in layouts (header, footer, theme, banner) already preview across
pages. What's missing is everything else.

### Why other pages don't update — six gaps

1. **The gate is not sticky across hard navigations.** `useLivePreviewEnabled` and every
   project's `useSitePreviewMode` require `?vexLivePreview=1` in the URL. A reload, a
   plain `<a>`, or a redirect inside the iframe drops the param and the provider goes
   inert. The Draft Mode cookie survives, so server-side base layers keep the draft. Only
   the client overlay dies.
2. **The overlay is opt-in per call site and per document.** `useLivePreview(doc, slug)`
   only overlays the single document handed to it. List blocks and related-document
   queries use plain `useQuery` (`ArticleList`, `FeaturedArticles`, `AuthorList`,
   `LocationGrid`, `MenuPreview`, `OpeningHours`, `SpeakerGrid`, `ScheduleGrid`, and the
   `sessionsData`/`speakersData` queries in conference's detail pages), so no overlay
   reaches them. No hook today overlays an arbitrary result shape (array, nested
   populated docs).
3. **Server-component pages can't be overlaid at all.** Magazine
   `authors/[slug]/AuthorContent.tsx` and `categories/[slug]/CategoryContent.tsx`, and
   restaurant `locations/[slug]/page.tsx`, render RSC props with no client query. Each
   needs converting to the `initialData` + client-query pattern `PageContent` already
   uses.
4. **The existing overlay clobbers populated relationships.** `useLivePreview` does
   `{ ...doc, ...unsavedValues }` (`LivePreviewContext.tsx:308`). The form holds
   relationship and upload values as raw id arrays, so a populated `author: [AuthorDoc]`
   becomes `author: ["id"]`. The examples already work around this: magazine
   `convex/articles.ts:32-37` moves the populated author into a parallel `authorSummary`
   key and turns `author` back into ids, and `MediaImage` client-fetches raw ids. That
   workaround goes stale as soon as the editor changes the relationship.
5. **List membership, order, and filtering are server-computed.** A client overlay
   cannot add an unsaved new document to a list, move a document whose sort key changed,
   or drop one that no longer matches a filter. Published-only list queries
   (`listPublished`, `find` without `drafts`) never return a draft-only document.
6. **The panel gives no navigation context.** The iframe's `src` is the resolved
   `previewUrl` (`LivePreviewPanel.tsx:418-424`). Nothing shows where the frame has
   navigated to, there is no "back to document", and any `previewUrl` change (for
   example a slug edit) yanks the frame back.

### Two pre-existing demo bugs found on the way (not part of this feature)

- **Magazine and real-estate never mount `<LivePreviewProvider>`.** They are scaffolded
  with `--bare` (base template), and `base-nextjs` has no provider (out of scope in spec
  `2026-09-18-live-preview`). Magazine's articles and pages have
  `versions: { drafts: true, autosave: { enabled: true } }`. What looks like live
  preview there is actually autosave (1s debounce, `DEFAULT_AUTOSAVE_DEBOUNCE_MS`) plus
  Convex reactivity on `getBySlugPreview`. Confirmed at :3200: the provider never
  applied a BroadcastChannel update.
- **Restaurant `locations` has a `livePreview.url`, but its target page never consumes
  the overlay** (gap 3 above).

### What implementing it means

**Slice A — cheap, low risk. Fully covers draft+autosave collections across every page
within about 1–2s.**

| # | Change | Where | Est. |
|---|---|---|---|
| A1 | Sticky gate. The panel names its iframe (`<iframe name="vex-live-preview">`, and the pop-out uses the same name). The gate becomes `cookie && (param \|\| window.name === marker)`. `window.name` survives every navigation inside that frame and leaks to no other tab. Export the gate as a public hook (e.g. `useLivePreviewActive`) so apps stop copy-pasting `useSitePreviewMode`. | `@vexcms/react` livePreview, `@vexcms/core` constants, templates, apps | ~0.5d |
| A2 | Anonymous handshake. The provider sends a document-less handshake when it enables, and `useLivePreviewSync` replies when the key is absent or matches. A freshly loaded page gets current values without waiting for the next keystroke. | `livePreviewProtocol.ts`, `useLivePreviewSync.ts`, `LivePreviewContext.tsx` | ~2h |
| A3 | Preview-aware list queries. List queries take a `preview` arg and call `find({ …, drafts: preview })`. `find` already merges each published row with its draft (`mergeDraftCounterparts`: one row per logical document, draft wins) and silently falls back to published-only for callers without `readDrafts`. With autosave this gets membership, order, filters, populated relationships, and `beforeChange`-derived fields right on every page. No framework change. | each example's `convex/*.ts` + list blocks | ~0.25d / example |
| A4 | Fix the demo bugs: mount the provider in magazine and real-estate, and convert server-only detail pages to client queries with `initialData`. | `vex-examples` | ~0.5d total |

**Slice B — needs a spec. Adds per-keystroke updates for non-autosave collections and
in-flight edits.**

| # | Change | Est. |
|---|---|---|
| B1 | Shape-agnostic `useLivePreviewData(data)` / list-returning query sugar. Walks the whole query result and merges overlay values into any object whose `_id` (or `vex_publishedId`) has an entry. Needs memoization that preserves identity so renders don't churn. | ~1d |
| B2 | Relationship-safe merge, shared by B1 and the existing `useLivePreview`. Keep the base's populated docs when the overlay's ids equal the base's ids. Decide what happens when they differ: raw ids, a client fetch, or keep the base and mark it stale. The overlay map must store the sender's `collectionSlug` so nested docs can resolve their field config. This also fixes gap 4. | ~1d |
| B3 | Panel navigation chrome: current-path readout, back to document, reload. Same-origin frames can read `contentWindow.location`. A cross-origin `allowedOrigins` preview needs the provider to post location changes. | ~0.5–1d |
| B4 | Docs (`guides/live-preview.mdx`), changesets, template-sync, tests (deep-walk merge rules, gate stickiness). | ~0.5–1d |

Slice B total: about 3–4 days of framework work, plus re-wiring every list block in the
four examples.

**Hard limits no slice removes:** list membership and order for **unsaved** edits on
non-autosave collections (they need a save), unsaved new documents appearing in lists,
cross-device preview (already out of scope per spec `2026-09-18-live-preview`).

### Recommendation for 0.1.0

- **Do Slice A now.** A1 and A2 are small, internal to the live-preview module, and add
  at most one small public hook. A3 and A4 live in the examples repo, use shipped
  primitives (`find({ drafts })`), and fix demo bugs that undermine the D2 "live preview"
  launch scenario anyway. Together they deliver what was asked for testing: navigate
  anywhere in the panel and see draft content on every page, live at autosave cadence.
- **Defer Slice B** to `backlog.md` (post-0.1.0, via `dev-spec`). It adds public API
  (`useLivePreviewData`) with unsettled semantics: what a changed relationship renders
  as, and draft-vs-published `_id` matching (merged draft rows carry the draft's own
  `_id`, see `mergeDraftCounterparts.ts:16-21`). Locking those in days before tagging is
  the wrong trade. Exception: gap 4 (overlay clobbering populated relationships) is a
  correctness bug in the shipped API and could be pulled forward as a narrow B2 if the
  examples' `authorSummary` workaround is judged unacceptable for launch.

### Outcome (2026-11-11)

- **Slice A → spec `2026-11-11-live-preview-cross-page`.** A1 changed in the spec: the
  provider names its own window on first activation instead of the panel naming the
  iframe, which makes every preview surface sticky (Design Decision 1). A2 became a
  provider-level ready message that replaces the handshake.
- **A3/A4 → GU** (`examples-handoff.md`), plus one more bug: magazine's and real-estate's
  proxy hand-off loops for anonymous visitors.
- **Slice B and a CLI opt-out for the base preview wiring → `backlog.md`.**

## Sources

- `packages/react/src/livePreview/LivePreviewContext.tsx`: gate (61-74), listener
  (129-206), handshake (227-248), overlay merge (278-322)
- `packages/react/src/livePreview/useLivePreviewSync.ts`: replies only to a handshake
  whose key matches (68-73)
- `packages/react/src/livePreview/livePreviewProtocol.ts`: message shapes, channel name
- `packages/react/src/livePreview/LivePreviewPanel.tsx`: iframe `src` (418-424)
- `packages/core/src/collections/api/find/server.ts`: `drafts` contract (140-157)
- `packages/core/src/collections/query/mergeDraftCounterparts.ts`: one row per logical
  document, draft `_id` wins (9-24)
- `packages/core/src/versions/constants.ts`: `vex_publishedId`; `DEFAULT_AUTOSAVE_DEBOUNCE_MS = 1000`
- `.agent/docs/specs/2026-09-18-live-preview/spec.md`: transport decisions (95-118),
  out of scope (341-362)
- `apps/test/src/proxy.ts`: Draft Mode hand-off triggers only on the param (65-85)
- `vex-examples/`: magazine (`ArticleList`, `AuthorContent`, `CategoryContent`,
  `convex/articles.ts`, `MediaImage`), restaurant (`LocationGrid`, `OpeningHours`,
  `HoursBannerContent`, `locations/[slug]/page.tsx`), conference
  (`SpeakerContent`, `SessionContent`)

## Code references

Overlay merge, the source of gap 4:

```ts
// LivePreviewContext.tsx:305-310
if (savedDocId) {
  const unsavedValues = valuesById.get(savedDocId);
  return unsavedValues
    ? ({ ...(doc as object), ...unsavedValues } as DocumentByResourceSlug<TCollectionSlug>)
    : doc;
}
```

Handshake reply, the gap A2 fixes:

```ts
// useLivePreviewSync.ts:68-73
function handleChannelMessage(event: MessageEvent) {
  if (!isLivePreviewMessage(event.data)) return;
  if (event.data.type !== "vex-live-preview-handshake") return;
  if (livePreviewKeyFor(event.data) !== previewKey) return;
  postUpdate();
}
```

Magazine's workaround for gap 4:

```ts
// vex-examples/magazine/convex/articles.ts:36-37
const authorSummary = projectArticleAuthors(doc.author)
return { ...doc, author: authorSummary.map((author) => author._id), authorSummary }
```

## Open questions

- Which id does the admin send as `documentId` for a versioned document with a linked
  draft: the published `_id` or the draft row's `_id`? B1's matching rule depends on it.
  Not verified; the smoke test bypassed the admin form.
- A1: should the sticky marker also apply to the pop-out tab (`window.open` name), or
  stay iframe-only? Pop-out tabs already reach the overlay via BroadcastChannel but lose
  the gate on reload, same as the iframe today.
- Should `base-nextjs` ship `<LivePreviewProvider>` now that `--bare` demos (magazine,
  real-estate) configure `livePreview.url`? It's out of scope in spec
  `2026-09-18-live-preview`, but the golden scenarios contradict that premise.
