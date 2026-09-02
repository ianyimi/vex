# Spec 30 — Site Builder (`defineSite`)

## Status: Notes (pre-spec)

These are design notes gathered from conversation. A full spec should be written before implementation.

---

## Overview

`defineSite()` is an optional top-level config primitive that bundles existing collections and globals into a site-building UX in the admin panel. It does not replace collections/globals — it organizes them into a navigable site structure with header, footer, theme, settings, pages, and page groups.

Users who don't use `defineSite()` get the exact same experience as today. Sites are sugar, not a requirement.

## Config Integration

```ts
// vex.config.ts
defineConfig({
  collections: [posts, pages, media, headers, footers, themes, siteSettings],
  globals: [...],
  sites: [mainSite],  // NEW optional field — array of defineSite() results
  // ...
})
```

## `defineSite()` API

```ts
const mainSite = defineSite({
  slug: "main",
  label: "Main Site",

  // Each references a collection slug (NOT a global)
  // Collections because users may want multiple saved versions to swap between
  settings: "site_settings",   // collection slug
  header: "headers",           // collection slug
  footer: "footers",           // collection slug
  theme: "themes",             // collection slug

  // Pages — just the collection slug, nothing else needed
  pages: "pages",              // collection slug

  // Page groups — route-prefixed collections
  pageGroups: [
    { slug: "blog", label: "Blog", collection: "posts" },
    { slug: "docs", label: "Documentation", collection: "docs" },
  ],
})
```

### Why collections, not globals

Header, footer, theme, and settings are **collections** (not globals) because:
- Users may want multiple saved versions to swap between (e.g., "Dark Theme", "Light Theme", "Holiday Theme")
- Each site picks one active document from each collection
- Future multi-site support: multiple sites can reference different documents from the same collections
- Settings is also a collection (not a global) to support the future multi-site use case where each site has its own settings document

### Auto-generated `vex_sites` table

`defineSite()` auto-generates a system table to store the active selections:

```ts
// vex_sites table schema (auto-generated)
{
  slug: v.string(),                        // "main"
  header: v.id("headers"),                 // relationship to active header
  footer: v.id("footers"),                 // relationship to active footer
  theme: v.id("themes"),                   // relationship to active theme
  settings: v.id("site_settings"),         // relationship to active settings
}
```

**Field names are `header`, `footer`, `theme`, `settings`** — no "active" prefix.

## Page Groups

Page groups organize a collection's documents under a route prefix in both the admin sidebar and the frontend.

```ts
pageGroups: [
  { slug: "blog", label: "Blog", collection: "posts" },
  { slug: "docs", label: "Documentation", collection: "docs" },
]
```

- **`slug`**: The route prefix. Pages in this group are expected to be at `/${slug}/*` on the frontend.
- **`label`**: Display name in the admin sidebar.
- **`collection`**: Which existing collection backs this page group.

**No `basePath` field** — the `slug` IS the route prefix. If the URL structure needs to differ from the slug, that's a frontend routing concern, not a CMS concern.

**No `blocks` field on pages or pageGroups** — the collection slug is sufficient. The admin panel renders the standard edit view for that collection, which already knows its fields (including any `blocks()` fields). The blocks available on a page are determined by the `blocks()` field definition on the collection, not by the site config.

## Frontend Routing

VEX is headless — the user controls routing. The site config tells the admin panel how to organize content, but the user must set up matching routes:

```
app/
  [slug]/page.tsx              ← pages from "pages" collection
  blog/[slug]/page.tsx         ← pages from "posts" (pageGroup slug: "blog")
  docs/[slug]/page.tsx         ← pages from "docs" (pageGroup slug: "docs")
```

Users fetch data via `vexQuery` and render pages themselves.

## Admin Sidebar Changes

When a site is defined, the sidebar gets a nested navigation structure:

```
▾ Main Site
  ├── Settings          → list/edit from "site_settings" collection
  │                       (with active indicator on the selected document)
  ├── Header            → list/edit from "headers" collection
  │                       (with active indicator)
  ├── Footer            → list/edit from "footers" collection
  │                       (with active indicator)
  ├── Theme             → list/edit from "themes" collection
  │                       (with active indicator)
  ├── Pages             → list/edit from "pages" collection
  ├── Blog              → list/edit from "posts" collection
  └── Documentation     → list/edit from "docs" collection

▾ Collections           → collections NOT claimed by any site
  ├── Categories
  └── Media

▾ Globals               → globals NOT claimed by any site
  └── (any unclaimed globals)
```

Collections referenced by a site are pulled out of the generic "Collections" section and into the site tree. Anything not referenced stays where it is today.

For header/footer/theme/settings sections, the admin should show:
- The list view for that collection (so users can see all saved versions)
- An indicator showing which document is currently active for the site
- A way to set a different document as the active one (e.g., a "Set as Active" button)

## Theme Collection

A typical theme collection definition:

```ts
const themes = defineCollection({
  slug: "themes",
  fields: {
    name: text({ required: true }),
    primaryColor: color({ label: "Primary" }),
    secondaryColor: color({ label: "Secondary" }),
    backgroundColor: color({ label: "Background" }),
    foregroundColor: color({ label: "Foreground" }),
    fontFamily: select({ options: ["Inter", "Geist", "System"] }),
    borderRadius: select({ options: ["none", "sm", "md", "lg", "full"] }),
    // ... more design tokens
  },
  admin: {
    useAsTitle: "name",
    icon: "palette",
  },
})
```

The `color()` field (Spec 29) reads from the active theme to populate its CSS variables tab. This creates a useful feedback loop: themes define colors, and other collections can reference those colors.

## Example Admin Components

Optional starter admin components for themes (e.g., a visual theme editor with tweakcn-style controls) live in `@vexcms/ui` — not in a separate blocks package. They are installed and used the same way as any user-defined custom admin component via Spec 09b:

```ts
// In the theme collection definition
primaryColor: color({
  admin: { components: { Field: "@vexcms/ui/admin/ThemeColorPicker" } },
})
```

These are examples/starters, not mandatory. Users can build their own.

## Multi-Site (Future Consideration)

The design supports multiple sites in a single repo:

```ts
defineConfig({
  sites: [marketingSite, docsSite, blogSite],
  // ...
})
```

Each site has its own `vex_sites` row with its own active header/footer/theme/settings. The admin sidebar would show multiple site trees. The admin panel could be hosted separately from the frontend, serving as a central content hub for multiple deployed sites.

This is a **later feature** — for now, most users will have one site. But the data model should not prevent it.

## Dependencies

- **Spec 28 (Blocks System)** — pages need the `blocks()` field type to compose content from blocks. Must be implemented first.
- **Spec 29 (Color Field)** — theme collections use the color field. Should be implemented before or alongside.
- **Spec 09b (Custom Component Registration)** — needed for optional custom admin components (e.g., theme editor), but NOT required for the core site builder to work.

## Implementation Order

1. Spec 28 — Blocks system (`defineBlock()`, `blocks()` field, `RenderBlocks`)
2. Spec 29 — Color field (`color()`, theme integration)
3. Spec 30 — Site builder (`defineSite()`, page groups, sidebar restructuring, `vex_sites` table)

## Open Questions

- Should `defineSite()` validate that referenced collection slugs actually exist in the config? (Probably yes, at config validation time.)
- How does the "Set as Active" flow work in the admin? Button on the list view? Dropdown on the site dashboard?
- Should the site have a dashboard/overview page showing the current active header/footer/theme/settings at a glance?
- How do page groups interact with live preview? Should the preview URL automatically prepend the page group slug?
- Should there be a `defineSite()` return type that allows type-safe access to the site's collections in frontend code?
