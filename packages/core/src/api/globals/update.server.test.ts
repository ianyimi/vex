import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, it } from "vitest";

import { text } from "../../fields";
import { defineGlobal } from "../../globals/config";
import * as generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import { upsertGlobal } from "./update.server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(generatedApi),
};

/** Shape of a raw `vex_globals` DB row, for storage-layer assertions. */
interface GlobalRow {
  slug: string;
  data: Record<string, unknown>;
}

const siteSettingsGlobal = defineGlobal({
  slug: "siteSettings",
  label: "Site Settings",
  fields: { siteName: text({ label: "Site Name", required: true }) },
});

describe("updateGlobal (server)", () => {
  it("inserts a new row when the global has never been saved", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await upsertGlobal({
        ctx,
        slug: "siteSettings",
        data: { siteName: "My Site" },
        globalConfig: siteSettingsGlobal,
      });
    });
    const rows = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    )) as unknown as GlobalRow[];
    expect(rows).toHaveLength(1);
    expect(rows[0].data.siteName).toBe("My Site");
    expect(rows[0].slug).toBe("siteSettings"); // DB stores slug, not _slug
  });

  it("patches the existing row on subsequent saves", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "siteSettings",
        data: { siteName: "Old" },
      });
    });
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await upsertGlobal({
        ctx,
        slug: "siteSettings",
        data: { siteName: "New" },
        globalConfig: siteSettingsGlobal,
      });
    });
    const rows = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    )) as unknown as GlobalRow[];
    expect(rows).toHaveLength(1);
    expect(rows[0].data.siteName).toBe("New");
  });

  it("strips system keys from flat input before writing", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      // Simulate GlobalEditView sending a full flat document
      await upsertGlobal({
        ctx,
        slug: "siteSettings",
        data: {
          _id: "fake",
          _creationTime: 0,
          _slug: "siteSettings",
          siteName: "Clean",
        },
        globalConfig: siteSettingsGlobal,
      });
    });
    const rows = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    )) as unknown as GlobalRow[];
    expect(rows[0].data._id).toBeUndefined();
    expect(rows[0].data._slug).toBeUndefined();
    expect(rows[0].data.siteName).toBe("Clean");
  });

  it("throws ConvexError on validation failure", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await upsertGlobal({
          ctx,
          slug: "siteSettings",
          data: { siteName: 999 }, // wrong type
          globalConfig: siteSettingsGlobal,
        });
      }),
    ).rejects.toThrow();
  });
});
