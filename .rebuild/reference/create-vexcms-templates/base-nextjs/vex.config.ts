import { defineConfig } from "@vexcms/core"
import { convexFileStorage } from "@vexcms/file-storage-convex"

import { auth } from "~/vexcms/auth"
import { access } from "~/vexcms/access"

export default defineConfig({
  access,
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
