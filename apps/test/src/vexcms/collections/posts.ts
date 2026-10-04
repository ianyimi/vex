import { defineCollection, relationship, text } from "@vexcms/core";

import { TABLE_SLUG_ARTICLES, TABLE_SLUG_POSTS } from "~/db/constants";

/**
 * Draft/publish test surface for the versioning-drafts spec.
 *
 * Each field covers one path through the draft workflow:
 * - `title` (required) — a draft may leave it empty (`saveDraft` is lenient);
 *   `publish` must reject naming it (strict validation, decision 4).
 * - `slug` (indexed) — the field the `contributor` role may not change in a
 *   draft (`~/auth/access.ts`), proving `saveDraft` enforces the same
 *   `changes`-based field restriction `update` does.
 * - `relatedPost` — relationship to a VERSIONED target (this collection), so
 *   `publish` rejects while it points at a draft (`assertNoDraftRelationships`)
 *   and the picker's draft visibility (Step 14) is testable.
 * - `relatedArticle` — relationship to a NON-versioned target, which must never
 *   block a publish.
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
  },
  versions: {
    drafts: true,
  },
  fields: {
    title: text({
      label: "Title",
      required: true,
      description: "Required — leave empty in a draft to test publish rejection.",
    }),
    slug: text({
      label: "Slug",
      required: true,
      index: "by_slug",
      description: "Contributors may not change this in a draft.",
    }),
    body: text({
      label: "Body",
      description: "Free text — the field to edit when testing a plain draft save.",
    }),
    relatedPost: relationship({
      label: "Related Post",
      collection: {
        slug: TABLE_SLUG_POSTS,
      },
      description: "Versioned target — publishing while this points at a draft must fail.",
    }),
    relatedArticle: relationship({
      label: "Related Article",
      collection: {
        slug: TABLE_SLUG_ARTICLES,
      },
      description: "Non-versioned target — never blocks a publish.",
    }),
  },
});
