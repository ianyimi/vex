import { checkbox, defineCollection, select, text } from "@vexcms/core"

export const posts = defineCollection("posts", {
  admin: {
    defaultColumns: ["title", "status", "featured"],
    group: "Content",
    useAsTitle: "title",
  },
  fields: {
    slug: text({
      admin: {
        description: "URL-friendly identifier",
      },
      label: "Slug",
      required: true,
    }),
    featured: checkbox({
      defaultValue: false,
      label: "Featured",
    }),
    status: select({
      defaultValue: "draft",
      label: "Status",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
        { label: "Archived", value: "archived" },
      ],
      required: true,
    }),
    title: text({
      label: "Title",
      maxLength: 200,
      required: true,
    }),
  },
  labels: {
    plural: "Posts",
    singular: "Post",
  },
})
