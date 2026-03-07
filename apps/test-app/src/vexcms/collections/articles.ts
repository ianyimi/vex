import { defineCollection, number, text } from "@vexcms/core"

import { TABLE_SLUG_ARTICLES } from "~/db/constants"

export const articles = defineCollection(TABLE_SLUG_ARTICLES, {
  admin: {
    defaultColumns: ["name", "index", "slug"],
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
