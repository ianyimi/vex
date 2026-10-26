import { type GenericDocument } from "convex/server";
import type { QueryIndexConstraint } from "./queryConstraintTypes";
import { AccessResource, VexAccessConfig, VexAccessConfigError } from "./types";
import { resolveCollectionIndexes } from "../collections/resolveCollectionIndexes";
import { evaluateQueryConstraint, type QueryConstraintOutcome } from "./evaluateQueryConstraint";
import { validateWhereNode } from "../api/queryArgs";
import { VexError } from "../errors";
import { getDataFields } from "../fields";

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
      // are skipped here — see `validateQueryIndexConstraints`'s edge cases.
      if (resource === undefined || typeof actions !== "object" || actions === null) continue;
      for (const [action, check] of Object.entries(actions as Record<string, unknown>)) {
        // The action-level wildcard IS resolved here, unlike the role-level one
        // (boolean-only). A typed mutation rule cannot declare a `withIndex` (its type is
        // `WithIndexOnMutationError`), so it can never name an index and
        // `validateQueryIndexConstraints` will have nothing to check —
        // but running the callbacks is still worth it, because that is what turns a
        // rule that throws into a `VexAccessConfigError` at module load rather than
        // at query time. Skipping it made the wildcard the one place a broken
        // constraint stayed hidden until a request hit it.
        if (typeof check !== "object" || check === null) continue;
        if (!("withIndex" in check || "where" in check)) continue;
        const staticWhere = (check as { where?: unknown }).where;
        if (staticWhere !== undefined && typeof staticWhere !== "function") {
          try {
            validateWhereNode({
              node: staticWhere,
              fields: [...Object.keys(getDataFields({ fields: resource.fields })), "_id", "_creationTime"],
            });
          } catch (error) {
            const message =
              error instanceof VexError && typeof error.data === "object"
                ? String(error.data.message)
                : error instanceof Error
                  ? error.message
                  : String(error);
            throw new VexAccessConfigError(`role "${role}" on ${resourceSlug}.${action}: invalid static where — ${message}`);
          }
        }
        let outcome: QueryConstraintOutcome;
        try {
          outcome = evaluateQueryConstraint({
            check: check as { withIndex?: unknown; where?: (p: never) => unknown },
            callerProps: { user: {}, organization: {} },
          });
        } catch (error) {
          // Resolving a rule means RUNNING its callbacks at module load, so a rule
          // that reached past its types — `as any`, a hand-built object, a method
          // the builder does not have — surfaces here as whatever it threw. Rethrow
          // as a config error so every `defineAccess` failure has one shape and
          // names the offending rule, instead of leaking a bare `TypeError` with no
          // indication of which role or action produced it.
          throw new VexAccessConfigError(
            `role "${role}" on ${resourceSlug}.${action}: the withIndex/where callback threw ` +
              `while being resolved — ${error instanceof Error ? error.message : String(error)}. ` +
              `Rules must be pure; they run once at config time with no documents and no ` +
              `database access.`,
          );
        }
        // A rule that short-circuits to a flat allow/deny has no condition to check.
        if (typeof outcome === "boolean") continue;
        // Anything built through `withIndex` / `where` is readable here. An unreadable
        // value therefore means a half returned something that did not come from the
        // supplied builder — a bare object, `undefined`, a number. Previously that fell
        // through the `condition?.index === undefined` guard below and was accepted as
        // "excludes nothing", which is the most dangerous possible default for an access
        // rule: the author believes they wrote a restriction and the config silently has
        // none. `resolveAccessRule` still fails SAFE for this shape at request time;
        // config time should fail LOUD.
        if (outcome === undefined) {
          throw new VexAccessConfigError(
            `role "${role}" on ${resourceSlug}.${action}: withIndex must be { name, range } or ` +
              `a function returning { name, range } or a boolean, and where must be a plain where object ` +
              `or return a predicate built from the supplied "q" or a boolean.`,
          );
        }
        // This validator enforces Convex's INDEX rules — the index name, field order
        // and operator sequencing — so it applies only when the rule chose an index. A
        // predicate compiles to `.filter()`, which imposes none of them.
        if (outcome.index === undefined) continue;
        validateQueryIndexConstraints({
          role,
          resource: resourceSlug,
          action,
          constraints: outcome.index.constraints,
          indexFields: Object.fromEntries(resolveCollectionIndexes({ collection: resource }).map((index) => [index.name, index.fields])),
          indexName: outcome.index.name,
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
 *   produced by invoking its `withIndex.range` with a fresh builder.
 * @param props.indexFields - The resource's declared indexes, index name →
 *   field tuple in declaration order. The caller derives this from real
 *   Convex index declarations (`defineAccess` reads it off `field.index` /
 *   relationship auto-index the same way `collectIndexNames`,
 *   `types/generateVexTypes.ts`, builds `.index()` calls) — compound indexes
 *   come from a field's `index.additionalFields` or the collection's `indexes`.
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
export function validateQueryIndexConstraints<
  TDocument extends GenericDocument = GenericDocument,
>(props: {
  role: string;
  resource: string;
  action: string;
  constraints: readonly QueryIndexConstraint<string, TDocument>[];
  indexFields: Readonly<Record<string, readonly string[]>>;
  indexName?: string;
}): void {
  const where = `role "${props.role}" on ${props.resource}.${props.action}`;

  // ── 0. The named index must exist ──────────────────────────────────────────
  // Checked before the empty-constraints bail: `withIndex: { name: "nope", range: (ix) => ix }`
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
  // changes which message an author sees — `validateQueryIndexConstraints.test.ts`
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
function isLowerBound(op: QueryIndexConstraint<string, GenericDocument>["op"]): boolean {
  return op === "gt" || op === "gte";
}

/**
 * Whether `op` closes a range from above.
 *
 * @param op - A recorded constraint's operator.
 * @returns `true` for `lt`/`lte`.
 */
function isUpperBound(op: QueryIndexConstraint<string, GenericDocument>["op"]): boolean {
  return op === "lt" || op === "lte";
}
