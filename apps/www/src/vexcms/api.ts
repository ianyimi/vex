import { type DataModel } from "@convex/_generated/dataModel"
import { createGetAuth } from "@vexcms/better-auth"
import { vexServerApi } from "@vexcms/core/server"

import { TABLE_SLUG_SESSIONS, TABLE_SLUG_USERS } from "~/db/constants"
import config from "~/vex.config"

/**
 * Bound server API — `config`/`getAuth` are threaded once here so
 * `convex/pages.ts`, `convex/headers.ts`, and `convex/footers.ts` can import
 * `find` directly instead of repeating the wiring in every file.
 *
 * Mirrors `apps/test/src/vexcms/api.ts`'s `vexServerApi` binding.
 */
export const { create, find, get, globals, publishedSlugs, remove, search, update } =
  vexServerApi<DataModel>({
    config,
    getAuth: createGetAuth({
      resolveOrgs: false,
      sessionCollectionSlug: TABLE_SLUG_SESSIONS,
      userCollectionSlug: TABLE_SLUG_USERS,
    }),
  })
