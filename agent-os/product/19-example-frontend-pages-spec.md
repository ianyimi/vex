# 19 — Example Frontend Pages (Articles & Posts)

## Overview

Add example frontend pages to the test app that render article and post documents from Convex. These pages serve as simple, publicly accessible URLs that can later be used to test the live preview implementation. Includes list pages with infinite scroll and detail pages that display all document fields.

## Design Decisions

- **Public (no auth)**: Pages do not require authentication — simpler for preview testing
- **Document ID in URL**: Detail pages use Convex `_id` as the URL param (e.g., `/articles/k17abc...`), leveraging the existing `getDocument` query directly
- **Infinite scroll**: List pages use `usePaginatedQuery` with a "Load more" button against the existing `listDocuments` query
- **Client components**: All pages are `"use client"` since they use Convex React hooks
- **Minimal styling**: Tailwind utility classes for basic readability, no custom components

## Out of Scope

- Live preview postMessage wiring (spec 10)
- Server-side rendering / RSC data fetching
- Slug-based URL lookups
- Fancy layouts, nav bars, or design system integration
- Authentication or access control on these routes

## Target Directory Structure

```
apps/test-app/src/app/(frontend)/
├── articles/
│   ├── page.tsx              # Articles list (infinite scroll)
│   └── [articleId]/
│       └── page.tsx          # Single article detail
├── posts/
│   ├── page.tsx              # Posts list (infinite scroll)
│   └── [postId]/
│       └── page.tsx          # Single post detail
├── layout.tsx                # (existing — no changes)
└── page.tsx                  # (existing — no changes)
```

## Implementation Order

1. **Articles list page** — `/articles` with infinite scroll via `usePaginatedQuery` → list page renders
2. **Article detail page** — `/articles/[articleId]` using `getDocument` → detail page renders, list links work
3. **Posts list page** — `/posts` with infinite scroll → same pattern as articles
4. **Post detail page** — `/posts/[postId]` → detail page renders, list links work

---

## Step 1: Articles List Page

- [ ] Create `src/app/(frontend)/articles/page.tsx`
- [ ] Verify `/articles` loads in browser and shows documents with "Load more"

**File: `src/app/(frontend)/articles/page.tsx`**

```tsx
"use client"

import { usePaginatedQuery } from "convex/react"
import Link from "next/link"

import { api } from "@convex/_generated/api"

const PAGE_SIZE = 10

export default function ArticlesPage() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.vex.collections.listDocuments,
    { collectionSlug: "articles" },
    { initialNumItems: PAGE_SIZE },
  )

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Articles</h1>

      {status === "LoadingFirstPage" && <p className="text-gray-500">Loading…</p>}

      <ul className="space-y-3">
        {results.map((article: Record<string, unknown>) => (
          <li key={article._id as string}>
            <Link
              href={`/articles/${article._id as string}`}
              className="block rounded border p-4 hover:bg-gray-50"
            >
              <p className="font-medium">{(article.name as string) ?? "Untitled"}</p>
              {article.slug && (
                <p className="text-sm text-gray-500">/{article.slug as string}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {results.length === 0 && status !== "LoadingFirstPage" && (
        <p className="text-gray-500">No articles found.</p>
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
```

---

## Step 2: Article Detail Page

- [ ] Create `src/app/(frontend)/articles/[articleId]/page.tsx`
- [ ] Verify clicking an article from the list navigates to the detail page and renders fields

**File: `src/app/(frontend)/articles/[articleId]/page.tsx`**

```tsx
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
```

---

## Step 3: Posts List Page

- [ ] Create `src/app/(frontend)/posts/page.tsx`
- [ ] Verify `/posts` loads and shows documents with "Load more"

**File: `src/app/(frontend)/posts/page.tsx`**

```tsx
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
```

---

## Step 4: Post Detail Page

- [ ] Create `src/app/(frontend)/posts/[postId]/page.tsx`
- [ ] Verify clicking a post from the list navigates to the detail page and renders fields
- [ ] Verify all four routes work: `/articles`, `/articles/:id`, `/posts`, `/posts/:id`

**File: `src/app/(frontend)/posts/[postId]/page.tsx`**

```tsx
"use client"

import { useQuery } from "convex/react"
import Link from "next/link"
import { useParams } from "next/navigation"

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
      {doc.subtitle && (
        <p className="mb-4 text-lg text-gray-600">{doc.subtitle as string}</p>
      )}

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

      <pre className="mt-6 overflow-auto rounded bg-gray-100 p-4 text-xs">
        {JSON.stringify(doc, null, 2)}
      </pre>
    </div>
  )
}
```

---

## Success Criteria

- [ ] `/articles` renders a list of articles with infinite scroll ("Load more" button)
- [ ] `/articles/[articleId]` renders all fields for a single article
- [ ] `/posts` renders a list of posts with infinite scroll
- [ ] `/posts/[postId]` renders all fields for a single post
- [ ] All pages work without authentication
- [ ] Navigation between list and detail pages works via links
- [ ] Each detail page includes a raw JSON dump of the document for debugging
- [ ] Pages are usable as preview URLs for future live preview implementation
