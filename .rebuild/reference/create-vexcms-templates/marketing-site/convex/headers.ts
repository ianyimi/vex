import { query } from "./_generated/server"

/**
 * Get the first published header.
 * Used by the public site layout for server-side preloading.
 */
export const getFirst = query({
  args: {},
  handler: async (ctx) => {
    const header = await ctx.db.query("headers").first()
    if (!header || header.vex_status === "draft") return null
    return header
  },
})
