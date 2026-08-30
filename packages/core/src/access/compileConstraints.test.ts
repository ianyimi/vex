import { describe, expect, it } from "vitest";
import type { AccessFilterConstraint, AccessIndexConstraint } from "./constraintTypes";
import {
  accessConstraintsToFilter,
  accessConstraintsToIndexRange,
  accessConstraintsToPredicate,
  accessFilterTreeToFilter,
  accessFilterTreeToPredicate,
} from "./compileConstraints";
import { FilterBuilder, GenericDocument, GenericTableInfo } from "convex/server";

type TestDoc = GenericDocument & {
  authorId: string;
  score: number;
  title: string;
  // Optional — only the new nested-combinator / edge-value tests below use these;
  // existing `{ authorId, score, title }` literals stay valid.
  tags?: string[];
  featured?: boolean;
  views?: number;
  priority?: number;
  status?: string;
};

/** Records every `eq`/`gt`/`gte`/`lt`/`lte` call, chaining like the real `IndexRangeBuilder`. */
function recordingRangeBuilder() {
  const calls: Array<[string, string, unknown]> = [];

  const builder: any = {};
  for (const op of ["eq", "gt", "gte", "lt", "lte"] as const) {
    builder[op] = (field: string, value: unknown) => {
      calls.push([op, field, value]);
      return builder;
    };
  }
  return { builder, calls };
}

/** Records every `FilterBuilder` call by method name, without evaluating. */
function recordingFilterBuilder() {
  const calls: string[] = [];

  const builder: any = { field: (path: string) => ({ __field: path }) };
  for (const op of ["eq", "gt", "gte", "lt", "lte", "and"] as const) {
    builder[op] = (...args: unknown[]) => {
      calls.push(op);
      return { __expr: op, args };
    };
  }
  return { builder, calls };
}

/** A `FilterBuilder` double that evaluates against `doc` instead of building an AST. */
function evaluatingFilterBuilder(doc: TestDoc) {
  return {
    field: (path: keyof TestDoc) => doc[path],
    eq: (l: unknown, r: unknown) => l === r,
    gt: (l: unknown, r: unknown) => (l as number) > (r as number),
    gte: (l: unknown, r: unknown) => (l as number) >= (r as number),
    lt: (l: unknown, r: unknown) => (l as number) < (r as number),
    lte: (l: unknown, r: unknown) => (l as number) <= (r as number),
    and: (...exprs: boolean[]) => exprs.every(Boolean),
  } as any;
}

describe("constraintsToIndexRange", () => {
  it("applies a single eq constraint", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
    ];
    const { builder, calls } = recordingRangeBuilder();
    accessConstraintsToIndexRange({ constraints })(builder);
    expect(calls).toEqual([["eq", "authorId", "u1"]]);
  });

  it("applies eq then a lower bound in order", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "score", op: "gte", value: 5 },
    ];
    const { builder, calls } = recordingRangeBuilder();
    accessConstraintsToIndexRange({ constraints })(builder);
    expect(calls).toEqual([
      ["eq", "authorId", "u1"],
      ["gte", "score", 5],
    ]);
  });

  it("applies a lower bound then an upper bound on the same field", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "score", op: "gte", value: 1 },
      { field: "score", op: "lt", value: 10 },
    ];
    const { builder, calls } = recordingRangeBuilder();
    accessConstraintsToIndexRange({ constraints })(builder);
    expect(calls).toEqual([
      ["gte", "score", 1],
      ["lt", "score", 10],
    ]);
  });

  it("returns the builder unchanged for an empty constraint list", () => {
    const { builder, calls } = recordingRangeBuilder();
    expect(accessConstraintsToIndexRange({ constraints: [] })(builder)).toBe(builder);
    expect(calls).toEqual([]);
  });
});

describe("constraintsToFilter", () => {
  it("returns a single expression for one constraint, without wrapping in and", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
    ];
    const { builder, calls } = recordingFilterBuilder();
    accessConstraintsToFilter({ constraints, q: builder });
    expect(calls).toEqual(["eq"]);
  });

  it("ands an eq and a lower bound together", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "score", op: "gte", value: 5 },
    ];
    const { builder, calls } = recordingFilterBuilder();
    accessConstraintsToFilter({ constraints, q: builder });
    expect(calls).toEqual(["eq", "gte", "and"]);
  });

  it("ands a lower and an upper bound on the same field", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "score", op: "gte", value: 1 },
      { field: "score", op: "lt", value: 10 },
    ];
    const { builder, calls } = recordingFilterBuilder();
    accessConstraintsToFilter({ constraints, q: builder });
    expect(calls).toEqual(["gte", "lt", "and"]);
  });
});

describe("constraintsToPredicate", () => {
  it("accepts a matching document and rejects a non-matching one, eq-only", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
    ];
    const predicate = accessConstraintsToPredicate({ constraints });
    expect(predicate({ authorId: "u1", score: 1, title: "x" })).toBe(true);
    expect(predicate({ authorId: "u2", score: 1, title: "x" })).toBe(false);
  });

  it("evaluates a lower bound then an upper bound on the same field", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "score", op: "gte", value: 1 },
      { field: "score", op: "lt", value: 10 },
    ];
    const predicate = accessConstraintsToPredicate({ constraints });
    expect(predicate({ authorId: "u1", score: 5, title: "x" })).toBe(true);
    expect(predicate({ authorId: "u1", score: 10, title: "x" })).toBe(false);
    expect(predicate({ authorId: "u1", score: 0, title: "x" })).toBe(false);
  });

  it("returns true for an empty constraint list", () => {
    expect(
      accessConstraintsToPredicate({ constraints: [] })({
        authorId: "u1",
        score: 1,
        title: "x",
      }),
    ).toBe(true);
  });

  it("includes the boundary for gte and lte, excludes it for gt and lt", () => {
    const doc: TestDoc = { authorId: "u1", score: 5, title: "x" };
    const at = (op: AccessIndexConstraint<string, TestDoc>["op"]) =>
      accessConstraintsToPredicate<TestDoc>({ constraints: [{ field: "score", op, value: 5 }] })(
        doc,
      );
    expect(at("gte")).toBe(true);
    expect(at("lte")).toBe(true);
    expect(at("gt")).toBe(false);
    expect(at("lt")).toBe(false);
    expect(at("eq")).toBe(true);
  });

  it("treats a missing field as unsatisfied rather than throwing", () => {
    const predicate = accessConstraintsToPredicate<TestDoc>({
      constraints: [{ field: "absent", op: "eq", value: "x" }],
    });
    expect(predicate({ authorId: "u1", score: 1, title: "x" })).toBe(false);
  });

  it("requires EVERY constraint to hold, not just one", () => {
    const predicate = accessConstraintsToPredicate<TestDoc>({
      constraints: [
        { field: "authorId", op: "eq", value: "u1" },
        { field: "score", op: "gte", value: 5 },
      ],
    });
    expect(predicate({ authorId: "u1", score: 5, title: "x" })).toBe(true);
    expect(predicate({ authorId: "u1", score: 4, title: "x" })).toBe(false);
    expect(predicate({ authorId: "u2", score: 9, title: "x" })).toBe(false);
  });
});

describe("constraintsToPredicate and constraintsToFilter agree", () => {
  it("agree on a matching and a non-matching document for a mixed eq + bound constraint set", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "score", op: "gte", value: 5 },
    ];
    const matching: TestDoc = { authorId: "u1", score: 10, title: "x" };
    const nonMatching: TestDoc = { authorId: "u1", score: 1, title: "x" };
    for (const doc of [matching, nonMatching]) {
      const viaPredicate = accessConstraintsToPredicate({ constraints })(doc);
      const viaFilter = accessConstraintsToFilter({
        constraints,
        q: evaluatingFilterBuilder(doc),
      });
      expect(viaFilter).toBe(viaPredicate);
    }
  });

  it("agree AT the boundary — the case that distinguishes gte from gt", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "score", op: "gte", value: 5 },
      { field: "score", op: "lte", value: 5 },
    ];
    const onBoundary: TestDoc = { authorId: "u1", score: 5, title: "x" };
    const justOutside: TestDoc = { authorId: "u1", score: 6, title: "x" };
    for (const doc of [onBoundary, justOutside]) {
      expect(
        accessConstraintsToFilter({ constraints, q: evaluatingFilterBuilder(doc) }),
      ).toBe(accessConstraintsToPredicate({ constraints })(doc));
    }
    // And pin the expected answers, so both agreeing on a WRONG value still fails.
    expect(accessConstraintsToPredicate({ constraints })(onBoundary)).toBe(true);
    expect(accessConstraintsToPredicate({ constraints })(justOutside)).toBe(false);
  });
});

describe("constraintsToFilter — caller contract", () => {
  it("throws on an empty constraint list — an unrestricted rule never reaches a compile target", () => {
    const { builder } = recordingFilterBuilder();
    expect(() => accessConstraintsToFilter({ constraints: [], q: builder })).toThrow(
      /must be non-empty/,
    );
  });
});

describe("filter tree compilers", () => {
  /** A `FilterBuilder` double that evaluates a tree instead of building an AST. */
  function evaluatingTreeBuilder(doc: TestDoc) {
    return {
      field: (path: keyof TestDoc) => doc[path],
      eq: (l: unknown, r: unknown) => l === r,
      neq: (l: unknown, r: unknown) => l !== r,
      gt: (l: unknown, r: unknown) => (l as number) > (r as number),
      gte: (l: unknown, r: unknown) => (l as number) >= (r as number),
      lt: (l: unknown, r: unknown) => (l as number) < (r as number),
      lte: (l: unknown, r: unknown) => (l as number) <= (r as number),
      and: (...e: boolean[]) => e.every(Boolean),
      or: (...e: boolean[]) => e.some(Boolean),
      not: (e: boolean) => !e,
       
    } as any;
  }

  const nested: AccessFilterConstraint<TestDoc> = {
    kind: "and",
    nodes: [
      { kind: "compare", field: "authorId", op: "eq", value: "u1" },
      {
        kind: "or",
        nodes: [
          { kind: "compare", field: "score", op: "gte", value: 5 },
          { kind: "not", node: { kind: "compare", field: "title", op: "neq", value: "x" } },
        ],
      },
    ],
  };

  it("evaluates a nested and/or/not tree as a predicate", () => {
    const predicate = accessFilterTreeToPredicate({ node: nested });
    expect(predicate({ authorId: "u1", score: 9, title: "z" })).toBe(true);
    expect(predicate({ authorId: "u1", score: 1, title: "x" })).toBe(true);
    expect(predicate({ authorId: "u1", score: 1, title: "z" })).toBe(false);
    expect(predicate({ authorId: "u2", score: 9, title: "z" })).toBe(false);
  });

  it("supports neq, which the flat index compilers cannot express", () => {
    const predicate = accessFilterTreeToPredicate<TestDoc>({
      node: { kind: "compare", field: "authorId", op: "neq", value: "u1" },
    });
    expect(predicate({ authorId: "u2", score: 1, title: "x" })).toBe(true);
    expect(predicate({ authorId: "u1", score: 1, title: "x" })).toBe(false);
  });

  it("treats an empty and as true and an empty or as false — the operators' identities", () => {
    expect(accessFilterTreeToPredicate<TestDoc>({ node: { kind: "and", nodes: [] } })({
      authorId: "u1",
      score: 1,
      title: "x",
    })).toBe(true);
    expect(accessFilterTreeToPredicate<TestDoc>({ node: { kind: "or", nodes: [] } })({
      authorId: "u1",
      score: 1,
      title: "x",
    })).toBe(false);
  });

  it("agrees with the filter-expression compiler on the same tree", () => {
    for (const doc of [
      { authorId: "u1", score: 9, title: "z" },
      { authorId: "u1", score: 1, title: "x" },
      { authorId: "u1", score: 1, title: "z" },
      { authorId: "u2", score: 9, title: "z" },
    ] satisfies TestDoc[]) {
      expect(accessFilterTreeToFilter({ node: nested, q: evaluatingTreeBuilder(doc) })).toBe(
        accessFilterTreeToPredicate({ node: nested })(doc),
      );
    }
  });
});

describe("agreement — every index operator across a shared candidate set", () => {
  // One constraint value (5) and a battery of candidates spanning the boundary, a
  // type-mismatched string, a null, and a field the document never set at all — run
  // through every operator `AccessIndexConstraint` supports. A per-operator `it`
  // keeps a single divergence attributable to one comparator rather than buried in
  // a combined loop.
  const candidates: Array<Partial<Pick<TestDoc, "score">>> = [
    { score: 0 },
    { score: 4 },
    { score: 5 },
    { score: 6 },
    {},
    { score: null as unknown as number },
    { score: "5" as unknown as number },
  ];

  for (const op of ["eq", "gt", "gte", "lt", "lte"] as const) {
    it(`predicate and filter agree on every "${op}" candidate`, () => {
      const constraints: AccessIndexConstraint<string, TestDoc>[] = [
        { field: "score", op, value: 5 },
      ];
      for (const partial of candidates) {
        const doc = { authorId: "u1", title: "x", ...partial } as unknown as TestDoc;
        const viaPredicate = accessConstraintsToPredicate({ constraints })(doc);
        const viaFilter = accessConstraintsToFilter({
          constraints,
          q: evaluatingFilterBuilder(doc),
        });
        expect(viaPredicate, `op=${op} score=${JSON.stringify(partial.score)}`).toBe(viaFilter);
      }
    });
  }
});

describe("predicate — undefined, missing, and null are distinct", () => {
  it("a missing key and an explicit `undefined` value read identically via bracket access", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "score", op: "eq", value: undefined as unknown as number },
    ];
    const predicate = accessConstraintsToPredicate({ constraints });
    const missing = { authorId: "u1", title: "x" } as unknown as TestDoc;
    const explicitUndefined = {
      authorId: "u1",
      title: "x",
      score: undefined,
    } as unknown as TestDoc;
    expect(predicate(missing)).toBe(true);
    expect(predicate(explicitUndefined)).toBe(true);
  });

  it("`null` is never equal to `undefined` or to a missing field", () => {
    const nullDoc = { authorId: "u1", title: "x", score: null } as unknown as TestDoc;
    const missingDoc = { authorId: "u1", title: "x" } as unknown as TestDoc;

    const eqUndefined: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "score", op: "eq", value: undefined as unknown as number },
    ];
    expect(accessConstraintsToPredicate({ constraints: eqUndefined })(nullDoc)).toBe(false);

    const eqNull: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "score", op: "eq", value: null as unknown as number },
    ];
    expect(accessConstraintsToPredicate({ constraints: eqNull })(missingDoc)).toBe(false);
    expect(accessConstraintsToPredicate({ constraints: eqNull })(nullDoc)).toBe(true);
  });
});

describe("predicate — falsy values are not treated as absent", () => {
  it("zero satisfies eq(0) and is distinct from a missing field", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "score", op: "eq", value: 0 },
    ];
    const predicate = accessConstraintsToPredicate({ constraints });
    expect(predicate({ authorId: "u1", title: "x", score: 0 })).toBe(true);
    expect(predicate({ authorId: "u1", title: "x" } as unknown as TestDoc)).toBe(false);
  });

  it("false satisfies eq(false) and is distinct from 0 and from a missing field", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "featured", op: "eq", value: false },
    ];
    const predicate = accessConstraintsToPredicate({ constraints });
    expect(
      predicate({ authorId: "u1", title: "x", score: 1, featured: false }),
    ).toBe(true);
    expect(
      predicate({ authorId: "u1", title: "x", score: 1, featured: 0 } as unknown as TestDoc),
    ).toBe(false);
    expect(predicate({ authorId: "u1", title: "x", score: 1 })).toBe(false);
  });

  it('an empty string satisfies eq("") and is distinct from a missing field', () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "title", op: "eq", value: "" },
    ];
    const predicate = accessConstraintsToPredicate({ constraints });
    expect(predicate({ authorId: "u1", title: "", score: 1 })).toBe(true);
    expect(predicate({ authorId: "u1", score: 1 } as unknown as TestDoc)).toBe(false);
  });
});

describe("constraintsToIndexRange — longer chains", () => {
  it("applies a three-field eq chain in order", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "title", op: "eq", value: "hello" },
      { field: "score", op: "eq", value: 5 },
    ];
    const { builder, calls } = recordingRangeBuilder();
    accessConstraintsToIndexRange({ constraints })(builder);
    expect(calls).toEqual([
      ["eq", "authorId", "u1"],
      ["eq", "title", "hello"],
      ["eq", "score", 5],
    ]);
  });

  it("applies eq, then a lower bound, then an upper bound in one chain", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "score", op: "gte", value: 1 },
      { field: "score", op: "lt", value: 10 },
    ];
    const { builder, calls } = recordingRangeBuilder();
    accessConstraintsToIndexRange({ constraints })(builder);
    expect(calls).toEqual([
      ["eq", "authorId", "u1"],
      ["gte", "score", 1],
      ["lt", "score", 10],
    ]);
  });
});

describe("constraintsToFilter — longer chains", () => {
  it("ands a three-constraint list in ONE and() call, not nested pairwise", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "score", op: "gte", value: 1 },
      { field: "score", op: "lt", value: 10 },
    ];
    const { builder, calls } = recordingFilterBuilder();
    accessConstraintsToFilter({ constraints, q: builder });
    expect(calls).toEqual(["eq", "gte", "lt", "and"]);
  });
});

describe("agreement — array-valued fields (relationship/select storage) compared with eq/neq", () => {
  // Convex's REAL `.eq()`/`.neq()` — both the index-range form and the `.filter()`
  // form — serialize their operand through `convexOrUndefinedToJson` before sending
  // it to the backend for evaluation there:
  //   convex/dist/esm/server/impl/index_range_builder_impl.js — `eq(fieldName, value)`
  //     pushes `{ type: "Eq", fieldPath, value: convexOrUndefinedToJson(value) }`
  //   convex/dist/esm/server/impl/filter_builder_impl.js — `eq`/`neq` serialize both
  //     operands the same way before building the `$eq`/`$neq` expression node.
  // Equality there is STRUCTURAL — by value — never JS object identity.
  // `structurallyEvaluatingFilterBuilder`/`structurallyEvaluatingTreeBuilder` below
  // model that; it is what the compiled query ACTUALLY selects, unlike the plain
  // `===` of `evaluatingFilterBuilder`/`evaluatingTreeBuilder` above.
  //
  // `CONSTRAINT_COMPARATORS.eq` / `FILTER_COMPARATORS.eq`+`neq`
  // (compileConstraints.ts) use JS `===`/`!==`, which is REFERENCE equality for
  // arrays. A relationship/select field's stored array and a freshly built
  // comparison array are never the same reference — this is exactly the shape
  // `buildChecks.ts`'s `indexedOwnerCheck` records for a relationship owner field:
  // `ix.eq(field, [id])`, a brand-new array literal built from the caller's id. These
  // were the regression pins for the reference-vs-content equality divergence
  // (DD 43); `CONSTRAINT_COMPARATORS.eq` is content equality now, so they pass and
  // guard against a relapse.

  function structuralEq(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function structurallyEvaluatingFilterBuilder(doc: TestDoc) {
    return {
      field: (path: keyof TestDoc) => doc[path],
      eq: structuralEq,
      gt: (l: unknown, r: unknown) => (l as number) > (r as number),
      gte: (l: unknown, r: unknown) => (l as number) >= (r as number),
      lt: (l: unknown, r: unknown) => (l as number) < (r as number),
      lte: (l: unknown, r: unknown) => (l as number) <= (r as number),
      and: (...exprs: boolean[]) => exprs.every(Boolean),
    } as unknown as FilterBuilder<GenericTableInfo>;
  }

  function structurallyEvaluatingTreeBuilder(doc: TestDoc) {
    return {
      field: (path: keyof TestDoc) => doc[path],
      eq: structuralEq,
      neq: (l: unknown, r: unknown) => !structuralEq(l, r),
      gt: (l: unknown, r: unknown) => (l as number) > (r as number),
      gte: (l: unknown, r: unknown) => (l as number) >= (r as number),
      lt: (l: unknown, r: unknown) => (l as number) < (r as number),
      lte: (l: unknown, r: unknown) => (l as number) <= (r as number),
      and: (...e: boolean[]) => e.every(Boolean),
      or: (...e: boolean[]) => e.some(Boolean),
      not: (e: boolean) => !e,
    } as unknown as FilterBuilder<GenericTableInfo>;
  }

  it("eq on a relationship/select array agrees between query and predicate (indexedOwnerCheck's exact shape)", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "tags", op: "eq", value: ["u1"] },
    ];
    const doc = { authorId: "u1", title: "x", score: 1, tags: ["u1"] } as TestDoc;

    const viaCompiledQuery = accessConstraintsToFilter({
      constraints,
      q: structurallyEvaluatingFilterBuilder(doc),
    });
    const viaPredicate = accessConstraintsToPredicate({ constraints })(doc);

    expect(viaCompiledQuery).toBe(true);
    expect(viaPredicate).toBe(viaCompiledQuery);
  });

  it("eq on an empty array agrees the same way", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "tags", op: "eq", value: [] },
    ];
    const doc = { authorId: "u1", title: "x", score: 1, tags: [] } as TestDoc;

    const viaCompiledQuery = accessConstraintsToFilter({
      constraints,
      q: structurallyEvaluatingFilterBuilder(doc),
    });
    const viaPredicate = accessConstraintsToPredicate({ constraints })(doc);

    expect(viaCompiledQuery).toBe(true);
    expect(viaPredicate).toBe(viaCompiledQuery);
  });

  it("neq on a relationship/select array does not false-positive in the predicate (the dangerous direction)", () => {
    const node: AccessFilterConstraint<TestDoc> = {
      kind: "compare",
      field: "tags",
      op: "neq",
      value: ["draft"],
    };
    const doc = { authorId: "u1", title: "x", score: 1, tags: ["draft"] } as TestDoc;

    const viaCompiledQuery = accessFilterTreeToFilter({
      node: node as AccessFilterConstraint<GenericDocument>,
      q: structurallyEvaluatingTreeBuilder(doc),
    });
    const viaPredicate = accessFilterTreeToPredicate({ node: node as AccessFilterConstraint<GenericDocument> })(doc);

    // Structurally, `doc.tags` EQUALS `["draft"]`, so `neq` is false — Convex's
    // real filter excludes this document.
    expect(viaCompiledQuery).toBe(false);
    // `a !== b` is `true` for two distinct array instances regardless of contents,
    // so the predicate ADMITS a document the compiled query would have excluded.
    expect(viaPredicate).toBe(viaCompiledQuery);
  });

  it("agrees when the SAME array reference is compared — isolates the bug to identity, not a broken comparator", () => {
    const shared = ["u1"];
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "tags", op: "eq", value: shared },
    ];
    const doc = { authorId: "u1", title: "x", score: 1, tags: shared } as TestDoc;
    expect(accessConstraintsToPredicate({ constraints })(doc)).toBe(true);
    expect(
      accessConstraintsToFilter({ constraints, q: structurallyEvaluatingFilterBuilder(doc) }),
    ).toBe(true);
  });
});

describe("filter tree — deeper nested combinators", () => {
  function evaluatingRichTreeBuilder(doc: TestDoc) {
    return {
      field: (path: keyof TestDoc) => doc[path],
      eq: (l: unknown, r: unknown) => l === r,
      neq: (l: unknown, r: unknown) => l !== r,
      gt: (l: unknown, r: unknown) => (l as number) > (r as number),
      gte: (l: unknown, r: unknown) => (l as number) >= (r as number),
      lt: (l: unknown, r: unknown) => (l as number) < (r as number),
      lte: (l: unknown, r: unknown) => (l as number) <= (r as number),
      and: (...e: boolean[]) => e.every(Boolean),
      or: (...e: boolean[]) => e.some(Boolean),
      not: (e: boolean) => !e,
    } as unknown as FilterBuilder<GenericTableInfo>;
  }

  it("agrees on a `not` wrapping an `or` — 2 levels deep", () => {
    const node: AccessFilterConstraint<TestDoc> = {
      kind: "not",
      node: {
        kind: "or",
        nodes: [
          { kind: "compare", field: "status", op: "eq", value: "draft" },
          { kind: "compare", field: "views", op: "lt", value: 10 },
        ],
      },
    };
    const docs: TestDoc[] = [
      { authorId: "u1", score: 1, title: "x", status: "draft", views: 100 },
      { authorId: "u1", score: 1, title: "x", status: "published", views: 5 },
      { authorId: "u1", score: 1, title: "x", status: "published", views: 100 },
      { authorId: "u1", score: 1, title: "x" },
    ];
    for (const doc of docs) {
      expect(accessFilterTreeToPredicate({ node: node as AccessFilterConstraint<GenericDocument> })(doc)).toBe(
        accessFilterTreeToFilter({ node, q: evaluatingRichTreeBuilder(doc) }),
      );
    }
    // Pin the semantics, not just cross-agreement: `not(draft OR views < 10)`.
    expect(accessFilterTreeToPredicate({ node: node as AccessFilterConstraint<GenericDocument> })(docs[0]!)).toBe(false); // draft
    expect(accessFilterTreeToPredicate({ node: node as AccessFilterConstraint<GenericDocument> })(docs[1]!)).toBe(false); // views<10
    expect(accessFilterTreeToPredicate({ node: node as AccessFilterConstraint<GenericDocument> })(docs[2]!)).toBe(true); // neither
  });

  it("agrees on an `or` containing an `and` — 2 levels deep", () => {
    const node: AccessFilterConstraint<TestDoc> = {
      kind: "or",
      nodes: [
        {
          kind: "and",
          nodes: [
            { kind: "compare", field: "score", op: "gte", value: 5 },
            { kind: "compare", field: "score", op: "lte", value: 20 },
          ],
        },
        { kind: "compare", field: "featured", op: "neq", value: false },
      ],
    };
    const docs: TestDoc[] = [
      { authorId: "u1", score: 10, title: "x", featured: false },
      { authorId: "u1", score: 1, title: "x", featured: true },
      { authorId: "u1", score: 1, title: "x", featured: false },
      { authorId: "u1", score: 1, title: "x" },
    ];
    for (const doc of docs) {
      expect(accessFilterTreeToPredicate({ node: node as AccessFilterConstraint<GenericDocument> })(doc)).toBe(
        accessFilterTreeToFilter({ node, q: evaluatingRichTreeBuilder(doc) }),
      );
    }
    expect(accessFilterTreeToPredicate({ node: node as AccessFilterConstraint<GenericDocument> })(docs[0]!)).toBe(true); // in range
    expect(accessFilterTreeToPredicate({ node: node as AccessFilterConstraint<GenericDocument> })(docs[1]!)).toBe(true); // featured
    expect(accessFilterTreeToPredicate({ node: node as AccessFilterConstraint<GenericDocument> })(docs[2]!)).toBe(false); // neither
    // `featured` missing ⇒ `undefined !== false` ⇒ true: absence reads as "not
    // explicitly false", the same falsy-vs-absent distinction pinned above.
    expect(accessFilterTreeToPredicate({ node: node as AccessFilterConstraint<GenericDocument> })(docs[3]!)).toBe(true);
  });

  it("agrees on a 3-level and/or/not tree spanning every comparison operator", () => {
    const node: AccessFilterConstraint<TestDoc> = {
      kind: "and",
      nodes: [
        {
          kind: "not",
          node: {
            kind: "or",
            nodes: [
              { kind: "compare", field: "status", op: "eq", value: "draft" },
              { kind: "compare", field: "views", op: "lt", value: 10 },
            ],
          },
        },
        {
          kind: "or",
          nodes: [
            {
              kind: "and",
              nodes: [
                { kind: "compare", field: "score", op: "gte", value: 5 },
                { kind: "compare", field: "score", op: "lte", value: 20 },
              ],
            },
            { kind: "compare", field: "featured", op: "neq", value: false },
          ],
        },
        { kind: "compare", field: "priority", op: "gt", value: 0 },
      ],
    };
    const docs: TestDoc[] = [
      {
        authorId: "u1",
        score: 10,
        title: "x",
        status: "published",
        views: 100,
        featured: false,
        priority: 1,
      },
      {
        authorId: "u1",
        score: 10,
        title: "x",
        status: "draft",
        views: 100,
        featured: false,
        priority: 1,
      },
      {
        authorId: "u1",
        score: 1,
        title: "x",
        status: "published",
        views: 100,
        featured: false,
        priority: 1,
      },
      {
        authorId: "u1",
        score: 10,
        title: "x",
        status: "published",
        views: 100,
        featured: false,
        priority: 0,
      },
      { authorId: "u1", score: 1, title: "x" },
    ];
    for (const doc of docs) {
      expect(accessFilterTreeToPredicate({ node: node as AccessFilterConstraint<GenericDocument> })(doc)).toBe(
        accessFilterTreeToFilter({ node, q: evaluatingRichTreeBuilder(doc) }),
      );
    }
  });
});
