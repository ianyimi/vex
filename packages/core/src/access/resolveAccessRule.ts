import type { GenericDocument } from "convex/server";
import { PERMISSION_MODES, WILDCARD_KEY } from "./constants";
import { resolveActionCheck } from "./hasPermission";
import { evaluateQueryConstraint } from "./evaluateQueryConstraint";
import type { QueryConstraint } from "./evaluateQueryConstraint";
import { createUserReadSentinel } from "./userReadSentinel";
import {
  queryConstraintsToConvexFilter,
  queryConstraintsToConvexIndexRange,
  queryFilterTreeToConvexFilter,
} from "./compileQueryConstraints";
import type { ConvexQueryFilterFn, ConvexQueryIndex } from "./convexTypes";
import type { PermissionCheck, SubjectEntry, VexAccessConfig } from "./types";

/**
 * How one role's rule bears on whether a query may be narrowed.
 *
 * - `deny` — the role refuses this action, statically or by its `withIndex` /
 *   `where` callback returning `false`. It contributes nothing and is skipped.
 * - `unrestricted` — the role allows the action outright, statically or by its
 *   callback returning `true`. Narrowing would hide rows it permits, so nothing
 *   may be applied.
 * - `opaque` — the role allows conditionally through a bare callback (or, until
 *   Step 14, a field-mode object). Which rows it permits is unknowable before
 *   reading them, so again nothing may be applied.
 * - `conditional` — the role's `withIndex` / `where` ran and recorded something.
 *   The recording says which compile targets are available; it does NOT by
 *   itself mean an index was chosen.
 *
 * @internal
 */
type RoleContribution =
  | { kind: "deny" }
  | { kind: "unrestricted" }
  | { kind: "opaque" }
  | { kind: "conditional"; condition: QueryConstraint<GenericDocument> };

/**
 * True when a resolved check is the narrowing object form rather than a boolean,
 * a bare callback, or (until Step 14) a field-mode object.
 *
 * Distinguished by the presence of `withIndex` or `where`. Note this is the ONLY
 * thing a type predicate can settle here: whether the rule turns out to be
 * *indexed* is a RUNTIME outcome of invoking its callbacks, via
 * {@link evaluateQueryConstraint}. That is why classification below runs the
 * callbacks rather than inspecting the object further.
 *
 * @param check - The resolved check for one role + action.
 * @returns `true` when `check` carries `withIndex` or `where`.
 * @internal
 */
function isConstrainedCheck(
  check: PermissionCheck,
): check is Extract<PermissionCheck, { withIndex?: unknown; where?: unknown }> {
  return (
    typeof check === "object" && check !== null && ("withIndex" in check || "where" in check)
  );
}

/**
 * Classifies one role's rule for a resource + action, running its `withIndex` /
 * `where` callbacks when it has them.
 *
 * Mirrors `hasPermission`'s resolution order exactly — subject boolean shorthand,
 * then the explicit action key or action-level wildcard via
 * {@link resolveActionCheck}, then the role-level wildcard, then
 * `defaultPermissionMode` — so a role can never be read as permitting more here
 * than it does there.
 *
 * Recording requires EXECUTING the rule, which is why `user` and `organization`
 * are threaded in. `organization` is only passed when the config declares an org
 * collection, matching `hasPermission`.
 *
 * @param props - Input props.
 * @param props.access - Resolved access config.
 * @param props.role - The role being classified.
 * @param props.resource - Subject slug.
 * @param props.action - Action on that subject.
 * @param props.user - Caller, or `null` for anonymous.
 * @param props.organization - Active organization, when configured.
 * @returns How this role bears on narrowing.
 * @internal
 */
function classifyRole(props: {
  access: VexAccessConfig;
  role: string;
  resource: string;
  action: string;
  user: Record<string, unknown> | null;
  organization?: Record<string, unknown>;
}): RoleContribution {
  const defaultAllowed = props.access.defaultPermissionMode === PERMISSION_MODES.allow;
  const roleRules = props.access.permissions[props.role];
  const subject = roleRules?.[props.resource];

  let check: PermissionCheck;
  if (typeof subject === "boolean") {
    check = subject;
  } else if (subject !== null && subject !== undefined && typeof subject === "object") {
    check =
      resolveActionCheck({
        resource: subject as Record<string, unknown>,
        action: props.action,
      }) ?? defaultAllowed;
  } else {
    const roleWildcard = roleRules?.[WILDCARD_KEY];
    check = typeof roleWildcard === "boolean" ? roleWildcard : defaultAllowed;
  }

  if (check === false) return { kind: "deny" };
  if (check === true) return { kind: "unrestricted" };
  if (!isConstrainedCheck(check)) return { kind: "opaque" };

  // A rule keyed to the caller has nothing to scope to when there is no caller
  // (`resolveConstrainedCheck`'s sentinel comment has the full rationale) — the
  // same guard runs here so this query-shaping pass can never disagree with
  // `hasPermission`'s per-document pass about which rows a rule describes.
  const { user, wasRead: userWasRead } = createUserReadSentinel<Record<string, unknown>>(
    props.user,
  );
  const outcome = evaluateQueryConstraint({
    check,
    callerProps: {
      user,
      ...(props.access.orgCollectionSlug !== undefined
        ? { organization: props.organization }
        : {}),
    },
  });

  // The rule asked who the caller is and there is no answer — deny, matching
  // `hasPermission`'s per-document verdict for the same rule and caller.
  if (userWasRead()) return { kind: "deny" };

  // The callbacks may short-circuit to a flat allow/deny instead of returning a
  // condition — a rule reading `where: ({ user, q }) => user.isAdmin || q.eq(…)` is
  // the common case. Classifying on the OUTCOME is strictly more precise than
  // classifying on the declaration: a rule that resolves to `true` for this caller
  // is genuinely unrestricted, and one that resolves to `false` genuinely denies.
  if (outcome === true) return { kind: "unrestricted" };
  if (outcome === false) return { kind: "deny" };

  // An outcome this evaluator cannot read did not come from `withIndex` / `where`
  // — treat it as describing nothing rather than assuming it describes everything.
  if (outcome === undefined) return { kind: "opaque" };

  return { kind: "conditional", condition: outcome };
}

/**
 * Selects the single recording that safely narrows one query, or `undefined` when
 * no sound narrowing exists.
 *
 * Shared by {@link resolveQueryIndex} and {@link resolveQueryConstraint} — both
 * need the identical safety rule, and a divergence between them would be a silent
 * permission difference between `find`'s indexed path and its displaced/search
 * paths. Narrowing is only sound when exactly one contributing role records
 * anything and every other role either denies outright or is itself undescribable
 * (`unrestricted` or `opaque`).
 *
 * @param props - Input props.
 * @param props.access - Resolved, enabled access config.
 * @param props.user - Caller, or `null` for anonymous (resolves through `access.anonRole`).
 * @param props.organization - Active organization, when configured.
 * @param props.resource - Subject slug.
 * @param props.action - Query-shaped action.
 * @returns The one recording that safely narrows this query, or `undefined`.
 * @internal
 */
function selectSingleCondition(props: {
  access: VexAccessConfig;
  user: Record<string, unknown> | null;
  organization?: Record<string, unknown>;
  resource: string;
  action: string;
}): QueryConstraint<GenericDocument> | undefined {
  const { access } = props;

  const rawRoles = props.user ? props.user[access.userRolesField] : [];
  const userRoles =
    typeof rawRoles === "string"
      ? [rawRoles]
      : Array.isArray(rawRoles)
        ? rawRoles.filter((role): role is string => typeof role === "string")
        : [];
  const effectiveRoles =
    userRoles.length === 0 && access.anonRole !== undefined ? [access.anonRole] : userRoles;
  const knownRoles = effectiveRoles.filter((role) => access.roles.includes(role));

  // No recognized role ⇒ `hasPermission` denies outright. There is no result set to
  // narrow, so narrowing is moot.
  if (knownRoles.length === 0) return undefined;

  const candidates: QueryConstraint<GenericDocument>[] = [];
  for (const role of knownRoles) {
    const contribution = classifyRole({
      access,
      role,
      resource: props.resource,
      action: props.action,
      user: props.user,
      organization: props.organization,
    });
    if (contribution.kind === "deny") continue;
    // Either of these permits rows no constraint can describe.
    if (contribution.kind === "unrestricted" || contribution.kind === "opaque") return undefined;
    candidates.push(contribution.condition);
  }

  // Zero ⇒ every role denied; nothing to narrow. More than one ⇒ the caller's
  // permitted set is a union, and neither candidate alone is correct.
  if (candidates.length !== 1) return undefined;
  return candidates[0];
}

/**
 * Resolves the index an access rule contributes to a query, if any.
 *
 * Called once per query, before the Convex query is built. Answers a query-scoped
 * question ("which index narrows this query?") rather than the document-scoped one
 * `hasPermission` answers ("may they read this row?").
 *
 * **Never authorizes.** The per-document `hasPermission` pass still runs, so a
 * missing or broader-than-necessary index can only cost reads — it can never admit
 * a row a role does not permit. Failing to find an index is always safe; wrongly
 * applying one is not, which is why every ambiguous case resolves to `undefined`
 * (scan) rather than to a guess.
 *
 * Returns `undefined` when the single contributing rule used the FLAT algebra
 * rather than declaring `withIndex`: there is a describable constraint, but no
 * index to push it into. {@link resolveQueryConstraint} is the export that can
 * still use it.
 *
 * @param props - Input props.
 * @param props.access - Resolved access config; absent or `enabled: false` ⇒ no index.
 * @param props.user - Caller, or `null` for anonymous (resolves through `access.anonRole`).
 * @param props.organization - Active organization, forwarded to the rule's callback.
 * @param props.resource - Subject slug (a collection or global slug).
 * @param props.action - Query-shaped action (`"read"` | `"readDrafts"`).
 * @returns The index to apply, or `undefined` to scan unnarrowed.
 *
 * @typeParam TSubjects - Resolved `SubjectMap`, inferred from `access`. Generic for
 *   the same reason `HasPermissionProps` is: a concrete `SubjectMap<…>`
 *   instantiation is not assignable to the erased
 *   `VexAccessConfig<Record<string, SubjectEntry>>` default, because callback
 *   contravariance makes instantiations mutually unassignable (P-002). Pinning the
 *   default would reject every real `defineAccess()` result.
 *
 * @example
 * ```ts
 * const index = resolveQueryIndex({
 *   access, user, resource: "pages", action: CRUD_ACTIONS.read,
 * });
 * // → { name: "by_author", range: (q) => q.eq("authorId", "u1") }
 * ```
 */
export function resolveQueryIndex<
  TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>,
>(props: {
  access?: VexAccessConfig<TSubjects>;
  user: Record<string, unknown> | null;
  organization?: Record<string, unknown>;
  resource: string;
  action: string;
}): ConvexQueryIndex | undefined {
  const access = props.access as VexAccessConfig | undefined;
  if (!access || !access.enabled) return undefined;

  const condition = selectSingleCondition({
    access,
    user: props.user,
    organization: props.organization,
    resource: props.resource,
    action: props.action,
  });

  if (condition?.index === undefined) return undefined;

  return {
    name: condition.index.name,
    range: queryConstraintsToConvexIndexRange({ constraints: condition.index.constraints }),
  };
}

/**
 * Resolves an access rule to a `.filter()` expression, if any.
 *
 * The sibling of {@link resolveQueryIndex}, for query shapes with no `withIndex`
 * slot to claim (`search`) or where the caller's own index already claimed it
 * (`find`'s displaced branch). Both share {@link selectSingleCondition}, so they
 * cannot disagree about which rule applies.
 *
 * Succeeds for BOTH halves of a condition. An indexed rule's positional
 * constraints compile to a filter expression just as well as they do to a range —
 * the whole point of recording data rather than a callback — and a flat rule's tree
 * compiles here too. When a condition carries both, they are `and`-ed.
 *
 * @param props - Input props.
 * @param props.access - Resolved access config; absent or `enabled: false` ⇒ no filter.
 * @param props.user - Caller, or `null` for anonymous (resolves through `access.anonRole`).
 * @param props.organization - Active organization, forwarded to the rule's callback.
 * @param props.resource - Subject slug.
 * @param props.action - Query-shaped action.
 * @param props.indexAlreadyApplied - Set when the caller already pushed this rule's
 *   index range down via `.withIndex(name, range)`. The range is then omitted here,
 *   leaving only the `filter` half — applying it twice would be redundant work on
 *   every row. Leave unset (`find`'s displaced branch, `search`, `get`) to get the
 *   whole condition as one expression.
 * @returns A thunk taking the query's own `FilterBuilder`, or `undefined` when
 *   nothing is left to exclude.
 */
export function resolveQueryConstraint<
  TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>,
>(props: {
  access?: VexAccessConfig<TSubjects>;
  user: Record<string, unknown> | null;
  organization?: Record<string, unknown>;
  resource: string;
  action: string;
  indexAlreadyApplied?: boolean;
}): ConvexQueryFilterFn | undefined {
  const access = props.access as VexAccessConfig | undefined;
  if (!access || !access.enabled) return undefined;

  const condition = selectSingleCondition({
    access,
    user: props.user,
    organization: props.organization,
    resource: props.resource,
    action: props.action,
  });
  if (condition === undefined) return undefined;

  const { index, where } = condition;

  // Two reasons to omit the index half: an index with no constraints is an
  // ordering-only opt-in and excludes nothing, and a caller that already pushed the
  // range down through `.withIndex` would otherwise re-check it per row.
  const indexConstrains =
    props.indexAlreadyApplied !== true && index !== undefined && index.constraints.length > 0;

  // BOTH branches may be populated, and that is not a conflict — it is
  // `.withIndex(name, range).filter(expr)`, which is Convex's own shape. Compiling
  // only one would silently discard half the rule, so when both are present they are
  // `and`-ed into a single expression.
  if (indexConstrains && where !== undefined) {
    return (q) =>
      q.and(
        queryConstraintsToConvexFilter({ constraints: index.constraints, q }),
        queryFilterTreeToConvexFilter({ node: where, q }),
      );
  }
  if (indexConstrains) {
    return (q) => queryConstraintsToConvexFilter({ constraints: index.constraints, q });
  }
  if (where !== undefined) {
    return (q) => queryFilterTreeToConvexFilter({ node: where, q });
  }
  // Recorded nothing that excludes rows.
  return undefined;
}
