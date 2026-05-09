"use client";

import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import type {
  CollectionConfig,
  RelationshipField,
  VexDocument,
} from "@vexcms/core";
import { vexConvexApi } from "@vexcms/core";

/**
 * Fetches options for the relationship picker combobox.
 *
 * Uses Convex search when the target collection's `useAsTitle` is a
 * non-system field (and a `search_<useAsTitle>` index has been auto-generated
 * by `collectionConfigToVexSchema`). Falls back to `vexConvexApi.list` when
 * `useAsTitle` is `_id` or `_creationTime` — search is disabled in that case.
 *
 * @param fieldDef - The resolved relationship field definition.
 * @param targetCollection - The resolved target collection config.
 * @param query - The search text. Pass `""` to list recent documents.
 * @param opts - Optional tanstack-query overrides.
 * @param opts.enabled - Whether the query should fire. Pass `false` to defer fetching until the picker opens.
 * @returns `{ documents, isPending, isError, error }`.
 *
 * @example
 * ```tsx
 * const { documents, isPending } = useRelationshipPickerOptions(
 *   fieldDef,
 *   targetCollection,
 *   debouncedSearch,
 * );
 * ```
 */
export function useRelationshipPickerOptions(
  fieldDef: RelationshipField,
  targetCollection: CollectionConfig,
  query: string,
  opts?: { enabled?: boolean },
) {
  const useAsTitle = targetCollection.admin.useAsTitle;
  const isSearchable = useAsTitle !== "_id" && useAsTitle !== "_creationTime";
  const args = isSearchable
    ? {
        collection: fieldDef.collection.slug,
        searchIndexName: `search_${useAsTitle}`,
        searchField: useAsTitle,
        query,
      }
    : { collection: fieldDef.collection.slug };

  const { data, isPending, isError, error } = useQuery({
    ...convexQuery(
      isSearchable ? vexConvexApi.search : vexConvexApi.find,
      args as never,
    ),
    enabled: opts?.enabled ?? true,
  });

  return {
    documents: (data as VexDocument[] | undefined) ?? [],
    isPending,
    isError,
    error,
  };
}
