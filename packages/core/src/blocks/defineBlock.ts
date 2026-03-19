import type { BlockDef, VexField } from "../types";
import { RESERVED_BLOCK_FIELD_NAMES } from "../types/fields";
import { VexBlockValidationError } from "../errors";

/**
 * Define a block type for use with the `blocks()` field.
 *
 * @param props.slug - Unique identifier for this block type
 * @param props.label - Display label for the admin picker
 * @param props.fields - Field definitions for this block's data shape
 * @param props.admin - Optional admin UI configuration (icon, custom components)
 * @returns A BlockDef object
 *
 * @throws VexBlockValidationError if slug is empty or contains invalid characters
 * @throws VexBlockValidationError if any field name is reserved (blockType, _key)
 *
 * @example
 * ```ts
 * const heroBlock = defineBlock({
 *   slug: "hero",
 *   label: "Hero Section",
 *   fields: {
 *     heading: text({ required: true }),
 *     subheading: text(),
 *   },
 * })
 * ```
 */
export function defineBlock<TFields extends Record<string, VexField>>(props: {
  slug: string;
  label: string;
  fields: TFields;
  admin?: BlockDef["admin"];
  interfaceName?: string;
}): BlockDef<TFields> {
  if (!props.slug || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(props.slug)) {
    throw new VexBlockValidationError(
      props.slug || "(empty)",
      `Invalid block slug "${props.slug}". Slugs must start with a letter and contain only letters, numbers, hyphens, and underscores.`,
    );
  }

  for (const fieldName of Object.keys(props.fields)) {
    if ((RESERVED_BLOCK_FIELD_NAMES as readonly string[]).includes(fieldName)) {
      throw new VexBlockValidationError(
        props.slug,
        `Field name "${fieldName}" is reserved in block definitions. Reserved names: ${RESERVED_BLOCK_FIELD_NAMES.join(", ")}`,
      );
    }
  }

  return {
    slug: props.slug,
    label: props.label,
    fields: props.fields,
    admin: props.admin,
    interfaceName: props.interfaceName,
  };
}
