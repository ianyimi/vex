import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../db/test/convex/_generated/api";
import schema from "../db/test/convex/schema";
import { assertUniqueAmongPublished } from "./assertUniqueAmongPublished";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("assertUniqueAmongPublished", () => {
  test("throws on create (no excludeId) when a published row already has the value", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", {
        title: "Existing",
        slug: "taken",
        vex_status: "published",
      });
      await expect(
        assertUniqueAmongPublished({
          // `assertUniqueAmongPublished` takes the fixed `VexQueryCtx` (the
          // project's own generated data model), not a generic ctx — a real
          // caller (a field's `validate()`) already has that fixed type;
          // this test's `ctx` is convex-test's own generic model, so the
          // same `as never` this repo's other fixed-ctx tests already use
          // (see `livePreview/api/resolve/server.test.ts`, `callbackApi.test.ts`).
          ctx: ctx as never,
          collection: "posts",
          indexName: "by_slug",
          field: "slug",
          value: "taken",
        }),
      ).rejects.toThrow();
    });
  });

  test("throws when a DIFFERENT document's published row already has the value", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", {
        title: "First",
        slug: "hello",
        vex_status: "published",
      });
      const second = await ctx.db.insert("posts", {
        title: "Second",
        slug: "world",
        vex_status: "published",
      });
      await expect(
        assertUniqueAmongPublished({
          ctx: ctx as never,
          collection: "posts",
          indexName: "by_slug",
          field: "slug",
          value: "hello",
          excludeId: second,
        }),
      ).rejects.toThrow();
    });
  });

  test("does not throw when editing a published document with its own unchanged slug", async () => {
    // The exact bug design-review.md §3.2 describes: a draft sharing its
    // published parent's slug must not make the parent collide with itself.
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const published = await ctx.db.insert("posts", {
        title: "Post",
        slug: "hello",
        vex_status: "published",
      });
      await ctx.db.insert("posts", {
        title: "Post (edited)",
        slug: "hello",
        vex_status: "draft",
        vex_publishedId: published,
      });
      await expect(
        assertUniqueAmongPublished({
          ctx: ctx as never,
          collection: "posts",
          indexName: "by_slug",
          field: "slug",
          value: "hello",
          excludeId: published,
        }),
      ).resolves.toBeUndefined();
    });
  });

  test("ignores another document's not-yet-published draft sharing the checked value", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedA = await ctx.db.insert("posts", {
        title: "A",
        slug: "post-a",
        vex_status: "published",
      });
      const publishedB = await ctx.db.insert("posts", {
        title: "B",
        slug: "post-b",
        vex_status: "published",
      });
      // B has an in-progress draft that ALSO wants "post-a" — but hasn't
      // published, so it must never block A from keeping its own slug.
      await ctx.db.insert("posts", {
        title: "B (edited)",
        slug: "post-a",
        vex_status: "draft",
        vex_publishedId: publishedB,
      });
      await expect(
        assertUniqueAmongPublished({
          ctx: ctx as never,
          collection: "posts",
          indexName: "by_slug",
          field: "slug",
          value: "post-a",
          excludeId: publishedA,
        }),
      ).resolves.toBeUndefined();
    });
  });

  test("degrades to a plain no-collision check on a non-versioned collection (vex_status never set)", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const first = await ctx.db.insert("posts", {
        title: "Only",
        slug: "solo",
      });
      await expect(
        assertUniqueAmongPublished({
          ctx: ctx as never,
          collection: "posts",
          indexName: "by_slug",
          field: "slug",
          value: "solo",
          excludeId: first,
        }),
      ).resolves.toBeUndefined();

      await expect(
        assertUniqueAmongPublished({
          ctx: ctx as never,
          collection: "posts",
          indexName: "by_slug",
          field: "slug",
          value: "solo",
        }),
      ).rejects.toThrow();
    });
  });

  test("a draft-only row (never published) checks cleanly against the empty published set", async () => {
    // Option A's `create` on a `versions.defaultStatus: "draft"` collection —
    // `vex_status: "draft"` with no `vex_publishedId`. No excludeId is passed:
    // there is no published parent to exempt, and nothing published has
    // claimed this value yet, so the check must not throw.
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", {
        title: "New page (unpublished)",
        slug: "never-published",
        vex_status: "draft",
      });
      await expect(
        assertUniqueAmongPublished({
          ctx: ctx as never,
          collection: "posts",
          indexName: "by_slug",
          field: "slug",
          value: "never-published",
        }),
      ).resolves.toBeUndefined();
    });
  });

  test("a draft-only row still collides with a DIFFERENT document's published value", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", {
        title: "Existing",
        slug: "taken",
        vex_status: "published",
      });
      // An unrelated draft-only row also wants "taken" — still a real
      // collision with the already-published document, no excludeId to
      // exempt it with.
      await ctx.db.insert("posts", {
        title: "New page (unpublished)",
        slug: "taken",
        vex_status: "draft",
      });
      await expect(
        assertUniqueAmongPublished({
          ctx: ctx as never,
          collection: "posts",
          indexName: "by_slug",
          field: "slug",
          value: "taken",
        }),
      ).rejects.toThrow();
    });
  });
});
