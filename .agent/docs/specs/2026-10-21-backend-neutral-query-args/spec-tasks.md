---
status: draft
spec_id: 2026-10-21-backend-neutral-query-args
touches:
  - packages/core/src/api/queryArgs.ts
  - packages/core/src/api/queryArgs.test.ts
  - packages/core/src/api/find/server.ts
  - packages/core/src/api/find/server.test.ts
  - packages/core/src/api/search/server.ts
  - packages/core/src/api/search/server.test.ts
  - packages/core/src/api/server.ts
  - packages/core/src/errors.ts
  - packages/core/src/errors.test.ts
  - packages/core/src/index.ts
  - packages/core/src/fields/validateFields.test.ts
  - apps/test/src/vexcms/collections/pages.ts
  - apps/www/src/vexcms/collections/pages.ts
  - packages/create-vexcms/templates/marketing-site/src/vexcms/collections/pages.ts
  - packages/core/src/access/constraintTypes.ts
  - packages/core/src/access/createAccessQueryBuilder.ts
  - packages/core/src/access/validateAccessConstraints.ts
  - packages/core/src/access/resolveAccessRule.ts
  - packages/core/src/access/*.test.ts
  - packages/core/src/api/*/server.test.ts
  - packages/react/src/hooks/usePermission.test.tsx
  - apps/test/src/auth/access.ts
  - packages/create-vexcms/templates/base-nextjs/src/auth/access.ts
  - README.md
  - apps/docs/src/content/docs/guides/local-api.mdx
  - apps/docs/src/content/docs/guides/access-control.mdx
  - .agent/docs/decisions/ADR-015.md
  - .changeset/backend-neutral-query-args.md
prompt_version: 1
---

# 2026-10-21-backend-neutral-query-args — Tasks

Launch-plan item **B3**. Stop the public query API from exposing Convex's own builder
types, so a later `@vexcms/convex` adapter split (`.agent/docs/research/db-adapter-feasibility.md`)
is not a breaking change. `withIndex.range` keeps its call syntax but is typed and
compiled through the Vex index builder; `filter` is replaced by `where`, built with the
Vex filter builder the access layer already uses; access rules' `q.filter(...)` becomes
`q.where(...)` to match; `VexError` replaces `ConvexError` in user-authored `validate()` code.
ADR-015 records that `@vexcms/core/server` is the permanent import path and that `withIndex`
later moves into the Convex adapter. No adapter interface, no package split.

## Step 1 — `withIndex` / `where` types and their Convex compilers [agent]

Why: Every later step consumes these. Pure addition: new module + tests, nothing calls it
yet, so build + test stay green.

Verify: pnpm --filter @vexcms/core test -- api/queryArgs && pnpm --filter @vexcms/core exec tsc --noEmit

- [ ] `packages/core/src/api/queryArgs.ts` — `QueryIndexFieldsFor<S>`, `VexWithIndex<S>`, `VexWhere<S>`, `compileWithIndex`, `compileWhere`, `andFilters`
- [ ] `packages/core/src/api/queryArgs.test.ts` — compile output run against a real Convex query (convex-test): `compileWithIndex`, `compileWhere` (`or`/`not`), `andFilters`

## Step 2 — `find` takes `where` and the Vex-typed `withIndex` [agent]

Why: The main public read. Drops every `convex/server` builder type from `FindServerArgs`.
Breaking for `filter`, which no app or template uses.

Verify: pnpm --filter @vexcms/core test -- api/find && pnpm -r exec tsc --noEmit

- [ ] `packages/core/src/api/find/server.ts` — `FindServerArgs.withIndex` → `VexWithIndex`, `filter` → `where`, `find` compiles both
- [ ] `packages/core/src/api/find/server.test.ts` — migrate the 5 `filter:` tests to `where:`, add one `or`/`not` case
- [ ] `packages/core/src/api/server.ts` — export `VexWithIndex`, `VexWhere`

## Step 3 — `search` takes `where` [agent]

Why: Same change for the second public read; `VexCallbackApi.search` follows automatically
because it is `Omit<SearchServerArgs, …>`.

Verify: pnpm --filter @vexcms/core test -- api/search && pnpm -r exec tsc --noEmit

- [ ] `packages/core/src/api/search/server.ts` — `filter` → `where`
- [ ] `packages/core/src/api/search/server.test.ts` — one `where` test

## Step 4 — `VexError` for user-authored errors [agent]

Why: `validate()` callbacks are the one place consumers import `ConvexError` to talk to Vex.
`VexError` extends `ConvexError` today, so `toFieldValidationError` and the admin's error
display need no change.

Verify: pnpm --filter @vexcms/core test -- errors validateFields && pnpm -r build

- [ ] `packages/core/src/errors.ts` — `VexError`, `VexErrorData`
- [ ] `packages/core/src/errors.test.ts`
- [ ] `packages/core/src/index.ts` — export
- [ ] `packages/core/src/fields/validateFields.test.ts` — `validate()` throwing `VexError` keeps its data and gains `field`
- [ ] `apps/test/src/vexcms/collections/pages.ts`, `apps/www/src/vexcms/collections/pages.ts`, `packages/create-vexcms/templates/marketing-site/src/vexcms/collections/pages.ts` — `ConvexError` → `VexError`

## Step 5 — Access rules: `q.filter(...)` → `q.where(...)` [agent]

Why: One vocabulary across queries and access rules. `where` is the portable predicate and
`withIndex` the Convex index pushdown, so the adapter split later moves only `withIndex`. A pure
method rename; the builder, recorded condition, and compilers are unchanged. The rule-level
`filter` property (a JS predicate over a fetched document) keeps its name.

Verify: pnpm --filter @vexcms/core test -- access api && pnpm --filter @vexcms/react test -- usePermission && pnpm -r exec tsc --noEmit

- [ ] `packages/core/src/access/constraintTypes.ts` — `AccessPredicateBuilder.filter` and `IndexedAccessCondition.filter` → `where`, JSDoc
- [ ] `packages/core/src/access/createAccessQueryBuilder.ts` — the two runtime keys
- [ ] `packages/core/src/access/validateAccessConstraints.ts` — error message names `q.where(...)`
- [ ] `packages/core/src/access/resolveAccessRule.ts` — comment
- [ ] Test call sites: `access/{config,createAccessQueryBuilder,hasPermission,resolveAccessRule,resolveFieldPermissions,types}.test.ts`, `api/{find,search,get,create,update,remove}/server.test.ts`, `react/src/hooks/usePermission.test.tsx`
- [ ] `apps/test/src/auth/access.ts` (2), `packages/create-vexcms/templates/base-nextjs/src/auth/access.ts` (1)

## Step 6 — ADR, docs, changeset [agent]

Why: Records the rule (including the permanent `@vexcms/core/server` import path and the
future move of `withIndex` into the Convex adapter) so new APIs don't re-leak Convex types;
tells users what changed.

Verify: pnpm --filter docs build && node scripts/verify-scaffold.mjs

- [ ] `.agent/docs/decisions/ADR-015.md` — no `convex/*` types in public signatures except `ctx`; `where` portable / `withIndex` Convex-specific; `@vexcms/core/server` permanent
- [ ] `apps/docs/src/content/docs/guides/local-api.mdx` — `filter` → `where`
- [ ] `apps/docs/src/content/docs/guides/access-control.mdx` — `q.filter` → `q.where` (4 sites)
- [ ] `README.md` — access example `q.filter` → `q.where`
- [ ] `.changeset/backend-neutral-query-args.md`
