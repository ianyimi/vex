import type { BaseField, BaseFieldInput } from "../baseTypes";
import type { MediaCollectionSlug } from "../../types/generated";
import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";

/**
 * Input configuration for an `upload()` field — the `to` parameter is required
 * and references the target media collection slug.
 */
export interface UploadFieldInput<
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
> extends BaseFieldInput<TFieldMeta> {
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
   * The min number of files allowed.
   */
  min?: number;
  /**
   * The max number of files allowed.
   */
  max?: number;
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
}

/**
 * Resolved upload field definition after defaults are applied.
 */
export interface UploadField<
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
> extends BaseField<TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.upload.type;
  to: MediaCollectionSlug;
  /**
   * Whether this input accepts multiple files or only one.
   */
  hasMany: boolean;
  /**
   * The min number of files allowed.
   */
  min: number;
  /**
   * The max number of files allowed.
   */
  max?: number;
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   */
  defaultValue?: string[];
  /**
   * Restrict files that can be uploaded by mimeType.
   */
  accept: string;
}
