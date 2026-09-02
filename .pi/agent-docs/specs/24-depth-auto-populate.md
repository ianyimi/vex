# Spec 24 — Depth Auto-Populate

**Status:** In progress — Steps 1–2 done; Steps 3–6 pending
**Depends on:** Spec 22 (relationship field), Spec 23 (vex API — `populate`, `PopulateShape`, `Populated`, `populateDocs`)
**Last spec update:** 2026-05-09

---

## Overview

Adds an internal, **undocumented** `depth?: number` parameter to `find`, `get`, and `search` (server-side functions and their Convex endpoints) that automatically populates every relationship field on a collection down to `depth` levels, without requiring the caller to enumerate relationship keys via `populate`. The primary consumer is `NextAdminPage` + `CollectionListView`, which must show relationship data in the list table without knowing which relationship fields each collection has at build time. `populate` remains the documented, recommended API; `depth` is an internal escape hatch.

Also adds client-side files for `create`, `update`, and `remove` so all six API operations are importable symmetrically from `@vexcms/core/client`.

The type system extends the existing `PopulateShape` / `Populated` machinery directly: `DepthPopulate<TSlug, D>` (already in `types.ts`) computes the equivalent `PopulateShape` for a literal depth `D` and feeds it into `Populated<TSlug, DepthPopulate<TSlug, D>>`. The `D` generic and its mutual-exclusion constraints (`populate` becomes `never` when `D ≠ 0`; `depth`/`config` become `never` when `TPopulate` is non-empty) live on `GenericQueryServerParams` so all three functions inherit them without repeating. `depth` is also added to `GenericQueryClientParams` (alongside `populate`) as a plain `number` passthrough — `filter`/`order`/`withIndex` are Convex query-chain operations and stay server-only.

---

## Current file state

```
packages/core/src/api/
  types.ts              ✅ done — Prettify, DepthPopulate, DepthPopulated, GenericQueryServerParams all present
                                  (GenericQueryServerParams needs D generic added — Step 3)
  depth.ts              ✅ done — buildDepthPopulate implemented
  depth.test.ts         ✅ done — tests present
  server.ts             ✅ done — re-exports buildDepthPopulate; queryApi/mutationApi still use _config (Step 4)
  find/
    server.ts           ⏳ pending Step 3 — no D generic
    client.ts           ⏳ pending Step 4 — add depth: args.depth to convexQuery call
  get/
    server.ts           ⏳ pending Step 3 — no D generic
    client.ts           ⏳ pending Step 4 — add depth: args.depth to convexQuery call
  search/
    server.ts           ⏳ pending Step 3 — no D generic
    client.ts           ⏳ pending Step 4 — add depth: args.depth to convexQuery call
  create/
    server.ts           ✅ done
    client.ts           ⏳ missing — Step 5
  update/
    server.ts           ✅ done
    client.ts           ⏳ missing — Step 5
  remove/
    server.ts           ✅ done
    client.ts           ⏳ missing — Step 5
  client.ts             ⏳ partial — Step 5 adds create/update/remove

packages/core/src/convex/
  index.ts              ⏳ pending Step 4 — depth missing from vexConvexApi.find/get/search FunctionReference args

packages/core/src/api/server.ts (queryApi / mutationApi)
                        ⏳ pending Step 4 — _config still _config; depth not in validators

packages/react/src/components/views/
  CollectionListView.tsx ⏳ pending Step 6

packages/next/src/
  NextAdminPage.tsx      ⏳ pending Step 6
```

---

## Code Effect Preview

### `GenericQueryServerParams` — D added to base; all three functions inherit for free

**Before:**

```ts
export interface GenericQueryServerParams<
  DataModel extends GenericDataModel = GenericDataModel,
  TSlug extends CollectionSlug = CollectionSlug,
  TPopulate extends PopulateShape<TSlug> = Record<string, never>,
> {
  ctx: GenericQueryCtx<DataModel>;
  populate?: TPopulate;
}
```

**After:**

```ts
export interface GenericQueryServerParams<
  DataModel extends GenericDataModel = GenericDataModel,
  TSlug extends CollectionSlug = CollectionSlug,
  TPopulate extends PopulateShape<TSlug> = Record<string, never>,
  D extends number = 0, // ← new
> {
  ctx: GenericQueryCtx<DataModel>;
  populate?: [D] extends [0] ? TPopulate : never; // ← conditional
  depth?: [TPopulate] extends [Record<string, never>] ? D : never; // ← new
  config?: [TPopulate] extends [Record<string, never>] ? VexConfig : never; // ← new
}
```

### `FindServerArgs` / `GetServerArgs` / `SearchServerArgs` — gain D, no Omit needed

**Before:**

```ts
export interface FindServerArgs<DataModel, TSlug, TPopulate>
  extends GenericQueryServerParams<DataModel, TSlug, TPopulate> {
  collection: TSlug; limit?: number; order?: ...; filter?: ...; withIndex?: ...;
}
```

**After:**

```ts
export interface FindServerArgs<DataModel, TSlug, TPopulate, D extends number = 0>
  extends GenericQueryServerParams<DataModel, TSlug, TPopulate, D> {  // D threaded through
  collection: TSlug; limit?: number; order?: ...; filter?: ...; withIndex?: ...;
  // populate / depth / config inherited — no re-declaration
}
```

### Mutual exclusion at the call site

```ts
// ✅ explicit populate
find({ ctx, collection: "posts", populate: { author: true } });
// ✅ depth only
find({ ctx, collection: "posts", depth: 1, config });
// ✅ neither — raw docs
find({ ctx, collection: "posts" });
// ❌ compile error — depth becomes `never` when TPopulate is non-empty
find({
  ctx,
  collection: "posts",
  populate: { author: true },
  depth: 1,
  config,
});
```

### `queryApi` — `_config` promoted, `depth` wired to handlers

**Before:**

```ts
export function queryApi<DataModel, Visibility>(_config: VexConfig, query: ...) {
  return {
    find: query({
      args: { collection: v.string(), populate: v.optional(v.any()), limit: v.optional(v.number()) },
      handler: (ctx, args) => find({ ctx, collection: args.collection, populate: args.populate, limit: args.limit }),
    }),
  };
}
```

**After:**

```ts
export function queryApi<DataModel, Visibility>(config: VexConfig, query: ...) {
  return {
    find: query({
      args: {
        collection: v.string(), populate: v.optional(v.any()),
        depth: v.optional(v.number()),  // ← new
        limit: v.optional(v.number()),
      },
      handler: (ctx, args) =>
        find({ ctx, collection: args.collection, populate: args.populate,
               depth: args.depth, config, limit: args.limit }),
    }),
  };
}
```

---

## Design Decisions

| #   | Decision (one line)                                                                                                                                                                                                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | No overloads — `const D extends number = 0` alongside `const TPopulate`; mutual exclusion via conditional constraints on `GenericQueryServerParams`.                                                                                                                                      |
| D2  | `DepthPopulate<TSlug, D>`, `DepthPopulated<TSlug, D>`, and `buildDepthPopulate` are already implemented (Steps 1–2 done).                                                                                                                                                                 |
| D3  | `D` and the mutual-exclusion constraints live on `GenericQueryServerParams` — `find`, `get`, and `search` all inherit without repeating.                                                                                                                                                  |
| D4  | `populate` becomes `never` when `D ≠ 0`; `depth`/`config` become `never` when `TPopulate` is non-empty. Passing both is a compile error.                                                                                                                                                  |
| D5  | `_config` in `queryApi` and `mutationApi` (in `api/server.ts`) is promoted to `config` — this is the use it was reserved for.                                                                                                                                                             |
| D6  | `depth` is added to `GenericQueryClientParams` alongside `populate` — both are data-shaping concerns. `filter`/`order`/`withIndex` stay server-only (Convex query-chain ops). On the client side `depth` is a plain `number` passthrough; no literal `D` generic, no return type narrowing. |
| D7  | `vexConvexApi.find`/`get`/`search` in `convex/index.ts` gain `depth?: number` in their `FunctionReference` args — needed so the `convexQuery` calls in the client functions compile after adding `depth: args.depth`.                                                                       |
| D8  | Mutation client files re-export the `vexConvexApi.*` references with typed `ClientArgs` interfaces. `@convex-dev/react-query` v0.1.0 exports only `useConvexMutation` (a hook), not a `convexMutation` factory, so mutation client files cannot mirror the `convexQuery` options pattern. |
| D9  | `depth: 0` (the `D` default) is identical to omitting `depth` — raw docs returned.                                                                                                                                                                                                        |
| D10 | `depth` is NOT documented in `apps/docs` or any public API surface.                                                                                                                                                                                                                       |
| D11 | `populate` always wins at runtime: `args.populate ?? (depth > 0 && config ? buildDepthPopulate(...) : undefined)`.                                                                                                                                                                        |
| D12 | `get` resolves the collection slug for `buildDepthPopulate` from `id.__tableName` — the Convex `GenericId` type brands itself with the table name; no explicit `collection` arg needed.                                                                                                   |

---

## Out of Scope

- Type narrowing for `depth` through the Convex network boundary (client-side)
- Public documentation of `depth`
- `depth > 3` type-level support (runtime works; types fall back to `VexDocument[]`)
- `convexMutation` factory (not available in `@convex-dev/react-query` v0.1.0)

---

## Target Directory Structure

```
packages/core/src/api/
  types.ts              ⏳ MODIFY (Step 3) — add D to GenericQueryServerParams; (Step 4) add depth to GenericQueryClientParams
  find/
    server.ts           ⏳ MODIFY (Step 3) — D generic + FindReturn<TSlug, TPopulate, D> + effectivePopulate
    client.ts           ⏳ MODIFY (Step 4) — depth: args.depth passthrough
  get/
    server.ts           ⏳ MODIFY (Step 3) — D generic + GetReturnItem<TSlug, TPopulate, D> + effectivePopulate
    client.ts           ⏳ MODIFY (Step 4) — depth: args.depth passthrough
  search/
    server.ts           ⏳ MODIFY (Step 3) — D generic + SearchReturnItem + effectivePopulate
    client.ts           ⏳ MODIFY (Step 4) — depth: args.depth passthrough
  create/
    client.ts           ⏳ NEW
  update/
    client.ts           ⏳ NEW
  remove/
    client.ts           ⏳ NEW
  client.ts             ⏳ MODIFY — add create/update/remove exports
  server.ts             ⏳ MODIFY — _config → config; depth in find/get/search validators + handlers

packages/core/src/convex/
  index.ts              ⏳ MODIFY — depth?: number in vexConvexApi.find/get/search FunctionReference args

packages/react/src/components/views/
  CollectionListView.tsx ⏳ MODIFY (Step 6) — depth: 1

packages/next/src/
  NextAdminPage.tsx      ✅ no change — server prefetch must NOT use depth (hydration mismatch)

packages/react/src/components/fields/relationship/
  Cell.tsx               ⏳ MODIFY (Step 7) — render populated docs from row.original[fieldKey]
```

---

## Implementation Order

1. `[dev]` **Step 3** — Add `D` to `GenericQueryServerParams` in `types.ts`; update `find/server.ts`, `get/server.ts`, `search/server.ts`
2. `[dev]` **Step 4** — Add `depth` to `GenericQueryClientParams`; `_config → config` in `api/server.ts`; add `depth` to validators + handlers; add `depth` to `vexConvexApi.find/get/search` in `convex/index.ts`; pass `depth: args.depth` through in all three client functions
3. `[dev]` **Step 5** — Mutation client files; update `client.ts` barrel
4. `[dev]` **Step 6** — `CollectionListView.tsx` only; `NextAdminPage.tsx` server prefetch stays without depth
5. `[dev]` **Step 7** — `RelationshipFieldCell` — render populated docs from `row.original[fieldKey]`

---

## Step 3 — D generic on `GenericQueryServerParams` + server functions [dev]

### Files to modify

- [ ] `packages/core/src/api/types.ts` — add `D extends number = 0` + `VexConfig` import to `GenericQueryServerParams`
- [ ] `packages/core/src/api/find/server.ts` — D generic, updated return type, `effectivePopulate`
- [ ] `packages/core/src/api/get/server.ts` — same
- [ ] `packages/core/src/api/search/server.ts` — same

---

### `packages/core/src/api/types.ts` — `GenericQueryServerParams` change

Add `import type { VexConfig } from "../config";` to the imports at the top.

Replace `GenericQueryServerParams` with:

```ts
/**
 * Base shape for server-side args of a `vex.*` query function.
 *
 * Carries `ctx`, `populate`, `depth`, and `config`. `populate` and `depth`
 * are mutually exclusive — TypeScript enforces this via conditional constraints:
 * `populate` becomes `never` when `D ≠ 0`; `depth` and `config` become `never`
 * when `TPopulate` is non-empty. Passing both is a compile error at the call site.
 *
 * All three query functions (`find`, `get`, `search`) extend this base and
 * inherit these constraints without re-declaring them.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TSlug - The collection slug.
 * @typeParam TPopulate - The populate object.
 * @typeParam D - Depth literal (0 = no depth, default). Captured as a literal
 *   via `const D extends number = 0` on the implementing function.
 */
export interface GenericQueryServerParams<
  DataModel extends GenericDataModel = GenericDataModel,
  TSlug extends CollectionSlug = CollectionSlug,
  TPopulate extends PopulateShape<TSlug> = Record<string, never>,
  D extends number = 0,
> {
  /** Discriminator: server args MUST supply a Convex query context. */
  ctx: GenericQueryCtx<DataModel>;
  /**
   * Recursive populate object, type-narrowed against `RelationshipKeysOf<TSlug>`.
   * Mutually exclusive with `depth` — becomes `never` when `D ≠ 0`.
   */
  populate?: [D] extends [0] ? TPopulate : never;
  /**
   * @internal Auto-populate all relationship fields to this many levels.
   * Becomes `never` when `TPopulate` is non-empty. Use `populate` for
   * consumer-facing code; this is an internal escape hatch for `CollectionListView`.
   */
  depth?: [TPopulate] extends [Record<string, never>] ? D : never;
  /**
   * @internal The resolved `VexConfig`. Required alongside `depth`; passed
   * from the `queryApi` factory closure so the Convex handler has schema info.
   */
  config?: [TPopulate] extends [Record<string, never>] ? VexConfig : never;
}
```

### Run typecheck

```bash
pnpm --filter @vexcms/core typecheck
```

(Expected: existing uses of `GenericQueryServerParams` still compile because `D` defaults to `0`.)

---

### `packages/core/src/api/find/server.ts`

Full file. All existing query-chain logic is unchanged; only the type signatures and the final populate dispatch are updated.

````ts
import type {
  ExpressionOrValue,
  FilterBuilder,
  GenericDataModel,
  GenericTableInfo,
  IndexNames,
  IndexRange,
  IndexRangeBuilder,
  NamedIndex,
  NamedTableInfo,
  TableNamesInDataModel,
} from "convex/server";

import type { CollectionSlug, DocumentBySlug } from "../../types/generated";
import { buildDepthPopulate } from "../depth";
import { populateDocs } from "../populate";
import type {
  DepthPopulated,
  GenericQueryServerParams,
  Populated,
  PopulateShape,
  Prettify,
} from "../types";

/**
 * Server-side args for `find`. Extends {@link GenericQueryServerParams}
 * to inherit `ctx`, `populate`, `depth`, and `config` (with their mutual-exclusion
 * constraints). All query-chain options map to `ctx.db.query()` equivalents
 * applied in order: `withIndex` → `order` → `filter` → `take`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = no depth, default).
 */
export interface FindServerArgs<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
  D extends number = 0,
> extends GenericQueryServerParams<DataModel, TSlug, TPopulate, D> {
  /** The collection to query — must match a registered collection slug. */
  collection: TSlug;

  /**
   * Maximum number of documents to return. Defaults to 100.
   * Applied as the terminal `.take(n)` on the Convex query.
   */
  limit?: number;

  /**
   * Result ordering. Equivalent to `.order("asc" | "desc")` on the Convex
   * query. Defaults to `"asc"` (insertion order).
   */
  order?: "asc" | "desc";

  /**
   * Filter predicate applied after index narrowing. Equivalent to
   * `.filter(q => q.eq(q.field("published"), true))` on the Convex query.
   *
   * Prefer `withIndex` for performance — `filter` scans every document
   * in the range and is O(n). Use `filter` for secondary conditions that
   * can't be expressed as index equality ranges.
   *
   * @example
   * ```ts
   * find({ ctx, collection: "posts", filter: q => q.eq(q.field("published"), true) })
   */
  filter?: (
    q: FilterBuilder<
      NamedTableInfo<
        DataModel,
        TSlug extends TableNamesInDataModel<DataModel> ? TSlug : never
      >
    >,
  ) => ExpressionOrValue<boolean>;

  /**
   * Index to use for the query, with an optional equality/range constraint.
   * Equivalent to `.withIndex(name, range?)` on the Convex query.
   *
   * Using an index is strongly preferred over `filter` for performance.
   *
   * @example
   * ```ts
   * find({ ctx, collection: "posts", withIndex: { name: "by_slug", range: q => q.eq("slug", "hello") } })
   * find({ ctx, collection: "posts", withIndex: { name: "by_score", range: q => q.gte("score", 50) } })
   * find({ ctx, collection: "posts", withIndex: { name: "by_publishedAt" } })
   */
  withIndex?: TSlug extends TableNamesInDataModel<DataModel>
    ? {
        name: IndexNames<NamedTableInfo<DataModel, TSlug>>;
        range?: (
          q: IndexRangeBuilder<
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any,
            NamedIndex<
              NamedTableInfo<DataModel, TSlug>,
              IndexNames<NamedTableInfo<DataModel, TSlug>>
            >
          >,
        ) => IndexRange;
      }
    : never;
}

/**
 * Resolves the return element type of `find`:
 *
 * - No populate + `D = 0` → `DocumentBySlug[TSlug]` (raw doc).
 * - No populate + `D > 0` → `DepthPopulated<TSlug, D>` (all relationships auto-populated).
 * - With populate → `Prettify<Populated<TSlug, TPopulate>>` (explicit fields populated).
 */
type FindReturnItem<
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
  D extends number,
> = [TPopulate] extends [Record<string, never>]
  ? [D] extends [0]
    ? TSlug extends keyof DocumentBySlug
      ? DocumentBySlug[TSlug]
      : never
    : DepthPopulated<TSlug, D>
  : TSlug extends keyof DocumentBySlug
    ? Prettify<Populated<TSlug, TPopulate>>
    : never;

type FindReturn<
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
  D extends number,
> = FindReturnItem<TSlug, TPopulate, D>[];

/**
 * Lists documents in a VexCMS collection with optional filtering, ordering,
 * index scans, and relationship population. Server-side only.
 *
 * Pass `populate` to explicitly name the relationship fields to resolve
 * (documented, recommended). Pass `depth` (with `config`) to automatically
 * populate all relationship fields to N levels — internal use only.
 * The two options are mutually exclusive; TypeScript enforces this at the call site.
 *
 * Import from `@vexcms/core/server`. For the client-side (tanstack-query)
 * version, import `find` from `@vexcms/core/client`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TSlug - Collection slug; compile-error if not registered.
 * @typeParam TPopulate - Populate object, narrowed against `RelationshipKeysOf<TSlug>`.
 * @typeParam D - Depth literal (0 = none).
 * @param args - Query args. All fields except `ctx` and `collection` are optional.
 * @returns Promise resolving to the (optionally populated) documents array.
 * @example No options — first 100 posts in insertion order
 * ```ts
 * const posts = await find({ ctx, collection: "posts" });
 * @example Filter + limit
 * ```ts
 * const published = await find({
 *   ctx,
 *   collection: "posts",
 *   filter: q => q.eq(q.field("published"), true),
 *   limit: 20,
 * });
 * @example Index scan + order + populate
 * ```ts
 * const recent = await find({
 *   ctx,
 *   collection: "posts",
 *   withIndex: { name: "by_publishedAt" },
 *   order: "desc",
 *   populate: { author: true },
 *   limit: 10,
 * });
 */
export async function find<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: FindServerArgs<DataModel, TSlug, TPopulate, D>,
): Promise<FindReturn<TSlug, TPopulate, D>> {
  const tableName = args.collection as TableNamesInDataModel<DataModel>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = args.ctx.db.query(tableName);

  // 1. withIndex — narrows the scan (most efficient).
  if (args.withIndex) {
    q = args.withIndex.range
      ? q.withIndex(args.withIndex.name, args.withIndex.range)
      : q.withIndex(args.withIndex.name);
  }
  // 2. order — applied after index selection.
  if (args.order) q = q.order(args.order);
  // 3. filter — secondary predicate, full range scan.
  if (args.filter) q = q.filter(args.filter);
  // 4. take — terminal.
  const docs: GenericTableInfo[] = await q.take(args.limit ?? 100);

  // Explicit populate takes precedence over depth (D11).
  const effectivePopulate =
    args.populate ??
    (args.depth !== undefined && args.depth > 0 && args.config
      ? buildDepthPopulate(args.config, args.collection, args.depth)
      : undefined);

  if (!effectivePopulate || Object.keys(effectivePopulate).length === 0) {
    return docs as unknown as FindReturn<TSlug, TPopulate, D>;
  }
  return populateDocs(
    args.ctx,
    docs as ReadonlyArray<Record<string, unknown>>,
    effectivePopulate,
  ) as unknown as FindReturn<TSlug, TPopulate, D>;
}
````

---

### `packages/core/src/api/get/server.ts`

````ts
import type { GenericDataModel } from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug, DocumentBySlug } from "../../types/generated";
import { buildDepthPopulate } from "../depth";
import { populateDocs } from "../populate";
import type {
  DepthPopulated,
  GenericQueryServerParams,
  Populated,
  PopulateShape,
  Prettify,
} from "../types";

/**
 * Server-side args for `get`.
 *
 * Inherits `ctx`, `populate`, `depth`, and `config` (with mutual-exclusion
 * constraints) from {@link GenericQueryServerParams}.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = no depth, default).
 */
export interface GetServerArgs<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
  D extends number = 0,
> extends GenericQueryServerParams<DataModel, TSlug, TPopulate, D> {
  /** The document ID to fetch. */
  id: GenericId<TSlug>;
}

/**
 * Resolves the return type of `get`:
 *
 * - No populate + `D = 0` → `DocumentBySlug[TSlug] | null`.
 * - No populate + `D > 0` → `DepthPopulated<TSlug, D> | null`.
 * - With populate → `Prettify<Populated<TSlug, TPopulate>> | null`.
 */
type GetReturnItem<
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
  D extends number,
> = [TPopulate] extends [Record<string, never>]
  ? [D] extends [0]
    ? TSlug extends keyof DocumentBySlug
      ? DocumentBySlug[TSlug] | null
      : never
    : DepthPopulated<TSlug, D> | null
  : TSlug extends keyof DocumentBySlug
    ? Prettify<Populated<TSlug, TPopulate>> | null
    : never;

/**
 * Fetches a single document by its `Id<TSlug>`. Server-side only.
 *
 * Pass `populate` to explicitly name the relationship fields to resolve
 * (documented, recommended). Pass `depth` (with `config`) to automatically
 * populate all relationship fields to N levels — internal use only.
 *
 * Import from `@vexcms/core/server`. For the client-side version, import
 * `get` from `@vexcms/core/client`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TSlug - Collection slug, recovered from the `Id` brand.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = none).
 * @param args - `{ ctx, id, populate? }` or `{ ctx, id, depth, config }`.
 * @returns Promise resolving to the doc or `null` if not found.
 * @example
 * ```ts
 * import { get } from "@vexcms/core/server";
 *
 * export const post = query({
 *   args: { id: v.id("posts") },
 *   handler: (ctx, args) => get({ ctx, id: args.id, populate: { author: true } }),
 * });
 */
export async function get<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: GetServerArgs<DataModel, TSlug, TPopulate, D>,
): Promise<GetReturnItem<TSlug, TPopulate, D>> {
  const doc = await args.ctx.db.get(args.id);

  // Resolve slug for buildDepthPopulate from the Id brand (D12).
  const effectivePopulate =
    args.populate ??
    (args.depth !== undefined && args.depth > 0 && args.config
      ? buildDepthPopulate(
          args.config,
          // GenericId is branded with __tableName — cast is safe here.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (args.id as any).__tableName as string,
          args.depth,
        )
      : undefined);

  if (!effectivePopulate || !doc)
    return doc as unknown as GetReturnItem<TSlug, TPopulate, D>;

  const [populated] = await populateDocs(args.ctx, [doc], effectivePopulate);
  return (populated ?? null) as unknown as GetReturnItem<TSlug, TPopulate, D>;
}
````

---

### `packages/core/src/api/search/server.ts`

````ts
import type { GenericDataModel } from "convex/server";

import type { CollectionSlug, DocumentBySlug } from "../../types/generated";
import { buildDepthPopulate } from "../depth";
import { populateDocs } from "../populate";
import type {
  DepthPopulated,
  GenericQueryServerParams,
  Populated,
  PopulateShape,
  Prettify,
} from "../types";

/**
 * Server-side args for `search`.
 *
 * Inherits `ctx`, `populate`, `depth`, and `config` (with mutual-exclusion
 * constraints) from {@link GenericQueryServerParams}.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = no depth, default).
 */
export interface SearchServerArgs<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
  D extends number = 0,
> extends GenericQueryServerParams<DataModel, TSlug, TPopulate, D> {
  /** The collection to search — must match a registered collection slug. */
  collection: TSlug;
  /** The search text. Pass `""` to list recent documents (falls back to `.take()`). */
  query: string;
  /** The `.searchIndex()` name declared in the Convex schema (e.g. `"search_name"`). */
  searchIndexName: string;
  /** The field the search index is built on. Must match `searchField` in the index declaration. */
  searchField: string;
  /** Maximum number of results. Defaults to 20. */
  limit?: number;
}

/**
 * Resolves the return element type of `search`:
 *
 * - No populate + `D = 0` → `DocumentBySlug[TSlug]`.
 * - No populate + `D > 0` → `DepthPopulated<TSlug, D>`.
 * - With populate → `Prettify<Populated<TSlug, TPopulate>>`.
 */
type SearchReturnItem<
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
  D extends number,
> = [TPopulate] extends [Record<string, never>]
  ? [D] extends [0]
    ? TSlug extends keyof DocumentBySlug
      ? DocumentBySlug[TSlug]
      : never
    : DepthPopulated<TSlug, D>
  : TSlug extends keyof DocumentBySlug
    ? Prettify<Populated<TSlug, TPopulate>>
    : never;

/**
 * Text search via a Convex search index. Server-side only.
 * Empty `query` string falls back to `.take()` (returns recent docs).
 *
 * Pass `populate` to explicitly name the relationship fields to resolve
 * (documented, recommended). Pass `depth` (with `config`) to automatically
 * populate all relationship fields to N levels — internal use only.
 *
 * Import from `@vexcms/core/server`. For the client-side version, import
 * `search` from `@vexcms/core/client`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = none).
 * @param args - `{ ctx, collection, query, searchIndexName, searchField, limit?, populate? }`.
 * @returns Promise resolving to matching docs.
 * @example
 * ```ts
 * import { search } from "@vexcms/core/server";
 *
 * export const authorSearch = query({
 *   args: { q: v.string() },
 *   handler: (ctx, args) =>
 *     search({ ctx, collection: "authors", query: args.q,
 *               searchIndexName: "search_name", searchField: "name",
 *               populate: { team: true } }),
 * });
 * ```
 */
export async function search<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: SearchServerArgs<DataModel, TSlug, TPopulate, D>,
): Promise<SearchReturnItem<TSlug, TPopulate, D>[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableName = args.collection as any;
  const limit = args.limit ?? 20;

  let docs: Record<string, unknown>[];
  if (!args.query) {
    docs = await args.ctx.db.query(tableName).take(limit);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    docs = await (args.ctx.db.query(tableName) as any)
      .withSearchIndex(args.searchIndexName, (q: any) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        (q as any).search(args.searchField, args.query),
      )
      .take(limit);
  }

  const effectivePopulate =
    args.populate ??
    (args.depth !== undefined && args.depth > 0 && args.config
      ? buildDepthPopulate(args.config, args.collection, args.depth)
      : undefined);

  if (!effectivePopulate || Object.keys(effectivePopulate).length === 0) {
    return docs as unknown as SearchReturnItem<TSlug, TPopulate, D>[];
  }
  return populateDocs(
    args.ctx,
    docs as ReadonlyArray<Record<string, unknown>>,
    effectivePopulate,
  ) as unknown as SearchReturnItem<TSlug, TPopulate, D>[];
}
````

### Run typecheck + tests

```bash
pnpm --filter @vexcms/core typecheck
pnpm --filter @vexcms/core test
```

---

## Step 4 — Wire depth through `queryApi`, `vexConvexApi`, and client functions [dev]

### Files to modify

- [ ] `packages/core/src/api/types.ts` — add `depth?: number` to `GenericQueryClientParams`
- [ ] `packages/core/src/api/find/client.ts` — pass `depth: args.depth` to `convexQuery`
- [ ] `packages/core/src/api/get/client.ts` — pass `depth: args.depth` to `convexQuery`
- [ ] `packages/core/src/api/search/client.ts` — pass `depth: args.depth` to `convexQuery`
- [ ] `packages/core/src/api/server.ts` — `_config → config`; add `depth: v.optional(v.number())` to find/get/search validators; pass `config` + `depth` to handlers
- [ ] `packages/core/src/convex/index.ts` — add `depth?: number` to `vexConvexApi.find`, `get`, `search` FunctionReference args

---

### `packages/core/src/api/server.ts` — `queryApi` changes

Rename `_config` → `config` everywhere in both `queryApi` and `mutationApi`. For `queryApi`, add `depth: v.optional(v.number())` to `find`, `get`, and `search` validators, and pass `depth` and `config` to their handlers.

`find` handler:

```ts
find: query({
  args: {
    collection: v.string(),
    populate: v.optional(v.any()),
    depth: v.optional(v.number()),   // ← new
    limit: v.optional(v.number()),
  },
  handler: (ctx, args) =>
    find({
      ctx,
      collection: args.collection as CollectionSlug,
      populate: args.populate,
      depth: args.depth,             // ← new
      config,                        // ← new
      limit: args.limit,
    }),
}) as RegisteredQuery<Visibility, never, never>,
```

`get` handler:

```ts
get: query({
  args: {
    id: v.string(),
    populate: v.optional(v.any()),
    depth: v.optional(v.number()),   // ← new
  },
  handler: (ctx, args) =>
    get({
      ctx,
      id: args.id as GenericId<CollectionSlug>,
      populate: args.populate,
      depth: args.depth,             // ← new
      config,                        // ← new
    }),
}) as RegisteredQuery<Visibility, never, never>,
```

`search` handler:

```ts
search: query({
  args: {
    collection: v.string(),
    searchIndexName: v.string(),
    searchField: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
    populate: v.optional(v.any()),
    depth: v.optional(v.number()),   // ← new
  },
  handler: (ctx, args) =>
    search({
      ctx,
      collection: args.collection as CollectionSlug,
      query: args.query,
      searchIndexName: args.searchIndexName,
      searchField: args.searchField,
      limit: args.limit,
      populate: args.populate,
      depth: args.depth,             // ← new
      config,                        // ← new
    }),
}) as RegisteredQuery<Visibility, never, never>,
```

`mutationApi` — rename `_config → config` only, no behaviour change.

---

### `packages/core/src/api/types.ts` — `GenericQueryClientParams` change

Add `depth?: number` alongside the existing `populate` field:

```ts
export interface GenericQueryClientParams<
  TSlug extends CollectionSlug = CollectionSlug,
  TPopulate extends PopulateShape<TSlug> = Record<string, never>,
> {
  /** Discriminator: client args MUST NOT supply `ctx`. */
  ctx?: never;
  /** Recursive populate object, type-narrowed against `RelationshipKeysOf<TSlug>`. */
  populate?: TPopulate;
  /**
   * Auto-populate all relationship fields to this many levels.
   * Plain `number` passthrough — no return type narrowing on the client side
   * (the Convex network boundary always returns `VexDocument[]`).
   * Use `populate` for documented consumer code; `depth` is internal.
   */
  depth?: number;
}
```

### Client function depth passthrough

Each of `find/client.ts`, `get/client.ts`, and `search/client.ts` inherits `depth` from `GenericQueryClientParams`. The only change per file is adding `depth: args.depth` to the `convexQuery` call:

```ts
// find/client.ts
return convexQuery(vexConvexApi.find, {
  collection: args.collection, populate: args.populate,
  depth: args.depth, limit: args.limit,  // depth ← new
});

// get/client.ts
return convexQuery(vexConvexApi.get, {
  id: args.id, populate: args.populate,
  depth: args.depth,  // depth ← new
});

// search/client.ts
return convexQuery(vexConvexApi.search, {
  collection: args.collection, searchIndexName: args.searchIndexName,
  searchField: args.searchField, query: args.query, limit: args.limit,
  populate: args.populate, depth: args.depth,  // depth ← new
});
```

> `find.queryKey` does not include `depth` — cache invalidation is per-collection, independent of depth.

### `packages/core/src/convex/index.ts` — add `depth` to `vexConvexApi` `find`, `get`, `search`

Add `depth?: number` to the `FunctionReference` args for `find`, `get`, and `search`:

```ts
find: anyApi.vex.find as FunctionReference<
  "query",
  "public",
  {
    collection: CollectionSlug;
    populate?: unknown;
    depth?: number;   // ← new
    limit?: number;
  },
  VexDocument[]
>,

get: anyApi.vex.get as FunctionReference<
  "query",
  "public",
  { id: string; populate?: unknown; depth?: number },  // depth ← new
  VexDocument | null
>,

search: anyApi.vex.search as FunctionReference<
  "query",
  "public",
  {
    collection: string; searchIndexName: string; searchField: string;
    query: string; limit?: number; populate?: unknown;
    depth?: number;  // ← new
  },
  VexDocument[]
>,
```

---

### Run typecheck

```bash
pnpm --filter @vexcms/core typecheck
```

---

## Step 5 — Mutation client files [dev]

`@convex-dev/react-query` v0.1.0 exports only `useConvexMutation` (a hook, not a factory), so mutation client files cannot mirror the `convexQuery` options pattern. Instead they re-export the `vexConvexApi.*` references alongside typed `ClientArgs` interfaces. Consumers use `useConvexMutation(create)` the same way they currently use `useConvexMutation(vexConvexApi.create)` — just now importable from `@vexcms/core/client`.

### Files to create / modify

- [ ] `packages/core/src/api/create/client.ts` (NEW)
- [ ] `packages/core/src/api/update/client.ts` (NEW)
- [ ] `packages/core/src/api/remove/client.ts` (NEW)
- [ ] `packages/core/src/api/client.ts` — add three new exports

### `packages/core/src/api/create/client.ts` (NEW)

````ts
import { vexConvexApi } from "../../convex";
import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationClientParams } from "../types";

/**
 * Client-side args for `create`.
 *
 * @example
 * ```tsx
 * import { create } from "@vexcms/core/client";
 * import { useConvexMutation } from "@convex-dev/react-query";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const { mutateAsync } = useMutation({ mutationFn: useConvexMutation(create) });
 * await mutateAsync({ collection: "posts", data: { title: "Hello" } });
 */
export interface CreateClientArgs extends GenericMutationClientParams {
  /** The collection slug to insert into. */
  collection: CollectionSlug;
  /** Field values for the new document. */
  data: Record<string, unknown>;
}

/**
 * Typed Convex mutation reference for creating a document in a VexCMS collection.
 * Use with `useConvexMutation(create)` as the `mutationFn` for tanstack-query's `useMutation`.
 *
 * @see {@link CreateClientArgs} for the typed args shape.
 */
export const create = vexConvexApi.create;
````

### `packages/core/src/api/update/client.ts` (NEW)

````ts
import type { GenericId } from "convex/values";

import { vexConvexApi } from "../../convex";
import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationClientParams } from "../types";

/**
 * Client-side args for `update`.
 *
 * @example
 * ```tsx
 * import { update } from "@vexcms/core/client";
 * import { useConvexMutation } from "@convex-dev/react-query";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const { mutateAsync } = useMutation({ mutationFn: useConvexMutation(update) });
 * await mutateAsync({ id: postId, data: { title: "Updated" } });
 */
export interface UpdateClientArgs extends GenericMutationClientParams {
  /** The document ID to update. */
  id: GenericId<CollectionSlug>;
  /** Partial field values to merge into the document. */
  data: Record<string, unknown>;
}

/**
 * Typed Convex mutation reference for updating a document in a VexCMS collection.
 * Use with `useConvexMutation(update)` as the `mutationFn` for tanstack-query's `useMutation`.
 *
 * @see {@link UpdateClientArgs} for the typed args shape.
 */
export const update = vexConvexApi.update;
````

### `packages/core/src/api/remove/client.ts` (NEW)

````ts
import type { GenericId } from "convex/values";

import { vexConvexApi } from "../../convex";
import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationClientParams } from "../types";

/**
 * Client-side args for `remove`.
 *
 * @example
 * ```tsx
 * import { remove } from "@vexcms/core/client";
 * import { useConvexMutation } from "@convex-dev/react-query";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const { mutateAsync } = useMutation({ mutationFn: useConvexMutation(remove) });
 * await mutateAsync({ id: postId });
 */
export interface RemoveClientArgs extends GenericMutationClientParams {
  /** The document ID to delete. */
  id: GenericId<CollectionSlug>;
}

/**
 * Typed Convex mutation reference for removing a document from a VexCMS collection.
 * Use with `useConvexMutation(remove)` as the `mutationFn` for tanstack-query's `useMutation`.
 *
 * @see {@link RemoveClientArgs} for the typed args shape.
 */
export const remove = vexConvexApi.remove;
````

### `packages/core/src/api/client.ts` — append

```ts
export { create } from "./create/client";
export type { CreateClientArgs } from "./create/client";

export { update } from "./update/client";
export type { UpdateClientArgs } from "./update/client";

export { remove } from "./remove/client";
export type { RemoveClientArgs } from "./remove/client";
```

### Run typecheck

```bash
pnpm --filter @vexcms/core typecheck
```

---

## Step 6 — `depth: 1` in `CollectionListView` [dev]

### Files to modify

- [ ] `packages/react/src/components/views/CollectionListView.tsx`
- `packages/next/src/NextAdminPage.tsx` — **no change** (see `NextAdminPage.tsx` section below)

### `CollectionListView.tsx`

`depth` is on `FindClientArgs` (inherited from `GenericQueryClientParams`), so the existing `find` factory is kept:

```ts
// Before
find({ collection: props.collection.slug, limit: 100 })

// After
find({ collection: props.collection.slug, limit: 100, depth: 1 })
```

The `useQuery` return type stays `VexDocument[]`. Cell rendering dispatches through `resolveRelationshipPreview` dynamically — populated sub-docs on `row.original` are accessed correctly at runtime regardless of the static type.

### `NextAdminPage.tsx`

`depth: 1` is **not** added to the `fetchQuery` call. Only the live Convex subscription in `CollectionListView` uses `depth: 1`.

**Why not the server prefetch?** `fetchQuery` returns populated `initialData`. But the `queryClient` is a module-level singleton — the Convex subscription fires and pushes live data into the TanStack Query cache before React finishes hydration. `useSyncExternalStore` (used by TanStack Query) reads the live cache snapshot during the hydration render, which is the un-populated subscription data, while the server rendered from the populated `initialData`. This produces a systematic hydration mismatch on every page load.

**The fix:** `fetchQuery` stays without `depth` so the server-rendered `initialData` matches the subscription’s initial un-populated state. The live Convex subscription with `depth: 1` then populates the cells client-side after hydration — near-instantly via Convex’s reactive model.

```ts
// No change needed — keep as-is, no depth: 1
const initialData = await fetchQuery(vexConvexApi.find, {
  collection: collectionSlug as CollectionSlug,
  limit: 100,
});
```

### Run typecheck

```bash
pnpm --filter @vexcms/core typecheck
pnpm --filter @vexcms/react typecheck
pnpm --filter @vexcms/next typecheck
```

---

## Step 7 — Relationship cell: render populated docs [dev]

Now that `depth: 1` is passed by `CollectionListView`, `row.original[fieldKey]` is `TDocument[]` (populated docs) instead of `string[]` (raw IDs). The cell needs to use the populated docs, look up the target collection config to get `labels.plural`, and implement the count-vs-preview logic.

This is the only file that changes. `columnDef.tsx`, `preview.tsx`, and `resolveRelationshipPreview` are all correct as-is.

### Files to modify
- [ ] `packages/react/src/components/fields/relationship/Cell.tsx`

### Logic

| `rawValue` state | `docs.length` | Render |
|---|---|---|
| `undefined` or empty array | 0 | `—` (em-dash, muted) |
| Populated docs | 1 | `resolveRelationshipPreview` with `doc = docs[0]`, `config = targetCollection` |
| Populated docs | > 1 | `"{count} {pluralLabel}"` where `pluralLabel = targetCollection.labels.plural` |
| Unpopulated (raw ID strings) | any | `"{count} item(s)"` fallback — depth wasn't used or collection not found |

**Detection:** `typeof rawValue[0] === "object" && rawValue[0] !== null && "_id" in rawValue[0]` distinguishes populated docs from raw ID strings.

**Target collection:** resolved from `useVexConfig()` by `fieldDef.collection.slug`. This also fixes the long-standing `targetCollection: undefined` passed to `resolveRelationshipPreview` — the target collection is now available and used for both the `useAsTitle` field on the default renderer and the field-level `admin.components.preview` override chain.

### `packages/react/src/components/fields/relationship/Cell.tsx` — full replacement

```tsx
"use client";

import type { CellComponentProps, RelationshipField, TDocument } from "@vexcms/core";
import { useVexConfig } from "../../../context/VexConfigContext";
import { resolveRelationshipPreview } from "./preview";

/**
 * Relationship field cell for the collection list-view data table.
 *
 * Reads `row.original[fieldKey]` which is either:
 * - `TDocument[]` — populated docs when the list query was run with `depth: 1`.
 * - `string[]` — raw Convex IDs when the query was not depth-populated (fallback).
 *
 * **Rendering rules:**
 * - 0 docs → em-dash placeholder.
 * - 1 doc → resolved preview component (`resolveRelationshipPreview` precedence:
 *   field-level override > target collection's preview > default). The default
 *   renders `doc[useAsTitle] ?? doc._id` as plain text.
 * - > 1 docs → `"{count} {pluralLabel}"` using `targetCollection.labels.plural`.
 * - Unpopulated IDs → `"{count} item(s)"` fallback.
 *
 * @param props - Standard cell component props.
 */
export function RelationshipFieldCell(
  props: CellComponentProps<RelationshipField>,
) {
  const { row, fieldDef, fieldKey } = props;
  const config = useVexConfig();

  const rawValue = row.original[fieldKey] as unknown[] | undefined;

  // Empty — no references stored.
  if (!rawValue || rawValue.length === 0) {
    return (
      <span className="text-[13px] text-muted-foreground-subtle">—</span>
    );
  }

  // Detect populated docs vs raw ID strings.
  const isPopulated =
    typeof rawValue[0] === "object" &&
    rawValue[0] !== null &&
    "_id" in (rawValue[0] as object);

  if (!isPopulated) {
    // Fallback: depth not used — show a raw count.
    return (
      <span className="text-[13px] text-muted-foreground">
        {rawValue.length} item{rawValue.length !== 1 ? "s" : ""}
      </span>
    );
  }

  const docs = rawValue as TDocument[];
  const targetCollection = config.collections.find(
    (c) => c.slug === fieldDef.collection.slug,
  );

  // Single doc (hasMany=false OR hasMany=true but only one stored): show preview.
  if (docs.length === 1) {
    const Preview = resolveRelationshipPreview({ fieldDef, targetCollection });
    return (
      <Preview
        doc={docs[0]}
        fieldKey={fieldKey}
        config={(targetCollection ?? props.collection) as never}
      />
    );
  }

  // Multiple docs: show count + plural label.
  const pluralLabel =
    targetCollection?.labels.plural ?? fieldDef.collection.slug;
  return (
    <span className="text-[13px] text-foreground">
      {docs.length} {pluralLabel}
    </span>
  );
}
```

### Run typecheck + open browser
```bash
pnpm --filter @vexcms/react typecheck
# then open http://localhost:3020/admin/<collection-slug>
# relationship cells should now show the related doc's title (or count)
```

---

## Verification (mandatory)

```bash
pnpm --filter @vexcms/core test              # all pass (depth.test.ts already green)
pnpm --filter @vexcms/core typecheck
pnpm --filter @vexcms/react typecheck
pnpm --filter @vexcms/next typecheck
```

---

## Success Criteria

- [ ] `find({ ctx, collection: "posts", depth: 1, config })` — literal `1` — return type is `DepthPopulated<"posts", 1>[]`
- [ ] `find({ ctx, collection: "posts", populate: { author: true }, depth: 1, config })` is a TypeScript error
- [ ] `find({ ctx, collection: "posts" })` returns `DocumentBySlug["posts"][]` — unchanged
- [ ] `find({ collection: "posts", depth: 1 })` (client factory) compiles; `depth` inherited from `GenericQueryClientParams`, passed through to `convexQuery`
- [ ] `import { create, update, remove, CreateClientArgs, UpdateClientArgs, RemoveClientArgs } from "@vexcms/core/client"` resolves
- [ ] `CollectionListView` on a collection with relationship fields shows populated sub-doc data in cells, not raw IDs
- [ ] A relationship cell with **1 related doc** renders the resolved preview (default: `doc[useAsTitle]` of the target doc)
- [ ] A relationship cell with **> 1 related docs** renders `"{count} {pluralLabel}"` (e.g. `"3 Authors"`)
- [ ] A relationship cell with **0 related docs** renders `—`
- [ ] A relationship cell on a list that was fetched **without depth** (raw IDs) renders `"{count} items"` fallback without crashing
- [ ] `pnpm --filter @vexcms/core test` passes

---

## References

- Spec 22 (`22-relationship-field.md`) — `RelationshipField`, `resolveRelationshipPreview`
- Spec 23 (`23-vex-api/spec.md`) — `populateDocs`, `PopulateShape`, `Populated`, `FindServerArgs`, `queryApi`
- `packages/core/src/api/types.ts` — `DepthPopulate`, `DepthPopulated`, `GenericQueryServerParams` (current state)
- `packages/core/src/api/depth.ts` — `buildDepthPopulate` (already implemented)
- `packages/core/src/api/find/server.ts` — current state (starting point for Step 3)
- `packages/core/src/api/server.ts` — `queryApi` + `mutationApi` (starting point for Step 4)
- `packages/core/src/convex/index.ts` — `vexConvexApi` (starting point for Step 4)
