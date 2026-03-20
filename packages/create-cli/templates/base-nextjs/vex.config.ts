import { defineConfig } from "@vexcms/core"
import { convexFileStorage } from "@vexcms/file-storage-convex"

import { auth } from "~/vexcms/auth"

export default defineConfig({
  admin: {
    meta: {
      titleSuffix: " | Admin",
    },
    sidebar: {
      hideGlobals: true,
    },
    user: "user",
  },
  auth,
  basePath: "/admin",
  collections: [],
  media: {
    collections: [],
    storageAdapter: convexFileStorage(),
  },
})
