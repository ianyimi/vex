import { ConvexError } from "convex/values";
import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";

import { ADMIN_FIELDS } from "../../fields/constants";
import type { CollectionConfig } from "../../collections/types";

/**
 * Args for `assertNoDraftRelationships`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface AssertNoDraftRelationshipsArgs<DataModel extends GenericDataModel> {
  /** Convex context — a read-only lookup, safe from a query or a mutation. */
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;
  /** The resolved collection config being published, for its field definitions. */
  collection: CollectionConfig;
  /** The fully-merged document about to be written (`publish`'s `transformedFields`). */
  document: Record<string, unknown>;
}

/**
 * Rejects a publish when any `relationship` field on the document currently
 * stores a reference to a target document that is itself a draft
 * (`vex_status === "draft"`).
 *
 * Developer decision (this spec's revision round): the relationship-field
 * picker (`useRelationshipPickerOptions`, Step 14) may surface draft targets
 * to an editor ONLY while the document being edited is itself a draft — but
 * that is a client-side convenience, not enforcement. This function is the
 * authoritative, server-side backstop: a document may never actually GO
 * LIVE while one of its relationship fields still points at unpublished
 * content, regardless of when or how that link was created (a stale link
 * from before the target was unpublished is rejected exactly the same as
 * one just picked). Checked generically by field PRESENCE on the fetched
 * target (`vex_status === "draft"`), not by looking the target's own
 * collection up in `VexConfig` — the same reasoning `populateDocs`' fix
 * (Step 13) already established: `vex_status` is schema-generated only onto
 * a versioned collection's rows, so its presence already means "this row
 * belongs to a versioned collection."
 *
 * Throws the SAME normalized `ConvexError` shape `validateFields.ts` now
 * produces — `{ message, field }` (its `toFieldValidationError` re-throws
 * every field rejection as that, since `649cafa` changed a field's
 * `validate()` from "return a string" to "reject by throwing"). There is no
 * `error` key any more. `publish.server.ts`'s caller (`CollectionEditView`,
 * Step 10) recognizes this exact shape via `applyVexFieldErrors`, so no new
 * client-side error handling is needed for this check.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @param args - `{ ctx, collection, fields }`.
 * @returns Promise resolving when no relationship field links to a draft.
 * @throws {ConvexError} `{ message, field }` naming the first offending relationship field.
 * @example
 * ```ts
 * await assertNoDraftRelationships({ ctx, collection, fields: transformedFields });
 * ```
 */
export async function assertNoDraftRelationships<
  DataModel extends GenericDataModel = GenericDataModel,
>(args: AssertNoDraftRelationshipsArgs<DataModel>): Promise<void> {
  const relationshipKeys = Object.entries(args.collection.fields)
    .filter(([, field]) => field.type === ADMIN_FIELDS.relationship.type)
    .map(([key]) => key);
  if (relationshipKeys.length === 0) return;

  for (const key of relationshipKeys) {
    const ids = args.document[key];
    if (!Array.isArray(ids) || ids.length === 0) continue;
    for (const id of ids) {
      const target = await args.ctx.db.get(id as never);
      if (target === null) continue;
      if ((target as Record<string, unknown>).vex_status === "draft") {
        throw new ConvexError({
          message: `Cannot publish while "${key}" links to a document that is still a draft — publish or unlink it first.`,
          field: key,
        });
      }
    }
  }
}
