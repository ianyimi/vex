# VEX CMS v1 Rebuild — Architecture Document

## Why Rebuild

The current codebase was primarily built by AI. While it works and has 560+ tests, the developer (sole maintainer) doesn't have deep context on how every piece fits together. The rebuild is about **ownership** — rewriting every line so the maintainer can confidently extend, debug, and evolve the project long-term.

### Pain Points to Fix

1. **Code I don't understand** — the primary motivation. Every line must be code I wrote.
2. **Package boundaries are wrong** — admin-next mixes framework-specific and framework-agnostic code, core has too much, UI has Next.js assumptions.
3. **Config structure is tangled** — the import chain from config → collections → blocks → React components causes issues (server code importing client components, circular deps).
4. **Framework coupling** — everything assumes Next.js. No path to Svelte, Solid, TanStack Start, or Astro.

### What to Keep

- **560+ tests** — these are the specification. Port them to the new repo and make them pass.
- **Field type system** — the 16 field types and their schema/value type generation is solid.
- **defineConfig / defineCollection / defineAccess / defineBlock APIs** — the developer-facing API is good. The internals need rewriting.
- **Convex integration patterns** — schema generation, auto-migration, vexQuery, preview snapshots.
- **Block system** — blocks field, block picker, block styles, RenderBlocks.

---

## Package Architecture

```
@vexcms/core              Pure TS. The foundation — everything always needed regardless of framework.
                          Contains: config builders, types, fields, schema gen, permissions, metadata,
                          plugins, Convex runtime (model functions, vexQuery, preview snapshots,
                          version management), headless admin logic (view routing, form orchestration,
                          field resolution, block editor state). Zero framework dependencies. Zero UI.

@vexcms/react             React admin panel + UI components. Exports AdminLayout, AdminPage, and
                          all form field components, block editor, data table, media picker, sidebar.
                          Usable standalone (Vite + React, no SSR) or as a dependency of framework
                          packages (@vexcms/next, @vexcms/tanstack). Accepts framework slots for
                          elements like Link/Image that differ across React-based frameworks.
                          Also re-exports defineConfig with React ComponentType baked in.

@vexcms/next              Next.js integration. Exports AdminLayout + AdminPage components for direct
                          use in app/admin routes. Server-side helpers (fetchQuery, ThemeStyle,
                          generateMetadata). Imports @vexcms/react for UI, wires in next/link, etc.

@vexcms/tanstack          TanStack Start integration. Uses @vexcms/react for UI, wires in
                          TanStack Router's Link, server functions, SSR helpers.

@vexcms/svelte            SvelteKit integration. Own Svelte UI components (NOT @vexcms/react).
                          Imports headless logic from @vexcms/core. SvelteKit routes for admin shell.
                          Custom field components written in Svelte.

@vexcms/solid             SolidStart integration. Own Solid UI components. Same pattern as Svelte.

@vexcms/cli               CLI tooling. Schema generation, dev server, file watching.
                          Depends only on @vexcms/core.

@vexcms/better-auth       Better Auth adapter. Auth table definitions, session management.
@vexcms/auth-clerk        Clerk adapter (future).
@vexcms/auth-authjs       Auth.js adapter (future).

@vexcms/storage-convex    Convex file storage adapter.
@vexcms/storage-s3        S3 storage adapter (future).
@vexcms/storage-r2        Cloudflare R2 adapter (future).

@vexcms/plugin-seo        SEO plugin. Injects meta fields into collections via config transform.
@vexcms/richtext          Rich text field. Editor + renderer.

create-vexcms             Project scaffolding CLI.
```

**Why admin logic and Convex runtime are in core (not separate packages):**
- The admin headless logic (view routing, form orchestration, field resolution) is always required regardless of framework. Separating it would just add a mandatory dependency with no real benefit.
- Convex is the only supported backend. Making it a separate package implies future backend-agnosticism that isn't planned. Keeping it in core simplifies the dependency graph.
- Fewer packages = fewer things to publish, version, and keep in sync.

### Dependency Graph

```
                    @vexcms/core
                      /      \
                     /        \
              @vexcms/react  @vexcms/cli
               /    |    \
              /     |     \
        @vexcms/  @vexcms/  @vexcms/
          next    tanstack    remix

  @vexcms/svelte ← @vexcms/core (no @vexcms/react, own Svelte UI)
  @vexcms/solid  ← @vexcms/core (no @vexcms/react, own Solid UI)
```

---

## @vexcms/core — What Lives Here

The core package is the foundation. Everything that's always needed regardless of framework lives here. Zero framework dependencies, zero UI.

### Config Builders
- `defineConfig()` — top-level config with plugin execution
- `defineCollection()` — collection definitions with typed fields
- `defineGlobal()` — global singleton definitions
- `defineBlock()` — block type definitions
- `defineAccess()` — RBAC permission matrix with typed roles/resources

### Field System
- 16+ field type helpers: `text()`, `number()`, `select()`, `blocks()`, `richtext()`, etc.
- Each field type is a pure function returning a typed field definition object
- Field admin config (components, position, width, description, readOnly)

### Schema Generation
- `generateVexSchema()` — generates Convex schema from config
- `generateVexTypes()` — generates TypeScript interfaces
- `generateCollectionQueries()` — generates per-collection CRUD files
- `diffSchema()` / `planMigration()` — schema diffing and auto-migration

### Permissions
- `hasPermission()` — runtime permission checking
- `checkAdminAccess()` — admin panel access checking
- `resolvePermissionCheck()` — field-level permission resolution

### Metadata
- `buildSiteMetadata()` — framework-agnostic metadata merging

### Plugin System
- `VexPlugin` type: `(config) => config`
- Plugin execution in `defineConfig` — sequential transform before resolution
- Lifecycle hooks interface (beforeCreate, afterCreate, beforeUpdate, afterUpdate, beforeDelete, afterDelete)

### Styles
- `blockStylesToTailwind()` — converts block style JSON to Tailwind classes
- Style presets (spacing, font sizes, border radius, etc.)

### Form Logic (framework-agnostic)

The logic underneath form hooks lives in core as pure functions. Each framework wraps these in its own reactive primitive (React hook, Svelte store, Solid signal).

```typescript
// @vexcms/core — pure functions, no framework
function resolveFieldState(props: {
  value: unknown
  fieldDef: VexField
  errors: string[]
  touched: boolean
  submitted: boolean
}): { showError: boolean; readOnly: boolean; errors: string[] }

function validateFieldValue(props: {
  value: unknown
  fieldDef: VexField
}): string[]  // returns error messages
```

Framework packages wrap these:
- `@vexcms/react` exports `useVexField()` — React hook that calls core's pure functions
- `@vexcms/svelte` exports a Svelte store that calls the same core functions
- `@vexcms/solid` exports a Solid signal that calls the same core functions

The core functions are the single source of truth for field behavior. Framework wrappers only add reactivity.

### Framework Adapter Contract

Core exports a TypeScript interface that every framework package must satisfy. This ensures no framework package ships with missing field components, views, or required exports. TypeScript catches incomplete adapters at build time.

Core defines the exact props interface for every component slot. The adapter maps each slot to a function that accepts those specific props. This way TypeScript validates not just that the component exists, but that it accepts the right props.

```typescript
// @vexcms/core — props interfaces for every slot

// Field component props (core exports all of these)
interface TextFieldComponentProps {
  name: string
  value: string
  onChange: (value: string) => void
  fieldDef: TextFieldDef
  readOnly: boolean
  errors: string[]
  showError: boolean
}

interface SelectFieldComponentProps {
  name: string
  value: string
  onChange: (value: string) => void
  fieldDef: SelectFieldDef
  readOnly: boolean
  errors: string[]
  showError: boolean
}

// ... similar for all 16 field types

// View props (core exports all of these)
interface DashboardViewProps {
  config: ClientVexConfig
  initialCounts?: Record<string, number>
}

interface ListViewProps {
  config: ClientVexConfig
  collection: VexCollection
  initialCount?: number
}

interface EditViewProps {
  config: ClientVexConfig
  collection: VexCollection
  documentId: string
  initialData?: Record<string, unknown> | null
}

// ... similar for all 6 views

// The adapter is generic over TRendered — the return type of components in this framework
interface VexFrameworkAdapter<TRendered> {
  AdminLayout: (props: AdminLayoutProps) => TRendered
  AdminPage: (props: AdminPageProps) => TRendered

  fieldComponents: {
    text: (props: TextFieldComponentProps) => TRendered
    number: (props: NumberFieldComponentProps) => TRendered
    select: (props: SelectFieldComponentProps) => TRendered
    checkbox: (props: CheckboxFieldComponentProps) => TRendered
    date: (props: DateFieldComponentProps) => TRendered
    relationship: (props: RelationshipFieldComponentProps) => TRendered
    upload: (props: UploadFieldComponentProps) => TRendered
    richtext: (props: RichtextFieldComponentProps) => TRendered
    blocks: (props: BlocksFieldComponentProps) => TRendered
    array: (props: ArrayFieldComponentProps) => TRendered
    object: (props: ObjectFieldComponentProps) => TRendered
    color: (props: ColorFieldComponentProps) => TRendered
    tabs: (props: TabsFieldComponentProps) => TRendered
    imageUrl: (props: ImageUrlFieldComponentProps) => TRendered
    json: (props: JsonFieldComponentProps) => TRendered
    ui: (props: UIFieldComponentProps) => TRendered
  }

  views: {
    dashboard: (props: DashboardViewProps) => TRendered
    list: (props: ListViewProps) => TRendered
    edit: (props: EditViewProps) => TRendered
    mediaList: (props: MediaListViewProps) => TRendered
    mediaEdit: (props: MediaEditViewProps) => TRendered
    globalEdit: (props: GlobalEditViewProps) => TRendered
  }
}
```

Framework packages validate with `satisfies`:

```typescript
// @vexcms/react
import type { VexFrameworkAdapter } from "@vexcms/core"
import type { ReactElement } from "react"

const adapter = {
  AdminLayout,
  AdminPage,
  fieldComponents: {
    text: TextField,       // TS checks: accepts TextFieldComponentProps, returns ReactElement?
    number: NumberField,   // TS checks: accepts NumberFieldComponentProps, returns ReactElement?
    select: SelectField,
    // ... all 16 field types
  },
  views: {
    dashboard: DashboardView,
    list: ListView,
    edit: EditView,
    mediaList: MediaGridView,
    mediaEdit: MediaEditView,
    globalEdit: GlobalEditView,
  },
} satisfies VexFrameworkAdapter<ReactElement>

export default adapter
```

If a component is missing → TypeScript error.
If a component accepts wrong props → TypeScript error.
If a component returns the wrong type → TypeScript error.

**The adapter and defineConfig serve different purposes:**

- **`VexFrameworkAdapter`** is an internal build-time check for **framework package authors**. It guarantees the package implements all required components with correct props and return types. End developers never touch it.

- **`defineConfig`** is the developer-facing API. It uses the `TComponent` generic to validate custom field components match the framework. The adapter doesn't need to be passed to `defineConfig`.

```typescript
// @vexcms/react — validates its own completeness at build time
const adapter = { ... } satisfies VexFrameworkAdapter<ReactElement>

// @vexcms/react — re-exports defineConfig with React component type
export function defineConfig(config: VexConfigInput<ComponentType>) {
  return coreDefineConfig(config)
}
```

The adapter ensures the framework package is complete. `defineConfig` ensures the developer's custom components are the right type. They're complementary but separate concerns.

### Convex Runtime (in core)
- Model functions — `getDocument`, `listDocuments`, `createDocument`, `updateDocument`, `deleteDocument`
- `vexQuery` / `createVexQuery` — draft-aware query builder
- Preview snapshots — `upsertPreviewSnapshot`, `deletePreviewSnapshot`, `getPreviewSnapshot`
- Version management — `createVersion`, `getLatestVersion`, `cleanupOldVersions`

### Headless Admin Logic (in core)

All admin panel *behavior* without any UI rendering. Framework packages consume this to build their admin UIs.

### View Router
```typescript
// Given a URL path, determine which view to render
resolveAdminView({ path: string[], config: VexConfig }): AdminView

type AdminView =
  | { type: "dashboard" }
  | { type: "list"; collection: VexCollection }
  | { type: "edit"; collection: VexCollection; documentId: string }
  | { type: "media-list"; collection: VexCollection }
  | { type: "media-edit"; collection: VexCollection; documentId: string }
  | { type: "global-edit"; global: VexGlobal }
  | { type: "not-found" }
```

### Form Orchestration
```typescript
// Given a collection's fields, produce everything needed to render a form
buildFormConfig({ collection, document?, permissions? }): FormConfig

interface FormConfig {
  fieldEntries: FieldEntry[]       // ordered, filtered by permissions
  defaultValues: Record<string, unknown>
  validationSchema: ZodSchema
  readOnlyFields: Set<string>
}
```

### Field Resolution
```typescript
// Resolve a field definition to rendering instructions
resolveField({ field, name, permissions }): ResolvedField

interface ResolvedField {
  type: string
  name: string
  label: string
  required: boolean
  readOnly: boolean
  hidden: boolean
  position: "main" | "sidebar"
  width: "full" | "half"
  customComponent?: boolean  // framework package provides the component
  // ... everything a renderer needs to know WITHOUT knowing which framework
}
```

### Block Editor State
```typescript
// Manages block ordering, add/remove/duplicate, drag state
createBlockEditorState({ blocks, blockDefs }): BlockEditorState

interface BlockEditorState {
  blocks: BlockInstance[]
  addBlock(type: string): void
  removeBlock(key: string): void
  duplicateBlock(key: string): void
  moveBlock(from: number, to: number): void
  updateBlockField(key: string, field: string, value: unknown): void
}
```

Data prefetching is NOT in core — each framework package handles its own SSR/prefetch pattern directly (Next.js uses `fetchQuery` in server components, SvelteKit uses `+page.server.ts` load functions, etc.). The view router in core tells the framework package *which view* to render, and the framework package decides what to prefetch for that view.

---

## @vexcms/react — React UI Components

React implementations of the admin panel UI. These are the building blocks that framework packages compose.

### Framework Slots

React admin components need framework-specific elements (Link, Image, navigation). Rather than trying to unify different framework APIs, `@vexcms/react` defines a simple contract and each framework package wraps its own components to match:

```typescript
// @vexcms/react defines the minimal contract
interface AdminComponents {
  Link: ComponentType<{ href: string; children: ReactNode; className?: string }>
  Image?: ComponentType<{ src: string; alt: string; width?: number; height?: number }>
  navigate: (path: string) => void
}
```

Each React-based framework package wraps its own components to match this contract:

```typescript
// @vexcms/next wraps Next.js components
import NextLink from "next/link"
import NextImage from "next/image"
import { useRouter } from "next/navigation"

const components: AdminComponents = {
  Link: ({ href, children, className }) => (
    <NextLink href={href} className={className}>{children}</NextLink>
  ),
  Image: NextImage,
  navigate: (path) => router.push(path),
}
```

Framework-specific props (like Next.js `prefetch`, `scroll`, `replace`) are handled inside the wrapper — the admin UI components never see them. They only use the simple contract.

**This only applies to React-based framework packages.** Non-React frameworks (Svelte, Solid) build their own UI components and use their native Link/Image directly — no slots needed.

### Component Exports

**Admin shell (standalone-capable):**
- `AdminLayout` — sidebar, navigation, providers. Usable directly in a Vite + React app.
- `AdminPage` — view routing, renders the correct view based on URL path.
- `defineConfig` — re-exported with React `ComponentType` generic baked in.

**Views:**
- `DashboardView` — collection cards with counts
- `ListView` — data table with pagination, search, bulk actions
- `EditView` — form with fields, save/publish/delete/duplicate
- `MediaGridView` — media library grid with upload
- `MediaEditView` — single media document editor
- `GlobalEditView` — global singleton editor

**Form components:**
- `FormField` — dispatches to the correct field component based on type
- `BlockEditor` — block list with drag-drop, picker, inline edit
- `TextField`, `SelectField`, `BlocksField`, etc. — individual field components

**Usage in plain React (Vite, no SSR):**
```typescript
// vex.config.ts
import { defineConfig } from "@vexcms/react"

// App.tsx — client-side routing
import { AdminLayout, AdminPage } from "@vexcms/react"
import { BrowserRouter, Route } from "react-router-dom"

<BrowserRouter>
  <Route path="/admin/*" element={
    <AdminLayout config={config}>
      <AdminPage config={config} path={currentPath} />
    </AdminLayout>
  } />
</BrowserRouter>
```

**Usage via @vexcms/next (adds SSR):**
```typescript
// @vexcms/next re-exports AdminLayout and AdminPage from @vexcms/react,
// but wraps them with server-side prefetching, auth guards, etc.
import { AdminLayout, AdminPage } from "@vexcms/next"
```

### Custom Field Components

Developers register custom field components via `admin.components.Field` on field definitions. In React framework packages, these are React components. The `FormField` component checks for custom components and renders them with a standard props interface:

```typescript
interface CustomFieldProps {
  name: string
  fieldDef: VexField
  readOnly: boolean
  field?: { state: { value: unknown }; handleChange: (v: unknown) => void }
}
```

---

## Framework Packages

### Custom Component Typing via Generics

The core challenge: a field's `admin.components.Field` is a React component in Next.js, a Svelte component in SvelteKit, etc. Core can't import React or Svelte types. The solution: **generics that thread through the entire config tree**.

**Core defines everything with `TComponent = unknown`:**

```typescript
// @vexcms/core — no framework deps
interface FieldAdminConfig<TComponent = unknown> {
  components?: {
    Field?: TComponent
    Cell?: TComponent
  }
  // ... other admin config
}

// Field helpers accept the generic
function text<TComponent = unknown>(props: {
  label: string
  admin?: FieldAdminConfig<TComponent>
}): TextFieldDef<TComponent>

// Collections thread it through
interface VexCollection<TFields, TExtraKeys, TSlug, TComponent = unknown> {
  fields: Record<string, VexField<TComponent>>
  // ...
}

// Config threads it through
interface VexConfigInput<TComponent = unknown> {
  collections?: VexCollection<any, any, any, TComponent>[]
  globals?: VexGlobal<any, any, TComponent>[]
  // ...
}

function defineConfig<TComponent = unknown>(
  config: VexConfigInput<TComponent>
): VexConfig
```

**Framework packages re-export `defineConfig` with the component type baked in:**

```typescript
// @vexcms/next
import type { ComponentType } from "react"
import { defineConfig as coreDefineConfig, type VexConfigInput } from "@vexcms/core"

export function defineConfig(config: VexConfigInput<ComponentType>) {
  return coreDefineConfig(config)
}

// @vexcms/svelte (future)
import type { SvelteComponent } from "svelte"
import { defineConfig as coreDefineConfig, type VexConfigInput } from "@vexcms/core"

export function defineConfig(config: VexConfigInput<typeof SvelteComponent>) {
  return coreDefineConfig(config)
}
```

**Developers import `defineConfig` from the framework package, everything else from core:**

```typescript
// vex.config.ts
import { defineConfig } from "@vexcms/next"           // ← sets component type to React
import { defineCollection, text, blocks } from "@vexcms/core"  // ← field helpers from core
import { IconPickerField } from "./components/admin/IconPickerField"

export default defineConfig({
  collections: [
    defineCollection({
      slug: "pages",
      fields: {
        icon: text({
          admin: {
            components: {
              Field: IconPickerField  // ← TypeScript validates this is a React ComponentType
            }
          }
        }),
      }
    })
  ]
})
```

TypeScript infers the `TComponent` generic from the `defineConfig` call and threads it down to every field's `admin.components`. If `IconPickerField` isn't a valid React component, TypeScript errors. If the developer imports `defineConfig` from `@vexcms/svelte` instead, TypeScript would expect a Svelte component.

**The key rule:** `defineConfig` comes from the framework package. Everything else (`defineCollection`, `text()`, `select()`, `defineBlock()`, `defineAccess()`, etc.) comes from `@vexcms/core`. The framework package only re-exports `defineConfig` — it's the single entry point that sets the component type for the entire config.

**Multiple levels of framework packages re-export `defineConfig`:**
- `@vexcms/react` — re-exports with `ComponentType` for plain React apps (Vite, CRA)
- `@vexcms/next` — re-exports from `@vexcms/react` (same type, adds Next.js SSR helpers)
- `@vexcms/tanstack` — re-exports from `@vexcms/react` (same type, adds TanStack Start helpers)
- `@vexcms/svelte` — re-exports with Svelte component type

A Vite + React developer imports from `@vexcms/react`. A Next.js developer imports from `@vexcms/next`. Both get React `ComponentType` validation. The difference is that `@vexcms/next` also provides server-side helpers that `@vexcms/react` doesn't.

### @vexcms/next

**Admin Shell — exported as components, not factory functions:**

```typescript
// Developer's app/admin/layout.tsx:
import { AdminLayout } from "@vexcms/next"
import config from "~/vex.config"
export default function Layout({ children }) {
  return <AdminLayout config={config}>{children}</AdminLayout>
}

// Developer's app/admin/[[...path]]/page.tsx:
import { AdminPage } from "@vexcms/next"
import config from "~/vex.config"
export default function Page({ params }) {
  return <AdminPage config={config} path={params.path} />
}
```

`AdminLayout` handles: auth check, redirect if unauthorized, sidebar, providers, prefetch.
`AdminPage` handles: view routing, data prefetch, rendering the correct view component.

**Public Site Helpers:**
- `fetchPage(slug)` — fetchQuery wrapper for pages
- `fetchGlobal(slug)` — fetchQuery wrapper for globals
- `fetchActiveTheme()` — resolves site settings → active theme
- `generatePageMetadata(slug)` — returns Next.js Metadata from buildSiteMetadata
- `ThemeStyle` — server component for SSR theme CSS
- `normalizeSlug()` — slug normalization utility

**Auth Integration:**
- `fetchAuthQuery()` / `fetchAuthMutation()` — from @convex-dev/better-auth/nextjs
- `checkAdminAccess()` guard in admin layout

### @vexcms/svelte (future)

**Admin Shell:**
- SvelteKit routes: `routes/admin/+layout.server.ts`, `routes/admin/[...path]/+page.svelte`
- Svelte components for every admin view (sidebar, list, edit, media, blocks)
- Svelte form field components for every field type
- Custom field components written in Svelte

**Public Site Helpers:**
- SvelteKit load functions for pages, globals, themes
- Svelte component for theme CSS injection

---

## Plugin System

### Config Transform (existing)
```typescript
type VexPlugin = (config: VexConfigInput) => VexConfigInput
```

### Lifecycle Hooks (new)
```typescript
interface VexHooks {
  beforeCreate?: (props: { collection: string; data: Record<string, unknown> }) => Record<string, unknown> | void
  afterCreate?: (props: { collection: string; documentId: string; data: Record<string, unknown> }) => void
  beforeUpdate?: (props: { collection: string; documentId: string; data: Record<string, unknown> }) => Record<string, unknown> | void
  afterUpdate?: (props: { collection: string; documentId: string; data: Record<string, unknown> }) => void
  beforeDelete?: (props: { collection: string; documentId: string }) => void
  afterDelete?: (props: { collection: string; documentId: string }) => void
}
```

Hooks are registered via config:
```typescript
defineConfig({
  hooks: {
    afterCreate: ({ collection, documentId }) => {
      if (collection === "posts") sendNotification(documentId)
    }
  }
})
```

Or via plugins:
```typescript
const auditPlugin = (): VexPlugin => (config) => ({
  ...config,
  hooks: mergeHooks(config.hooks, {
    afterCreate: ({ collection, documentId }) => logAudit("create", collection, documentId),
    afterUpdate: ({ collection, documentId }) => logAudit("update", collection, documentId),
    afterDelete: ({ collection, documentId }) => logAudit("delete", collection, documentId),
  }),
})
```

### Admin UI Slots (new)
```typescript
interface VexAdminSlots {
  // Inject items into the sidebar
  sidebarItems?: AdminSidebarItem[]
  // Inject buttons into the edit view toolbar
  editToolbarActions?: AdminToolbarAction[]
  // Inject tabs into the edit view
  editTabs?: AdminEditTab[]
  // Custom dashboard widgets
  dashboardWidgets?: AdminDashboardWidget[]
}
```

Plugins declare UI slots:
```typescript
const seoPlugin = (opts): VexPlugin => (config) => ({
  ...config,
  admin: {
    ...config.admin,
    slots: mergeSlots(config.admin?.slots, {
      editTabs: [{ slug: "seo", label: "SEO", component: SEOTab }],
    }),
  },
})
```

---

## Rebuild Phases

### Phase 0: Scaffold (Week 1)
- [ ] New monorepo with pnpm workspaces
- [ ] Package stubs: core, react, next, cli, better-auth, storage-convex, richtext
- [ ] Shared tsconfig, vitest config, tsup build
- [ ] Port test infrastructure from current repo
- [ ] CI with build + test

### Phase 1: Core (Weeks 1-2)
- [ ] Field type system — all 16 types with helpers
- [ ] Config builders — defineConfig, defineCollection, defineGlobal, defineBlock, defineAccess
- [ ] Schema generation — generateVexSchema, generateVexTypes
- [ ] Convex runtime — model functions, vexQuery, preview snapshots, version management
- [ ] Headless admin logic — view router, form orchestration, field resolution, block editor state
- [ ] Plugin system — VexPlugin type, plugin execution, lifecycle hooks
- [ ] Permissions — hasPermission, checkAdminAccess
- [ ] Metadata — buildSiteMetadata
- [ ] Styles — blockStylesToTailwind
- [ ] Port all core tests (560+), make them pass

### Phase 2: CLI + Auth + Storage (Week 2)
- [ ] @vexcms/cli — dev server, file watching, schema diffing, auto-migration
- [ ] @vexcms/better-auth — auth adapter
- [ ] @vexcms/storage-convex — file storage adapter

### Phase 3: React UI (Weeks 3-4)
- [ ] @vexcms/react — all form field components, block editor, data table, media picker
- [ ] Framework slots interface (Link, Image, navigate)
- [ ] Custom field component support
- [ ] Admin views: dashboard, list, edit, media-list, media-edit, global-edit

### Phase 4: Next.js Integration (Week 4)
- [ ] @vexcms/next — AdminLayout, AdminPage components
- [ ] SSR helpers — fetchQuery wrappers, ThemeStyle, generateMetadata
- [ ] Auth integration — fetchAuthQuery, checkAdminAccess in layout
- [ ] create-vexcms templates (base + marketing-site)
- [ ] End-to-end: scaffold → dev → build → deploy

### Phase 5: Polish + Ship (Week 5)
- [ ] Documentation site
- [ ] Demo site with daily reset
- [ ] Marketing site (dogfooded with VEX)
- [ ] npm publish
- [ ] Plugin: @vexcms/plugin-seo

### Future Phases
- [ ] @vexcms/svelte — SvelteKit admin + public helpers
- [ ] @vexcms/solid — SolidStart admin + public helpers
- [ ] @vexcms/tanstack — TanStack Start integration
- [ ] @vexcms/astro — Astro integration
- [ ] Enterprise: environments, SSO, workflows
- [ ] Additional auth adapters (Clerk, Auth.js)
- [ ] Additional storage adapters (S3, R2)

---

## Key Architectural Principles

1. **Core is pure.** Zero framework deps, zero UI. If it doesn't need React/Svelte/Next.js to work, it goes in core.

2. **Admin is headless first.** All admin panel logic (what to render, what data to show, what actions are available) is computed by @vexcms/admin. Framework packages just render it.

3. **Framework packages are thin wrappers.** They import headless logic and render it with framework-native components + routing.

4. **React UI is shared among React frameworks.** @vexcms/next and @vexcms/tanstack both import from @vexcms/react. They only differ in routing, SSR, and navigation.

5. **Non-React frameworks build their own UI.** @vexcms/svelte has Svelte components that consume the same headless logic from @vexcms/admin.

6. **Plugins transform config.** The `(config) => config` pattern is the primary extension mechanism. Hooks and UI slots are secondary.

7. **Convex is the only backend vendor lock-in.** Everything else (auth, storage, framework) is pluggable via adapters.

8. **Tests are the specification.** Port tests first, then implement until they pass. If there's no test, the behavior isn't guaranteed.

9. **Every line is my code.** The rebuild exists so the maintainer understands every decision, every pattern, every edge case. AI assists with boilerplate and exploration, but the developer writes the logic.
