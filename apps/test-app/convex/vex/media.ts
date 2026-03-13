import type { DataModel } from "@convex/_generated/dataModel"
import type { GenericQueryCtx, TableNamesInDataModel } from "convex/server"

import { ConvexError } from "convex/values"
import { mutation, query, action } from "@convex/_generated/server"
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"

import { findCollectionBySlug, hasPermission } from "@vexcms/core"
import { TABLE_SLUG_USERS } from "~/db/constants"
import config from "../../vex.config"
import { access } from "../../src/vexcms/access"

import * as Media from "./model/media"

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

async function requireUser(ctx: GenericQueryCtx<DataModel>) {
  const result = await getUser(ctx)
  if (!result) {
    throw new ConvexError("Not authenticated")
  }
  return result
}

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

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

export const createMediaDocument = mutation({
  args: {
    collectionSlug: v.string(),
    fields: v.any(),
  },
  handler: async (ctx, { collectionSlug, fields }) => {
    const match = findCollectionBySlug({ slug: collectionSlug, config })
    if (!match) {
      throw new ConvexError(`Collection not found: ${collectionSlug}`)
    }

    const { user, roles } = await requireUser(ctx)

    checkPermission({
      access,
      user,
      userRoles: roles,
      resource: collectionSlug,
      action: "create",
      data: fields as Record<string, unknown>,
    })

    return await Media.createMediaDocument<DataModel>({
      ctx,
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        fields: fields as Record<string, unknown>,
        collectionFields: match.fields,
      },
    })
  },
})

export const paginatedSearchDocuments = query({
  args: {
    collectionSlug: v.string(),
    searchIndexName: v.string(),
    searchField: v.string(),
    query: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { collectionSlug, searchIndexName, searchField, query: searchQuery, paginationOpts }) => {
    const result = await Media.paginatedSearchDocuments<DataModel>({
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        searchIndexName,
        searchField,
        query: searchQuery,
        paginationOpts,
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
        resource: collectionSlug,
        action: "read",
        data: doc,
      })
      return readAllowed === true
    })

    return { ...result, page: filteredPage }
  },
})

/**
 * Downloads a file from a URL and stores it in Convex storage.
 * Returns storageId + file metadata for the client to create a media document.
 */
export const downloadAndStoreUrl = action({
  args: {
    url: v.string(),
    maxSize: v.number(),
  },
  handler: async (ctx, { url, maxSize }) => {
    // 1. Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      throw new ConvexError("Invalid URL")
    }

    // 2. Fetch with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    let response: Response
    try {
      response = await fetch(parsedUrl.href, { signal: controller.signal })
    } catch (err: any) {
      clearTimeout(timeoutId)
      if (err.name === "AbortError") {
        throw new ConvexError("URL fetch timed out")
      }
      throw new ConvexError(`Failed to fetch URL: ${err.message}`)
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      throw new ConvexError(`Failed to fetch URL: ${response.statusText}`)
    }

    // 3. Reject HTML
    const contentType = response.headers.get("Content-Type") || ""
    if (contentType.includes("text/html")) {
      throw new ConvexError("URL points to an HTML page, not a file")
    }

    // 4. Read body and check size
    const arrayBuffer = await response.arrayBuffer()
    if (arrayBuffer.byteLength > maxSize) {
      throw new ConvexError(
        `File size (${arrayBuffer.byteLength} bytes) exceeds maximum allowed (${maxSize} bytes)`,
      )
    }

    // 5. Extract filename
    let filename = "download"
    try {
      const pathname = decodeURIComponent(parsedUrl.pathname)
      const segments = pathname.split("/").filter(Boolean)
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1]
        // Strip query-like suffixes that might leak through
        const clean = lastSegment.split("?")[0].split("#")[0]
        if (clean) filename = clean
      }
    } catch {
      // Keep default filename
    }

    // Check Content-Disposition for filename
    const disposition = response.headers.get("Content-Disposition")
    if (disposition) {
      const filenameMatch = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)/i)
      if (filenameMatch?.[1]) {
        filename = decodeURIComponent(filenameMatch[1].trim())
      }
    }

    // 6. Extract mimeType
    let mimeType = "application/octet-stream"
    if (contentType) {
      mimeType = contentType.split(";")[0].trim()
    }

    // 7. Store in Convex storage
    const blob = new Blob([arrayBuffer], { type: mimeType })
    const storageId = await ctx.storage.store(blob)

    // 8. Return metadata
    return {
      storageId: storageId as string,
      filename,
      mimeType,
      size: arrayBuffer.byteLength,
    }
  },
})
