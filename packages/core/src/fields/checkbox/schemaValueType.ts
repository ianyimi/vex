import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { CheckboxFieldMeta } from "../../types";
import { CHECKBOX_VALUETYPE } from "../constants";

/**
 * Converts checkbox field metadata to a Convex value type string.
 *
 * @returns `"v.boolean()"` or `"v.optional(v.boolean())"`
 */
export function checkboxToValueTypeString(props: {
  meta: CheckboxFieldMeta;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    meta: props.meta,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "boolean",
    valueType: CHECKBOX_VALUETYPE,
  });
}
