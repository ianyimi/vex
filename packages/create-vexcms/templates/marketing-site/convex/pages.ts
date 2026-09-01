import { v } from "convex/values"

import { TABLE_SLUG_PAGES } from "~/db/constants"
import { find } from "~/vexcms/api"

import { query } from "./_generated/server"

/**
 * Returns the page document matching the given slug, or an empty array if
 * none exists. Byte-identical in shape to `apps/test/convex/pages.ts:57-77`'s
 * `getBySlug` (same collection-level `find` + `withIndex` + `access.bypass`
 * pattern) with only the collection constant swapped.
 *
 * Access is bypassed: rendered by `[slug]/page.tsx` and `page.tsx` for
 * anonymous visitors, who have no roles and would otherwise be filtered out.
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await find({
      ctx,
      collection: TABLE_SLUG_PAGES,
      withIndex: {
        name: "by_slug",
        range: (q) => q.eq("slug", slug),
      },
      limit: 1,
      access: { bypass: true },
    })
  },
})
