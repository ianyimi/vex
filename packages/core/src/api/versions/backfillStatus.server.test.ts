import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";

import type { VexConfig } from "../../config";
import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import { backfillStatus } from "./backfillStatus.server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

/** `posts` with `versions.drafts: true` — matches the shared fixture's `vex_status`/`by_status` columns. */
const versionedConfig: VexConfig = {
  collections: [
    {
      slug: "posts",
      fields: { title: { type: "text" } },
      labels: { singular: "Post", plural: "Posts" },
      admin: { useAsTitle: "title" },
      versions: { drafts: true },
    },
  ],
} as unknown as VexConfig;

/** Same `posts` slug, but without `versions.drafts` — for the rejection case. */
const nonVersionedConfig: VexConfig = {
  collections: [
    {
      slug: "posts",
      fields: { title: { type: "text" } },
      labels: { singular: "Post", plural: "Posts" },
      admin: { useAsTitle: "title" },
      versions: { drafts: false },
    },
  ],
} as unknown as VexConfig;

describe("backfillStatus (server)", () => {
  /**
   * Three `posts` rows: one already `"published"`, one already `"draft"`,
   * and one inserted with no `vex_status` key at all (the pre-toggle shape
   * this action exists to fix). A single page (`numItems: 10`) must patch
   * ONLY the row missing the field, to exactly `"published"`, and must
   * report `{ patched: 1, isDone: true }`.
   */
  test("patches only the row missing vex_status", async () => {
    const t = convexTest(schema, modules);
    const { publishedId, draftId, untouchedId } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const publishedId = await ctx.db.insert("posts", {
          title: "Has published", slug: "backfill-1",
          vex_status: "published",
        });
        const draftId = await ctx.db.insert("posts", {
          title: "Has draft", slug: "backfill-2",
          vex_status: "draft",
        });
        const untouchedId = await ctx.db.insert("posts", {
          title: "Never touched", slug: "backfill-3",
        });
        return { publishedId, draftId, untouchedId };
      },
    );

    const result = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      backfillStatus({
        ctx,
        config: versionedConfig,
        collection: "posts",
        paginationOpts: { numItems: 10, cursor: null },
      }),
    );

    expect(result).toEqual({
      patched: 1,
      isDone: true,
      continueCursor: expect.any(String),
    });

    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      expect((await ctx.db.get(publishedId))?.vex_status).toBe("published");
      expect((await ctx.db.get(draftId))?.vex_status).toBe("draft");
      expect((await ctx.db.get(untouchedId))?.vex_status).toBe("published");
    });
  });

  /**
   * Running the action again after every row already has `vex_status` finds
   * nothing left to patch — proves the action is safe to invoke repeatedly.
   */
  test("a second call patches nothing once every row has vex_status", async () => {
    const t = convexTest(schema, modules);
    const rowId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "Legacy", slug: "backfill-legacy" }),
    );

    const first = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      backfillStatus({
        ctx,
        config: versionedConfig,
        collection: "posts",
        paginationOpts: { numItems: 10, cursor: null },
      }),
    );
    expect(first).toEqual({
      patched: 1,
      isDone: true,
      continueCursor: expect.any(String),
    });

    const second = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      backfillStatus({
        ctx,
        config: versionedConfig,
        collection: "posts",
        paginationOpts: { numItems: 10, cursor: null },
      }),
    );
    expect(second).toEqual({
      patched: 0,
      isDone: true,
      continueCursor: expect.any(String),
    });

    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      expect((await ctx.db.get(rowId))?.vex_status).toBe("published");
    });
  });

  /**
   * `posts` here is registered WITHOUT `versions.drafts` — there is no
   * `vex_status` column to backfill, so the call must reject rather than
   * querying a nonexistent index.
   */
  test("throws when the collection does not have versions.drafts enabled", async () => {
    const t = convexTest(schema, modules);
    let caught: unknown;
    try {
      await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        backfillStatus({
          ctx,
          config: nonVersionedConfig,
          collection: "posts",
          paginationOpts: { numItems: 10, cursor: null },
        }),
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ConvexError);
    const message = (caught as Error).message;
    expect(message).toContain("posts");
    expect(message).toContain("versions.drafts");
  });

  /** No collection named `"missing"` exists in `versionedConfig` at all. */
  test("throws for an unregistered collection slug", async () => {
    const t = convexTest(schema, modules);
    let caught: unknown;
    try {
      await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        backfillStatus({
          ctx,
          config: versionedConfig,
          collection: "missing" as never,
          paginationOpts: { numItems: 10, cursor: null },
        }),
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ConvexError);
    expect((caught as Error).message).toContain("missing");
  });
});
