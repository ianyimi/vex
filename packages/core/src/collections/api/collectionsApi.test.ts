import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import type {
  GenericDataModel,
  GenericMutationCtx,
  MutationBuilder,
  QueryBuilder,
} from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../../db/test/convex/_generated/api";
import schema from "../../db/test/convex/schema";
import type { VexConfig } from "../../config";
import { collectionsApi } from "./collectionsApi";
import { create } from "./create/server";
import { defineCollection } from "../../index";
import { text } from "../../fields";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

const disableCreateCollection = defineCollection({
  slug: "posts",
  disableCreate: true,
  fields: { title: text(), slug: text() },
});

const fixtureConfig = { collections: [disableCreateCollection] } as unknown as VexConfig;

// Passthrough builders standing in for Convex's real `query`/`mutation` —
// `collectionsApi` only ever calls `mutation(def)`/`query(def)` and keeps
// the returned value, so handing back `def` unchanged yields an object whose
// `.handler` is directly callable, the same `t.run()` + direct-call pattern
// every other `collections/api` test already uses against the underlying
// server function. Real Convex function-registration machinery (arg
// validation, visibility) is exercised elsewhere, not by this test.
function passthroughMutation<Def>(def: Def): Def {
  return def;
}
function passthroughQuery<Def>(def: Def): Def {
  return def;
}

interface RegisteredHandler {
  handler: (ctx: GenericMutationCtx<GenericDataModel>, args: unknown) => Promise<unknown>;
}

describe("collectionsApi — create", () => {
  test("rejects a disableCreate collection with a ConvexError", async () => {
    const t = convexTest(schema, modules);
    const api = collectionsApi({
      config: fixtureConfig,
      query: passthroughQuery as unknown as QueryBuilder<GenericDataModel, "public">,
      mutation: passthroughMutation as unknown as MutationBuilder<GenericDataModel, "public">,
    });
    const createHandler = api.create as unknown as RegisteredHandler;

    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        createHandler.handler(ctx, {
          collection: "posts",
          data: { title: "Hello", slug: "hello" },
        }),
      ),
    ).rejects.toThrow(ConvexError);
  });

  test("direct create() from @vexcms/core/server still inserts into a disableCreate collection", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      create({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        data: { title: "Hello", slug: "hello" },
      }),
    );
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });
});
