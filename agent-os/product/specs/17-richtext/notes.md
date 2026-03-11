# Spec 17 — Rich Text Field (Plate)

> Pre-spec notes. Full spec will be written closer to implementation.

## Decision: Plate over Lexical

**Chosen editor: [Plate](https://platejs.org/)** (built on Slate.js, React-native).

Lexical was originally planned (modeled after Payload's `@payloadcms/richtext-lexical`), but after research, Plate is a significantly better fit for VEX:

| Criteria | Plate | Lexical |
|---|---|---|
| UI out of box | Full shadcn/ui component library (toolbars, menus, slash commands) | Nothing — build everything |
| JSON → React renderer | Built-in `<PlateStatic>` (RSC-compatible, no browser APIs) | None — must build custom recursive renderer |
| Custom blocks | Native plugin system with React components | DecoratorNode pattern (more manual wiring) |
| React-nativeness | Native (Slate + React) | Wrapper around non-React core |
| License | MIT | MIT |
| Admin panel fit | shadcn/ui components match VEX admin styling | Would need custom-styled toolbar/menus |

**BaseHub (our closest competitor) uses Tiptap** (ProseMirror-based), which validates the "not Lexical" approach. Payload chose Lexical and had to build thousands of lines of custom UI, renderers, and converter systems.

## Package Architecture: `@vexcms/richtext`

Separate package to avoid bloating `@vexcms/core` or `@vexcms/ui` with Plate/Slate dependencies (~500KB+ of editor code). Users who don't use rich text fields don't pay for it.

### Subpath exports

```
@vexcms/richtext/editor  — Plate editor + admin components (admin panel only)
@vexcms/richtext/render  — <PlateStatic> wrapper for frontend rendering (lightweight, no editor deps)
```

This mirrors BaseHub's split (editor on admin, lightweight renderer on client) and Payload's `/react` + `/client` subpath pattern.

### What lives where

| Item | Package | Why |
|---|---|---|
| `richtext()` field builder (type + meta) | `@vexcms/core` | Schema generation needs to know about the field type, no Plate dependency needed |
| `RichTextEditor` component | `@vexcms/richtext/editor` | Heavy — Plate editor + toolbar + plugins |
| `<RichText>` render component | `@vexcms/richtext/render` | Lightweight — `<PlateStatic>` wrapper + component map |
| `defineBlock()` for custom blocks | `@vexcms/richtext` (root) | Block registration used by both editor and renderer |
| Default features (bold, italic, etc.) | `@vexcms/richtext/editor` | Plate plugin configs |

## Storage Format

**Convex `v.any()` field (JSON).** Plate's document format is a JSON array of node objects — stored directly, no stringify/parse round-trip needed.

The `richtext()` field builder would generate a `json()` field under the hood:

```ts
// User writes:
content: richtext({ label: "Content", blocks: [ctaBlock, imageGalleryBlock] })

// Internally maps to v.any() in the Convex schema
// Stored value is the Plate JSON node array directly
```

## Custom Blocks — Full User Flow

This is the key feature. Users define custom React components that work inside the rich text editor AND render on the frontend.

### 1. Define a block

```ts
// User defines a block type with VEX field configs
const ctaBlock = defineBlock("cta", {
  fields: {
    heading: text({ label: "Heading", required: true }),
    description: text({ label: "Description" }),
    buttonText: text({ label: "Button Text" }),
    buttonUrl: text({ label: "Button URL" }),
  },
  // React component shown INSIDE the Plate editor (admin panel)
  editorComponent: CTAEditorComponent,
  // React component used by <PlateStatic> on the frontend
  renderComponent: CTARenderComponent,
})
```

### 2. In the admin panel editor

- User types `/` to open slash command menu → selects "CTA Card"
- A void block is inserted into the editor
- The `editorComponent` renders inline — could show a live preview of the CTA with editing controls overlaid, or a form with the block's fields
- Block field data is stored as attributes on the Plate JSON node
- Changes are visible immediately in the editor (React re-render)

### 3. On the frontend

```tsx
import { RichText } from "@vexcms/richtext/render"

// PlateStatic walks the JSON tree, hits the "cta" node type,
// calls CTARenderComponent with the stored field data as props
<RichText content={document.content} blocks={[ctaBlock]} />
```

### 4. Live preview (Spec 10 integration)

- User edits block fields in the editor → JSON state changes → autosave to Convex
- Live preview iframe receives update via Convex real-time subscription
- Frontend `<RichText>` re-renders with updated block data
- Custom blocks render in the preview just like any other content

**The editor component CAN be the live preview.** If the editor component renders the same visual output as the frontend component (with editing controls overlaid), the user sees the final result directly in the editor. The rich text editor effectively functions as a live preview for the content.

## Default Features (Included Out of Box)

Standard Plate plugins, minimal config needed:

- Bold, italic, underline, strikethrough
- Headings (H1-H6)
- Ordered and unordered lists
- Blockquotes
- Code blocks (with syntax highlighting)
- Links
- Images (integrates with Spec 15 Media Collections)
- Horizontal rules
- Tables (stretch goal)

## Spec Phasing (Suggested)

### 17a — Core Rich Text Field
- `richtext()` field type in `@vexcms/core`
- `@vexcms/richtext` package scaffolding
- Plate editor with default features (formatting, headings, lists, links, blockquotes, code, images)
- Toolbar + slash command menu (from Plate's shadcn/ui components)
- `<RichText>` frontend renderer via `<PlateStatic>`
- JSON storage in Convex
- No custom blocks yet

### 17b — Custom Block System
- `defineBlock()` API for user-defined blocks
- Void node registration in Plate
- Editor component rendering inside the editor
- Static component rendering via `<PlateStatic>`
- Block field form UI inside the editor (reuse VEX's existing AppForm/field system)
- Slash command registration for custom blocks

## Research Sources

- [Plate docs](https://platejs.org/docs)
- [Plate static rendering](https://platejs.org/docs/static)
- [BaseHub rich text rendering](https://docs.basehub.com/nextjs-integration/rendering-rich-text)
- [BaseHub custom components in rich text](https://docs.basehub.com/templates-and-examples/examples-and-guides/custom-components-in-rich-text)
- [Payload richtext-lexical](https://payloadcms.com/docs/rich-text/overview) — reference for feature scope, not implementation
- [Tiptap static renderer](https://tiptap.dev/docs/editor/api/utilities/static-renderer) — comparable approach to PlateStatic
- [Lexical nodes](https://lexical.dev/docs/concepts/nodes) — DecoratorNode pattern (rejected in favor of Plate's plugin system)
