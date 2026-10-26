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

/** Per-type `admin` input for `email()` — adds `mask`. */
export interface EmailFieldAdminInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> extends FieldAdminConfigInput<TCollectionSlug> {
  /**
   * An opt-in input mask, or `false` to opt out of the project default — see
   * {@link TextFieldAdminInput.mask} for the full contract. A masked email
   * field renders `type="text"` instead of `type="email"`.
   */
  mask?: FieldMaskInput | false;
}

/** Resolved per-type `admin` for `email()`. */
export interface EmailFieldAdminConfig<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> extends FieldAdminConfig<TCollectionSlug> {
  /** The field's own mask, or `false` to opt out of the project default. @see {@link EmailFieldAdminInput.mask} */
  mask?: FieldMaskInput | false;
}

/**
 * Configuration input for an `email()` field.
 *
 * Email fields store single-line email address strings. All properties are
 * optional; unset properties fall back to the defaults listed below.
 *
 * **Defaults applied by `email()`:**
 * ```ts
 * {
 *   type:     "email",
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
 * // Minimal — label is inferred from the key ("Contact Email")
 * contactEmail: email()
 *
 * // Required with a length cap and a database index
 * workEmail: email({ required: true, max: 254, index: "by_work_email" })
 *
 * // Custom length-error message via the [value, error] tuple
 * supportEmail: email({ min: [5, "That's too short to be an email."] })
 *
 * // Full-text searchable (partial matches, e.g. in a relationship picker)
 * email: email({ searchIndex: { name: "search_email", filterFields: [] } })
 * ```
 *
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`)
 */
export interface EmailFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta> {
  /** Admin UI configuration for this field. */
  admin?: EmailFieldAdminInput<TCollectionSlug>;
  /**
   * Pre-filled value shown in the admin form when creating a new field.
   * Does not apply to database values.
   */
  defaultValue?: string;
  /** Minimum character length, applied to the email string itself. */
  min?: FieldLimitInput;
  /** Maximum character length, applied to the email string itself. */
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
 * Resolved configuration for an `email()` field, after all defaults are applied.
 *
 * This is the type that framework adapters and field components receive —
 * `fieldDef` in `InputComponentProps<EmailField>` and `CellComponentProps<EmailField>`
 * is this type.
 *
 * @see {@link EmailFieldInput} for the user-facing input type
 * @see {@link email} for the config function that produces this type
 */
export interface EmailField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.email.type;
  /** Resolved admin UI configuration with all defaults applied. */
  admin: EmailFieldAdminConfig<TCollectionSlug>;
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * `undefined` means no default is applied — the input starts empty.
   */
  defaultValue?: string;
  /** Resolved minimum character length, with a value-aware default error message. */
  min?: FieldLimit;
  /** Resolved maximum character length, with a value-aware default error message. */
  max?: FieldLimit;
  /** Full-text search index configuration for this field. @see {@link FieldSearchIndex} */
  searchIndex?: FieldSearchIndex;
  /** Server-only async validation with `value` typed as `string`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string>): Promise<void> | void;
}
