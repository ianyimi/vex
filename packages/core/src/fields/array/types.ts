import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput, FieldAdminConfig } from "../baseTypes";
import { AdminField, BaseFieldMeta } from "../types";

/**
 * Union of all types allowed as array item values.
 *
 * Supports the four JSON-compatible scalar types plus nested objects.
 * Nested arrays are created by passing `array({ items: array({ items: ... }) })`.
 */
export type ArrayType = string | number | boolean | object;

/**
 * Configuration input for an `array()` field.
 *
 * Array fields store ordered lists of values — strings, numbers, booleans,
 * or nested objects. The `items` property defines the type of each element
 * using any VexCMS field builder (including nested `array()` for multi-dimensional
 * arrays). All properties are optional; unset properties fall back to the
 * defaults listed below.
 *
 * **Defaults applied by `array()`:**
 * ```ts
 * {
 *   type:            "array",
 *   label:           "",       // inferred from the field key by defineCollection
 *   labels:          { singular: "Item", plural: "Items" },
 *   required:        false,    // field is optional by default
 *   defaultValue:    [],       // empty array shown in admin form
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "full",  // spans the full form width, not half
 *     cellAlignment: "left",  // item count aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // String tags — label inferred from key ("Tags")
 * tags: array({ items: text() })
 *
 * // Required number array with max length
 * scores: array({ required: true, items: number(), max: { value: 10 } })
 *
 * // Nested array — array of arrays of numbers (2D matrix)
 * matrix: array({ items: array({ items: number() }) })
 *
 * // Object items — each item is a structured sub-document
 * links: array({
 *   items: object({
 *     label: text(),
 *     href: url(),
 *   }),
 * })
 * ```
 *
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`, `searchIndex`)
 */
export interface ArrayFieldInput<
  TArrayType extends ArrayType = string,
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TFieldMeta> {
  labels?: {
    singular: string;
    plural: string;
  };
  /**
   * Pre-filled value shown in the admin form when creating a new field.
   * Does not apply to database values
   *
   */
  defaultValue?: TArrayType[];
  items: AdminField;
  /** Minimum array length config. */
  min?: {
    /** Minimum array length. */
    value: number;
    /** Minimum array length error message. */
    error?: string;
  };
  /** Maximum array length config. */
  max?: {
    /** Maximum array length. */
    value: number;
    /** Maximum array length error message. */
    error?: string;
  };
}

/**
 * Resolved configuration for an `array()` field, after all defaults are applied.
 *
 * This is the type that framework adapters and field components receive —
 * `fieldDef` in `InputComponentProps<ArrayField<ArrayType>>` and
 * `CellComponentProps<ArrayField<ArrayType>>` is this type.
 *
 * @see {@link ArrayFieldInput} for the user-facing input type
 * @see {@link array} for the config function that produces this type
 */
export interface ArrayField<
  TArrayType extends ArrayType = string,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
> extends BaseField<TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.array.type;
  /** Display label shown in the admin form. Always set — inferred from the field key if not provided. */
  label: string;
  labels: {
    singular: string;
    plural: string;
  };
  /** Whether this field is required in the database schema. */
  required: boolean;
  /** Resolved admin UI configuration with all defaults applied. */
  admin: FieldAdminConfig;
  /** Pre-filled value shown in the admin form when creating a new field. */
  defaultValue: TArrayType[];
  items: AdminField;
  /** Minimum allowed array length config. */
  min?: {
    /** Minimum allowed array length. */
    value: number;
    /** Minimum allowed array length error message. */
    error?: string;
  };
  /** Maximum allowed array length config. */
  max?: {
    /** Maximum allowed array length. */
    value: number;
    /** Maximum allowed array length error message. */
    error?: string;
  };
}
