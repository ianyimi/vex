import {
  paginationOptsValidator,
  type MutationBuilder,
  type FunctionVisibility,
  type GenericDataModel,
  type QueryBuilder,
  type RegisteredQuery,
  GenericQueryCtx,
  GenericMutationCtx,
} from "convex/server";
import { GenericId, v } from "convex/values";
import type { VexConfig } from "../config";
import type {
  CollectionSlug,
  GlobalPopulateShape,
  GlobalSlug,
  VexDocumentGlobal,
} from "../types/generated";
import type { FindServerArgs } from "./find/server";
import type { GetServerArgs } from "./get/server";
import type { SearchServerArgs } from "./search/server";
import type { CreateServerArgs } from "./create/server";
import type { UpdateServerArgs } from "./update/server";
import type { RemoveServerArgs } from "./remove/server";
import type { GetGlobalReturn, GetGlobalServerArgs } from "./globals/get.server";
import type { UpsertGlobalServerArgs } from "./globals/upsert.server";
import type { GenericGlobalsQueryServerArgs } from "./globals/types";
import type {
  AccessCallOptions,
  DocReturnItem,
  GetReturn,
  PaginationOptions,
  PaginationResult,
  PopulateShape,
} from "./types";
import { find } from "./find/server";
import { get } from "./get/server";
import { search } from "./search/server";
import { create } from "./create/server";
import { update } from "./update/server";
import { remove } from "./remove/server";
import { getGlobal } from "./globals/get.server";
import { findGlobals } from "./globals/find.server";
import { upsertGlobal } from "./globals/upsert.server";
import { VexGlobalsGetArgs } from "./convex";
import { VexAccessConfigError } from "../access";
import { VexApiAuth } from "./types";

export { buildDepthPopulate } from "./depth";

export { find } from "./find/server";
export type { FindServerArgs } from "./find/server";

export { get } from "./get/server";
export type { GetServerArgs } from "./get/server";

export { search } from "./search/server";
export type { SearchServerArgs } from "./search/server";

export { create } from "./create/server";
export type { CreateServerArgs } from "./create/server";

export { update } from "./update/server";
export type { UpdateServerArgs } from "./update/server";

export { remove } from "./remove/server";
export type { RemoveServerArgs } from "./remove/server";

export { getGlobal } from "./globals/get.server";
export type { GetGlobalServerArgs } from "./globals/get.server";
export { findGlobals } from "./globals/find.server";
export { upsertGlobal } from "./globals/upsert.server";
export type { UpsertGlobalServerArgs } from "./globals/upsert.server";

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
 * // apps/www/convex/vex.ts
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
    find: query({
      args: {
        collection: v.string(),
        populate: v.optional(v.any()),
        depth: v.optional(v.number()),
        limit: v.optional(v.number()),
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

/**
 * Registers `globals.get`, `globals.find`, and `globals.update` as Convex
 * query and mutation endpoints under `api.vex.globals.*`.
 *
 * Call once in `convex/vex.ts` alongside `queryApi` and `mutationApi`.
 *
 * @param props.config - The resolved `VexConfig`.
 * @param props.query - Convex `query` builder. Defaults to `internalQueryGeneric`.
 * @param props.mutation - Convex `mutation` builder. Defaults to `internalMutationGeneric`.
 * @param props.getAuth - Server-side resolver for the current caller: receives
 *   the handler's ctx and returns `{ user, organization? }` (or `undefined`
 *   when unauthenticated). Called once per request, and only when
 *   `config.access` is configured. Never exposed to clients.
 * @returns `{ globals }` with `.get`, `.find`, `.update` registered handlers.
 *
 * @example
 * ```ts
 * // apps/www/convex/vex.ts
 * import { queryApi, mutationApi, globalsApi } from "@vexcms/core/server";
 * import { query, mutation } from "./_generated/server";
 * import config from "../src/vex.config";
 *
 * export const { find, get, search } = queryApi(config, query);
 * export const { create, update, remove } = mutationApi(config, mutation);
 * export const { globals } = globalsApi(config, query, mutation);
 * // → api.vex.globals.get, api.vex.globals.find, api.vex.globals.update
 * ```
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
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await getGlobal({
          auth,
          ctx,
          slug: args.slug as GlobalSlug,
          populate: args.populate,
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

/**
 * Resolves the current caller for RBAC enforcement — the single auth
 * resolution point every `collectionsApi` handler runs before its operation.
 *
 * Behavior by configuration:
 * - No `config.access` → RBAC is off. Returns `undefined` without ever
 *   calling `getAuth` — zero auth overhead for projects without access
 *   control.
 * - `config.access` set but no `getAuth` supplied → throws
 *   {@link VexAccessConfigError}. A permission matrix with no way to resolve
 *   callers is a project misconfiguration; failing loudly at the first
 *   request beats silently denying (or worse, allowing) everything.
 * - Both configured → returns whatever `getAuth(ctx)` resolves: the caller's
 *   user document and active organization, or `undefined` when the request
 *   is unauthenticated. Downstream checks treat `undefined` as a user with
 *   no roles — deny. If access.anonRole is configured, downstream checks will
 *   fallback to that role.
 *
 * Identity always derives from the handler's `ctx` (the authenticated Convex
 * connection), never from client-supplied arguments — see
 * {@link collectionsApi} for the trust-model rationale.
 *
 * @typeParam TDataModel - The project's generated Convex data model.
 * @param props - Resolution inputs.
 * @param props.config - The resolved `VexConfig`; only `config.access`'s
 *   presence is consulted here.
 * @param props.ctx - The current handler's query or mutation context.
 * @param props.getAuth - The project's server-side caller resolver (typically
 *   supplied by an auth plugin, e.g. `@vexcms/better-auth`).
 * @returns The resolved {@link VexApiAuth}, or `undefined` when RBAC is off
 *   or the request is unauthenticated.
 * @throws {VexAccessConfigError} When `config.access` is configured but no
 *   `getAuth` resolver was passed to `collectionsApi`.
 */
export async function resolveGetAuth<TDataModel extends GenericDataModel>({
  config,
  ctx,
  getAuth,
}: {
  config: VexConfig;
  ctx: GenericQueryCtx<TDataModel> | GenericMutationCtx<TDataModel>;
  getAuth?: (
    ctx: GenericQueryCtx<TDataModel> | GenericMutationCtx<TDataModel>,
  ) => Promise<VexApiAuth | undefined>;
}) {
  let auth: VexApiAuth | undefined = undefined;
  if (config.access !== undefined) {
    if (!getAuth) {
      throw new VexAccessConfigError(
        "getAuth not configured in collectionsApi. configure @ /src/convex/vex.ts",
      );
    }
    auth = await getAuth(ctx);
  }
  return auth;
}

// ── Bound server API ────────────────────────────────────────────────────────
//
// `config` is static for a project, but `auth` is per-request (it derives from
// `ctx`). So the factory binds `config` once and resolves `auth` on every call,
// which is why it takes a `getAuth` callback rather than an auth value.
//
// Core cannot discover `config` implicitly: it lives in the consumer's project,
// and a module-level singleton would be import-order dependent and untestable.
// Binding explicitly, once, in one project file is the tradeoff.

/**
 * Args accepted by a bound helper from {@link vexServerApi} — the
 * underlying server args minus `config` and `auth`, which the factory injects.
 *
 * @typeParam TArgs - The wrapped function's original server args.
 */
export type BoundServerArgs<TArgs> = Omit<TArgs, "auth" | "config">;

/**
 * Minimal shape the overloaded `find`/`search` wrappers destructure internally.
 * Not part of the public contract — {@link BoundFind} / {@link BoundSearch} are.
 *
 * @internal
 */
type BoundPassthroughArgs<DataModel extends GenericDataModel> = {
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;
  access?: AccessCallOptions;
};

/**
 * `find`, bound to a config/auth pair. Preserves both server overloads:
 * without `paginationOpts` the result is an array, with it a `PaginationResult`.
 *
 * Return types inline `DocReturnItem<…>[]` rather than naming `FindReturn` so
 * hover resolves to `Doc[]` — see the display note in `./types`.
 */
export interface BoundFind<DataModel extends GenericDataModel> {
  <
    TCollectionSlug extends CollectionSlug,
    const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
    const D extends number = 0,
  >(
    args: BoundServerArgs<FindServerArgs<DataModel, TCollectionSlug, TPopulate, D>> & {
      paginationOpts?: never;
    },
  ): Promise<DocReturnItem<TCollectionSlug, TPopulate, D>[]>;
  <
    TCollectionSlug extends CollectionSlug,
    const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
    const D extends number = 0,
  >(
    args: BoundServerArgs<FindServerArgs<DataModel, TCollectionSlug, TPopulate, D>> & {
      paginationOpts: PaginationOptions;
    },
  ): Promise<PaginationResult<DocReturnItem<TCollectionSlug, TPopulate, D>>>;
}

/** `search`, bound to a config/auth pair. Preserves both server overloads. */
export interface BoundSearch<DataModel extends GenericDataModel> {
  <
    TCollectionSlug extends CollectionSlug,
    const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
    const D extends number = 0,
  >(
    args: BoundServerArgs<SearchServerArgs<DataModel, TCollectionSlug, TPopulate, D>> & {
      paginationOpts?: never;
    },
  ): Promise<DocReturnItem<TCollectionSlug, TPopulate, D>[]>;
  <
    TCollectionSlug extends CollectionSlug,
    const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
    const D extends number = 0,
  >(
    args: BoundServerArgs<SearchServerArgs<DataModel, TCollectionSlug, TPopulate, D>> & {
      paginationOpts: PaginationOptions;
    },
  ): Promise<PaginationResult<DocReturnItem<TCollectionSlug, TPopulate, D>>>;
}

/**
 * The collection and globals surface returned by {@link vexServerApi},
 * with `config` and `auth` already applied. Every member keeps the slug,
 * populate, and depth generics of the function it wraps, so return types narrow
 * exactly as the unbound versions do.
 */
export interface VexServerApi<DataModel extends GenericDataModel> {
  /** Fetch one document by id. */
  get: <
    TCollectionSlug extends CollectionSlug,
    const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
    const D extends number = 0,
  >(
    args: BoundServerArgs<GetServerArgs<DataModel, TCollectionSlug, TPopulate, D>>,
  ) => Promise<GetReturn<TCollectionSlug, TPopulate, D>>;
  /** List documents, optionally paginated. */
  find: BoundFind<DataModel>;
  /** Text-search documents, optionally paginated. */
  search: BoundSearch<DataModel>;
  /** Insert a document; resolves to the new id. */
  create: <TCollectionSlug extends CollectionSlug>(
    args: BoundServerArgs<CreateServerArgs<DataModel, TCollectionSlug>>,
  ) => Promise<string>;
  /** Patch a document. */
  update: <TCollectionSlug extends CollectionSlug>(
    args: BoundServerArgs<UpdateServerArgs<DataModel, TCollectionSlug>>,
  ) => Promise<void>;
  /** Delete (or soft-delete) documents. */
  remove: <TCollectionSlug extends CollectionSlug>(
    args: BoundServerArgs<RemoveServerArgs<DataModel, TCollectionSlug>>,
  ) => Promise<void>;
  globals: {
    /** Fetch one global as a flat document. */
    get: <
      TSlug extends GlobalSlug,
      const TPopulate extends GlobalPopulateShape<TSlug> = Record<string, never>,
      const D extends number = 0,
    >(
      args: BoundServerArgs<GetGlobalServerArgs<DataModel, TSlug, TPopulate, D>>,
    ) => Promise<GetGlobalReturn<TSlug, TPopulate, D>>;
    /** List every saved global. Mixed-slug, so intentionally un-narrowed. */
    find: (
      args: BoundServerArgs<GenericGlobalsQueryServerArgs<DataModel>>,
    ) => Promise<VexDocumentGlobal[]>;
    /** Create or update a global; resolves to its id. */
    upsert: <TSlug extends GlobalSlug = GlobalSlug>(
      args: BoundServerArgs<UpsertGlobalServerArgs<DataModel, TSlug>>,
    ) => Promise<string>;
  };
}

/**
 * Binds `config` and a `getAuth` resolver to the whole server API, so callers
 * never pass either again.
 *
 * Without this, every call site must remember `config` *and* `auth`. Forgetting
 * `config` silently disables RBAC for that call; passing `config` without
 * `auth` denies (or throws) on every check. Binding once removes both failure
 * modes by construction.
 *
 * Call it once in the project and re-export the result:
 *
 * @typeParam DataModel - The project's generated Convex data model. Required —
 *   it cannot be inferred (`getAuth` is optional, so there is no reliable
 *   inference site), and letting it fall back to `GenericDataModel` produces a
 *   confusing `ctx` mismatch at every call site rather than an error here.
 * @param options - Binding inputs.
 * @param options.config - The resolved `VexConfig` from `defineConfig`.
 * @param options.getAuth - Resolves the caller from `ctx` on every call
 *   (typically `createGetAuth()` from an auth adapter). Required whenever
 *   `config.access` is set; {@link resolveGetAuth} throws if it is missing.
 * @returns The full {@link VexServerApi} with `config`/`auth` pre-applied.
 *
 * @example
 * ```ts
 * // convex/vexApi.ts — written once
 * import { vexServerApi } from "@vexcms/core/server";
 * import config from "~/vex.config";
 * import type { DataModel } from "./_generated/dataModel";
 * import { getAuth } from "./vexContext";
 *
 * export const { get, find, search, create, update, remove, globals } =
 *   vexServerApi<DataModel>({ config, getAuth });
 * ```
 *
 * ```ts
 * // anywhere else — no config, no auth, RBAC enforced
 * import { find } from "./vexApi";
 *
 * export const list = query({
 *   handler: async (ctx) => await find({ ctx, collection: "pages" }),
 * });
 * //         ^? Page[]
 *
 * // a genuinely public read, opted out explicitly
 * export const bySlug = query({
 *   args: { slug: v.string() },
 *   handler: async (ctx, args) =>
 *     await find({
 *       ctx,
 *       collection: "pages",
 *       withIndex: { name: "by_slug", range: (q) => q.eq("slug", args.slug) },
 *       limit: 1,
 *       access: { bypass: true },
 *     }),
 * });
 * ```
 *
 * @see {@link collectionsApi} to register the generic CRUD endpoints instead
 * @see {@link resolveGetAuth} for the per-call auth resolution this performs
 */
export function vexServerApi<DataModel extends GenericDataModel>(options: {
  config: VexConfig;
  getAuth?: (
    ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  ) => Promise<VexApiAuth | undefined>;
}): VexServerApi<DataModel> {
  const { config, getAuth } = options;

  /*
   * Resolves the `{ config, auth }` pair to inject for one call.
   */
  async function inject(
    ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
    bypassAccess?: boolean,
  ): Promise<{ config: VexConfig; auth: VexApiAuth | undefined }> {
    // The stripped config is used ONLY to resolve auth: `resolveGetAuth` returns
    // `undefined` without invoking `getAuth` when RBAC is off, so a bypassed call
    // costs no session lookup. The ORIGINAL config is what gets forwarded - the raw
    // function's `resolveAccessCall` enforces the bypass itself, and forwarding the
    // stripped config would make its dev guard see "bypass set but RBAC off" and
    // warn spuriously on every legitimate bypass. One enforcement seam, not two.
    const authConfig: VexConfig = bypassAccess === true ? { ...config, access: undefined } : config;
    return { config, auth: await resolveGetAuth({ ctx, config: authConfig, getAuth }) };
  }

  // Each wrapper below is a generic pass-through, so the spread of `rest` cannot
  // be re-checked against the callee's mutually-exclusive `populate`/`depth`
  // conditionals. The public signatures on `VexServerApi` are the contract; the
  // internal `as never` casts are confined to these five lines and mirror the
  // casts the underlying server functions already use.
  return {
    get: async (args) => {
      const { access, ...rest } = args;
      return (await get({
        access,
        ...rest,
        ...(await inject(rest.ctx, access?.bypass)),
      } as never)) as never;
    },
    // Cast to the overloaded interface: an implementation signature cannot be
    // structurally assignable to two call signatures at once.
    find: (async (args: BoundPassthroughArgs<DataModel>) => {
      const { access, ...rest } = args;
      return (await find({
        access,
        ...rest,
        ...(await inject(rest.ctx, access?.bypass)),
      } as never)) as never;
    }) as BoundFind<DataModel>,
    search: (async (args: BoundPassthroughArgs<DataModel>) => {
      const { access, ...rest } = args;
      return (await search({
        access,
        ...rest,
        ...(await inject(rest.ctx, access?.bypass)),
      } as never)) as never;
    }) as BoundSearch<DataModel>,
    create: async (args) => {
      const { access, ...rest } = args;
      return await create({
        access,
        ...rest,
        ...(await inject(rest.ctx, access?.bypass)),
      } as never);
    },
    update: async (args) => {
      const { access, ...rest } = args;
      return await update({
        access,
        ...rest,
        ...(await inject(rest.ctx, access?.bypass)),
      } as never);
    },
    remove: async (args) => {
      const { access, ...rest } = args;
      return await remove({
        access,
        ...rest,
        ...(await inject(rest.ctx, access?.bypass)),
      } as never);
    },
    globals: {
      get: async (args) => {
        const { access, ...rest } = args;
        return (await getGlobal({
          access,
          ...rest,
          ...(await inject(rest.ctx, access?.bypass)),
        } as never)) as never;
      },
      find: async (args) => {
        const { access, ...rest } = args;
        return await findGlobals({
          access,
          ...rest,
          ...(await inject(rest.ctx, access?.bypass)),
        } as never);
      },
      upsert: async (args) => {
        const { access, ...rest } = args;
        return await upsertGlobal({
          access,
          ...rest,
          ...(await inject(rest.ctx, access?.bypass)),
        } as never);
      },
    },
  };
}
