import { convexQuery } from "@convex-dev/react-query";

import { vexConvexApi } from "../convex";
import type { CollectionSlug } from "../types/generated";
import type { GenericQueryClientParams, PopulateShape } from "./types";

/**
 * Client-side args for `search`. Extends {@link GenericQueryClientParams}
 * to inherit `ctx?: never` and `populate?: TPopulate`.
 *
 * @typeParam TSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 */
export interface SearchClientArgs<
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
> extends GenericQueryClientParams<TSlug, TPopulate> {
  collection: TSlug;
  query: string;
  searchIndexName: string;
  searchField: string;
  limit?: number;
}

/**
 * Returns tanstack-query options for text search in a VexCMS collection.
 * Client-side only — pass to `useQuery` / `useSuspenseQuery`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `search` from `@vexcms/core/server`.
 *
 * @typeParam TSlug - Collection slug.
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
  TSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TSlug> = Record<string, never>,
>(args: SearchClientArgs<TSlug, TPopulate>): ReturnType<typeof convexQuery> {
  return convexQuery(vexConvexApi.search, {
    collection: args.collection,
    searchIndexName: args.searchIndexName,
    searchField: args.searchField,
    query: args.query,
    limit: args.limit,
    populate: args.populate,
  });
}
