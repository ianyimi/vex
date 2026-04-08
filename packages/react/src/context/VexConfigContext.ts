"use client"

import { createContext, useContext } from "react"

import type { VexConfig } from "@vexcms/core"

/**
 * Holds the live VexCMS config for the duration of the admin session.
 *
 * Populated by `AdminLayout` from the `config` prop. Because the user's
 * `layout.tsx` is a "use client" module that imports `vex.config` directly,
 * Turbopack's Fast Refresh re-evaluates it when any collection file changes —
 * which updates this context and re-renders all consumers, including
 * `CollectionListView` and `CreateDocumentModal`, without a full page reload.
 */
export const VexConfigContext = createContext<VexConfig | null>(null)

/**
 * Returns the live VexCMS config from context, or `null` if rendered outside
 * `AdminLayout`.
 */
export function useVexConfig(): VexConfig | null {
  return useContext(VexConfigContext)
}
