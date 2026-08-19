import { v } from "convex/values";

import { TABLE_SLUG_PAGES } from "~/db/constants";
import { find } from "~/vexcms/api";

import { query } from "./_generated/server";

export const getBySlug = query({
  args: {
    slug: v.id(TABLE_SLUG_PAGES),
  },
  handler: async (ctx, { slug }) => {
    return await find({
      ctx,
      collection: TABLE_SLUG_PAGES,
      withIndex: {
        name: "by_slug",
        range: (q) => q.eq("slug", slug),
      },
      limit: 1,
    });
  },
});
