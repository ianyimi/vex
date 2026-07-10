import { GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";

/**
 * Generates a presigned upload URL via `ctx.storage.generateUploadUrl()`.
 *
 * @param ctx - Convex mutation context.
 * @returns Promise resolving to `{ url: string }` — POST the file body to this URL.
 */
export async function generateUploadUrl<TDataModel extends GenericDataModel = GenericDataModel>(
  ctx: GenericMutationCtx<TDataModel>,
): Promise<{ url: string }> {
  const url = await ctx.storage.generateUploadUrl();
  return { url };
}

/**
 * Inserts a media document into the target collection table after a file upload completes.
 *
 * @param ctx - Convex mutation context.
 * @param args - Document fields: `collectionSlug`, `storageId`, `filename`, `mimeType`, `size`, optional `alt` and `adapterFields`.
 * @returns Promise resolving to the new media document ID as a string.
 */
export async function createMediaDocument<TDataModel extends GenericDataModel = GenericDataModel>(
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
  const src = await ctx.storage.getUrl(args.storageId as never);
  // @ts-expect-error mismatched type from TDataModel. works for GenericDataModel for which TDataModel extends
  const docId = await ctx.db.insert(args.collectionSlug, {
    src,
    storageId: args.storageId,
    filename: args.filename,
    mimeType: args.mimeType,
    size: args.size,
    alt: args.alt ?? args.filename,
    deleted: false,
    ...(args.adapterFields ?? {}),
  });
  return docId;
}

/**
 * Deletes a media document — physically removes the file from Convex storage
 * unless `softDelete` is `true`, in which case the document is patched with `{ deleted: true }`.
 *
 * @param ctx - Convex mutation context.
 * @param args - `collectionSlug`, `mediaId`, and optional `softDelete` flag.
 * @returns Promise resolving to `true` if the document was found and processed, `false` if not found.
 */
export async function deleteMedia<TDataModel extends GenericDataModel = GenericDataModel>(
  ctx: GenericMutationCtx<TDataModel>,
  args: {
    collectionSlug: string;
    mediaId: string;
    softDelete?: boolean;
  },
): Promise<boolean> {
  const mediaDoc = await ctx.db.get(args.mediaId as never);
  if (!mediaDoc) return false;

  if (args.softDelete || args.softDelete) {
    await ctx.db.patch(args.mediaId as never, { deleted: true });
    return true;
  }

  await ctx.storage.delete(mediaDoc.storageId as never);
  await ctx.db.delete(args.mediaId as never);
  return true;
}

/**
 * Resolves a serving URL for a media document by looking up its `storageId`
 * and calling `ctx.storage.getUrl()`.
 *
 * @param ctx - Convex query context.
 * @param args - `collectionSlug` and `mediaId` of the target media document.
 * @returns Promise resolving to `{ url }` on success or `{ error }` if the document or file is not found.
 */
export async function getUrl<TDataModel extends GenericDataModel = GenericDataModel>(
  ctx: GenericQueryCtx<TDataModel>,
  args: {
    collectionSlug: string;
    mediaId: string;
  },
): Promise<{ url: string; error?: never } | { url?: never; error: string }> {
  const mediaDoc = await ctx.db.get(args.mediaId as never);
  if (!mediaDoc) return { error: "Media Document NotFound" };

  const url = await ctx.storage.getUrl(mediaDoc.storageId as never);
  if (!url) return { error: "File Url NotFound" };
  return { url };
}

export default { generateUploadUrl, createMediaDocument, deleteMedia, getUrl };
