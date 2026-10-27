import type { GenericDataModel, GenericQueryCtx } from "convex/server";
import { ConvexError, type GenericId } from "convex/values";

import type { CollectionSlug, GlobalSlug } from "../../../types/generated";
import type { VexConfig } from "../../../config";
import type { AccessCallOptions, VexApiAuth } from "../../../db/types";
import { DRAFT_ACTIONS } from "../../../access";
import { getVersion } from "../../model";
import type { VexVersionStatus } from "../../constants";
import { assertVersionsAccess, resolveHistoryTarget } from "../history/server";

/**
 * Server-side args for `getVersionSnapshot`. Same discriminated union as
 * {@link ListVersionsServerArgs}, plus the specific `version` to fetch.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export type GetVersionSnapshotServerArgs<DataModel extends GenericDataModel> = {
  /** Convex query context. */
  ctx: GenericQueryCtx<DataModel>;
  /** The resolved `VexConfig`. */
  config: VexConfig;
  /** Per-call access overrides, forwarded to `resolveAccessCall`. */
  access?: AccessCallOptions<string>;
  /** Resolved caller identity, forwarded to `hasPermission`. */
  auth?: VexApiAuth;
  /** The version number to fetch, as returned by `listVersions`. */
  version: number;
  /** Accepted and ignored — reserved for a future multi-environment spec. */
  environmentId?: string;
} & ({ collection: CollectionSlug; id: GenericId<CollectionSlug> } | { global: GlobalSlug });

/** Full content of one history row, for restore preview. */
export interface VersionSnapshotResult {
  /** The stripped document content at this version. */
  snapshot: Record<string, unknown>;
  /** Lifecycle state this version was recorded at. */
  status: VexVersionStatus;
}

/**
 * Fetches one version's full content, for restore preview — the client
 * hydrates the form from `snapshot` and calls `saveDraft({ restoredFrom })`
 * (restore stays client-side and non-destructive, design-review.md §10).
 *
 * Resolves the target via `resolveHistoryTarget` (same resolver
 * `listVersions`/`deleteVersion` use) and gates on `readDrafts` BEFORE the
 * snapshot row is read — this is the endpoint that returns full draft
 * content, and `master` shipped it with zero authorization
 * (design-review.md §7).
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, version } & ({ collection, id } | { global })`.
 * @returns The version's snapshot and recorded status.
 * @throws {ConvexError} When the collection/global cannot be resolved, does
 *   not declare `versions.drafts: true`, (collection only) `id` does not
 *   resolve to a document, or `version` does not exist.
 * @throws {VexAccessError} When the caller's roles lack `readDrafts` on this target.
 */
export async function getVersionSnapshot<DataModel extends GenericDataModel>(
  args: GetVersionSnapshotServerArgs<DataModel>,
): Promise<VersionSnapshotResult> {
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
    defaultAction: DRAFT_ACTIONS.readDrafts,
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

  return { snapshot: row.snapshot as Record<string, unknown>, status: row.status };
}
