# Spec 31 — Blocks Field — Design Walkthrough

---

## End-to-End Consumer Code

### 1. Define block types and a collection

```ts
// apps/www/src/vexcms/collections/pages.ts
import { defineBlock, blocks, text, select, url, group } from "@vexcms/core"

const headingBlock = defineBlock({
  slug:  "heading",
  label: "Heading",
  admin: { icon: "heading" },      // shown as Lucide icon in the picker dialog
  fields: {
    level: select({
      label:   "Level",
      options: [{ label: "H1", value: "h1" }, { label: "H2", value: "h2" }],
    }),
    text: text({ required: true, label: "Text" }),
  },
})

const paragraphBlock = defineBlock({
  slug:  "paragraph",
  label: "Paragraph",
  admin: { icon: "align-left" },
  fields: { content: text({ required: true, label: "Content" }) },
})

// Block with a named group sub-field — CtaLink gets its own export type
const ctaBlock = defineBlock({
  slug:          "cta",
  label:         "Call to Action",
  interfaceName: "CtaBlock",
  admin:         { icon: "mouse-pointer-click" },
  fields: {
    heading: text({ required: true, label: "Heading" }),
    link: group({
      label:         "Link",
      interfaceName: "CtaLink",
      fields: { label: text({ required: true }), href: url({ required: true }) },
    }),
  },
})

export const pages = defineCollection({
  slug:          "pages",
  interfaceName: "Page",
  admin:         { useAsTitle: "title" },
  fields: {
    title: text({ required: true }),
    body: blocks({
      label:         "Body",
      interfaceName: "PageBlock",     // union alias
      blocks:        [headingBlock, paragraphBlock, ctaBlock],
      labels:        { singular: "section", plural: "sections" },
      min:           1,
      max:           20,
    }),
  },
})
```

### 2. Generated Convex schema

```ts
// convex/vex.schema.ts (auto-generated)
export const pages = defineTable({
  title: v.string(),
  body: v.optional(v.array(v.union(
    v.object({
      _blockType: v.literal("heading"),
      _blockName: v.optional(v.string()),
      _key:       v.string(),
      level:      v.optional(v.string()),
      text:       v.string(),
    }),
    v.object({
      _blockType: v.literal("paragraph"),
      _blockName: v.optional(v.string()),
      _key:       v.string(),
      content:    v.string(),
    }),
    v.object({
      _blockType: v.literal("cta"),
      _blockName: v.optional(v.string()),
      _key:       v.string(),
      heading:    v.string(),
      link:       v.object({ label: v.string(), href: v.string() }),
    }),
  ))),
})
```

### 3. Generated TypeScript interfaces

```ts
// src/vex.types.ts (auto-generated)

// Named sub-group from ctaBlock (depth-first — declared before CtaBlock)
export type CtaLink = { label: string; href: string }

// One type per block — all three framework keys included
export type HeadingBlock = { _blockType: "heading"; _blockName?: string; _key: string; level?: string; text: string }
export type ParagraphBlock = { _blockType: "paragraph"; _blockName?: string; _key: string; content: string }
export type CtaBlock = { _blockType: "cta"; _blockName?: string; _key: string; heading: string; link: CtaLink }

// Named union alias from blocks({ interfaceName: "PageBlock", ... })
export type PageBlock = HeadingBlock | ParagraphBlock | CtaBlock

export interface Page extends VexDocument {
  _id:   Id<"pages">
  title: string
  body?: PageBlock[]
}
```

### 4. Admin form — what the user sees

**Block list — one item open:**

```
┌──────────────────────────────────────────────────────────────┐
│ ⠿  1  ▼  heading   [Hero heading     ]                  🗑  │  ← _blockName input
├──────────────────────────────────────────────────────────────┤
│  Level                                                        │
│  [ H1 ▾ ]                                                    │
│                                                               │
│  Text *                                                       │
│  [___________________________________]                        │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ ⠿  2  ►  paragraph  [Body copy       ]                  🗑  │  ← collapsed
└──────────────────────────────────────────────────────────────┘

[ + Add section ]     ← single button when only one type; opens picker when multiple
```

**Block picker Dialog (opens on "Add section"):**

```
┌────────────────────────────────┐
│ Add block                      │
│ Select a block type to add     │
├────────────────────────────────┤
│ [🔍 Search blocks…           ] │
├────────────────────────────────┤
│ [📰] Heading                   │
│      heading · 2 fields        │
│                                │
│ [≡] Paragraph                  │
│      paragraph · 1 field       │
│                                │
│ [👆] Call to Action            │
│      cta · 2 fields            │
└────────────────────────────────┘
```

### 5. Stored data shape per block item

```json
{
  "_blockType": "heading",
  "_blockName": "Hero heading",
  "_key": "a3f7k2mx",
  "level": "h1",
  "text": "Welcome to VexCMS"
}
```

`_blockType`, `_blockName`, and `_key` are always present. `_key` is a short random string generated once on creation and never changed — it is the stable React key for the list item and the pre-requisite for drag-and-drop reorder.

### 6. TanStack Form path resolution

`BlocksFieldInput` registers at `name="body"` with `mode="array"`. Inside `FormBlocks`, each item's editable sub-fields use bracket + dot-notation:

```
body[0]._blockType  → "heading"            (injected, never editable)
body[0]._key        → "a3f7k2mx"           (injected, never editable)
body[0]._blockName  → "Hero heading"       (inline input in the header)
body[0].level       → "h1"
body[0].text        → "Welcome to VexCMS"
body[1]._blockType  → "cta"
body[1].link.label  → "Get started"        (dot-notation inside brackets for group sub-fields)
body[1].link.href   → "/signup"
```

---

## Layering Diagram

```
apps/www/src/vexcms/collections/pages.ts
  ├─ defineBlock({ slug, label, admin, fields })
  │    └─ @vexcms/core: defineBlock()
  │         ├─ validates slug format + reserved field names
  │         ├─ BlockDef (interfaceName, interfaceType with _blockType/_blockName/_key literals)
  │         └─ buildBlockInterfaceType() → '{ _blockType: "heading"; _blockName?: string; _key: string; ... }'
  │
  └─ blocks({ blocks, interfaceName, labels, min, max })
       └─ @vexcms/core: blocks()
            ├─ validates unique slugs
            ├─ BlocksField (interfaceType = "PageBlock[]")
            ├─ blocksFieldToValidator()   → v.array(v.union(...))
            │    └─ adminFieldToValidator() per sub-field per block
            └─ blocksFieldToInputSchema() → z.array(z.discriminatedUnion(...))
                 └─ adminFieldToInputSchema() per sub-field per block

@vexcms/core/collections/interfaceGen.ts
  └─ getFieldInterfaces()
       └─ for blocks field:
            ├─ recurse into each block.fields (named sub-groups like CtaLink)
            ├─ emit export type HeadingBlock = { _blockType: "heading"; _blockName?: string; _key: string; ... }
            └─ emit export type PageBlock = HeadingBlock | ParagraphBlock | CtaBlock

@vexcms/react: CollectionEditView → AppForm → RenderFieldInputComponents
  └─ fieldInputComponents["blocks"] → BlocksFieldInput
       └─ createFieldInput (mode="array", name="body")
            └─ FormBlocks
                 ├─ items keyed by item._key (stable React key)
                 ├─ BlockItem per item
                 │    ├─ header: _blockName inline input + type badge + chevron + remove
                 │    └─ sub-fields: <SubInput name="body[i].fieldKey" />
                 ├─ Add button → BlockPickerDialog (Dialog + search + Icon per block)
                 └─ field.pushValue({ _blockType, _blockName, _key, ...fieldDefaults })
```

---

## Decisions Reference

**D2 — `_blockType` as discriminant (underscore prefix)**

The underscore prefix aligns with how Convex names its system fields (`_id`, `_creationTime`). It signals to developers that `_blockType`, `_blockName`, and `_key` are framework-managed and should not be treated as user data fields. The same convention is used for `_blockName` and `_key` for consistency.

**D3 — `_key: v.string()` on every block item**

Array indices change when items are inserted or removed, which causes React to remount the wrong components, breaks form state, and would corrupt drag-and-drop operations. A stable `_key` UUID (generated once on creation, never changed) solves this. It is stored in Convex alongside the block data so that keys persist across page reloads. The `_key` is the pre-requisite for adding drag-and-drop reorder in a future spec without a data migration.

**D4 — `_blockName` (stored as `_blockName`, edited via inline input)**

A user-editable label per block item makes long lists scannable — "Hero section", "Pricing table", "FAQ" is more informative than three collapsed "paragraph" badges. Storing it as `_blockName` (with underscore) keeps it in the framework-namespace alongside `_blockType` and `_key`. The inline input in the block header is a plain `<input type="text">` (not a TanStack Form sub-field) because `_blockName` has no validation and updating it avoids triggering full form re-renders.

**D5 — `RESERVED_BLOCK_FIELD_NAMES` + `defineBlock()` validation**

If a user writes `defineBlock({ fields: { _key: text() } })`, the generated Convex object would have `_key: v.string()` from the framework AND `_key: v.string()` from the user field — a silent collision that corrupts the discriminated union. The reserved name check surfaces this at definition time with a clear message. Slug format validation (`/^[a-zA-Z][a-zA-Z0-9_-]*$/`) prevents invalid `v.literal()` values that would break Convex schema generation silently.

**D6 + D7 — Slug validation + duplicate slug check**

The slug is the identifier passed to `defineBlock({ slug: "hero" })` — it becomes `_blockType: "hero"` on stored data and `v.literal("hero")` in the Convex validator. An invalid slug like `"my block type!"` would produce a syntactically invalid validator string. Throwing at definition time (when `defineBlock()` is called) rather than at schema generation time means the developer sees the error immediately in their editor rather than after a CLI run.

**D8 — `v.union()` for multiple, bare `v.object()` for single**

Convex's `v.union()` requires at least two arguments. A blocks field with exactly one block type is perfectly valid (e.g., a field that only accepts "image" blocks) but wrapping it in a single-member `v.union()` would be invalid Convex syntax.

**D10 — `BlockDef.interfaceType` includes all three framework keys**

Including `_blockType: "heading"`, `_blockName?: string`, and `_key: string` in the emitted interface type makes the generated TypeScript interfaces accurately reflect what is actually stored in Convex. When a developer iterates over `page.body`, they can type-safely access `block._key` for their own React list rendering.

**D14 — Dialog picker with search**

A `<Select>` dropdown works for 2–3 block types but becomes unusable with 10+ blocks. The Dialog approach (matching master branch) scales to any number of block types, supports keyboard navigation, and allows a search input to filter by label or slug. The Dialog uses the existing `dialog.tsx` component — no new dependency.

**D15 — `admin.icon` typed as `string` in core; rendered via existing `<Icon>` in react**

`@vexcms/core` cannot import from React or `@vexcms/react` (circular dependency). The icon is stored as a plain `string` on `BlockAdminConfig`. The existing `<Icon name={...}>` component in `@vexcms/react/src/components/Icon.tsx` already accepts `LucideIconName` and renders the correct Lucide icon component dynamically. `FormBlocks` imports and uses it directly — no new utility needed.

**D17 — Collapsible per item (not `<Accordion>` component)**

Each block item manages its own open/closed state with a local `useState(true)`. The master branch uses a custom `Collapsible` component (Base UI). Using a plain conditional render with a controlled state is simpler for the first implementation and avoids tying the animation behaviour to the Accordion primitive that was already committed to for group fields. If consistent animation is wanted across both, both can be migrated to the same primitive later.

**D18 — `_blockType`, `_blockName`, `_key` never rendered as sub-field inputs**

These keys are iterated from `blockDef.fields` (the user-defined fields only). The framework-injected keys are handled separately: `_blockType` is a hidden constant, `_key` is invisible, and `_blockName` has its own inline input in the block header — not routed through the `fieldToInputComponent` registry.

**D20 — Drag-and-drop deferred; `_key` enables it without migration**

Master has full drag-and-drop via `@hello-pangea/dnd`. Implementing it requires wrapping the list in `DragDropContext` + `Droppable` + `Draggable`. Because `_key` is already stored on every block item, enabling reorder in a future spec requires only UI changes — no Convex data migration, no validator changes, no type changes.
