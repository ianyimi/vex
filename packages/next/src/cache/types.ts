import type { FunctionReference, FunctionReturnType, OptionalRestArgs } from "convex/server";

/**
 * Construction options for {@link createVexServerClient}.
 *
 * Nothing here configures caching — the client's only cache behaviour is that
 * it never sets `cache: "no-store"` and dedupes per request via `React.cache`.
 * Cache *policy* lives where Next requires it: `export const revalidate` in
 * each route.
 */
export interface VexServerClientOptions {
  /**
   * Skip Convex's deployment URL format check — for self-hosted backends whose
   * URL does not match `https://<name>.convex.cloud`.
   */
  skipConvexDeploymentUrlCheck?: boolean;
  /** Convex deployment URL. Defaults to `process.env.NEXT_PUBLIC_CONVEX_URL`. */
  url?: string;
}

/**
 * Server-only Convex read client returned by {@link createVexServerClient}.
 *
 * Exposes only `query` — this client is for prerenderable read paths, and it
 * never sets `cache: "no-store"`, unlike `convex/nextjs`'s `fetchQuery`.
 */
export interface VexServerClient {
  /**
   * Runs a Convex query, deduped via `React.cache` for the lifetime of one
   * request when called again with the same function reference and args.
   *
   * @param query - The Convex query function reference to call.
   * @param args - Arguments for `query`, per Convex's `OptionalRestArgs`.
   * @returns The query's resolved return value.
   */
  query<Query extends FunctionReference<"query">>(
    query: Query,
    ...args: OptionalRestArgs<Query>
  ): Promise<FunctionReturnType<Query>>;
}
