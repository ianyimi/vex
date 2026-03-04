import { VexFieldValidationError } from "../errors";
import type {
  VexCollection,
  IndexConfig,
  VexField,
  BaseFieldMeta,
  ResolvedIndex,
} from "../types";

/**
 * Collects all indexes for a collection from three sources:
 * 1. Per-field `index` property on individual fields
 * 2. Collection-level `indexes` array on the collection config
 * 3. Auto-generated index for `admin.useAsTitle` field (for fast admin panel title queries)
 *
 * Goal: Walk all fields in the collection, extract any `index` property from
 * field metadata, convert to ResolvedIndex format, then merge with
 * collection-level indexes. If `admin.useAsTitle` is set and the referenced
 * field doesn't already have an index (per-field or collection-level),
 * auto-create one named `"by_<fieldName>"`. Deduplicate by index name — if a
 * per-field index and a collection-level index have the same name, the
 * collection-level definition wins (it's more explicit).
 *
 * @param collection - The collection to extract indexes from
 * @returns Array of resolved indexes, deduplicated by name
 *
 * Edge cases:
 * - No indexes anywhere: return empty array
 * - Per-field index on field "slug" with name "by_slug": produces { name: "by_slug", fields: ["slug"] }
 * - Collection-level index with same name as per-field: collection-level wins
 * - Multiple fields with same index name: error — two fields can't claim the same index name
 * - Collection-level index referencing non-existent field: warn but don't error (field may come from auth merge)
 * - Empty index name string on a field: skip (treat as no index)
 * - admin.useAsTitle field already has an explicit index: don't duplicate, use the existing one
 * - admin.useAsTitle field has no index: auto-create { name: "by_<fieldName>", fields: ["<fieldName>"] }
 * - admin.useAsTitle is undefined: no auto-index generated
 */
export function collectIndexes<
  TFields extends Record<string, VexField<any, any>>,
>(props: { collection: VexCollection<TFields> }): ResolvedIndex[] {
  const { collection } = props;
  const fieldIndexes = new Map<string, ResolvedIndex>();

  for (const [fieldKey, field] of Object.entries(collection.config.fields)) {
    const indexName = (field._meta as BaseFieldMeta).index;
    if (indexName) {
      if (fieldIndexes.has(indexName)) {
        throw new VexFieldValidationError(
          collection.slug,
          fieldKey,
          `Duplicate Indexes detected: ${indexName}`,
        );
      }
      fieldIndexes.set(indexName, { name: indexName, fields: [fieldKey] });
    }
  }

  collection.config.indexes?.forEach((index) => {
    fieldIndexes.set(index.name, { name: index.name, fields: index.fields });
  });

  const useAsTitle = collection.config.admin?.useAsTitle as string;
  if (useAsTitle) {
    const autoName = `by_${useAsTitle}`;
    if (!fieldIndexes.has(autoName)) {
      fieldIndexes.set(autoName, { name: autoName, fields: [useAsTitle] });
    }
  }

  return Array.from(fieldIndexes.values());
}
