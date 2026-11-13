import type { HiddenDocument } from "@vexcms/core";

import { v } from "convex/values";

import type { Image, Page, Theme } from "~/vex.types";

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
 * `testImage`/`themes` resolved to their real target documents — the
 * `populate`-resolved counterpart to `Page` this module owns, so
 * `src/components/ThemeLive.typecheck.ts` imports the NAME instead of
 * deriving it from the function reference. Exists ONLY so that file can pin
 * `useLivePreviewQuery`/`useLivePreviewDocumentQuery`'s overridable `TData`
 * generic against a REAL `populate`-resolved Convex function, not a
 * hand-rolled stand-in — `find`'s own generics infer the populated shape
 * directly from `populate: { testImage: true, themes: true }` below, the
 * same inference `nested-populate-demo/page.tsx` proves for a nested field.
 */
export type PopulatedPage = Omit<Page, "testImage" | "themes"> & {
  testImage?: (HiddenDocument<"images"> | Image)[];
  themes?: (HiddenDocument<"themes"> | Theme)[];
};

export const getBySlugPopulated = query({
  args: v.object({
    slug: v.string(),
  }),
  handler: async (ctx, { slug }): Promise<PopulatedPage[]> => {
    return await find({
      ctx,
      collection: TABLE_SLUG_PAGES,
      withIndex: {
        name: "by_slug",
        range: (q) => q.eq("slug", slug),
      },
      limit: 1,
      populate: { testImage: true, themes: true },
      access: {
        bypass: true,
      },
    });
  },
});

/**
 * Single-document counterpart to `getBySlugPopulated` — same populate, `[0]`
 * narrowed server-side — so `ThemeLive.typecheck.ts` can ALSO pin
 * `useLivePreviewDocumentQuery`'s overridable `TData` against a real
 * `populate`-resolved function returning one document (or `null`), the
 * `getFirst`-style shape `headers.ts`/`footers.ts` already use.
 */
export const getFirstPopulated = query({
  args: v.object({
    slug: v.string(),
  }),
  handler: async (ctx, { slug }): Promise<null | PopulatedPage> => {
    const [page] = await find({
      ctx,
      collection: TABLE_SLUG_PAGES,
      withIndex: {
        name: "by_slug",
        range: (q) => q.eq("slug", slug),
      },
      limit: 1,
      populate: { testImage: true, themes: true },
      access: {
        bypass: true,
      },
    });
    return page ?? null;
  },
});

/**
 * Returns the page matching `slug`, preferring its draft row when one exists — the
 * live-preview base layer's authenticated counterpart to `getBySlug`. Called only when
 * `PageContent.tsx`'s `useIsLivePreviewActive` detects an active preview session.
 *
 * Passes `drafts: true` with NO `access` override, so `find`'s own fallback decides:
 * a resolved session holding `readDrafts` on `pages` gets the draft-merged row;
 * everyone else — including anonymous visitors and a caller whose live-preview
 * session just expired — silently falls back to the published row instead of being
 * denied entirely. A draft never reaches a caller without `readDrafts`.
 *
 * @param args.slug - The page slug to preview.
 * @returns The draft row if the caller may read drafts, else the published row,
 *   else `[]` — the same shape `getBySlug` returns. A denied request and a bad
 *   slug are indistinguishable.
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
    });
    const draft = matches.find((doc) => doc.vex_status === "draft");
    return draft ? [draft] : matches.filter((doc) => doc.vex_status === "published");
  },
});
