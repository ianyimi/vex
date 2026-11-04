import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";

import * as _generatedApi from "../../db/test/convex/_generated/api";
import schema from "../../db/test/convex/schema";
import type { VexConfig } from "../../config";
import { defineAccess } from "../../access/config";
import { defineCollection, text } from "../../index";

import type { CollectionConfig } from "../types";
import { matchDeclaredSavedListViewFilter, loadSharedSavedListViewWheres } from "./matchDeclaredSavedListViewFilter";

function collectionWithViews(views: { viewId: string; name: string; where?: unknown }[]): CollectionConfig {
  return {
    slug: "posts",
    admin: { views: views.map(({ viewId, name, where }) => ({ viewId, name, state: { where } })) },
  } as unknown as CollectionConfig;
}

const featuredWhere = { field: "featured", op: "eq", value: true } as const;
const regionWhere = { field: "region", op: "eq", value: "us" } as const;
const multiConditionWhere = { and: [featuredWhere, regionWhere] } as const;

describe("matchDeclaredSavedListViewFilter — no where / no declared views", () => {
  it("returns an empty result when where is omitted", () => {
    expect(matchDeclaredSavedListViewFilter({ collection: collectionWithViews([]) })).toEqual({ remainder: undefined });
  });

  it("is permissive with no collection", () => {
    expect(matchDeclaredSavedListViewFilter({ where: featuredWhere })).toEqual({ remainder: featuredWhere });
  });

  it("is permissive when the collection declares no views", () => {
    expect(matchDeclaredSavedListViewFilter({ collection: collectionWithViews([]), where: featuredWhere })).toEqual({
      remainder: featuredWhere,
    });
  });
});

describe("matchDeclaredSavedListViewFilter — exact match", () => {
  const collection = collectionWithViews([{ viewId: "featured", name: "Featured", where: featuredWhere }]);

  it("a where that IS the declared filter, verbatim, is fully trusted", () => {
    expect(matchDeclaredSavedListViewFilter({ collection, where: featuredWhere })).toEqual({
      declared: featuredWhere,
      remainder: undefined,
    });
  });
});

describe("matchDeclaredSavedListViewFilter — narrowing with a readable condition", () => {
  const collection = collectionWithViews([{ viewId: "featured", name: "Featured", where: featuredWhere }]);

  it("splits the declared part from the user's own added condition", () => {
    const addedCondition = { field: "source", op: "eq", value: "g2" } as const;
    expect(matchDeclaredSavedListViewFilter({ collection, where: { and: [featuredWhere, addedCondition] } })).toEqual({
      declared: featuredWhere,
      remainder: addedCondition,
    });
  });

  it("matches a multi-condition declared filter only when nested as ONE node", () => {
    const multiViewCollection = collectionWithViews([
      { viewId: "high-value", name: "High Value", where: multiConditionWhere },
    ]);
    const addedCondition = { field: "source", op: "eq", value: "g2" } as const;
    expect(
      matchDeclaredSavedListViewFilter({
        collection: multiViewCollection,
        where: { and: [multiConditionWhere, addedCondition] },
      }),
    ).toEqual({ declared: multiConditionWhere, remainder: addedCondition });
  });
});

describe("matchDeclaredSavedListViewFilter — altered value", () => {
  const collection = collectionWithViews([{ viewId: "featured", name: "Featured", where: featuredWhere }]);

  it("a changed value is a DIFFERENT node — nothing is exempt", () => {
    const altered = { field: "featured", op: "eq", value: false } as const;
    const addedCondition = { field: "source", op: "eq", value: "g2" } as const;
    const where = { and: [altered, addedCondition] } as const;
    expect(matchDeclaredSavedListViewFilter({ collection, where })).toEqual({ remainder: where });
  });
});

describe("matchDeclaredSavedListViewFilter — partial", () => {
  it("dropping one condition of a multi-condition declared filter is NOT a match", () => {
    const multiViewCollection = collectionWithViews([
      { viewId: "high-value", name: "High Value", where: multiConditionWhere },
    ]);
    const addedCondition = { field: "source", op: "eq", value: "g2" } as const;
    // Only `featuredWhere` survives from the declared `and` — `regionWhere`
    // was dropped, so the surviving part cannot deep-equal the FULL
    // declared `where`.
    const where = { and: [featuredWhere, addedCondition] } as const;
    expect(matchDeclaredSavedListViewFilter({ collection: multiViewCollection, where })).toEqual({ remainder: where });
  });
});

describe("matchDeclaredSavedListViewFilter — nested in OR", () => {
  const collection = collectionWithViews([{ viewId: "featured", name: "Featured", where: featuredWhere }]);

  it("a declared filter placed inside an OR group is NOT exempt", () => {
    const otherCondition = { field: "source", op: "eq", value: "g2" } as const;
    const where = { or: [featuredWhere, otherCondition] } as const;
    expect(matchDeclaredSavedListViewFilter({ collection, where })).toEqual({ remainder: where });
  });
});

describe("matchDeclaredSavedListViewFilter — unreadable remainder", () => {
  const collection = collectionWithViews([{ viewId: "featured", name: "Featured", where: featuredWhere }]);

  it("returns the remainder as-is, even when it references a field the caller cannot read — access is the CALLER's job", () => {
    const unreadableCondition = { field: "internalScore", op: "eq", value: 90 } as const;
    expect(matchDeclaredSavedListViewFilter({ collection, where: { and: [featuredWhere, unreadableCondition] } })).toEqual({
      declared: featuredWhere,
      remainder: unreadableCondition,
    });
  });
});

describe("matchDeclaredSavedListViewFilter — sharedWheres", () => {
  const collection = collectionWithViews([]);

  it("trusts an exact match against a shared view's where, same as a config view's", () => {
    expect(
      matchDeclaredSavedListViewFilter({ collection, where: featuredWhere, sharedWheres: [featuredWhere] }),
    ).toEqual({ declared: featuredWhere, remainder: undefined });
  });

  it("does not trust a shared where that was never loaded (caller lacked readViews)", () => {
    expect(matchDeclaredSavedListViewFilter({ collection, where: featuredWhere, sharedWheres: [] })).toEqual({
      remainder: featuredWhere,
    });
  });

  it("does not trust an altered value against a shared view's where", () => {
    const altered = { field: "featured", op: "eq", value: false } as const;
    expect(
      matchDeclaredSavedListViewFilter({ collection, where: altered, sharedWheres: [featuredWhere] }),
    ).toEqual({ remainder: altered });
  });
});

const postsResource = defineCollection({ slug: "posts", fields: { title: text() } });
const fixtureConfig = { collections: [postsResource] } as unknown as VexConfig;
const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("loadSharedSavedListViewWheres (server)", () => {
  it("returns [] and reads nothing extra when nothing is unreadable (no RBAC configured, still just loads readable wheres)", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await loadSharedSavedListViewWheres({ ctx, config: fixtureConfig, collection: "posts" });
      expect(result).toEqual([]);
    });
  });

  it("loads every readable shared view's where for the collection", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "v1",
        name: "Featured",
        state: { where: featuredWhere },
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await loadSharedSavedListViewWheres({ ctx, config: fixtureConfig, collection: "posts" });
      expect(result).toEqual([featuredWhere]);
    });
  });

  it("resolves to [] when the caller lacks readViews, rather than throwing", async () => {
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
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "v1",
        name: "Featured",
        state: { where: featuredWhere },
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await loadSharedSavedListViewWheres({
        ctx,
        config,
        collection: "posts",
        auth: { user: { roles: ["editor"] } },
      });
      expect(result).toEqual([]);
    });
  });
});

describe("loadSharedSavedListViewWheres (server) — org scoping", () => {
  const orgConfig = {
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

  it("returns [] (not the unscoped set) when the caller's org doesn't resolve", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "org1-view",
        name: "Org 1",
        state: { where: featuredWhere },
        organizationId: "org1",
        createdBy: "user1",
      });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "orgless-view",
        name: "Org-less",
        state: { where: regionWhere },
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await loadSharedSavedListViewWheres({
        ctx,
        config: orgConfig,
        collection: "posts",
        auth: { user: { roles: ["editor"] }, organization: undefined },
      });
      expect(result).toEqual([]);
    });
  });

  it("excludes an org-less row, even for a caller whose own org resolves", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "org1-view",
        name: "Org 1",
        state: { where: featuredWhere },
        organizationId: "org1",
        createdBy: "user1",
      });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "orgless-view",
        name: "Org-less",
        state: { where: regionWhere },
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await loadSharedSavedListViewWheres({
        ctx,
        config: orgConfig,
        collection: "posts",
        auth: { user: { roles: ["editor"] }, organization: { _id: "org1" } },
      });
      expect(result).toEqual([featuredWhere]);
    });
  });

  it("loads the full unscoped set when org scoping is not configured — behavior unchanged", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "org1-view",
        name: "Org 1",
        state: { where: featuredWhere },
        organizationId: "org1",
        createdBy: "user1",
      });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "orgless-view",
        name: "Org-less",
        state: { where: regionWhere },
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await loadSharedSavedListViewWheres({ ctx, config: fixtureConfig, collection: "posts" });
      expect(result).toEqual(expect.arrayContaining([featuredWhere, regionWhere]));
      expect(result).toHaveLength(2);
    });
  });

  it("loads the full unscoped set when orgCollectionSlug is configured but organizations is NOT set (the apps/test regression: orgCollectionSlug alone never scoped anything)", async () => {
    const orgCollectionSlugOnlyConfig = {
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
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "org1-view",
        name: "Org 1",
        state: { where: featuredWhere },
        organizationId: "org1",
        createdBy: "user1",
      });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "orgless-view",
        name: "Org-less",
        state: { where: regionWhere },
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await loadSharedSavedListViewWheres({
        ctx,
        config: orgCollectionSlugOnlyConfig,
        collection: "posts",
        auth: { user: { roles: ["editor"] }, organization: { _id: "org2" } },
      });
      expect(result).toEqual(expect.arrayContaining([featuredWhere, regionWhere]));
      expect(result).toHaveLength(2);
    });
  });
});

describe("loadSharedSavedListViewWheres (server) — bad state rows skipped", () => {
  it("skips a row whose state is null (the exact trigger case: used to throw TypeError on every read) and returns the rest", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
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
        state: { where: featuredWhere },
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await loadSharedSavedListViewWheres({ ctx, config: fixtureConfig, collection: "posts" });
      expect(result).toEqual([featuredWhere]);
    });
  });

  it("skips a row whose state is a bare string", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "bad1",
        name: "Bad row",
        state: "not an object",
        createdBy: "user1",
      } as never);
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await loadSharedSavedListViewWheres({ ctx, config: fixtureConfig, collection: "posts" });
      expect(result).toEqual([]);
    });
  });
});
