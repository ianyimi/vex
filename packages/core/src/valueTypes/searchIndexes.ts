import { VexFieldValidationError } from "../errors";
import type {
  VexCollection,
  VexField,
  BaseFieldMeta,
  ResolvedSearchIndex,
} from "../types";

/**
 * Collects all search indexes for a collection from three sources:
 * 1. Per-field `searchIndex` property on individual fields
 * 2. Collection-level `searchIndexes` array on the collection config
 * 3. Auto-generated search index for `admin.useAsTitle` field
 *
 * Goal: Walk all fields in the collection, extract any `searchIndex` property
 * from field metadata, convert to ResolvedSearchIndex format, then merge with
 * collection-level searchIndexes. If `admin.useAsTitle` is set and no existing
 * search index covers that field (as searchField), auto-create one named
 * `"search_<fieldName>"` with empty filterFields. Deduplicate by name —
 * collection-level wins on collision.
 *
 * @param collection - The collection to extract search indexes from
 * @returns Array of resolved search indexes, deduplicated by name
 *
 * Edge cases:
 * - No search indexes anywhere: return empty array
 * - Per-field searchIndex on field "title" with name "search_title":
 *   produces { name: "search_title", searchField: "title", filterFields: [...] }
 * - Collection-level searchIndex with same name as per-field: collection-level wins
 * - Two fields with same searchIndex name: throw VexFieldValidationError
 * - Empty searchIndex name string on a field: skip (treat as no searchIndex)
 * - admin.useAsTitle field already has an explicit search index: don't duplicate
 * - admin.useAsTitle field has no search index: auto-create
 *   { name: "search_<fieldName>", searchField: "<fieldName>", filterFields: [] }
 * - admin.useAsTitle is undefined: no auto search index generated
 * - searchField must be the field key the searchIndex is defined on (for per-field)
 */
export function collectSearchIndexes<
  TFields extends Record<string, VexField<any, any>>,
>(props: { collection: VexCollection<TFields> }): ResolvedSearchIndex[] {
  const { collection } = props;
  const searchIndexes = new Map<string, ResolvedSearchIndex>();

  for (const [fieldKey, field] of Object.entries(collection.config.fields)) {
    const searchIndex = (field._meta as BaseFieldMeta).searchIndex;
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

  collection.config.searchIndexes?.forEach((entry) => {
    searchIndexes.set(entry.name, {
      name: entry.name,
      searchField: entry.searchField,
      filterFields: entry.filterFields ?? [],
    });
  });

  const useAsTitle = collection.config.admin?.useAsTitle as string;
  if (useAsTitle) {
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
