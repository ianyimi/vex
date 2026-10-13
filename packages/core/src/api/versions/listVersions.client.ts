import { convexQuery } from "@convex-dev/react-query";
import type { GenericId } from "convex/values";

import { vexConvexApi, type VexListVersionsArgs } from "../convex";
import type { CollectionSlug, GlobalSlug } from "../../types/generated";
import type { VexQueryOptions } from "../types";
import type { VersionSummary } from "../../versions";

/**
 * Client-side args for {@link listVersions}. A discriminated union: pass
 * `{ collection, id, limit? }` for a versioned collection's document, or
 * `{ global, limit? }` for a versioned global.
 */
export type ListVersionsClientArgs<TCollectionSlug extends CollectionSlug = CollectionSlug> =
  | { collection: TCollectionSlug; id: GenericId<TCollectionSlug>; limit?: number }
  | { global: GlobalSlug; limit?: number };

/**
 * Returns tanstack-query options for a document's (or global's) version
 * history. The query itself throws for a caller lacking `readDrafts` (see
 * `VersionHistoryDropdown`, Step 18, which hides the affordance under the
 * same action so the throw path is rarely hit).
 *
 * Import from `@vexcms/core/client`.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @param props - `{ collection, id, limit? } | { global, limit? }`.
 * @returns Tanstack-query `queryOptions` for `useQuery`.
 * @example
 * ```tsx
 * import { listVersions } from "@vexcms/core/client";
 *
 * const { data } = useQuery(listVersions({ collection: "posts", id: postId }));
 * const { data: bannerHistory } = useQuery(listVersions({ global: "banner" }));
 * ```
 */
export function listVersions<TCollectionSlug extends CollectionSlug = CollectionSlug>(
  props: ListVersionsClientArgs<TCollectionSlug>,
): VexQueryOptions<VexListVersionsArgs, VersionSummary[]> {
  return "collection" in props
    ? convexQuery(vexConvexApi.versions.listVersions, {
        collection: props.collection,
        id: props.id,
        limit: props.limit,
      })
    : convexQuery(vexConvexApi.versions.listVersions, { global: props.global, limit: props.limit });
}
