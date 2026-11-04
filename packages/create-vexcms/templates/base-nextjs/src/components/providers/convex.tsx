"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexReactClient } from "convex/react";
import { AuthTransitionProvider, useAuthTransition } from "@vexcms/react";

import { authClient } from "~/auth/client";
import { AUTH_COOKIE_PREFIX } from "~/db/constants";
import { env } from "~/env.mjs";

/**
 * Whether this browser is carrying an existing Better Auth session cookie
 * for this app (`<prefix>.session_token`, or `__Secure-<prefix>.session_token`
 * over https — see `AUTH_COOKIE_PREFIX`). A synchronous `document.cookie`
 * check, not a session fetch: it only needs to be right about "a session
 * might exist," not decode or validate the cookie.
 */
function hasSessionCookie() {
  if (typeof document === "undefined") {
    return false;
  }
  const name = `${AUTH_COOKIE_PREFIX}.session_token`;
  return new RegExp(`(?:^|;\\s*)(?:__Secure-)?${name}=`).test(document.cookie);
}

/**
 * Releases an `expectAuth`-paused socket for a visitor whose session cookie
 * turned out to be stale (deleted/expired server-side, but still present in
 * the browser — e.g. the proxy no longer deletes it on an invalid session).
 * `ConvexProviderWithAuth` (convex/react) only ever calls `client.setAuth()`
 * — the only thing that calls the sync layer's `resumeSocket()` — when it
 * resolves an AUTHENTICATED session; for "Better Auth has definitively
 * resolved: no session," it never calls anything, so an `expectAuth`-paused
 * socket stays paused forever (same hang `hasSessionCookie` exists to avoid
 * for the common no-cookie-at-all case, reached here instead via a cookie
 * that exists but doesn't resolve).
 *
 * `client.setAuth(fetchToken, onChange)` → convex's
 * `AuthenticationManager.setConfig()` calls `resumeSocket()` unconditionally
 * at the end, even when `fetchToken` resolves `null` — so a fetcher that
 * always resolves `null` releases the pause without claiming a real
 * identity. `onChange` must be a real function: the null-token path calls
 * `setAndReportAuthFailed(onAuthChange)`, which invokes it unconditionally.
 *
 * Fires at most once per client (`resumed` ref): if a REAL session later
 * appears (the cookie wasn't stale after all, or the visitor signs in),
 * `ConvexProviderWithAuth` calls `client.setAuth(realFetchAccessToken, ...)`
 * itself — a fresh `setConfig()` call `resetAuthState()`s and bumps
 * convex's internal `configVersion`, which supersedes this call's
 * already-finished null-token config exactly like a normal token refresh.
 * Without the ref guard this would also re-fire on every later sign-out,
 * needlessly pausing+resuming an already-unpaused, already-live socket.
 */
function useResumeIfStaleSessionCookie(convex: ConvexReactClient, startedPaused: boolean) {
  const { data: session, isPending } = authClient.useSession();
  const resumed = useRef(false);
  useEffect(() => {
    if (startedPaused && !resumed.current && !isPending && !session) {
      resumed.current = true;
      void convex.setAuth(
        () => Promise.resolve(null),
        () => {},
      );
    }
  }, [convex, isPending, session, startedPaused]);
}

/**
 * Reactively sets the shared auth-transition marker (`@vexcms/react`'s
 * `useAuthTransition`) the moment this browser's `authClient.useSession()`
 * identity changes — covers every way a session can start or end (credential
 * sign-in, magic link, OAuth, a tab regaining an updated session, …) through
 * ONE call site, rather than needing one at each entry point. Paired with the
 * `signOut` wrapper's own explicit, even-earlier `beginTransition(null)` call
 * (`~/auth/client.tsx`) for the one case that can be told synchronously, with
 * zero network latency, ahead of this hook ever re-running.
 *
 * `useLayoutEffect`, not a render-phase call: `beginTransition` updates
 * `AuthTransitionProvider`'s OWN state, an ANCESTOR of this hook's caller —
 * React only supports the "set state conditionally during render" pattern
 * (`usePaginatedQuery.ts`'s own `resetKey` block) for a component's OWN
 * state, never a different component's (React warns: "Cannot update a
 * component while rendering a different component"). `useLayoutEffect`
 * (not `useEffect`) still fires synchronously after this render commits,
 * before the browser paints — the earliest point updating someone ELSE's
 * state is actually supported.
 */
function useBeginAuthTransitionOnSessionChange() {
  const { beginTransition } = useAuthTransition();
  const { data: session } = authClient.useSession();
  const identity = (session?.user?.id as string | undefined) ?? null;
  const lastIdentityRef = useRef(identity);
  useLayoutEffect(() => {
    if (identity !== lastIdentityRef.current) {
      lastIdentityRef.current = identity;
      beginTransition(identity);
    }
  }, [identity, beginTransition]);
}

function makeClients() {
  // `expectAuth` pauses the Convex WebSocket at construction until
  // `client.setAuth()` is called; `ConvexProviderWithAuth` (convex/react)
  // only calls it when the auth provider reports an authenticated session.
  // The public site's own `anonRole` fallback means most visitors carry NO
  // Better Auth session at all, so for them that never becomes true and the
  // socket would stay paused forever — every live client query (including
  // public-site live-preview subscriptions like `ThemeLive`) sits at
  // `status: "pending"` indefinitely.
  //
  // `document.cookie` is checked synchronously (not a session fetch, and
  // never server-side — SSR here always gets a fresh client whose
  // websocket is never used for live queries anyway) so a visitor who
  // already has a session keeps the pre-auth pause — avoiding a flash of
  // anon-role query results before `setAuth` re-subscribes with their real
  // identity (zero-layout-shift) — while a visitor with no cookie at all
  // starts unpaused and gets live queries immediately.
  const startedPaused = hasSessionCookie();
  const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL, {
    expectAuth: startedPaused,
  });
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
  return { convex, queryClient, startedPaused };
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
  const { convex, queryClient, startedPaused } = getClients();
  useResumeIfStaleSessionCookie(convex, startedPaused);
  return (
    <AuthTransitionProvider>
      <ConvexBetterAuthProvider authClient={authClient} client={convex}>
        <QueryClientProvider client={queryClient}>
          <AuthTransitionSessionWatcher>{children}</AuthTransitionSessionWatcher>
        </QueryClientProvider>
      </ConvexBetterAuthProvider>
    </AuthTransitionProvider>
  );
}

/** Mounts {@link useBeginAuthTransitionOnSessionChange} — needs an `AuthTransitionProvider`
 * ancestor, which `ConvexClientProvider` only establishes one level up. */
function AuthTransitionSessionWatcher({ children }: { children: ReactNode }) {
  useBeginAuthTransitionOnSessionChange();
  return <>{children}</>;
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
