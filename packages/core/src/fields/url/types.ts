import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput } from "../baseTypes";

/**
 * Configuration input for a `url()` field.
 *
 * URL fields store absolute URLs as strings. All properties are optional;
 * unset properties fall back to the defaults listed below.
 *
 * **Defaults applied by `url()`:**
 * ```ts
 * {
 *   type:     "url",
 *   label:    "",       // inferred from the field key by defineCollection
 *   required: false,    // field is optional by default
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "full",  // spans the full form width, not half
 *     cellAlignment: "left",  // text aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label is inferred from the key ("Canonical Url")
 * canonicalUrl: url()
 *
 * // Required website URL with a length cap and a database index
 * website: url({ required: true, max: { value: 2048 }, index: "by_website" })
 *
 * // Social profile URL with a placeholder hint
 * twitterUrl: url({
 *   required: false,
 *   admin: { width: "half", placeholder: "https://twitter.com/username" }
 * })
 *
 * // Pre-filled default URL
 * homepageUrl: url({ defaultValue: "https://example.com" })
 * ```
 *
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`, `searchIndex`)
 */
export interface UrlFieldInput extends BaseFieldInput {
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * Does not affect existing database values.
   */
  defaultValue?: string;
}

/**
 * Resolved configuration for a `url()` field, after all defaults are applied.
 *
 * This is the type that framework adapters and field components receive —
 * `fieldDef` in `InputComponentProps<UrlField>` and `CellComponentProps<UrlField>`
 * is this type.
 *
 * @see {@link UrlFieldInput} for the user-facing input type
 * @see {@link url} for the config function that produces this type
 */
export interface UrlField extends BaseField {
  readonly type: typeof ADMIN_FIELDS.url.type;
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * `undefined` means no default is applied — the input starts empty.
   */
  defaultValue?: string;
}
