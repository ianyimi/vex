import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { RelationshipFieldMeta } from "../../types";

/**
 * Converts relationship field metadata to a Convex value type string.
 *
 * @returns
 * - hasMany + required: `v.array(v.id("tableName"))`
 * - hasMany + !required: `v.optional(v.array(v.id("tableName")))`
 * - !hasMany + required: `v.id("tableName")`
 * - !hasMany + !required: `v.optional(v.id("tableName"))`
 */
export function relationshipToValueTypeString(props: {
  meta: RelationshipFieldMeta;
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
