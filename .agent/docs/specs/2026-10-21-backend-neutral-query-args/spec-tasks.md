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
  - packages/core/src/access/queryConstraintTypes.ts
  - packages/core/src/access/createAccessQueryBuilder.ts
  - packages/core/src/access/evaluateQueryConstraint.ts
  - packages/core/src/access/types.ts
  - packages/core/src/access/hasPermission.ts
  - packages/core/src/access/buildChecks.ts
  - packages/core/src/access/index.ts
  - packages/core/src/access/validateAccessConfig.ts
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
  - apps/www/convex/seed.ts
  - apps/test/convex/seed.ts
  - packages/core/README.md
  - packages/core/src/access/convexTypes.ts
  - packages/core/src/access/compileQueryConstraints.ts
  - packages/core/src/access/compileQueryConstraints.test.ts
  - packages/core/src/access/evaluateQueryConstraint.test.ts
  - packages/core/src/access/validateAccessConfig.test.ts
  - packages/core/src/access/types.test.ts
  - packages/core/src/api/utils.ts
  - apps/test/src/auth/access.typecheck.ts
  - packages/core/src/access/pickConvexQueryIndex.ts
  - packages/core/src/versions/statusQueryConstraint.ts
  - packages/core/src/utils/valuesEqual.ts
  - packages/core/src/utils/index.ts
  - packages/react/src/components/views/CollectionEditView.tsx
  - packages/react/src/components/views/GlobalEditView.tsx
  - packages/react/src/hooks/useAutosave.tsx
  - packages/react/src/hooks/useLiveFieldMerge.ts
  - packages/react/src/hooks/useResetWhenSaved.ts
  - packages/richtext-plate/src/editor/PlateEditorField.tsx
  - packages/core/src/access/createQueryIndexConstraintBuilder.ts
  - packages/core/src/access/createQueryFilterConstraintBuilder.ts
  - packages/core/src/access/evaluateQueryConstraint.test.ts
  - packages/core/src/collections/indexFields.ts
  - packages/core/src/collections/resolveCollectionIndexes.ts
  - packages/core/src/collections/resolveCollectionIndexes.test.ts
  - packages/core/src/collections/config.ts
  - packages/core/src/collections/config.test.ts
  - packages/core/src/collections/validator.ts
  - packages/core/src/collections/validator.test.ts
  - packages/core/src/types/generateVexTypes.ts
  - packages/core/src/types/generateVexTypes.test.ts
  - packages/core/src/fields/baseTypes.ts
  - packages/core/src/fields/*/types.ts
  - packages/core/src/fields/*/config.ts
  - packages/core/src/fields/array/inputSchema.test.ts
  - packages/better-auth/src/adapter.ts
  - packages/react/src/index.ts
  - packages/react/src/components/fields/relationship/testFixture.ts
  - apps/test/src/vexcms/collections/fields.typecheck.ts
  - apps/docs/src/content/docs/fields/text.mdx
  - apps/docs/src/content/docs/guides/versioning-and-drafts.mdx
  - packages/core/src/api/prepareEdit.ts
  - packages/core/src/api/utils.test.ts
  - packages/core/src/utils/valuesEqual.test.ts
prompt_version: 1
---

# 2026-10-21-backend-neutral-query-args — Tasks

Launch-plan item **B3**. Stop the public query API from exposing Convex's own builder
types, so a later `@vexcms/convex` adapter split (`.agent/docs/research/db-adapter-feasibility.md`)
is not a breaking change. `withIndex.range` keeps its call syntax but is typed and
compiled through the Vex index builder; `filter` is replaced by `where`, built with the
Vex filter builder the access layer already uses; access rules' `constraints` callback splits
into `withIndex` (a static `{ name, range }` object, or a function of the caller returning one)
and `where` properties matching `find`'s arguments; `VexError` replaces
`ConvexError` in user-authored `validate()` code. `where` also accepts a plain JSON data form
(`VexWhereNode`), and the client `find` / `search` accept `where` (callback converted to a
node), guarded so a filter cannot probe a field the caller cannot read. ADR-015 records that
`@vexcms/core/server` is the permanent import path and that `withIndex` later moves into the
Convex adapter. No adapter interface, no package split.

## Step 0 — Rename the internal constraint layer, unexport Convex internals [agent]

Why: Decision 15. Internal names keep "constraint" (`Access…` → `Query…`, converters name
their Convex target), Convex-typed internals leave the root barrel per ADR-015, and deep
equality gets its own export. Pure rename first, so Steps 1–9 are written once.

Verify: pnpm -r build && pnpm -r test && pnpm -r typecheck

- [x] `packages/core/src/access/*`, `api/*`, `versions/*` — renames per Decision 15 (types, converters, builders, comparators, resolvers, validator); recorded constraint key `filter` → `where`
- [x] Module renames (+ tests): `compileConstraints` → `compileQueryConstraints`, `constraintTypes` → `queryConstraintTypes`, `createIndexConstraintBuilder` → `createQueryIndexConstraintBuilder`, `createFilterConstraintBuilder` → `createQueryFilterConstraintBuilder`, `pickQueryIndex` → `pickConvexQueryIndex`, `validateAccessConstraints` → `validateAccessConfig`, `versions/statusConstraint` → `statusQueryConstraint`
- [x] `packages/core/src/access/convexTypes.ts` — `ConvexQueryIndexRangeFn`, `ConvexQueryFilterFn`, `ConvexQueryIndex` (not re-exported)
- [x] `packages/core/src/access/index.ts` — stop re-exporting `compileQueryConstraints`, `pickConvexQueryIndex`
- [x] `packages/core/src/utils/valuesEqual.ts` + test — exported `valuesEqual`
- [x] six `CONSTRAINT_COMPARATORS.eq` call sites in `@vexcms/react` and `@vexcms/richtext-plate` → `valuesEqual`
- [x] `packages/core/src/api/utils.ts` — delete `deepEqual`; `prepareEdit.ts` uses `valuesEqual`; its tests move to `valuesEqual.test.ts`

## Step 1 — `withIndex` / `where` types and their Convex compilers [agent]

Why: Every later step consumes these. Pure addition: new module + tests, nothing calls it
yet, so build + test stay green.

Verify: pnpm --filter @vexcms/core test -- api/queryArgs && pnpm --filter @vexcms/core typecheck

- [x] `packages/core/src/api/queryArgs.ts` — `QueryIndexFieldsFor<S>`, `VexWithIndex<S>`, `VexWhere<S>`, `withIndexToConvexQueryIndex`, `whereToConvexQueryFilter`, `andConvexQueryFilters`
- [x] `packages/core/src/api/queryArgs.test.ts` — compile output run against a real Convex query (convex-test): `withIndexToConvexQueryIndex`, `whereToConvexQueryFilter` (`or`/`not`), `andConvexQueryFilters`

## Step 2 — `find` takes `where` and the Vex-typed `withIndex` [agent]

Why: The main public read. Drops every `convex/server` builder type from `FindServerArgs`.
Breaking for `filter`, which no app or template uses.

Verify: pnpm --filter @vexcms/core test -- api/find && pnpm -r typecheck

- [x] `packages/core/src/api/find/server.ts` — `FindServerArgs.withIndex` → `VexWithIndex`, `filter` → `where`, `find` compiles both
- [x] `packages/core/src/api/find/server.test.ts` — migrate the 5 `filter:` tests to `where:`, add one `or`/`not` case
- [x] `packages/core/src/api/server.ts` — export `VexWithIndex`, `VexWhere`

## Step 3 — `search` takes `where` [agent]

Why: Same change for the second public read; `VexCallbackApi.search` follows automatically
because it is `Omit<SearchServerArgs, …>`.

Verify: pnpm --filter @vexcms/core test -- api/search && pnpm -r typecheck

- [x] `packages/core/src/api/search/server.ts` — `filter` → `where`
- [x] `packages/core/src/api/search/server.test.ts` — one `where` test

## Step 4 — `VexError` for user-authored errors [agent]

Why: `validate()` callbacks are the one place consumers import `ConvexError` to talk to Vex.
`VexError` extends `ConvexError` today, so `toFieldValidationError` and the admin's error
display need no change.

Verify: pnpm --filter @vexcms/core test -- errors validateFields && pnpm -r build

- [x] `packages/core/src/errors.ts` — `VexError`, `VexErrorData`
- [x] `packages/core/src/errors.test.ts`
- [x] `packages/core/src/index.ts` — export
- [x] `packages/core/src/fields/validateFields.test.ts` — `validate()` throwing `VexError` keeps its data and gains `field`
- [x] `apps/test/src/vexcms/collections/pages.ts`, `apps/www/src/vexcms/collections/pages.ts`, `packages/create-vexcms/templates/marketing-site/src/vexcms/collections/pages.ts` — `ConvexError` → `VexError`

## Step 5 — Field index config: object form, field-led compound indexes, one index resolver [agent]

Why: Decision 16. A field's `index` takes a name or `{ name, additionalFields?, draftStatus? }`,
so a compound index can be declared on its first field, typed through `text<"articles", "slug">`.
A field-level index wins over a collection-level one of the same name, which wins over a
relationship's automatic index; two fields may not share an index name. One resolver replaces
the four places that each recomputed a collection's indexes and disagreed (schema, types,
access validation, draft-status lookup). Lands before Step 6 so access rules validate against it.

Verify: pnpm --filter @vexcms/core test -- collections types versions access && pnpm -r typecheck && pnpm --filter test vex:generate && pnpm --filter www vex:generate && ! git diff -U0 -- apps/test/convex/vex.schema.ts apps/www/convex/vex.schema.ts | grep -E '^[+-].*\.index\('

- [x] `packages/core/src/fields/baseTypes.ts` — `FieldKeyOfResource`, `FieldIndexInput`, `FieldIndexConfigInput`; `TFieldKey` second generic on `BaseFieldInput`; `indexDraftStatus` removed
- [x] 16 data fields' `*FieldInput` + factory — `TFieldKey` second generic
- [x] Positional-generic call sites: `better-auth/src/adapter.ts` (6), `react/.../relationship/testFixture.ts`, `core/.../array/inputSchema.test.ts`
- [x] `packages/react/src/index.ts` — the React `relationship` wrapper and its two aliases take `<TCollectionSlug, TFieldKey, TFieldMeta, TTargetSlug>` like core (component slot bound to `ReactHKT`), so `additionalFields`, `admin.condition` and `validate()` are typed through it
- [x] `packages/core/src/collections/resolveCollectionIndexes.ts` + test (replaces `indexFields.ts`, deleted)
- [x] `collections/config.ts`, `collections/validator.ts`, `types/generateVexTypes.ts`, `versions/statusQueryConstraint.ts`, `access/validateAccessConfig.ts`, `access/buildChecks.ts`, `access/types.ts` — read the resolver / accept the object form
- [x] Migrate tests: `generateVexTypes.test.ts`, `statusQueryConstraint.test.ts`, `validator.test.ts`, `config.test.ts`, `api/find/server.test.ts`; add compound-index tests to `validateAccessConfig.test.ts`
- [x] `apps/test/src/vexcms/collections/fields.typecheck.ts` — `additionalFields` typing pins
- [x] Docs: `fields/text.mdx` compound-index section; `guides/versioning-and-drafts.mdx` `draftStatus`

## Step 6 — Access rules: `constraints` splits into `withIndex` + `where` [agent]

Why: Each rule property maps 1:1 onto the `find` argument of the same name, so `withIndex`
(Convex-specific) can later move into the Convex adapter on its own, and a predicate-only rule
is not filed under a property called `withIndex` (Decision 13). One evaluator replaces three
copies of "run the callback, read the condition".

Verify: pnpm --filter @vexcms/core test -- access api && pnpm --filter @vexcms/react test -- usePermission && pnpm -r typecheck

- [x] `packages/core/src/access/evaluateQueryConstraint.ts` + test — runs `withIndex` (static object or callback) / `where`, per-property short-circuits, unreadable → `undefined`
- [x] `packages/core/src/access/queryConstraintTypes.ts` — add `AccessIndexSelection`; delete `AccessQueryBuilder`, `AccessPredicateBuilder`, `IndexedAccessCondition`, `AccessConditionResult`
- [x] `packages/core/src/access/types.ts` — `AccessRuleProps`, `AccessWithIndexCallback`, `AccessWithIndex` (static | callback), `AccessWhereCallback`, new `ConstrainedPermissionCheck`; `withIndex` only on query actions; shape tests and explicit-type-argument field tests in `types.test.ts` first
- [x] `apps/test/src/auth/access.typecheck.ts` — one pin proving the generated registry reaches `AccessCheck<S>`
- [x] `resolveAccessRule.ts`, `hasPermission.ts`, `validateAccessConfig.ts` — call `evaluateQueryConstraint`; new error messages
- [x] `buildChecks.ts` — `indexedEqCheck` returns the static `{ withIndex: { name, range } }`; `indexedOwnerCheck` the callback form
- [x] Delete `createAccessQueryBuilder.ts` + test; `access/index.ts` exports `evaluateQueryConstraint`
- [x] `packages/react/src/testing/harness/accessFixtures.ts` (public test kit)
- [x] Test call sites: `access/*.test.ts`, `api/{find,search,get,create,update,remove}/server.test.ts`, `react/src/hooks/usePermission.test.tsx`
- [x] `apps/test/src/auth/access.ts` (3), `packages/create-vexcms/templates/base-nextjs/src/auth/access.ts` (2)
- [x] `apps/www/convex/seed.ts`, `apps/test/convex/seed.ts` — the `/features` access-config code sample

## Step 7 — Serializable `where`: plain data form, validator, and builder→node converter [agent]

Why: `where` is a callback today; a callback cannot be saved to a database, put in a URL, or
sent over the wire. Launch spec I's saved views and URL filters need a plain form immediately,
and an MCP server, Convex-component-backed plugin collections, and backend adapters will later
(`specs/2026-10-21-adapter-readiness/stem.md` item 3, pulled forward — Decision 12). Access
rules' `where` takes the same plain node, mirroring the static `withIndex`. Depends on Step 1
(`queryArgs.ts`, `VexWhere`), Step 4 (`VexError`) and Step 6 (split rule shape).

Verify: pnpm --filter @vexcms/core test -- api/queryArgs api/find api/search access && pnpm -r typecheck

- [x] `packages/core/src/api/queryArgs.ts` — `VexWhereNode<S>`, `VexWhere<S>` widened to a union, `whereToNode`, `validateWhereNode` (with `WHERE_NODE_LIMIT` / `WHERE_DEPTH_LIMIT`), `whereToConvexQueryFilter` takes either form plus `fields`
- [x] `packages/core/src/api/queryArgs.test.ts` — plain node vs. builder compile to the same filter; `validateWhereNode`/`whereToConvexQueryFilter` reject a bad shape, an unknown op, an unknown field (when `fields` is given) and the size limits, all as `VexError` `INVALID_WHERE` with a path; `whereToNode` round-trips
- [x] `packages/core/src/api/find/server.ts` — passes `fields` from `args.config` into `whereToConvexQueryFilter`; `where` JSDoc gains a plain-form example
- [x] `packages/core/src/api/find/server.test.ts` — one plain-node `where` test
- [x] `packages/core/src/api/search/server.ts` — same wiring and JSDoc
- [x] `packages/core/src/api/search/server.test.ts` — one plain-node `where` test
- [x] `packages/core/src/api/server.ts` — export `VexWhereNode`
- [x] `packages/core/src/index.ts` — export `VexWhereNode`, `validateWhereNode`, `whereToNode` (root — no `ctx` needed, unlike `find`/`search`)
- [x] `packages/core/src/access/queryConstraintTypes.ts` — doc-typed `VexWhereNodeOf<TDoc>` (`VexWhereNode<S>` applies it to `AccessDocFor<S>`)
- [x] `packages/core/src/access/compileQueryConstraints.ts` + test — `whereNodeToQueryFilterTree` / `queryFilterTreeToWhereNode`, the only bridge between the plain node and the recorded tree
- [x] `packages/core/src/access/types.ts` + `types.test.ts` — `AccessWhere` (plain node | callback) on `ConstrainedPermissionCheck`; field tests with explicit type arguments; one registry pin in `apps/test/src/auth/access.typecheck.ts`
- [x] `packages/core/src/access/evaluateQueryConstraint.ts` + test — static `where` branch
- [x] `packages/core/src/access/validateAccessConfig.ts` + test — `validateAccessConfig` validates a static `where` once at config time; bad field/op → `VexAccessConfigError`

## Step 8 — `where` on the client [agent]

Why: Client `find` / `search` take the same `where` as the server (Decision 14). Spec I's list
filters and saved views use this path through `usePaginatedQuery`. A client-supplied filter is
untrusted, so it is size-capped (Step 7) and cannot probe fields field-level RBAC hides.

Verify: pnpm --filter @vexcms/core test -- api && pnpm --filter @vexcms/react test && pnpm -r typecheck

- [x] `packages/core/src/api/queryArgs.ts` — `whereFieldNames` (data fields via `getDataFields`, so layout children count and layout keys don't; collections + media + `_id`/`_creationTime`), `referencedWhereFields`
- [x] `packages/core/src/api/utils.ts` — `readableDocuments`: `hasPermission` + field permissions + strip, dropping a row whose `where` field is hidden
- [x] `packages/core/src/api/find/server.ts`, `search/server.ts` — field list from `whereFieldNames`; per-document pass through `readableDocuments` (page and `totalDocs`)
- [x] `packages/core/src/api/find/server.test.ts` — guard tests (denied field → none; readable → unaffected and stripped; bypass → skipped; `totalDocs` matches)
- [x] `packages/core/src/api/server.ts` — `where: v.optional(v.any())` on `find` / `search`, passed through
- [x] `packages/core/src/api/convex.ts` — `where?: VexWhereNode<string>` on `VexFindArgs`, `VexFindPaginatedArgs`, `VexSearchArgs`
- [x] `packages/react/src/client/whereArg.ts` — callback → node
- [x] `packages/react/src/client/find/client.ts`, `search/client.ts` — `where` on args, `find`/`search`, `findQueryKey`

## Step 9 — ADR, docs, changeset [agent]

Why: Records the rule (including the permanent `@vexcms/core/server` import path and the
future move of `withIndex` into the Convex adapter) so new APIs don't re-leak Convex types;
tells users what changed.

Verify: pnpm --filter docs build && node scripts/verify-scaffold.mjs

- [x] `.agent/docs/decisions/ADR-015.md` — no `convex/*` types in public signatures except `ctx`; `where` portable / `withIndex` Convex-specific, on queries and access rules; `@vexcms/core/server` permanent
- [x] `apps/docs/src/content/docs/guides/local-api.mdx` — `filter` → `where`; plain form; client example
- [x] `apps/docs/src/content/docs/guides/access-control.mdx` — rules rewritten to `withIndex` / `where`
- [x] `README.md` — access example rewritten to `withIndex` / `where`
- [x] `packages/core/README.md` — `validate()` examples and prose: `ConvexError` → `VexError`
- [x] `.changeset/backend-neutral-query-args.md`
