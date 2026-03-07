import { defineConfig } from "@vexcms/core"

import { articles, categories, posts, users } from "~/vexcms/collections"
import { auth } from "~/vexcms/auth"

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
})

export type Category = typeof categories._docType
export type Post = typeof posts._docType
export type User = typeof users._docType
