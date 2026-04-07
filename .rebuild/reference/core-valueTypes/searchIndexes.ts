import { VexFieldValidationError } from "../errors";
import type {
  VexCollection,
  VexField,
  ResolvedSearchIndex,
} from "../types";

/**
 * Collects all search indexes for a collection from three sources:
 * 1. Per-field `searchIndex` property on individual fields
 * 2. Collection-level `searchIndexes` array on the collection
 * 3. Auto-generated search index for `admin.useAsTitle` field
 *
 * @param collection - The collection to extract search indexes from
 * @returns Array of resolved search indexes, deduplicated by name
 */
export function collectSearchIndexes(props: { collection: VexCollection }): ResolvedSearchIndex[] {
  const { collection } = props;
  const searchIndexes = new Map<string, ResolvedSearchIndex>();

  for (const [fieldKey, field] of Object.entries(collection.fields) as [string, VexField][]) {
    const searchIndex = field.searchIndex;
    if (searchIndex && searchIndex.name) {
      if (searchIndexes.has(searchIndex.name)) {
        throw new VexFieldValidationError(
          collection.slug,
          fieldKey,
          `Duplicate search index name: ${searchIndex.name}`,
        );
      }
      searchIndexes.set(searchIndex.name, {
        name: searchIndex.name,
        searchField: fieldKey,
        filterFields: searchIndex.filterFields,
      });
    }
  }

  collection.searchIndexes?.forEach((entry) => {
    searchIndexes.set(entry.name, {
      name: entry.name,
      searchField: entry.searchField,
      filterFields: entry.filterFields ?? [],
    });
  });

  const useAsTitle = collection.admin?.useAsTitle as string;
  if (useAsTitle && useAsTitle !== "_id") {
    const autoName = `search_${useAsTitle}`;
    const alreadyCovered = Array.from(searchIndexes.values()).some(
      (si) => si.searchField === useAsTitle,
    );
    if (!alreadyCovered && !searchIndexes.has(autoName)) {
      searchIndexes.set(autoName, {
        name: autoName,
        searchField: useAsTitle,
        filterFields: [],
      });
    }
  }

  return Array.from(searchIndexes.values());
}
