import type {
  AccessFilterConstraint,
  ConstraintField,
  ConstraintResult,
  ConstraintValue,
  FilterConstraintBuilder,
  FilterOp,
} from "./constraintTypes";

/**
 * Creates a fresh unindexed constraint builder: the `q` a rule receives when it
 * declares no `withIndex` (DD 13). Comparisons produce a `compare` node;
 * `and`/`or`/`not` wrap the nodes their arguments produced, so a whole
 * expression evaluates bottom-up into one tree.
 *
 * Unlike {@link createIndexConstraintBuilder} this takes **no sink and keeps no
 * state**. The indexed builder records a flat sequence, so someone has to own the
 * list; here the combinators consume values and return values, which means the
 * callback's own return value already *is* the root of the tree. Two calls to this
 * factory cannot interfere because there is nothing to interfere with — every node
 * is freshly allocated and reachable only through what the caller was handed.
 *
 * The framework reads the result by reinterpreting the returned
 * {@link ConstraintResult} as {@link AccessFilterConstraint} — the same erasure this
 * module performs internally on combinator arguments. `ConstraintResult` is nominal
 * precisely so a rule cannot hand back a hand-built object literal; only a real
 * chain call can produce one.
 *
 * @typeParam TDoc - Document shape for the resource this rule governs.
 * @returns A stateless builder. Every call returns an independent object, and
 *   nothing is shared between them.
 */
export function createFilterConstraintBuilder<TDoc>(): FilterConstraintBuilder<TDoc> {
  /**
   * Reinterprets a combinator argument as the node it actually is at runtime.
   * `ConstraintResult`'s nominal private member exists to stop callers forging a
   * result; it carries no runtime representation, so this is an identity cast.
   *
   * @param result - A value returned by an earlier chain call on this builder.
   * @returns The same object, typed as the tree node it is.
   */
  const asFilterConstraint = (result: ConstraintResult): AccessFilterConstraint<TDoc> =>
    result as unknown as AccessFilterConstraint<TDoc>;

  /**
   * Builds one comparison method. The casts erase per-field narrowing that the
   * runtime cannot re-derive: `AccessFilterConstraint`'s `field` is
   * `keyof TDoc & string` and its `value` is indexed from `TDoc`, while these
   * parameters are `string` and `unknown`. The call site already checked both.
   *
   * @param op - The method's own name, matching {@link FilterOp} exactly so a
   *   later compile step can switch on it.
   * @returns A method recording one `compare` node under `op`.
   */
  const compare =
    (op: FilterOp) =>
    (field: string, value: unknown): AccessFilterConstraint<TDoc> => ({
      kind: "compare",
      field: field as ConstraintField<TDoc>,
      op,
      value: value as ConstraintValue<TDoc, ConstraintField<TDoc>>,
    });

  /**
   * Positionless runtime shape. Keying the comparisons off {@link FilterOp} means a
   * new operator there becomes a compile error here rather than a silently missing
   * method — the same discipline `createIndexConstraintBuilder` applies to
   * {@link FilterOp}'s index-only counterpart.
   */
  const builder: Record<
    FilterOp,
    (field: string, value: unknown) => AccessFilterConstraint<TDoc>
  > & {
    and: (...nodes: ConstraintResult[]) => AccessFilterConstraint<TDoc>;
    or: (...nodes: ConstraintResult[]) => AccessFilterConstraint<TDoc>;
    not: (node: ConstraintResult) => AccessFilterConstraint<TDoc>;
  } = {
    eq: compare("eq"),
    neq: compare("neq"),
    gt: compare("gt"),
    gte: compare("gte"),
    lt: compare("lt"),
    lte: compare("lte"),
    and: (...nodes) => ({ kind: "and", nodes: nodes.map(asFilterConstraint) }),
    or: (...nodes) => ({ kind: "or", nodes: nodes.map(asFilterConstraint) }),
    not: (node) => ({ kind: "not", node: asFilterConstraint(node) }),
  };

  // The one sanctioned cast in this module: every public method is declared to
  // return the nominal `ConstraintResult`, while the runtime returns the real node.
  // Erasing that here means no per-method cast and no way for a caller to reach the
  // node's shape without going through the framework's own reinterpretation.
  return builder as unknown as FilterConstraintBuilder<TDoc>;
}
