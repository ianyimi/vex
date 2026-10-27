import {
  type MutationBuilder,
  type FunctionVisibility,
  type GenericDataModel,
  type QueryBuilder,
  GenericQueryCtx,
  GenericMutationCtx,
  RegisteredQuery,
} from "convex/server";
import { v } from "convex/values";
import type { VexConfig } from "../../config";
import type { GlobalSlug, VexDocumentGlobal } from "../../types/generated";
import type { VexApiAuth } from "../../db/types";
import { VexGlobalsGetArgs } from "./types";
import { resolveGetAuth } from "../../server";
import { getGlobal } from "./get/server";
import { findGlobals } from "./find/server";
import { upsertGlobal } from "./upsert/server";

/**
 * Registers `globals.get`, `globals.find`, and `globals.upsert` as Convex
 * query and mutation endpoints under `api.vex.globals.*`.
 *
 * Call once in `convex/vex.ts` alongside the collection and version APIs.
 *
 * @typeParam DataModel - The project's generated Convex data model.
 * @typeParam Visibility - Function visibility of the supplied builders;
 *   defaults to `"public"`.
 * @param props - Factory configuration, identical contract to `collectionsApi`'s.
 * @returns Registered `get` / `find` queries and `upsert` mutation.
 */
export function globalsApi<
  DataModel extends GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>({
  config,
  query,
  mutation,
  getAuth,
}: {
  config: VexConfig;
  query: QueryBuilder<DataModel, Visibility>;
  mutation: MutationBuilder<DataModel, Visibility>;
  getAuth?: (
    ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  ) => Promise<VexApiAuth | undefined>;
}) {
  return {
    get: query({
      args: {
        slug: v.string(),
        populate: v.optional(v.any()),
        drafts: v.optional(v.boolean()),
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await getGlobal({
          auth,
          ctx,
          slug: args.slug as GlobalSlug,
          populate: args.populate,
          drafts: args.drafts,
          config,
        });
      },
    }) as RegisteredQuery<Visibility, VexGlobalsGetArgs, VexDocumentGlobal | null>,

    find: query({
      args: {},
      handler: async (ctx) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await findGlobals({ auth, ctx, config });
      },
    }),

    upsert: mutation({
      args: {
        slug: v.string(),
        data: v.any(),
      },
      returns: v.string(),
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await upsertGlobal({
          auth,
          ctx,
          config,
          slug: args.slug as GlobalSlug,
          data: args.data as Record<string, unknown>,
        });
      },
    }),
  };
}
