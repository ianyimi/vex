import {
  checkbox,
  date,
  defineCollection,
  number,
  relationship,
  select,
  text,
  url,
} from "@vexcms/core"

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
    title: text({ required: true }),
    slug: text({ required: true }),
    excerpt: text(),
    link: url(),
    index: number(),
    thumbnail: url(),
    parent: relationship({
      collection: {
        slug: TABLE_SLUG_POSTS,
      },
      label: "Parent Post",
    }),
    children: relationship({
      collection: {
        slug: TABLE_SLUG_POSTS,
      },
      hasMany: true,
      label: "Parent Post",
    }),
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
