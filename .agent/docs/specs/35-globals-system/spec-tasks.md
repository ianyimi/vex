---
status: in-progress
spec_id: 35-globals-system
touches: []
prompt_version: 1
---

# 35-globals-system — Tasks

## Step 1 — GlobalConfig types + defineGlobal() + VexConfig extension `[dev]`
Why: Pure-TS foundation — config shape + reserved-key guard every later step builds on.
Verify: `pnpm --filter @vexcms/core typecheck` && `pnpm --filter @vexcms/core test src/globals/config.test.ts`
- [x] packages/core/src/globals/types.ts
- [x] packages/core/src/globals/config.ts
- [x] packages/core/src/globals/config.test.ts
- [x] packages/core/src/globals/utils.ts
- [x] packages/core/src/globals/index.ts
- [x] packages/core/src/config/types.ts — add `globals` to VexConfigInput/VexConfig
- [x] packages/core/src/config/config.ts — pass `globals` through
- [x] packages/core/src/index.ts — export `./globals`

## Step 2 — Type generation: flat interfaces + GlobalsFieldTypeMap `[dev]`
Why: `vex generate` must emit GlobalSlug, GlobalDocumentBySlug, GlobalsFieldTypeMap + flat `*Global` interfaces for compile-time slug/populate narrowing.
Verify: `pnpm --filter @vexcms/core test src/types/generateVexTypes.test.ts`

## Step 3 — Schema generation: vex_globals table `[dev]`
Why: emit the single `vex_globals` table (slug + data, by_slug index) only when globals exist.
Verify: `pnpm --filter @vexcms/core test src/schema/generateVexSchema.test.ts`

## Step 4 — Server API: getGlobal, findGlobals, updateGlobal `[dev]`
Why: read path flattens (slug→_slug, data lifted), write path re-nests + strips system keys; populate/depth.
Verify: `pnpm --filter @vexcms/core test src/api/globals`

## Step 5 — Client API + vexConvexApi extension `[dev]`
Why: expose globals.get/find/update as tanstack-query options + mutation factory with narrowed slug/populate.
Verify: `pnpm --filter @vexcms/core typecheck`

## Step 6 — globalsApi factory `[dev]`
Why: register globals.get/find/update as Convex endpoints with populate args, mapping to `api.vex.globals.*`.
Verify: `pnpm --filter @vexcms/core test src/api/globals`

## Step 7 — Admin UI: GlobalsListView + GlobalEditView `[dev]`
Why: admin index (list from config) + singleton edit form handling flat↔nested conversion.
Verify: `pnpm --filter @vexcms/react typecheck` && drive /admin/globals in browser.

## Step 8 — Sidebar integration `[dev]`
Why: surface a globals section in AppSidebar.
Verify: `pnpm --filter @vexcms/react typecheck`

## Step 9 — apps/www wiring `[agent]`
Why: register siteSettings global + globalsApi + admin routes end-to-end.
Verify: `pnpm dev:app` → /admin/globals renders and saves to vex_globals.
