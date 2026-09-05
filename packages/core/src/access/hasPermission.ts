import type { GenericDocument } from "convex/server";
import { PERMISSION_MODES, PERMISSION_SCOPES, PermissionScope, WILDCARD_KEY } from "./constants";
import { createAccessQueryBuilder, readAccessCondition } from "./createAccessQueryBuilder";
import { accessConstraintsToPredicate, accessFilterTreeToPredicate } from "./compileConstraints";
import { createUserReadSentinel } from "./userReadSentinel";
import { VexAccessError } from "./types";
import type {
  PermissionCallbackProps,
  PermissionCheck,
  SubjectEntry,
  VexAccessConfig,
} from "./types";

/**
 * Props required for the hasPermission({...}) function
 *
 * @param access - The resolved config from `defineAccess()`. `undefined`
 *   disables access control entirely — every check passes.
 * @param user - The authenticated user document. Roles are derived from
 *   `user[access.userRolesField]` (`string` or `string[]`); a missing or empty
 *   value falls back to access.anonRole
 * @param organization - The organization document forwarded to callbacks.
 *   Only surfaces when `access.orgCollectionSlug` is configured.
 * @param resource - Subject name — a resource slug, a built-in subject
 *   (e.g. `"adminPanel"`), or a custom resource name.
 * @param action - Action on `resource`, typed per subject.
 * @param data - Document/context forwarded to permission callbacks.
 * @param throwOnDenied - When `true`, throws `VexAccessError` instead of
 * @param scope Which question to answer when a role's check is a callback that
 * needs the document and `data` was not supplied:
 * `"all"` (default) asks "may they do this to every document" and resolves such
 * a check to `false` — fail-closed, never throws; `"any"` asks "may they do this
 * to at least one document" and resolves it to `true` (nav/sidebar/list gating —
 * row-level filtering happens separately in `find`/`get`); `"doc"` demands an
 * exact per-document answer and throws `VexAccessError` when `data` is missing,
 * which is what you want in edit views. Has no effect on static boolean checks,
 * and no effect when `data` is provided (the callback is always run against it).
 * @default "all"
 */
export interface HasPermissionProps<
  TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>,
  TSubject extends keyof TSubjects & string = keyof TSubjects & string,
  TData extends {} = {},
> {
  access?: VexAccessConfig<TSubjects>;
  user: Record<string, unknown> | null;
  organization?: Record<string, unknown>;
  resource: TSubject;
  action: TSubjects[TSubject]["action"];
  data?: TData;
  throwOnDenied?: boolean;
  scope?: PermissionScope;
}

/**
 * Resolves runtime role-based access for a single subject + action, merging
 * every role the user holds into one decision.
 *
 * This is the single runtime entry point — every server API guard, admin panel
 * gate, and custom-subject check calls it; the resolution helpers below are
 * module-private.
 *
 * Resolution, per role, first hit wins: subject boolean shorthand → explicit
 * action key → subject-level `WILDCARD_KEY` → role-level `WILDCARD_KEY`
 * (undeclared subjects only) → `defaultPermissionMode`. Roles then OR-merge:
 * any role allowing allows.
 *
 * @param props @see {@link HasPermissionProps}
 * @returns `true` when the action is permitted for the caller.
 * @throws {VexAccessError} When `throwOnDenied` is `true` and access is denied —
 *   carries `resource` and `action`.
 *
 * @example
 * ```ts
 * hasPermission({ access, user, resource: "posts", action: "update" }); // boolean
 * hasPermission({ access, user, resource: "posts", action: "delete",
 *   data: post, throwOnDenied: true }); // throws VexAccessError on deny
 * ```
 */
export function hasPermission<
  TSubjects extends Record<string, SubjectEntry>,
  TSubject extends keyof TSubjects & string,
  TData extends {},
>(props: HasPermissionProps<TSubjects, TSubject, TData>): boolean {
  const { access } = props;

  if (!access || access === undefined || !access.enabled) {
    return true;
  }

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

  const defaultAllowed = access.defaultPermissionMode === PERMISSION_MODES.allow;
  let allPermissions: boolean;

  if (knownRoles.length === 0) {
    allPermissions = false;
  } else {
    const resolved = knownRoles.map((userRole): boolean => {
      const role = access.permissions[userRole];
      const resource = role?.[props.resource];

      let check: PermissionCheck;
      if (typeof resource === "boolean") {
        // { posts: true }
        check = resource;
      } else if (resource !== null && resource !== undefined && typeof resource === "object") {
        // { posts: { "*": true, update: () => {}, delete: false } }
        check =
          resolveActionCheck({
            resource: resource as Record<string, unknown>,
            action: props.action,
          }) ?? defaultAllowed;
      } else {
        // { posts: undefined }
        const roleWildcard = role?.[WILDCARD_KEY];
        check = typeof roleWildcard === "boolean" ? roleWildcard : defaultAllowed;
      }

      return (
        resolvePermissionCheck({
          check,
          user: props.user,
          data: props.data,
          organization: access.orgCollectionSlug !== undefined ? props.organization : undefined,
          resource: props.resource,
          action: props.action,
          scope: props.scope ?? PERMISSION_SCOPES.all,
        }) ?? defaultAllowed
      );
    });

    // OR across roles: holding any role that permits the action is enough.
    allPermissions = resolved.some(Boolean);
  }

  if (allPermissions === false) {
    if (props.throwOnDenied) {
      throw new VexAccessError({
        resource: props.resource,
        action: props.action,
      });
    }
    return false;
  }
  return true;
}

const CAPABILITY_PROBE = Symbol("vex.capabilityProbe");

/**
 * True when a resolved check is the constraint object form.
 *
 * Presence of `constraints` is the discriminant. This matters here because the
 * early `typeof check !== "function"` return below treats every non-function as a
 * boolean or field-mode value — a constrained object has neither `mode` nor
 * `fields`, so it used to be mistaken for one.
 *
 * @param check - The resolved check for one role + action.
 * @returns `true` when `check` carries a `constraints` callback.
 * @internal
 */
function isConstrainedCheck(
  check: PermissionCheck,
): check is Extract<PermissionCheck, { constraints: unknown }> {
  return typeof check === "object" && check !== null && "constraints" in check;
}

/**
 * Evaluates a constraint-form check against one document.
 *
 * This is the second half of what makes constraints worth recording as data: the
 * SAME declaration that compiles to a `withIndex` range or a `.filter()` expression
 * on the server also interprets directly in JS here, which is what keeps
 * client-side `usePermission` working with no server round trip (P-004). A closure
 * could only ever do this half.
 *
 * `filter`, when present, is additive — the condition must hold AND the filter must
 * pass. It is resolved by recursing, so the existing boolean/callback/field-mode
 * handling owns it.
 *
 * @typeParam TData - Document type under test.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape.
 * @param props - Input props, as `resolvePermissionCheck` received them.
 * @param props.check - The constraint-form check.
 * @param props.user - Caller.
 * @param props.data - Document under test; absent means the quantified path.
 * @param props.organization - Active organization, when configured.
 * @param props.resource - Subject slug, for the error message.
 * @param props.action - Action name, for the error message.
 * @param props.scope - How to answer when `data` is absent.
 * @returns Whether this role permits the action on `props.data`.
 * @throws {VexAccessError} When no `data` was supplied under `scope: "doc"` — a
 *   constraint is a per-document condition, so there is nothing to answer without
 *   a document.
 * @internal
 */
function resolveConstrainedCheck<TData, TUser, TOrg>(props: {
  check: Extract<PermissionCheck, { constraints: unknown }>;
  user: TUser;
  data?: TData;
  organization?: TOrg;
  resource: string;
  action: string;
  scope: PermissionScope;
}): boolean {
  // An unauthenticated caller still reaches here, because `anonRole` resolves them
  // to a real role — and that role's rules may be constrained.
  // `createUserReadSentinel` tells apart a rule that scopes to the caller (must
  // deny with no caller) from one that ignores the caller (must keep working
  // unauthenticated) — see its docstring for why.
  const { user, wasRead: userWasRead } = createUserReadSentinel<TUser>(props.user);

  const outcome = props.check.constraints({
    user,
    q: createAccessQueryBuilder(),
    ...(props.organization !== undefined ? { organization: props.organization } : {}),
  } as unknown as Parameters<typeof props.check.constraints>[0]);

  // The rule asked who the caller is and there is no answer — deny, rather than
  // compile a condition built from `undefined`.
  if (userWasRead()) return false;

  // A rule may short-circuit to a flat allow/deny rather than building a condition.
  if (typeof outcome === "boolean") return outcome;

  if (props.data === undefined) {
    // A condition is inherently per-document — the same situation a data-reading
    // callback is in, so answer the same quantified question. See `PERMISSION_SCOPES`.
    if (props.scope === PERMISSION_SCOPES.any) return true;
    if (props.scope === PERMISSION_SCOPES.all) return false;
    throw new VexAccessError({
      resource: props.resource,
      action: props.action,
      message:
        `hasPermission: "${props.resource}.${props.action}" needs a "data" object (its check is a constraint). ` +
        `Pass "data" for an exact check, or use scope: "any" (nav/list gating) or scope: "all" (bulk actions).`,
    });
  }

  const condition = readAccessCondition<GenericDocument>(outcome);
  // A condition this module cannot read did not come from `q`. Deny rather than
  // widen: an unreadable condition must never resolve to unrestricted access.
  if (condition === undefined) return false;

  const doc = props.data as unknown as GenericDocument;
  const indexHolds =
    condition.index === undefined ||
    accessConstraintsToPredicate({ constraints: condition.index.constraints })(doc);
  const filterHolds =
    condition.filter === undefined || accessFilterTreeToPredicate({ node: condition.filter })(doc);
  if (!indexHolds || !filterHolds) return false;

  // `filter` augments the condition; it never replaces it.
  if (props.check.filter === undefined) return true;
  return resolvePermissionCheck<TData, TUser, TOrg>({
    ...props,
    check: props.check.filter as PermissionCheck,
  });
}

/**
 * Resolves one role's `PermissionCheck` into a concrete result: booleans and
 * mode objects pass through; callbacks are invoked with `{ user, data?,
 * organization? }`.
 *
 * Module-private. The caller resolves "not declared" to the configured
 * `defaultPermissionMode` BEFORE calling — `check` is always a real check
 * here. A callback returning `undefined` resolves to `false` (deny), so an
 * inconclusive callback can never be mistaken for an undeclared action.
 *
 * @throws VexAccessError when trying to call hasPermission without passing data
 * when a permission check requires the data to execture and determine the result
 * @returns The check's boolean or field-mode object; for callbacks, the
 *   callback's result with `undefined` normalized to `false`.
 */
function resolvePermissionCheck<TData, TUser, TOrg>(props: {
  check: PermissionCheck;
  user: TUser;
  data?: TData;
  organization?: TOrg;
  resource: string;
  action: string;
  scope: PermissionScope;
}): boolean {
  if (isConstrainedCheck(props.check)) {
    return resolveConstrainedCheck<TData, TUser, TOrg>({
      ...props,
      check: props.check,
    });
  }

  if (typeof props.check !== "function") {
    return props.check;
  }

  const callbackProps = {
    user: props.user,
    data: props.data !== undefined ? props.data : undefined,
    organization: props.organization !== undefined ? props.organization : undefined,
  } as PermissionCallbackProps;
  if (props.data !== undefined) {
    const result = props.check(callbackProps);
    return result === undefined ? false : result;
  }

  try {
    // no data → probe whether the callback DEPENDS on data (throws the sentinel on ANY access;
    // Proxy is truthy so `?.` doesn't short-circuit, unlike a bare `undefined`)
    const probe = new Proxy(
      {},
      {
        get() {
          throw { [CAPABILITY_PROBE]: true };
        },
        has() {
          throw { [CAPABILITY_PROBE]: true };
        },
        ownKeys() {
          throw { [CAPABILITY_PROBE]: true };
        },
      },
    );
    const result = props.check({ ...callbackProps, data: probe });
    return result === undefined ? false : result;
  } catch (e) {
    const touchedData =
      typeof e === "object" &&
      e !== null &&
      (e as Record<symbol, unknown>)[CAPABILITY_PROBE] === true;
    if (!touchedData) throw e; // a real error from the callback body — never swallow it
    // The callback needs the document and none was supplied — answer the
    // quantified question the caller asked for. See `PERMISSION_SCOPES`.
    if (props.scope === PERMISSION_SCOPES.any) {
      // "at least one document" — a per-doc condition may hold for some row.
      return true;
    }
    if (props.scope === PERMISSION_SCOPES.all) {
      // "every document" — a per-doc condition means it cannot hold for all.
      return false;
    }
    throw new VexAccessError({
      resource: props.resource,
      action: props.action,
      message:
        `hasPermission: "${props.resource}.${props.action}" needs a "data" object (its check reads the document). ` +
        `Pass "data" for an exact check, or use scope: "any" (nav/list gating) or scope: "all" (bulk actions).`,
    });
  }
}

/**
 * Resolves a single action's check from a per-action map, consulting the
 * action-level wildcard when the explicit action isn't declared.
 *
 * The wildcard precedence lives in exactly one place so `hasPermission`,
 * `resolveAccessIndex`, and any future evaluator (e.g. DB-backed roles) share
 * it. Presence, not truthiness, decides: an explicit `false` still wins over
 * the wildcard.
 *
 * @param props - Input props.
 * @param props.resource - The per-action map declared for one role + resource.
 * @param props.action - The action being resolved.
 * @returns The declared check for `action`, else the wildcard's check, else
 *   `undefined` (caller falls through to `defaultPermissionMode`).
 * @internal
 */
export function resolveActionCheck(props: {
  resource: Record<string, unknown>;
  action: string;
}): PermissionCheck | undefined {
  if (props.action in props.resource) {
    return props.resource[props.action] as PermissionCheck;
  }
  if (WILDCARD_KEY in props.resource) {
    return props.resource[WILDCARD_KEY] as PermissionCheck;
  }
  return undefined;
}
