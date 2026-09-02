import { betterAuthAdapter } from "@vexcms/better-auth"
import { defineConfig } from "@vexcms/core"
import { convexFileStorage } from "@vexcms/file-storage-convex"

import { authOptions } from "@convex/auth/options"

import { access } from "~/auth/access"
import { images, users } from "~/vexcms/collections"

/**
 * VexCMS configuration for this project.
 *
 * Registers the admin sidebar layout, the Better Auth adapter, Convex file
 * storage, and every collection. Add collections/globals here as you define
 * them — `vex dev` / `vex generate` derive the Convex schema and TypeScript
 * types from this file.
 *
 * @see defineConfig in @vexcms/core
 * @see betterAuthAdapter in @vexcms/better-auth
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
  collections: [users],
})

export default vexConfig
