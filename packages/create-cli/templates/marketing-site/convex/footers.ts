import { query } from "./_generated/server"

/**
 * Get the first published footer.
 * Used by the public site layout for server-side preloading.
 */
export const getFirst = query({
  args: {},
  handler: async (ctx) => {
    const footer = await ctx.db.query("footers").first()
    if (!footer || footer.vex_status === "draft") return null
    return footer
  },
})
