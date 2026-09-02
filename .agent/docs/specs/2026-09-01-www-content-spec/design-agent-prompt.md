# Design brief — VexCMS marketing site

You are designing the complete marketing site for **VexCMS**, an open-source
headless CMS built on Convex. This prompt is self-contained: everything you need
is below. Read all of it before designing anything.

Your output is a design specification precise enough that a developer agent can
build every page in Tailwind v4 + Base UI with **zero design guesswork**, plus a
theme document that loads directly into the CMS's own `themes` collection.

---

## 1. What VexCMS is

A headless CMS where you declare collections in TypeScript and the framework
generates the Convex database schema, the TypeScript types, the Zod validators,
and the admin forms from that one declaration. Convex is a reactive database, so
every read in the admin panel is a live subscription — content changes propagate
to subscribers with no webhooks, no revalidation, no build step.

It is at `0.1.0-alpha`. The audience is developers, specifically developers who
already know Payload, Sanity, or Strapi and are evaluating whether a
Convex-native alternative is credible. They will read the code samples before
they read the headlines.

Tone: precise, unhyped, technically literal. The single most persuasive thing on
this site is a config file next to the types it generated. Nothing on the site
may claim a capability that does not exist — see §7.

---

## 2. Hard constraints

These are not preferences. A design that violates one cannot be built.

### 2.1 Content is CMS data, not JSX

Every page is assembled from **blocks**. A block is a field-schema plus a React
renderer. All page content is stored in the database as block field values and
restored by a single idempotent seed script. There is no per-page bespoke JSX.

**Consequence:** if a section's design needs a piece of content, that content
must be expressible as a field on that block. A design that requires a
one-off hand-authored layout for one page is not buildable. Every section you
design must work when its text is arbitrary-length editor input.

### 2.2 Twelve field types exist. That is the entire vocabulary.

`text` · `url` · `number` · `checkbox` · `select` · `date` · `color` ·
`upload` · `relationship` · `group` · `array` · `blocks`

**Cut and unavailable:** `richtext`, `json`, `ui()`, `tabs()`, and per-instance
custom admin field components. There is **no versioning and no drafts**.

Rules that bite:
- Long prose is a multiline `text` field. There is no rich text, so no inline
  bold/links/lists inside a body paragraph. If a design needs a bulleted list,
  it must be an `array` of `group`, not markup inside a string.
- `group()`, never `object()`.
- A `select`'s `defaultValue` is always an array: `defaultValue: ["full"]`.
- An `upload` stores an array of media ids.
- Icons are **lucide** names stored as `text`, and must be canonical PascalCase
  keys of lucide-react's `icons` export — `Sparkles`, `CircleQuestionMark`,
  `ShieldCheck`, `LayoutGrid`. `Code2` and `Wand2` do **not** exist; `Code` and
  `Wand` do. Verify any icon you name.

### 2.3 No animation library

`motion` / framer-motion was deliberately removed and must not come back. All
animation is CSS keyframes + Tailwind v4, and must be disabled under
`@media (prefers-reduced-motion: reduce)`.

The project already ships a CSS-only entrance kit you should reuse rather than
reinvent — a staggered blur + fade + rise:

```css
@keyframes reveal {
  from { opacity: 0; filter: blur(12px); transform: translateY(12px); }
  to   { opacity: 1; filter: blur(0);    transform: translateY(0); }
}
.item {
  animation: reveal 1.1s cubic-bezier(0.25, 1, 0.5, 1) both;
  animation-delay: var(--reveal-delay, 0s);
}
@media (prefers-reduced-motion: reduce) { .item { animation: none; } }
```

Exposed as `<AnimatedGroup delay stagger>`, `<AnimatedItem delay>`, and
`<TextEffect as per delay stagger>` (splits per word or per line).
`tw-animate-css@1.4.0` is also available.

If you source a component that depends on framer-motion, you must say so
explicitly and describe the CSS reimplementation.

### 2.4 No Radix UI

The stack is **Base UI**. Any sourced component importing `radix-ui` must be
converted. In practice this is `asChild` / `Slot.Root`: drop the polymorphism
and render the concrete element, or use Base UI's `render` prop. Never
introduce `radix-ui` as a dependency.

### 2.5 Stack

Next.js 16 (App Router, Turbopack, React Server Components by default) ·
React 19 · Tailwind v4 with CSS-first `@theme` tokens · Base UI 1.2 ·
Convex · `lucide-react` 0.577 · `tw-animate-css` 1.4.

Prefer server components. Only mark a section client if it needs state —
accordion, copy-to-clipboard, mobile menu, tabs.

Available UI primitives, re-exported from `@vexcms/react` (all Base UI or
shadcn-pattern — use these, do not install new ones):

`Accordion` `AccordionItem` `AccordionTrigger` `AccordionContent` · `Button`
`buttonVariants` · `Badge` · `Card` `CardHeader` `CardTitle` `CardDescription`
`CardContent` `CardFooter` `CardAction` · `Tabs` `TabsList` `TabsTrigger`
`TabsContent` · `Dialog*` · `DropdownMenu*` · `Popover*` · `Select*` · `Sheet` ·
`Separator` · `ScrollArea` · `Skeleton` · `Table*` · `Tooltip*` · `Input` ·
`Label` · `Checkbox` · `Icon` · `VexLink` · `VexImage` · `cn`

`Button` variants: `default | secondary | destructive | outline | ghost | link`.
Sizes: `xs | sm | default | lg | icon | icon-xs | icon-sm | icon-lg`.

### 2.6 The design ships twice

This site is both the production marketing site **and** the default template a
developer gets from `pnpm create vexcms`. So:
- No hardcoded deployment or domain specifics inside blocks.
- A freshly scaffolded project must look finished with **no uploaded media**.
  Do not design a section that is broken without a photograph. Code panes,
  type, and colour only.

### 2.7 Theming

Colour is not hardcoded. There are 32 shadcn design tokens × light and dark,
stored in the database as oklch strings and applied as CSS custom properties
server-side on first paint, then live-updated when edited in the admin panel.

Design **only** against semantic tokens — `bg-background`, `text-foreground`,
`bg-card`, `text-muted-foreground`, `border-border`, `bg-primary`,
`text-primary-foreground`, `bg-accent`, `text-accent-foreground`, `ring-ring`.
Never a literal hex or a Tailwind palette colour like `bg-zinc-50` in a place
where the theme should decide. A theme swap must not break any section.

Radius comes from `--radius` (theme-controlled); the scale is
`--radius-sm 2px`, `--radius-md 4px`, `--radius-lg 8px`, `--radius-xl 12px`,
`--radius-2xl 16px`, `--radius-3xl 20px`, `--radius-4xl 9999px`.
Easing token: `--ease-emphasized: cubic-bezier(0.2, 0.8, 0.2, 1)`.

---

## 3. Sitemap

Three designed pages. Everything else is an external destination.

| Path | Purpose |
| --- | --- |
| `/` | What it is, what's true about it, how to start |
| `/features` | The generated-from-one-schema argument, in depth |
| `/roadmap` | Shipped / In progress / Planned / Exploring |

Destinations referenced from nav and footer:
`https://docs.vexcms.dev` · `https://docs.vexcms.dev/guides/quickstart/` ·
`/admin` (a real, read-only, live admin panel on this site) ·
`https://github.com/ianyimi/vex` ·
`https://www.npmjs.com/package/@vexcms/core` ·
`https://github.com/ianyimi/vex/issues` ·
`https://github.com/ianyimi/vex/blob/rebuild/LICENSE`

There is no pricing page, no blog, no changelog, no testimonials, and no
comparison page. Do not design one. There are no customer logos, no star
counts, and no download numbers — do not design a slot for them.

---

## 4. Blocks

Header and Footer are site chrome from the layout, not page blocks.

### Existing, do not change the field shape — refine the visual design

| Block | Fields |
| --- | --- |
| `Features` | `heading` · `subheading?` · `features: array(group{ title, description, icon? })` |
| `HowItWorks` | `heading` · `subheading?` · `steps: array(group{ icon?, title, description })` |
| `FAQ` | `heading` · `subheading?` · `supportLink?` · `items: array(group{ question, answer })` |
| `CTA` | `heading` · `subheading?` · `actions: array(group{ label, href })` |
| `Header` | `logoText?` · `logoImage?` · `logoHref?` · `menuItems: array(group{ label, href })` · `actionButtons: array(group{ label, href, variant })` |
| `Footer` | `logoText?` · `logoImage?` · `copyright?` · `links: array(group{ label, href })` · `socialLinks: array(group{ platform, href, icon? })` |

### Existing, gaining fields

**`Hero`** — today: `badgeText?` `badgeLink?` `heading` `subheading?`
`primaryCtaLabel` `primaryCtaHref` `secondaryCtaLabel?` `secondaryCtaHref?`.
Adding:
- `installCommand?: text` — renders a monospace copy-to-clipboard command row
  beneath the CTAs when present.
- `variant: select["full" | "compact"]` — `full` is the landing hero
  (currently `min-h-[90vh]`, centred, decorative radial gradients). `compact` is
  an interior page-header band: eyebrow + h1 + subheading, no install row, no
  `min-h`. **Design both.**

**`Roadmap`** — `heading` · `subheading?` ·
`items: array(group{ feature, description?, status })` where `status` is now a
four-value select: `shipped | in-progress | planned | exploring`. Design all
four states, and the grouping treatment.

### New — design these from scratch

**`Stats`** — `heading?` · `subheading?` ·
`items: array(group{ value, label, description? })`.
`value` is a string, so `"12"`, `"0"`, and `"~30s"` must all sit correctly.
Four items on the home page.

**`CodeShowcase`** — `heading` · `subheading?` ·
`panes: array(group{ label, filename?, language, code, caption? })`.
Two panes render side by side; three or more render as a tab set. `code` is
multiline plain text, syntax-highlighted at render time by **shiki** in a server
component (approved dependency — the client ships no highlighting JS). Design
the pane chrome: label, filename, language affordance, and how a long line
behaves. **This is the most important section on the site**; the config-to-
generated-types pairing is the product argument.

**`Split`** — `eyebrow?` · `heading` · `body` ·
`bullets: array(group{ icon?, text })` · `media: select["code"|"image"|"none"]` ·
`code?` · `codeFilename?` · `codeLanguage` · `image?` ·
`mediaPosition: select["right"|"left"]`.
One row per instance; instances stack and alternate side. Design the `code`
variant properly — that is the one the seed uses and therefore the one every
scaffolded project sees. Design `image` and `none` as graceful fallbacks.

---

## 5. Page compositions and copy

Copy below is the intent, near-final. You may tighten wording; you may not
change a factual claim. Every string ends up as a seeded field value.

### `/` Home

**1. `Hero`, `variant: "full"`**
- badge `v0.1.0-alpha — now on npm` → `https://www.npmjs.com/package/@vexcms/core`
- h1 `The CMS that thinks in types.`
- sub `A headless CMS built natively on Convex. Declare your collections in TypeScript and Vex generates the Convex schema, the types, and the queries — no translation layer. Every edit reaches every subscriber in milliseconds.`
- install `pnpm create vexcms@latest`
- primary CTA `Read the docs` → `https://docs.vexcms.dev/guides/quickstart/`
- secondary CTA `View on GitHub` → `https://github.com/ianyimi/vex`

**2. `Stats`** — no heading; the numbers are the statement.

| value | label | description |
| --- | --- | --- |
| `12` | field types | text, url, number, checkbox, select, date, color, upload, relationship, group, array, blocks |
| `8` | published packages | core, react, next, cli, better-auth, file-storage-convex, richtext-plate, create-vexcms |
| `0` | database config | Convex is the database. There is no connection string |
| `1` | command to start | `pnpm create vexcms@latest` scaffolds Next.js, Convex, auth, and the admin panel |

**3. `Features`** — 6 cards

| icon | title | description |
| --- | --- | --- |
| `Wand` | Convex-native codegen | `vex dev` writes your Convex schema, TypeScript interfaces, and Zod validators straight from `defineCollection()`. There is no hand-maintained `schema.ts` |
| `ShieldCheck` | End-to-end types | Fields, relationships, and query return types are checked from the database to the component. Rename a field and the compiler names every call site |
| `Radio` | Real-time admin panel | Every list view is a Convex subscription. Pagination, live `totalDocs`, and bulk operations update without a refetch |
| `Lock` | RBAC with indexed access | Document-level rules with `{ constraints }` that compile to `withIndex` ranges inside the query, plus per-call overrides and an anonymous-role fallback |
| `Boxes` | Globals and themes | `defineGlobal()` gives you singletons like site settings. Themes are a collection — 32 shadcn tokens × light and dark, stored as oklch and applied on first paint |
| `LayoutGrid` | Page-builder blocks | A `blocks` field composes typed content blocks into a discriminated union. Each block is a config plus a React renderer, colocated |

**4. `CodeShowcase`** — heading `Write the config. Get the types.`
sub `Two files from this site. The left one is hand-written; the right one is generated by vex dev and never edited.`
Pane A `You write` / `src/vexcms/blocks/Features/config.ts` / `ts`.
Pane B `Vex generates` / `src/vex.types.ts` / `ts` — including its
`⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️` banner.
Real excerpts, shown here so you can size the panes:

```ts
// Pane A
export const featuresBlock = defineBlock({
  slug: BLOCK_SLUG_FEATURES,
  label: "Features",
  fields: {
    heading: text({ label: "Heading", required: true }),
    subheading: text({ label: "Subheading" }),
    features: array({
      label: "Features",
      required: true,
      items: group({
        fields: {
          title: text({ label: "Title", required: true }),
          description: text({ label: "Description", required: true }),
          icon: text({ label: "Icon", description: "Lucide icon name" }),
        },
      }),
    }),
  },
  admin: { icon: "LayoutGrid" },
})
```

```ts
// Pane B
export type FeaturesBlock = {
  blockType: "features"
  blockName?: string
  id: string
  heading: string
  subheading?: string
  features: {
    title: string
    description: string
    /**
     * Lucide icon name
     */
    icon?: string
  }[]
}
```

**5. `HowItWorks`** — 4 steps

| icon | title | description |
| --- | --- | --- |
| `Terminal` | Scaffold your project | `pnpm create vexcms@latest` gives you a Next.js app with Convex, Better Auth, and the admin panel already wired |
| `Code` | Define your schema | Declare collections with `defineCollection()` and the field helpers. `vex dev` watches and regenerates your Convex schema, types, and validators |
| `LayoutGrid` | Build with blocks | Compose pages from typed content blocks. Each block is a config plus a renderer, edited from the admin panel |
| `Rocket` | Deploy and go live | Push to Convex, deploy the Next.js app. Content changes propagate to every subscriber with no cache invalidation |

**6. `FAQ`** — heading `Questions we keep getting.`,
support link `https://github.com/ianyimi/vex/issues`. Six items:
What is VexCMS? · How is this different from other headless CMS platforms? ·
Do I need to know Convex? · Is it production ready? (answer: no — alpha;
versioning, drafts, and live preview are in progress) · Which frameworks does it
support? (Next.js admin today; TanStack Start planned) · What does it cost?
(nothing; Apache-2.0; you pay for Convex usage).

**7. `CTA`** — `Start with a schema. Ship in an hour.` /
`Scaffold a Next.js + Convex project with authentication, the admin panel, and this marketing site already seeded.` /
actions `Read the docs`, `View on GitHub`.

### `/features`

1. `Hero` `variant: "compact"` — h1 `Everything comes from one schema.`
   sub `Collections, the Convex tables behind them, the TypeScript types, the Zod validators, the admin forms, and the access rules are all derived from the same declaration.`
2. `Features` — the same 6 cards. The page must stand alone for search traffic.
3. `Split` — eyebrow `Fields`, heading `Twelve field types. One generator.`,
   code pane right. Bullets: `Layers` array and group nest arbitrarily ·
   `Blocks` a blocks field generates a typed union · `Palette` color stores
   oklch and feeds the theme system.
4. `Split` — eyebrow `Access control`, heading
   `Access rules that compile to indexes.`, code pane **left**. Bullets:
   `Lock` document-level rules · `KeyRound` per-call overrides · `Globe` an
   anonymous-role fallback, which is what makes the read-only `/admin` demo on
   this site possible.
5. `Split` — eyebrow `Beyond content`, heading
   `Globals, themes, and blocks are collections too.`, code pane right.
   Bullets: `Boxes` singletons · `Palette` 32 tokens × light and dark ·
   `Zap` applied server-side on first paint, live-updated when edited.
6. `CodeShowcase` — `One rule. Two consumers.` Access rule as authored, next to
   the generated query signature.
7. `CTA` — same as Home.

### `/roadmap`

1. `Hero` `variant: "compact"` — h1 `Shipped, in progress, and being explored.`
   sub `VexCMS is under active development. Everything ships as 0.1.0-alpha until the core feature set is stable enough for a v0.1.0 release. This page is edited from the admin panel, not from a source file.`
2. `Roadmap` — 33 items across four buckets. Counts you must design for:
   **Shipped 15** · **In progress 2** · **Planned 14** · **Exploring 2**.
   Shipped is long and mostly skimmed; In progress is short and is the most
   interesting bucket on the page. Design the density difference deliberately.
   Some items have a one-line description and some have none — the layout must
   not look broken either way.
3. `CTA` — same as Home.

### Chrome

**Header** — logo `VexCMS`; menu `Features` `/features`, `Roadmap` `/roadmap`,
`Docs` `https://docs.vexcms.dev`, `Admin demo` `/admin`; actions
`GitHub` (ghost) and `Get started` (default).
Sticky, with a scroll-state treatment, and a mobile menu.

**Footer** — logo `VexCMS`; copyright `VexCMS. Apache-2.0 licensed.`;
links Features · Roadmap · Docs · Quickstart · Admin demo · npm · Licence ·
Convex; social: GitHub only (`icon: "Github"`).

---

## 6. Component sources

Start from these. All are free and MIT; all links resolve. Tailark's **Quartz**
kit is paywalled — do not use or link to it. Only **Mist**, **Dusk**, and
**Veil** are free.

| Section | Preview | Source file | Notes |
| --- | --- | --- | --- |
| Header | https://tailark.com/blocks/mist/hero-section#one | `github.com/tailark/blocks` → `registry/bases/base/mist/blocks/hero-section/one/header.tsx` | client, 130L, no motion |
| Hero (full) | https://tailark.com/blocks/mist/hero-section#five | `registry/bases/base/mist/blocks/hero-section/five.tsx` | server, 96L, no motion. Drop its logo row |
| Stats | https://tailark.com/blocks/mist/stats#three | `registry/bases/base/mist/blocks/stats/three.tsx` | server, 36L, no motion |
| Features | https://tailark.com/blocks/mist/features#two | `registry/bases/base/mist/blocks/features/two.tsx` | server, 55L, no motion. Alt: https://tailark.com/blocks/veil/features#one |
| Split | https://tailark.com/blocks/mist/content#three | `registry/bases/base/mist/blocks/content/three.tsx` | server, 38L, no motion. Alt: https://tailark.com/blocks/dusk/content#one |
| CodeShowcase | https://magicui.design/docs/components/code-comparison | `github.com/magicuidesign/magicui` → `apps/www/registry/magicui/code-comparison.tsx` | 157L, **no motion**, uses shiki. Replace its `next-themes` dependency with the project's theme state |
| HowItWorks | https://coss.com/origin/timeline | `github.com/cosscom/coss` → `apps/origin/registry/default/ui/timeline.tsx` | 210L, no motion. **Imports `radix-ui` for one `Slot.Root` — remove it** |
| Roadmap | https://coss.com/origin/timeline + https://ui.shadcn.com/docs/components/base/badge + https://ui.shadcn.com/docs/components/base/tabs | as above | use `Badge` and `Tabs` from `@vexcms/react` |
| FAQ | https://tailark.com/blocks/veil/faqs#two | `registry/bases/base/veil/blocks/faqs/two.tsx` | client, 82L, no motion. Use `Accordion*` from `@vexcms/react` |
| CTA | https://tailark.com/blocks/veil/call-to-action#one | `registry/bases/base/veil/blocks/call-to-action/one.tsx` | server, 34L, no motion |
| Footer | https://tailark.com/blocks/mist/footer#three | `registry/bases/base/mist/blocks/footer/three.tsx` | server, 126L, no motion |

Licences: Tailark OSS MIT (`tailark/blocks/LICENCE.md`) · Magic UI MIT ·
shadcn/ui MIT · Origin UI MIT **via `apps/origin/LICENSE.md` only** — the
`cosscom/coss` repository root is AGPL-3.0, so take nothing from `coss.com/ui`,
only from `coss.com/origin`.

You are not obliged to follow these closely. They are a floor, chosen for
licence safety and zero motion dependencies. If you can do better within the
constraints, do better — but name what you changed and why.

---

## 7. Content truth

Never claim an unshipped feature. The current block defaults contain claims that
are false; do not carry them forward.

**Shipped (may be claimed):** 12 field types · Convex schema and type codegen ·
real-time admin panel · DataTable with pagination, live `totalDocs`, bulk
operations · media library · RBAC with document-level access, indexed
`{ constraints }` rules, per-call `access.action` / `access.bypass` · access
index resolution · `anonRole` fallback · globals (`defineGlobal`) ·
database-driven theming · Better Auth integration · Convex file storage ·
TypeDoc API reference · CLI (`vex dev` / `vex generate`) · `create-vexcms`.

**In progress (must be labelled as such):** versioning & drafts · live preview.

**Planned (must be labelled as such):** form builder · field input consistency
pass · `richtext` field · `json` / `email` / `textarea` fields · `tabs` / `ui`
fields · block group categorization · lifecycle hooks · content scheduling ·
API keys · team management · TanStack Start adapter · S3 / R2 storage adapters ·
plugin system · React package testing suite.

**Exploring:** multi-component workspaces · analytics adapter.

Specifically forbidden: describing drafts, versioning, live preview, or rich
text as available; saying "MIT" (the licence is **Apache-2.0**); any user count,
star count, download figure, testimonial, or customer logo.

---

## 8. Theme

The current palette is **Stark × Ember**: near-neutral surfaces with a warm
ember-orange accent, sharp 4px radii, Geist. It is deliberately Convex-adjacent
in warmth without copying Convex's orange, and it avoids the pure-monochrome
territory Payload and Vercel already own.

Current values, as the starting point:

- `radius: "4px"`, `fontFamily: "Geist, Inter, system-ui, sans-serif"`
- light: `background oklch(96.1% 0 0)`, `foreground oklch(13.7% 0 0)`,
  `card oklch(100% 0 0)`, `primary oklch(60.5% 0.175 42)`,
  `accent oklch(96% 0.025 42)`, `border oklch(85% 0 0)`
- dark: `background oklch(13.7% 0 0)`, `foreground oklch(95% 0 0)`,
  `card oklch(17.4% 0 0)`, `primary oklch(72% 0.175 50)`,
  `accent oklch(72% 0.175 50 / 0.12)`, `border oklch(25% 0 0)`

Refine it if you can justify the move. Keep the token set **complete** — a
partial palette moves `--background` without `--foreground` and destroys
contrast.

---

## 9. What to return

A single design specification containing all of the following. Be exhaustive;
this document is the only thing a developer agent will have.

**A. Every page, every section, in order.** For each section:
- Which block renders it and which variant.
- Layout at three breakpoints: mobile (`<640`), tablet (`768–1024`), desktop
  (`≥1280`). Give the container max-width, the grid or flex structure, the
  column counts, and the gaps.
- Vertical rhythm: exact section padding at each breakpoint.
- Typography per element: size, weight, line-height, letter-spacing, and
  measure. Use Tailwind v4 classes where a class exists; state a raw value
  where it does not.
- Which semantic colour token every surface, text, and border uses. Never a hex,
  never a palette colour like `zinc-50`.
- Border, radius token, and shadow per surface.
- Interactive states: hover, focus-visible, active, disabled.
- Any entrance animation, expressed as CSS keyframes + delays, with its
  reduced-motion behaviour.
- Empty and overflow behaviour: what the section looks like when an optional
  field is blank, when an array has 1 item and when it has 12, and when a
  heading runs to three lines.

**B. Every block's design in isolation**, so it can be dropped onto a page it
was not designed for. That is what the block system is for and what the
`create-vexcms` template requires.

**C. The theme document**, ready to load into the `themes` collection with no
transformation:

```json
{
  "name": "<theme name>",
  "fontFamily": "<CSS font stack>",
  "radius": "<CSS length>",
  "light": { "<32 tokens>": "oklch(...)" },
  "dark":  { "<32 tokens>": "oklch(...)" }
}
```

All 32 keys must be present in **both** `light` and `dark`, spelled exactly:

```
background foreground card cardForeground popover popoverForeground
primary primaryForeground secondary secondaryForeground muted mutedForeground
accent accentForeground destructive destructiveForeground border input ring
chart1 chart2 chart3 chart4 chart5
sidebar sidebarForeground sidebarPrimary sidebarPrimaryForeground
sidebarAccent sidebarAccentForeground sidebarBorder sidebarRing
```

Values are oklch strings, e.g. `"oklch(60.5% 0.175 42)"`. Alpha is allowed:
`"oklch(72% 0.175 50 / 0.12)"`. Include a short rationale for any token you
moved from the current values, and state the contrast ratio for every
foreground/background pair you changed.

**D. Any additional stylistic tokens** beyond the 32 — shadow scale, easing,
spacing rhythm, code-pane token colours for shiki — with the exact values and
where they belong (`@theme` in `globals.css`, since these are not per-theme).

**E. A build order** — which sections a developer agent should implement first
so the site is coherent at every intermediate step.

**F. A list of every place you deviated** from this brief's suggested component
sources or copy, with the reason.

Do not return code beyond CSS snippets and the theme JSON. Return design
specification.
