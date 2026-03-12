import type { VexField } from "./fields";
import type { VexCollection, CollectionAdminConfig } from "./collections";

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
 * Keys of all default media fields auto-injected by `defineConfig()`.
 * Used as extra autocomplete keys in `CollectionAdminConfig` so that
 * `useAsTitle`, `defaultColumns`, etc. suggest both user fields and preset fields.
 */
export type DefaultMediaFieldKeys =
  | LockedMediaField
  | OverridableMediaField;

/**
 * A media collection definition. Users create these as plain objects.
 * Default media fields (storageId, filename, mimeType, size, url, alt, width, height)
 * are injected automatically by `defineConfig()`.
 *
 * The `fields` record contains ONLY user-defined additional fields or overrides
 * of overridable defaults (url, alt, width, height).
 */
export interface VexMediaCollection<
  TFields extends Record<string, VexField> = any,
> {
  readonly slug: string;
  fields?: TFields;
  tableName?: string;
  labels?: { singular?: string; plural?: string };
  admin?: CollectionAdminConfig<TFields, DefaultMediaFieldKeys>;
}

/**
 * Default media fields injected into every media collection by defineConfig().
 * Returns a fresh record each call to avoid mutation across collections.
 */
export function getDefaultMediaFields(): Record<string, VexField> {
  return {
    storageId: {
      type: "text",
      required: true,
      defaultValue: "",
      label: "Storage ID",
      admin: { hidden: true },
    },
    filename: {
      type: "text",
      required: true,
      defaultValue: "",
      label: "Filename",
      admin: { readOnly: true },
    },
    mimeType: {
      type: "text",
      required: true,
      defaultValue: "",
      label: "MIME Type",
      index: "by_mimeType",
      admin: { readOnly: true },
    },
    size: {
      type: "number",
      required: true,
      defaultValue: 0,
      label: "File Size (bytes)",
      admin: { readOnly: true },
    },
    url: {
      type: "text",
      required: true,
      defaultValue: "",
      label: "URL",
      admin: { readOnly: true },
    },
    alt: { type: "text", label: "Alt Text" },
    width: { type: "number", label: "Width (px)" },
    height: { type: "number", label: "Height (px)" },
  };
}

/**
 * The resolved media configuration on VexConfig.
 */
export interface MediaConfig {
  collections: VexCollection[];
  storageAdapter: FileStorageAdapter;
}

/**
 * Client-safe media configuration with non-serializable parts stripped.
 * Used when passing config across RSC serialization boundaries (e.g., to client components).
 */
export interface ClientMediaConfig {
  collections: VexCollection[];
}

/**
 * Input shape for the `media` field on VexConfigInput.
 */
export interface MediaConfigInput {
  collections: VexMediaCollection[];
  storageAdapter: FileStorageAdapter;
}
