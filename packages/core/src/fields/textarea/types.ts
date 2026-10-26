import { ADMIN_FIELDS } from "../constants";
import {
  BaseField,
  BaseFieldInput,
  FieldLimit,
  FieldLimitInput,
  FieldSearchIndex,
  FieldValidateProps,
} from "../baseTypes";
import { VexResourceSlug } from "../../types";

/**
 * Configuration input for a `textarea()` field.
 *
 * Textarea fields store multi-line string values — bios, descriptions,
 * internal notes, anything longer than a single-line `text()` field is
 * comfortable holding. All properties are optional; unset properties fall
 * back to the defaults listed below.
 *
 * **Defaults applied by `textarea()`:**
 * ```ts
 * {
 *   type:     "textarea",
 *   label:    "",       // inferred from the field key by defineCollection
 *   required: false,    // field is optional by default
 *   rows:     4,         // visible textarea rows
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width: "100%",  // spans the full form width, not half
 *     cellAlignment: "left",  // text aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label is inferred from the key ("Bio")
 * bio: textarea()
 *
 * // Required with length validation and a taller textarea
 * bio: textarea({ required: true, min: 10, max: 500, rows: 8 })
 *
 * // Min/max with a custom error message
 * notes: textarea({ max: [280, "Keep it under 280 characters."] })
 * ```
 *
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`)
 */
export interface TextareaFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta> {
  /**
   * Pre-filled value shown in the admin form when creating a new field.
   * Does not apply to database values
   */
  defaultValue?: string;
  /** Minimum character length config. */
  min?: FieldLimitInput;
  /** Maximum character length config. */
  max?: FieldLimitInput;
  /**
   * Visible textarea rows in the admin form.
   *
   * Default: `4`
   */
  rows?: number;
  /**
   * Create a full-text search index on this field.
   * The field this is defined on becomes the `searchField`.
   *
   * @see {@link FieldSearchIndex}
   */
  searchIndex?: FieldSearchIndex;
  /** Server-only async validation with `value` typed as `string`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string>): Promise<void> | void;
}

/**
 * Resolved configuration for a `textarea()` field, after all defaults are applied.
 *
 * This is the type that framework adapters and field components receive —
 * `fieldDef` in `InputComponentProps<TextareaField>` and `CellComponentProps<TextareaField>`
 * is this type.
 *
 * @see {@link TextareaFieldInput} for the user-facing input type
 * @see {@link textarea} for the config function that produces this type
 */
export interface TextareaField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.textarea.type;
  /** Display label shown in the admin form. Always set — inferred from the field key if not provided. */
  label: string;
  /** Whether this field is required in the database schema. */
  required: boolean;
  /** Pre-filled value shown in the admin form when creating a new field. */
  defaultValue: string;
  /** Minimum allowed character length, resolved with a value-aware default error message. */
  min?: FieldLimit;
  /** Maximum allowed character length, resolved with a value-aware default error message. */
  max?: FieldLimit;
  /** Visible textarea rows in the admin form. */
  rows: number;
  /** Full-text search index configuration for this field. @see {@link FieldSearchIndex} */
  searchIndex?: FieldSearchIndex;
  /** Server-only async validation with `value` typed as `string`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string>): Promise<void> | void;
}
