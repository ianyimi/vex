/** Adds 1 to a number literal, mirroring Convex's own `PlusOne`. */
type PlusOne<N extends number> = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15][N];

/** Terminal: a completed constraint chain. Nominal so it can't be faked. */
export declare abstract class ConstraintResult {
  private _isConstraintResult: undefined;
}

/**
 * Upper bound only. Reached after a lower bound — Convex permits at most one
 * upper bound, on the same field, and nothing after it.
 */
interface UpperBoundConstraintBuilder<TDoc, TField extends string> extends ConstraintResult {
  lt<F extends TField>(field: F, value: F extends keyof TDoc ? TDoc[F] : never): ConstraintResult;
  lte<F extends TField>(field: F, value: F extends keyof TDoc ? TDoc[F] : never): ConstraintResult;
}

/** Lower bound stage: one lower bound allowed, then only upper bounds. */
interface LowerBoundConstraintBuilder<TDoc, TField extends string>
  extends UpperBoundConstraintBuilder<TDoc, TField> {
  gt<F extends TField>(
    field: F,
    value: F extends keyof TDoc ? TDoc[F] : never,
  ): UpperBoundConstraintBuilder<TDoc, TField>;
  gte<F extends TField>(
    field: F,
    value: F extends keyof TDoc ? TDoc[F] : never,
  ): UpperBoundConstraintBuilder<TDoc, TField>;
}

/** After `eq`, advance to the next field — or terminate if the index is spent. */
type NextConstraintBuilder<
  TFields extends readonly string[],
  TDoc,
  N extends number,
> = PlusOne<N> extends TFields["length"]
  ? ConstraintResult
  : ConstraintBuilder<TFields, TDoc, PlusOne<N>>;

/**
 * Position-tracking constraint builder. `eq` advances the field cursor;
 * `gt`/`gte`/`lt`/`lte` pin to the current field and close the chain.
 */
export interface ConstraintBuilder<
  TFields extends readonly string[],
  TDoc,
  N extends number = 0,
> extends LowerBoundConstraintBuilder<TDoc, TFields[N] & string> {
  eq<F extends TFields[N] & string>(
    field: F,
    value: F extends keyof TDoc ? TDoc[F] : never,
  ): NextConstraintBuilder<TFields, TDoc, N>;
}

// ── simulated registry ───────────────────────────────────────────────────────
type PagesDoc = { authorId: string; categoryId: string; score: number; title: string };
type Q3 = ConstraintBuilder<readonly ["authorId", "categoryId", "score"], PagesDoc>;
type Q1 = ConstraintBuilder<readonly ["authorId"], PagesDoc>;

declare const q3: Q3;
declare const q1: Q1;

// ── POSITIVE ────────────────────────────────────────────────────────────────
const a: ConstraintResult = q3.eq("authorId", "u1");
const b: ConstraintResult = q3.eq("authorId", "u1").eq("categoryId", "news");
const c: ConstraintResult = q3.eq("authorId", "u1").eq("categoryId", "news").eq("score", 5);
const d: ConstraintResult = q3.eq("authorId", "u1").gte("categoryId", "a");
const e: ConstraintResult = q3.eq("authorId", "u1").gte("categoryId", "a").lt("categoryId", "z");
const f: ConstraintResult = q3.gte("authorId", "a").lte("authorId", "z");
const g: ConstraintResult = q1.eq("authorId", "u1");

// ── NEGATIVE: eq after a lower bound (Convex forbids) ──────────────────────
// @ts-expect-error `eq` is not available after `gte`
const n1 = q3.eq("authorId", "u1").gte("categoryId", "a").eq("score", 5);

// ── NEGATIVE: two lower bounds ─────────────────────────────────────────────
// @ts-expect-error `gte` is not available after `gte`
const n2 = q3.gte("authorId", "a").gte("authorId", "b");

// ── NEGATIVE: anything after an upper bound ────────────────────────────────
// @ts-expect-error chain is terminal after `lt`
const n3 = q3.gte("authorId", "a").lt("authorId", "z").eq("categoryId", "x");

// ── NEGATIVE: wrong field for this position ────────────────────────────────
// @ts-expect-error field 0 of the index is "authorId"
const n4 = q3.eq("categoryId", "news");

// ── NEGATIVE: skipping a field ─────────────────────────────────────────────
// @ts-expect-error field 1 is "categoryId", not "score"
const n5 = q3.eq("authorId", "u1").eq("score", 5);

// ── NEGATIVE: wrong value type ─────────────────────────────────────────────
// @ts-expect-error score is number
const n6 = q3.eq("authorId", "u1").eq("categoryId", "news").eq("score", "5");

// ── NEGATIVE: past the end of a single-field index ─────────────────────────
// @ts-expect-error by_author is spent after one eq
const n7 = q1.eq("authorId", "u1").eq("categoryId", "news");

// ── NEGATIVE: a bare object cannot forge the nominal result ───────────────
// @ts-expect-error ConstraintResult is nominal
const n8: ConstraintResult = { field: "authorId", op: "eq", value: "u1" };

export { a, b, c, d, e, f, g, n1, n2, n3, n4, n5, n6, n7, n8 };
