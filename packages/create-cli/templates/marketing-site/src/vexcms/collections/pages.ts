import { defineCollection, richtext, text } from "@vexcms/core"

import { TABLE_SLUG_MEDIA, TABLE_SLUG_PAGES } from "~/db/constants"

export const pages = defineCollection({
  slug: TABLE_SLUG_PAGES,
  admin: {
    defaultColumns: ["title", "slug", "vex_status", "_id"],
    group: "Site Builder",
    livePreview: {
      url: (doc) => `/preview/${doc.slug ?? doc._id}`,
    },
    useAsTitle: "title",
  },
  fields: {
    title: text({
      label: "Title",
      required: true,
    }),
    slug: text({
      admin: {
        description: "URL-friendly page path",
      },
      index: "by_slug",
      label: "Slug",
      required: true,
    }),
    content: richtext({
      label: "Content",
      mediaCollection: TABLE_SLUG_MEDIA,
    }),
  },
  labels: {
    plural: "Pages",
    singular: "Page",
  },
  versions: {
    drafts: true,
  },
})
