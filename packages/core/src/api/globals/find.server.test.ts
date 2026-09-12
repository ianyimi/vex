import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, it } from "vitest";

import * as generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { findGlobals } from "./find.server";


// Minimal resolved-config fixture: findGlobals only reads `config.access`
// (undefined here → RBAC off) at this layer.
const fixtureConfig = { globals: [] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(generatedApi),
};

describe("findGlobals (server)", () => {
  it("returns empty array when no globals saved", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      findGlobals({ ctx, config: fixtureConfig }),
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
      findGlobals({ ctx, config: fixtureConfig }),
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

describe("findGlobals (server) — field-level read shaping", () => {
  function buildConfig(permissions: Record<string, unknown>): VexConfig {
    return {
      globals: [],
      access: {
        enabled: true,
        roles: ["editor"],
        userCollectionSlug: "users",
        userRolesField: "roles",
        defaultPermissionMode: "deny",
        resources: [],
        permissions,
      },
    } as unknown as VexConfig;
  }

  const editorAuth = { user: { roles: ["editor"] } };

  it("strips a field denied by the read action", async () => {
    const config = buildConfig({
      editor: { siteSettings: { read: () => ({ "*": true, siteName: false }) } },
    });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "A" } });
    });
    const result = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      findGlobals({ ctx, config, auth: editorAuth }),
    );
    expect(result[0]?.siteName).toBeUndefined();
  });

  it("returns documents unchanged when the read action declares no map (regression)", async () => {
    const config = buildConfig({ editor: { siteSettings: { read: true } } });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "A" } });
    });
    const result = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      findGlobals({ ctx, config, auth: editorAuth }),
    );
    expect(result[0]?.siteName).toBe("A");
  });

  it("never strips _id, _creationTime, or _slug", async () => {
    const config = buildConfig({ editor: { siteSettings: { read: () => ({ "*": false }) } } });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "A" } });
    });
    const result = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      findGlobals({ ctx, config, auth: editorAuth }),
    );
    expect(result[0]?._id).toBeDefined();
    expect(result[0]?._creationTime).toBeDefined();
    expect(result[0]?._slug).toBe("siteSettings");
  });

  it("strips per document when the map's value is an expression over the document", async () => {
    const config = buildConfig({
      editor: {
        draftPage: {
          read: ({ data }: { data?: Record<string, unknown> }) => ({
            "*": true,
            siteName: data?.status === "draft",
          }),
        },
        publishedPage: {
          read: ({ data }: { data?: Record<string, unknown> }) => ({
            "*": true,
            siteName: data?.status === "draft",
          }),
        },
      },
    });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "draftPage",
        data: { siteName: "Draft Site", status: "draft" },
      });
      await ctx.db.insert("vex_globals", {
        slug: "publishedPage",
        data: { siteName: "Live Site", status: "published" },
      });
    });
    const result = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      findGlobals({ ctx, config, auth: editorAuth }),
    );
    const draft = result.find((r) => r._slug === "draftPage");
    const published = result.find((r) => r._slug === "publishedPage");
    expect(draft?.siteName).toBe("Draft Site");
    expect(published?.siteName).toBeUndefined();
  });

  it("does not DENY a read when the read action returns a map", async () => {
    const config = buildConfig({
      editor: { siteSettings: { read: () => ({ "*": false, siteName: true }) } },
    });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "A" } });
    });
    const result = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      findGlobals({ ctx, config, auth: editorAuth }),
    );
    expect(result).toHaveLength(1);
  });
});
