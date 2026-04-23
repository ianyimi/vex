import { checkbox, date, defineCollection, number, select, url } from "@vexcms/core"

import { TABLE_SLUG_POSTS } from "~/db/constants"

export const posts = defineCollection({
  slug: TABLE_SLUG_POSTS,
  interfaceName: "Post",
  admin: {
    useAsTitle: "title",
  },
  labels: {
    singular: "Post",
    plural: "Posts",
  },
  fields: {
    title: url({ required: true }),
    slug: url({ required: true }),
    excerpt: url(),
    link: url(),
    index: number(),
    thumbnail: url(),
    published: checkbox({
      label: "Published",
    }),
    publishedAt: date(),
    type: select({
      hasMany: true,
      label: "Type",
      optionInterfaceName: "Type",
      options: [
        {
          label: "One",
          value: "one",
        },
        {
          label: "Two",
          value: "two",
        },
        {
          label: "Three",
          value: "three",
        },
        {
          label: "Four",
          value: "four",
        },
        {
          label: "Five",
          value: "five",
        },
        {
          label: "Six",
          value: "six",
        },
      ],
    }),
  },
})
