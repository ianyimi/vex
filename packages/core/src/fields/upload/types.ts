import type { BaseField, BaseFieldInput, FieldLimit, FieldLimitInput, FieldValidateProps } from "../baseTypes";
import type { MediaCollectionSlug, VexResourceSlug } from "../../types/generated";
import { ADMIN_FIELDS, type FieldSchemaValidator } from "../constants";
import { SchemaOverrideInput } from "../baseTypes";
import { BaseFieldMeta } from "../types";

/**
 * Input configuration for an `upload()` field — the `to` parameter is required
 * and references the target media collection slug.
 */
export interface UploadFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  THasMany extends boolean = boolean,
> extends BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta> {
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
  hasMany?: THasMany;
  /**
   * Overrides the Convex storage shape for a single-file (`hasMany: false`)
   * upload: `"id"` stores `v.id("slug")` (`Id<"slug">`); `"string"` stores
   * `v.string()` (plain `string`). `never` when `hasMany: true`. Omitted:
   * storage is unchanged, `v.array(v.id("slug"))` even when `hasMany` is `false`.
   */
  schema?: SchemaOverrideInput<THasMany, Extract<FieldSchemaValidator, "id" | "string">>;
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   */
  defaultValue?: string | string[];
  /**
   * Restrict files that can be uploaded by mimeType.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/accept
   * @example 'image/*'
   * @example 'image/*, audio/mp4'
   * @example 'image/webp, audio/mp3'
   */
  accept?: string;
  /** Server-only async validation. `value` is the serialized id(s): a bare `string` for scalar storage, `string[]` otherwise. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string | string[]>): Promise<void> | void;
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
  /** Resolved storage override. Present only when the input set one. @see {@link UploadFieldInput.schema} */
  schema?: { validator: Extract<FieldSchemaValidator, "id" | "string"> };
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
  defaultValue?: string | string[];
  /**
   * Restrict files that can be uploaded by mimeType.
   */
  accept: string;
  /** Server-only async validation. `value` is the serialized id(s): a bare `string` for scalar storage, `string[]` otherwise. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string | string[]>): Promise<void> | void;
}
