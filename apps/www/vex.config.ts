import { defineConfig } from "@vexcms/core"
import { convexFileStorage } from "@vexcms/file-storage-convex"

import { TABLE_SLUG_USERS } from "~/db/constants"
import { auth } from "~/vexcms/auth"
import { footers, headers, media, pages, themes, users } from "~/vexcms/collections"
import { siteSettings } from "~/vexcms/globals"

export default defineConfig({
  admin: {
    meta: {
      titleSuffix: " | My Site",
    },
    user: TABLE_SLUG_USERS,
  },
  auth,
  basePath: "/admin",
  collections: [pages, headers, footers, themes, users],
  globals: [siteSettings],
  media: {
    collections: [media],
    storageAdapter: convexFileStorage(),
  },
})
