import { describe, expect, it } from "vitest";
import type { AccessIndexConstraint } from "./constraintTypes";
import { validateAccessConstraints } from "./validateAccessConstraints";
import { GenericDocument } from "convex/server";

type Doc = GenericDocument & { authorId: string; categoryId: string; score: number };

/** A nested index family: by_author ⊂ by_author_category ⊂ by_author_category_score. */
const indexFields = {
  by_author: ["authorId"],
  by_author_category: ["authorId", "categoryId"],
  by_author_category_score: ["authorId", "categoryId", "score"],
} as const;

const base = { role: "contributor", resource: "pages", action: "read" };

describe("validateAccessConstraints — valid shapes", () => {
  it("accepts an eq-only prefix of a declared index", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
    ];
    expect(() => validateAccessConstraints({ ...base, constraints, indexFields })).not.toThrow();
  });

  it("accepts a lower bound followed by an upper bound on the same field", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "eq", value: "news" },
      { field: "score", op: "gte", value: 1 },
      { field: "score", op: "lt", value: 10 },
    ];
    expect(() => validateAccessConstraints({ ...base, constraints, indexFields })).not.toThrow();
  });

  it("accepts an empty constraint list — an unrestricted range", () => {
    expect(() =>
      validateAccessConstraints({ ...base, constraints: [], indexFields }),
    ).not.toThrow();
  });
});

describe("validateAccessConstraints — field sequence must be an in-order prefix of a declared index", () => {
  it("throws when no declared index has this field prefix", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "categoryId", op: "eq", value: "news" },
    ];
    expect(() => validateAccessConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint fields [categoryId] are not an in-order prefix of any declared index',
    );
  });
});

describe("validateAccessConstraints — operator sequencing", () => {
  it("throws on eq after a bound", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "gte", value: "a" },
      { field: "score", op: "eq", value: 5 },
    ];
    expect(() => validateAccessConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint 3 ("score") uses "eq" after a bound — eq must precede every gt/gte/lt/lte',
    );
  });

  it("throws on a second lower bound", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "gte", value: "a" },
      { field: "categoryId", op: "gte", value: "b" },
    ];
    expect(() => validateAccessConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint 2 ("categoryId") is a second lower bound — at most one gt/gte is allowed',
    );
  });

  it("throws on anything after an upper bound", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "lt", value: "z" },
      { field: "score", op: "eq", value: 5 },
    ];
    expect(() => validateAccessConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint 3 ("score") follows an upper bound — nothing may follow lt/lte',
    );
  });

  it("throws when a lower and upper bound pin different fields", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "gte", value: "a" },
      { field: "score", op: "lt", value: 10 },
    ];
    expect(() => validateAccessConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint 3 ("score") is a bound on a different field than the prior bound ("categoryId") — bounds must pin the same field',
    );
  });
});

describe("validateAccessConstraints — additional field-sequence shapes", () => {
  it("throws when fields are supplied out of declared order", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "categoryId", op: "eq", value: "news" },
      { field: "authorId", op: "eq", value: "u1" },
    ];
    expect(() => validateAccessConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint fields [categoryId, authorId] are not an in-order prefix of any declared index',
    );
  });

  it("throws when a middle field is skipped, leaving a gap", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "score", op: "eq", value: 5 },
    ];
    expect(() => validateAccessConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint fields [authorId, score] are not an in-order prefix of any declared index',
    );
  });

  it("throws when the constraint list is longer than every declared index", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "eq", value: "news" },
      { field: "score", op: "eq", value: 5 },
      { field: "extra", op: "eq", value: "z" },
    ];
    expect(() => validateAccessConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint fields [authorId, categoryId, score, extra] are not an in-order prefix of any declared index',
    );
  });

  it("throws when the resource declares no indexes at all", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
    ];
    expect(() =>
      validateAccessConstraints({ ...base, constraints, indexFields: {} }),
    ).toThrow(
      'role "contributor" on pages.read: constraint fields [authorId] are not an in-order prefix of any declared index',
    );
  });
});

describe("validateAccessConstraints — bare bounds with no preceding eq are a valid range", () => {
  it("accepts a bare upper bound on the index's first field", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "lt", value: "z" },
    ];
    expect(() => validateAccessConstraints({ ...base, constraints, indexFields })).not.toThrow();
  });

  it("accepts a bare lower bound on the index's first field", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "gte", value: "a" },
    ];
    expect(() => validateAccessConstraints({ ...base, constraints, indexFields })).not.toThrow();
  });

  it("accepts an eq prefix followed directly by an upper bound, with no lower bound in between", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "lt", value: "z" },
    ];
    expect(() => validateAccessConstraints({ ...base, constraints, indexFields })).not.toThrow();
  });
});
