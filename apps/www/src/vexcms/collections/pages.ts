import { defineCollection, relationship, text } from "@vexcms/core"

import { TABLE_SLUG_PAGES, TABLE_SLUG_POSTS } from "~/db/constants"

export const pages = defineCollection({
  slug: TABLE_SLUG_PAGES,
  interfaceName: "Page",
  labels: {
    singular: "Page",
    plural: "Pages",
  },
  admin: {
    useAsTitle: "title",
  },
  fields: {
    title: text({ required: true }),
    slug: text({ required: true }),
    posts: relationship({
      collection: {
        slug: TABLE_SLUG_POSTS,
      },
      hasMany: true,
      label: "Posts",
    }),
  },
})
