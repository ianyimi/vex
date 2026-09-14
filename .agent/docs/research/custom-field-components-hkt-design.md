# Custom Components System — Design Spec

**Status:** Deferred to v0.2.0+
**Created:** 2026-04-04
**Reason for deferral:** Premature optimization for v0.1.0. Focus on building default admin UI first, then add customization once we understand the actual needs.

---

## Overview

This spec preserves the framework-agnostic component customization system that was designed for VexCMS but removed from v0.1.0 to reduce scope.

The system allows users to provide custom React/Solid/Vue components for:
- **Input components** — replace the default field input in the edit form
- **Cell components** — replace the default cell renderer in the data table

The design uses Higher-Kinded Types (HKT) to remain framework-agnostic in the core package while providing type-safe component props in framework packages.

---

## The Problem

**Core package constraints:**
- Cannot import React, Solid, Vue, or any framework types
- Must define field configuration types that work across frameworks
- Must store component references in the config object

**Framework package needs:**
- Type-safe component props (e.g., `React.ComponentType<InputComponentProps>`)
- Ability to pass custom props alongside base props
- Render components with full framework features

**User experience goals:**
- Define custom components in `vex.config.ts` with type safety
- Pass extra props to components (e.g., `colorScheme`, `variant`)
- Get autocomplete for component props in IDE

---

## Implementation (Saved from v0.1.0)

### Core Types (`packages/core/src/fields/types.ts`)

```typescript
/**
 * Higher-kinded type interface for framework-specific component constructors.
 *
 * Frameworks implement this to map a props type to their component type.
 * The `_props` slot is the "input" and `component` is the "output".
 *
 * @example
 * ```ts
 * // React package
 * interface ReactComponentHKT extends ComponentHKT {
 *   component: React.ComponentType<this['_props']>;
 * }
 *
 * // Solid package
 * interface SolidComponentHKT extends ComponentHKT {
 *   component: (props: this['_props']) => JSX.Element;
 * }
 * ```
 */
export interface ComponentHKT {
  readonly _props: unknown;
  readonly _extra: Record<string, unknown>;
  readonly component: unknown;
}

/**
 * Applies a ComponentHKT to specific base props and optional extra props,
 * resolving to the framework's component type.
 *
 * @example
 * ```ts
 * type InputComponent = ApplyComponent<ReactComponentHKT, InputComponentProps>;
 * // → React.ComponentType<InputComponentProps>
 *
 * type InputWithExtras = ApplyComponent<ReactComponentHKT, InputComponentProps, { colorScheme: string }>;
 * // → React.ComponentType<InputComponentProps & { colorScheme: string }>
 * ```
 */
export type ApplyComponent<
  F extends ComponentHKT,
  P,
  E extends Record<string, unknown> = Record<string, never>,
> = (F & { readonly _props: P; readonly _extra: E })["component"];

/**
 * Opaque runtime shape stored in the field config for a custom component.
 * Created via a framework-specific factory (e.g. `fieldComponent()` in `@vex/react`).
 *
 * The `props` are merged with the base props by the framework renderer.
 */
export type ComponentEntry = {
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-explicit-any
  component: (props: any) => unknown;
  props: Record<string, unknown>;
};

/**
 * Props passed to custom field input components.
 * Custom components receive these props and use useVexField() for state.
 *
 * Use the generic parameter to narrow the field type for type-safe access
 * to field-specific properties like `options` on select fields.
 *
 * @example
 * ```tsx
 * // Generic — fieldDef has label, admin, description, required
 * function MyField({ name, fieldDef, readOnly }: InputComponentProps) { ... }
 *
 * // Narrowed — fieldDef is TextField with maxLength, minLength, etc.
 * function MyTextField({ name, fieldDef }: InputComponentProps<TextField>) { ... }
 * ```
 */
export interface InputComponentProps<TField extends VexField = VexField> {
  /** The field key name (e.g., "primaryColor") */
  name: string;
  /** The VexField definition for this field */
  fieldDef: TField;
  /** Whether the field is read-only (from permissions or config) */
  readOnly: boolean;
}

/**
 * Props passed to custom cell components in the data table.
 */
export interface CellComponentProps<TField extends VexField = VexField> {
  /** The raw cell value from the document */
  value: unknown;
  /** The full row data (document) */
  row: Record<string, unknown>;
  /** The VexField definition for this column's field */
  fieldDef: TField;
}
```

### Usage in FieldAdminConfig

```typescript
export interface FieldAdminConfigInput {
  // ... other properties ...

  /**
   * Custom components for this field.
   *
   * - `Input` replaces the entire field input in the edit form.
   *   Only allowed on text, number, checkbox, and select fields.
   *   The component receives InputComponentProps and uses useVexField() for state.
   *
   * - `Cell` replaces the cell renderer in the data table list view.
   *   Allowed on any field type.
   *
   * Use the framework-specific factory (e.g. `fieldComponent()`) to create entries
   * with type-safe custom props merged alongside the base component props.
   */
  components?: {
    Input?: ComponentEntry;
    Cell?: ComponentEntry;
  };
}

export interface FieldAdminConfig {
  // ... other properties ...

  /**
   * Custom components for this field.
   *
   * - `Input` replaces the entire field input in the edit form.
   * - `Cell` replaces the cell renderer in the data table list view.
   *
   * Use the framework-specific factory (e.g. `fieldComponent()`) to create entries
   * with type-safe custom props merged alongside the base component props.
   */
  components?: {
    Input?: ComponentEntry;
    Cell?: ComponentEntry;
  };
}
```

---

## Usage Examples

### React Package Implementation

```typescript
// packages/react/src/field.ts

import type { ComponentHKT, InputComponentProps, CellComponentProps } from '@vexcms/core';
import type { ComponentType } from 'react';

/**
 * React's ComponentHKT implementation.
 * Maps props types to React.ComponentType.
 */
export interface ReactComponentHKT extends ComponentHKT {
  component: ComponentType<this['_props'] & this['_extra']>;
}

/**
 * Creates a type-safe Input component entry for React.
 *
 * @example
 * ```tsx
 * import { fieldComponent } from '@vexcms/react';
 *
 * const MyInput = ({ name, fieldDef, colorScheme }: InputComponentProps & { colorScheme: string }) => {
 *   const { value, setValue } = useVexField(name);
 *   return <input value={value} onChange={e => setValue(e.target.value)} />;
 * };
 *
 * // In vex.config.ts
 * title: text({
 *   admin: {
 *     components: {
 *       Input: fieldComponent(MyInput, { colorScheme: 'blue' })
 *     }
 *   }
 * })
 * ```
 */
export function fieldComponent<P extends Record<string, unknown>>(
  component: ComponentType<InputComponentProps & P>,
  props: P
): ComponentEntry {
  return { component, props };
}

/**
 * Creates a type-safe Cell component entry for React.
 */
export function cellComponent<P extends Record<string, unknown>>(
  component: ComponentType<CellComponentProps & P>,
  props: P
): ComponentEntry {
  return { component, props };
}
```

### User Code Example

```typescript
// vex.config.ts
import { defineConfig, defineCollection, text } from '@vexcms/core';
import { fieldComponent } from '@vexcms/react';
import { ColorInput } from './components/ColorInput';

export default defineConfig({
  collections: {
    themes: defineCollection({
      fields: {
        name: text({ required: true }),

        primaryColor: text({
          label: 'Primary Color',
          admin: {
            components: {
              // Custom input with extra props
              Input: fieldComponent(ColorInput, {
                format: 'hex',
                showAlpha: true
              })
            }
          }
        })
      }
    })
  }
});
```

### Custom Component Implementation

```tsx
// components/ColorInput.tsx
import { InputComponentProps, TextField } from '@vexcms/core';
import { useVexField } from '@vexcms/react';

interface ColorInputProps extends InputComponentProps<TextField> {
  format: 'hex' | 'rgb' | 'hsl';
  showAlpha?: boolean;
}

export function ColorInput({ name, fieldDef, readOnly, format, showAlpha }: ColorInputProps) {
  const { value, setValue, error } = useVexField(name);

  return (
    <div>
      <label>{fieldDef.label}</label>
      <input
        type="color"
        value={value ?? '#000000'}
        onChange={e => setValue(e.target.value)}
        disabled={readOnly}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

---

## Framework Package Rendering

### Admin Form Renderer

```tsx
// packages/react/src/admin/FieldRenderer.tsx

export function FieldRenderer({ name, field }: { name: string; field: VexField }) {
  // Check for custom Input component
  const customInput = field.admin.components?.Input;

  if (customInput) {
    const Component = customInput.component as ComponentType<InputComponentProps>;
    const baseProps: InputComponentProps = {
      name,
      fieldDef: field,
      readOnly: field.admin.readOnly
    };

    // Merge custom props with base props
    const allProps = { ...baseProps, ...customInput.props };
    return <Component {...allProps} />;
  }

  // Default renderer based on field.type
  switch (field.type) {
    case 'text':
      return <TextInput name={name} field={field} />;
    case 'number':
      return <NumberInput name={name} field={field} />;
    // ... etc
  }
}
```

### Data Table Cell Renderer

```tsx
// packages/react/src/admin/CellRenderer.tsx

export function CellRenderer({
  value,
  row,
  field
}: {
  value: unknown;
  row: Record<string, unknown>;
  field: VexField
}) {
  // Check for custom Cell component
  const customCell = field.admin.components?.Cell;

  if (customCell) {
    const Component = customCell.component as ComponentType<CellComponentProps>;
    const baseProps: CellComponentProps = {
      value,
      row,
      fieldDef: field
    };

    const allProps = { ...baseProps, ...customCell.props };
    return <Component {...allProps} />;
  }

  // Default renderer based on field.type
  return <DefaultCell value={value} field={field} />;
}
```

---

## Benefits of This Design

1. **Framework-agnostic core** — no React/Solid/Vue imports in `@vexcms/core`
2. **Type-safe components** — full autocomplete for props in framework packages
3. **Custom props support** — pass extra config to components
4. **Flexible rendering** — framework packages control how components are rendered
5. **Future-proof** — easy to add new frameworks (Svelte, Angular, etc.)

---

## Limitations & Trade-offs

1. **Complexity** — HKT pattern is sophisticated, may confuse contributors
2. **Runtime type erasure** — TypeScript types don't prevent runtime mismatches
3. **Bundle size** — Stores component references in config (but negligible)
4. **Learning curve** — Users must use framework-specific factories

---

## Implementation Checklist (for v0.2.0+)

When ready to reintroduce this system:

### Core Package (`@vexcms/core`)
- [ ] Add ComponentHKT interface to `fields/types.ts`
- [ ] Add ApplyComponent type helper
- [ ] Add ComponentEntry type
- [ ] Add InputComponentProps interface
- [ ] Add CellComponentProps interface
- [ ] Add components to FieldAdminConfigInput
- [ ] Add components to FieldAdminConfig
- [ ] Update text() config to support components in admin
- [ ] Add JSDoc documentation for all types

### React Package (`@vexcms/react`)
- [ ] Create ReactComponentHKT interface
- [ ] Implement fieldComponent() factory
- [ ] Implement cellComponent() factory
- [ ] Update FieldRenderer to check for custom Input
- [ ] Update CellRenderer to check for custom Cell
- [ ] Add useVexField() hook for component state management
- [ ] Write docs and examples

### Testing
- [ ] Test custom Input component in form
- [ ] Test custom Cell component in table
- [ ] Test custom props merging
- [ ] Test with multiple frameworks
- [ ] Test TypeScript autocomplete works

### Documentation
- [ ] Write guide on creating custom components
- [ ] Add examples to cookbook
- [ ] Document limitations (which fields support custom Input)
- [ ] Add migration guide from v0.1.0

---

## Alternative Approaches to Consider

When implementing in v0.2.0+, consider these simpler alternatives:

### Option A: Framework-Specific Component Types

Instead of ComponentHKT, just have framework packages define their own types:

```typescript
// @vexcms/core (no component system)
export interface FieldAdminConfigInput {
  // No components property
}

// @vexcms/react
export interface ReactFieldAdminConfig extends FieldAdminConfigInput {
  components?: {
    Input?: React.ComponentType<InputComponentProps>;
    Cell?: React.ComponentType<CellComponentProps>;
  };
}
```

**Pros:** Much simpler, no HKT complexity
**Cons:** Core package can't define complete types

### Option B: Any-Typed Components

Just use `any` for components and let framework packages handle it:

```typescript
// @vexcms/core
export interface FieldAdminConfigInput {
  components?: {
    Input?: any;
    Cell?: any;
  };
}
```

**Pros:** Simplest possible approach
**Cons:** No type safety, framework packages must cast

### Option C: Component Slots (No Custom Props)

Remove custom props support, just swap components:

```typescript
export interface FieldAdminConfigInput {
  components?: {
    Input?: ComponentType<InputComponentProps>;  // No extra props
    Cell?: ComponentType<CellComponentProps>;
  };
}
```

**Pros:** Simpler than HKT, still type-safe
**Cons:** Can't pass custom config to components

---

## Recommendation for v0.2.0

**Start with Option C** (Component Slots), then evolve to full HKT if needed:

1. Build the default admin UI first
2. Identify actual customization needs from real usage
3. Add simple component slots (no custom props)
4. If users need custom props, add HKT system
5. Document the final design based on real requirements

This way you:
- Ship something usable quickly
- Learn what customization is actually needed
- Avoid over-engineering before understanding the problem
- Can still add the full HKT system if it proves necessary

---

## References

- Original implementation: This spec
- HKT explanation: https://www.matechs.com/blog/encoding-hkts-in-typescript-once-again
- Similar patterns: Zod's `.transform()`, Drizzle's schema builders

---

**Last Updated:** 2026-04-04
**Next Review:** When starting v0.2.0 admin UI work
