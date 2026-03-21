"use client"

import type { RichTextDocument } from "@vexcms/core"

import { api } from "@convex/_generated/api"
import { RichText } from "@vexcms/richtext/render"
import { useQuery } from "convex/react"
import Link from "next/link"
import { useParams } from "next/navigation"

/**
 * Public page route — renders published pages by slug.
 * Passes _vexDrafts: false to only get published content.
 */
export default function PublicPage() {
  const { slug } = useParams<{ slug: string }>()

  const page = useQuery(api.pages.getBySlug, {
    slug,
    _vexDrafts: false,
  })

  if (page === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (page === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          The page &ldquo;{slug}&rdquo; doesn&apos;t exist or hasn&apos;t been published yet.
        </p>
        <Link className="mt-4 inline-block text-sm text-primary hover:underline" href="/">
          ← Back to home
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
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
