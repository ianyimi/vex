import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";
import type { CollectionConfig, CollectionConfigInput } from "../collections";
import type { BaseFieldMeta, ComponentHKT } from "../fields";
import type { MediaCollectionSlug, StorageAdapterSlug } from "../types";

/**
 * Metadata attached to every media collection linking it to a specific storage adapter.
 *
 * Set by `defineMediaCollection()` and tagged onto each collection by the
 * adapter when it processes its `mediaCollections` array. Core uses
 * `storageAdapter` to route upload, delete, and URL operations to the
 * correct adapter at runtime.
 */
export type MediaCollectionMeta = {
  /**
   * Which storage adapter this collection is linked to specifically. "convex" supported by default
   */
  storageAdapter: StorageAdapterSlug;
};

/**
 * Configuration input for a `defineMediaCollection()` call.
 *
 * Identical to `CollectionConfigInput` except `fields` is omitted — media
 * collections have a fixed set of system fields (`alt`, `filename`, `mimeType`,
 * `size`, `storageId`, `deleted`, `convexUrl`, `width`, `height`) that
 * `defineMediaCollection()` always injects. Pass extra custom fields via the
 * `fields` override on `defineMediaCollection()`.
 *
 * @example
 * ```ts
 * const images = defineMediaCollection({
 *   slug: "images",
 *   labels: { singular: "Image", plural: "Images" },
 * });
 * ```
 *
 * @see {@link MediaCollectionConfig} for the resolved type after defaults are applied
 * @see {@link defineMediaCollection} from `@vexcms/file-storage-convex`
 */
export type MediaCollectionConfigInput<
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TCollectionMeta extends MediaCollectionMeta = MediaCollectionMeta,
  TCollectionSlug extends MediaCollectionSlug = MediaCollectionSlug,
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
> = Omit<
  CollectionConfigInput<TFieldMeta, TCollectionMeta, TCollectionSlug, TFieldSlug, TComponent>,
  "fields"
>;

/**
 * Resolved media collection configuration after `defineMediaCollection()` applies system fields and defaults.
 *
 * Structurally identical to `CollectionConfig` — all schema generation, admin
 * panel rendering, and query helpers work against this type. Media collections
 * are stored in `VexConfig.mediaCollections` separately from user-defined
 * `collections` and appear under a dedicated "Media" section in the admin panel.
 *
 * @see {@link MediaCollectionConfigInput} for the user-facing input type
 * @see {@link defineMediaCollection} from `@vexcms/file-storage-convex`
 */
export type MediaCollectionConfig<
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TCollectionMeta extends MediaCollectionMeta = MediaCollectionMeta,
  TCollectionSlug extends MediaCollectionSlug = MediaCollectionSlug,
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
> = CollectionConfig<TFieldMeta, TCollectionMeta, TCollectionSlug, TFieldSlug, TComponent>;

/**
 * Error thrown when storage configuration is invalid.
 *
 * Covers: missing required fields on media collections, slug collisions
 * (between collections and media collections, or across adapters), upload
 * fields referencing non-existent media collections, or `upload()` used
 * without a configured storage adapter.
 */
export class VexStorageConfigError extends Error {
  /**
   * @param message — Human-readable description of the configuration error.
   */
  constructor(message: string) {
    super(message);
    this.name = "VexStorageConfigError";
  }
}

/** Protocol type for file upload methods. */
export const STORAGE_ADAPTER_PROTOCOLS = {
  presignedUrl: "presigned-url",
  // directUpload: "direct-upload",
  // streaming: "streaming",
} as const;
/** Protocol type for file upload methods. */
export type StorageAdapterProtocol =
  (typeof STORAGE_ADAPTER_PROTOCOLS)[keyof typeof STORAGE_ADAPTER_PROTOCOLS];

/**
 * Return type for `getUrl` — either a resolved URL or an error message, never both.
 */
export type GetUrlReturn = { url: string; error?: never } | { url?: never; error: string };
/**
 * Shared interface implemented by all storage adapters.
 *
 * Defines the minimum contract — `name`, `type`, `mediaCollections`, and the
 * four lifecycle methods (`createMediaDocument`, `deleteMedia`, `getUrl`,
 * `uploadFile`) — that every adapter must satisfy regardless of protocol.
 *
 * @see {@link StorageAdapterPresignedUrlInterface} for the presigned-URL sub-interface
 * @see {@link StorageAdapterPresignedUrl} for the abstract base class
 */
export interface StorageAdapterBaseInterface {
  /** Protocol name — tells the admin panel what the identifier of this storage adapter is. */
  readonly name: StorageAdapterSlug;
  /** Protocol type — tells the admin panel how to upload files. */
  readonly type: StorageAdapterProtocol;

  /**
   * Processed media collections ready for schema generation and admin panel.
   *
   * The adapter validates, augments, and returns these collections. Each
   * collection is tagged with `meta.storageAdapterName` equal to this adapter's
   * `name`. Core merges all collections from all adapters into
   * `VexConfig.mediaCollections` — separate from user-defined `collections`.
   */
  mediaCollections: MediaCollectionConfig[];

  admin: {
    /**
     * When `true`, delete operations set `deleted: true` on the media document
     * instead of physically removing the file. The file remains in storage until
     * a scheduled cleanup job purges it.
     *
     * @default false
     */
    softDelete: boolean;
  };

  /**
   * Creates a media document in Convex after the file is uploaded.
   * All adapters must use this exact signature.
   */
  createMediaDocument<TDataModel extends GenericDataModel = GenericDataModel>(
    ctx: GenericMutationCtx<TDataModel>,
    args: {
      collectionSlug: string;
      storageId: string;
      filename: string;
      mimeType: string;
      size: number;
      alt?: string;
      adapterFields?: Record<string, unknown>;
    },
  ): Promise<string>;

  /**
   * Deletes a media document and its file from storage.
   * All adapters must use this exact signature.
   */
  deleteMedia<TDataModel extends GenericDataModel = GenericDataModel>(
    ctx: GenericMutationCtx<TDataModel>,
    args: { collectionSlug: string; mediaId: string; softDelete?: boolean },
  ): Promise<boolean>;

  /**
   * Returns a URL for a media file.
   * All adapters must use this exact signature.
   */
  getUrl<TDataModel extends GenericDataModel = GenericDataModel>(
    ctx: GenericQueryCtx<TDataModel>,
    args: { collectionSlug: string; mediaId: string },
  ): Promise<GetUrlReturn>;

  /**
   * Uploads a file to the storage backend and returns the storage ID.
   *
   * This is a pure JS function that can be called from any framework
   * (React, Next.js, Svelte, etc.) or even directly in the browser.
   *
   * @param file - The file to upload
   * @param uploadUrl - The presigned URL from generateUploadUrl
   * @returns Promise resolving to { storageId, url, ... } with adapter-specific fields
   *
   * @example
   * ```ts
   * // React component
   * const { storageId } = await adapter.uploadFile(file, uploadUrl);
   * await createMediaDocument({ storageId, ... });
   * ```
   */
  uploadFile(
    file: any,
    uploadUrl: string,
  ): Promise<{
    storageId: string;
    url?: string;
    [key: string]: unknown; // Adapter-specific fields
  }>;
}

/**
 * Return type for `generateUploadUrl` — the upload URL and an optional adapter-assigned storage ID.
 */
export type GenerateUploadUrlReturn = {
  url: string;
  storageId?: string;
};
/**
 * Return type for `uploadFile` — the adapter-assigned storage ID, an optional public URL,
 * and any adapter-specific fields (e.g. Cloudinary `public_id`, S3 `key`).
 */
export type UploadFileReturn = {
  storageId: string;
  url?: string;
  [key: string]: unknown; // Adapter-specific fields
};
/**
 * Storage adapter interface for the presigned-URL upload protocol.
 *
 * Extends `StorageAdapterBaseInterface` with `generateUploadUrl` — the client
 * requests a short-lived URL from the server, POSTs the file directly to
 * storage, then calls `createMediaDocument` with the returned `storageId`.
 *
 * @see {@link StorageAdapterBaseInterface} for the shared base contract
 * @see {@link StorageAdapterPresignedUrl} for the abstract base class to extend
 */
export interface StorageAdapterPresignedUrlInterface extends StorageAdapterBaseInterface {
  readonly type: (typeof STORAGE_ADAPTER_PROTOCOLS)["presignedUrl"];

  /**
   * Generates a URL to upload a file to. Returns different shapes per protocol:
   * - presigned-url: `{ url: string }` — POST the file to this URL
   * - direct-upload: `{ url: string; storageId?: string }` — PUT the file to this URL
   * - streaming: `{ url: string; storageId?: string }` — resumable upload session
   */
  generateUploadUrl<TDataModel extends GenericDataModel = GenericDataModel>(
    ctx: GenericMutationCtx<TDataModel>,
  ): Promise<GenerateUploadUrlReturn>;

  /**
   * Uploads a file to the storage backend and returns the storage ID.
   *
   * This is a pure JS function that can be called from any framework
   * (React, Next.js, Svelte, etc.) or even directly in the browser.
   *
   * @param file - The file to upload
   * @param uploadUrl - The presigned URL from generateUploadUrl
   * @returns Promise resolving to { storageId, url, ... } with adapter-specific fields
   *
   * @example
   * ```ts
   * // React component
   * const { storageId } = await adapter.uploadFile(file, uploadUrl);
   * await createMediaDocument({ storageId, ... });
   * ```
   */
  uploadFile(file: any, uploadUrl: string): Promise<UploadFileReturn>;
}

/**
 * Base class for storage adapters.
 *
 * All file storage adapters must extend this class to ensure consistent
 * behavior in the admin panel. Adapters override methods to implement
 * adapter-specific logic (e.g., different storage backends).
 *
 * @example
 * ```ts
 * // In file-storage-convex/src/adapter/index.ts
 * import { BaseStorageAdapter } from "@vexcms/core";
 *
 * export class ConvexStorageAdapter extends BaseStorageAdapter {
 *   readonly name = "convex";
 *
 *   async generateUploadUrl(ctx) {
 *     const url = await ctx.storage.generateUploadUrl();
 *     return { url };
 *   }
 *
 *   // Override other methods as needed...
 * }
 * ```
 */
export abstract class StorageAdapterPresignedUrl implements StorageAdapterPresignedUrlInterface {
  /** Protocol name — tells the admin panel what the identifier of this storage adapter is. */
  abstract readonly name: StorageAdapterSlug;
  /** Protocol type — tells the admin panel how to upload files. */
  abstract readonly type: StorageAdapterProtocol;

  abstract mediaCollections: MediaCollectionConfig[];

  abstract admin: { softDelete: boolean };

  /**
   * Generates a URL to upload a file to.
   * Override in subclass for adapter-specific implementation.
   */
  abstract generateUploadUrl<TDataModel extends GenericDataModel = GenericDataModel>(
    ctx: GenericMutationCtx<TDataModel>,
  ): Promise<{ url: string; storageId?: string }>;

  /**
   * Creates a media document in Convex after the file is uploaded.
   * Override in subclass for adapter-specific implementation.
   */
  abstract createMediaDocument<TDataModel extends GenericDataModel = GenericDataModel>(
    ctx: GenericMutationCtx<TDataModel>,
    args: {
      collectionSlug: string;
      storageId: string;
      filename: string;
      mimeType: string;
      size: number;
      alt?: string;
      adapterFields?: Record<string, unknown>;
    },
  ): Promise<string>;

  /**
   * Deletes a media document and its file from storage.
   * Override in subclass for adapter-specific implementation.
   */
  abstract deleteMedia<TDataModel extends GenericDataModel = GenericDataModel>(
    ctx: GenericMutationCtx<TDataModel>,
    args: {
      collectionSlug: string;
      mediaId: string;
      softDelete?: boolean;
    },
  ): Promise<boolean>;

  /**
   * Returns a URL for a media file.
   * Override in subclass for adapter-specific implementation.
   */
  abstract getUrl<TDataModel extends GenericDataModel = GenericDataModel>(
    ctx: GenericQueryCtx<TDataModel>,
    args: {
      collectionSlug: string;
      mediaId: string;
    },
  ): Promise<{ url: string; error?: never } | { url?: never; error: string }>;

  /**
   * Uploads a file to the storage backend and returns the storage ID.
   *
   * This is a pure JS function that can be called from any framework
   * (React, Next.js, Svelte, etc.) or even directly in the browser.
   *
   * @param file - The file to upload
   * @param uploadUrl - The presigned URL from generateUploadUrl
   * @returns Promise resolving to { storageId, url, ... } with adapter-specific fields
   *
   * @example
   * ```ts
   * // React component
   * const { storageId } = await adapter.uploadFile(file, uploadUrl);
   * await createMediaDocument({ storageId, ... });
   * ```
   */
  abstract uploadFile(
    file: any,
    uploadUrl: string,
  ): Promise<{
    storageId: string;
    url?: string;
    [key: string]: unknown; // Adapter-specific fields
  }>;
}

/**
 * Union of all supported storage adapter interface types.
 *
 * Currently only presigned-URL adapters are supported. Extend this union
 * as new upload protocols are added.
 *
 * @see {@link StorageAdapterPresignedUrlInterface}
 */
export type VexStorageAdapter = StorageAdapterPresignedUrlInterface;
