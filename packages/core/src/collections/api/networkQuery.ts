import type { FunctionReference, FunctionReturnType, OptionalRestArgs } from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug } from "../../types/generated";
import type { PaginationOptions, PopulateShape } from "../../db/types";
import type { VexWhere } from "../../db/queryArgs";
import { whereToNode } from "../../db/queryArgs";
import type { CollectionTableSort } from "../types";
import { vexConvexApi } from "../../vexConvexApi";
import type {
  DocReturnItem,
  FindReturn,
  FindReturnPaginated,
  GenericQueryClientParams,
  GetReturn,
  SearchReturn,
  SearchReturnPaginated,
  VexFindArgs,
  VexGetArgs,
  VexSearchArgs,
} from "./types";

/**
 * Converts a client `where` to the plain node the Convex function accepts.
 * A callback cannot cross the network; a node passes through unchanged.
 *
 * @param where - The caller's `where`, either form, or `undefined`.
 * @returns The plain node, or `undefined`.
 */
function whereArg<S extends string>(where: VexWhere<S> | undefined) {
  if (where === undefined) return undefined;
  return typeof where === "function" ? whereToNode<S>(where) : where;
}

/**
 * Client-side args for `find`. Extends {@link GenericQueryClientParams}
 * to inherit `ctx?: never`, `populate?: TPopulate`, `depth?: D`, and `skip?`.
 *
 * Shared by `@vexcms/react/client`'s `find()` (TanStack Query) and
 * {@link vexFindQuery} (direct network call — server components, scripts,
 * anywhere with a plain `{ query(ref, args) }` client).
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object, narrowed against `RelationshipKeysOf<TCollectionSlug>`.
 * @typeParam D - Depth literal (0 = none). Inferred from `depth`.
 */
export interface FindClientArgs<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug> = PopulateShape<TCollectionSlug>,
  D extends number = number,
> extends GenericQueryClientParams<TCollectionSlug, TPopulate, D> {
  collection: TCollectionSlug;
  limit?: number;
  /**
   * Predicate over the collection's fields: a builder callback or a plain node.
   * The callback is converted to a node before it is sent.
   */
  where?: VexWhere<TCollectionSlug>;
  /**
   * Portable sort — never an index name. Rejected
   * server-side together with a `search` call.
   */
  sort?: CollectionTableSort<string>;
  paginationOpts?: PaginationOptions;
}

/**
 * Client-side args for `find` with pagination options required. @see {@link FindClientArgs}
 */
export interface FindClientPaginatedArgs<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug> = PopulateShape<TCollectionSlug>,
  D extends number = number,
> extends GenericQueryClientParams<TCollectionSlug, TPopulate, D> {
  collection: TCollectionSlug;
  limit?: number;
  where?: VexWhere<TCollectionSlug>;
  sort?: CollectionTableSort<string>;
  paginationOpts: PaginationOptions;
}

/**
 * Client-side args for `get`. Extends {@link GenericQueryClientParams}
 * to inherit `ctx?: never`, `populate?: TPopulate`, and `depth?: D`.
 *
 * Shared by `@vexcms/react/client`'s `get()` (TanStack Query) and
 * {@link vexGetQuery} (direct network call).
 *
 * @typeParam TCollectionSlug - Collection slug, recovered from the `Id` brand.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = none). Inferred from `depth`.
 */
export interface GetClientArgs<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number = 0,
> extends GenericQueryClientParams<TCollectionSlug, TPopulate, D> {
  id: GenericId<TCollectionSlug>;
  collection: TCollectionSlug;
}

/**
 * Client-side args for `search`. @see {@link FindClientArgs}
 */
export interface SearchClientArgs<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number = number,
> extends GenericQueryClientParams<TCollectionSlug, TPopulate, D> {
  collection: TCollectionSlug;
  query: string;
  searchIndexName: string;
  searchField: string;
  limit?: number;
  where?: VexWhere<TCollectionSlug>;
  paginationOpts?: PaginationOptions;
}

/**
 * Client-side args for `search` with pagination options required. @see {@link SearchClientArgs}
 */
export interface SearchClientPaginatedArgs<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number = number,
> extends GenericQueryClientParams<TCollectionSlug, TPopulate, D> {
  collection: TCollectionSlug;
  query: string;
  searchIndexName: string;
  searchField: string;
  limit?: number;
  where?: VexWhere<TCollectionSlug>;
  paginationOpts: PaginationOptions;
}

/**
 * A plain Convex client's `query` method — `ConvexHttpClient`, `VexServerClient`
 * (`@vexcms/next`), `ConvexReactClient`, and `@convex-dev/react-query`'s
 * `convexQuery` loader all share this shape. {@link vexFindQuery},
 * {@link vexGetQuery}, and {@link vexSearchQuery} accept any of them.
 */
export interface VexNetworkQueryClient {
  query<Query extends FunctionReference<"query">>(
    query: Query,
    ...args: OptionalRestArgs<Query>
  ): Promise<FunctionReturnType<Query>>;
}

/**
 * Builds the `find` wire args — shared by `@vexcms/react/client`'s `find()`
 * and {@link vexFindQuery}. A plain function (not an overloaded one like its
 * callers): both consumers discriminate the paginated/array return shape at
 * their OWN call sites, so this just needs to carry every field through.
 *
 * @param args - The caller's `find` args (client-shaped: `collection`,
 *   `populate`, `depth`, `limit`, `where`, `drafts`, `paginationOpts`).
 * @returns The wire-shaped `VexFindArgs` to send over the network.
 */
export function buildFindArgs<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug>,
  const D extends number,
>(args: FindClientArgs<TCollectionSlug, TPopulate, D>): VexFindArgs {
  return {
    collection: args.collection,
    populate: args.populate,
    limit: args.limit,
    depth: args.depth,
    drafts: args.drafts,
    where: whereArg(args.where),
    paginationOpts: args.paginationOpts,
  };
}

/**
 * Builds the `search` wire args. @see {@link buildFindArgs}
 *
 * @param args - The caller's `search` args (client-shaped).
 * @returns The wire-shaped `VexSearchArgs` to send over the network.
 */
export function buildSearchArgs<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug>,
  const D extends number,
>(args: SearchClientArgs<TCollectionSlug, TPopulate, D>): VexSearchArgs {
  return {
    collection: args.collection,
    searchIndexName: args.searchIndexName,
    searchField: args.searchField,
    query: args.query,
    limit: args.limit,
    populate: args.populate,
    depth: args.depth,
    drafts: args.drafts,
    where: whereArg(args.where),
    paginationOpts: args.paginationOpts,
  };
}

/**
 * Casts `vexConvexApi.find` to the collection/populate/depth-narrowed type
 * for one call site. `api.vex.find` is one Convex function serving every
 * collection: its registered return type is fixed at codegen from the
 * handler, which only ever sees a runtime `collection` string — codegen can
 * never narrow it. This re-attaches the per-call-site type
 * (`TCollectionSlug`/`TPopulate`/`D`, all known at the TypeScript call site)
 * by casting the SAME function reference. Sound because the endpoint really
 * does return that collection's documents: the server `find` reads rows from
 * that table.
 *
 * @returns The `find` function reference, typed to `TCollectionSlug`/`TPopulate`/`D`.
 */
export function findFuncRef<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(): FunctionReference<"query", "public", VexFindArgs, FindReturn<TCollectionSlug, TPopulate, D>> {
  return vexConvexApi.find as FunctionReference<
    "query",
    "public",
    VexFindArgs,
    FindReturn<TCollectionSlug, TPopulate, D>
  >;
}

/**
 * Casts `vexConvexApi.get` to the collection/populate/depth-narrowed type for
 * one call site. @see {@link findFuncRef} for why the cast is sound.
 *
 * @returns The `get` function reference, typed to `TCollectionSlug`/`TPopulate`/`D`.
 */
export function getFuncRef<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(): FunctionReference<"query", "public", VexGetArgs, GetReturn<TCollectionSlug, TPopulate, D>> {
  return vexConvexApi.get as FunctionReference<
    "query",
    "public",
    VexGetArgs,
    GetReturn<TCollectionSlug, TPopulate, D>
  >;
}

/**
 * Casts `vexConvexApi.search` to the collection/populate/depth-narrowed type
 * for one call site. @see {@link findFuncRef} for why the cast is sound.
 *
 * @returns The `search` function reference, typed to `TCollectionSlug`/`TPopulate`/`D`.
 */
export function searchFuncRef<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(): FunctionReference<"query", "public", VexSearchArgs, SearchReturn<TCollectionSlug, TPopulate, D>> {
  return vexConvexApi.search as FunctionReference<
    "query",
    "public",
    VexSearchArgs,
    SearchReturn<TCollectionSlug, TPopulate, D>
  >;
}

/**
 * Builds the typed `get` funcRef + wire args pair.
 *
 * @param args - The caller's `get` args (client-shaped: `id`, `collection`,
 *   `populate`, `depth`).
 * @returns The `[funcRef, wireArgs]` pair for `client.query(...pair)`.
 */
export function buildGetQuery<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: GetClientArgs<TCollectionSlug, TPopulate, D>,
): readonly [FunctionReference<"query", "public", VexGetArgs, GetReturn<TCollectionSlug, TPopulate, D>>, VexGetArgs] {
  return [
    getFuncRef<TCollectionSlug, TPopulate, D>(),
    {
      id: args.id,
      collection: args.collection,
      populate: args.populate,
      depth: args.depth,
      drafts: args.drafts,
    },
  ] as const;
}

/**
 * Finds documents in a collection via a direct network call — any client
 * exposing a plain `query(ref, args)` method (`VexServerClient` from
 * `@vexcms/next`, `ConvexHttpClient`, `ConvexReactClient`). Typed to the
 * document of the `collection` slug passed in, populated per `populate`/`depth`,
 * with zero casts at the call site.
 *
 * For TanStack Query / React, use `find()` from `@vexcms/react/client` instead
 * — same typing, wrapped as query options.
 *
 * @param client - Any client exposing `query(ref, args)`.
 * @param args - `{ collection, populate?, depth?, limit?, where?, drafts?, paginationOpts? }`.
 * @returns The matching documents, or a `PaginationResult` when `paginationOpts` is given.
 * @example
 * ```ts
 * const posts = await vexFindQuery(vex, { collection: "posts" });
 * //    ^? Post[]
 *
 * const withAuthor = await vexFindQuery(vex, {
 *   collection: "posts",
 *   populate: { author: true },
 * });
 * //    ^? (Post & { author: Author[] })[]
 * ```
 */
export function vexFindQuery<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  client: VexNetworkQueryClient,
  args: FindClientArgs<TCollectionSlug, TPopulate, D> & { paginationOpts?: never },
): Promise<DocReturnItem<TCollectionSlug, TPopulate, D>[]>;
export function vexFindQuery<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  client: VexNetworkQueryClient,
  args: FindClientPaginatedArgs<TCollectionSlug, TPopulate, D>,
): Promise<FindReturnPaginated<TCollectionSlug, TPopulate, D>>;
/**
 * Implementation signature for the two `vexFindQuery` overloads above — not
 * called directly with this shape. See the overloads for the public contract.
 *
 * @param client - Any client exposing `query(ref, args)`.
 * @param args - `{ collection, populate?, depth?, limit?, where?, drafts?, paginationOpts? }`.
 * @returns The matching documents, or a `PaginationResult` when `paginationOpts` is given.
 */
export function vexFindQuery<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(client: VexNetworkQueryClient, args: FindClientArgs<TCollectionSlug, TPopulate, D>): Promise<unknown> {
  return client.query(findFuncRef<TCollectionSlug, TPopulate, D>(), buildFindArgs(args));
}

/**
 * Fetches a single document by ID via a direct network call. @see {@link vexFindQuery}
 * for the client contract and why the funcRef cast is sound.
 *
 * @param client - Any client exposing `query(ref, args)`.
 * @param args - `{ id, collection, populate?, depth? }`.
 * @returns The document, or `null` when no document matches `id`.
 * @example
 * ```ts
 * const post = await vexGetQuery(vex, { id: postId, collection: "posts" });
 * //    ^? Post | null
 * ```
 */
export function vexGetQuery<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  client: VexNetworkQueryClient,
  args: GetClientArgs<TCollectionSlug, TPopulate, D>,
): Promise<GetReturn<TCollectionSlug, TPopulate, D>> {
  const [funcRef, queryArgs] = buildGetQuery(args);
  return client.query(funcRef, queryArgs);
}

/**
 * Searches documents in a collection by a search index via a direct network
 * call. @see {@link vexFindQuery} for the client contract and why the funcRef
 * cast is sound.
 *
 * @param client - Any client exposing `query(ref, args)`.
 * @param args - `{ collection, searchIndexName, searchField, query, populate?, depth?, limit?, where?, drafts?, paginationOpts? }`.
 * @returns The matching documents, or a `PaginationResult` when `paginationOpts` is given.
 */
export function vexSearchQuery<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  client: VexNetworkQueryClient,
  args: SearchClientArgs<TCollectionSlug, TPopulate, D> & { paginationOpts?: never },
): Promise<DocReturnItem<TCollectionSlug, TPopulate, D>[]>;
export function vexSearchQuery<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  client: VexNetworkQueryClient,
  args: SearchClientPaginatedArgs<TCollectionSlug, TPopulate, D>,
): Promise<SearchReturnPaginated<TCollectionSlug, TPopulate, D>>;
/**
 * Implementation signature for the two `vexSearchQuery` overloads above — not
 * called directly with this shape. See the overloads for the public contract.
 *
 * @param client - Any client exposing `query(ref, args)`.
 * @param args - `{ collection, searchIndexName, searchField, query, populate?, depth?, limit?, where?, drafts?, paginationOpts? }`.
 * @returns The matching documents, or a `PaginationResult` when `paginationOpts` is given.
 */
export function vexSearchQuery<
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(client: VexNetworkQueryClient, args: SearchClientArgs<TCollectionSlug, TPopulate, D>): Promise<unknown> {
  return client.query(searchFuncRef<TCollectionSlug, TPopulate, D>(), buildSearchArgs(args));
}
