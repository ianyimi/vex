import { defineCollection, text } from "@vexcms/core"

import { TABLE_SLUG_POSTS } from "~/db/constants"

export const posts = defineCollection({
  slug: TABLE_SLUG_POSTS,
  admin: {
    useAsTitle: "title",
  },
  labels: {
    singular: "Post",
    plural: "Posts",
  },
  fields: {
    title: text({ required: true }),
    slug: text({ required: true }),
    excerpt: text(),
  },
})
