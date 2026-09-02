import { convexQuery } from "@convex-dev/react-query";
import type { FunctionReference } from "convex/server";
import type { GenericId } from "convex/values";

import { vexConvexApi, type VexGetArgs } from "../convex";
import type { CollectionSlug } from "../../types/generated";
import type { GenericQueryClientParams, GetReturn, PopulateShape, VexQueryOptions } from "../types";

/**
 * Client-side args for `get`. Extends {@link GenericQueryClientParams}
 * to inherit `ctx?: never`, `populate?: TPopulate`, and `depth?: D`.
 *
 * @typeParam TCollectionSlug - Collection slug, recovered from the `Id` brand.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = none). Inferred from `depth`.
 */
export interface GetClientArgs<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number = 0,
> extends GenericQueryClientParams<TCollectionSlug, TPopulate, D> {
  id: GenericId<TCollectionSlug>;
  collection: TCollectionSlug;
}

/**
 * Returns tanstack-query options for fetching a single document by ID, typed to
 * the document of the `collection` slug passed in.
 *
 * Client-side only — pass to `useQuery` / `useSuspenseQuery`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `get` from `@vexcms/core/server`.
 *
 * ### Why the funcRef is cast
 *
 * `api.vex.get` is a single registered Convex function serving every
 * collection, so codegen fixes one return type for it (`VexDocument | null`) —
 * `collection` crosses the network boundary as a runtime *value* and can never
 * narrow it. This wrapper captures the slug as a type (`TCollectionSlug`) at the
 * call site and casts the reference to {@link GetReturn}, restoring the type the
 * boundary erased. Sound because the endpoint really does return that
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
 * import { get } from "@vexcms/core/client";
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
  const funcRef = vexConvexApi.get as FunctionReference<
    "query",
    "public",
    VexGetArgs,
    GetReturn<TCollectionSlug, TPopulate, D>
  >;
  return convexQuery(
    funcRef,
    args.skip === true
      ? "skip"
      : {
          id: args.id,
          collection: args.collection,
          populate: args.populate,
          depth: args.depth,
        },
  );
}
