import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput, FieldAdminConfig, FieldAdminConfigInput, FieldLimit, FieldLimitInput, FieldValidateProps } from "../baseTypes";
import type { VexResourceSlug } from "../../types/generated";
import type { FieldMaskInput } from "../mask";

/** Per-type `admin` input for `url()` — adds `mask`. */
export interface UrlFieldAdminInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> extends FieldAdminConfigInput<TCollectionSlug> {
  /**
   * An opt-in input mask, or `false` to opt out of the project default — see
   * {@link TextFieldAdminInput.mask} for the full contract.
   */
  mask?: FieldMaskInput | false;
}

/** Resolved per-type `admin` for `url()`. */
export interface UrlFieldAdminConfig<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> extends FieldAdminConfig<TCollectionSlug> {
  /** The field's own mask, or `false` to opt out of the project default. @see {@link UrlFieldAdminInput.mask} */
  mask?: FieldMaskInput | false;
}

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
 *     width: "100%",  // spans the full form width, not half
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
 * website: url({ required: true, max: 2048, index: "by_website" })
 *
 * // Social profile URL with a placeholder hint
 * twitterUrl: url({
 *   required: false,
 *   admin: { width: "50%", placeholder: "https://twitter.com/username" }
 * })
 *
 * // Pre-filled default URL
 * homepageUrl: url({ defaultValue: "https://example.com" })
 * ```
 *
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`, `searchIndex`)
 */
export interface UrlFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta> {
  /** Admin UI configuration for this field. */
  admin?: UrlFieldAdminInput<TCollectionSlug>;
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * Does not affect existing database values.
   */
  defaultValue?: string;
  /** Minimum character length. @see {@link FieldLimitInput} */
  min?: FieldLimitInput;
  /** Maximum character length. @see {@link FieldLimitInput} */
  max?: FieldLimitInput;
  /** Server-only async validation with `value` typed as `string`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string>): Promise<void> | void;
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
export interface UrlField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.url.type;
  /** Resolved admin UI configuration with all defaults applied. */
  admin: UrlFieldAdminConfig<TCollectionSlug>;
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * `undefined` means no default is applied — the input starts empty.
   */
  defaultValue?: string;
  /** Minimum character length, with its resolved error message. @see {@link FieldLimit} */
  min?: FieldLimit;
  /** Maximum character length, with its resolved error message. @see {@link FieldLimit} */
  max?: FieldLimit;
  /** Server-only async validation with `value` typed as `string`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string>): Promise<void> | void;
}
