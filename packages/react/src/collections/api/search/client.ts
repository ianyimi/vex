import { convexQuery } from "@convex-dev/react-query";
import type { PaginationResult } from "@vexcms/core";
import type { VexQueryOptions } from "../../../client/types";

import {
  buildSearchArgs,
  searchFuncRef,
  type CollectionSlug,
  type DocReturnItem,
  type PopulateShape,
  type SearchClientArgs,
  type SearchClientPaginatedArgs,
  type SearchReturn,
  type SearchReturnPaginated,
  type VexSearchArgs,
} from "@vexcms/core";

export type { SearchClientArgs, SearchClientPaginatedArgs } from "@vexcms/core";

/**
 * Returns tanstack-query options for text search in a VexCMS collection.
 *
 * Client-side only — pass to `useQuery` / `useSuspenseQuery` / `prefetchQuery`.
 *
 * Import from `@vexcms/react/client`. For the server-side version, import
 * `search` from `@vexcms/core/server`; for a direct network call outside React
 * (server components, scripts), import `vexSearchQuery` from `@vexcms/core`.
 *
 * The funcRef is cast per instantiation (inside {@link searchFuncRef}) for
 * the reason documented on `get` — `api.vex.search` is one registered function
 * serving every collection, so its return type is fixed at codegen and a
 * runtime `collection` value cannot narrow it.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = none).
 * @param args - `{ collection, searchIndexName, searchField, query, populate?, depth?, paginationOpts? }`.
 * @returns Tanstack-query options for the array or paginated form.
 */
export function search<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: SearchClientArgs<TCollectionSlug, TPopulate, D> & { paginationOpts?: never },
  // Inlined rather than `SearchReturn<…>` so hover resolves to `Doc[]` — see the
  // display/assignability note in `../types`.
): VexQueryOptions<VexSearchArgs, DocReturnItem<TCollectionSlug, TPopulate, D>[]>;
export function search<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: SearchClientPaginatedArgs<TCollectionSlug, TPopulate, D>,
): VexQueryOptions<
  VexSearchArgs,
  PaginationResult<DocReturnItem<TCollectionSlug, TPopulate, D>>
>;
/**
 * Implementation signature for the two `search` overloads above — not called
 * directly with this shape. See the overloads for the public contract.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = none).
 * @param args - `{ collection, searchIndexName, searchField, query, populate?, depth?, paginationOpts? }`.
 * @returns Tanstack-query options for the array or paginated form.
 */
export function search<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: SearchClientArgs<TCollectionSlug, TPopulate, D>,
):
  | VexQueryOptions<VexSearchArgs, SearchReturn<TCollectionSlug, TPopulate, D>>
  | VexQueryOptions<VexSearchArgs, SearchReturnPaginated<TCollectionSlug, TPopulate, D>> {
  const funcRef = searchFuncRef<TCollectionSlug, TPopulate, D>();
  return convexQuery(funcRef, args.skip === true ? "skip" : buildSearchArgs(args));
}
