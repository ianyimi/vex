import { betterAuthAdapter } from "@vexcms/better-auth";
import { defineConfig } from "@vexcms/core";
import { convexFileStorage } from "@vexcms/file-storage-convex";

import { authOptions } from "~/auth/options";
import { footers, headers, images, pages, siteSettings, themes } from "~/vexcms/collections";

/**
 * VexCMS configuration for the demo/development site.
 *
 * Defines the admin sidebar layout, auth adapter (Better Auth), and all
 * registered collections: pages, headers, footers, themes, and site settings.
 *
 * This config is consumed by `@vexcms/core` during `vex dev` and `vex generate`
 * to produce the Convex schema and TypeScript types.
 *
 * @see defineConfig in @vexcms/core
 * @see betterAuthAdapter in @vexcms/better-auth
 */
const vexConfig = defineConfig({
  admin: {
    sidebar: {
      side: "right",
    },
  },
  authAdapter: betterAuthAdapter({ config: authOptions }),
  storage: {
    adapters: [convexFileStorage({ mediaCollections: [images] })],
  },
  collections: [pages, headers, footers, themes, siteSettings],
});

export default vexConfig;
