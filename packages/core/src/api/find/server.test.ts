import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import type { VexConfig } from "../../config";
import type { DocumentBySlug } from "../../types/generated";
import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import { find } from "./server";

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
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) =>
        find({ ctx, collection: "posts" }),
    );
    expect(docs).toEqual([]);
  });

  test("returns documents in insertion order", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await ctx.db.insert("posts", { title: "First", slug: "first" });
        await ctx.db.insert("posts", { title: "Second", slug: "second" });
        return find({ ctx, collection: "posts" });
      },
    );
    expect(docs.map((d) => d.title)).toEqual(["First", "Second"]);
  });

  test("limit caps the result count", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        for (let i = 0; i < 5; i++) {
          await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
        }
        return find({ ctx, collection: "posts", limit: 3 });
      },
    );
    expect(docs).toHaveLength(3);
  });

  test("populate replaces Id arrays with target docs", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const authorId = await ctx.db.insert("authors", { name: "Lena" });
        await ctx.db.insert("posts", {
          title: "Hi",
          slug: "hi",
          author: [authorId],
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return find({
          ctx,
          collection: "posts",
          populate: { author: true },
        } as any) as Promise<{ author: unknown; [k: string]: unknown }[]>;
      },
    );
    expect((docs[0].author as DocumentBySlug["authors"][])[0].name).toBe(
      "Lena",
    );
  });

  test("order: desc reverses insertion order", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await ctx.db.insert("posts", { title: "First", slug: "first" });
        await ctx.db.insert("posts", { title: "Second", slug: "second" });
        return find({ ctx, collection: "posts", order: "desc" });
      },
    );
    expect(docs.map((d) => d.title)).toEqual(["Second", "First"]);
  });

  test("filter narrows results by field value", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          filter: (q: any) => q.eq(q.field("featured"), true),
        });
      },
    );
    expect(docs).toHaveLength(1);
    expect(docs[0].title).toBe("Published");
  });

  test("filter with limit applies both constraints", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          filter: (q: any) => q.eq(q.field("featured"), true),
          limit: 2,
        });
      },
    );
    expect(docs).toHaveLength(2);
    expect(docs.every((d) => d.featured)).toBe(true);
  });

  test("withIndex uses index for query", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            range: (q: any) => q.eq("featured", true),
          },
        });
      },
    );
    expect(docs).toHaveLength(1);
    expect(docs[0].title).toBe("Featured");
  });

  test("withIndex without range returns all docs via index order", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
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
      },
    );
    expect(docs).toHaveLength(2);
  });

  test("withIndex + order + limit all compose", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
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
      },
    );
    // Only featured docs, capped at 1
    expect(docs).toHaveLength(1);
    expect(docs[0].featured).toBe(true);
  });

  test("withIndex + filter compose (index narrows, filter refines)", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
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
          filter: (q: any) =>
            q.gt(q.field("title").length ?? q.field("title"), "S"),
        });
      },
    );
    // featured docs only (index), further narrowed by filter
    expect(docs.every((d) => d.featured)).toBe(true);
  });

  test("filter + limit + populate all compose", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return find({
          ctx,
          collection: "posts",
          filter: (q: any) => q.eq(q.field("featured"), true),
          limit: 2,
          populate: { author: true },
        } as any) as Promise<
          { author: unknown; featured: unknown; [k: string]: unknown }[]
        >;
      },
    );
    expect(docs).toHaveLength(2);
    expect(docs.every((d) => d.featured)).toBe(true);
    expect((docs[0].author as DocumentBySlug["authors"][])[0].name).toBe(
      "Lena",
    );
  });

  test("order: desc without index reverses insertion order", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await ctx.db.insert("posts", { title: "First", slug: "first" });
        await ctx.db.insert("posts", { title: "Second", slug: "second" });
        return find({ ctx, collection: "posts", order: "desc" });
      },
    );
    expect(docs.map((d) => d.title)).toEqual(["Second", "First"]);
  });

  test("no args returns all docs up to default limit", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        for (let i = 0; i < 5; i++) {
          await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
        }
        return find({ ctx, collection: "posts" });
      },
    );
    expect(docs).toHaveLength(5);
  });

  test("nested populate works at depth 2", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return find({
          ctx,
          collection: "posts",
          populate: { author: { populate: { organization: true } } },
        } as any) as Promise<{ author: unknown; [k: string]: unknown }[]>;
      },
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyDocs = docs as any[];
    const author = (anyDocs[0].author as DocumentBySlug["authors"][])[0];
    expect(
      (author.organization as unknown as DocumentBySlug["organizations"][])[0]
        .name,
    ).toBe("Vex Inc");
  });
});

describe("find (server) — depth auto-populate", () => {
  test("depth: 1 auto-populates all direct relationship fields", async () => {
    const t = convexTest(schema, modules);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const authorId = await ctx.db.insert("authors", { name: "Lena" });
        await ctx.db.insert("posts", {
          title: "Hi",
          slug: "hi",
          author: [authorId],
        });
        return find({ ctx, collection: "posts", depth: 1, config: fixtureConfig } as any);
      },
    ) as any[];
    // `author` should be populated with the author doc, not a raw ID array.
    const author = (docs[0].author as DocumentBySlug["authors"][])[0];
    expect(author.name).toBe("Lena");
    expect(typeof author._id).toBe("string");
  });

  test("depth: 1 returns raw docs when no relationship fields are stored", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        // Post without author — relationship field absent.
        await ctx.db.insert("posts", { title: "Solo", slug: "solo" });
        return find({ ctx, collection: "posts", depth: 1, config: fixtureConfig } as any);
      },
    ) as any[];
    expect(docs).toHaveLength(1);
    expect(docs[0].title).toBe("Solo");
    // author field is absent — no crash, no null.
    expect(docs[0].author).toBeUndefined();
  });

  test("depth: 2 populates nested relationships (posts → authors → organizations)", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
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
      },
    ) as any[];
    const author = (docs[0].author as DocumentBySlug["authors"][])[0];
    expect(author.name).toBe("Lena");
    const org = (author.organization as unknown as DocumentBySlug["organizations"][])[0];
    expect(org.name).toBe("Vex Inc");
  });

  test("depth: 0 (explicit) returns raw docs without population", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const authorId = await ctx.db.insert("authors", { name: "Lena" });
        await ctx.db.insert("posts", {
          title: "Hi",
          slug: "hi",
          author: [authorId],
        });
        // depth: 0 is the default — equivalent to omitting depth.
        return find({ ctx, collection: "posts", depth: 0, config: fixtureConfig } as any);
      },
    ) as any[];
    // author should still be a raw ID array, not populated docs.
    expect(Array.isArray(docs[0].author)).toBe(true);
    expect(typeof docs[0].author[0]).toBe("string");
  });

  test("depth without config returns raw docs (effectivePopulate is undefined)", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const authorId = await ctx.db.insert("authors", { name: "Lena" });
        await ctx.db.insert("posts", {
          title: "Hi",
          slug: "hi",
          author: [authorId],
        });
        // Passing depth without config — D11 guard: no populate applied.
        return find({ ctx, collection: "posts", depth: 1 } as any);
      },
    ) as any[];
    // Without config, buildDepthPopulate cannot run → raw ID array.
    expect(typeof docs[0].author[0]).toBe("string");
  });

  test("populate wins over depth at runtime (D11)", async () => {
    const t = convexTest(schema, modules);
    // At the type level populate+depth is a compile error; at runtime we
    // force both via `as any` to verify D11: populate takes precedence.
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
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
      },
    ) as any[];
    // Regardless of depth, the explicit populate should have resolved author.
    const author = (docs[0].author as DocumentBySlug["authors"][])[0];
    expect(author.name).toBe("Lena");
  });

  test("depth: 1 handles multiple docs with mixed relationship presence", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
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
      },
    ) as any[];
    expect(docs).toHaveLength(2);
    // First doc has populated author.
    const author = (docs[0].author as DocumentBySlug["authors"][])[0];
    expect(author.name).toBe("Lena");
    // Second doc has no author — no crash.
    expect(docs[1].author).toBeUndefined();
  });
});
