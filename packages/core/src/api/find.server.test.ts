import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import type { DocumentBySlug } from "../types/generated";
import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import { find } from "./find.server";

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
        await ctx.db.insert("posts", { title: "Published", slug: "pub", featured: true });
        await ctx.db.insert("posts", { title: "Draft", slug: "draft", featured: false });
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
          await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}`, featured: true });
        }
        await ctx.db.insert("posts", { title: "Hidden", slug: "hidden", featured: false });
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
        await ctx.db.insert("posts", { title: "Featured", slug: "f", featured: true });
        await ctx.db.insert("posts", { title: "Not Featured", slug: "nf", featured: false });
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
        await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
        return find({ ctx, collection: "posts", withIndex: { name: "by_featured" } });
      },
    );
    expect(docs).toHaveLength(2);
  });

  test("withIndex + order + limit all compose", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await ctx.db.insert("posts", { title: "A", slug: "a", featured: false });
        await ctx.db.insert("posts", { title: "B", slug: "b", featured: true });
        await ctx.db.insert("posts", { title: "C", slug: "c", featured: true });
        return find({
          ctx,
          collection: "posts",
          withIndex: { name: "by_featured", range: (q: any) => q.eq("featured", true) },
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
        await ctx.db.insert("posts", { title: "Short", slug: "s", featured: true });
        await ctx.db.insert("posts", { title: "Longer title", slug: "l", featured: true });
        await ctx.db.insert("posts", { title: "Draft", slug: "d", featured: false });
        return find({
          ctx,
          collection: "posts",
          withIndex: { name: "by_featured", range: (q: any) => q.eq("featured", true) },
          // secondary filter on top of the index range
          filter: (q: any) => q.gt(q.field("title").length ?? q.field("title"), "S"),
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
        await ctx.db.insert("posts", { title: "Draft", slug: "draft", featured: false });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return find({
          ctx,
          collection: "posts",
          filter: (q: any) => q.eq(q.field("featured"), true),
          limit: 2,
          populate: { author: true },
        } as any) as Promise<{ author: unknown; featured: unknown; [k: string]: unknown }[]>;
      },
    );
    expect(docs).toHaveLength(2);
    expect(docs.every((d) => d.featured)).toBe(true);
    expect((docs[0].author as DocumentBySlug["authors"][])[0].name).toBe("Lena");
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
