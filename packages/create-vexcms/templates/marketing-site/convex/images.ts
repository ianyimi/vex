import { v } from "convex/values"

import { TABLE_SLUG_IMAGES } from "~/db/constants"
import { get } from "~/vexcms/api"

import { query } from "./_generated/server"

/**
 * Returns the `images` document for `args.id`, or `null`.
 *
 * `api.vex.media.getUrl` resolves a storage URL only (`GetUrlReturn` is
 * `{ url: string }`, shared across every storage adapter) — it can never
 * carry the CMS-authored `alt` field. This is the one query that reads the
 * document itself, so `MediaImage` can default its accessible name to what
 * an editor actually typed in the media library.
 *
 * Access is bypassed: every image rendered through `MediaImage` is already
 * public.
 */
export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId(TABLE_SLUG_IMAGES, args.id)
    if (!id) {return null}
    return await get({
      ctx,
      collection: TABLE_SLUG_IMAGES,
      id,
      access: { bypass: true },
    })
  },
})
