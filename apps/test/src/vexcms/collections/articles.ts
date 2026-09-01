import { checkbox, defineCollection, number, relationship, text } from "@vexcms/core"

import { TABLE_SLUG_ARTICLES, TABLE_SLUG_IMAGES } from "~/db/constants"

import { editorialAccessFields, editorialContentFields } from "./editorialFields"

/**
 * Blog articles.
 *
 * One of three collections sharing {@link editorialAccessFields}, so the same access
 * checks in `~/auth/permissions.ts` apply to it — each call naming this collection and
 * its owner/status field.
 */
export const articles = defineCollection({
  slug: TABLE_SLUG_ARTICLES,
  interfaceName: "Article",
  labels: {
    singular: "Article",
    plural: "Articles",
  },
  admin: {
    useAsTitle: "title",
    icon: "Newspaper",
  },
  fields: {
    ...editorialContentFields,
    ...editorialAccessFields,

    // ── Article-specific ───────────────────────────────────────────────────
    body: text({
      label: "Body",
      description: "Article body copy. Markdown until rich text lands on this collection.",
    }),
    readingMinutes: number({
      label: "Reading Time (minutes)",
      defaultValue: 5,
      description: "Estimated reading time shown under the article heading.",
    }),
    featured: checkbox({
      label: "Featured",
      description: "Pins this article to the top of the blog index.",
    }),
    coverImage: relationship({
      label: "Cover Image",
      collection: {
        slug: TABLE_SLUG_IMAGES,
      },
      description: "Hero image displayed above the article body.",
    }),
  },
})
