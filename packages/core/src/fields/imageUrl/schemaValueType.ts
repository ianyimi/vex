import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { ImageUrlFieldDef } from "../../types";
import { IMAGEURL_VALUETYPE } from "../constants";

/**
 * Converts imageUrl field definition to a Convex value type string.
 *
 * @returns `"v.string()"` or `"v.optional(v.string())"`
 *
 * Image URLs are stored as strings, same schema as text.
 */
export function imageUrlToValueTypeString(props: {
  field: ImageUrlFieldDef;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    field: props.field,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "string",
    valueType: IMAGEURL_VALUETYPE,
  });
}
