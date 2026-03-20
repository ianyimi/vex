# @vexcms/richtext

Rich text editor and renderer for [VEX CMS](https://github.com/vexcms), built on [Plate.js](https://platejs.org/) (Slate-based). Provides a full WYSIWYG editor for the admin panel and a server-safe static renderer for frontend display.

## Installation

```bash
pnpm add @vexcms/richtext
```

## Exports

The package has three entry points:

| Entry | Import | Use Case |
|-------|--------|----------|
| Main | `@vexcms/richtext` | Type definitions |
| Editor | `@vexcms/richtext/editor` | Admin panel editor (client-only) |
| Render | `@vexcms/richtext/render` | Frontend rendering (server-safe) |

## Editor Setup

Wire the editor into your VEX config:

```typescript
import { defineConfig } from "@vexcms/core"
import { plateEditor } from "@vexcms/richtext/editor"

export default defineConfig({
  editor: plateEditor(),
  collections: [/* ... */],
})
```

### Customizing Features

Disable features you don't need:

```typescript
plateEditor({
  features: (defaults) => defaults.filter((f) => f.key !== "table"),
})
```

### Editor Features (13)

| Feature | Description |
|---------|-------------|
| `bold` | Bold text (Ctrl+B) |
| `italic` | Italic text (Ctrl+I) |
| `underline` | Underlined text (Ctrl+U) |
| `strikethrough` | Strikethrough text |
| `code` | Inline code (Ctrl+E) |
| `heading` | H1-H6 headings (dropdown) |
| `blockquote` | Block quotes |
| `codeBlock` | Multi-line code blocks |
| `list` | Bullet and ordered lists |
| `link` | Hyperlinks with URL input |
| `image` | Images with upload, resize, and alignment |
| `horizontalRule` | Horizontal dividers |
| `table` | Tables with row/column insertion and deletion |

### Image Handling

The editor supports multiple image insertion methods:

- **URL input** — Paste external image URLs
- **Media picker** — Browse and select from VEX media collections
- **Drag & drop** — Drop image files directly into the editor
- **Clipboard paste** — Auto-uploads pasted images

Images support selection, drag-to-resize, and alignment controls (wrap left/right, center, block).

### Toolbar

Contextual toolbar with mark buttons, heading dropdown, block/list toggles, link/table/image insertion, and keyboard shortcut hints. A separate table toolbar appears when the cursor is inside a table.

## Frontend Rendering

Server-safe static renderer — works in React Server Components, SSR, and client-side:

```tsx
import { RichText } from "@vexcms/richtext/render"

export function PostBody({ content }) {
  return <RichText content={content} className="prose" />
}
```

### Rendered Elements

**Blocks:** Paragraphs, headings (H1-H6), blockquotes, code blocks, lists (ul/ol), links, images, horizontal rules, tables

**Marks:** Bold, italic, underline, strikethrough, inline code

### Server Safety

The renderer uses Plate's `PlateStatic` engine with `createStaticEditor()` — no browser APIs required. Safe for any React rendering environment.

## Architecture

- **Editor** is lazy-loaded (`React.lazy`) to minimize admin bundle size
- **Renderer** uses a cached static component map for performance
- **Adapter pattern** — implements `VexEditorAdapter` from `@vexcms/core`, making the editor swappable with other implementations (Tiptap, Lexical, etc.)

## Peer Dependencies

- `react` / `react-dom` — React 18+
