import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { NumberFieldMeta } from "../../types";
import { NUMBER_VALUETYPE } from "../constants";

/**
 * Converts number field metadata to a Convex value type string.
 *
 * @returns `"v.number()"` or `"v.optional(v.number())"`
 *
 * min/max/step are runtime validation concerns, not schema constraints.
 * Convex has no integer validator — always v.number().
 */
export function numberToValueTypeString(props: {
  meta: NumberFieldMeta;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    meta: props.meta,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "number",
    valueType: NUMBER_VALUETYPE,
  });
}
