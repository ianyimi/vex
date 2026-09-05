# @vexcms/next

The Next.js adapter for [VEX CMS](https://github.com/ianyimi/vex). Provides the server and client components that render the admin panel — collection CRUD, media management, and role-based access control — plus config functions re-exported from `@vexcms/react`.

## Installation

```bash
pnpm add @vexcms/next@alpha
```

## Quick Setup

```tsx
// app/admin/layout.tsx
import { NextAdminLayout } from "@vexcms/next/client"
import config from "@/vex.config"
import { getCurrentUser } from "@/auth/serverUtils"

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  return (
    <NextAdminLayout config={config} user={user ?? undefined}>
      {children}
    </NextAdminLayout>
  )
}
```

```tsx
// app/admin/[[...path]]/page.tsx
import { NextAdminPage } from "@vexcms/next/server"
import config from "@/vex.config"

export default function AdminPage({
  params,
}: {
  params: Promise<{ path?: string[] }>
}) {
  return <NextAdminPage config={config} params={params} />
}
```

`NextAdminPage` and `NextAdminLayout` are exported from separate subpaths (`/server` and `/client`) rather than the package root, because an async server component and a `"use client"` component cannot share one bundle.

## Features

### Collection Management

- **List view** — Data table with Load More pagination, row selection, and bulk delete
- **Edit view** — Auto-generated forms from the collection schema, submitted via TanStack React Form
- **Create dialog** — Modal for document creation, gated by a `create` permission check

### Media Management

- **Grid/list views** — Browse media files with thumbnails
- **Upload** — Drag-and-drop or click-to-upload through the collection's configured storage adapter
- **Media picker** — Inline picker for upload fields, with a client-side search filter and Load More pagination

### Roadmap note

Versioning, drafts, and live preview are not implemented yet — both are in progress on the [roadmap](https://docs.vexcms.dev). A global's `versions.drafts` option parses and is stored on the resolved config, but it is not enforced: every read still returns the live document. See [docs.vexcms.dev](https://docs.vexcms.dev) for current status.

### Access Control

- **Access provider** — `VexAccessProvider` supplies the RBAC access matrix to the admin panel via React context
- **Collection-level permissions** — `usePermission` gates create, read, update, and delete per collection and per global
- **UI enforcement** — Buttons and actions are disabled or hidden when the current user lacks permission

### Admin Layout

- **Sidebar navigation** — Links grouped into Collections, Globals, and Media sections
- **Theme support** — Light, dark, and system modes via `ThemeToggle`

## Exports

| Export | From | Description |
|--------|------|-------------|
| `NextAdminPage` | `@vexcms/next/server` | Async server component that routes the admin panel by URL path (dashboard, list, edit) |
| `NextAdminLayout` | `@vexcms/next/client` | Client component rendering the admin shell (sidebar, theme, breadcrumbs) around page content |
| `defineConfig`, `defineCollection`, `relationship`, `text`, `number`, `select`, `date`, `url`, `checkbox` | `@vexcms/next` | Config functions re-exported from `@vexcms/react` |

The compiled stylesheet is available at `@vexcms/next/styles`.

## Peer Dependencies

- `next` — Next.js 14+
- `react` / `react-dom` — React 18+
- `convex` — Convex backend
- `@convex-dev/react-query` — Convex React Query integration
- `@tanstack/react-query` — Data fetching
- `@tanstack/react-form` — Form state management
- `@tanstack/react-table` — Table component
- `nuqs` — URL query string state
- `zod` — Schema validation
