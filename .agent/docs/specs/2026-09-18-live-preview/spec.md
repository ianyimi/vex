---
status: complete
spec_id: 2026-09-18-live-preview
touches:
  - packages/core/src/livePreview/**
  - packages/core/src/config/**
  - packages/core/src/collections/types.ts
  - packages/core/src/collections/config.ts
  - packages/core/src/globals/types.ts
  - packages/core/src/globals/config.ts
  - packages/core/src/types/generated.ts
  - packages/core/src/index.ts
  - packages/core/README.md
  - packages/react/package.json
  - pnpm-workspace.yaml
  - packages/react/src/components/ui/resizable.tsx
  - packages/react/src/context/**
  - packages/react/src/components/livePreview/**
  - packages/react/src/components/views/CollectionEditView.tsx
  - packages/react/src/components/views/GlobalEditView.tsx
  - packages/react/src/hooks/useLivePreviewSync.ts
  - packages/react/src/hooks/useLivePreviewPanelState.ts
  - packages/react/src/index.ts
  - packages/next/src/NextAdminPage.tsx
  - packages/next/src/NextLivePreviewProvider.tsx
  - packages/next/src/index.ts
  - packages/core/src/routes/types.ts
  - apps/www/src/vex.config.ts
  - apps/www/src/vexcms/collections/pages.ts
  - apps/www/src/proxy.ts
  - apps/www/src/app/(frontend)/(site)/layout.tsx
  - apps/www/src/app/(frontend)/(site)/PageContent.tsx
  - packages/create-vexcms/templates/marketing-site/**
  - apps/docs/src/content/docs/guides/live-preview.mdx
prompt_version: 1
---

# 2026-09-18-live-preview — Spec

## Overview

Launch-plan spec **E** (ADR-012). `livePreview: { url }` is accepted on global admin
config today (`globals/types.ts:36,63`) and stored on the resolved config, but nothing
reads it — no listener, no panel, no `postMessage` transport (grep of `packages/*/src`
for `livePreview`/`postMessage`/`BroadcastChannel` finds no implementation). This spec
ships the feature per ADR-012: a `postMessage` + `BroadcastChannel` transport driven by
unsaved form state, overlaid on the consumer's own query result via an `id → values`
map, with the preview target being the document's real public route rather than a
dedicated preview route.

Ships after F (`2026-09-18-lifecycle-hooks-validation`, in progress) per the launch
plan's hard ordering constraint 2 — no dependency on F's pipeline, F simply comes first
in the track's execution order. It reuses F's now-landed `TCollectionSlug`-threading
pattern (Design Decision 15) for `admin.livePreview.url`'s typing.

**Naming.** Every identifier — types, constants, files, components, hooks, the module
directory — is named `LivePreview`/`livePreview`, matching PayloadCMS's own
`livePreview` naming for this feature (developer decision, this revision). No
identifier introduced by this spec carries a `Vex` prefix — `LivePreviewProvider`/
`LivePreviewContext` (unlike the pre-existing sibling convention `VexConfigProvider`/
`VexConfigContext`) and `LivePreviewUrlResolver` (unlike the pre-existing sibling
`VexRouteMapper`) all drop it: the import path (`from "@vexcms/react"`/
`from "@vexcms/core"`) already signals origin, so a prefix on a brand-new export is
redundant. `NextLivePreviewProvider` keeps its `Next` prefix — unrelated to `Vex`,
matching sibling `NextAdminPage`/`NextAdminLayout`. Package-internal-only identifiers
(the wire-protocol types/constants in `livePreviewProtocol.ts`, never exported from
`@vexcms/react`'s public barrel) also carry no prefix at all.

## Design Decisions

1. **`livePreview.url` stays independent of `routes.map`.** `VexRoutesConfig.map`
   (`routes/types.ts:33-68`) answers "every public path this document renders at" (0..N,
   driving revalidation/sitemap); `livePreview.url` answers "the one URL to iframe for
   preview" and may point at a different origin (staging) than production. Its own
   docstring's claim that it drives "preview links" (`routes/types.ts:53`) is corrected
   in Step 8 rather than preserved — it predates this design.
2. **The origin allowlist is root-level `livePreview.allowedOrigins`, not
   `admin.livePreview.<collection>.allowedOrigins` and not a generic `cors` namespace.** No
   CORS concept exists anywhere in this repo today (`postMessage` origin checks are a
   browser-window concern, unrelated to HTTP CORS), and nothing else needs an origin
   allowlist — inventing a generic namespace for a single consumer is speculative code.
   One list, because the admin origin(s) permitted to drive the overlay don't vary per
   collection.
3. **The transport sends a full value snapshot on every change, never a diff.** Tracing
   `useLiveFieldMerge`/`changedValues.ts` confirms there is no leaf-level merge utility
   anywhere in the codebase — the existing dirty-tracking machinery works at top-level
   field-key granularity, and `changedValues(form)` still returns each dirty key's
   **complete** current value, never a partial nested patch. A destructive shallow spread
   only becomes possible if a partial diff is transmitted; sending the form's complete
   current top-level values in full sidesteps the problem entirely — structured-clone
   transports handle nested objects/arrays with no `JSON.stringify` cost (ADR-012's jank
   concern was specific to `localStorage`, not these transports). `{ ...doc, ...values }`
   is therefore a correct merge: every key present in `values` already holds its
   complete current nested value.
4. **Two transports run in parallel: `postMessage` to a captured window reference, and
   `BroadcastChannel` keyed by a fixed channel name.** Neither alone is sufficient.
   `postMessage` is the only web-platform mechanism that crosses origins (needed because
   `livePreview.url` may point at a staging domain), but it requires the admin panel to hold
   a live `Window` reference — which it only has for a window it opened itself
   (`window.open()`'s return value, or an iframe's `contentWindow`). A tab the editor
   duplicated, reopened from history, moved to a second monitor, or opened by manually
   pasting the preview URL has no such reference, so `postMessage` alone cannot reach it.
   `BroadcastChannel` fixes exactly that gap for the common case: it needs no reference
   at all, only a shared channel name, so any same-origin tab/window/frame that opens a
   channel with that name receives every update regardless of how it was opened. Every
   send goes out on both; every receiver listens on both; a message arriving twice is
   idempotent (identical values re-applied to the same map key). **The one thing neither
   transport can do — and no combination of them can — is reach a genuinely different
   browser or device.** Both are same-machine, same-browser-process constructs by web
   platform design; true cross-device sync would need a persisted network channel (e.g.
   a Convex-backed ephemeral subscription), which is a materially larger feature with its
   own concurrency/privacy surface and is explicitly out of scope (see below).
5. **The channel name is fixed and shared; messages are routed by payload, not by
   channel.** A per-document `BroadcastChannel` was considered and rejected — a page can
   render several documents at once (e.g. a `relationship` to an author also open for
   editing elsewhere), and opening one channel per document the moment its id becomes
   known is more bookkeeping than one channel that every consumer already opens
   unconditionally. Exactly mirrors how `window.addEventListener("message")` already
   works: one listener, payload inspected to route by `livePreviewKeyFor`.
6. **A newly-mounted preview page's handshake gets an immediate reply over
   `BroadcastChannel`, independent of any window reference.** `useLivePreviewSync` (admin
   side) listens for `vex-live-preview-handshake` messages matching its own document's key
   and re-sends the current update immediately on receipt — recovering current state
   for a duplicated tab or a manually-reopened one without waiting for the next
   keystroke, which the `postMessage`-to-captured-reference path structurally cannot do
   for a window the admin never captured a reference to.
7. **`admin.livePreview` is a nested object with `url`, `debounceMs?`, `defaultOpen?`, not a
   flat `previewUrl` string.** Two settings beyond `url` are real, not speculative:
   `debounceMs` overrides `useLivePreviewSync`'s sync debounce per collection (a
   `blocks`-heavy collection may want a slower cadence than a plain-text one), and
   `defaultOpen` overrides the panel's fallback state before any cookie exists (Design
   Decision 9). A flat namespace would need three loose siblings; one grouped object
   matches the existing `table: {...}` / `sidebar: {...}` convention. A panel-width
   setting and a pop-out-disable flag were considered and rejected — no consumer for
   either.
8. **The embedded panel is a resizable split pane** via `react-resizable-panels`
   (wrapped in a new shadcn-style `ui/resizable.tsx` primitive, matching the pattern
   every other shadcn component in `components/ui/` already follows). The existing
   `@hello-pangea/dnd` dependency was checked and rejected for this — it is a
   list-reorder library (`DraggableProvidedDragHandleProps`, used by `blocks`/`array`
   field reordering); it has no free-pixel-position or split-pane-resize primitive.
   `react-resizable-panels` is the library shadcn's own "Resizable" component wraps, so
   this is the boring, well-trodden choice rather than hand-rolled pointer-drag math for
   a two-pane layout. Width persists via the library's own `autoSaveId` (localStorage),
   scoped per collection/global slug — unlike the panel's open/closed state (Design
   Decision 9's cookie, read server-side to avoid a layout flash), a resizable pane's
   width has no comparable flash risk: the pane exists and has SOME width the instant it
   renders either way, so client-only persistence is an acceptable, simpler choice here.
9. **Preview panel: persistent split pane on desktop, full-screen overlay on mobile,
   cookie-remembered open/closed per collection/global with a per-collection
   `defaultOpen` fallback.** Not a modal, not a drawer-on-demand. A
   `vex-live-preview-panel:<slug>` cookie stores the user's last explicit open/close choice;
   `NextAdminPage` (a server component) reads it via `next/headers` `cookies()` and
   passes the initial state down, so there is no flash of the wrong panel state on load.
   Absent any cookie, the panel falls back to `admin.livePreview.defaultOpen` (itself
   defaulting to `false`). Below the existing `useIsMobile()` breakpoint (768px, already
   the sidebar's own inline-rail/`Sheet` boundary — J's launch-plan viewport work already
   treats this width as load-bearing), a 45%-width split pane is meaningless; the panel
   instead renders `fixed inset-0 z-50`, covering the screen, with a close button that
   calls the same toggle the desktop "Hide preview" button does — one piece of open/
   closed state, two presentations.
10. **A floating, draggable, collapsible indicator — not a wrapper window or a separate
    preview route — carries the "you are viewing a live preview" affordance and the
    device-width controls.** Rendered by `LivePreviewProvider` itself alongside
    `children` whenever `enabled` is true, so it exists on the real page regardless of
    how that page was opened (the embedded iframe, the pop-out, a duplicated tab) — no
    wrapper route re-implementing the target's rendering, which ADR-012 already rejected
    for exactly that reason. Collapsed, it is a small tab fixed to whichever screen edge
    the user last dropped it at (default: right edge, vertically centered); dragging it
    (plain pointer events — no library needed for free-pixel positioning) snaps it to the
    nearest edge on release, and its last position persists in `localStorage`
    (`vex-live-preview-indicator-position`) — a UI convenience, not layout-affecting state,
    so no SSR-flash concern applies. Expanded, it shows the "Live Preview" label and, only
    when the page is both top-level (`window.top === window.self`, not the embedded
    iframe) and script-opened (`window.opener != null`, i.e. genuinely the admin's own
    pop-out), a row of width presets. Elsewhere the width row is omitted rather than
    shown disabled — `window.resizeTo` is a silent no-op on a window the browser did not
    open via script (security-restricted), and a control that visibly does nothing is
    worse than an absent one.
11. **Breakpoints are user-configurable, not a hardcoded constant.** Root-level
    `livePreview.breakpoints` defaults to the launch plan's own J-spec viewport matrix (375,
    390, 640, 768, 1024, 1280, 1536 — `DEFAULT_LIVE_PREVIEW_BREAKPOINTS` in `@vexcms/core`),
    labeled with Tailwind's own breakpoint names (`sm`/`md`/`lg`/`xl`/`2xl`) for the four
    that are Tailwind breakpoints, so the feature works unconfigured. The same list
    drives both surfaces: the embedded panel's breakpoint toggle row (Step 3), which
    scales the iframe to the selected width within whatever space `react-resizable-panels`
    currently allots it rather than stretching it, and the floating indicator's pop-out
    resize buttons (Design Decision 10), which call `window.resizeTo`.

    **Overridable per collection/global via `admin.livePreview.breakpoints`**, despite the
    override being a rare need — it was already threaded through the same
    `AdminLivePreviewConfigInput` object `url`/`debounceMs`/`defaultOpen` flow through, so
    supporting it cost one more optional field, not new plumbing. Its own JSDoc tells the
    reader the root config is very likely what they actually want; the resolution itself
    (`collection.admin.livePreview.breakpoints ?? config.livePreview.breakpoints`) happens where
    both are simultaneously in scope — `CollectionEditView`/`GlobalEditView` — not inside
    `defineCollection()`/`defineGlobal()`, which resolve in isolation before
    `defineConfig()` ever sees the root default.

    **The embedded panel scales rather than clips or stretches.** `computeLivePreviewFrameGeometry`
    (Step 3) measures the panel's actual rendered pixel width via `ResizeObserver`
    (`react-resizable-panels` lays out with percentages/flex, not pixel props, so nothing
    else tells a child its allotted space) and computes `scale = min(1, containerWidth /
breakpointWidth)`. When the breakpoint is narrower than the available space, the
    iframe renders at its exact real pixel width, centered, with letterboxing on both
    sides — no distortion. When the breakpoint is wider, the iframe still renders
    internally at the full breakpoint width — so the page's own CSS media queries fire
    exactly as they would on a real device that size — but is visually scaled down to
    exactly fill the available space, the standard technique real device-preview tools
    use rather than clipping the excess or stretching the DOM to a false width.
    Deselecting a breakpoint ("Full width") returns to today's plain 100%-fill iframe.

    **Media collections need none of this.** `MediaCollectionConfig`'s `admin` type
    (`media/types.ts:129`) is a wholly separate `{ softDelete }` shape that never
    extended `AdminCollectionConfigInput` — `livePreview` was never reachable there, so
    there is nothing to explicitly exclude.

12. **`useLivePreviewQuery` ships as sugar over `useLivePreview`**, per the developer's confirmed
    scope, shaped around the one real consumer's actual query pattern: `getBySlug`-style
    queries in this codebase return an array (`PagesDocument[]`) that the caller narrows
    with `pages?.[0]`. `useLivePreviewQuery` performs that narrowing itself — its `data` is a
    single overlaid document, not the array — so `PageContent.tsx` (Step 6) drops its own
    `pages?.[0]`. A query that already returns a single document uses the primitive
    (`useQuery` + `useLivePreview`) directly.
13. **A document being created previews by temp id, generated once by the edit view.**
    `CollectionEditView` generates one `crypto.randomUUID()` per mount
    (`useState(() => crypto.randomUUID())`, cheap and unconditional so the hook call
    stays unconditional too) and passes it to `resolveLivePreviewUrl` and `LivePreviewPanel`.
    `resolveLivePreviewUrl` appends it (`vexLivePreviewId`) plus the collection slug
    (`vexLivePreviewCollection`) to the resolved preview URL's query string **only when the
    document has no saved `_id` yet** — a saved document's preview URL is used exactly
    as the resolver returns it, because the public page will fetch that document
    normally and get a real `_id` to match on, and the SAME id independently derives the
    `BroadcastChannel` routing key on both sides with no URL param needed at all. See
    "How a preview update finds the right page," below, for the full walkthrough.
14. **`LivePreviewProvider` is gated by an `enabled` prop, not by whether the caller
    renders it at all — and no project ever writes the gating logic itself.** The
    provider always mounts; when `enabled` is `false` it attaches no listener (on either
    transport) and renders `children` untouched, at zero cost. `@vexcms/next` ships
    `NextLivePreviewProvider` — a server component that reads the `x-vex-live-preview-enabled`
    request header (via `next/headers` `headers()`, available to layouts unlike
    `searchParams`) and passes the boolean straight through. A project's own layout
    writes exactly one wrapping call
    (`<NextLivePreviewProvider config={vexConfig}>{children}</NextLivePreviewProvider>`) — no manual
    header read, no ternary, no direct `LivePreviewProvider` import. This component lives
    in `@vexcms/next`, not `@vexcms/react`, because `headers()` is a Next.js API —
    `@vexcms/react` stays framework-portable.
15. **The header itself is still set by the project's own `proxy.ts` middleware, which
    cannot move into the framework.** Setting the header requires verifying a session,
    and session verification calls the project's own generated Convex API
    (`api.auth.sessions.getSessionWithUser`) against its own auth adapter — there is no
    `VexAuthAdapter` method for this today, and adding one is real scope creep on an
    auth-adapter interface neither F nor this spec touches. `LIVE_PREVIEW_HEADER` and
    `LIVE_PREVIEW_QUERY_PARAM` are exported as constants from `@vexcms/core` specifically so
    the header name can never drift between the middleware that sets it and the gate that
    reads it.
16. **An invalid/absent session with `?vexLivePreview=1` renders the page normally, not a
    redirect.** Unlike the admin gate (fail-closed, this is a private surface), the
    public site is public by design — a visitor who stumbles on a shared preview link
    with a stale or absent session should see the normal published page, not be sent to
    sign-in.
17. **`admin.livePreview.url` is typed to the exact generated document interface for its own
    collection or global, inferred with zero extra syntax — reusing F's now-landed
    `TCollectionSlug`-threading pattern.** `AdminCollectionConfigInput`/`AdminCollectionConfig`
    gain a trailing `TCollectionSlug extends CollectionSlug = CollectionSlug` generic
    (appended last, exactly as F's field types do, so no existing positional caller
    breaks), and `admin.livePreview.url` is typed
    `LivePreviewUrlResolver<Partial<DocumentByCollectionSlug<TCollectionSlug>>>`. Because
    `slug` and `admin` are sibling properties on the same `defineCollection({ slug:
"pages", admin: { livePreview: { url } } })` call, TypeScript infers `TCollectionSlug`
    from the literal `slug` the same way it already infers it for `hooks.beforeChange`
    (F's Design Decision 2). `GlobalAdminConfigInput`/`GlobalAdminConfig` get the
    identical treatment with a trailing `TGlobalSlug` and a new
    `DocumentByGlobalSlug<TGlobalSlug>` helper. The internal plumbing that calls a
    resolved `url` at runtime (`resolveLivePreviewUrl`) stays non-generic — it merges a
    plain `Record<string, unknown>` and casts once to the loose `LivePreviewUrlResolver`
    default, the same boundary-cast pattern F's own hook dispatcher uses.
18. **Lifecycle hooks never run on preview data** (ADR-012, unchanged) — the preview
    renders exactly what the editor typed, pre-`beforeChange`.

## How a preview update finds the right page

Four independent guarantees make misdirected or mismatched preview data structurally
impossible within one browser, and one hard platform limit bounds what neither transport
can ever do:

1. **`postMessage` is point-to-point when a window reference exists.** `useLivePreviewSync`
   posts to the exact `Window` reference the panel holds — an iframe's `contentWindow`
   or a `window.open()` return value — which can only ever reach that window.
2. **`BroadcastChannel` needs no reference at all.** Any same-origin tab, window, or
   frame that opens a channel with the shared name receives every message — covering
   the duplicated tab, the reopened-from-history tab, the tab dragged to a second
   monitor, and the manually-pasted-URL tab, none of which the admin panel ever held a
   `Window` reference to.
3. **Only allowlisted origins may write into a provider's map via `postMessage`; every
   `BroadcastChannel` message is same-origin by browser construction, so there is
   nothing to check.** Both transports still validate the payload's _shape_ against the
   target collection's real Zod schema before storing it — same-origin is not the same
   guarantee as "trustworthy," just "not a different site."
4. **The lookup key is either a real Convex id or a UUID — both effectively unique.**
   `livePreviewKeyFor` resolves to `documentId` when the document is saved (unique per
   deployment) or `tempId` (`crypto.randomUUID()`) when it is not. Two different
   documents, saved or not, can never collide on the same key, on either transport.
5. **Neither transport crosses a browser process or a device.** `BroadcastChannel` is
   scoped to one browser's storage partition; `postMessage` requires an in-process
   `Window` object. A colleague opening the same preview link in a different browser, or
   on their phone, will not see live edits — only the published document, exactly as any
   other visitor would (Design Decision 4).

The full path, end to end:

- **Admin side, saved document.** `CollectionEditView` already knows `(collectionSlug,
documentId)`. `resolveLivePreviewUrl` calls `admin.livePreview.url(doc)` with the merged
  saved-plus-form-values document and uses the returned URL **unmodified** — no query
  params needed, because the public page will fetch this same document by its own means
  (a slug lookup) and get the real `_id` back, which independently derives the same
  `BroadcastChannel` routing key on both sides.
- **Admin side, new document.** No `documentId` exists yet, so `resolveLivePreviewUrl`
  appends `?vexLivePreviewId=<tempId>&vexLivePreviewCollection=<slug>` to the resolved URL —
  the only way to identify a document that has no database row to fetch by slug.
- **Admin side, every keystroke.** `useLivePreviewSync` posts a `vex-live-preview-update`
  message carrying `documentId` (if saved), `tempId` (if not), and the form's complete
  current values, debounced by `admin.livePreview.debounceMs`, over **both** transports:
  `BroadcastChannel` unconditionally, and `postMessage` to whichever window (iframe or
  pop-out) is currently held.
- **Public side, mount and every re-render.** `useLivePreview(doc, collectionSlug)`
  announces itself via a `vex-live-preview-handshake` message — `documentId: doc?._id` when
  the fetched document exists, else `tempId` read from the URL's `vexLivePreviewId` param —
  over both transports.
- **Admin side, on receiving a matching handshake.** `useLivePreviewSync` immediately
  re-sends the current update (Design Decision 6) — the mechanism that recovers state
  for a tab the admin never captured a window reference to.
- **Provider side.** Listens on both `window.addEventListener("message")` (origin-
  checked) and a shared `BroadcastChannel` (no origin check needed — same-origin by
  construction), validates the payload against the target collection's real Zod schema,
  resolves the key via `livePreviewKeyFor`, and stores the values in its map. A message
  arriving on both transports for the same key applies the same values twice — idempotent.
- **Public side, lookup.** `useLivePreview` reads back **exactly the key it announced** —
  never scans the map or takes "the newest entry."

## Out of Scope

- A contractually-pure `derive` hook class so `beforeChange`-derived fields (e.g. a
  computed `slug`) appear in preview (ADR-012's documented forward path).
- Collection-level `admin.components.livePreview` (ARCH-1 still forbids it).
- Draft-aware preview base layer — spec C's job, additive to this spec's overlay.
- Richtext sanitizing-renderer integration — no `richtext()` field exists yet (spec D).
- `base-nextjs` template — no public marketing routes.
- **Cross-browser or cross-device preview sync.** Design Decision 4 and "How a preview
  update finds the right page" point 5 explain the hard platform limit; closing it would
  need a persisted network channel (e.g. a Convex-backed ephemeral subscription table
  keyed by editing session) — a materially larger feature with its own concurrency and
  privacy surface, not requested and not built here.
- A `VexAuthAdapter` session-verification method for `@vexcms/next` to perform the
  preview-mode session check itself.
- A panel-width setting and a pop-out-disable flag under `admin.livePreview`.
- Full device _profiles_ (paired width+height, orientation toggle) for the floating
  indicator's resize controls — width-only, matching the J viewport matrix (Design
  Decision 11).
- Global live preview's runtime consumer (provider payload validation, a dogfooding
  wiring). The config typing (Design Decision 17) is symmetric across collections and
  globals, but no global is previewed end-to-end in this spec.

## Implementation

### Step 1 — Core config, protocol constants & typed resolvers [dev]

#### packages/core/src/livePreview/types.ts

New file.

```ts
import type { VexDocument } from "../api/convex";
import type { LucideIconName } from "../utils";

/**
 * Resolves a document to the single public URL its live preview should render.
 *
 * `TDoc` is supplied by the caller — `AdminLivePreviewConfigInput` instantiates it with
 * `Partial<DocumentByCollectionSlug<...>>` / `Partial<DocumentByGlobalSlug<...>>`
 * (Design Decision 17), so a resolver authored inside `defineCollection`/`defineGlobal`
 * sees the exact generated fields for its own collection/global — not a bare
 * `VexDocument`.
 *
 * Distinct from `VexRouteMapper` (`routes/types.ts`): `routes.map` answers "every
 * public path this document renders at" (0..N); this answers "the one URL to iframe
 * for preview" and may point at a different origin than production.
 *
 * @param doc - The document as currently known — saved fields merged with unsaved
 *   form edits. `Partial` because a document being created has no `_id` yet.
 * @returns The URL to preview `doc` at, or `undefined` when it cannot be resolved yet.
 *
 * @example
 * ```ts
 * defineCollection({
 *   slug: "pages",
 *   admin: {
 *     livePreview: {
 *       // doc: Partial<PagesDocument> — doc.slug is typed, not unknown
 *       url: (doc) => (doc.slug ? `https://example.com/${doc.slug}` : undefined),
 *     },
 *   },
 * });
 * ```
 */
export type LivePreviewUrlResolver<
  TDoc extends Partial<VexDocument> = Partial<VexDocument>,
> = (doc: TDoc) => string | undefined;

/**
 * One toggle-able simulated viewport width, offered as a button in the
 * embedded preview panel's breakpoint row and the floating indicator's
 * pop-out resize controls (Design Decision 11).
 *
 * Rendering precedence: `icon`, when set, renders instead of `label` as the
 * button's visible content, with `label` becoming the hover title/tooltip
 * instead. With no `icon`, `label` renders as plain text. `label` is
 * therefore always required — even an icon-only button needs it for the
 * tooltip and for accessibility (it becomes the button's `aria-label`).
 */
export interface LivePreviewBreakpoint {
  /**
   * Always required. The button's visible text when `icon` is unset; the
   * hover title and `aria-label` when `icon` is set.
   */
  label: string;
  /** The viewport width, in pixels, this breakpoint simulates. */
  width: number;
  /**
   * Renders instead of `label` in the toggle button when set — e.g. a
   * `"Smartphone"`/`"Tablet"`/`"Laptop"`/`"Monitor"` icon per breakpoint so a
   * project can show device silhouettes instead of pixel numbers. Omit to
   * show `label` as plain text.
   */
  icon?: LucideIconName;
}

/**
 * User-facing input for a collection or global's `admin.livePreview` block.
 *
 * @typeParam TDoc - The exact generated document interface this collection/global's
 *   `url` resolver receives — see {@link LivePreviewUrlResolver}.
 */
export interface AdminLivePreviewConfigInput<
  TDoc extends Partial<VexDocument> = Partial<VexDocument>,
> {
  /** Resolves the document being edited to its public preview URL. */
  url: LivePreviewUrlResolver<TDoc>;
  /**
   * Milliseconds `useLivePreviewSync` waits after the last form change before
   * posting an update.
   * @defaultValue `DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS` (150ms)
   */
  debounceMs?: number;
  /**
   * Whether the preview panel starts open before the editor has ever made an
   * explicit choice. A `vex-live-preview-panel:<slug>` cookie remembers an explicit
   * choice once made and always wins over this default.
   * @defaultValue `false`
   */
  defaultOpen?: boolean;
  /**
   * Overrides the root `livePreview.breakpoints` for this collection/global's own
   * panel only. You are very likely looking for the root-level
   * `livePreview.breakpoints` instead — set there once, it applies to every
   * collection/global that declares `admin.livePreview.url`. Override here only
   * for the rare collection whose previewed layout genuinely needs different
   * simulated widths than the rest of the project.
   */
  breakpoints?: LivePreviewBreakpoint[];
}

/**
 * Resolved `admin.livePreview` config after `defineCollection()`/`defineGlobal()` applies
 * defaults.
 */
export interface AdminLivePreviewConfig<
  TDoc extends Partial<VexDocument> = Partial<VexDocument>,
> {
  url: LivePreviewUrlResolver<TDoc>;
  debounceMs: number;
  defaultOpen: boolean;
  /** Overrides the root breakpoints for this collection/global. `undefined` = inherit. */
  breakpoints?: LivePreviewBreakpoint[];
}

/**
 * User-facing input for the root-level `livePreview` config block — sibling to
 * `admin` / `access` / `routes` on `VexClientConfigInput`.
 */
export interface LivePreviewConfigInput {
  /**
   * Origins permitted to send `postMessage` control frames to a live-preview
   * listener — e.g. `["http://localhost:3000", "https://admin.example.com"]`.
   * Explicitly configured rather than inferred (ADR-012, security requirement
   * 1). Empty (the default) means the `postMessage` transport accepts nothing
   * — `BroadcastChannel` is unaffected, since it cannot cross origins at all.
   */
  allowedOrigins: string[];
  /**
   * Breakpoints offered as toggle buttons in every collection/global's
   * preview panel and the floating indicator's pop-out controls, unless a
   * collection/global overrides them via its own `admin.livePreview.breakpoints`.
   * @defaultValue `DEFAULT_LIVE_PREVIEW_BREAKPOINTS`
   */
  breakpoints?: LivePreviewBreakpoint[];
}

/** Resolved root-level `livePreview` config after `defineConfig()` applies defaults. */
export interface LivePreviewConfig {
  allowedOrigins: string[];
  breakpoints: LivePreviewBreakpoint[];
}
```

#### packages/core/src/livePreview/constants.ts

New file.

```ts
/**
 * Query param a preview link carries to request preview mode. Read by the
 * project's own middleware (e.g. `proxy.ts`), never by application code directly.
 */
export const LIVE_PREVIEW_QUERY_PARAM = "vexLivePreview";

/**
 * Query param carrying an unsaved document's client-generated temp id, appended
 * by `resolveLivePreviewUrl` only when the document has no saved `_id` yet.
 */
export const LIVE_PREVIEW_ID_PARAM = "vexLivePreviewId";

/** Query param carrying the collection slug alongside `LIVE_PREVIEW_ID_PARAM`. */
export const LIVE_PREVIEW_COLLECTION_PARAM = "vexLivePreviewCollection";

/**
 * Request header the project's own middleware sets after verifying a
 * `LIVE_PREVIEW_QUERY_PARAM` request carries a valid admin session, and
 * `NextLivePreviewProvider` (`@vexcms/next`) reads to decide whether to enable
 * `LivePreviewProvider`.
 */
export const LIVE_PREVIEW_HEADER = "x-vex-live-preview-enabled";

/**
 * Default `admin.livePreview.debounceMs` when a collection/global omits it, and
 * `useLivePreviewSync`'s own fallback when called directly.
 */
export const DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS = 150;

/**
 * Default breakpoints for `livePreview.breakpoints` (Design Decision 11) — the
 * exact viewport matrix the launch plan's spec J already uses for responsive
 * QA (`v0.1.0-launch-plan.md`'s "Viewport matrix" table), reused rather than
 * inventing a second "device size" concept. Labeled with Tailwind's own
 * breakpoint names for the four that are Tailwind breakpoints, and given a
 * device icon per J's own device correlation for each width (`iPhone SE /
 * mini`, `iPhone 14/15`, ..., `iPad landscape`, ...).
 */
export const DEFAULT_LIVE_PREVIEW_BREAKPOINTS: LivePreviewBreakpoint[] = [
  { label: "iPhone SE", width: 375, icon: "Smartphone" },
  { label: "iPhone 14/15", width: 390, icon: "Smartphone" },
  { label: "sm", width: 640, icon: "Smartphone" },
  { label: "md", width: 768, icon: "Tablet" },
  { label: "lg", width: 1024, icon: "Tablet" },
  { label: "xl", width: 1280, icon: "Laptop" },
  { label: "2xl", width: 1536, icon: "Monitor" },
];
```

Add `import type { LivePreviewBreakpoint } from "./types";` beside `constants.ts`'s other
imports (none exist yet — this is the file's only import).

```ts

```

#### packages/core/src/livePreview/index.ts

New file.

```ts
export * from "./types";
export * from "./constants";
```

#### packages/core/src/index.ts

1 edit — beside the existing `routes` export.

```ts
export * from "./routes";

export * from "./livePreview";
```

#### packages/core/src/types/generated.ts

1 addition — beside `GlobalDocumentBySlug` (`:298-302`), mirroring
`DocumentByCollectionSlug` (`:105-109`) for globals.

```ts
/**
 * Resolves the generated document interface for one global slug —
 * `GlobalDocumentBySlug[TGlobalSlug]`. Falls back to `VexDocumentGlobal<TGlobalSlug>`
 * before `vex generate` has run. Mirrors `DocumentByCollectionSlug` for globals.
 */
export type DocumentByGlobalSlug<TGlobalSlug extends GlobalSlug = GlobalSlug> =
  TGlobalSlug extends keyof GlobalDocumentBySlug
    ? GlobalDocumentBySlug[TGlobalSlug]
    : VexDocumentGlobal<TGlobalSlug>;
```

#### packages/core/src/config/types.ts

2 edits.

**1 — import.**

```ts
import type { LivePreviewConfigInput, LivePreviewConfig } from "../livePreview";
```

**2 — `VexClientConfigInput` and `VexClientConfig`**, beside the existing `routes`
member:

```ts
  /** Live-preview transport security config — the postMessage origin allowlist. */
  livePreview?: LivePreviewConfigInput;
```

```ts
/** Resolved live-preview transport security config. Empty allowlist by default. */
livePreview: LivePreviewConfig;
```

#### packages/core/src/config/config.ts

1 edit — beside the existing `routes: config?.routes,` line (`:134`):

```ts
    routes: config?.routes,
    livePreview: {
      allowedOrigins: config?.livePreview?.allowedOrigins ?? [],
      breakpoints: config?.livePreview?.breakpoints ?? DEFAULT_LIVE_PREVIEW_BREAKPOINTS,
    },
```

#### packages/core/src/config/config.test.ts

1 addition — mirrors the existing "schema defaults" block (`:52-66`).

```ts
describe("defineConfig — preview defaults", () => {
  it("defaults to an empty allowlist when preview is omitted", () => {
    const config = defineConfig();
    expect(config.livePreview.allowedOrigins).toEqual([]);
  });

  it("passes through a configured allowlist unchanged", () => {
    const config = defineConfig({
      livePreview: { allowedOrigins: ["https://admin.example.com"] },
    });
    expect(config.livePreview.allowedOrigins).toEqual([
      "https://admin.example.com",
    ]);
  });

  it("defaults breakpoints to the J-spec viewport matrix when omitted", () => {
    const config = defineConfig();
    expect(config.livePreview.breakpoints).toEqual(
      DEFAULT_LIVE_PREVIEW_BREAKPOINTS,
    );
  });

  it("passes through configured breakpoints unchanged", () => {
    const config = defineConfig({
      livePreview: { allowedOrigins: [], breakpoints: [{ width: 320 }] },
    });
    expect(config.livePreview.breakpoints).toEqual([{ width: 320 }]);
  });
});
```

Add `DEFAULT_LIVE_PREVIEW_BREAKPOINTS` to the file's existing `@vexcms/core` import.

#### packages/core/src/collections/types.ts

3 edits.

**1 — import**:

```ts
import type {
  AdminLivePreviewConfigInput,
  AdminLivePreviewConfig,
} from "../livePreview";
import type { DocumentByCollectionSlug } from "../types/generated";
```

**2 — `AdminCollectionConfigInput` and `AdminCollectionConfig`** (`:158-199`) each gain
a trailing `TCollectionSlug` generic (appended last, per F's established rule) and the
`livePreview` member, beside `table`:

```ts
export interface AdminCollectionConfigInput<
  TFieldSlug extends string = CoreAdminField,
  _TComponent extends ComponentHKT = ComponentHKT,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> {
  // … useAsTitle, icon, table — unchanged …
  livePreview?: AdminLivePreviewConfigInput<
    Partial<DocumentByCollectionSlug<TCollectionSlug>>
  >;
}
```

```ts
export interface AdminCollectionConfig<
  TFieldSlug extends string = CoreAdminField,
  _TComponent extends ComponentHKT = ComponentHKT,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> {
  // … useAsTitle, icon, table — unchanged …
  livePreview?: AdminLivePreviewConfig<
    Partial<DocumentByCollectionSlug<TCollectionSlug>>
  >;
}
```

**3 — `CollectionConfigInput` and `CollectionConfig`'s `admin` property** (`:240`,
`:297`) thread `TCollectionSlug` through as the new 3rd argument, guarded on the Input
side exactly like the existing `hooks` member:

```ts
  admin?: AdminCollectionConfigInput<
    TFieldSlug,
    TComponent,
    TCollectionSlug extends CollectionSlug ? TCollectionSlug : CollectionSlug
  >;
```

```ts
admin: AdminCollectionConfig<TFieldSlug, TComponent, TCollectionSlug>;
```

#### packages/core/src/collections/config.ts

1 edit — resolve `admin.livePreview`'s defaults, added to the existing
`admin: { useAsTitle: "_id", ...input.admin, table: {...} }` block (`:176-195`) as a
new sibling to `table`:

```ts
    admin: {
      useAsTitle: "_id",
      ...input.admin,
      table: {
        // … unchanged …
      },
      livePreview: input.admin?.livePreview && {
        url: input.admin.livePreview.url,
        debounceMs: input.admin.livePreview.debounceMs ?? DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS,
        defaultOpen: input.admin.livePreview.defaultOpen ?? false,
        breakpoints: input.admin.livePreview.breakpoints,
      },
    },
```

```ts
import { DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS } from "../livePreview";
```

#### packages/core/src/globals/types.ts

3 edits, mirroring collections. **Breaking** (P-025, `patch` in `pre` mode).

**1 — import**:

```ts
import type {
  AdminLivePreviewConfigInput,
  AdminLivePreviewConfig,
} from "../livePreview";
import type { DocumentByGlobalSlug } from "../types/generated";
```

**2 — `GlobalAdminConfigInput` and `GlobalAdminConfig`** (`:22-70`) each gain a
trailing `TGlobalSlug` generic and replace `livePreview?: { url: string };` at `:36`
and `:63`:

```ts
export interface GlobalAdminConfigInput<
  TComponent extends ComponentHKT = ComponentHKT,
  TGlobalSlug extends GlobalSlug = GlobalSlug,
> {
  // … group, description, icon, components — unchanged …
  livePreview?: AdminLivePreviewConfigInput<
    Partial<DocumentByGlobalSlug<TGlobalSlug>>
  >;
}
```

```ts
export interface GlobalAdminConfig<
  TComponent extends ComponentHKT = ComponentHKT,
  TGlobalSlug extends GlobalSlug = GlobalSlug,
> {
  // … group, description, icon, components — unchanged …
  livePreview?: AdminLivePreviewConfig<
    Partial<DocumentByGlobalSlug<TGlobalSlug>>
  >;
}
```

**3 — `GlobalConfigInput` and `GlobalConfig`'s `admin` property** (`:128`, `:171`):

```ts
  admin?: GlobalAdminConfigInput<
    TComponent,
    TGlobalSlug extends GlobalSlug ? TGlobalSlug : GlobalSlug
  >;
```

```ts
admin: GlobalAdminConfig<TComponent, TGlobalSlug>;
```

#### packages/core/src/globals/config.ts

1 edit — mirrors `collections/config.ts`, added to the existing
`admin: { group: "", description: "", components: {}, ...input.admin }` block
(`:84-89`):

```ts
    admin: {
      group: "",
      description: "",
      components: {},
      ...input.admin,
      livePreview: input.admin?.livePreview && {
        url: input.admin.livePreview.url,
        debounceMs: input.admin.livePreview.debounceMs ?? DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS,
        defaultOpen: input.admin.livePreview.defaultOpen ?? false,
        breakpoints: input.admin.livePreview.breakpoints,
      },
    },
```

```ts
import { DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS } from "../livePreview";
```

**Verify:** `pnpm --filter @vexcms/core build && pnpm --filter @vexcms/core test`

---

### Step 2 — `LivePreviewContext`: provider, `useLivePreview`, `useLivePreviewQuery` [dev]

#### packages/react/src/context/livePreviewProtocol.ts

New file. Full code — this is the wire contract, not behavior.

```ts
/**
 * Wire protocol for the live-preview transport (ADR-012) — carried over both
 * `postMessage` (to a captured window reference) and `BroadcastChannel`
 * (`LIVE_PREVIEW_BROADCAST_CHANNEL`, needing no reference at all; Design
 * Decision 4). Two message types:
 *
 * - `vex-live-preview-handshake` — sent by the preview surface on mount, so state
 *   is recovered without waiting for the next keystroke.
 * - `vex-live-preview-update` — sent by the admin panel on every debounced form
 *   change, carrying the form's **complete** current values (Design Decision 3).
 */
export const LIVE_PREVIEW_MESSAGE_SOURCE = "vexcms-live-preview" as const;

/** Shared `BroadcastChannel` name — one channel for every document a page renders. */
export const LIVE_PREVIEW_BROADCAST_CHANNEL = "vexcms-live-preview";

/** Sent by the preview surface on mount to request current unsaved state. */
export interface LivePreviewHandshakeMessage {
  source: typeof LIVE_PREVIEW_MESSAGE_SOURCE;
  type: "vex-live-preview-handshake";
  /** The collection or global slug the preview surface expects to render. */
  collectionSlug: string;
  /** The saved document id, when the previewed document already exists. */
  documentId?: string;
  /** The client-generated temp id, when previewing a document being created. */
  tempId?: string;
}

/** Sent by the admin panel whenever the form's values change. */
export interface LivePreviewUpdateMessage {
  source: typeof LIVE_PREVIEW_MESSAGE_SOURCE;
  type: "vex-live-preview-update";
  collectionSlug: string;
  documentId?: string;
  tempId?: string;
  /** The form's complete current top-level values for this document. */
  values: Record<string, unknown>;
}

export type LivePreviewMessage =
  LivePreviewHandshakeMessage | LivePreviewUpdateMessage;

/**
 * Narrows an arbitrary message payload to a `LivePreviewMessage`, so a listener
 * on either transport never trusts an unrelated message.
 */
export function isLivePreviewMessage(
  data: unknown,
): data is LivePreviewMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { source?: unknown }).source === LIVE_PREVIEW_MESSAGE_SOURCE
  );
}

/**
 * Returns the key `useLivePreview`'s `id → values` map stores one message's
 * values under — the saved document id when present, else the temp id.
 */
export function livePreviewKeyFor(message: {
  documentId?: string;
  tempId?: string;
}): string | undefined {
  return message.documentId ?? message.tempId;
}

/**
 * Opens a `BroadcastChannel` on the shared name, or `null` in an environment
 * without `BroadcastChannel` (older Safari, some test/SSR contexts) — every
 * caller treats `null` as "this transport is unavailable, rely on
 * `postMessage` alone" rather than throwing.
 */
export function openLivePreviewBroadcastChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  return new BroadcastChannel(LIVE_PREVIEW_BROADCAST_CHANNEL);
}
```

#### packages/react/src/context/livePreviewProtocol.test.ts

New file.

```ts
import { describe, expect, it, vi } from "vitest";
import {
  LIVE_PREVIEW_MESSAGE_SOURCE,
  isLivePreviewMessage,
  openLivePreviewBroadcastChannel,
  livePreviewKeyFor,
} from "./livePreviewProtocol";

describe("isLivePreviewMessage", () => {
  it("accepts a message carrying the vex-preview source", () => {
    expect(
      isLivePreviewMessage({
        source: LIVE_PREVIEW_MESSAGE_SOURCE,
        type: "vex-live-preview-handshake",
        collectionSlug: "pages",
      }),
    ).toBe(true);
  });

  it("rejects null, primitives, and unrelated objects", () => {
    expect(isLivePreviewMessage(null)).toBe(false);
    expect(isLivePreviewMessage("vex-live-preview-handshake")).toBe(false);
    expect(isLivePreviewMessage({ source: "some-other-widget" })).toBe(false);
    expect(isLivePreviewMessage({})).toBe(false);
  });
});

describe("livePreviewKeyFor", () => {
  it("prefers documentId over tempId when both are present", () => {
    expect(livePreviewKeyFor({ documentId: "doc1", tempId: "temp1" })).toBe(
      "doc1",
    );
  });

  it("falls back to tempId when documentId is absent", () => {
    expect(livePreviewKeyFor({ tempId: "temp1" })).toBe("temp1");
  });

  it("returns undefined when neither is present", () => {
    expect(livePreviewKeyFor({})).toBeUndefined();
  });
});

describe("openLivePreviewBroadcastChannel", () => {
  it("returns null when BroadcastChannel is unavailable", () => {
    const original = globalThis.BroadcastChannel;
    // @ts-expect-error simulating an environment without BroadcastChannel
    delete globalThis.BroadcastChannel;
    expect(openLivePreviewBroadcastChannel()).toBeNull();
    globalThis.BroadcastChannel = original;
  });

  it("opens a channel on the shared name when available", () => {
    const ChannelSpy = vi.fn();
    globalThis.BroadcastChannel =
      ChannelSpy as unknown as typeof BroadcastChannel;
    openLivePreviewBroadcastChannel();
    expect(ChannelSpy).toHaveBeenCalledWith("vexcms-live-preview");
  });
});
```

#### packages/react/src/context/LivePreviewContext.tsx

New file.

```tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getCollectionInputSchema,
  LIVE_PREVIEW_ID_PARAM,
  type CollectionConfig,
  type CollectionSlug,
  type DocumentByCollectionSlug,
  type LivePreviewBreakpoint,
} from "@vexcms/core";
import {
  LIVE_PREVIEW_MESSAGE_SOURCE,
  isLivePreviewMessage,
  openLivePreviewBroadcastChannel,
  livePreviewKeyFor,
  type LivePreviewHandshakeMessage,
} from "./livePreviewProtocol";

/**
 * Live-preview overlay state — an `id → unsaved values` map, per ADR-012.
 * `null` is the default so `useLivePreview` can tell "no provider mounted, or
 * preview mode disabled" from "provider mounted, nothing unsaved yet".
 */
const LivePreviewContext = createContext<Map<
  string,
  Record<string, unknown>
> | null>(null);

/**
 * Mounts the live-preview listener (both `postMessage` and `BroadcastChannel`,
 * Design Decision 4) for the subtree it wraps, and renders the floating
 * `LivePreviewIndicator` (Design Decision 10) alongside `children` whenever
 * `enabled` is true.
 *
 * Gated by `props.enabled` rather than by whether the caller renders this
 * component at all — `NextLivePreviewProvider` (`@vexcms/next`) always renders this
 * and passes the request-derived boolean straight through.
 *
 * @param props.enabled - Whether preview mode is active for this request.
 *   `false` renders `children` untouched, no listener, no indicator.
 * @param props.allowedOrigins - Explicitly configured origins permitted to
 *   post `postMessage` control frames (`config.livePreview.allowedOrigins`).
 *   Irrelevant to `BroadcastChannel`, which cannot cross origins at all.
 * @param props.collections - The resolved `collections` array, needed to
 *   validate an incoming message's `values` against the target collection's
 *   generated Zod schema before it ever reaches a render.
 * @param props.breakpoints - The root `livePreview.breakpoints` (Design Decision
 *   11), forwarded to `LivePreviewIndicator` for its pop-out resize controls.
 * @param props.children - The subtree that may call `useLivePreview`.
 */
export function LivePreviewProvider(props: {
  enabled: boolean;
  allowedOrigins: string[];
  collections: CollectionConfig[];
  breakpoints: LivePreviewBreakpoint[];
  children: ReactNode;
}) {
  const [valuesById, setValuesById] = useState<
    Map<string, Record<string, unknown>>
  >(() => new Map());

  useEffect(() => {
    if (!props.enabled) return;

    function applyIncomingValues(data: unknown) {
      if (!isLivePreviewMessage(data)) return;
      if (data.type !== "vex-live-preview-update") return;

      const targetCollection = props.collections.find(
        (collection) => collection.slug === data.collectionSlug,
      );
      if (!targetCollection) return;

      const parsedValues = getCollectionInputSchema({
        collection: targetCollection,
        partial: true,
      }).safeParse(data.values);
      if (!parsedValues.success) return;

      const previewKey = livePreviewKeyFor(data);
      if (!previewKey) return;

      setValuesById((previousValuesById) => {
        const nextValuesById = new Map(previousValuesById);
        nextValuesById.set(previewKey, parsedValues.data);
        return nextValuesById;
      });
    }

    function handleWindowMessage(event: MessageEvent) {
      if (!props.allowedOrigins.includes(event.origin)) return;
      applyIncomingValues(event.data);
    }

    function handleBroadcastMessage(event: MessageEvent) {
      // BroadcastChannel is same-origin by browser construction — no origin
      // check applies (there is nothing to check against).
      applyIncomingValues(event.data);
    }

    window.addEventListener("message", handleWindowMessage);
    const channel = openLivePreviewBroadcastChannel();
    channel?.addEventListener("message", handleBroadcastMessage);

    return () => {
      window.removeEventListener("message", handleWindowMessage);
      channel?.close();
    };
  }, [props.enabled, props.allowedOrigins, props.collections]);

  if (!props.enabled) return <>{props.children}</>;

  return (
    <LivePreviewContext.Provider value={valuesById}>
      {props.children}
      <LivePreviewIndicator breakpoints={props.breakpoints} />
    </LivePreviewContext.Provider>
  );
}

/**
 * Announces one render site to the admin panel on mount and whenever the
 * document identity it previews changes, over both transports. Internal to
 * `useLivePreview` — not exported.
 */
function useLivePreviewHandshake(props: {
  collectionSlug: string;
  documentId?: string;
  tempId?: string;
}): void {
  useEffect(() => {
    const handshakeMessage: LivePreviewHandshakeMessage = {
      source: LIVE_PREVIEW_MESSAGE_SOURCE,
      type: "vex-live-preview-handshake",
      collectionSlug: props.collectionSlug,
      documentId: props.documentId,
      tempId: props.tempId,
    };

    const previewParentWindow =
      window.parent !== window ? window.parent : window.opener;
    previewParentWindow?.postMessage(handshakeMessage, "*");

    const channel = openLivePreviewBroadcastChannel();
    channel?.postMessage(handshakeMessage);
    return () => channel?.close();
  }, [props.collectionSlug, props.documentId, props.tempId]);
}

/** Reads one query-string parameter from the current URL. */
function useLivePreviewSearchParam(paramName: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(paramName);
}

/**
 * Overlays unsaved editor values onto a document a consumer already fetched,
 * and announces this render site to the admin panel via the mount handshake.
 *
 * `collectionSlug` is a required second argument, not inferred from `doc` —
 * mirrors `useCollectionForm`'s `collection` argument, and is what types
 * `doc`/the return value to the exact generated document interface for that
 * collection (Design Decision 17). It also supplies the handshake/update
 * messages' `collectionSlug`, which has no other source once `doc` is `null`.
 *
 * @param doc - The document as fetched by the consumer's own query, or
 *   `null`/`undefined` while loading or for a not-yet-saved document.
 * @param collectionSlug - The collection `doc` belongs to.
 * @returns `doc` overlaid with unsaved values matching its `_id`, or — when
 *   `doc` is absent and the current URL carries a `vexLivePreviewId` matching an
 *   entry in the map — a document synthesized from the unsaved values alone.
 */
export function useLivePreview<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(
  doc: DocumentByCollectionSlug<TCollectionSlug> | null | undefined,
  collectionSlug: TCollectionSlug,
): DocumentByCollectionSlug<TCollectionSlug> | null | undefined {
  const valuesById = useContext(LivePreviewContext);
  const previewId = useLivePreviewSearchParam(LIVE_PREVIEW_ID_PARAM);

  useLivePreviewHandshake({
    collectionSlug,
    documentId: doc?._id,
    tempId: doc?._id ? undefined : (previewId ?? undefined),
  });

  return useMemo(() => {
    if (!valuesById) return doc;

    if (doc?._id) {
      const unsavedValues = valuesById.get(doc._id);
      return unsavedValues ? { ...doc, ...unsavedValues } : doc;
    }

    if (!previewId) return doc;
    const unsavedValues = valuesById.get(previewId);
    if (!unsavedValues) return doc;

    return {
      _id: previewId,
      _creationTime: Date.now(),
      ...unsavedValues,
    } as DocumentByCollectionSlug<TCollectionSlug>;
  }, [doc, valuesById, previewId]);
}

/**
 * Sugar composing `useQuery` with `useLivePreview` (Design Decision 12) — shaped
 * around a `getBySlug`-style query that resolves to an array, narrowed to its
 * first element the same way `PageContent.tsx` already does by hand.
 *
 * @example
 * ```tsx
 * const { data: page } = useLivePreviewQuery(
 *   { ...convexQuery(api.pages.getBySlug, { slug }), initialData },
 *   "pages",
 * );
 * ```
 */
export function useLivePreviewQuery<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(
  queryOptions: Parameters<
    typeof useQuery<DocumentByCollectionSlug<TCollectionSlug>[]>
  >[0],
  collectionSlug: TCollectionSlug,
): Omit<
  ReturnType<typeof useQuery<DocumentByCollectionSlug<TCollectionSlug>[]>>,
  "data"
> & {
  data: DocumentByCollectionSlug<TCollectionSlug> | undefined;
} {
  const queryResult = useQuery(queryOptions);
  const previewedDoc = useLivePreview(queryResult.data?.[0], collectionSlug);
  return { ...queryResult, data: previewedDoc ?? undefined };
}
```

**Verify:** `pnpm --filter @vexcms/react test -- livePreviewProtocol`

---

### Step 3 — Preview panel UI: resizable split pane, mobile overlay, floating indicator, sync [dev]

#### packages/react/package.json / pnpm-workspace.yaml

1 addition — the resizable split pane needs `react-resizable-panels` (Design
Decision 8; the existing `@hello-pangea/dnd` is a list-reorder library and cannot do
free split-pane resize). Add to the workspace catalog and as a `dependencies` +
matching `devDependencies` entry on `@vexcms/react` per P-013/P-014:

```yaml
# pnpm-workspace.yaml, catalog section
react-resizable-panels: ^2.1.0
```

```json
// packages/react/package.json
"dependencies": {
  "react-resizable-panels": "catalog:"
}
```

#### packages/react/src/components/ui/resizable.tsx

New file. shadcn-generated primitive (naming rule `shadcn-ui-kebab`) — this is the
standard shadcn "Resizable" component, wrapping `react-resizable-panels` exactly as
`ui.shadcn.com` ships it.

```tsx
"use client";

import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "../../styles/utils";

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  return (
    <ResizablePrimitive.PanelGroup
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

const ResizablePanel = ResizablePrimitive.Panel;

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      className={cn(
        "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-xs border bg-border">
          <GripVertical className="size-2.5" />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
```

#### packages/react/src/hooks/useLivePreviewPanelState.ts

New file (renamed from the earlier `useLivePreviewPanelState`).

```ts
"use client";

import { useCallback, useState } from "react";

const COOKIE_PREFIX = "vex-live-preview-panel:";

/**
 * Tracks whether the live-preview panel is open for one collection or
 * global, persisting the user's explicit choice in a cookie so a page refresh
 * reopens it instantly (Design Decision 9) instead of flashing closed then open.
 *
 * @param props.slug - Scopes the cookie per collection/global.
 * @param props.initialOpen - The server-read cookie-or-default value
 *   (`readLivePreviewPanelCookie`, below), threaded down from `NextAdminPage`.
 * @returns `isOpen` and a `toggle` function that flips it and rewrites the cookie.
 */
export function useLivePreviewPanelState(props: {
  slug: string;
  initialOpen: boolean;
}): { isOpen: boolean; toggle: () => void } {
  const [isOpen, setIsOpen] = useState(props.initialOpen);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      writeLivePreviewPanelCookie({ slug: props.slug, isOpen: next });
      return next;
    });
  }, [props.slug]);

  return { isOpen, toggle };
}

/**
 * Writes the panel's open/closed cookie client-side, guarded the way
 * `ThemeProvider.tsx`'s `writeStoredTheme` guards `localStorage`.
 */
function writeLivePreviewPanelCookie(props: {
  slug: string;
  isOpen: boolean;
}): void {
  try {
    const oneYearInSeconds = 60 * 60 * 24 * 365;
    document.cookie = `${COOKIE_PREFIX}${props.slug}=${props.isOpen ? "1" : "0"}; path=/; max-age=${oneYearInSeconds}; samesite=lax`;
  } catch {
    // document.cookie can throw under Safari private mode / strict cookie
    // settings; losing the panel preference is not worth crashing the view.
  }
}

/**
 * Reads the panel's open/closed cookie server-side, for `NextAdminPage`.
 *
 * @param props.cookieValue - The already-parsed value of the one cookie this reads.
 * @param props.defaultOpen - The collection/global's `admin.livePreview.defaultOpen` —
 *   the fallback used when no cookie has been written yet.
 * @returns `true`/`false` when the cookie holds an explicit `"1"`/`"0"`, else
 *   `props.defaultOpen`.
 */
export function readLivePreviewPanelCookie(props: {
  cookieValue: string | undefined;
  defaultOpen: boolean;
}): boolean {
  if (props.cookieValue === "1") return true;
  if (props.cookieValue === "0") return false;
  return props.defaultOpen;
}
```

#### packages/react/src/hooks/useLivePreviewPanelState.test.ts

New file.

```ts
import { describe, expect, it } from "vitest";
import { readLivePreviewPanelCookie } from "./useLivePreviewPanelState";

describe("readLivePreviewPanelCookie", () => {
  it("returns true for an explicit '1', regardless of defaultOpen", () => {
    expect(
      readLivePreviewPanelCookie({ cookieValue: "1", defaultOpen: false }),
    ).toBe(true);
  });

  it("returns false for an explicit '0', regardless of defaultOpen", () => {
    expect(
      readLivePreviewPanelCookie({ cookieValue: "0", defaultOpen: true }),
    ).toBe(false);
  });

  it("falls back to defaultOpen when no cookie has been written yet", () => {
    expect(
      readLivePreviewPanelCookie({ cookieValue: undefined, defaultOpen: true }),
    ).toBe(true);
    expect(
      readLivePreviewPanelCookie({
        cookieValue: undefined,
        defaultOpen: false,
      }),
    ).toBe(false);
  });

  it("falls back to defaultOpen for a garbage cookie value", () => {
    expect(
      readLivePreviewPanelCookie({ cookieValue: "true", defaultOpen: true }),
    ).toBe(true);
  });
});
```

#### packages/react/src/hooks/useLivePreviewSync.ts

New file (renamed from `useLivePreviewSync`; now dual-transport with a handshake-reply
listener per Design Decision 6).

```ts
"use client";

import { useEffect } from "react";
import { useStore } from "@tanstack/react-form";
import { DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS } from "@vexcms/core";
import type { AnyFormApi } from "../components/form/AppFormContext";
import {
  LIVE_PREVIEW_MESSAGE_SOURCE,
  isLivePreviewMessage,
  openLivePreviewBroadcastChannel,
  livePreviewKeyFor,
  type LivePreviewUpdateMessage,
} from "../context/livePreviewProtocol";

/**
 * Posts the form's complete current values to the active preview target, on
 * both `BroadcastChannel` and (when a window reference is held) `postMessage`
 * (Design Decision 4), on every change, debounced. Also listens for a
 * matching `vex-live-preview-handshake` over `BroadcastChannel` and replies
 * immediately with the current values (Design Decision 6) — recovering state
 * for a tab this admin session never opened itself.
 *
 * @param props.form - The edit view's form instance.
 * @param props.collectionSlug - The collection or global slug being previewed.
 * @param props.documentId - The saved document id, once it exists.
 * @param props.tempId - The client-generated temp id, before the first save.
 * @param props.targetWindow - The currently active preview surface's window —
 *   the iframe's `contentWindow`, the pop-out's `window.open()` handle, or
 *   `null` when neither is open. `postMessage` no-ops without one;
 *   `BroadcastChannel` posts regardless.
 * @param props.debounceMs - Milliseconds to wait after the last form change
 *   before posting. Defaults to `DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS`.
 */
export function useLivePreviewSync(props: {
  form: AnyFormApi;
  collectionSlug: string;
  documentId?: string;
  tempId?: string;
  targetWindow: Window | null;
  debounceMs?: number;
}): void {
  const values = useStore(props.form.store, (state) => state.values);
  const debounceMs = Math.max(
    props.debounceMs ?? DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS,
    DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS,
  );
  const previewKey = props.documentId ?? props.tempId;

  useEffect(() => {
    if (!previewKey) return;
    const channel = openLivePreviewBroadcastChannel();

    function postUpdate() {
      const updateMessage: LivePreviewUpdateMessage = {
        source: LIVE_PREVIEW_MESSAGE_SOURCE,
        type: "vex-live-preview-update",
        collectionSlug: props.collectionSlug,
        documentId: props.documentId,
        tempId: props.tempId,
        values,
      };
      channel?.postMessage(updateMessage);
      props.targetWindow?.postMessage(updateMessage, "*");
    }

    function handleChannelMessage(event: MessageEvent) {
      if (!isLivePreviewMessage(event.data)) return;
      if (event.data.type !== "vex-live-preview-handshake") return;
      if (livePreviewKeyFor(event.data) !== previewKey) return;
      postUpdate();
    }

    channel?.addEventListener("message", handleChannelMessage);
    const syncTimeoutId = setTimeout(postUpdate, debounceMs);

    return () => {
      clearTimeout(syncTimeoutId);
      channel?.close();
    };
  }, [
    values,
    previewKey,
    debounceMs,
    props.targetWindow,
    props.collectionSlug,
    props.documentId,
    props.tempId,
  ]);
}
```

#### packages/react/src/hooks/useLivePreviewSync.test.ts

New file. Full code.

```tsx
import { act, renderHook } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLivePreviewSync } from "./useLivePreviewSync";
import { LIVE_PREVIEW_MESSAGE_SOURCE } from "../context/livePreviewProtocol";

class FakeBroadcastChannel {
  static instances: FakeBroadcastChannel[] = [];
  name: string;
  postMessage = vi.fn();
  onmessage: ((event: MessageEvent) => void) | null = null;
  private listeners: ((event: MessageEvent) => void)[] = [];
  constructor(name: string) {
    this.name = name;
    FakeBroadcastChannel.instances.push(this);
  }
  addEventListener(_type: "message", listener: (event: MessageEvent) => void) {
    this.listeners.push(listener);
  }
  close() {}
  emit(data: unknown) {
    this.listeners.forEach((listener) => listener({ data } as MessageEvent));
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  FakeBroadcastChannel.instances = [];
  vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function renderWithForm(targetWindow: Window | null) {
  const { result } = renderHook(() => {
    const form = useForm({ defaultValues: { title: "Draft" } });
    useLivePreviewSync({
      form,
      collectionSlug: "pages",
      documentId: "doc1",
      targetWindow,
    });
    return form;
  });
  return result;
}

describe("useLivePreviewSync", () => {
  it("posts a debounced full-snapshot update over BroadcastChannel and postMessage", async () => {
    const postMessage = vi.fn();
    const fakeWindow = { postMessage } as unknown as Window;
    const form = renderWithForm(fakeWindow);

    await act(async () =>
      form.current.setFieldValue("title", "Published title"),
    );
    expect(postMessage).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTime(150));

    const expectedMessage = expect.objectContaining({
      type: "vex-live-preview-update",
      collectionSlug: "pages",
      documentId: "doc1",
      values: { title: "Published title" },
    });
    expect(postMessage).toHaveBeenCalledWith(expectedMessage, "*");
    expect(FakeBroadcastChannel.instances[0]?.postMessage).toHaveBeenCalledWith(
      expectedMessage,
    );
  });

  it("still broadcasts when no window reference is held", async () => {
    const form = renderWithForm(null);
    await act(async () =>
      form.current.setFieldValue("title", "Published title"),
    );
    await act(async () => vi.advanceTimersByTime(150));
    expect(FakeBroadcastChannel.instances[0]?.postMessage).toHaveBeenCalled();
  });

  it("replies immediately over BroadcastChannel to a matching handshake", async () => {
    renderWithForm(null);
    await act(async () => vi.advanceTimersByTime(150));
    FakeBroadcastChannel.instances[0]?.postMessage.mockClear();

    await act(async () => {
      FakeBroadcastChannel.instances[0]?.emit({
        source: LIVE_PREVIEW_MESSAGE_SOURCE,
        type: "vex-live-preview-handshake",
        collectionSlug: "pages",
        documentId: "doc1",
      });
    });

    expect(FakeBroadcastChannel.instances[0]?.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "vex-live-preview-update",
        documentId: "doc1",
      }),
    );
  });

  it("ignores a handshake for a different document", async () => {
    renderWithForm(null);
    await act(async () => vi.advanceTimersByTime(150));
    FakeBroadcastChannel.instances[0]?.postMessage.mockClear();

    await act(async () => {
      FakeBroadcastChannel.instances[0]?.emit({
        source: LIVE_PREVIEW_MESSAGE_SOURCE,
        type: "vex-live-preview-handshake",
        collectionSlug: "pages",
        documentId: "some-other-doc",
      });
    });

    expect(
      FakeBroadcastChannel.instances[0]?.postMessage,
    ).not.toHaveBeenCalled();
  });
});
```

#### packages/react/src/components/livePreview/LivePreviewIndicator.tsx

New file.

```tsx
"use client";

import { useCallback, useRef, useState } from "react";
import type { LivePreviewBreakpoint } from "@vexcms/core";
import { Icon } from "../Icon";
import { cn } from "../../styles/utils";

const POSITION_STORAGE_KEY = "vex-live-preview-indicator-position";

type LivePreviewIndicatorEdge = "left" | "right";

interface LivePreviewIndicatorPosition {
  edge: LivePreviewIndicatorEdge;
  /** Distance in pixels from the top of the viewport to the indicator's center. */
  offsetY: number;
}

const DEFAULT_POSITION: LivePreviewIndicatorPosition = {
  edge: "right",
  offsetY: 200,
};

/**
 * Reads/writes the indicator's last dropped position. A UI convenience only —
 * unlike the panel's open/closed cookie, a wrong position on first paint is
 * cosmetic, not a content-shift problem, so plain `localStorage` (no SSR
 * concern) is enough.
 */
function readStoredPosition(): LivePreviewIndicatorPosition {
  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY);
    return raw
      ? (JSON.parse(raw) as LivePreviewIndicatorPosition)
      : DEFAULT_POSITION;
  } catch {
    return DEFAULT_POSITION;
  }
}

function writeStoredPosition(position: LivePreviewIndicatorPosition): void {
  try {
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
  } catch {
    // Ignored — same reasoning as useLivePreviewPanelState's cookie guard.
  }
}

/**
 * `true` only for a window the admin's own "pop out" button opened —
 * `window.resizeTo` is a browser-security no-op on any window not opened by
 * script, so the width-preset row (Design Decision 10) is omitted rather
 * than shown non-functional.
 */
function isResizableWindow(): boolean {
  return (
    typeof window !== "undefined" &&
    window.top === window.self &&
    window.opener != null
  );
}

/**
 * Floating, draggable, collapsible badge marking the page as a live preview
 * (Design Decision 10). Rendered by `LivePreviewProvider` whenever `enabled`
 * is true — exists on the real page regardless of how it was opened.
 *
 * Collapsed: a small tab fixed to the last-dropped edge. Dragging it (plain
 * pointer events) previews the move live and snaps to the nearest edge on
 * release. Expanded: the "Live Preview" label, plus — only in a script-opened
 * top-level window — a row of `props.breakpoints` buttons that call
 * `window.resizeTo(width, window.outerHeight)`.
 *
 * @param props.breakpoints - The root `livePreview.breakpoints` (Design Decision
 *   11), forwarded from `LivePreviewProvider`.
 */
export function LivePreviewIndicator(props: {
  breakpoints: LivePreviewBreakpoint[];
}) {
  const [position, setPosition] = useState<LivePreviewIndicatorPosition>(() =>
    readStoredPosition(),
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const dragStart = useRef<{ pointerStartY: number; offsetYStart: number } | null>(null);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      dragStart.current = { pointerStartY: event.clientY, offsetYStart: position.offsetY };
      setIsDragging(true);
    },
    [position.offsetY],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !dragStart.current) return;
      const pointerDeltaY = event.clientY - dragStart.current.pointerStartY;
      const nextOffsetY = Math.min(
        window.innerHeight,
        Math.max(0, dragStart.current.offsetYStart + pointerDeltaY),
      );
      setPosition((prev) => ({ ...prev, offsetY: nextOffsetY }));
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      setIsDragging(false);
      const snappedEdge: LivePreviewIndicatorEdge =
        event.clientX < window.innerWidth / 2 ? "left" : "right";
      const snappedPosition: LivePreviewIndicatorPosition = {
        edge: snappedEdge,
        offsetY: position.offsetY,
      };
      setPosition(snappedPosition);
      writeStoredPosition(snappedPosition);
    },
    [isDragging, position.offsetY],
  );

  return (
    <div
      className={cn(
        "fixed z-[9999] -translate-y-1/2 select-none",
        position.edge === "left" ? "left-0" : "right-0",
      )}
      style={{ top: position.offsetY }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {isExpanded ? (
        <div className="flex flex-col gap-2 rounded-md border bg-background p-3 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">Live Preview</span>
            <button
              type="button"
              className="text-xs text-muted-foreground"
              onClick={() => setIsExpanded(false)}
            >
              Collapse
            </button>
          </div>
          {isResizableWindow() && (
            <div className="flex flex-wrap gap-1">
              {props.breakpoints.map((breakpoint) => (
                <button
                  key={breakpoint.width}
                  type="button"
                  className="rounded border px-2 py-1 text-xs"
                  title={breakpoint.icon ? breakpoint.label : undefined}
                  aria-label={breakpoint.icon ? breakpoint.label : undefined}
                  onClick={() =>
                    window.resizeTo(breakpoint.width, window.outerHeight)
                  }
                >
                  {breakpoint.icon ? (
                    <Icon name={breakpoint.icon} className="size-3.5" />
                  ) : (
                    breakpoint.label
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="cursor-grab rounded-md border bg-background px-2 py-3 text-xs shadow-lg [writing-mode:vertical-rl]"
          onClick={() => setIsExpanded(true)}
        >
          Preview
        </button>
      )}
    </div>
  );
}
```

#### packages/react/src/components/livePreview/LivePreviewIndicator.test.tsx

New file.

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LivePreviewIndicator } from "./LivePreviewIndicator";

const SAMPLE_BREAKPOINTS = [
  { label: "iPhone SE", width: 375 },
  { label: "iPhone 14/15", width: 390 },
];

describe("LivePreviewIndicator", () => {
  it("renders collapsed by default with no stored position", () => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    render(<LivePreviewIndicator breakpoints={SAMPLE_BREAKPOINTS} />);
    expect(screen.getByRole("button", { name: "Preview" })).toBeInTheDocument();
  });

  it("expands to show the Live Preview label on click", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    render(<LivePreviewIndicator breakpoints={SAMPLE_BREAKPOINTS} />);
    screen.getByRole("button", { name: "Preview" }).click();
    expect(await screen.findByText("Live Preview")).toBeInTheDocument();
  });

  it("omits the width-preset row when the window was not opened by script", async () => {
    render(<LivePreviewIndicator breakpoints={SAMPLE_BREAKPOINTS} />);
    screen.getByRole("button", { name: "Preview" }).click();
    expect(await screen.findByText("Live Preview")).toBeInTheDocument();
    expect(screen.queryByText("iPhone SE")).not.toBeInTheDocument();
  });

  it("renders an icon instead of the label, using the label as the title, once opened by script", async () => {
    vi.stubGlobal("opener", window);
    render(
      <LivePreviewIndicator
        breakpoints={[{ label: "iPhone SE", width: 375, icon: "Smartphone" }]}
      />,
    );
    screen.getByRole("button", { name: "Preview" }).click();
    await screen.findByText("Live Preview");

    const presetButton = await screen.findByTitle("iPhone SE");
    expect(presetButton.querySelector("svg")).toBeInTheDocument();
    expect(presetButton).not.toHaveTextContent("iPhone SE");
    vi.unstubAllGlobals();
  });
});
```

#### packages/react/src/components/livePreview/LivePreviewPanel.tsx

New file (renamed from `LivePreviewPanel`). No longer owns its own fixed width — the
resizable split (`ResizablePanelGroup`, Step 4) or the mobile full-screen wrapper owns
sizing; this component owns the toolbar, the breakpoint toggle row, the iframe, and the
pop-out.

```tsx
"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  LIVE_PREVIEW_COLLECTION_PARAM,
  LIVE_PREVIEW_ID_PARAM,
  type LivePreviewBreakpoint,
  type LivePreviewUrlResolver,
} from "@vexcms/core";
import type { AnyFormApi } from "../form/AppFormContext";
import { useLivePreviewSync } from "../../hooks/useLivePreviewSync";
import { Button } from "../ui";
import { Icon } from "../Icon";
import { cn } from "../../styles/utils";
import { SquareArrowOutUpRight, X } from "lucide-react";

/**
 * Measures a container element's rendered pixel size via `ResizeObserver`,
 * so the preview surface can compute how much space it actually has —
 * `react-resizable-panels` lays out with percentages/flex, not pixel props,
 * so nothing else tells a child its allotted width.
 */
function useLivePreviewContainerSize(
  containerRef: RefObject<HTMLDivElement | null>,
): {
  width: number;
  height: number;
} {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    setSize({ width: element.clientWidth, height: element.clientHeight });

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [containerRef]);

  return size;
}

/**
 * Computes the un-scaled iframe dimensions, the CSS `transform: scale(...)`
 * factor, and the horizontal offset needed to center it — pure, so it is
 * fully unit-testable with no DOM (Design Decision 11).
 *
 * `breakpointWidth: null` ("Full width") passes the container's own size
 * straight through — scale 1, no offset.
 *
 * Otherwise: `scale = min(1, containerWidth / breakpointWidth)`. A narrower
 * breakpoint than the container renders at its real width, centered, with
 * letterboxing on both sides (scale stays 1). A wider breakpoint renders
 * internally at its full width — so the page's own CSS media queries fire
 * exactly as they would at that real device size — visually scaled down to
 * exactly fill the available space.
 */
export function computeLivePreviewFrameGeometry(props: {
  containerWidth: number;
  containerHeight: number;
  breakpointWidth: number | null;
}): { width: number; height: number; scale: number; left: number } {
  if (!props.breakpointWidth || props.containerWidth === 0) {
    return {
      width: props.containerWidth,
      height: props.containerHeight,
      scale: 1,
      left: 0,
    };
  }

  const scale = Math.min(1, props.containerWidth / props.breakpointWidth);
  const scaledWidth = props.breakpointWidth * scale;
  const left = Math.max(0, (props.containerWidth - scaledWidth) / 2);

  return {
    width: props.breakpointWidth,
    height: props.containerHeight / scale,
    scale,
    left,
  };
}

/**
 * The live-preview surface rendered beside (desktop, inside a `ResizablePanel`)
 * or over (mobile, `isMobile`) a collection or global edit form. Renders an
 * iframe pointed at the resolved preview URL, tracks an optional pop-out
 * window (the raw preview URL — no wrapper route; the floating
 * `LivePreviewIndicator`, rendered by `LivePreviewProvider` on the actual target
 * page, supplies the device-width controls there), and syncs form values to
 * whichever surface is open via `useLivePreviewSync`.
 *
 * @param props.previewUrl - The resolved URL for the CURRENT form values.
 * @param props.collectionSlug - The collection or global slug being previewed.
 * @param props.documentId - The saved document id, once it exists.
 * @param props.tempId - The client-generated temp id, before the first save.
 * @param props.debounceMs - Forwarded to `useLivePreviewSync`.
 * @param props.breakpoints - Toggle-able simulated widths (Design Decision
 *   11) — `collection.admin.livePreview.breakpoints ?? config.livePreview.breakpoints`,
 *   resolved by the caller. The toggle row is not rendered when `isMobile`.
 * @param props.form - The edit view's form instance, forwarded to `useLivePreviewSync`.
 * @param props.isMobile - Renders `fixed inset-0` full-screen with a close
 *   button instead of filling its parent (Design Decision 9). Requires `onClose`.
 * @param props.onClose - Required when `isMobile` — called by the close button.
 */
export function LivePreviewPanel(props: {
  previewUrl: string;
  collectionSlug: string;
  documentId?: string;
  tempId?: string;
  debounceMs?: number;
  breakpoints: LivePreviewBreakpoint[];
  form: AnyFormApi;
  isMobile?: boolean;
  onClose?: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [poppedWindow, setPoppedWindow] = useState<Window | null>(null);
  const [selectedBreakpoint, setSelectedBreakpoint] =
    useState<LivePreviewBreakpoint | null>(null);
  const containerSize = useLivePreviewContainerSize(containerRef);

  useLivePreviewSync({
    form: props.form,
    collectionSlug: props.collectionSlug,
    documentId: props.documentId,
    tempId: props.tempId,
    debounceMs: props.debounceMs,
    targetWindow: poppedWindow ?? iframeRef.current?.contentWindow ?? null,
  });

  function handlePopOut() {
    const openedWindow = window.open(props.previewUrl, "vex-live-preview");
    if (!openedWindow) return;

    setPoppedWindow(openedWindow);
    const closeCheckIntervalId = setInterval(() => {
      if (openedWindow.closed) {
        setPoppedWindow(null);
        clearInterval(closeCheckIntervalId);
      }
    }, 500);
  }

  const geometry = computeLivePreviewFrameGeometry({
    containerWidth: containerSize.width,
    containerHeight: containerSize.height,
    breakpointWidth: props.isMobile
      ? null
      : (selectedBreakpoint?.width ?? null),
  });

  return (
    <div
      className={
        props.isMobile
          ? "fixed inset-0 z-50 flex flex-col bg-background"
          : "flex h-full flex-col pl-4"
      }
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Live preview</span>
        <div className="flex gap-1">
          {!props.isMobile && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handlePopOut}
            >
              <SquareArrowOutUpRight className="size-4" />
            </Button>
          )}
          {props.isMobile && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={props.onClose}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>
      {!props.isMobile && (
        <div className="mb-2 flex flex-wrap gap-1">
          <button
            type="button"
            className={cn(
              "rounded border px-2 py-1 text-xs",
              !selectedBreakpoint && "bg-accent",
            )}
            onClick={() => setSelectedBreakpoint(null)}
          >
            Full width
          </button>
          {props.breakpoints.map((breakpoint) => (
            <button
              key={breakpoint.width}
              type="button"
              className={cn(
                "rounded border px-2 py-1 text-xs",
                selectedBreakpoint?.width === breakpoint.width && "bg-accent",
              )}
              title={breakpoint.icon ? breakpoint.label : undefined}
              aria-label={breakpoint.icon ? breakpoint.label : undefined}
              onClick={() => setSelectedBreakpoint(breakpoint)}
            >
              {breakpoint.icon ? (
                <Icon name={breakpoint.icon} className="size-3.5" />
              ) : (
                breakpoint.label
              )}
            </button>
          ))}
        </div>
      )}
      <div
        ref={containerRef}
        className={
          props.isMobile
            ? "relative flex-1"
            : "relative h-[calc(100vh-theme(spacing.44))] overflow-hidden rounded-md border bg-muted/30"
        }
      >
        <div
          style={{
            position: "absolute",
            left: geometry.left,
            top: 0,
            width: geometry.width,
            height: geometry.height,
            transform: `scale(${geometry.scale})`,
            transformOrigin: "top left",
          }}
        >
          <iframe
            ref={iframeRef}
            src={props.previewUrl}
            className="h-full w-full border-0"
            title="Live preview"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Resolves the preview URL for the current form values, appending temp-id
 * query params only when the document has no saved `_id` yet (Design
 * Decision 13).
 *
 * @param props.url - Cast down at the call site to the loose
 *   `LivePreviewUrlResolver` default (Design Decision 17).
 */
export function resolveLivePreviewUrl(props: {
  url: LivePreviewUrlResolver | undefined;
  collectionSlug: string;
  baseDoc: Record<string, unknown>;
  formValues: Record<string, unknown>;
  tempId?: string;
}): string | undefined {
  if (!props.url) return undefined;

  const documentId = props.baseDoc._id as string | undefined;
  const previewDoc = {
    ...props.baseDoc,
    ...props.formValues,
    _id: documentId ?? props.tempId,
  };
  const resolvedUrl = props.url(previewDoc);
  if (!resolvedUrl) return undefined;
  if (documentId || !props.tempId) return resolvedUrl;

  const querySeparator = resolvedUrl.includes("?") ? "&" : "?";
  return (
    `${resolvedUrl}${querySeparator}` +
    `${LIVE_PREVIEW_ID_PARAM}=${encodeURIComponent(props.tempId)}&` +
    `${LIVE_PREVIEW_COLLECTION_PARAM}=${encodeURIComponent(props.collectionSlug)}`
  );
}
```

#### packages/react/src/components/livePreview/LivePreviewPanel.test.tsx

New file (renamed; test bodies unchanged in substance from the earlier
`resolveLivePreviewUrl` suite, now against `resolveLivePreviewUrl`).

```ts
import { describe, expect, it } from "vitest";
import {
  computeLivePreviewFrameGeometry,
  resolveLivePreviewUrl,
} from "./LivePreviewPanel";

describe("computeLivePreviewFrameGeometry", () => {
  it("passes the container size through unscaled when no breakpoint is selected", () => {
    expect(
      computeLivePreviewFrameGeometry({
        containerWidth: 500,
        containerHeight: 800,
        breakpointWidth: null,
      }),
    ).toEqual({ width: 500, height: 800, scale: 1, left: 0 });
  });

  it("centers a breakpoint narrower than the container at scale 1", () => {
    const geometry = computeLivePreviewFrameGeometry({
      containerWidth: 800,
      containerHeight: 600,
      breakpointWidth: 375,
    });
    expect(geometry).toEqual({
      width: 375,
      height: 600,
      scale: 1,
      left: (800 - 375) / 2,
    });
  });

  it("scales a breakpoint wider than the container down to exactly fill it", () => {
    const geometry = computeLivePreviewFrameGeometry({
      containerWidth: 500,
      containerHeight: 600,
      breakpointWidth: 1000,
    });
    expect(geometry).toEqual({
      width: 1000,
      height: 1200,
      scale: 0.5,
      left: 0,
    });
    // Visually: 1000 * 0.5 = 500 (exactly the container width), 1200 * 0.5 = 600.
  });

  it("returns the container size unscaled when it has not been measured yet", () => {
    expect(
      computeLivePreviewFrameGeometry({
        containerWidth: 0,
        containerHeight: 0,
        breakpointWidth: 375,
      }),
    ).toEqual({ width: 0, height: 0, scale: 1, left: 0 });
  });
});

describe("resolveLivePreviewUrl", () => {
  it("returns undefined when no resolver is configured", () => {
    expect(
      resolveLivePreviewUrl({
        url: undefined,
        collectionSlug: "pages",
        baseDoc: {},
        formValues: { slug: "about" },
      }),
    ).toBeUndefined();
  });

  it("uses a saved document's URL unmodified, with no temp-id query params", () => {
    const url = resolveLivePreviewUrl({
      url: (doc) => (typeof doc.slug === "string" ? `/${doc.slug}` : undefined),
      collectionSlug: "pages",
      baseDoc: { _id: "doc1", slug: "old-slug" },
      formValues: { slug: "new-slug" },
      tempId: "temp-123",
    });
    expect(url).toBe("/new-slug");
  });

  it("appends vexLivePreviewId and vexLivePreviewCollection for an unsaved document", () => {
    const url = resolveLivePreviewUrl({
      url: (doc) => (typeof doc.slug === "string" ? `/${doc.slug}` : undefined),
      collectionSlug: "pages",
      baseDoc: {},
      formValues: { slug: "draft-post" },
      tempId: "temp-123",
    });
    expect(url).toBe(
      "/draft-post?vexLivePreviewId=temp-123&vexLivePreviewCollection=pages",
    );
  });

  it("passes the temp id as _id to the resolver when the document has no saved id", () => {
    const seenIds: unknown[] = [];
    resolveLivePreviewUrl({
      url: (doc) => {
        seenIds.push(doc._id);
        return undefined;
      },
      collectionSlug: "pages",
      baseDoc: {},
      formValues: { slug: "draft" },
      tempId: "temp-123",
    });
    expect(seenIds).toEqual(["temp-123"]);
  });

  it("returns undefined when the resolver itself cannot resolve yet", () => {
    expect(
      resolveLivePreviewUrl({
        url: () => undefined,
        collectionSlug: "pages",
        baseDoc: {},
        formValues: {},
      }),
    ).toBeUndefined();
  });
});
```

**Verify:** `pnpm --filter @vexcms/react test -- LivePreviewPanel LivePreviewIndicator useLivePreviewSync useLivePreviewPanelState`

---

### Step 4 — Wire `CollectionEditView`, `GlobalEditView`, `NextAdminPage` [dev]

#### packages/core/src/framework.ts

1 edit each — `CollectionEditViewProps` (`:85-101`) and `GlobalEditViewProps`
(`:111-122`), beside `initialData`:

```ts
  /**
   * The live-preview panel's initial open state, read server-side from the
   * `vex-live-preview-panel:<slug>` cookie (or the collection/global's
   * `admin.livePreview.defaultOpen` when no cookie exists) by `NextAdminPage`.
   */
  initialPreviewPanelOpen?: boolean;
```

#### packages/react/src/components/views/CollectionEditView.tsx

6 edits — everything else in the file (the query, the form, `useLiveFieldMerge`,
permissions) is unchanged.

**1 — imports.**

```ts
import { useState } from "react";
import { useStore } from "@tanstack/react-form";
import type { LivePreviewUrlResolver } from "@vexcms/core";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../ui/resizable";
import { useIsMobile } from "../../hooks/use-mobile";
import { useLivePreviewPanelState } from "../../hooks/useLivePreviewPanelState";
import {
  LivePreviewPanel,
  resolveLivePreviewUrl,
} from "../livePreview/LivePreviewPanel";
```

**2 — temp id and panel state, beside the existing `fieldPermissions` line
(`:117-121`).**

```ts
const [tempId] = useState(() => crypto.randomUUID());
const formValues = useStore(form.store, (state) => state.values);
const isMobile = useIsMobile();
const previewPanel = useLivePreviewPanelState({
  slug: collection.slug,
  initialOpen: props.initialPreviewPanelOpen ?? false,
});
const previewUrl = resolveLivePreviewUrl({
  url: collection.admin.livePreview?.url as LivePreviewUrlResolver | undefined,
  collectionSlug: collection.slug,
  baseDoc: currentDocument,
  formValues,
  tempId,
});
const previewIsActive = Boolean(
  collection.admin.livePreview && previewPanel.isOpen && previewUrl,
);
const breakpoints =
  collection.admin.livePreview?.breakpoints ?? config.livePreview.breakpoints;
```

**3 — the toggle button, inside the existing `form.Subscribe` button group
(`:134-155`), added alongside the `RevalidateButton`.**

```tsx
{
  collection.admin.livePreview && (
    <Button type="button" variant="outline" onClick={previewPanel.toggle}>
      {previewPanel.isOpen ? "Hide preview" : "Show preview"}
    </Button>
  );
}
```

**4 — extract the sticky header + fields grid into a local variable**, since the
resizable branch and the plain branch both render it unchanged:

```tsx
const formContent = (
  <>
    {/* … existing sticky header (:124-158), unchanged … */}
    {/* … existing fields grid (:159-177), unchanged … */}
  </>
);
```

**5 — the returned JSX (`:122-180`) branches on `previewIsActive` and `isMobile`.**

```tsx
return (
  <AppForm form={form} className="relative">
    {previewIsActive && !isMobile ? (
      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId={`vex-livePreview:${collection.slug}`}
      >
        <ResizablePanel defaultSize={60} minSize={30}>
          <div className="pr-4">{formContent}</div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={20}>
          <LivePreviewPanel
            previewUrl={previewUrl!}
            collectionSlug={collection.slug}
            documentId={currentDocument._id}
            tempId={currentDocument._id ? undefined : tempId}
            debounceMs={collection.admin.livePreview!.debounceMs}
            breakpoints={breakpoints}
            form={form}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    ) : (
      formContent
    )}
    {previewIsActive && isMobile && (
      <LivePreviewPanel
        previewUrl={previewUrl!}
        collectionSlug={collection.slug}
        documentId={currentDocument._id}
        tempId={currentDocument._id ? undefined : tempId}
        debounceMs={collection.admin.livePreview!.debounceMs}
        breakpoints={breakpoints}
        form={form}
        isMobile
        onClose={previewPanel.toggle}
      />
    )}
  </AppForm>
);
```

#### packages/react/src/components/views/GlobalEditView.tsx

The same six edits, mirrored — `collection.admin.livePreview` → `global.admin.livePreview`,
`collection.slug` → `global.slug`, `config.livePreview.breakpoints` unchanged (`config` is
the same `useVexConfig()` result). Skip the temp-id `useState` and `LivePreviewPanel`'s
`tempId`/`documentId` props — a global is always upserted against an existing slug.

#### packages/react/src/index.ts

1 edit:

```ts
export {
  LivePreviewPanel,
  resolveLivePreviewUrl,
} from "./components/livePreview/LivePreviewPanel";
export { LivePreviewIndicator } from "./components/livePreview/LivePreviewIndicator";
export {
  LivePreviewProvider,
  useLivePreview,
  useLivePreviewQuery,
} from "./context/LivePreviewContext";
export {
  useLivePreviewPanelState,
  readLivePreviewPanelCookie,
} from "./hooks/useLivePreviewPanelState";
export {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "./components/ui/resizable";
```

#### packages/next/src/NextAdminPage.tsx

2 edits.

**1 — import.**

```ts
import { cookies } from "next/headers";
import { readLivePreviewPanelCookie } from "@vexcms/react";
```

**2 — thread the cookie into both `CollectionEditView` (`:141-147`) and
`GlobalEditView` (`:82`).**

```ts
const cookieStore = await cookies();
```

```tsx
return (
  <GlobalEditView
    global={globalConfig.slug}
    initialData={global}
    initialPreviewPanelOpen={readLivePreviewPanelCookie({
      cookieValue: cookieStore.get(
        `vex-live-preview-panel:${globalConfig.slug}`,
      )?.value,
      defaultOpen: globalConfig.admin.livePreview?.defaultOpen ?? false,
    })}
  />
);
```

```tsx
return (
  <CollectionEditView
    collection={collection.slug}
    documentId={documentId}
    initialData={initialData}
    initialPreviewPanelOpen={readLivePreviewPanelCookie({
      cookieValue: cookieStore.get(`vex-live-preview-panel:${collection.slug}`)
        ?.value,
      defaultOpen: collection.admin.livePreview?.defaultOpen ?? false,
    })}
  />
);
```

**Verify:** `pnpm --filter @vexcms/react test -- CollectionEditView GlobalEditView` and
`pnpm --filter @vexcms/next build`

---

### Step 5 — Public-route preview gating: `NextLivePreviewProvider` + `proxy.ts` [dev]

#### packages/next/src/NextLivePreviewProvider.tsx

New file (renamed from `NextLivePreviewGate`, this revision).

```tsx
import { headers } from "next/headers";
import { LIVE_PREVIEW_HEADER, type VexClientConfig } from "@vexcms/core";
import { LivePreviewProvider } from "@vexcms/react";
import type { ReactNode } from "react";

/**
 * Wraps a public route's children in `LivePreviewProvider`, deriving `enabled`
 * from the `x-vex-live-preview-enabled` request header that `proxy.ts` (or the
 * project's own middleware) sets after verifying a `?vexLivePreview=1` request
 * carries a valid admin session (Design Decision 14).
 *
 * @example
 * ```tsx
 * import { NextLivePreviewProvider } from "@vexcms/next";
 * import vexConfig from "~/vex.config";
 *
 * export default function SiteLayout({ children }: { children: ReactNode }) {
 *   return <NextLivePreviewProvider config={vexConfig}>{children}</NextLivePreviewProvider>;
 * }
 * ```
 */
export async function NextLivePreviewProvider(props: {
  config: VexClientConfig;
  children: ReactNode;
}) {
  const requestHeaders = await headers();
  const previewEnabled = requestHeaders.get(LIVE_PREVIEW_HEADER) === "1";

  return (
    <LivePreviewProvider
      enabled={previewEnabled}
      allowedOrigins={props.config.livePreview.allowedOrigins}
      collections={props.config.collections}
      breakpoints={props.config.livePreview.breakpoints}
    >
      {props.children}
    </LivePreviewProvider>
  );
}
```

#### packages/next/src/index.ts

1 edit:

```ts
export * from "./NextAdminPage";
export * from "./NextAdminLayout";
export * from "./NextLivePreviewProvider";
```

#### apps/www/src/proxy.ts

2 edits. **1 — split `proxy()` into a path dispatcher**, extracting the existing
admin-session logic into `guardAdminRequest` and adding `grantPreviewIfRequested` for
public routes (required, not cosmetic — the matcher widens in edit 2 to also match
public routes, and the current body would otherwise redirect every anonymous visitor).
Replaces `proxy()` (`:49-75`); the redirect helpers (`:82-116`) stay as-is.

```ts
import { LIVE_PREVIEW_HEADER, LIVE_PREVIEW_QUERY_PARAM } from "@vexcms/core";
```

```ts
export async function proxy(request: NextRequest) {
  if (ALWAYS_ALLOWED[request.nextUrl.pathname]) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    return guardAdminRequest(request);
  }

  return grantPreviewIfRequested(request);
}

/** Session gate for the admin panel — fails closed, per the file docstring. */
async function guardAdminRequest(request: NextRequest) {
  const sessionStatus = await resolveSessionStatus();

  if (sessionStatus === "verification-failed") {
    return redirectToUnauthorized(request);
  }
  if (sessionStatus === "unauthenticated") {
    return redirectToSignIn(request);
  }
  return NextResponse.next();
}

/**
 * Grants live-preview mode to a public-route request carrying `?vexLivePreview=1`
 * and a verified admin session, by forwarding a marker request header the
 * site layout reads via `headers()`. Fails **open** — an unauthenticated or
 * unverifiable session here renders the page normally rather than redirecting.
 */
async function grantPreviewIfRequested(request: NextRequest) {
  if (request.nextUrl.searchParams.get(LIVE_PREVIEW_QUERY_PARAM) !== "1") {
    return NextResponse.next();
  }

  const sessionStatus = await resolveSessionStatus();
  if (sessionStatus !== "authenticated") {
    return NextResponse.next();
  }

  const previewRequestHeaders = new Headers(request.headers);
  previewRequestHeaders.set(LIVE_PREVIEW_HEADER, "1");
  return NextResponse.next({ request: { headers: previewRequestHeaders } });
}

/** Reads and verifies the Better Auth session cookie — shared by both branches above. */
async function resolveSessionStatus(): Promise<
  "authenticated" | "unauthenticated" | "verification-failed"
> {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get(SESSION_COOKIES.https)?.value ??
    cookieStore.get(SESSION_COOKIES.http)?.value;
  if (!sessionToken) return "unauthenticated";

  try {
    const session = await fetchQuery(api.auth.sessions.getSessionWithUser, {
      sessionToken: extractToken(sessionToken),
    });
    return session?.user ? "authenticated" : "unauthenticated";
  } catch {
    return "verification-failed";
  }
}
```

**2 — widen the matcher (`:118-123`):**

```ts
export const config = {
  matcher: ["/admin/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

#### apps/www/src/app/(frontend)/(site)/layout.tsx

1 edit.

```tsx
import { NextLivePreviewProvider } from "@vexcms/next";
import vexConfig from "~/vex.config";
```

```tsx
return (
  <NextLivePreviewProvider config={vexConfig}>
    {/* … existing SiteHeader / children / SiteFooter JSX, unchanged … */}
  </NextLivePreviewProvider>
);
```

**Verify:** `pnpm --filter @vexcms/next build && pnpm --filter www build`. Manual check
(P-024): `curl -sI "http://localhost:3030/?vexLivePreview=1"` without a session cookie
returns 200 with no observable change; with a valid session cookie forwarded, confirm
via the browser tool that a `vex-live-preview-handshake` fires on `BroadcastChannel`.

---

### Step 6 — `apps/www` dogfooding: pages collection + `PageContent.tsx` [dev]

#### apps/www/src/lib/resolvePagePath.ts

New file. Full code.

```ts
/**
 * Maps a `pages` document's slug to its public path. Shared by `vex.config.ts`'s
 * `routes.map` and `pages.ts`'s `admin.livePreview.url` (Design Decision 1).
 */
export function resolvePagePath(slug: string | undefined): string | undefined {
  if (!slug) return undefined;
  return slug === "home" ? "/" : `/${slug}`;
}
```

#### apps/www/src/vexcms/collections/pages.ts

1 edit — add to the existing `admin` block (`:8-15`).

```ts
    livePreview: {
      url: (doc) => resolvePagePath(doc.slug),
    },
```

```ts
import { resolvePagePath } from "~/lib/resolvePagePath";
```

#### apps/www/src/vex.config.ts

2 edits. **1 —** reuse `resolvePagePath` in `routes.map` (`:39-45`):
`return [resolvePagePath(doc.slug as string | undefined)].filter((p): p is string => p !== undefined);`

**2 —** root `livePreview.allowedOrigins`:

```ts
  livePreview: {
    allowedOrigins: [
      "http://localhost:3030",
      ...(process.env.NEXT_PUBLIC_SITE_URL ? [process.env.NEXT_PUBLIC_SITE_URL] : []),
    ],
  },
```

#### apps/www/src/app/(frontend)/(site)/PageContent.tsx

1 edit.

```ts
import { useLivePreviewQuery } from "@vexcms/react";
```

```tsx
const { data: page } = useLivePreviewQuery(
  {
    ...convexQuery(api.pages.getBySlug, { slug: normalizedSlug }),
    initialData,
  },
  "pages",
);
```

Every subsequent `pages?.[0]` becomes `page` directly.

**Verify:** Manual browser verification — open a page's edit view with the preview
panel open, drag the resize handle, type in the title field, confirm the iframe updates;
pop the preview out, confirm it still updates; duplicate that popped tab and confirm the
duplicate ALSO updates live (Design Decision 4/6) without touching the original.

---

### Step 7 — `create-vexcms/templates/marketing-site` parity [dev]

Mirror Step 6's four files and Step 5's `proxy.ts`/`(site)/layout.tsx` edits onto
`packages/create-vexcms/templates/marketing-site/src/`.

**Verify:** `pnpm verify:scaffold` in `marketing-site` mode.

---

### Step 8 — Docs and cross-references [dev]

#### packages/core/src/routes/types.ts

1 edit — correct the "preview links" claim in `VexRoutesConfig`'s docstring (`:53`):

```ts
 * Named for what it describes rather than for a consumer. Cache revalidation is
 * the first consumer — `resolveTargets` uses `map` to decide which paths a
 * write invalidated — but the same answer drives an admin "View page" link and
 * sitemap URL generation. Live preview resolves its OWN target URL via the
 * independent `admin.livePreview.url` resolver (see `@vexcms/core`'s `livePreview`
 * module) — the two intentionally do not share a code path.
```

#### packages/core/README.md

1 edit — replace the "Live Preview" section (`:213-218`):

```md
### Live Preview

Ships a dual-transport (`postMessage` + `BroadcastChannel`) overlay: `admin.livePreview.url`
on a collection or global resolves a document to the public URL its preview should
render, typed to the exact generated document interface for that collection/global.
`admin.livePreview` also accepts `debounceMs`, `defaultOpen`, and `breakpoints` (overriding
the root `livePreview.breakpoints`). The admin panel's edit
views render a resizable split pane (full-screen on mobile) that iframes the resolved
URL and streams the form's unsaved values into it via `<LivePreviewProvider>` /
`useLivePreview` / `useLivePreviewQuery`. The embedded panel's breakpoint toggle row scales the
iframe to a simulated device width without distorting it. A floating indicator on the
previewed page itself marks it as a live preview and, when popped out, offers the same
breakpoints as resize controls.
`@vexcms/next`'s `NextLivePreviewProvider` wraps a public layout in one call. See the
[Live Preview guide](https://docs.vexcms.dev/guides/live-preview/) for the security
requirements any project embedding a preview surface must configure.
```

#### apps/docs/src/content/docs/guides/live-preview.mdx

New file, mirroring `guides/lifecycle-hooks.mdx`'s structure. Covers: the config
surface (`admin.livePreview.*` — including `breakpoints`, root `livePreview.allowedOrigins` and
`livePreview.breakpoints`); the dual-transport model and
its cross-browser/cross-device limit (Design Decision 4); the resizable panel, mobile
overlay, and floating indicator; the security checklist a project must still implement
in its own middleware; the pre-`beforeChange` limitation.

**Verify:** `grep -rn "livePreview" packages/core/README.md apps/docs/src/content/docs`
shows the corrected, shipped-feature text everywhere — no remaining "Not shipped" /
"Reserved for future" claims.

## Verification

1. `pnpm build && pnpm test` at the repo root.
2. `pnpm verify:scaffold` — proves the `marketing-site` template change survives a real
   scaffold.
3. Manual browser verification against the developer's running `apps/www` (P-024):
   resize the split pane by dragging its handle and confirm the width persists across a
   reload; shrink the viewport below 768px and confirm the panel becomes a full-screen
   overlay with a working close button; pop the preview out, confirm the floating
   indicator appears, expand it, confirm width-preset buttons resize the popped window;
   in the embedded panel, toggle a breakpoint narrower than the split pane and confirm
   it centers with letterboxing, then one wider and confirm it scales down to exactly
   fill the pane without clipping;
   duplicate the popped tab and confirm the duplicate independently receives live
   updates with no admin action beyond the original edit; open the same preview URL in a
   second, unrelated browser and confirm it shows only the published document (Design
   Decision 4's documented limit, not a bug).
