# VexCMS v0.1.0 — Implementation Plan
> **Target:** May 29, 2026 · 4 weeks from May 1
> **Branch:** `rebuild` — this is the ship branch. Do not port from `master`; re-implement against rebuild architecture.
> **Design system:** Stark × Ember (warm graphite + ember orange, Geist, sharp 2/4px radii). Reference: `/Users/zaye/Downloads/vexcms-design.html`, `admin.css`, `globals.css`.
> **Process:** For each item, run `/dev-spec` first, implement, then `/sync-spec`. Don't skip the spec step.

---

## Current Rebuild State (May 1)

**Done in rebuild:**
- `@vexcms/core` — 6 field types (text, number, checkbox, select, date, url, relationship), schema gen, type gen, defineCollection, defineConfig
- `@vexcms/react` — AdminLayout, AdminSidebar, field components for 6 types, CollectionListView, CollectionEditView, DashboardView, CreateDocumentModal, form layer (AppForm, FieldController)
- `@vexcms/next` — NextAdminLayout, NextAdminPage shell
- `@vexcms/richtext-plate` — scaffolded (editor + render dirs exist, Plate wiring partial)
- `@vexcms/file-storage-convex` — FileStorageAdapter interface, ConvexFileStorage stub (no HTTP actions)
- `@vexcms/better-auth` — stub only
- `@vexcms/cli`, `create-vexcms` — exist, completeness unknown

**Still to build (every item maps to a launch milestone):**
All M1–M8 items below.

---

## Design Contract

All admin UI work must match the designs in `vexcms-design.html`. Key constraints:

| Concern | Spec |
|---------|------|
| Palette | Stark × Ember — `globals.css` CSS variables are the source of truth. `admin.css` has the design token names (`--page`, `--surface`, `--fg`, `--accent`, etc.) |
| Font | Geist Sans + Geist Mono |
| Radii | 2px (sm), 4px (default) — sharp, not rounded |
| Accent | Ember orange (`#E8622A` light / `#F07040` dark) — reserved for primary action, active selection, live pip only |
| Edit view | Centered form at 720px max-width · right meta rail for two-column variant |
| Sidebar | Icon + label at ≥1280px · icon rail only at ≤1024px · `--side` background |
| Table | Dense, quiet. Selectable + filterable + sortable |
| Shadows | No shadows in dark mode |
| Create flow | ⌘K modal with required fields only; full editor opens after save |
| Relationship UI | Popover (default single/short), side panel (long hasMany), inline drawer (polymorphic) |
| Responsive | Tablet 1024px = icon rail · Mobile 390px = card list, stacked edit form |
| Dark mode | `.dark` class on root, graphite surfaces, accent stays warm |

---

## Week 1 — May 1–7: Admin UI Redesign

**Goal:** The admin panel looks like the designs. This is the foundation everything else is built on top of — every feature added in weeks 2–4 (media library, draft toolbar, blocks editor) renders inside this shell. Do not start building features until the shell matches the design.

> **Why first:** The current implementation uses the default shadcn palette (white surfaces, blue ring, `0.5rem` radius, no design tokens applied), a plain `p-6` main wrapper with no topbar, and unstyled generic components. The visual gap to the designs is total. Getting this right first means every spec written after this week can reference the correct components as a given.

### ~~1a — Design tokens (`apps/www` + `@vexcms/next`)~~ ✅ 2026-05-01

- Replace `apps/www/src/app/globals.css` with the provided Stark × Ember `globals.css`
  - Ember accent (`oklch(68.5% 0.165 45)` light / `oklch(72% 0.175 50)` dark), neutral graphite surfaces, `--radius: 4px`
  - Dark mode `.dark` class variables (graphite `#0A0A0A` page, `#141414` surfaces)
  - Sidebar token block (`--sidebar`, `--sidebar-foreground`, etc.)
- Add a stylesheet to `@vexcms/next` that exports the admin CSS variables so `@import "@vexcms/next/styles"` works (currently no CSS in that package)
- Geist font loaded in `apps/www` layout — confirm `font-feature-settings: "ss01" 1, "cv11" 1` is applied to the admin shell
- Verify after token swap: `--radius` is `4px` not `0.5rem`, ember orange appears on primary buttons, sidebar background is `--sidebar` not `--background`

### 1b — AdminSidebar full redesign

Rewrite `AppSidebar` from the generic shadcn sidebar to match the design anatomy:

| Zone | Content |
|------|---------|
| Header | VexCMS wordmark — text-only placeholder until M7 brand is locked; use a small "V" icon + "VexCMS" text |
| Nav groups | "Collections" labeled group; each nav item: Lucide icon (from collection config `icon` field or a `LayoutList` default) + label text |
| Active state | Ember left-border accent + tinted `--sidebar-accent` background on the active item |
| Footer | `Convex · Live` status pip — colored dot + small label text; links to the Convex dashboard URL |
| Collapse trigger | Button at bottom of sidebar that toggles icon-rail mode |

Breakpoints: auto-collapse to icon-rail at ≤1024px (icon only, tooltip on hover for label); full icon+label at ≥1280px.

### 1c — AdminLayout shell redesign

The current layout has no topbar and uses a hardcoded `p-6` content wrapper. Replace with:

| Zone | Content |
|------|---------|
| Topbar | Fixed `h-12`, `--surface` background, `--line` bottom border |
| Topbar left | Breadcrumb slot — populated per view via a `breadcrumb` prop or render prop |
| Topbar right | Page action slot — populated per view (e.g. `+ New Post` on list, `Save / Cancel` on edit) |
| Main area | Scrollable, `--page` background, no hardcoded padding — each view controls its own interior layout |
| Mobile | `SidebarTrigger` in topbar left at mobile breakpoints |

### 1d — DashboardView redesign

Replace the plain card grid with the designed dashboard:
- Stats row: one stat tile per registered collection, each showing live doc count via Convex subscription
- Quick-action row: "View" + "New" links per collection
- Recent-activity section placeholder (shows "—" for now; wires up in Week 3 after draft workflow exists)
- Topbar breadcrumb: "Dashboard" / no page action button

### 1e — CollectionListView redesign

Replace the basic `h1` + table with the designed list view:

| Zone | Content |
|------|---------|
| Topbar (via layout) | Collection name breadcrumb left · `+ New {Singular}` ember primary button right |
| Toolbar row | Search input (full-text), filter dropdown (field-based), sort controls — sits between topbar and table |
| Table | Dense rows (~34px height) · `--surface` background · `--line` row borders · `--fg-muted` header labels |
| Checkbox column | Leftmost column; header checkbox = select all |
| Bulk action bar | Slides in when ≥1 row selected: "X selected" count + Delete action (future: Publish/Unpublish) |
| Row click | Entire row navigates to edit view — not just a button |
| Empty state | Centered icon + label + "Create your first {Singular}" CTA — not the current inline `<p>` |
| Mobile (≤390px) | Table reflows to card list — each card shows the first 2–3 columns as label/value pairs |

Column definitions still come from `getCollectionColumnDefs` — only the visual layer changes.

### 1f — CollectionEditView redesign

Replace the basic `h1` + form:

| Zone | Content |
|------|---------|
| Topbar (via layout) | Breadcrumb: "Collection name → Document title" left · Save + Cancel buttons right |
| Layout `"single"` (default) | Form centered at `max-w-[720px]`, `mx-auto`, `--page` background, field groups in `--surface` sections |
| Layout `"two-column"` | Left: form (flexible, 720px max) · Right: fixed meta rail (~280px) — system fields: status badge, created/updated timestamps, version info |
| Field sections | Section heading + `--line` divider; fields in a labeled grid (`--fg` label + `--fg-muted` description) |
| Not-found state | Proper empty state screen (not the current `<p>Document not found.</p>`) |

Layout variant controlled by a `layout?: "single" | "two-column"` prop.

### 1g — CreateDocumentModal redesign

The current modal is unstyled. Match the design:
- Triggered by topbar `+ New` button AND `⌘K` global shortcut
- Shows only fields marked `required: true` in the collection config (not the full form)
- Ember primary "Create" button · text "Cancel" link
- After save → navigates to full edit view for the new document

### 1h — Remaining M1 fields (end of week, after shell is solid)

Once the shell looks right, add the remaining field types. These are pure core additions with no visual refactoring needed since the shell now handles the layout:

| Field | Core shape | React component |
|-------|-----------|-----------------|
| `textarea` | Multi-line text, same schema as `text`, `rows` config | Textarea input |
| `imageUrl` | String field | Thumbnail preview + URL input |
| `json` | `v.any()` validator | Monospace textarea |
| `ui` | No schema output (non-persisted) | Renders `component` from config, stores nothing |
| `color` | String field (hex or CSS var) | Color swatch + popover picker |
| `tabs` | UI-only grouping (no schema impact) | Tab strip in edit form |

Each follows `adding-a-field-type.md`: `config.ts`, `types.ts`, `validator.ts`, `inputSchema.ts`, tests, React `Input` + `Cell` + `columnDef`, barrel exports.

### 1i — Relationship field picker UI baseline

The relationship field exists but the picker UI is incomplete. Implement the popover pattern (command-style search, single + short hasMany). The side panel (long hasMany) and inline drawer (polymorphic) follow in Week 3 when blocks + array fields need them.

---

## Week 2 — May 8–14: Auth + Media

**Goal:** Admin panel is login-gated. File upload works. Media library is usable.

### M2 — Better Auth (`@vexcms/better-auth`)

- `vexBetterAuth(config)` — extracts user/session/account tables from Better Auth config, injects them into the Vex schema as Convex table definitions
- First-user auto-admin — atomic Convex mutation that grants admin role to the very first sign-up
- Session in Convex query context — wire `@convex-dev/better-auth` so admin queries and mutations can access the current user
- `NextAdminLayout` auth guard — redirect to sign-in if no session; admin route protection in Next.js app router
- Export surface: `vexBetterAuth`, `useCurrentUser`, auth route helpers for Next.js

### M2 — File Storage (`@vexcms/file-storage-convex`)

Currently the adapter interface exists but no runtime. Needs:
- Convex HTTP actions: `generateUploadUrl`, `getUrl`, `deleteFile`
- Instructions/helpers for wiring these actions into user's Convex deployment (or code-gen via CLI)
- `upload` field type in `@vexcms/core` — stores a storage ID, links to a media collection doc
- Upload field React component — shows current file, opens media picker

### M2 — Media Collections + Library UI

- `defineMediaCollection()` in `@vexcms/core` — auto-injects `filename`, `mimeType`, `size`, `width`, `height`, `storageId` fields
- Media library grid view in admin (variant of list view, card grid instead of table)
- Upload dropzone in media library (drag-and-drop + click-to-browse)
- Media picker popover — opens from upload field component; select existing or trigger upload
- Per-field MIME type and size restrictions on the upload field config

---

## Week 3 — May 15–21: Content Workflow + Advanced Fields (Array + Blocks)

**Goal:** Full draft/publish lifecycle. Permissions enforced. Array + blocks fields working.

### M3 — Draft/Publish Workflow

- Fields added to versioned collections: `_status` (draft/published), `_draftSnapshot`, `_version`, `_hasDraft`, `_publishedAt`
- `vex_versions` table — version history per document
- Generated mutations: `adminSaveDraft`, `adminPublish`, `adminUnpublish`, `adminRestoreVersion`
- Autosave with debounce + version coalescing
- Version history panel in admin edit view — list + restore button
- Edit form toolbar: Save Draft / Publish / Unpublish / Reset to Published buttons (these slot into the layout's topbar action slot from Week 1)
- `versions: { drafts: true, autosave: true }` config on `defineCollection`
- `_vexDrafts` arg support in generated queries (for live preview later this week)

### M3 — RBAC / Access Permissions

- `defineAccess()` builder in `@vexcms/core` — type-safe permission matrix per role per collection
- `hasPermission()` runtime resolver
- Document-level permissions: create/read/update/delete per collection per role
- Field-level permissions: allowlist/denylist per action (read/update)
- Enforcement in all admin mutations and queries
- `defineAccess` config on `defineConfig`

### M4 — Array Field

- `array({ field })` — repeatable list of any single field type as items
- Schema: `v.array(...)` of the item field's validator
- Admin UI: add/remove/reorder items, drag-and-drop reorder, each item renders its sub-field component
- `minRows` / `maxRows` config

### M4 — Object / Group Field

- `object({ fields })` — named group of sub-fields stored as a flat object in Convex
- Schema: `v.object({ ... })` from sub-field validators
- Admin UI: collapsible section, renders each sub-field in a labeled grid
- Combines with `array` for "array of objects" pattern

### M4 — Blocks Field

- `defineBlock({ slug, label, fields })` in `@vexcms/core` — data-only, no React dep
- `blocks({ blocks: [...] })` field — ordered array of typed block instances
- Schema: discriminated union `v.union(...)` based on block slug
- Admin UI: block picker modal/popover, add/reorder/delete, inline edit per block
- `RenderBlocks` in `@vexcms/react` — component map + block data → rendered blocks
- Type inference: discriminated union of all allowed block shapes

---

## Week 4 — May 22–28: Richtext + Live Preview + DX + Brand

**Goal:** Richtext works. Live preview works. CLI is solid. Brand locked. Merge plan ready.

### M4 — Richtext Field (`@vexcms/richtext-plate`)

The package is scaffolded. Complete the implementation:
- `richtext({ label, mediaCollection? })` field type in `@vexcms/core`
- Plate.js editor in `@vexcms/richtext-plate/editor`:
  - Bold, italic, underline, strikethrough
  - Headings H1–H4
  - Bulleted and numbered lists
  - Blockquotes, code blocks (syntax highlight), horizontal rule
  - Links (URL popover), images (inline via mediaCollection if configured)
- `PlateStatic` renderer in `@vexcms/richtext-plate/render` — server-side + frontend rendering
- JSON storage in Convex (`v.any()`, Plate node array)
- Wired into `@vexcms/react` field registry so `richtext` field uses the Plate editor

### M3 — Live Preview

- `livePreview.url` config on `defineCollection` (function or string template)
- `LivePreviewPanel` in `@vexcms/react` — side-by-side iframe, responsive breakpoint tabs
- postMessage protocol: init, refresh, ready
- `useVexPreview` hook — imported by user's frontend, triggers re-fetch on draft changes
- Open-in-new-tab button in preview panel toolbar
- Draft snapshot sync: preview fetches draft content via `_vexDrafts: "snapshot"` arg

### M5 — CLI Completion (`@vexcms/cli`)

- `vex dev` — watch mode: schema gen + type gen + query gen + `convex dev` (verify working end-to-end)
- `vex dev --once` — single-shot generation
- `vex migrate` — run pending migrations
- `.env.local` loading before config import
- Clear error messages for invalid configs
- Hot-reload config file watching

### M5 — `create-vexcms` Template

- `pnpm create vexcms@latest` — interactive setup (project name, template choice)
- Base template: Next.js + Convex + Better Auth + VexCMS admin panel pre-wired
- Marketing site template: example collections (pages, posts, media), blocks, richtext, seeds
- Auto-generates `vex.config.ts`, `convex/` functions, auth routes, admin layout

### M5 — Changeset Pipeline + CI/CD

- Changeset workflow: `pnpm changeset` → PR description → `pnpm release`
- `ci.yml` — lint + typecheck + test on every PR
- `release.yml` — publish to npm on merge to main (triggered by changeset PR)
- All packages: `prepublishOnly` builds, locked `exports` fields, README in each package

### M7 — Brand Identity

- Logo: wordmark + icon variant SVG. Stark × Ember vocabulary — clean, technical, editorial-adjacent.
- Color palette: finalize the `globals.css` tokens as the canonical brand palette (Stark × Ember is already well-defined — lock it and document the token names)
- Typography: Geist Sans (headings + body) + Geist Mono (code). Document font weights and scale.
- OG image template: for sharing admin-demo and docs pages on social

---

## May 29 — Launch Day

**Goal:** Merge to main, publish npm, deploy sites, announce.

### M6 — Docs Site (key pages for launch)

The full docs site can grow post-launch, but these pages must exist at v0.1.0:
- `/getting-started` — zero to admin panel in < 10 minutes
- `/fields/*` — one page per field type (all M1 types)
- `/collections` — defineCollection, globals, media collections
- `/auth` — Better Auth integration guide
- `/cli` — vex dev, vex migrate, config reference
- `/drafts` — draft/publish workflow guide
- TypeDoc API reference auto-generated under `/api/` for all packages

Stub pages are acceptable for `/access-control`, `/live-preview`, `/roadmap`, `/changelog` at v0.1.0.

### M7 — Marketing Site (`apps/www` → vexcms.dev)

- Convert `apps/www` from the generic Next.js template to vexcms-powered
- Collections: `pages`, `posts` (blog), `features`, `faqs` — content managed via admin
- Blocks for composable landing page sections (Hero, FeatureGrid, CodeDemo, CTA, Comparison)
- Richtext for blog/changelog
- Media collection for images + OG images
- All pages render from Convex with server-side prefetch (no loading spinners)
- Brand (Stark × Ember) applied via Tailwind theme config
- Draft preview for content review before publish

### M8 — Launch Checklist

**Code:**
- [ ] `pnpm typecheck` passes across workspace
- [ ] `pnpm test` passes (target: 80%+ coverage on `@vexcms/core`)
- [ ] `pnpm lint` clean
- [ ] No `TODO` / `FIXME` in published package source

**Packages (all at `0.1.0`):**
- [ ] `@vexcms/core`
- [ ] `@vexcms/react`
- [ ] `@vexcms/next`
- [ ] `@vexcms/better-auth`
- [ ] `@vexcms/richtext-plate`
- [ ] `@vexcms/file-storage-convex`
- [ ] `@vexcms/cli`
- [ ] `create-vexcms`
- [ ] `exports` fields correct for all packages
- [ ] README in each package

**Git:**
- [ ] `rebuild` → `dev` merged (resolve conflicts)
- [ ] `dev` → `main` merged (after smoke test)
- [ ] `v0.1.0` tag on main
- [ ] Branch protection on main

**Deploy:**
- [ ] `vexcms.dev` → Vercel (`apps/www`)
- [ ] `docs.vexcms.dev` → Vercel (`apps/docs`)
- [ ] Convex project deployed for marketing site
- [ ] Custom domain DNS configured

**Announce:**
- [ ] GitHub README updated with accurate feature list
- [ ] Convex Stack / component directory listing submitted
- [ ] Post: Twitter/X, r/nextjs, r/typescript, relevant Discord servers

---

## Risk Register

| Risk | Mitigation |
|------|-----------|
| Week 1 UI redesign is dense (7 components to rewrite) | Token swap (1a) and sidebar (1b) are fast. List view (1e) and edit view (1f) are the heaviest. Timebox each to 1 day. Missing fields (1h) can slip to early Week 2 if needed |
| Richtext (M4) is the hardest single item | Timebox to 3 days max. Plate is scaffolded — focus on the core 10 features, cut image-in-editor if needed |
| Better Auth wiring has external dependency surface | Spike on `@convex-dev/better-auth` session integration first (Day 1 of Week 2) — unblock everything else |
| Docs site content is unbounded work | Write getting-started + fields reference only for launch. Everything else stubs. TypeDoc covers API reference |
| Marketing site takes longer than expected | Brand tokens are already defined (globals.css). Keep the site structure simple: 3–4 pages + Convex-managed content |
| Array + blocks in same week | Array/object first (smaller), blocks second. If blocks slip, move to early Week 4 |

---

## Implementation Order Quick Reference

```
Week 1 (May 1–7)    ADMIN UI REDESIGN — first, before any feature work
                     1a: Design tokens (globals.css → apps/www, @vexcms/next/styles)
                     1b: AdminSidebar (wordmark, icon nav, active state, Convex·Live pip, collapse)
                     1c: AdminLayout shell (topbar with breadcrumb + action slots, --page main area)
                     1d: DashboardView (stat tiles, quick-action links)
                     1e: CollectionListView (dense table, toolbar, bulk select, empty state, row click)
                     1f: CollectionEditView (single/two-column layouts, field sections, meta rail)
                     1g: CreateDocumentModal (required-fields-only, ⌘K shortcut)
                     1h: M1 remaining fields: textarea, imageUrl, json, ui, color, tabs
                     1i: Relationship picker popover baseline

Week 2 (May 8–14)   M2: Better Auth full wiring (vexBetterAuth, session, auth guard)
                     M2: File storage runtime (Convex HTTP actions)
                     M2: defineMediaCollection + media library + upload + picker

Week 3 (May 15–21)  M3: Draft/publish workflow (mutations, autosave, version history, topbar buttons)
                     M3: RBAC (defineAccess, hasPermission, enforcement)
                     M4: Array field + Object/Group field
                     M4: Blocks field + defineBlock + RenderBlocks

Week 4 (May 22–28)  M4: Richtext (Plate editor + static renderer)
                     M3: Live preview (panel + postMessage + useVexPreview)
                     M5: CLI completion + create-vexcms template
                     M5: Changeset pipeline + CI/CD
                     M7: Brand identity locked (logo SVG, font docs)

May 29              M6: Docs site key pages (getting-started + fields reference)
                     M7: Marketing site live at vexcms.dev
                     M8: npm publish + merge to main + v0.1.0 tag + announce
```
