import { defineCollection, text, upload, number } from "@vexcms/core"

import { TABLE_SLUG_ARTICLES, TABLE_SLUG_MEDIA } from "~/db/constants"

export const articles = defineCollection({
  slug: TABLE_SLUG_ARTICLES,
  admin: {
    defaultColumns: ["name", "index", "slug", "banner"],
    group: "Content",
    useAsTitle: "name",
  },
  fields: {
    name: text({
      label: "Name",
      required: true,
    }),
    slug: text({
      label: "Slug",
      required: true,
    }),
    banner: upload({
      to: TABLE_SLUG_MEDIA,
    }),
    index: number({
      admin: {
        cellAlignment: "center",
      },
      defaultValue: 0,
      label: "Index",
    }),
  },
  labels: {
    plural: "Articles",
    singular: "Article",
  },
})
