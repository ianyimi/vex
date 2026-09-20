---
"@vexcms/core": patch
"@vexcms/react": patch
"@vexcms/next": patch
"create-vexcms": patch
---

Add live preview (ADR-012) — the editor's unsaved values streamed into the document's own
public page.

**`@vexcms/core`.** New `livePreview` module. A collection or global declares
`admin.livePreview.url`, a resolver from the document to the public URL its preview should
render, typed to that slug's exact generated document interface (`AdminCollectionConfig`
and `GlobalAdminConfig` gain a trailing `TCollectionSlug`/`TGlobalSlug` generic, inferred
from the sibling `slug`; a new `DocumentByGlobalSlug` mirrors `DocumentByCollectionSlug`).
`admin.livePreview` also accepts `debounceMs`, `defaultOpen` and per-collection
`breakpoints`. Root config gains `livePreview.allowedOrigins` (the `postMessage` origin
allowlist — empty by default, so the transport accepts nothing until configured) and
`livePreview.breakpoints`, defaulting to `DEFAULT_LIVE_PREVIEW_BREAKPOINTS`. Protocol
constants (`LIVE_PREVIEW_QUERY_PARAM`, `LIVE_PREVIEW_COOKIE`, the temp-id params, the
panel/layout cookie names) are exported so the name can never drift between the middleware
that sets it and the client that reads it, alongside pure helpers
(`readLivePreviewPanelCookie`, `readLivePreviewLayoutCookie`,
`resolveLivePreviewPanelMinSize`).

**`@vexcms/react`.** `<LivePreviewProvider>` keeps an `id → unsaved values` map fed by two
transports at once: `postMessage` to a held window reference, and a shared
`BroadcastChannel` for surfaces no reference exists for (a duplicated tab, a link-opened
tab, a second monitor). Every payload is validated against the target collection's Zod
schema, and only the keys the sender actually sent are overlaid — `.partial()` still
applies field defaults, which would otherwise blank untouched fields. Consumers read it
through `useLivePreview(doc, slug)` or the `useLivePreviewQuery` sugar, which narrows a
`getBySlug`-style array to the single overlaid document. The admin side ships
`LivePreviewPanel` (resizable split pane, full-screen overlay on mobile, breakpoint buttons
that scale the frame without distorting it) wired into `CollectionEditView` and
`GlobalEditView`, `useLivePreviewSync` (debounced full-snapshot posts plus an immediate
reply to a newly-mounted surface's handshake), and a floating `LivePreviewIndicator` that
marks a page opened in its own tab as a preview.

The admin shell now owns its own scrollbar (`main` is the single scroll container) rather
than scrolling the window, which removes the layout shift when the preview toggles;
`.vex-scroll-area` styles those scrollers with a transparent track and a permanently
visible thumb. New shadcn `ui/resizable` primitive, wrapping `react-resizable-panels`.

**`@vexcms/next`.** `NextAdminPage` reads the per-slug panel open/closed and split-position
cookies server-side and threads them into the edit views, so a remembered layout renders on
the first paint instead of snapping into place after hydration.

**`create-vexcms`.** The `marketing-site` template mirrors `apps/www`'s wiring: a
`SiteLivePreviewProvider` client component that owns the config import, `proxy.ts` granting
preview mode only after verifying an admin session, `admin.livePreview.url` on `pages`, and
`PageContent` reading through `useLivePreviewQuery`.

Preview mode is gated, not ambient: the panel appends `?vexLivePreview=1`, and the listener
attaches only when the project's own middleware has also verified an admin session and set
the `vex-live-preview` marker cookie. The public route fails open — a stale session renders
the normal published page rather than redirecting.
