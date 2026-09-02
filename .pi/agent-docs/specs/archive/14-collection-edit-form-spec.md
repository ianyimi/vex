# 14 — Collection Edit Form

## Overview

Implement the `CollectionEditView` with a dynamically generated form that renders the correct input component for each field type in a collection. The form is built from a Zod schema generated at runtime from the collection's field metadata, validated on submit via TanStack Form + Zod, and saved via a Convex mutation with server-side Zod validation.

## Design Decisions

- **Zod schema generation lives in `@vexcms/core`** — it's pure logic, testable without React, and reused by both the client form and the server-side mutation validation.
- **`AppForm` component lives in `@vexcms/ui`** — wraps TanStack Form, accepts a Zod schema + field entries, and renders the correct input for each field. Consuming packages (like `@vexcms/admin-next`) just pass data and get a form.
- **Validation runs on submit only** — no blur validation. Keeps it simple and non-noisy.
- **Partial patch on save** — only changed fields are sent to the Convex mutation, not the entire document.
- **Server-side Zod validation** — the `updateDocument` mutation re-generates the Zod schema from the collection config and runs `safeParse` on the incoming payload before writing.
- **Date picker** — uses `react-day-picker` + `date-fns` composed with a Popover + Calendar pattern (shadcn approach). Converts to/from epoch ms for Convex storage.
- **Read-only fields** render as disabled inputs.
- **System fields (`_id`, `_creationTime`)** are excluded from the form. `_id` is displayed in the header as muted text.
- **No form layout (main/sidebar, half-width) in this spec** — all fields render in a single vertical column. Layout is a future spec.

## Out of Scope

- Create new document flow (edit-only)
- Relationship field input (combobox with search)
- Array field input (repeatable sub-forms)
- JSON field input (code editor)
- Image upload (imageUrl renders as a plain text URL input)
- Form dirty state / unsaved changes warning
- Delete document button
- Undo/redo
- Field-level permissions / conditional visibility
- Main/sidebar layout positioning and half-width fields
- Toast/notification on save success/failure
- Optimistic updates

## Target Directory Structure

```
packages/core/src/
├── formSchema/
│   ├── generateFormSchema.ts        # Zod schema generation from VexField[]
│   └── generateFormSchema.test.ts   # Unit tests
│
packages/ui/src/
├── components/
│   ├── ui/
│   │   ├── calendar.tsx             # Calendar component (react-day-picker)
│   │   ├── date-picker.tsx          # DatePicker composition (Popover + Calendar)
│   │   ├── label.tsx                # Label component
│   │   ├── popover.tsx              # Popover component (@base-ui/react)
│   │   ├── select-native.tsx        # Native <select> wrapper for form use
│   │   ├── checkbox-field.tsx       # Checkbox input for forms
│   │   └── index.tsx                # Updated barrel export
│   └── form/
│       ├── AppForm.tsx              # TanStack Form wrapper with Zod + field rendering
│       ├── fields/
│       │   ├── TextField.tsx        # Text input field
│       │   ├── NumberField.tsx      # Number input field
│       │   ├── CheckboxField.tsx    # Checkbox toggle field
│       │   ├── SelectField.tsx      # Select dropdown field
│       │   ├── DateField.tsx        # Date picker field
│       │   └── ImageUrlField.tsx    # URL text input field
│       └── index.ts                 # Barrel export
│
packages/admin-next/src/
├── views/
│   └── CollectionEditView.tsx       # Wired up: fetch doc, render AppForm, save
│
apps/test-app/convex/vex/
├── collections.ts                   # Add getDocument query + updateDocument mutation
└── model/
    └── collections.ts               # Add getDocument + updateDocument handlers
```

## Implementation Order

1. **Install dependencies** — Add `zod` to `@vexcms/core`, add `@tanstack/react-form`, `zod`, `react-day-picker`, `date-fns` to `@vexcms/ui`, add `@tanstack/react-form` + `zod` to `@vexcms/admin-next`. Verify build.
2. **`generateFormSchema`** — Core Zod schema generation function + tests in `@vexcms/core`. After this step, `pnpm test` passes in core.
3. **UI primitives** — Label, Popover, Calendar, DatePicker, SelectNative, CheckboxField components in `@vexcms/ui`. After this step, `pnpm build` passes in ui.
4. **Form field components** — TextField, NumberField, CheckboxField, SelectField, DateField, ImageUrlField in `@vexcms/ui/form/fields/`. After this step, `pnpm build` passes in ui.
5. **`AppForm` component** — TanStack Form wrapper in `@vexcms/ui`. After this step, `pnpm build` passes in ui.
6. **Convex model + queries** — `getDocument` query and `updateDocument` mutation with server-side Zod validation. After this step, Convex dev server picks up changes.
7. **`CollectionEditView`** — Wire everything together in admin-next. After this step, the full edit flow works end-to-end in the browser.

---

## Step 1: Install Dependencies

- [ ] Add `zod` to `@vexcms/core` dependencies
- [ ] Move `@tanstack/react-form` from devDependencies to dependencies in `@vexcms/ui`, add `zod`, `react-day-picker`, `date-fns`
- [ ] Add `@tanstack/react-form` and `zod` as peerDependencies in `@vexcms/admin-next`
- [ ] Add `@tanstack/react-form` and `zod` as devDependencies in `@vexcms/admin-next`
- [ ] Run `pnpm install`
- [ ] Verify `pnpm --filter @vexcms/core build` passes
- [ ] Verify `pnpm --filter @vexcms/ui build` passes

Update `@vexcms/ui` tsup config to external the new dependencies:

**File: `packages/ui/tsup.config.ts`** — Add `zod`, `@tanstack/react-form`, `react-day-picker`, `date-fns` to the externals list so they're not bundled.

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    // React
    "react",
    "react-dom",
    // Base UI (shadcn primitives)
    /^@base-ui\//,
    // Icons
    "lucide-react",
    // Styling utilities
    "class-variance-authority",
    "clsx",
    "tailwind-merge",
    // Workspace packages
    "@vexcms/core",
    // Form
    "@tanstack/react-form",
    "zod",
    // Date picker
    "react-day-picker",
    "date-fns",
  ],
  banner: {
    js: '"use client";',
  },
});
```

---

## Step 2: `generateFormSchema` — Zod Schema Generation

- [ ] Create `packages/core/src/formSchema/generateFormSchema.ts`
- [ ] Create `packages/core/src/formSchema/generateFormSchema.test.ts`
- [ ] Export `generateFormSchema` from `packages/core/src/index.ts`
- [ ] Run `pnpm --filter @vexcms/core test`

This is the core logic that converts a collection's field definitions into a Zod schema at runtime. Each field type maps to a specific Zod validator with constraints from the field metadata.

**File: `packages/core/src/formSchema/generateFormSchema.ts`**

The function iterates over a collection's fields, skips hidden fields, and builds a `z.object()` with the correct validator for each field type.

```typescript
import { z, type ZodTypeAny } from "zod";
import type { VexField, FieldMeta } from "../types";

/**
 * Generate a Zod schema from a collection's field definitions.
 * Used by both the client-side form (for validation on submit)
 * and the server-side mutation (for payload validation).
 *
 * @param props.fields - Record of field name → VexField from the collection config
 * @returns A z.object() schema matching the collection's editable fields
 */
export function generateFormSchema(props: {
  fields: Record<string, VexField>;
}): z.ZodObject<Record<string, ZodTypeAny>> {
  // TODO: implement
  //
  // 1. Create an empty record: Record<string, ZodTypeAny>
  //
  // 2. Iterate over Object.entries(props.fields)
  //    For each [fieldName, field]:
  //    a. Skip if field._meta.admin?.hidden === true
  //    b. Call fieldMetaToZod({ meta: field._meta }) to get the base ZodTypeAny
  //    c. If field._meta.required is NOT true, wrap with .optional()
  //    d. Add to the record under fieldName
  //
  // 3. Return z.object(record)
  //
  // Edge cases:
  // - An empty fields record should return z.object({}) (valid, accepts {})
  // - Hidden fields are excluded entirely — they won't be in the form or validated
  // - A required field with no defaultValue still gets a required Zod validator
  //   (the form UI handles showing the error; the schema just enforces it)
  throw new Error("Not implemented");
}

/**
 * Convert a single field's metadata to its Zod validator.
 * Does NOT handle optional wrapping — that's done by the caller.
 *
 * @param props.meta - The field metadata (discriminated on `type`)
 * @returns The base Zod type for this field (always required)
 */
export function fieldMetaToZod(props: { meta: FieldMeta }): ZodTypeAny {
  // TODO: implement
  //
  // Switch on props.meta.type:
  //
  // case "text":
  //   → Start with z.string()
  //   → If meta.minLength, chain .min(meta.minLength)
  //   → If meta.maxLength, chain .max(meta.maxLength)
  //
  // case "number":
  //   → Start with z.number()
  //   → If meta.min != null, chain .min(meta.min)
  //   → If meta.max != null, chain .max(meta.max)
  //
  // case "checkbox":
  //   → z.boolean()
  //
  // case "select":
  //   → If meta.hasMany:
  //     → z.array(z.enum([...values]))
  //   → Else:
  //     → z.enum([...values]) where values = meta.options.map(o => o.value)
  //   → Edge case: if options is empty, use z.string() as fallback
  //
  // case "date":
  //   → z.number() (epoch ms)
  //
  // case "imageUrl":
  //   → z.string().url().or(z.literal(""))
  //   → (allow empty string for clearing the field)
  //
  // case "relationship":
  //   → If meta.hasMany: z.array(z.string())
  //   → Else: z.string() (Convex ID is a string)
  //
  // case "json":
  //   → z.any()
  //
  // case "array":
  //   → z.array(fieldMetaToZod({ meta: meta.field._meta }))
  //   → If meta.min, chain .min(meta.min)
  //   → If meta.max, chain .max(meta.max)
  //
  // default:
  //   → z.any() (unknown field type — don't block the form)
  throw new Error("Not implemented");
}
```

**File: `packages/core/src/formSchema/generateFormSchema.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { generateFormSchema, fieldMetaToZod } from "./generateFormSchema";
import { text, number, checkbox, select, date, imageUrl } from "../fields";

describe("fieldMetaToZod", () => {
  it("generates z.string() for text field", () => {
    const field = text({ required: true });
    const schema = fieldMetaToZod({ meta: field._meta });
    expect(schema.safeParse("hello").success).toBe(true);
    expect(schema.safeParse(123).success).toBe(false);
  });

  it("applies minLength/maxLength for text field", () => {
    const field = text({ minLength: 2, maxLength: 5 });
    const schema = fieldMetaToZod({ meta: field._meta });
    expect(schema.safeParse("a").success).toBe(false);
    expect(schema.safeParse("ab").success).toBe(true);
    expect(schema.safeParse("abcde").success).toBe(true);
    expect(schema.safeParse("abcdef").success).toBe(false);
  });

  it("generates z.number() for number field", () => {
    const field = number();
    const schema = fieldMetaToZod({ meta: field._meta });
    expect(schema.safeParse(42).success).toBe(true);
    expect(schema.safeParse("42").success).toBe(false);
  });

  it("applies min/max for number field", () => {
    const field = number({ min: 0, max: 100 });
    const schema = fieldMetaToZod({ meta: field._meta });
    expect(schema.safeParse(-1).success).toBe(false);
    expect(schema.safeParse(0).success).toBe(true);
    expect(schema.safeParse(100).success).toBe(true);
    expect(schema.safeParse(101).success).toBe(false);
  });

  it("generates z.boolean() for checkbox field", () => {
    const field = checkbox();
    const schema = fieldMetaToZod({ meta: field._meta });
    expect(schema.safeParse(true).success).toBe(true);
    expect(schema.safeParse(false).success).toBe(true);
    expect(schema.safeParse("true").success).toBe(false);
  });

  it("generates z.enum() for select field", () => {
    const field = select({
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    });
    const schema = fieldMetaToZod({ meta: field._meta });
    expect(schema.safeParse("draft").success).toBe(true);
    expect(schema.safeParse("published").success).toBe(true);
    expect(schema.safeParse("invalid").success).toBe(false);
  });

  it("generates z.array(z.enum()) for hasMany select field", () => {
    const field = select({
      options: [
        { label: "A", value: "a" },
        { label: "B", value: "b" },
      ],
      hasMany: true,
    });
    const schema = fieldMetaToZod({ meta: field._meta });
    expect(schema.safeParse(["a", "b"]).success).toBe(true);
    expect(schema.safeParse(["a", "invalid"]).success).toBe(false);
    expect(schema.safeParse("a").success).toBe(false);
  });

  it("generates z.number() for date field (epoch ms)", () => {
    const field = date();
    const schema = fieldMetaToZod({ meta: field._meta });
    expect(schema.safeParse(Date.now()).success).toBe(true);
    expect(schema.safeParse("2024-01-01").success).toBe(false);
  });

  it("generates z.string().url() or empty for imageUrl field", () => {
    const field = imageUrl();
    const schema = fieldMetaToZod({ meta: field._meta });
    expect(schema.safeParse("https://example.com/img.png").success).toBe(true);
    expect(schema.safeParse("").success).toBe(true);
    expect(schema.safeParse(123).success).toBe(false);
  });
});

describe("generateFormSchema", () => {
  it("returns an empty object schema for empty fields", () => {
    const schema = generateFormSchema({ fields: {} });
    expect(schema.safeParse({}).success).toBe(true);
  });

  it("generates a schema with required and optional fields", () => {
    const schema = generateFormSchema({
      fields: {
        title: text({ required: true }),
        subtitle: text(),
      },
    });
    // title required, subtitle optional
    expect(schema.safeParse({ title: "Hello" }).success).toBe(true);
    expect(schema.safeParse({ title: "Hello", subtitle: "World" }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(false); // title missing
    expect(schema.safeParse({ subtitle: "World" }).success).toBe(false); // title missing
  });

  it("excludes hidden fields from the schema", () => {
    const schema = generateFormSchema({
      fields: {
        visible: text({ required: true }),
        hidden: text({ required: true, admin: { hidden: true } }),
      },
    });
    // hidden field not in schema, so it doesn't need to be present
    expect(schema.safeParse({ visible: "ok" }).success).toBe(true);
    // hidden field's key should not exist in the schema shape
    expect("hidden" in schema.shape).toBe(false);
  });

  it("matches test-app articles collection shape", () => {
    const schema = generateFormSchema({
      fields: {
        name: text({ label: "Name", required: true }),
        slug: text({ label: "Slug", required: true }),
        index: number({ defaultValue: 0, label: "Index" }),
      },
    });
    expect(
      schema.safeParse({ name: "Hello", slug: "hello", index: 5 }).success,
    ).toBe(true);
    expect(
      schema.safeParse({ name: "Hello", slug: "hello" }).success,
    ).toBe(true); // index is optional
    expect(schema.safeParse({ slug: "hello" }).success).toBe(false); // name required
  });

  it("matches test-app posts collection shape", () => {
    const schema = generateFormSchema({
      fields: {
        title: text({ required: true, maxLength: 200 }),
        subtitle: text({ required: true, maxLength: 200 }),
        slug: text({ required: true }),
        featured: checkbox({ defaultValue: false }),
        status: select({
          options: [
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
            { label: "Archived", value: "archived" },
          ],
          required: true,
        }),
      },
    });
    expect(
      schema.safeParse({
        title: "Post",
        subtitle: "Sub",
        slug: "post",
        status: "draft",
      }).success,
    ).toBe(true);
    // featured is optional (checkbox, not required)
    expect(
      schema.safeParse({
        title: "Post",
        subtitle: "Sub",
        slug: "post",
        featured: true,
        status: "published",
      }).success,
    ).toBe(true);
    // status must be a valid enum value
    expect(
      schema.safeParse({
        title: "Post",
        subtitle: "Sub",
        slug: "post",
        status: "invalid",
      }).success,
    ).toBe(false);
    // title exceeds maxLength
    expect(
      schema.safeParse({
        title: "a".repeat(201),
        subtitle: "Sub",
        slug: "post",
        status: "draft",
      }).success,
    ).toBe(false);
  });
});
```

Then update the core barrel export:

**File: `packages/core/src/index.ts`** — Add this export line alongside the existing exports:

```typescript
export { generateFormSchema, fieldMetaToZod } from "./formSchema/generateFormSchema";
```

---

## Step 3: UI Primitive Components

- [ ] Create `packages/ui/src/components/ui/label.tsx`
- [ ] Create `packages/ui/src/components/ui/popover.tsx`
- [ ] Create `packages/ui/src/components/ui/calendar.tsx`
- [ ] Create `packages/ui/src/components/ui/date-picker.tsx`
- [ ] Create `packages/ui/src/components/ui/select-native.tsx`
- [ ] Create `packages/ui/src/components/ui/checkbox-field.tsx`
- [ ] Update `packages/ui/src/components/ui/index.tsx` barrel to export new components
- [ ] Run `pnpm --filter @vexcms/ui build`

### Label

**File: `packages/ui/src/components/ui/label.tsx`**

Simple label element with consistent styling.

```tsx
import * as React from "react";
import { cn } from "../../styles/utils";

function Label({
  className,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
```

### Popover

**File: `packages/ui/src/components/ui/popover.tsx`**

Wraps `@base-ui/react` Popover primitives with styling.

```tsx
"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "../../styles/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

function PopoverContent({
  className,
  align = "start",
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Popup> & {
  align?: "start" | "center" | "end";
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner align={align}>
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "z-50 w-auto rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            className,
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent };
```

### Calendar

**File: `packages/ui/src/components/ui/calendar.tsx`**

Wraps `react-day-picker` with Vex CMS styling.

```tsx
"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../styles/utils";

// TODO: implement
//
// 1. Define a Calendar component that renders <DayPicker /> with custom classNames
//    → Accept all DayPicker props via React.ComponentProps<typeof DayPicker>
//    → Plus className and showOutsideDays (default true)
//
// 2. Apply Tailwind classNames to DayPicker's classNames prop:
//    → months: "flex flex-col sm:flex-row gap-2"
//    → month: "flex flex-col gap-4"
//    → month_caption: "flex justify-center pt-1 relative items-center h-7"
//    → caption_label: "text-sm font-medium"
//    → nav: "flex items-center gap-1"
//    → button_previous / button_next: styled icon buttons with hover states
//    → month_grid: "w-full border-collapse space-y-1"
//    → weekdays: "flex"
//    → weekday: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]"
//    → week: "flex w-full mt-2"
//    → day: "relative p-0 text-center text-sm"
//    → day_button: "h-8 w-8 p-0 font-normal" with hover/selected/today/outside/disabled states
//    → selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
//    → today: "bg-accent text-accent-foreground"
//    → outside: "text-muted-foreground opacity-50"
//    → disabled: "text-muted-foreground opacity-50"
//
// 3. Use ChevronLeft and ChevronRight from lucide-react as nav icons
//    → Override components.Chevron to render the correct direction icon
//
// Export { Calendar }

function Calendar({
  className,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker> & { showOutsideDays?: boolean }) {
  // TODO: implement — render DayPicker with classNames mapping as described above
  throw new Error("Not implemented");
}

export { Calendar };
```

### DatePicker

**File: `packages/ui/src/components/ui/date-picker.tsx`**

Composition of Popover + Calendar + Button for date selection.

```tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "../../styles/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface DatePickerProps {
  /** Currently selected date (Date object or undefined) */
  value?: Date;
  /** Callback when the date changes */
  onChange?: (date: Date | undefined) => void;
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Disable the picker */
  disabled?: boolean;
  /** Additional className on the trigger button */
  className?: string;
}

// TODO: implement
//
// 1. Render a <Popover> wrapping a trigger button and calendar content
//
// 2. Trigger button:
//    → Use <Button variant="outline"> styled as a form input
//    → Show CalendarIcon on the left
//    → Show formatted date (format(value, "PPP")) or placeholder text
//    → Apply muted styling when no date is selected (data-empty attribute or conditional class)
//    → Respect disabled prop
//
// 3. Popover content:
//    → Render <Calendar mode="single" selected={value} onSelect={onChange} />
//    → className="p-0" (no padding, calendar provides its own)
//
// 4. Close popover on date select:
//    → Manage open state with useState
//    → When onSelect fires, set open to false
//
// Edge cases:
// - value is undefined → show placeholder
// - disabled → button is disabled, popover doesn't open

function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
}: DatePickerProps) {
  // TODO: implement as described above
  throw new Error("Not implemented");
}

export { DatePicker, type DatePickerProps };
```

### SelectNative

**File: `packages/ui/src/components/ui/select-native.tsx`**

A simple styled `<select>` element for form use. No need for a complex combobox — just a native dropdown.

```tsx
import * as React from "react";
import { cn } from "../../styles/utils";

interface SelectNativeProps extends React.ComponentProps<"select"> {
  /** Placeholder shown as the first disabled option */
  placeholder?: string;
}

function SelectNative({
  className,
  placeholder,
  children,
  ...props
}: SelectNativeProps) {
  return (
    <select
      data-slot="select-native"
      className={cn(
        "dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full min-w-0 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-3 md:text-sm outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
}

export { SelectNative, type SelectNativeProps };
```

### CheckboxField

**File: `packages/ui/src/components/ui/checkbox-field.tsx`**

A styled checkbox input for form use.

```tsx
import * as React from "react";
import { cn } from "../../styles/utils";

function CheckboxField({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox-field"
      className={cn(
        "h-4 w-4 rounded border border-input bg-transparent shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        "checked:bg-primary checked:border-primary checked:text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { CheckboxField };
```

### Update barrel export

**File: `packages/ui/src/components/ui/index.tsx`** — Add these lines:

```typescript
export * from "./label";
export * from "./popover";
export * from "./calendar";
export * from "./date-picker";
export * from "./select-native";
export * from "./checkbox-field";
```

---

## Step 4: Form Field Components

- [ ] Create `packages/ui/src/components/form/fields/TextField.tsx`
- [ ] Create `packages/ui/src/components/form/fields/NumberField.tsx`
- [ ] Create `packages/ui/src/components/form/fields/CheckboxField.tsx`
- [ ] Create `packages/ui/src/components/form/fields/SelectField.tsx`
- [ ] Create `packages/ui/src/components/form/fields/DateField.tsx`
- [ ] Create `packages/ui/src/components/form/fields/ImageUrlField.tsx`
- [ ] Create `packages/ui/src/components/form/fields/index.ts`
- [ ] Run `pnpm --filter @vexcms/ui build`

Each form field component follows the same pattern: it receives TanStack Form's `FieldApi` (or uses `useField()`) plus field metadata, renders the appropriate input with a label, and displays validation errors.

All form field components in this section receive their props from the parent `AppForm` component. They are **not** standalone — they depend on being rendered inside a TanStack Form context. Each component renders:
1. A `<Label>` from the UI package
2. The appropriate input component
3. Validation error messages (if any, from the field's `state.meta.errors`)
4. An optional description/helper text from `meta.admin?.description` or `meta.description`

### TextField

**File: `packages/ui/src/components/form/fields/TextField.tsx`**

```tsx
"use client";

import * as React from "react";
import type { FieldApi } from "@tanstack/react-form";
import type { TextFieldMeta } from "@vexcms/core";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

interface TextFieldProps {
  field: FieldApi<any, any, any, any, any>;
  meta: TextFieldMeta;
  name: string;
}

// TODO: implement
//
// 1. Render a wrapper <div> with spacing
//
// 2. <Label htmlFor={props.name}>
//    → Display props.meta.label ?? toTitleCase(props.name)
//    → If props.meta.required, show a red asterisk
//
// 3. <Input
//      id={props.name}
//      value={props.field.state.value ?? ""}
//      onChange={(e) => props.field.handleChange(e.target.value)}
//      onBlur={props.field.handleBlur}
//      placeholder={props.meta.admin?.placeholder}
//      disabled={props.meta.admin?.readOnly}
//      maxLength={props.meta.maxLength}
//    />
//
// 4. If props.meta.description or props.meta.admin?.description:
//    → Render <p className="text-xs text-muted-foreground">description</p>
//
// 5. If props.field.state.meta.errors.length > 0:
//    → Render each error in <p className="text-xs text-destructive">
//
// Edge cases:
// - value can be undefined for optional fields → default to ""
// - readOnly fields get disabled attribute

function TextField({ field, meta, name }: TextFieldProps) {
  // TODO: implement as described above
  throw new Error("Not implemented");
}

export { TextField };
```

### NumberField

**File: `packages/ui/src/components/form/fields/NumberField.tsx`**

```tsx
"use client";

import * as React from "react";
import type { FieldApi } from "@tanstack/react-form";
import type { NumberFieldMeta } from "@vexcms/core";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

interface NumberFieldProps {
  field: FieldApi<any, any, any, any, any>;
  meta: NumberFieldMeta;
  name: string;
}

// TODO: implement
//
// 1. Same pattern as TextField but with type="number"
//
// 2. <Input
//      type="number"
//      id={props.name}
//      value={props.field.state.value ?? ""}
//      onChange={(e) => {
//        → Parse e.target.value: if empty string, set undefined (for optional)
//          or use Number(e.target.value)
//        → Be careful with NaN — if Number() returns NaN, don't update
//      }}
//      onBlur={props.field.handleBlur}
//      min={props.meta.min}
//      max={props.meta.max}
//      step={props.meta.step}
//      disabled={props.meta.admin?.readOnly}
//    />
//
// Edge cases:
// - User clears the input → value should become undefined (not 0, not NaN)
// - Number("") is 0 but we want undefined — check for empty string first

function NumberField({ field, meta, name }: NumberFieldProps) {
  // TODO: implement as described above
  throw new Error("Not implemented");
}

export { NumberField };
```

### CheckboxField (Form)

**File: `packages/ui/src/components/form/fields/CheckboxField.tsx`**

```tsx
"use client";

import * as React from "react";
import type { FieldApi } from "@tanstack/react-form";
import type { CheckboxFieldMeta } from "@vexcms/core";
import { CheckboxField as CheckboxInput } from "../../ui/checkbox-field";
import { Label } from "../../ui/label";

interface CheckboxFieldFormProps {
  field: FieldApi<any, any, any, any, any>;
  meta: CheckboxFieldMeta;
  name: string;
}

// TODO: implement
//
// 1. Render checkbox + label in a horizontal row (flex items-center gap-2)
//
// 2. <CheckboxInput
//      id={props.name}
//      checked={props.field.state.value ?? false}
//      onChange={(e) => props.field.handleChange(e.target.checked)}
//      onBlur={props.field.handleBlur}
//      disabled={props.meta.admin?.readOnly}
//    />
//
// 3. <Label htmlFor={props.name}>{label}</Label>
//
// Note: Checkbox layout differs from other fields — label is to the RIGHT of the input,
// not above it. The wrapper uses flex-row instead of flex-col.

function CheckboxFieldForm({ field, meta, name }: CheckboxFieldFormProps) {
  // TODO: implement as described above
  throw new Error("Not implemented");
}

export { CheckboxFieldForm };
```

### SelectField

**File: `packages/ui/src/components/form/fields/SelectField.tsx`**

```tsx
"use client";

import * as React from "react";
import type { FieldApi } from "@tanstack/react-form";
import type { SelectFieldMeta } from "@vexcms/core";
import { SelectNative } from "../../ui/select-native";
import { Label } from "../../ui/label";

interface SelectFieldProps {
  field: FieldApi<any, any, any, any, any>;
  meta: SelectFieldMeta;
  name: string;
}

// TODO: implement
//
// 1. Same label + error pattern as TextField
//
// 2. <SelectNative
//      id={props.name}
//      value={props.field.state.value ?? ""}
//      onChange={(e) => props.field.handleChange(e.target.value)}
//      onBlur={props.field.handleBlur}
//      disabled={props.meta.admin?.readOnly}
//      placeholder={!props.meta.required ? "Select..." : undefined}
//    >
//      {props.meta.options.map(opt => (
//        <option key={opt.value} value={opt.value}>{opt.label}</option>
//      ))}
//    </SelectNative>
//
// Edge cases:
// - If not required and no value, show the placeholder option
// - hasMany select is out of scope for this spec (future: multi-select combobox)
//   → For now, if hasMany is true, still render a single select (partial support)

function SelectField({ field, meta, name }: SelectFieldProps) {
  // TODO: implement as described above
  throw new Error("Not implemented");
}

export { SelectField };
```

### DateField

**File: `packages/ui/src/components/form/fields/DateField.tsx`**

```tsx
"use client";

import * as React from "react";
import type { FieldApi } from "@tanstack/react-form";
import type { DateFieldMeta } from "@vexcms/core";
import { DatePicker } from "../../ui/date-picker";
import { Label } from "../../ui/label";

interface DateFieldProps {
  field: FieldApi<any, any, any, any, any>;
  meta: DateFieldMeta;
  name: string;
}

// TODO: implement
//
// 1. Same label + error pattern as TextField
//
// 2. Convert between epoch ms (Convex) and Date objects (DatePicker):
//    → value: props.field.state.value ? new Date(props.field.state.value) : undefined
//    → onChange: (date) => props.field.handleChange(date ? date.getTime() : undefined)
//
// 3. <DatePicker
//      value={dateValue}
//      onChange={handleDateChange}
//      disabled={props.meta.admin?.readOnly}
//    />
//
// Edge cases:
// - value is 0 → that's epoch start (Jan 1 1970). This is a valid date, not "empty".
//   To check for "no date", check for undefined/null, not falsy.
// - value is undefined → no date selected

function DateField({ field, meta, name }: DateFieldProps) {
  // TODO: implement as described above
  throw new Error("Not implemented");
}

export { DateField };
```

### ImageUrlField

**File: `packages/ui/src/components/form/fields/ImageUrlField.tsx`**

```tsx
"use client";

import * as React from "react";
import type { FieldApi } from "@tanstack/react-form";
import type { ImageUrlFieldMeta } from "@vexcms/core";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

interface ImageUrlFieldProps {
  field: FieldApi<any, any, any, any, any>;
  meta: ImageUrlFieldMeta;
  name: string;
}

// TODO: implement
//
// 1. Same pattern as TextField but with:
//    → type="url"
//    → placeholder defaulting to "https://..."
//
// 2. Optionally show a small image preview below the input if value is a valid URL
//    → <img src={value} className="h-16 w-16 object-cover rounded mt-2" />
//    → Only show if value is non-empty and looks like a URL
//    → Use onError to hide broken image previews
//
// Edge cases:
// - Empty string is valid (means "clear the image")
// - Invalid URLs show a validation error from Zod, not from the input

function ImageUrlField({ field, meta, name }: ImageUrlFieldProps) {
  // TODO: implement as described above
  throw new Error("Not implemented");
}

export { ImageUrlField };
```

### Barrel export

**File: `packages/ui/src/components/form/fields/index.ts`**

```typescript
export { TextField } from "./TextField";
export { NumberField } from "./NumberField";
export { CheckboxFieldForm } from "./CheckboxField";
export { SelectField } from "./SelectField";
export { DateField } from "./DateField";
export { ImageUrlField } from "./ImageUrlField";
```

---

## Step 5: `AppForm` Component

- [ ] Create `packages/ui/src/components/form/AppForm.tsx`
- [ ] Create `packages/ui/src/components/form/index.ts`
- [ ] Update `packages/ui/src/index.ts` to export form components
- [ ] Run `pnpm --filter @vexcms/ui build`

**File: `packages/ui/src/components/form/AppForm.tsx`**

The `AppForm` component is the main form wrapper. It:
- Creates a TanStack Form instance with Zod validation on submit
- Iterates over the field entries and renders the correct field component for each
- Provides a submit button

```tsx
"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import type { z, ZodObject, ZodTypeAny } from "zod";
import type { VexField, FieldMeta } from "@vexcms/core";
import { Button } from "../ui/button";
import {
  TextField,
  NumberField,
  CheckboxFieldForm,
  SelectField,
  DateField,
  ImageUrlField,
} from "./fields";

interface FieldEntry {
  /** Field key name (e.g., "title", "status") */
  name: string;
  /** The VexField definition */
  field: VexField;
}

interface AppFormProps {
  /** The Zod schema generated by generateFormSchema */
  schema: ZodObject<Record<string, ZodTypeAny>>;
  /** Ordered list of field entries to render */
  fieldEntries: FieldEntry[];
  /** Current document values (used as default/initial values) */
  defaultValues: Record<string, unknown>;
  /**
   * Called on valid form submit with only the changed fields.
   * Return a promise — the form shows a loading state while it resolves.
   */
  onSubmit: (changedFields: Record<string, unknown>) => Promise<void>;
  /** Whether the form is currently saving */
  isSaving?: boolean;
}

// TODO: implement
//
// 1. Use useForm from @tanstack/react-form:
//    → defaultValues: props.defaultValues
//    → validatorAdapter: zodValidator()
//    → validators: { onSubmit: props.schema }
//    → onSubmit: async ({ value }) => {
//        a. Compute changedFields by comparing value to props.defaultValues
//           → Only include keys where value[key] !== props.defaultValues[key]
//           → Use a simple shallow equality check (=== comparison)
//        b. If no fields changed, return early (don't call onSubmit)
//        c. Call props.onSubmit(changedFields)
//      }
//
// 2. Render a <form onSubmit={...}> wrapping:
//    a. A <div className="space-y-6"> containing:
//       → For each entry in props.fieldEntries:
//         - Use form.Field({ name: entry.name, children: (field) => ... })
//         - Switch on entry.field._meta.type to render the correct component:
//           - "text" → <TextField field={field} meta={entry.field._meta} name={entry.name} />
//           - "number" → <NumberField ... />
//           - "checkbox" → <CheckboxFieldForm ... />
//           - "select" → <SelectField ... />
//           - "date" → <DateField ... />
//           - "imageUrl" → <ImageUrlField ... />
//           - default → null (unsupported field type — skip silently)
//
//    b. A submit section with:
//       → <Button type="submit" disabled={props.isSaving}>
//           {props.isSaving ? "Saving..." : "Save"}
//         </Button>
//
// Edge cases:
// - If fieldEntries is empty, render just the submit button (disabled)
// - changedFields comparison: use === for primitives.
//   For undefined vs missing key: if defaultValues[key] is undefined and value[key] is undefined,
//   that's NOT a change. Only include if they differ.

function AppForm({
  schema,
  fieldEntries,
  defaultValues,
  onSubmit,
  isSaving,
}: AppFormProps) {
  // TODO: implement as described above
  throw new Error("Not implemented");
}

export { AppForm, type AppFormProps, type FieldEntry };
```

**File: `packages/ui/src/components/form/index.ts`**

```typescript
export { AppForm, type AppFormProps, type FieldEntry } from "./AppForm";
export * from "./fields";
```

**File: `packages/ui/src/index.ts`** — Update to add form export:

```typescript
export { Layout } from "./layout/Layout";
export { Header } from "./layout/Header";

export * from "./components";
export * from "./components/form";
```

---

## Step 6: Convex Model — `getDocument` + `updateDocument`

- [ ] Add `getDocument` handler to `apps/test-app/convex/vex/model/collections.ts`
- [ ] Add `updateDocument` handler to `apps/test-app/convex/vex/model/collections.ts`
- [ ] Add `getDocument` query to `apps/test-app/convex/vex/collections.ts`
- [ ] Add `updateDocument` mutation to `apps/test-app/convex/vex/collections.ts`
- [ ] Verify Convex dev server picks up changes without errors

### Model handlers

**File: `apps/test-app/convex/vex/model/collections.ts`** — Add these two functions:

```typescript
export async function getDocument<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>;
  args: {
    collectionSlug: TableNamesInDataModel<DataModel>;
    documentId: string;
  };
}) {
  // TODO: implement
  //
  // 1. Use props.ctx.db.get(props.args.documentId as any) to fetch the document
  //    → Convex db.get() takes a GenericId, but we receive it as a string
  //    → Cast is safe because document IDs from the admin URL are always valid Convex IDs
  //
  // 2. If document is null, return null
  //
  // 3. Return the document
  //
  // Edge cases:
  // - Invalid document ID string → Convex will throw, let it propagate
  // - Document from wrong table → Convex handles this (IDs are table-scoped)
  throw new Error("Not implemented");
}
```

For the mutation handler, you'll need to add the import for `GenericMutationCtx`:

```typescript
import type {
  GenericDataModel,
  GenericQueryCtx,
  GenericMutationCtx,
  PaginationOptions,
  TableNamesInDataModel,
} from "convex/server";

export async function updateDocument<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>;
  args: {
    collectionSlug: TableNamesInDataModel<DataModel>;
    documentId: string;
    fields: Record<string, unknown>;
  };
}) {
  // TODO: implement
  //
  // 1. Use props.ctx.db.patch(props.args.documentId as any, props.args.fields)
  //    → patch() applies a partial update — only the fields in the record are changed
  //    → This is exactly what we want for the "changed fields only" approach
  //
  // 2. Return the document ID on success
  //
  // Note: Server-side Zod validation happens in the query layer (collections.ts),
  // not here. This model function is a thin wrapper around db.patch().
  //
  // Edge cases:
  // - Empty fields record {} → valid, patch does nothing
  // - Field with value undefined → Convex patch removes the field (which is correct for clearing optional fields)
  throw new Error("Not implemented");
}
```

### Query and mutation definitions

**File: `apps/test-app/convex/vex/collections.ts`** — Add these alongside existing exports. You'll need to add `mutation` import and `v.any()` for the fields argument:

```typescript
import { mutation, query } from "@convex/_generated/server";
```

Add `getDocument` query:

```typescript
export const getDocument = query({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
  },
  handler: async (ctx, { collectionSlug, documentId }) => {
    return await Collections.getDocument<DataModel>({
      ctx,
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        documentId,
      },
    });
  },
});
```

Add `updateDocument` mutation with server-side Zod validation:

```typescript
export const updateDocument = mutation({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
    fields: v.any(),
  },
  handler: async (ctx, { collectionSlug, documentId, fields }) => {
    // TODO: implement
    //
    // 1. Server-side Zod validation:
    //    → Import generateFormSchema from @vexcms/core
    //    → Import the vex config (you'll need access to the collection definitions)
    //    → Find the collection by slug from the config
    //    → Generate the Zod schema: generateFormSchema({ fields: collection.config.fields })
    //    → Run schema.partial().safeParse(fields) — use .partial() because this is a
    //      partial patch (not all fields are required in an update)
    //    → If !result.success, throw a ConvexError with the validation errors
    //
    // 2. Call Collections.updateDocument<DataModel>({ ctx, args: { ... } })
    //
    // Note: For the server-side validation to work, the mutation needs access to the
    // collection field definitions. There are two approaches:
    //   a. Import the config directly (couples test-app to the mutation)
    //   b. Skip server-side validation for now and add it when a config registry exists
    //
    // For this spec, use approach (a): import the config from the test-app's vexcms config.
    // In a future spec, this will be made generic via a config registry.
    //
    // ALTERNATIVE (simpler): Skip the Zod validation in the Convex mutation for now.
    // The client already validates. Server-side validation can be added when we have
    // a proper way to share collection configs with the Convex function layer.
    // This is the recommended approach for this spec — don't over-engineer it.

    return await Collections.updateDocument<DataModel>({
      ctx,
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        documentId,
        fields: fields as Record<string, unknown>,
      },
    });
  },
});
```

**Important note on server-side Zod validation:** The Convex function layer (`convex/vex/`) runs in the Convex runtime, which is separate from the Next.js app. Importing `@vexcms/core` and `zod` into Convex functions requires them to be bundled by Convex. This should work because Convex bundles its function dependencies, but verify it doesn't cause issues. If it does, defer server-side Zod validation to a future spec and rely on client-side validation + Convex's own type checking for now.

---

## Step 7: `CollectionEditView` — Wire Everything Together

- [ ] Rewrite `packages/admin-next/src/views/CollectionEditView.tsx`
- [ ] Run `pnpm --filter @vexcms/admin-next build`
- [ ] Verify in browser: navigate to a document edit URL, see the form, edit fields, save

**File: `packages/admin-next/src/views/CollectionEditView.tsx`**

```tsx
"use client";

import { useMemo } from "react";
import type { VexCollection, VexConfig } from "@vexcms/core";
import { generateFormSchema } from "@vexcms/core";
import { AppForm, type FieldEntry } from "@vexcms/ui";
import { useQuery, useMutation } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { anyApi } from "convex/server";

// TODO: implement
//
// 1. Props: { config: VexConfig; collection: VexCollection; documentID: string }
//
// 2. Fetch the document:
//    → Use useQuery with convexQuery(anyApi.vex.collections.getDocument, {
//        collectionSlug: collection.slug,
//        documentId: documentID,
//      })
//    → This gives reactive live updates (Convex pushes changes)
//
// 3. Set up the mutation:
//    → Use useConvexMutation(anyApi.vex.collections.updateDocument)
//    → Wrap in a handleSubmit async function that calls mutate({
//        collectionSlug, documentId, fields: changedFields
//      })
//
// 4. Generate the Zod schema (memoized on collection):
//    → const schema = useMemo(
//        () => generateFormSchema({ fields: collection.config.fields }),
//        [collection],
//      )
//
// 5. Build fieldEntries from collection.config.fields:
//    → const fieldEntries: FieldEntry[] = Object.entries(collection.config.fields)
//        .filter(([_, field]) => !field._meta.admin?.hidden)
//        .map(([name, field]) => ({ name, field }))
//
// 6. Build defaultValues from the fetched document:
//    → Strip _id and _creationTime from the document
//    → Only include keys that exist in fieldEntries
//
// 7. Render:
//    a. Header section:
//       → <h1>{collection.config.labels?.singular ?? collection.slug}</h1>
//       → <p className="text-sm text-muted-foreground">{documentID}</p>
//          (same muted style as the doc count in CollectionsView)
//
//    b. Loading state:
//       → If document is loading, show a skeleton or "Loading..."
//
//    c. Not found state:
//       → If document is null after loading, show "Document not found"
//
//    d. Form:
//       → <AppForm
//           schema={schema}
//           fieldEntries={fieldEntries}
//           defaultValues={defaultValues}
//           onSubmit={handleSubmit}
//           isSaving={mutation.isPending}
//         />
//
// Edge cases:
// - Document may have extra fields not in the collection config (e.g., auth fields on users).
//   Only render fields that exist in collection.config.fields.
// - The document data is reactive — if another user edits it, the form will receive new
//   defaultValues. However, we do NOT reset the form on every update (that would lose
//   in-progress edits). The form only resets when the documentID changes.
//   → Use the documentID as a key on the form component to force remount on navigation.

export default function CollectionEditView({
  config,
  collection,
  documentID,
}: {
  config: VexConfig;
  collection: VexCollection;
  documentID: string;
}) {
  // TODO: implement as described above
  throw new Error("Not implemented");
}
```

---

## Success Criteria

- [ ] `pnpm --filter @vexcms/core test` passes — `generateFormSchema` tests all green
- [ ] `pnpm --filter @vexcms/core build` passes
- [ ] `pnpm --filter @vexcms/ui build` passes — all new components compile
- [ ] `pnpm --filter @vexcms/admin-next build` passes
- [ ] Navigate to `/admin/articles/{id}` → form renders with Name (required text), Slug (required text), Index (optional number)
- [ ] Navigate to `/admin/posts/{id}` → form renders with Title, Subtitle, Slug (required text), Featured (checkbox), Status (select dropdown)
- [ ] Navigate to `/admin/users/{id}` → form renders with Name (required text), Image (URL input), Post Count (disabled number, readOnly), Role (required select)
- [ ] Edit a field and click Save → only the changed field is sent via the mutation, document updates in Convex
- [ ] Validation works: leave a required field empty, click Save → error message appears, no mutation fires
- [ ] Document ID is displayed in the header as muted text
- [ ] Form is keyed by documentID — navigating to a different document resets the form
