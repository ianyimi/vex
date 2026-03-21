import { defineConfig } from "@vexcms/core"
import { convexFileStorage } from "@vexcms/file-storage-convex"

import { auth } from "~/vexcms/auth"
import {
  footers,
  headers,
  media,
  pages,
  siteSettings,
  themes,
  users,
} from "~/vexcms/collections"

export default defineConfig({
  admin: {
    meta: {
      titleSuffix: " | My Site",
    },
    sidebar: {
      hideGlobals: true,
    },
    user: "user",
  },
  auth,
  basePath: "/admin",
  collections: [pages, headers, footers, themes, siteSettings, users],
  media: {
    collections: [media],
    storageAdapter: convexFileStorage(),
  },
})
