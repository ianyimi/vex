import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../../../db/test/convex/_generated/api";
import schema from "../../../db/test/convex/schema";
import type { VexConfig } from "../../../config";
import { saveDraft } from "../saveDraft/server";
import { unpublish } from "./server";
import { defineCollection, defineGlobal, text } from "../../../index";

const versionedPosts = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text() },
  versions: { drafts: true },
});

const fixtureConfig = { collections: [versionedPosts], globals: [] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("unpublish (server) — collection target", () => {
  test("rejects while a draft row exists for the document", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
      });
      await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "Edited" },
      });

      await expect(
        unpublish({ ctx, config: fixtureConfig, collection: "posts", id: publishedId }),
      ).rejects.toThrow(ConvexError);

      const publishedRow = await ctx.db.get(publishedId);
      expect(publishedRow?.vex_status).toBe("published");
    });
  });

  test("with no earlier published version: goes offline, clearing publishedAt, writing no history row", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const t0 = 1700000000000;
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
        vex_publishedAt: t0,
      });
      await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: String(publishedId),
        version: 1,
        status: "published",
        snapshot: { title: "Original", slug: "original" },
        publishedAt: t0,
      });

      const returnedId = await unpublish({ ctx, config: fixtureConfig, collection: "posts", id: publishedId });
      expect(returnedId).toBe(String(publishedId));

      // Explicit unpublish removes the "was live" stamp on both rows.
      const row = await ctx.db.get(publishedId);
      expect(row?.vex_status).toBe("draft");
      expect(row?.vex_publishedAt).toBeUndefined();

      const versions = await ctx.db
        .query("vex_versions")
        .withIndex("by_document_version", (q) =>
          // @ts-expect-error chain compound index fields on GenericDataModel
          q.eq("collection", "posts").eq("documentId", String(publishedId)),
        )
        .collect();
      expect(versions).toHaveLength(1); // no new row
      expect(versions[0]?.status).toBe("draft");
      expect(versions[0]?.publishedAt).toBeUndefined();
    });
  });

  test("with an earlier published version: promotes its snapshot in place and stays published", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const t1 = 1700000000000;
      const t2 = 1700000100000;
      const publishedId = await ctx.db.insert("posts", {
        title: "Second",
        slug: "second",
        vex_status: "published",
        vex_publishedAt: t2,
      });
      await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: String(publishedId),
        version: 1,
        status: "published",
        snapshot: { title: "First", slug: "first" },
        publishedAt: t1,
      });
      await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: String(publishedId),
        version: 2,
        status: "published",
        snapshot: { title: "Second", slug: "second" },
        publishedAt: t2,
      });

      await unpublish({ ctx, config: fixtureConfig, collection: "posts", id: publishedId });

      // Same _id, previous content, previous publishedAt, still published.
      const row = await ctx.db.get(publishedId);
      expect(row?.vex_status).toBe("published");
      expect(row?.title).toBe("First");
      expect(row?.slug).toBe("first");
      expect(row?.vex_publishedAt).toBe(t1);
      expect(row?.vex_activeVersion).toBe(1);

      const versions = await ctx.db
        .query("vex_versions")
        .withIndex("by_document_version", (q) =>
          // @ts-expect-error chain compound index fields on GenericDataModel
          q.eq("collection", "posts").eq("documentId", String(publishedId)),
        )
        .collect();
      expect(versions).toHaveLength(2); // no new row
      const demoted = versions.find((v) => v.version === 2);
      expect(demoted?.status).toBe("draft");
      expect(demoted?.publishedAt).toBeUndefined();
      const promoted = versions.find((v) => v.version === 1);
      expect(promoted?.status).toBe("published");
      expect(promoted?.publishedAt).toBe(t1);
    });
  });

  test("round-trips through a second saveDraft without producing a second draft row", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
      });

      await unpublish({ ctx, config: fixtureConfig, collection: "posts", id: publishedId });
      const returnedId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "Edited again" },
      });

      expect(returnedId).toBe(publishedId);
      const rows = await ctx.db.query("posts").collect();
      expect(rows).toHaveLength(1);
      expect(rows[0]?.title).toBe("Edited again");
    });
  });

  test("throws when the target document has never been published", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const draftId = await ctx.db.insert("posts", { title: "Draft", slug: "draft", vex_status: "draft" });

      await expect(
        unpublish({ ctx, config: fixtureConfig, collection: "posts", id: draftId }),
      ).rejects.toThrow(ConvexError);
    });
  });
});

const versionedBanner = defineGlobal({
  slug: "banner",
  label: "Banner",
  fields: { message: text() },
  versions: { drafts: true },
});

const globalFixtureConfig = { collections: [], globals: [versionedBanner] } as unknown as VexConfig;

describe("unpublish (server) — global target", () => {
  test("demotes the published vex_globals row offline, clearing publishedAt, writing no history row", async () => {
    const t = convexTest(schema, modules);
    const publishedAt = 1700000000000;
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "banner",
        data: { message: "Live" },
        vex_status: "published",
        vex_publishedAt: publishedAt,
      });
      await ctx.db.insert("vex_versions", {
        collection: "vex_globals",
        documentId: "banner",
        version: 1,
        status: "published",
        snapshot: { message: "Live" },
        publishedAt,
      });
    });

    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await unpublish({ ctx, config: globalFixtureConfig, global: "banner" });
    });

    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const rows = await ctx.db
        .query("vex_globals")
        .withIndex("by_slug", (q) => q.eq("slug", "banner"))
        .collect();
      expect(rows).toHaveLength(1);
      expect(rows[0]?.vex_status).toBe("draft");
      expect(rows[0]?.vex_publishedAt).toBeUndefined();
      expect(rows[0]?.data).toEqual({ message: "Live" });

      const versions = await ctx.db
        .query("vex_versions")
        .withIndex("by_document_version", (q) =>
          // @ts-expect-error chain compound index fields on GenericDataModel
          q.eq("collection", "vex_globals").eq("documentId", "banner"),
        )
        .collect();
      expect(versions).toHaveLength(1); // no new row
      expect(versions[0]?.status).toBe("draft");
      expect(versions[0]?.publishedAt).toBeUndefined();
    });
  });

  test("rejects while an outstanding draft exists for the global", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "banner",
        data: { message: "Live" },
        vex_status: "published",
        vex_publishedAt: 1700000000000,
      });
    });

    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      saveDraft({ ctx, config: globalFixtureConfig, global: "banner", data: { message: "Live, edited" } }),
    );

    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        unpublish({ ctx, config: globalFixtureConfig, global: "banner" }),
      ),
    ).rejects.toThrow(ConvexError);
  });

  test("throws when the global has never been published", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        unpublish({ ctx, config: globalFixtureConfig, global: "banner" }),
      ),
    ).rejects.toThrow(ConvexError);
  });
});
