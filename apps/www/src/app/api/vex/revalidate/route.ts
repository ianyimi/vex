import { api } from "@convex/_generated/api"
import { createVexRevalidateRoute } from "@vexcms/next/cache"

import { fetchAuthQuery, getToken } from "~/auth/server"
import { vex } from "~/lib/vex"
import config from "~/vex.config"

/**
 * `POST /api/vex/revalidate` — session-authorized path purge for this app.
 *
 * Called by `useVexMutation` after every admin-panel write (same origin), and
 * by the panel's Revalidate control over the same session.
 *
 * Never secret-authorized: the caller must hold a real session carrying write
 * permission on the affected collection, which the factory re-checks with
 * `hasPermission` before purging anything. That is why this route needs no env
 * var of its own — it adds no credential the signed-in caller didn't already
 * present.
 *
 * `listCollection` wires the collection-wide purge ("Revalidate all"). `pages`
 * is the only collection this app's route mapper resolves paths for, so any
 * other slug lists nothing — the mapper would return `[]` for its documents
 * regardless, and reading them would be wasted work.
 */
export const { POST } = createVexRevalidateRoute({
  config,
  getAuth: () => fetchAuthQuery(api.auth.api.getUserOrg, {}),
  getToken,
  listCollection: async (collection) => {
    if (collection !== "pages") return []
    const entries = await vex.query(api.pages.publishedSlugs, {})
    // Narrowed to `slug` deliberately: it is the only field the route mapper
    // reads, and these documents are being purged, not written, so there is no
    // `_id`/`_creationTime` for the snapshot to carry.
    return entries.map(({ slug }) => ({ slug }))
  },
})
