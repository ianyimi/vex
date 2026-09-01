import { date, relationship, select, text } from "@vexcms/core"

import { CONTENT_STATUS, TABLE_SLUG_USERS } from "~/db/constants"

/**
 * The access-relevant fields every editorial collection declares, verbatim.
 *
 * Spread into each collection's `fields` rather than duplicated by hand.
 *
 * Nothing in the access layer *requires* these names to match across collections — a
 * check is written per resource and takes the field name as an argument, so `authorId`
 * here and `ownerId` elsewhere would both work. They match because the collections are
 * genuinely the same editorial shape, which keeps the permission table readable.
 *
 * What each field does buy is index pushdown: `by_author` and `by_status` let an access
 * check narrow through an index instead of filtering per document.
 */
export const editorialAccessFields = {
  authorId: relationship({
    label: "Author",
    collection: {
      slug: TABLE_SLUG_USERS,
    },
    required: true,
    index: "by_author",
    description:
      "User who owns this document. Contributors are scoped to their own rows through this field.",
  }),
  status: select({
    label: "Status",
    defaultValue: [CONTENT_STATUS.draft],
    index: "by_status",
    options: [
      { label: "Draft", value: CONTENT_STATUS.draft },
      { label: "In Review", value: CONTENT_STATUS.review },
      { label: "Published", value: CONTENT_STATUS.published },
    ],
    description:
      "Editorial workflow state. Only `published` rows are readable by anonymous visitors.",
  }),
} as const

/**
 * The presentation fields every editorial collection shares.
 *
 * Kept separate from {@link editorialAccessFields} because nothing in the access
 * layer depends on these — splitting them keeps it obvious which fields you cannot
 * rename without breaking a shared rule.
 */
export const editorialContentFields = {
  title: text({
    label: "Title",
    required: true,
    description: "Display title, shown as the document heading and in the admin table.",
  }),
  slug: text({
    label: "Slug",
    required: true,
    index: "by_slug",
    description: "URL path segment. Unique per collection.",
  }),
  excerpt: text({
    label: "Excerpt",
    description: "Short summary used in listings and social previews.",
  }),
  publishedAt: date({
    label: "Published At",
    description: "When this document went live. Empty while it is still a draft.",
  }),
} as const
