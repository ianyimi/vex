# Spec 06b — Create & Delete Mutations

## Overview

The admin panel is currently read/update only — it cannot create or delete documents. This spec adds `createDocument` and `deleteDocument` mutations (with bulk delete), wires them into the admin panel via URL-param-driven modals, adds row selection to the DataTable, and adds a row actions column with edit/delete options. Server-side Zod validation is included for the create mutation.

## Design Decisions

1. **Create modal is a centered Dialog** (not a Sheet) — covers 90vh/90vw, scrolls internally, closes on outside click. Driven by `?createNew=true` URL param via nuqs.
2. **Delete modal is a smaller centered Dialog** — shows document titles + IDs for confirmation. Driven by `?delete=true` URL param. Reads selected document IDs from React state.
3. **Row selection** uses TanStack Table's built-in row selection with a checkbox column. Selected rows stored in component state, used by the delete modal.
4. **Row actions column** — ellipsis icon opens a Popover with Edit (navigates to edit view) and Delete (sets that row as selected, opens delete modal).
5. **Server-side validation** — the create mutation imports the vex config and reconstructs a Zod schema via `generateFormSchema` to validate fields before inserting. Uses the same pattern as the existing update mutation but adds validation.
6. **`formDefaultValue`** — each field type's `_meta` gets a `formDefaultValue` property with a sensible zero-value (e.g., `""` for text, `0` for number, `false` for checkbox, `[]` for array). This is used as the initial value for the create form.
7. **Hard delete** — `ctx.db.delete()`. No soft delete (deferred to Spec 07 Versioning).
8. **`disableCreate` / `disableDelete`** flags on `CollectionAdminConfig` are respected in the UI.

## Out of Scope

- Cascade delete / relationship integrity warnings
- Soft delete / undo
- Server-side validation for `updateDocument` (add later across all mutations at once)
- Hooks (beforeCreate, afterDelete)

## Target Directory Structure

```
packages/core/src/
  formSchema/
    generateFormSchema.ts          # existing — no changes
    generateFormDefaultValues.ts   # NEW — extracts default values from field config
    generateFormDefaultValues.test.ts # NEW — tests
  index.ts                         # MODIFY — add export
  types/fields.ts                  # MODIFY — add formDefaultValue to field metas

packages/ui/src/
  components/ui/
    dialog.tsx                     # NEW — centered Dialog component (base-ui)
    data-table.tsx                 # MODIFY — add row selection + actions column support
    index.tsx                      # MODIFY — add dialog export

packages/admin-next/src/
  views/
    CollectionsView.tsx            # MODIFY — add create button, delete button, modals, row selection
    CollectionEditView.tsx         # MODIFY — add delete button + modal
  components/
    CreateDocumentDialog.tsx       # NEW — create form modal
    DeleteDocumentDialog.tsx       # NEW — delete confirmation modal
    RowActionsMenu.tsx             # NEW — ellipsis popover with edit/delete

apps/test-app/convex/vex/
  collections.ts                   # MODIFY — add createDocument, deleteDocument, bulkDeleteDocuments
  model/collections.ts             # MODIFY — add generic handlers
```

## Implementation Order

1. **Step 1: Add `formDefaultValue` to field types + `generateFormDefaultValues` utility** — after this step, `@vexcms/core` can produce default values for a create form. Testable with unit tests.
2. **Step 2: Add Convex mutations** — `createDocument`, `deleteDocument`, `bulkDeleteDocuments` in model/collections.ts + collections.ts with server-side Zod validation. Testable by calling mutations directly.
3. **Step 3: Create Dialog component in @vexcms/ui** — reusable centered modal. Testable by rendering.
4. **Step 4: Create RowActionsMenu component** — ellipsis popover with Edit + Delete. Testable by rendering.
5. **Step 5: Add row selection to DataTable** — checkbox column, selection state, selection count display. Testable by rendering.
6. **Step 6: Create DeleteDocumentDialog component** — confirmation modal showing titles/IDs. Testable by rendering.
7. **Step 7: Create CreateDocumentDialog component** — form modal using AppForm. Testable by rendering.
8. **Step 8: Wire into CollectionsView** — create button, delete button, modals, row selection, URL params. Full integration.
9. **Step 9: Wire delete into CollectionEditView** — single delete button + modal on the edit page.

---

## Step 1: Add `formDefaultValue` to field types + `generateFormDefaultValues`

- [ ] Update field meta types to include `formDefaultValue` on each field type
- [ ] Update each field builder config to set `formDefaultValue`
- [ ] Create `generateFormDefaultValues` utility
- [ ] Create tests for `generateFormDefaultValues`
- [ ] Export from `@vexcms/core` index
- [ ] Run `pnpm build` and `pnpm --filter @vexcms/core test`

### 1a. Update field meta types

**File: `packages/core/src/types/fields.ts`**

Add `formDefaultValue` to each field meta interface. This is the zero-value used when creating new documents via the admin form.

```typescript
// TextFieldMeta — add after defaultValue
/** Zero-value used as the initial form value when creating a new document. */
formDefaultValue: string;

// NumberFieldMeta — add after defaultValue
formDefaultValue: number;

// CheckboxFieldMeta — add after defaultValue
formDefaultValue: boolean;

// SelectFieldMeta — add after defaultValue
formDefaultValue: T | T[];

// DateFieldMeta — add after defaultValue
formDefaultValue: number;

// ImageUrlFieldMeta — add after defaultValue
formDefaultValue: string;

// RelationshipFieldMeta — add after `hasMany`
formDefaultValue: string | string[];

// JsonFieldMeta — add after type
formDefaultValue: unknown;

// ArrayFieldMeta — add after max
formDefaultValue: unknown[];
```

### 1b. Update each field builder to set `formDefaultValue`

Update each field's `config.ts` to include the `formDefaultValue` in the returned `_meta`.

**File: `packages/core/src/fields/text/config.ts`**

```typescript
export function text(
  options?: TextFieldOptions,
): GenericVexField<string, TextFieldMeta> {
  return {
    _type: "",
    _meta: {
      type: "text",
      defaultValue: options?.required ? "" : undefined,
      formDefaultValue: options?.defaultValue ?? "",
      ...options,
    },
  };
}
```

> Note: The spread `...options` comes after, so if the user explicitly sets `formDefaultValue` in options it would override. But `formDefaultValue` is not in `TextFieldOptions` — it's only on the meta. The explicit assignment before the spread ensures it's always set, and then `...options` can't override it because `TextFieldOptions` doesn't include `formDefaultValue`. However, since `...options` spreads ALL properties (including `defaultValue`, `label`, etc. which overlap with the explicit assignments), the order matters: `formDefaultValue` must be set AFTER the spread to avoid being overwritten by undefined. Restructure to:

```typescript
export function text(
  options?: TextFieldOptions,
): GenericVexField<string, TextFieldMeta> {
  return {
    _type: "",
    _meta: {
      type: "text",
      defaultValue: options?.required ? "" : undefined,
      ...options,
      formDefaultValue: options?.defaultValue ?? "",
    },
  };
}
```

Apply the same pattern to each field builder:

**File: `packages/core/src/fields/number/config.ts`**
```typescript
formDefaultValue: options?.defaultValue ?? 0,
```

**File: `packages/core/src/fields/checkbox/config.ts`**
```typescript
formDefaultValue: options?.defaultValue ?? false,
```

**File: `packages/core/src/fields/select/config.ts`**
```typescript
// For hasMany, default to empty array; otherwise default to first option value or ""
formDefaultValue: options?.defaultValue ?? (options?.hasMany ? [] : ""),
```

**File: `packages/core/src/fields/date/config.ts`**
```typescript
formDefaultValue: options?.defaultValue ?? 0,
```

**File: `packages/core/src/fields/imageUrl/config.ts`**
```typescript
formDefaultValue: options?.defaultValue ?? "",
```

**File: `packages/core/src/fields/relationship/config.ts`**
```typescript
formDefaultValue: options?.hasMany ? [] : "",
```

**File: `packages/core/src/fields/json/config.ts`**
```typescript
formDefaultValue: {},
```

**File: `packages/core/src/fields/array/config.ts`**
```typescript
formDefaultValue: [],
```

### 1c. Create `generateFormDefaultValues`

**File: `packages/core/src/formSchema/generateFormDefaultValues.ts`**

```typescript
import type { VexField, FieldMeta } from "../types";

/**
 * Generate default values for a create form from a collection's field definitions.
 * Uses `formDefaultValue` from each field's metadata as the zero-value.
 * Skips hidden fields (they won't appear in the form).
 *
 * @param props.fields - Record of field name -> VexField from the collection config
 * @returns Record of field name -> default value for the create form
 */
export function generateFormDefaultValues(props: {
  fields: Record<string, VexField>;
}): Record<string, unknown> {
  // TODO: implement
  //
  // 1. Initialize empty result object
  //
  // 2. Iterate over each [fieldName, field] entry in props.fields
  //    a. Skip if field._meta.admin?.hidden is true
  //    b. Read field._meta.formDefaultValue (cast _meta to FieldMeta)
  //    c. Set result[fieldName] = formDefaultValue
  //
  // 3. Return the result object
  //
  // Edge cases:
  // - formDefaultValue is always defined on _meta (set by field builders), so no undefined check needed
  // - Hidden fields are excluded because they won't be in the form schema either
  throw new Error("Not implemented");
}
```

### 1d. Tests for `generateFormDefaultValues`

**File: `packages/core/src/formSchema/generateFormDefaultValues.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { generateFormDefaultValues } from "./generateFormDefaultValues";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { checkbox } from "../fields/checkbox";
import { select } from "../fields/select";
import { date } from "../fields/date";
import { imageUrl } from "../fields/imageUrl";
import { relationship } from "../fields/relationship";
import { json } from "../fields/json";
import { array } from "../fields/array";

describe("generateFormDefaultValues", () => {
  it("returns sensible zero-values for all field types", () => {
    const result = generateFormDefaultValues({
      fields: {
        title: text({ label: "Title", required: true }),
        count: number({ label: "Count" }),
        active: checkbox({ label: "Active" }),
        status: select({
          label: "Status",
          options: [
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
          ],
        }),
        createdAt: date({ label: "Created" }),
        avatar: imageUrl({ label: "Avatar" }),
        author: relationship({ to: "users" }),
        meta: json({ label: "Meta" }),
        tags: array({ field: text(), label: "Tags" }),
      },
    });

    expect(result).toEqual({
      title: "",
      count: 0,
      active: false,
      status: "",
      createdAt: 0,
      avatar: "",
      author: "",
      meta: {},
      tags: [],
    });
  });

  it("uses user-provided defaultValue when set", () => {
    const result = generateFormDefaultValues({
      fields: {
        status: select({
          label: "Status",
          options: [
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
          ],
          defaultValue: "draft",
        }),
        title: text({ label: "Title", defaultValue: "Untitled" }),
        count: number({ label: "Count", defaultValue: 42 }),
      },
    });

    expect(result).toEqual({
      status: "draft",
      title: "Untitled",
      count: 42,
    });
  });

  it("skips hidden fields", () => {
    const result = generateFormDefaultValues({
      fields: {
        title: text({ label: "Title" }),
        internal: text({ label: "Internal", admin: { hidden: true } }),
      },
    });

    expect(result).toEqual({ title: "" });
    expect(result).not.toHaveProperty("internal");
  });

  it("returns empty array for hasMany relationship", () => {
    const result = generateFormDefaultValues({
      fields: {
        tags: relationship({ to: "tags", hasMany: true }),
      },
    });

    expect(result).toEqual({ tags: [] });
  });

  it("returns empty array for hasMany select", () => {
    const result = generateFormDefaultValues({
      fields: {
        categories: select({
          label: "Categories",
          options: [{ label: "A", value: "a" }],
          hasMany: true,
        }),
      },
    });

    expect(result).toEqual({ categories: [] });
  });

  it("handles empty fields record", () => {
    const result = generateFormDefaultValues({ fields: {} });
    expect(result).toEqual({});
  });
});
```

### 1e. Export from `@vexcms/core`

**File: `packages/core/src/index.ts`**

Add this export alongside the existing `generateFormSchema` export:

```typescript
export { generateFormDefaultValues } from "./formSchema/generateFormDefaultValues";
```

---

## Step 2: Add Convex Mutations

- [ ] Add `createDocument` handler to `model/collections.ts`
- [ ] Add `deleteDocument` handler to `model/collections.ts`
- [ ] Add `bulkDeleteDocuments` handler to `model/collections.ts`
- [ ] Add `createDocument` mutation to `collections.ts` with server-side Zod validation
- [ ] Add `deleteDocument` mutation to `collections.ts`
- [ ] Add `bulkDeleteDocuments` mutation to `collections.ts`
- [ ] Run `pnpm build`

### 2a. Add generic handlers to `model/collections.ts`

**File: `apps/test-app/convex/vex/model/collections.ts`**

Add these functions after the existing `updateDocument` function:

```typescript
export async function createDocument<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>
  args: {
    collectionSlug: TableNamesInDataModel<DataModel>
    fields: Record<string, unknown>
  }
}): Promise<string> {
  // TODO: implement
  //
  // 1. Call props.ctx.db.insert() with props.args.collectionSlug and props.args.fields
  //    → cast collectionSlug and fields with `as any` (same pattern as updateDocument)
  //
  // 2. Return the new document ID as a string
  //
  // Edge cases:
  // - Validation happens in the mutation wrapper (collections.ts), not here
  // - The ID returned is a Convex GenericId — cast to string for the API response
  throw new Error("Not implemented");
}

export async function deleteDocument<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>
  args: {
    documentId: string
  }
}): Promise<void> {
  // TODO: implement
  //
  // 1. Call props.ctx.db.delete() with props.args.documentId
  //    → cast documentId with `as any` (same pattern as updateDocument)
  //
  // Edge cases:
  // - Convex throws if the document ID doesn't exist — let it propagate
  throw new Error("Not implemented");
}

export async function bulkDeleteDocuments<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>
  args: {
    documentIds: string[]
  }
}): Promise<{ deleted: number }> {
  // TODO: implement
  //
  // 1. Iterate over props.args.documentIds
  //    a. Call props.ctx.db.delete() for each ID (cast with `as any`)
  //
  // 2. Return { deleted: props.args.documentIds.length }
  //
  // Edge cases:
  // - If any single delete fails, the entire mutation rolls back (Convex transaction semantics)
  // - Empty array is valid — returns { deleted: 0 }
  // - Convex mutations have a limit on operations per transaction (~8192 reads/writes).
  //   For bulk delete, this is unlikely to be hit in admin use cases, but if it becomes
  //   an issue, a future spec can add batched deletion.
  throw new Error("Not implemented");
}
```

### 2b. Add mutations to `collections.ts` with server-side validation

**File: `apps/test-app/convex/vex/collections.ts`**

Add these imports at the top:

```typescript
import config from "../../vex.config";
import { generateFormSchema } from "@vexcms/core";
import type { VexField } from "@vexcms/core";
```

Add these mutations after the existing `searchDocuments` query:

```typescript
export const createDocument = mutation({
  args: {
    collectionSlug: v.string(),
    fields: v.any(),
  },
  handler: async (ctx, { collectionSlug, fields }) => {
    // TODO: implement
    //
    // 1. Find the collection config from the imported vex config
    //    → const collection = config.collections.find(c => c.slug === collectionSlug)
    //    → if not found, throw a ConvexError("Collection not found: {collectionSlug}")
    //
    // 2. Generate a Zod schema from the collection's field definitions
    //    → const schema = generateFormSchema({ fields: collection.config.fields as Record<string, VexField> })
    //
    // 3. Validate the incoming fields against the schema
    //    → const result = schema.safeParse(fields)
    //    → if !result.success, throw a ConvexError with the validation errors
    //      (use result.error.flatten() for a clean error shape)
    //
    // 4. Call Collections.createDocument<DataModel>() with the validated data
    //    → use result.data (the Zod-parsed output) as the fields, not the raw input
    //    → cast collectionSlug to TableNamesInDataModel<DataModel>
    //
    // 5. Return the new document ID string
    //
    // Edge cases:
    // - Fields not in the schema are stripped by Zod (passthrough is NOT used)
    // - Required fields missing → Zod validation error with field-level messages
    // - Extra fields from client → silently stripped (safe by default)
    throw new Error("Not implemented");
  },
})

export const deleteDocument = mutation({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
  },
  handler: async (ctx, { collectionSlug, documentId }) => {
    // TODO: implement
    //
    // 1. Optionally verify the document exists (ctx.db.get)
    //    → if not found, throw ConvexError("Document not found")
    //    → this gives a better error than Convex's internal "document not found"
    //
    // 2. Call Collections.deleteDocument<DataModel>() with documentId
    //
    // Edge cases:
    // - collectionSlug is accepted but not strictly needed for delete (Convex IDs are globally unique)
    //   It's included for consistency and future RBAC checks
    throw new Error("Not implemented");
  },
})

export const bulkDeleteDocuments = mutation({
  args: {
    collectionSlug: v.string(),
    documentIds: v.array(v.string()),
  },
  handler: async (ctx, { collectionSlug, documentIds }) => {
    // TODO: implement
    //
    // 1. Call Collections.bulkDeleteDocuments<DataModel>() with documentIds
    //
    // 2. Return the result ({ deleted: number })
    //
    // Edge cases:
    // - Empty array → returns { deleted: 0 }, no-op
    // - collectionSlug included for future RBAC checks
    throw new Error("Not implemented");
  },
})
```

---

## Step 3: Create Dialog Component in @vexcms/ui

- [ ] Create `packages/ui/src/components/ui/dialog.tsx`
- [ ] Export from `packages/ui/src/components/ui/index.tsx`
- [ ] Run `pnpm build`

### 3a. Dialog component

**File: `packages/ui/src/components/ui/dialog.tsx`**

This is a centered overlay modal built on `@base-ui/react/dialog` (same primitive the Sheet component uses). It supports controlled open state and closes on outside click.

```typescript
import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "../../styles/utils"
import { Button } from "./button"
import { XIcon } from "lucide-react"

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/50 duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 fixed inset-0 z-50",
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-lg border shadow-lg transition duration-150 flex flex-col",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-4 right-4"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("gap-1.5 p-6 pb-0 flex flex-col", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("gap-2 p-6 pt-0 flex justify-end", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
}
```

### 3b. Export from UI index

**File: `packages/ui/src/components/ui/index.tsx`**

Add this line:

```typescript
export * from "./dialog";
```

---

## Step 4: Create RowActionsMenu Component

- [ ] Create `packages/admin-next/src/components/RowActionsMenu.tsx`
- [ ] Run `pnpm build`

**File: `packages/admin-next/src/components/RowActionsMenu.tsx`**

A popover menu for each table row with Edit and Delete actions. Rendered as the last column in the DataTable.

```tsx
"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button, Popover, PopoverTrigger, PopoverContent } from "@vexcms/ui";

interface RowActionsMenuProps {
  /** Callback to navigate to the edit view for this document */
  onEdit: () => void;
  /** Callback to trigger the delete modal for this document */
  onDelete: () => void;
  /** Whether delete is disabled (e.g., disableDelete flag on collection) */
  disableDelete?: boolean;
}

export function RowActionsMenu(props: RowActionsMenuProps) {
  // TODO: implement
  //
  // 1. Render a Popover with a Button trigger (variant="ghost", size="icon-sm")
  //    → trigger content is <MoreHorizontal /> icon
  //
  // 2. PopoverContent contains a vertical list of action buttons:
  //    a. "Edit" button with <Pencil /> icon — calls props.onEdit
  //    b. "Delete" button with <Trash2 /> icon — calls props.onDelete
  //       → only render if props.disableDelete is not true
  //       → style with text-destructive for red color
  //
  // 3. Each button should be variant="ghost" and full-width with left-aligned text
  //    → use className="w-full justify-start gap-2" on each button
  //
  // 4. Clicking either action should also close the popover
  //    → wrapping each button's onClick to call the callback is sufficient;
  //      base-ui Popover doesn't auto-close on content click, so you may need
  //      to control the open state or use a ref to close it
  //
  // Edge cases:
  // - If disableDelete is true, only Edit appears
  // - The popover should align to the right to avoid overflow on the last column
  throw new Error("Not implemented");
}
```

---

## Step 5: Add Row Selection to DataTable

- [ ] Modify `packages/ui/src/components/ui/data-table.tsx` — add row selection support
- [ ] Run `pnpm build`

**File: `packages/ui/src/components/ui/data-table.tsx`**

Add these changes to the existing DataTable component:

### 5a. Update imports

Add to the existing `@tanstack/react-table` import:

```typescript
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,       // ADD
} from "@tanstack/react-table";
```

### 5b. Update `DataTableProps` interface

Add these new props to the existing interface:

```typescript
interface DataTableProps<TData> {
  // ... existing props ...

  /** Enable row selection with checkboxes. Default: false. */
  enableRowSelection?: boolean;
  /** Controlled row selection state. Keys are row indices, values are booleans. */
  rowSelection?: RowSelectionState;
  /** Callback when row selection changes. */
  onRowSelectionChange?: (selection: RowSelectionState) => void;
}
```

### 5c. Update `useReactTable` configuration

```typescript
// Inside the DataTable function, before useReactTable:
const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({});
const currentRowSelection = rowSelection ?? internalRowSelection;
const handleRowSelectionChange = onRowSelectionChange ?? setInternalRowSelection;

// Update useReactTable config:
const table = useReactTable({
  data,
  columns: enableRowSelection ? [selectColumn<TData>(), ...columns] : columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  autoResetPageIndex: false,
  enableRowSelection: enableRowSelection ?? false,
  state: {
    pagination,
    rowSelection: currentRowSelection,
  },
  onPaginationChange: (updater) => {
    const next = typeof updater === "function" ? updater(pagination) : updater;
    onPageChange?.(next.pageIndex);
  },
  onRowSelectionChange: (updater) => {
    const next = typeof updater === "function" ? updater(currentRowSelection) : updater;
    handleRowSelectionChange(next);
  },
});
```

### 5d. Add `selectColumn` helper

Add this helper function above the `DataTable` component in the same file:

```typescript
import { Checkbox } from "./checkbox-field";

function selectColumn<TData>(): ColumnDef<TData, unknown> {
  // TODO: implement
  //
  // 1. Return a ColumnDef with id: "select"
  //
  // 2. Header cell: render a Checkbox that toggles all rows
  //    → checked = table.getIsAllPageRowsSelected()
  //    → indeterminate = table.getIsSomePageRowsSelected()
  //    → onChange = table.getToggleAllPageRowsSelectedHandler()
  //    → aria-label = "Select all"
  //
  // 3. Cell: render a Checkbox that toggles the individual row
  //    → checked = row.getIsSelected()
  //    → onChange = row.getToggleSelectedHandler()
  //    → aria-label = "Select row"
  //
  // 4. Set size: 40 (narrow column for the checkbox)
  //    → meta: { align: "center" }
  //
  // 5. Disable sorting: enableSorting: false, enableHiding: false
  //
  // Edge cases:
  // - The CheckboxField component from @vexcms/ui may need to be adapted
  //   for standalone use (without react-form). If it only works with
  //   @tanstack/react-form, create a simple <input type="checkbox" /> wrapper
  //   with matching styles instead.
  throw new Error("Not implemented");
}
```

### 5e. Update selection count display

In the DataTable's pagination area, add a selection count when rows are selected. Modify the existing footer section:

```tsx
{data.length > 0 && (
  <div className="flex items-center px-2 shrink-0">
    {/* ADD: Selection count on the left */}
    <div className="flex-1 text-sm text-muted-foreground">
      {enableRowSelection && Object.keys(currentRowSelection).length > 0 && (
        <span>
          {Object.keys(currentRowSelection).length} of {data.length} row(s) selected
        </span>
      )}
    </div>
    <Pagination
      currentPage={currentPage}
      totalPages={totalPageCount}
      onPageChange={(zeroIndexed) => onPageChange?.(zeroIndexed)}
      canLoadMore={canLoadMore}
    />
    <div className="flex-1 flex justify-end">
      {onPageSizeChange && (
        <PageSizeSelector
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  </div>
)}
```

---

## Step 6: Create DeleteDocumentDialog Component

- [ ] Create `packages/admin-next/src/components/DeleteDocumentDialog.tsx`
- [ ] Run `pnpm build`

**File: `packages/admin-next/src/components/DeleteDocumentDialog.tsx`**

A confirmation dialog that shows the documents to be deleted and requires explicit confirmation.

```tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@vexcms/ui";

interface DocumentForDeletion {
  /** The Convex document ID */
  _id: string;
  /** The document title (from useAsTitle field), if available */
  title?: string;
}

interface DeleteDocumentDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** The documents to be deleted */
  documents: DocumentForDeletion[];
  /** The collection slug — used for the mutation */
  collectionSlug: string;
  /** Singular label for the collection (e.g., "Post") */
  singularLabel: string;
  /** Plural label for the collection (e.g., "Posts") */
  pluralLabel: string;
  /** Callback after successful deletion — used to clear selection state */
  onDeleted: () => void;
}

export function DeleteDocumentDialog(props: DeleteDocumentDialogProps) {
  // TODO: implement
  //
  // 1. Set up state: const [isDeleting, setIsDeleting] = useState(false)
  //
  // 2. Set up the mutation(s):
  //    → if props.documents.length === 1, use deleteDocument mutation
  //    → if props.documents.length > 1, use bulkDeleteDocuments mutation
  //    → import useMutation from "convex/react" and anyApi from "convex/server"
  //
  // 3. Render Dialog with open={props.open} and onOpenChange that calls props.onClose when false
  //
  // 4. DialogContent — small centered dialog (no need for 90vh/90vw — that's for create)
  //    → className="max-w-md" for a compact confirmation dialog
  //
  // 5. DialogHeader with DialogTitle:
  //    → Single: "Delete {singularLabel}?"
  //    → Multiple: "Delete {count} {pluralLabel}?"
  //
  // 6. DialogDescription with the document list:
  //    → "This action cannot be undone."
  //    → Then a scrollable list (max-h-48 overflow-y-auto) showing each document:
  //      - Title (bold) + ID (muted, monospace, truncated)
  //      - If no title: just show the ID
  //
  // 7. DialogFooter with two buttons:
  //    a. "Cancel" button (variant="outline") — calls props.onClose
  //    b. "Delete" button (variant="destructive") — calls handleDelete
  //       → disabled when isDeleting
  //       → shows "Deleting..." while in progress
  //
  // 8. handleDelete function:
  //    a. Set isDeleting = true
  //    b. If single document: call deleteDocument({ collectionSlug, documentId })
  //    c. If multiple: call bulkDeleteDocuments({ collectionSlug, documentIds })
  //    d. On success: call props.onDeleted(), then props.onClose()
  //    e. Finally: set isDeleting = false
  //    f. Wrap in try/catch — on error, log to console (future: toast notification)
  //
  // Edge cases:
  // - Empty documents array: should not happen (caller should not open dialog), but guard with early return
  // - Dialog should not close while deletion is in progress (disable Cancel button too, or use onOpenChange guard)
  throw new Error("Not implemented");
}

export type { DocumentForDeletion, DeleteDocumentDialogProps };
```

---

## Step 7: Create CreateDocumentDialog Component

- [ ] Create `packages/admin-next/src/components/CreateDocumentDialog.tsx`
- [ ] Run `pnpm build`

**File: `packages/admin-next/src/components/CreateDocumentDialog.tsx`**

A large centered dialog containing the AppForm for creating a new document. Uses `generateFormDefaultValues` for initial form values and `generateFormSchema` for validation.

```tsx
"use client";

import { useMemo, useState } from "react";
import type { AnyVexCollection, VexField } from "@vexcms/core";
import { generateFormSchema, generateFormDefaultValues } from "@vexcms/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  AppForm,
  type FieldEntry,
  Button,
} from "@vexcms/ui";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";

interface CreateDocumentDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** The collection to create a document in */
  collection: AnyVexCollection;
  /** Callback after successful creation — receives the new document ID */
  onCreated: (props: { documentId: string }) => void;
}

export function CreateDocumentDialog(props: CreateDocumentDialogProps) {
  // TODO: implement
  //
  // 1. Set up state: const [isCreating, setIsCreating] = useState(false)
  //
  // 2. Set up the createDocument mutation:
  //    → const createDocument = useMutation(anyApi.vex.collections.createDocument)
  //
  // 3. Generate the Zod schema from collection fields (memoized):
  //    → const schema = useMemo(() => generateFormSchema({
  //        fields: props.collection.config.fields as Record<string, VexField>
  //      }), [props.collection])
  //
  // 4. Generate default values for the create form (memoized):
  //    → const defaultValues = useMemo(() => generateFormDefaultValues({
  //        fields: props.collection.config.fields as Record<string, VexField>
  //      }), [props.collection])
  //
  // 5. Build field entries (excluding hidden fields, same as CollectionEditView):
  //    → const fieldEntries: FieldEntry[] = useMemo(() =>
  //        Object.entries(props.collection.config.fields as Record<string, VexField>)
  //          .filter(([, field]) => !field._meta.admin?.hidden)
  //          .map(([name, field]) => ({ name, field })),
  //      [props.collection])
  //
  // 6. handleSubmit function — NOTE: for create, send ALL fields (not just changed ones):
  //    a. Set isCreating = true
  //    b. Merge defaultValues with the form values to ensure all fields are present
  //       → const allFields = { ...defaultValues, ...formValues }
  //    c. Call createDocument({ collectionSlug: props.collection.slug, fields: allFields })
  //    d. On success: call props.onCreated({ documentId: result })
  //    e. Finally: set isCreating = false
  //    f. Wrap in try/catch — on error, log to console
  //
  // 7. Render Dialog with open={props.open} and onOpenChange:
  //    → only close if not currently creating
  //
  // 8. DialogContent with large size:
  //    → className="w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh] flex flex-col"
  //
  // 9. DialogHeader:
  //    → DialogTitle: "Create {singularLabel}"
  //      where singularLabel = props.collection.config.labels?.singular ?? props.collection.slug
  //
  // 10. Scrollable form area:
  //     → <div className="flex-1 overflow-y-auto p-6">
  //       <AppForm
  //         formId="create-document-form"
  //         schema={schema}
  //         fieldEntries={fieldEntries}
  //         defaultValues={defaultValues}
  //         onSubmit={handleSubmit}
  //       />
  //     </div>
  //
  // 11. Footer with submit button:
  //     → <div className="shrink-0 border-t p-6 flex justify-end">
  //         <Button type="submit" form="create-document-form" disabled={isCreating}>
  //           {isCreating ? "Creating..." : "Create"}
  //         </Button>
  //       </div>
  //
  // Edge cases:
  // - AppForm's onSubmit sends only CHANGED fields (fields that differ from defaultValues).
  //   For create, we need ALL fields. The handleSubmit must merge defaultValues with
  //   changedFields: const allFields = { ...defaultValues, ...changedFields }
  // - If the user closes and reopens the dialog, the form should reset.
  //   Use a `key` on the AppForm tied to the open state to force re-mount.
  // - The dialog must not close while creation is in progress.
  throw new Error("Not implemented");
}

export type { CreateDocumentDialogProps };
```

---

## Step 8: Wire into CollectionsView

- [ ] Modify `packages/admin-next/src/views/CollectionsView.tsx` — add URL params, create button, delete button, row selection, modals, actions column
- [ ] Run `pnpm build`

**File: `packages/admin-next/src/views/CollectionsView.tsx`**

This is the main integration step. The changes are:

### 8a. Add imports

```typescript
// Add to existing imports:
import { generateFormDefaultValues } from "@vexcms/core";
import { Button } from "@vexcms/ui";
import { Plus, Trash2 } from "lucide-react";
import { parseAsBoolean } from "nuqs";
import type { RowSelectionState } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";

// New component imports:
import { CreateDocumentDialog } from "../components/CreateDocumentDialog";
import { DeleteDocumentDialog, type DocumentForDeletion } from "../components/DeleteDocumentDialog";
import { RowActionsMenu } from "../components/RowActionsMenu";
```

### 8b. Add URL param state + selection state

Inside the `CollectionsView` function, add after the existing `useQueryState` calls:

```typescript
// Create modal — driven by URL param
const [createNew, setCreateNew] = useQueryState("createNew", parseAsBoolean.withDefault(false));

// Delete modal — driven by URL param
const [deleteOpen, setDeleteOpen] = useQueryState("delete", parseAsBoolean.withDefault(false));

// Row selection state
const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

// Documents staged for deletion (set when opening delete modal)
const [docsToDelete, setDocsToDelete] = useState<DocumentForDeletion[]>([]);
```

### 8c. Add actions column

After the `columns` memo, add a new memo that appends the actions column:

```typescript
const useAsTitle = collection.config.admin?.useAsTitle as string | undefined;
const disableDelete = collection.config.admin?.disableDelete ?? false;
const disableCreate = collection.config.admin?.disableCreate ?? false;

const columnsWithActions: ColumnDef<Record<string, unknown>, unknown>[] = useMemo(() => {
  // TODO: implement
  //
  // 1. Start with the existing `columns` array
  //
  // 2. Append a new column definition for the actions menu:
  //    → id: "actions"
  //    → header: "" (no header text)
  //    → size: 50 (narrow column)
  //    → cell: ({ row }) => render <RowActionsMenu />
  //      a. onEdit: use router.push or linkComponent to navigate to
  //         `${config.basePath}/${collection.slug}/${row.original._id}`
  //      b. onDelete:
  //         - Build a DocumentForDeletion from the row
  //         - Set docsToDelete to [that document]
  //         - Set deleteOpen to true
  //      c. disableDelete: collection.config.admin?.disableDelete
  //
  // 3. Return the combined array
  //
  // Edge cases:
  // - The actions column should not be sortable or hideable
  // - The cell renderer needs access to router/navigation for the Edit action
  throw new Error("Not implemented");
}, [columns, collection, config.basePath, disableDelete]);
```

### 8d. Add helper to build DocumentForDeletion from selected rows

```typescript
function getSelectedDocuments(): DocumentForDeletion[] {
  // TODO: implement
  //
  // 1. Get the selected row indices from rowSelection state
  //    → Object.keys(rowSelection).filter(k => rowSelection[k])
  //
  // 2. Map each index to the corresponding document in `documents` array
  //    → use the current page's data from the table, or the full documents array
  //
  // 3. For each document, build a DocumentForDeletion:
  //    → _id: doc._id as string
  //    → title: useAsTitle ? doc[useAsTitle] as string : undefined
  //
  // 4. Return the array
  //
  // Edge cases:
  // - Row indices from TanStack Table are string keys like "0", "1", etc.
  //   They correspond to the row's position in the current data array.
  throw new Error("Not implemented");
}
```

### 8e. Update the header area to add Create + Delete buttons

Replace the existing header `<div>` block (around line 170-183) to add buttons:

```tsx
<div className="flex items-center justify-between mb-6 shrink-0">
  <div>
    <h1 className="text-2xl font-bold">{pluralLabel}</h1>
    <p className="text-sm text-muted-foreground">
      {/* existing count display logic */}
    </p>
  </div>
  <div className="flex items-center gap-2">
    {/* Delete button — visible when rows are selected */}
    {!disableDelete && Object.keys(rowSelection).length > 0 && (
      <Button
        variant="destructive"
        size="sm"
        onClick={() => {
          setDocsToDelete(getSelectedDocuments());
          setDeleteOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete ({Object.keys(rowSelection).length})
      </Button>
    )}
    {/* Create button */}
    {!disableCreate && (
      <Button size="sm" onClick={() => setCreateNew(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Create {collection.config.labels?.singular ?? "Document"}
      </Button>
    )}
  </div>
</div>
```

### 8f. Update DataTable to pass row selection props

Update the `<DataTable>` JSX to include the new props:

```tsx
<DataTable
  columns={columnsWithActions}  // was: columns
  data={documents as Record<string, unknown>[]}
  // ... existing props ...
  enableRowSelection={!disableDelete}
  rowSelection={rowSelection}
  onRowSelectionChange={setRowSelection}
/>
```

### 8g. Add modals at the bottom of the return JSX

Add these after the `<DataTable>` component, inside the outer `<div>`:

```tsx
{/* Create Document Dialog */}
{!disableCreate && (
  <CreateDocumentDialog
    open={createNew}
    onClose={() => setCreateNew(false)}
    collection={collection}
    onCreated={({ documentId }) => {
      setCreateNew(false);
      // Navigate to edit view for the new document
      // Use window.location or router to go to:
      // `${config.basePath}/${collection.slug}/${documentId}`
    }}
  />
)}

{/* Delete Document Dialog */}
{!disableDelete && (
  <DeleteDocumentDialog
    open={deleteOpen}
    onClose={() => {
      setDeleteOpen(false);
      setDocsToDelete([]);
    }}
    documents={docsToDelete}
    collectionSlug={collection.slug}
    singularLabel={collection.config.labels?.singular ?? "Document"}
    pluralLabel={collection.config.labels?.plural ?? "Documents"}
    onDeleted={() => {
      setRowSelection({});
      setDocsToDelete([]);
    }}
  />
)}
```

---

## Step 9: Wire Delete into CollectionEditView

- [ ] Modify `packages/admin-next/src/views/CollectionEditView.tsx` — add delete button + modal
- [ ] Run `pnpm build`
- [ ] Verify full integration in test app

**File: `packages/admin-next/src/views/CollectionEditView.tsx`**

### 9a. Add imports

```typescript
import { useState } from "react";  // already imported
import { Trash2 } from "lucide-react";
import { DeleteDocumentDialog, type DocumentForDeletion } from "../components/DeleteDocumentDialog";
```

### 9b. Add delete state

Inside the component, after the existing state declarations:

```typescript
const [deleteOpen, setDeleteOpen] = useState(false);
const disableDelete = collection.config.admin?.disableDelete ?? false;
```

### 9c. Add delete button to the header

In the existing header bar (next to the Save button), add a delete button:

```tsx
<div className="flex items-center gap-2">
  {!disableDelete && document && (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => setDeleteOpen(true)}
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </Button>
  )}
  <Button
    type="submit"
    form="collection-edit-form"
    disabled={isSaving || fieldEntries.length === 0}
  >
    {isSaving ? "Saving..." : "Save"}
  </Button>
</div>
```

### 9d. Add delete dialog

Add at the bottom of the component's return JSX, inside the outer `<div>`:

```tsx
{!disableDelete && document && (
  <DeleteDocumentDialog
    open={deleteOpen}
    onClose={() => setDeleteOpen(false)}
    documents={[{
      _id: documentID,
      title: documentTitle,
    }]}
    collectionSlug={collection.slug}
    singularLabel={collection.config.labels?.singular ?? "Document"}
    pluralLabel={collection.config.labels?.plural ?? "Documents"}
    onDeleted={() => {
      // Navigate back to the collection list view after deletion
      // Use window.location or router to go to:
      // `${config.basePath}/${collection.slug}`
    }}
  />
)}
```

---

## Success Criteria

- [ ] `generateFormDefaultValues` returns correct zero-values for all 9 field types
- [ ] All existing tests pass (`pnpm --filter @vexcms/core test`)
- [ ] New `generateFormDefaultValues` tests pass
- [ ] `createDocument` mutation inserts a document and returns its ID
- [ ] `createDocument` mutation rejects invalid payloads with Zod validation errors
- [ ] `deleteDocument` mutation removes a document from the database
- [ ] `bulkDeleteDocuments` mutation removes multiple documents
- [ ] Create button appears on CollectionsView (hidden when `disableCreate: true`)
- [ ] Clicking Create opens a centered dialog (90vh x 90vw) with the form
- [ ] Submitting the create form creates a document and redirects to the edit view
- [ ] Clicking outside the create dialog closes it
- [ ] Row selection checkboxes appear on DataTable rows
- [ ] Delete button appears in header when rows are selected, showing count
- [ ] Clicking Delete opens confirmation dialog showing document titles + IDs
- [ ] Confirming delete removes the documents and clears selection
- [ ] Row actions (ellipsis) menu shows Edit and Delete options
- [ ] Edit action navigates to the document's edit view
- [ ] Delete action in row menu opens confirmation for that single document
- [ ] Delete button on CollectionEditView opens confirmation for the current document
- [ ] After deleting from edit view, user is redirected to the collection list
- [ ] `pnpm build` succeeds with no type errors
