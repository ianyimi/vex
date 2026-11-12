import { v } from "convex/values"

import { TABLE_SLUG_PAGES } from "~/db/constants"
import { find, publishedSlugs as readPublishedSlugs } from "~/vexcms/api"

import { query } from "./_generated/server"

/**
 * Returns the page document matching the given slug, or an empty array if
 * none exists. Byte-identical in shape to `apps/test/convex/pages.ts:57-77`'s
 * `getBySlug` (same collection-level `find` + `withIndex` + `access.bypass`
 * pattern) with only the collection constant swapped.
 *
 * Access is bypassed: rendered by `[slug]/page.tsx` and `page.tsx` for
 * anonymous visitors, who have no roles and would otherwise be filtered out.
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await find({
      ctx,
      collection: TABLE_SLUG_PAGES,
      withIndex: {
        name: "by_slug",
        range: (q) => q.eq("slug", slug),
      },
      limit: 1,
      access: { bypass: true },
    })
  },
})

/**
 * Returns the page document matching `slug`, preferring its draft row when
 * one exists — the live-preview base layer's authenticated counterpart to
 * `getBySlug` above. Called ONLY when `PageContent.tsx`'s
 * `useIsLivePreviewActive` detects an active live-preview session
 * (`?vexLivePreview=1` plus the session-verified `vex-live-preview` cookie
 * `proxy.ts` sets); a normal page load never reaches this.
 *
 * Passes `drafts: true` with NO `access` override, so `find`'s own fallback
 * decides: a RESOLVED session (never a client-supplied claim — `find`
 * resolves `ctx` through the bound `vexServerApi`'s `getAuth`) granted
 * `readDrafts` on `pages` gets the draft-merged row; everyone else —
 * including anonymous visitors and a caller whose live-preview session just
 * expired — silently falls back to the published row instead of being
 * denied entirely. A draft never reaches a caller without `readDrafts`.
 *
 * @param args.slug - The page slug to preview.
 * @returns The draft row for `slug` if the caller may read drafts, else the
 *   published row, else an empty array — the same shape `getBySlug` returns.
 */
export const getBySlugPreview = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    // No `limit`: a published row and its draft twin both carry this slug
    // until an editor changes it, so both must be seen before choosing.
    const matches = await find({
      ctx,
      collection: TABLE_SLUG_PAGES,
      withIndex: {
        name: "by_slug",
        range: (q) => q.eq("slug", slug),
      },
      drafts: true,
    })
    // Prefer the draft: it's what the preview exists to show (also covers a
    // never-published draft, which is the only match).
    const draft = matches.find((doc) => doc.vex_status === "draft")
    return draft ? [draft] : matches.filter((doc) => doc.vex_status === "published")
  },
})

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
    })
  },
})
