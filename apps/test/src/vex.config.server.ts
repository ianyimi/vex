import { betterAuthAdapter } from "@vexcms/better-auth";
import { defineServerConfig } from "@vexcms/core";
import { convexFileStorage } from "@vexcms/file-storage-convex";

import { authOptions } from "~/auth/options";

import vexConfig from "./vex.config";

/**
 * VexCMS server-only configuration for the demo/development site.
 *
 * Layers the Better Auth adapter and Convex storage adapter onto the
 * client-safe `vexConfig`. Consumed by `@vexcms/core` during `vex dev` and
 * `vex generate` to produce the Convex schema and TypeScript types, and by
 * every server route / Convex function that needs `config.access` or
 * `config.routes.map`.
 *
 * @see defineServerConfig in @vexcms/core
 * @see betterAuthAdapter in @vexcms/better-auth
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
});

export default config;
