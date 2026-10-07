import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { saveDraft } from "./saveDraft.server";
import { publish } from "./publish.server";
import { defineCollection, defineGlobal, relationship, text } from "../../index";

const versionedPosts = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text({ required: true }) },
  versions: { drafts: true },
});

const fixtureConfig = { collections: [versionedPosts] } as unknown as VexConfig;

const versionedBanner = defineGlobal({
  slug: "banner",
  label: "Banner",
  fields: { message: text({ label: "Message", required: true }) },
  versions: { drafts: true },
});

const globalFixtureConfig = { collections: [], globals: [versionedBanner] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("publish (server)", () => {
  test("throws when there is no draft to publish, and writes nothing", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
      });
      await expect(
        publish({ ctx, config: fixtureConfig, collection: "posts", id: publishedId }),
      ).rejects.toThrow(/No draft to publish/);
      const row = await ctx.db.get(publishedId);
      expect(row?.title).toBe("Original");
      expect(await ctx.db.query("vex_versions").collect()).toHaveLength(0);
    });
  });

  test("publishing a never-published draft promotes it in place, keeping its own _id, and records one history row", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const draftId = await ctx.db.insert("posts", {
        title: "Draft content",
        slug: "draft-content",
        vex_status: "draft",
      });

      const returnedId = await publish({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: draftId,
        auth: { user: { _id: "user_1" } },
      });

      expect(returnedId).toBe(draftId);
      const row = await ctx.db.get(draftId);
      expect(row?.vex_status).toBe("published");
      expect(typeof row?.vex_publishedAt).toBe("number");

      const versions = await ctx.db
        .query("vex_versions")
        .withIndex("by_document_version", (q) =>
          // @ts-expect-error chain compound index fields on GenericDataModel
          q.eq("collection", "posts").eq("documentId", String(draftId)),
        )
        .collect();
      expect(versions.map((v) => v.status)).toEqual(["published"]);
      expect(versions[0]?.snapshot).toMatchObject({
        title: "Draft content",
        slug: "draft-content",
      });
      expect(versions[0]?.publishedAt).toBe(row?.vex_publishedAt);
      expect(versions[0]?.createdBy).toBe("user_1");
    });
  });

  test("publishing a draft with a published parent copies its fields onto the published row, deletes the draft, and preserves the published _id", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
      });
      const referencerId = await ctx.db.insert("posts", {
        title: "Referencer",
        slug: "referencer",
        vex_status: "published",
        parent: [publishedId],
      });

      const draftId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "Edited" },
      });

      const returnedId = await publish({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: draftId as never,
      });

      expect(returnedId).toBe(publishedId);
      const row = await ctx.db.get(publishedId);
      expect(row?.title).toBe("Edited");
      expect(row?.vex_status).toBe("published");
      expect(await ctx.db.get(draftId as never)).toBeNull();

      const referencerRow = await ctx.db.get(referencerId);
      expect(referencerRow?.parent).toEqual([publishedId]);
    });
  });

  test("archives the superseded published state with its original publishedAt", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const t0 = 1700000000000;
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
        vex_publishedAt: t0,
      });
      const draftId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "Edited" },
      });

      await publish({ ctx, config: fixtureConfig, collection: "posts", id: draftId as never });

      const versions = await ctx.db
        .query("vex_versions")
        .withIndex("by_document_version", (q) =>
          // @ts-expect-error chain compound index fields on GenericDataModel
          q.eq("collection", "posts").eq("documentId", String(publishedId)),
        )
        .collect();
      // `saveDraft`'s own bootstrap already recorded one "published" row for
      // the pre-edit state; `publish` records a SECOND one for the state it
      // just overwrote — every transition gets its own immutable node
      // (decision 11), even when adjacent content happens to match.
      const publishedVersions = versions.filter((v) => v.status === "published");
      expect(publishedVersions).toHaveLength(2);
      const latest = publishedVersions.reduce((a, b) =>
        (a.version ?? 0) > (b.version ?? 0) ? a : b,
      );
      expect(latest.snapshot).toMatchObject({ title: "Original" });
      expect(latest.publishedAt).toBe(t0);
    });
  });

  test("rejects a draft missing a required field, naming it, without writing anything", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
      });
      const draftId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { slug: "" },
      });

      let caught: unknown;
      try {
        await publish({ ctx, config: fixtureConfig, collection: "posts", id: draftId as never });
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(ConvexError);
      expect((caught as ConvexError<{ errors: string }>).data.errors).toContain("slug");
      const row = await ctx.db.get(publishedId);
      expect(row?.title).toBe("Original");
      expect(await ctx.db.get(draftId as never)).not.toBeNull();
    });
  });

  test("rejects publishing while a relationship field points at another draft, naming the field, without writing anything", async () => {
    const t = convexTest(schema, modules);
    const versionedPostsWithRelationship = defineCollection({
      slug: "posts",
      fields: {
        title: text(),
        slug: text({ required: true }),
        parent: relationship({ collection: { slug: "posts" }, hasMany: true }),
      },
      versions: { drafts: true },
    });
    const relationshipConfig = {
      collections: [versionedPostsWithRelationship],
    } as unknown as VexConfig;

    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const aId = await ctx.db.insert("posts", { title: "A", slug: "a", vex_status: "draft" });
      const bId = await ctx.db.insert("posts", {
        title: "B",
        slug: "b",
        vex_status: "published",
        parent: [],
      });

      const bDraftId = await saveDraft({
        ctx,
        config: relationshipConfig,
        collection: "posts",
        id: bId,
        data: { parent: [aId] },
      });

      let caught: unknown;
      try {
        await publish({
          ctx,
          config: relationshipConfig,
          collection: "posts",
          id: bDraftId as never,
        });
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(ConvexError);
      expect((caught as ConvexError<{ field: string }>).data.field).toBe("parent");
      const bRow = await ctx.db.get(bId);
      expect(bRow?.parent).toEqual([]);
      expect(await ctx.db.get(bDraftId as never)).not.toBeNull();
    });
  });

  test("throws before writing anything when the collection does not have drafts enabled", async () => {
    const t = convexTest(schema, modules);
    const nonVersionedPosts = defineCollection({ slug: "posts", fields: { title: text() } });
    const config = { collections: [nonVersionedPosts] } as unknown as VexConfig;
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        publish({ ctx, config, collection: "posts", id: "x" as never }),
      ),
    ).rejects.toThrow(/does not have drafts enabled/);
  });
});

describe("publish (server) — global target", () => {
  test("throws when there is no draft to publish", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("vex_globals", {
        slug: "banner",
        data: { message: "Live" },
        vex_status: "published",
      }),
    );
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        publish({ ctx, config: globalFixtureConfig, global: "banner" }),
      ),
    ).rejects.toThrow(/No draft to publish/);
  });

  test("publishing a global's first-ever draft promotes it in place, keeping its own _id", async () => {
    const t = convexTest(schema, modules);
    const draftId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      saveDraft({ ctx, config: globalFixtureConfig, global: "banner", data: { message: "Hello" } }),
    );

    const returnedId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      publish({ ctx, config: globalFixtureConfig, global: "banner" }),
    );

    expect(returnedId).toBe(draftId);
    const rows = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?._id).toBe(draftId);
    expect(rows[0]?.vex_status).toBe("published");
    expect(rows[0]?.data).toEqual({ message: "Hello" });
  });

  test("publishing a global's draft with a published parent copies its fields onto the published row and deletes the draft", async () => {
    const t = convexTest(schema, modules);
    const publishedId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("vex_globals", {
        slug: "banner",
        data: { message: "Live" },
        vex_status: "published",
        vex_publishedAt: 1700000000000,
      }),
    );
    const draftId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      saveDraft({
        ctx,
        config: globalFixtureConfig,
        global: "banner",
        data: { message: "Live, edited" },
      }),
    );

    const returnedId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      publish({ ctx, config: globalFixtureConfig, global: "banner" }),
    );

    expect(returnedId).toBe(publishedId);
    const rows = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.data).toEqual({ message: "Live, edited" });
    expect(
      await t.run((ctx: GenericMutationCtx<GenericDataModel>) => ctx.db.get(draftId as never)),
    ).toBeNull();
  });

  test("throws before writing anything when the global does not have drafts enabled", async () => {
    const t = convexTest(schema, modules);
    const nonVersionedBanner = defineGlobal({
      slug: "banner",
      label: "Banner",
      fields: { message: text({ required: true }) },
    });
    const config = { collections: [], globals: [nonVersionedBanner] } as unknown as VexConfig;
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        publish({ ctx, config, global: "banner" }),
      ),
    ).rejects.toThrow(/does not have drafts enabled/);
  });

  test("throws when the global slug does not resolve", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        publish({ ctx, config: globalFixtureConfig, global: "doesNotExist" as never }),
      ),
    ).rejects.toThrow(/No global registered/);
  });
});
