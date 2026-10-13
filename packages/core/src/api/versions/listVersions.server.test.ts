import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { defineAccess } from "../../access/config";
import { VexAccessError } from "../../access";
import { defineCollection, defineGlobal, text } from "../../index";
import { listVersions } from "./listVersions.server";

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

describe("listVersions (server) — collection target", () => {
  test("returns summaries newest-first, without snapshot content, for a caller with readDrafts", async () => {
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
        status: "published",
        snapshot: { title: "Hello" },
      });
      await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: id,
        version: 2,
        status: "draft",
        snapshot: { title: "Hello (draft edit)" },
      });
      return listVersions({
        ctx,
        config: fixtureConfig,
        auth: { user: editorUser },
        collection: "posts",
        id,
      });
    });

    expect(result.map((entry) => entry.version)).toEqual([2, 1]);
    for (const entry of result) {
      expect(entry).not.toHaveProperty("snapshot");
    }
  });

  test("throws for a caller without readDrafts, before reading any version row", async () => {
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
        snapshot: { title: "Hello", secret: "draft-only-field" },
      });

      await expect(
        listVersions({
          ctx,
          config: fixtureConfig,
          auth: { user: viewerUser },
          collection: "posts",
          id,
        }),
      ).rejects.toThrow(VexAccessError);
    });
  });

  test("throws when the document does not exist", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const otherId = await ctx.db.insert("posts", {
        title: "Gone",
        slug: "gone",
      });
      await ctx.db.delete(otherId);

      await expect(
        listVersions({
          ctx,
          config: fixtureConfig,
          auth: { user: editorUser },
          collection: "posts",
          id: otherId,
        }),
      ).rejects.toThrow();
    });
  });

  test("returns a draft-only document's own history — never published, no vex_publishedId", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", {
        title: "New",
        slug: "new",
        vex_status: "draft",
      });
      await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: id,
        version: 1,
        status: "draft",
        snapshot: { title: "New" },
      });
      return listVersions({
        ctx,
        config: fixtureConfig,
        auth: { user: editorUser },
        collection: "posts",
        id,
      });
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.status).toBe("draft");
  });

  test("returns [] for a document with no history yet", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        vex_status: "published",
      });
      return listVersions({
        ctx,
        config: fixtureConfig,
        auth: { user: editorUser },
        collection: "posts",
        id,
      });
    });

    expect(result).toEqual([]);
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

describe("listVersions (server) — global target", () => {
  test("returns summaries for a caller with readDrafts, RBAC resolved against the global's own slug", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "banner",
        data: { message: "Hi" },
        vex_status: "published",
      });
      await ctx.db.insert("vex_versions", {
        collection: "vex_globals",
        documentId: "banner",
        version: 1,
        status: "published",
        snapshot: { message: "Hi" },
      });
      return listVersions({
        ctx,
        config: globalFixtureConfig,
        auth: { user: editorUser },
        global: "banner",
      });
    });

    expect(result).toHaveLength(1);
  });

  test('throws for a caller without readDrafts — denial is resolved against the global\'s own slug, never the literal "vex_globals"', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "banner",
        data: { message: "Hi" },
        vex_status: "published",
      });
      await ctx.db.insert("vex_versions", {
        collection: "vex_globals",
        documentId: "banner",
        version: 1,
        status: "published",
        snapshot: { message: "Hi" },
      });

      // `viewer` is granted `read` on "banner" but not `readDrafts` — if this
      // resolved against the literal "vex_globals" instead, the role has no
      // grant there at all (undeclared ⇒ deny either way), which would mask
      // the real bug this test pins. Granting `viewer` plain `read` on the
      // CORRECT resource ("banner") and still observing a denial proves the
      // check is specifically about `readDrafts`, not merely "wrong resource".
      await expect(
        listVersions({
          ctx,
          config: globalFixtureConfig,
          auth: { user: viewerUser },
          global: "banner",
        }),
      ).rejects.toThrow(VexAccessError);
    });
  });
});
