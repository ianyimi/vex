import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import { update } from "./update.server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("update (server)", () => {
  test("patches only the specified fields", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Old", slug: "old" });
      await update({ ctx, id, data: { title: "New" } });
      const doc = await ctx.db.get(id);
      expect(doc?.title).toBe("New");
      expect(doc?.slug).toBe("old"); // unchanged
    });
  });
});
