import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import schema from "./test/convex/schema";
import { populateDocs } from "./populate";
import type { PopulateShape } from "./types";
import type { DocumentBySlug } from "../types/generated";
import type { VexConfig } from "../config";
import { defineAccess } from "../access/config";
import { defineCollection, text } from "../index";
import * as _generatedApi from "./test/convex/_generated/api";

/** Explicit modules map for convex-test (replaces import.meta.glob which requires Vite). */
const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

/**
 * Minimal `VexConfig` fixture naming `authors`' own `updatedAt` as a
 * `commitTs` field — `populateDocs`'s `config` param uses this to resolve
 * which of a populated relationship TARGET's fields need ms conversion.
 */
const fixtureConfig: VexConfig = {
  collections: [
    {
      slug: "authors",
      fields: { name: { type: "text" }, updatedAt: { type: "commitTs", on: "save" } },
      labels: { singular: "Author", plural: "Authors" },
      admin: { useAsTitle: "name" },
    },
  ],
} as unknown as VexConfig;

describe("populateDocs", () => {
  test("returns docs unchanged when populate is empty", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const id = await ctx.db.insert("posts", { title: "Hi", slug: "hi" });
      const post = await ctx.db.get(id);
      return populateDocs(ctx, [post!], {});
    });
    expect(result[0]).toMatchObject({ title: "Hi", slug: "hi" });
  });

  test("populates a single relationship field", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena Park" });
      const postId = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        author: [authorId],
      });
      const post = await ctx.db.get(postId);
      return populateDocs(ctx, [post!], { author: true } as PopulateShape);
    });

    const populated = (result as any[])[0].author as DocumentBySlug["authors"][];
    expect(populated[0].name).toBe("Lena Park");
  });

  test("converts a populated relationship target's commitTs field to ms", async () => {
    const t = convexTest(schema, modules);
    const resolvedNs = BigInt(1_700_000_000_000) * BigInt(1_000_000);
    const result = await t.run(async (ctx) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena Park", updatedAt: resolvedNs });
      const postId = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        author: [authorId],
      });
      const post = await ctx.db.get(postId);
      return populateDocs(ctx, [post!], { author: true } as PopulateShape, undefined, fixtureConfig);
    });

    const populated = (result[0] as unknown as Record<string, unknown>).author as Record<
      string,
      unknown
    >[];
    expect(typeof populated[0].updatedAt).toBe("number");
    expect(populated[0].updatedAt).toBe(1_700_000_000_000);
  });

  test("recurses into nested populate (2 levels)", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
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
      const post = await ctx.db.get(postId);
      return populateDocs(ctx, [post!], {
        author: { populate: { organization: true } },
      } as PopulateShape);
    });

    const author = ((result as any[])[0].author as DocumentBySlug["authors"][])[0];
    expect((author.organization as unknown as DocumentBySlug["organizations"][])[0].name).toBe(
      "Vex Inc",
    );
  });

  test("recurses 5 levels deep using self-referencing parent (D12)", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      // Build a chain: l5 -> l4 -> l3 -> l2 -> l1 -> start
      const l5 = await ctx.db.insert("posts", { title: "L5", slug: "l5" });
      const l4 = await ctx.db.insert("posts", {
        title: "L4",
        slug: "l4",
        parent: [l5],
      });
      const l3 = await ctx.db.insert("posts", {
        title: "L3",
        slug: "l3",
        parent: [l4],
      });
      const l2 = await ctx.db.insert("posts", {
        title: "L2",
        slug: "l2",
        parent: [l3],
      });
      const l1 = await ctx.db.insert("posts", {
        title: "L1",
        slug: "l1",
        parent: [l2],
      });
      const startId = await ctx.db.insert("posts", {
        title: "Start",
        slug: "start",
        parent: [l1],
      });
      const start = await ctx.db.get(startId);
      return populateDocs(ctx, [start!], {
        parent: {
          populate: {
            parent: { populate: { parent: { populate: { parent: true } } } },
          },
        },
      } as PopulateShape);
    });

    let cursor: any = result[0];
    for (let i = 1; i <= 4; i++) {
      cursor = cursor.parent[0];
      expect(cursor.title).toBe(`L${i}`);
    }
  });

  test("skips fields that are missing or not arrays", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      // post with no author field set
      const postId = await ctx.db.insert("posts", {
        title: "Solo",
        slug: "solo",
      });
      const post = await ctx.db.get(postId);
      return populateDocs(ctx, [post!], { author: true } as PopulateShape);
    });
    expect(result[0]).toMatchObject({ title: "Solo", slug: "solo" });

    expect((result as any[])[0].author).toBeUndefined();
  });

  test("filters out missing target docs (deleted ids)", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena" });
      const postId = await ctx.db.insert("posts", {
        title: "Hi",
        slug: "hi",
        author: [authorId],
      });
      // Delete the author after referencing it
      await ctx.db.delete(authorId);
      const post = await ctx.db.get(postId);
      return populateDocs(ctx, [post!], { author: true } as PopulateShape);
    });

    expect(((result as any[])[0].author as DocumentBySlug["authors"][]).length).toBe(0);
  });
});

describe("populateDocs — nested blocks()/array()/group()", () => {
  test("populates a relationship nested directly inside a blocks() block", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const postId = await ctx.db.insert("posts", { title: "Linked", slug: "linked" });
      const pageId = await ctx.db.insert("nestedPages", {
        title: "Landing",
        content: [{ blockType: "cta", id: "cta-1", link: [postId] }],
      });
      const page = await ctx.db.get(pageId);
      return populateDocs(ctx, [page!], {
        content: { cta: { link: true } },
      } as PopulateShape);
    });

    const doc = (result as unknown as Record<string, unknown>[])[0];
    const content = doc.content as Record<string, unknown>[];
    const link = content[0].link as Record<string, unknown>[];
    expect(link[0].title).toBe("Linked");
  });

  test("populates an upload nested inside array(group()) items", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const imageId = await ctx.db.insert("images", { filename: "cover.png" });
      const pageId = await ctx.db.insert("nestedPages", {
        title: "Gallery page",
        gallery: [{ id: "g-1", caption: "First", asset: [imageId] }],
      });
      const page = await ctx.db.get(pageId);
      return populateDocs(ctx, [page!], { gallery: { asset: true } } as PopulateShape);
    });

    const doc = (result as unknown as Record<string, unknown>[])[0];
    const gallery = doc.gallery as Record<string, unknown>[];
    const asset = gallery[0].asset as Record<string, unknown>[];
    expect(asset[0].filename).toBe("cover.png");
  });

  test("populates an upload nested inside a plain group()", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const imageId = await ctx.db.insert("images", { filename: "og.png" });
      const pageId = await ctx.db.insert("nestedPages", {
        title: "SEO page",
        seo: { ogImage: [imageId] },
      });
      const page = await ctx.db.get(pageId);
      return populateDocs(ctx, [page!], { seo: { ogImage: true } } as PopulateShape);
    });

    const doc = (result as unknown as Record<string, unknown>[])[0];
    const seo = doc.seo as Record<string, unknown>;
    const ogImage = seo.ogImage as Record<string, unknown>[];
    expect(ogImage[0].filename).toBe("og.png");
  });

  test("batches a nested field's ids across every matching block/item from every parent doc into one resolution pass", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const imageA = await ctx.db.insert("images", { filename: "a.png" });
      const imageB = await ctx.db.insert("images", { filename: "b.png" });
      const page1 = await ctx.db.insert("nestedPages", {
        title: "One",
        content: [
          { blockType: "hero", id: "h-1", image: [imageA] },
          { blockType: "cta", id: "c-1" }, // no link — different block type, same field key
        ],
      });
      const page2 = await ctx.db.insert("nestedPages", {
        title: "Two",
        content: [{ blockType: "hero", id: "h-2", image: [imageB] }],
      });
      const docs = [(await ctx.db.get(page1))!, (await ctx.db.get(page2))!];
      return populateDocs(ctx, docs, { content: { hero: { image: true } } } as PopulateShape);
    });

    const docs = result as unknown as Record<string, unknown>[];
    const firstHero = (docs[0].content as Record<string, unknown>[])[0];
    const secondHero = (docs[1].content as Record<string, unknown>[])[0];
    expect((firstHero.image as Record<string, unknown>[])[0].filename).toBe("a.png");
    expect((secondHero.image as Record<string, unknown>[])[0].filename).toBe("b.png");
  });

  test("recurses through a nested relationship's own `{ populate }` — crossing from a block into the target collection", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena Park" });
      const postId = await ctx.db.insert("posts", {
        title: "Linked",
        slug: "linked",
        author: [authorId],
      });
      const pageId = await ctx.db.insert("nestedPages", {
        title: "Landing",
        content: [{ blockType: "cta", id: "cta-1", link: [postId] }],
      });
      const page = await ctx.db.get(pageId);
      return populateDocs(ctx, [page!], {
        content: { cta: { link: { populate: { author: true } } } },
      } as PopulateShape);
    });

    const doc = (result as unknown as Record<string, unknown>[])[0];
    const content = doc.content as Record<string, unknown>[];
    const link = (content[0].link as Record<string, unknown>[])[0];
    const author = (link.author as Record<string, unknown>[])[0];
    expect(author.name).toBe("Lena Park");
  });

  test("a nested populated field not requested stays a raw id array", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const imageId = await ctx.db.insert("images", { filename: "cover.png" });
      const pageId = await ctx.db.insert("nestedPages", {
        title: "Gallery page",
        gallery: [{ id: "g-1", asset: [imageId] }],
      });
      const page = await ctx.db.get(pageId);
      return populateDocs(ctx, [page!], {} as PopulateShape);
    });

    const doc = (result as unknown as Record<string, unknown>[])[0];
    const gallery = doc.gallery as Record<string, unknown>[];
    const asset = gallery[0].asset as unknown[];
    expect(typeof asset[0]).toBe("string");
  });

  test("mutating a nested block's populated field leaves the ORIGINAL input doc's nested array untouched", async () => {
    const t = convexTest(schema, modules);
    const { original, populated } = await t.run(async (ctx) => {
      const imageId = await ctx.db.insert("images", { filename: "cover.png" });
      const pageId = await ctx.db.insert("nestedPages", {
        title: "Landing",
        content: [{ blockType: "hero", id: "h-1", image: [imageId] }],
      });
      const page = (await ctx.db.get(pageId))!;
      const populated = await populateDocs(ctx, [page], {
        content: { hero: { image: true } },
      } as PopulateShape);
      return { original: page, populated };
    });

    const originalContent = original.content as unknown as Record<string, unknown>[];
    const originalImage = originalContent[0].image as unknown[];
    expect(typeof originalImage[0]).toBe("string"); // untouched — still a raw id

    const populatedDoc = (populated as unknown as Record<string, unknown>[])[0];
    const populatedContent = populatedDoc.content as Record<string, unknown>[];
    expect((populatedContent[0].image as Record<string, unknown>[])[0].filename).toBe("cover.png");
  });
});

/**
 * `rbacConfig` adds an `access` matrix on top of `fixtureConfig`, declaring
 * `authors` (the relationship TARGET `populateDocs` resolves below) as a
 * resource — exercising the same read decision + field-permission map a
 * direct `get({ collection: "authors" })` would apply, now reached through
 * a populated `author` field on an unrelated `posts` document instead.
 */
const authorsResource = defineCollection({
  slug: "authors",
  fields: { name: text(), slug: text() },
});

const rbacConfig: VexConfig = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["admin", "restricted", "fieldRestricted"] as const,
    resources: [authorsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      admin: { authors: true },
      restricted: { authors: { read: false } },
      // Ignores `data`/`user` — the map is static, mirroring the
      // `get/server.test.ts` field-map fixture.
      fieldRestricted: { authors: { read: () => ({ "*": true, name: false }) } },
    },
  }),
} as unknown as VexConfig;

const restrictedAuth = { user: { _id: "u1", roles: ["restricted"] } };
const adminAuth = { user: { _id: "u2", roles: ["admin"] } };
const fieldRestrictedAuth = { user: { _id: "u3", roles: ["fieldRestricted"] } };

describe("populateDocs — RBAC enforcement", () => {
  test("a role without read on the target collection gets a HiddenDocument placeholder instead of the doc", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena Park" });
      const postId = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        author: [authorId],
      });
      const post = await ctx.db.get(postId);
      return populateDocs(
        ctx,
        [post!],
        { author: true } as PopulateShape,
        undefined,
        rbacConfig,
        rbacConfig.access,
        restrictedAuth,
      );
    });

    const populated = (result as unknown as Record<string, unknown>[])[0].author as Record<string, unknown>[];
    expect(populated).toHaveLength(1);
    expect(populated[0]).toMatchObject({ code: "ACCESS_DENIED", resource: "authors", action: "read" });
    expect(populated[0].name).toBeUndefined();
  });

  test("field map strips denied fields from an otherwise-readable populated target", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena Park", slug: "lena" });
      const postId = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        author: [authorId],
      });
      const post = await ctx.db.get(postId);
      return populateDocs(
        ctx,
        [post!],
        { author: true } as PopulateShape,
        undefined,
        rbacConfig,
        rbacConfig.access,
        fieldRestrictedAuth,
      );
    });

    const populated = (result as unknown as Record<string, unknown>[])[0].author as Record<string, unknown>[];
    expect(populated).toHaveLength(1);
    expect(populated[0].code).toBeUndefined(); // readable, not a placeholder
    expect(populated[0].name).toBeUndefined(); // denied field stripped
    expect(populated[0].slug).toBe("lena"); // undenied field kept
  });

  test("a permitted role gets the full populated target", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena Park" });
      const postId = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        author: [authorId],
      });
      const post = await ctx.db.get(postId);
      return populateDocs(
        ctx,
        [post!],
        { author: true } as PopulateShape,
        undefined,
        rbacConfig,
        rbacConfig.access,
        adminAuth,
      );
    });

    const populated = (result as unknown as Record<string, unknown>[])[0].author as DocumentBySlug["authors"][];
    expect(populated[0].name).toBe("Lena Park");
  });

  test("access: undefined (the shape a bypassed/unconfigured top-level call forwards) returns full docs regardless of a restrictive config", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena Park" });
      const postId = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        author: [authorId],
      });
      const post = await ctx.db.get(postId);
      return populateDocs(
        ctx,
        [post!],
        { author: true } as PopulateShape,
        undefined,
        rbacConfig,
        undefined, // bypass: access resolves to undefined, same as an unconfigured call
        restrictedAuth,
      );
    });

    const populated = (result as unknown as Record<string, unknown>[])[0].author as DocumentBySlug["authors"][];
    expect(populated[0].name).toBe("Lena Park");
  });
});

describe("populateDocs — draft exclusion", () => {
  test("excludes a populated target that is currently a draft", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const authorId = await ctx.db.insert("authors", {
        name: "Lena Park",
        vex_status: "draft",
      });
      const postId = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        author: [authorId],
      });
      const post = await ctx.db.get(postId);
      return populateDocs(ctx, [post!], { author: true } as PopulateShape);
    });

    const populated = (result as any[])[0].author as DocumentBySlug["authors"][];
    expect(populated).toHaveLength(0);
  });

  test("includes a draft target when drafts: true is passed", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const authorId = await ctx.db.insert("authors", {
        name: "Lena Park",
        vex_status: "draft",
      });
      const postId = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        author: [authorId],
      });
      const post = await ctx.db.get(postId);
      return populateDocs(ctx, [post!], { author: true } as PopulateShape, true);
    });

    const populated = (result as any[])[0].author as DocumentBySlug["authors"][];
    expect(populated[0].name).toBe("Lena Park");
  });

  test("includes a published target by default — the common case is unaffected", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const authorId = await ctx.db.insert("authors", {
        name: "Lena Park",
        vex_status: "published",
      });
      const postId = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        author: [authorId],
      });
      const post = await ctx.db.get(postId);
      return populateDocs(ctx, [post!], { author: true } as PopulateShape);
    });

    const populated = (result as any[])[0].author as DocumentBySlug["authors"][];
    expect(populated[0].name).toBe("Lena Park");
  });
});
