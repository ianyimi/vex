import { betterAuthCollections } from "@vexcms/better-auth/client";
import { defineConfig } from "@vexcms/core";
import { uploadFile } from "@vexcms/file-storage-convex/client";

import {
  articles,
  caseStudies,
  changelog,
  comments,
  footers,
  headers,
  images,
  pages,
  themes,
  users,
} from "~/vexcms/collections";

import { access } from "./auth/access";
import { authSchema } from "./auth/schema";
import { nav } from "./vexcms/globals/nav";
import { siteSettings } from "./vexcms/globals/siteSettings";

/**
 * VexCMS client-safe configuration for the demo/development site.
 *
 * Defines the admin sidebar layout and all registered collections and
 * globals: pages, headers, footers, themes, site settings, and the
 * editorial set (articles, case studies, changelog, comments) that exercises
 * the shared access-rule helpers. Imported directly by the browser via
 * `VexConfigProvider` — nothing here reaches a server SDK or an environment
 * variable.
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
  collections: [
    pages,
    users,
    headers,
    footers,
    themes,
    articles,
    caseStudies,
    changelog,
    comments,
  ],
  mediaCollections: [images],
  globals: [nav, siteSettings],
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
      return [slug === "home" ? "/" : `/${slug}`];
    },
  },
});

export default vexConfig;
