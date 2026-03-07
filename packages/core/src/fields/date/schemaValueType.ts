import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { DateFieldMeta } from "../../types";
import { DATE_VALUETYPE } from "../constants";

/**
 * Converts date field metadata to a Convex value type string.
 *
 * @returns `"v.number()"` or `"v.optional(v.number())"`
 *
 * Dates are stored as epoch milliseconds (number).
 */
export function dateToValueTypeString(props: {
  meta: DateFieldMeta;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    meta: props.meta,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "number",
    valueType: DATE_VALUETYPE,
  });
}
