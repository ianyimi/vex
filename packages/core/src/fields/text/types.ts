import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput, FieldAdminConfig } from "../baseTypes";

/**
 * Configuration input for a `text()` field.
 *
 * Text fields store short, single-line string values — titles, slugs, URLs,
 * email addresses, status labels, etc. All properties are optional; unset
 * properties fall back to the defaults listed below.
 *
 * **Defaults applied by `text()`:**
 * ```ts
 * {
 *   type:     "text",
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
 * // Minimal — label is inferred from the key ("Title")
 * title: text()
 *
 * // Required slug with length validation and a database index
 * slug: text({ required: true, minLength: 3, maxLength: 100, index: "by_slug" })
 *
 * // Author name with a placeholder hint shown in the admin form
 * authorName: text({
 *   required: true,
 *   admin: { width: "half", placeholder: "e.g. Jane Smith" }
 * })
 *
 * // Pre-filled default for a URL field
 * canonicalUrl: text({ defaultValue: "https://example.com" })
 * ```
 *
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`, `searchIndex`)
 */
export interface TextFieldInput extends BaseFieldInput {
  /**
   * Pre-filled value shown in the admin form when creating a new field.
   * Does not apply to database values
   *
   */
  defaultValue?: string;
  /** Minimum character length config. */
  min?: {
    /** Minimum character length value. */
    value: number;
    /** Minimum character length error message. */
    error?: string;
  };
  /** Maximum character length config. */
  max?: {
    /** Maximum character length value. */
    value: number;
    /** Maximum character length error message. */
    error?: string;
  };
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

/**
 * Resolved configuration for a `text()` field, after all defaults are applied.
 *
 * This is the type that framework adapters and field components receive —
 * `fieldDef` in `InputComponentProps<TextField>` and `CellComponentProps<TextField>`
 * is this type.
 *
 * @see {@link TextFieldInput} for the user-facing input type
 * @see {@link text} for the config function that produces this type
 */
export interface TextField extends BaseField {
  readonly type: typeof ADMIN_FIELDS.text.type;
  /** Display label shown in the admin form. Always set — inferred from the field key if not provided. */
  label: string;
  /** Whether this field is required in the database schema. */
  required: boolean;
  /** Resolved admin UI configuration with all defaults applied. */
  admin: FieldAdminConfig;
  /** Pre-filled value shown in the admin form when creating a new field. */
  defaultValue: string;
  /** Minimum allowed character length config. */
  min?: {
    /** Minimum allowed character length value. */
    value: number;
    /** Minimum allowed character length error message. */
    error?: string;
  };
  /** Maximum allowed character length config. */
  max?: {
    /** Maximum allowed character length value. */
    value: number;
    /** Maximum allowed character length error message. */
    error?: string;
  };
  /** Full-text search index configuration for this field. */
  searchIndex?: {
    /** Search index name — must be unique within the collection. */
    name: string;
    /** Fields to filter search results by. */
    filterFields: string[];
  };
}
