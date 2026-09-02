import type {
  AccessConditionResult,
  AccessFilterConstraint,
  AccessIndexConstraint,
  AccessQueryBuilder,
  FilterConstraintBuilder,
  IndexedAccessCondition,
} from "./constraintTypes";
import { createFilterConstraintBuilder } from "./createFilterConstraintBuilder";
import { createIndexConstraintBuilder, readIndexConstraints } from "./createIndexConstraintBuilder";

/**
 * What a rule's `constraints` callback resolved to: the condition on which
 * documents the caller may read.
 *
 * Either half may be present, and **both together is the normal case, not a
 * conflict** — it is exactly `.withIndex(name, range).filter(expr)`, Convex's own
 * shape. The range narrows what is READ; the filter rejects rows within that range
 * which the range cannot describe (`neq`, `or`, `not`).
 *
 * Neither present means the callback returned a condition that excludes nothing.
 * Absence of a condition altogether is `undefined`, not an empty object.
 *
 * @typeParam TDoc - Document shape the values are typed against.
 */
export interface AccessCondition<TDoc> {
  /** The index the rule chose, and the range it built on it. */
  index?: {
    /** Declared index name passed to `q.withIndex(…)`. */
    name: string;
    /** The range, in call order. Never empty — the range callback is required. */
    constraints: readonly AccessIndexConstraint<string, TDoc>[];
  };
  /** Root of the predicate tree, when the rule added or used `filter`. */
  filter?: AccessFilterConstraint<TDoc>;
}

/** Key an `AccessCondition` is carried on behind the nominal terminal. */
const CONDITION = Symbol("vex.access.condition");

/** The runtime value behind {@link AccessConditionResult}. */
type ConditionNode<TDoc> = { [CONDITION]: AccessCondition<TDoc> };

/**
 * Creates the `q` a query-shaped rule receives.
 *
 * Composes the two algebras without letting them mix: `withIndex` runs its range
 * callback against a fresh positional builder and reads the result; `filter` runs
 * its predicate callback against a fresh flat builder. Neither builder escapes its
 * callback, so an index expression can never reach a boolean combinator.
 *
 * **Pure, and only the returned value counts.** Nothing accumulates outside a
 * callback's own return, so a rule that builds a chain and discards it contributes
 * nothing — dead code behaves like dead code.
 *
 * @typeParam TDoc - Document shape constraint values are typed from.
 * @typeParam TIndexFields - The resource's index name → field tuple map.
 * @returns A builder whose `withIndex` / `filter` results carry the condition.
 */
export function createAccessQueryBuilder<
  TDoc,
  TIndexFields extends Record<string, readonly string[]>,
>(): AccessQueryBuilder<TDoc, TIndexFields> {
  /**
   * Wraps a condition in the nominal terminal the callback returns.
   *
   * @param condition - The condition to carry.
   * @returns A value satisfying `AccessConditionResult` at the type level.
   */
  const conditionNode = (condition: AccessCondition<TDoc>): ConditionNode<TDoc> => ({
    [CONDITION]: condition,
  });

  /**
   * Runs a predicate callback against a fresh flat builder.
   *
   * @param predicate - The rule's predicate callback.
   * @returns The tree it returned.
   */
  const runFilter = (
    predicate: (q: FilterConstraintBuilder<TDoc>) => unknown,
  ): AccessFilterConstraint<TDoc> =>
    predicate(createFilterConstraintBuilder<TDoc>()) as AccessFilterConstraint<TDoc>;

  const builder = {
    withIndex: (name: string, range: (ix: unknown) => never) => {
      const built = range(createIndexConstraintBuilder<readonly string[], TDoc>());
      const constraints = readIndexConstraints<TDoc>(built);
      const base: AccessCondition<TDoc> = { index: { name, constraints } };

      return {
        ...conditionNode(base),
        // Continuing with `.filter(…)` produces a NEW condition carrying both
        // halves; the index-only value the rule already holds is unchanged.
        filter: (predicate: (q: FilterConstraintBuilder<TDoc>) => unknown) =>
          conditionNode({ ...base, filter: runFilter(predicate) }),
      };
    },
    filter: (predicate: (q: FilterConstraintBuilder<TDoc>) => unknown) =>
      conditionNode({ filter: runFilter(predicate) }),
  };

  return builder as unknown as AccessQueryBuilder<TDoc, TIndexFields>;
}

/**
 * Reads the condition a returned terminal carries.
 *
 * The counterpart to the casts above: `AccessConditionResult` is nominal and has no
 * public shape, so only this module can get the condition back out.
 *
 * @typeParam TDoc - Document shape the values are typed against.
 * @param result - The value a rule's `constraints` callback returned.
 * @returns Its condition, or `undefined` when `result` did not come from this
 *   module — unreachable through the types, and treated as "no condition" so a rule
 *   that reached past them cannot silently widen into an unfiltered read.
 */
export function readAccessCondition<TDoc>(
  result: AccessConditionResult,
): AccessCondition<TDoc> | undefined {
  // Guarded rather than a bare property read: a `constraints` callback can return
  // `undefined`, `null`, or a primitive (a missing `return`, a value smuggled past a
  // cast), and indexing those for the carrier symbol is a `TypeError`. "No condition
  // here" is a legitimate answer this reader must be able to give — callers already
  // treat `undefined` as "not built through `q`" and fail safe or fail loud on it.
  if (result === null || (typeof result !== "object" && typeof result !== "function")) {
    return undefined;
  }
  return (result as unknown as Partial<ConditionNode<TDoc>>)[CONDITION];
}

/** Re-exported so the type name travels with its reader. */
export type { IndexedAccessCondition };
