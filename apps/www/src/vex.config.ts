import { defineConfig } from "@vexcms/core"

import { posts } from "~/vexcms/collections/posts"

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
