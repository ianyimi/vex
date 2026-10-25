import { ADMIN_FIELDS } from "../constants";
import {
  BaseField,
  BaseFieldInput,
  FieldAdminConfig,
  FieldAdminConfigInput,
  FieldLimit,
  FieldLimitInput,
  FieldSearchIndex,
  FieldValidateProps,
} from "../baseTypes";
import { VexResourceSlug } from "../../types";
import type { FieldMaskInput } from "../mask";

/** Per-type `admin` input for `text()` — adds `mask`. */
export interface TextFieldAdminInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> extends FieldAdminConfigInput<TCollectionSlug> {
  /**
   * An opt-in `use-mask-input` pattern (string, array of alternatives, or
   * `{ mask, storeMasked, options }`). `false` disables the project-wide
   * `fields.inputMasks.text` default for this field. @see {@link FieldMaskInput}
   */
  mask?: FieldMaskInput | false;
}

/** Resolved per-type `admin` for `text()`. */
export interface TextFieldAdminConfig<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> extends FieldAdminConfig<TCollectionSlug> {
  /** The field's own mask, or `false` to opt out of the project default. @see {@link TextFieldAdminInput.mask} */
  mask?: FieldMaskInput | false;
}

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
 *     width:         "100%",  // spans the full form width, not half
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
 * slug: text({ required: true, min: 3, max: 100, index: "by_slug" })
 *
 * // Author name with a placeholder hint shown in the admin form
 * authorName: text({
 *   required: true,
 *   admin: { width: "50%", placeholder: "e.g. Jane Smith" }
 * })
 *
 * // Pre-filled default for a URL field
 * canonicalUrl: text({ defaultValue: "https://example.com" })
 * ```
 *
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`)
 */
export interface TextFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TCollectionSlug, TFieldMeta> {
  /** Admin UI configuration for this field. */
  admin?: TextFieldAdminInput<TCollectionSlug>;
  /**
   * Pre-filled value shown in the admin form when creating a new field.
   * Does not apply to database values
   *
   */
  defaultValue?: string;
  /** Minimum character length. @see {@link FieldLimitInput} */
  min?: FieldLimitInput;
  /** Maximum character length. @see {@link FieldLimitInput} */
  max?: FieldLimitInput;
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
 * Resolved configuration for a `text()` field, after all defaults are applied.
 *
 * This is the type that framework adapters and field components receive —
 * `fieldDef` in `InputComponentProps<TextField>` and `CellComponentProps<TextField>`
 * is this type.
 *
 * @see {@link TextFieldInput} for the user-facing input type
 * @see {@link text} for the config function that produces this type
 */
export interface TextField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.text.type;
  /** Display label shown in the admin form. Always set — inferred from the field key if not provided. */
  label: string;
  /** Whether this field is required in the database schema. */
  required: boolean;
  /** Resolved admin UI configuration with all defaults applied. */
  admin: TextFieldAdminConfig<TCollectionSlug>;
  /** Pre-filled value shown in the admin form when creating a new field. */
  defaultValue: string;
  /** Minimum character length, with its resolved error message. @see {@link FieldLimit} */
  min?: FieldLimit;
  /** Maximum character length, with its resolved error message. @see {@link FieldLimit} */
  max?: FieldLimit;
  /** Full-text search index configuration for this field. @see {@link FieldSearchIndex} */
  searchIndex?: FieldSearchIndex;
  /** Server-only async validation with `value` typed as `string`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string>): Promise<void> | void;
}
