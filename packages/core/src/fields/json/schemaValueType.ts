import type { JsonFieldMeta } from "../../types";
import { JSON_VALUETYPE } from "../constants";

/**
 * Converts json field metadata to a Convex value type string.
 *
 * Does NOT use processFieldValueTypeOptions — json has its own optionality logic.
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
  if (!props.meta.required) {
    return `v.optional(${JSON_VALUETYPE})`;
  }
  return JSON_VALUETYPE;
}
