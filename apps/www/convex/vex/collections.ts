import type { TableNamesInDataModel } from "convex/server"

import { v } from "convex/values"

import type { DataModel, Id } from "../_generated/dataModel"

import { mutation, query } from "../_generated/server"

/**
 * Lists all documents in a VexCMS-managed collection.
 *
 * The `collection` argument must match a Convex table name in your schema —
 * this is enforced via the `TableNamesInDataModel` cast. VexCMS convention:
 * collection slugs in `vex.config.ts` must match their Convex table names.
 *
 * Used internally by `CollectionListView` in `@vexcms/react` via `vexConvexApi.list`.
 *
 * @param collection - Collection slug (must match a Convex table name)
 * @param limit - Maximum number of documents to return (default: 50)
 * @returns Array of documents with all fields, ordered by creation time
 */
export const list = query({
  args: {
    collection: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tableName = args.collection as TableNamesInDataModel<DataModel>
    return await ctx.db.query(tableName).take(args.limit ?? 50)
  },
})

/**
 * Fetches a single document by Convex ID.
 *
 * Used internally by `CollectionEditView` in `@vexcms/react` via `vexConvexApi.get`.
 *
 * @param id - The Convex document ID as a string
 * @returns The document, or `null` if not found
 */
export const get = query({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id as Id<TableNamesInDataModel<DataModel>>)
  },
})

/**
 * Creates a new document in a VexCMS-managed collection.
 * Returns the new document's Convex ID as a string.
 *
 * @param collection - Collection slug
 * @param data - The collection data and field values to store (must match the table's schema)
 * @returns The new document's ID
 */
export const create = mutation({
  args: {
    collection: v.string(),
    data: v.any(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const tableName = args.collection as TableNamesInDataModel<DataModel>
    const id = await ctx.db.insert(tableName, args.data)
    return id as string
  },
})

/**
 * Patches an existing document — only specified fields are updated,
 * unspecified fields are left unchanged.
 *
 * @param id - The Convex document ID as a string
 * @param data - The fields to update (partial patch)
 */
export const update = mutation({
  args: {
    id: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id as Id<TableNamesInDataModel<DataModel>>, args.data)
  },
})

/**
 * Searches documents in a VexCMS-managed collection using a Convex search index.
 *
 * When `query` is non-empty, uses `ctx.db.search` with the provided index name.
 * When `query` is empty, falls back to `ctx.db.query(...).take(limit)` so the
 * picker shows recent items without requiring a search term.
 *
 * The `searchIndexName` must match a `.searchIndex()` declaration in the
 * collection's Convex schema. VexCMS auto-generates `search_<useAsTitle>` on
 * the target collection whenever another collection has a relationship pointing
 * to it and `useAsTitle` is not a Convex system field.
 *
 * Used by `RelationshipFieldInput` in `@vexcms/react` to populate the
 * relationship picker combobox. Pass `query: ""` to list recent documents
 * when no search term has been entered yet.
 *
 * @param collection - The Convex table name to search.
 * @param searchIndexName - The `.searchIndex()` name declared in the schema (e.g. `"search_name"`).
 * @param searchField - The field name the search index is built on (e.g. `"name"`). Must match the `searchField` in the `.searchIndex()` declaration.
 * @param query - The search text. Pass `""` to list recent documents instead of searching.
 * @param limit - Maximum number of results. Defaults to `20`.
 * @returns Array of matching documents, ordered by search relevance or creation time.
 *
 * @example
 * ```ts
 * // Search authors by name
 * vexConvexApi.search({ collection: "authors", searchIndexName: "search_name", query: "jane" })
 *
 * // List recent authors (no search term yet)
 * vexConvexApi.search({ collection: "authors", searchIndexName: "search_name", query: "" })
 * ```
 */
export const search = query({
  args: {
    collection: v.string(),
    searchIndexName: v.string(),
    searchField: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tableName = args.collection as TableNamesInDataModel<DataModel>
    const limit = args.limit ?? 20
    if (!args.query) {
      return ctx.db.query(tableName).take(limit)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (ctx.db.query(tableName) as any)
      .withSearchIndex(args.searchIndexName, (q: any) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        (q as any).search(args.searchField, args.query),
      )
      .take(limit)
  },
})

/**
 * Permanently deletes a document from a VexCMS-managed collection.
 *
 * @param collection - Collection slug
 * @param id - The Convex document ID as a string
 */
export const remove = mutation({
  args: {
    collection: v.string(),
    id: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id as Id<TableNamesInDataModel<DataModel>>)
  },
})
