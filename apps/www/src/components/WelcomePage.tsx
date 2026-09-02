"use client"

import { api } from "@convex/_generated/api"
import { useMutation, useQuery } from "convex/react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { useSession } from "~/auth/client"

/**
 * Landing UI for a project that has not been bootstrapped yet (no admin user),
 * and the "Go to Admin" / "Sign in" entry point once it has.
 *
 * Renders directly on `templates/base-nextjs`'s home route (no `pages`
 * collection exists there). The marketing overlay's `PageContent` renders it
 * as a fallback instead, when `pages.getBySlug("home")` returns no document.
 *
 * Promotes the first signed-in user to admin exactly once: `promoteFirstAdmin`
 * is a Convex mutation, so concurrent signups cannot both win — Convex
 * serializes mutations, and the loser observes `isBootstrapped` already true.
 */
export function WelcomePage() {
  const isBootstrapped = useQuery(api.vex.firstUser.isBootstrapped)
  const promoteFirstAdmin = useMutation(api.vex.firstUser.promoteFirstAdmin)
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [promoting, setPromoting] = useState(false)
  const [navigating, setNavigating] = useState(false)

  // Reset `navigating` when the user lands back on the home page (e.g. they
  // dismissed the intercepting auth dialog). Adjusting state during render on
  // a changed input is the pattern React documents for this; an effect would
  // paint the stale spinner for a frame first.
  const [lastPathname, setLastPathname] = useState(pathname)
  if (lastPathname !== pathname) {
    setLastPathname(pathname)
    if (pathname === "/") {setNavigating(false)}
  }

  // Run-once latch. `promoting` and `navigating` both render, so they stay
  // state; the guard does not, so it is a ref — that keeps it out of the
  // dependency array and stops the effect re-running just to re-read it.
  const promotingRef = useRef(false)

  useEffect(() => {
    if (!session?.user || isBootstrapped !== false || promotingRef.current) {return}

    promotingRef.current = true
    setPromoting(true)
    setNavigating(true)

    promoteFirstAdmin()
      .then((result) => {
        if (result.promoted) {
          router.push("/admin")
          return
        }
        promotingRef.current = false
        setPromoting(false)
        setNavigating(false)
      })
      .catch(() => {
        promotingRef.current = false
        setPromoting(false)
        setNavigating(false)
      })
  }, [session, isBootstrapped, promoteFirstAdmin, router])

  // Treat undefined (query still loading) as not bootstrapped — show the welcome page immediately
  const bootstrapped = isBootstrapped === true

  const buttonClass =
    "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"

  const handleNavigate = (path: string) => {
    setNavigating(true)
    router.push(path)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">VexCMS</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {bootstrapped
            ? "Your content management system is ready."
            : "Welcome! Create your admin account to get started."}
        </p>
      </div>

      <div className="flex gap-4">
        {session?.user ? (
          <button className={buttonClass} disabled={navigating} onClick={() => handleNavigate("/admin")}>
            {navigating && <LoadingSpinner />}
            {navigating ? "Loading..." : "Go to Admin Panel"}
          </button>
        ) : bootstrapped ? (
          <button className={buttonClass} disabled={navigating} onClick={() => handleNavigate("/auth/sign-in")}>
            {navigating && <LoadingSpinner />}
            {navigating ? "Loading..." : "Sign In"}
          </button>
        ) : (
          <button className={buttonClass} disabled={navigating} onClick={() => handleNavigate("/auth/sign-up")}>
            {navigating && <LoadingSpinner />}
            {navigating ? "Loading..." : "Create Admin Account"}
          </button>
        )}
      </div>

      {promoting && <p className="text-sm text-muted-foreground animate-pulse">Setting up your admin account...</p>}
    </div>
  )
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        fill="currentColor"
      />
    </svg>
  )
}
