import type { GenericDocument, IndexRangeBuilder } from "convex/server";

/**
 * Adds 1 to a number literal via lookup, mirroring Convex's own `PlusOne`
 * (`convex/src/server/index_range_builder.ts`) — advances the field cursor
 * `ConstraintBuilder` tracks. Not exported: only `NextConstraintBuilder`
 * needs it.
 */
type PlusOne<N extends number> = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15][N];

/**
 * Every operator a Convex `IndexRangeBuilder` exposes at its first
 * position, derived from the builder's own type rather than hand-listed —
 * a new upstream method appears here automatically, and a rename fails
 * compilation instead of silently drifting. Convex's private nominal
 * markers never surface in `keyof`, so this resolves to exactly
 * `"eq" | "gt" | "gte" | "lt" | "lte"`.
 */
export type IndexOp = Extract<keyof IndexRangeBuilder<GenericDocument, string[], 0>, string>;

/**
 * Operators available to an unindexed constraint. The index-range operators
 * plus `neq`, which `IndexRangeBuilder` has no equivalent for but
 * `FilterBuilder` does.
 */
export type FilterOp = IndexOp | "neq";

/**
 * `TDoc`'s explicitly declared keys, with any index signature dropped.
 *
 * Generated documents extend `VexDocument` (`api/convex.ts`), which carries
 * `[key: string]: unknown` so a document can hold schema-defined fields the static
 * type does not enumerate. The cost is that `keyof` answers `string` rather than a
 * literal union — which silently removes editor completion for field names and
 * accepts any string as a field. Remapping with `as string extends K ? never : K`
 * discards exactly the signature keys and keeps the declared ones.
 *
 * @typeParam TDoc - Document shape.
 * @internal
 */
type DeclaredKeys<TDoc> = {
  [K in keyof TDoc as string extends K ? never : number extends K ? never : K]: TDoc[K];
};

/**
 * `TDoc` with `VexDocument`'s `[key: string]: unknown` index signature removed.
 *
 * The signature exists so a document can hold schema-defined fields statically, but it
 * also makes EVERY property name readable at type level: `data.tpyo` and
 * `data.neverDeclared` both resolve to `unknown` instead of erroring. That silently
 * defeats the point of typing a permission callback against its resource.
 *
 * Left alone in the pre-generation case (`unknown extends TDoc`), where stripping would
 * turn the document into `{}` and make every real field unreadable.
 *
 * @typeParam TDoc - Document shape, or `unknown` when the registry is unaugmented.
 */
export type DeclaredDoc<TDoc> = unknown extends TDoc ? TDoc : DeclaredKeys<TDoc>;

/**
 * A constrainable field name for `TDoc`: its declared fields, degrading to `string`
 * when the document type is unresolved.
 *
 * Two widenings are deliberately handled differently.
 *
 * Before `vex generate` runs, `DocumentBySlug` falls back to
 * `Record<string, unknown>`, so a resource's document type resolves to `unknown` —
 * and `keyof unknown` is `never`, which would make every field name unwritable.
 * `unknown extends TDoc` is true only for `unknown`/`any`, so this widens exactly
 * in the pre-generation case.
 *
 * After generation the document type is real but still has `VexDocument`'s index
 * signature, so a bare `keyof` would collapse to `string` — no completion, and a
 * misspelled field silently accepted with an `unknown` value. {@link DeclaredKeys}
 * strips it, which is what makes `q.eq("` offer the resource's actual fields and
 * `q.eq("tset", …)` an error.
 *
 * @typeParam TDoc - Document shape, or `unknown` when the registry is unaugmented.
 */
export type ConstraintField<TDoc> = unknown extends TDoc
  ? string
  : keyof DeclaredKeys<TDoc> & string;

/**
 * The value type for a constraint on field `F` of `TDoc`: the field's own type,
 * `never` when `F` is not a field of `TDoc`, and `unknown` when `TDoc` itself is
 * unresolved.
 *
 * The third case is what separates "you named a field that does not exist" (a real
 * error, `never`) from "this project has not run `vex generate` yet" (not an error).
 * Without it both collapse to `never` and no constraint can be written at all —
 * including in `packages/core`'s own tests, which run against an unaugmented
 * registry by design.
 *
 * @typeParam TDoc - Document shape, or `unknown` when the registry is unaugmented.
 * @typeParam F - The field name being constrained.
 */
export type ConstraintValue<TDoc, F extends string> = unknown extends TDoc
  ? unknown
  : F extends keyof TDoc
    ? TDoc[F]
    : never;

/**
 * One node of an unindexed constraint tree: a comparison on a document field,
 * or a boolean combination of nodes.
 *
 * Unlike {@link QueryIndexConstraint} this is recursive, because `FilterBuilder`
 * supports `and` / `or` / `not` and an index range does not.
 */
export type QueryFilterConstraint<TDoc> =
  | {
      kind: "compare";
      field: ConstraintField<TDoc>;
      op: FilterOp;
      value: ConstraintValue<TDoc, ConstraintField<TDoc>>;
    }
  | { kind: "and"; nodes: QueryFilterConstraint<TDoc>[] }
  | { kind: "or"; nodes: QueryFilterConstraint<TDoc>[] }
  | { kind: "not"; node: QueryFilterConstraint<TDoc> };

/**
 * The plain, JSON-serializable form of a `where` predicate over `TDoc`: a
 * comparison leaf, or an `and` / `or` / `not` of nodes. The same predicate
 * the `where` builder (`FilterConstraintBuilder`) records, with friendlier
 * keys. Accepted by `find` / `search`'s `where` (as `VexWhereNode<S>`) and by
 * an access rule's `where` property.
 *
 * @typeParam TDoc - Document shape field names and values are typed from.
 */
export type VexWhereNodeOf<TDoc> =
  | {
      field: ConstraintField<TDoc>;
      op: FilterOp;
      value: ConstraintValue<TDoc, ConstraintField<TDoc>>;
    }
  | { and: readonly VexWhereNodeOf<TDoc>[] }
  | { or: readonly VexWhereNodeOf<TDoc>[] }
  | { not: VexWhereNodeOf<TDoc> };

/**
 * Builder for an unindexed constraint — the `q` a rule receives when it
 * declares no `withIndex` (DD 13).
 *
 * Deliberately enforces neither field order nor operator sequencing: it
 * compiles to `.filter()`, which imposes neither. Every method returns
 * {@link ConstraintResult}, so this shares the indexed builder's nominal
 * terminal and needs no positional tracking or terminal states.
 *
 * @typeParam TDoc - Document shape for the resource this rule governs.
 */
export interface FilterConstraintBuilder<TDoc> {
  eq<F extends ConstraintField<TDoc>>(field: F, value: ConstraintValue<TDoc, F>): ConstraintResult;
  neq<F extends ConstraintField<TDoc>>(field: F, value: ConstraintValue<TDoc, F>): ConstraintResult;
  gt<F extends ConstraintField<TDoc>>(field: F, value: ConstraintValue<TDoc, F>): ConstraintResult;
  gte<F extends ConstraintField<TDoc>>(field: F, value: ConstraintValue<TDoc, F>): ConstraintResult;
  lt<F extends ConstraintField<TDoc>>(field: F, value: ConstraintValue<TDoc, F>): ConstraintResult;
  lte<F extends ConstraintField<TDoc>>(field: F, value: ConstraintValue<TDoc, F>): ConstraintResult;
  and(...nodes: ConstraintResult[]): ConstraintResult;
  or(...nodes: ConstraintResult[]): ConstraintResult;
  not(node: ConstraintResult): ConstraintResult;
}

/**
 * One recorded positional constraint: `field` is pinned to a literal, `op`
 * is one of {@link IndexOp}, and `value` is typed from the document shape
 * at that field. This is what a `ConstraintBuilder` chain call records
 * (`createQueryIndexConstraintBuilder`, `access/createQueryIndexConstraintBuilder.ts`),
 * and what a later compiler step reads back to build a `withIndex` range, a
 * `FilterBuilder` expression, or a JS predicate — the same recorded data
 * feeds all three, which is the reason a builder replaces a callback.
 *
 * @typeParam TField - The field name this constraint pins.
 * @typeParam TDoc - The document shape `value`'s type is read from.
 */
export type QueryIndexConstraint<TField extends string, TDoc> = {
  field: TField;
  op: IndexOp;
  value: ConstraintValue<TDoc, TField>;
};

/**
 * Terminal marker for a completed constraint chain. Nominal — a private,
 * unimplementable member — so a plain object literal can never satisfy it;
 * only a real chain call (`eq`/`gt`/`gte`/`lt`/`lte`) can produce one. Every
 * builder stage extends this, so a chain is already assignable to
 * `ConstraintResult` at the exact point Convex would also accept it as
 * complete.
 */
export declare abstract class ConstraintResult {
  private _isConstraintResult: undefined;
}

/**
 * Upper-bound stage of a constraint chain: only `lt`/`lte` remain. Reached
 * after a lower bound (Convex allows at most one upper bound, on the same
 * field, and nothing after it) or directly from `eq` on the index's last
 * field. Extends {@link ConstraintResult} — a chain that never calls
 * `lt`/`lte` is already a valid, complete result.
 *
 * @typeParam TDoc - Document shape constraint values are typed from.
 * @typeParam TField - The field this stage's bounds pin to.
 * @internal
 */
export interface UpperBoundConstraintBuilder<TDoc, TField extends string> extends ConstraintResult {
  lt<F extends TField>(field: F, value: ConstraintValue<TDoc, F>): ConstraintResult;
  lte<F extends TField>(field: F, value: ConstraintValue<TDoc, F>): ConstraintResult;
}

/**
 * Lower-bound stage of a constraint chain: `gt`/`gte` are available, each
 * closing off further lower bounds but permitting one optional upper bound
 * via the returned {@link UpperBoundConstraintBuilder}.
 *
 * @typeParam TDoc - Document shape constraint values are typed from.
 * @typeParam TField - The field this stage's bounds pin to.
 * @internal
 */
export interface LowerBoundConstraintBuilder<
  TDoc,
  TField extends string,
> extends UpperBoundConstraintBuilder<TDoc, TField> {
  gt<F extends TField>(
    field: F,
    value: ConstraintValue<TDoc, F>,
  ): UpperBoundConstraintBuilder<TDoc, TField>;
  gte<F extends TField>(
    field: F,
    value: ConstraintValue<TDoc, F>,
  ): UpperBoundConstraintBuilder<TDoc, TField>;
}

/**
 * After `eq` advances the field cursor to `N + 1`: another {@link
 * ConstraintBuilder} positioned at the next field, or the terminal {@link
 * ConstraintResult} when the index is spent (no more fields to constrain).
 *
 * @typeParam TFields - The index's field tuple, in declaration order.
 * @typeParam TDoc - Document shape constraint values are typed from.
 * @typeParam N - The field cursor position `eq` was just called at.
 * @internal
 */
export type NextConstraintBuilder<TFields extends readonly string[], TDoc, N extends number> =
  PlusOne<N> extends TFields["length"]
    ? ConstraintResult
    : ConstraintBuilder<TFields, TDoc, PlusOne<N>>;

/**
 * Position-tracking constraint builder — the type `createQueryIndexConstraintBuilder`
 * (`access/createQueryIndexConstraintBuilder.ts`) returns, and what a rule's
 * `withIndex.range` receives. `eq` pins the field at cursor `N` and
 * advances to `N + 1`; `gt`/`gte`/`lt`/`lte` (inherited from {@link
 * LowerBoundConstraintBuilder}) pin the SAME field and close the chain to
 * further constraints. This encodes Convex's complete index rule: zero or
 * more `eq`, then at most one lower bound, then at most one upper bound,
 * fields strictly in index order with no gaps, each value typed per field —
 * violating any of these is a compile error, never a runtime one.
 *
 * @typeParam TFields - The index's field tuple, in declaration order —
 *   typically `IndexFieldsFor<slug, indexName>` (`types/generated.ts`).
 * @typeParam TDoc - Document shape constraint values are typed from.
 * @typeParam N - The current field cursor. Defaults to `0`, the index's
 *   first field; only `NextConstraintBuilder` advances it.
 */
export interface ConstraintBuilder<
  TFields extends readonly string[],
  TDoc,
  N extends number = 0,
> extends LowerBoundConstraintBuilder<TDoc, TFields[N] & string> {
  eq<F extends TFields[N] & string>(
    field: F,
    value: ConstraintValue<TDoc, F>,
  ): NextConstraintBuilder<TFields, TDoc, N>;
}

/**
 * The index half of an access rule: which declared index to read through and the
 * range over its fields, as a discriminated object — the same shape as `find`'s
 * `withIndex` argument, with `range` required.
 *
 * Discriminating on the literal `name` is what types `ix` against THAT index's
 * field tuple, in declaration order, so Convex's field-order rule is a compile
 * error at the rule.
 *
 * @typeParam TDoc - Document shape range values are typed from.
 * @typeParam TIndexFields - The resource's index name → field tuple map.
 */
export type AccessIndexSelection<TDoc, TIndexFields extends Record<string, readonly string[]>> = {
  [N in keyof TIndexFields & string]: {
    /** A declared index on this resource. */
    name: N;
    /** Range over the index's fields. Required: a range-less index restricts nothing. */
    range: (ix: ConstraintBuilder<TIndexFields[N], TDoc, 0>) => ConstraintResult;
  };
}[keyof TIndexFields & string];
