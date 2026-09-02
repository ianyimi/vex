import type {
  AccessIndexConstraint,
  ConstraintBuilder,
  ConstraintResult,
  IndexOp,
} from "./constraintTypes";

/**
 * Key the accumulated constraint list is carried on. A symbol so it cannot collide
 * with a field name and does not appear in the builder's public type.
 */
const CONSTRAINTS = Symbol("vex.access.indexConstraints");

/** The runtime shape behind a positional chain: methods, plus its own accumulation. */
type IndexChainNode<TDoc> = Record<IndexOp, (field: string, value: unknown) => unknown> & {
  [CONSTRAINTS]: readonly AccessIndexConstraint<string, TDoc>[];
};

/**
 * Creates a positional constraint builder — the `ix` a rule receives inside
 * `q.withIndex(name, (ix) => …)`.
 *
 * **Pure.** Every method returns a NEW builder carrying the accumulated list; there
 * is no shared array and no caller-owned sink. That is what makes "only the value
 * the callback RETURNS counts" true rather than aspirational: a chain the rule
 * builds and discards leaves nothing behind, exactly like any other dead expression.
 * The earlier `{ into }` sink made discarded chains apply anyway, which surprised in
 * the one direction that matters — a rule doing more than it appeared to.
 *
 * The TYPE narrows per call — {@link ConstraintBuilder}'s three-interface state
 * machine only exposes the methods still legal at each position. The RUNTIME object
 * does not: each node carries all five methods, cast to the narrowing type on
 * return. Type safety is enforced entirely at the call site, never here.
 *
 * @typeParam TFields - The index's field tuple, in declaration order.
 * @typeParam TDoc - The document shape constraint values are typed from.
 * @returns A builder positioned at field 0, with nothing accumulated.
 */
export function createIndexConstraintBuilder<
  TFields extends readonly string[],
  TDoc,
>(): ConstraintBuilder<TFields, TDoc> {
  /**
   * Builds one node over an accumulated list.
   *
   * Keying the methods off {@link IndexOp} means a new Convex index-range method
   * becomes a compile error here rather than a silently unrecorded operator.
   *
   * @param constraints - Everything accumulated so far, in call order.
   * @returns A node exposing all five operators, each extending the list.
   */
  function node(constraints: readonly AccessIndexConstraint<string, TDoc>[]): IndexChainNode<TDoc> {
    /**
     * Appends one constraint and returns the next node.
     *
     * The cast erases per-field narrowing the runtime cannot re-derive:
     * `AccessIndexConstraint`'s `value` is `TField extends keyof TDoc ? … : never`,
     * a call-site typing device, while these parameters are `string`/`unknown`.
     *
     * @param op - The method's own name, matching {@link IndexOp} exactly.
     * @param field - Field name being constrained.
     * @param value - Constraint value, already validated at the call site.
     * @returns The next node in the chain.
     */
    const extend = (op: IndexOp, field: string, value: unknown): IndexChainNode<TDoc> =>
      node([
        ...constraints,
        { field, op, value } as AccessIndexConstraint<string, TDoc>,
      ]);

    return {
      eq: (field, value) => extend("eq", field, value),
      gt: (field, value) => extend("gt", field, value),
      gte: (field, value) => extend("gte", field, value),
      lt: (field, value) => extend("lt", field, value),
      lte: (field, value) => extend("lte", field, value),
      [CONSTRAINTS]: constraints,
    };
  }

  // The one sanctioned cast: the runtime shape (five methods, always present) does
  // not match the narrowing interface shape (each stage exposes a different subset).
  return node([]) as unknown as ConstraintBuilder<TFields, TDoc>;
}

/**
 * Reads the constraints a returned positional chain accumulated.
 *
 * The counterpart to the cast above: `ConstraintResult` is nominal and carries no
 * public shape, so only this module can get the list back out. Called by
 * `createAccessQueryBuilder` on whatever the range callback returned — which is why
 * a discarded chain contributes nothing.
 *
 * @typeParam TDoc - The document shape constraint values are typed from.
 * @param result - The value a range callback returned.
 * @returns Its accumulated constraints, in call order. `[]` when `result` did not
 *   come from this module — unreachable through the types, and treated as "no
 *   constraints" rather than throwing, since `validateAccessConstraints` owns
 *   diagnosing a rule that reached past them.
 * @internal
 */
export function readIndexConstraints<TDoc>(
  result: ConstraintResult,
): readonly AccessIndexConstraint<string, TDoc>[] {
  const carried = (result as unknown as Partial<IndexChainNode<TDoc>>)[CONSTRAINTS];
  return carried ?? [];
}
