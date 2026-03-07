import type { DataModel } from "@convex/_generated/dataModel"
import type { TableNamesInDataModel } from "convex/server"

import { query } from "@convex/_generated/server"
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
