---
status: in-progress
spec_id: 2026-08-23-access-index-resolution
touches: []
prompt_version: 1
---

# 2026-08-23-access-index-resolution — Tasks

> **Sync 2026-08-29:** ticked against code. Several Step 1–2 items shipped in SUPERSEDED
> form — `AccessIndexDecl`/`IndexedPermissionCheck`/`AccessIndexBySlug` were replaced by
> the constraint-builder rework (`constraints` callbacks + `IndexFieldsBySlug`; see
> 2026-08-25-access-constraint-builder), and `QUERY_SHAPED_ACTIONS` shipped as
> `QUERY_ACTIONS`. Genuinely open: Step 6 (`findCount` count endpoint), Step 7
> (`maxLoadMoreIterations` cap), Step 8 (`warnUnindexedRule`), the docs guide, and the
> manual admin-list check.

Design: `access-index-design.md` (this directory).
Consumer: `2026-08-23-versioning-drafts` — its published-only status filter is a
framework-supplied access index and depends on Steps 1–5 here.

## Step 1 — Access index types + constants `[agent]` — [ ]

Why: Every later step imports these; nothing compiles until the union exists.
- [x] `packages/core/src/access/constants.ts` — add `QUERY_SHAPED_ACTIONS` (`as const`
      map → `QueryShapedAction`, per P-003). Members: `read`, `readDrafts`.
- [x] `packages/core/src/access/types.ts` — `AccessIndexDecl`, `IndexedPermissionCheck`;
      widen `PermissionCheck` to include the object form; add `indexes` to `SubjectEntry`
      and to the `SubjectMap` resource branch; restrict the object form to
      `QueryShapedAction` keys in `RolePermissions`.
- [x] `packages/core/src/access/types.test.ts` — type-level assertions: object form
      accepted on `read`, rejected on `create`/`update`/`delete`.
- Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/core typecheck`

## Step 2 — Generated index registry `[agent]` — [ ]

Why: Step 1's `indexes` member resolves through this; emitters must land before any
consumer types the index name.
- [x] `packages/core/src/types/generated.ts` — `IndexesBySlug`, `IndexNameFor<S>`,
      `AccessIndexBySlug`, `AccessIndexNameFor<S, A>`. Map-level `infer` constraints
      only (AP-003).
- [x] `packages/core/src/types/generateVexTypes.ts` — emit both registry entries into
      the `declare module` block; index names read from the generated schema, access
      index names from the resolved access config.
- [x] `packages/core/src/types/generateVexTypes.test.ts` — emitted output contains both
      maps; collections with no access rule are absent from `AccessIndexBySlug`.
- Verify: `pnpm --filter @vexcms/core test`

## Step 3 — `resolveAccessIndex` + tests `[dev]` — [ ]

Why: The resolver is a leaf — no other new module depends on it yet, and its OR-merge
semantics are the one place a bug silently hides documents.
- [x] `packages/core/src/access/resolveAccessIndex.ts`
- [x] `packages/core/src/access/resolveAccessIndex.test.ts` — the §5 matrix: unrestricted
      role ⇒ no index; single restrictive role ⇒ index; restrictive + permissive ⇒ no
      index; two differing restrictive roles ⇒ no index; anon via `anonRole`; access
      disabled ⇒ no index.
- [x] `packages/core/src/access/index.ts` — export `resolveAccessIndex`.
- Verify: `pnpm --filter @vexcms/core test`

## Step 4 — `pickQueryIndex` + tests `[dev]` — [ ]

Why: Pure function over Step 3's output; `find` needs both before it can be wired.
- [x] `packages/core/src/access/pickQueryIndex.ts`
- [x] `packages/core/src/access/pickQueryIndex.test.ts` — free slot ⇒ access claims it;
      same name ⇒ ranges merge; different name ⇒ caller wins and warns once; no access
      index ⇒ caller passthrough.
- Verify: `pnpm --filter @vexcms/core test`

## Step 5 — Wire into `find` / `get` / `search` `[dev]` — [ ]

Why: First step with observable behavior — an indexed access rule now reads only the
caller's rows.
- [x] `packages/core/src/api/find/server.ts` — resolve + pick before `buildQuery`;
      `buildQuery` takes `resolvedIndex`; the `hasPermission` pass stays unconditional.
- [x] `packages/core/src/api/get/server.ts`, `packages/core/src/api/search/server.ts` —
      same resolution; `get` narrows only when it already builds a query.
- [x] `packages/core/src/api/find/server.test.ts` — indexed rule reads only permitted
      rows and returns a full page; caller index displaces the access index and the
      filter still rejects.
- Verify: `pnpm --filter @vexcms/core test`

## Step 6 — Split `totalDocs` into its own query `[dev]` — [ ]

Why: Removes the shared read budget between page fetch and count
(`find/server.ts:194` + `:257`), so a count failure can no longer degrade a page.
- [ ] `packages/core/src/api/find/count.server.ts` — count-only handler, access index applied.
- [ ] `packages/core/src/api/find/server.ts` — drop the inline `totalDocs` branch.
- [ ] `packages/core/src/api/convex.ts` — register `findCount`.
- [x] `packages/react/src/hooks/usePaginatedQuery.ts` — `useTotalDocs` calls the new
      query instead of reading the field off the page result.
- [ ] `packages/core/src/api/find/count.server.test.ts` — count respects the access
      index; oversized collection returns `null` rather than throwing.
- Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react build`

## Step 7 — Bounded `loadMore` `[dev]` — [ ]

Why: Fixes today's empty-first-render for un-indexable rules; needs Step 6's hook
change already in place.
- [ ] `packages/core/src/config/types.ts` — `api.pagination.maxLoadMoreIterations`
      (default 5) on `VexConfigInput` / `VexConfig`.
- [ ] `packages/core/src/config/config.ts` — resolve the default.
- [ ] `packages/react/src/hooks/usePaginatedQuery.ts` — `loadMore` advances the cursor
      until the window fills, `isDone`, or the cap is hit.
- [ ] `packages/react/src/hooks/usePaginatedQuery.test.tsx` — short pages accumulate to
      a full window; cap terminates the loop.
- Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test`

## Step 8 — Dev warnings `[agent]` — [ ]

Why: Makes the slow path visible; depends on Steps 3 and 7 for the conditions it reports.
- [ ] `packages/core/src/access/warnUnindexedRule.ts` — dev-only, once per
      collection+role: bare-callback `read` on a collection past a row threshold.
- [x] `packages/core/src/access/pickQueryIndex.ts` — displaced-index warning text names
      the compound index to add.
- [ ] `packages/core/src/access/warnUnindexedRule.test.ts` — fires once per pair; silent
      in production.
- Verify: `pnpm --filter @vexcms/core test`

## Step 9 — `apps/www` wiring + docs `[dev]` — [ ]

Why: Proves the API end to end against a real schema and records the indexable boundary.
- [x] `apps/www/src/auth/access.ts` — one role with `{ filter, withIndex }` on `read`.
- [x] `apps/www/convex/vex.schema.ts` — the index that rule names.
- [ ] `apps/docs/src/content/docs/guides/access-control.mdx` — object form, the
      indexable/non-indexable boundary, `filter` is the rule and `withIndex` only
      reduces reads, and capability differences belong in roles not rule branches.
- Verify: `pnpm --filter www typecheck && pnpm --filter www build && pnpm --filter docs build`

## Step 10 — Verification `[dev]` — [ ]

- [x] `pnpm build && pnpm test && pnpm lint` clean across the workspace.
- [ ] Manual: contributor role sees only own rows in the admin list; Convex dashboard
      shows reads scaling with page size, not table size.
- Verify: `pnpm build && pnpm test`
