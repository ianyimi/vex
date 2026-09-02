import { describe, expect, it } from "vitest";
import type {
  AccessIndexConstraint,
  ConstraintBuilder,
  ConstraintResult,
  DeclaredDoc,
} from "./constraintTypes";

type PagesDoc = {
  authorId: string;
  categoryId: string;
  score: number;
  title: string;
};

/** Every chain method returns the same object, so a full chain call sequence runs without throwing. */
function fakeConstraintBuilder(): any {
  const chain: any = {
    eq: () => chain,
    gt: () => chain,
    gte: () => chain,
    lt: () => chain,
    lte: () => chain,
  };
  return chain;
}

const q3 = fakeConstraintBuilder() as ConstraintBuilder<
  readonly ["authorId", "categoryId", "score"],
  PagesDoc
>;
const q1 = fakeConstraintBuilder() as ConstraintBuilder<readonly ["authorId"], PagesDoc>;

/** Consumes a chain result to prove it satisfies `ConstraintResult` — the positive-case assertion. */
function acceptsConstraintResult(result: ConstraintResult): void {
  void result;
}

describe("ConstraintBuilder — eq chains", () => {
  it("accepts a single eq() on a compound index's first field", () => {
    acceptsConstraintResult(q3.eq("authorId", "u1"));
  });

  it("accepts eq() chained across two fields, in index order", () => {
    acceptsConstraintResult(q3.eq("authorId", "u1").eq("categoryId", "news"));
  });

  it("accepts eq() chained across all three fields", () => {
    acceptsConstraintResult(q3.eq("authorId", "u1").eq("categoryId", "news").eq("score", 5));
  });

  it("accepts a single-field index's only eq()", () => {
    acceptsConstraintResult(q1.eq("authorId", "u1"));
  });
});

describe("ConstraintBuilder — bounds", () => {
  it("accepts a lower bound after a prefix of eq()", () => {
    acceptsConstraintResult(q3.eq("authorId", "u1").gte("categoryId", "a"));
  });

  it("accepts a lower bound followed by one upper bound on the same field", () => {
    acceptsConstraintResult(q3.eq("authorId", "u1").gte("categoryId", "a").lt("categoryId", "z"));
  });

  it("accepts a lower + upper bound on the index's first field with no eq() at all", () => {
    acceptsConstraintResult(q3.gte("authorId", "a").lte("authorId", "z"));
  });
});

describe("ConstraintBuilder — rejects illegal chains", () => {
  it("rejects eq() after a lower bound", () => {
    // @ts-expect-error `eq` is not available after `gte` — LowerBound stage only exposes bound methods
    q3.eq("authorId", "u1").gte("categoryId", "a").eq("score", 5);
  });

  it("rejects a second lower bound", () => {
    // @ts-expect-error `gte` is not available after `gte` — only one lower bound per chain
    q3.gte("authorId", "a").gte("authorId", "b");
  });

  it("rejects anything after an upper bound", () => {
    // @ts-expect-error the chain is terminal after `lt` — UpperBoundConstraintBuilder has no further methods
    q3.gte("authorId", "a").lt("authorId", "z").eq("categoryId", "x");
  });

  it("rejects the wrong field for the current cursor position", () => {
    // @ts-expect-error field 0 of this index is "authorId", not "categoryId"
    q3.eq("categoryId", "news");
  });

  it("rejects skipping a field", () => {
    // @ts-expect-error field 1 is "categoryId", not "score" — eq() cannot skip ahead
    q3.eq("authorId", "u1").eq("score", 5);
  });

  it("rejects a value of the wrong type for the field", () => {
    // @ts-expect-error `score` is a number field; "5" is a string
    q3.eq("authorId", "u1").eq("categoryId", "news").eq("score", "5");
  });

  it("rejects constraining past the end of a single-field index", () => {
    // @ts-expect-error by_author is spent after one eq() — NextConstraintBuilder terminates at length 1
    q1.eq("authorId", "u1").eq("categoryId", "news");
  });

  it("rejects a plain object literal forging the nominal ConstraintResult", () => {
    const forged: ConstraintResult = {
      // @ts-expect-error ConstraintResult is nominal — only a real chain call can produce one
      field: "authorId",
      op: "eq",
      value: "u1",
    };
    expect(forged).toBeDefined();
  });
});

describe("AccessIndexConstraint / IndexOp", () => {
  it("accepts a record shaped from a real op literal and the field's own value type", () => {
    const constraint: AccessIndexConstraint<"authorId", PagesDoc> = {
      field: "authorId",
      op: "eq",
      value: "u1",
    };
    expect(constraint).toEqual({ field: "authorId", op: "eq", value: "u1" });
  });
});

describe("DeclaredDoc — index signature stripping", () => {
  it("rejects an undeclared property on a document carrying an index signature", () => {
    // Generated documents extend `VexDocument`, whose `[key: string]: unknown` makes
    // every property name readable. A permission callback typed against the raw
    // document therefore accepts `data.tpyo` as `unknown` instead of erroring, which
    // defeats the point of typing it at all.
    interface WithSignature {
      [key: string]: unknown;
      title: string;
    }
    const read = (doc: DeclaredDoc<WithSignature>) => doc.title;
    expect(read({ title: "t" })).toBe("t");

    const probe = (doc: DeclaredDoc<WithSignature>) =>
      // @ts-expect-error — stripped, so an undeclared key is an error not `unknown`
      doc.neverDeclared;
    expect(probe({ title: "t" })).toBeUndefined();
  });

  it("leaves an unresolved document type alone", () => {
    // Pre-`vex generate` the registry is unaugmented and a document resolves to
    // `unknown`. Stripping there would yield `{}` and make every real field
    // unreadable, so the widening is deliberately skipped.
    const read = (doc: DeclaredDoc<unknown>) => doc;
    expect(read("anything")).toBe("anything");
  });
});
