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
  - apps/www/convex/seed.ts
  - apps/test/convex/seed.ts
  - packages/core/README.md
  - packages/core/src/access/convexTypes.ts
  - packages/core/src/access/compileQueryConstraints.ts
  - packages/core/src/access/compileQueryConstraints.test.ts
  - packages/core/src/api/utils.ts
  - apps/test/src/auth/access.typecheck.ts
  - .changeset/backend-neutral-query-args.md
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
  - packages/core/src/access/validateAccessConfig.test.ts
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

# 2026-10-21-backend-neutral-query-args — Spec

## Overview

Launch-plan item **B3**. `find` and `search` expose Convex's own query-builder types
(`IndexRangeBuilder`, `FilterBuilder`) in their public arguments
(`api/find/server.ts` `FindServerArgs.filter`/`withIndex`, `api/search/server.ts`
`SearchServerArgs.filter`), and `validate()` callbacks throw `ConvexError` imported from
`convex/values`. Any later move of the Convex implementation into an `@vexcms/convex` adapter
(`.agent/docs/research/db-adapter-feasibility.md`) would then break every consumer.

This spec routes both query arguments through the Vex constraint builders the access layer
already ships (`access/createQueryIndexConstraintBuilder.ts`, `access/createQueryFilterConstraintBuilder.ts`),
compiled to Convex by the existing `access/compileQueryConstraints.ts`, and adds `VexError`. Access
rules change to match: the `constraints` callback splits into `withIndex` and `where`
properties that map 1:1 onto `find`'s arguments, so `where` is the portable predicate and
`withIndex` the Convex-specific index pushdown everywhere. `where` additionally accepts a
plain, JSON-serialisable form of the same filter tree (Decision 12), and the client `find` /
`search` take `where` too (Decision 14). It must land **before the 0.1.0 tag**: after that,
every rename here needs a deprecation cycle.

## Design Decisions

1. **Keep the name `withIndex`; retype its `range` with `ConstraintBuilder`.** The call syntax
   `range: (q) => q.eq("slug", slug)` is identical, so all 12 call sites in `apps/test` and
   `apps/www` compile unchanged. `withIndex` is the Convex index pushdown; other backends will
   not declare it, since their query planners choose indexes from `where` (decision 11).
2. **Replace `filter` with `where`, built with `FilterConstraintBuilder`.** The new form is
   `where: (q) => q.and(q.eq("published", true), q.neq("hidden", true))`, with fields
   referenced by name (no `q.field(...)`). The type changes either way, so the rename costs
   nothing extra. `where` is Payload's name. No app, template, or package passes `filter` to
   `find`/`search` today; only core's own tests do.
3. **No alias or deprecation for `filter`.** The project is pre-0.1.0 alpha and the default is a
   clean cutover. A `filter` argument becomes a type error.
4. **Index names come from `IndexFieldsBySlug` plus Convex's built-in `by_creation_time`**, via
   `QueryIndexFieldsFor<S>`. The arguments no longer depend on the Convex `DataModel` generic.
   `by_creation_time` is added explicitly because `vex generate` does not emit it, and ordering
   by creation time is a legitimate caller use. Before `vex generate` has run, index names
   widen to `string` and fields to `readonly string[]`, the same fallback the access layer uses.
5. **The caller's `where` and the access filter are combined into one filter before the query
   is built** (`andConvexQueryFilters`). `buildQuery` in both `find` and `search` then receives a single
   `filter` and no longer branches on two inputs.
6. **`VexError` extends `ConvexError` for now.** `toFieldValidationError` (`fields/utils.ts`)
   already preserves any `ConvexError`'s data and adds `field`, and the admin reads that shape,
   so no consumer-side change is needed. When the adapter split happens, the Convex adapter
   takes over the mapping. The public import then stays the same.
7. **Only user-authored `validate()` code migrates to `VexError`.** `convex/vex/firstUser.ts` in
   the apps and templates is the user's own Convex mutation, which is legitimately Convex, so
   it keeps `ConvexError`.
8. **The rule is recorded as ADR-015:** no public Vex signature exposes a `convex/*` type,
   except `ctx` and whatever an adapter adds through augmentation.
9. **Superseded by Decision 13.** (Was: rename `q.filter(...)` to `q.where(...)` inside the
   `constraints` callback.) Unchanged from it: the rule-level `filter` property keeps its name.
   It is a JS predicate over an already-fetched document, the same meaning as
   `Array.prototype.filter`, and already backend-neutral, so a `filter` beside `where` reads as
   "the predicate the database can't run".
10. **`@vexcms/core/server` is the permanent import path for the `ctx`-taking server API**
    (`find`, `get`, `search`, `create`, `update`, `remove`, globals, versions). A future
    database adapter plugs in *beneath* these functions; it does not take them over. This fits
    `post-v0.1.0-plan.md` decision 14 (first-party adapters ship as plugins). `@vexcms/core/convex`
    stays an alias of the same module. No import changes in apps, templates, or docs.
11. **`withIndex` is Convex-specific, on both `find` and access rules.** At the adapter split it
    moves out of core's declarations into an interface the Convex adapter augments; core keeps
    only `where`. Call sites do not change, so the move is non-breaking whenever it happens.
    It is **not** done in this spec: with one backend, the augmentation interface would be
    inert code. Recorded in ADR-015 and in
    `specs/2026-10-21-adapter-readiness/stem.md`.
12. **`where` additionally accepts a plain, JSON-serialisable node, `VexWhereNode<S>`** — a
    documented alias of the tree `FilterConstraintBuilder` already records
    (`QueryFilterConstraint`, `access/queryConstraintTypes.ts`), with friendlier keys (`and` / `or`
    / `not` in place of `kind: "and"` / `"or"` / `"not"`). `validateWhereNode` validates an
    untrusted one at runtime (a renamed field or dropped operator in a stale saved view is not
    a compile-time error) and throws `VexError` with `code: "INVALID_WHERE"`; `whereToNode`
    converts a builder callback to this shape, for saving a filter authored in code. Both
    forms compile through the same tree (`whereToConvexQueryFilter`), so a saved `VexWhereNode` and the
    builder call `whereToNode` made it from behave identically. Decided 2026-10-21: launch spec
    I's saved views and URL filters need this immediately — a function cannot be stored in a
    database or put in a URL — and an MCP server, Convex-component-backed plugin collections,
    and backend adapters will need it later. One predicate format for all of them, rather than
    each consumer inventing its own and every adapter supporting several
    (`specs/2026-10-21-adapter-readiness/stem.md` item 3, pulled forward into this spec).
    Field names stay typed per collection via `ConstraintField<AccessDocFor<S>>`, same as the
    builder. Values need no extra wire encoding: a Convex `Id<...>` is already a string and a
    `date` field is already a Unix-ms `number` (`fields/date/types.ts`), so a node's `value` is
    exactly what the field stores. No new operators — the plain form covers exactly `FilterOp`
    (`eq` / `neq` / `gt` / `gte` / `lt` / `lte`, plus `and` / `or` / `not`), the same algebra
    the builder exposes; field paths into `array`/`group` values and `in` / `contains`
    operators stay the adapter-readiness stem's open question 3.
13. **Access rules: `constraints` splits into two properties, `withIndex` and `where`**
    (decided 2026-10-23), each mapping 1:1 onto the `find` argument of the same name.
    `withIndex` takes either the static `{ name, range }` object — exactly what `find`'s
    `withIndex` takes — or a callback `({ user }) => ({ name, range })` when the range depends
    on the caller (static form decided 2026-10-25: many index rules, such as "published only",
    read no caller data, and the object form then reads like the `find` call it compiles to).
    `where` is a callback, `({ user, q }) => q.eq(...)`, or (from Step 7) the plain
    `VexWhereNode` object, mirroring the static `withIndex` (decided 2026-10-25). The `q.withIndex(...)` /
    `q.filter(...)` builder methods and their types (`AccessQueryBuilder`,
    `AccessPredicateBuilder`, `IndexedAccessCondition`, `AccessConditionResult`) are deleted.
    Why split rather than rename `constraints`: a rule using only a predicate would otherwise
    sit under a property called `withIndex`, and at the adapter split `withIndex` must move
    into the Convex adapter on its own (Decision 11), which is only possible if it is a
    separate property. `withIndex` exists only on query-shaped actions. **Any combination of
    `withIndex`, `where` and `filter` is valid** as long as `withIndex` or `where` is present;
    the data model decides which one fits. Expected frequency: `withIndex` alone (a compound
    index can cover the whole rule) and `withIndex` + `filter` (the index narrows, JS checks
    what a predicate cannot) are the common shapes; `where` alone is the shape for mutation
    actions and for fields no index leads with; `withIndex` + `where`, and all three, are rare
    but allowed. Each callback short-circuits on a boolean (`false` denies, `true` adds
    nothing); the static form never short-circuits. One evaluator (`evaluateQueryConstraint`)
    replaces the three copies of "run the callback, read the condition" in
    `resolveAccessRule`, `hasPermission`, and `validateAccessConfig`.
14. **The client `find` / `search` (`@vexcms/react/client`) take `where`** (decided
    2026-10-23). Either form is accepted; the wrapper converts a callback with `whereToNode`,
    so only the plain node crosses the network and the query key is stable. The generated
    Convex `find` / `search` functions accept `where: v.optional(v.any())` (Convex validators
    cannot express a recursive type) and validate it with `validateWhereNode`, now capped at 64
    nodes and depth 8. **Security:** a `where` must not reveal a field the caller cannot read,
    so when access is enforced, a document is excluded if the `where` references a field
    field-level RBAC hides on it. The same exclusion applies to `totalDocs`. `withIndex` stays
    server-only.
15. **Internal names stay "constraint"; only the public API is renamed** (decided 2026-10-25).
    The recorded form a rule or query argument compiles through is a separate internal layer, so
    it keeps the constraint vocabulary, renamed from `Access…` to `Query…` because `find` now
    records into it too. The changes are made in Step 0, as a pure rename that changes no
    behaviour:
    - Recorded types: `AccessIndexConstraint` → `QueryIndexConstraint`,
      `AccessFilterConstraint` → `QueryFilterConstraint`, `AccessCondition` → `QueryConstraint`,
      with its `filter` key renamed `where` (it holds the predicate tree, never the rule-level
      `filter` function).
    - Converters: `access` becomes `query`, and the Convex-only ones name their target:
      `accessConstraintsToIndexRange` → `queryConstraintsToConvexIndexRange`,
      `accessConstraintsToFilter` → `queryConstraintsToConvexFilter`,
      `accessConstraintsToPredicate` → `queryConstraintsToPredicate`,
      `accessFilterTreeToFilter` → `queryFilterTreeToConvexFilter`,
      `accessFilterTreeToPredicate` → `queryFilterTreeToPredicate`. Their module
      `access/compileConstraints.ts` (and its test) becomes `access/compileQueryConstraints.ts`.
    - Convex-typed internals: `IndexRangeFn` → `ConvexQueryIndexRangeFn`, `AccessFilterFn` →
      `ConvexQueryFilterFn`, `QueryIndex` → `ConvexQueryIndex`; `pickQueryIndex` →
      `pickConvexQueryIndex` and `composeRanges` → `composeConvexQueryRanges` (module
      `access/pickQueryIndex.ts` → `access/pickConvexQueryIndex.ts`).
    - Builders and readers of the recorded types: `createIndexConstraintBuilder` →
      `createQueryIndexConstraintBuilder`, `createFilterConstraintBuilder` →
      `createQueryFilterConstraintBuilder` (each module renamed with its function, tests
      included), `readIndexConstraints` → `readQueryIndexConstraints`; module
      `access/constraintTypes.ts` → `access/queryConstraintTypes.ts`.
    - Comparators: `CONSTRAINT_COMPARATORS` → `QUERY_INDEX_CONSTRAINT_COMPARATORS`,
      `FILTER_COMPARATORS` → `QUERY_FILTER_CONSTRAINT_COMPARATORS`.
    - Resolvers: `resolveAccessIndex` → `resolveQueryIndex`, `resolveAccessConstraint` →
      `resolveQueryConstraint`; `composeStatusConstraint` → `composeStatusQueryConstraint`
      (module `versions/statusConstraint.ts` → `versions/statusQueryConstraint.ts`).
    - Validation: the index-list validator `validateAccessConstraints` →
      `validateQueryIndexConstraints`; its module `access/validateAccessConstraints.ts` (and test)
      becomes `access/validateAccessConfig.ts`, named for the config-level entry point it also
      holds.
    - These Convex-typed names, the five converters and both comparator maps are no longer
      exported from `@vexcms/core` (ADR-015: they expose `convex/server` types).
    - `valuesEqual` (today the private `convexValuesEqual`) is exported for the six React and
      richtext-plate call sites that used `CONSTRAINT_COMPARATORS.eq` as deep equality, and
      replaces `deepEqual` in `api/utils.ts`, the one other deep-equality function.
    - New names introduced by later steps follow the same scheme: `evaluateQueryConstraint` /
      `QueryConstraintOutcome` (Step 6), `withIndexToConvexQueryIndex`,
      `whereToConvexQueryFilter`, `andConvexQueryFilters` (Step 1).
    - Unchanged: the builder types (`ConstraintBuilder`, `FilterConstraintBuilder`,
      `ConstraintResult`), `ConstrainedPermissionCheck`, and the public plain `VexWhereNode`,
      which stays separate from `QueryFilterConstraint` so stored saved views do not depend on
      the internal shape.

    Steps 1–9 use the new names throughout.
16. **A field's `index` takes a name or an object, and field-level indexes win** (decided
    2026-10-25). `index: "by_slug"` stays the shorthand for a single-field index. The object form
    `index: { name, additionalFields?, draftStatus? }` declares a compound index led by the
    field: on `author`, `index: { name: "by_author_status", additionalFields: ["status"] }`
    creates `.index("by_author_status", ["author", "status"])`. `draftStatus` moves inside the
    object, replacing the sibling `indexDraftStatus`, so it carries the same keys as a
    collection-level `indexes` entry. Field factories take the field's own key as a second,
    optional generic (`text<"articles", "slug">`; `TFieldMeta` moves to third) so
    `additionalFields` is typed to the collection's other fields; without it, `additionalFields`
    accepts any field of the collection (any string before `vex generate`), and
    `defineCollection` checks the names at runtime either way.
    **Precedence follows "a field setting overrides its collection's":** an explicit field-level
    index wins over a collection-level `indexes` entry of the same name, which wins over a
    relationship field's automatic `by_<fieldKey>` index. This reverses today's schema
    generator, where the collection-level entry won. Two fields may not declare the same index
    name: the schema generator emitted both (Convex rejects the schema) while the types merged
    them. A compound index is declared once, on its first field or in `indexes`; one that does
    not lead with a single field's own key still belongs in `indexes`. A relationship field that
    wants `draftStatus` on its automatic index now names it: `index: { name: "by_author",
    draftStatus: true }`. One resolver, `resolveCollectionIndexes`, applies all of this; the
    schema generator, `vex generate`, access-rule validation, the draft-status lookup and
    `defineCollection` read it instead of each recomputing indexes.

## Out of Scope

- A database-adapter interface, an `@vexcms/convex` package split, or any second backend.
- `withIndex` from the client. It is Convex-specific, and the generated functions do not
  expose it (Decision 14).
- `ctx` on `find({ ctx })`, the pagination shape (`paginationOpts`, `continueCursor`), and
  `_id`/`_creationTime`. All are kept as they are; another adapter emulates them.
- Changing the Convex typing of `ConvexQueryIndexRangeFn` / `ConvexQueryFilterFn`, or
  `versions/statusQueryConstraint.ts`. They are internal and stay Convex-typed until the adapter split.
- Migrating `VexAccessError` onto `VexError`.
- Moving `withIndex` into an adapter-augmented interface (decision 11).
- The remaining pre-plugin adapter-readiness items: neutral field storage kinds and `vex` in
  hook props. See `specs/2026-10-21-adapter-readiness/stem.md`. (That stem's item 3,
  serializable `where`, is now built here — Decision 12 — because launch spec I needs it
  immediately, not post-0.1.0.)

## Implementation

### Step 0 — Rename the internal constraint layer, unexport Convex internals [agent]

- [ ] Rename across `packages/core/src` per Decision 15 (types, converters, the `filter` → `where` key on the recorded constraint)
- [ ] Rename modules with their contents, updating every import and every JSDoc that names them: `access/compileConstraints.ts` → `compileQueryConstraints.ts`, `access/constraintTypes.ts` → `queryConstraintTypes.ts`, `access/createIndexConstraintBuilder.ts` → `createQueryIndexConstraintBuilder.ts`, `access/createFilterConstraintBuilder.ts` → `createQueryFilterConstraintBuilder.ts`, `access/pickQueryIndex.ts` → `pickConvexQueryIndex.ts`, `access/validateAccessConstraints.ts` → `validateAccessConfig.ts`, `versions/statusConstraint.ts` → `statusQueryConstraint.ts` (each with its `.test.ts`)
- [ ] Create `packages/core/src/access/convexTypes.ts`: move `ConvexQueryIndexRangeFn`, `ConvexQueryFilterFn`, `ConvexQueryIndex` out of `access/types.ts`
- [ ] Modify `packages/core/src/access/index.ts`: drop `export *` of `./compileConstraints` and `./pickQueryIndex`; core-internal callers import `./compileQueryConstraints`, `./pickConvexQueryIndex` and `./convexTypes` directly
- [ ] Create `packages/core/src/utils/valuesEqual.ts` (+ test): move `convexValuesEqual` here as exported `valuesEqual`; `compileQueryConstraints.ts` imports it; export from `utils/index.ts`
- [ ] Modify the six `CONSTRAINT_COMPARATORS.eq` call sites → `valuesEqual`: `react/src/components/views/CollectionEditView.tsx`, `GlobalEditView.tsx`, `react/src/hooks/useAutosave.tsx`, `useLiveFieldMerge.ts`, `useResetWhenSaved.ts`, `richtext-plate/src/editor/PlateEditorField.tsx` (update the JSDoc that names it)
- [ ] Delete `deepEqual` from `packages/core/src/api/utils.ts` and its `describe("deepEqual")` block in `utils.test.ts`; `api/prepareEdit.ts` imports `valuesEqual` instead. Move that block's cases into `valuesEqual.test.ts` (same expectations: nested equal → true, nested differ → false, primitives, `null` vs `undefined` / `{}` → false)

Why: Steps 1–9 add new code against these names; renaming first means nothing is written twice.
Behaviour is unchanged, so the existing suites are the check.

Before renaming the exported symbols, run `xd://lsp` references on each to catch consumers
outside `packages/core`; the only one found while speccing was `CONSTRAINT_COMPARATORS`.

Verify: `pnpm -r build && pnpm -r test && pnpm -r typecheck`, and
`rg -n "accessConstraintsTo|accessFilterTreeTo|AccessIndexConstraint|AccessFilterConstraint|compileConstraints|constraintTypes|\bcreateIndexConstraintBuilder|\bcreateFilterConstraintBuilder|readIndexConstraints|pickQueryIndex|composeRanges|statusConstraint|resolveAccessIndex|resolveAccessConstraint|validateAccessConstraints|deepEqual|\bIndexRangeFn\b|\bAccessFilterFn\b|\bAccessCondition\b|\bCONSTRAINT_COMPARATORS|\bFILTER_COMPARATORS" packages apps --glob '!**/dist/**'` → no hits.

### Step 1 — `withIndex` / `where` types and their Convex compilers [agent]

- [ ] Create `packages/core/src/api/queryArgs.ts`
- [ ] Create `packages/core/src/api/queryArgs.test.ts`

#### packages/core/src/api/queryArgs.ts

```ts
import type { GenericDocument } from "convex/server";

import { queryConstraintsToConvexIndexRange, queryFilterTreeToConvexFilter } from "../access/compileQueryConstraints";
import type {
  ConstraintBuilder,
  ConstraintResult,
  FilterConstraintBuilder,
  QueryFilterConstraint,
} from "../access/queryConstraintTypes";
import type { ConvexQueryFilterFn, ConvexQueryIndex } from "../access/convexTypes";
import { createQueryFilterConstraintBuilder } from "../access/createQueryFilterConstraintBuilder";
import { createQueryIndexConstraintBuilder, readQueryIndexConstraints } from "../access/createQueryIndexConstraintBuilder";
import type { AccessDocFor } from "../access/types";
import type { IndexFieldsBySlug } from "../types/generated";

/**
 * Every index a caller may name for collection `S`, as name → field tuple: the
 * indexes `vex generate` emitted (`IndexFieldsBySlug`), plus the built-in
 * `by_creation_time`, which every table has and generation does not list.
 *
 * Before `vex generate` has run, widens to any name with any field tuple —
 * the same fallback `IndexNameFor` uses.
 *
 * @typeParam S - Collection slug.
 */
export type QueryIndexFieldsFor<S extends string> = (S extends keyof IndexFieldsBySlug
  ? IndexFieldsBySlug[S]
  : Record<string, readonly string[]>) & { by_creation_time: readonly ["_creationTime"] };

/**
 * The `withIndex` argument of `find`: an index declared on `S` and an optional
 * range over its fields, in declaration order.
 *
 * The range is written with Vex's index builder rather than the database's
 * own, so the call `range: (q) => q.eq("slug", slug)` reads the same on every
 * backend. On Convex it compiles to `.withIndex(name, range)`.
 *
 * @typeParam S - Collection slug.
 *
 * @example
 * ```ts
 * find({ ctx, collection: "posts", withIndex: { name: "by_slug", range: (q) => q.eq("slug", slug) } })
 * find({ ctx, collection: "posts", withIndex: { name: "by_creation_time" }, order: "desc" })
 * ```
 */
export type VexWithIndex<S extends string> = {
  [N in keyof QueryIndexFieldsFor<S> & string]: {
    /** Index to query. */
    name: N;
    /** Range over the index's fields; omit to read the whole index in order. */
    range?: (
      q: ConstraintBuilder<Extract<QueryIndexFieldsFor<S>[N], readonly string[]>, AccessDocFor<S>, 0>,
    ) => ConstraintResult;
  };
}[keyof QueryIndexFieldsFor<S> & string];

/**
 * The `where` argument of `find` and `search`: a predicate over `S`'s fields,
 * referenced by name, combinable with `and`/`or`/`not`.
 *
 * The same builder an access rule's `q.filter(...)` receives. On Convex it
 * compiles to `.filter(...)`, which scans the narrowed range — prefer
 * `withIndex` for anything an index can express.
 *
 * @typeParam S - Collection slug.
 *
 * @example
 * ```ts
 * find({ ctx, collection: "posts", where: (q) => q.and(q.eq("featured", true), q.neq("slug", "hidden")) })
 * ```
 */
export type VexWhere<S extends string> = (q: FilterConstraintBuilder<AccessDocFor<S>>) => ConstraintResult;

/**
 * Compiles a caller's `withIndex` argument to the `ConvexQueryIndex` shape
 * `pickConvexQueryIndex` arbitrates.
 *
 * @param props - Input props.
 * @param props.withIndex - The caller's argument, already type-checked against
 *   the collection at the call site; `undefined` when the caller named no index.
 * @returns `undefined` for no index; `{ name }` for an ordering-only index;
 *   `{ name, range }` with the range compiled to a Convex `ConvexQueryIndexRangeFn`.
 */
export function withIndexToConvexQueryIndex(props: {
  withIndex: { name: string; range?: (q: never) => ConstraintResult } | undefined;
}): ConvexQueryIndex | undefined {
  const { withIndex } = props;
  if (withIndex === undefined) return undefined;
  if (withIndex.range === undefined) return { name: withIndex.name };
  // The builder's field tuple is a compile-time device; at runtime every node carries all
  // five operators, so the erased builder is the right argument for any index.
  const built = withIndex.range(createQueryIndexConstraintBuilder<readonly string[], GenericDocument>() as never);
  // Empty when the callback returned the untouched builder: an unrestricted range, which
  // `queryConstraintsToConvexIndexRange` compiles to "no restriction".
  const constraints = readQueryIndexConstraints<GenericDocument>(built);
  return { name: withIndex.name, range: queryConstraintsToConvexIndexRange({ constraints }) };
}

/**
 * Compiles a caller's `where` argument to an `ConvexQueryFilterFn` the query can
 * apply inside `.filter(...)`.
 *
 * @param props - Input props.
 * @param props.where - The caller's predicate; `undefined` when absent.
 * @returns `undefined` for no predicate, else a thunk compiling the recorded
 *   tree against the query's own `FilterBuilder`.
 */
export function whereToConvexQueryFilter(props: {
  where: ((q: never) => ConstraintResult) | undefined;
}): ConvexQueryFilterFn | undefined {
  if (props.where === undefined) return undefined;
  // Built once, eagerly: a throwing `where` fails before any read, and `find`'s main query
  // and its `totalDocs` count reuse one tree. `ConstraintResult` is nominal; the runtime
  // value is the root node, the same identity cast `createQueryFilterConstraintBuilder` documents.
  const node = props.where(
    createQueryFilterConstraintBuilder<GenericDocument>() as never,
  ) as unknown as QueryFilterConstraint<GenericDocument>;
  return (q) => queryFilterTreeToConvexFilter({ node, q });
}

/**
 * `and`s any number of optional filters into one, dropping the absent ones.
 *
 * @param props - Input props.
 * @param props.filters - Filters in application order; `undefined` entries are skipped.
 * @returns `undefined` when every entry is absent; the single filter unwrapped
 *   when only one is present; otherwise one filter `and`-ing them all.
 */
export function andConvexQueryFilters(props: { filters: readonly (ConvexQueryFilterFn | undefined)[] }): ConvexQueryFilterFn | undefined {
  const present = props.filters.filter((f): f is ConvexQueryFilterFn => f !== undefined);
  if (present.length === 0) return undefined;
  if (present.length === 1) return present[0];
  return (q) => q.and(...present.map((f) => f(q)));
}
```

#### packages/core/src/api/queryArgs.test.ts

Runs against the existing convex-test fixture (`api/test/convex/schema.ts`, `posts` table with
the `by_featured` index), the same setup `api/find/server.test.ts` uses.

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import { andConvexQueryFilters, whereToConvexQueryFilter, withIndexToConvexQueryIndex } from "./queryArgs";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

async function seed(ctx: GenericMutationCtx<GenericDataModel>) {
  await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
  await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
  await ctx.db.insert("posts", { title: "C", slug: "c", featured: true });
}

describe("withIndexToConvexQueryIndex", () => {
  test("undefined in, undefined out", () => {
    expect(withIndexToConvexQueryIndex({ withIndex: undefined })).toBeUndefined();
  });

  test("a range-less index compiles to its name only", () => {
    expect(withIndexToConvexQueryIndex({ withIndex: { name: "by_featured" } })).toEqual({ name: "by_featured" });
  });

  test("an eq range narrows the Convex index read", async () => {
    const t = convexTest(schema, modules);
    const titles = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await seed(ctx);
      const index = withIndexToConvexQueryIndex({
        withIndex: { name: "by_featured", range: ((q: any) => q.eq("featured", true)) as never },
      })!;
      const docs = await ctx.db.query("posts").withIndex(index.name, index.range!).collect();
      return docs.map((d) => d.title);
    });
    expect(titles).toEqual(["A", "C"]);
  });
});

describe("whereToConvexQueryFilter", () => {
  test("undefined in, undefined out", () => {
    expect(whereToConvexQueryFilter({ where: undefined })).toBeUndefined();
  });

  test("or + not compile to one Convex filter", async () => {
    const t = convexTest(schema, modules);
    const titles = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await seed(ctx);
      const filter = whereToConvexQueryFilter({
        where: ((q: any) => q.or(q.eq("slug", "b"), q.not(q.eq("featured", true)), q.eq("slug", "c"))) as never,
      })!;
      const docs = await ctx.db.query("posts").filter(filter).collect();
      return docs.map((d) => d.title);
    });
    expect(titles).toEqual(["B", "C"]);
  });
});

describe("andConvexQueryFilters", () => {
  test("drops absent filters and returns undefined when none remain", () => {
    expect(andConvexQueryFilters({ filters: [undefined, undefined] })).toBeUndefined();
  });

  test("a single filter is returned unwrapped", () => {
    const only = whereToConvexQueryFilter({ where: ((q: any) => q.eq("slug", "a")) as never });
    expect(andConvexQueryFilters({ filters: [undefined, only] })).toBe(only);
  });

  test("two filters intersect", async () => {
    const t = convexTest(schema, modules);
    const titles = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await seed(ctx);
      const filter = andConvexQueryFilters({
        filters: [
          whereToConvexQueryFilter({ where: ((q: any) => q.eq("featured", true)) as never }),
          whereToConvexQueryFilter({ where: ((q: any) => q.neq("slug", "a")) as never }),
        ],
      })!;
      return (await ctx.db.query("posts").filter(filter).collect()).map((d) => d.title);
    });
    expect(titles).toEqual(["C"]);
  });
});
```

Verify: `pnpm --filter @vexcms/core test -- api/queryArgs && pnpm --filter @vexcms/core typecheck`

### Step 2 — `find` takes `where` and the Vex-typed `withIndex` [agent]

- [ ] Modify `packages/core/src/api/find/server.ts` (4 edits)
- [ ] Modify `packages/core/src/api/find/server.test.ts`
- [ ] Modify `packages/core/src/api/server.ts`

#### packages/core/src/api/find/server.ts

Four edits; everything not shown is unchanged.

**1 — imports.** From the `convex/server` type import, remove `ExpressionOrValue`,
`FilterBuilder`, `IndexNames`, `IndexRange`, `IndexRangeBuilder`, `NamedIndex`, and
`TableNamesInDataModel`. Keep `GenericDataModel`, `NamedTableInfo`, and `QueryInitializer`.
Drop `type ConvexQueryIndexRangeFn` from the access import if it becomes unused. Add:

```ts
import { andConvexQueryFilters, whereToConvexQueryFilter, withIndexToConvexQueryIndex, type VexWhere, type VexWithIndex } from "../queryArgs";
```

**2 — `FindServerArgs`.** Replace the `filter` and `withIndex` members (JSDoc included) with:

```ts
  /**
   * Predicate over the collection's fields, applied after index narrowing.
   * Fields are referenced by name; combine with `q.and` / `q.or` / `q.not`.
   *
   * Prefer `withIndex` for performance: on Convex, `where` scans every document
   * in the narrowed range.
   *
   * @example
   * ```ts
   * find({ ctx, collection: "posts", where: (q) => q.eq("published", true) })
   * ```
   */
  where?: VexWhere<TCollectionSlug>;

  /**
   * Index to read through, with an optional range over its fields in
   * declaration order. Strongly preferred over `where` for performance.
   *
   * @example
   * ```ts
   * find({ ctx, collection: "posts", withIndex: { name: "by_slug", range: (q) => q.eq("slug", "hello") } })
   * find({ ctx, collection: "posts", withIndex: { name: "by_score", range: (q) => q.gte("score", 50) } })
   * find({ ctx, collection: "posts", withIndex: { name: "by_publishedAt" } })
   * ```
   */
  withIndex?: VexWithIndex<TCollectionSlug>;
```

**3 — `find` body.** Replace the `callerIndex` cast (the line beginning
`const callerIndex = args.withIndex as`, and the comment above it) with:

```ts
  const callerIndex = withIndexToConvexQueryIndex({
    withIndex: args.withIndex as { name: string; range?: (q: never) => ConstraintResult } | undefined,
  });
  const callerFilter = whereToConvexQueryFilter({ where: args.where as ((q: never) => ConstraintResult) | undefined });
```

(import `ConstraintResult` as a type from `../../access/queryConstraintTypes`). Then, in both
`buildQuery` calls (the main query and the `totalDocs` count query), replace
`accessFilter` with:

```ts
    filter: andConvexQueryFilters({ filters: [accessFilter, callerFilter] }),
```

**4 — `buildQuery`.** Replace the function:

```ts
function buildQuery<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  props: FindServerArgs<DataModel, TCollectionSlug, TPopulate, D> & {
    resolvedIndex?: ConvexQueryIndex;
    filter?: ConvexQueryFilterFn;
  },
): QueryInitializer<NamedTableInfo<DataModel, TCollectionSlug>> {
  let q = props.ctx.db.query(props.collection);

  // 1. withIndex — narrows the scan (most efficient).
  if (props.resolvedIndex) {
    // @ts-expect-error building query piece by piece from query args
    q = props.resolvedIndex.range
      ? q.withIndex(props.resolvedIndex.name, props.resolvedIndex.range)
      : q.withIndex(props.resolvedIndex.name);
  }
  // 2. order — applied after index selection.
  // @ts-expect-error building query piece by piece from query args
  if (props.order) q = q.order(props.order);
  // 3. filter — access constraint and caller `where`, already and-ed by `andConvexQueryFilters`.
  if (props.filter) q = q.filter(props.filter);

  return q;
}
```

Because `buildQuery`'s `props` spreads `FindServerArgs`, which now has a `where` member, the
caller must not also pass a raw `filter` from `args`. `FindServerArgs` no longer declares
one, so the spread carries none.

#### packages/core/src/api/find/server.test.ts

Migrate the five `filter:` call sites in the `find (server)` describe block. Expected values
stay exactly as they are:

| Test | Before | After |
|---|---|---|
| "filter narrows results by field value" → rename to "where narrows results by field value" | `filter: (q: any) => q.eq(q.field("featured"), true)` | `where: (q: any) => q.eq("featured", true)` |
| "filter with limit applies both constraints" → "where with limit …" | same | same |
| "withIndex + filter compose …" → "withIndex + where compose …" | `filter: (q: any) => q.gt(q.field("title").length ?? q.field("title"), "S")` | `where: (q: any) => q.gt("title", "S")` |
| "filter + limit + populate all compose" → "where + …" | `q.eq(q.field("featured"), true)` | `q.eq("featured", true)` |
| "paginationOpts: works with order and filter" → "… and where" | same | same |

Add one test inside the same block, beside "where narrows results by field value":

```ts
  test("where composes or/not and still meets the access filter", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
      await ctx.db.insert("posts", { title: "C", slug: "c", featured: true });
      return find({
        ctx,
        collection: "posts",
        where: (q: any) => q.or(q.eq("slug", "b"), q.not(q.eq("featured", false))),
      });
    });
    expect(docs.map((d) => d.title)).toEqual(["A", "B", "C"]);
  });
```

The access-constraint describe blocks (`find (server) — access constraints` onward) do not
pass `filter` and need no change. Their passing unchanged is the regression proof that
`andConvexQueryFilters` preserved the access half.

#### packages/core/src/api/server.ts

Beside `export type { FindServerArgs } from "./find/server";` add:

```ts
export type { QueryIndexFieldsFor, VexWhere, VexWithIndex } from "./queryArgs";
```

Verify: `pnpm --filter @vexcms/core test -- api/find && pnpm -r typecheck`. The
recursive typecheck is what proves the 12 `withIndex` call sites in `apps/test`, `apps/www`,
and the templates still compile.

### Step 3 — `search` takes `where` [agent]

- [ ] Modify `packages/core/src/api/search/server.ts` (3 edits)
- [ ] Modify `packages/core/src/api/search/server.test.ts`

#### packages/core/src/api/search/server.ts

Three edits; everything not shown is unchanged.

**1 — imports.** Remove `ExpressionOrValue`, `FilterBuilder`, and `TableNamesInDataModel` from
the `convex/server` import if they become unused. Add
`import { andConvexQueryFilters, whereToConvexQueryFilter, type VexWhere } from "../queryArgs";` and
`import type { ConstraintResult } from "../../access/queryConstraintTypes";`.

**2 — `SearchServerArgs`.** Replace the `filter` member and its JSDoc with:

```ts
  /**
   * Predicate over the collection's fields, applied to the search results.
   * Same builder as `find`'s `where`.
   *
   * @example
   * ```ts
   * search({ ctx, collection: "posts", query: "hello", searchIndexName: "search_title", searchField: "title", where: (q) => q.eq("published", true) })
   * ```
   */
  where?: VexWhere<TCollectionSlug>;
```

**3 — body.** Where `accessFilter` is finalized (after the status filter is folded in), compile
the caller's predicate once and pass the combination to every `buildQuery` call in place of
`accessFilter`:

```ts
  const filter = andConvexQueryFilters({
    filters: [accessFilter, whereToConvexQueryFilter({ where: args.where as ((q: never) => ConstraintResult) | undefined })],
  });
```

Then rename `buildQuery`'s extra prop `accessFilter?: ConvexQueryFilterFn` to `filter?: ConvexQueryFilterFn`
and replace its three-branch filter block with:

```ts
  if (args.filter) q = q.filter(args.filter);
```

`buildQuery`'s `args` type changes from `SearchServerArgs<…> & { accessFilter?: ConvexQueryFilterFn }`
to `Omit<SearchServerArgs<…>, "where"> & { filter?: ConvexQueryFilterFn }`, so the raw `where`
callback cannot be applied by mistake.

#### packages/core/src/api/search/server.test.ts

Add one test to the existing top-level describe, using its fixture and an empty `query`
(the `.take()` fallback path, so no search index is needed):

```ts
  test("where narrows the result set", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
      await ctx.db.insert("posts", { title: "C", slug: "c", featured: true });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        limit: 10,
        where: (q: any) => q.eq("featured", true),
      });
    });
    expect(docs.map((d) => d.title)).toEqual(["A", "C"]);
  });
```

`query: ""` takes the `.take()` path, which convex-test supports (its `withSearchIndex` is
unimplemented, per the file's second test); `limit` is what selects that path.

Verify: `pnpm --filter @vexcms/core test -- api/search && pnpm -r typecheck`

### Step 4 — `VexError` for user-authored errors [agent]

- [ ] Create `packages/core/src/errors.ts`
- [ ] Create `packages/core/src/errors.test.ts`
- [ ] Modify `packages/core/src/index.ts`
- [ ] Modify `packages/core/src/fields/validateFields.test.ts`
- [ ] Modify `apps/test/src/vexcms/collections/pages.ts`
- [ ] Modify `apps/www/src/vexcms/collections/pages.ts`
- [ ] Modify `packages/create-vexcms/templates/marketing-site/src/vexcms/collections/pages.ts`

#### packages/core/src/errors.ts

```ts
import { ConvexError } from "convex/values";

/**
 * A value `VexError` can carry: JSON-shaped and never `undefined`, so it
 * serializes on every backend (Convex rejects `undefined` in error data,
 * and an unserializable payload never reaches the client).
 */
export type VexErrorValue = string | number | boolean | null | VexErrorValue[] | { [key: string]: VexErrorValue };

/** Structured payload for a {@link VexError}. */
export type VexErrorData = { [key: string]: VexErrorValue };

/**
 * The error to throw from project code that Vex surfaces to editors —
 * a field's `validate()` today. Carries either a message or structured data
 * (a `code`, ids, a `message`), which the admin panel receives intact with
 * the failing `field` added.
 *
 * Import this instead of a database's own error class: the payload contract
 * is Vex's, so project code stays the same if the backend changes. On Convex
 * it is a `ConvexError`, which is what lets the data cross to the client.
 *
 * @example
 * ```ts
 * validate: async ({ value, doc, vex }) => {
 *   const [existing] = await vex.find({ collection: "pages", withIndex: { name: "by_slug", range: (q) => q.eq("slug", value) }, limit: 1 })
 *   if (existing && existing._id !== doc._id) {
 *     throw new VexError({ code: "SLUG_CONFLICT", message: "This slug is already in use." })
 *   }
 * }
 * ```
 */
export class VexError<TData extends string | VexErrorData = string | VexErrorData> extends ConvexError<TData> {
  /**
   * @param data - A message, or structured data. Include `message` in structured
   *   data for the text editors see.
   */
  constructor(data: TData) {
    super(data);
    this.name = "VexError";
  }
}
```

#### packages/core/src/errors.test.ts

```ts
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";

import { VexError } from "./errors";

describe("VexError", () => {
  it("carries structured data unchanged", () => {
    const error = new VexError({ code: "SLUG_CONFLICT", message: "Slug taken" });
    expect(error.data).toEqual({ code: "SLUG_CONFLICT", message: "Slug taken" });
    expect(error.name).toBe("VexError");
  });

  it("is a ConvexError, so Convex delivers its data to the client", () => {
    expect(new VexError("nope")).toBeInstanceOf(ConvexError);
  });
});
```

#### packages/core/src/index.ts

Add beside the other root re-exports:

```ts
export * from "./errors";
```

#### packages/core/src/fields/validateFields.test.ts

Add after the test "preserves a ConvexError's structured data so a project can carry its own codes",
and add `import { VexError } from "../errors";`:

```ts
  it("preserves a VexError's structured data and attributes it to the field", async () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        slug: text({
          validate: () => {
            throw new VexError({ message: "Slug taken", code: "SLUG_CONFLICT" });
          },
        }),
      },
    });
    await expect(
      validateFields({ fields: collection.fields, doc: { slug: "dup" }, keys: ["slug"], ctx: fixtureCtx, config: fixtureConfig }),
    ).rejects.toMatchObject({
      data: { field: "slug", message: "Slug taken", code: "SLUG_CONFLICT" },
    });
  });
```

#### apps/test/src/vexcms/collections/pages.ts

Two edits: replace `import { ConvexError } from "convex/values";` with `VexError` added to the
existing `@vexcms/core` import, and change `throw new ConvexError({` in the slug `validate()`
to `throw new VexError({`. The payload is unchanged.

#### apps/www/src/vexcms/collections/pages.ts

Same two edits as `apps/test`.

#### packages/create-vexcms/templates/marketing-site/src/vexcms/collections/pages.ts

Same two edits. Then run `node scripts/template-diff.mjs` to confirm the template and
`apps/www` agree on this file.

Verify: `pnpm --filter @vexcms/core test -- errors validateFields && pnpm -r build`

### Step 5 — Field index config: object form, field-led compound indexes, one index resolver [agent]

- [ ] Modify `packages/core/src/fields/baseTypes.ts` (`FieldKeyOfResource`, `FieldIndexInput`, `FieldIndexConfigInput`; `index` takes either form; `indexDraftStatus` removed; `TFieldKey` generic on `BaseFieldInput`)
- [ ] Modify the `*FieldInput` interface (`<name>/types.ts`) and factory (`<name>/config.ts`) of every data field — `array`, `blocks`, `checkbox`, `color`, `date`, `email`, `group`, `json`, `number`, `relationship`, `richtext`, `select`, `text`, `textarea`, `upload`, `url` — so `TFieldKey` is the second generic; `BaseUIFieldInput` passes `never` for it
- [ ] Migrate every call site that passes later generics positionally: `packages/better-auth/src/adapter.ts` (6), `packages/react/src/components/fields/relationship/testFixture.ts`, `packages/core/src/fields/array/inputSchema.test.ts`
- [ ] Modify `packages/react/src/index.ts`: the React `relationship` wrapper and its `RelationshipFieldInput` / `RelationshipField` aliases take core's owning-collection and field-key generics
- [ ] Create `packages/core/src/collections/resolveCollectionIndexes.ts` and its test; delete `collections/indexFields.ts`
- [ ] Modify `packages/core/src/collections/config.ts` (runs the resolver for its errors; the `draftStatus` guard reads `index.draftStatus`; the "indexDraftStatus with no index" check is deleted)
- [ ] Modify `packages/core/src/collections/validator.ts` (`collectionConfigToVexSchema` emits indexes from the resolver)
- [ ] Modify `packages/core/src/types/generateVexTypes.ts`, `packages/core/src/versions/statusQueryConstraint.ts`, `packages/core/src/access/validateAccessConfig.ts` (delete `collectResourceIndexFields`), `packages/core/src/access/buildChecks.ts`, `packages/core/src/access/types.ts` (`AccessResourceRef`)
- [ ] Migrate the tests that relied on two fields sharing an index name, on collection-over-field precedence, or on `indexDraftStatus`: `types/generateVexTypes.test.ts`, `versions/statusQueryConstraint.test.ts`, `collections/validator.test.ts`, `collections/config.test.ts`, `api/find/server.test.ts`
- [ ] Add the typed pins to `apps/test/src/vexcms/collections/fields.typecheck.ts`, and the compound-index tests to `access/validateAccessConfig.test.ts`
- [ ] Docs: `apps/docs/src/content/docs/fields/text.mdx` (the index section, which the other field pages link to) and `guides/versioning-and-drafts.mdx` (2 × `indexDraftStatus`)

Implements Decision 16. Independent of Steps 1–4; Step 6's access rules and Step 9's docs build
on it. No app or template call site changes: every one uses the string form, and none uses
`indexDraftStatus`.

#### packages/core/src/fields/baseTypes.ts

Import `CollectionsFieldTypeMap` and `GlobalsFieldTypeMap` from `../types/generated` beside
`VexResourceSlug`. Add before `BaseFieldInput`:

```ts
/**
 * The data field keys of resource `S`, read from the generated field-type
 * registry. Widens to `string` before `vex generate` runs; with the default
 * `VexResourceSlug` it is every collection's and global's keys.
 *
 * @typeParam S - A collection or global slug.
 */
export type FieldKeyOfResource<S extends VexResourceSlug> = S extends keyof CollectionsFieldTypeMap
  ? keyof CollectionsFieldTypeMap[S] & string
  : S extends keyof GlobalsFieldTypeMap
    ? keyof GlobalsFieldTypeMap[S] & string
    : string;

/**
 * A field-level index in object form. The index covers this field first, then
 * `additionalFields` in order:
 *
 * ```ts
 * author: relationship({ collection: users, index: { name: "by_author_status", additionalFields: ["status"] } })
 * // .index("by_author_status", ["author", "status"])
 * ```
 *
 * A field-level index wins over a collection-level `indexes` entry of the same
 * name, as every field setting wins over its collection's.
 *
 * @typeParam TCollectionSlug - The owning collection, which types `additionalFields`.
 * @typeParam TFieldKey - This field's own key, which `additionalFields` may not repeat.
 */
export interface FieldIndexInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
> {
  /** The Convex index name. */
  name: string;
  /** Fields after this one, in index order. Omit for a single-field index. */
  additionalFields?: readonly Exclude<FieldKeyOfResource<TCollectionSlug>, TFieldKey>[];
  /**
   * Also narrow this index on `vex_status` for draft/publish status composition.
   * Requires the collection's `versions.drafts: true`; `defineCollection` throws
   * otherwise. Same `true` (replaces the index) / `"both"` (adds a
   * `vex_status`-prefixed twin) contract as `CollectionConfigInput.indexes[].draftStatus`.
   */
  draftStatus?: true | "both";
}

/**
 * A field's `index`: the index name, for a single-field index, or a
 * {@link FieldIndexInput}.
 */
export type FieldIndexConfigInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
> = string | FieldIndexInput<TCollectionSlug, TFieldKey>;
```

In `BaseFieldInput`:

- Generics become `<TCollectionSlug extends VexResourceSlug = VexResourceSlug, TFieldKey extends string = never, TFieldMeta extends {} = {}>`, with JSDoc `@typeParam TFieldKey - This field's key in its collection; only types \`index.additionalFields\`, and may be omitted.`
- `index?: string` becomes `index?: FieldIndexConfigInput<TCollectionSlug, TFieldKey>`, and its JSDoc example gains the object form beside the string one.
- Delete `indexDraftStatus` and its JSDoc.

In `BaseField` (the resolved type, whose generics do not change): `index?: string` becomes
`index?: FieldIndexConfigInput<TCollectionSlug>`, and `indexDraftStatus` is deleted.
`TFieldKey` is input-only: the resolved field already passed the check, so its
`additionalFields` is simply the collection's keys.

`BaseUIFieldInput`'s `Omit<BaseFieldInput<TCollectionSlug, TFieldMeta>, …>` becomes
`Omit<BaseFieldInput<TCollectionSlug, never, TFieldMeta>, …>`. Update the
`fieldValidator` JSDoc that quotes the old order (`text<Meta, "posts">`) to `text<"posts">`.

#### Field types and factories

For each of the 16 data fields, the `*FieldInput` interface gains `TFieldKey extends string = never`
as its second generic and passes it to `BaseFieldInput`; the factory gains the same generic in
the same position and passes it to the input type. The resolved `*Field` types and the factory
return types are unchanged. `text`, as the pattern:

```ts
// text/types.ts
export interface TextFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta> {

// text/config.ts
export function text<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(options?: TextFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>): TextField<TCollectionSlug, TFieldMeta> {
```

Two fields already have more generics; `TFieldKey` still goes second:

- `array<TCollectionSlug, TFieldKey, TArrayType, TFieldMeta>` (`ArrayFieldInput` likewise).
- `relationship<TCollectionSlug, TFieldKey, TFieldMeta, TTargetSlug, TComponent>`
  (`RelationshipFieldInput` likewise).

`blocks` extends `Omit<BaseFieldInput<…>, "admin">`; pass `TFieldKey` through the same way.

Call sites that pass a later generic positionally move it one slot right:

| File | Before | After |
|---|---|---|
| `packages/better-auth/src/adapter.ts` (6) | `text<VexResourceSlug, AuthFieldMeta>(…)`, `number<VexResourceSlug, AuthFieldMeta>(…)` | `text<VexResourceSlug, never, AuthFieldMeta>(…)`, `number<VexResourceSlug, never, AuthFieldMeta>(…)` |
| `packages/react/src/components/fields/relationship/testFixture.ts` | `relationship<VexResourceSlug, CollectionFieldMeta>(…)` | `relationship<VexResourceSlug, never, CollectionFieldMeta>(…)` |
| `packages/core/src/fields/array/inputSchema.test.ts` | `array<VexResourceSlug, number>(…)` | `array<VexResourceSlug, never, number>(…)` |

The three `text<typeof TABLE_SLUG_PAGES>(…)` calls in `apps/test`, `apps/www` and the
marketing template pass only the slug and are unchanged.

#### packages/react/src/index.ts — the React `relationship` wrapper

The wrapper exposes only `<TFieldMeta, TTargetSlug>` and calls core with `VexResourceSlug` as
the owning collection, so there is nowhere to pass the collection or the field key: through
it, `index.additionalFields` accepts any field of any collection, and `admin.condition` and
`validate()` get the wide document instead of the owning collection's. Its two aliases do the
same, and name the *target* slug `TCollectionSlug`. Give all three core's leading generics, with
only the component slot bound to `ReactHKT`:

```ts
/**
 * Relationship field input type with the React component slot bound.
 *
 * Identical to `@vexcms/core`'s `RelationshipFieldInput` except
 * `admin.components.preview` is typed as `ComponentType<RelationshipPreviewProps<TTargetSlug>>`.
 */
export type RelationshipFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
  TTargetSlug extends CollectionSlug = CollectionSlug,
> = CoreRelationshipFieldInput<TCollectionSlug, TFieldKey, TFieldMeta, TTargetSlug, ReactHKT>;

/**
 * Resolved relationship field type with the React component slot bound.
 *
 * Identical to `@vexcms/core`'s `RelationshipField` except
 * `admin.components.preview` is typed as `ComponentType<RelationshipPreviewProps<TTargetSlug>>`.
 */
export type RelationshipField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
  TTargetSlug extends CollectionSlug = CollectionSlug,
> = CoreRelationshipField<TCollectionSlug, TFieldMeta, TTargetSlug, ReactHKT>;

/**
 * Defines a relationship field with React-typed component slots.
 *
 * Drop-in replacement for `@vexcms/core`'s `relationship`, with the same generics
 * minus the component slot: `relationship<"articles", "author">({ … })` types
 * `index.additionalFields`, `admin.condition` and `validate()` against `articles`.
 *
 * @param options - Relationship field configuration.
 * @returns The resolved relationship field definition.
 */
export function relationship<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
  TTargetSlug extends CollectionSlug = CollectionSlug,
>(
  options: RelationshipFieldInput<TCollectionSlug, TFieldKey, TFieldMeta, TTargetSlug>,
): RelationshipField<TCollectionSlug, TFieldMeta, TTargetSlug> {
  return coreRelationship<TCollectionSlug, TFieldKey, TFieldMeta, TTargetSlug, ReactHKT>(options);
}
```

The old comment about binding only the component slot is deleted with the `VexResourceSlug`
pin it explained. No caller in the repo passes generics to the React wrapper or its aliases
(the relationship tests and components import core's types), and `@vexcms/next` re-exports the
wrapper, so it gets the new signature unchanged. Add one pin to
`apps/test/src/vexcms/collections/fields.typecheck.ts` beside the `text` pins, importing the
wrapper as `relationship as reactRelationship` from `@vexcms/react`:

```ts
// @ts-expect-error — `nope` is not a field of articles, through the React wrapper too
reactRelationship<typeof TABLE_SLUG_ARTICLES, "authorId">({ collection: { slug: TABLE_SLUG_USERS }, index: { name: "by_author_x", additionalFields: ["nope"] } });
```

`authorId` is articles' relationship field (`editorialFields.ts`); add `TABLE_SLUG_USERS` to the
`~/db/constants` import.

#### packages/core/src/collections/resolveCollectionIndexes.ts

Replaces `collections/indexFields.ts` (delete it; `generateVexTypes.ts` was its only caller).

```ts
import { ADMIN_FIELDS, getDataFields, type AdminField, type FieldIndexConfigInput } from "../fields";

/** One index a collection declares, after precedence — exactly what the schema creates. */
export interface ResolvedCollectionIndex {
  /** The Convex index name, which `withIndex` names. */
  name: string;
  /** Field keys in index order. Logical: a `draftStatus` index's `vex_status` prefix is not included. */
  fields: readonly string[];
  /** The `draftStatus` of whichever declaration won, if it set one. */
  draftStatus?: true | "both";
  /** Which kind of declaration won. */
  source: "field" | "collection" | "relationship";
}

/** A field's `index` in one shape. */
type FieldIndexDeclaration = { name: string; additionalFields: readonly string[]; draftStatus?: true | "both" };

/**
 * Normalizes a field's `index` to the object form.
 *
 * @param index - The string shorthand or the object form.
 * @returns The declaration with `additionalFields` defaulted to `[]`.
 */
function toFieldIndexDeclaration(index: FieldIndexConfigInput): FieldIndexDeclaration {
  if (typeof index === "string") return { name: index, additionalFields: [] };
  return {
    name: index.name,
    additionalFields: index.additionalFields ?? [],
    ...(index.draftStatus !== undefined ? { draftStatus: index.draftStatus } : {}),
  };
}

/**
 * Every index a collection declares, in schema order (collection-level entries
 * first, then field-level and automatic relationship indexes in field order), with
 * precedence applied: an explicit field-level `index` wins over a collection-level
 * `indexes` entry of the same name, which wins over a relationship field's
 * automatic `by_<fieldKey>` index.
 *
 * The one source of index truth. The schema generator, `vex generate`, access-rule
 * validation, the draft-status lookup and `defineCollection` all read it, so they
 * cannot disagree about which indexes exist. Fields inside `tabs` / `row` /
 * `collapsible` count under their data keys (`getDataFields`).
 *
 * @param props - Input props.
 * @param props.collection - A collection, or a global (which declares no `indexes`).
 * @returns The resolved indexes.
 * @throws {Error} When two fields declare the same index name; when a field-level
 *   index takes another relationship field's automatic name; when `additionalFields`
 *   names an unknown field, the field itself, or a field twice; or when two
 *   collection-level `indexes` entries share a name.
 */
export function resolveCollectionIndexes(props: {
  collection: {
    slug: string;
    fields: Record<string, AdminField>;
    indexes?: readonly { name: string; fields: readonly string[]; draftStatus?: true | "both" }[];
  };
}): ResolvedCollectionIndex[] {
  const { slug } = props.collection;
  const dataFields = getDataFields({ fields: props.collection.fields });
  const fieldKeys = new Set(Object.keys(dataFields));
  const at = `defineCollection: collection "${slug}"`;

  // 1. Explicit field-level indexes, keyed by name.
  const fieldLevel = new Map<string, ResolvedCollectionIndex>();
  for (const [fieldKey, field] of Object.entries(dataFields)) {
    if (field.index === undefined) continue;
    const declared = toFieldIndexDeclaration(field.index);
    const taken = fieldLevel.get(declared.name);
    if (taken !== undefined) {
      throw new Error(
        `${at}: fields "${taken.fields[0]}" and "${fieldKey}" both declare index "${declared.name}". ` +
          `Declare a compound index once, on its first field — index: { name: "${declared.name}", additionalFields: ["${fieldKey}"] } on "${taken.fields[0]}" — or in the collection's indexes.`,
      );
    }
    const listed = new Set<string>([fieldKey]);
    for (const extra of declared.additionalFields) {
      if (!fieldKeys.has(extra)) {
        throw new Error(`${at}: index "${declared.name}" on field "${fieldKey}" lists "${extra}" in additionalFields, which is not a field of this collection.`);
      }
      if (listed.has(extra)) {
        throw new Error(`${at}: index "${declared.name}" on field "${fieldKey}" lists "${extra}" twice (the field itself always comes first).`);
      }
      listed.add(extra);
    }
    fieldLevel.set(declared.name, {
      name: declared.name,
      fields: [fieldKey, ...declared.additionalFields],
      ...(declared.draftStatus !== undefined ? { draftStatus: declared.draftStatus } : {}),
      source: "field",
    });
  }

  // 2. A relationship field without its own `index` gets `by_<fieldKey>`; an explicit
  //    field-level index may not take that name from another field.
  for (const [fieldKey, field] of Object.entries(dataFields)) {
    if (field.type !== ADMIN_FIELDS.relationship.type || field.index !== undefined) continue;
    const explicit = fieldLevel.get(`by_${fieldKey}`);
    if (explicit !== undefined) {
      throw new Error(
        `${at}: field "${explicit.fields[0]}" declares index "by_${fieldKey}", the automatic index name of relationship field "${fieldKey}". ` +
          `Rename the index, or give "${fieldKey}" its own index.`,
      );
    }
  }

  // 3. Assemble in schema order.
  const resolved: ResolvedCollectionIndex[] = [];
  const collectionLevelNames = new Set<string>();
  for (const index of props.collection.indexes ?? []) {
    if (collectionLevelNames.has(index.name)) {
      throw new Error(`${at}: declares index "${index.name}" twice in indexes.`);
    }
    collectionLevelNames.add(index.name);
    if (fieldLevel.has(index.name)) continue; // the field-level declaration wins
    resolved.push({
      name: index.name,
      fields: [...index.fields],
      ...(index.draftStatus !== undefined ? { draftStatus: index.draftStatus } : {}),
      source: "collection",
    });
  }
  for (const [fieldKey, field] of Object.entries(dataFields)) {
    if (field.index !== undefined) {
      resolved.push(fieldLevel.get(toFieldIndexDeclaration(field.index).name)!);
    } else if (field.type === ADMIN_FIELDS.relationship.type && !collectionLevelNames.has(`by_${fieldKey}`)) {
      resolved.push({ name: `by_${fieldKey}`, fields: [fieldKey], source: "relationship" });
    }
  }
  return resolved;
}
```

Export it from `collections/index.ts` as internal (beside the other `@internal` collection
helpers), not from the package root.

#### packages/core/src/collections/resolveCollectionIndexes.test.ts

```ts
import { describe, expect, it } from "vitest";

import { relationship, row, text } from "../fields";
import { resolveCollectionIndexes } from "./resolveCollectionIndexes";

type Collection = Parameters<typeof resolveCollectionIndexes>[0]["collection"];
const resolve = (collection: Omit<Collection, "slug">) => resolveCollectionIndexes({ collection: { slug: "posts", ...collection } });

describe("resolveCollectionIndexes — declarations", () => {
  it("reads the string shorthand, the object form, and relationship auto-indexes", () => {
    expect(
      resolve({
        fields: {
          slug: text({ index: "by_slug" }),
          author: relationship({ collection: { slug: "users" }, index: { name: "by_author_status", additionalFields: ["status"] } }),
          status: text(),
          editor: relationship({ collection: { slug: "users" } }),
        },
      }),
    ).toEqual([
      { name: "by_slug", fields: ["slug"], source: "field" },
      { name: "by_author_status", fields: ["author", "status"], source: "field" },
      { name: "by_editor", fields: ["editor"], source: "relationship" },
    ]);
  });

  it("carries draftStatus from the object form", () => {
    expect(resolve({ fields: { slug: text({ index: { name: "by_slug", draftStatus: "both" } }) } })).toEqual([
      { name: "by_slug", fields: ["slug"], draftStatus: "both", source: "field" },
    ]);
  });

  it("counts a field inside a row under its own key", () => {
    expect(resolve({ fields: { names: row({ fields: { first: text({ index: { name: "by_name", additionalFields: ["last"] } }), last: text() } }) } })).toEqual([
      { name: "by_name", fields: ["first", "last"], source: "field" },
    ]);
  });
});

describe("resolveCollectionIndexes — precedence", () => {
  it("lets a field-level index win over a collection-level entry of the same name", () => {
    expect(
      resolve({
        fields: { slug: text({ index: { name: "by_slug", additionalFields: ["status"] } }), status: text() },
        indexes: [{ name: "by_slug", fields: ["slug"] }],
      }),
    ).toEqual([{ name: "by_slug", fields: ["slug", "status"], source: "field" }]);
  });

  it("lets a collection-level entry replace a relationship's automatic index", () => {
    expect(
      resolve({
        fields: { author: relationship({ collection: { slug: "users" } }), status: text() },
        indexes: [{ name: "by_author", fields: ["author", "status"] }],
      }),
    ).toEqual([{ name: "by_author", fields: ["author", "status"], source: "collection" }]);
  });
});

describe("resolveCollectionIndexes — errors", () => {
  it("rejects two fields declaring the same name, pointing at additionalFields", () => {
    expect(() => resolve({ fields: { a: text({ index: "by_x" }), b: text({ index: "by_x" }) } })).toThrow(
      'defineCollection: collection "posts": fields "a" and "b" both declare index "by_x". Declare a compound index once, on its first field — index: { name: "by_x", additionalFields: ["b"] } on "a" — or in the collection\'s indexes.',
    );
  });

  it("rejects taking another relationship field's automatic name", () => {
    expect(() => resolve({ fields: { slug: text({ index: "by_author" }), author: relationship({ collection: { slug: "users" } }) } })).toThrow(
      /the automatic index name of relationship field "author"/,
    );
  });

  it("rejects an unknown, self-referencing or repeated additional field", () => {
    expect(() => resolve({ fields: { a: text({ index: { name: "by_a", additionalFields: ["nope"] } }) } })).toThrow(/not a field of this collection/);
    expect(() => resolve({ fields: { a: text({ index: { name: "by_a", additionalFields: ["a"] } }) } })).toThrow(/lists "a" twice/);
    expect(() => resolve({ fields: { a: text({ index: { name: "by_a", additionalFields: ["b", "b"] } }), b: text() } })).toThrow(/lists "b" twice/);
  });

  it("rejects two collection-level entries with one name", () => {
    expect(() =>
      resolve({ fields: { a: text(), b: text() }, indexes: [{ name: "by_x", fields: ["a"] }, { name: "by_x", fields: ["b"] }] }),
    ).toThrow('defineCollection: collection "posts": declares index "by_x" twice in indexes.');
  });
});
```

#### packages/core/src/collections/config.ts

- After the existing `getDataFields({ fields: input.fields })` duplicate-key check, add
  `resolveCollectionIndexes({ collection: input });` with the comment "Index declarations
  are checked here, at definition time; the result is recomputed where it is used."
- In the `versions.drafts !== true` guard, the field offender becomes
  `([, field]) => typeof field.index === "object" && field.index.draftStatus !== undefined`, and
  its message reads `declares index.draftStatus but versions.drafts is not true.`
- Delete the loop that rejects `indexDraftStatus` with no index; the object form makes that
  state unrepresentable.

#### packages/core/src/collections/validator.ts

In `collectionConfigToVexSchema`, delete the collection-level `indexes` loop and the
per-field index branch inside the fields loop, and emit from the resolver instead:

```ts
  for (const index of resolveCollectionIndexes({ collection: props.collection })) {
    const plain = JSON.stringify(index.fields);
    const prefixed = JSON.stringify(["vex_status", ...index.fields]);
    if (index.draftStatus === true) {
      indexes.push(`\t.index("${index.name}", ${prefixed})`);
    } else if (index.draftStatus === "both") {
      indexes.push(`\t.index("${index.name}", ${plain})`, `\t.index("${index.name}__draftStatus", ${prefixed})`);
    } else {
      indexes.push(`\t.index("${index.name}", ${plain})`);
    }
  }
```

The emitted order is unchanged (collection-level, then field order), and `JSON.stringify(["slug"])`
prints the same `["slug"]` the old template literal did, so generated `vex.schema.ts` files
only change where precedence does. Update the function's JSDoc bullet list: field-level
indexes may be compound, and win over a collection-level entry of the same name.

#### packages/core/src/types/generateVexTypes.ts

Replace the `collectionConfigToIndexFields` import and call with
`indexFields: new Map(resolveCollectionIndexes({ collection: c }).map((index) => [index.name, [...index.fields]]))`.

#### packages/core/src/versions/statusQueryConstraint.ts

`resolveIndexDraftStatus`'s body becomes:

```ts
  const collection = props.config?.collections.find((c) => c.slug === props.collection);
  if (!collection) return undefined;
  return resolveCollectionIndexes({ collection }).find((index) => index.name === props.indexName)?.draftStatus;
```

Its JSDoc's lookup-order paragraph becomes "Reads the index `resolveCollectionIndexes` resolved
under that name, so the precedence matches the schema." Drop the `ADMIN_FIELDS` /
`getDataFields` imports if nothing else uses them.

#### packages/core/src/access/validateAccessConfig.ts

Delete `collectResourceIndexFields` and its `ADMIN_FIELDS` import (Step 7's static-`where`
check still uses `getDataFields`). Pass
`indexFields: Object.fromEntries(resolveCollectionIndexes({ collection: resource }).map((index) => [index.name, index.fields]))`
to `validateQueryIndexConstraints`. In `validateQueryIndexConstraints`'s JSDoc, replace "every
declared index is single-field today, but this validator is written generically and stays
correct if compound indexes are ever declarable" with "compound indexes come from a field's
`index.additionalFields` or the collection's `indexes`".

#### packages/core/src/access/types.ts and buildChecks.ts

`AccessResourceRef.fields`'s value type `{ readonly index?: string; readonly type?: string }`
becomes `{ readonly index?: string | { readonly name: string }; readonly type?: string }`, so a
collection with an object-form index still satisfies it. In `buildChecks.ts`, `indexNameFor`
reads the name from either form:

```ts
  const declared = resource.fields[field]?.index;
  const name = typeof declared === "string" ? declared : declared?.name;
  if (name) return name as AccessIndexNameFor<S, F>;
```

#### Existing tests

| Test | Change |
|---|---|
| `types/generateVexTypes.test.ts` "groups two fields sharing the same index name…" | Becomes "emits a field-level compound index as one tuple": `authorId: text({ index: { name: "by_author_category", additionalFields: ["categoryId"] } })`, `categoryId: text()`; same expected tuple. Add one case: a collection-level `indexes` entry appears in `IndexFieldsBySlug`. |
| `versions/statusQueryConstraint.test.ts` (3 × `indexDraftStatus`, including the two-field `by_author_slug`) | `text({ index: "x", indexDraftStatus: true })` → `text({ index: { name: "x", draftStatus: true } })`; the `by_author_slug` pair becomes `authorId: text({ index: { name: "by_author_slug", additionalFields: ["slug"], draftStatus: true } })`, `slug: text()`. Expectations unchanged. |
| `collections/validator.test.ts` "builds a compound index properly across multiple fields" | Its relationship declares `index: "by_author_title"` and the collection declares the compound entry under the same name, which the field now wins. Drop the field's `index` so the collection entry stands, and add a case for the field-level form (`index: { name: "by_author_title", additionalFields: ["title"] }`, no `indexes`), both expecting `.index("by_author_title", ["author","title"])`. The 3 `indexDraftStatus` uses migrate as above. |
| `collections/config.test.ts` (8 × `indexDraftStatus`) | Migrate as above. The test asserting "declares indexDraftStatus with no index" is deleted with the check; the `versions.drafts` guard tests assert the new `index.draftStatus` message. |
| `api/find/server.test.ts` (1 × `indexDraftStatus`) | Migrate as above. |

#### packages/core/src/access/validateAccessConfig.test.ts

Add, importing `defineCollection` and `text` from `../index`, `defineAccess` from `./config`,
`VexAccessConfigError` from `./types` and `validateAccessConfig` from `./validateAccessConfig`
(Step 7 later adds a static-`where` describe beside it):

```ts
describe("validateAccessConfig — compound indexes", () => {
  const users = defineCollection({ slug: "users", fields: { roles: text() } });

  /** An access config whose only rule is `reader → articles.read: { withIndex }`, over `articles`. */
  const accessWithIndex = (articles: ReturnType<typeof defineCollection>, withIndex: unknown) =>
    defineAccess({
      roles: ["reader"] as const,
      resources: [articles, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: { reader: { articles: { read: { withIndex: withIndex as never } } } },
    });

  const fieldLevel = defineCollection({
    slug: "articles",
    fields: { authorId: text({ index: { name: "by_author_status", additionalFields: ["status"] } }), status: text() },
  });
  const collectionLevel = defineCollection({
    slug: "articles",
    fields: { authorId: text(), status: text() },
    indexes: [{ name: "by_author_status", fields: ["authorId", "status"] }],
  });
  const fullRange = { name: "by_author_status", range: (ix: any) => ix.eq("authorId", "u1").eq("status", "published") };

  it("accepts a range over a field-level or a collection-level compound index", () => {
    expect(() => validateAccessConfig(accessWithIndex(fieldLevel, fullRange) as never)).not.toThrow();
    expect(() => validateAccessConfig(accessWithIndex(collectionLevel, fullRange) as never)).not.toThrow();
  });

  it("rejects a range that skips the compound index's first field", () => {
    expect(() =>
      validateAccessConfig(
        accessWithIndex(fieldLevel, { name: "by_author_status", range: (ix: any) => ix.eq("status", "published") }) as never,
      ),
    ).toThrow(
      new VexAccessConfigError(
        'role "reader" on articles.read: constraint fields [status] are not an in-order prefix of index "by_author_status" ([authorId, status])',
      ),
    );
  });
});
```

#### apps/test/src/vexcms/collections/fields.typecheck.ts

`additionalFields` is typed from the generated registry, which core's suite does not have, so
the pins live here, as bare calls like the file's existing `tabs()` pin (add
`TABLE_SLUG_ARTICLES` to the `~/db/constants` import):

```ts
// ── field index: additionalFields is typed to the collection's other fields ──
text<typeof TABLE_SLUG_ARTICLES, "slug">({ index: { name: "by_slug_status", additionalFields: ["status"] } });
// @ts-expect-error — a field cannot list itself in its own index
text<typeof TABLE_SLUG_ARTICLES, "slug">({ index: { name: "by_slug_x", additionalFields: ["slug"] } });
// @ts-expect-error — `nope` is not a field of articles
text<typeof TABLE_SLUG_ARTICLES, "slug">({ index: { name: "by_slug_x", additionalFields: ["nope"] } });
// Without the generics any key is accepted; defineCollection checks it at runtime.
text({ index: { name: "by_slug_x", additionalFields: ["anything"] } });
```

#### Docs

- `apps/docs/src/content/docs/fields/text.mdx`: the `index` option row reads
  "`string | { name, additionalFields?, draftStatus? }`", followed by a short "Compound
  indexes" section with the `author` / `by_author_status` example from `FieldIndexInput`'s
  JSDoc, the precedence rule (a field-level index wins over a collection-level one of the same
  name), the `text<"articles", "slug">` generics for typed `additionalFields`, and a pointer to
  collection-level `indexes` for an index that does not lead with one field. The other field
  pages' `index` rows link to this section.
- `apps/docs/src/content/docs/guides/versioning-and-drafts.mdx`: both `indexDraftStatus`
  examples become `index: { name: …, draftStatus: … }`.

Verify: `pnpm --filter @vexcms/core test -- collections types versions access && pnpm -r typecheck && pnpm --filter test vex:generate && pnpm --filter www vex:generate`, then no `.index(...)` line changes in either app's regenerated `vex.schema.ts` (no app declares a compound or colliding index). apps/www's generated files were stale at HEAD and are regenerated in this change set.

### Step 6 — Access rules: `constraints` splits into `withIndex` + `where` [agent]

- [ ] Create `packages/core/src/access/evaluateQueryConstraint.ts`
- [ ] Create `packages/core/src/access/evaluateQueryConstraint.test.ts`
- [ ] Modify `packages/core/src/access/queryConstraintTypes.ts` (add `AccessIndexSelection`; delete the `q`-builder interfaces)
- [ ] Modify `packages/core/src/access/types.ts` (`ConstrainedPermissionCheck` and its callback types)
- [ ] Modify `packages/core/src/access/resolveAccessRule.ts`, `hasPermission.ts`, `validateAccessConfig.ts` (call the new evaluator)
- [ ] Modify `packages/core/src/access/buildChecks.ts` (`indexedEqCheck`, `indexedOwnerCheck`)
- [ ] Delete `packages/core/src/access/createAccessQueryBuilder.ts` and `createAccessQueryBuilder.test.ts`; update `access/index.ts`
- [ ] Modify `packages/react/src/testing/harness/accessFixtures.ts` (exported test kit)
- [ ] Migrate test call sites in `packages/core/src/access/*.test.ts`, `packages/core/src/api/{find,search,get,create,update,remove}/server.test.ts`, `packages/react/src/hooks/usePermission.test.tsx`
- [ ] Migrate `apps/test/src/auth/access.ts` (3 rules) and `packages/create-vexcms/templates/base-nextjs/src/auth/access.ts` (2 rules)
- [ ] Rewrite the access-config code sample in `apps/www/convex/seed.ts` and `apps/test/convex/seed.ts` (rendered on `/features`)

Implements Decision 13. Depends on Step 1 (index builder types) and Step 5 (resolved indexes).
Independent of Steps 2–4 and 7.

**The new rule shape.** Each property maps 1:1 onto the `find` argument of the same name.
Examples in order of expected frequency:

```ts
// 1. withIndex alone, static: the same object `find` takes
read: { withIndex: { name: "by_status", range: (ix) => ix.eq("status", "published") } }

// 1b. withIndex alone, caller-dependent: a callback returning that object
read: { withIndex: ({ user }) => ({ name: "by_author", range: (ix) => ix.eq("author", user._id) }) }

// 1c. a compound index covers what would otherwise need a `where`
read: {
  withIndex: ({ user }) => ({
    name: "by_author_status",
    range: (ix) => ix.eq("author", user._id).eq("status", "published"),
  }),
}

// 2. withIndex + filter: the index narrows, `filter` checks what no predicate can express
read: {
  withIndex: { name: "by_status", range: (ix) => ix.eq("status", "published") },
  filter: ({ data }) => data.tags.includes("featured"),
}

// 3. where alone: mutation actions (no `withIndex` there), or a field no index leads with
update: { where: ({ user, q }) => q.eq("author", user._id) }

// 4. withIndex + where, or all three: rare, allowed
read: {
  withIndex: { name: "by_status", range: (ix) => ix.eq("status", "published") },
  where: ({ q }) => q.neq("archived", true),
  filter: ({ data }) => data.tags.includes("featured"),
}
```

- `withIndex: { name, range } | ((props) => boolean | { name, range })`. Query-shaped actions
  only. Use the object when the range reads no caller data, the callback when it does (or to
  short-circuit on the caller: `({ user }) => user.isAdmin || { name, range }`). Both forms
  are typed identically: `name` against the resource's declared indexes, `range`'s `ix`
  against that index's field tuple, in order. `range` is **required**, as today: a range-less
  index restricts nothing. This is the same discriminated `{ name, range }` object as `find`'s
  `withIndex` (`VexWithIndex`, Step 1). The callback is told apart from the object by
  `typeof === "function"` (the object's `range` is a function, the object itself is not).
- `where: (props & { q }) => boolean | ConstraintResult`. Every action. `q` is the
  `FilterConstraintBuilder`, the same builder `find`'s `where` callback receives.
- `filter?` (unchanged): the per-document JS predicate for what neither can express.
- `props` is `{ user }`, plus `{ organization }` when `orgCollectionSlug` is configured. This
  is the same caller context `constraints` received, without `q` on `withIndex`.
- At least one of `withIndex` / `where` must be present. A `filter`-only object stays
  rejected (write a bare callback instead), as today.
- **Short-circuits per property:** `false` from either callback denies; `true` means "this
  half adds no restriction"; `true` from every present callback means unrestricted. A static
  `withIndex` always narrows. So `({ user, q }) => user.isAdmin || q.filter(...)` becomes
  `where: ({ user, q }) => user.isAdmin || q.eq(...)`.

#### packages/core/src/access/queryConstraintTypes.ts

**Delete** `AccessConditionResult`, `IndexedAccessCondition`, `AccessPredicateBuilder`, and
`AccessQueryBuilder` (types and JSDoc). Everything else stays (`ConstraintBuilder`,
`FilterConstraintBuilder`, `ConstraintResult`, `QueryFilterConstraint`,
`QueryIndexConstraint`, `IndexOp`, `FilterOp`, the field/value helpers). **Add** after
`ConstraintBuilder`:

```ts
/**
 * The index half of an access rule: which declared index to read through and the
 * range over its fields, as a discriminated object — the same shape as `find`'s
 * `withIndex` argument, with `range` required.
 *
 * Discriminating on the literal `name` is what types `ix` against THAT index's
 * field tuple, in declaration order, so Convex's field-order rule is a compile
 * error at the rule.
 *
 * @typeParam TDoc - Document shape range values are typed from.
 * @typeParam TIndexFields - The resource's index name → field tuple map.
 */
export type AccessIndexSelection<TDoc, TIndexFields extends Record<string, readonly string[]>> = {
  [N in keyof TIndexFields & string]: {
    /** A declared index on this resource. */
    name: N;
    /** Range over the index's fields. Required: a range-less index restricts nothing. */
    range: (ix: ConstraintBuilder<TIndexFields[N], TDoc, 0>) => ConstraintResult;
  };
}[keyof TIndexFields & string];
```

#### packages/core/src/access/types.ts

Replace `ConstraintsCallbackProps`, `ConstraintsCallback`, and `ConstrainedPermissionCheck`
(with their JSDoc) by:

```ts
/**
 * The caller context every access-rule callback receives: the user, plus the
 * organization when `orgCollectionSlug` is configured. No `data` — `withIndex` and
 * `where` run once per query, before any document is read (contrast
 * {@link PermissionCallbackProps}, which the sibling `filter` property uses).
 */
export type AccessRuleProps<TUser = Record<string, unknown>, TOrg = Record<string, unknown>> = {
  user: TUser;
} & ([TOrg] extends [never] ? unknown : { organization: TOrg });

/**
 * The callback form of a rule's index half, for a range that depends on the
 * caller. Returns `{ name, range }` to narrow through an index, `true` to add no
 * restriction, or `false` to deny.
 */
export type AccessWithIndexCallback<
  TData,
  TUser,
  TOrg,
  TIndexFields extends Record<string, readonly string[]>,
> = (props: AccessRuleProps<TUser, TOrg>) => boolean | AccessIndexSelection<TData, TIndexFields>;

/**
 * The index half of a rule: the static `{ name, range }` selection (the same
 * object `find`'s `withIndex` takes) when the range reads no caller data, or a
 * {@link AccessWithIndexCallback} when it does.
 */
export type AccessWithIndex<
  TData,
  TUser,
  TOrg,
  TIndexFields extends Record<string, readonly string[]>,
> = AccessIndexSelection<TData, TIndexFields> | AccessWithIndexCallback<TData, TUser, TOrg, TIndexFields>;

/**
 * The predicate half of a rule — the same builder `find`'s `where` receives.
 * Returns a predicate, `true` to add no restriction, or `false` to deny.
 */
export type AccessWhereCallback<TData, TUser, TOrg> = (
  props: AccessRuleProps<TUser, TOrg> & { q: FilterConstraintBuilder<TData> },
) => boolean | ConstraintResult;

/**
 * The narrowing object form of a permission check. Its properties map 1:1
 * onto `find`'s arguments: `withIndex` is the Convex index pushdown (query
 * actions only), `where` the portable predicate (every action). At least one
 * is required. `filter` is the optional per-document JS check for what
 * neither can express (array membership, string operations, cross-table
 * reads); it augments, never replaces.
 *
 * `TIndexFields = never` marks a non-query action: `withIndex` is then
 * `never`, so declaring it on a create/update/delete is a type error at the
 * property.
 *
 * @typeParam TData - Document type for the subject.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape; `never` if not configured.
 * @typeParam TIndexFields - The resource's index map on query actions; `never` on mutations.
 */
export type ConstrainedPermissionCheck<
  TData = unknown,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
  TIndexFields extends Record<string, readonly string[]> = never,
> = ([TIndexFields] extends [never]
  ? { withIndex?: never; where: AccessWhereCallback<TData, TUser, TOrg> }
  :
      | {
          withIndex: AccessWithIndex<TData, TUser, TOrg, TIndexFields>;
          where?: AccessWhereCallback<TData, TUser, TOrg>;
        }
      | {
          withIndex?: AccessWithIndex<TData, TUser, TOrg, TIndexFields>;
          where: AccessWhereCallback<TData, TUser, TOrg>;
        }) & {
  /** Optional per-document check augmenting `withIndex` / `where`. Never a substitute. */
  filter?: BasePermissionCheck<TData, TUser, TOrg>;
};
```

Then update the two consumers in the same file:

- `AnyActionPermissionCheck`: `ConstrainedPermissionCheck<TData, TUser, TOrg, AccessPredicateBuilder<TData>>`
  → `ConstrainedPermissionCheck<TData, TUser, TOrg>` (mutation form).
- `PermissionCheck`: `ConstrainedPermissionCheck<TData, TUser, TOrg, AccessQueryBuilder<TData, TIndexFields>>`
  → `ConstrainedPermissionCheck<TData, TUser, TOrg, TIndexFields>`.

Rewrite their JSDoc's "`q`'s type gates index pushdown" paragraphs to say that the
`withIndex` *property* is present only on query actions. Remove every remaining mention of
`constraints` / `q.withIndex` / `q.filter` from `types.ts` JSDoc, including the
`{ constraints, filter }` notes near the top (`types.ts:66`, `:101`, `:178`).

**Type-check early.** Write these before migrating anything else. Core's suite runs against an
unaugmented registry, so a rule written inside `defineAccess` sees every index as wide `string`
slots (see the note in `types.test.ts` above "rejects q.withIndex on create") and a
`@ts-expect-error` on a wrong field there would itself fail. So the tests split three ways:

- *Shape* cases (which properties are allowed where) go through `defineAccess` in
  `types.test.ts`; they do not depend on the registry.
- *Field-typing* cases also live in `types.test.ts`, but instantiate
  `ConstrainedPermissionCheck` with explicit document and index type arguments. That is exactly
  what the generated registry feeds in, so core proves the typing without being augmented.
- One end-to-end pin in `apps/test/src/auth/access.typecheck.ts` proves the generated registry
  actually reaches `AccessCheck<S>`.

Add to `packages/core/src/access/types.test.ts`, replacing the old
`describe("PermissionCheck — constraint builder object form")` block's shape tests (its
remaining cases migrate by the table under "Test and app call sites"):

```ts
describe("PermissionCheck — withIndex / where / filter object form", () => {
  it("accepts a static withIndex on a query action", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: { pages: { read: { withIndex: { name: "by_author", range: (ix) => ix.eq("authorId", "u1") } } } },
      },
    });
  });

  it("accepts a caller-dependent withIndex beside a filter, with no where", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            read: {
              withIndex: ({ user }) => ({ name: "by_author", range: (ix) => ix.eq("authorId", String(user._id)) }),
              filter: () => true,
            },
          },
        },
      },
    });
  });

  it("accepts where alone on a mutation action", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: { pages: { update: { where: ({ q }) => q.eq("authorId", "u1") } } },
      },
    });
  });

  it("rejects withIndex on a mutation action, at the property", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            update: {
              // @ts-expect-error — a mutation action has no query to narrow, so `withIndex` is `never`
              withIndex: { name: "by_author", range: (ix) => ix.eq("authorId", "u1") },
              where: ({ q }) => q.eq("authorId", "u1"),
            },
          },
        },
      },
    });
  });

  it("rejects an object with neither withIndex nor where", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            // @ts-expect-error — `filter` augments `withIndex` / `where`; it is never the only property
            read: { filter: () => true },
          },
        },
      },
    });
  });
});
```

Add the field-typing cases to the same file (import `ConstrainedPermissionCheck` as a type
from `./types`):

```ts
type PagesDoc = { authorId: string; status: string; title: string };
type PagesIndexes = { by_author: readonly ["authorId"]; by_author_status: readonly ["authorId", "status"] };
type PagesQueryRule = ConstrainedPermissionCheck<PagesDoc, { _id: string }, never, PagesIndexes>;
type PagesMutationRule = ConstrainedPermissionCheck<PagesDoc, { _id: string }, never>;

describe("ConstrainedPermissionCheck — field typing, with the registry's inputs given explicitly", () => {
  it("types withIndex's range by the discriminated index name, in either form", () => {
    const staticCompound: PagesQueryRule = {
      withIndex: { name: "by_author_status", range: (ix) => ix.eq("authorId", "u1").eq("status", "published") },
    };
    const callerIndex: PagesQueryRule = {
      withIndex: ({ user }) => ({ name: "by_author", range: (ix) => ix.eq("authorId", user._id) }),
    };
    // @ts-expect-error — `status` is not `by_author`'s field
    const wrongField: PagesQueryRule = { withIndex: { name: "by_author", range: (ix) => ix.eq("status", "published") } };
    // @ts-expect-error — `by_author_status` must be ranged from `authorId` first
    const outOfOrder: PagesQueryRule = { withIndex: { name: "by_author_status", range: (ix) => ix.eq("status", "published") } };
    // @ts-expect-error — `by_nope` is not an index
    const unknownIndex: PagesQueryRule = { withIndex: { name: "by_nope", range: (ix) => ix.eq("authorId", "u1") } };
    // @ts-expect-error — a range value must have the field's type
    const wrongValue: PagesQueryRule = { withIndex: { name: "by_author", range: (ix) => ix.eq("authorId", 1) } };
    expect([staticCompound, callerIndex, wrongField, outOfOrder, unknownIndex, wrongValue]).toHaveLength(6);
  });

  it("types where's fields and values", () => {
    const callbackWhere: PagesMutationRule = { where: ({ q }) => q.eq("title", "Home") };
    // @ts-expect-error — `nope` is not a field
    const unknownField: PagesMutationRule = { where: ({ q }) => q.eq("nope", "x") };
    // @ts-expect-error — `title` holds a string
    const wrongValue: PagesMutationRule = { where: ({ q }) => q.eq("title", 1) };
    expect([callbackWhere, unknownField, wrongValue]).toHaveLength(3);
  });
});
```

If `staticCompound` or `callerIndex` does not narrow `ix` to the named index's fields,
TypeScript is not discriminating the object literal on `name`. Make `AccessIndexSelection`'s
`range` parameter generic in `N`, or annotate with `satisfies`, and record the choice here
before continuing.

Add to `apps/test/src/auth/access.typecheck.ts`, merging `AccessCheck` into the file's existing
`@vexcms/core` type import, and append both constants to `accessActionTypePins`
(`articles` declares `by_slug` over `slug` through `editorialFields.ts`):

```ts
// ── access rules: the generated registry reaches withIndex's range ──────────
const articlesStaticIndex: AccessCheck<"articles"> = { withIndex: { name: "by_slug", range: (ix) => ix.eq("slug", "a") } };
// @ts-expect-error — `status` is not a field of `by_slug`
const articlesWrongIndexField: AccessCheck<"articles"> = { withIndex: { name: "by_slug", range: (ix) => ix.eq("status", ["published"]) } };
```

#### packages/core/src/access/evaluateQueryConstraint.ts

Replaces `createAccessQueryBuilder` + `readAccessCondition`. The three call sites that ran
`check.constraints(...)` (`resolveAccessRule.ts`, `hasPermission.ts`,
`validateAccessConfig.ts`) all call this instead, so the semantics live in one place.

```ts
import type { GenericDocument } from "convex/server";

import type { ConstraintResult, QueryFilterConstraint, QueryIndexConstraint } from "./queryConstraintTypes";
import { createQueryFilterConstraintBuilder } from "./createQueryFilterConstraintBuilder";
import { createQueryIndexConstraintBuilder, readQueryIndexConstraints } from "./createQueryIndexConstraintBuilder";

/**
 * One rule's resolved constraint for one caller. Moved here from
 * `createAccessQueryBuilder.ts` (where Step 0 renamed it); `compileQueryConstraints.ts`,
 * `resolveAccessRule.ts` and `hasPermission.ts` consume it.
 *
 * @typeParam TDoc - Document shape the recorded values are typed against.
 */
export interface QueryConstraint<TDoc> {
  /** The index half, when the rule's `withIndex` produced a selection. */
  index?: { name: string; constraints: readonly QueryIndexConstraint<string, TDoc>[] };
  /** The predicate half, when the rule's `where` produced a predicate. */
  where?: QueryFilterConstraint<TDoc>;
}

/**
 * What a constrained rule resolves to for one caller.
 *
 * - `true` / `false` — the rule short-circuited (every present half returned `true`,
 *   or one returned `false`).
 * - a {@link QueryConstraint} — at least one half narrows.
 * - `undefined` — a half produced something not built through its builder
 *   (a hand-made object, `undefined`, a number). Callers fail safe (deny) at
 *   request time and fail loud at config time.
 */
export type QueryConstraintOutcome = boolean | QueryConstraint<GenericDocument> | undefined;

/** The `kind` tags `createQueryFilterConstraintBuilder` produces. */
const FILTER_CONSTRAINT_KINDS: ReadonlySet<unknown> = new Set(["compare", "and", "or", "not"]);

/**
 * True when `value` is a tree `createQueryFilterConstraintBuilder` produced. Checks the
 * root's `kind` only: the builder is the sole producer, and the nominal
 * `ConstraintResult` stops a typed rule from returning anything else.
 *
 * @param value - What a `where` callback returned.
 * @returns Whether it is a recorded filter tree.
 */
function isQueryFilterConstraint(value: unknown): value is QueryFilterConstraint<GenericDocument> {
  return typeof value === "object" && value !== null && FILTER_CONSTRAINT_KINDS.has((value as { kind?: unknown }).kind);
}

/**
 * Records a `{ name, range }` selection by running its range against a fresh
 * index builder.
 *
 * @param value - The static selection, or what a `withIndex` callback returned.
 * @returns The recorded index half, or `undefined` when `value` is not a
 *   `{ name: string, range: function }` object.
 */
function recordIndexSelection(value: unknown): QueryConstraint<GenericDocument>["index"] | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const { name, range } = value as { name?: unknown; range?: unknown };
  if (typeof name !== "string" || typeof range !== "function") return undefined;
  const built = (range as (ix: never) => ConstraintResult)(
    createQueryIndexConstraintBuilder<readonly string[], GenericDocument>() as never,
  );
  return { name, constraints: readQueryIndexConstraints<GenericDocument>(built) };
}

/**
 * Runs a constrained rule's `withIndex` and `where` for one caller and assembles
 * the result.
 *
 * @param props - Input props.
 * @param props.check - The rule object; at least one of `withIndex` / `where` is present.
 *   `withIndex` is the static `{ name, range }` or a callback returning one or a boolean;
 *   `where` is a callback returning a predicate or a boolean. `filter` is ignored here —
 *   it is per-document, and `hasPermission` runs it.
 * @param props.callerProps - `{ user }` plus `{ organization }` when configured. Pass the
 *   user-read sentinel's proxy here, as the callers do today, so a rule keyed to an
 *   absent caller is detected.
 * @returns The rule's outcome for this caller.
 * @throws Whatever a callback throws — `validateAccessConfig` wraps it in a
 *   `VexAccessConfigError` naming the rule.
 */
export function evaluateQueryConstraint(props: {
  check: { withIndex?: unknown; where?: (p: never) => unknown };
  callerProps: Record<string, unknown>;
}): QueryConstraintOutcome {
  const { check, callerProps } = props;
  const hasIndex = check.withIndex !== undefined;
  const hasWhere = check.where !== undefined;

  // Both halves run before anything returns, so a throwing `where` still throws when
  // `withIndex` short-circuits to `true` (config-time validation depends on that).
  const indexResult =
    typeof check.withIndex === "function"
      ? (check.withIndex as (p: Record<string, unknown>) => unknown)(callerProps)
      : check.withIndex;
  const whereResult = hasWhere
    ? check.where!({ ...callerProps, q: createQueryFilterConstraintBuilder<GenericDocument>() } as never)
    : undefined;

  if (indexResult === false || whereResult === false) return false;

  let index: QueryConstraint<GenericDocument>["index"];
  if (hasIndex && indexResult !== true) {
    // A missing `return` (`undefined`) is unreadable, not "no restriction".
    index = recordIndexSelection(indexResult);
    if (index === undefined) return undefined;
  }

  let where: QueryFilterConstraint<GenericDocument> | undefined;
  if (hasWhere && whereResult !== true) {
    if (!isQueryFilterConstraint(whereResult)) return undefined;
    where = whereResult;
  }

  if (index === undefined && where === undefined) return true;
  return { ...(index !== undefined ? { index } : {}), ...(where !== undefined ? { where } : {}) };
}
```

#### packages/core/src/access/evaluateQueryConstraint.test.ts

Ports `createAccessQueryBuilder.test.ts`'s behavioural cases to the new shape, plus the
per-property short-circuits:

```ts
import { describe, expect, it } from "vitest";

import { evaluateQueryConstraint } from "./evaluateQueryConstraint";

/** Evaluates one rule for caller `u1`. */
const evaluate = (check: Record<string, unknown>) =>
  evaluateQueryConstraint({ check: check as never, callerProps: { user: { _id: "u1" } } });

const statusIndex = {
  name: "by_status",
  constraints: [{ field: "status", op: "eq", value: "published" }],
};
const notArchived = { kind: "compare", field: "archived", op: "neq", value: true };

describe("evaluateQueryConstraint — withIndex", () => {
  it("records the { name, range } a callback returns", () => {
    expect(
      evaluate({ withIndex: () => ({ name: "by_status", range: (ix: any) => ix.eq("status", "published") }) }),
    ).toEqual({ index: statusIndex });
  });

  it("records the static { name, range } identically", () => {
    expect(
      evaluate({ withIndex: { name: "by_status", range: (ix: any) => ix.eq("status", "published") } }),
    ).toEqual({ index: statusIndex });
  });

  it("passes the caller to the callback", () => {
    expect(
      evaluate({
        withIndex: ({ user }: { user: { _id: string } }) => ({
          name: "by_author",
          range: (ix: any) => ix.eq("authorId", user._id),
        }),
      }),
    ).toEqual({ index: { name: "by_author", constraints: [{ field: "authorId", op: "eq", value: "u1" }] } });
  });

  it("records a compound range in call order", () => {
    expect(
      evaluate({
        withIndex: { name: "by_author_category", range: (ix: any) => ix.eq("authorId", "u1").eq("categoryId", "news") },
      }),
    ).toEqual({
      index: {
        name: "by_author_category",
        constraints: [
          { field: "authorId", op: "eq", value: "u1" },
          { field: "categoryId", op: "eq", value: "news" },
        ],
      },
    });
  });

  it("ignores the rule-level filter", () => {
    expect(
      evaluate({ withIndex: { name: "by_status", range: (ix: any) => ix.eq("status", "published") }, filter: () => false }),
    ).toEqual({ index: statusIndex });
  });
});

describe("evaluateQueryConstraint — where", () => {
  it("records the predicate tree", () => {
    expect(evaluate({ where: ({ q }: { q: any }) => q.neq("archived", true) })).toEqual({ where: notArchived });
  });

  it("preserves combinator nesting", () => {
    expect(
      evaluate({ where: ({ q }: { q: any }) => q.and(q.eq("authorId", "u1"), q.or(q.gte("score", 5), q.neq("archived", true))) }),
    ).toEqual({
      where: {
        kind: "and",
        nodes: [
          { kind: "compare", field: "authorId", op: "eq", value: "u1" },
          {
            kind: "or",
            nodes: [
              { kind: "compare", field: "score", op: "gte", value: 5 },
              notArchived,
            ],
          },
        ],
      },
    });
  });
});

describe("evaluateQueryConstraint — both halves and short-circuits", () => {
  it("carries both halves together", () => {
    expect(
      evaluate({
        withIndex: { name: "by_status", range: (ix: any) => ix.eq("status", "published") },
        where: ({ q }: { q: any }) => q.neq("archived", true),
      }),
    ).toEqual({ index: statusIndex, where: notArchived });
  });

  it("omits the index key when withIndex returns true", () => {
    const outcome = evaluate({ withIndex: () => true, where: ({ q }: { q: any }) => q.neq("archived", true) });
    expect(outcome).toEqual({ where: notArchived });
    expect(outcome).not.toHaveProperty("index");
  });

  it("is true when every present half returns true", () => {
    expect(evaluate({ withIndex: () => true, where: () => true })).toBe(true);
  });

  it("is false when either half returns false", () => {
    expect(evaluate({ withIndex: () => false, where: ({ q }: { q: any }) => q.eq("a", 1) })).toBe(false);
    expect(evaluate({ where: () => false })).toBe(false);
  });
});

describe("evaluateQueryConstraint — unreadable halves", () => {
  it("is undefined for a hand-built where", () => {
    expect(evaluate({ where: () => ({ field: "a" }) })).toBeUndefined();
  });

  it("is undefined for a selection without a range, in either form", () => {
    expect(evaluate({ withIndex: () => ({ name: "by_x" }) })).toBeUndefined();
    expect(evaluate({ withIndex: { name: "by_x" } })).toBeUndefined();
  });

  it("is undefined when a callback returns nothing", () => {
    expect(evaluate({ withIndex: () => undefined })).toBeUndefined();
    expect(evaluate({ where: () => undefined })).toBeUndefined();
  });

  it("rethrows from where even when withIndex returns true", () => {
    expect(() =>
      evaluate({
        withIndex: () => true,
        where: () => {
          throw new Error("boom");
        },
      }),
    ).toThrow("boom");
  });
});
```

#### packages/core/src/access/resolveAccessRule.ts, hasPermission.ts, validateAccessConfig.ts

In each, replace the `check.constraints({ user, q: createAccessQueryBuilder(), … })` call
and the following `readAccessCondition(outcome)` with
`evaluateQueryConstraint({ check, callerProps: { user, …organization } })`. Then branch on its
outcome as the existing code branches on `outcome` / `condition`: boolean → short-circuit;
`undefined` → the existing unreadable path (deny / config error); object → the existing
condition path. `isConstrainedCheck` (in `resolveAccessRule.ts` and `hasPermission.ts`) and the
`"constraints" in check` test (in `validateAccessConfig.ts`) become
`"withIndex" in check || "where" in check`.

Error messages in `validateAccessConfig.ts`:

- callback threw → `` `role "${role}" on ${resourceSlug}.${action}: the withIndex/where callback threw while being resolved — ${message}. Rules must be pure; they run once at config time with no documents and no database access.` ``
- unreadable outcome → `` `role "${role}" on ${resourceSlug}.${action}: withIndex must be { name, range } or a function returning { name, range } or a boolean, and where must return a predicate built from the supplied "q" or a boolean.` ``

Update every test that asserts the old text. The comment in `resolveAccessRule.ts` that quotes
`({ user, q }) => user.isAdmin || q.filter(…)` becomes `where: ({ user, q }) => user.isAdmin || q.eq(…)`.

#### packages/core/src/access/buildChecks.ts

`indexedEqCheck` returns the static form, since its range reads no caller data:
`{ withIndex: { name: index, range: (ix) => (ix as unknown as RawRange).eq(props.field, props.value) } }`.
`indexedOwnerCheck` returns
`{ withIndex: ({ user }) => ({ name: index, range: (ix) => (ix as unknown as RawRange).eq(props.field, isRelationship ? [user._id] : user._id) }) }`.
Keep both outer `as unknown as AccessCheck<S>` casts. Drop the `AccessQueryBuilder` /
`AccessConditionResult` imports. `ownerPredicateCheck` is a bare callback and is unchanged.

#### packages/core/src/access/index.ts

Replace `export * from "./createAccessQueryBuilder";` with
`export * from "./evaluateQueryConstraint";`.

#### packages/react/src/testing/harness/accessFixtures.ts

The `scoped` role's rule becomes
`read: { withIndex: { name: "by_status", range: (ix) => ix.eq("status", "published") } }`.
This file ships in `@vexcms/react/testing`, so it is part of the public change.

#### Test and app call sites

Mechanical, by pattern. Expected values in every test are unchanged:

| Before | After |
|---|---|
| `constraints: ({ user, q }) => q.withIndex("i", (ix) => R)` (R reads `user`) | `withIndex: ({ user }) => ({ name: "i", range: (ix) => R })` |
| `constraints: ({ q }) => q.withIndex("i", (ix) => R)` (R reads no caller data) | `withIndex: { name: "i", range: (ix) => R }` |
| `constraints: ({ q }) => q.filter((f) => P(f))` | `where: ({ q }) => P(q)` |
| `constraints: ({ q }) => q.withIndex("i", (ix) => R).filter((f) => P(f))` | `withIndex: { name: "i", range: (ix) => R }, where: ({ q }) => P(q)` (callback form if R reads `user`) |
| `constraints: ({ user, q }) => c \|\| q.filter((f) => P(f))` | `where: ({ user, q }) => c \|\| P(q)` |
| `constraints: ({ user, q }) => c \|\| q.withIndex(…)` | `withIndex: ({ user }) => c \|\| ({ name, range })` |
| `@ts-expect-error` on `q.withIndex` inside a mutation rule | `@ts-expect-error` on a `withIndex` property in a mutation rule |

Drop `user` / `organization` from a callback's destructuring when its body no longer uses them,
but keep them where the body reads them: the user-read sentinel depends on it. Locate
candidates with `rg -n "constraints:" <file>`. Do not touch `Array.prototype.filter` calls or
the rule-level `filter:` property.

Known app/template sites:

- `apps/test/src/auth/access.ts`:
  - `constraints: ({ user, q }) => q.withIndex("by_email", (fq) => fq.eq("email", user.email))`
    → `withIndex: ({ user }) => ({ name: "by_email", range: (ix) => ix.eq("email", user.email) })`
  - 2× `constraints: ({ q }) => q.filter((fq) => fq.gt("size", 50000))` → `where: ({ q }) => q.gt("size", 50000)`
- `packages/create-vexcms/templates/base-nextjs/src/auth/access.ts`: the `by_email` index rule
  as above, and `constraints: ({ user, q }) => q.filter((fq) => fq.eq("email", user.email))`
  → `where: ({ user, q }) => q.eq("email", user.email)`.
- `apps/www` has none in `src/auth/access.ts`.
- `apps/www/convex/seed.ts:1256-1284` and `apps/test/convex/seed.ts:1259-1287` hold the
  access-config code sample the `/features` page renders (a template string, so `tsc` will not
  catch it). Rewrite its two rules, and keep the comments above them accurate:
  - editor: `read: { constraints: ({ user, q }) => q.withIndex("by_author", (ix) => ix.eq("authorId", user._id)) }`
    → `read: { withIndex: ({ user }) => ({ name: "by_author", range: (ix) => ix.eq("authorId", user._id) }) }`
  - guest: `read: { constraints: ({ q }) => q.withIndex("by_status", (ix) => ix.eq("status", "published")) }`
    → `read: { withIndex: { name: "by_status", range: (ix) => ix.eq("status", "published") } }`
  The marketing-site template's seed has no such sample. Re-run the www seed afterwards so the
  deployed `/features` page picks it up.

Verify: `pnpm --filter @vexcms/core test -- access api && pnpm --filter @vexcms/react test -- usePermission && pnpm -r typecheck`

### Step 7 — Serializable `where`: plain data form, validator, and builder→node converter [agent]

- [ ] Modify `packages/core/src/api/queryArgs.ts` (4 edits)
- [ ] Modify `packages/core/src/api/queryArgs.test.ts`
- [ ] Modify `packages/core/src/api/find/server.ts` (2 edits)
- [ ] Modify `packages/core/src/api/find/server.test.ts`
- [ ] Modify `packages/core/src/api/search/server.ts` (2 edits)
- [ ] Modify `packages/core/src/api/search/server.test.ts`
- [ ] Modify `packages/core/src/api/server.ts`
- [ ] Modify `packages/core/src/index.ts`
- [ ] Modify `packages/core/src/access/queryConstraintTypes.ts` (doc-typed `VexWhereNodeOf`)
- [ ] Modify `packages/core/src/access/compileQueryConstraints.ts` and its test (`whereNodeToQueryFilterTree`, `queryFilterTreeToWhereNode`)
- [ ] Modify `packages/core/src/access/types.ts` (an access rule's `where` also takes the plain node)
- [ ] Modify `packages/core/src/access/evaluateQueryConstraint.ts` and its test
- [ ] Modify `packages/core/src/access/validateAccessConfig.ts` and its test (validate a static `where` at config time)

Implements Decision 12, and the static `where` of Decision 13. Depends on Step 1
(`queryArgs.ts`, `VexWhere`), Step 4 (`VexError`) and Step 6 (the split access-rule shape).

#### packages/core/src/api/queryArgs.ts

Four edits; everything not shown is unchanged from Step 1.

**1 — imports.** Add `FilterOp` and `VexWhereNodeOf` to the `queryConstraintTypes` type import. Extend the
`compileQueryConstraints` import to
`import { QUERY_FILTER_CONSTRAINT_COMPARATORS, queryConstraintsToConvexIndexRange, queryFilterTreeToConvexFilter, queryFilterTreeToWhereNode, whereNodeToQueryFilterTree } from "../access/compileQueryConstraints";`.
Add:

```ts
import { VexError } from "../errors";
```

**2 — `VexWhereNode` and `VexWhere`.** Insert before `VexWhere<S>`'s definition, then replace
`VexWhere<S>` itself:

```ts
/**
 * One node of the `where` argument's plain, JSON-serializable form — a
 * documented alias of the tree `FilterConstraintBuilder` records
 * (`QueryFilterConstraint`, `access/queryConstraintTypes.ts`), with friendlier
 * keys (`and` / `or` / `not` in place of `kind: "and"` / `"or"` / `"not"`) so
 * a stored or transmitted filter reads like the query it describes.
 *
 * Every leaf `value` is exactly what the field itself stores: a Convex
 * `Id<...>` is already a string, and a `date` field is already a Unix-ms
 * `number` (`fields/date/types.ts`) — neither needs extra wire encoding.
 *
 * @typeParam S - Collection slug.
 *
 * @example
 * ```ts
 * const node: VexWhereNode<"posts"> = {
 *   and: [
 *     { field: "published", op: "eq", value: true },
 *     { not: { field: "slug", op: "eq", value: "draft" } },
 *   ],
 * };
 * ```
 */
export type VexWhereNode<S extends string> = VexWhereNodeOf<AccessDocFor<S>>;

/**
 * The `where` argument of `find` and `search`: a predicate over `S`'s
 * fields, as EITHER a builder callback or its plain {@link VexWhereNode}
 * equivalent. Both compile to the same filter (`whereToConvexQueryFilter`); the plain
 * form exists for a filter that must be saved or cross the network — a
 * builder callback cannot.
 *
 * The callback form is the same one an access rule's `q.where(...)`
 * receives. On Convex both compile to `.filter(...)`, which scans the
 * narrowed range — prefer `withIndex` for anything an index can express.
 *
 * @typeParam S - Collection slug.
 *
 * @example
 * ```ts
 * find({ ctx, collection: "posts", where: (q) => q.and(q.eq("featured", true), q.neq("slug", "hidden")) })
 * find({ ctx, collection: "posts", where: { and: [{ field: "featured", op: "eq", value: true }, { field: "slug", op: "neq", value: "hidden" }] } })
 * ```
 */
export type VexWhere<S extends string> =
  | ((q: FilterConstraintBuilder<AccessDocFor<S>>) => ConstraintResult)
  | VexWhereNode<S>;
```

**3 — `whereToConvexQueryFilter`.** Replace Step 1's stub:

```ts
/**
 * Compiles a caller's `where` argument — a builder callback or a plain
 * {@link VexWhereNode} — to an `ConvexQueryFilterFn` the query can apply inside
 * `.filter(...)`. Both forms compile through the same recorded tree, so a
 * saved {@link VexWhereNode} and the builder call `whereToNode` made it from
 * behave identically.
 *
 * @param props - Input props.
 * @param props.where - The caller's predicate; `undefined` when absent.
 * @param props.fields - The collection's known field names, for validating a
 *   plain node; passed through to {@link validateWhereNode}. Ignored when
 *   `where` is a callback (already checked at compile time).
 * @returns `undefined` for no predicate, else a thunk compiling the recorded
 *   tree against the query's own `FilterBuilder`.
 */
export function whereToConvexQueryFilter(props: {
  where: VexWhere<string> | undefined;
  fields?: readonly string[];
}): ConvexQueryFilterFn | undefined {
  const { where } = props;
  if (where === undefined) return undefined;
  // Both forms end as the same recorded tree, built once and eagerly (see Step 1).
  const node: QueryFilterConstraint<GenericDocument> =
    typeof where === "function"
      ? (where(createQueryFilterConstraintBuilder<GenericDocument>() as never) as unknown as QueryFilterConstraint<GenericDocument>)
      : whereNodeToQueryFilterTree(
          validateWhereNode({ node: where, fields: props.fields }) as VexWhereNodeOf<GenericDocument>,
        );
  return (q) => queryFilterTreeToConvexFilter({ node, q });
}
```

**4 — `whereToNode` and `validateWhereNode`.** Add after `whereToConvexQueryFilter`:

```ts
/**
 * Converts a `where` builder callback to its plain {@link VexWhereNode} form
 * — for saving a filter authored in code (a default list filter, a seeded
 * saved view) without hand-building the tree.
 *
 * @typeParam S - Collection slug the callback was written against.
 * @param where - A builder callback, the same one `find` / `search` accept.
 * @returns The equivalent plain node.
 */
export function whereToNode<S extends string>(
  where: (q: FilterConstraintBuilder<AccessDocFor<S>>) => ConstraintResult,
): VexWhereNode<S> {
  const tree = where(
    createQueryFilterConstraintBuilder<AccessDocFor<S>>(),
  ) as unknown as QueryFilterConstraint<AccessDocFor<S>>;
  return queryFilterTreeToWhereNode(tree);
}

/** Maximum nodes in one `where` tree, counted across the whole tree. */
export const WHERE_NODE_LIMIT = 64;
/** Maximum nesting depth of one `where` tree; a lone leaf is depth 1. */
export const WHERE_DEPTH_LIMIT = 8;

/**
 * Throws the one error shape every `validateWhereNode` failure uses.
 *
 * @param path - Where in the tree the problem is, e.g. `where.and[1].op`.
 * @param problem - What is wrong there.
 * @throws {VexError} Always, with `code: "INVALID_WHERE"`.
 */
function invalidWhere(path: string, problem: string): never {
  throw new VexError({ code: "INVALID_WHERE", path, message: `Invalid where at ${path}: ${problem}.` });
}

/**
 * Validates and normalises an untrusted `where` payload (a saved view row, a
 * URL query param, an MCP tool argument) into a {@link VexWhereNode}.
 * Runtime, not compile-time: a stored filter can go stale — a renamed
 * field, a dropped index, a schema change — in a way `VexWhereNode<S>`'s
 * compile-time field typing never catches for data that was not just typed
 * in an editor.
 *
 * @typeParam S - Collection slug to type the result against; the caller's
 *   responsibility to pick correctly, the same contract as `JSON.parse<T>()`.
 * @param props - Input props.
 * @param props.node - The untrusted value, typically freshly `JSON.parse`d.
 * @param props.fields - The collection's known field names. Omitted
 *   pre-`vex generate` or when the caller has no config handy — field names
 *   then go unchecked, the same fallback {@link ConstraintField} uses, and
 *   only shape and operators are validated.
 * @returns The same tree, narrowed to {@link VexWhereNode}.
 * @throws {VexError} `code: "INVALID_WHERE"` — `node` is not an object; an
 *   `and` / `or` whose value is not an array; a leaf missing `field` / `op` /
 *   `value`; an `op` outside {@link FilterOp} (checked against
 *   `QUERY_FILTER_CONSTRAINT_COMPARATORS`'s keys, the runtime source of truth); or, when
 *   `fields` is given, a `field` not in it.
 */
export function validateWhereNode<S extends string = string>(props: {
  node: unknown;
  fields?: readonly string[];
}): VexWhereNode<S> {
  const knownFields = props.fields === undefined ? undefined : new Set(props.fields);
  let nodeCount = 0;

  /**
   * Validates one node and its subtree.
   *
   * @param node - The untrusted node.
   * @param path - Its location, for error messages.
   * @param depth - Its depth; the root is 1.
   * @returns The validated node, rebuilt so no unvalidated key survives.
   */
  function visit(node: unknown, path: string, depth: number): VexWhereNodeOf<GenericDocument> {
    nodeCount += 1;
    if (nodeCount > WHERE_NODE_LIMIT) invalidWhere(path, `more than ${WHERE_NODE_LIMIT} nodes`);
    if (depth > WHERE_DEPTH_LIMIT) invalidWhere(path, `nested deeper than ${WHERE_DEPTH_LIMIT} levels`);
    if (typeof node !== "object" || node === null || Array.isArray(node)) invalidWhere(path, "expected an object");

    const record = node as Record<string, unknown>;
    const keys = Object.keys(record);
    for (const combinator of ["and", "or"] as const) {
      if (!(combinator in record)) continue;
      if (keys.length !== 1) invalidWhere(path, `"${combinator}" must be the node's only key`);
      const children = record[combinator];
      if (!Array.isArray(children)) invalidWhere(`${path}.${combinator}`, "expected an array");
      const validated = (children as unknown[]).map((child, i) => visit(child, `${path}.${combinator}[${i}]`, depth + 1));
      return combinator === "and" ? { and: validated } : { or: validated };
    }
    if ("not" in record) {
      if (keys.length !== 1) invalidWhere(path, `"not" must be the node's only key`);
      return { not: visit(record.not, `${path}.not`, depth + 1) };
    }

    if (keys.length !== 3 || !("field" in record) || !("op" in record) || !("value" in record)) {
      invalidWhere(path, "expected { field, op, value } or a single and / or / not key");
    }
    const { field, op, value } = record;
    if (typeof field !== "string") invalidWhere(`${path}.field`, "expected a string");
    if (knownFields !== undefined && !knownFields.has(field as string)) {
      invalidWhere(`${path}.field`, `unknown field "${field as string}"`);
    }
    if (typeof op !== "string" || !Object.prototype.hasOwnProperty.call(QUERY_FILTER_CONSTRAINT_COMPARATORS, op)) {
      invalidWhere(`${path}.op`, `unknown operator "${String(op)}"`);
    }
    return { field: field as string, op: op as FilterOp, value } as VexWhereNodeOf<GenericDocument>;
  }

  return visit(props.node, "where", 1) as VexWhereNode<S>;
}
```

#### packages/core/src/api/queryArgs.test.ts

Add `import { VexError } from "../errors";`, extend the `./queryArgs` import with
`validateWhereNode`, `whereToNode`, `WHERE_DEPTH_LIMIT`, `WHERE_NODE_LIMIT` and `type VexWhere`,
and extend the `describe("whereToConvexQueryFilter", ...)` block:

```ts
  test("a plain node and the equivalent builder compile to the same filter", async () => {
    const t = convexTest(schema, modules);
    const run = (where: VexWhere<string>) =>
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await seed(ctx);
        const filter = whereToConvexQueryFilter({ where, fields: ["title", "slug", "featured"] })!;
        return (await ctx.db.query("posts").filter(filter).collect()).map((d) => d.title);
      });
    const fromNode = await run({
      and: [
        { field: "featured", op: "eq", value: true },
        { field: "slug", op: "neq", value: "a" },
      ],
    });
    const fromBuilder = await run(((q: any) => q.and(q.eq("featured", true), q.neq("slug", "a"))) as never);
    expect(fromNode).toEqual(fromBuilder);
    expect(fromNode).toEqual(["C"]);
  });

  test("a malformed plain where throws VexError", () => {
    expect(() => whereToConvexQueryFilter({ where: { field: "featured", value: true } as never })).toThrow(VexError);
    expect(() =>
      whereToConvexQueryFilter({ where: { field: "featured", op: "startsWith", value: true } as never }),
    ).toThrow(VexError);
  });

  test("an unknown field throws VexError when fields are known", () => {
    expect(() =>
      whereToConvexQueryFilter({ where: { field: "nope", op: "eq", value: true } as never, fields: ["title"] }),
    ).toThrow(VexError);
  });

  test("an unknown field is NOT checked when fields are omitted", () => {
    expect(() => whereToConvexQueryFilter({ where: { field: "nope", op: "eq", value: true } as never })).not.toThrow();
  });
```

Add a top-level describe for the validator itself:

```ts
describe("validateWhereNode", () => {
  test("returns a valid tree unchanged", () => {
    const node = { and: [{ field: "featured", op: "eq", value: true }, { not: { field: "slug", op: "eq", value: "a" } }] };
    expect(validateWhereNode({ node, fields: ["featured", "slug"] })).toEqual(node);
  });

  test("rejects a non-object, an extra key, and a non-array combinator", () => {
    expect(() => validateWhereNode({ node: "featured" })).toThrow(VexError);
    expect(() => validateWhereNode({ node: { field: "a", op: "eq", value: 1, extra: true } })).toThrow(VexError);
    expect(() => validateWhereNode({ node: { and: { field: "a", op: "eq", value: 1 } } })).toThrow(VexError);
  });

  test("names the failing path and uses code INVALID_WHERE", () => {
    expect(() =>
      validateWhereNode({ node: { and: [{ field: "a", op: "eq", value: 1 }, { field: "a", op: "like", value: 1 }] } }),
    ).toThrow(expect.objectContaining({ data: expect.objectContaining({ code: "INVALID_WHERE", path: "where.and[1].op" }) }));
  });

  test("rejects trees over the node and depth limits", () => {
    const wide = { and: Array.from({ length: WHERE_NODE_LIMIT }, () => ({ field: "a", op: "eq", value: 1 })) };
    let deep: unknown = { field: "a", op: "eq", value: 1 };
    for (let i = 0; i < WHERE_DEPTH_LIMIT; i += 1) deep = { not: deep };
    expect(() => validateWhereNode({ node: wide })).toThrow(VexError);
    expect(() => validateWhereNode({ node: deep })).toThrow(VexError);
  });
});
```

Import `WHERE_NODE_LIMIT` and `WHERE_DEPTH_LIMIT` from `./queryArgs` too. `wide` is the `and`
plus 64 leaves (65 nodes); `deep` is a leaf under 8 `not`s (depth 9).

Add a new top-level describe beside `whereToConvexQueryFilter`'s:

```ts
describe("whereToNode", () => {
  test("round-trips a builder call to the plain node whereToConvexQueryFilter accepts", async () => {
    const t = convexTest(schema, modules);
    const node = whereToNode<string>(((q: any) => q.and(q.eq("featured", true), q.not(q.eq("slug", "a")))) as never);
    const titles = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await seed(ctx);
      const filter = whereToConvexQueryFilter({ where: node })!;
      return (await ctx.db.query("posts").filter(filter).collect()).map((d) => d.title);
    });
    expect(titles).toEqual(["C"]);
  });
});
```

Verify: `pnpm --filter @vexcms/core test -- api/queryArgs && pnpm --filter @vexcms/core typecheck`

#### packages/core/src/api/find/server.ts

Two edits.

**1 — `where` JSDoc.** Append to `FindServerArgs.where`'s JSDoc (added in Step 2) a plain-form
example line:

```ts
   * find({ ctx, collection: "posts", where: { field: "published", op: "eq", value: true } })
```

**2 — compiling the caller's filter.** Replace the `callerFilter` line (added in Step 2) with:

```ts
  const collectionFields = args.config?.collections.find((c) => c.slug === args.collection)?.fields;
  const callerFilter = whereToConvexQueryFilter({
    where: args.where as VexWhere<string> | undefined,
    fields: collectionFields ? Object.keys(collectionFields) : undefined,
  });
```

#### packages/core/src/api/find/server.test.ts

Add one test beside "where composes or/not and still meets the access filter" (added in Step 2):

```ts
  test("a plain where node compiles the same as the equivalent builder", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
      await ctx.db.insert("posts", { title: "C", slug: "c", featured: true });
      return find({
        ctx,
        collection: "posts",
        where: { field: "featured", op: "eq", value: true },
      });
    });
    expect(docs.map((d) => d.title)).toEqual(["A", "C"]);
  });
```

#### packages/core/src/api/search/server.ts

Two edits, mirroring `find`.

**1 — `where` JSDoc.** Append to `SearchServerArgs.where`'s JSDoc (added in Step 3) the same
plain-form example line as `find`'s.

**2 — compiling the caller's filter.** In the `filter` assignment added in Step 3, replace the
`whereToConvexQueryFilter({ where: args.where as ... })` call with:

```ts
  const collectionFields = args.config?.collections.find((c) => c.slug === args.collection)?.fields;
  const filter = andConvexQueryFilters({
    filters: [
      accessFilter,
      whereToConvexQueryFilter({
        where: args.where as VexWhere<string> | undefined,
        fields: collectionFields ? Object.keys(collectionFields) : undefined,
      }),
    ],
  });
```

#### packages/core/src/api/search/server.test.ts

Add beside "where narrows the result set" (added in Step 3):

```ts
  test("a plain where node narrows the result set like the builder", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
      await ctx.db.insert("posts", { title: "C", slug: "c", featured: true });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        limit: 10,
        where: { field: "featured", op: "eq", value: true },
      });
    });
    expect(docs.map((d) => d.title)).toEqual(["A", "C"]);
  });
```

#### packages/core/src/api/server.ts

Extend Step 2's export line:

```ts
export type { QueryIndexFieldsFor, VexWhere, VexWhereNode, VexWithIndex } from "./queryArgs";
```

#### packages/core/src/index.ts

Beside `export * from "./errors";` (Step 4), add:

```ts
export type { VexWhereNode } from "./api/queryArgs";
export { validateWhereNode, whereToNode } from "./api/queryArgs";
```

These are ctx-free — unlike `find` / `search`, valid for saved-view and URL-filter code that
has no Convex context, so they belong at the root rather than behind `@vexcms/core/server`
(Decision 10).

#### packages/core/src/access/queryConstraintTypes.ts

Add after `QueryFilterConstraint`. Doc-typed, because access rules are typed by document
(`TData`) rather than by slug; `queryArgs.ts`'s `VexWhereNode<S>` is this type applied to
`AccessDocFor<S>`. Living here (not in `api/`) keeps `access/types.ts` free of an `api/` import.

```ts
/**
 * The plain, JSON-serializable form of a `where` predicate over `TDoc`: a
 * comparison leaf, or an `and` / `or` / `not` of nodes. The same predicate
 * the `where` builder (`FilterConstraintBuilder`) records, with friendlier
 * keys. Accepted by `find` / `search`'s `where` (as `VexWhereNode<S>`) and by
 * an access rule's `where` property.
 *
 * @typeParam TDoc - Document shape field names and values are typed from.
 */
export type VexWhereNodeOf<TDoc> =
  | {
      field: ConstraintField<TDoc>;
      op: FilterOp;
      value: ConstraintValue<TDoc, ConstraintField<TDoc>>;
    }
  | { and: readonly VexWhereNodeOf<TDoc>[] }
  | { or: readonly VexWhereNodeOf<TDoc>[] }
  | { not: VexWhereNodeOf<TDoc> };
```

#### packages/core/src/access/compileQueryConstraints.ts

Add beside `queryFilterTreeToConvexFilter`, with `VexWhereNodeOf` added to the
`queryConstraintTypes` type import. The plain node and the recorded tree stay separate types
(Decision 15), so these two functions are the only bridge between them: `whereToConvexQueryFilter` and
the rule evaluator use the first, `whereToNode` the second.

```ts
/**
 * Converts a plain where node to the recorded filter tree the compilers walk.
 * Expects an already-validated node (`validateWhereNode`): `find` / `search`
 * validate per call, and access rules are validated once by `defineServerConfig`.
 *
 * @typeParam TDoc - Document shape the node is typed against.
 * @param node - The plain node.
 * @returns The equivalent `QueryFilterConstraint` tree.
 */
export function whereNodeToQueryFilterTree<TDoc>(node: VexWhereNodeOf<TDoc>): QueryFilterConstraint<TDoc> {
  if ("and" in node) return { kind: "and", nodes: node.and.map((child) => whereNodeToQueryFilterTree(child)) };
  if ("or" in node) return { kind: "or", nodes: node.or.map((child) => whereNodeToQueryFilterTree(child)) };
  if ("not" in node) return { kind: "not", node: whereNodeToQueryFilterTree(node.not) };
  return { kind: "compare", field: node.field, op: node.op, value: node.value };
}

/**
 * Converts a recorded filter tree to its plain where node — the inverse of
 * {@link whereNodeToQueryFilterTree}.
 *
 * @typeParam TDoc - Document shape the tree is typed against.
 * @param tree - A tree `createQueryFilterConstraintBuilder` recorded.
 * @returns The equivalent plain node.
 */
export function queryFilterTreeToWhereNode<TDoc>(tree: QueryFilterConstraint<TDoc>): VexWhereNodeOf<TDoc> {
  switch (tree.kind) {
    case "compare":
      return { field: tree.field, op: tree.op, value: tree.value };
    case "and":
      return { and: tree.nodes.map((child) => queryFilterTreeToWhereNode(child)) };
    case "or":
      return { or: tree.nodes.map((child) => queryFilterTreeToWhereNode(child)) };
    case "not":
      return { not: queryFilterTreeToWhereNode(tree.node) };
  }
}
```

Add to `compileQueryConstraints.test.ts`:

```ts
describe("where node ↔ query filter tree", () => {
  const node = {
    and: [
      { field: "featured", op: "eq", value: true },
      { or: [{ field: "slug", op: "eq", value: "a" }, { not: { field: "slug", op: "eq", value: "b" } }] },
    ],
  } as const;
  const tree = {
    kind: "and",
    nodes: [
      { kind: "compare", field: "featured", op: "eq", value: true },
      {
        kind: "or",
        nodes: [
          { kind: "compare", field: "slug", op: "eq", value: "a" },
          { kind: "not", node: { kind: "compare", field: "slug", op: "eq", value: "b" } },
        ],
      },
    ],
  } as const;

  it("converts a node to the tree", () => {
    expect(whereNodeToQueryFilterTree(node as never)).toEqual(tree);
  });

  it("converts the tree back to the node", () => {
    expect(queryFilterTreeToWhereNode(tree as never)).toEqual(node);
  });
});
```

#### packages/core/src/access/types.ts

An access rule's `where` takes the plain node as well as the callback, mirroring
`withIndex`'s static form. Add after `AccessWhereCallback`:

```ts
/**
 * The predicate half of a rule: a plain {@link VexWhereNodeOf} when the
 * predicate reads no caller data, or an {@link AccessWhereCallback} when it does.
 */
export type AccessWhere<TData, TUser, TOrg> = VexWhereNodeOf<TData> | AccessWhereCallback<TData, TUser, TOrg>;
```

In `ConstrainedPermissionCheck`, change all three `where` / `where?` properties from
`AccessWhereCallback<TData, TUser, TOrg>` to `AccessWhere<TData, TUser, TOrg>`.

Add to the `describe("PermissionCheck — withIndex / where / filter object form")` block in
`types.test.ts` (Step 6):

```ts
  it("accepts a static where, alone and beside a static withIndex", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            read: {
              withIndex: { name: "by_author", range: (ix) => ix.eq("authorId", "u1") },
              where: { not: { field: "title", op: "eq", value: "Draft" } },
            },
            update: { where: { field: "authorId", op: "eq", value: "u1" } },
          },
        },
      },
    });
  });
```

Add to the explicit-type-argument describe in `types.test.ts` (Step 6):

```ts
  it("types a static where's fields", () => {
    const staticWhere: PagesMutationRule = { where: { and: [{ field: "title", op: "neq", value: "Draft" }] } };
    // @ts-expect-error — `nope` is not a field
    const unknownField: PagesMutationRule = { where: { field: "nope", op: "eq", value: "x" } };
    expect([staticWhere, unknownField]).toHaveLength(2);
  });
```

And one registry pin to `apps/test/src/auth/access.typecheck.ts` (and `accessActionTypePins`):

```ts
// @ts-expect-error — `nope` is not a field of articles
const articlesUnknownWhereField: AccessCheck<"articles"> = { where: { field: "nope", op: "eq", value: "a" } };
```

#### packages/core/src/access/evaluateQueryConstraint.ts

`where` may now be a plain node. Add
`import { whereNodeToQueryFilterTree } from "./compileQueryConstraints";` and
`VexWhereNodeOf` to the `queryConstraintTypes` type import; change the `check` prop type to
`{ withIndex?: unknown; where?: unknown }`; and replace the `whereResult` declaration with:

```ts
  // A static node was validated once by `validateAccessConfig`, so it is converted
  // without re-validating on every request.
  const whereResult =
    typeof check.where === "function"
      ? (check.where as (p: Record<string, unknown>) => unknown)({
          ...callerProps,
          q: createQueryFilterConstraintBuilder<GenericDocument>(),
        })
      : hasWhere
        ? whereNodeToQueryFilterTree(check.where as VexWhereNodeOf<GenericDocument>)
        : undefined;
```

Update the `@param props.check` JSDoc: "`where` is a plain where node, or a callback returning
a predicate or a boolean."

Add to `evaluateQueryConstraint.test.ts`:

```ts
describe("evaluateQueryConstraint — static where", () => {
  it("records a plain node as the predicate tree", () => {
    expect(evaluate({ where: { field: "archived", op: "neq", value: true } })).toEqual({ where: notArchived });
  });

  it("carries a static withIndex and a static where together", () => {
    expect(
      evaluate({
        withIndex: { name: "by_status", range: (ix: any) => ix.eq("status", "published") },
        where: { field: "archived", op: "neq", value: true },
      }),
    ).toEqual({ index: statusIndex, where: notArchived });
  });
});
```

#### packages/core/src/access/validateAccessConfig.ts

A static `where` is checked once, when `defineServerConfig` runs `validateAccessConfig`, so
request-time evaluation can skip it. Add the imports
`import { validateWhereNode } from "../api/queryArgs";` and `import { VexError } from "../errors";`
(no module cycle: `queryArgs.ts` imports only `access/compileQueryConstraints.ts` and the builder
modules, none of which import this file). In `validateAccessConfig`, immediately before the
`evaluateQueryConstraint` call Step 6 introduced, add:

```ts
        const staticWhere = (check as { where?: unknown }).where;
        if (staticWhere !== undefined && typeof staticWhere !== "function") {
          try {
            validateWhereNode({
              node: staticWhere,
              fields: [...Object.keys(getDataFields({ fields: resource.fields })), "_id", "_creationTime"],
            });
          } catch (error) {
            const message =
              error instanceof VexError && typeof error.data === "object"
                ? String(error.data.message)
                : error instanceof Error
                  ? error.message
                  : String(error);
            throw new VexAccessConfigError(`role "${role}" on ${resourceSlug}.${action}: invalid static where — ${message}`);
          }
        }
```

Extend the unreadable-outcome message from Step 6 to "… and where must be a plain where object
or return a predicate built from the supplied "q" or a boolean."

#### packages/core/src/access/validateAccessConfig.test.ts

```ts
import { defineCollection, text } from "../index";
import { defineAccess } from "./config";
import { VexAccessConfigError } from "./types";
import { validateAccessConfig } from "./validateAccessConfig";

describe("validateAccessConfig — static where", () => {
  const pages = defineCollection({
    slug: "pages",
    fields: { title: text(), authorId: text({ index: "by_author" }) },
  });
  const users = defineCollection({ slug: "users", fields: { roles: text() } });

  /** An access config whose only rule is `reader → pages.read: { where }`. */
  const accessWithWhere = (where: unknown) =>
    defineAccess({
      roles: ["reader"] as const,
      resources: [pages, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: { reader: { pages: { read: { where: where as never } } } },
    });

  it("accepts a valid static where", () => {
    expect(() =>
      validateAccessConfig(accessWithWhere({ field: "authorId", op: "eq", value: "u1" }) as never),
    ).not.toThrow();
  });

  it("rejects an unknown field, naming the rule", () => {
    expect(() =>
      validateAccessConfig(accessWithWhere({ field: "nope", op: "eq", value: "u1" }) as never),
    ).toThrow(new VexAccessConfigError(
      'role "reader" on pages.read: invalid static where — Invalid where at where.field: unknown field "nope".',
    ));
  });

  it("rejects an unknown operator", () => {
    expect(() =>
      validateAccessConfig(accessWithWhere({ field: "authorId", op: "like", value: "u1" }) as never),
    ).toThrow(VexAccessConfigError);
  });
});
```

Merge the new imports into the file's existing import block.

Verify: `pnpm --filter @vexcms/core test -- api/queryArgs api/find api/search access && pnpm -r typecheck`

### Step 8 — `where` on the client: Convex validators, client wrappers, field-permission guard [agent]

- [ ] Modify `packages/core/src/api/queryArgs.ts` (`whereFieldNames`, `referencedWhereFields`)
- [ ] Modify `packages/core/src/api/queryArgs.test.ts`
- [ ] Modify `packages/core/src/api/utils.ts` (`readableDocuments`, the shared per-document read pass)
- [ ] Modify `packages/core/src/api/find/server.ts` and `packages/core/src/api/search/server.ts` (field list; readable-field guard)
- [ ] Modify `packages/core/src/api/find/server.test.ts`
- [ ] Modify `packages/core/src/api/server.ts` (`collectionsApi` `find` / `search` arg validators + pass-through)
- [ ] Modify `packages/core/src/api/convex.ts` (`VexFindArgs`, `VexFindPaginatedArgs`, `VexSearchArgs`)
- [ ] Create `packages/react/src/client/whereArg.ts`
- [ ] Modify `packages/react/src/client/find/client.ts` (`FindClientArgs`, `FindClientPaginatedArgs`, `find`, `findQueryKey`)
- [ ] Modify `packages/react/src/client/search/client.ts` (args + `search`)

Implements Decision 14. Depends on Steps 4 (`VexError`) and 7 (`VexWhereNode`,
`validateWhereNode`, `whereToNode`).

The client `find` / `search` take the same `where` as the server, as either form:

```ts
import { find } from "@vexcms/react/client";

useQuery(find({ collection: "posts", where: (q) => q.eq("featured", true) }));
useQuery(find({ collection: "posts", where: { field: "featured", op: "eq", value: true } }));
```

A callback cannot cross the network, so the wrapper converts it with `whereToNode` before
building the Convex args. The query key therefore holds the plain node: it is stable across
renders, and a new callback instance with the same body hits the same cache entry.
`withIndex` stays server-only. It is Convex-specific (Decision 11), and the generated Convex
functions do not expose it.

#### packages/core/src/api/queryArgs.ts

Two additions.

**1 — `whereFieldNames`.** Add after `validateWhereNode` (import `getDataFields` and
`AdminField` from `"../fields"`):

```ts
/**
 * The field names a `where` node may reference on one collection: its data
 * fields as {@link getDataFields} flattens them, plus the system fields `_id` and
 * `_creationTime`. Layout fields store nothing, so a `row()` / `collapsible()` /
 * unnamed-tab child is listed under its own key, a named tab under the tab's
 * `name`, and the layout keys themselves and `ui()` entries are absent. Looks
 * through both `collections` and `mediaCollections`. `vex_`-prefixed versioning
 * fields are deliberately excluded; drafts are selected with the `drafts` argument.
 *
 * @param props - Input props.
 * @param props.config - The resolved config; `undefined` when the caller has none.
 * @param props.collection - The collection slug being queried.
 * @returns The allowed names, or `undefined` when the collection or config is
 *   unknown (field names then go unchecked, `validateWhereNode`'s documented fallback).
 */
export function whereFieldNames(props: {
  config: { collections: readonly { slug: string; fields: Record<string, AdminField> }[]; mediaCollections?: readonly { slug: string; fields: Record<string, AdminField> }[] } | undefined;
  collection: string;
}): readonly string[] | undefined {
  const all = [...(props.config?.collections ?? []), ...(props.config?.mediaCollections ?? [])];
  const match = all.find((c) => c.slug === props.collection);
  return match ? [...Object.keys(getDataFields({ fields: match.fields })), "_id", "_creationTime"] : undefined;
}
```

**2 — `referencedWhereFields`.** Add after `whereFieldNames`:

```ts
/**
 * Every field name a `where` references, in either form. `find` / `search`
 * call it after `whereToConvexQueryFilter` has validated a plain node.
 *
 * @param props - Input props.
 * @param props.where - A builder callback or a validated plain node.
 * @returns Unique field names, in first-seen order.
 */
export function referencedWhereFields(props: { where: VexWhere<string> }): string[] {
  const root = typeof props.where === "function" ? whereToNode<string>(props.where) : props.where;
  const names = new Set<string>();
  const visit = (node: VexWhereNode<string>): void => {
    if ("and" in node) node.and.forEach(visit);
    else if ("or" in node) node.or.forEach(visit);
    else if ("not" in node) visit(node.not);
    else names.add(node.field);
  };
  visit(root);
  return [...names];
}
```

#### packages/core/src/api/queryArgs.test.ts

```ts
describe("whereFieldNames", () => {
  test("includes declared fields, media collections, and the two system fields", () => {
    const config = {
      collections: [{ slug: "posts", fields: { title: text(), featured: checkbox() } }],
      mediaCollections: [{ slug: "images", fields: { alt: text() } }],
    };
    expect(whereFieldNames({ config, collection: "posts" })).toEqual(["title", "featured", "_id", "_creationTime"]);
    expect(whereFieldNames({ config, collection: "images" })).toEqual(["alt", "_id", "_creationTime"]);
    expect(whereFieldNames({ config, collection: "nope" })).toBeUndefined();
  });

  test("lists layout children under their data keys, never the layout key", () => {
    const config = {
      collections: [{
        slug: "posts",
        fields: {
          name: row({ fields: { first: text(), last: text() } }),
          info: tabs({ tabs: [{ label: "SEO", name: "seo", fields: { metaTitle: text() } }] }),
        },
      }],
    };
    expect(whereFieldNames({ config, collection: "posts" })).toEqual(["first", "last", "seo", "_id", "_creationTime"]);
  });
});

describe("referencedWhereFields", () => {
  test("collects every leaf field once, from either form", () => {
    const node = { and: [{ field: "a", op: "eq", value: 1 }, { or: [{ field: "b", op: "eq", value: 2 }, { not: { field: "a", op: "eq", value: 3 } }] }] };
    expect(referencedWhereFields({ where: node as never })).toEqual(["a", "b"]);
    expect(referencedWhereFields({ where: ((q: any) => q.or(q.eq("a", 1), q.not(q.eq("b", 2)))) as never })).toEqual(["a", "b"]);
  });
});
```

Import `text`, `checkbox`, `row`, `tabs` from `"../fields"` for the fixtures (the factories
`fields/utils.test.ts` uses for `getDataFields`), and `whereFieldNames`, `referencedWhereFields`
from `./queryArgs`.

#### packages/core/src/api/utils.ts

`find` and `search` each run the same per-document pass three or four times (page, `take`,
`collect`, `totalDocs`). The guard adds a step to it, so it moves into one helper. Add the
imports `hasPermission`, `isFieldAllowed`, `resolveFieldPermissions`, `stripDeniedFields` from
`"../access"` and `type GenericDocument` from `"convex/server"`, then:

```ts
/**
 * The per-document read pass `find` and `search` share: `hasPermission`, then the
 * caller's field permissions, then stripping denied fields.
 *
 * A document is dropped, not stripped, when the caller's `where` referenced a field
 * this caller may not read on it: a match on a hidden field would reveal the
 * field's value through which rows came back (for example, "which posts have
 * `salary > 100000`").
 *
 * @param props - Input props.
 * @param props.docs - Documents as fetched.
 * @param props.access - From `resolveReadCall` / `resolveAccessCall`; `undefined` when
 *   access is bypassed or unconfigured, which allows everything.
 * @param props.auth - The caller.
 * @param props.resource - Subject slug.
 * @param props.action - Read action being checked.
 * @param props.whereFields - Field names the caller's `where` referenced, system fields
 *   excluded; `[]` when there is no caller `where` or access is not enforced.
 * @returns The readable documents, with denied fields removed.
 */
export function readableDocuments<TDoc extends GenericDocument>(props: {
  docs: readonly TDoc[];
  access: VexAccessConfig | undefined;
  auth: VexApiAuth | undefined;
  resource: string;
  action: string;
  whereFields: readonly string[];
}): TDoc[] {
  const user = props.auth?.user ?? null;
  const organization = props.auth?.organization;
  const readable: TDoc[] = [];
  for (const doc of props.docs) {
    if (!hasPermission({ access: props.access, resource: props.resource, action: props.action, data: doc, user, organization })) {
      continue;
    }
    const fieldPermissions = resolveFieldPermissions({
      access: props.access,
      user,
      organization,
      resource: props.resource,
      action: props.action,
      data: doc,
    });
    if (props.whereFields.some((field) => !isFieldAllowed(fieldPermissions, field))) continue;
    readable.push(stripDeniedFields(doc, fieldPermissions));
  }
  return readable;
}
```

Import `VexApiAuth` from `./convex` if `utils.ts` does not already.

#### packages/core/src/api/find/server.ts and packages/core/src/api/search/server.ts

Three edits in each.

**1 — field list.** Replace Step 7's
`const collectionFields = args.config?.collections.find(...)?.fields;` and its `fields:` argument
with `fields: whereFieldNames({ config: args.config, collection: args.collection })`.

**2 — referenced fields.** Directly after the caller's filter is compiled (which validates a
plain node first), add:

```ts
  // Only enforced reads are guarded; a bypassed read may filter on anything.
  const whereFields =
    access !== undefined && args.where !== undefined
      ? referencedWhereFields({ where: args.where as VexWhere<string> }).filter((field) => !SYSTEM_FIELD_KEYS.has(field))
      : [];
```

Import `whereFieldNames` and `referencedWhereFields` from `../queryArgs`, `SYSTEM_FIELD_KEYS`
from `../../access`, and `readableDocuments` from `../utils`.

**3 — per-document pass.** Replace each `.filter((d) => hasPermission({ … }))` on the page,
`take` and `collect` results, and the following `docs = docs.map((d) => stripDeniedFields(…))`
block, with one call per branch:

```ts
  const readable = (fetched: readonly GenericDocument[]) =>
    readableDocuments({ docs: fetched, access, auth: args.auth, resource, action, whereFields });

  if (args.paginationOpts) {
    convexPaginationResult = await findQuery.paginate(args.paginationOpts);
    docs = readable(convexPaginationResult.page);
  } else if (args.limit) {
    docs = readable(await findQuery.take(args.limit));
  } else {
    docs = readable(await findQuery.collect());
  }
```

(`searchQuery` in `search/server.ts`.) In the `totalDocs` count, replace the
`.filter((d) => hasPermission({ … }))` with `readable(await countQuery.collect())`, so the count
drops exactly the rows the page drops.

#### packages/core/src/api/find/server.test.ts

Add after the `describe("find (server) — access constraints")` block, reusing its
`constrainedPostsResource`:

```ts
// `reader` may read every post but not its `featured` field.
const featuredHiddenAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["reader"] as const,
    resources: [constrainedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: { reader: { posts: { read: () => ({ "*": true, featured: false }) } } },
  }),
} as unknown as VexConfig;

const readerAuth = { user: { _id: "u2", roles: "reader" } };

describe("find (server) — where cannot probe a field the caller cannot read", () => {
  /** Inserts A (featured) and B (not), then runs `find` as `reader`. */
  const findAsReader = (extra: Record<string, unknown>) => {
    const t = convexTest(schema, modules);
    return t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
      return find({ ctx, collection: "posts", config: featuredHiddenAccess, auth: readerAuth, ...extra } as any);
    });
  };

  test("a where on a denied field returns nothing for that caller", async () => {
    // Not ["A"]: that would reveal A's hidden `featured` value.
    const docs = await findAsReader({ where: { field: "featured", op: "eq", value: true } });
    expect(docs).toEqual([]);
  });

  test("a where on a readable field is unaffected, and the hidden field is still stripped", async () => {
    const docs = await findAsReader({ where: { field: "slug", op: "eq", value: "a" } });
    expect(docs.map((d: any) => d.title)).toEqual(["A"]);
    expect(docs[0]).not.toHaveProperty("featured");
  });

  test("access: { bypass: true } skips the guard", async () => {
    const docs = await findAsReader({ where: { field: "featured", op: "eq", value: true }, access: { bypass: true } });
    expect(docs.map((d: any) => d.title)).toEqual(["A"]);
  });

  test("totalDocs excludes the rows the page excludes", async () => {
    const result = await findAsReader({
      where: { field: "featured", op: "eq", value: true },
      paginationOpts: { numItems: 1, cursor: null, totalDocs: true },
    });
    expect(result.page).toEqual([]);
    expect(result.totalDocs).toBe(0);
  });
});
```

#### packages/core/src/api/server.ts

In `collectionsApi`, add `where: v.optional(v.any())` to the `args` of both the `find` and
`search` queries, and pass `where: args.where as VexWhere<string> | undefined` through to
`find(...)` / `search(...)`. `v.any()` because Convex validators cannot express a recursive
type. `whereToConvexQueryFilter` validates the value with `validateWhereNode` before use, and a function
cannot arrive over the wire.

#### packages/core/src/api/convex.ts

Add `where?: VexWhereNode<string>;` to `VexFindArgs`, `VexFindPaginatedArgs`, and
`VexSearchArgs` (import the type from `./queryArgs`). `usePaginatedQuery` spreads
`VexFindPaginatedArgs` into its query, so it forwards `where` with no change. Spec I's list
filters use that path.

#### packages/react/src/client/whereArg.ts

```ts
import { whereToNode, type VexWhere, type VexWhereNode } from "@vexcms/core";

/**
 * Converts a client `where` to the plain node the Convex function accepts.
 * A callback cannot cross the network; a node passes through unchanged.
 *
 * @param where - The caller's `where`, either form, or `undefined`.
 * @returns The plain node, or `undefined`.
 */
export function whereArg<S extends string>(where: VexWhere<S> | undefined): VexWhereNode<S> | undefined {
  if (where === undefined) return undefined;
  return typeof where === "function" ? whereToNode<S>(where) : where;
}
```

`VexWhere` must be exported from the `@vexcms/core` root for this import. Extend Step 7's root
export line to `export type { VexWhere, VexWhereNode } from "./api/queryArgs";`.

#### packages/react/src/client/find/client.ts

- `FindClientArgs` and `FindClientPaginatedArgs`: add `where?: VexWhere<TCollectionSlug>;` with
  the JSDoc "Predicate over the collection's fields: a builder callback or a plain node. The
  callback is converted to a node before it is sent."
- `find` implementation: add `where: whereArg(args.where),` to the args object passed to
  `convexQuery` (beside `paginationOpts`).
- `findQueryKey`: add the same `where: whereArg(args.where),` so a key built for invalidation
  matches the key `find` used.
- Add a `where` line to the `find` JSDoc `@example`.

#### packages/react/src/client/search/client.ts

Same three edits for the search client args and `search`.

Verify: `pnpm --filter @vexcms/core test -- api && pnpm --filter @vexcms/react test && pnpm -r typecheck`

### Step 9 — ADR, docs, changeset [agent]

- [ ] Create `.agent/docs/decisions/ADR-015.md`
- [ ] Modify `apps/docs/src/content/docs/guides/local-api.mdx`
- [ ] Modify `apps/docs/src/content/docs/guides/access-control.mdx`
- [ ] Modify `README.md`
- [ ] Modify `packages/core/README.md` (`ConvexError` → `VexError` in the `validate()` examples)
- [ ] Create `.changeset/backend-neutral-query-args.md`

#### .agent/docs/decisions/ADR-015.md

~~~md
# ADR-015: Public Vex signatures do not expose database types

- Status: accepted
- Date: <implementation date>

## Context

VexCMS runs only on Convex today, and a database-adapter layer (Convex, then Postgres/Supabase)
is a plausible later direction (`.agent/docs/research/db-adapter-feasibility.md`). `find`/`search`
exposed Convex's `IndexRangeBuilder`/`FilterBuilder` in their arguments, and project
`validate()` code threw `ConvexError`. Either would make moving the Convex implementation
into its own package a breaking change for every consumer.

## Decision

No exported Vex function or type exposes a `convex/*` type in its signature, with two
exceptions: the `ctx` a server function is called with, and members an adapter package adds
to a Vex interface through declaration merging. Query arguments use Vex's constraint
builders (`withIndex` range → `ConstraintBuilder`, `where` → `FilterConstraintBuilder`),
compiled to the backend inside the implementation. Errors projects throw for Vex to surface
use `VexError`.

One vocabulary for queries and access rules: **`where` is the portable predicate** (the
`find`/`search` argument, server and client, and the `where` property of an access rule), and
**`withIndex` is the Convex index pushdown** (the server `find` argument and the `withIndex`
property of an access rule on query actions). When the Convex implementation moves into an
adapter, core keeps only `where`, and `withIndex` moves into interfaces the Convex adapter
augments (`FindServerArgs` and `ConstrainedPermissionCheck`). Call sites do not change.
Backends whose planners pick indexes themselves never declare `withIndex`.

**`@vexcms/core/server` is the permanent import path for the `ctx`-taking server API.** A
database adapter plugs in beneath `find`/`get`/`create`/… (consistent with first-party
adapters shipping as plugins, `post-v0.1.0-plan.md` decision 14); it does not re-home them.
`ctx` is typed by the active adapter.

Internal types (`ConvexQueryIndexRangeFn`, `ConvexQueryFilterFn`, the compilers in `access/compileQueryConstraints.ts`)
remain Convex-typed until an adapter split moves them.

## Consequences

- `find`/`search` `filter` was replaced by `where`, and access rules' `constraints` callback by
  separate `withIndex` and `where` properties (pre-0.1.0, no deprecation). The rule-level
  `filter` property, a JS predicate over a fetched document, keeps its name.
- `where` crosses the network in its plain-node form. A `where` cannot reveal a field the
  caller cannot read.
- New public APIs are reviewed against this rule.
- An adapter split moves code without changing consumer call sites or import paths.
- Remaining pre-plugin readiness work: `.agent/docs/specs/2026-10-21-adapter-readiness/stem.md`.
~~~

#### apps/docs/src/content/docs/guides/local-api.mdx

Four edits:

1. The sentence "Query-chain options apply in order: `withIndex` → `order` → `filter` →
   `take`/pagination." becomes "… `withIndex` → `order` → `where` → …".
2. "Prefer `withIndex` over `filter` for anything performance-sensitive — `filter` scans every…"
   becomes the same sentence with `where`. Add one example after it:

   ```ts
   find({ ctx, collection: "posts", where: (q) => q.and(q.eq("featured", true), q.neq("slug", "draft")) })
   ```

3. The bullet "**`withIndex` beats `filter`.**" becomes "**`withIndex` beats `where`.**",
   with the body updated to match.

4. After the example added in edit 2, add a short paragraph and a second example showing the
   plain data form:

   > `where` also accepts a plain object with the same shape the callback builds — for a
   > filter that needs to be saved (a view) or put in a URL, which a function cannot be.
   > Convert a builder call to this shape with `whereToNode`; validate an untrusted one with
   > `validateWhereNode`.

   ```ts
   find({ ctx, collection: "posts", where: { field: "featured", op: "eq", value: true } })
   ```

Lines 22–23 describe how *access rules* compile on Convex (`.withIndex(...)` / `.filter(...)`).
These are Convex query methods and stay as they are; reword the sentence to "a rule's
`withIndex` becomes `.withIndex(...)` and its `where` becomes `.filter(...)` on the same query".

Add a client example after edit 4:

```ts
import { find } from "@vexcms/react/client";
useQuery(find({ collection: "posts", where: (q) => q.eq("featured", true) }));
```

with one sentence: "On the client, a callback is converted to the plain form before it is
sent. `withIndex` is server-only."

#### apps/docs/src/content/docs/guides/access-control.mdx

Rewrite every rule from `constraints` to the split shape, using the Step 6 migration table:
`constraints: ({ q }) => q.filter((f) => f.eq("visibility", "public"))` →
`where: ({ q }) => q.eq("visibility", "public")`; the two `authorId` rules →
`where: ({ user, q }) => q.eq("authorId", user._id)`; the `viewCount` rule →
`where: ({ q }) => q.gt("viewCount", 1000)` (its sibling `filter` stays); the `by_authorId` rule →
`withIndex: ({ user }) => ({ name: "by_authorId", range: (ix) => ix.eq("authorId", user._id) })`.
Replace the section that introduces `constraints` with one that introduces both properties:
"`withIndex` narrows through a declared index (Convex-specific, query actions only) — the same
`{ name, range }` object `find` takes, or a function of the caller returning one; `where` is the
portable predicate, the same one `find` and `search` take. `filter` remains the per-document
escape hatch for checks neither can express. Any combination works; `withIndex` alone (with a
compound index if the rule spans two fields) and `withIndex` + `filter` are the usual shapes."
Show Step 6's examples 1, 1b and 2 in that section, in that order, then one static `where`
(`where: { field: "visibility", op: "eq", value: "public" }`) as the plain-object counterpart of
the callback. Document the per-property short-circuit (`false` denies, `true` adds nothing; the
static forms always narrow).

#### README.md

In the Access Control example, rewrite both rules:

- `read: { constraints: ({ user, q }) => q.withIndex("by_author", (ix) => ix.eq("author", user._id)) }`
  → `read: { withIndex: ({ user }) => ({ name: "by_author", range: (ix) => ix.eq("author", user._id) }) }`
- `update: { constraints: ({ user, q }) => q.filter((f) => f.eq("author", user._id)) }`
  → `update: { where: ({ user, q }) => q.eq("author", user._id) }`

Reword the paragraph above it ("Write rules as `{ constraints }` builders…") to name
`withIndex` and `where`. The sentence "Add a `filter` callback beside `constraints`" becomes
"beside `withIndex` / `where`".

#### packages/core/README.md

In the field-validation section, the two examples and the prose switch to `VexError`:

- `throw new ConvexError({ code: "SLUG_CONFLICT", message: "Slug already in use." })`
  (≈ line 282) → `throw new VexError({ … })`, with `VexError` added to that example's
  `@vexcms/core` import.
- The prose at ≈ lines 298-300 ("a plain `Error`, your own subclass, or a `ConvexError` with
  structured data; `validateFields` attaches the field key and re-throws one `ConvexError`
  shape") → "… or a `VexError` with structured data; `validateFields` attaches the field key
  and re-throws it with that data intact."
- The `beforeChangeHook` / `textValidator` example (≈ lines 312-334): drop
  `import { ConvexError } from "convex/values"`, add `VexError` to the `@vexcms/core` import,
  and `throw new VexError({ message: … })`.

#### .changeset/backend-neutral-query-args.md

~~~md
---
"@vexcms/core": patch
"@vexcms/react": patch
---

**Breaking — `find` and `search` take `where` instead of `filter`.** Fields are named
directly, with no `q.field(...)`:

```ts
// before
find({ ctx, collection: "posts", filter: (q) => q.eq(q.field("published"), true) })
// after
find({ ctx, collection: "posts", where: (q) => q.eq("published", true) })
```

`where` uses the same builder as access rules: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `and`,
`or`, `not`. `withIndex` is unchanged at the call site; its `range` is now typed from your
generated index declarations rather than the Convex data model.

**Breaking — access rules: `constraints` splits into `withIndex` and `where`.** Each maps onto
the `find` argument of the same name. `withIndex` (query actions only) is the same
`{ name, range }` object `find` takes, or a function of the caller returning one; `where`
builds a predicate with `q`. Either callback may return `true` (no restriction from this half)
or `false` (deny). The rule-level `filter` property is unchanged. Any combination is allowed.

```ts
// before
read: { constraints: ({ q }) => q.withIndex("by_status", (ix) => ix.eq("status", "published")) }
read: { constraints: ({ user, q }) => q.withIndex("by_author", (ix) => ix.eq("author", user._id)) }
update: { constraints: ({ user, q }) => q.filter((f) => f.eq("author", user._id)) }
// after
read: { withIndex: { name: "by_status", range: (ix) => ix.eq("status", "published") } }
read: { withIndex: ({ user }) => ({ name: "by_author", range: (ix) => ix.eq("author", user._id) }) }
update: { where: ({ user, q }) => q.eq("author", user._id) }
```

`@vexcms/react/testing`'s access fixtures use the new shape.

**New — `VexError`.** Throw it from a field's `validate()` instead of `ConvexError`; the admin
receives the same structured data with the failing `field` added.

**New — `where` accepts a plain data form.** Besides the builder callback, `where` now also
accepts `VexWhereNode<S>`, the same filter as plain JSON — for a filter that needs to be saved
or sent over the wire, which a function cannot be:

```ts
find({ ctx, collection: "posts", where: { and: [{ field: "featured", op: "eq", value: true }] } })
```

Convert a builder callback to this shape with `whereToNode`; validate an untrusted one (a
saved view, a URL param) with `validateWhereNode`, which throws a `VexError` on a malformed
shape, an unknown operator, or an unknown field name.

**New — `where` on the client.** `find` and `search` from `@vexcms/react/client` accept
`where` in either form; a callback is converted to the plain form before it is sent. A `where`
on a field the caller cannot read (field-level RBAC) excludes the documents where it is hidden,
so a filter cannot be used to probe hidden values.
~~~

`@vexcms/react` is listed because `VexCallbackApi` (re-exported through the client config
types) changes shape. Drop it if `pnpm changeset status` shows react has no dependency on the
changed types.

Verify: `pnpm --filter docs build && node scripts/verify-scaffold.mjs`

## Verification

- `pnpm -r build && pnpm -r test` — green.
- `pnpm -r typecheck` — no errors in `apps/test`, `apps/www`, or the scaffolded templates.
- No `filter:` argument remains on `find`/`search` call sites:
  `rg -n "filter:\s*\(" packages/*/src apps/*/src apps/*/convex packages/create-vexcms/templates` → no `find`/`search` hits.
- No public `api/*` signature imports Convex builder types:
  `rg -n "IndexRangeBuilder|FilterBuilder|ExpressionOrValue" packages/core/src/api --glob '!*.test.ts'` → only `buildQuery` internals and `api/types.ts` internal aliases.
- Malformed or unknown-field `where` data fails with a named error:
  `rg -n "INVALID_WHERE" packages/core/src/api/queryArgs.ts` → present, thrown as `VexError`.
- No Convex-typed internal is exported from the package root: in `packages/core/dist/index.d.ts`,
  no export named `ConvexQueryIndexRangeFn`, `ConvexQueryFilterFn`, `ConvexQueryIndex`, `queryConstraintsToConvex*`,
  `queryFilterTreeToConvexFilter`, `pickConvexQueryIndex`, or `composeConvexQueryRanges`.
- No `constraints:` access rule remains:
  `rg -n "constraints:" packages/*/src apps/*/src packages/create-vexcms/templates README.md apps/docs/src/content/docs/guides` → no access-rule hits.
- `createAccessQueryBuilder` is gone: `rg -n "createAccessQueryBuilder|AccessQueryBuilder|AccessPredicateBuilder" packages` → no hits outside `dist/`.
- No `constraints:` code sample remains in the seeds: `rg -n "constraints:" apps/*/convex/seed.ts` → no hits.
- `validate()` docs teach `VexError`: `rg -n "ConvexError" packages/core/README.md` → no hits.
- Smoke (access): `pnpm --filter test dev` and sign in as a non-admin role. A media list governed
  by the `where: ({ q }) => q.gt("size", 50000)` rule in `apps/test/src/auth/access.ts` shows only
  files over 50 kB, as it did before.
- Smoke (client `where`): in `apps/www`, temporarily call
  `useQuery(find({ collection: "pages", where: (q) => q.eq("slug", "home") }))` in a client
  component → one page. Then, as a role with a field hidden by field-level RBAC, filter on that
  field → no documents. Remove the temporary call.
- Smoke: `pnpm --filter www dev`, open `/admin`, edit a page's slug to an existing slug, save → the
  slug field shows "This slug is already in use…" (the `VexError` path end to end).
