"use client";

import type { VexApiAuth } from "@vexcms/core";
import { createContext, useContext, type ReactNode } from "react";

/**
 * The reactive session shape `useCanAccessAdminPanel` needs on a public page,
 * where no `VexAuthProvider` is mounted (the server-resolved `{ user,
 * organization }` that provider seeds only exists inside `/admin`).
 */
export interface VexSessionState extends VexApiAuth {
  /**
   * Whether the underlying auth client's session is still resolving — e.g.
   * Better Auth's `authClient.useSession().isPending`, `true` on the very
   * first client render before the session store settles. While pending,
   * `user`/`organization` are not yet meaningful either way.
   */
  isPending: boolean;
}

/**
 * App-provided bridge from the host app's own auth client to
 * `useCanAccessAdminPanel`, for a public page outside `/admin`.
 *
 * @see {@link VexSessionAdapterProvider}
 */
export interface VexSessionAdapter {
  /**
   * Reactive client session hook — called unconditionally by
   * `useCanAccessAdminPanel`, like `FrameworkComponents.useNavigate`/
   * `useIsRouteCovered`. Next.js + Better Auth: wrap `authClient.useSession()`,
   * mapping its `{ data, isPending }` to `{ user: data?.user ?? null,
   * organization: data?.activeOrganization, isPending }`.
   *
   * @returns The current caller plus whether the session is still resolving.
   */
  useSession: () => VexSessionState;
}

/**
 * Carries the app's client session hook from wherever
 * {@link VexSessionAdapterProvider} is mounted (the app root, so both the
 * public site and the admin tree see it — though the admin tree never needs
 * it, since `VexAuthProvider` already answers synchronously there) down to
 * `useCanAccessAdminPanel`.
 *
 * `undefined` default — a public page whose app never wired this adapter
 * keeps the hook's existing fail-closed behavior (`canAccess: false`)
 * instead of throwing, since most apps never gate a header on it.
 */
export const VexSessionAdapterContext = createContext<VexSessionAdapter | undefined>(
  undefined,
);

/**
 * Reads the session adapter mounted by {@link VexSessionAdapterProvider}, if
 * any.
 *
 * @returns The adapter, or `undefined` when no provider is mounted.
 */
export function useVexSessionAdapter(): VexSessionAdapter | undefined {
  return useContext(VexSessionAdapterContext);
}

/**
 * Mounts the client session adapter for `useCanAccessAdminPanel` to read on
 * public pages. Mount once, at the app root, beside `VexConfigProvider` —
 * the same root `VexConfigProvider` already carries `access` to every route,
 * public and admin alike (P-004); this is the matching bridge for `user`.
 *
 * @example
 * ```tsx
 * // ~/components/providers/client.tsx ("use client")
 * import { VexSessionAdapterProvider, VexConfigProvider } from "@vexcms/react";
 * import { useSession } from "~/auth/client";
 * import config from "~/vex.config";
 *
 * function ClientProviders({ children }: { children: React.ReactNode }) {
 *   return (
 *     <VexSessionAdapterProvider
 *       value={{
 *         useSession: () => {
 *           const { data, isPending } = useSession();
 *           return { user: data?.user ?? null, isPending };
 *         },
 *       }}
 *     >
 *       <VexConfigProvider config={config}>{children}</VexConfigProvider>
 *     </VexSessionAdapterProvider>
 *   );
 * }
 * ```
 *
 * @param props.value - The session adapter to provide.
 * @param props.children - The subtree that should see it — the whole app, so
 *   every public-page header can gate on `useCanAccessAdminPanel`.
 * @returns The context provider wrapping `props.children`.
 */
export function VexSessionAdapterProvider(props: {
  value: VexSessionAdapter;
  children: ReactNode;
}) {
  return (
    <VexSessionAdapterContext.Provider value={props.value}>
      {props.children}
    </VexSessionAdapterContext.Provider>
  );
}
