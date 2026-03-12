import { defineCollection, text, number } from "@vexcms/core"

import { TABLE_SLUG_CATEGORIES } from "~/db/constants"

export const categories = defineCollection({
  slug: TABLE_SLUG_CATEGORIES,
  admin: {
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
    sortOrder: number({
      defaultValue: 0,
      label: "Sort Order",
    }),
  },
  labels: {
    plural: "Categories",
    singular: "Category",
  },
})
