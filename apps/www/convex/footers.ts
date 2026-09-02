import { TABLE_SLUG_FOOTERS } from "~/db/constants"
import { find } from "~/vexcms/api"

import { query } from "./_generated/server"

/** Same shape as `convex/headers.ts`'s `getFirst`, for `footers`. */
export const getFirst = query({
  args: {},
  handler: async (ctx) => {
    const [footer] = await find({
      ctx,
      collection: TABLE_SLUG_FOOTERS,
      limit: 1,
      access: { bypass: true },
    })
    return footer ?? null
  },
})
