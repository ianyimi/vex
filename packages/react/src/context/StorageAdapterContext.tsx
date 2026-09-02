"use client";

import { createContext, useContext } from "react";

import type { ClientUploadMap } from "@vexcms/core";

interface StorageAdapterContextValue {
  adapterClients: ClientUploadMap;
}

const StorageAdapterContext = createContext<StorageAdapterContextValue>({
  adapterClients: {} as ClientUploadMap,
});

/**
 * Provides the `ClientUploadMap` to all components under the admin layout.
 *
 * Pass one entry per registered storage adapter keyed by its `name` slug.
 * `MediaUploadDropzone` reads the map via `useStorageAdapterMap()` to call
 * the correct client-side `uploadFile` function for a given adapter.
 *
 * @param props - The subtree needing adapter access, and the map of adapter
 *   name → `uploadFile` function to provide.
 * @returns The context provider wrapping `props.children`.
 */
export function StorageAdapterContextProvider({
  children,
  adapterClients,
}: {
  children: React.ReactNode;
  adapterClients: ClientUploadMap;
}) {
  return (
    <StorageAdapterContext.Provider value={{ adapterClients: adapterClients ?? {} }}>
      {children}
    </StorageAdapterContext.Provider>
  );
}

/**
 * Hook to access the storage adapter map.
 *
 * @returns The adapter map with `uploadFile` functions.
 * @throws {Error} If used outside of `StorageAdapterContextProvider`.
 */
export function useStorageAdapterMap() {
  const context = useContext(StorageAdapterContext);
  if (!context) {
    throw new Error("useStorageAdapterMap must be used within StorageAdapterContextProvider");
  }
  return context.adapterClients;
}
