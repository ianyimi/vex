import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../../../db/test/convex/_generated/api";
import schema from "../../../db/test/convex/schema";
import type { VexConfig } from "../../../config";
import { removeView } from "./server";
import { saveView } from "../saveView/server";
import { defineAccess } from "../../../access/config";
import { defineCollection, text } from "../../../index";
import { VexAccessError } from "../../../access";

const postsResource = defineCollection({
  slug: "posts",
  fields: { title: text() },
});

const fixtureConfig = { collections: [postsResource] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

/** Runs `fn` inside a fresh `convexTest` transaction. */
async function withTransaction(
  fn: (ctx: GenericMutationCtx<GenericDataModel>) => Promise<void>,
): Promise<void> {
  const t = convexTest(schema, modules);
  await t.run(fn);
}

describe("removeView (server)", () => {
  test("deletes an existing vex_views row", async () => {
    await withTransaction(async (ctx) => {
      await saveView({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", state: {} },
      });
      await removeView({ ctx, config: fixtureConfig, collection: "posts", viewId: "v1" });
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(0);
    });
  });

  test("throws when viewId does not exist", async () => {
    await withTransaction(async (ctx) => {
      await expect(
        removeView({ ctx, config: fixtureConfig, collection: "posts", viewId: "missing" }),
      ).rejects.toThrow(/No view "missing"/);
    });
  });

  test("throws when viewId belongs to a different collection, and the row survives", async () => {
    await withTransaction(async (ctx) => {
      await saveView({
        ctx,
        config: fixtureConfig,
        collection: "authors",
        view: { viewId: "v1", name: "Authors view", state: {} },
      });
      await expect(
        removeView({ ctx, config: fixtureConfig, collection: "posts", viewId: "v1" }),
      ).rejects.toThrow(/No view "v1" found for collection "posts"/);
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(1);
    });
  });

  test("denies a delete when the caller lacks deleteView", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { editor: { posts: { deleteView: false } } },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      await saveView({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", state: {} },
      });
      await expect(
        removeView({
          ctx,
          config,
          collection: "posts",
          viewId: "v1",
          auth: { user: { roles: ["editor"] } },
        }),
      ).rejects.toThrow(VexAccessError);
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(1);
    });
  });

  test("allows a delete when the caller has deleteView", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["admin"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { admin: { posts: { deleteView: true } } },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      await saveView({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", state: {} },
      });
      await removeView({
        ctx,
        config,
        collection: "posts",
        viewId: "v1",
        auth: { user: { roles: ["admin"] } },
      });
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(0);
    });
  });
});

describe("removeView (server) — reserved view ids", () => {
  const postsWithPresetView = defineCollection({
    slug: "posts",
    fields: { title: text() },
    admin: { views: [{ viewId: "preset1", name: "Preset", state: {} }] },
  });
  const presetConfig = { collections: [postsWithPresetView] } as unknown as VexConfig;

  test("rejects deleting the collection's default (\"default\") view id", async () => {
    await withTransaction(async (ctx) => {
      await expect(
        removeView({ ctx, config: fixtureConfig, collection: "posts", viewId: "default" }),
      ).rejects.toThrow(/RESERVED_VIEW_ID/);
    });
  });

  test("rejects deleting a preset admin.views entry's id", async () => {
    await withTransaction(async (ctx) => {
      await expect(
        removeView({ ctx, config: presetConfig, collection: "posts", viewId: "preset1" }),
      ).rejects.toThrow(/RESERVED_VIEW_ID/);
    });
  });

  test("the reserved-id check fires instead of the generic not-found message", async () => {
    await withTransaction(async (ctx) => {
      // Confirms the caller sees RESERVED_VIEW_ID, not the generic "No view
      // found" message — even though no row exists either way, the
      // reserved-id check runs first and produces a more useful error.
      await expect(
        removeView({ ctx, config: fixtureConfig, collection: "posts", viewId: "default" }),
      ).rejects.not.toThrow(/No view/);
    });
  });
});

describe("removeView (server) — cross-org", () => {
  const orgConfig = {
    ...fixtureConfig,
    access: defineAccess({
      roles: ["editor"] as const,
      resources: [postsResource],
      userCollectionSlug: "users",
      userRolesField: "roles",
      orgCollectionSlug: "organizations",
      organizations: true,
      permissions: { editor: { posts: { deleteView: true } } },
    }),
  } as unknown as VexConfig;

  test("deleting a view belonging to a different organization behaves exactly like a missing view, and the row survives", async () => {
    await withTransaction(async (ctx) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "v1",
        name: "Org 1's view",
        state: {},
        organizationId: "org1",
        createdBy: "user1",
      });
      await expect(
        removeView({
          ctx,
          config: orgConfig,
          collection: "posts",
          viewId: "v1",
          auth: { user: { roles: ["editor"] }, organization: { _id: "org2" } },
        }),
      ).rejects.toThrow(/No view "v1" found for collection "posts"/);
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(1);
    });
  });

  test("allows a delete when the caller's org matches the view's own", async () => {
    await withTransaction(async (ctx) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "v1",
        name: "Org 1's view",
        state: {},
        organizationId: "org1",
        createdBy: "user1",
      });
      await removeView({
        ctx,
        config: orgConfig,
        collection: "posts",
        viewId: "v1",
        auth: { user: { roles: ["editor"] }, organization: { _id: "org1" } },
      });
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(0);
    });
  });

  test("an org-less view is invisible and inert under scoping — a delete behaves exactly like a missing view, row survives", async () => {
    await withTransaction(async (ctx) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "v1",
        name: "Pre-org view",
        state: {},
        createdBy: "user1",
      });
      await expect(
        removeView({
          ctx,
          config: orgConfig,
          collection: "posts",
          viewId: "v1",
          auth: { user: { roles: ["editor"] }, organization: { _id: "org1" } },
        }),
      ).rejects.toThrow(/No view "v1" found for collection "posts"/);
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(1);
    });
  });

  test("a caller whose own org doesn't resolve is denied, even for a same-org row", async () => {
    await withTransaction(async (ctx) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "v1",
        name: "Org 1's view",
        state: {},
        organizationId: "org1",
        createdBy: "user1",
      });
      await expect(
        removeView({
          ctx,
          config: orgConfig,
          collection: "posts",
          viewId: "v1",
          auth: { user: { roles: ["editor"] }, organization: undefined },
        }),
      ).rejects.toThrow(/No view "v1" found for collection "posts"/);
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(1);
    });
  });

  test("orgCollectionSlug configured but organizations NOT set: a caller can still delete a cross-org-labeled row (the apps/test regression)", async () => {
    const orgCollectionSlugOnlyConfig = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        orgCollectionSlug: "organizations",
        // `organizations` deliberately omitted — defaults to `false`.
        permissions: { editor: { posts: { deleteView: true } } },
      }),
    } as unknown as VexConfig;
    await withTransaction(async (ctx) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "v1",
        name: "Org 1's view",
        state: {},
        organizationId: "org1",
        createdBy: "user1",
      });
      await removeView({
        ctx,
        config: orgCollectionSlugOnlyConfig,
        collection: "posts",
        viewId: "v1",
        auth: { user: { roles: ["editor"] }, organization: { _id: "org2" } },
      });
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(0);
    });
  });
});
