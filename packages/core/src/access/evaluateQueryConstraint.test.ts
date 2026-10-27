import { describe, expect, it } from "vitest";

import { evaluateQueryConstraint } from "./evaluateQueryConstraint";

/** Evaluates one rule for caller `u1`. */
const evaluate = (check: Record<string, unknown>) =>
  evaluateQueryConstraint({ check: check as never, callerProps: { user: { _id: "u1" } } });

const statusIndex = {
  name: "by_status",
  constraints: [{ field: "status", op: "eq", value: "published" }],
};
const notArchived = { kind: "compare", field: "archived", op: "neq", value: true };

describe("evaluateQueryConstraint — withIndex", () => {
  it("records the { name, range } a callback returns", () => {
    expect(
      evaluate({ withIndex: () => ({ name: "by_status", range: (ix: any) => ix.eq("status", "published") }) }),
    ).toEqual({ index: statusIndex });
  });

  it("records the static { name, range } identically", () => {
    expect(
      evaluate({ withIndex: { name: "by_status", range: (ix: any) => ix.eq("status", "published") } }),
    ).toEqual({ index: statusIndex });
  });

  it("passes the caller to the callback", () => {
    expect(
      evaluate({
        withIndex: ({ user }: { user: { _id: string } }) => ({
          name: "by_author",
          range: (ix: any) => ix.eq("authorId", user._id),
        }),
      }),
    ).toEqual({ index: { name: "by_author", constraints: [{ field: "authorId", op: "eq", value: "u1" }] } });
  });

  it("records a compound range in call order", () => {
    expect(
      evaluate({
        withIndex: { name: "by_author_category", range: (ix: any) => ix.eq("authorId", "u1").eq("categoryId", "news") },
      }),
    ).toEqual({
      index: {
        name: "by_author_category",
        constraints: [
          { field: "authorId", op: "eq", value: "u1" },
          { field: "categoryId", op: "eq", value: "news" },
        ],
      },
    });
  });

  it("ignores the rule-level filter", () => {
    expect(
      evaluate({ withIndex: { name: "by_status", range: (ix: any) => ix.eq("status", "published") }, filter: () => false }),
    ).toEqual({ index: statusIndex });
  });
});

describe("evaluateQueryConstraint — where", () => {
  it("records the predicate tree", () => {
    expect(evaluate({ where: ({ q }: { q: any }) => q.neq("archived", true) })).toEqual({ where: notArchived });
  });

  it("preserves combinator nesting", () => {
    expect(
      evaluate({ where: ({ q }: { q: any }) => q.and(q.eq("authorId", "u1"), q.or(q.gte("score", 5), q.neq("archived", true))) }),
    ).toEqual({
      where: {
        kind: "and",
        nodes: [
          { kind: "compare", field: "authorId", op: "eq", value: "u1" },
          {
            kind: "or",
            nodes: [
              { kind: "compare", field: "score", op: "gte", value: 5 },
              notArchived,
            ],
          },
        ],
      },
    });
  });
});

describe("evaluateQueryConstraint — both halves and short-circuits", () => {
  it("carries both halves together", () => {
    expect(
      evaluate({
        withIndex: { name: "by_status", range: (ix: any) => ix.eq("status", "published") },
        where: ({ q }: { q: any }) => q.neq("archived", true),
      }),
    ).toEqual({ index: statusIndex, where: notArchived });
  });

  it("omits the index key when withIndex returns true", () => {
    const outcome = evaluate({ withIndex: () => true, where: ({ q }: { q: any }) => q.neq("archived", true) });
    expect(outcome).toEqual({ where: notArchived });
    expect(outcome).not.toHaveProperty("index");
  });

  it("is true when every present half returns true", () => {
    expect(evaluate({ withIndex: () => true, where: () => true })).toBe(true);
  });

  it("is false when either half returns false", () => {
    expect(evaluate({ withIndex: () => false, where: ({ q }: { q: any }) => q.eq("a", 1) })).toBe(false);
    expect(evaluate({ where: () => false })).toBe(false);
  });
});

describe("evaluateQueryConstraint — unreadable halves", () => {
  it("is undefined for a hand-built where", () => {
    expect(evaluate({ where: () => ({ field: "a" }) })).toBeUndefined();
  });

  it("is undefined for a selection without a range, in either form", () => {
    expect(evaluate({ withIndex: () => ({ name: "by_x" }) })).toBeUndefined();
    expect(evaluate({ withIndex: { name: "by_x" } })).toBeUndefined();
  });

  it("is undefined when a callback returns nothing", () => {
    expect(evaluate({ withIndex: () => undefined })).toBeUndefined();
    expect(evaluate({ where: () => undefined })).toBeUndefined();
  });

  it("rethrows from where even when withIndex returns true", () => {
    expect(() =>
      evaluate({
        withIndex: () => true,
        where: () => {
          throw new Error("boom");
        },
      }),
    ).toThrow("boom");
  });
});

describe("evaluateQueryConstraint — static where", () => {
  it("records a plain node as the predicate tree", () => {
    expect(evaluate({ where: { field: "archived", op: "neq", value: true } })).toEqual({ where: notArchived });
  });

  it("is undefined (denied), not a crash, for a malformed plain node", () => {
    expect(evaluate({ where: { field: "archived", op: "like", value: true } })).toBeUndefined();
    expect(evaluate({ where: { or: [] } })).toBeUndefined();
  });

  it("carries a static withIndex and a static where together", () => {
    expect(
      evaluate({
        withIndex: { name: "by_status", range: (ix: any) => ix.eq("status", "published") },
        where: { field: "archived", op: "neq", value: true },
      }),
    ).toEqual({ index: statusIndex, where: notArchived });
  });
});
