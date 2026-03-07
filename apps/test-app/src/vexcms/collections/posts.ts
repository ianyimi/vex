import { checkbox, defineCollection, select, text } from "@vexcms/core"

import { TABLE_SLUG_POSTS } from "~/db/constants"

export const posts = defineCollection(TABLE_SLUG_POSTS, {
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
    subtitle: text({
      label: "Subtitle",
      maxLength: 200,
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
