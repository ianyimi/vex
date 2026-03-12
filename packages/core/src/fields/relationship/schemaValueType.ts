import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { RelationshipFieldDef } from "../../types";

/**
 * Converts relationship field definition to a Convex value type string.
 *
 * @returns
 * - hasMany + required: `v.array(v.id("tableName"))`
 * - hasMany + !required: `v.optional(v.array(v.id("tableName")))`
 * - !hasMany + required: `v.id("tableName")`
 * - !hasMany + !required: `v.optional(v.id("tableName"))`
 */
export function relationshipToValueTypeString(props: {
  field: RelationshipFieldDef;
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
