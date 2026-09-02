"use client";

import { createContext, useContext } from "react";
import type { SubjectEntry, VexAccessConfig } from "@vexcms/core";

/** The raw access config (callbacks intact), provided from a client-bundle import in the
 *  app — NOT from the sanitized server config prop (which strips `access`). */
const VexAccessContext = createContext<VexAccessConfig | undefined>(undefined);

/**
 * Reads the RBAC access matrix for this session — the same config
 * `hasPermission`/`usePermission` check against. Its callbacks only exist in
 * the client bundle (see the note above), which is why it must be threaded
 * through this context instead of the sanitized server config prop.
 *
 * @returns The access config for the session, or `undefined` when RBAC is
 *   not configured — `hasPermission` treats `undefined` as the escape hatch
 *   and allows every check, not the reverse.
 */
export function useVexAccess<
  TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>,
>(): VexAccessConfig<TSubjects> | undefined {
  return useContext(VexAccessContext) as VexAccessConfig<TSubjects>;
}

/**
 * Wrap the admin UI; the app supplies `access` from a `"use client"` import of
 * `~/auth/access` so its callbacks survive into the client bundle.
 *
 * @param props - The access matrix to provide (optional — omit to leave RBAC
 *   unconfigured), and the subtree that consumes it.
 * @returns The context provider wrapping `props.children`.
 */
export function VexAccessProvider<
  TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>,
>(props: { access?: VexAccessConfig<TSubjects>; children: React.ReactNode }) {
  return (
    <VexAccessContext.Provider value={props.access}>{props.children}</VexAccessContext.Provider>
  );
}
