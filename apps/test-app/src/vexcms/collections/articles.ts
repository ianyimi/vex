import { defineCollection, number, text } from "@vexcms/core"

export const articles = defineCollection("articles", {
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
    index: number({
      defaultValue: 0,
      label: "Index",
    }),
  },
  labels: {
    plural: "Articles",
    singular: "Article",
  },
})
