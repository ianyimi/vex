import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { CheckboxFieldDef } from "../../types";
import { CHECKBOX_VALUETYPE } from "../constants";

/**
 * Converts checkbox field definition to a Convex value type string.
 *
 * @returns `"v.boolean()"` or `"v.optional(v.boolean())"`
 */
export function checkboxToValueTypeString(props: {
  field: CheckboxFieldDef;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    field: props.field,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "boolean",
    valueType: CHECKBOX_VALUETYPE,
  });
}
