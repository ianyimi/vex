import { convexQuery } from "@convex-dev/react-query";
import type { FunctionReference } from "convex/server";

import { vexConvexApi, type VexSearchArgs } from "../convex";
import type { CollectionSlug } from "../../types/generated";
import type {
  DocReturnItem,
  GenericQueryClientParams,
  PaginationOptions,
  PaginationResult,
  PopulateShape,
  SearchReturn,
  SearchReturnPaginated,
  VexQueryOptions,
} from "../types";

/**
 * Client-side args for `search`. Extends {@link GenericQueryClientParams}
 * to inherit `ctx?: never` and `populate?: TPopulate`.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 */
export interface SearchClientArgs<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number = number,
> extends GenericQueryClientParams<TCollectionSlug, TPopulate, D> {
  collection: TCollectionSlug;
  query: string;
  searchIndexName: string;
  searchField: string;
  limit?: number;
  paginationOpts?: PaginationOptions;
}

/**
 * Client-side args for `search` with PaginationOptions required. Extends {@link GenericQueryClientParams}
 * to inherit `ctx?: never` and `populate?: TPopulate`.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 */
export interface SearchClientPaginatedArgs<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number = number,
> extends GenericQueryClientParams<TCollectionSlug, TPopulate, D> {
  collection: TCollectionSlug;
  query: string;
  searchIndexName: string;
  searchField: string;
  limit?: number;
  paginationOpts: PaginationOptions;
}

/**
 * Returns tanstack-query options for text search in a VexCMS collection.
 * Client-side only — pass to `useQuery` / `useSuspenseQuery`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `search` from `@vexcms/core/server`.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @param args - `{ collection, query, searchIndexName, searchField, limit?, populate? }`.
 * @returns Tanstack-query `queryOptions`.
 * @example
 * ```tsx
 * import { search } from "@vexcms/core/client";
 *
 * const { data: authors } = useQuery(
 *   search({ collection: "authors", query: q, searchIndexName: "search_name", searchField: "name" }),
 * );
 * ```
 */
export function search<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: SearchClientArgs<TCollectionSlug, TPopulate, D> & { paginationOpts?: never },
  // Inlined rather than `SearchReturn<…>` so hover resolves to `Doc[]` — see the
  // display/assignability note in `../types`.
): VexQueryOptions<VexSearchArgs, DocReturnItem<TCollectionSlug, TPopulate, D>[]>;
export function search<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: SearchClientPaginatedArgs<TCollectionSlug, TPopulate, D>,
): VexQueryOptions<
  VexSearchArgs,
  PaginationResult<DocReturnItem<TCollectionSlug, TPopulate, D>>
>;
/**
 * Implementation signature for the two `search` overloads above — not called
 * directly with this shape. See the overloads for the public contract.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = none).
 * @param args - `{ collection, query, searchIndexName, searchField, … }`.
 * @returns Tanstack-query options for the array or paginated form.
 */
export function search<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: SearchClientArgs<TCollectionSlug, TPopulate, D>,
):
  | VexQueryOptions<VexSearchArgs, SearchReturn<TCollectionSlug, TPopulate, D>>
  | VexQueryOptions<VexSearchArgs, SearchReturnPaginated<TCollectionSlug, TPopulate, D>> {
  const funcRef = vexConvexApi.search as FunctionReference<
    "query",
    "public",
    VexSearchArgs,
    SearchReturn<TCollectionSlug, TPopulate, D>
  >;
  return convexQuery(
    funcRef,
    args.skip === true
      ? "skip"
      : {
          collection: args.collection,
          searchIndexName: args.searchIndexName,
          searchField: args.searchField,
          query: args.query,
          limit: args.limit,
          populate: args.populate,
          depth: args.depth,
          paginationOpts: args.paginationOpts,
        },
  );
}
