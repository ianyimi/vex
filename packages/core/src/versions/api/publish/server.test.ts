import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { CommitTsPlaceholder, ConvexError, type GenericId } from "convex/values";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../../../db/test/convex/_generated/api";
import schema from "../../../db/test/convex/schema";
import type { VexConfig } from "../../../config";
import { saveDraft } from "../saveDraft/server";
import { assertUniqueAmongPublished } from "../../assertUniqueAmongPublished";
import { publish } from "./server";
import { commitTs, defineCollection, defineGlobal, relationship, text } from "../../../index";
import type { AdminField } from "../../../fields";

const versionedPosts = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text({ required: true }) },
  versions: { drafts: true },
});

const fixtureConfig = { collections: [versionedPosts] } as unknown as VexConfig;

// ── Draft-pair pagination fix follow-up: publish must not collide with its
// own row (`docId` threaded through `prepareEdit` to `publishShared`, and
// `assertUniqueAmongPublished` excluding both the published row and its
// linked draft via `vex_publishedId`) ─────────────────────────────────────
const versionedPostsWithUniqueSlug = defineCollection({
  slug: "posts",
  fields: {
    title: text(),
    slug: text({
      required: true,
      validate: async ({ value, doc, ctx }) => {
        // `doc` is narrowed only to "has an _id key" above — cast the
        // value itself to the id type `assertUniqueAmongPublished` expects.
        const docId = (
          typeof doc === "object" && doc !== null && "_id" in doc ? doc._id : undefined
        ) as GenericId<"posts"> | undefined;
        await assertUniqueAmongPublished({
          ctx,
          collection: "posts",
          indexName: "by_slug",
          field: "slug",
          value,
          excludeId: docId,
        });
      },
    }),
  },
  versions: { drafts: true },
});
const uniqueSlugConfig = { collections: [versionedPostsWithUniqueSlug] } as unknown as VexConfig;

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
  test("throws when there is no draft and no data, and writes nothing", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
      });
      await expect(
        publish({ ctx, config: fixtureConfig, collection: "posts", id: publishedId }),
      ).rejects.toThrow(/Nothing to publish/);
      const row = await ctx.db.get(publishedId);
      expect(row?.title).toBe("Original");
      expect(await ctx.db.query("vex_versions").collect()).toHaveLength(0);
    });
  });

  test("publishing a published row with data updates the same row, records its prior state once, and writes no draft row", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
      });

      const returnedId = await publish({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "Edited directly" },
      });

      expect(returnedId).toBe(publishedId);
      const row = await ctx.db.get(publishedId);
      expect(row?.title).toBe("Edited directly");
      expect(row?.vex_status).toBe("published");

      const versions = await ctx.db
        .query("vex_versions")
        .withIndex("by_document_version", (q) =>
          // @ts-expect-error chain compound index fields on GenericDataModel
          q.eq("collection", "posts").eq("documentId", String(publishedId)),
        )
        .collect();
      expect(versions.map((v) => [v.version, v.status, v.parentVersion])).toEqual([
        [1, "published", undefined],
        [2, "published", 1],
      ]);
      expect(versions[0]?.snapshot).toMatchObject({ title: "Original" });
      expect(versions[1]?.snapshot).toMatchObject({ title: "Edited directly" });

      const allPosts = await ctx.db.query("posts").collect();
      expect(allPosts).toHaveLength(1);
    });
  });

  test("publishing a draft with data merges data over the draft's fields and deletes the draft", async () => {
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
        data: { title: "Draft edit" },
      });

      const returnedId = await publish({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: draftId as never,
        data: { title: "Overridden at publish" },
      });

      expect(returnedId).toBe(publishedId);
      const row = await ctx.db.get(publishedId);
      expect(row?.title).toBe("Overridden at publish");
      expect(await ctx.db.get(draftId as never)).toBeNull();
    });
  });

  test("rejects publishing invalid data, writing nothing", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
      });

      await expect(
        publish({
          ctx,
          config: fixtureConfig,
          collection: "posts",
          id: publishedId,
          data: { slug: "" },
        }),
      ).rejects.toThrow();

      const row = await ctx.db.get(publishedId);
      expect(row?.title).toBe("Original");
      expect(row?.slug).toBe("original");
      const allPosts = await ctx.db.query("posts").collect();
      expect(allPosts).toHaveLength(1);
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

  test("publishing a saved draft marks that draft's version row published instead of adding a row", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
        vex_publishedAt: 1700000000000,
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
      expect(versions.map((v) => [v.version, v.status])).toEqual([
        [1, "published"],
        [2, "published"],
      ]);
      expect(versions[1]?.snapshot).toMatchObject({ title: "Edited" });
      expect(versions[1]?.publishedAt).toBeGreaterThan(1700000000000);
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

  test("publishing an older version writes its snapshot to the published row, deletes the draft, and adds no history row", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "V1",
        slug: "s",
        vex_status: "published",
        vex_publishedAt: 1000,
      });
      const draftId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "V2" },
      });
      await ctx.db.patch(publishedId, { body: "added after v1" });
      const historyBefore = await ctx.db.query("vex_versions").collect();

      const returnedId = await publish({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: draftId as never,
        version: 1,
      });

      expect(returnedId).toBe(publishedId);
      const row = await ctx.db.get(publishedId);
      expect(row?.title).toBe("V1");
      expect(row?.body).toBeUndefined();
      expect(row?.vex_publishedAt).toBeGreaterThan(1000);
      expect(await ctx.db.get(draftId as never)).toBeNull();
      expect(await ctx.db.query("vex_versions").collect()).toHaveLength(historyBefore.length);
    });
  });

  test("publishing an older version with edits records one published history row parented on that version", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "V1",
        slug: "s",
        vex_status: "published",
      });
      const draftId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "V2" },
      });

      await publish({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: draftId as never,
        version: 1,
        data: { title: "V1 edited" },
      });

      expect((await ctx.db.get(publishedId))?.title).toBe("V1 edited");
      const versions = await ctx.db.query("vex_versions").collect();
      expect(versions).toHaveLength(3);
      expect(versions.at(-1)).toMatchObject({
        version: 3,
        status: "published",
        parentVersion: 1,
        snapshot: { title: "V1 edited", slug: "s" },
      });
    });
  });

  test("publishing an older draft version marks that version's row published without adding a row", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "V1",
        slug: "s",
        vex_status: "published",
      });
      const draftId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "V2" },
      });
      await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: draftId as never,
        data: { title: "V3" },
      });

      await publish({ ctx, config: fixtureConfig, collection: "posts", id: draftId as never, version: 2 });

      expect((await ctx.db.get(publishedId))?.title).toBe("V2");
      const versions = await ctx.db.query("vex_versions").collect();
      expect(versions.map((v) => [v.version, v.status])).toEqual([
        [1, "published"],
        [2, "published"],
        [3, "draft"],
      ]);
      expect(versions[1]?.publishedAt).toBeTypeOf("number");
    });
  });

  test("publishing a version that does not exist throws and writes nothing", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const draftId = await ctx.db.insert("posts", {
        title: "Draft",
        slug: "d",
        vex_status: "draft",
      });

      await expect(
        publish({ ctx, config: fixtureConfig, collection: "posts", id: draftId, version: 99 }),
      ).rejects.toThrow(/Version 99 does not exist/);
      expect((await ctx.db.get(draftId))?.vex_status).toBe("draft");
    });
  });
});

describe("publish (server) — regression: publish must not collide with its own row (Fix D follow-up)", () => {
  test("first publish of a brand-new draft succeeds (the draft's own unlinked row must exclude itself)", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const draftId = await ctx.db.insert("posts", {
        title: "Smoke test",
        slug: "committs-smoke-test",
        vex_status: "draft",
      });
      const publishedId = await publish({
        ctx,
        config: uniqueSlugConfig,
        collection: "posts",
        id: draftId,
      });
      expect(publishedId).toBe(draftId);
      expect((await ctx.db.get(draftId))?.vex_status).toBe("published");
    });
  });

  test("re-publishing an already-published doc with an unchanged slug succeeds", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "same-slug",
        vex_status: "published",
      });
      const draftId = await saveDraft({
        ctx,
        config: uniqueSlugConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "Edited" },
      });
      const returnedId = await publish({
        ctx,
        config: uniqueSlugConfig,
        collection: "posts",
        id: draftId as never,
      });
      expect(returnedId).toBe(publishedId);
      expect((await ctx.db.get(publishedId))?.title).toBe("Edited");
      expect((await ctx.db.get(publishedId))?.slug).toBe("same-slug");
    });
  });

  test("publishing with a slug already taken by ANOTHER published doc still fails", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", {
        title: "Taken",
        slug: "taken-slug",
        vex_status: "published",
      });
      const draftId = await ctx.db.insert("posts", {
        title: "New",
        slug: "taken-slug",
        vex_status: "draft",
      });
      await expect(
        publish({ ctx, config: uniqueSlugConfig, collection: "posts", id: draftId }),
      ).rejects.toThrow();
    });
  });

  test("publishing with a slug already taken by another UNLINKED draft still fails (Fix D's own intent)", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", {
        title: "Other unlinked draft",
        slug: "shared-slug",
        vex_status: "draft",
      });
      const draftId = await ctx.db.insert("posts", {
        title: "New",
        slug: "shared-slug",
        vex_status: "draft",
      });
      await expect(
        publish({ ctx, config: uniqueSlugConfig, collection: "posts", id: draftId }),
      ).rejects.toThrow();
    });
  });
});

describe("publish (server) — global target", () => {
  test("throws when there is no draft and no data", async () => {
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
    ).rejects.toThrow(/Nothing to publish/);
  });

  test("publishing a published global with data updates the same row and writes no draft row", async () => {
    const t = convexTest(schema, modules);
    const publishedId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("vex_globals", {
        slug: "banner",
        data: { message: "Live" },
        vex_status: "published",
      }),
    );

    const returnedId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      publish({
        ctx,
        config: globalFixtureConfig,
        global: "banner",
        data: { message: "Edited directly" },
      }),
    );

    expect(returnedId).toBe(publishedId);
    const rows = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.data).toEqual({ message: "Edited directly" });
  });

  test("publishing a global draft with data merges data over the draft and deletes the draft", async () => {
    const t = convexTest(schema, modules);
    const publishedId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("vex_globals", {
        slug: "banner",
        data: { message: "Live" },
        vex_status: "published",
      }),
    );
    const draftId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      saveDraft({
        ctx,
        config: globalFixtureConfig,
        global: "banner",
        data: { message: "Draft edit" },
      }),
    );

    const returnedId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      publish({
        ctx,
        config: globalFixtureConfig,
        global: "banner",
        data: { message: "Overridden at publish" },
      }),
    );

    expect(returnedId).toBe(publishedId);
    const rows = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.data).toEqual({ message: "Overridden at publish" });
    expect(
      await t.run((ctx: GenericMutationCtx<GenericDataModel>) => ctx.db.get(draftId as never)),
    ).toBeNull();
  });

  test("rejects publishing invalid data on a global, writing nothing", async () => {
    const t = convexTest(schema, modules);
    const publishedId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("vex_globals", {
        slug: "banner",
        data: { message: "Live" },
        vex_status: "published",
      }),
    );

    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        publish({
          ctx,
          config: globalFixtureConfig,
          global: "banner",
          data: { message: "" },
        }),
      ),
    ).rejects.toThrow();

    const rows = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?._id).toBe(publishedId);
    expect(rows[0]?.data).toEqual({ message: "Live" });
  });

  test("publishing a global with no rows and data inserts a published row", async () => {
    const t = convexTest(schema, modules);

    const returnedId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      publish({
        ctx,
        config: globalFixtureConfig,
        global: "banner",
        data: { message: "First publish" },
      }),
    );

    const rows = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?._id).toBe(returnedId);
    expect(rows[0]?.vex_status).toBe("published");
    expect(rows[0]?.data).toEqual({ message: "First publish" });
    expect(typeof rows[0]?.vex_publishedAt).toBe("number");

    const versions = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_versions").collect(),
    );
    expect(versions.map((v) => v.status)).toEqual(["published"]);
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

  test("publishing an older version of a global replaces its data and deletes the draft without a history row", async () => {
    const t = convexTest(schema, modules);
    const publishedId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("vex_globals", {
        slug: "banner",
        data: { message: "Live" },
        vex_status: "published",
      }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      saveDraft({ ctx, config: globalFixtureConfig, global: "banner", data: { message: "Edited" } }),
    );

    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      publish({ ctx, config: globalFixtureConfig, global: "banner", version: 1 }),
    );

    const rows = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?._id).toBe(publishedId);
    expect(rows[0]?.data).toEqual({ message: "Live" });
    const versions = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_versions").collect(),
    );
    expect(versions).toHaveLength(2);
  });
});

describe("publish (server) — commitTs on-policy", () => {
  test.each(["save", "publish", "all"] as const)(
    "an on: '%s' field is stamped with a CommitTsPlaceholder on publish",
    async (on) => {
      const config = {
        collections: [
          defineCollection({
            slug: "posts",
            fields: {
              title: text(),
              slug: text({ required: true }),
              updatedAt: commitTs({ on, meta: { locked: true } }),
            } as Record<string, AdminField>,
            versions: { drafts: true },
          }),
        ],
      } as unknown as VexConfig;
      const t = convexTest(schema, modules);
      await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const draftId = await ctx.db.insert("posts", {
          title: "Draft",
          slug: "draft",
          vex_status: "draft",
        });
        await publish({ ctx, config, collection: "posts", id: draftId });
        const row = await ctx.db.get(draftId);
        expect(row?.updatedAt).toBeInstanceOf(CommitTsPlaceholder);
      });
    },
  );
});

describe("publish (server) — owner rules on a first-ever publish", () => {
  const ownedPosts = defineCollection({
    slug: "posts",
    fields: {
      title: text(),
      slug: text({ required: true }),
      author: relationship({ collection: { slug: "authors" } }),
    },
    versions: { drafts: true },
  });
  const ownerConfig = {
    collections: [ownedPosts],
    access: {
      enabled: true,
      roles: ["author"],
      defaultPermissionMode: "allow",
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        author: {
          posts: {
            publish: ({ user, data }: { user: { _id?: string }; data?: { author?: string[] } }) =>
              data?.author?.[0] === user._id,
          },
        },
      },
    },
  } as unknown as VexConfig;

  test("the owner may publish a draft-only document that was never published", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const ownerId = await ctx.db.insert("authors", { name: "A", slug: "a" });
      const draftId = await ctx.db.insert("posts", {
        title: "Mine",
        slug: "mine",
        author: [ownerId],
        vex_status: "draft",
      });
      const publishedId = await publish({
        ctx,
        config: ownerConfig,
        collection: "posts",
        id: draftId,
        auth: { user: { _id: ownerId, roles: ["author"] } } as never,
      });
      const row = await ctx.db.get(publishedId as GenericId<"posts">);
      expect(row?.vex_status).toBe("published");
    });
  });

  test("a non-owner is still denied the same first-ever publish", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const ownerId = await ctx.db.insert("authors", { name: "A", slug: "a" });
      const otherId = await ctx.db.insert("authors", { name: "B", slug: "b" });
      const draftId = await ctx.db.insert("posts", {
        title: "Mine",
        slug: "mine",
        author: [ownerId],
        vex_status: "draft",
      });
      await expect(
        publish({
          ctx,
          config: ownerConfig,
          collection: "posts",
          id: draftId,
          auth: { user: { _id: otherId, roles: ["author"] } } as never,
        }),
      ).rejects.toThrow(/posts\/publish/);
    });
  });
});
