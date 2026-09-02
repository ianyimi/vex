import { v } from "convex/values";

/**
 * Convex validator for `createMediaDocument` arguments.
 * Every storage adapter must use this in its `createMediaDocument` mutation.
 */
export const createMediaDocumentArgs = v.object({
  collectionSlug: v.string(),
  storageId: v.string(),
  fileName: v.string(),
  mimeType: v.string(),
  size: v.number(),
  alt: v.optional(v.string()),
  adapterFields: v.optional(v.record(v.string(), v.any())),
});

/**
 * Convex validator for `createMediaDocument` return value.
 * Returns the created media document ID.
 */
export const createMediaDocumentReturn = v.string();

/**
 * Convex validator for `deleteMedia` arguments.
 * Every storage adapter must use this in its `deleteMedia` mutation.
 */
export const deleteMediaArgs = v.object({
  collectionSlug: v.string(),
  mediaId: v.string(),
});

/**
 * Convex validator for `deleteMedia` return value.
 */
export const deleteMediaReturn = v.boolean();

/**
 * Convex validator for `getUrl` arguments.
 * Every storage adapter must use this in its `getUrl` query.
 */
export const getUrlArgs = v.object({
  collectionSlug: v.string(),
  mediaId: v.string(),
});

/**
 * Convex validator for `getUrl` return value.
 */
export const getUrlReturn = v.object({
  url: v.string(),
});
