import { convexQuery } from "@convex-dev/react-query";

import { vexConvexApi } from "../convex";
import type { CollectionSlug } from "../../types/generated";
import type { GenericQueryClientParams, PaginationOptions, PopulateShape } from "../types";

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
> extends GenericQueryClientParams<TCollectionSlug, TPopulate> {
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
> extends GenericQueryClientParams<TCollectionSlug, TPopulate> {
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
>(args: SearchClientArgs<TCollectionSlug, TPopulate>): ReturnType<typeof convexQuery> {
  return convexQuery(vexConvexApi.search, {
    collection: args.collection,
    searchIndexName: args.searchIndexName,
    searchField: args.searchField,
    query: args.query,
    limit: args.limit,
    populate: args.populate,
    depth: args.depth,
    paginationOpts: args.paginationOpts,
  });
}
