import { ADMIN_FIELDS } from "../constants";
import {
  BaseField,
  BaseFieldInput,
  FieldAdminConfig,
  FieldLimit,
  FieldLimitInput,
  FieldValidateProps,
} from "../baseTypes";
import type { VexResourceSlug } from "../../types/generated";

/**
 * Configuration input for a `number()` field.
 *
 * Number fields store numeric values — prices, quantities, ratings, ages, counts, etc.
 * All properties are optional; unset properties fall back to the defaults listed below.
 *
 * **Defaults applied by `number()`:**
 * ```ts
 * {
 *   type:     "number",
 *   label:    "",       // inferred from the field key by defineCollection
 *   required: false,    // field is optional by default
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "full",  // spans the full form width, not half
 *     cellAlignment: "left",  // value aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label is inferred from the key ("Price")
 * price: number()
 *
 * // Required quantity with a minimum of 1 and a database index
 * quantity: number({ required: true, min: 1, index: "by_quantity" })
 *
 * // Rating capped between 0 and 5 with custom error messages
 * rating: number({
 *   min: [0, "Rating cannot be negative"],
 *   max: [5, "Rating cannot exceed 5"],
 *   admin: { width: "half" },
 * })
 *
 * // Pre-filled default for a score field
 * score: number({ defaultValue: 100 })
 * ```
 *
 * @see {@link NumberField} for the resolved type after defaults are applied
 * @see {@link number} for the config function that applies defaults
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`, `searchIndex`)
 */
export interface NumberFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TCollectionSlug, TFieldMeta> {
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * Does not affect database values — only the form's initial state.
   */
  defaultValue?: number;
  /** Minimum allowed numeric value. @see {@link FieldLimitInput} */
  min?: FieldLimitInput;
  /** Maximum allowed numeric value. @see {@link FieldLimitInput} */
  max?: FieldLimitInput;
  /** Server-only async validation with `value` typed as `number`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, number>): Promise<void> | void;
}

/**
 * Resolved configuration for a `number()` field, after all defaults are applied.
 *
 * @see {@link NumberFieldInput} for the user-facing input type
 * @see {@link number} for the config function that produces this type
 */
export interface NumberField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.number.type;
  /** Display label shown in the admin form. Always set — inferred from the field key if not provided. */
  label: string;
  /** Whether this field is required in the database schema. */
  required: boolean;
  /** Resolved admin UI configuration with all defaults applied. */
  admin: FieldAdminConfig;
  /** Pre-filled numeric value shown in the admin form when creating a new document. */
  defaultValue: number;
  /** Minimum allowed numeric value, with its resolved error message. @see {@link FieldLimit} */
  min?: FieldLimit;
  /** Maximum allowed numeric value, with its resolved error message. @see {@link FieldLimit} */
  max?: FieldLimit;
  /** Server-only async validation with `value` typed as `number`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, number>): Promise<void> | void;
}
