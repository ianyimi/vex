import { BUILTIN_CONTRIBUTION_IDS, defineCollection, relationship, richtext, text } from "@vexcms/core"
import { assertUniqueAmongPublished } from "@vexcms/core/server"

import { TABLE_SLUG_ARTICLES, TABLE_SLUG_FIELDS, TABLE_SLUG_IMAGES, TABLE_SLUG_POSTS } from "~/db/constants"
import { EditorialChecklist } from "~/vexcms/components/EditorialChecklist";
import { SaveWithAnalytics } from "~/vexcms/components/SaveWithAnalytics";

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
    view: {
      searchFields: ["title", "slug"],
    },
    icon: "FilePen",
    livePreview: {
      url: (post) => {
        return `/posts/${post.slug}`;
      },
    },
    components: {
      edit: {
        beforeFields: [{ id: "editorial.checklist", component: EditorialChecklist }],
        header: {
          overrides: {
            [BUILTIN_CONTRIBUTION_IDS.edit.save]: [
              { id: "editorial.saveAnalytics", component: SaveWithAnalytics },
            ],
          },
        },
      },
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
      description: "Required — leave empty in a draft to test publish rejection.",
      searchIndex: { name: "search_posts_title", filterFields: [] },
    }),
    slug: text<typeof TABLE_SLUG_POSTS>({
      label: "Slug",
      required: true,
      index: "by_slug",
      description: "Contributors may not change this in a draft.",
      searchIndex: { name: "search_posts_slug", filterFields: [] },
      // Fix D (draft-pair pagination fix): catches the exact gap
      // "Duplicate" hit on this collection (`defaultStatus: "draft"`) — two
      // unlinked draft-only clones of the same published post silently
      // sharing its slug, with no published counterpart yet to collide
      // with under the narrower, published-only scope.
      // `assertUniqueAmongPublished` now also treats an unlinked draft-only
      // row (no `vex_publishedId`) as a real candidate.
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
    body: richtext({
      label: "Body",
      description: "Rich text — the field to edit when testing a plain draft save.",
      mediaCollectionSlug: TABLE_SLUG_IMAGES,
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
    relatedField: relationship({
      label: "Related Field Example",
      collection: {
        slug: TABLE_SLUG_FIELDS,
      },
      description:
        "Relationship into the `fields` testing-ground collection — exercises the picker's search over `contactEmail`'s custom-named search index.",
    }),
  },
});
