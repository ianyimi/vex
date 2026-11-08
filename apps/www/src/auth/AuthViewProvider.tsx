"use client"

import type { ReactNode } from "react"

import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { authClient } from "~/auth/client"

/**
 * Mounts `@daveyplate/better-auth-ui`'s `AuthUIProvider` around `AuthView`
 * only, at the two places it renders (`(frontend)/auth/[pathname]/view.tsx`,
 * the `@auth` intercepted sign-in modal) — not at the app root. `AuthView`
 * reads its form config (credentials, navigation, the session-change
 * refresh) from this provider's context; nothing else in the app needs it.
 */
export default function AuthViewProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  return (
    <AuthUIProvider
      authClient={authClient}
      credentials={true}
      Link={Link}
      navigate={router.push}
      onSessionChange={() => {
        router.refresh()
      }}
      replace={router.replace}
    >
      {children}
    </AuthUIProvider>
  )
}
