import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { SelectFieldMeta } from "../../types";

/**
 * Converts select field metadata to a Convex value type string.
 *
 * @returns One of (each may be wrapped in v.optional()):
 * - Single select: `'v.union(v.literal("draft"),v.literal("published"))'`
 * - Multi select (hasMany): `'v.array(v.literal("draft"),v.literal("published"))'`
 *
 * Edge cases:
 * - Single option: `v.union(v.literal("only"))` — Convex accepts single-arg union
 * - Empty options array: should throw
 * - Duplicate option values: deduplicate before generating literals
 * - Options with special characters in values: escape quotes
 */
export function selectToValueTypeString(props: {
  meta: SelectFieldMeta<string>;
  collectionSlug: string;
  fieldName: string;
}): string {
  const { meta, collectionSlug, fieldName } = props;
  const literals = meta.options.map((o) => `v.literal("${o.value}")`).join(",");
  if (meta.hasMany) {
    return processFieldValueTypeOptions({
      collectionSlug,
      fieldName,
      meta,
      expectedType: "object",
      valueType: `v.array(${literals})`,
    });
  }
  return processFieldValueTypeOptions({
    collectionSlug,
    fieldName,
    meta,
    expectedType: "string",
    valueType: `v.union(${literals})`,
  });
}
