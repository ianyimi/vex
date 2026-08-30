# GROUND TRUTH — regenerated after the two-callback cutover


### packages/core/src/access/constraintTypes.ts
19:export type IndexOp = Extract<keyof IndexRangeBuilder<GenericDocument, string[], 0>, string>;
26:export type FilterOp = IndexOp | "neq";
40:export type ConstraintField<TDoc> = unknown extends TDoc ? string : keyof TDoc & string;
56:export type ConstraintValue<TDoc, F extends string> = unknown extends TDoc
69:export type AccessFilterConstraint<TDoc> =
91:export interface FilterConstraintBuilder<TDoc>
115:export type AccessIndexConstraint<TField extends string, TDoc> =
129:export declare abstract class ConstraintResult
144:export interface UpperBoundConstraintBuilder<TDoc, TField extends string> extends ConstraintResult
158:export interface LowerBoundConstraintBuilder<
182:export type NextConstraintBuilder<TFields extends readonly string[], TDoc, N extends number> =
204:export interface ConstraintBuilder<
232:export declare abstract class AccessConditionResult
245:export interface IndexedAccessCondition<TDoc> extends AccessConditionResult
272:export interface AccessPredicateBuilder<TDoc>
319:export interface AccessQueryBuilder<TDoc, TIndexFields extends Record<string, readonly string[]>>

### packages/core/src/access/types.ts
34:export type AccessResource = CollectionConfig | GlobalConfig;
42:export type FieldPermissionResult<TFieldKeys extends string> =
50:export type ResolvedFieldPermissions = Record<string, boolean>;
64:export type PermissionCallbackProps<
86:export type IndexRangeFn = (q: IndexRangeBuilder<any, any, 0>) => IndexRange;
100:export type AccessFilterFn = (q: FilterBuilder<any>) => Expression<boolean>;
126:export interface QueryIndex
151:export type ConstraintsCallbackProps<
176:export type ConstraintsCallback<
213:export interface ConstrainedPermissionCheck<
250:export type AnyActionPermissionCheck<
287:export type PermissionCheck<
307:export interface SubjectEntry
419:export type SubjectMap<
452:export interface DataTypeCarrier<T = never>
468:export function dataType<T>(): DataTypeCarrier<T>
476:export type CustomResourceInput =
508:export type RolePermissions<
554:export interface VexAccessConfigInput<
640:export interface VexAccessConfig<

### packages/core/src/access/createIndexConstraintBuilder.ts
39:export function createIndexConstraintBuilder<
102:export function readIndexConstraints<TDoc>(

### packages/core/src/access/createFilterConstraintBuilder.ts
33:export function createFilterConstraintBuilder<TDoc>(): FilterConstraintBuilder<TDoc>

### packages/core/src/access/createAccessQueryBuilder.ts
26:export interface AccessCondition<TDoc>
60:export function createAccessQueryBuilder<
118:export function readAccessCondition<TDoc>(
125:export type { IndexedAccessCondition };

### packages/core/src/access/compileConstraints.ts
24:export const CONSTRAINT_COMPARATORS =
42:export function accessConstraintsToIndexRange<
79:export function accessConstraintsToFilter<
134:export function accessConstraintsToPredicate<TDoc extends GenericDocument>(props:
152:export const FILTER_COMPARATORS =
178:export function accessFilterTreeToFilter<
231:export function accessFilterTreeToPredicate<TDoc extends GenericDocument>(props:

### packages/core/src/access/validateAccessConstraints.ts
31:export function validateAccessConstraints<

### packages/core/src/access/resolveAccessRule.ts
249:export function resolveAccessIndex<
299:export function resolveAccessConstraint<

## The authoring surface, verbatim
```ts
export interface AccessPredicateBuilder<TDoc> {
  /**
   * Narrows by predicate.
   *
   * @param predicate - Builds the expression from the flat filter algebra.
   * @returns The completed condition.
   */
  filter(
    predicate: (q: FilterConstraintBuilder<TDoc>) => ConstraintResult,
  ): AccessConditionResult;
}

/**

export interface AccessQueryBuilder<TDoc, TIndexFields extends Record<string, readonly string[]>>
  extends AccessPredicateBuilder<TDoc> {
  /**
   * Narrows the query through a declared index.
   *
   * **The range callback is REQUIRED**, unlike Convex's, where it is optional. A
   * range-less `withIndex` excludes no documents — every row has an index entry, so

export interface IndexedAccessCondition<TDoc> extends AccessConditionResult {
  /**
   * Adds a per-document predicate alongside the index range.
   *
   * Compiles to `.withIndex(name, range).filter(expr)` — Convex's own shape, and
   * the reason both halves can coexist: the range narrows what is READ, the filter
   * rejects rows within it that the range cannot describe (`neq`, `or`, `not`).

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
```
