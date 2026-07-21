import { convexQuery } from "@convex-dev/react-query";

import { vexConvexApi } from "../../convex";
import type { CollectionSlug } from "../../types/generated"; // needed for the queryKey cast below
import type { GenericQueryClientParams, PaginationOptions, PopulateShape } from "../types";

/**
 * Client-side args for `find`. Extends {@link GenericQueryClientParams}
 * to inherit `ctx?: never` and `populate?: TPopulate`.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object, narrowed against `RelationshipKeysOf<TCollectionSlug>`.
 */
export interface FindClientArgs<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug> = PopulateShape<TCollectionSlug>,
> extends GenericQueryClientParams<TCollectionSlug, TPopulate> {
  collection: TCollectionSlug;
  limit?: number;
  paginationOpts?: PaginationOptions;
}

/**
 * Internal Client-side args for `find` with pagination options required. Extends {@link GenericQueryClientParams}
 * to inherit `ctx?: never` and `populate?: TPopulate`.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object, narrowed against `RelationshipKeysOf<TCollectionSlug>`.
 */
export interface FindClientPaginatedArgs<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug> = PopulateShape<TCollectionSlug>,
> extends GenericQueryClientParams<TCollectionSlug, TPopulate> {
  collection: TCollectionSlug;
  limit?: number;
  paginationOpts: PaginationOptions;
}

/**
 * Returns tanstack-query options for listing documents in a VexCMS collection.
 * Client-side only — pass to `useQuery` / `useSuspenseQuery` / `prefetchQuery`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `find` from `@vexcms/core/server`.
 *
 * @typeParam TCollectionSlug - Collection slug; compile-error if not registered.
 * @typeParam TPopulate - Populate object, narrowed against `RelationshipKeysOf<TCollectionSlug>`.
 * @param args - `{ collection, populate?, limit? }`.
 * @returns Tanstack-query `queryOptions` for `useQuery` / `useSuspenseQuery`.
 * @example
 * ```tsx
 * import { find } from "@vexcms/core/client";
 *
 * const { data: posts } = useQuery(
 *   find({ collection: "posts", populate: { author: true } }),
 * );
 * ```
 */
export function find<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
>(args: FindClientArgs<TCollectionSlug, TPopulate>): ReturnType<typeof convexQuery> {
  return convexQuery(vexConvexApi.find, {
    collection: args.collection,
    populate: args.populate,
    limit: args.limit,
    depth: args.depth,
    paginationOpts: args.paginationOpts,
  });
}

/**
 * Returns the tanstack-query queryKey for `find` without issuing a full call.
 * Use to invalidate the list query after a mutation.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @param args - The find args to compute the queryKey for.
 * @returns The tanstack-query `queryKey` array for the given collection.
 * @example
 * ```ts
 * queryClient.invalidateQueries({ queryKey: find.queryKey("posts") });
 * ```
 */
find.queryKey = function findQueryKey<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
>(args: FindClientArgs<TCollectionSlug, TPopulate>) {
  return convexQuery(vexConvexApi.find, {
    collection: args.collection,
    populate: args.populate,
    limit: args.limit,
    depth: args.depth,
    paginationOpts: args.paginationOpts,
  }).queryKey;
};
