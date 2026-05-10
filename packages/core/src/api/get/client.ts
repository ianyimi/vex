import { convexQuery } from "@convex-dev/react-query";
import type { GenericId } from "convex/values";

import { vexConvexApi } from "../../convex";
import type { CollectionSlug } from "../../types/generated";
import type { GenericQueryClientParams, PopulateShape } from "../types";

/**
 * Client-side args for `get`. Extends {@link GenericQueryClientParams}
 * to inherit `ctx?: never` and `populate?: TPopulate`.
 *
 * @typeParam TSlug - Collection slug, recovered from the `Id` brand.
 * @typeParam TPopulate - Populate object.
 */
export interface GetClientArgs<
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
> extends GenericQueryClientParams<TSlug, TPopulate> {
  id: GenericId<TSlug>;
}

/**
 * Returns tanstack-query options for fetching a single document by ID.
 * Client-side only — pass to `useQuery` / `useSuspenseQuery`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `get` from `@vexcms/core/server`.
 *
 * @typeParam TSlug - Collection slug, recovered from the `Id` brand.
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
  TSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TSlug> = Record<string, never>,
>(args: GetClientArgs<TSlug, TPopulate>): ReturnType<typeof convexQuery> {
  return convexQuery(vexConvexApi.get, {
    id: args.id,
    populate: args.populate,
    depth: args.depth,
  });
}
