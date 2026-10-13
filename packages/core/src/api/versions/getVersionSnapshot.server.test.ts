import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { defineAccess } from "../../access/config";
import { VexAccessError } from "../../access";
import { defineCollection, defineGlobal, text } from "../../index";
import { getVersionSnapshot } from "./getVersionSnapshot.server";

const posts = defineCollection({
  slug: "posts",
  versions: { drafts: true },
  fields: { title: text({ required: true }) },
});

const access = defineAccess({
  roles: ["editor", "viewer"] as const,
  resources: [posts],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    editor: { posts: { readDrafts: true } },
    viewer: { posts: { read: true } },
  },
});

const fixtureConfig = { collections: [posts], access } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

const editorUser = { _id: "u1", roles: ["editor"] };
const viewerUser = { _id: "u2", roles: ["viewer"] };

describe("getVersionSnapshot (server) — collection target", () => {
  test("returns the snapshot and status for a caller with readDrafts", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        vex_status: "published",
      });
      await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: id,
        version: 1,
        status: "draft",
        snapshot: { title: "Draft body" },
      });

      return getVersionSnapshot({
        ctx,
        config: fixtureConfig,
        auth: { user: editorUser },
        collection: "posts",
        id,
        version: 1,
      });
    });

    expect(result).toEqual({
      snapshot: { title: "Draft body" },
      status: "draft",
    });
  });

  test("throws for a caller without readDrafts — no draft content escapes the rejection", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        vex_status: "published",
      });
      await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: id,
        version: 1,
        status: "draft",
        snapshot: { title: "Draft body", secret: "must-not-leak" },
      });

      let caught: unknown;
      try {
        await getVersionSnapshot({
          ctx,
          config: fixtureConfig,
          auth: { user: viewerUser },
          collection: "posts",
          id,
          version: 1,
        });
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(VexAccessError);
      expect(String(caught)).not.toContain("must-not-leak");
    });
  });

  test("throws when the version does not exist", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        vex_status: "published",
      });

      await expect(
        getVersionSnapshot({
          ctx,
          config: fixtureConfig,
          auth: { user: editorUser },
          collection: "posts",
          id,
          version: 99,
        }),
      ).rejects.toThrow();
    });
  });
});

const banner = defineGlobal({
  slug: "banner",
  label: "Banner",
  fields: { message: text({ label: "Message", required: true }) },
  versions: { drafts: true },
});

const globalAccess = defineAccess({
  roles: ["editor", "viewer"] as const,
  resources: [banner],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    editor: { banner: { readDrafts: true } },
    viewer: { banner: { read: true } },
  },
});

const globalFixtureConfig = {
  collections: [],
  globals: [banner],
  access: globalAccess,
} as unknown as VexConfig;

describe("getVersionSnapshot (server) — global target", () => {
  test("returns the snapshot for a caller with readDrafts, RBAC resolved against the global's own slug", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "banner",
        data: { message: "Live" },
        vex_status: "published",
      });
      await ctx.db.insert("vex_versions", {
        collection: "vex_globals",
        documentId: "banner",
        version: 1,
        status: "published",
        snapshot: { message: "Live" },
      });
      return getVersionSnapshot({
        ctx,
        config: globalFixtureConfig,
        auth: { user: editorUser },
        global: "banner",
        version: 1,
      });
    });

    expect(result).toEqual({
      snapshot: { message: "Live" },
      status: "published",
    });
  });

  test("throws for a caller without readDrafts on the global's own slug", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "banner",
        data: { message: "Live" },
        vex_status: "published",
      });
      await ctx.db.insert("vex_versions", {
        collection: "vex_globals",
        documentId: "banner",
        version: 1,
        status: "published",
        snapshot: { message: "Live" },
      });

      await expect(
        getVersionSnapshot({
          ctx,
          config: globalFixtureConfig,
          auth: { user: viewerUser },
          global: "banner",
          version: 1,
        }),
      ).rejects.toThrow(VexAccessError);
    });
  });
});
