import type {
  BetterOmit,
  DocumentByName,
  Expand,
  GenericDataModel,
  TableNamesInDataModel,
} from "convex/server";

import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationServerParams } from "../types";
import { CRUD_ACTIONS, hasPermission } from "../../access";
import { resolveAccessCall } from "../utils";

/**
 * Server-side args for `create`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 */
export interface CreateServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> extends GenericMutationServerParams<DataModel> {
  /** The collection slug to insert into. */
  collection: TCollectionSlug;
  /**
   * Field values for the new document. `_id` and `_creationTime` are
   * excluded — Convex assigns these automatically.
   *
   * Passed through `v.any()` at the network boundary; CLI codegen validates
   * the shape against the Convex schema at build time.
   */
  data: Expand<
    BetterOmit<DocumentByName<DataModel, TableNamesInDataModel<DataModel>>, "_creationTime" | "_id">
  >;
}

/**
 * Inserts a document into a VexCMS collection and returns its ID.
 * Server-side only — call inside a Convex mutation handler.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @param args - `{ ctx, collection, data }`. `ctx` must be a mutation context.
 * @returns Promise resolving to the new document's ID as a string.
 * @example
 * ```ts
 * import { create } from "@vexcms/core/server";
 *
 * export const createPost = mutation({
 *   args: { data: v.any() },
 *   handler: (ctx, args) => create({ ctx, collection: "posts", data: args.data }),
 * });
 * ```
 */
export async function create<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(args: CreateServerArgs<DataModel, TCollectionSlug>): Promise<string> {
  if (args.config.access !== undefined) {
    // The PAYLOAD is the authorization subject here, unlike `update`/`remove`/`get`,
    // which authorize against the stored row. There is no stored row yet, and the
    // payload is exactly what is about to become one — so a per-document rule
    // (`({ data }) => data.status !== "published"`, say) has to see it. Without this
    // every payload-dependent rule on `create` denied unconditionally: the capability
    // probe detected the `data` read and, under the default `scope: "all"`, answered
    // "cannot hold for every document" — which is the wrong question for a create.
    //
    // The payload-hijack concern that makes `update` use the stored row does not
    // apply: there is nothing to protect from being misrepresented, since the
    // caller's values ARE the row being authorized.
    const { access, action, resource } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: CRUD_ACTIONS.create,
      resource: args.collection,
    });
    hasPermission({
      access,
      user: args.auth?.user ?? {},
      organization: args.auth?.organization,
      resource,
      action,
      data: args.data,
      throwOnDenied: true,
    });
  }
  const id = await args.ctx.db.insert(
    args.collection as TableNamesInDataModel<DataModel>,
    args.data,
  );
  return id;
}
