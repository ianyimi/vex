import { ADMIN_FIELDS } from "../constants";
import { slugToPascalCase } from "../../collections/utils";
import type { BlockConfigInput, BlockConfig, BlocksFieldInput, BlocksField } from "./types";
import { RESERVED_BLOCK_FIELD_NAMES } from "./types";
import { nanoid } from "nanoid";
import { BaseFieldMeta } from "../types";

/**
 * Defines a single block type for use in a `blocks()` field.
 *
 * Validates that the slug is a valid identifier and that no field name
 * collides with framework-reserved names (`blockType`, `blockName`, `id`).
 * Computes `interfaceType` — the TypeScript object-type string including
 * all three framework keys plus user fields.
 *
 * @param options - Block definition. `slug`, `label`, and `fields` are required.
 * @returns Resolved `BlockDef` with all defaults applied.
 *
 * @throws {Error} If `slug` does not match `/^[a-zA-Z][a-zA-Z0-9_-]*$/`.
 * @throws {Error} If any field name is in `RESERVED_BLOCK_FIELD_NAMES`.
 *
 * @example
 * ```ts
 * const headingBlock = defineBlock({
 *   slug:  "heading",
 *   label: "Heading",
 *   admin: { icon: "heading" },
 *   fields: { text: text({ required: true }) },
 * })
 * ```
 *
 * @see {@link BlockConfigInput} for the full input type
 * @see {@link BlockConfig} for the resolved output type
 */
export function defineBlock(options: BlockConfigInput): BlockConfig {
  // Validate slug format — must generate a valid Convex v.literal() string
  if (!options.slug || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(options.slug)) {
    throw new Error(
      `Invalid block slug "${options.slug}". Slugs must start with a letter and contain only letters, numbers, hyphens, and underscores.`,
    );
  }

  // Prevent field name collisions with framework-injected keys
  for (const fieldName of Object.keys(options.fields)) {
    if ((RESERVED_BLOCK_FIELD_NAMES as readonly string[]).includes(fieldName)) {
      throw new Error(
        `Block "${options.slug}": field name "${fieldName}" is reserved. Reserved names: ${RESERVED_BLOCK_FIELD_NAMES.join(", ")}`,
      );
    }
  }

  const interfaceName = options.interfaceName ?? `${slugToPascalCase({ slug: options.slug })}Block`;

  return {
    id: nanoid(),
    blockType: options.slug,
    blockName: options.name,
    label: options.label,
    fields: options.fields,
    admin: options.admin,
    interfaceName,
    interfaceType: buildBlockInterfaceType({
      slug: options.slug,
      fields: options.fields,
    }),
  };
}

/**
 * Creates a blocks field with all defaults applied.
 *
 * Validates that all block slugs are unique within this field. Each item
 * stored in Convex carries `blockType`, `blockName`, and `id` in addition
 * to the block's own fields.
 *
 * @param options - Blocks field configuration. `blocks` is required.
 * @returns Resolved blocks field definition.
 *
 * @throws {Error} If two or more block definitions share the same slug.
 *
 * @example
 * ```ts
 * const heading   = defineBlock({ slug: "heading",   label: "Heading",   fields: { text: text({ required: true }) } })
 * const paragraph = defineBlock({ slug: "paragraph", label: "Paragraph", fields: { content: text({ required: true }) } })
 *
 * defineCollection({
 *   fields: {
 *     body: blocks({
 *       label:  "Body",
 *       blocks: [heading, paragraph],
 *       labels: { singular: "section", plural: "sections" },
 *     }),
 *   },
 * })
 * ```
 *
 * @see {@link BlocksFieldInput} for the full input type
 * @see {@link BlocksField} for the resolved output type
 */
export function blocks<TFieldMeta extends BaseFieldMeta = BaseFieldMeta>(
  options: BlocksFieldInput<TFieldMeta>,
): BlocksField<TFieldMeta> {
  // Validate unique slugs
  const seen = new Set<string>();
  for (const block of options.blocks) {
    if (seen.has(block.blockType)) {
      throw new Error(
        `Duplicate block slug "${block.blockType}" in blocks() call. Each block must have a unique slug.`,
      );
    }
    seen.add(block.blockType);
  }

  return {
    type: ADMIN_FIELDS.blocks.type,
    interfaceType: buildBlocksInterfaceType({
      blocks: options.blocks,
      interfaceName: options.interfaceName,
    }),
    label: options.label ?? "",
    required: options.required ?? false,
    defaultValue: options.defaultValue ?? [],
    labels: options.labels ?? { singular: "Block", plural: "Blocks" },
    blocks: options.blocks,
    interfaceName: options.interfaceName,
    min: options.min,
    max: options.max,
    admin: {
      defaultCollapsed: options.admin?.defaultCollapsed ?? false,
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      placeholder: "",
      ...options?.admin,
    },
    meta: {
      ...options.meta,
    } as TFieldMeta,
  };
}

/**
 * Builds the TypeScript object-type string for a block definition.
 *
 * Always includes the three framework keys first (`blockType` literal, `blockName?`,
 * `id`), followed by user fields. Named group sub-fields are referenced by
 * `interfaceName` rather than inlined.
 *
 * @param props - The block properties.
 * @param props.slug - The block slug used for the `blockType` literal.
 * @param props.fields - The block's field definitions.
 * @returns The TypeScript object-type string.
 * @internal
 */
function buildBlockInterfaceType(props: {
  slug: string;
  fields: BlockConfigInput["fields"];
}): string {
  const frameworkKeys = `blockType: "${props.slug}"; blockName?: string; id: string`;
  const userEntries = Object.entries(props.fields)
    .map(([key, field]) => {
      const typeStr =
        field.type === ADMIN_FIELDS.group.type && field.interfaceName
          ? field.interfaceName
          : field.interfaceType;
      return `${key}${field.required ? "" : "?"}: ${typeStr}`;
    })
    .join("; ");
  return userEntries ? `{ ${frameworkKeys}; ${userEntries} }` : `{ ${frameworkKeys} }`;
}

/**
 * Builds the TypeScript array-type string for a blocks field.
 *
 * Uses `interfaceName` for the named union alias when set, otherwise
 * builds an inline union of all block interface names.
 *
 * @param props - The blocks field properties.
 * @param props.blocks - The block definitions for this field.
 * @param props.interfaceName - Optional union alias name.
 * @returns The TypeScript array-type string.
 * @internal
 */
function buildBlocksInterfaceType(props: {
  blocks: BlockConfig[];
  interfaceName?: string;
}): string {
  if (props.interfaceName) return `${props.interfaceName}[]`;
  const names = props.blocks.map((b) => b.interfaceName);
  if (names.length === 0) return "Record<string, unknown>[]";
  if (names.length === 1) return `${names[0]}[]`;
  return `(${names.join(" | ")})[]`;
}
