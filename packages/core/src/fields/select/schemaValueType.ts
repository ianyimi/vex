import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { SelectFieldMeta } from "../../types";

/**
 * Converts select field metadata to a Convex value type string.
 *
 * @returns One of (each may be wrapped in v.optional()):
 * - Single select: `'v.union(v.literal("draft"),v.literal("published"))'`
 * - Multi select (hasMany): `'v.array(v.union(v.literal("draft"),v.literal("published")))'`
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
  const literals = props.meta.options.map((o) => `v.literal("${o.value}")`).join(",");

  if (props.meta.hasMany) {
    return processFieldValueTypeOptions({
      meta: props.meta,
      collectionSlug: props.collectionSlug,
      fieldName: props.fieldName,
      expectedType: "object",
      valueType: props.meta.options.length === 1
        ? `v.array(${literals})`
        : `v.array(v.union(${literals}))`,
      skipDefaultValidation: true,
    });
  }

  return processFieldValueTypeOptions({
    meta: props.meta,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "string",
    valueType: `v.union(${literals})`,
  });
}
