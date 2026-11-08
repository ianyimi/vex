import { DRAFT_ACTIONS } from "@vexcms/core"
import { v } from "convex/values"

import { TABLE_SLUG_POSTS } from "~/db/constants"
import { find, publishedSlugs as readPublishedSlugs } from "~/vexcms/api"

import { query } from "./_generated/server"

/**
 * Returns the post document matching the given slug.
 *
 * Uses the `by_slug` index for efficient lookup. Returns an empty array if
 * no post with that slug exists (caller handles 404 via `notFound()`).
 *
 * Access is bypassed: this is read at build/request time by anonymous
 * visitors on the public post page, who carry no session and would
 * otherwise be filtered out by the default-deny RBAC posture.
 *
 * @param args.slug - URL slug to look up (e.g. `"vexcms-0-1-0"`)
 * @returns Array containing the matching `Post` document, or empty if not found.
 */
export const getBySlug = query({
  args: v.object({
    slug: v.string(),
  }),
  handler: async (ctx, { slug }) => {
    return await find({
      ctx,
      collection: TABLE_SLUG_POSTS,
      withIndex: {
        name: "by_slug",
        range: (q) => q.eq("slug", slug),
      },
      limit: 1,
      access: {
        bypass: true,
      },
    })
  },
})

/**
 * Returns the post matching `slug`, preferring its draft row when one exists —
 * the live-preview base layer's authenticated counterpart to `getBySlug`, same
 * contract as `pages.getBySlugPreview`. Called only when `PostContent.tsx`'s
 * `useSitePreviewMode` detects an active preview session.
 *
 * Never bypasses access: a row reaches the caller only when their session holds
 * `readDrafts` on `posts` (`~/auth/access.ts`). Everyone else gets `[]`.
 *
 * @param args.slug - The post slug to preview.
 * @returns The draft row if one exists, else the published row, else `[]`.
 */
export const getBySlugPreview = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const matches = await find({
      ctx,
      collection: TABLE_SLUG_POSTS,
      withIndex: {
        name: "by_slug",
        range: (q) => q.eq("slug", slug),
      },
      drafts: true,
      access: { action: DRAFT_ACTIONS.readDrafts },
    })
    const draft = matches.find((doc) => doc.vex_status === "draft")
    return draft ? [draft] : matches.filter((doc) => doc.vex_status === "published")
  },
})

/**
 * Returns `{ slug, createdAt, updatedAt? }` for every published post document.
 *
 * Consumed by `app/sitemap.ts`. Access is bypassed for the same reason
 * `getBySlug` bypasses it: read at build time by anonymous crawlers, who
 * carry no session.
 */
export const publishedSlugs = query({
  args: {},
  handler: async (ctx) => {
    return await readPublishedSlugs({
      access: { bypass: true },
      collection: TABLE_SLUG_POSTS,
      ctx,
    })
  },
})
