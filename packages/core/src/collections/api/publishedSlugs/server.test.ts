import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../../../db/test/convex/_generated/api";
import schema from "../../../db/test/convex/schema";
import type { VexConfig } from "../../../config";
import { defineCollection, text } from "../../../index";
import { publishedSlugs } from "./server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

// `config` carries no `access` matrix, so RBAC stays off (`resolveAccessCall`'s
// documented posture) the same way an unthreaded config used to — slug shaping,
// not RBAC, is what these tests cover; the bypass path is exercised where a
// config with a real access matrix exists.
const fixtureConfig = {
  collections: [
    defineCollection({ slug: "posts", fields: { title: text(), slug: text() } }),
    defineCollection({ slug: "authors", fields: { name: text(), slug: text() } }),
  ],
} as unknown as VexConfig;

describe("publishedSlugs (server)", () => {
  test("returns slug and _creationTime for every document with a string slug", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { slug: "first", title: "First" });
      await ctx.db.insert("posts", { slug: "second", title: "Second" });

      const result = await publishedSlugs({
        collection: "posts",
        config: fixtureConfig,
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
        config: fixtureConfig,
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
        config: fixtureConfig,
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
        config: fixtureConfig,
        ctx,
        limit: 1,
      });

      expect(result).toHaveLength(1);
    });
  });


  // A sitemap must never list a draft-only document: its URL 404s for anonymous
  // visitors and leaks an unpublished slug. The draft filter needs the
  // collection's `versions.drafts`, so it only applies when `config` is threaded.
  test("omits draft-only documents when the collection has drafts enabled", async () => {
    const config = {
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text(), slug: text() },
          versions: { drafts: true },
        }),
      ],
    } as unknown as VexConfig;
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { slug: "live", title: "Live", vex_status: "published" });
      await ctx.db.insert("posts", { slug: "unreleased", title: "Unreleased", vex_status: "draft" });

      const result = await publishedSlugs({ collection: "posts", config, ctx });

      expect(result.map((entry) => entry.slug)).toEqual(["live"]);
    });
  });
});
