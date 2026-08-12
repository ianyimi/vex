import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, it } from "vitest";

import type { VexDocumentGlobal } from "../../types/generated";
import * as generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import { getGlobal } from "./get.server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(generatedApi),
};

describe("getGlobal (server)", () => {
  it("returns null when global has never been saved", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getGlobal({ ctx, slug: "siteSettings" }),
    );
    expect(result).toBeNull();
  });

  it("returns flat document with _slug and user fields at root", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "siteSettings",
        data: { siteName: "My Site", siteDescription: "A site" },
      });
    });
    const result = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getGlobal({ ctx, slug: "siteSettings" }),
    )) as VexDocumentGlobal | null;
    expect(result).not.toBeNull();
    expect(result?._slug).toBe("siteSettings");
    expect(result?.siteName).toBe("My Site");
    expect(result?.siteDescription).toBe("A site");
    expect(result?.slug).toBeUndefined(); // slug → _slug, not both
    expect(result?.data).toBeUndefined(); // data lifted, not nested
  });

  it("exposes _id and _creationTime from VexDocument", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "nav", data: {} });
    });
    const result = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getGlobal({ ctx, slug: "nav" }),
    )) as VexDocumentGlobal | null;
    expect(typeof result?._id).toBe("string");
    expect(typeof result?._creationTime).toBe("number");
  });
});
