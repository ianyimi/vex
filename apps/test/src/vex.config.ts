import { betterAuthCollections } from "@vexcms/better-auth/client";
import { BUILTIN_CONTRIBUTION_IDS, defineConfig } from "@vexcms/core";
import { uploadFile } from "@vexcms/file-storage-convex/client";
import { plateEditor } from "@vexcms/richtext-plate";

import {
  articles,
  caseStudies,
  changelog,
  comments,
  fields,
  footers,
  headers,
  images,
  pages,
  posts,
  themes,
  users,
} from "~/vexcms/collections";
import { CopyDocumentIdMenuItem } from "~/vexcms/components/CopyDocumentIdMenuItem";

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
  editor: plateEditor(),
  admin: {
    sidebar: {
      side: "right",
    },
    components: {
      edit: {
        // Dogfoods a root-level `admin.components.edit.actionsMenu.items` contribution,
        // ordered after the built-ins (default array order — no `order`/`before`/`after`
        // needed since it only needs to come after whatever's already there). `access` gates it
        // to collections only, declaratively — a global singleton has no per-document id worth
        // copying, and the component itself returning `null` for a global (rather than being
        // filtered out of the resolved list) left an empty ⋯ trigger on every unversioned global
        // (nothing else in its menu to fall back to, e.g. `siteSettings`).
        actionsMenu: {
          items: [
            {
              id: "editorial.copyDocumentId",
              component: CopyDocumentIdMenuItem,
              after: BUILTIN_CONTRIBUTION_IDS.edit.duplicate,
              access: (ctx) => ctx.resource?.kind === "collection",
            },
          ],
        },
      },
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
    fields,
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
