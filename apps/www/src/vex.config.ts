import { authSchema } from "@convex/auth/schema";
import { betterAuthCollections } from "@vexcms/better-auth/client";
import { defineConfig } from "@vexcms/core";
import { uploadFile } from "@vexcms/file-storage-convex/client";

import { access } from "~/auth/access";
import { resolvePagePath } from "~/lib/resolvePagePath";
import { footers, headers, images, pages, themes, users } from "~/vexcms/collections";
import { siteSettings } from "~/vexcms/globals";

/**
 * VexCMS client-safe configuration for the marketing site.
 *
 * Replaces `templates/base-nextjs`'s bare config wholesale (overlay copy is
 * file-level, not a merge): carries base's `users`/`images` forward unchanged
 * and adds the four marketing collections plus `siteSettings`. Imported
 * directly by the browser via `VexConfigProvider`.
 *
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
  collections: [users, pages, headers, footers, themes],
  mediaCollections: [images],
  globals: [siteSettings],
  routes: {
    // One document at a time. `resolveTargets` calls this once for `before`
    // and once for `after` on an update, so a slug rename purges the old path
    // too without the map looping over both itself.
    map: ({ collection, doc }) => {
      if (collection !== pages.slug) {
        return [];
      }
      const { slug } = doc;
      if (typeof slug !== "string") {
        return [];
      }
      const path = resolvePagePath(slug);
      return path === undefined ? [] : [path];
    },
  },
  livePreview: {
    allowedOrigins: [
      "http://localhost:3030",
      ...(process.env.NEXT_PUBLIC_SITE_URL ? [process.env.NEXT_PUBLIC_SITE_URL] : []),
    ],
  },
});

export default vexConfig;
