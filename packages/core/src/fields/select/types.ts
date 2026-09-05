import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput } from "../baseTypes";

/**
 * Configuration input for a `select()` field.
 *
 * Select fields store an array of chosen option values — status labels, categories,
 * tags, or any enumerable set. All properties are optional; unset properties fall
 * back to the defaults listed below.
 *
 * **Defaults applied by `select()`:**
 * ```ts
 * {
 *   type:         "select",
 *   label:        "",    // inferred from the field key by defineCollection
 *   required:     false, // field is optional by default
 *   defaultValue: [],    // empty selection
 *   options:      [],    // no options configured
 *   hasMany:      false, // single-select by default
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "full",  // spans the full form width, not half
 *     cellAlignment: "left",  // aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Single-select status
 * tier: select({
 *   required: true,
 *   options: [
 *     { label: "Free", value: "free" },
 *     { label: "Pro", value: "pro" },
 *   ],
 * })
 *
 * // Multi-select tags with badge colours
 * tags: select({
 *   hasMany: true,
 *   options: [
 *     { label: "News", value: "news", badgeColor: "#3b82f6" },
 *     { label: "Tutorial", value: "tutorial", badgeColor: "#10b981" },
 *   ],
 * })
 * ```
 *
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`)
 */
export interface SelectFieldInput<
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TFieldMeta> {
  /**
   * Pre-filled value shown in the admin form when creating a new field.
   * Does not apply to database values
   *
   */
  defaultValue?: string[];
  options?: {
    label: string;
    value: string;
    badgeColor?: string;
  }[];
  hasMany?: boolean;
  optionInterfaceName?: string;
}

/**
 * Resolved configuration for a `select()` field, after all defaults are applied.
 *
 * This is the type that framework adapters and field components receive —
 * `fieldDef` in `InputComponentProps<SelectField>` and `CellComponentProps<SelectField>`
 * is this type.
 *
 * @see {@link SelectFieldInput} for the user-facing input type
 * @see {@link select} for the config function that produces this type
 */
export interface SelectField<TFieldMeta extends {} = {}> extends BaseField<TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.select.type;
  /** Pre-filled value shown in the admin form when creating a new field. */
  defaultValue: string[];
  options: {
    label: string;
    value: string;
    badgeColor?: string;
  }[];
  hasMany: boolean;
  optionInterfaceName?: string;
}
