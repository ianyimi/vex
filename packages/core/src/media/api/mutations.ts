import { GenericDataModel } from "convex/server";
import { VexStorageConfigError } from "../types";
import type {
  CreateMediaDocumentServerArgs,
  DeleteMediaServerArgs,
  GenerateUploadUrlServerArgs,
} from "./types";
import { CRUD_ACTIONS, hasPermission } from "../../access";
import { resolveCollectionSlug } from "../../api/utils";
import { type GenericId } from "convex/values";
import { CollectionSlug } from "../../types";

/**
 * Generates a URL to upload a file to the storage adapter.
 * Server-side only — call inside a Convex mutation handler.
 *
 * Looks up the adapter by name from `args.config.storage?.adapters` and
 * calls `adapter.generateUploadUrl(ctx)`.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, adapter }`.
 * @returns Promise resolving to `{ url: string }` — the upload URL.
 * @example
 * ```ts
 * import { generateUploadUrl } from "@vexcms/core/server";
 *
 * export const uploadFile = mutation({
 *   args: { adapter: v.string() },
 *   handler: (ctx, args) =>
 *     generateUploadUrl({ ctx, config: myConfig, adapter: args.adapter }),
 * });
 */
export async function generateUploadUrl<TDataModel extends GenericDataModel = GenericDataModel>(
  args: GenerateUploadUrlServerArgs<TDataModel>,
): Promise<{ url: string }> {
  if (args.config.access !== undefined) {
    hasPermission({
      throwOnDenied: true,
      user: args.auth?.user ?? {},
      organization: args.auth?.organization,
      access: args.config.access,
      resource: args.collection,
      action: CRUD_ACTIONS.create,
    });
  }
  const adapter = args.config.storage?.adapters.find((a) => a.name === args.adapter);
  if (!adapter) {
    throw new VexStorageConfigError(`Storage adapter "${args.adapter}" not found`);
  }
  return await adapter.generateUploadUrl(args.ctx);
}

/**
 * Creates a media document in the storage adapter after the file is uploaded.
 * Server-side only — call inside a Convex mutation handler.
 *
 * Looks up the adapter by name from `args.config.storage?.adapters` and
 * calls `adapter.createMediaDocument(ctx, args)`.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, adapter, collectionSlug, storageId, filename, mimeType, size, alt?, adapterFields? }`.
 * @returns Promise resolving to the new media document's ID as a string.
 * @example
 * ```ts
 * import { createMediaDocument } from "@vexcms/core/server";
 *
 * export const saveMedia = mutation({
 *   args: { data: v.any() },
 *   handler: (ctx, args) =>
 *     createMediaDocument({ ctx, config: myConfig, ...args.data }),
 * });
 * ```
 */
export async function createMediaDocument<TDataModel extends GenericDataModel = GenericDataModel>(
  args: CreateMediaDocumentServerArgs<TDataModel>,
): Promise<string> {
  if (args.config.access !== undefined) {
    hasPermission({
      throwOnDenied: true,
      access: args.config.access,
      user: args.auth?.user ?? {},
      organization: args.auth?.organization,
      resource: args.collection,
      action: CRUD_ACTIONS.create,
    });
  }
  const adapter = args.config.storage?.adapters.find((a) => a.name === args.adapter);
  if (!adapter) {
    throw new VexStorageConfigError(`Storage adapter "${args.adapter}" not found`);
  }
  return await adapter.createMediaDocument(args.ctx, {
    collectionSlug: args.collection,
    storageId: args.storageId,
    filename: args.filename,
    mimeType: args.mimeType,
    size: args.size,
    alt: args.alt,
    adapterFields: args.adapterFields,
  });
}

/**
 * Deletes a media document and its file from storage.
 * Server-side only — call inside a Convex mutation handler.
 *
 * Looks up the adapter by name from `args.config.storage?.adapters` and
 * calls `adapter.deleteMedia(ctx, args)`.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, adapter, mediaId, softDelete? }`.
 * @returns Promise resolving to `true` if the document was deleted.
 * @example
 * ```ts
 * import { deleteMedia } from "@vexcms/core/server";
 *
 * export const removeMedia = mutation({
 *   args: { mediaId: v.string() },
 *   handler: (ctx, args) =>
 *     deleteMedia({ ctx, config: myConfig, adapter: "convex", mediaId: args.mediaId }),
 * });
 * ```
 */
export async function deleteMedia<TDataModel extends GenericDataModel = GenericDataModel>(
  args: DeleteMediaServerArgs<TDataModel>,
): Promise<boolean> {
  if (args.config.access !== undefined) {
    const resource = resolveCollectionSlug({
      ctx: args.ctx,
      config: args.config,
      id: args.mediaId as GenericId<CollectionSlug>,
    });
    hasPermission({
      throwOnDenied: true,
      access: args.config.access,
      user: args.auth?.user ?? {},
      organization: args.auth?.organization,
      resource,
      action: CRUD_ACTIONS.delete,
    });
  }
  const adapter = args.config.storage?.adapters.find((a) => a.name === args.adapter);
  if (!adapter) {
    throw new VexStorageConfigError(`Storage adapter "${args.adapter}" not found`);
  }
  return await adapter.deleteMedia(args.ctx, {
    collectionSlug: "",
    mediaId: args.mediaId,
    softDelete: args.softDelete,
  });
}
