# Spec 22 — Relationship Field

**Status:** In progress (Steps 1–6 complete; Steps 7–10 spec'd — ready for implementation)
**Depends on:** Spec 20 (field type pattern), Spec 21 (module augmentation — `CollectionSlug`, `DocumentBySlug`)
**Last spec update:** 2026-05-04 — added custom preview component API (Decisions 11–14), `Input` `loading` prop, master port inventory, and full Step 7–8 implementations.

---

## Overview

Implements the `relationship()` field type end-to-end: core types, config factory, Convex validator, Zod input schema, auto-generated FK and search indexes in schema generation, a live Convex search query for the admin picker, and React input/cell/column components wired into the adapter.

---

## Design Decisions

1. **Single collection only — no polymorphic.** `collection: { slug: TSlug }` takes exactly one slug object. Polymorphic (array of slugs) is deferred.

2. **`hasMany` is UI-only — Convex schema always stores as array.** Both `hasMany: false` and `hasMany: true` emit `v.array(v.id("slug"))` in the schema. The UI component uses `hasMany` to control whether the picker caps at one selection. This prevents a schema migration when toggling between single and multi-select on an existing collection. Form value is always `string[]`.

3. **Form value is always `string[]`.** Convex IDs are strings at the form boundary. The UI component handles display of the related document's title — the stored value is always an array of IDs regardless of `hasMany`.

4. **Auto FK index — explicit suppresses auto.** Every relationship field generates `.index("by_<fieldKey>", ["<fieldKey>"])` automatically unless a manual `field.index` is set, in which case only the explicit index is emitted.

5. **Auto search index on the related collection's `useAsTitle` field.** `collectionConfigToVexSchema` receives the full `VexConfig`. A new helper `getIncomingRelationships` detects whether any other collection has a relationship pointing to the current one. If yes and `useAsTitle` is not a Convex system field (`_id`, `_creationTime`), a `.searchIndex("search_<useAsTitle>", { searchField: "<useAsTitle>", filterFields: [] })` is emitted for that collection — unless a search index with the same name is already configured on that field. The auto index is emitted once regardless of how many collections point here.

6. **`collectionConfigToVexSchema` signature change — breaking.** Adds a required `config: VexConfig` parameter. All existing call sites and tests must pass the full config.

7. **Live Convex search in the picker.** A new `search` query added to `convex/vex/collections.ts`. When `useAsTitle` is a non-system field, the picker calls `vexConvexApi.search`. When `useAsTitle === "_id"`, falls back to `vexConvexApi.list` (search disabled).

8. **`RelationshipField` added to `AdminField` union only in the final wiring step.** All component and dispatch code exists first; the union and adapter are updated in one step to keep TypeScript happy (`FieldComponentMap<F>` requires all `AdminField["type"]` variants to have entries).

9. **`interfaceType` uses static constant — dynamic generation deferred.** `ADMIN_FIELDS.relationship.interfaceType` is `"Id<CollectionSlug>[]"` (always array form). Per-slug dynamic computation (`Id<"posts">[]`) is deferred to a later spec.

10. **Cell shows raw ID by default; preview component overrides.** ~~Fetching the related document in every list cell is expensive. The cell renders a truncated ID string. Population is deferred.~~ **Superseded by Decision 11.** The cell now passes `row.original` (the parent doc, already in the table data) to the resolved preview component. No additional fetch occurs at render time. If no preview component is configured, the cell still renders raw ID(s) as before.

11. **Single preview component contract on collections and on relationship fields.** A new `admin.components.preview?: ComponentType<RelationshipPreviewProps<TSlug>>` slot is added to both `AdminCollectionConfigInput` (in `@vexcms/core/collections/types.ts`) and `RelationshipFieldInput.admin` (in `@vexcms/core/fields/relationship/types.ts`). The contract is `{ doc: Doc<TSlug>; fieldKey: string; config: CollectionConfig<TSlug> }`. The relationship field's setting overrides the target collection's setting; absent both, the default renders `doc[useAsTitle] ?? doc._id` as plain text. There is **no separate `admin.components.cell` slot** — one component renders in picker rows, the trigger's selected-value chip(s), and the parent collection's list-table cell.

12. **Picker query lives inside `RelationshipFieldInput` via a typed hook.** A new export `useRelationshipPickerOptions(fieldDef, query, opts?)` from `@vexcms/react/hooks/useRelationshipPickerOptions.ts` wraps tanstack-query around `vexConvexApi.search` (when `useAsTitle` is a non-system field) or `vexConvexApi.list` (otherwise). Returns `{ documents, isPending, isError, error }`. `RelationshipFieldInput` consumes this hook internally; no consumer wiring required for the common case. The hook is exported from the package barrel for consumers building custom pickers.

13. **`loading` prop on the `Input` UI primitive.** `packages/react/src/components/ui/input.tsx` gains an optional `loading?: boolean`. When `true`, a `Loader2` spinner from `lucide-react` renders absolutely positioned on the right edge with `pr-9` applied to the input itself; any other right-side content is hidden while loading. Implementation wraps the `<InputPrimitive>` in a `<span className="relative block w-full">` only when `loading` is set, so default-path consumers see no DOM change. `RelationshipFieldInput`'s search input passes the picker hook's `isPending` to this prop.

14. **`RelationshipPreviewProps<TSlug>` is generic over the doc's slug.** The `TSlug` type parameter resolves to whatever doc the consumer passes. One contract serves three rendering contexts: picker rows (`slug = target`, `doc = candidate`, `fieldKey = "_id"`), the trigger's selected-value chip(s) (same as picker rows — the resolved target doc(s)), and the parent collection's list-table cell (`slug = parent`, `doc = row.original`, `fieldKey = relationship field's key`). The preview component author types their component for whichever slug they need. The built-in default renderer handles all three by reading `useAsTitle` or `_id` regardless of slug.

---

## Out of Scope

- Polymorphic relationships (multiple `collection` values)
- `filterOptions` — dynamic query constraints on the picker
- `minRows` / `maxRows` validation
- `allowCreate` / `allowEdit` in the picker UI — the `renderCreateDialog` render prop is preserved from master (see Master Port Inventory) but a default create-dialog implementation is deferred
- `isSortable` drag-and-drop reordering
- Drawer / side-panel / inline-drawer picker variants (only popover combobox in this spec; `RelSidePanel` and `RelInlineDrawer` from the design canvas are visual references for follow-up specs)
- ~~Populating the cell with the related document's title (deferred — expensive N+1)~~ **No longer needed after Decision 11** — cells render via the preview component using `row.original` (parent doc), no extra fetch.
- Bi-directional / join fields

---

## Custom Preview Component API

Defines how user-supplied components plug into the relationship rendering pipeline. New in this spec revision (per Decisions 11, 14).

### Type additions

**`packages/core/src/collections/types.ts`** — add `components.preview` to `AdminCollectionConfigInput`:

```ts
import type { ComponentType } from "react";
import type { Doc, CollectionSlug } from "../types/generated";

/**
 * Props received by a custom preview component for relationship rendering.
 *
 * `TSlug` is the slug of the doc being rendered. In a picker row, this is the
 * candidate target doc's slug. In a list-table cell, this is the parent
 * collection's slug (the table row's `row.original`). In the trigger's
 * selected-value chip, it is the resolved target doc's slug.
 *
 * `fieldKey` is the relationship field's key on the parent collection (e.g.
 * `"author"`). In picker rows the component may ignore it; in list cells it
 * gives access to the IDs via `doc[fieldKey]`.
 *
 * @typeParam TSlug - The slug of the doc being rendered.
 */
export interface RelationshipPreviewProps<
  TSlug extends CollectionSlug = CollectionSlug,
> {
  /** The document being previewed. */
  doc: Doc<TSlug>;
  /** The relationship field key on the parent collection. */
  fieldKey: string;
  /** The resolved collection config matching `doc`. */
  config: CollectionConfig<TSlug>;
}

export interface AdminCollectionConfigInput<
  TFieldSlug extends string = CoreAdminField,
> {
  useAsTitle?: CoreAdminField | NoInfer<TFieldSlug>;
  /**
   * Custom component overrides for rendering this collection's docs in
   * relationship contexts (picker rows, table cells, selected-value chips).
   *
   * Override per-relationship via `RelationshipFieldInput.admin.components.preview`.
   */
  components?: {
    /**
     * Component used to render a doc of this collection wherever it appears
     * as a relationship preview. Receives `{ doc, fieldKey, config }`.
     *
     * Default (no preview set): renders `doc[useAsTitle] ?? doc._id` as plain text.
     */
    preview?: ComponentType<RelationshipPreviewProps>;
  };
}
```

**`packages/core/src/fields/relationship/types.ts`** — add `components.preview` to `RelationshipFieldInput.admin`:

```ts
import type { ComponentType } from "react";
import type { RelationshipPreviewProps } from "../../collections/types";
import type { FieldAdminConfigInput } from "../baseTypes";

export interface RelationshipFieldAdminInput<
  TSlug extends CollectionSlug,
> extends FieldAdminConfigInput {
  /**
   * Custom component overrides specific to this relationship field instance.
   * These take precedence over the target collection's `admin.components`.
   */
  components?: {
    /**
     * Per-field override for rendering this relationship's docs.
     * Wins over the target collection's `admin.components.preview`.
     * `TSlug` here is the *target* slug (`fieldDef.collection.slug`).
     */
    preview?: ComponentType<RelationshipPreviewProps<TSlug>>;
  };
}

export interface RelationshipFieldInput<
  TSlug extends CollectionSlug = CollectionSlug,
> extends BaseFieldInput {
  collection: { slug: TSlug };
  hasMany?: boolean;
  admin?: RelationshipFieldAdminInput<TSlug>;
}
```

> **Type-only React dependency.** `react` is already a peerDependency of `@vexcms/core` (`peerDependencies.react: ">=18.0.0"`); using `ComponentType<P>` here is a type-only reference and does not introduce a runtime React dep on core.

### Resolution order

Implemented in a new helper `packages/react/src/components/fields/relationship/resolvePreview.tsx`:

```ts
import type { CollectionConfig, RelationshipField, RelationshipPreviewProps } from "@vexcms/core";
import type { ComponentType } from "react";

/**
 * Resolves which preview component to use for a relationship rendering context.
 *
 * Precedence: field-level override > target collection's preview > default.
 * The default renders `doc[useAsTitle] ?? doc._id` as plain text.
 *
 * @returns A ComponentType ready to render with `RelationshipPreviewProps`.
 */
export function resolveRelationshipPreview(props: {
  fieldDef: RelationshipField;
  targetCollection: CollectionConfig | undefined;
}): ComponentType<RelationshipPreviewProps> {
  return (
    props.fieldDef.admin.components?.preview ??
    props.targetCollection?.admin.components?.preview ??
    DefaultRelationshipPreview
  );
}

function DefaultRelationshipPreview({ doc, config }: RelationshipPreviewProps) {
  const useAsTitle = config.admin.useAsTitle;
  const label = String((doc as Record<string, unknown>)[useAsTitle] ?? doc._id);
  return <span className="text-[13px] text-foreground">{label}</span>;
}
```

### Per-context behaviour

| Context                                | `doc`                                    | `fieldKey`               | `config`                 |
| -------------------------------------- | ---------------------------------------- | ------------------------ | ------------------------ |
| Picker row (`Input.tsx`)               | candidate target doc (`Doc<TargetSlug>`) | `"_id"`                  | target collection config |
| Selected chip on trigger (`Input.tsx`) | resolved target doc(s)                   | `"_id"`                  | target collection config |
| List-table cell (`Cell.tsx`)           | `row.original` (`Doc<ParentSlug>`)       | relationship field's key | parent collection config |

The preview component author chooses which contexts to handle. A component typed against the _target_ slug only renders correctly in the picker + chip contexts. A component typed against the _parent_ slug only renders correctly in cells. To handle all three with one component, type against `Doc<CollectionSlug>` (the full union) and branch internally on `fieldKey === "_id"` vs not.

---

## Input UI Primitive: `loading` Prop

A scoped change to `packages/react/src/components/ui/input.tsx` to support an in-input loading indicator. Used by `RelationshipFieldInput`'s search field, but generally available.

### API

```ts
function Input({
  className,
  type,
  loading,
  ...props
}: React.ComponentProps<"input"> & { loading?: boolean });
```

### Behaviour

- `loading` undefined / `false`: renders exactly as today (single `<input>` element, no wrapper). **No DOM change in the default path.**
- `loading === true`: wraps in `<span className="relative block w-full">`, applies `pr-9` to the input, renders a `<Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground-subtle pointer-events-none" />` sibling. Replaces any user-supplied right-edge content visually — consumers should not stack right adornments and `loading` simultaneously.

### Implementation

````tsx
import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react";
import { Loader2 } from "lucide-react";
import { cn } from "../../styles/utils";

/**
 * Single-line text input with optional in-input loading spinner.
 *
 * When `loading` is true, a spinner renders on the right edge and the input
 * gains right padding. The default path (no `loading` prop) is unchanged —
 * a bare `<input>` element with no wrapper.
 *
 * @example
 * ```tsx
 * <Input value={query} onChange={onChange} loading={isPending} placeholder="Search…" />
 */
function Input({
  className,
  type,
  loading,
  ...props
}: React.ComponentProps<"input"> & { loading?: boolean }) {
  const input = (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-sm border border-input bg-card px-2.5 py-1 text-[13px] shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground-subtle focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        loading && "pr-9",
        className,
      )}
      {...props}
    />
  );
  if (!loading) return input;
  return (
    <span className="relative block w-full">
      {input}
      <Loader2
        aria-hidden="true"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground-subtle pointer-events-none"
      />
    </span>
  );
}

export { Input };
````

---

## Picker Hook: `useRelationshipPickerOptions`

New file `packages/react/src/hooks/useRelationshipPickerOptions.ts`. Per Decision 12, the picker query is internal to `RelationshipFieldInput` but exposed for reuse.

````ts
"use client";

import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import type {
  CollectionConfig,
  RelationshipField,
  VexDocument,
} from "@vexcms/core";
import { vexConvexApi } from "@vexcms/core";

/**
 * Fetches options for the relationship picker combobox.
 *
 * Uses Convex search when the target collection's `useAsTitle` is a
 * non-system field (and a `search_<useAsTitle>` index has been auto-generated
 * by `collectionConfigToVexSchema`). Falls back to `vexConvexApi.list` when
 * `useAsTitle` is `_id` or `_creationTime` — search is disabled in that case.
 *
 * @param fieldDef - The resolved relationship field definition.
 * @param targetCollection - The resolved target collection config.
 * @param query - The search text. Pass `""` to list recent documents.
 * @param opts - Optional tanstack-query overrides (e.g. `enabled`).
 * @returns `{ documents, isPending, isError, error }`.
 *
 * @example
 * ```tsx
 * const { documents, isPending } = useRelationshipPickerOptions(
 *   fieldDef,
 *   targetCollection,
 *   debouncedSearch,
 * );
 */
export function useRelationshipPickerOptions(
  fieldDef: RelationshipField,
  targetCollection: CollectionConfig,
  query: string,
  opts?: { enabled?: boolean },
) {
  const useAsTitle = targetCollection.admin.useAsTitle;
  const isSearchable = useAsTitle !== "_id" && useAsTitle !== "_creationTime";
  const args = isSearchable
    ? {
        collection: fieldDef.collection.slug,
        searchIndexName: `search_${useAsTitle}`,
        searchField: useAsTitle,
        query,
      }
    : { collection: fieldDef.collection.slug };
  const { data, isPending, isError, error } = useQuery({
    ...convexQuery(
      isSearchable ? vexConvexApi.search : vexConvexApi.list,
      args as never,
    ),
    enabled: opts?.enabled ?? true,
  });
  return {
    documents: (data as VexDocument[] | undefined) ?? [],
    isPending,
    isError,
    error,
  };
}
````

> **Edge: search is debounced at the call site, not in the hook.** Consumers wrap `query` in `useDebouncedValue(rawQuery, 200)` before passing in.
> **Edge: when `query === ""` and `isSearchable === true`,** the `search` Convex query falls back to `take(limit)` per Step 6's implementation — no special handling required here.

---

## Master Port Inventory

The master branch's `packages/ui/src/components/form/fields/RelationshipField.tsx` (341 lines, captured at `/tmp/master-RelationshipField.tsx` for reference) is the source of UI structure for Step 8. This table maps every block.

| Master line range | Concern                                                                                             | Action            | Notes                                                                                                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1–60              | Imports + `RelationshipFieldProps` interface                                                        | **Drop**          | Rebuild uses `createFieldInput` factory + tanstack-form context. New component receives `field` + `fieldDef` + `name` from the factory — no manual prop wiring.                                                       |
| 70–85             | `targetCollection` lookup over `config.collections / globals / media / auth`                        | **Drop**          | Rebuild config has only `collections`. Resolve target via `config.collections.find(c => c.slug === fieldDef.collection.slug)` directly, OR receive it via the factory.                                                |
| 95–112            | `useQuery(anyApi.vex.api[fieldDef.to]?.list, { paginationOpts })`                                   | **Replace**       | Use `useRelationshipPickerOptions(fieldDef, targetCollection, debouncedSearch)`.                                                                                                                                      |
| 113–135           | client-side `documents` filter + `getDocLabel` reading `useAsTitle`                                 | **Replace**       | Server-side search via auto-generated `search_<useAsTitle>` index. Label rendering goes through `resolveRelationshipPreview`.                                                                                         |
| 137–155           | `selectedIds`, `selectedLabels` derivations                                                         | **Lift, adapt**   | Logic is sound. Adapt: `selectedIds` from `field.state.value` (always `string[]`); `selectedLabels` becomes "resolved target docs" via a small `useDocsByIds(slug, ids[])` helper, deferred to Step 8 implementation. |
| 156–162           | `targetLabel = labels.singular ?? slug`                                                             | **Lift verbatim** | Used in placeholder "Select <noun>…".                                                                                                                                                                                 |
| 165–202           | `handleSelect` / `handleRemove` / `handleCreated` callbacks                                         | **Lift verbatim** | Pure state-update logic. Adapt only the dispatch target: `field.handleChange` from tanstack-form.                                                                                                                     |
| 207–229           | Multi-select chip layout with X-button removal (lines `{isMany && selectedLabels.length > 0 && …}`) | **Lift verbatim** | Direct port. Replace `bg-secondary` with the rebuild's `bg-muted` (matches design's `.vex-cell-rel` chip background). Each chip's content rendered via `resolveRelationshipPreview` instead of plain `itemLabel`.     |
| 231–256           | `<Popover>` + `<PopoverTrigger>` styled like an input                                               | **Lift, restyle** | Replace inline `className` with the rebuild's `<Button variant="outline">` or a styled `<MultiSelectTrigger>`. Visual target: `.vex-trigger` from `admin.css` (32px height, `rounded-sm`, `border-input`).            |
| 258–300           | Search input + scrollable result list                                                               | **Lift, augment** | Search input uses the new `<Input loading={isPending} />` prop (Decision 13). Each result row rendered via `resolveRelationshipPreview` (Decision 11). Add `useDebouncedValue(search, 200)` to throttle queries.      |
| 302–320           | Create-dialog `renderCreateDialog` render-prop slot                                                 | **Lift verbatim** | Pattern is framework-agnostic and worth preserving for follow-up `allowCreate` work.                                                                                                                                  |
| 322–341           | Closing JSX                                                                                         | **Lift verbatim** | Trivial.                                                                                                                                                                                                              |

**Net assessment:** ~150 lines of UI structure port directly. ~100 lines of data plumbing get replaced by the new hook + preview resolver. ~90 lines (Convex query, multi-source config lookup, master-shaped prop wiring) get dropped.

---

## Target Directory Structure

```
packages/core/src/
  fields/
    constants.ts                        ← MODIFIED ✓
    types.ts                            ← MODIFIED ✓ — RelationshipField added to AdminField
    relationship/
      types.ts                          ← NEW ✓
      config.ts                         ← NEW ✓
      validator.ts                      ← NEW ✓
      validator.test.ts                 ← NEW ✓
      inputSchema.ts                    ← NEW ✓
      inputSchema.test.ts               ← NEW ✓
      index.ts                          ← NEW ✓
    validators/
      index.ts                          ← MODIFIED ✓ — relationship case added
    inputSchemas/
      index.ts                          ← PENDING (Step 9)
  collections/
    validator.ts                        ← MODIFIED ✓ — collectionConfigToVexSchema + getIncomingRelationships
                                          (NOTE: spec referenced schemaGen.ts — actual file is validator.ts)
    validator.test.ts                   ← MODIFIED ✓

packages/react/src/
  components/ui/
    input.tsx                           ← MODIFIED (Decision 13 — add `loading` prop)
  components/fields/
    relationship/
      types.ts                          ← PENDING (Step 7) — RelationshipPreviewProps re-export
      resolvePreview.tsx                ← PENDING (Step 7) — NEW: precedence + default
      Cell.tsx                          ← PENDING (Step 7)
      columnDef.tsx                     ← PENDING (Step 7)
      Input.tsx                         ← PENDING (Step 8) — ports from master
      index.ts                          ← PENDING (Step 7)
    index.tsx                           ← PENDING (Step 9)
  hooks/
    useRelationshipPickerOptions.ts     ← PENDING (Step 8) — NEW: tanstack + Convex
    useDebouncedValue.ts                ← PENDING (Step 8) — NEW: 200ms search debounce
    useDocsByIds.ts                     ← PENDING (Step 8) — NEW: resolve selected IDs to docs
    index.ts                            ← MODIFIED (barrel exports)
  adapter.ts                            ← PENDING (Step 9)

packages/core/src/
  collections/
    types.ts                            ← MODIFIED (Decision 11) — RelationshipPreviewProps + admin.components.preview
  fields/relationship/
    types.ts                            ← MODIFIED (Decision 11) — admin.components.preview override slot

packages/core/src/convex/vex/
  collections.ts                        ← PENDING (Step 6)

packages/core/src/convex/
  index.ts                              ← PENDING (Step 6)

apps/www/src/vexcms/collections/
  posts.ts                              ← PENDING (Step 10)
```

---

## Implementation Order

1. `[agent]` **Step 1** — Baseline verification
2. `[agent]` **Step 2** — `relationship/types.ts` + `config.ts` + `ADMIN_FIELDS` entry + `relationship/index.ts`
3. `[dev]` **Step 3** — `relationshipFieldToValidator` + tests
4. `[dev]` **Step 4** — `relationshipFieldToInputSchema` + tests
5. `[dev]` **Step 5** — Update `collectionConfigToVexSchema`: signature, `getIncomingRelationships` helper, auto FK index, auto search index + update all tests
6. `[dev]` **Step 6** — `search` Convex query in `collections.ts` + `vexConvexApi.search` in `convex/index.ts`
7. `[agent]` **Step 7** — `RelationshipFieldCell` + `columnDef.tsx` + `relationship/index.ts`
8. `[dev]` **Step 8** — `RelationshipFieldInput` combobox
9. `[agent]` **Step 9** — Wire: `AdminField` union, dispatch functions, React adapter, `fields/index.tsx`
10. `[agent]` **Step 10** — `apps/www` posts collection example

---

## Step 1: Baseline Verification

- [x] Run `pnpm test --filter @vexcms/core` — all pass
- [x] Run `pnpm build --filter @vexcms/core` — builds
- [x] Run `pnpm build --filter @vexcms/react` — builds

---

## Step 2: Types, Config Factory, and Constants

- [x] Add `relationship` entry to `packages/core/src/fields/constants.ts`
- [x] Create `packages/core/src/fields/relationship/types.ts`
- [x] Create `packages/core/src/fields/relationship/config.ts`
- [x] Create `packages/core/src/fields/relationship/index.ts`

### `packages/core/src/fields/constants.ts` — relationship entry (actual)

```typescript
relationship: {
  type: "relationship",
  interfaceType: "Id<CollectionSlug>[]",
  validator: "v.array(\nv.string()\n)",
  defaultValue: [] as string[],
},
```

### `packages/core/src/fields/relationship/types.ts` (actual)

```typescript
import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput } from "../baseTypes";
import { CollectionSlug } from "../../types/generated";

export interface RelationshipFieldInput<
  TSlug extends CollectionSlug = CollectionSlug,
> extends BaseFieldInput {
  collection: {
    /** The slug of the collection this field links to. Must be a registered collection slug. */
    slug: TSlug;
  };
  /**
   * Whether this field stores multiple references.
   * `false` and `true` both store `Id[]` — hasMany is UI-only.
   * @defaultValue false
   */
  hasMany?: boolean;
}

export interface RelationshipField<
  TCollection extends string = string,
> extends BaseField {
  readonly type: typeof ADMIN_FIELDS.relationship.type;
  collection: {
    /** The slug of the collection this field links to. */
    slug: TCollection;
  };
  /** UI hint only — both values always store Id[]. false = picker caps at 1 selection. */
  hasMany: boolean;
}
```

### `packages/core/src/fields/relationship/config.ts` (actual)

```typescript
import { ADMIN_FIELDS } from "../constants";
import type { RelationshipFieldInput, RelationshipField } from "./types";
import type { CollectionSlug } from "../../types/generated";

export function relationship<TSlug extends CollectionSlug = CollectionSlug>(
  options: RelationshipFieldInput<TSlug>,
): RelationshipField<TSlug> {
  return {
    label: "",
    required: false,
    hasMany: false,
    ...options,
    type: ADMIN_FIELDS.relationship.type,
    interfaceType: ADMIN_FIELDS.relationship.interfaceType,
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      placeholder: "",
      description: "",
      ...options?.admin,
    },
  };
}
```

---

## Step 3: Validator + Tests

- [x] Create `packages/core/src/fields/relationship/validator.ts`
- [x] Create `packages/core/src/fields/relationship/validator.test.ts`
- [x] All tests pass

### `packages/core/src/fields/relationship/validator.ts` (actual)

````typescript
import { applyBaseValidators } from "../validators/utils";
import type { RelationshipField } from "./types";

/**
 * Converts a relationship field definition to a Convex schema validator string.
 *
 * Always emits `v.array(v.id("collection"))` regardless of `hasMany` —
 * relationship fields are always stored as an array so that switching between
 * single and multi-select never requires a schema migration. Wraps in
 * `v.optional()` when `field.required` is `false`.
 *
 * @param props - Input props.
 * @param props.field - The resolved relationship field definition.
 * @returns Convex validator string.
 *
 * @example
 * ```ts
 * relationshipFieldToValidator({ field: relationship({ collection: { slug: "authors" }, required: true }) })
 * // → 'v.array(v.id("authors"))'
 *
 * relationshipFieldToValidator({ field: relationship({ collection: { slug: "tags" } }) })
 * // → 'v.optional(v.array(v.id("tags")))'
 * ```
 *
 * @internal
 */
export function relationshipFieldToValidator(props: {
  field: RelationshipField;
}): string {
  const { field } = props;
  // Always emits v.array(v.id(...)) — hasMany is UI-only, schema is always array
  const validator = `v.array(v.id("${field.collection.slug}"))`;
  return applyBaseValidators({ field, validator });
}
````

### `packages/core/src/fields/relationship/validator.test.ts` (actual)

```typescript
import { describe, it, expect } from "vitest";
import { relationship } from "./config";
import { relationshipFieldToValidator } from "./validator";

describe("relationshipFieldToValidator", () => {
  it("emits v.array(v.id()) for a required reference", () => {
    const field = relationship({
      collection: { slug: "authors" },
      required: true,
    });
    expect(relationshipFieldToValidator({ field })).toBe(
      'v.array(v.id("authors"))',
    );
  });

  it("wraps v.array(v.id()) in v.optional() for an optional reference", () => {
    const field = relationship({
      collection: { slug: "authors" },
      required: false,
    });
    expect(relationshipFieldToValidator({ field })).toBe(
      'v.optional(v.array(v.id("authors")))',
    );
  });

  it("emits v.array(v.id()) for a required hasMany reference", () => {
    const field = relationship({
      collection: { slug: "tags" },
      hasMany: true,
      required: true,
    });
    expect(relationshipFieldToValidator({ field })).toBe(
      'v.array(v.id("tags"))',
    );
  });

  it("wraps v.array(v.id()) in v.optional() for an optional hasMany reference", () => {
    const field = relationship({
      collection: { slug: "tags" },
      hasMany: true,
      required: false,
    });
    expect(relationshipFieldToValidator({ field })).toBe(
      'v.optional(v.array(v.id("tags")))',
    );
  });

  it("uses the collection slug verbatim in the validator string", () => {
    const field = relationship({
      collection: { slug: "blog_posts" },
      required: true,
    });
    expect(relationshipFieldToValidator({ field })).toBe(
      'v.array(v.id("blog_posts"))',
    );
  });

  it("defaults required to false — emits v.optional(v.array(v.id()))", () => {
    const field = relationship({ collection: { slug: "authors" } });
    expect(relationshipFieldToValidator({ field })).toBe(
      'v.optional(v.array(v.id("authors")))',
    );
  });
});
```

---

## Step 4: Input Schema + Tests

- [x] Create `packages/core/src/fields/relationship/inputSchema.ts`
- [x] Create `packages/core/src/fields/relationship/inputSchema.test.ts`
- [x] All tests pass

### `packages/core/src/fields/relationship/inputSchema.ts` (actual)

````typescript
import { z, type ZodSchema } from "zod";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import type { RelationshipField } from "./types";
import { ADMIN_FIELDS } from "../constants";

/**
 * Builds a Zod schema for validating a relationship field value in the admin form.
 *
 * Always validates as `z.array(z.string())` regardless of `hasMany` — relationship
 * fields always store an array of Convex ID strings at the form boundary.
 * `hasMany` only controls the picker UI (single-select vs multi-select).
 *
 * A `.default([])` is applied so that `undefined` parses to `[]` rather than
 * failing or returning `undefined`.
 *
 * @param props - Input props.
 * @param props.field - The resolved relationship field definition.
 * @returns A Zod schema that validates `string[]` and defaults `undefined` to `[]`.
 *
 * @example
 * ```ts
 * // Both required and optional fields always use z.array(z.string())
 * const schema = relationshipFieldToInputSchema({ field: relationship({ collection: { slug: "authors" } }) });
 * schema.safeParse(["id1"]).success  // true
 * schema.safeParse("id1").success    // false — must be an array
 * schema.safeParse(undefined).data   // []
 * ```
 *
 * @internal
 */
export function relationshipFieldToInputSchema(props: {
  field: RelationshipField;
}): ZodSchema {
  const { field } = props;
  // Always array — hasMany is UI-only. defaultValue [] means undefined → [] always.
  const inputSchema = z
    .array(z.string())
    .default(ADMIN_FIELDS.relationship.defaultValue);
  return applyBaseInputSchemaMeta({ field, inputSchema });
}
````

### `packages/core/src/fields/relationship/inputSchema.test.ts` (actual)

```typescript
import { describe, it, expect } from "vitest";
import { relationship } from "./config";
import { relationshipFieldToInputSchema } from "./inputSchema";

describe("relationshipFieldToInputSchema", () => {
  // Always validates as z.array(z.string()) — hasMany is UI-only

  it("accepts an array of strings", () => {
    const field = relationship({
      collection: { slug: "authors" },
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse(["abc123", "def456"]).success).toBe(true);
    expect(schema.safeParse([]).success).toBe(true);
  });

  it("rejects a bare string — must be wrapped in an array", () => {
    const field = relationship({
      collection: { slug: "authors" },
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse("abc123").success).toBe(false);
  });

  it("rejects non-string array items", () => {
    const field = relationship({
      collection: { slug: "tags" },
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse([1, 2]).success).toBe(false);
  });

  it("rejects non-array values", () => {
    const field = relationship({
      collection: { slug: "tags" },
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse(123).success).toBe(false);
    expect(schema.safeParse(true).success).toBe(false);
    expect(schema.safeParse({}).success).toBe(false);
  });

  it("defaults undefined to [] for required fields", () => {
    const field = relationship({
      collection: { slug: "authors" },
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual([]);
  });

  it("defaults undefined to [] for optional fields", () => {
    const field = relationship({
      collection: { slug: "authors" },
      required: false,
    });
    const schema = relationshipFieldToInputSchema({ field });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual([]);
  });

  it("hasMany: true produces the same array schema (hasMany is UI-only)", () => {
    const field = relationship({
      collection: { slug: "tags" },
      hasMany: true,
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse(["id1", "id2"]).success).toBe(true);
    expect(schema.safeParse("id1").success).toBe(false);
  });
});
```

---

## Step 5: Update `collectionConfigToVexSchema` + Tests

- [x] Updated `packages/core/src/collections/validator.ts` (not `schemaGen.ts` — file was already named `validator.ts`)
- [x] Updated `packages/core/src/collections/validator.test.ts`
- [x] All tests pass

### Key implementation notes (actual)

- `getIncomingRelationships` lives in `collections/validator.ts`
- Auto FK index uses `else if` — explicit `field.index` suppresses the auto `by_<fieldKey>` index
- Auto search index is computed once after the field loop (not per-field)
- Deduplication checks `searchIndexes.find(si => si.includes(\`search\_\${useAsTitle}\`))` to avoid emitting when the manual searchIndex name matches
- Auto search index always has `filterFields: []`
- `searchField` in the auto search index is `useAsTitle`, not the incoming relationship's field key

---

## Step 6: `search` Convex Query

- [x] Update `packages/core/src/convex/vex/collections.ts` — add `search` export
- [x] Update `packages/core/src/convex/index.ts` — add `vexConvexApi.search`
- [x] Run `pnpm build --filter @vexcms/core`

### Add to `packages/core/src/convex/vex/collections.ts`

````typescript
/**
 * Searches documents in a VexCMS-managed collection using a Convex search index.
 *
 * When `query` is non-empty, uses `ctx.db.search` with the provided index name.
 * When `query` is empty, falls back to `ctx.db.query(...).take(limit)` so the
 * picker shows recent items without requiring a search term.
 *
 * The `searchIndexName` must match a `.searchIndex()` declaration in the
 * collection's Convex schema. VexCMS auto-generates `search_<useAsTitle>` on
 * the target collection whenever another collection has a relationship pointing
 * to it and `useAsTitle` is not a Convex system field.
 *
 * @param collection - The Convex table name to search.
 * @param searchIndexName - The `.searchIndex()` name declared in the schema (e.g. `"search_name"`).
 * @param searchField - The field name the search index is built on (e.g. `"name"`). Must match the `searchField` in the `.searchIndex()` declaration. Pass `useAsTitle` from the target collection config.
 * @param query - The search text. Pass `""` to list recent documents instead of searching.
 * @param limit - Maximum number of results. Defaults to `20`.
 * @returns Array of matching documents, ordered by relevance or creation time.
 *
 * @example
 * ```ts
 * // Search authors by name
 * vexConvexApi.search({ collection: "authors", searchIndexName: "search_name", searchField: "name", query: "jane" })
 *
 * // List recent authors when no search term is entered
 * vexConvexApi.search({ collection: "authors", searchIndexName: "search_name", searchField: "name", query: "" })
 */
export const search = query({
  args: {
    collection: v.string(),
    searchIndexName: v.string(),
    searchField: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tableName = args.collection as TableNamesInDataModel<DataModel>;
    const limit = args.limit ?? 20;
    if (!args.query) {
      return ctx.db.query(tableName).take(limit);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return (ctx.db.query(tableName) as any)
      .withSearchIndex(args.searchIndexName, (q: any) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        (q as any).search(args.searchField, args.query),
      )
      .take(limit);
  },
});
````

### Add to `packages/core/src/convex/index.ts` — inside `vexConvexApi`

```typescript
/**
 * Searches documents in a collection by a search index.
 *
 * Used by `RelationshipFieldInput` in `@vexcms/react` to populate the
 * relationship picker combobox. The `searchIndexName` must match the
 * `.searchIndex()` name in the Convex schema — VexCMS auto-generates
 * `search_<useAsTitle>` when another collection has a relationship here.
 * Pass `query: ""` to list recent documents when no search term is entered.
 *
 * @see {@link https://docs.convex.dev/text-search} for Convex search docs
 */
search: anyApi.vex.collections.search as FunctionReference<
  "query",
  "public",
  {
    collection: string;
    searchIndexName: string;
    searchField: string;
    query: string;
    limit?: number;
  },
  VexDocument[]
>,
```

---

## Step 7: Cell + Column Definition

- [ ] Create `packages/react/src/components/fields/relationship/types.ts`
- [ ] Create `packages/react/src/components/fields/relationship/Cell.tsx`
- [ ] Create `packages/react/src/components/fields/relationship/columnDef.tsx`
- [ ] Create `packages/react/src/components/fields/relationship/index.ts`
- [ ] Run `pnpm build --filter @vexcms/react`

### `packages/react/src/components/fields/relationship/types.ts`

Re-exports `RelationshipPreviewProps` from core and adds a thin `RelationshipOption` shape used internally by the picker.

```typescript
export type { RelationshipPreviewProps } from "@vexcms/core";

/**
 * A single option shown in the relationship field picker combobox.
 *
 * `id` is the Convex document ID stored as the field value. The full doc is
 * also kept so the resolved preview component can render against it without
 * a second fetch.
 */
export interface RelationshipOption<TDoc = unknown> {
  /** The Convex document ID — stored as the field value. */
  id: string;
  /** The full target document, returned by `useRelationshipPickerOptions`. */
  doc: TDoc;
}
```

### `packages/react/src/components/fields/relationship/Cell.tsx`

Updated per Decision 11: the cell receives `row.original` (the parent doc, already fetched into the table data) and dispatches through `resolveRelationshipPreview`. No additional fetch occurs at render time.

```tsx
"use client";

import type { CellComponentProps, RelationshipField } from "@vexcms/core";
import { resolveRelationshipPreview } from "./resolvePreview";

/**
 * Relationship field cell component for the data-table list view.
 *
 * Per Decision 11, dispatches through the resolved preview component
 * (field-level override > target collection's preview > default). The default
 * renders `doc[useAsTitle] ?? doc._id` from the *parent* doc — useful only when
 * the relationship field key matches `useAsTitle`, which it generally doesn't.
 * Most consumers will set `admin.components.preview` on the parent collection
 * to render whatever the cell should show (chip, count, etc.).
 *
 * @param props - Standard cell component props.
 */
export function RelationshipFieldCell(
  props: CellComponentProps<RelationshipField>,
) {
  const { row, fieldDef, fieldKey, collection } = props;
  const Preview = resolveRelationshipPreview({
    fieldDef,
    targetCollection: undefined, // cell context: doc is the parent, not target
  });
  return <Preview doc={row.original} fieldKey={fieldKey} config={collection} />;
}
```

> **Note on `targetCollection: undefined`** — in cell context, the _parent_ preview is what matters ("how does the parent collection want to render its relationship field's value?"). The target collection's preview is irrelevant here because we don't have target docs. Field-level override on the parent's relationship field still wins; absent that, the default renderer falls through to `doc[fieldKey] ?? doc._id` which renders the raw ID(s) — same behaviour as the previous spec D10.

### `packages/react/src/components/fields/relationship/columnDef.tsx`

````tsx
import type { ColumnDef } from "@tanstack/react-table";
import type {
  CollectionConfig,
  RelationshipField,
  TDocument,
} from "@vexcms/core";
import { RelationshipFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a relationship field.
 *
 * The column value accessor reads `string[] | undefined` from the document —
 * relationship fields always store an array of Convex IDs regardless of
 * `hasMany`. Rendering is delegated to `RelationshipFieldCell`.
 *
 * @param props - Column generation props.
 * @param props.fieldDef - The resolved relationship field definition.
 * @param props.fieldKey - The field key from `collection.fields` (e.g. `"author"`).
 * @param props.collection - The parent collection config.
 * @param props.isTitleField - Whether this field is the collection's `useAsTitle` field.
 * @returns A TanStack Table `ColumnDef` with sorting disabled and hiding enabled.
 *
 * @example
 * ```ts
 * const col = relationshipFieldToColumnDef({
 *   fieldDef: authorField,
 *   fieldKey: "author",
 *   collection: postsCollection,
 *   isTitleField: false,
 * });
 */
export function relationshipFieldToColumnDef(props: {
  fieldDef: RelationshipField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TDocument, string[] | undefined> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,
    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as string[] | undefined;
      return (
        <RelationshipFieldCell
          value={value}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },
    enableSorting: false,
    enableHiding: true,
    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
````

---

## Step 8: `RelationshipFieldInput` Combobox

Ports the popover-combobox shape from master (see Master Port Inventory) and wires it to the new picker hook + preview resolver.

- [ ] Add `loading?: boolean` prop to `packages/react/src/components/ui/input.tsx` (Decision 13 — see implementation block in the **Input UI Primitive** section above)
- [ ] Create `packages/react/src/hooks/useDebouncedValue.ts` (trivial — `useState` + `setTimeout` cleanup)
- [ ] Create `packages/react/src/hooks/useRelationshipPickerOptions.ts` (full implementation in the **Picker Hook** section above)
- [ ] Create `packages/react/src/hooks/useDocsByIds.ts` — batched fetch for resolving the trigger's selected-value chip(s) (1 query per relationship field, not per chip)
- [ ] Update `packages/react/src/hooks/index.ts` barrel
- [ ] Create `packages/react/src/components/fields/relationship/Input.tsx`
- [ ] Run `pnpm build --filter @vexcms/react`

### Design notes

- Value is always `string[]` — `hasMany: false` means the picker enforces max 1 selection in the UI
- When `useAsTitle` is `_id` or `_creationTime`, search is disabled; falls back to `vexConvexApi.list` (handled inside the hook)
- `searchIndexName` is `search_${useAsTitle}` — matches the auto-generated index from Step 5
- `searchField` is `useAsTitle` from the target collection config — passed explicitly so the Convex query doesn't need to guess the field from the index name
- Search input uses the new `<Input loading={isPending} />` prop while the picker query is in flight
- All option rows + selected chips render via `resolveRelationshipPreview(...)` — the preview component is the single source of truth for what an option/chip looks like
- `hasMany: false`: selecting replaces current value; trigger shows the single selected chip
- `hasMany: true`: selecting toggles; trigger shows multiple chips with remove (×) buttons
- Search input is debounced via `useDebouncedValue(search, 200)` before being passed to the hook

### Implementation skeleton

```tsx
"use client";

import * as React from "react";
import { X, Plus } from "lucide-react";
import type { RelationshipField } from "@vexcms/core";
import {
  createFieldInput,
  FormDescription,
  FormLabel,
  FormError,
} from "../../form";
import { Popover, PopoverTrigger, PopoverContent } from "../../ui/popover";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import {
  useRelationshipPickerOptions,
  useDocsByIds,
  useDebouncedValue,
} from "../../../hooks";
import { resolveRelationshipPreview } from "./resolvePreview";

/**
 * Relationship field input — popover combobox.
 *
 * Renders a trigger that mimics an input, with selected-value chip(s); opens a
 * popover containing a debounced search input and a list of candidate target
 * docs. All rows + chips are rendered via `resolveRelationshipPreview` (Decision 11).
 *
 * @see Master Port Inventory for the line-by-line origin of each block below.
 */
export const RelationshipFieldInput = createFieldInput<
  string[],
  RelationshipField
>(({ name, fieldDef, field, submissionAttempts, config }) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const debouncedSearch = useDebouncedValue(search, 200);

  const targetCollection = React.useMemo(
    () => config.collections.find((c) => c.slug === fieldDef.collection.slug),
    [config.collections, fieldDef.collection.slug],
  );

  const Preview = React.useMemo(
    () => resolveRelationshipPreview({ fieldDef, targetCollection }),
    [fieldDef, targetCollection],
  );

  // Picker query — Decision 12.
  const { documents, isPending } = useRelationshipPickerOptions(
    fieldDef,
    targetCollection!,
    debouncedSearch,
    { enabled: open && !!targetCollection },
  );

  // Resolve selected IDs to full docs for chip rendering. One batched query.
  const selectedIds = field.state.value ?? [];
  const { documents: selectedDocs } = useDocsByIds(
    fieldDef.collection.slug,
    selectedIds,
  );

  const isMany = fieldDef.hasMany;
  const targetLabel =
    targetCollection?.labels.singular ?? fieldDef.collection.slug;

  // —— Lifted verbatim from master lines 165–202 ——
  const handleSelect = React.useCallback(
    (docId: string) => {
      if (fieldDef.admin.readOnly) return;
      const current = field.state.value ?? [];
      if (isMany) {
        field.handleChange(
          current.includes(docId)
            ? current.filter((id) => id !== docId)
            : [...current, docId],
        );
      } else {
        field.handleChange(current[0] === docId ? [] : [docId]);
        setOpen(false);
      }
    },
    [field, isMany, fieldDef.admin.readOnly],
  );

  const handleRemove = React.useCallback(
    (docId: string) => {
      if (fieldDef.admin.readOnly) return;
      const current = field.state.value ?? [];
      field.handleChange(isMany ? current.filter((id) => id !== docId) : []);
    },
    [field, isMany, fieldDef.admin.readOnly],
  );

  return (
    <div className="flex flex-col gap-1.5">
      <FormLabel field={fieldDef} name={name} />

      {/* —— Multi-select chips: master lines 207–229 —— */}
      {isMany && selectedDocs.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedDocs.map((doc) => (
            <span
              key={doc._id}
              className="inline-flex items-center gap-1 rounded-sm bg-muted border border-border px-2 py-0.5 text-xs"
            >
              <Preview doc={doc} fieldKey="_id" config={targetCollection!} />
              <button
                type="button"
                onClick={() => handleRemove(doc._id)}
                className="hover:text-destructive"
                disabled={fieldDef.admin.readOnly}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Popover
        open={open}
        onOpenChange={(v) => {
          if (!fieldDef.admin.readOnly) setOpen(v);
        }}
      >
        {/* —— Trigger styled like an input: master lines 231–256 —— */}
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={fieldDef.admin.readOnly}
            className="w-full justify-between font-normal"
          >
            {!isMany && selectedDocs[0] ? (
              <Preview
                doc={selectedDocs[0]}
                fieldKey="_id"
                config={targetCollection!}
              />
            ) : (
              <span className="text-muted-foreground-subtle">
                {fieldDef.admin.placeholder || `Select ${targetLabel}…`}
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0">
          {/* —— Search input with isPending spinner: Decision 13 —— */}
          <div className="p-2 border-b border-border">
            <Input
              type="text"
              placeholder={`Search ${targetLabel}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              loading={isPending}
              autoFocus
            />
          </div>

          {/* —— Result list: master lines 258–295, rendered via Preview —— */}
          <div className="max-h-[240px] overflow-y-auto">
            {documents.length === 0 ? (
              <p className="text-xs text-muted-foreground-subtle p-4 text-center">
                {isPending ? "Loading…" : "No documents found"}
              </p>
            ) : (
              documents.map((doc) => {
                const isSelected = selectedIds.includes(doc._id);
                return (
                  <button
                    key={doc._id}
                    type="button"
                    onClick={() => handleSelect(doc._id)}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 text-[13px] hover:bg-accent hover:text-accent-foreground text-left ${
                      isSelected ? "bg-accent text-accent-foreground" : ""
                    }`}
                  >
                    {isMany && (
                      <span
                        className={`h-4 w-4 rounded-sm border flex-shrink-0 grid place-items-center ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-input"
                        }`}
                      >
                        {isSelected && <span className="text-[10px]">✓</span>}
                      </span>
                    )}
                    <span className="flex-1 truncate">
                      <Preview
                        doc={doc}
                        fieldKey="_id"
                        config={targetCollection!}
                      />
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* —— Create-dialog render-prop slot: master lines 302–320 —— */}
          {/* Deferred — see Out of Scope. Hook stays available for future allowCreate. */}
        </PopoverContent>
      </Popover>

      <FormDescription field={fieldDef} />
      <FormError field={field} submissionAttempts={submissionAttempts} />
    </div>
  );
});
```

> **Open question for implementer:** the `config` prop is needed to resolve `targetCollection`. Confirm that `createFieldInput`'s render context exposes the full VexConfig (or at least `collections[]`). If not, threading config through the factory is a prerequisite — add it as a Step 8a if so.

---

## Step 9: Wire Everything

- [ ] Update `packages/core/src/fields/inputSchemas/index.ts` — add `relationship` case
- [ ] Update `packages/react/src/components/fields/index.tsx` — add to all three maps
- [ ] Update `packages/react/src/adapter.ts` — add relationship to fields map
- [ ] Run `pnpm build --filter @vexcms/core && pnpm build --filter @vexcms/react`
- [ ] Run `pnpm test --filter @vexcms/core`

> Note: `RelationshipField` was already added to the `AdminField` union in `types.ts` and `validators/index.ts` during Step 3 implementation. Only `inputSchemas/index.ts` and the React wiring remain.

---

## Step 10: `apps/www` Example

- [ ] Update `apps/www/src/vexcms/collections/posts.ts` to add a relationship field
- [ ] Run `pnpm --filter www typecheck`

---

## Verification (mandatory)

- [x] `pnpm test --filter @vexcms/core` — all 210 tests pass
- [ ] `pnpm build --filter @vexcms/react` — pending Steps 7–9
- [ ] `pnpm --filter www typecheck` — pending Step 10

---

## Success Criteria

- [x] `relationship({ collection: { slug: "authors" } })` produces a valid resolved field
- [x] A relationship field always emits `v.array(v.id(...))` in the schema regardless of `hasMany`
- [x] A relationship field named `author` auto-generates `.index("by_author", ["author"])` unless explicit index is set
- [x] A collection with `useAsTitle: "name"` and an incoming relationship auto-generates `.searchIndex("search_name", ...)` exactly once
- [ ] The relationship picker combobox opens, debounces search input, queries via `useRelationshipPickerOptions`, and stores the selected ID(s)
- [ ] `RelationshipField<string>` in `AdminField` causes a TypeScript error in `reactAdapter.fields` if the relationship entry is missing
- [ ] **(New — Decision 11)** A collection with `admin.components.preview = AuthorPreview` renders that component in every relationship picker pointing to it, in the picker's selected-value chip, and in any `posts` list-table cell whose column is the relationship to authors.
- [ ] **(New — Decision 11)** A relationship field with `admin.components.preview` set overrides the target collection's preview only for that specific field instance.
- [ ] **(New — Decision 13)** `<Input loading />` renders an animated spinner on the right edge with `pr-9` applied; `<Input />` (default path) renders bare with no wrapper element.
- [ ] **(New — Decision 12)** `useRelationshipPickerOptions` is exported from `@vexcms/react/hooks` and works standalone (consumer can build a custom picker).
