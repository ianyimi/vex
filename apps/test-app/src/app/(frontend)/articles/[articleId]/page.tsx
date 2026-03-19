"use client"

import { api } from "@convex/_generated/api"
import { type Id } from "@convex/_generated/dataModel"
import { useQuery } from "convex/react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"

import { type TABLE_SLUG_ARTICLES } from "~/db/constants"

export default function ArticlePage() {
  const { articleId } = useParams<{ articleId: string }>()
  const searchParams = useSearchParams()
  const isPreview = searchParams.get("_vexPreview") === "true"

  const article = useQuery(api.vex.api.articles.get, {
    id: articleId as Id<typeof TABLE_SLUG_ARTICLES>,
    _vexDrafts: isPreview,
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
        <Link className="mt-2 inline-block text-sm text-blue-600 hover:underline" href="/articles">
          ← Back to articles
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link className="mb-4 inline-block text-sm text-blue-600 hover:underline" href="/articles">
        ← Back to articles
      </Link>

      <h1 className="mb-2 text-2xl font-bold">{article.name ?? "Untitled"}</h1>

      <dl className="mt-4 space-y-3">
        <div>
          <dt className="text-sm font-medium text-gray-500">Slug</dt>
          <dd>{article.slug ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Index</dt>
          <dd>{article.index != null ? String(article.index) : "—"}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Banner</dt>
          <dd>{article.banner ? String(article.banner) : "—"}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Created</dt>
          <dd>{article._creationTime ? new Date(article._creationTime).toLocaleString() : "—"}</dd>
        </div>
      </dl>

      <pre className="mt-6 overflow-auto rounded bg-gray-100 p-4 text-xs">
        {JSON.stringify(article, null, 2)}
      </pre>
    </div>
  )
}
