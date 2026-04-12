"use client";

import { createContext, useContext } from "react";

import { defineConfig, type VexConfig } from "@vexcms/core";

/**
 * Holds the live VexCMS config for the duration of the admin session.
 *
 * Populated by `AdminLayout` from the `config` prop. Because the user's
 * `layout.tsx` is a "use client" module that imports `vex.config` directly,
 * Turbopack's Fast Refresh re-evaluates it when any collection file changes —
 * which updates this context and re-renders all consumers, including
 * `CollectionListView` and `CreateDocumentModal`, without a full page reload.
 */
export const VexConfigContext = createContext<VexConfig>(defineConfig());

/**
 * Returns the live VexCMS config from `VexConfigContext`.
 *
 * Falls back to a default `defineConfig()` result if rendered outside
 * `AdminLayout` — the return value is always a valid `VexConfig`.
 *
 * @returns The resolved `VexConfig` for the current admin session.
 */
export function useVexConfig(): VexConfig {
  return useContext(VexConfigContext);
}
