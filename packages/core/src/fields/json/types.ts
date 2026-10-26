import type { BaseField, BaseFieldInput, FieldValidateProps } from "../baseTypes";
import type { VexResourceSlug } from "../../types";
import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";

/**
 * Configuration input for a `json()` field.
 *
 * Json fields store arbitrary JSON-serializable values — settings blobs,
 * feature flags, raw API payloads, anything with no fixed shape. There is no
 * shape/schema option: shape checks go through the field's own server
 * `validate()`. All properties are optional; unset properties fall back to
 * the defaults listed below.
 *
 * **Defaults applied by `json()`:**
 * ```ts
 * {
 *   type:     "json",
 *   label:    "",        // inferred from the field key by defineCollection
 *   required: false,     // field is optional by default
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width: "100%",  // spans the full form width, not half
 *     cellAlignment: "left",  // preview aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label inferred from the key ("Settings")
 * settings: json()
 *
 * // Required, with a seeded default shown in the admin form
 * theme: json({ required: true, defaultValue: { mode: "dark" } })
 * ```
 *
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`, `searchIndex`)
 */
export interface JsonFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
> extends BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta> {
  /**
   * Pre-filled value shown in the admin form when creating a new field.
   * Does not apply to database values.
   */
  defaultValue?: unknown;
  /** Server-only async validation with `value` typed as `unknown`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, unknown>): Promise<void> | void;
}

/**
 * Resolved configuration for a `json()` field, after all defaults are applied.
 *
 * This is the type that framework adapters and field components receive —
 * `fieldDef` in `FieldComponentProps<JsonField>` and `CellComponentProps<JsonField>`
 * is this type.
 *
 * @see {@link JsonFieldInput} for the user-facing input type
 * @see {@link json} for the config function that produces this type
 */
export interface JsonField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.json.type;
  /**
   * Pre-filled value shown in the admin form when creating a new field.
   * Does not apply to database values.
   */
  defaultValue?: unknown;
  /** Server-only async validation with `value` typed as `unknown`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, unknown>): Promise<void> | void;
}
