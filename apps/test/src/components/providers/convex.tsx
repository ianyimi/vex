"use client";

import type { ReactNode } from "react";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexReactClient } from "convex/react";

import { authClient } from "~/auth/client";
import { env } from "~/env.mjs";

function makeClients() {
  const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL, { expectAuth: true });
  const convexQueryClient = new ConvexQueryClient(convex);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: convexQueryClient.queryFn(),
        queryKeyHashFn: convexQueryClient.hashFn(),
        // Deterministic: a thrown ConvexError re-fails identically, so retrying
        // only delays the error reaching `error` (it sits in `failureReason`
        // while retrying).
        retry: false,
        // Convex queries ride the Convex WebSocket, not `fetch`, so TanStack's
        // `onlineManager` must never gate them: a paused query stays
        // `status: "pending"` / `error: null` forever and ignores `retry`.
        networkMode: "always",
      },
    },
  });
  convexQueryClient.connect(queryClient);
  return { convex, queryClient };
}

let browserClients: ReturnType<typeof makeClients> | undefined;

/**
 * Wires Convex, TanStack Query, and Better Auth together for the app.
 *
 * Clients are module-level singletons connected synchronously so Convex
 * reactive subscriptions are established before any query is added to the
 * TanStack Query cache. See module-level comment above.
 *
 * @param props.children - The subtree that needs Convex and query access.
 */
export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  const { convex, queryClient } = getClients();
  return (
    <ConvexBetterAuthProvider authClient={authClient} client={convex}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ConvexBetterAuthProvider>
  );
}

function getClients() {
  if (typeof window === "undefined") {
    // Server: brand-new clients every request → no cross-request cache leak
    return makeClients();
  }
  // Browser: singleton → preserves Convex WebSocket reactivity
  browserClients ??= makeClients();
  return browserClients;
}
