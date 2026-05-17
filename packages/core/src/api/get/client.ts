import { convexQuery } from "@convex-dev/react-query";
import type { GenericId } from "convex/values";

import { vexConvexApi } from "../../convex";
import type { CollectionSlug } from "../../types/generated";
import type { GenericQueryClientParams, PopulateShape } from "../types";

/**
 * Client-side args for `get`. Extends {@link GenericQueryClientParams}
 * to inherit `ctx?: never` and `populate?: TPopulate`.
 *
 * @typeParam TCollectionSlug - Collection slug, recovered from the `Id` brand.
 * @typeParam TPopulate - Populate object.
 */
export interface GetClientArgs<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
> extends GenericQueryClientParams<TCollectionSlug, TPopulate> {
  id: GenericId<TCollectionSlug>;
}

/**
 * Returns tanstack-query options for fetching a single document by ID.
 * Client-side only — pass to `useQuery` / `useSuspenseQuery`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `get` from `@vexcms/core/server`.
 *
 * @typeParam TCollectionSlug - Collection slug, recovered from the `Id` brand.
 * @typeParam TPopulate - Populate object.
 * @param args - `{ id, populate? }`.
 * @returns Tanstack-query `queryOptions` resolving to the doc or `null`.
 * @example
 * ```tsx
 * import { get } from "@vexcms/core/client";
 *
 * const { data: post } = useQuery(get({ id: postId, populate: { author: true } }));
 * ```
 */
export function get<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
>(args: GetClientArgs<TCollectionSlug, TPopulate>): ReturnType<typeof convexQuery> {
  return convexQuery(vexConvexApi.get, {
    id: args.id,
    populate: args.populate,
    depth: args.depth,
  });
}
