"use client";

import type { VexApiAuth } from "@vexcms/core";
import { createContext, useContext } from "react";

const VexAuthContext = createContext<VexApiAuth>({ user: null });

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
