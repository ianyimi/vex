import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../../../db/test/convex/_generated/api";
import schema from "../../../db/test/convex/schema";
import type { VexConfig } from "../../../config";
import { defineAccess } from "../../../access/config";
import { VexAccessError } from "../../../access";
import { defineCollection, defineGlobal, text } from "../../../index";
import { deleteVersion } from "./server";

const posts = defineCollection({
  slug: "posts",
  versions: { drafts: true },
  fields: { title: text({ required: true }) },
});

const access = defineAccess({
  roles: ["admin", "editor"] as const,
  resources: [posts],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    admin: { posts: { readDrafts: true, deleteVersions: true } },
    editor: { posts: { readDrafts: true } }, // can read history, not prune it
  },
});

const fixtureConfig = { collections: [posts], access } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

const adminUser = { _id: "u1", roles: ["admin"] };
const editorUser = { _id: "u2", roles: ["editor"] };

describe("deleteVersion (server) — collection target", () => {
  test("deletes the targeted version row for a caller with deleteVersions", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        vex_status: "published",
      });
      const versionId = await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: id,
        version: 1,
        status: "published",
        snapshot: { title: "Hello" },
      });

      const result = await deleteVersion({
        ctx,
        config: fixtureConfig,
        auth: { user: adminUser },
        collection: "posts",
        id,
        version: 1,
      });

      expect(result).toBeUndefined();
      expect(await ctx.db.get(versionId)).toBeNull();
    });
  });

  test("throws for a caller without deleteVersions — history is left intact", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        vex_status: "published",
      });
      const versionId = await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: id,
        version: 1,
        status: "published",
        snapshot: { title: "Hello" },
      });

      await expect(
        deleteVersion({
          ctx,
          config: fixtureConfig,
          auth: { user: editorUser },
          collection: "posts",
          id,
          version: 1,
        }),
      ).rejects.toThrow(VexAccessError);

      expect(await ctx.db.get(versionId)).not.toBeNull();
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
        deleteVersion({
          ctx,
          config: fixtureConfig,
          auth: { user: adminUser },
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
  roles: ["admin", "editor"] as const,
  resources: [banner],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    admin: { banner: { readDrafts: true, deleteVersions: true } },
    editor: { banner: { readDrafts: true } },
  },
});

const globalFixtureConfig = {
  collections: [],
  globals: [banner],
  access: globalAccess,
} as unknown as VexConfig;

describe("deleteVersion (server) — global target", () => {
  test("deletes the targeted version row for a caller with deleteVersions, resolved against the global's own slug", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "banner",
        data: { message: "Live" },
        vex_status: "published",
      });
      const versionId = await ctx.db.insert("vex_versions", {
        collection: "vex_globals",
        documentId: "banner",
        version: 1,
        status: "published",
        snapshot: { message: "Live" },
      });

      await deleteVersion({
        ctx,
        config: globalFixtureConfig,
        auth: { user: adminUser },
        global: "banner",
        version: 1,
      });

      expect(await ctx.db.get(versionId)).toBeNull();
    });
  });

  test("throws for a caller without deleteVersions — history is left intact", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "banner",
        data: { message: "Live" },
        vex_status: "published",
      });
      const versionId = await ctx.db.insert("vex_versions", {
        collection: "vex_globals",
        documentId: "banner",
        version: 1,
        status: "published",
        snapshot: { message: "Live" },
      });

      await expect(
        deleteVersion({
          ctx,
          config: globalFixtureConfig,
          auth: { user: editorUser },
          global: "banner",
          version: 1,
        }),
      ).rejects.toThrow(VexAccessError);

      expect(await ctx.db.get(versionId)).not.toBeNull();
    });
  });
});
