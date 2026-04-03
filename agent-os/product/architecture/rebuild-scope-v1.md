# VEX CMS v1 Rebuild — Full Scope Document

This document defines the complete scope of the v1 rebuild — what ships in 0.1.0, what is deferred, and what architectural decisions are locked in. Use this alongside `rebuild-v1.md` (architecture) and `rebuild-planning.md` (planning + open questions).

---

## 0.1.0 Package Scope

### Packages Shipping in 0.1.0

| Package | Role |
|---|---|
| `@vexcms/core` | Config builders, field system, schema gen, permissions, headless admin logic, Convex runtime, plugin system |
| `@vexcms/react` | React admin panel UI, all field components, views, data hooks, AdminFrameworkBindings |
| `@vexcms/next` | Next.js integration — AdminLayout, AdminPage, SSR helpers, auth wiring, createAdminPage |
| `@vexcms/cli` | Dev server, file watching, schema generation, auto-migration |
| `@vexcms/better-auth` | Better Auth adapter — auth tables through schema gen, session management |
| `@vexcms/storage-convex` | Convex-native file storage adapter (convexStorage) |
| `@vexcms/richtext-plate` | Plate.js rich text editor adapter |
| `create-vexcms` | Project scaffolding CLI — scaffold new projects with vex pre-configured |

### Packages Deferred Post-0.1.0

| Package | Status |
|---|---|
| `@vexcms/tanstack` | Deferred — TanStack Start integration |
| `@vexcms/svelte` | Deferred — SvelteKit integration (own Svelte UI, not @vexcms/react) |
| `@vexcms/solid` | Deferred — SolidStart integration |
| `@vexcms/storage-s3` | Deferred — S3 storage adapter |
| `@vexcms/storage-r2` | Deferred — Cloudflare R2 storage adapter |
| `@vexcms/auth-clerk` | Deferred — Clerk auth adapter |
| `@vexcms/auth-authjs` | Deferred — Auth.js adapter |
| `@vexcms/plugin-seo` | Deferred — SEO plugin (can be built post-0.1.0 using plugin system) |

---

## @vexcms/core — Included Features

### Config Builders
- `defineConfig()` — top-level config with plugin execution, TComponent generic, tiered config (auth optional)
- `defineCollection()` — collection definitions with typed fields, versions flag, indexes
- `defineGlobal()` — global singleton definitions
- `defineBlock()` — block type definitions
- `defineAccess()` — RBAC permission matrix with typed roles/resources
- `buildAdminUI()` — identity validator function in `@vexcms/core/adapter.ts` — TypeScript-enforces completeness of AdminPanelSpec at compile time. Missing any FieldType or AdminView → compile error.

### Field System — 19 Field Types (0.1.0)
`text`, `number`, `select`, `checkbox`, `date`, `relationship`, `upload`, `richtext`, `blocks`, `array`, `object`, `color`, `tabs`, `imageUrl`, `json`, `ui`, `email`, `url`, `phone`

Each field type:
- Pure function returning typed FieldDef
- `fieldToValidator()` dispatcher — maps FieldType → Convex validator
- React form component (`TextField`, `SelectField`, etc.) — lives in @vexcms/react
- Cell component for list view display — lives in @vexcms/react

### Schema Generation
- `generateVexSchema()` — generates Convex `defineTable()` schema from config
- `generateVexTypes()` — generates TypeScript interfaces from collection definitions
- `generateCollectionQueries()` — generates per-collection CRUD Convex function files
- `diffSchema()` — diffs current vs new schema, produces migration plan
- `planMigration()` — produces 3-phase migration plan (interim → mutations → final)

### Permissions
- `hasPermission()` — runtime permission checking
- `checkAdminAccess()` — admin panel access gate
- `resolvePermissionCheck()` — field-level permission resolution
- `sanitizeConfigForClient()` — strips server-only config before sending to browser

### Headless Admin Logic
- `resolveAdminView()` — given URL path → AdminView discriminated union (dashboard | list | edit | media-list | media-edit | global-edit | not-found)
- `resolveAdminQuery()` — given current view → Convex query ref + args (used for optional server prefetch)
- `buildFormConfig()` — given collection + permissions → ordered FieldEntry list, defaultValues, validationSchema, readOnlyFields
- `resolveField()` — given field + name + permissions → ResolvedField (everything renderer needs, no framework dep)
- `createBlockEditorState()` — manages block ordering, add/remove/duplicate, move, update

### Convex Runtime
- `getDocument`, `listDocuments`, `createDocument`, `updateDocument`, `deleteDocument` — model function helpers
- `vexQuery` / `createVexQuery` — draft-aware query builder
- `upsertPreviewSnapshot`, `deletePreviewSnapshot`, `getPreviewSnapshot` — live preview support

### Plugin System
- `VexPlugin` type: `(config: VexConfigInput) => VexConfigInput` — pure config transform
- Plugin execution in `defineConfig` — sequential transforms before config resolution
- `VexHooks` interface — `beforeCreate`, `afterCreate`, `beforeUpdate`, `afterUpdate`, `beforeDelete`, `afterDelete`
- Admin UI slots — `sidebarItems`, `editToolbarActions`, `editTabs`, `dashboardWidgets`

### Metadata + Styles
- `buildSiteMetadata()` — framework-agnostic metadata merging
- `blockStylesToTailwind()` — block style JSON → Tailwind class list
- Style presets — spacing, font sizes, border radius, color tokens

### Errors
- `VexError` base class
- `VexConfigError`, `VexPermissionError`, `VexValidationError`, `VexSchemaError`, `VexMigrationError`
- Each error: `code`, `message`, `hint`, `context`

### Admin Spec Contract (adapter.ts)
- `AdminPanelSpec<TComponent>` — full typed spec: fields (every FieldType → {Field, Cell}), views (every AdminView), SidebarProvider, AdminSidebar, SidebarInset, AdminPage
- `buildAdminUI(spec)` — identity function that validates spec completeness at compile time
- `AdminInitialData` — `{ document?, globalDocument?, documents?, count?, counts? }` — one field populated per route

### Response Types
- Typed response shapes for all Convex query results — used by data hooks in @vexcms/react

---

## @vexcms/react — Included Features

### Framework Bindings
- `AdminFrameworkBindings` — `{ Link?, Image?, router? }` all optional with fallbacks
- `AdminRouter` — `{ push, replace, back }` — abstracts navigation across React frameworks
- `useAdminPathname()` — React hook using `window.location.pathname + useEffect` — no router dependency. Used internally by AdminSidebar.

### Data Hooks
- `useCollectionDocuments(slug, opts)` — paginated list + count
- `useCollectionDocument(slug, id)` — single document
- `useGlobalDocument(slug)` — global singleton
- `useDashboardCounts()` — count per collection for dashboard
- `useMediaDocuments(slug, opts)` — media collection list

### Admin Shell Components
- `AdminSidebar` — navigation sidebar, uses `useAdminPathname()` for active state
- `SidebarProvider`, `SidebarInset` — shadcn/ui sidebar primitives

### Admin Views
- `DashboardView` — collection cards with counts
- `ListView` — data table with pagination, search, sort, bulk actions
- `EditView` — form with fields, save/publish/delete/duplicate, sidebar fields
- `MediaGridView` — media library grid with upload trigger
- `MediaEditView` — single media document editor
- `GlobalEditView` — global singleton editor

### Form Components
- `FormField` — dispatches to correct field component by type
- `BlockEditor` — block list with drag-drop, block picker, inline edit
- All 19 field components: `TextField`, `SelectField`, `NumberField`, etc.
- Cell components for all 19 field types

### Error Handling
- `ErrorBoundary` — catches render errors, shows fallback UI
- `useSafeMutation` — wraps `useMutation`, parses `ConvexError` → `VexError`, shows toast
- Error toast system — per-error-type display treatment

### Providers
- Re-exports `ConvexProvider` from `convex/react` (not wrapped, passed through directly)
- `ConvexQueryCacheProvider` from `@convex-dev/query-cache`
- TanStack Query + `@convex-dev/react-query` adapter — React is the only first-class framework for 0.1.0

### defineConfig Re-export
- `defineConfig` from `@vexcms/core` re-exported with `TComponent = ComponentType` — plain React apps import from here

---

## @vexcms/next — Included Features

### Admin Shell
- `AdminLayout` — server component — persistent sidebar shell, auth guard, providers, metadata, nav chrome. Wraps `AdminSidebar` from @vexcms/react.
- `VexAdminPage` (internal) — view routing, renders the correct view component with initialData
- `createAdminPage(config)` — factory exported from @vexcms/next — returns async server component that reads params+searchParams, calls `resolveAdminQuery` → `fetchQuery`, renders `VexAdminPage` with `initialData`

### SSR Helpers
- `fetchPage(slug)` — fetchQuery wrapper for collection documents
- `fetchGlobal(slug)` — fetchQuery wrapper for global documents
- `fetchActiveTheme()` — resolves site settings → active theme
- `generatePageMetadata(slug)` — returns Next.js Metadata from `buildSiteMetadata`
- `ThemeStyle` — server component for SSR theme CSS

### Auth Integration
- `fetchAuthQuery()` / `fetchAuthMutation()` — from `@convex-dev/better-auth/nextjs`
- `checkAdminAccess()` guard in AdminLayout

### defineConfig Re-export
- Re-exports `defineConfig` from `@vexcms/react` (same `ComponentType` generic — adds no new type restrictions)
- Single import: users import `defineConfig` from `@vexcms/next` only — no need to import from core or react directly

---

## @vexcms/cli — Included Features

- `vex dev` — starts Convex dev process, watches `vex.config.ts`, auto-regenerates schema + types on change (handles nvim unlink+add events via chokidar)
- `vex generate` — manually trigger schema + type + query file generation
- `vex migrate` — runs auto-migration (3-phase: interim schema → deploy → mutations → final schema)
- Schema diff + migration plan output — shows what changed and what will happen before running
- Config loader — resolves `vex.config.ts` from project root, handles tsconfig paths

---

## @vexcms/better-auth — Included Features

- `betterAuth(options)` — creates AuthAdapter from Better Auth config
- `AuthAdapter` interface — `{ authTables, sessionFromRequest(), getUserFromSession(), roles? }`
- Auth tables injected through schema gen → `vex.schema.ts` includes `users`, `sessions`, `accounts`, `verifications`
- Role sync — if `roles` configured, `users` table gets `role` field
- `@convex-dev/better-auth` used for Convex-side session management

---

## @vexcms/storage-convex — Included Features

- `convexStorage()` — creates StorageAdapter using Convex native `_storage`
- `StorageAdapter` interface: `{ storageType: 'convex'|'external', urlMode: 'static'|'dynamic', additionalFields?, generateUploadUrl(), getSrcUrl(), deleteFile() }`
- `storageType: 'convex'` → VexCMS maps to `v.id('_storage')` internally
- `urlMode: 'dynamic'` → URL resolved fresh via `getSrcUrl` action on each render (Convex native)
- All three adapter methods are Convex actions (not mutations)

---

## @vexcms/richtext-plate — Included Features

- `richtext()` field helper — registered as a FieldType in core
- Plate.js editor integration for `@vexcms/react`
- Pluggable architecture — `@vexcms/richtext-lexical` possible post-0.1.0 without API changes

---

## create-vexcms — Included Features

- `npx create-vexcms@latest my-app` — scaffolds new project
- Base template — Next.js + Convex + VexCMS pre-configured
- Marketing site template — dogfoods VexCMS blocks system
- Auto-generates `BETTER_AUTH_SECRET` during scaffold
- Tier 0 config by default — admin panel works without auth for development

---

## Deferred Post-0.1.0 Features

These are explicitly excluded from 0.1.0 and must NOT be designed into the 0.1.0 API in a way that would require breaking changes when they land.

### Versions / Drafts
- `versions: true` on `defineCollection` — draft/publish workflow, version history, autosave
- `vexQuery` with draft-awareness — already partially designed, full implementation deferred
- Preview snapshots — framework for this exists in core, full feature deferred

### RBAC — Role-Based Access Control
- `defineAccess()` will ship in 0.1.0 as a config builder, but the full RBAC enforcement in Convex mutations is deferred
- Field-level permissions (read/write per role per field) — deferred
- For 0.1.0: auth is enforced (sign in required), but role-based permission matrix is not enforced server-side

### Lifecycle Hooks
- `VexHooks` — `beforeCreate`, `afterCreate`, etc. — interface defined in core, but Convex-side execution is deferred
- For 0.1.0: hooks config accepted but not executed

### Plugin System — Admin UI Slots
- `sidebarItems`, `editToolbarActions`, `editTabs`, `dashboardWidgets` — interface defined, runtime support deferred
- Config-transform plugins ship in 0.1.0. UI slot injection deferred.

### Migration Enhancements
- Rename support (`{ type: "rename", from, to, collection }`) — deferred
- Type change transforms — deferred
- For 0.1.0: add/remove fields only (current 3-phase system)

### @vexcms/tanstack
- TanStack Query + Convex adapter exists in @vexcms/react (React is first-class)
- TanStack Start routing integration is deferred

### @vexcms/svelte, @vexcms/solid
- Own Svelte/Solid UI components using same core headless logic
- Deferred until React integration is stable

### defineBlock — Full Implementation
- `defineBlock()` config builder ships in 0.1.0
- Block picker UI, block editor with drag-drop — included in 0.1.0 (`BlockEditor` in @vexcms/react)
- Site builder (drag-and-drop page layout) — deferred
- Block style presets + `blockStylesToTailwind` — included in 0.1.0

### Onboarding Tour
- Interactive admin panel onboarding for new users — deferred

### Additional Auth + Storage Adapters
- Clerk, Auth.js, S3, R2 — all deferred

---

## Locked-In Architectural Decisions

These are final — do not redesign these during implementation.

### Framework Adapter Pattern
- `@vexcms/core` defines `AdminPanelSpec<TComponent>` — full typed spec for all field components + views
- `buildAdminUI(spec)` is an identity function that validates spec completeness via TypeScript mapped types
- Framework packages call `buildAdminUI()` at build time — missing anything = compile error
- This is the internal framework author contract. End developers never touch it.

### TComponent Generic Chain
- Core uses `TComponent = unknown` throughout (`FieldAdminConfig`, `defineCollection`, `defineConfig`)
- Framework packages re-export `defineConfig` with `TComponent` narrowed to their component type
- `@vexcms/react` → `ComponentType`, `@vexcms/next` re-exports from react (same type)
- End developers import `defineConfig` from their framework package only

### Single Import Source for End Developers
- Everything needed for Next.js apps: import from `@vexcms/next`
- `@vexcms/next` re-exports `defineConfig` (from react), `AdminLayout`, `AdminPage`, `createAdminPage`, SSR helpers
- No need to import from `@vexcms/core` or `@vexcms/react` directly for standard usage
- Exception: collection/field helpers (`defineCollection`, `text()`, etc.) still exported from `@vexcms/core` but also re-exported via `@vexcms/next` for convenience

### StorageAdapter Interface
```typescript
interface StorageAdapter {
  storageType: 'convex' | 'external'
  urlMode: 'static' | 'dynamic'
  additionalFields?: Record<string, FieldDef>
  generateUploadUrl(): Promise<{ uploadUrl: string; storageId: string }>  // Convex action
  getSrcUrl(storageId: string): Promise<string>                           // Convex action
  deleteFile(storageId: string): Promise<void>                            // Convex action
}
```
- `storageType` replaces `storageIdValidator()` — VexCMS maps internally to `v.id('_storage')` or `v.string()`
- `urlMode: 'static'` → URL stored in document on create. `urlMode: 'dynamic'` → resolved via `getSrcUrl` on each render.
- All runtime methods are Convex actions (not mutations)

### AdminFrameworkBindings (in @vexcms/react)
```typescript
interface AdminFrameworkBindings {
  Link?: ComponentType<{ href: string; children: ReactNode; className?: string }>
  Image?: ComponentType<{ src: string; alt: string; width?: number; height?: number }>
  router?: AdminRouter
}
interface AdminRouter { push(path: string): void; replace(path: string): void; back(): void }
```
- All bindings optional — sensible fallbacks used when not provided
- `useAdminPathname()` — React-only hook in @vexcms/react using `window.location.pathname + useEffect`. Used by AdminSidebar internally. Does NOT use router.

### AdminInitialData Shape
```typescript
interface AdminInitialData {
  document?: Doc<any> | null
  globalDocument?: Doc<any> | null
  documents?: Doc<any>[]
  count?: number
  counts?: Record<string, number>
}
```
- One field populated per route (edit → `document`, list → `documents` + `count`, dashboard → `counts`, global → `globalDocument`)
- All fields optional — views work client-only if initialData is undefined or partially filled

### resolveAdminQuery (in @vexcms/core)
- Pure function — given current route, returns `{ query: FunctionReference, args: object }` or null
- Each framework calls its own fetch primitive with the returned ref
- `createAdminPage()` in @vexcms/next uses this to abstract prefetch from developers

### Tiered Config (auth is optional)
- Tier 0: no auth — admin panel works in dev mode, open access
- Tier 1: auth configured — sign in required
- Tier 2: full production — auth + access + media + plugins
- `@vexcms/core` needs a NoAuthAdapter default or auth field must be truly optional
- Admin layout skips auth checks when no auth is configured

### Convex is the Only Backend
- Making Convex pluggable is NOT planned
- Convex runtime lives in `@vexcms/core`, not a separate package
- This simplifies the dependency graph and is the right call for 0.1.0

### Functions Over Classes
- No class-based CMS instance
- Pure functions + config parameter throughout

---

## Graduation Criteria for Dropping -alpha Tag

The alpha tag drops when:

1. All 0.1.0 packages are published and functional
2. The marketing site runs on the rebuild (dogfood)
3. The demo app (create-vexcms base template) works end-to-end: scaffold → dev → deploy → create content
4. All 560+ ported tests pass
5. All field types have React components + cell components
6. All admin views (dashboard, list, edit, media-list, media-edit, global-edit) are implemented
7. CLI auto-migration works for add/remove field scenarios
8. Better Auth integration works with user sign-in + role assignment
9. Convex storage integration works for media upload, display, delete
10. `buildAdminUI()` adapter pattern validates completeness at compile time
11. JSDoc on all public exports

The marketing site and demo app are the acceptance tests. If they run correctly on the rebuild, the core feature set is complete enough for 0.1.0.
