"use client"

import { useMutation, useQuery } from "convex/react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { api } from "@convex/_generated/api"
import { useSession } from "~/auth/client"

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

export default function Page() {
  const isBootstrapped = useQuery(api.vex.firstUser.isBootstrapped)
  const promoteFirstAdmin = useMutation(api.vex.firstUser.promoteFirstAdmin)
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [promoting, setPromoting] = useState(false)
  const [navigating, setNavigating] = useState(false)

  // Reset navigating state when the user comes back to the home page
  // (e.g. closing the intercepting auth dialog)
  useEffect(() => {
    if (pathname === "/") {
      setNavigating(false)
    }
  }, [pathname])

  // If user is signed in and this is a fresh project, try to promote them
  useEffect(() => {
    if (session?.user && isBootstrapped === false && !promoting) {
      setPromoting(true)
      setNavigating(true)
      promoteFirstAdmin()
        .then((result) => {
          if (result.promoted) {
            router.push("/admin")
          } else {
            setNavigating(false)
          }
        })
        .catch(() => {
          setPromoting(false)
          setNavigating(false)
        })
    }
  }, [session, isBootstrapped, promoting, promoteFirstAdmin, router])

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
        <h1 className="text-4xl font-bold tracking-tight">VEX CMS</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {bootstrapped
            ? "Your content management system is ready."
            : "Welcome! Create your admin account to get started."}
        </p>
      </div>

      <div className="flex gap-4">
        {session?.user ? (
          <button
            onClick={() => handleNavigate("/admin")}
            disabled={navigating}
            className={buttonClass}
          >
            {navigating && <LoadingSpinner />}
            {navigating ? "Loading..." : "Go to Admin Panel"}
          </button>
        ) : bootstrapped ? (
          <button
            onClick={() => handleNavigate("/auth/sign-in")}
            disabled={navigating}
            className={buttonClass}
          >
            {navigating && <LoadingSpinner />}
            {navigating ? "Loading..." : "Sign In"}
          </button>
        ) : (
          <button
            onClick={() => handleNavigate("/auth/sign-up")}
            disabled={navigating}
            className={buttonClass}
          >
            {navigating && <LoadingSpinner />}
            {navigating ? "Loading..." : "Create Admin Account"}
          </button>
        )}
      </div>

      {promoting && (
        <p className="text-sm text-muted-foreground animate-pulse">
          Setting up your admin account...
        </p>
      )}
    </div>
  )
}
