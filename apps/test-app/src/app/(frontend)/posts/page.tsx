"use client"

import { usePaginatedQuery } from "convex/react"
import Link from "next/link"

import { api } from "@convex/_generated/api"

const PAGE_SIZE = 10

export default function PostsPage() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.vex.collections.listDocuments,
    { collectionSlug: "posts" },
    { initialNumItems: PAGE_SIZE },
  )

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Posts</h1>

      {status === "LoadingFirstPage" && <p className="text-gray-500">Loading…</p>}

      <ul className="space-y-3">
        {results.map((post: Record<string, unknown>) => (
          <li key={post._id as string}>
            <Link
              href={`/posts/${post._id as string}`}
              className="block rounded border p-4 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{(post.title as string) ?? "Untitled"}</p>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                  {(post.status as string) ?? "unknown"}
                </span>
              </div>
              {post.subtitle && (
                <p className="mt-1 text-sm text-gray-500">{post.subtitle as string}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {results.length === 0 && status !== "LoadingFirstPage" && (
        <p className="text-gray-500">No posts found.</p>
      )}

      {status === "CanLoadMore" && (
        <button
          onClick={() => loadMore(PAGE_SIZE)}
          className="mt-4 rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
        >
          Load more
        </button>
      )}

      {status === "LoadingMore" && (
        <p className="mt-4 text-sm text-gray-500">Loading more…</p>
      )}
    </div>
  )
}
