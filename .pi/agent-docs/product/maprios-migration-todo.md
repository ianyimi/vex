# Maprios → VexCMS Migration: Pre-Migration Checklist

> Last updated: 2026-08-04
>
> Tracks every framework feature that must exist in the **rebuild branch** before
> either of the two maprios projects can be migrated off Payload/MongoDB and onto
> VexCMS + Convex. Split into two tiers: **www** (marketing site) and **main app**
> (the primary product app, which also requires multi-component architecture).
>
> **Important:** the `roadmap.md` describes features from the master branch that
> have NOT been ported to the rebuild yet. The items below were verified directly
> against the rebuild package source. Do not trust the roadmap's ✅ markers as
> indicators of rebuild readiness.

---

## Tier 1 — maprios/www Migration (Drop Mongo from the Marketing Site)

### Framework Features (Must Build First)

These are gaps in the rebuild's package code. Nothing in this list can be
worked around — each one is a hard blocker for the www migration.

---

#### 1. Versioning & Drafts — Spec 07

**Why it blocks:** The maprios `Pages` collection uses `_status: "published"` to
gate public reads. Without a draft/published workflow, there is no way to have
unpublished content or a working publish button in the admin.

**What's needed:**
- `_status` (draft/published), `_draftSnapshot`, `_version`, `_hasDraft`,
  `_publishedAt` fields auto-injected on versioned collections
- `vex_versions` table (history per document)
- `adminSaveDraft`, `adminPublish`, `adminUnpublish`, `adminRestoreVersion`
  generated mutations
- Autosave with debounce + version coalescing
- Version history panel in the admin edit view
- `_vexDrafts` arg support in generated queries (live preview later)
- Status indicator + Save Draft / Publish / Unpublish buttons in edit form toolbar

**Current state:** Zero presence in `packages/core/src/`. Not started.

---

#### 2. RBAC / Access Control — Spec 16

**Why it blocks:** Maprios pages are public-readable only when `_status ===
"published"`. Authenticated admins can see drafts. Without an access layer this
filter cannot be expressed and the CMS has no concept of per-collection
permission rules.

**What's needed:**
- `defineAccess()` builder — type-safe permission matrix per role per collection
- `hasPermission()` runtime resolver
- Document-level permissions (create / read / update / delete per collection per role)
- Field-level permissions (read / update allowlist)
- Enforcement in all generated admin mutations and queries
- **Public / unauthenticated access pattern** — `create: () => true` equivalent
  so contact form submissions can be written without a session (see item 6 below)

**Current state:** Zero presence in `packages/core/src/`. `defineAccess` and
`hasPermission` do not exist anywhere in the rebuild. Not started.

---

#### 3. Globals / `defineGlobal` — Spec 38

**Why it blocks:** Maprios `SiteConfig` is a Payload global (single-document
collection). It holds the active header, footer, theme, site title, OG image,
and favicon. Without a globals concept in VexCMS, there is no clean way to
model this.

**What's needed:**
- `defineGlobal()` config function in `@vexcms/core`
- `globals.get` query with draft awareness
- `GlobalEditView` component in `@vexcms/react`
- Globals shown in admin sidebar (separate from collections)
- `singleton: true` or equivalent pattern on `defineCollection` as an alternative

**Current state:** Zero presence in `packages/core/src/` or
`packages/react/src/`. The CHANGELOG references this from the master branch but
it was never ported. Not started in rebuild.

---

#### 4. JSON Field Type

**Why it blocks:** The maprios `Themes` collection stores CSS variable maps as
`{ styles: json() }`. Without a `json` field type the Themes collection cannot
be defined.

**What's needed:**
- `json()` field in `@vexcms/core` — schema: `v.any()`, Zod: `z.unknown()`
- Admin input: code editor (Monaco or a simple `<textarea>` with JSON
  validation) with error state when JSON is malformed
- Cell component: truncated JSON preview in list view

**Current state:** Commented out in `packages/core/src/fields/constants.ts`.
Not in the field registry or the react field component map. Not started.

---

#### 5. Email + Textarea Field Types (partial Spec 24)

**Why it blocks:** The maprios contact form collection has `email` and
`textarea` fields. Neither exists as a distinct field type in the rebuild.

**What's needed:**
- `email()` field — same schema as `text()`, adds email format validation to
  Zod input schema, shows `@` icon in admin input
- `textarea()` field — same schema as `text()`, renders a `<textarea>` instead
  of `<input>`, accepts `rows` config option
- Both need Input + Cell components in `@vexcms/react`

**Note:** This is distinct from the full Form Builder (Spec 24). The form
builder is about dynamically configuring forms via the CMS. These are just two
new primitive field types. Implement as standalone field additions; the full
form builder spec can come later.

**Current state:** Not in `packages/core/src/fields/`. Not started.

---

#### 6. Public (Unauthenticated) Mutation Access

**Why it blocks:** The maprios `ContactSubmissions` collection has
`access: { create: () => true }` — anyone can POST a form submission without a
session. Without this pattern, the contact form cannot write to Convex.

**What's needed:**
- `defineAccess()` (see item 2) must support an explicit `public: true` flag or
  `create: "public"` shorthand on a per-collection basis
- The generated Convex mutation for that collection must skip the auth check for
  `create` operations
- Basic rate limiting should be considered (at minimum, document the recommended
  pattern — e.g. Convex scheduled function + IP hash counter)

**Current state:** Depends on RBAC (item 2). Not started.

---

#### 7. PDF Block / Field — NEW (Not in Any Existing Spec)

**Why it blocks:** The maprios www site has a `Pdf_1` block that accepts an
`upload` field (PDF files only) and renders the document inline using
`react-pdf`. The existing implementation in maprios (`Pdf/Pdf_1/`) is complete
and can be referenced directly.

**What's needed:**
- `upload` field with `filterOptions: { mimeType: { contains: "pdf" } }` — the
  upload field already exists in the rebuild, so this is a config option on the
  existing field, not a new field type
- A `Pdf_1` block definition using `defineBlock()` with that filtered upload field
- A React renderer component that dynamically imports `react-pdf`
  (must be `ssr: false` — pdf.js relies on browser globals)
- A `PdfDocument` subcomponent that measures container width via `ResizeObserver`
  and renders all pages stacked vertically

**Reference implementation:** Already exists at:
```
/Users/zaye/Documents/Projects/maprios-app.git/dev/apps/www/src/payload/blocks/Pdf/Pdf_1/
  config.ts       ← block field config (filterOptions for PDF mime type)
  index.tsx       ← renderer (dynamic import, null guard on URL)
  PdfDocument.tsx ← react-pdf Document + Page components, ResizeObserver
```

**Dependencies:** `react-pdf` + `pdfjs-dist` (already in maprios www
`package.json`). Will need to be added to the vex www app.

**Current state:** Not started in vex. Low implementation risk — it's a port,
not a build from scratch.

---

#### 8. Block Group Categorization (gap in Spec 28)

**Why it blocks:** The maprios site has 35+ block variants across 15+ categories.
A flat block picker with 35 items in a single list is unusable. Groups are
essential UX, not a nice-to-have.

**What's needed:**
- `admin.group` option on `defineBlock()` (e.g. `admin: { group: "Heroes" }`)
- Admin block picker renders collapsible or labeled sections by group
- Groups ordered by config declaration order (not alphabetically)

**Current state:** `defineBlock()` exists in the rebuild but has no `admin.group`
option. The picker renders a flat list. Small change, low risk.

---

### Implementation Work (After Framework Features Land)

Once all 8 items above are done, the remaining www migration effort is purely
content/component work — no new framework features required.

| Work Item | Notes |
|---|---|
| **Port ~35–40 block configs** | `defineBlock()` calls for each maprios block variant. Config is straightforward — most fields are text/select/array/group/upload combos that all exist in the rebuild. |
| **Port ~35–40 block React renderers** | The maprios renderer components can be copied and adapted. Main changes: swap Payload types for Vex generated types, swap `payload.find()` calls for `convexQuery()`. |
| **Define 5–6 collections** | Pages, Media, Themes, Headers, Footers, ContactSubmissions |
| **Define 1 global** | SiteConfig (activeHeader, activeFooter, activeTheme, siteTitle, siteDescription, favicon, ogImage) |
| **Write seed script** | Convex `seed` mutation or `npx convex run seed`. Equivalent to maprios `payload/seed/`. |
| **Wire auth routes** | Better Auth routes already exist in the rebuild's www app template. |
| **Drop Payload + MongoDB** | Remove `payload`, `@payloadcms/*`, `@payloadcms/db-mongodb`, `mongodb` from maprios www `package.json`. Remove `payload.config.ts`. Remove `/api/[...slug]` Payload route handler. |

**Estimated effort:** 1–2 weeks of block porting after the 8 framework features
are complete.

---

## Tier 2 — maprios Main App Migration (Full Mongo Drop)

The main app migration requires everything in Tier 1, plus the following
additional items. These are significantly larger architectural changes.

---

#### 9. Multi-Component Architecture — Spec 43a

**Why it blocks:** The main app is a separate product from the www site. It
needs its own Convex tables, collections, and schema — isolated from the www
site's content. The current rebuild assumes a single flat schema per deployment.

**What's needed:**
- `defineComponent()` config function in `@vexcms/core`
- Hierarchical `vex.config.ts` with root collections + `components: []` array
- Per-component schema generation in the CLI (separate `convex/schema.ts`
  per component namespace)
- Per-component query/mutation generation
- Admin panel workspace routing — sidebar shows a workspace switcher,
  each workspace shows only that component's collections
- Basic subdomain routing support (optional at first)

**Current state:** Architecture is designed in
`.pi/agent-docs/product/multi-component-architecture.md`. Not started. This is
the largest single item on either migration list.

---

#### 10. Cross-Component Auth & User Pattern — Spec 43b

**Why it blocks:** Better Auth's user table lives in the root Convex component.
The main app's component needs to reference users (for ownership, permissions,
audit) without having its own separate users table. The two components need a
clean cross-component user lookup pattern.

**What's needed:**
- Root users table (Better Auth) stays in the default component
- Component tables store `userId` as `v.string()` (not `v.id("users")`)
- Index on `userId` for performant user-scoped queries in component tables
- Root component exposes a `getUserById` query for cross-component lookup
- `relationship` field support for cross-component refs
  (`to: "users"`, `component: "root"`)
- Access control runs at root dispatcher level before delegating to component

**Current state:** Spec written in roadmap.md as Spec 43b. Not started.
Depends on Spec 43a.

---

#### 11. Component Switcher UI (can defer past initial migration)

**Why it blocks (eventually):** Once multiple components exist, the admin panel
needs a UI to switch between them. However, the initial main app migration can
potentially run with a single component or with a basic sidebar section split —
the switcher is a UX improvement, not a hard technical blocker.

**What's needed:**
- Workspace switcher in admin header/sidebar
- Per-workspace breadcrumb context
- URL routing that includes the component/workspace segment

**Current state:** Not started. Can be deferred until after the initial main
app migration is working.

---

## Summary Table

| # | Feature | Spec | Tier | Status |
|---|---|---|---|---|
| 1 | Versioning / Drafts | Spec 07 | www | ❌ Not started |
| 2 | RBAC / Access Control | Spec 16 | www | ❌ Not started |
| 3 | Globals / `defineGlobal` | Spec 38 | www | ❌ Not started |
| 4 | JSON field type | — | www | ❌ Not started |
| 5 | Email + textarea field types | Spec 24 (partial) | www | ❌ Not started |
| 6 | Public mutation access | Spec 16 / Spec 24 | www | ❌ Not started (depends on #2) |
| 7 | PDF block / field | NEW | www | ❌ Not started (port from maprios) |
| 8 | Block group categorization | Spec 28 gap | www | ❌ Not started |
| — | Block + collection porting | implementation | www | ⏳ After #1–8 |
| 9 | Multi-component architecture | Spec 43a | main app | ❌ Not started |
| 10 | Cross-component auth | Spec 43b | main app | ❌ Not started (depends on #9) |
| 11 | Component switcher UI | Spec 43a | main app | ⏳ Can defer past initial migration |

---

## What Is NOT Required Before www Migration

These features appear in the roadmap as important but are **not blockers** for
the www migration specifically. They can land any time before or after.

| Feature | Why It's Not Blocking |
|---|---|
| Richtext field wired as a field type | Maprios www uses `text` fields for almost all content. Richtext blocks are rare. Can substitute `text` initially. |
| Live preview | Editors can publish to see changes. Nice to have but not essential for launch. |
| Color field | Maprios theme colors live in the JSON `styles` field (item 4). Color picker is an enhancement. |
| Tabs field | Can be replaced by `group` fields with section labels for now. |
| Block style controls | Not used in maprios. Vex-specific feature. |
| Team management UI | Not needed for content editing. |
| API key management | Not needed for content editing. |
| Hooks system | Not needed for content editing at migration time. |
| Onboarding tour | Nice DX, not a content requirement. |
| Icon picker field | Maprios uses Lucide icons via a text field with custom admin component. Can substitute `text` with a note initially. |
| Custom field components (`admin.components.Field/Cell`) | Not required for the maprios field set. Only needed for the icon picker enhancement. |

---

## Reference Files

| File | Purpose |
|---|---|
| `.pi/agent-docs/product/maprios-migration-analysis.md` | Full field-by-field and collection-by-collection mapping from Payload → VexCMS |
| `.pi/agent-docs/product/maprios-roadmap-gaps.md` | Gap analysis cross-referencing maprios config against the roadmap |
| `.pi/agent-docs/product/multi-component-architecture.md` | Architecture design for Spec 43 (multi-component / workspace model) |
| `.pi/agent-docs/product/roadmap.md` | Full spec list and phase plan (note: ✅ markers reflect master branch, not rebuild) |
| `packages/core/src/fields/` | Actual field types implemented in the rebuild |
| `packages/react/src/components/views/` | Actual admin views implemented in the rebuild |
| `/Users/zaye/Documents/Projects/maprios-app.git/dev/apps/www/src/payload/` | Source of truth for all maprios www collections, globals, blocks, and fields |
