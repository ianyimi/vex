import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { ImageUrlFieldMeta } from "../../types";
import { IMAGEURL_VALUETYPE } from "../constants";

/**
 * Converts imageUrl field metadata to a Convex value type string.
 *
 * @returns `"v.string()"` or `"v.optional(v.string())"`
 *
 * Image URLs are stored as strings, same schema as text.
 */
export function imageUrlToValueTypeString(props: {
  meta: ImageUrlFieldMeta;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    meta: props.meta,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "string",
    valueType: IMAGEURL_VALUETYPE,
  });
}
