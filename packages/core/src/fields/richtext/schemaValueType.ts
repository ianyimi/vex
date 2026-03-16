import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { RichTextFieldDef } from "../../types";
import { RICHTEXT_VALUETYPE } from "../constants";

/**
 * Converts richtext field definition to a Convex value type string.
 *
 * @param props.field - The richtext field definition
 * @param props.collectionSlug - The collection this field belongs to
 * @param props.fieldName - The field key name
 * @returns
 * - required: `"v.any()"`
 * - !required: `"v.optional(v.any())"`
 */
export function richtextToValueTypeString(props: {
  field: RichTextFieldDef;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    field: props.field,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "object",
    valueType: RICHTEXT_VALUETYPE,
    skipDefaultValidation: true,
  });
}
