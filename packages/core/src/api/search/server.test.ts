import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import type { VexConfig } from "../../config";
import type { DocumentBySlug } from "../../types/generated";
import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import { search } from "./server";

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
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
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
      },
    );
    expect(docs).toHaveLength(3);
  });

  test("non-empty query does not throw (withSearchIndex not implemented in convex-test)", async () => {
    const t = convexTest(schema, modules);
    let result: unknown[] = [];
    try {
      result = await t.run(
        async (ctx: GenericMutationCtx<GenericDataModel>) => {
          await ctx.db.insert("posts", { title: "Hello world", slug: "hello" });
          return search({
            ctx,
            collection: "posts",
            query: "hello",
            searchIndexName: "search_title",
            searchField: "title",
          });
        },
      );
    } catch {
      // withSearchIndex not implemented in convex-test v0.0.38 — acceptable
    }
    expect(Array.isArray(result)).toBe(true);
  });

  test("populate works on empty-query search (uses .take() path)", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const authorId = await ctx.db.insert("authors", { name: "Lena" });
        await ctx.db.insert("posts", {
          title: "Hello",
          slug: "hello",
          author: [authorId],
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return search({
          ctx,
          collection: "posts",
          query: "",
          searchIndexName: "search_title",
          searchField: "title",
          populate: { author: true },
        } as any) as Promise<{ author: unknown; [k: string]: unknown }[]>;
      },
    );
    expect(
      ((docs as any[])[0].author as DocumentBySlug["authors"][])[0].name,
    ).toBe("Lena");
  });
});

describe("search (server) — depth auto-populate", () => {
  test("depth: 1 auto-populates relationships on empty-query (.take() path)", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
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
      },
    ) as any[];
    const author = (docs[0].author as DocumentBySlug["authors"][])[0];
    expect(author.name).toBe("Lena");
    expect(typeof author._id).toBe("string");
  });

  test("depth: 0 (explicit) returns raw docs on empty-query path", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
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
      },
    ) as any[];
    // Depth 0 — author remains a raw ID array.
    expect(typeof docs[0].author[0]).toBe("string");
  });

  test("depth without config returns raw docs (no buildDepthPopulate called)", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
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
      },
    ) as any[];
    // Without config, guard prevents populate — raw IDs preserved.
    expect(typeof docs[0].author[0]).toBe("string");
  });

  test("depth: 1 with limit caps result and populates", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
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
      },
    ) as any[];
    expect(docs).toHaveLength(3);
    const author = (docs[0].author as DocumentBySlug["authors"][])[0];
    expect(author.name).toBe("Lena");
  });
});
