# Framework-Agnostic Core Architecture

## 🎯 The Real Problem

**ColumnDef is framework-specific.**

- React: `@tanstack/react-table` ColumnDef
- Svelte: `@tanstack/svelte-table` ColumnDef (different signature!)
- Vue: `@tanstack/vue-table` ColumnDef
- Custom table libraries: Completely different

**Core should NOT dictate UI implementation.**

---

## ✅ Better Solution: Core Provides Helpers, Frameworks Build UIs

### Core Responsibilities

1. **Field type definitions** (data shapes)
2. **Helper functions** (reusable logic for all frameworks)
3. **Type-safe validation** (ensure framework packages are complete)

### Framework Package Responsibilities

1. **Column generation** (using their table library)
2. **Form components** (using their form library)
3. **Admin views** (using their routing/layout system)
4. **Component implementations** (Link, Image, Modal, etc.)

---

## 📦 Core Package Structure

### Field Type Organization

```
packages/core/src/fields/
├── text/
│   ├── config.ts           # Field type definition + factory
│   ├── helpers.ts          # Field-specific helpers
│   ├── schemaValueType.ts  # Convex schema converter
│   └── index.ts            # Re-exports
├── number/
│   ├── config.ts
│   ├── helpers.ts
│   ├── schemaValueType.ts
│   └── index.ts
├── relationship/
│   └── ... (same structure)
└── ... (all 19 field types)
```

**No columnDef files in core.** Those belong in framework packages.

---

### Field Type Implementation

**Field Definition and Factory:**
```typescript
// packages/core/src/fields/text/config.ts

/**
 * Text field type definition.
 */
export interface TextFieldDef<TComponent = unknown> {
  type: "text";
  label?: string;
  required?: boolean;
  defaultValue?: string;
  admin?: {
    cellAlignment?: "left" | "center" | "right";
    hidden?: boolean;
    readOnly?: boolean;
    components?: {
      Cell?: TComponent;
      Edit?: TComponent;
    };
  };
}

/**
 * Creates a text field definition.
 */
export function text<TComponent = unknown>(
  options?: Omit<TextFieldDef<TComponent>, "type">
): TextFieldDef<TComponent> {
  return {
    type: "text",
    ...options,
  };
}
```

**Field-Specific Helpers:**
```typescript
// packages/core/src/fields/text/helpers.ts

import type { TextFieldDef } from './config';

/**
 * Gets the display label for a text field.
 * Frameworks use this in column headers and form labels.
 */
export function getTextFieldLabel(
  field: TextFieldDef,
  fieldKey: string,
): string {
  return field.label ?? toTitleCase(fieldKey);
}

/**
 * Gets the cell alignment for a text field.
 * Frameworks use this in column meta or cell styling.
 */
export function getTextFieldAlignment(
  field: TextFieldDef,
): "left" | "center" | "right" {
  return field.admin?.cellAlignment ?? "left";
}

/**
 * Formats a text field value for display.
 * Frameworks use this in column cells and read-only form fields.
 */
export function formatTextCellValue(value: unknown): string {
  if (value == null) return "";
  const str = String(value);
  // Truncate to 80 chars with ellipsis
  return str.length > 80 ? `${str.slice(0, 77)}...` : str;
}

/**
 * Validates a text field value.
 * Frameworks use this in form validation.
 */
export function validateTextValue(
  value: unknown,
  field: TextFieldDef,
): string | null {
  if (field.required && !value) {
    return `${field.label ?? "This field"} is required`;
  }
  return null;
}
```

**Schema Value Type Converter:**
```typescript
// packages/core/src/fields/text/schemaValueType.ts

import { v } from 'convex/values';
import type { TextFieldDef } from './config';

/**
 * Converts text field to Convex schema value type.
 */
export function textToValueType(field: TextFieldDef) {
  let valueType = v.string();
  if (!field.required) {
    valueType = v.optional(valueType);
  }
  return valueType;
}
```

**Re-exports:**
```typescript
// packages/core/src/fields/text/index.ts

export * from './config';
export * from './helpers';
export * from './schemaValueType';
```

---

### Relationship Field (with helpers)

```typescript
// packages/core/src/fields/relationship.ts

export interface RelationshipFieldDef {
  type: "relationship";
  to: string; // Collection slug
  hasMany?: boolean;
  label?: string;
  labels?: { singular: string; plural: string };
  admin?: {
    cellAlignment?: "left" | "center" | "right";
    hidden?: boolean;
  };
}

export function relationship(
  to: string,
  options?: Omit<RelationshipFieldDef, "type" | "to">,
): RelationshipFieldDef {
  return {
    type: "relationship",
    to,
    ...options,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets the display label for a relationship field.
 */
export function getRelationshipFieldLabel(
  field: RelationshipFieldDef,
  fieldKey: string,
): string {
  if (field.hasMany) {
    return field.labels?.plural ?? field.label ?? toTitleCase(fieldKey);
  }
  return field.labels?.singular ?? field.label ?? toTitleCase(fieldKey);
}

/**
 * Gets the admin path for a relationship target document.
 * Frameworks use this to build links.
 */
export function getRelationshipAdminPath(
  field: RelationshipFieldDef,
  documentId: string,
): string {
  return `/admin/${field.to}/${documentId}`;
}

/**
 * Formats a relationship field value for display.
 * Frameworks use this in column cells.
 */
export function formatRelationshipCellValue(
  value: unknown,
  field: RelationshipFieldDef,
): string {
  if (value == null) return "";

  if (field.hasMany && Array.isArray(value)) {
    const count = value.length;
    return `${count} item${count === 1 ? "" : "s"}`;
  }

  // Return document ID (framework will resolve to title)
  return String(value);
}
```

---

## 🎨 React Package Implementation

### Column Generation (React-specific)

```typescript
// packages/react/src/admin/columns/text.tsx

import type { ColumnDef } from '@tanstack/react-table'
import type { TextFieldDef } from '@vexcms/core'
import {
  getTextFieldLabel,
  getTextFieldAlignment,
  formatTextCellValue
} from '@vexcms/core/fields/text'  // Imports from text/index.ts

/**
 * Creates a React Table column definition for a text field.
 * Uses core helpers for consistent behavior.
 */
export function createTextColumn(
  fieldKey: string,
  field: TextFieldDef
): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: fieldKey,
    header: getTextFieldLabel(field, fieldKey),  // Core helper
    meta: { align: getTextFieldAlignment(field) },  // Core helper
    cell: ({ getValue }) => {
      const value = getValue()
      return <span>{formatTextCellValue(value)}</span>  // Core helper
    }
  }
}
```

```typescript
// packages/react/src/admin/columns/relationship.tsx

import type { ColumnDef } from '@tanstack/react-table'
import type { RelationshipFieldDef } from '@vexcms/core'
import {
  getRelationshipFieldLabel,
  getRelationshipAdminPath,
  formatRelationshipCellValue
} from '@vexcms/core/fields/relationship'

export interface RelationshipColumnContext {
  Link: React.ComponentType<{ href: string; children: React.ReactNode }>
}

export function createRelationshipColumn(
  fieldKey: string,
  field: RelationshipFieldDef,
  context: RelationshipColumnContext
): ColumnDef<Record<string, unknown>> {
  const { Link } = context

  return {
    accessorKey: fieldKey,
    header: getRelationshipFieldLabel(field, fieldKey),  // Core helper
    cell: ({ getValue }) => {
      const value = getValue()
      const formatted = formatRelationshipCellValue(value, field)  // Core helper

      if (!value || Array.isArray(value)) {
        return formatted  // Show count for hasMany
      }

      const href = getRelationshipAdminPath(field, String(value))  // Core helper
      return <Link href={href}>{formatted}</Link>
    }
  }
}
```

---

## 🎨 Svelte Package Implementation (Future)

### Column Generation (Svelte-specific)

```typescript
// packages/svelte/src/admin/columns/text.ts

import type { ColumnDef } from "@tanstack/svelte-table"; // Different library!
import type { TextFieldDef } from "@vexcms/core";
import {
  getTextFieldLabel,
  getTextFieldAlignment,
  formatTextCellValue,
} from "@vexcms/core/fields/text"; // Same core helpers!

export function createTextColumn(
  fieldKey: string,
  field: TextFieldDef,
): ColumnDef<Record<string, unknown>> {
  // Svelte Table ColumnDef (different type)
  return {
    accessorKey: fieldKey,
    header: getTextFieldLabel(field, fieldKey), // Same core helper
    meta: { align: getTextFieldAlignment(field) }, // Same core helper
    cell: (info) => {
      // Svelte component rendering (different from React)
      const value = info.getValue();
      return formatTextCellValue(value); // Same core helper
    },
  };
}
```

**Key point:** React and Svelte packages use the **same core helpers** but create **different ColumnDef types**.

---

## 🔍 Type-Safe Component Validation

### Core Provides Validation Helper

````typescript
// packages/core/src/validation/framework.ts

/**
 * Required components for a complete admin UI framework package.
 */
export interface VexFrameworkComponents {
  /** Link component for navigation */
  Link: unknown;
  /** Image component for optimized images */
  Image: unknown;
  /** Form component for data editing */
  Form: unknown;
  /** Modal component for dialogs */
  Modal: unknown;
  /** Button component for actions */
  Button: unknown;
  /** Input component for text fields */
  Input: unknown;
  /** Select component for dropdowns */
  Select: unknown;
  /** Checkbox component */
  Checkbox: unknown;
  /** Date picker component */
  DatePicker: unknown;
  /** File upload component */
  FileUpload: unknown;
  /** Rich text editor component */
  RichTextEditor: unknown;
  // ... all required components
}

/**
 * Type-safe identity function for framework component definitions.
 * Ensures all required components are provided at compile time.
 *
 * @example
 * ```typescript
 * export const reactComponents = defineFrameworkComponents({
 *   Link: VexLink,
 *   Image: VexImage,
 *   Form: VexForm,
 *   // TypeScript error if any required component is missing
 * })
 */
export function defineFrameworkComponents<T extends VexFrameworkComponents>(
  components: T,
): T {
  return components;
}

/**
 * Validates that a framework package provides all required components.
 * Returns missing component names for runtime checking.
 */
export function validateFrameworkComponents(
  components: Partial<VexFrameworkComponents>,
): string[] {
  const required: (keyof VexFrameworkComponents)[] = [
    "Link",
    "Image",
    "Form",
    "Modal",
    "Button",
    "Input",
    "Select",
    "Checkbox",
    "DatePicker",
    "FileUpload",
    "RichTextEditor",
  ];

  const missing: string[] = [];
  for (const key of required) {
    if (!components[key]) {
      missing.push(key);
    }
  }

  return missing;
}
````

---

### React Package Uses Validation

```typescript
// packages/react/src/components/index.ts

import { defineFrameworkComponents } from "@vexcms/core/validation";
import { VexLink } from "./VexLink";
import { VexImage } from "./VexImage";
import { VexForm } from "./VexForm";
import { VexModal } from "./VexModal";
import { VexButton } from "./VexButton";
import { VexInput } from "./VexInput";
import { VexSelect } from "./VexSelect";
import { VexCheckbox } from "./VexCheckbox";
import { VexDatePicker } from "./VexDatePicker";
import { VexFileUpload } from "./VexFileUpload";
import { VexRichTextEditor } from "./VexRichTextEditor";

/**
 * React component implementations for VexCMS admin UI.
 * TypeScript enforces that all required components are provided.
 */
export const reactComponents = defineFrameworkComponents({
  Link: VexLink,
  Image: VexImage,
  Form: VexForm,
  Modal: VexModal,
  Button: VexButton,
  Input: VexInput,
  Select: VexSelect,
  Checkbox: VexCheckbox,
  DatePicker: VexDatePicker,
  FileUpload: VexFileUpload,
  RichTextEditor: VexRichTextEditor,
  // TypeScript error if any are missing!
});
```

---

### Svelte Package Uses Same Validation

```typescript
// packages/svelte/src/components/index.ts

import { defineFrameworkComponents } from "@vexcms/core/validation";
import { VexLink } from "./VexLink.svelte";
import { VexImage } from "./VexImage.svelte";
// ... Svelte components

export const svelteComponents = defineFrameworkComponents({
  Link: VexLink,
  Image: VexImage,
  // ... Svelte implementations
  // TypeScript error if any are missing!
});
```

---

## 📋 Summary: Clean Separation

### Core Package (`@vexcms/core`)

**Exports:**

- Field type definitions
- Field factory functions (text(), number(), etc.)
- Helper functions (getTextFieldLabel, formatTextCellValue, etc.)
- Validation utilities (validateTextValue, etc.)
- Type-safe component validation (defineFrameworkComponents)
- Config builders (defineConfig, defineCollection)
- Schema generation (generateVexSchema)
- Permissions (hasPermission)

**Does NOT export:**

- ColumnDef functions (framework-specific)
- React components (framework-specific)
- Table-specific code (framework-specific)

**Dependencies:**

- zod, convex
- NO React, NO @tanstack/react-table

---

### React Package (`@vexcms/react`)

**Exports:**

- Column factories (createTextColumn, createNumberColumn, etc.)
- Form field components (TextField, NumberField, etc.)
- Admin views (Dashboard, ListView, EditView, etc.)
- Data hooks (useCollectionDocuments, etc.)
- Component implementations (VexLink, VexImage, etc.)
- reactComponents (validated component set)

**Uses from core:**

- Field type definitions
- Helper functions
- defineFrameworkComponents for validation

**Dependencies:**

- @vexcms/core
- react, react-dom
- @tanstack/react-table
- shadcn/ui components

---

### Svelte Package (`@vexcms/svelte`) - Future

**Exports:**

- Column factories (using @tanstack/svelte-table)
- Form field components (Svelte components)
- Admin views (Svelte routes)
- Data stores (Svelte stores)
- Component implementations (Svelte components)
- svelteComponents (validated component set)

**Uses from core:**

- Same field type definitions
- Same helper functions
- Same defineFrameworkComponents for validation

**Dependencies:**

- @vexcms/core
- svelte
- @tanstack/svelte-table (different from React!)
- svelte-specific UI library

---

## ✅ Benefits

1. **True framework agnosticism** - Core has no framework code
2. **Code reuse** - All frameworks use same helpers
3. **Type safety** - defineFrameworkComponents ensures completeness
4. **Flexibility** - Each framework uses its own table/form libraries
5. **Maintainability** - Field logic in one place (core helpers)
6. **Extensibility** - Easy to add new frameworks

---

## 🚀 Implementation for v1

### Week 1-2: Core Field Types + Helpers

```typescript
// packages/core/src/fields/text.ts
export interface TextFieldDef {
  /* ... */
}
export function text(options) {
  /* ... */
}
export function getTextFieldLabel(field, fieldKey) {
  /* ... */
}
export function getTextFieldAlignment(field) {
  /* ... */
}
export function formatTextCellValue(value) {
  /* ... */
}
export function validateTextValue(value, field) {
  /* ... */
}

// Repeat for all 19 field types
```

### Week 3-4: Core Validation

```typescript
// packages/core/src/validation/framework.ts
export interface VexFrameworkComponents {
  /* ... */
}
export function defineFrameworkComponents(components) {
  /* ... */
}
export function validateFrameworkComponents(components) {
  /* ... */
}
```

### Week 5-6: React Column Factories

```typescript
// packages/react/src/admin/columns/text.tsx
import {
  getTextFieldLabel,
  formatTextCellValue,
} from "@vexcms/core/fields/text";
export function createTextColumn(fieldKey, field) {
  // Use core helpers + React Table ColumnDef
}

// Repeat for all 19 field types
```

### Week 5-6: React Components + Validation

```typescript
// packages/react/src/components/index.ts
import { defineFrameworkComponents } from "@vexcms/core/validation";
export const reactComponents = defineFrameworkComponents({
  Link: VexLink,
  Image: VexImage,
  // ... all required components
});
```

### Week 7-8: Next.js Integration

```typescript
// packages/next/src/components/VexLink.tsx
// Adapt next/link to VexLink interface

// packages/next/src/admin/CollectionListView.tsx
// Use React package's column factories + Next.js components
```

---

## 🎯 This Architecture Solves Everything

✅ **Colocation** - Field logic in core (definitions + helpers)
✅ **Framework agnostic** - Core has no React code
✅ **Type safety** - defineFrameworkComponents catches missing implementations
✅ **Flexibility** - Each framework uses its own table library
✅ **Code reuse** - All frameworks use same helpers
✅ **Future-proof** - Easy to add Svelte, Vue, SolidJS packages
