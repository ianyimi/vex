# 09b — Custom Component Registration System

## Overview

This spec adds a form abstraction layer (`VexFormProvider` + hooks) over TanStack Form and a custom component registration system. Users can replace the built-in admin field component or table cell renderer for eligible field types by passing a `React.ComponentType` in `admin.components.Field` or `admin.components.Cell`. A new `ui()` field type is added for non-persisted display/action fields. Built-in field components for eligible types are refactored to use the new hooks.

## Design Decisions

1. **TanStack Form stays as the only engine** — no Legend State. `useField` and `useForm` are thin wrappers over TanStack Form's API, exposed via React context.
2. **Direct React component references** — `admin.components.Field` accepts a `React.ComponentType`, not a string path. Type-safe, no build step, no codegen.
3. **Restricted Field types** — only `text`, `number`, `checkbox`, and `select` fields can have custom `admin.components.Field`. These are the simple, self-contained field types. `upload`, `richtext`, `relationship`, `date`, `imageUrl`, `array`, and `json` have special wiring that custom components would lose. A runtime error is thrown if attempted.
4. **Unrestricted Cell types** — `admin.components.Cell` can be set on any field type (it's display-only).
5. **Cell injection at CollectionsView level** — custom Cell components are stored in `column.meta.customCell` by `generateColumns()` in core, then injected by `CollectionsView` in admin-next (same pattern as `UploadCellPreview`).
6. **readOnly via hooks, not wrapper** — custom components receive `readOnly` via `useField()` and handle it themselves. The opacity wrapper div is removed for fields with custom components.

## Out of Scope

- `admin.components.Filter` (custom filter UI)
- `admin.components.Label`, `Error`, `Description` sub-slots
- `useDocumentInfo` hook (needs DocumentContext from admin-next)
- Conditional field rendering (`admin.condition`)
- Array/blocks row manipulation helpers on `useForm`
- Legend State integration
- Build-time codegen / componentMap.ts

## Target Directory Structure

```
packages/core/src/
├── types/
│   └── fields.ts                    # Modified — add components to FieldAdminConfig, add UIFieldDef
├── fields/
│   └── ui/
│       ├── config.ts                # NEW — ui() field factory
│       └── config.test.ts           # NEW — ui() tests
├── columns/
│   └── generateColumns.ts           # Modified — skip ui fields, pass customCell to meta
├── formSchema/
│   ├── generateFormSchema.ts        # Modified — skip ui fields
│   └── generateFormDefaultValues.ts # Modified — skip ui fields
├── valueTypes/
│   └── extract.ts                   # Modified — skip ui fields
└── index.ts                         # Modified — export ui, UIFieldDef

packages/ui/src/
├── hooks/
│   ├── useVexField.ts               # NEW — field value/state hook
│   ├── useVexForm.ts                # NEW — form-level state hook
│   ├── useVexFormFields.ts          # NEW — selector hook for watching specific fields
│   └── index.ts                     # NEW — re-exports
├── components/
│   └── form/
│       ├── VexFormProvider.tsx       # NEW — context provider wrapping TanStack Form
│       ├── AppForm.tsx              # Modified — use VexFormProvider, check for custom Field
│       └── fields/
│           ├── TextField.tsx        # Modified — refactored to use useVexField
│           ├── NumberField.tsx      # Modified — refactored to use useVexField
│           ├── CheckboxField.tsx    # Modified — refactored to use useVexField
│           ├── SelectField.tsx      # Modified — refactored to use useVexField
│           └── UIField.tsx          # NEW — renders custom component for ui() fields
└── index.ts                         # Modified — export hooks, VexFormProvider, types

packages/admin-next/src/
└── views/
    └── CollectionsView.tsx          # Modified — inject custom Cell components from meta
```

## Implementation Order

1. **Step 1: Types** — Add `components` to `FieldAdminConfig`, add `UIFieldDef` to discriminated union
2. **Step 2: ui() field factory** — Create `ui()` in core with tests
3. **Step 3: Skip ui fields in generation** — Update schema gen, form schema, form defaults, column gen, value type extraction
4. **Step 4: Custom Cell in generateColumns** — Pass `admin.components.Cell` through `column.meta.customCell`
5. **Step 5: VexFormProvider** — Create context provider wrapping TanStack Form
6. **Step 6: useVexField hook** — Create the field-level hook with tests
7. **Step 7: useVexForm + useVexFormFields hooks** — Create form-level and selector hooks
8. **Step 8: Refactor built-in fields** — Refactor TextField, NumberField, CheckboxField, SelectField to use useVexField
9. **Step 9: Custom Field dispatch in AppForm** — Check for `admin.components.Field`, render custom or built-in
10. **Step 10: UIField component** — Render custom component for ui() fields
11. **Step 11: Custom Cell injection in CollectionsView** — Wire custom Cell components into table columns
12. **Step 12: Exports + final integration** — Update package exports, verify full build

---

## Step 1: Types — FieldAdminConfig + UIFieldDef

- [ ] Modify `packages/core/src/types/fields.ts` — add `components` to `FieldAdminConfig`
- [ ] Add `UIFieldDef` interface
- [ ] Add `UIFieldDef` to the `VexField` union
- [ ] Add `UIFieldDef` to `InferFieldType` (returns `never`)
- [ ] Export new types from `packages/core/src/index.ts`
- [ ] Run `pnpm build`

### `File: packages/core/src/types/fields.ts` — additions

Add `FieldComponentProps` type and `components` to `FieldAdminConfig`:

```typescript
/**
 * Props passed to custom field components.
 * Custom components receive these props and use useVexField() for state.
 */
export interface FieldComponentProps {
  /** The field key name (e.g., "primaryColor") */
  name: string;
  /** The VexField definition for this field */
  fieldDef: VexField;
  /** Whether the field is read-only (from permissions or config) */
  readOnly: boolean;
}

/**
 * Props passed to custom cell components in the data table.
 */
export interface CellComponentProps {
  /** The raw cell value from the document */
  value: unknown;
  /** The full row data (document) */
  row: Record<string, unknown>;
  /** The VexField definition for this column's field */
  fieldDef: VexField;
}
```

Add to `FieldAdminConfig`:

```typescript
export interface FieldAdminConfig {
  // ... existing properties ...

  /**
   * Custom components for this field.
   *
   * - `Field` replaces the entire field input in the edit form.
   *   Only allowed on text, number, checkbox, and select fields.
   *   The component receives FieldComponentProps and uses useVexField() for state.
   *
   * - `Cell` replaces the cell renderer in the data table list view.
   *   Allowed on any field type.
   */
  components?: {
    Field?: React.ComponentType<FieldComponentProps>;
    Cell?: React.ComponentType<CellComponentProps>;
  };
}
```

Add `UIFieldDef` after `RichTextFieldDef`:

```typescript
/**
 * UI field definition. Non-persisted — renders a custom component only.
 * Skipped during schema generation, form validation, and column generation.
 * Requires admin.components.Field to be set.
 */
export interface UIFieldDef extends BaseField {
  readonly type: "ui";
  /** Display label for the field in the admin form. */
  label?: string;
  /**
   * Admin config — components.Field is required for ui fields.
   */
  admin: FieldAdminConfig & {
    components: {
      Field: React.ComponentType<FieldComponentProps>;
    };
  };
}
```

Update the `VexField` union:

```typescript
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
  | RichTextFieldDef
  | UIFieldDef;
```

Update `InferFieldType` — add before the final `never`:

```typescript
  : F extends { type: "ui" }
    ? never
```

Note: `FieldAdminConfig` currently lives in a pure TypeScript file with no React dependency. Since `components` references `React.ComponentType`, you'll need to add `import type { ComponentType } from "react"` and use `ComponentType<T>` instead of `React.ComponentType<T>`. Alternatively, use a generic function type: `(props: FieldComponentProps) => React.ReactNode` as `(props: FieldComponentProps) => any` to avoid the React import in core. **Decision: use `ComponentType` from react as a type-only import** — core already has `@tanstack/react-table` as a dependency which pulls React types.

Export from `packages/core/src/index.ts`:

```typescript
// Add to field helper exports
export { ui } from "./fields/ui";

// Add to type exports
export type {
  UIFieldDef,
  FieldComponentProps,
  CellComponentProps,
} from "./types";
```

---

## Step 2: ui() Field Factory

- [ ] Create `packages/core/src/fields/ui/config.ts`
- [ ] Create `packages/core/src/fields/ui/config.test.ts`
- [ ] Create `packages/core/src/fields/ui/index.ts`
- [ ] Run tests

### `File: packages/core/src/fields/ui/config.ts`

```typescript
import type { UIFieldDef, FieldAdminConfig, FieldComponentProps } from "../../types";
import type { ComponentType } from "react";

/**
 * Creates a UI field — a non-persisted field that renders a custom component.
 * UI fields are skipped during schema generation, form validation, and column generation.
 * They are useful for computed displays, action buttons, and embedded widgets.
 *
 * @param props.label - Display label for the field
 * @param props.admin - Admin config. components.Field is required.
 * @returns A UIFieldDef
 *
 * @example
 * ```ts
 * import { ui } from "@vexcms/core";
 * import WordCount from "~/components/admin/WordCount";
 *
 * const collection = defineCollection({
 *   slug: "posts",
 *   fields: {
 *     wordCount: ui({
 *       label: "Word Count",
 *       admin: {
 *         components: { Field: WordCount },
 *         position: "sidebar",
 *       },
 *     }),
 *   },
 * });
 * ```
 */
export function ui(props: {
  label?: string;
  admin: FieldAdminConfig & {
    components: {
      Field: ComponentType<FieldComponentProps>;
    };
  };
  description?: string;
}): UIFieldDef {
  return {
    type: "ui" as const,
    label: props.label,
    description: props.description,
    admin: props.admin,
  };
}
```

### `File: packages/core/src/fields/ui/index.ts`

```typescript
export { ui } from "./config";
```

### `File: packages/core/src/fields/ui/config.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { ui } from "./config";

// Minimal mock component for testing
const MockComponent = () => null;

describe("ui field factory", () => {
  it("creates a ui field with type 'ui'", () => {
    const field = ui({
      label: "Word Count",
      admin: { components: { Field: MockComponent } },
    });
    expect(field.type).toBe("ui");
    expect(field.label).toBe("Word Count");
    expect(field.admin.components.Field).toBe(MockComponent);
  });

  it("preserves admin config properties", () => {
    const field = ui({
      label: "Stats",
      admin: {
        components: { Field: MockComponent },
        position: "sidebar",
        description: "Some stats",
      },
    });
    expect(field.admin.position).toBe("sidebar");
    expect(field.admin.description).toBe("Some stats");
  });

  it("allows optional label and description", () => {
    const field = ui({
      admin: { components: { Field: MockComponent } },
    });
    expect(field.label).toBeUndefined();
    expect(field.description).toBeUndefined();
  });
});
```

---

## Step 3: Skip ui Fields in Generation

- [ ] Modify `packages/core/src/formSchema/generateFormSchema.ts` — skip `type: "ui"`
- [ ] Modify `packages/core/src/formSchema/generateFormDefaultValues.ts` — skip `type: "ui"`
- [ ] Modify `packages/core/src/valueTypes/extract.ts` — skip `type: "ui"`
- [ ] Modify `packages/core/src/columns/generateColumns.ts` — skip `type: "ui"`
- [ ] Add tests for ui field skipping
- [ ] Run tests

### `File: packages/core/src/formSchema/generateFormSchema.ts` — modification

In `generateFormSchema`, add a skip for ui fields right after the hidden check:

```typescript
for (const [fieldName, field] of Object.entries(props.fields)) {
  if (field.admin?.hidden) continue;
  if (field.type === "ui") continue; // UI fields have no database representation

  // ... rest unchanged
}
```

### `File: packages/core/src/formSchema/generateFormDefaultValues.ts` — modification

In `generateFormDefaultValues`, skip ui fields:

```typescript
// In the function that iterates over fields:
if (field.type === "ui") continue; // UI fields have no form value
```

Also add to the `getFormDefaultValue` switch:

```typescript
case "ui":
  return undefined;
```

### `File: packages/core/src/valueTypes/extract.ts` — modification

In `fieldToValueType`, add a case for ui:

```typescript
case "ui":
  // UI fields have no database representation — this should never be called.
  // If it is, it means a ui field leaked into schema generation.
  throw new VexFieldValidationError({
    message: `UI field "${props.fieldName}" on collection "${props.collectionSlug}" has no database representation and should not be included in schema generation.`,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
  });
```

### `File: packages/core/src/columns/generateColumns.ts` — modification

In `buildColumnDef`, add before the default case:

```typescript
case "ui":
  // UI fields are not displayed in data tables — return null sentinel
  // The caller filters these out
  return null as any;
```

In the calling code (both the `defaultColumns` loop and the fallback loop), skip null results:

```typescript
// In the defaultColumns loop:
if (field.type === "ui") continue;

// In the fallback loop:
if (field.type === "ui") continue;
```

### `File: packages/core/src/formSchema/generateFormSchema.test.ts` — addition (append to existing test file)

```typescript
describe("ui field handling", () => {
  it("skips ui fields in form schema generation", () => {
    const MockComponent = () => null;
    const schema = generateFormSchema({
      fields: {
        title: { type: "text" as const, label: "Title" },
        wordCount: {
          type: "ui" as const,
          label: "Word Count",
          admin: { components: { Field: MockComponent } },
        },
      },
    });
    expect(schema.shape).toHaveProperty("title");
    expect(schema.shape).not.toHaveProperty("wordCount");
  });
});
```

---

## Step 4: Custom Cell in generateColumns

- [ ] Modify `packages/core/src/columns/generateColumns.ts` — pass `admin.components.Cell` into `column.meta`
- [ ] Add test for custom Cell meta passthrough
- [ ] Run tests

### `File: packages/core/src/columns/generateColumns.ts` — modification

In `buildColumnDef`, after building the column def, check for a custom Cell component and attach it to meta:

```typescript
function buildColumnDef(
  fieldKey: string,
  field: VexField,
): ColumnDef<Record<string, unknown>> | null {
  if (field.type === "ui") return null;

  // Build the standard column def
  let col: ColumnDef<Record<string, unknown>>;
  switch (field.type) {
    // ... existing cases unchanged ...
  }

  // Attach custom Cell component to meta if present
  if (field.admin?.components?.Cell) {
    col.meta = {
      ...col.meta,
      customCell: field.admin.components.Cell,
      fieldDef: field,
    };
  }

  return col;
}
```

Update the callers to skip null returns:

```typescript
// In the defaultColumns loop:
const col = buildColumnDef(fieldKey, field);
if (!col) continue;

// In the fallback loop:
const col = buildColumnDef(fieldKey, field);
if (!col) continue;
```

---

## Step 5: VexFormProvider

- [ ] Create `packages/ui/src/components/form/VexFormProvider.tsx`
- [ ] Run build

### `File: packages/ui/src/components/form/VexFormProvider.tsx`

```typescript
"use client";

import { createContext, useContext } from "react";
import type { FormApi } from "@tanstack/react-form";
import type { VexField, FieldComponentProps } from "@vexcms/core";

// ---------- Types ----------

interface FieldEntry {
  name: string;
  field: VexField;
  readOnly?: boolean;
}

interface VexFormContextValue {
  /** The TanStack Form instance */
  form: FormApi<Record<string, any>, any>;
  /** Map of field name → VexField definition */
  fieldDefs: Record<string, VexField>;
  /** Map of field name → readOnly status */
  readOnlyMap: Record<string, boolean>;
}

// ---------- Context ----------

const VexFormContext = createContext<VexFormContextValue | null>(null);

/**
 * Access the VexForm context. Throws if used outside VexFormProvider.
 */
export function useVexFormContext(): VexFormContextValue {
  const ctx = useContext(VexFormContext);
  if (!ctx) {
    throw new Error(
      "useVexFormContext must be used within a VexFormProvider. " +
      "Wrap your form with <VexFormProvider> or use AppForm which includes it."
    );
  }
  return ctx;
}

// ---------- Provider ----------

interface VexFormProviderProps {
  /** The TanStack Form instance */
  form: FormApi<Record<string, any>, any>;
  /** The field entries being rendered */
  fieldEntries: FieldEntry[];
  children: React.ReactNode;
}

/**
 * Provides form context for useVexField, useVexForm, and useVexFormFields hooks.
 * Wraps TanStack Form — does not replace it.
 *
 * AppForm creates this provider internally. Custom form layouts can use it directly.
 */
export function VexFormProvider(props: VexFormProviderProps) {
  const fieldDefs: Record<string, VexField> = {};
  const readOnlyMap: Record<string, boolean> = {};

  for (const entry of props.fieldEntries) {
    fieldDefs[entry.name] = entry.field;
    readOnlyMap[entry.name] = entry.readOnly ?? false;
  }

  return (
    <VexFormContext.Provider
      value={{ form: props.form, fieldDefs, readOnlyMap }}
    >
      {props.children}
    </VexFormContext.Provider>
  );
}

export type { VexFormContextValue, VexFormProviderProps, FieldEntry };
```

---

## Step 6: useVexField Hook

- [ ] Create `packages/ui/src/hooks/useVexField.ts`
- [ ] Create `packages/ui/src/hooks/useVexField.test.tsx`
- [ ] Run tests

### `File: packages/ui/src/hooks/useVexField.ts`

```typescript
"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import { useVexFormContext } from "../components/form/VexFormProvider";
import type { VexField } from "@vexcms/core";

/**
 * Return type for the useVexField hook.
 */
export interface UseVexFieldReturn<TValue = unknown> {
  /** Current field value */
  value: TValue;
  /** Set the field value */
  setValue: (value: TValue) => void;
  /** Mark the field as touched (blurred) */
  handleBlur: () => void;
  /** Validation errors for this field */
  errors: string[];
  /** Whether the field has errors and has been touched or submitted */
  showError: boolean;
  /** Whether the field is read-only (from config or permissions) */
  readOnly: boolean;
  /** The VexField definition */
  fieldDef: VexField;
  /** The field name */
  name: string;
}

/**
 * Hook for accessing and modifying a form field's value and state.
 * Must be used within a VexFormProvider (or inside AppForm).
 *
 * This is the primary hook for custom field components. It provides
 * the field value, setter, errors, and readOnly status.
 *
 * @param props.name - The field name (key in the collection's fields)
 *
 * @example
 * ```tsx
 * function ColorField({ name, fieldDef, readOnly }: FieldComponentProps) {
 *   const { value, setValue, errors, showError } = useVexField<string>({ name });
 *   return <input value={value ?? ""} onChange={e => setValue(e.target.value)} />;
 * }
 * ```
 */
export function useVexField<TValue = unknown>(props: {
  name: string;
}): UseVexFieldReturn<TValue> {
  // TODO: implement
  //
  // 1. Get the VexFormContext via useVexFormContext()
  //    → gives us form (TanStack Form instance), fieldDefs, readOnlyMap
  //
  // 2. Subscribe to the field's value from form.state.values[props.name]
  //    Use form.store.subscribe() + useSyncExternalStore for reactive updates
  //    → TanStack Form's store is a TanStack Store, which supports subscribe()
  //
  // 3. Build setValue callback that calls form.setFieldValue(props.name, value)
  //
  // 4. Build handleBlur callback that calls form.setFieldMeta(props.name, { isTouched: true })
  //    or use form.getFieldMeta / form.validateField
  //
  // 5. Extract errors from form.state.fieldMeta[props.name]?.errors
  //    → errors is an array, may contain strings or objects with .message
  //    → normalize to string[]
  //
  // 6. Determine showError: field is touched OR form has been submitted, AND errors.length > 0
  //
  // 7. Get readOnly from readOnlyMap[props.name] || fieldDefs[props.name]?.admin?.readOnly
  //
  // 8. Return { value, setValue, handleBlur, errors, showError, readOnly, fieldDef, name }
  //
  // Edge cases:
  // - Field name doesn't exist in fieldDefs: return with undefined value, don't throw
  //   (field may be dynamically added)
  // - Value is undefined vs null: preserve the distinction, don't coerce
  // - Errors may be objects with .message property: normalize to strings
  throw new Error("Not implemented");
}
```

### `File: packages/ui/src/hooks/useVexField.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVexField } from "./useVexField";
import { VexFormProvider } from "../components/form/VexFormProvider";
import { useForm } from "@tanstack/react-form";
import type { VexField } from "@vexcms/core";

// Helper to create a wrapper with VexFormProvider
function createWrapper(props: {
  defaultValues: Record<string, unknown>;
  fieldEntries: { name: string; field: VexField; readOnly?: boolean }[];
}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    const form = useForm({
      defaultValues: props.defaultValues,
    });
    return (
      <VexFormProvider form={form} fieldEntries={props.fieldEntries}>
        {children}
      </VexFormProvider>
    );
  };
}

describe("useVexField", () => {
  it("returns the current field value", () => {
    const wrapper = createWrapper({
      defaultValues: { title: "Hello" },
      fieldEntries: [
        { name: "title", field: { type: "text" as const } },
      ],
    });
    const { result } = renderHook(
      () => useVexField<string>({ name: "title" }),
      { wrapper },
    );
    expect(result.current.value).toBe("Hello");
  });

  it("updates value via setValue", () => {
    const wrapper = createWrapper({
      defaultValues: { title: "Hello" },
      fieldEntries: [
        { name: "title", field: { type: "text" as const } },
      ],
    });
    const { result } = renderHook(
      () => useVexField<string>({ name: "title" }),
      { wrapper },
    );
    act(() => {
      result.current.setValue("World");
    });
    expect(result.current.value).toBe("World");
  });

  it("returns readOnly from permissions", () => {
    const wrapper = createWrapper({
      defaultValues: { title: "Hello" },
      fieldEntries: [
        { name: "title", field: { type: "text" as const }, readOnly: true },
      ],
    });
    const { result } = renderHook(
      () => useVexField<string>({ name: "title" }),
      { wrapper },
    );
    expect(result.current.readOnly).toBe(true);
  });

  it("returns readOnly from field admin config", () => {
    const wrapper = createWrapper({
      defaultValues: { title: "Hello" },
      fieldEntries: [
        {
          name: "title",
          field: { type: "text" as const, admin: { readOnly: true } },
        },
      ],
    });
    const { result } = renderHook(
      () => useVexField<string>({ name: "title" }),
      { wrapper },
    );
    expect(result.current.readOnly).toBe(true);
  });

  it("throws when used outside VexFormProvider", () => {
    expect(() =>
      renderHook(() => useVexField({ name: "title" })),
    ).toThrow("useVexFormContext must be used within a VexFormProvider");
  });

  it("returns field definition", () => {
    const fieldDef: VexField = { type: "text" as const, label: "Title" };
    const wrapper = createWrapper({
      defaultValues: { title: "" },
      fieldEntries: [{ name: "title", field: fieldDef }],
    });
    const { result } = renderHook(
      () => useVexField({ name: "title" }),
      { wrapper },
    );
    expect(result.current.fieldDef).toEqual(fieldDef);
  });
});
```

---

## Step 7: useVexForm + useVexFormFields Hooks

- [ ] Create `packages/ui/src/hooks/useVexForm.ts`
- [ ] Create `packages/ui/src/hooks/useVexFormFields.ts`
- [ ] Create `packages/ui/src/hooks/index.ts`
- [ ] Run build

### `File: packages/ui/src/hooks/useVexForm.ts`

```typescript
"use client";

import { useCallback } from "react";
import { useVexFormContext } from "../components/form/VexFormProvider";

/**
 * Return type for the useVexForm hook.
 */
export interface UseVexFormReturn {
  /** Submit the form. Returns a promise that resolves when submission completes. */
  submit: () => Promise<void>;
  /** Reset the form to its default values, or to provided values. */
  reset: (values?: Record<string, unknown>) => void;
  /** Get all current form values. */
  getValues: () => Record<string, unknown>;
  /** Get a single field's current value. */
  getValue: <T = unknown>(name: string) => T;
  /** Whether the form is currently submitting. */
  isSubmitting: boolean;
  /** Whether any field value differs from its default value. */
  isDirty: boolean;
  /** Whether form validation passes. */
  isValid: boolean;
}

/**
 * Hook for accessing form-level state and actions.
 * Must be used within a VexFormProvider (or inside AppForm).
 *
 * Use this for submit buttons, form status indicators,
 * or components that need to read/write multiple fields.
 *
 * @example
 * ```tsx
 * function SaveButton() {
 *   const { submit, isSubmitting, isDirty } = useVexForm();
 *   return (
 *     <button onClick={submit} disabled={isSubmitting || !isDirty}>
 *       {isSubmitting ? "Saving..." : "Save"}
 *     </button>
 *   );
 * }
 * ```
 */
export function useVexForm(): UseVexFormReturn {
  // TODO: implement
  //
  // 1. Get the VexFormContext via useVexFormContext()
  //    → gives us form (TanStack Form instance)
  //
  // 2. Subscribe to form-level state:
  //    - isSubmitting: form.state.isSubmitting
  //    - isDirty: form.state.isDirty
  //    - isValid: !form.state.canSubmit inverted, or check form.state.isValid
  //
  // 3. Build submit callback: () => form.handleSubmit()
  //
  // 4. Build reset callback: (values?) => form.reset(values)
  //
  // 5. Build getValues callback: () => form.state.values
  //
  // 6. Build getValue callback: (name) => form.state.values[name]
  //
  // 7. Return all of the above
  //
  // Edge cases:
  // - submit() called while already submitting: TanStack Form handles this
  // - reset() with partial values: should merge with defaults or replace entirely?
  //   → Replace entirely (TanStack Form's reset behavior)
  throw new Error("Not implemented");
}
```

### `File: packages/ui/src/hooks/useVexFormFields.ts`

```typescript
"use client";

import { useSyncExternalStore, useCallback, useRef } from "react";
import { useVexFormContext } from "../components/form/VexFormProvider";

/**
 * Hook for watching specific field values with a selector function.
 * Only re-renders when the selected values change (shallow comparison).
 *
 * Use this when a custom component needs to react to changes in OTHER fields
 * (not its own field — use useVexField for that).
 *
 * @param props.selector - Function that receives all form values and returns the subset you need
 *
 * @example
 * ```tsx
 * function SEOPreview() {
 *   const { title, slug } = useVexFormFields({
 *     selector: (values) => ({
 *       title: values.title as string,
 *       slug: values.slug as string,
 *     }),
 *   });
 *   return <div>{title} — /{slug}</div>;
 * }
 * ```
 */
export function useVexFormFields<TResult>(props: {
  selector: (values: Record<string, unknown>) => TResult;
}): TResult {
  // TODO: implement
  //
  // 1. Get the VexFormContext via useVexFormContext()
  //    → gives us form (TanStack Form instance)
  //
  // 2. Use form.store.subscribe() + useSyncExternalStore to subscribe to form state
  //
  // 3. In the getSnapshot callback, call props.selector(form.state.values)
  //
  // 4. Return the selected result
  //
  // Edge cases:
  // - Selector returns a new object reference every time: use shallow comparison
  //   to prevent unnecessary re-renders. Cache the previous result and return it
  //   if the values haven't changed.
  // - Selector throws: let it propagate — developer error
  throw new Error("Not implemented");
}
```

### `File: packages/ui/src/hooks/index.ts`

```typescript
export { useVexField, type UseVexFieldReturn } from "./useVexField";
export { useVexForm, type UseVexFormReturn } from "./useVexForm";
export { useVexFormFields } from "./useVexFormFields";
```

---

## Step 8: Refactor Built-in Fields to Use useVexField

- [ ] Modify `packages/ui/src/components/form/fields/TextField.tsx`
- [ ] Modify `packages/ui/src/components/form/fields/NumberField.tsx`
- [ ] Modify `packages/ui/src/components/form/fields/CheckboxField.tsx`
- [ ] Modify `packages/ui/src/components/form/fields/SelectField.tsx`
- [ ] Run tests + build

The refactored fields must work in both modes:
1. **New mode**: receiving `name` only, using `useVexField()` for state (used by custom dispatch)
2. **Legacy mode**: receiving `field` (TanStack Form field API) directly (used by current AppForm render-prop pattern until fully migrated)

For a clean migration, refactor to use `useVexField()` internally. The `field` prop from TanStack Form's render-prop is no longer needed because `useVexField` subscribes to the same TanStack Form instance via context.

### `File: packages/ui/src/components/form/fields/TextField.tsx` — refactored

```typescript
"use client";

import type { TextFieldDef } from "@vexcms/core";
import { toTitleCase } from "@vexcms/core";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { useVexField } from "../../../hooks/useVexField";

interface TextFieldProps {
  /** Field name key */
  name: string;
  /**
   * TanStack Form field API (legacy prop — used when VexFormProvider is not available).
   * When omitted, useVexField() is used instead.
   */
  field?: any;
  fieldDef?: TextFieldDef;
}

function TextField(props: TextFieldProps) {
  // TODO: implement
  //
  // 1. If props.field is provided (legacy mode), use it directly for value/onChange/onBlur/errors
  //    This preserves backward compatibility during migration
  //
  // 2. If props.field is NOT provided (new mode), call useVexField<string>({ name: props.name })
  //    → get value, setValue, handleBlur, errors, showError, readOnly, fieldDef
  //
  // 3. Resolve the fieldDef: props.fieldDef ?? vexField.fieldDef (cast to TextFieldDef)
  //
  // 4. Compute label: fieldDef.label ?? toTitleCase(props.name)
  //
  // 5. Compute description: fieldDef.admin?.description ?? fieldDef.description
  //
  // 6. Render the same JSX as before but sourcing state from the appropriate mode
  //
  // Edge cases:
  // - When readOnly is true (new mode), set disabled on the input
  // - When in legacy mode and fieldDef.admin?.readOnly is set, use that
  throw new Error("Not implemented");
}

export { TextField };
```

Apply the same pattern to `NumberField.tsx`, `CheckboxField.tsx`, and `SelectField.tsx`. Each follows the same dual-mode pattern:
- If `props.field` is present → legacy mode (use props.field for state)
- If `props.field` is absent → new mode (use `useVexField()`)

**NumberField specifics:**
- `useVexField<number>({ name })`
- Handle empty string → `undefined` conversion in setValue
- Preserve `min`, `max`, `step` from fieldDef

**CheckboxField specifics:**
- `useVexField<boolean>({ name })`
- `setValue(e.target.checked)`

**SelectField specifics:**
- `useVexField<string>({ name })` for single select
- The multi-select variant (`MultiSelectField`) is NOT refactored in this spec — it stays as-is

---

## Step 9: Custom Field Dispatch in AppForm

- [ ] Modify `packages/ui/src/components/form/AppForm.tsx` — wrap in VexFormProvider, add custom Field dispatch
- [ ] Run build + test

### `File: packages/ui/src/components/form/AppForm.tsx` — modifications

**1. Import VexFormProvider and the eligible field types constant:**

```typescript
import { VexFormProvider } from "./VexFormProvider";
import type { FieldComponentProps } from "@vexcms/core";
```

**2. Define the allowed custom Field types:**

```typescript
const CUSTOM_FIELD_ELIGIBLE_TYPES = new Set(["text", "number", "checkbox", "select"]);
```

**3. Wrap the form content with VexFormProvider:**

In the return statement, wrap the `<form>` children with `<VexFormProvider form={form} fieldEntries={fieldEntries}>`:

```typescript
return (
  <form ...>
    <VexFormProvider form={form} fieldEntries={fieldEntries}>
      {onDirtyChange && <DirtyWatcher ... />}
      <div className="space-y-6">
        {fieldEntries.map((entry) => (
          // ... field rendering ...
        ))}
      </div>
    </VexFormProvider>
  </form>
);
```

**4. Add custom Field component check at the top of the field render callback:**

Inside the `fieldEntries.map` callback, before the existing `switch`, add:

```typescript
{(field) => {
  const fieldDef = entry.field;

  // Check for custom Field component
  if (fieldDef.admin?.components?.Field) {
    // Runtime validation: only eligible types can have custom Field
    if (!CUSTOM_FIELD_ELIGIBLE_TYPES.has(fieldDef.type) && fieldDef.type !== "ui") {
      console.error(
        `[VEX] admin.components.Field is not allowed on "${fieldDef.type}" fields. ` +
        `Only text, number, checkbox, select, and ui fields support custom Field components. ` +
        `Field: "${entry.name}"`
      );
      // Fall through to default rendering
    } else {
      const CustomField = fieldDef.admin.components.Field;
      return (
        <CustomField
          name={entry.name}
          fieldDef={fieldDef}
          readOnly={entry.readOnly ?? fieldDef.admin?.readOnly ?? false}
        />
      );
    }
  }

  // Handle ui fields — they MUST have a custom component (already validated by type)
  if (fieldDef.type === "ui") {
    return null; // Should not reach here — ui fields always have components.Field
  }

  // Existing switch/case for built-in fields...
  const readOnlyWrapper = ...
  switch (fieldDef.type) {
    // ... unchanged ...
  }
}}
```

**5. Validate custom Field at config time (optional runtime check):**

Add a validation in AppForm's mount that warns about invalid custom component usage. This is a dev-mode check:

```typescript
if (process.env.NODE_ENV !== "production") {
  for (const entry of fieldEntries) {
    const fieldDef = entry.field;
    if (
      fieldDef.admin?.components?.Field &&
      !CUSTOM_FIELD_ELIGIBLE_TYPES.has(fieldDef.type) &&
      fieldDef.type !== "ui"
    ) {
      console.error(
        `[VEX] admin.components.Field on "${entry.name}" (type: "${fieldDef.type}") ` +
        `will be ignored. Custom Field components are only supported on: ` +
        `text, number, checkbox, select, and ui fields.`
      );
    }
  }
}
```

---

## Step 10: UIField Component

- [ ] Create `packages/ui/src/components/form/fields/UIField.tsx`
- [ ] Update `packages/ui/src/components/form/fields/index.ts`
- [ ] Run build

### `File: packages/ui/src/components/form/fields/UIField.tsx`

```typescript
"use client";

import type { UIFieldDef, FieldComponentProps } from "@vexcms/core";

interface UIFieldProps {
  fieldDef: UIFieldDef;
  name: string;
}

/**
 * Renders a ui() field by delegating to its admin.components.Field component.
 * UI fields are non-persisted — they don't store data in the database.
 * They're used for computed displays, action buttons, and embedded widgets.
 */
function UIField(props: UIFieldProps) {
  const CustomComponent = props.fieldDef.admin.components.Field;
  return (
    <CustomComponent
      name={props.name}
      fieldDef={props.fieldDef}
      readOnly={false}
    />
  );
}

export { UIField };
```

### `File: packages/ui/src/components/form/fields/index.ts` — modification

Add:

```typescript
export { UIField } from "./UIField";
```

---

## Step 11: Custom Cell Injection in CollectionsView

- [ ] Modify `packages/admin-next/src/views/CollectionsView.tsx` — check for `meta.customCell` and inject custom Cell
- [ ] Run build

### `File: packages/admin-next/src/views/CollectionsView.tsx` — modification

After generating columns and before passing them to the DataTable, iterate and inject custom Cell renderers. This follows the same pattern already used for upload cell previews:

```typescript
// After: const columns = generateColumns({ collection, auth });
// Before: passing columns to DataTable

const columnsWithCustomCells = columns.map((col) => {
  const meta = col.meta as Record<string, any> | undefined;

  // Inject custom Cell component if present
  if (meta?.customCell) {
    const CustomCell = meta.customCell as React.ComponentType<{
      value: unknown;
      row: Record<string, unknown>;
      fieldDef: any;
    }>;
    const fieldDef = meta.fieldDef;

    return {
      ...col,
      cell: (info: any) => (
        <CustomCell
          value={info.getValue()}
          row={info.row.original}
          fieldDef={fieldDef}
        />
      ),
    };
  }

  // Existing upload cell preview injection...
  if (meta?.type === "upload") {
    // ... existing code unchanged ...
  }

  return col;
});
```

Use `columnsWithCustomCells` instead of `columns` when passing to the DataTable.

---

## Step 12: Exports + Final Integration

- [ ] Update `packages/ui/src/index.ts` — export hooks, VexFormProvider, FieldComponentProps
- [ ] Update `packages/ui/src/components/form/index.ts` (if exists) — export VexFormProvider
- [ ] Run `pnpm build` from root
- [ ] Run `pnpm --filter @vexcms/core test`
- [ ] Verify test app compiles

### `File: packages/ui/src/index.ts` — additions

```typescript
// Hooks
export {
  useVexField,
  useVexForm,
  useVexFormFields,
  type UseVexFieldReturn,
  type UseVexFormReturn,
} from "./hooks";

// Form provider
export { VexFormProvider } from "./components/form/VexFormProvider";
```

### `File: packages/core/src/index.ts` — verify exports

Ensure these are exported:

```typescript
export { ui } from "./fields/ui";

export type {
  UIFieldDef,
  FieldComponentProps,
  CellComponentProps,
} from "./types";
```

---

## Success Criteria

- [ ] `pnpm build` succeeds with no type errors
- [ ] `pnpm --filter @vexcms/core test` passes with new ui field tests
- [ ] `ui()` fields are skipped in schema generation, form schema, form defaults, and column generation
- [ ] `admin.components.Field` renders the custom component for text, number, checkbox, select fields
- [ ] `admin.components.Field` on ineligible types (upload, richtext, etc.) logs an error and falls back to built-in
- [ ] `admin.components.Cell` renders custom cell component in the data table
- [ ] `useVexField()` returns value, setValue, errors, readOnly from VexFormProvider context
- [ ] `useVexForm()` returns submit, isSubmitting, isDirty, getValues from context
- [ ] `useVexFormFields()` allows selecting specific field values with a selector
- [ ] Refactored built-in fields (text, number, checkbox, select) work identically to before
- [ ] Custom components can import `useVexField`, `useVexForm`, `useVexFormFields` from `@vexcms/ui`
- [ ] `FieldComponentProps` and `CellComponentProps` are exported from `@vexcms/core`
- [ ] UI fields with custom components render correctly in the edit form
- [ ] UI fields are excluded from the data table columns
