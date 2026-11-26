import type { BaseField, BaseFieldInput, FieldValidateProps } from "../baseTypes";
import type { VexResourceSlug } from "../../types";
import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";

/** Default `maxSize` for a `bytes()` field with no override — 512 KiB. */
export const BYTES_FIELD_DEFAULT_MAX_SIZE = 524_288;

/**
 * Configuration input for a `bytes()` field.
 *
 * Bytes fields store a raw binary payload (`v.bytes()` — an `ArrayBuffer`) read
 * client-side into memory, rather than uploaded to a media collection. All
 * properties are optional; unset properties fall back to the defaults listed
 * below.
 *
 * **Defaults applied by `bytes()`:**
 * ```ts
 * {
 *   type:     "bytes",
 *   label:    "",        // inferred from the field key by defineCollection
 *   required: false,     // field is optional by default
 *   maxSize:  524_288,    // 512 KiB
 *   accept:   "",         // no file-type restriction
 *   admin: {
 *     hidden:        false,
 *     readOnly:      false,
 *     position:      "main",
 *     width: "100%",
 *     cellAlignment: "left",
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label inferred from the key ("Payload")
 * payload: bytes()
 *
 * // A smaller limit and a file-type restriction
 * thumbnail: bytes({ maxSize: 65_536, accept: "image/*" })
 * ```
 *
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`, `searchIndex`)
 */
export interface BytesFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
> extends BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta> {
  /**
   * Maximum accepted payload size, in bytes. A file (or committed hex value)
   * over this size is rejected with a message, both in the admin form and by
   * the field's own Zod input schema.
   * @default 524_288
   */
  maxSize?: number;
  /**
   * Restricts the admin form's File tab picker/dropzone by mimeType — same
   * grammar as `upload()`'s `accept`.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/accept
   */
  accept?: string;
  /**
   * Pre-filled value shown in the admin form when creating a new field. Does
   * not apply to database values.
   */
  defaultValue?: ArrayBuffer;
  /** Server-only async validation with `value` typed as `ArrayBuffer`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, ArrayBuffer>): Promise<void> | void;
}

/**
 * Resolved configuration for a `bytes()` field, after all defaults are applied.
 *
 * @see {@link BytesFieldInput} for the user-facing input type
 * @see {@link bytes} for the config function that produces this type
 */
export interface BytesField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.bytes.type;
  /** Maximum accepted payload size, in bytes. @default 524_288 */
  maxSize: number;
  /** Restricts the admin form's File tab picker/dropzone by mimeType. */
  accept: string;
  /** Pre-filled value shown in the admin form when creating a new document. */
  defaultValue?: ArrayBuffer;
  /** Server-only async validation with `value` typed as `ArrayBuffer`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, ArrayBuffer>): Promise<void> | void;
}
