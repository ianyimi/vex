import { blocks, defineCollection, text, upload } from "@vexcms/core"

import { TABLE_SLUG_IMAGES, TABLE_SLUG_PAGES } from "~/db/constants"
import { pageBlocks } from "~/vexcms/blocks/config"

export const pages = defineCollection({
  slug: TABLE_SLUG_PAGES,
  admin: {
    table: { defaultColumns: ["title", "slug", "_id"] },
    useAsTitle: "title",
  },
  fields: {
    title: text({
      label: "Title",
      required: true,
    }),
    slug: text({
      description: "URL-friendly page path",
      index: "by_slug",
      label: "Slug",
      required: true,
    }),
    blocks: blocks({
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
