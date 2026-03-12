import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { SelectFieldDef } from "../../types";

/**
 * Converts select field definition to a Convex value type string.
 *
 * @returns One of (each may be wrapped in v.optional()):
 * - Single select: `'v.union(v.literal("draft"),v.literal("published"))'`
 * - Multi select (hasMany): `'v.array(v.union(v.literal("draft"),v.literal("published")))'`
 */
export function selectToValueTypeString(props: {
  field: SelectFieldDef<string>;
  collectionSlug: string;
  fieldName: string;
}): string {
  const literals = props.field.options.map((o) => `v.literal("${o.value}")`).join(",");

  if (props.field.hasMany) {
    return processFieldValueTypeOptions({
      field: props.field,
      collectionSlug: props.collectionSlug,
      fieldName: props.fieldName,
      expectedType: "object",
      valueType: props.field.options.length === 1
        ? `v.array(${literals})`
        : `v.array(v.union(${literals}))`,
      skipDefaultValidation: true,
    });
  }

  return processFieldValueTypeOptions({
    field: props.field,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "string",
    valueType: `v.union(${literals})`,
  });
}
