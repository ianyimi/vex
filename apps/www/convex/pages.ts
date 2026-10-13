import { DRAFT_ACTIONS } from "@vexcms/core";
import { v } from "convex/values";

import { TABLE_SLUG_PAGES } from "~/db/constants";
import { find, publishedSlugs as readPublishedSlugs } from "~/vexcms/api";

import { query } from "./_generated/server";

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
    });
  },
});

/**
 * Returns the page document matching `slug`, preferring its draft row when one
 * exists — the live-preview base layer's authenticated counterpart to `getBySlug`
 * above. Called ONLY when `PageContent.tsx`'s `useSitePreviewMode` detects an active
 * live-preview session (`?vexLivePreview=1` plus the session-verified
 * `vex-live-preview` cookie `proxy.ts` sets); a normal page load never reaches this.
 *
 * Passes `drafts: true` so Step 13's published-only filter does not apply, and
 * `access: { action: DRAFT_ACTIONS.readDrafts }` so a row only reaches the caller
 * when their RESOLVED session (never a client-supplied claim — `find` resolves `ctx`
 * through the bound `vexServerApi`'s `getAuth`) is granted `readDrafts` on `pages`.
 * `access.ts` grants this to `admin` only; every other caller — including the
 * anonymous role every unauthenticated request resolves to — is denied and gets an
 * empty array, never draft content. This query never bypasses access (contrast
 * `getBySlug`'s `access: { bypass: true }` above) — that is the whole point of it
 * existing as a second query rather than a flag on the first.
 *
 * @param args.slug - The page slug to preview.
 * @returns The draft row for `slug` if one exists, else the published row, else an
 *   empty array — the same shape `getBySlug` returns. Never throws: a denied or
 *   nonexistent-slug request both resolve to `[]`, indistinguishably.
 */
export const getBySlugPreview = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    // No `limit`: a published row and its draft twin both carry this slug until an
    // editor changes it, so both must be seen before choosing. The one-draft-per-
    // document invariant bounds this at two rows. A caller without `readDrafts` gets
    // `[]` (find's per-row check denies every row), never an error — so a denied
    // request and a bad slug are indistinguishable.
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
    // Prefer the draft: it's what the preview exists to show (also covers a
    // never-published draft, which is the only match).
    const draft = matches.find((doc) => doc.vex_status === "draft");
    return draft ? [draft] : matches.filter((doc) => doc.vex_status === "published");
  },
});

/**
 * Returns `{ slug, createdAt, updatedAt? }` for every page document.
 *
 * Consumed by `app/sitemap.ts` and, once Step 7 lands, `[slug]/page.tsx`'s
 * `generateStaticParams`. Access is bypassed for the same reason `getBySlug`
 * bypasses it: both are read at build time and by anonymous crawlers, neither
 * of which carries a session.
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
