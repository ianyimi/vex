import type { UploadFieldDef } from "../../types";
import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";

/**
 * Converts upload field definition to a Convex value type string.
 *
 * @returns
 * - hasMany + required: `v.array(v.id("mediaCollectionSlug"))`
 * - hasMany + !required: `v.optional(v.array(v.id("mediaCollectionSlug")))`
 * - !hasMany + required: `v.id("mediaCollectionSlug")`
 * - !hasMany + !required: `v.optional(v.id("mediaCollectionSlug"))`
 */
export function uploadToValueTypeString(props: {
  field: UploadFieldDef;
  collectionSlug: string;
  fieldName: string;
}): string {
  const idType = `v.id("${props.field.to}")`;
  const baseValueType = props.field.hasMany ? `v.array(${idType})` : idType;

  return processFieldValueTypeOptions({
    field: props.field,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "string",
    valueType: baseValueType,
    skipDefaultValidation: true,
  });
}
