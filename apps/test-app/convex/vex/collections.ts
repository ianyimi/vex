import type { DataModel } from "@convex/_generated/dataModel"
import type { TableNamesInDataModel } from "convex/server"

import { ConvexError } from "convex/values"
import { mutation, query } from "@convex/_generated/server"
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"


import { generateFormSchema } from "@vexcms/core"
import type { VexField } from "@vexcms/core"
import config from "../../vex.config"

import * as Collections from "./model/collections"

export const listDocuments = query({
  args: {
    collectionSlug: v.string(),
    paginationOpts: paginationOptsValidator,
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, { collectionSlug, paginationOpts, order }) => {
    const result = await Collections.listDocuments<DataModel>({
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        paginationOpts,
        order,
      },
      ctx,
    })
    // Resolve missing URLs from storageId for media documents
    const resolvedPage = await Promise.all(
      result.page.map(async (doc: any) => {
        if (doc.storageId && (!doc.url || doc.url === "")) {
          const url = await ctx.storage.getUrl(doc.storageId)
          if (url) return { ...doc, url }
        }
        return doc
      }),
    )
    return { ...result, page: resolvedPage }
  },
})

export const countDocuments = query({
  args: { collectionSlug: v.string() },
  handler: async (ctx, { collectionSlug }) => {
    return await Collections.countDocuments<DataModel>({
      ctx,
      args: { collectionSlug: collectionSlug as TableNamesInDataModel<DataModel> },
    })
  },
})

export const getDocument = query({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
  },
  handler: async (ctx, { collectionSlug, documentId }) => {
    const doc = await Collections.getDocument<DataModel>({
      ctx,
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        documentId,
      },
    })
    // Resolve missing URL from storageId for media documents
    if (doc && (doc as any).storageId && (!(doc as any).url || (doc as any).url === "")) {
      const url = await ctx.storage.getUrl((doc as any).storageId)
      if (url) return { ...doc, url }
    }
    return doc
  },
})

export const updateDocument = mutation({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
    fields: v.any(),
  },
  handler: async (ctx, { collectionSlug, documentId, fields }) => {
    const f = fields as Record<string, unknown>
    // Resolve the file URL from storageId when replacing a media file
    if (f.storageId && f.url === "") {
      const url = await ctx.storage.getUrl(f.storageId as any)
      if (url) f.url = url
    }
    return await Collections.updateDocument<DataModel>({
      ctx,
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        documentId,
        fields: f,
      },
    })
  },
})

export const createDocument = mutation({
  args: {
    collectionSlug: v.string(),
    fields: v.any(),
  },
  handler: async (ctx, { collectionSlug, fields }) => {
    const collection = config.collections.find((c) => c.slug === collectionSlug)
    if (!collection) {
      throw new ConvexError(`Collection not found: ${collectionSlug}`)
    }

    const schema = generateFormSchema({
      fields: collection.config.fields as Record<string, VexField>,
    })

    const result = schema.safeParse(fields)
    if (!result.success) {
      throw new ConvexError({
        message: "Validation failed",
        errors: result.error.flatten(),
      })
    }

    return await Collections.createDocument<DataModel>({
      ctx,
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        fields: result.data as Record<string, unknown>,
      },
    })
  },
})

export const deleteDocument = mutation({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
  },
  handler: async (ctx, { documentId }) => {
    const existing = await ctx.db.get(documentId as any)
    if (!existing) {
      throw new ConvexError("Document not found")
    }

    await Collections.deleteDocument<DataModel>({
      ctx,
      args: { documentId },
    })
  },
})

export const bulkDeleteDocuments = mutation({
  args: {
    collectionSlug: v.string(),
    documentIds: v.array(v.string()),
  },
  handler: async (ctx, { documentIds }) => {
    return await Collections.bulkDeleteDocuments<DataModel>({
      ctx,
      args: { documentIds },
    })
  },
})

export const searchDocuments = query({
  args: {
    collectionSlug: v.string(),
    searchIndexName: v.string(),
    searchField: v.string(),
    query: v.string(),
  },
  handler: async (ctx, { collectionSlug, searchIndexName, searchField, query: searchQuery }) => {
    const docs = await Collections.searchDocuments<DataModel>({
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        searchIndexName,
        searchField,
        query: searchQuery,
      },
      ctx,
    })
    // Resolve missing URLs from storageId for media documents
    return Promise.all(
      docs.map(async (doc: any) => {
        if (doc.storageId && (!doc.url || doc.url === "")) {
          const url = await ctx.storage.getUrl(doc.storageId)
          if (url) return { ...doc, url }
        }
        return doc
      }),
    )
  },
})

