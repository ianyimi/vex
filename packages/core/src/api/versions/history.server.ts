import { ConvexError, type GenericId } from "convex/values";
import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";

import type { CollectionSlug, GlobalSlug } from "../../types/generated";
import type { VexConfig } from "../../config";
import type { AccessCallOptions, VexApiAuth } from "../types";
import { DRAFT_ACTIONS, hasPermission } from "../../access";
import { resolveAccessCall } from "../utils";
import {
  resolveVersionedTarget,
  type VersionedTargetRows,
} from "../../versions/resolveVersionedTarget";

/**
 * The discriminated target every `versions.*` history operation accepts —
 * identical shape to `SaveDraftServerArgs`'s union (`versions/saveDraft.server.ts`):
 * a collection document (`{ collection, id }`) or a global (`{ global }`).
 * `listVersions`, `getVersionSnapshot`, and `deleteVersion` each extend this
 * with their own operation-specific fields (`limit`, or `version`) rather
 * than a shared `documentId: string` the caller would have to derive
 * themselves — the server resolves `id`/`global` to the `vex_versions` key
 * the same way `saveDraft`/`publish` already do, via `resolveVersionedTarget`.
 */
export type VersionsTarget<TCollectionSlug extends CollectionSlug = CollectionSlug> =
  | { collection: TCollectionSlug; id: GenericId<TCollectionSlug> }
  | { global: GlobalSlug };

/**
 * One resolved history target: the row descriptor `vex_versions` is keyed
 * off, plus the RBAC resource to check `readDrafts`/`deleteVersions`
 * against.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface ResolvedHistoryTarget<DataModel extends GenericDataModel> {
  /**
   * The RBAC subject — the collection slug for a collection target, or the
   * GLOBAL'S OWN SLUG for a global target. Never the literal string
   * `"vex_globals"`: `defineAccess({ resources: [...] })` declares rules
   * per collection/global slug, and `"vex_globals"` names no such resource
   * — checking it was the exact bug this redesign fixes (history
   * previously had no working RBAC path for globals at all, see this
   * step's Why).
   */
  resource: string;
  /**
   * Row descriptor from `resolveVersionedTarget` — carries
   * `historyCollection`/`documentId` (the `(collection, documentId)` key
   * `vex_versions` groups rows under for this target) and `toUserFields`
   * (used to build the `data` passed to `hasPermission` for document-scoped
   * rules).
   */
  rows: VersionedTargetRows<DataModel>;
}

/**
 * Resolves a `{ collection, id } | { global }` target to its `vex_versions`
 * key and RBAC resource, for `listVersions`/`getVersionSnapshot`/`deleteVersion`.
 *
 * Delegates to `resolveVersionedTarget` (`versions/resolveVersionedTarget.ts`)
 * for the actual row lookups — the same resolver `saveDraft` uses — so a
 * draft-only row (never published, `collection.versions.defaultStatus:
 * "draft"`) resolves its own `_id` as the history key exactly as
 * `saveDraft`'s bootstrap path already does, with no second resolution rule
 * to keep in sync.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @param args - `{ ctx, config } & ({ collection, id } | { global })`.
 * @returns `{ resource, rows }` — see {@link ResolvedHistoryTarget}.
 * @throws {ConvexError} When the collection/global is not registered, does
 *   not declare `versions.drafts: true`, or (collection only) `id` does not
 *   resolve to a document.
 */
export async function resolveHistoryTarget<DataModel extends GenericDataModel>(
  args: {
    ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;
    config: VexConfig;
  } & VersionsTarget,
): Promise<ResolvedHistoryTarget<DataModel>> {
  if ("collection" in args) {
    const collection = args.config.collections.find((c) => c.slug === args.collection);
    if (!collection) {
      throw new ConvexError(`No collection registered with slug "${args.collection}"`);
    }
    if (!collection.versions.drafts) {
      throw new ConvexError(
        `Collection "${args.collection}" does not have drafts enabled — version history requires versions: { drafts: true }`,
      );
    }
    const rows = await resolveVersionedTarget({
      ctx: args.ctx,
      collection: args.collection,
      id: args.id,
    });
    return { resource: args.collection, rows };
  }

  const global = args.config.globals.find((g) => g.slug === args.global);
  if (!global) {
    throw new ConvexError(`No global registered with slug "${args.global}"`);
  }
  if (!global.versions.drafts) {
    throw new ConvexError(
      `Global "${args.global}" does not have drafts enabled — version history requires versions: { drafts: true }`,
    );
  }
  const rows = await resolveVersionedTarget({ ctx: args.ctx, global: args.global });
  return { resource: args.global, rows };
}

/**
 * Runs the RBAC gate shared by every history operation — `readDrafts` for
 * `listVersions`/`getVersionSnapshot`, `deleteVersions` for `deleteVersion`
 * — BEFORE a single `vex_versions` row is read or deleted.
 * `listVersions`/`getVersionSnapshot` return draft content, so the throw
 * must land before step logic touches `vex_versions`, not as a post-hoc
 * filter (`master` shipped both with zero authorization at all). A no-op
 * when `config.access` is unset, matching `get`/`find`'s own
 * `config?.access !== undefined` convention.
 *
 * @param props.resource - From {@link resolveHistoryTarget}'s result —
 *   never the literal `"vex_globals"`.
 * @param props.data - The resolved document's user fields, forwarded to
 *   `hasPermission` for document-scoped (ABAC) rules.
 * @throws {VexAccessError} When the caller's roles lack `defaultAction` on `resource`.
 */
export function assertVersionsAccess(props: {
  config: VexConfig;
  auth?: VexApiAuth;
  access?: AccessCallOptions<string>;
  resource: string;
  defaultAction: typeof DRAFT_ACTIONS.readDrafts | typeof DRAFT_ACTIONS.deleteVersions;
  data?: Record<string, unknown>;
}): void {
  if (props.config.access === undefined) return;
  const { access, action, resource } = resolveAccessCall({
    config: props.config,
    access: props.access,
    defaultAction: props.defaultAction,
    resource: props.resource,
  });
  hasPermission({
    throwOnDenied: true,
    access,
    user: props.auth?.user ?? null,
    organization: props.auth?.organization,
    resource,
    action,
    data: props.data,
  });
}
