# Spec 31 — Blocks Field

**Status:** Implementation complete through Step 7 (accordion list, no dnd) ✅ | Steps 9–12 add dnd via abstract components | Browser verify (Step 8) remaining
**Depends on:** Spec 30 (group field), Spec 28 (array field)

---

## Overview

Implements the `blocks()` field type and its companion `defineBlock()` config function end-to-end. A blocks field stores an ordered list of heterogeneous objects — each item carries `blockType` (discriminant), `id` (stable UUID for React reconciliation), `blockName` (user-editable label), and the fields defined for that block type. Users define block shapes with `defineBlock()` (exported from `@vexcms/core`), pass them to `blocks()`, and the field generates a discriminated `v.union()` Convex validator, a Zod discriminated union for form validation, and named TypeScript interfaces for every block type. The admin UI renders a single shared `@base-ui/react` `Accordion` with `multiple={true}` — all blocks are `AccordionItem` children inside one accordion, so multiple can be open simultaneously. The field-level `admin.defaultCollapsed` (boolean, default `false`) auto-collapses all blocks on first render. A Dialog-based block picker (searchable, shows block icon) handles adding new blocks.

**Drag-and-drop** is not yet implemented. Steps 9–12 will abstract the dnd patterns from `FormArray` into reusable `Draggable`, `DragHandle`, `DroppableList`, and `DragDropContext` components, then wire them into `FormBlocks` without needing to think about the internal `@hello-pangea/dnd` API directly.

---

## Code Effect Preview

### 1. New `defineBlock()` + `blocks()` API

```ts
// apps/www/src/vexcms/blocks/hero.ts
+import { defineBlock, text, url, checkbox } from "@vexcms/core"
+
+export const heroBlock = defineBlock({
+  slug:  "hero",           // stored as blockType: "hero" on each item
+  label: "Hero",
+  admin: { icon: "Sparkles" },
+  fields: {
+    title:   text({ required: true }),
+    subtitle: text(),
+    primaryCtaLabel:  text({ label: "Primary CTA Label" }),
+    primaryCtaHref:   url({ label: "Primary CTA URL" }),
+  },
+})
```

```ts
// apps/www/src/vexcms/collections/pages.ts
+import { blocks } from "@vexcms/core"
+import { heroBlock, featureBlock, ... } from "../blocks"
+
+body: blocks({
+  label:  "Page Builder",
+  blocks: [heroBlock, featureBlock, ctaBlock, ...],
+  labels: { singular: "section", plural: "sections" },
+}),
```

### 2. Convex schema output — `id`, `blockName`, and discriminated union

```ts
// convex/vex.schema.ts (auto-generated)
+  body: v.optional(v.array(v.union(
+    v.object({
+      blockType: v.literal("hero"),
+      blockName: v.optional(v.string()),
+      id:       v.string(),
+      title:      v.string(),
+      subtitle:   v.optional(v.string()),
+      primaryCtaLabel:  v.optional(v.string()),
+      primaryCtaHref:   v.optional(v.string()),
+    }),
+    v.object({
+      blockType: v.literal("feature"),
+      blockName: v.optional(v.string()),
+      id:       v.string(),
+      icon: v.optional(v.string()),
+      title: v.string(),
+      description: v.optional(v.string()),
+    }),
+  ))),
```

### 3. Generated TypeScript — one interface per block, `id` + `blockName` included

```ts
// vex.types.ts (auto-generated)
+export type HeroBlock = {
+  blockType: "hero"; blockName?: string; id: string
+  title: string; subtitle?: string; primaryCtaLabel?: string; primaryCtaHref?: string
+}
+export type FeatureBlock = {
+  blockType: "feature"; blockName?: string; id: string
+  icon?: string; title: string; description?: string
+}
+export type PageBlock = HeroBlock | FeatureBlock | ...

 export interface Page extends VexDocument {
+  body?: PageBlock[]
 }
```

### 4. TanStack Form paths — underscore-prefixed system fields alongside user fields

```
body[0].blockType  → "hero"      (injected on add, never shown as input)
body[0].id         → "abc123xy"  (injected on add, never shown as input)
body[0].blockName  → "Hero section"  (editable inline in the block header)
body[0].title      → "The CMS for Convex"
body[0].subtitle   → "Real-time content..."
```

---

## API Surface

| Export                         | Package         | Kind      | Description                                                                   |
| ------------------------------ | --------------- | --------- | ----------------------------------------------------------------------------- |
| `defineBlock(options)`         | `@vexcms/core`  | function  | Defines a block type — validates slug, returns `BlockDef`                     |
| `BlockConfigInput`             | `@vexcms/core`  | interface | User-facing input to `defineBlock()`                                          |
| `BlockAdminConfig`             | `@vexcms/core`  | interface | Admin UI config for a block definition (`icon`)                               |
| `BlockConfig`                  | `@vexcms/core`  | interface | Resolved block definition (after defaults)                                    |
| `RESERVED_BLOCK_FIELD_NAMES`   | `@vexcms/core`  | const     | `["blockType", "blockName", "id"]` — forbidden field names in `defineBlock()` |
| `blocks(options)`              | `@vexcms/core`  | function  | Config factory — validates unique slugs, returns `BlocksField`                |
| `BlocksFieldInput`             | `@vexcms/core`  | interface | User-facing config input to `blocks()`                                        |
| `BlocksField`                  | `@vexcms/core`  | interface | Resolved field type (after defaults)                                          |
| `blocksFieldToValidator`       | `@vexcms/core`  | function  | Convex validator string builder                                               |
| `blocksFieldToInputSchema`     | `@vexcms/core`  | function  | Zod discriminated union schema builder                                        |
| `BlocksFieldInput` (component) | `@vexcms/react` | component | Admin form input — block list + dialog picker                                 |
| `BlocksFieldCell`              | `@vexcms/react` | component | Admin list-table cell                                                         |
| `FormBlocks`                   | `@vexcms/react` | component | Block list renderer — exported for custom forms                               |
| `blocks` (re-export)           | `@vexcms/react` | function  | Pass-through re-export of core `blocks()`                                     |
| `defineBlock` (re-export)      | `@vexcms/react` | function  | Pass-through re-export of core `defineBlock()`                                |

---

## Design Decisions

Full rationale in `design-walkthrough.md` § _Decisions Reference_.

| #   | Decision (one line)                                                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | `defineBlock()` and `blocks()` in `@vexcms/core` — pure data; re-exported from `@vexcms/react` as pass-throughs.                                                                                                                 |
| D2  | `blockType` is the stored discriminant — underscore prefix signals it is framework-managed, not a user field.                                                                                                                    |
| D3  | `id: v.string()` injected on every block item — stable UUID for React keys; used for drag-and-drop reorder via `@hello-pangea/dnd`.                                                                                             |
| D4  | `blockName: v.optional(v.string())` injected on every item — stored as `blockName`, displayed as inline text input in the block header; starts as the block's label on creation.                                                 |
| D5  | `RESERVED_BLOCK_FIELD_NAMES = ["blockType", "blockName", "id"]` — `defineBlock()` throws if any field name collides with a framework-injected key.                                                                               |
| D6  | `defineBlock()` validates slug format (`/^[a-zA-Z][a-zA-Z0-9_-]*$/`) — ensures valid Convex `v.literal()` values; throws a descriptive `Error` on failure.                                                                       |
| D7  | `blocks()` validates unique slugs across all block definitions — throws on the first duplicate; surfaces config errors at definition time, not schema gen time.                                                                  |
| D8  | Convex validator uses `v.union()` for multiple block types; degrades to bare `v.object()` for exactly one block type.                                                                                                            |
| D9  | Block interface name defaults to `${slugToPascalCase(slug)}Block` (e.g. `"hero"` → `"HeroBlock"`).                                                                                                                              |
| D10 | `BlockConfig.interfaceType` includes all three framework keys plus user fields: `{ blockType: "hero"; blockName?: string; id: string; title: string }`.                                                                         |
| D11 | `blocks()` optional `interfaceName` emits a union alias: `export type PageBlock = HeroBlock | FeatureBlock | ...`.                                                                                                              |
| D12 | Zod schema uses `z.discriminatedUnion("blockType", [...])` — precise per-variant errors; `min`/`max` enforced on the outer `z.array()`.                                                                                          |
| D13 | `FormBlocks` uses `mode="array"` (same as `FormArray`) — `pushValue`/`removeValue` for add/remove; items keyed by `item.id`, not index.                                                                                          |
| D14 | Block picker is a Dialog with a search input — scales to many block types; shows icon (via existing `<Icon>` component) when `admin.icon` is set.                                                                                |
| D15 | `admin.icon` is typed as `string` in `@vexcms/core` (no React dep); the existing `<Icon name={...}>` component in `@vexcms/react` resolves it to the correct Lucide icon at render time.                                         |
| D16 | `labels: { singular, plural }` on `blocks()` controls UI text in the empty state and item count badge.                                                                                                                           |
| D17 | All blocks share a **single shared** `@base-ui/react` `Accordion` with `multiple={true}`. Each block is an `AccordionItem` with `block.id` as its item `value` (stable). Field-level `admin.defaultCollapsed` (boolean, default `false`) auto-collapses all blocks on first render. Block-level `admin.defaultOpen` (boolean, default `true`) controls individual block initial state. The block header row is the `AccordionTrigger`; the `blockName` input is a sibling with `e.stopPropagation()` to prevent accordion toggle. |
| D18 | `Draggable`/`Droppable` wraps each `BlockRow` (which is an `AccordionItem`) inside the shared `Accordion`. `AccordionItem` `value` is the block's `id` (stable UUID, matches React key). Drag handle (`GripVertical`) gets `dragHandleProps`. Reorder uses `field.swapValues()`. |
| D19 | `blockType`, `blockName`, `id` are never rendered as editable inputs in sub-field loops — they are filtered out when iterating `blockDef.fields`.                                                                                |
| D20 | Block self-reference prevention (a block containing a blocks field with itself) is deferred.                                                                                                                                     |

---

## Out of Scope

- **Block self-reference detection** — cycle validation deferred (D20).
- **`blockStyles` / style tiers** — the master branch's per-block visual styling system is deferred.
- **Duplicate block (copy above/below)** — master has this; deferred.
- **Collapse state persistence to localStorage** — master persists open/closed state; deferred.
- **Custom block editor component** (`admin.components.Editor`) — deferred.
- **`array({ items: blocks({...}) })` combination** — works at config/validator level but UI combination untested.

---

## Target Directory Structure

```
packages/core/src/fields/blocks/
  types.ts            ✅ DONE — BlockAdminConfig, BlockConfigInput, BlockConfig,
                                RESERVED_BLOCK_FIELD_NAMES,
                                BlocksFieldInput, BlocksField
  config.ts           ✅ DONE — defineBlock(), blocks()
  validator.ts        ✅ DONE — blocksFieldToValidator()
  validator.test.ts   ✅ DONE
  inputSchema.ts      ✅ DONE — blocksFieldToInputSchema()
  inputSchema.test.ts ✅ DONE
  index.ts            ✅ DONE — barrel

packages/core/src/fields/
  constants.ts        ✅ DONE — add blocks entry
  types.ts            ✅ DONE — add BlocksField to AdminField union
  index.ts            ✅ DONE — export * from "./blocks"

packages/core/src/fields/validators/
  index.ts            ✅ DONE — add blocks case

packages/core/src/fields/inputSchemas/
  index.ts            ✅ DONE — add blocks case

packages/core/src/collections/
  interfaceGen.ts     ✅ DONE — getFieldInterfaces blocks branch +
                                  collectionConfigToInterface field type ref

packages/react/src/components/form/
  FormBlocks.tsx      ✅ DONE — single shared `@base-ui/react` Accordion list + Dialog picker (no dnd yet)
  index.ts            ✅ DONE — export FormBlocks, FormBlocksProps

packages/react/src/components/dnd/          ⏳ TODO — Steps 9–12
  DragHandle.tsx      ⏳ TODO — Step 10
  context.ts          ⏳ TODO — Step 9 (DraggableContext, DroppableContext, ReorderContext + hooks)
  Droppable.tsx       ⏳ TODO — Step 11
  index.ts            ⏳ TODO — Step 9/10/11

packages/react/src/components/fields/blocks/
  Input.tsx           ✅ DONE — BlocksFieldInput
  Cell.tsx            ✅ DONE — BlocksFieldCell
  columnDef.tsx       ✅ DONE — blocksFieldToColumnDef()
  index.ts            ✅ DONE — barrel

packages/react/src/
  adapter.ts                     ✅ DONE — add blocks to FieldComponentMap
  index.ts                       ✅ DONE — export blocks, defineBlock, components
  components/fields/index.tsx    ✅ DONE — register all three + export * from "./blocks"
```

---

## Implementation Order

### Step 1 — Core types + constants [dev] ✅ DONE

Established all types: `BlockAdminConfig`, `BlockConfigInput`, `BlockConfig`, `RESERVED_BLOCK_FIELD_NAMES`, `BlocksFieldInput`, `BlocksField`, and the `ADMIN_FIELDS.blocks` constant. The `interfaceType` on `BlockConfig` includes all three framework-injected keys (`blockType`, `blockName`, `id`) plus user fields.

### Step 2 — `defineBlock()` + `blocks()` config factories [dev] ✅ DONE

`defineBlock()` validates the slug format and checks for reserved field names. `blocks()` validates uniqueness of slugs across all passed block definitions. Both throw descriptive `Error`s at config definition time.

### Step 3 — Core validator + input schema [dev] ✅ DONE

Every block object in the Convex validator and Zod schema includes `blockType`, `blockName`, and `id` as the first keys before user fields. The Zod schema enforces `min`/`max` on the outer array.

### Step 4 — Core wiring + `interfaceGen.ts` update [dev] ✅ DONE

Added `BlocksField` to the `AdminField` union, `export * from "./blocks"` in the barrel, blocks cases in the validator and inputSchema dispatch functions, and `getFieldInterfaces` / `collectionConfigToInterface` updates for blocks.

### Step 5 — `BlocksFieldInput` + `BlocksFieldCell` + columnDef [dev] ✅ DONE

Created the wrapper component, cell component, and TanStack Table column definition.

### Step 6 — React adapter + index wiring [dev] ✅ DONE

Registered blocks in `adapter.ts`, added exports to `index.ts`, and registered all three block components in the fields index.

---

### Step 7 — `FormBlocks` React component with Accordion [dev] ✅ DONE

Replaces the current `packages/react/src/components/form/FormBlocks.tsx` with a fully-featured accordion implementation using `@base-ui/react` `Accordion multiple={true}`. Each block is an `AccordionItem` inside a single shared accordion, so multiple blocks can be open simultaneously. Block picker is a Dialog with search input (same pattern as existing implementation).

#### Pattern reference

**Accordion pattern** (from `FormGroup.tsx`):
```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"

// Header is the entire trigger (click to expand/collapse)
<Accordion defaultValue={fieldDef.defaultOpen !== false ? [itemValue] : []}>
  <AccordionItem value={itemValue}>
    <AccordionTrigger className="...">
      {/* Label + metadata here */}
    </AccordionTrigger>
    <AccordionContent className="...">
      {/* Content here */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

**Drag-and-drop pattern** (from `FormArray.tsx`):
```tsx
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

// Wrap entire list
<DragDropContext onDragEnd={(res) => {
  if (!res.destination) return;
  field.swapValues(res.source.index, res.destination.index);
}}>
  <Droppable droppableId={name} direction="vertical">
    {(provided, snapshot) => (
      <div ref={provided.innerRef} {...provided.droppableProps}
           className={cn("flex flex-col gap-2", snapshot.isDraggingOver && "bg-border/50")}>
        {items.map((_, index) => (
          <Draggable draggableId={`${name}[${index}]`} index={index} key={index}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.draggableProps}>
                <div {...provided.dragHandleProps}>
                  <GripVertical size={16} />  {/* Drag handle */}
                </div>
                {/* Item content */}
              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
</DragDropContext>
```

#### Block item layout (from AccordionTrigger)

The block header is the `AccordionTrigger` — the entire row is clickable to expand/collapse, EXCEPT the `blockName` inline input which is a sibling `<input>` that does NOT trigger accordion toggle. On small screens, the blockName input extends at least half the width.

Layout:
```
[Drag handle] [Order#] [Chevron] [Type badge] [blockName input -----------] [Remove]
```

- `GripVertical` (drag handle) — `cursor-grab`, gets `dragHandleProps`
- Order number (`1`, `2`, ...) — `text-xs font-mono text-muted-foreground tabular-nums`
- `ChevronDownIcon` / `ChevronRightIcon` — shows open/closed state
- Type badge — `text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded` showing `blockDef.blockType`
- `blockName` input — `flex-1 min-w-0 bg-transparent text-sm font-medium border-none outline-none`; `min-width: 50%` on small screens; placeholder = `blockDef.label`
- Remove button — `TrashIcon`, only when `!readOnly`

#### Block item layout — sub-fields content (AccordionContent)

The expanded content shows all block sub-fields in a `flex flex-col gap-4 p-4 border-t border-border` container. `blockType`, `blockName`, and `id` are never rendered as inputs (filtered when iterating `blockDef.fields`).

#### `buildDefaultBlock` function

When adding a new block via the picker, generate defaults:
```ts
function buildDefaultBlock(blockDef: BlockConfig): GenericBlock {
  const fieldDefaults = Object.fromEntries(
    Object.entries(blockDef.fields).map(([key, subField]) => [
      key,
      subField.defaultValue ?? null,
    ]),
  );
  return {
    blockType: blockDef.blockType,  // slug stored as blockType
    blockName: blockDef.label,      // starts as the block's label
    id: crypto.randomUUID(),
    ...fieldDefaults,
  };
}
```

#### Block Picker Dialog

Same as current implementation: Dialog with search input, filtered block list, shows icon when `blockDef.admin?.icon` is set.

#### `swapValues` on TanStack Form array

The `@tanstack/react-form` field API in mode `"array"` has a `swapValues(indexA, indexB)` method for reordering. This is what `FormArray` uses and `FormBlocks` should use too in the `onDragEnd` handler.

#### Files to overwrite

- [ ] `packages/react/src/components/form/FormBlocks.tsx` (REPLACE with new implementation)
- [ ] `packages/react/src/components/form/index.ts` (verify exports — `FormBlocks`, `FormBlocksProps`)

#### Full implementation

```tsx
"use client";

import { ComponentPropsWithRef, useState } from "react";
import type {
  BlocksField,
  BlockConfig,
  InputComponentProps,
  GenericBlock,
} from "@vexcms/core";
import type { TypedFieldApi } from "./createFieldInput";
import { useContext } from "react";
import { AppFormContext } from "./AppFormContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  TrashIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  SearchIcon,
  LayersIcon,
} from "lucide-react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

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
  field: TypedFieldApi<GenericBlock[]>;
  /** The resolved blocks field definition. */
  fieldDef: BlocksField;
  /** Whether all controls are read-only. Propagated to every sub-field. */
  readOnly: boolean;
  /** Number of form submissions — passed through for validation error display. */
  submissionAttempts: number;
  /** Additional class names for the outer container. */
  className?: string;
}

/** Builds the default value object for a new block of the given type. */
function buildDefaultBlock(blockDef: BlockConfig): GenericBlock {
  const fieldDefaults = Object.fromEntries(
    Object.entries(blockDef.fields).map(([key, subField]) => [
      key,
      subField.defaultValue ?? null,
    ]),
  );
  return {
    blockType: blockDef.blockType,
    blockName: blockDef.label,
    id: crypto.randomUUID(),
    ...fieldDefaults,
  };
}

// ---------------------------------------------------------------------------
// Block Picker Dialog
// ---------------------------------------------------------------------------

function BlockPickerDialog(props: {
  blockDefs: BlockConfig[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (blockDef: BlockConfig) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = props.blockDefs.filter(
    (b) =>
      b.label?.toLowerCase().includes(search.toLowerCase()) ||
      b.blockType.toLowerCase().includes(search.toLowerCase()),
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
            <p className="text-sm text-muted-foreground text-center py-6">
              No blocks found
            </p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((blockDef) => (
                <button
                  key={blockDef.blockType}
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
                      <Icon
                        name={blockDef.admin.icon as any}
                        className="size-4 text-muted-foreground"
                      />
                    ) : (
                      <LayersIcon className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {blockDef.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {blockDef.blockType}
                      {Object.keys(blockDef.fields).length > 0 &&
                        ` · ${Object.keys(blockDef.fields).length} field${
                          Object.keys(blockDef.fields).length === 1 ? "" : "s"
                        }`}
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
// Single Block Item — Accordion + Draggable
// ---------------------------------------------------------------------------

function BlockItem(props: {
  block: Record<string, unknown>;
  blockDef: BlockConfig;
  index: number;
  name: string;
  readOnly: boolean;
  submissionAttempts: number;
  draggableProps: Record<string, unknown>;
  dragHandleProps: Record<string, unknown>;
  innerRef: (el: HTMLDivElement | null) => void;
  onRemove: () => void;
  onBlockNameChange: (name: string) => void;
}) {
  const { block, blockDef, index, name } = props;
  const subFields = Object.entries(blockDef.fields);

  // Each block item gets its own Accordion with one item.
  // The trigger value is the block's id so it's stable across reorders.
  const itemValue = block.id as string;

  return (
    <Draggable
      draggableId={`${name}[${index}]`}
      index={index}
    >
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="rounded-sm border border-border bg-background overflow-hidden"
        >
          <Accordion
            className="border-none"
            defaultValue={[itemValue]}
            type="single"
            collapsible
          >
            <AccordionItem value={itemValue} className="border-none">
              {/* ── Header row — entire AccordionTrigger, EXCEPT blockName input ── */}
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/40">
                {/* Drag handle */}
                <div
                  className="cursor-grab shrink-0"
                  {...props.dragHandleProps}
                >
                  <GripVerticalIcon className="size-4 text-muted-foreground/40" />
                </div>

                {/* Order number */}
                <span className="text-xs font-mono text-muted-foreground tabular-nums w-4 text-center shrink-0">
                  {index + 1}
                </span>

                {/* Chevron + Type badge — wrapped in trigger so clicking anywhere expands */}
                <AccordionTrigger className="p-0.5 shrink-0 hover:no-underline">
                  <div className="flex items-center gap-1.5">
                    <ChevronRightIcon className="size-4 text-muted-foreground [&[data-state=open]]:hidden" />
                    <ChevronDownIcon className="size-4 text-muted-foreground hidden [&[data-state=open]]:block" />
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                      {blockDef.blockType}
                    </span>
                  </div>
                </AccordionTrigger>

                {/* blockName inline input — NOT part of the trigger, so clicking it
                    doesn't toggle the accordion. At least 50% width on small screens. */}
                <input
                  type="text"
                  value={(block.blockName as string) ?? ""}
                  onChange={(e) => props.onBlockNameChange(e.target.value)}
                  disabled={props.readOnly}
                  placeholder={blockDef.label}
                  className="flex-1 min-w-[50%] sm:min-w-[60%] bg-transparent text-sm font-medium border-none outline-none focus:ring-0 p-0 truncate placeholder:text-muted-foreground disabled:opacity-50"
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Remove button */}
                {!props.readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onRemove();
                    }}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${blockDef.label} block`}
                  >
                    <TrashIcon className="size-3.5" />
                  </Button>
                )}
              </div>

              {/* ── Sub-fields content ── */}
              <AccordionContent className="px-3 pt-3">
                <div className="flex flex-col gap-4 border-t border-border pt-3">
                  {subFields.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      This block has no configurable fields.
                    </p>
                  ) : (
                    subFields.map(([fieldKey, subFieldDef]) => {
                      const SubInput = fieldToInputComponent(subFieldDef.type);
                      if (!SubInput) return null;
                      return (
                        <SubInput
                          key={fieldKey}
                          name={`${name}[${index}].${fieldKey}`}
                          fieldDef={subFieldDef as any}
                          readOnly={props.readOnly || subFieldDef.admin.readOnly}
                        />
                      );
                    })
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </Draggable>
  );
}

// ---------------------------------------------------------------------------
// FormBlocks
// ---------------------------------------------------------------------------

/**
 * Renders a blocks field as a drag-and-drop accordion list with a searchable block picker.
 *
 * Each item is keyed by `item.id` (a stable UUID injected on creation) —
 * not by array index — so React reconciliation works correctly when items are
 * removed or reordered. Each item is a shadcn `Accordion` — the header row is
 * the trigger (click to expand/collapse), except the `blockName` input which
 * is a sibling that does not trigger the accordion. Drag-and-drop uses
 * `@hello-pangea/dnd` (same as `FormArray`). `blockType`, `blockName`, and
 * `id` are never rendered as editable sub-field inputs.
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
}: InputComponentProps<BlocksField> & {
  field: TypedFieldApi<GenericBlock[]>;
  submissionAttempts: number;
} & ComponentPropsWithRef<"div">) {
  const form = useContext(AppFormContext);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!form) {
    throw new Error(
      `FormBlocks "${name}" must be rendered inside <AppForm> or have a form context available.`,
    );
  }

  const items = (field.state.value ?? []) as GenericBlock[];
  const blockDefMap = new Map(
    fieldDef.blocks.map((b) => [b.blockType, b]),
  );
  const { singular, plural } = fieldDef.labels;
  const atMax = fieldDef.max !== undefined && items.length >= fieldDef.max;

  function handleAdd(blockDef: BlockConfig) {
    field.pushValue(buildDefaultBlock(blockDef));
  }

  function updateBlockName(index: number, blockName: string) {
    const current = items[index];
    if (!current) return;
    const updated = [...items];
    updated[index] = { ...current, blockName: blockName };
    field.handleChange(updated);
  }

  const rawError = field.state.meta.errors[0];
  const errorMessage =
    typeof rawError === "string" ? rawError : rawError?.message;
  const showError =
    (field.state.meta.isTouched || submissionAttempts > 0) && errorMessage;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Empty state */}
      {items.length === 0 && (
        <div className="rounded-sm border-2 border-dashed border-border py-8 text-center">
          <LayersIcon className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No {plural} yet.</p>
        </div>
      )}

      {/* Block list — drag-and-drop */}
      {items.length > 0 && (
        <DragDropContext
          onDragStart={() => {
            document.body.style.overflowX = "hidden";
          }}
          onDragEnd={(res) => {
            document.body.style.overflowX = "";
            if (!res.destination) return;
            field.swapValues(res.source.index, res.destination.index);
          }}
        >
          <Droppable droppableId={name} direction="vertical">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                className={cn(
                  "flex flex-col gap-2",
                  snapshot.isDraggingOver && "bg-border/50 rounded-sm",
                )}
                {...provided.droppableProps}
              >
                {items.map((item, index) => {
                  const blockSlug = item.blockType as string;
                  const blockDef = blockDefMap.get(blockSlug);
                  const itemKey = (item.id as string) ?? String(index);

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
                      onBlockNameChange={(blockName) =>
                        updateBlockName(index, blockName)
                      }
                      // These are passed from the Draggable provided prop
                      draggableProps={{}}
                      dragHandleProps={{}}
                      innerRef={() => {}}
                    />
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
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

> ⚠️ **Note:** The `BlockItem` component above is simplified. The `draggableProps`, `dragHandleProps`, and `innerRef` need to be properly wired through the Draggable provided API. See the actual `FormArray.tsx` for the complete pattern where these are spread from `provided` directly onto the DOM elements. The implementation above shows the structure and accordion integration — wire the drag props properly per the `FormArray` pattern.

#### Verify — run typecheck and tests

```bash
pnpm --filter @vexcms/react typecheck
pnpm --filter @vexcms/react test
```

---

### Step 8 — `apps/www` test + browser verify [dev]

1. Open the admin panel at `http://localhost:3020/admin`
2. Navigate to a page with a blocks field (e.g. `/admin/pages`)
3. Create or edit a page
4. Verify:
   - **Add block**: Click "Add section" → Dialog opens → search/filter works → clicking a block adds it
   - **Block accordion**: Click the header (not the input) → block expands/collapses → chevron rotates
   - **blockName input**: Click the text input in the header → accordion does NOT toggle → editing the name works
   - **Remove block**: Click the trash icon → block is removed → list updates
   - **Small screen input**: Resize to mobile → blockName input still extends at least 50% of the header width
   - **Sub-fields**: Open a block → sub-fields render correctly → nested groups and arrays work
   - **Validation**: Submit with required fields empty → error messages appear

**Drag-and-drop** will be verified in Step 12 after the dnd abstraction components are built.

---

## Continue from Step 8

Steps 9–12 add drag-and-drop to `FormBlocks` by first abstracting the `@hello-pangea/dnd` patterns from `FormArray` into reusable components (`Draggable`, `DragHandle`, `DroppableList`, `DragDropContext`). Once those are built, wiring dnd into `FormBlocks` becomes a matter of using the new components instead of calling the dnd library directly.

---

## Steps 9–12 — Drag-and-Drop via Abstract Components [dev]

The `@hello-pangea/dnd` patterns in `FormArray` are repeated boilerplate every time a list needs drag-and-drop. Steps 9–12 abstract this into small, composable components that make dnd setup a one-liner.

**Design principle:**
- `Draggable` mirrors the pangea `Draggable` API — accepts `id`, `index`, `onReorder`. Handles its own `onDragEnd` internally via a shared `reorderRef`. Parent provides `onReorder`; `Draggable` calls it on drop. No inline `onDragEnd` in parent components.
- `Droppable` mirrors the pangea `Droppable` API — accepts `id`, `direction`. Handles `DragDropContext` + `onDragStart`/`onDragEnd` boilerplate internally. Parent just provides `id`; no inline handlers.
- `DragHandle` reads `dragHandleProps` from the nearest `Draggable` context. Falls back to props if used outside a `Draggable` (for maximum flexibility). Renders default `GripVertical` if no children provided.
- Children are direct React children (no render prop functions). Context is scoped per-provider-instance — multiple `Draggable`/`Droppable` instances on the same page are fully isolated.

```tsx
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

// Each list item:
<Draggable draggableId={`${name}[${index}]`} index={index} key={itemKey}>
  {(provided) => (
    <div
      ref={provided.innerRef}
      className="flex items-center gap-2 px-2"
      {...provided.draggableProps}
    >
      <div className="cursor-grab" {...provided.dragHandleProps}>
        <GripVertical size={16} />
      </div>
      <div className="flex-1">
        {/* item content */}
      </div>
    </div>
  )}
</Draggable>

// The list wrapper:
<Droppable droppableId={name} direction="vertical">
  {(provided, snapshot) => (
    <div
      ref={provided.innerRef}
      className={cn("flex flex-col gap-2", snapshot.isDraggingOver && "bg-border/50")}
      {...provided.droppableProps}
    >
      {items.map((_, index) => (...))}
      {provided.placeholder}
    </div>
  )}
</Droppable>

// The context wrapper:
<DragDropContext
  onDragStart={() => { document.body.style.overflowX = "hidden" }}
  onDragEnd={(res) => {
    document.body.style.overflowX = ""
    if (!res.destination) return
    onReorder(res.source.index, res.destination.index)
  }}
/>
```

---

### Step 9 — `Draggable` [dev]

**File:** `packages/react/src/components/dnd/Draggable.tsx`

`Draggable` provides `DraggableContext` to any child that needs `dragHandleProps` or `isDragging`.
`ReorderContext` carries a shared `reorderRef` that `Draggable` writes to and `Droppable` reads from on drop.

`Draggable` passes `provided` and `snapshot` as props to its children, giving them full access to the pangea dnd API. The child component's root element MUST:
1. Set `ref={provided.innerRef}` on an HTMLElement
2. Spread `...provided.draggableProps` on that same HTMLElement

```tsx
// Child component receiving provided + snapshot as props
function MyItem({ provided, snapshot }) {
  return (
    <div
      ref={provided.innerRef}                    // ← required by dnd
      {...provided.draggableProps}               // ← required by dnd
      className={snapshot.isDragging ? "opacity-50" : ""}
    >
      {snapshot.isDragging && <div>Dragging!</div>}
    </div>
  )
}

// Parent renders Draggable passing the child
<Draggable id="item-1" index={0} onReorder={swap}>
  <MyItem />
</Draggable>
```

If the child does not set `ref={provided.innerRef}` on an HTMLElement, dnd throws the invariant error "provided.innerRef has not been provided with an HTMLElement". The contract is strict.

Hooks:
```ts
// Access dragHandleProps + isDragging. Throws if not inside <Draggable>.
export function useDraggableContext(): DraggableContextValue

// Write the reorder function to the shared ref. Throws if not inside a DragDropContext tree.
export function useReorderContext(): MutableRefObject<((from: number, to: number) => void) | null>
```

`Draggable` mirrors the pangea `Draggable` API. Props:
- `id: string` — the `draggableId`
- `index: number`
- `onReorder: (from: number, to: number) => void` — the parent's reorder function (e.g. `field.swapValues.bind(field)`)
- `children?: ReactElement` — must be a single React element (not a plain string/number); receives `provided` and `snapshot` as props
- `className?: string`

```tsx
// context.ts — shared hooks and context
import { createContext, useContext, MutableRefObject } from "react"
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd"

// ── DraggableContext ────────────────────────────────────────────────────────
export interface DraggableContextValue {
  dragHandleProps: DraggableProvidedDragHandleProps
  isDragging: boolean
}
export const DraggableContext = createContext<DraggableContextValue | null>(null)

/**
 * Access dragHandleProps and isDragging from the nearest <Draggable>.
 * @throws {Error} if used outside a <Draggable> component tree
 */
export function useDraggableContext(): DraggableContextValue {
  const ctx = useContext(DraggableContext)
  if (!ctx) throw new Error("useDraggableContext must be used inside <Draggable>")
  return ctx
}

// ── ReorderContext (internal) ───────────────────────────────────────────────
export const ReorderContext = createContext<MutableRefObject<((from: number, to: number) => void) | null> | null>(null)

/**
 * Write the reorder function to the shared ref. Called by <Draggable> on mount.
 * @throws {Error} if used outside a DragDropContext tree (i.e. not inside <Droppable>)
 */
export function useReorderContext(): MutableRefObject<((from: number, to: number) => void) | null> {
  const ctx = useContext(ReorderContext)
  if (!ctx) throw new Error("useReorderContext must be used inside a DragDropContext tree (wrap with <Droppable>)")
  return ctx
}

// ── Draggable ───────────────────────────────────────────────────────────────
import { Draggable } from "@hello-pangea/dnd"
import { useEffect, cloneElement, isValidElement } from "react"

interface DraggableProps {
  id: string
  index: number
  onReorder: (from: number, to: number) => void
  children: React.ReactElement   // must be a single element, receives provided + snapshot as props
  className?: string
}

export function Draggable({ id, index, onReorder, children, className }: DraggableProps) {
  const reorderRef = useReorderContext()  // throws if no ReorderContext ancestor

  useEffect(() => {
    reorderRef.current = onReorder
  }, [onReorder, reorderRef])

  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <DraggableContext.Provider
          value={{
            dragHandleProps: provided.dragHandleProps,
            isDragging: snapshot.isDragging,
          }}
        >
          {/* Pass provided + snapshot as props to children */}
          {isValidElement(children)
            ? cloneElement(children, { provided, snapshot })
            : children}
        </DraggableContext.Provider>
      )}
    </Draggable>
  )
}
```

The child receives `provided` and `snapshot` as props. The child's root HTMLElement must set `ref={provided.innerRef}` and spread `...provided.draggableProps`:

Context is scoped per `Draggable` instance — multiple `Draggable` components on the same page are fully isolated, each providing its own `dragHandleProps` and `isDragging` to its subtree.

Usage — two modes:

**Mode 1: Render function** — user controls the container div with refs:
```tsx
<Draggable id={`${name}[${index}]`} index={index} onReorder={field.swapValues.bind(field)}>
  {({ provided, snapshot }) => (
    <div
      ref={provided.innerRef}                      // ← required by dnd
      {...provided.draggableProps}                 // ← required by dnd
      className={snapshot.isDragging ? "opacity-50" : ""}
    >
      <DragHandle />                              {/* reads dragHandleProps from context */}
      content
    </div>
  )}
</Draggable>
```

**Mode 2: ReactElement** — wrapper div handles refs, element receives provided + snapshot as props:
```tsx
// Child component — receives provided + snapshot as props
function BlockRow({ provided, snapshot }: { provided: any; snapshot: any }) {
  return (
    <div className="rounded-sm border bg-background overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40">
        <DragHandle />                             {/* reads dragHandleProps from context */}
        <span className="text-xs font-mono">{snapshot.isDragging ? "dragging" : "idle"}</span>
      </div>
      <div className="px-3 py-2">content</div>
    </div>
  )
}

// Parent — wrapper div handles ref + draggableProps automatically
<Draggable id={`${name}[${index}]`} index={index} onReorder={field.swapValues.bind(field)}>
  <BlockRow />
</Draggable>
```

Hooks available in `context.ts`:
```ts
useDraggableContext()  // throws "must be used inside <Draggable>"
useReorderContext()    // throws "must be used inside a DragDropContext tree"
```

**Tasks:**
- [ ] Create `packages/react/src/components/dnd/context.ts` (all three contexts + all three hooks with error messages)
- [ ] Create `packages/react/src/components/dnd/Draggable.tsx`
- [ ] Export from `packages/react/src/components/dnd/index.ts`
- [ ] Update `FormArray.tsx` to use `Draggable` — verify dnd still works
- [ ] Typecheck passes

---

### Step 10 — `DragHandle` [dev]

**File:** `packages/react/src/components/dnd/DragHandle.tsx`

Reads `dragHandleProps` from the nearest `DraggableContext` (context-first). Falls back to the `dragHandleProps` prop if used outside a `Draggable` — for maximum flexibility. Renders default `GripVertical` icon if no children provided.

Props:
- `dragHandleProps?: DraggableProvidedDragHandleProps` — fallback if no DraggableContext found
- `children?: ReactNode` — if provided, renders children with `dragHandleProps` spread on the wrapper div; if absent, renders a default `<GripVertical size={16}/>`
- `className?: string` — always applied to the outer wrapper div

```tsx
import { GripVertical } from "lucide-react"

export function DragHandle({ dragHandleProps, children, className }: {
  dragHandleProps?: DraggableProvidedDragHandleProps
  children?: React.ReactNode
  className?: string
}) {
  // Try context first, fall back to props
  const ctx = useContext(DraggableContext)
  const resolvedProps = ctx?.dragHandleProps ?? dragHandleProps ?? {}

  if (children) {
    return (
      <div className={cn("cursor-grab shrink-0", className)} {...resolvedProps}>
        {children}
      </div>
    )
  }
  return (
    <div className={cn("cursor-grab shrink-0", className)} {...resolvedProps}>
      <GripVertical size={16} />
    </div>
  )
}
```

Usage:
```tsx
<DragHandle />                                               {/* reads from context, renders default icon */}
<DragHandle className="mt-1"><Icon name="GripVertical" /></DragHandle>  {/* reads from context, custom content */}
<DragHandle dragHandleProps={customProps} />                 {/* uses props directly — works outside Draggable */}
```

**Tasks:**
- [ ] Create `packages/react/src/components/dnd/DragHandle.tsx`
- [ ] Export from `packages/react/src/components/dnd/index.ts`
- [ ] Update `FormArray.tsx` to use `DragHandle` — verify dnd still works
- [ ] Typecheck passes

---

### Step 11 — `Droppable` [dev]

**File:** `packages/react/src/components/dnd/Droppable.tsx`

`Droppable` mirrors the pangea `Droppable` API. It wraps `DragDropContext` + `Droppable` and provides `DroppableContext` to its children. It creates the shared `reorderRef` and passes it via `ReorderContext`. Parent provides only `id` and `direction` — no inline handlers needed.

`Droppable` passes `provided` and `snapshot` as props to its children. The child component's root element MUST:
1. Set `ref={provided.innerRef}` on an HTMLElement
2. Spread `...provided.droppableProps` on that same HTMLElement

```tsx
// Child component receiving provided + snapshot as props
function ListContainer({ provided, snapshot }) {
  return (
    <div
      ref={provided.innerRef}                   // ← required by dnd
      {...provided.droppableProps}              // ← required by dnd
      className={snapshot.isDraggingOver ? "bg-muted" : ""}
    >
      children here
    </div>
  )
}

<Droppable id="my-list" direction="vertical">
  <ListContainer />
</Droppable>
```

Hooks:
```ts
// Access isDraggingOver + innerRef + droppableProps. Throws if not inside <Droppable>.
export function useDroppableContext(): DroppableContextValue
```

Props:
- `id: string` — the `droppableId`
- `direction?: "vertical" | "horizontal"` — default `"vertical"`
- `children: ReactElement` — must be a single React element; receives `provided` and `snapshot` as props

```tsx
// context.ts (additional exports)
export interface DroppableContextValue {
  droppableProps: object
  innerRef: (node: HTMLElement | null) => void
  isDraggingOver: boolean
}
export const DroppableContext = createContext<DroppableContextValue | null>(null)

/**
 * Access isDraggingOver, innerRef, and droppableProps from the nearest <Droppable>.
 * @throws {Error} if used outside a <Droppable> component tree
 */
export function useDroppableContext(): DroppableContextValue {
  const ctx = useContext(DroppableContext)
  if (!ctx) throw new Error("useDroppableContext must be used inside <Droppable>")
  return ctx
}

// Droppable.tsx
import { DragDropContext, Droppable } from "@hello-pangea/dnd"
import { useRef, cloneElement, isValidElement } from "react"
import { DroppableContext, ReorderContext } from "./context"

interface DroppableProps {
  id: string
  direction?: "vertical" | "horizontal"
  children: React.ReactElement   // receives provided + snapshot as props
}

export function Droppable({ id, direction = "vertical", children }: DroppableProps) {
  const reorderRef = useRef<((from: number, to: number) => void) | null>(null)

  return (
    <ReorderContext.Provider value={reorderRef}>
      <DragDropContext
        onDragStart={() => { document.body.style.overflowX = "hidden" }}
        onDragEnd={(res) => {
          document.body.style.overflowX = ""
          if (!res.destination) return
          reorderRef.current?.(res.source.index, res.destination.index)
        }}
      >
        <Droppable droppableId={id} direction={direction}>
          {(provided, snapshot) => (
            <DroppableContext.Provider
              value={{
                droppableProps: provided.droppableProps,
                innerRef: provided.innerRef,
                isDraggingOver: snapshot.isDraggingOver,
              }}
            >
              {isValidElement(children)
                ? cloneElement(children, { provided, snapshot })
                : children}
              {provided.placeholder}
            </DroppableContext.Provider>
          )}
        </Droppable>
      </DragDropContext>
    </ReorderContext.Provider>
  )
}
```

Context is scoped per `Droppable` instance — multiple `Droppable` components on the same page are fully isolated, each providing its own `isDraggingOver`, `innerRef`, and `droppableProps` to its subtree.

Hook available:
```ts
useDroppableContext()  // throws "must be used inside <Droppable>"
```

Usage — two modes:

**Mode 1: Render function** — user controls the container div:
```tsx
<Droppable id={name}>
  {({ provided, snapshot }) => (
    <div
      ref={provided.innerRef}                   // ← required by dnd
      {...provided.droppableProps}              // ← required by dnd
      className={snapshot.isDraggingOver ? "bg-border/50" : ""}
    >
      {/* blocks rendered here */}
    </div>
  )}
</Droppable>
```

**Mode 2: ReactElement** — wrapper handles refs automatically:
```tsx
import { Droppable, Draggable, DragHandle } from "../dnd"

function BlockListContainer({ provided, snapshot }: { provided: any; snapshot: any }) {
  return (
    <div className="flex flex-col gap-2">
      {/* blocks rendered here */}
    </div>
  )
}

<Droppable id={name}>
  <BlockListContainer />
</Droppable>
```

Note: for clean JSX, extract the container div into a sub-component that calls `useDroppableContext()` once.

**Tasks:**
- [ ] Create `packages/react/src/components/dnd/Droppable.tsx` (imports ReorderContext + DroppableContext from context.ts)
- [ ] Export from `packages/react/src/components/dnd/index.ts`
- [ ] Update `FormArray.tsx` to use `Droppable` — verify dnd still works
- [ ] Typecheck passes

---

### Step 12 — Wire dnd into `FormBlocks` [dev]

**File:** `packages/react/src/components/form/FormBlocks.tsx`

Wire `Droppable`, `Draggable`, and `DragHandle` into `FormBlocks`. Each `AccordionItem` (block) becomes a `Draggable`. The outer block list becomes a `Droppable`.

`Droppable` handles all `DragDropContext` logic internally. `Draggable` handles its own `onDragEnd` via the shared `reorderRef`. `FormBlocks` just renders the components — no inline drag handlers, no `onDragEnd`, no `onReorder` binding in the JSX return.

Extract the container div into a sub-component so `useDroppableContext()` can be called cleanly:

```tsx
// Container — receives provided + snapshot as props, sets ref + spreads props on root
function BlockListContainer({ provided, snapshot, children }: {
  provided: { innerRef: (node: HTMLElement | null) => void; droppableProps: object }
  snapshot: { isDraggingOver: boolean }
  children: React.ReactNode
}) {
  return (
    <div
      ref={provided.innerRef}
      className={cn("flex flex-col gap-2", snapshot.isDraggingOver && "bg-border/50")}
      {...provided.droppableProps}
    >
      {children}
    </div>
  )
}

// In FormBlocks return — no inline handlers, no unrelated logic
<Droppable id={name}>
  <BlockListContainer>
    <Accordion multiple={true} defaultValue={defaultOpenBlockIds} className="w-full">
      {items.map((item, index) => {
        const itemKey = (item.id as string) ?? String(index)
        return (
          <Draggable
            key={itemKey}
            id={`${name}[${index}]`}
            index={index}
            onReorder={field.swapValues.bind(field)}
          >
            <AccordionItem value={itemKey} className="rounded-sm border border-border bg-background overflow-hidden">
              {/* Header row */}
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/40">
                <DragHandle />                                          {/* reads dragHandleProps from context */}
                <span className="text-xs font-mono ...">{index + 1}</span>
                <AccordionTrigger>...</AccordionTrigger>
                <div className="flex-1 ..."><Input .../></div>        {/* blockName */}
                <Button ...><TrashIcon /></Button>
              </div>
              <AccordionContent>...</AccordionContent>
            </AccordionItem>
          </Draggable>
        )
      })}
    </Accordion>
  </BlockListContainer>
</Droppable>
```

**Tasks:**
- [ ] Add imports: `Droppable`, `Draggable`, `DragHandle`
- [ ] Update `BlockListContainer` to receive `provided` + `snapshot` as props (from `Droppable`) — sets `ref={provided.innerRef}` and spreads `...provided.droppableProps` on its root div
- [ ] Wrap block list in `<Droppable id={name}>` — no `onReorder` prop on `Droppable`
- [ ] Wrap each block in `<Draggable id={...} index={...} onReorder={field.swapValues.bind(field)}>`
- [ ] Use `<DragHandle />` in the header (no props needed — reads from context)
- [ ] `FormBlocks` works in the browser — drag blocks to reorder
- [ ] Typecheck passes
- [ ] Browser verify: drag blocks to reorder, verify order numbers update

---

### Step 13 — Persist group accordion state across DragDropContext remounts [bug fix]

**Files:**
- `packages/react/src/components/ui/dnd/DndProvider.tsx`
- `packages/react/src/components/form/FormGroup.tsx`

**Problem:**

`DndProvider` uses `<DragDropContext key={dndKey}>` to remount the context after every successful drag — the only reliable way to reset @hello-pangea/dnd's stale position registry. Because `DragDropContext` is a keyed ancestor, every component in its subtree unmounts and remounts on drag end. `FormGroup` renders an uncontrolled `<Accordion defaultValue={...}>`. On remount, `defaultValue` is re-applied from `fieldDef.defaultOpen`. For groups with `defaultOpen: false`, this always re-closes the accordion — discarding any open state the user set before the drag.

**Solution:**

Add a `useRef(new Map<string, string[]>())` to `DndProvider` **outside** `<DragDropContext key={dndKey}>`. It is never part of the keyed subtree so it survives every remount. Expose it via a new context. `FormGroup` switches from uncontrolled (`defaultValue`) to controlled (`value` + `onValueChange`), seeding its `useState` from the ref on every mount and writing back on every toggle.

---

#### Change 1 — `DndProvider.tsx`

Add `DndAccordionStateContext`, `useDndAccordionState`, `accordionStateRef`, and place the new provider **above** `<DragDropContext key={dndKey}>`:

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";

// --- existing DndRegistryContext (unchanged) ---

/**
 * Stable store for group accordion open state, keyed by accordion itemValue
 * (field path, e.g. "seo" or "settings-0"). Lives outside <DragDropContext
 * key={dndKey}> so it survives every post-drag remount.
 */
export const DndAccordionStateContext = createContext<
  MutableRefObject<Map<string, string[]>> | null
>(null);

export function useDndAccordionState(): MutableRefObject<Map<string, string[]>> | null {
  return useContext(DndAccordionStateContext);
}

export function DndProvider({ children }: { children: ReactNode }) {
  const registry = useRef(new Map<string, (from: number, to: number) => void>());
  const accordionStateRef = useRef(new Map<string, string[]>());
  const [activeDroppableId, setActiveDroppableId] = useState<string | null>(null);
  const [dndKey, setDndKey] = useState(0);

  const register = useCallback(
    (id: string, handler: (from: number, to: number) => void): (() => void) => {
      registry.current.set(id, handler);
      return () => { registry.current.delete(id); };
    },
    [],
  );

  return (
    <DndAccordionStateContext.Provider value={accordionStateRef}>
      <DndRegistryContext.Provider value={{ register, activeDroppableId }}>
        <DragDropContext
          key={dndKey}
          onDragStart={(result) => {
            document.body.style.overflowX = "hidden";
            setActiveDroppableId(result.source.droppableId);
          }}
          onDragEnd={(result) => {
            document.body.style.overflowX = "";
            setActiveDroppableId(null);
            if (!result.destination) return;
            if (result.source.droppableId !== result.destination.droppableId) return;
            const handler = registry.current.get(result.source.droppableId);
            handler?.(result.source.index, result.destination.index);
            setDndKey((k) => k + 1);
          }}
        >
          {children}
        </DragDropContext>
      </DndRegistryContext.Provider>
    </DndAccordionStateContext.Provider>
  );
}
```

`useDndAccordionState` is automatically exported via the existing `export * from "./DndProvider"` in `dnd/index.ts` — no change needed there.

---

#### Change 2 — `FormGroup.tsx`

Add `useState` to the React import. Add `useDndAccordionState` import. Replace `defaultValue` with controlled `value` + `onValueChange`:

```tsx
import { useContext, useState } from "react";       // add useState
import { useDndAccordionState } from "../ui/dnd";   // new import

export function FormGroup({ name, fieldDef, index, ... }) {
  // ...existing form context check and subFields setup unchanged...

  const itemValue = index !== undefined ? `${name}-${index}` : name;

  const accordionStateRef = useDndAccordionState();

  // Seed from stable ref on every mount (including post-drag remounts).
  // Falls back to fieldDef.defaultOpen only on first page load when no
  // entry exists yet.
  const [openItems, setOpenItems] = useState<string[]>(() => {
    const stored = accordionStateRef?.current.get(itemValue);
    if (stored !== undefined) return stored;
    return fieldDef.defaultOpen !== false ? [itemValue] : [];
  });

  function handleValueChange(value: string[]) {
    setOpenItems(value);
    accordionStateRef?.current.set(itemValue, value);
  }

  return (
    <Accordion
      className={cn("rounded-sm border-2 border-border", className)}
      value={openItems}             // was: defaultValue={fieldDef.defaultOpen !== false ? [itemValue] : []}
      onValueChange={handleValueChange}
    >
      {/* rest of JSX unchanged */}
    </Accordion>
  );
}
```

---

**Behaviour after this change:**

| Scenario | Result |
|---|---|
| Page load, `defaultOpen: false` | Accordion starts closed (store empty → falls back to `fieldDef.defaultOpen`) |
| Page load, `defaultOpen: true` | Accordion starts open |
| User opens accordion, reorders array inside group | Accordion stays open |
| User closes accordion, reorders | Accordion stays closed |
| Page refresh | Store is a fresh `useRef` → empty → `fieldDef.defaultOpen` applies again |

**Tasks:**
- [ ] In `DndProvider.tsx`: add `MutableRefObject` to React imports
- [ ] In `DndProvider.tsx`: add `DndAccordionStateContext` + `useDndAccordionState` above `DndRegistryContext`
- [ ] In `DndProvider.tsx`: add `accordionStateRef = useRef(new Map<string, string[]>())` inside `DndProvider`
- [ ] In `DndProvider.tsx`: wrap return with `<DndAccordionStateContext.Provider value={accordionStateRef}>` as the outermost wrapper
- [ ] In `FormGroup.tsx`: add `useState` to React import
- [ ] In `FormGroup.tsx`: add `import { useDndAccordionState } from "../ui/dnd"`
- [ ] In `FormGroup.tsx`: add `accordionStateRef`, `openItems` state, `handleValueChange`
- [ ] In `FormGroup.tsx`: replace `defaultValue={...}` with `value={openItems}` and add `onValueChange={handleValueChange}`
- [ ] Verify: open a `defaultOpen: false` group, reorder an array inside it → accordion stays open
- [ ] Verify: page refresh resets accordion to closed (matches `defaultOpen: false`)

---

### Step 14 — Merge DnD contexts and add stable accordion keys for reordered array items [bug fix + refactor]

**Files:**
- `packages/react/src/components/ui/dnd/DndProvider.tsx`
- `packages/react/src/components/ui/dnd/useAccordionDndState.ts` ← new hook
- `packages/react/src/components/ui/dnd/Droppable.tsx`
- `packages/react/src/components/form/FormGroup.tsx`

**Problem:**

Step 13 stores accordion open/closed state in a `Map<string, string[]>` keyed by `itemValue = "${name}-${index}"`. When array items are reordered, the `index` of each item changes. FormGroup remounts at the new index, computes a new key, finds no entry under the new key, and falls back to `fieldDef.defaultOpen`. Result: item 1 (open) moves to position 2 — the store still has `"group-1" = open` but the component now looks up `"group-2"` and finds nothing.

There are also three separate contexts (`DndRegistryContext`, `DndAccordionStateContext`, proposed `DndItemStableKeysContext`) all living in the same provider, all accessed together by the same components. This is unnecessary — one context carries everything.

**Solution:**

**Part A — Merge all three contexts into one `DndContext`.**

One `createContext`, one `useDndContext()` hook, one `DndContext.Provider`. The value carries `register`, `activeDroppableId`, `accordionStateRef` (from Step 13), and the new `itemStableKeysRef`. The `accordionStateRef` type is simplified to `Map<string, boolean>` — storing open/closed as a boolean is cleaner than `string[]`.

`Droppable` currently reads from `useDndRegistry()`. That function is kept as a shim returning the relevant fields from the merged context, so `Droppable.tsx` needs no changes.

**Part B — Add `itemStableKeysRef` and `moveItemStableKey`.**

`itemStableKeysRef` is a `Map<droppableId, UUID[]>` — an ordered list of stable UUIDs, one per slot in each droppable. Slots are created on first access. When `onDragEnd` fires, `moveItemStableKey(droppableId, from, to)` shifts the UUID array identically to how TanStack Form's `moveValue` shifts the value array — so UUID `"abc"` follows item `"abc"` to its new position.

`accordionStateRef` is now keyed by UUID (not by index). After a drag, FormGroup at index 0 reads `slots[0]` to get the UUID of whichever item is now there, then looks up `accordionStateRef.get(uuid)`. State follows the item.

---

#### Change 1 — `DndProvider.tsx` (complete replacement)

```tsx
"use client";

import { DragDropContext } from "@hello-pangea/dnd";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";

export interface DndContextValue {
  register: (id: string, handler: (from: number, to: number) => void) => () => void;
  /** The droppableId that currently owns the active drag, or null when idle. */
  activeDroppableId: string | null;
  /**
   * Stable UUID slots per droppable. Map<droppableId, UUID[]>.
   * One UUID per array item slot. Shifted by moveItemStableKey on each drag to
   * mirror TanStack Form's moveValue — so a UUID follows its item across reorders.
   * Lives outside <DragDropContext key={dndKey}> and survives every remount.
   */
  itemStableKeysRef: MutableRefObject<Map<string, (string | undefined)[]>>;
  /**
   * Accordion open/closed state per stable key. Map<stableKey, boolean>.
   * For array-item group fields: stableKey is the slot UUID from itemStableKeysRef.
   * For top-level group fields: stableKey is the field name.
   * Lives outside <DragDropContext key={dndKey}> and survives every remount.
   */
  accordionStateRef: MutableRefObject<Map<string, boolean>>;
}

export const DndContext = createContext<DndContextValue | null>(null);

export function useDndContext(): DndContextValue | null {
  return useContext(DndContext);
}

/**
 * Backward-compat shim for Droppable — returns only the registry fields.
 * Droppable.tsx does not need to be changed.
 */
export function useDndRegistry() {
  const ctx = useContext(DndContext);
  if (!ctx) return null;
  return { register: ctx.register, activeDroppableId: ctx.activeDroppableId };
}

// DndRegistryContext is intentionally NOT re-exported — useDndRegistry() is the
// compat shim. Exporting the alias would cause type confusion since the old
// DndRegistryContext was typed narrower than DndContextValue.

export function DndProvider({ children }: { children: ReactNode }) {
  const registry = useRef(new Map<string, (from: number, to: number) => void>());
  const itemStableKeysRef = useRef(new Map<string, (string | undefined)[]>());
  const accordionStateRef = useRef(new Map<string, boolean>());
  const [activeDroppableId, setActiveDroppableId] = useState<string | null>(null);
  const [dndKey, setDndKey] = useState(0);

  const register = useCallback(
    (id: string, handler: (from: number, to: number) => void): (() => void) => {
      registry.current.set(id, handler);
      return () => { registry.current.delete(id); };
    },
    [],
  );

  // Mirrors TanStack Form's moveValue on the UUID slot array so stable keys
  // travel with their items when a drag reorders them.
  function moveItemStableKey(droppableId: string, from: number, to: number) {
    const slots = itemStableKeysRef.current.get(droppableId);
    if (!slots) return;
    const [moved] = slots.splice(from, 1);
    slots.splice(to, 0, moved);
  }

  const contextValue = useMemo<DndContextValue>(
    () => ({ register, activeDroppableId, itemStableKeysRef, accordionStateRef }),
    [register, activeDroppableId],
  );

  return (
    <DndContext.Provider value={contextValue}>
      <DragDropContext
        key={dndKey}
        onDragStart={(result) => {
          document.body.style.overflowX = "hidden";
          setActiveDroppableId(result.source.droppableId);
        }}
        onDragEnd={(result) => {
          document.body.style.overflowX = "";
          setActiveDroppableId(null);
          if (!result.destination) return;
          if (result.source.droppableId !== result.destination.droppableId) return;
          const droppableId = result.source.droppableId;
          const from = result.source.index;
          const to = result.destination.index;
          const handler = registry.current.get(droppableId);
          handler?.(from, to);                       // 1. reorder form values
          moveItemStableKey(droppableId, from, to);  // 2. reorder stable keys
          setDndKey((k) => k + 1);                   // 3. remount DragDropContext
        }}
      >
        {children}
      </DragDropContext>
    </DndContext.Provider>
  );
}
```

`DndContext`, `useDndContext`, and `useDndRegistry` are automatically exported via `export * from "./DndProvider"` in `dnd/index.ts` — no change needed there.

---

#### Change 2 — `useAccordionDndState.ts` (new file)

All the UUID slot logic, store key computation, and accordion state management lives here. FormGroup, FormArray, and FormBlocks all call this one hook. The component only sees the three values it needs for JSX.

```ts
// packages/react/src/components/ui/dnd/useAccordionDndState.ts
"use client";

import { useState } from "react";
import { useDndContext } from "./DndProvider";

/**
 * Manages accordion open/closed state that survives DragDropContext remounts
 * and correctly follows array items when they are reordered.
 *
 * Reads from DndContext (lives above the keyed DragDropContext) to access:
 * - itemStableKeysRef: stable UUID per array slot, shifted on every drag to
 *   mirror TanStack Form's moveValue so the UUID travels with its item.
 * - accordionStateRef: boolean open/closed keyed by stable UUID (not index).
 *
 * Usage — group, array, or blocks field accordion:
 *   const { itemValue, openItems, handleValueChange } = useAccordionDndState(
 *     name,
 *     index,
 *     fieldDef.defaultOpen !== false,
 *   );
 *
 * For block ITEMS (not the blocks field itself) pass the block's stable data id
 * as the fourth argument to bypass the slot-map lookup entirely:
 *   const { itemValue, openItems, handleValueChange } = useAccordionDndState(
 *     name,
 *     index,
 *     !admin.defaultCollapsed,
 *     blockItem.id,
 *   );
 */
export function useAccordionDndState(
  name: string,
  index: number | undefined,
  defaultOpen: boolean,
  /** Optional stable id from the item's data (e.g. block item.id).
   *  When provided, skips the slot-map lookup — use for items that already
   *  carry a stable UUID in their form value. */
  dataStableId?: string,
): {
  /** Value for <AccordionItem value={itemValue}> */
  itemValue: string;
  /** Value for <Accordion value={openItems}> */
  openItems: string[];
  /** Handler for <Accordion onValueChange={handleValueChange}> */
  handleValueChange: (value: string[]) => void;
} {
  const itemValue = index !== undefined ? `${name}-${index}` : name;

  const dnd = useDndContext();
  const accordionStateRef = dnd?.accordionStateRef;
  const itemStableKeysRef = dnd?.itemStableKeysRef;

  // Greedy match finds the LAST [N] in the path — the innermost array.
  // "outer[0].inner[1].settings" → droppableId="outer[0].inner", arrayIndex=1
  const arrayMatch = name.match(/^(.*)\[(\d+)\]/);
  const arrayDroppableId = arrayMatch?.[1] ?? null;
  const arrayIndex = arrayMatch ? parseInt(arrayMatch[2]) : null;

  // On every mount, find or create the stable UUID for this slot.
  // If dataStableId is provided (e.g. block item.id), use it directly.
  // Otherwise look up the slot map — after a drag, moveItemStableKey has
  // already shifted the array so slots[arrayIndex] holds the UUID that
  // travelled here with its item.
  const [stableSlotId] = useState<string | null>(() => {
    if (dataStableId) return dataStableId;
    if (!itemStableKeysRef || arrayDroppableId === null || arrayIndex === null) {
      return null;
    }
    const slots = itemStableKeysRef.current.get(arrayDroppableId) ?? [];
    if (!slots[arrayIndex]) {
      slots[arrayIndex] = crypto.randomUUID();
      itemStableKeysRef.current.set(arrayDroppableId, slots);
    }
    return slots[arrayIndex] ?? null;
  });

  // Strip array indices from name so two group fields in the same item get
  // distinct keys: "items[0].seo" → "items.seo", "items[0].settings" → "items.settings"
  const baseName = name.replace(/\[\d+\]/g, "");
  const storeKey = stableSlotId !== null ? `${stableSlotId}-${baseName}` : itemValue;

  const [openItems, setOpenItems] = useState<string[]>(() => {
    const stored = accordionStateRef?.current.get(storeKey);
    const isOpen = stored !== undefined ? stored : defaultOpen;
    return isOpen ? [itemValue] : [];
  });

  function handleValueChange(value: string[]) {
    setOpenItems(value);
    accordionStateRef?.current.set(storeKey, value.length > 0);
  }

  return { itemValue, openItems, handleValueChange };
}
```

Export from `dnd/index.ts`:
```ts
export * from "./useAccordionDndState";
```

---

#### Change 3 — `FormGroup.tsx`

The component drops all UUID/context logic. The import from Step 13 (`useDndAccordionState`) is replaced by the new hook. All that stays is the accordion JSX.

```tsx
import { useContext } from "react";                         // remove useState
import { useAccordionDndState } from "../ui/dnd";           // replaces old hook

export function FormGroup({ name, fieldDef, index, ... }) {
  // ...existing form context check and subFields setup unchanged...

  const { itemValue, openItems, handleValueChange } = useAccordionDndState(
    name,
    index,
    fieldDef.defaultOpen !== false,
  );

  return (
    <Accordion
      className={cn("rounded-sm border-2 border-border", className)}
      value={openItems}
      onValueChange={handleValueChange}
    >
      <AccordionItem value={itemValue}>
        {/* AccordionTrigger, AccordionContent — unchanged */}
      </AccordionItem>
    </Accordion>
  );
}
```

**Note on Step 13 compatibility:** Step 13 introduced `useDndAccordionState()` reading from a separate `DndAccordionStateContext` returning `Map<string, string[]>`. Step 14 replaces this entirely. Remove all Step 13 separate context exports (`DndAccordionStateContext`, `useDndAccordionState`); everything is now in `DndContext` and accessed through `useAccordionDndState`.

**Future use — FormArray and FormBlocks accordions:**

Both fields call the same hook with zero new infrastructure:

```tsx
// FormArray — wrap the items list in an accordion that can be collapsed
const { itemValue, openItems, handleValueChange } = useAccordionDndState(
  name,
  index,           // undefined if array is top-level, set if array is inside another array item
  !fieldDef.admin.defaultCollapsed,
);

// FormBlocks — wrap the blocks list in an accordion
const { itemValue, openItems, handleValueChange } = useAccordionDndState(
  name,
  index,
  !fieldDef.admin.defaultCollapsed,
);

// Individual block items inside FormBlocks — use block's data id to skip slot lookup
const { itemValue, openItems, handleValueChange } = useAccordionDndState(
  `${name}-${item.id}`,   // unique name per block
  undefined,
  !fieldDef.admin.defaultCollapsed,
  item.id,                // dataStableId — bypasses itemStableKeysRef entirely
);
```

---

**How the two refs work together (deep array reorder example):**

```
Initial state:
  itemStableKeysRef["items"] = ["uuid-A", "uuid-B", "uuid-C"]
  accordionStateRef           = { "uuid-A": true, "uuid-B": false, "uuid-C": true }
  UI: item 0 (A) OPEN, item 1 (B) CLOSED, item 2 (C) OPEN

User drags item 0 to position 2:
  1. handler(0, 2)         → TanStack Form value: [B, C, A]
  2. moveItemStableKey(0→2)→ slots: ["uuid-B", "uuid-C", "uuid-A"]
  3. setDndKey(k+1)        → DragDropContext remounts → all FormGroups remount

After remount:
  index 0 → slots[0] = "uuid-B" → accordionStateRef["uuid-B"] = false → CLOSED ✓
  index 1 → slots[1] = "uuid-C" → accordionStateRef["uuid-C"] = true  → OPEN  ✓
  index 2 → slots[2] = "uuid-A" → accordionStateRef["uuid-A"] = true  → OPEN  ✓
```

**Behaviour table:**

| Scenario | Result |
|---|---|
| Item 1 (open) swaps with item 2 (closed) | Item 1 stays open at new position, item 2 stays closed |
| Top-level group (not in array) | No slot lookup; uses field `name` as store key — stable, unaffected by array drags |
| Deeply nested group inside array inside group inside array | Regex extracts the closest `[N]` from the field name; correct slot used |
| Item added | Gets a fresh UUID on first mount |
| Page refresh | Both refs reset empty → `fieldDef.defaultOpen` applies |

**Known limitation — triple-nested arrays (array → array → group):**

When the OUTER array reorders, inner droppable IDs change because they embed the outer path (`"outer[0].inner"` → `"outer[1].inner"`). The slot mappings in `itemStableKeysRef` are keyed by the full droppable path, so inner group accordion state is lost on outer-array reorders. This only affects triple-nesting (array inside array inside array). For the current structure (group → array → group → array → group), the outermost level is a group (not an array), so its path is stable and this limitation does not apply. Can be addressed later if needed.

**Extensibility — FormArray and FormBlocks accordions (future):**

Both use the same `accordionStateRef` from `useDndContext()` with no new infrastructure:
- **FormArray:** store key is `name` for top-level arrays; `\`${stableSlotId}-${baseName}\`` when the array itself is nested inside another array (same slot lookup as FormGroup). Add `admin.defaultCollapsed?: boolean` to `ArrayField` config.
- **FormBlocks:** block items already carry `item.id` in the form data — use that directly as the store key, bypassing `itemStableKeysRef` entirely.

**Tasks:**
- [ ] In `DndProvider.tsx`: replace file entirely with the merged `DndContext` version above
- [ ] In `DndProvider.tsx`: remove `useDndRegistry` shim and `DndRegistryContext` — no compat shims
- [ ] In `Droppable.tsx`: replace `useDndRegistry()` call with `useDndContext()`, read `ctx?.register` and `ctx?.activeDroppableId` directly
- [ ] Remove all Step 13 separate context exports (`DndAccordionStateContext`, `useDndAccordionState`, any `DndItemStableKeysContext`) — replaced by `DndContext`
- [ ] Create `packages/react/src/components/ui/dnd/useAccordionDndState.ts` with the hook above
- [ ] Add `export * from "./useAccordionDndState"` to `dnd/index.ts`
- [ ] In `FormGroup.tsx`: remove `useState` from React imports (hook handles it)
- [ ] In `FormGroup.tsx`: replace old hook import with `useAccordionDndState` from `"../ui/dnd"`
- [ ] In `FormGroup.tsx`: replace all UUID/context/store-key logic with single `useAccordionDndState(name, index, fieldDef.defaultOpen !== false)` call
- [ ] In `FormGroup.tsx`: use `itemValue` from hook for `<AccordionItem value={itemValue}>`
- [ ] Verify: single array of groups — item 1 open, item 2 closed → swap → item 1 still open at new position
- [ ] Verify: two group fields in the same array item maintain independent accordion state across reorders
- [ ] Verify: group → array → group → array → group — reorder inner array, outer accordion states unaffected
- [ ] Verify: page refresh resets all accordions to `fieldDef.defaultOpen`

---

## Out of Scope