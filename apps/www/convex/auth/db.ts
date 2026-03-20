import type { BetterAuthDBSchema } from "better-auth/db"
import type { GenericId } from "convex/values"

import { v } from "convex/values"

import type { WhereClause } from "./adapter/utils"

import { internalMutation, internalQuery } from "../_generated/server"
import schema from "../schema"
import { checkUniqueFields, listOne, paginate, selectFields } from "./adapter/utils"

// Helper to get Better Auth schema - we'll pass it from the adapter
const getBetterAuthSchema = (schemaJson: string): BetterAuthDBSchema => {
  return JSON.parse(schemaJson)
}

// Create (insert) operation
export const dbCreate = internalMutation({
  args: {
    betterAuthSchema: v.string(),
    data: v.any(),
    model: v.string(),
    select: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { betterAuthSchema, data, model, select }) => {
    const authSchema = getBetterAuthSchema(betterAuthSchema)

    // Check unique fields before insert
    await checkUniqueFields(ctx, schema, authSchema, model, data)

    const id = await ctx.db.insert(model as any, data)
    const doc = await ctx.db.get(id)
    if (!doc) {
      throw new Error(`Failed to create ${model}`)
    }

    return selectFields(doc, select)
  },
})

// Find one operation
export const dbFindOne = internalQuery({
  args: {
    betterAuthSchema: v.string(),
    model: v.string(),
    select: v.optional(v.array(v.string())),
    where: v.array(v.any()),
  },
  handler: async (ctx, { betterAuthSchema, model, select, where }) => {
    const authSchema = getBetterAuthSchema(betterAuthSchema)
    // @ts-expect-error GenericCtx type is a superset
    const result = await listOne(ctx, schema, authSchema, {
      model,
      select,
      where: where as WhereClause[],
    })

    return result
  },
})

// Find many operation
export const dbFindMany = internalQuery({
  args: {
    betterAuthSchema: v.string(),
    limit: v.optional(v.number()),
    model: v.string(),
    sortBy: v.optional(
      v.object({
        direction: v.union(v.literal("asc"), v.literal("desc")),
        field: v.string(),
      })
    ),
    where: v.optional(v.array(v.any())),
  },
  handler: async (ctx, { betterAuthSchema, limit, model, sortBy, where }) => {
    const authSchema = getBetterAuthSchema(betterAuthSchema)
    const parsedWhere = (where ?? []) as WhereClause[]

    // Handle OR connector by running parallel queries
    if (parsedWhere.some((w) => w.connector === "OR")) {
      const results = await Promise.all(
        parsedWhere.map(async (w) => {
          // @ts-expect-error GenericCtx type is a superset
          const result = await paginate(ctx, schema, authSchema, {
            model,
            paginationOpts: { cursor: null, numItems: limit ?? 200 },
            sortBy,
            where: [w],
          })
          return result.page
        })
      )

      // De-duplicate and flatten
      const seen = new Set<string>()
      const uniqueDocs: any[] = []
      for (const docs of results) {
        for (const doc of docs) {
          const docId = doc._id as string
          if (!seen.has(docId)) {
            seen.add(docId)
            uniqueDocs.push(doc)
          }
        }
      }

      // Apply sorting if needed
      if (sortBy) {
        uniqueDocs.sort((a, b) => {
          const aVal = a[sortBy.field]
          const bVal = b[sortBy.field]
          if (aVal === bVal) {
            return 0
          }
          const comparison = aVal > bVal ? 1 : -1
          return sortBy.direction === "desc" ? -comparison : comparison
        })
      }

      return uniqueDocs.slice(0, limit)
    }

    // Normal case without OR
    // @ts-expect-error GenericCtx type is a superset
    const result = await paginate(ctx, schema, authSchema, {
      model,
      paginationOpts: { cursor: null, numItems: limit ?? 200 },
      sortBy,
      where: parsedWhere,
    })

    return result.page
  },
})

// Count operation
export const dbCount = internalQuery({
  args: {
    betterAuthSchema: v.string(),
    model: v.string(),
    where: v.optional(v.array(v.any())),
  },
  handler: async (ctx, { betterAuthSchema, model, where }) => {
    const authSchema = getBetterAuthSchema(betterAuthSchema)
    const parsedWhere = (where ?? []) as WhereClause[]

    // Handle OR connector
    if (parsedWhere.some((w) => w.connector === "OR")) {
      const results = await Promise.all(
        parsedWhere.map(async (w) => {
          // @ts-expect-error GenericCtx type is a superset
          const result = await paginate(ctx, schema, authSchema, {
            model,
            paginationOpts: { cursor: null, numItems: 200 },
            where: [w],
          })
          return result.page
        })
      )

      // De-duplicate and count
      const seen = new Set<string>()
      for (const docs of results) {
        for (const doc of docs) {
          const docId = doc._id as string
          seen.add(docId)
        }
      }
      return seen.size
    }

    // Normal case
    // @ts-expect-error GenericCtx type is a superset
    const result = await paginate(ctx, schema, authSchema, {
      model,
      paginationOpts: { cursor: null, numItems: 200 },
      where: parsedWhere,
    })

    return result.page.length
  },
})

// Update operation
export const dbUpdate = internalMutation({
  args: {
    betterAuthSchema: v.string(),
    model: v.string(),
    update: v.any(),
    where: v.array(v.any()),
  },
  handler: async (ctx, { betterAuthSchema, model, update, where }) => {
    const authSchema = getBetterAuthSchema(betterAuthSchema)
    const parsedWhere = where as WhereClause[]

    // Find the document to update
    const doc = await listOne(ctx, schema, authSchema, {
      model,
      where: parsedWhere,
    })

    if (!doc) {
      return null
    }

    // Check unique fields before update
    await checkUniqueFields(ctx, schema, authSchema, model, update, doc)

    await ctx.db.patch(doc._id as GenericId<any>, update)
    return await ctx.db.get(doc._id as GenericId<any>)
  },
})

// Update many operation
export const dbUpdateMany = internalMutation({
  args: {
    betterAuthSchema: v.string(),
    model: v.string(),
    update: v.any(),
    where: v.array(v.any()),
  },
  handler: async (ctx, { betterAuthSchema, model, update, where }) => {
    const authSchema = getBetterAuthSchema(betterAuthSchema)
    const parsedWhere = where as WhereClause[]

    const result = await paginate(ctx, schema, authSchema, {
      model,
      paginationOpts: { cursor: null, numItems: 200 },
      where: parsedWhere,
    })

    // Check unique fields if updating multiple docs
    if (result.page.length > 1) {
      const uniqueFieldKeys = Object.keys(update).filter(
        (key) => authSchema[model]?.fields?.[key]?.unique
      )
      if (uniqueFieldKeys.length > 0) {
        throw new Error(
          `Attempted to set unique fields in multiple documents in ${model} with the same value. Fields: ${uniqueFieldKeys.join(", ")}`
        )
      }
    }

    // Update each document
    for (const doc of result.page) {
      await checkUniqueFields(ctx, schema, authSchema, model, update, doc)
      await ctx.db.patch(doc._id as GenericId<any>, update)
    }

    return result.page.length
  },
})

// Delete operation
export const dbDelete = internalMutation({
  args: {
    betterAuthSchema: v.string(),
    model: v.string(),
    where: v.array(v.any()),
  },
  handler: async (ctx, { betterAuthSchema, model, where }) => {
    const authSchema = getBetterAuthSchema(betterAuthSchema)
    const parsedWhere = where as WhereClause[]

    const doc = await listOne(ctx, schema, authSchema, {
      model,
      where: parsedWhere,
    })

    if (!doc) {
      return
    }

    await ctx.db.delete(doc._id as GenericId<any>)
  },
})

// Delete many operation
export const dbDeleteMany = internalMutation({
  args: {
    betterAuthSchema: v.string(),
    model: v.string(),
    where: v.array(v.any()),
  },
  handler: async (ctx, { betterAuthSchema, model, where }) => {
    const authSchema = getBetterAuthSchema(betterAuthSchema)
    const parsedWhere = where as WhereClause[]

    const result = await paginate(ctx, schema, authSchema, {
      model,
      paginationOpts: { cursor: null, numItems: 200 },
      where: parsedWhere,
    })

    // Delete each document
    for (const doc of result.page) {
      await ctx.db.delete(doc._id as GenericId<any>)
    }

    return result.page.length
  },
})
