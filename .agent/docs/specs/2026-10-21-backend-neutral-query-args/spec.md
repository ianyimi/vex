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

# 2026-10-21-backend-neutral-query-args — Spec

## Overview

Launch-plan item **B3**. `find` and `search` expose Convex's own query-builder types
(`IndexRangeBuilder`, `FilterBuilder`) in their public arguments
(`api/find/server.ts` `FindServerArgs.filter`/`withIndex`, `api/search/server.ts`
`SearchServerArgs.filter`), and `validate()` callbacks throw `ConvexError` imported from
`convex/values`. Any later move of the Convex implementation into an `@vexcms/convex` adapter
(`.agent/docs/research/db-adapter-feasibility.md`) would then break every consumer.

This spec routes both query arguments through the Vex constraint builders the access layer
already ships (`access/createIndexConstraintBuilder.ts`, `access/createFilterConstraintBuilder.ts`),
compiled to Convex by the existing `access/compileConstraints.ts`, and adds `VexError`. Access
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
   is built** (`andFilters`). `buildQuery` in both `find` and `search` then receives a single
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
    (`AccessFilterConstraint`, `access/constraintTypes.ts`), with friendlier keys (`and` / `or`
    / `not` in place of `kind: "and"` / `"or"` / `"not"`). `validateWhereNode` validates an
    untrusted one at runtime (a renamed field or dropped operator in a stale saved view is not
    a compile-time error) and throws `VexError` with `code: "INVALID_WHERE"`; `whereToNode`
    converts a builder callback to this shape, for saving a filter authored in code. Both
    forms compile through the same tree (`compileWhere`), so a saved `VexWhereNode` and the
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
    (decided 2026-10-23), each mapping 1:1 onto the `find` argument of the same name:
    `withIndex: ({ user }) => ({ name, range })` and `where: ({ user, q }) => q.eq(...)`.
    The `q.withIndex(...)` / `q.filter(...)` builder methods and their types
    (`AccessQueryBuilder`, `AccessPredicateBuilder`, `IndexedAccessCondition`,
    `AccessConditionResult`) are deleted. Why split rather than rename `constraints`: a rule
    using only a predicate would otherwise sit under a property called `withIndex`, and at the
    adapter split `withIndex` must move into the Convex adapter on its own (Decision 11), which
    is only possible if it is a separate property. `withIndex` exists only on query-shaped
    actions. Each half short-circuits on a boolean (`false` denies, `true` adds nothing). One
    evaluator (`evaluateRuleCondition`) replaces the three copies of "run the callback, read
    the condition" in `resolveAccessRule`, `hasPermission`, and `validateAccessConstraints`.
14. **The client `find` / `search` (`@vexcms/react/client`) take `where`** (decided
    2026-10-23). Either form is accepted; the wrapper converts a callback with `whereToNode`,
    so only the plain node crosses the network and the query key is stable. The generated
    Convex `find` / `search` functions accept `where: v.optional(v.any())` (Convex validators
    cannot express a recursive type) and validate it with `validateWhereNode`, now capped at 64
    nodes and depth 8. **Security:** a `where` must not reveal a field the caller cannot read,
    so when access is enforced, a document is excluded if the `where` references a field
    field-level RBAC hides on it. The same exclusion applies to `totalDocs`. `withIndex` stays
    server-only.

## Out of Scope

- A database-adapter interface, an `@vexcms/convex` package split, or any second backend.
- `withIndex` from the client. It is Convex-specific, and the generated functions do not
  expose it (Decision 14).
- `ctx` on `find({ ctx })`, the pagination shape (`paginationOpts`, `continueCursor`), and
  `_id`/`_creationTime`. All are kept as they are; another adapter emulates them.
- Changing the internal `IndexRangeFn`/`AccessFilterFn` types or `versions/statusConstraint.ts`.
  They are internal and stay Convex-typed until the adapter split.
- Migrating `VexAccessError` onto `VexError`.
- Moving `withIndex` into an adapter-augmented interface (decision 11).
- The remaining pre-plugin adapter-readiness items: neutral field storage kinds and `vex` in
  hook props. See `specs/2026-10-21-adapter-readiness/stem.md`. (That stem's item 3,
  serializable `where`, is now built here — Decision 12 — because launch spec I needs it
  immediately, not post-0.1.0.)

## Implementation

### Step 1 — `withIndex` / `where` types and their Convex compilers [agent]

- [ ] Create `packages/core/src/api/queryArgs.ts`
- [ ] Create `packages/core/src/api/queryArgs.test.ts`

#### packages/core/src/api/queryArgs.ts

```ts
import { accessConstraintsToIndexRange, accessFilterTreeToFilter } from "../access/compileConstraints";
import type {
  ConstraintBuilder,
  ConstraintResult,
  FilterConstraintBuilder,
} from "../access/constraintTypes";
import { createFilterConstraintBuilder } from "../access/createFilterConstraintBuilder";
import { createIndexConstraintBuilder, readIndexConstraints } from "../access/createIndexConstraintBuilder";
import type { AccessDocFor, AccessFilterFn, QueryIndex } from "../access/types";
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
 * Compiles a caller's `withIndex` argument to the `QueryIndex` shape
 * `pickQueryIndex` arbitrates.
 *
 * @param props - Input props.
 * @param props.withIndex - The caller's argument, already type-checked against
 *   the collection at the call site; `undefined` when the caller named no index.
 * @returns `undefined` for no index; `{ name }` for an ordering-only index;
 *   `{ name, range }` with the range compiled to a Convex `IndexRangeFn`.
 */
export function compileWithIndex(props: {
  withIndex: { name: string; range?: (q: never) => ConstraintResult } | undefined;
}): QueryIndex | undefined {
  // TODO: implement
  // 1. No `withIndex` → undefined.
  // 2. No `range` → `{ name }`.
  // 3. Call `range` with a fresh `createIndexConstraintBuilder()` (cast `as never` — the
  //    builder's field tuple is erased at runtime) → `built`.
  // 4. `readIndexConstraints(built)` → recorded list (empty when the callback returned
  //    the untouched builder — an unrestricted range).
  // 5. Return `{ name, range: accessConstraintsToIndexRange({ constraints }) }`.
  throw new Error("Not implemented");
}

/**
 * Compiles a caller's `where` argument to an `AccessFilterFn` the query can
 * apply inside `.filter(...)`.
 *
 * @param props - Input props.
 * @param props.where - The caller's predicate; `undefined` when absent.
 * @returns `undefined` for no predicate, else a thunk compiling the recorded
 *   tree against the query's own `FilterBuilder`.
 */
export function compileWhere(props: {
  where: ((q: never) => ConstraintResult) | undefined;
}): AccessFilterFn | undefined {
  // TODO: implement
  // 1. No `where` → undefined.
  // 2. Call `where` ONCE, eagerly, with `createFilterConstraintBuilder()` (cast `as never`);
  //    reinterpret the result as `AccessFilterConstraint<GenericDocument>` — the same
  //    identity cast `createAccessQueryBuilder` performs (`ConstraintResult` is nominal,
  //    the runtime value is the root node).
  // 3. Return `(q) => accessFilterTreeToFilter({ node, q })`.
  // Edge cases:
  // - Building eagerly (not inside the thunk) means a throwing `where` fails before any
  //   read, and a paginated `find` that also counts (`totalDocs`) reuses one tree.
  throw new Error("Not implemented");
}

/**
 * `and`s any number of optional filters into one, dropping the absent ones.
 *
 * @param props - Input props.
 * @param props.filters - Filters in application order; `undefined` entries are skipped.
 * @returns `undefined` when every entry is absent; the single filter unwrapped
 *   when only one is present; otherwise one filter `and`-ing them all.
 */
export function andFilters(props: { filters: readonly (AccessFilterFn | undefined)[] }): AccessFilterFn | undefined {
  const present = props.filters.filter((f): f is AccessFilterFn => f !== undefined);
  if (present.length === 0) return undefined;
  if (present.length === 1) return present[0];
  return (q) => q.and(...present.map((f) => f(q)));
}
```

When implementing `compileWhere`, add `import type { GenericDocument } from "convex/server";`
and `AccessFilterConstraint` to the `constraintTypes` import. Both are needed only for the cast
in step 2 of its body; the stub omits them to stay free of unused imports.

#### packages/core/src/api/queryArgs.test.ts

Runs against the existing convex-test fixture (`api/test/convex/schema.ts`, `posts` table with
the `by_featured` index), the same setup `api/find/server.test.ts` uses.

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import { andFilters, compileWhere, compileWithIndex } from "./queryArgs";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

async function seed(ctx: GenericMutationCtx<GenericDataModel>) {
  await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
  await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
  await ctx.db.insert("posts", { title: "C", slug: "c", featured: true });
}

describe("compileWithIndex", () => {
  test("undefined in, undefined out", () => {
    expect(compileWithIndex({ withIndex: undefined })).toBeUndefined();
  });

  test("a range-less index compiles to its name only", () => {
    expect(compileWithIndex({ withIndex: { name: "by_featured" } })).toEqual({ name: "by_featured" });
  });

  test("an eq range narrows the Convex index read", async () => {
    const t = convexTest(schema, modules);
    const titles = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await seed(ctx);
      const index = compileWithIndex({
        withIndex: { name: "by_featured", range: ((q: any) => q.eq("featured", true)) as never },
      })!;
      const docs = await ctx.db.query("posts").withIndex(index.name, index.range!).collect();
      return docs.map((d) => d.title);
    });
    expect(titles).toEqual(["A", "C"]);
  });
});

describe("compileWhere", () => {
  test("undefined in, undefined out", () => {
    expect(compileWhere({ where: undefined })).toBeUndefined();
  });

  test("or + not compile to one Convex filter", async () => {
    const t = convexTest(schema, modules);
    const titles = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await seed(ctx);
      const filter = compileWhere({
        where: ((q: any) => q.or(q.eq("slug", "b"), q.not(q.eq("featured", true)), q.eq("slug", "c"))) as never,
      })!;
      const docs = await ctx.db.query("posts").filter(filter).collect();
      return docs.map((d) => d.title);
    });
    expect(titles).toEqual(["B", "C"]);
  });
});

describe("andFilters", () => {
  test("drops absent filters and returns undefined when none remain", () => {
    expect(andFilters({ filters: [undefined, undefined] })).toBeUndefined();
  });

  test("a single filter is returned unwrapped", () => {
    const only = compileWhere({ where: ((q: any) => q.eq("slug", "a")) as never });
    expect(andFilters({ filters: [undefined, only] })).toBe(only);
  });

  test("two filters intersect", async () => {
    const t = convexTest(schema, modules);
    const titles = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await seed(ctx);
      const filter = andFilters({
        filters: [
          compileWhere({ where: ((q: any) => q.eq("featured", true)) as never }),
          compileWhere({ where: ((q: any) => q.neq("slug", "a")) as never }),
        ],
      })!;
      return (await ctx.db.query("posts").filter(filter).collect()).map((d) => d.title);
    });
    expect(titles).toEqual(["C"]);
  });
});
```

Verify: `pnpm --filter @vexcms/core test -- api/queryArgs && pnpm --filter @vexcms/core exec tsc --noEmit`

### Step 2 — `find` takes `where` and the Vex-typed `withIndex` [agent]

- [ ] Modify `packages/core/src/api/find/server.ts` (4 edits)
- [ ] Modify `packages/core/src/api/find/server.test.ts`
- [ ] Modify `packages/core/src/api/server.ts`

#### packages/core/src/api/find/server.ts

Four edits; everything not shown is unchanged.

**1 — imports.** From the `convex/server` type import, remove `ExpressionOrValue`,
`FilterBuilder`, `IndexNames`, `IndexRange`, `IndexRangeBuilder`, `NamedIndex`, and
`TableNamesInDataModel`. Keep `GenericDataModel`, `NamedTableInfo`, and `QueryInitializer`.
Drop `type IndexRangeFn` from the access import if it becomes unused. Add:

```ts
import { andFilters, compileWhere, compileWithIndex, type VexWhere, type VexWithIndex } from "../queryArgs";
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
  const callerIndex = compileWithIndex({
    withIndex: args.withIndex as { name: string; range?: (q: never) => ConstraintResult } | undefined,
  });
  const callerFilter = compileWhere({ where: args.where as ((q: never) => ConstraintResult) | undefined });
```

(import `ConstraintResult` as a type from `../../access/constraintTypes`). Then, in both
`buildQuery` calls (the main query and the `totalDocs` count query), replace
`accessFilter` with:

```ts
    filter: andFilters({ filters: [accessFilter, callerFilter] }),
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
    resolvedIndex?: QueryIndex;
    filter?: AccessFilterFn;
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
  // 3. filter — access constraint and caller `where`, already and-ed by `andFilters`.
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
`andFilters` preserved the access half.

#### packages/core/src/api/server.ts

Beside `export type { FindServerArgs } from "./find/server";` add:

```ts
export type { QueryIndexFieldsFor, VexWhere, VexWithIndex } from "./queryArgs";
```

Verify: `pnpm --filter @vexcms/core test -- api/find && pnpm -r exec tsc --noEmit`. The
recursive typecheck is what proves the 12 `withIndex` call sites in `apps/test`, `apps/www`,
and the templates still compile.

### Step 3 — `search` takes `where` [agent]

- [ ] Modify `packages/core/src/api/search/server.ts` (3 edits)
- [ ] Modify `packages/core/src/api/search/server.test.ts`

#### packages/core/src/api/search/server.ts

Three edits; everything not shown is unchanged.

**1 — imports.** Remove `ExpressionOrValue`, `FilterBuilder`, and `TableNamesInDataModel` from
the `convex/server` import if they become unused. Add
`import { andFilters, compileWhere, type VexWhere } from "../queryArgs";` and
`import type { ConstraintResult } from "../../access/constraintTypes";`.

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
  const filter = andFilters({
    filters: [accessFilter, compileWhere({ where: args.where as ((q: never) => ConstraintResult) | undefined })],
  });
```

Then rename `buildQuery`'s extra prop `accessFilter?: AccessFilterFn` to `filter?: AccessFilterFn`
and replace its three-branch filter block with:

```ts
  if (args.filter) q = q.filter(args.filter);
```

`buildQuery`'s `args` type changes from `SearchServerArgs<…> & { accessFilter?: AccessFilterFn }`
to `Omit<SearchServerArgs<…>, "where"> & { filter?: AccessFilterFn }`, so the raw `where`
callback cannot be applied by mistake.

#### packages/core/src/api/search/server.test.ts

Add one test to the existing top-level describe, using its fixture and an empty `query`
(the `.take()` fallback path, so no search index is needed):

```ts
  test("where narrows the result set", async () => {
    // Insert three `posts` rows: A (featured), B (not), C (featured) — same shape the
    // other tests in this file insert. Call `search({ ctx, collection: "posts", query: "",
    // searchIndexName: <the index the file's other tests use>, searchField: "title",
    // where: (q: any) => q.eq("featured", true) })`.
    // Expect titles ["A", "C"].
    throw new Error("Not implemented");
  });
```

Copy the insert and `search` call shape from the file's first test, so it matches whatever
fixture the file already uses.

Verify: `pnpm --filter @vexcms/core test -- api/search && pnpm -r exec tsc --noEmit`

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

### Step 5 — Access rules: `constraints` splits into `withIndex` + `where` [agent]

- [ ] Create `packages/core/src/access/evaluateRuleCondition.ts`
- [ ] Create `packages/core/src/access/evaluateRuleCondition.test.ts`
- [ ] Modify `packages/core/src/access/constraintTypes.ts` (add `AccessIndexSelection`; delete the `q`-builder interfaces)
- [ ] Modify `packages/core/src/access/types.ts` (`ConstrainedPermissionCheck` and its callback types)
- [ ] Modify `packages/core/src/access/resolveAccessRule.ts`, `hasPermission.ts`, `validateAccessConstraints.ts` (call the new evaluator)
- [ ] Modify `packages/core/src/access/buildChecks.ts` (`indexedEqCheck`, `indexedOwnerCheck`)
- [ ] Delete `packages/core/src/access/createAccessQueryBuilder.ts` and `createAccessQueryBuilder.test.ts`; update `access/index.ts`
- [ ] Modify `packages/react/src/testing/harness/accessFixtures.ts` (exported test kit)
- [ ] Migrate test call sites in `packages/core/src/access/*.test.ts`, `packages/core/src/api/{find,search,get,create,update,remove}/server.test.ts`, `packages/react/src/hooks/usePermission.test.tsx`
- [ ] Migrate `apps/test/src/auth/access.ts` (3 rules) and `packages/create-vexcms/templates/base-nextjs/src/auth/access.ts` (2 rules)

Implements Decision 13. Depends on Step 1 (index builder types). Independent of Steps 2–4
and 6.

**The new rule shape.** Each property maps 1:1 onto the `find` argument of the same name:

```ts
// before
read: {
  constraints: ({ user, q }) =>
    q.withIndex("by_author", (ix) => ix.eq("author", user._id)).filter((f) => f.neq("archived", true)),
}
// after
read: {
  withIndex: ({ user }) => ({ name: "by_author", range: (ix) => ix.eq("author", user._id) }),
  where: ({ q }) => q.neq("archived", true),
}
```

- `withIndex: (props) => boolean | { name, range }`. Query-shaped actions only. `range` is
  **required**, as today: a range-less index restricts nothing. `name` is typed against the
  resource's declared indexes, and `range`'s `ix` against that index's field tuple, in order.
  This is the same discriminated `{ name, range }` object as `find`'s `withIndex`
  (`VexWithIndex`, Step 1).
- `where: (props & { q }) => boolean | ConstraintResult`. Every action. `q` is the
  `FilterConstraintBuilder`, the same builder `find`'s `where` callback receives.
- `filter?` (unchanged): the per-document JS predicate for what neither can express.
- `props` is `{ user }`, plus `{ organization }` when `orgCollectionSlug` is configured. This
  is the same caller context `constraints` received, without `q` on `withIndex`.
- At least one of `withIndex` / `where` must be present. A `filter`-only object stays
  rejected (write a bare callback instead), as today.
- **Short-circuits per property:** `false` from either callback denies; `true` means "this
  half adds no restriction"; `true` from every present callback means unrestricted. So
  `({ user, q }) => user.isAdmin || q.filter(...)` becomes
  `where: ({ user, q }) => user.isAdmin || q.eq(...)`.

#### packages/core/src/access/constraintTypes.ts

**Delete** `AccessConditionResult`, `IndexedAccessCondition`, `AccessPredicateBuilder`, and
`AccessQueryBuilder` (types and JSDoc). Everything else stays (`ConstraintBuilder`,
`FilterConstraintBuilder`, `ConstraintResult`, `AccessFilterConstraint`,
`AccessIndexConstraint`, `IndexOp`, `FilterOp`, the field/value helpers). **Add** after
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
 * The index half of a rule. Returns `{ name, range }` to narrow through an
 * index, `true` to add no restriction, or `false` to deny.
 */
export type AccessWithIndexCallback<
  TData,
  TUser,
  TOrg,
  TIndexFields extends Record<string, readonly string[]>,
> = (props: AccessRuleProps<TUser, TOrg>) => boolean | AccessIndexSelection<TData, TIndexFields>;

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
          withIndex: AccessWithIndexCallback<TData, TUser, TOrg, TIndexFields>;
          where?: AccessWhereCallback<TData, TUser, TOrg>;
        }
      | {
          withIndex?: AccessWithIndexCallback<TData, TUser, TOrg, TIndexFields>;
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

**Type-check early.** Add to `types.test.ts`, before migrating anything else, the three
compile-time cases this shape must satisfy:

```ts
// 1. `ix` is typed by the discriminated `name`: a field from another index is an error.
withIndex: ({ user }) => ({ name: "by_author", range: (ix) => ix.eq("author", user._id) }),
// @ts-expect-error — "slug" is not by_author's first field
withIndex: () => ({ name: "by_author", range: (ix) => ix.eq("slug", "x") }),
// 2. `withIndex` on a mutation action is an error at the property.
// @ts-expect-error
update: { withIndex: () => true, where: ({ q }) => q.eq("author", "u") },
// 3. An object with neither `withIndex` nor `where` is an error.
// @ts-expect-error
read: { filter: () => true },
```

If case 1 does not narrow `ix`, TypeScript's contextual typing is not discriminating the
returned object literal. Annotate with `satisfies`, or make `withIndex`'s callback generic in
`N`, and record the choice here before continuing.

#### packages/core/src/access/evaluateRuleCondition.ts

Replaces `createAccessQueryBuilder` + `readAccessCondition`. The three call sites that ran
`check.constraints(...)` (`resolveAccessRule.ts`, `hasPermission.ts`,
`validateAccessConstraints.ts`) all call this instead, so the semantics live in one place.

```ts
import type { GenericDocument } from "convex/server";

import type { AccessFilterConstraint, AccessIndexConstraint } from "./constraintTypes";
import { createFilterConstraintBuilder } from "./createFilterConstraintBuilder";
import { createIndexConstraintBuilder, readIndexConstraints } from "./createIndexConstraintBuilder";

/**
 * One rule's resolved condition for one caller. Moved here unchanged from
 * `createAccessQueryBuilder.ts`; `compileConstraints.ts` and `resolveAccessRule.ts`
 * consume it.
 */
export interface AccessCondition<TDoc> {
  /** The index half, when the rule's `withIndex` returned a selection. */
  index?: { name: string; constraints: readonly AccessIndexConstraint<string, TDoc>[] };
  /** The predicate half, when the rule's `where` returned a predicate. */
  filter?: AccessFilterConstraint<TDoc>;
}

/**
 * What a constrained rule resolves to for one caller.
 *
 * - `true` / `false` — the rule short-circuited (every present half returned `true`,
 *   or one returned `false`).
 * - an {@link AccessCondition} — at least one half narrows.
 * - `undefined` — a callback returned something not built through its builder
 *   (a hand-made object, `undefined`, a number). Callers fail safe (deny) at
 *   request time and fail loud at config time.
 */
export type RuleConditionOutcome = boolean | AccessCondition<GenericDocument> | undefined;

/**
 * Runs a constrained rule's `withIndex` and `where` callbacks for one caller and
 * assembles the result.
 *
 * @param props - Input props.
 * @param props.check - The rule object; at least one of `withIndex` / `where` is present.
 * @param props.callerProps - `{ user }` plus `{ organization }` when configured. Pass the
 *   user-read sentinel's proxy here, as the callers do today, so a rule keyed to an
 *   absent caller is detected.
 * @returns The rule's outcome for this caller.
 * @throws Whatever a callback throws — `validateAccessConstraints` wraps it in a
 *   `VexAccessConfigError` naming the rule.
 */
export function evaluateRuleCondition(props: {
  check: { withIndex?: (p: never) => unknown; where?: (p: never) => unknown };
  callerProps: Record<string, unknown>;
}): RuleConditionOutcome {
  // TODO: implement
  // 1. idx = check.withIndex?.(callerProps). `false` → return false.
  // 2. wh = check.where?.({ ...callerProps, q: createFilterConstraintBuilder() }). `false` → return false.
  //    (Run both before returning so a throwing `where` still throws when `withIndex` is `true`.)
  // 3. index:
  //    a. idx === true or absent → undefined.
  //    b. idx is an object with a string `name` and a function `range` →
  //       `{ name, constraints: readIndexConstraints(range(createIndexConstraintBuilder())) }`.
  //    c. anything else → return undefined (unreadable).
  // 4. filter:
  //    a. wh === true or absent → undefined.
  //    b. wh is an object with a `kind` of "compare" | "and" | "or" | "not" → the tree
  //       (identity cast, as `createAccessQueryBuilder` did).
  //    c. anything else → return undefined (unreadable).
  // 5. Neither index nor filter → return true. Else return { index?, filter? }, omitting
  //    absent keys (never assign `undefined`).
  throw new Error("Not implemented");
}
```

#### packages/core/src/access/evaluateRuleCondition.test.ts

Ports `createAccessQueryBuilder.test.ts`'s behavioural cases to the new shape, plus the
per-property short-circuits. Exact expectations:

| Rule | Outcome |
|---|---|
| `{ withIndex: () => ({ name: "by_status", range: (ix) => ix.eq("status", "published") }) }` | `{ index: { name: "by_status", constraints: [{ field: "status", op: "eq", value: "published" }] } }` |
| `{ where: ({ q }) => q.neq("archived", true) }` | `{ filter: { kind: "compare", field: "archived", op: "neq", value: true } }` |
| both of the above | `{ index: …, filter: … }` |
| `{ withIndex: () => true, where: ({ q }) => q.eq("a", 1) }` | `{ filter: … }` (no `index` key) |
| `{ withIndex: () => true, where: () => true }` | `true` |
| `{ withIndex: () => false, where: ({ q }) => q.eq("a", 1) }` | `false` |
| `{ where: () => false }` | `false` |
| `{ where: () => ({ field: "a" }) as never }` | `undefined` |
| `{ withIndex: () => ({ name: "by_x" }) as never }` | `undefined` |
| `{ withIndex: () => true, where: () => { throw new Error("boom") } }` | throws `"boom"` |

#### packages/core/src/access/resolveAccessRule.ts, hasPermission.ts, validateAccessConstraints.ts

In each, replace the `check.constraints({ user, q: createAccessQueryBuilder(), … })` call
and the following `readAccessCondition(outcome)` with
`evaluateRuleCondition({ check, callerProps: { user, …organization } })`. Then branch on its
outcome as the existing code branches on `outcome` / `condition`: boolean → short-circuit;
`undefined` → the existing unreadable path (deny / config error); object → the existing
condition path. `isConstrainedCheck` (in `resolveAccessRule.ts` and `hasPermission.ts`) and the
`"constraints" in check` test (in `validateAccessConstraints.ts`) become
`"withIndex" in check || "where" in check`.

Error messages in `validateAccessConstraints.ts`:

- callback threw → `` `role "${role}" on ${resourceSlug}.${action}: the withIndex/where callback threw while being resolved — ${message}. Rules must be pure; they run once at config time with no documents and no database access.` ``
- unreadable outcome → `` `role "${role}" on ${resourceSlug}.${action}: withIndex must return { name, range } or a boolean, and where must return a predicate built from the supplied "q" or a boolean.` ``

Update every test that asserts the old text. The comment in `resolveAccessRule.ts` that quotes
`({ user, q }) => user.isAdmin || q.filter(…)` becomes `where: ({ user, q }) => user.isAdmin || q.eq(…)`.

#### packages/core/src/access/buildChecks.ts

`indexedEqCheck` returns
`{ withIndex: () => ({ name: index, range: (ix) => (ix as unknown as RawRange).eq(props.field, props.value) }) }`.
`indexedOwnerCheck` returns
`{ withIndex: ({ user }) => ({ name: index, range: (ix) => (ix as unknown as RawRange).eq(props.field, isRelationship ? [user._id] : user._id) }) }`.
Keep both outer `as unknown as AccessCheck<S>` casts. Drop the `AccessQueryBuilder` /
`AccessConditionResult` imports. `ownerPredicateCheck` is a bare callback and is unchanged.

#### packages/core/src/access/index.ts

Replace `export * from "./createAccessQueryBuilder";` with
`export * from "./evaluateRuleCondition";`.

#### packages/react/src/testing/harness/accessFixtures.ts

The `scoped` role's rule becomes
`read: { withIndex: () => ({ name: "by_status", range: (ix) => ix.eq("status", "published") }) }`.
This file ships in `@vexcms/react/testing`, so it is part of the public change.

#### Test and app call sites

Mechanical, by pattern. Expected values in every test are unchanged:

| Before | After |
|---|---|
| `constraints: ({ user, q }) => q.withIndex("i", (ix) => R)` | `withIndex: ({ user }) => ({ name: "i", range: (ix) => R })` |
| `constraints: ({ q }) => q.filter((f) => P(f))` | `where: ({ q }) => P(q)` |
| `constraints: ({ q }) => q.withIndex("i", (ix) => R).filter((f) => P(f))` | `withIndex: () => ({ name: "i", range: (ix) => R }), where: ({ q }) => P(q)` |
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
- `apps/www` has none.

Verify: `pnpm --filter @vexcms/core test -- access api && pnpm --filter @vexcms/react test -- usePermission && pnpm -r exec tsc --noEmit`

### Step 6 — Serializable `where`: plain data form, validator, and builder→node converter [agent]

- [ ] Modify `packages/core/src/api/queryArgs.ts` (4 edits)
- [ ] Modify `packages/core/src/api/queryArgs.test.ts`
- [ ] Modify `packages/core/src/api/find/server.ts` (2 edits)
- [ ] Modify `packages/core/src/api/find/server.test.ts`
- [ ] Modify `packages/core/src/api/search/server.ts` (2 edits)
- [ ] Modify `packages/core/src/api/search/server.test.ts`
- [ ] Modify `packages/core/src/api/server.ts`
- [ ] Modify `packages/core/src/index.ts`

Implements Decision 12. Depends on Step 1 (`queryArgs.ts`, `VexWhere`) and Step 4 (`VexError`);
independent of Step 5.

#### packages/core/src/api/queryArgs.ts

Four edits; everything not shown is unchanged from Step 1.

**1 — imports.** Add `AccessFilterConstraint`, `ConstraintField`, `ConstraintValue`, and
`FilterOp` to the `constraintTypes` type import. Add `FILTER_COMPARATORS` to the
`compileConstraints` import (beside `accessConstraintsToIndexRange`, `accessFilterTreeToFilter`).
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
 * (`AccessFilterConstraint`, `access/constraintTypes.ts`), with friendlier
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
export type VexWhereNode<S extends string> =
  | {
      field: ConstraintField<AccessDocFor<S>>;
      op: FilterOp;
      value: ConstraintValue<AccessDocFor<S>, ConstraintField<AccessDocFor<S>>>;
    }
  | { and: readonly VexWhereNode<S>[] }
  | { or: readonly VexWhereNode<S>[] }
  | { not: VexWhereNode<S> };

/**
 * The `where` argument of `find` and `search`: a predicate over `S`'s
 * fields, as EITHER a builder callback or its plain {@link VexWhereNode}
 * equivalent. Both compile to the same filter (`compileWhere`); the plain
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

**3 — `compileWhere`.** Replace Step 1's stub:

```ts
/**
 * Compiles a caller's `where` argument — a builder callback or a plain
 * {@link VexWhereNode} — to an `AccessFilterFn` the query can apply inside
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
export function compileWhere(props: {
  where: VexWhere<string> | undefined;
  fields?: readonly string[];
}): AccessFilterFn | undefined {
  // TODO: implement
  // 1. No `where` → undefined.
  // 2. `typeof where === "function"` → unchanged from Step 1: call it ONCE, eagerly,
  //    with `createFilterConstraintBuilder()` (cast `as never`); reinterpret the
  //    result as `AccessFilterConstraint<GenericDocument>`.
  // 3. Otherwise `where` is a plain node: `validateWhereNode({ node: where, fields })`,
  //    then walk the validated `VexWhereNode` into an `AccessFilterConstraint` — the
  //    inverse of `whereToNode`'s walk (`{ field, op, value }` → `{ kind: "compare", ... }`,
  //    `{ and }` / `{ or }` → `{ kind: "and" / "or", nodes }`, `{ not }` → `{ kind: "not", node }`).
  // 4. Return `(q) => accessFilterTreeToFilter({ node, q })`.
  throw new Error("Not implemented");
}
```

**4 — `whereToNode` and `validateWhereNode`.** Add after `compileWhere`:

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
  // TODO: implement
  // 1. Call `where` with `createFilterConstraintBuilder()` (cast `as never`), same as
  //    `compileWhere`'s callback branch, to get the recorded `AccessFilterConstraint`.
  // 2. Walk it: `kind: "compare"` → `{ field, op, value }`; `kind: "and" / "or"` →
  //    `{ and / or: nodes.map(walk) }`; `kind: "not"` → `{ not: walk(node) }`.
  throw new Error("Not implemented");
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
 *   `FILTER_COMPARATORS`'s keys, the runtime source of truth); or, when
 *   `fields` is given, a `field` not in it.
 */
export function validateWhereNode<S extends string = string>(props: {
  node: unknown;
  fields?: readonly string[];
}): VexWhereNode<S> {
  // TODO: implement, recursively over `props.node`:
  // 1. Not a non-null object → throw.
  // 2. Own key "and" or "or" → its value must be an array → validate each entry →
  //    return `{ [key]: validated }`.
  // 3. Own key "not" → validate its value → return `{ not: validated }`.
  // 4. Otherwise expect exactly `{ field, op, value }`: `field` must be a string,
  //    and a member of `props.fields` when given; `op` must be a key of
  //    `FILTER_COMPARATORS`; `value` is accepted as given (JSON-shaped is the
  //    caller's contract, same as every other JSON payload Vex trusts post-`JSON.parse`).
  //    Return `{ field, op, value }`.
  // Every failure throws `new VexError({ code: "INVALID_WHERE", message: "..." })`
  // naming the offending key or value.
  throw new Error("Not implemented");
}
```

#### packages/core/src/api/queryArgs.test.ts

Add `import { VexError } from "../errors";` and extend the `describe("compileWhere", ...)` block:

```ts
  test("a plain node and the equivalent builder compile to the same filter", async () => {
    const t = convexTest(schema, modules);
    const run = (where: VexWhere<string>) =>
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await seed(ctx);
        const filter = compileWhere({ where, fields: ["title", "slug", "featured"] })!;
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
    expect(() => compileWhere({ where: { field: "featured", value: true } as never })).toThrow(VexError);
    expect(() =>
      compileWhere({ where: { field: "featured", op: "startsWith", value: true } as never }),
    ).toThrow(VexError);
  });

  test("an unknown field throws VexError when fields are known", () => {
    expect(() =>
      compileWhere({ where: { field: "nope", op: "eq", value: true } as never, fields: ["title"] }),
    ).toThrow(VexError);
  });

  test("an unknown field is NOT checked when fields are omitted", () => {
    expect(() => compileWhere({ where: { field: "nope", op: "eq", value: true } as never })).not.toThrow();
  });
```

Add a new top-level describe beside `compileWhere`'s:

```ts
describe("whereToNode", () => {
  test("round-trips a builder call to the plain node compileWhere accepts", async () => {
    const t = convexTest(schema, modules);
    const node = whereToNode<string>(((q: any) => q.and(q.eq("featured", true), q.not(q.eq("slug", "a")))) as never);
    const titles = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await seed(ctx);
      const filter = compileWhere({ where: node })!;
      return (await ctx.db.query("posts").filter(filter).collect()).map((d) => d.title);
    });
    expect(titles).toEqual(["C"]);
  });
});
```

Verify: `pnpm --filter @vexcms/core test -- api/queryArgs && pnpm --filter @vexcms/core exec tsc --noEmit`

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
  const callerFilter = compileWhere({
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
`compileWhere({ where: args.where as ... })` call with:

```ts
  const collectionFields = args.config?.collections.find((c) => c.slug === args.collection)?.fields;
  const filter = andFilters({
    filters: [
      accessFilter,
      compileWhere({
        where: args.where as VexWhere<string> | undefined,
        fields: collectionFields ? Object.keys(collectionFields) : undefined,
      }),
    ],
  });
```

#### packages/core/src/api/search/server.test.ts

Add one test beside "where narrows the result set" (added in Step 3), same fixture, passing
`where: { field: "featured", op: "eq", value: true }` instead of the builder form; expect the
same titles.

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

Verify: `pnpm --filter @vexcms/core test -- api/queryArgs api/find api/search && pnpm -r exec tsc --noEmit`

### Step 7 — `where` on the client: Convex validators, client wrappers, field-permission guard [agent]

- [ ] Modify `packages/core/src/api/queryArgs.ts` (`whereFieldNames`, size limits in `validateWhereNode`)
- [ ] Modify `packages/core/src/api/queryArgs.test.ts`
- [ ] Modify `packages/core/src/api/find/server.ts` and `packages/core/src/api/search/server.ts` (field list; readable-field guard)
- [ ] Modify `packages/core/src/api/find/server.test.ts`
- [ ] Modify `packages/core/src/api/server.ts` (`collectionsApi` `find` / `search` arg validators + pass-through)
- [ ] Modify `packages/core/src/api/convex.ts` (`VexFindArgs`, `VexFindPaginatedArgs`, `VexSearchArgs`)
- [ ] Create `packages/react/src/client/whereArg.ts`
- [ ] Modify `packages/react/src/client/find/client.ts` (`FindClientArgs`, `FindClientPaginatedArgs`, `find`, `findQueryKey`)
- [ ] Modify `packages/react/src/client/search/client.ts` (args + `search`)

Implements Decision 14. Depends on Steps 4 (`VexError`) and 6 (`VexWhereNode`,
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

Two edits.

**1 — `whereFieldNames`.** Add after `validateWhereNode`:

```ts
/**
 * The field names a `where` node may reference on one collection: its declared
 * fields plus the system fields `_id` and `_creationTime`. Looks through both
 * `collections` and `mediaCollections`. `vex_`-prefixed versioning fields are
 * deliberately excluded; drafts are selected with the `drafts` argument.
 *
 * @param props - Input props.
 * @param props.config - The resolved config; `undefined` when the caller has none.
 * @param props.collection - The collection slug being queried.
 * @returns The allowed names, or `undefined` when the collection or config is
 *   unknown (field names then go unchecked, `validateWhereNode`'s documented fallback).
 */
export function whereFieldNames(props: {
  config: { collections: readonly { slug: string; fields: Record<string, unknown> }[]; mediaCollections?: readonly { slug: string; fields: Record<string, unknown> }[] } | undefined;
  collection: string;
}): readonly string[] | undefined {
  const all = [...(props.config?.collections ?? []), ...(props.config?.mediaCollections ?? [])];
  const match = all.find((c) => c.slug === props.collection);
  return match ? [...Object.keys(match.fields), "_id", "_creationTime"] : undefined;
}
```

**2 — size limits in `validateWhereNode`.** A client-supplied tree is untrusted input, and
each node is evaluated per scanned document. Add to the TODO list in its body:

```ts
  // 5. Limits, counted across the whole tree: more than WHERE_NODE_LIMIT (64) nodes, or
  //    nesting deeper than WHERE_DEPTH_LIMIT (8) → throw INVALID_WHERE naming the limit.
```

and declare beside it:

```ts
/** Maximum nodes in one `where` tree. */
export const WHERE_NODE_LIMIT = 64;
/** Maximum nesting depth of one `where` tree. */
export const WHERE_DEPTH_LIMIT = 8;
```

#### packages/core/src/api/queryArgs.test.ts

```ts
describe("whereFieldNames", () => {
  test("includes declared fields, media collections, and the two system fields", () => {
    const config = {
      collections: [{ slug: "posts", fields: { title: {}, featured: {} } }],
      mediaCollections: [{ slug: "images", fields: { alt: {} } }],
    };
    expect(whereFieldNames({ config, collection: "posts" })).toEqual(["title", "featured", "_id", "_creationTime"]);
    expect(whereFieldNames({ config, collection: "images" })).toEqual(["alt", "_id", "_creationTime"]);
    expect(whereFieldNames({ config, collection: "nope" })).toBeUndefined();
  });
});

test("validateWhereNode rejects trees over the node and depth limits", () => {
  const wide = { and: Array.from({ length: 65 }, () => ({ field: "a", op: "eq", value: 1 })) };
  let deep: unknown = { field: "a", op: "eq", value: 1 };
  for (let i = 0; i < 9; i += 1) deep = { not: deep };
  expect(() => validateWhereNode({ node: wide })).toThrow(VexError);
  expect(() => validateWhereNode({ node: deep })).toThrow(VexError);
});
```

#### packages/core/src/api/find/server.ts and packages/core/src/api/search/server.ts

Two edits in each.

**1 — field list.** Replace Step 6's
`const collectionFields = args.config?.collections.find(...)?.fields;` and its `fields:` argument
with `fields: whereFieldNames({ config: args.config, collection: args.collection })`.

**2 — readable-field guard.** A `where` that references a field the caller cannot read would
let the result set reveal that field's values (for example, "which posts have `salary > 100000`").
When `access` is enforced (`access !== undefined` after `resolveReadCall`) and a caller `where`
is present, compute its referenced field names once:

```ts
  const whereFields = callerFilter && args.where ? referencedWhereFields({ where: args.where }) : [];
```

Then, in the existing per-document pass where `resolveFieldPermissions(...)` is computed for
`stripDeniedFields`, **drop** a document when any name in `whereFields` (other than
`SYSTEM_FIELD_KEYS`) fails `isFieldAllowed(resolved, name)`. Compute `resolved` once per
document and reuse it for both the guard and `stripDeniedFields`. Apply the same guard to the
`totalDocs` count path, so the count cannot leak what the page hides.

Add `referencedWhereFields` to `queryArgs.ts`:

```ts
/**
 * Every field name a `where` references, in either form.
 *
 * @param props - Input props.
 * @param props.where - A builder callback or a plain node.
 * @returns Unique field names.
 */
export function referencedWhereFields(props: { where: VexWhere<string> }): string[] {
  // TODO: implement
  // 1. Callback → `whereToNode(where)`; node → as is.
  // 2. Walk: leaf → its `field`; `and` / `or` → children; `not` → child. Collect into a Set.
  throw new Error("Not implemented");
}
```

#### packages/core/src/api/find/server.test.ts

Add a describe for the guard, on the existing `posts` fixture. One role, `reader`, has
`posts: { read: () => ({ "*": true, featured: false }) }` (field map hides `featured`):

```ts
describe("find (server) — where cannot probe a field the caller cannot read", () => {
  test("a where on a denied field returns nothing for that caller", async () => {
    // Insert A (featured: true), B (featured: false). As `reader`, call
    // find({ ctx, config, auth: <reader>, collection: "posts", where: { field: "featured", op: "eq", value: true } }).
    // Expect [] — not ["A"], which would reveal A's hidden `featured` value.
    throw new Error("Not implemented");
  });

  test("a where on a readable field is unaffected", async () => {
    // Same setup; where: { field: "slug", op: "eq", value: "a" } → expect titles ["A"].
    throw new Error("Not implemented");
  });

  test("access: { bypass: true } skips the guard", async () => {
    // Same as the first test with access: { bypass: true } → expect ["A"].
    throw new Error("Not implemented");
  });
});
```

Build `auth` and `config` the way the file's existing access-constraint describes do.

#### packages/core/src/api/server.ts

In `collectionsApi`, add `where: v.optional(v.any())` to the `args` of both the `find` and
`search` queries, and pass `where: args.where as VexWhere<string> | undefined` through to
`find(...)` / `search(...)`. `v.any()` because Convex validators cannot express a recursive
type. `compileWhere` validates the value with `validateWhereNode` before use, and a function
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

`VexWhere` must be exported from the `@vexcms/core` root for this import. Extend Step 6's root
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

Verify: `pnpm --filter @vexcms/core test -- api && pnpm --filter @vexcms/react test && pnpm -r exec tsc --noEmit`

### Step 8 — ADR, docs, changeset [agent]

- [ ] Create `.agent/docs/decisions/ADR-015.md`
- [ ] Modify `apps/docs/src/content/docs/guides/local-api.mdx`
- [ ] Modify `apps/docs/src/content/docs/guides/access-control.mdx`
- [ ] Modify `README.md`
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

Internal types (`IndexRangeFn`, `AccessFilterFn`, the compilers in `access/compileConstraints.ts`)
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

Rewrite every rule from `constraints` to the split shape, using the Step 5 migration table:
`constraints: ({ q }) => q.filter((f) => f.eq("visibility", "public"))` →
`where: ({ q }) => q.eq("visibility", "public")`; the two `authorId` rules →
`where: ({ user, q }) => q.eq("authorId", user._id)`; the `viewCount` rule →
`where: ({ q }) => q.gt("viewCount", 1000)`; any `q.withIndex(...)` rule →
`withIndex: ({ user }) => ({ name, range })`. Replace the section that introduces
`constraints` with one that introduces both properties: "`withIndex` narrows through a
declared index (Convex-specific, query actions only); `where` is the portable predicate, the
same one `find` and `search` take. Use either or both. `filter` remains the per-document
escape hatch for checks neither can express." Document the per-property short-circuit
(`false` denies, `true` adds nothing).

#### README.md

In the Access Control example, rewrite both rules:

- `read: { constraints: ({ user, q }) => q.withIndex("by_author", (ix) => ix.eq("author", user._id)) }`
  → `read: { withIndex: ({ user }) => ({ name: "by_author", range: (ix) => ix.eq("author", user._id) }) }`
- `update: { constraints: ({ user, q }) => q.filter((f) => f.eq("author", user._id)) }`
  → `update: { where: ({ user, q }) => q.eq("author", user._id) }`

Reword the paragraph above it ("Write rules as `{ constraints }` builders…") to name
`withIndex` and `where`. The sentence "Add a `filter` callback beside `constraints`" becomes
"beside `withIndex` / `where`".

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
the `find` argument of the same name. `withIndex` returns `{ name, range }` (query actions
only); `where` builds a predicate with `q`. Either may return `true` (no restriction from this
half) or `false` (deny). The rule-level `filter` property is unchanged.

```ts
// before
read: {
  constraints: ({ user, q }) =>
    q.withIndex("by_author", (ix) => ix.eq("author", user._id)).filter((f) => f.neq("archived", true)),
}
// after
read: {
  withIndex: ({ user }) => ({ name: "by_author", range: (ix) => ix.eq("author", user._id) }),
  where: ({ q }) => q.neq("archived", true),
}
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
- `pnpm -r exec tsc --noEmit` — no errors in `apps/test`, `apps/www`, or the scaffolded templates.
- No `filter:` argument remains on `find`/`search` call sites:
  `rg -n "filter:\s*\(" packages/*/src apps/*/src apps/*/convex packages/create-vexcms/templates` → no `find`/`search` hits.
- No public `api/*` signature imports Convex builder types:
  `rg -n "IndexRangeBuilder|FilterBuilder|ExpressionOrValue" packages/core/src/api --glob '!*.test.ts'` → only `buildQuery` internals and `api/types.ts` internal aliases.
- Malformed or unknown-field `where` data fails with a named error:
  `rg -n "INVALID_WHERE" packages/core/src/api/queryArgs.ts` → present, thrown as `VexError`.
- No `constraints:` access rule remains:
  `rg -n "constraints:" packages/*/src apps/*/src packages/create-vexcms/templates README.md apps/docs/src/content/docs/guides` → no access-rule hits.
- `createAccessQueryBuilder` is gone: `rg -n "createAccessQueryBuilder|AccessQueryBuilder|AccessPredicateBuilder" packages` → no hits outside `dist/`.
- Smoke (access): `pnpm --filter test dev` and sign in as a non-admin role. A media list governed
  by the `where: ({ q }) => q.gt("size", 50000)` rule in `apps/test/src/auth/access.ts` shows only
  files over 50 kB, as it did before.
- Smoke (client `where`): in `apps/www`, temporarily call
  `useQuery(find({ collection: "pages", where: (q) => q.eq("slug", "home") }))` in a client
  component → one page. Then, as a role with a field hidden by field-level RBAC, filter on that
  field → no documents. Remove the temporary call.
- Smoke: `pnpm --filter www dev`, open `/admin`, edit a page's slug to an existing slug, save → the
  slug field shows "This slug is already in use…" (the `VexError` path end to end).
