import { ConvexError, type GenericId } from "convex/values";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { CollectionSlug, GlobalSlug } from "../../../types/generated";
import type { VexConfig } from "../../../config";
import type { AccessCallOptions, VexApiAuth } from "../../../db/types";
import type { CollectionOrGlobal } from "../../../types/utils";
import { resolveVersionedTarget } from "../../resolveVersionedTarget";
import { unpublishShared } from "../../unpublish";

/**
 * Server-side args for `unpublish`. A discriminated union, identical in
 * shape to `SaveDraftServerArgs` minus the content-carrying fields (no
 * `data`, no `restoredFrom` — unpublish moves no field values): the
 * `{ collection, id }` member unpublishes a versioned collection's
 * document, and the `{ global }` member unpublishes a versioned global.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export type UnpublishServerArgs<DataModel extends GenericDataModel> = {
  /** Convex mutation context. */
  ctx: GenericMutationCtx<DataModel>;
  /** The resolved `VexConfig`. */
  config: VexConfig;
  /** Per-call access overrides, forwarded to `resolveAccessCall`. */
  access?: AccessCallOptions<string>;
  /** Resolved caller identity, forwarded to `hasPermission`. */
  auth?: VexApiAuth;
} & (
  | {
      /** The versioned collection slug. */
      collection: CollectionSlug;
      /** The currently-loaded document's id — the published row's id, in practice. */
      id: GenericId<CollectionSlug>;
    }
  | {
      /** The versioned global slug. */
      global: GlobalSlug;
    }
);

/**
 * Flips a versioned collection's document (or a versioned global) back to
 * `"draft"` status, carrying `vex_publishedAt` forward and recording one
 * history row. Server-side only.
 *
 * Resolves `collection`/`global` config (throwing when the slug is unknown
 * or has `versions.drafts: false`), resolves `rows` via
 * `resolveVersionedTarget`, and delegates every real decision to
 * `unpublishShared` — this file's only job is picking which target
 * `resolveVersionedTarget` resolves against.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ collection, id }` or `{ global }`, plus `ctx`/`config`/`access`/`auth`.
 * @returns Promise resolving to the published row's `_id` (now a draft row), as a string.
 * @throws {ConvexError} When the collection/global is unknown, does not have
 *   `versions.drafts` enabled, has no published row, or has an active draft row.
 * @throws {VexAccessError} When the caller is not permitted to unpublish this document.
 * @example
 * ```ts
 * import { unpublish } from "@vexcms/core/server";
 *
 * export const unpublishPost = mutation({
 *   args: { id: v.id("posts") },
 *   handler: (ctx, args) => unpublish({ ctx, config, collection: "posts", id: args.id }),
 * });
 * ```
 */
export async function unpublish<DataModel extends GenericDataModel>(
  args: UnpublishServerArgs<DataModel>,
): Promise<string> {
  let target: CollectionOrGlobal;

  if ("collection" in args) {
    const collection = args.config.collections.find((c) => c.slug === args.collection);
    if (!collection) {
      throw new ConvexError(`No collection registered with slug "${args.collection}"`);
    }
    if (!collection.versions.drafts) {
      throw new ConvexError(`Collection "${args.collection}" does not have versions.drafts enabled.`);
    }
    target = { kind: "collection", config: collection };
    const rows = await resolveVersionedTarget({
      ctx: args.ctx,
      collection: args.collection,
      id: args.id,
    });
    return unpublishShared({
      ctx: args.ctx,
      config: args.config,
      target,
      access: args.access,
      auth: args.auth,
      rows,
    });
  }

  const global = args.config.globals.find((g) => g.slug === args.global);
  if (!global) {
    throw new ConvexError(`No global registered with slug "${args.global}"`);
  }
  if (!global.versions.drafts) {
    throw new ConvexError(`Global "${args.global}" does not have versions.drafts enabled.`);
  }
  target = { kind: "global", config: global };
  const rows = await resolveVersionedTarget({ ctx: args.ctx, global: args.global });
  return unpublishShared({
    ctx: args.ctx,
    config: args.config,
    target,
    access: args.access,
    auth: args.auth,
    rows,
  });
}
