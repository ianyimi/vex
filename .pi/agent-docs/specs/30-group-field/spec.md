# Spec 30 — Group Field

**Status:** Draft (not started)
**Depends on:** Spec 20 (field type pattern), Spec 28 (array field, establishes `FormArray` precedent)

---

## Overview

Implements the `group()` field type end-to-end: a named set of sub-fields stored as a nested Convex `v.object({...})`. The group field renders in the admin form as a collapsible fieldset — a labelled header with a toggle and the sub-fields inside. It follows the exact same layer sequence as the `array()` field (types → config → validator → inputSchema → core wiring → React component → adapter wiring → www). Sub-fields within a group respect their own `required` setting individually; the Convex validator is fully typed per sub-field. TanStack Form handles the nested values via dot-notation paths (`"address.street"`), requiring no special form mode.

---

## Code Effect Preview

### 1. New `group()` config function — user-facing API

```ts
// apps/www/src/vexcms/collections/pages.ts
+import { group, text, number } from "@vexcms/core"
+
+const pages = defineCollection({
+  fields: {
+    seo: group({
+      label: "SEO",
+      fields: {
+        title:       text({ required: true }),
+        description: text(),
+        ogImage:     url(),
+      },
+    }),
+  },
+})
```

### 2. Convex schema output — sub-fields respect their own `required`

```ts
// convex/vex.schema.ts (auto-generated)
-  seo: v.optional(v.string()),           // before: flat text hack
+  seo: v.optional(v.object({             // after: real nested object
+    title: v.string(),
+    description: v.optional(v.string()),
+    ogImage: v.optional(v.string()),
+  })),
```

### 3. `AdminField` union — one new variant

```ts
// packages/core/src/fields/types.ts
  export type AdminField<TFieldMeta extends {} = {}> =
    | TextField<TFieldMeta>
    | NumberField<TFieldMeta>
    // ... existing variants ...
    | ArrayField<ArrayType, TFieldMeta>
+   | GroupField<TFieldMeta>
    | RelationshipField<TFieldMeta>;
```

### 4. `ADMIN_FIELDS` constants — new entry

```ts
// packages/core/src/fields/constants.ts
+  group: {
+    type:          "group",
+    interfaceType: "object",   // placeholder; real type computed dynamically in group()
+    validator:     "v.object({})", // placeholder; real validator built per-field
+    defaultValue:  {} as Record<string, unknown>,
+  },
```

### 5. TanStack Form dot-notation path inside `FormGroup`

```tsx
// packages/react/src/components/form/FormGroup.tsx (excerpt)
  {Object.entries(fieldDef.fields).map(([fieldKey, subFieldDef]) => {
    const SubInput = fieldToInputComponent(subFieldDef.type);
    if (!SubInput) return null;
    return (
+     // TanStack Form resolves "seo.title" → form.values.seo.title
+     // No special mode needed — dot-notation is native to TanStack Form v1
      <SubInput
        key={fieldKey}
+       name={`${name}.${fieldKey}`}
        fieldDef={subFieldDef}
        readOnly={readOnly}
      />
    );
  })}
```

---

## API Surface

| Export                        | Package         | Kind      | Description                                                          |
| ----------------------------- | --------------- | --------- | -------------------------------------------------------------------- |
| `group(options)`              | `@vexcms/core`  | function  | Config factory — returns resolved `GroupField`                       |
| `GroupFieldInput`             | `@vexcms/core`  | interface | User-facing config input type                                        |
| `GroupField`                  | `@vexcms/core`  | interface | Resolved field type (after defaults)                                 |
| `groupFieldToValidator`       | `@vexcms/core`  | function  | Convex validator string builder                                      |
| `groupFieldToInputSchema`     | `@vexcms/core`  | function  | Zod schema builder for admin form                                    |
| `GroupFieldInput` (component) | `@vexcms/react` | component | Admin form input — collapsible fieldset                              |
| `GroupFieldCell`              | `@vexcms/react` | component | Admin list-table cell                                                |
| `FormGroup`                   | `@vexcms/react` | component | Collapsible sub-field renderer — internal; exported for custom forms |
| `group` (re-export)           | `@vexcms/react` | function  | Pass-through re-export of core `group()`                             |

---

## Status / Progress

- [ ] ⏳ Step 1 — Core types + config + constants
- [ ] ⏳ Step 2 — Core validator + input schema
- [ ] ⏳ Step 3 — Core wiring (union, barrels, dispatch)
- [ ] ⏳ Step 4 — `FormGroup` React component
- [ ] ⏳ Step 5 — `GroupFieldInput`, `GroupFieldCell`, `groupFieldToColumnDef`
- [ ] ⏳ Step 6 — React adapter + index wiring
- [ ] ⏳ Step 7 — `apps/www` test collection + browser verify

---

## Design Decisions

Full rationale in `design-walkthrough.md` § _Decisions Reference_.

| #   | Decision (one line)                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Named `group` not `object` — avoids JS global conflict; mirrors Payload CMS convention.                                                                |
| D2  | Sub-fields respect their own `required` individually — Convex `v.object()` supports optional sub-keys unlike `v.array()`.                              |
| D3  | `interfaceType` computed dynamically in `group()` from sub-fields — yields `"{ title: string; description?: string }"` in generated types.             |
| D4  | TanStack Form dot-notation (`"seo.title"`) — no array mode, no special form wiring; v1 resolves nested paths natively.                                 |
| D5  | `FormGroup` uses the existing `<Accordion>` UI primitive (Base UI) — single item, trigger shows label + sub-field count, content shows all sub-fields. |
| D6  | Column cell shows a compact object summary badge, e.g. `{ 3 keys }`, not a raw JSON dump.                                                              |
| D7  | `defaultValue` is `{}` — the Zod schema's per-subfield `.default()` handles sub-field initialization.                                                  |
| D8  | No component slots on `group()` — no HKT binding needed; plain re-export from `@vexcms/react`.                                                         |
| D9  | `group()` does not support `min`/`max` — that concept belongs to `array()`.                                                                            |
| D10 | Nested groups supported — `FormGroup` recurses via `fieldToInputComponent`; `index` prop disambiguates when rendered inside `array()`.                 |

---

## Out of Scope

- **Blocks field** — block-picker UI, `defineBlock()`, recursive block constraint — deferred to a follow-up spec.
- **`array({ items: group({...}) })`** — combination works at the config and validator level once this spec lands; array-of-objects UI rendering in `FormArray` may need adjustment separately.
- **Group-level validation** — min/max sub-field count, custom `validate()` callbacks on the group; add as a follow-up if needed.
- **Component slot on group** — `admin.components.header` or similar; deferred until a clear use-case arises.

---

## Target Directory Structure

```
packages/core/src/fields/group/
  types.ts          ⏳ NEW — GroupFieldInput, GroupField
  config.ts         ⏳ NEW — group() factory
  validator.ts      ⏳ NEW — groupFieldToValidator()
  validator.test.ts ⏳ NEW
  inputSchema.ts    ⏳ NEW — groupFieldToInputSchema()
  inputSchema.test.ts ⏳ NEW
  index.ts          ⏳ NEW — barrel

packages/core/src/fields/
  constants.ts      ⏳ MODIFY — add group entry
  types.ts          ⏳ MODIFY — add GroupField to AdminField union
  index.ts          ⏳ MODIFY — add export * from "./group"

packages/core/src/fields/validators/
  index.ts          ⏳ MODIFY — add group case

packages/core/src/fields/inputSchemas/
  index.ts          ⏳ MODIFY — add group case

packages/react/src/components/form/
  FormGroup.tsx     ⏳ NEW — collapsible sub-field renderer
  index.ts          ⏳ MODIFY — export FormGroup

packages/react/src/components/fields/group/
  Input.tsx         ⏳ NEW — GroupFieldInput
  Cell.tsx          ⏳ NEW — GroupFieldCell
  columnDef.tsx     ⏳ NEW — groupFieldToColumnDef()
  index.ts          ⏳ NEW — barrel

packages/react/src/
  adapter.ts        ⏳ MODIFY — add group to FieldComponentMap
  index.ts          ⏳ MODIFY — export group, GroupFieldInput, GroupFieldCell

packages/react/src/components/fields/
  index.tsx         ⏳ MODIFY — import + register GroupFieldInput, GroupFieldCell, groupFieldToColumnDef
```

---

## Implementation Order

### Step 1 — Core types, config, constants [dev]

Establishes the `GroupField` shape, `group()` factory with all defaults, and the `ADMIN_FIELDS.group` constant. **`interfaceType` is computed dynamically** from the sub-fields to produce real TypeScript object type strings in `generateVexTypes`.

#### Files to create / modify

- [ ] `packages/core/src/fields/group/types.ts` (NEW)
- [ ] `packages/core/src/fields/group/config.ts` (NEW)
- [ ] `packages/core/src/fields/constants.ts` (MODIFY — add group entry)

---

### `packages/core/src/fields/group/types.ts` (NEW)

````ts
import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput, FieldAdminConfig } from "../baseTypes";
import { AdminField } from "../types";

/**
 * Configuration input for a `group()` field.
 *
 * Group fields store a named set of sub-fields as a single nested object.
 * All properties except `fields` are optional; unset properties fall back
 * to the defaults applied by `group()`.
 *
 * **Defaults applied by `group()`:**
 * ```ts
 * {
 *   type:        "group",
 *   label:       "",      // inferred from the field key by defineCollection
 *   required:    false,
 *   defaultOpen: true,
 *   defaultValue: {},
 *   admin: {
 *     hidden:        false,
 *     readOnly:      false,
 *     position:      "main",
 *     width:         "full",
 *     cellAlignment: "left",
 *   }
 * }
 *
 * @example
 * ```ts
 * seo: group({
 *   label: "SEO",
 *   fields: {
 *     title:       text({ required: true }),
 *     description: text(),
 *   },
 *   defaultOpen: false,  // accordion starts collapsed
 * })
 *
 * @see {@link GroupField} for the resolved output type
 * @see {@link group} for the config function that produces this type
 */
export interface GroupFieldInput<
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TFieldMeta> {
  /**
   * Sub-fields that form the object's shape.
   *
   * Accepts any `AdminField` value, including nested `group()` or `array()`.
   * Each sub-field uses its own `required` setting for both Zod validation
   * and Convex schema generation.
   */
  fields: Record<string, AdminField>;
  /** Pre-filled value shown when creating a new document. Defaults to `{}`. */
  defaultValue?: Record<string, unknown>;
  /**
   * Whether the accordion fieldset starts open in the admin form.
   *
   * Defaults to `true`. Set `false` for secondary or rarely-edited groups
   * (e.g. SEO metadata on a page) to reduce visual noise on load.
   */
  defaultOpen?: boolean;
}

/**
 * Resolved configuration for a `group()` field, after all defaults are applied.
 *
 * This is the type field input components and validator functions receive.
 * `interfaceType` is a computed TypeScript object-type string built from the
 * sub-fields (e.g. `"{ title: string; description?: string }"`), used by
 * `generateVexTypes` to emit accurately-typed document interfaces.
 *
 * @see {@link GroupFieldInput} for the user-facing input type
 * @see {@link group} for the config function that produces this type
 */
export interface GroupField<
  TFieldMeta extends {} = {},
> extends BaseField<TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.group.type;
  /** Display label shown in the admin form. Always set — inferred from field key if not provided. */
  label: string;
  /** Whether this field is required in the database schema. */
  required: boolean;
  /** Resolved admin UI configuration with all defaults applied. */
  admin: FieldAdminConfig;
  /**
   * Sub-fields that form the object's shape.
   *
   * Each sub-field retains its own `required`, `label`, and admin settings.
   * Convex and Zod validators are generated per-field respecting those settings.
   */
  fields: Record<string, AdminField>;
  /**
   * Computed TypeScript object-type string for `generateVexTypes`.
   *
   * Built from sub-fields in `group()` — e.g. `"{ title: string; description?: string }"`.
   * Automatically reflects nested groups or arrays within the sub-fields.
   */
  interfaceType: string;
  /** Pre-filled value shown when creating a new document. */
  defaultValue: Record<string, unknown>;
  /**
   * Whether the accordion fieldset starts open in the admin form.
   *
   * Resolved value after defaults — always `true` unless explicitly set `false`.
   */
  defaultOpen: boolean;
}
````

---

### `packages/core/src/fields/group/config.ts` (NEW)

````ts
import { ADMIN_FIELDS } from "../constants";
import type { GroupFieldInput, GroupField } from "./types";

/**
 * Creates a group field with all defaults applied.
 *
 * Group fields store a named set of sub-fields as a single nested Convex
 * `v.object({...})`. Each sub-field respects its own `required` setting —
 * required sub-fields emit bare validators (e.g. `v.string()`); optional
 * ones emit `v.optional(v.string())`.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `defaultValue` — `{}`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"full"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - Group field configuration. `fields` is required; all other
 *   properties are optional.
 * @returns Resolved group field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { group, text, url } from "@vexcms/core"
 *
 * posts: defineCollection({
 *   fields: {
 *     seo: group({
 *       label: "SEO",
 *       fields: {
 *         title:       text({ required: true }),
 *         description: text(),
 *         ogImage:     url(),
 *       },
 *     }),
 *   },
 * })
 * ```
 *
 * @see {@link GroupFieldInput} for the full input type
 * @see {@link GroupField} for the resolved output type
 */
export function group<TFieldMeta extends {} = {}>(
  options: GroupFieldInput<TFieldMeta>,
): GroupField<TFieldMeta> {
  // Compute the TypeScript interface type string from sub-fields so that
  // generateVexTypes emits accurate per-field types rather than `object`.
  const computedInterfaceType = buildInterfaceType(options.fields);

  return {
    type: ADMIN_FIELDS.group.type,
    interfaceType: computedInterfaceType,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: {},
    defaultOpen: true,
    ...options,

    // Admin config with all defaults applied
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      placeholder: "",
      ...options?.admin,
    },
  };
}

/**
 * Builds a TypeScript object-type string from a record of sub-fields.
 *
 * Used by `group()` to compute `GroupField.interfaceType`.
 *
 * @param fields - The sub-field record from the group config.
 * @returns A TypeScript type string, e.g. `"{ title: string; description?: string }"`.
 */
function buildInterfaceType(fields: GroupFieldInput["fields"]): string {
  const entries = Object.entries(fields)
    .map(
      ([key, field]) =>
        `${key}${field.required ? "" : "?"}: ${field.interfaceType}`,
    )
    .join("; ");
  return `{ ${entries} }`;
}
````

---

### `packages/core/src/fields/constants.ts` (MODIFY)

```ts
  // existing entries ...
+  group: {
+    type:          "group",
+    interfaceType: "object",   // placeholder — group() overrides per-instance
+    validator:     "v.object({})", // placeholder — groupFieldToValidator builds dynamically
+    defaultValue:  {} as Record<string, unknown>,
+  },
```

#### Run typecheck

```bash
pnpm --filter @vexcms/core typecheck
```

---

### Step 2 — Core validator + input schema [dev]

Generates the Convex validator string and Zod schema. Both delegate to the existing per-field dispatch functions, so nested groups and arrays work for free.

#### Files to create

- [ ] `packages/core/src/fields/group/validator.ts` (NEW)
- [ ] `packages/core/src/fields/group/validator.test.ts` (NEW)
- [ ] `packages/core/src/fields/group/inputSchema.ts` (NEW)
- [ ] `packages/core/src/fields/group/inputSchema.test.ts` (NEW)
- [ ] `packages/core/src/fields/group/index.ts` (NEW)

---

### `packages/core/src/fields/group/validator.ts` (NEW)

````ts
import { ADMIN_FIELDS } from "../constants";
import { adminFieldToValidator } from "../validators";
import { applyBaseValidators } from "../validators/utils";
import type { GroupField } from "./types";

/**
 * Converts a group field definition to a Convex schema validator string.
 *
 * Generates `v.object({ key: validator, ... })` where each sub-field's
 * validator is built by the existing `adminFieldToValidator` dispatch.
 * Sub-fields respect their own `required` setting — required sub-fields
 * emit bare validators; optional ones emit `v.optional(...)`.
 *
 * The outer object is wrapped in `v.optional(...)` when `field.required`
 * is `false`.
 *
 * @param props - Input props.
 * @param props.field - The resolved group field definition.
 * @returns A Convex validator string.
 *
 * @example
 * ```ts
 * const field = group({
 *   fields: { title: text({ required: true }), body: text() },
 * })
 * groupFieldToValidator({ field })
 * // → 'v.optional(v.object({ title: v.string(), body: v.optional(v.string()) }))'
 * ```
 *
 * @example
 * ```ts
 * const field = group({
 *   required: true,
 *   fields: { score: number({ required: true }) },
 * })
 * groupFieldToValidator({ field })
 * // → 'v.object({ score: v.number() })'
 * ```
 *
 * @internal — Used by CLI schema generation via `adminFieldToValidator`.
 */
export function groupFieldToValidator<TFieldMeta extends {} = {}>(props: {
  field: GroupField<TFieldMeta>;
}): string {
  const { field } = props;

  const subValidators = Object.entries(field.fields)
    .map(
      ([key, subField]) =>
        `${key}: ${adminFieldToValidator({ field: subField })}`,
    )
    .join(", ");

  return applyBaseValidators({
    field,
    validator: `v.object({ ${subValidators} })`,
  });
}
````

---

### `packages/core/src/fields/group/validator.test.ts` (NEW)

```ts
import { describe, it, expect } from "vitest";
import { group } from "./config";
import { text } from "../text";
import { number } from "../number";
import { groupFieldToValidator } from "./validator";

describe("groupFieldToValidator", () => {
  it("generates optional wrapper for non-required group", () => {
    const field = group({
      fields: {
        title: text({ required: true }),
        body: text(),
      },
    });
    expect(groupFieldToValidator({ field })).toBe(
      "v.optional(v.object({ title: v.string(), body: v.optional(v.string()) }))",
    );
  });

  it("omits optional wrapper for required group", () => {
    const field = group({
      required: true,
      fields: { score: number({ required: true }) },
    });
    expect(groupFieldToValidator({ field })).toBe(
      "v.object({ score: v.number() })",
    );
  });

  it("handles all-optional sub-fields", () => {
    const field = group({ fields: { a: text(), b: number() } });
    expect(groupFieldToValidator({ field })).toBe(
      "v.optional(v.object({ a: v.optional(v.string()), b: v.optional(v.number()) }))",
    );
  });

  it("supports nested group (group within group)", () => {
    const inner = group({
      required: true,
      fields: { zip: text({ required: true }) },
    });
    const outer = group({ fields: { address: inner } });
    expect(groupFieldToValidator({ field: outer })).toBe(
      "v.optional(v.object({ address: v.object({ zip: v.string() }) }))",
    );
  });
});
```

---

### `packages/core/src/fields/group/inputSchema.ts` (NEW)

````ts
import { z } from "zod";
import { adminFieldToInputSchema } from "../inputSchemas";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import type { GroupField } from "./types";

/**
 * Builds a Zod schema for validating a group field value in the admin form.
 *
 * Constructs a `z.object({...})` where each key maps to the sub-field's own
 * Zod schema via `adminFieldToInputSchema`. Sub-field defaults and optionality
 * are handled recursively. The outer object receives `.optional()` when
 * `field.required` is `false` via `applyBaseInputSchemaMeta`.
 *
 * @param props - Input props.
 * @param props.field - The resolved group field definition.
 * @returns A Zod object schema with a `.default({})` and optionality applied.
 *
 * @example
 * ```ts
 * const field = group({ fields: { title: text({ required: true }), body: text() } })
 * groupFieldToInputSchema({ field })
 * // → z.object({ title: z.string(), body: z.string().optional() }).optional().default({})
 * ```
 *
 * @internal — Used by admin form schema construction via `adminFieldToInputSchema`.
 */
export function groupFieldToInputSchema<TFieldMeta extends {} = {}>(props: {
  field: GroupField<TFieldMeta>;
}) {
  const { field } = props;

  const subSchemas = Object.fromEntries(
    Object.entries(field.fields).map(([key, subField]) => [
      key,
      adminFieldToInputSchema({ field: subField }),
    ]),
  );

  const schema = z.object(subSchemas).default(field.defaultValue ?? {});

  return applyBaseInputSchemaMeta({ field, inputSchema: schema });
}
````

---

### `packages/core/src/fields/group/inputSchema.test.ts` (NEW)

```ts
import { describe, it, expect } from "vitest";
import { group } from "./config";
import { text } from "../text";
import { number } from "../number";
import { groupFieldToInputSchema } from "./inputSchema";

describe("groupFieldToInputSchema", () => {
  it("parses a valid object with required sub-field", () => {
    const field = group({
      fields: { title: text({ required: true }), body: text() },
    });
    const schema = groupFieldToInputSchema({ field });
    const result = schema.safeParse({ title: "Hello", body: "World" });
    expect(result.success).toBe(true);
  });

  it("fails when required sub-field is missing", () => {
    const field = group({
      fields: { title: text({ required: true }) },
    });
    const schema = groupFieldToInputSchema({ field });
    const result = schema.safeParse({ title: undefined });
    expect(result.success).toBe(false);
  });

  it("fills missing optional sub-fields with their defaults", () => {
    const field = group({ fields: { score: number() } });
    const schema = groupFieldToInputSchema({ field });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
  });

  it("defaults to {} when field is optional and value is undefined", () => {
    const field = group({ fields: { note: text() } });
    const schema = groupFieldToInputSchema({ field });
    const result = schema.parse(undefined);
    expect(result).toBeDefined();
  });
});
```

---

### `packages/core/src/fields/group/index.ts` (NEW)

```ts
export * from "./types";
export * from "./config";
export * from "./validator";
export * from "./inputSchema";
```

#### Run tests

```bash
pnpm --filter @vexcms/core test
```

---

### Step 3 — Core wiring: union, barrels, dispatch [agent]

Registers `GroupField` in the `AdminField` union and all dispatch switches. Once these changes land, `pnpm typecheck` requires the adapter to have a `group` entry — enforced by `FieldComponentMap<F>`.

#### Files to modify

- [ ] `packages/core/src/fields/types.ts` — add `GroupField` to `AdminField` union
- [ ] `packages/core/src/fields/index.ts` — add `export * from "./group"`
- [ ] `packages/core/src/fields/validators/index.ts` — add group case
- [ ] `packages/core/src/fields/inputSchemas/index.ts` — add group case

---

### `packages/core/src/fields/types.ts` (MODIFY)

```ts
+import { GroupField } from "./group";

  export type AdminField<TFieldMeta extends {} = {}> =
    | TextField<TFieldMeta>
    | NumberField<TFieldMeta>
    | CheckboxField<TFieldMeta>
    | DateField<TFieldMeta>
    | SelectField<TFieldMeta>
    | UrlField<TFieldMeta>
    | ArrayField<ArrayType, TFieldMeta>
+   | GroupField<TFieldMeta>
    | RelationshipField<TFieldMeta>;
```

### `packages/core/src/fields/index.ts` (MODIFY)

```ts
+export * from "./group";
```

### `packages/core/src/fields/validators/index.ts` (MODIFY)

```ts
+import { groupFieldToValidator } from "../group";

  export function adminFieldToValidator<TFieldMeta extends {} = {}>(props: {
    field: AdminField<TFieldMeta>;
    required?: boolean;
  }) {
    switch (props.field.type) {
      // ... existing cases ...
+     case ADMIN_FIELDS.group.type:
+       return groupFieldToValidator({ field: props.field });
      default:
        throw new Error("unrecognized field type");
    }
  }
```

### `packages/core/src/fields/inputSchemas/index.ts` (MODIFY)

```ts
+import { groupFieldToInputSchema } from "../group";

  export function adminFieldToInputSchema(props: { field: AdminField }) {
    switch (props.field.type) {
      // ... existing cases ...
+     case ADMIN_FIELDS.group.type:
+       return groupFieldToInputSchema({ field: props.field });
      default:
        throw new Error("unrecognized field type");
    }
  }
```

#### Run typecheck (adapter error expected until Step 6)

```bash
pnpm --filter @vexcms/core typecheck
```

---

### Step 4 — `FormGroup` React component [dev]

Renders the collapsible fieldset. Uses `AppFormContext` to access the form (same pattern as `FormArray`). Uses the existing `<Accordion>` UI primitive (Base UI, no new dep). The accordion item value includes `index` when provided so multiple instances inside an `array()` field work independently. `fieldDef.defaultOpen` drives the initial open/closed state.

#### Files to create / modify

- [ ] `packages/react/src/components/form/FormGroup.tsx` (NEW)
- [ ] `packages/react/src/components/form/index.ts` (MODIFY — export `FormGroup`, `FormGroupProps`)

---

### `packages/react/src/components/form/FormGroup.tsx` (NEW)

````tsx
"use client";

import type { GroupField } from "@vexcms/core";
import { useContext } from "react";
import { AppFormContext } from "./AppFormContext";
import { fieldToInputComponent } from "../fields";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../ui/accordion";
import { cn } from "../../styles/utils";

/**
 * Props for the `FormGroup` component.
 *
 * @see {@link FormGroup}
 */
export interface FormGroupProps {
  /**
   * The field key name from the collection config, e.g. `"seo"`.
   *
   * Used to build sub-field paths: `"seo.title"`, `"seo.description"`, etc.
   * TanStack Form resolves dot-notation paths natively in v1.
   */
  name: string;
  /**
   * Optional index when the group is rendered inside an array field
   * (e.g. `array({ items: group({...}) })`). Appended to the accordion item
   * value — `"${name}-${index}"` — so multiple group instances can be
   * independently open/closed without conflicting.
   */
  index?: number;
  /** The resolved group field definition. */
  fieldDef: GroupField;
  /** Whether all controls are read-only. Propagated to every sub-field. */
  readOnly: boolean;
  /**
   * Number of times the parent form has been submitted.
   *
   * Passed through to sub-field inputs so validation errors appear after
   * submit even if a sub-field was never touched.
   */
  submissionAttempts: number;
  /** Additional class names for the outer Accordion container. */
  className?: string;
}

/**
 * Renders a group field as a single-item Accordion in the admin edit form.
 *
 * Maps over `fieldDef.fields` and renders each sub-field using the registered
 * input component from `fieldToInputComponent`. Sub-field names use TanStack
 * Form dot-notation — `"${name}.${fieldKey}"` (e.g. `"seo.title"`) — which
 * Form v1 resolves to nested object values without any special mode.
 *
 * The accordion trigger shows the group label and sub-field count. All
 * sub-fields render inside the single accordion content panel. The initial
 * open/closed state is driven by `fieldDef.defaultOpen` (defaults `true`).
 * `readOnly` is propagated to all sub-fields.
 *
 * When rendered inside an `array()` field, pass `index` to disambiguate
 * the accordion item value so each array item's group can open/close
 * independently.
 *
 * @throws {Error} When rendered outside `<AppForm>` and no form context is
 *   available (same constraint as `FormArray`).
 *
 * @example
 * ```tsx
 * <FormGroup
 *   name="seo"
 *   fieldDef={seoFieldDef}
 *   readOnly={false}
 *   submissionAttempts={0}
 * />
 */
export function FormGroup({
  name,
  index,
  fieldDef,
  readOnly,
  submissionAttempts,
  className,
}: FormGroupProps) {
  const form = useContext(AppFormContext);

  if (!form) {
    throw new Error(
      `FormGroup "${name}" must be rendered inside <AppForm> or have a form context available.`,
    );
  }

  const subFields = Object.entries(fieldDef.fields);
  const subFieldCount = subFields.length;

  // Unique accordion item value — disambiguates multiple instances when
  // this group is rendered inside an array (items at index 0, 1, 2...)
  const itemValue = index !== undefined ? `${name}-${index}` : name;

  return (
    <Accordion
      className={cn("rounded-sm border border-border", className)}
      defaultValue={fieldDef.defaultOpen !== false ? [itemValue] : []}
    >
      <AccordionItem value={itemValue} className="border-none">
        {/* Trigger — label + sub-field count */}
        <AccordionTrigger className="px-3 py-2 text-sm font-medium hover:no-underline">
          <span className="flex items-center gap-2">
            <span>{fieldDef.label || name}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {subFieldCount} {subFieldCount === 1 ? "field" : "fields"}
            </span>
          </span>
        </AccordionTrigger>

        {/* Content — all sub-fields */}
        <AccordionContent>
          <div className="flex flex-col gap-4 px-3 pb-4">
            {subFields.map(([fieldKey, subFieldDef]) => {
              const SubInput = fieldToInputComponent(subFieldDef.type);
              if (!SubInput) return null;
              return (
                // Dot-notation: "seo.title" → form resolves to form.values.seo.title
                <SubInput
                  key={fieldKey}
                  name={`${name}.${fieldKey}`}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  fieldDef={subFieldDef as any}
                  readOnly={readOnly || subFieldDef.admin.readOnly}
                />
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
````

---

### `packages/react/src/components/form/index.ts` (MODIFY)

```ts
+export * from "./FormGroup";
```

---

### Step 5 — `GroupFieldInput`, `GroupFieldCell`, `groupFieldToColumnDef` [dev]

The input wraps `FormGroup` using `createFieldInput` (value mode — no special array mode). The cell shows a compact summary. The column def wires both to the table.

#### Files to create

- [ ] `packages/react/src/components/fields/group/Input.tsx` (NEW)
- [ ] `packages/react/src/components/fields/group/Cell.tsx` (NEW)
- [ ] `packages/react/src/components/fields/group/columnDef.tsx` (NEW)
- [ ] `packages/react/src/components/fields/group/index.ts` (NEW)

---

### `packages/react/src/components/fields/group/Input.tsx` (NEW)

````tsx
"use client";

import type { GroupField } from "@vexcms/core";
import {
  createFieldInput,
  FormDescription,
  FormError,
  FormGroup,
} from "../../form";

/**
 * Group field input component for the admin edit form.
 *
 * Built with `createFieldInput` (default value mode). Renders a single-item
 * Accordion via `FormGroup`, where each sub-field uses its full dot-notation
 * TanStack Form path (`"${name}.${fieldKey}"`). Initial open/closed state
 * is driven by `fieldDef.defaultOpen`.
 *
 * The accordion trigger serves as the visual label for the group — no
 * separate `<FormLabel>` is rendered above it.
 *
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<Record<string, unknown>>`) from a `<form.Field>` render prop.
 *
 * @example
 * ```tsx
 * // Inside CollectionEditView — AppForm provides context
 * <AppForm form={form}>
 *   <GroupFieldInput name="seo" fieldDef={seoField} readOnly={false} />
 * </AppForm>
 *
 * // Inside an array of groups — pass index to disambiguate accordion state
 * <form.Field name="contacts[0]">
 *   {(field) => (
 *     <GroupFieldInput
 *       name="contacts[0]"
 *       fieldDef={contactField}
 *       readOnly={false}
 *       field={field}
 *       index={0}
 *     />
 *   )}
 * </form.Field>
 */
export const GroupFieldInput = createFieldInput<
  Record<string, unknown>,
  GroupField
>(({ name, fieldDef, field, submissionAttempts, index }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Accordion trigger handles the label — no separate FormLabel */}
      <FormGroup
        name={name}
        index={index}
        fieldDef={fieldDef}
        readOnly={fieldDef.admin.readOnly}
        submissionAttempts={submissionAttempts}
      />
      <FormDescription field={fieldDef} />
      <FormError field={field} submissionAttempts={submissionAttempts} />
    </div>
  );
});
````

---

### `packages/react/src/components/fields/group/Cell.tsx` (NEW)

````tsx
"use client";

import type { CellComponentProps, GroupField } from "@vexcms/core";

/**
 * Group field cell component for the admin list-table view.
 *
 * Shows a compact summary badge indicating how many sub-field values are
 * present (e.g. `{ 3 keys }`). Renders `—` when the value is absent.
 *
 * A full inline object preview is intentionally out of scope here — the list
 * view is not the right place for nested object data.
 *
 * @example
 * ```tsx
 * <GroupFieldCell value={{ title: "Hello", body: "World" }} ... />
 * // → renders "{ 2 keys }"
 * ```
 */
export function GroupFieldCell(props: CellComponentProps<GroupField>) {
  const value = props.value as Record<string, unknown> | null | undefined;

  if (value == null || typeof value !== "object") {
    return <span className="text-muted-foreground">—</span>;
  }

  const count = Object.keys(value).length;

  return (
    <span className="text-xs text-muted-foreground font-mono">
      {`{ ${count} ${count === 1 ? "key" : "keys"} }`}
    </span>
  );
}
````

---

### `packages/react/src/components/fields/group/columnDef.tsx` (NEW)

```tsx
import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, GroupField, TDocument } from "@vexcms/core";
import { GroupFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a group field.
 *
 * Sorting is disabled — group fields store objects, which are not meaningfully
 * sortable by Convex indexes in the current implementation.
 *
 * @param props - Column generation props.
 * @param props.fieldDef - Resolved group field definition.
 * @param props.fieldKey - Field key from `collection.fields`.
 * @param props.isTitleField - Whether this is the collection's `useAsTitle` field.
 * @param props.collection - Parent collection config.
 * @returns TanStack Table column definition.
 */
export function groupFieldToColumnDef(props: {
  fieldDef: GroupField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TDocument, unknown> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as
        | Record<string, unknown>
        | undefined;
      return (
        <GroupFieldCell
          value={value ?? null}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },

    // Group fields are not meaningfully sortable by index
    enableSorting: false,
    enableHiding: true,

    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
```

---

### `packages/react/src/components/fields/group/index.ts` (NEW)

```ts
export * from "./Input";
export * from "./Cell";
export * from "./columnDef";
```

---

### Step 6 — React adapter + index wiring [agent]

Registers `GroupFieldInput` and `GroupFieldCell` in all maps. The `adapter.ts` type-error from Step 3 resolves here.

#### Files to modify

- [ ] `packages/react/src/components/fields/index.tsx` — import + register in all maps + switch
- [ ] `packages/react/src/adapter.ts` — add `group` entry
- [ ] `packages/react/src/index.ts` — export `group`, `GroupFieldInput`, `GroupFieldCell`

---

### `packages/react/src/components/fields/index.tsx` (MODIFY)

```ts
+import { GroupFieldInput, GroupFieldCell, groupFieldToColumnDef } from "./group";

+export * from "./group";

  // fieldInputComponents
+  [ADMIN_FIELDS.group.type]: GroupFieldInput as ComponentType<InputComponentProps<AdminField>>,

  // fieldCellComponents
+  [ADMIN_FIELDS.group.type]: GroupFieldCell as ComponentType<CellComponentProps<AdminField>>,

  // getCollectionColumnDefs switch
+  case ADMIN_FIELDS.group.type:
+    columnDefs.push(
+      groupFieldToColumnDef({ fieldDef, fieldKey, isTitleField, collection }),
+    );
+    break;
```

### `packages/react/src/adapter.ts` (MODIFY)

```ts
+import { GroupFieldInput, GroupFieldCell } from "./components/fields/group";

  // inside defineFrameworkAdapter fields:
+  [ADMIN_FIELDS.group.type]: {
+    input: GroupFieldInput,
+    cell:  GroupFieldCell,
+  },
```

### `packages/react/src/index.ts` (MODIFY)

```ts
  // Pass-through re-export — no HKT binding needed (no component slots)
+ export { group } from "@vexcms/core";

+ export { GroupFieldInput, GroupFieldCell } from "./components/fields";
```

#### Run typecheck

```bash
pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/react typecheck
```

---

### Step 7 — `apps/www` test + browser verify [dev]

Add a `group` field to the `pages` collection so it appears in the admin edit form and generates a correct Convex schema entry.

#### Files to modify

- [ ] `apps/www/src/vexcms/collections/pages.ts` — add `seo` group field

```ts
+import { group, text, url } from "@vexcms/core"

  export const pages = defineCollection({
    // ... existing fields ...
+   seo: group({
+     label: "SEO",
+     fields: {
+       metaTitle:       text({ label: "Meta Title" }),
+       metaDescription: text({ label: "Meta Description" }),
+       ogImage:         url({ label: "OG Image" }),
+     },
+   }),
  })
```

After `vex dev` regenerates the schema, verify:

- `convex/vex.schema.ts` contains `seo: v.optional(v.object({ ... }))`
- The admin form at `http://localhost:3020/admin/pages/[id]` shows the collapsible SEO group
- Saving a document with SEO values populated persists the nested object to Convex

---

## Verification

```bash
# Core types and tests
pnpm --filter @vexcms/core typecheck
pnpm --filter @vexcms/core test

# React types
pnpm --filter @vexcms/react typecheck

# Full workspace
pnpm typecheck
pnpm test

# Schema check — after vex dev regenerates
grep "seo" apps/www/convex/vex.schema.ts
# Expected: seo: v.optional(v.object({ metaTitle: v.optional(v.string()), ... }))
```

---

## Success Criteria

1. `pnpm --filter @vexcms/core test` passes all new validator and inputSchema tests.
2. `pnpm typecheck` is clean — no type errors across the workspace.
3. `adapter.ts` has no missing-key type error for `ADMIN_FIELDS.group.type`.
4. `convex/vex.schema.ts` emits valid `v.object({...})` for the test `seo` field.
5. Admin form at `/admin/pages/[id]` shows the SEO fieldset collapsible — opens and closes on click.
6. Saving a page with SEO values populated round-trips correctly: the Convex document stores `seo: { metaTitle: "...", ... }`.
7. `generateVexTypes` emits an accurate object-type string: `seo?: { metaTitle?: string; metaDescription?: string; ogImage?: string }` in the generated document interface.

---

## References

- `packages/core/src/fields/array/` — canonical field type implementation to mirror
- `packages/react/src/components/form/FormArray.tsx` — `FormGroup` follows the same context/dispatch pattern
- `packages/react/src/components/form/createFieldInput.tsx` — factory used by `GroupFieldInput`
- `.pi/agent-docs/specs/29-blocks-array-object-fields.md` — prior object field design (now superseded by this spec)
- `.pi/agent-docs/standards/adding-a-field-type.md` — full checklist for field type additions
- TanStack Form v1 docs — nested object paths via dot-notation (no array mode required)
