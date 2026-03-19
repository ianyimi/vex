"use client"

import type { RichTextDocument } from "@vexcms/core"

import { api } from "@convex/_generated/api"
import { type Id } from "@convex/_generated/dataModel"
import { RichText } from "@vexcms/richtext/render"
import { useVexPreview } from "@vexcms/ui"
import { useQuery } from "convex/react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"

import { type TABLE_SLUG_POSTS } from "~/db/constants"

export default function PostPage() {
  const { postId } = useParams<{ postId: string }>()
  const searchParams = useSearchParams()
  const isPreview = searchParams.get("_vexPreview") === "true"

  const post = useQuery(api.vex.api.posts.get, {
    id: postId as Id<typeof TABLE_SLUG_POSTS>,
    _vexDrafts: isPreview ? "snapshot" : false,
  })

  // Notify admin panel's live preview when data changes
  useVexPreview({ data: post })

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
        <Link className="mt-2 inline-block text-sm text-blue-600 hover:underline" href="/posts">
          ← Back to posts
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link className="mb-4 inline-block text-sm text-blue-600 hover:underline" href="/posts">
        ← Back to posts
      </Link>

      <h1 className="mb-1 text-2xl font-bold">{post.title ?? "Untitled"}</h1>
      {post.subtitle ? <p className="mb-4 text-lg text-gray-600">{post.subtitle}</p> : null}

      <dl className="mt-4 space-y-3">
        <div>
          <dt className="text-sm font-medium text-gray-500">Slug</dt>
          <dd>{post.slug ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Status</dt>
          <dd>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-sm">{post.status ?? "—"}</span>
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Featured</dt>
          <dd>{post.featured ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Created</dt>
          <dd>{post._creationTime ? new Date(post._creationTime).toLocaleString() : "—"}</dd>
        </div>
      </dl>

      {post.content ? (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-gray-500">Content</h2>
          <div className="rounded border p-4 prose prose-sm max-w-none">
            <RichText content={post.content as RichTextDocument} />
          </div>
        </div>
      ) : null}

      <pre className="mt-6 overflow-auto rounded bg-gray-100 p-4 text-xs">
        {JSON.stringify(post, null, 2)}
      </pre>
    </div>
  )
}
