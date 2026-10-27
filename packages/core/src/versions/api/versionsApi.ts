import {
  type MutationBuilder,
  type FunctionVisibility,
  type GenericDataModel,
  type QueryBuilder,
  GenericQueryCtx,
  GenericMutationCtx,
  RegisteredQuery,
  RegisteredMutation,
} from "convex/server";
import { ConvexError, GenericId, v } from "convex/values";
import type { VexConfig } from "../../config";
import type { CollectionSlug, GlobalSlug, VexDocumentGlobal } from "../../types/generated";
import type { VexApiAuth } from "../../db/types";
import {
  VexListVersionsArgs,
  VexGetVersionSnapshotArgs,
  VexDeleteVersionArgs,
} from "./types";
import { resolveGetAuth } from "../../server";
import { saveDraft } from "./saveDraft/server";
import { publish } from "./publish/server";
import { unpublish } from "./unpublish/server";
import { listVersions } from "./listVersions/server";
import { getVersionSnapshot } from "./getVersionSnapshot/server";
import { deleteVersion } from "./deleteVersion/server";

/**
 * Registers the draft/version workflow as bare-named Convex endpoints under
 * `api.vex.versions.*`, mirroring `collectionsApi`/`globalsApi`'s
 * registration shape and RBAC seam.
 *
 * Unlike `globalsApi` (always registers its three operations once called),
 * `versionsApi` registers NOTHING for a project where no resource declares
 * `versions.drafts: true`.
 *
 * @typeParam DataModel - The project's generated Convex data model.
 * @typeParam Visibility - Function visibility of the supplied builders;
 *   defaults to `"public"`.
 * @param props - Factory configuration, identical contract to `collectionsApi`'s.
 * @returns `saveDraft`/`publish`/`unpublish`/`listVersions`/`getVersionSnapshot`/
 *   `deleteVersion`, or `{}` when no resource declares `versions.drafts: true`.
 *
 * @see {@link globalsApi} for the (unconditional) factory this mirrors
 */
export function versionsApi<
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
  const hasVersionedCollections = config.collections.some((c) => c.versions.drafts);
  const hasVersionedGlobals = config.globals.some((g) => g.versions.drafts);
  if (!hasVersionedCollections && !hasVersionedGlobals) {
    return {};
  }

  return {
    saveDraft: mutation({
      args: {
        collection: v.optional(v.string()),
        id: v.optional(v.string()),
        global: v.optional(v.string()),
        data: v.any(),
        restoredFrom: v.optional(v.number()),
        environmentId: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const isCollection = args.collection !== undefined && args.id !== undefined;
        const isGlobal = args.global !== undefined;
        if (isCollection === isGlobal) {
          throw new ConvexError(
            "saveDraft takes either { collection, id } or { global }, not both or neither",
          );
        }
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        if (args.collection !== undefined && args.id !== undefined) {
          return saveDraft({
            auth,
            ctx,
            config,
            collection: args.collection as CollectionSlug,
            id: args.id as GenericId<CollectionSlug>,
            data: args.data,
            restoredFrom: args.restoredFrom,
          });
        }
        return saveDraft({
          auth,
          ctx,
          config,
          global: args.global as GlobalSlug,
          data: args.data,
          restoredFrom: args.restoredFrom,
        });
      },
    }),

    publish: mutation({
      args: {
        collection: v.optional(v.string()),
        id: v.optional(v.string()),
        global: v.optional(v.string()),
        environmentId: v.optional(v.string()),
        data: v.optional(v.any()),
        version: v.optional(v.number()),
      },
      handler: async (ctx, args) => {
        const isCollection = args.collection !== undefined && args.id !== undefined;
        const isGlobal = args.global !== undefined;
        if (isCollection === isGlobal) {
          throw new ConvexError(
            "publish takes either { collection, id } or { global }, not both or neither",
          );
        }
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        if (args.collection !== undefined && args.id !== undefined) {
          return publish({
            auth,
            ctx,
            config,
            collection: args.collection as CollectionSlug,
            id: args.id as GenericId<CollectionSlug>,
            data: args.data as Record<string, unknown> | undefined,
            version: args.version,
          });
        }
        return publish({
          auth,
          ctx,
          config,
          global: args.global as GlobalSlug,
          data: args.data as Record<string, unknown> | undefined,
          version: args.version,
        });
      },
    }),

    unpublish: mutation({
      args: {
        collection: v.optional(v.string()),
        id: v.optional(v.string()),
        global: v.optional(v.string()),
        environmentId: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const isCollection = args.collection !== undefined && args.id !== undefined;
        const isGlobal = args.global !== undefined;
        if (isCollection === isGlobal) {
          throw new ConvexError(
            "unpublish takes either { collection, id } or { global }, not both or neither",
          );
        }
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        if (args.collection !== undefined && args.id !== undefined) {
          return unpublish({
            auth,
            ctx,
            config,
            collection: args.collection as CollectionSlug,
            id: args.id as GenericId<CollectionSlug>,
          });
        }
        return unpublish({ auth, ctx, config, global: args.global as GlobalSlug });
      },
    }),

    listVersions: query({
      args: {
        collection: v.optional(v.string()),
        id: v.optional(v.string()),
        global: v.optional(v.string()),
        limit: v.optional(v.number()),
        environmentId: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const isCollection = args.collection !== undefined && args.id !== undefined;
        const isGlobal = args.global !== undefined;
        if (isCollection === isGlobal) {
          throw new ConvexError(
            "listVersions takes either { collection, id } or { global }, not both or neither",
          );
        }
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        if (args.collection !== undefined && args.id !== undefined) {
          return listVersions({
            auth,
            ctx,
            config,
            collection: args.collection as CollectionSlug,
            id: args.id as GenericId<CollectionSlug>,
            limit: args.limit,
          });
        }
        return listVersions({
          auth,
          ctx,
          config,
          global: args.global as GlobalSlug,
          limit: args.limit,
        });
      },
    }) as RegisteredQuery<Visibility, VexListVersionsArgs, VexDocumentGlobal | null>,

    getVersionSnapshot: query({
      args: {
        collection: v.optional(v.string()),
        id: v.optional(v.string()),
        global: v.optional(v.string()),
        version: v.number(),
        environmentId: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const isCollection = args.collection !== undefined && args.id !== undefined;
        const isGlobal = args.global !== undefined;
        if (isCollection === isGlobal) {
          throw new ConvexError(
            "getVersionSnapshot takes either { collection, id } or { global }, not both or neither",
          );
        }
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        if (args.collection !== undefined && args.id !== undefined) {
          return getVersionSnapshot({
            auth,
            ctx,
            config,
            collection: args.collection as CollectionSlug,
            id: args.id as GenericId<CollectionSlug>,
            version: args.version,
          });
        }
        return getVersionSnapshot({
          auth,
          ctx,
          config,
          global: args.global as GlobalSlug,
          version: args.version,
        });
      },
    }) as RegisteredQuery<Visibility, VexGetVersionSnapshotArgs, VexDocumentGlobal | null>,

    deleteVersion: mutation({
      args: {
        collection: v.optional(v.string()),
        id: v.optional(v.string()),
        global: v.optional(v.string()),
        version: v.number(),
        environmentId: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const isCollection = args.collection !== undefined && args.id !== undefined;
        const isGlobal = args.global !== undefined;
        if (isCollection === isGlobal) {
          throw new ConvexError(
            "deleteVersion takes either { collection, id } or { global }, not both or neither",
          );
        }
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        if (args.collection !== undefined && args.id !== undefined) {
          return deleteVersion({
            auth,
            ctx,
            config,
            collection: args.collection as CollectionSlug,
            id: args.id as GenericId<CollectionSlug>,
            version: args.version,
          });
        }
        return deleteVersion({
          auth,
          ctx,
          config,
          global: args.global as GlobalSlug,
          version: args.version,
        });
      },
    }) as RegisteredMutation<Visibility, VexDeleteVersionArgs, VexDocumentGlobal | null>,
  };
}
