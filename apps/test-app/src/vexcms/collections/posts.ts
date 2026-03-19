import { checkbox, defineCollection, richtext, select, text, ui } from "@vexcms/core"

import ColorCell from "~/components/admin/ColorCell"
import ColorField from "~/components/admin/ColorField"
import { TABLE_SLUG_MEDIA, TABLE_SLUG_POSTS } from "~/db/constants"

export const posts = defineCollection({
  slug: TABLE_SLUG_POSTS,
  admin: {
    defaultColumns: ["title", "status", "featured", "accentColor"],
    group: "Content",
    livePreview: {
      url: (doc) => `/posts/${doc._id}`,
    },
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
    accentColor: text({
      admin: {
        components: {
          Cell: ColorCell,
          Field: ColorField,
        },
        description: "Pick a color for the post header accent",
      },
      defaultValue: "#3b82f6",
      label: "Accent Color",
    }),
    content: richtext({
      label: "Content",
      mediaCollection: TABLE_SLUG_MEDIA,
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
