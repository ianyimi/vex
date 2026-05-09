import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import { create } from "./server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("create (server)", () => {
  test("inserts a document and returns its id", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      create({
        ctx,
        collection: "posts",
        data: { title: "Hello", slug: "hello" },
      }),
    );
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  test("document is retrievable after create", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await create({
        ctx,
        collection: "posts",
        data: { title: "Hello", slug: "hello" },
      });
      const doc = await ctx.db.get(id as never);
      expect(doc).toMatchObject({ title: "Hello", slug: "hello" });
    });
  });
});
