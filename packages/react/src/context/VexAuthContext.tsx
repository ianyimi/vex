"use client";

import type { VexApiAuth } from "@vexcms/core";
import { createContext, useContext } from "react";

const VexAuthContext = createContext<VexApiAuth>({ user: null });

/** @returns the current caller `{ user, organization }` from the server layout. */
export function useVexAuth(): VexApiAuth {
  return useContext(VexAuthContext);
}
export function VexAuthProvider(props: { value: VexApiAuth; children: React.ReactNode }) {
  return <VexAuthContext.Provider value={props.value}>{props.children}</VexAuthContext.Provider>;
}
