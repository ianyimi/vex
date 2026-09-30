import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import { CRUD_ACTIONS, VexAccessError } from "../access";
import { defineAccess } from "../access/config";
import { defineCollection, text } from "../index";
import type { VexConfig } from "../config";
import { prepareEdit } from "./prepareEdit";

const posts = defineCollection({
  slug: "posts",
  fields: { title: text({ required: true }), slug: text() },
});

const fixtureConfig = { collections: [posts] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("prepareEdit", () => {
  test("merges storedDoc with incoming, producing the full document in transformedFields", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const stored = { title: "Original", slug: "original" };
      const result = await prepareEdit({
        ctx,
        config: fixtureConfig,
        collection: posts,
        action: CRUD_ACTIONS.update,
        storedDoc: stored as never,
        incoming: { slug: "changed" },
        partial: true,
        validateKeys: "changed",
      });
      expect(result.transformedFields).toMatchObject({ title: "Original", slug: "changed" });
    });
  });

  test("changed-key mode writes incoming keys but never untouched stored fields", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const stored = { title: "Original", slug: "original" };
      const result = await prepareEdit({
        ctx,
        config: fixtureConfig,
        collection: posts,
        action: CRUD_ACTIONS.update,
        storedDoc: stored as never,
        incoming: { slug: "changed" },
        partial: true,
        validateKeys: "changed",
      });
      expect(result.patch).toEqual({ slug: "changed" });
      expect(Array.from(result.changedKeys)).toEqual(["slug"]);
    });
  });

  test("a beforeChange transform is reflected in transformedFields AND picked up in changedKeys", async () => {
    const postsWithHook = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }), slug: text() },
      hooks: {
        beforeChange: ({ doc }) => ({
          ...doc,
          slug: String(doc.title).toLowerCase().replace(/\s+/g, "-"),
        }),
      },
    });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const stored = { title: "Original", slug: "original" };
      const result = await prepareEdit({
        ctx,
        config: fixtureConfig,
        collection: postsWithHook,
        action: CRUD_ACTIONS.update,
        storedDoc: stored as never,
        incoming: { title: "Brand New Title" },
        partial: true,
        validateKeys: "changed",
      });
      expect(result.transformedFields).toMatchObject({ slug: "brand-new-title" });
      // `slug` was never in `incoming` — only `beforeChange` touched it — so it
      // must still surface in `changedKeys` and therefore in `patch`.
      expect(Array.from(result.changedKeys).sort()).toEqual(["slug", "title"]);
      expect(result.patch).toEqual({ title: "Brand New Title", slug: "brand-new-title" });
    });
  });

  test("lenient mode (partial: true) allows an incomplete merged document", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await expect(
        prepareEdit({
          ctx,
          config: fixtureConfig,
          collection: posts,
          action: CRUD_ACTIONS.update,
          storedDoc: undefined,
          incoming: { title: "Only title, no slug" },
          partial: true,
          validateKeys: "changed",
        }),
      ).resolves.toBeDefined();
    });
  });

  test("strict mode (partial: false) rejects a merged document missing a required field, naming it in the thrown error", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      let caught: unknown;
      try {
        await prepareEdit({
          ctx,
          config: fixtureConfig,
          collection: posts,
          action: CRUD_ACTIONS.update,
          storedDoc: undefined,
          incoming: { slug: "no-title" },
          partial: false,
          validateKeys: "all",
        });
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(ConvexError);
      const data = (caught as ConvexError<{ message: string; errors: string }>).data;
      expect(data.message).toBe("Validation failed");
      expect(data.errors).toContain("title");
    });
  });

  test('validateKeys: "changed" only runs validate() for fields that actually changed', async () => {
    const calls: string[] = [];
    const postsWithValidators = defineCollection({
      slug: "posts",
      fields: {
        title: text({
          required: true,
          validate: () => {
            calls.push("title");
          },
        }),
        slug: text({
          validate: () => {
            calls.push("slug");
          },
        }),
      },
    });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const stored = { title: "Original", slug: "original" };
      await prepareEdit({
        ctx,
        config: fixtureConfig,
        collection: postsWithValidators,
        action: CRUD_ACTIONS.update,
        storedDoc: stored as never,
        incoming: { slug: "changed" },
        partial: true,
        validateKeys: "changed",
      });
    });
    expect(calls).toEqual(["slug"]);
  });

  test('validateKeys: "all" runs every field\'s validate(), not just changed fields, and returns the full transformed document as the patch, not a delta', async () => {
    const calls: string[] = [];
    const postsWithValidators = defineCollection({
      slug: "posts",
      fields: {
        title: text({
          required: true,
          validate: () => {
            calls.push("title");
          },
        }),
        slug: text({
          validate: () => {
            calls.push("slug");
          },
        }),
      },
    });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const stored = { title: "Original", slug: "original" };
      const result = await prepareEdit({
        ctx,
        config: fixtureConfig,
        collection: postsWithValidators,
        action: CRUD_ACTIONS.update,
        storedDoc: stored as never,
        incoming: { title: "Updated" },
        partial: false,
        validateKeys: "all",
      });
      expect(result.patch).toEqual({ title: "Updated", slug: "original" });
    });
    expect(calls.sort()).toEqual(["slug", "title"]);
  });

  test("an access denial throws VexAccessError before beforeChange or validation run", async () => {
    let beforeChangeCalled = false;
    const guardedPosts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }), slug: text() },
      hooks: {
        beforeChange: ({ doc }) => {
          beforeChangeCalled = true;
          return doc;
        },
      },
    });
    const config = {
      collections: [guardedPosts],
      access: defineAccess({
        roles: ["blocked"] as const,
        resources: [guardedPosts],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          blocked: { posts: { update: false } },
        },
      }),
    } as unknown as VexConfig;
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await expect(
        prepareEdit({
          ctx,
          config,
          collection: guardedPosts,
          action: CRUD_ACTIONS.update,
          auth: { user: { roles: ["blocked"] } },
          storedDoc: { title: "Old", slug: "old" } as never,
          incoming: { title: "New" },
          partial: true,
          validateKeys: "changed",
        }),
      ).rejects.toThrow(VexAccessError);
    });
    expect(beforeChangeCalled).toBe(false);
  });
});
