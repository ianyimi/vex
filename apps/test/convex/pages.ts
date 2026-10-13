import { DRAFT_ACTIONS } from "@vexcms/core";
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

/**
 * Returns the page matching `slug`, preferring its draft row when one exists — the
 * live-preview base layer's authenticated counterpart to `getBySlug`. Called only when
 * `PageContent.tsx`'s `useSitePreviewMode` detects an active preview session.
 *
 * Never bypasses access: `drafts: true` lifts the published-only filter, and
 * `access: { action: DRAFT_ACTIONS.readDrafts }` means a row reaches the caller only
 * when their resolved session holds `readDrafts` on `pages`. Everyone else — including
 * anonymous visitors — gets `[]`, never draft content.
 *
 * @param args.slug - The page slug to preview.
 * @returns The draft row if one exists, else the published row, else `[]` — the same
 *   shape `getBySlug` returns. A denied request and a bad slug are indistinguishable.
 */
export const getBySlugPreview = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    // No `limit`: a published row and its draft twin both carry this slug until an
    // editor changes it, so both must be seen before choosing (at most two rows).
    const matches = await find({
      ctx,
      collection: TABLE_SLUG_PAGES,
      withIndex: {
        name: "by_slug",
        range: (q) => q.eq("slug", slug),
      },
      drafts: true,
      access: { action: DRAFT_ACTIONS.readDrafts },
    });
    const draft = matches.find((doc) => doc.vex_status === "draft");
    return draft ? [draft] : matches.filter((doc) => doc.vex_status === "published");
  },
});
