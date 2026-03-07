import type { DataModel } from "@convex/_generated/dataModel"
import type { TableNamesInDataModel } from "convex/server"

import { mutation, query } from "@convex/_generated/server"
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"

import * as Collections from "./model/collections"

export const listDocuments = query({
  args: {
    collectionSlug: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { collectionSlug, paginationOpts }) => {
    return await Collections.listDocuments<DataModel>({
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        paginationOpts,
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
    return await Collections.updateDocument<DataModel>({
      ctx,
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        documentId,
        fields: fields as Record<string, unknown>,
      },
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
