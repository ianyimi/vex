import { createVexQuery } from "@vexcms/core"

import { query } from "../_generated/server"

/**
 * Typed vexQuery builder — use this instead of `query` for queries
 * that need draft/snapshot support (live preview, versioning).
 *
 * Automatically adds `_vexDrafts` arg and provides `ctx.drafts`
 * with full return type inference from your DataModel.
 *
 * @example
 * ```ts
 * import { vexQuery } from "./vex/helpers"
 * import { getPreviewSnapshot } from "@vexcms/core"
 *
 * export const getBySlug = vexQuery({
 *   args: { slug: v.string() },
 *   handler: async (ctx, args) => {
 *     const doc = await ctx.db.query("pages")
 *       .withIndex("by_slug", (q) => q.eq("slug", args.slug))
 *       .first()
 *     if (!doc) return null
 *     if (ctx.drafts === "snapshot") {
 *       const snapshot = await getPreviewSnapshot({ ctx, collection: "pages", documentId: doc._id })
 *       if (snapshot) return { ...doc, ...snapshot }
 *     }
 *     return doc
 *   },
 * })
 * ```
 */
export const vexQuery = createVexQuery(query)
