import type {
  AccessCheck,
  AccessDocFieldFor,
  AccessIndexedFieldFor,
  AccessIndexedFieldWithValue,
  AccessMutationCheck,
  AccessResourceRef,
  CollectionSlug,
} from "@vexcms/core";

import { indexedEqCheck, indexedOwnerCheck, ownerPredicateCheck } from "@vexcms/core";

import type { ContentStatus } from "~/db/constants";

import { CONTENT_STATUS } from "~/db/constants";

/**
 * Composable access checks for this project.
 *
 * Each returns a CHECK, not a rule, so the value drops straight into
 * `permissions[role][resource][action]` — a helper call, a bare `true`, and a full
 * inline `{ constraints, filter }` object sit side by side in the access config with no
 * seam and no wrapper property.
 *
 * The resource comes from the collection config you already imported. Passing
 * `articles` binds the slug, which types the field argument, the document, and the
 * builder. No slug strings, no local type aliases, and no generics written by hand:
 * `vex generate` emits the slugs `defineAccess` was configured with, so `AccessCheck<S>`
 * resolves this project's user and organization documents on its own.
 *
 * Casts live in core's builders rather than here. A function generic over a slug and a
 * field cannot hand a concrete value to `AccessFieldValueFor<S, F>` — an indexed access
 * TypeScript cannot reduce while both are unbound — so writing such a helper requires
 * one somewhere. `indexedEqCheck` and friends own them behind fully-checked signatures.
 *
 * Deliberately absent: a multi-resource form. A resource list forces every listed
 * collection to declare the same index name over an identical field tuple, and a
 * generic callback does not compile at all, because `AccessIndexedFieldFor<S>` cannot
 * reduce with `S` unbound. Naming the resource once per line costs a line and keeps the
 * permission matrix readable.
 */

/**
 * Allow a mutation only on rows the requesting user owns.
 *
 * A per-document predicate, not an index range: a single-document action has nothing
 * to narrow, so `field` is any readable field rather than only an indexed one.
 *
 * @typeParam S - Resource slug, inferred from `resource`.
 * @typeParam F - Owner field on `S`.
 * @param resource - The collection this check is for.
 * @param field - The owner field, e.g. `"authorId"`.
 * @returns A check assignable to a non-query action on `S`.
 */
export function ownOnly<S extends CollectionSlug, F extends AccessDocFieldFor<S>>(
  resource: AccessResourceRef<S>,
  field: F,
): AccessMutationCheck<S> {
  return ownerPredicateCheck({ field, resource });
}

/**
 * Read only the rows the requesting user owns, narrowed through the owner field's index.
 *
 * `field` names the owner column per collection, so the same check serves resources
 * that spell it differently.
 *
 * @typeParam S - Resource slug, inferred from `resource`.
 * @typeParam F - Owner field, constrained to `S`'s index-leading fields.
 * @param resource - The collection this check is for.
 * @param field - The owner field, e.g. `"authorId"`.
 * @returns A check assignable to `permissions[role][S].read`.
 */
export function readOwn<S extends CollectionSlug, F extends AccessIndexedFieldFor<S>>(
  resource: AccessResourceRef<S>,
  field: F,
): AccessCheck<S> {
  return indexedOwnerCheck({ field, resource });
}

/**
 * Read only `published` rows.
 *
 * @typeParam S - Resource slug, inferred from `resource`.
 * @typeParam F - Status field, constrained to `S`'s indexed fields holding a
 *   {@link ContentStatus} — so naming a non-status field is a compile error rather than
 *   a comparison that silently matches nothing.
 * @param resource - The collection this check is for.
 * @param field - The status field, e.g. `"status"`.
 * @returns A check assignable to `permissions[role][S].read`.
 */
export function readPublished<
  S extends CollectionSlug,
  F extends AccessIndexedFieldWithValue<S, ContentStatus>,
>(resource: AccessResourceRef<S>, field: F): AccessCheck<S> {
  // `select` fields store `v.array(...)`, so the comparison value is an array. The
  // cast is the one this file cannot delegate: `F` is unbound here, so its value type
  // is an unreduced indexed access and no literal can be checked against it. The bound
  // above is what actually guarantees the field holds this value.
  return readWhere(resource, field, [CONTENT_STATUS.published] as never);
}

/**
 * Read rows whose `field` equals `value`, narrowed through that field's index.
 *
 * The general case. Prefer it over {@link readPublished} when the value is written at
 * the call site, where `S` and `F` are concrete and the value is fully checked.
 *
 * @typeParam S - Resource slug, inferred from `resource`.
 * @typeParam F - Field name, constrained to `S`'s index-leading fields.
 * @param resource - The collection this check is for.
 * @param field - Field to compare, completed from `S`'s indexed fields.
 * @param value - Value to match, typed from `S`'s document.
 * @returns A check assignable to `permissions[role][S].read`.
 */
export function readWhere<S extends CollectionSlug, F extends AccessIndexedFieldFor<S>>(
  resource: AccessResourceRef<S>,
  field: F,
  value: Parameters<typeof indexedEqCheck<S, F>>[0]["value"],
): AccessCheck<S> {
  return indexedEqCheck({ field, resource, value });
}
