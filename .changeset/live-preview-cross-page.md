---
"@vexcms/core": patch
"@vexcms/react": patch
"create-vexcms": patch
---

Live preview now survives navigation inside the preview. Once the gate opens through
`?vexLivePreview=1`, the provider names its window `LIVE_PREVIEW_WINDOW_NAME` (new in
`@vexcms/core`), and the gate accepts that name in place of the query param. Links, back/forward
and reloads inside the panel or pop-out tab keep the overlay on, and a freshly loaded page
announces itself with a ready message that every open edit view answers immediately. The
per-document mount handshake is gone.

New `useIsLivePreviewActive()` hook in `@vexcms/react`: the same gate the provider uses
(session-verified cookie plus the query param or the preview window name), `false` during
server render and hydration. Use it to pick a draft-reading query while previewing; it replaces
the per-app `useSitePreviewMode` copy.

`create-vexcms`: the `base-nextjs` template (and so `--bare`) now ships the preview wiring: the
`<LivePreviewProvider>` mount, `/api/vex/live-preview` (`createVexDraftModeRoute`), and the
proxy hand-off, which runs only for a verified session. It stays inert until a collection sets
`admin.livePreview.url`. The marketing-site template's `src/lib/useSitePreviewMode.ts` is
removed in favour of the hook.
