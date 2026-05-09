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

import type { CollectionSlug, DocumentBySlug } from "../types/generated";
import { populateDocs } from "./populate";
import type {
  GenericQueryServerParams,
  Populated,
  PopulateShape,
} from "./types";

/**
 * Server-side args for `find`. Extends {@link GenericQueryServerParams}
 * to inherit `ctx: GenericQueryCtx<DataModel>` and `populate?: TPopulate`.
 *
 * All query-chain options map directly to their Convex `ctx.db.query()` chain
 * equivalents and are applied in the order Convex requires:
 * `withIndex` → `order` → `filter` → `take`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 */
export interface FindServerArgs<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
> extends GenericQueryServerParams<DataModel, TSlug, TPopulate> {
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
   * ```
   */
  filter?: (
    q: FilterBuilder<NamedTableInfo<DataModel, TSlug extends TableNamesInDataModel<DataModel> ? TSlug : never>>,
  ) => ExpressionOrValue<boolean>;

  /**
   * Index to use for the query, with an optional equality/range constraint.
   * Equivalent to `.withIndex(name, range?)` on the Convex query.
   *
   * Using an index is strongly preferred over `filter` for performance — it
   * narrows the scan to a contiguous range in the index, not a full table scan.
   *
   * @example
   * ```ts
   * // Point lookup
   * find({ ctx, collection: "posts", withIndex: { name: "by_slug", range: q => q.eq("slug", "hello") } })
   *
   * // Range scan
   * find({ ctx, collection: "posts", withIndex: { name: "by_score", range: q => q.gte("score", 50) } })
   *
   * // Just use the index order with no constraint
   * find({ ctx, collection: "posts", withIndex: { name: "by_publishedAt" } })
   * ```
   */
  withIndex?: TSlug extends TableNamesInDataModel<DataModel>
    ? {
        name: IndexNames<NamedTableInfo<DataModel, TSlug>>;
        range?: (
          q: IndexRangeBuilder<
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any,
            NamedIndex<NamedTableInfo<DataModel, TSlug>, IndexNames<NamedTableInfo<DataModel, TSlug>>>
          >,
        ) => IndexRange;
      }
    : never;
}

/**
 * Forces TypeScript to eagerly evaluate a mapped/conditional type into a
 * concrete object shape rather than displaying the opaque alias. Without this,
 * hover would show `Populated<"posts", { parent: true }>` instead of the
 * expanded `{ _id: ...; parent: Post[]; ... }` form.
 */
type Prettify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Resolves the return element type of `find` based on whether populate is given:
 *
 * - No populate: returns `DocumentBySlug[TSlug]` — the concrete generated doc
 *   type. Relationship fields are their raw `Id<"slug">[]` types.
 * - With populate: returns `Prettify<Populated<TSlug, TPopulate>>` — TypeScript
 *   evaluates the mapped type eagerly so the IDE shows the expanded shape with
 *   populated relationship fields replaced (e.g. `parent: Post[]`).
 */
type FindReturnItem<
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
> = [TPopulate] extends [Record<string, never>]
  ? TSlug extends keyof DocumentBySlug
    ? DocumentBySlug[TSlug]
    : never
  : TSlug extends keyof DocumentBySlug
    ? Prettify<Populated<TSlug, TPopulate>>
    : never;

type FindReturn<
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
> = FindReturnItem<TSlug, TPopulate>[];

/**
 * Lists documents in a VexCMS collection with optional filtering, ordering,
 * index scans, and recursive population. Server-side only.
 *
 * All query-chain options are optional and compose in the standard Convex
 * order: `withIndex` → `order` → `filter` → `take`. Omitting all options
 * returns the first 100 documents in insertion order.
 *
 * Import from `@vexcms/core/server`. For the client-side (tanstack-query)
 * version, import `find` from `@vexcms/core/client`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TSlug - Collection slug; compile-error if not registered.
 * @typeParam TPopulate - Populate object, narrowed against `RelationshipKeysOf<TSlug>`.
 * @param args - Query args. All fields except `ctx` and `collection` are optional.
 * @returns Promise resolving to the (optionally populated) documents array.
 * @example No options — first 100 posts in insertion order
 * ```ts
 * const posts = await find({ ctx, collection: "posts" });
 * ```
 * @example Filter + limit
 * ```ts
 * const published = await find({
 *   ctx,
 *   collection: "posts",
 *   filter: q => q.eq(q.field("published"), true),
 *   limit: 20,
 * });
 * ```
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
 * ```
 */
export async function find<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TSlug> = Record<string, never>,
>(
  args: FindServerArgs<DataModel, TSlug, TPopulate>,
): Promise<FindReturn<TSlug, TPopulate>> {
  // Build the query in the order Convex requires.
  const tableName = args.collection as TableNamesInDataModel<DataModel>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = args.ctx.db.query(tableName);

  // 1. withIndex — narrows the scan to a specific index range (most efficient).
  if (args.withIndex) {
    q = args.withIndex.range
      ? q.withIndex(args.withIndex.name, args.withIndex.range)
      : q.withIndex(args.withIndex.name);
  }

  // 2. order — applied after index selection.
  if (args.order) {
    q = q.order(args.order);
  }

  // 3. filter — applied after ordering (secondary predicate, full range scan).
  if (args.filter) {
    q = q.filter(args.filter);
  }

  // 4. take — terminal, resolves the query.
  const docs: GenericTableInfo[] = await q.take(args.limit ?? 100);

  if (!args.populate) return docs as unknown as FindReturn<TSlug, TPopulate>;
  return populateDocs(args.ctx, docs as ReadonlyArray<Record<string, unknown>>, args.populate) as unknown as FindReturn<TSlug, TPopulate>;
}
