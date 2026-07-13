import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import { remove } from "./server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("remove (server)", () => {
  test("deletes a single document (ID in array)", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Doomed", slug: "d" });
      await remove({ ctx, ids: [id] });
      const doc = await ctx.db.get(id);
      expect(doc).toBeNull();
    });
  });

  test("bulk deletes multiple documents", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id1 = await ctx.db.insert("posts", { title: "Post 1", slug: "p1" });
      const id2 = await ctx.db.insert("posts", { title: "Post 2", slug: "p2" });
      const id3 = await ctx.db.insert("posts", { title: "Post 3", slug: "p3" });
      
      await remove({ ctx, ids: [id1, id2, id3] });
      
      const doc1 = await ctx.db.get(id1);
      const doc2 = await ctx.db.get(id2);
      const doc3 = await ctx.db.get(id3);
      
      expect(doc1).toBeNull();
      expect(doc2).toBeNull();
      expect(doc3).toBeNull();
    });
  });

  test("soft delete marks document as deleted instead of removing", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Soft Delete Test", slug: "sdt" });
      
      await remove({ ctx, ids: [id], softDelete: "deleted" });
      
      const doc = await ctx.db.get(id);
      expect(doc).not.toBeNull();
      expect((doc as any).deleted).toBe(true);
    });
  });

  test("soft delete works with multiple documents", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id1 = await ctx.db.insert("posts", { title: "Post 1", slug: "p1" });
      const id2 = await ctx.db.insert("posts", { title: "Post 2", slug: "p2" });
      
      await remove({ ctx, ids: [id1, id2], softDelete: "deleted" });
      
      const doc1 = await ctx.db.get(id1);
      const doc2 = await ctx.db.get(id2);
      
      expect(doc1).not.toBeNull();
      expect(doc2).not.toBeNull();
      expect((doc1 as any).deleted).toBe(true);
      expect((doc2 as any).deleted).toBe(true);
    });
  });
});
