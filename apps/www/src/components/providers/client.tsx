"use client"

import { type PropsWithChildren } from "react"

import { VexConfigProvider } from "@vexcms/react"

import BetterAuthClientProvider from "~/auth/client"
import ConvexClientProvider from "~/components/providers/convex"
import config from "~/vex.config"

/**
 * Mounts the app-wide client providers, including the single
 * `VexConfigProvider` for the WHOLE app — admin and public site alike.
 *
 * One mount, at the root, because both trees need the config now: the admin
 * views always did, and `LivePreviewProvider` reads its collections, globals,
 * and allowed origins from the same context rather than from props. Two mounts
 * would be two provenances for one config.
 *
 * `"use client"` so `vex.config` is imported and owned on the client — it never
 * crosses the RSC boundary as a prop, which React would refuse: the config
 * carries functions (field validators, `admin.livePreview.url` resolvers).
 */
export default function ClientProviders({ children }: PropsWithChildren) {
  return (
    <ConvexClientProvider>
      <BetterAuthClientProvider>
        <VexConfigProvider config={config}>{children}</VexConfigProvider>
      </BetterAuthClientProvider>
    </ConvexClientProvider>
  )
}
