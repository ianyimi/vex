import { describe, expect, it } from "vitest";
import { createFilterConstraintBuilder } from "./createFilterConstraintBuilder";
import type { AccessFilterConstraint, ConstraintResult } from "./constraintTypes";

type PagesDoc = {
  authorId: string;
  categoryId: string;
  score: number;
  isPublic: boolean;
};

/**
 * Reinterprets a chain result as the tree node it is at runtime — exactly what the
 * framework does when it consumes a rule's return value. `ConstraintResult` is
 * nominal so a rule cannot forge one; it has no runtime representation.
 *
 * @param result - Value returned by a chain call.
 * @returns The same object, typed as a constraint node.
 */
function tree(result: ConstraintResult): AccessFilterConstraint<PagesDoc> {
  return result as unknown as AccessFilterConstraint<PagesDoc>;
}

describe("createFilterConstraintBuilder — comparisons", () => {
  it("records a flat comparison as one compare node", () => {
    const q = createFilterConstraintBuilder<PagesDoc>();
    expect(tree(q.eq("authorId", "u1"))).toEqual({
      kind: "compare",
      field: "authorId",
      op: "eq",
      value: "u1",
    });
  });

  it("records each operator with its own op literal", () => {
    const q = createFilterConstraintBuilder<PagesDoc>();
    expect(tree(q.eq("score", 1))).toMatchObject({ op: "eq", value: 1 });
    expect(tree(q.neq("score", 2))).toMatchObject({ op: "neq", value: 2 });
    expect(tree(q.gt("score", 3))).toMatchObject({ op: "gt", value: 3 });
    expect(tree(q.gte("score", 4))).toMatchObject({ op: "gte", value: 4 });
    expect(tree(q.lt("score", 5))).toMatchObject({ op: "lt", value: 5 });
    expect(tree(q.lte("score", 6))).toMatchObject({ op: "lte", value: 6 });
  });

  it("supports `neq`, which the indexed builder cannot express", () => {
    const q = createFilterConstraintBuilder<PagesDoc>();
    expect(tree(q.neq("isPublic", false))).toEqual({
      kind: "compare",
      field: "isPublic",
      op: "neq",
      value: false,
    });
  });
});

describe("createFilterConstraintBuilder — combinators", () => {
  it("records `and` children in argument order", () => {
    const q = createFilterConstraintBuilder<PagesDoc>();
    expect(tree(q.and(q.eq("authorId", "u1"), q.gt("score", 3)))).toEqual({
      kind: "and",
      nodes: [
        { kind: "compare", field: "authorId", op: "eq", value: "u1" },
        { kind: "compare", field: "score", op: "gt", value: 3 },
      ],
    });
  });

  it("records `or` children in argument order", () => {
    const q = createFilterConstraintBuilder<PagesDoc>();
    expect(tree(q.or(q.eq("authorId", "u1"), q.eq("isPublic", true)))).toEqual({
      kind: "or",
      nodes: [
        { kind: "compare", field: "authorId", op: "eq", value: "u1" },
        { kind: "compare", field: "isPublic", op: "eq", value: true },
      ],
    });
  });

  it("preserves tree shape for a nested `or` inside an `and`", () => {
    const q = createFilterConstraintBuilder<PagesDoc>();
    const result = q.and(
      q.eq("categoryId", "news"),
      q.or(q.eq("authorId", "u1"), q.eq("isPublic", true)),
    );
    expect(tree(result)).toEqual({
      kind: "and",
      nodes: [
        { kind: "compare", field: "categoryId", op: "eq", value: "news" },
        {
          kind: "or",
          nodes: [
            { kind: "compare", field: "authorId", op: "eq", value: "u1" },
            { kind: "compare", field: "isPublic", op: "eq", value: true },
          ],
        },
      ],
    });
  });

  it("wraps exactly one node in `not`", () => {
    const q = createFilterConstraintBuilder<PagesDoc>();
    expect(tree(q.not(q.eq("isPublic", false)))).toEqual({
      kind: "not",
      node: { kind: "compare", field: "isPublic", op: "eq", value: false },
    });
  });

  it("records a zero-argument `and` as an empty node list — the identity case", () => {
    const q = createFilterConstraintBuilder<PagesDoc>();
    expect(tree(q.and())).toEqual({ kind: "and", nodes: [] });
  });
});

describe("createFilterConstraintBuilder — statelessness", () => {
  it("returns a fresh node per call — an earlier result is never mutated by a later one", () => {
    const q = createFilterConstraintBuilder<PagesDoc>();
    const first = tree(q.eq("authorId", "u1"));
    q.eq("authorId", "u2");
    expect(first).toEqual({ kind: "compare", field: "authorId", op: "eq", value: "u1" });
  });

  it("does not share state between two builders — a combinator only sees what it was passed", () => {
    const a = createFilterConstraintBuilder<PagesDoc>();
    const b = createFilterConstraintBuilder<PagesDoc>();
    a.eq("authorId", "u1");
    expect(tree(b.and(b.eq("score", 9)))).toEqual({
      kind: "and",
      nodes: [{ kind: "compare", field: "score", op: "eq", value: 9 }],
    });
  });

  it("accepts a node built by a DIFFERENT builder — nodes are plain values, not bound to an instance", () => {
    const a = createFilterConstraintBuilder<PagesDoc>();
    const b = createFilterConstraintBuilder<PagesDoc>();
    expect(tree(a.not(b.eq("isPublic", true)))).toEqual({
      kind: "not",
      node: { kind: "compare", field: "isPublic", op: "eq", value: true },
    });
  });
});
