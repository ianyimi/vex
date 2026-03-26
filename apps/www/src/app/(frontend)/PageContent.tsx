"use client"

import { RenderBlocks } from "@vexcms/ui"
import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { anyApi } from "convex/server"

import { normalizeSlug } from "~/lib/utils"
import { blockComponents } from "~/vexcms/blocks"

/**
 * Client component that renders a page using TanStack Query + convexQuery.
 * When initialData is provided (from server fetchQuery), renders immediately.
 * The reactive subscription keeps data up-to-date after hydration.
 */
export function PageContent({
  slug,
  initialData,
}: {
  slug?: string
  initialData?: Record<string, unknown> | null
}) {
  const normalizedSlug = normalizeSlug(slug)

  const { data: page, isPending } = useQuery({
    ...convexQuery(anyApi.pages.getBySlug, {
      slug: normalizedSlug,
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
    if (normalizedSlug === "home") {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
          <h1 className="text-4xl font-bold tracking-tight">Vex CMS</h1>
          <p className="text-lg text-muted-foreground">
            Create a page with slug &ldquo;home&rdquo; to get started.
          </p>
        </div>
      )
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
