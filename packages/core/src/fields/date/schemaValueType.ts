import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { DateFieldDef } from "../../types";
import { DATE_VALUETYPE } from "../constants";

/**
 * Converts date field definition to a Convex value type string.
 *
 * @returns `"v.number()"` or `"v.optional(v.number())"`
 *
 * Dates are stored as epoch milliseconds (number).
 */
export function dateToValueTypeString(props: {
  field: DateFieldDef;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    field: props.field,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "number",
    valueType: DATE_VALUETYPE,
  });
}
