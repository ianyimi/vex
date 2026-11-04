import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import type { ConstraintBuilder, FilterConstraintBuilder } from "../access/queryConstraintTypes";
import { VexError } from "../errors";
import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import { checkbox, commitTs, relationship, row, select, tabs, text } from "../fields";
import {
  andConvexQueryFilters,
  convertCommitTsWhereToNs,
  normalizeArrayStoredWhere,
  referencedWhereFields,
  validateWhereNode,
  WHERE_DEPTH_LIMIT,
  WHERE_NODE_LIMIT,
  whereFieldNames,
  whereToConvexQueryFilter,
  whereToNode,
  withIndexToConvexQueryIndex,
  type VexWhere,
} from "./queryArgs";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

/** Shape of the fields these tests exercise, for typing the test callbacks precisely. */
type TestDoc = { title: string; slug: string; featured: boolean };
/** Index range callback type, typed against {@link TestDoc}'s fields. */
type RangeBuilder = (q: ConstraintBuilder<readonly ["featured"], TestDoc, 0>) => unknown;
/** Filter predicate callback type for these tests. */
type WhereBuilder = (q: FilterConstraintBuilder<TestDoc>) => unknown;

async function seed(ctx: GenericMutationCtx<GenericDataModel>) {
  await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
  await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
  await ctx.db.insert("posts", { title: "C", slug: "c", featured: true });
}

describe("withIndexToConvexQueryIndex", () => {
  test("undefined in, undefined out", () => {
    expect(withIndexToConvexQueryIndex({ withIndex: undefined })).toBeUndefined();
  });

  test("a range-less index compiles to its name only", () => {
    expect(withIndexToConvexQueryIndex({ withIndex: { name: "by_featured" } })).toEqual({ name: "by_featured" });
  });

  test("an eq range narrows the Convex index read", async () => {
    const t = convexTest(schema, modules);
    const titles = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await seed(ctx);
      const index = withIndexToConvexQueryIndex({
        withIndex: { name: "by_featured", range: ((q) => q.eq("featured", true)) as RangeBuilder as never },
      })!;
      const docs = await ctx.db.query("posts").withIndex(index.name, index.range!).collect();
      return docs.map((d) => d.title);
    });
    expect(titles).toEqual(["A", "C"]);
  });
});

describe("whereToConvexQueryFilter", () => {
  test("undefined in, undefined out", () => {
    expect(whereToConvexQueryFilter({ where: undefined })).toBeUndefined();
  });

  test("or + not compile to one Convex filter", async () => {
    const t = convexTest(schema, modules);
    const titles = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await seed(ctx);
      const filter = whereToConvexQueryFilter({
        where: ((q) => q.or(q.eq("slug", "b"), q.not(q.eq("featured", true)), q.eq("slug", "c"))) as WhereBuilder as never,
      })!;
      const docs = await ctx.db.query("posts").filter(filter).collect();
      return docs.map((d) => d.title);
    });
    expect(titles).toEqual(["B", "C"]);
  });

  test("a plain node and the equivalent builder compile to the same filter", async () => {
    const t = convexTest(schema, modules);
    await t.run(seed);
    const run = (where: VexWhere<string>) =>
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const filter = whereToConvexQueryFilter({ where, fields: ["title", "slug", "featured"] })!;
        return (await ctx.db.query("posts").filter(filter).collect()).map((d) => d.title);
      });
    const fromNode = await run({
      and: [
        { field: "featured", op: "eq", value: true },
        { field: "slug", op: "neq", value: "a" },
      ],
    });
    const fromBuilder = await run(((q: any) => q.and(q.eq("featured", true), q.neq("slug", "a"))) as never);
    expect(fromNode).toEqual(fromBuilder);
    expect(fromNode).toEqual(["C"]);
  });

  test("a malformed plain where throws VexError", () => {
    expect(() => whereToConvexQueryFilter({ where: { field: "featured", value: true } as never })).toThrow(VexError);
    expect(() =>
      whereToConvexQueryFilter({ where: { field: "featured", op: "startsWith", value: true } as never }),
    ).toThrow(VexError);
  });

  test("an unknown field throws VexError when fields are known", () => {
    expect(() =>
      whereToConvexQueryFilter({ where: { field: "nope", op: "eq", value: true } as never, fields: ["title"] }),
    ).toThrow(VexError);
  });

  test("an unknown field is NOT checked when fields are omitted", () => {
    expect(() => whereToConvexQueryFilter({ where: { field: "nope", op: "eq", value: true } as never })).not.toThrow();
  });
});

describe("validateWhereNode", () => {
  test("returns a valid tree unchanged", () => {
    const node = { and: [{ field: "featured", op: "eq", value: true }, { not: { field: "slug", op: "eq", value: "a" } }] };
    expect(validateWhereNode({ node, fields: ["featured", "slug"] })).toEqual(node);
  });

  test("rejects a non-object, an extra key, and a non-array combinator", () => {
    expect(() => validateWhereNode({ node: "featured" })).toThrow(VexError);
    expect(() => validateWhereNode({ node: { field: "a", op: "eq", value: 1, extra: true } })).toThrow(VexError);
    expect(() => validateWhereNode({ node: { and: { field: "a", op: "eq", value: 1 } } })).toThrow(VexError);
  });

  test("names the failing path and uses code INVALID_WHERE", () => {
    expect(() =>
      validateWhereNode({ node: { and: [{ field: "a", op: "eq", value: 1 }, { field: "a", op: "like", value: 1 }] } }),
    ).toThrow(expect.objectContaining({ data: expect.objectContaining({ code: "INVALID_WHERE", path: "where.and[1].op" }) }));
  });

  test.each(["and", "or"])("rejects an empty %s array", (combinator) => {
    expect(() => validateWhereNode({ node: { [combinator]: [] } })).toThrow(
      expect.objectContaining({ data: expect.objectContaining({ code: "INVALID_WHERE", path: `where.${combinator}` }) }),
    );
  });

  test("rejects trees over the node and depth limits", () => {
    const wide = { and: Array.from({ length: WHERE_NODE_LIMIT }, () => ({ field: "a", op: "eq", value: 1 })) };
    let deep: unknown = { field: "a", op: "eq", value: 1 };
    for (let i = 0; i < WHERE_DEPTH_LIMIT; i += 1) deep = { not: deep };
    expect(() => validateWhereNode({ node: wide })).toThrow(VexError);
    expect(() => validateWhereNode({ node: deep })).toThrow(VexError);
  });

  test("accepts a leaf missing the `value` key as value: undefined (isEmpty/isNotEmpty wire form)", () => {
    // Convex's own argument serialization drops an explicit `value: undefined`
    // property before the server ever sees it, so a stored `{ op: "eq", value:
    // undefined }` leaf (an `isEmpty` row) crosses the wire as `{ field, op }`
    // with no `value` key at all — this must round-trip identically to an
    // explicit `value: undefined`, not throw.
    expect(validateWhereNode({ node: { field: "title", op: "eq" } })).toEqual({
      field: "title",
      op: "eq",
      value: undefined,
    });
    expect(validateWhereNode({ node: { field: "title", op: "neq" } })).toEqual({
      field: "title",
      op: "neq",
      value: undefined,
    });
  });

  test("still rejects a leaf missing `op` even with only two keys", () => {
    expect(() => validateWhereNode({ node: { field: "title", value: "x" } })).toThrow(VexError);
  });
});

describe("whereToNode", () => {
  test("round-trips a builder call to the plain node whereToConvexQueryFilter accepts", async () => {
    const t = convexTest(schema, modules);
    const node = whereToNode<string>(((q: any) => q.and(q.eq("featured", true), q.not(q.eq("slug", "a")))) as never);
    const titles = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await seed(ctx);
      const filter = whereToConvexQueryFilter({ where: node })!;
      return (await ctx.db.query("posts").filter(filter).collect()).map((d) => d.title);
    });
    expect(titles).toEqual(["C"]);
  });
});

describe("andConvexQueryFilters", () => {
  test("drops absent filters and returns undefined when none remain", () => {
    expect(andConvexQueryFilters({ filters: [undefined, undefined] })).toBeUndefined();
  });

  test("a single filter is returned unwrapped", () => {
    const only = whereToConvexQueryFilter({ where: ((q) => q.eq("slug", "a")) as WhereBuilder as never });
    expect(andConvexQueryFilters({ filters: [undefined, only] })).toBe(only);
  });

  test("two filters intersect", async () => {
    const t = convexTest(schema, modules);
    const titles = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await seed(ctx);
      const filter = andConvexQueryFilters({
        filters: [
          whereToConvexQueryFilter({ where: ((q) => q.eq("featured", true)) as WhereBuilder as never }),
          whereToConvexQueryFilter({ where: ((q) => q.neq("slug", "a")) as WhereBuilder as never }),
        ],
      })!;
      return (await ctx.db.query("posts").filter(filter).collect()).map((d) => d.title);
    });
    expect(titles).toEqual(["C"]);
  });
});

describe("whereFieldNames", () => {
  test("includes declared fields, media collections, and the two system fields", () => {
    const config = {
      collections: [{ slug: "posts", fields: { title: text(), featured: checkbox() } }],
      mediaCollections: [{ slug: "images", fields: { alt: text() } }],
    };
    expect(whereFieldNames({ config, collection: "posts" })).toEqual(["title", "featured", "_id", "_creationTime"]);
    expect(whereFieldNames({ config, collection: "images" })).toEqual(["alt", "_id", "_creationTime"]);
    expect(whereFieldNames({ config, collection: "nope" })).toBeUndefined();
  });

  test("lists layout children under their data keys, never the layout key", () => {
    const config = {
      collections: [{
        slug: "posts",
        fields: {
          name: row({ fields: { first: text(), last: text() } }),
          info: tabs({ tabs: [{ label: "SEO", name: "seo", fields: { metaTitle: text() } }] }),
        },
      }],
    };
    expect(whereFieldNames({ config, collection: "posts" })).toEqual(["first", "last", "seo", "_id", "_creationTime"]);
  });

  test("additionally allows vex_status on a versioned collection, never a non-versioned one", () => {
    const config = {
      collections: [
        { slug: "posts", fields: { title: text() }, versions: { drafts: true } },
        { slug: "pages", fields: { title: text() } },
      ],
    };
    expect(whereFieldNames({ config, collection: "posts" })).toEqual([
      "title",
      "_id",
      "_creationTime",
      "vex_status",
    ]);
    expect(whereFieldNames({ config, collection: "pages" })).toEqual(["title", "_id", "_creationTime"]);
  });
});

describe("referencedWhereFields", () => {
  test("collects every leaf field once, from either form", () => {
    const node = { and: [{ field: "a", op: "eq", value: 1 }, { or: [{ field: "b", op: "eq", value: 2 }, { not: { field: "a", op: "eq", value: 3 } }] }] };
    expect(referencedWhereFields({ where: node as never })).toEqual(["a", "b"]);
    expect(referencedWhereFields({ where: ((q: any) => q.or(q.eq("a", 1), q.not(q.eq("b", 2)))) as never })).toEqual(["a", "b"]);
  });
});

describe("convertCommitTsWhereToNs", () => {
  const fields = { publishedAt: commitTs(), title: text() };

  test("converts a commitTs leaf's ms value to ns bigint", () => {
    const result = convertCommitTsWhereToNs({
      where: { field: "publishedAt", op: "gte", value: 1735689600000 },
      fields,
    });
    expect(result).toEqual({ field: "publishedAt", op: "gte", value: 1735689600000n * 1_000_000n });
  });

  test("leaves a non-commitTs leaf untouched", () => {
    const where = { field: "title", op: "eq", value: "hi" } as const;
    expect(convertCommitTsWhereToNs({ where, fields })).toEqual(where);
  });

  test("recurses through and/or/not", () => {
    const result = convertCommitTsWhereToNs({
      where: { and: [{ field: "publishedAt", op: "gte", value: 1000 }, { field: "title", op: "eq", value: "hi" }] },
      fields,
    });
    expect(result).toEqual({
      and: [{ field: "publishedAt", op: "gte", value: 1000n * 1_000_000n }, { field: "title", op: "eq", value: "hi" }],
    });
  });

  test("passes isEmpty/isNotEmpty leaves through (no value to convert)", () => {
    const where = { field: "publishedAt", op: "isEmpty" } as const;
    expect(convertCommitTsWhereToNs({ where: where as never, fields })).toEqual(where);
  });

  /**
   * `where` arrives on the wire as `v.any()`, so a
   * float or `NaN`/`Infinity` ms value on a `commitTs` field would
   * otherwise crash `BigInt(...)` with an uncaught `RangeError`. Converted
   * to a clear, caller-facing `VexError({ code: "INVALID_WHERE" })` naming
   * the field instead.
   */
  test("throws INVALID_WHERE naming the field for a non-integer number", () => {
    expect(() =>
      convertCommitTsWhereToNs({
        where: { field: "publishedAt", op: "gte", value: 1.5 },
        fields,
      }),
    ).toThrow(/Invalid where on commitTs field.*publishedAt/);
  });

  test("throws INVALID_WHERE naming the field for NaN/Infinity", () => {
    expect(() =>
      convertCommitTsWhereToNs({ where: { field: "publishedAt", op: "gte", value: NaN }, fields }),
    ).toThrow(/Invalid where on commitTs field.*publishedAt/);
    expect(() =>
      convertCommitTsWhereToNs({
        where: { field: "publishedAt", op: "gte", value: Infinity },
        fields,
      }),
    ).toThrow(/Invalid where on commitTs field.*publishedAt/);
  });

  test("the thrown error carries code: INVALID_WHERE", () => {
    try {
      convertCommitTsWhereToNs({ where: { field: "publishedAt", op: "gte", value: 1.5 }, fields });
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(VexError);
      expect((err as VexError).data).toMatchObject({ code: "INVALID_WHERE" });
    }
  });

  test("a non-integer value on a non-commitTs field is left untouched (out of scope)", () => {
    const where = { field: "title", op: "eq", value: 1.5 } as const;
    expect(convertCommitTsWhereToNs({ where: where as never, fields })).toEqual(where);
  });
});

describe("normalizeArrayStoredWhere", () => {
  // `select`/`relationship`/`upload` all store `v.array(...)` regardless of
  // `hasMany` (`fields/{select,relationship,upload}/validator.ts`) — the
  // bug this function fixes (`?filter=(status.eq.won)` returning zero rows
  // against 12 seeded `won` leads, verified live 2026-11-03.
  const fields = {
    status: select({ hasMany: false, options: [{ label: "Won", value: "won" }, { label: "Lost", value: "lost" }] }),
    tags: select({ hasMany: true, options: [{ label: "News", value: "news" }] }),
    contributorId: relationship({ collection: { slug: "authors" }, hasMany: false }),
    coAuthors: relationship({ collection: { slug: "authors" }, hasMany: true }),
    title: text(),
  };

  test("undefined in, undefined out", () => {
    expect(normalizeArrayStoredWhere({ where: undefined, fields })).toBeUndefined();
  });

  test("wraps a single-cardinality select field's eq value in a one-element array", () => {
    const where = { field: "status", op: "eq", value: "won" } as const;
    expect(normalizeArrayStoredWhere({ where: where as never, fields })).toEqual({
      field: "status",
      op: "eq",
      value: ["won"],
    });
  });

  test("wraps a single-cardinality relationship field's neq value the same way", () => {
    const where = { field: "contributorId", op: "neq", value: "author_123" } as const;
    expect(normalizeArrayStoredWhere({ where: where as never, fields })).toEqual({
      field: "contributorId",
      op: "neq",
      value: ["author_123"],
    });
  });

  test("leaves a hasMany field's eq value unwrapped — the membership/\"contains\" gap has no sound eq rewrite", () => {
    const where = { field: "tags", op: "eq", value: "news" } as const;
    expect(normalizeArrayStoredWhere({ where: where as never, fields })).toEqual(where);
  });

  test("leaves an already-array value unchanged (idempotent)", () => {
    const where = { field: "status", op: "eq", value: ["won"] } as const;
    expect(normalizeArrayStoredWhere({ where: where as never, fields })).toEqual(where);
  });

  test("leaves a non-array-stored field's eq value untouched", () => {
    const where = { field: "title", op: "eq", value: "hi" } as const;
    expect(normalizeArrayStoredWhere({ where: where as never, fields })).toEqual(where);
  });

  test("leaves gt/gte/lt/lte on an array-stored field untouched (not eq/neq)", () => {
    const where = { field: "status", op: "gt", value: "lost" } as const;
    expect(normalizeArrayStoredWhere({ where: where as never, fields })).toEqual(where);
  });

  test("rewrites isEmpty (eq with no value) on an array-stored field to match [] or a legacy missing field", () => {
    const where = { field: "contributorId", op: "eq", value: undefined } as const;
    expect(normalizeArrayStoredWhere({ where: where as never, fields })).toEqual({
      or: [
        { field: "contributorId", op: "eq", value: [] },
        { field: "contributorId", op: "eq", value: undefined },
      ],
    });
  });

  test("rewrites isNotEmpty (neq with no value) the same way, negated", () => {
    const where = { field: "contributorId", op: "neq", value: undefined } as const;
    expect(normalizeArrayStoredWhere({ where: where as never, fields })).toEqual({
      not: {
        or: [
          { field: "contributorId", op: "eq", value: [] },
          { field: "contributorId", op: "eq", value: undefined },
        ],
      },
    });
  });

  // The real-world shape `leads.ts`'s "From Contributors" preset ships:
  // `{ field: "contributorId", op: "neq", value: null }` — an explicit
  // `null`, not the `isEmpty` wire
  // form's missing `value` key. Array-stored fields never store `null`
  // (schema is always `v.array(...)`, optionally `v.optional(...)`), so
  // `null` means the same "no value" intent as `undefined` here.
  test("rewrites an explicit value: null leaf the same as isEmpty/isNotEmpty", () => {
    const where = { field: "contributorId", op: "neq", value: null } as const;
    expect(normalizeArrayStoredWhere({ where: where as never, fields })).toEqual({
      not: {
        or: [
          { field: "contributorId", op: "eq", value: [] },
          { field: "contributorId", op: "eq", value: undefined },
        ],
      },
    });
  });

  test("recurses through and/or/not, rewriting only array-stored leaves", () => {
    const where = {
      and: [
        { field: "status", op: "eq", value: "won" },
        { or: [{ field: "title", op: "eq", value: "hi" }, { not: { field: "contributorId", op: "eq", value: undefined } }] },
      ],
    } as const;
    expect(normalizeArrayStoredWhere({ where: where as never, fields })).toEqual({
      and: [
        { field: "status", op: "eq", value: ["won"] },
        {
          or: [
            { field: "title", op: "eq", value: "hi" },
            {
              not: {
                or: [
                  { field: "contributorId", op: "eq", value: [] },
                  { field: "contributorId", op: "eq", value: undefined },
                ],
              },
            },
          ],
        },
      ],
    });
  });

  // Confirms the rewritten shape against the REAL Convex runtime (not just
  // `valuesEqual`'s own JS reimplementation): both a declared index's range
  // and a `.filter()` expression compare an array-valued `eq`/`neq` by
  // CONTENT, exactly like `status: ["won"]` matching `eq ["won"]` needs to.
  test("the rewritten array-eq shape matches by content on a real Convex index range and filter", async () => {
    const t = convexTest(schema, modules);
    const { wonId, lostId } = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const wonId = await ctx.db.insert("posts", { title: "Won deal", slug: "won-deal", category: ["won"] });
      const lostId = await ctx.db.insert("posts", { title: "Lost deal", slug: "lost-deal", category: ["lost"] });
      return { wonId, lostId };
    });
    const where = normalizeArrayStoredWhere({
      where: { field: "category", op: "eq", value: "won" } as never,
      fields: { category: select({ hasMany: false, options: [{ label: "Won", value: "won" }] }) },
    })!;
    expect(where).toEqual({ field: "category", op: "eq", value: ["won"] });

    const viaIndex = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db
        .query("posts")
        .withIndex("by_category", (q) => q.eq("category", (where as { value: string[] }).value))
        .collect(),
    );
    expect(viaIndex.map((d) => d._id)).toEqual([wonId]);

    const filter = whereToConvexQueryFilter({ where: where as VexWhere<string> })!;
    const viaFilter = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("posts").filter(filter).collect(),
    );
    expect(viaFilter.map((d) => d._id).sort()).toEqual([wonId].sort());
    expect(viaFilter.map((d) => d._id)).not.toContain(lostId);
  });

  // Confirms the empty-check rewrite's `neq []` half against the real
  // Convex runtime: an empty array must NOT equal `null`/`undefined`
  // (the exact bug `{ field: "contributorId", op: "neq", value: null }`
  // hit — it matched every row because `[]` is never `=== null`), but DOES
  // equal `[]` by content.
  test("the rewritten empty-check shape excludes an empty array on a real Convex filter", async () => {
    const t = convexTest(schema, modules);
    const authorId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) => ctx.db.insert("authors", { name: "Ada" }));
    const { withAuthorId, emptyId } = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const withAuthorId = await ctx.db.insert("posts", { title: "Has author", slug: "has-author", author: [authorId] });
      const emptyId = await ctx.db.insert("posts", { title: "No author", slug: "no-author", author: [] });
      return { withAuthorId, emptyId };
    });
    const where = normalizeArrayStoredWhere({
      where: { field: "author", op: "neq", value: null } as never,
      fields: { author: relationship({ collection: { slug: "authors" }, hasMany: false }) },
    })!;
    const filter = whereToConvexQueryFilter({ where: where as VexWhere<string> })!;
    const docs = await t.run((ctx: GenericMutationCtx<GenericDataModel>) => ctx.db.query("posts").filter(filter).collect());
    expect(docs.map((d) => d._id)).toEqual([withAuthorId]);
    expect(docs.map((d) => d._id)).not.toContain(emptyId);
  });
});
