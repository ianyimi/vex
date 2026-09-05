# @vexcms/richtext-plate

Rich text editor and renderer for [VEX CMS](https://github.com/ianyimi/vex), built on [Plate.js](https://platejs.org/) (Slate-based). Provides a full WYSIWYG editor for the admin panel and a server-safe static renderer for frontend display.

> [!NOTE]
> This package ships a working editor and renderer, but VexCMS has no `richtext` field type yet — there is no `richtext()` field factory to attach this editor to, and `@vexcms/core`'s `defineConfig` has no `editor` option to wire it into. Long prose is a multiline `text` field today. See the [roadmap](https://docs.vexcms.dev) for the `richtext` field. The docs below describe this package's own API, which is real and installable now; the "Editor Setup" section shows what wiring it into a collection is expected to look like once that field lands.

## Installation

```bash
pnpm add @vexcms/richtext-plate@alpha
```

## Exports

The package has three entry points:

| Entry | Import | Use Case |
|-------|--------|----------|
| Main | `@vexcms/richtext-plate` | Type definitions |
| Editor | `@vexcms/richtext-plate/editor` | Admin panel editor (client-only) |
| Render | `@vexcms/richtext-plate/render` | Frontend rendering (server-safe) |

## Editor Setup

`plateEditor()` builds the adapter object (`{ type: "plate", editorComponent, renderComponent }`) this package produces for a rich-text field editor. There is no `richtext` field yet, and `@vexcms/core`'s `defineConfig` has no `editor` option to consume it — this is what wiring it in is expected to look like once the field ships:

```typescript
import { plateEditor } from "@vexcms/richtext-plate/editor"

const editor = plateEditor()
// Not yet consumable by `defineConfig` — no `richtext` field or `editor`
// config option exists in `@vexcms/core` today.
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
import { RichText } from "@vexcms/richtext-plate/render"

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
- **Adapter pattern** — `plateEditor()` returns a `{ type, editorComponent, renderComponent }` object shaped for a future editor-adapter contract; `@vexcms/core` does not yet export or consume that contract (`VexEditorAdapter`/`VexEditorComponentProps` are referenced in this package's source but not shipped by `@vexcms/core`), so it is not yet pluggable against other implementations (Tiptap, Lexical, etc.) via core

## Peer Dependencies

- `react` / `react-dom` — React 18+
