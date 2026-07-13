import type { GenericDataModel, PaginationOptions, PaginationResult } from "convex/server";

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
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = no depth, default).
 */
export interface SearchServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number = 0,
> extends GenericQueryServerParams<DataModel, TCollectionSlug, TPopulate, D> {
  /** The collection to search — must match a registered collection slug. */
  collection: TCollectionSlug;
  /** The search text. Pass `""` to list recent documents (falls back to `.take()`). */
  query: string;
  /** The `.searchIndex()` name declared in the Convex schema (e.g. `"search_name"`). */
  searchIndexName: string;
  /** The field the search index is built on. Must match `searchField` in the index declaration. */
  searchField: string;
  /** Maximum number of results. Defaults to 20. */
  limit?: number;
  /**
   * Pagination options. When provided, the function returns a `PaginationResult`
   * with `{ page, continueCursor, isDone }` instead of a plain array.
   *
   * Uses Convex's native `.paginate(opts)` API under the hood.
   */
  paginationOpts?: PaginationOptions;
}

/**
 * Resolves the return element type of `search`:
 *
 * - No populate + `D = 0` → `DocumentBySlug[TCollectionSlug]`.
 * - No populate + `D > 0` → `DepthPopulated<TCollectionSlug, D>`.
 * - With populate → `Prettify<Populated<TCollectionSlug, TPopulate>>`.
 */
type SearchReturnItem<
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

type SearchReturnPaginated<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number,
> = PaginationResult<SearchReturnItem<TCollectionSlug, TPopulate, D>>;

// Overload 1: WITHOUT paginationOpts → returns array (most common case)
export async function search<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: SearchServerArgs<DataModel, TCollectionSlug, TPopulate, D> & {
    paginationOpts?: never;
  },
): Promise<SearchReturnItem<TCollectionSlug, TPopulate, D>[]>;

// Overload 2: WITH paginationOpts → returns PaginationResult
export async function search<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: SearchServerArgs<DataModel, TCollectionSlug, TPopulate, D> & {
    paginationOpts: PaginationOptions;
  },
): Promise<SearchReturnPaginated<TCollectionSlug, TPopulate, D>>;

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
 * @typeParam TCollectionSlug - Collection slug.
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
 * @example With pagination
 * ```ts
 * const result = await search({
 *   ctx,
 *   collection: "authors",
 *   query: "smith",
 *   searchIndexName: "search_name",
 *   searchField: "name",
 *   paginationOpts: { numItems: 20, cursor: null },
 * });
 * // result: { page: [...], continueCursor: string | null, isDone: boolean }
 * ```
 */
export async function search<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: SearchServerArgs<DataModel, TCollectionSlug, TPopulate, D>,
): Promise<
  | SearchReturnItem<TCollectionSlug, TPopulate, D>[]
  | SearchReturnPaginated<TCollectionSlug, TPopulate, D>
> {
  const tableName = args.collection;
  const limit = args.limit ?? 20;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = args.ctx.db.query(tableName);

  let docs: Record<string, unknown>[];
  let convexPaginationResult: Awaited<ReturnType<typeof q.paginate>> | undefined;

  if (!args.query) {
    if (args.paginationOpts) {
      convexPaginationResult = await q.paginate(args.paginationOpts);
      docs = convexPaginationResult.page;
    } else {
      docs = await q.take(limit);
    }
  } else {
    q = q.withSearchIndex(args.searchIndexName, (q: any) => q.search(args.searchField, args.query));
    if (args.paginationOpts) {
      convexPaginationResult = await q.paginate(args.paginationOpts);
      docs = convexPaginationResult.page;
    } else {
      docs = await q.take(limit);
    }
  }

  const effectivePopulate =
    args.populate ??
    (args.depth !== undefined && args.depth > 0 && args.config
      ? buildDepthPopulate(args.config, args.collection, args.depth)
      : undefined);

  const finalDocs =
    !effectivePopulate || Object.keys(effectivePopulate).length === 0
      ? docs
      : await populateDocs(
          args.ctx,
          docs as ReadonlyArray<Record<string, unknown>>,
          effectivePopulate,
        );

  if (convexPaginationResult) {
    // Return Convex pagination result directly with populated docs
    return {
      ...convexPaginationResult,
      page: finalDocs as SearchReturnItem<TCollectionSlug, TPopulate, D>[],
    };
  }

  return finalDocs as SearchReturnItem<TCollectionSlug, TPopulate, D>[];
}
