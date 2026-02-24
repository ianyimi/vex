# Product Roadmap

## Phase 0: Project Setup

Infrastructure and scaffolding before feature development.

### Build Order

```
Step 0.1: Monorepo Setup          → pnpm, Turborepo, package scaffolding
Step 0.2: Testing Infrastructure  → Vitest, Playwright, convex-test
Step 0.3: CI/Publishing           → semantic-release, GitHub Actions
Step 0.4: Example Project         → apps/blog with Next.js + Convex
Step 0.5: Admin Layout + Auth      → Next.js admin, Better Auth adapter
```

---

### 0.1 Monorepo Setup

> **Implementation Spec**: [00-monorepo-setup-spec.md](./00-monorepo-setup-spec.md)

- [ ] Initialize pnpm workspace
- [ ] Configure Turborepo (turbo.json)
- [ ] Create folder structure (apps/, packages/)
- [ ] Set up shared TypeScript config (@vexcms/tsconfig)
- [ ] Set up shared ESLint config (@vexcms/eslint-config)
- [ ] Initialize all package.json files with @vexcms/* namespace
- [ ] Configure tsup for package builds
- [ ] Verify `pnpm build` and `pnpm dev` work

---

### 0.2 Testing Infrastructure

> **Implementation Spec**: [01-testing-infrastructure-spec.md](./01-testing-infrastructure-spec.md)
> **Testing Strategy**: [11-testing-strategy-spec.md](./11-testing-strategy-spec.md)

- [ ] Install and configure Vitest workspace
- [ ] Set up convex-test for Convex function testing
- [ ] Configure Vitest for each package
- [ ] Install Playwright
- [ ] Create apps/admin-test harness for component tests
- [ ] Configure Playwright for apps/blog E2E tests
- [ ] Create test fixtures for authentication
- [ ] Add axe-core for accessibility testing

---

### 0.3 CI/Publishing

> **Implementation Spec**: [02-ci-publishing-spec.md](./02-ci-publishing-spec.md)

- [ ] Install multi-semantic-release
- [ ] Configure conventional commits
- [ ] Create .github/workflows/ci.yml (lint, test, build)
- [ ] Create .github/workflows/release.yml (publish to npm)
- [ ] Set up NPM_TOKEN secret
- [ ] Configure branch protection rules
- [ ] Test release with dry-run

---

### 0.4 Example Project

- [ ] Create apps/blog with Next.js App Router
- [ ] Set up Convex in apps/blog
- [ ] Add vex.config.ts with full Phase 1 collections
- [ ] Configure workspace dependencies to local packages
- [ ] Verify app runs with `pnpm --filter blog dev`

---

### 0.5 Admin Layout + Auth

> **Implementation Specs**:
> - [03-admin-shell-spec.md](./03-admin-shell-spec.md)
> - [04-auth-adapter-spec.md](./04-auth-adapter-spec.md)

- [ ] Define AuthAdapter interface in @vexcms/core
- [ ] Implement createBetterAuthAdapter in @vexcms/admin
- [ ] Create admin layout (Layout, Sidebar, Header)
- [ ] Create auth pages (sign-in, sign-up)
- [ ] Create auth middleware
- [ ] Set up createVexAdmin function
- [ ] Test auth flow end-to-end

---

## Phase 1: Core Foundation (MVP)

The minimum needed to use this CMS in a real project.

### Build Order

```
Step 1.0: Config Structure        → defineConfig, defineCollection, defineGlobal, defineBlock
Step 1.1: Basic Fields            → text, number, checkbox, select, date, email, textarea
Step 1.2: Complex Fields          → relationship, array, group, blocks
Step 1.3: Convex Integration      → Schema generation, admin handlers, indexes
Step 1.4: Hooks System            → beforeCreate, afterUpdate, etc.
Step 1.5: Access Control          → RBAC, permissions matrix, field-level access
Step 1.6: Versioning & Drafts     → Draft/publish workflow, version history
Step 1.7: File Uploads            → Upload collections, media library, storage adapters
Step 1.8: Custom Admin Components → useField, useForm, UI fields, component overrides
Step 1.9: Live Preview            → Iframe preview, postMessage, refresh on save
Step 1.10: Admin Panel (Next.js)  → Full admin UI consuming all above features
```

---

### 1.0 Config Structure

> **Reference**: [vex.config.example.ts](./vex.config.example.ts) - Complete Phase 1 target config

- [ ] `defineConfig()` - Main configuration wrapper
- [ ] `defineCollection()` - Collection definition with typed fields
- [ ] `defineGlobal()` - Singleton global definition
- [ ] `defineBlock()` - Block definition for blocks field
- [ ] `VexConfig` type with all Phase 1 options
- [ ] Type exports for document inference (`collection._docType`)

This step establishes the config structure that all other steps fill in.

---

### 1.1 Basic Field Types

> **Implementation Spec**: [05-schema-field-system-spec.md](./05-schema-field-system-spec.md)

- [ ] `text()` - Single-line text input, wraps `v.string()`
- [ ] `textarea()` - Multi-line text input
- [ ] `number()` - Numeric input, wraps `v.number()`
- [ ] `checkbox()` - Boolean toggle, wraps `v.boolean()`
- [ ] `select()` - Dropdown with typed options, wraps `v.union(v.literal(...))`
- [ ] `date()` - Date/time picker, wraps `v.number()` (timestamp)
- [ ] `email()` - Email input with validation
- [ ] Field metadata: `label`, `description`, `required`, `defaultValue`
- [ ] Admin config: `hidden`, `readOnly`, `position`, `width`, `condition`
- [ ] `VexField` branded type with `_validator` and `_meta`

---

### 1.2 Complex Field Types

> **Implementation Spec**: [05-schema-field-system-spec.md](./05-schema-field-system-spec.md)

- [ ] `relationship()` - Reference to other documents, wraps `v.id(collectionName)`
  - `to`: Target collection name
  - `hasMany`: Single vs array of references
- [ ] `array()` - Repeatable field groups, wraps `v.array(v.object(...))`
  - `fields`: Nested field definitions
  - `minRows`, `maxRows`: Row constraints
- [ ] `group()` - Non-repeating nested fields, wraps `v.object(...)`
  - `fields`: Nested field definitions
- [ ] `blocks()` - Flexible content, wraps `v.array(v.union(...))`
  - `blocks`: Array of block definitions
  - Each block adds `blockType` discriminator
- [ ] `InferFieldType<F>` - Extract TypeScript type from field
- [ ] `InferBlocksType<B>` - Extract union type from blocks array

---

### 1.3 Convex Integration

> **Implementation Spec**: [06-convex-integration-spec.md](./06-convex-integration-spec.md)

**Schema Generation (Two-File Approach):**
- [ ] `generateVexSchema(config)` - Generate `vex.schema.ts` content
  - Extract validators from all collections
  - Handle nested structures recursively
  - Add system tables (`vex_versions`, `vex_globals`)
- [ ] `updateUserSchema(config, existingContent)` - Update `schema.ts` with AST parsing
  - Detect missing collections
  - Add imports and table definitions
  - Preserve user customizations
- [ ] `detectSchemaConflicts(config, existingContent)` - Validate schema compatibility
- [ ] Index generation from `collection.indexes` config
- [ ] Search index generation from `collection.searchIndexes` config

**CLI Commands (`@vexcms/cli`):**
- [ ] `vex sync` - Regenerate vex.schema.ts, update schema.ts
- [ ] `vex sync --watch` - Watch mode for development
- [ ] `vex sync --dry-run` - Preview changes without writing
- [ ] `vex sync --force` - Force update even if autoUpdateSchema is false
- [ ] `convex.autoUpdateSchema` config option (default: true)

**Admin Handlers:**
- [ ] `createVexHandlers(config)` - Generate admin query/mutation handlers
- [ ] Admin queries: `adminList`, `adminSearch`, `adminGetById`
- [ ] Admin mutations: `adminCreate`, `adminUpdate`, `adminDelete`
- [ ] Pagination, sorting, filtering in list query
- [ ] Real-time subscriptions via standard Convex reactivity

---

### 1.4 Hooks System

> **Implementation Spec**: [06-convex-integration-spec.md](./06-convex-integration-spec.md)

- [ ] Collection hooks in admin mutations:
  - `beforeCreate` - Modify data before insert
  - `afterCreate` - Run after insert (notifications, etc.)
  - `beforeUpdate` - Modify data before patch
  - `afterUpdate` - Run after patch
  - `beforeDelete` - Can abort deletion
  - `afterDelete` - Cleanup, cascade deletes
- [ ] Hook context: `{ data, originalDoc, user, operation, db }`
- [ ] Hook execution order and error handling
- [ ] Field-level hooks: `beforeChange`, `afterRead`
- [ ] Global hooks (same pattern as collections)

---

### 1.5 Access Control

> **Implementation Spec**: [06-convex-integration-spec.md](./06-convex-integration-spec.md)

- [ ] Document-level access functions: `create`, `read`, `update`, `delete`
- [ ] Access function signature: `({ user, doc, data }) => boolean`
- [ ] Field-level access: `read`, `update` per field
- [ ] `definePermissions<TRoles, TCollections>()` - Typed RBAC matrix
- [ ] `checkAccess(config, ctx, collection, action, doc)` - Permission check
- [ ] `accessControl` config in `defineConfig`:
  - `roles`: Role name array
  - `getUserRole`: Extract role from user document
  - `permissions`: RBAC matrix
  - `defaultPermission`: Fallback behavior
- [ ] Row-level access in list queries (post-fetch filtering)

---

### 1.6 Versioning & Drafts

> **Implementation Spec**: [07-versioning-drafts-spec.md](./07-versioning-drafts-spec.md)

- [ ] Version system fields on versioned collections:
  - `_status`: `"draft"` | `"published"`
  - `_version`: Incrementing version number
  - `_draftSnapshot`: Pending draft content (null if none)
  - `_hasDraft`: Boolean for efficient queries
  - `_publishedAt`: Last publish timestamp
- [ ] `vex_versions` table with indexes by collection/document
- [ ] Admin mutations:
  - `adminSaveDraft` - Save draft without publishing
  - `adminAutosave` - Coalesced autosave (updates existing autosave record)
  - `adminPublish` - Publish current draft
  - `adminUnpublish` - Revert to draft status
  - `adminRevertToPublished` - Discard pending draft
  - `adminRestoreVersion` - Restore from history
- [ ] Version queries: `adminListVersions`, `adminGetVersion`
- [ ] Version cleanup with `maxPerDoc` config
- [ ] Globals versioning with same pattern

---

### 1.7 File Uploads

> **Implementation Spec**: [08-file-uploads-spec.md](./08-file-uploads-spec.md)

- [ ] Upload-enabled collections: `upload.enabled: true`
  - `accept`: Allowed MIME types
  - `maxSize`: File size limit
  - `storage`: Storage adapter
- [ ] System fields for upload collections:
  - `_storageId`, `_filename`, `_mimeType`, `_size`, `_width`, `_height`
- [ ] `upload()` field type with `relationTo` for explicit collection reference
- [ ] Admin upload mutations:
  - `adminGenerateUploadUrl` - Get signed upload URL
  - `adminCreateMedia` - Create document after upload
  - `adminDeleteMedia` - Delete file and document
- [ ] Admin upload queries: `adminListMedia`, `adminGetMediaUrl`
- [ ] Client-side upload utility (framework-agnostic)
- [ ] Per-field MIME type and size restrictions
- [ ] Storage adapter interface (Convex default)

---

### 1.8 Custom Admin Components

> **Implementation Spec**: [09-custom-admin-components-spec.md](./09-custom-admin-components-spec.md)

- [ ] Form state with Legend State + TanStack Form
- [ ] `useField({ path })` hook - Read/write field values
- [ ] `useForm()` hook - Form state, submission, validation
- [ ] `useFormFields(selector)` hook - Select specific fields (perf)
- [ ] State flag hooks: `useFormSubmitted`, `useFormModified`, `useFormProcessing`
- [ ] `FormProvider` component with context
- [ ] `FieldPathContext` for nested field components
- [ ] Field component override via `admin.components.Field` (import path strings)
- [ ] Build-time component resolution and import map generation
- [ ] Exportable input primitives: `TextInput`, `SelectInput`, `NumberInput`, etc.
- [ ] `ui()` field type - Non-persisted display/action fields

---

### 1.9 Live Preview

> **Implementation Spec**: [10-live-preview-spec.md](./10-live-preview-spec.md)

- [ ] `livePreview` config per collection:
  - `url`: String or function returning preview URL
  - `breakpoints`: Viewport size presets
  - `reloadOnFields`: Fields that trigger URL recomputation
- [ ] `LivePreviewPanel` component - Toggleable side panel with iframe
- [ ] `BreakpointSelector` component - Viewport size controls
- [ ] postMessage protocol:
  - `vex-live-preview:init` - Admin sends document context
  - `vex-live-preview:refresh` - Admin signals save complete
  - `vex-live-preview:ready` - Frontend acknowledges
- [ ] `@vexcms/live-preview-react` package:
  - `useRefreshOnSave()` hook
  - `RefreshOnSave` component
- [ ] Origin validation from `admin.allowedOrigins`
- [ ] Draft content queries with `_vexIncludeDraft` flag

---

### 1.10 Admin Panel (Next.js)

- [ ] Better Auth integration for authentication
- [ ] Admin layout with sidebar navigation
- [ ] Collection list view:
  - TanStack Table with pagination, sorting, filtering
  - Bulk actions (delete, publish)
  - Search
- [ ] Document create/edit forms:
  - Auto-generated from collection schema
  - Field components for all field types
  - Sidebar vs main panel positioning
  - Conditional field visibility
- [ ] Field components:
  - `TextField`, `NumberField`, `CheckboxField`, `SelectField`, `DateField`
  - `RelationshipField` with search picker
  - `ArrayField` with add/remove/reorder
  - `GroupField` with collapsible sections
  - `BlocksField` with block type selector
  - `UploadField` with media library picker
  - `UIField` for non-persisted fields
- [ ] Media library:
  - Grid view with thumbnails
  - Upload modal with drag-drop
  - File type filtering
- [ ] Draft/publish workflow:
  - Status indicator
  - Save Draft / Publish buttons
  - Version history panel
  - Restore version
- [ ] Live preview panel:
  - Toggle visibility
  - Breakpoint selector
  - Refresh on save
- [ ] Globals management
- [ ] Responsive layout

---

## Package Structure

```
vex/
├── apps/
│   ├── blog/                    # Full example project
│   └── admin-test/              # Isolated component test harness
│
├── packages/
│   ├── core/                    # @vexcms/core (types, schema, config - no React)
│   ├── ui/                      # @vexcms/ui (shared React components)
│   ├── convex/                  # @vexcms/convex
│   ├── client/                  # @vexcms/client
│   ├── admin-next/              # @vexcms/admin-next (Phase 1)
│   ├── admin-tanstack-start/    # @vexcms/admin-tanstack-start (Phase 4)
│   ├── live-preview-react/      # @vexcms/live-preview-react
│   ├── tsconfig/                # @vexcms/tsconfig (internal)
│   └── eslint-config/           # @vexcms/eslint-config (internal)
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Package Responsibilities:**
- `@vexcms/core` — Types, schema, config (no React dependency)
- `@vexcms/ui` — Shared React components: primitives (shadcn-based), form fields (TanStack Form), hooks (Legend State), layout (Layout, Header)
- `@vexcms/admin-next` — Next.js routing, server components, data fetching
- `@vexcms/admin-tanstack-start` — TanStack Start routing, createServerFn, data fetching

---

## Phase 2: Enhanced Editing

Features that improve the content editing experience.

### 2.1 Rich Text Editor
- [ ] Evaluate Lexical vs TipTap
- [ ] `richText` field type
- [ ] Basic formatting (bold, italic, headings, lists, links)
- [ ] Embed blocks (images, videos)
- [ ] Serialization to HTML/JSON

---

## Phase 3: Advanced Features

Features for larger teams and complex use cases.

### 3.1 Localization (i18n)
- [ ] Locale configuration in CMS config
- [ ] `localized: true` option per field
- [ ] Locale switcher in admin panel
- [ ] Fallback locale support
- [ ] Per-document locale filtering in queries

### 3.2 Form Builder
- [ ] Dynamic form collection
- [ ] Form field types: text, email, textarea, select, checkbox
- [ ] Form submission storage
- [ ] Email notifications on submit
- [ ] Embed forms in frontend

### 3.3 Plugin System
- [ ] Plugin interface (config -> modified config)
- [ ] Hook into admin panel components
- [ ] Register custom field types
- [ ] Example plugins: SEO, sitemap, redirects

### 3.4 REST API (Optional)
- [ ] Express/Hono adapter for REST endpoints
- [ ] Hooks still fire on REST operations
- [ ] Useful for external service integrations

---

## Phase 4: Ecosystem

### 4.1 TanStack Start Support
- [ ] `@vexcms/admin-tanstack-start` package (separate from Next.js admin)
- [ ] `@vexcms/live-preview` (framework-agnostic)
- [ ] Same features as Next.js admin, using idiomatic TanStack patterns
- [ ] TanStack Router integration
- [ ] `createServerFn` for data fetching and mutations

### 4.2 Additional Storage Adapters
- [ ] `@vexcms/storage-s3`
- [ ] `@vexcms/storage-r2` (Cloudflare R2)
- [ ] `@vexcms/storage-vercel-blob`

### 4.3 Additional Auth Adapters
- [ ] `@vexcms/auth-clerk`
- [ ] `@vexcms/auth-authjs`
- [ ] Convex database adapter for Better Auth

### 4.4 Documentation & Community
- [ ] Documentation site
- [ ] Migration guide from Payload CMS
- [ ] Example projects
- [ ] Contributing guidelines

---

## Excluded (Not Planned)

These Payload features are intentionally excluded:

- **GraphQL API**: Convex queries/mutations are sufficient; GraphQL adds complexity without benefit
- **Database adapters**: Convex-only by design; this is a Convex-native CMS
- **Built-in deployment**: Users deploy their own Next.js + Convex apps

---

## Spec Dependencies

```
Phase 0 (Setup)
├── 00-monorepo-setup-spec.md (0.1)
│       │
│       ▼
├── 01-testing-infrastructure-spec.md (0.2)
│       │
│       ▼
├── 02-ci-publishing-spec.md (0.3)
│       │
│       ▼
└── 03-admin-shell-spec.md + 04-auth-adapter-spec.md (0.5)

Phase 1 (Features)
├── 05-schema-field-system-spec.md (1.0, 1.1, 1.2)
│       │
│       ▼
├── 06-convex-integration-spec.md (1.3, 1.4, 1.5)
│       │
│   ┌───┴───┐
│   ▼       ▼
├── 07-versioning-drafts-spec.md (1.6)
│   │
│   │   08-file-uploads-spec.md (1.7)
│   │       │
│   └───┬───┘
│       ▼
├── 09-custom-admin-components-spec.md (1.8)
│       │
│       ▼
├── 10-live-preview-spec.md (1.9)
│       │
│       ▼
└── Admin Panel (1.10)
```

---

## All Specs Reference

| Spec | Phase | Steps |
|------|-------|-------|
| [00-monorepo-setup-spec.md](./00-monorepo-setup-spec.md) | 0 | 0.1 |
| [01-testing-infrastructure-spec.md](./01-testing-infrastructure-spec.md) | 0 | 0.2 |
| [02-ci-publishing-spec.md](./02-ci-publishing-spec.md) | 0 | 0.3 |
| [03-admin-shell-spec.md](./03-admin-shell-spec.md) | 0 | 0.5 |
| [04-auth-adapter-spec.md](./04-auth-adapter-spec.md) | 0 | 0.5 |
| [05-schema-field-system-spec.md](./05-schema-field-system-spec.md) | 1 | 1.0, 1.1, 1.2 |
| [06-convex-integration-spec.md](./06-convex-integration-spec.md) | 1 | 1.3, 1.4, 1.5 |
| [07-versioning-drafts-spec.md](./07-versioning-drafts-spec.md) | 1 | 1.6 |
| [08-file-uploads-spec.md](./08-file-uploads-spec.md) | 1 | 1.7 |
| [09-custom-admin-components-spec.md](./09-custom-admin-components-spec.md) | 1 | 1.8 |
| [10-live-preview-spec.md](./10-live-preview-spec.md) | 1 | 1.9 |
| [vex.config.example.ts](./vex.config.example.ts) | 1 | Reference |
