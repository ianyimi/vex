import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import schema from "./test/convex/schema";
import { populateDocs } from "./populate";
import type { PopulateShape } from "./types";
import type { DocumentBySlug } from "../types/generated";

import * as _generatedApi from "./test/convex/_generated/api";

/** Explicit modules map for convex-test (replaces import.meta.glob which requires Vite). */
const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};


describe("populateDocs", () => {
  test("returns docs unchanged when populate is empty", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const id = await ctx.db.insert("posts", { title: "Hi", slug: "hi" });
      const post = await ctx.db.get(id);
      return populateDocs(ctx, [post!], {});
    });
    expect(result[0]).toMatchObject({ title: "Hi", slug: "hi" });
  });

  test("populates a single relationship field", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena Park" });
      const postId = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        author: [authorId],
      });
      const post = await ctx.db.get(postId);
      return populateDocs(ctx, [post!], { author: true } as PopulateShape);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const populated = (result as any[])[0].author as DocumentBySlug["authors"][];
    expect(populated[0].name).toBe("Lena Park");
  });

  test("recurses into nested populate (2 levels)", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const orgId = await ctx.db.insert("organizations", { name: "Vex Inc" });
      const authorId = await ctx.db.insert("authors", {
        name: "Lena",
        organization: [orgId],
      });
      const postId = await ctx.db.insert("posts", {
        title: "Hi",
        slug: "hi",
        author: [authorId],
      });
      const post = await ctx.db.get(postId);
      return populateDocs(ctx, [post!], {
        author: { populate: { organization: true } },
      } as PopulateShape);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const author = ((result as any[])[0].author as DocumentBySlug["authors"][])[0];
    expect((author.organization as unknown as DocumentBySlug["organizations"][])[0].name).toBe("Vex Inc");
  });

  test("recurses 5 levels deep using self-referencing parent (D12)", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      // Build a chain: l5 -> l4 -> l3 -> l2 -> l1 -> start
      const l5 = await ctx.db.insert("posts", { title: "L5", slug: "l5" });
      const l4 = await ctx.db.insert("posts", {
        title: "L4",
        slug: "l4",
        parent: [l5],
      });
      const l3 = await ctx.db.insert("posts", {
        title: "L3",
        slug: "l3",
        parent: [l4],
      });
      const l2 = await ctx.db.insert("posts", {
        title: "L2",
        slug: "l2",
        parent: [l3],
      });
      const l1 = await ctx.db.insert("posts", {
        title: "L1",
        slug: "l1",
        parent: [l2],
      });
      const startId = await ctx.db.insert("posts", {
        title: "Start",
        slug: "start",
        parent: [l1],
      });
      const start = await ctx.db.get(startId);
      return populateDocs(ctx, [start!], {
        parent: {
          populate: {
            parent: { populate: { parent: { populate: { parent: true } } } },
          },
        },
      } as PopulateShape);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cursor: any = result[0];
    for (let i = 1; i <= 4; i++) {
      cursor = cursor.parent[0];
      expect(cursor.title).toBe(`L${i}`);
    }
  });

  test("skips fields that are missing or not arrays", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      // post with no author field set
      const postId = await ctx.db.insert("posts", {
        title: "Solo",
        slug: "solo",
      });
      const post = await ctx.db.get(postId);
      return populateDocs(ctx, [post!], { author: true } as PopulateShape);
    });
    expect(result[0]).toMatchObject({ title: "Solo", slug: "solo" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any[])[0].author).toBeUndefined();
  });

  test("filters out missing target docs (deleted ids)", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena" });
      const postId = await ctx.db.insert("posts", {
        title: "Hi",
        slug: "hi",
        author: [authorId],
      });
      // Delete the author after referencing it
      await ctx.db.delete(authorId);
      const post = await ctx.db.get(postId);
      return populateDocs(ctx, [post!], { author: true } as PopulateShape);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(((result as any[])[0].author as DocumentBySlug["authors"][]).length).toBe(0);
  });
});
