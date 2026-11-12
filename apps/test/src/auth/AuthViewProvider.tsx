"use client"

import type { ReactNode } from "react"

import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import Link from "next/link"

import { authClient } from "~/auth/client"

/**
 * Mounts `@daveyplate/better-auth-ui`'s `AuthUIProvider` around `AuthView`
 * only, at the two places it renders (`(frontend)/auth/[pathname]/view.tsx`,
 * the `@auth` intercepted sign-in modal) — not at the app root. `AuthView`
 * reads its form config (credentials, navigation) from this provider's context;
 * nothing else in the app needs it.
 *
 * `navigate`/`replace` hard-navigate (`window.location.href`/`.replace`, a full
 * document load) instead of `router.push`/`router.replace`. The library's own
 * `useOnSuccessTransition` (driving sign-in/sign-up success, among other auth
 * transitions) does `await refetchSession(); await onSessionChange?.();
 * navigate(redirectTo)` — `onSessionChange` used to be `() => router.refresh()`,
 * a fire-and-forget call with no real promise to await (`router.refresh()`
 * returns `void`), so `navigate(redirectTo)` (`router.push`) fired immediately
 * after, while the refresh's own RSC re-fetch for the PRE-navigation route was
 * still in flight. When that refresh resolved after the push had already
 * started (worse under a slow first compile), Next's router reconciled the
 * stale pre-navigation tree over the pushed route — "credentials accepted, the
 * app compiled for a while, then nothing happened," landing back on the
 * sign-in page despite a real session (confirmed signed in on back/forward).
 * A hard navigation has no client-side router state to race: there is nothing
 * left for a stale `refresh()` to clobber, and the full load re-resolves every
 * server-rendered auth state fresh — `onSessionChange` is dropped entirely, it
 * no longer does anything a hard navigation doesn't already cover.
 */
export default function AuthViewProvider({ children }: { children: ReactNode }) {
  return (
    <AuthUIProvider
      authClient={authClient}
      credentials={true}
      Link={Link}
      navigate={(href) => {
        window.location.href = href
      }}
      replace={(href) => {
        window.location.replace(href)
      }}
    >
      {children}
    </AuthUIProvider>
  )
}
