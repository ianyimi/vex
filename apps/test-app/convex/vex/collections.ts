import type { DataModel } from "@convex/_generated/dataModel"
import type { TableNamesInDataModel } from "convex/server"

import { mutation, query } from "@convex/_generated/server"
import { findCollectionBySlug } from "@vexcms/core"
import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"

import config from "../../vex.config"
import * as Collections from "./model/collections"

function requireCollection(slug: string) {
  const match = findCollectionBySlug({ slug, config })
  if (!match) {
    throw new ConvexError(`Collection not found: ${slug}`)
  }
  return match
}

export const listDocuments = query({
  args: {
    collectionSlug: v.string(),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await Collections.listDocuments<DataModel>({
      args: {
        collectionSlug: args.collectionSlug as TableNamesInDataModel<DataModel>,
        order: args.order,
        paginationOpts: args.paginationOpts,
      },
      ctx,
    })
  },
})

export const countDocuments = query({
  args: { collectionSlug: v.string() },
  handler: async (ctx, { collectionSlug }) => {
    return await Collections.countDocuments<DataModel>({
      args: { collectionSlug: collectionSlug as TableNamesInDataModel<DataModel> },
      ctx,
    })
  },
})

export const getDocument = query({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
  },
  handler: async (ctx, { collectionSlug, documentId }) => {
    return await Collections.getDocument<DataModel>({
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        documentId,
      },
      ctx,
    })
  },
})

export const updateDocument = mutation({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
    fields: v.any(),
  },
  handler: async (ctx, { collectionSlug, documentId, fields }) => {
    const match = requireCollection(collectionSlug)

    return await Collections.updateDocument<DataModel>({
      args: {
        collectionFields: match.fields,
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        documentId,
        fields: fields as Record<string, unknown>,
      },
      ctx,
    })
  },
})

export const createDocument = mutation({
  args: {
    collectionSlug: v.string(),
    fields: v.any(),
  },
  handler: async (ctx, { collectionSlug, fields }) => {
    const match = requireCollection(collectionSlug)

    return await Collections.createDocument<DataModel>({
      args: {
        collectionFields: match.fields,
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        fields: fields as Record<string, unknown>,
        kind: match.kind,
      },
      ctx,
    })
  },
})

export const deleteDocument = mutation({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
  },
  handler: async (ctx, { collectionSlug, documentId }) => {
    const match = requireCollection(collectionSlug)

    await Collections.deleteDocument<DataModel>({
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        documentId,
        kind: match.kind,
      },
      ctx,
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
      args: { documentIds },
      ctx,
    })
  },
})

export const searchDocuments = query({
  args: {
    collectionSlug: v.string(),
    query: v.string(),
    searchField: v.string(),
    searchIndexName: v.string(),
  },
  handler: async (ctx, { collectionSlug, query: searchQuery, searchField, searchIndexName }) => {
    return await Collections.searchDocuments<DataModel>({
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        query: searchQuery,
        searchField,
        searchIndexName,
      },
      ctx,
    })
  },
})
