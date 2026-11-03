import { defaultShouldDehydrateQuery, hashKey, QueryClient } from "@tanstack/react-query";
import { getFunctionName } from "convex/server";
import { convexToJson } from "convex/values";
import type { FunctionReference } from "convex/server";
import { cache } from "react";

/**
 * Builds the SAME query key shape `@convex-dev/react-query`'s `convexQuery(funcRef, args)`
 * produces (`["convexQuery", functionName, args]`) — WITHOUT importing `convex/react` (its
 * own `ConvexQueryClient`/`ConvexReactClient` transitively call `React.createContext`, a
 * client-only API that crashes a Server Component import graph: "createContext only works
 * in Client Components", confirmed live). `getFunctionName`/`convexToJson` are the same
 * underlying helpers `convexQuery` itself uses, from `convex/server`/`convex/values` — both
 * server-safe, pure metadata/serialization functions with no live client involved.
 *
 * Required for `<HydrationBoundary>` to be found at all by the client's own
 * `useSuspenseQuery(convexQuery(sameFn, sameArgs))` call — the two sides must agree on this
 * key byte-for-byte (after hashing, below) or hydration silently misses and the client
 * re-fetches from scratch.
 *
 * @param funcRef - The Convex query function reference (e.g. `vexConvexApi.findPaginated`).
 * @param args - Its arguments.
 * @returns The `["convexQuery", functionName, args]` key tuple.
 */
export function convexServerQueryKey(
  funcRef: FunctionReference<"query">,
  args: Record<string, unknown>,
): readonly [string, string, Record<string, unknown>] {
  return ["convexQuery", getFunctionName(funcRef), args] as const;
}

/**
 * Hashes a query key EXACTLY the way `ConvexQueryClient.hashFn()` does for a Convex key
 * (`convexQuery|<functionName>|<JSON args>`), falling back to TanStack's own default
 * `hashKey` for any other (non-Convex) key — same two-branch shape as the original, just
 * without needing a live `ConvexQueryClient` instance to call `.hashFn()` on (see
 * `convexServerQueryKey`'s own doc comment for why that import is server-unsafe).
 *
 * @param queryKey - Any TanStack Query key.
 * @returns The hashed string TanStack Query uses as this key's cache map key.
 */
function serverQueryKeyHashFn(queryKey: readonly unknown[]): string {
  if (queryKey.length >= 2 && queryKey[0] === "convexQuery") {
    return `convexQuery|${getFunctionName(queryKey[1] as FunctionReference<"query">)}|${JSON.stringify(convexToJson(queryKey[2] as Parameters<typeof convexToJson>[0]))}`;
  }
  return hashKey(queryKey);
}

/**
 * Per-request `QueryClient` for the TanStack Query v5 + Next.js App Router streaming-SSR
 * pattern (https://tanstack.com/query/v5/docs/framework/react/guides/advanced-ssr#streaming-with-server-components):
 * `NextAdminPage` calls `queryClient.prefetchQuery(...)` WITHOUT awaiting it, then wraps its
 * return value in `<HydrationBoundary state={dehydrate(queryClient)}>` — the still-pending
 * promise streams to the client as a LATER chunk instead of blocking the whole response, and
 * the client's own `useSuspenseQuery(convexQuery(...))` (same `queryKey`) picks it up via
 * `<HydrationBoundary>`'s hydration (ambient `QueryClientProvider`, mounted by the app's own
 * client providers — this server-only client is NEVER rendered to the page, it only exists to
 * prefetch into and dehydrate).
 *
 * `cache()`-scoped so every `NextAdminPage`/`page.tsx` call within ONE request shares the SAME
 * client (one `dehydrate()` at the end serializes every query prefetched anywhere in the
 * request), and a NEW one is built for the next request — no cross-request cache leak (the same
 * reasoning as `apps/*‍/src/components/providers/convex.tsx`'s own server branch).
 *
 * `shouldDehydrateQuery` additionally includes PENDING queries (TanStack's own default only
 * dehydrates settled ones) — required for the "don't await the prefetch" half of the pattern;
 * without it, an unawaited `prefetchQuery` call would dehydrate nothing and the client would
 * silently re-fetch from scratch, defeating the whole point.
 *
 * Every actual server-side fetch goes through `fetchQuery` (`convex/nextjs`) as the
 * `prefetchQuery` call's own `queryFn` — this module never touches `convex/react`/a live
 * `ConvexReactClient` at all (see `convexServerQueryKey`'s doc comment).
 */
export const getServerQueryClient = cache((): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Matches `apps/*‍/src/components/providers/convex.tsx`'s client `QueryClient`, so a
        // Convex query's dehydrated key hashes identically on both sides — required for
        // hydration to find it rather than silently re-fetching.
        queryKeyHashFn: serverQueryKeyHashFn,
        retry: false,
      },
      dehydrate: {
        // `pending`: TanStack's own default only dehydrates settled queries — required for
        // the "don't await the prefetch" half of the pattern, see above. `error`: a Convex
        // query that genuinely fails (e.g. `UNINDEXED_SORT`) settles to "error" by the time
        // `dehydrate()` runs (several awaits/microtasks after the un-awaited `prefetchQuery`
        // call) — WITHOUT this, `defaultShouldDehydrateQuery` excludes it entirely (only
        // "success" dehydrates by default), so the client's `useSuspenseQuery` would silently
        // re-fetch from scratch and hit the identical error a second time — functionally fine
        // (the client already handles its own error the same way, `ListViewQueryError`), but a
        // wasted round trip; including "error" here lets the dehydrated failure reach the
        // client directly, no second Convex call needed.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending" || query.state.status === "error",
        // Next.js detects dynamic rendering via a thrown error during render; redacting it
        // here (TanStack's own default) would hide that signal from Next.js.
        shouldRedactErrors: () => false,
      },
    },
  });
});
