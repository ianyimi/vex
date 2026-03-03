import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { TextFieldMeta } from "../../types";
import { TEXT_VALUETYPE } from "../constants";

/**
 * Converts text field metadata to a Convex value type string.
 *
 * @returns `"v.string()"` or `"v.optional(v.string())"`
 *
 * minLength/maxLength are runtime validation concerns, not schema constraints.
 * The index property has no effect on the value type (handled by collectIndexes).
 */
export function textToValueTypeString(props: {
  meta: TextFieldMeta;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    meta: props.meta,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "string",
    valueType: TEXT_VALUETYPE,
  });
}
