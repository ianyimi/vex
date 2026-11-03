import { type GenericDataModel, GenericQueryCtx, GenericMutationCtx } from "convex/server";
import type { VexConfig } from "./config";
import type {
  CollectionSlug,
  GlobalPopulateShape,
  GlobalSlug,
  VexDataModel,
  VexDocumentGlobal,
  VexMutationCtx,
  VexQueryCtx,
} from "./types/generated";
import type {
  AccessCallOptions,
  PaginationOptions,
  PaginationResult,
  PopulateShape,
  VexApiAuth,
} from "./db/types";
import type { DocReturnItem, GetReturn } from "./collections/api/types";
import { VexAccessConfigError } from "./access";

import {
  find,
  type FindServerArgs,
  get,
  type GetServerArgs,
  search,
  type SearchServerArgs,
  publishedSlugs,
  type PublishedSlug,
  type PublishedSlugsServerArgs,
  create,
  type CreateServerArgs,
  update,
  type UpdateServerArgs,
  remove,
  type RemoveServerArgs,
  collectionsApi,
} from "./collections/api";
import {
  getGlobal,
  type GetGlobalServerArgs,
  type GetGlobalReturn,
  findGlobals,
  upsertGlobal,
  type UpsertGlobalServerArgs,
  type GenericGlobalsQueryServerArgs,
  globalsApi,
} from "./globals/api";
import {
  saveDraft,
  type SaveDraftServerArgs,
  publish,
  type PublishServerArgs,
  unpublish,
  type UnpublishServerArgs,
  listVersions,
  type ListVersionsServerArgs,
  getVersionSnapshot,
  type GetVersionSnapshotServerArgs,
  type VersionSnapshotResult,
  deleteVersion,
  type DeleteVersionServerArgs,
  backfillStatus,
  type BackfillStatusServerArgs,
  type BackfillStatusResult,
  versionsApi,
} from "./versions/api";
import type { QueryIndexFieldsFor, VexWhere, VexWhereNode, VexWithIndex } from "./db/queryArgs";
import {
  assertUniqueAmongPublished,
  type AssertUniqueAmongPublishedArgs,
} from "./versions/assertUniqueAmongPublished";
import type { VersionSummary } from "./versions";

export { resolveLivePreviewUrlServer as resolveLivePreviewUrlOnServer } from "./livePreview/api/resolve/server";
export { buildDepthPopulate } from "./db/depth";

export { find, get, search, publishedSlugs, create, update, remove, collectionsApi };
export type {
  FindServerArgs,
  GetServerArgs,
  SearchServerArgs,
  PublishedSlug,
  PublishedSlugsServerArgs,
  CreateServerArgs,
  UpdateServerArgs,
  RemoveServerArgs,
};
export type { QueryIndexFieldsFor, VexWhere, VexWhereNode, VexWithIndex };

export { getGlobal, findGlobals, upsertGlobal, globalsApi };
export type { GetGlobalServerArgs, UpsertGlobalServerArgs };

export { saveDraft, publish, unpublish, versionsApi };
export type { SaveDraftServerArgs, PublishServerArgs, UnpublishServerArgs };
export { assertUniqueAmongPublished };
export type { AssertUniqueAmongPublishedArgs };
export { listVersions };
export type { ListVersionsServerArgs };
export type { VersionSummary };
export { getVersionSnapshot };
export type { GetVersionSnapshotServerArgs, VersionSnapshotResult };
export { deleteVersion };
export type { DeleteVersionServerArgs };
export { backfillStatus };
export type { BackfillStatusServerArgs, BackfillStatusResult };

export { createVexMutations } from "./db/triggers";

/**
 * Read-only VexCMS API handed to config callbacks beside the raw Convex `ctx`.
 *
 * Exists because `ctx` is the lowest common denominator — see this type's
 * original docstring (carried over unchanged from `api/server.ts`) for the
 * full read-only / no-`ctx`-member rationale.
 */
export interface VexCallbackApi {
  find<
    TCollectionSlug extends CollectionSlug,
    const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
    const D extends number = 0,
  >(
    args: Omit<FindServerArgs<VexDataModel, TCollectionSlug, TPopulate, D>, "ctx" | "config"> & {
      paginationOpts?: never;
    },
  ): Promise<DocReturnItem<TCollectionSlug, TPopulate, D>[]>;
  find<
    TCollectionSlug extends CollectionSlug,
    const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
    const D extends number = 0,
  >(
    args: Omit<FindServerArgs<VexDataModel, TCollectionSlug, TPopulate, D>, "ctx" | "config"> & {
      paginationOpts: PaginationOptions;
    },
  ): Promise<PaginationResult<DocReturnItem<TCollectionSlug, TPopulate, D>>>;

  get<
    TCollectionSlug extends CollectionSlug,
    const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
    const D extends number = 0,
  >(
    args: Omit<GetServerArgs<VexDataModel, TCollectionSlug, TPopulate, D>, "ctx" | "config">,
  ): Promise<GetReturn<TCollectionSlug, TPopulate, D>>;

  search<
    TCollectionSlug extends CollectionSlug,
    const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
    const D extends number = 0,
  >(
    args: Omit<SearchServerArgs<VexDataModel, TCollectionSlug, TPopulate, D>, "ctx" | "config">,
  ): Promise<DocReturnItem<TCollectionSlug, TPopulate, D>[]>;

  globals: {
    get<
      TGlobalSlug extends GlobalSlug,
      TPopulate extends GlobalPopulateShape<TGlobalSlug> = Record<string, never>,
      D extends number = 0,
    >(
      args: Omit<GetGlobalServerArgs<VexDataModel, TGlobalSlug, TPopulate, D>, "ctx" | "config">,
    ): Promise<GetGlobalReturn<TGlobalSlug, TPopulate, D>>;

    find(
      args?: Omit<GenericGlobalsQueryServerArgs<VexDataModel>, "ctx" | "config">,
    ): Promise<VexDocumentGlobal[]>;
  };
}

/**
 * Builds the {@link VexCallbackApi} handed to one config-callback invocation.
 * Unchanged from `api/server.ts` — a plain object of bound closures over
 * `ctx`/`config`, never re-exposing `ctx` itself.
 *
 * @param props - The request's `ctx` and the project's resolved `config`.
 * @returns The bound `find`/`get`/`search`/`globals.get`/`globals.find` callbacks.
 */
export function createVexCallbackApi(props: {
  ctx: VexQueryCtx | VexMutationCtx;
  config: VexConfig;
}): VexCallbackApi {
  const { ctx, config } = props;
  const withAccess = (access?: AccessCallOptions) => access ?? { bypass: true as const };

  return {
    find: ((args: { access?: AccessCallOptions }) =>
      find({
        ...args,
        ctx,
        config,
        access: withAccess(args.access),
      } as never)) as unknown as VexCallbackApi["find"],
    get: ((args: { access?: AccessCallOptions }) =>
      get({
        ...args,
        ctx,
        config,
        access: withAccess(args.access),
      } as never)) as unknown as VexCallbackApi["get"],
    search: ((args: { access?: AccessCallOptions }) =>
      search({
        ...args,
        ctx,
        config,
        access: withAccess(args.access),
      } as never)) as unknown as VexCallbackApi["search"],
    globals: {
      get: ((args: { access?: AccessCallOptions }) =>
        getGlobal({
          ...args,
          ctx,
          config,
          access: withAccess(args.access),
        } as never)) as unknown as VexCallbackApi["globals"]["get"],
      find: ((args?: { access?: AccessCallOptions }) =>
        findGlobals({
          ...args,
          ctx,
          config,
          access: withAccess(args?.access),
        } as never)) as unknown as VexCallbackApi["globals"]["find"],
    },
  };
}

/**
 * Resolves the current caller for RBAC enforcement. Unchanged from
 * `api/server.ts` — see its original docstring for the full no-`config.access`
 * / missing-`getAuth` / resolved-`undefined` behavior matrix.
 *
 * @returns The resolved {@link VexApiAuth}, or `undefined` when `config.access` is unset.
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
// `config` is static for a project, but `auth` is per-request (it derives from
// `ctx`). See this section's original comment in `api/server.ts` for the full
// rationale — unchanged by this move.

/** A server API args shape with the bound `auth`/`config` omitted — those are supplied by {@link vexServerApi}, not the caller. */
export type BoundServerArgs<TArgs> = Omit<TArgs, "auth" | "config">;

type BoundPassthroughArgs<DataModel extends GenericDataModel> = {
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;
  access?: AccessCallOptions;
};

/** The bound, overloaded `find` signature {@link VexServerApi} exposes — paginated when `paginationOpts` is given, an array otherwise. */
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

/** The bound, overloaded `search` signature {@link VexServerApi} exposes — paginated when `paginationOpts` is given, an array otherwise. */
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

/** The full server API {@link vexServerApi} returns — every collection/global op, bound to `config` and a resolved `auth`. */
export interface VexServerApi<DataModel extends GenericDataModel> {
  get: <
    TCollectionSlug extends CollectionSlug,
    const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
    const D extends number = 0,
  >(
    args: BoundServerArgs<GetServerArgs<DataModel, TCollectionSlug, TPopulate, D>>,
  ) => Promise<GetReturn<TCollectionSlug, TPopulate, D>>;
  find: BoundFind<DataModel>;
  search: BoundSearch<DataModel>;
  create: <TCollectionSlug extends CollectionSlug>(
    args: BoundServerArgs<CreateServerArgs<DataModel, TCollectionSlug>>,
  ) => Promise<string>;
  update: <TCollectionSlug extends CollectionSlug>(
    args: BoundServerArgs<UpdateServerArgs<DataModel, TCollectionSlug>>,
  ) => Promise<void>;
  remove: <TCollectionSlug extends CollectionSlug>(
    args: BoundServerArgs<RemoveServerArgs<DataModel, TCollectionSlug>>,
  ) => Promise<void>;
  publishedSlugs: <TCollectionSlug extends CollectionSlug>(
    args: BoundServerArgs<PublishedSlugsServerArgs<DataModel, TCollectionSlug>>,
  ) => Promise<PublishedSlug[]>;
  globals: {
    get: <
      TSlug extends GlobalSlug,
      const TPopulate extends GlobalPopulateShape<TSlug> = Record<string, never>,
      const D extends number = 0,
    >(
      args: BoundServerArgs<GetGlobalServerArgs<DataModel, TSlug, TPopulate, D>>,
    ) => Promise<GetGlobalReturn<TSlug, TPopulate, D>>;
    find: (
      args: BoundServerArgs<GenericGlobalsQueryServerArgs<DataModel>>,
    ) => Promise<VexDocumentGlobal[]>;
    upsert: <TSlug extends GlobalSlug = GlobalSlug>(
      args: BoundServerArgs<UpsertGlobalServerArgs<DataModel, TSlug>>,
    ) => Promise<string>;
  };
}

/**
 * Binds `config` and a `getAuth` resolver to the whole server API. Unchanged
 * from `api/server.ts` — see its original docstring for the full rationale
 * and usage example.
 *
 * @returns The bound {@link VexServerApi}, every op scoped to `config` and a resolved `auth`.
 */
export function vexServerApi<DataModel extends GenericDataModel>(options: {
  config: VexConfig;
  getAuth?: (
    ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  ) => Promise<VexApiAuth | undefined>;
}): VexServerApi<DataModel> {
  const { config, getAuth } = options;

  async function inject(
    ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
    bypassAccess?: boolean,
  ): Promise<{ config: VexConfig; auth: VexApiAuth | undefined }> {
    const authConfig: VexConfig = bypassAccess === true ? { ...config, access: undefined } : config;
    return { config, auth: await resolveGetAuth({ ctx, config: authConfig, getAuth }) };
  }

  return {
    get: async (args) => {
      const { access, ...rest } = args;
      return (await get({
        access,
        ...rest,
        ...(await inject(rest.ctx, access?.bypass)),
      } as never)) as never;
    },
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
    publishedSlugs: (args) => publishedSlugs(args),
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
