import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput, FieldAdminConfig } from "../baseTypes";

/**
 * Configuration input for a `checkbox()` field.
 *
 * Checkbox fields store boolean values — feature flags, opt-in toggles,
 * published states, and similar on/off settings. All properties are optional;
 * unset properties fall back to the defaults listed below.
 *
 * **Defaults applied by `checkbox()`:**
 * ```ts
 * {
 *   type:         "checkbox",
 *   label:        "",     // inferred from the field key by defineCollection
 *   required:     false,  // field is optional by default
 *   defaultValue: false,  // unchecked when creating a new document
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
 * // Minimal — label inferred from the key ("Published")
 * published: checkbox()
 *
 * // Checked by default when creating a new document
 * featured: checkbox({ defaultValue: true, admin: { width: "half" } })
 *
 * // Indexed flag for fast admin queries
 * archived: checkbox({ index: "by_archived" })
 * ```
 *
 * @see {@link CheckboxField} for the resolved type after defaults are applied
 * @see {@link checkbox} for the config function that applies defaults
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`, `searchIndex`)
 */
export interface CheckboxFieldInput extends BaseFieldInput {
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * Does not affect database values — only the form's initial state.
   */
  defaultValue?: boolean;
}

/**
 * Resolved configuration for a `checkbox()` field, after all defaults are applied.
 *
 * @see {@link CheckboxFieldInput} for the user-facing input type
 * @see {@link checkbox} for the config function that produces this type
 */
export interface CheckboxField extends BaseField {
  readonly type: typeof ADMIN_FIELDS.checkbox.type;
  /** Display label shown in the admin form. Always set — inferred from the field key if not provided. */
  label: string;
  /** Whether this field is required in the database schema. */
  required: boolean;
  /** Resolved admin UI configuration with all defaults applied. */
  admin: FieldAdminConfig;
  /** Pre-filled boolean value shown in the admin form when creating a new document. */
  defaultValue: boolean;
}
