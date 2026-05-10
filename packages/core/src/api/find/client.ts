import { convexQuery } from "@convex-dev/react-query";

import { vexConvexApi } from "../../convex";
import type { CollectionSlug } from "../../types/generated"; // needed for the queryKey cast below
import type { GenericQueryClientParams, PopulateShape } from "../types";

/**
 * Client-side args for `find`. Extends {@link GenericQueryClientParams}
 * to inherit `ctx?: never` and `populate?: TPopulate`.
 *
 * @typeParam TSlug - Collection slug.
 * @typeParam TPopulate - Populate object, narrowed against `RelationshipKeysOf<TSlug>`.
 */
export interface FindClientArgs<
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
> extends GenericQueryClientParams<TSlug, TPopulate> {
  collection: TSlug;
  limit?: number;
}

/**
 * Returns tanstack-query options for listing documents in a VexCMS collection.
 * Client-side only — pass to `useQuery` / `useSuspenseQuery` / `prefetchQuery`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `find` from `@vexcms/core/server`.
 *
 * @typeParam TSlug - Collection slug; compile-error if not registered.
 * @typeParam TPopulate - Populate object, narrowed against `RelationshipKeysOf<TSlug>`.
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
  TSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TSlug> = Record<string, never>,
>(args: FindClientArgs<TSlug, TPopulate>): ReturnType<typeof convexQuery> {
  return convexQuery(vexConvexApi.find, {
    collection: args.collection,
    populate: args.populate,
    limit: args.limit,
    depth: args.depth,
  });
}

/**
 * Returns the tanstack-query queryKey for `find` without issuing a full call.
 * Use to invalidate the list query after a mutation.
 *
 * @typeParam TSlug - Collection slug.
 * @param collection - The collection to compute the queryKey for.
 * @returns The tanstack-query `queryKey` array for the given collection.
 * @example
 * ```ts
 * queryClient.invalidateQueries({ queryKey: find.queryKey("posts") });
 * ```
 */
find.queryKey = function findQueryKey<TSlug extends CollectionSlug>(
  collection: TSlug,
) {
  return convexQuery(vexConvexApi.find, {
    collection: collection as CollectionSlug,
  }).queryKey;
};
