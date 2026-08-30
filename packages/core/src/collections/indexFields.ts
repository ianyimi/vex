import { ADMIN_FIELDS } from "../fields";
import { CollectionConfig } from "./types";

/**
 * Groups a collection's index-bearing fields by declared index name, in
 * field declaration order — the same computation `collectionConfigToVexSchema`
 * uses for its `.index()` chain (`collections/validator.ts:114-118`): an
 * explicit `field.index`, or an auto `by_<fieldKey>` for every relationship
 * field. Search indexes are excluded — `withIndex` never targets those.
 * Two fields declaring the SAME `field.index` value group into one compound
 * entry, fields in the order they appear on the collection.
 *
 * @param props - Input props.
 * @param props.collection - The collection to read index-bearing fields from.
 * @returns Map of index name → field keys, in declaration order. Empty when
 *   the collection declares no indexed fields.
 * @internal
 */
export function collectionConfigToIndexFields(props: {
  collection: CollectionConfig;
}): Map<string, string[]> {
  const fields = new Map<string, string[]>();
  for (const [fieldKey, field] of Object.entries(props.collection.fields)) {
    let indexName: string;
    if (field.index) {
      indexName = field.index;
    } else if (field.type === ADMIN_FIELDS.relationship.type) {
      indexName = `by_${fieldKey}`;
    } else {
      continue;
    }

    const existing = fields.get(indexName);
    if (existing) {
      existing.push(fieldKey);
    } else {
      fields.set(indexName, [fieldKey]);
    }
  }
  return fields;
}
