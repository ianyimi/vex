import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, it } from "vitest";

import * as _generatedApi from "../api/test/convex/_generated/api";
import schema from "../api/test/convex/schema";
import { createVersion, findDraftRow, getLatestVersion, getVersion, listVersions } from "./model";

/** Explicit modules map for convex-test (replaces import.meta.glob which requires Vite). */
const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("createVersion + getLatestVersion", () => {
  it("returns null for a document with no version history", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getLatestVersion({ ctx, collection: "posts", documentId: "nonexistent" }),
    );
    expect(result).toBeNull();
  });

  it("assigns version 1 to a document's first snapshot", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "Hi", slug: "hi" }),
    );
    const version = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "Hi" },
      }),
    );
    expect(version).toBe(1);
    const latest = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getLatestVersion({ ctx, collection: "posts", documentId: id }),
    );
    expect(latest?.version).toBe(1);
    expect(latest?.snapshot).toEqual({ title: "Hi" });
  });

  it("increments the version number on each successive snapshot for the same document", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "A", slug: "a" }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "A" },
      }),
    );
    const second = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "B" },
      }),
    );
    expect(second).toBe(2);
    const latest = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getLatestVersion({ ctx, collection: "posts", documentId: id }),
    );
    expect(latest?.version).toBe(2);
    expect(latest?.snapshot).toEqual({ title: "B" });
  });

  it("resolves the true max by the indexed version field, not insertion order", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "X", slug: "x" }),
    );
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: id,
        version: 1,
        status: "draft",
        snapshot: { title: "v1" },
      });
      await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: id,
        version: 3,
        status: "draft",
        snapshot: { title: "v3" },
      });
      await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: id,
        version: 2,
        status: "draft",
        snapshot: { title: "v2" },
      });
    });
    const latest = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getLatestVersion({ ctx, collection: "posts", documentId: id }),
    );
    expect(latest?.version).toBe(3);
  });
});

describe("getVersion", () => {
  it("returns the exact version row requested", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "A", slug: "a" }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "v1" },
      }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "v2" },
      }),
    );
    const version1 = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getVersion({ ctx, collection: "posts", documentId: id, version: 1 }),
    );
    expect(version1?.version).toBe(1);
    expect(version1?.snapshot).toEqual({ title: "v1" });
  });

  it("returns null for a version number that does not exist", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "A", slug: "a" }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "v1" },
      }),
    );
    const missing = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getVersion({ ctx, collection: "posts", documentId: id, version: 5 }),
    );
    expect(missing).toBeNull();
  });
});

describe("listVersions", () => {
  it("returns every version newest first", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "A", slug: "a" }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "v1" },
      }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "v2" },
      }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "v3" },
      }),
    );
    const versions = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      listVersions({ ctx, collection: "posts", documentId: id }),
    );
    expect(versions.map((v) => v.version)).toEqual([3, 2, 1]);
  });

  it("respects limit", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "A", slug: "a" }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "v1" },
      }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "v2" },
      }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "v3" },
      }),
    );
    const versions = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      listVersions({ ctx, collection: "posts", documentId: id, limit: 2 }),
    );
    expect(versions.map((v) => v.version)).toEqual([3, 2]);
  });

  it("scopes to the requested collection and documentId — does not leak another document's history", async () => {
    const t = convexTest(schema, modules);
    const idA = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "A", slug: "a" }),
    );
    const idB = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "B", slug: "b" }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: idA,
        status: "draft",
        snapshot: { title: "A" },
      }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: idB,
        status: "draft",
        snapshot: { title: "B" },
      }),
    );
    const versions = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      listVersions({ ctx, collection: "posts", documentId: idA }),
    );
    expect(versions).toHaveLength(1);
    expect(versions[0]?.documentId).toBe(idA);
  });
});

describe("findDraftRow", () => {
  it("returns null when the published document has no draft", async () => {
    const t = convexTest(schema, modules);
    const publishedId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "Post", slug: "post", vex_status: "published" }),
    );
    const draft = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      findDraftRow({ ctx, collection: "posts", publishedId }),
    );
    expect(draft).toBeNull();
  });

  it("returns the draft row pointing at the given published id", async () => {
    const t = convexTest(schema, modules);
    const { publishedId, draftId } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const publishedId = await ctx.db.insert("posts", {
          title: "Post",
          slug: "post",
          vex_status: "published",
        });
        const draftId = await ctx.db.insert("posts", {
          title: "Post (edited)",
          slug: "post",
          vex_status: "draft",
          vex_publishedId: publishedId,
        });
        return { publishedId, draftId };
      },
    );
    const draft = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      findDraftRow({ ctx, collection: "posts", publishedId }),
    );
    expect(draft?._id).toBe(draftId);
    expect(draft?._id).not.toBe(publishedId);
  });
});
