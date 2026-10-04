import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import { CRUD_ACTIONS, VexAccessError } from "../access";
import { defineAccess } from "../access/config";
import { defineCollection, defineGlobal, text } from "../index";
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
        target: { kind: "collection", config: posts },
        action: CRUD_ACTIONS.update,
        storedDoc: stored as never,
        changes: { slug: "changed" },
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
        target: { kind: "collection", config: posts },
        action: CRUD_ACTIONS.update,
        storedDoc: stored as never,
        changes: { slug: "changed" },
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
        target: { kind: "collection", config: postsWithHook },
        action: CRUD_ACTIONS.update,
        storedDoc: stored as never,
        changes: { title: "Brand New Title" },
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
          target: { kind: "collection", config: posts },
          action: CRUD_ACTIONS.update,
          storedDoc: undefined,
          changes: { title: "Only title, no slug" },
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
          target: { kind: "collection", config: posts },
          action: CRUD_ACTIONS.update,
          storedDoc: undefined,
          changes: { slug: "no-title" },
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
        target: { kind: "collection", config: postsWithValidators },
        action: CRUD_ACTIONS.update,
        storedDoc: stored as never,
        changes: { slug: "changed" },
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
        target: { kind: "collection", config: postsWithValidators },
        action: CRUD_ACTIONS.update,
        storedDoc: stored as never,
        changes: { title: "Updated" },
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
          target: { kind: "collection", config: guardedPosts },
          action: CRUD_ACTIONS.update,
          auth: { user: { roles: ["blocked"] } },
          storedDoc: { title: "Old", slug: "old" } as never,
          changes: { title: "New" },
          partial: true,
          validateKeys: "changed",
        }),
      ).rejects.toThrow(VexAccessError);
    });
    expect(beforeChangeCalled).toBe(false);
  });
});

const siteSettings = defineGlobal({
  slug: "siteSettings",
  label: "Site Settings",
  fields: {
    title: text({
      validate: ({ value }) => {
        if (value === "BAD") throw new Error('title cannot be "BAD"');
      },
    }),
  },
  hooks: {
    beforeChange: ({ doc }) => {
      const fields = doc as Record<string, unknown>;
      return {
        ...fields,
        title: typeof fields.title === "string" ? fields.title.toUpperCase() : fields.title,
      };
    },
  },
});

const globalFixtureConfig = { collections: [], globals: [siteSettings] } as unknown as VexConfig;

describe("prepareEdit — global targets", () => {
  test("a global target's beforeChange transform lands in transformedFields AND changedKeys", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const result = await prepareEdit({
        ctx,
        config: globalFixtureConfig,
        target: { kind: "global", config: siteSettings },
        action: CRUD_ACTIONS.create,
        storedDoc: undefined,
        changes: { title: "hello" },
        partial: false,
        validateKeys: "all",
      });
      expect(result.transformedFields).toMatchObject({ title: "HELLO" });
      expect(result.changedKeys.has("title")).toBe(true);
    });
  });

  test('operation is "create" when action is CRUD_ACTIONS.create, "update" otherwise', async () => {
    const seenOperations: string[] = [];
    const recordingGlobal = defineGlobal({
      slug: "siteSettings",
      label: "Site Settings",
      fields: { title: text() },
      hooks: {
        beforeChange: ({ doc, operation }) => {
          seenOperations.push(operation);
          return doc;
        },
      },
    });
    const config = { collections: [], globals: [recordingGlobal] } as unknown as VexConfig;
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await prepareEdit({
        ctx,
        config,
        target: { kind: "global", config: recordingGlobal },
        action: CRUD_ACTIONS.create,
        storedDoc: undefined,
        changes: { title: "a" },
        partial: false,
        validateKeys: "all",
      });
      await prepareEdit({
        ctx,
        config,
        target: { kind: "global", config: recordingGlobal },
        action: CRUD_ACTIONS.update,
        storedDoc: { title: "a" } as never,
        changes: { title: "b" },
        partial: true,
        validateKeys: "changed",
      });
    });
    expect(seenOperations).toEqual(["create", "update"]);
  });

  test("a global field's validate() rejection surfaces as ConvexError({ field, message }) — the gap upsertGlobal had", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      let caught: unknown;
      try {
        await prepareEdit({
          ctx,
          config: globalFixtureConfig,
          target: { kind: "global", config: siteSettings },
          action: CRUD_ACTIONS.create,
          storedDoc: undefined,
          // `beforeChange` runs before `validate()` — `prepareEdit` validates
          // `transformedFields`, the POST-`beforeChange` document — so the
          // fixture's `validate` must check the UPPERCASED value "bad" becomes.
          changes: { title: "bad" },
          partial: false,
          validateKeys: "all",
        });
      } catch (thrown) {
        caught = thrown;
      }
      expect(caught).toBeInstanceOf(ConvexError);
      expect((caught as ConvexError<{ field: string; message: string }>).data).toMatchObject({
        field: "title",
      });
    });
  });
});
