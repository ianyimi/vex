import { describe, expect, it } from "vitest";

import type { VexConfig } from "../../config";
import { defineCollection } from "../config";
import { text } from "../../fields";
import { defineAccess } from "../../access/config";
import { resolveQueryIndex } from "./resolveQueryIndex";

function configOf(collection: ReturnType<typeof defineCollection>): VexConfig {
  return { collections: [collection] } as unknown as VexConfig;
}

const plainSortPosts = defineCollection({
  slug: "posts",
  fields: {
    title: text(),
    status: text({ index: "by_status" }),
  },
});

describe("resolveQueryIndex — no sort", () => {
  it("defaults to ascending insertion order with no indexName, and passes where through unpushed", () => {
    expect(resolveQueryIndex({ config: configOf(plainSortPosts), collection: "posts" })).toEqual({
      order: "asc",
      remainder: undefined,
    });
    const where = { field: "status", op: "eq", value: "x" } as const;
    expect(resolveQueryIndex({ config: configOf(plainSortPosts), collection: "posts", where })).toEqual({
      order: "asc",
      remainder: where,
    });
  });
});

describe("resolveQueryIndex — indexed field, no where", () => {
  it("resolves a field leading exactly one index", () => {
    expect(
      resolveQueryIndex({
        config: configOf(plainSortPosts),
        collection: "posts",
        sort: { field: "status", order: "asc" },
      }),
    ).toEqual({ indexName: "by_status", range: undefined, order: "asc", remainder: undefined });
  });

  it("is permissive with no config — order passes through, no indexName", () => {
    expect(resolveQueryIndex({ collection: "posts", sort: { field: "status", order: "desc" } })).toEqual({
      order: "desc",
      remainder: undefined,
    });
  });

  it('resolves "_creationTime" to no indexName with no where to push', () => {
    expect(
      resolveQueryIndex({
        config: configOf(plainSortPosts),
        collection: "posts",
        sort: { field: "_creationTime", order: "desc" },
      }),
    ).toEqual({ order: "desc", remainder: undefined });
  });
});

describe("resolveQueryIndex — unindexed field", () => {
  it('throws VexError({ code: "UNINDEXED_SORT" }) naming the field and the index to declare', () => {
    expect(() =>
      resolveQueryIndex({
        config: configOf(plainSortPosts),
        collection: "posts",
        sort: { field: "title", order: "asc" },
      }),
    ).toThrow(
      expect.objectContaining({
        data: expect.objectContaining({
          code: "UNINDEXED_SORT",
          collection: "posts",
          field: "title",
          message:
            'sort.field "title" leads no index on collection "posts" — declare index: "by_title" on the field (or a collection-level indexes entry starting with it) to make it sortable.',
        }),
      }),
    );
  });
});

describe("resolveQueryIndex — equality prefix", () => {
  it("pushes a single eq into a fully-consumed index under a _creationTime sort", () => {
    const where = { field: "status", op: "eq", value: "published" } as const;
    const result = resolveQueryIndex({
      config: configOf(plainSortPosts),
      collection: "posts",
      where,
      sort: { field: "_creationTime", order: "desc" },
    });
    expect(result.indexName).toBe("by_status");
    expect(result.range).toBeInstanceOf(Function);
    expect(result.order).toBe("desc");
    expect(result.remainder).toBeUndefined();
  });

  it("leaves a non-pushed AND sibling in remainder", () => {
    const result = resolveQueryIndex({
      config: configOf(plainSortPosts),
      collection: "posts",
      where: {
        and: [
          { field: "status", op: "eq", value: "published" },
          { field: "title", op: "eq", value: "Hello" },
        ],
      },
      sort: { field: "_creationTime", order: "asc" },
    });
    expect(result.indexName).toBe("by_status");
    expect(result.remainder).toEqual({ field: "title", op: "eq", value: "Hello" });
  });

  it("degenerate case: a plain field sort with no where still resolves (zero-equality prefix)", () => {
    expect(
      resolveQueryIndex({
        config: configOf(plainSortPosts),
        collection: "posts",
        sort: { field: "status", order: "asc" },
      }),
    ).toEqual({ indexName: "by_status", range: undefined, order: "asc", remainder: undefined });
  });
});

const compoundPosts = defineCollection({
  slug: "posts",
  fields: { category: text(), views: text(), title: text(), featured: text() },
  indexes: [{ name: "by_category_views", fields: ["category", "views"] }],
});

describe("resolveQueryIndex — compound index: equality prefix then sort", () => {
  it("pushes the leading equality and orders by the field right after it", () => {
    const result = resolveQueryIndex({
      config: configOf(compoundPosts),
      collection: "posts",
      where: { field: "category", op: "eq", value: "tech" },
      sort: { field: "views", order: "asc" },
    });
    expect(result).toEqual({
      indexName: "by_category_views",
      range: expect.any(Function),
      order: "asc",
      remainder: undefined,
    });
  });

  it("prefers the longer equality prefix over a plain single-field index serving the same sort", () => {
    const withPlainIndex = defineCollection({
      slug: "posts",
      fields: { category: text(), views: text({ index: "by_views" }), title: text() },
      indexes: [{ name: "by_category_views", fields: ["category", "views"] }],
    });
    const result = resolveQueryIndex({
      config: configOf(withPlainIndex),
      collection: "posts",
      where: { field: "category", op: "eq", value: "tech" },
      sort: { field: "views", order: "asc" },
    });
    expect(result.indexName).toBe("by_category_views");
  });

  it("wraps 2+ leftover AND parts back into an `and` node", () => {
    const result = resolveQueryIndex({
      config: configOf(compoundPosts),
      collection: "posts",
      where: {
        and: [
          { field: "category", op: "eq", value: "tech" },
          { field: "title", op: "eq", value: "Hello" },
          { field: "featured", op: "eq", value: "yes" },
        ],
      },
      sort: { field: "views", order: "asc" },
    });
    expect(result.indexName).toBe("by_category_views");
    expect(result.remainder).toEqual({
      and: [
        { field: "title", op: "eq", value: "Hello" },
        { field: "featured", op: "eq", value: "yes" },
      ],
    });
  });
});

describe("resolveQueryIndex — OR fallback", () => {
  it("a top-level OR contributes no equalities — falls back to no index, remainder unchanged", () => {
    const where = {
      or: [
        { field: "status", op: "eq", value: "a" },
        { field: "status", op: "eq", value: "b" },
      ],
    } as const;
    expect(
      resolveQueryIndex({
        config: configOf(plainSortPosts),
        collection: "posts",
        where,
        sort: { field: "_creationTime", order: "desc" },
      }),
    ).toEqual({ order: "desc", remainder: where });
  });
});

const rangePosts = defineCollection({
  slug: "posts",
  fields: { score: text({ index: "by_score" }), title: text() },
});

describe("resolveQueryIndex — range fallback", () => {
  it("a gt condition cannot be pushed — falls back to no index under a _creationTime sort", () => {
    const where = { field: "score", op: "gt", value: 50 } as const;
    expect(
      resolveQueryIndex({
        config: configOf(rangePosts),
        collection: "posts",
        where,
        sort: { field: "_creationTime", order: "asc" },
      }),
    ).toEqual({ order: "asc", remainder: where });
  });

  it("still resolves the sort-only index when the range sits on the sorted field itself", () => {
    const where = { field: "score", op: "gt", value: 50 } as const;
    expect(
      resolveQueryIndex({
        config: configOf(rangePosts),
        collection: "posts",
        where,
        sort: { field: "score", order: "desc" },
      }),
    ).toEqual({ indexName: "by_score", range: undefined, order: "desc", remainder: where });
  });
});

const draftAwareCompoundPosts = defineCollection({
  slug: "posts",
  fields: { category: text(), views: text() },
  versions: { drafts: true },
  indexes: [
    { name: "by_category_views", fields: ["category", "views"] },
    { name: "by_category_views_full", fields: ["category", "views"], draftStatus: "both" },
  ],
});

describe("resolveQueryIndex — draftStatus-aware tie-break among equal-prefix candidates", () => {
  it('prefers the draftStatus: "both" index when drafts: true', () => {
    const result = resolveQueryIndex({
      config: configOf(draftAwareCompoundPosts),
      collection: "posts",
      where: { field: "category", op: "eq", value: "tech" },
      sort: { field: "views", order: "asc" },
      drafts: true,
    });
    expect(result.indexName).toBe("by_category_views_full");
  });

  it("prefers a draftStatus-declaring index over a plain one for a published-only read", () => {
    const result = resolveQueryIndex({
      config: configOf(draftAwareCompoundPosts),
      collection: "posts",
      where: { field: "category", op: "eq", value: "tech" },
      sort: { field: "views", order: "asc" },
      drafts: false,
    });
    expect(result.indexName).toBe("by_category_views_full");
  });

  it("falls back to schema order when neither matching candidate declares a draftStatus", () => {
    const ambiguousPosts = defineCollection({
      slug: "posts",
      fields: { category: text(), views: text() },
      indexes: [
        { name: "by_category_views", fields: ["category", "views"] },
        { name: "by_category_views_alt", fields: ["category", "views"] },
      ],
    });
    const result = resolveQueryIndex({
      config: configOf(ambiguousPosts),
      collection: "posts",
      where: { field: "category", op: "eq", value: "tech" },
      sort: { field: "views", order: "asc" },
    });
    expect(result.indexName).toBe("by_category_views");
  });
});

describe("resolveQueryIndex — sort field read access", () => {
  const fieldAccessResource = defineCollection({
    slug: "posts",
    fields: { title: text({ index: "by_title" }), slug: text({ index: "by_slug" }) },
  });
  const fieldAccessConfig = {
    collections: [fieldAccessResource],
    access: defineAccess({
      roles: ["viewer"] as const,
      resources: [fieldAccessResource],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        viewer: {
          posts: { read: () => ({ title: false, "*": true }) },
        },
      },
    }),
  } as unknown as VexConfig;
  const viewerAuth = { user: { _id: "u1", roles: "viewer" } };

  it("throws VexAccessError when the caller cannot read sort.field", () => {
    expect(() =>
      resolveQueryIndex({
        config: fieldAccessConfig,
        collection: "posts",
        sort: { field: "title", order: "asc" },
        access: fieldAccessConfig.access,
        auth: viewerAuth,
        action: "read",
      }),
    ).toThrow(
      expect.objectContaining({
        data: expect.objectContaining({ code: "ACCESS_DENIED", resource: "posts", action: "read", field: "title" }),
      }),
    );
  });

  it("resolves normally when the field is readable", () => {
    expect(
      resolveQueryIndex({
        config: fieldAccessConfig,
        collection: "posts",
        sort: { field: "slug", order: "asc" },
        access: fieldAccessConfig.access,
        auth: viewerAuth,
        action: "read",
      }),
    ).toEqual({ indexName: "by_slug", range: undefined, order: "asc", remainder: undefined });
  });

  it('never checks "_creationTime" — it is always readable', () => {
    expect(
      resolveQueryIndex({
        config: fieldAccessConfig,
        collection: "posts",
        sort: { field: "_creationTime", order: "desc" },
        access: fieldAccessConfig.access,
        auth: viewerAuth,
        action: "read",
      }),
    ).toEqual({ order: "desc", remainder: undefined });
  });

  // Strengthens the test above, which happens to pass even WITHOUT the carve-out
  // (that role's wildcard is `true`) — this role EXPLICITLY DENIES `_creationTime`
  // for READ (developer decision, binding, "access-system-fields": `_creationTime`
  // is now a real, gateable field-permission key), so sorting by it would throw
  // `VexAccessError` here if the carve-out weren't genuinely skipping the check.
  it("sorting by _creationTime still succeeds even when a field map EXPLICITLY denies reading it — the carve-out is real, not coincidental", () => {
    const denyCreationTimeConfig = {
      collections: [fieldAccessResource],
      access: defineAccess({
        roles: ["viewer"] as const,
        resources: [fieldAccessResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          viewer: {
            posts: { read: () => ({ "*": true, _creationTime: false }) },
          },
        },
      }),
    } as unknown as VexConfig;
    expect(
      resolveQueryIndex({
        config: denyCreationTimeConfig,
        collection: "posts",
        sort: { field: "_creationTime", order: "asc" },
        access: denyCreationTimeConfig.access,
        auth: viewerAuth,
        action: "read",
      }),
    ).toEqual({ order: "asc", remainder: undefined });
  });


  it("skips the check entirely when access is undefined (bypassed/unconfigured)", () => {
    expect(
      resolveQueryIndex({ config: fieldAccessConfig, collection: "posts", sort: { field: "title", order: "asc" } }),
    ).toEqual({ indexName: "by_title", range: undefined, order: "asc", remainder: undefined });
  });
});
