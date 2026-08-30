import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import type { VexConfig } from "../../config";
import type { DocumentBySlug } from "../../types/generated";
import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import { find } from "./server";
import { defineCollection, text, checkbox } from "../../index";
import { defineAccess } from "../../access/config";

// ── Minimal VexConfig fixture for depth tests ─────────────────────────────
// Mirrors the relationship shape declared in test/convex/schema.ts so that
// `buildDepthPopulate` produces the correct populate objects at runtime.
const fixtureConfig: VexConfig = {
  collections: [
    {
      slug: "posts",
      fields: {
        title: { type: "text" },
        author: { type: "relationship", collection: { slug: "authors" } },
        parent: { type: "relationship", collection: { slug: "posts" } },
      },
      labels: { singular: "Post", plural: "Posts" },
      admin: { useAsTitle: "title" },
    },
    {
      slug: "authors",
      fields: {
        name: { type: "text" },
        organization: {
          type: "relationship",
          collection: { slug: "organizations" },
        },
      },
      labels: { singular: "Author", plural: "Authors" },
      admin: { useAsTitle: "name" },
    },
    {
      slug: "organizations",
      fields: { name: { type: "text" } },
      labels: { singular: "Organization", plural: "Organizations" },
      admin: { useAsTitle: "name" },
    },
  ],
} as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("find (server)", () => {
  test("returns empty array for an empty collection", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      find({ ctx, collection: "posts" }),
    );
    expect(docs).toEqual([]);
  });

  test("returns documents in insertion order", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "First", slug: "first" });
      await ctx.db.insert("posts", { title: "Second", slug: "second" });
      return find({ ctx, collection: "posts" });
    });
    expect(docs.map((d) => d.title)).toEqual(["First", "Second"]);
  });

  test("limit caps the result count", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      for (let i = 0; i < 5; i++) {
        await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
      }
      return find({ ctx, collection: "posts", limit: 3 });
    });
    expect(docs).toHaveLength(3);
  });

  test("populate replaces Id arrays with target docs", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena" });
      await ctx.db.insert("posts", {
        title: "Hi",
        slug: "hi",
        author: [authorId],
      });

      return find({
        ctx,
        collection: "posts",
        populate: { author: true },
      } as any) as Promise<{ author: unknown; [k: string]: unknown }[]>;
    });
    expect((docs[0].author as DocumentBySlug["authors"][])[0].name).toBe("Lena");
  });

  test("order: desc reverses insertion order", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "First", slug: "first" });
      await ctx.db.insert("posts", { title: "Second", slug: "second" });
      return find({ ctx, collection: "posts", order: "desc" });
    });
    expect(docs.map((d) => d.title)).toEqual(["Second", "First"]);
  });

  test("filter narrows results by field value", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", {
        title: "Published",
        slug: "pub",
        featured: true,
      });
      await ctx.db.insert("posts", {
        title: "Draft",
        slug: "draft",
        featured: false,
      });
      return find({
        ctx,
        collection: "posts",

        filter: (q: any) => q.eq(q.field("featured"), true),
      });
    });
    expect(docs).toHaveLength(1);
    expect(docs[0].title).toBe("Published");
  });

  test("filter with limit applies both constraints", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      for (let i = 0; i < 4; i++) {
        await ctx.db.insert("posts", {
          title: `Post ${i}`,
          slug: `s-${i}`,
          featured: true,
        });
      }
      await ctx.db.insert("posts", {
        title: "Hidden",
        slug: "hidden",
        featured: false,
      });
      return find({
        ctx,
        collection: "posts",

        filter: (q: any) => q.eq(q.field("featured"), true),
        limit: 2,
      });
    });
    expect(docs).toHaveLength(2);
    expect(docs.every((d) => d.featured)).toBe(true);
  });

  test("withIndex uses index for query", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", {
        title: "Featured",
        slug: "f",
        featured: true,
      });
      await ctx.db.insert("posts", {
        title: "Not Featured",
        slug: "nf",
        featured: false,
      });
      return find({
        ctx,
        collection: "posts",
        withIndex: {
          name: "by_featured",

          range: (q: any) => q.eq("featured", true),
        },
      });
    });
    expect(docs).toHaveLength(1);
    expect(docs[0].title).toBe("Featured");
  });

  test("withIndex without range returns all docs via index order", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      await ctx.db.insert("posts", {
        title: "B",
        slug: "b",
        featured: false,
      });
      return find({
        ctx,
        collection: "posts",
        withIndex: { name: "by_featured" },
      });
    });
    expect(docs).toHaveLength(2);
  });

  test("withIndex + order + limit all compose", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", {
        title: "A",
        slug: "a",
        featured: false,
      });
      await ctx.db.insert("posts", { title: "B", slug: "b", featured: true });
      await ctx.db.insert("posts", { title: "C", slug: "c", featured: true });
      return find({
        ctx,
        collection: "posts",
        withIndex: {
          name: "by_featured",
          range: (q: any) => q.eq("featured", true),
        },
        limit: 1,
      });
    });
    // Only featured docs, capped at 1
    expect(docs).toHaveLength(1);
    expect(docs[0].featured).toBe(true);
  });

  test("withIndex + filter compose (index narrows, filter refines)", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", {
        title: "Short",
        slug: "s",
        featured: true,
      });
      await ctx.db.insert("posts", {
        title: "Longer title",
        slug: "l",
        featured: true,
      });
      await ctx.db.insert("posts", {
        title: "Draft",
        slug: "d",
        featured: false,
      });
      return find({
        ctx,
        collection: "posts",
        withIndex: {
          name: "by_featured",
          range: (q: any) => q.eq("featured", true),
        },
        // secondary filter on top of the index range
        filter: (q: any) => q.gt(q.field("title").length ?? q.field("title"), "S"),
      });
    });
    // featured docs only (index), further narrowed by filter
    expect(docs.every((d) => d.featured)).toBe(true);
  });

  test("filter + limit + populate all compose", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena" });
      for (let i = 0; i < 3; i++) {
        await ctx.db.insert("posts", {
          title: `Post ${i}`,
          slug: `p-${i}`,
          featured: true,
          author: [authorId],
        });
      }
      await ctx.db.insert("posts", {
        title: "Draft",
        slug: "draft",
        featured: false,
      });

      return find({
        ctx,
        collection: "posts",
        filter: (q: any) => q.eq(q.field("featured"), true),
        limit: 2,
        populate: { author: true },
      } as any) as Promise<{ author: unknown; featured: unknown; [k: string]: unknown }[]>;
    });
    expect(docs).toHaveLength(2);
    expect(docs.every((d) => d.featured)).toBe(true);
    expect((docs[0].author as DocumentBySlug["authors"][])[0].name).toBe("Lena");
  });

  test("order: desc without index reverses insertion order", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "First", slug: "first" });
      await ctx.db.insert("posts", { title: "Second", slug: "second" });
      return find({ ctx, collection: "posts", order: "desc" });
    });
    expect(docs.map((d) => d.title)).toEqual(["Second", "First"]);
  });

  test("no args returns all docs up to default limit", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      for (let i = 0; i < 5; i++) {
        await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
      }
      return find({ ctx, collection: "posts" });
    });
    expect(docs).toHaveLength(5);
  });

  test("nested populate works at depth 2", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const orgId = await ctx.db.insert("organizations", { name: "Vex Inc" });
      const authorId = await ctx.db.insert("authors", {
        name: "Lena",
        organization: [orgId],
      });
      await ctx.db.insert("posts", {
        title: "Hi",
        slug: "hi",
        author: [authorId],
      });

      return find({
        ctx,
        collection: "posts",
        populate: { author: { populate: { organization: true } } },
      } as any) as Promise<{ author: unknown; [k: string]: unknown }[]>;
    });

    const anyDocs = docs as any[];
    const author = (anyDocs[0].author as DocumentBySlug["authors"][])[0];
    expect((author.organization as unknown as DocumentBySlug["organizations"][])[0].name).toBe(
      "Vex Inc",
    );
  });
});

describe("find (server) — depth auto-populate", () => {
  test("depth: 1 auto-populates all direct relationship fields", async () => {
    const t = convexTest(schema, modules);

    const docs = (await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena" });
      await ctx.db.insert("posts", {
        title: "Hi",
        slug: "hi",
        author: [authorId],
      });
      return find({ ctx, collection: "posts", depth: 1, config: fixtureConfig } as any);
    })) as any[];
    // `author` should be populated with the author doc, not a raw ID array.
    const author = (docs[0].author as DocumentBySlug["authors"][])[0];
    expect(author.name).toBe("Lena");
    expect(typeof author._id).toBe("string");
  });

  test("depth: 1 returns raw docs when no relationship fields are stored", async () => {
    const t = convexTest(schema, modules);
    const docs = (await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      // Post without author — relationship field absent.
      await ctx.db.insert("posts", { title: "Solo", slug: "solo" });
      return find({ ctx, collection: "posts", depth: 1, config: fixtureConfig } as any);
    })) as any[];
    expect(docs).toHaveLength(1);
    expect(docs[0].title).toBe("Solo");
    // author field is absent — no crash, no null.
    expect(docs[0].author).toBeUndefined();
  });

  test("depth: 2 populates nested relationships (posts → authors → organizations)", async () => {
    const t = convexTest(schema, modules);
    const docs = (await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const orgId = await ctx.db.insert("organizations", { name: "Vex Inc" });
      const authorId = await ctx.db.insert("authors", {
        name: "Lena",
        organization: [orgId],
      });
      await ctx.db.insert("posts", {
        title: "Hi",
        slug: "hi",
        author: [authorId],
      });
      return find({ ctx, collection: "posts", depth: 2, config: fixtureConfig } as any);
    })) as any[];
    const author = (docs[0].author as DocumentBySlug["authors"][])[0];
    expect(author.name).toBe("Lena");
    const org = (author.organization as unknown as DocumentBySlug["organizations"][])[0];
    expect(org.name).toBe("Vex Inc");
  });

  test("depth: 0 (explicit) returns raw docs without population", async () => {
    const t = convexTest(schema, modules);
    const docs = (await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena" });
      await ctx.db.insert("posts", {
        title: "Hi",
        slug: "hi",
        author: [authorId],
      });
      // depth: 0 is the default — equivalent to omitting depth.
      return find({ ctx, collection: "posts", depth: 0, config: fixtureConfig } as any);
    })) as any[];
    // author should still be a raw ID array, not populated docs.
    expect(Array.isArray(docs[0].author)).toBe(true);
    expect(typeof docs[0].author[0]).toBe("string");
  });

  test("depth without config returns raw docs (effectivePopulate is undefined)", async () => {
    const t = convexTest(schema, modules);
    const docs = (await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena" });
      await ctx.db.insert("posts", {
        title: "Hi",
        slug: "hi",
        author: [authorId],
      });
      // Passing depth without config — D11 guard: no populate applied.
      return find({ ctx, collection: "posts", depth: 1 } as any);
    })) as any[];
    // Without config, buildDepthPopulate cannot run → raw ID array.
    expect(typeof docs[0].author[0]).toBe("string");
  });

  test("populate wins over depth at runtime (D11)", async () => {
    const t = convexTest(schema, modules);
    // At the type level populate+depth is a compile error; at runtime we
    // force both via `as any` to verify D11: populate takes precedence.
    const docs = (await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena" });
      await ctx.db.insert("posts", {
        title: "Hi",
        slug: "hi",
        author: [authorId],
      });
      return find({
        ctx,
        collection: "posts",
        populate: { author: true },
        depth: 1,
        config: fixtureConfig,
      } as any);
    })) as any[];
    // Regardless of depth, the explicit populate should have resolved author.
    const author = (docs[0].author as DocumentBySlug["authors"][])[0];
    expect(author.name).toBe("Lena");
  });

  test("depth: 1 handles multiple docs with mixed relationship presence", async () => {
    const t = convexTest(schema, modules);
    const docs = (await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena" });
      // Post with author.
      await ctx.db.insert("posts", {
        title: "With Author",
        slug: "w",
        author: [authorId],
      });
      // Post without author.
      await ctx.db.insert("posts", { title: "No Author", slug: "n" });
      return find({ ctx, collection: "posts", depth: 1, config: fixtureConfig } as any);
    })) as any[];
    expect(docs).toHaveLength(2);
    // First doc has populated author.
    const author = (docs[0].author as DocumentBySlug["authors"][])[0];
    expect(author.name).toBe("Lena");
    // Second doc has no author — no crash.
    expect(docs[1].author).toBeUndefined();
  });

  // ── Pagination tests ──────────────────────────────────────────────────────

  test("paginationOpts: returns PaginationResult with page, continueCursor, isDone", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      for (let i = 0; i < 5; i++) {
        await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
      }
      return find({
        ctx,
        collection: "posts",
        paginationOpts: { numItems: 3, cursor: null },
      });
    });
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("continueCursor");
    expect(result).toHaveProperty("isDone");
    expect(result.page).toHaveLength(3);
    expect(result.page[0].title).toBe("Post 0");
    expect(result.isDone).toBe(false); // More pages exist
    expect(result.continueCursor).toBeTruthy(); // Cursor for next page
  });

  test("paginationOpts: continueCursor fetches next page", async () => {
    const t = convexTest(schema, modules);
    const { firstPage, secondPage } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        for (let i = 0; i < 7; i++) {
          await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
        }
        // First page
        const firstPage = await find({
          ctx,
          collection: "posts",
          paginationOpts: { numItems: 3, cursor: null },
        });
        // Second page using continueCursor
        const secondPage = await find({
          ctx,
          collection: "posts",
          paginationOpts: { numItems: 3, cursor: firstPage.continueCursor },
        });
        return { firstPage, secondPage };
      },
    );
    expect(firstPage.page).toHaveLength(3);
    expect(secondPage.page).toHaveLength(3);
    expect(firstPage.page[0].title).toBe("Post 0");
    expect(secondPage.page[0].title).toBe("Post 3");
    expect(secondPage.isDone).toBe(false); // One more item remains
  });

  test("paginationOpts: isDone=true when no more pages", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      for (let i = 0; i < 3; i++) {
        await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
      }
      return find({
        ctx,
        collection: "posts",
        paginationOpts: { numItems: 10, cursor: null },
      });
    });
    expect(result.page).toHaveLength(3);
    expect(result.isDone).toBe(true);
    // Convex returns "_end_cursor" sentinel value instead of null when done
    expect(result.continueCursor).toBeTruthy();
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
      return find({
        ctx,
        collection: "posts",
        paginationOpts: { numItems: 2, cursor: null },
        populate: { author: true },
      } as any);
    });
    expect(result.page).toHaveLength(2);
    const firstDoc = result.page[0] as { author: DocumentBySlug["authors"][] };
    expect(firstDoc.author[0].name).toBe("Lena");
  });

  test("paginationOpts: works with order and filter", async () => {
    const t = convexTest(schema, modules);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      for (let i = 0; i < 5; i++) {
        await ctx.db.insert("posts", {
          title: `Post ${i}`,
          slug: `s-${i}`,
          featured: i % 2 === 0,
        });
      }
      return find({
        ctx,
        collection: "posts",
        order: "desc",

        filter: (q: any) => q.eq(q.field("featured"), true),
        paginationOpts: { numItems: 2, cursor: null },
      });
    });
    expect(result.page).toHaveLength(2);
    expect(result.page[0].title).toBe("Post 4"); // Descending order
    expect(result.page[1].title).toBe("Post 2");
  });
});

// ── Access-constraint narrowing fixture ────────────────────────────────────
const constrainedPostsResource = defineCollection({
  slug: "posts",
  // `featured` declares a real index: `defineAccess` validates every rule's recorded
  // range against the resource's DECLARED indexes, so naming one that does not exist
  // fails at config time — before any of the assertions below get a chance to run.
  fields: { title: text(), slug: text(), featured: checkbox({ index: "by_featured" }) },
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
            constraints: ({ q }) => q.withIndex("by_featured", (ix) => ix.eq("featured", true)),
          },
        },
      },
    },
  }),
} as unknown as VexConfig;

const contributorAuth = { user: { _id: "u1", roles: "contributor" } };

describe("find (server) — access constraints", () => {
  test("access index claims a free slot: returns a full page of only permitted rows", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", {
        title: "Featured 1",
        slug: "f1",
        featured: true,
      });
      await ctx.db.insert("posts", {
        title: "Featured 2",
        slug: "f2",
        featured: true,
      });
      await ctx.db.insert("posts", {
        title: "Featured 3",
        slug: "f3",
        featured: true,
      });
      await ctx.db.insert("posts", {
        title: "Draft 1",
        slug: "d1",
        featured: false,
      });
      return find({
        ctx,
        collection: "posts",
        config: constrainedAccess,
        auth: contributorAuth,
        limit: 3,
      } as any);
    });
    expect(docs).toHaveLength(3);
    expect(docs.every((d: any) => d.featured)).toBe(true);
  });

  test("caller's index displaces the access index: constraint still narrows via filter, full page", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      // Insertion/slug order deliberately interleaves non-featured docs
      // ahead of featured ones, so a naive `.take(3)` in slug order (without
      // the compiled constraint in `.filter()`) would read "a","b","c" — two
      // non-featured — and `hasPermission` would strip them afterward,
      // producing a page of length 1.
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
      return find({
        ctx,
        collection: "posts",
        config: constrainedAccess,
        auth: contributorAuth,
        // Names a DIFFERENT index than the access rule's `by_featured` —
        // `pickQueryIndex` gives the `withIndex` slot to this caller index.
        withIndex: { name: "by_slug" },
        limit: 3,
      } as any);
    });
    // With the constraint `and`-ed into `.filter()` before `.take(3)`, only
    // featured docs are ever read — a full page, in slug order.
    expect(docs).toHaveLength(3);
    expect(docs.every((d: any) => d.featured)).toBe(true);
    expect(docs.map((d: any) => d.slug)).toEqual(["c", "d", "e"]);
  });
});

// ── Filter-only and index+filter narrowing ─────────────────────────────────
const filterOnlyAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [constrainedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        posts: {
          // No index named — the flat algebra, which is also the only form a
          // wildcard entry can express.
          read: { constraints: ({ q }) => q.filter((f) => f.eq("featured", true)) },
        },
      },
    },
  }),
} as unknown as VexConfig;

const indexAndFilterAccess = {
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

/**
 * Seeds four posts with the NON-permitted rows first.
 *
 * Order is load-bearing. Convex returns rows by `_creationTime` ascending, so an
 * unnarrowed query asking for two rows gets `C` and `D` — which the per-document
 * `hasPermission` pass then discards, leaving a SHORT page. Only a query that was
 * actually narrowed comes back full. Seeding the permitted rows first would let a
 * completely unnarrowed query pass by luck.
 */
async function seedNarrowing(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    await ctx.db.insert("posts", { title: "C", slug: "c", featured: false });
    await ctx.db.insert("posts", { title: "D", slug: "d", featured: false });
    await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
    await ctx.db.insert("posts", { title: "B", slug: "hidden", featured: true });
    await ctx.db.insert("posts", { title: "E", slug: "e", featured: true });
  });
}

describe("find (server) — filter-only constraints reach the query", () => {
  test("a rule with no index still narrows: the query itself excludes non-permitted rows", async () => {
    const t = convexTest(schema, modules);
    await seedNarrowing(t);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      return find({
        ctx,
        collection: "posts",
        config: filterOnlyAccess,
        auth: contributorAuth,
        paginationOpts: { numItems: 2, cursor: null },
      } as any);
    });
    // A narrowed query reads only featured rows and fills the page. An unnarrowed
    // one reads C and D, discards both per-document, and returns an empty page.
    expect(result.page.map((d: any) => d.title)).toEqual(["A", "B"]);
  });
});

describe("find (server) — index plus filter both apply", () => {
  test("the access index wins the slot AND its filter half still excludes rows", async () => {
    const t = convexTest(schema, modules);
    await seedNarrowing(t);
    const result: any = await t.run(async (ctx) => {
      return find({
        ctx,
        collection: "posts",
        config: indexAndFilterAccess,
        auth: contributorAuth,
      } as any);
    });
    // The index half admits A, B, E; the filter half drops B (slug "hidden").
    expect(result.map((d: any) => d.title)).toEqual(["A", "E"]);
  });

  test("the filter half reaches the QUERY, not just the per-document pass", async () => {
    const t = convexTest(schema, modules);
    await seedNarrowing(t);
    const result: any = await t.run(async (ctx) => {
      return find({
        ctx,
        collection: "posts",
        config: indexAndFilterAccess,
        auth: contributorAuth,
        paginationOpts: { numItems: 2, cursor: null },
      } as any);
    });
    // Page size 2 is what separates the two. Filter in the query: it reads A and E
    // and returns a FULL page. Filter only per-document: it reads A and B, discards
    // B, and returns a short page of one — the ragged page this design removes.
    expect(result.page.map((d: any) => d.title)).toEqual(["A", "E"]);
  });
});

// ── Same-name index composition (composeRanges) ─────────────────────────────
// Declares BOTH real indexes (`by_slug`, `by_featured`) on the access-resource
// side, unlike `constrainedPostsResource` which only declares `by_featured` —
// needed here because the ACCESS RULE itself (not just the caller) calls
// `q.withIndex("by_slug", …)`, and `defineAccess` validates a rule's index
// name against its own resource's declared indexes.
const dualIndexedPostsResource = defineCollection({
  slug: "posts",
  fields: {
    title: text(),
    slug: text({ index: "by_slug" }),
    featured: checkbox({ index: "by_featured" }),
  },
});

const sameIndexBoundsAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [dualIndexedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        posts: {
          // Lower bound only — the caller's own `withIndex` below supplies the
          // upper bound on the SAME index name, so `pickQueryIndex` must
          // compose the two into one range rather than picking one side.
          read: { constraints: ({ q }) => q.withIndex("by_slug", (ix) => ix.gte("slug", "m")) },
        },
      },
    },
  }),
} as unknown as VexConfig;

describe("find (server) — caller and access name the same index", () => {
  test("both halves compose into one range: neither side's bound is lost or doubled", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      // Insertion order deliberately scrambled relative to slug order, so a
      // result that happens to come out sorted by slug proves the `by_slug`
      // index actually drove the read (and its ordering) rather than the
      // rows merely surviving in insertion order.
      await ctx.db.insert("posts", { title: "Above", slug: "z-above", featured: false });
      await ctx.db.insert("posts", { title: "Mid 2", slug: "s-mid", featured: false });
      await ctx.db.insert("posts", { title: "Below", slug: "a-below", featured: false });
      await ctx.db.insert("posts", { title: "Edge hi", slug: "t-edge", featured: false });
      await ctx.db.insert("posts", { title: "Edge lo", slug: "m-edge", featured: false });
      await ctx.db.insert("posts", { title: "Mid 1", slug: "n-mid", featured: false });
    });
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      return find({
        ctx,
        collection: "posts",
        config: sameIndexBoundsAccess,
        auth: contributorAuth,
        // Caller's upper bound, on the exact index name the access rule uses.
        withIndex: { name: "by_slug", range: (q: any) => q.lt("slug", "t-edge") },
      } as any);
    });
    // Access's lower bound (>= "m") excludes "a-below"; the caller's upper
    // bound (< "t-edge") excludes "t-edge" itself and "z-above". Losing either
    // half, or applying one of them twice (which would error before ever
    // reaching this assertion — see `validateIndexRangeExpression`), would
    // produce a different set or throw.
    expect(docs.map((d: any) => d.slug)).toEqual(["m-edge", "n-mid", "s-mid"]);
  });
});

// ── Three constraints AND together ──────────────────────────────────────────
describe("find (server) — access index-as-filter, access filter, and caller's own index", () => {
  test("all three constraints apply when the caller's index displaces an index+filter access rule", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "below caller range", slug: "a0", featured: true });
      await ctx.db.insert("posts", { title: "not featured", slug: "b1", featured: false });
      await ctx.db.insert("posts", { title: "not featured too", slug: "b2", featured: false });
      await ctx.db.insert("posts", { title: "permitted", slug: "c1", featured: true });
      await ctx.db.insert("posts", { title: "permitted too", slug: "c2", featured: true });
      await ctx.db.insert("posts", { title: "excluded by neq", slug: "hidden", featured: true });
    });
    const docs: any = await t.run(async (ctx) => {
      return find({
        ctx,
        collection: "posts",
        // Access rule: by_featured index range (featured==true) AND filter (slug != "hidden").
        config: indexAndFilterAccess,
        auth: contributorAuth,
        // Caller names a DIFFERENT index with its own range — it wins the
        // withIndex slot, so BOTH access halves must be re-expressed as
        // filters and AND-ed alongside the caller's own range.
        withIndex: { name: "by_slug", range: (q: any) => q.gte("slug", "b1") },
        limit: 2,
      } as any);
    });
    // In slug order (the index in use), the first rows at/after "b1" are
    // "b1"/"b2" (not featured) then "c1"/"c2" (permitted) then "hidden"
    // (featured, but excluded by the neq filter). A page this small proves all
    // three constraints ran INSIDE the query: dropping the caller's range would
    // let "a0" leak in, dropping the featured filter would surface "b1"/"b2",
    // and dropping the neq filter would surface "hidden".
    expect(docs).toHaveLength(2);
    expect(docs.map((d: any) => d.slug)).toEqual(["c1", "c2"]);
  });
});

// ── Constraints callback short-circuits to a flat boolean ───────────────────
const shortCircuitAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [constrainedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        posts: {
          // Never touches `q` — resolves to a flat true/false instead of a
          // condition. Constraints callbacks never receive `data`, so this
          // decision is uniform across the whole query and every document.
          read: { constraints: ({ user }) => (user as { vip?: boolean }).vip === true },
        },
      },
    },
  }),
} as unknown as VexConfig;

describe("find (server) — constraints callback short-circuits to a flat boolean", () => {
  test("outcome true: unrestricted, and pagination reads every row with no narrowing", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      for (let i = 0; i < 7; i++) {
        await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
      }
    });
    const vipAuth = { user: { _id: "u-vip", roles: "contributor", vip: true } };
    const page1: any = await t.run(async (ctx) =>
      find({
        ctx,
        collection: "posts",
        config: shortCircuitAccess,
        auth: vipAuth,
        paginationOpts: { numItems: 3, cursor: null },
      } as any),
    );
    expect(page1.page).toHaveLength(3);
    expect(page1.isDone).toBe(false);
    const page2: any = await t.run(async (ctx) =>
      find({
        ctx,
        collection: "posts",
        config: shortCircuitAccess,
        auth: vipAuth,
        paginationOpts: { numItems: 10, cursor: page1.continueCursor },
      } as any),
    );
    expect(page2.page).toHaveLength(4);
    expect(page2.isDone).toBe(true);
  });

  test("outcome false: denies everything — the per-document pass empties the page despite an unfiltered query", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      for (let i = 0; i < 7; i++) {
        await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
      }
    });
    const nonVipAuth = { user: { _id: "u-plain", roles: "contributor", vip: false } };
    const result: any = await t.run(async (ctx) =>
      find({
        ctx,
        collection: "posts",
        config: shortCircuitAccess,
        auth: nonVipAuth,
        paginationOpts: { numItems: 3, cursor: null, totalDocs: true },
      } as any),
    );
    expect(result.page).toEqual([]);
    expect(result.totalDocs).toBe(0);
  });
});

// ── Role-level wildcard vs an explicit per-resource rule ────────────────────
const authorsResource = defineCollection({
  slug: "authors",
  fields: { name: text() },
});

const roleWildcardTrueAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [constrainedPostsResource, authorsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        "*": true,
        // An explicit per-resource rule — even a narrower one — always wins
        // over the role-level wildcard, which only ever answers for
        // resources the role does not declare at all.
        posts: { read: false },
      },
    },
  }),
} as unknown as VexConfig;

const roleWildcardFalseAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [constrainedPostsResource, authorsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        "*": false,
        posts: { read: true },
      },
    },
  }),
} as unknown as VexConfig;

describe("find (server) — role-level wildcard vs an explicit per-resource rule", () => {
  test("'*': true never overrides an explicit deny on a declared resource, but still grants an undeclared one", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Post", slug: "p" });
      await ctx.db.insert("authors", { name: "Lena" });
    });
    const posts: any = await t.run(async (ctx) =>
      find({
        ctx,
        collection: "posts",
        config: roleWildcardTrueAccess,
        auth: contributorAuth,
      } as any),
    );
    const authors: any = await t.run(async (ctx) =>
      find({
        ctx,
        collection: "authors",
        config: roleWildcardTrueAccess,
        auth: contributorAuth,
      } as any),
    );
    // "posts" is explicitly declared (read: false) — the wildcard is never consulted.
    expect(posts).toEqual([]);
    // "authors" is undeclared for this role — the wildcard's `true` answers it.
    expect(authors).toHaveLength(1);
  });

  test("'*': false never overrides an explicit allow on a declared resource, and still denies an undeclared one", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Post", slug: "p" });
      await ctx.db.insert("authors", { name: "Lena" });
    });
    const posts: any = await t.run(async (ctx) =>
      find({
        ctx,
        collection: "posts",
        config: roleWildcardFalseAccess,
        auth: contributorAuth,
      } as any),
    );
    const authors: any = await t.run(async (ctx) =>
      find({
        ctx,
        collection: "authors",
        config: roleWildcardFalseAccess,
        auth: contributorAuth,
      } as any),
    );
    expect(posts).toHaveLength(1);
    expect(authors).toEqual([]);
  });
});

// ── Subject-level action wildcard carrying a constraint ──────────────────────
const actionWildcardAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [constrainedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        posts: {
          // No explicit "read" key — resolved through the subject-level "*",
          // which `resolveActionCheck` must honor identically for narrowing
          // (`resolveAccessIndex`/`resolveAccessConstraint`) and for the
          // per-document `hasPermission` pass. `q` here is typed as the
          // predicate-only `AccessPredicateBuilder` (DD 14) rather than
          // `AccessQueryBuilder` — a "*" entry could equally resolve for a
          // non-query action (e.g. "delete"), which has no `withIndex` slot
          // to offer, so `.filter` is the only sound form for a wildcard.
          "*": {
            constraints: ({ q }) => q.filter((f) => f.eq("featured", true)),
          },
        },
      },
    },
  }),
} as unknown as VexConfig;

describe("find (server) — subject-level action wildcard resolves for read", () => {
  test("a '*' entry with a constraint narrows read exactly like an explicit rule would", async () => {
    const t = convexTest(schema, modules);
    await seedNarrowing(t);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      find({
        ctx,
        collection: "posts",
        config: actionWildcardAccess,
        auth: contributorAuth,
        paginationOpts: { numItems: 2, cursor: null },
      } as any),
    );
    expect(result.page.map((d: any) => d.title)).toEqual(["A", "B"]);
  });
});

// ── Multi-role users: OR across roles ────────────────────────────────────────
const multiRoleOrAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor", "reviewer"] as const,
    resources: [constrainedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        posts: { read: { constraints: ({ q }) => q.filter((f) => f.eq("featured", true)) } },
      },
      reviewer: {
        posts: { read: { constraints: ({ q }) => q.filter((f) => f.eq("slug", "special")) } },
      },
    },
  }),
} as unknown as VexConfig;

const multiRoleDenyAllowAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor", "reviewer"] as const,
    resources: [constrainedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        posts: {
          read: {
            constraints: ({ q }) => q.withIndex("by_featured", (ix) => ix.eq("featured", true)),
          },
        },
      },
      reviewer: {
        posts: { read: false },
      },
    },
  }),
} as unknown as VexConfig;

const multiRoleUnrestrictedAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor", "reviewer"] as const,
    resources: [constrainedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        posts: { read: true },
      },
      reviewer: {
        posts: { read: { constraints: ({ q }) => q.filter((f) => f.eq("featured", true)) } },
      },
    },
  }),
} as unknown as VexConfig;

const multiRoleAuth = { user: { _id: "u-multi", roles: ["contributor", "reviewer"] } };

describe("find (server) — multi-role users OR permissions across roles", () => {
  test("a row permitted by EITHER role's condition is returned; one permitted by neither is not", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "By contributor", slug: "a", featured: true });
      await ctx.db.insert("posts", { title: "By reviewer", slug: "special", featured: false });
      await ctx.db.insert("posts", { title: "By neither", slug: "c", featured: false });
    });
    const docs: any = await t.run(async (ctx) =>
      find({ ctx, collection: "posts", config: multiRoleOrAccess, auth: multiRoleAuth } as any),
    );
    expect(docs.map((d: any) => d.slug).sort()).toEqual(["a", "special"]);
  });

  test("one role denies outright and the other conditionally allows: the allowing role governs, and narrowing still applies", async () => {
    const t = convexTest(schema, modules);
    await seedNarrowing(t);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      find({
        ctx,
        collection: "posts",
        config: multiRoleDenyAllowAccess,
        auth: multiRoleAuth,
        paginationOpts: { numItems: 2, cursor: null },
      } as any),
    );
    // reviewer's outright `false` contributes nothing to the union; contributor's
    // condition is the ONLY candidate, so `selectSingleCondition` still narrows —
    // a denying sibling role must not force a full unnarrowed scan.
    expect(result.page.map((d: any) => d.title)).toEqual(["A", "B"]);
  });

  test("one role is unrestricted and the other conditional: the union is everything, and no narrowing may be applied", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Not featured", slug: "nf", featured: false });
      await ctx.db.insert("posts", { title: "Featured", slug: "f", featured: true });
    });
    const docs: any = await t.run(async (ctx) =>
      find({
        ctx,
        collection: "posts",
        config: multiRoleUnrestrictedAccess,
        auth: multiRoleAuth,
      } as any),
    );
    // contributor's unrestricted `true` means reviewer's featured-only condition
    // must NOT be used to narrow the query — doing so would silently hide
    // "Not featured", which contributor's blanket allow permits.
    expect(docs.map((d: any) => d.slug).sort()).toEqual(["f", "nf"]);
  });
});

// ── limit relative to the permitted-row count ────────────────────────────────
describe("find (server) — limit relative to the permitted-row count", () => {
  test("limit smaller than the permitted count still returns a full, correctly-narrowed page", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Draft 1", slug: "d1", featured: false });
      await ctx.db.insert("posts", { title: "Draft 2", slug: "d2", featured: false });
      await ctx.db.insert("posts", { title: "Featured 1", slug: "f1", featured: true });
      await ctx.db.insert("posts", { title: "Featured 2", slug: "f2", featured: true });
      await ctx.db.insert("posts", { title: "Featured 3", slug: "f3", featured: true });
      await ctx.db.insert("posts", { title: "Featured 4", slug: "f4", featured: true });
      await ctx.db.insert("posts", { title: "Featured 5", slug: "f5", featured: true });
      return find({
        ctx,
        collection: "posts",
        config: constrainedAccess,
        auth: contributorAuth,
        limit: 2,
      } as any);
    });
    expect(docs).toHaveLength(2);
    expect(docs.every((d: any) => d.featured)).toBe(true);
  });

  test("limit larger than the permitted count returns exactly the permitted rows, not the limit", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Draft 1", slug: "d1", featured: false });
      await ctx.db.insert("posts", { title: "Draft 2", slug: "d2", featured: false });
      await ctx.db.insert("posts", { title: "Featured 1", slug: "f1", featured: true });
      await ctx.db.insert("posts", { title: "Featured 2", slug: "f2", featured: true });
      await ctx.db.insert("posts", { title: "Featured 3", slug: "f3", featured: true });
      return find({
        ctx,
        collection: "posts",
        config: constrainedAccess,
        auth: contributorAuth,
        limit: 10,
      } as any);
    });
    expect(docs).toHaveLength(3);
    expect(docs.every((d: any) => d.featured)).toBe(true);
  });
});

// ── A rule that permits nothing ──────────────────────────────────────────────
const denyAllReadAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [constrainedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: { posts: { read: false } },
    },
  }),
} as unknown as VexConfig;

describe("find (server) — a rule that permits nothing", () => {
  test("paginated: returns an empty page, and totalDocs reflects the filtered set, not the raw table", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      for (let i = 0; i < 6; i++) {
        await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
      }
    });
    // numItems (3) < total rows (6), so this exercises the SEPARATE count-query
    // path in `find` (isDone is false on the first page), not the trivial
    // shortcut that reuses the already-collected page.
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      find({
        ctx,
        collection: "posts",
        config: denyAllReadAccess,
        auth: contributorAuth,
        paginationOpts: { numItems: 3, cursor: null, totalDocs: true },
      } as any),
    );
    expect(result.page).toEqual([]);
    expect(result.totalDocs).toBe(0);
  });

  test("non-paginated: returns an empty array, not the raw table", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Post", slug: "p" });
    });
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      find({ ctx, collection: "posts", config: denyAllReadAccess, auth: contributorAuth } as any),
    );
    expect(docs).toEqual([]);
  });
});

// `read` is deliberately undeclared: the pinned deny posture refuses it, so rows coming
// back under `listFeatured` prove the CHECKED ACTION actually switched — a passing call
// cannot be explained by the default verb.
const accessOptionsConfig = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [constrainedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    customActions: { posts: { query: ["listFeatured"] } },
    permissions: { contributor: { posts: { listFeatured: true } } },
  }),
} as unknown as VexConfig;

describe("find (server) — access call options", () => {
  test("access.action switches the checked action", async () => {
    const t = convexTest(schema, modules);
    const { withAction, withoutAction } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
        await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
        return {
          withAction: await find({
            ctx,
            collection: "posts",
            config: accessOptionsConfig,
            auth: contributorAuth,
            access: { action: "listFeatured" },
          }),
          withoutAction: await find({
            ctx,
            collection: "posts",
            config: accessOptionsConfig,
            auth: contributorAuth,
          }),
        };
      },
    );
    expect(withAction).toHaveLength(2);
    // Default verb is `read`, which nothing declares — pinned deny refuses it.
    expect(withoutAction).toHaveLength(0);
  });

  test("access.bypass returns rows the matrix denies, with no auth at all", async () => {
    const t = convexTest(schema, modules);
    const { bypassed, enforced } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
        return {
          bypassed: await find({
            ctx,
            collection: "posts",
            config: accessOptionsConfig,
            access: { bypass: true },
          }),
          enforced: await find({ ctx, collection: "posts", config: accessOptionsConfig }),
        };
      },
    );
    expect(bypassed).toHaveLength(1);
    // No auth and no bypass: unknown caller, deny posture — nothing comes back.
    expect(enforced).toHaveLength(0);
  });
});
