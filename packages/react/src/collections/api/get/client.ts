import { convexQuery } from "@convex-dev/react-query";
import type { VexQueryOptions } from "../../../client/types";

import {
  buildGetQuery,
  type CollectionSlug,
  type GetClientArgs,
  type GetReturn,
  type PopulateShape,
  type VexGetArgs,
} from "@vexcms/core";

export type { GetClientArgs } from "@vexcms/core";

/**
 * Returns tanstack-query options for fetching a single document by ID, typed to
 * the document of the `collection` slug passed in.
 *
 * Client-side only — pass to `useQuery` / `useSuspenseQuery`.
 *
 * Import from `@vexcms/react/client`. For the server-side version, import
 * `get` from `@vexcms/core/server`; for a direct network call outside React
 * (server components, scripts), import `vexGetQuery` from `@vexcms/core`.
 *
 * ### Why the funcRef is cast
 *
 * `api.vex.get` is a single registered Convex function serving every
 * collection, so codegen fixes one return type for it (`VexDocument | null`) —
 * `collection` crosses the network boundary as a runtime *value* and can never
 * narrow it. {@link buildGetQuery} captures the slug as a type (`TCollectionSlug`)
 * at the call site and casts the reference to {@link GetReturn}, restoring the
 * type the boundary erased. Sound because the endpoint really does return that
 * collection's document: the server `get` reads the row from that table.
 *
 * @typeParam TCollectionSlug - Collection slug, recovered from the `Id` brand.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = none). A non-literal `number` degrades to
 *   `VexDocument`, matching the runtime guard in `DepthPopulated`.
 * @param args - `{ id, collection, populate?, depth? }`.
 * @returns Tanstack-query options whose data is the doc or `null`.
 * @example
 * ```tsx
 * import { get } from "@vexcms/react/client";
 *
 * const { data: post } = useQuery(get({ id: postId, collection: "posts" }));
 * //      ^? Post | null
 *
 * const { data: withAuthor } = useQuery(
 *   get({ id: postId, collection: "posts", populate: { author: true } }),
 * );
 * //      ^? (Post & { author: Author[] }) | null
 * ```
 */
export function get<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: GetClientArgs<TCollectionSlug, TPopulate, D>,
): VexQueryOptions<VexGetArgs, GetReturn<TCollectionSlug, TPopulate, D>> {
  const [funcRef, queryArgs] = buildGetQuery(args);
  return convexQuery(funcRef, args.skip === true ? "skip" : queryArgs);
}
