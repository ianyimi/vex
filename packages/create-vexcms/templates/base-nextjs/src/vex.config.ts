import { betterAuthCollections } from "@vexcms/better-auth/client"
import { defineConfig } from "@vexcms/core"
import { uploadFile } from "@vexcms/file-storage-convex/client"

import { authSchema } from "@convex/auth/schema"

import { access } from "~/auth/access"
import { images, users } from "~/vexcms/collections"

/**
 * VexCMS client-safe configuration for this project.
 *
 * Registers the admin sidebar layout and every collection, global, and
 * media collection. Add collections/globals here as you define them —
 * `vex dev` / `vex generate` derive the Convex schema and TypeScript types
 * from this file, and the browser imports it directly via
 * `VexConfigProvider`, so nothing here may reach a server SDK or an
 * environment variable.
 *
 * @see defineConfig in @vexcms/core
 * @see ./vex.config.server for the auth adapter and storage adapter wiring
 */
const vexConfig = defineConfig({
  access,
  authCollections: betterAuthCollections(authSchema),
  admin: {
    sidebar: {
      side: "right",
    },
  },
  storage: {
    clientUploads: { convex: uploadFile },
  },
  collections: [users],
  mediaCollections: [images],
})

export default vexConfig
