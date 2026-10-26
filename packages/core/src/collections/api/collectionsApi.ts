import {
  paginationOptsValidator,
  type MutationBuilder,
  type FunctionVisibility,
  type GenericDataModel,
  type QueryBuilder,
  GenericQueryCtx,
  GenericMutationCtx,
} from "convex/server";
import { GenericId, v } from "convex/values";
import type { VexConfig } from "../../config";
import type { CollectionSlug } from "../../types/generated";
import type { VexApiAuth } from "../../db/types";
import { resolveLivePreviewUrlServer } from "../../livePreview/api/resolve/server";
import { resolveGetAuth } from "../../server";
import { find } from "./find/server";
import { get } from "./get/server";
import { search } from "./search/server";
import { create } from "./create/server";
import { update } from "./update/server";
import { remove } from "./remove/server";

/**
 * Registers the full collection CRUD surface — `find`, `get`, `search`,
 * `create`, `update`, `remove` — as Convex endpoints, with RBAC enforcement
 * resolved entirely on the server.
 *
 * All query/mutation logic lives in the imported server functions; this
 * factory only provides the arg validators, the `query()`/`mutation()`
 * wrappers Convex needs at the network boundary, and the auth seam.
 *
 * **Identity never crosses the wire as an argument.** Callers (React
 * components, Next.js preloads, raw clients) cannot pass a user or
 * organization — there is deliberately no `auth` arg in any endpoint's
 * validator, so a client cannot impersonate its way past a permission check.
 * Instead, each handler resolves the caller once per request via the
 * server-side `getAuth` callback, which reads the authenticated connection
 * (`ctx.auth`) and returns the current user document and active organization.
 * The resolved {@link VexApiAuth} is forwarded to the underlying server
 * functions, which run {@link hasPermission} against `config.access`:
 * reads filter denied documents out (and `get` returns `null`), writes throw
 * {@link VexAccessError}.
 *
 * Enforcement is strictly opt-in, and misconfiguration fails loudly:
 * - No `config.access` → RBAC is off; `getAuth` is never called and every
 *   operation behaves exactly as before the seam existed.
 * - `config.access` set but `getAuth` omitted → {@link VexAccessConfigError}
 *   on the first request (see {@link resolveGetAuth}) — a permission matrix
 *   with no caller resolver is a project bug, surfaced immediately.
 * - `getAuth` resolving `undefined` (unauthenticated caller) → checks run
 *   with no user, so no roles resolve and access is denied, unless access.anonRole
 *   is configured, in which case that role will be used.
 *
 * Because identity rides the Convex connection token, the same endpoints work
 * unchanged from every runtime: client subscriptions (`useQuery`) on an
 * authenticated Convex provider, and server preloads by passing the JWT
 * (`preloadQuery(api.vex.find, args, { token })`) — preloaded results come
 * back already permission-filtered. Auth plugins supply the resolver (e.g.
 * `@vexcms/better-auth` exports one that loads the user document and active
 * organization from the session); core only knows the `getAuth` shape.
 *
 * @typeParam DataModel - The project's generated Convex data model.
 * @typeParam Visibility - Function visibility of the supplied builders;
 *   defaults to `"public"`.
 * @param props - Factory configuration.
 * @param props.config - The resolved `VexConfig`; `config.access` (when set)
 *   is the permission matrix every operation enforces.
 * @param props.query - The project's Convex `query` builder.
 * @param props.mutation - The project's Convex `mutation` builder.
 * @param props.getAuth - Server-side resolver for the current caller: receives
 *   the handler's ctx and returns `{ user, organization? }` (or `undefined`
 *   when unauthenticated). Called once per request, and only when
 *   `config.access` is configured. Never exposed to clients.
 * @returns Registered `find` / `get` / `search` queries and
 *   `create` / `update` / `remove` mutations for `convex/vex.ts` to re-export.
 *
 * @example
 * ```ts
 * // apps/test/convex/vex.ts
 * import { collectionsApi } from "@vexcms/core/server";
 * import { createGetAuth } from "@vexcms/better-auth/server";
 * import { mutation, query } from "./_generated/server";
 * import config from "~/vex.config";
 *
 * export const { find, get, search, create, update, remove } = collectionsApi({
 *   config,
 *   query,
 *   mutation,
 *   getAuth: createGetAuth(), // resolves user + active org from ctx.auth
 * });
 * ```
 *
 * @see {@link hasPermission} for resolution semantics (roles, wildcards, field maps)
 * @see {@link VexApiAuth} for the resolved caller shape
 */
export function collectionsApi<
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
    /**
     * Resolves a `{ server }` preview URL with a real `ctx`.
     *
     * Registered here rather than generated per collection: the slug is a
     * runtime argument, exactly as it is for `find`/`get`. Projects wire it by
     * adding `livePreviewUrl` to their `convex/vex.ts` destructure.
     */
    livePreviewUrl: query({
      args: {
        collection: v.string(),
        kind: v.optional(v.union(v.literal("collection"), v.literal("global"))),
        documentId: v.optional(v.string()),
        values: v.optional(v.any()),
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await resolveLivePreviewUrlServer({
          ctx,
          config,
          auth,
          kind: args.kind ?? "collection",
          slug: args.collection,
          documentId: args.documentId,
          values: (args.values ?? {}) as Record<string, unknown>,
        });
      },
    }),
    find: query({
      args: {
        collection: v.string(),
        populate: v.optional(v.any()),
        depth: v.optional(v.number()),
        limit: v.optional(v.number()),
        drafts: v.optional(v.boolean()),
        where: v.optional(v.any()),
        paginationOpts: v.optional(
          paginationOptsValidator.extend({ totalDocs: v.optional(v.boolean()) }),
        ),
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await find({
          ctx,
          auth,
          collection: args.collection as CollectionSlug,
          populate: args.populate,
          depth: args.depth,
          config,
          limit: args.limit,
          drafts: args.drafts,
          where: args.where,
          paginationOpts: args.paginationOpts as never,
        });
      },
    }),

    get: query({
      args: {
        collection: v.string(),
        id: v.string(),
        populate: v.optional(v.any()),
        depth: v.optional(v.number()),
        drafts: v.optional(v.boolean()),
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await get({
          auth,
          ctx,
          collection: args.collection as CollectionSlug,
          id: args.id as GenericId<CollectionSlug>,
          populate: args.populate,
          depth: args.depth,
          drafts: args.drafts,
          config,
        });
      },
    }),

    search: query({
      args: {
        collection: v.string(),
        searchIndexName: v.string(),
        searchField: v.string(),
        query: v.string(),
        limit: v.optional(v.number()),
        populate: v.optional(v.any()),
        depth: v.optional(v.number()),
        drafts: v.optional(v.boolean()),
        where: v.optional(v.any()),
        paginationOpts: v.optional(
          paginationOptsValidator.extend({ totalDocs: v.optional(v.boolean()) }),
        ),
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return search({
          auth,
          ctx,
          collection: args.collection as CollectionSlug,
          query: args.query,
          searchIndexName: args.searchIndexName,
          searchField: args.searchField,
          limit: args.limit,
          populate: args.populate,
          depth: args.depth,
          drafts: args.drafts,
          where: args.where,
          paginationOpts: args.paginationOpts as never,
          config,
        });
      },
    }),

    // MUTATIONS
    create: mutation({
      args: {
        collection: v.string(),
        data: v.any(),
      },
      returns: v.string(),
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await create({
          auth,
          ctx,
          config,
          collection: args.collection as CollectionSlug,
          data: args.data,
        });
      },
    }),

    update: mutation({
      args: {
        id: v.string(),
        collection: v.string(),
        data: v.any(),
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return update({
          auth,
          ctx,
          config,
          collection: args.collection as CollectionSlug,
          id: args.id as GenericId<CollectionSlug>,
          data: args.data,
        });
      },
    }),

    remove: mutation({
      args: {
        collection: v.string(),
        ids: v.array(v.string()),
        softDelete: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return remove({
          auth,
          collection: args.collection as CollectionSlug,
          ctx,
          config,
          ids: args.ids as GenericId<CollectionSlug>[],
          softDelete: args.softDelete,
        });
      },
    }),
  };
}
