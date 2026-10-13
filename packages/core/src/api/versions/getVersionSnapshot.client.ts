import { convexQuery } from "@convex-dev/react-query";
import type { GenericId } from "convex/values";

import { vexConvexApi, type VexGetVersionSnapshotArgs } from "../convex";
import type { CollectionSlug, GlobalSlug } from "../../types/generated";
import type { VexQueryOptions } from "../types";
import type { VersionSnapshotResult } from "./getVersionSnapshot.server";

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
 * Import from `@vexcms/core/client`.
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
