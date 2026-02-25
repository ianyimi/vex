import { defineCollection, number, text } from "@vexcms/core"

export const categories = defineCollection("categories", {
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
