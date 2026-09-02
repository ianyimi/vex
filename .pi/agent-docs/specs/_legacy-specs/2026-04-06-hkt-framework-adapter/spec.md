# HKT Framework Adapter — Component Typing for `defineFrameworkAdapter`

## Overview

Extends `packages/core/src/framework.ts` so that framework packages (React, Solid, etc.) pass
their field and cell components into `defineFrameworkAdapter`, and TypeScript enforces two things
simultaneously: **completeness** (every type in the `AdminField` union has a component) and
**prop contracts** (each component is typed against the correct props for its field type via HKT).

This is a pure types change — zero runtime code added. The function body stays `return adapter`.

## Design Decisions

- `FieldComponentMap` and `CellComponentMap` key off `AdminField['type']` (currently `"text"`),
  not a static list. As new field types are added to the `AdminField` union, the maps
  automatically require a new component slot — TypeScript enforces completeness at the adapter
  call site.
- HKT (`ComponentHKT` + `ApplyComponent`) already lives in `src/fields/types.ts`. This spec
  imports from there — no new HKT infrastructure needed.
- `FrameworkAdapterInput` is the user-facing type (full JSDoc). `FrameworkAdapter` is the
  resolved type (short JSDoc, `@see` back to input).

## Out of Scope

- Runtime validation of component props
- Any change to `src/fields/types.ts`
- The React or Next package implementations (those consume this adapter)
- `cells` being optional — both `fields` and `cells` are required for completeness

## Target Directory Structure

```
packages/core/src/
└── framework.ts   ← only file modified
```

## Implementation Order

1. **Step 1** — Replace `framework.ts` with the updated types and signature. After this step,
   `pnpm --filter @vexcms/core build` passes and the new exports are available.

---

## Step 1: Update `framework.ts`

This is the entire spec — one file, all types, updated function signature. The body stays
`return adapter as FrameworkAdapter<F>`.

- [ ] Replace `packages/core/src/framework.ts` with the code below
- [ ] Run `pnpm --filter @vexcms/core build` — must pass with no type errors
- [ ] In the React package (or a scratch file), write a `defineFrameworkAdapter<ReactHKT>(...)` call
      and verify that `fields.text` gets autocomplete for `InputComponentProps<TextField>`
- [ ] Verify that omitting `fields.text` produces a TypeScript error

**File: `packages/core/src/framework.ts`**

````ts
import type {
  AdminField,
  ApplyComponent,
  CellComponentProps,
  ComponentHKT,
  InputComponentProps,
} from "./fields";

/**
 * Maps every field type in the `AdminField` union to the framework's input component type
 * for that field.
 *
 * Keyed by `AdminField['type']` — as new field types are added to the union, TypeScript
 * automatically requires a matching component slot in this map.
 *
 * Each slot resolves to `ApplyComponent<F, InputComponentProps<MatchingFieldDef>>`, which
 * means the component must accept the input props for that specific field type. This gives
 * the component full autocomplete for field-specific properties (e.g. `fieldDef.maxLength`
 * on the text slot).
 *
 * @see {@link CellComponentMap} for the data table cell equivalent
 * @see {@link ComponentHKT} for how framework packages define their HKT
 * @see {@link ApplyComponent} for how the HKT resolves to a concrete component type
 */
export type FieldComponentMap<F extends ComponentHKT> = {
  [K in AdminField["type"]]: ApplyComponent<
    F,
    InputComponentProps<Extract<AdminField, { type: K }>>
  >;
};

/**
 * Maps every field type in the `AdminField` union to the framework's cell component type
 * for that field.
 *
 * Keyed by `AdminField['type']` — completeness is enforced the same way as
 * {@link FieldComponentMap}. Each slot resolves to the cell component for rendering
 * field values in the data table list view.
 *
 * @see {@link FieldComponentMap} for the edit form input equivalent
 */
export type CellComponentMap<F extends ComponentHKT> = {
  [K in AdminField["type"]]: ApplyComponent<
    F,
    CellComponentProps<Extract<AdminField, { type: K }>>
  >;
};

/**
 * Input type for `defineFrameworkAdapter()`.
 *
 * Framework packages pass this to register their component implementations.
 * TypeScript enforces that every field type in the `AdminField` union has both
 * an input component (`fields`) and a cell component (`cells`), and that each
 * component accepts the correct props for its field type.
 *
 * **What the HKT does:**
 * The `F` parameter is the framework's HKT — a type-level function that maps
 * a props type to the framework's component type. For React:
 * ```ts
 * interface ReactHKT extends ComponentHKT {
 *   component: ComponentType<this['_props']>;
 * }
 * Passing `ReactHKT` as `F` means every slot in `fields` and `cells` resolves to
 * `ComponentType<CorrectProps>`, giving the component full prop autocomplete.
 *
 * @example
 * ```ts
 * // In @vexcms/react
 * import { defineFrameworkAdapter, ComponentHKT } from '@vexcms/core';
 * import { ComponentType } from 'react';
 *
 * interface ReactHKT extends ComponentHKT {
 *   component: ComponentType<this['_props']>;
 * }
 *
 * export const reactAdapter = defineFrameworkAdapter<ReactHKT>({
 *   name: 'react',
 *   version: '0.1.0',
 *   fields: {
 *     text: TextInputComponent,  // must accept InputComponentProps<TextField>
 *   },
 *   cells: {
 *     text: TextCellComponent,   // must accept CellComponentProps<TextField>
 *   },
 * });
 *
 * @see {@link FrameworkAdapter} for the resolved type returned by `defineFrameworkAdapter`
 * @see {@link FieldComponentMap} for the field component slot types
 * @see {@link CellComponentMap} for the cell component slot types
 */
export interface FrameworkAdapterInput<F extends ComponentHKT> {
  /** Framework name used for identification (e.g. `"react"`, `"solid"`). */
  name: string;
  /** Adapter version — should match the framework package version. */
  version: string;
  /**
   * Input components for each field type, rendered in the document edit form.
   * Every type in the `AdminField` union must have a corresponding component.
   */
  fields: FieldComponentMap<F>;
  /**
   * Cell components for each field type, rendered in the data table list view.
   * Every type in the `AdminField` union must have a corresponding component.
   */
  cells: CellComponentMap<F>;
}

/**
 * Resolved framework adapter returned by `defineFrameworkAdapter()`.
 *
 * @see {@link FrameworkAdapterInput} for the user-facing input type
 * @see {@link defineFrameworkAdapter} for the function that produces this type
 */
export type FrameworkAdapter<F extends ComponentHKT> = FrameworkAdapterInput<F>;

/**
 * Registers a framework adapter, enforcing that all field and cell components are
 * implemented and typed correctly.
 *
 * This is a zero-runtime identity function — it returns the adapter unchanged.
 * All enforcement happens at the TypeScript level via the `F` HKT parameter:
 * missing components cause a type error, and each component gets autocomplete
 * for its field-specific props.
 *
 * @param adapter - The framework adapter implementation.
 * @returns The same adapter, verified by TypeScript.
 *
 * @example
 * ```ts
 * import { defineFrameworkAdapter, ComponentHKT } from '@vexcms/core';
 * import { ComponentType } from 'react';
 *
 * interface ReactHKT extends ComponentHKT {
 *   component: ComponentType<this['_props']>;
 * }
 *
 * export const reactAdapter = defineFrameworkAdapter<ReactHKT>({
 *   name: 'react',
 *   version: '0.1.0',
 *   fields: {
 *     text: MyTextInput,  // TS error if missing or wrong props
 *   },
 *   cells: {
 *     text: MyTextCell,
 *   },
 * });
 *
 * @see {@link FrameworkAdapterInput} for the full input type
 * @see {@link FrameworkAdapter} for the resolved return type
 */
export function defineFrameworkAdapter<F extends ComponentHKT>(
  adapter: FrameworkAdapterInput<F>,
): FrameworkAdapter<F> {
  return adapter;
}
````

---

## Verification

- [ ] `pnpm --filter @vexcms/core build` — passes with no type errors
- [ ] `pnpm --filter @vexcms/core test` — all tests pass
- [ ] In the React package, `defineFrameworkAdapter<ReactHKT>({ fields: { text: MyTextInput } })`
      gives autocomplete for `name`, `fieldDef`, `readOnly` inside `MyTextInput`
- [ ] Omitting `fields.text` produces: `Property 'text' is missing in type ...`

## Success Criteria

- [ ] `FieldComponentMap`, `CellComponentMap`, `FrameworkAdapterInput`, `FrameworkAdapter` are
      all exported from `framework.ts`
- [ ] `defineFrameworkAdapter` signature accepts `F extends ComponentHKT` and enforces both maps
- [ ] Adding a new field type to `AdminField` union automatically causes a type error at any
      `defineFrameworkAdapter` call site that hasn't added the new component slot
- [ ] All existing exports from `src/index.ts` that reference `framework.ts` still compile
