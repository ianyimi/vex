import { ConvexError, type GenericId } from "convex/values";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { CollectionSlug, GlobalSlug } from "../../types/generated";
import type { VexConfig } from "../../config";
import type { AccessCallOptions, VexApiAuth } from "../types";
import type { CollectionOrGlobal } from "../../types/utils";
import { resolveVersionedTarget } from "../../versions/resolveVersionedTarget";
import { publishShared } from "../../versions/publish";

/**
 * Server-side args for `publish`. A discriminated union, identical in shape
 * to `SaveDraftServerArgs` minus `data`/`restoredFrom` (`publish` promotes
 * whatever is currently stored on the draft row — see `publishShared`'s
 * doc comment): the `{ collection, id }` member publishes a versioned
 * collection's active draft, and the `{ global }` member publishes a
 * versioned global's.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export type PublishServerArgs<DataModel extends GenericDataModel> = {
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
      /** The versioned collection slug this call targets. */
      collection: CollectionSlug;
      /** The document id currently loaded — the published row's id, or an active draft's own id. */
      id: GenericId<CollectionSlug>;
    }
  | {
      /** The versioned global slug this call targets. */
      global: GlobalSlug;
    }
);

/**
 * Promotes a versioned collection document's — or a versioned global's —
 * active draft to published. Server-side only.
 *
 * One implementation handles both kinds: it resolves the caller's target
 * (`{ collection, id }` or `{ global }`) to a {@link CollectionOrGlobal} and
 * a `VersionedTargetRows` descriptor (`../../versions/resolveVersionedTarget`),
 * then delegates every validate/write/history step to `publishShared`
 * (`../../versions/publish`) — the one place that logic lives, for either
 * kind. Mirrors `saveDraft.server.ts` exactly.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config } & ({ collection, id } | { global })`. `ctx` must be a mutation context.
 * @returns Promise resolving to the published row's `_id` as a string
 *   (stable across every future publish).
 * @throws {ConvexError} When the collection/global cannot be resolved, does
 *   not declare `versions.drafts: true`, or (collection only) when `id`
 *   does not resolve to a document; propagated from `publishShared` when
 *   there is no draft to publish, or the merged document fails strict
 *   validation.
 * @throws {VexAccessError} When the caller is not permitted to publish.
 * @example
 * ```ts
 * import { publish } from "@vexcms/core/server";
 *
 * export const publishPost = mutation({
 *   args: { id: v.id("posts") },
 *   handler: (ctx, args) => publish({ ctx, config, collection: "posts", id: args.id }),
 * });
 * ```
 */
export async function publish<DataModel extends GenericDataModel>(
  args: PublishServerArgs<DataModel>,
): Promise<string> {
  let target: CollectionOrGlobal;

  if ("collection" in args) {
    const collection = args.config.collections.find((c) => c.slug === args.collection);
    if (!collection) {
      throw new ConvexError(`No collection registered with slug "${args.collection}"`);
    }
    if (!collection.versions.drafts) {
      throw new ConvexError(
        `Collection "${args.collection}" does not have drafts enabled — set versions: { drafts: true } to use publish`,
      );
    }
    target = { kind: "collection", config: collection };
    const rows = await resolveVersionedTarget({
      ctx: args.ctx,
      collection: args.collection,
      id: args.id,
    });
    return publishShared({
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
    throw new ConvexError(
      `Global "${args.global}" does not have drafts enabled — set versions: { drafts: true } to use publish`,
    );
  }
  target = { kind: "global", config: global };
  const rows = await resolveVersionedTarget({ ctx: args.ctx, global: args.global });
  return publishShared({
    ctx: args.ctx,
    config: args.config,
    target,
    access: args.access,
    auth: args.auth,
    rows,
  });
}
