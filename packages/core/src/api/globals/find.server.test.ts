import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, it } from "vitest";

import * as generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import { findGlobals } from "./find.server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(generatedApi),
};

describe("findGlobals (server)", () => {
  it("returns empty array when no globals saved", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      findGlobals({ ctx }),
    );
    expect(result).toEqual([]);
  });

  it("returns all saved globals as flat documents", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "siteSettings",
        data: { siteName: "A" },
      });
      await ctx.db.insert("vex_globals", {
        slug: "nav",
        data: { items: [] },
      });
    });
    const result = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      findGlobals({ ctx }),
    );
    expect(result).toHaveLength(2);
    const slugs = result.map((r) => r._slug);
    expect(slugs).toContain("siteSettings");
    expect(slugs).toContain("nav");
    // user fields at root
    const settings = result.find((r) => r._slug === "siteSettings");
    expect(settings?.siteName).toBe("A");
    expect(settings?.data).toBeUndefined();
  });
});
