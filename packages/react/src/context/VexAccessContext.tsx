"use client";

import { createContext, useContext } from "react";
import type { SubjectEntry, VexAccessConfig } from "@vexcms/core";

/** The raw access config (callbacks intact), provided from a client-bundle import in the
 *  app — NOT from the sanitized server config prop (which strips `access`). */
const VexAccessContext = createContext<VexAccessConfig | undefined>(undefined);

/** @returns the access config for the session, or `undefined` (→ every check denies). */
export function useVexAccess<
  TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>,
>(): VexAccessConfig<TSubjects> | undefined {
  return useContext(VexAccessContext) as VexAccessConfig<TSubjects>;
}

/** Wrap the admin UI; the app supplies `access` from a `"use client"` import of
 *  `~/auth/access` so its callbacks survive into the client bundle. */
export function VexAccessProvider<
  TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>,
>(props: { access?: VexAccessConfig<TSubjects>; children: React.ReactNode }) {
  return (
    <VexAccessContext.Provider value={props.access}>{props.children}</VexAccessContext.Provider>
  );
}
