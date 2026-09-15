import { authOptions } from "@convex/auth/options"
import { betterAuthAdapter } from "@vexcms/better-auth"
import { defineServerConfig } from "@vexcms/core"
import { convexFileStorage } from "@vexcms/file-storage-convex"

import vexConfig from "./vex.config"

/**
 * VexCMS server-only configuration for the marketing site.
 *
 * Layers the Better Auth adapter and Convex storage adapter onto the
 * client-safe `vexConfig`. `vex dev` / `vex generate` consume this to
 * produce the Convex schema and TypeScript types.
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
