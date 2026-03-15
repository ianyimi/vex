# 17a — Rich Text Field & Render Component

## Overview

Adds the `richtext()` field type to `@vexcms/core` and creates the `@vexcms/richtext` package with two subpath exports: `/editor` (Plate-based admin editor component) and `/render` (lightweight `<RichText>` component for frontend rendering via `<PlateStatic>`). Uses an **editor adapter pattern** (like Payload) so users can swap editors. Includes default formatting features, image support (raw URLs + optional media ID resolution), and tables.

## Design Decisions

1. **Editor adapter pattern** — `editor` property on both `VexConfig` (global default) and individual `richtext()` fields (per-field override). The adapter interface (`VexEditorAdapter`) defines `editorComponent`, `renderComponent`, and features, so users could build `tiptapEditor()` in the future.

2. **Plate as the default adapter** — `plateEditor()` ships as the built-in adapter via `@vexcms/richtext/editor`. Features are configurable via a callback pattern identical to Payload: `features: ({ defaultFeatures }) => [...defaultFeatures, CustomFeature]`.

3. **Storage format** — Plate JSON (Slate descendant array) stored as `v.any()` in Convex. Same as the `json` field type under the hood.

4. **Images** — Raw URLs by default (editor resolves media URL and stores it in the JSON node). Optional `resolveMedia` prop on `<RichText>` for ID-based resolution at render time. The editor can pick from media collections when configured.

5. **`@vexcms/richtext` is a separate package** — avoids bloating `@vexcms/core` or `@vexcms/ui` with Plate/Slate dependencies (~500KB+ of editor code). Users who don't use rich text don't pay for it.

6. **Subpath exports** — `/editor` has the heavy Plate editor (admin only), `/render` is lightweight for frontend rendering via `<PlateStatic>`.

## Out of Scope

- Custom blocks system (`defineBlock()`) — spec 17b
- Live preview integration — future spec
- Collaborative editing
- Markdown import/export
- Version diffing for richtext content

## Target Directory Structure

```
packages/core/src/
├── types/
│   ├── fields.ts                    # + RichTextFieldDef, VexField union update
│   ├── index.ts                     # + VexEditorAdapter type, editor on VexConfig
│   └── editor.ts                    # NEW — VexEditorAdapter interface
├── fields/
│   ├── richtext/
│   │   ├── index.ts                 # NEW — re-export
│   │   ├── config.ts                # NEW — richtext() builder
│   │   ├── config.test.ts           # NEW
│   │   ├── schemaValueType.ts       # NEW — richtextToValueTypeString
│   │   ├── schemaValueType.test.ts  # NEW
│   │   ├── columnDef.ts             # NEW — richtextColumnDef
│   │   └── columnDef.test.ts        # NEW
│   ├── constants.ts                 # + RICHTEXT_VALUETYPE
│   └── index.ts                     # + richtext export
├── valueTypes/
│   └── extract.ts                   # + richtext case
├── formSchema/
│   ├── generateFormSchema.ts        # + richtext case
│   └── generateFormDefaultValues.ts # + richtext case
├── columns/
│   └── generateColumns.ts           # + richtext case
└── config/
    └── defineConfig.ts              # + editor passthrough

packages/richtext/                   # NEW PACKAGE
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── src/
│   ├── index.ts                     # Shared types & utilities
│   ├── types.ts                     # PlateEditor feature types, node types
│   ├── editor/
│   │   ├── index.ts                 # Entry for @vexcms/richtext/editor
│   │   ├── plateEditor.ts           # plateEditor() adapter factory
│   │   ├── PlateEditorField.tsx     # Admin editor component
│   │   ├── features/
│   │   │   ├── index.ts             # Re-export all default features
│   │   │   ├── defaultFeatures.ts   # Default feature list
│   │   │   └── types.ts             # Feature type definitions
│   │   ├── plugins/
│   │   │   ├── index.ts             # Plugin setup from features
│   │   │   └── createPlugins.ts     # Features → Plate plugins
│   │   └── components/
│   │       ├── Toolbar.tsx           # Fixed toolbar component
│   │       ├── EditorContainer.tsx   # Editor wrapper
│   │       └── image/
│   │           └── ImageUpload.tsx   # Image insertion UI (media picker integration)
│   └── render/
│       ├── index.ts                 # Entry for @vexcms/richtext/render
│       ├── RichText.tsx             # <RichText> frontend component
│       ├── staticComponents.ts      # Static component map for PlateStatic
│       └── components/
│           ├── elements.tsx          # Static element components (headings, lists, etc.)
│           └── leaves.tsx            # Static leaf components (bold, italic, etc.)

packages/ui/src/components/form/
├── AppForm.tsx                      # + richtext case (renders editor adapter component)
└── fields/
    └── index.ts                     # + RichTextField re-export
```

## Implementation Order

1. **Step 1: Core field type** — `RichTextFieldDef`, `richtext()` builder, schema value type, column def, form schema/defaults, extract dispatcher. After this step, `pnpm build` and `pnpm test` pass in `@vexcms/core`.
2. **Step 2: Editor adapter type** — `VexEditorAdapter` interface, `editor` property on `VexConfig`/`VexConfigInput`, `defineConfig` passthrough. After this step, the adapter pattern is wired into the config system.
3. **Step 3: `@vexcms/richtext` package scaffolding** — package.json, tsconfig, tsup with subpath exports. After this step, `pnpm build` works for the new package (empty exports).
4. **Step 4: Shared types & feature system** — Node types, feature interface, default features list. After this step, feature definitions are importable.
5. **Step 5: `@vexcms/richtext/render`** — `<RichText>` component, static component map, all static element/leaf components. After this step, frontend rendering works.
6. **Step 6: `@vexcms/richtext/editor`** — `plateEditor()` factory, Plate editor component, toolbar, plugin setup from features, image upload integration. After this step, the admin editor works.
7. **Step 7: Admin form integration** — AppForm `richtext` case, wire editor adapter component. After this step, richtext fields render the Plate editor in the admin panel.
8. **Step 8: Final integration** — Test app collection with richtext field, verify full build, end-to-end flow.

---

## Step 1: Core Field Type in `@vexcms/core`

- [ ] Add `RichTextFieldDef` to `types/fields.ts`
- [ ] Add `richtext` to `VexField` union
- [ ] Add `richtext` to `InferFieldType`
- [ ] Add `RICHTEXT_VALUETYPE` to `fields/constants.ts`
- [ ] Create `fields/richtext/config.ts` — `richtext()` builder
- [ ] Create `fields/richtext/config.test.ts`
- [ ] Create `fields/richtext/schemaValueType.ts` — `richtextToValueTypeString`
- [ ] Create `fields/richtext/schemaValueType.test.ts`
- [ ] Create `fields/richtext/columnDef.ts` — `richtextColumnDef`
- [ ] Create `fields/richtext/columnDef.test.ts`
- [ ] Create `fields/richtext/index.ts` — re-exports
- [ ] Add `richtext` export to `fields/index.ts`
- [ ] Add `richtext` case to `valueTypes/extract.ts`
- [ ] Add `richtext` case to `formSchema/generateFormSchema.ts`
- [ ] Add `richtext` case to `formSchema/generateFormDefaultValues.ts`
- [ ] Add `richtext` case to `columns/generateColumns.ts`
- [ ] Add `richtext` export to `core/src/index.ts`
- [ ] Run `pnpm --filter @vexcms/core test`
- [ ] Run `pnpm --filter @vexcms/core build`

### File: `packages/core/src/types/fields.ts`

Add `RichTextFieldDef` after `JsonFieldDef`:

```ts
/**
 * Rich text field definition. Stores Plate/Slate JSON via `v.any()`.
 *
 * The rich text editor is provided by an editor adapter (e.g., `plateEditor()`).
 * By default, the global editor from `VexConfig.editor` is used.
 * Override per-field with the `editor` property.
 *
 * @example
 * ```ts
 * import { richtext } from "@vexcms/core"
 * import { plateEditor } from "@vexcms/richtext/editor"
 *
 * // Uses global editor from defineConfig
 * content: richtext({ label: "Content", required: true })
 *
 * // Per-field editor override
 * content: richtext({
 *   label: "Content",
 *   editor: plateEditor({ features: [BoldFeature, ItalicFeature] })
 * })
 * ```
 */
export interface RichTextFieldDef extends BaseField {
  readonly type: "richtext";
  /** Display label for the field in the admin form. */
  label?: string;
  /**
   * Editor adapter override for this specific field.
   * If not set, uses the global editor from `VexConfig.editor`.
   *
   * Pass `plateEditor()` from `@vexcms/richtext/editor`, or implement
   * your own adapter conforming to `VexEditorAdapter`.
   *
   * @example
   * ```ts
   * richtext({
   *   editor: plateEditor({
   *     features: ({ defaultFeatures }) =>
   *       defaultFeatures.filter(f => f.key !== "table")
   *   })
   * })
   * ```
   */
  editor?: VexEditorAdapter;
}
```

Add `RichTextFieldDef` to the `VexField` union:

```ts
export type VexField =
  | TextFieldDef
  | NumberFieldDef
  | CheckboxFieldDef
  | SelectFieldDef<string>
  | DateFieldDef
  | ImageUrlFieldDef
  | RelationshipFieldDef
  | UploadFieldDef
  | JsonFieldDef
  | ArrayFieldDef
  | RichTextFieldDef;
```

Add to `InferFieldType` (before the `json` branch):

```ts
  : F extends { type: "richtext" }
    ? RichTextDocument
```

> Note: `RichTextDocument` is defined in `types/editor.ts` (Step 2). For Step 1, use `unknown` temporarily and update to `RichTextDocument` after Step 2.

### File: `packages/core/src/fields/constants.ts`

Add:

```ts
export const RICHTEXT_VALUETYPE = "v.any()" as const;
```

### File: `packages/core/src/fields/richtext/config.ts`

```ts
import type { RichTextFieldDef } from "../../types";

/**
 * Creates a rich text field definition.
 * Stores Plate/Slate JSON document as `v.any()` in Convex.
 *
 * @param options.label - Display label in admin form
 * @param options.required - Whether this field is required
 * @param options.editor - Per-field editor adapter override
 * @returns A RichTextFieldDef
 *
 * @example
 * ```ts
 * content: richtext({ label: "Content", required: true })
 * ```
 */
export function richtext(options?: Omit<RichTextFieldDef, "type">): RichTextFieldDef {
  return {
    type: "richtext",
    ...options,
  };
}
```

### File: `packages/core/src/fields/richtext/config.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { richtext } from "./config";

describe("richtext", () => {
  it("creates a richtext field with default options", () => {
    const field = richtext();
    expect(field).toEqual({ type: "richtext" });
  });

  it("creates a richtext field with all options", () => {
    const field = richtext({
      label: "Content",
      required: true,
      description: "Main article content",
      admin: { position: "main", width: "full" },
    });
    expect(field).toEqual({
      type: "richtext",
      label: "Content",
      required: true,
      description: "Main article content",
      admin: { position: "main", width: "full" },
    });
  });

  it("preserves editor override", () => {
    const mockEditor = { type: "plate" };
    const field = richtext({ editor: mockEditor });
    expect(field.editor).toBe(mockEditor);
  });
});
```

### File: `packages/core/src/fields/richtext/schemaValueType.ts`

```ts
import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import type { RichTextFieldDef } from "../../types";
import { RICHTEXT_VALUETYPE } from "../constants";

/**
 * Converts richtext field definition to a Convex value type string.
 *
 * @param props.field - The richtext field definition
 * @param props.collectionSlug - The collection this field belongs to
 * @param props.fieldName - The field key name
 * @returns
 * - required: `"v.any()"`
 * - !required: `"v.optional(v.any())"`
 */
export function richtextToValueTypeString(props: {
  field: RichTextFieldDef;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    field: props.field,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "object",
    valueType: RICHTEXT_VALUETYPE,
    skipDefaultValidation: true,
  });
}
```

### File: `packages/core/src/fields/richtext/schemaValueType.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { richtextToValueTypeString } from "./schemaValueType";
import type { RichTextFieldDef } from "../../types";

describe("richtextToValueTypeString", () => {
  it("returns v.any() for required richtext field", () => {
    const field: RichTextFieldDef = { type: "richtext", required: true };
    const result = richtextToValueTypeString({
      field,
      collectionSlug: "posts",
      fieldName: "content",
    });
    expect(result).toBe("v.any()");
  });

  it("returns v.optional(v.any()) for optional richtext field", () => {
    const field: RichTextFieldDef = { type: "richtext" };
    const result = richtextToValueTypeString({
      field,
      collectionSlug: "posts",
      fieldName: "content",
    });
    expect(result).toBe("v.optional(v.any())");
  });
});
```

### File: `packages/core/src/fields/richtext/columnDef.ts`

```ts
import type { ColumnDef } from "@tanstack/react-table";
import type { RichTextFieldDef } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for a richtext field.
 *
 * @param props.fieldKey - The field key name
 * @param props.field - The richtext field definition
 * @returns ColumnDef that shows "Rich text" or "Empty" in the data table
 */
export function richtextColumnDef(props: {
  fieldKey: string;
  field: RichTextFieldDef;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: props.field.label ?? toTitleCase(props.fieldKey),
    meta: { align: props.field.admin?.cellAlignment ?? "left" },
    cell: (info) => {
      const value = info.getValue();
      if (value == null) return "";
      if (Array.isArray(value) && value.length === 0) return "";
      return "Rich text";
    },
  };
}
```

### File: `packages/core/src/fields/richtext/columnDef.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { richtextColumnDef } from "./columnDef";
import type { RichTextFieldDef } from "../../types";

describe("richtextColumnDef", () => {
  const field: RichTextFieldDef = { type: "richtext", label: "Content" };

  it("uses field label as header", () => {
    const col = richtextColumnDef({ fieldKey: "content", field });
    expect(col.header).toBe("Content");
  });

  it("falls back to title case of field key", () => {
    const col = richtextColumnDef({
      fieldKey: "body_content",
      field: { type: "richtext" },
    });
    expect(col.header).toBe("Body Content");
  });

  it("renders 'Rich text' for non-empty value", () => {
    const col = richtextColumnDef({ fieldKey: "content", field });
    const cell = (col as any).cell({
      getValue: () => [{ type: "p", children: [{ text: "hello" }] }],
    });
    expect(cell).toBe("Rich text");
  });

  it("renders empty string for null", () => {
    const col = richtextColumnDef({ fieldKey: "content", field });
    const cell = (col as any).cell({ getValue: () => null });
    expect(cell).toBe("");
  });

  it("renders empty string for empty array", () => {
    const col = richtextColumnDef({ fieldKey: "content", field });
    const cell = (col as any).cell({ getValue: () => [] });
    expect(cell).toBe("");
  });
});
```

### File: `packages/core/src/fields/richtext/index.ts`

```ts
export { richtext } from "./config";
export { richtextToValueTypeString } from "./schemaValueType";
export { richtextColumnDef } from "./columnDef";
```

### Modify: `packages/core/src/fields/index.ts`

Add at the end:

```ts
export { richtext } from "./richtext";
```

### Modify: `packages/core/src/valueTypes/extract.ts`

Add import at top:

```ts
import { richtextToValueTypeString } from "../fields/richtext";
```

Add case before `"json"`:

```ts
    case "richtext":
      return richtextToValueTypeString({ field, collectionSlug, fieldName });
```

### Modify: `packages/core/src/formSchema/generateFormSchema.ts`

Add case before `"json"`:

```ts
    case "richtext":
      return z.any();
```

### Modify: `packages/core/src/formSchema/generateFormDefaultValues.ts`

Add case before `"json"`:

```ts
    case "richtext":
      return [];
```

(Empty Slate/Plate document is an empty array `[]`.)

### Modify: `packages/core/src/columns/generateColumns.ts`

Add import:

```ts
import { richtextColumnDef } from "../fields/richtext/columnDef";
```

Add case before `"json"`:

```ts
    case "richtext":
      return richtextColumnDef({ fieldKey, field });
```

### Modify: `packages/core/src/index.ts`

Add to field helpers section:

```ts
export { richtext } from "./fields/richtext";
```

Add to type exports:

```ts
  RichTextFieldDef,
```

---

## Step 2: Editor Adapter Type & Config Integration

- [ ] Create `packages/core/src/types/editor.ts` — `VexEditorAdapter` interface
- [ ] Export from `packages/core/src/types/index.ts`
- [ ] Add `editor?` to `VexConfig` and `VexConfigInput`
- [ ] Update `defineConfig` to pass through editor
- [ ] Export `VexEditorAdapter` from `packages/core/src/index.ts`
- [ ] Run `pnpm --filter @vexcms/core build`

### File: `packages/core/src/types/editor.ts`

```ts
import type { ComponentType } from "react";

/**
 * A rich text document is an array of Slate/Plate element nodes.
 * This is the canonical type for all rich text content stored in VEX.
 *
 * Each element has a `type` (e.g., "p", "h1", "img") and `children`
 * (nested elements or text nodes with formatting marks).
 *
 * @example
 * ```ts
 * const doc: RichTextDocument = [
 *   { type: "h1", children: [{ text: "Hello" }] },
 *   { type: "p", children: [{ text: "World", bold: true }] },
 * ];
 * ```
 */
export type RichTextDocument = RichTextElement[];

/** A single element node in a rich text document. */
export interface RichTextElement {
  /** Node type identifier (e.g., "p", "h1", "img", "table") */
  type: string;
  /** Child nodes — nested elements or text leaves */
  children: (RichTextElement | RichTextText)[];
  /** URL for link/image elements */
  url?: string;
  /** Alt text for image elements */
  alt?: string;
  /** Media collection document ID for image elements (ID-based resolution) */
  mediaId?: string;
  /** Additional node-specific properties (alignment, colspan, etc.) */
  [key: string]: unknown;
}

/** A text leaf node with optional formatting marks. */
export interface RichTextText {
  /** The text content */
  text: string;
  /** Bold formatting */
  bold?: boolean;
  /** Italic formatting */
  italic?: boolean;
  /** Underline formatting */
  underline?: boolean;
  /** Strikethrough formatting */
  strikethrough?: boolean;
  /** Inline code formatting */
  code?: boolean;
}

/**
 * Adapter interface for rich text editors.
 * Allows swapping Plate for Tiptap, Lexical, or any custom editor.
 *
 * Implement this interface and pass it to `defineConfig({ editor: ... })`
 * or to individual `richtext({ editor: ... })` fields.
 *
 * @example
 * ```ts
 * // Using the built-in Plate adapter
 * import { plateEditor } from "@vexcms/richtext/editor"
 * defineConfig({ editor: plateEditor() })
 *
 * // Building a custom adapter
 * const myAdapter: VexEditorAdapter = {
 *   type: "custom",
 *   editorComponent: MyEditorComponent,
 *   renderComponent: MyRenderComponent,
 * }
 * ```
 */
export interface VexEditorAdapter {
  /**
   * Unique identifier for this editor adapter (e.g., "plate", "tiptap", "lexical").
   * Used for debugging and distinguishing between different editor implementations.
   */
  type: string;

  /**
   * React component that renders the editor in the admin form.
   *
   * Receives the current `RichTextDocument` value and an `onChange` callback.
   * Must support `readOnly` mode for document preview.
   * The component manages its own internal editor state and calls `onChange`
   * when the user makes edits.
   */
  editorComponent: ComponentType<VexEditorComponentProps>;

  /**
   * React component that renders rich text content on the frontend.
   *
   * Receives the stored `RichTextDocument` and renders it as React elements.
   * Must be safe for server-side rendering (no browser APIs).
   * Optionally supports `resolveMedia` for image URL resolution.
   */
  renderComponent: ComponentType<VexRenderComponentProps>;
}

/**
 * Props passed to the editor component in the admin form.
 */
export interface VexEditorComponentProps {
  /**
   * Current editor value as a `RichTextDocument` (Slate/Plate JSON array).
   * May be `null` or empty array `[]` for new documents.
   */
  value: RichTextDocument | null;
  /**
   * Callback to update the editor value.
   * Called whenever the user makes edits. The new value replaces the old one entirely.
   */
  onChange: (value: RichTextDocument) => void;
  /**
   * Whether the field is read-only (e.g., user lacks update permission).
   * When true, hide the toolbar and disable editing.
   * @default false
   */
  readOnly?: boolean;
  /** Placeholder text shown when the editor is empty. */
  placeholder?: string;
  /** Field label rendered above the editor. */
  label?: string;
  /** Helper text rendered below the editor. */
  description?: string;
  /** Field name (key) — used for form binding and accessibility. */
  name: string;
  /**
   * Media collection slug for image uploads.
   * When set, the editor can pick images from the specified media collection.
   * When not set, only URL input and direct file upload are available.
   */
  mediaCollection?: string;
}

/**
 * Props passed to the render component on the frontend.
 *
 * @example
 * ```tsx
 * import { RichText } from "@vexcms/richtext/render"
 *
 * <RichText content={document.content} className="prose" />
 *
 * // With media ID resolution
 * <RichText
 *   content={document.content}
 *   resolveMedia={async (id) => getMediaUrl(id)}
 * />
 * ```
 */
export interface VexRenderComponentProps {
  /**
   * The stored rich text content as a `RichTextDocument` (Slate/Plate JSON array).
   * Pass `null` or `[]` for empty content — the component will render nothing.
   */
  content: RichTextDocument | null;
  /**
   * Optional async resolver for media IDs → URLs.
   * When provided, image nodes with a `mediaId` property will have their
   * `url` resolved by calling this function before rendering.
   *
   * @param mediaId - The media collection document ID from the image node
   * @returns The resolved URL, or `null` if the media could not be found
   */
  resolveMedia?: (mediaId: string) => Promise<string | null>;
  /**
   * CSS class name applied to the root element.
   * Useful for applying prose styles (e.g., Tailwind's `prose` class).
   */
  className?: string;
}
```

### Modify: `packages/core/src/types/index.ts`

Add at top with other imports:

```ts
export * from "./editor";
```

Add `editor?` to `VexConfig`:

```ts
export interface VexConfig {
  // ... existing fields ...
  /** Global rich text editor adapter. Used by all richtext fields unless overridden. */
  editor?: VexEditorAdapter;
}
```

Add `editor?` to `VexConfigInput`:

```ts
export interface VexConfigInput {
  // ... existing fields ...
  /**
   * Global rich text editor adapter.
   * Used as the default editor for all richtext fields.
   * Pass `plateEditor()` from `@vexcms/richtext/editor`.
   *
   * @example
   * ```ts
   * import { plateEditor } from "@vexcms/richtext/editor"
   * defineConfig({ editor: plateEditor(), ... })
   * ```
   */
  editor?: VexEditorAdapter;
}
```

Also add `editor?` to `ClientVexConfig`:

```ts
export interface ClientVexConfig {
  // ... existing fields ...
  editor?: VexEditorAdapter;
}
```

### Modify: `packages/core/src/config/defineConfig.ts`

In the `defineConfig` function, ensure `editor` is passed through. It's already handled by the spread `...restInput`, but verify the type includes it.

### Modify: `packages/core/src/index.ts`

Add to type exports:

```ts
  // Editor adapter types
  VexEditorAdapter,
  VexEditorComponentProps,
  VexRenderComponentProps,
  // Rich text document types
  RichTextDocument,
  RichTextElement,
  RichTextText,
```

---

## Step 3: `@vexcms/richtext` Package Scaffolding

- [ ] Create `packages/richtext/package.json`
- [ ] Create `packages/richtext/tsconfig.json`
- [ ] Create `packages/richtext/tsup.config.ts`
- [ ] Create `packages/richtext/src/index.ts` (shared types re-export)
- [ ] Create `packages/richtext/src/editor/index.ts` (empty entry)
- [ ] Create `packages/richtext/src/render/index.ts` (empty entry)
- [ ] Run `pnpm install`
- [ ] Run `pnpm --filter @vexcms/richtext build`

### File: `packages/richtext/package.json`

```json
{
  "name": "@vexcms/richtext",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./editor": {
      "types": "./dist/editor/index.d.ts",
      "import": "./dist/editor/index.js"
    },
    "./render": {
      "types": "./dist/render/index.d.ts",
      "import": "./dist/render/index.js"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@vexcms/core": "workspace:*",
    "platejs": "^45.0.0"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@vexcms/tsconfig": "workspace:*",
    "react": "catalog:",
    "react-dom": "catalog:",
    "tailwindcss": "catalog:",
    "tsup": "catalog:",
    "typescript": "catalog:"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

> **Note:** The `platejs` version should be pinned to whatever the latest stable is at implementation time. Check https://www.npmjs.com/package/platejs. Plate v45+ consolidates everything into a single `platejs` package with subpath exports like `platejs/static`.

### File: `packages/richtext/tsconfig.json`

```json
{
  "extends": "@vexcms/tsconfig/react.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

### File: `packages/richtext/tsup.config.ts`

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/editor/index.ts",
    "src/render/index.ts",
  ],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    "react",
    "react-dom",
    "@vexcms/core",
  ],
});
```

### File: `packages/richtext/src/index.ts`

```ts
// Shared types re-exported from @vexcms/richtext root
export type {
  VexEditorAdapter,
  VexEditorComponentProps,
  VexRenderComponentProps,
} from "@vexcms/core";
```

### File: `packages/richtext/src/editor/index.ts`

```ts
// @vexcms/richtext/editor entry point
// Will export: plateEditor, features, PlateEditorField
export {};
```

### File: `packages/richtext/src/render/index.ts`

```ts
// @vexcms/richtext/render entry point
// Will export: RichText
export {};
```

---

## Step 4: Shared Types & Feature System

- [ ] Create `packages/richtext/src/types.ts` — node types, feature interface
- [ ] Create `packages/richtext/src/editor/features/types.ts` — `VexEditorFeature` type
- [ ] Create `packages/richtext/src/editor/features/defaultFeatures.ts` — default feature list
- [ ] Create `packages/richtext/src/editor/features/index.ts` — re-exports
- [ ] Update `packages/richtext/src/index.ts` to export shared types
- [ ] Run `pnpm --filter @vexcms/richtext build`

### File: `packages/richtext/src/types.ts`

Re-export the canonical types from `@vexcms/core` and add Plate-specific narrowed types for internal use:

```ts
// Re-export canonical types from core
export type {
  RichTextDocument,
  RichTextElement,
  RichTextText,
} from "@vexcms/core";

import type { RichTextElement } from "@vexcms/core";

/**
 * Image element node — narrowed type for image-specific properties.
 * Used internally by the editor and renderer for type-safe image handling.
 */
export interface ImageElement extends RichTextElement {
  type: "img";
  /** The image URL (always present after insertion) */
  url: string;
  /** Media collection document ID for ID-based resolution */
  mediaId?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Image width in pixels */
  width?: number;
  /** Image height in pixels */
  height?: number;
}

/**
 * Link element node — narrowed type for link-specific properties.
 */
export interface LinkElement extends RichTextElement {
  type: "a";
  /** The link URL */
  url: string;
  /** Link target (e.g., "_blank" for new tab) */
  target?: string;
}

/**
 * Table element node.
 */
export interface TableElement extends RichTextElement {
  type: "table";
}

/** Table row element node. */
export interface TableRowElement extends RichTextElement {
  type: "tr";
}

/** Table cell element node (regular or header). */
export interface TableCellElement extends RichTextElement {
  type: "td" | "th";
  /** Number of columns this cell spans */
  colSpan?: number;
  /** Number of rows this cell spans */
  rowSpan?: number;
}
```

### File: `packages/richtext/src/editor/features/types.ts`

```ts
/**
 * A feature that can be enabled in the rich text editor.
 * Features map to Plate plugins and UI components.
 *
 * Users can customize which features are active via the
 * `features` option on `plateEditor()`.
 */
export interface VexEditorFeature {
  /** Unique key for this feature (e.g., "bold", "heading", "table") */
  key: string;
  /** Human-readable label for feature discovery */
  label: string;
  /**
   * Plate plugins this feature enables.
   * Used by `createPluginsFromFeatures()` to build the plugin list.
   */
  plugins: string[];
}
```

### File: `packages/richtext/src/editor/features/defaultFeatures.ts`

```ts
import type { VexEditorFeature } from "./types";

/** Bold text formatting */
export const BoldFeature: VexEditorFeature = {
  key: "bold",
  label: "Bold",
  plugins: ["bold"],
};

/** Italic text formatting */
export const ItalicFeature: VexEditorFeature = {
  key: "italic",
  label: "Italic",
  plugins: ["italic"],
};

/** Underline text formatting */
export const UnderlineFeature: VexEditorFeature = {
  key: "underline",
  label: "Underline",
  plugins: ["underline"],
};

/** Strikethrough text formatting */
export const StrikethroughFeature: VexEditorFeature = {
  key: "strikethrough",
  label: "Strikethrough",
  plugins: ["strikethrough"],
};

/** Inline code formatting */
export const CodeFeature: VexEditorFeature = {
  key: "code",
  label: "Code",
  plugins: ["code"],
};

/** Headings (H1–H6) */
export const HeadingFeature: VexEditorFeature = {
  key: "heading",
  label: "Headings",
  plugins: ["heading"],
};

/** Blockquotes */
export const BlockquoteFeature: VexEditorFeature = {
  key: "blockquote",
  label: "Blockquote",
  plugins: ["blockquote"],
};

/** Code blocks with syntax highlighting */
export const CodeBlockFeature: VexEditorFeature = {
  key: "codeBlock",
  label: "Code Block",
  plugins: ["code_block"],
};

/** Ordered and unordered lists */
export const ListFeature: VexEditorFeature = {
  key: "list",
  label: "Lists",
  plugins: ["list"],
};

/** Hyperlinks */
export const LinkFeature: VexEditorFeature = {
  key: "link",
  label: "Link",
  plugins: ["link"],
};

/** Images (with optional media collection integration) */
export const ImageFeature: VexEditorFeature = {
  key: "image",
  label: "Image",
  plugins: ["image"],
};

/** Horizontal rules / dividers */
export const HorizontalRuleFeature: VexEditorFeature = {
  key: "horizontalRule",
  label: "Horizontal Rule",
  plugins: ["horizontal_rule"],
};

/** Tables with cell selection and merging */
export const TableFeature: VexEditorFeature = {
  key: "table",
  label: "Table",
  plugins: ["table"],
};

/**
 * Default features included when no custom features are specified.
 * This is the equivalent of Payload's `defaultFeatures` array.
 */
export const defaultFeatures: VexEditorFeature[] = [
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  StrikethroughFeature,
  CodeFeature,
  HeadingFeature,
  BlockquoteFeature,
  CodeBlockFeature,
  ListFeature,
  LinkFeature,
  ImageFeature,
  HorizontalRuleFeature,
  TableFeature,
];
```

### File: `packages/richtext/src/editor/features/index.ts`

```ts
export type { VexEditorFeature } from "./types";
export {
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  StrikethroughFeature,
  CodeFeature,
  HeadingFeature,
  BlockquoteFeature,
  CodeBlockFeature,
  ListFeature,
  LinkFeature,
  ImageFeature,
  HorizontalRuleFeature,
  TableFeature,
  defaultFeatures,
} from "./defaultFeatures";
```

### Modify: `packages/richtext/src/index.ts`

```ts
// Shared types — re-exported from @vexcms/core
export type {
  VexEditorAdapter,
  VexEditorComponentProps,
  VexRenderComponentProps,
  RichTextDocument,
  RichTextElement,
  RichTextText,
} from "@vexcms/core";

// Plate-specific narrowed types
export type {
  ImageElement,
  LinkElement,
  TableElement,
  TableRowElement,
  TableCellElement,
} from "./types";

export type { VexEditorFeature } from "./editor/features/types";
```

---

## Step 5: `@vexcms/richtext/render` — Frontend Rendering

- [ ] Create `packages/richtext/src/render/components/leaves.tsx` — static leaf components
- [ ] Create `packages/richtext/src/render/components/elements.tsx` — static element components
- [ ] Create `packages/richtext/src/render/staticComponents.ts` — component map
- [ ] Create `packages/richtext/src/render/RichText.tsx` — `<RichText>` component
- [ ] Update `packages/richtext/src/render/index.ts` — exports
- [ ] Run `pnpm --filter @vexcms/richtext build`

### File: `packages/richtext/src/render/components/leaves.tsx`

```ts
import type { SlateLeafProps } from "platejs";
import { SlateLeaf } from "platejs";

export function BoldLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props}>
      <strong>{props.children}</strong>
    </SlateLeaf>
  );
}

export function ItalicLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props}>
      <em>{props.children}</em>
    </SlateLeaf>
  );
}

export function UnderlineLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props}>
      <u>{props.children}</u>
    </SlateLeaf>
  );
}

export function StrikethroughLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props}>
      <s>{props.children}</s>
    </SlateLeaf>
  );
}

export function CodeLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props}>
      <code className="vex-rt-code">{props.children}</code>
    </SlateLeaf>
  );
}
```

### File: `packages/richtext/src/render/components/elements.tsx`

```ts
import type { SlateElementProps } from "platejs";
import { SlateElement } from "platejs";

export function ParagraphElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <p>{props.children}</p>
    </SlateElement>
  );
}

export function HeadingElementStatic(props: SlateElementProps) {
  // TODO: implement
  //
  // 1. Read the element's `type` to determine heading level (h1, h2, h3, h4, h5, h6)
  //    → access via props.element.type
  //
  // 2. Render the appropriate HTML heading tag
  //    → use React.createElement or a switch to pick h1-h6
  //
  // 3. Wrap with SlateElement for proper Plate static rendering
  //
  // Edge cases:
  // - Unknown heading level: default to h2
  throw new Error("Not implemented");
}

export function BlockquoteElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <blockquote className="vex-rt-blockquote">{props.children}</blockquote>
    </SlateElement>
  );
}

export function CodeBlockElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <pre className="vex-rt-code-block">
        <code>{props.children}</code>
      </pre>
    </SlateElement>
  );
}

export function CodeLineElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <div>{props.children}</div>
    </SlateElement>
  );
}

export function ListElementStatic(props: SlateElementProps) {
  // TODO: implement
  //
  // 1. Check props.element.type to determine list type
  //    → "ul" for unordered, "ol" for ordered
  //
  // 2. Render the appropriate HTML list tag
  //
  // Edge cases:
  // - Plate may use different type keys for lists (e.g., "bulleted_list", "numbered_list")
  //   Check the actual Plate plugin output and adjust the type strings accordingly
  throw new Error("Not implemented");
}

export function ListItemElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <li>{props.children}</li>
    </SlateElement>
  );
}

export function LinkElementStatic(props: SlateElementProps) {
  // TODO: implement
  //
  // 1. Read props.element.url and props.element.target
  //
  // 2. Render an <a> tag with href and optional target
  //    → add rel="noopener noreferrer" when target="_blank"
  //
  // 3. Wrap with SlateElement
  throw new Error("Not implemented");
}

export function ImageElementStatic(props: SlateElementProps) {
  // TODO: implement
  //
  // 1. Read props.element.url, props.element.alt, props.element.width, props.element.height
  //
  // 2. If the element has a mediaId and a resolveMedia function is available
  //    (passed via context or props), resolve it to a URL
  //    → For static rendering, the URL should already be resolved by the
  //      <RichText> component before passing to PlateStatic
  //
  // 3. Render an <img> tag with src, alt, width, height
  //    → add loading="lazy" for performance
  //
  // 4. Wrap with SlateElement
  //
  // Edge cases:
  // - Missing URL: render a placeholder or empty div
  // - Missing alt: use empty string (accessibility)
  throw new Error("Not implemented");
}

export function HorizontalRuleElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <hr className="vex-rt-hr" />
    </SlateElement>
  );
}

export function TableElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <table className="vex-rt-table">
        <tbody>{props.children}</tbody>
      </table>
    </SlateElement>
  );
}

export function TableRowElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <tr>{props.children}</tr>
    </SlateElement>
  );
}

export function TableCellElementStatic(props: SlateElementProps) {
  // TODO: implement
  //
  // 1. Check if the cell is a header cell (props.element.type === "th")
  //
  // 2. Read colSpan and rowSpan from props.element
  //
  // 3. Render <th> for header cells, <td> for regular cells
  //    → pass colSpan and rowSpan attributes
  //
  // 4. Wrap with SlateElement
  throw new Error("Not implemented");
}
```

### File: `packages/richtext/src/render/staticComponents.ts`

```ts
import {
  ParagraphElementStatic,
  HeadingElementStatic,
  BlockquoteElementStatic,
  CodeBlockElementStatic,
  CodeLineElementStatic,
  ListElementStatic,
  ListItemElementStatic,
  LinkElementStatic,
  ImageElementStatic,
  HorizontalRuleElementStatic,
  TableElementStatic,
  TableRowElementStatic,
  TableCellElementStatic,
} from "./components/elements";
import {
  BoldLeafStatic,
  ItalicLeafStatic,
  UnderlineLeafStatic,
  StrikethroughLeafStatic,
  CodeLeafStatic,
} from "./components/leaves";

/**
 * Default static component map for PlateStatic rendering.
 * Maps Plate node types to their static React components.
 *
 * These type keys must match the Plate plugin output.
 * Verify against the actual Plate plugin type strings at implementation time
 * (they may be "p", "h1", "blockquote", "ul", "ol", etc. or
 * "paragraph", "heading", etc. depending on Plate version).
 */
export function getStaticComponents(): Record<string, React.ComponentType<SlateElementProps | SlateLeafProps>> {
  // TODO: implement
  //
  // 1. Create a component map object mapping Plate node type strings
  //    to their static React components
  //    → The exact type keys depend on the Plate plugins being used
  //    → Consult the Plate docs for the correct type strings:
  //      - ParagraphPlugin → type key for paragraph elements
  //      - HeadingPlugin → type keys for h1, h2, h3, h4, h5, h6
  //      - BoldPlugin → type key for bold leaf mark
  //      - etc.
  //
  // 2. Map elements:
  //    - paragraph → ParagraphElementStatic
  //    - h1, h2, h3, h4, h5, h6 → HeadingElementStatic
  //    - blockquote → BlockquoteElementStatic
  //    - code_block → CodeBlockElementStatic
  //    - code_line → CodeLineElementStatic
  //    - ul, ol (or bulleted_list, numbered_list) → ListElementStatic
  //    - li (or list_item) → ListItemElementStatic
  //    - a (or link) → LinkElementStatic
  //    - img (or image) → ImageElementStatic
  //    - hr (or horizontal_rule) → HorizontalRuleElementStatic
  //    - table → TableElementStatic
  //    - tr (or table_row) → TableRowElementStatic
  //    - td, th (or table_cell) → TableCellElementStatic
  //
  // 3. Map leaves (marks):
  //    - bold → BoldLeafStatic
  //    - italic → ItalicLeafStatic
  //    - underline → UnderlineLeafStatic
  //    - strikethrough → StrikethroughLeafStatic
  //    - code → CodeLeafStatic
  //
  // 4. Return the map
  //
  // Edge cases:
  // - Plate may use different keys depending on version — check platejs docs
  // - Some components handle multiple types (HeadingElementStatic handles h1-h6)
  throw new Error("Not implemented");
}
```

### File: `packages/richtext/src/render/RichText.tsx`

```tsx
import type { VexRenderComponentProps, RichTextDocument } from "@vexcms/core";
import { getStaticComponents } from "./staticComponents";

/**
 * Renders rich text content as static React elements.
 * Uses Plate's `<PlateStatic>` under the hood for server-safe rendering.
 *
 * @param props.content - The stored rich text content (Plate JSON array)
 * @param props.resolveMedia - Optional resolver for media IDs → URLs
 * @param props.className - Optional CSS class for the root element
 *
 * @example
 * ```tsx
 * import { RichText } from "@vexcms/richtext/render"
 *
 * // Basic usage
 * <RichText content={document.content} />
 *
 * // With media resolution
 * <RichText
 *   content={document.content}
 *   resolveMedia={async (id) => getMediaUrl(id)}
 * />
 *
 * // With custom class
 * <RichText content={document.content} className="prose" />
 * ```
 */
export function RichText(props: VexRenderComponentProps) {
  // TODO: implement
  //
  // 1. Guard: if props.content is null/undefined or empty array, return null
  //
  // 2. Import PlateStatic and createSlateEditor from platejs
  //    → use: import { createSlateEditor } from "platejs"
  //    → use: import { PlateStatic } from "platejs/static"
  //
  // 3. Build the list of Plate plugins needed for static rendering
  //    → these are the same base plugins used by the editor, but in static mode
  //      they only provide type information for node traversal
  //    → import the relevant plugin constructors from platejs
  //
  // 4. Get the static component map from getStaticComponents()
  //
  // 5. Create a slate editor instance with:
  //    - plugins: the base plugins
  //    - components: the static component map
  //    - value: props.content (cast to Descendant[] if needed)
  //
  // 6. If props.resolveMedia is provided, pre-process the content tree:
  //    a. Walk the node tree looking for image nodes with a `mediaId` property
  //    b. For each, call props.resolveMedia(node.mediaId) to get the URL
  //    c. Update the node's `url` property with the resolved URL
  //    → This is async, so this component may need to be async (RSC-compatible)
  //      or you can do the resolution in a useEffect for client components
  //    → For simplicity in v1: make this an async server component
  //      OR require the caller to pre-resolve before passing content
  //
  // 7. Render <PlateStatic editor={editor} className={props.className} />
  //
  // Edge cases:
  // - Content is a string (legacy data): try JSON.parse, return null on failure
  // - Content is not an array: wrap in array or return null
  // - resolveMedia throws: fall back to the existing url on the node
  throw new Error("Not implemented");
}
```

### Modify: `packages/richtext/src/render/index.ts`

```ts
export { RichText } from "./RichText";
export { getStaticComponents } from "./staticComponents";
```

---

## Step 6: `@vexcms/richtext/editor` — Admin Editor

- [ ] Create `packages/richtext/src/editor/plugins/createPlugins.ts` — features → Plate plugins
- [ ] Create `packages/richtext/src/editor/plugins/index.ts`
- [ ] Create `packages/richtext/src/editor/components/Toolbar.tsx` — fixed toolbar
- [ ] Create `packages/richtext/src/editor/components/EditorContainer.tsx` — editor wrapper
- [ ] Create `packages/richtext/src/editor/components/image/ImageUpload.tsx` — image insertion
- [ ] Create `packages/richtext/src/editor/PlateEditorField.tsx` — admin editor component
- [ ] Create `packages/richtext/src/editor/plateEditor.ts` — `plateEditor()` adapter factory
- [ ] Update `packages/richtext/src/editor/index.ts` — exports
- [ ] Run `pnpm --filter @vexcms/richtext build`

### File: `packages/richtext/src/editor/plugins/createPlugins.ts`

```ts
import type { VexEditorFeature } from "../features/types";

/**
 * Converts an array of VexEditorFeatures into a Plate plugin configuration.
 *
 * @param props.features - Array of enabled features
 * @returns Array of Plate plugin instances ready for createPlateEditor
 *
 * @example
 * ```ts
 * const plugins = createPluginsFromFeatures({
 *   features: [BoldFeature, ItalicFeature, HeadingFeature]
 * });
 * ```
 */
export function createPluginsFromFeatures(props: {
  features: VexEditorFeature[];
}): AnyPluginConfig[] {
  // Note: import { type AnyPluginConfig } from "platejs"
  // TODO: implement
  //
  // 1. Import Plate plugin constructors from platejs:
  //    → BoldPlugin, ItalicPlugin, UnderlinePlugin, StrikethroughPlugin
  //    → CodePlugin (inline code)
  //    → HeadingPlugin (for H1-H6)
  //    → BlockquotePlugin
  //    → CodeBlockPlugin (for fenced code blocks)
  //    → ListPlugin (ordered + unordered)
  //    → LinkPlugin
  //    → ImagePlugin
  //    → HorizontalRulePlugin
  //    → TablePlugin
  //    → ParagraphPlugin (always included — base block type)
  //
  // 2. Build a lookup map: feature.key → Plate plugin instance(s)
  //    e.g., "bold" → [BoldPlugin], "table" → [TablePlugin]
  //
  // 3. Always include ParagraphPlugin as the base block type
  //
  // 4. Iterate over props.features, look up each feature.key, and collect plugins
  //    → skip unknown keys (future features that aren't implemented yet)
  //
  // 5. Return the flat array of plugin instances
  //
  // Edge cases:
  // - Duplicate features: deduplicate by key
  // - Empty features array: return only ParagraphPlugin
  // - The image plugin may need configuration for upload handling — accept an
  //   optional upload config that gets wired in later
  throw new Error("Not implemented");
}
```

### File: `packages/richtext/src/editor/plugins/index.ts`

```ts
export { createPluginsFromFeatures } from "./createPlugins";
```

### File: `packages/richtext/src/editor/components/Toolbar.tsx`

```tsx
import type { VexEditorFeature } from "../features/types";

interface ToolbarProps {
  /**
   * Features enabled for this toolbar instance.
   * Only buttons for enabled features are rendered.
   *
   * Buttons are organized into groups:
   * - Text marks: bold, italic, underline, strikethrough, code
   * - Block types: headings, blockquote, code block
   * - Lists: ordered, unordered
   * - Insert: link, image, table, horizontal rule
   */
  features: VexEditorFeature[];
}

/**
 * Fixed toolbar for the Plate editor.
 * Renders formatting buttons based on enabled features.
 *
 * Uses Plate's toolbar primitives and Lucide icons.
 */
export function Toolbar(props: ToolbarProps) {
  // TODO: implement
  //
  // 1. Import toolbar primitives from platejs:
  //    → ToolbarButton, MarkToolbarButton, etc.
  //    → or use Plate's built-in toolbar component if available
  //
  // 2. Import Lucide icons for each feature:
  //    → Bold, Italic, Underline, Strikethrough, Code
  //    → Heading1, Heading2, Heading3
  //    → List, ListOrdered
  //    → Quote, Code2 (code block)
  //    → Link, Image, Table, Minus (horizontal rule)
  //
  // 3. Build toolbar groups based on enabled features:
  //    Group 1 — Text marks: bold, italic, underline, strikethrough, code
  //    Group 2 — Block types: headings, blockquote, code block
  //    Group 3 — Lists: ordered, unordered
  //    Group 4 — Insert: link, image, table, horizontal rule
  //
  // 4. For each group, only render buttons for features that are in props.features
  //    → check by feature.key
  //
  // 5. Add separator dividers between groups
  //
  // 6. Each button should use Plate's toolbar API to toggle the mark/block/insert
  //    → Mark buttons: useMarkToolbarButton or similar
  //    → Block buttons: useBlockToolbarButton or similar
  //    → Insert buttons: editor.insertNode or similar
  //
  // Edge cases:
  // - No features enabled: render empty toolbar (or hide it)
  // - Heading dropdown: consider a dropdown for H1-H6 instead of individual buttons
  throw new Error("Not implemented");
}
```

### File: `packages/richtext/src/editor/components/EditorContainer.tsx`

```tsx
interface EditorContainerProps {
  /** Child elements — typically [Toolbar, PlateContent] stacked vertically. */
  children: React.ReactNode;
  /** Additional CSS classes merged with default editor styling (border, rounded, etc.). */
  className?: string;
}

/**
 * Wrapper component for the Plate editor.
 * Provides consistent styling and layout.
 */
export function EditorContainer(props: EditorContainerProps) {
  // TODO: implement
  //
  // 1. Render a div with border, rounded corners, and editor styling
  //    → use Tailwind classes consistent with VEX admin panel style
  //    → border, rounded-md, overflow-hidden
  //
  // 2. The children will be [Toolbar, EditorContent] stacked vertically
  //
  // 3. Apply props.className for custom styling
  throw new Error("Not implemented");
}
```

### File: `packages/richtext/src/editor/components/image/ImageUpload.tsx`

```tsx
/**
 * Props for the image upload component inside the editor.
 */
interface ImageUploadProps {
  /**
   * Called when an image is inserted into the editor.
   *
   * @param props.url - The image URL (always required). For media collection images,
   *   this is the resolved public URL. For direct uploads, may be a data URL initially.
   * @param props.alt - Optional alt text for accessibility.
   * @param props.mediaId - Optional media collection document ID.
   *   Present only if the image was selected from a media collection.
   */
  onInsert: (props: { url: string; alt?: string; mediaId?: string }) => void;
  /**
   * Media collection slug for the media picker.
   * When set, users can browse and select from existing media uploads.
   * When not set, only URL input and direct file upload are available.
   */
  mediaCollection?: string;
}

/**
 * Image insertion UI for the Plate editor.
 * Supports URL input, file upload, and media collection picker.
 */
export function ImageUpload(props: ImageUploadProps) {
  // TODO: implement
  //
  // 1. Render a popover/dialog with tabs or sections:
  //    a. URL input: text field + insert button for pasting image URLs
  //    b. Upload: drag-and-drop zone or file picker button
  //       → when a file is selected, upload it (the upload mechanism
  //         depends on whether mediaCollection is configured)
  //    c. Media library: if props.mediaCollection is set, show a picker
  //       that lets users browse the media collection
  //       → this will need access to the media picker state
  //       → similar to how UploadField works in AppForm
  //
  // 2. On insert, call props.onInsert with the URL and optional mediaId
  //    → if the image came from a media collection, include the mediaId
  //    → if it was a direct URL/upload, just include the url
  //
  // 3. For direct file uploads without a media collection:
  //    → Accept the file, convert to data URL or base64 for immediate preview
  //    → The actual storage mechanism is out of scope for this component;
  //      it just calls onInsert with whatever URL is available
  //
  // Edge cases:
  // - No mediaCollection configured: only show URL input and file upload
  // - Invalid URL: validate before inserting
  // - Large file: show loading state during upload
  throw new Error("Not implemented");
}
```

### File: `packages/richtext/src/editor/PlateEditorField.tsx`

```tsx
"use client";

import type { VexEditorComponentProps } from "@vexcms/core";
import type { VexEditorFeature } from "./features/types";

interface PlateEditorFieldProps extends VexEditorComponentProps {
  /**
   * Enabled features for this editor instance.
   * Determines which Plate plugins are loaded and which toolbar buttons appear.
   * Resolved by `plateEditor()` from either the user's custom features or `defaultFeatures`.
   */
  features: VexEditorFeature[];
}

/**
 * Plate-based rich text editor component for the VEX admin form.
 * This is the main editor component that gets rendered inside AppForm.
 *
 * @param props.value - Current editor value (Plate JSON)
 * @param props.onChange - Callback when editor value changes
 * @param props.features - Enabled features (determines plugins + toolbar)
 * @param props.readOnly - Whether the editor is read-only
 * @param props.placeholder - Placeholder text
 * @param props.label - Field label
 * @param props.description - Field description
 * @param props.name - Field name
 * @param props.mediaCollection - Media collection slug for image uploads
 */
export function PlateEditorField(props: PlateEditorFieldProps) {
  // TODO: implement
  //
  // 1. Import Plate editor primitives:
  //    → import { Plate, PlateContent, createPlateEditor } from "platejs/react"
  //    → or the equivalent from the platejs package
  //
  // 2. Create plugins from props.features using createPluginsFromFeatures()
  //
  // 3. Create a Plate editor instance (useMemo or useRef):
  //    → createPlateEditor({ plugins, value: props.value })
  //    → the editor instance should persist across re-renders
  //
  // 4. Render the editor structure:
  //    a. Label (if props.label is set)
  //    b. EditorContainer wrapping:
  //       - Toolbar with props.features (unless props.readOnly)
  //       - <Plate editor={editor} onChange={...}>
  //           <PlateContent placeholder={props.placeholder} readOnly={props.readOnly} />
  //         </Plate>
  //    c. Description text (if props.description is set)
  //
  // 5. Wire onChange: when Plate's value changes, call props.onChange(newValue)
  //    → debounce or throttle if needed for performance
  //
  // 6. Handle controlled value: when props.value changes externally
  //    (e.g., form reset), update the editor state
  //
  // Edge cases:
  // - Empty initial value: use a default empty paragraph [{ type: "p", children: [{ text: "" }] }]
  // - readOnly mode: hide toolbar, set PlateContent readOnly
  // - Value is null/undefined: treat as empty
  throw new Error("Not implemented");
}
```

### File: `packages/richtext/src/editor/plateEditor.ts`

```ts
import type { VexEditorAdapter } from "@vexcms/core";
import type { VexEditorFeature } from "./features/types";
import { defaultFeatures } from "./features/defaultFeatures";

/**
 * Options for the Plate editor adapter.
 */
interface PlateEditorOptions {
  /**
   * Features to enable in the editor.
   * Can be an array or a function that receives the defaults.
   *
   * @default defaultFeatures (bold, italic, underline, strikethrough, code,
   *   headings, blockquote, code block, lists, links, images, hr, tables)
   *
   * @example
   * ```ts
   * // Use all defaults
   * plateEditor()
   *
   * // Override with specific features
   * plateEditor({ features: [BoldFeature, ItalicFeature] })
   *
   * // Extend defaults (like Payload)
   * plateEditor({
   *   features: ({ defaultFeatures }) => [...defaultFeatures, CustomFeature]
   * })
   * ```
   */
  features?:
    | VexEditorFeature[]
    | ((props: { defaultFeatures: VexEditorFeature[] }) => VexEditorFeature[]);
}

/**
 * Creates a Plate-based editor adapter for VEX rich text fields.
 *
 * @param options.features - Features to enable (defaults to all built-in features)
 * @returns A VexEditorAdapter that can be passed to defineConfig or richtext()
 *
 * @example
 * ```ts
 * import { plateEditor } from "@vexcms/richtext/editor"
 *
 * // In vex.config.ts
 * export default defineConfig({
 *   editor: plateEditor(),
 *   collections: [...]
 * })
 *
 * // Per-field override
 * content: richtext({
 *   editor: plateEditor({
 *     features: ({ defaultFeatures }) => defaultFeatures.filter(f => f.key !== "table")
 *   })
 * })
 * ```
 */
export function plateEditor(options?: PlateEditorOptions): VexEditorAdapter {
  // TODO: implement
  //
  // 1. Resolve features:
  //    a. If options?.features is undefined → use defaultFeatures
  //    b. If options?.features is an array → use it directly
  //    c. If options?.features is a function → call it with { defaultFeatures }
  //
  // 2. Dynamically import PlateEditorField and RichText components
  //    → use React.lazy or direct import
  //    → PlateEditorField needs the resolved features passed as a prop
  //
  // 3. Create wrapper components that inject the resolved features:
  //    - editorComponent: wraps PlateEditorField, passes features as prop
  //    - renderComponent: uses RichText from @vexcms/richtext/render
  //
  // 4. Return the VexEditorAdapter object:
  //    {
  //      type: "plate",
  //      editorComponent: WrappedEditor,
  //      renderComponent: RichText (from render subpath),
  //    }
  //
  // Edge cases:
  // - features function returns empty array: valid, renders blank editor
  // - features function throws: let it propagate (developer error)
  throw new Error("Not implemented");
}
```

### Modify: `packages/richtext/src/editor/index.ts`

```ts
// @vexcms/richtext/editor entry point
export { plateEditor } from "./plateEditor";
export { PlateEditorField } from "./PlateEditorField";
export {
  type VexEditorFeature,
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  StrikethroughFeature,
  CodeFeature,
  HeadingFeature,
  BlockquoteFeature,
  CodeBlockFeature,
  ListFeature,
  LinkFeature,
  ImageFeature,
  HorizontalRuleFeature,
  TableFeature,
  defaultFeatures,
} from "./features";
```

---

## Step 7: Admin Form Integration

- [ ] Add `richtext` case to `AppForm.tsx` switch statement
- [ ] Import and render the editor adapter component from the config
- [ ] Run `pnpm --filter @vexcms/ui build`

### Modify: `packages/ui/src/components/form/AppForm.tsx`

The `richtext` case in the AppForm switch statement needs to render the editor adapter's `editorComponent`. The challenge is that `AppForm` doesn't have access to the `VexConfig` directly — it receives `fieldEntries` which contain `VexField` definitions.

**Approach:** The `RichTextFieldDef` has an optional `editor` property. The admin panel code (in `@vexcms/admin-next`) should resolve the editor adapter (field-level override or global default) and pass the `editorComponent` down. For `AppForm`, we add a new optional prop `renderRichTextField` (similar to `renderUploadField`):

Add to `AppFormProps`:

```ts
  /**
   * Custom renderer for richtext fields.
   * The admin panel provides this to inject the editor adapter component.
   * If not provided, richtext fields render as a JSON textarea fallback.
   *
   * @param props.field - TanStack React Form field API for this field
   * @param props.fieldDef - The richtext field definition from the collection config
   * @param props.name - The field key name (e.g., "content")
   */
  renderRichTextField?: (props: {
    field: FieldApi<Record<string, unknown>, string>;
    fieldDef: RichTextFieldDef;
    name: string;
  }) => React.ReactNode;
```

Add import at top:

```ts
import type { RichTextFieldDef } from "@vexcms/core";
```

Add case in the switch statement (after `"upload"` case):

```ts
                case "richtext": {
                  if (renderRichTextField) {
                    return readOnlyWrapper(
                      renderRichTextField({
                        field,
                        fieldDef: fieldDef as RichTextFieldDef,
                        name: entry.name,
                      })
                    );
                  }
                  // Fallback: render as JSON textarea when no editor adapter
                  return readOnlyWrapper(
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {fieldDef.label ?? entry.name}
                      </label>
                      <textarea
                        className="w-full min-h-[200px] rounded-md border p-3 font-mono text-sm"
                        value={JSON.stringify(field.state.value, null, 2)}
                        onChange={(e) => {
                          try {
                            field.handleChange(JSON.parse(e.target.value));
                          } catch {
                            // Invalid JSON, don't update
                          }
                        }}
                      />
                      {fieldDef.description && (
                        <p className="text-sm text-muted-foreground">
                          {fieldDef.description}
                        </p>
                      )}
                    </div>
                  );
                }
```

The admin-next package will then wire the editor adapter:

```ts
// In admin-next's document editor wrapper (not part of this spec, but shows the wiring):
<AppForm
  renderRichTextField={({ field, fieldDef, name }) => {
    const EditorComponent = resolvedEditor.editorComponent;
    return (
      <EditorComponent
        value={field.state.value}
        onChange={(val) => field.handleChange(val)}
        name={name}
        label={fieldDef.label}
        description={fieldDef.description}
        readOnly={entry.readOnly}
        mediaCollection={/* from upload config */}
      />
    );
  }}
  // ... other props
/>
```

---

## Step 8: Final Integration & Test App

- [ ] Add `@vexcms/richtext` dependency to test app
- [ ] Add a richtext field to an existing test-app collection
- [ ] Configure `plateEditor()` in `vex.config.ts`
- [ ] Create a frontend page that renders `<RichText content={...} />`
- [ ] Run `pnpm build` (full monorepo)
- [ ] Verify the admin panel renders the Plate editor
- [ ] Verify the frontend renders rich text content

### Modify: `apps/test-app/src/vexcms/vex.config.ts`

Add import and editor config:

```ts
import { plateEditor } from "@vexcms/richtext/editor";

export default defineConfig({
  editor: plateEditor(),
  // ... existing config
});
```

### Modify: Example collection (e.g., `apps/test-app/src/vexcms/collections/posts.ts`)

Add a richtext field:

```ts
import { richtext } from "@vexcms/core";

// In the fields object:
content: richtext({ label: "Content", required: true }),
```

### Create: Frontend render example

```tsx
// apps/test-app/src/app/posts/[id]/page.tsx (or similar)
import { RichText } from "@vexcms/richtext/render";

export default function PostPage({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <RichText content={post.content} className="prose" />
    </article>
  );
}
```

---

## Success Criteria

- [ ] `richtext()` builder creates a `RichTextFieldDef` with `type: "richtext"`
- [ ] Schema generation produces `v.any()` for required and `v.optional(v.any())` for optional
- [ ] Column def shows "Rich text" in data tables
- [ ] Form schema validates richtext as `z.any()`
- [ ] Form default value is `[]` (empty document)
- [ ] `VexEditorAdapter` interface is exported from `@vexcms/core`
- [ ] `defineConfig({ editor: ... })` accepts and passes through the adapter
- [ ] `@vexcms/richtext` package builds with three subpath exports (`.`, `/editor`, `/render`)
- [ ] `plateEditor()` returns a valid `VexEditorAdapter`
- [ ] `plateEditor({ features: ... })` supports array and function-based feature config
- [ ] `<RichText content={...} />` renders Plate JSON as static HTML (headings, lists, bold, etc.)
- [ ] `<RichText resolveMedia={...} />` resolves image mediaIds to URLs
- [ ] Tables render correctly in both editor and static renderer
- [ ] Images can be inserted in the editor (URL, upload, or media collection picker)
- [ ] `AppForm` renders richtext fields using the adapter's editor component
- [ ] All existing `@vexcms/core` tests still pass
- [ ] Full monorepo builds without errors
