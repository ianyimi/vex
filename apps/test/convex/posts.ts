import { DRAFT_ACTIONS } from "@vexcms/core";
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
    });
  },
});

/**
 * Returns the post matching `slug`, preferring its draft row when one exists — the
 * live-preview base layer's authenticated counterpart to `getBySlug`, same contract
 * as `pages.getBySlugPreview`. Called only when `PostContent.tsx`'s
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
    // No `limit`: a published row and its draft twin can share this slug.
    const matches = await find({
      ctx,
      collection: TABLE_SLUG_POSTS,
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
