import { describe, expect, it } from "vitest";
import type { QueryIndexConstraint } from "./queryConstraintTypes";
import { validateAccessConfig, validateQueryIndexConstraints } from "./validateAccessConfig";
import { defineAccess } from "./config";
import { VexAccessConfigError } from "./types";
import { defineCollection, text } from "../index";
import { GenericDocument } from "convex/server";

type Doc = GenericDocument & { authorId: string; categoryId: string; score: number };

/** A nested index family: by_author ⊂ by_author_category ⊂ by_author_category_score. */
const indexFields = {
  by_author: ["authorId"],
  by_author_category: ["authorId", "categoryId"],
  by_author_category_score: ["authorId", "categoryId", "score"],
} as const;

const base = { role: "contributor", resource: "pages", action: "read" };

describe("validateQueryIndexConstraints — valid shapes", () => {
  it("accepts an eq-only prefix of a declared index", () => {
    const constraints: QueryIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
    ];
    expect(() => validateQueryIndexConstraints({ ...base, constraints, indexFields })).not.toThrow();
  });

  it("accepts a lower bound followed by an upper bound on the same field", () => {
    const constraints: QueryIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "eq", value: "news" },
      { field: "score", op: "gte", value: 1 },
      { field: "score", op: "lt", value: 10 },
    ];
    expect(() => validateQueryIndexConstraints({ ...base, constraints, indexFields })).not.toThrow();
  });

  it("accepts an empty constraint list — an unrestricted range", () => {
    expect(() =>
      validateQueryIndexConstraints({ ...base, constraints: [], indexFields }),
    ).not.toThrow();
  });
});

describe("validateQueryIndexConstraints — field sequence must be an in-order prefix of a declared index", () => {
  it("throws when no declared index has this field prefix", () => {
    const constraints: QueryIndexConstraint<string, Doc>[] = [
      { field: "categoryId", op: "eq", value: "news" },
    ];
    expect(() => validateQueryIndexConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint fields [categoryId] are not an in-order prefix of any declared index',
    );
  });
});

describe("validateQueryIndexConstraints — operator sequencing", () => {
  it("throws on eq after a bound", () => {
    const constraints: QueryIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "gte", value: "a" },
      { field: "score", op: "eq", value: 5 },
    ];
    expect(() => validateQueryIndexConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint 3 ("score") uses "eq" after a bound — eq must precede every gt/gte/lt/lte',
    );
  });

  it("throws on a second lower bound", () => {
    const constraints: QueryIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "gte", value: "a" },
      { field: "categoryId", op: "gte", value: "b" },
    ];
    expect(() => validateQueryIndexConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint 2 ("categoryId") is a second lower bound — at most one gt/gte is allowed',
    );
  });

  it("throws on anything after an upper bound", () => {
    const constraints: QueryIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "lt", value: "z" },
      { field: "score", op: "eq", value: 5 },
    ];
    expect(() => validateQueryIndexConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint 3 ("score") follows an upper bound — nothing may follow lt/lte',
    );
  });

  it("throws when a lower and upper bound pin different fields", () => {
    const constraints: QueryIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "gte", value: "a" },
      { field: "score", op: "lt", value: 10 },
    ];
    expect(() => validateQueryIndexConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint 3 ("score") is a bound on a different field than the prior bound ("categoryId") — bounds must pin the same field',
    );
  });
});

describe("validateQueryIndexConstraints — additional field-sequence shapes", () => {
  it("throws when fields are supplied out of declared order", () => {
    const constraints: QueryIndexConstraint<string, Doc>[] = [
      { field: "categoryId", op: "eq", value: "news" },
      { field: "authorId", op: "eq", value: "u1" },
    ];
    expect(() => validateQueryIndexConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint fields [categoryId, authorId] are not an in-order prefix of any declared index',
    );
  });

  it("throws when a middle field is skipped, leaving a gap", () => {
    const constraints: QueryIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "score", op: "eq", value: 5 },
    ];
    expect(() => validateQueryIndexConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint fields [authorId, score] are not an in-order prefix of any declared index',
    );
  });

  it("throws when the constraint list is longer than every declared index", () => {
    const constraints: QueryIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "eq", value: "news" },
      { field: "score", op: "eq", value: 5 },
      { field: "extra", op: "eq", value: "z" },
    ];
    expect(() => validateQueryIndexConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint fields [authorId, categoryId, score, extra] are not an in-order prefix of any declared index',
    );
  });

  it("throws when the resource declares no indexes at all", () => {
    const constraints: QueryIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
    ];
    expect(() =>
      validateQueryIndexConstraints({ ...base, constraints, indexFields: {} }),
    ).toThrow(
      'role "contributor" on pages.read: constraint fields [authorId] are not an in-order prefix of any declared index',
    );
  });
});

describe("validateQueryIndexConstraints — bare bounds with no preceding eq are a valid range", () => {
  it("accepts a bare upper bound on the index's first field", () => {
    const constraints: QueryIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "lt", value: "z" },
    ];
    expect(() => validateQueryIndexConstraints({ ...base, constraints, indexFields })).not.toThrow();
  });

  it("accepts a bare lower bound on the index's first field", () => {
    const constraints: QueryIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "gte", value: "a" },
    ];
    expect(() => validateQueryIndexConstraints({ ...base, constraints, indexFields })).not.toThrow();
  });

  it("accepts an eq prefix followed directly by an upper bound, with no lower bound in between", () => {
    const constraints: QueryIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "lt", value: "z" },
    ];
    expect(() => validateQueryIndexConstraints({ ...base, constraints, indexFields })).not.toThrow();
  });
});

describe("validateAccessConfig — compound indexes", () => {
  const users = defineCollection({ slug: "users", fields: { roles: text() } });

  const fieldLevel = defineCollection({
    slug: "articles",
    fields: { authorId: text({ index: { name: "by_author_status", additionalFields: ["status"] } }), status: text() },
  });
  const collectionLevel = defineCollection({
    slug: "articles",
    fields: { authorId: text(), status: text() },
    indexes: [{ name: "by_author_status", fields: ["authorId", "status"] }],
  });

  it("accepts a range over a field-level or a collection-level compound index", () => {
    const accessOf = (articles: typeof fieldLevel) =>
      defineAccess({
        roles: ["reader"] as const,
        resources: [articles, users],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          reader: {
            articles: {
              read: {
                withIndex: {
                  name: "by_author_status" as never,
                  range: (ix: any) => ix.eq("authorId", "u1").eq("status", "published"),
                },
              },
            },
          },
        },
      });
    expect(() => validateAccessConfig(accessOf(fieldLevel) as never)).not.toThrow();
    expect(() => validateAccessConfig(accessOf(collectionLevel) as never)).not.toThrow();
  });

  it("rejects a range that skips the compound index's first field", () => {
    const access = defineAccess({
      roles: ["reader"] as const,
      resources: [fieldLevel, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        reader: {
          articles: {
            read: {
              withIndex: {
                name: "by_author_status" as never,
                range: (ix) => ix.eq("status" as never, "published" as never),
              },
            },
          },
        },
      },
    });
    expect(() => validateAccessConfig(access as never)).toThrow(
      new VexAccessConfigError(
        'role "reader" on articles.read: constraint fields [status] are not an in-order prefix of index "by_author_status" ([authorId, status])',
      ),
    );
  });
});

describe("validateAccessConfig — static where", () => {
  const pages = defineCollection({
    slug: "pages",
    fields: { title: text(), authorId: text({ index: "by_author" }) },
  });
  const users = defineCollection({ slug: "users", fields: { roles: text() } });

  /** An access config whose only rule is `reader → pages.read: { where }`. */
  const accessWithWhere = (where: unknown) =>
    defineAccess({
      roles: ["reader"] as const,
      resources: [pages, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: { reader: { pages: { read: { where: where as never } } } },
    });

  it("accepts a valid static where", () => {
    expect(() =>
      validateAccessConfig(accessWithWhere({ field: "authorId", op: "eq", value: "u1" }) as never),
    ).not.toThrow();
  });

  it("rejects an unknown field, naming the rule", () => {
    expect(() =>
      validateAccessConfig(accessWithWhere({ field: "nope", op: "eq", value: "u1" }) as never),
    ).toThrow(new VexAccessConfigError(
      'role "reader" on pages.read: invalid static where — Invalid where at where.field: unknown field "nope".',
    ));
  });

  it("rejects an unknown operator", () => {
    expect(() =>
      validateAccessConfig(accessWithWhere({ field: "authorId", op: "like", value: "u1" }) as never),
    ).toThrow(VexAccessConfigError);
  });
});
