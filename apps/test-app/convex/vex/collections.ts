import type { DataModel } from "@convex/_generated/dataModel"
import type { GenericQueryCtx, TableNamesInDataModel } from "convex/server"

import { mutation, query } from "@convex/_generated/server"
import { findCollectionBySlug, hasPermission } from "@vexcms/core"
import { paginationOptsValidator } from "convex/server"
import { ConvexError, v } from "convex/values"

import { TABLE_SLUG_USERS } from "~/db/constants"

import config from "../../vex.config"
import { access } from "../../src/vexcms/access"
import * as Collections from "./model/collections"

function requireCollection(slug: string) {
  const match = findCollectionBySlug({ slug, config })
  if (!match) {
    throw new ConvexError(`Collection not found: ${slug}`)
  }
  return match
}

/**
 * Try to get the current user. Returns null if not authenticated.
 * Use this for queries where auth is optional (read filtering).
 */
async function getUser(ctx: GenericQueryCtx<DataModel>) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity?.email) return null

  const user = await ctx.db
    .query(TABLE_SLUG_USERS)
    .withIndex("by_email", (q) => q.eq("email", identity.email!))
    .first()

  if (!user) return null

  return {
    user: user as Record<string, unknown>,
    roles: (user.role as string[]) ?? [],
  }
}

/**
 * Get the current user, throwing if not authenticated.
 * Use this for mutations where auth is required.
 */
async function requireUser(ctx: GenericQueryCtx<DataModel>) {
  const result = await getUser(ctx)
  if (!result) {
    throw new ConvexError("Not authenticated")
  }
  return result
}

/**
 * Check permission and throw ConvexError if denied.
 * Error message includes which roles would grant the permission.
 */
function checkPermission(props: Parameters<typeof hasPermission>[0]) {
  const result = hasPermission(props)
  const denied =
    result === false ||
    (typeof result === "object" && !Object.values(result).some(Boolean))

  if (denied) {
    const grantingRoles: string[] = []
    if (props.access) {
      for (const role of props.access.roles) {
        const check = hasPermission({ ...props, userRoles: [role] })
        const allowed =
          check === true ||
          (typeof check === "object" && Object.values(check).some(Boolean))
        if (allowed) grantingRoles.push(role)
      }
    }

    const rolesHint =
      grantingRoles.length > 0
        ? ` Requires one of: ${grantingRoles.join(", ")}`
        : ""
    throw new ConvexError(
      `Access denied: "${props.action}" on "${props.resource}".${rolesHint}`,
    )
  }

  return result
}

export const listDocuments = query({
  args: {
    collectionSlug: v.string(),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const result = await Collections.listDocuments<DataModel>({
      args: {
        collectionSlug: args.collectionSlug as TableNamesInDataModel<DataModel>,
        order: args.order,
        paginationOpts: args.paginationOpts,
      },
      ctx,
    })

    // Filter by read permission if user is authenticated
    const auth = await getUser(ctx)
    if (!auth) return result

    const filteredPage = result.page.filter((doc: Record<string, unknown>) => {
      const readAllowed = hasPermission({
        access,
        user: auth.user,
        userRoles: auth.roles,
        resource: args.collectionSlug,
        action: "read",
        data: doc,
      })
      return readAllowed === true
    })

    return { ...result, page: filteredPage }
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
    const doc = await Collections.getDocument<DataModel>({
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        documentId,
      },
      ctx,
    })

    if (doc) {
      const auth = await getUser(ctx)
      if (auth) {
        const readAllowed = hasPermission({
          access,
          user: auth.user,
          userRoles: auth.roles,
          resource: collectionSlug,
          action: "read",
          data: doc as Record<string, unknown>,
        })
        if (readAllowed !== true) return null
      }
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
    const match = requireCollection(collectionSlug)
    const { user, roles } = await requireUser(ctx)

    const fieldNames = Object.keys(fields as Record<string, unknown>)
    checkPermission({
      access,
      user,
      userRoles: roles,
      resource: collectionSlug,
      action: "update",
      fields: fieldNames,
      data: fields as Record<string, unknown>,
    })

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
    const { user, roles } = await requireUser(ctx)

    const fieldNames = Object.keys(fields as Record<string, unknown>)
    checkPermission({
      access,
      user,
      userRoles: roles,
      resource: collectionSlug,
      action: "create",
      fields: fieldNames,
      data: fields as Record<string, unknown>,
    })

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
    const { user, roles } = await requireUser(ctx)

    checkPermission({
      access,
      user,
      userRoles: roles,
      resource: collectionSlug,
      action: "delete",
    })

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
  handler: async (ctx, { collectionSlug, documentIds }) => {
    const { user, roles } = await requireUser(ctx)

    checkPermission({
      access,
      user,
      userRoles: roles,
      resource: collectionSlug,
      action: "delete",
    })

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
    const results = await Collections.searchDocuments<DataModel>({
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        query: searchQuery,
        searchField,
        searchIndexName,
      },
      ctx,
    })

    // Filter by read permission if user is authenticated
    const auth = await getUser(ctx)
    if (!auth) return results

    return (results as Record<string, unknown>[]).filter((doc) => {
      const readAllowed = hasPermission({
        access,
        user: auth.user,
        userRoles: auth.roles,
        resource: collectionSlug,
        action: "read",
        data: doc,
      })
      return readAllowed === true
    })
  },
})
