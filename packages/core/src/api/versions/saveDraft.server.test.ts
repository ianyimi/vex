import { convexTest } from "convex-test";
import type { GenericId } from "convex/values";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { saveDraft } from "./saveDraft.server";
import { defineCollection, defineGlobal, text } from "../../index";
import { VexAccessError } from "../../access";

/**
 * `posts` here is declared with `versions: { drafts: true }` — the shared fixture
 * table (`api/test/convex/schema.ts`, extended by Step 4) already carries
 * `vex_status`/`vex_publishedAt`/`vex_publishedId` + `vex_versions`; this config
 * object only needs to opt this test's collection into the draft workflow.
 */
const versionedPosts = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text() },
  versions: { drafts: true },
});

const fixtureConfig = { collections: [versionedPosts] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("saveDraft (server)", () => {
  test("bootstraps a draft row on first edit of a published document, snapshotting v1 published", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
      });

      const returnedId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "Edited" },
      });

      expect(returnedId).not.toBe(publishedId);

      const draftRow = await ctx.db.get("posts", returnedId as GenericId<"posts">);
      expect(draftRow?.vex_status).toBe("draft");
      expect(draftRow?.vex_publishedId).toBe(publishedId);
      expect(draftRow?.title).toBe("Edited");
      expect(draftRow?.slug).toBe("original");

      const publishedRow = await ctx.db.get(publishedId);
      expect(publishedRow?.title).toBe("Original");

      const versions = await ctx.db
        .query("vex_versions")
        .withIndex("by_document_version", (q) =>
          q.eq("collection", "posts").eq("documentId", String(publishedId)),
        )
        .collect();
      // v1 is the published baseline recorded at bootstrap; v2 is this save.
      expect(versions.map((v) => [v.version, v.status])).toEqual([
        [1, "published"],
        [2, "draft"],
      ]);
      expect(versions[0]?.snapshot).toMatchObject({ title: "Original" });
      expect(versions[1]?.snapshot).toMatchObject({ title: "Edited", slug: "original" });
    });
  });

  test("repeated saves patch the same draft row — bootstrap fires exactly once", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
      });

      const firstId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "Edit one" },
      });
      const secondId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "Edit two" },
      });

      expect(secondId).toBe(firstId);

      const draftRows = await ctx.db
        .query("posts")
        .withIndex("by_published", (q) => q.eq("vex_publishedId", publishedId))
        .collect();
      expect(draftRows).toHaveLength(1);
      expect(draftRows[0]?.title).toBe("Edit two");

      const versions = await ctx.db
        .query("vex_versions")
        .withIndex("by_document_version", (q) =>
          q.eq("collection", "posts").eq("documentId", String(publishedId)),
        )
        .collect();
      expect(versions.filter((v) => v.status === "published")).toHaveLength(1);
      expect(versions.filter((v) => v.status === "draft")).toHaveLength(2);
    });
  });

  test("a row with no vex_status (pre-backfill) is treated as published — repeated saves reuse one draft", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      // Written before `versions.drafts` was enabled: no `vex_status` at all.
      const legacyId = await ctx.db.insert("posts", { title: "Legacy", slug: "legacy" });

      const firstId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: legacyId,
        data: { title: "Edit one" },
      });
      const secondId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: legacyId,
        data: { title: "Edit two" },
      });

      expect(secondId).toBe(firstId);
      const draftRows = await ctx.db
        .query("posts")
        .withIndex("by_published", (q) => q.eq("vex_publishedId", legacyId))
        .collect();
      expect(draftRows).toHaveLength(1);
      const legacyRow = await ctx.db.get("posts", legacyId);
      expect(legacyRow?.title).toBe("Legacy");
    });
  });

  test("saving a never-published document patches it directly — no bootstrap, no second row", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const draftId = await ctx.db.insert("posts", {
        title: "",
        slug: "new-post",
        vex_status: "draft",
      });

      const returnedId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: draftId,
        data: { title: "First real content" },
      });

      expect(returnedId).toBe(draftId);

      const versions = await ctx.db
        .query("vex_versions")
        .withIndex("by_document_version", (q) =>
          q.eq("collection", "posts").eq("documentId", String(draftId)),
        )
        .collect();
      expect(versions.filter((v) => v.status === "draft")).toHaveLength(1);
      expect(versions.filter((v) => v.status === "published")).toHaveLength(0);
    });
  });

  test("a role restricted to one field on update carries the SAME restriction on saveDraft", async () => {
    const t = convexTest(schema, modules);
    const guardedConfig = {
      collections: [versionedPosts],
      access: {
        // `enabled` is required on a hand-built config: `hasPermission` treats a
        // falsy `enabled` as "RBAC off" and allows everything.
        enabled: true,
        roles: ["editor"],
        defaultPermissionMode: "allow",
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          editor: {
            posts: {
              // Mirrors `update.server.test.ts`'s "rejects a save that changes a
              // denied field" regression: only `title` is writable.
              saveDraft: () => ({ "*": false, title: true }),
            },
          },
        },
      },
    } as unknown as VexConfig;
    const auth = { user: { roles: ["editor"] } };

    await t.run(async (ctx) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
      });

      const draftId = await saveDraft({
        ctx,
        config: guardedConfig,
        collection: "posts",
        id: publishedId,
        auth,
        data: { title: "ok" },
      });

      let caught: unknown;
      try {
        await saveDraft({
          ctx,
          config: guardedConfig,
          collection: "posts",
          id: draftId as never,
          auth,
          data: { slug: "not-allowed" },
        });
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(VexAccessError);
      expect((caught as VexAccessError).field).toBe("slug");

      const draftRow = await ctx.db.get("posts", draftId as GenericId<"posts">);
      expect(draftRow?.slug).toBe("original");
    });
  });

  test("strips reserved version fields from the incoming data payload before merging", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
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
        data: {
          title: "ok",
          vex_status: "published",
          vex_publishedId: publishedId,
        },
      });

      const draftRow = await ctx.db.get("posts", draftId as GenericId<"posts">);
      expect(draftRow?.vex_status).toBe("draft");
    });
  });

  test("throws before writing anything when the collection does not have drafts enabled", async () => {
    const plainPosts = defineCollection({ slug: "posts", fields: { title: text(), slug: text() } });
    const plainConfig = { collections: [plainPosts] } as unknown as VexConfig;
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const postId = await ctx.db.insert("posts", { title: "Original", slug: "original" });

      await expect(
        saveDraft({
          ctx,
          config: plainConfig,
          collection: "posts",
          id: postId,
          data: { title: "Edited" },
        }),
      ).rejects.toThrow(/drafts enabled/);

      expect(await ctx.db.query("posts").collect()).toHaveLength(1);
      expect(await ctx.db.query("vex_versions").collect()).toHaveLength(0);
    });
  });

  test("every draft history row carries the published row's publishedAt, whichever id the caller holds", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
        vex_publishedAt: 1234,
      });

      // Caller holds the published id — published row already loaded.
      const draftId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "Edit one" },
      });
      // Caller holds the draft's own id — published row fetched separately.
      await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: draftId as GenericId<"posts">,
        data: { title: "Edit two" },
      });

      const versions = await ctx.db
        .query("vex_versions")
        .withIndex("by_document_version", (q) =>
          q.eq("collection", "posts").eq("documentId", String(publishedId)),
        )
        .collect();
      expect(versions.map((v) => [v.status, v.publishedAt])).toEqual([
        ["published", 1234],
        ["draft", 1234],
        ["draft", 1234],
      ]);
    });
  });

  test("a never-published draft's history rows carry no publishedAt", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const draftId = await ctx.db.insert("posts", {
        title: "New",
        slug: "new",
        vex_status: "draft",
      });

      await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: draftId,
        data: { title: "Still new" },
      });

      const [version] = await ctx.db.query("vex_versions").collect();
      expect(version?.publishedAt).toBeUndefined();
    });
  });

  test("clearing a required field saves the draft with it empty (draft validation is lenient)", async () => {
    const requiredSlugPosts = defineCollection({
      slug: "posts",
      fields: { title: text(), slug: text({ required: true }) },
      versions: { drafts: true },
    });
    const requiredSlugConfig = { collections: [requiredSlugPosts] } as unknown as VexConfig;

    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
      });

      const draftId = await saveDraft({
        ctx,
        config: requiredSlugConfig,
        collection: "posts",
        id: publishedId,
        data: { slug: "" },
      });

      const draftRow = await ctx.db.get("posts", draftId as GenericId<"posts">);
      expect(draftRow?.vex_status).toBe("draft");
      expect(draftRow?.slug).toBe("");
      expect(draftRow?.title).toBe("Original");
    });
  });
});

/**
 * `banner` is a versioned global — `vex_globals` is the shared table every
 * global's rows live in, distinguished by `slug` + `vex_status`, exactly as
 * a versioned collection's own table distinguishes its rows via
 * `vex_status`/`vex_publishedId`. These tests moved here from
 * `api/globals/upsert.server.test.ts` once `upsertGlobal` stopped writing
 * drafts — `saveDraft` is now the only path that writes a global's draft row,
 * for either kind, through the SAME implementation the `posts` tests above exercise.
 */
const versionedBanner = defineGlobal({
  slug: "banner",
  label: "Banner",
  fields: { message: text({ label: "Message", required: true }) },
  versions: { drafts: true },
});

const globalFixtureConfig = { collections: [], globals: [versionedBanner] } as unknown as VexConfig;

describe("saveDraft (server) — global target", () => {
  test("a global with no rows at all gets a draft-only row", async () => {
    const t = convexTest(schema, modules);
    const draftId = await t.run((ctx) =>
      saveDraft({
        ctx,
        config: globalFixtureConfig,
        global: "banner",
        data: { message: "Hello" },
      }),
    );

    const rows = await t.run((ctx) => ctx.db.query("vex_globals").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]?._id).toBe(draftId);
    expect(rows[0]?.vex_status).toBe("draft");
    expect(rows[0]?.vex_publishedId).toBeUndefined();
    expect(rows[0]?.data).toEqual({ message: "Hello" });

    const versions = await t.run((ctx) => ctx.db.query("vex_versions").collect());
    expect(versions).toHaveLength(1);
    expect(versions[0]?.status).toBe("draft");
    expect(versions[0]?.documentId).toBe("banner");
  });

  test("bootstraps a draft row and snapshots the published state on first edit after publish", async () => {
    const t = convexTest(schema, modules);
    const publishedId = await t.run((ctx) =>
      ctx.db.insert("vex_globals", {
        slug: "banner",
        data: { message: "Live" },
        vex_status: "published",
        vex_publishedAt: 1700000000000,
      }),
    );

    const draftId = await t.run((ctx) =>
      saveDraft({
        ctx,
        config: globalFixtureConfig,
        global: "banner",
        data: { message: "Live, edited" },
      }),
    );

    const rows = await t.run((ctx) => ctx.db.query("vex_globals").collect());
    expect(rows).toHaveLength(2);
    const published = rows.find((r) => r._id === publishedId);
    const draft = rows.find((r) => r._id === draftId);
    expect(published?.data).toEqual({ message: "Live" });
    expect(draft?.vex_status).toBe("draft");
    expect(draft?.vex_publishedId).toBe(publishedId);
    expect(draft?.data).toEqual({ message: "Live, edited" });

    const versions = await t.run((ctx) => ctx.db.query("vex_versions").collect());
    const publishedSnapshot = versions.find((v) => v.status === "published");
    const draftSnapshot = versions.find((v) => v.status === "draft");
    expect(publishedSnapshot?.snapshot).toEqual({ message: "Live" });
    expect(publishedSnapshot?.publishedAt).toBe(1700000000000);
    expect(draftSnapshot?.snapshot).toEqual({ message: "Live, edited" });
    expect(draftSnapshot?.publishedAt).toBe(1700000000000);
  });

  test("repeated saves reuse the one draft row — bootstrap fires exactly once", async () => {
    const t = convexTest(schema, modules);
    const firstDraftId = await t.run((ctx) =>
      saveDraft({ ctx, config: globalFixtureConfig, global: "banner", data: { message: "First" } }),
    );
    const secondDraftId = await t.run((ctx) =>
      saveDraft({ ctx, config: globalFixtureConfig, global: "banner", data: { message: "Second" } }),
    );

    expect(secondDraftId).toBe(firstDraftId);
    const rows = await t.run((ctx) => ctx.db.query("vex_globals").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]?.data).toEqual({ message: "Second" });
  });

  test("throws before writing anything when the global does not have drafts enabled", async () => {
    const t = convexTest(schema, modules);
    const nonVersionedBanner = defineGlobal({
      slug: "banner",
      label: "Banner",
      fields: { message: text({ label: "Message", required: true }) },
    });
    const config = { collections: [], globals: [nonVersionedBanner] } as unknown as VexConfig;

    await expect(
      t.run((ctx) => saveDraft({ ctx, config, global: "banner", data: { message: "Hi" } })),
    ).rejects.toThrow(/does not have drafts enabled/);
    expect(await t.run((ctx) => ctx.db.query("vex_globals").collect())).toHaveLength(0);
  });

  test("throws when the global slug does not resolve", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run((ctx) =>
        saveDraft({
          ctx,
          config: globalFixtureConfig,
          global: "doesNotExist" as never,
          data: { message: "Hi" },
        }),
      ),
    ).rejects.toThrow(/No global registered/);
  });
});
