import { defineConfig } from "@vexcms/core"
import { convexFileStorage } from "@vexcms/file-storage-convex"

import { auth } from "~/vexcms/auth"
import { articles, categories, media, posts, users } from "~/vexcms/collections"

export default defineConfig({
  admin: {
    meta: {
      favicon: "/favicon/favicon.ico",
      titleSuffix: " | Vex CMS",
    },
    sidebar: {
      hideGlobals: true,
    },
    user: "users",
  },
  auth,
  basePath: "/admin",
  collections: [articles, posts, users, categories],
  media: {
    collections: [media],
    storageAdapter: convexFileStorage(),
  },
})

export type Category = typeof categories._docType
export type Post = typeof posts._docType
export type User = typeof users._docType
