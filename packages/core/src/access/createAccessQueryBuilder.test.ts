import { describe, expect, it } from "vitest";
import { createAccessQueryBuilder, readAccessCondition } from "./createAccessQueryBuilder";

type PagesDoc = { authorId: string; categoryId: string; score: number; archived: boolean };
type PagesIndexes = {
  by_author: readonly ["authorId"];
  by_author_category: readonly ["authorId", "categoryId"];
};

/** A fresh `q`, as a rule receives it on a query action. */
const q = () => createAccessQueryBuilder<PagesDoc, PagesIndexes>();

describe("createAccessQueryBuilder — withIndex", () => {
  it("carries the index name and the range the callback built", () => {
    const condition = readAccessCondition<PagesDoc>(
      q().withIndex("by_author_category", (ix) =>
        ix.eq("authorId", "u1").eq("categoryId", "news"),
      ),
    );
    expect(condition).toEqual({
      index: {
        name: "by_author_category",
        constraints: [
          { field: "authorId", op: "eq", value: "u1" },
          { field: "categoryId", op: "eq", value: "news" },
        ],
      },
    });
  });

  it("leaves the filter half absent when only an index was used", () => {
    const condition = readAccessCondition<PagesDoc>(
      q().withIndex("by_author", (ix) => ix.eq("authorId", "u1")),
    );
    expect(condition?.filter).toBeUndefined();
  });
});

describe("createAccessQueryBuilder — filter", () => {
  it("carries the predicate tree when no index was used", () => {
    const condition = readAccessCondition<PagesDoc>(q().filter((f) => f.neq("archived", true)));
    expect(condition).toEqual({
      filter: { kind: "compare", field: "archived", op: "neq", value: true },
    });
  });

  it("preserves combinator nesting", () => {
    const condition = readAccessCondition<PagesDoc>(
      q().filter((f) => f.and(f.eq("authorId", "u1"), f.or(f.gte("score", 5), f.neq("archived", true)))),
    );
    expect(condition?.filter).toEqual({
      kind: "and",
      nodes: [
        { kind: "compare", field: "authorId", op: "eq", value: "u1" },
        {
          kind: "or",
          nodes: [
            { kind: "compare", field: "score", op: "gte", value: 5 },
            { kind: "compare", field: "archived", op: "neq", value: true },
          ],
        },
      ],
    });
  });

  it("leaves the index half absent when only a filter was used", () => {
    const condition = readAccessCondition<PagesDoc>(q().filter((f) => f.eq("authorId", "u1")));
    expect(condition?.index).toBeUndefined();
  });
});

describe("createAccessQueryBuilder — index AND filter together", () => {
  it("carries both halves — Convex's .withIndex(range).filter(expr) shape", () => {
    const condition = readAccessCondition<PagesDoc>(
      q()
        .withIndex("by_author", (ix) => ix.eq("authorId", "u1"))
        .filter((f) => f.neq("archived", true)),
    );
    expect(condition).toEqual({
      index: { name: "by_author", constraints: [{ field: "authorId", op: "eq", value: "u1" }] },
      filter: { kind: "compare", field: "archived", op: "neq", value: true },
    });
  });

  it("does not disturb the index-only value the rule already held", () => {
    const indexed = q().withIndex("by_author", (ix) => ix.eq("authorId", "u1"));
    indexed.filter((f) => f.neq("archived", true));
    // Continuing produced a NEW condition; `indexed` is still index-only.
    expect(readAccessCondition<PagesDoc>(indexed)?.filter).toBeUndefined();
  });
});

describe("createAccessQueryBuilder — only the returned value counts", () => {
  it("ignores a chain the rule built and discarded", () => {
    const builder = q();
    // Dead code: built, never returned.
    builder.withIndex("by_author", (ix) => ix.eq("authorId", "u1"));
    builder.filter((f) => f.neq("archived", true));
    // The rule returns a different condition entirely.
    const condition = readAccessCondition<PagesDoc>(builder.filter((f) => f.eq("categoryId", "news")));
    expect(condition).toEqual({
      filter: { kind: "compare", field: "categoryId", op: "eq", value: "news" },
    });
  });

  it("ignores an inner chain the range callback built and discarded", () => {
    const condition = readAccessCondition<PagesDoc>(
      q().withIndex("by_author_category", (ix) => {
        ix.eq("authorId", "discarded");
        return ix.eq("authorId", "kept");
      }),
    );
    expect(condition?.index?.constraints).toEqual([
      { field: "authorId", op: "eq", value: "kept" },
    ]);
  });

  it("keeps two builders independent", () => {
    const a = readAccessCondition<PagesDoc>(q().filter((f) => f.eq("authorId", "u1")));
    const b = readAccessCondition<PagesDoc>(
      q().withIndex("by_author", (ix) => ix.eq("authorId", "u2")),
    );
    expect(a?.index).toBeUndefined();
    expect(b?.filter).toBeUndefined();
    expect(b?.index?.name).toBe("by_author");
  });
});

describe("readAccessCondition — foreign values", () => {
  it("returns undefined for a value this module did not build", () => {
    expect(readAccessCondition({} as never)).toBeUndefined();
  });
});
