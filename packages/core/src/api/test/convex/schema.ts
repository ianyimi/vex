import {
  defineSchema,
  defineTable,
  type DataModelFromSchemaDefinition,
  type DocumentByName,
} from "convex/server";
import { v } from "convex/values";

/**
 * Fixture schema for `@vexcms/core` API tests. Mirrors the relationship shapes
 * a real VexCMS user would define (Id arrays for `hasMany` per spec 22 D2).
 * Includes search indexes so `vex.search` tests can exercise `withSearchIndex`.
 */
const schema = defineSchema({
  posts: defineTable({
    title: v.string(),
    slug: v.string(),
    body: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    deleted: v.optional(v.boolean()), // For soft delete tests
    author: v.optional(v.array(v.id("authors"))),
    parent: v.optional(v.array(v.id("posts"))), // self-ref for depth tests
  })
    .searchIndex("search_title", { searchField: "title" })
    .index("by_featured", ["featured"]),

  authors: defineTable({
    name: v.string(),
    organization: v.optional(v.array(v.id("organizations"))),
  }).searchIndex("search_name", { searchField: "name" }),

  organizations: defineTable({
    name: v.string(),
  }),

  vex_globals: defineTable({
    slug: v.string(),
    data: v.any(),
  }).index("by_slug", ["slug"]),
});

export default schema;

/**
 * Augment `GeneratedVexTypes` with fixture-specific document shapes and
 * field-type maps so that `Populated<TCollectionSlug, TPopulate>` resolves to real
 * doc types in tests, and `RelationshipKeysOf<TCollectionSlug>` narrows correctly.
 *
 * In a real user project, `vex generate` writes an equivalent block in the
 * user's `vex.types.ts`. This file mimics that for the test fixture.
 *
 * **Important:** the augmentation deliberately OMITS `CollectionSlug`. That
 * property would narrow the global slug union to just the fixture's three
 * tables — breaking every other test in `@vexcms/core` that uses
 * `defineCollection({ slug: "nodes" })`, `"categories"`, etc. By leaving
 * `CollectionSlug` un-augmented it falls back to `string` (the default
 * fallback in `types/generated.ts`), so arbitrary string slugs still type-
 * check, while `DocumentBySlug["posts"]` resolves to the fixture doc shape
 * for the API tests that DO use the fixture.
 *
 * Production bundles exclude `src/api/test/**` via `tsconfig.build.json`,
 * so downstream consumers' own `vex generate` augmentations are not affected.
 */
type FixtureDM = DataModelFromSchemaDefinition<typeof schema>;

declare module "@vexcms/core" {
  interface GeneratedVexTypes {
    // CollectionSlug intentionally omitted — see file-level JSDoc.
    DocumentBySlug: {
      posts: DocumentByName<FixtureDM, "posts">;
      authors: DocumentByName<FixtureDM, "authors">;
      organizations: DocumentByName<FixtureDM, "organizations">;
    };
    CollectionsFieldTypeMap: {
      posts: {
        text: "title" | "slug" | "body";
        relationship: "author" | "parent";
        checkbox: "featured";
      };
      authors: {
        text: "name";
        relationship: "organization";
      };
      organizations: {
        text: "name";
      };
    };
  }
}
