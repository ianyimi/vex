# 26 — Convex Migration & Seed Script

Status: **Draft (not started)**

## Overview

Migrate the www app to a new Convex deployment with a code-based seed script that populates all collections with design-accurate data from the Stark × Ember marketing site designs. Restructure the www app collections to match the marketing-site template (pages, headers, footers, themes, site_settings) using only currently implemented field types. Align the core test fixture schema with www's collection shapes so both packages test against the same data model. After this spec, `pnpm typecheck && pnpm test && pnpm build` pass cleanly and a fresh Convex deployment can be seeded with `npx convex run seed:init`.

## Code Effect Preview

### www collections expand from 2 to 4

```ts
// BEFORE — apps/www/src/vexcms/collections/index.ts
export * from "./pages"
export * from "./posts"

// AFTER — apps/www/src/vexcms/collections/index.ts
export * from "./pages"
export * from "./headers"
export * from "./footers"
export * from "./themes"
```

### pages collection gains SEO + content fields

```ts
// BEFORE — apps/www/src/vexcms/collections/pages.ts
  fields: {
    title: text({ required: true }),
    slug: text({ required: true }),
    posts: relationship({ collection: { slug: TABLE_SLUG_POSTS }, hasMany: true, label: "Posts" }),
  },

// AFTER — apps/www/src/vexcms/collections/pages.ts
  fields: {
    title: text({ required: true }),
    slug: text({ required: true, index: "by_slug" }),
    content: text({ label: "Content", admin: { description: "Page body content (blocks support coming soon)" } }),
    metaTitle: text({ label: "Meta Title", admin: { description: "Custom <title> tag. Falls back to page title if empty.", position: "sidebar" } }),
    metaDescription: text({ label: "Meta Description", admin: { description: "Custom meta description for search results.", position: "sidebar" } }),
    ogImage: url({ label: "OG Image", admin: { description: "Open Graph image URL for social sharing.", position: "sidebar" } }),
  },
```

### Seed mutation replaces manual admin entry

```ts
// BEFORE — no seed script; data entered manually via admin panel

// AFTER — apps/www/convex/seed.ts
export const init = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Creates: site_settings, header, footer, theme, 4 pages (home, features, pricing, roadmap)
    // Idempotent — skips items that already exist
    return { created, skipped, message }
  },
})
```

### Core test fixture schema aligned with www shapes

```ts
// BEFORE — packages/core/src/api/test/convex/schema.ts
  posts: defineTable({ title, slug, body, featured, author, parent }),
  authors: defineTable({ name, organization }),
  organizations: defineTable({ name }),

// AFTER — packages/core/src/api/test/convex/schema.ts
  pages: defineTable({ title, slug, content, metaTitle, metaDescription, ogImage }),
  themes: defineTable({ name, fontFamily, radius, primaryLight, primaryDark }),
```

## API Surface

No public API changes. This spec is internal — collections config, seed data, and test fixtures.

## Design Decisions

A one-line summary of every decision. Full rationale, alternatives, and trade-offs live in `design-walkthrough.md` § *Decisions Reference*.

| #   | Decision (one line)                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------- |
| D1  | Use only implemented field types (`text`, `url`, `number`, `select`, `checkbox`, `date`, `relationship`).   |
| D2  | Blocks/globals/defineSite/upload/imageUrl/color/tabs deferred — not yet implemented in `@vexcms/core`.       |
| D3  | `site_settings` uses `defineCollection` (not `defineGlobal`) — globals not yet implemented.                  |
| D4  | Page content stored as `text` field — placeholder for future `blocks` field type.                            |
| D5  | Themes collection stores color values as `text` fields with hex descriptions — placeholder for `color`/`tabs`. |
| D6  | Core test fixture restructured to match www collection shapes — pages/themes instead of posts/authors/organizations. |
| D7  | Core keeps its own fixture schema (no cross-package import) — tests run with `pnpm --filter @vexcms/core test` independently. |
| D8  | Seed mutation is idempotent — safe to run multiple times, skips existing data.                               |
| D9  | Header/footer content stored as structured `text` fields (JSON-like) — placeholder for `blocks`.            |
| D10 | Auth tables (user, session, account, verification, apikey, jwks) remain in schema — Better Auth requires them. |
| D11 | Posts collection removed — not used by the marketing site. Pages are standalone content documents. |

## Out of Scope

- Posts collection — removed, not needed for the marketing site. Pages are standalone content documents.
- Blocks system (`defineBlock`, `blocks` field type) — spec 28
- Globals (`defineGlobal`) — spec 30
- Site builder (`defineSite`) — spec 30
- Upload/image field types — future spec
- Color/tabs field types — spec 29
- Admin panel UI changes — no new admin components
- Marketing site frontend pages (React components for Home, Features, etc.) — spec 33
- Theme CSS injection / ThemeStyle component — spec 33
- SEO metadata wiring into Next.js routes — spec 41
- Convex deployment provisioning (user handles this)

## Target Directory Structure

```
apps/www/
├── convex/
│   ├── seed.ts                        # NEW — idempotent seed mutation
│   ├── schema.ts                      # MODIFY — add headers, footers, themes tables; remove posts
│   ├── vex.schema.ts                  # MODIFY — regenerated by vex dev
│   ├── test.ts                        # MODIFY — remove posts reference
│   └── vex/
│       └── collections.test.ts        # MODIFY — test against all collections
├── src/
│   ├── db/
│   │   └── constants/
│   │       └── index.ts               # MODIFY — add table slug constants; remove TABLE_SLUG_POSTS
│   ├── vex.types.ts                   # MODIFY — regenerated by vex dev
│   └── vexcms/
│       └── collections/
│           ├── index.ts               # MODIFY — export new collections; remove posts
│           ├── pages.ts               # MODIFY — add content, SEO fields; remove posts relationship
│           ├── posts.ts               # DELETE — not needed for marketing site
│           ├── headers.ts             # NEW — header collection
│           ├── footers.ts             # NEW — footer collection
│           └── themes.ts              # NEW — theme collection
├── .env.local                         # MODIFY — new CONVEX_DEPLOYMENT + CONVEX_URL
└── .env.example                       # MODIFY — add env var documentation

packages/core/src/
├── api/
│   ├── test/convex/
│   │   ├── schema.ts                  # MODIFY — pages/themes fixture (posts/authors/organizations removed)
│   │   └── _generated/api.ts          # MODIFY — regenerated
│   ├── create/server.test.ts          # MODIFY — update fixture references
│   ├── depth.test.ts                  # MODIFY — update fixture config
│   ├── find/server.test.ts            # MODIFY — update fixture references + config
│   ├── get/server.test.ts             # MODIFY — update fixture references
│   ├── populate.test.ts              # MODIFY — update fixture references
│   ├── remove/server.test.ts          # MODIFY — update fixture references
│   ├── search/server.test.ts          # MODIFY — update fixture references
│   └── update/server.test.ts          # MODIFY — update fixture references
└── auth/mergeCollections.test.ts      # MODIFY — if it references fixture schema
```

## Implementation Order

1. **Step 1: Table slug constants + new collection configs** [dev] — After this step, `vex.config.ts` references all 4 collections and `pnpm typecheck` passes.
2. **Step 2: Update pages collection + remove posts** [dev] — After this step, pages has SEO fields, posts is deleted, `pnpm typecheck` passes.
3. **Step 3: Seed mutation** [agent] — After this step, `npx convex run seed:init` populates a fresh deployment with design-accurate data.
4. **Step 4: Regenerate Convex schema + types** [agent] — After this step, `vex.schema.ts` and `vex.types.ts` reflect all new collections, `pnpm typecheck` passes.
5. **Step 5: Restructure core test fixture** [dev] — After this step, core fixture uses pages/themes, all core tests pass.
6. **Step 6: Update www Convex tests** [agent] — After this step, `apps/www/convex/vex/collections.test.ts` covers all 4 collections.
7. **Step 7: Env guide + final verification** [agent] — After this step, env vars documented, all workspace commands pass.

---

## Step 1: Table slug constants + new collection configs [dev]

Create table slug constants for the new collections and define their configs using only implemented field types.

### Files to create / modify

- [ ] `apps/www/src/db/constants/index.ts` — modify: add TABLE_SLUG_HEADERS, TABLE_SLUG_FOOTERS, TABLE_SLUG_THEMES, TABLE_SLUG_SITE_SETTINGS
- [ ] `apps/www/src/vexcms/collections/headers.ts` — NEW
- [ ] `apps/www/src/vexcms/collections/footers.ts` — NEW
- [ ] `apps/www/src/vexcms/collections/themes.ts` — NEW
- [ ] `apps/www/src/vexcms/collections/index.ts` — modify: export new collections
- [ ] `apps/www/src/vex.config.ts` — modify: add new collections to config

### `apps/www/src/db/constants/index.ts` (modify)

Add table slug constants for the new collections:

```ts
+ export const TABLE_SLUG_HEADERS = "headers" as const
+ export const TABLE_SLUG_FOOTERS = "footers" as const
+ export const TABLE_SLUG_THEMES = "themes" as const
+ export const TABLE_SLUG_SITE_SETTINGS = "site_settings" as const
```

### `apps/www/src/vexcms/collections/headers.ts` (NEW)

Header collection for the marketing site navigation. Blocks not yet available, so content fields are structured as individual text/url fields matching the Header block config from the design.

```ts
import { defineCollection, relationship, select, text, url } from "@vexcms/core"

import { TABLE_SLUG_HEADERS, TABLE_SLUG_MEDIA } from "~/db/constants"

export const headers = defineCollection({
  slug: TABLE_SLUG_HEADERS,
  interfaceName: "Header",
  labels: {
    singular: "Header",
    plural: "Headers",
  },
  admin: {
    useAsTitle: "name",
  },
  fields: {
    name: text({
      label: "Name",
      required: true,
    }),
    logoText: text({
      label: "Logo Text",
      defaultValue: "Vex CMS",
    }),
    logoHref: text({
      label: "Logo Link",
      defaultValue: "/",
    }),
    menuItems: text({
      label: "Menu Items",
      admin: {
        description:
          "JSON array of { label, href } objects. Example: [{"label":"Features","href":"/features"}]",
      },
      defaultValue:
        '[{"label":"Features","href":"/features"},{"label":"Pricing","href":"/pricing"},{"label":"Roadmap","href":"/roadmap"},{"label":"Docs","href":"/docs"}]',
    }),
    actionButtons: text({
      label: "Action Buttons",
      admin: {
        description:
          'JSON array of { label, href, variant } objects. Variants: default, outline, ghost.',
      },
      defaultValue:
        '[{"label":"GitHub","href":"https://github.com/vexcms/vex","variant":"ghost"},{"label":"Get Started","href":"/docs","variant":"default"}]',
    }),
  },
})
```

### `apps/www/src/vexcms/collections/footers.ts` (NEW)

Footer collection for the marketing site. Links stored as text with JSON format until blocks are available.

```ts
import { defineCollection, text, url } from "@vexcms/core"

import { TABLE_SLUG_FOOTERS } from "~/db/constants"

export const footers = defineCollection({
  slug: TABLE_SLUG_FOOTERS,
  interfaceName: "Footer",
  labels: {
    singular: "Footer",
    plural: "Footers",
  },
  admin: {
    useAsTitle: "name",
  },
  fields: {
    name: text({
      label: "Name",
      required: true,
    }),
    logoText: text({
      label: "Logo Text",
      defaultValue: "Vex CMS",
    }),
    copyright: text({
      label: "Copyright Text",
      defaultValue: "Vex CMS. All rights reserved.",
    }),
    links: text({
      label: "Links",
      admin: {
        description:
          "JSON array of { label, href } objects.",
      },
      defaultValue:
        '[{"label":"Features","href":"/features"},{"label":"Pricing","href":"/pricing"},{"label":"Roadmap","href":"/roadmap"},{"label":"Documentation","href":"/docs"},{"label":"GitHub","href":"https://github.com/vexcms/vex"},{"label":"npm","href":"https://www.npmjs.com/package/@vexcms/core"},{"label":"Convex","href":"https://convex.dev"}]',
    }),
    socialLinks: text({
      label: "Social Links",
      admin: {
        description:
          'JSON array of { platform, href, icon } objects.',
      },
      defaultValue:
        '[{"platform":"GitHub","href":"https://github.com/vexcms/vex","icon":"Github"},{"platform":"X","href":"https://x.com/vexcms","icon":"Twitter"}]',
    }),
  },
})
```

### `apps/www/src/vexcms/collections/themes.ts` (NEW)

Theme collection for the marketing site. Color fields stored as text with hex values — placeholder for the `color` and `tabs` field types.

```ts
import { defineCollection, text } from "@vexcms/core"

import { TABLE_SLUG_THEMES } from "~/db/constants"

export const themes = defineCollection({
  slug: TABLE_SLUG_THEMES,
  interfaceName: "Theme",
  labels: {
    singular: "Theme",
    plural: "Themes",
  },
  admin: {
    useAsTitle: "name",
  },
  fields: {
    name: text({
      label: "Theme Name",
      required: true,
    }),
    fontFamily: text({
      label: "Font Family",
      defaultValue: "Geist, Inter, system-ui, sans-serif",
    }),
    radius: text({
      label: "Border Radius",
      defaultValue: "0.25rem",
      admin: {
        description: "Base border radius in rem. Applied to shadcn --radius token.",
      },
    }),
    /** Light mode primary color */
    primaryLight: text({
      label: "Primary (Light)",
      defaultValue: "#E8622A",
      admin: { description: "Primary brand color for light mode. Hex format." },
    }),
    /** Dark mode primary color */
    primaryDark: text({
      label: "Primary (Dark)",
      defaultValue: "#F07040",
      admin: { description: "Primary brand color for dark mode. Hex format." },
    }),
    /** Dark mode page background */
    bgDark: text({
      label: "Background (Dark)",
      defaultValue: "#0A0A0A",
      admin: { description: "Page background for dark mode. Hex format." },
    }),
    /** Light mode page background */
    bgLight: text({
      label: "Background (Light)",
      defaultValue: "#F5F5F5",
      admin: { description: "Page background for light mode. Hex format." },
    }),
  },
})
```

### `apps/www/src/vexcms/collections/index.ts` (modify — Step 1: add new collections)

```ts
// BEFORE
export * from "./pages"
export * from "./posts"

// AFTER
export * from "./pages"
export * from "./posts"
export * from "./headers"
export * from "./footers"
export * from "./themes"
```

### `apps/www/src/vex.config.ts` (modify — Step 1: add new collections)

```ts
// BEFORE
  collections: [pages, posts],

// AFTER
  collections: [pages, posts, headers, footers, themes],
```

Also update the import:

```ts
// BEFORE
import { pages, posts } from "~/vexcms/collections"

// AFTER
import { pages, posts, headers, footers, themes } from "~/vexcms/collections"
```

### Edge-case notes

> **Edge: JSON fields as placeholders.** The `menuItems`, `actionButtons`, `links`, `socialLinks` fields on headers/footers are stored as `text` with JSON string default values. This is a deliberate trade-off: when `blocks` and `array` field types are implemented, these will migrate to proper typed fields. The seed script and frontend code must `JSON.parse()` these values at runtime. The admin panel will show raw JSON until a proper block editor UI is built.

### Run tests

```bash
pnpm --filter www typecheck
```

---

## Step 2: Update pages collection + remove posts [dev]

Add SEO fields to pages, remove the posts relationship, and delete the posts collection. Posts was test data with no role in the marketing site — pages are standalone content documents.

### Files to create / modify / delete

- [ ] `apps/www/src/vexcms/collections/pages.ts` — modify: add content, metaTitle, metaDescription, ogImage fields; add slug index; remove posts relationship
- [ ] `apps/www/src/vexcms/collections/posts.ts` — DELETE
- [ ] `apps/www/src/vexcms/collections/index.ts` — modify: remove posts export
- [ ] `apps/www/src/vex.config.ts` — modify: remove posts from collections array
- [ ] `apps/www/src/db/constants/index.ts` — modify: remove TABLE_SLUG_POSTS
- [ ] `apps/www/convex/test.ts` — modify: remove or update posts reference
- [ ] `apps/www/src/components/component-example.tsx` — modify: remove posts query

### `apps/www/src/vexcms/collections/pages.ts` (modify)

```ts
// BEFORE
import { defineCollection, relationship, text } from "@vexcms/core"
import { TABLE_SLUG_PAGES, TABLE_SLUG_POSTS } from "~/db/constants"

export const pages = defineCollection({
  slug: TABLE_SLUG_PAGES,
  interfaceName: "Page",
  labels: { singular: "Page", plural: "Pages" },
  admin: { useAsTitle: "title" },
  fields: {
    title: text({ required: true }),
    slug: text({ required: true }),
    posts: relationship({ collection: { slug: TABLE_SLUG_POSTS }, hasMany: true, label: "Posts" }),
  },
})

// AFTER
import { defineCollection, text, url } from "@vexcms/core"
import { TABLE_SLUG_PAGES } from "~/db/constants"

export const pages = defineCollection({
  slug: TABLE_SLUG_PAGES,
  interfaceName: "Page",
  labels: { singular: "Page", plural: "Pages" },
  admin: {
    useAsTitle: "title",
  },
  fields: {
    title: text({ required: true }),
    slug: text({
      required: true,
      index: "by_slug",
      admin: { description: "URL-friendly page path" },
    }),
    content: text({
      label: "Content",
      admin: {
        description: "Page body content. Blocks support coming soon.",
      },
    }),
    metaTitle: text({
      label: "Meta Title",
      admin: {
        description: "Custom <title> tag. Falls back to page title if empty.",
        position: "sidebar",
      },
    }),
    metaDescription: text({
      label: "Meta Description",
      admin: {
        description: "Custom meta description for search results.",
        position: "sidebar",
      },
    }),
    ogImage: url({
      label: "OG Image",
      admin: {
        description: "Open Graph image URL for social sharing.",
        position: "sidebar",
      },
    }),
  },
})
```

### `apps/www/src/vexcms/collections/posts.ts` — DELETE

Posts was test data with self-referential relationships and generic select options. It has no role in the marketing site. Pages are standalone content documents.

### `apps/www/src/vexcms/collections/index.ts` (modify)

```ts
// BEFORE
export * from "./pages"
export * from "./posts"

// AFTER
export * from "./pages"
```

### `apps/www/src/vex.config.ts` (modify)

```ts
// BEFORE
  collections: [pages, posts],

// AFTER
  collections: [pages, headers, footers, themes],
```

Also update the import to remove `posts`.

### `apps/www/src/db/constants/index.ts` (modify)

Remove `TABLE_SLUG_POSTS` and `COLLECTION_SLUG_MEDIA` constants (not used by any collection anymore).

### `apps/www/convex/test.ts` (modify)

Remove or update the `getAll` query that references `TABLE_SLUG_POSTS`.

### `apps/www/src/components/component-example.tsx` (modify)

Remove the posts query from `ComponentExample`. This component is a placeholder that will be replaced by the marketing site frontend (spec 33).

### Edge-case notes

> **Edge: slug index.** The `by_slug` index on pages.slug enables the future `[slug]` dynamic route to look up pages efficiently. Without this index, the frontend would need to scan all pages.
>
> **Edge: content as text.** The `content` field is a single text field, not a blocks array. This is a placeholder — when `blocks` is implemented, this field migrates to `blocks({ blocks: pageBlocks })`. The seed script will populate `content` with the marketing site page copy as plain text for now.
>
> **Edge: posts removal.** Deleting the posts collection requires removing all references: the collection export, the table slug constant, the vex.config.ts entry, the schema import, the convex/test.ts query, and the component-example.tsx query. The Convex schema will no longer have a `posts` table after regeneration. Existing data in the old deployment is not migrated.

### Run tests

```bash
pnpm --filter www typecheck
```

---

## Step 3: Seed mutation [agent]

Create the idempotent seed mutation that populates a fresh Convex deployment with design-accurate marketing site data. The seed data is sourced from the Stark × Ember design (`.pi/design/claude-design/www/`) and the marketing site block configs (spec 33).

### Files to create

- [ ] `apps/www/convex/seed.ts` — NEW

### `apps/www/convex/seed.ts` (NEW)

```ts
import { internalMutation } from "./_generated/server"

/**
 * Initialize the site with default data for the Vex CMS marketing site.
 *
 * Run from terminal:
 *   npx convex run seed:init
 *
 * Creates:
 * - Site settings (site_settings collection)
 * - Default header with marketing nav
 * - Default footer with marketing links
 * - Default theme (Stark × Ember)
 * - 4 pages: home, features, pricing, roadmap
 *
 * Safe to run multiple times — skips items that already exist.
 */
export const init = internalMutation({
  args: {},
  handler: async (ctx) => {
    const created: string[] = []
    const skipped: string[] = []

    // ── Helper: insert if no doc with matching field value exists ──
    async function insertIfMissing(
      table: string,
      indexName: string,
      indexField: string,
      lookupValue: string,
      data: Record<string, unknown>,
      label: string,
    ) {
      const existing = await ctx.db
        .query(table as any)
        .withIndex(indexName, (q: any) => q.eq(indexField, lookupValue))
        .first()
      if (existing) {
        skipped.push(label)
      } else {
        await ctx.db.insert(table as any, data as any)
        created.push(label)
      }
    }

    // ── Helper: insert if table is empty (no unique index) ──
    async function insertIfEmpty(
      table: string,
      data: Record<string, unknown>,
      label: string,
    ) {
      const first = await ctx.db.query(table as any).first()
      if (first) {
        skipped.push(label)
      } else {
        await ctx.db.insert(table as any, data as any)
        created.push(label)
      }
    }

    // ──────────────────────────────────────────────────────────────────
    // SITE SETTINGS
    // ──────────────────────────────────────────────────────────────────
    await insertIfEmpty("site_settings", {
      name: "Vex CMS",
    }, "site_settings")

    // ──────────────────────────────────────────────────────────────────
    // HEADER
    // ──────────────────────────────────────────────────────────────────
    await insertIfMissing(
      "headers",
      "by_name",
      "name",
      "Main Header",
      {
        name: "Main Header",
        logoText: "Vex CMS",
        logoHref: "/",
        menuItems: JSON.stringify([
          { label: "Features", href: "/features" },
          { label: "Pricing", href: "/pricing" },
          { label: "Roadmap", href: "/roadmap" },
          { label: "Docs", href: "/docs" },
        ]),
        actionButtons: JSON.stringify([
          { label: "GitHub", href: "https://github.com/vexcms/vex", variant: "ghost" },
          { label: "Get Started", href: "/docs", variant: "default" },
        ]),
      },
      "header",
    )

    // ──────────────────────────────────────────────────────────────────
    // FOOTER
    // ──────────────────────────────────────────────────────────────────
    await insertIfMissing(
      "footers",
      "by_name",
      "name",
      "Main Footer",
      {
        name: "Main Footer",
        logoText: "Vex CMS",
        copyright: "Vex CMS. All rights reserved.",
        links: JSON.stringify([
          { label: "Features", href: "/features" },
          { label: "Pricing", href: "/pricing" },
          { label: "Roadmap", href: "/roadmap" },
          { label: "Documentation", href: "/docs" },
          { label: "GitHub", href: "https://github.com/vexcms/vex" },
          { label: "npm", href: "https://www.npmjs.com/package/@vexcms/core" },
          { label: "Convex", href: "https://convex.dev" },
        ]),
        socialLinks: JSON.stringify([
          { platform: "GitHub", href: "https://github.com/vexcms/vex", icon: "Github" },
          { platform: "X", href: "https://x.com/vexcms", icon: "Twitter" },
        ]),
      },
      "footer",
    )

    // ──────────────────────────────────────────────────────────────────
    // THEME — Stark × Ember (from .pi/design/claude-design/www/globals.css)
    // ──────────────────────────────────────────────────────────────────
    await insertIfMissing(
      "themes",
      "by_name",
      "name",
      "Stark × Ember",
      {
        name: "Stark × Ember",
        fontFamily: "Geist, Inter, system-ui, sans-serif",
        radius: "0.25rem",
        primaryLight: "#E8622A",
        primaryDark: "#F07040",
        bgDark: "#0A0A0A",
        bgLight: "#F5F5F5",
      },
      "theme",
    )

    // ──────────────────────────────────────────────────────────────────
    // PAGES — marketing site content (from spec 33 + design canvases)
    // ──────────────────────────────────────────────────────────────────

    // HOME
    await insertIfMissing("pages", "by_slug", "slug", "home", {
      title: "Vex CMS — The CMS for Convex",
      slug: "home",
      content: [
        "Real-time content. Type-safe by default.",
        "",
        "Vex CMS gives you a full-featured content management system powered by Convex — real-time data, type-safe schemas, and a beautiful admin panel out of the box.",
        "",
        "--- FEATURES ---",
        "Real-Time by Default: Every query is live. Content updates appear instantly across all connected clients — no polling, no webhooks.",
        "Type-Safe Schemas: Define your collections with TypeScript. Vex generates Convex schemas, Zod validators, and typed queries automatically.",
        "Developer First: Code-first configuration, CLI tooling, and a clean API. Build with the tools you already know and love.",
        "",
        "--- HOW IT WORKS ---",
        "1. Scaffold your project — Run npx create-vexcms@latest to get a Next.js app with Convex, authentication, and the admin panel pre-configured.",
        "2. Define your schema — Use defineCollection() and field helpers to declare your content model in TypeScript. Vex generates your Convex schema, types, and queries automatically.",
        "3. Build with blocks — Compose pages from reusable content blocks. Each block is a React component with a typed config.",
        "4. Deploy and go live — Push to Convex and deploy your Next.js app. Real-time content updates flow to every connected client instantly.",
        "",
        "--- FAQ ---",
        "What is Vex CMS? A headless CMS built on Convex with real-time data, type-safe schemas, draft/publish workflows, live preview, and an admin panel.",
        "How is Vex different? Unlike traditional headless CMS platforms, Vex is powered by Convex's real-time database. Content updates are instant across all clients.",
        "Is Vex CMS free? Yes, open source and free. You only pay for Convex usage, which has a generous free tier.",
        "How do I get started? Run npx create-vexcms@latest to scaffold a new project in under a minute.",
      ].join("\n"),
      metaTitle: "Vex CMS — The CMS Built for Convex",
      metaDescription: "A headless content management system powered by Convex. Real-time data, type-safe schemas, and a beautiful admin panel out of the box.",
    }, "page:home")

    // FEATURES
    await insertIfMissing("pages", "by_slug", "slug", "features", {
      title: "Everything you need to manage content",
      slug: "features",
      content: [
        "Built on Convex's real-time infrastructure with a developer experience that doesn't compromise on power.",
        "",
        "--- CORE FEATURES ---",
        "16 Field Types: Text, number, select, date, relationship, upload, richtext, blocks, color, tabs, and more.",
        "Admin Panel: Full-featured admin UI with list views, edit forms, media library, and draft/publish workflow.",
        "Real-Time Queries: Every query is live via Convex. Content updates appear instantly across all connected clients.",
        "Live Preview: Side-by-side iframe preview with responsive breakpoints and real-time updates as you edit.",
        "Block System: Compose pages from reusable content blocks with drag-and-drop reordering and inline editing.",
        "Authentication & RBAC: Better Auth integration with role-based access control at the document and field level.",
        "Rich Text Editor: Plate.js-powered editor with media uploads, links, tables, and custom elements.",
        "CLI & Scaffolding: vex dev with watch/generate, and create-vexcms for instant project setup.",
        "Theme System: Database-driven themes with light/dark mode, CSS variables, and OKLCH color support.",
        "Block Styles: Per-block responsive styling with Tailwind presets — margin, padding, typography, layout, and more.",
        "",
        "--- DEVELOPER EXPERIENCE ---",
        "TypeScript-First: Every collection, field, and query is fully typed. Schema changes propagate to your IDE instantly.",
        "Code Generation: Vex generates Convex schemas, typed queries, and Zod validators from your collection definitions.",
        "Auto-Migration: Schema changes automatically create Convex indexes and tables — no manual migration scripts.",
        "",
        "--- CONTENT MANAGEMENT ---",
        "Draft/Publish: Save drafts and publish when ready. Full version history for every document.",
        "Versioning: Track every change with automatic version snapshots. Roll back to any previous state.",
        "RBAC: Control who can see and edit each collection, document, and field.",
        "Media Library: Upload, organize, and reference files with Convex storage.",
      ].join("\n"),
      metaTitle: "Features — Vex CMS",
      metaDescription: "16 field types, real-time queries, type-safe schemas, live preview, and a beautiful admin panel. Everything you need to manage content.",
    }, "page:features")

    // PRICING
    await insertIfMissing("pages", "by_slug", "slug", "pricing", {
      title: "Simple, transparent pricing",
      slug: "pricing",
      content: [
        "Vex CMS is open source and free. You only pay for Convex usage.",
        "",
        "--- OPEN SOURCE (FREE) ---",
        "MIT licensed. All core features included: admin panel, field types, CLI, real-time queries, draft/publish, authentication, RBAC, media library, live preview, and more.",
        "",
        "--- ENTERPRISE (COMING SOON) ---",
        "Environments: Project-level content branching with staging and production environments and atomic promotion.",
        "SSO: SAML/OIDC single sign-on with IdP group to role mapping.",
        "Workflows: Review and approval steps before content goes live. Configurable multi-step approval chains.",
        "Audit Log: Full audit log with retention, export, and compliance reports.",
        "Localization: i18n field variants with per-locale versioning and content translation workflows.",
        "",
        "--- FAQ ---",
        "Is it really free? Yes, Vex CMS is MIT licensed. You only pay for Convex hosting, which has a generous free tier.",
        "What about Convex costs? Convex's free tier handles most small projects. Paid plans start when you exceed free tier limits.",
        "What does enterprise include? Content environments, SSO, approval workflows, audit log, and localization.",
      ].join("\n"),
      metaTitle: "Pricing — Vex CMS",
      metaDescription: "Vex CMS is open source and free. Enterprise features coming soon.",
    }, "page:pricing")

    // ROADMAP
    await insertIfMissing("pages", "by_slug", "slug", "roadmap", {
      title: "Roadmap",
      slug: "roadmap",
      content: [
        "What we've shipped and what's coming next. Vex CMS is actively developed — here's where we're headed.",
        "",
        "--- SHIPPED ---",
        "16 Field Types | Text, number, select, date, relationship, upload, richtext, blocks, color, tabs, and more.",
        "Admin Panel | Full-featured admin UI with list views, edit forms, media library, and draft/publish workflow.",
        "Real-Time Queries | Every query is live via Convex. Content updates appear instantly across all connected clients.",
        "Live Preview | Side-by-side iframe preview with responsive breakpoints and real-time updates as you edit.",
        "Block System | Compose pages from reusable content blocks with drag-and-drop reordering and inline editing.",
        "Authentication & RBAC | Better Auth integration with role-based access control at the document and field level.",
        "Rich Text Editor | Plate.js-powered editor with media uploads, links, tables, and custom elements.",
        "CLI & Scaffolding | vex dev with watch/generate, and create-vexcms for instant project setup.",
        "Theme System | Database-driven themes with light/dark mode, CSS variables, and OKLCH color support.",
        "Block Styles | Per-block responsive styling with Tailwind presets.",
        "",
        "--- COMING SOON ---",
        "Content Scheduling | Set a publishAt timestamp and content goes live automatically.",
        "Team Management | Invite users, assign roles, and manage pending invitations.",
        "API Keys | Read-only API tokens for external integrations with configurable rate limiting.",
        "Audit Log | Track who changed what and when across all collections and documents.",
        "",
        "--- PLANNED ---",
        "Environments | Project-level content branching with staging and production environments.",
        "Localization | i18n field variants with per-locale versioning and content translation workflows.",
        "Approval Workflows | Review and sign-off steps before content goes live.",
        "Plugin System | Extend VEX with community plugins for custom fields, integrations, and admin panel features.",
      ].join("\n"),
      metaTitle: "Roadmap — Vex CMS",
      metaDescription: "What we've shipped and what's coming next. Vex CMS is actively developed.",
    }, "page:roadmap")

    return {
      created,
      skipped,
      message: `Initialized ${created.length} items. Skipped ${skipped.length} (already exist).`,
    }
  },
})
```

### `apps/www/convex/schema.ts` (modify — add index declarations)

The new collections need index declarations. The `vex.schema.ts` is auto-generated, but `schema.ts` imports it. We need to ensure `headers` and `footers` tables get `by_name` indexes, `pages` gets `by_slug` index, and `themes` gets `by_name` index.

These indexes will be auto-generated by `vex dev` when the collection configs declare `index: "by_slug"` / `index: "by_name"`. Verify after regeneration in Step 4.

### Edge-case notes

> **Edge: Idempotency.** The seed mutation is safe to run multiple times. It uses `insertIfMissing` (checks by index) or `insertIfEmpty` (checks if table has any docs). This means re-running after a partial failure is safe.
>
> **Edge: site_settings without dedicated collection.** Since `defineGlobal` isn't implemented, `site_settings` is registered as a regular collection. The seed creates a single document in it. When globals are implemented, this migrates to `defineGlobal`.

### Run tests

```bash
pnpm --filter www typecheck
```

---

## Step 4: Regenerate Convex schema + types [agent]

After the collection configs and seed script are in place, run `vex dev` to regenerate `vex.schema.ts` and `vex.types.ts`. Then update `schema.ts` to import the new table definitions.

### Files to modify

- [ ] `apps/www/convex/vex.schema.ts` — auto-generated (verify output)
- [ ] `apps/www/convex/schema.ts` — modify: import new tables
- [ ] `apps/www/src/vex.types.ts` — auto-generated (verify output)

### `apps/www/convex/schema.ts` (modify)

Add imports for the new table definitions:

```ts
// BEFORE
import { apikey, jwks, pages, session, verification } from "./vex.schema"

// AFTER
import { apikey, footers, headers, jwks, pages, session, themes, verification } from "./vex.schema"
```

Add the new tables to the `defineSchema` call (posts removed):

```ts
// BEFORE
export default defineSchema({
  session,
  verification,
  apikey,
  jwks,
  pages,
  posts,
  // Better Auth tables...
})

// AFTER
export default defineSchema({
  session,
  verification,
  apikey,
  jwks,
  headers,
  footers,
  themes,
  pages,
  // Better Auth tables...
})
```

### Verification

After running `vex dev`:

1. `vex.schema.ts` should contain `defineTable` exports for `headers`, `footers`, `themes`, `site_settings`
2. `headers` should have a `by_name` index
3. `footers` should have a `by_name` index
4. `pages` should have a `by_slug` index
5. `themes` should have a `by_name` index
6. `vex.types.ts` should contain interfaces for `Header`, `Footer`, `Theme`, and updated `Page` type
7. `CollectionSlug` union should include `"headers" | "footers" | "themes"`

### Run tests

```bash
pnpm --filter www typecheck
```

---

## Step 5: Restructure core test fixture [dev]

Restructure the core test fixture schema from posts/authors/organizations to pages/themes, matching the www app's collection shapes. Update all core API tests to reference the new fixture.

### Files to modify

- [ ] `packages/core/src/api/test/convex/schema.ts` — modify: replace fixture schema
- [ ] `packages/core/src/api/test/convex/_generated/api.ts` — modify: regenerate or update
- [ ] `packages/core/src/api/create/server.test.ts` — modify: use "pages" instead of "posts"
- [ ] `packages/core/src/api/find/server.test.ts` — modify: update fixture config + collection references
- [ ] `packages/core/src/api/get/server.test.ts` — modify: use new collection names
- [ ] `packages/core/src/api/populate.test.ts` — modify: update collection references
- [ ] `packages/core/src/api/remove/server.test.ts` — modify: update collection references
- [ ] `packages/core/src/api/search/server.test.ts` — modify: update collection references
- [ ] `packages/core/src/api/update/server.test.ts` — modify: update collection references
- [ ] `packages/core/src/api/depth.test.ts` — modify: update fixture config

### `packages/core/src/api/test/convex/schema.ts` (modify)

Replace the entire fixture schema. The new schema uses pages/themes to match www's collection shapes, with `pages.theme → themes` relationship to exercise depth/populate testing.

```ts
import {
  defineSchema,
  defineTable,
  type DataModelFromSchemaDefinition,
  type DocumentByName,
} from "convex/server"
import { v } from "convex/values"

/**
 * Fixture schema for `@vexcms/core` API tests. Mirrors the www app's
 * collection shapes (pages, themes) so core tests exercise the
 * same data model the marketing site uses.
 *
 * Relationship structure:
 * - pages.theme → themes (hasOne, for depth/populate tests)
 */
const schema = defineSchema({
  pages: defineTable({
    title: v.string(),
    slug: v.string(),
    content: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    ogImage: v.optional(v.string()),
    theme: v.optional(v.id("themes")),
  })
    .searchIndex("search_title", { searchField: "title" })
    .index("by_slug", ["slug"]),

  themes: defineTable({
    name: v.string(),
    fontFamily: v.optional(v.string()),
    radius: v.optional(v.string()),
    primaryLight: v.optional(v.string()),
    primaryDark: v.optional(v.string()),
  }),
})

export default schema

/**
 * Augment `GeneratedVexTypes` with fixture-specific document shapes.
 *
 * Same approach as before — `CollectionSlug` intentionally omitted so
 * arbitrary string slugs still type-check in other core tests.
 */
type FixtureDM = DataModelFromSchemaDefinition<typeof schema>

declare module "@vexcms/core" {
  interface GeneratedVexTypes {
    DocumentBySlug: {
      pages: DocumentByName<FixtureDM, "pages">
      themes: DocumentByName<FixtureDM, "themes">
    }
    CollectionsFieldTypeMap: {
      pages: {
        text: "title" | "slug" | "content" | "metaTitle" | "metaDescription" | "ogImage"
        relationship: "theme"
      }
      themes: {
        text: "name" | "fontFamily" | "radius" | "primaryLight" | "primaryDark"
      }
    }
  }
}
```

### Updating the test files

Each test file needs these mechanical changes:

1. Replace `collection: "posts"` with `collection: "pages"` (pages is now the primary fixture collection)
2. Replace `{ title: "Hello", slug: "hello" }` with `{ title: "Hello", slug: "hello" }` (same shape — no change needed for most)
3. Replace `authors` references with `themes` for populate/depth tests
4. Replace `organizations` references — no longer needed; depth-2 uses pages → themes
5. Update the `fixtureConfig` to use `pages.theme → themes`

### `packages/core/src/api/find/server.test.ts` — fixture config update

The `fixtureConfig` variable needs updating:

```ts
// BEFORE
const fixtureConfig: VexConfig = {
  collections: [
    {
      slug: "posts",
      fields: {
        title: { type: "text" },
        author: { type: "relationship", collection: { slug: "authors" } },
        parent: { type: "relationship", collection: { slug: "posts" } },
      },
      labels: { singular: "Post", plural: "Posts" },
      admin: { useAsTitle: "title" },
    },
    {
      slug: "authors",
      fields: {
        name: { type: "text" },
        organization: { type: "relationship", collection: { slug: "organizations" } },
      },
      labels: { singular: "Author", plural: "Authors" },
      admin: { useAsTitle: "name" },
    },
    {
      slug: "organizations",
      fields: { name: { type: "text" } },
      labels: { singular: "Organization", plural: "Organizations" },
      admin: { useAsTitle: "name" },
    },
  ],
} as unknown as VexConfig

// AFTER
const fixtureConfig: VexConfig = {
  collections: [
    {
      slug: "pages",
      fields: {
        title: { type: "text" },
        theme: { type: "relationship", collection: { slug: "themes" } },
      },
      labels: { singular: "Page", plural: "Pages" },
      admin: { useAsTitle: "title" },
    },
    {
      slug: "themes",
      fields: { name: { type: "text" } },
      labels: { singular: "Theme", plural: "Themes" },
      admin: { useAsTitle: "name" },
    },
  ],
} as unknown as VexConfig
```

### Test-by-test migration pattern

For each test file, the mechanical migration follows this pattern:

| `collection: "posts"` (primary CRUD) | `collection: "pages"` | pages is the primary fixture collection |
| `ctx.db.insert("posts", ...)` | `ctx.db.insert("pages", ...)` | same for query/get/patch/delete |
| `ctx.db.insert("authors", { name: "Lena" })` | `ctx.db.insert("themes", { name: "Stark × Ember" })` | themes replaces authors for populate tests |
| `{ title: "Hello", slug: "hello" }` | No change | same field shape |
| `{ title: "Post", slug: "s-0", featured: true }` | `{ title: "Page", slug: "s-0" }` | featured field removed (no checkbox in pages fixture) |
| `.withIndex("by_featured", ...)` | `.withIndex("by_slug", ...)` | slug index replaces featured index |
| `populate: { author: true }` | `populate: { theme: true }` | relationship field names change |
| `populate: { author: { populate: { organization: true } } }` | Not applicable — depth-2 test needs self-referential or multi-collection approach | no nested relationship in 2-table fixture |

### Edge-case notes

> **Edge: `search` tests.** The `searchIndex` name changes from `"search_title"` (stays the same) but the collection changes. All search test assertions must reference the new collection name.
>
> **Edge: depth 2 test.** Previously depth-2 went posts → authors → organizations. The new 2-table fixture (pages, themes) has only one relationship: `pages.theme → themes`. Depth-2 testing requires either: (a) adding a `pages.children` self-referential relationship to the fixture, or (b) restructuring the depth-2 test to exercise a single-level populate with `depth: 2` where depth 2 has no further relationships to resolve (graceful degradation). Option (b) is preferred — the depth feature should handle "no further relationships" gracefully without error.

### Run tests

```bash
pnpm --filter @vexcms/core test
```

---

## Step 6: Update www Convex tests [agent]

Update the existing `collections.test.ts` to cover all 4 collections (not just posts). Add tests for the new seed mutation behavior.

### Files to modify

- [ ] `apps/www/convex/vex/collections.test.ts` — modify: add tests for pages, headers, footers, themes

### `apps/www/convex/vex/collections.test.ts` (modify)

Add test suites for each new collection following the existing pattern (list, get, create, update, remove). The existing tests already cover the CRUD operations against the `posts` collection — add equivalent tests for `pages`, `headers`, `footers`, and `themes`.

For each new collection, add a `describe` block:

```ts
describe("vex.collections.list — pages", () => {
  test("returns empty array for an empty collection", async () => {
    const t = convexTest(schema, modules)
    const docs = await t.query(api.vex.collections.list, {
      collection: "pages",
    })
    expect(docs).toEqual([])
  })

  test("creates and retrieves a page", async () => {
    const t = convexTest(schema, modules)
    const id = await t.mutation(api.vex.collections.create, {
      collection: "pages",
      data: { title: "Home", slug: "home" },
    })
    const doc = await t.query(api.vex.collections.get, {
      collection: "pages",
      id,
    })
    expect(doc?.title).toBe("Home")
    expect(doc?.slug).toBe("home")
  })
})

describe("vex.collections.list — headers", () => {
  test("returns empty array for an empty collection", async () => {
    const t = convexTest(schema, modules)
    const docs = await t.query(api.vex.collections.list, {
      collection: "headers",
    })
    expect(docs).toEqual([])
  })

  test("creates and retrieves a header", async () => {
    const t = convexTest(schema, modules)
    const id = await t.mutation(api.vex.collections.create, {
      collection: "headers",
      data: { name: "Main Header", logoText: "Vex CMS" },
    })
    const doc = await t.query(api.vex.collections.get, {
      collection: "headers",
      id,
    })
    expect(doc?.name).toBe("Main Header")
  })
})

describe("vex.collections.list — footers", () => {
  test("returns empty array for an empty collection", async () => {
    const t = convexTest(schema, modules)
    const docs = await t.query(api.vex.collections.list, {
      collection: "footers",
    })
    expect(docs).toEqual([])
  })

  test("creates and retrieves a footer", async () => {
    const t = convexTest(schema, modules)
    const id = await t.mutation(api.vex.collections.create, {
      collection: "footers",
      data: { name: "Main Footer", logoText: "Vex CMS" },
    })
    const doc = await t.query(api.vex.collections.get, {
      collection: "footers",
      id,
    })
    expect(doc?.name).toBe("Main Footer")
  })
})

describe("vex.collections.list — themes", () => {
  test("returns empty array for an empty collection", async () => {
    const t = convexTest(schema, modules)
    const docs = await t.query(api.vex.collections.list, {
      collection: "themes",
    })
    expect(docs).toEqual([])
  })

  test("creates and retrieves a theme", async () => {
    const t = convexTest(schema, modules)
    const id = await t.mutation(api.vex.collections.create, {
      collection: "themes",
      data: { name: "Stark × Ember", fontFamily: "Geist" },
    })
    const doc = await t.query(api.vex.collections.get, {
      collection: "themes",
      id,
    })
    expect(doc?.name).toBe("Stark × Ember")
  })
})
```

Also add a test for the seed mutation:

```ts
describe("seed:init", () => {
  test("creates all seed data on first run", async () => {
    const t = convexTest(schema, modules)
    const result = await t.mutation(api.seed.init, {})
    expect(result.created).toContain("site_settings")
    expect(result.created).toContain("header")
    expect(result.created).toContain("footer")
    expect(result.created).toContain("theme")
    expect(result.created).toContain("page:home")
    expect(result.created).toContain("page:features")
    expect(result.created).toContain("page:pricing")
    expect(result.created).toContain("page:roadmap")
  })

  test("skips existing data on second run", async () => {
    const t = convexTest(schema, modules)
    await t.mutation(api.seed.init, {})
    const result = await t.mutation(api.seed.init, {})
    expect(result.created).toHaveLength(0)
    expect(result.skipped.length).toBeGreaterThan(0)
  })
})
```

### Edge-case notes

> **Edge: `@ts-nocheck`.** The test file has `@ts-nocheck` at the top due to Doc union type false positives. This remains — the new tests follow the same pattern.

### Run tests

```bash
pnpm --filter www typecheck
```

---

## Step 7: Env guide + final verification [agent]

Update the env example file with documentation for the new deployment. Run all workspace verification commands.

### Files to modify

- [ ] `apps/www/.env.example` — modify: add env var documentation

### `apps/www/.env.example` (modify)

Add comments documenting the Convex migration process:

```ts
# ── Convex Deployment ──
# To migrate to a new deployment:
# 1. Create a new Convex project at https://dashboard.convex.dev
# 2. Update NEXT_PUBLIC_CONVEX_URL and NEXT_PUBLIC_CONVEX_SITE_URL below
# 3. Update CONVEX_DEPLOYMENT to the new deployment name
# 4. Run: npx convex dev --once   (push schema to new deployment)
# 5. Run: npx convex run seed:init  (populate with marketing site data)
# 6. Run: npx convex run auth:createAdmin  (create first admin user)
```

### Verification (mandatory)

```bash
# 1. Typecheck across workspace
pnpm typecheck

# 2. All tests across workspace
pnpm test

# 3. Full build
pnpm build

# 4. Specific package verification
pnpm --filter @vexcms/core test
pnpm --filter www typecheck
```

### Success Criteria

1. **Compile-time:** `pnpm typecheck` passes with 0 errors across all workspace packages.
2. **Runtime:** `pnpm test` passes — all existing tests updated to use new fixture schema, all new www collection tests pass, seed mutation tests pass.
3. **Build:** `pnpm build` succeeds — all packages produce their dist output.
4. **Seed idempotency:** Running `npx convex run seed:init` twice produces `{ created: [], skipped: [...] }` on the second run.
5. **Schema parity:** Core test fixture tables (pages, themes) have the same field names and types as the www app's Convex schema — no structural drift.
6. **Collection coverage:** The www app's `vex.config.ts` includes all 4 collections (pages, headers, footers, themes).
7. **Design accuracy:** Seed data for theme (Stark × Ember), header nav, footer links, and page content matches the values in `.pi/design/claude-design/www/`.
8. **Posts removed:** The posts collection is deleted. No `posts` table exists in the Convex schema.

## References

- `.pi/design/claude-design/www/` — Stark × Ember marketing site design (source of truth for seed data)
- `.pi/design/claude-design/README.md` — Token translation table (Claude Design → shadcn)
- `.pi/agent-docs/specs/_legacy-specs/33-marketing-site/spec.md` — Marketing site spec (pages, blocks, nav)
- `.pi/agent-docs/specs/_legacy-specs/28-blocks-system/spec.md` — Blocks system (not yet implemented, deferred)
- `.pi/agent-docs/specs/_legacy-specs/30-site-builder/spec.md` — Site builder / defineSite (not yet implemented, deferred)
- `.pi/agent-docs/specs/_legacy-specs/41-seo-metadata/spec.md` — SEO metadata (partially addressed by page SEO fields)
- `.rebuild/reference/create-vexcms-templates/marketing-site/` — Reference implementation for marketing site collections
- `packages/core/src/api/test/convex/schema.ts` — Current core test fixture (being replaced)
