"use client"

import { useQuery } from "convex/react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { RichText } from "@vexcms/richtext/render"
import type { RichTextDocument } from "@vexcms/core"

import { api } from "@convex/_generated/api"

export default function PostPage() {
  const { postId } = useParams<{ postId: string }>()

  const post = useQuery(api.vex.collections.getDocument, {
    collectionSlug: "posts",
    documentId: postId,
  })

  if (post === undefined) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-gray-500">Loading…</p>
      </div>
    )
  }

  if (post === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-red-500">Post not found.</p>
        <Link href="/posts" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          ← Back to posts
        </Link>
      </div>
    )
  }

  const doc = post as Record<string, unknown>

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/posts" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        ← Back to posts
      </Link>

      <h1 className="mb-1 text-2xl font-bold">{(doc.title as string) ?? "Untitled"}</h1>
      {doc.subtitle ? (
        <p className="mb-4 text-lg text-gray-600">{doc.subtitle as string}</p>
      ) : null}

      <dl className="mt-4 space-y-3">
        <div>
          <dt className="text-sm font-medium text-gray-500">Slug</dt>
          <dd>{(doc.slug as string) ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Status</dt>
          <dd>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-sm">
              {(doc.status as string) ?? "—"}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Featured</dt>
          <dd>{doc.featured ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Created</dt>
          <dd>{doc._creationTime ? new Date(doc._creationTime as number).toLocaleString() : "—"}</dd>
        </div>
      </dl>

      {doc.content ? (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-gray-500">Content</h2>
          <div className="rounded border p-4 prose prose-sm max-w-none">
            <RichText content={doc.content as RichTextDocument} />
          </div>
        </div>
      ) : null}

      <pre className="mt-6 overflow-auto rounded bg-gray-100 p-4 text-xs">
        {JSON.stringify(doc, null, 2)}
      </pre>
    </div>
  )
}
