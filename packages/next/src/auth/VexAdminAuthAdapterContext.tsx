"use client";
// "use client" is also injected by the tsup build banner for this entry (see
// tsup.config.ts) so the emitted module carries the client boundary — written
// explicitly here too so `tsc`/vitest (which never run tsup) see it.

import { createContext, useContext, type ReactNode } from "react";
import type { FrameworkAuthAdapter } from "@vexcms/react";

/**
 * Carries the app's sign-in/out actions (`@vexcms/react`'s `FrameworkComponents.auth`,
 * Next.js adapter) from wherever the app mounts {@link VexAdminAuthAdapterProvider} down
 * to `NextAdminLayoutClient`, which forwards it into `AdminLayout`'s `components` prop.
 *
 * A context, not a prop threaded through `NextAdminLayout`/your admin `layout.tsx`,
 * because `layout.tsx` and `NextAdminLayout` are BOTH server components — the sign-in
 * href builder and `signOut` function are app-specific client values (closures over your
 * own `~/auth/client` module) that cannot cross a Server→Client Component boundary as
 * props. Mounting this provider anywhere above `NextAdminLayout` in your own CLIENT tree
 * (e.g. alongside `VexConfigProvider`/your Better Auth client provider) sidesteps that
 * boundary entirely — both ends are client components.
 *
 * `undefined` default (not an empty object) distinguishes "no provider mounted" from "a
 * provider mounted with no adapter" — `AdminTopNav`'s own control renders nothing either
 * way, but the distinction matters for anyone debugging why it's missing.
 */
export const VexAdminAuthAdapterContext = createContext<FrameworkAuthAdapter | undefined>(
  undefined,
);

/**
 * Mounts the sign-in/out adapter for the admin panel's top-bar control.
 *
 * `signOut` must hard-navigate (full document load) to the project's resolved
 * `config.auth.signOut.redirectTo` once the session cookie clears — never
 * `router.push`/`router.refresh`, which keep the admin layout mounted while
 * queries re-run anonymously and the route guard redirects underneath it (the
 * multi-second "sidebar lingers, then a sign-in flash" sequence this contract
 * exists to avoid). See {@link FrameworkAuthAdapter.signOut} for the full contract.
 *
 * @example
 * ```tsx
 * // ~/components/providers/client.tsx ("use client")
 * import { VexAdminAuthAdapterProvider } from "@vexcms/next/auth";
 * import { signOut } from "~/auth/client";
 * import { useAuthTransition } from "@vexcms/react";
 *
 * import config from "~/vex.config";
 *
 * function AuthAdapterProvider({ children }: { children: React.ReactNode }) {
 *   // Needs an `AuthTransitionProvider` ancestor (the app's own
 *   // `ConvexClientProvider` mounts one) for `skipRefresh` below to reach
 *   // `useNextAuthTransitionRefresh`.
 *   const { beginTransition } = useAuthTransition();
 *   return (
 *     <VexAdminAuthAdapterProvider
 *       value={{
 *         signInHref: (redirectTo) => `/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`,
 *         signOut: () => {
 *           // `skipRefresh: true` — this sign-out already hard-navigates
 *           // below; without it, `useNextAuthTransitionRefresh` fires its
 *           // OWN `router.refresh()` for this same transition, racing the
 *           // hard navigation (see that hook's own doc comment).
 *           beginTransition(null, { skipRefresh: true });
 *           const goToDestination = () => {
 *             window.location.href = config.auth.signOut.redirectTo;
 *           };
 *           return signOut().then(goToDestination).catch(goToDestination);
 *           // hard-navigate either way — a stale client cache after a failed
 *           // sign-out is worse than a redundant navigation.
 *         },
 *       }}
 *     >
 *       {children}
 *     </VexAdminAuthAdapterProvider>
 *   );
 * }
 * ```
 *
 * @param props.value - The sign-in href builder and `signOut` function.
 * @param props.children - The subtree that should see this adapter — must contain
 *   `NextAdminLayout` for `AdminTopNav`'s control to pick it up.
 * @returns The context provider wrapping `props.children`.
 */
export function VexAdminAuthAdapterProvider(props: {
  value: FrameworkAuthAdapter;
  children: ReactNode;
}) {
  return (
    <VexAdminAuthAdapterContext.Provider value={props.value}>
      {props.children}
    </VexAdminAuthAdapterContext.Provider>
  );
}

/**
 * Reads the sign-in/out adapter mounted by {@link VexAdminAuthAdapterProvider}, if any.
 * Consumed internally by `NextAdminLayoutClient` — not typically called from app code.
 *
 * @returns The adapter, or `undefined` when no provider is mounted above this point.
 */
export function useVexAdminAuthAdapter(): FrameworkAuthAdapter | undefined {
  return useContext(VexAdminAuthAdapterContext);
}
