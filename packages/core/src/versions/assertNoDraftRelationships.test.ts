import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../api/test/convex/_generated/api";
import schema from "../api/test/convex/schema";
import { assertNoDraftRelationships } from "./assertNoDraftRelationships";
import { defineCollection, defineGlobal, relationship, text } from "../index";

const modules: Record<string, () => Promise<unknown>> = {
  "./api/test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

const postsWithRelationship = defineCollection({
  slug: "posts",
  fields: {
    title: text(),
    // `parent` is the shared fixture schema's self-referencing relationship column.
    parent: relationship({ collection: { slug: "posts" }, hasMany: true }),
  },
  versions: { drafts: true },
});

const bannerWithRelationship = defineGlobal({
  slug: "banner",
  label: "Banner",
  fields: {
    message: text(),
    featured: relationship({ collection: { slug: "posts" }, hasMany: true }),
  },
  versions: { drafts: true },
});

describe("assertNoDraftRelationships", () => {
  test("resolves when the collection has no relationship fields", async () => {
    const t = convexTest(schema, modules);
    const plainPosts = defineCollection({ slug: "posts", fields: { title: text() } });
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await expect(
        assertNoDraftRelationships({
          ctx,
          target: { kind: "collection", config: plainPosts },
          document: { title: "Hi" },
        }),
      ).resolves.toBeUndefined();
    });
  });

  test("resolves when every linked document is published", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const linkedId = await ctx.db.insert("posts", {
        title: "Linked",
        slug: "linked",
        vex_status: "published",
      });
      await expect(
        assertNoDraftRelationships({
          ctx,
          target: { kind: "collection", config: postsWithRelationship },
          document: { title: "A", parent: [linkedId] },
        }),
      ).resolves.toBeUndefined();
    });
  });

  test("rejects, naming the field, when a linked document is still a draft", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const draftId = await ctx.db.insert("posts", {
        title: "Linked",
        slug: "linked",
        vex_status: "draft",
      });
      let caught: unknown;
      try {
        await assertNoDraftRelationships({
          ctx,
          target: { kind: "collection", config: postsWithRelationship },
          document: { title: "A", parent: [draftId] },
        });
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(ConvexError);
      expect((caught as ConvexError<{ field: string }>).data.field).toBe("parent");
    });
  });

  test("applies the same check to a global target — the gap the rejected collection-only design left", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const draftId = await ctx.db.insert("posts", {
        title: "Linked",
        slug: "linked",
        vex_status: "draft",
      });
      let caught: unknown;
      try {
        await assertNoDraftRelationships({
          ctx,
          target: { kind: "global", config: bannerWithRelationship },
          document: { message: "Hi", featured: [draftId] },
        });
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(ConvexError);
      expect((caught as ConvexError<{ field: string }>).data.field).toBe("featured");
    });
  });
});
