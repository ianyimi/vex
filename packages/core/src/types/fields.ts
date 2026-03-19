// =============================================================================
// FIELD TYPES — Object-based configuration
// =============================================================================

import type { ComponentType } from "react";

/** Content alignment for data table cells. */
export type Alignment = "left" | "right" | "center";
export type Labels = {
  singular: string;
  plural: string;
};

/**
 * Props passed to custom field components.
 * Custom components receive these props and use useVexField() for state.
 *
 * Use the generic parameter to narrow the field type for type-safe access
 * to field-specific properties like `options` on select fields.
 *
 * @example
 * ```tsx
 * // Generic — fieldDef has label, admin, description, required
 * function MyField({ name, fieldDef, readOnly }: FieldComponentProps) { ... }
 *
 * // Narrowed — fieldDef is TextFieldDef with maxLength, minLength, etc.
 * function MyTextField({ name, fieldDef }: FieldComponentProps<TextFieldDef>) { ... }
 * ```
 */
export interface FieldComponentProps<TField extends VexField = VexField> {
  /** The field key name (e.g., "primaryColor") */
  name: string;
  /** The VexField definition for this field */
  fieldDef: TField;
  /** Whether the field is read-only (from permissions or config) */
  readOnly: boolean;
}

/**
 * Props passed to custom cell components in the data table.
 */
export interface CellComponentProps<TField extends VexField = VexField> {
  /** The raw cell value from the document */
  value: unknown;
  /** The full row data (document) */
  row: Record<string, unknown>;
  /** The VexField definition for this column's field */
  fieldDef: TField;
}

/**
 * Admin panel configuration for individual fields.
 * Controls visibility, layout, and input behavior in the admin UI.
 */
export interface FieldAdminConfig {
  /**
   * Hide this field from the admin form.
   * Hidden fields are still stored in the database.
   *
   * Default: `false`
   */
  hidden?: boolean;
  /**
   * Make this field read-only in the admin form.
   * The value is displayed but cannot be edited.
   *
   * Default: `false`
   */
  readOnly?: boolean;
  /**
   * Position of the field in the form layout.
   *
   * - `"main"` — placed in the main content area
   * - `"sidebar"` — placed in the sidebar panel
   *
   * Default: `"main"`
   */
  position?: "main" | "sidebar";
  /**
   * Width of the field within its row.
   *
   * - `"full"` — spans the full width
   * - `"half"` — spans half the width (two fields per row)
   *
   * Default: `"full"`
   */
  width?: "full" | "half";
  /**
   * Placeholder text shown in the input when empty.
   */
  placeholder?: string;
  /**
   * Helper text displayed below the field input.
   * Use for additional context or formatting hints.
   */
  description?: string;
  /**
   * Content alignment in data table cells. 'left' | 'right' | 'center'
   */
  cellAlignment?: Alignment;
  /**
   * Custom components for this field.
   *
   * - `Field` replaces the entire field input in the edit form.
   *   Only allowed on text, number, checkbox, and select fields.
   *   The component receives FieldComponentProps and uses useVexField() for state.
   *
   * - `Cell` replaces the cell renderer in the data table list view.
   *   Allowed on any field type.
   */
  components?: {
    Field?: ComponentType<FieldComponentProps>;
    Cell?: ComponentType<CellComponentProps>;
  };
}

// =============================================================================
// BASE FIELD PROPERTIES (shared by all field types)
// =============================================================================

/**
 * Properties shared by all field types.
 * Each concrete field type extends this with its `type` discriminant
 * and type-specific options.
 */
interface BaseField {
  /** Display label for the field in the admin form. */
  label?: string;
  /** Description text shown below the field. */
  description?: string;
  /**
   * Whether this field is required.
   *
   * Default: `false`
   */
  required?: boolean;
  /** Admin UI configuration for this field. */
  admin?: FieldAdminConfig;
  /**
   * Create a database index on this field.
   * The string value becomes the index name in Convex.
   *
   * @example
   * ```ts
   * slug: { type: "text", index: "by_slug", required: true }
   * // Generates: .index("by_slug", ["slug"])
   * ```
   */
  index?: string;
  /**
   * Create a full-text search index on this field.
   * The field this is defined on becomes the `searchField`.
   *
   * @example
   * ```ts
   * title: {
   *   type: "text",
   *   searchIndex: { name: "search_title", filterFields: ["status", "author"] },
   * }
   * // Generates: .searchIndex("search_title", { searchField: "title", filterFields: ["status", "author"] })
   * ```
   */
  searchIndex?: {
    /** Search index name (must be unique within the collection). */
    name: string;
    /**
     * Fields to filter search results by.
     * String array — validated at runtime against collection field names.
     */
    filterFields: string[];
  };
}

// =============================================================================
// CONCRETE FIELD TYPES
// =============================================================================

/** Text field definition. */
export interface TextFieldDef extends BaseField {
  readonly type: "text";
  /** Default value for new documents. */
  defaultValue?: string;
  /** Minimum character length. */
  minLength?: number;
  /** Maximum character length. */
  maxLength?: number;
}

/** Number field definition. */
export interface NumberFieldDef extends BaseField {
  readonly type: "number";
  /** Default value for new documents. */
  defaultValue?: number;
  /** Minimum allowed value. */
  min?: number;
  /** Maximum allowed value. */
  max?: number;
  /** Step increment for the input. */
  step?: number;
}

/** Checkbox field definition. */
export interface CheckboxFieldDef extends BaseField {
  readonly type: "checkbox";
  /** Default value for new documents. */
  defaultValue?: boolean;
}

/**
 * A single option in a select field.
 */
export interface SelectOption<T extends string = string> {
  /** The stored value. */
  readonly value: T;
  /** The display label shown in the dropdown. */
  readonly label: string;
  /** Optional badge color for the data table. Accepts a hex string (e.g. "#3b82f6"). */
  readonly badgeColor?: string;
}

/** Select field — single value variant. */
export interface SelectFieldSingle<T extends string = string> extends BaseField {
  readonly type: "select";
  /** The available options for this select field. */
  options: readonly SelectOption<T>[];
  /** Default value for new documents. */
  defaultValue?: T;
  hasMany?: false;
}

/** Select field — multi-value variant. */
export interface SelectFieldMany<T extends string = string> extends BaseField {
  readonly type: "select";
  /** The available options for this select field. */
  options: readonly SelectOption<T>[];
  /** Default value for new documents. */
  defaultValue?: T;
  /** Display labels for the field (singular/plural). */
  labels?: Labels;
  hasMany: true;
}

/** Select field definition with typed options. Discriminated on `hasMany`. */
export type SelectFieldDef<T extends string = string> =
  | SelectFieldSingle<T>
  | SelectFieldMany<T>;

/** Date field definition. Stores epoch milliseconds. */
export interface DateFieldDef extends BaseField {
  readonly type: "date";
  /** Default value for new documents (epoch ms). */
  defaultValue?: number;
}

/** Image URL field definition. Stores a URL string, renders as thumbnail. */
export interface ImageUrlFieldDef extends BaseField {
  readonly type: "imageUrl";
  /** Default value for new documents. */
  defaultValue?: string;
  /** Width (px) of the image */
  width?: number;
  /** Height (px) of the image */
  height?: number;
}

/** Relationship field — single reference variant. */
export interface RelationshipFieldSingle extends BaseField {
  readonly type: "relationship";
  /** Target table name. */
  to: string;
  hasMany?: false;
}

/** Relationship field — multi-reference variant. */
export interface RelationshipFieldMany extends BaseField {
  readonly type: "relationship";
  /** Target table name. */
  to: string;
  /** Display labels for the field (singular/plural). */
  labels?: Labels;
  hasMany: true;
}

/** Relationship field definition. Discriminated on `hasMany`. */
export type RelationshipFieldDef = RelationshipFieldSingle | RelationshipFieldMany;

/** Shared upload field properties. */
interface UploadFieldBase extends BaseField {
  readonly type: "upload";
  /** Target media collection slug. */
  to: string;
  /**
   * Accepted MIME types for file uploads.
   * Supports exact types ("image/png") and wildcards ("image/*").
   * When not set, all file types are accepted.
   */
  accept?: string[];
  /**
   * Maximum file size in bytes for uploads.
   * When not set, no size limit is enforced (beyond storage provider limits).
   */
  maxSize?: number;
}

/** Upload field — single reference variant. */
export interface UploadFieldSingle extends UploadFieldBase {
  hasMany?: false;
}

/** Upload field — multi-reference variant. */
export interface UploadFieldMany extends UploadFieldBase {
  /** Display labels for the field (singular/plural). */
  labels?: Labels;
  hasMany: true;
}

/**
 * Upload field definition. References a media collection document via `v.id()`.
 * Discriminated on `hasMany`.
 */
export type UploadFieldDef = UploadFieldSingle | UploadFieldMany;

/** JSON field definition. Stores arbitrary data via `v.any()`. */
export interface JsonFieldDef extends BaseField {
  readonly type: "json";
}

/** Array field definition. Wraps an inner field in `v.array()`. */
export interface ArrayFieldDef extends BaseField {
  readonly type: "array";
  /** Display labels for the field (singular/plural). */
  labels?: Labels;
  /** The inner field type for array elements. */
  field: VexField;
  /** Minimum number of items. */
  min?: number;
  /** Maximum number of items. */
  max?: number;
}

import type { VexEditorAdapter, RichTextDocument } from "./editor";

/** Rich text field definition. Stores Plate/Slate JSON via `v.any()`. */
export interface RichTextFieldDef extends BaseField {
  readonly type: "richtext";
  /**
   * Editor adapter override for this specific field.
   * If not set, uses the global editor from `VexConfig.editor`.
   */
  editor?: VexEditorAdapter;
  /**
   * Media collection slug for image uploads.
   * When set, the editor can pick images from the specified media collection,
   * and paste/drop image uploads are auto-saved to this collection.
   * When not set, images can only be inserted by URL.
   */
  mediaCollection?: string;
}

/**
 * UI field definition. Non-persisted — renders a custom component only.
 * Skipped during schema generation, form validation, and column generation.
 * Requires admin.components.Field to be set.
 */
export interface UIFieldDef extends BaseField {
  readonly type: "ui";
  /**
   * Admin config — components.Field is required for ui fields.
   */
  admin: FieldAdminConfig & {
    components: {
      Field: ComponentType<FieldComponentProps>;
    };
  };
}

// =============================================================================
// BLOCK TYPES
// =============================================================================

/**
 * Admin configuration specific to block definitions.
 */
export interface BlockAdminConfig {
  /** Icon identifier for the block picker UI (e.g., "layout-template"). */
  icon?: string;
  /** Custom admin components for this block (future — Spec 09b). */
  components?: {
    Editor?: ComponentType<any>;
  };
}

/**
 * A block definition created by `defineBlock()`.
 * Blocks are reusable field groups composed into ordered lists via the `blocks()` field type.
 *
 * @example
 * ```ts
 * const heroBlock = defineBlock({
 *   slug: "hero",
 *   label: "Hero Section",
 *   fields: { heading: text({ required: true }), subheading: text() },
 * })
 * ```
 */
export interface BlockDef<TFields extends Record<string, VexField> = Record<string, VexField>> {
  /** Unique identifier for this block type. Used as the `blockType` discriminant in stored data. */
  readonly slug: string;
  /** Display label for the block in the admin picker. */
  label: string;
  /** Field definitions for this block's data shape. */
  fields: TFields;
  /** Admin UI configuration. */
  admin?: BlockAdminConfig;
  /**
   * TypeScript interface name used in generated `vex.types.ts`.
   * If not set, auto-generated from slug via PascalCase conversion.
   * @example "HeroBlock"
   */
  interfaceName?: string;
}

/** Reserved field names that cannot be used in block field definitions. */
export const RESERVED_BLOCK_FIELD_NAMES = ["blockType", "blockName", "_key"] as const;

/** Blocks field definition. Stores an ordered array of block instances. */
export interface BlocksFieldDef extends BaseField {
  readonly type: "blocks";
  /** The block definitions allowed in this field. */
  blocks: BlockDef[];
  /** Display labels for the field (singular/plural). */
  labels?: Labels;
  /** Minimum number of blocks. */
  min?: number;
  /** Maximum number of blocks. */
  max?: number;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Distributive version of `Omit` that preserves union branches.
 * Standard `Omit` collapses unions; this applies `Omit` to each branch individually.
 */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

// =============================================================================
// DISCRIMINATED UNION
// =============================================================================

/**
 * Discriminated union of all field types. Switch on `field.type` to narrow.
 *
 * @example
 * ```ts
 * function handle(field: VexField) {
 *   switch (field.type) {
 *     case "text":
 *       field.maxLength; // TextFieldDef ✓
 *       break;
 *     case "select":
 *       field.options;   // SelectFieldDef ✓
 *       break;
 *   }
 * }
 * ```
 */
export type VexField =
  | TextFieldDef
  | NumberFieldDef
  | CheckboxFieldDef
  | SelectFieldDef<string>
  | DateFieldDef
  | ImageUrlFieldDef
  | RelationshipFieldDef
  | UploadFieldDef
  | JsonFieldDef
  | ArrayFieldDef
  | RichTextFieldDef
  | UIFieldDef
  | BlocksFieldDef;

// =============================================================================
// TYPE INFERENCE
// =============================================================================

/**
 * Infer the TypeScript value type from a VexField.
 * Uses the `type` discriminant and field options to determine the type.
 */
export type InferFieldType<F extends VexField> = F extends { type: "text" }
  ? string
  : F extends { type: "number" }
    ? number
    : F extends { type: "checkbox" }
      ? boolean
      : F extends { type: "select"; hasMany: true }
        ? string[]
        : F extends { type: "select" }
          ? string
          : F extends { type: "date" }
            ? number
            : F extends { type: "imageUrl" }
              ? string
              : F extends { type: "relationship"; hasMany: true }
                ? string[]
                : F extends { type: "relationship" }
                  ? string
                  : F extends { type: "upload"; hasMany: true }
                    ? string[]
                    : F extends { type: "upload" }
                      ? string
                      : F extends { type: "json" }
                        ? unknown
                        : F extends { type: "richtext" }
                          ? RichTextDocument
                          : F extends { type: "blocks" }
                            ? Array<InferBlockUnion<F>>
                            : F extends { type: "array" }
                              ? unknown[]
                              : F extends { type: "ui" }
                                ? never
                                : never;

/**
 * Infer the discriminated union type for a blocks field.
 * Each block becomes an object type with `blockType` literal + `_key` + its field types.
 */
export type InferBlockUnion<F extends VexField> = F extends BlocksFieldDef
  ? F["blocks"][number] extends infer B
    ? B extends BlockDef<infer TFields>
      ? { blockType: B["slug"]; blockName?: string; _key: string } & {
          [K in keyof TFields]: InferFieldType<TFields[K] & VexField>;
        }
      : never
    : never
  : never;

/**
 * Infer the document type from a record of fields.
 *
 * @example
 * ```ts
 * type Doc = InferFieldsType<{
 *   title: { type: "text"; required: true };
 *   count: { type: "number" };
 * }>;
 * // { title: string; count: number }
 * ```
 */
export type InferFieldsType<F extends Record<string, VexField>> = {
  [K in keyof F]: InferFieldType<F[K] & VexField>;
};
