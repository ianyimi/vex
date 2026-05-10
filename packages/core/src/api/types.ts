import type {
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
} from "convex/server";

import {
  ADMIN_FIELDS,
  CheckboxFieldType,
  DateFieldType,
  NumberFieldType,
  SelectFieldType,
  TextFieldType,
  type AdminFieldType,
} from "../fields";
import type {
  CollectionsFieldTypeMap,
  CollectionSlug,
  DocumentBySlug,
} from "../types/generated";
import { VexDocument } from "../convex";
import { VexConfig } from "../config";

/**
 * Forces TypeScript to eagerly evaluate a mapped/conditional type into a
 * concrete object shape rather than displaying the opaque alias. Without this,
 * hover would show `Populated<"posts", { parent: true }>` instead of the
 * expanded `{ _id: ...; parent: Post[]; ... }` form.
 */
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

// ── Generic args base types ─────────────────────────────────────────────────
//
// Every public `vex.*` function's args interface extends one of these four
// types. They factor out the `ctx` discriminator (and `populate` for queries)
// so per-function args interfaces only carry their unique fields.
//
// Future shared fields (access-control hints, logging tags, request timeouts,
// etc.) get added to the appropriate base — every function inherits them.

/**
 * Base shape for client-side args of a `vex.*` query function.
 *
 * Carries the `ctx?: never` discriminator (forbids passing a Convex query
 * context) and the `populate` field, since every query function that returns
 * documents supports relationship population (the only outlier is `count`,
 * which returns a number and overrides `populate?: never`).
 *
 * Function-specific args interfaces extend this and add their own per-function
 * fields. `limit` stays per-function because it doesn't apply to single-doc
 * queries (`get`) or scalar queries (`count`).
 *
 * @typeParam TSlug - The collection slug; used to narrow `populate` keys via
 *   `RelationshipKeysOf<TSlug>`. Defaults to the full `CollectionSlug` union.
 * @typeParam TPopulate - The populate object. Defaults to
 *   `Record<string, never>` (no relationships populated).
 *
 * @example Inheritance pattern
 * ```ts
 * // find — adds slug + limit; populate inherited
 * interface FindClientArgs<TSlug, TPopulate>
 *   extends GenericQueryClientParams<TSlug, TPopulate> {
 *   slug: TSlug;
 *   limit?: number;
 * }
 *
 * // get — adds id; populate inherited; no limit (single-doc)
 * interface GetClientArgs<TSlug, TPopulate>
 *   extends GenericQueryClientParams<TSlug, TPopulate> {
 *   id: GenericId<TSlug>;
 * }
 *
 * // search — adds slug + query + index fields + limit; populate inherited
 * interface SearchClientArgs<TSlug, TPopulate>
 *   extends GenericQueryClientParams<TSlug, TPopulate> {
 *   slug: TSlug;
 *   query: string;
 *   searchIndexName: string;
 *   searchField: string;
 *   limit?: number;
 * }
 *
 * // count — returns a number, has no docs to populate; overrides populate
 * interface CountClientArgs<TSlug>
 *   extends GenericQueryClientParams<TSlug> {
 *   slug: TSlug;
 *   populate?: never;
 * }
 * ```
 */
export interface GenericQueryClientParams<
  TSlug extends CollectionSlug = CollectionSlug,
  TPopulate extends PopulateShape<TSlug> = Record<string, never>,
> {
  /** Discriminator: client args MUST NOT supply `ctx`. */
  ctx?: never;
  /** Recursive populate object, type-narrowed against `RelationshipKeysOf<TSlug>`. */
  populate?: TPopulate;
  /**
   * Auto-populate all relationship fields to this many levels.
   * Plain `number` passthrough — no return type narrowing on the client side
   * (the Convex network boundary always returns `VexDocument[]`).
   * Use `populate` for documented consumer code; `depth` is internal.
   */
  depth?: number;
}

/**
 * Base shape for server-side args of a `vex.*` query function.
 *
 * Carries `ctx`, `populate`, `depth`, and `config`. `populate` and `depth`
 * are mutually exclusive — TypeScript enforces this via conditional constraints:
 * `populate` becomes `never` when `D ≠ 0`; `depth` and `config` become `never`
 * when `TPopulate` is non-empty. Passing both is a compile error at the call site.
 *
 * All three query functions (`find`, `get`, `search`) extend this base and
 * inherit these constraints without re-declaring them.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TSlug - The collection slug.
 * @typeParam TPopulate - The populate object.
 * @typeParam D - Depth literal (0 = no depth, default). Captured as a literal
 *   via `const D extends number = 0` on the implementing function.
 */
export interface GenericQueryServerParams<
  DataModel extends GenericDataModel = GenericDataModel,
  TSlug extends CollectionSlug = CollectionSlug,
  TPopulate extends PopulateShape<TSlug> = Record<string, never>,
  D extends number = 0,
> {
  /** Discriminator: server args MUST supply a Convex query context. */
  ctx: GenericQueryCtx<DataModel>;
  /**
   * Recursive populate object, type-narrowed against `RelationshipKeysOf<TSlug>`.
   * Mutually exclusive with `depth` — becomes `never` when `D ≠ 0`.
   */
  populate?: [D] extends [0] ? TPopulate : never;
  /**
   * @internal Auto-populate all relationship fields to this many levels.
   * Becomes `never` when `TPopulate` is non-empty. Use `populate` for
   * consumer-facing code; this is an internal escape hatch for `CollectionListView`.
   */
  depth?: [TPopulate] extends [Record<string, never>] ? D : never;
  /**
   * @internal The resolved `VexConfig`. Required alongside `depth`; passed
   * from the `queryApi` factory closure so the Convex handler has schema info.
   */
  config?: [TPopulate] extends [Record<string, never>] ? VexConfig : never;
}

/**
 * Base shape for client-side args of a `vex.*` mutation function. Mirrors
 * {@link GenericQueryClientParams} but exists separately so query-only
 * options (`populate`) don't leak into the mutation base, and so future
 * mutation-only shared fields have a clear home.
 */
export interface GenericMutationClientParams {
  /** Discriminator: client args MUST NOT supply `ctx`. */
  ctx?: never;
}

/**
 * Base shape for server-side args of a `vex.*` mutation function. Used inside
 * custom Convex mutation handlers; receives the Convex mutation context
 * (which is a superset of `GenericQueryCtx` — read+write vs. read-only).
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface GenericMutationServerParams<
  DataModel extends GenericDataModel,
> {
  /** Discriminator: server args MUST supply a Convex mutation context. */
  ctx: GenericMutationCtx<DataModel>;
}

// ── Per-collection field-type helpers ─────────────────────────────────────
//
// Read the `CollectionsFieldTypeMap` property on the augmented
// `GeneratedVexTypes` registry (populated by `vex generate`). Used by
// `populate` typing, sortable-column inference, and future filter ops.

/**
 * Returns the union of field keys on `TSlug` that have field type `TType`.
 *
 * Reads the `CollectionsFieldTypeMap` property on the augmented `GeneratedVexTypes`
 * registry — populated by `vex generate` from the user's collection configs.
 * Returns `never` when the slug has no fields of that type, or when the
 * registry hasn't been augmented yet (fresh project).
 *
 * @typeParam TSlug - The collection slug.
 * @typeParam TType - The field type literal (e.g., `"text"`, `"relationship"`).
 *
 * @example
 * ```ts
 * type AuthorRelationships = FieldKeysOfType<"posts", "relationship">;
 * // → "author" | "category"
 */
export type FieldKeysOfType<
  TSlug extends CollectionSlug,
  TType extends AdminFieldType,
> = TSlug extends keyof CollectionsFieldTypeMap
  ? TType extends keyof CollectionsFieldTypeMap[TSlug]
    ? CollectionsFieldTypeMap[TSlug][TType] & string
    : never
  : never;

/** Field keys on `TSlug` that are relationship fields. */
export type RelationshipKeysOf<TSlug extends CollectionSlug> = FieldKeysOfType<
  TSlug,
  typeof ADMIN_FIELDS.relationship.type
>;

/** Field keys on `TSlug` that are text fields. */
export type TextKeysOf<TSlug extends CollectionSlug> = FieldKeysOfType<
  TSlug,
  typeof ADMIN_FIELDS.relationship.type
>;

/**
 * Field keys on `TSlug` that are sortable in list views (text, number, date,
 * checkbox, select). Used by future `defaultSort` typing and the data-table
 * column registry.
 */
export type SortableKeysOf<TSlug extends CollectionSlug> = FieldKeysOfType<
  TSlug,
  | TextFieldType
  | NumberFieldType
  | DateFieldType
  | CheckboxFieldType
  | SelectFieldType
>;

/**
 * Resolves a relationship field's target slug.
 *
 * Reads the *resolved* `RelationshipField.collection.slug` from the
 * `GeneratedVexTypes` document shape (the relationship field key on a doc
 * stores the target slug as part of its branded `Id<TargetSlug>` type).
 * Falls back to `CollectionSlug` if not resolvable.
 */
export type RelationshipTargetOf<
  TSlug extends CollectionSlug,
  TKey extends string,
> = TSlug extends keyof DocumentBySlug
  ? TKey extends keyof DocumentBySlug[TSlug]
    ? NonNullable<DocumentBySlug[TSlug][TKey]> extends ReadonlyArray<{
        __tableName: infer T;
      }>
      ? T extends CollectionSlug
        ? T
        : CollectionSlug
      : CollectionSlug
    : CollectionSlug
  : CollectionSlug;

/**
 * Recursive populate options, type-restricted to relationship field keys per
 * the augmented `CollectionsFieldTypeMap` registry.
 *
 * @typeParam TSlug - The collection slug to narrow relationship keys against.
 *   Defaults to the full `CollectionSlug` union for internal recursive use.
 */
export type PopulateShape<TSlug extends CollectionSlug = CollectionSlug> = {
  [K in RelationshipKeysOf<TSlug>]?:
    | true
    | {
        populate: PopulateShape<RelationshipTargetOf<TSlug, K>>;
      };
};

/**
 * Result type of a populated query — `Doc<TSlug>` with each key listed in
 * `TPopulate` replaced from `Id<TargetSlug>[]` to `Doc<TargetSlug>[]`.
 * Recurses if the populate value has a nested `populate` field (D12: unbounded
 * nesting).
 *
 * Keys not in `TPopulate` keep their original `Id[]` type. Non-relationship
 * keys are left untouched.
 */
export type Populated<
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
> = TSlug extends keyof DocumentBySlug
  ? {
      [K in keyof DocumentBySlug[TSlug]]: K extends keyof TPopulate
        ? K extends string
          ? RelationshipTargetOf<TSlug, K> extends infer Target
            ? Target extends CollectionSlug
              ? Target extends keyof DocumentBySlug
                ? // Recurse if nested populate is provided.
                  TPopulate[K] extends {
                    populate: infer NestedPopulate;
                  }
                  ? NestedPopulate extends PopulateShape<Target>
                    ? Populated<Target, NestedPopulate>[]
                    : DocumentBySlug[Target][]
                  : DocumentBySlug[Target][]
                : DocumentBySlug[TSlug][K]
              : DocumentBySlug[TSlug][K]
            : DocumentBySlug[TSlug][K]
          : DocumentBySlug[TSlug][K]
        : DocumentBySlug[TSlug][K];
    }
  : never;

/**
 * Computes the equivalent `PopulateShape` for automatically populating all
 * relationship fields on `TSlug` to `D` levels deep.
 *
 * This is the type-level counterpart of `buildDepthPopulate`. The computed
 * shape is a valid `PopulateShape<TSlug>` and can be fed directly into
 * `Populated<TSlug, DepthPopulate<TSlug, D>>`.
 *
 * **How the counter works:** `_Counter` is a tuple of `0`s whose `length`
 * tracks how many levels have been descended. At the penultimate level
 * (`[..._Counter, 0]["length"] extends D`) fields are emitted as `true`
 * (populate, no further recursion). At intermediate levels they are emitted as
 * `{ populate: DepthPopulate<Target, D, [..._Counter, 0]> }`.
 *
 * **Practical depth limit: 3.** TypeScript instantiation count grows
 * exponentially with D × relationship-key-count-per-collection. D=1,2,3 is
 * safe for typical VexCMS schemas; D≥4 may cause noticeable `tsc` slowdown.
 * Runtime has no limit.
 *
 * @typeParam TSlug - The collection slug to start from.
 * @typeParam D - The depth as a literal number (1, 2, or 3 recommended).
 * @typeParam _Counter - Internal tuple counter — callers must not supply this.
 *
 * @example Resolved shape for `depth: 1` on "posts" with "author" relationship
 * ```ts
 * // DepthPopulate<"posts", 1> → { author?: true }
 * // Equivalent to writing `populate: { author: true }` explicitly
 * ```
 * @example Resolved shape for `depth: 2`
 * ```ts
 * // DepthPopulate<"posts", 2> → { author?: { populate: { team?: true } } }
 * // Equivalent to `populate: { author: { populate: { team: true } } }`
 * ```
 */
export type DepthPopulate<
  TSlug extends CollectionSlug,
  D extends number,
  _Counter extends 0[] = [],
> = _Counter["length"] extends D
  ? Record<string, never>
  : [..._Counter, 0]["length"] extends D
    ? { [K in RelationshipKeysOf<TSlug>]?: true }
    : {
        [K in RelationshipKeysOf<TSlug>]?: {
          populate: DepthPopulate<
            RelationshipTargetOf<TSlug, K>,
            D,
            [..._Counter, 0]
          >;
        };
      };

/**
 * Return type of `find` / `get` / `search` when `depth` is provided instead
 * of an explicit `populate` object.
 *
 * Delegates to `Populated<TSlug, DepthPopulate<TSlug, D>>` — the same type
 * the explicit populate path produces — so the narrowed shape is identical to
 * what you would get by writing all relationship keys by hand.
 *
 * **Non-literal fallback:** `number extends D` (i.e., `D` is not a literal)
 * short-circuits to `VexDocument` to avoid evaluating an infinite recursive
 * type. `depth` is only called internally with literal values (`1`), so this
 * only fires when depth comes from a non-literal `number` variable.
 *
 * **`depth: 0`** (the default) returns raw un-populated docs — identical to
 * omitting both `depth` and `populate`.
 *
 * @typeParam TSlug - The collection slug.
 * @typeParam D - The depth literal.
 */
export type DepthPopulated<
  TSlug extends CollectionSlug,
  D extends number,
> = number extends D
  ? VexDocument
  : D extends 0
    ? TSlug extends keyof DocumentBySlug
      ? DocumentBySlug[TSlug]
      : never
    : TSlug extends keyof DocumentBySlug
      ? Prettify<Populated<TSlug, DepthPopulate<TSlug, D>>>
      : never;
