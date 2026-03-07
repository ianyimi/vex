import type { RelationshipFieldMeta } from "../../types";

/**
 * Converts relationship field metadata to a Convex value type string.
 *
 * Does NOT use processFieldValueTypeOptions — has custom logic for v.id().
 *
 * @returns
 * - hasMany: `v.array(v.id("tableName"))`
 * - !hasMany + required: `v.id("tableName")`
 * - !hasMany + !required: `v.optional(v.id("tableName"))`
 */
export function relationshipToValueTypeString(props: {
  meta: RelationshipFieldMeta;
  collectionSlug: string;
  fieldName: string;
}): string {
  const { meta } = props;
  const idType = `v.id("${meta.to}")`;

  if (meta.hasMany) {
    const arrayType = `v.array(${idType})`;
    if (!meta.required) return `v.optional(${arrayType})`;
    return arrayType;
  }

  if (!meta.required) return `v.optional(${idType})`;
  return idType;
}
