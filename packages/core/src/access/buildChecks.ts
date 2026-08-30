import type { AccessConditionResult, AccessQueryBuilder } from "./constraintTypes";
import type {
  AccessCheck,
  AccessDocFieldFor,
  AccessDocFor,
  AccessFieldValueFor,
  AccessIndexedFieldFor,
  AccessIndexNameFor,
  AccessMutationCheck,
  AccessResourceRef,
} from "./types";
import type { AuthUserDocument } from "../types/generated";
import { ADMIN_FIELDS } from "../fields/constants";

/**
 * Builders for the common composable access checks.
 *
 * These exist to own the unavoidable casts. A helper generic over a resource slug `S`
 * and a field `F` cannot hand a concrete value to `AccessFieldValueFor<S, F>` or call
 * `ix.eq(field, …)` against `AccessIndexFieldsFor<S>[N]`, because both are unresolved
 * while `S` and `F` are unbound — TypeScript will not accept a value against a
 * conditional or indexed-access type it cannot reduce, even when a bound plainly
 * guarantees it. The casts are therefore inherent to writing such a helper at all.
 *
 * What is NOT inherent is where they live. Written once here, behind functions whose
 * public signatures are fully checked, a project's own checks need none. Call sites
 * stay completely type-safe: the field must lead an index, the value must match the
 * field, and the returned check is branded to its resource.
 */

/**
 * The runtime index-range builder, reached past the generic parameters.
 *
 * This is the ONE cast these builders cannot type away. `q.withIndex` is satisfied by
 * typing the resolved index name ({@link AccessIndexNameFor}), but the range callback's
 * builder is `ConstraintBuilder<AccessIndexFieldsFor<S>[N], …>` — an indexed access on
 * an unresolved type while `S` and `F` are unbound — so no argument can be checked
 * against its `eq`. Reducing that would require TypeScript to evaluate a generic
 * indexed access, which it does not do.
 *
 * @internal
 */
type RawRange = { eq: (field: string, value: unknown) => never };

/**
 * Resolves the index whose leading field is `field`.
 *
 * @param resource - The resource config the caller passed.
 * @param field - A field the types already guaranteed leads an index.
 * @returns The Convex index name.
 * @throws {Error} When no index leads with `field`. Unreachable through the typed
 *   surface; worth failing loudly because the alternative is a silent full scan with
 *   the caller believing their check was pushed down.
 */
function indexNameFor<S extends string, F>(
  resource: AccessResourceRef<S>,
  field: F & string,
): AccessIndexNameFor<S, F> {
  const declared = resource.fields[field]?.index;
  if (declared) return declared as AccessIndexNameFor<S, F>;
  throw new Error(
    `[vexcms] "${field}" on "${resource.slug}" leads no declared index; ` +
      `an indexed access check cannot narrow on it.`,
  );
}

/**
 * Reads a field's owner value off a document, tolerating both storage shapes.
 *
 * Relationship fields generate `Id<slug>[]` regardless of `hasMany`, so ownership is
 * usually a one-element array; a plain text or id column is a scalar. Checking the
 * value rather than the schema keeps this correct for both.
 *
 * @param owner - The field's stored value.
 * @param userId - The requesting user's id.
 * @returns True when the value names this user.
 */
function ownerMatches(owner: unknown, userId: unknown): boolean {
  return Array.isArray(owner) ? owner.includes(userId) : owner === userId;
}

/**
 * Builds a read check narrowed to `field === value`, pushed into that field's index.
 *
 * @typeParam S - Resource slug, inferred from `props.resource`.
 * @typeParam F - Field name, constrained to `S`'s index-leading fields.
 * @param props - Input props.
 * @param props.resource - The resource this check governs.
 * @param props.field - Field to compare, completed from `S`'s indexed fields.
 * @param props.value - Value to match, typed from `S`'s document.
 * @returns A check assignable to `permissions[role][S].read`.
 */
export function indexedEqCheck<S extends string, F extends AccessIndexedFieldFor<S>>(props: {
  field: F;
  resource: AccessResourceRef<S>;
  value: AccessFieldValueFor<S, F>;
}): AccessCheck<S> {
  const index = indexNameFor(props.resource, props.field);
  return {
    constraints: ({ q }: { q: AccessQueryBuilder<never, never> }): AccessConditionResult =>
      q.withIndex(index, (ix) => (ix as unknown as RawRange).eq(props.field, props.value)),
  } as unknown as AccessCheck<S>;
}

/**
 * Builds a read check narrowed to rows the requesting user owns, pushed into the owner
 * field's index.
 *
 * The comparison value is built per request from `user`, and its shape follows the
 * field's declared type: a relationship column stores `Id[]`, so the value is
 * `[user._id]`; anything else compares the id directly. That decision needs the
 * resource config, which is why this is a distinct builder rather than a call to
 * {@link indexedEqCheck}.
 *
 * @typeParam S - Resource slug, inferred from `props.resource`.
 * @typeParam F - Owner field, constrained to `S`'s index-leading fields.
 * @param props - Input props.
 * @param props.resource - The resource this check governs.
 * @param props.field - The owner field, e.g. `"authorId"`.
 * @returns A check assignable to `permissions[role][S].read`.
 */
export function indexedOwnerCheck<S extends string, F extends AccessIndexedFieldFor<S>>(props: {
  field: F;
  resource: AccessResourceRef<S>;
}): AccessCheck<S> {
  const index = indexNameFor(props.resource, props.field);
  const isRelationship =
    props.resource.fields[props.field]?.type === ADMIN_FIELDS.relationship.type;
  return {
    constraints: ({
      q,
      user,
    }: {
      q: AccessQueryBuilder<never, never>;
      user: AuthUserDocument;
    }): AccessConditionResult => {
      return q.withIndex(index, (ix) =>
        (ix as unknown as RawRange).eq(props.field, isRelationship ? [user._id] : user._id),
      );
    },
  } as unknown as AccessCheck<S>;
}

/**
 * Builds a single-document check that passes only when `field` names the requesting
 * user.
 *
 * A per-document predicate rather than an index range: `create`/`update`/`delete`
 * authorize one document, so there is nothing to narrow (DD 14). `field` is therefore
 * any readable field, not only an indexed one.
 *
 * @typeParam S - Resource slug, inferred from `props.resource`.
 * @typeParam F - Owner field on `S`.
 * @param props - Input props.
 * @param props.resource - The resource this check governs.
 * @param props.field - The owner field, e.g. `"authorId"`.
 * @returns A check assignable to a non-query action on `S`.
 */
export function ownerPredicateCheck<S extends string, F extends AccessDocFieldFor<S>>(props: {
  field: F;
  resource: AccessResourceRef<S>;
}): AccessMutationCheck<S> {
  return ((callbackProps: { data?: AccessDocFor<S>; user: AuthUserDocument }) => {
    const owner = callbackProps.data?.[props.field];
    return ownerMatches(owner, callbackProps.user._id);
  }) as AccessMutationCheck<S>;
}
