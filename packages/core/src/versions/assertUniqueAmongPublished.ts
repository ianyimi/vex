import type { GenericDatabaseReader, GenericDataModel } from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug, VexQueryCtx } from "../types/generated";

/**
 * Args for `assertUniqueAmongPublished`.
 *
 * @typeParam TCollectionSlug - The collection slug being checked.
 */
export interface AssertUniqueAmongPublishedArgs<TCollectionSlug extends CollectionSlug> {
  /**
   * The project's own Convex query context — a read-only lookup, so a mutation
   * context satisfies it too.
   *
   * Fixed (`VexQueryCtx`) rather than generic over `DataModel`, unlike the
   * public server functions in `api/`: this helper's intended caller is a
   * field's `validate()`, which since `649cafa` receives exactly the project's
   * own `VexMutationCtx` — a callback has no type argument to infer a model
   * from. Taking the fixed type drops a generic here and a `toVexQueryCtx`
   * conversion at every call site. A caller holding a generic ctx (a custom
   * mutation, a script) converts once with `toVexQueryCtx` (`api/utils.ts`),
   * which is THE one place that conversion is written.
   */
  ctx: VexQueryCtx;
  /** The collection slug whose table is queried. */
  collection: TCollectionSlug;
  /** Name of the single-field equality index declared on `field` (e.g. `"by_slug"`). */
  indexName: string;
  /** The field the index is defined on. */
  field: string;
  /** The value to check for collisions among published rows. */
  value: string;
  /**
   * The document currently being edited, excluded from collision candidates.
   * Pass the PUBLISHED row's id — including when the edit is happening through
   * its draft — never the draft's own id (design-review.md §3.2). Omit when
   * creating a brand new document, OR when editing a draft-only row (Option
   * A's `create` on a collection whose `versions.defaultStatus` is `"draft"` —
   * `vex_status: "draft"` with no `vex_publishedId`, since it has never been
   * published). A draft-only row has no published counterpart to exempt: the
   * candidate scan below only ever matches `vex_status === "published"` rows
   * (step 2a), and the draft-only row itself is never one of those, so there
   * is nothing for it to collide with by being its own candidate — omitting
   * `excludeId` in that case is correct, not merely tolerated.
   */
  excludeId?: GenericId<TCollectionSlug>;
}

/**
 * Asserts that no OTHER published row in `collection` already has `value` for
 * `field`, scoped to `vex_status === "published"` (design-review.md §3.2).
 *
 * A draft shares its published parent's field values by definition, so an
 * uniqueness check that considers every row — draft included — reports a
 * document as colliding with itself the moment it has a draft. Scoping to
 * published rows only, and excluding the document's own published `_id`,
 * removes the false positive while still catching a real collision with a
 * DIFFERENT document's published row — a third document's in-progress,
 * not-yet-published draft never counts either. The same status scoping
 * handles a draft-only row (never published, no `vex_publishedId`) for free:
 * it is never itself a `"published"` candidate, so it cannot collide with
 * itself regardless of whether the caller passed an `excludeId`.
 *
 * Call this from a field's `validate()` (see `fieldValidator`'s own
 * `@example` in `fields/baseTypes.ts`, which now delegates to this helper)
 * rather than hand-rolling the `ctx.db.query(...).withIndex(...)` scan.
 * Throwing IS the rejection mechanism: since `649cafa` a field's `validate()`
 * rejects by throwing rather than returning a message, and `validateFields`
 * catches whatever was thrown, attaches the field key, and re-throws one
 * normalized `ConvexError({ message, field })`. A plain `Error` is enough
 * here; a caller that wants structured detail (a code, the colliding
 * document's id) can catch and re-throw its own `ConvexError`, whose extra
 * data keys are preserved verbatim through that normalization.
 *
 * @typeParam TCollectionSlug - The collection slug being checked.
 * @param args - `{ ctx, collection, indexName, field, value, excludeId? }`.
 * @returns Promise resolving when no collision exists.
 * @throws {Error} When a different published row already has `value` for `field`.
 * @example
 * ```ts
 * await assertUniqueAmongPublished({
 *   ctx,
 *   collection: "pages",
 *   indexName: "by_slug",
 *   field: "slug",
 *   value: data.slug,
 *   excludeId: publishedId,
 * });
 * ```
 */
export async function assertUniqueAmongPublished<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(args: AssertUniqueAmongPublishedArgs<TCollectionSlug>): Promise<void> {
  // `ctx` is typed against the PROJECT's data model (`vex generate`), where a
  // runtime collection/index/field name can't be checked and collapses to
  // `never`. The lookup is generic by design, so read through the generic
  // reader: same object, typed for any table.
  const db = args.ctx.db as unknown as GenericDatabaseReader<GenericDataModel>;
  const rows = await db
    .query(args.collection)
    .withIndex(args.indexName, (q) => q.eq(args.field, args.value))
    .collect();

  // `undefined` status = a non-versioned row, which IS the document. A draft
  // row is never a candidate: it either shares its own parent's value (the
  // false positive this helper exists to remove) or is unpublished.
  const collision = rows.find(
    (doc) =>
      (doc.vex_status === "published" || doc.vex_status === undefined) &&
      doc._id !== args.excludeId,
  );
  if (collision) {
    throw new Error(`Another published document already uses "${args.field}": "${args.value}"`);
  }
}
