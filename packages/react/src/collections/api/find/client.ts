import { convexQuery } from "@convex-dev/react-query";
import type { PaginationResult } from "@vexcms/core";
import type { VexQueryOptions } from "../../../client/types";
import { whereArg } from "../whereArg";

import {
  buildFindArgs,
  findFuncRef,
  vexConvexApi,
  type CollectionSlug,
  type DocReturnItem,
  type FindClientArgs,
  type FindClientPaginatedArgs,
  type FindReturn,
  type FindReturnPaginated,
  type PopulateShape,
  type VexFindArgs,
  type VexFindPaginatedArgs,
} from "@vexcms/core";

export type { FindClientArgs, FindClientPaginatedArgs } from "@vexcms/core";

/**
 * Returns tanstack-query options for listing documents in a VexCMS collection,
 * typed to the document of the `collection` slug passed in.
 *
 * Client-side only — pass to `useQuery` / `useSuspenseQuery` / `prefetchQuery`.
 *
 * Import from `@vexcms/react/client`. For the server-side version, import
 * `find` from `@vexcms/core/server`; for a direct network call outside React
 * (server components, scripts), import `vexFindQuery` from `@vexcms/core`.
 *
 * Two overloads mirror the server function: without `paginationOpts` the data is
 * an array; with it, a `PaginationResult`. This keeps callers from having to
 * narrow a union at every callsite.
 *
 * The funcRef is cast per instantiation (inside {@link buildFindQuery}) for the
 * reason documented on `get` — `api.vex.find` is one registered function
 * serving every collection, so its return type is fixed at codegen and a
 * runtime `collection` value cannot narrow it.
 *
 * @typeParam TCollectionSlug - Collection slug; compile-error if not registered.
 * @typeParam TPopulate - Populate object, narrowed against `RelationshipKeysOf<TCollectionSlug>`.
 * @typeParam D - Depth literal (0 = none). A non-literal `number` degrades to
 *   `VexDocument`, matching the runtime guard in `DepthPopulated`.
 * @param args - `{ collection, populate?, depth?, limit?, paginationOpts?, skip? }`.
 * @returns Tanstack-query options for `useQuery` / `useSuspenseQuery`.
 * @example
 * ```tsx
 * import { find } from "@vexcms/react/client";
 *
 * const { data: posts } = useQuery(find({ collection: "posts" }));
 * //      ^? Post[]
 *
 * const { data: page } = useQuery(
 *   find({ collection: "posts", paginationOpts: { numItems: 20, cursor: null } }),
 * );
 * //      ^? PaginationResult<Post>
 *
 * const { data: featured } = useQuery(
 *   find({ collection: "posts", where: (q) => q.eq("featured", true) }),
 * );
 * ```
 */
export function find<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: FindClientArgs<TCollectionSlug, TPopulate, D> & { paginationOpts?: never },
  // Inlined rather than `FindReturn<…>` so hover resolves to `Doc[]` — see the
  // display/assignability note in `../types`.
): VexQueryOptions<VexFindArgs, DocReturnItem<TCollectionSlug, TPopulate, D>[]>;
export function find<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: FindClientPaginatedArgs<TCollectionSlug, TPopulate, D>,
): VexQueryOptions<
  VexFindPaginatedArgs,
  PaginationResult<DocReturnItem<TCollectionSlug, TPopulate, D>>
>;
/**
 * Implementation signature for the two `find` overloads above — not called
 * directly with this shape. See the overloads for the public contract.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = none).
 * @param args - `{ collection, populate?, depth?, limit?, paginationOpts?, skip? }`.
 * @returns Tanstack-query options for the array or paginated form.
 */
export function find<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: FindClientArgs<TCollectionSlug, TPopulate, D>,
):
  | VexQueryOptions<VexFindArgs, FindReturn<TCollectionSlug, TPopulate, D>>
  | VexQueryOptions<VexFindPaginatedArgs, FindReturnPaginated<TCollectionSlug, TPopulate, D>> {
  const funcRef = findFuncRef<TCollectionSlug, TPopulate, D>();
  return convexQuery(funcRef, args.skip === true ? "skip" : buildFindArgs(args));
}

/**
 * Returns the tanstack-query queryKey for `find` without issuing a full call.
 * Use to invalidate the list query after a mutation.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = none).
 * @param args - The find args to compute the queryKey for.
 * @returns The tanstack-query `queryKey` array for the given collection.
 * @example
 * ```ts
 * queryClient.invalidateQueries({ queryKey: findQueryKey({ collection: "posts" }) });
 * ```
 */
export function findQueryKey<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(args: FindClientArgs<TCollectionSlug, TPopulate, D>) {
  return convexQuery(vexConvexApi.find, {
    collection: args.collection,
    populate: args.populate,
    limit: args.limit,
    depth: args.depth,
    drafts: args.drafts,
    where: whereArg(args.where),
    paginationOpts: args.paginationOpts,
  }).queryKey;
}

// Preserved as a property for callers using `find.queryKey(...)`. Declared
// separately because expando properties are not permitted on an overloaded
// function declaration.
find.queryKey = findQueryKey;
