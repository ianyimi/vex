import { authOptions } from "@convex/auth/options"
import { betterAuthAdapter } from "@vexcms/better-auth"
import { defineServerConfig } from "@vexcms/core"
import { convexFileStorage } from "@vexcms/file-storage-convex"

import vexConfig from "./vex.config"

/**
 * VexCMS server-only configuration for the marketing site.
 *
 * Layers the Better Auth adapter and Convex file storage onto the
 * client-safe `vexConfig`. You write this file once at scaffold time and
 * rarely revisit it — day-to-day settings live in `vex.config.ts`.
 *
 * @see ./vex.config for the client-safe half this layers onto
 */
const config = defineServerConfig({
  config: vexConfig,
  server: {
    auth: { adapter: betterAuthAdapter({ config: authOptions }) },
    storage: {
      adapters: [convexFileStorage()],
    },
  },
})

export default config
