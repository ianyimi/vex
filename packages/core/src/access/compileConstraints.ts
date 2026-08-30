import type {
  DocumentByInfo,
  Expression,
  FilterBuilder,
  GenericDocument,
  GenericTableInfo,
  IndexRange,
} from "convex/server";
import type {
  AccessFilterConstraint,
  AccessIndexConstraint,
  FilterOp,
  IndexOp,
} from "./constraintTypes";
import type { IndexRangeFn } from "./types";

/**
 * Structural equality over Convex values.
 *
 * Convex compares values by CONTENT, both in an index range and in a `.filter()`
 * expression. JS `===` compares arrays and objects by REFERENCE, so using it for the
 * predicate made the two compile targets disagree for every array-valued field —
 * which is every `relationship` and `select` field, since both store `v.array(...)`.
 *
 * The divergence was not symmetric, and one direction was unsafe: `eq` produced a
 * false NEGATIVE (the query returned a row the predicate then rejected, so a client
 * denied access the server had granted), while `neq` produced a false POSITIVE (the
 * predicate admitted a row the query had excluded). The second is the dangerous one,
 * and it is why this is content equality rather than a special case for `eq`.
 *
 * `undefined` equals `undefined`, which keeps "field missing" and "field explicitly
 * undefined" indistinguishable — matching how a document read through bracket access
 * behaves, and matching Convex, which stores neither.
 *
 * @param a - Left value.
 * @param b - Right value.
 * @returns `true` when the two values are structurally equal.
 */
function convexValuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  // `typeof null === "object"`, and `null` is a distinct Convex value from both
  // `undefined` and `{}` — bail before either composite branch can treat it as one.
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;

  if (a instanceof ArrayBuffer || b instanceof ArrayBuffer) {
    if (!(a instanceof ArrayBuffer) || !(b instanceof ArrayBuffer)) return false;
    if (a.byteLength !== b.byteLength) return false;
    const left = new Uint8Array(a);
    const right = new Uint8Array(b);
    return left.every((byte, i) => byte === right[i]);
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => convexValuesEqual(item, b[i]));
  }

  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const leftKeys = Object.keys(left);
  if (leftKeys.length !== Object.keys(right).length) return false;
  return leftKeys.every(
    (key) => key in right && convexValuesEqual(left[key], right[key]),
  );
}

/**
 * JS-side comparator per {@link IndexOp}, used by `constraintsToPredicate`.
 * `as never` narrows past `unknown` for the ordering operators only —
 * `eq` never needs it. Exported so a caller building its own predicate logic
 * (or a future compile target) reuses the same five comparisons rather than
 * re-deriving them.
 *
 * The ordering operators are left as JS relational comparisons: they are only ever
 * recorded against a single field of one type, where JS and Convex agree. Convex's
 * cross-type total order is deliberately not reimplemented here.
 */
export const CONSTRAINT_COMPARATORS = {
  eq: convexValuesEqual,
  gt: (a: unknown, b: unknown) => (a as never) > (b as never),
  gte: (a: unknown, b: unknown) => (a as never) >= (b as never),
  lt: (a: unknown, b: unknown) => (a as never) < (b as never),
  lte: (a: unknown, b: unknown) => (a as never) <= (b as never),
} as const satisfies Record<IndexOp, (a: unknown, b: unknown) => boolean>;

/**
 * Compiles a recorded constraint list to a `withIndex` range function.
 *
 * @param props - Input props.
 * @param props.constraints - The rule's recorded constraints, in the order
 *   they were built. May be empty — an unrestricted range.
 * @returns A function usable directly as `find`'s `withIndex` range: applies
 *   each constraint's operator to the builder in order and returns the
 *   result as an `IndexRange`.
 */
export function accessConstraintsToIndexRange<
  TDocument extends GenericDocument = GenericDocument,
>(props: { constraints: readonly AccessIndexConstraint<string, TDocument>[] }): IndexRangeFn {
  return (q) =>
    props.constraints.reduce<unknown>(
      (builder, c) =>
        // Convex's `IndexRangeBuilder` narrows its RETURN TYPE per call, exactly as
        // `ConstraintBuilder` does — so a dynamic reduce over an untyped op string
        // needs one cast at this boundary. The static safety already happened when
        // the rule's `constraints` callback was type-checked, and again at
        // `defineAccess` time in `validateAccessConstraints`.
        (builder as Record<IndexOp, (field: string, value: unknown) => unknown>)[c.op](
          c.field,
          c.value,
        ),
      q,
      // Every `IndexRangeBuilder` structurally extends `IndexRange`, including one
      // with zero calls applied — so an empty constraint list returns `q` itself,
      // matching Convex's own "no restriction" semantics.
    ) as IndexRange;
}

/**
 * Compiles a recorded constraint list to a single `FilterBuilder` expression,
 * `and`-ing multiple constraints together.
 *
 * @param props - Input props.
 * @param props.constraints - The rule's recorded constraints, in the order
 *   they were built. Must be non-empty.
 * @param props.q - The query's own `FilterBuilder`, from `.filter((q) => …)`.
 * @returns A boolean expression usable directly as (or `and`-ed into) a
 *   `.filter()` predicate. A single constraint returns its own expression
 *   unwrapped; two or more are combined with `and`.
 * @throws {Error} When `props.constraints` is empty — a caller contract
 *   violation, not a config-authoring mistake. An unrestricted rule resolves to
 *   its boolean shorthand upstream and never reaches a compile target.
 */
export function accessConstraintsToFilter<
  TTableInfo extends GenericTableInfo,
  TDocument extends DocumentByInfo<TTableInfo> = DocumentByInfo<TTableInfo>,
>(props: {
  constraints: readonly AccessIndexConstraint<string, TDocument>[];
  q: FilterBuilder<TTableInfo>;
}): Expression<boolean> {
  // `c.op`'s literal values are `FilterBuilder`'s own method names by construction
  // (`IndexOp` derives from `IndexRangeBuilder`, whose comparison methods
  // `FilterBuilder` mirrors), so this dispatches correctly. The cast exists only
  // because the compiler cannot narrow `c.op` per array element.
  const q = props.q as unknown as Record<
    IndexOp,
    (left: unknown, right: unknown) => Expression<boolean>
  > & {
    field: (path: string) => unknown;
    and: (...exprs: Expression<boolean>[]) => Expression<boolean>;
  };

  const [first, ...rest] = props.constraints.map((c) => q[c.op](q.field(c.field), c.value));

  if (first === undefined) {
    // A caller contract violation, not a config-authoring mistake — hence a plain
    // `Error` rather than `VexAccessConfigError`. This function runs at QUERY time,
    // called by `find`/`search`; a config-error type here would misattribute a
    // framework bug to the user's `defineAccess`. An unconstrained rule resolves to
    // its boolean shorthand upstream and never reaches a compile target, so an
    // empty list means the caller skipped that resolution.
    throw new Error(
      "accessConstraintsToFilter: `constraints` must be non-empty — an unrestricted " +
        "rule is resolved to a boolean before it reaches a compile target.",
    );
  }

  // One expression stands alone: wrapping a single predicate in `and()` would add a
  // node for Convex to walk and read no differently.
  return rest.length === 0 ? first : q.and(first, ...rest);
}

/**
 * Compiles a recorded constraint list to a JS predicate, for interpreting
 * constraints against an already-fetched document (`hasPermission`,
 * client-side `usePermission`).
 *
 * The third compile target for the SAME recorded list, and it agrees with
 * `accessConstraintsToFilter` by construction: both walk the constraints in order
 * and both dispatch on the operator set {@link CONSTRAINT_COMPARATORS} defines, one
 * in JS and one as a Convex expression. `compileConstraints.test.ts` asserts that
 * agreement on a matching and a non-matching document.
 *
 * @param props - Input props.
 * @param props.constraints - The rule's recorded constraints, in the order
 *   they were built. May be empty — an unrestricted predicate.
 * @returns A function returning `true` when `doc` satisfies every constraint.
 */
export function accessConstraintsToPredicate<TDoc extends GenericDocument>(props: {
  constraints: readonly AccessIndexConstraint<string, TDoc>[];
}): (doc: TDoc) => boolean {
  // An empty constraint list yields a predicate that is vacuously true
  // (`Array#every` on an empty array), matching
  // `accessConstraintsToIndexRange`'s "no restriction" semantics for the same input.
  return (doc) =>
    props.constraints.every((c) => CONSTRAINT_COMPARATORS[c.op](doc[c.field], c.value));
}

/**
 * JS-side comparator per {@link FilterOp} — {@link CONSTRAINT_COMPARATORS} plus
 * `neq`, which `FilterBuilder` has and `IndexRangeBuilder` does not.
 *
 * Used by {@link accessFilterTreeToPredicate}. Kept as an extension of the index
 * map rather than a parallel one so the two algebras cannot drift on a shared
 * operator: change `gte` once and both compile targets follow.
 */
export const FILTER_COMPARATORS = {
  ...CONSTRAINT_COMPARATORS,
  neq: (a: unknown, b: unknown) => !convexValuesEqual(a, b),
} as const satisfies Record<FilterOp, (a: unknown, b: unknown) => boolean>;

/**
 * Compiles a recorded constraint TREE to a single `FilterBuilder` expression.
 *
 * The tree counterpart of {@link accessConstraintsToFilter}: that one walks the
 * flat positional list an indexed rule records, this one walks the recursive
 * `compare`/`and`/`or`/`not` shape an unindexed rule records. Both target the
 * same `.filter()` slot.
 *
 * There is no empty-tree case to guard. A rule that recorded nothing leaves
 * `AccessCondition.filter` as `undefined`, so absence is represented by
 * the field being missing rather than by an empty node — unlike the flat list,
 * where `[]` is representable and has to be rejected.
 *
 * @typeParam TTableInfo - Convex table info for the query being filtered.
 * @typeParam TDoc - Document shape the recorded values are typed against.
 * @param props - Input props.
 * @param props.node - Root of the recorded tree.
 * @param props.q - The query's own `FilterBuilder`, from `.filter((q) => …)`.
 * @returns A boolean expression usable directly as (or `and`-ed into) a
 *   `.filter()` predicate.
 */
export function accessFilterTreeToFilter<
  TTableInfo extends GenericTableInfo,
  TDoc extends DocumentByInfo<TTableInfo> = DocumentByInfo<TTableInfo>,
>(props: { node: AccessFilterConstraint<TDoc>; q: FilterBuilder<TTableInfo> }): Expression<boolean> {
  // `FilterOp`'s literals are `FilterBuilder`'s own comparison method names by
  // construction, and its combinators are `and`/`or`/`not`. The cast exists only
  // because the compiler cannot narrow the operator per node.
  const q = props.q as unknown as Record<
    FilterOp,
    (left: unknown, right: unknown) => Expression<boolean>
  > & {
    field: (path: string) => unknown;
    and: (...exprs: Expression<boolean>[]) => Expression<boolean>;
    or: (...exprs: Expression<boolean>[]) => Expression<boolean>;
    not: (expr: Expression<boolean>) => Expression<boolean>;
  };

  /**
   * Compiles one node, recursing through combinators.
   *
   * @param node - The node to compile.
   * @returns Its Convex expression.
   */
  function compile(node: AccessFilterConstraint<TDoc>): Expression<boolean> {
    switch (node.kind) {
      case "compare":
        return q[node.op](q.field(node.field), node.value);
      case "and":
        return q.and(...node.nodes.map(compile));
      case "or":
        return q.or(...node.nodes.map(compile));
      case "not":
        return q.not(compile(node.node));
    }
  }

  return compile(props.node);
}

/**
 * Compiles a recorded constraint TREE to a JS predicate, for interpreting an
 * unindexed rule against an already-fetched document.
 *
 * The tree counterpart of {@link accessConstraintsToPredicate}, and it agrees with
 * {@link accessFilterTreeToFilter} by construction: both walk the same nodes in the
 * same order and both dispatch comparisons through {@link FILTER_COMPARATORS}, one
 * in JS and one as a Convex expression.
 *
 * @typeParam TDoc - Document shape the recorded values are typed against.
 * @param props - Input props.
 * @param props.node - Root of the recorded tree.
 * @returns A function returning `true` when `doc` satisfies the tree.
 */
export function accessFilterTreeToPredicate<TDoc extends GenericDocument>(props: {
  node: AccessFilterConstraint<TDoc>;
}): (doc: TDoc) => boolean {
  /**
   * Evaluates one node against `doc`, recursing through combinators.
   *
   * @param node - The node to evaluate.
   * @param doc - The document under test.
   * @returns Whether `doc` satisfies `node`.
   */
  function evaluate(node: AccessFilterConstraint<TDoc>, doc: TDoc): boolean {
    switch (node.kind) {
      case "compare":
        return FILTER_COMPARATORS[node.op](doc[node.field], node.value);
      case "and":
        // An empty `and()` is vacuously true, matching `Array#every` and the flat
        // compilers' treatment of an empty constraint list.
        return node.nodes.every((child) => evaluate(child, doc));
      case "or":
        // An empty `or()` is false — the identity of OR. Reachable only by calling
        // `q.or()` with no arguments, which denies everything; the builder records
        // it faithfully rather than second-guessing the author.
        return node.nodes.some((child) => evaluate(child, doc));
      case "not":
        return !evaluate(node.node, doc);
    }
  }

  return (doc) => evaluate(props.node, doc);
}
