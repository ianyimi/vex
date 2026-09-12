import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, it } from "vitest";

import type { VexDocumentGlobal } from "../../types/generated";
import * as generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { getGlobal } from "./get.server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(generatedApi),
};

// No `access` → the RBAC guard is skipped; these tests exercise flattening only.
const fixtureConfig = { globals: [] } as unknown as VexConfig;

describe("getGlobal (server)", () => {
  it("returns null when global has never been saved", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getGlobal({ ctx, slug: "siteSettings", config: fixtureConfig }),
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
      getGlobal({ ctx, slug: "siteSettings", config: fixtureConfig }),
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
      getGlobal({ ctx, slug: "nav", config: fixtureConfig }),
    )) as VexDocumentGlobal | null;
    expect(typeof result?._id).toBe("string");
    expect(typeof result?._creationTime).toBe("number");
  });
});

describe("getGlobal (server) — field-level read shaping", () => {
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
      await ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "My Site" } });
    });
    const result = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getGlobal({ ctx, slug: "siteSettings", config, auth: editorAuth }),
    )) as VexDocumentGlobal | null;
    expect(result?.siteName).toBeUndefined();
  });

  it("returns documents unchanged when the read action declares no map (regression)", async () => {
    const config = buildConfig({ editor: { siteSettings: { read: true } } });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "My Site" } });
    });
    const result = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getGlobal({ ctx, slug: "siteSettings", config, auth: editorAuth }),
    )) as VexDocumentGlobal | null;
    expect(result?.siteName).toBe("My Site");
  });

  it("never strips _id, _creationTime, or _slug", async () => {
    const config = buildConfig({ editor: { siteSettings: { read: () => ({ "*": false }) } } });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "My Site" } });
    });
    const result = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getGlobal({ ctx, slug: "siteSettings", config, auth: editorAuth }),
    )) as VexDocumentGlobal | null;
    expect(result?._id).toBeDefined();
    expect(result?._creationTime).toBeDefined();
    expect(result?._slug).toBe("siteSettings");
    expect(result?.siteName).toBeUndefined();
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
    const draft = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getGlobal({ ctx, slug: "draftPage", config, auth: editorAuth }),
    )) as VexDocumentGlobal | null;
    const published = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getGlobal({ ctx, slug: "publishedPage", config, auth: editorAuth }),
    )) as VexDocumentGlobal | null;
    expect(draft?.siteName).toBe("Draft Site");
    expect(published?.siteName).toBeUndefined();
  });

  it("does not DENY a read when the read action returns a map", async () => {
    const config = buildConfig({
      editor: { siteSettings: { read: () => ({ "*": false, siteName: true }) } },
    });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "My Site" } });
    });
    const result = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getGlobal({ ctx, slug: "siteSettings", config, auth: editorAuth }),
    )) as VexDocumentGlobal | null;
    expect(result).not.toBeNull();
  });
});
