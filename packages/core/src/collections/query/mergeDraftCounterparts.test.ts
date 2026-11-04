import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../../db/test/convex/_generated/api";
import schema from "../../db/test/convex/schema";
import { commitTs, text } from "../../fields";
import { mergeDraftCounterparts } from "./mergeDraftCounterparts";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

const fields = { title: text(), updatedAt: commitTs() };

describe("mergeDraftCounterparts — commitTs ms conversion", () => {
  /**
   * Regression repro: the draft counterpart is fetched by a fresh
   * `ctx.db.query(...).unique()` read — NOT the caller's own
   * `readableDocuments` pass — so it needs its OWN `fields` forwarded into
   * its inner `readableDocuments` call, or a resolved `commitTs` bigint on
   * the draft reaches the caller raw. `updatedAt` here is a literal
   * resolved bigint (not the unresolved placeholder), matching what a real
   * Convex backend stores post-commit.
   */
  test("converts a resolved-bigint commitTs field on the merged-in draft row to ms", async () => {
    const t = convexTest(schema, modules);
    const resolvedNs = BigInt(1_700_000_000_000) * BigInt(1_000_000);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        vex_status: "published",
      });
      await ctx.db.insert("posts", {
        title: "Hello (draft edit)",
        slug: "hello",
        vex_status: "draft",
        vex_publishedId: publishedId,
        updatedAt: resolvedNs,
      });
      const published = await ctx.db.get(publishedId);
      return mergeDraftCounterparts({
        ctx,
        collection: "posts",
        docs: [published!],
        access: undefined,
        auth: undefined,
        resource: "posts",
        action: "read",
        fields,
      });
    });

    expect(result).toHaveLength(1);
    const merged = result[0] as unknown as Record<string, unknown>;
    expect(merged.hasUnpublishedChanges).toBe(true);
    expect(typeof merged.updatedAt).toBe("number");
    expect(merged.updatedAt).toBe(1_700_000_000_000);
  });

  test("leaves the draft's commitTs field as a raw bigint when fields is omitted (back-compat)", async () => {
    const t = convexTest(schema, modules);
    const resolvedNs = BigInt(1_700_000_000_000) * BigInt(1_000_000);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        vex_status: "published",
      });
      await ctx.db.insert("posts", {
        title: "Hello (draft edit)",
        slug: "hello",
        vex_status: "draft",
        vex_publishedId: publishedId,
        updatedAt: resolvedNs,
      });
      const published = await ctx.db.get(publishedId);
      return mergeDraftCounterparts({
        ctx,
        collection: "posts",
        docs: [published!],
        access: undefined,
        auth: undefined,
        resource: "posts",
        action: "read",
      });
    });

    const merged = result[0] as unknown as Record<string, unknown>;
    expect(typeof merged.updatedAt).toBe("bigint");
  });
});

describe("mergeDraftCounterparts — vex_status must not be read off the (possibly stripped) doc", () => {
  /**
   * Access + system-fields fix: a caller whose field permissions deny
   * `vex_status` reaches this function with that field ALREADY stripped
   * off `doc` by the caller's own `readableDocuments` pass upstream
   * (`find`/`search`) — `doc.vex_status` is `undefined`, not `"published"`,
   * even for a genuinely published row. Reading `doc[vex_status]` here to
   * decide "is this a published row with a counterpart to look up" breaks
   * the moment that's true: every published row would misread as "not
   * published" and skip the merge, silently dropping `hasUnpublishedChanges`
   * for every caller who can't read `vex_status` but CAN read drafts (a
   * real combination — a role can grant `readDrafts` without granting a
   * `vex_status` column). The fix looks the published counterpart up
   * unconditionally by `_id` (always present/readable) via the
   * SAME `by_published` index, instead of branching on a field value that
   * might not be there.
   */
  test("still merges the linked draft in when vex_status is stripped off the published doc", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        vex_status: "published",
      });
      await ctx.db.insert("posts", {
        title: "Hello (draft edit)",
        slug: "hello",
        vex_status: "draft",
        vex_publishedId: publishedId,
      });
      const published = await ctx.db.get(publishedId);
      // Simulates what the caller's own `readableDocuments` pass already
      // did upstream for a caller who can't read `vex_status`: the field
      // is gone from `doc` by the time it reaches `mergeDraftCounterparts`.
      const { vex_status: _omitted, ...stripped } = published! as unknown as Record<string, unknown>;
      return mergeDraftCounterparts({
        ctx,
        collection: "posts",
        docs: [stripped as never],
        access: undefined,
        auth: undefined,
        resource: "posts",
        action: "read",
        fields,
      });
    });

    expect(result).toHaveLength(1);
    const merged = result[0] as unknown as Record<string, unknown>;
    expect(merged.hasUnpublishedChanges).toBe(true);
    expect(merged.title).toBe("Hello (draft edit)");
  });

  test("a draft-only row (never published) still passes through unmerged when vex_status is stripped", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const draftOnlyId = await ctx.db.insert("posts", {
        title: "Draft only",
        slug: "draft-only",
        vex_status: "draft",
      });
      const draftOnly = await ctx.db.get(draftOnlyId);
      const { vex_status: _omitted, ...stripped } = draftOnly! as unknown as Record<string, unknown>;
      return mergeDraftCounterparts({
        ctx,
        collection: "posts",
        docs: [stripped as never],
        access: undefined,
        auth: undefined,
        resource: "posts",
        action: "read",
        fields,
      });
    });

    expect(result).toHaveLength(1);
    const merged = result[0] as unknown as Record<string, unknown>;
    expect(merged.hasUnpublishedChanges).toBe(false);
    expect(merged.title).toBe("Draft only");
  });
});
