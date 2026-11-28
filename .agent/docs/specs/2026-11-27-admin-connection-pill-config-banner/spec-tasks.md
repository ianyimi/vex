---
status: draft
spec_id: 2026-11-27-admin-connection-pill-config-banner
touches: ["packages/core/src/config/**", "packages/core/src/components/types.ts", "packages/react/src/hooks/**", "packages/react/src/admin/**", "packages/react/src/config/**", "packages/react/src/testing/convex/bridge.ts", "packages/react/src/testing/viewSuite.ts", "packages/react/src/index.ts", "packages/react/src/adminEntry.ts", "apps/test/src/app/**", "apps/www/src/app/**", "packages/create-vexcms/templates/*/src/app/**", "apps/docs/src/content/docs/guides/**", ".changeset/*.md"]
prompt_version: 1
---

# 2026-11-27-admin-connection-pill-config-banner — Tasks

Two admin onboarding aids: a connection pill in `AdminTopNav` driven by the Convex client's
connection state, and a server-rendered banner when the Vex config fails to load.

## Step 1 — Core: config error summary and guarded config loader [agent]
Why: every later banner path needs one name-based classifier and one sanitized, serializable
summary, computed on the server so a production message never reaches the browser.
Verify: `pnpm --filter @vexcms/core test -- summarizeVexConfigError loadVexConfigModule config.test` and `pnpm --filter @vexcms/core typecheck`.
- [ ] `packages/core/src/config/summarizeVexConfigError.ts` + `.test.ts`
- [ ] `packages/core/src/config/loadVexConfigModule.ts` + `.test.ts`
- [ ] `packages/core/src/config/config.ts`: the two plain `Error`s become `VexConfigError`
- [ ] `packages/core/src/config/index.ts`: exports

## Step 2 — Core: connection-status config surface [agent]
Why: the pill's hide flag and override chain must be typed and defaulted before react reads them.
Verify: `pnpm --filter @vexcms/core test -- config` and typecheck.
- [ ] `packages/core/src/components/types.ts`: `SLOT_IDS.shell.connectionStatus`, `SlotId` union
- [ ] `packages/core/src/config/types.ts`: `AdminConfigInput.connectionStatus`, `AdminComponentsInput.connectionStatus`, resolved `AdminConfig`
- [ ] `packages/core/src/config/config.ts`: defaults + override-chain resolution
- [ ] `packages/core/src/config/config.test.ts`: defaults and duplicate-id rejection

## Step 3 — React: `useVexConnectionStatus` [dev]
Why: one state machine (grace, offline threshold, unsaved writes) shared by the built-in pill and
any app replacement; must never open a Convex socket during SSR.
Verify: `pnpm --filter @vexcms/react test -- useVexConnectionStatus`.
- [ ] `packages/react/src/hooks/useVexConnectionStatus.ts` + `.test.tsx`
- [ ] `packages/react/src/hooks/index.ts`, `packages/react/src/index.ts`: exports
- [ ] `packages/react/src/testing/convex/bridge.ts`: fake `connectionState`/`subscribeToConnectionState`

## Step 4 — React: `AdminConnectionStatus` pill, unload guard, top-nav wiring [dev]
Why: the visible pill in a slot reserved at first paint, the hide flag, the override chain, and a
`beforeunload` guard that runs even when the pill is hidden.
Verify: `pnpm --filter @vexcms/react test -- AdminConnectionStatus AdminTopNav useUnsavedWritesUnloadGuard`.
- [ ] `packages/react/src/hooks/useUnsavedWritesUnloadGuard.ts` + `.test.tsx`
- [ ] `packages/react/src/admin/AdminConnectionStatus.tsx` + `.test.tsx`
- [ ] `packages/react/src/admin/AdminTopNav.tsx`: slot, flag, guard
- [ ] `packages/react/src/testing/viewSuite.ts`: AdminTopNav cases (pill present, hidden by flag)
- [ ] `packages/react/src/adminEntry.ts`: exports

## Step 5 — React: `VexConfigErrorBanner` [dev]
Why: a banner that renders from a summary alone (no config context), on the server or the client.
Verify: `pnpm --filter @vexcms/react test -- VexConfigErrorBanner`.
- [ ] `packages/react/src/config/VexConfigErrorBanner.tsx` + `.test.tsx`
- [ ] `packages/react/src/index.ts`: export

## Step 6 — apps/test: pre-checks and error-file backstops [agent]
Why: wires the loader where the config is imported today: the root layout (client config) and
the admin page (server config, after the auth gate).
Verify: `pnpm --filter test typecheck`; manual against the developer's running app (P-024): break
`vex.config.ts`, then `vex.config.server.ts`, and check the banner in View Source on `/admin`.
- [ ] `apps/test/src/app/layout.tsx`
- [ ] `apps/test/src/app/(vexcms)/admin/[[...path]]/page.tsx`
- [ ] `apps/test/src/app/(vexcms)/admin/error.tsx`
- [ ] `apps/test/src/app/global-error.tsx` (new)

## Step 7 — apps/www and templates [agent]
Why: every shipped scaffold and the marketing app get the same wiring (template-sync).
Verify: `pnpm --filter www typecheck`; `node scripts/verify-scaffold.mjs` in every supported mode (AP-020).
- [ ] `apps/www/src/app/layout.tsx`, `(vexcms)/admin/[[...path]]/page.tsx`, `(vexcms)/admin/error.tsx`, `global-error.tsx`
- [ ] `packages/create-vexcms/templates/base-nextjs/src/app/layout.tsx`, admin `page.tsx`, admin `error.tsx` (new), `global-error.tsx` (new)
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/layout.tsx`

## Step 8 — Docs and changeset [agent]
Why: the banner's docs links resolve to a real page; the pill's flag and override are documented.
Verify: `pnpm --filter docs build`; `dist/guides/config-errors/index.html` exists and every banner category anchor resolves.
- [ ] `apps/docs/src/content/docs/guides/config-errors.mdx` (new)
- [ ] `apps/docs/src/content/docs/guides/admin-customization.mdx`: connection status section
- [ ] `.changeset/admin-connection-status-config-banner.md` (patch)
