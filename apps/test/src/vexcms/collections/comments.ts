import { checkbox, defineCollection, relationship, text } from "@vexcms/core"

import { TABLE_SLUG_ARTICLES, TABLE_SLUG_COMMENTS } from "~/db/constants"

import { editorialAccessFields } from "./editorialFields"

/**
 * Reader comments on articles.
 *
 * Deliberately shares only PART of the editorial shape: it declares `authorId`
 * (`by_author`) but no `status`. That asymmetry is exercised in `~/auth/access.ts` —
 *
 * - `readOwn(comments, "authorId")` works, same as the other three;
 * - `readPublished(comments, ...)` does not compile, because `StatusField<"comments">`
 *   resolves to `never`. The public read falls back to a plain `approved` callback,
 *   which is the honest shape: `approved` leads no index, so nothing can be pushed
 *   down and a per-document check is what it is.
 */
export const comments = defineCollection({
  slug: TABLE_SLUG_COMMENTS,
  interfaceName: "Comment",
  labels: {
    singular: "Comment",
    plural: "Comments",
  },
  admin: {
    useAsTitle: "body",
    icon: "MessageSquare",
  },
  fields: {
    // Referenced, not restated — keeps `by_author`'s tuple identical to the other
    // three, which is what a shared ownership rule relies on.
    authorId: editorialAccessFields.authorId,

    body: text({
      label: "Body",
      required: true,
      description: "Comment text as submitted.",
    }),
    article: relationship({
      label: "Article",
      collection: {
        slug: TABLE_SLUG_ARTICLES,
      },
      required: true,
      index: "by_article",
      description: "Article this comment belongs to.",
    }),
    approved: checkbox({
      label: "Approved",
      description: "Unapproved comments are hidden from the public site.",
    }),
  },
})
