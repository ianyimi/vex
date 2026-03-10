import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { JsonFieldMeta } from "../../types";
import { JSON_VALUETYPE } from "../constants";

/**
 * Converts json field metadata to a Convex value type string.
 *
 * @returns
 * - required: `"v.any()"`
 * - !required: `"v.optional(v.any())"`
 */
export function jsonToValueTypeString(props: {
  meta: JsonFieldMeta;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    meta: props.meta,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "object",
    valueType: JSON_VALUETYPE,
    skipDefaultValidation: true,
  });
}
