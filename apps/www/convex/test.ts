import { find } from "@vexcms/core/server"

import { TABLE_SLUG_POSTS } from "~/db/constants"

import { query } from "./_generated/server"

export const getAll = query({
  handler: async (ctx) => {
    return await find({ ctx, collection: TABLE_SLUG_POSTS, populate: { parent: true } })
  },
})
