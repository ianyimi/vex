import { betterAuthOptions } from "@convex/auth/options"
import { vexBetterAuth } from "@vexcms/better-auth"
import { defineConfig } from "@vexcms/core"

import { articles, categories, posts, users } from "~/vexcms/collections"

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
  auth: vexBetterAuth({ config: betterAuthOptions }),
  basePath: "/admin",
  collections: [articles, posts, users, categories],
})

export type Category = typeof categories._docType
export type Post = typeof posts._docType
export type User = typeof users._docType
