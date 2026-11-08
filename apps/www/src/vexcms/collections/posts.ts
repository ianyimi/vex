import { defineCollection, richtext, text, textarea, upload } from "@vexcms/core"
import { assertUniqueAmongPublished } from "@vexcms/core/server"

import { TABLE_SLUG_IMAGES, TABLE_SLUG_POSTS } from "~/db/constants"

/**
 * The blog/announcement collection. Dogfoods the `richtext` field on www for
 * the first time — U's launch kit and feature series all point at posts
 * created here.
 */
export const posts = defineCollection({
  slug: TABLE_SLUG_POSTS,
  interfaceName: "Post",
  labels: {
    singular: "Post",
    plural: "Posts",
  },
  admin: {
    useAsTitle: "title",
    icon: "FilePen",
    view: {
      searchFields: ["title", "slug"],
    },
    livePreview: {
      url: (post) => `/posts/${post.slug}`,
    },
  },
  versions: {
    drafts: true,
    autosave: {
      enabled: true,
    },
  },
  fields: {
    title: text({
      label: "Title",
      required: true,
      searchIndex: { name: "search_posts_title", filterFields: [] },
    }),
    slug: text<typeof TABLE_SLUG_POSTS>({
      label: "Slug",
      required: true,
      index: "by_slug",
      searchIndex: { name: "search_posts_slug", filterFields: [] },
      description: "URL-friendly post path, e.g. vexcms-0-1-0.",
      validate: async ({ value, doc, ctx }) => {
        await assertUniqueAmongPublished({
          ctx,
          collection: TABLE_SLUG_POSTS,
          indexName: "by_slug",
          field: "slug",
          value,
          excludeId: doc._id,
        })
      },
    }),
    excerpt: textarea({
      label: "Excerpt",
      description: "Short summary shown on a future posts index and used as the meta description.",
    }),
    body: richtext({
      label: "Body",
      mediaCollectionSlug: TABLE_SLUG_IMAGES,
    }),
    ogImage: upload({
      to: TABLE_SLUG_IMAGES,
      label: "OG Image",
      admin: { position: "sidebar" },
    }),
  },
})
