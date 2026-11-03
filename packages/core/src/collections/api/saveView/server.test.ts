import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../../../db/test/convex/_generated/api";
import schema from "../../../db/test/convex/schema";
import type { VexConfig } from "../../../config";
import { saveView } from "./server";
import { listViews } from "../listViews/server";
import { removeView } from "../removeView/server";
import { defineAccess } from "../../../access/config";
import { defineCollection, text } from "../../../index";
import { VexAccessError } from "../../../access";

const postsResource = defineCollection({
  slug: "posts",
  fields: { title: text(), excerpt: text() },
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

describe("saveView (server)", () => {
  test("inserts a new vex_views row when no RBAC is configured", async () => {
    await withTransaction(async (ctx) => {
      const viewId = await saveView({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", state: { search: "featured" } },
      });
      expect(viewId).toBe("v1");
      const rows = await ctx.db.query("vex_views").collect();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ collection: "posts", viewId: "v1", name: "Featured" });
    });
  });

  test("stores an optional description on insert and patch", async () => {
    await withTransaction(async (ctx) => {
      await saveView({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", description: "Featured posts", state: {} },
      });
      let rows = await ctx.db.query("vex_views").collect();
      expect(rows[0]).toMatchObject({ description: "Featured posts" });

      await saveView({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", description: "Renamed description", state: {} },
      });
      rows = await ctx.db.query("vex_views").collect();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ description: "Renamed description" });
    });
  });

  test("is idempotent on viewId — a second save patches the existing row", async () => {
    await withTransaction(async (ctx) => {
      await saveView({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", state: { search: "featured" } },
      });
      await saveView({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Featured (renamed)", state: { search: "updated" } },
      });
      const rows = await ctx.db.query("vex_views").collect();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ name: "Featured (renamed)", state: { search: "updated" } });
    });
  });

  test("denies an insert when the caller lacks createView", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { editor: { posts: { createView: false } } },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      await expect(
        saveView({
          ctx,
          config,
          collection: "posts",
          view: { viewId: "v1", name: "Featured", state: {} },
          auth: { user: { roles: ["editor"] } },
        }),
      ).rejects.toThrow(VexAccessError);
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(0);
    });
  });

  test("allows an insert when the caller has createView", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["admin"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { admin: { posts: { createView: true } } },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      const viewId = await saveView({
        ctx,
        config,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", state: {} },
        auth: { user: { roles: ["admin"] } },
      });
      expect(viewId).toBe("v1");
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(1);
    });
  });

  test("denies a patch (existing viewId) when the caller has createView but lacks updateView", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { editor: { posts: { createView: true, updateView: false } } },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      await saveView({
        ctx,
        config,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", state: {} },
        auth: { user: { roles: ["editor"] } },
      });
      await expect(
        saveView({
          ctx,
          config,
          collection: "posts",
          view: { viewId: "v1", name: "Renamed", state: {} },
          auth: { user: { roles: ["editor"] } },
        }),
      ).rejects.toThrow(VexAccessError);
      const rows = await ctx.db.query("vex_views").collect();
      expect(rows[0]).toMatchObject({ name: "Featured" });
    });
  });

  test("allows a patch when the caller has updateView", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { editor: { posts: { createView: true, updateView: true } } },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      await saveView({
        ctx,
        config,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", state: {} },
        auth: { user: { roles: ["editor"] } },
      });
      await saveView({
        ctx,
        config,
        collection: "posts",
        view: { viewId: "v1", name: "Renamed", state: {} },
        auth: { user: { roles: ["editor"] } },
      });
      const rows = await ctx.db.query("vex_views").collect();
      expect(rows[0]).toMatchObject({ name: "Renamed" });
    });
  });

  test("throws when the viewId already belongs to a different collection", async () => {
    await withTransaction(async (ctx) => {
      await saveView({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", state: {} },
      });
      await expect(
        saveView({
          ctx,
          config: fixtureConfig,
          collection: "authors",
          view: { viewId: "v1", name: "Collides", state: {} },
        }),
      ).rejects.toThrow(/already belongs to collection "posts"/);
    });
  });

  test("rejects a where referencing a field the caller can't read (decision 26)", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          editor: { posts: { createView: true, read: () => ({ excerpt: false }) } },
        },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      await expect(
        saveView({
          ctx,
          config,
          collection: "posts",
          view: {
            viewId: "v1",
            name: "High score",
            state: { where: { field: "excerpt", op: "gt", value: 90 } },
          },
          auth: { user: { roles: ["editor"] } },
        }),
      ).rejects.toThrow(VexAccessError);
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(0);
    });
  });

  test("allows a where that only references readable fields", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          editor: { posts: { createView: true, read: () => ({ "*": true, excerpt: false }) } },
        },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      const viewId = await saveView({
        ctx,
        config,
        collection: "posts",
        view: {
          viewId: "v1",
          name: "Titled",
          state: { where: { field: "title", op: "eq", value: "Hello" } },
        },
        auth: { user: { roles: ["editor"] } },
      });
      expect(viewId).toBe("v1");
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(1);
    });
  });
});

describe("saveView (server) — reserved view ids (Decision 45/48)", () => {
  const postsWithPresetView = defineCollection({
    slug: "posts",
    fields: { title: text(), excerpt: text() },
    admin: { views: [{ viewId: "preset1", name: "Preset", state: {} }] },
  });
  const presetConfig = { collections: [postsWithPresetView] } as unknown as VexConfig;

  test("rejects saving a view whose viewId is the collection's default (\"default\")", async () => {
    await withTransaction(async (ctx) => {
      await expect(
        saveView({
          ctx,
          config: fixtureConfig,
          collection: "posts",
          view: { viewId: "default", name: "Hijacked", state: {} },
        }),
      ).rejects.toThrow(/RESERVED_VIEW_ID/);
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(0);
    });
  });

  test("rejects saving a view whose viewId matches a preset admin.views entry", async () => {
    await withTransaction(async (ctx) => {
      await expect(
        saveView({
          ctx,
          config: presetConfig,
          collection: "posts",
          view: { viewId: "preset1", name: "Hijacked", state: {} },
        }),
      ).rejects.toThrow(/RESERVED_VIEW_ID/);
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(0);
    });
  });

  test("still allows an ordinary viewId unrelated to any declared view", async () => {
    await withTransaction(async (ctx) => {
      const viewId = await saveView({
        ctx,
        config: presetConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Fine", state: {} },
      });
      expect(viewId).toBe("v1");
    });
  });
});

describe("saveView (server) — input validation (Decision 2)", () => {
  test("rejects a view missing viewId/name", async () => {
    await withTransaction(async (ctx) => {
      await expect(
        saveView({
          ctx,
          config: fixtureConfig,
          collection: "posts",
          view: { name: "Missing viewId", state: {} } as never,
        }),
      ).rejects.toThrow(/INVALID_VIEW/);
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(0);
    });
  });

  test("rejects a non-object state (null)", async () => {
    await withTransaction(async (ctx) => {
      await expect(
        saveView({
          ctx,
          config: fixtureConfig,
          collection: "posts",
          view: { viewId: "v1", name: "Null state", state: null } as never,
        }),
      ).rejects.toThrow(/INVALID_VIEW/);
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(0);
    });
  });

  test("rejects a non-object state (array)", async () => {
    await withTransaction(async (ctx) => {
      await expect(
        saveView({
          ctx,
          config: fixtureConfig,
          collection: "posts",
          view: { viewId: "v1", name: "Array state", state: [] } as never,
        }),
      ).rejects.toThrow(/INVALID_VIEW/);
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(0);
    });
  });

  test("rejects a completely malformed payload ({})", async () => {
    await withTransaction(async (ctx) => {
      await expect(
        saveView({ ctx, config: fixtureConfig, collection: "posts", view: {} as never }),
      ).rejects.toThrow(/INVALID_VIEW/);
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(0);
    });
  });

  test("accepts a view with an empty (but present and plain-object) state", async () => {
    await withTransaction(async (ctx) => {
      const viewId = await saveView({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Fine", state: {} },
      });
      expect(viewId).toBe("v1");
    });
  });
});

describe("saveView (server) — cross-org (Decision 3)", () => {
  const orgConfig = {
    ...fixtureConfig,
    access: defineAccess({
      roles: ["editor"] as const,
      resources: [postsResource],
      userCollectionSlug: "users",
      userRolesField: "roles",
      orgCollectionSlug: "organizations",
      organizations: true,
      permissions: { editor: { posts: { createView: true, updateView: true } } },
    }),
  } as unknown as VexConfig;

  test("patching a view belonging to a different organization behaves exactly like a missing view", async () => {
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
        saveView({
          ctx,
          config: orgConfig,
          collection: "posts",
          view: { viewId: "v1", name: "Hijacked", state: {} },
          auth: { user: { roles: ["editor"] }, organization: { _id: "org2" } },
        }),
      ).rejects.toThrow(/No view "v1" found for collection "posts"/);
      const rows = await ctx.db.query("vex_views").collect();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ name: "Org 1's view", organizationId: "org1" });
    });
  });

  test("an org-less existing view is invisible and inert under scoping — not adopted, rejected like a missing view", async () => {
    await withTransaction(async (ctx) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "v1",
        name: "Pre-org view",
        state: {},
        createdBy: "user1",
      });
      await expect(
        saveView({
          ctx,
          config: orgConfig,
          collection: "posts",
          view: { viewId: "v1", name: "Hijacked", state: {} },
          auth: { user: { roles: ["editor"] }, organization: { _id: "org1" } },
        }),
      ).rejects.toThrow(/No view "v1" found for collection "posts"/);
      const rows = await ctx.db.query("vex_views").collect();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ name: "Pre-org view" });
      expect(rows[0].organizationId).toBeUndefined();
    });
  });

  test("a caller whose own org doesn't resolve is denied, for an existing view", async () => {
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
        saveView({
          ctx,
          config: orgConfig,
          collection: "posts",
          view: { viewId: "v1", name: "Hijacked", state: {} },
          auth: { user: { roles: ["editor"] }, organization: undefined },
        }),
      ).rejects.toThrow(/No view "v1" found for collection "posts"/);
      const rows = await ctx.db.query("vex_views").collect();
      expect(rows[0]).toMatchObject({ name: "Org 1's view" });
    });
  });

  test("a caller whose own org doesn't resolve is denied, for a NEW view (create, not just patch)", async () => {
    await withTransaction(async (ctx) => {
      await expect(
        saveView({
          ctx,
          config: orgConfig,
          collection: "posts",
          view: { viewId: "v1", name: "New", state: {} },
          auth: { user: { roles: ["editor"] }, organization: undefined },
        }),
      ).rejects.toThrow(/No view "v1" found for collection "posts"/);
      const rows = await ctx.db.query("vex_views").collect();
      expect(rows).toHaveLength(0);
    });
  });


  test("a patch from the view's own org never rewrites organizationId", async () => {
    await withTransaction(async (ctx) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "v1",
        name: "Org 1's view",
        state: {},
        organizationId: "org1",
        createdBy: "user1",
      });
      await saveView({
        ctx,
        config: orgConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Renamed", state: {} },
        auth: { user: { roles: ["editor"] }, organization: { _id: "org1" } },
      });
      const rows = await ctx.db.query("vex_views").collect();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ name: "Renamed", organizationId: "org1" });
    });
  });

  test("a new insert stamps the caller's org", async () => {
    await withTransaction(async (ctx) => {
      await saveView({
        ctx,
        config: orgConfig,
        collection: "posts",
        view: { viewId: "v1", name: "New", state: {} },
        auth: { user: { roles: ["editor"] }, organization: { _id: "org1" } },
      });
      const rows = await ctx.db.query("vex_views").collect();
      expect(rows[0]).toMatchObject({ organizationId: "org1" });
    });
  });

  test("orgCollectionSlug configured but organizations NOT set: a caller can still patch a cross-org-labeled row (the apps/test regression)", async () => {
    const orgCollectionSlugOnlyConfig = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        orgCollectionSlug: "organizations",
        // `organizations` deliberately omitted — defaults to `false`.
        permissions: { editor: { posts: { createView: true, updateView: true } } },
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
      await saveView({
        ctx,
        config: orgCollectionSlugOnlyConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Edited by org2", state: {} },
        auth: { user: { roles: ["editor"] }, organization: { _id: "org2" } },
      });
      const rows = await ctx.db.query("vex_views").collect();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ name: "Edited by org2" });
    });
  });
});

describe("saveView/listViews/removeView (server) — full CRUD lifecycle, RBAC configured but NO org scoping (confirms unaffected by the org-scoping rounds)", () => {
  const noOrgConfig = {
    ...fixtureConfig,
    access: defineAccess({
      roles: ["editor"] as const,
      resources: [postsResource],
      userCollectionSlug: "users",
      userRolesField: "roles",
      // No `orgCollectionSlug` — org scoping is NOT configured.
      permissions: {
        editor: { posts: { createView: true, readViews: true, updateView: true, deleteView: true } },
      },
    }),
  } as unknown as VexConfig;
  const auth = { user: { roles: ["editor"] } };

  test("a caller with full view permissions can create, read, update, and delete a shared view", async () => {
    await withTransaction(async (ctx) => {
      // Create.
      await saveView({
        ctx,
        config: noOrgConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Team view", state: { search: "featured" } },
        auth,
      });

      // Read.
      const listed = await listViews({ ctx, config: noOrgConfig, collection: "posts", auth });
      expect(listed).toHaveLength(1);
      expect(listed[0]).toMatchObject({ viewId: "v1", name: "Team view" });

      // Update.
      await saveView({
        ctx,
        config: noOrgConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Renamed team view", state: { search: "featured" } },
        auth,
      });
      const afterUpdate = await listViews({ ctx, config: noOrgConfig, collection: "posts", auth });
      expect(afterUpdate).toHaveLength(1);
      expect(afterUpdate[0]).toMatchObject({ name: "Renamed team view" });

      // Delete.
      await removeView({ ctx, config: noOrgConfig, collection: "posts", viewId: "v1", auth });
      const afterDelete = await listViews({ ctx, config: noOrgConfig, collection: "posts", auth });
      expect(afterDelete).toEqual([]);
    });
  });
});

