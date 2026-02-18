# Product Roadmap

## Phase 1: Core Foundation (MVP)

The minimum needed to use this CMS in a real project.

### 1.1 Schema & Field System

> **Implementation Spec**: [schema-field-system-spec.md](./schema-field-system-spec.md)

- [ ] Collection definition API (TypeScript config)
- [ ] Field types: `text`, `textarea`, `number`, `checkbox`, `select`, `date`, `email`
- [ ] Field validation (required, min/max, custom validators via Zod)
- [ ] Field-level `defaultValue` support
- [ ] Globals (singleton documents)

### 1.2 Relationship & Complex Fields
- [ ] `relationship` field (hasOne, hasMany references)
- [ ] `array` field (repeatable field groups)
- [ ] `blocks` field (flexible content blocks with different schemas)
- [ ] `group` field (nested field grouping)

### 1.3 Hooks System
- [ ] Collection hooks: `beforeCreate`, `afterCreate`, `beforeUpdate`, `afterUpdate`, `beforeDelete`, `afterDelete`
- [ ] Field hooks: `beforeChange`, `afterRead`
- [ ] Global hooks (same as collections)

### 1.4 Access Control
- [ ] Document-level access: `create`, `read`, `update`, `delete` functions
- [ ] Field-level access: `read`, `update` functions per field
- [ ] Access functions receive `{ user, doc, data }` context
- [ ] Default: authenticated users only

### 1.5 Convex Integration

> **Implementation Spec**: [convex-integration-spec.md](./convex-integration-spec.md)

- [ ] Auto-generate Convex schema from collection definitions
- [ ] Index generation from collection config (`indexes`, `searchIndexes`)
- [ ] Generic admin query handlers (`adminList`, `adminSearch`, `adminGetById`)
- [ ] Generic admin mutation handlers (`adminCreate`, `adminUpdate`, `adminDelete`)
- [ ] RBAC access control system with typed permissions
- [ ] Hook execution on admin mutations (before/after create, update, delete)
- [ ] Real-time subscriptions via standard Convex reactivity

### 1.6 Versioning & Drafts

> **Implementation Spec**: [versioning-drafts-spec.md](./versioning-drafts-spec.md)

- [ ] Version system fields on documents (`_status`, `_version`, `_draftSnapshot`, etc.)
- [ ] Single `vex_versions` table with collection index for all version history
- [ ] Draft/Published workflow (main fields = published, `_draftSnapshot` = pending draft)
- [ ] Admin mutations: `saveDraft`, `publish`, `unpublish`, `revertToPublished`
- [ ] Version restore from history (`restoreVersion`)
- [ ] Autosave support (coalesces rapid saves into single version record)
- [ ] Version cleanup with configurable `maxPerDoc`
- [ ] Globals versioning with same pattern

### 1.7 File Uploads

> **Implementation Spec**: [file-uploads-spec.md](./file-uploads-spec.md)

- [ ] Upload-enabled collections (`upload.enabled: true` in collection config)
- [ ] `upload` field type with `relationTo` for explicit collection reference
- [ ] System fields for upload collections (`_storageId`, `_filename`, `_mimeType`, `_size`, `_width`, `_height`)
- [ ] Client-side upload utility (framework-agnostic, direct to Convex)
- [ ] Media library picker modal (browse existing, upload new)
- [ ] Per-field MIME type and size restrictions
- [ ] Storage adapter interface (Convex default, S3/Vercel Blob ready for Phase 4)

### 1.8 Custom Admin Components

> **Implementation Spec**: [custom-admin-components-spec.md](./custom-admin-components-spec.md)

- [ ] `useField` hook for reading/writing field values (Legend State + TanStack Form)
- [ ] `useForm` hook for form state, submission, and validation
- [ ] `useFormFields` hook for selecting specific fields (performance optimization)
- [ ] State flag hooks (`useFormSubmitted`, `useFormModified`, `useFormProcessing`, etc.)
- [ ] Field component override via `admin.components.Field` (import path strings)
- [ ] Build-time component resolution and import map generation
- [ ] Exportable input primitives (`TextInput`, `SelectInput`, etc.) for composition
- [ ] `ui()` field type for non-persisted display/action fields

### 1.9 Live Preview

> **Implementation Spec**: [live-preview-spec.md](./live-preview-spec.md)

- [ ] Preview iframe in admin panel with breakpoint controls
- [ ] postMessage protocol (`vex-live-preview:init`, `update`, `saved`, `ready`)
- [ ] Client-side mode: real-time form state updates as user types
- [ ] Server-side mode: route refresh after save/autosave
- [ ] `@vex/live-preview` package (framework-agnostic subscribe/message utilities)
- [ ] `@vex/live-preview-react` package (`useLivePreview` hook, `RefreshOnSave` component)
- [ ] Preview URL configuration per collection (string or function)
- [ ] Configurable breakpoints (default: mobile, tablet, laptop, desktop)

### 1.10 Admin Panel (Next.js)
- [ ] Authentication flow (Better Auth integration)
- [ ] Collection list view with TanStack Table
- [ ] Document create/edit forms (auto-generated from schema)
- [ ] Field components for all MVP field types
- [ ] Array field UI (add/remove/reorder items)
- [ ] Blocks field UI (select block type, render appropriate fields)
- [ ] Relationship field UI (search/select related documents)
- [ ] Upload field UI with media library picker
- [ ] Real-time updates (Convex subscriptions)
- [ ] Draft/publish workflow UI
- [ ] Live preview panel
- [ ] Responsive layout

### 1.11 Testing Infrastructure
- [ ] Vitest setup with convex-test
- [ ] Unit tests for schema parsing, validation, hooks
- [ ] Integration tests for Convex mutations/queries
- [ ] Playwright setup for admin panel
- [ ] E2E tests for critical flows (login, create doc, edit doc, delete doc)
- [ ] Accessibility tests with axe-core

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
- [ ] `@vex/admin-tanstack` package
- [ ] Same features as Next.js admin
- [ ] TanStack Router integration

### 4.2 Additional Storage Adapters
- [ ] S3 adapter
- [ ] S3-compatible (Cloudflare R2, MinIO)
- [ ] Vercel Blob adapter

### 4.3 Documentation & Community
- [ ] Documentation site
- [ ] Migration guide from Payload CMS
- [ ] Example projects
- [ ] Contributing guidelines

---

## Excluded (Not Planned)

These Payload features are intentionally excluded:

- **GraphQL API**: Convex queries/mutations are sufficient; GraphQL adds complexity without benefit
- **Database adapters**: Convex-only by design; this is a Convex-native CMS
- **Email/password auth**: Using Better Auth which handles this and more
- **Built-in deployment**: Users deploy their own Next.js + Convex apps

---

## Priority Order for Phase 1

1. **Schema & Fields** (1.1) - Foundation everything else builds on
2. **Relationship & Complex Fields** (1.2) - Needed for real-world schemas
3. **Convex Integration** (1.5) - Need working CRUD to test anything
4. **Testing Infrastructure** (1.10) - Set up early, test as you build
5. **Hooks System** (1.3) - Core extensibility mechanism
6. **Access Control** (1.4) - Security before admin panel
7. **Versioning & Drafts** (1.6) - Core content workflow
8. **File Uploads** (1.7) - Media management
9. **Live Preview** (1.8) - Real-time editing experience
10. **Admin Panel** (1.9) - Last because it consumes all the above
