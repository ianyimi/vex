import { TABLE_SLUG_HEADERS } from "~/db/constants"
import { find } from "~/vexcms/api"

import { query } from "./_generated/server"

/**
 * The site header — `headers` has one document in practice (seeded as "Main
 * Header"); this returns the first one found, or `null`.
 *
 * Access is bypassed: the header renders on every public route before any
 * session exists.
 */
export const getFirst = query({
  args: {},
  handler: async (ctx) => {
    const [header] = await find({
      ctx,
      collection: TABLE_SLUG_HEADERS,
      limit: 1,
      access: { bypass: true },
    })
    return header ?? null
  },
})
