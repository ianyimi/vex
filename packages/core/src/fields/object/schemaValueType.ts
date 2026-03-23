import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { ObjectFieldDef, VexField } from "../../types";

/**
 * Converts an object field definition to a Convex value type string.
 *
 * Generates multi-line `v.object({...})` by resolving each sub-field's value type.
 * Each field is placed on its own line to avoid prettier reformatting issues.
 */
export function objectToValueTypeString(props: {
  field: ObjectFieldDef;
  collectionSlug: string;
  fieldName: string;
  resolveInnerField: (props: {
    field: VexField;
    collectionSlug: string;
    fieldName: string;
    visitedBlockSlugs?: Set<string>;
  }) => string;
}): string {
  const fieldEntries: string[] = [];

  for (const [subFieldName, subField] of Object.entries(props.field.fields)) {
    const valueType = props.resolveInnerField({
      field: subField as VexField,
      collectionSlug: props.collectionSlug,
      fieldName: `${props.fieldName}.${subFieldName}`,
    });
    fieldEntries.push(`${subFieldName}: ${valueType}`);
  }

  const objectType = fieldEntries.length <= 2
    ? `v.object({ ${fieldEntries.join(", ")} })`
    : `v.object({\n${fieldEntries.map((e) => `  ${e},`).join("\n")}\n})`;

  return processFieldValueTypeOptions({
    field: props.field,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "object",
    valueType: objectType,
    skipDefaultValidation: true,
  });
}
