"use client"

import { useEffect, useRef } from "react"

import { authClient, useSession } from "~/auth/client"

/**
 * Automatically signs in anonymous users on the demo site.
 * If no session exists, triggers an anonymous sign-in so
 * Convex queries work without requiring manual sign-up.
 *
 * Place this in the root layout so it runs on every page.
 */
export function AutoAnonymousAuth() {
  const { data: session, isPending } = useSession()
  const signingIn = useRef(false)

  useEffect(() => {
    if (isPending || session || signingIn.current) return

    signingIn.current = true
    authClient.signIn.anonymous().catch((err) => {
      console.error("[demo] Anonymous sign-in failed:", err)
      signingIn.current = false
    })
  }, [isPending, session])

  return null
}
