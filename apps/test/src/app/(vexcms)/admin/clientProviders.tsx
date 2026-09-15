"use client";

import { VexConfigProvider } from "@vexcms/react";

import config from "~/vex.config";

/**
 * Mounts the single `VexConfigProvider` for the admin panel's client tree.
 *
 * This is a "use client" component so `vex.config` is imported and owned on
 * the client — it never crosses the RSC boundary as a prop. `access` and
 * `storage.clientUploads` (the two fields that used to need their own
 * providers) are already part of the config this imports.
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <VexConfigProvider config={config}>{children}</VexConfigProvider>;
}
