import { convexQuery } from "@convex-dev/react-query";
import type { FunctionReference } from "convex/server";

import { vexConvexApi, type VexFindArgs, type VexFindPaginatedArgs } from "../convex";
import type { CollectionSlug } from "../../types/generated";
import type {
  DocReturnItem,
  FindReturn,
  FindReturnPaginated,
  GenericQueryClientParams,
  PaginationOptions,
  PaginationResult,
  PopulateShape,
  VexQueryOptions,
} from "../types";

/**
 * Client-side args for `find`. Extends {@link GenericQueryClientParams}
 * to inherit `ctx?: never`, `populate?: TPopulate`, `depth?: D`, and `skip?`.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object, narrowed against `RelationshipKeysOf<TCollectionSlug>`.
 * @typeParam D - Depth literal (0 = none). Inferred from `depth`.
 */
export interface FindClientArgs<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug> = PopulateShape<TCollectionSlug>,
  D extends number = number,
> extends GenericQueryClientParams<TCollectionSlug, TPopulate, D> {
  collection: TCollectionSlug;
  limit?: number;
  paginationOpts?: PaginationOptions;
}

/**
 * Internal Client-side args for `find` with pagination options required. Extends {@link GenericQueryClientParams}
 * to inherit `ctx?: never`, `populate?: TPopulate`, `depth?: D`, and `skip?`.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object, narrowed against `RelationshipKeysOf<TCollectionSlug>`.
 * @typeParam D - Depth literal (0 = none). Inferred from `depth`.
 */
export interface FindClientPaginatedArgs<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug> = PopulateShape<TCollectionSlug>,
  D extends number = number,
> extends GenericQueryClientParams<TCollectionSlug, TPopulate, D> {
  collection: TCollectionSlug;
  limit?: number;
  paginationOpts: PaginationOptions;
}

/**
 * Returns tanstack-query options for listing documents in a VexCMS collection,
 * typed to the document of the `collection` slug passed in.
 *
 * Client-side only — pass to `useQuery` / `useSuspenseQuery` / `prefetchQuery`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `find` from `@vexcms/core/server`.
 *
 * Two overloads mirror the server function: without `paginationOpts` the data is
 * an array; with it, a `PaginationResult`. This keeps callers from having to
 * narrow a union at every callsite.
 *
 * The funcRef is cast per instantiation for the reason documented on `get` —
 * `api.vex.find` is one registered function serving every collection, so its
 * return type is fixed at codegen and a runtime `collection` value cannot
 * narrow it.
 *
 * @typeParam TCollectionSlug - Collection slug; compile-error if not registered.
 * @typeParam TPopulate - Populate object, narrowed against `RelationshipKeysOf<TCollectionSlug>`.
 * @typeParam D - Depth literal (0 = none). A non-literal `number` degrades to
 *   `VexDocument`, matching the runtime guard in `DepthPopulated`.
 * @param args - `{ collection, populate?, depth?, limit?, paginationOpts?, skip? }`.
 * @returns Tanstack-query options for `useQuery` / `useSuspenseQuery`.
 * @example
 * ```tsx
 * import { find } from "@vexcms/core/client";
 *
 * const { data: posts } = useQuery(find({ collection: "posts" }));
 * //      ^? Post[]
 *
 * const { data: page } = useQuery(
 *   find({ collection: "posts", paginationOpts: { numItems: 20, cursor: null } }),
 * );
 * //      ^? PaginationResult<Post>
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
  const funcRef = vexConvexApi.find as FunctionReference<
    "query",
    "public",
    VexFindArgs,
    FindReturn<TCollectionSlug, TPopulate, D>
  >;
  return convexQuery(
    funcRef,
    args.skip === true
      ? "skip"
      : {
          collection: args.collection,
          populate: args.populate,
          limit: args.limit,
          depth: args.depth,
          paginationOpts: args.paginationOpts,
        },
  );
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
    paginationOpts: args.paginationOpts,
  }).queryKey;
}

// Preserved as a property for callers using `find.queryKey(...)`. Declared
// separately because expando properties are not permitted on an overloaded
// function declaration.
find.queryKey = findQueryKey;
