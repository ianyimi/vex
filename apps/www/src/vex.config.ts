import { betterAuthAdapter } from "@vexcms/better-auth";
import { defineConfig } from "@vexcms/core";
import { convexFileStorage } from "@vexcms/file-storage-convex";

import { authOptions } from "~/auth/options";
import {
  articles,
  caseStudies,
  changelog,
  comments,
  footers,
  headers,
  images,
  pages,
  siteSettings,
  themes,
  users,
} from "~/vexcms/collections";

import { access } from "./auth/access";
import { nav } from "./vexcms/globals/nav";

/**
 * VexCMS configuration for the demo/development site.
 *
 * Defines the admin sidebar layout, auth adapter (Better Auth), and all
 * registered collections: pages, headers, footers, themes, site settings, and the
 * editorial set (articles, case studies, changelog, comments) that exercises the
 * shared access-rule helpers.
 *
 * This config is consumed by `@vexcms/core` during `vex dev` and `vex generate`
 * to produce the Convex schema and TypeScript types.
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
  collections: [
    pages,
    users,
    headers,
    footers,
    themes,
    siteSettings,
    articles,
    caseStudies,
    changelog,
    comments,
  ],
  globals: [nav],
});

export default vexConfig;
