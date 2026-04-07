# Text Field Updated: Input/Output Type Pattern

The text field has been updated to use the Input/Output type pattern, separating user-facing types (optional properties) from resolved types (all defaults applied).

---

## What Changed

### 1. Type System Architecture

**Before**: Single type with optional properties
```typescript
export interface VexTextField<TComponent = unknown> {
  label?: string;
  required?: boolean;
  admin?: { ... }; // All optional nested properties
}
```

**After**: Separate Input/Output types
```typescript
// User-facing (mostly optional)
export interface VexTextFieldInput<TComponent = unknown> {
  label?: string;
  required?: boolean;
  admin?: FieldAdminConfigInput<TComponent>; // All optional
}

// Resolved (defaults applied)
export interface VexTextField<TComponent = unknown> {
  readonly type: "text";
  label: string; // Always defined (filled by defineCollection)
  required: boolean; // Always defined (defaults to false)
  admin: FieldAdminConfig<TComponent>; // Always defined with core properties
}
```

---

## Type Hierarchy

### Admin Config Types

**FieldAdminConfigInput** (user-facing):
- All properties optional
- Used when user writes config

**FieldAdminConfig** (resolved):
- Core properties required: `hidden`, `readOnly`, `position`, `width`, `cellAlignment`
- Optional properties remain optional: `placeholder`, `description`, `components`

### Base Field Types

**BaseFieldInput** (user-facing):
- All properties optional
- Used as base for all `Vex[Field]Input` types

**BaseField** (resolved):
- `label` — Required (string), filled by defineCollection
- `required` — Required (boolean), defaults to false
- `admin` — Required (FieldAdminConfig), all core properties defined
- `index`, `searchIndex`, `description` — Optional (no defaults)

### Concrete Field Types

**VexTextFieldInput** extends BaseFieldInput:
- All properties optional
- User writes this in config

**VexTextField** extends BaseField:
- `type` — Always `"text"`
- `label` — Always defined (string)
- `required` — Always defined (boolean)
- `admin` — Always defined (all core properties)
- `defaultValue`, `minLength`, `maxLength` — Optional (no defaults)

---

## Factory Function Transformation

The `text()` factory function is the transformation boundary:

```typescript
export function text<TComponent = unknown>(
  options?: VexTextFieldInput<TComponent>,
): VexTextField<TComponent> {
  return {
    type: "text",

    // Core properties with defaults
    label: options?.label ?? "",
    required: options?.required ?? false,

    // Admin config with all defaults applied
    admin: {
      hidden: options?.admin?.hidden ?? false,
      readOnly: options?.admin?.readOnly ?? false,
      position: options?.admin?.position ?? "main",
      width: options?.admin?.width ?? "full",
      cellAlignment: options?.admin?.cellAlignment ?? "left",
      // Optional admin properties (no defaults)
      placeholder: options?.admin?.placeholder,
      description: options?.admin?.description,
      components: options?.admin?.components,
    },

    // Optional field properties (no defaults)
    description: options?.description,
    defaultValue: options?.defaultValue,
    minLength: options?.minLength,
    maxLength: options?.maxLength,
    index: options?.index,
    searchIndex: options?.searchIndex,
  };
}
```

---

## Two-Phase Transformation

### Phase 1: Field Factory (text())

**Input**: User config (VexTextFieldInput)
```typescript
text({ required: true, maxLength: 100 })
```

**Output**: Field with defaults (VexTextField)
```typescript
{
  type: "text",
  label: "",        // ← Empty, will be filled by defineCollection
  required: true,
  maxLength: 100,
  admin: {
    hidden: false,
    readOnly: false,
    position: "main",
    width: "full",
    cellAlignment: "left",
  }
}
```

### Phase 2: Collection Definition (defineCollection)

**Input**: Fields with empty labels
```typescript
fields: {
  title: text({ required: true }),
  slug: text({ required: true }),
}
```

**Output**: Fields with labels from keys
```typescript
{
  title: { label: "Title", required: true, ... },
  slug: { label: "Slug", required: true, ... },
}
```

---

## Usage Examples

### User Code (Writes Input Types)

```typescript
import { text, defineCollection } from '@vexcms/core'

const posts = defineCollection({
  slug: "posts",
  fields: {
    // Minimal config
    title: text({ required: true }),

    // With validation
    slug: text({
      required: true,
      minLength: 3,
      maxLength: 100,
      index: "by_slug",
    }),

    // With admin config
    excerpt: text({
      maxLength: 300,
      admin: {
        width: "full",
        placeholder: "Brief summary...",
      },
    }),

    // No config at all
    author: text(),
  },
})
```

### Framework Code (Receives Resolved Types)

```typescript
import type { VexTextField } from '@vexcms/core'

function TextInput({ field }: { field: VexTextField }) {
  // ✅ Safe to access without checks — always defined
  const label = field.label; // Always string
  const position = field.admin.position; // Always "main" | "sidebar"
  const width = field.admin.width; // Always "full" | "half"
  const alignment = field.admin.cellAlignment; // Always "left" | "center" | "right"

  // ✅ Optional properties still need checks (as they should)
  const placeholder = field.admin.placeholder ?? "Enter text...";

  return (
    <div className={`field-${position} width-${width}`}>
      <label>{label}</label>
      <input
        placeholder={placeholder}
        style={{ textAlign: alignment }}
      />
    </div>
  );
}
```

---

## Union Types

### VexFieldInput (User-Facing)

```typescript
export type VexFieldInput<TComponent = unknown> = VexTextFieldInput<TComponent>;
// | VexColorFieldInput<TComponent>  // Coming soon
// | VexTabsFieldInput<TComponent>   // Coming soon
// ...
```

### VexField (Resolved)

```typescript
export type VexField<TComponent = unknown> = VexTextField<TComponent>;
// | VexColorField<TComponent>  // Coming soon
// | VexTabsField<TComponent>   // Coming soon
// ...
```

---

## Exports

### From `@vexcms/core`

```typescript
// Factory functions
export { text } from './fields'

// Helper functions (for framework packages)
export { getTextFieldLabel, getTextFieldAlignment, ... } from './fields'

// Types
export type {
  // Input types (user-facing)
  VexTextFieldInput,
  VexFieldInput,

  // Output types (resolved)
  VexTextField,
  VexField,

  // Shared types
  Alignment,
  Labels,
  FieldAdminConfigInput,
  FieldAdminConfig,
} from './types/fields'
```

---

## Benefits

### 1. Clean User API
Users write minimal config without boilerplate:
```typescript
title: text({ required: true })
```

### 2. Safe Framework Code
No defensive undefined checks needed:
```typescript
const position = field.admin.position; // Always defined
```

### 3. Type Safety
Can't accidentally pass unresolved config to framework:
```typescript
function renderField(field: VexTextField) { ... }
renderField(userInput); // ❌ Type error
renderField(text(userInput)); // ✅ Works
```

### 4. Self-Documenting
Types clearly show transformation:
- `VexTextFieldInput` = what user provides
- `VexTextField` = what framework receives
- `text()` = transformation function

---

## Next Steps

When implementing new field types (color, tabs, imageUrl, blocks, ui):

1. Create `Vex[Field]Input` type extending `BaseFieldInput`
2. Create `Vex[Field]` type extending `BaseField`
3. Implement factory function accepting Input, returning Output
4. Add to `VexFieldInput` union type
5. Add to `VexField` union type
6. Export both types from field module and package root

---

## Why Label is Empty After text()

The field factory doesn't have access to the field key at call time:

```typescript
fields: {
  title: text({ required: true }),
  //^^^^^
  // This key isn't available inside text() — only defineCollection sees it
}
```

Only `defineCollection` has both the key and field definition when iterating:

```typescript
Object.entries(fields).map(([key, field]) => {
  // ✅ Now we have both key ("title") and field definition
  const resolvedField = { ...field, label: field.label || toTitleCase(key) };
})
```

This is why `label` is set to empty string by the factory and filled in by `defineCollection`.
