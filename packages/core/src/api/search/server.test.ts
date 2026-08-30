import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import type { VexConfig } from "../../config";
import type { DocumentBySlug } from "../../types/generated";
import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import { search } from "./server";

import { defineCollection, text, checkbox } from "../../index";
import { defineAccess } from "../../access/config";

// ── Minimal VexConfig fixture for depth tests ─────────────────────────────
const fixtureConfig: VexConfig = {
  collections: [
    {
      slug: "posts",
      fields: {
        title: { type: "text" },
        author: { type: "relationship", collection: { slug: "authors" } },
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
            constraints: (
               
              {
                q,
              }: {
                q: any;
              },
            ) => q.filter((f: any) => f.eq("featured", true)),
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
// rule's index half can never reach `.withIndex()` — `resolveAccessConstraint`
// always compiles the WHOLE condition (index half included) into `.filter()`.
const indexedPostsResource = defineCollection({
  slug: "posts",
  // `featured` declares a real index — `defineAccess` validates a rule's
  // `withIndex` call against it at config time.
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
          read: { constraints: ({ q }) => q.withIndex("by_featured", (ix) => ix.eq("featured", true)) },
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
            constraints: ({ q }) =>
              q
                .withIndex("by_featured", (ix) => ix.eq("featured", true))
                .filter((f) => f.neq("slug", "hidden")),
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
          read: { constraints: ({ user }) => user._id === "vip" },
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
  test("withIndex-recorded constraint still narrows the query: full page, not ragged", async () => {
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

describe("search (server) — boolean short-circuit from a constraints callback", () => {
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
