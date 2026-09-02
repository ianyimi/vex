import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test, vi } from "vitest";

import { VexAccessError } from "../access";
import { defineAccess } from "../access/config";
import type { VexConfig } from "../config";
import { checkbox, defineCollection, text } from "../index";
import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import { vexServerApi } from "./server";
import type { VexApiAuth } from "./types";

/**
 * Contracts of the `vexServerApi` access options (spec
 * 2026-08-29-server-api-access-options, Step 3):
 *
 * 1. `access.bypass` never invokes `getAuth` — a public read costs no session lookup.
 * 2. Without bypass, `getAuth` resolves auth exactly once per call.
 * 3. `access.action` reaches the underlying permission check — proven with a matrix
 *    that DENIES the default verb and GRANTS only the custom one, so a passing call
 *    cannot be explained by `read`.
 * 4. A bypassed call emits NO dev warning. Regression pin: `inject` used to forward
 *    the access-stripped config, so the raw function's resolver saw "bypass set but
 *    RBAC off" and warned spuriously on every legitimate bypass.
 * 5. The mutation wrappers honour bypass the same way the query wrappers do.
 */

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

const posts = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text(), featured: checkbox({ index: "by_featured" }) },
});

// `read` and `create` are deliberately undeclared: the pinned deny posture refuses
// them, so anything a call gets back is attributable to the option under test.
const accessConfig = {
  collections: [
    {
      slug: "posts",
      fields: { title: { type: "text" } },
      labels: { singular: "Post", plural: "Posts" },
      admin: { useAsTitle: "title" },
    },
  ],
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [posts],
    userCollectionSlug: "users",
    userRolesField: "roles",
    customActions: { posts: { query: ["listFeatured"] } },
    permissions: { contributor: { posts: { listFeatured: true } } },
  }),
} as unknown as VexConfig;

const contributor: VexApiAuth = { user: { _id: "u1", roles: "contributor" } };

/** Fresh api + spy per test — `getAuth` call counts must not leak across tests. */
function makeApi() {
  const getAuth = vi.fn(
    async (): Promise<VexApiAuth | undefined> => contributor,
  );
  const api = vexServerApi<GenericDataModel>({ config: accessConfig, getAuth });
  return { api, getAuth };
}

describe("vexServerApi — access.bypass", () => {
  test("skips getAuth entirely and returns rows the matrix denies", async () => {
    const t = convexTest(schema, modules);
    const { api, getAuth } = makeApi();
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
      return api.find({ ctx, collection: "posts", access: { bypass: true } });
    });
    expect(docs).toHaveLength(2);
    expect(getAuth).not.toHaveBeenCalled();
  });

  test("resolves auth normally without bypass, and the deny posture holds", async () => {
    const t = convexTest(schema, modules);
    const { api, getAuth } = makeApi();
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      // `read` is undeclared for contributor, so the rows are filtered out.
      return api.find({ ctx, collection: "posts" });
    });
    expect(docs).toHaveLength(0);
    expect(getAuth).toHaveBeenCalledOnce();
  });

  test("emits no dev warning on a legitimate bypass (inject regression pin)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const t = convexTest(schema, modules);
      const { api } = makeApi();
      await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        api.find({ ctx, collection: "posts", access: { bypass: true } }),
      );
      const accessWarnings = warn.mock.calls.filter(
        (c) => typeof c[0] === "string" && c[0].includes("access.bypass"),
      );
      expect(accessWarnings).toHaveLength(0);
    } finally {
      warn.mockRestore();
    }
  });

  test("bypasses the mutation wrappers too", async () => {
    const t = convexTest(schema, modules);
    const { api, getAuth } = makeApi();
    const id = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      // `create` is undeclared for contributor — only bypass can explain success.
      api.create({
        ctx,
        collection: "posts",
        data: { title: "C", slug: "c" },
        access: { bypass: true },
      }),
    );
    expect(id).toBeTypeOf("string");
    expect(getAuth).not.toHaveBeenCalled();
  });

  test("an enforced create still throws for an undeclared action", async () => {
    const t = convexTest(schema, modules);
    const { api } = makeApi();
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        api.create({ ctx, collection: "posts", data: { title: "D", slug: "d" } }),
      ),
    ).rejects.toThrow(VexAccessError);
  });
});

describe("vexServerApi — access.action", () => {
  test("forwards the action to the underlying check", async () => {
    const t = convexTest(schema, modules);
    const { api } = makeApi();
    const { custom, defaulted } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
        return {
          custom: await api.find({
            ctx,
            collection: "posts",
            access: { action: "listFeatured" },
          }),
          defaulted: await api.find({ ctx, collection: "posts" }),
        };
      },
    );
    // Granted only under `listFeatured` — rows under the custom action, none under
    // the default `read`, is the switch observed end to end through the wrapper.
    expect(custom).toHaveLength(1);
    expect(defaulted).toHaveLength(0);
  });

  test("bypass wins over action — no check runs at all", async () => {
    const t = convexTest(schema, modules);
    const { api, getAuth } = makeApi();
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      // A nonsense action would DENY if it were consulted; bypass makes it moot.
      return api.find({
        ctx,
        collection: "posts",
        access: { bypass: true, action: "notARealAction" },
      });
    });
    expect(docs).toHaveLength(1);
    expect(getAuth).not.toHaveBeenCalled();
  });
});
