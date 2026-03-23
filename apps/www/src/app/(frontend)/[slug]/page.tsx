"use client"

import { RenderBlocks } from "@vexcms/ui"
import { api } from "@convex/_generated/api"
import { useQuery } from "convex/react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { blockComponents } from "~/vexcms/blocks"

/**
 * Public page route — renders published pages by slug.
 * Content is rendered as blocks via RenderBlocks.
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
    <RenderBlocks
      blocks={page.content as any}
      components={blockComponents}
    />
  )
}
