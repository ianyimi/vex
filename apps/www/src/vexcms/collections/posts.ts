import { defineCollection, text } from "@vexcms/core"

import { TABLE_SLUG_POSTS } from "~/db/constants"

export const posts = defineCollection({
  slug: TABLE_SLUG_POSTS,
  labels: {
    plural: "Posts",
    singular: "Post",
  },
  fields: {
    title: text({ label: "Title", required: true }),
    slug: text({ label: "Slug", required: true }),
    excerpt: text({ label: "Excerpt" }),
  },
})
