import { api } from "@convex/_generated/api"
import { createVexRevalidateRoute } from "@vexcms/next/cache"

import { getToken, getUserOrgForVexApi } from "~/auth/server"
import { vex } from "~/lib/vex"
import config from "~/vex.config.server"

/**
 * `POST /api/vex/revalidate` — session-authorized path purge.
 *
 * Called by `useVexMutation` after every admin-panel write, same origin, and
 * by the admin panel's Revalidate control over the same session. Never
 * secret-authorized: the caller must hold a real session with write
 * permission on the affected collection.
 *
 * `listCollection` wires the collection-wide purge ("Revalidate all"). `pages`
 * is the only collection this template's route mapper resolves paths for, so
 * any other slug lists nothing.
 */
export const { POST } = createVexRevalidateRoute({
  config,
  getToken,
  getAuth: getUserOrgForVexApi,
  listCollection: async (collection) => {
    if (collection !== "pages") return []
    const entries = await vex.query(api.pages.publishedSlugs, {})
    // Narrowed to `slug` deliberately: it is the only field the route mapper
    // reads, and these documents are being purged, not written, so there is
    // no `_id`/`_creationTime` for the snapshot to carry.
    return entries.map(({ slug }) => ({ slug }))
  },
})
