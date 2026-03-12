import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { JsonFieldDef } from "../../types";
import { JSON_VALUETYPE } from "../constants";

/**
 * Converts json field definition to a Convex value type string.
 *
 * @returns
 * - required: `"v.any()"`
 * - !required: `"v.optional(v.any())"`
 */
export function jsonToValueTypeString(props: {
  field: JsonFieldDef;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    field: props.field,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "object",
    valueType: JSON_VALUETYPE,
    skipDefaultValidation: true,
  });
}
