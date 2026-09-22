
import { ConvexError } from "convex/values"

import { blocks, defineCollection, text, upload } from "@vexcms/core"

import { resolvePagePath } from "~/lib/resolvePagePath"
import { TABLE_SLUG_IMAGES, TABLE_SLUG_PAGES } from "~/db/constants"
import { pageBlocks } from "~/vexcms/blocks/config"

export const pages = defineCollection({
  slug: TABLE_SLUG_PAGES,
  admin: {
    table: { defaultColumns: ["title", "slug", "_id"] },
    useAsTitle: "title",
    icon: "FileText",
    livePreview: {
      url: (doc) => resolvePagePath(doc.slug),
    },
  },
  fields: {
    title: text({
      label: "Title",
      required: true,
    }),
    // One type argument — the collection's own slug — types `doc`, `value` and
    // `ctx` (the project's `DataModel` arrives through the generated
    // `@vexcms/core` augmentation).
    slug: text<typeof TABLE_SLUG_PAGES>({
      description: "URL-friendly page path",
      index: "by_slug",
      label: "Slug",
      required: true,
      validate: async ({ value, doc, ctx }) => {
        const existing = await ctx.db
          .query("pages")
          .withIndex("by_slug", (q) => q.eq("slug", value))
          .first()
        if (existing && existing._id !== doc._id) {
          // Rejection is a throw, so the payload can carry more than a message.
          throw new ConvexError({
            code: "SLUG_CONFLICT",
            conflictingPageId: existing._id,
            message: `This slug is already in use by the page '${existing.title}'.`,
          })
        }
      },
    }),
    blocks: blocks({
      admin: {
        defaultCollapsed: true,
      },
      blocks: pageBlocks,
      interfaceName: "PageBlock",
      label: "Content",
      labels: {
        singular: "Block",
        plural: "Blocks",
      },
      min: 1,
    }),
    metaTitle: text({
      label: "Meta Title",
      description: "Custom <title> tag. Falls back to page title if empty.",
      admin: {
        position: "sidebar",
      },
    }),
    metaDescription: text({
      label: "Meta Description",
      description: "Custom meta description for search results.",
      admin: {
        position: "sidebar",
      },
    }),
    ogImage: upload({
      to: TABLE_SLUG_IMAGES,
      label: "OG Image",
      admin: { position: "sidebar" },
    }),
  },
  labels: {
    plural: "Pages",
    singular: "Page",
  },
})
