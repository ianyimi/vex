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
  posts,
  themes,
  users,
} from "~/vexcms/collections";

import { access } from "./auth/access";
import { authSchema } from "./auth/schema";
import { TABLE_SLUG_PAGES } from "./db/constants";
import { resolvePagePath } from "./lib/resolvePagePath";
import { announcement } from "./vexcms/globals/announcement";
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
    livePreview: {
      // `headers` declares its preview here rather than in its own
      // `defineCollection`, to keep both shapes exercised: a collection's own
      // block still wins field by field over its entry in this map.
      collections: {
        headers: { url: "/" },
      },
      globals: {
        // Server-resolved: reads the database with a real `ctx`. No helper and
        // no type argument — `vex generate` emits this project's `DataModel`
        // into the `@vexcms/core` augmentation, so `ctx` is typed from there
        // and `doc` from the map key.
        siteSettings: {
          url: {
            server: async ({ vex }) => {
              const [page] = await vex.find({
                collection: TABLE_SLUG_PAGES,
                withIndex: {
                  name: "by_slug",
                  range: (q) => q.eq("slug", "home"),
                },
                limit: 1,
              });
              return page ? `/${String(page.slug)}` : "/";
            },
          },
        },
      },
      allowedOrigins: [
        "http://localhost:3020",
        ...(process.env.NEXT_PUBLIC_SITE_URL ? [process.env.NEXT_PUBLIC_SITE_URL] : []),
      ],
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
    posts,
  ],
  mediaCollections: [images],
  globals: [nav, siteSettings, announcement],
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
});

export default vexConfig;
