"use client"

// First, so Zod is jitless before any import below can run a parse.
import "~/lib/zodJitless"

import { VexConfigProvider, VexSessionAdapterProvider } from "@vexcms/react"
import { type PropsWithChildren } from "react"

import BetterAuthClientProvider, { useSession } from "~/auth/client"
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
 *
 * Also mounts `VexSessionAdapterProvider`, wrapping Better Auth's own
 * `useSession()` — the bridge `useCanAccessAdminPanel()` needs to resolve the
 * caller on a PUBLIC page, where no `VexAuthProvider` (server-resolved,
 * `/admin`-only) is ever mounted. `isPending` passes straight through:
 * `useCanAccessAdminPanel()` never claims `canAccess` until the session
 * settles, matching `SessionButton`'s own "reserve the slot" hydration
 * contract — no `organization` here, since none of this app's public-page
 * admin-panel gating needs it.
 */
export default function ClientProviders({ children }: PropsWithChildren) {
  return (
    <ConvexClientProvider>
      <BetterAuthClientProvider>
        <VexSessionAdapterProvider
          value={{
            useSession: () => {
              const { data, isPending } = useSession()
              return { user: data?.user ?? null, isPending }
            },
          }}
        >
          <VexConfigProvider config={config}>{children}</VexConfigProvider>
        </VexSessionAdapterProvider>
      </BetterAuthClientProvider>
    </ConvexClientProvider>
  )
}
