import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import { defineAccess } from "../access/config";
import type { VexConfig } from "../config";
import { createVexCallbackApi } from "./server";
import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

function makeConfig(access?: VexConfig["access"]): VexConfig {
  return {
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
    globals: [],
    access,
  } as unknown as VexConfig;
}

describe("createVexCallbackApi", () => {
  test("populates relationships, which a raw ctx.db read cannot", async () => {
    const t = convexTest(schema, modules);
    const post = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const authorId = await ctx.db.insert("authors", { name: "Ada" });
      const postId = await ctx.db.insert("posts", {
        title: "Post",
        slug: "post",
        author: [authorId],
      });
      return createVexCallbackApi({ ctx: ctx as never, config: makeConfig() }).get({
        collection: "posts",
        id: postId as never,
        populate: { author: true },
      } as never);
    });
    expect(post).toMatchObject({ author: [{ name: "Ada" }] });
  });

  test("bypasses access by default, so a uniqueness probe cannot miss a hidden row", async () => {
    // The default matters for correctness, not convenience: a `validate()` that
    // silently skipped rows the editor cannot read would let a duplicate through.
    const access = defineAccess({
      roles: ["denied"] as const,
      resources: [{ slug: "posts" }] as never,
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: { denied: { posts: {} } } as never,
    });
    const t = convexTest(schema, modules);
    const found = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Hidden", slug: "hidden" });
      return createVexCallbackApi({
        ctx: ctx as never,
        config: makeConfig(access as never),
      }).find({ collection: "posts" } as never);
    });
    expect(found).toHaveLength(1);
  });

  test("applies the access rules when a caller opts in", async () => {
    const access = defineAccess({
      roles: ["denied"] as const,
      resources: [{ slug: "posts" }] as never,
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: { denied: { posts: {} } } as never,
    });
    const t = convexTest(schema, modules);
    const found = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Hidden", slug: "hidden" });
      return createVexCallbackApi({
        ctx: ctx as never,
        config: makeConfig(access as never),
      }).find({
        collection: "posts",
        auth: { user: { _id: "u1", roles: "denied" } },
        access: {},
      } as never);
    });
    expect(found).toHaveLength(0);
  });

  test("find() returns a page, not an array, when paginationOpts is supplied", async () => {
    const t = convexTest(schema, modules);
    const page = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "One", slug: "one" });
      await ctx.db.insert("posts", { title: "Two", slug: "two" });
      return createVexCallbackApi({ ctx: ctx as never, config: makeConfig() }).find({
        collection: "posts",
        paginationOpts: { cursor: null, numItems: 1 },
      } as never);
    });
    expect(page).toMatchObject({ isDone: false });
    expect((page as unknown as { page: unknown[] }).page).toHaveLength(1);
  });
});
