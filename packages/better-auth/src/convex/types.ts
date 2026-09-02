import type {
  MutationBuilder,
  QueryBuilder,
  GenericDataModel,
  FunctionReference,
  GenericActionCtx,
} from "convex/server";

/**
 * The DB operation function signatures — typed as `FunctionReference` to match
 * `internal.auth.db.*` in the user's project. These are the "registered"
 * mutation/query types that `ctx.runMutation` and `ctx.runQuery` accept.
 *
 * Follows the same pattern as `VexFindRef`, `VexCreateRef`, etc. in
 * `@vexcms/core/src/convex/index.ts`.
 */
export type BetterAuthDbHandlers = {
  dbCreate: FunctionReference<
    "mutation",
    "internal",
    {
      betterAuthSchema: string;
      data: unknown;
      model: string;
      select?: string[];
    },
    unknown
  >;
  dbFindOne: FunctionReference<
    "query",
    "internal",
    {
      betterAuthSchema: string;
      model: string;
      select?: string[];
      where: unknown[];
    },
    unknown
  >;
  dbFindMany: FunctionReference<
    "query",
    "internal",
    {
      betterAuthSchema: string;
      model: string;
      limit?: number;
      sortBy?: { direction: "asc" | "desc"; field: string };
      where?: unknown[];
    },
    unknown[]
  >;
  dbCount: FunctionReference<
    "query",
    "internal",
    { betterAuthSchema: string; model: string; where?: unknown[] },
    number
  >;
  dbUpdate: FunctionReference<
    "mutation",
    "internal",
    {
      betterAuthSchema: string;
      model: string;
      update: unknown;
      where: unknown[];
    },
    unknown
  >;
  dbUpdateMany: FunctionReference<
    "mutation",
    "internal",
    {
      betterAuthSchema: string;
      model: string;
      update: unknown;
      where: unknown[];
    },
    number
  >;
  dbDelete: FunctionReference<
    "mutation",
    "internal",
    { betterAuthSchema: string; model: string; where: unknown[] },
    void
  >;
  dbDeleteMany: FunctionReference<
    "mutation",
    "internal",
    { betterAuthSchema: string; model: string; where: unknown[] },
    number
  >;
};

/**
 * Arguments to `createBetterAuthAdapter` — follows the same pattern as
 * `queryApi` and `mutationApi` in `@vexcms/core/src/convex/server.ts`.
 *
 * The factory accepts the user's Convex `internalMutation`/`internalQuery`
 * builders so this package can create the DB mutations/queries without
 * hardcoding paths. Visibility is always `"internal"` for better-auth.
 *
 * @typeParam DataModel - The user's Convex DataModel (from `_generated/dataModel`).
 */
export type CreateBetterAuthAdapterArgs<DataModel extends GenericDataModel> = {
  /** The user's `internalMutation` from `convex/_generated/server`. */
  internalMutation: MutationBuilder<DataModel, "internal">;
  /** The user's `internalQuery` from `convex/_generated/server`. */
  internalQuery: QueryBuilder<DataModel, "internal">;
};

/**
 * Return value from `createBetterAuthAdapter`.
 *
 * Export `db` so `ctx.runMutation(internal.auth.db.dbX, ...)` call sites
 * continue to work — the adapter calls these via `ctx.runMutation` and
 * `ctx.runQuery`.
 */
export type CreateBetterAuthAdapterResult = {
  /** The Better Auth database adapter. Pass to `betterAuth({ database: adapter })`. */
  // Using 'any' because createAdapterFactory returns AdapterFactory which
  // is compatible but not directly assignable to DBAdapter in the type system.
  adapter: any;
  /** DB operations typed as `FunctionReference<"mutation" | "query", "internal">`. */
  db: BetterAuthDbHandlers;
};

/**
 * Factory function signature — follows the same pattern as `queryApi` in
 * `@vexcms/core/src/convex/server.ts`.
 *
 * @typeParam DataModel - The user's Convex DataModel (from `_generated/dataModel`).
 * @param ctx - The Convex action context.
 * @param args.internalMutation - The user's `internalMutation` from `convex/_generated/server`.
 * @param args.internalQuery - The user's `internalQuery` from `convex/_generated/server`.
 * @returns `{ adapter, db }` — export `db` so internal.auth.db.* call sites work.
 */
export interface CreateBetterAuthAdapter {
  <DataModel extends GenericDataModel>(
    ctx: GenericActionCtx<DataModel>,
    args: CreateBetterAuthAdapterArgs<DataModel>,
  ): CreateBetterAuthAdapterResult;
}
