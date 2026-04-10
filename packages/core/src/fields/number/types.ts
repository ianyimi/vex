import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput, FieldAdminConfig } from "../baseTypes";

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
 * quantity: number({ required: true, min: { value: 1 }, index: "by_quantity" })
 *
 * // Rating capped between 0 and 5 with custom error messages
 * rating: number({
 *   min: { value: 0, error: "Rating cannot be negative" },
 *   max: { value: 5, error: "Rating cannot exceed 5" },
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
export interface NumberFieldInput extends BaseFieldInput {
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * Does not affect database values — only the form's initial state.
   */
  defaultValue?: number;
  /** Minimum allowed numeric value config. */
  min?: {
    /** Minimum allowed numeric value. */
    value: number;
    /** Error message shown when the value is below the minimum. */
    error?: string;
  };
  /** Maximum allowed numeric value config. */
  max?: {
    /** Maximum allowed numeric value. */
    value: number;
    /** Error message shown when the value exceeds the maximum. */
    error?: string;
  };
}

/**
 * Resolved configuration for a `number()` field, after all defaults are applied.
 *
 * @see {@link NumberFieldInput} for the user-facing input type
 * @see {@link number} for the config function that produces this type
 */
export interface NumberField extends BaseField {
  readonly type: typeof ADMIN_FIELDS.number.type;
  /** Display label shown in the admin form. Always set — inferred from the field key if not provided. */
  label: string;
  /** Whether this field is required in the database schema. */
  required: boolean;
  /** Resolved admin UI configuration with all defaults applied. */
  admin: FieldAdminConfig;
  /** Pre-filled numeric value shown in the admin form when creating a new document. */
  defaultValue: number;
  /** Minimum allowed numeric value config. */
  min?: {
    /** Minimum allowed numeric value. */
    value: number;
    /** Error message shown when the value is below the minimum. */
    error?: string;
  };
  /** Maximum allowed numeric value config. */
  max?: {
    /** Maximum allowed numeric value. */
    value: number;
    /** Error message shown when the value exceeds the maximum. */
    error?: string;
  };
}
