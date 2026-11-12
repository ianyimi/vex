import { v } from "convex/values";

import { TABLE_SLUG_POSTS } from "~/db/constants";
import { find } from "~/vexcms/api";

import { query } from "./_generated/server";

/**
 * Returns the post document matching the given slug.
 *
 * Uses the `by_slug` index for efficient lookup. Returns an empty array if
 * no post with that slug exists (caller handles 404 via `notFound()`).
 *
 * Access is bypassed: this is read at build/request time by anonymous
 * visitors on the dogfood post page, who carry no session and would
 * otherwise be filtered out by `posts`' editorial permissions
 * (`~/auth/access.ts`), which exist to test role-scoped drafts, not to gate
 * public reads of a published post.
 *
 * @param data.slug - URL slug to look up (e.g. `"hello-world"`)
 * @returns Array containing the matching `Post` document, or empty if not found.
 */
export const getBySlug = query({
  args: { slug: v.string() },
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
    });
  },
});

/**
 * Returns the post matching `slug`, preferring its draft row when one exists — the
 * live-preview base layer's authenticated counterpart to `getBySlug`, same contract
 * as `pages.getBySlugPreview`. Called only when `PostContent.tsx`'s
 * `useIsLivePreviewActive` detects an active preview session.
 *
 * Passes `drafts: true` with NO `access` override, so `find`'s own fallback decides:
 * a session holding `readDrafts` on `posts` (`~/auth/access.ts`) gets the
 * draft-merged row; everyone else — including a caller whose live-preview session
 * just expired — silently falls back to the published row instead of being denied
 * entirely. A draft never reaches a caller without `readDrafts`.
 *
 * @param args.slug - The post slug to preview.
 * @returns The draft row if the caller may read drafts, else the published row,
 *   else `[]`.
 */
export const getBySlugPreview = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    // No `limit`: a published row and its draft twin can share this slug.
    const matches = await find({
      ctx,
      collection: TABLE_SLUG_POSTS,
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
