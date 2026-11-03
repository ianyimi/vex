import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import type { ConstraintBuilder, FilterConstraintBuilder } from "../access/queryConstraintTypes";
import { VexError } from "../errors";
import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import { checkbox, commitTs, row, tabs, text } from "../fields";
import {
  andConvexQueryFilters,
  convertCommitTsWhereToNs,
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

  test("accepts a leaf missing the `value` key as value: undefined (Decision 10's isEmpty/isNotEmpty wire form)", () => {
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
   * Polish fix (Decision 4): `where` arrives on the wire as `v.any()`, so a
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
