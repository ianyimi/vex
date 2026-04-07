import { defineCollection, text } from "@vexcms/core"

import { TABLE_SLUG_POSTS } from "~/db/constants"

export const posts = defineCollection({
  slug: TABLE_SLUG_POSTS,
  labels: {
    plural: "Post",
    singular: "Posts",
  },
  fields: {
    title: text(),
  },
})
