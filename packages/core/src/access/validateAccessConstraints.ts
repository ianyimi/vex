import { type GenericDocument } from "convex/server";
import type { AccessConditionResult, AccessIndexConstraint } from "./constraintTypes";
import { AccessResource, VexAccessConfig, VexAccessConfigError } from "./types";
import { ADMIN_FIELDS } from "../fields";
import { createAccessQueryBuilder, readAccessCondition } from "./createAccessQueryBuilder";

/**
 * Declared Convex index name → field tuple for one resource, read the same
 * way `collectIndexNames` (`types/generateVexTypes.ts`) builds `.index()`
 * calls: one index per `field.index`, or an auto `by_<fieldKey>` for
 * relationship fields. Every declared index is single-field today; this
 * returns single-element tuples accordingly and stays correct if a
 * compound-index authoring mechanism lands later. @internal
 * @param resource @see {@link AccessResource} the collection / resource
 * @returns Record<string, readonly string[]> A record of indexes to fields
 */
function collectResourceIndexFields(resource: AccessResource): Record<string, readonly string[]> {
  const indexFields: Record<string, readonly string[]> = {};
  for (const [fieldKey, field] of Object.entries(resource.fields)) {
    if (field.index) {
      indexFields[field.index] = [fieldKey];
    } else if (field.type === ADMIN_FIELDS.relationship.type) {
      indexFields[`by_${fieldKey}`] = [fieldKey];
    }
  }
  return indexFields;
}

/**
 *
 * Validates all access config options during runtime for
 * any constraints that would result in invalid convex queries
 *
 * @param props VexAccessConfig @see {@link VexAccessConfig}
 *
 * @throws {VexAccessConfigError} When the named index is not declared, when the
 *   constraint fields are not an
 *   in-order prefix of a declared index, when an `eq` follows a bound, when
 *   a second lower bound appears, when anything follows an upper bound, or
 *   when a lower/upper bound pair targets different fields — naming the
 *   role, resource, action, and the 1-based position of the offending
 *   constraint.
 */
export function validateAccessConfig(props?: VexAccessConfig) {
  if (!props) return;
  const resourcesBySlug = new Map<string, AccessResource>(
    props.resources.map((resource) => [resource.slug, resource]),
  );
  for (const [role, subjects] of Object.entries(props.permissions)) {
    if (typeof subjects !== "object" || subjects === null) continue;
    for (const [resourceSlug, actions] of Object.entries(subjects as Record<string, unknown>)) {
      const resource = resourcesBySlug.get(resourceSlug);
      // Custom resources and admin subjects carry no declared indexes and
      // are skipped here — see `validateAccessConstraints`'s edge cases.
      if (resource === undefined || typeof actions !== "object" || actions === null) continue;
      for (const [action, check] of Object.entries(actions as Record<string, unknown>)) {
        // The action-level wildcard IS resolved here, unlike the role-level one
        // (boolean-only). Its `q` is an `AccessPredicateBuilder`, so it can never
        // name an index and `validateAccessConstraints` will have nothing to check —
        // but running the callback is still worth it, because that is what turns a
        // rule that throws into a `VexAccessConfigError` at module load rather than
        // at query time. Skipping it made the wildcard the one place a broken
        // constraint stayed hidden until a request hit it.
        if (typeof check !== "object" || check === null) continue;
        if (!("constraints" in check)) continue;
        let outcome: boolean | AccessConditionResult;
        try {
          outcome = (
            check as {
              constraints: (
                callbackProps: Record<string, unknown>,
              ) => boolean | AccessConditionResult;
            }
          ).constraints({
            user: {},
            organization: {},
            q: createAccessQueryBuilder(),
          });
        } catch (error) {
          // Resolving a rule means RUNNING its callback at module load, so a rule
          // that reached past its types — `as any`, a hand-built object, a method
          // the builder does not have — surfaces here as whatever it threw. Rethrow
          // as a config error so every `defineAccess` failure has one shape and
          // names the offending rule, instead of leaking a bare `TypeError` with no
          // indication of which role or action produced it.
          throw new VexAccessConfigError(
            `role "${role}" on ${resourceSlug}.${action}: the constraints callback threw ` +
              `while being resolved — ${error instanceof Error ? error.message : String(error)}. ` +
              `Constraints must be a pure chain on the supplied "q"; they run once at ` +
              `config time with no documents and no database access.`,
          );
        }
        // A rule that short-circuits to a flat allow/deny has no condition to check.
        if (typeof outcome === "boolean") continue;
        const condition = readAccessCondition<GenericDocument>(outcome);
        // Anything built through `q` is readable here. An unreadable value therefore
        // means the callback never touched the builder and returned something else —
        // a bare object, `undefined`, a number. Previously that fell through the
        // `condition?.index === undefined` guard below and was accepted as "excludes
        // nothing", which is the most dangerous possible default for an access rule:
        // the author believes they wrote a restriction and the config silently has
        // none. `resolveAccessRule` still fails SAFE for this shape at request time;
        // config time should fail LOUD.
        if (condition === undefined) {
          throw new VexAccessConfigError(
            `role "${role}" on ${resourceSlug}.${action}: the constraints callback did not ` +
              `return a constraint built from the supplied "q" (got ` +
              `${outcome === null ? "null" : typeof outcome}). Build a condition with ` +
              `q.withIndex(...) / q.filter(...), or return a boolean to allow or deny outright.`,
          );
        }
        // This validator enforces Convex's INDEX rules — the index name, field order
        // and operator sequencing — so it applies only when the rule chose an index. A
        // predicate compiles to `.filter()`, which imposes none of them.
        if (condition.index === undefined) continue;
        validateAccessConstraints({
          role,
          resource: resourceSlug,
          action,
          constraints: condition.index.constraints,
          indexFields: collectResourceIndexFields(resource),
          indexName: condition.index.name,
        });
      }
    }
  }
}

/**
 * Validates one rule's recorded constraint list against its resource's
 * declared Convex indexes. Called once per constraints-bearing rule from
 * `defineAccess`, so a malformed rule fails at module load.
 *
 * @param props - Input props.
 * @param props.role - Role name the rule belongs to (for the error message).
 * @param props.resource - Resource slug the rule guards (for the error message).
 * @param props.action - Action name the rule guards (for the error message).
 * @param props.constraints - The rule's recorded constraint list, already
 *   produced by invoking its `constraints` callback with a fresh builder.
 * @param props.indexFields - The resource's declared indexes, index name →
 *   field tuple in declaration order. The caller derives this from real
 *   Convex index declarations (`defineAccess` reads it off `field.index` /
 *   relationship auto-index the same way `collectIndexNames`,
 *   `types/generateVexTypes.ts`, builds `.index()` calls) — every declared
 *   index is single-field today, but this validator is written generically
 *   and stays correct if compound indexes are ever declarable.
 * @returns Nothing; throws on violation.
 * @param props.indexName - The index the rule actually named, when known. Given, it
 *   must be declared by the resource and is the only tuple the fields may prefix.
 * @throws {VexAccessConfigError} When the named index is not declared, when the
 *   constraint fields are not an
 *   in-order prefix of a declared index, when an `eq` follows a bound, when
 *   a second lower bound appears, when anything follows an upper bound, or
 *   when a lower/upper bound pair targets different fields — naming the
 *   role, resource, action, and the 1-based position of the offending
 *   constraint.
 */
export function validateAccessConstraints<
  TDocument extends GenericDocument = GenericDocument,
>(props: {
  role: string;
  resource: string;
  action: string;
  constraints: readonly AccessIndexConstraint<string, TDocument>[];
  indexFields: Readonly<Record<string, readonly string[]>>;
  indexName?: string;
}): void {
  const where = `role "${props.role}" on ${props.resource}.${props.action}`;

  // ── 0. The named index must exist ──────────────────────────────────────────
  // Checked before the empty-constraints bail: `q.withIndex("nope", (ix) => ix)`
  // records no constraints but still names an index Convex will reject at query
  // time. Without this, the field-sequence check below was the only gate, and it
  // only inspects the declared tuples' VALUES — so any field order that happened
  // to match SOME index passed regardless of the name actually written.
  if (props.indexName !== undefined && !(props.indexName in props.indexFields)) {
    const declared = Object.keys(props.indexFields);
    throw new VexAccessConfigError(
      `${where}: names index "${props.indexName}", which ${props.resource} does not declare ` +
        `(declared: ${declared.length > 0 ? declared.join(", ") : "none"})`,
    );
  }

  if (props.constraints.length === 0) return;

  // ── 1. Field sequence ──────────────────────────────────────────────────────
  // A lower bound immediately followed by an upper bound on the SAME field is the
  // only case Convex allows two constraints to share one index position, so the
  // pair collapses to a single logical field. Every other constraint is its own
  // position.
  const fields: string[] = [];
  for (let i = 0; i < props.constraints.length; i += 1) {
    const current = props.constraints[i]!;
    const next = props.constraints[i + 1];
    fields.push(current.field);
    if (
      isLowerBound(current.op) &&
      next !== undefined &&
      isUpperBound(next.op) &&
      next.field === current.field
    ) {
      i += 1;
    }
  }

  // ── 2. In-order prefix of some declared index ──────────────────────────────
  // When the rule named an index, that index's tuple is the ONLY one its fields may
  // prefix — matching a sibling index's shape is not permission to use this name.
  const candidates =
    props.indexName !== undefined
      ? [props.indexFields[props.indexName] ?? []]
      : Object.values(props.indexFields);
  const matchesSomeIndex = candidates.some(
    (tuple) => tuple.length >= fields.length && fields.every((field, at) => tuple[at] === field),
  );
  if (!matchesSomeIndex) {
    throw new VexAccessConfigError(
      props.indexName !== undefined
        ? `${where}: constraint fields [${fields.join(", ")}] are not an in-order prefix of index "${props.indexName}" ([${(props.indexFields[props.indexName] ?? []).join(", ")}])`
        : `${where}: constraint fields [${fields.join(", ")}] are not an in-order prefix of any declared index`,
    );
  }

  // ── 3. Convex's operator rule ──────────────────────────────────────────────
  // Check ORDER is load-bearing: one constraint can violate several rules at
  // once, and the most specific diagnosis must win. `eq` after `lt` breaks both
  // "nothing follows an upper bound" and "eq precedes every bound"; the former is
  // the more precise complaint, so it is tested first. Likewise a second lower
  // bound on a different field would also read as a mismatched bound pair, so the
  // second-bound check precedes the same-field check. Reordering these silently
  // changes which message an author sees — `validateAccessConstraints.test.ts`
  // pins each one exactly.
  let lowerBoundSeen = false;
  let upperBoundSeen = false;
  let lastBoundField: string | undefined;

  for (const [index, constraint] of props.constraints.entries()) {
    const position = index + 1;
    const at = `${where}: constraint ${position} ("${constraint.field}")`;

    if (upperBoundSeen) {
      throw new VexAccessConfigError(`${at} follows an upper bound — nothing may follow lt/lte`);
    }
    if (constraint.op === "eq" && (lowerBoundSeen || upperBoundSeen)) {
      throw new VexAccessConfigError(
        `${at} uses "eq" after a bound — eq must precede every gt/gte/lt/lte`,
      );
    }
    if (isLowerBound(constraint.op) && lowerBoundSeen) {
      throw new VexAccessConfigError(
        `${at} is a second lower bound — at most one gt/gte is allowed`,
      );
    }
    if (
      isUpperBound(constraint.op) &&
      lastBoundField !== undefined &&
      lastBoundField !== constraint.field
    ) {
      throw new VexAccessConfigError(
        `${at} is a bound on a different field than the prior bound ("${lastBoundField}") — bounds must pin the same field`,
      );
    }

    if (isLowerBound(constraint.op)) {
      lowerBoundSeen = true;
      lastBoundField = constraint.field;
    } else if (isUpperBound(constraint.op)) {
      upperBoundSeen = true;
      lastBoundField = constraint.field;
    }
  }
}

/**
 * Whether `op` opens a range from below.
 *
 * @param op - A recorded constraint's operator.
 * @returns `true` for `gt`/`gte`.
 */
function isLowerBound(op: AccessIndexConstraint<string, GenericDocument>["op"]): boolean {
  return op === "gt" || op === "gte";
}

/**
 * Whether `op` closes a range from above.
 *
 * @param op - A recorded constraint's operator.
 * @returns `true` for `lt`/`lte`.
 */
function isUpperBound(op: AccessIndexConstraint<string, GenericDocument>["op"]): boolean {
  return op === "lt" || op === "lte";
}
