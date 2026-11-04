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
    // Only `find`'s "warns once" draftStatus test reads through `by_excerpt`, so
    // the module-level warn-once memory has never seen it when that test runs.
    excerpt: v.optional(v.string()),
    // Declared because `create`/`update` now stamp it (`stampCommitTsFields`);
    // `convex-test` enforces this fixture exactly as a real deployment would.
    updatedAt: v.optional(v.commitTs()),
    featured: v.optional(v.boolean()),
    deleted: v.optional(v.boolean()), // For soft delete tests
    author: v.optional(v.array(v.id("authors"))),
    cover: v.optional(v.array(v.id("images"))), // upload field, for depth-populate tests
    parent: v.optional(v.array(v.id("posts"))), // self-ref for depth tests
    // A `select({ hasMany: false })`-shaped field: Convex always stores a
    // select as `v.array(...)` regardless of `hasMany` (`fields/select/validator.ts`),
    // so a plain `v.array(v.string())` here is schema-faithful for
    // `normalizeArrayStoredWhere`'s array-stored-field tests (`queryArgs.test.ts`,
    // `find/server.test.ts`) without needing the full literal-union validator.
    category: v.optional(v.array(v.string())),
    // Versioning columns, matching what `versionFieldsToVexSchema` emits for a
    // collection declaring `versions.drafts: true`. Optional, so every
    // pre-existing suite that inserts plain posts stays valid.
    vex_status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    vex_publishedAt: v.optional(v.number()),
    vex_activeVersion: v.optional(v.number()),
    vex_publishedId: v.optional(v.id("posts")),
  })
    .searchIndex("search_title", { searchField: "title" })
    .index("by_featured", ["featured"])
    .index("by_slug", ["slug"])
    .index("by_title", ["title"])
    .index("by_excerpt", ["excerpt"])
    .index("by_title__draftStatus", ["vex_status", "title"])
    .index("by_body", ["vex_status", "body"])
    .index("by_status", ["vex_status"])
    .index("by_published", ["vex_publishedId"])
    // Array-stored field indexes, for `normalizeArrayStoredWhere`'s
    // index-pushdown regression tests — a relationship (`author`) and a
    // select-shaped field (`category`), mirroring real `by_source`/
    // `by_status` indexes on a `select` field.
    .index("by_author", ["author"])
    .index("by_category", ["category"]),

  authors: defineTable({
    name: v.string(),
    // `slug` + `by_slug` mirror `posts` EXACTLY — same field name, same single-field
    // tuple. That is what makes the two tables a valid target for one shared access
    // rule: an index name is only shared if every resource declares it, and the field
    // tuples must match or the positional builder terminates at the shortest.
    slug: v.optional(v.string()),
    // Mirrors `posts.updatedAt` — every real `defineCollection()`-based
    // table gets this column now; declared here so a
    // populated `author` relationship target can carry a resolved
    // `commitTs` value for the ms-conversion tests in `populate.test.ts`.
    updatedAt: v.optional(v.commitTs()),
    organization: v.optional(v.array(v.id("organizations"))),
    vex_status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    vex_publishedAt: v.optional(v.number()),
    vex_activeVersion: v.optional(v.number()),
    vex_publishedId: v.optional(v.id("posts")),
  })
    .searchIndex("search_name", { searchField: "name" })
    .index("by_slug", ["slug"])
    .index("by_status", ["vex_status"])
    .index("by_published", ["vex_publishedId"]),

  organizations: defineTable({
    name: v.string(),
  }),

  // The user table `defineAccess`'s `userCollectionSlug` points at. Without it the
  // resolved user type is `unknown`, and a rule factory's `user: Record<string,
  // unknown>` parameter cannot accept `unknown` — parameter contravariance — so
  // factory-authored permissions fail to assign for a reason no real app hits.
  users: defineTable({
    name: v.string(),
    roles: v.optional(v.string()),
  }).index("by_name", ["name"]),

  vex_globals: defineTable({
    slug: v.string(),
    data: v.any(),
    vex_status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    vex_publishedAt: v.optional(v.number()),
    vex_activeVersion: v.optional(v.number()),
    vex_publishedId: v.optional(v.id("vex_globals")),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["vex_status"])
    .index("by_published", ["vex_publishedId"]),

  vex_versions: defineTable({
    collection: v.string(),
    documentId: v.string(),
    version: v.number(),
    status: v.union(v.literal("draft"), v.literal("published")),
    snapshot: v.any(),
    createdBy: v.optional(v.string()),
    parentVersion: v.optional(v.number()),
    restoredFrom: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
  }).index("by_document_version", ["collection", "documentId", "version"]),

  vex_views: defineTable({
    collection: v.string(),
    viewId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    state: v.any(),
    organizationId: v.optional(v.string()),
    createdBy: v.string(),
  })
    .index("by_collection", ["collection"])
    .index("by_collection_org", ["collection", "organizationId"])
    .index("by_view_id", ["viewId"]),

  // Media-collection fixture for upload-field depth-populate tests
  // (`find`/`search`/`get` server tests, `buildDepthPopulate`).
  images: defineTable({
    filename: v.string(),
    alt: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    size: v.optional(v.number()),
    storageId: v.optional(v.string()),
    src: v.optional(v.string()),
    deleted: v.optional(v.boolean()),
  }),
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
      users: DocumentByName<FixtureDM, "users">;
    };
    CollectionsFieldTypeMap: {
      posts: {
        text: "title" | "slug" | "body";
        relationship: "author" | "parent";
        checkbox: "featured";
      };
      authors: {
        text: "name" | "slug";
        relationship: "organization";
      };
      organizations: {
        text: "name";
      };
      users: {
        text: "name" | "roles";
      };
    };
  }
}
