"use client"

import { api } from "@convex/_generated/api"
import { useMutation, useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { useSession } from "~/auth/client"

/**
 * Promotes the first signed-in user to admin when no admin exists yet, then
 * redirects to `/admin`. Headless — renders nothing.
 *
 * `WelcomePage`'s own trigger (`convex/vex/firstUser.ts`'s
 * `promoteFirstAdmin`) only runs while `PageContent` is showing its
 * no-page-found fallback — which stops rendering the instant a `home` page
 * document exists. A fresh marketing scaffold gets a `home` document from
 * `pnpm seed` on day one, so that fallback may never mount again and the
 * bootstrap trigger would never fire. This mounts unconditionally in
 * `(frontend)/layout.tsx` instead, so the trigger survives seeding.
 *
 * `promoteFirstAdmin` is a Convex mutation, so concurrent signups cannot
 * both win — Convex serializes mutations, and the loser observes
 * `isBootstrapped` already true.
 */
export function FirstAdminBootstrap() {
  const isBootstrapped = useQuery(api.vex.firstUser.isBootstrapped)
  const promoteFirstAdmin = useMutation(api.vex.firstUser.promoteFirstAdmin)
  const { data: session } = useSession()
  const router = useRouter()
  const [promoting, setPromoting] = useState(false)

  useEffect(() => {
    if (session?.user && isBootstrapped === false && !promoting) {
      setPromoting(true)
      promoteFirstAdmin()
        .then((result) => {
          if (result.promoted) {
            router.push("/admin")
          } else {
            setPromoting(false)
          }
        })
        .catch(() => {
          setPromoting(false)
        })
    }
  }, [session, isBootstrapped, promoting, promoteFirstAdmin, router])

  return null
}
