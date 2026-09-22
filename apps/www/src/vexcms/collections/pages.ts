import { blocks, defineCollection, text, upload } from "@vexcms/core";
import { ConvexError } from "convex/values";

import { TABLE_SLUG_IMAGES, TABLE_SLUG_PAGES } from "~/db/constants";
import { resolvePagePath } from "~/lib/resolvePagePath";
import { pageBlocks } from "~/vexcms/blocks/config";

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
    slug: text<typeof TABLE_SLUG_PAGES>({
      description: "URL-friendly page path",
      index: "by_slug",
      label: "Slug",
      required: true,
      validate: async ({ value, doc, vex }) => {
        const [existing] = await vex.find({ collection: TABLE_SLUG_PAGES, withIndex: {
          name: "by_slug",
          range: (q) => q.eq("slug", value),
        }, limit: 1 })
        if (existing && existing._id !== doc._id) {
          throw new ConvexError({
            code: "SLUG_CONFLICT",
            conflictingPageId: existing._id,
            message: `This slug is already in use by the page '${existing.title}'.`,
          });
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
});
