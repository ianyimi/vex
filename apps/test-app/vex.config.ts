import { defineConfig } from "@vexcms/core"

import { categories, posts, users } from "~/vexcms/collections"

export default defineConfig({
  admin: {
    basePath: "/admin",
    meta: {
      titleSuffix: " | Vex CMS",
    },
  },
  collections: [posts, users, categories],
})

export type Category = typeof categories._docType
export type Post = typeof posts._docType
export type User = typeof users._docType
