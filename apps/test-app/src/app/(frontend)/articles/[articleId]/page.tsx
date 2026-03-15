"use client"

import { useQuery } from "convex/react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { api } from "@convex/_generated/api"

export default function ArticlePage() {
  const { articleId } = useParams<{ articleId: string }>()

  const article = useQuery(api.vex.collections.getDocument, {
    collectionSlug: "articles",
    documentId: articleId,
  })

  if (article === undefined) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-gray-500">Loading…</p>
      </div>
    )
  }

  if (article === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-red-500">Article not found.</p>
        <Link href="/articles" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          ← Back to articles
        </Link>
      </div>
    )
  }

  const doc = article as Record<string, unknown>

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/articles" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        ← Back to articles
      </Link>

      <h1 className="mb-2 text-2xl font-bold">{(doc.name as string) ?? "Untitled"}</h1>

      <dl className="mt-4 space-y-3">
        <div>
          <dt className="text-sm font-medium text-gray-500">Slug</dt>
          <dd>{(doc.slug as string) ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Index</dt>
          <dd>{doc.index != null ? String(doc.index) : "—"}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Banner</dt>
          <dd>{doc.banner ? String(doc.banner) : "—"}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Created</dt>
          <dd>{doc._creationTime ? new Date(doc._creationTime as number).toLocaleString() : "—"}</dd>
        </div>
      </dl>

      <pre className="mt-6 overflow-auto rounded bg-gray-100 p-4 text-xs">
        {JSON.stringify(doc, null, 2)}
      </pre>
    </div>
  )
}
