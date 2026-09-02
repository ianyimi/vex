# 39 — Server-Side Prefetching (Admin + Public Pages)

## Overview

Standardize all data fetching in the www app on TanStack Query + `convexQuery()` with server-side `fetchQuery`/`fetchAuthQuery` + `initialData`. This covers both the admin panel and the public frontend pages. The server component fetches data with auth, passes it as `initialData` to the client's TanStack `useQuery`, which renders immediately and subscribes reactively.

## Design Decisions

- **`fetchQuery`/`fetchAuthQuery` + `initialData`** — stays on TanStack Query everywhere. No mixing of query systems. Views accept optional `initialData` props.
- **Full auth on admin** — `fetchAuthQuery` from `@convex-dev/better-auth/nextjs` passes the Better Auth JWT for RBAC.
- **Public pages use `fetchQuery`** — no auth needed for published content.
- **Prefetch primary queries only** — countDocuments for dashboard/list views, getDocument for edit views, page data for public pages. Secondary queries (search, pagination, version history) stay client-only.
- **Graceful fallback** — if server fetch fails, pass `undefined` as `initialData`. The view falls back to client-only fetching.
- **Convert public pages from `preloadQuery`/`usePreloadedQuery` to TanStack Query** — consistent pattern, gives access to `isLoading`, `isError`, etc.

## Out of Scope

- Migrating admin views away from TanStack Query
- Paginated list prefetching (useConvexPaginatedQuery doesn't support server prefetch)
- Prefetching search results or version history

## Target Files

### Public Pages (convert from preloadQuery to TanStack Query + initialData)

```
apps/www/src/app/(frontend)/
├── layout.tsx                          # MODIFY — fetchQuery for header/footer
├── page.tsx                            # MODIFY — fetchQuery for home page
├── [slug]/page.tsx                     # MODIFY — fetchQuery for dynamic pages
├── PageContent.tsx                     # MODIFY — TanStack useQuery + initialData
├── preview/[slug]/page.tsx             # MODIFY — fetchQuery for preview
├── preview/[slug]/PreviewPageContent.tsx # MODIFY — TanStack useQuery + initialData
apps/www/src/components/
├── SiteHeader.tsx                      # MODIFY — TanStack useQuery + initialData
├── SiteFooter.tsx                      # MODIFY — TanStack useQuery + initialData
```

### Admin Panel (add initialData to existing TanStack Query)

```
apps/www/src/app/admin/
├── [[...path]]/page.tsx                # MODIFY — add fetchAuthQuery calls
├── AdminPageWrapper.tsx                # MODIFY — forward initialData

packages/admin-next/src/
├── components/AdminPage.tsx            # MODIFY — accept and forward initialData
├── views/DashboardView.tsx             # MODIFY — accept initialCounts
├── views/CollectionsView.tsx           # MODIFY — accept initialCount
├── views/CollectionEditView.tsx        # MODIFY — accept initialData
├── views/MediaCollectionsView.tsx      # MODIFY — accept initialCount
├── views/MediaCollectionEditView.tsx   # MODIFY — accept initialData
├── views/GlobalEditView.tsx            # MODIFY — accept initialData
```

## Implementation Order

1. **Step 1: Convert public pages to TanStack Query** — Server components use `fetchQuery`, client components use TanStack `useQuery` with `convexQuery()` + `initialData`.
2. **Step 2: Update AdminPage and views to accept initialData** — Add optional props, wire to `useQuery({ initialData })`.
3. **Step 3: Add server-side prefetching to admin routes** — The admin server component calls `fetchAuthQuery` based on route.
4. **Step 4: Verify all routes** — Build, test refresh on every route.

---

## Step 1: Convert public pages to TanStack Query

- [ ] Convert SiteHeader to TanStack useQuery + initialData
- [ ] Convert SiteFooter to TanStack useQuery + initialData
- [ ] Convert PageContent to TanStack useQuery + initialData
- [ ] Convert PreviewPageContent to TanStack useQuery + initialData
- [ ] Update frontend layout to use fetchQuery
- [ ] Update home page to use fetchQuery
- [ ] Update [slug] page to use fetchQuery
- [ ] Update preview page to use fetchQuery
- [ ] Verify build

### File: `apps/www/src/components/SiteHeader.tsx`

Convert from `usePreloadedQuery` to TanStack `useQuery` with `convexQuery()`.

```tsx
"use client"

import { RenderBlocks } from "@vexcms/ui"
import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import { anyApi } from "convex/server"

import { blockComponents } from "~/vexcms/blocks"

export function SiteHeader({
  initialData,
}: {
  initialData?: Record<string, unknown> | null
}) {
  const { data: header } = useQuery({
    ...convexQuery(anyApi.headers.getFirst, {}),
    initialData: initialData ?? undefined,
  })

  if (!header?.content) return null

  return (
    <RenderBlocks
      blocks={header.content as any}
      components={blockComponents}
    />
  )
}
```

### File: `apps/www/src/components/SiteFooter.tsx`

Same pattern as SiteHeader.

```tsx
"use client"

import { RenderBlocks } from "@vexcms/ui"
import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import { anyApi } from "convex/server"

import { blockComponents } from "~/vexcms/blocks"

export function SiteFooter({
  initialData,
}: {
  initialData?: Record<string, unknown> | null
}) {
  const { data: footer } = useQuery({
    ...convexQuery(anyApi.footers.getFirst, {}),
    initialData: initialData ?? undefined,
  })

  if (!footer?.content) return null

  return (
    <RenderBlocks
      blocks={footer.content as any}
      components={blockComponents}
    />
  )
}
```

### File: `apps/www/src/app/(frontend)/PageContent.tsx`

Convert from `usePreloadedQuery` to TanStack `useQuery`.

```tsx
"use client"

import { RenderBlocks } from "@vexcms/ui"
import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { anyApi } from "convex/server"

import { blockComponents } from "~/vexcms/blocks"

export function PageContent({
  slug,
  initialData,
}: {
  slug?: string
  initialData?: Record<string, unknown> | null
}) {
  const { data: page, isPending } = useQuery({
    ...convexQuery(anyApi.pages.getBySlug, {
      slug: slug ?? "home",
      _vexDrafts: false,
    }),
    initialData: initialData ?? undefined,
  })

  if (isPending && !initialData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!page) {
    if (!slug || slug === "home") {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
          <h1 className="text-4xl font-bold tracking-tight">Vex CMS</h1>
          <p className="text-lg text-muted-foreground">
            Create a page with slug &ldquo;home&rdquo; to get started.
          </p>
        </div>
      )
    }

    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          The page &ldquo;{slug}&rdquo; doesn&apos;t exist or hasn&apos;t been
          published yet.
        </p>
        <Link
          className="mt-4 inline-block text-sm text-primary hover:underline"
          href="/"
        >
          &larr; Back to home
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
```

### File: `apps/www/src/app/(frontend)/preview/[slug]/PreviewPageContent.tsx`

Convert from `usePreloadedQuery` to TanStack `useQuery`. Keep `useVexPreview` for live preview notifications.

```tsx
"use client"

import { RenderBlocks, useVexPreview } from "@vexcms/ui"
import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import { anyApi } from "convex/server"

import { blockComponents } from "~/vexcms/blocks"

export function PreviewPageContent({
  slug,
  initialData,
}: {
  slug: string
  initialData?: Record<string, unknown> | null
}) {
  const { data: page } = useQuery({
    ...convexQuery(anyApi.pages.getBySlug, {
      slug,
      _vexDrafts: "snapshot",
    }),
    initialData: initialData ?? undefined,
  })

  useVexPreview({ data: page })

  if (page === null || page === undefined) {
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
    <>
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-yellow-200 bg-yellow-50 px-4 py-2 text-center text-sm text-yellow-800">
        Preview Mode — This page may not be published yet.
      </div>
      <div className="pt-10">
        <RenderBlocks blocks={page.content} components={blockComponents} />
      </div>
    </>
  )
}
```

### File: `apps/www/src/app/(frontend)/layout.tsx`

Convert from `preloadQuery` to `fetchQuery`.

```tsx
import { fetchQuery } from "convex/nextjs"

import { api } from "@convex/_generated/api"

import { SiteFooter } from "~/components/SiteFooter"
import { SiteHeader } from "~/components/SiteHeader"
import { ThemeStyle } from "~/components/ThemeStyle"

export default async function FrontendLayout({
  auth,
  children,
}: Readonly<{
  auth: React.ReactNode
  children: React.ReactNode
}>) {
  let headerData: Record<string, unknown> | null = null
  let footerData: Record<string, unknown> | null = null

  try {
    ;[headerData, footerData] = await Promise.all([
      fetchQuery(api.headers.getFirst),
      fetchQuery(api.footers.getFirst),
    ])
  } catch {
    // Convex not available — fall back to client-only fetch
  }

  return (
    <>
      <ThemeStyle />
      <SiteHeader initialData={headerData} />
      <main>{children}</main>
      <SiteFooter initialData={footerData} />
      {auth}
    </>
  )
}
```

### File: `apps/www/src/app/(frontend)/page.tsx`

```tsx
import { fetchQuery } from "convex/nextjs"

import { api } from "@convex/_generated/api"

import { PageContent } from "./PageContent"

export default async function HomePage() {
  let initialData: Record<string, unknown> | null = null
  try {
    initialData = await fetchQuery(api.pages.getBySlug, {
      slug: "home",
      _vexDrafts: false,
    })
  } catch {
    // Fall back to client-only fetch
  }

  return <PageContent initialData={initialData} />
}
```

### File: `apps/www/src/app/(frontend)/[slug]/page.tsx`

```tsx
import { fetchQuery } from "convex/nextjs"

import { api } from "@convex/_generated/api"

import { PageContent } from "../PageContent"

export default async function PublicPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let initialData: Record<string, unknown> | null = null
  try {
    initialData = await fetchQuery(api.pages.getBySlug, {
      slug,
      _vexDrafts: false,
    })
  } catch {
    // Fall back to client-only fetch
  }

  return <PageContent slug={slug} initialData={initialData} />
}
```

### File: `apps/www/src/app/(frontend)/preview/[slug]/page.tsx`

```tsx
import { fetchQuery } from "convex/nextjs"

import { api } from "@convex/_generated/api"

import { PreviewPageContent } from "./PreviewPageContent"

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let initialData: Record<string, unknown> | null = null
  try {
    initialData = await fetchQuery(api.pages.getBySlug, {
      slug,
      _vexDrafts: "snapshot" as any,
    })
  } catch {
    // Fall back to client-only fetch
  }

  return <PreviewPageContent slug={slug} initialData={initialData} />
}
```

---

## Step 2: Update AdminPage and views to accept initialData

- [ ] Add `initialData` type to `AdminPageProps`
- [ ] Forward initialData to each view in AdminPage routing
- [ ] Update AdminPageWrapper to accept and forward initialData
- [ ] Update DashboardView to accept `initialCounts`
- [ ] Update CollectionsView to accept `initialCount`
- [ ] Update CollectionEditView to accept `initialData`
- [ ] Update MediaCollectionsView to accept `initialCount`
- [ ] Update MediaCollectionEditView to accept `initialData`
- [ ] Update GlobalEditView to accept `initialData`
- [ ] Verify build

### AdminPage.tsx — Add initialData prop

```typescript
// Add to AdminPageProps:
initialData?: {
  document?: Record<string, unknown> | null;
  globalDocument?: Record<string, unknown> | null;
  counts?: Record<string, number>;
  count?: number;
};
```

Forward to views:
- `DashboardView` → `initialCounts={initialData?.counts}`
- `CollectionsView` → `initialCount={initialData?.count}`
- `MediaCollectionsView` → `initialCount={initialData?.count}`
- `CollectionEditView` → `initialData={initialData?.document}`
- `MediaCollectionEditView` → `initialData={initialData?.document}`
- `GlobalEditView` → `initialData={initialData?.globalDocument}`

### Each view — Add initialData to primary useQuery

The pattern is identical for all views. Add the prop, pass it as `initialData` to the primary `useQuery`:

```typescript
// Example: CollectionEditView
const documentQuery = useQuery({
  ...convexQuery(
    isVersioned
      ? anyApi.vex.versions.getDocumentForEdit
      : anyApi.vex.collections.getDocument,
    { collectionSlug: collection.slug, documentId: documentID },
  ),
  initialData: props.initialData ?? undefined,
});
```

```typescript
// Example: DashboardView → CollectionCard
const countQuery = useQuery({
  ...convexQuery(anyApi.vex.collections.countDocuments, {
    collectionSlug: collection.slug,
  }),
  initialData: props.initialCount,
});
```

### GlobalEditView — Convert to TanStack useQuery

GlobalEditView currently uses `useQuery` from `convex/react`. Convert to TanStack `useQuery` with `convexQuery()` to support `initialData`:

```typescript
const docQuery = useQuery({
  ...convexQuery(anyApi.vex.globals.get, { globalSlug: slug }),
  initialData: props.initialData ?? undefined,
});
const doc = docQuery.data as Record<string, unknown> | null | undefined;
```

---

## Step 3: Add server-side prefetching to admin routes

- [ ] Update `admin/[[...path]]/page.tsx` with fetchAuthQuery calls
- [ ] Update AdminPageWrapper to forward initialData
- [ ] Verify build

### File: `apps/www/src/app/admin/[[...path]]/page.tsx`

```typescript
import { sanitizeConfigForClient, isMediaCollection, findCollectionBySlug } from "@vexcms/core"
import { anyApi } from "convex/server"

import config from "~/../vex.config"
import { fetchAuthQuery } from "~/auth/server"
import { AdminPageWrapper } from "../AdminPageWrapper"

const clientConfig = sanitizeConfigForClient(config)

interface Props {
  params: Promise<{ path?: string[] }>
}

export default async function Page({ params }: Props) {
  const { path } = await params
  const [collectionSlug, documentID] = path ?? []

  // TODO: implement
  //
  // 1. If no collectionSlug (dashboard route):
  //    → Build list of all collections: [...config.collections, ...(config.media?.collections ?? [])]
  //    → Promise.all: fetchAuthQuery(anyApi.vex.collections.countDocuments, { collectionSlug: c.slug }) for each
  //    → Build Record<string, number> from results
  //    → initialData = { counts: { pages: 5, headers: 1, ... } }
  //    → Wrap in try/catch — on failure, initialData = undefined
  //
  // 2. If collectionSlug matches a global (check config.globals):
  //    → fetchAuthQuery(anyApi.vex.globals.get, { globalSlug: collectionSlug })
  //    → initialData = { globalDocument: result }
  //
  // 3. If collectionSlug + no documentID (list view):
  //    → fetchAuthQuery(anyApi.vex.collections.countDocuments, { collectionSlug })
  //    → initialData = { count: result }
  //
  // 4. If collectionSlug + documentID (edit view):
  //    → Find the collection in config to check if versioned
  //    → If versioned: fetchAuthQuery(anyApi.vex.versions.getDocumentForEdit, { collectionSlug, documentId: documentID })
  //    → If not: fetchAuthQuery(anyApi.vex.collections.getDocument, { collectionSlug, documentId: documentID })
  //    → initialData = { document: result }
  //
  // Edge cases:
  // - All fetchAuthQuery calls wrapped in try/catch
  // - Unknown slug: don't prefetch, let view handle 404
  // - Global without document: globalDocument = null, view creates it

  return <AdminPageWrapper config={clientConfig} path={path} initialData={initialData} />
}
```

### File: `apps/www/src/app/admin/AdminPageWrapper.tsx`

Add initialData prop forwarding:

```typescript
export function AdminPageWrapper({
  config: _serverConfig,
  path,
  initialData,
}: {
  config: ClientVexConfig
  path?: string[]
  initialData?: AdminPageProps["initialData"]
}) {
  return (
    <AdminPage
      config={clientConfig}
      path={path}
      initialData={initialData}
      ...
    />
  )
}
```

---

## Step 4: Verify and test

- [ ] `pnpm --filter @vexcms/admin-next build` passes
- [ ] `pnpm --filter www build` passes
- [ ] Public pages: no loading state on refresh (home, /features, /pricing, /roadmap)
- [ ] Public pages: TanStack Query metadata available (isLoading, isError, etc.)
- [ ] Preview pages: data renders immediately, live preview still works
- [ ] Admin dashboard: counts render immediately on refresh
- [ ] Admin list views: count renders immediately on refresh
- [ ] Admin edit views: form renders with data immediately on refresh
- [ ] Admin global views: form renders with data immediately on refresh
- [ ] Client-side navigation still works everywhere
- [ ] Theme CSS still loads without flash (ThemeStyle unchanged)

## Success Criteria

- [ ] All data fetching uses TanStack Query + `convexQuery()` — no `usePreloadedQuery` anywhere
- [ ] All routes render without loading spinners on full page refresh
- [ ] All routes still work for client-side navigation (initialData = undefined)
- [ ] Admin prefetch uses `fetchAuthQuery` with full RBAC
- [ ] Public prefetch uses `fetchQuery` (no auth needed)
- [ ] Failed prefetch falls back gracefully to client-only
- [ ] Real-time updates still work after initial render
- [ ] Live preview still works with draft snapshots
