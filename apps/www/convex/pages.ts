import { find, get } from "@vexcms/core/server"

/**
 * Returns all published pages ordered by creation date (newest first).
 *
 * @returns Array of `Page` documents.
 * @see getBySlug for fetching a single page by slug
 */

import { v } from "convex/values"

import { type PageId, TABLE_SLUG_PAGES } from "~/db/constants"

import { query } from "./_generated/server"

export const list = query({
  handler: async (ctx) => {
    return await find({ ctx, collection: TABLE_SLUG_PAGES })
  },
})

/**
 * Returns the demo page document by its Convex ID.
 *
 * Used internally to verify the seed page exists during development.
 * Hard-codes the seed page ID — not suitable for production use.
 *
 * @returns The `Page` document or `undefined` if not found.
 */
export const getIndex = query({
  handler: async (ctx) => {
    return await get({ ctx, id: "jd7c3tr2ssz89pzdyx65by5k0n86razb" as PageId })
  },
})

/**
 * Returns the page document matching the given slug.
 *
 * Uses the `by_slug` index for efficient lookup. Returns an empty array if
 * no page with that slug exists (caller handles 404 via `notFound()`).
 *
 * @param data.slug - URL slug to look up (e.g. `"about-us"`)
 * @returns Array containing the matching `Page` document, or empty if not found.
 * @example
 * ```ts
 * const pages = await fetchQuery(api.pages.getBySlug, { slug: "about-us" });
 * ```
 */
export const getBySlug = query({
  args: v.object({
    slug: v.string(),
  }),
  handler: async (ctx, { slug }) => {
    return await find({
      ctx,
      collection: TABLE_SLUG_PAGES,
      withIndex: {
        name: "by_slug",
        range: (q) => q.eq("slug", slug)
      },
      limit: 1,
    })
  },
})
