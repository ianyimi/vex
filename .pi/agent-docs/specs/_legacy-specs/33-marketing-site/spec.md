# 33 — VEX CMS Marketing Site

## Overview

Build out the full marketing site for VEX CMS in `apps/www`. This spec adds 2 new block types (HowItWorks, Roadmap), updates the Header block with new navigation, and defines the content/page structure for 4 CMS-managed pages: Home, Features, Pricing, and Roadmap. All pages are managed via the admin panel using the existing dynamic `[slug]` routing — no new Next.js routes needed.

## Design Decisions

- **All pages are CMS-managed.** Every page (home, features, pricing, roadmap) is a document in the `pages` collection with a matching slug. The existing `[slug]/page.tsx` route handles all sub-pages. This maximizes dogfooding of VEX.
- **Admin-seeded content.** Pages are created through the admin panel. Block `defaultValue` fields provide production-ready starting content so new blocks populate with real marketing copy.
- **Show all as shipped.** Everything that works today is presented as a shipped feature. No "rebuilding" messaging. Enterprise features (environments, SSO, workflows) appear in "Coming Soon" on the Roadmap page only.
- **Stay at 0.0.x versioning.** No version bump — the marketing site just presents what exists. Bump to 0.1.0 when APIs stabilize after rebuild.
- **Vertical timeline for HowItWorks.** Steps stacked vertically with a connecting line, step numbers, icons, titles, and descriptions.
- **Select-based status badges for Roadmap.** Status is a `select` field with `shipped`, `coming-soon`, `planned` options rendering as colored badges.

## Out of Scope

- Documentation site (`apps/docs`) — separate spec
- Demo site (`apps/demo`) — separate spec
- Comparison pages (`/compare/*`) — future, requires competitive claims maintenance
- Newsletter/email signup — requires backend integration
- Blog — future spec
- Case studies / testimonials — no real users yet, add later
- Logo bar / social proof — no real logos yet, add when there are users/partners
- New Next.js routes — all pages use existing `[slug]` dynamic route

## Target Directory Structure

```
apps/www/src/vexcms/blocks/
├── Hero/                      # existing
│   ├── config.ts
│   └── index.tsx
├── Features/                  # existing
│   ├── config.ts
│   └── index.tsx
├── CTA/                       # existing
│   ├── config.ts
│   └── index.tsx
├── FAQ/                       # existing
│   ├── config.ts
│   └── index.tsx
├── Header/                    # existing — update nav defaults
│   ├── config.ts
│   └── index.tsx
├── Footer/                    # existing — update link defaults
│   ├── config.ts
│   └── index.tsx
├── HowItWorks/                # NEW
│   ├── config.ts
│   └── index.tsx
├── Roadmap/                   # NEW
│   ├── config.ts
│   └── index.tsx
├── constants.ts               # add new slugs
├── config.ts                  # add new blocks to pageBlocks
└── index.ts                   # add new block components
```

## Implementation Order

1. **Step 1: Add block slugs and wire up exports** — After this step, the new block types are registered (with placeholder components) and the app builds.
2. **Step 2: HowItWorks block config + component** — After this step, the HowItWorks block can be added to pages and renders a vertical timeline.
3. **Step 3: Roadmap block config + component** — After this step, the Roadmap block can be added to pages and renders a feature grid with status badges.
4. **Step 4: Update Header and Footer defaults** — After this step, the nav links and footer reflect the full sitemap.
5. **Step 5: Define page content for all 4 pages** — Reference guide for seeding pages via the admin panel. No code changes.

---

## Step 1: Add block slugs and wire up exports

- [ ] Update `constants.ts` with new block slugs
- [ ] Update `config.ts` to add new blocks to `pageBlocks`
- [ ] Update `index.ts` to register new block components
- [ ] Create placeholder `HowItWorks/config.ts` and `HowItWorks/index.tsx`
- [ ] Create placeholder `Roadmap/config.ts` and `Roadmap/index.tsx`
- [ ] Verify app builds

### File: `apps/www/src/vexcms/blocks/constants.ts`

Update the constants file with new block slugs.

```typescript
// Block slugs
export const BLOCK_SLUG_HERO = "hero" as const;
export const BLOCK_SLUG_FEATURES = "features" as const;
export const BLOCK_SLUG_CTA = "cta" as const;
export const BLOCK_SLUG_FAQ = "faq" as const;
export const BLOCK_SLUG_HEADER = "header" as const;
export const BLOCK_SLUG_FOOTER = "footer" as const;
export const BLOCK_SLUG_HOW_IT_WORKS = "how_it_works" as const;
export const BLOCK_SLUG_ROADMAP = "roadmap" as const;
```

### File: `apps/www/src/vexcms/blocks/config.ts`

Add new block configs to the `pageBlocks` array.

```typescript
// Block configs only — no React/motion dependencies
// Safe to import from collections and server-side code
import { heroBlock } from "./Hero/config";
import { featuresBlock } from "./Features/config";
import { ctaBlock } from "./CTA/config";
import { faqBlock } from "./FAQ/config";
import { headerBlock } from "./Header/config";
import { footerBlock } from "./Footer/config";
import { howItWorksBlock } from "./HowItWorks/config";
import { roadmapBlock } from "./Roadmap/config";

/** Page content block definitions */
export const pageBlocks = [
  heroBlock,
  featuresBlock,
  howItWorksBlock,
  roadmapBlock,
  ctaBlock,
  faqBlock,
];

/** Header block definitions */
export const headerBlocks = [headerBlock];

/** Footer block definitions */
export const footerBlocks = [footerBlock];

/** All block definitions combined */
export const allBlocks = [...pageBlocks, ...headerBlocks, ...footerBlocks];

export {
  heroBlock,
  featuresBlock,
  ctaBlock,
  faqBlock,
  headerBlock,
  footerBlock,
  howItWorksBlock,
  roadmapBlock,
};
```

### File: `apps/www/src/vexcms/blocks/index.ts`

Register new block components in the component map.

```typescript
import type { BlockComponentProps } from "@vexcms/ui";
import type { ComponentType } from "react";

import {
  BLOCK_SLUG_CTA,
  BLOCK_SLUG_FAQ,
  BLOCK_SLUG_FEATURES,
  BLOCK_SLUG_FOOTER,
  BLOCK_SLUG_HEADER,
  BLOCK_SLUG_HERO,
  BLOCK_SLUG_HOW_IT_WORKS,
  BLOCK_SLUG_ROADMAP,
} from "./constants";
import CTABlock from "./CTA";
import FAQBlock from "./FAQ";
import FeaturesBlock from "./Features";
import FooterBlock from "./Footer";
import HeaderBlock from "./Header";
import HeroBlock from "./Hero";
import HowItWorksBlock from "./HowItWorks";
import RoadmapBlock from "./Roadmap";

/** Block component map for use with RenderBlocks */
export const blockComponents: Record<
  string,
  ComponentType<BlockComponentProps>
> = {
  [BLOCK_SLUG_CTA]: CTABlock,
  [BLOCK_SLUG_FAQ]: FAQBlock,
  [BLOCK_SLUG_FEATURES]: FeaturesBlock,
  [BLOCK_SLUG_FOOTER]: FooterBlock,
  [BLOCK_SLUG_HEADER]: HeaderBlock,
  [BLOCK_SLUG_HERO]: HeroBlock,
  [BLOCK_SLUG_HOW_IT_WORKS]: HowItWorksBlock,
  [BLOCK_SLUG_ROADMAP]: RoadmapBlock,
};

// Re-export configs for convenience in client code
export { allBlocks, footerBlocks, headerBlocks, pageBlocks } from "./config";
```

### File: `apps/www/src/vexcms/blocks/HowItWorks/config.ts`

Minimal config to get the build working. Will be replaced in Step 2.

```typescript
import { array, defineBlock, object, text } from "@vexcms/core";

import { BLOCK_SLUG_HOW_IT_WORKS } from "../constants";

export const howItWorksBlock = defineBlock({
  slug: BLOCK_SLUG_HOW_IT_WORKS,
  label: "How It Works",
  fields: {
    heading: text({
      label: "Heading",
      required: true,
      defaultValue: "How It Works",
    }),
    steps: array({
      label: "Steps",
      required: true,
      items: object({
        fields: {
          title: text({ label: "Title", required: true }),
          description: text({ label: "Description", required: true }),
        },
      }),
      defaultValue: [{ title: "Step 1", description: "Placeholder" }],
    }),
  },
  admin: { icon: "list-ordered" },
});
```

### File: `apps/www/src/vexcms/blocks/HowItWorks/index.tsx`

Placeholder component. Will be replaced in Step 2.

```tsx
import type { BlockComponentProps } from "@vexcms/ui";

export { howItWorksBlock } from "./config";

export default function HowItWorksBlock({ block }: BlockComponentProps) {
  return (
    <section className="py-16">
      <p>HowItWorks placeholder</p>
    </section>
  );
}
```

### File: `apps/www/src/vexcms/blocks/Roadmap/config.ts`

Minimal config. Will be replaced in Step 3.

```typescript
import { array, defineBlock, object, select, text } from "@vexcms/core";

import { BLOCK_SLUG_ROADMAP } from "../constants";

export const roadmapBlock = defineBlock({
  slug: BLOCK_SLUG_ROADMAP,
  label: "Roadmap",
  fields: {
    heading: text({
      label: "Heading",
      required: true,
      defaultValue: "Roadmap",
    }),
    items: array({
      label: "Items",
      required: true,
      items: object({
        fields: {
          feature: text({ label: "Feature", required: true }),
          status: select({
            label: "Status",
            options: [
              { label: "Shipped", value: "shipped" },
              { label: "Coming Soon", value: "coming-soon" },
              { label: "Planned", value: "planned" },
            ],
            defaultValue: "shipped",
          }),
        },
      }),
      defaultValue: [{ feature: "Placeholder", status: "shipped" }],
    }),
  },
  admin: { icon: "map" },
});
```

### File: `apps/www/src/vexcms/blocks/Roadmap/index.tsx`

Placeholder component. Will be replaced in Step 3.

```tsx
import type { BlockComponentProps } from "@vexcms/ui";

export { roadmapBlock } from "./config";

export default function RoadmapBlock({ block }: BlockComponentProps) {
  return (
    <section className="py-16">
      <p>Roadmap placeholder</p>
    </section>
  );
}
```

---

## Step 2: HowItWorks block config + component

- [ ] Replace `HowItWorks/config.ts` with full config including default marketing content
- [ ] Replace `HowItWorks/index.tsx` with vertical timeline component
- [ ] Verify block renders in admin and frontend

### File: `apps/www/src/vexcms/blocks/HowItWorks/config.ts`

Defines the HowItWorks block with 4 steps showing the VEX developer workflow. Each step has a number (auto-derived from array index in the component), icon, title, and description.

```typescript
import { array, defineBlock, object, text } from "@vexcms/core";

import { BLOCK_SLUG_HOW_IT_WORKS } from "../constants";

export const howItWorksBlock = defineBlock({
  slug: BLOCK_SLUG_HOW_IT_WORKS,
  label: "How It Works",
  fields: {
    heading: text({
      label: "Heading",
      required: true,
      defaultValue: "Get started in minutes",
    }),
    subheading: text({
      label: "Subheading",
      defaultValue:
        "From zero to a fully functional CMS in four steps. No boilerplate, no config files to wrestle with.",
    }),
    steps: array({
      label: "Steps",
      required: true,
      items: object({
        fields: {
          icon: text({
            label: "Icon",
            admin: {
              description:
                "Lucide icon name (e.g. Terminal, Code, Layout, Rocket)",
            },
          }),
          title: text({ label: "Title", required: true }),
          description: text({ label: "Description", required: true }),
        },
      }),
      defaultValue: [
        {
          icon: "Terminal",
          title: "Scaffold your project",
          description:
            "Run npx create-vexcms@latest to get a Next.js app with Convex, authentication, and the admin panel pre-configured.",
        },
        {
          icon: "Code",
          title: "Define your schema",
          description:
            "Use defineCollection() and field helpers to declare your content model in TypeScript. Vex generates your Convex schema, types, and queries automatically.",
        },
        {
          icon: "Layout",
          title: "Build with blocks",
          description:
            "Compose pages from reusable content blocks. Each block is a React component with a typed config — drag, drop, and edit inline from the admin panel.",
        },
        {
          icon: "Rocket",
          title: "Deploy and go live",
          description:
            "Push to Convex and deploy your Next.js app. Real-time content updates flow to every connected client instantly — no cache invalidation needed.",
        },
      ],
    }),
  },
  admin: {
    icon: "list-ordered",
    blockStyles: ["container", "text"],
  },
});
```

### File: `apps/www/src/vexcms/blocks/HowItWorks/index.tsx`

Vertical timeline component. Each step is a row with a step number circle on the left, a vertical connecting line, and the step content on the right. The line connects step circles to create a visual timeline.

```tsx
"use client";

import type { BlockComponentProps } from "@vexcms/ui";

import { icons } from "lucide-react";

import { cn } from "~/lib/utils";

export { howItWorksBlock } from "./config";

function LucideIcon({ name }: { name: string }) {
  const Icon = icons[name as keyof typeof icons];
  if (!Icon) return null;
  return <Icon className="size-5" />;
}

export default function HowItWorksBlock({
  block,
  blockStyles,
}: BlockComponentProps) {
  const { heading, subheading, steps } = block as unknown as {
    heading: string;
    subheading?: string;
    steps?: Array<{ icon?: string; title: string; description: string }>;
  };

  return (
    <section className={cn("py-16 md:py-32", blockStyles)}>
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <h2 className="text-4xl font-semibold text-balance lg:text-5xl">
            {heading}
          </h2>
          {subheading && (
            <p className="text-muted-foreground mt-4 text-balance">
              {subheading}
            </p>
          )}
        </div>

        <div className="mt-16 space-y-0">
          {(steps ?? []).map((step, index) => {
            // TODO: implement
            //
            // 1. Render a flex row for each step:
            //    a. Left column: step number circle (1-indexed) with the icon inside
            //       → Use a 10x10 (size-10) rounded-full div with bg-primary text-primary-foreground
            //       → If icon is provided, render LucideIcon inside. Otherwise render the step number.
            //    b. Vertical connecting line between steps:
            //       → A 0.5px wide (w-px) div with bg-border, centered under the circle
            //       → Hidden on the last step
            //    c. Right column: title (font-semibold text-lg) and description (text-muted-foreground mt-1)
            //       → Add pb-10 to the right column for spacing, except on the last step
            //
            // 2. Layout structure:
            //    → Outer div: flex flex-row gap-6
            //    → Left div: flex flex-col items-center (contains circle + line)
            //    → Right div: flex-1 (contains title + description)
            //
            // Edge cases:
            // - Single step: no connecting line needed
            // - No icon: fall back to showing the step number (index + 1)
            // - Empty steps array: handled by the (steps ?? []) guard
            throw new Error("Not implemented");
          })}
        </div>
      </div>
    </section>
  );
}
```

---

## Step 3: Roadmap block config + component

- [ ] Replace `Roadmap/config.ts` with full config including default content from project roadmap
- [ ] Replace `Roadmap/index.tsx` with feature grid + status badges
- [ ] Verify block renders in admin and frontend

### File: `apps/www/src/vexcms/blocks/Roadmap/config.ts`

Defines the Roadmap block with a grid of features and their status. Status is a select field with three options that render as colored badges. Features are grouped visually by the component but stored as a flat array.

```typescript
import { array, defineBlock, object, select, text } from "@vexcms/core";

import { BLOCK_SLUG_ROADMAP } from "../constants";

export const roadmapBlock = defineBlock({
  slug: BLOCK_SLUG_ROADMAP,
  label: "Roadmap",
  fields: {
    heading: text({
      label: "Heading",
      required: true,
      defaultValue: "Roadmap",
    }),
    subheading: text({
      label: "Subheading",
      defaultValue:
        "What we've shipped and what's coming next. Vex CMS is actively developed — here's where we're headed.",
    }),
    items: array({
      label: "Roadmap Items",
      required: true,
      items: object({
        fields: {
          feature: text({ label: "Feature Name", required: true }),
          description: text({ label: "Description" }),
          status: select({
            label: "Status",
            required: true,
            options: [
              { label: "Shipped", value: "shipped" },
              { label: "Coming Soon", value: "coming-soon" },
              { label: "Planned", value: "planned" },
            ],
            defaultValue: "shipped",
          }),
        },
      }),
      defaultValue: [
        {
          feature: "16 Field Types",
          description:
            "Text, number, select, date, relationship, upload, richtext, blocks, color, tabs, and more.",
          status: "shipped",
        },
        {
          feature: "Admin Panel",
          description:
            "Full-featured admin UI with list views, edit forms, media library, and draft/publish workflow.",
          status: "shipped",
        },
        {
          feature: "Real-Time Queries",
          description:
            "Every query is live via Convex. Content updates appear instantly across all connected clients.",
          status: "shipped",
        },
        {
          feature: "Live Preview",
          description:
            "Side-by-side iframe preview with responsive breakpoints and real-time updates as you edit.",
          status: "shipped",
        },
        {
          feature: "Block System",
          description:
            "Compose pages from reusable content blocks with drag-and-drop reordering and inline editing.",
          status: "shipped",
        },
        {
          feature: "Authentication & RBAC",
          description:
            "Better Auth integration with role-based access control at the document and field level.",
          status: "shipped",
        },
        {
          feature: "Rich Text Editor",
          description:
            "Plate.js-powered editor with media uploads, links, tables, and custom elements.",
          status: "shipped",
        },
        {
          feature: "CLI & Scaffolding",
          description:
            "vex dev with watch/generate, and create-vexcms for instant project setup.",
          status: "shipped",
        },
        {
          feature: "Theme System",
          description:
            "Database-driven themes with light/dark mode, CSS variables, and OKLCH color support.",
          status: "shipped",
        },
        {
          feature: "Block Styles",
          description:
            "Per-block responsive styling with Tailwind presets — margin, padding, typography, layout, and more.",
          status: "shipped",
        },
        {
          feature: "Content Scheduling",
          description:
            "Set a publishAt timestamp and content goes live automatically via Convex scheduled functions.",
          status: "coming-soon",
        },
        {
          feature: "Team Management",
          description:
            "Invite users, assign roles, and manage pending invitations from the admin panel.",
          status: "coming-soon",
        },
        {
          feature: "API Keys",
          description:
            "Read-only API tokens for external integrations with configurable rate limiting.",
          status: "coming-soon",
        },
        {
          feature: "Audit Log",
          description:
            "Track who changed what and when across all collections and documents.",
          status: "coming-soon",
        },
        {
          feature: "Environments",
          description:
            "Project-level content branching with staging and production environments and atomic promotion.",
          status: "planned",
        },
        {
          feature: "Localization",
          description:
            "i18n field variants with per-locale versioning and content translation workflows.",
          status: "planned",
        },
        {
          feature: "Approval Workflows",
          description:
            "Review and sign-off steps before content goes live. Configurable multi-step approval chains.",
          status: "planned",
        },
        {
          feature: "Plugin System",
          description:
            "Extend VEX with community plugins for custom fields, integrations, and admin panel features.",
          status: "planned",
        },
      ],
    }),
  },
  admin: {
    icon: "map",
    blockStyles: ["container"],
  },
});
```

### File: `apps/www/src/vexcms/blocks/Roadmap/index.tsx`

Renders a grid of feature cards organized by status. Shipped items have a green badge, coming-soon items have a yellow/amber badge, and planned items have a gray badge. Items are displayed in a responsive grid, grouped by status with section headers.

```tsx
"use client";

import type { BlockComponentProps } from "@vexcms/ui";

import { Check, Clock, Compass } from "lucide-react";

import { cn } from "~/lib/utils";

export { roadmapBlock } from "./config";

const statusConfig = {
  shipped: {
    label: "Shipped",
    icon: Check,
    badgeClass:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  "coming-soon": {
    label: "Coming Soon",
    icon: Clock,
    badgeClass:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  planned: {
    label: "Planned",
    icon: Compass,
    badgeClass:
      "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
  },
} as const;

type RoadmapItem = {
  feature: string;
  description?: string;
  status: "shipped" | "coming-soon" | "planned";
};

export default function RoadmapBlock({
  block,
  blockStyles,
}: BlockComponentProps) {
  const { heading, subheading, items } = block as unknown as {
    heading: string;
    subheading?: string;
    items?: RoadmapItem[];
  };

  // TODO: implement
  //
  // 1. Group items by status into three arrays: shipped, coming-soon, planned
  //    → Use a simple reduce or three .filter() calls
  //    → Maintain the order: shipped first, then coming-soon, then planned
  //
  // 2. Render the section header (heading + subheading) centered, same pattern as Features block
  //
  // 3. For each status group that has items, render:
  //    a. A group header with the status icon and label (e.g. "✓ Shipped")
  //       → Use the statusConfig lookup for icon, label, and styling
  //       → Render as: flex items-center gap-2, icon is size-5, label is text-lg font-semibold
  //       → Add mt-12 for spacing between groups (mt-16 for the first group after the heading)
  //
  //    b. A responsive grid of feature cards:
  //       → Grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6
  //       → Each card: rounded-xl border p-5 bg-card
  //       → Card header: flex items-center justify-between gap-4
  //         - Feature name: font-medium
  //         - Status badge: inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium
  //           Use badgeClass from statusConfig, icon is size-3
  //       → Card description (if present): text-sm text-muted-foreground mt-2
  //
  // Edge cases:
  // - Empty items array: show heading/subheading but no cards
  // - Missing description: just show feature name + badge, no description line
  // - Unknown status value: skip the item (don't render)

  throw new Error("Not implemented");
}
```

---

## Step 4: Update Header and Footer defaults

- [ ] Update Header config `menuItems` default to include Features, Pricing, Roadmap links
- [ ] Update Footer config `links` default to include all pages + external links
- [ ] Verify header and footer render updated nav

### File: `apps/www/src/vexcms/blocks/Header/config.ts`

Update the `menuItems` default value to include the full sitemap navigation. Only the `defaultValue` arrays change — no structural changes to the block definition.

```
Replace the menuItems defaultValue with:
[
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Docs", href: "/docs" },
]
```

And update `actionButtons` defaultValue:

```
[
  { label: "GitHub", href: "https://github.com/vexcms/vex", variant: "ghost" },
  { label: "Get Started", href: "/docs", variant: "default" },
]
```

> Note: These are just default values for new header blocks. Existing headers in the DB are not affected — update them manually via the admin panel.

### File: `apps/www/src/vexcms/blocks/Footer/config.ts`

Update the `links` default value to include the full sitemap + external resources.

```
Replace the links defaultValue with:
[
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Documentation", href: "/docs" },
  { label: "GitHub", href: "https://github.com/vexcms/vex" },
  { label: "npm", href: "https://www.npmjs.com/package/@vexcms/core" },
  { label: "Convex", href: "https://convex.dev" },
]
```

> Same note: these are defaults for new footer blocks only.

---

## Step 5: Page content guide — seed these pages via the admin panel

This step has no code changes. Use the admin panel at `/admin` to create the following pages. When you add a block, its `defaultValue` fields will auto-populate with the marketing content defined in the configs above.

### Page: Home (slug: `home`)

| Order | Block      | Purpose                                                          |
| ----- | ---------- | ---------------------------------------------------------------- |
| 1     | Hero       | Main headline: "The CMS built for Convex", badge, dual CTAs      |
| 2     | Features   | 3-card grid: Real-Time, Type-Safe, Developer First               |
| 3     | HowItWorks | 4-step vertical timeline: scaffold → define → build → deploy     |
| 4     | FAQ        | 6 common questions about VEX                                     |
| 5     | CTA        | "Ready to build with Vex CMS?" with Get Started + GitHub buttons |

### Page: Features (slug: `features`)

| Order | Block    | Purpose                                                                                            |
| ----- | -------- | -------------------------------------------------------------------------------------------------- |
| 1     | Hero     | Heading: "Everything you need to manage content". Subheading about the full feature set. No badge. |
| 2     | Features | Core features: 16 field types, admin panel, CLI, real-time, blocks, etc. (expand to 6-9 items)     |
| 3     | Features | Developer experience: TypeScript-first, code generation, auto-migration, live preview              |
| 4     | Features | Content management: draft/publish, versioning, RBAC, rich text, media library                      |
| 5     | CTA      | "Start building today"                                                                             |

> Tip: The Features block supports any number of items. Use 3 separate Features blocks with different headings to create distinct sections on the page.

### Page: Pricing (slug: `pricing`)

| Order | Block    | Purpose                                                                                                                           |
| ----- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Hero     | Heading: "Simple, transparent pricing". Subheading: "VEX CMS is open source and free. You only pay for Convex usage." No badge.   |
| 2     | Features | Two-item grid: "Open Source (Free)" — MIT licensed, all core features. "Enterprise (Coming Soon)" — environments, SSO, workflows. |
| 3     | FAQ      | Pricing-specific questions: Is it really free? What does enterprise include? What about Convex costs?                             |
| 4     | CTA      | "Get started for free"                                                                                                            |

> Note: We're reusing existing blocks (Hero, Features, FAQ, CTA) to build the pricing page. No dedicated Pricing block needed yet — the Features block with 2 items works well for a simple free/enterprise comparison.

### Page: Roadmap (slug: `roadmap`)

| Order | Block   | Purpose                                                                                     |
| ----- | ------- | ------------------------------------------------------------------------------------------- |
| 1     | Hero    | Heading: "Roadmap". Subheading about active development and transparency. No badge.         |
| 2     | Roadmap | Full roadmap grid with 18 items across shipped/coming-soon/planned statuses (uses defaults) |
| 3     | CTA     | "Want to shape the roadmap?" with links to GitHub Issues and Discussions                    |

---

## Success Criteria

- [ ] `pnpm build` succeeds in `apps/www`
- [ ] HowItWorks block renders a vertical timeline with step numbers, icons, titles, and descriptions
- [ ] Roadmap block renders a feature grid grouped by status (shipped/coming-soon/planned) with colored badges
- [ ] New blocks appear in the admin panel's block picker when editing pages
- [ ] All 4 pages (home, features, pricing, roadmap) can be created via the admin panel using the block defaults
- [ ] Header navigation includes links to all 4 pages
- [ ] Footer includes links to all pages + external resources
- [ ] All existing blocks (Hero, Features, CTA, FAQ, Header, Footer) continue to work unchanged
- [ ] Dynamic `[slug]` route serves all sub-pages without new Next.js routes
