import type { IndexRangeFn, QueryIndex } from "./types";

/**
 * Ordered `(accessIndex, callerIndex)` pairs already warned about.
 *
 * Module-level and never cleared: the key space is the set of index-name pairs
 * a project actually declares, so it is small and fixed per process. Keyed on
 * the ordered pair rather than a single flag so two distinct displacements each
 * surface once.
 *
 * @internal
 */
const warnedDisplacements = new Set<string>();

/**
 * Warns once per displaced pair that an access index could not be applied.
 *
 * Dev-only — silent in production, where the warning has no audience and the
 * behavior is correct regardless (the access `filter` still runs per document).
 *
 * @param props - Input props.
 * @param props.accessIndexName - The access index that lost the slot.
 * @param props.callerIndexName - The caller index that won it.
 * @internal
 */
function warnDisplacedAccessIndex(props: {
  accessIndexName: string;
  callerIndexName: string;
}): void {
  if (process.env.NODE_ENV === "production") return;
  const key = `${props.accessIndexName}\u0000${props.callerIndexName}`;
  if (warnedDisplacements.has(key)) return;
  warnedDisplacements.add(key);
  console.warn(
    `[vexcms] Access index "${props.accessIndexName}" cannot be applied: this query ` +
      `already uses "${props.callerIndexName}". Convex permits one index per query, so ` +
      `the access rule falls back to a per-document check and reads scale with the ` +
      `caller's range instead. Declare a compound index covering both fields to serve ` +
      `them in one query.`,
  );
}

/**
 * Composes two optional ranges onto one builder: `first` narrows, then
 * `second` continues from where it left off.
 *
 * Convex's `IndexRangeBuilder` tracks its position in the index at the type
 * level, and `.eq()` returns the builder for the *next* field — so chaining is
 * exactly how a compound constraint is expressed. Composing opaque range
 * callbacks loses that positional type, hence the cast: each callback is typed
 * as returning the terminal `IndexRange`, but at runtime it returns the builder
 * whenever fields remain. Ordering matters — the access range owns the index
 * prefix, so it must run first.
 *
 * @param props - Input props.
 * @param props.first - Range applied first; owns the index prefix.
 * @param props.second - Range continuing from `first`'s result.
 * @returns A single range applying both in order, one of them when only one is
 *   supplied, or `undefined` when neither is — an absent range means "use this
 *   index unconstrained", which `buildQuery` expresses by omitting the arg.
 * @internal
 */
function composeRanges(props: {
  first?: IndexRangeFn;
  second?: IndexRangeFn;
}): IndexRangeFn | undefined {
  const { first, second } = props;
  if (!first) return second;
  if (!second) return first;
  return (q) => second(first(q) as Parameters<IndexRangeFn>[0]);
}

/**
 * Chooses the single index a query will use, arbitrating between an
 * access-contributed index and whatever the caller explicitly requested.
 * Convex permits exactly one `withIndex` per query, so exactly one wins.
 *
 * 1. Caller's index wins the slot when it names a DIFFERENT index — usually a
 *    highly selective lookup; the access `filter` still enforces the rule per
 *    document (`hasPermission`), so this only ever costs reads, never
 *    correctness.
 * 2. Same name ⇒ ranges merge, so the compound constraint (access's prefix AND
 *    the caller's continuation) is served by one query, no degradation.
 * 3. Free slot (no caller index) ⇒ the access index claims it — the common
 *    list-view case, where the view passes no index of its own.
 *
 * Never authorizes: whichever index wins, the access rule's `filter` runs per
 * document. Arbitration decides how many rows get read, not which are allowed.
 *
 * @param props - Input props.
 * @param props.accessIndex - `resolveAccessIndex`'s result for this query, if any.
 * @param props.callerIndex - The index the caller explicitly requested, if any.
 *   Its `range` is optional, mirroring `find`'s `withIndex` arg — a caller may
 *   name an index purely to order results.
 * @returns The index to apply, or `undefined` when neither side supplies one
 *   (an un-narrowed scan, today's behavior).
 *
 * @example
 * ```ts
 * pickQueryIndex({
 *   accessIndex: { name: "by_author", range: (q) => q.eq("authorId", "u1") },
 * });
 * // → { name: "by_author", range: … }  (free slot)
 * ```
 */
export function pickQueryIndex(props: {
  accessIndex?: QueryIndex;
  callerIndex?: { name: string; range?: IndexRangeFn };
}): QueryIndex | undefined {
  const { accessIndex, callerIndex } = props;

  // Neither side narrows — identical to today's behavior for a collection or
  // action with no access index and no caller request.
  if (!accessIndex && !callerIndex) return undefined;

  // Free slot: the access index takes it outright.
  if (!callerIndex) return accessIndex;

  // No access index to arbitrate against — the caller's request stands.
  if (!accessIndex) return callerIndex;

  // Same index: one query serves both constraints, no degradation.
  if (accessIndex.name === callerIndex.name) {
    return {
      name: accessIndex.name,
      range: composeRanges({ first: accessIndex.range, second: callerIndex.range }),
    };
  }

  // Different indexes: the caller's explicit choice wins the slot. The access
  // rule's `filter` still runs per document, so this costs reads, not safety.
  warnDisplacedAccessIndex({
    accessIndexName: accessIndex.name,
    callerIndexName: callerIndex.name,
  });
  return callerIndex;
}
