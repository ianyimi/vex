import { blocks, defineCollection, imageUrl, text } from "@vexcms/core"

import { TABLE_SLUG_PAGES } from "~/db/constants"
import { pageBlocks } from "~/vexcms/blocks/config"

export const pages = defineCollection({
  slug: TABLE_SLUG_PAGES,
  admin: {
    defaultColumns: ["title", "slug", "vex_status", "_id"],
    group: "Site Builder",
    livePreview: {
      url: (doc) => `/preview/${doc.slug ?? doc._id}`,
    },
    useAsTitle: "title",
  },
  fields: {
    title: text({
      label: "Title",
      required: true,
    }),
    slug: text({
      admin: {
        description: "URL-friendly page path",
      },
      index: "by_slug",
      label: "Slug",
      required: true,
    }),
    content: blocks({
      blocks: pageBlocks,
      label: "Content",
      labels: {
        singular: "Block",
        plural: "Blocks",
      },
    }),
    metaTitle: text({
      label: "Meta Title",
      admin: {
        description: "Custom <title> tag. Falls back to page title if empty.",
        position: "sidebar",
      },
    }),
    metaDescription: text({
      label: "Meta Description",
      admin: {
        description: "Custom meta description for search results.",
        position: "sidebar",
      },
    }),
    ogImage: imageUrl({
      label: "OG Image",
      admin: {
        description: "Custom Open Graph image URL for social sharing.",
        position: "sidebar",
      },
    }),
  },
  labels: {
    plural: "Pages",
    singular: "Page",
  },
  versions: {
    drafts: true,
  },
})
