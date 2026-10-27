"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  type ClientUploadMap,
  type SubjectEntry,
  type VexAccessConfig,
  type VexClientConfig,
} from "@vexcms/core";

/**
 * Holds the live VexCMS client config for the duration of the admin session —
 * the single provenance for config, access, and client-upload functions.
 *
 * Populated by the app's single `VexConfigProvider` mount
 * (`components/providers/client.tsx`), at the app root so the admin panel and
 * the public site read one provenance. It imports `~/vex.config` directly. Because that module is a
 * `"use client"` file importing `vex.config` directly, Turbopack's Fast
 * Refresh re-evaluates it when any collection file changes — which updates
 * this context and re-renders all consumers, including `CollectionListView`
 * and `CreateDocumentModal`, without a full page reload.
 *
 * Default value is `null`, so a consumer rendered outside any provider gets a
 * clear thrown error from `useVexConfig()` instead of a silently empty config.
 */
export const VexConfigContext = createContext<VexClientConfig | null>(null);

/**
 * Returns the live VexCMS client config from `VexConfigContext`.
 *
 * @returns The resolved `VexClientConfig` for the current admin session.
 * @throws When rendered outside a `VexConfigProvider`.
 */
export function useVexConfig(): VexClientConfig {
  const config = useContext(VexConfigContext);
  if (config === null) {
    throw new Error("useVexConfig() must be used within a VexConfigProvider.");
  }
  return config;
}

/**
 * Mounts `VexConfigContext` for the subtree it wraps. The app's root
 * `ClientProviders` is the only caller — it imports `~/vex.config` directly so
 * the config's callbacks (`access`, `storage.clientUploads`, and
 * `admin.livePreview.url` resolvers) survive into the client bundle.
 *
 * @param props - The resolved client config to provide, and the subtree that consumes it.
 * @returns The context provider wrapping `props.children`.
 */
export function VexConfigProvider(props: { config: VexClientConfig; children: ReactNode }) {
  return (
    <VexConfigContext.Provider value={props.config}>{props.children}</VexConfigContext.Provider>
  );
}

/**
 * Reads the RBAC access matrix for this session — derived directly from
 * `VexConfigContext`, the same config `hasPermission`/`usePermission` check
 * against.
 *
 * Deliberately reads the raw context instead of going through `useVexConfig()`:
 * `hooks/useCanAccessAdminPanel.ts` renders this on public pages where no
 * `VexConfigProvider` is mounted (the normal state of every public page), so
 * this must degrade to `undefined` there instead of throwing.
 *
 * @returns The access config for the session, or `undefined` when RBAC is
 *   not configured OR no provider is mounted — `hasPermission` treats
 *   `undefined` as the escape hatch and allows every check, not the reverse.
 */
export function useVexAccess<
  TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>,
>(): VexAccessConfig<TSubjects> | undefined {
  const config = useContext(VexConfigContext);
  return config?.access as VexAccessConfig<TSubjects> | undefined;
}

/**
 * Returns the `ClientUploadMap` for this session — derived from
 * `useVexConfig().storage.clientUploads`, one entry per registered storage
 * adapter's client-side `uploadFile` function.
 *
 * Throws via `useVexConfig()` when rendered outside a `VexConfigProvider` —
 * matches the old `StorageAdapterContextProvider`'s contract.
 *
 * @returns The adapter map with `uploadFile` functions.
 */
export function useStorageAdapterMap(): ClientUploadMap {
  return useVexConfig().storage.clientUploads;
}
