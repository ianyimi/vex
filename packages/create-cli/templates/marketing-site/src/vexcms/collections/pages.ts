import { defineCollection, richtext, select, text } from "@vexcms/core"

import { TABLE_SLUG_MEDIA, TABLE_SLUG_PAGES } from "~/db/constants"

export const pages = defineCollection({
  slug: TABLE_SLUG_PAGES,
  admin: {
    group: "Site Builder",
    useAsTitle: "title",
  },
  fields: {
    slug: text({
      admin: {
        description: "URL-friendly page path",
      },
      label: "Slug",
      required: true,
    }),
    content: richtext({
      label: "Content",
      mediaCollection: TABLE_SLUG_MEDIA,
    }),
    status: select({
      defaultValue: "draft",
      label: "Status",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
      required: true,
    }),
    title: text({
      label: "Title",
      required: true,
    }),
  },
  labels: {
    plural: "Pages",
    singular: "Page",
  },
})
