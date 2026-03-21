"use client"

import type { RichTextDocument } from "@vexcms/core"

import { api } from "@convex/_generated/api"
import { RichText } from "@vexcms/richtext/render"
import { useVexPreview } from "@vexcms/ui"
import { useQuery } from "convex/react"
import { useParams } from "next/navigation"

/**
 * Preview page route — renders draft pages for live preview.
 * Used by the admin panel's live preview iframe.
 *
 * Uses the same getBySlug query but with _vexDrafts: "snapshot"
 * so the draft snapshot is automatically merged onto the document.
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
      <div className="mx-auto max-w-3xl px-4 py-12">
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
        <p className="mt-2 text-muted-foreground">
          No page with slug &ldquo;{slug}&rdquo; exists.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Preview banner */}
      <div className="mb-6 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-800">
        Preview Mode — This page may not be published yet.
      </div>

      <h1 className="text-3xl font-bold mb-6">{page.title ?? "Untitled"}</h1>

      {page.content ? (
        <div className="prose prose-lg max-w-none">
          <RichText content={page.content as RichTextDocument} />
        </div>
      ) : (
        <p className="text-muted-foreground">This page has no content yet.</p>
      )}
    </div>
  )
}
