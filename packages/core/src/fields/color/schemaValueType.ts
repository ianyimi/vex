import type { ColorFieldDef } from "../../types/fields";
import { TEXT_VALUETYPE } from "../constants";
import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";

/**
 * Convert a color field to its Convex schema value type string.
 * Color fields store strings (hex, hsl, or oklch) so they use v.string().
 */
export function colorToValueTypeString(props: {
  field: ColorFieldDef;
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
