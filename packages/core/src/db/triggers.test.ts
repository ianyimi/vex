import { describe, expect, it } from "vitest";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { convexTest } from "convex-test";
import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import type { VexConfig } from "../config";
import { defineCollection, defineGlobal, text } from "../index";
import { createVexMutations } from "./triggers";

const rawBuilder = ((definition: unknown) => definition) as never;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

type WrappedDefinition = {
  handler: (ctx: GenericMutationCtx<GenericDataModel>, args: unknown) => Promise<unknown>;
};

describe("createVexMutations", () => {
  it("returns wrapped mutation and internalMutation builders", () => {
    const collection = defineCollection({ slug: "posts", fields: { title: text() } });
    const config = { collections: [collection] } as unknown as VexConfig;
    const { mutation, internalMutation } = createVexMutations<GenericDataModel>({
      config,
      mutation: rawBuilder,
      internalMutation: rawBuilder,
    });
    expect(typeof mutation).toBe("function");
    expect(typeof internalMutation).toBe("function");
  });

  it("does not throw for a collection with no afterChange/afterDelete", () => {
    const collection = defineCollection({ slug: "posts", fields: { title: text() } });
    const config = { collections: [collection] } as unknown as VexConfig;
    expect(() =>
      createVexMutations<GenericDataModel>({ config, mutation: rawBuilder, internalMutation: rawBuilder }),
    ).not.toThrow();
  });

  it("does not throw when collections declare afterChange and afterDelete", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text() },
      hooks: {
        afterChange: () => {},
        afterDelete: () => {},
      },
    });
    const config = { collections: [collection] } as unknown as VexConfig;
    expect(() =>
      createVexMutations<GenericDataModel>({ config, mutation: rawBuilder, internalMutation: rawBuilder }),
    ).not.toThrow();
  });

  it("handles an empty collections list", () => {
    const config = { collections: [] } as unknown as VexConfig;
    const { mutation } = createVexMutations<GenericDataModel>({
      config,
      mutation: rawBuilder,
      internalMutation: rawBuilder,
    });
    expect(typeof mutation).toBe("function");
  });
});

describe("createVexMutations — global afterChange", () => {
  it("fires on insert with operation \"create\", oldDoc null, and a flattened newDoc (no data key)", async () => {
    const captured: Array<Record<string, unknown>> = [];
    const siteSettings = defineGlobal({
      slug: "siteSettings",
      label: "Site Settings",
      fields: { siteName: text() },
      hooks: { afterChange: (props) => void captured.push(props as never) },
    });
    const config = { collections: [], globals: [siteSettings] } as unknown as VexConfig;
    const { mutation } = createVexMutations<GenericDataModel>({
      config,
      mutation: rawBuilder,
      internalMutation: rawBuilder,
    });
    const def = mutation({
      handler: (ctx: GenericMutationCtx<GenericDataModel>) =>
        ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "A" } }),
    }) as unknown as WrappedDefinition;

    const t = convexTest(schema, modules);
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) => def.handler(ctx, {}));

    expect(captured).toHaveLength(1);
    expect(captured[0]?.operation).toBe("create");
    expect(captured[0]?.oldDoc).toBeNull();
    expect(captured[0]?.newDoc).toMatchObject({ _slug: "siteSettings", siteName: "A" });
    expect((captured[0]?.newDoc as Record<string, unknown>).data).toBeUndefined();
  });

  it("fires on patch with operation \"update\" and a flattened oldDoc", async () => {
    const captured: Array<Record<string, unknown>> = [];
    const siteSettings = defineGlobal({
      slug: "siteSettings",
      label: "Site Settings",
      fields: { siteName: text() },
      hooks: { afterChange: (props) => void captured.push(props as never) },
    });
    const config = { collections: [], globals: [siteSettings] } as unknown as VexConfig;
    const { mutation } = createVexMutations<GenericDataModel>({
      config,
      mutation: rawBuilder,
      internalMutation: rawBuilder,
    });
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "A" } }),
    );
    const def = mutation({
      handler: (ctx: GenericMutationCtx<GenericDataModel>) =>
        ctx.db.patch(id, { data: { siteName: "B" } } as never),
    }) as unknown as WrappedDefinition;
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) => def.handler(ctx, {}));

    expect(captured).toHaveLength(1);
    expect(captured[0]?.operation).toBe("update");
    expect(captured[0]?.oldDoc).toMatchObject({ _slug: "siteSettings", siteName: "A" });
    expect(captured[0]?.newDoc).toMatchObject({ _slug: "siteSettings", siteName: "B" });
  });

  it("exposes newDoc.vex_status on a versioned global's draft-row insert", async () => {
    const captured: Array<Record<string, unknown>> = [];
    const siteSettings = defineGlobal({
      slug: "siteSettings",
      label: "Site Settings",
      fields: { siteName: text() },
      hooks: { afterChange: (props) => void captured.push(props as never) },
    });
    const config = { collections: [], globals: [siteSettings] } as unknown as VexConfig;
    const { mutation } = createVexMutations<GenericDataModel>({
      config,
      mutation: rawBuilder,
      internalMutation: rawBuilder,
    });
    const def = mutation({
      handler: (ctx: GenericMutationCtx<GenericDataModel>) =>
        ctx.db.insert("vex_globals", {
          slug: "siteSettings",
          data: { siteName: "Draft" },
          vex_status: "draft",
        }),
    }) as unknown as WrappedDefinition;
    const t = convexTest(schema, modules);
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) => def.handler(ctx, {}));

    expect(captured[0]?.newDoc).toMatchObject({ vex_status: "draft" });
  });

  it("fires nothing on a vex_globals delete (no global delete hook — publish's internal row removal)", async () => {
    const captured: unknown[] = [];
    const siteSettings = defineGlobal({
      slug: "siteSettings",
      label: "Site Settings",
      fields: { siteName: text() },
      hooks: { afterChange: (props) => void captured.push(props) },
    });
    const config = { collections: [], globals: [siteSettings] } as unknown as VexConfig;
    const { mutation } = createVexMutations<GenericDataModel>({
      config,
      mutation: rawBuilder,
      internalMutation: rawBuilder,
    });
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "A" } }),
    );
    const def = mutation({
      handler: (ctx: GenericMutationCtx<GenericDataModel>) => ctx.db.delete(id),
    }) as unknown as WrappedDefinition;
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) => def.handler(ctx, {}));

    expect(captured).toHaveLength(0);
  });
});
