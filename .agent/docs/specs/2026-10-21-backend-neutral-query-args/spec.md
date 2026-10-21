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
compiled to Convex by the existing `access/compileConstraints.ts`, and adds `VexError`. It also
renames the access-rule builder's `q.filter(...)` to `q.where(...)`, so queries and access rules
share one vocabulary: `where` is the portable predicate and `withIndex` is the Convex-specific
index pushdown. It must land **before the 0.1.0 tag**: after that, both renames need a
deprecation cycle.

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
9. **Access rules: `q.filter(...)` → `q.where(...)`, on both `AccessPredicateBuilder` and the
   chained `IndexedAccessCondition` (`q.withIndex(...).where(...)`).** The builder and its
   output (the filter tree) are unchanged; only the method name changes, matching `find`/
   `search`. The rule-level `filter` property (`{ constraints, filter }`, `access/types.ts`)
   **keeps its name**. It is a JS predicate over an already-fetched document, the same meaning
   as `Array.prototype.filter`, and it is already backend-neutral.
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

## Out of Scope

- A database-adapter interface, an `@vexcms/convex` package split, or any second backend.
- Accepting `where` in the client wrappers (`@vexcms/react/client` `find`). That needs a
  serializable argument validator on the generated Convex functions; it belongs to list-view
  spec **I**, which will consume `where` for filters.
- `ctx` on `find({ ctx })`, the pagination shape (`paginationOpts`, `continueCursor`), and
  `_id`/`_creationTime`. All are kept as they are; another adapter emulates them.
- Changing the internal `IndexRangeFn`/`AccessFilterFn` types or `versions/statusConstraint.ts`.
  They are internal and stay Convex-typed until the adapter split.
- Migrating `VexAccessError` onto `VexError`.
- Moving `withIndex` into an adapter-augmented interface (decision 11).
- The pre-plugin adapter-readiness items: neutral field storage kinds, `vex` in hook props, a
  serializable `where` data form. See `specs/2026-10-21-adapter-readiness/stem.md`.

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

### Step 5 — Access rules: `q.filter(...)` → `q.where(...)` [agent]

- [ ] Modify `packages/core/src/access/constraintTypes.ts` (2 method renames + JSDoc)
- [ ] Modify `packages/core/src/access/createAccessQueryBuilder.ts` (2 runtime keys)
- [ ] Modify `packages/core/src/access/validateAccessConstraints.ts` (error message)
- [ ] Modify `packages/core/src/access/resolveAccessRule.ts` (comment)
- [ ] Migrate test call sites in `packages/core/src/access/{config,createAccessQueryBuilder,hasPermission,resolveAccessRule,resolveFieldPermissions,types}.test.ts`, `packages/core/src/api/{find,search,get,create,update,remove}/server.test.ts`, `packages/react/src/hooks/usePermission.test.tsx`
- [ ] Migrate `apps/test/src/auth/access.ts` and `packages/create-vexcms/templates/base-nextjs/src/auth/access.ts`

A pure rename: the builder (`FilterConstraintBuilder`), the recorded condition
(`AccessCondition.filter`, an internal field), and every compiler stay as they are. The
internal `AccessCondition.filter` field is **not** renamed; it is not user-facing and
`compileConstraints.ts` reads it.

#### packages/core/src/access/constraintTypes.ts

Two edits; everything not shown is unchanged.

**1 — `IndexedAccessCondition`.** Rename the method `filter` to `where` and update its JSDoc:

```ts
  /**
   * Adds a per-document predicate alongside the index range — the same `where`
   * `find` and `search` take.
   *
   * On Convex, compiles to `.withIndex(name, range).filter(expr)`: the range narrows
   * what is READ, the predicate rejects rows within it that the range cannot
   * describe (`neq`, `or`, `not`).
   *
   * @param predicate - Builds the expression from the flat filter algebra.
   * @returns The completed condition.
   */
  where(
    predicate: (q: FilterConstraintBuilder<TDoc>) => ConstraintResult,
  ): AccessConditionResult;
```

**2 — `AccessPredicateBuilder`.** Rename the method `filter` to `where`, with the JSDoc summary
"Narrows by predicate — the same `where` `find` and `search` take." In the surrounding prose
JSDoc of `AccessConditionResult`, `IndexedAccessCondition`, `AccessPredicateBuilder`, and
`AccessQueryBuilder`, replace every `q.filter(…)` / `.filter(…)` that refers to the access
builder with `q.where(…)` / `.where(…)`. Leave the Convex comparison example inside
`AccessQueryBuilder`'s JSDoc (`ctx.db.query("pages").withIndex(...).filter(...)`) as Convex
code, and change its access-rule half to
`q.withIndex("by_author", (ix) => ix.eq("authorId", u)).where((f) => f.neq("archived", true));`.

#### packages/core/src/access/createAccessQueryBuilder.ts

In `createAccessQueryBuilder`, rename the two runtime keys: the `filter` key on the object
`withIndex` returns, and the top-level `filter` key on `builder`. Both become `where`; their
bodies are unchanged. Update the inline comment "Continuing with `.filter(…)`" to
"Continuing with `.where(…)`" and the `@returns` line to "`withIndex` / `where` results".

#### packages/core/src/access/validateAccessConstraints.ts

In the `VexAccessConfigError` message for a `constraints` callback that returned no condition,
change `` `q.withIndex(...) / q.filter(...), or return a boolean` `` to
`` `q.withIndex(...) / q.where(...), or return a boolean` ``. If a test asserts this message,
update the expected string to match.

#### packages/core/src/access/resolveAccessRule.ts

Comment only: `({ user, q }) => user.isAdmin || q.filter(…)` → `… || q.where(…)`.

#### Test and app call sites

Mechanical. In each file listed above, rewrite **only access-builder calls**:

| Before | After |
|---|---|
| `q.filter((f) => …)` / `q.filter((fq) => …)` inside a `constraints` callback | `q.where((f) => …)` |
| `q.withIndex(…).filter((f) => …)` | `q.withIndex(…).where((f) => …)` |

Do **not** touch `Array.prototype.filter` calls (`docs.filter(...)`, `.page.filter(...)`) or
the rule-level `filter:` property. Locate candidates with
`rg -n "q\.filter\(\(|\)\s*\.filter\(\(f" <file>` and confirm each hit is inside a
`constraints` callback before changing it. Expected values in every test are unchanged.

Known app/template sites: `apps/test/src/auth/access.ts` (2, `q.filter((fq) => fq.gt("size", 50000))`),
`packages/create-vexcms/templates/base-nextjs/src/auth/access.ts` (1,
`q.filter((fq) => fq.eq("email", user.email))`). `apps/www` has none.

Verify: `pnpm --filter @vexcms/core test -- access api && pnpm --filter @vexcms/react test -- usePermission && pnpm -r exec tsc --noEmit`

### Step 6 — ADR, docs, changeset [agent]

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

One vocabulary for queries and access rules: **`where` is the portable predicate**
(`find`/`search` argument, `q.where(...)` in access rules), and **`withIndex` is the Convex
index pushdown** (on both). When the Convex implementation moves into an adapter, core keeps
only `where`, and `withIndex` moves into an interface the Convex adapter augments (the
`find` argument and the `AccessQueryBuilder` method). Call sites do not change. Backends
whose planners pick indexes themselves never declare `withIndex`.

**`@vexcms/core/server` is the permanent import path for the `ctx`-taking server API.** A
database adapter plugs in beneath `find`/`get`/`create`/… (consistent with first-party
adapters shipping as plugins, `post-v0.1.0-plan.md` decision 14); it does not re-home them.
`ctx` is typed by the active adapter.

Internal types (`IndexRangeFn`, `AccessFilterFn`, the compilers in `access/compileConstraints.ts`)
remain Convex-typed until an adapter split moves them.

## Consequences

- `find`/`search` `filter` was replaced by `where`, and the access builder's `q.filter(...)` by
  `q.where(...)` (pre-0.1.0, no deprecation). The rule-level `filter` property, a JS
  predicate over a fetched document, keeps its name.
- New public APIs are reviewed against this rule.
- An adapter split moves code without changing consumer call sites or import paths.
- Remaining pre-plugin readiness work: `.agent/docs/specs/2026-10-21-adapter-readiness/stem.md`.
~~~

#### apps/docs/src/content/docs/guides/local-api.mdx

Three edits:

1. The sentence "Query-chain options apply in order: `withIndex` → `order` → `filter` →
   `take`/pagination." becomes "… `withIndex` → `order` → `where` → …".
2. "Prefer `withIndex` over `filter` for anything performance-sensitive — `filter` scans every…"
   becomes the same sentence with `where`. Add one example after it:

   ```ts
   find({ ctx, collection: "posts", where: (q) => q.and(q.eq("featured", true), q.neq("slug", "draft")) })
   ```

3. The bullet "**`withIndex` beats `filter`.**" becomes "**`withIndex` beats `where`.**",
   with the body updated to match.

Lines 22–23 describe how *access rules* compile on Convex (`.withIndex(...)` / `.filter(...)`).
These are Convex query methods and stay as they are, but add "an unindexed `q.where(...)` rule
becomes" in place of "an unindexed one becomes" so the access-rule method name is correct.

#### apps/docs/src/content/docs/guides/access-control.mdx

Four call sites (`q.filter((f) => f.eq("visibility", "public"))`,
`q.filter((f) => f.eq("authorId", user._id))` ×2, `q.filter((f) => f.gt("viewCount", 1000))`)
become `q.where(...)`. Rename any prose that names the access method `q.filter` to
`q.where`. Prose about the rule-level `filter` property stays. Add one sentence where
`q.withIndex(...)` is introduced: "`withIndex` is Convex-specific index pushdown; `where` is the
portable predicate, the same one `find` and `search` take."

#### README.md

In the Access Control example, `update: { constraints: ({ user, q }) => q.filter((f) => f.eq("author", user._id)) }`
becomes `q.where(...)`. The sentence "Need a check that field comparisons can't express …
Add a `filter` callback beside `constraints`" stays, because it names the rule-level property.

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

**Breaking — access rules: `q.filter(...)` is now `q.where(...)`**, including after an index
(`q.withIndex(...).where(...)`). Only the method name changes. The rule-level `filter`
property beside `constraints` is unchanged.

```ts
// before
read: { constraints: ({ q }) => q.filter((f) => f.eq("visibility", "public")) }
// after
read: { constraints: ({ q }) => q.where((f) => f.eq("visibility", "public")) }
```

**New — `VexError`.** Throw it from a field's `validate()` instead of `ConvexError`; the admin
receives the same structured data with the failing `field` added.
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
- No access-builder `q.filter(` remains:
  `rg -n "q\.filter\(\(|\)\s*\.filter\(\(f" packages apps README.md --glob '!**/node_modules/**'` → no hit inside a `constraints` callback.
- Smoke (access): `pnpm --filter test dev` and sign in as a non-admin role. A media list governed
  by the `q.where((fq) => fq.gt("size", 50000))` rule in `apps/test/src/auth/access.ts` shows only
  files over 50 kB, as it did before the rename.
- Smoke: `pnpm --filter www dev`, open `/admin`, edit a page's slug to an existing slug, save → the
  slug field shows "This slug is already in use…" (the `VexError` path end to end).
