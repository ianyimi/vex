import type { VexField } from "./fields";
import type { AnyVexCollection, CollectionAdminConfig } from "./collections";

/**
 * Interface that file storage plugins must implement.
 * Each method operates on the storage provider (e.g., Convex file storage, S3, Cloudinary).
 */
export interface FileStorageAdapter {
  /** Identifier for the storage provider (e.g., "convex", "s3", "cloudinary"). */
  readonly name: string;

  /**
   * The Convex value type string for the storageId field in media collections.
   * Determines the schema type at generation time.
   *
   * - Convex adapter: `'v.id("_storage")'` — typed reference to Convex file storage
   * - Generic adapters: `'v.string()'` — plain string for external storage URLs/IDs
   */
  readonly storageIdValueType: string;

  /**
   * Get a presigned upload URL from the storage provider.
   * Called by the admin panel before uploading a file.
   *
   * @returns A URL string that accepts file uploads via PUT/POST.
   */
  getUploadUrl: () => Promise<string>;

  /**
   * Resolve a storage ID to an accessible URL.
   *
   * @param props.storageId - The storage provider's file identifier.
   * @returns A URL string for accessing the file, or null if the file doesn't exist.
   */
  getUrl: (props: { storageId: string }) => Promise<string | null>;

  /**
   * Delete a file from the storage provider.
   *
   * @param props.storageId - The storage provider's file identifier.
   */
  deleteFile: (props: { storageId: string }) => Promise<void>;
}

/**
 * Fields that are auto-injected into every media collection and cannot be overridden.
 */
export const LOCKED_MEDIA_FIELDS = [
  "storageId",
  "filename",
  "mimeType",
  "size",
] as const;
export type LockedMediaField = (typeof LOCKED_MEDIA_FIELDS)[number];

/**
 * Fields that are auto-injected but CAN be overridden by the user.
 */
export const OVERRIDABLE_MEDIA_FIELDS = [
  "url",
  "alt",
  "width",
  "height",
] as const;
export type OverridableMediaField = (typeof OVERRIDABLE_MEDIA_FIELDS)[number];

/**
 * Keys of all default media fields auto-injected by `defineMediaCollection()`.
 * Used as extra autocomplete keys in `CollectionAdminConfig` so that
 * `useAsTitle`, `defaultColumns`, etc. suggest both user fields and preset fields.
 */
export type DefaultMediaFieldKeys =
  | LockedMediaField
  | OverridableMediaField;

/**
 * Configuration for a media collection.
 * The `fields` record contains ONLY user-defined additional fields or overrides
 * of overridable defaults. Locked fields are auto-injected by `defineMediaCollection()`.
 */
export interface MediaCollectionConfig<
  TFields extends Record<string, VexField> = Record<never, VexField>,
> {
  fields?: TFields;
  tableName?: string;
  labels?: { singular?: string; plural?: string };
  admin?: CollectionAdminConfig<TFields, DefaultMediaFieldKeys>;
}

/**
 * The resolved media configuration on VexConfig.
 */
export interface MediaConfig {
  collections: AnyVexCollection[];
  storageAdapter: FileStorageAdapter;
}

/**
 * Client-safe media configuration with non-serializable parts stripped.
 * Used when passing config across RSC serialization boundaries (e.g., to client components).
 */
export interface ClientMediaConfig {
  collections: AnyVexCollection[];
}

/**
 * Input shape for the `media` field on VexConfigInput.
 */
export interface MediaConfigInput {
  collections: AnyVexCollection[];
  storageAdapter: FileStorageAdapter;
}
