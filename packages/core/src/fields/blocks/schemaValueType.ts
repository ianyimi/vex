import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { BlocksFieldDef, VexField } from "../../types";
import { VexBlockValidationError } from "../../errors";

/**
 * Converts a blocks field definition to a Convex value type string.
 *
 * Generates `v.array(v.union(v.object({...}), v.object({...})))` where each
 * v.object corresponds to a block type with `blockType: v.literal("slug")`
 * as the discriminant, `_key: v.string()`, and each block field converted
 * to its Convex value type.
 *
 * @param props.field - The BlocksFieldDef
 * @param props.collectionSlug - Parent collection slug (for error messages)
 * @param props.fieldName - Field name on the parent collection (for error messages)
 * @param props.resolveInnerField - Callback to resolve inner field value types (avoids circular imports)
 * @param props.visitedBlockSlugs - Set of block slugs already being processed (cycle detection)
 * @returns Convex value type string, e.g. `"v.array(v.union(v.object({...}), ...))"`
 *
 * @throws VexBlockValidationError if a cycle is detected in nested blocks
 */
export function blocksToValueTypeString(props: {
  field: BlocksFieldDef;
  collectionSlug: string;
  fieldName: string;
  resolveInnerField: (props: {
    field: VexField;
    collectionSlug: string;
    fieldName: string;
    visitedBlockSlugs?: Set<string>;
  }) => string;
  visitedBlockSlugs?: Set<string>;
}): string {
  const visited = props.visitedBlockSlugs ?? new Set<string>();

  if (props.field.blocks.length === 0) {
    return processFieldValueTypeOptions({
      field: props.field,
      collectionSlug: props.collectionSlug,
      fieldName: props.fieldName,
      expectedType: "object",
      valueType: "v.array(v.any())",
      skipDefaultValidation: true,
    });
  }

  const objectTypes: string[] = [];

  for (const block of props.field.blocks) {
    if (visited.has(block.slug)) {
      throw new VexBlockValidationError(
        block.slug,
        `Circular block reference detected: block "${block.slug}" references itself (directly or through a cycle).`,
      );
    }

    const blockVisited = new Set(visited);
    blockVisited.add(block.slug);

    const fieldEntries: string[] = [
      `blockType: v.literal("${block.slug}")`,
      `blockName: v.optional(v.string())`,
      `_key: v.string()`,
    ];

    for (const [fieldName, field] of Object.entries(block.fields)) {
      const valueType = props.resolveInnerField({
        field: field as VexField,
        collectionSlug: props.collectionSlug,
        fieldName: `${props.fieldName}.${block.slug}.${fieldName}`,
        visitedBlockSlugs: blockVisited,
      });
      fieldEntries.push(`${fieldName}: ${valueType}`);
    }

    objectTypes.push(`v.object({${fieldEntries.join(", ")}})`);
  }

  const innerType =
    objectTypes.length === 1
      ? objectTypes[0]
      : `v.union(${objectTypes.join(", ")})`;

  const arrayType = `v.array(${innerType})`;

  return processFieldValueTypeOptions({
    field: props.field,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "object",
    valueType: arrayType,
    skipDefaultValidation: true,
  });
}
