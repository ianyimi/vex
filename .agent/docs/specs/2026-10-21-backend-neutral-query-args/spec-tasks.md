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
  - packages/core/src/access/evaluateRuleCondition.ts
  - packages/core/src/access/types.ts
  - packages/core/src/access/hasPermission.ts
  - packages/core/src/access/buildChecks.ts
  - packages/core/src/access/index.ts
  - packages/core/src/access/validateAccessConstraints.ts
  - packages/core/src/access/resolveAccessRule.ts
  - packages/core/src/api/convex.ts
  - packages/react/src/client/whereArg.ts
  - packages/react/src/client/find/client.ts
  - packages/react/src/client/search/client.ts
  - packages/react/src/testing/harness/accessFixtures.ts
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
Vex filter builder the access layer already uses; access rules' `constraints` callback splits
into `withIndex` and `where` properties matching `find`'s arguments; `VexError` replaces
`ConvexError` in user-authored `validate()` code. `where` also accepts a plain JSON data form
(`VexWhereNode`), and the client `find` / `search` accept `where` (callback converted to a
node), guarded so a filter cannot probe a field the caller cannot read. ADR-015 records that
`@vexcms/core/server` is the permanent import path and that `withIndex` later moves into the
Convex adapter. No adapter interface, no package split.

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

## Step 5 — Access rules: `constraints` splits into `withIndex` + `where` [agent]

Why: Each rule property maps 1:1 onto the `find` argument of the same name, so `withIndex`
(Convex-specific) can later move into the Convex adapter on its own, and a predicate-only rule
is not filed under a property called `withIndex` (Decision 13). One evaluator replaces three
copies of "run the callback, read the condition".

Verify: pnpm --filter @vexcms/core test -- access api && pnpm --filter @vexcms/react test -- usePermission && pnpm -r exec tsc --noEmit

- [ ] `packages/core/src/access/evaluateRuleCondition.ts` + test — runs `withIndex` / `where`, per-property short-circuits, unreadable → `undefined`
- [ ] `packages/core/src/access/constraintTypes.ts` — add `AccessIndexSelection`; delete `AccessQueryBuilder`, `AccessPredicateBuilder`, `IndexedAccessCondition`, `AccessConditionResult`
- [ ] `packages/core/src/access/types.ts` — `AccessRuleProps`, `AccessWithIndexCallback`, `AccessWhereCallback`, new `ConstrainedPermissionCheck`; `withIndex` only on query actions; type tests first
- [ ] `resolveAccessRule.ts`, `hasPermission.ts`, `validateAccessConstraints.ts` — call `evaluateRuleCondition`; new error messages
- [ ] `buildChecks.ts` — `indexedEqCheck` / `indexedOwnerCheck` return `{ withIndex }`
- [ ] Delete `createAccessQueryBuilder.ts` + test; `access/index.ts` exports `evaluateRuleCondition`
- [ ] `packages/react/src/testing/harness/accessFixtures.ts` (public test kit)
- [ ] Test call sites: `access/*.test.ts`, `api/{find,search,get,create,update,remove}/server.test.ts`, `react/src/hooks/usePermission.test.tsx`
- [ ] `apps/test/src/auth/access.ts` (3), `packages/create-vexcms/templates/base-nextjs/src/auth/access.ts` (2)

## Step 6 — Serializable `where`: plain data form, validator, and builder→node converter [agent]

Why: `where` is a callback today; a callback cannot be saved to a database, put in a URL, or
sent over the wire. Launch spec I's saved views and URL filters need a plain form immediately,
and an MCP server, Convex-component-backed plugin collections, and backend adapters will later
(`specs/2026-10-21-adapter-readiness/stem.md` item 3, pulled forward — Decision 12). Depends on
Step 1 (`queryArgs.ts`, `VexWhere`) and Step 4 (`VexError`).

Verify: pnpm --filter @vexcms/core test -- api/queryArgs api/find api/search && pnpm -r exec tsc --noEmit

- [ ] `packages/core/src/api/queryArgs.ts` — `VexWhereNode<S>`, `VexWhere<S>` widened to a union, `whereToNode`, `validateWhereNode`, `compileWhere` takes either form plus `fields`
- [ ] `packages/core/src/api/queryArgs.test.ts` — plain node vs. builder compile to the same filter; `validateWhereNode`/`compileWhere` reject a bad shape, an unknown op, and (when `fields` is given) an unknown field, all as `VexError`; `whereToNode` round-trips
- [ ] `packages/core/src/api/find/server.ts` — passes `fields` from `args.config` into `compileWhere`; `where` JSDoc gains a plain-form example
- [ ] `packages/core/src/api/find/server.test.ts` — one plain-node `where` test
- [ ] `packages/core/src/api/search/server.ts` — same wiring and JSDoc
- [ ] `packages/core/src/api/search/server.test.ts` — one plain-node `where` test
- [ ] `packages/core/src/api/server.ts` — export `VexWhereNode`
- [ ] `packages/core/src/index.ts` — export `VexWhereNode`, `validateWhereNode`, `whereToNode` (root — no `ctx` needed, unlike `find`/`search`)

## Step 7 — `where` on the client [agent]

Why: Client `find` / `search` take the same `where` as the server (Decision 14). Spec I's list
filters and saved views use this path through `usePaginatedQuery`. A client-supplied filter is
untrusted, so it is size-capped and cannot probe fields field-level RBAC hides.

Verify: pnpm --filter @vexcms/core test -- api && pnpm --filter @vexcms/react test && pnpm -r exec tsc --noEmit

- [ ] `packages/core/src/api/queryArgs.ts` — `whereFieldNames` (collections + media + `_id`/`_creationTime`), `referencedWhereFields`, `WHERE_NODE_LIMIT` / `WHERE_DEPTH_LIMIT` in `validateWhereNode`
- [ ] `packages/core/src/api/find/server.ts`, `search/server.ts` — field list from `whereFieldNames`; drop documents where a referenced field is hidden (page and `totalDocs`)
- [ ] `packages/core/src/api/find/server.test.ts` — guard tests (denied field → none; readable → unaffected; bypass → skipped)
- [ ] `packages/core/src/api/server.ts` — `where: v.optional(v.any())` on `find` / `search`, passed through
- [ ] `packages/core/src/api/convex.ts` — `where?: VexWhereNode<string>` on `VexFindArgs`, `VexFindPaginatedArgs`, `VexSearchArgs`
- [ ] `packages/react/src/client/whereArg.ts` — callback → node
- [ ] `packages/react/src/client/find/client.ts`, `search/client.ts` — `where` on args, `find`/`search`, `findQueryKey`

## Step 8 — ADR, docs, changeset [agent]

Why: Records the rule (including the permanent `@vexcms/core/server` import path and the
future move of `withIndex` into the Convex adapter) so new APIs don't re-leak Convex types;
tells users what changed.

Verify: pnpm --filter docs build && node scripts/verify-scaffold.mjs

- [ ] `.agent/docs/decisions/ADR-015.md` — no `convex/*` types in public signatures except `ctx`; `where` portable / `withIndex` Convex-specific, on queries and access rules; `@vexcms/core/server` permanent
- [ ] `apps/docs/src/content/docs/guides/local-api.mdx` — `filter` → `where`; plain form; client example
- [ ] `apps/docs/src/content/docs/guides/access-control.mdx` — rules rewritten to `withIndex` / `where`
- [ ] `README.md` — access example rewritten to `withIndex` / `where`
- [ ] `.changeset/backend-neutral-query-args.md`
