---
status: draft
spec_id: 2026-11-11-live-preview-cross-page
touches:
  - "packages/core/src/livePreview/constants.ts"
  - "packages/react/src/livePreview/useIsLivePreviewActive.ts"
  - "packages/react/src/livePreview/useIsLivePreviewActive.test.ts"
  - "packages/react/src/livePreview/LivePreviewContext.tsx"
  - "packages/react/src/livePreview/LivePreviewContext.test.tsx"
  - "packages/react/src/livePreview/livePreviewProtocol.ts"
  - "packages/react/src/livePreview/livePreviewProtocol.test.ts"
  - "packages/react/src/livePreview/useLivePreviewSync.ts"
  - "packages/react/src/livePreview/useLivePreviewSync.test.ts"
  - "packages/react/src/livePreview/LivePreviewPanel.tsx"
  - "packages/react/src/livePreview/index.ts"
  - "packages/react/src/index.ts"
  - "packages/next/src/livePreview/createVexDraftModeRoute.ts"
  - "apps/{test,www}/src/lib/useSitePreviewMode.ts"
  - "apps/{test,www}/src/app/layout.tsx"
  - "apps/{test,www}/src/app/(frontend)/(site)/**"
  - "apps/{test,www}/convex/{pages,posts}.ts"
  - "packages/create-vexcms/templates/marketing-site/src/lib/useSitePreviewMode.ts"
  - "packages/create-vexcms/templates/marketing-site/src/app/layout.tsx"
  - "packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/**"
  - "packages/create-vexcms/templates/marketing-site/convex/pages.ts"
  - "packages/create-vexcms/templates/base-nextjs/src/app/layout.tsx"
  - "packages/create-vexcms/templates/base-nextjs/src/app/api/vex/live-preview/route.ts"
  - "packages/create-vexcms/templates/base-nextjs/src/proxy.ts"
  - "scripts/scaffold-smoke.mjs"
  - "apps/docs/src/content/docs/guides/live-preview.mdx"
  - ".changeset/live-preview-cross-page.md"
prompt_version: 1
---

# 2026-11-11-live-preview-cross-page — Tasks

Pre-0.1.0 slice of cross-page live preview: the preview stays on through every navigation
inside the preview surface, and a freshly loaded page catches up with unsaved values at once.
The deep overlay hook, relationship-safe merge, panel navigation chrome, and a CLI opt-out for
the base template's preview wiring are backlogged (`backlog.md`). The `vex-examples` half is
handed to GU (`examples-handoff.md`). Research: `.agent/docs/research/live-preview-cross-page.md`.

## Step 1 — Sticky preview gate: `LIVE_PREVIEW_WINDOW_NAME` + `useIsLivePreviewActive` [dev]
Why: the gate reads `?vexLivePreview=1`, which any hard navigation inside the preview drops,
switching the overlay off. Seven apps keep a private copy of the same check.
Verify: `pnpm --filter @vexcms/react test -- livePreview` green; `pnpm --filter @vexcms/react typecheck`.
- [x] `packages/core/src/livePreview/constants.ts`: add `LIVE_PREVIEW_WINDOW_NAME`; reword the `LIVE_PREVIEW_COOKIE` doc
- [x] `packages/react/src/livePreview/useIsLivePreviewActive.ts`: new hook (cookie && (param || window name))
- [x] `packages/react/src/livePreview/useIsLivePreviewActive.test.ts`: gate matrix
- [x] `packages/react/src/livePreview/LivePreviewContext.tsx`: provider uses the hook, persists the window name; drop `useLivePreviewEnabled`
- [x] `packages/react/src/livePreview/LivePreviewContext.test.tsx`: gate describe → persistence + post-navigation cases
- [x] `packages/react/src/livePreview/index.ts`, `packages/react/src/index.ts`: export the hook

## Step 2 — Ready message replaces the per-document handshake [dev]
Why: the mount handshake fires from child effects before the provider's listener exists, and
only a matching document key gets a reply, so a reloaded page waits for the next keystroke. The
postMessage copy of the handshake is never read by the admin at all.
Verify: `pnpm --filter @vexcms/react test -- livePreview` green; `pnpm --filter @vexcms/react typecheck`.
- [x] `packages/react/src/livePreview/livePreviewProtocol.ts`: `LivePreviewReadyMessage` replaces `LivePreviewHandshakeMessage`
- [x] `packages/react/src/livePreview/livePreviewProtocol.test.ts`: fixture uses the ready message
- [x] `packages/react/src/livePreview/LivePreviewContext.tsx`: post ready after listeners attach; delete `useLivePreviewHandshake`
- [x] `packages/react/src/livePreview/LivePreviewContext.test.tsx`: ready round-trip test
- [x] `packages/react/src/livePreview/useLivePreviewSync.ts`: reply to ready on the channel and from the held frame window
- [x] `packages/react/src/livePreview/useLivePreviewSync.test.ts`: handshake tests → ready tests
- [x] `packages/react/src/livePreview/LivePreviewPanel.tsx`: doc comment says "ready message"; stale inline comment deleted

## Step 3 — Apps and templates cut over; base-nextjs ships the preview wiring; docs [agent]
Why: clean cutover from `useSitePreviewMode` copies; `--bare` scaffolds (magazine, real-estate)
had to hand-roll the provider, the Draft Mode route and the proxy hand-off.
Verify: `pnpm --filter test test`, `pnpm --filter www test`, `pnpm typecheck`,
`node scripts/scaffold-smoke.mjs [--bare]`, `node scripts/verify-scaffold.mjs`,
`pnpm --filter docs build`; runtime smoke on :3030 (bare runtime proof via GU on magazine).
- [x] Delete `useSitePreviewMode.ts` in `apps/test`, `apps/www`, `templates/marketing-site`; migrate call sites, doc comments, test mocks
- [x] Layout gate comments in `apps/test`, `apps/www`, `templates/marketing-site`
- [x] `packages/next/src/livePreview/createVexDraftModeRoute.ts`: drop the stale inline comment
- [x] `templates/base-nextjs/src/app/layout.tsx`: mount `<LivePreviewProvider>`
- [x] `templates/base-nextjs/src/app/api/vex/live-preview/route.ts`: new Draft Mode route
- [x] `templates/base-nextjs/src/proxy.ts`: session-verified hand-off, `resolveSessionStatus`, matcher stops excluding `/`
- [x] `scripts/scaffold-smoke.mjs`: bare scaffold requires the route
- [x] `apps/docs/src/content/docs/guides/live-preview.mdx`: how it works, wiring, navigation section, gate, limits
- [x] `.changeset/live-preview-cross-page.md`
