import type { BaseField, BaseFieldInput, FieldLimit, FieldLimitInput, FieldValidateProps } from "../baseTypes";
import type { MediaCollectionSlug, VexResourceSlug } from "../../types/generated";
import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";

/**
 * Input configuration for an `upload()` field — the `to` parameter is required
 * and references the target media collection slug.
 */
export interface UploadFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
> extends BaseFieldInput<TCollectionSlug, TFieldMeta> {
  /**
   * The slug of the media collection that stores uploaded files for this field.
   *
   * Must match a media collection defined via a storage adapter's
   * `defineMediaCollection()`. After running `vex generate`, this is typed as
   * `MediaCollectionSlug` — a union of all media collection slugs in the project.
   * Before generation, it falls back to `string`.
   *
   * Config validation (in `media/config.ts`) also checks at runtime that the
   * slug exists in `VexConfig.mediaCollections`.
   *
   * @example
   * ```ts
   * upload({ to: "images", label: "Featured Image" })
   */
  to: MediaCollectionSlug;
  /**
   * Minimum number of files allowed. Absent — the default — means no minimum.
   * @see {@link FieldLimitInput}
   */
  min?: FieldLimitInput;
  /**
   * Maximum number of files allowed.
   * @see {@link FieldLimitInput}
   */
  max?: FieldLimitInput;
  /**
   * Whether this input accepts multiple files or only one.
   */
  hasMany?: boolean;
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   */
  defaultValue?: string[];
  /**
   * Restrict files that can be uploaded by mimeType.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/accept
   * @example 'image/*'
   * @example 'image/*, audio/mp4'
   * @example 'image/webp, audio/mp3'
   */
  accept?: string;
  /** Server-only async validation with `value` typed as `string[]`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string[]>): Promise<void> | void;
}

/**
 * Resolved upload field definition after defaults are applied.
 */
export interface UploadField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.upload.type;
  to: MediaCollectionSlug;
  /**
   * Whether this input accepts multiple files or only one.
   */
  hasMany: boolean;
  /**
   * Minimum number of files allowed, with its resolved error message.
   * Absent means no minimum — upload's resolved `min` no longer defaults to `0`.
   * @see {@link FieldLimit}
   */
  min?: FieldLimit;
  /**
   * Maximum number of files allowed, with its resolved error message.
   * @see {@link FieldLimit}
   */
  max?: FieldLimit;
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   */
  defaultValue?: string[];
  /**
   * Restrict files that can be uploaded by mimeType.
   */
  accept: string;
  /** Server-only async validation with `value` typed as `string[]`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string[]>): Promise<void> | void;
}
