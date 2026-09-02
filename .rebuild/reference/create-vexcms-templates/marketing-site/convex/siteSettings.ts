import { query } from "./_generated/server"

/**
 * Get the published site settings.
 * Used by server components for SEO metadata generation.
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("site_settings").first()
    if (!settings) return null
    return settings
  },
})
