import { defineCollection, text, url } from "@vexcms/core"

import { TABLE_SLUG_PAGES } from "~/db/constants"

export const pages = defineCollection({
  slug: TABLE_SLUG_PAGES,
  interfaceName: "Page",
  labels: {
    singular: "Page",
    plural: "Pages",
  },
  admin: {
    useAsTitle: "title",
  },
  fields: {
    title: text({
      required: true,
      description: "Display title shown as the page heading and in browser tabs (as fallback).",
    }),
    slug: text({
      required: true,
      index: "by_slug",
      description: "URL-friendly identifier. Used for routing: /<slug>. Must be unique.",
    }),
    content: text({
      label: "Content",
      description:
        "Page body content. Stored as plain text until block support lands. Rendered with whitespace preservation.",
    }),
    metaTitle: text({
      label: "Meta Title",
      description:
        "Custom <title> tag for search engines. Falls back to the title field if empty.",
      admin: {
        position: "sidebar",
      },
    }),
    metaDescription: text({
      label: "Meta Description",
      description:
        "Summary shown in search result snippets. Keep under 160 characters for best display.",
      admin: {
        position: "sidebar",
      },
    }),
    ogImage: url({
      label: "OG Image",
      description:
        "Image URL for Open Graph social sharing previews. Recommended 1200×630px.",
      admin: {
        position: "sidebar",
      },
    }),
  },
})
