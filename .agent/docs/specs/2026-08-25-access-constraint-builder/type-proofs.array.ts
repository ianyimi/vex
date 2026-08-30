import type { GenericDocument, IndexRangeBuilder } from "convex/server";

/** Operator union derived from Convex's own builder — auto-tracks upstream. */
type IndexOp = Extract<keyof IndexRangeBuilder<GenericDocument, string[], 0>, string>;

/** One positional constraint: field is pinned, value is typed from the doc. */
type AccessConstraint<TField extends string, TDoc> = {
  field: TField;
  op: IndexOp;
  value: TField extends keyof TDoc ? TDoc[TField] : never;
};

/** Every non-empty prefix of a field tuple. `["a","b"]` → `["a","b"] | ["a"]`. */
type Prefixes<T extends readonly unknown[]> = T extends readonly [...infer H, unknown]
  ? T | Prefixes<H>
  : never;

/** Map a field tuple to a positionally-aligned constraint tuple. */
type ConstraintsForFields<F extends readonly string[], TDoc> = {
  [K in keyof F]: AccessConstraint<F[K] & string, TDoc>;
};

/** Constraints must be a prefix of the index's fields, in index order. */
type ConstraintTuple<F extends readonly string[], TDoc> =
  Prefixes<F> extends infer P ? (P extends readonly string[] ? ConstraintsForFields<P, TDoc> : never) : never;

// ── simulated generated registry ──────────────────────────────────────────────
type PagesDoc = { authorId: string; categoryId: string; score: number; title: string };
type IndexFieldsBySlug = {
  pages: {
    by_author: readonly ["authorId"];
    by_author_category: readonly ["authorId", "categoryId"];
    by_author_category_score: readonly ["authorId", "categoryId", "score"];
  };
};
type FieldsFor<S extends keyof IndexFieldsBySlug, N extends keyof IndexFieldsBySlug[S]> =
  IndexFieldsBySlug[S][N] extends readonly string[] ? IndexFieldsBySlug[S][N] : never;

type PagesConstraints<N extends keyof IndexFieldsBySlug["pages"]> = ConstraintTuple<
  FieldsFor<"pages", N>,
  PagesDoc
>;

// ── POSITIVE: correct order, full tuple ──────────────────────────────────────
const full: PagesConstraints<"by_author_category"> = [
  { field: "authorId", op: "eq", value: "u1" },
  { field: "categoryId", op: "eq", value: "news" },
];

// ── POSITIVE: prefix only (Convex allows constraining a prefix) ──────────────
const prefix: PagesConstraints<"by_author_category"> = [{ field: "authorId", op: "eq", value: "u1" }];

// ── POSITIVE: range op on the last constrained field ────────────────────────
const ranged: PagesConstraints<"by_author_category_score"> = [
  { field: "authorId", op: "eq", value: "u1" },
  { field: "categoryId", op: "eq", value: "news" },
  { field: "score", op: "gte", value: 50 },
];

// ── NEGATIVE: fields out of index order ─────────────────────────────────────
const swapped: PagesConstraints<"by_author_category"> = [
  // @ts-expect-error "categoryId" is not field 0 of by_author_category
  { field: "categoryId", op: "eq", value: "news" },
  // @ts-expect-error "authorId" is not field 1
  { field: "authorId", op: "eq", value: "u1" },
];

// ── NEGATIVE: skipping a field (gap in the prefix) ──────────────────────────
const gap: PagesConstraints<"by_author_category"> = [
  // @ts-expect-error cannot constrain field 1 without field 0
  { field: "categoryId", op: "eq", value: "news" },
];

// ── NEGATIVE: field not on this index at all ────────────────────────────────
const alien: PagesConstraints<"by_author_category"> = [
  // @ts-expect-error "title" is not a field of by_author_category
  { field: "title", op: "eq", value: "x" },
];

// ── NEGATIVE: wrong value type for the field ───────────────────────────────
const badValue: PagesConstraints<"by_author_category_score"> = [
  { field: "authorId", op: "eq", value: "u1" },
  { field: "categoryId", op: "eq", value: "news" },
  // @ts-expect-error score is number, not string
  { field: "score", op: "gte", value: "50" },
];

// ── NEGATIVE: op not in Convex's builder ───────────────────────────────────
const badOp: PagesConstraints<"by_author"> = [
  // @ts-expect-error startsWith is not an IndexRangeBuilder method
  { field: "authorId", op: "startsWith", value: "u" },
];

// ── NEGATIVE: too many constraints for a single-field index ────────────────
// @ts-expect-error by_author has one field, so a 2-tuple has the wrong arity
const overlong: PagesConstraints<"by_author"> = [
  { field: "authorId", op: "eq", value: "u1" },
  { field: "categoryId", op: "eq", value: "news" },
];

export { full, prefix, ranged, swapped, gap, alien, badValue, badOp, overlong };
