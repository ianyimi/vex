import type { GenericDataModel, GenericQueryCtx } from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug, GlobalSlug } from "../../types/generated";
import type { VexConfig } from "../../config";
import type { AccessCallOptions, VexApiAuth } from "../types";
import { DRAFT_ACTIONS } from "../../access";
import { listVersions as listVersionRows } from "../../versions/model";
import { assertVersionsAccess, resolveHistoryTarget } from "./history.server";
import { type VersionSummary } from "../../versions";

/**
 * Default history page size when `limit` is omitted. NOT a storage cap —
 * decision 3 (spec-tasks.md) rules out `maxPerDoc`; this only bounds one
 * page of the history dropdown (design-review.md §6.3: these rows are read
 * only when the history menu opens, never on the public path).
 */
const DEFAULT_VERSION_LIST_LIMIT = 50;

/**
 * Server-side args for `listVersions`. A discriminated union, identical in
 * shape to `SaveDraftServerArgs` (`versions/saveDraft.server.ts`): the
 * `{ collection, id }` member lists history for a versioned collection's
 * document, and the `{ global }` member lists history for a versioned
 * global.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export type ListVersionsServerArgs<DataModel extends GenericDataModel> = {
  /** Convex query context. */
  ctx: GenericQueryCtx<DataModel>;
  /** The resolved `VexConfig`. */
  config: VexConfig;
  /** Per-call access overrides, forwarded to `resolveAccessCall`. */
  access?: AccessCallOptions<string>;
  /** Resolved caller identity, forwarded to `hasPermission`. */
  auth?: VexApiAuth;
  /** Maximum history rows to return, newest first. Defaults to 50. */
  limit?: number;
  /** Accepted and ignored — reserved for a future multi-environment spec. */
  environmentId?: string;
} & ({ collection: CollectionSlug; id: GenericId<CollectionSlug> } | { global: GlobalSlug });

/**
 * Lists version history for a document OR a global, newest first —
 * summaries only. Use {@link getVersionSnapshot} to fetch one version's full
 * content.
 *
 * Resolves the caller's target (`{ collection, id }` or `{ global }`) via
 * `resolveHistoryTarget` (`./history`) — the same resolver
 * `getVersionSnapshot`/`deleteVersion` use — then gates on `readDrafts`
 * BEFORE a single `vex_versions` row is read: history can contain content a
 * caller without that action must never see, and `master` shipped this
 * endpoint with zero authorization (design-review.md §7).
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, limit? } & ({ collection, id } | { global })`.
 * @returns Version summaries, newest first.
 * @throws {ConvexError} When the collection/global cannot be resolved, or
 *   does not declare `versions.drafts: true`, or (collection only) `id`
 *   does not resolve to a document.
 * @throws {VexAccessError} When the caller's roles lack `readDrafts` on this target.
 * @example
 * ```ts
 * import { listVersions } from "@vexcms/core/server";
 *
 * export const postHistory = query({
 *   args: { id: v.id("posts") },
 *   handler: (ctx, args) =>
 *     listVersions({ ctx, config, collection: "posts", id: args.id }),
 * });
 * ```
 */
export async function listVersions<DataModel extends GenericDataModel>(
  args: ListVersionsServerArgs<DataModel>,
): Promise<VersionSummary[]> {
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

  const history = await listVersionRows({
    ctx: args.ctx,
    collection: rows.historyCollection,
    documentId: rows.documentId,
    limit: args.limit ?? DEFAULT_VERSION_LIST_LIMIT,
  });

  return history.map((row) => ({
    version: row.version,
    status: row.status,
    createdBy: row.createdBy ?? null,
    createdAt: row._creationTime,
    publishedAt: row.publishedAt ?? null,
  }));
}
