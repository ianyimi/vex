import type { GenericDocument } from "convex/server";

import type {
  ConstraintResult,
  QueryFilterConstraint,
  QueryIndexConstraint,
  VexWhereNodeOf,
} from "./queryConstraintTypes";
import { whereNodeToQueryFilterTree } from "./compileQueryConstraints";
import { validateWhereNode } from "../api/queryArgs";
import { createQueryFilterConstraintBuilder } from "./createQueryFilterConstraintBuilder";
import {
  createQueryIndexConstraintBuilder,
  readQueryIndexConstraints,
} from "./createQueryIndexConstraintBuilder";

/**
 * One rule's resolved constraint for one caller. `compileQueryConstraints.ts`,
 * `resolveAccessRule.ts` and `hasPermission.ts` consume it.
 *
 * @typeParam TDoc - Document shape the recorded values are typed against.
 */
export interface QueryConstraint<TDoc> {
  /** The index half, when the rule's `withIndex` produced a selection. */
  index?: { name: string; constraints: readonly QueryIndexConstraint<string, TDoc>[] };
  /** The predicate half, when the rule's `where` produced a predicate. */
  where?: QueryFilterConstraint<TDoc>;
}

/**
 * What a constrained rule resolves to for one caller.
 *
 * - `true` / `false` — the rule short-circuited (every present half returned `true`,
 *   or one returned `false`).
 * - a {@link QueryConstraint} — at least one half narrows.
 * - `undefined` — a half produced something not built through its builder
 *   (a hand-made object, `undefined`, a number). Callers fail safe (deny) at
 *   request time and fail loud at config time.
 */
export type QueryConstraintOutcome = boolean | QueryConstraint<GenericDocument> | undefined;
/** The `kind` tags `createQueryFilterConstraintBuilder` produces. */
const FILTER_CONSTRAINT_KINDS: Record<string, true> = {
  compare: true,
  and: true,
  or: true,
  not: true,
};

/**
 * True when `value` is a tree `createQueryFilterConstraintBuilder` produced. Checks the
 * root's `kind` only: the builder is the sole producer, and the nominal
 * `ConstraintResult` stops a typed rule from returning anything else.
 *
 * @param value - What a `where` callback returned.
 * @returns Whether it is a recorded filter tree.
 */
function isQueryFilterConstraint(value: unknown): value is QueryFilterConstraint<GenericDocument> {
  if (typeof value !== "object" || value === null || !("kind" in value)) return false;
  if (typeof value.kind !== "string") return false;
  return FILTER_CONSTRAINT_KINDS[value.kind] === true;
}

/**
 * Records a `{ name, range }` selection by running its range against a fresh
 * index builder.
 *
 * @param value - The static selection, or what a `withIndex` callback returned.
 * @returns The recorded index half, or `undefined` when `value` is not a
 *   `{ name: string, range: function }` object.
 */
function recordIndexSelection(value: unknown): QueryConstraint<GenericDocument>["index"] | undefined {
  if (typeof value !== "object" || value === null || !("name" in value) || !("range" in value)) {
    return undefined;
  }
  const { name, range } = value;
  if (typeof name !== "string" || typeof range !== "function") return undefined;
  const built = (range as (ix: never) => ConstraintResult)(
    createQueryIndexConstraintBuilder<readonly string[], GenericDocument>() as never,
  );
  return { name, constraints: readQueryIndexConstraints<GenericDocument>(built) };
}

/**
 * Converts a rule's static `where` node to a recorded filter tree, or
 * `undefined` when the node is malformed.
 *
 * @param node - The rule's static `where` value.
 * @returns The recorded tree, or `undefined` for a malformed node.
 */
function staticWhereToQueryFilterTree(node: unknown): QueryFilterConstraint<GenericDocument> | undefined {
  try {
    return whereNodeToQueryFilterTree(validateWhereNode({ node }) as VexWhereNodeOf<GenericDocument>);
  } catch {
    return undefined;
  }
}

/**
 * Runs a constrained rule's `withIndex` and `where` for one caller and assembles
 * the result.
 *
 * @param props - Input props.
 * @param props.check - The rule object; at least one of `withIndex` / `where` is present.
 *   `withIndex` is the static `{ name, range }` or a callback returning one or a boolean;
 *   `where` is a plain where node, or a callback returning a predicate or a boolean. `filter`
 *   is ignored here — it is per-document, and `hasPermission` runs it.
 * @param props.callerProps - `{ user }` plus `{ organization }` when configured. Pass the
 *   user-read sentinel's proxy here, as the callers do today, so a rule keyed to an
 *   absent caller is detected.
 * @returns The rule's outcome for this caller.
 * @throws Whatever a callback throws — `validateAccessConfig` wraps it in a
 *   `VexAccessConfigError` naming the rule.
 */
export function evaluateQueryConstraint(props: {
  check: { withIndex?: unknown; where?: unknown };
  callerProps: Record<string, unknown>;
}): QueryConstraintOutcome {
  const { check, callerProps } = props;
  const hasIndex = check.withIndex !== undefined;
  const hasWhere = check.where !== undefined;

  // Both halves run before anything returns, so a throwing `where` still throws when
  // `withIndex` short-circuits to `true` (config-time validation depends on that).
  const indexResult =
    typeof check.withIndex === "function"
      ? (check.withIndex as (p: Record<string, unknown>) => unknown)(callerProps)
      : check.withIndex;
  // A static node is shape- and operator-checked here, not only by
  // `validateAccessConfig`: that runs from `defineConfig` and skips custom
  // resources, so a standalone `defineAccess()` result would otherwise reach the
  // compilers unchecked and crash on an unknown `op` instead of denying. A
  // malformed node is unreadable — denied at request time, a config error at
  // config time. Field names are not checked here; that needs the resource's fields.
  const whereResult =
    typeof check.where === "function"
      ? (check.where as (p: Record<string, unknown>) => unknown)({
          ...callerProps,
          q: createQueryFilterConstraintBuilder<GenericDocument>(),
        })
      : hasWhere
        ? staticWhereToQueryFilterTree(check.where)
        : undefined;

  if (indexResult === false || whereResult === false) return false;

  let index: QueryConstraint<GenericDocument>["index"];
  if (hasIndex && indexResult !== true) {
    // A missing `return` (`undefined`) is unreadable, not "no restriction".
    index = recordIndexSelection(indexResult);
    if (index === undefined) return undefined;
  }

  let where: QueryFilterConstraint<GenericDocument> | undefined;
  if (hasWhere && whereResult !== true) {
    if (!isQueryFilterConstraint(whereResult)) return undefined;
    where = whereResult;
  }

  if (index === undefined && where === undefined) return true;
  return { ...(index !== undefined ? { index } : {}), ...(where !== undefined ? { where } : {}) };
}
