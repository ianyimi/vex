---
spec_id: 2026-09-18-live-preview
---

# 2026-09-18-live-preview — Tasks

Launch-plan spec **E** (ADR-012). Ships after F (`2026-09-18-lifecycle-hooks-validation`)
per hard ordering constraint 2 in `v0.1.0-launch-plan.md`.

Regenerated from `spec.md`'s current `## Implementation` steps (rev with `Vex`-prefix
naming removed per this spec's Naming section) — the prior version of this file named
stale symbols (`VexLivePreviewContext`, `useVexPreview`, `useVexQuery`) that spec.md no
longer uses, and used bold `**Verify:**`/`**Why:**` markers with no checklist items,
which the `harness implement` parser rejects (plain `Why:`/`Verify:` lines + `- [ ]`
steps required).

## Step 1 — Core config, protocol constants & typed resolvers [dev]

Why: Every later step imports these types. `livePreview.url` widens from a string
(globals only, today) to a `LivePreviewUrlResolver` typed per collection/global slug
(Design Decisions 1, 17), and a new root-level `livePreview.allowedOrigins` +
`livePreview.breakpoints` give the transport an explicit origin allowlist and the
breakpoint matrix (Design Decision 11).
- [x] `packages/core/src/livePreview/types.ts` — new file: `LivePreviewUrlResolver`, `LivePreviewBreakpoint`.
- [x] `packages/core/src/livePreview/constants.ts` — new file: `DEFAULT_LIVE_PREVIEW_BREAKPOINTS`, `LIVE_PREVIEW_HEADER`, `LIVE_PREVIEW_QUERY_PARAM`.
- [x] `packages/core/src/livePreview/index.ts` — new file: barrel re-export.
- [x] `packages/core/src/index.ts` — export the `livePreview` module beside `routes`.
- [x] `packages/core/src/types/generated.ts` — add `DocumentByGlobalSlug`, mirroring `DocumentByCollectionSlug`.
- [x] `packages/core/src/config/types.ts` — root `livePreview: { allowedOrigins, breakpoints? }` config.
- [x] `packages/core/src/config/config.ts` — resolve `livePreview` defaults beside `routes`.
- [x] `packages/core/src/config/config.test.ts` — `livePreview` defaults covered.
- [x] `packages/core/src/collections/types.ts` — `AdminCollectionConfigInput`/`AdminCollectionConfig` gain `TCollectionSlug` generic + typed `admin.livePreview`.
- [x] `packages/core/src/collections/config.ts` — resolve `admin.livePreview` defaults.
- [x] `packages/core/src/globals/types.ts` — mirrors collections: `TGlobalSlug` generic + typed `admin.livePreview`.
- [x] `packages/core/src/globals/config.ts` — resolve `admin.livePreview` defaults, mirroring collections.
Verify: pnpm --filter @vexcms/core build && pnpm --filter @vexcms/core test

## Step 2 — `LivePreviewContext`: provider, `useLivePreview`, `useLivePreviewQuery` [dev]

Why: The core primitive from ADR-012 — an `id → unsaved values` map, dual `postMessage`
+ `BroadcastChannel` transport with origin/payload validation and mount handshake, and
the overlay hooks that shadow a consumer's own query result.
- [x] `packages/react/src/context/livePreviewProtocol.ts` — new file: wire-protocol types/constants.
- [x] `packages/react/src/context/livePreviewProtocol.test.ts` — new file.
- [x] `packages/react/src/context/LivePreviewContext.tsx` — new file: `LivePreviewProvider`, `useLivePreview`, `useLivePreviewQuery`.
Verify: pnpm --filter @vexcms/react test -- livePreviewProtocol

## Step 3 — Preview panel UI: resizable split pane, mobile overlay, floating indicator, sync [dev]

Why: The admin-side half of the loop — a resizable split pane (Design Decision 8), a
mobile full-screen overlay, a floating draggable indicator (Design Decision 10), cookie
persistence of open/closed state (Design Decision 9), and the hook posting full form
values on every change (Design Decision 3).
- [x] `packages/react/package.json` / `pnpm-workspace.yaml` — add `react-resizable-panels`.
- [x] `packages/react/src/components/ui/resizable.tsx` — new file: shadcn `Resizable` primitive.
- [x] `packages/react/src/hooks/useLivePreviewPanelState.ts` — new file.
- [x] `packages/react/src/hooks/useLivePreviewPanelState.test.ts` — new file.
- [x] `packages/react/src/hooks/useLivePreviewSync.ts` — new file: dual-transport sync + handshake-reply.
- [x] `packages/react/src/hooks/useLivePreviewSync.test.ts` — new file.
- [x] `packages/react/src/components/livePreview/LivePreviewIndicator.tsx` — new file.
- [x] `packages/react/src/components/livePreview/LivePreviewIndicator.test.tsx` — new file.
- [x] `packages/react/src/components/livePreview/LivePreviewPanel.tsx` — new file.
- [x] `packages/react/src/components/livePreview/LivePreviewPanel.test.tsx` — new file.
Verify: pnpm --filter @vexcms/react test -- LivePreviewPanel LivePreviewIndicator useLivePreviewSync useLivePreviewPanelState

## Step 4 — Wire `CollectionEditView`, `GlobalEditView`, `NextAdminPage` [dev]

Why: Mounts the panel only when `livePreview` is configured, threads the cookie-derived
initial open state from the server component down, and covers the new-document temp-id
path (Design Decision 13).
- [x] `packages/core/src/framework.ts` — `CollectionEditViewProps`/`GlobalEditViewProps` gain the initial panel-open field beside `initialData`.
- [x] `packages/react/src/components/views/CollectionEditView.tsx` — 6 edits: temp id, resolver call, panel mount, sync hook wiring.
- [x] `packages/react/src/components/views/GlobalEditView.tsx` — mirrored 6 edits.
- [x] `packages/react/src/index.ts` — export the new public symbols (panel, indicator, hooks, context).
- [x] `packages/next/src/NextAdminPage.tsx` — read the panel-open cookie server-side and pass it through.
Verify: pnpm --filter @vexcms/react test -- CollectionEditView GlobalEditView && pnpm --filter @vexcms/next build

## Step 5 — Public-route preview gating: `NextLivePreviewProvider` + `proxy.ts` [dev]

Why: ADR-012 security requirements — the public site must not install a listener on
every request; `LIVE_PREVIEW_HEADER` is set by `proxy.ts` after verifying a session
(Design Decisions 14, 15, 16) and read by a new `@vexcms/next` server component.
- [x] `packages/next/src/NextLivePreviewProvider.tsx` — new file (renamed from `NextLivePreviewGate`).
- [x] `packages/next/src/index.ts` — export `NextLivePreviewProvider`.
- [x] `apps/www/src/proxy.ts` — split into a path dispatcher; extract `guardAdminRequest`; add `grantPreviewIfRequested`.
- [x] `apps/www/src/app/(frontend)/(site)/layout.tsx` — wrap `children` in `<NextLivePreviewProvider>`.
Verify: pnpm --filter @vexcms/next build && pnpm --filter www build

## Step 6 — `apps/www` dogfooding: pages collection + `PageContent.tsx` [dev]

Why: Closes the loop end-to-end on the one real consumer: `pages` gets
`admin.livePreview.url`, the root config gets `livePreview.allowedOrigins`, and
`PageContent.tsx` switches to `useLivePreviewQuery` (Design Decision 12).
- [ ] `apps/www/src/lib/resolvePagePath.ts` — new file.
- [ ] `apps/www/src/vexcms/collections/pages.ts` — add `admin.livePreview.url`.
- [ ] `apps/www/src/vex.config.ts` — reuse `resolvePagePath` in `routes.map`; add `livePreview.allowedOrigins`.
- [ ] `apps/www/src/app/(frontend)/(site)/PageContent.tsx` — switch to `useLivePreviewQuery`, drop `pages?.[0]`.
Verify: manual

## Step 7 — `create-vexcms/templates/marketing-site` parity [dev]

Why: P-018 — the template and `apps/www` stay in lockstep. Mirrors Steps 5–6 onto the
scaffolded template.
- [x] `packages/create-vexcms/templates/marketing-site/**` — mirror the `apps/www` proxy/layout/collection/config/PageContent changes from Steps 5–6.
Verify: pnpm verify:scaffold

## Step 8 — Docs and cross-references [dev]

Why: `core/README.md` documents `livePreview: { url }` as a plain string on globals
only — now wrong on both counts. `routes/types.ts`'s docstring claims `routes.map`
drives "preview links" (Design Decision 1 corrects this).
- [x] `packages/core/src/routes/types.ts` — correct the "preview links" docstring claim.
- [x] `packages/core/README.md` — replace the "Live Preview" section.
- [x] `apps/docs/src/content/docs/guides/live-preview.mdx` — new file, mirroring `guides/lifecycle-hooks.mdx`.
Verify: grep -rn "livePreview" packages/core/README.md apps/docs/src/content/docs
