"use client"

import { RenderBlocks } from "@vexcms/ui"
import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import { useMutation, useQuery as useConvexQuery } from "convex/react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { anyApi } from "convex/server"

import { api } from "@convex/_generated/api"
import { useSession } from "~/auth/client"
import { blockComponents } from "~/vexcms/blocks"

/**
 * Client component that renders a page using TanStack Query + convexQuery.
 * When initialData is provided (from server fetchQuery), renders immediately.
 * The reactive subscription keeps data up-to-date after hydration.
 *
 * On a fresh project with no "home" page, shows the bootstrap/auth flow
 * so the first user can sign up and become admin.
 */
export function PageContent({
  slug,
  initialData,
}: {
  slug?: string
  initialData?: Record<string, unknown> | null
}) {
  const { data: page, isPending } = useQuery({
    ...convexQuery(anyApi.pages.getBySlug, {
      slug: slug ?? "home",
      _vexDrafts: false,
    }),
    initialData: initialData ?? undefined,
  })

  if (isPending && initialData === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!page) {
    if (!slug || slug === "home") {
      return <WelcomePage />
    }

    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          The page &ldquo;{slug}&rdquo; doesn&apos;t exist or hasn&apos;t been
          published yet.
        </p>
        <Link
          className="mt-4 inline-block text-sm text-primary hover:underline"
          href="/"
        >
          &larr; Back to home
        </Link>
      </div>
    )
  }

  return (
    <RenderBlocks
      blocks={page.content as any}
      components={blockComponents}
    />
  )
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

/**
 * Welcome page shown on fresh projects with no "home" page.
 * Handles the first-user bootstrap flow: sign up → promote to admin → redirect to admin panel.
 */
function WelcomePage() {
  const isBootstrapped = useConvexQuery(api.vex.firstUser.isBootstrapped)
  const promoteFirstAdmin = useMutation(api.vex.firstUser.promoteFirstAdmin)
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [promoting, setPromoting] = useState(false)
  const [navigating, setNavigating] = useState(false)

  useEffect(() => {
    if (pathname === "/") {
      setNavigating(false)
    }
  }, [pathname])

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
