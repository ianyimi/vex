import { defineCollection, defineConfig } from "@vexcms/core"
import { convexFileStorage } from "@vexcms/file-storage-convex"

import { TABLE_SLUG_USERS } from "~/db/constants"
import { access } from "~/vexcms/access"
import { auth } from "~/vexcms/auth"
import { footers, headers, media, pages, posts, themes, users } from "~/vexcms/collections"
import { siteSettings } from "~/vexcms/globals"

export default defineConfig({
  collections: [posts],
})

// export default defineConfig({
//   access,
//   admin: {
//     meta: {
//       titleSuffix: " | My Site",
//     },
//     user: TABLE_SLUG_USERS,
//   },
//   breakpoints: {
//     sm: 640,
//     md: 768,
//     lg: 1024,
//     xl: 1280,
//   },
//   auth,
//   basePath: "/admin",
//   collections: [pages, headers, footers, themes, users],
//   globals: [siteSettings],
//   media: {
//     collections: [media],
//     storageAdapter: convexFileStorage(),
//   },
// })
