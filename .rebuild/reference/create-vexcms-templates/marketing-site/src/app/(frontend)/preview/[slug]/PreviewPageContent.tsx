"use client"

import { RenderBlocks, useVexPreview } from "@vexcms/ui"
import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import { anyApi } from "convex/server"

import { blockComponents } from "~/vexcms/blocks"

/**
 * Client component for live preview using TanStack Query.
 * initialData from server fetch eliminates loading flash.
 * The reactive subscription picks up draft snapshot changes in real-time.
 */
export function PreviewPageContent({
  slug,
  initialData,
}: {
  slug: string
  initialData?: Record<string, unknown> | null
}) {
  const { data: page } = useQuery({
    ...convexQuery(anyApi.pages.getBySlug, {
      slug,
      _vexDrafts: "snapshot",
    }),
    initialData: initialData ?? undefined,
  })

  // Notify admin panel's live preview when data changes
  useVexPreview({ data: page })

  if (page === null || page === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">Preview not found</h1>
        <p className="mt-2 text-muted-foreground">
          No page with slug &ldquo;{slug}&rdquo; exists.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Preview banner */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-yellow-200 bg-yellow-50 px-4 py-2 text-center text-sm text-yellow-800">
        Preview Mode — This page may not be published yet.
      </div>
      <div className="pt-10">
        <RenderBlocks blocks={page.content} components={blockComponents} />
      </div>
    </>
  )
}
