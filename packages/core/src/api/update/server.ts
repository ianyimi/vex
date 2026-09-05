import type {
  BetterOmit,
  DocumentByName,
  Expand,
  GenericDataModel,
  TableNamesInDataModel,
} from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationServerParams } from "../types";
import { CRUD_ACTIONS, hasPermission } from "../../access";
import { resolveAccessCall } from "../utils";

/**
 * Server-side args for `update`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug, recovered from the `Id` brand.
 */
export interface UpdateServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> extends GenericMutationServerParams<DataModel> {
  /** The collection slug to patch this document. */
  collection: TCollectionSlug;
  /** The document ID to patch. */
  id: GenericId<TCollectionSlug>;
  /**
   * Partial field values to merge into the document. Only the keys present
   * here are written; unspecified fields are left unchanged. `_id` and
   * `_creationTime` are excluded — Convex manages them.
   *
   * Passed through `v.any()` at the network boundary; CLI codegen validates
   * the shape against the Convex schema at build time.
   */
  data: Partial<
    Expand<
      BetterOmit<
        DocumentByName<DataModel, TableNamesInDataModel<DataModel>>,
        "_creationTime" | "_id"
      >
    >
  >;
}

/**
 * Patches a document by its `Id<TCollectionSlug>`. Only specified fields are updated;
 * unspecified fields are left unchanged. Server-side only.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @param args - `{ ctx, id, data }`. `ctx` must be a mutation context.
 * @returns Promise resolving to void.
 * @example
 * ```ts
 * import { update } from "@vexcms/core/server";
 *
 * export const updatePost = mutation({
 *   args: { id: v.id("posts"), data: v.any() },
 *   handler: (ctx, args) => update({ ctx, id: args.id, data: args.data }),
 * });
 * ```
 */
export async function update<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(args: UpdateServerArgs<DataModel, TCollectionSlug>): Promise<void> {
  if (args.config.access !== undefined) {
    // Authorize against the STORED document, never `args.data`. The patch is
    // caller-controlled, so checking it would let a per-document rule be
    // satisfied by the payload rather than by the resource being protected
    // (e.g. `update: ({ data }) => !data.src.includes("example.com")` would pass
    // for a protected row simply by sending a different `src`). Matches the
    // behaviour of `get`, `find`, and `remove`.
    const doc = await args.ctx.db.get(args.id);
    const { access, action, resource } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: CRUD_ACTIONS.update,
      resource: args.collection,
    });
    hasPermission({
      throwOnDenied: true,
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      data: doc ?? undefined,
    });
  }
  await args.ctx.db.patch(args.id, args.data);
}
