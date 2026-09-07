import { api } from "@convex/_generated/api"
import { createVexRevalidateRoute } from "@vexcms/next/cache"

import { fetchAuthQuery, getToken } from "~/auth/server"
import config from "~/vex.config"

/**
 * `POST /api/vex/revalidate` — session-authorized path purge.
 *
 * Called by `useVexMutation` after every admin-panel write, same origin, and
 * by the admin panel's Revalidate control over the same session. Never
 * secret-authorized: the caller must hold a real session with write
 * permission on the affected collection.
 */
export const { POST } = createVexRevalidateRoute({
  config,
  getToken,
  getAuth: () => fetchAuthQuery(api.auth.api.getUserOrg, {}),
})
