import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { NumberFieldDef } from "../../types";
import { NUMBER_VALUETYPE } from "../constants";

/**
 * Converts number field definition to a Convex value type string.
 *
 * @returns `"v.number()"` or `"v.optional(v.number())"`
 */
export function numberToValueTypeString(props: {
  field: NumberFieldDef;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    field: props.field,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "number",
    valueType: NUMBER_VALUETYPE,
  });
}
