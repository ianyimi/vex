# 09b — Form Hooks & Custom Admin Components

## Overview

This spec adds a React Context-based form abstraction layer (`VexFormProvider`) with hooks (`useField`, `useForm`, `useFormFields`, `useDocumentInfo`) that decouple field components from TanStack Form internals. It also adds `admin.components.Field` support for custom field components on eligible field types. Existing built-in field components are refactored to use the new hooks, ensuring the same hooks that custom components use are battle-tested by the built-in UI.

## Design Decisions

1. **TanStack Form stays as the engine** — no Legend State, no custom form state. The hooks are a thin abstraction over TanStack Form's `form.Field` API, not a replacement.
2. **Direct React component references** — `admin.components.Field` accepts a `React.ComponentType`, not a string path. Type-safe, no build step required.
3. **Restricted field types** — `upload` and `richtext` fields cannot have custom `admin.components.Field` because they require special wiring (media picker state, editor adapter injection) that custom components would lose. A runtime error is thrown if attempted.
4. **`useField` merges readOnly** — combines `field.admin.readOnly` (config-level) and permission-based readOnly into a single `readOnly` boolean.
5. **Hooks live in `@vexcms/ui`** — since AppForm and field components already live there. The `useDocumentInfo` hook reads from a `DocumentContext` provided by `CollectionEditView` in `@vexcms/admin-next`.
6. **`useFormFields` uses `form.Subscribe` selector pattern** — only re-renders when selected fields change, matching PayloadCMS's performance pattern.

## Out of Scope

- `admin.components.Cell` (list view custom cells)
- `admin.components.Filter` (custom filter UI)
- `admin.components.Label`, `Error`, `Description` sub-slots
- `beforeInput` / `afterInput` slot arrays
- `ui()` field type (non-persisted display fields)
- Build-time component resolution / import maps
- `dispatchFields` action system (ADD_ROW, REMOVE_ROW for array fields)
- Server component support

## Target Directory Structure

```
packages/ui/src/
├── components/form/
│   ├── AppForm.tsx                      # MODIFIED — add VexFormProvider, component resolution
│   ├── context/
│   │   ├── VexFormContext.tsx            # NEW — form context + provider
│   │   ├── FieldContext.tsx             # NEW — per-field context (path, fieldDef, readOnly)
│   │   └── index.ts                     # NEW — re-exports
│   ├── hooks/
│   │   ├── useField.ts                  # NEW — primary field hook
│   │   ├── useForm.ts                   # NEW — form-level actions hook
│   │   ├── useFormFields.ts             # NEW — selective field access hook
│   │   └── index.ts                     # NEW — re-exports
│   ├── fields/
│   │   ├── TextField.tsx                # MODIFIED — use useField
│   │   ├── NumberField.tsx              # MODIFIED — use useField
│   │   ├── CheckboxField.tsx            # MODIFIED — use useField
│   │   ├── SelectField.tsx              # MODIFIED — use useField
│   │   ├── MultiSelectField.tsx         # MODIFIED — use useField
│   │   ├── DateField.tsx                # MODIFIED — use useField
│   │   ├── ImageUrlField.tsx            # MODIFIED — use useField
│   │   ├── UploadField.tsx              # NOT MODIFIED — keeps props-based API
│   │   └── index.ts
│   └── index.ts                         # MODIFIED — re-export hooks + context

packages/admin-next/src/
├── context/
│   └── DocumentContext.tsx              # NEW — document info context
├── hooks/
│   └── useDocumentInfo.ts              # NEW — document metadata hook
└── views/
    └── CollectionEditView.tsx           # MODIFIED — wrap with DocumentProvider

packages/core/src/
└── types/
    └── fields.ts                        # MODIFIED — add components to FieldAdminConfig
```

## Implementation Order

1. **Step 1: Types** — Add `components.Field` to `FieldAdminConfig`, add `CustomFieldComponentProps` type, add restricted field type validation
2. **Step 2: VexFormContext** — Create form context that wraps TanStack Form instance
3. **Step 3: FieldContext** — Create per-field context (path, fieldDef, readOnly)
4. **Step 4: useField hook** — Get/set field value, errors, readOnly from context
5. **Step 5: useForm hook** — Form-level actions (getData, submit, modified state)
6. **Step 6: useFormFields hook** — Selective field access with re-render optimization
7. **Step 7: Refactor built-in field components** — TextField, NumberField, CheckboxField, SelectField, MultiSelectField, DateField, ImageUrlField to use useField
8. **Step 8: AppForm integration** — Wire VexFormProvider, FieldContext, and custom component resolution into AppForm
9. **Step 9: DocumentContext + useDocumentInfo** — Document metadata context in admin-next
10. **Step 10: Final integration + re-exports** — Wire CollectionEditView, update package exports, verify build

---

## Step 1: Types — FieldAdminConfig + CustomFieldComponentProps

- [ ] Modify `packages/core/src/types/fields.ts` — add `components` to `FieldAdminConfig`
- [ ] Create `packages/ui/src/components/form/types.ts` — `CustomFieldComponentProps` type
- [ ] Run `pnpm build` to verify types compile

### File: `packages/core/src/types/fields.ts`

Add `components` property to `FieldAdminConfig`:

```typescript
// ADD to FieldAdminConfig interface, after cellAlignment:

  /**
   * Custom component overrides for the admin panel.
   *
   * Not available on `upload` or `richtext` fields — these field types
   * require built-in wiring (media picker, editor adapter) that custom
   * components cannot replicate.
   */
  components?: {
    /**
     * Custom React component that replaces the entire field input.
     * The component receives `CustomFieldComponentProps` and should use
     * `useField()` to read/write the field value.
     *
     * @example
     * ```tsx
     * import { ColorPicker } from './components/ColorPicker';
     *
     * const config = {
     *   primaryColor: text({
     *     label: 'Primary Color',
     *     admin: {
     *       components: { Field: ColorPicker },
     *     },
     *   }),
     * };
     * ```
     */
    Field?: React.ComponentType<any>;
  };
```

### File: `packages/ui/src/components/form/types.ts` (NEW)

```typescript
import type { VexField } from "@vexcms/core";

/**
 * Field types that cannot have custom admin components.
 * These require built-in wiring (media picker, editor adapter) that
 * custom components cannot replicate.
 */
export const RESTRICTED_CUSTOM_COMPONENT_TYPES = ["upload", "richtext"] as const;

/**
 * Props passed to custom field components registered via
 * `admin.components.Field`.
 *
 * Custom components should use `useField()` to get/set the field value
 * rather than reading these props directly for state management.
 */
export interface CustomFieldComponentProps {
  /** The field key name (e.g., "title", "primaryColor") */
  name: string;
  /** The VexField definition for this field */
  fieldDef: VexField;
  /** The dot-notation path to this field in the form */
  path: string;
}

/**
 * Return type of the `useField` hook.
 */
export interface UseFieldReturn<TValue = unknown> {
  /** Current field value */
  value: TValue;
  /** Set the field value */
  setValue: (value: TValue) => void;
  /** Mark the field as touched (triggers validation display) */
  handleBlur: () => void;
  /** The field key name */
  name: string;
  /** The VexField definition */
  fieldDef: VexField;
  /** Whether the field is read-only (merges config + permission readOnly) */
  readOnly: boolean;
  /** Validation error messages */
  errors: unknown[];
  /** Whether errors should be displayed (field has been touched or form submitted) */
  showErrors: boolean;
  /** Computed label from fieldDef.label or toTitleCase(name) */
  label: string;
  /** Description text from fieldDef.admin.description or fieldDef.description */
  description: string | undefined;
  /** Whether the field is required */
  required: boolean;
  /** Admin placeholder text */
  placeholder: string | undefined;
}

/**
 * Return type of the `useForm` hook.
 */
export interface UseFormReturn {
  /** Get all current form field values */
  getData: () => Record<string, unknown>;
  /** Get a single field's current value by name */
  getFieldValue: (props: { name: string }) => unknown;
  /** Whether the form has been modified from its default values */
  isModified: boolean;
  /** Whether the form is currently submitting */
  isSubmitting: boolean;
  /** Programmatically submit the form */
  submit: () => void;
}

/**
 * Return type of the `useDocumentInfo` hook.
 */
export interface UseDocumentInfoReturn {
  /** The document's Convex ID (null for new documents) */
  documentId: string | null;
  /** The collection slug */
  collectionSlug: string;
  /** Whether the collection uses versioning */
  isVersioned: boolean;
  /** The document's current status ('draft' | 'published'), if versioned */
  status: string | undefined;
  /** The document's current version number, if versioned */
  version: number | undefined;
}
```

---

## Step 2: VexFormContext

- [ ] Create `packages/ui/src/components/form/context/VexFormContext.tsx`
- [ ] Create `packages/ui/src/components/form/context/index.ts`
- [ ] Run `pnpm build`

### File: `packages/ui/src/components/form/context/VexFormContext.tsx` (NEW)

```typescript
"use client";

import { createContext, useContext } from "react";
import type { FieldEntry } from "../AppForm";

/**
 * Internal form context value. Wraps the TanStack Form instance
 * and the field entries metadata needed by hooks.
 */
interface VexFormContextValue {
  /** The TanStack Form instance */
  form: any;
  /** The field entries with name, fieldDef, and readOnly info */
  fieldEntries: FieldEntry[];
  /** Default values for the form (used for dirty checking) */
  defaultValues: Record<string, unknown>;
}

const VexFormContext = createContext<VexFormContextValue | null>(null);

/**
 * Provider component that wraps the form and exposes state to hooks.
 * This is used internally by AppForm — not by consumers directly.
 */
function VexFormProvider(props: {
  form: any;
  fieldEntries: FieldEntry[];
  defaultValues: Record<string, unknown>;
  children: React.ReactNode;
}) {
  return (
    <VexFormContext.Provider
      value={{
        form: props.form,
        fieldEntries: props.fieldEntries,
        defaultValues: props.defaultValues,
      }}
    >
      {props.children}
    </VexFormContext.Provider>
  );
}

/**
 * Internal hook to access the form context.
 * Throws if used outside a VexFormProvider.
 */
function useVexFormContext(): VexFormContextValue {
  const ctx = useContext(VexFormContext);
  if (!ctx) {
    throw new Error(
      "useVexFormContext must be used within a VexFormProvider (inside AppForm). " +
        "Make sure your component is rendered as a child of AppForm."
    );
  }
  return ctx;
}

export { VexFormProvider, useVexFormContext, type VexFormContextValue };
```

### File: `packages/ui/src/components/form/context/index.ts` (NEW)

```typescript
export { VexFormProvider, useVexFormContext, type VexFormContextValue } from "./VexFormContext";
export { FieldProvider, useFieldContext, type FieldContextValue } from "./FieldContext";
```

---

## Step 3: FieldContext

- [ ] Create `packages/ui/src/components/form/context/FieldContext.tsx`
- [ ] Update `packages/ui/src/components/form/context/index.ts` (already includes export in Step 2)
- [ ] Run `pnpm build`

### File: `packages/ui/src/components/form/context/FieldContext.tsx` (NEW)

```typescript
"use client";

import { createContext, useContext } from "react";
import type { VexField } from "@vexcms/core";

/**
 * Per-field context value. Set by AppForm when rendering each field.
 * Provides the field metadata needed by useField without prop drilling.
 */
interface FieldContextValue {
  /** The field key name (e.g., "title") */
  name: string;
  /** The VexField definition */
  fieldDef: VexField;
  /** Whether this field is read-only (permission-based) */
  permissionReadOnly: boolean;
  /** The TanStack Form field API (from form.Field render prop) */
  tanstackField: any;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/**
 * Provider set by AppForm around each field component.
 */
function FieldProvider(props: {
  name: string;
  fieldDef: VexField;
  permissionReadOnly: boolean;
  tanstackField: any;
  children: React.ReactNode;
}) {
  return (
    <FieldContext.Provider
      value={{
        name: props.name,
        fieldDef: props.fieldDef,
        permissionReadOnly: props.permissionReadOnly,
        tanstackField: props.tanstackField,
      }}
    >
      {props.children}
    </FieldContext.Provider>
  );
}

/**
 * Internal hook to access the field context.
 * Throws if used outside a FieldProvider.
 */
function useFieldContext(): FieldContextValue {
  const ctx = useContext(FieldContext);
  if (!ctx) {
    throw new Error(
      "useFieldContext must be used within a FieldProvider. " +
        "Make sure your component is rendered inside AppForm."
    );
  }
  return ctx;
}

export { FieldProvider, useFieldContext, type FieldContextValue };
```

---

## Step 4: useField hook + tests

- [ ] Create `packages/ui/src/components/form/hooks/useField.ts`
- [ ] Create `packages/ui/src/components/form/hooks/useField.test.tsx`
- [ ] Create `packages/ui/src/components/form/hooks/index.ts`
- [ ] Run `pnpm --filter @vexcms/ui test`

### File: `packages/ui/src/components/form/hooks/useField.ts` (NEW)

```typescript
"use client";

import { toTitleCase } from "@vexcms/core";
import { useFieldContext } from "../context/FieldContext";
import type { UseFieldReturn } from "../types";

/**
 * Primary hook for reading and writing field values in the admin form.
 *
 * Must be used inside a field component rendered by AppForm.
 * Built-in field components use this hook internally.
 * Custom components registered via `admin.components.Field` should use it too.
 *
 * @returns Field value, setter, metadata, and validation state
 *
 * @example
 * ```tsx
 * function ColorField() {
 *   const { value, setValue, label, readOnly, errors } = useField<string>();
 *   return (
 *     <div>
 *       <label>{label}</label>
 *       <input
 *         type="color"
 *         value={value ?? "#000000"}
 *         onChange={(e) => setValue(e.target.value)}
 *         disabled={readOnly}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
function useField<TValue = unknown>(): UseFieldReturn<TValue> {
  // TODO: implement
  //
  // 1. Call useFieldContext() to get name, fieldDef, permissionReadOnly, tanstackField
  //
  // 2. Extract value from tanstackField.state.value, cast to TValue
  //
  // 3. Compute readOnly by merging:
  //    a. fieldDef.admin?.readOnly (config-level)
  //    b. permissionReadOnly (from FieldContext, set by AppForm based on permissions)
  //    → readOnly = either is true
  //
  // 4. Compute label:
  //    → For select fields with hasMany, use fieldDef.labels?.singular
  //    → Otherwise use fieldDef.label
  //    → Fall back to toTitleCase(name)
  //
  // 5. Compute description from fieldDef.admin?.description ?? fieldDef.description
  //
  // 6. Extract errors from tanstackField.state.meta.errors ?? []
  //
  // 7. Compute showErrors — errors.length > 0 (TanStack Form handles touched state)
  //
  // 8. Return UseFieldReturn object with:
  //    - value, setValue (tanstackField.handleChange), handleBlur (tanstackField.handleBlur)
  //    - name, fieldDef, readOnly, errors, showErrors
  //    - label, description, required (fieldDef.required ?? false)
  //    - placeholder (fieldDef.admin?.placeholder) — only if fieldDef has it
  //
  // Edge cases:
  // - value may be undefined/null for optional fields — don't coerce, let component handle
  // - placeholder only exists on some field types (text, number, imageUrl) — return undefined for others
  // - label computation differs for hasMany select fields (uses labels.singular)
  throw new Error("Not implemented");
}

export { useField };
```

### File: `packages/ui/src/components/form/hooks/useField.test.tsx` (NEW)

```tsx
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useField } from "./useField";
import { FieldProvider } from "../context/FieldContext";
import type { TextFieldDef, SelectFieldDef } from "@vexcms/core";

// Helper to create a mock TanStack Form field object
function mockTanstackField(props: {
  value?: unknown;
  errors?: unknown[];
}) {
  return {
    state: {
      value: props.value ?? "",
      meta: {
        errors: props.errors ?? [],
      },
    },
    handleChange: vi.fn(),
    handleBlur: vi.fn(),
  };
}

// Helper wrapper that provides FieldContext
function createWrapper(props: {
  name: string;
  fieldDef: any;
  permissionReadOnly?: boolean;
  tanstackField: any;
}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <FieldProvider
        name={props.name}
        fieldDef={props.fieldDef}
        permissionReadOnly={props.permissionReadOnly ?? false}
        tanstackField={props.tanstackField}
      >
        {children}
      </FieldProvider>
    );
  };
}

describe("useField", () => {
  it("returns current field value", () => {
    const field = mockTanstackField({ value: "hello" });
    const fieldDef: TextFieldDef = { type: "text" };

    const { result } = renderHook(() => useField<string>(), {
      wrapper: createWrapper({
        name: "title",
        fieldDef,
        tanstackField: field,
      }),
    });

    expect(result.current.value).toBe("hello");
  });

  it("calls handleChange on setValue", () => {
    const field = mockTanstackField({ value: "" });
    const fieldDef: TextFieldDef = { type: "text" };

    const { result } = renderHook(() => useField<string>(), {
      wrapper: createWrapper({
        name: "title",
        fieldDef,
        tanstackField: field,
      }),
    });

    result.current.setValue("new value");
    expect(field.handleChange).toHaveBeenCalledWith("new value");
  });

  it("computes label from fieldDef.label", () => {
    const field = mockTanstackField({});
    const fieldDef: TextFieldDef = { type: "text", label: "My Title" };

    const { result } = renderHook(() => useField(), {
      wrapper: createWrapper({
        name: "title",
        fieldDef,
        tanstackField: field,
      }),
    });

    expect(result.current.label).toBe("My Title");
  });

  it("falls back to toTitleCase(name) when no label", () => {
    const field = mockTanstackField({});
    const fieldDef: TextFieldDef = { type: "text" };

    const { result } = renderHook(() => useField(), {
      wrapper: createWrapper({
        name: "firstName",
        fieldDef,
        tanstackField: field,
      }),
    });

    expect(result.current.label).toBe("First Name");
  });

  it("uses labels.singular for hasMany select", () => {
    const field = mockTanstackField({});
    const fieldDef: SelectFieldDef = {
      type: "select",
      options: [{ value: "a", label: "A" }],
      hasMany: true,
      labels: { singular: "Tag", plural: "Tags" },
    };

    const { result } = renderHook(() => useField(), {
      wrapper: createWrapper({
        name: "tags",
        fieldDef,
        tanstackField: field,
      }),
    });

    expect(result.current.label).toBe("Tag");
  });

  it("merges config readOnly with permission readOnly", () => {
    const field = mockTanstackField({});

    // Config readOnly = false, permission readOnly = true → readOnly
    const fieldDef: TextFieldDef = { type: "text" };
    const { result: r1 } = renderHook(() => useField(), {
      wrapper: createWrapper({
        name: "title",
        fieldDef,
        permissionReadOnly: true,
        tanstackField: field,
      }),
    });
    expect(r1.current.readOnly).toBe(true);

    // Config readOnly = true, permission readOnly = false → readOnly
    const fieldDef2: TextFieldDef = {
      type: "text",
      admin: { readOnly: true },
    };
    const { result: r2 } = renderHook(() => useField(), {
      wrapper: createWrapper({
        name: "title",
        fieldDef: fieldDef2,
        permissionReadOnly: false,
        tanstackField: field,
      }),
    });
    expect(r2.current.readOnly).toBe(true);

    // Both false → not readOnly
    const { result: r3 } = renderHook(() => useField(), {
      wrapper: createWrapper({
        name: "title",
        fieldDef,
        permissionReadOnly: false,
        tanstackField: field,
      }),
    });
    expect(r3.current.readOnly).toBe(false);
  });

  it("returns errors from TanStack Form", () => {
    const field = mockTanstackField({
      errors: ["Required", "Must be at least 3 characters"],
    });
    const fieldDef: TextFieldDef = { type: "text", required: true };

    const { result } = renderHook(() => useField(), {
      wrapper: createWrapper({
        name: "title",
        fieldDef,
        tanstackField: field,
      }),
    });

    expect(result.current.errors).toEqual([
      "Required",
      "Must be at least 3 characters",
    ]);
    expect(result.current.showErrors).toBe(true);
  });

  it("returns showErrors=false when no errors", () => {
    const field = mockTanstackField({ errors: [] });
    const fieldDef: TextFieldDef = { type: "text" };

    const { result } = renderHook(() => useField(), {
      wrapper: createWrapper({
        name: "title",
        fieldDef,
        tanstackField: field,
      }),
    });

    expect(result.current.showErrors).toBe(false);
  });

  it("throws when used outside FieldProvider", () => {
    expect(() => {
      renderHook(() => useField());
    }).toThrow("useFieldContext must be used within a FieldProvider");
  });

  it("returns description from admin config or field level", () => {
    const field = mockTanstackField({});
    const fieldDef: TextFieldDef = {
      type: "text",
      description: "field-level desc",
      admin: { description: "admin desc" },
    };

    const { result } = renderHook(() => useField(), {
      wrapper: createWrapper({
        name: "title",
        fieldDef,
        tanstackField: field,
      }),
    });

    // admin.description takes precedence
    expect(result.current.description).toBe("admin desc");
  });

  it("returns placeholder for text fields", () => {
    const field = mockTanstackField({});
    const fieldDef: TextFieldDef = {
      type: "text",
      admin: { placeholder: "Enter title..." },
    };

    const { result } = renderHook(() => useField(), {
      wrapper: createWrapper({
        name: "title",
        fieldDef,
        tanstackField: field,
      }),
    });

    expect(result.current.placeholder).toBe("Enter title...");
  });
});
```

### File: `packages/ui/src/components/form/hooks/index.ts` (NEW)

```typescript
export { useField } from "./useField";
export { useForm } from "./useForm";
export { useFormFields } from "./useFormFields";
```

---

## Step 5: useForm hook + tests

- [ ] Create `packages/ui/src/components/form/hooks/useForm.ts`
- [ ] Create `packages/ui/src/components/form/hooks/useForm.test.tsx`
- [ ] Run `pnpm --filter @vexcms/ui test`

### File: `packages/ui/src/components/form/hooks/useForm.ts` (NEW)

```typescript
"use client";

import { useVexFormContext } from "../context/VexFormContext";
import type { UseFormReturn } from "../types";

/**
 * Hook for form-level actions and state.
 *
 * Unlike `useField` (which is per-field), `useForm` provides access to
 * the entire form: reading all values, checking modified state, and
 * triggering submission.
 *
 * **Performance note:** This hook subscribes to form-level state.
 * For accessing specific field values performantly, use `useFormFields`
 * with a selector instead.
 *
 * @example
 * ```tsx
 * function SaveIndicator() {
 *   const { isModified, submit } = useForm();
 *   return isModified ? <button onClick={submit}>Save</button> : null;
 * }
 * ```
 */
function useForm(): UseFormReturn {
  // TODO: implement
  //
  // 1. Call useVexFormContext() to get { form, fieldEntries, defaultValues }
  //
  // 2. Build getData():
  //    → Iterate fieldEntries, read form.state.values[entry.name] for each
  //    → Return Record<string, unknown> of all current values
  //
  // 3. Build getFieldValue({ name }):
  //    → Return form.state.values[name]
  //
  // 4. Compute isModified:
  //    → Check if any fieldEntry's current value differs from defaultValues
  //    → Use form.state.values for current, compare with defaultValues
  //    → Note: this reads form.state which causes re-renders on any change.
  //      This is acceptable for useForm — use useFormFields for granular access.
  //
  // 5. Read isSubmitting from form.state.isSubmitting
  //
  // 6. Build submit():
  //    → Call form.handleSubmit()
  //
  // Edge cases:
  // - Called outside VexFormProvider: throws (useVexFormContext handles this)
  // - isModified comparison uses === (reference equality), same as DirtyWatcher
  throw new Error("Not implemented");
}

export { useForm };
```

### File: `packages/ui/src/components/form/hooks/useForm.test.tsx` (NEW)

```tsx
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useForm } from "./useForm";
import { VexFormProvider } from "../context/VexFormContext";

function mockForm(props: {
  values?: Record<string, unknown>;
  isSubmitting?: boolean;
}) {
  return {
    state: {
      values: props.values ?? {},
      isSubmitting: props.isSubmitting ?? false,
    },
    handleSubmit: vi.fn(),
  };
}

function createWrapper(props: {
  form: any;
  fieldEntries?: Array<{ name: string; field: any; readOnly?: boolean }>;
  defaultValues?: Record<string, unknown>;
}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <VexFormProvider
        form={props.form}
        fieldEntries={
          props.fieldEntries ?? [
            { name: "title", field: { type: "text" } },
            { name: "status", field: { type: "text" } },
          ]
        }
        defaultValues={props.defaultValues ?? { title: "Hello", status: "draft" }}
      >
        {children}
      </VexFormProvider>
    );
  };
}

describe("useForm", () => {
  it("getData returns current form values for all field entries", () => {
    const form = mockForm({
      values: { title: "Hello", status: "published", extraField: "ignored" },
    });

    const { result } = renderHook(() => useForm(), {
      wrapper: createWrapper({ form }),
    });

    const data = result.current.getData();
    expect(data).toEqual({ title: "Hello", status: "published" });
    // extraField should not be included (not in fieldEntries)
    expect(data).not.toHaveProperty("extraField");
  });

  it("getFieldValue returns a single field value", () => {
    const form = mockForm({ values: { title: "Test" } });

    const { result } = renderHook(() => useForm(), {
      wrapper: createWrapper({ form }),
    });

    expect(result.current.getFieldValue({ name: "title" })).toBe("Test");
  });

  it("isModified is false when values match defaults", () => {
    const form = mockForm({
      values: { title: "Hello", status: "draft" },
    });

    const { result } = renderHook(() => useForm(), {
      wrapper: createWrapper({
        form,
        defaultValues: { title: "Hello", status: "draft" },
      }),
    });

    expect(result.current.isModified).toBe(false);
  });

  it("isModified is true when any value differs from default", () => {
    const form = mockForm({
      values: { title: "Changed", status: "draft" },
    });

    const { result } = renderHook(() => useForm(), {
      wrapper: createWrapper({
        form,
        defaultValues: { title: "Hello", status: "draft" },
      }),
    });

    expect(result.current.isModified).toBe(true);
  });

  it("submit calls form.handleSubmit", () => {
    const form = mockForm({ values: {} });

    const { result } = renderHook(() => useForm(), {
      wrapper: createWrapper({ form }),
    });

    result.current.submit();
    expect(form.handleSubmit).toHaveBeenCalled();
  });

  it("throws when used outside VexFormProvider", () => {
    expect(() => {
      renderHook(() => useForm());
    }).toThrow("useVexFormContext must be used within a VexFormProvider");
  });
});
```

---

## Step 6: useFormFields hook + tests

- [ ] Create `packages/ui/src/components/form/hooks/useFormFields.ts`
- [ ] Create `packages/ui/src/components/form/hooks/useFormFields.test.tsx`
- [ ] Run `pnpm --filter @vexcms/ui test`

### File: `packages/ui/src/components/form/hooks/useFormFields.ts` (NEW)

```typescript
"use client";

import { useSyncExternalStore, useCallback, useRef } from "react";
import { useVexFormContext } from "../context/VexFormContext";

/**
 * Performant hook for accessing specific field values from the form.
 *
 * Takes a selector function that receives all current form values and
 * returns a derived value. The component only re-renders when the
 * selector's return value changes (shallow comparison).
 *
 * This is the recommended way to access sibling field values from a
 * custom component without causing unnecessary re-renders.
 *
 * @param selector - Function that receives form values and returns derived data
 * @returns The selector's return value
 *
 * @example
 * ```tsx
 * // Only re-renders when title or slug change
 * function SlugPreview() {
 *   const { title, slug } = useFormFields((values) => ({
 *     title: values.title as string,
 *     slug: values.slug as string,
 *   }));
 *   return <p>/{slug || slugify(title)}</p>;
 * }
 * ```
 */
function useFormFields<TResult>(props: {
  selector: (values: Record<string, unknown>) => TResult;
}): TResult {
  // TODO: implement
  //
  // 1. Call useVexFormContext() to get { form }
  //
  // 2. Use form.Subscribe pattern or form.state.values with
  //    useSyncExternalStore / useRef for memoization:
  //
  //    a. Read current values from form.state.values
  //    b. Apply props.selector to get derived result
  //    c. Compare with previous result (shallow equality for objects,
  //       === for primitives)
  //    d. Return cached result if unchanged, new result if changed
  //
  // 3. The key performance property: if the selector returns the same
  //    value (by shallow comparison), the component does NOT re-render.
  //
  // Implementation approach — use useRef to cache:
  //    - Store previous selector result in a ref
  //    - On each call, compute new result
  //    - If shallowEqual(prev, new), return prev (same reference = no re-render)
  //    - If different, update ref and return new
  //
  // Note: TanStack Form's form.state.values is reactive — reading it
  // in a component will cause re-renders when any value changes.
  // The selector + shallow comparison pattern prevents propagating
  // those re-renders to consumers when the selected subset hasn't changed.
  //
  // Edge cases:
  // - Selector returns a primitive (string, number): use === comparison
  // - Selector returns an object: use shallow comparison (Object.keys + ===)
  // - Selector returns undefined: handle gracefully
  // - First render: no previous value, always return new result
  throw new Error("Not implemented");
}

export { useFormFields };
```

### File: `packages/ui/src/components/form/hooks/useFormFields.test.tsx` (NEW)

```tsx
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFormFields } from "./useFormFields";
import { VexFormProvider } from "../context/VexFormContext";

function mockForm(values: Record<string, unknown>) {
  return {
    state: {
      values,
      isSubmitting: false,
    },
    handleSubmit: vi.fn(),
  };
}

function createWrapper(form: any) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <VexFormProvider
        form={form}
        fieldEntries={[
          { name: "title", field: { type: "text" as const } },
          { name: "status", field: { type: "text" as const } },
          { name: "count", field: { type: "number" as const } },
        ]}
        defaultValues={{ title: "", status: "draft", count: 0 }}
      >
        {children}
      </VexFormProvider>
    );
  };
}

describe("useFormFields", () => {
  it("returns selected field values", () => {
    const form = mockForm({ title: "Hello", status: "published", count: 5 });

    const { result } = renderHook(
      () =>
        useFormFields({
          selector: (values) => ({
            title: values.title as string,
            count: values.count as number,
          }),
        }),
      { wrapper: createWrapper(form) }
    );

    expect(result.current).toEqual({ title: "Hello", count: 5 });
  });

  it("returns primitive value from selector", () => {
    const form = mockForm({ title: "Hello", count: 42 });

    const { result } = renderHook(
      () =>
        useFormFields({
          selector: (values) => values.count as number,
        }),
      { wrapper: createWrapper(form) }
    );

    expect(result.current).toBe(42);
  });

  it("returns undefined for missing fields", () => {
    const form = mockForm({ title: "Hello" });

    const { result } = renderHook(
      () =>
        useFormFields({
          selector: (values) => values.nonexistent as string | undefined,
        }),
      { wrapper: createWrapper(form) }
    );

    expect(result.current).toBeUndefined();
  });

  it("throws when used outside VexFormProvider", () => {
    expect(() => {
      renderHook(() =>
        useFormFields({ selector: (values) => values.title })
      );
    }).toThrow("useVexFormContext must be used within a VexFormProvider");
  });
});
```

---

## Step 7: Refactor built-in field components

- [ ] Modify `packages/ui/src/components/form/fields/TextField.tsx` — use `useField`
- [ ] Modify `packages/ui/src/components/form/fields/NumberField.tsx` — use `useField`
- [ ] Modify `packages/ui/src/components/form/fields/CheckboxField.tsx` — use `useField`
- [ ] Modify `packages/ui/src/components/form/fields/SelectField.tsx` — use `useField`
- [ ] Modify `packages/ui/src/components/form/fields/MultiSelectField.tsx` — use `useField`
- [ ] Modify `packages/ui/src/components/form/fields/DateField.tsx` — use `useField`
- [ ] Modify `packages/ui/src/components/form/fields/ImageUrlField.tsx` — use `useField`
- [ ] Run `pnpm --filter @vexcms/ui test`
- [ ] Verify test-app still works

Each component is refactored to:
1. Remove `field`, `fieldDef`, and `name` props
2. Call `useField()` to get all needed state
3. Keep the exact same rendered output

**UploadField is NOT refactored** — it receives extra media picker props that go beyond useField's scope.

### Refactored TextField (pattern for all simple fields)

```tsx
"use client";

import type { TextFieldDef } from "@vexcms/core";
import { useField } from "../hooks/useField";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

/**
 * Built-in text field component.
 * Uses useField() for form state — same hook available to custom components.
 */
function TextField() {
  const {
    value,
    setValue,
    handleBlur,
    name,
    fieldDef,
    label,
    description,
    readOnly,
    required,
    placeholder,
    errors,
    showErrors,
  } = useField<string>();

  const textDef = fieldDef as TextFieldDef;

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={name}
        value={value ?? ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setValue(e.target.value)
        }
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={readOnly}
        maxLength={textDef.maxLength}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {showErrors && (
        <div>
          {errors.map((error: unknown, i: number) => (
            <p key={i} className="text-xs text-destructive">
              {typeof error === "string"
                ? error
                : ((error as any)?.message ?? String(error))}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export { TextField };
```

### Refactored NumberField

```tsx
"use client";

import type { NumberFieldDef } from "@vexcms/core";
import { useField } from "../hooks/useField";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

function NumberField() {
  const {
    value,
    setValue,
    handleBlur,
    name,
    fieldDef,
    label,
    description,
    readOnly,
    required,
    placeholder,
    errors,
    showErrors,
  } = useField<number | undefined>();

  const numDef = fieldDef as NumberFieldDef;

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type="number"
        value={value ?? ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const raw = e.target.value;
          if (raw === "") {
            setValue(undefined);
            return;
          }
          const num = Number(raw);
          if (!Number.isNaN(num)) {
            setValue(num);
          }
        }}
        onBlur={handleBlur}
        min={numDef.min}
        max={numDef.max}
        step={numDef.step}
        disabled={readOnly}
        placeholder={placeholder}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {showErrors && (
        <div>
          {errors.map((error: unknown, i: number) => (
            <p key={i} className="text-xs text-destructive">
              {typeof error === "string" ? error : (error as any)?.message ?? String(error)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export { NumberField };
```

### Refactored CheckboxFieldForm

```tsx
"use client";

import { useField } from "../hooks/useField";
import { CheckboxField as CheckboxInput } from "../../ui/checkbox-field";
import { Label } from "../../ui/label";

function CheckboxFieldForm() {
  const {
    value,
    setValue,
    handleBlur,
    name,
    label,
    description,
    readOnly,
    errors,
    showErrors,
  } = useField<boolean>();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <CheckboxInput
          id={name}
          checked={value ?? false}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.checked)}
          onBlur={handleBlur}
          disabled={readOnly}
        />
        <Label htmlFor={name}>{label}</Label>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {showErrors && (
        <div>
          {errors.map((error: unknown, i: number) => (
            <p key={i} className="text-xs text-destructive">
              {typeof error === "string" ? error : (error as any)?.message ?? String(error)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export { CheckboxFieldForm };
```

### Refactored SelectField

```tsx
"use client";

import type { SelectFieldDef } from "@vexcms/core";
import { useField } from "../hooks/useField";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../ui/select";
import { Label } from "../../ui/label";

function SelectField() {
  const {
    value,
    setValue,
    name,
    fieldDef,
    label,
    description,
    readOnly,
    required,
    errors,
    showErrors,
  } = useField<string>();

  const selectDef = fieldDef as SelectFieldDef;

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select
        value={value ?? null}
        onValueChange={(val) => setValue(val)}
        disabled={readOnly}
        items={selectDef.options}
      >
        <SelectTrigger id={name}>
          <SelectValue placeholder={!required ? "Select..." : undefined} />
        </SelectTrigger>
        <SelectContent>
          {selectDef.options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {showErrors && (
        <div>
          {errors.map((error: unknown, i: number) => (
            <p key={i} className="text-xs text-destructive">
              {typeof error === "string" ? error : (error as any)?.message ?? String(error)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export { SelectField };
```

### Refactored MultiSelectField

```tsx
"use client";

import type { SelectFieldDef } from "@vexcms/core";
import { useField } from "../hooks/useField";
import { Label } from "../../ui/label";
import {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectValue,
  MultiSelectContent,
  MultiSelectItem,
} from "../../ui/multi-select";

function MultiSelectField() {
  const {
    value,
    setValue,
    name,
    fieldDef,
    label,
    description,
    readOnly,
    required,
    errors,
    showErrors,
  } = useField<string[]>();

  const selectDef = fieldDef as SelectFieldDef;

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <MultiSelect
        values={Array.isArray(value) ? value : []}
        onValuesChange={(vals) => setValue(vals)}
      >
        <MultiSelectTrigger id={name} disabled={readOnly}>
          <MultiSelectValue placeholder="Select..." />
        </MultiSelectTrigger>
        <MultiSelectContent>
          {selectDef.options.map((opt) => (
            <MultiSelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {showErrors && (
        <div>
          {errors.map((error: unknown, i: number) => (
            <p key={i} className="text-xs text-destructive">
              {typeof error === "string"
                ? error
                : (error as any)?.message ?? String(error)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export { MultiSelectField };
```

### Refactored DateField

```tsx
"use client";

import { useField } from "../hooks/useField";
import { DatePicker } from "../../ui/date-picker";
import { Label } from "../../ui/label";

function DateField() {
  const {
    value,
    setValue,
    name,
    label,
    description,
    readOnly,
    required,
    errors,
    showErrors,
  } = useField<number | undefined>();

  const dateValue = value != null ? new Date(value) : undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <DatePicker
        value={dateValue}
        onChange={(date) => {
          setValue(date ? date.getTime() : undefined);
        }}
        disabled={readOnly}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {showErrors && (
        <div>
          {errors.map((error: unknown, i: number) => (
            <p key={i} className="text-xs text-destructive">
              {typeof error === "string" ? error : (error as any)?.message ?? String(error)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export { DateField };
```

### Refactored ImageUrlField

```tsx
"use client";

import * as React from "react";
import { useField } from "../hooks/useField";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

function ImageUrlField() {
  const {
    value,
    setValue,
    handleBlur,
    name,
    label,
    description,
    readOnly,
    required,
    placeholder,
    errors,
    showErrors,
  } = useField<string>();

  const strValue = value ?? "";
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [strValue]);

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type="url"
        value={strValue}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder ?? "https://..."}
        disabled={readOnly}
      />
      {strValue && !imgError && (
        <img
          src={strValue}
          alt=""
          className="h-16 w-16 rounded object-cover"
          onError={() => setImgError(true)}
        />
      )}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {showErrors && (
        <div>
          {errors.map((error: unknown, i: number) => (
            <p key={i} className="text-xs text-destructive">
              {typeof error === "string"
                ? error
                : ((error as any)?.message ?? String(error))}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export { ImageUrlField };
```

---

## Step 8: AppForm integration

- [ ] Modify `packages/ui/src/components/form/AppForm.tsx` — wrap with VexFormProvider, wrap each field with FieldProvider, add custom component resolution
- [ ] Add runtime validation for restricted field types with custom components
- [ ] Run `pnpm --filter @vexcms/ui test`
- [ ] Verify test-app still works

### AppForm changes (guided)

The AppForm component needs these modifications:

```typescript
// AppForm.tsx — key changes

// 1. Import new context providers
import { VexFormProvider } from "./context/VexFormContext";
import { FieldProvider } from "./context/FieldContext";
import { RESTRICTED_CUSTOM_COMPONENT_TYPES } from "./types";

// 2. Inside the AppForm function, after creating the form with useForm(),
//    wrap the entire rendered output with VexFormProvider:
//
//    <VexFormProvider form={form} fieldEntries={fieldEntries} defaultValues={defaultValues}>
//      <form ...>
//        ...
//      </form>
//    </VexFormProvider>

// 3. In the fieldEntries.map() render, wrap each field with FieldProvider:
//
//    <form.Field key={entry.name} name={entry.name}>
//      {(field) => {
//        const fieldDef = entry.field;
//
//        // Runtime check: restricted types cannot have custom Field component
//        if (
//          fieldDef.admin?.components?.Field &&
//          RESTRICTED_CUSTOM_COMPONENT_TYPES.includes(fieldDef.type as any)
//        ) {
//          console.error(
//            `[VexCMS] Field "${entry.name}" (type: ${fieldDef.type}) cannot have a custom ` +
//            `admin.components.Field. Upload and richtext fields require built-in wiring.`
//          );
//        }
//
//        // Check for custom component (only on non-restricted types)
//        const CustomComponent = fieldDef.admin?.components?.Field;
//        const canUseCustom = CustomComponent &&
//          !RESTRICTED_CUSTOM_COMPONENT_TYPES.includes(fieldDef.type as any);
//
//        // Wrap readOnly (permission-based) — config readOnly is handled inside useField
//        const readOnlyWrapper = (node: React.ReactNode) =>
//          entry.readOnly ? (
//            <div className="opacity-60 pointer-events-none" aria-disabled="true">
//              {node}
//            </div>
//          ) : node;
//
//        return (
//          <FieldProvider
//            name={entry.name}
//            fieldDef={fieldDef}
//            permissionReadOnly={entry.readOnly ?? false}
//            tanstackField={field}
//          >
//            {canUseCustom
//              ? readOnlyWrapper(
//                  <CustomComponent
//                    name={entry.name}
//                    fieldDef={fieldDef}
//                    path={entry.name}
//                  />
//                )
//              : /* existing switch statement for built-in components */}
//          </FieldProvider>
//        );
//      }}
//    </form.Field>

// 4. For refactored built-in components (text, number, checkbox, select,
//    multiSelect, date, imageUrl), remove the props — they now use useField():
//
//    case "text":
//      return readOnlyWrapper(<TextField />);  // no props needed
//
// 5. For upload and richtext, keep the existing props-based rendering
//    (they are NOT refactored to use useField)
```

**Key constraint:** The `readOnlyWrapper` div with `pointer-events-none` must remain for permission-based readOnly. The `useField` hook exposes `readOnly` for the component's internal use (e.g., setting `disabled` on inputs), but the wrapper prevents all pointer interaction including tabbing/focus, which is the correct UX for permission-denied fields.

---

## Step 9: DocumentContext + useDocumentInfo

- [ ] Create `packages/admin-next/src/context/DocumentContext.tsx`
- [ ] Create `packages/admin-next/src/hooks/useDocumentInfo.ts`
- [ ] Create `packages/admin-next/src/hooks/useDocumentInfo.test.tsx`
- [ ] Run `pnpm --filter @vexcms/admin-next test` (or build)

### File: `packages/admin-next/src/context/DocumentContext.tsx` (NEW)

```typescript
"use client";

import { createContext, useContext } from "react";
import type { UseDocumentInfoReturn } from "@vexcms/ui";

const DocumentContext = createContext<UseDocumentInfoReturn | null>(null);

/**
 * Provider that exposes document metadata to descendant components.
 * Set by CollectionEditView around the form.
 */
function DocumentProvider(props: {
  value: UseDocumentInfoReturn;
  children: React.ReactNode;
}) {
  return (
    <DocumentContext.Provider value={props.value}>
      {props.children}
    </DocumentContext.Provider>
  );
}

function useDocumentContext(): UseDocumentInfoReturn | null {
  return useContext(DocumentContext);
}

export { DocumentProvider, useDocumentContext };
```

### File: `packages/admin-next/src/hooks/useDocumentInfo.ts` (NEW)

```typescript
"use client";

import type { UseDocumentInfoReturn } from "@vexcms/ui";
import { useDocumentContext } from "../context/DocumentContext";

/**
 * Hook to access document-level metadata (ID, collection, status, version).
 *
 * Must be used inside a DocumentProvider (provided by CollectionEditView).
 * Returns document info for custom components that need to know about
 * the current document being edited.
 *
 * @example
 * ```tsx
 * function MyCustomField() {
 *   const { documentId, collectionSlug, isVersioned } = useDocumentInfo();
 *   // Use document metadata for custom logic
 * }
 * ```
 */
function useDocumentInfo(): UseDocumentInfoReturn {
  const ctx = useDocumentContext();
  if (!ctx) {
    throw new Error(
      "useDocumentInfo must be used within a DocumentProvider. " +
        "Make sure your component is rendered inside CollectionEditView."
    );
  }
  return ctx;
}

export { useDocumentInfo };
```

### File: `packages/admin-next/src/hooks/useDocumentInfo.test.tsx` (NEW)

```tsx
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDocumentInfo } from "./useDocumentInfo";
import { DocumentProvider } from "../context/DocumentContext";
import type { UseDocumentInfoReturn } from "@vexcms/ui";

function createWrapper(value: UseDocumentInfoReturn) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <DocumentProvider value={value}>
        {children}
      </DocumentProvider>
    );
  };
}

describe("useDocumentInfo", () => {
  it("returns document metadata from context", () => {
    const docInfo: UseDocumentInfoReturn = {
      documentId: "abc123",
      collectionSlug: "posts",
      isVersioned: true,
      status: "draft",
      version: 3,
    };

    const { result } = renderHook(() => useDocumentInfo(), {
      wrapper: createWrapper(docInfo),
    });

    expect(result.current.documentId).toBe("abc123");
    expect(result.current.collectionSlug).toBe("posts");
    expect(result.current.isVersioned).toBe(true);
    expect(result.current.status).toBe("draft");
    expect(result.current.version).toBe(3);
  });

  it("returns undefined status/version for non-versioned collections", () => {
    const docInfo: UseDocumentInfoReturn = {
      documentId: "xyz789",
      collectionSlug: "settings",
      isVersioned: false,
      status: undefined,
      version: undefined,
    };

    const { result } = renderHook(() => useDocumentInfo(), {
      wrapper: createWrapper(docInfo),
    });

    expect(result.current.isVersioned).toBe(false);
    expect(result.current.status).toBeUndefined();
    expect(result.current.version).toBeUndefined();
  });

  it("throws when used outside DocumentProvider", () => {
    expect(() => {
      renderHook(() => useDocumentInfo());
    }).toThrow("useDocumentInfo must be used within a DocumentProvider");
  });
});
```

---

## Step 10: Final integration + re-exports

- [ ] Modify `packages/admin-next/src/views/CollectionEditView.tsx` — wrap with DocumentProvider
- [ ] Update `packages/ui/src/components/form/index.ts` — re-export hooks and types
- [ ] Update `packages/ui/src/index.ts` if needed
- [ ] Run `pnpm build` (full monorepo)
- [ ] Run `pnpm --filter @vexcms/ui test`
- [ ] Run `pnpm --filter @vexcms/admin-next test` (or build)
- [ ] Verify test-app works end-to-end

### CollectionEditView changes

```typescript
// Add import
import { DocumentProvider } from "../context/DocumentContext";

// Inside CollectionEditView, compute document info:
const documentInfo = useMemo(() => ({
  documentId: documentID,
  collectionSlug: collection.slug,
  isVersioned,
  status: isVersioned && document ? (document.vex_status as string | undefined) : undefined,
  version: isVersioned && document ? (document.vex_version as number | undefined) : undefined,
}), [documentID, collection.slug, isVersioned, document]);

// Wrap the form section with DocumentProvider:
// Replace:
//   <AppForm ... />
// With:
//   <DocumentProvider value={documentInfo}>
//     <AppForm ... />
//   </DocumentProvider>
```

### Updated form/index.ts re-exports

```typescript
export { AppForm, type AppFormProps, type FieldEntry, type MediaPickerState } from "./AppForm";
export * from "./fields";
export * from "./hooks";
export * from "./context";
export * from "./types";
```

### Package-level exports to add

In `@vexcms/ui` public exports:
- `useField`
- `useForm`
- `useFormFields`
- `type UseFieldReturn`
- `type UseFormReturn`
- `type UseDocumentInfoReturn`
- `type CustomFieldComponentProps`

In `@vexcms/admin-next` public exports:
- `useDocumentInfo`
- `DocumentProvider`

---

## Success Criteria

- [ ] `useField()` hook returns value, setValue, readOnly (merged), errors, label, description for any field
- [ ] `useForm()` hook returns getData, getFieldValue, isModified, isSubmitting, submit
- [ ] `useFormFields({ selector })` hook returns selected values without re-rendering on unrelated changes
- [ ] `useDocumentInfo()` hook returns documentId, collectionSlug, isVersioned, status, version
- [ ] All 7 refactored field components (TextField, NumberField, CheckboxField, SelectField, MultiSelectField, DateField, ImageUrlField) use `useField()` with identical rendered output
- [ ] UploadField and richtext keep their existing props-based API (not refactored)
- [ ] `admin.components.Field` on a text/number/checkbox/select/date/imageUrl/json/array field renders the custom component
- [ ] `admin.components.Field` on upload or richtext field logs a console error and renders the built-in component
- [ ] Custom components can call `useField()`, `useForm()`, `useFormFields()` to interact with form state
- [ ] All existing tests pass
- [ ] Full monorepo builds (`pnpm build`)
- [ ] Test app works end-to-end (create, edit, save with both built-in and custom components)
