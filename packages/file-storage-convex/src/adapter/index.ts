import type { GenericMutationCtx, GenericQueryCtx, GenericDataModel } from "convex/server";
import type {
  MediaCollectionConfig,
  GenerateUploadUrlReturn,
  GetUrlReturn,
  UploadFileReturn,
} from "@vexcms/core";
import { StorageAdapterPresignedUrl, STORAGE_ADAPTER_PROTOCOLS } from "@vexcms/core";
import { type ConvexFileStorageOptions } from "../config";
import Methods from "./methods";

import { uploadFile } from "./uploadFile";

export * from "./methods";
export * from "./uploadFile";

/**
 * Convex storage adapter class — extends BaseStorageAdapter.
 *
 * All adapter methods accept the Convex `ctx` as the first parameter,
 * allowing access to `ctx.db`, `ctx.storage`, and other context methods.
 *
 * @example
 * ```ts
 * // apps/www/app/admin/layout.tsx
 * import { ConvexStorageAdapter } from "@vexcms/file-storage-convex/adapter";
 *
 * const adapter = new ConvexStorageAdapter({ mediaCollections: [images] });
 * return <AdminPanel adapterClient={adapter}>{children}</AdminPanel>;
 * ```
 */
export class ConvexStorageAdapter extends StorageAdapterPresignedUrl {
  readonly name = "convex";
  readonly type = STORAGE_ADAPTER_PROTOCOLS.presignedUrl;
  readonly mediaCollections: MediaCollectionConfig[];
  admin = { softDelete: false };

  /**
   * Creates a new `ConvexStorageAdapter` instance.
   *
   * @param options - Adapter configuration including media collections and soft-delete behaviour.
   */
  constructor(options: ConvexFileStorageOptions) {
    super();
    this.admin.softDelete = options.admin?.softDelete ?? false;
    this.mediaCollections = options.mediaCollections.map((mediaCollection) => ({
      ...mediaCollection,
      meta: {
        ...mediaCollection.meta,
        storageAdapter: this.name,
      },
    }));
  }

  /**
   * Generates a presigned upload URL via `ctx.storage.generateUploadUrl()`.
   *
   * @param ctx - Convex mutation context.
   * @returns Promise resolving to `{ url: string }` — POST the file body to this URL.
   */
  async generateUploadUrl<TDataModel extends GenericDataModel = GenericDataModel>(
    ctx: GenericMutationCtx<TDataModel>,
  ): Promise<GenerateUploadUrlReturn> {
    return await Methods.generateUploadUrl(ctx);
  }

  /**
   * Inserts a media document into the target collection table after a file upload completes.
   *
   * @param ctx - Convex mutation context.
   * @param args - Document fields: `collectionSlug`, `storageId`, `filename`, `mimeType`, `size`, optional `alt` and `adapterFields`.
   * @returns Promise resolving to the new media document ID as a string.
   */
  async createMediaDocument<TDataModel extends GenericDataModel = GenericDataModel>(
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
  ): Promise<string> {
    return await Methods.createMediaDocument(ctx, args);
  }

  /**
   * Deletes a media document — physically removes the file from Convex storage
   * unless `softDelete` (or `this.admin.softDelete`) is `true`, in which case
   * the document is patched with `{ deleted: true }`.
   *
   * @param ctx - Convex mutation context.
   * @param args - `collectionSlug`, `mediaId`, and optional `softDelete` override.
   * @returns Promise resolving to `true` if the document was found and processed.
   */
  async deleteMedia<TDataModel extends GenericDataModel = GenericDataModel>(
    ctx: GenericMutationCtx<TDataModel>,
    args: {
      collectionSlug: string;
      mediaId: string;
      softDelete?: boolean;
    },
  ): Promise<boolean> {
    return await Methods.deleteMedia(ctx, {
      ...args,
      softDelete: args?.softDelete ?? this.admin.softDelete,
    });
  }

  /**
   * Resolves a serving URL for a media document by looking up its `storageId`
   * and calling `ctx.storage.getUrl()`.
   *
   * @param ctx - Convex query context.
   * @param args - `collectionSlug` and `mediaId` of the target media document.
   * @returns Promise resolving to `{ url }` on success or `{ error }` if the document or file is not found.
   */
  async getUrl<TDataModel extends GenericDataModel = GenericDataModel>(
    ctx: GenericQueryCtx<TDataModel>,
    args: {
      collectionSlug: string;
      mediaId: string;
    },
  ): Promise<GetUrlReturn> {
    return await Methods.getUrl(ctx, args);
  }

  /**
   * POSTs a file to the presigned upload URL returned by `generateUploadUrl`.
   *
   * Runs in the browser — no Convex context required.
   *
   * @param file - The `File` object to upload.
   * @param uploadUrl - Presigned URL from `generateUploadUrl`.
   * @returns Promise resolving to `{ storageId }` assigned by Convex storage.
   */
  async uploadFile(file: File, uploadUrl: string): Promise<UploadFileReturn> {
    return await uploadFile(file, uploadUrl);
  }
}
