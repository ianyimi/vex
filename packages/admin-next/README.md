# @vexcms/admin-next

The admin panel for [VEX CMS](https://github.com/ianyimi/vex), built for Next.js. Provides a complete content management interface with collection CRUD, media management, versioning, live preview, access control, and user impersonation.

## Installation

```bash
pnpm add @vexcms/admin-next
```

## Quick Setup

```tsx
// app/admin/[[...path]]/page.tsx
import { AdminLayout, AdminPage } from "@vexcms/admin-next"
import config from "@/vex.config"

export default function Admin({ params }) {
  return (
    <AdminLayout config={config} user={user}>
      <AdminPage config={config} path={params.path} />
    </AdminLayout>
  )
}
```

## Features

### Collection Management

- **List view** — Paginated data table with search, sorting, bulk delete, and configurable columns
- **Edit view** — Auto-generated forms from collection schema with field validation via TanStack React Form
- **Create/delete** — Dialogs for document creation and deletion with permission checks
- **Bidirectional pagination** — Instant access to first and last pages

### Media Management

- **Grid/list views** — Browse media files with thumbnails
- **Upload** — Drag-and-drop upload with file type detection
- **Media picker** — Inline picker for upload and relationship fields with search and pagination
- **Image dimensions** — Auto-detected on upload

### Versioning & Drafts

- **Draft/publish workflow** — Status badges, publish/unpublish actions
- **Version history** — Dropdown to view, restore, or delete previous versions
- **Autosave** — Configurable auto-save interval for draft documents

### Live Preview

- **Side-by-side panel** — Preview content changes in an iframe alongside the editor
- **Responsive breakpoints** — Test at different screen sizes
- **Snapshot system** — Transient preview data without saving to database

### Access Control

- **Permission provider** — React context for role-based access control
- **Field-level permissions** — Read-only fields based on user roles
- **Collection-level permissions** — Control create, read, update, delete per collection
- **UI enforcement** — Buttons and actions hidden/disabled based on permissions

### User Impersonation

- **Impersonation banner** — Shows when an admin is viewing as another user
- **User switching** — Select from impersonatable users list

### Admin Layout

- **Sidebar navigation** — Collections grouped by `admin.group`, with auth and media sections
- **Theme support** — Light/dark mode
- **User menu** — Profile, sign out, impersonation controls

## Exports

| Export | Description |
|--------|-------------|
| `AdminPage` | Main routing component — renders the correct view based on URL path |
| `AdminLayout` | Server-side layout wrapper with sidebar and theme |
| `PermissionProvider` | React context provider for RBAC |
| `usePermission` | Hook to check a single action permission |
| `usePermissions` | Hook to check all CRUD permissions for a resource |
| `usePermissionContext` | Hook to access the full permission context |
| `ImpersonationBanner` | Banner component for admin impersonation |
| `useMediaPickerState` | Hook for media picker state management |

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
