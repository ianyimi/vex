import { VexFieldValidationError } from "../errors";
import type {
  VexCollection,
  VexField,
  ResolvedIndex,
} from "../types";

/**
 * Collects all indexes for a collection from three sources:
 * 1. Per-field `index` property on individual fields
 * 2. Collection-level `indexes` array on the collection
 * 3. Auto-generated index for `admin.useAsTitle` field (for fast admin panel title queries)
 *
 * @param collection - The collection to extract indexes from
 * @returns Array of resolved indexes, deduplicated by name
 */
export function collectIndexes(props: { collection: VexCollection }): ResolvedIndex[] {
  const { collection } = props;
  const fieldIndexes = new Map<string, ResolvedIndex>();

  for (const [fieldKey, field] of Object.entries(collection.fields) as [string, VexField][]) {
    const indexName = field.index;
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

  collection.indexes?.forEach((index) => {
    fieldIndexes.set(index.name, { name: index.name, fields: index.fields });
  });

  const useAsTitle = collection.admin?.useAsTitle as string;
  if (useAsTitle && useAsTitle !== "_id") {
    const autoName = `by_${useAsTitle}`;
    if (!fieldIndexes.has(autoName)) {
      fieldIndexes.set(autoName, { name: autoName, fields: [useAsTitle] });
    }
  }

  return Array.from(fieldIndexes.values());
}
