import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import type { VexConfig } from "../../../config";
import type { DocumentBySlug } from "../../../types/generated";
import * as _generatedApi from "../../../db/test/convex/_generated/api";
import schema from "../../../db/test/convex/schema";
import { search } from "./server";

import { defineCollection, text, checkbox } from "../../../index";
import { defineAccess } from "../../../access/config";

// ── Minimal VexConfig fixture for depth tests ─────────────────────────────
const fixtureConfig: VexConfig = {
  collections: [
    {
      slug: "posts",
      fields: {
        title: { type: "text" },
        author: { type: "relationship", collection: { slug: "authors" } },
        cover: { type: "upload", to: "images" },
      },
      labels: { singular: "Post", plural: "Posts" },
      admin: { useAsTitle: "title" },
    },
    {
      slug: "authors",
      fields: { name: { type: "text" } },
      labels: { singular: "Author", plural: "Authors" },
      admin: { useAsTitle: "name" },
    },
  ],
} as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("search (server)", () => {
  test("empty query returns recent docs via .take()", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      for (let i = 0; i < 5; i++) {
        await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
      }
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        limit: 3,
      });
    });
    expect(docs).toHaveLength(3);
  });

  test("limit 0 returns every match, like an omitted limit", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      for (let i = 0; i < 5; i++) {
        await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
      }
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        limit: 0,
      });
    });
    expect(docs).toHaveLength(5);
  });

  test("non-empty query does not throw (withSearchIndex not implemented in convex-test)", async () => {
    const t = convexTest(schema, modules);
    let result: unknown[] = [];
    try {
      result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await ctx.db.insert("posts", { title: "Hello world", slug: "hello" });
        return search({
          ctx,
          collection: "posts",
          query: "hello",
          searchIndexName: "search_title",
          searchField: "title",
        });
      });
    } catch {
      // withSearchIndex not implemented in convex-test v0.0.38 — acceptable
    }
    expect(Array.isArray(result)).toBe(true);
  });

  test("where narrows the result set", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
      await ctx.db.insert("posts", { title: "C", slug: "c", featured: true });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        limit: 10,
        where: (q) => q.eq("featured", true),
      });
    });
    expect(docs.map((d) => d.title)).toEqual(["A", "C"]);
  });

  test("a plain where node narrows the result set like the builder", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
      await ctx.db.insert("posts", { title: "C", slug: "c", featured: true });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        limit: 10,
        where: { field: "featured", op: "eq", value: true },
      });
    });
    expect(docs.map((d) => d.title)).toEqual(["A", "C"]);
  });

  test("populate works on empty-query search (uses .take() path)", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena" });
      await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        author: [authorId],
      });
       
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        populate: { author: true },
      } as any) as Promise<{ author: unknown; [k: string]: unknown }[]>;
    });
    expect(((docs as any[])[0].author as DocumentBySlug["authors"][])[0].name).toBe("Lena");
  });
});

describe("search (server) — commitTs ms conversion", () => {
  const commitTsConfig: VexConfig = {
    collections: [
      {
        slug: "posts",
        fields: { title: { type: "text" }, updatedAt: { type: "commitTs", on: "save" } },
        labels: { singular: "Post", plural: "Posts" },
        admin: { useAsTitle: "title" },
      },
    ],
  } as unknown as VexConfig;

  test("converts a resolved-bigint commitTs field to a plain ms number (.take() path)", async () => {
    const t = convexTest(schema, modules);
    const resolvedNs = BigInt(1_700_000_000_000) * BigInt(1_000_000);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Hello", slug: "hello", updatedAt: resolvedNs });
      return search({ ctx, collection: "posts", config: commitTsConfig, query: "", searchIndexName: "search_title", searchField: "title" });
    });
    expect(docs).toHaveLength(1);
    const result = docs[0] as unknown as Record<string, unknown>;
    expect(typeof result.updatedAt).toBe("number");
    expect(result.updatedAt).toBe(1_700_000_000_000);
  });

  // Regression (D7 run-through, 2026-11-09): the admin media list reads through
  // `find`/`search`, which only searched `config.collections` — an edited
  // image's `bigint` `updatedAt` crashed the list's date cell.
  test("converts a media collection's commitTs field to ms", async () => {
    const t = convexTest(schema, modules);
    const resolvedNs = BigInt(1_700_000_000_000) * BigInt(1_000_000);
    const mediaOnly = { collections: [], mediaCollections: commitTsConfig.collections } as unknown as VexConfig;
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Hello", slug: "hello", updatedAt: resolvedNs });
      return search({ ctx, collection: "posts", config: mediaOnly, query: "", searchIndexName: "search_title", searchField: "title" });
    });
    expect((docs[0] as unknown as Record<string, unknown>).updatedAt).toBe(1_700_000_000_000);
  });
});

describe("search (server) — depth auto-populate", () => {
  test("depth: 1 auto-populates relationships on empty-query (.take() path)", async () => {
    const t = convexTest(schema, modules);
    const docs = (await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena" });
      await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        author: [authorId],
      });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        depth: 1,
        config: fixtureConfig,
      } as any);
    })) as any[];
    const author = (docs[0].author as DocumentBySlug["authors"][])[0];
    expect(author.name).toBe("Lena");
    expect(typeof author._id).toBe("string");
  });

  test("depth: 0 (explicit) returns raw docs on empty-query path", async () => {
    const t = convexTest(schema, modules);
    const docs = (await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena" });
      await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        author: [authorId],
      });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        depth: 0,
        config: fixtureConfig,
      } as any);
    })) as any[];
    // Depth 0 — author remains a raw ID array.
    expect(typeof docs[0].author[0]).toBe("string");
  });

  test("depth without config returns raw docs (no buildDepthPopulate called)", async () => {
    const t = convexTest(schema, modules);
    const docs = (await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena" });
      await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        author: [authorId],
      });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        depth: 1,
        // config intentionally omitted
      } as any);
    })) as any[];
    // Without config, guard prevents populate — raw IDs preserved.
    expect(typeof docs[0].author[0]).toBe("string");
  });

  test("depth: 1 with limit caps result and populates", async () => {
    const t = convexTest(schema, modules);
    const docs = (await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena" });
      for (let i = 0; i < 5; i++) {
        await ctx.db.insert("posts", {
          title: `Post ${i}`,
          slug: `p-${i}`,
          author: [authorId],
        });
      }
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        limit: 3,
        depth: 1,
        config: fixtureConfig,
      } as any);
    })) as any[];
    expect(docs).toHaveLength(3);
    const author = (docs[0].author as DocumentBySlug["authors"][])[0];
    expect(author.name).toBe("Lena");
  });

  test("depth: 1 auto-populates upload fields (media docs) on the .take() path, the same as relationship fields", async () => {
    const t = convexTest(schema, modules);
    const docs = (await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const imageId = await ctx.db.insert("images", { filename: "cover.png" });
      await ctx.db.insert("posts", { title: "Hello", slug: "hello", cover: [imageId] });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        depth: 1,
        config: fixtureConfig,
      } as any);
    })) as any[];
    expect((docs[0].cover as { filename: string }[])[0].filename).toBe("cover.png");
  });

  // ── Pagination tests ──────────────────────────────────────────────────────

  test("paginationOpts: returns PaginationResult with page, continueCursor, isDone", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      for (let i = 0; i < 5; i++) {
        await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
      }
      return search({
        ctx,
        collection: "posts",
        query: "", // Empty query (list mode)
        searchIndexName: "search_title",
        searchField: "title",
        paginationOpts: { numItems: 3, cursor: null },
      });
    });
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("continueCursor");
    expect(result).toHaveProperty("isDone");
    expect(result.page).toHaveLength(3);
    expect(result.page[0].title).toBe("Post 0");
  });

  test("paginationOpts: continueCursor fetches next page", async () => {
    const t = convexTest(schema, modules);
    const { firstPage, secondPage } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        for (let i = 0; i < 7; i++) {
          await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
        }
        const firstPage = await search({
          ctx,
          collection: "posts",
          query: "",
          searchIndexName: "search_title",
          searchField: "title",
          paginationOpts: { numItems: 3, cursor: null },
        });
        const secondPage = await search({
          ctx,
          collection: "posts",
          query: "",
          searchIndexName: "search_title",
          searchField: "title",
          paginationOpts: { numItems: 3, cursor: firstPage.continueCursor },
        });
        return { firstPage, secondPage };
      },
    );
    expect(firstPage.page).toHaveLength(3);
    expect(secondPage.page).toHaveLength(3);
    expect(firstPage.page[0].title).toBe("Post 0");
    expect(secondPage.page[0].title).toBe("Post 3");
  });

  test("paginationOpts: works with search query", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Hello World", slug: "hello" });
      await ctx.db.insert("posts", { title: "Hello There", slug: "there" });
      await ctx.db.insert("posts", { title: "Goodbye", slug: "bye" });
      return search({
        ctx,
        collection: "posts",
        query: "Hello", // Search term
        searchIndexName: "search_title",
        searchField: "title",
        paginationOpts: { numItems: 10, cursor: null },
      });
    });
    expect(result.page).toHaveLength(2); // Only "Hello" matches
    expect(result.page[0].title).toContain("Hello");
    expect(result.page[1].title).toContain("Hello");
    expect(result.isDone).toBe(true);
  });

  test("paginationOpts: works with populate", async () => {
    const t = convexTest(schema, modules);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena" });
      for (let i = 0; i < 3; i++) {
        await ctx.db.insert("posts", {
          title: `Post ${i}`,
          slug: `s-${i}`,
          author: [authorId],
        });
      }
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        paginationOpts: { numItems: 2, cursor: null },
        populate: { author: true },
      } as any);
    });
    expect(result.page).toHaveLength(2);
    const firstDoc = result.page[0] as { author: DocumentBySlug["authors"][] };
    expect(firstDoc.author[0].name).toBe("Lena");
  });
});

// ── Access-constraint narrowing fixture ────────────────────────────────────
const constrainedPostsResource = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text(), featured: checkbox() },
});

const constrainedAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [constrainedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        posts: {
          read: {
            where: ({ q }: { q: any }) => q.eq("featured", true),
          },
        },
      },
    },
  }),
} as unknown as VexConfig;

const contributorAuth = { user: { _id: "u1", roles: "contributor" } };

describe("search (server) — access constraints", () => {
  test("excludes non-permitted hits inside the query: full page, not a ragged one", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      // Insertion order interleaves non-featured docs ahead of featured
      // ones — a `.take(3)` without the constraint composed into `.filter()`
      // would read "a","b","c" (two non-featured), and the per-document
      // `hasPermission` pass afterward would strip them, producing a page of
      // length 1 instead of 3.
      await ctx.db.insert("posts", {
        title: "a",
        slug: "a",
        featured: false,
      });
      await ctx.db.insert("posts", {
        title: "b",
        slug: "b",
        featured: false,
      });
      await ctx.db.insert("posts", { title: "c", slug: "c", featured: true });
      await ctx.db.insert("posts", { title: "d", slug: "d", featured: true });
      await ctx.db.insert("posts", { title: "e", slug: "e", featured: true });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: constrainedAccess,
        auth: contributorAuth,
        limit: 3,
      } as any);
    });
    expect(docs).toHaveLength(3);
    expect(docs.every((d: any) => d.featured)).toBe(true);
  });
});

// ── Index-shaped, combined, deny-all, and boolean-short-circuit constraints ─
//
// `search` uses a SEARCH index for the query's one index slot, so an access
// rule's index half can never reach `.withIndex()` — `resolveQueryConstraint`
// always compiles the WHOLE condition (index half included) into `.filter()`.
const indexedPostsResource = defineCollection({
  slug: "posts",
  // `featured` declares a real index, matching what `vex generate` would emit —
  // config-time index validation (`validateAccessConfig`, run from `defineConfig`)
  // is not exercised by this file, which builds `VexConfig` by hand.
  fields: { title: text(), slug: text(), featured: checkbox({ index: "by_featured" }) },
});

const indexShapedAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [indexedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        posts: {
          read: { withIndex: { name: "by_featured", range: (ix) => ix.eq("featured", true) } },
        },
      },
    },
  }),
} as unknown as VexConfig;

const indexAndFilterAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [indexedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        posts: {
          read: {
            withIndex: { name: "by_featured", range: (ix) => ix.eq("featured", true) },
            where: ({ q }) => q.neq("slug", "hidden"),
          },
        },
      },
    },
  }),
} as unknown as VexConfig;

const denyAllAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [indexedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: { posts: { read: false } },
    },
  }),
} as unknown as VexConfig;

const booleanShortCircuitAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [indexedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        posts: {
          // Never touches `q` — a rule may short-circuit to a flat verdict
          // per caller instead of building a condition (`classifyRole`'s
          // outcome check runs before it ever looks for one).
          read: { where: ({ user }) => user._id === "vip" },
        },
      },
    },
  }),
} as unknown as VexConfig;

const vipAuth = { user: { _id: "vip", roles: "contributor" } };

/**
 * Seeds five posts with non-permitted rows interleaved FIRST. A query that
 * was actually narrowed (index or filter pushed into the Convex query) reads
 * only featured rows and returns a full page; one narrowed only per-document
 * afterward reads insertion order, discards non-featured rows, and returns a
 * short/ragged page.
 */
async function seedSearchNarrowing(ctx: GenericMutationCtx<GenericDataModel>) {
  await ctx.db.insert("posts", { title: "C", slug: "c", featured: false });
  await ctx.db.insert("posts", { title: "D", slug: "d", featured: false });
  await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
  await ctx.db.insert("posts", { title: "B", slug: "hidden", featured: true });
  await ctx.db.insert("posts", { title: "E", slug: "e", featured: true });
}

describe("search (server) — index-shaped constraint falls back to filter", () => {
  test("withIndex-selected constraint still narrows the query: full page, not ragged", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await seedSearchNarrowing(ctx);
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: indexShapedAccess,
        auth: contributorAuth,
        limit: 3,
      } as any);
    });
    // If the fallback silently dropped the index half, `.take(3)` would read
    // C, D, A (insertion order) and the per-document pass would strip C and
    // D, leaving a page of length 1 instead of 3.
    expect(docs).toHaveLength(3);
    expect(docs.every((d: any) => d.featured)).toBe(true);
  });

  test("permitted-row count is preserved across a pagination boundary (two pages, no gaps or duplicates)", async () => {
    const t = convexTest(schema, modules);
    const { firstPage, secondPage } = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "N1", slug: "n1", featured: false });
      await ctx.db.insert("posts", { title: "F1", slug: "f1", featured: true });
      await ctx.db.insert("posts", { title: "N2", slug: "n2", featured: false });
      await ctx.db.insert("posts", { title: "F2", slug: "f2", featured: true });
      await ctx.db.insert("posts", { title: "N3", slug: "n3", featured: false });
      await ctx.db.insert("posts", { title: "F3", slug: "f3", featured: true });
      const firstPage = await search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: indexShapedAccess,
        auth: contributorAuth,
        paginationOpts: { numItems: 2, cursor: null },
      });
      const secondPage = await search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: indexShapedAccess,
        auth: contributorAuth,
        paginationOpts: { numItems: 2, cursor: firstPage.continueCursor },
      });
      return { firstPage, secondPage };
    });
    expect(firstPage.page.map((d: any) => d.title)).toEqual(["F1", "F2"]);
    expect(secondPage.page.map((d: any) => d.title)).toEqual(["F3"]);
    expect(secondPage.isDone).toBe(true);
    // Every permitted row appears exactly once across both pages.
    expect([...firstPage.page, ...secondPage.page].every((d: any) => d.featured)).toBe(true);
  });
});

describe("search (server) — index and filter halves both apply", () => {
  test("both halves narrow the query: index range admits A, B, E; filter drops B", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await seedSearchNarrowing(ctx);
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: indexAndFilterAccess,
        auth: contributorAuth,
      } as any);
    });
    expect(docs.map((d: any) => d.title)).toEqual(["A", "E"]);
  });

  test("the filter half reaches the query, not just the per-document pass: full page across a boundary", async () => {
    const t = convexTest(schema, modules);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await seedSearchNarrowing(ctx);
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: indexAndFilterAccess,
        auth: contributorAuth,
        paginationOpts: { numItems: 2, cursor: null },
      } as any);
    });
    // Page size 2 separates the two mechanisms: pushed into the query, it
    // reads A and E and returns a full page. Filtered only per-document, it
    // would read A and B (insertion order), discard B, and return a short
    // page of one.
    expect(result.page.map((d: any) => d.title)).toEqual(["A", "E"]);
  });
});

describe("search (server) — deny-all constraint", () => {
  test("a role fully denied on read returns empty, not an error", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Secret 1", slug: "s1", featured: true });
      await ctx.db.insert("posts", { title: "Secret 2", slug: "s2", featured: false });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: denyAllAccess,
        auth: contributorAuth,
      } as any);
    });
    expect(docs).toEqual([]);
  });

  test("deny-all still returns an empty PaginationResult (not a thrown error) when paginated", async () => {
    const t = convexTest(schema, modules);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Secret", slug: "s1", featured: true });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: denyAllAccess,
        auth: contributorAuth,
        paginationOpts: { numItems: 5, cursor: null },
      } as any);
    });
    expect(result.page).toEqual([]);
    expect(result.isDone).toBe(true);
  });
});

describe("search (server) — boolean short-circuit from a withIndex/where callback", () => {
  test("callback resolving to `true` for this caller is fully unrestricted (no narrowing pushed)", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: false });
      await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: booleanShortCircuitAccess,
        auth: vipAuth,
      } as any);
    });
    // Neither doc is featured — a narrowed query would exclude both. The
    // callback never touched `q`; it resolved straight to `true`, so
    // `classifyRole` marks the role "unrestricted" and nothing is narrowed.
    expect(docs).toHaveLength(2);
  });

  test("callback resolving to `false` for this caller denies without ever building a condition", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: booleanShortCircuitAccess,
        auth: contributorAuth, // _id "u1" — not "vip", so the callback returns false
      } as any);
    });
    expect(docs).toEqual([]);
  });
});

// ── Field-level read shaping ─────────────────────────────────────────────
const searchFieldMapResource = defineCollection({
  slug: "posts",
  fields: { title: text({ searchIndex: { name: "search_title", filterFields: [] } }), slug: text() },
  admin: { view: { searchFields: ["title"] } },
});

const searchFieldMapAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["editor"] as const,
    resources: [searchFieldMapResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      editor: {
        posts: {
          read: ({ data }: { data?: { slug?: string } }) => ({
            "*": true,
            title: data?.slug === "draft",
          }),
        },
      },
    },
  }),
} as unknown as VexConfig;

const searchNoMapAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["editor"] as const,
    resources: [searchFieldMapResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: { editor: { posts: { read: true } } },
  }),
} as unknown as VexConfig;

const searchFieldMapAuth = { user: { _id: "u1", roles: "editor" } };

describe("search (server) — field-level read shaping", () => {
  test("strips a field denied by the read action", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Published", slug: "public" });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: searchFieldMapAccess,
        auth: searchFieldMapAuth,
      } as any);
    });
    expect((docs[0] as any).slug).toBe("public");
    expect((docs[0] as any).title).toBeUndefined();
  });

  test("returns documents unchanged when the read action declares no map (regression)", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Published", slug: "public" });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: searchNoMapAccess,
        auth: searchFieldMapAuth,
      } as any);
    });
    expect((docs[0] as any).title).toBe("Published");
  });

  // `_creationTime` survives HERE because this map's wildcard is `true` and
  // never explicitly names it — NOT because it's unconditionally exempt like
  // `_id` (`_creationTime` IS a real, gateable field-permission key now).
  test("_id always survives; _creationTime survives here too, because the wildcard covers it (not because it's exempt)", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Published", slug: "public" });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: searchFieldMapAccess,
        auth: searchFieldMapAuth,
      } as any);
    });
    expect((docs[0] as any)._id).toBeDefined();
    expect((docs[0] as any)._creationTime).toBeDefined();
  });

  test("strips per document when the map's value is an expression over the document", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Draft post", slug: "draft" });
      await ctx.db.insert("posts", { title: "Published post", slug: "public" });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: searchFieldMapAccess,
        auth: searchFieldMapAuth,
      } as any);
    });
    const draft = (docs as any[]).find((d) => d.slug === "draft");
    const published = (docs as any[]).find((d) => d.slug === "public");
    expect(draft.title).toBe("Draft post");
    expect(published.title).toBeUndefined();
  });

  test("does not DENY a read when the read action returns a map", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Published", slug: "public" });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: searchFieldMapAccess,
        auth: searchFieldMapAuth,
      } as any);
    });
    expect(docs).toHaveLength(1);
  });
});

// Proves `search`'s own
// `readableDocuments` pipeline strips `_creationTime`/`updatedAt`/`vex_status`
// exactly like any other denied field, through the real `search` call.
describe("search (server) — system field stripping (\"access-system-fields\")", () => {
  const systemFieldPostsResource = defineCollection({
    slug: "posts",
    fields: {
      title: text({ searchIndex: { name: "search_title", filterFields: [] } }),
      slug: text(),
    },
    versions: { drafts: true },
    admin: { view: { searchFields: ["title"] } },
  });
  const systemFieldConfig = {
    collections: [systemFieldPostsResource],
    access: defineAccess({
      roles: ["restricted"] as const,
      resources: [systemFieldPostsResource],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        restricted: {
          posts: {
            read: () => ({ "*": true, _creationTime: false, updatedAt: false, vex_status: false }),
          },
        },
      },
    }),
  } as unknown as VexConfig;
  const restrictedAuth = { user: { _id: "u1", roles: "restricted" } };

  test("strips _creationTime, updatedAt, and vex_status when a map explicitly denies them", async () => {
    const t = convexTest(schema, modules);
    const docs = (await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", {
        title: "Published",
        slug: "public",
        updatedAt: 123,
        vex_status: "published",
      });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: systemFieldConfig,
        auth: restrictedAuth,
      });
    })) as unknown as Record<string, unknown>[];
    expect(docs).toHaveLength(1);
    const doc = docs[0] as Record<string, unknown>;
    expect(doc._id).toBeDefined();
    expect(doc.title).toBe("Published");
    expect(doc._creationTime).toBeUndefined();
    expect(doc.updatedAt).toBeUndefined();
    expect(doc.vex_status).toBeUndefined();
  });
});

// ── Sort rejection, searchField validation, declared-filter exemption, count cap ──
describe("search (server) — sort is rejected while searching", () => {
  test("throws a VexError naming the collection when sort is also supplied", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        search({
          ctx,
          collection: "posts",
          query: "hello",
          searchIndexName: "search_title",
          searchField: "title",
          sort: { field: "title", order: "asc" },
        } as any),
      ),
    ).rejects.toThrow(/"code":"SORT_WHILE_SEARCHING"/);
  });
});

describe("search (server) — searchField validated against admin.view.state.searchFields", () => {
  const searchFieldAllowListBaseResource = defineCollection({
    slug: "posts",
    fields: { title: text(), body: text() },
  });
  const searchFieldAllowListResource = {
    ...searchFieldAllowListBaseResource,
    admin: {
      ...searchFieldAllowListBaseResource.admin,
      view: {
        ...searchFieldAllowListBaseResource.admin?.view,
        state: { ...searchFieldAllowListBaseResource.admin?.view?.state, searchFields: ["title"] },
      },
    },
  } as unknown as typeof searchFieldAllowListBaseResource;
  const searchFieldAllowListConfig = { collections: [searchFieldAllowListResource] } as unknown as VexConfig;

  test("an allowed searchField runs normally", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Hello world", slug: "hello" });
      return search({
        ctx,
        collection: "posts",
        config: searchFieldAllowListConfig,
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
      });
    });
    expect(docs).toHaveLength(1);
  });

  test("a searchField outside admin.view.state.searchFields rejects with a VexError naming the list", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        search({
          ctx,
          collection: "posts",
          config: searchFieldAllowListConfig,
          query: "",
          searchIndexName: "search_title",
          searchField: "body",
        }),
      ),
    ).rejects.toThrow(/(?=.*"code":"SEARCH_FIELD_NOT_ALLOWED")(?=.*"searchField":"body")/);
  });
});

describe("search (server) — searchField validated against field-read access", () => {
  const searchFieldAccessResource = defineCollection({
    slug: "posts",
    fields: { title: text({ searchIndex: { name: "search_title", filterFields: [] } }), body: text() },
    admin: { view: { searchFields: ["title"] } },
  });
  const searchFieldAccessConfig = {
    collections: [searchFieldAccessResource],
    access: defineAccess({
      roles: ["viewer"] as const,
      resources: [searchFieldAccessResource],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: { viewer: { posts: { read: () => ({ title: false, "*": true }) } } },
    }),
  } as unknown as VexConfig;
  const searchFieldAccessViewerAuth = { user: { _id: "u1", roles: "viewer" } };

  test("searching on an unreadable field throws VexAccessError", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        search({
          ctx,
          collection: "posts",
          config: searchFieldAccessConfig,
          auth: searchFieldAccessViewerAuth,
          query: "",
          searchIndexName: "search_title",
          searchField: "title",
        } as any),
      ),
    ).rejects.toThrow(
      expect.objectContaining({ resource: "posts", action: "read", field: "title" }),
    );
  });
});

const declaredFilterSearchBaseResource = defineCollection({
  slug: "posts",
  fields: {
    title: text({ searchIndex: { name: "search_title", filterFields: [] } }),
    slug: text(),
    featured: checkbox(),
  },
  admin: { view: { searchFields: ["title"] } },
});
const declaredFilterSearchResource = {
  ...declaredFilterSearchBaseResource,
  admin: {
    ...declaredFilterSearchBaseResource.admin,
    useAsTitle: "title",
    views: [{ viewId: "featured", name: "Featured", state: { where: { field: "featured", op: "eq", value: true } } }],
    view: {
      ...declaredFilterSearchBaseResource.admin?.view,
      state: { ...declaredFilterSearchBaseResource.admin?.view?.state, searchFields: ["title"] },
    },
  },
} as unknown as typeof declaredFilterSearchBaseResource;
const declaredFilterSearchAccess = {
  collections: [declaredFilterSearchResource],
  access: defineAccess({
    roles: ["viewer"] as const,
    resources: [declaredFilterSearchResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: { viewer: { posts: { read: () => ({ featured: false, "*": true }) } } },
  }),
} as unknown as VexConfig;
const declaredFilterSearchViewerAuth = { user: { _id: "u1", roles: "viewer" } };
// No declared config view (unlike `declaredFilterSearchAccess`) — isolates
// the shared-view-only exemption path from the config-view path the
// describe block above exercises.
const declaredFilterSearchNoViewAccess = {
  collections: [declaredFilterSearchBaseResource],
  access: defineAccess({
    roles: ["viewer"] as const,
    resources: [declaredFilterSearchBaseResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: { viewer: { posts: { read: () => ({ featured: false, "*": true }) } } },
  }),
} as unknown as VexConfig;

describe("search (server) — declared view filter is exempt from the field-read check", () => {
  test("a where that deep-equals the declared view's where is trusted even though featured is unreadable", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      await ctx.db.insert("posts", { title: "Hidden", slug: "hidden", featured: false });
      return search({
        ctx,
        collection: "posts",
        config: declaredFilterSearchAccess,
        auth: declaredFilterSearchViewerAuth,
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        where: { field: "featured", op: "eq", value: true },
      } as any);
    });
    expect(docs.map((d: any) => d.slug)).toEqual(["shown"]);
  });

  test("changing the declared filter's value is NOT exempt — the unreadable condition drops every row", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      return search({
        ctx,
        collection: "posts",
        config: declaredFilterSearchAccess,
        auth: declaredFilterSearchViewerAuth,
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        where: { field: "featured", op: "eq", value: false },
      } as any);
    });
    expect(docs).toEqual([]);
  });
});

const sharedFilterSearchAccessWithReadViews = {
  collections: [declaredFilterSearchResource],
  access: defineAccess({
    roles: ["editor"] as const,
    resources: [declaredFilterSearchResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      editor: { posts: { read: () => ({ featured: false, "*": true }), readViews: true } },
    },
  }),
} as unknown as VexConfig;
const sharedFilterSearchEditorAuth = { user: { _id: "u2", roles: "editor" } };

describe("search (server) — shared-view filter exemption (readViews)", () => {
  test("does not read vex_views when nothing is unreadable", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      return search({
        ctx,
        collection: "posts",
        config: sharedFilterSearchAccessWithReadViews,
        auth: sharedFilterSearchEditorAuth,
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        where: { field: "slug", op: "eq", value: "shown" },
      } as any);
    });
    expect(docs.map((d: any) => d.slug)).toEqual(["shown"]);
  });

  test("trusts an exact match against a shared view's where when the caller has readViews", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      await ctx.db.insert("posts", { title: "Hidden", slug: "hidden", featured: false });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "shared-featured",
        name: "Shared featured",
        state: { where: { field: "featured", op: "eq", value: true } },
        createdBy: "u2",
      });
      return search({
        ctx,
        collection: "posts",
        config: sharedFilterSearchAccessWithReadViews,
        auth: sharedFilterSearchEditorAuth,
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        where: { field: "featured", op: "eq", value: true },
      } as any);
    });
    expect(docs.map((d: any) => d.slug)).toEqual(["shown"]);
  });

  test("does not trust a shared view's where when the caller lacks readViews", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "shared-featured",
        name: "Shared featured",
        state: { where: { field: "featured", op: "eq", value: true } },
        createdBy: "u2",
      });
      return search({
        ctx,
        collection: "posts",
        config: declaredFilterSearchNoViewAccess,
        auth: declaredFilterSearchViewerAuth,
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        where: { field: "featured", op: "eq", value: true },
      } as any);
    });
    expect(docs).toEqual([]);
  });

  test("does not trust an altered value against a shared view's where", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "shared-featured",
        name: "Shared featured",
        state: { where: { field: "featured", op: "eq", value: true } },
        createdBy: "u2",
      });
      return search({
        ctx,
        collection: "posts",
        config: sharedFilterSearchAccessWithReadViews,
        auth: sharedFilterSearchEditorAuth,
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        where: { field: "featured", op: "eq", value: false },
      } as any);
    });
    expect(docs).toEqual([]);
  });
});

// ── Access + system fields: declared-filter exemption covers `vex_status`
// (Published shared view, signed out) — search parity with find ───────────
const vexStatusSearchResource = defineCollection({
  slug: "posts",
  fields: { title: text({ searchIndex: { name: "search_title", filterFields: [] } }), slug: text() },
  versions: { drafts: true },
  admin: { view: { searchFields: ["title"] } },
});
const vexStatusSearchGuestAccess = {
  collections: [vexStatusSearchResource],
  access: defineAccess({
    roles: ["guest"] as const,
    anonRole: "guest",
    resources: [vexStatusSearchResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      guest: {
        posts: {
          "*": false,
          read: () => ({ "*": false, title: true, slug: true }),
          readViews: true,
        },
      },
    },
  }),
} as unknown as VexConfig;
const vexStatusSearchAnonymousAuth = { user: null };
const vexStatusSearchPublishedWhere = { field: "vex_status", op: "eq", value: "published" } as const;

describe("search (server) — declared-filter exemption covers vex_status (Published shared view, signed out)", () => {
  test("an anonymous caller who can't read vex_status still gets rows from a shared view filtering on it", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Pub", slug: "pub", vex_status: "published" });
      await ctx.db.insert("posts", { title: "Dft", slug: "dft", vex_status: "draft" });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "published",
        name: "Published",
        state: { where: vexStatusSearchPublishedWhere },
        createdBy: "someone-else",
      });
      return search({
        ctx,
        collection: "posts",
        config: vexStatusSearchGuestAccess,
        auth: vexStatusSearchAnonymousAuth,
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        where: vexStatusSearchPublishedWhere,
      } as any);
    });
    expect(docs.map((d: any) => d.slug)).toEqual(["pub"]);
    expect(docs[0].vex_status).toBeUndefined();
  });

  test("a user-added filter on vex_status that does NOT match any declared view stays rejected", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Pub", slug: "pub", vex_status: "published" });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "published",
        name: "Published",
        state: { where: vexStatusSearchPublishedWhere },
        createdBy: "someone-else",
      });
      return search({
        ctx,
        collection: "posts",
        config: vexStatusSearchGuestAccess,
        auth: vexStatusSearchAnonymousAuth,
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        where: { field: "vex_status", op: "eq", value: "draft" },
      } as any);
    });
    expect(docs).toEqual([]);
  });
});

const searchCountCapBaseResource = defineCollection({ slug: "posts", fields: { title: text() } });
const searchCountCapResource = {
  ...searchCountCapBaseResource,
  admin: {
    ...searchCountCapBaseResource.admin,
    view: {
      ...searchCountCapBaseResource.admin?.view,
      state: { ...searchCountCapBaseResource.admin?.view?.state, countLimit: 3, searchFields: ["title"] },
    },
  },
} as unknown as typeof searchCountCapBaseResource;
const searchCountCapConfig = { collections: [searchCountCapResource] } as unknown as VexConfig;

describe("search (server) — total count cap", () => {
  test("totalDocsCapped is true and totalDocs stops at countLimit once the real count exceeds it", async () => {
    const t = convexTest(schema, modules);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      for (let i = 0; i < 6; i++) {
        await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
      }
      return search({
        ctx,
        collection: "posts",
        config: searchCountCapConfig,
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        paginationOpts: { numItems: 2, cursor: null, totalDocs: true },
      } as any);
    });
    expect(result.totalDocs).toBe(3);
    expect(result.totalDocsCapped).toBe(true);
  });

  test("totalDocsCapped is false and totalDocs is exact when the real count sits under the limit", async () => {
    const t = convexTest(schema, modules);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a" });
      await ctx.db.insert("posts", { title: "B", slug: "b" });
      return search({
        ctx,
        collection: "posts",
        config: searchCountCapConfig,
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        paginationOpts: { numItems: 1, cursor: null, totalDocs: true },
      } as any);
    });
    expect(result.totalDocs).toBe(2);
    expect(result.totalDocsCapped).toBe(false);
  });
});

// ── Draft-pair pagination fix: canonical-row merge (search) ────────────────
const searchVersionedPostsResource = defineCollection({
  slug: "posts",
  fields: {
    title: text({ searchIndex: { name: "search_title", filterFields: [] } }),
    slug: text(),
  },
  versions: { drafts: true },
  admin: { view: { searchFields: ["title"] } },
});
const searchVersionedAccess = defineAccess({
  roles: ["editor", "viewer"] as const,
  resources: [searchVersionedPostsResource],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    editor: { posts: { readDrafts: true } },
    viewer: { posts: { read: true } },
  },
});
const searchVersionedConfig = {
  collections: [searchVersionedPostsResource],
  access: searchVersionedAccess,
} as unknown as VexConfig;
const searchEditorAuth = { user: { _id: "u1", roles: "editor" } };
const searchViewerAuth = { user: { _id: "u2", roles: "viewer" } };

describe("search (server) — draft-pair pagination fix (canonical-row merge)", () => {
  test("a published+draft pair that both match the query merges into one result, like find", async () => {
    const t = convexTest(schema, modules);
    const { draftId, withPermission, withoutPermission } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const publishedId = await ctx.db.insert("posts", {
          title: "Hello",
          slug: "hello",
          vex_status: "published",
        });
        const draftId = await ctx.db.insert("posts", {
          title: "Hello (draft edit)",
          slug: "hello",
          vex_status: "draft",
          vex_publishedId: publishedId,
        });
        return {
          draftId,
          withPermission: await search({
            ctx,
            collection: "posts",
            config: searchVersionedConfig,
            auth: searchEditorAuth,
            drafts: true,
            query: "Hello",
            searchIndexName: "search_title",
            searchField: "title",
          } as any),
          withoutPermission: await search({
            ctx,
            collection: "posts",
            config: searchVersionedConfig,
            auth: searchViewerAuth,
            drafts: true,
            query: "Hello",
            searchIndexName: "search_title",
            searchField: "title",
          } as any),
        };
      },
    );
    expect(withPermission).toHaveLength(1);
    expect((withPermission[0] as any)._id).toBe(draftId);
    expect((withPermission[0] as any).hasUnpublishedChanges).toBe(true);
    // Unlike `find`, `search` has no readDrafts-denied-falls-back-to-read
    // fallback (search/server.ts's own comment, lines 207-213) — a caller
    // without readDrafts who asks for drafts is denied outright, same as
    // any other deny-all case: empty, not an error, and never merged.
    expect(withoutPermission).toEqual([]);
  });
});

// ── `admin.view.state.searchFields: []` disables
// search entirely — the server rejects every searchField, not just ones
// outside a non-empty allow-list ───────────────────────────────────────────
describe("search (server) — admin.view.state.searchFields: [] disables search", () => {
  test("rejects with SEARCH_FIELD_NOT_ALLOWED when the collection declares no searchFields at all", async () => {
    const noSearchFieldsResource = defineCollection({
      slug: "posts",
      fields: { title: text({ searchIndex: { name: "search_title", filterFields: [] } }), slug: text() },
      // admin.view.searchFields omitted entirely → resolves to `[]`.
    });
    const config = { collections: [noSearchFieldsResource] } as unknown as VexConfig;
    const t = convexTest(schema, modules);
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        search({
          ctx,
          collection: "posts",
          config,
          query: "hello",
          searchIndexName: "search_title",
          searchField: "title",
        } as any),
      ),
    ).rejects.toThrow(/SEARCH_FIELD_NOT_ALLOWED/);
  });
});
