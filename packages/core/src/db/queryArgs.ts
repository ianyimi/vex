import type { GenericDocument } from "convex/server";

import {
  QUERY_FILTER_CONSTRAINT_COMPARATORS,
  queryConstraintsToConvexIndexRange,
  queryFilterTreeToConvexFilter,
  queryFilterTreeToWhereNode,
  whereNodeToQueryFilterTree,
} from "../access/compileQueryConstraints";
import type {
  ConstraintBuilder,
  ConstraintResult,
  FilterConstraintBuilder,
  FilterOp,
  QueryFilterConstraint,
  VexWhereNodeOf,
} from "../access/queryConstraintTypes";
import type { ConvexQueryFilterFn, ConvexQueryIndex } from "../access/convexTypes";
import { createQueryFilterConstraintBuilder } from "../access/createQueryFilterConstraintBuilder";
import { createQueryIndexConstraintBuilder, readQueryIndexConstraints } from "../access/createQueryIndexConstraintBuilder";
import type { AccessDocFor } from "../access/types";
import type { IndexFieldsBySlug } from "../types/generated";
import { VexError } from "../errors";
import { getDataFields, ADMIN_FIELDS, type AdminField } from "../fields";
import { VERSION_SYSTEM_FIELDS } from "../versions/constants";

/**
 * Every index a caller may name for collection `S`, as name → field tuple: the
 * indexes `vex generate` emitted (`IndexFieldsBySlug`), plus the built-in
 * `by_creation_time`, which every table has and generation does not list.
 *
 * Before `vex generate` has run, widens to any name with any field tuple —
 * the same fallback `IndexNameFor` uses.
 *
 * @typeParam S - Collection slug.
 */
export type QueryIndexFieldsFor<S extends string> = (S extends keyof IndexFieldsBySlug
  ? IndexFieldsBySlug[S]
  : Record<string, readonly string[]>) & { by_creation_time: readonly ["_creationTime"] };

/**
 * The `withIndex` argument of `find`: an index declared on `S` and an optional
 * range over its fields, in declaration order.
 *
 * The range is written with Vex's index builder rather than the database's
 * own, so the call `range: (q) => q.eq("slug", slug)` reads the same on every
 * backend. On Convex it compiles to `.withIndex(name, range)`.
 *
 * @typeParam S - Collection slug.
 *
 * @example
 * ```ts
 * find({ ctx, collection: "posts", withIndex: { name: "by_slug", range: (q) => q.eq("slug", slug) } })
 * find({ ctx, collection: "posts", withIndex: { name: "by_creation_time" }, order: "desc" })
 * ```
 */
export type VexWithIndex<S extends string> = {
  [N in keyof QueryIndexFieldsFor<S> & string]: {
    /** Index to query. */
    name: N;
    /** Range over the index's fields; omit to read the whole index in order. */
    range?: (
      q: ConstraintBuilder<Extract<QueryIndexFieldsFor<S>[N], readonly string[]>, AccessDocFor<S>, 0>,
    ) => ConstraintResult;
  };
}[keyof QueryIndexFieldsFor<S> & string];

/**
 * One node of the `where` argument's plain, JSON-serializable form — a
 * documented alias of the tree `FilterConstraintBuilder` records
 * (`QueryFilterConstraint`, `access/queryConstraintTypes.ts`), with friendlier
 * keys (`and` / `or` / `not` in place of `kind: "and"` / `"or"` / `"not"`) so
 * a stored or transmitted filter reads like the query it describes.
 *
 * Every leaf `value` is exactly what the field itself stores: a Convex
 * `Id<...>` is already a string, and a `date` field is already a Unix-ms
 * `number` (`fields/date/types.ts`) — neither needs extra wire encoding.
 *
 * @typeParam S - Collection slug.
 *
 * @example
 * ```ts
 * const node: VexWhereNode<"posts"> = {
 *   and: [
 *     { field: "published", op: "eq", value: true },
 *     { not: { field: "slug", op: "eq", value: "draft" } },
 *   ],
 * };
 * ```
 */
export type VexWhereNode<S extends string> = VexWhereNodeOf<AccessDocFor<S>>;

/**
 * The `where` argument of `find` and `search`: a predicate over `S`'s
 * fields, as EITHER a builder callback or its plain {@link VexWhereNode}
 * equivalent. Both compile to the same filter (`whereToConvexQueryFilter`); the plain
 * form exists for a filter that must be saved or cross the network — a
 * builder callback cannot.
 *
 * The callback form is the same one an access rule's `q.where(...)`
 * receives. On Convex both compile to `.filter(...)`, which scans the
 * narrowed range — prefer `withIndex` for anything an index can express.
 *
 * @typeParam S - Collection slug.
 *
 * @example
 * ```ts
 * find({ ctx, collection: "posts", where: (q) => q.and(q.eq("featured", true), q.neq("slug", "hidden")) })
 * find({ ctx, collection: "posts", where: { and: [{ field: "featured", op: "eq", value: true }, { field: "slug", op: "neq", value: "hidden" }] } })
 * ```
 */
export type VexWhere<S extends string> =
  | ((q: FilterConstraintBuilder<AccessDocFor<S>>) => ConstraintResult)
  | VexWhereNode<S>;

/**
 * Compiles a caller's `withIndex` argument to the `ConvexQueryIndex` shape
 * `pickConvexQueryIndex` arbitrates.
 *
 * @param props - Input props.
 * @param props.withIndex - The caller's argument, already type-checked against
 *   the collection at the call site; `undefined` when the caller named no index.
 * @returns `undefined` for no index; `{ name }` for an ordering-only index;
 *   `{ name, range }` with the range compiled to a Convex `ConvexQueryIndexRangeFn`.
 */
export function withIndexToConvexQueryIndex(props: {
  withIndex: { name: string; range?: (q: never) => ConstraintResult } | undefined;
}): ConvexQueryIndex | undefined {
  const { withIndex } = props;
  if (withIndex === undefined) return undefined;
  if (withIndex.range === undefined) return { name: withIndex.name };
  // The builder's field tuple is a compile-time device; at runtime every node carries all
  // five operators, so the erased builder is the right argument for any index.
  const built = withIndex.range(createQueryIndexConstraintBuilder<readonly string[], GenericDocument>() as never);
  // Empty when the callback returned the untouched builder: an unrestricted range, which
  // `queryConstraintsToConvexIndexRange` compiles to "no restriction".
  const constraints = readQueryIndexConstraints<GenericDocument>(built);
  return { name: withIndex.name, range: queryConstraintsToConvexIndexRange({ constraints }) };
}

/**
 * Compiles a caller's `where` argument — a builder callback or a plain
 * {@link VexWhereNode} — to an `ConvexQueryFilterFn` the query can apply inside
 * `.filter(...)`. Both forms compile through the same recorded tree, so a
 * saved {@link VexWhereNode} and the builder call `whereToNode` made it from
 * behave identically.
 *
 * @param props - Input props.
 * @param props.where - The caller's predicate; `undefined` when absent.
 * @param props.fields - The collection's known field names, for validating a
 *   plain node; passed through to {@link validateWhereNode}. Ignored when
 *   `where` is a callback (already checked at compile time).
 * @returns `undefined` for no predicate, else a thunk compiling the recorded
 *   tree against the query's own `FilterBuilder`.
 */
export function whereToConvexQueryFilter(props: {
  where: VexWhere<string> | undefined;
  fields?: readonly string[];
}): ConvexQueryFilterFn | undefined {
  const { where } = props;
  if (where === undefined) return undefined;
  // Both forms end as the same recorded tree, built once and eagerly.
  const node: QueryFilterConstraint<GenericDocument> =
    typeof where === "function"
      ? (where(createQueryFilterConstraintBuilder<GenericDocument>() as never) as unknown as QueryFilterConstraint<GenericDocument>)
      : whereNodeToQueryFilterTree(
          validateWhereNode({ node: where, fields: props.fields }) as VexWhereNodeOf<GenericDocument>,
        );
  return (q) => queryFilterTreeToConvexFilter({ node, q });
}

/**
 * Converts a `where` builder callback to its plain {@link VexWhereNode} form
 * — for saving a filter authored in code (a default list filter, a seeded
 * saved view) without hand-building the tree.
 *
 * @typeParam S - Collection slug the callback was written against.
 * @param where - A builder callback, the same one `find` / `search` accept.
 * @returns The equivalent plain node.
 */
export function whereToNode<S extends string>(
  where: (q: FilterConstraintBuilder<AccessDocFor<S>>) => ConstraintResult,
): VexWhereNode<S> {
  const tree = where(
    createQueryFilterConstraintBuilder<AccessDocFor<S>>(),
  ) as unknown as QueryFilterConstraint<AccessDocFor<S>>;
  return queryFilterTreeToWhereNode(tree);
}

/** Maximum nodes in one `where` tree, counted across the whole tree. */
export const WHERE_NODE_LIMIT = 64;
/** Maximum nesting depth of one `where` tree; a lone leaf is depth 1. */
export const WHERE_DEPTH_LIMIT = 8;

/**
 * Throws the one error shape every `validateWhereNode` failure uses.
 *
 * @param path - Where in the tree the problem is, e.g. `where.and[1].op`.
 * @param problem - What is wrong there.
 * @throws {VexError} Always, with `code: "INVALID_WHERE"`.
 */
function invalidWhere(path: string, problem: string): never {
  throw new VexError({ code: "INVALID_WHERE", path, message: `Invalid where at ${path}: ${problem}.` });
}

/**
 * Validates and normalises an untrusted `where` payload (a saved view row, a
 * URL query param, an MCP tool argument) into a {@link VexWhereNode}.
 * Runtime, not compile-time: a stored filter can go stale — a renamed
 * field, a dropped index, a schema change — in a way `VexWhereNode<S>`'s
 * compile-time field typing never catches for data that was not just typed
 * in an editor.
 *
 * @typeParam S - Collection slug to type the result against; the caller's
 *   responsibility to pick correctly, the same contract as `JSON.parse<T>()`.
 * @param props - Input props.
 * @param props.node - The untrusted value, typically freshly `JSON.parse`d.
 * @param props.fields - The collection's known field names. Omitted
 *   pre-`vex generate` or when the caller has no config handy — field names
 *   then go unchecked, the same fallback {@link ConstraintField} uses, and
 *   only shape and operators are validated.
 * @returns The same tree, narrowed to {@link VexWhereNode}.
 * @throws {VexError} `code: "INVALID_WHERE"` — `node` is not an object; an
 *   `and` / `or` whose value is not a non-empty array; a leaf missing `field` / `op` /
 *   `value`; an `op` outside {@link FilterOp} (checked against
 *   `QUERY_FILTER_CONSTRAINT_COMPARATORS`'s keys, the runtime source of truth); or, when
 *   `fields` is given, a `field` not in it.
 */
export function validateWhereNode<S extends string = string>(props: {
  node: unknown;
  fields?: readonly string[];
}): VexWhereNode<S> {
  const knownFields = props.fields === undefined ? undefined : new Set(props.fields);
  let nodeCount = 0;

  /**
   * Validates one node and its subtree.
   *
   * @param node - The untrusted node.
   * @param path - Its location, for error messages.
   * @param depth - Its depth; the root is 1.
   * @returns The validated node, rebuilt so no unvalidated key survives.
   */
  function visit(node: unknown, path: string, depth: number): VexWhereNodeOf<GenericDocument> {
    nodeCount += 1;
    if (nodeCount > WHERE_NODE_LIMIT) invalidWhere(path, `more than ${WHERE_NODE_LIMIT} nodes`);
    if (depth > WHERE_DEPTH_LIMIT) invalidWhere(path, `nested deeper than ${WHERE_DEPTH_LIMIT} levels`);
    if (typeof node !== "object" || node === null || Array.isArray(node)) invalidWhere(path, "expected an object");

    const record = node as Record<string, unknown>;
    const keys = Object.keys(record);
    for (const combinator of ["and", "or"] as const) {
      if (!(combinator in record)) continue;
      if (keys.length !== 1) invalidWhere(path, `"${combinator}" must be the node's only key`);
      const children = record[combinator];
      if (!Array.isArray(children)) invalidWhere(`${path}.${combinator}`, "expected an array");
      // An empty `or` matches nothing and an empty `and` matches everything —
      // both are degenerate payloads (a stale saved view, a hand-built URL),
      // rejected like every other malformed shape rather than silently honoured.
      if (children.length === 0) invalidWhere(`${path}.${combinator}`, "expected a non-empty array");
      const validated = (children as unknown[]).map((child, i) => visit(child, `${path}.${combinator}[${i}]`, depth + 1));
      return combinator === "and" ? { and: validated } : { or: validated };
    }
    if ("not" in record) {
      if (keys.length !== 1) invalidWhere(path, `"not" must be the node's only key`);
      return { not: visit(record.not, `${path}.not`, depth + 1) };
    }

    const hasValueKey = "value" in record;
    // A leaf's `value` key can be ABSENT on the wire, not merely `undefined`:
    // Convex's own argument serialization (`convexToJson`) drops an explicit
    // `value: undefined` property entirely before the server ever sees it
    // (confirmed against `convex/values`), the same way `JSON.stringify`
    // drops `undefined` properties. This is exactly the
    // `isEmpty`/`isNotEmpty` compiled form (`{ op: "eq" | "neq", value:
    // undefined }`), so a 2-key `{ field, op }` leaf is accepted here and
    // treated identically to an explicit `value: undefined` — never a
    // third, unrecognized key.
    if (
      (keys.length !== 3 && keys.length !== 2) ||
      !("field" in record) ||
      !("op" in record) ||
      (keys.length === 3 && !hasValueKey)
    ) {
      invalidWhere(path, "expected { field, op, value } or a single and / or / not key");
    }
    const { field, op } = record;
    const value = hasValueKey ? record.value : undefined;
    if (typeof field !== "string") invalidWhere(`${path}.field`, "expected a string");
    if (knownFields !== undefined && !knownFields.has(field as string)) {
      invalidWhere(`${path}.field`, `unknown field "${field as string}"`);
    }
    if (typeof op !== "string" || !Object.prototype.hasOwnProperty.call(QUERY_FILTER_CONSTRAINT_COMPARATORS, op)) {
      invalidWhere(`${path}.op`, `unknown operator "${String(op)}"`);
    }
    return { field: field as string, op: op as FilterOp, value } as VexWhereNodeOf<GenericDocument>;
  }

  return visit(props.node, "where", 1) as VexWhereNode<S>;
}

/**
 * The field names a `where` node may reference on one collection: its data
 * fields as {@link getDataFields} flattens them, plus the system fields `_id` and
 * `_creationTime`. Layout fields store nothing, so a `row()` / `collapsible()` /
 * unnamed-tab child is listed under its own key, a named tab under the tab's
 * `name`, and the layout keys themselves and `ui()` entries are absent. Looks
 * through both `collections` and `mediaCollections`. `vex_`-prefixed versioning
 * fields are deliberately excluded — drafts are selected with the `drafts`
 * argument — with ONE exception: `vex_status` on a collection with
 * `versions.drafts: true` is additionally allowed, because the
 * filter builder offers it as a built-in `vex_status` filter field (values
 * from `VERSION_STATUSES`) and `find`/`search` must accept a `where`
 * referencing it. A non-versioned collection still rejects it.
 *
 * @param props - Input props.
 * @param props.config - The resolved config; `undefined` when the caller has none.
 * @param props.collection - The collection slug being queried.
 * @returns The allowed names, or `undefined` when the collection or config is
 *   unknown (field names then go unchecked, `validateWhereNode`'s documented fallback).
 */
export function whereFieldNames(props: {
  config:
    | {
        collections: readonly {
          slug: string;
          fields: Record<string, AdminField>;
          versions?: { drafts: boolean };
        }[];
        mediaCollections?: readonly {
          slug: string;
          fields: Record<string, AdminField>;
          versions?: { drafts: boolean };
        }[];
      }
    | undefined;
  collection: string;
}): readonly string[] | undefined {
  const all = [...(props.config?.collections ?? []), ...(props.config?.mediaCollections ?? [])];
  const match = all.find((c) => c.slug === props.collection);
  if (!match) return undefined;
  const names = [...Object.keys(getDataFields({ fields: match.fields })), "_id", "_creationTime"];
  if (match.versions?.drafts) {
    names.push(VERSION_SYSTEM_FIELDS.status.slug);
  }
  return names;
}

/**
 * Every field name a `where` references, in either form. `find` / `search`
 * call it after `whereToConvexQueryFilter` has validated a plain node.
 *
 * @param props - Input props.
 * @param props.where - A builder callback or a validated plain node.
 * @returns Unique field names, in first-seen order.
 */
export function referencedWhereFields(props: { where: VexWhere<string> }): string[] {
  const root = typeof props.where === "function" ? whereToNode<string>(props.where) : props.where;
  const names = new Set<string>();
  const visit = (node: VexWhereNode<string>): void => {
    if ("and" in node) node.and.forEach(visit);
    else if ("or" in node) node.or.forEach(visit);
    else if ("not" in node) visit(node.not);
    else names.add(node.field);
  };
  visit(root);
  return [...names];
}

/**
 * `and`s any number of optional filters into one, dropping the absent ones.
 *
 * @param props - Input props.
 * @param props.filters - Filters in application order; `undefined` entries are skipped.
 * @returns `undefined` when every entry is absent; the single filter unwrapped
 *   when only one is present; otherwise one filter `and`-ing them all.
 */
export function andConvexQueryFilters(props: { filters: readonly (ConvexQueryFilterFn | undefined)[] }): ConvexQueryFilterFn | undefined {
  const present = props.filters.filter((f): f is ConvexQueryFilterFn => f !== undefined);
  if (present.length === 0) return undefined;
  if (present.length === 1) return present[0];
  return (q) => q.and(...present.map((f) => f(q)));
}

/**
 * Converts every `commitTs`-typed field's leaf `value` inside a `VexWhereNode`
 * from a ms `number` (what the client sends) to a ns `bigint`
 * (what Convex's index-range builder needs to compare against the stored
 * value). Walks `and`/`or`/`not` recursively; non-`commitTs` leaves and
 * `isEmpty`/`isNotEmpty` leaves (no `value`) pass through unchanged.
 *
 * @param props - Input props.
 * @param props.where - The caller's `where`, or `undefined`.
 * @param props.fields - The collection's resolved field map.
 * @returns A new `VexWhereNode` with every `commitTs` leaf's value
 *   converted, or `props.where` unchanged if there is nothing to convert.
 * @throws {VexError} `code: "INVALID_WHERE"` — a `commitTs`-typed leaf's
 *   `value` is a `number` that is not a finite integer (`where` arrives on
 *   the wire as `v.any()`, so a float or `NaN`/`Infinity` ms value would
 *   otherwise crash `BigInt(...)` with an uncaught `RangeError`).
 */
export function convertCommitTsWhereToNs<S extends string = string>(props: {
  where: VexWhereNode<S> | undefined;
  fields: Record<string, AdminField>;
}): VexWhereNode<S> | undefined {
  if (props.where === undefined) return undefined;
  const commitTsFields = new Set(
    Object.entries(props.fields)
      .filter(([, field]) => field.type === ADMIN_FIELDS.commitTs.type)
      .map(([key]) => key),
  );
  function walk(node: VexWhereNode<S>): VexWhereNode<S> {
    if ("and" in node) return { and: node.and.map(walk) };
    if ("or" in node) return { or: node.or.map(walk) };
    if ("not" in node) return { not: walk(node.not) };
    if (commitTsFields.has(node.field as string) && typeof node.value === "number") {
      if (!Number.isFinite(node.value) || !Number.isInteger(node.value)) {
        throw new VexError({
          code: "INVALID_WHERE",
          path: `where.${String(node.field)}.value`,
          message: `Invalid where on commitTs field "${String(node.field)}": value must be a finite integer (ms since epoch), got ${node.value}.`,
        });
      }
      // `ConstraintValue<TDoc, F>` is inferred per-collection from `S`, so
      // TS cannot know a `commitTs` field's value type admits `bigint` here
      // — this generic walk only inspects `node.field`'s runtime type.
      return { ...node, value: BigInt(node.value) * BigInt(1_000_000) } as VexWhereNode<S>;
    }
    return node;
  }
  return walk(props.where);
}

/**
 * Whether `field` is one of the three types the Convex schema always stores
 * as `v.array(...)` regardless of the field's own `hasMany` (`select`,
 * `relationship`, `upload` — confirmed in each type's `validator.ts`:
 * `v.array(v.union(...))`, `v.array(v.id(...))`, `v.array(v.id(...))`
 * respectively, `hasMany` only ever toggling the admin UI's single- vs
 * multi-picker). A literal `type` comparison, not a `Set.has()` lookup, so
 * TypeScript narrows `field` to the union of those three resolved shapes —
 * each of which declares a real `hasMany: boolean` — inside the `if`.
 *
 * @param field - The resolved field config to classify.
 * @returns `true` for `select`, `relationship`, and `upload` fields.
 */
function isArrayStoredField(
  field: AdminField,
): field is Extract<AdminField, { type: "select" | "relationship" | "upload" }> {
  return field.type === ADMIN_FIELDS.select.type
    || field.type === ADMIN_FIELDS.relationship.type
    || field.type === ADMIN_FIELDS.upload.type;
}

/**
 * Normalizes a `where` tree's leaves against array-stored fields — `select`,
 * `relationship`, and `upload` (see {@link ARRAY_STORED_FIELD_TYPES}). A
 * filter leaf always compares ONE value regardless of the field's own
 * `hasMany`, while the stored document value is always an
 * array — so an unwrapped `eq`/`neq` leaf compares a bare scalar against an
 * array and NEVER matches (`valuesEqual`, which both the index-range and
 * `.filter()` compile targets key equality off, requires both sides to be
 * arrays once either side is one). This is the root cause of `?filter=
 * (status.eq.won)` returning zero rows against a seeded dataset with 12
 * `won` leads, and of `{ field: "contributorId", op: "neq", value: null }`
 * matching every row instead of excluding the empty ones, verified live
 * 2026-11-03.
 *
 * Walks `and`/`or`/`not` recursively and rewrites two leaf shapes on an
 * array-stored field:
 *
 * 1. A single-cardinality field (`hasMany: false`) with a concrete,
 *    non-null/non-undefined `eq`/`neq` value that is not already an array:
 *    wraps it in a one-element array (`eq "won"` → `eq ["won"]`) — the
 *    field can only ever hold that one element, so whole-array equality
 *    and single-value equality coincide. Still index-pushable: Convex
 *    compares an index range's `eq` and a `.filter()` expression's `eq`/
 *    `neq` by CONTENT for an array value exactly like `valuesEqual` does
 *    (confirmed against the real Convex runtime via `convex-test` —
 *    `normalizeArrayStoredWhere.test.ts`), so `resolveQueryIndex`'s
 *    pushdown (which reads the SAME `where` this function returns) still
 *    pushes the rewritten leaf into a declared index's range unchanged.
 *    `hasMany: true` fields are left untouched — a membership/"contains"
 *    test over a multi-value array has no sound `eq`/`neq` rewrite (an
 *    `eq` would require the WHOLE array to equal the one-element wrapper,
 *    matching only a single-element array, not "contains"); there is no
 *    general fix for that gap in this function.
 * 2. An empty check against ANY array-stored field, regardless of
 *    `hasMany` — either `isEmpty`/`isNotEmpty`'s wire form (`eq`/`neq`
 *    with `value: undefined`) or an explicit `value: null`
 *    leaf (the shape a saved view hand-writes for "no relation", e.g.
 *    `leads.ts`'s "From Contributors" preset's `{ op: "neq", value: null
 *    }`) — rewritten to match EITHER the properly-initialised empty array
 *    (`[]`, what every array-stored field actually stores once touched by
 *    the admin form) OR a legacy document that predates the field
 *    entirely (`undefined`, never written — both count as "no value" for
 *    this check). `eq` → `or(eq [], eq undefined)`; `neq` → `not(or(eq
 *    [], eq undefined))`. Neither shape is index-pushable (`or`/`not`
 *    were already excluded from pushdown before this function existed),
 *    so both stay in `.filter()`, same as before.
 *
 * @param props - Input props.
 * @param props.where - The caller's `where`, or `undefined`.
 * @param props.fields - The collection's resolved field map.
 * @returns A new `VexWhereNode` with every array-stored leaf rewritten, or
 *   `props.where` unchanged if there is nothing to rewrite.
 */
export function normalizeArrayStoredWhere<S extends string = string>(props: {
  where: VexWhereNode<S> | undefined;
  fields: Record<string, AdminField>;
}): VexWhereNode<S> | undefined {
  if (props.where === undefined) return undefined;
  const arrayFields = new Map<string, { hasMany: boolean }>();
  for (const [key, field] of Object.entries(props.fields)) {
    if (isArrayStoredField(field)) {
      arrayFields.set(key, { hasMany: field.hasMany });
    }
  }
  function walk(node: VexWhereNode<S>): VexWhereNode<S> {
    if ("and" in node) return { and: node.and.map(walk) };
    if ("or" in node) return { or: node.or.map(walk) };
    if ("not" in node) return { not: walk(node.not) };
    if (node.op !== "eq" && node.op !== "neq") return node;
    const arrayField = arrayFields.get(node.field as string);
    if (arrayField === undefined) return node;
    if (node.value === undefined || node.value === null) {
      // `ConstraintValue<TDoc, F>` is inferred per-collection from `S`, so TS
      // cannot know an array-stored field's value type admits `[]`/`undefined`
      // combinator nodes here — this generic walk only inspects `node.field`'s
      // runtime type, same cast pattern as `convertCommitTsWhereToNs` above.
      const isEmptyNode = {
        or: [
          { field: node.field, op: "eq", value: [] },
          { field: node.field, op: "eq", value: undefined },
        ],
      } as unknown as VexWhereNode<S>;
      return node.op === "eq" ? isEmptyNode : ({ not: isEmptyNode } as unknown as VexWhereNode<S>);
    }
    if (arrayField.hasMany || Array.isArray(node.value)) return node;
    return { ...node, value: [node.value] } as VexWhereNode<S>;
  }
  return walk(props.where);
}
