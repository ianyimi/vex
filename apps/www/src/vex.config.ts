import { authOptions } from "@convex/auth/options"
import { betterAuthAdapter } from "@vexcms/better-auth"
import { defineConfig } from "@vexcms/core"
import { convexFileStorage } from "@vexcms/file-storage-convex"

import { access } from "~/auth/access"
import { footers, headers, images, pages, themes, users } from "~/vexcms/collections"
import { siteSettings } from "~/vexcms/globals"

/**
 * VexCMS configuration for the marketing site.
 *
 * Replaces `templates/base-nextjs`'s bare config wholesale (overlay copy is
 * file-level, not a merge): carries base's `users`/`images` forward unchanged
 * and adds the four marketing collections plus `siteSettings`. `vex dev`/
 * `vex generate` consume this to produce the Convex schema and TypeScript
 * types.
 */
const vexConfig = defineConfig({
  access,
  admin: {
    sidebar: {
      side: "right",
    },
  },
  authAdapter: betterAuthAdapter({ config: authOptions }),
  storage: {
    adapters: [convexFileStorage({ mediaCollections: [images] })],
  },
  collections: [users, pages, headers, footers, themes],
  globals: [siteSettings],
})

export default vexConfig
