"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/** The marker {@link useAuthTransition} returns. */
export interface AuthTransitionState {
  /**
   * The identity every list hook currently trusts a live push against —
   * `VexApiAuth.user._id`, or `null` for signed-out. Starts `null` (no
   * provider, or no transition ever begun) and is only ever written by
   * {@link beginTransition}.
   */
  expectedIdentity: string | null;
  /**
   * `true` from the moment {@link beginTransition} is called until a page
   * whose `viewerId` matches `expectedIdentity` is observed by ANY mounted
   * list hook (`confirmTransition`) — every mounted list hook shares this
   * one flag, since they're all driven by the SAME underlying auth change:
   * one confirmation means the identity has genuinely settled everywhere.
   *
   * `false` by default (including with no `AuthTransitionProvider` mounted
   * at all — e.g. existing tests) — list hooks only start ignoring
   * non-matching pushes while this is `true`; in the common/default case
   * every push commits exactly as it always has.
   */
  isTransitionPending: boolean;
  /**
   * Called by the host app's sign-in/sign-out entry points — the `signOut`
   * wrapper (`VexAdminAuthAdapterProvider`'s `signOut`, called BEFORE the
   * actual `authClient.signOut()`, so the marker is set with zero network
   * latency) and a reactive watcher on `authClient.useSession()` (covers
   * sign-in, and any other session-establishing flow, without needing a
   * dedicated call site for each) — see each app's `providers/convex.tsx`.
   *
   * Pass the identity the NEXT settled page is expected to carry: the
   * signed-in user's `_id` for a sign-in, `null` for a sign-out.
   */
  beginTransition: (identity: string | null) => void;
  /**
   * Called by a list hook once it observes a page whose `viewerId` matches
   * `expectedIdentity` — clears {@link isTransitionPending} for every other
   * mounted list hook too.
   */
  confirmTransition: () => void;
}

const defaultAuthTransitionState: AuthTransitionState = {
  expectedIdentity: null,
  isTransitionPending: false,
  beginTransition: () => {},
  confirmTransition: () => {},
};

const AuthTransitionContext = createContext<AuthTransitionState>(defaultAuthTransitionState);

/**
 * Reads the current auth-transition marker — see {@link AuthTransitionState}'s
 * own field doc comments for the full contract. Safe to call with no
 * {@link AuthTransitionProvider} mounted (existing tests, a host app that
 * hasn't adopted it): returns the default, permanently-not-pending state, so
 * every list hook's own push-vs-expected comparison trivially passes and
 * behaves exactly as it did before this marker existed.
 *
 * @returns The current {@link AuthTransitionState}.
 */
export function useAuthTransition(): AuthTransitionState {
  return useContext(AuthTransitionContext);
}

/**
 * Mounts the shared auth-transition marker `usePaginatedQuery`/
 * `useVexListQuerySearch` compare each live page's `viewerId` against, so a
 * page that arrives while Convex is still re-evaluating an already-open
 * subscription under a changing identity (a sign-in/out — no args-level
 * signal, so the query key never rotates) never gets painted: the list
 * hooks keep the CURRENT (dimmed) rows until a page tagged with the
 * identity {@link AuthTransitionState.beginTransition} named actually
 * arrives, instead of guessing "has it probably settled yet" from a timer.
 *
 * Mount once, near the root — alongside `ConvexClientProvider`/
 * `BetterAuthClientProvider` in each app's `ClientProviders`.
 *
 * @param props.children - The subtree that reads/writes the transition marker.
 * @returns The context provider wrapping `children`.
 */
export function AuthTransitionProvider(props: { children: ReactNode }) {
  const [expectedIdentity, setExpectedIdentity] = useState<string | null>(null);
  const [isTransitionPending, setIsTransitionPending] = useState(false);

  const beginTransition = useCallback((identity: string | null) => {
    setExpectedIdentity(identity);
    setIsTransitionPending(true);
  }, []);

  const confirmTransition = useCallback(() => {
    setIsTransitionPending(false);
  }, []);

  const value = useMemo<AuthTransitionState>(
    () => ({ expectedIdentity, isTransitionPending, beginTransition, confirmTransition }),
    [expectedIdentity, isTransitionPending, beginTransition, confirmTransition],
  );

  return <AuthTransitionContext.Provider value={value}>{props.children}</AuthTransitionContext.Provider>;
}
