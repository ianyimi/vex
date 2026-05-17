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
 * @typeParam TCollectionSlug - Collection slug; compile-error if not registered.
 * @typeParam TPopulate - Populate object, narrowed against `RelationshipKeysOf<TCollectionSlug>`.
 * @typeParam D - Depth literal (0 = none).
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
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: FindServerArgs<DataModel, TCollectionSlug, TPopulate, D>,
): Promise<FindReturn<TCollectionSlug, TPopulate, D>> {
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
    return docs as unknown as FindReturn<TCollectionSlug, TPopulate, D>;
  }
  return populateDocs(
    args.ctx,
    docs as ReadonlyArray<Record<string, unknown>>,
    effectivePopulate,
  ) as unknown as FindReturn<TCollectionSlug, TPopulate, D>;
}
