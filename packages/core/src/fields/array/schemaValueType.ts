import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { ArrayFieldDef, VexField } from "../../types";

/**
 * Converts array field definition to a Convex value type string.
 *
 * Uses callback injection to resolve the inner field type,
 * avoiding circular imports with fieldToValueType.
 *
 * @returns e.g. `"v.array(v.string())"` or `"v.optional(v.array(v.string()))"`
 */
export function arrayToValueTypeString(props: {
  field: ArrayFieldDef;
  collectionSlug: string;
  fieldName: string;
  resolveInnerField: (props: {
    field: VexField;
    collectionSlug: string;
    fieldName: string;
  }) => string;
}): string {
  const innerValueType = props.resolveInnerField({
    field: props.field.field,
    collectionSlug: props.collectionSlug,
    fieldName: `${props.fieldName}[]`,
  });
  // Strip v.optional() from inner — array wrapping handles optionality
  const unwrapped = innerValueType.replace(/^v\.optional\((.+)\)$/, "$1");
  const arrayType = `v.array(${unwrapped})`;

  return processFieldValueTypeOptions({
    field: props.field,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "object",
    valueType: arrayType,
    skipDefaultValidation: true,
  });
}
