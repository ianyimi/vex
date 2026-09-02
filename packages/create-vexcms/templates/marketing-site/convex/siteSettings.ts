import { getGlobal } from "@vexcms/core/server"

import { GLOBAL_SLUG_SITE_SETTINGS } from "~/db/constants"
import config from "~/vex.config"

import { query } from "./_generated/server"

/**
 * Public site settings — name, description, SEO defaults, and the theme
 * references. `siteSettings` lives in the shared `vex_globals` table, so
 * this reads through `getGlobal` rather than a dedicated table (unlike the
 * reference's `ctx.db.query("site_settings")`, which assumes a table that
 * doesn't exist under the current architecture).
 *
 * Access is bypassed: read by `src/lib/metadata.ts` and the root layout for
 * anonymous visitors before any session exists.
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    return await getGlobal({
      ctx,
      config,
      slug: GLOBAL_SLUG_SITE_SETTINGS,
      access: { bypass: true },
    })
  },
})
