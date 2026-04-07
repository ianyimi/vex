import type { DataModel } from "@convex/_generated/dataModel"

import { mutation, query } from "@convex/_generated/server"
import {
  upsertPreviewSnapshot,
  deletePreviewSnapshot,
  getPreviewSnapshot,
} from "@vexcms/core"
import { v } from "convex/values"

export const upsert = mutation({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
    snapshot: v.any(),
  },
  handler: async (ctx, { collectionSlug, documentId, snapshot }) => {
    await upsertPreviewSnapshot<DataModel>({
      ctx,
      collection: collectionSlug,
      documentId,
      snapshot: snapshot as Record<string, unknown>,
    })
  },
})

export const remove = mutation({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
  },
  handler: async (ctx, { collectionSlug, documentId }) => {
    await deletePreviewSnapshot<DataModel>({
      ctx,
      collection: collectionSlug,
      documentId,
    })
  },
})

export const get = query({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
  },
  handler: async (ctx, { collectionSlug, documentId }) => {
    return await getPreviewSnapshot<DataModel>({
      ctx,
      collection: collectionSlug,
      documentId,
    })
  },
})
