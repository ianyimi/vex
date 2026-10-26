import type { Expression, FilterBuilder, IndexRange, IndexRangeBuilder } from "convex/server";

/** A range callback as applied to a Convex query. @internal */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConvexQueryIndexRangeFn = (q: IndexRangeBuilder<any, any, 0>) => IndexRange;

/**
 * A compiled access filter as applied to a Convex query — the output of
 * `resolveQueryConstraint`.
 *
 * A thunk rather than an `Expression<boolean>` because a filter expression can only
 * be built from the query's OWN `FilterBuilder`, which the resolver never sees: the
 * caller supplies it inside `.filter((q) => …)`. Mirrors {@link ConvexQueryIndexRangeFn}, which
 * is deferred for the same reason and uses the same `any` table-info convention.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConvexQueryFilterFn = (q: FilterBuilder<any>) => Expression<boolean>;

/**
 * A concrete index a query will use: the output of `resolveQueryIndex` and,
 * after arbitration, of `pickConvexQueryIndex`. Both stages produce the same shape,
 * so there is one type for both.
 *
 * Distinct from what the user *authors*: a rule declares its index via
 * `withIndex: { name, range: (ix) => … }`, whose range is a function **of the
 * caller**. Resolving one binds the caller in, leaving the plain
 * `(q) => …` builder here and widening `name` to `string` — by resolve time
 * the resource generic is gone. `AccessIndexSelection` is the template; this
 * is that template applied to one caller.
 *
 * `range` is optional because after arbitration the winner may be a *caller's*
 * `withIndex`, and a caller may legitimately name an index with no range purely
 * to order results. `buildQuery` already branches on this
 * (`api/find/server.ts` — `range ? withIndex(name, range) : withIndex(name)`),
 * so an absent range needs no placeholder.
 *
 * An access-sourced index always carries one, guaranteed by
 * {@link AccessIndexSelection} requiring its `range` rather than
 * restated as a second type here — a range-less access index would scan the whole
 * table, since every document has an index entry (fields that are missing are
 * indexed as `undefined`).
 */
export interface ConvexQueryIndex {
  /** Index name to query. */
  name: string;
  /** Range to apply; omitted for an ordering-only caller index. */
  range?: ConvexQueryIndexRangeFn;
}
