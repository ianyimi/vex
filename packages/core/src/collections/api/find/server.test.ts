import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test, vi } from "vitest";

import type { VexConfig } from "../../../config";
import type { VexWhere } from "../../../db/queryArgs";
import type { DocumentBySlug } from "../../../types/generated";
import * as _generatedApi from "../../../db/test/convex/_generated/api";
import schema from "../../../db/test/convex/schema";
import { find } from "./server";
import { defineCollection, text, checkbox } from "../../../index";
import { defineAccess } from "../../../access/config";

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
        cover: { type: "upload", to: "images" },
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

  test("where narrows results by field value", async () => {
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

        where: (q: any) => q.eq("featured", true),
      });
    });
    expect(docs).toHaveLength(1);
    expect(docs[0].title).toBe("Published");
  });

  test("where composes or/not and still meets the access filter", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
      await ctx.db.insert("posts", { title: "C", slug: "c", featured: true });
      return find({
        ctx,
        collection: "posts",
        where: (q: any) => q.or(q.eq("slug", "b"), q.not(q.eq("featured", false))),
      });
    });
    expect(docs.map((d) => d.title)).toEqual(["A", "B", "C"]);
  });

  test("a plain where node compiles the same as the equivalent builder", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
      await ctx.db.insert("posts", { title: "C", slug: "c", featured: true });
      return find({
        ctx,
        collection: "posts",
        where: { field: "featured", op: "eq", value: true },
      });
    });
    expect(docs.map((d) => d.title)).toEqual(["A", "C"]);
  });

  test("where with limit applies both constraints", async () => {
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

        where: (q: any) => q.eq("featured", true),
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

  test("withIndex + where compose (index narrows, filter refines)", async () => {
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
        where: (q: any) => q.gt("title", "S"),
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
        where: (q: any) => q.eq("featured", true),
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

  test.each([
    ["omitted", undefined],
    ["0", 0],
  ])("limit %s returns every matching doc", async (_label, limit) => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      for (let i = 0; i < 5; i++) {
        await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
      }
      return find({ ctx, collection: "posts", limit });
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

  test("depth: 1 auto-populates upload fields (media docs), the same as relationship fields", async () => {
    const t = convexTest(schema, modules);
    const docs = (await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const imageId = await ctx.db.insert("images", { filename: "cover.png" });
      await ctx.db.insert("posts", {
        title: "Hi",
        slug: "hi",
        cover: [imageId],
      });
      return find({ ctx, collection: "posts", depth: 1, config: fixtureConfig } as any);
    })) as any[];
    const cover = docs[0].cover as { filename: string; _id: string }[];
    expect(cover[0].filename).toBe("cover.png");
    expect(typeof cover[0]._id).toBe("string");
  });

  test("depth: 1 populates BOTH a relationship and an upload field on the same doc", async () => {
    const t = convexTest(schema, modules);
    const docs = (await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena" });
      const imageId = await ctx.db.insert("images", { filename: "cover.png" });
      await ctx.db.insert("posts", { title: "Hi", slug: "hi", author: [authorId], cover: [imageId] });
      return find({ ctx, collection: "posts", depth: 1, config: fixtureConfig } as any);
    })) as any[];
    expect((docs[0].author as { name: string }[])[0].name).toBe("Lena");
    expect((docs[0].cover as { filename: string }[])[0].filename).toBe("cover.png");
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

  test("paginationOpts: works with order and where", async () => {
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

        where: (q: any) => q.eq("featured", true),
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
  // `featured` declares a real index, matching what `vex generate` would emit —
  // config-time index validation (`validateAccessConfig`, run from `defineConfig`)
  // is not exercised by this file, which builds `VexConfig` by hand.
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
            withIndex: { name: "by_featured", range: (ix) => ix.eq("featured", true) },
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
    // The collision this test sets up is exactly what `pickConvexQueryIndex`'s dev diagnostic
    // reports ("Access index ... cannot be applied: this query already uses ..."), so the
    // warning firing is part of the contract under test, not incidental output. Spied and
    // asserted below instead of left to print on stderr.
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
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
        // `pickConvexQueryIndex` gives the `withIndex` slot to this caller index.
        withIndex: { name: "by_slug" },
        limit: 3,
      } as any);
    });
    // With the constraint `and`-ed into `.filter()` before `.take(3)`, only
    // featured docs are ever read — a full page, in slug order.
    expect(docs).toHaveLength(3);
    expect(docs.every((d: any) => d.featured)).toBe(true);
    expect(docs.map((d: any) => d.slug)).toEqual(["c", "d", "e"]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Access index "by_featured" cannot be applied'),
    );
    warnSpy.mockRestore();
  });
});

// `reader` may read every post but not its `featured` field.
const featuredHiddenAccess = {
  ...fixtureConfig,
  // fixtureConfig's `posts` entry declares only title/author/parent — this
  // describe block's `where` probes `slug`/`featured`, which `constrainedPostsResource`
  // (not fixtureConfig) declares. Swap it in so `whereFieldNames` resolves them.
  collections: [
    constrainedPostsResource,
    ...fixtureConfig.collections.filter((c) => c.slug !== "posts"),
  ],
  access: defineAccess({
    roles: ["reader"] as const,
    resources: [constrainedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: { reader: { posts: { read: () => ({ "*": true, featured: false }) } } },
  }),
} as unknown as VexConfig;

const readerAuth = { user: { _id: "u2", roles: "reader" } };

describe("find (server) — where cannot probe a field the caller cannot read", () => {
  /** Inserts A (featured) and B (not), then runs `find` as `reader`. */
  const findAsReader = (extra: Record<string, unknown>) => {
    const t = convexTest(schema, modules);
    return t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
      return find({ ctx, collection: "posts", config: featuredHiddenAccess, auth: readerAuth, ...extra } as any);
    });
  };

  test("a where on a denied field returns nothing for that caller", async () => {
    // Not ["A"]: that would reveal A's hidden `featured` value.
    const docs = await findAsReader({ where: { field: "featured", op: "eq", value: true } });
    expect(docs).toEqual([]);
  });

  test("a where on a readable field is unaffected, and the hidden field is still stripped", async () => {
    const docs = await findAsReader({ where: { field: "slug", op: "eq", value: "a" } });
    expect(docs.map((d: any) => d.title)).toEqual(["A"]);
    expect(docs[0]).not.toHaveProperty("featured");
  });

  test("access: { bypass: true } skips the guard", async () => {
    const docs = await findAsReader({ where: { field: "featured", op: "eq", value: true }, access: { bypass: true } });
    expect(docs.map((d: any) => d.title)).toEqual(["A"]);
  });

  test("totalDocs excludes the rows the page excludes", async () => {
    const result: any = await findAsReader({
      where: { field: "featured", op: "eq", value: true },
      paginationOpts: { numItems: 1, cursor: null, totalDocs: true },
    });
    expect(result.page).toEqual([]);
    expect(result.totalDocs).toBe(0);
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
          read: { where: ({ q }) => q.eq("featured", true) },
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
            withIndex: { name: "by_featured", range: (ix) => ix.eq("featured", true) },
            where: ({ q }) => q.neq("slug", "hidden"),
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

// ── Same-name index composition (composeConvexQueryRanges) ─────────────────────────────
// Declares BOTH real indexes (`by_slug`, `by_featured`) on the access-resource
// side, unlike `constrainedPostsResource` which only declares `by_featured` —
// needed here because the ACCESS RULE itself (not just the caller) declares
// `withIndex: { name: "by_slug", … }`, matching what `vex generate` would emit
// for this resource.
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
          // upper bound on the SAME index name, so `pickConvexQueryIndex` must
          // compose the two into one range rather than picking one side.
          read: { withIndex: { name: "by_slug", range: (ix) => ix.gte("slug", "m") } },
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
          read: { where: ({ user }) => (user as { vip?: boolean }).vip === true },
        },
      },
    },
  }),
} as unknown as VexConfig;

describe("find (server) — withIndex/where callback short-circuits to a flat boolean", () => {
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
          // (`resolveQueryIndex`/`resolveQueryConstraint`) and for the
          // per-document `hasPermission` pass. `q` here is typed as the
          // predicate-only `FilterConstraintBuilder` (DD 14) rather than a query's
          // `withIndex` — a "*" entry could equally resolve for a
          // non-query action (e.g. "delete"), which has no `withIndex` slot
          // to offer, so `where` is the only sound form for a wildcard.
          "*": {
            where: ({ q }) => q.eq("featured", true),
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
        posts: { read: { where: ({ q }) => q.eq("featured", true) } },
      },
      reviewer: {
        posts: { read: { where: ({ q }) => q.eq("slug", "special") } },
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
            withIndex: { name: "by_featured", range: (ix) => ix.eq("featured", true) },
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
        posts: { read: { where: ({ q }) => q.eq("featured", true) } },
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

// ── Field-level read shaping (Step 5) ───────────────────────────────────────
const fieldMapPostsResource = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text() },
});

const fieldMapAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["editor"] as const,
    resources: [fieldMapPostsResource],
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

const noMapAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["editor"] as const,
    resources: [fieldMapPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: { editor: { posts: { read: true } } },
  }),
} as unknown as VexConfig;

const fieldMapAuth = { user: { _id: "u1", roles: "editor" } };

describe("find (server) — field-level read shaping", () => {
  test("strips a field denied by the read action", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Published", slug: "public" });
      return find({ ctx, collection: "posts", config: fieldMapAccess, auth: fieldMapAuth } as any);
    });
    expect((docs[0] as any).slug).toBe("public");
    expect((docs[0] as any).title).toBeUndefined();
  });

  test("returns documents unchanged when the read action declares no map (regression)", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Published", slug: "public" });
      return find({ ctx, collection: "posts", config: noMapAccess, auth: fieldMapAuth } as any);
    });
    expect((docs[0] as any).title).toBe("Published");
  });

  // `_creationTime` survives HERE because this map's wildcard is `true` and
  // never explicitly names it — NOT because it's unconditionally exempt like
  // `_id` (developer decision, binding, "access-system-fields": `_creationTime`
  // IS a real, gateable field-permission key now). The dedicated describe
  // block below proves it actually strips once a map explicitly denies it.
  test("_id always survives; _creationTime survives here too, because the wildcard covers it (not because it's exempt)", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Published", slug: "public" });
      return find({ ctx, collection: "posts", config: fieldMapAccess, auth: fieldMapAuth } as any);
    });
    expect((docs[0] as any)._id).toBeDefined();
    expect((docs[0] as any)._creationTime).toBeDefined();
  });

  test("strips per document when the map's value is an expression over the document", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Draft post", slug: "draft" });
      await ctx.db.insert("posts", { title: "Published post", slug: "public" });
      return find({ ctx, collection: "posts", config: fieldMapAccess, auth: fieldMapAuth } as any);
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
      return find({ ctx, collection: "posts", config: fieldMapAccess, auth: fieldMapAuth } as any);
    });
    expect(docs).toHaveLength(1);
  });
});

// Developer decision (binding, "access-system-fields"): `_creationTime`/
// `updatedAt`/`vex_status` are real, gateable field-permission keys now —
// proves `find`'s own `readableDocuments` pipeline strips them exactly like
// any other denied field, server-side, through the real `find` call (not just
// the isolated `resolveFieldPermissions`/`stripDeniedFields` unit).
describe("find (server) — system field stripping (developer decision, binding, \"access-system-fields\")", () => {
  const systemFieldPostsResource = defineCollection({
    slug: "posts",
    fields: { title: text(), slug: text() },
    versions: { drafts: true },
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
      return find({
        ctx,
        collection: "posts",
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

const versionedPostsResource = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text() },
  versions: { drafts: true },
});

const versionedAuthorsResource = defineCollection({
  slug: "authors",
  fields: { name: text() },
});

const versionedConfig = {
  collections: [versionedPostsResource, versionedAuthorsResource],
} as unknown as VexConfig;

const versionedAccess = defineAccess({
  roles: ["editor", "viewer"] as const,
  resources: [versionedPostsResource],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    editor: { posts: { readDrafts: true } },
    viewer: { posts: { read: true } },
  },
});

const versionedConfigWithAccess = {
  collections: [versionedPostsResource, versionedAuthorsResource],
  access: versionedAccess,
} as unknown as VexConfig;

const editorAuth = { user: { _id: "u1", roles: "editor" } };
const viewerAuth = { user: { _id: "u2", roles: "viewer" } };

describe("find (server) — versioned collection status filtering", () => {
  /**
   * A public read must never surface a draft row, and the published row for a
   * document with an active draft must not appear twice — with or without
   * `access.bypass`, since the status constraint is data integrity, not RBAC.
   */
  test("a public read, including access: { bypass: true }, returns no draft rows and no duplicate logical documents", async () => {
    const t = convexTest(schema, modules);
    const { publishedId, unfiltered, bypassed } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const publishedId = await ctx.db.insert("posts", {
          title: "Hello",
          slug: "hello",
          vex_status: "published",
        });
        await ctx.db.insert("posts", {
          title: "Hello (draft edit)",
          slug: "hello",
          vex_status: "draft",
          vex_publishedId: publishedId,
        });

        return {
          publishedId,
          unfiltered: await find({
            ctx,
            collection: "posts",
            config: versionedConfig,
          }),
          bypassed: await find({
            ctx,
            collection: "posts",
            config: versionedConfig,
            access: { bypass: true },
          }),
        };
      },
    );

    expect(unfiltered).toHaveLength(1);
    expect((unfiltered[0] as any)._id).toBe(publishedId);
    expect(bypassed).toHaveLength(1);
    expect((bypassed[0] as any)._id).toBe(publishedId);
  });

  /**
   * `drafts: true` alone must not be sufficient — it only lifts the structural
   * status narrowing for a caller who may read drafts. A caller without
   * `readDrafts` falls back to the published-only read: no draft content, and
   * no empty result either, so one set of args serves every caller.
   *
   * Draft-pair pagination fix: a caller who CAN read drafts no longer gets
   * the draft as a second, separate row — `find` pages over canonical rows
   * and merges the linked draft back onto its published row per page
   * (`mergeDraftCounterparts`), so there is exactly one row per logical
   * document, carrying the draft's own `_id`/fields and
   * `hasUnpublishedChanges: true`.
   */
  test("drafts: true with readDrafts returns one merged row; without it, falls back to the published row only", async () => {
    const t = convexTest(schema, modules);
    const { publishedId, draftId, withPermission, withoutPermission } = await t.run(
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
          publishedId,
          draftId,
          withPermission: await find({
            ctx,
            collection: "posts",
            config: versionedConfigWithAccess,
            auth: editorAuth,
            drafts: true,
          }),
          withoutPermission: await find({
            ctx,
            collection: "posts",
            config: versionedConfigWithAccess,
            auth: viewerAuth,
            drafts: true,
          }),
        };
      },
    );

    expect(withPermission).toHaveLength(1);
    expect((withPermission[0] as any)._id).toBe(draftId);
    expect((withPermission[0] as any).title).toBe("Hello (draft edit)");
    expect((withPermission[0] as any).hasUnpublishedChanges).toBe(true);
    expect(withoutPermission.map((doc) => doc._id)).toEqual([publishedId]);
  });

  /**
   * Regression repro (Main's report): `mergeDraftCounterparts` re-reads the
   * linked DRAFT row directly from the DB, bypassing the caller's own
   * `readableDocuments` ms-conversion pass entirely — without threading
   * `fields` through to its own inner `readableDocuments` call, a resolved
   * `commitTs` bigint on the merged-in draft reached the client raw,
   * crashing `formatCommitTsFieldValue` ("Cannot convert a BigInt value to
   * a number"). `updatedAt` here is a literal resolved bigint (never a
   * placeholder — simulates what a real Convex backend stores post-commit,
   * per probe §5's "hand-built resolved-bigint fixtures" testing layer),
   * inserted directly on the DRAFT row, not the published one.
   */
  test("a merged draft counterpart's commitTs field is converted to ms, not left as a raw bigint", async () => {
    const t = convexTest(schema, modules);
    const resolvedNs = BigInt(1_700_000_000_000) * BigInt(1_000_000);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        vex_status: "published",
      });
      await ctx.db.insert("posts", {
        title: "Hello (draft edit)",
        slug: "hello",
        vex_status: "draft",
        vex_publishedId: publishedId,
        updatedAt: resolvedNs,
      });
      return find({
        ctx,
        collection: "posts",
        config: versionedConfigWithAccess,
        auth: editorAuth,
        drafts: true,
      });
    });
    expect(result).toHaveLength(1);
    const merged = result[0] as unknown as Record<string, unknown>;
    expect(merged.hasUnpublishedChanges).toBe(true);
    expect(typeof merged.updatedAt).toBe("number");
    expect(merged.updatedAt).toBe(1_700_000_000_000);
  });

  /**
   * A draft-only row — `vex_status: "draft"` with no `vex_publishedId`, the row
   * Option A's `create` produces for a collection whose `versions.defaultStatus`
   * is `"draft"` — has never been published and so has no published counterpart
   * at all. It must be excluded from a published-only read exactly like an
   * ordinary draft that DOES have a published parent, since the filter in
   * `composeStatusQueryConstraint` keys purely on `vex_status`, never on whether
   * `vex_publishedId` is set — this pins that down explicitly, since this exact
   * row shape did not exist when this test file was first written.
   */
  test("a draft-only row (never published, no vex_publishedId) is excluded by default and visible with drafts: true + readDrafts", async () => {
    const t = convexTest(schema, modules);
    const { draftOnlyId, withoutDrafts, withDraftsNoPermission, withDraftsAndPermission } =
      await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const draftOnlyId = await ctx.db.insert("posts", {
          title: "New page (unpublished)",
          slug: "never-published",
          vex_status: "draft",
        });

        return {
          draftOnlyId,
          withoutDrafts: await find({
            ctx,
            collection: "posts",
            config: versionedConfig,
          }),
          withDraftsNoPermission: await find({
            ctx,
            collection: "posts",
            config: versionedConfigWithAccess,
            auth: viewerAuth,
            drafts: true,
          }),
          withDraftsAndPermission: await find({
            ctx,
            collection: "posts",
            config: versionedConfigWithAccess,
            auth: editorAuth,
            drafts: true,
          }),
        };
      });

    expect(withoutDrafts).toHaveLength(0);
    expect(withDraftsNoPermission).toHaveLength(0);
    expect(withDraftsAndPermission).toHaveLength(1);
    expect((withDraftsAndPermission[0] as any)._id).toBe(draftOnlyId);
  });

  /**
   * When a caller supplies its own `withIndex` on an index with no `draftStatus`,
   * the status constraint must still apply — via `.filter()`, since the
   * `withIndex` slot is already taken and `by_slug` declares no `draftStatus`.
   */
  test("a caller-supplied withIndex still gets the status filter via .filter()", async () => {
    const t = convexTest(schema, modules);
    const { publishedId, result } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const publishedId = await ctx.db.insert("posts", {
          title: "Hello",
          slug: "hello",
          vex_status: "published",
        });
        await ctx.db.insert("posts", {
          title: "Hello (draft edit)",
          slug: "hello",
          vex_status: "draft",
          vex_publishedId: publishedId,
        });

        return {
          publishedId,
          result: await find({
            ctx,
            collection: "posts",
            config: versionedConfig,
            withIndex: {
              name: "by_slug",
              range: (q: any) => q.eq("slug", "hello"),
            },
          }),
        };
      },
    );

    expect(result).toHaveLength(1);
    expect((result[0] as any)._id).toBe(publishedId);
  });

  /**
   * A non-versioned collection must be completely unaffected by this mechanism,
   * even if a stray row happens to carry a `vex_status` field.
   */
  test("a non-versioned collection is unaffected", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("authors", {
        name: "Lena",
        vex_status: "draft",
      } as any);
      return find({ ctx, collection: "authors", config: versionedConfig });
    });

    expect(result).toHaveLength(1);
  });
});

describe("find (server) — per-index draftStatus composition", () => {
  const draftStatusPostsResource = defineCollection({
    slug: "posts",
    fields: {
      title: text(),
      slug: text(),
      body: text({ index: { name: "by_body", draftStatus: true } }),
      excerpt: text({ index: "by_excerpt" }),
    },
    versions: { drafts: true },
    indexes: [{ name: "by_title", fields: ["title"], draftStatus: "both" }],
  });

  const draftStatusConfig = {
    collections: [draftStatusPostsResource, versionedAuthorsResource],
  } as unknown as VexConfig;

  const draftStatusConfigWithAccess = {
    collections: [draftStatusPostsResource, versionedAuthorsResource],
    access: defineAccess({
      roles: ["editor", "viewer"] as const,
      resources: [draftStatusPostsResource],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: { posts: { readDrafts: true } },
        viewer: { posts: { read: true } },
      },
    }),
  } as unknown as VexConfig;

  /**
   * A published-only read against a `draftStatus: "both"` index composes the
   * status equality straight onto that index's own range — the range starts
   * with `vex_status`, so no `.filter()` runs, and the draft row with a
   * matching title is excluded despite sharing the index's narrowing field.
   */
  test('a published-only read on a draftStatus: "both" index excludes the draft row with no extra .filter() cost', async () => {
    const t = convexTest(schema, modules);
    const { publishedId, result } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const publishedId = await ctx.db.insert("posts", {
          title: "Hello",
          slug: "hello",
          vex_status: "published",
        });
        await ctx.db.insert("posts", {
          title: "Hello",
          slug: "hello-draft",
          vex_status: "draft",
        });
        return {
          publishedId,
          result: await find({
            ctx,
            collection: "posts",
            config: draftStatusConfig,
            withIndex: { name: "by_title", range: (q: any) => q.eq("title", "Hello") },
          }),
        };
      },
    );
    expect(result).toHaveLength(1);
    expect((result[0] as any)._id).toBe(publishedId);
  });

  /**
   * `drafts: true` against that SAME `"both"` index uses its unprefixed
   * physical form untouched — both rows come back.
   */
  test('drafts: true on the same "both" index returns both rows, untouched', async () => {
    const t = convexTest(schema, modules);
    const { result } = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Hello", slug: "hello", vex_status: "published" });
      await ctx.db.insert("posts", { title: "Hello", slug: "hello-draft", vex_status: "draft" });
      return {
        result: await find({
          ctx,
          collection: "posts",
          config: draftStatusConfigWithAccess,
          auth: editorAuth,
          drafts: true,
          withIndex: { name: "by_title", range: (q: any) => q.eq("title", "Hello") },
        }),
      };
    });
    expect(result).toHaveLength(2);
  });

  /**
   * `drafts: true` against a `draftStatus: true`-ONLY index (`by_body`, no
   * unprefixed physical form) drops the caller's range and falls the RBAC
   * constraint back to `.filter()`, warning once — the conservative,
   * correct behavior case 4 of `composeStatusQueryConstraint` chooses.
   */
  test("drafts: true on a draftStatus: true index drops the range and falls back to .filter(), with a dev warning", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const t = convexTest(schema, modules);
    const { result } = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        body: "match",
        vex_status: "published",
      });
      await ctx.db.insert("posts", {
        title: "Other",
        slug: "other",
        body: "match",
        vex_status: "draft",
      });
      return {
        result: await find({
          ctx,
          collection: "posts",
          config: draftStatusConfigWithAccess,
          auth: editorAuth,
          drafts: true,
          withIndex: { name: "by_body", range: (q: any) => q.eq("body", "match") },
        }),
      };
    });
    // The range is dropped (not replayed against the prefixed index), so
    // `by_body` with no range scans every row — both come back, since the
    // editor role's `readDrafts` grant here has no index-shaped constraint
    // of its own to fall back to.
    expect(result).toHaveLength(2);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  /**
   * A published-only read against an index with NO declared `draftStatus`
   * still filters correctly (unchanged original design) and warns once,
   * suggesting one.
   */
  test("a published-only read on an index with no draftStatus still filters, and warns once", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const t = convexTest(schema, modules);
    const { publishedId, result } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const publishedId = await ctx.db.insert("posts", {
          title: "Hello",
          slug: "hello",
          excerpt: "intro",
          vex_status: "published",
        });
        await ctx.db.insert("posts", {
          title: "Hello",
          slug: "hello",
          excerpt: "intro",
          vex_status: "draft",
          vex_publishedId: publishedId,
        });
        return {
          publishedId,
          result: await find({
            ctx,
            collection: "posts",
            config: draftStatusConfig,
            // `by_excerpt` is read published-only by no other test, so the warn-once
            // memory in `statusQueryConstraint.ts` has not consumed this pair yet.
            withIndex: { name: "by_excerpt", range: (q: any) => q.eq("excerpt", "intro") },
          }),
        };
      },
    );
    expect(result).toHaveLength(1);
    expect((result[0] as any)._id).toBe(publishedId);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

// ── List-view-overhaul Step 11: `vex_status` as a built-in filter field,
// and the isEmpty/isNotEmpty wire shape (a leaf missing `value` entirely —
// Convex's own argument serialization drops an explicit `value: undefined`
// property before the server ever sees it) ─────────────────────────────────
const emptyCheckPostsResource = defineCollection({
  slug: "posts",
  fields: { title: text(), body: text({ required: false }) },
});
const emptyCheckConfig = { collections: [emptyCheckPostsResource] } as unknown as VexConfig;

describe("find (server) — vex_status where filtering and the isEmpty/isNotEmpty wire shape", () => {
  test("a where on vex_status narrows a versioned collection to the matching status, merging its linked draft (Fix A)", async () => {
    const t = convexTest(schema, modules);
    const { draftId, docs } = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
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
        docs: await find({
          ctx,
          collection: "posts",
          config: versionedConfigWithAccess,
          auth: editorAuth,
          drafts: true,
          where: { field: "vex_status", op: "eq", value: "published" },
        }),
      };
    });
    // The where filter decides WHICH canonical document qualifies (the
    // published one) — exactly as before. `find` then still merges that
    // canonical row's linked draft back on (Fix A, same as an ordinary
    // field filter — see Test 5 of the draft-pair pagination fix suite),
    // so the returned row carries the draft's own `_id`/fields.
    expect(docs).toHaveLength(1);
    expect(docs[0]?._id).toBe(draftId);
    expect((docs[0] as any).hasUnpublishedChanges).toBe(true);
  });

  test("a where on vex_status still narrows correctly alongside the default _creationTime sort (Decision 36 pushdown has no declared index to push vex_status into, so it falls through to .filter() unchanged)", async () => {
    const t = convexTest(schema, modules);
    const { draftId, docs } = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
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
        docs: await find({
          ctx,
          collection: "posts",
          config: versionedConfigWithAccess,
          auth: editorAuth,
          drafts: true,
          where: { field: "vex_status", op: "eq", value: "published" },
          sort: { field: "_creationTime", order: "desc" },
        }),
      };
    });
    expect(docs).toHaveLength(1);
    expect(docs[0]?._id).toBe(draftId);
    expect((docs[0] as any).hasUnpublishedChanges).toBe(true);
  });

  test("a where on vex_status is rejected (INVALID_WHERE) for a non-versioned collection", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        find({
          ctx,
          collection: "authors",
          config: versionedConfig,
          where: { field: "vex_status", op: "eq", value: "published" },
        }),
      ),
    ).rejects.toThrow();
  });

  test("isEmpty/isNotEmpty reach the server as a leaf with no `value` key, and filter correctly", async () => {
    const t = convexTest(schema, modules);
    const { withBodyId, noBodyId, isEmptyDocs, isNotEmptyDocs } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const withBodyId = await ctx.db.insert("posts", { title: "A", slug: "a", body: "has body" });
        const noBodyId = await ctx.db.insert("posts", { title: "B", slug: "b" });
        return {
          withBodyId,
          noBodyId,
          // `{ field, op }` with no `value` key at all — the exact shape Convex's
          // own `convexToJson` produces for a stored `{ op: "eq", value: undefined }`
          // leaf (an `isEmpty` row); never `value: undefined` explicitly, since that
          // key would already have been dropped before this function ever runs. Cast
          // through `VexWhere<"posts">`: the real Convex RPC boundary receives this
          // exact shape as `unknown`, never through this compile-time literal check.
          isEmptyDocs: await find({
            ctx,
            collection: "posts",
            config: emptyCheckConfig,
            where: { field: "body", op: "eq" } as unknown as VexWhere<"posts">,
          }),
          isNotEmptyDocs: await find({
            ctx,
            collection: "posts",
            config: emptyCheckConfig,
            where: { field: "body", op: "neq" } as unknown as VexWhere<"posts">,
          }),
        };
      },
    );
    expect(isEmptyDocs.map((d) => d._id)).toEqual([noBodyId]);
    expect(isNotEmptyDocs.map((d) => d._id)).toEqual([withBodyId]);
  });
});

// ── Step 6: portable sort + index pushdown ──────────────────────────────────
const sortPushdownResource = defineCollection({
  slug: "posts",
  fields: {
    title: text({ index: "by_title" }),
    slug: text({ index: "by_slug" }),
    body: text(),
    featured: checkbox({ index: "by_featured" }),
  },
});
const sortPushdownConfig = { collections: [sortPushdownResource] } as unknown as VexConfig;

describe("find (server) — sort", () => {
  test("sort.field resolves to the index whose first field matches, ordering through it", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Zeta", slug: "z" });
      await ctx.db.insert("posts", { title: "Alpha", slug: "a" });
      await ctx.db.insert("posts", { title: "Mid", slug: "m" });
    });
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      find({ ctx, collection: "posts", config: sortPushdownConfig, sort: { field: "slug", order: "asc" } } as any),
    );
    expect(docs.map((d: any) => d.slug)).toEqual(["a", "m", "z"]);
  });

  test('sort.field: "_creationTime" needs no index — orders by insertion order', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "First", slug: "first" });
      await ctx.db.insert("posts", { title: "Second", slug: "second" });
    });
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      find({
        ctx,
        collection: "posts",
        config: sortPushdownConfig,
        sort: { field: "_creationTime", order: "desc" },
      } as any),
    );
    expect(docs.map((d: any) => d.slug)).toEqual(["second", "first"]);
  });

  test("an unindexed sort.field rejects with a VexError naming the field", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        find({ ctx, collection: "posts", config: sortPushdownConfig, sort: { field: "body", order: "asc" } } as any),
      ),
    ).rejects.toThrow(/(?=.*"code":"UNINDEXED_SORT")(?=.*"field":"body")/);
  });

  test("sort and withIndex together reject — clients send one or the other, never both", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        find({
          ctx,
          collection: "posts",
          config: sortPushdownConfig,
          sort: { field: "slug", order: "asc" },
          withIndex: { name: "by_slug" },
        } as any),
      ),
    ).rejects.toThrow(/"code":"SORT_WITH_INDEX"/);
  });

  test("an eq condition on the sorted field's own index is pushed into its range, dropping it from .filter()", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
      await ctx.db.insert("posts", { title: "C", slug: "c", featured: true });
      return find({
        ctx,
        collection: "posts",
        config: sortPushdownConfig,
        where: { field: "featured", op: "eq", value: true },
        sort: { field: "_creationTime", order: "asc" },
      } as any);
    });
    expect(docs.map((d: any) => d.slug)).toEqual(["a", "c"]);
  });
});

describe("find (server) — sort competes for the index slot like withIndex", () => {
  const sortVsAccessResource = defineCollection({
    slug: "posts",
    fields: { title: text({ index: "by_title" }), slug: text(), featured: checkbox({ index: "by_featured" }) },
  });
  const sortVsAccessConfig = {
    collections: [sortVsAccessResource],
    access: defineAccess({
      roles: ["contributor"] as const,
      resources: [sortVsAccessResource],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        contributor: {
          posts: { read: { withIndex: { name: "by_featured", range: (ix) => ix.eq("featured", true) } } },
        },
      },
    }),
  } as unknown as VexConfig;
  const pushdownContributorAuth = { user: { _id: "u1", roles: "contributor" } };

  test("sort names a DIFFERENT field than the access index: sort's resolved index wins the slot, access still filters", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "a", slug: "a", featured: false });
      await ctx.db.insert("posts", { title: "b", slug: "b", featured: true });
      await ctx.db.insert("posts", { title: "c", slug: "c", featured: true });
      return find({
        ctx,
        collection: "posts",
        config: sortVsAccessConfig,
        auth: pushdownContributorAuth,
        // Sorts by "title" rather than "slug" — the access rule's own
        // `by_featured` index is already exercised against a `by_slug`
        // displacement elsewhere in this file (the dev warning dedupes per
        // index-name pair for the life of the process), so this test picks
        // a different displacing index to independently prove the warning
        // fires for ITS pair too.
        sort: { field: "title", order: "asc" },
      } as any);
    });
    expect(docs.map((d: any) => d.slug)).toEqual(["b", "c"]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Access index "by_featured" cannot be applied'));
    warnSpy.mockRestore();
  });
});

// ── Step 6: declared config-view filter is exempt from the field-read check ─
const declaredFilterBaseResource = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text(), featured: checkbox() },
});
const declaredFilterResource = {
  ...declaredFilterBaseResource,
  admin: {
    ...declaredFilterBaseResource.admin,
    useAsTitle: "title",
    views: [{ viewId: "featured", name: "Featured", state: { where: { field: "featured", op: "eq", value: true } } }],
  },
} as unknown as typeof declaredFilterBaseResource;
const declaredFilterAccess = {
  collections: [declaredFilterResource],
  access: defineAccess({
    roles: ["viewer"] as const,
    resources: [declaredFilterResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      viewer: {
        posts: { read: () => ({ featured: false, "*": true }) },
      },
    },
  }),
} as unknown as VexConfig;
const declaredFilterViewerAuth = { user: { _id: "u1", roles: "viewer" } };
// No declared config view (unlike `declaredFilterAccess`) — isolates the
// shared-view-only exemption path from the config-view path the describe
// block above exercises, so "lacks readViews" genuinely has no OTHER route
// to trust.
const declaredFilterNoViewAccess = {
  collections: [declaredFilterBaseResource],
  access: defineAccess({
    roles: ["viewer"] as const,
    resources: [declaredFilterBaseResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      viewer: {
        posts: { read: () => ({ featured: false, "*": true }) },
      },
    },
  }),
} as unknown as VexConfig;

describe("find (server) — declared view filter is exempt from the field-read check", () => {
  test("a where that deep-equals the declared view's where is trusted even though featured is unreadable", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      await ctx.db.insert("posts", { title: "Hidden", slug: "hidden", featured: false });
      return find({
        ctx,
        collection: "posts",
        config: declaredFilterAccess,
        auth: declaredFilterViewerAuth,
        where: { field: "featured", op: "eq", value: true },
      } as any);
    });
    expect(docs.map((d: any) => d.slug)).toEqual(["shown"]);
  });

  test("the caller may narrow a declared view with their own readable-field condition", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      await ctx.db.insert("posts", { title: "Also featured", slug: "also-featured", featured: true });
      return find({
        ctx,
        collection: "posts",
        config: declaredFilterAccess,
        auth: declaredFilterViewerAuth,
        where: {
          and: [
            { field: "featured", op: "eq", value: true },
            { field: "slug", op: "eq", value: "shown" },
          ],
        },
      } as any);
    });
    expect(docs.map((d: any) => d.slug)).toEqual(["shown"]);
  });

  test("changing the declared filter's value is NOT exempt — the unreadable condition drops every row", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      return find({
        ctx,
        collection: "posts",
        config: declaredFilterAccess,
        auth: declaredFilterViewerAuth,
        where: { field: "featured", op: "eq", value: false },
      } as any);
    });
    expect(docs).toEqual([]);
  });
});

// ── Step 6 / Decision 26: shared-view filter exemption (readViews) ──────────
const sharedFilterAccessWithReadViews = {
  collections: [declaredFilterResource],
  access: defineAccess({
    roles: ["editor"] as const,
    resources: [declaredFilterResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      editor: {
        posts: { read: () => ({ featured: false, "*": true }), readViews: true },
      },
    },
  }),
} as unknown as VexConfig;
const sharedFilterEditorAuth = { user: { _id: "u2", roles: "editor" } };

describe("find (server) — shared-view filter exemption (readViews)", () => {
  test("does not read vex_views when nothing is unreadable", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      return find({
        ctx,
        collection: "posts",
        config: sharedFilterAccessWithReadViews,
        auth: sharedFilterEditorAuth,
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
      return find({
        ctx,
        collection: "posts",
        config: sharedFilterAccessWithReadViews,
        auth: sharedFilterEditorAuth,
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
      return find({
        ctx,
        collection: "posts",
        config: declaredFilterNoViewAccess,
        auth: declaredFilterViewerAuth,
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
      return find({
        ctx,
        collection: "posts",
        config: sharedFilterAccessWithReadViews,
        auth: sharedFilterEditorAuth,
        where: { field: "featured", op: "eq", value: false },
      } as any);
    });
    expect(docs).toEqual([]);
  });
});

// ── Access + system fields: declared-filter exemption covers `vex_status`
// (Published shared view, signed-out guest regression) ─────────────────────
const vexStatusFilterVersionedResource = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text() },
  versions: { drafts: true },
});
const vexStatusFilterGuestAccess = {
  collections: [vexStatusFilterVersionedResource],
  access: defineAccess({
    roles: ["guest"] as const,
    anonRole: "guest",
    resources: [vexStatusFilterVersionedResource],
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
const vexStatusFilterAnonymousAuth = { user: null };
const vexStatusFilterPublishedWhere = { field: "vex_status", op: "eq", value: "published" } as const;

describe("find (server) — declared-filter exemption covers vex_status (Published shared view, signed out)", () => {
  test("an anonymous caller who can't read vex_status still gets rows from a shared view filtering on it", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Pub", slug: "pub", vex_status: "published" });
      await ctx.db.insert("posts", { title: "Dft", slug: "dft", vex_status: "draft" });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "published",
        name: "Published",
        state: { where: vexStatusFilterPublishedWhere },
        createdBy: "someone-else",
      });
      return find({
        ctx,
        collection: "posts",
        config: vexStatusFilterGuestAccess,
        auth: vexStatusFilterAnonymousAuth,
        where: vexStatusFilterPublishedWhere,
      } as any);
    });
    expect(docs.map((d: any) => d.slug)).toEqual(["pub"]);
    // The exemption makes the FILTER work without ever making the FIELD
    // readable (Decision 11) — `vex_status` itself must not come back.
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
        state: { where: vexStatusFilterPublishedWhere },
        createdBy: "someone-else",
      });
      return find({
        ctx,
        collection: "posts",
        config: vexStatusFilterGuestAccess,
        auth: vexStatusFilterAnonymousAuth,
        // Same FIELD as the declared view, a DIFFERENT value — not a
        // deep-equal match, so the exemption does not apply.
        where: { field: "vex_status", op: "eq", value: "draft" },
      } as any);
    });
    expect(docs).toEqual([]);
  });

  test("the exemption still works alongside the draft-pair merge for a role with readDrafts but no vex_status read", async () => {
    const contributorAccess = {
      collections: [vexStatusFilterVersionedResource],
      access: defineAccess({
        roles: ["contributor"] as const,
        resources: [vexStatusFilterVersionedResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          contributor: {
            posts: {
              "*": false,
              read: () => ({ "*": false, title: true, slug: true }),
              readDrafts: true,
              readViews: true,
            },
          },
        },
      }),
    } as unknown as VexConfig;
    const contributorAuth = { user: { _id: "u3", roles: "contributor" } };
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", { title: "Pub", slug: "pub", vex_status: "published" });
      await ctx.db.insert("posts", {
        title: "Pub (draft edit)",
        slug: "pub",
        vex_status: "draft",
        vex_publishedId: publishedId,
      });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "published",
        name: "Published",
        state: { where: vexStatusFilterPublishedWhere },
        createdBy: "someone-else",
      });
      return find({
        ctx,
        collection: "posts",
        config: contributorAccess,
        auth: contributorAuth,
        drafts: true,
        where: vexStatusFilterPublishedWhere,
      } as any);
    });
    expect(docs).toHaveLength(1);
    expect(docs[0].title).toBe("Pub (draft edit)");
    expect(docs[0].hasUnpublishedChanges).toBe(true);
  });
});

// ── Step 6: total count cap ──────────────────────────────────────────────────
const countCapBaseResource = defineCollection({ slug: "posts", fields: { title: text() } });
const countCapResource = {
  ...countCapBaseResource,
  admin: {
    ...countCapBaseResource.admin,
    view: { ...countCapBaseResource.admin?.view, state: { ...countCapBaseResource.admin?.view?.state, countLimit: 3 } },
  },
} as unknown as typeof countCapBaseResource;
const countCapConfig = { collections: [countCapResource] } as unknown as VexConfig;

describe("find (server) — total count cap", () => {
  test("totalDocsCapped is true and totalDocs stops at countLimit once the real count exceeds it", async () => {
    const t = convexTest(schema, modules);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      for (let i = 0; i < 6; i++) {
        await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
      }
      return find({
        ctx,
        collection: "posts",
        config: countCapConfig,
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
      return find({
        ctx,
        collection: "posts",
        config: countCapConfig,
        paginationOpts: { numItems: 1, cursor: null, totalDocs: true },
      } as any);
    });
    expect(result.totalDocs).toBe(2);
    expect(result.totalDocsCapped).toBe(false);
  });

  test("the isDone fast path (no countQuery needed) also reports totalDocsCapped: false", async () => {
    const t = convexTest(schema, modules);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Only one", slug: "only-one" });
      return find({
        ctx,
        collection: "posts",
        config: countCapConfig,
        paginationOpts: { numItems: 10, cursor: null, totalDocs: true },
      } as any);
    });
    expect(result.totalDocs).toBe(1);
    expect(result.totalDocsCapped).toBe(false);
  });
});

// ── Draft-pair pagination fix: canonical-row merge (find) ───────────────────
describe("find (server) — draft-pair pagination fix (canonical-row merge)", () => {
  /**
   * Test 1 (findings §"test cases"): a pair must never be split across a
   * page, even at the smallest possible page size — proving the merge
   * doesn't depend on both raw rows co-residing in the same fetched page.
   * `numItems: 1` only has room for ONE canonical row; the linked draft is
   * never a canonical row (`canonicalRowFilter` excludes it), so it is
   * never competing for that one slot — the published row's merge lookup
   * (`mergeDraftCounterparts`) runs regardless of page size.
   */
  test("the first page, even with numItems: 1, already returns the merged pair (never split)", async () => {
    const t = convexTest(schema, modules);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
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
        page1: await find({
          ctx,
          collection: "posts",
          config: versionedConfigWithAccess,
          auth: editorAuth,
          drafts: true,
          paginationOpts: { numItems: 1, cursor: null },
        } as any),
      };
    });
    expect(result.page1.page).toHaveLength(1);
    expect(result.page1.page[0]._id).toBe(result.draftId);
    expect(result.page1.page[0].hasUnpublishedChanges).toBe(true);
    // Not asserting `isDone` here: Convex's `.filter()`-based pagination
    // can report `isDone: false` even with exactly one true match, since
    // it scanned (and filtered out) the excluded linked-draft row without
    // yet knowing whether a THIRD row exists beyond it — an artifact of
    // `.filter()` scans generally, unrelated to this fix. The merged
    // content/id on page 1 (asserted above) is what this test proves.
  });

  /**
   * Test 2: totals count logical documents, not raw rows — a merged pair
   * counts once, and an unrelated draft-only row (no `vex_publishedId`)
   * counts as its own extra logical document. `numItems: 1` forces the
   * separate count-query path (page 1 alone isn't `isDone`).
   */
  test("totalDocs counts canonical (logical) documents, not raw rows", async () => {
    const t = convexTest(schema, modules);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "A",
        slug: "a",
        vex_status: "published",
      });
      await ctx.db.insert("posts", {
        title: "A (draft edit)",
        slug: "a",
        vex_status: "draft",
        vex_publishedId: publishedId,
      });
      await ctx.db.insert("posts", { title: "B", slug: "b", vex_status: "published" });
      await ctx.db.insert("posts", { title: "C (unpublished)", slug: "c", vex_status: "draft" });
      return find({
        ctx,
        collection: "posts",
        config: versionedConfigWithAccess,
        auth: editorAuth,
        drafts: true,
        paginationOpts: { numItems: 1, cursor: null, totalDocs: true },
      } as any);
    });
    // 4 raw rows, 3 logical documents (A's pair merges to one).
    expect(result.totalDocs).toBe(3);
    expect(result.totalDocsCapped).toBe(false);
  });

  /**
   * Test 3: a rendered row never changes appearance once Load More fetches
   * a later page. Re-running page 1's own fetch, unchanged, after page 2
   * has been fetched must return an identical result — no shared
   * cross-page state for the merge to drift.
   */
  test("Load More never changes an already-rendered row's appearance", async () => {
    const t = convexTest(schema, modules);
    const { page1Again, page1First } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const publishedId = await ctx.db.insert("posts", {
          title: "A",
          slug: "a",
          vex_status: "published",
        });
        await ctx.db.insert("posts", {
          title: "A (draft edit)",
          slug: "a",
          vex_status: "draft",
          vex_publishedId: publishedId,
        });
        await ctx.db.insert("posts", { title: "B", slug: "b", vex_status: "published" });

        const args = {
          ctx,
          collection: "posts",
          config: versionedConfigWithAccess,
          auth: editorAuth,
          drafts: true,
          paginationOpts: { numItems: 1, cursor: null },
        } as any;
        const page1First: any = await find(args);
        const page2: any = await find({
          ...args,
          paginationOpts: { numItems: 10, cursor: page1First.continueCursor },
        });
        const page1Again: any = await find(args);
        return { page1First, page2, page1Again };
      },
    );
    expect((page1Again as any).page).toEqual((page1First as any).page);
    expect((page1Again as any).page[0].hasUnpublishedChanges).toBe(true);
  });

  /**
   * Test 5: sort order follows the CANONICAL (published) row's own field
   * value, while the displayed field still shows the draft's pending
   * value — the same divergence the former client-side
   * `collapseVersionedPairs` used to produce, now produced server-side by
   * `mergeDraftCounterparts` (`collapseVersionedPairs` itself is gone,
   * unused once this server-side merge replaced it) and pinned down
   * explicitly so a future change to it is deliberate, not an accident.
   */
  test("sort position follows the published value; the displayed field still shows the draft's", async () => {
    const t = convexTest(schema, modules);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Zeta",
        slug: "zeta",
        vex_status: "published",
      });
      await ctx.db.insert("posts", {
        title: "Alpha",
        slug: "zeta",
        vex_status: "draft",
        vex_publishedId: publishedId,
      });
      await ctx.db.insert("posts", { title: "Mango", slug: "mango", vex_status: "published" });
      return find({
        ctx,
        collection: "posts",
        config: versionedConfigWithAccess,
        auth: editorAuth,
        drafts: true,
        order: "asc",
        withIndex: { name: "by_title", range: (q: any) => q.gte("title", "") },
      } as any);
    });
    // Published values sort Mango ("M") before Zeta ("Z") — the pair's own
    // position follows "Zeta", not the draft's "Alpha" ("A", which would
    // sort first if the draft's value were used instead).
    expect(result.map((d: any) => d.title)).toEqual(["Mango", "Alpha"]);
    expect(result[1].hasUnpublishedChanges).toBe(true);
  });

  /**
   * Test 6: a caller without `readDrafts` never performs the draft
   * counterpart lookup — `wantsDrafts` is `false` for them, so
   * `mergeDraftCounterparts` is skipped entirely and the published row
   * carries no `hasUnpublishedChanges` property at all (never merged).
   */
  test("a caller without readDrafts never merges a draft counterpart in", async () => {
    const t = convexTest(schema, modules);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        vex_status: "published",
      });
      await ctx.db.insert("posts", {
        title: "Hello (draft edit)",
        slug: "hello",
        vex_status: "draft",
        vex_publishedId: publishedId,
      });
      return find({
        ctx,
        collection: "posts",
        config: versionedConfigWithAccess,
        auth: viewerAuth,
        drafts: true,
      });
    });
    expect(result).toHaveLength(1);
    expect((result[0] as any).hasUnpublishedChanges).toBeUndefined();
  });
});

// ── Polish fix: count cap must not under-report when rows are dropped at
// the raw window's edge by read access (not by the `where` the caller sent) ──
const undercountPostsResource = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text(), featured: checkbox() },
  admin: { view: { countLimit: 2 } },
});
const undercountConfig = {
  collections: [undercountPostsResource],
  access: defineAccess({
    roles: ["viewer"] as const,
    resources: [undercountPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      viewer: {
        posts: { read: ({ data }: { data?: { featured?: boolean } }) => data?.featured !== true },
      },
    },
  }),
} as unknown as VexConfig;
const undercountViewerAuth = { user: { _id: "u1", roles: "viewer" } };

describe("find (server) — total count cap, undercount regression", () => {
  test("totalDocsCapped reflects the RAW window, not the readable-filtered length, when a row inside it is dropped by access", async () => {
    const t = convexTest(schema, modules);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      // countLimit: 2 → the raw count window is take(3). Three matching
      // rows exist, one of which `viewer` can't read — the raw window is
      // FULL (3 rows, countLimit + 1) but the readable-filtered length is
      // only 2 (<= countLimit), which the old code mistook for an exact,
      // uncapped total instead of a floor.
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: false });
      await ctx.db.insert("posts", { title: "B", slug: "b", featured: true });
      await ctx.db.insert("posts", { title: "C", slug: "c", featured: false });
      return find({
        ctx,
        collection: "posts",
        config: undercountConfig,
        auth: undercountViewerAuth,
        paginationOpts: { numItems: 1, cursor: null, totalDocs: true },
      } as any);
    });
    expect(result.totalDocsCapped).toBe(true);
    expect(result.totalDocs).toBe(2);
  });
});

