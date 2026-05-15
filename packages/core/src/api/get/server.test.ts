import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import type { VexConfig } from "../../config";
import type { DocumentBySlug } from "../../types/generated";
import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import { get } from "./server";

// ── Minimal VexConfig fixture for depth tests ─────────────────────────────
const fixtureConfig: VexConfig = {
  collections: [
    {
      slug: "posts",
      fields: {
        title: { type: "text" },
        author: { type: "relationship", collection: { slug: "authors" } },
      },
      labels: { singular: "Post", plural: "Posts" },
      admin: { useAsTitle: "title" },
    },
    {
      slug: "authors",
      fields: {
        name: { type: "text" },
        organization: {
          type: "relationship",
          collection: { slug: "organizations" },
        },
      },
      labels: { singular: "Author", plural: "Authors" },
      admin: { useAsTitle: "name" },
    },
    {
      slug: "organizations",
      fields: { name: { type: "text" } },
      labels: { singular: "Organization", plural: "Organizations" },
      admin: { useAsTitle: "name" },
    },
  ],
} as unknown as VexConfig;

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

describe("get (server) — depth auto-populate", () => {
  test("depth: 1 auto-populates all direct relationship fields on a single doc", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const authorId = await ctx.db.insert("authors", { name: "Lena" });
        const postId = await ctx.db.insert("posts", {
          title: "Hi",
          slug: "hi",
          author: [authorId],
        });
        return get({ ctx, id: postId, depth: 1, config: fixtureConfig } as any);
      },
    ) as any;
    const author = (doc.author as DocumentBySlug["authors"][])[0];
    expect(author.name).toBe("Lena");
    expect(typeof author._id).toBe("string");
  });

  test("depth: 1 returns null when doc is missing", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const id = await ctx.db.insert("posts", { title: "Doomed", slug: "x" });
        await ctx.db.delete(id);
        return get({ ctx, id, depth: 1, config: fixtureConfig } as any);
      },
    );
    expect(doc).toBeNull();
  });

  test("depth: 2 populates nested relationships (posts → authors → organizations)", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const orgId = await ctx.db.insert("organizations", { name: "Vex Inc" });
        const authorId = await ctx.db.insert("authors", {
          name: "Lena",
          organization: [orgId],
        });
        const postId = await ctx.db.insert("posts", {
          title: "Hi",
          slug: "hi",
          author: [authorId],
        });
        return get({ ctx, id: postId, depth: 2, config: fixtureConfig } as any);
      },
    ) as any;
    const author = (doc.author as DocumentBySlug["authors"][])[0];
    expect(author.name).toBe("Lena");
    const org = (author.organization as unknown as DocumentBySlug["organizations"][])[0];
    expect(org.name).toBe("Vex Inc");
  });

  test("depth: 0 returns raw doc without population", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const authorId = await ctx.db.insert("authors", { name: "Lena" });
        const postId = await ctx.db.insert("posts", {
          title: "Hi",
          slug: "hi",
          author: [authorId],
        });
        return get({ ctx, id: postId, depth: 0, config: fixtureConfig } as any);
      },
    ) as any;
    // author should still be a raw ID array.
    expect(typeof doc.author[0]).toBe("string");
  });

  test("depth without config returns raw doc (effectivePopulate guard)", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const authorId = await ctx.db.insert("authors", { name: "Lena" });
        const postId = await ctx.db.insert("posts", {
          title: "Hi",
          slug: "hi",
          author: [authorId],
        });
        return get({ ctx, id: postId, depth: 1 } as any);
      },
    ) as any;
    // No config → buildDepthPopulate cannot run → raw ID preserved.
    expect(typeof doc.author[0]).toBe("string");
  });
});
