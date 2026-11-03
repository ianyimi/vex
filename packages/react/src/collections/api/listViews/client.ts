import { convexQuery } from "@convex-dev/react-query";

import { vexConvexApi, type VexListViewsArgs } from "@vexcms/core";
import type { CollectionSlug, VexStoredView } from "@vexcms/core";
import type { VexQueryOptions } from "../../../client/types";

/**
 * Client-side args for {@link listViews}.
 */
export type ListViewsClientArgs<TCollectionSlug extends CollectionSlug = CollectionSlug> = {
  /** The collection slug to list shared views for. */
  collection: TCollectionSlug;
};

/**
 * Returns tanstack-query options for every `shared` saved view stored in
 * `vex_views` for one collection. Org scoping (decision 12) is resolved
 * server-side from the caller's own session — this call never passes an
 * organization id.
 *
 * Merge with `default`/`config` (`admin.view`/`admin.views`, via `toClientSavedListViewConfig`, Step 5/18)
 * and `local` (localStorage) views client-side — see `useSavedListViews` (Step 12).
 *
 * Import from `@vexcms/react/client`.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @param props - `{ collection }`.
 * @returns Tanstack-query `queryOptions` for `useQuery`.
 * @example
 * ```tsx
 * import { listViews } from "@vexcms/react/client";
 *
 * const { data } = useQuery(listViews({ collection: "posts" }));
 * ```
 */
export function listViews<TCollectionSlug extends CollectionSlug = CollectionSlug>(
  props: ListViewsClientArgs<TCollectionSlug>,
): VexQueryOptions<VexListViewsArgs, VexStoredView[]> {
  return convexQuery(vexConvexApi.listViews, { collection: props.collection });
}
