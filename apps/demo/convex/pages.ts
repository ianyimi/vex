import { getPreviewSnapshot } from "@vexcms/core"
import { v } from "convex/values"

import { TABLE_SLUG_PAGES } from "~/db/constants"

import { vexQuery } from "./vex/helpers"

/**
 * Get a published page by slug.
 * Returns null if the page doesn't exist or isn't published.
 *
 * Uses vexQuery which automatically handles _vexDrafts arg
 * and provides ctx.drafts for draft-aware queries.
 */
export const getBySlug = vexQuery({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query(TABLE_SLUG_PAGES)
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first()

    if (!page) {
      return null
    }

    // On the public route, only return published pages
    if (ctx.drafts === false && page.vex_status !== "published") {
      return null
    }

    // For preview/snapshot mode, merge the draft snapshot
    if (ctx.drafts === "snapshot") {
      const snapshot = await getPreviewSnapshot({
        collection: TABLE_SLUG_PAGES,
        ctx,
        documentId: page._id,
      })
      if (snapshot) {
        return { ...page, ...snapshot }
      }
    }

    return page
  },
})
