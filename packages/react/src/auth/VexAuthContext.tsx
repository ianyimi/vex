"use client";

import type { VexApiAuth } from "@vexcms/core";
import { createContext, useContext } from "react";

// A stable, module-private reference — `createContext()` runs once, so this
// object's IDENTITY (not its shape) is what `useIsVexAuthProviderMounted`
// below compares against. `VexAuthProvider` always passes a FRESH `{ user,
// organization }` literal as `value`, even when seeding `{ user: null }` for
// a signed-out admin caller, so that literal is never `===` this constant —
// only "no provider in the tree at all" is. This is how
// `useCanAccessAdminPanel` tells "inside the admin tree, signed out" apart
// from "outside the admin tree entirely" (every public page), which the
// VALUE `{ user: null }` alone cannot distinguish.
const DEFAULT_VEX_AUTH: VexApiAuth = { user: null };
const VexAuthContext = createContext<VexApiAuth>(DEFAULT_VEX_AUTH);

/**
 * Reads the RBAC caller `{ user, organization }` provided by the admin server
 * layout, so client components (`usePermission`, nav gating) can check
 * access without re-fetching the session.
 *
 * @returns The current caller `{ user, organization }` from the server layout.
 */
export function useVexAuth(): VexApiAuth {
  return useContext(VexAuthContext);
}

/**
 * Whether `VexAuthProvider` is mounted above the calling component —
 * `useCanAccessAdminPanel`'s sole use case, to pick between the
 * server-resolved admin auth (`useVexAuth()`) and a client session adapter
 * (`useVexSessionAdapter()`) for a public page outside `/admin`, where no
 * `VexAuthProvider` is ever mounted.
 *
 * @returns `true` once any `VexAuthProvider` ancestor exists, regardless of
 *   what it seeds `value` to (including `{ user: null }`, a signed-out admin
 *   caller) — `false` only when the context never resolved past its own
 *   module-private default.
 */
export function useIsVexAuthProviderMounted(): boolean {
  return useContext(VexAuthContext) !== DEFAULT_VEX_AUTH;
}
/**
 * Seeds `VexAuthContext` with the server-resolved caller for the client tree
 * beneath it, so `useVexAuth`/`usePermission` see the same `{ user, organization }`
 * without an extra round trip.
 *
 * @param props - The resolved caller to provide, and the subtree that consumes it.
 * @returns The context provider wrapping `props.children`.
 */
export function VexAuthProvider(props: { value: VexApiAuth; children: React.ReactNode }) {
  return <VexAuthContext.Provider value={props.value}>{props.children}</VexAuthContext.Provider>;
}
