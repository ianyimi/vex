import { CollectionConfig } from "../types";
import { GlobalConfig } from "../globals";
import type {
  AuthOrgDocument,
  AuthUserDocument,
  DocumentBySlug,
  GlobalDocumentBySlug,
  CollectionSlug,
  IndexFieldsBySlug,
  IndexNameFor,
} from "../types/generated";
import {
  ADMIN_CUSTOM_SUBJECTS,
  WILDCARD_KEY,
  type PermissionMode,
  type CrudAction,
  type DraftAction,
  type AdminCustomSubjectSlug,
  QueryAction,
} from "./constants";
import { ConvexError } from "convex/values";
import type { Expression, FilterBuilder, IndexRange, IndexRangeBuilder } from "convex/server";
import type {
  AccessConditionResult,
  DeclaredDoc,
  AccessPredicateBuilder,
  AccessQueryBuilder,
} from "./constraintTypes";

/**
 * Any config that may contribute a resource subject: a collection or a global.
 * Structural — the slug literal (and `versions.drafts`, when present) is all
 * the type system reads from it.
 */
export type AccessResource = CollectionConfig | GlobalConfig;

/**
 * Single permission check result — boolean shorthand (all/none) or a
 * field-mode object restricting the check to named fields.
 *
 */

/**
 * Props passed to a permission callback.
 *
 * The `data` key exists only for data-carrying subjects; the `organization`
 * key exists only when `orgCollectionSlug` is configured. Built with
 * intersections (not conditional property types) so the keys are truly
 * absent — not present-but-`never` — when unavailable.
 *
 * @typeParam TData - Document type for the subject; `never` when the subject has no data.
 * @typeParam TUser - User document shape (registry lookup on the user collection slug).
 * @typeParam TOrg - Organization document shape; `never` when not configured.
 */
export type PermissionCallbackProps<
  TData = unknown,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
> = {
  user: TUser;
} & ([TData] extends [never] ? unknown : { data: TData }) &
  ([TOrg] extends [never] ? unknown : { organization: TOrg });

/**
 * The plain permission check shapes shared by every action: a static boolean or a
 * callback. The object form is {@link ConstrainedPermissionCheck}; this is the leaf a
 * rule's optional `filter` property also accepts.
 *
 * A callback returning `undefined` is treated as deny — "inconclusive" must never
 * read as an implicit allow. @internal
 */
type BasePermissionCheck<TData, TUser, TOrg> =
  | boolean
  | ((props: PermissionCallbackProps<TData, TUser, TOrg>) => boolean | undefined);

/** A range callback as applied to a Convex query. @internal */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IndexRangeFn = (q: IndexRangeBuilder<any, any, 0>) => IndexRange;

/**
 * A compiled access filter as applied to a Convex query — the output of
 * `resolveAccessConstraint`.
 *
 * A thunk rather than an `Expression<boolean>` because a filter expression can only
 * be built from the query's OWN `FilterBuilder`, which the resolver never sees: the
 * caller supplies it inside `.filter((q) => …)`. Mirrors {@link IndexRangeFn}, which
 * is deferred for the same reason and uses the same `any` table-info convention.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AccessFilterFn = (q: FilterBuilder<any>) => Expression<boolean>;

/**
 * A concrete index a query will use: the output of `resolveAccessIndex` and,
 * after arbitration, of `pickQueryIndex`. Both stages produce the same shape,
 * so there is one type for both.
 *
 * Distinct from what the user *authors*: a rule declares its index inside
 * `q.withIndex(name, (ix) => …)`, whose range is a function **of the caller**.
 * Resolving one binds the caller in, leaving the plain
 * `(q) => …` builder here and widening `name` to `string` — by resolve time
 * the resource generic is gone. `AccessIndex` is the template; this is that
 * template applied to one caller.
 *
 * `range` is optional because after arbitration the winner may be a *caller's*
 * `withIndex`, and a caller may legitimately name an index with no range purely
 * to order results. `buildQuery` already branches on this
 * (`api/find/server.ts` — `range ? withIndex(name, range) : withIndex(name)`),
 * so an absent range needs no placeholder.
 *
 * An access-sourced index always carries one, guaranteed by
 * {@link AccessQueryBuilder.withIndex} requiring its range callback rather than
 * restated as a second type here — a range-less access index would scan the whole
 * table, since every document has an index entry (fields that are missing are
 * indexed as `undefined`).
 */
export interface QueryIndex {
  /** Index name to query. */
  name: string;
  /** Range to apply; omitted for an ordering-only caller index. */
  range?: IndexRangeFn;
}

/**
 * Props for a rule's `constraints` callback: the caller, optionally the
 * organization, and `q` — the builder the rule records onto. No `data`:
 * constraints run once per query, before any document is read (contrast
 * {@link PermissionCallbackProps}, which the sibling `filter` property uses).
 *
 * `q`'s TYPE is what gates index pushdown per action (DD 14). A query-shaped
 * action gets an {@link AccessQueryBuilder} — `filter` plus `withIndex`; every
 * other action gets an {@link AccessPredicateBuilder}, the same shape minus
 * `withIndex`, so a rule reads identically either way and `q.withIndex` is simply
 * absent where there is no query to narrow. One property, two builder types, and
 * nothing to discriminate at the object level.
 *
 * @typeParam TData - Document type constraints are typed against.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape; `never` if not configured.
 * @typeParam TQ - The builder for this action: `AccessQueryBuilder` on query
 *   actions, `AccessPredicateBuilder` on mutations.
 */
export type ConstraintsCallbackProps<
  TData = unknown,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
  TQ = AccessPredicateBuilder<TData>,
> = {
  user: TUser;
  q: TQ;
} & ([TOrg] extends [never] ? unknown : { organization: TOrg });

/**
 * A rule's constraint-recording callback.
 *
 * ONE signature returning `boolean | ConstraintResult`, never a union of two
 * function types: verified against `tsc` that a union of differently-shaped
 * callbacks breaks contextual typing of the destructured `props` — every
 * parameter infers `any` instead of TypeScript picking a member. `boolean` is
 * primitive and `ConstraintResult` is nominal, so discriminating the RESULT at
 * runtime (`typeof result === "boolean"`) stays unambiguous.
 *
 * @typeParam TData - Document type constraints are typed against.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape; `never` if not configured.
 * @typeParam TQ - The builder for this action.
 */
export type ConstraintsCallback<
  TData = unknown,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
  TQ = AccessPredicateBuilder<TData>,
> = (props: ConstraintsCallbackProps<TData, TUser, TOrg, TQ>) => boolean | AccessConditionResult;

/**
 * The constraint-builder object form of a permission check — ONE shape for every
 * action.
 *
 * `constraints` narrows what gets read: compiled to a `withIndex` range when the
 * rule called `q.withIndex(…)`, otherwise to a `.filter()` expression, and in
 * either case interpreted per-document as a JS predicate
 * (`compileConstraints`). `filter` is an OPTIONAL additional per-document check
 * for what constraints cannot express — array membership, string operations,
 * cross-table reads, all outside `FilterBuilder`'s surface, so they stay
 * callbacks permanently.
 *
 * `filter` augments `constraints`; it never replaces it. A rule that declares
 * only `constraints` is already checked per-document too, via
 * `constraintsToPredicate` in `hasPermission`. A bare `filter`-only shape is
 * therefore rejected — a callback with no descriptor cannot narrow a query, so
 * write it as a bare callback instead and accept the full scan knowingly.
 *
 * Index pushdown is opted into INSIDE the callback
 * ({@link AccessQueryBuilder.withIndex}), not by a sibling property. That is
 * what lets `q` bind to one index's real field tuple and check field ORDER at
 * compile time; a sibling property cannot be seen by its neighbour's callback
 * type.
 *
 * @typeParam TData - Document type for the subject.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape; `never` if not configured.
 * @typeParam TQ - The builder for this action.
 */
export interface ConstrainedPermissionCheck<
  TData = unknown,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
  TQ = AccessPredicateBuilder<TData>,
> {
  /** Narrows what gets read. Required — see the type doc. */
  constraints: ConstraintsCallback<TData, TUser, TOrg, TQ>;
  /** Optional per-document check augmenting `constraints`. Never a substitute. */
  filter?: BasePermissionCheck<TData, TUser, TOrg>;
}

/**
 * Every check shape valid on **any** action, query-shaped or not: the plain leaf
 * shapes plus the constraint-builder object form (DD 14).
 *
 * This is the tier `RolePermissions` hands a non-query action. The only difference
 * from {@link PermissionCheck} is `q`'s type: a query action's `q` has `withIndex`,
 * this one's does not.
 *
 * **Why `ConstrainedPermissionCheck` sits here rather than inside
 * {@link BasePermissionCheck}.** Both are now valid on every action, so folding
 * them looks tempting. It cannot be done: `BasePermissionCheck` is also the type of
 * the `filter` property *inside* both object forms, so folding the composite into
 * it makes `filter` able to hold another whole constrained check —
 * `{ constraints, filter: { constraints, filter: … } }` — an infinite regress the
 * compiler accepts and `hasPermission`'s resolver has no meaning for. `filter` is
 * the per-document escape hatch for what constraints cannot express; a constraints
 * object is not a leaf check. "Base" stays the irreducible shapes — a value or a
 * function — and the composites point at it, never the other way round.
 *
 * @typeParam TData - Document type for the subject.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape; `never` if not configured.
 */
export type AnyActionPermissionCheck<
  TData = unknown,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
> =
  | BasePermissionCheck<TData, TUser, TOrg>
  | ConstrainedPermissionCheck<TData, TUser, TOrg, AccessPredicateBuilder<TData>>;

/**
 * A single permission check on a **query-shaped** action: the plain leaf shapes,
 * and the constraint form with `q` upgraded to an {@link AccessQueryBuilder} so
 * `q.withIndex(…)` is available.
 *
 * The ONLY difference from {@link AnyActionPermissionCheck} is `q`'s type. Index
 * pushdown is gated by giving a query action a builder
 * that HAS `withIndex` and a mutation one that does not — so writing
 * `q.withIndex(…)` on a create is a missing-method error at the exact call, rather
 * than a whole-object shape rejection pointing at the wrong line (DD 14).
 *
 * A callback returning `undefined` is treated as deny.
 *
 * @typeParam TData - Document type for the subject.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape; `never` if not configured.
 * @typeParam TIndexFields - The resource's index name → field tuple map, which
 *   `q.withIndex` resolves against.
 */
export type PermissionCheck<
  TData = unknown,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
  TIndexFields extends Record<string, readonly string[]> = Record<string, readonly string[]>,
> =
  | BasePermissionCheck<TData, TUser, TOrg>
  | ConstrainedPermissionCheck<TData, TUser, TOrg, AccessQueryBuilder<TData, TIndexFields>>;

/**
 * One entry in the subject registry: the action union, the data shape passed
 * to callbacks, and the index registry `q.withIndex` resolves against.
 */
export interface SubjectEntry {
  /** Union of actions this subject supports. */
  action: string;
  /** Actions on this subject whose `q` carries `withIndex`. `never` when none do. */
  queryAction: string;
  /** Document/context type; `never` for subjects without data. */
  data: unknown;
  /** Union of access-index names declared on this resource; `never` for non-indexable subjects. */
  indexes: string;
  /**
   * The resource's declared indexes as name → field tuple, in declaration order.
   * `{}` for subjects with no table to index (custom resources, admin subjects),
   * which makes `q.withIndex` uncallable there rather than absent.
   *
   * Carries TUPLES, not just the names in `indexes`, because
   * {@link AccessQueryBuilder.withIndex} binds `q` to one index's real field order
   * — that is what makes positional constraint typing reachable.
   */
  indexFields: Record<string, readonly string[]>;
}

// ── Inference helpers (registry-based via GeneratedVexTypes augmentation) ──

/** Extract the slug literal from a resource config. @internal */
type ExtractSlug<T> = T extends { slug: infer S extends string } ? S : never;

/**
 * Document type for a slug via the generated registry (collections, then
 * globals; wide fallback pre-generation). @internal
 */
type InferDocTypeFromSlug<S extends string> = S extends keyof DocumentBySlug
  ? DocumentBySlug[S]
  : S extends keyof GlobalDocumentBySlug
    ? GlobalDocumentBySlug[S]
    : Record<string, unknown>;

/**
 * Document type for a resource config via its slug literal. @internal
 */
type InferDocType<T> = T extends { slug: infer S extends string }
  ? InferDocTypeFromSlug<S>
  : Record<string, unknown>;

/**
 * The document type a permission callback receives for resource `S`.
 *
 * Exported because a project writing its own composable access checks has to name
 * this type. Accepts any slug string: {@link InferDocTypeFromSlug} resolves
 * collections, then globals, then falls back wide, so a global slug works here too.
 *
 * @typeParam S - Resource slug.
 */
export type AccessDocFor<S extends string> = DeclaredDoc<InferDocTypeFromSlug<S>>;

/**
 * Resource `S`'s index name → field tuple map, which `q.withIndex` resolves against.
 *
 * @typeParam S - Resource slug.
 */
export type AccessIndexFieldsFor<S extends string> = S extends keyof IndexFieldsBySlug
  ? IndexFieldsBySlug[S]
  : Record<string, readonly string[]>;

/**
 * The exact check type `permissions[role][S][queryAction]` accepts.
 *
 * This is the return type for a project-defined helper on a query-shaped action
 * (`read`, `readDrafts`) — the helper hands back a check, so nothing wraps it and the
 * call site reads identically to writing the check inline.
 *
 * @typeParam S - Resource slug.
 * @typeParam TUser - The project's user document type.
 * @typeParam TOrg - The project's organization document type, or `never`.
 */
/**
 * The field union a helper can use to READ a value off `AccessDocFor<S>`.
 *
 * A bare `keyof`, deliberately: a parameter bounded by it is *provably* a key of the
 * document, so `data[field]` needs no cast. Wrapping it in a widening conditional —
 * "fall back to `string` when the registry is unaugmented" — breaks exactly that,
 * because TypeScript cannot prove an unreduced conditional is a key, and the read
 * fails with "Type 'F' cannot be used to index type".
 *
 * The cost of staying indexable: for a slug the registry does not know, the document
 * is the wide fallback whose index signature `DeclaredDoc` strips, leaving this
 * `never`. A field-reading helper therefore only types after `vex generate` — already
 * true of the rest of authoring an access config, since slugs and index names come
 * from the same registry.
 *
 * @typeParam S - Resource slug.
 */
export type AccessDocFieldFor<S extends string> = keyof AccessDocFor<S> & string;

/**
 * Fields on `S` that LEAD a declared index.
 *
 * Only a leading field can open an index range, so a helper that pushes a comparison
 * into an index must restrict its field argument to these — otherwise it silently
 * degrades to a full scan.
 *
 * @typeParam S - Resource slug.
 */
export type AccessIndexedFieldFor<S extends string> = {
  [N in keyof AccessIndexFieldsFor<S>]: AccessIndexFieldsFor<S>[N] extends readonly [
    infer F,
    ...unknown[],
  ]
    ? F
    : never;
}[keyof AccessIndexFieldsFor<S>] &
  string;

/**
 * The index on `S` whose leading field is `F`.
 *
 * Lets a helper's runtime index lookup be typed as the index name it resolves to,
 * rather than a bare `string` that `q.withIndex` refuses.
 *
 * @typeParam S - Resource slug.
 * @typeParam F - A field that leads an index on `S`.
 */
export type AccessIndexNameFor<S extends string, F> = {
  [N in keyof AccessIndexFieldsFor<S>]: AccessIndexFieldsFor<S>[N] extends readonly [
    F,
    ...unknown[],
  ]
    ? N
    : never;
}[keyof AccessIndexFieldsFor<S>] &
  string;

/**
 * The stored value type of field `F` on `S`.
 *
 * @typeParam S - Resource slug.
 * @typeParam F - Field name.
 */
export type AccessFieldValueFor<S extends string, F> = F extends keyof AccessDocFor<S>
  ? AccessDocFor<S>[F]
  : never;

/**
 * Indexed fields on `S` whose stored value admits `V`.
 *
 * Narrows a value-specific helper — a "published only" read, say — to the fields that
 * can actually hold that value, so naming the wrong field is a compile error rather
 * than a comparison that silently matches nothing. Handles both a scalar field and an
 * array-valued one (`select` and relationship fields store arrays).
 *
 * @typeParam S - Resource slug.
 * @typeParam V - The value the field must be able to hold.
 */
export type AccessIndexedFieldWithValue<S extends string, V> = {
  [F in AccessIndexedFieldFor<S>]: NonNullable<
    AccessFieldValueFor<S, F>
  > extends readonly (infer E)[]
    ? [V] extends [E]
      ? F
      : never
    : [V] extends [NonNullable<AccessFieldValueFor<S, F>>]
      ? F
      : never;
}[AccessIndexedFieldFor<S>];

/**
 * What a check builder needs from a resource config: the slug, to bind `S`, and the
 * fields, to recover an index NAME from a field name at runtime.
 *
 * Structural rather than `CollectionConfig` so a `GlobalConfig` satisfies it too.
 *
 * @typeParam S - Resource slug.
 */
export type AccessResourceRef<S extends string> = {
  readonly fields: Readonly<Record<string, { readonly index?: string; readonly type?: string }>>;
  readonly slug: S;
};

/**
 * The check type `permissions[role][S][queryAction]` accepts, with the project's user
 * and organization documents resolved from the generated registry.
 *
 * `vex generate` emits the slugs `defineAccess` was configured with
 * ({@link AuthSlugs}), so the project's user and organization documents resolve from
 * the registry — nothing needs passing in, and a project's helpers need no local
 * type aliases at all. `AccessMutationCheck` is the non-query counterpart: its `q`
 * is an {@link AccessPredicateBuilder}, no `withIndex`, because a single-document
 * authorization has no range to narrow (DD 14).
 *
 * @typeParam S - Resource slug.
 */
export type AccessCheck<S extends string> = PermissionCheck<
  AccessDocFor<S>,
  AuthUserDocument,
  AuthOrgDocument,
  AccessIndexFieldsFor<S>
>;

/**
 * The check type a NON-query action (`create`/`update`/`delete`, custom actions)
 * accepts, with user and organization resolved from the registry.
 *
 * @typeParam S - Resource slug.
 */
export type AccessMutationCheck<S extends string> = AnyActionPermissionCheck<
  AccessDocFor<S>,
  AuthUserDocument,
  AuthOrgDocument
>;

/**
 * Index-name union for a resource config via its slug literal, from the
 * generated {@link IndexNameFor} registry (wide `string` fallback
 * pre-generation). @internal
 */
type ExtractIndexNames<T> = T extends { slug: infer S extends string } ? IndexNameFor<S> : string;

/**
 * The declared-index field-tuple map for a resource config's slug — the shape
 * {@link AccessQueryBuilder.withIndex} resolves against. `{}` pre-generation, so
 * `withIndex` accepts nothing rather than accepting anything. @internal
 */
type ExtractIndexFields<T> = T extends { slug: infer S extends string }
  ? S extends keyof IndexFieldsBySlug
    ? IndexFieldsBySlug[S]
    : PreGenerationIndexFields
  : PreGenerationIndexFields;

/**
 * Pre-generation fallback for {@link ExtractIndexFields}: any index name, and a
 * FIXED-LENGTH tuple of eight `string` slots per index.
 *
 * The length matters more than it looks. `ConstraintBuilder` terminates its chain
 * on `PlusOne<N> extends TFields["length"]`, and a plain `readonly string[]` has
 * `length: number` — which that test treats as already satisfied, so the chain would
 * end after ONE constraint. A fixed-length tuple keeps `length` a numeric literal,
 * so chaining behaves the same before and after `vex generate`; only field NAMES and
 * per-field value types widen. Eight comfortably exceeds any realistic compound
 * index. @internal
 */
type PreGenerationIndexFields = Record<
  string,
  readonly [string, string, string, string, string, string, string, string]
>;

/** True when a resource config declares `versions.drafts: true`. @internal */
type HasDrafts<T> = T extends { versions?: { drafts?: infer D extends boolean } }
  ? D extends true
    ? true
    : false
  : false;

/**
 * Subject entry synthesized for the user/organization collections.
 *
 * Resolved from the slug via the generated registry, so these subjects exist with
 * full document and index typing WITHOUT the collection being passed in
 * `resources` — the adapter owns those tables and merges them later, inside
 * `defineConfig`. CRUD-only: auth tables are never versioned. @internal
 */
type AuthSubjectEntry<S extends string, TCustomActions> = {
  action:
    | CrudAction
    | CustomActionsFor<S, TCustomActions>["query"]
    | CustomActionsFor<S, TCustomActions>["mutation"];
  queryAction: QueryAction | CustomActionsFor<S, TCustomActions>["query"];
  data: DeclaredDoc<InferDocTypeFromSlug<S>>;
  indexes: IndexNameFor<S>;
  indexFields: AccessIndexFieldsFor<S>;
};

/**
 * The user subject, plus the organization subject when one is configured.
 *
 * The `string extends S` guards are load-bearing: for a non-literal slug the mapped
 * type would become an INDEX SIGNATURE, making every subject key valid in
 * `RolePermissions` and silently destroying typo-checking across the whole matrix.
 * @internal
 */
type AuthSubjects<
  TUserSlug extends CollectionSlug,
  TOrgSlug extends CollectionSlug | undefined,
  TCustomActions,
> = (string extends TUserSlug
  ? unknown
  : { [K in TUserSlug]: AuthSubjectEntry<K, TCustomActions> }) &
  (TOrgSlug extends string
    ? string extends TOrgSlug
      ? unknown
      : { [K in TOrgSlug]: AuthSubjectEntry<K, TCustomActions> }
    : unknown);

/**
 * The complete subject registry: resources (keyed by slug, CRUD + conditional
 * draft actions), custom resources, and the core built-in subjects from
 * {@link ADMIN_CUSTOM_SUBJECTS}.
 *
 * @typeParam TResources - Structural resource tuple (`{ slug, versions? }`).
 * @typeParam TCustomResources - Custom resource declarations.
 * @typeParam TUserSlug - User collection slug
 * @typeParam TOrgSlug - Organization collection slug
 * @typeParam TCustomActions extends Record<string, CustomActionsInput> = {},   // NEW
 */
export type SubjectMap<
  TResources extends readonly AccessResource[] = AccessResource[],
  TCustomResources extends Record<string, CustomResourceInput> = Record<
    string,
    CustomResourceInput
  >,
  TUserSlug extends CollectionSlug = CollectionSlug,
  TOrgSlug extends CollectionSlug | undefined = undefined,
  TCustomActions extends Partial<
    Record<TResources[number]["slug"] | TUserSlug | Extract<TOrgSlug, string>, CustomActionsInput>
  > = {},
> = {
  [R in TResources[number] as ExtractSlug<R>]: {
    action:
      | CrudAction
      | (HasDrafts<R> extends true ? DraftAction : never)
      | CustomActionsFor<ExtractSlug<R>, TCustomActions>["query"]
      | CustomActionsFor<ExtractSlug<R>, TCustomActions>["mutation"];
    queryAction: QueryAction | CustomActionsFor<ExtractSlug<R>, TCustomActions>["query"];
    // Index signature stripped: generated documents extend `VexDocument`, whose
    // `[key: string]: unknown` otherwise makes `data.anythingAtAll` read as `unknown`
    // in every permission callback instead of erroring.
    data: DeclaredDoc<InferDocType<R>>;
    indexes: ExtractIndexNames<R>;
    indexFields: ExtractIndexFields<R>;
  };
} & {
  [K in keyof TCustomResources]: {
    action: TCustomResources[K]["actions"][number];
    queryAction: never;
    data: TCustomResources[K]["data"] extends DataTypeCarrier<infer D> ? D : never;
    indexes: never;
    indexFields: {};
  };
} & {
  [K in AdminCustomSubjectSlug]: {
    action: (typeof ADMIN_CUSTOM_SUBJECTS)[K]["actions"][number];
    queryAction: never;
    data: never;
    indexes: never;
    indexFields: {};
  };
} & Omit<
    AuthSubjects<TUserSlug, TOrgSlug, TCustomActions>,
    ExtractSlug<TResources[number]> | keyof TCustomResources | AdminCustomSubjectSlug
  >;

/**
 * Phantom carrier for a custom resource's `data` type. Created by
 * {@link dataType}; never inspected at runtime.
 */
export interface DataTypeCarrier<T = never> {
  readonly __phantom?: T;
}

/**
 * Declares the data type callbacks (and `hasPermission` callers) receive for a
 * custom resource.
 *
 * @example
 * ```ts
 * customResources: {
 *   reviews: { actions: ["approve", "reject"], data: dataType<{ queue: string }>() },
 * }
 * ```
 * @returns a plain object '{}'
 */
export function dataType<T>(): DataTypeCarrier<T> {
  return {};
}

/** Custom actions for one resource, split by whether `q` gets `withIndex`. */
export type CustomActionsInput = {
  query?: readonly string[];
  mutation?: readonly string[];
};

/** The custom query/mutation action unions declared for slug `S`. @internal */
type CustomActionsFor<S extends string, TCA> = S extends keyof TCA
  ? {
      // Each list is matched INDEPENDENTLY, against a REQUIRED property. Matching
      // both at once against optional properties fails wholesale when either list
      // is omitted - and `infer Q` then falls back to its `string` constraint,
      // widening that resource's entire action union and silently disabling
      // typo-checking for it (while every other resource keeps it). Declaring only
      // `mutation` is the common case, so the naive form breaks the default path.
      query: TCA[S] extends { query: readonly (infer Q extends string)[] } ? Q : never;
      mutation: TCA[S] extends { mutation: readonly (infer M extends string)[] } ? M : never;
    }
  : { query: never; mutation: never };

/**
 * A custom (non-collection) subject declaration: its action list and an
 * optional typed data carrier. One canonical form — no array shorthand.
 */
export type CustomResourceInput = {
  actions: readonly string[];
  data?: DataTypeCarrier<unknown>;
};

/**
 * Per-role permission matrix, typed against the resolved {@link SubjectMap}.
 *
 * Each subject key accepts `boolean` (all actions) or a per-action map whose
 * keys are that subject's action union plus the action-level wildcard
 * ({@link WILDCARD_KEY}).
 *
 * **Only `withIndex` is gated on {@link QueryAction}** (DD 14). A query-shaped
 * action gets the full {@link PermissionCheck}, whose `q` carries `withIndex` —
 * there is a query to narrow.
 * Every other action gets the plain shapes plus
 * {@link ConstrainedPermissionCheck}: a create/update/delete has no query to
 * narrow, but its constraints are still meaningful, interpreted per-document via
 * `constraintsToPredicate`. Restricting the object form to query actions is what
 * used to force a read+update pair to express one predicate twice — once as a
 * constraint, once as a hand-written callback — which is the dual-expression
 * footgun this design removes.
 *
 * The action-level wildcard stays plain: it spans actions of mixed shape, so a
 * constraint written there could not be typed against one document consistently.
 * The role-level wildcard is boolean-only.
 * Precedence: explicit action > subject wildcard > role wildcard > `defaults`.
 *
 * @typeParam TSubjects - The resolved {@link SubjectMap}.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape, or `never`.
 */
export type RolePermissions<
  TSubjects extends Record<string, SubjectEntry>,
  TUser = Record<string, unknown>,
  TOrg = never,
  TUserSlug extends CollectionSlug = CollectionSlug,
  TOrgSlug extends CollectionSlug | undefined = never,
> = {
  [S in keyof TSubjects | TUserSlug | (TOrgSlug extends string ? TOrgSlug : never)]?:
    | boolean
    | ({
        // Gate order is load-bearing, not stylistic. A conditional whose `extends`
        // clause references a type parameter with no inference candidate yet
        // (`customActions` omitted) stays DEFERRED, and a deferred conditional
        // supplies no contextual type - silently turning every implicitly-typed
        // permission callback into an implicit `any`. Testing the closed built-in
        // sets first (plus the wildcard key, which contextual lookup probes against
        // this same template) means only genuinely custom action names reach the
        // `queryAction` branch - and those exist only when `customActions` was
        // declared, at which point the parameter has a candidate and resolves.
        [A in TSubjects[S]["action"]]?: A extends QueryAction
          ? PermissionCheck<TSubjects[S]["data"], TUser, TOrg, TSubjects[S]["indexFields"]>
          : A extends Exclude<CrudAction | DraftAction, QueryAction> | typeof WILDCARD_KEY
            ? AnyActionPermissionCheck<TSubjects[S]["data"], TUser, TOrg>
            : A extends TSubjects[S]["queryAction"]
              ? PermissionCheck<TSubjects[S]["data"], TUser, TOrg, TSubjects[S]["indexFields"]>
              : AnyActionPermissionCheck<TSubjects[S]["data"], TUser, TOrg>;
      } & {
        [W in typeof WILDCARD_KEY]?: AnyActionPermissionCheck<TSubjects[S]["data"], TUser, TOrg>;
      });
} & {
  /** Role-level wildcard: covers subjects this role never declares. Boolean only. */
  [W in typeof WILDCARD_KEY]?: boolean;
};

/**
 * Input shape for the `defineAccess` builder.
 *
 * @typeParam TRoles - Tuple of role name literals.
 * @typeParam TResources - Structural resource tuple (`{ slug, versions? }`).
 * @typeParam TCustomResources - Custom resource declarations.
 * @typeParam TUserCollection - `{ slug }` shape naming the user collection.
 * @typeParam TOrgCollection - `{ slug }` shape naming the org collection; `undefined` if absent.
 *
 * @see {@link VexAccessConfig} for the resolved runtime shape.
 */
export interface VexAccessConfigInput<
  TRoles extends readonly string[],
  TResources extends readonly AccessResource[] = readonly AccessResource[],
  TCustomResources extends Record<string, CustomResourceInput> = {},
  TUserSlug extends CollectionSlug = CollectionSlug,
  TOrgSlug extends CollectionSlug | undefined = undefined,
  TCustomActions extends Partial<
    Record<TResources[number]["slug"] | TUserSlug | Extract<TOrgSlug, string>, CustomActionsInput>
  > = {},
> {
  /** Default: `true`. Turn access control on or off. */
  enabled?: boolean;

  /**
   * OPTIONAL. Role applied when a caller's roles resolve empty — no session,
   * or an anonymous user (e.g. Better Auth anonymous plugin) whose
   * `userRolesField` is unset. Explicit roles always win over this fallback.
   * Omitted → empty roles deny, exactly as before.
   */
  anonRole?: TRoles[number];

  /** Role identifiers; keys of the `permissions` matrix. */
  roles: TRoles;

  /** Collections/globals contributing subjects, keyed by slug. */
  resources: TResources;

  /**
   * Extra actions per resource, beyond CRUD. Keys must be declared resource slugs
   * (or the user/org collection slugs).
   *
   * Three constituents, each load-bearing:
   *
   * 1. `TCustomActions` — the inference site; carries the caller's literal declaration
   *    into the phantom `SubjectMap`.
   * 2. `Partial<Record<slugs, …>>` — the COMPLETION source. Key completions come from
   *    the property's contextual type, and a bare unresolved type parameter offers
   *    nothing; this constituent names the slug union directly, which is resolvable in
   *    the first inference round (`resources` and the slugs are not context-sensitive).
   *    Redundant for checking — the bound already constrains values.
   * 3. The exactness map — the TYPO guard. The `Partial<Record<…>>` bound cannot reject
   *    a bad key on its own: an all-optional target is a "weak type", so TypeScript
   *    errors only when the object shares ZERO keys with it — one valid entry beside a
   *    garbage key passes, because structural subtyping permits extra properties and
   *    per-key excess checking does not fire against a generic-constrained inference.
   *    Mapping every key NOT in the slug union to `never` makes the garbage entry's
   *    value unassignable AT ITS OWN KEY, restoring both the error and its location.
   */
  customActions?: TCustomActions &
    Partial<
      Record<TResources[number]["slug"] | TUserSlug | Extract<TOrgSlug, string>, CustomActionsInput>
    > & {
      [K in Exclude<
        keyof TCustomActions,
        TResources[number]["slug"] | TUserSlug | Extract<TOrgSlug, string>
      >]: never;
    };

  /**
   * Custom, non-resource subjects with arbitrary action unions and optional
   * typed data. Example: `{ apiKeys: { actions: ["create", "revoke"] } }`.
   */
  customResources?: TCustomResources;

  /**
   * Slug of the collection whose documents are `user` in callbacks. A plain
   * slug string — the full collection often does not exist at authoring time
   * (auth-adapter collections merge later, inside `defineConfig`); the
   * document type resolves from the generated registry by slug.
   */
  userCollectionSlug: TUserSlug;

  /**
   * REQUIRED. The field on the user document that holds the user's role(s).
   * Value may be `string` or `string[]`; `hasPermission` normalizes both.
   * Callers never pass roles separately — they always ride the user document.
   */
  userRolesField: string;

  /**
   * Slug of the organization collection. When present, `organization` is
   * available (typed via the registry) in every permission callback; when
   * omitted, callbacks have no `organization` key.
   */
  orgCollectionSlug?: TOrgSlug;

  /**
   * Permission matrix: role → subject → check. See {@link RolePermissions}
   * for shapes and wildcard semantics.
   */
  permissions: Record<
    TRoles[number],
    RolePermissions<
      SubjectMap<TResources, TCustomResources, TUserSlug, TOrgSlug, TCustomActions>,
      InferDocTypeFromSlug<TUserSlug>,
      TOrgSlug extends string ? InferDocTypeFromSlug<TOrgSlug> : never,
      TUserSlug,
      TOrgSlug
    >
  >;
}

/**
 * Resolved access configuration returned by `defineAccess` — the runtime
 * shape consumed by `hasPermission`.
 *
 * Deliberately VALUE-LEVEL TYPE-ERASED: every call-site guarantee
 * (`resource`/`action` unions, callback `data` types, field keys) rides the
 * phantom `TSubjects` parameter, while the stored fields are wide. This is
 * what lets any concrete config assign to plain `VexAccessConfig` (e.g. the
 * `access` field on `VexConfig`) — a fully-generic config type would be
 * unassignable to any common supertype, because permission callbacks are
 * contravariant in their `data` parameter.
 *
 * @typeParam TSubjects - Phantom {@link SubjectMap} carried for `hasPermission` inference.
 */
export interface VexAccessConfig<
  TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>,
  TResources extends readonly AccessResource[] = readonly AccessResource[],
  TUserSlug extends CollectionSlug = CollectionSlug,
  // Defaults to the FULL union, not `undefined`. `VexConfig.access` and every helper that
  // accepts an already-resolved config name this type bare, so its defaults define the wide
  // supertype every concrete config must satisfy. `orgCollectionSlug?: TOrgSlug` puts the
  // parameter in the body, so a default of `undefined` made `orgCollectionSlug?: "orgs"`
  // unassignable — an org-configured project could not pass its own config to `hasPermission`.
  TOrgSlug extends CollectionSlug | undefined = CollectionSlug | undefined,
  // Defaults to the FULL bound, not `{}`. Like `TOrgSlug` above: `customActions?` puts
  // this parameter in the interface body, so the bare `VexAccessConfig` every helper
  // names is only a supertype of concrete configs if the default covers them all.
  TCustomActions extends Partial<
    Record<TResources[number]["slug"] | TUserSlug | Extract<TOrgSlug, string>, CustomActionsInput>
  > = Partial<
    Record<TResources[number]["slug"] | TUserSlug | Extract<TOrgSlug, string>, CustomActionsInput>
  >,
> {
  /** Default: `true`. Turn access control on or off. */
  enabled: boolean;

  /**
   * The allback role when there is no user.
   */
  anonRole?: string;

  /** Role names known to the system. */
  roles: readonly string[];

  /** Collections/globals contributing subjects, keyed by slug. */
  resources: TResources;

  /**
   * Custom actions per subject slug, as declared in `defineAccess`. Carried on the
   * RESOLVED config purely so request-time code can tell a declared verb from a typo:
   * an undeclared action resolves through `defaultPermissionMode` (default `allow`),
   * so without this record a misspelled `access.action` silently widens access.
   */
  customActions?: TCustomActions;

  /**
   * Posture for undeclared role/subject/action combinations. Always
   * {@link PERMISSION_MODES.deny} — `defineAccess` pins it and no input field sets it.
   *
   * Retained as a field rather than inlined because `hasPermission` and
   * `resolveAccessRule` branch on it, and an allow posture is expressible as a
   * role-level `"*": true` if it is ever wanted back — per-role and greppable,
   * which a global default never was.
   *
   * @internal
   */
  defaultPermissionMode: PermissionMode;

  /** Slug of the user collection. */
  userCollectionSlug: TUserSlug;

  /** Field on the user document holding role(s) (`string | string[]`). */
  userRolesField: string;

  /** Slug of the organization collection, when configured. */
  orgCollectionSlug?: TOrgSlug;

  /**
   * The permission matrix as authored (checks may be booleans, field-mode
   * objects, or callbacks). Type-erased for storage; `defineAccess` fully
   * type-checks it at authoring time.
   */
  permissions: Record<string, Record<string, unknown>>;

  /**
   * Phantom field carrying {@link SubjectMap} for inference. Optional and
   * never assigned at runtime.
   */
  readonly __subjects?: TSubjects;
}

/**
 * Thrown by `hasPermission` when `throwOnDenied: true` and access is denied.
 * Carries the subject and action.
 */
export class VexAccessError extends ConvexError<{
  code: "ACCESS_DENIED";
  resource: string;
  action: string;
  message: string;
}> {
  /** The subject on which access was denied. */
  resource: string;

  /** The denied action. */
  action: string;

  /**
   * @param options — Structured denial context.
   * @param options.message — Human-readable error message.
   * @param options.resource — Subject name.
   * @param options.action — Action name.
   */
  constructor(options: { message?: string; resource: string; action: string }) {
    // `ConvexError.data` MUST be a valid Convex value: `convexToJson` REJECTS
    // `undefined`, and an unserializable payload means Convex cannot deliver the
    // error at all — the client subscription never receives a result and the
    // query hangs in `fetchStatus: "fetching"` forever. Every key here is always
    // present; if an OPTIONAL key is ever added, omit it when absent — never pass
    // `undefined`. `message` travels in `data` because `ConvexError` owns
    // `this.message` (it stringifies `data`).
    super({
      code: "ACCESS_DENIED",
      resource: options.resource,
      action: options.action,
      message: options.message ?? `Access Denied: ${options.resource}/${options.action}`,
    });
    this.name = "VexAccessError";
    this.resource = options.resource;
    this.action = options.action;
  }
}

/**
 * Thrown by `defineAccess` on hard configuration errors (custom resource key
 * colliding with a resource slug; empty `actions` array).
 */
export class VexAccessConfigError extends Error {
  /** @param message — Human-readable description of the configuration error. */
  constructor(message: string) {
    super(message);
    this.name = "VexAccessConfigError";
  }
}
