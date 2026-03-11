import type { DataModel } from "@convex/_generated/dataModel"
import type { TableNamesInDataModel } from "convex/server"

import { ConvexError } from "convex/values"
import { mutation, query, action } from "@convex/_generated/server"
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"

import * as Media from "./model/media"

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
    const f = fields as Record<string, unknown>
    // Resolve the file URL from storageId before inserting
    if (f.storageId && (!f.url || f.url === "")) {
      const url = await ctx.storage.getUrl(f.storageId as any)
      if (url) f.url = url
    }
    return await Media.createMediaDocument<DataModel>({
      ctx,
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        fields: f,
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
  handler: async (
    ctx,
    {
      collectionSlug,
      searchIndexName,
      searchField,
      query: searchQuery,
      paginationOpts,
    },
  ) => {
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
    // Resolve missing URLs from storageId
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
