# Type Transformation Flow: VexCMS Config

This document shows how types flow through VexCMS from user config → resolved config → React components using the Input/Output type pattern.

---

## The Complete Flow

```
User writes config (Input types)
        ↓
Field factories apply defaults (text(), color(), etc.)
        ↓
defineCollection fills in labels from field keys
        ↓
defineConfig validates and normalizes
        ↓
Resolved config (Output types)
        ↓
React components consume (no undefined checks needed)
```

---

## 1. User Writes Config (Input Types)

**File**: `vex.config.ts`

```typescript
import { defineConfig, defineCollection, text, color, tabs } from "@vexcms/core";

export default defineConfig({
  collections: {
    posts: defineCollection({
      slug: "posts",
      labels: { singular: "Post", plural: "Posts" },
      fields: {
        // Minimal config - most properties omitted
        title: text({
          required: true,
          maxLength: 200,
        }),

        // Even more minimal
        slug: text({
          required: true,
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

        // No config at all - use all defaults
        author: text(),
      },
    }),

    themes: defineCollection({
      slug: "themes",
      fields: {
        name: text({ required: true }),

        colors: tabs({
          tabs: [
            {
              label: "Light Mode",
              slug: "light",
              fields: {
                background: color({ format: "hsl" }),
                foreground: color({ format: "hsl" }),
              },
            },
            {
              label: "Dark Mode",
              slug: "dark",
              fields: {
                background: color({ format: "hsl" }),
                foreground: color({ format: "hsl" }),
              },
            },
          ],
        }),
      },
    }),
  },
});
```

**Type at this point**: `VexConfigInput`

---

## 2. Field Factories Apply Defaults

**File**: `src/fields/text/config.ts`

```typescript
import type { VexTextFieldInput, VexTextField } from "../../types/fields";

export function text<TComponent = unknown>(
  options?: VexTextFieldInput<TComponent>,
): VexTextField<TComponent> {
  return {
    type: "text",
    label: options?.label ?? "", // ← Empty string, will be filled by defineCollection
    required: options?.required ?? false,
    admin: {
      hidden: options?.admin?.hidden ?? false,
      readOnly: options?.admin?.readOnly ?? false,
      position: options?.admin?.position ?? "main",
      width: options?.admin?.width ?? "full",
      cellAlignment: options?.admin?.cellAlignment ?? "left",
      placeholder: options?.admin?.placeholder, // ← Stays undefined if not provided
      description: options?.admin?.description, // ← Stays undefined if not provided
      components: options?.admin?.components, // ← Stays undefined if not provided
    },
    description: options?.description,
    defaultValue: options?.defaultValue,
    minLength: options?.minLength,
    maxLength: options?.maxLength,
    index: options?.index,
    searchIndex: options?.searchIndex,
  };
}
```

**After field factories run**:

```typescript
// What user wrote:
title: text({ required: true, maxLength: 200 })

// What text() returns:
{
  type: "text",
  label: "", // ← Will be filled in next step by defineCollection
  required: true,
  maxLength: 200,
  admin: {
    hidden: false,
    readOnly: false,
    position: "main",
    width: "full",
    cellAlignment: "left",
    placeholder: undefined,
    description: undefined,
    components: undefined,
  },
  description: undefined,
  defaultValue: undefined,
  minLength: undefined,
  index: undefined,
  searchIndex: undefined,
}
```

**Type at this point**: `VexTextField<unknown>`

---

## 3. defineCollection Fills in Labels

**File**: `src/config/defineCollection.ts`

```typescript
import { toTitleCase } from "../utils";
import type {
  CollectionConfigInput,
  CollectionConfig,
  VexField,
} from "../types";

export function defineCollection<
  TFields extends Record<string, VexField>,
>(
  input: CollectionConfigInput<TFields>,
): CollectionConfig<TFields> {
  // Fill in field labels from field keys
  const fieldsWithLabels = Object.fromEntries(
    Object.entries(input.fields).map(([key, field]) => {
      // If field.label is empty string, use title-cased key
      const resolvedField = {
        ...field,
        label: field.label || toTitleCase(key),
      };
      return [key, resolvedField];
    }),
  ) as TFields;

  return {
    slug: input.slug,
    labels: input.labels ?? {
      singular: toTitleCase(input.slug),
      plural: toTitleCase(input.slug) + "s",
    },
    fields: fieldsWithLabels,
    admin: {
      group: input.admin?.group,
      hidden: input.admin?.hidden ?? false,
      icon: input.admin?.icon,
      defaultSort: input.admin?.defaultSort ?? { field: "_creationTime", order: "desc" },
    },
  };
}
```

**Why label is filled here, not in the field factory:**

The field factory doesn't have access to the field key:

```typescript
fields: {
  title: text({ required: true }),
  //^^^^^
  // This key isn't available inside text() — only defineCollection sees it
}
```

Only `defineCollection` has both the key and field definition when iterating over `Object.entries(fields)`.

**After defineCollection runs**:

```typescript
// Before:
title: { type: "text", label: "", required: true, ... }
slug: { type: "text", label: "", required: true, ... }
author: { type: "text", label: "", required: false, ... }

// After:
title: { type: "text", label: "Title", required: true, ... }
slug: { type: "text", label: "Slug", required: true, ... }
author: { type: "text", label: "Author", required: false, ... }
```

**Type at this point**: `CollectionConfig<TFields>`

---

## 4. React Components Consume (No Undefined Checks)

**File**: `@vexcms/react/src/components/fields/TextInput.tsx`

```typescript
import type { VexTextField } from "@vexcms/core";
import type { ReactComponent } from "../../types";

interface TextInputProps {
  field: VexTextField<ReactComponent>; // ← Resolved type, all defaults applied
  value: string;
  onChange: (value: string) => void;
}

export function TextInput({ field, value, onChange }: TextInputProps) {
  // ✅ No undefined checks needed for properties with defaults
  const position = field.admin.position; // Always "main" | "sidebar"
  const width = field.admin.width; // Always "full" | "half"
  const alignment = field.admin.cellAlignment; // Always "left" | "center" | "right"
  const isReadOnly = field.admin.readOnly; // Always boolean
  const isRequired = field.required; // Always boolean
  const label = field.label; // Always string (never empty after defineCollection)

  // ✅ Optional properties still need checks (as they should)
  const placeholder = field.admin.placeholder ?? "Enter text...";
  const description = field.admin.description ?? field.description;

  // ✅ Custom components are truly optional
  if (field.admin.components?.Input) {
    return <field.admin.components.Input field={field} value={value} onChange={onChange} />;
  }

  return (
    <div className={`field-${position} width-${width}`}>
      <label>
        {label}
        {isRequired && <span className="required">*</span>}
      </label>

      {description && <p className="description">{description}</p>}

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={isReadOnly}
        required={isRequired}
        maxLength={field.maxLength}
        minLength={field.minLength}
        style={{ textAlign: alignment }}
      />
    </div>
  );
}
```

---

## Benefits of This Pattern

### 1. Clean User API

Users write minimal config:

```typescript
title: text({ required: true })
```

Not this:

```typescript
title: text({
  required: true,
  label: "Title",
  admin: {
    hidden: false,
    readOnly: false,
    position: "main",
    width: "full",
    cellAlignment: "left",
  },
})
```

### 2. Safe Framework Code

React components don't need defensive checks:

```typescript
// ✅ Clean
const width = field.admin.width;

// ❌ Unnecessary with resolved types
const width = field.admin?.width ?? "full";
```

### 3. Type Safety

TypeScript prevents using unresolved configs in framework code:

```typescript
function renderField(field: VexTextField) {
  // ✅ Only accepts resolved fields
}

const userInput: VexTextFieldInput = { required: true };
renderField(userInput); // ❌ Type error

const resolved = text(userInput);
renderField(resolved); // ✅ Works
```

### 4. Clear Transformation Boundary

Factory functions are the transformation point:

```typescript
// User writes this (Input type)
const config = { required: true };

// Factory transforms to this (Output type)
const field = text(config);

// Framework consumes Output type
<TextInput field={field} />
```

### 5. Self-Documenting

Types tell the story:
- `VexTextFieldInput` = user-facing API
- `VexTextField` = internal representation
- Factory functions bridge the gap

---

## Implementation Checklist for New Field Types

### For Each Field Type

- [ ] Define `Vex[Field]Input` interface extending `BaseFieldInput`
- [ ] Define `Vex[Field]` interface extending `BaseField`
- [ ] Implement factory function accepting Input, returning Output with defaults
- [ ] Export both types from `src/types/fields.ts`
- [ ] Add to `VexFieldInput` union type
- [ ] Add to `VexField` union type
- [ ] Export from field module and package root

---

## Summary

The Input/Output type pattern provides:

1. **User writes minimal config** (Input types, most properties optional)
2. **Factory functions apply defaults** (Output types, core properties always defined)
3. **defineCollection fills context** (field labels from keys)
4. **Framework consumes resolved types** (no undefined checks needed)

This gives you:
- ✅ Ergonomic user API
- ✅ Type-safe framework code
- ✅ Clear transformation boundaries
- ✅ Self-documenting types
- ✅ No runtime overhead
