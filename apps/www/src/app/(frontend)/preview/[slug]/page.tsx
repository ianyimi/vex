"use client"

import { api } from "@convex/_generated/api"
import { RenderBlocks, useVexPreview } from "@vexcms/ui"
import { useQuery } from "convex/react"
import { useParams } from "next/navigation"

import { blockComponents } from "~/vexcms/blocks"

/**
 * Preview page route — renders draft pages for live preview.
 * Used by the admin panel's live preview iframe.
 */
export default function PreviewPage() {
  const { slug } = useParams<{ slug: string }>()

  const page = useQuery(api.pages.getBySlug, {
    slug,
    _vexDrafts: "snapshot",
  })

  // Notify admin panel's live preview when data changes
  useVexPreview({ data: page })

  if (page === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 h-screen grid place-items-center">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
          <p className="text-muted-foreground">Loading preview…</p>
        </div>
      </div>
    )
  }

  if (page === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">Preview not found</h1>
        <p className="mt-2 text-muted-foreground">No page with slug &ldquo;{slug}&rdquo; exists.</p>
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
