# @vexcms/react

React admin components and hooks for [VexCMS](https://github.com/ianyimi/vex). Provides field input/cell components, admin panel layout and view components, block rendering, and UI primitives used to build a VexCMS admin panel.

## Installation

```bash
pnpm add @vexcms/react@alpha
```

## Field Components

`@vexcms/react` currently exports input/cell components for the `text` field type:

| Component | Field Type |
|-----------|-----------|
| `TextFieldInput` | `text` |
| `TextFieldCell` | `text` |

Input/cell components for the other field types (`url`, `number`, `checkbox`, `select`, `date`, `color`, `upload`, `relationship`, `group`, `array`, `blocks`) exist internally and power the built-in admin panel views (see below), but are not yet exported from the package root.

## Admin Panel Views

Pre-built views and layout used by the generated admin panel:

| Export | Description |
|--------|-------------|
| `AdminLayout` | Top-level admin shell (sidebar + nav) |
| `AppSidebar` | Admin panel navigation sidebar |
| `DashboardView` | Admin dashboard landing view |
| `CollectionListView` | List view for a collection's documents |
| `CollectionEditView` | Create/edit view for a single document |
| `MediaCollectionListView` | List view for the media library |
| `MediaCollectionEditView` | Edit view for a single media document |
| `GlobalsListView` | List view for globals |
| `GlobalEditView` | Edit view for a single global |
| `UnauthorizedView` | Rendered when a user lacks admin panel access |

## Context & Hooks

| Export | Description |
|--------|-------------|
| `VexConfigContext` / `useVexConfig` | Access the resolved VexCMS config |
| `VexAccessProvider` / `useVexAuth` | Auth/session context for the admin panel |
| `useCanAccessAdminPanel` | Check whether the current user may access the admin panel |
| `usePermission` | Check a specific permission |
| `usePaginatedQuery` | Convex paginated query hook used by list views |
| `useModalSurface` / `ModalSurfaceProvider` | Shared modal stacking/state |
| `StorageAdapterContextProvider` | Provides the configured file-storage adapter |

## RenderBlocks

Renders an ordered list of blocks based on a component map:

```tsx
import { RenderBlocks } from "@vexcms/react"

<RenderBlocks
  blocks={page.content}
  components={{ hero: HeroComponent, cta: CTAComponent }}
  fallback={UnknownBlockComponent}
/>
```

## UI Primitives

Reusable UI primitives re-exported from `@vexcms/react`, including `Accordion`, `Badge`, `Button`, `Card`, `Checkbox`, `Dialog`, `DropdownMenu`, `Input`, `Label`, `Popover`, `ScrollArea`, `Select`, `Separator`, `Sheet`, `Sidebar`, `Skeleton`, `Table`, `Tabs`, `Tooltip`, `VexLink`, and `VexImage`, plus a `DataTable` (TanStack Table integration), date/time pickers, drag-and-drop helpers, and `Icon`/theme utilities (`ThemeProvider`, `ThemeToggle`, `ThemeScript`).

## Config Helpers

`relationship()` and `defineCollection()` are re-exported with React-specific type slots bound (e.g. `RelationshipPreviewProps`) so config authored with `@vexcms/react` gets React component types without importing `@vexcms/core` directly.

## Roadmap

Live preview, and versioning/drafts are not yet implemented — see the [roadmap](https://docs.vexcms.dev) for status.

## Peer Dependencies

- `react` / `react-dom`
- `convex`, `@convex-dev/react-query`, `@tanstack/react-query`
- `nuqs`
- `next` (optional)
