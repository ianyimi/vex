import type { UploadFieldMeta } from "../../types";
import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";

/**
 * Converts upload field metadata to a Convex value type string.
 * Uses processFieldValueTypeOptions for required/optional wrapping,
 * same pattern as relationship fields.
 *
 * @returns
 * - hasMany + required: `v.array(v.id("mediaCollectionSlug"))`
 * - hasMany + !required: `v.optional(v.array(v.id("mediaCollectionSlug")))`
 * - !hasMany + required: `v.id("mediaCollectionSlug")`
 * - !hasMany + !required: `v.optional(v.id("mediaCollectionSlug"))`
 */
export function uploadToValueTypeString(props: {
  meta: UploadFieldMeta;
  collectionSlug: string;
  fieldName: string;
}): string {
  const idType = `v.id("${props.meta.to}")`;
  const baseValueType = props.meta.hasMany ? `v.array(${idType})` : idType;

  return processFieldValueTypeOptions({
    meta: props.meta,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "string",
    valueType: baseValueType,
    skipDefaultValidation: true,
  });
}
