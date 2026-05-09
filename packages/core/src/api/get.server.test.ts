import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import type { DocumentBySlug } from "../types/generated";
import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import { get } from "./get.server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("get (server)", () => {
  test("returns the doc for an existing id", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const id = await ctx.db.insert("posts", {
          title: "Solo",
          slug: "solo",
        });
        return get({ ctx, id });
      },
    );
    expect(doc).toMatchObject({ title: "Solo", slug: "solo" });
  });

  test("returns null for a missing id", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const id = await ctx.db.insert("posts", { title: "Doomed", slug: "x" });
        await ctx.db.delete(id);
        return get({ ctx, id });
      },
    );
    expect(doc).toBeNull();
  });

  test("populate replaces Ids on a single doc", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const authorId = await ctx.db.insert("authors", { name: "Lena" });
        const postId = await ctx.db.insert("posts", {
          title: "Hi",
          slug: "hi",
          author: [authorId],
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return get({
          ctx,
          id: postId,
          populate: { author: true },
        } as any) as Promise<{ author: unknown; [k: string]: unknown } | null>;
      },
    );
    expect((doc?.author as DocumentBySlug["authors"][])?.[0].name).toBe("Lena");
  });
});
