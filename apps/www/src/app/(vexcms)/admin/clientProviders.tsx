"use client";

import { uploadFile } from "@vexcms/file-storage-convex";
import { StorageAdapterContextProvider } from "@vexcms/react";

/**
 * Provides client-side upload functions for VexCMS storage adapters.
 *
 * This is a "use client" component so that uploadFile is imported and
 * owned on the client — it never crosses the RSC boundary as a prop.
 *
 * Add a new entry here when registering an additional storage adapter.
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <StorageAdapterContextProvider adapterClients={{ convex: uploadFile }}>
      {children}
    </StorageAdapterContextProvider>
  );
}
