import { defineConfig } from "@vexcms/core"

import { categories, posts, users } from "~/vexcms/collections"

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
  basePath: "/admin",
  collections: [posts, users, categories],
})

export type Category = typeof categories._docType
export type Post = typeof posts._docType
export type User = typeof users._docType
