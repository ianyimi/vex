import { convexQuery } from "@convex-dev/react-query";
import type { GenericId } from "convex/values";
import type { VexQueryOptions } from "../../../client/types";

import { vexConvexApi, type VexGetVersionSnapshotArgs } from "@vexcms/core";
import type { CollectionSlug, GlobalSlug } from "@vexcms/core";
import type { VersionSnapshotResult } from "@vexcms/core";

/**
 * Client-side args for {@link getVersionSnapshot}. A discriminated union:
 * pass `{ collection, id, version }` for a versioned collection's document,
 * or `{ global, version }` for a versioned global.
 */
export type GetVersionSnapshotClientArgs<TCollectionSlug extends CollectionSlug = CollectionSlug> =
  | { collection: TCollectionSlug; id: GenericId<TCollectionSlug>; version: number }
  | { global: GlobalSlug; version: number };

/**
 * Returns tanstack-query options for one version's full snapshot — used by
 * `VersionHistoryDropdown`'s restore preview. Client-side only.
 *
 * Import from `@vexcms/react/client`.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @param props - `{ collection, id, version } | { global, version }`.
 * @returns Tanstack-query `queryOptions` for `useQuery`.
 */
export function getVersionSnapshot<TCollectionSlug extends CollectionSlug = CollectionSlug>(
  props: GetVersionSnapshotClientArgs<TCollectionSlug>,
): VexQueryOptions<VexGetVersionSnapshotArgs, VersionSnapshotResult> {
  return "collection" in props
    ? convexQuery(vexConvexApi.versions.getVersionSnapshot, {
        collection: props.collection,
        id: props.id,
        version: props.version,
      })
    : convexQuery(vexConvexApi.versions.getVersionSnapshot, {
        global: props.global,
        version: props.version,
      });
}
