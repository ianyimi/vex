import type { BlocksFieldDef, BlockDef } from "../../types";
import { VexBlockValidationError } from "../../errors";

/**
 * Create a blocks field that stores an ordered array of block instances.
 *
 * @param props.blocks - Array of BlockDef objects allowed in this field
 * @param props.labels - Optional singular/plural display labels
 * @param props.min - Minimum number of blocks
 * @param props.max - Maximum number of blocks
 * @returns A BlocksFieldDef
 *
 * @throws VexBlockValidationError if two blocks share the same slug
 *
 * @example
 * ```ts
 * content: blocks({
 *   blocks: [heroBlock, ctaBlock, featureGridBlock],
 * })
 * ```
 */
export function blocks(props: {
  blocks: BlockDef[];
  labels?: BlocksFieldDef["labels"];
  min?: number;
  max?: number;
  label?: string;
  description?: string;
  required?: boolean;
  admin?: BlocksFieldDef["admin"];
}): BlocksFieldDef {
  const seen = new Set<string>();
  for (const block of props.blocks) {
    if (seen.has(block.slug)) {
      throw new VexBlockValidationError(
        block.slug,
        `Duplicate block slug "${block.slug}" in blocks field. Each block in a blocks() field must have a unique slug.`,
      );
    }
    seen.add(block.slug);
  }

  return {
    type: "blocks",
    blocks: props.blocks,
    labels: props.labels,
    min: props.min,
    max: props.max,
    label: props.label,
    description: props.description,
    required: props.required,
    admin: props.admin,
  };
}
