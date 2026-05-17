import { find, get } from "@vexcms/core/server"
import { v } from "convex/values"

import { type PageId, TABLE_SLUG_PAGES } from "~/db/constants"

import { query } from "./_generated/server"

export const list = query({
  handler: async (ctx) => {
    return await find({ ctx, collection: TABLE_SLUG_PAGES })
  },
})

export const getIndex = query({
  handler: async (ctx) => {
    return await get({ ctx, id: "jd7c3tr2ssz89pzdyx65by5k0n86razb" as PageId })
  },
})

export const getBySlug = query({
  args: v.object({
    slug: v.string(),
  }),
  handler: async (ctx, { slug }) => {
    return await find({
      ctx,
      collection: TABLE_SLUG_PAGES,
      filter: (q) => q.eq(q.field("slug"), slug),
      limit: 1,
    })
  },
})
