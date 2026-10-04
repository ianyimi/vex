import { ConvexError, type GenericId } from "convex/values";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { CollectionSlug, GlobalSlug } from "../../types/generated";
import type { VexConfig } from "../../config";
import type { AccessCallOptions, VexApiAuth } from "../types";
import type { CollectionOrGlobal } from "../../types/utils";
import { resolveVersionedTarget } from "../../versions/resolveVersionedTarget";
import { saveDraftShared } from "../../versions/saveDraft";

/**
 * Server-side args for `saveDraft`. A discriminated union: the
 * `{ collection, id }` member saves a draft for a versioned collection's
 * document, and the `{ global }` member saves a draft for a versioned
 * global — `vex_globals`' one shared table has no per-document id to pass,
 * so the slug alone identifies the target row(s).
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export type SaveDraftServerArgs<DataModel extends GenericDataModel> = {
  /** Convex mutation context. */
  ctx: GenericMutationCtx<DataModel>;
  /** The resolved `VexConfig`. */
  config: VexConfig;
  /** Per-call access overrides, forwarded to `resolveAccessCall`. */
  access?: AccessCallOptions<string>;
  /** Resolved caller identity, forwarded to `hasPermission`. */
  auth?: VexApiAuth;
  /** Partial field values to merge into the draft row. Unspecified fields are left unchanged. */
  data: Record<string, unknown>;
  /**
   * The version number this save restores from, when the caller is reverting to
   * an older snapshot (fetched separately via `getVersionSnapshot`, Step 8).
   * Recorded on the emitted `vex_versions` row for lineage; otherwise unused.
   */
  restoredFrom?: number;
} & (
  | {
      /** The versioned collection slug this call targets. */
      collection: CollectionSlug;
      /**
       * The document id the caller currently has loaded — the published row's
       * id on every edit after the first, or a draft row's own id
       * (never-published document, or a draft already active). Both are
       * resolved transparently.
       */
      id: GenericId<CollectionSlug>;
    }
  | {
      /** The versioned global slug this call targets. */
      global: GlobalSlug;
    }
);

/**
 * Patches (or bootstraps) the draft row for a versioned collection's document
 * OR a versioned global, and records a `"draft"`-status history row.
 * Server-side only.
 *
 * One implementation handles both kinds: it resolves the caller's `target`
 * (`{ collection, id }` or `{ global }`) to a {@link CollectionOrGlobal} and a
 * {@link VersionedTargetRows} descriptor (`../../versions/resolveVersionedTarget`),
 * then delegates every bootstrap/merge/patch/history step to
 * `saveDraftShared` (`../../versions/saveDraft`) — the one place that logic
 * lives, for either kind.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, data, restoredFrom? } & ({ collection, id } | { global })`.
 *   `ctx` must be a mutation context.
 * @returns Promise resolving to the draft row's `_id` as a string.
 * @throws {ConvexError} When the collection/global cannot be resolved, or
 *   does not declare `versions.drafts: true`, or (collection only) when `id`
 *   does not resolve to a document.
 * @throws {VexAccessError} When the caller is not permitted to save this draft.
 * @example
 * ```ts
 * import { saveDraft } from "@vexcms/core/server";
 *
 * export const savePostDraft = mutation({
 *   args: { id: v.id("posts"), data: v.any() },
 *   handler: (ctx, args) =>
 *     saveDraft({ ctx, config, collection: "posts", id: args.id, data: args.data }),
 * });
 * ```
 */
export async function saveDraft<DataModel extends GenericDataModel>(
  args: SaveDraftServerArgs<DataModel>,
): Promise<string> {
  let target: CollectionOrGlobal;

  if ("collection" in args) {
    const collection = args.config.collections.find((c) => c.slug === args.collection);
    if (!collection) {
      throw new ConvexError(`No collection registered with slug "${args.collection}"`);
    }
    if (!collection.versions.drafts) {
      throw new ConvexError(
        `Collection "${args.collection}" does not have drafts enabled — set versions: { drafts: true } to use saveDraft`,
      );
    }
    target = { kind: "collection", config: collection };
    const rows = await resolveVersionedTarget({
      ctx: args.ctx,
      collection: args.collection,
      id: args.id,
    });
    return saveDraftShared({
      ctx: args.ctx,
      config: args.config,
      target,
      access: args.access,
      auth: args.auth,
      data: args.data,
      restoredFrom: args.restoredFrom,
      rows,
    });
  }

  const global = args.config.globals.find((g) => g.slug === args.global);
  if (!global) {
    throw new ConvexError(`No global registered with slug "${args.global}"`);
  }
  if (!global.versions.drafts) {
    throw new ConvexError(
      `Global "${args.global}" does not have drafts enabled — set versions: { drafts: true } to use saveDraft`,
    );
  }
  target = { kind: "global", config: global };
  const rows = await resolveVersionedTarget({ ctx: args.ctx, global: args.global });
  return saveDraftShared({
    ctx: args.ctx,
    config: args.config,
    target,
    access: args.access,
    auth: args.auth,
    data: args.data,
    restoredFrom: args.restoredFrom,
    rows,
  });
}
