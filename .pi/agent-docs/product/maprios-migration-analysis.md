# Maprios WWW → VexCMS Migration Analysis

> Complete feature inventory from `/Users/zaye/Documents/Projects/maprios-app.git/dev/apps/www/src/payload.config.ts` and its full configuration tree. Identifies every feature, field type, and pattern used in the maprios site, then maps each to VexCMS's current capabilities and gaps.

---

## 1. Collections Inventory

| Collection | Purpose | Payload Config | VexCMS Status | Notes |
|---|---|---|---|---|
| **Users** | Auth (Better Auth) | `Users.ts` | ✅ **Supported** | `better-auth` adapter already handles this. Fields: `name`, `email`, `image`, `role` (`select`), `banned` (`checkbox`), `banReason` (`text`), `banExpires` (`date`), `password` (`text`, hidden). |
| **Sessions** | Auth sessions | `Sessions.ts` | ✅ **Supported** | `better-auth` adapter handles automatically. |
| **Accounts** | OAuth accounts | `Accounts.ts` | ✅ **Supported** | `better-auth` adapter handles automatically. |
| **Verifications** | Email verification | `Verifications.ts` | ✅ **Supported** | `better-auth` adapter handles automatically. |
| **Pages** | Content pages (block-based) | `Pages/config.ts` | ⚠️ **Partial** | Needs `blocks` field (✅ supported), `versions` with drafts (❌ missing), `autosave` (❌ missing), `livePreview` (❌ missing), `lockDocuments` (❌ missing), `access` with status-based read (❌ missing). |
| **Media** | File uploads | `Media/config.ts` | ⚠️ **Partial** | `upload` field type with custom `endpoints` (POST handler for file upload). `convexFileStorage` adapter exists but needs full integration with admin UI upload + `alt` field support. |
| **Themes** | CSS theme variables | `Themes.ts` | ✅ **Achievable** | `name` (`text`), `styles` (`json` field). Need `json` field type or store as `text` with JSON parsing. |
| **Headers** | Site header builder | `Headers/config.ts` | ✅ **Supported** | `title` (`text`) + `header` (`blocks`, single navbar block). `blocks` field with `minRows: 1`, `maxRows: 1` constraint. |
| **Footers** | Site footer builder | `Footers/config.ts` | ✅ **Supported** | Same pattern as Headers. |
| **ContactSubmissions** | Form submissions | `ContactSubmissions/config.ts` | ❌ **Missing** | Form builder collection. No `email` or `textarea` field types in VexCMS. Need form submission workflow (create from public, read only by admin). |

---

## 2. Globals Inventory

| Global | Purpose | Fields Used | VexCMS Status | Notes |
|---|---|---|---|---|
| **SiteConfig** | Site-wide settings | `siteTitle` (`text`), `siteDescription` (`textarea`), `favicon` (`upload` relationship), `ogImage` (`upload` relationship), `activeHeader` (`relationship`), `activeFooter` (`relationship`), `activeTheme` (`relationship`), `importTheme` (`ui` field) | ⚠️ **Partial** | No `globals` concept in VexCMS yet. Need to model as a single-document collection (`site-config` with `slug: "site-config"`). No `tabs` or `ui` field support. `textarea` and `upload` field types needed. |

**Key insight:** Payload's `globals` are effectively collections with a single document. VexCMS can model this as a regular collection with a single enforced document, or add a `global: true` flag to `defineCollection`.

---

## 3. Field Types Used (Comprehensive)

### 3.1 Already Supported in VexCMS

| Field Type | Used By | VexCMS Equivalent | Status |
|---|---|---|---|
| `text` | Every collection | `text()` | ✅ |
| `number` | Feature blocks, Stats | `number()` | ✅ |
| `checkbox` | Pages (`hidden`), ContactSubmissions (`agreedToTerms`) | `checkbox()` | ✅ |
| `date` | Users (`banExpires`) | `date()` | ✅ |
| `select` | Users (`role`), Hero (`variant`), Feature (`imagePosition`) | `select()` | ✅ |
| `relationship` | SiteConfig (`activeHeader`, `activeFooter`, `activeTheme`), Feature (`image` via upload) | `relationship()` | ✅ |
| `array` | Hero (`actions`), Contact (`contactMethods`), Feature (`features`), Gallery (`images`), Services (`services`), Stats (`stats`), Team (`members`), Testimonial (`testimonials`) | `array()` | ✅ |
| `group` | Hero (`badge`), Contact (`form`), Feature blocks | `group()` | ✅ |
| `blocks` | Pages (`blocks`), Headers (`header`), Footers (`footer`) | `blocks()` | ✅ |
| `url` | Links, CTAs | `url()` | ✅ |

### 3.2 Missing in VexCMS (Critical for Migration)

| Field Type | Used By | Priority | Migration Strategy |
|---|---|---|---|
| `textarea` | Pages (`description`), ContactSubmissions (`message`), SiteConfig (`siteDescription`) | **HIGH** | Add `textarea` field type or extend `text()` with `multiline: true` + `rows: number` admin option. |
| `email` | ContactSubmissions (`email`) | **HIGH** | Add `email` field type or extend `text()` with `email: true` validation + admin UI hint. |
| `upload` | Media (`alt` + file), SiteConfig (`favicon`, `ogImage`), Feature (`image`), Gallery (`images`), Hero (`backgroundImage`), Team (`image`), Testimonial (`image`) | **HIGH** | Media collection with `convexFileStorage` adapter. Need `upload` field type that stores file + metadata. Currently only `FileStorageAdapter` exists but no `upload` field type. |
| `json` | Themes (`styles`) | **MEDIUM** | Add `json` field type. Store as JSON in Convex, render as code editor in admin. Or use `text()` with JSON validation. |
| `icon` | Contact (`icon`), Navbar (`logo`), Services (`icon`), Stats (`icon`) | **MEDIUM** | Custom field for Lucide icon selection. Currently in Payload as `text` with custom admin component. VexCMS could add `icon` field type or use `select()` with icon preview. |
| `color` | Feature blocks, Hero blocks, Theme colors | **LOW** | Color picker field. Currently not used as a standalone field type in maprios, but theme colors are stored in JSON. |
| `richtext` / `lexical` | Pages (body content, if any), block descriptions | **LOW** | Maprios uses `text` for descriptions, not richtext. VexCMS has `@vexcms/richtext-plate` but not fully integrated. Payload uses `lexicalEditor()`. Not critical for this migration. |

### 3.3 Admin UI Layout Fields (Not Schema Types)

These are Payload admin UI features, not database schema types. They affect form layout but don't change data structure:

| Layout Feature | Used By | VexCMS Status | Notes |
|---|---|---|---|
| `tabs` | SiteConfig (General, Layout, Theme tabs) | ❌ Missing | Admin UI grouping. Could be modeled as `group` fields with `admin.section` metadata, or a dedicated `tabs` layout wrapper. |
| `row` | Contact (`value`/`href` pair), Form (`termsLinkLabel`/`termsLinkHref` pair) | ❌ Missing | Side-by-side field layout. Admin UI concern. Could be `group` with `admin.layout: "row"` or just use `group` fields. |
| `collapsible` | Not used in maprios | N/A | Expandable field group. Not needed. |
| `ui` | SiteConfig (`importTheme` button) | ❌ Missing | Custom admin UI component. Used for "Import Theme" button. Needs custom component injection in admin panel. |

---

## 4. Blocks Inventory (41 Block Variants Across 15 Categories)

### 4.1 Block Categories

| Category | Variants | Block Type | Complexity |
|---|---|---|---|
| **Hero** | 3 (197, 215, 223) | Content block | Medium |
| **Contact** | 1 (6) | Content + form config | High |
| **CTA** | 3 (20, 30, 31) | Content block | Low |
| **FAQ** | 2 (6, 15) | Content block | Low |
| **Feature** | 14 (7, 27, 57, 60, 62, 99, 102, 181, 187, 203, 207, 270, ...) | Content block | High (images, links, arrays) |
| **Footer** | 3 (5, 7, 15) | Layout block | Medium |
| **Gallery** | 2 (14, 15) | Image grid | Medium |
| **Industries** | 1 (2) | Content block | Low |
| **Navbar** | 4 (1, 2, 5, 17) | Navigation | Medium |
| **Service** | 1 (1) | Content block | Low |
| **Services** | 2 (8, 10) | Content list | Medium |
| **Stats** | 1 (14) | Number display | Low |
| **Team** | 1 (4) | Team member grid | Medium |
| **Testimonial** | 2 (19, 29) | Quote carousel | Medium |
| **Case Study** | 1 (8) | Content block | Low |

### 4.2 Block Field Patterns Used

Every block uses a subset of these patterns:

```
Common block fields:
├── headerField()        → text (custom wrapper)
├── titleField()         → text (custom wrapper)
├── descriptionField()   → text (custom wrapper)  
├── subheaderField()   → text (custom wrapper)
├── iconField()          → text (with icon picker UI)
├── uploadField()        → upload (relationship to media)
├── colorField()         → text (color picker UI)
├── colorPaletteField()  → array of color fields
├── socialLinksField()  → array of { platform, url }
├── callToActionPair() → group of { label, href, variant }
└── custom fields per block:
    ├── actions (array of CTA buttons)
    ├── features (array of feature items)
    ├── contactMethods (array of contact info)
    ├── services (array of service items)
    ├── stats (array of stat items)
    ├── testimonials (array of quotes)
    ├── team members (array of members)
    ├── gallery images (array of upload relationships)
    └── form config (group with title, description, messages, links)
```

**VexCMS `blocks()` field already supports this.** The `defineBlock()` API is functionally equivalent to Payload's `Block` config. The migration work is:
1. Porting block field definitions from Payload syntax to Vex field syntax
2. Creating React component renderers for each block variant
3. Mapping `blockType` slugs to React components (already done in `blockComponents` map)

---

## 5. Admin Features & Configuration

### 5.1 Live Preview

**Payload:** `livePreview: { collections: ["pages"], url: ({ data }) => ... }`

**Used for:** Real-time page preview in admin panel when editing pages.

**VexCMS Status:** ❌ Not supported. Would need:
- An iframe or external window that renders the page with draft data
- A draft/published status system (requires versioning)
- A preview route in the Next.js app that fetches draft data
- WebSocket or polling for real-time updates

**Priority:** MEDIUM. Nice-to-have for content editors. Can migrate without it initially.

### 5.2 Versions & Drafts

**Payload:** `versions: { drafts: { autosave: { interval: 200 } } }`

**Used for:** Every page edit autosaves as a draft. Published version is separate. Users can see draft vs published status.

**VexCMS Status:** ❌ Not supported. Convex has no native draft/versioning. Would need:
- A `status` field on documents (`draft`, `published`, `archived`)
- A `publishedAt` field for scheduling
- Admin UI status indicator and publish action
- Query logic that filters by status for public reads
- Optional: full version history with revert

**Priority:** HIGH. Critical for content workflow. Maprios `Pages` access control reads `status: "published"` for non-authenticated users.

### 5.3 Autosave

**Payload:** `autosave: { interval: 200 }` (200ms)

**Used for:** Auto-persisting form changes as drafts.

**VexCMS Status:** ❌ Not supported. Convex mutations are explicit. Would need:
- Debounced mutation calls on form change
- Optimistic updates with rollback on failure
- Admin form integration with TanStack Form's `onChange` + `setTimeout`

**Priority:** MEDIUM. Can start with manual save and add autosave later.

### 5.4 Custom Admin Components

**Payload:** `admin.components.actions: ["~/payload/components/VisitSite"]` ("Visit Site" button), `ui` field for Import Theme button.

**Used for:** Custom actions in the admin panel header, custom field components.

**VexCMS Status:** ⚠️ Partial. `admin.components` exists on `CollectionConfig` for relationship preview, but no generic action slot or custom field component registration.

**Priority:** LOW. "Visit Site" button is a convenience. Can be added later. Import Theme is a one-time setup feature.

### 5.5 Access Control

**Payload:** Per-collection `access` functions:
```ts
access: {
  read: ({ req }) => req.user ? true : { _status: { equals: "published" } },
  create: ({ req }) => !!req.user,
  // ...
}
```

**VexCMS Status:** ⚠️ Partial. `hasPermission` pure function exists in design doc but not implemented in current codebase. Auth collections are protected, but user-defined collection access rules are not yet wired.

**Priority:** HIGH. Maprios relies on status-based public access (`published` only for non-auth reads) and auth-only admin access.

### 5.6 Block Groups

**Payload:** `admin: { group: "Heroes" }` on each block definition.

**Used for:** Organizing blocks into categories in the admin block picker UI.

**VexCMS Status:** ❌ Not supported. `blocks()` field shows all blocks in a flat list.

**Priority:** LOW. Nice-to-have for UX. Can be added later.

---

## 6. Media / File Storage

### 6.1 Current Payload Setup

- **Storage:** Vercel Blob (`@payloadcms/storage-vercel-blob`)
- **Collection:** `Media` with `upload: true`, single `alt` field
- **Custom endpoint:** `POST /api/media/upload` for direct file upload
- **Usage:** Blocks reference media via `upload` field type (`relationTo: "media"`)

### 6.2 VexCMS Status

- `FileStorageAdapter` interface exists (`convexFileStorage()`)
- No `upload` field type in core fields
- Media collection is just a regular collection with `upload: true` in Payload
- Convex file storage works differently — `v.id("_storage")` for file references

**What's needed:**
1. **`upload` field type** — stores a file reference + metadata (alt, filename, dimensions, etc.)
2. **Admin UI file upload** — drag-and-drop or file picker in form
3. **Media collection** — a built-in or user-defined collection for file metadata
4. **Convex file storage integration** — `convexFileStorage()` adapter wired to upload/download
5. **Image rendering in blocks** — `getUrl()` from `FileStorageAdapter` to render images

**Priority:** HIGH. Nearly every block uses images. Hero backgrounds, feature images, gallery images, team photos, testimonial avatars, OG images, favicons.

---

## 7. Form Builder (Contact Submissions)

### 7.1 Current Payload Setup

**Collection:** `contact-submissions`

```ts
fields: [
  { name: "firstName", type: "text", required: true },
  { name: "lastName", type: "text", required: true },
  { name: "email", type: "email", required: true },
  { name: "company", type: "text" },
  { name: "message", type: "textarea", required: true },
  { name: "agreedToTerms", type: "checkbox", defaultValue: false },
]
```

**Access:** `create: () => true` (public), `read: ({ req }) => !!req.user` (admin only)

**Usage:** Contact form on frontend submits to this collection. Admin panel views submissions in a table.

### 7.2 VexCMS Status

- No `email` field type
- No `textarea` field type
- No form submission workflow
- No admin table view for submissions (would use standard collection list view)

**What's needed:**
1. **`email` field type** — text with email validation + admin UI with `@` icon
2. **`textarea` field type** — multiline text with configurable rows
3. **Public create API** — Convex mutation that allows unauthenticated document creation
4. **Submission table view** — standard collection list view (already supported if it's a collection)

**Priority:** HIGH. This is a core business feature (contact form). The user's question specifically called this out as the next major thing to build after media.

---

## 8. Seed Data

### 8.1 What's Seeded

Payload's `onInit: seedDatabase` runs on server startup:

1. **Theme** — Default theme with CSS variables
2. **Header** — Default navbar block
3. **Footer** — Default footer block
4. **Pages** — Multiple pre-built pages (home, about, etc.) with block content
5. **SiteConfig** — Links active header/footer/theme, sets site title/description

### 8.2 VexCMS Equivalent

- No `onInit` hook in VexCMS
- Could use Convex `seed` function or initialization mutation
- CLI command (`vex seed` or `npx convex run seed`)
- Seed data would be TypeScript/JSON files imported into seed function

**Priority:** LOW. One-time setup. Can be manual for initial migration.

---

## 9. Complete Feature Gap Summary

### 9.1 Must-Have (Blocking Migration)

| # | Feature | Why It Blocks | Est. Effort |
|---|---|---|---|
| 1 | **Media / Upload field** | Every block uses images. Hero, feature, gallery, team, testimonial, favicon, OG image. | Medium |
| 2 | **Form submission collection** | Contact form is core business feature. Public write + admin read. | Low |
| 3 | **`email` field type** | Contact form validation. | Low |
| 4 | **`textarea` field type** | Contact form message, page descriptions, site config description. | Low |
| 5 | **Draft/published status** | Pages access control requires `_status: "published"` for public reads. | Medium |
| 6 | **Access control** | `read` based on auth status + document status. | Medium |
| 7 | **SiteConfig as single-doc collection** | Global singleton pattern for site settings. | Low |

### 9.2 Should-Have (Important UX)

| # | Feature | Why Important | Est. Effort |
|---|---|---|---|
| 8 | **Block groups** | 41 blocks in a flat picker is overwhelming. Categories improve UX. | Low |
| 9 | **Autosave** | Content editors expect auto-save. Manual save is friction. | Medium |
| 10 | **Admin UI tabs** | SiteConfig has 3 tabs (General, Layout, Theme). Flat form is cluttered. | Medium |
| 11 | **Admin UI row layout** | Contact form config has side-by-side pairs (label + href). | Low |
| 12 | **Seed data / CLI** | One-time setup for initial site. Manual creation is tedious. | Low |
| 13 | **`json` field type** | Theme CSS variables stored as JSON. | Low |
| 14 | **Icon field** | Lucide icon picker used in contact methods, navbar, services, stats. | Low |

### 9.3 Nice-to-Have (Can Defer)

| # | Feature | Why Deferrable | Est. Effort |
|---|---|---|---|
| 15 | **Live preview** | Nice for editors but not critical. Can preview by publishing. | High |
| 16 | **Versions / history** | Drafts + published is enough. Full history is overkill for v1. | High |
| 17 | **Custom admin actions** | "Visit Site" button. Manual navigation works. | Low |
| 18 | **Custom field components** | Import Theme button. One-time setup. | Medium |
| 19 | **Richtext / lexical** | Maprios uses text fields, not richtext. | High |
| 20 | **Color picker** | Theme colors in JSON. Text field + manual entry works. | Low |

---

## 10. Recommended Migration Order

Based on the analysis, here's the recommended build order to unblock the maprios migration:

### Phase 1: Core Infrastructure (Blocks + Media)

1. **File storage media adapter** — Complete the `convexFileStorage` integration with upload/download in admin UI
2. **`upload` field type** — Add to core fields, admin UI drag-and-drop, file picker
3. **Media collection** — Built-in or documented pattern for file metadata collection
4. **Block renderers** — Create React components for all 41 block variants (can be done incrementally)

### Phase 2: Content & Forms

5. **`textarea` field type** — Multiline text input
6. **`email` field type** — Email validation + admin UI
7. **ContactSubmissions collection** — Public write access pattern, admin read-only table
8. **Draft/published status** — Add `status` field to Pages, filter queries by status
9. **Access control** — Wire `hasPermission` or equivalent for public vs auth reads

### Phase 3: Site Config & Polish

10. **SiteConfig collection** — Single-document pattern (singleton collection)
11. **`json` field type** — Theme CSS variables, config storage
12. **Admin UI tabs** — Group field layout enhancement
13. **Block groups** — Category filtering in block picker
14. **Seed data** — CLI command or initialization function
15. **Autosave** — Debounced mutation on form change

### Phase 4: Defer

16. Live preview
17. Version history
18. Custom admin components
19. Richtext integration
20. Color picker

---

## 11. Field Type Mapping: Payload → VexCMS

```
Payload Field                → VexCMS Field              → Status
─────────────────────────────────────────────────────────────────────────
text                         → text()                    ✅
textarea                     → text({ admin: { multiline: true } }) or textarea() ⚠️
email                        → text({ validation: email }) or email()  ⚠️
number                       → number()                  ✅
checkbox                     → checkbox()                ✅
date                         → date()                    ✅
select                       → select()                  ✅
relationship                 → relationship()            ✅
array                        → array()                   ✅
group                        → group()                   ✅
blocks                       → blocks()                  ✅
upload                       → upload() or relationship() + media ⚠️
json                         → text() (with JSON) or json() ⚠️
icon                         → select() (with icon preview) or custom ⚠️
tabs                         → N/A (admin UI layout)     ❌
row                          → N/A (admin UI layout)     ❌
collapsible                  → N/A (admin UI layout)     ❌
ui                           → N/A (custom admin component) ❌
richtext/lexical             → richtext-plate (partial)  ⚠️
```

---

## 12. Collection Mapping: Payload → VexCMS

```
Payload Collection           → VexCMS Collection         → Notes
─────────────────────────────────────────────────────────────────────────
Users                        → Auth adapter (better-auth) ✅ Auto-generated
Sessions                     → Auth adapter              ✅ Auto-generated
Accounts                     → Auth adapter              ✅ Auto-generated
Verifications                → Auth adapter              ✅ Auto-generated
Pages                        → defineCollection()        ⚠️ Needs draft status + access
Media                        → defineCollection() + upload ⚠️ Needs upload field
Themes                       → defineCollection()        ⚠️ Needs json field
Headers                      → defineCollection()        ✅ Blocks field works
Footers                      → defineCollection()        ✅ Blocks field works
ContactSubmissions           → defineCollection()        ⚠️ Needs email + textarea + public access
SiteConfig (global)          → defineCollection()        ⚠️ Needs singleton pattern
```

---

## 13. Key Architecture Decisions for Migration

### 13.1 Globals as Singleton Collections

Payload `globals` = VexCMS `defineCollection({ slug: "site-config", singleton: true })`

Implementation: Add a `singleton: true` option to `defineCollection`. The collection allows only one document. Admin UI shows "Edit" instead of "List" + "Create".

### 13.2 Draft Status

Payload `versions.drafts` = VexCMS `status` field on documents:

```ts
// In Pages collection
fields: {
  status: select({
    options: [
      { value: "draft", label: "Draft" },
      { value: "published", label: "Published" },
      { value: "archived", label: "Archived" },
    ],
    defaultValue: "draft",
    admin: { position: "sidebar" },
  }),
  publishedAt: date({ admin: { position: "sidebar" } }),
}
```

Access control: `read: () => true` for `find` queries (with `status: "published"` filter), `read: () => req.user` for `getById` (admins can see drafts).

### 13.3 Public Form Submission

Payload `ContactSubmissions` with `create: () => true` = VexCMS public mutation:

```ts
// Convex public mutation (no auth required)
export const create = mutation({
  args: { /* ContactSubmissions fields */ },
  handler: async (ctx, args) => {
    // Validate
    // Insert document
    // Optional: send notification email
    return { success: true };
  },
});
```

Admin UI: Standard collection list view with `read` access restricted to authenticated users.

### 13.4 Block Groups

Payload `admin: { group: "Heroes" }` = VexCMS `defineBlock({ admin: { group: "Heroes" } })`:

```ts
// In defineBlock options
interface BlockAdminConfig {
  group?: string; // "Heroes", "Call to Action", "Features", etc.
  icon?: LucideIconName;
}
```

Admin UI block picker: Group blocks by `admin.group` in the dropdown/selector.

---

## 14. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Block component migration** (41 React components) | High | Medium | Start with most-used blocks (Hero, Feature, Contact). Defer less-used blocks. |
| **Image upload complexity** (Convex file storage) | Medium | High | Use Convex's built-in file storage. Test with `convexFileStorage` adapter. Fallback to external storage if needed. |
| **Draft/published workflow** | Medium | Medium | Simpler than Payload's full versioning. Single `status` field is sufficient. |
| **Access control gaps** | Medium | High | Maprios has public reads + auth-only writes. VexCMS needs `hasPermission` or equivalent. |
| **Form validation** | Low | Medium | `email` + `textarea` are straightforward. `agreedToTerms` checkbox validation is simple. |
| **Theme JSON handling** | Low | Low | `json` field or `text` with JSON parsing. Not critical path. |
| **Block rendering performance** | Low | Medium | 41 block variants × N pages. Use React.lazy or dynamic imports for block components. |

---

## 15. Final Verdict

**The maprios site can be fully ported to VexCMS with 7 must-have features and 5 should-have features.** The core block architecture (`blocks()` field + `defineBlock()`) is already supported and is the most complex part of the migration. The remaining work is primarily:

1. **Field types:** `textarea`, `email`, `upload`, `json` (4 new field types)
2. **Admin features:** Draft status, access control, block groups, tabs, autosave
3. **Infrastructure:** Media upload/download, form submission workflow, seed data
4. **Block components:** Port 41 React components from Payload to VexCMS rendering

**Estimated effort:** 2–3 weeks of focused development on VexCMS core + admin UI, followed by 1–2 weeks for block component migration and testing.

**No blockers:** All missing features are well-understood, implementable within VexCMS's existing architecture, and don't require fundamental redesign.
