import { v } from "convex/values";

import { TABLE_SLUG_PAGES } from "~/db/constants";
import { find, publishedSlugs as readPublishedSlugs } from "~/vexcms/api";

import { query } from "./_generated/server";

/**
 * Returns all published pages ordered by creation date (newest first).
 *
 * @returns Array of `Page` documents.
 * @see getBySlug for fetching a single page by slug
 */
export const list = query({
  handler: async (ctx) => {
    return await find({ ctx, collection: TABLE_SLUG_PAGES });
  },
});

/**
 * Returns `{ slug, createdAt, updatedAt? }` for every page document.
 *
 * Consumed by `app/sitemap.ts` and `[slug]/page.tsx`'s `generateStaticParams`.
 * Access is bypassed for the same reason `getBySlug` bypasses it: both are
 * read at build time and by anonymous crawlers, neither of which carries a
 * session.
 */
export const publishedSlugs = query({
  args: {},
  handler: async (ctx) => {
    return await readPublishedSlugs({
      access: { bypass: true },
      collection: TABLE_SLUG_PAGES,
      ctx,
    });
  },
});

/**
 * Returns the page document matching the given slug.
 *
 * Uses the `by_slug` index for efficient lookup. Returns an empty array if
 * no page with that slug exists (caller handles 404 via `notFound()`).
 *
 * @param data.slug - URL slug to look up (e.g. `"about-us"`)
 * @returns Array containing the matching `Page` document, or empty if not found.
 * @example
 * ```ts
 * const pages = await fetchQuery(api.pages.getBySlug, { slug: "about-us" });
 * ```
 */
export const getBySlug = query({
  args: v.object({
    slug: v.string(),
  }),
  handler: async (ctx, { slug }) => {
    return await find({
      ctx,
      collection: TABLE_SLUG_PAGES,
      withIndex: {
        name: "by_slug",
        range: (q) => q.eq("slug", slug),
      },
      limit: 1,
      // Public read: rendered by `src/app/[slug]/page.tsx` for anonymous
      // visitors, who have no roles and would otherwise be filtered out.
      access: {
        bypass: true,
      },
    });
  },
});
