# Generic Helpers + Type Flow for Framework Components

## 🎯 Three Key Improvements

1. **Generic field helpers** - Avoid repetitive switch logic in framework packages
2. **Component type flow** - Field defs accept framework component types via generics
3. **Framework validation** - Validate views AND components with proper type constraints

## ✨ Key Innovation: Generics Throughout

Instead of using `unknown` types everywhere:
```typescript
// ❌ Old: No type checking
export interface VexFrameworkComponents {
  Link: unknown  // Accepts anything!
}
```

We use **generic type parameters**:
```typescript
// ✅ New: Type-safe
export interface VexFrameworkComponents<TComponent = unknown> {
  Link: TComponent  // Type-checked!
}

export const reactFramework = defineFrameworkPackage<ReactComponent, ReactView>({
  components: {
    Link: VexLink  // ✅ Must be ReactComponent, not string/number/SvelteComponent
  }
})
```

**Benefits:**
- ✅ Compile-time validation (catch errors before runtime)
- ✅ Framework-specific type checking (React vs Svelte detected)
- ✅ Better autocomplete and IDE support
- ✅ Refactoring safety

---

## 1. Generic Helpers (Avoid Repetitive Switch Logic)

### Problem

Framework packages would need to write switch statements everywhere:

```typescript
// ❌ BAD: Repetitive switch logic in framework package
function getLabel(field: VexField, fieldKey: string): string {
  switch (field.type) {
    case 'text': return getTextFieldLabel(field, fieldKey)
    case 'number': return getNumberFieldLabel(field, fieldKey)
    case 'relationship': return getRelationshipFieldLabel(field, fieldKey)
    // ... 19 field types
  }
}

function formatCellValue(field: VexField, value: unknown): string {
  switch (field.type) {
    case 'text': return formatTextCellValue(value)
    case 'number': return formatNumberCellValue(value)
    // ... 19 field types
  }
}
```

### Solution: Core Provides Generic Helpers

```typescript
// packages/core/src/fields/helpers.ts

import type { VexField } from '../types'
import { getTextFieldLabel, formatTextCellValue } from './text'
import { getNumberFieldLabel, formatNumberCellValue } from './number'
import { getRelationshipFieldLabel, formatRelationshipCellValue } from './relationship'
// ... all field type helpers

// ============================================================================
// GENERIC HELPERS (work for all field types)
// Framework packages use these to avoid switch statements
// ============================================================================

/**
 * Gets the display label for any field type.
 * Handles singular/plural for fields with those options.
 *
 * @param field - Any VexField type
 * @param fieldKey - The field key (used as fallback)
 * @param variant - 'singular' | 'plural' for fields with labels (hasMany relationships, etc.)
 */
export function getFieldLabel(
  field: VexField,
  fieldKey: string,
  variant?: 'singular' | 'plural'
): string {
  switch (field.type) {
    case 'text':
      return getTextFieldLabel(field, fieldKey)
    case 'number':
      return getNumberFieldLabel(field, fieldKey)
    case 'checkbox':
      return getCheckboxFieldLabel(field, fieldKey)
    case 'select':
      return getSelectFieldLabel(field, fieldKey)
    case 'date':
      return getDateFieldLabel(field, fieldKey)
    case 'relationship':
      return getRelationshipFieldLabel(field, fieldKey, variant)
    case 'richtext':
      return getRichtextFieldLabel(field, fieldKey)
    case 'array':
      return getArrayFieldLabel(field, fieldKey)
    case 'object':
      return getObjectFieldLabel(field, fieldKey)
    case 'json':
      return getJsonFieldLabel(field, fieldKey)
    case 'upload':
      return getUploadFieldLabel(field, fieldKey, variant)
    case 'blocks':
      return getBlocksFieldLabel(field, fieldKey)
    case 'color':
      return getColorFieldLabel(field, fieldKey)
    case 'imageUrl':
      return getImageUrlFieldLabel(field, fieldKey)
    case 'ui':
      return '' // UI fields have no label
    case 'tabs':
      return '' // Tabs have no label
    default:
      return toTitleCase(fieldKey)
  }
}

/**
 * Gets the cell alignment for any field type.
 * Returns 'left' | 'center' | 'right'.
 */
export function getFieldAlignment(field: VexField): 'left' | 'center' | 'right' {
  switch (field.type) {
    case 'text':
      return getTextFieldAlignment(field)
    case 'number':
      return getNumberFieldAlignment(field)
    case 'checkbox':
      return getCheckboxFieldAlignment(field)
    case 'select':
      return getSelectFieldAlignment(field)
    case 'date':
      return getDateFieldAlignment(field)
    case 'imageUrl':
      return 'center' // Images typically centered
    case 'color':
      return 'center' // Color swatches centered
    default:
      return field.admin?.cellAlignment ?? 'left'
  }
}

/**
 * Formats a field value for display in a table cell.
 * Handles truncation, formatting, and special cases.
 */
export function formatFieldCellValue(field: VexField, value: unknown): string {
  switch (field.type) {
    case 'text':
      return formatTextCellValue(value)
    case 'number':
      return formatNumberCellValue(value)
    case 'checkbox':
      return formatCheckboxCellValue(value)
    case 'select':
      return formatSelectCellValue(value, field)
    case 'date':
      return formatDateCellValue(value, field)
    case 'relationship':
      return formatRelationshipCellValue(value, field)
    case 'richtext':
      return formatRichtextCellValue(value)
    case 'array':
      return formatArrayCellValue(value, field)
    case 'object':
      return formatObjectCellValue(value)
    case 'json':
      return formatJsonCellValue(value)
    case 'upload':
      return formatUploadCellValue(value, field)
    case 'blocks':
      return formatBlocksCellValue(value, field)
    case 'color':
      return formatColorCellValue(value)
    case 'imageUrl':
      return '' // Image cells render <img>, not text
    default:
      return String(value ?? '')
  }
}

/**
 * Validates a field value.
 * Returns error message if invalid, null if valid.
 */
export function validateFieldValue(field: VexField, value: unknown): string | null {
  switch (field.type) {
    case 'text':
      return validateTextValue(value, field)
    case 'number':
      return validateNumberValue(value, field)
    case 'checkbox':
      return validateCheckboxValue(value, field)
    case 'select':
      return validateSelectValue(value, field)
    case 'date':
      return validateDateValue(value, field)
    case 'relationship':
      return validateRelationshipValue(value, field)
    case 'richtext':
      return validateRichtextValue(value, field)
    case 'array':
      return validateArrayValue(value, field)
    case 'object':
      return validateObjectValue(value, field)
    case 'json':
      return validateJsonValue(value, field)
    case 'upload':
      return validateUploadValue(value, field)
    case 'blocks':
      return validateBlocksValue(value, field)
    case 'color':
      return validateColorValue(value, field)
    case 'imageUrl':
      return validateImageUrlValue(value, field)
    default:
      return null
  }
}

/**
 * Gets the default value for any field type.
 */
export function getFieldDefaultValue(field: VexField): unknown {
  switch (field.type) {
    case 'text':
      return field.defaultValue ?? (field.required ? '' : undefined)
    case 'number':
      return field.defaultValue ?? (field.required ? 0 : undefined)
    case 'checkbox':
      return field.defaultValue ?? false
    case 'select':
      return field.defaultValue ?? (field.required ? field.options[0]?.value : undefined)
    case 'date':
      return field.defaultValue ?? (field.required ? Date.now() : undefined)
    case 'relationship':
      return field.hasMany ? [] : undefined
    case 'richtext':
      return field.defaultValue ?? []
    case 'array':
      return field.defaultValue ?? []
    case 'object':
      return field.defaultValue ?? {}
    case 'json':
      return field.defaultValue ?? null
    case 'blocks':
      return field.defaultValue ?? []
    case 'color':
      return field.defaultValue ?? '#000000'
    case 'imageUrl':
      return field.defaultValue ?? ''
    case 'upload':
      return field.hasMany ? [] : undefined
    default:
      return undefined
  }
}

/**
 * Checks if a field should be hidden in admin UI.
 */
export function isFieldHidden(field: VexField): boolean {
  return field.admin?.hidden ?? false
}

/**
 * Checks if a field is read-only in admin UI.
 */
export function isFieldReadOnly(field: VexField): boolean {
  return field.admin?.readOnly ?? false
}
```

### Usage in Framework Packages

```typescript
// packages/react/src/admin/columns/registry.tsx
import { getFieldLabel, getFieldAlignment, formatFieldCellValue } from '@vexcms/core/fields/helpers'
import type { VexField } from '@vexcms/core'

/**
 * Generic column factory that works for most field types.
 * Uses core's generic helpers instead of field-specific logic.
 */
export function createGenericColumn(
  fieldKey: string,
  field: VexField
): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: fieldKey,
    header: getFieldLabel(field, fieldKey),  // ✅ Generic helper
    meta: { align: getFieldAlignment(field) },  // ✅ Generic helper
    cell: ({ getValue }) => {
      const value = getValue()
      return <span>{formatFieldCellValue(field, value)}</span>  // ✅ Generic helper
    }
  }
}

/**
 * Specialized column factory for fields that need custom rendering.
 */
export function createImageUrlColumn(
  fieldKey: string,
  field: ImageUrlFieldDef,
  context: VexColumnContext
): ColumnDef<Record<string, unknown>> {
  const Image = context.Image || DefaultImage

  return {
    accessorKey: fieldKey,
    header: getFieldLabel(field, fieldKey),  // ✅ Generic helper
    meta: { align: getFieldAlignment(field) },  // ✅ Generic helper
    cell: ({ getValue }) => {
      const url = getValue() as string
      if (!url) return ''
      return <Image src={url} alt="" width={28} height={28} />
    }
  }
}
```

---

## 2. Component Type Flow (TComponent Generic)

### Problem

Users import field factories from core, but TypeScript doesn't know about framework-specific component types:

```typescript
// User's vex.config.ts
import { text } from '@vexcms/core'

const title = text({
  admin: {
    components: {
      Cell: MyCellComponent  // TypeScript doesn't know what this can be
    }
  }
})
```

### Solution: Generic Field Defs + Framework Re-exports

#### Core Package: Generic Component Type

```typescript
// packages/core/src/types/fields.ts

/**
 * Generic admin component configuration.
 * Framework packages specialize TComponent to their component type.
 */
export interface FieldAdminComponents<TComponent = unknown> {
  /**
   * Custom cell renderer for table columns.
   */
  Cell?: TComponent

  /**
   * Custom form field renderer.
   */
  Field?: TComponent

  /**
   * Custom description component (shown below form fields).
   */
  Description?: TComponent
}

export interface FieldAdminConfig<TComponent = unknown> {
  hidden?: boolean
  readOnly?: boolean
  cellAlignment?: 'left' | 'center' | 'right'
  components?: FieldAdminComponents<TComponent>
  // ... other admin options
}

/**
 * Text field definition with generic component type.
 */
export interface TextFieldDef<TComponent = unknown> {
  type: 'text'
  label?: string
  required?: boolean
  defaultValue?: string
  admin?: FieldAdminConfig<TComponent>
}

/**
 * Creates a text field definition.
 * TComponent defaults to unknown (no type checking for components).
 */
export function text<TComponent = unknown>(
  options?: Omit<TextFieldDef<TComponent>, 'type'>
): TextFieldDef<TComponent> {
  return {
    type: 'text',
    ...options
  }
}

// Repeat for all 19 field types with TComponent generic
```

#### React Package: Typed Re-exports

```typescript
// packages/react/src/types/components.ts

import type { ComponentType } from 'react'

/**
 * Props for custom cell components.
 */
export interface CellComponentProps {
  value: unknown
  row: Record<string, unknown>
  field: VexField<ReactComponent>
}

/**
 * Props for custom form field components.
 */
export interface FieldComponentProps {
  value: unknown
  onChange: (value: unknown) => void
  field: VexField<ReactComponent>
  error?: string
}

/**
 * React component type for VexCMS.
 */
export type ReactComponent =
  | ComponentType<CellComponentProps>
  | ComponentType<FieldComponentProps>
  | ComponentType<{ children: React.ReactNode }>
```

```typescript
// packages/react/src/fields.ts

import * as core from '@vexcms/core'
import type { ReactComponent } from './types/components'
import type { TextFieldDef, NumberFieldDef, RelationshipFieldDef /* ... */ } from '@vexcms/core'

/**
 * Re-export text field factory with React component types.
 * Users importing from @vexcms/react get full type safety for components.
 */
export function text(
  options?: Omit<TextFieldDef<ReactComponent>, 'type'>
): TextFieldDef<ReactComponent> {
  return core.text<ReactComponent>(options)
}

/**
 * Re-export number field factory with React component types.
 */
export function number(
  options?: Omit<NumberFieldDef<ReactComponent>, 'type'>
): NumberFieldDef<ReactComponent> {
  return core.number<ReactComponent>(options)
}

/**
 * Re-export relationship field factory with React component types.
 */
export function relationship(
  to: string,
  options?: Omit<RelationshipFieldDef<ReactComponent>, 'type' | 'to'>
): RelationshipFieldDef<ReactComponent> {
  return core.relationship<ReactComponent>(to, options)
}

// Repeat for all 19 field types
```

#### User's Config: Import from Framework Package

```typescript
// apps/www/vex.config.ts
import { defineConfig, defineCollection } from '@vexcms/react'
import { text, number, relationship } from '@vexcms/react'  // ✅ Typed!
import type { CellComponentProps } from '@vexcms/react'

// Custom cell component (fully typed)
function TitleCell({ value, row }: CellComponentProps) {
  return <strong>{value}</strong>
}

export default defineConfig({
  collections: [
    defineCollection({
      slug: 'posts',
      fields: {
        title: text({
          required: true,
          admin: {
            components: {
              Cell: TitleCell  // ✅ TypeScript knows this is ComponentType<CellComponentProps>
            }
          }
        }),
        views: number(),
        author: relationship('users')
      }
    })
  ]
})
```

#### Alternative: User Imports from Core (No Component Types)

```typescript
// apps/www/vex.config.ts
import { defineConfig, defineCollection } from '@vexcms/core'
import { text, number, relationship } from '@vexcms/core'  // ❌ No component types

export default defineConfig({
  collections: [
    defineCollection({
      slug: 'posts',
      fields: {
        title: text({
          required: true,
          admin: {
            components: {
              Cell: TitleCell  // ⚠️ No type checking (TComponent = unknown)
            }
          }
        })
      }
    })
  ]
})
```

**This works too!** But users get more type safety importing from framework package.

---

## 3. Views in Framework Component Validation

### Updated Validation Types

```typescript
// packages/core/src/validation/framework.ts

/**
 * Required admin views for a complete framework package.
 *
 * @typeParam TView - The view component type (e.g., React.ComponentType, SvelteComponent)
 */
export interface VexFrameworkViews<TView = unknown> {
  /**
   * Dashboard view (admin home page).
   */
  DashboardView: TView

  /**
   * List view (collection documents table).
   */
  ListView: TView

  /**
   * Edit view (create/update document form).
   */
  EditView: TView

  /**
   * Media list view (media library grid).
   */
  MediaListView: TView

  /**
   * Media edit view (media upload/edit form).
   */
  MediaEditView: TView

  /**
   * Global edit view (global settings form).
   */
  GlobalEditView: TView

  /**
   * Not found view (404 page).
   */
  NotFoundView: TView
}

/**
 * Required UI components for a complete framework package.
 *
 * @typeParam TComponent - The component type (e.g., React.ComponentType, SvelteComponent)
 */
export interface VexFrameworkComponents<TComponent = unknown> {
  // Navigation
  Link: TComponent

  // Media
  Image: TComponent

  // Layout
  Modal: TComponent
  Dialog: TComponent
  Drawer: TComponent
  Popover: TComponent

  // Forms
  Form: TComponent
  Button: TComponent
  Input: TComponent
  Textarea: TComponent
  Select: TComponent
  Checkbox: TComponent
  RadioGroup: TComponent
  Switch: TComponent
  Slider: TComponent
  DatePicker: TComponent

  // File upload
  FileUpload: TComponent

  // Rich text
  RichTextEditor: TComponent

  // Data display
  Table: TComponent
  Badge: TComponent
  Avatar: TComponent

  // Feedback
  Toast: TComponent
  Alert: TComponent
  Progress: TComponent
  Spinner: TComponent
}

/**
 * Complete framework package definition.
 * Includes views + components with proper type constraints.
 *
 * @typeParam TComponent - The component type (e.g., React.ComponentType)
 * @typeParam TView - The view component type (e.g., React.ComponentType with specific props)
 */
export interface VexFrameworkPackage<TComponent = unknown, TView = unknown> {
  views: VexFrameworkViews<TView>
  components: VexFrameworkComponents<TComponent>
}

/**
 * Type-safe identity function for framework package definitions.
 * Ensures all required views and components are provided at compile time.
 * Uses generics to enforce the correct component types for the framework.
 *
 * @typeParam TComponent - The component type for your framework
 * @typeParam TView - The view component type for your framework
 * @typeParam T - The full framework package (inferred from the argument)
 *
 * @example
 * ```typescript
 * import type { ComponentType } from 'react'
 *
 * // Define your framework's component types
 * type ReactComponent = ComponentType<any>
 * type ReactView = ComponentType<any>
 *
 * export const reactFramework = defineFrameworkPackage<ReactComponent, ReactView>({
 *   views: {
 *     DashboardView: ReactDashboardView,  // ✅ Type-checked as ReactView
 *     ListView: ReactListView,            // ✅ Type-checked as ReactView
 *     // ... all required views
 *   },
 *   components: {
 *     Link: VexLink,      // ✅ Type-checked as ReactComponent
 *     Image: VexImage,    // ✅ Type-checked as ReactComponent
 *     // ... all required components
 *   }
 * })
 * ```
 */
export function defineFrameworkPackage<
  TComponent = unknown,
  TView = unknown,
  T extends VexFrameworkPackage<TComponent, TView> = VexFrameworkPackage<TComponent, TView>
>(framework: T): T {
  return framework
}

/**
 * Validates that a framework package provides all required views and components.
 * Returns missing items for runtime checking.
 *
 * Note: This is for runtime validation. Compile-time validation is handled
 * by the generic types in defineFrameworkPackage.
 */
export function validateFrameworkPackage<TComponent = unknown, TView = unknown>(
  framework: Partial<VexFrameworkPackage<TComponent, TView>>
): { missingViews: string[]; missingComponents: string[] } {
  const requiredViews: (keyof VexFrameworkViews<TView>)[] = [
    'DashboardView',
    'ListView',
    'EditView',
    'MediaListView',
    'MediaEditView',
    'GlobalEditView',
    'NotFoundView'
  ]

  const requiredComponents: (keyof VexFrameworkComponents<TComponent>)[] = [
    'Link',
    'Image',
    'Modal',
    'Dialog',
    'Drawer',
    'Popover',
    'Form',
    'Button',
    'Input',
    'Textarea',
    'Select',
    'Checkbox',
    'RadioGroup',
    'Switch',
    'Slider',
    'DatePicker',
    'FileUpload',
    'RichTextEditor',
    'Table',
    'Badge',
    'Avatar',
    'Toast',
    'Alert',
    'Progress',
    'Spinner'
  ]

  const missingViews: string[] = []
  const missingComponents: string[] = []

  if (framework.views) {
    for (const key of requiredViews) {
      if (!framework.views[key]) {
        missingViews.push(key)
      }
    }
  } else {
    missingViews.push(...requiredViews)
  }

  if (framework.components) {
    for (const key of requiredComponents) {
      if (!framework.components[key]) {
        missingComponents.push(key)
      }
    }
  } else {
    missingComponents.push(...requiredComponents)
  }

  return { missingViews, missingComponents }
}
```

### React Package Usage

```typescript
// packages/react/src/types/components.ts

import type { ComponentType } from 'react'

/**
 * React component type for VexCMS components.
 * Can be any React component.
 */
export type ReactComponent = ComponentType<any>

/**
 * React view component type for VexCMS views.
 * Views receive props from the Next.js route.
 */
export type ReactView = ComponentType<any>
```

```typescript
// packages/react/src/index.ts

import { defineFrameworkPackage } from '@vexcms/core/validation'
import type { ReactComponent, ReactView } from './types/components'

// Views
import { DashboardView } from './views/DashboardView'
import { ListView } from './views/ListView'
import { EditView } from './views/EditView'
import { MediaListView } from './views/MediaListView'
import { MediaEditView } from './views/MediaEditView'
import { GlobalEditView } from './views/GlobalEditView'
import { NotFoundView } from './views/NotFoundView'

// Components
import { VexLink } from './components/VexLink'
import { VexImage } from './components/VexImage'
import { VexModal } from './components/VexModal'
import { VexDialog } from './components/VexDialog'
// ... all components

/**
 * React framework package for VexCMS.
 * TypeScript enforces that all required views and components are provided
 * AND validates that they match the ReactComponent/ReactView types.
 */
export const reactFramework = defineFrameworkPackage<ReactComponent, ReactView>({
  views: {
    DashboardView,  // ✅ Must be ReactView
    ListView,       // ✅ Must be ReactView
    EditView,       // ✅ Must be ReactView
    MediaListView,  // ✅ Must be ReactView
    MediaEditView,  // ✅ Must be ReactView
    GlobalEditView, // ✅ Must be ReactView
    NotFoundView    // ✅ Must be ReactView
    // ❌ TypeScript error if any view is missing!
    // ❌ TypeScript error if wrong type (e.g., passing a string)!
  },
  components: {
    Link: VexLink,          // ✅ Must be ReactComponent
    Image: VexImage,        // ✅ Must be ReactComponent
    Modal: VexModal,        // ✅ Must be ReactComponent
    Dialog: VexDialog,      // ✅ Must be ReactComponent
    Drawer: VexDrawer,      // ✅ Must be ReactComponent
    // ... all components
    // ❌ TypeScript error if any component is missing!
    // ❌ TypeScript error if wrong type!
  }
})

// Re-export everything
export * from './views'
export * from './components'
export * from './fields'
export * from './hooks'
export * from './types/components'
```

---

### Svelte Package Example

```typescript
// packages/svelte/src/types/components.ts

import type { ComponentType } from 'svelte'

/**
 * Svelte component type for VexCMS.
 */
export type SvelteComponent = ComponentType

/**
 * Svelte view component type.
 */
export type SvelteView = ComponentType
```

```typescript
// packages/svelte/src/index.ts

import { defineFrameworkPackage } from '@vexcms/core/validation'
import type { SvelteComponent, SvelteView } from './types/components'

// Views
import DashboardView from './views/DashboardView.svelte'
import ListView from './views/ListView.svelte'
// ... all views

// Components
import VexLink from './components/VexLink.svelte'
import VexImage from './components/VexImage.svelte'
// ... all components

/**
 * Svelte framework package for VexCMS.
 * Uses same validation system as React, but with Svelte types.
 */
export const svelteFramework = defineFrameworkPackage<SvelteComponent, SvelteView>({
  views: {
    DashboardView,  // ✅ Must be SvelteView
    ListView,       // ✅ Must be SvelteView
    EditView,       // ✅ Must be SvelteView
    MediaListView,  // ✅ Must be SvelteView
    MediaEditView,  // ✅ Must be SvelteView
    GlobalEditView, // ✅ Must be SvelteView
    NotFoundView    // ✅ Must be SvelteView
    // ❌ TypeScript error if passing React component instead of Svelte!
  },
  components: {
    Link: VexLink,    // ✅ Must be SvelteComponent
    Image: VexImage,  // ✅ Must be SvelteComponent
    // ... all components
    // ❌ TypeScript error if passing React component instead of Svelte!
  }
})
```

---

## 🎯 Benefits of Generic Types

### ❌ Without Generics (Unknown Types)

```typescript
// Bad: Using unknown
export interface VexFrameworkComponents {
  Link: unknown  // ⚠️ Any value accepted
  Image: unknown  // ⚠️ No type checking
}

// React package
export const reactFramework = defineFrameworkPackage({
  components: {
    Link: "I'm a string!",  // ✅ TypeScript allows this! (BAD!)
    Image: 123              // ✅ TypeScript allows this! (BAD!)
  }
})
```

**Problems:**
- No type checking - can pass strings, numbers, anything
- No autocomplete for component props
- Runtime errors instead of compile-time errors
- No way to catch framework mismatches (React vs Svelte)

### ✅ With Generics (Type-Safe)

```typescript
// Good: Using generics
export interface VexFrameworkComponents<TComponent = unknown> {
  Link: TComponent  // ✅ Type-checked
  Image: TComponent  // ✅ Type-checked
}

// React package
export const reactFramework = defineFrameworkPackage<ReactComponent, ReactView>({
  components: {
    Link: "I'm a string!",  // ❌ TypeScript error! Must be ReactComponent
    Image: 123,             // ❌ TypeScript error! Must be ReactComponent
    Link: VexLink,          // ✅ Correct! VexLink is ReactComponent
    Image: SvelteImage      // ❌ TypeScript error! Wrong framework!
  }
})
```

**Benefits:**
- ✅ Type checking - only valid components accepted
- ✅ Autocomplete for component props
- ✅ Compile-time errors (catch before runtime)
- ✅ Framework-specific validation (React vs Svelte caught at compile time)
- ✅ Better IDE support and refactoring

---

## 📋 Summary

### 1. Generic Helpers ✅

**Core exports:**
- `getFieldLabel(field, fieldKey, variant?)` - Works for all field types
- `getFieldAlignment(field)` - Works for all field types
- `formatFieldCellValue(field, value)` - Works for all field types
- `validateFieldValue(field, value)` - Works for all field types
- Plus field-specific helpers for specialized logic

**Framework packages use generic helpers:**
```typescript
// No switch statements needed!
const label = getFieldLabel(field, fieldKey)
const value = formatFieldCellValue(field, row[fieldKey])
```

### 2. Component Type Flow ✅

**Core exports generic field defs:**
```typescript
export function text<TComponent = unknown>(options): TextFieldDef<TComponent>
```

**Framework packages re-export with concrete types:**
```typescript
export function text(options): TextFieldDef<ReactComponent>
```

**Users import from framework for type safety:**
```typescript
import { text } from '@vexcms/react'  // ✅ Typed components
// or
import { text } from '@vexcms/core'   // ⚠️ No component types
```

### 3. Views in Validation ✅

**defineFrameworkPackage validates:**
- All required views (DashboardView, ListView, etc.)
- All required components (Link, Image, Form, etc.)
- Compile-time type checking + runtime validation

---

## ✅ Benefits

✅ **No repetitive switch logic** - Framework packages use generic helpers
✅ **Type-safe components** - Users importing from framework get full TypeScript support
✅ **Flexible imports** - Users can import from core or framework
✅ **Complete validation** - Views and components validated at compile time
✅ **Framework agnostic** - Core has no framework code, just generic helpers

---

## 🔄 Complete Type Flow

### User's Config (Full Type Safety)

```typescript
// apps/www/vex.config.ts
import { defineConfig, defineCollection } from '@vexcms/react'
import { text, relationship } from '@vexcms/react'  // ✅ Typed re-exports
import type { CellComponentProps } from '@vexcms/react'

// Custom cell component (fully typed)
function TitleCell({ value, row, field }: CellComponentProps) {
  return <strong className="font-bold">{value}</strong>
}

// Custom relationship cell (fully typed)
function AuthorCell({ value, row, field }: CellComponentProps) {
  const author = value as { name: string; avatar: string }
  return (
    <div className="flex items-center gap-2">
      <img src={author.avatar} className="w-6 h-6 rounded-full" />
      <span>{author.name}</span>
    </div>
  )
}

export default defineConfig({
  collections: [
    defineCollection({
      slug: 'posts',
      fields: {
        title: text({
          required: true,
          admin: {
            components: {
              Cell: TitleCell  // ✅ Type: ComponentType<CellComponentProps>
            }
          }
        }),
        author: relationship('users', {
          admin: {
            components: {
              Cell: AuthorCell  // ✅ Type: ComponentType<CellComponentProps>
            }
          }
        })
      }
    })
  ]
})
```

### Core Package (Generic Types)

```typescript
// packages/core/src/types/fields.ts
export interface TextFieldDef<TComponent = unknown> {
  type: 'text'
  admin?: {
    components?: {
      Cell?: TComponent  // ✅ Generic - framework fills this in
    }
  }
}

export function text<TComponent = unknown>(
  options?: Omit<TextFieldDef<TComponent>, 'type'>
): TextFieldDef<TComponent>
```

### React Package (Concrete Types)

```typescript
// packages/react/src/types/components.ts
export type ReactComponent = ComponentType<any>

// packages/react/src/fields.ts
export function text(
  options?: Omit<TextFieldDef<ReactComponent>, 'type'>
): TextFieldDef<ReactComponent> {
  return core.text<ReactComponent>(options)  // ✅ Fills in TComponent
}
```

### Framework Validation (Type-Safe)

```typescript
// packages/react/src/index.ts
export const reactFramework = defineFrameworkPackage<ReactComponent, ReactView>({
  views: {
    DashboardView,  // ✅ Must be ReactView
    ListView,       // ✅ Must be ReactView
    // ❌ Error if wrong type
  },
  components: {
    Link: VexLink,  // ✅ Must be ReactComponent
    Image: VexImage,  // ✅ Must be ReactComponent
    // ❌ Error if wrong type
  }
})
```

### Type Flow Diagram

```
User Config (vex.config.ts)
  ↓ imports from @vexcms/react
React Package (typed re-exports)
  ↓ calls core with TComponent = ReactComponent
Core Package (generic TComponent)
  ↓ returns TextFieldDef<ReactComponent>
User Config
  ↓ TypeScript validates custom components
✅ TitleCell must be ComponentType<CellComponentProps>
```

**Result:**
- ✅ User gets full type safety for custom components
- ✅ Core remains framework-agnostic
- ✅ Framework packages enforce their component types
- ✅ Compile-time validation catches errors early

---

## 📖 Quick Reference: Key Type Signatures

### For Core Package Authors

```typescript
// Field definition with generic component type
export interface TextFieldDef<TComponent = unknown> {
  type: 'text'
  admin?: FieldAdminConfig<TComponent>
}

// Field factory with generic component type
export function text<TComponent = unknown>(
  options?: Omit<TextFieldDef<TComponent>, 'type'>
): TextFieldDef<TComponent>

// Generic helpers (no TComponent needed - works for all fields)
export function getFieldLabel(field: VexField, fieldKey: string, variant?: 'singular' | 'plural'): string
export function formatFieldCellValue(field: VexField, value: unknown): string

// Framework validation with generics
export interface VexFrameworkPackage<TComponent = unknown, TView = unknown> {
  views: VexFrameworkViews<TView>
  components: VexFrameworkComponents<TComponent>
}

export function defineFrameworkPackage<TComponent, TView, T extends VexFrameworkPackage<TComponent, TView>>(
  framework: T
): T
```

### For Framework Package Authors (React Example)

```typescript
// Define your framework's types
export type ReactComponent = ComponentType<any>
export type ReactView = ComponentType<any>

// Re-export field factories with your types
export function text(options): TextFieldDef<ReactComponent> {
  return core.text<ReactComponent>(options)
}

// Define your framework package with validation
export const reactFramework = defineFrameworkPackage<ReactComponent, ReactView>({
  views: {
    DashboardView: MyDashboardView,  // Must be ReactView
    ListView: MyListView,            // Must be ReactView
    // ... all views
  },
  components: {
    Link: VexLink,   // Must be ReactComponent
    Image: VexImage,  // Must be ReactComponent
    // ... all components
  }
})
```

### For End Users (App Authors)

```typescript
// Import from framework package for type safety
import { text, relationship } from '@vexcms/react'  // ✅ Typed!
import type { CellComponentProps } from '@vexcms/react'

// Custom component (fully typed)
function MyCell({ value, row, field }: CellComponentProps) {
  return <div>{value}</div>
}

// Use in config
const title = text({
  admin: {
    components: {
      Cell: MyCell  // ✅ TypeScript validates this is correct type
    }
  }
})

// Or import from core (no component types)
import { text } from '@vexcms/core'  // ⚠️ TComponent = unknown
```
