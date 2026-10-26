import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError, type GenericId } from "convex/values";

import type { CollectionSlug, GlobalSlug } from "../../../types/generated";
import type { VexConfig } from "../../../config";
import type { AccessCallOptions, VexApiAuth } from "../../../db/types";
import { DRAFT_ACTIONS } from "../../../access";
import { getVersion } from "../../model";
import { assertVersionsAccess, resolveHistoryTarget } from "../history/server";

/**
 * Server-side args for `deleteVersion`. Same discriminated union as
 * {@link ListVersionsServerArgs}, plus the specific `version` to delete.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export type DeleteVersionServerArgs<DataModel extends GenericDataModel> = {
  /** Convex mutation context. */
  ctx: GenericMutationCtx<DataModel>;
  /** The resolved `VexConfig`. */
  config: VexConfig;
  /** Per-call access overrides, forwarded to `resolveAccessCall`. */
  access?: AccessCallOptions<string>;
  /** Resolved caller identity, forwarded to `hasPermission`. */
  auth?: VexApiAuth;
  /** The version number to permanently delete. */
  version: number;
  /** Accepted and ignored — reserved for a future multi-environment spec. */
  environmentId?: string;
} & ({ collection: CollectionSlug; id: GenericId<CollectionSlug> } | { global: GlobalSlug });

/**
 * Permanently deletes one `vex_versions` row. Prunes history only — never
 * the live draft or published row (that's `remove`'s cascade, Step 15).
 * Manual, one row at a time — decision 3 rules out an automatic pruning
 * endpoint.
 *
 * Resolves the target via `resolveHistoryTarget` (same resolver
 * `listVersions`/`getVersionSnapshot` use) and gates on `deleteVersions`
 * (Step 3's dedicated action) — never `update`/`readDrafts` — `master`
 * checked `update` here, which meant any editor allowed to save a draft
 * could also permanently destroy history (design-review.md §7).
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, version } & ({ collection, id } | { global })`.
 * @returns Nothing — resolves once the row is deleted.
 * @throws {ConvexError} When the collection/global cannot be resolved, does
 *   not declare `versions.drafts: true`, (collection only) `id` does not
 *   resolve to a document, or `version` does not exist.
 * @throws {VexAccessError} When the caller's roles lack `deleteVersions` on this target.
 */
export async function deleteVersion<DataModel extends GenericDataModel>(
  args: DeleteVersionServerArgs<DataModel>,
): Promise<void> {
  const { resource, rows } =
    "collection" in args
      ? await resolveHistoryTarget({
          ctx: args.ctx,
          config: args.config,
          collection: args.collection,
          id: args.id,
        })
      : await resolveHistoryTarget({ ctx: args.ctx, config: args.config, global: args.global });

  assertVersionsAccess({
    config: args.config,
    auth: args.auth,
    access: args.access,
    resource,
    defaultAction: DRAFT_ACTIONS.deleteVersions,
    data: rows.toUserFields(rows.publishedRow ?? rows.draftRow ?? {}),
  });

  const row = await getVersion({
    ctx: args.ctx,
    collection: rows.historyCollection,
    documentId: rows.documentId,
    version: args.version,
  });
  if (row === null) {
    throw new ConvexError(
      `No version ${args.version} found for this document in collection "${rows.historyCollection}"`,
    );
  }

  await args.ctx.db.delete(row._id);
}
