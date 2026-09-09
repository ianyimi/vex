import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import { publishedSlugs } from "./server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

// These calls pass no `access` option on purpose. `publishedSlugs`' own JSDoc tells a real
// sitemap caller to pass `{ bypass: true }`, but that is for a caller who HAS a resolved
// config with an access matrix to bypass. No `config` is threaded here, so RBAC is already
// off and `bypass` would change nothing — `resolveAccessCall` says exactly that on stderr
// ("the flag changed nothing. Either drop it..."). Slug shaping, not RBAC, is what these
// tests cover; the bypass path is exercised where a config actually exists.
describe("publishedSlugs (server)", () => {
  test("returns slug and _creationTime for every document with a string slug", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { slug: "first", title: "First" });
      await ctx.db.insert("posts", { slug: "second", title: "Second" });

      const result = await publishedSlugs({
        collection: "posts",
        ctx,
      });

      expect(result).toHaveLength(2);
      expect(result.map((entry) => entry.slug).sort()).toEqual(["first", "second"]);
      for (const entry of result) {
        expect(typeof entry.createdAt).toBe("number");
      }
    });
  });

  // `posts.slug` is `v.string()` (required) in the fixture schema, so a
  // slug-less row cannot be inserted there at all. `authors.slug` is
  // `v.optional(v.string())`, which is the shape this branch exists to handle.
  test("skips documents with no string slug field", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("authors", { name: "No slug" });
      await ctx.db.insert("authors", { name: "Has slug", slug: "has-slug" });

      const result = await publishedSlugs({
        collection: "authors",
        ctx,
      });

      expect(result).toEqual([
        { createdAt: expect.any(Number), slug: "has-slug", updatedAt: undefined },
      ]);
    });
  });

  test("leaves updatedAt undefined when the document carries no such field", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { slug: "only", title: "Only" });

      const result = await publishedSlugs({
        collection: "posts",
        ctx,
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.updatedAt).toBeUndefined();
    });
  });

  test("respects limit", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { slug: "a", title: "A" });
      await ctx.db.insert("posts", { slug: "b", title: "B" });

      const result = await publishedSlugs({
        collection: "posts",
        ctx,
        limit: 1,
      });

      expect(result).toHaveLength(1);
    });
  });
});
