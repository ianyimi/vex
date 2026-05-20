# Spec 31 — Blocks Field

**Status:** Draft (not started)
**Depends on:** Spec 30 (group field — `FormGroup`, `getFieldInterfaces` recursion, named interface pattern), Spec 28 (array field — `mode="array"`, `pushValue`/`removeValue`)

---

## Overview

Implements the `blocks()` field type and its companion `defineBlock()` config function end-to-end. A blocks field stores an ordered list of heterogeneous objects — each item carries `blockType` (discriminant), `_key` (stable UUID for React reconciliation and future reorder), `blockName` (user-editable label), and the fields defined for that block type. Users define block shapes with `defineBlock()` (exported from `@vexcms/core`), pass them to `blocks()`, and the field generates a discriminated `v.union()` Convex validator, a Zod discriminated union for form validation, and named TypeScript interfaces for every block type. The admin UI renders the list as a dynamic collapsible stack with a Dialog-based block-type picker (searchable, shows block icon when set). The implementation closely follows Spec 30 (group field) for named interfaces and `getFieldInterfaces`, and Spec 28 (array field) for the `mode="array"` TanStack Form pattern.

---

## Code Effect Preview

### 1. New `defineBlock()` + `blocks()` API

```ts
// apps/www/src/vexcms/collections/pages.ts
+import { defineBlock, blocks, text, select } from "@vexcms/core"
+
+const headingBlock = defineBlock({
+  slug:  "heading",          // stored as blockType: "heading" on each item
+  label: "Heading",
+  admin: { icon: "heading" },
+  fields: {
+    level: select({ options: [{ label: "H1", value: "h1" }, { label: "H2", value: "h2" }] }),
+    text:  text({ required: true }),
+  },
+})
+
+const paragraphBlock = defineBlock({
+  slug:  "paragraph",
+  label: "Paragraph",
+  admin: { icon: "align-left" },
+  fields: { content: text({ required: true }) },
+})
+
+const pages = defineCollection({
+  fields: {
+    body: blocks({
+      label:  "Body",
+      blocks: [headingBlock, paragraphBlock],
+      labels: { singular: "block", plural: "blocks" },
+    }),
+  },
+})
```

### 2. Convex schema output — `_key`, `blockName`, and discriminated union

```ts
// convex/vex.schema.ts (auto-generated)
+  body: v.optional(v.array(v.union(
+    v.object({
+      blockType: v.literal("heading"),
+      blockName: v.optional(v.string()),
+      _key:       v.string(),
+      level: v.optional(v.string()),
+      text:  v.string(),
+    }),
+    v.object({
+      blockType: v.literal("paragraph"),
+      blockName: v.optional(v.string()),
+      _key:       v.string(),
+      content: v.string(),
+    }),
+  ))),
```

### 3. Generated TypeScript — one interface per block, `_key` + `blockName` included

```ts
// vex.types.ts (auto-generated)
+export type HeadingBlock = {
+  blockType: "heading"; blockName?: string; _key: string
+  level?: string; text: string
+}
+export type ParagraphBlock = {
+  blockType: "paragraph"; blockName?: string; _key: string
+  content: string
+}
+
 export interface Page extends VexDocument {
+  body?: (HeadingBlock | ParagraphBlock)[]
 }
```

### 4. `AdminField` union + discriminant names in Convex

```ts
// packages/core/src/fields/types.ts
  export type AdminField<TFieldMeta extends {} = {}> =
    | ...existing variants...
+   | BlocksField<TFieldMeta>
    | RelationshipField<TFieldMeta>;
```

### 5. TanStack Form paths — underscore-prefixed system fields alongside user fields

```
body[0].blockType  → "heading"   (injected on add, never shown as input)
body[0]._key        → "abc123xy"  (injected on add, never shown as input)
body[0].blockName  → "Hero section"  (editable inline in the block header)
body[0].level       → "h1"
body[0].text        → "Hello World"
```

---

## API Surface

| Export | Package | Kind | Description |
|--------|---------|------|-------------|
| `defineBlock(options)` | `@vexcms/core` | function | Defines a block type — validates slug, returns `BlockDef` |
| `BlockDefInput` | `@vexcms/core` | interface | User-facing input to `defineBlock()` |
| `BlockAdminConfig` | `@vexcms/core` | interface | Admin UI config for a block definition (`icon`) |
| `BlockDef` | `@vexcms/core` | interface | Resolved block definition (after defaults) |
| `RESERVED_BLOCK_FIELD_NAMES` | `@vexcms/core` | const | `["blockType", "blockName", "_key"]` — forbidden field names in `defineBlock()` |
| `blocks(options)` | `@vexcms/core` | function | Config factory — validates unique slugs, returns `BlocksField` |
| `BlocksFieldInput` | `@vexcms/core` | interface | User-facing config input to `blocks()` |
| `BlocksField` | `@vexcms/core` | interface | Resolved field type (after defaults) |
| `blocksFieldToValidator` | `@vexcms/core` | function | Convex validator string builder |
| `blocksFieldToInputSchema` | `@vexcms/core` | function | Zod discriminated union schema builder |
| `BlocksFieldInput` (component) | `@vexcms/react` | component | Admin form input — block list + dialog picker |
| `BlocksFieldCell` | `@vexcms/react` | component | Admin list-table cell |
| `FormBlocks` | `@vexcms/react` | component | Block list renderer — exported for custom forms |
| `blocks` (re-export) | `@vexcms/react` | function | Pass-through re-export of core `blocks()` |
| `defineBlock` (re-export) | `@vexcms/react` | function | Pass-through re-export of core `defineBlock()` |

---

## Status / Progress

- [ ] ⏳ Step 1 — Core types + constants (`BlockAdminConfig`, `BlockDefInput`, `BlockDef`, `BlocksFieldInput`, `BlocksField`, `RESERVED_BLOCK_FIELD_NAMES`)
- [ ] ⏳ Step 2 — `defineBlock()` + `blocks()` config factories (with validation)
- [ ] ⏳ Step 3 — Core validator + input schema
- [ ] ⏳ Step 4 — Core wiring (union, barrels, dispatch) + `interfaceGen.ts` update
- [ ] ⏳ Step 5 — `FormBlocks` React component (Dialog picker, `_key`-keyed list, `blockName` header input)
- [ ] ⏳ Step 6 — `BlocksFieldInput`, `BlocksFieldCell`, `blocksFieldToColumnDef`
- [ ] ⏳ Step 7 — React adapter + index wiring
- [ ] ⏳ Step 8 — `apps/www` test + browser verify

---

## Design Decisions

Full rationale in `design-walkthrough.md` § *Decisions Reference*.

| #   | Decision (one line) |
|-----|---------------------|
| D1  | `defineBlock()` and `blocks()` in `@vexcms/core` — pure data; re-exported from `@vexcms/react` as pass-throughs. |
| D2  | `blockType` is the stored discriminant — underscore prefix signals it is framework-managed, not a user field. |
| D3  | `_key: v.string()` injected on every block item — stable UUID for React keys; pre-requisite for reorder. |
| D4  | `blockName: v.optional(v.string())` injected on every item — stored as `blockName`, displayed as inline text input in the block header; starts as the block's label on creation. |
| D5  | `RESERVED_BLOCK_FIELD_NAMES = ["blockType", "blockName", "_key"]` — `defineBlock()` throws if any field name collides with a framework-injected key. |
| D6  | `defineBlock()` validates slug format (`/^[a-zA-Z][a-zA-Z0-9_-]*$/`) — ensures valid Convex `v.literal()` values; throws a descriptive `Error` on failure. |
| D7  | `blocks()` validates unique slugs across all block definitions — throws on the first duplicate; surfaces config errors at definition time, not schema gen time. |
| D8  | Convex validator uses `v.union()` for multiple block types; degrades to bare `v.object()` for exactly one block type. |
| D9  | Block interface name defaults to `${slugToPascalCase(slug)}Block` (e.g. `"heading"` → `"HeadingBlock"`). |
| D10 | `BlockDef.interfaceType` includes all three framework keys plus user fields: `{ blockType: "heading"; blockName?: string; _key: string; text: string }`. |
| D11 | `blocks()` optional `interfaceName` emits a union alias: `export type PageBlock = HeadingBlock \| ParagraphBlock`. |
| D12 | Zod schema uses `z.discriminatedUnion("blockType", [...])` — precise per-variant errors; `min`/`max` enforced on the outer `z.array()`. |
| D13 | `FormBlocks` uses `mode="array"` (same as `FormArray`) — `pushValue`/`removeValue` for add/remove; items keyed by `item._key`, not index. |
| D14 | Block picker is a Dialog with a search input — scales to many block types; shows icon (via existing `<Icon>` component) when `admin.icon` is set. |
| D15 | `admin.icon` is typed as `string` in `@vexcms/core` (no React dep); the existing `<Icon name={...}>` component in `@vexcms/react` resolves it to the correct Lucide icon at render time. |
| D16 | `labels: { singular, plural }` on `blocks()` controls UI text in the empty state and item count badge. |
| D17 | Each block item renders as a collapsible section (not a full Accordion component) — header with drag handle placeholder, order number, chevron, type badge, `blockName` input, and action buttons; content shows all sub-fields. |
| D18 | `blockType`, `blockName`, `_key` are never rendered as editable inputs in sub-field loops — they are filtered out when iterating `blockDef.fields`. |
| D19 | Block self-reference prevention (a block containing a blocks field with itself) is deferred. |
| D20 | Drag-and-drop reorder is deferred — `_key` is in place so it can be added without a migration. |

---

## Out of Scope

- **Drag-and-drop reorder** — `_key` is included for this but `@hello-pangea/dnd` wiring is deferred.
- **Block self-reference detection** — cycle validation deferred (D19).
- **`blockStyles` / style tiers** — the master branch's per-block visual styling system is deferred.
- **Duplicate block (copy above/below)** — master has this; deferred.
- **Collapse state persistence to localStorage** — master persists open/closed state; deferred.
- **Custom block editor component** (`admin.components.Editor`) — deferred.
- **`array({ items: blocks({...}) })` combination** — works at config/validator level but UI combination untested.

---

## Target Directory Structure

```
packages/core/src/fields/blocks/
  types.ts            ⏳ NEW — BlockAdminConfig, BlockDefInput, BlockDef,
                                RESERVED_BLOCK_FIELD_NAMES,
                                BlocksFieldInput, BlocksField
  config.ts           ⏳ NEW — defineBlock(), blocks()
  validator.ts        ⏳ NEW — blocksFieldToValidator()
  validator.test.ts   ⏳ NEW
  inputSchema.ts      ⏳ NEW — blocksFieldToInputSchema()
  inputSchema.test.ts ⏳ NEW
  index.ts            ⏳ NEW — barrel

packages/core/src/fields/
  constants.ts        ⏳ MODIFY — add blocks entry
  types.ts            ⏳ MODIFY — add BlocksField to AdminField union
  index.ts            ⏳ MODIFY — export * from "./blocks"

packages/core/src/fields/validators/
  index.ts            ⏳ MODIFY — add blocks case

packages/core/src/fields/inputSchemas/
  index.ts            ⏳ MODIFY — add blocks case

packages/core/src/collections/
  interfaceGen.ts     ⏳ MODIFY — getFieldInterfaces blocks branch +
                                  collectionConfigToInterface field type ref

packages/react/src/components/form/
  FormBlocks.tsx      ⏳ NEW — collapsible block list + Dialog picker
  index.ts            ⏳ MODIFY — export FormBlocks, FormBlocksProps

packages/react/src/components/fields/blocks/
  Input.tsx           ⏳ NEW — BlocksFieldInput
  Cell.tsx            ⏳ NEW — BlocksFieldCell
  columnDef.tsx       ⏳ NEW — blocksFieldToColumnDef()
  index.ts            ⏳ NEW — barrel

packages/react/src/
  adapter.ts                     ⏳ MODIFY — add blocks to FieldComponentMap
  index.ts                       ⏳ MODIFY — export blocks, defineBlock, components
  components/fields/index.tsx    ⏳ MODIFY — register all three + export * from "./blocks"
```

---

## Implementation Order

### Step 1 — Core types + constants [dev]

Establishes all types: `BlockAdminConfig`, `BlockDefInput`, `BlockDef`, `RESERVED_BLOCK_FIELD_NAMES`, `BlocksFieldInput`, `BlocksField`, and the `ADMIN_FIELDS.blocks` constant. The `interfaceType` on `BlockDef` includes all three framework-injected keys (`blockType`, `blockName`, `_key`) plus user fields.

#### Files to create / modify

- [ ] `packages/core/src/fields/blocks/types.ts` (NEW)
- [ ] `packages/core/src/fields/constants.ts` (MODIFY)

---

### `packages/core/src/fields/blocks/types.ts` (NEW)

```ts
import { ADMIN_FIELDS } from "../constants";
import type { BaseField, BaseFieldInput, FieldAdminConfig } from "../baseTypes";
import type { AdminField } from "../types";

/**
 * Field names reserved by the blocks system.
 *
 * These names are injected automatically on every block item stored in Convex
 * and cannot be used as user field names inside `defineBlock({ fields: { ... } })`.
 *
 * - `blockType` — discriminant identifying the block's definition (e.g. `"heading"`)
 * - `blockName` — user-editable label stored alongside the block data
 * - `_key`       — stable UUID assigned on creation; used as the React key and
 *                  pre-requisites drag-and-drop reorder
 */
export const RESERVED_BLOCK_FIELD_NAMES = [
  "blockType",
  "blockName",
  "_key",
] as const;

/**
 * Admin UI configuration for a single block definition.
 *
 * @see {@link BlockDefInput}
 */
export interface BlockAdminConfig {
  /**
   * Lucide icon name shown next to the block label in the picker dialog.
   *
   * Typed as `string` in `@vexcms/core` to avoid a React dependency.
   * Rendered via the existing `<Icon name={...}>` component in `@vexcms/react`.
   *
   * @example "heading" | "align-left" | "image" | "layout-template"
   */
  icon?: string;
}

/**
 * Configuration input for a single block type, passed to `defineBlock()`.
 *
 * A block definition describes one variant in a blocks field — its stored
 * discriminant (`slug`), its display name in the admin picker (`label`), the
 * fields that make up its data shape, and optional admin UI config (icon).
 * Three fields are injected automatically on every block item and must not
 * appear in `fields`: `blockType`, `blockName`, and `_key`.
 *
 * **Defaults applied by `defineBlock()`:**
 * ```ts
 * {
 *   interfaceName: slugToPascalCase(slug) + "Block",  // e.g. "heading" → "HeadingBlock"
 * }
 * ```
 *
 * @example
 * ```ts
 * const headingBlock = defineBlock({
 *   slug:  "heading",
 *   label: "Heading",
 *   admin: { icon: "heading" },
 *   fields: {
 *     level: select({ options: [{ label: "H1", value: "h1" }] }),
 *     text:  text({ required: true }),
 *   },
 * })
 * ```
 *
 * @see {@link BlockDef} for the resolved output type
 * @see {@link defineBlock} for the config function that produces this type
 */
export interface BlockDefInput {
  /**
   * Unique identifier for this block type.
   *
   * Stored as `blockType: "slug"` on every block item. Used as the Convex
   * `v.literal()` discriminant and Zod `z.literal()` key. Must start with a
   * letter and contain only letters, numbers, hyphens, and underscores
   * (`/^[a-zA-Z][a-zA-Z0-9_-]*$/`).
   */
  slug: string;
  /** Display label shown in the admin block-type picker and as the block header. */
  label: string;
  /**
   * Fields that make up this block's data shape.
   *
   * Accepts any `AdminField`, including nested `group()` or `array()`.
   * `blockType`, `blockName`, and `_key` are injected automatically — do not
   * include them here. `defineBlock()` throws if any reserved name is used.
   */
  fields: Record<string, AdminField>;
  /** Admin UI configuration (picker icon). */
  admin?: BlockAdminConfig;
  /**
   * Custom TypeScript interface name for this block type.
   *
   * Defaults to `${slugToPascalCase(slug)}Block` (e.g. `"heading"` → `"HeadingBlock"`).
   */
  interfaceName?: string;
}

/**
 * Resolved block type definition, after `defineBlock()` applies all defaults.
 *
 * @see {@link BlockDefInput} for the user-facing input type
 * @see {@link defineBlock} for the config function that produces this type
 */
export interface BlockDef {
  /** Unique discriminant value stored as `blockType` on every block item. */
  slug: string;
  /** Display label shown in the admin block-type picker. */
  label: string;
  /** Fields that make up this block's data shape. */
  fields: Record<string, AdminField>;
  /** Admin UI configuration. */
  admin?: BlockAdminConfig;
  /**
   * TypeScript interface name for this block type.
   *
   * Always set after `defineBlock()`. Defaults to `${slugToPascalCase(slug)}Block`.
   */
  interfaceName: string;
  /**
   * Computed TypeScript object-type string including all three framework keys.
   *
   * E.g. `{ blockType: "heading"; blockName?: string; _key: string; text: string }`.
   * Used by `getFieldInterfaces` to emit the block's `export type` declaration.
   */
  interfaceType: string;
}

/**
 * Configuration input for a `blocks()` field.
 *
 * Blocks fields store an ordered, heterogeneous list of typed objects. Each item
 * carries `blockType` (which block definition it matches), `_key` (stable UUID),
 * `blockName` (user-editable label), plus the fields from that block's definition.
 *
 * **Defaults applied by `blocks()`:**
 * ```ts
 * {
 *   type:         "blocks",
 *   label:        "",    // inferred from field key by defineCollection
 *   required:     false,
 *   defaultValue: [],
 *   labels:       { singular: "block", plural: "blocks" },
 *   admin: {
 *     hidden: false, readOnly: false, position: "main", width: "full",
 *     cellAlignment: "left",
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * body: blocks({
 *   label:  "Body",
 *   blocks: [headingBlock, paragraphBlock],
 * })
 * ```
 *
 * @example
 * ```ts
 * // Named union alias + min/max constraints
 * body: blocks({
 *   label:         "Body",
 *   interfaceName: "PageBlock",
 *   blocks:        [headingBlock, paragraphBlock],
 *   min:           1,
 *   max:           20,
 *   labels:        { singular: "section", plural: "sections" },
 * })
 * ```
 *
 * @see {@link BlocksField} for the resolved output type
 * @see {@link blocks} for the config function that produces this type
 */
export interface BlocksFieldInput<TFieldMeta extends {} = {}> extends BaseFieldInput<TFieldMeta> {
  /** Block type definitions that are allowed in this field. */
  blocks: BlockDef[];
  /**
   * Optional TypeScript union alias name.
   *
   * When set, emits `export type PageBlock = HeadingBlock | ParagraphBlock` and
   * the collection interface uses `PageBlock[]` instead of the inline union.
   */
  interfaceName?: string;
  /**
   * Minimum number of block items.
   *
   * Enforced by the Zod inputSchema (form validation), not the Convex schema.
   * Does not affect the generated `vex.schema.ts`.
   */
  min?: number;
  /**
   * Maximum number of block items.
   *
   * Enforced by the Zod inputSchema. When the max is reached, the "Add" button
   * is disabled in the admin UI.
   */
  max?: number;
  /** Singular/plural display labels used in the admin UI. Defaults to `{ singular: "block", plural: "blocks" }`. */
  labels?: { singular: string; plural: string };
  /** Pre-filled value when creating a new document. Defaults to `[]`. */
  defaultValue?: Record<string, unknown>[];
}

/**
 * Resolved configuration for a `blocks()` field, after all defaults are applied.
 *
 * @see {@link BlocksFieldInput} for the user-facing input type
 * @see {@link blocks} for the config function that produces this type
 */
export interface BlocksField<TFieldMeta extends {} = {}> extends BaseField<TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.blocks.type;
  /** Display label shown in the admin form. Always set — inferred from field key if not provided. */
  label: string;
  /** Whether this field is required in the database schema. */
  required: boolean;
  /** Resolved admin UI configuration with all defaults applied. */
  admin: FieldAdminConfig;
  /** Block type definitions allowed in this field. */
  blocks: BlockDef[];
  /** Optional TypeScript union alias name. */
  interfaceName?: string;
  /**
   * Computed TypeScript array-type string.
   *
   * `"(HeadingBlock | ParagraphBlock)[]"` without `interfaceName`,
   * or `"PageBlock[]"` when `interfaceName` is set.
   */
  interfaceType: string;
  /** Minimum number of block items (Zod-enforced). */
  min?: number;
  /** Maximum number of block items (Zod-enforced). */
  max?: number;
  /** Singular/plural display labels for the admin UI. */
  labels: { singular: string; plural: string };
  /** Pre-filled value when creating a new document. */
  defaultValue: Record<string, unknown>[];
}
```

---

### `packages/core/src/fields/constants.ts` (MODIFY)

```ts
+  blocks: {
+    type:          "blocks",
+    interfaceType: "unknown[]",      // placeholder — blocks() overrides per-instance
+    validator:     "v.array(v.any())", // placeholder — blocksFieldToValidator builds dynamically
+    defaultValue:  [] as Record<string, unknown>[],
+  },
```

#### Run typecheck
```bash
pnpm --filter @vexcms/core typecheck
```

---

### Step 2 — `defineBlock()` + `blocks()` config factories [dev]

`defineBlock()` validates the slug format and checks for reserved field names. `blocks()` validates uniqueness of slugs across all passed block definitions. Both throw descriptive `Error`s at config definition time rather than surfacing issues later during schema generation.

> **Note on "slug":** The slug (`defineBlock({ slug: "heading" })`) is the block type's unique identifier — it is stored as `blockType: "heading"` on every block item in Convex. It is not the same as the field name (`body: blocks(...)` where `body` is the field name). Slug validation ensures the value generates a valid Convex `v.literal()` string.

#### Files to create

- [ ] `packages/core/src/fields/blocks/config.ts` (NEW)

---

### `packages/core/src/fields/blocks/config.ts` (NEW)

```ts
import { ADMIN_FIELDS } from "../constants";
import { slugToPascalCase } from "../../collections/utils";
import type { BlockDefInput, BlockDef, BlocksFieldInput, BlocksField } from "./types";
import { RESERVED_BLOCK_FIELD_NAMES } from "./types";

/**
 * Defines a single block type for use in a `blocks()` field.
 *
 * Validates that the slug is a valid identifier and that no field name
 * collides with framework-reserved names (`blockType`, `blockName`, `_key`).
 * Computes `interfaceType` — the TypeScript object-type string including
 * all three framework keys plus user fields.
 *
 * @param options - Block definition. `slug`, `label`, and `fields` are required.
 * @returns Resolved `BlockDef` with all defaults applied.
 *
 * @throws {Error} If `slug` does not match `/^[a-zA-Z][a-zA-Z0-9_-]*$/`.
 * @throws {Error} If any field name is in `RESERVED_BLOCK_FIELD_NAMES`.
 *
 * @example
 * ```ts
 * const headingBlock = defineBlock({
 *   slug:  "heading",
 *   label: "Heading",
 *   admin: { icon: "heading" },
 *   fields: { text: text({ required: true }) },
 * })
 * ```
 *
 * @see {@link BlockDefInput} for the full input type
 * @see {@link BlockDef} for the resolved output type
 */
export function defineBlock(options: BlockDefInput): BlockDef {
  // Validate slug format — must generate a valid Convex v.literal() string
  if (!options.slug || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(options.slug)) {
    throw new Error(
      `Invalid block slug "${options.slug}". Slugs must start with a letter and contain only letters, numbers, hyphens, and underscores.`,
    );
  }

  // Prevent field name collisions with framework-injected keys
  for (const fieldName of Object.keys(options.fields)) {
    if ((RESERVED_BLOCK_FIELD_NAMES as readonly string[]).includes(fieldName)) {
      throw new Error(
        `Block "${options.slug}": field name "${fieldName}" is reserved. Reserved names: ${RESERVED_BLOCK_FIELD_NAMES.join(", ")}`,
      );
    }
  }

  const interfaceName =
    options.interfaceName ?? `${slugToPascalCase({ slug: options.slug })}Block`;

  return {
    slug:          options.slug,
    label:         options.label,
    fields:        options.fields,
    admin:         options.admin,
    interfaceName,
    interfaceType: buildBlockInterfaceType(options.slug, options.fields),
  };
}

/**
 * Creates a blocks field with all defaults applied.
 *
 * Validates that all block slugs are unique within this field. Each item
 * stored in Convex carries `blockType`, `blockName`, and `_key` in addition
 * to the block's own fields.
 *
 * @param options - Blocks field configuration. `blocks` is required.
 * @returns Resolved blocks field definition.
 *
 * @throws {Error} If two or more block definitions share the same slug.
 *
 * @example
 * ```ts
 * const heading   = defineBlock({ slug: "heading",   label: "Heading",   fields: { text: text({ required: true }) } })
 * const paragraph = defineBlock({ slug: "paragraph", label: "Paragraph", fields: { content: text({ required: true }) } })
 *
 * defineCollection({
 *   fields: {
 *     body: blocks({
 *       label:  "Body",
 *       blocks: [heading, paragraph],
 *       labels: { singular: "section", plural: "sections" },
 *     }),
 *   },
 * })
 * ```
 *
 * @see {@link BlocksFieldInput} for the full input type
 * @see {@link BlocksField} for the resolved output type
 */
export function blocks<TFieldMeta extends {} = {}>(
  options: BlocksFieldInput<TFieldMeta>,
): BlocksField<TFieldMeta> {
  // Validate unique slugs
  const seen = new Set<string>();
  for (const block of options.blocks) {
    if (seen.has(block.slug)) {
      throw new Error(
        `Duplicate block slug "${block.slug}" in blocks() call. Each block must have a unique slug.`,
      );
    }
    seen.add(block.slug);
  }

  return {
    type:          ADMIN_FIELDS.blocks.type,
    interfaceType: buildBlocksInterfaceType(options.blocks, options.interfaceName),
    label:         "",
    required:      false,
    defaultValue:  [],
    labels:        { singular: "block", plural: "blocks" },
    ...options,
    admin: {
      hidden:        false,
      readOnly:      false,
      position:      "main",
      width:         "full",
      cellAlignment: "left",
      placeholder:   "",
      ...options?.admin,
    },
  };
}

/**
 * Builds the TypeScript object-type string for a block definition.
 *
 * Always includes the three framework keys first (`blockType` literal, `blockName?`,
 * `_key`), followed by user fields. Named group sub-fields are referenced by
 * `interfaceName` rather than inlined.
 */
function buildBlockInterfaceType(
  slug: string,
  fields: BlockDefInput["fields"],
): string {
  const frameworkKeys = `blockType: "${slug}"; blockName?: string; _key: string`;
  const userEntries = Object.entries(fields)
    .map(([key, field]) => {
      const typeStr =
        field.type === ADMIN_FIELDS.group.type && field.interfaceName
          ? field.interfaceName
          : field.interfaceType;
      return `${key}${field.required ? "" : "?"}: ${typeStr}`;
    })
    .join("; ");
  return userEntries
    ? `{ ${frameworkKeys}; ${userEntries} }`
    : `{ ${frameworkKeys} }`;
}

/**
 * Builds the TypeScript array-type string for a blocks field.
 *
 * Uses `interfaceName` for the named union alias when set, otherwise
 * builds an inline union of all block interface names.
 */
function buildBlocksInterfaceType(
  blockDefs: BlockDef[],
  interfaceName?: string,
): string {
  if (interfaceName) return `${interfaceName}[]`;
  const names = blockDefs.map((b) => b.interfaceName);
  if (names.length === 0) return "Record<string, unknown>[]";
  if (names.length === 1) return `${names[0]}[]`;
  return `(${names.join(" | ")})[]`;
}
```

#### Run typecheck
```bash
pnpm --filter @vexcms/core typecheck
```

---

### Step 3 — Core validator + input schema [dev]

Every block object in the Convex validator and Zod schema includes `blockType`, `blockName`, and `_key` as the first keys before user fields. The Zod schema enforces `min`/`max` on the outer array.

#### Files to create

- [ ] `packages/core/src/fields/blocks/validator.ts` (NEW)
- [ ] `packages/core/src/fields/blocks/validator.test.ts` (NEW)
- [ ] `packages/core/src/fields/blocks/inputSchema.ts` (NEW)
- [ ] `packages/core/src/fields/blocks/inputSchema.test.ts` (NEW)
- [ ] `packages/core/src/fields/blocks/index.ts` (NEW)

---

### `packages/core/src/fields/blocks/validator.ts` (NEW)

```ts
import { adminFieldToValidator } from "../validators";
import { applyBaseValidators } from "../validators/utils";
import type { BlocksField } from "./types";

/**
 * Converts a blocks field definition to a Convex schema validator string.
 *
 * Each block type becomes a `v.object()` with three framework keys first —
 * `blockType: v.literal(slug)`, `blockName: v.optional(v.string())`,
 * `_key: v.string()` — followed by the block's own field validators. Multiple
 * block types are combined with `v.union()`; a single block type uses a bare
 * `v.object()`. The whole thing is wrapped in `v.array()`, then `v.optional()`
 * when `field.required` is `false`.
 *
 * @param props - Input props.
 * @param props.field - The resolved blocks field definition.
 * @returns A Convex validator string.
 *
 * @example
 * ```ts
 * const heading   = defineBlock({ slug: "heading",   fields: { text: text({ required: true }) } })
 * const paragraph = defineBlock({ slug: "paragraph", fields: { content: text() } })
 * blocksFieldToValidator({ field: blocks({ blocks: [heading, paragraph] }) })
 * // → 'v.optional(v.array(v.union(
 * //      v.object({ blockType: v.literal("heading"), blockName: v.optional(v.string()), _key: v.string(), text: v.string() }),
 * //      v.object({ blockType: v.literal("paragraph"), blockName: v.optional(v.string()), _key: v.string(), content: v.optional(v.string()) }),
 * //    )))'
 * ```
 *
 * @internal — Used by CLI schema generation via `adminFieldToValidator`.
 */
export function blocksFieldToValidator<TFieldMeta extends {} = {}>(props: {
  field: BlocksField<TFieldMeta>;
}): string {
  const { field } = props;

  const blockObjects = field.blocks.map((block) => {
    const subValidators = Object.entries(block.fields)
      .map(([key, subField]) => `${key}: ${adminFieldToValidator({ field: subField })}`)
      .join(", ");

    const frameworkEntries = [
      `blockType: v.literal("${block.slug}")`,
      `blockName: v.optional(v.string())`,
      `_key: v.string()`,
    ].join(", ");

    const allEntries = subValidators
      ? `${frameworkEntries}, ${subValidators}`
      : frameworkEntries;

    return `v.object({ ${allEntries} })`;
  });

  const itemValidator =
    blockObjects.length === 1
      ? blockObjects[0]!
      : `v.union(\n${blockObjects.map((o) => `  ${o}`).join(",\n")}\n)`;

  return applyBaseValidators({
    field,
    validator: `v.array(${itemValidator})`,
  });
}
```

---

### `packages/core/src/fields/blocks/validator.test.ts` (NEW)

```ts
import { describe, it, expect } from "vitest";
import { defineBlock, blocks } from "./config";
import { text } from "../text";
import { number } from "../number";
import { blocksFieldToValidator } from "./validator";

const headingBlock   = defineBlock({ slug: "heading",   label: "Heading",   fields: { text: text({ required: true }) } });
const paragraphBlock = defineBlock({ slug: "paragraph", label: "Paragraph", fields: { content: text() } });
const scoreBlock     = defineBlock({ slug: "score",     label: "Score",     fields: { value: number({ required: true }) } });

describe("blocksFieldToValidator", () => {
  it("generates union array with framework keys for multiple block types", () => {
    const field = blocks({ blocks: [headingBlock, paragraphBlock] });
    const result = blocksFieldToValidator({ field });
    expect(result).toContain('v.literal("heading")');
    expect(result).toContain('v.literal("paragraph")');
    expect(result).toContain("blockName: v.optional(v.string())");
    expect(result).toContain("_key: v.string()");
    expect(result).toContain("v.union(");
    expect(result).toContain("v.optional(v.array(");
  });

  it("skips union wrapper for a single block type", () => {
    const field = blocks({ blocks: [scoreBlock] });
    const result = blocksFieldToValidator({ field });
    expect(result).not.toContain("v.union(");
    expect(result).toContain('v.literal("score")');
    expect(result).toContain("_key: v.string()");
  });

  it("omits outer v.optional for required field", () => {
    const field = blocks({ required: true, blocks: [headingBlock] });
    expect(blocksFieldToValidator({ field })).toMatch(/^v\.array\(/);
  });

  it("handles a block with no user fields (just framework keys)", () => {
    const divider = defineBlock({ slug: "divider", label: "Divider", fields: {} });
    const field = blocks({ blocks: [divider] });
    const result = blocksFieldToValidator({ field });
    expect(result).toContain('blockType: v.literal("divider")');
    expect(result).toContain("_key: v.string()");
  });

  it("throws on duplicate slugs", () => {
    const hero2 = defineBlock({ slug: "heading", label: "Heading v2", fields: {} });
    expect(() => blocks({ blocks: [headingBlock, hero2] })).toThrow(
      /Duplicate block slug/,
    );
  });

  it("throws on invalid slug", () => {
    expect(() =>
      defineBlock({ slug: "my block type!", label: "Bad", fields: {} }),
    ).toThrow(/Invalid block slug/);
  });

  it("throws on reserved field name", () => {
    expect(() =>
      defineBlock({
        slug: "test",
        label: "Test",
        fields: { _key: text() },
      }),
    ).toThrow(/_key.*reserved/i);
  });
});
```

---

### `packages/core/src/fields/blocks/inputSchema.ts` (NEW)

```ts
import { z } from "zod";
import { adminFieldToInputSchema } from "../inputSchemas";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import type { BlocksField } from "./types";

/**
 * Builds a Zod schema for validating a blocks field value in the admin form.
 *
 * Each block type becomes a `z.object()` with `blockType: z.literal(slug)`,
 * `blockName: z.string().optional()`, and `_key: z.string()` as framework
 * keys, plus the block's own sub-field schemas from `adminFieldToInputSchema`.
 * Multiple block types use `z.discriminatedUnion("blockType", [...])`. A single
 * block type uses a plain `z.array(z.object(...))`. `min`/`max` are enforced on
 * the outer array when set.
 *
 * @param props - Input props.
 * @param props.field - The resolved blocks field definition.
 * @returns A Zod array schema with discriminated-union items.
 *
 * @internal — Used by admin form schema construction via `adminFieldToInputSchema`.
 */
export function blocksFieldToInputSchema<TFieldMeta extends {} = {}>(props: {
  field: BlocksField<TFieldMeta>;
}) {
  const { field } = props;

  const blockSchemas = field.blocks.map((block) => {
    const userSubSchemas = Object.fromEntries(
      Object.entries(block.fields).map(([key, subField]) => [
        key,
        adminFieldToInputSchema({ field: subField }),
      ]),
    );
    return z.object({
      blockType: z.literal(block.slug),
      blockName: z.string().optional(),
      _key:       z.string(),
      ...userSubSchemas,
    });
  });

  const itemSchema =
    blockSchemas.length <= 1
      ? (blockSchemas[0] ?? z.object({ blockType: z.string(), _key: z.string() }))
      : z.discriminatedUnion("blockType", blockSchemas as [
          ReturnType<typeof z.object>,
          ReturnType<typeof z.object>,
          ...ReturnType<typeof z.object>[],
        ]);

  let schema = z.array(itemSchema).default(field.defaultValue ?? []);

  if (field.min !== undefined) {
    schema = schema.min(field.min, `At least ${field.min} ${field.labels.plural} required.`) as typeof schema;
  }
  if (field.max !== undefined) {
    schema = schema.max(field.max, `No more than ${field.max} ${field.labels.plural} allowed.`) as typeof schema;
  }

  return applyBaseInputSchemaMeta({ field, inputSchema: schema });
}
```

---

### `packages/core/src/fields/blocks/inputSchema.test.ts` (NEW)

```ts
import { describe, it, expect } from "vitest";
import { defineBlock, blocks } from "./config";
import { text } from "../text";
import { blocksFieldToInputSchema } from "./inputSchema";

const headingBlock   = defineBlock({ slug: "heading",   label: "Heading",   fields: { text: text({ required: true }) } });
const paragraphBlock = defineBlock({ slug: "paragraph", label: "Paragraph", fields: { content: text() } });

const makeItem = (blockType: string, extra: Record<string, unknown> = {}) => ({
  blockType: blockType,
  blockName: "Test block",
  _key:       "abc123",
  ...extra,
});

describe("blocksFieldToInputSchema", () => {
  it("accepts a valid block array", () => {
    const field = blocks({ blocks: [headingBlock, paragraphBlock] });
    const schema = blocksFieldToInputSchema({ field });
    const result = schema.safeParse([
      makeItem("heading",   { text: "Hello" }),
      makeItem("paragraph", { content: "World" }),
    ]);
    expect(result.success).toBe(true);
  });

  it("fails when required sub-field is missing", () => {
    const field = blocks({ blocks: [headingBlock] });
    const schema = blocksFieldToInputSchema({ field });
    const result = schema.safeParse([makeItem("heading")]); // text is required
    expect(result.success).toBe(false);
  });

  it("rejects an unknown blockType", () => {
    const field = blocks({ blocks: [headingBlock] });
    const schema = blocksFieldToInputSchema({ field });
    const result = schema.safeParse([makeItem("unknown", { text: "hi" })]);
    expect(result.success).toBe(false);
  });

  it("defaults to [] when value is undefined", () => {
    const field = blocks({ blocks: [headingBlock] });
    expect(blocksFieldToInputSchema({ field }).parse(undefined)).toEqual([]);
  });

  it("enforces min constraint", () => {
    const field = blocks({ blocks: [headingBlock], min: 1 });
    const schema = blocksFieldToInputSchema({ field });
    expect(schema.safeParse([]).success).toBe(false);
    expect(schema.safeParse([makeItem("heading", { text: "Hi" })]).success).toBe(true);
  });

  it("enforces max constraint", () => {
    const field = blocks({ blocks: [headingBlock], max: 1 });
    const schema = blocksFieldToInputSchema({ field });
    const twoItems = [makeItem("heading", { text: "A" }), makeItem("heading", { text: "B" })];
    expect(schema.safeParse(twoItems).success).toBe(false);
  });
});
```

---

### `packages/core/src/fields/blocks/index.ts` (NEW)

```ts
export * from "./types";
export * from "./config";
export * from "./validator";
export * from "./inputSchema";
```

#### Run tests
```bash
pnpm --filter @vexcms/core test
```

---

### Step 4 — Core wiring + `interfaceGen.ts` update [agent + dev]

Same pattern as Step 4 from Spec 30.

#### Files to modify

- [ ] `packages/core/src/fields/types.ts` — add `BlocksField` to `AdminField` union
- [ ] `packages/core/src/fields/index.ts` — `export * from "./blocks"`
- [ ] `packages/core/src/fields/validators/index.ts` — add blocks case
- [ ] `packages/core/src/fields/inputSchemas/index.ts` — add blocks case
- [ ] `packages/core/src/collections/interfaceGen.ts` — extend `getFieldInterfaces` + field type ref

---

### `packages/core/src/fields/types.ts` (MODIFY)

```ts
+import { BlocksField } from "./blocks";

  export type AdminField<TFieldMeta extends {} = {}> =
    | ...existing...
    | GroupField<TFieldMeta>
+   | BlocksField<TFieldMeta>
    | RelationshipField<TFieldMeta>;
```

### `packages/core/src/fields/validators/index.ts` (MODIFY)

```ts
+import { blocksFieldToValidator } from "../blocks";

+  case ADMIN_FIELDS.blocks.type:
+    return blocksFieldToValidator({ field: props.field });
```

### `packages/core/src/fields/inputSchemas/index.ts` (MODIFY)

```ts
+import { blocksFieldToInputSchema } from "../blocks";

+  case ADMIN_FIELDS.blocks.type:
+    return blocksFieldToInputSchema({ field: props.field });
```

### `packages/core/src/collections/interfaceGen.ts` (MODIFY)

**`getFieldInterfaces` — add blocks branch after the array branch:**

```ts
+  } else if (field.type === ADMIN_FIELDS.blocks.type) {
+    // Depth-first: recurse into each block's fields for any named sub-groups,
+    // then emit each block's own type declaration.
+    for (const block of field.blocks) {
+      declarations.push(...getFieldInterfaces(block.fields));
+      declarations.push(`export type ${block.interfaceName} = ${block.interfaceType}`);
+    }
+    // Named union alias — emitted after all individual block types.
+    if (field.interfaceName) {
+      const union = field.blocks.map((b) => b.interfaceName).join(" | ");
+      declarations.push(`export type ${field.interfaceName} = ${union}`);
+    }
+  }
```

**`collectionConfigToInterface` — field type ref (inside the `.map()`):**

```ts
      if (field.type === ADMIN_FIELDS.group.type && field.interfaceName) {
        fieldType = field.interfaceName;
      }
+     if (field.type === ADMIN_FIELDS.blocks.type && field.interfaceName) {
+       fieldType = `${field.interfaceName}[]`;
+     }
```

#### Run typecheck (adapter error expected until Step 7)
```bash
pnpm --filter @vexcms/core typecheck
```

---

### Step 5 — `FormBlocks` React component [dev]

Renders the block list as a collapsible stack. Each item has a header row (drag-handle placeholder, order number, chevron, type badge, `blockName` inline input, action buttons) and a content area with all the block's sub-fields. The block picker is a Dialog with a search input and optional block icons. Uses `_key` as the React key for each item instead of array index.

#### Files to create / modify

- [ ] `packages/react/src/components/form/FormBlocks.tsx` (NEW)
- [ ] `packages/react/src/components/form/index.ts` (MODIFY — export `FormBlocks`, `FormBlocksProps`)

---

### `packages/react/src/components/form/FormBlocks.tsx` (NEW)

```tsx
"use client";

import { useState } from "react";
import type { BlocksField, BlockDef } from "@vexcms/core";
import type { TypedFieldApi } from "./createFieldInput";
import { useContext } from "react";
import { AppFormContext } from "./AppFormContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { TrashIcon, PlusIcon, ChevronDownIcon, ChevronRightIcon, GripVerticalIcon, SearchIcon, LayersIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { fieldToInputComponent } from "../fields";
import { Icon } from "../Icon";
import { cn } from "../../styles/utils";

/**
 * Props for the `FormBlocks` component.
 *
 * @see {@link FormBlocks}
 */
export interface FormBlocksProps {
  /** The field key name from the collection config, e.g. `"body"`. */
  name: string;
  /**
   * The TanStack Form array field API in `mode="array"`.
   *
   * `field.state.value` is the block item array. `pushValue` / `removeValue`
   * handle add and remove.
   */
  field: TypedFieldApi<Record<string, unknown>[]>;
  /** The resolved blocks field definition. */
  fieldDef: BlocksField;
  /** Whether all controls are read-only. Propagated to every sub-field. */
  readOnly: boolean;
  /** Number of form submissions — passed through for validation error display. */
  submissionAttempts: number;
  /** Additional class names for the outer container. */
  className?: string;
}

/** Generates a short random key for new block items. */
function generateKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Builds the default value object for a new block of the given type. */
function buildDefaultBlock(blockDef: BlockDef): Record<string, unknown> {
  const fieldDefaults = Object.fromEntries(
    Object.entries(blockDef.fields).map(([key, subField]) => [
      key,
      subField.defaultValue ?? null,
    ]),
  );
  return {
    blockType: blockDef.slug,
    blockName: blockDef.label,
    _key:       generateKey(),
    ...fieldDefaults,
  };
}

// ---------------------------------------------------------------------------
// Block Picker Dialog
// ---------------------------------------------------------------------------

function BlockPickerDialog(props: {
  blockDefs: BlockDef[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (blockDef: BlockDef) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = props.blockDefs.filter(
    (b) =>
      b.label.toLowerCase().includes(search.toLowerCase()) ||
      b.slug.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="w-full max-w-sm p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Add block</DialogTitle>
          <DialogDescription>Select a block type to add</DialogDescription>
        </DialogHeader>
        <div className="px-4 pb-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search blocks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>
        <div className="px-2 pb-3 max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No blocks found</p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((blockDef) => (
                <button
                  key={blockDef.slug}
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-muted transition-colors"
                  onClick={() => {
                    props.onSelect(blockDef);
                    props.onOpenChange(false);
                    setSearch("");
                  }}
                >
                  <div className="size-8 rounded-sm bg-muted flex items-center justify-center shrink-0">
                    {blockDef.admin?.icon ? (
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      <Icon name={blockDef.admin.icon as any} className="size-4 text-muted-foreground" />
                    ) : (
                      <LayersIcon className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{blockDef.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {blockDef.slug}
                      {Object.keys(blockDef.fields).length > 0 &&
                        ` · ${Object.keys(blockDef.fields).length} field${Object.keys(blockDef.fields).length === 1 ? "" : "s"}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Single Block Item
// ---------------------------------------------------------------------------

function BlockItem(props: {
  block: Record<string, unknown>;
  blockDef: BlockDef;
  index: number;
  name: string;
  readOnly: boolean;
  submissionAttempts: number;
  onRemove: () => void;
  onBlockNameChange: (name: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const { block, blockDef, index, name } = props;
  const subFields = Object.entries(blockDef.fields);

  return (
    <div className="rounded-sm border border-border bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40">
        {/* Drag handle placeholder — replaced by dnd library in a future spec */}
        <GripVerticalIcon className="size-4 text-muted-foreground/40 shrink-0 cursor-grab" />

        {/* Order number */}
        <span className="text-xs font-mono text-muted-foreground tabular-nums w-4 text-center shrink-0">
          {index + 1}
        </span>

        {/* Chevron */}
        <button
          type="button"
          className="shrink-0 p-0.5 rounded hover:bg-muted"
          onClick={() => setIsOpen((v) => !v)}
        >
          {isOpen
            ? <ChevronDownIcon className="size-4 text-muted-foreground" />
            : <ChevronRightIcon className="size-4 text-muted-foreground" />}
        </button>

        {/* Block type badge */}
        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
          {blockDef.slug}
        </span>

        {/* blockName inline input */}
        <input
          type="text"
          value={(block.blockName as string) ?? ""}
          onChange={(e) => props.onBlockNameChange(e.target.value)}
          disabled={props.readOnly}
          placeholder={blockDef.label}
          className="flex-1 min-w-0 bg-transparent text-sm font-medium border-none outline-none focus:ring-0 p-0 truncate placeholder:text-muted-foreground disabled:opacity-50"
        />

        {/* Remove */}
        {!props.readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={props.onRemove}
            className="shrink-0 text-muted-foreground hover:text-destructive"
            aria-label={`Remove ${blockDef.label} block`}
          >
            <TrashIcon className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Sub-fields */}
      {isOpen && (
        <div className="flex flex-col gap-4 p-4 border-t border-border">
          {subFields.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              This block has no configurable fields.
            </p>
          ) : (
            subFields.map(([fieldKey, subFieldDef]) => {
              const SubInput = fieldToInputComponent(subFieldDef.type);
              if (!SubInput) return null;
              return (
                // "body[0].text" — array bracket + dot-notation for sub-fields
                <SubInput
                  key={fieldKey}
                  name={`${name}[${index}].${fieldKey}`}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  fieldDef={subFieldDef as any}
                  readOnly={props.readOnly || subFieldDef.admin.readOnly}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormBlocks
// ---------------------------------------------------------------------------

/**
 * Renders a blocks field as a dynamic collapsible list with a searchable block picker.
 *
 * Each item is keyed by `item._key` (a stable UUID injected on creation) —
 * not by array index — so React reconciliation works correctly when items are
 * removed. Each item header shows an inline `blockName` input, a type badge,
 * and a remove button. A Dialog with a search input handles block type selection
 * for the add action.
 *
 * Sub-field paths use TanStack Form array-bracket + dot notation: `"body[0].text"`.
 * `blockType`, `blockName`, and `_key` are never rendered as editable sub-field inputs.
 *
 * @throws {Error} When rendered outside `<AppForm>` and no form context is available.
 */
export function FormBlocks({
  name,
  field,
  fieldDef,
  readOnly,
  submissionAttempts,
  className,
}: FormBlocksProps) {
  const form = useContext(AppFormContext);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!form) {
    throw new Error(
      `FormBlocks "${name}" must be rendered inside <AppForm>.`,
    );
  }

  const items = (field.state.value ?? []) as Record<string, unknown>[];
  const blockDefMap = new Map(fieldDef.blocks.map((b) => [b.slug, b]));
  const { singular, plural } = fieldDef.labels;
  const atMax = fieldDef.max !== undefined && items.length >= fieldDef.max;

  function handleAdd(blockDef: BlockDef) {
    field.pushValue(buildDefaultBlock(blockDef));
  }

  function updateBlockName(index: number, blockName: string) {
    // Push a whole new value with blockName updated
    const current = items[index];
    if (!current) return;
    const updated = [...items];
    updated[index] = { ...current, blockName: blockName };
    // Update via handleChange on the array field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (field as any).handleChange(updated);
  }

  const rawError = field.state.meta.errors[0];
  const errorMessage = typeof rawError === "string" ? rawError : rawError?.message;
  const showError = (field.state.meta.isTouched || submissionAttempts > 0) && errorMessage;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Empty state */}
      {items.length === 0 && (
        <div className="rounded-sm border-2 border-dashed border-border py-8 text-center">
          <LayersIcon className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No {plural} yet.</p>
        </div>
      )}

      {/* Block items — keyed by _key, not index */}
      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((item, index) => {
            const blockSlug = item.blockType as string;
            const blockDef = blockDefMap.get(blockSlug);
            const itemKey = (item._key as string) ?? String(index);

            if (!blockDef) {
              return (
                <div
                  key={itemKey}
                  className="rounded-sm border border-destructive/40 px-3 py-2 text-sm text-destructive"
                >
                  Unknown block type: <code>{blockSlug}</code>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => field.removeValue(index)}
                      className="ml-2"
                    >
                      <TrashIcon className="size-3.5" />
                    </Button>
                  )}
                </div>
              );
            }

            return (
              <BlockItem
                key={itemKey}
                block={item}
                blockDef={blockDef}
                index={index}
                name={name}
                readOnly={readOnly}
                submissionAttempts={submissionAttempts}
                onRemove={() => field.removeValue(index)}
                onBlockNameChange={(blockName) => updateBlockName(index, blockName)}
              />
            );
          })}
        </div>
      )}

      {/* Add button */}
      {!readOnly && (
        <div className="flex items-center gap-2">
          {fieldDef.blocks.length === 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAdd(fieldDef.blocks[0]!)}
              disabled={atMax}
            >
              <PlusIcon className="size-4" />
              Add {singular}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen(true)}
              disabled={atMax}
            >
              <PlusIcon className="size-4" />
              Add {singular}
            </Button>
          )}
          {atMax && (
            <span className="text-xs text-muted-foreground">
              Maximum {fieldDef.max} {plural} reached
            </span>
          )}
        </div>
      )}

      {showError && <p className="text-sm text-destructive">{errorMessage}</p>}

      <BlockPickerDialog
        blockDefs={fieldDef.blocks}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleAdd}
      />
    </div>
  );
}
```

### `packages/react/src/components/form/index.ts` (MODIFY)

```ts
+export * from "./FormBlocks";
```

---

### Step 6 — `BlocksFieldInput`, `BlocksFieldCell`, `blocksFieldToColumnDef` [dev]

Same structure as the group field components from Spec 30.

#### Files to create

- [ ] `packages/react/src/components/fields/blocks/Input.tsx` (NEW)
- [ ] `packages/react/src/components/fields/blocks/Cell.tsx` (NEW)
- [ ] `packages/react/src/components/fields/blocks/columnDef.tsx` (NEW)
- [ ] `packages/react/src/components/fields/blocks/index.ts` (NEW)

---

### `packages/react/src/components/fields/blocks/Input.tsx` (NEW)

```tsx
"use client";

import type { BlocksField } from "@vexcms/core";
import {
  createFieldInput,
  FormDescription,
  FormLabel,
  FormError,
  FormBlocks,
} from "../../form";

/**
 * Blocks field input component for the admin edit form.
 *
 * Built with `createFieldInput` using `mode="array"`. Renders a dynamic block
 * list with a searchable Dialog picker via `FormBlocks`. Initial open/closed
 * state per block item is controlled by each block item's internal state.
 *
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * from a `<form.Field mode="array">` render prop.
 *
 * @example
 * ```tsx
 * <AppForm form={form}>
 *   <BlocksFieldInput name="body" fieldDef={bodyField} readOnly={false} />
 * </AppForm>
 * ```
 */
export const BlocksFieldInput = createFieldInput<Record<string, unknown>[], BlocksField>(
  ({ name, fieldDef, field, submissionAttempts }) => {
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel field={fieldDef} name={name} />
        <FormBlocks
          name={name}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          field={field as any}
          fieldDef={fieldDef}
          readOnly={fieldDef.admin.readOnly}
          submissionAttempts={submissionAttempts}
        />
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
  "array",
);
```

### `packages/react/src/components/fields/blocks/Cell.tsx` (NEW)

```tsx
"use client";

import type { CellComponentProps, BlocksField } from "@vexcms/core";

/**
 * Blocks field cell component for the admin list-table view.
 *
 * Shows a compact count badge: `"3 blocks"`. Renders `—` when absent or empty.
 */
export function BlocksFieldCell(props: CellComponentProps<BlocksField>) {
  const value = props.value as Record<string, unknown>[] | null | undefined;

  if (!value || !Array.isArray(value) || value.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const { singular, plural } = (props.fieldDef as BlocksField).labels;

  return (
    <span className="text-xs text-muted-foreground">
      {value.length} {value.length === 1 ? singular : plural}
    </span>
  );
}
```

### `packages/react/src/components/fields/blocks/columnDef.tsx` (NEW)

```tsx
import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, BlocksField, TDocument } from "@vexcms/core";
import { BlocksFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a blocks field.
 *
 * Sorting is disabled — blocks fields store heterogeneous arrays which are
 * not meaningfully sortable by Convex indexes.
 */
export function blocksFieldToColumnDef(props: {
  fieldDef: BlocksField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TDocument, unknown> {
  return {
    id:          props.fieldKey,
    accessorKey: props.fieldKey,
    header:      props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => (
      <BlocksFieldCell
        value={row.getValue(props.fieldKey)}
        row={row}
        collection={props.collection}
        fieldDef={props.fieldDef}
        fieldKey={props.fieldKey}
        isTitleField={props.isTitleField ?? false}
      />
    ),

    enableSorting: false,
    enableHiding:  true,
    meta: {
      label:        props.fieldDef.label || props.fieldKey,
      align:        props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
```

### `packages/react/src/components/fields/blocks/index.ts` (NEW)

```ts
export * from "./Input";
export * from "./Cell";
export * from "./columnDef";
```

---

### Step 7 — React adapter + index wiring [agent]

Same pattern as Spec 30 Step 6.

### `packages/react/src/components/fields/index.tsx` (MODIFY)

```ts
+import { BlocksFieldInput, BlocksFieldCell, blocksFieldToColumnDef } from "./blocks";
+export * from "./blocks";
+  [ADMIN_FIELDS.blocks.type]: BlocksFieldInput as ComponentType<InputComponentProps<AdminField>>,
+  [ADMIN_FIELDS.blocks.type]: BlocksFieldCell as ComponentType<CellComponentProps<AdminField>>,
+  case ADMIN_FIELDS.blocks.type:
+    columnDefs.push(blocksFieldToColumnDef({ fieldDef, fieldKey, isTitleField, collection }));
+    break;
```

### `packages/react/src/adapter.ts` (MODIFY)

```ts
+import { BlocksFieldInput, BlocksFieldCell } from "./components/fields/blocks";
+  [ADMIN_FIELDS.blocks.type]: { input: BlocksFieldInput, cell: BlocksFieldCell },
```

### `packages/react/src/index.ts` (MODIFY)

```ts
+export { blocks, defineBlock, RESERVED_BLOCK_FIELD_NAMES } from "@vexcms/core";
+export { BlocksFieldInput, BlocksFieldCell } from "./components/fields";
```

#### Run typecheck
```bash
pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/react typecheck
```

---

### Step 8 — `apps/www` test + browser verify [dev]

Add a blocks field to `pages` collection using `headingBlock` and `paragraphBlock`.

After `vex dev` regenerates:
- `convex/vex.schema.ts` contains `_key: v.string()`, `blockName: v.optional(v.string())`, and `v.union(...)`
- `vex.types.ts` contains `export type HeadingBlock = ...` and `export type ParagraphBlock = ...`
- Admin form shows the block list with Dialog picker; adding, naming, and removing blocks works

---

## Verification

```bash
pnpm --filter @vexcms/core typecheck
pnpm --filter @vexcms/core test
pnpm --filter @vexcms/react typecheck
pnpm typecheck && pnpm test

grep "_key\|blockType\|blockName" apps/www/convex/vex.schema.ts
grep "HeadingBlock\|ParagraphBlock" apps/www/src/vex.types.ts
```

---

## Success Criteria

1. `pnpm --filter @vexcms/core test` passes all new validator and inputSchema tests — including the slug validation, reserved name, duplicate slug, and min/max cases.
2. `pnpm typecheck` is clean across the workspace.
3. `convex/vex.schema.ts` contains `_key: v.string()`, `blockName: v.optional(v.string())`, and a valid `v.union()` discriminated validator.
4. `vex.types.ts` emits one `export type` per block, each including `blockType`, `blockName?`, and `_key`.
5. Admin form shows the Dialog picker with search; block icons render when `admin.icon` is set.
6. `blockName` inline input updates correctly; block items are keyed by `_key` not index.
7. `min`/`max` validation fires correctly in the form — the Add button is disabled at max.
8. Round-trip: saving a document with block data stores and retrieves `blockType`, `blockName`, `_key`, and user fields correctly from Convex.

---

## References

- `packages/core/src/fields/group/` — named interface pattern; `buildBlockInterfaceType` mirrors `buildInterfaceType`
- `packages/core/src/fields/array/` — `mode="array"`, `pushValue`/`removeValue`, min/max
- `packages/react/src/components/form/FormArray.tsx` — base pattern for `FormBlocks`
- `packages/react/src/components/Icon.tsx` — existing `<Icon name={LucideIconName}>` component used in picker
- `packages/react/src/components/ui/dialog.tsx` — existing Dialog component used for picker
- `.pi/agent-docs/specs/30-group-field/spec.md` — direct predecessor; named interface + `getFieldInterfaces` pattern
- `.rebuild/archived-tests/core/defineBlock.test.ts` — master branch reference tests
- `packages/ui/src/components/form/fields/BlocksField.tsx` (master branch) — reference for `_key`, `blockName`, and picker patterns (do not copy directly — different package structure)
