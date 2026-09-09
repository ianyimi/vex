import {
  defineCollection,
  relationship,
  text,
  type CollectionFieldMeta,
  type RelationshipField,
} from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";
import { testCollection } from "../../../testing/harness/accessFixtures";

/**
 * Target collection for the relationship picker under test. Its slug
 * ("documents") and `admin.useAsTitle: "title"` match the `documents` table
 * and `search_title` index seeded by the Step 10 convex-test bridge
 * (`testing/convex/schema.ts`). Labels are set explicitly rather than
 * relying on `defineCollection`'s auto-pluralization of an already-plural
 * slug.
 */
export const relationshipTargetCollection = defineCollection({
  slug: "documents",
  labels: { singular: "Document", plural: "Documents" },
  fields: { title: text({ required: true }) },
  admin: { useAsTitle: "title" },
});

/**
 * Second target collection, same underlying `documents` table, but with
 * `admin.useAsTitle: "_creationTime"` — a system field. Exercises
 * `useRelationshipPickerOptions`'s OTHER branch: `isSearchable` becomes
 * `false` (its check is `useAsTitle !== "_id" && useAsTitle !== "_creationTime"`),
 * so the picker calls `vexConvexApi.find` — which ignores the search text
 * entirely — instead of `vexConvexApi.search`. Used only by the
 * non-searchable-branch test in `Input.test.tsx`'s `extra`; the default
 * `relationshipFieldFixture`/`relationshipTargetCollection` above stay wired
 * to the searchable path.
 */
export const relationshipTargetCollectionByCreationTime = defineCollection({
  slug: "documents",
  labels: { singular: "Document", plural: "Documents" },
  fields: { title: text({ required: true }) },
  admin: { useAsTitle: "_creationTime" },
});

/**
 * `meta.collectionSlug` mirrors what `defineCollection` stamps onto every
 * field it owns (`populateCollectionFieldMeta` in `collections/config.ts`) —
 * here, the shared harness's `testCollection` ("posts"), standing in for
 * the collection this relationship field is rendered as part of.
 */
const fieldDef = relationship<CollectionFieldMeta>({
  collection: { slug: "documents" },
  hasMany: true,
  required: true,
  meta: { collectionSlug: testCollection.slug },
});

/**
 * `valid`/`invalid`/`empty` only exercise the shared contract's generic
 * assertions — `runFieldInputContractSuite`'s bare `<AppForm>` harness
 * doesn't wire `VexConfigContext`, so those generic states render
 * `RelationshipFieldInput`'s "Unknown collection" guard regardless of the
 * value. The real picker (debounced search, select/remove, single vs
 * `hasMany`) is covered by this field's `extra` in `Input.test.tsx`,
 * rendered with `VexConfigContext` and the Step 10 convex-test bridge wired
 * in against real seeded documents.
 */
export const relationshipFieldFixture: FieldFixture<RelationshipField<CollectionFieldMeta>, string[]> = {
  fieldType: "relationship",
  fieldDef,
  valid: ["kg2fake00000000000000001;documents"],
  invalid: undefined,
  empty: [],
};
