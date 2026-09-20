"use client"

import type { ReactNode } from "react"

import { LivePreviewProvider } from "@vexcms/react"

import config from "~/vex.config"

/**
 * Mounts the live-preview listener for the public site's client tree.
 *
 * A `"use client"` component so `vex.config` is imported and owned on the
 * client — it never crosses the RSC boundary as a prop (ADR-013; the config's
 * `admin.livePreview.url` resolvers and field validators are functions, which
 * React refuses to serialize). Mirrors `admin/clientProviders.tsx`.
 *
 * `LivePreviewProvider` gates itself on `?vexLivePreview=1` plus the
 * session-verified `vex-live-preview` cookie `proxy.ts` sets, so wrapping the
 * layout unconditionally costs a disabled provider and nothing else — and
 * keeps every public route statically prerenderable.
 */
export function SiteLivePreviewProvider({ children }: { children: ReactNode }) {
  return (
    <LivePreviewProvider
      allowedOrigins={config.livePreview.allowedOrigins}
      collections={config.collections}
    >
      {children}
    </LivePreviewProvider>
  )
}
