import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../../../db/test/convex/_generated/api";
import schema from "../../../db/test/convex/schema";
import type { VexConfig } from "../../../config";
import { listViews } from "./server";
import { defineAccess } from "../../../access/config";
import { defineCollection, text } from "../../../index";

const postsResource = defineCollection({
  slug: "posts",
  fields: { title: text() },
});

const fixtureConfig = { collections: [postsResource] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("listViews (server)", () => {
  test("returns an empty array when no views exist for the collection", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await listViews({ ctx, config: fixtureConfig, collection: "posts" });
      expect(result).toEqual([]);
    });
  });

  test("returns every row for the collection, excluding rows for other collections", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtxLike) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "v1",
        name: "Featured",
        description: "Testimonials marked featured",
        state: { search: "featured" },
        createdBy: "user1",
      });
      await ctx.db.insert("vex_views", {
        collection: "authors",
        viewId: "v2",
        name: "Authors view",
        state: {},
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await listViews({ ctx, config: fixtureConfig, collection: "posts" });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        viewId: "v1",
        name: "Featured",
        description: "Testimonials marked featured",
        collection: "posts",
      });
    });
  });

  test("scopes to the caller's organization when access.organizations is true", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        orgCollectionSlug: "organizations",
        organizations: true,
        permissions: { editor: { posts: { readViews: true } } },
      }),
    } as unknown as VexConfig;

    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtxLike) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "org1-view",
        name: "Org 1",
        state: {},
        organizationId: "org1",
        createdBy: "user1",
      });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "org2-view",
        name: "Org 2",
        state: {},
        organizationId: "org2",
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await listViews({
        ctx,
        config,
        collection: "posts",
        auth: { user: { roles: ["editor"] }, organization: { _id: "org1" } },
      });
      expect(result).toEqual([expect.objectContaining({ viewId: "org1-view", organizationId: "org1" })]);
    });
  });

  test("returns [] (not the unscoped set) when access.organizations is true but the caller's org doesn't resolve", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        orgCollectionSlug: "organizations",
        organizations: true,
        permissions: { editor: { posts: { readViews: true } } },
      }),
    } as unknown as VexConfig;

    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtxLike) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "org1-view",
        name: "Org 1",
        state: {},
        organizationId: "org1",
        createdBy: "user1",
      });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "orgless-view",
        name: "Org-less",
        state: {},
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await listViews({
        ctx,
        config,
        collection: "posts",
        auth: { user: { roles: ["editor"] }, organization: undefined },
      });
      expect(result).toEqual([]);
    });
  });

  test("excludes an org-less row under scoping, even for a caller whose own org resolves", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        orgCollectionSlug: "organizations",
        organizations: true,
        permissions: { editor: { posts: { readViews: true } } },
      }),
    } as unknown as VexConfig;

    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtxLike) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "org1-view",
        name: "Org 1",
        state: {},
        organizationId: "org1",
        createdBy: "user1",
      });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "orgless-view",
        name: "Org-less",
        state: {},
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await listViews({
        ctx,
        config,
        collection: "posts",
        auth: { user: { roles: ["editor"] }, organization: { _id: "org1" } },
      });
      expect(result).toEqual([expect.objectContaining({ viewId: "org1-view" })]);
    });
  });

  test("returns every row regardless of organization when access.orgCollectionSlug is not configured", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtxLike) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "org1-view",
        name: "Org 1",
        state: {},
        organizationId: "org1",
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await listViews({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        auth: { user: { roles: [] }, organization: { _id: "org2" } },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ viewId: "org1-view" });
    });
  });

  test("returns every row, including org-less and cross-org rows, when orgCollectionSlug is configured but organizations is NOT set (the apps/test regression)", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        orgCollectionSlug: "organizations",
        // `organizations` deliberately omitted — defaults to `false`.
        permissions: { editor: { posts: { readViews: true } } },
      }),
    } as unknown as VexConfig;

    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtxLike) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "org1-view",
        name: "Org 1",
        state: {},
        organizationId: "org1",
        createdBy: "user1",
      });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "orgless-view",
        name: "Org-less",
        state: {},
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await listViews({
        ctx,
        config,
        collection: "posts",
        // A caller in a DIFFERENT org than "org1" — would be denied under real scoping.
        auth: { user: { roles: ["editor"] }, organization: { _id: "org2" } },
      });
      expect(result.map((v) => v.viewId).sort()).toEqual(["org1-view", "orgless-view"]);
    });
  });

  test("denies the list when the caller lacks readViews, returning [] rather than throwing", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { editor: { posts: { readViews: false } } },
      }),
    } as unknown as VexConfig;

    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtxLike) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "v1",
        name: "Featured",
        state: {},
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await listViews({
        ctx,
        config,
        collection: "posts",
        auth: { user: { roles: ["editor"] } },
      });
      expect(result).toEqual([]);
    });
  });

  test("allows the list when the caller has readViews", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { editor: { posts: { readViews: true } } },
      }),
    } as unknown as VexConfig;

    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtxLike) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "v1",
        name: "Featured",
        state: {},
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await listViews({
        ctx,
        config,
        collection: "posts",
        auth: { user: { roles: ["editor"] } },
      });
      expect(result).toHaveLength(1);
    });
  });
});

describe("listViews (server) — bad state rows skipped (Decision 2)", () => {
  test("skips a row whose state is null, returning the valid rows only", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtxLike) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "bad1",
        name: "Bad row",
        state: null,
        createdBy: "user1",
      } as never);
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "good1",
        name: "Good row",
        state: {},
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await listViews({ ctx, config: fixtureConfig, collection: "posts" });
      expect(result).toEqual([expect.objectContaining({ viewId: "good1" })]);
    });
  });

  test("skips a row whose state is an array", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtxLike) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "bad1",
        name: "Bad row",
        state: [],
        createdBy: "user1",
      } as never);
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await listViews({ ctx, config: fixtureConfig, collection: "posts" });
      expect(result).toEqual([]);
    });
  });
});

/** Convenience alias: `t.run`'s ctx is a mutation ctx, used here only to seed fixture rows. */
type GenericMutationCtxLike = GenericMutationCtx<GenericDataModel>;
