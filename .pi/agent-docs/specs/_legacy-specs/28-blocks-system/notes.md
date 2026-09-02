# Spec 28 — Blocks System

## Status: Notes (pre-spec)

These are design notes gathered from conversation. A full spec should be written before implementation.

---

## Overview

Blocks are reusable field groups that can be composed into ordered lists on pages and other documents. They are a first-class primitive in VEX, not limited to rich text.

## Core Concepts

### `defineBlock()`

Defines a block's data shape. Lives in `@vexcms/core`. No React dependency — blocks are data-only definitions.

```ts
const heroBlock = defineBlock({
  slug: "hero",
  label: "Hero Section",
  fields: {
    heading: text({ required: true }),
    subheading: text(),
    cta: text({ label: "CTA Text" }),
    ctaUrl: text({ label: "CTA URL" }),
    image: upload({ to: "media" }),
  },
  admin: {
    icon: "layout-template",
    // optional custom editor component via Spec 09b path resolution
    components: { Editor: "~/components/admin/HeroBlockEditor" },
  },
})
```

### `blocks()` field type

A new field type that stores an ordered array of block instances. Each instance has a `blockType` (slug) and the field values defined by that block.

```ts
defineCollection({
  slug: "pages",
  fields: {
    title: text({ required: true }),
    slug: text({ required: true }),
    content: blocks({
      blocks: [heroBlock, ctaBlock, featureGridBlock],
    }),
  },
})
```

The `blocks` parameter tells the admin UI which block types are available in the picker for this field. Different collections/fields can allow different sets of blocks.

### Admin panel component

The blocks field admin component ships **in core** (same as all other field types). It is NOT a custom admin component — it's a standard field renderer like text, select, etc.

Features:
- Block picker (add new block from allowed types)
- Reorder blocks (drag and drop)
- Edit block fields inline (expand/collapse)
- Delete blocks
- Each block shows its type icon and a preview/title

### `RenderBlocks` component

Ships in `@vexcms/ui`. A lightweight React component for the frontend that renders an ordered list of blocks using a component map.

```tsx
import { RenderBlocks } from "@vexcms/ui"

const components = {
  hero: HeroComponent,
  cta: CTAComponent,
}

<RenderBlocks blocks={page.content} components={components} />
```

**Why the component map is separate from `defineBlock()`:**
- `defineBlock()` is in `@vexcms/core` which has no React dependency
- Render components import project-specific code (Tailwind classes, UI libraries, etc.)
- Same block data can render differently in different contexts (marketing site vs docs vs email)
- Putting React components in `defineBlock()` would create circular dependency issues

### Block data shape in the database

Each block instance stored in the array:
```ts
{
  blockType: "hero",        // matches defineBlock slug
  _key: "abc123",           // unique key for React rendering and reordering
  heading: "Welcome",       // field values from the block definition
  subheading: "...",
  cta: "Get Started",
  ctaUrl: "/signup",
  image: "media_doc_id",
}
```

Stored as `v.any()` in Convex (same pattern as richtext JSON).

## Schema Generation

The `blocks()` field generates `v.any()` in the Convex schema (array of block objects). Type inference should still work via `InferFieldType` — the return type should be a discriminated union of all allowed block types' field shapes.

## Dependencies

- Spec 09b (Custom Component Registration) — needed if users want custom block editor components, but NOT required for the default block editor UI
- The default admin block editor/picker must work without Spec 09b

## Reference Implementation

See the Payload-based block system in the uifoundry project:
- Block component map: `/Users/zaye/Documents/Projects/uifoundry.git/dev/src/payload/blocks/index.tsx`
- RenderBlocks component: `/Users/zaye/Documents/Projects/uifoundry.git/dev/src/components/RenderBlocks/index.tsx`
- Page usage: `/Users/zaye/Documents/Projects/uifoundry.git/dev/src/app/(frontend)/[id]/[slug]/page.tsx`

## Open Questions

- Should blocks support nesting (blocks within blocks)? Probably not for v1.
- Should blocks have their own validation rules beyond field-level validation?
- How does the blocks field interact with versioning/drafts?
- Should there be a max blocks limit configurable per field?
