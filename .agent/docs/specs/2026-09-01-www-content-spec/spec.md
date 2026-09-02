---
status: draft
spec_id: 2026-09-01-www-content-spec
touches:
  - "packages/create-vexcms/templates/marketing-site/src/vexcms/blocks/**"
  - "packages/create-vexcms/templates/marketing-site/convex/seed.ts"
  - "apps/www/**"
  - ".agent/docs/specs/2026-09-01-www-content-spec/**"
prompt_version: 1
---

# 2026-09-01-www-content-spec — Sitemap, content spec, and component sourcing

## Overview

Phase 1 of building the real VexCMS marketing site. **No code changes.** This
document fixes the sitemap, the per-section content, the block inventory
(existing / amended / new), and the exact free component each section is built
from. Its companion, `design-agent-prompt.md`, is the standalone prompt handed
to the Claude design agent.

Build target is `/Users/zaye/Documents/Projects/vexcms-test-installs/test2` — a
standalone site scaffolded from the published CLI (`pnpm create vexcms`,
marketing template, alpha.6). Everything built there is ported back into
`packages/create-vexcms/templates/marketing-site/**` in Phase 4, so the site
ships twice: as the production marketing site **and** as the first-run
`create-vexcms` template. Nothing in this spec may encode a deployment- or
domain-specific detail that a freshly scaffolded project would not also want.

Supersedes the `### Site IA` and `### Home composition` sections of
`.agent/docs/specs/2026-08-30-launch-readiness/spec.md` (WP-3, lines 788–803).

## Design Decisions

1. **Three designed pages: `/`, `/features`, `/roadmap`.** `/changelog`,
   `/blog`, and `/vs-payload` from WP-3's IA are cut — see *Sitemap* for the
   per-page justification. Everything else in nav and footer is an external
   destination or the already-built `/admin` demo.

2. **No logo cloud.** Cut on developer instruction. "Built on Convex" is
   carried by the hero subheading and the first Features card, which is where a
   developer actually reads it. It also removes the only section that would
   have needed seeded binary media, keeping `pnpm seed` able to stand the whole
   site up from an empty deployment.

3. **No Radix UI anywhere.** The stack is Base UI. Every sourced component that
   imports `radix-ui` is reimplemented against Base UI primitives re-exported
   from `@vexcms/react`, or against plain elements. Concretely, Origin UI's
   `timeline.tsx` uses `radix-ui`'s `Slot.Root` for exactly one thing — an
   `asChild` escape hatch on `TimelineDate` and `TimelineTitle`. Drop `asChild`
   and render `<time>` / `<h3>` directly; if polymorphism is genuinely needed,
   use Base UI's `render` prop, not a Slot.

4. **Tailark's Quartz kit is off-limits.** Verified at
   `tailark.com/docs/quick-setup`: the free OSS registry (`@tailark-oss`, MIT,
   source at `github.com/tailark/blocks`) ships **Mist, Dusk, and Veil** only.
   Quartz requires a paid Essentials/Complete/Team plan and an API key. Every
   link in *Component sourcing* is therefore Mist, Dusk, or Veil.

5. **`Hero` gains `variant` and `installCommand` rather than spawning a
   `PageHero` block.** The interior pages need a compact header band, which is
   the same content with less vertical drama — a `select` is cheaper than a
   near-duplicate block that Phase 4 would have to port and document twice.

6. **`Roadmap.status` grows from 3 values to 4.** The block ships
   `shipped | coming-soon | planned`; the source of truth
   (`apps/docs/src/content/docs/roadmap.md`) has four buckets. The enum becomes
   `shipped | in-progress | planned | exploring`. This is a template-visible
   schema change that Phase 4 ports.

7. **`shiki` is an accepted new dependency** for the `CodeShowcase` and `Split`
   code panes. It tokenizes at render time in a server component, so the client
   ships zero highlighting JavaScript. Approved by the developer.

8. **Entrance animation reuses the existing CSS kit, not a new dependency.**
   `src/components/motion-primitives/{animated-group,text-effect}.tsx` +
   `reveal.module.css` already implement a staggered blur/fade/rise keyframe
   with a `prefers-reduced-motion: reduce` opt-out and zero package
   dependencies. No design may require `motion`/framer-motion.

## Verified state (inspected 2026-09-01, not assumed)

| Fact | Evidence |
| --- | --- |
| Tailark Quartz is paid; Mist/Dusk/Veil are the free kits | `tailark.com/docs/quick-setup` — "Free setup: Install Mist, Dusk, or Veil blocks from the public OSS registry" vs "Pro setup: Install gated Quartz content with an API key" |
| Tailark OSS blocks are MIT | `github.com/tailark/blocks/LICENCE.md` |
| Free kits have **no** `how-it-works`, `code-demo`, `bento`, `expandable-features`, or standalone `header` block | Enumerated all 179 `.tsx` under `registry/bases/base/{mist,dusk,veil}/blocks/**` |
| Only 13 free blocks depend on motion | All logo-clouds (`motion-primitives/infinite-slider`), `veil/hero-section/{two,four}/header`, `dusk/testimonials/two`, `veil/logo-cloud/two`. None are used by this spec |
| Origin UI is now `coss.com/origin`; repo root is AGPL-3.0 but `apps/origin/LICENSE.md` is MIT | Fetched both licence files from `github.com/cosscom/coss` |
| Origin UI `timeline.tsx` touches Radix once | `import { Slot } from "radix-ui"` → `const Comp = asChild ? Slot.Root : "time"` |
| Magic UI is MIT; `code-comparison` has no motion dependency | `magicuidesign/magicui/LICENSE.md`; `apps/www/registry/magicui/code-comparison.tsx` imports `react`, `@shikijs/transformers`, `lucide-react`, `next-themes` |
| HextaUI docs URLs 404 | `www.hextaui.com/docs` and `/docs/ui/components/*` both 404. **Not used.** |
| 8 publishable packages | `packages/*/package.json` with `private` unset: core, react, next, cli, better-auth, file-storage-convex, richtext-plate, create-vexcms |
| 12 field types | `text url number checkbox select date color upload relationship group array blocks` |
| Licence is Apache-2.0, not MIT | `LICENSE` line 2; `packages/core/package.json#license` |
| Docs site is `https://docs.vexcms.dev` | `apps/docs/astro.config.mjs#site`. **The domain does not resolve yet** (`ENOTFOUND` on 2026-09-01) — it is a pre-launch dependency, not a broken link |
| Theme = 32 camelCase tokens × light/dark + `radius` + `fontFamily` | `packages/core/src/fields/color/utils.ts` — `THEME_COLOR_TOKENS`, `THEME_SHARED_TOKENS` |
| Every lucide name in this spec is a canonical key of `icons` | Checked against the installed `lucide-react@0.577.0` (1703 keys) |

## Content-truth corrections

The blocks currently ship defaults that contradict reality. The seeded content
in Phase 3 must fix all of these; the design must not reintroduce them.

| Where | Current claim | Truth |
| --- | --- | --- |
| `FAQ/config.ts` item 1 | "draft/publish workflows, live preview" listed as shipped | Both are **In progress**. Never list them as shipped |
| `FAQ/config.ts` item 5 | "Vex CMS is open source and free" (README elsewhere says MIT) | Licence is **Apache-2.0** |
| `Header/config.ts` `menuItems` | includes `/pricing` | No pricing page exists and none is planned. Remove |
| `Footer/config.ts` `links` | includes `/pricing` | Same |
| `Footer/config.ts` `socialLinks` | `https://x.com/vexcms` | Unverified handle. Ship GitHub only until a real account exists |
| `Roadmap/config.ts` defaults | 12 hand-written items, 3 statuses | Replace with the 33 items and 4 buckets from `apps/docs/src/content/docs/roadmap.md` |
| `HowItWorks/config.ts` step 1 | `npx create-vexcms@latest` | `pnpm create vexcms@latest` |

---

## Sitemap

### Designed pages

| Path | Purpose |
| --- | --- |
| `/` | What it is, what's true about it, how to start |
| `/features` | The generated-from-one-schema argument, in depth |
| `/roadmap` | Shipped / In progress / Planned / Exploring, verbatim from the docs roadmap |

### Nav and footer destinations (not designed pages)

| Label | Href | Note |
| --- | --- | --- |
| Docs | `https://docs.vexcms.dev` | Astro Starlight, `apps/docs` |
| Quickstart | `https://docs.vexcms.dev/guides/quickstart/` | Footer only |
| Admin demo | `/admin` | Already built; read-only via `anonRole` |
| GitHub | `https://github.com/ianyimi/vex` | |
| npm | `https://www.npmjs.com/package/@vexcms/core` | |
| Issues | `https://github.com/ianyimi/vex/issues` | Serves as "contact" |
| Licence | `https://github.com/ianyimi/vex/blob/rebuild/LICENSE` | Apache-2.0; serves as "legal". **`master` has no `LICENSE` yet** — WP-1 added it on `rebuild` and WP-B has not promoted. Flip the seeded href to `/blob/master/LICENSE` once WP-B lands |

### Pages deliberately not built

| Page | Why not |
| --- | --- |
| `/changelog` | Needs a new `changelog` collection, a new block, and seed data — for one alpha release. GitHub Releases already publishes this |
| `/blog` | Zero posts exist. An empty blog reads worse than no blog |
| `/vs-payload` | A competitor teardown published by a pre-v0.1 project is a liability, and it ages badly with every Payload release. The honest differentiators live on `/features` |
| `/pricing` | Nothing is for sale. WP-3 already ruled enterprise pricing out of scope |
| `/privacy`, `/contact` | The site has no accounts, no forms, and no analytics — `siteSettings.googleAnalyticsId` stays unset. There is nothing to disclose that `LICENSE` does not already say. **If analytics is ever switched on this decision reverses** and a prose block plus a privacy page become required |

---

## Block inventory

### Existing, unchanged (4)

`Features` · `HowItWorks` · `FAQ` · `CTA` · `Footer` — configs at
`src/vexcms/blocks/<Name>/config.ts`. Content changes only (seed data).

### Existing, amended (3)

**`Hero`** — add two fields:

```ts
installCommand: text({
  label: "Install Command",
  description: "Optional. Renders a copy-to-clipboard command row under the CTAs.",
  defaultValue: "pnpm create vexcms@latest",
}),
variant: select({
  label: "Variant",
  options: [
    { label: "Full", value: "full" },
    { label: "Compact", value: "compact" },
  ],
  defaultValue: ["full"],
}),
```

`full` keeps today's `min-h-[90vh]` treatment. `compact` is a page-header band:
eyebrow + h1 + subheading, no install row, no `min-h`.

**`Roadmap`** — widen the `status` enum:

```ts
status: select({
  label: "Status",
  required: true,
  options: [
    { label: "Shipped", value: "shipped" },
    { label: "In progress", value: "in-progress" },
    { label: "Planned", value: "planned" },
    { label: "Exploring", value: "exploring" },
  ],
  defaultValue: ["shipped"],
}),
```

**`Header`** — remove `/pricing` from `menuItems` defaults.
**`Footer`** — remove `/pricing` from `links` defaults, drop the unverified `x.com` social entry.

### New (3)

All field shapes use only the 12 available types. `group()` not `object()`;
`select` `defaultValue` is always an array; `upload` stores an array of media ids.

**`Stats`** — `src/vexcms/blocks/Stats/`, slug `stats`, admin icon `Gauge`.

```ts
{
  heading:    text({ label: "Heading" }),
  subheading: text({ label: "Subheading" }),
  items: array({
    label: "Stats",
    required: true,
    items: group({
      fields: {
        value:       text({ label: "Value", required: true }),
        label:       text({ label: "Label", required: true }),
        description: text({ label: "Description" }),
      },
    }),
  }),
}
```

`value` is `text`, not `number`, so `"0"`, `"12"`, and `"~30s"` are all
expressible and render identically.

**`CodeShowcase`** — `src/vexcms/blocks/CodeShowcase/`, slug `code_showcase`, admin icon `FileCode`.

```ts
{
  heading:    text({ label: "Heading", required: true }),
  subheading: text({ label: "Subheading" }),
  panes: array({
    label: "Panes",
    required: true,
    items: group({
      fields: {
        label:    text({ label: "Pane Label", required: true }),
        filename: text({ label: "Filename" }),
        language: select({
          label: "Language",
          options: [
            { label: "TypeScript", value: "ts" },
            { label: "TSX", value: "tsx" },
            { label: "Shell", value: "bash" },
            { label: "JSON", value: "json" },
          ],
          defaultValue: ["ts"],
        }),
        code:    text({ label: "Code", required: true }),
        caption: text({ label: "Caption" }),
      },
    }),
  }),
}
```

Two panes render side by side; three or more render as a tab set using
`Tabs` from `@vexcms/react` (Base UI). `code` is a multiline `text` field —
newlines survive the round trip; there is no `richtext` and none is needed.

**`Split`** — `src/vexcms/blocks/Split/`, slug `split`, admin icon `Layers`.

```ts
{
  eyebrow: text({ label: "Eyebrow" }),
  heading: text({ label: "Heading", required: true }),
  body:    text({ label: "Body", required: true }),
  bullets: array({
    label: "Bullets",
    items: group({
      fields: {
        icon: text({ label: "Icon", description: "Lucide icon name" }),
        text: text({ label: "Text", required: true }),
      },
    }),
  }),
  media: select({
    label: "Media",
    options: [
      { label: "Code", value: "code" },
      { label: "Image", value: "image" },
      { label: "None", value: "none" },
    ],
    defaultValue: ["code"],
  }),
  code:         text({ label: "Code" }),
  codeFilename: text({ label: "Code Filename" }),
  codeLanguage: select({
    label: "Code Language",
    options: [
      { label: "TypeScript", value: "ts" },
      { label: "TSX", value: "tsx" },
      { label: "Shell", value: "bash" },
      { label: "JSON", value: "json" },
    ],
    defaultValue: ["ts"],
  }),
  image: upload({ label: "Image", to: TABLE_SLUG_IMAGES }),
  mediaPosition: select({
    label: "Media Position",
    options: [
      { label: "Right", value: "right" },
      { label: "Left", value: "left" },
    ],
    defaultValue: ["right"],
  }),
}
```

One instance per row; instances stack in the page's `blocks` array and alternate
`mediaPosition`. `media: "code"` is what the seed uses, so a fresh scaffold
needs no uploaded media to look finished.

### Registration

All three are appended to `pageBlocks` in `src/vexcms/blocks/config.ts` and get
`BLOCK_SLUG_*` constants in `src/vexcms/blocks/constants.ts`, matching the
existing colocated `<Name>/{config.ts,index.tsx}` layout.

---

## Page 1 — `/` Home

Header and Footer come from the `(site)` layout chrome, not the page's blocks array.

### 1. `Hero` — `variant: "full"`

| Field | Value |
| --- | --- |
| `badgeText` | `v0.1.0-alpha — now on npm` |
| `badgeLink` | `https://www.npmjs.com/package/@vexcms/core` |
| `heading` | `The CMS that thinks in types.` |
| `subheading` | `A headless CMS built natively on Convex. Declare your collections in TypeScript and Vex generates the Convex schema, the types, and the queries — no translation layer. Every edit reaches every subscriber in milliseconds.` |
| `installCommand` | `pnpm create vexcms@latest` |
| `primaryCtaLabel` / `primaryCtaHref` | `Read the docs` / `https://docs.vexcms.dev/guides/quickstart/` |
| `secondaryCtaLabel` / `secondaryCtaHref` | `View on GitHub` / `https://github.com/ianyimi/vex` |

The install row is a copy-to-clipboard control. `Hero` is already
`"use client"`, so no new client boundary is introduced.

### 2. `Stats`

`heading` empty — the numbers are the statement.

| `value` | `label` | `description` |
| --- | --- | --- |
| `12` | field types | text, url, number, checkbox, select, date, color, upload, relationship, group, array, blocks |
| `8` | published packages | core, react, next, cli, better-auth, file-storage-convex, richtext-plate, create-vexcms |
| `0` | database config | Convex is the database. There is no connection string |
| `1` | command to start | `pnpm create vexcms@latest` scaffolds Next.js, Convex, auth, and the admin panel |

No invented user counts, GitHub stars, or download numbers.

### 3. `Features` — 6 cards

| `icon` | `title` | `description` |
| --- | --- | --- |
| `Wand` | Convex-native codegen | `vex dev` writes your Convex schema, TypeScript interfaces, and Zod validators straight from `defineCollection()`. There is no hand-maintained `schema.ts` |
| `ShieldCheck` | End-to-end types | Fields, relationships, and query return types are checked from the database to the component. Rename a field and the compiler names every call site |
| `Radio` | Real-time admin panel | Every list view is a Convex subscription. Pagination, live `totalDocs`, and bulk operations update without a refetch |
| `Lock` | RBAC with indexed access | Document-level rules with `{ constraints }` that compile to `withIndex` ranges inside the query, plus per-call `access.action` / `access.bypass` and an `anonRole` fallback |
| `Boxes` | Globals and themes | `defineGlobal()` gives you singletons like site settings. Themes are a collection — 32 shadcn tokens × light and dark, stored as oklch and applied on first paint |
| `LayoutGrid` | Page-builder blocks | A `blocks` field composes typed content blocks into a discriminated union. Each block is a config plus a React renderer, colocated |

### 4. `CodeShowcase` — "Config in. Types out."

| Field | Value |
| --- | --- |
| `heading` | `Write the config. Get the types.` |
| `subheading` | `Two files from this site. The left one is hand-written; the right one is generated by `vex dev` and never edited.` |

Pane A — `label: "You write"`, `filename: "src/vexcms/blocks/Features/config.ts"`,
`language: "ts"`. Verbatim excerpt of the real `featuresBlock` definition
(`defineBlock` + `heading`/`subheading`/`features: array(group{...})`).

Pane B — `label: "Vex generates"`, `filename: "src/vex.types.ts"`,
`language: "ts"`. Verbatim excerpt of the generated `FeaturesBlock` type,
including the `⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️` banner and the
JSDoc that carries the field's `description` through to the generated type.

Using this site's own Features block makes the claim self-verifying rather than
illustrative.

### 5. `HowItWorks` — 4 steps

| `icon` | `title` | `description` |
| --- | --- | --- |
| `Terminal` | Scaffold your project | `pnpm create vexcms@latest` gives you a Next.js app with Convex, Better Auth, and the admin panel already wired |
| `Code` | Define your schema | Declare collections with `defineCollection()` and the field helpers. `vex dev` watches and regenerates your Convex schema, types, and validators |
| `LayoutGrid` | Build with blocks | Compose pages from typed content blocks. Each block is a config plus a renderer, edited from the admin panel |
| `Rocket` | Deploy and go live | Push to Convex, deploy the Next.js app. Content changes propagate to every subscriber with no cache invalidation |

### 6. `FAQ` — 6 items

`heading`: `Questions we keep getting.`
`supportLink`: `https://github.com/ianyimi/vex/issues`

1. **What is VexCMS?** — A headless CMS built on Convex. You define collections
   in TypeScript; Vex generates the Convex schema, the TypeScript types, and the
   queries, and gives you a real-time admin panel over them.
2. **How is this different from other headless CMS platforms?** — Most of them
   put a REST or GraphQL API in front of a database you configure separately.
   Vex has no API layer and no database configuration: Convex *is* the database,
   your schema is code, and every read is a live subscription.
3. **Do I need to know Convex?** — Some familiarity helps, but the CLI generates
   the schema, queries, and types from your collection definitions. You mostly
   write field declarations.
4. **Is it production ready?** — No. Everything ships as `0.1.0-alpha`.
   Versioning, drafts, and live preview are in progress. There are 12 field
   types today; `richtext`, `json`, `tabs`, and `ui` are planned, not built.
   See the roadmap.
5. **Which frameworks does it support?** — The data layer works with any Convex
   client. The admin panel is Next.js today, via `@vexcms/next` and
   `@vexcms/react`. A TanStack Start adapter is planned.
6. **What does it cost?** — Nothing. VexCMS is Apache-2.0 licensed. You pay for
   your Convex usage, which has a free tier.

### 7. `CTA`

| Field | Value |
| --- | --- |
| `heading` | `Start with a schema. Ship in an hour.` |
| `subheading` | `Scaffold a Next.js + Convex project with authentication, the admin panel, and this marketing site already seeded.` |
| `actions` | `Read the docs` → `https://docs.vexcms.dev/guides/quickstart/` · `View on GitHub` → `https://github.com/ianyimi/vex` |

---

## Page 2 — `/features`

### 1. `Hero` — `variant: "compact"`

`badgeText` empty. `heading`: `Everything comes from one schema.`
`subheading`: `Collections, the Convex tables behind them, the TypeScript types, the Zod validators, the admin forms, and the access rules are all derived from the same declaration.`
No install row. No secondary CTA.

### 2. `Features` — the same 6 cards as Home

Intentional repetition: `/features` is the page a visitor lands on from search,
so it must stand alone.

### 3. `Split` — "Twelve field types. One generator."

- `eyebrow`: `Fields`
- `body`: `Every field declares its Convex validator, its TypeScript type, and its admin input at once. Arrays hold groups, groups hold arrays, and a blocks field composes them into a discriminated union.`
- `bullets`: `Layers` — `array` and `group` nest arbitrarily · `Blocks` — `blocks` generates a typed union per collection · `Palette` — `color` stores oklch and feeds the theme system
- `media: "code"`, `mediaPosition: "right"`, `codeFilename: "src/vexcms/collections/pages.ts"` — a real excerpt showing `text`, `blocks`, and `upload` together
- Honesty note for the seed copy: name the 12 that exist. Do not imply `richtext` or `json`

### 4. `Split` — "Access rules that compile to indexes."

- `eyebrow`: `Access control`
- `body`: `A rule with { constraints } is not a filter applied after the fact. It is compiled into a withIndex range inside the Convex query, so an unauthorised document is never read.`
- `bullets`: `Lock` — document-level rules on every collection · `KeyRound` — per-call `access.action` and `access.bypass` overrides · `Globe` — an `anonRole` fallback, which is what makes the read-only `/admin` demo on this site possible
- `media: "code"`, `mediaPosition: "left"`, `codeFilename: "src/vex.config.ts"`

### 5. `Split` — "Globals, themes, and blocks are collections too."

- `eyebrow`: `Beyond content`
- `body`: `defineGlobal() gives you singletons — site settings, navigation — with the same field system and the same generated types. Themes go further: the palette itself is content.`
- `bullets`: `Boxes` — `defineGlobal()` singletons · `Palette` — 32 shadcn tokens × light and dark, stored as oklch strings · `Zap` — the active theme is applied server-side on first paint and updates live when edited
- `media: "code"`, `mediaPosition: "right"`, `codeFilename: "src/vexcms/globals/siteSettings.ts"`

### 6. `CodeShowcase` — "One rule. Two consumers."

Pane A: the access rule as authored in `vex.config.ts`.
Pane B: the generated query signature, showing the caller cannot bypass it by accident.

### 7. `CTA` — same as Home

---

## Page 3 — `/roadmap`

### 1. `Hero` — `variant: "compact"`

`heading`: `Shipped, in progress, and being explored.`
`subheading`: `VexCMS is under active development. Everything ships as 0.1.0-alpha until the core feature set is stable enough for a v0.1.0 release. This page is edited from the admin panel, not from a source file.`

### 2. `Roadmap`

`heading`: `Roadmap`. Subheading empty — the hero already said it.

Items are the 33 entries of `apps/docs/src/content/docs/roadmap.md`, mapped
one-to-one. **This file is the source of truth; if it and this spec ever
disagree, the docs file wins.**

**Shipped (15)** — 12 field types · Convex schema + type codegen · real-time
admin panel · DataTable with pagination, `totalDocs`, and bulk operations ·
media library · RBAC with document-level access, indexed `{ constraints }`
rules, and per-call `access.action` / `access.bypass` · access index resolution ·
`anonRole` fallback for unauthenticated callers · globals (`defineGlobal`) ·
database-driven theming · Better Auth integration · Convex file storage ·
TypeDoc API reference · CLI (`vex dev` / `vex generate`) · `create-vexcms`
scaffolder

**In progress (2)** — versioning & drafts · live preview

**Planned (14)** — form builder · field input consistency pass · `richtext`
field · `json` / `email` / `textarea` fields · `tabs` / `ui` fields · block
group categorization · lifecycle hooks · content scheduling · API keys · team
management · TanStack Start adapter · S3 / R2 storage adapters · plugin system ·
React package testing suite

**Exploring (2)** — multi-component workspaces · analytics adapter

Each item carries the one-line `description` already written in the roadmap
doc where one exists; otherwise the description stays empty rather than being
invented.

### 3. `CTA` — same as Home

---

## Site chrome

### `Header` block (collection `headers`, doc "Main Header")

- `logoText`: `VexCMS`
- `menuItems`: `Features` → `/features` · `Roadmap` → `/roadmap` · `Docs` → `https://docs.vexcms.dev` · `Admin demo` → `/admin`
- `actionButtons`: `GitHub` → `https://github.com/ianyimi/vex`, `variant: ["ghost"]` · `Get started` → `https://docs.vexcms.dev/guides/quickstart/`, `variant: ["default"]`

### `Footer` block (collection `footers`, doc "Main Footer")

- `logoText`: `VexCMS`
- `copyright`: `VexCMS. Apache-2.0 licensed.`
- `links`: `Features` → `/features` · `Roadmap` → `/roadmap` · `Docs` → `https://docs.vexcms.dev` · `Quickstart` → `https://docs.vexcms.dev/guides/quickstart/` · `Admin demo` → `/admin` · `npm` → `https://www.npmjs.com/package/@vexcms/core` · `Licence` → `https://github.com/ianyimi/vex/blob/rebuild/LICENSE` (→ `/blob/master/LICENSE` after WP-B) · `Convex` → `https://convex.dev`
- `socialLinks`: `GitHub` → `https://github.com/ianyimi/vex`, `icon: "Github"`

---

## Component sourcing

Every URL below was fetched and resolves. Every source is MIT. Tailark
previews are `tailark.com/blocks/<kit>/<category>#<variant>`, where `<kit>` is
one of the three free kits; the matching source file is linked so a dev agent
can read the markup without a browser.

| Section | Preview | Source | Licence | Notes |
| --- | --- | --- | --- | --- |
| Header | [mist hero-section #one](https://tailark.com/blocks/mist/hero-section#one) | [`mist/blocks/hero-section/one/header.tsx`](https://github.com/tailark/blocks/blob/main/registry/bases/base/mist/blocks/hero-section/one/header.tsx) | MIT | Client, 130L. No motion. Scroll-state sticky nav + mobile sheet. The existing `Header` renderer already implements this pattern — refine, don't replace |
| Hero (full) | [mist hero-section #five](https://tailark.com/blocks/mist/hero-section#five) | [`mist/blocks/hero-section/five.tsx`](https://github.com/tailark/blocks/blob/main/registry/bases/base/mist/blocks/hero-section/five.tsx) | MIT | Server, 96L. No motion. Strip its logo row (we have no logo cloud); add the install-command row in its place |
| Hero (compact) | — | — | — | Same component, `min-h` removed and install row omitted. No separate source |
| Install command row | — | `.agent/docs/design/claude-design/www/components.jsx:193–220` (`Install`) | in-repo | Mono command + copy button, already designed for this project |
| Stats | [mist stats #three](https://tailark.com/blocks/mist/stats#three) | [`mist/blocks/stats/three.tsx`](https://github.com/tailark/blocks/blob/main/registry/bases/base/mist/blocks/stats/three.tsx) | MIT | Server, 36L, `lucide-react` only. No motion |
| Features | [mist features #two](https://tailark.com/blocks/mist/features#two) | [`mist/blocks/features/two.tsx`](https://github.com/tailark/blocks/blob/main/registry/bases/base/mist/blocks/features/two.tsx) | MIT | Server, 55L, `Card` only. No motion. Compare with [veil features #one](https://tailark.com/blocks/veil/features#one) for a bordered-grid alternative |
| Split | [mist content #three](https://tailark.com/blocks/mist/content#three) | [`mist/blocks/content/three.tsx`](https://github.com/tailark/blocks/blob/main/registry/bases/base/mist/blocks/content/three.tsx) | MIT | Server, 38L. No motion. Also see [dusk content #one](https://tailark.com/blocks/dusk/content#one) for a bulleted variant |
| CodeShowcase | [Magic UI code-comparison](https://magicui.design/docs/components/code-comparison) | [`apps/www/registry/magicui/code-comparison.tsx`](https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/code-comparison.tsx) | MIT | 157L, **no motion**. Uses `@shikijs/transformers` + `next-themes`. Approved dependency. Replace `next-themes` with the project's own theme state; keep shiki server-side |
| HowItWorks | [Origin UI timeline](https://coss.com/origin/timeline) | [`apps/origin/registry/default/ui/timeline.tsx`](https://github.com/cosscom/coss/blob/main/apps/origin/registry/default/ui/timeline.tsx) | MIT ([`apps/origin/LICENSE.md`](https://github.com/cosscom/coss/blob/main/apps/origin/LICENSE.md)) | 210L, no motion. **Imports `radix-ui` for `Slot.Root` on one `asChild` prop — remove it.** Repo root is AGPL-3.0; only `apps/origin` is MIT, so cite the inner licence |
| Roadmap | [Origin UI timeline](https://coss.com/origin/timeline) + [shadcn Badge](https://ui.shadcn.com/docs/components/base/badge) + [shadcn Tabs](https://ui.shadcn.com/docs/components/base/tabs) | as above | MIT | Use `Tabs` and `Badge` re-exported from `@vexcms/react` (already Base UI), not a fresh install |
| FAQ | [veil faqs #two](https://tailark.com/blocks/veil/faqs#two) | [`veil/blocks/faqs/two.tsx`](https://github.com/tailark/blocks/blob/main/registry/bases/base/veil/blocks/faqs/two.tsx) | MIT | Client, 82L. Accordion. No motion. Swap its accordion import for `Accordion*` from `@vexcms/react` |
| CTA | [veil call-to-action #one](https://tailark.com/blocks/veil/call-to-action#one) | [`veil/blocks/call-to-action/one.tsx`](https://github.com/tailark/blocks/blob/main/registry/bases/base/veil/blocks/call-to-action/one.tsx) | MIT | Server, 34L. No motion |
| Footer | [mist footer #three](https://tailark.com/blocks/mist/footer#three) | [`mist/blocks/footer/three.tsx`](https://github.com/tailark/blocks/blob/main/registry/bases/base/mist/blocks/footer/three.tsx) | MIT | Server, 126L. No motion |

### Sources considered and rejected

- **Tailark Quartz** — every Quartz category (`code-demo`, `how-it-works`,
  `bento`, `expandable-features`, `comparator`, `description-list`) is paywalled.
  Do not link to it.
- **Tailark logo-cloud, in every kit** — all variants depend on
  `motion-primitives/infinite-slider` or `motion/react`. Moot: no logo cloud.
- **`veil/hero-section/{two,four}/header`, `dusk/testimonials/two`** — depend on
  `motion/react`.
- **HextaUI** — `www.hextaui.com/docs` returns 404. No stable component URL to
  cite.
- **`coss.com/ui`** (the new Base UI component library at the same domain) — the
  repository root is AGPL-3.0 and only `apps/origin` carries the MIT re-licence.
  Source only from `coss.com/origin`.

---

## Theme deliverable

The design agent returns one theme document loadable into the `themes`
collection with no transformation:

- `name: string`
- `fontFamily: string` — a CSS font stack applied to `--font-sans`
- `radius: string` — any CSS length, applied to `--radius`
- `light` and `dark` — one oklch string per key of `THEME_COLOR_TOKENS`
  (`packages/core/src/fields/color/utils.ts`), all 32, camelCase:
  `background foreground card cardForeground popover popoverForeground primary
  primaryForeground secondary secondaryForeground muted mutedForeground accent
  accentForeground destructive destructiveForeground border input ring chart1
  chart2 chart3 chart4 chart5 sidebar sidebarForeground sidebarPrimary
  sidebarPrimaryForeground sidebarAccent sidebarAccentForeground sidebarBorder
  sidebarRing`

The starting point is **Stark × Ember**, the palette already seeded and already
in `globals.css` (`primary: oklch(60.5% 0.175 42)` light,
`oklch(72% 0.175 50)` dark, `radius: 4px`, Geist). The agent may refine it but
must justify any move, and must keep the 32-token set complete — a partial
palette breaks contrast, which is exactly why D8 was amended during WP-C.

---

## Downstream

- **Phase 2** — dev agents implement the designs in `test2`: 3 new blocks,
  2 amended block configs, 3 pages, refined renderers for the 5 existing blocks.
- **Phase 3** — every page, block value, header/footer nav entry, theme palette,
  and `siteSettings` value is captured in the single idempotent
  `convex/seed.ts` `init` mutation, so `pnpm seed` stands the whole site up from
  an empty deployment and reports everything skipped on a second run.
- **Phase 4** — port blocks, seed, and theme to
  `packages/create-vexcms/templates/marketing-site`, then verify by scaffolding
  a fresh project from the template and running `pnpm seed`.

Every design decision in this spec is therefore expressible as seeded block
field data. If a section cannot be described by its block's fields, the block's
field shape is wrong — not the seed.
