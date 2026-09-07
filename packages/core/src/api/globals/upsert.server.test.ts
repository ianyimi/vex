import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, it } from "vitest";

import { text } from "../../fields";
import { defineGlobal } from "../../globals/config";
import * as generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { upsertGlobal } from "./upsert.server";

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

// upsertGlobal resolves the GlobalConfig from `config.globals` by slug and
// reads `config.access` (undefined here → RBAC off).
const fixtureConfig = { globals: [siteSettingsGlobal], access: undefined } as unknown as VexConfig;

describe("updateGlobal (server)", () => {
  it("inserts a new row when the global has never been saved", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await upsertGlobal({
        ctx,
        slug: "siteSettings",
        data: { siteName: "My Site" },
        config: fixtureConfig,
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
        config: fixtureConfig,
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
        config: fixtureConfig,
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
          config: fixtureConfig,
        });
      }),
    ).rejects.toThrow();
  });
});

describe("upsertGlobal (server) — updatedAt", () => {
  // Pins the deliberate gap as a checked contract rather than a silent one.
  // `vex_globals` is a single `{ slug, data }` table shared by every registered
  // global — there is no per-global `defineTable` generated from its fields, so
  // there is no column to stamp. Stashing the value inside the `data` blob is
  // not equivalent: `STRIPPED_KEYS` and each global's Zod input schema would
  // both have to learn about a field no `GlobalConfigInput` declares.
  it("never writes an updatedAt key — globals cannot carry one", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await upsertGlobal({
        config: fixtureConfig,
        ctx,
        data: { siteName: "My Site" },
        slug: "siteSettings",
      });
    });
    const rows = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    );
    const stored = rows[0].data;
    expect(stored).toBeTypeOf("object");
    expect(Object.keys(stored as object)).not.toContain("updatedAt");
  });
});
