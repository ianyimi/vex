import type {
  ExpressionOrValue,
  FilterBuilder,
  GenericDataModel,
  IndexNames,
  IndexRange,
  IndexRangeBuilder,
  NamedIndex,
  NamedTableInfo,
  TableNamesInDataModel,
  QueryInitializer,
} from "convex/server";

import type { CollectionSlug, DocumentBySlug } from "../../types/generated";
import { buildDepthPopulate } from "../depth";
import { populateDocs } from "../populate";
import type {
  DepthPopulated,
  GenericQueryServerParams,
  PaginationOptions,
  PaginationResult,
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
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = no depth, default).
 */
export interface FindServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number = 0,
> extends GenericQueryServerParams<DataModel, TCollectionSlug, TPopulate, D> {
  /** The collection to query — must match a registered collection slug. */
  collection: TCollectionSlug;

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
    q: FilterBuilder<
      NamedTableInfo<
        DataModel,
        TCollectionSlug extends TableNamesInDataModel<DataModel> ? TCollectionSlug : never
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
   * ```
   */
  withIndex?: TCollectionSlug extends TableNamesInDataModel<DataModel>
    ? {
        name: IndexNames<NamedTableInfo<DataModel, TCollectionSlug>>;
        range?: (
          q: IndexRangeBuilder<
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any,
            NamedIndex<
              NamedTableInfo<DataModel, TCollectionSlug>,
              IndexNames<NamedTableInfo<DataModel, TCollectionSlug>>
            >
          >,
        ) => IndexRange;
      }
    : never;

  /**
   * Pagination options. When provided, the function returns a `PaginationResult`
   * with `{ page, continueCursor, isDone }` instead of a plain array.
   *
   * Uses Convex's native `.paginate(opts)` API under the hood.
   */
  paginationOpts?: PaginationOptions;
}

/**
 * Resolves the return element type of `find`:
 *
 * - No populate + `D = 0` → `DocumentBySlug[TCollectionSlug]` (raw doc).
 * - No populate + `D > 0` → `DepthPopulated<TCollectionSlug, D>` (all relationships auto-populated).
 * - With populate → `Prettify<Populated<TCollectionSlug, TPopulate>>` (explicit fields populated).
 */
type FindReturnItem<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number,
> = [TPopulate] extends [Record<string, never>]
  ? [D] extends [0]
    ? TCollectionSlug extends keyof DocumentBySlug
      ? DocumentBySlug[TCollectionSlug]
      : never
    : DepthPopulated<TCollectionSlug, D>
  : TCollectionSlug extends keyof DocumentBySlug
    ? Prettify<Populated<TCollectionSlug, TPopulate>>
    : never;

type FindReturn<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number,
> = FindReturnItem<TCollectionSlug, TPopulate, D>[];

type FindReturnPaginated<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number,
> = PaginationResult<FindReturnItem<TCollectionSlug, TPopulate, D>>;

// Overload 1: WITHOUT paginationOpts → returns array (most common case)
export async function find<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: FindServerArgs<DataModel, TCollectionSlug, TPopulate, D> & {
    paginationOpts?: never;
  },
): Promise<FindReturn<TCollectionSlug, TPopulate, D>>;

// Overload 2: WITH paginationOpts → returns PaginationResult
export async function find<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: FindServerArgs<DataModel, TCollectionSlug, TPopulate, D> & {
    paginationOpts: PaginationOptions;
  },
): Promise<FindReturnPaginated<TCollectionSlug, TPopulate, D>>;

/**
 * Find documents in a collection with optional pagination and total count.
 *
 * When `includeTotalCount=true`, runs `.collect()` on the first page to count all
 * matching documents. Returns `null` if count exceeds 32k documents.
 *
 * @param args - Find arguments including filters, sort, pagination, and count options
 * @returns Array of documents or PaginationResult with optional totalCount
 *
 * @example
 * ```ts
 * // Without pagination
 * const docs = await find({ ctx, collection: "posts" });
 *
 * // With pagination
 * const result = await find({
 *   ctx,
 *   collection: "posts",
 *   paginationOpts: { numItems: 100, cursor: null },
 * });
 * // result: { page: [...], continueCursor: "...", isDone: false }
 *
 * // With pagination and count (first page only)
 * const result = await find({
 *   ctx,
 *   collection: "posts",
 *   paginationOpts: { numItems: 100, cursor: null },
 *   includeTotalCount: true,
 * });
 * // result: { page: [...], continueCursor: "...", isDone: false, totalCount: 1523 }
 * ```
 */
export async function find<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: FindServerArgs<DataModel, TCollectionSlug, TPopulate, D>,
): Promise<
  FindReturn<TCollectionSlug, TPopulate, D> | FindReturnPaginated<TCollectionSlug, TPopulate, D>
> {
  const findQuery = buildQuery<DataModel, TCollectionSlug, TPopulate, D>(args);

  // 4. paginate OR take
  let docs;
  let convexPaginationResult: Awaited<ReturnType<typeof findQuery.paginate>> | undefined;
  if (args.paginationOpts) {
    convexPaginationResult = await findQuery.paginate(args.paginationOpts);
    docs = convexPaginationResult.page;
  } else if (args.limit) {
    docs = await findQuery.take(args.limit);
  } else {
    docs = await findQuery.collect();
  }

  // Explicit populate takes precedence over depth (D11).
  const effectivePopulate =
    args.populate ??
    (args.depth !== undefined && args.depth > 0 && args.config
      ? buildDepthPopulate(args.config, args.collection, args.depth)
      : undefined);

  const finalDocs =
    !effectivePopulate || Object.keys(effectivePopulate).length === 0
      ? (docs as unknown as FindReturn<TCollectionSlug, TPopulate, D>)
      : ((await populateDocs(
          args.ctx,
          docs as ReadonlyArray<Record<string, unknown>>,
          effectivePopulate,
        )) as unknown as FindReturn<TCollectionSlug, TPopulate, D>);

  if (args.paginationOpts && convexPaginationResult) {
    if (args.paginationOpts.totalDocs && !args.paginationOpts.cursor) {
      try {
        if (convexPaginationResult.isDone) {
          return {
            ...convexPaginationResult,
            page: finalDocs,
            totalDocs: finalDocs.length,
          };
        } else {
          // Build same query (with filters) but collect all to count
          const countQuery = buildQuery(args); // Same filters as main query
          const totalDocs = await countQuery.collect();
          return {
            ...convexPaginationResult,
            page: finalDocs,
            totalDocs: totalDocs.length,
          };
        }
      } catch (error) {
        // .collect() failed (>32k docs or other limit)
        console.warn("Failed to collect all documents:", error);
        return {
          ...convexPaginationResult,
          page: finalDocs,
          totalDocs: null, // Signals "too large to count"
        };
      }
    }

    // Return Convex pagination result directly with populated docs
    return {
      ...convexPaginationResult,
      page: finalDocs,
    };
  }

  return finalDocs;
}

function buildQuery<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: FindServerArgs<DataModel, TCollectionSlug, TPopulate, D>,
): QueryInitializer<NamedTableInfo<DataModel, TCollectionSlug>> {
  const tableName = args.collection;
  let q = args.ctx.db.query(tableName);

  // 1. withIndex — narrows the scan (most efficient).
  if (args.withIndex) {
    // @ts-expect-error building query piece by piece from query args
    q = args.withIndex.range
      ? q.withIndex(args.withIndex.name, args.withIndex.range)
      : q.withIndex(args.withIndex.name);
  }
  // 2. order — applied after index selection.
  // @ts-expect-error building query piece by piece from query args
  if (args.order) q = q.order(args.order);
  // 3. filter — secondary predicate, full range scan.
  if (args.filter) q = q.filter(args.filter);

  return q;
}
