import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { TextFieldDef } from "../../types";
import { TEXT_VALUETYPE } from "../constants";

/**
 * Converts text field definition to a Convex value type string.
 *
 * @returns `"v.string()"` or `"v.optional(v.string())"`
 *
 * minLength/maxLength are runtime validation concerns, not schema constraints.
 * The index property has no effect on the value type (handled by collectIndexes).
 */
export function textToValueTypeString(props: {
  field: TextFieldDef;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    field: props.field,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "string",
    valueType: TEXT_VALUETYPE,
  });
}
