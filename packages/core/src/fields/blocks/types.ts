import { ADMIN_FIELDS } from "../constants";
import type { BaseField, BaseFieldInput, FieldAdminConfigInput } from "../baseTypes";
import type { AdminField } from "../types";
import { LucideIconName } from "../../utils";
import type { FieldAdminConfig } from "../baseTypes";

/**
 * Field names reserved by the blocks system.
 *
 * These names are injected automatically on every block item stored in Convex
 * and cannot be used as user field names inside `defineBlock({ fields: { ... } })`.
 *
 * - `blockType` — discriminant identifying the block's definition (e.g. `"heading"`)
 * - `blockName` — user-editable label stored alongside the block data
 * - `id`       — stable UUID assigned on creation; used as the React key and
 *                  pre-requisites drag-and-drop reorder
 */
export const RESERVED_BLOCK_FIELD_NAMES = [
  "blockType",
  "blockName",
  "id",
] as const;

/**
 * A Generic Block shape that all block data will follow coming out of Convex
 */
export interface GenericBlock extends Record<string, any> {
  id: string;
  blockType: string;
  blockName?: string;
}

/**
 * Admin UI configuration for a single block definition.
 *
 * @see {@link BlockConfigInput}
 */
export interface BlockAdminConfig {
  /**
   * Lucide icon name shown next to the block label in the picker dialog.
   *
   * Typed as `string` in `@vexcms/core` to avoid a React dependency.
   * Rendered via the existing `<Icon name={...}>` component in `@vexcms/react`.
   *
   * @example "Sparkles" | "Puzzle" | "Megaphone" | "CreditCard"
   */
  icon?: LucideIconName;
  /**
   * Whether this block starts expanded when the page loads.
   *
   * Default: `true` (block is open by default)
   *
   * Note: Controlled by the field-level `admin.defaultCollapsed` setting —
   * when that is `true`, all blocks start collapsed regardless of this value.
   */
  defaultCollapsed?: boolean;
}

/**
 * Configuration input for a single block type, passed to `defineBlock()`.
 *
 * A block definition describes one variant in a blocks field — its stored
 * discriminant (`slug`), its display name in the admin picker (`label`), the
 * fields that make up its data shape, and optional admin UI config (icon).
 * Three fields are injected automatically on every block item and must not
 * appear in `fields`: `blockType`, `blockName`, and `id`.
 *
 * **Defaults applied by `defineBlock()`:**
 * ```ts
 * {
 *   interfaceName: slugToPascalCase(slug) + "Block",  // e.g. "heading" → "HeadingBlock"
 * }
 * ```
 *
 * @example
 * ```ts
 * const headingBlock = defineBlock({
 *   slug:  "heading",
 *   label: "Heading",
 *   admin: { icon: "heading" },
 *   fields: {
 *     level: select({ options: [{ label: "H1", value: "h1" }] }),
 *     text:  text({ required: true }),
 *   },
 * })
 * ```
 *
 * @see {@link BlockConfig} for the resolved output type
 * @see {@link defineBlock} for the config function that produces this type
 */
export interface BlockConfigInput {
  /**
   * Unique identifier for this block type.
   *
   * Stored as `blockType: "slug"` on every block item. Used as the Convex
   * `v.literal()` discriminant and Zod `z.literal()` key. Must start with a
   * letter and contain only letters, numbers, hyphens, and underscores
   * (`/^[a-zA-Z][a-zA-Z0-9_-]*$/`).
   */
  slug: string;
  name?: string;
  /** Display label shown in the admin block-type picker and as the block header. */
  label?: string;
  /**
   * Fields that make up this block's data shape.
   *
   * Accepts any `AdminField`, including nested `group()` or `array()`.
   * `blockType`, `blockName`, and `id` are injected automatically — do not
   * include them here. `defineBlock()` throws if any reserved name is used.
   */
  fields: Record<string, AdminField>;
  /** Admin UI configuration (picker icon). */
  admin?: BlockAdminConfig;
  /**
   * Custom TypeScript interface name for this block type.
   *
   * Defaults to `${slugToPascalCase(slug)}Block` (e.g. `"heading"` → `"HeadingBlock"`).
   */
  interfaceName?: string;
}

/**
 * Resolved block type definition, after `defineBlock()` applies all defaults.
 *
 * @see {@link BlockConfigInput} for the user-facing input type
 * @see {@link defineBlock} for the config function that produces this type
 */
export interface BlockConfig<TBlockMeta extends {} = {}> {
  /** Unique discriminant value stored as `blockType` on every block item. */
  blockType: string;
  blockName?: string;
  id: string;
  /** Display label shown in the admin block-type picker. */
  label?: string;
  /** Fields that make up this block's data shape. */
  fields: Record<string, AdminField>;
  /** Admin UI configuration. */
  admin?: BlockAdminConfig;
  /**
   * TypeScript interface name for this block type.
   *
   * Always set after `defineBlock()`. Defaults to `${slugToPascalCase(slug)}Block`.
   */
  interfaceName: string;
  /**
   * Computed TypeScript object-type string including all three framework keys.
   *
   * E.g. `{ blockType: "heading"; blockName?: string; id: string; text: string }`.
   * Used by `getFieldInterfaces` to emit the block's `export type` declaration.
   */
  interfaceType: string;
  metadata?: TBlockMeta;
}

/**
 * Configuration input for a `blocks()` field.
 *
 * Blocks fields store an ordered, heterogeneous list of typed objects. Each item
 * carries `blockType` (which block definition it matches), `id` (stable UUID),
 * `blockName` (user-editable label), plus the fields from that block's definition.
 *
 * **Defaults applied by `blocks()`:**
 * ```ts
 * {
 *   type:         "blocks",
 *   label:        "",    // inferred from field key by defineCollection
 *   required:     false,
 *   defaultValue: [],
 *   labels:       { singular: "block", plural: "blocks" },
 *   admin: {
 *     hidden: false, readOnly: false, position: "main", width: "full",
 *     cellAlignment: "left",
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * body: blocks({
 *   label:  "Body",
 *   blocks: [headingBlock, paragraphBlock],
 * })
 * ```
 *
 * @example
 * ```ts
 * // Named union alias + min/max constraints
 * body: blocks({
 *   label:         "Body",
 *   interfaceName: "PageBlock",
 *   blocks:        [headingBlock, paragraphBlock],
 *   min:           1,
 *   max:           20,
 *   labels:        { singular: "section", plural: "sections" },
 * })
 * ```
 *
 * @see {@link BlocksField} for the resolved output type
 * @see {@link blocks} for the config function that produces this type
 */
export interface BlocksFieldInput<TFieldMeta extends {} = {}> extends Omit<
  BaseFieldInput<TFieldMeta>,
  "admin"
> {
  admin?: FieldAdminConfigInput & {
    defaultCollapsed?: boolean;
  };
  /** Block type definitions that are allowed in this field. */
  blocks: BlockConfig<TFieldMeta>[];
  /**
   * Optional TypeScript union alias name.
   *
   * When set, emits `export type PageBlock = HeadingBlock | ParagraphBlock` and
   * the collection interface uses `PageBlock[]` instead of the inline union.
   */
  interfaceName?: string;
  /**
   * Minimum number of block items.
   *
   * Enforced by the Zod inputSchema (form validation), not the Convex schema.
   * Does not affect the generated `vex.schema.ts`.
   */
  min?: number;
  /**
   * Maximum number of block items.
   *
   * Enforced by the Zod inputSchema. When the max is reached, the "Add" button
   * is disabled in the admin UI.
   */
  max?: number;
  /** Singular/plural display labels used in the admin UI. Defaults to `{ singular: "block", plural: "blocks" }`. */
  labels?: { singular: string; plural: string };
  /** Pre-filled value when creating a new document. Defaults to `[]`. */
  defaultValue?: Record<string, unknown>[];
}

/**
 * Resolved configuration for a `blocks()` field, after all defaults are applied.
 *
 * @see {@link BlocksFieldInput} for the user-facing input type
 * @see {@link blocks} for the config function that produces this type
 */
export interface BlocksField<
  TFieldMeta extends {} = {},
> extends BaseField<TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.blocks.type;
  admin: FieldAdminConfig & {
    defaultCollapsed: boolean;
  };
  /** Block type definitions allowed in this field. */
  blocks: BlockConfig<TFieldMeta>[];
  /** Optional TypeScript union alias name. */
  interfaceName?: string;
  /** Minimum number of block items (Zod-enforced). */
  min?: number;
  /** Maximum number of block items (Zod-enforced). */
  max?: number;
  /** Singular/plural display labels for the admin UI. */
  labels: { singular: string; plural: string };
  /** Pre-filled value when creating a new document. */
  defaultValue: Record<string, unknown>[];
}
