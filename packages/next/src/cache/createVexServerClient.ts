import type { FunctionReference, OptionalRestArgs } from "convex/server";

import { ConvexHttpClient } from "convex/browser";
import { cache } from "react";

import type { VexServerClientOptions, VexServerClient } from "./types";

/**
 * Creates a server-only Convex read client safe to use in prerenderable
 * Next.js routes.
 *
 * Wraps `ConvexHttpClient` from `convex/browser` instead of `convex/nextjs`'s
 * `fetchQuery`, which hard-codes `client.setFetchOptions({ cache: "no-store" })`
 * — the reason every route calling it builds dynamic (`ƒ`). This client never
 * sets that option, so a route calling only `query()` can be prerendered and
 * governed by the route's own `export const revalidate`.
 *
 * Every `query()` call is deduped via `React.cache` for the lifetime of one
 * request: two identical `(query, args)` calls — e.g. `generateMetadata` and
 * its page both reading the same document — resolve from a single Convex round
 * trip instead of two.
 *
 * `React.cache` is instantiated fresh inside every `createVexServerClient()`
 * call, so that dedupe only holds across calls sharing the SAME client
 * instance — two clients built in two different modules cannot share a round
 * trip even when they read identical `(query, args)`. Each app therefore
 * creates exactly one instance, exported from its own `src/lib/vex.ts`, and
 * every route or component imports that shared `vex` rather than calling
 * `createVexServerClient()` itself.
 *
 * @param props - Client configuration.
 * @returns A {@link VexServerClient} whose `query` method is deduped per request.
 * @throws {Error} When no `url` is given and `process.env.NEXT_PUBLIC_CONVEX_URL`
 *   is unset.
 */
export function createVexServerClient(props: VexServerClientOptions = {}): VexServerClient {
  const url = props.url ?? process.env.NEXT_PUBLIC_CONVEX_URL;
  if (url === undefined || url === "") {
    throw new Error(
      "createVexServerClient: no Convex deployment URL. Pass `url`, or set NEXT_PUBLIC_CONVEX_URL.",
    );
  }

  const client = new ConvexHttpClient(url, {
    skipConvexDeploymentUrlCheck: props.skipConvexDeploymentUrlCheck,
  });

  // Deliberately NOT `client.setFetchOptions({ cache: "no-store" })` — that is
  // exactly what `convex/nextjs`'s `fetchQuery` does and what forces every
  // consuming route dynamic.

  // `React.cache` keys on the argument list, so the entry is (query reference,
  // args) — never the reference alone. Args are normalised to a single value so
  // `query(fn)` and `query(fn, {})` share one entry.
  const cachedQuery = cache(
    async (query: FunctionReference<"query">, args: unknown): Promise<unknown> =>
      client.query(query, args as OptionalRestArgs<FunctionReference<"query">>[0]),
  );

  return {
    query: async (query, ...args) => cachedQuery(query, args[0] ?? {}),
  };
}
