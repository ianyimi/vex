import type { DataModel } from "@convex/_generated/dataModel"
import type { TableNamesInDataModel } from "convex/server"

import { ConvexError } from "convex/values"
import { mutation, query } from "@convex/_generated/server"
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"

import { findCollectionBySlug } from "@vexcms/core"
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
    paginationOpts: paginationOptsValidator,
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    return await Collections.listDocuments<DataModel>({
      args: {
        collectionSlug: args.collectionSlug as TableNamesInDataModel<DataModel>,
        paginationOpts: args.paginationOpts,
        order: args.order,
      },
      ctx,
    })
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
    return await Collections.getDocument<DataModel>({
      ctx,
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        documentId,
      },
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
      ctx,
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        documentId,
        fields: fields as Record<string, unknown>,
        collectionFields: match.fields,
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
    const match = requireCollection(collectionSlug)

    return await Collections.createDocument<DataModel>({
      ctx,
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        fields: fields as Record<string, unknown>,
        collectionFields: match.fields,
        kind: match.kind,
      },
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
      ctx,
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        documentId,
        kind: match.kind,
      },
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
    return await Collections.searchDocuments<DataModel>({
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        searchIndexName,
        searchField,
        query: searchQuery,
      },
      ctx,
    })
  },
})
