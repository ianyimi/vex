---
status: draft
spec_id: 2026-10-16-field-input-consistency-pass
touches:
  - ".agent/docs/product/roadmap.md"
  - ".agent/docs/product/v0.1.0-launch-plan.md"
  - "apps/test/convex/seed.ts"
  - "apps/test/src/vex.config.ts"
  - "apps/test/src/vexcms/blocks/CTA/config.ts"
  - "apps/test/src/vexcms/blocks/CTA/index.tsx"
  - "apps/test/src/vexcms/blocks/Testimonial/config.ts"
  - "apps/test/src/vexcms/collections/pages.ts"
  - "packages/core/src/api/create/server.test.ts"
  - "packages/core/src/api/prepareEdit.test.ts"
  - "packages/core/src/api/prepareEdit.ts"
  - "packages/core/src/api/update/server.test.ts"
  - "packages/core/src/collections/config.test.ts"
  - "packages/core/src/collections/config.ts"
  - "packages/core/src/collections/interfaceGen.test.ts"
  - "packages/core/src/collections/utils.test.ts"
  - "packages/core/src/collections/validator.test.ts"
  - "packages/core/src/collections/validator.ts"
  - "packages/core/src/config/config.test.ts"
  - "packages/core/src/config/config.ts"
  - "packages/core/src/config/types.ts"
  - "packages/core/src/fields/array/config.ts"
  - "packages/core/src/fields/array/inputSchema.test.ts"
  - "packages/core/src/fields/array/inputSchema.ts"
  - "packages/core/src/fields/array/types.ts"
  - "packages/core/src/fields/array/validator.test.ts"
  - "packages/core/src/fields/baseTypes.ts"
  - "packages/core/src/fields/blocks/config.ts"
  - "packages/core/src/fields/blocks/index.ts"
  - "packages/core/src/fields/blocks/inputSchema.test.ts"
  - "packages/core/src/fields/blocks/inputSchema.ts"
  - "packages/core/src/fields/blocks/types.ts"
  - "packages/core/src/fields/blocks/utils.test.ts"
  - "packages/core/src/fields/blocks/utils.ts"
  - "packages/core/src/fields/checkbox/config.ts"
  - "packages/core/src/fields/checkbox/types.ts"
  - "packages/core/src/fields/color/config.ts"
  - "packages/core/src/fields/color/types.ts"
  - "packages/core/src/fields/constants.ts"
  - "packages/core/src/fields/date/config.ts"
  - "packages/core/src/fields/date/inputSchema.ts"
  - "packages/core/src/fields/date/types.ts"
  - "packages/core/src/fields/email/config.ts"
  - "packages/core/src/fields/email/index.ts"
  - "packages/core/src/fields/email/inputSchema.test.ts"
  - "packages/core/src/fields/email/inputSchema.ts"
  - "packages/core/src/fields/email/types.ts"
  - "packages/core/src/fields/email/validator.test.ts"
  - "packages/core/src/fields/email/validator.ts"
  - "packages/core/src/fields/group/config.ts"
  - "packages/core/src/fields/group/inputSchema.ts"
  - "packages/core/src/fields/group/types.ts"
  - "packages/core/src/fields/index.ts"
  - "packages/core/src/fields/inputSchemas/index.ts"
  - "packages/core/src/fields/json/config.test.ts"
  - "packages/core/src/fields/json/config.ts"
  - "packages/core/src/fields/json/index.ts"
  - "packages/core/src/fields/json/inputSchema.test.ts"
  - "packages/core/src/fields/json/inputSchema.ts"
  - "packages/core/src/fields/json/types.ts"
  - "packages/core/src/fields/json/validator.test.ts"
  - "packages/core/src/fields/json/validator.ts"
  - "packages/core/src/fields/layout/config.test.ts"
  - "packages/core/src/fields/layout/config.ts"
  - "packages/core/src/fields/layout/index.ts"
  - "packages/core/src/fields/layout/types.ts"
  - "packages/core/src/fields/layout/utils.test.ts"
  - "packages/core/src/fields/layout/utils.ts"
  - "packages/core/src/fields/mask/index.ts"
  - "packages/core/src/fields/mask/types.ts"
  - "packages/core/src/fields/mask/utils.test.ts"
  - "packages/core/src/fields/mask/utils.ts"
  - "packages/core/src/fields/number/config.ts"
  - "packages/core/src/fields/number/inputSchema.test.ts"
  - "packages/core/src/fields/number/inputSchema.ts"
  - "packages/core/src/fields/number/types.ts"
  - "packages/core/src/fields/number/validator.test.ts"
  - "packages/core/src/fields/number/validator.ts"
  - "packages/core/src/fields/relationship/config.ts"
  - "packages/core/src/fields/relationship/inputSchema.test.ts"
  - "packages/core/src/fields/relationship/inputSchema.ts"
  - "packages/core/src/fields/relationship/types.ts"
  - "packages/core/src/fields/richtext/config.test.ts"
  - "packages/core/src/fields/richtext/config.ts"
  - "packages/core/src/fields/richtext/types.ts"
  - "packages/core/src/fields/select/config.ts"
  - "packages/core/src/fields/select/types.ts"
  - "packages/core/src/fields/text/config.ts"
  - "packages/core/src/fields/text/inputSchema.test.ts"
  - "packages/core/src/fields/text/inputSchema.ts"
  - "packages/core/src/fields/text/types.ts"
  - "packages/core/src/fields/text/validator.test.ts"
  - "packages/core/src/fields/text/validator.ts"
  - "packages/core/src/fields/textarea/config.ts"
  - "packages/core/src/fields/textarea/index.ts"
  - "packages/core/src/fields/textarea/inputSchema.test.ts"
  - "packages/core/src/fields/textarea/inputSchema.ts"
  - "packages/core/src/fields/textarea/types.ts"
  - "packages/core/src/fields/textarea/validator.test.ts"
  - "packages/core/src/fields/textarea/validator.ts"
  - "packages/core/src/fields/types.ts"
  - "packages/core/src/fields/upload/config.test.ts"
  - "packages/core/src/fields/upload/config.ts"
  - "packages/core/src/fields/upload/inputSchema.test.ts"
  - "packages/core/src/fields/upload/inputSchema.ts"
  - "packages/core/src/fields/upload/types.ts"
  - "packages/core/src/fields/url/config.ts"
  - "packages/core/src/fields/url/inputSchema.test.ts"
  - "packages/core/src/fields/url/inputSchema.ts"
  - "packages/core/src/fields/url/types.ts"
  - "packages/core/src/fields/url/validator.test.ts"
  - "packages/core/src/fields/url/validator.ts"
  - "packages/core/src/fields/utils.test.ts"
  - "packages/core/src/fields/utils.ts"
  - "packages/core/src/fields/validateFields.test.ts"
  - "packages/core/src/fields/validators/adminFieldToValidator.test.ts"
  - "packages/core/src/fields/validators/index.ts"
  - "packages/core/src/schema/generateVexSchema.test.ts"
  - "packages/core/src/types/generateVexTypes.test.ts"
  - "packages/react/package.json"
  - "packages/react/src/adapter.ts"
  - "packages/react/src/components/fields/array/Input.test.tsx"
  - "packages/react/src/components/fields/array/testFixture.ts"
  - "packages/react/src/components/fields/blocks/Input.test.tsx"
  - "packages/react/src/components/fields/checkbox/Input.tsx"
  - "packages/react/src/components/fields/color/Input.tsx"
  - "packages/react/src/components/fields/date/Cell.test.tsx"
  - "packages/react/src/components/fields/date/Cell.tsx"
  - "packages/react/src/components/fields/date/Input.test.tsx"
  - "packages/react/src/components/fields/date/Input.tsx"
  - "packages/react/src/components/fields/date/index.ts"
  - "packages/react/src/components/fields/date/utils.test.ts"
  - "packages/react/src/components/fields/date/utils.ts"
  - "packages/react/src/components/fields/email/Cell.test.tsx"
  - "packages/react/src/components/fields/email/Cell.tsx"
  - "packages/react/src/components/fields/email/Input.test.tsx"
  - "packages/react/src/components/fields/email/Input.tsx"
  - "packages/react/src/components/fields/email/columnDef.test.ts"
  - "packages/react/src/components/fields/email/columnDef.tsx"
  - "packages/react/src/components/fields/email/index.ts"
  - "packages/react/src/components/fields/email/testFixture.ts"
  - "packages/react/src/components/fields/index.test.tsx"
  - "packages/react/src/components/fields/index.tsx"
  - "packages/react/src/components/fields/json/Cell.test.tsx"
  - "packages/react/src/components/fields/json/Cell.tsx"
  - "packages/react/src/components/fields/json/Input.test.tsx"
  - "packages/react/src/components/fields/json/Input.tsx"
  - "packages/react/src/components/fields/json/columnDef.test.ts"
  - "packages/react/src/components/fields/json/columnDef.tsx"
  - "packages/react/src/components/fields/json/index.ts"
  - "packages/react/src/components/fields/json/testFixture.ts"
  - "packages/react/src/components/fields/json/utils.test.ts"
  - "packages/react/src/components/fields/json/utils.ts"
  - "packages/react/src/components/fields/number/Input.test.tsx"
  - "packages/react/src/components/fields/number/Input.tsx"
  - "packages/react/src/components/fields/number/testFixture.ts"
  - "packages/react/src/components/fields/relationship/EmptyInput.test.tsx"
  - "packages/react/src/components/fields/relationship/EmptyInput.tsx"
  - "packages/react/src/components/fields/relationship/FilledInput.test.tsx"
  - "packages/react/src/components/fields/relationship/FilledInput.tsx"
  - "packages/react/src/components/fields/relationship/Input.test.tsx"
  - "packages/react/src/components/fields/relationship/Input.tsx"
  - "packages/react/src/components/fields/relationship/index.ts"
  - "packages/react/src/components/fields/relationship/testFixture.ts"
  - "packages/react/src/components/fields/relationship/types.ts"
  - "packages/react/src/components/fields/select/Input.test.tsx"
  - "packages/react/src/components/fields/select/Input.tsx"
  - "packages/react/src/components/fields/text/Input.test.tsx"
  - "packages/react/src/components/fields/text/Input.tsx"
  - "packages/react/src/components/fields/textarea/Cell.test.tsx"
  - "packages/react/src/components/fields/textarea/Cell.tsx"
  - "packages/react/src/components/fields/textarea/Input.test.tsx"
  - "packages/react/src/components/fields/textarea/Input.tsx"
  - "packages/react/src/components/fields/textarea/columnDef.test.ts"
  - "packages/react/src/components/fields/textarea/columnDef.tsx"
  - "packages/react/src/components/fields/textarea/index.ts"
  - "packages/react/src/components/fields/textarea/testFixture.ts"
  - "packages/react/src/components/fields/upload/EmptyInput.tsx"
  - "packages/react/src/components/fields/upload/FilledInput.tsx"
  - "packages/react/src/components/fields/upload/Input.test.tsx"
  - "packages/react/src/components/fields/upload/utils.ts"
  - "packages/react/src/components/fields/url/Input.test.tsx"
  - "packages/react/src/components/fields/url/Input.tsx"
  - "packages/react/src/components/form/BlockActionsMenu.test.tsx"
  - "packages/react/src/components/form/BlockActionsMenu.tsx"
  - "packages/react/src/components/form/DocumentTimestamps.test.tsx"
  - "packages/react/src/components/form/DocumentTimestamps.tsx"
  - "packages/react/src/components/form/FieldConditionGate.tsx"
  - "packages/react/src/components/form/FormArray.test.tsx"
  - "packages/react/src/components/form/FormArray.tsx"
  - "packages/react/src/components/form/FormBlocks.test.tsx"
  - "packages/react/src/components/form/FormBlocks.tsx"
  - "packages/react/src/components/form/FormCollapsible.test.tsx"
  - "packages/react/src/components/form/FormCollapsible.tsx"
  - "packages/react/src/components/form/FormError.tsx"
  - "packages/react/src/components/form/FormGroup.tsx"
  - "packages/react/src/components/form/FormRow.test.tsx"
  - "packages/react/src/components/form/FormRow.tsx"
  - "packages/react/src/components/form/FormTabs.test.tsx"
  - "packages/react/src/components/form/FormTabs.tsx"
  - "packages/react/src/components/form/RenderFields.test.tsx"
  - "packages/react/src/components/form/RenderFields.tsx"
  - "packages/react/src/components/form/applyFieldPermissionReadOnly.test.ts"
  - "packages/react/src/components/form/applyFieldPermissionReadOnly.ts"
  - "packages/react/src/components/form/constants.ts"
  - "packages/react/src/components/form/index.ts"
  - "packages/react/src/components/media/MediaLibaryGrid.tsx"
  - "packages/react/src/components/media/MediaPicker.test.tsx"
  - "packages/react/src/components/media/MediaPicker.tsx"
  - "packages/react/src/components/modals/CreateDocumentForm.test.tsx"
  - "packages/react/src/components/modals/CreateDocumentForm.tsx"
  - "packages/react/src/components/modals/CreateDocumentModal.tsx"
  - "packages/react/src/components/modals/constants.ts"
  - "packages/react/src/components/modals/index.tsx"
  - "packages/react/src/components/relationship/RelationshipDocumentList.test.tsx"
  - "packages/react/src/components/relationship/RelationshipDocumentList.tsx"
  - "packages/react/src/components/relationship/RelationshipPicker.test.tsx"
  - "packages/react/src/components/relationship/RelationshipPicker.tsx"
  - "packages/react/src/components/relationship/index.ts"
  - "packages/react/src/components/ui/JsonEditor.test.tsx"
  - "packages/react/src/components/ui/JsonEditor.tsx"
  - "packages/react/src/components/ui/JsonEditorView.tsx"
  - "packages/react/src/components/ui/data-table/DataTable.tsx"
  - "packages/react/src/components/ui/multi-select.tsx"
  - "packages/react/src/components/views/CollectionEditView.tsx"
  - "packages/react/src/components/views/GlobalEditView.tsx"
  - "packages/react/src/components/views/MediaCollectionEditView.tsx"
  - "packages/react/src/hooks/index.ts"
  - "packages/react/src/hooks/useBlockClipboard.test.ts"
  - "packages/react/src/hooks/useBlockClipboard.ts"
  - "packages/react/src/hooks/useFieldCondition.test.tsx"
  - "packages/react/src/hooks/useFieldCondition.ts"
  - "packages/react/src/hooks/useFieldErrorCount.test.tsx"
  - "packages/react/src/hooks/useFieldErrorCount.ts"
  - "packages/react/src/hooks/useFieldMask.test.ts"
  - "packages/react/src/hooks/useFieldMask.ts"
  - "packages/react/src/hooks/useFieldsForm.test.ts"
  - "packages/react/src/hooks/useFieldsForm.ts"
  - "packages/react/src/hooks/useModalSurface.test.tsx"
  - "packages/react/src/hooks/useModalSurface.tsx"
  - "packages/react/src/hooks/usePaginatedSearch.test.tsx"
  - "packages/react/src/hooks/usePaginatedSearch.ts"
  - "packages/react/src/hooks/useRelationshipPickerOptions.ts"
  - "packages/react/src/index.ts"
  - "packages/react/src/testing/dataTableSuite.tsx"
  - "packages/react/src/testing/fieldInputContract.ts"
  - "packages/react/src/testing/fixtures/index.ts"
  - "packages/react/src/testing/hooksSuite.tsx"
  - "packages/react/src/testing/index.ts"
  - "packages/react/src/testing/mediaSuite.tsx"
  - "packages/react/src/testing/nestedFieldContainer.ts"
  - "pnpm-workspace.yaml"
prompt_version: 1
---

# 2026-10-16-field-input-consistency-pass — Spec

## Overview

Launch-plan spec **G**, re-scoped in the 2026-10-16 interview. Every admin field input gets
consistent empty / loading / error / read-only states; `relationship` is rebuilt on upload's
three-state + dialog-picker pattern; `blocks` gains a full editing toolbox (duplicate, insert,
move, collapse-all, copy/paste across documents); forms gain `...tabs()` / `...collapsible()` /
`...row()` layout helpers, `admin.condition`, and opt-in input masks; and the deferred leaf
fields `email()`, `textarea()`, `json()` ship. It lands now because H and I build on a form
renderer that, today, ignores four of the six declared `admin` options.

## Design Decisions

1. **One limit shape: `min`/`max` accept `number | [number, string]`.** The `{ value, error }`
   object API is removed from text/number/array/relationship, and upload/blocks/date gain the
   error slot. Why: two shapes shipped side by side; the tuple keeps the common case a bare
   number while still allowing a custom message. Breaking, acceptable pre-0.1.0.
2. **Resolved limits are `readonly [value, error]` with a value-aware default message filled by
   the factory.** Why: consumers never branch on "was a message supplied", and messages like
   "Must be no more than 100 characters." beat today's generic "This field is too long.".
3. **`email()`, `textarea()`, `json()` are real data field types; `text` gets no `multiline`.**
   Why: `apps/www` needs all three; a second widget mode on `text` would duplicate textarea.
4. **`json()` has no shape option.** Why: kept minimal; server shape checks already exist via `validate()`.
5. **No `datetime` type and no `time.enabled`; `updatedAt` becomes a read-only `date()`.**
   Why: `date()` already stores epoch-ms with a `time.hidden` switch; the stored schema
   (`v.optional(v.number())`) is unchanged, so this is display-only.
6. **"Created at" is display-only from `_creationTime`.** Why: Convex owns it; no schema change.
7. **Layout is authored with spread helpers that stamp frames onto each child field.**
   Why: data, schema/type generation, RBAC, hooks and the 50+ `fields` iteration sites keep seeing
   ordinary fields; literal key inference through nested spreads was verified with `tsc --strict`.
   Rejected: Payload-style data-less entries inside `fields` (every iteration site must skip/hoist
   them) and a separate `admin.tabs` list (two lists to keep in sync per collection/group/block).
8. **`admin.width` is any CSS width string; `admin.position: "sidebar"` is honored for top-level
   fields.** Why: matches Payload's semantics so one mental model covers both; `"half"` is removed.
9. **`row()` widths: use children's `%` widths when they sum to 100, else split evenly.** Why:
   explicit widths win when coherent, and a bad sum degrades to a sane layout instead of overflow.
10. **Only the first top-level tabs group persists its tab in `?tab=`.** Why: shareable/reload-safe
    for the common case without inventing per-group URL keys; nested tabs use local state.
11. **`admin.condition({ data, siblingData })`, pure, enforced on client and server.** Why: the
    collection config is in the browser bundle (ADR-013), so one function serves both; server
    enforcement is required or a required conditional field makes `create` impossible.
12. **Hidden-by-condition values are kept, not cleared.** Why: toggling a condition back restores
    the editor's work; nothing destructive happens on a visibility change.
13. **Container conditions are AND-ed into each child.** Why: the server then needs no knowledge
    of layout — every field carries its effective condition.
14. **A throwing condition counts as met.** Why: fail visible; a buggy predicate must never silently
    disable required-field validation.
15. **Input masks via `use-mask-input`, lazy-loaded, opt-in, with project defaults at
    `fields.inputMasks.<fieldType>` and per-field override / `false`.** Why: one place to set a
    house style; ~29 KB gz paid only by forms that render a masked input.
16. **Masked values are stored unmasked unless `storeMasked: true`.** Why: stored data stays
    format-independent (phone `(555) 123-4567` → `5551234567`).
17. **Relationship copies upload's structure instead of sharing components.** Why: the shells look
    alike but every inner piece differs (tiles vs rows, upload vs create, `get` vs `search`); only
    `usePaginatedSearch` is genuinely shared.
18. **Relationship picker includes a Create tab reusing an extracted `CreateDocumentForm`.**
    Why: mirrors upload's Upload tab; one create form for the modal and the picker.
19. **Block copy/paste uses a localStorage clipboard gated on update permission and validated
    against the target block definition.** Why: same origin = same deployment, so referenced ids
    stay valid; `blockType` slugs are only unique per `blocks()` call, so the target definition,
    not the source, decides what survives.
20. **H's block-editing items move into G.** Why: they share FormBlocks with this spec's sweep;
    H keeps the nav guard, duplicate document and the error summary.
21. **Docs, changesets, templates and CLI are deferred to the commit phase.** Why: they follow
    `apps/www` adopting the new fields, after implementation settles.

## Out of Scope

- Polymorphic relationships (multiple target collections).
- H items: document-level error summary, unsaved-changes navigation guard, duplicate document.
- `apps/docs` pages, changesets, `create-vexcms` templates and the create CLI.
- System-clipboard (cross-origin) block copy/paste.
- New data types beyond `email`/`textarea`/`json` (slug, radio-as-type, `ui`).
- Concurrent-edit conflict resolution (already in `backlog.md`).

## Implementation

### Step 1 — `min`/`max` become `number | [number, string]` everywhere [agent]

- [x] `packages/core/src/fields/baseTypes.ts` — `FieldLimitInput`, `FieldLimit`
- [x] `packages/core/src/fields/utils.ts` + `utils.test.ts` — `resolveFieldLimit`
- [x] `packages/core/src/fields/text/{types,config,inputSchema}.ts` + `inputSchema.test.ts`, `validator.ts`, `validator.test.ts`
- [x] `packages/core/src/fields/number/{types,config,inputSchema}.ts` + `inputSchema.test.ts`, `validator.ts`, `validator.test.ts`
- [x] `packages/core/src/fields/array/{types,config,inputSchema}.ts` + `inputSchema.test.ts`, `validator.test.ts`
- [x] `packages/core/src/fields/relationship/{types,config,inputSchema}.ts` + `inputSchema.test.ts`
- [x] `packages/core/src/fields/upload/{types,config,inputSchema}.ts`
- [x] `packages/core/src/fields/blocks/{types,config,inputSchema}.ts`
- [x] `packages/core/src/fields/date/{types,config,inputSchema}.ts`
- [x] `packages/core/src/fields/url/{types,config,inputSchema}.ts` + `inputSchema.test.ts`, `validator.ts`, `validator.test.ts`
- [x] `packages/core/src/fields/validators/adminFieldToValidator.test.ts`, `packages/core/src/collections/utils.test.ts`, `packages/core/src/api/create/server.test.ts`, `packages/core/src/api/update/server.test.ts` — construct fields with the new `min`/`max` shape
- [x] `packages/react/src/components/form/FormArray.tsx`, `FormBlocks.tsx`
- [x] `packages/react/src/components/fields/blocks/Input.test.tsx`
- [x] `packages/react/src/components/fields/upload/FilledInput.tsx`, `Input.test.tsx`
- [x] `packages/react/src/components/fields/date/Input.tsx`, `Input.test.tsx`
- [x] `packages/react/src/components/fields/array/testFixture.ts`, `Input.test.tsx`
- [x] `packages/react/src/components/fields/number/testFixture.ts`
- [x] `packages/react/src/components/fields/text/Input.test.tsx`
- [x] `apps/test/src/vexcms/blocks/Testimonial/config.ts`

Why: one limit shape before any new field (textarea) or UI (counters) consumes it; breaking change pre-0.1.0.

#### packages/core/src/fields/baseTypes.ts

New shared types for every field's `min`/`max`. Inserted after the existing
`Labels` type (anchor: the blank line between `Labels` and the `ComponentHKT`
JSDoc), so every field type file below can import them from `"../baseTypes"`
alongside `BaseField`/`BaseFieldInput`.

**1 — new types, inserted between `Labels` and `ComponentHKT`.**

```ts
/**
 * User-facing input for a field's `min`/`max` constraint. A bare `number`
 * uses the field's own default error message (filled in by its `config.ts`
 * via {@link resolveFieldLimit}); a `[value, error]` tuple overrides it.
 */
export type FieldLimitInput = number | readonly [value: number, error: string];

/**
 * Resolved `min`/`max` constraint after defaults are applied — always a
 * `[value, error]` tuple, even when the input was a bare number.
 */
export type FieldLimit = readonly [value: number, error: string];
```

#### packages/core/src/fields/utils.ts

**1 — import.** Add `FieldLimitInput, FieldLimit` to the existing
`import { AdminField } from "./types";`-adjacent imports: insert
`import type { FieldLimitInput, FieldLimit } from "./baseTypes";` after the
`convex/values` import.

**2 — new `resolveFieldLimit` export, inserted after the imports and before
`wrapLines`.**

```ts
/**
 * Resolves a field's `min`/`max` input into its final `[value, error]`
 * tuple. A bare number input is paired with `defaultError(value)`; a
 * `[value, error]` tuple input is returned as-is; `undefined` stays
 * `undefined` (no constraint configured).
 *
 * @param props - Input props.
 * @param props.limit - The field's raw `min`/`max` input.
 * @param props.defaultError - Builds the default error message from the
 *   resolved value, when `limit` is a bare number. Ignored when `limit` is
 *   already a `[value, error]` tuple.
 * @returns The resolved `[value, error]` tuple, or `undefined`.
 *
 * @example
 * ```ts
 * resolveFieldLimit({ limit: 3, defaultError: () => "Too short." })
 * // → [3, "Too short."]
 *
 * resolveFieldLimit({ limit: [3, "Need 3+ chars."], defaultError: () => "Too short." })
 * // → [3, "Need 3+ chars."]
 *
 * resolveFieldLimit({ limit: undefined, defaultError: () => "Too short." })
 * // → undefined
 * ```
 */
export function resolveFieldLimit(props: {
  limit: FieldLimitInput | undefined;
  defaultError: (value: number) => string;
}): FieldLimit | undefined {
  if (props.limit === undefined) return undefined;
  if (typeof props.limit === "number") {
    return [props.limit, props.defaultError(props.limit)] as const;
  }
  return props.limit;
}
```

#### packages/core/src/fields/utils.test.ts

New file.

```ts
import { describe, it, expect } from "vitest";
import { resolveFieldLimit } from "./utils";

describe("resolveFieldLimit", () => {
  it("returns undefined when limit is undefined", () => {
    expect(
      resolveFieldLimit({ limit: undefined, defaultError: () => "Too short." }),
    ).toBeUndefined();
  });

  it("pairs a bare number with the default error message", () => {
    expect(resolveFieldLimit({ limit: 3, defaultError: () => "Too short." })).toEqual([
      3,
      "Too short.",
    ]);
  });

  it("passes the resolved value into defaultError", () => {
    expect(
      resolveFieldLimit({
        limit: 5,
        defaultError: (value) => `At least ${value} required.`,
      }),
    ).toEqual([5, "At least 5 required."]);
  });

  it("returns a [value, error] tuple input unchanged", () => {
    expect(
      resolveFieldLimit({
        limit: [3, "Need 3+ chars."],
        defaultError: () => "Too short.",
      }),
    ).toEqual([3, "Need 3+ chars."]);
  });

  it("does not call defaultError for a tuple input", () => {
    let called = false;
    resolveFieldLimit({
      limit: [3, "Need 3+ chars."],
      defaultError: () => {
        called = true;
        return "Too short.";
      },
    });
    expect(called).toBe(false);
  });
});
```

#### packages/core/src/fields/text/types.ts

**1 — import.** Add `FieldLimit, FieldLimitInput` to the existing
`import { BaseField, BaseFieldInput, FieldAdminConfig, FieldValidateProps } from "../baseTypes";`.

**2 — `TextFieldInput`'s `min`/`max` properties** (anchor: `/** Minimum character length config. */` through the closing `};` of `max`).

```ts
  /** Minimum character length. @see {@link FieldLimitInput} */
  min?: FieldLimitInput;
  /** Maximum character length. @see {@link FieldLimitInput} */
  max?: FieldLimitInput;
```

**3 — `TextField`'s `min`/`max` properties** (anchor: `/** Minimum allowed character length config. */` through the closing `};` of `max`).

```ts
  /** Minimum character length, with its resolved error message. @see {@link FieldLimit} */
  min?: FieldLimit;
  /** Maximum character length, with its resolved error message. @see {@link FieldLimit} */
  max?: FieldLimit;
```

#### packages/core/src/fields/text/config.ts

**1 — import.** Add `resolveFieldLimit` via a new
`import { resolveFieldLimit } from "../utils";`.

**2 — `text()` body, complete (anchor: `export function text<`).**

```ts
export function text<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(options?: TextFieldInput<TCollectionSlug, TFieldMeta>): TextField<TCollectionSlug, TFieldMeta> {
  return {
    type: ADMIN_FIELDS.text.type,
    interfaceType: ADMIN_FIELDS.text.interfaceType,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.text.defaultValue,
    ...options,

    min: resolveFieldLimit({
      limit: options?.min,
      defaultError: (value) => `Must be at least ${value} characters.`,
    }),
    max: resolveFieldLimit({
      limit: options?.max,
      defaultError: (value) => `Must be no more than ${value} characters.`,
    }),

    // Admin config with all defaults applied
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
```

#### packages/core/src/fields/text/inputSchema.ts

**1 — JSDoc `@example`** (anchor: the ` * @example` block above `textFieldToInputSchema`).

```ts
 * @example
 * ```ts
 * const field = text({ required: true, min: 3, max: [100, "Too long."] })
 * textFieldToInputSchema({ field })
 * // → z.string({ error: "This field is required." }).min(1, "...").min(3, "...").max(100, "Too long.")
 * ```
```

**2 — `textFieldToInputSchema` body, complete (anchor: `export function textFieldToInputSchema`).**

```ts
export function textFieldToInputSchema(props: { field: TextField }): ZodType {
  const { field } = props;

  const requiredError = "This field is required.";

  let inputSchema = field.required
    ? z.string({ error: requiredError }).min(1, requiredError)
    : z.string();

  if (field.min) {
    inputSchema = inputSchema.min(field.min[0], field.min[1]);
  }
  if (field.max) {
    inputSchema = inputSchema.max(field.max[0], field.max[1]);
  }

  const finalSchema: ZodType = field.required
    ? inputSchema
    : inputSchema.default(field.defaultValue);

  return applyBaseInputSchemaMeta({ field, inputSchema: finalSchema });
}
```

#### packages/core/src/fields/text/inputSchema.test.ts

Every `min: { value: N }` / `max: { value: N }` becomes a bare `min: N` /
`max: N`; every `min: { value: N, error: "…" }` becomes a tuple
`min: [N, "…"]`. Full updated test bodies:

**1 — `applies min constraint`** (anchor: `it("applies min constraint", () => {`).

```ts
  it("applies min constraint", () => {
    const field = text({
      required: true,
      defaultValue: "test",
      min: 3,
    });
    const schema = textFieldToInputSchema({ field });

    // Should accept strings >= 3 chars
    expect(schema.safeParse("abc").success).toBe(true);
    expect(schema.safeParse("abcd").success).toBe(true);

    // Should reject strings < 3 chars
    expect(schema.safeParse("ab").success).toBe(false);
  });
```

**2 — `applies max constraint`.**

```ts
  it("applies max constraint", () => {
    const field = text({
      required: true,
      defaultValue: "test",
      max: 5,
    });
    const schema = textFieldToInputSchema({ field });

    // Should accept strings <= 5 chars
    expect(schema.safeParse("hello").success).toBe(true);
    expect(schema.safeParse("hi").success).toBe(true);

    // Should reject strings > 5 chars
    expect(schema.safeParse("toolong").success).toBe(false);
  });
```

**3 — `applies min constraint with custom error`.**

```ts
  it("applies min constraint with custom error", () => {
    const field = text({
      required: true,
      defaultValue: "test",
      min: [3, "Too short"],
    });
    const schema = textFieldToInputSchema({ field });

    const result = schema.safeParse("ab");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Too short");
    }
  });
```

**4 — `applies max constraint with custom error`.**

```ts
  it("applies max constraint with custom error", () => {
    const field = text({
      required: true,
      defaultValue: "test",
      max: [5, "Too long"],
    });
    const schema = textFieldToInputSchema({ field });

    const result = schema.safeParse("toolong");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Too long");
    }
  });
```

**5 — `combines min and max constraints`.**

```ts
  it("combines min and max constraints", () => {
    const field = text({
      required: true,
      defaultValue: "test",
      min: 3,
      max: 10,
    });
    const schema = textFieldToInputSchema({ field });

    // Should accept strings between 3-10 chars
    expect(schema.safeParse("abc").success).toBe(true);
    expect(schema.safeParse("abcdefghij").success).toBe(true);

    // Should reject strings outside range
    expect(schema.safeParse("ab").success).toBe(false);
    expect(schema.safeParse("abcdefghijk").success).toBe(false);
  });
```

**6 — `combines all constraints with custom errors`.**

```ts
  it("combines all constraints with custom errors", () => {
    const field = text({
      required: true,
      defaultValue: "test",
      min: [3, "Too short"],
      max: [10, "Too long"],
    });
    const schema = textFieldToInputSchema({ field });

    // Test min error
    const minResult = schema.safeParse("ab");
    expect(minResult.success).toBe(false);
    if (!minResult.success) {
      expect(minResult.error.issues[0].message).toBe("Too short");
    }

    // Test max error
    const maxResult = schema.safeParse("this is too long");
    expect(maxResult.success).toBe(false);
    if (!maxResult.success) {
      expect(maxResult.error.issues[0].message).toBe("Too long");
    }
  });
```

**7 — `applies optional after length constraints`.**

```ts
  it("applies optional after length constraints", () => {
    const field = text({
      required: false,
      defaultValue: "",
      min: 5,
      max: 50,
    });
    const schema = textFieldToInputSchema({ field });

    // Should accept undefined
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("");
    }

    // Should still enforce constraints when value is provided
    expect(schema.safeParse("short").success).toBe(true);
    expect(schema.safeParse("hi").success).toBe(false); // Too short
  });
```

**8 — `describe("min/max on an optional field", …)`.**

```ts
  describe("min/max on an optional field", () => {
    it("skips min/max when the value is omitted (undefined)", () => {
      const field = text({ min: 3, max: 5, defaultValue: "" });
      const schema = textFieldToInputSchema({ field });
      expect(schema.safeParse(undefined).success).toBe(true);
    });

    it("still enforces min/max once a non-empty value is supplied, even though the field is optional", () => {
      const field = text({ min: 3, max: 5, defaultValue: "" });
      const schema = textFieldToInputSchema({ field });
      expect(schema.safeParse("ab").success).toBe(false);
      expect(schema.safeParse("toolong").success).toBe(false);
      expect(schema.safeParse("abc").success).toBe(true);
    });
  });
```

#### packages/core/src/fields/text/validator.ts

**1 — JSDoc `@example`** (anchor: `const field3 = text({ min: { value: 3 }, max: { value: 100 } })`).

```ts
 * const field3 = text({ min: 3, max: 100 })
 * textToValidatorString({ field: field3 })  // "v.optional(v.string())"
```

#### packages/core/src/fields/text/validator.test.ts

**1 — `ignores length constraints …`** (anchor: `it("ignores length constraints (enforced in form validation, not DB schema)", () => {`).

```ts
  it("ignores length constraints (enforced in form validation, not DB schema)", () => {
    const field = text({
      required: true,
      defaultValue: "test",
      min: 3,
      max: 100,
    });
    const validator = textFieldToValidator({ field });

    // Convex schema just validates type, not length
    expect(validator).toBe("v.string()");
  });
```

#### packages/core/src/fields/number/types.ts

**1 — import.** Add `FieldLimit, FieldLimitInput` to the existing
`import { BaseField, BaseFieldInput, FieldAdminConfig, FieldValidateProps } from "../baseTypes";`.

**2 — `NumberFieldInput`'s `min`/`max` properties** (anchor: `/** Minimum allowed numeric value config. */` through the closing `};` of `max`, in `NumberFieldInput`).

```ts
  /** Minimum allowed numeric value. @see {@link FieldLimitInput} */
  min?: FieldLimitInput;
  /** Maximum allowed numeric value. @see {@link FieldLimitInput} */
  max?: FieldLimitInput;
```

**3 — `NumberField`'s `min`/`max` properties** (same anchor text, second occurrence, in `NumberField`).

```ts
  /** Minimum allowed numeric value, with its resolved error message. @see {@link FieldLimit} */
  min?: FieldLimit;
  /** Maximum allowed numeric value, with its resolved error message. @see {@link FieldLimit} */
  max?: FieldLimit;
```

#### packages/core/src/fields/number/config.ts

**1 — import.** Add `import { resolveFieldLimit } from "../utils";`.

**2 — `number()` body, complete (anchor: `export function number<`).**

```ts
export function number<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
>(
  options?: NumberFieldInput<TCollectionSlug, TFieldMeta>,
): NumberField<TCollectionSlug, TFieldMeta> {
  const min = resolveFieldLimit({
    limit: options?.min,
    defaultError: (value) => `Must be at least ${value}.`,
  });
  const max = resolveFieldLimit({
    limit: options?.max,
    defaultError: (value) => `Must be no more than ${value}.`,
  });
  if (min && max && min[0] >= max[0]) {
    throw new Error(`Min value must be lower than the Max value`);
  }

  return {
    type: ADMIN_FIELDS.number.type,
    interfaceType: ADMIN_FIELDS.number.interfaceType,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.number.defaultValue,
    ...options,
    min,
    max,

    // Admin config with all defaults applied
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
```

#### packages/core/src/fields/number/inputSchema.ts

**1 — JSDoc `@example`** (anchor: the ` * @example` block above `numberFieldToInputSchema`).

```ts
 * @example
 * ```ts
 * const field = number({ required: true, min: 0, max: [100, "Too large."] })
 * numberFieldToInputSchema({ field })
 * // → z.number({ error: "This field is required." }).min(0, "...").max(100, "Too large.")
 * ```
```

**2 — `numberFieldToInputSchema` body, complete (anchor: `export function numberFieldToInputSchema(props: {`).**

```ts
export function numberFieldToInputSchema(props: {
  field: NumberField;
}): ZodType {
  const { field } = props;

  const requiredError = "This field is required.";

  let inputSchema = field.required
    ? z.number({ error: requiredError })
    : z.number();

  if (field.min) {
    inputSchema = inputSchema.min(field.min[0], field.min[1]);
  }
  if (field.max) {
    inputSchema = inputSchema.max(field.max[0], field.max[1]);
  }

  if (field.required) {
    return applyBaseInputSchemaMeta({ field, inputSchema });
  }

  let defaultValue = field.defaultValue;
  if (field.min && defaultValue < field.min[0]) {
    defaultValue = field.min[0];
  }
  if (field.max && defaultValue > field.max[0]) {
    defaultValue = field.max[0];
  }

  return applyBaseInputSchemaMeta({
    field,
    inputSchema: inputSchema.default(defaultValue),
  });
}
```

#### packages/core/src/fields/number/inputSchema.test.ts

Same `{ value, error? }` → bare number / tuple conversion as text's test file.
Full updated bodies:

**1 — `applies min constraint`.**

```ts
  it("applies min constraint", () => {
    const field = number({
      required: true,
      defaultValue: 0,
      min: 3,
    });
    const schema = numberFieldToInputSchema({ field });

    // Should accept numbers >= 3
    expect(schema.safeParse(3).success).toBe(true);
    expect(schema.safeParse(100).success).toBe(true);

    // Should reject numbers < 3
    expect(schema.safeParse(2).success).toBe(false);
    expect(schema.safeParse(-1).success).toBe(false);
  });
```

**2 — `applies max constraint`.**

```ts
  it("applies max constraint", () => {
    const field = number({
      required: true,
      defaultValue: 0,
      max: 5,
    });
    const schema = numberFieldToInputSchema({ field });

    // Should accept numbers <= 5
    expect(schema.safeParse(5).success).toBe(true);
    expect(schema.safeParse(0).success).toBe(true);

    // Should reject numbers > 5
    expect(schema.safeParse(6).success).toBe(false);
    expect(schema.safeParse(100).success).toBe(false);
  });
```

**3 — `applies min constraint with custom error`.**

```ts
  it("applies min constraint with custom error", () => {
    const field = number({
      required: true,
      defaultValue: 0,
      min: [3, "Too small"],
    });
    const schema = numberFieldToInputSchema({ field });

    const result = schema.safeParse(2);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Too small");
    }
  });
```

**4 — `applies max constraint with custom error`.**

```ts
  it("applies max constraint with custom error", () => {
    const field = number({
      required: true,
      defaultValue: 0,
      max: [5, "Too large"],
    });
    const schema = numberFieldToInputSchema({ field });

    const result = schema.safeParse(10);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Too large");
    }
  });
```

**5 — `combines min and max constraints`.**

```ts
  it("combines min and max constraints", () => {
    const field = number({
      required: true,
      defaultValue: 0,
      min: 1,
      max: 10,
    });
    const schema = numberFieldToInputSchema({ field });

    // Should accept numbers between 1-10
    expect(schema.safeParse(1).success).toBe(true);
    expect(schema.safeParse(10).success).toBe(true);
    expect(schema.safeParse(5).success).toBe(true);

    // Should reject numbers outside range
    expect(schema.safeParse(0).success).toBe(false);
    expect(schema.safeParse(11).success).toBe(false);
  });
```

**6 — `combines all constraints with custom errors`.**

```ts
  it("combines all constraints with custom errors", () => {
    const field = number({
      required: true,
      defaultValue: 0,
      min: [1, "Too small"],
      max: [10, "Too large"],
    });
    const schema = numberFieldToInputSchema({ field });

    // Test min error
    const minResult = schema.safeParse(0);
    expect(minResult.success).toBe(false);
    if (!minResult.success) {
      expect(minResult.error.issues[0].message).toBe("Too small");
    }

    // Test max error
    const maxResult = schema.safeParse(11);
    expect(maxResult.success).toBe(false);
    if (!maxResult.success) {
      expect(maxResult.error.issues[0].message).toBe("Too large");
    }
  });
```

**7 — `applies optional after range constraints`.**

```ts
  it("applies optional after range constraints", () => {
    const field = number({
      required: false,
      defaultValue: 0,
      min: 5,
      max: 50,
    });
    const schema = numberFieldToInputSchema({ field });

    // Should accept undefined
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(5);
    }

    // Should still enforce constraints when value is provided
    expect(schema.safeParse(10).success).toBe(true);
    expect(schema.safeParse(4).success).toBe(false); // Too small
    expect(schema.safeParse(51).success).toBe(false); // Too large
  });
```

#### packages/core/src/fields/number/validator.ts

**1 — JSDoc `@example`** (anchor: `const field3 = number({ min: { value: 0 }, max: { value: 100 } })`).

```ts
 * const field3 = number({ min: 0, max: 100 })
 * numberFieldToValidator({ field: field3 })  // "v.optional(v.number())"
```

#### packages/core/src/fields/number/validator.test.ts

**1 — `ignores range constraints …`.**

```ts
  it("ignores range constraints (enforced in form validation, not DB schema)", () => {
    const field = number({
      required: true,
      defaultValue: 0,
      min: 0,
      max: 100,
    });
    const validator = numberFieldToValidator({ field });

    // Convex schema just validates type, not range
    expect(validator).toBe("v.number()");
  });
```

#### packages/core/src/fields/array/types.ts

**1 — import.** Add `FieldLimit, FieldLimitInput` to the existing
`import { BaseField, BaseFieldInput, FieldAdminConfig, FieldValidateProps } from "../baseTypes";`.

**2 — JSDoc `@example` on `ArrayFieldInput`** (anchor: `* scores: array({ required: true, items: number(), max: { value: 10 } })`).

```ts
 * // Required number array with max length
 * scores: array({ required: true, items: number(), max: 10 })
```

**3 — `ArrayFieldInput`'s `min`/`max` properties** (anchor: `/** Minimum array length config. */` through the closing `};` of `max`).

```ts
  /** Minimum array length. @see {@link FieldLimitInput} */
  min?: FieldLimitInput;
  /** Maximum array length. @see {@link FieldLimitInput} */
  max?: FieldLimitInput;
```

**4 — `ArrayField`'s `min`/`max` properties** (anchor: `/** Minimum allowed array length config. */` through the closing `};` of `max`).

```ts
  /** Minimum allowed array length, with its resolved error message. @see {@link FieldLimit} */
  min?: FieldLimit;
  /** Maximum allowed array length, with its resolved error message. @see {@link FieldLimit} */
  max?: FieldLimit;
```

#### packages/core/src/fields/array/config.ts

**1 — import.** Add `import { resolveFieldLimit } from "../utils";`.

**2 — JSDoc `@example`** (anchor: `*       min: { value: 1 },`).

```ts
 *     // Number array with a min length
 *     scores: array({
 *       items: number(),
 *       min: 1,
 *     }),
```

**3 — `array()` body, complete (anchor: `export function array<`).**

```ts
export function array<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TArrayType extends ArrayType = string,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(options: ArrayFieldInput<TCollectionSlug, TArrayType, TFieldMeta>): ArrayField<TCollectionSlug, TArrayType, TFieldMeta> {
  // If the items field is a named group, reference its name in the array
  // type rather than inlining the full object type. This keeps generated
  // interfaces readable and lets the named group's own type alias do the work.
  const itemsInterfaceType = childInterfaceType(options.items);

  return {
    type: ADMIN_FIELDS.array.type,
    interfaceType: `${itemsInterfaceType}[]`,

    // Core properties with defaults
    label: "",
    labels: {
      singular: "Item",
      plural: "Items",
    },
    required: false,
    defaultValue: [],
    ...options,

    min: resolveFieldLimit({
      limit: options.min,
      defaultError: (value) => `Must be at least ${value} items.`,
    }),
    max: resolveFieldLimit({
      limit: options.max,
      defaultError: (value) => `Must be no more than ${value} items.`,
    }),

    items: {
      ...options.items,
      required: true,
    },

    // Admin config with all defaults applied
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
    },
    meta: {
      ...options.meta,
    } as TFieldMeta,
  };
}
```

#### packages/core/src/fields/array/inputSchema.ts

**1 — JSDoc `@example`** (anchor: `* const field = array({ items: number(), min: { value: 2 }, max: { value: 5 } })`).

```ts
 * // Optional field, min/max still enforced once a value is supplied
 * const field = array({ items: number(), min: 2, max: 5 })
 * const schema = arrayFieldToInputSchema({ field })
 * schema.safeParse(undefined)   // → success: [] (skips min/max — empty)
 * schema.safeParse([1])         // → fails: below min
```

**2 — `arrayFieldToInputSchema` body, complete (anchor: `export function arrayFieldToInputSchema<`).**

```ts
export function arrayFieldToInputSchema<
  TArrayType extends ArrayType = string,
  TFieldMeta extends {} = {},
>(props: {
  field: ArrayField<VexResourceSlug, TArrayType, TFieldMeta>;
  ignoreRequired?: boolean;
}): ZodType {
  const { field } = props;

  const requiredError = "This field is required.";

  const itemsInputSchema = adminFieldToInputSchema({
    field: field.items,
    ignoreRequired: props.ignoreRequired,
  });

  let arraySchema = field.required
    ? z.array(itemsInputSchema, { error: requiredError }).min(1, requiredError)
    : z.array(itemsInputSchema);

  if (field.min) {
    const [min, message] = field.min;
    arraySchema = arraySchema.refine(
      (value) => (!field.required && value.length === 0) || value.length >= min,
      message,
    );
  }
  if (field.max) {
    const [max, message] = field.max;
    arraySchema = arraySchema.refine(
      (value) => (!field.required && value.length === 0) || value.length <= max,
      message,
    );
  }

  const inputSchema: ZodType = field.required
    ? arraySchema
    : arraySchema.default(field.defaultValue ?? []);

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
```

#### packages/core/src/fields/array/inputSchema.test.ts

Every `{ value: N }` → bare `N`; every `{ value: N, error: "…" }` → tuple
`[N, "…"]`. Full updated bodies for every affected `it`:

**1 — `describe("min constraint", …)`.**

```ts
  describe("min constraint", () => {
    it("applies min items constraint", () => {
      const itemsField = text({ required: true });
      const field = array({
        required: true,
        items: itemsField,
        min: 2,
      });
      const schema = arrayFieldToInputSchema({ field });

      // Should accept arrays with >= 2 items
      expect(schema.safeParse(["a", "b"]).success).toBe(true);
      expect(schema.safeParse(["a", "b", "c"]).success).toBe(true);

      // Should reject arrays with < 2 items
      expect(schema.safeParse([]).success).toBe(false);
      expect(schema.safeParse(["a"]).success).toBe(false);
    });

    it("applies min constraint with custom error", () => {
      const itemsField = text({ required: true });
      const field = array({
        required: true,
        items: itemsField,
        min: [3, "At least 3 items required"],
      });
      const schema = arrayFieldToInputSchema({ field });

      const result = schema.safeParse(["a", "b"]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "At least 3 items required",
        );
      }
    });

    it("surfaces a custom min message on a required field even when min.value matches the required floor (regression)", () => {
      // A `min: [1, "…"]` on a required field is a common pattern to get
      // a friendlier message than the generic "This field is required." —
      // the only way to violate `min: 1` is an empty array, so the
      // required-only-skips-when-optional gate must not swallow this case.
      const itemsField = text({ required: true });
      const field = array({
        required: true,
        items: itemsField,
        min: [1, "Add at least one item."],
      });
      const schema = arrayFieldToInputSchema({ field });

      const result = schema.safeParse([]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.map((issue) => issue.message)).toContain(
          "Add at least one item.",
        );
      }
    });
  });
```

**2 — `describe("max constraint", …)`.**

```ts
  describe("max constraint", () => {
    it("applies max items constraint", () => {
      const itemsField = text({ required: true });
      const field = array({
        required: true,
        items: itemsField,
        max: 3,
      });
      const schema = arrayFieldToInputSchema({ field });

      // Should accept arrays with <= 3 items
      expect(schema.safeParse(["a"]).success).toBe(true);
      expect(schema.safeParse(["a", "b", "c"]).success).toBe(true);

      // Should reject arrays with > 3 items
      expect(schema.safeParse(["a", "b", "c", "d"]).success).toBe(false);
    });

    it("applies max constraint with custom error", () => {
      const itemsField = text({ required: true });
      const field = array({
        required: true,
        items: itemsField,
        max: [2, "Maximum 2 items allowed"],
      });
      const schema = arrayFieldToInputSchema({ field });

      const result = schema.safeParse(["a", "b", "c"]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Maximum 2 items allowed");
      }
    });
  });
```

**3 — `describe("combined min and max constraints", …)`.**

```ts
  describe("combined min and max constraints", () => {
    it("applies both min and max constraints", () => {
      const itemsField = number({ required: true });
      const field = array({
        required: true,
        items: itemsField,
        min: 2,
        max: 5,
      });
      const schema = arrayFieldToInputSchema({ field });

      // Should accept arrays between 2-5 items
      expect(schema.safeParse([1, 2]).success).toBe(true);
      expect(schema.safeParse([1, 2, 3]).success).toBe(true);
      expect(schema.safeParse([1, 2, 3, 4, 5]).success).toBe(true);

      // Should reject arrays outside range
      expect(schema.safeParse([]).success).toBe(false);
      expect(schema.safeParse([1]).success).toBe(false);
      expect(schema.safeParse([1, 2, 3, 4, 5, 6]).success).toBe(false);
    });

    it("reports correct error for min violation", () => {
      const itemsField = text({ required: true });
      const field = array({
        required: true,
        items: itemsField,
        min: [3, "Too few items"],
        max: [10, "Too many items"],
      });
      const schema = arrayFieldToInputSchema({ field });

      const result = schema.safeParse(["a", "b"]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Too few items");
      }
    });

    it("reports correct error for max violation", () => {
      const itemsField = text({ required: true });
      const field = array({
        required: true,
        items: itemsField,
        min: [1, "Too few items"],
        max: [2, "Too many items"],
      });
      const schema = arrayFieldToInputSchema({ field });

      const result = schema.safeParse(["a", "b", "c"]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Too many items");
      }
    });
  });
```

**4 — `describe("nested arrays", …)`'s `"applies constraints to nested arrays"` test** (anchor: `it("applies constraints to nested arrays", () => {`).

```ts
    it("applies constraints to nested arrays", () => {
      const innerItems = text({ required: true });
      const innerArray = array({ items: innerItems, required: true, max: 3 });
      const field = array({ items: innerArray, required: true, min: 2 });
      const schema = arrayFieldToInputSchema({ field });

      // Should accept 2-3 nested arrays, each with max 3 items
      expect(schema.safeParse([["a", "b"], ["c"]]).success).toBe(true);

      // Should reject too few nested arrays
      expect(schema.safeParse([["a"]]).success).toBe(false);

      // Should reject nested arrays with too many items
      expect(schema.safeParse([["a", "b", "c", "d"], ["e"]]).success).toBe(
        false,
      );
    });
```

**5 — `describe("min/max on an optional field", …)`.**

```ts
  describe("min/max on an optional field", () => {
    it("skips min/max only when the value is empty or omitted", () => {
      const itemsField = number({ required: true });
      const field = array({
        items: itemsField,
        min: 2,
        max: 3,
      });
      const schema = arrayFieldToInputSchema({ field });

      // Omitted or explicitly empty: not required, so no value at all is fine.
      expect(schema.safeParse(undefined).success).toBe(true);
      expect(schema.safeParse([]).success).toBe(true);
    });

    it("still enforces min/max once a non-empty value is supplied, even though the field is optional", () => {
      const itemsField = number({ required: true });
      const field = array({
        items: itemsField,
        min: 2,
        max: 3,
      });
      const schema = arrayFieldToInputSchema({ field });

      // Regression: min/max is independent of `required` — `required` only
      // governs whether the field may be empty, not whether a *supplied*
      // value must respect the configured item-count bounds.
      expect(schema.safeParse([1]).success).toBe(false);
      expect(schema.safeParse([1, 2, 3, 4, 5]).success).toBe(false);
      expect(schema.safeParse([1, 2]).success).toBe(true);
      expect(schema.safeParse([1, 2, 3]).success).toBe(true);
    });
  });
```

#### packages/core/src/fields/array/validator.test.ts

**1 — `ignores min/max constraints …`.**

```ts
  it("ignores min/max constraints (enforced in form validation, not DB schema)", () => {
    const field = array({
      items: text({
        required: true,
        defaultValue: "test",
      }),
      min: 3,
      max: 100,
    });
    const validator = arrayFieldToValidator({ field });

    // min/max don't affect validator, just type validation
    // Array is optional (no required: true), so v.optional()
    expect(validator).toBe("v.optional(v.array(v.string()))");
  });
```

#### packages/core/src/fields/relationship/types.ts

**1 — import.** Add `FieldLimit, FieldLimitInput` to the existing
`import { ApplyComponent, BaseField, BaseFieldInput, ComponentHKT, FieldAdminConfig, FieldAdminConfigInput, FieldValidateProps } from "../baseTypes";`.

**2 — `RelationshipFieldInput`'s `min`/`max` properties** (anchor: `/** Minimum number of related documents required, once a value is supplied. */` through the closing `};` of `max`, first occurrence).

```ts
  /** Minimum number of related documents required, once a value is supplied. @see {@link FieldLimitInput} */
  min?: FieldLimitInput;
  /** Maximum number of related documents allowed. @see {@link FieldLimitInput} */
  max?: FieldLimitInput;
```

**3 — `RelationshipField`'s `min`/`max` properties** (same anchor text, second occurrence).

```ts
  /** Minimum number of related documents required, once a value is supplied, with its resolved error message. @see {@link FieldLimit} */
  min?: FieldLimit;
  /** Maximum number of related documents allowed, with its resolved error message. @see {@link FieldLimit} */
  max?: FieldLimit;
```

#### packages/core/src/fields/relationship/config.ts

**1 — import.** Add `import { resolveFieldLimit } from "../utils";`.

**2 — `relationship()` body, complete (anchor: `export function relationship<`).**

```ts
export function relationship<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TTargetSlug extends CollectionSlug = CollectionSlug,
  TComponent extends ComponentHKT = ComponentHKT,
>(
  options: RelationshipFieldInput<TCollectionSlug, TFieldMeta, TTargetSlug, TComponent>,
): RelationshipField<TCollectionSlug, TFieldMeta, TTargetSlug, TComponent> {
  return {
    label: "",
    required: false,
    hasMany: false,
    ...options,
    min: resolveFieldLimit({
      limit: options.min,
      defaultError: (value) => `Must be at least ${value} related items.`,
    }),
    max: resolveFieldLimit({
      limit: options.max,
      defaultError: (value) => `Must be no more than ${value} related items.`,
    }),
    type: ADMIN_FIELDS.relationship.type,
    // Per-field override of the static `ADMIN_FIELDS.relationship.interfaceType`
    // (`Id<CollectionSlug>[]`): emitting the target slug as a literal is what
    // lets `RelationshipTargetOf` recover it, so `populate`/`depth` can narrow
    // the populated field to `Doc<target>[]` instead of a union of every doc.
    interfaceType: `Id<"${options.collection.slug}">[]`,
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      placeholder: "",
      components: {},
      ...options?.admin,
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
```

#### packages/core/src/fields/relationship/inputSchema.ts

**1 — JSDoc `@example`** (anchor: `* relationshipFieldToInputSchema({ field: relationship({ collection: { slug: "tags" }, min: { value: 1 }, max: { value: 3 } }) })`).

```ts
 * // min/max — enforced on any supplied array, required or not
 * relationshipFieldToInputSchema({ field: relationship({ collection: { slug: "tags" }, min: 1, max: 3 }) })
```

**2 — `relationshipFieldToInputSchema` body, complete (anchor: `export function relationshipFieldToInputSchema(props: {`).**

```ts
export function relationshipFieldToInputSchema(props: {
  field: RelationshipField;
}): ZodType {
  const { field } = props;

  let inputSchema = field.required
    ? z.array(z.string(), { error: "This field is required." })
    : z.array(z.string());

  if (field.min) {
    const [min, message] = field.min;
    inputSchema = inputSchema.refine(
      (value) => (!field.required && value.length === 0) || value.length >= min,
      message,
    );
  }
  if (field.max) {
    const [max, message] = field.max;
    inputSchema = inputSchema.refine(
      (value) => (!field.required && value.length === 0) || value.length <= max,
      message,
    );
  }

  const finalSchema: ZodType = field.required
    ? inputSchema
    : inputSchema.default(ADMIN_FIELDS.relationship.defaultValue);

  return applyBaseInputSchemaMeta({ field, inputSchema: finalSchema });
}
```

#### packages/core/src/fields/relationship/inputSchema.test.ts

**1 — `describe("min/max reference-count bounds", …)`, complete.**

```ts
  describe("min/max reference-count bounds", () => {
    it("enforces min/max on a required field", () => {
      const field = relationship({
        collection: { slug: "tags" },
        required: true,
        min: 1,
        max: 2,
      });
      const schema = relationshipFieldToInputSchema({ field });
      expect(schema.safeParse(["a", "b", "c"]).success).toBe(false);
      expect(schema.safeParse(["a"]).success).toBe(true);
      expect(schema.safeParse(["a", "b"]).success).toBe(true);
    });

    it("skips min/max on an optional field only when the value is empty or omitted", () => {
      const field = relationship({
        collection: { slug: "tags" },
        min: 1,
        max: 2,
      });
      const schema = relationshipFieldToInputSchema({ field });
      expect(schema.safeParse(undefined).success).toBe(true);
      expect(schema.safeParse([]).success).toBe(true);
    });

    it("still enforces min/max once a non-empty value is supplied, even though the field is optional", () => {
      // Regression: min/max is independent of `required` — `required` only
      // governs whether the value may be absent, not whether a *supplied*
      // (non-empty) array must respect the configured reference count.
      const field = relationship({
        collection: { slug: "tags" },
        min: 2,
        max: 3,
      });
      const schema = relationshipFieldToInputSchema({ field });
      expect(schema.safeParse(["a"]).success).toBe(false);
      expect(schema.safeParse(["a", "b", "c", "d"]).success).toBe(false);
      expect(schema.safeParse(["a", "b"]).success).toBe(true);
    });

    it("uses a custom error message when configured", () => {
      const field = relationship({
        collection: { slug: "tags" },
        required: true,
        min: [2, "Pick at least two tags."],
        max: [2, "Pick no more than two tags."],
      });
      const schema = relationshipFieldToInputSchema({ field });
      const belowMin = schema.safeParse(["a"]);
      expect(belowMin.success).toBe(false);
      if (!belowMin.success) expect(belowMin.error.issues[0].message).toBe("Pick at least two tags.");

      const aboveMax = schema.safeParse(["a", "b", "c"]);
      expect(aboveMax.success).toBe(false);
      if (!aboveMax.success) expect(aboveMax.error.issues[0].message).toBe("Pick no more than two tags.");
    });

    // Once a `min` is explicitly configured, it applies even on a required
    // field's empty array — otherwise a required field's custom `min`
    // message could never surface (an empty array is the only way to
    // violate a `min` in the first place, so unconditionally skipping the
    // check on empty would make the message unreachable).
    it("a required field's min still rejects an empty array once min is explicitly configured", () => {
      const field = relationship({
        collection: { slug: "tags" },
        required: true,
        min: 1,
      });
      const schema = relationshipFieldToInputSchema({ field });
      expect(schema.safeParse([]).success).toBe(false);
    });

    // CORE-1, unaffected: with no `min` configured at all, `required` alone
    // never demands a non-empty array — a document may legitimately have
    // zero relations.
    it("a required field with no min configured still accepts an empty array (CORE-1)", () => {
      const field = relationship({ collection: { slug: "tags" }, required: true });
      const schema = relationshipFieldToInputSchema({ field });
      expect(schema.safeParse([]).success).toBe(true);
    });
  });
```

#### packages/core/src/fields/upload/types.ts

**1 — import.** Add `FieldLimit, FieldLimitInput` to the existing
`import type { BaseField, BaseFieldInput, FieldValidateProps } from "../baseTypes";`.

**2 — `UploadFieldInput`'s `min`/`max` properties** (anchor: `/** The min number of files allowed. */` through the closing `max?: number;`).

```ts
  /**
   * Minimum number of files allowed. Absent — the default — means no minimum.
   * @see {@link FieldLimitInput}
   */
  min?: FieldLimitInput;
  /**
   * Maximum number of files allowed.
   * @see {@link FieldLimitInput}
   */
  max?: FieldLimitInput;
```

**3 — `UploadField`'s `min`/`max` properties** (anchor: `/** The min number of files allowed. */` through `max?: number;`, second occurrence — `min` changes from required `number` to optional).

```ts
  /**
   * Minimum number of files allowed, with its resolved error message.
   * Absent means no minimum — upload's resolved `min` no longer defaults to `0`.
   * @see {@link FieldLimit}
   */
  min?: FieldLimit;
  /**
   * Maximum number of files allowed, with its resolved error message.
   * @see {@link FieldLimit}
   */
  max?: FieldLimit;
```

#### packages/core/src/fields/upload/config.ts

**1 — import.** Add `import { resolveFieldLimit } from "../utils";`.

**2 — `upload()` body, complete (anchor: `export function upload<`).**

```ts
export function upload<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(
  options: UploadFieldInput<TCollectionSlug, TFieldMeta>,
): UploadField<TCollectionSlug, TFieldMeta> {
  if (!options.to || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(options.to)) {
    throw new Error(`upload(): "to" must be a valid collection slug. Got "${options.to}".`);
  }

  return {
    label: "",
    required: false,
    hasMany: false,
    accept: "",
    ...options,
    min: resolveFieldLimit({
      limit: options.min,
      defaultError: (value) => `Must be at least ${value} file${value === 1 ? "" : "s"}.`,
    }),
    max: resolveFieldLimit({
      limit: options.max,
      defaultError: (value) => `Must be no more than ${value} file${value === 1 ? "" : "s"}.`,
    }),
    type: ADMIN_FIELDS.upload.type,
    // Per-field override of the static `ADMIN_FIELDS.upload.interfaceType`
    // (`Id<MediaCollectionSlug>[]`). `to` is validated as a slug above; emitting
    // it as a literal keeps the populated type narrow once more than one media
    // collection is registered (a single-member union masks the difference).
    interfaceType: `Id<"${options.to}">[]`,
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      placeholder: "",
      ...options.admin,
    },
    meta: {
      ...options.meta,
    } as TFieldMeta,
  };
}
```

#### packages/core/src/fields/upload/inputSchema.ts

**1 — `uploadFieldToInputSchema` body, complete (anchor: `export function uploadFieldToInputSchema(props: { field: UploadField }): ZodType {`).**

```ts
export function uploadFieldToInputSchema(props: { field: UploadField }): ZodType {
  const { field } = props;

  const requiredError = "This field is required.";
  let inputSchema = field.required
    ? z.array(z.string(), { error: requiredError }).min(1, requiredError)
    : z.array(z.string());

  if (field.min) {
    const [min, message] = field.min;
    inputSchema = inputSchema.refine(
      (value) => (!field.required && value.length === 0) || value.length >= min,
      message,
    );
  }
  if (field.max) {
    const [max, message] = field.max;
    inputSchema = inputSchema.refine(
      (value) => (!field.required && value.length === 0) || value.length <= max,
      message,
    );
  }

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
```

(`config.test.ts` already constructs `min`/`max` as bare numbers — still a
valid `FieldLimitInput` — so it needs no code change.)

#### packages/core/src/fields/upload/inputSchema.test.ts

**1 — default min-message assertion** (anchor: `"At least 1 file required.",` inside `"enforces min/max file count regardless of required, skipping only an empty/omitted optional value"`).

```ts
      expect(belowMin.error.issues.map((issue) => issue.message)).toContain(
        "Must be at least 1 file.",
      );
```

#### packages/core/src/fields/blocks/types.ts

**1 — import.** Add `FieldLimit, FieldLimitInput` to the existing
`import type { BaseField, BaseFieldInput, FieldAdminConfig, FieldAdminConfigInput, FieldValidateProps } from "../baseTypes";`.

**2 — `BlocksFieldInput`'s `min`/`max` properties** (anchor: `/**\n   * Minimum number of block items.` through the closing `max?: number;` block).

```ts
  /**
   * Minimum number of block items.
   *
   * Enforced by the Zod inputSchema (form validation), not the Convex schema.
   * Does not affect the generated `vex.schema.ts`.
   * @see {@link FieldLimitInput}
   */
  min?: FieldLimitInput;
  /**
   * Maximum number of block items.
   *
   * Enforced by the Zod inputSchema. When the max is reached, the "Add" button
   * is disabled in the admin UI.
   * @see {@link FieldLimitInput}
   */
  max?: FieldLimitInput;
```

**3 — `BlocksField`'s `min`/`max` properties** (anchor: `/** Minimum number of block items (Zod-enforced). */` through `max?: number;`).

```ts
  /** Minimum number of block items, with its resolved error message (Zod-enforced). @see {@link FieldLimit} */
  min?: FieldLimit;
  /** Maximum number of block items, with its resolved error message (Zod-enforced). @see {@link FieldLimit} */
  max?: FieldLimit;
```

#### packages/core/src/fields/blocks/config.ts

**1 — import.** Add `import { resolveFieldLimit } from "../utils";`.

**2 — `blocks()` body, complete (anchor: `export function blocks<`).**

```ts
export function blocks<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(
  options: BlocksFieldInput<TCollectionSlug, TFieldMeta>,
): BlocksField<TCollectionSlug, TFieldMeta> {
  // Validate unique slugs
  const seen = new Set<string>();
  for (const block of options.blocks) {
    if (seen.has(block.blockType)) {
      throw new Error(
        `Duplicate block slug "${block.blockType}" in blocks() call. Each block must have a unique slug.`,
      );
    }
    seen.add(block.blockType);
  }

  const labels = options.labels ?? { singular: "Block", plural: "Blocks" };

  return {
    type: ADMIN_FIELDS.blocks.type,
    interfaceType: buildBlocksInterfaceType({
      blocks: options.blocks,
      interfaceName: options.interfaceName,
    }),
    label: options.label ?? "",
    required: options.required ?? false,
    defaultValue: options.defaultValue ?? [],
    labels,
    blocks: options.blocks,
    interfaceName: options.interfaceName,
    min: resolveFieldLimit({
      limit: options.min,
      defaultError: (value) => `Must be at least ${value} ${labels.plural}.`,
    }),
    max: resolveFieldLimit({
      limit: options.max,
      defaultError: (value) => `Must be no more than ${value} ${labels.plural}.`,
    }),
    admin: {
      defaultCollapsed: options.admin?.defaultCollapsed ?? false,
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      placeholder: "",
      ...options?.admin,
    },
    meta: {
      ...options.meta,
    } as TFieldMeta,
  };
}
```

#### packages/core/src/fields/blocks/inputSchema.ts

**1 — `blocksFieldToInputSchema` body, complete (anchor: `export function blocksFieldToInputSchema<TFieldMeta extends {} = {}>(props: {`).**

```ts
export function blocksFieldToInputSchema<TFieldMeta extends {} = {}>(props: {
  field: BlocksField<VexResourceSlug, TFieldMeta>;
  ignoreRequired?: boolean;
}): ZodType {
  const { field } = props;

  const blockSchemas = field.blocks.map((block) => {
    const userSubSchemas = Object.fromEntries(
      Object.entries(block.fields).map(([key, subField]) => [
        key,
        adminFieldToInputSchema({ field: subField, ignoreRequired: props.ignoreRequired }),
      ]),
    );
    return z.object({
      blockType: z.literal(block.blockType),
      blockName: z.string().optional(),
      id: z.string(),
      ...userSubSchemas,
    });
  });

  const itemSchema =
    blockSchemas.length <= 1
      ? (blockSchemas[0] ?? z.object({ blockType: z.string(), id: z.string() }))
      : // @ts-expect-error mismatched zod types, works in practice
        z.discriminatedUnion("blockType", blockSchemas);

  const requiredError = "This field is required.";
  let arraySchema = field.required
    ? z.array(itemSchema, { error: requiredError }).min(1, requiredError)
    : z.array(itemSchema);

  if (field.min) {
    const [min, message] = field.min;
    arraySchema = arraySchema.refine(
      (value) => (!field.required && value.length === 0) || value.length >= min,
      message,
    );
  }
  if (field.max) {
    const [max, message] = field.max;
    arraySchema = arraySchema.refine(
      (value) => (!field.required && value.length === 0) || value.length <= max,
      message,
    );
  }

  const schema: ZodType = field.required
    ? arraySchema
    : arraySchema.default(field.defaultValue ?? []);

  return applyBaseInputSchemaMeta({ field, inputSchema: schema });
}
```

(`min: 1`, `max: 1`, etc. are already bare numbers, which stay valid
`FieldLimitInput`s — no construction changes needed.)

#### packages/core/src/fields/blocks/inputSchema.test.ts

**1 — default min-message assertion** (anchor: `"At least 1 Blocks required.",` inside `"enforces min constraint when required"`).

```ts
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        "Must be at least 1 Blocks.",
      );
```


#### packages/react/src/components/fields/blocks/Input.test.tsx

**1 — below-min default message assertion** (anchor: `expect(message).toBe("At least 2 Sections required.");` inside `"fails validation below min, with the real schema message, and passes at exactly min"`).

```ts
        expect(message).toBe("Must be at least 2 Sections.");
```

**2 — above-max default message assertion** (anchor: `expect(await screen.findByText("No more than 3 Sections allowed.")).toBeInTheDocument();` inside `"fails validation above max, with the real schema message, when items were seeded past the limit directly"`).

```ts
        expect(await screen.findByText("Must be no more than 3 Sections.")).toBeInTheDocument();
```

#### packages/core/src/fields/date/types.ts

**1 — import.** Add `FieldLimit, FieldLimitInput` to the existing
`import { BaseField, BaseFieldInput, FieldAdminConfig, FieldValidateProps } from "../baseTypes";`.

**2 — `DateFieldInput`'s `min`/`max` properties** (anchor: `/** Minimum allowed Unix timestamp (milliseconds). Validated in the input schema. */` through `max?: number;`).

```ts
  /** Minimum allowed Unix timestamp (milliseconds). Validated in the input schema. @see {@link FieldLimitInput} */
  min?: FieldLimitInput;
  /** Maximum allowed Unix timestamp (milliseconds). Validated in the input schema. @see {@link FieldLimitInput} */
  max?: FieldLimitInput;
```

**3 — `DateField`'s `min`/`max` properties** (anchor: `/** Minimum allowed Unix timestamp (milliseconds). */` through `max?: number;`).

```ts
  /** Minimum allowed Unix timestamp (milliseconds), with its resolved error message. @see {@link FieldLimit} */
  min?: FieldLimit;
  /** Maximum allowed Unix timestamp (milliseconds), with its resolved error message. @see {@link FieldLimit} */
  max?: FieldLimit;
```

#### packages/core/src/fields/date/config.ts

**1 — import.** Add `import { resolveFieldLimit } from "../utils";`.

**2 — `date()` body, complete (anchor: `export function date<`).**

```ts
export function date<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(
  options?: DateFieldInput<TCollectionSlug, TFieldMeta>,
): DateField<TCollectionSlug, TFieldMeta> {
  return {
    type: ADMIN_FIELDS.date.type,
    interfaceType: ADMIN_FIELDS.date.interfaceType,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.date.defaultValue,
    ...options,

    min: resolveFieldLimit({
      limit: options?.min,
      defaultError: (value) => `Must be on or after ${new Date(value).toISOString().slice(0, 10)}.`,
    }),
    max: resolveFieldLimit({
      limit: options?.max,
      defaultError: (value) => `Must be on or before ${new Date(value).toISOString().slice(0, 10)}.`,
    }),

    // Admin config with all defaults applied
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
    },

    time: {
      hidden: false,
      use12HourFormat: true,
      ...options?.time,
      timePicker: {
        hour: true,
        minute: true,
        second: false,
        ...options?.time?.timePicker,
      },
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
```

#### packages/core/src/fields/date/inputSchema.ts

**1 — JSDoc `@example`** (anchor: `* const field = date({ required: true, min: 1700000000000 })`).

```ts
 * const field = date({ required: true, min: 1700000000000 })
 * dateFieldToInputSchema({ field })
 * // → z.number({ error: "This field is required." }).min(1700000000000, "...")
```

**2 — `dateFieldToInputSchema` body, complete (anchor: `export function dateFieldToInputSchema(props: { field: DateField }): ZodType {`).**

```ts
export function dateFieldToInputSchema(props: { field: DateField }): ZodType {
  const { field } = props;

  const requiredError = "This field is required.";

  let inputSchema = field.required
    ? z.number({ error: requiredError })
    : z.number();

  if (field.min) {
    inputSchema = inputSchema.min(field.min[0], field.min[1]);
  }
  if (field.max) {
    inputSchema = inputSchema.max(field.max[0], field.max[1]);
  }

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
```

(`inputSchema.test.ts` already constructs `date({ min: MIN, max: MAX })` as
bare numbers — no test change needed; it never asserts the default message
text. `date()`'s `resolveFieldLimit` defaults now produce
`"Must be on or after <YYYY-MM-DD>."` / `"Must be on or before <YYYY-MM-DD>."`
(UTC `toISOString` date, timezone/locale-independent since the factory runs
in both the Convex runtime and the browser) instead of the old inline
`const minError`/`maxError` strings.)

#### packages/core/src/fields/validators/adminFieldToValidator.test.ts

**1 — `ignores min/max constraints …`** (anchor: `it("ignores min/max constraints — they don't affect the DB schema", () => {`).

```ts
  it("ignores min/max constraints — they don't affect the DB schema", () => {
    const field = number({
      required: true,
      min: 0,
      max: 100,
    });
    expect(adminFieldToValidator({ field })).toBe("v.number()");
  });
```

#### packages/core/src/collections/utils.test.ts

**1 — `"partial mode: an absent required field passes"`** (anchor: `fields: { title: text({ required: true }), slug: text({ min: { value: 3 } }) },`).

```ts
      fields: { title: text({ required: true }), slug: text({ min: 3 }) },
```

**2 — `"partial mode: a present field still runs its full validator chain"`** (anchor: `const collection = defineCollection({ slug: "posts", fields: { slug: text({ min: { value: 3 } }) } });`).

```ts
    const collection = defineCollection({ slug: "posts", fields: { slug: text({ min: 3 }) } });
```

**3 — `"still rejects a non-empty value violating max"`** (anchor: `fields: { title: text({ required: true, max: { value: 3 } }) },`).

```ts
      fields: { title: text({ required: true, max: 3 }) },
```

#### packages/core/src/api/create/server.test.ts

**1 — `"rejects a write that violates a field's max length through the Local API"`** (anchor: `const collection = defineCollection({ slug: "posts", fields: { title: text({ max: { value: 5 } }) } });`).

```ts
    const collection = defineCollection({ slug: "posts", fields: { title: text({ max: 5 }) } });
```

**2 — `"rejects a write to a required array field below its configured min, through the Local API"`** (anchor: `author: array({ items: text(), required: true, min: { value: 2 } }),`).

```ts
        author: array({ items: text(), required: true, min: 2 }),
```

**3 — `"accepts a write that omits an optional array field below its own configured min count"`** (anchor: `author: array({ items: text(), min: { value: 2 } }),`).

```ts
        author: array({ items: text(), min: 2 }),
```

#### packages/core/src/api/update/server.test.ts

**1 — `"rejects a present field that violates its constraint on a partial update"`** (anchor: `const collection = defineCollection({ slug: "posts", fields: { title: text({ max: { value: 5 } }) } });`).

```ts
    const collection = defineCollection({ slug: "posts", fields: { title: text({ max: 5 }) } });
```

**2 — `"rejects an update to a required array field below its configured min"`** (anchor: `author: array({ items: text(), required: true, min: { value: 2 } }),`).

```ts
        author: array({ items: text(), required: true, min: 2 }),
```

**3 — `"accepts a partial update that never touches an optional array field below its own configured min count"`, `"rejects an update that supplies an optional array field below its own configured min count"`, and `"accepts an update that supplies an optional array field satisfying its own configured min count"`** — each anchored at its own `author: array({ items: text(), min: { value: 2 } }),`. All three become:

```ts
        author: array({ items: text(), min: 2 }),
```

#### packages/react/src/components/form/FormArray.tsx

**1 — `atMax` computation** (anchor: `const atMax = !!fieldDef.max && items.length >= fieldDef.max.value;`).

```ts
  const atMax = !!fieldDef.max && items.length >= fieldDef.max[0];
```

**2 — "Maximum reached" message** (anchor: `Maximum {fieldDef.max?.value} {fieldDef.labels.plural} reached`).

```tsx
              Maximum {fieldDef.max?.[0]} {fieldDef.labels.plural} reached
```

#### packages/react/src/components/form/FormBlocks.tsx

**1 — `atMax` computation** (anchor: `const atMax = !!fieldDef.max && items.length >= fieldDef.max;`).

```ts
  const atMax = !!fieldDef.max && items.length >= fieldDef.max[0];
```

**2 — "Maximum reached" message** (anchor: `Maximum {fieldDef.max} {plural} reached`).

```tsx
              Maximum {fieldDef.max?.[0]} {plural} reached
```

#### packages/react/src/components/fields/upload/FilledInput.tsx

**1 — `atLimit` computation** (anchor: `const atLimit = fieldDef.max !== undefined && mediaIds.length >= fieldDef.max;`).

```ts
  const atLimit = fieldDef.max !== undefined && mediaIds.length >= fieldDef.max[0];
```

**2 — `n/max` count display** (anchor: `{mediaIds.length}/{fieldDef.max}`).

```tsx
              {mediaIds.length}/{fieldDef.max[0]}
```

#### packages/react/src/components/fields/upload/Input.test.tsx

**1 — `singleFieldDef` construction** (anchor: `const singleFieldDef = { ...fixture.fieldDef, hasMany: false, max: 1 };` inside `"[finding] stages every selected file even when hasMany is false"`).

```ts
        const singleFieldDef = { ...fixture.fieldDef, hasMany: false, max: [1, "Must be no more than 1 file."] as const };
```

#### packages/react/src/components/fields/date/Input.tsx

**1 — `minDate`/`maxDate` memos** (anchor: `const minDate = useMemo(`).

```ts
    const minDate = useMemo(
      () => (fieldDef.min !== undefined ? new Date(fieldDef.min[0]) : undefined),
      [fieldDef.min],
    );

    const maxDate = useMemo(
      () => (fieldDef.max !== undefined ? new Date(fieldDef.max[0]) : undefined),
      [fieldDef.max],
    );
```

#### packages/react/src/components/fields/date/Input.test.tsx

**1 — below-min construction** (anchor: `const fieldWithMin: DateField = { ...fixture.fieldDef, min: boundary };` in the `"accepts a timestamp before fieldDef.min"` test).

```ts
        const fieldWithMin: DateField = {
          ...fixture.fieldDef,
          min: [boundary, `Must be on or after ${new Date(boundary).toISOString().slice(0, 10)}.`],
        };
```

**2 — above-max construction** (anchor: `const fieldWithMax: DateField = { ...fixture.fieldDef, max: boundary };`).

```ts
        const fieldWithMax: DateField = {
          ...fixture.fieldDef,
          max: [boundary, `Must be on or before ${new Date(boundary).toISOString().slice(0, 10)}.`],
        };
```

**3 — calendar-disabled-days construction** (anchor: `const fieldWithMin: DateField = { ...fixture.fieldDef, min: initial.getTime() };`).

```ts
        const fieldWithMin: DateField = {
          ...fixture.fieldDef,
          min: [initial.getTime(), `Must be on or after ${new Date(initial.getTime()).toISOString().slice(0, 10)}.`],
        };
```

#### packages/react/src/components/fields/array/testFixture.ts

**1 — fixture `min`** (anchor: `min: { value: 1 },` in `arrayFieldFixture`) and the JSDoc above it referencing the old shape.

```ts
/**
 * `array` field fixture — the container's OWN contract (add/remove, nested
 * value round-trip, and readOnly cascade across every child field type are
 * covered separately by `runNestedFieldContainerSuite`). `items` is a simple
 * `text()` sub-field so this fixture only exercises the array's own behavior.
 *
 * `min: 1` makes an empty array fail validation — `array`'s
 * `arrayFieldToInputSchema` REPLACES the `required`-only check with the `min`
 * check whenever both are set (see `packages/core/src/fields/array/inputSchema.ts`),
 * so `required` alone would never surface as `invalid`'s failure reason.
 */
export const arrayFieldFixture: FieldFixture<ArrayField<VexResourceSlug, string>, string[]> = {
  fieldType: "array",
  fieldDef: array({
    label: "Tags",
    items: text({ label: "Tag", required: true }),
    required: true,
    min: 1,
  }),
  valid: ["First tag", "Second tag"],
  invalid: [],
  empty: [],
};
```

#### packages/react/src/components/fields/array/Input.test.tsx

**1 — `boundaryFieldDef`** (anchor: `const boundaryFieldDef = array({`).

```ts
      const boundaryFieldDef = array({
        label: "Scores",
        items: text({ label: "Score", required: true }),
        required: true,
        min: 2,
        max: 3,
      });
```

**2 — default min-message assertion** (anchor: `expect(message).toBe("This field is too short.");` inside `"fails validation one item below min, with the real schema message"`).

```ts
        expect(message).toBe("Must be at least 2 items.");
```

**3 — default max-message assertion** (anchor: `expect(message).toBe("This field is too long.");` inside `"fails validation one item above max, with the real schema message, when seeded directly past the limit"`).

```ts
        expect(message).toBe("Must be no more than 3 items.");
```

**4 — `customFieldDef`** (anchor: `const customFieldDef = array({` inside `"uses configured custom min/max error messages verbatim"`).

```ts
        const customFieldDef = array({
          label: "Scores",
          items: text({ label: "Score", required: true }),
          required: true,
          min: [1, "Add at least one score."],
          max: [2, "No more than two scores."],
        });
```

#### packages/react/src/components/fields/number/testFixture.ts

**1 — fixture `min`/`max`** (anchor: `min: { value: 0, error: "Quantity cannot be negative." },`).

```ts
  fieldDef: number({
    label: "Quantity",
    required: true,
    min: [0, "Quantity cannot be negative."],
    max: [100, "Quantity cannot exceed 100."],
  }),
```

#### packages/react/src/components/fields/text/Input.test.tsx

Every `min: { value: N }` → `min: N`; every `max: { value: N }` → `max: N`;
every `{ value: N, error: "…" }` → `[N, "…"]`. Each `it` below is a complete
replacement, anchored by its own title (unchanged):

```ts
      it("accepts a value at exactly the configured min length", async () => {
        const fieldDef = text({ label: "Bio", min: 3 });
        expect(await submit(fieldDef, "x".repeat(3))).toBe("");
      });

      it("rejects a value one character below the min length with the default min-length message", async () => {
        const fieldDef = text({ label: "Bio", min: 3 });
        expect(await submit(fieldDef, "x".repeat(2))).toBe("Must be at least 3 characters.");
      });

      it("accepts a value at exactly the configured max length", async () => {
        const fieldDef = text({ label: "Bio", max: 10 });
        expect(await submit(fieldDef, "x".repeat(10))).toBe("");
      });

      it("rejects a value one character over the max length with the default max-length message", async () => {
        const fieldDef = text({ label: "Bio", max: 10 });
        expect(await submit(fieldDef, "x".repeat(11))).toBe("Must be no more than 10 characters.");
      });

      it("uses a custom min.error message instead of the default when configured", async () => {
        const fieldDef = text({
          label: "Bio",
          min: [5, "Bio needs at least 5 characters."],
        });
        expect(await submit(fieldDef, "x".repeat(4))).toBe("Bio needs at least 5 characters.");
      });

      it("uses a custom max.error message instead of the default when configured", async () => {
        const fieldDef = text({
          label: "Bio",
          max: [5, "Bio can be at most 5 characters."],
        });
        expect(await submit(fieldDef, "x".repeat(6))).toBe("Bio can be at most 5 characters.");
      });

      it("required + min (no max): a missing value fails with the required message — CORE-1 fixed: min/max compose onto the required branch instead of reassigning over it", async () => {
        const fieldDef = text({ label: "Bio", required: true, min: 3 });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it("required + max only (no min): a missing value fails with the required message, not silently passing", async () => {
        const fieldDef = text({ label: "Bio", required: true, max: 10 });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it("required + min AND max together: a missing value still fails with the required message", async () => {
        const fieldDef = text({
          label: "Bio",
          required: true,
          min: 3,
          max: 10,
        });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it('a plain required field with no min/max keeps "This field is required." for a missing value', async () => {
        const fieldDef = text({ label: "Bio", required: true });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it("an optional field with no min/max accepts a missing value", async () => {
        const fieldDef = text({ label: "Bio" });
        expect(await submit(fieldDef, undefined)).toBe("");
      });

      it("never client-side truncates or rejects a value past max — enforcement is deferred to the schema on submit", async () => {
        const user = userEvent.setup();
        const fieldDef = text({ label: "Bio", max: 5 });
        render(
          <TextValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );

        const input = screen.getByLabelText("Bio", { exact: false });
        await user.type(input, "way too long for max");
        expect(input).toHaveValue("way too long for max");
      });
```

#### apps/test/src/vexcms/blocks/Testimonial/config.ts

**1 — `rating` field** (anchor: `rating: number({`).

```ts
    rating: number({
      label: "Rating",
      description: "Star rating 1–5.",
      min: 1,
      max: 5,
    }),
```

#### packages/core/src/fields/url/types.ts

**1 — import.** Add `FieldLimit, FieldLimitInput` to the existing
`import { BaseField, BaseFieldInput, FieldValidateProps } from "../baseTypes";`.

**2 — JSDoc `@example`** (anchor: `* website: url({ required: true, max: { value: 2048 }, index: "by_website" })`).

```ts
 * website: url({ required: true, max: 2048, index: "by_website" })
```

**3 — `UrlFieldInput`'s `min`/`max` properties, inserted after `defaultValue?: string;`.**

```ts
  /** Minimum character length. @see {@link FieldLimitInput} */
  min?: FieldLimitInput;
  /** Maximum character length. @see {@link FieldLimitInput} */
  max?: FieldLimitInput;
```

**4 — `UrlField`'s `min`/`max` properties, inserted after `defaultValue?: string;`.**

```ts
  /** Minimum character length, with its resolved error message. @see {@link FieldLimit} */
  min?: FieldLimit;
  /** Maximum character length, with its resolved error message. @see {@link FieldLimit} */
  max?: FieldLimit;
```

#### packages/core/src/fields/url/config.ts

**1 — import.** Add `import { resolveFieldLimit } from "../utils";`.

**2 — JSDoc `@example`** (anchor: `*     website: url({ required: true, max: { value: 2048 }, index: "by_website" }),`).

```ts
 *     website: url({ required: true, max: 2048, index: "by_website" }),
```

**3 — `url()` body, complete (anchor: `export function url<`).**

```ts
export function url<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(
  options?: UrlFieldInput<TCollectionSlug, TFieldMeta>,
): UrlField<TCollectionSlug, TFieldMeta> {
  return {
    type: ADMIN_FIELDS.url.type,
    interfaceType: ADMIN_FIELDS.url.interfaceType,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.url.defaultValue,
    ...options,

    min: resolveFieldLimit({
      limit: options?.min,
      defaultError: (value) => `Must be at least ${value} characters.`,
    }),
    max: resolveFieldLimit({
      limit: options?.max,
      defaultError: (value) => `Must be no more than ${value} characters.`,
    }),

    // Admin config with all defaults applied
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
```

(Step 8 later replaces `url/types.ts`'s import block wholesale to add `admin.mask`
support — its replacement body must keep `FieldLimit, FieldLimitInput` alongside
the `FieldAdminConfig`/`FieldAdminConfigInput`/`FieldMaskInput` additions it
introduces, or this step's `min`/`max` properties stop compiling.)

#### packages/core/src/fields/url/inputSchema.ts

**1 — JSDoc.** Add a paragraph noting `field.min`/`field.max` (character-length
constraints) are composed onto the `z.string()` chain before `.pipe(z.url())`,
so a too-short/too-long value reports the length message rather than "Invalid URL".

**2 — `urlFieldToInputSchema` body, complete (anchor: `export function urlFieldToInputSchema(props: { field: UrlField }): ZodType {`).**

```ts
export function urlFieldToInputSchema(props: { field: UrlField }): ZodType {
  const { field } = props;
  const requiredError = "This field is required.";

  let stringSchema = field.required
    ? z.string({ error: requiredError }).min(1, requiredError)
    : z.string();

  if (field.min) {
    stringSchema = stringSchema.min(field.min[0], field.min[1]);
  }
  if (field.max) {
    stringSchema = stringSchema.max(field.max[0], field.max[1]);
  }

  if (field.required) {
    return applyBaseInputSchemaMeta({
      field,
      inputSchema: stringSchema.pipe(z.url()),
    });
  }

  const inputSchema =
    field.defaultValue !== undefined
      ? z.union([stringSchema.pipe(z.url()), z.literal("")]).default(field.defaultValue)
      : stringSchema.pipe(z.url());

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
```

#### packages/core/src/fields/url/inputSchema.test.ts

**1 — new `describe("min/max length constraints", …)`, appended after the
existing `it("includes metadata (label, description)", …)` test.**

```ts
describe("min/max length constraints", () => {
  it("applies min length constraint", () => {
    const field = url({ required: true, min: 15 });
    const schema = urlFieldToInputSchema({ field });

    expect(schema.safeParse("https://example.com").success).toBe(true);
    expect(schema.safeParse("https://a.co").success).toBe(false);
  });

  it("applies max length constraint", () => {
    const field = url({ required: true, max: 20 });
    const schema = urlFieldToInputSchema({ field });

    expect(schema.safeParse("https://a.co").success).toBe(true);
    expect(schema.safeParse("https://example.com/very/long/path").success).toBe(false);
  });

  it("uses a custom min error message instead of the default when configured", () => {
    const field = url({ required: true, min: [15, "URL is too short."] });
    const schema = urlFieldToInputSchema({ field });

    const result = schema.safeParse("https://a.co");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("URL is too short.");
    }
  });

  it("uses a custom max error message instead of the default when configured", () => {
    const field = url({ required: true, max: [20, "URL is too long."] });
    const schema = urlFieldToInputSchema({ field });

    const result = schema.safeParse("https://example.com/very/long/path");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("URL is too long.");
    }
  });

  it("uses the default min error message when no custom message is configured", () => {
    const field = url({ required: true, min: 15 });
    const schema = urlFieldToInputSchema({ field });

    const result = schema.safeParse("https://a.co");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Must be at least 15 characters.");
    }
  });

  it("uses the default max error message when no custom message is configured", () => {
    const field = url({ required: true, max: 20 });
    const schema = urlFieldToInputSchema({ field });

    const result = schema.safeParse("https://example.com/very/long/path");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Must be no more than 20 characters.");
    }
  });
});
```

#### packages/core/src/fields/url/validator.ts

**1 — JSDoc `@example`** (anchor: `* const field3 = url({ min: { value: 10 }, max: { value: 2048 } })`).

```ts
 * const field3 = url({ min: 10, max: 2048 })
 * urlFieldToValidator({ field: field3 })  // "v.optional(v.string())"
```

#### packages/core/src/fields/url/validator.test.ts

**1 — new test, appended after the existing `"handles default field (optional with no constraints)"` test.**

```ts
it("ignores min/max constraints (enforced in form validation, not DB schema)", () => {
  const field = url({
    required: true,
    min: 10,
    max: 2048,
  });
  const validator = urlFieldToValidator({ field });

  expect(validator).toBe("v.string()");
});
```


Verify: pnpm typecheck && pnpm --filter @vexcms/core test -- fields && pnpm --filter @vexcms/react test -- fields

### Step 2 — `email()` field [agent]

- [x] `packages/core/src/fields/email/` — `types.ts`, `config.ts`, `validator.ts`, `inputSchema.ts` (format check), `index.ts` + `validator.test.ts`, `inputSchema.test.ts`
- [x] core registration: `fields/constants.ts` (`ADMIN_FIELDS.email`, `EmailFieldType`), `fields/types.ts` (`AdminField` union + `export * from "./email/types"`), `fields/index.ts` (`export * from "./email"`), `fields/validators/index.ts` + `fields/inputSchemas/index.ts` dispatch cases
- [x] `packages/core/src/collections/validator.ts` — widen `.searchIndex()` emission to a generic `"searchIndex" in field && field.searchIndex` check (covers `email` now; `textarea` in step 3 needs no further change here)
- [x] `packages/core/src/collections/validator.test.ts` — email `.searchIndex()` emission test
- [x] `packages/core/src/fields/baseTypes.ts` — `FieldSearchIndex` export, shared by `text`/`textarea`/`email`
- [x] `packages/core/src/fields/text/types.ts` — import `FieldSearchIndex` from `../baseTypes` instead of declaring it locally
- [x] `packages/core/src/types/generateVexTypes.test.ts` + `packages/core/src/schema/generateVexSchema.test.ts` — one case each proving `email()` round-trips through the generic (non-switching) type/schema gen paths
- [x] `packages/react/src/components/fields/email/` — `Input.tsx`, `Cell.tsx` (mailto link), `columnDef.tsx`, `testFixture.ts`, `index.ts` + `Input.test.tsx`, `Cell.test.tsx`, `columnDef.test.ts`
- [x] react registration: `components/fields/index.tsx` (`fieldInputComponents`, `fieldCellComponents`, `getCollectionColumnDefs` switch), `adapter.ts` (`fields` map), `src/index.ts` (`EmailFieldInput`/`EmailFieldCell` export), `testing/fixtures/index.ts` (`fieldFixtures.email`)

Why: leaf field; needed by masks (step 8) and dogfood; registering it touches every exhaustive registry.

`email()` mirrors `text()` almost exactly (same `BaseFieldInput`/`BaseField` shape, same `min`/`max` length semantics now built on step 1's `FieldLimitInput`/`FieldLimit`/`resolveFieldLimit`) with two differences: an email-format check composed onto the same Zod chain (`z.string().email({ error })`, chained — not piped — so it stacks with the length checks exactly like `min`/`max` do), and a Cell that links `mailto:` instead of showing plain text, following `url/Cell.tsx`'s `isTitleField`-switches-the-`href` pattern (not `text/Cell.tsx`'s link-only-when-title). `email()` also gets `searchIndex?: FieldSearchIndex` (the shared type already declared in `../baseTypes` — not duplicated here): `collections/validator.ts`'s search-index emission condition widens from a `field.type === ADMIN_FIELDS.text.type` check to the generic `"searchIndex" in field && field.searchIndex`, so this one change covers `email` now and `textarea` in step 3 with no further edits to that file.

`generateVexTypes.ts` and `generateVexSchema.ts` never switch on `field.type` for a plain string leaf field — `collectionConfigToInterface` reads `field.interfaceType` generically and `generateVexSchema` calls the already-updated `adminFieldToValidator` dispatcher — so those two files need no edits, only one new assertion each in their existing test files proving the generic path covers `email()` too.

#### packages/core/src/fields/baseTypes.ts

`text` already declares its own `searchIndex` shape inline twice (on `TextFieldInput` and
`TextField`). Since `email` needs the identical shape too, extract ONE named exported type —
`FieldSearchIndex` — into this shared module instead of duplicating it a third time, and have
`text`'s and `email`'s `*Input`/resolved interfaces reference it from here. `searchIndex` stays
per-field (NOT promoted to `BaseFieldInput`/`BaseField` — `json` doesn't get it); this is a type
dedup, not a new base option.

**1 — new `FieldSearchIndex` export, inserted after `FieldLimit`** (anchor: the blank line between
the `FieldLimit` type and the `ComponentHKT` JSDoc).

```ts
/**
 * Full-text search index configuration for a string field. Not a base field
 * option: only field types that declare their own `searchIndex` property
 * (`text`, `textarea`, `email`) accept it. The field it is defined on becomes
 * the index's `searchField`.
 *
 * @example
 * ```ts
 * title: text({ searchIndex: { name: "search_title", filterFields: ["status", "author"] } })
 * // Generates: .searchIndex("search_title", { searchField: "title", filterFields: ["status", "author"] })
 * ```
 */
export interface FieldSearchIndex {
  /** Search index name (must be unique within the collection). */
  name: string;
  /**
   * Fields to filter search results by.
   * String array — validated at runtime against collection field names.
   */
  filterFields: string[];
}
```

#### packages/core/src/fields/text/types.ts

**1 — import `FieldSearchIndex` from `../baseTypes` instead of declaring it locally**, anchored at
the existing `baseTypes` import:

```ts
import {
  BaseField,
  BaseFieldInput,
  FieldAdminConfig,
  FieldLimit,
  FieldLimitInput,
  FieldSearchIndex,
  FieldValidateProps,
} from "../baseTypes";
```

#### packages/core/src/fields/email/types.ts

```ts
import { ADMIN_FIELDS } from "../constants";
import {
  BaseField,
  BaseFieldInput,
  FieldLimit,
  FieldLimitInput,
  FieldSearchIndex,
  FieldValidateProps,
} from "../baseTypes";
import { VexResourceSlug } from "../../types";

/**
 * Configuration input for an `email()` field.
 *
 * Email fields store single-line email address strings. All properties are
 * optional; unset properties fall back to the defaults listed below.
 *
 * **Defaults applied by `email()`:**
 * ```ts
 * {
 *   type:     "email",
 *   label:    "",       // inferred from the field key by defineCollection
 *   required: false,    // field is optional by default
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "full",  // spans the full form width, not half
 *     cellAlignment: "left",  // text aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label is inferred from the key ("Contact Email")
 * contactEmail: email()
 *
 * // Required with a length cap and a database index
 * workEmail: email({ required: true, max: 254, index: "by_work_email" })
 *
 * // Custom length-error message via the [value, error] tuple
 * supportEmail: email({ min: [5, "That's too short to be an email."] })
 *
 * // Full-text searchable (partial matches, e.g. in a relationship picker)
 * email: email({ searchIndex: { name: "search_email", filterFields: [] } })
 * ```
 *
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`)
 */
export interface EmailFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TCollectionSlug, TFieldMeta> {
  /**
   * Pre-filled value shown in the admin form when creating a new field.
   * Does not apply to database values.
   */
  defaultValue?: string;
  /** Minimum character length, applied to the email string itself. */
  min?: FieldLimitInput;
  /** Maximum character length, applied to the email string itself. */
  max?: FieldLimitInput;
  /**
   * Create a full-text search index on this field.
   * The field this is defined on becomes the `searchField`.
   *
   * @see {@link FieldSearchIndex}
   */
  searchIndex?: FieldSearchIndex;
  /** Server-only async validation with `value` typed as `string`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string>): Promise<void> | void;
}

/**
 * Resolved configuration for an `email()` field, after all defaults are applied.
 *
 * This is the type that framework adapters and field components receive —
 * `fieldDef` in `InputComponentProps<EmailField>` and `CellComponentProps<EmailField>`
 * is this type.
 *
 * @see {@link EmailFieldInput} for the user-facing input type
 * @see {@link email} for the config function that produces this type
 */
export interface EmailField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.email.type;
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * `undefined` means no default is applied — the input starts empty.
   */
  defaultValue?: string;
  /** Resolved minimum character length, with a value-aware default error message. */
  min?: FieldLimit;
  /** Resolved maximum character length, with a value-aware default error message. */
  max?: FieldLimit;
  /** Full-text search index configuration for this field. @see {@link FieldSearchIndex} */
  searchIndex?: FieldSearchIndex;
  /** Server-only async validation with `value` typed as `string`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string>): Promise<void> | void;
}
```

#### packages/core/src/fields/email/config.ts

```ts
import { VexResourceSlug } from "../../types";
import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import { resolveFieldLimit } from "../utils";
import type { EmailFieldInput, EmailField } from "./types";

/**
 * Creates an email field with all defaults applied.
 *
 * Email fields store single-line email address strings, format-checked in
 * the admin form and on every server write. Common uses: contact emails,
 * author emails, newsletter sign-ups.
 *
 * Accepts {@link EmailFieldInput} (all optional) and returns {@link EmailField} with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"full"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - Email field configuration. All properties are optional.
 * @returns Resolved email field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { email, defineCollection } from '@vexcms/core'
 *
 * authors: defineCollection({
 *   fields: {
 *     // Minimal — label inferred from key ("Contact Email")
 *     contactEmail: email(),
 *
 *     // Required with a length cap and a database index
 *     workEmail: email({ required: true, max: 254, index: "by_work_email" }),
 *   }
 * })
 * ```
 *
 * @see {@link EmailFieldInput} for the full input type
 * @see {@link EmailField} for the resolved output type
 */
export function email<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(options?: EmailFieldInput<TCollectionSlug, TFieldMeta>): EmailField<TCollectionSlug, TFieldMeta> {
  return {
    type: ADMIN_FIELDS.email.type,
    interfaceType: ADMIN_FIELDS.email.interfaceType,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.email.defaultValue,
    ...options,

    min: resolveFieldLimit({
      limit: options?.min,
      defaultError: (value) => `Must be at least ${value} characters.`,
    }),
    max: resolveFieldLimit({
      limit: options?.max,
      defaultError: (value) => `Must be no more than ${value} characters.`,
    }),

    // Admin config with all defaults applied
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
```

#### packages/core/src/fields/email/validator.ts

```ts
import { ADMIN_FIELDS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { EmailField } from "./types";

/**
 * Converts an email field definition to a Convex schema validator string.
 *
 * Email fields are stored as plain strings in Convex — the email format is
 * enforced at the admin form layer and the server write pipeline (both via
 * {@link emailFieldToInputSchema}), not in the database schema. This
 * function generates only the type constraint.
 *
 * `min`/`max` are runtime validation constraints and do not affect the
 * generated Convex value type. The index property is handled separately by
 * the collection schema builder.
 *
 * @param props - Input props.
 * @param props.field - The resolved email field definition.
 * @returns Convex validator string: `"v.string()"` for required fields,
 * `"v.optional(v.string())"` for optional fields.
 *
 * @example
 * ```ts
 * const field1 = email({ required: true })
 * emailFieldToValidator({ field: field1 })  // "v.string()"
 *
 * const field2 = email({ required: false })
 * emailFieldToValidator({ field: field2 })  // "v.optional(v.string())"
 * ```
 *
 * @internal - Used by schema generation, not typically called by users
 */
export function emailFieldToValidator(props: { field: EmailField }): string {
  return applyBaseValidators({
    field: props.field,
    validator: ADMIN_FIELDS.email.validator,
  });
}

/**
 * Types an `email()` field's `validate()` against a real collection and
 * `DataModel`, with `value` fixed to `string` — the wrapper `fieldValidator`
 * for this field type. @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function emailValidator<
  TCollectionSlug extends CollectionSlug,
>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, string, EmailField>,
): FieldValidate<TCollectionSlug, string> {
  return fieldValidator<TCollectionSlug, string, EmailField>(slug, fn);
}
```

#### packages/core/src/fields/email/inputSchema.ts

```ts
import * as z from "zod";
import type { ZodType } from "zod";
import { EmailField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating an email field value in the admin form
 * and the server write pipeline.
 *
 * The email-format check (`.email()`) is chained onto the same `z.string()`
 * call as `min`/`max` — not `.pipe()`d after them — so every configured
 * check runs and reports together, matching `textFieldToInputSchema`'s
 * CORE-1 composition rule. A required field's emptiness is checked first
 * (`.min(1, requiredError)`) so a missing value reports "This field is
 * required." rather than the format error.
 *
 * A non-required field's empty string bypasses the format check entirely —
 * `z.union([emailSchema, z.literal("")])`, the same escape hatch
 * `urlFieldToInputSchema` uses — because an untouched admin-form input holds
 * `""`, not `undefined`, so `.default()` alone (which only fires on
 * `undefined`) can never save an empty optional email from failing
 * `.email()`.
 *
 * `min`/`max` read `field.min`/`field.max` directly as `[value, error]` —
 * `resolveFieldLimit` (step 1) already guarantees `error` is set whenever
 * the tuple is present, so no further fallback is needed here.
 *
 * @param props - Input props.
 * @param props.field - The resolved email field definition.
 * @returns A Zod schema enforcing required/length/email-format constraints and optionality.
 *
 * @example
 * ```ts
 * const field = email({ required: true, min: [5, "Too short."] })
 * emailFieldToInputSchema({ field })
 * // → required, min-length 5, format-checked string
 * ```
 */
export function emailFieldToInputSchema(props: { field: EmailField }): ZodType {
  const { field } = props;

  const requiredError = "This field is required.";
  const formatError = "Enter a valid email address.";

  if (field.required) {
    let inputSchema = z.string({ error: requiredError }).min(1, requiredError);
    if (field.min) {
      inputSchema = inputSchema.min(field.min[0], field.min[1]);
    }
    if (field.max) {
      inputSchema = inputSchema.max(field.max[0], field.max[1]);
    }
    return applyBaseInputSchemaMeta({
      field,
      inputSchema: inputSchema.email({ error: formatError }),
    });
  }

  let emailSchema = z.string().email({ error: formatError });
  if (field.min) {
    emailSchema = emailSchema.min(field.min[0], field.min[1]);
  }
  if (field.max) {
    emailSchema = emailSchema.max(field.max[0], field.max[1]);
  }

  return applyBaseInputSchemaMeta({
    field,
    inputSchema: z.union([emailSchema, z.literal("")]).default(field.defaultValue ?? ""),
  });
}
```

#### packages/core/src/fields/email/index.ts

```ts
export * from "./config";
export * from "./types";
export * from "./validator";
export * from "./inputSchema";
```

#### packages/core/src/fields/email/validator.test.ts

```ts
import { describe, it, expect } from "vitest";
import { email } from "./config";
import { emailFieldToValidator } from "./validator";

describe("emailFieldToValidator", () => {
  it("generates required string validator", () => {
    const field = email({ required: true, defaultValue: "test@example.com" });
    const validator = emailFieldToValidator({ field });

    expect(validator).toBe("v.string()");
  });

  it("generates optional string validator", () => {
    const field = email({ required: false, defaultValue: "" });
    const validator = emailFieldToValidator({ field });

    expect(validator).toBe("v.optional(v.string())");
  });

  it("ignores length constraints (enforced in form validation, not DB schema)", () => {
    const field = email({
      required: true,
      defaultValue: "test@example.com",
      min: 3,
      max: 100,
    });
    const validator = emailFieldToValidator({ field });

    expect(validator).toBe("v.string()");
  });

  it("handles default field (optional with no constraints)", () => {
    const field = email({ defaultValue: "" });
    const validator = emailFieldToValidator({ field });

    expect(validator).toBe("v.optional(v.string())");
  });
});
```

#### packages/core/src/fields/email/inputSchema.test.ts

```ts
import { describe, it, expect } from "vitest";
import { email } from "./config";
import { emailFieldToInputSchema } from "./inputSchema";

describe("emailFieldToInputSchema", () => {
  it("generates required schema — accepts a valid email", () => {
    const field = email({ required: true });
    const schema = emailFieldToInputSchema({ field });

    expect(schema.safeParse("a@b.com").success).toBe(true);
  });

  it("generates required schema — rejects a malformed email with a clear format message", () => {
    const field = email({ required: true });
    const schema = emailFieldToInputSchema({ field });

    const result = schema.safeParse("nope");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Enter a valid email address.");
    }
  });

  it("generates required schema — rejects non-strings", () => {
    const field = email({ required: true });
    const schema = emailFieldToInputSchema({ field });

    expect(schema.safeParse(123).success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
  });

  it("rejects a missing value on a required field with a 'required' message, not the format message", () => {
    const field = email({ required: true });
    const schema = emailFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("This field is required.");
    }
  });

  it("generates optional schema — accepts undefined and returns the default", () => {
    const field = email({ required: false, defaultValue: "" });
    const schema = emailFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("");
    }
  });

  it("generates optional schema — accepts an empty string without a format error", () => {
    const field = email({ required: false, defaultValue: "" });
    const schema = emailFieldToInputSchema({ field });

    expect(schema.safeParse("").success).toBe(true);
  });

  it("still enforces email format on an optional field once a non-empty value is supplied", () => {
    const field = email({ required: false, defaultValue: "" });
    const schema = emailFieldToInputSchema({ field });

    expect(schema.safeParse("nope").success).toBe(false);
    expect(schema.safeParse("a@b.com").success).toBe(true);
  });

  it("applies a min-length constraint with the default value-aware message", () => {
    const field = email({ required: true, min: 10 });
    const schema = emailFieldToInputSchema({ field });

    const result = schema.safeParse("a@b.co");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Must be at least 10 characters.");
    }
    expect(schema.safeParse("abcde@fg.com").success).toBe(true);
  });

  it("applies a max-length constraint with the default value-aware message", () => {
    const field = email({ required: true, max: 12 });
    const schema = emailFieldToInputSchema({ field });

    const result = schema.safeParse("abcdefgh@ij.com");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Must be no more than 12 characters.");
    }
    expect(schema.safeParse("abcde@fg.com").success).toBe(true);
  });

  it("uses custom [value, error] tuple messages instead of the defaults", () => {
    const field = email({ required: true, min: [10, "Too short!"], max: [12, "Too long!"] });
    const schema = emailFieldToInputSchema({ field });

    const shortResult = schema.safeParse("a@b.co");
    expect(shortResult.success).toBe(false);
    if (!shortResult.success) {
      expect(shortResult.error.issues[0].message).toBe("Too short!");
    }

    const longResult = schema.safeParse("abcdefgh@ij.com");
    expect(longResult.success).toBe(false);
    if (!longResult.success) {
      expect(longResult.error.issues[0].message).toBe("Too long!");
    }
  });

  it("includes metadata (label, description)", () => {
    const field = email({
      required: true,
      label: "Contact Email",
      description: "Primary contact address",
    });
    const schema = emailFieldToInputSchema({ field });

    expect(schema._def).toBeDefined();
  });
});
```

#### packages/core/src/fields/constants.ts

**1 — new `email` entry in `ADMIN_FIELDS`, inserted after `text` and before `url`.**

```ts
  text: {
    type: "text",
    interfaceType: "string",
    validator: "v.string()",
    defaultValue: "",
  },
  email: {
    type: "email",
    interfaceType: "string",
    validator: "v.string()",
    defaultValue: "",
  },
  url: {
    type: "url",
    interfaceType: "string",
    validator: "v.string()",
    defaultValue: "",
  },
```

**2 — new `EmailFieldType` alias, next to `TextFieldType`.**

```ts
/** Literal type `"text"` — the discriminant value on {@link TextField}. */
export type TextFieldType = typeof ADMIN_FIELDS.text.type;

/** Literal type `"email"` — the discriminant value on {@link EmailField}. */
export type EmailFieldType = typeof ADMIN_FIELDS.email.type;

/** Literal type `"url"` — the discriminant value on {@link UrlField}. */
export type UrlFieldType = typeof ADMIN_FIELDS.url.type;
```

#### packages/core/src/fields/types.ts

**1 — import `EmailField` and re-export its module, beside `TextField`'s.**

```ts
import { NumberField } from "./number";
import { TextField } from "./text";
import { EmailField } from "./email";
import { CheckboxField } from "./checkbox";
```

```ts
export * from "./text/types";
export * from "./email/types";
export * from "./number/types";
export * from "./checkbox/types";
export * from "./blocks/types";
```

**2 — add `EmailField` to the `AdminField` union, beside `TextField`.**

```ts
export type AdminField<TFieldMeta extends BaseFieldMeta = BaseFieldMeta> =
  | TextField<VexResourceSlug, TFieldMeta>
  | EmailField<VexResourceSlug, TFieldMeta>
  | NumberField<VexResourceSlug, TFieldMeta>
  | CheckboxField<VexResourceSlug, TFieldMeta>
  | DateField<VexResourceSlug, TFieldMeta>
  | SelectField<VexResourceSlug, TFieldMeta>
  | UrlField<VexResourceSlug, TFieldMeta>
  | ColorField<VexResourceSlug, TFieldMeta>
  | ArrayField<VexResourceSlug, ArrayType, TFieldMeta>
  | RelationshipField<VexResourceSlug, TFieldMeta>
  | UploadField<VexResourceSlug, TFieldMeta>
  | BlocksField<VexResourceSlug, TFieldMeta>
  | GroupField<VexResourceSlug, TFieldMeta>
  | RichTextField<VexResourceSlug, TFieldMeta>;
```

#### packages/core/src/fields/index.ts

**1 — new `export * from "./email";`, beside `"./text"`.**

```ts
export * from "./text";
export * from "./email";
export * from "./select";
```

#### packages/core/src/fields/validators/index.ts

**1 — import `emailFieldToValidator`, beside `textFieldToValidator`.**

```ts
import { textFieldToValidator } from "../text";
import { emailFieldToValidator } from "../email";
import { numberFieldToValidator } from "../number";
```

**2 — new `case` in the `switch`, beside `ADMIN_FIELDS.text.type`.**

```ts
    case ADMIN_FIELDS.text.type:
      return textFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.email.type:
      return emailFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.number.type:
```

#### packages/core/src/fields/inputSchemas/index.ts

**1 — import `emailFieldToInputSchema`, beside `textFieldToInputSchema`.**

```ts
import { textFieldToInputSchema } from "../text";
import { emailFieldToInputSchema } from "../email";
import { numberFieldToInputSchema } from "../number";
```

**2 — new `case` in the `switch`, beside `ADMIN_FIELDS.text.type`.**

```ts
    case ADMIN_FIELDS.text.type:
      return textFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.email.type:
      return emailFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.number.type:
```

#### packages/core/src/schema/generateVexSchema.test.ts

**1 — import `email` alongside the other field factories.**

```ts
import { url, text, email, number, checkbox, date, select } from "../fields";
```

**2 — new `it` appended to `describe("generateVexSchema — field validators", …)`, after the `select` case.**

```ts
  it("generates required email field as v.string()", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "authors",
          fields: { contactEmail: email({ required: true }) },
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).toContain("contactEmail: v.string()");
  });
```

#### packages/core/src/types/generateVexTypes.test.ts

**1 — import `email`, beside `text`.**

```ts
import { text } from "../fields/text/config";
import { email } from "../fields/email/config";
```

**2 — new `it` appended to `describe("generateVexTypes — document interfaces", …)`, after the last existing case.**

```ts
  it("generates an email field as a plain string, through the same generic interfaceType path as text", () => {
    const config = defineServerConfig({ config: defineConfig({
      collections: [
        defineCollection({
          slug: "authors",
          fields: { contactEmail: email({ required: true }) },
        }),
      ],
    }) })
    const output = generateVexTypes({ config });
    expect(output).toContain("contactEmail: string");
    expect(output).not.toContain("contactEmail?: string");
  });
```


#### packages/core/src/collections/validator.ts

Widen the `.searchIndex()` emission condition inside `collectionConfigToVexSchema` from a `text`-only
type check to a generic `searchIndex` property check, so `email` (and step 3's `textarea`) are covered
without any further edits to this file, anchored at the existing `ADMIN_FIELDS.text.type` check:

```ts
    if ("searchIndex" in field && field.searchIndex) {
      searchIndexes.push(`\t.searchIndex("${field.searchIndex.name}", {\n
        searchField: "${fieldKey}",
        filterFields: ${JSON.stringify(field.searchIndex.filterFields)}\n
      })`);
    }
```

Update the function's doc comment line describing this emission, anchored at the existing bullet:

```ts
 * - `.searchIndex()` for fields with `field.searchIndex` configured (`text`, `textarea`, `email`)
```

#### packages/core/src/collections/validator.test.ts

Add `email` to the fields import, anchored right after `text`:

```ts
import { email, text } from "../fields";
```

Add a new `it` block inside the `collectionConfigToVexSchema — auto search index` describe, anchored right after
the `"collection with multiple text searchIndexes and an incoming relationship emits all correctly"` test (before
that describe's closing `});`):

```ts
  it("emits .searchIndex() for an email field with searchIndex configured", () => {
    const users = defineCollection({
      slug: "users",
      fields: {
        name: text({ required: true }),
        contactEmail: email({
          searchIndex: { name: "search_contactEmail", filterFields: ["name"] },
        }),
      },
      admin: { useAsTitle: "name" },
    });
    const config = defineConfig({ collections: [users] });
    const output = collectionConfigToVexSchema({ collection: users, config });
    expect(output).toContain('.searchIndex("search_contactEmail"');
    expect(output).toContain('searchField: "contactEmail"');
    expect(output).toContain('filterFields: ["name"]');
  });
```


#### packages/react/src/components/fields/email/Input.tsx

```tsx
"use client";

import { type EmailField } from "@vexcms/core";
import { Input } from "../../ui/input";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError } from "../../form/FormError";

/**
 * Email field input component for the admin edit form.
 *
 * Built with `createFieldInput` — handles TanStack Form wiring automatically.
 * Renders a native `type="email"` input with `autoComplete="email"`; format
 * validation itself is enforced by `emailFieldToInputSchema` on submit, not
 * by the browser's built-in email validation (which this component disables
 * no constraint attributes are set beyond `type`/`autoComplete`).
 *
 * @example
 * ```tsx
 * <AppForm form={form}>
 *   <EmailFieldInput name="contactEmail" fieldDef={contactEmailField} readOnly={false} />
 * </AppForm>
 * ```
 */
export const EmailFieldInput = createFieldInput<string, {}, EmailField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel index={index} field={fieldDef} name={name} />
        <Input
          id={name}
          disabled={readOnly}
          type="email"
          autoComplete="email"
          value={field.state.value ?? ""}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          placeholder={fieldDef.admin.placeholder}
          readOnly={fieldDef.admin.readOnly}
          aria-required={fieldDef.required}
        />
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
```

#### packages/react/src/components/fields/email/Cell.tsx

```tsx
import { addLeadingSlash, TDocument, type CellComponentProps, type EmailField } from "@vexcms/core";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";

/**
 * Email field cell component for the data-table list view.
 *
 * Always renders the value as a `VexLink`. For title fields the link
 * navigates to the document edit page (matching every other title-field
 * cell); for non-title fields the link is a `mailto:` link to the address
 * itself. Null/undefined/empty values show an em-dash placeholder. Values
 * longer than 77 characters are truncated with the full address shown on
 * hover via the `title` attribute.
 *
 * @param props - Component props.
 * @param props.value - Raw email value from the document (may be null, undefined, or empty).
 * @param props.fieldDef - Resolved `EmailField` definition.
 * @param props.isTitleField - When `true`, renders an edit-page link instead of a `mailto:` link.
 * @returns The cell component for this field type.
 *
 * @example
 * ```tsx
 * <EmailFieldCell value={doc.contactEmail} fieldDef={contactEmailField} row={row} isTitleField={false} />
 * ```
 */
export function EmailFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<EmailField, TData>,
) {
  if (props.value === undefined || props.value === null || props.value === "") return <span>—</span>;
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);
  const href = props.isTitleField
    ? `${basePath}/${props.collection.slug}/${props.row.original._id}`
    : `mailto:${props.value}`;
  return (
    <VexLink href={href}>
      <span className="font-bold" title={props.value}>
        {props.value.length > 77 ? `${props.value.slice(0, 77)}...` : props.value}
      </span>
    </VexLink>
  );
}
```

#### packages/react/src/components/fields/email/columnDef.tsx

```tsx
import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, TDocument, EmailField } from "@vexcms/core";
import { EmailFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for an email field.
 *
 * Generates column config with proper typing, cell renderer, alignment,
 * and metadata. Uses the registered `EmailFieldCell` component for rendering.
 *
 * @param props - Column generation props.
 * @param props.fieldDef - Resolved email field definition.
 * @param props.fieldKey - Field key from `collection.fields`.
 * @param props.isTitleField - Whether this is the title field (`useAsTitle`).
 * @param props.collection - Parent collection config, forwarded to `EmailFieldCell` to build the edit link `href`.
 * @returns TanStack Table column definition.
 *
 * @example
 * ```ts
 * const column = emailFieldToColumnDef({
 *   fieldDef: collection.fields.contactEmail,
 *   fieldKey: "contactEmail",
 *   isTitleField: false,
 * });
 * ```
 */
export function emailFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: EmailField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
  type?: TData;
}): ColumnDef<TData, string> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as string | undefined;
      return (
        <EmailFieldCell<TData>
          value={value ?? ""}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },

    enableSorting: true,
    enableHiding: true,

    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
```

#### packages/react/src/components/fields/email/testFixture.ts

```ts
import { email, type EmailField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/**
 * `email` field fixture — drives `runFieldInputContractSuite` in
 * `components/fields/email/Input.test.tsx`.
 *
 * `required: true` with no `min`/`max` keeps `emailFieldToInputSchema`'s
 * `"This field is required."` message active for the base contract's
 * missing-value assertions.
 */
export const emailFieldFixture: FieldFixture<EmailField, string> = {
  fieldType: "email",
  fieldDef: email({ label: "Contact Email", required: true }),
  valid: "jane@example.com",
  invalid: undefined,
  empty: undefined,
};
```

#### packages/react/src/components/fields/email/index.ts

```ts
export * from "./Input";
export * from "./Cell";
export * from "./columnDef";
```

#### packages/react/src/components/fields/email/Input.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { adminFieldToInputSchema, email, type CollectionConfig, type EmailField } from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { emailFieldFixture } from "./testFixture";
import { EmailFieldInput } from "./Input";

/**
 * Mounts `EmailFieldInput` behind a real `useForm` + `<AppForm>`, wired with
 * the same real `adminFieldToInputSchema`-driven `onSubmit` validator the
 * generic factory uses internally — needed here (rather than the shared
 * fixture's fixed schema) because every boundary test below constructs and
 * submits its own `min`/`max`/`required` combination.
 */
function EmailValidationHarness(props: {
  fieldDef: EmailField;
  collection: CollectionConfig;
  initialValue: string | undefined;
}) {
  const form = useForm({
    defaultValues: { testField: props.initialValue },
    validators: {
      onSubmit: ({ value }) => {
        const schema = adminFieldToInputSchema({ field: props.fieldDef });
        const result = schema.safeParse(value.testField);
        if (result.success) return undefined;
        return { fields: { testField: result.error.issues[0]?.message ?? "Invalid value" } };
      },
    },
  });
  return (
    <AppForm form={form}>
      <EmailFieldInput
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={false}
      />
      <button type="submit">Submit</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: emailFieldFixture,
  Component: EmailFieldInput,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    async function submit(fieldDef: EmailField, value: string | undefined): Promise<string> {
      const user = userEvent.setup();
      const { container } = render(
        <EmailValidationHarness fieldDef={fieldDef} collection={collection} initialValue={value} />,
      );
      await user.click(screen.getByRole("button", { name: /submit/i }));
      return container.querySelector(".text-destructive")?.textContent ?? "";
    }

    describe("email: native input type, format validation, and length boundaries", () => {
      it('renders a native type="email" input', () => {
        render(
          <EmailValidationHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );
        const input = screen.getByLabelText("Contact Email", { exact: false });
        expect(input).toHaveAttribute("type", "email");
        expect(input).toHaveAttribute("autocomplete", "email");
      });

      it("accepts a well-formed email address", async () => {
        const fieldDef = email({ label: "Contact Email", required: true });
        expect(await submit(fieldDef, "jane@example.com")).toBe("");
      });

      it("rejects a malformed email address with a clear format message", async () => {
        const fieldDef = email({ label: "Contact Email", required: true });
        expect(await submit(fieldDef, "not-an-email")).toBe("Enter a valid email address.");
      });

      it("accepts a value at exactly the configured min length", async () => {
        const fieldDef = email({ label: "Contact Email", min: 12 });
        expect(await submit(fieldDef, "abcde@fg.com")).toBe("");
      });

      it("rejects a value below the min length with the default min-length message", async () => {
        const fieldDef = email({ label: "Contact Email", min: 10 });
        expect(await submit(fieldDef, "a@b.co")).toBe("Must be at least 10 characters.");
      });

      it("rejects a value over the max length with the default max-length message", async () => {
        const fieldDef = email({ label: "Contact Email", max: 12 });
        expect(await submit(fieldDef, "abcdefgh@ij.com")).toBe("Must be no more than 12 characters.");
      });

      it("required: a missing value fails with the required message, not the format message", async () => {
        const fieldDef = email({ label: "Contact Email", required: true });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it("optional: a missing value is accepted", async () => {
        const fieldDef = email({ label: "Contact Email" });
        expect(await submit(fieldDef, undefined)).toBe("");
      });
    });
  },
});
```

#### packages/react/src/components/fields/email/Cell.test.tsx

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite, withCellConfig } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { EmailFieldCell } from "./Cell";
import { emailFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: emailFieldFixture,
  Component: EmailFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("email: mailto link", () => {
      it("renders a mailto: link when isTitleField is false", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        const { container } = render(
          withCellConfig(
            <EmailFieldCell
              value={options.fixture.valid}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        const link = container.querySelector("a");
        expect(link).not.toBeNull();
        expect(link).toHaveAttribute("href", `mailto:${options.fixture.valid}`);
        expect(container).toHaveTextContent(options.fixture.valid);
      });

      it("renders a document edit link, not mailto:, when isTitleField is true", () => {
        const row = makeCellRow<TDocument>({
          fieldKey: "field",
          value: options.fixture.valid,
          id: "doc_1",
        });
        const { container } = render(
          withCellConfig(
            <EmailFieldCell
              value={options.fixture.valid}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={true}
              collection={collection}
            />,
          ),
        );
        const link = container.querySelector("a");
        expect(link).not.toBeNull();
        expect(link?.getAttribute("href")).not.toMatch(/^mailto:/);
        expect(link?.getAttribute("href")).toContain(collection.slug);
      });
    });
  },
});
```

#### packages/react/src/components/fields/email/columnDef.test.ts

```ts
import { runColumnDefSuite } from "../../../testing/columnDefSuite";
import { emailFieldFixture } from "./testFixture";

runColumnDefSuite({ fixture: emailFieldFixture });
```

#### packages/react/src/components/fields/index.tsx

**1 — import `EmailFieldCell`, `EmailFieldInput`, `emailFieldToColumnDef`, beside the `text` import.**

```ts
import { TextFieldCell, TextFieldInput, textFieldToColumnDef } from "./text";
import { EmailFieldCell, EmailFieldInput, emailFieldToColumnDef } from "./email";
import { NumberFieldCell, NumberFieldInput, numberFieldToColumnDef } from "./number";
```

**2 — barrel export, beside `"./text"`.**

```ts
export * from "./text";
export * from "./email";
export * from "./number";
```

**3 — new `fieldInputComponents` entry, beside `ADMIN_FIELDS.text.type`.**

```ts
  [ADMIN_FIELDS.text.type]: TextFieldInput as ComponentType<
    InputComponentProps<BaseFieldMeta, AdminField>
  >,
  [ADMIN_FIELDS.email.type]: EmailFieldInput as ComponentType<
    InputComponentProps<BaseFieldMeta, AdminField>
  >,
  [ADMIN_FIELDS.number.type]: NumberFieldInput as ComponentType<
    InputComponentProps<BaseFieldMeta, AdminField>
  >,
```

**4 — new `fieldCellComponents` entry, beside `ADMIN_FIELDS.text.type`.**

```ts
  [ADMIN_FIELDS.text.type]: TextFieldCell as ComponentType<CellComponentProps<AdminField>>,
  [ADMIN_FIELDS.email.type]: EmailFieldCell as ComponentType<CellComponentProps<AdminField>>,
  [ADMIN_FIELDS.number.type]: NumberFieldCell as ComponentType<CellComponentProps<AdminField>>,
```

**5 — new `case` in `getCollectionColumnDefs`'s `switch`, beside `ADMIN_FIELDS.text.type`.**

```ts
      case ADMIN_FIELDS.text.type:
        columnDefs.push(
          textFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.email.type:
        columnDefs.push(
          emailFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.number.type:
```

#### packages/react/src/adapter.ts

**1 — import `EmailFieldInput`, `EmailFieldCell`, beside `TextFieldInput`/`TextFieldCell`.**

```ts
import {
  TextFieldInput,
  TextFieldCell,
  EmailFieldInput,
  EmailFieldCell,
  NumberFieldCell,
  NumberFieldInput,
```

**2 — new `fields` map entry, beside `ADMIN_FIELDS.text.type`.**

```ts
    [ADMIN_FIELDS.text.type]: {
      input: TextFieldInput,
      cell: TextFieldCell,
    },
    [ADMIN_FIELDS.email.type]: {
      input: EmailFieldInput,
      cell: EmailFieldCell,
    },
    [ADMIN_FIELDS.number.type]: {
      input: NumberFieldInput,
      cell: NumberFieldCell,
    },
```

#### packages/react/src/index.ts

**1 — re-export the `email` config function, beside the other pass-through config functions.**

```ts
export { text, email, number, select, date, url, checkbox, defineConfig } from "@vexcms/core";
```

**2 — re-export the resolved `EmailField` type, beside `TextField`.**

```ts
export type {
  TextField,
  EmailField,
  NumberField,
  SelectField,
  DateField,
  UrlField,
  CheckboxField,
  AdminField,
  CollectionSlug,
  VexDocument,
  VexConfig,
  VexClientConfig,
  VexClientConfigInput,
  VexServerConfigInput,
  RelationshipPreviewProps,
} from "@vexcms/core";
```

**3 — re-export the `EmailFieldInput`/`EmailFieldCell` components, beside `TextFieldInput`/`TextFieldCell`. Core's own `EmailFieldInput` config-input type is intentionally NOT re-exported from this barrel — same collision this file already documents for `text` (line ~30): the name is claimed here by the React component.**

```ts
// Field components
export { TextFieldInput, TextFieldCell, EmailFieldInput, EmailFieldCell } from "./components/fields";
```

#### packages/react/src/testing/fixtures/index.ts

**1 — import `emailFieldFixture`, beside `textFieldFixture`.**

```ts
import { textFieldFixture } from "../../components/fields/text/testFixture";
import { emailFieldFixture } from "../../components/fields/email/testFixture";
import { numberFieldFixture } from "../../components/fields/number/testFixture";
```

**2 — registry entry, beside `text`.**

```ts
export const fieldFixtures: Record<AdminFieldType, FieldFixture> = {
  text: textFieldFixture,
  email: emailFieldFixture,
  number: numberFieldFixture,
  checkbox: checkboxFieldFixture,
  url: urlFieldFixture,
  color: colorFieldFixture,
  select: selectFieldFixture,
  date: dateFieldFixture,
  upload: uploadFieldFixture,
  relationship: relationshipFieldFixture,
  array: arrayFieldFixture,
  group: groupFieldFixture,
  blocks: blocksFieldFixture,
  richtext: richTextFieldFixture,
};
```

Verify: pnpm typecheck && pnpm --filter @vexcms/core test -- fields/email && pnpm --filter @vexcms/react test -- fields/email

### Step 3 — `textarea()` field [agent]

- [x] `packages/core/src/fields/textarea/` — `types.ts`, `config.ts`, `validator.ts`, `inputSchema.ts`, `index.ts` + `validator.test.ts` + `inputSchema.test.ts`
- [x] `packages/core/src/fields/constants.ts` — `ADMIN_FIELDS.textarea`
- [x] `packages/core/src/fields/types.ts` — `TextareaField` added to the `AdminField` union
- [x] `packages/core/src/fields/index.ts` — barrel export
- [x] `packages/core/src/fields/validators/index.ts` — dispatch case
- [x] `packages/core/src/fields/inputSchemas/index.ts` — dispatch case
- [x] `packages/core/src/collections/validator.test.ts` — textarea `.searchIndex()` emission test (no `validator.ts` change needed — step 2 already widened the emission condition generically)
- [x] `packages/core/src/types/generateVexTypes.test.ts` — textarea covered by type generation
- [x] `packages/core/src/schema/generateVexSchema.test.ts` — textarea covered by schema generation
- [x] `packages/react/src/components/fields/textarea/` — `Input.tsx` (`rows`, character counter), `Cell.tsx` (truncated to one line), `columnDef.tsx`, `testFixture.ts`, `index.ts` + `Input.test.tsx` + `Cell.test.tsx` + `columnDef.test.ts`
- [x] `packages/react/src/components/fields/index.tsx` — both registries + column-def switch
- [x] `packages/react/src/adapter.ts` — `fields` map entry
- [x] `packages/react/src/index.ts` — pass-through config export, resolved type export, component export
- [x] `packages/react/src/testing/fixtures/index.ts` — fixture registry entry

Why: leaf field with `rows` and text's min/max length semantics (uses step 1 limits), including `searchIndex` support mirrored from `text()`.

Verify: `pnpm typecheck && pnpm --filter @vexcms/core test -- fields/textarea && pnpm --filter @vexcms/react test -- fields/textarea`

#### packages/core/src/fields/textarea/types.ts

```ts
import { ADMIN_FIELDS } from "../constants";
import {
  BaseField,
  BaseFieldInput,
  FieldAdminConfig,
  FieldLimit,
  FieldLimitInput,
  FieldSearchIndex,
  FieldValidateProps,
} from "../baseTypes";
import { VexResourceSlug } from "../../types";

/**
 * Configuration input for a `textarea()` field.
 *
 * Textarea fields store multi-line string values — bios, descriptions,
 * internal notes, anything longer than a single-line `text()` field is
 * comfortable holding. All properties are optional; unset properties fall
 * back to the defaults listed below.
 *
 * **Defaults applied by `textarea()`:**
 * ```ts
 * {
 *   type:     "textarea",
 *   label:    "",       // inferred from the field key by defineCollection
 *   required: false,    // field is optional by default
 *   rows:     4,         // visible textarea rows
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "full",  // spans the full form width, not half
 *     cellAlignment: "left",  // text aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label is inferred from the key ("Bio")
 * bio: textarea()
 *
 * // Required with length validation and a taller textarea
 * bio: textarea({ required: true, min: 10, max: 500, rows: 8 })
 *
 * // Min/max with a custom error message
 * notes: textarea({ max: [280, "Keep it under 280 characters."] })
 * ```
 *
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`)
 */
export interface TextareaFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TCollectionSlug, TFieldMeta> {
  /**
   * Pre-filled value shown in the admin form when creating a new field.
   * Does not apply to database values
   */
  defaultValue?: string;
  /** Minimum character length config. */
  min?: FieldLimitInput;
  /** Maximum character length config. */
  max?: FieldLimitInput;
  /**
   * Visible textarea rows in the admin form.
   *
   * Default: `4`
   */
  rows?: number;
  /**
   * Create a full-text search index on this field.
   * The field this is defined on becomes the `searchField`.
   *
   * @see {@link FieldSearchIndex}
   */
  searchIndex?: FieldSearchIndex;
  validate?(props: FieldValidateProps<TCollectionSlug, string>): Promise<void> | void;
}

/**
 * Resolved configuration for a `textarea()` field, after all defaults are applied.
 *
 * This is the type that framework adapters and field components receive —
 * `fieldDef` in `InputComponentProps<TextareaField>` and `CellComponentProps<TextareaField>`
 * is this type.
 *
 * @see {@link TextareaFieldInput} for the user-facing input type
 * @see {@link textarea} for the config function that produces this type
 */
export interface TextareaField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.textarea.type;
  /** Display label shown in the admin form. Always set — inferred from the field key if not provided. */
  label: string;
  /** Whether this field is required in the database schema. */
  required: boolean;
  /** Resolved admin UI configuration with all defaults applied. */
  admin: FieldAdminConfig;
  /** Pre-filled value shown in the admin form when creating a new field. */
  defaultValue: string;
  /** Minimum allowed character length, resolved with a value-aware default error message. */
  min?: FieldLimit;
  /** Maximum allowed character length, resolved with a value-aware default error message. */
  max?: FieldLimit;
  /** Visible textarea rows in the admin form. */
  rows: number;
  /** Full-text search index configuration for this field. @see {@link FieldSearchIndex} */
  searchIndex?: FieldSearchIndex;
  validate?(props: FieldValidateProps<TCollectionSlug, string>): Promise<void> | void;
}
```

#### packages/core/src/fields/textarea/config.ts

```ts
import { VexResourceSlug } from "../../types";
import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import { resolveFieldLimit } from "../utils";
import type { TextareaFieldInput, TextareaField } from "./types";

/**
 * Creates a textarea field with all defaults applied.
 *
 * Textarea fields store multi-line string values.
 * Common uses: bios, descriptions, internal notes.
 *
 * Accepts {@link TextareaFieldInput} (all optional) and returns {@link TextareaField} with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `rows` — `4`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"full"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - Textarea field configuration. All properties are optional.
 * @returns Resolved textarea field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { textarea, defineCollection } from '@vexcms/core'
 *
 * authors: defineCollection({
 *   fields: {
 *     // Minimal — label inferred from key ("Bio")
 *     bio: textarea(),
 *
 *     // Required, length-limited, taller textarea
 *     bio: textarea({ required: true, min: 10, max: 500, rows: 8 }),
 *   }
 * })
 * ```
 *
 * @see {@link TextareaFieldInput} for the full input type
 * @see {@link TextareaField} for the resolved output type
 */
export function textarea<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(
  options?: TextareaFieldInput<TCollectionSlug, TFieldMeta>,
): TextareaField<TCollectionSlug, TFieldMeta> {
  return {
    type: ADMIN_FIELDS.textarea.type,
    interfaceType: ADMIN_FIELDS.textarea.interfaceType,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.textarea.defaultValue,
    ...options,

    min: resolveFieldLimit({
      limit: options?.min,
      defaultError: (value) => `Must be at least ${value} characters.`,
    }),
    max: resolveFieldLimit({
      limit: options?.max,
      defaultError: (value) => `Must be no more than ${value} characters.`,
    }),
    rows: options?.rows ?? 4,

    // Admin config with all defaults applied
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
```

#### packages/core/src/fields/textarea/validator.ts

```ts
import { ADMIN_FIELDS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { TextareaField } from "./types";

/**
 * Converts a textarea field definition to a Convex schema validator.
 *
 * Generates the appropriate v.string() or v.optional(v.string()) code
 * for the Convex schema based on the field's required property.
 *
 * **Important notes:**
 * - `min`/`max` are runtime validation constraints, NOT schema constraints
 * - They don't affect the generated Convex value type
 * - Validation happens in the admin panel (client Zod) and in every mutation
 *   built through `create`/`update` (server Zod, run via the shared write pipeline)
 * - The index property is handled separately by index collection logic
 *
 * This function is used by the CLI during schema generation to build
 * the Convex schema file.
 *
 * @param props - textareaFieldToValidator() input props
 * @param props.field - The textarea field definition
 * @returns Convex value type string: "v.string()" or "v.optional(v.string())"
 *
 * @example
 * ```ts
 * const field1 = textarea({ required: true })
 * textareaFieldToValidator({ field: field1 })  // "v.string()"
 *
 * const field2 = textarea({ required: false })
 * textareaFieldToValidator({ field: field2 })  // "v.optional(v.string())"
 *
 * const field3 = textarea({ min: 3, max: 100 })
 * textareaFieldToValidator({ field: field3 })  // "v.optional(v.string())"
 * // Note: Length constraints don't affect schema, handled at validation layer
 * ```
 *
 * @internal - Used by schema generation, not typically called by users
 */
export function textareaFieldToValidator(props: { field: TextareaField }): string {
  return applyBaseValidators({
    field: props.field,
    validator: ADMIN_FIELDS.textarea.validator,
  });
}

/**
 * Types a `textarea()` field's `validate()` against a real collection and
 * `DataModel`, with `value` fixed to `string` — the wrapper `fieldValidator`
 * for this field type. @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function textareaValidator<
  TCollectionSlug extends CollectionSlug,
>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, string, TextareaField>,
): FieldValidate<TCollectionSlug, string> {
  return fieldValidator<TCollectionSlug, string, TextareaField>(slug, fn);
}
```

#### packages/core/src/fields/textarea/inputSchema.ts

```ts
import * as z from "zod";
import type { ZodType } from "zod";
import { TextareaField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a textarea field value in the admin form.
 *
 * Applies `min`/`max` character-length constraints by composing them onto
 * the same schema chain built for `required`, rather than reassigning over
 * it — a required field with `min`/`max` configured keeps every check
 * (CORE-1, mirrored from `text`). Required fields attach
 * `{ error: "This field is required." }` to the base `z.string()` call and
 * add `.min(1, "This field is required.")` so a missing value and an
 * explicit empty string report the same message; they never receive
 * `.default()`, matching `applyBaseInputSchemaMeta`'s `.optional()` gate.
 * Non-required fields keep `.default(field.defaultValue)`. `field.min`/
 * `field.max` are already-resolved `FieldLimit` tuples (`[value, error]`) —
 * `resolveFieldLimit` (step 1) guarantees an error message, so neither
 * branch needs a fallback.
 *
 * @param props - Input props.
 * @param props.field - The resolved textarea field definition
 * @returns A Zod string schema with length constraints and optionality applied
 *
 * @example
 * ```ts
 * const field = textarea({ required: true, min: 3, max: 100 })
 * textareaFieldToInputSchema({ field })
 * // → z.string({ error: "This field is required." }).min(1, "...").min(3).max(100)
 * ```
 */
export function textareaFieldToInputSchema(props: { field: TextareaField }): ZodType {
  const { field } = props;

  const requiredError = "This field is required.";

  let inputSchema = field.required
    ? z.string({ error: requiredError }).min(1, requiredError)
    : z.string();

  if (field.min) {
    inputSchema = inputSchema.min(field.min[0], field.min[1]);
  }
  if (field.max) {
    inputSchema = inputSchema.max(field.max[0], field.max[1]);
  }

  const finalSchema: ZodType = field.required
    ? inputSchema
    : inputSchema.default(field.defaultValue);

  return applyBaseInputSchemaMeta({ field, inputSchema: finalSchema });
}
```

#### packages/core/src/fields/textarea/index.ts

```ts
// Re-export the factory function
export * from "./config";
export * from "./types";
export * from "./validator";
export * from "./inputSchema";
```

#### packages/core/src/fields/textarea/validator.test.ts

```ts
import { describe, it, expect } from "vitest";
import { textarea } from "./config";
import { textareaFieldToValidator } from "./validator";

describe("textareaFieldToValidator", () => {
  it("generates required string validator", () => {
    const field = textarea({ required: true, defaultValue: "test" });
    const validator = textareaFieldToValidator({ field });

    expect(validator).toBe("v.string()");
  });

  it("generates optional string validator", () => {
    const field = textarea({ required: false, defaultValue: "" });
    const validator = textareaFieldToValidator({ field });

    expect(validator).toBe("v.optional(v.string())");
  });

  it("ignores length constraints (enforced in form validation, not DB schema)", () => {
    const field = textarea({
      required: true,
      defaultValue: "test",
      min: 3,
      max: 100,
    });
    const validator = textareaFieldToValidator({ field });

    // Convex schema just validates type, not length
    expect(validator).toBe("v.string()");
  });

  it("handles default field (optional with no constraints)", () => {
    const field = textarea({ defaultValue: "" });
    const validator = textareaFieldToValidator({ field });

    expect(validator).toBe("v.optional(v.string())");
  });
});
```

#### packages/core/src/fields/textarea/inputSchema.test.ts

```ts
import { describe, it, expect } from "vitest";
import { textarea } from "./config";
import { textareaFieldToInputSchema } from "./inputSchema";

describe("textareaFieldToInputSchema", () => {
  it("generates required string schema", () => {
    const field = textarea({ required: true, defaultValue: "test" });
    const schema = textareaFieldToInputSchema({ field });

    expect(schema.safeParse("hello").success).toBe(true);
    expect(schema.safeParse(123).success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
  });

  it("generates optional string schema with default", () => {
    const field = textarea({ required: false, defaultValue: "" });
    const schema = textareaFieldToInputSchema({ field });

    expect(schema.safeParse("hello").success).toBe(true);

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("");
    }
  });

  it("applies min constraint", () => {
    const field = textarea({ required: true, defaultValue: "test", min: 3 });
    const schema = textareaFieldToInputSchema({ field });

    expect(schema.safeParse("abc").success).toBe(true);
    expect(schema.safeParse("abcd").success).toBe(true);
    expect(schema.safeParse("ab").success).toBe(false);
  });

  it("applies max constraint", () => {
    const field = textarea({ required: true, defaultValue: "test", max: 5 });
    const schema = textareaFieldToInputSchema({ field });

    expect(schema.safeParse("hello").success).toBe(true);
    expect(schema.safeParse("hi").success).toBe(true);
    expect(schema.safeParse("toolong").success).toBe(false);
  });

  it("applies the default min-length message when min is a bare number", () => {
    const field = textarea({ required: true, defaultValue: "test", min: 3 });
    const schema = textareaFieldToInputSchema({ field });

    const result = schema.safeParse("ab");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Must be at least 3 characters.");
    }
  });

  it("applies the default max-length message when max is a bare number", () => {
    const field = textarea({ required: true, defaultValue: "test", max: 5 });
    const schema = textareaFieldToInputSchema({ field });

    const result = schema.safeParse("toolong");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Must be no more than 5 characters.");
    }
  });

  it("applies min constraint with custom error", () => {
    const field = textarea({ required: true, defaultValue: "test", min: [3, "Too short"] });
    const schema = textareaFieldToInputSchema({ field });

    const result = schema.safeParse("ab");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Too short");
    }
  });

  it("applies max constraint with custom error", () => {
    const field = textarea({ required: true, defaultValue: "test", max: [5, "Too long"] });
    const schema = textareaFieldToInputSchema({ field });

    const result = schema.safeParse("toolong");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Too long");
    }
  });

  it("combines min and max constraints", () => {
    const field = textarea({ required: true, defaultValue: "test", min: 3, max: 10 });
    const schema = textareaFieldToInputSchema({ field });

    expect(schema.safeParse("abc").success).toBe(true);
    expect(schema.safeParse("abcdefghij").success).toBe(true);
    expect(schema.safeParse("ab").success).toBe(false);
    expect(schema.safeParse("abcdefghijk").success).toBe(false);
  });

  it("combines all constraints with custom errors", () => {
    const field = textarea({
      required: true,
      defaultValue: "test",
      min: [3, "Too short"],
      max: [10, "Too long"],
    });
    const schema = textareaFieldToInputSchema({ field });

    const minResult = schema.safeParse("ab");
    expect(minResult.success).toBe(false);
    if (!minResult.success) {
      expect(minResult.error.issues[0].message).toBe("Too short");
    }

    const maxResult = schema.safeParse("this is too long");
    expect(maxResult.success).toBe(false);
    if (!maxResult.success) {
      expect(maxResult.error.issues[0].message).toBe("Too long");
    }
  });

  it("applies optional after length constraints", () => {
    const field = textarea({ required: false, defaultValue: "", min: 5, max: 50 });
    const schema = textareaFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("");
    }

    expect(schema.safeParse("short").success).toBe(true);
    expect(schema.safeParse("hi").success).toBe(false); // Too short
  });

  it("includes metadata (label, description)", () => {
    const field = textarea({
      required: true,
      defaultValue: "test",
      label: "Notes",
      description: "Internal notes",
    });
    const schema = textareaFieldToInputSchema({ field });

    expect(schema._def).toBeDefined();
  });

  it("rejects a missing value on a required field with a 'required' message", () => {
    const field = textarea({ required: true, defaultValue: "test" });
    const schema = textareaFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });

  it("defaults rows to 4 when not configured", () => {
    const field = textarea();
    expect(field.rows).toBe(4);
  });

  it("honors a configured rows value", () => {
    const field = textarea({ rows: 8 });
    expect(field.rows).toBe(8);
  });

  describe("min/max on an optional field", () => {
    it("skips min/max when the value is omitted (undefined)", () => {
      const field = textarea({ min: 3, max: 5, defaultValue: "" });
      const schema = textareaFieldToInputSchema({ field });
      expect(schema.safeParse(undefined).success).toBe(true);
    });

    it("still enforces min/max once a non-empty value is supplied, even though the field is optional", () => {
      const field = textarea({ min: 3, max: 5, defaultValue: "" });
      const schema = textareaFieldToInputSchema({ field });
      expect(schema.safeParse("ab").success).toBe(false);
      expect(schema.safeParse("toolong").success).toBe(false);
      expect(schema.safeParse("abc").success).toBe(true);
    });
  });
});
```

#### packages/core/src/fields/constants.ts

Add a `textarea` entry to `ADMIN_FIELDS`, anchored right after the `email` entry step 2 added (before `url`):

```ts
  email: {
    type: "email",
    interfaceType: "string",
    validator: "v.string()",
    defaultValue: "",
  },
  textarea: {
    type: "textarea",
    interfaceType: "string",
    validator: "v.string()",
    defaultValue: "",
  },
  url: {
```

#### packages/core/src/fields/types.ts

Add the import, anchored beside the other field-type imports (after the `EmailField` import step 2 added):

```ts
import { TextField } from "./text";
import { EmailField } from "./email";
import { TextareaField } from "./textarea";
```

Add the re-export, anchored beside the other `*/types` re-exports (after `./email/types`, step 2):

```ts
export * from "./text/types";
export * from "./email/types";
export * from "./textarea/types";
export * from "./number/types";
```

Add `TextareaField` to the `AdminField` union, anchored right after the `EmailField` member step 2 added:

```ts
export type AdminField<TFieldMeta extends BaseFieldMeta = BaseFieldMeta> =
  | TextField<VexResourceSlug, TFieldMeta>
  | EmailField<VexResourceSlug, TFieldMeta>
  | TextareaField<VexResourceSlug, TFieldMeta>
  | NumberField<VexResourceSlug, TFieldMeta>
```

#### packages/core/src/fields/index.ts

Add the barrel export, anchored right after `export * from "./email";` (step 2):

```ts
export * from "./text";
export * from "./email";
export * from "./textarea";
export * from "./select";
```

#### packages/core/src/fields/validators/index.ts

Add the import, anchored right after the `emailFieldToValidator` import step 2 added:

```ts
import { textFieldToValidator } from "../text";
import { emailFieldToValidator } from "../email";
import { textareaFieldToValidator } from "../textarea";
import { numberFieldToValidator } from "../number";
```

Add the dispatch case, anchored right after the `email` case step 2 added:

```ts
    case ADMIN_FIELDS.text.type:
      return textFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.email.type:
      return emailFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.textarea.type:
      return textareaFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.number.type:
```

#### packages/core/src/fields/inputSchemas/index.ts

Add the import, anchored right after the `emailFieldToInputSchema` import step 2 added:

```ts
import { textFieldToInputSchema } from "../text";
import { emailFieldToInputSchema } from "../email";
import { textareaFieldToInputSchema } from "../textarea";
import { numberFieldToInputSchema } from "../number";
```

Add the dispatch case, anchored right after the `email` case step 2 added:

```ts
    case ADMIN_FIELDS.text.type:
      return textFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.email.type:
      return emailFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.textarea.type:
      return textareaFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.number.type:
```

#### packages/core/src/types/generateVexTypes.test.ts

Add the import, anchored right after the `email` import step 2 added:

```ts
import { text } from "../fields/text/config";
import { email } from "../fields/email/config";
import { textarea } from "../fields/textarea/config";
```

Add a new `it`, anchored right after the `email` test step 2 appended to the `generateVexTypes — document interfaces` describe (before that describe's closing `});`):

```ts
  it("generates an email field as a plain string, through the same generic interfaceType path as text", () => {
    const config = defineServerConfig({ config: defineConfig({
      collections: [
        defineCollection({
          slug: "authors",
          fields: { contactEmail: email({ required: true }) },
        }),
      ],
    }) })
    const output = generateVexTypes({ config });
    expect(output).toContain("contactEmail: string");
    expect(output).not.toContain("contactEmail?: string");
  });

  it("generates a textarea field as a plain string, through the same generic interfaceType path as text", () => {
    const config = defineServerConfig({ config: defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { body: textarea({ required: true }) },
        }),
      ],
    }) })
    const output = generateVexTypes({ config });
    expect(output).toContain("body: string");
    expect(output).not.toContain("body?: string");
  });
});
```

#### packages/core/src/schema/generateVexSchema.test.ts

Add `textarea` to the fields import, anchored right after `email` (step 2):

```ts
import { url, text, email, textarea, number, checkbox, date, select } from "../fields";
```

Add two new `it` blocks inside the `generateVexSchema — field validators` describe, anchored right after the `email` test step 2 appended (before that describe's closing `});`):

```ts
  it("generates required email field as v.string()", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "authors",
          fields: { contactEmail: email({ required: true }) },
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).toContain("contactEmail: v.string()");
  });

  it("generates required textarea field as v.string()", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { body: textarea({ required: true }) },
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).toContain("body: v.string()");
  });

  it("generates optional textarea field as v.optional(v.string())", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { notes: textarea({ required: false }) },
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).toContain("notes: v.optional(v.string())");
  });
});
```

#### packages/core/src/collections/validator.test.ts

Add `textarea` to the fields import, anchored right after `email` (step 2):

```ts
import { email, text, textarea } from "../fields";
```

Add a new `it` block inside the `collectionConfigToVexSchema — auto search index` describe, anchored right after
the email `.searchIndex()` test step 2 added (before that describe's closing `});`). No change to
`collections/validator.ts` itself — step 2 already widened its emission condition to the generic
`"searchIndex" in field && field.searchIndex` check, which covers `textarea` automatically:

```ts
  it("emits .searchIndex() for a textarea field with searchIndex configured", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: {
        title: text({ required: true }),
        body: textarea({
          searchIndex: { name: "search_body", filterFields: ["title"] },
        }),
      },
      admin: { useAsTitle: "title" },
    });
    const config = defineConfig({ collections: [posts] });
    const output = collectionConfigToVexSchema({ collection: posts, config });
    expect(output).toContain('.searchIndex("search_body"');
    expect(output).toContain('searchField: "body"');
    expect(output).toContain('filterFields: ["title"]');
  });
```

#### packages/react/src/components/fields/textarea/Input.tsx

```tsx
"use client";

import { type TextareaField } from "@vexcms/core";
import { Textarea } from "../../ui/textarea";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError } from "../../form/FormError";

/**
 * Textarea field input component for the admin edit form.
 *
 * Built with `createFieldInput` — handles TanStack Form wiring automatically.
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<string>`) from a `<form.Field>` render prop.
 *
 * Renders a `Textarea` sized by `fieldDef.rows`. When `fieldDef.max` is
 * configured, an `n/max` character counter is shown below the textarea,
 * right-aligned — the same markup `text/Input.tsx`'s counter (step 15)
 * reuses.
 *
 * The `name` prop is the field key from the collection config (e.g. `"bio"`).
 * It connects the input to the form field with that key in `form.defaultValues`.
 *
 * @example
 * ```tsx
 * // Inside CollectionEditView — AppForm provides context
 * <AppForm form={form}>
 *   <TextareaFieldInput name="bio" fieldDef={bioField} readOnly={false} />
 * </AppForm>
 *
 * // Explicit field prop — TypedFieldApi<string>, works outside AppForm
 * <form.Field name="bio">
 *   {(field) => (
 *     <TextareaFieldInput
 *       name="bio"
 *       fieldDef={bioField}
 *       readOnly={false}
 *       field={field}
 *     />
 *   )}
 * </form.Field>
 * ```
 */
export const TextareaFieldInput = createFieldInput<string, {}, TextareaField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    const value = field.state.value ?? "";
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel index={index} field={fieldDef} name={name} />
        <Textarea
          id={name}
          disabled={readOnly}
          rows={fieldDef.rows}
          value={value}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          placeholder={fieldDef.admin.placeholder}
          readOnly={fieldDef.admin.readOnly}
          aria-required={fieldDef.required}
        />
        {fieldDef.max && (
          <div className="flex justify-end">
            <span className="text-[0.8rem] text-muted-foreground">
              {value.length}/{fieldDef.max[0]}
            </span>
          </div>
        )}
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
```

#### packages/react/src/components/fields/textarea/Cell.tsx

```tsx
import { addLeadingSlash, TDocument, type CellComponentProps, type TextareaField } from "@vexcms/core";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";

/** Truncation threshold — matches `text/Cell.tsx`'s own cutoff. */
const TRUNCATE_LENGTH = 77;

/**
 * Textarea field cell component for the data-table list view.
 *
 * Collapses the multi-line value down to a single line (newlines and
 * repeated whitespace collapsed to a single space) before truncating —
 * a data-table row must never grow taller than one line for this field.
 * Null/undefined values show an em-dash placeholder. The full raw value is
 * kept on the `title` attribute for hover.
 *
 * @param props - Component props
 * @param props.value - Raw value from the document (may be null or undefined)
 * @param props.fieldDef - Resolved `TextareaField` definition
 * @returns The Cell Component for this field type
 *
 * @example
 * ```tsx
 * <TextareaFieldCell value={doc.bio} fieldDef={bioField} row={row} />
 * ```
 */
export function TextareaFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<TextareaField, TData>,
) {
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);
  if (props.value === undefined || props.value === null) return <span>—</span>;

  const singleLine = props.value.replace(/\s+/g, " ").trim();
  const display =
    singleLine.length > TRUNCATE_LENGTH ? `${singleLine.slice(0, TRUNCATE_LENGTH)}...` : singleLine;

  if (props.isTitleField) {
    return (
      <VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>
        <span className="font-bold" title={props.value}>
          {display}
        </span>
      </VexLink>
    );
  }
  return (
    <span title={props.value}>
      {display}
    </span>
  );
}
```

#### packages/react/src/components/fields/textarea/columnDef.tsx

```tsx
import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, TDocument, TextareaField } from "@vexcms/core";
import { TextareaFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a textarea field.
 *
 * Generates column config with proper typing, cell renderer, alignment,
 * and metadata. Uses the registered TextareaFieldCell component for rendering.
 *
 * @param props - Column generation props
 * @param props.fieldDef - Resolved textarea field definition
 * @param props.fieldKey - Field key from collection.fields
 * @param props.isTitleField - Whether this is the title field (useAsTitle)
 * @param props.collection - Parent collection config, forwarded to `TextareaFieldCell` to build the edit link `href`
 * @returns TanStack Table column definition
 *
 * @example
 * ```ts
 * const column = textareaFieldToColumnDef({
 *   fieldDef: collection.fields.bio,
 *   fieldKey: "bio",
 *   isTitleField: false,
 * });
 * ```
 */
export function textareaFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: TextareaField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
  type?: TData;
}): ColumnDef<TData, string> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as string | undefined;
      return (
        <TextareaFieldCell<TData>
          value={value ?? ""}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },

    // Enable sorting for all textarea fields
    enableSorting: true,

    // Enable hiding for all fields (user can toggle visibility)
    enableHiding: true,

    // Use field's cellAlignment config
    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
```

#### packages/react/src/components/fields/textarea/index.ts

```ts
export * from "./Input";
export * from "./Cell";
export * from "./columnDef";
```

#### packages/react/src/components/fields/textarea/testFixture.ts

```ts
import { textarea, type TextareaField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/**
 * `textarea` field fixture — drives `runFieldInputContractSuite` in
 * `components/fields/textarea/Input.test.tsx` and `runFieldCellContractSuite`
 * in `Cell.test.tsx`. `valid` is deliberately multi-line — it exercises the
 * Cell's single-line collapsing behavior.
 */
export const textareaFieldFixture: FieldFixture<TextareaField, string> = {
  fieldType: "textarea",
  fieldDef: textarea({ label: "Bio", required: true }),
  valid: "First line\nSecond line",
  invalid: undefined,
  empty: undefined,
};
```

#### packages/react/src/components/fields/textarea/Input.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { adminFieldToInputSchema, textarea, type CollectionConfig, type TextareaField } from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { textareaFieldFixture } from "./testFixture";
import { TextareaFieldInput } from "./Input";

/**
 * Mounts `TextareaFieldInput` behind a real `useForm` + `<AppForm>`, wired with
 * the same real `adminFieldToInputSchema`-driven `onSubmit` validator the
 * generic factory uses internally — needed here (rather than the shared
 * fixture's fixed schema) because every boundary test below constructs and
 * submits its own `min`/`max`/`required`/`rows` combination.
 */
function TextareaValidationHarness(props: {
  fieldDef: TextareaField;
  collection: CollectionConfig;
  initialValue: string | undefined;
}) {
  const form = useForm({
    defaultValues: { testField: props.initialValue },
    validators: {
      onSubmit: ({ value }) => {
        const schema = adminFieldToInputSchema({ field: props.fieldDef });
        const result = schema.safeParse(value.testField);
        if (result.success) return undefined;
        return { fields: { testField: result.error.issues[0]?.message ?? "Invalid value" } };
      },
    },
  });
  return (
    <AppForm form={form}>
      <TextareaFieldInput
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={false}
      />
      <button type="submit">Submit</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: textareaFieldFixture,
  Component: TextareaFieldInput,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    async function submit(fieldDef: TextareaField, value: string | undefined): Promise<string> {
      const user = userEvent.setup();
      const { container } = render(
        <TextareaValidationHarness fieldDef={fieldDef} collection={collection} initialValue={value} />,
      );
      await user.click(screen.getByRole("button", { name: /submit/i }));
      return container.querySelector(".text-destructive")?.textContent ?? "";
    }

    describe("textarea: length boundaries, rows, and the character counter", () => {
      it("accepts a value at exactly the configured min length", async () => {
        const fieldDef = textarea({ label: "Bio", min: 3 });
        expect(await submit(fieldDef, "x".repeat(3))).toBe("");
      });

      it("rejects a value one character below the min length with the default min-length message", async () => {
        const fieldDef = textarea({ label: "Bio", min: 3 });
        expect(await submit(fieldDef, "x".repeat(2))).toBe("Must be at least 3 characters.");
      });

      it("accepts a value at exactly the configured max length", async () => {
        const fieldDef = textarea({ label: "Bio", max: 10 });
        expect(await submit(fieldDef, "x".repeat(10))).toBe("");
      });

      it("rejects a value one character over the max length with the default max-length message", async () => {
        const fieldDef = textarea({ label: "Bio", max: 10 });
        expect(await submit(fieldDef, "x".repeat(11))).toBe("Must be no more than 10 characters.");
      });

      it("uses a custom min error message instead of the default when configured", async () => {
        const fieldDef = textarea({ label: "Bio", min: [5, "Bio needs at least 5 characters."] });
        expect(await submit(fieldDef, "x".repeat(4))).toBe("Bio needs at least 5 characters.");
      });

      it("uses a custom max error message instead of the default when configured", async () => {
        const fieldDef = textarea({ label: "Bio", max: [5, "Bio can be at most 5 characters."] });
        expect(await submit(fieldDef, "x".repeat(6))).toBe("Bio can be at most 5 characters.");
      });

      it("required + min (no max): a missing value fails with the required message", async () => {
        const fieldDef = textarea({ label: "Bio", required: true, min: 3 });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it('a plain required field with no min/max keeps "This field is required." for a missing value', async () => {
        const fieldDef = textarea({ label: "Bio", required: true });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it("an optional field with no min/max accepts a missing value", async () => {
        const fieldDef = textarea({ label: "Bio" });
        expect(await submit(fieldDef, undefined)).toBe("");
      });

      it("defaults rows to 4 and renders it as the textarea's rows attribute", () => {
        const fieldDef = textarea({ label: "Bio" });
        render(
          <TextareaValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );
        expect(screen.getByLabelText("Bio", { exact: false })).toHaveAttribute("rows", "4");
      });

      it("honors a configured rows value", () => {
        const fieldDef = textarea({ label: "Bio", rows: 10 });
        render(
          <TextareaValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );
        expect(screen.getByLabelText("Bio", { exact: false })).toHaveAttribute("rows", "10");
      });

      it("shows no character counter when max is not configured", () => {
        const fieldDef = textarea({ label: "Bio" });
        render(
          <TextareaValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue="hello"
          />,
        );
        expect(screen.queryByText(/^\d+\/\d+$/)).toBeNull();
      });

      it("shows an n/max character counter that updates as the user types, when max is configured", async () => {
        const user = userEvent.setup();
        const fieldDef = textarea({ label: "Bio", max: 20 });
        render(
          <TextareaValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );
        expect(screen.getByText("0/20")).toBeInTheDocument();
        await user.type(screen.getByLabelText("Bio", { exact: false }), "hello");
        expect(screen.getByText("5/20")).toBeInTheDocument();
      });

      it("never client-side truncates or rejects a value past max — enforcement is deferred to the schema on submit", async () => {
        const user = userEvent.setup();
        const fieldDef = textarea({ label: "Bio", max: 5 });
        render(
          <TextareaValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );

        const input = screen.getByLabelText("Bio", { exact: false });
        await user.type(input, "way too long for max");
        expect(input).toHaveValue("way too long for max");
      });
    });
  },
});
```

#### packages/react/src/components/fields/textarea/Cell.test.tsx

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite, withCellConfig } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { TextareaFieldCell } from "./Cell";
import { textareaFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: textareaFieldFixture,
  Component: TextareaFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("textarea: collapses multi-line content to one line", () => {
      it("renders no raw newlines when the stored value is multi-line", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        const { container } = render(
          withCellConfig(
            <TextareaFieldCell
              value={options.fixture.valid}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(container.querySelector("a")).toBeNull();
        expect(container.textContent).not.toContain("\n");
        expect(container.textContent).toContain("First line Second line");
      });
    });
  },
});
```

#### packages/react/src/components/fields/textarea/columnDef.test.ts

```ts
import { runColumnDefSuite } from "../../../testing/columnDefSuite";
import { textareaFieldFixture } from "./testFixture";

runColumnDefSuite({ fixture: textareaFieldFixture });
```

#### packages/react/src/components/fields/index.tsx

Add the import, anchored right after the `email` import step 2 added:

```ts
import { TextFieldCell, TextFieldInput, textFieldToColumnDef } from "./text";
import { EmailFieldCell, EmailFieldInput, emailFieldToColumnDef } from "./email";
import { TextareaFieldCell, TextareaFieldInput, textareaFieldToColumnDef } from "./textarea";
```

Add the barrel export, anchored right after `export * from "./email";` (step 2):

```ts
export * from "./text";
export * from "./email";
export * from "./textarea";
```

Add the `fieldInputComponents` entry, anchored right after the `ADMIN_FIELDS.email.type` entry step 2 added:

```ts
  [ADMIN_FIELDS.text.type]: TextFieldInput as ComponentType<
    InputComponentProps<BaseFieldMeta, AdminField>
  >,
  [ADMIN_FIELDS.email.type]: EmailFieldInput as ComponentType<
    InputComponentProps<BaseFieldMeta, AdminField>
  >,
  [ADMIN_FIELDS.textarea.type]: TextareaFieldInput as ComponentType<
    InputComponentProps<BaseFieldMeta, AdminField>
  >,
```

Add the `fieldCellComponents` entry, anchored right after the `ADMIN_FIELDS.email.type` entry step 2 added:

```ts
  [ADMIN_FIELDS.text.type]: TextFieldCell as ComponentType<CellComponentProps<AdminField>>,
  [ADMIN_FIELDS.email.type]: EmailFieldCell as ComponentType<CellComponentProps<AdminField>>,
  [ADMIN_FIELDS.textarea.type]: TextareaFieldCell as ComponentType<CellComponentProps<AdminField>>,
```

Add the `getCollectionColumnDefs` switch case, anchored right after the `email` case step 2 added:

```ts
      case ADMIN_FIELDS.text.type:
        columnDefs.push(
          textFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.email.type:
        columnDefs.push(
          emailFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.textarea.type:
        columnDefs.push(
          textareaFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.number.type:
```

#### packages/react/src/adapter.ts

Add to the `./components` import list, anchored right after `EmailFieldInput, EmailFieldCell` (step 2):

```ts
  TextFieldInput,
  TextFieldCell,
  EmailFieldInput,
  EmailFieldCell,
  TextareaFieldInput,
  TextareaFieldCell,
  NumberFieldCell,
  NumberFieldInput,
```

Add the `fields` map entry, anchored right after the `ADMIN_FIELDS.email.type` entry step 2 added:

```ts
    [ADMIN_FIELDS.text.type]: {
      input: TextFieldInput,
      cell: TextFieldCell,
    },
    [ADMIN_FIELDS.email.type]: {
      input: EmailFieldInput,
      cell: EmailFieldCell,
    },
    [ADMIN_FIELDS.textarea.type]: {
      input: TextareaFieldInput,
      cell: TextareaFieldCell,
    },
    [ADMIN_FIELDS.number.type]: {
      input: NumberFieldInput,
      cell: NumberFieldCell,
    },
```

#### packages/react/src/index.ts

Add `textarea` to the pass-through config export, anchored at the line step 2 updated:

```ts
export { text, email, textarea, number, select, date, url, checkbox, defineConfig } from "@vexcms/core";
```

Add `TextareaField` to the resolved-type export block, anchored right after `EmailField` (step 2):

```ts
export type {
  TextField,
  EmailField,
  TextareaField,
  NumberField,
```

Add the component export, anchored at the line step 2 updated:

```ts
export { TextFieldInput, TextFieldCell, EmailFieldInput, EmailFieldCell, TextareaFieldInput, TextareaFieldCell } from "./components/fields";
```

#### packages/react/src/testing/fixtures/index.ts

Add the import, anchored right after the `email` fixture import step 2 added:

```ts
import { textFieldFixture } from "../../components/fields/text/testFixture";
import { emailFieldFixture } from "../../components/fields/email/testFixture";
import { textareaFieldFixture } from "../../components/fields/textarea/testFixture";
```

Add the registry entry, anchored right after `email: emailFieldFixture,` (step 2) — full updated registry:

```ts
export const fieldFixtures: Record<AdminFieldType, FieldFixture> = {
  text: textFieldFixture,
  email: emailFieldFixture,
  textarea: textareaFieldFixture,
  number: numberFieldFixture,
  checkbox: checkboxFieldFixture,
  url: urlFieldFixture,
  color: colorFieldFixture,
  select: selectFieldFixture,
  date: dateFieldFixture,
  upload: uploadFieldFixture,
  relationship: relationshipFieldFixture,
  array: arrayFieldFixture,
  group: groupFieldFixture,
  blocks: blocksFieldFixture,
  richtext: richTextFieldFixture,
};
```

### Step 4 — `json()` field [agent]

- [x] `packages/core/src/fields/json/` — types, config, validator, inputSchema (`v.any()` storage, interfaceType `unknown`), index + tests
- [x] core registration: `constants.ts` (`ADMIN_FIELDS.json`), `fields/types.ts` (`AdminField` union), `fields/index.ts` barrel, `validators/index.ts` + `inputSchemas/index.ts` dispatch, `collections/interfaceGen.test.ts` + `schema/generateVexSchema.test.ts` (type-gen/schema-gen integration coverage)
- [x] `packages/react/src/components/ui/JsonEditor.tsx` + `JsonEditorView.tsx` — CodeMirror 6 JSON editor (syntax highlighting, line numbers, fold/lint gutters, lint diagnostics), lazy-loaded behind `React.lazy`/`Suspense` with a `<Textarea>` fallback so `@codemirror/*` never lands in the main bundle; `packages/react/src/components/fields/json/` — Input (parse-on-change, local parse-error state, Format button, read-only `JsonEditor`), Cell (truncated `JSON.stringify` preview), `utils.ts` (`stringifyJsonFieldValue`/`parseJsonFieldText`), columnDef, testFixture, index + tests
- [x] catalog/`package.json`: `@codemirror/{commands,lang-json,language,lint,state,view}`, `@lezer/highlight`
- [x] `testing/fieldInputContract.ts`: `renderField` polls (`waitForStableRender`) past a lazy-loaded control's Suspense fallback; `setControlValue`/`expectControlValue`/`hasInertSignal`-adjacent helpers handle `contenteditable` controls (jsdom doesn't implement `isContentEditable`, so attribute-checked) for CodeMirror's `.cm-content`

Why: leaf field; `v.any()` storage, parse-checked input, truncated cell preview.

#### packages/core/src/fields/json/types.ts

```ts
import type { BaseField, BaseFieldInput, FieldValidateProps } from "../baseTypes";
import type { VexResourceSlug } from "../../types";
import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";

/**
 * Configuration input for a `json()` field.
 *
 * Json fields store arbitrary JSON-serializable values — settings blobs,
 * feature flags, raw API payloads, anything with no fixed shape. There is no
 * shape/schema option: shape checks go through the field's own server
 * `validate()`. All properties are optional; unset properties fall back to
 * the defaults listed below.
 *
 * **Defaults applied by `json()`:**
 * ```ts
 * {
 *   type:     "json",
 *   label:    "",        // inferred from the field key by defineCollection
 *   required: false,     // field is optional by default
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "full",  // spans the full form width, not half
 *     cellAlignment: "left",  // preview aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label inferred from the key ("Settings")
 * settings: json()
 *
 * // Required, with a seeded default shown in the admin form
 * theme: json({ required: true, defaultValue: { mode: "dark" } })
 * ```
 *
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`, `searchIndex`)
 */
export interface JsonFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
> extends BaseFieldInput<TCollectionSlug, TFieldMeta> {
  /**
   * Pre-filled value shown in the admin form when creating a new field.
   * Does not apply to database values.
   */
  defaultValue?: unknown;
  /** Server-only async validation with `value` typed as `unknown`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, unknown>): Promise<void> | void;
}

/**
 * Resolved configuration for a `json()` field, after all defaults are applied.
 *
 * This is the type that framework adapters and field components receive —
 * `fieldDef` in `InputComponentProps<JsonField>` and `CellComponentProps<JsonField>`
 * is this type.
 *
 * @see {@link JsonFieldInput} for the user-facing input type
 * @see {@link json} for the config function that produces this type
 */
export interface JsonField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.json.type;
  /**
   * Pre-filled value shown in the admin form when creating a new field.
   * Does not apply to database values.
   */
  defaultValue?: unknown;
  /** Server-only async validation with `value` typed as `unknown`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, unknown>): Promise<void> | void;
}
```

#### packages/core/src/fields/json/config.ts

```ts
import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import type { VexResourceSlug } from "../../types";
import type { JsonFieldInput, JsonField } from "./types";

/**
 * Creates a json field with all defaults applied.
 *
 * Json fields store arbitrary JSON-serializable values with no fixed shape —
 * settings blobs, feature flags, raw API payloads. Shape checks are not part
 * of this field type; use the field's own server `validate()` for that.
 *
 * Accepts {@link JsonFieldInput} (all optional) and returns {@link JsonField} with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `defaultValue` — `undefined`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"full"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - Json field configuration. All properties are optional.
 * @returns Resolved json field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { json, defineCollection } from '@vexcms/core'
 *
 * siteSettings: defineCollection({
 *   fields: {
 *     metadata: json({ label: "Raw Metadata" }),
 *   }
 * })
 * ```
 *
 * @see {@link JsonFieldInput} for the full input type
 * @see {@link JsonField} for the resolved output type
 */
export function json<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(options?: JsonFieldInput<TCollectionSlug, TFieldMeta>): JsonField<TCollectionSlug, TFieldMeta> {
  return {
    type: ADMIN_FIELDS.json.type,
    interfaceType: ADMIN_FIELDS.json.interfaceType,

    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.json.defaultValue,
    ...options,

    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      placeholder: "",
      ...options?.admin,
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
```

#### packages/core/src/fields/json/validator.ts

```ts
import { ADMIN_FIELDS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { JsonField } from "./types";

/**
 * Converts a json field definition to a Convex schema validator.
 *
 * Generates `v.any()` or `v.optional(v.any())` based on the field's
 * `required` property — json stores arbitrary JSON-serializable values with
 * no shape constraint at the schema level.
 *
 * @param props - jsonFieldToValidator() input props
 * @param props.field - The json field definition
 * @returns Convex value type string: "v.any()" or "v.optional(v.any())"
 *
 * @example
 * ```ts
 * const field1 = json({ required: true })
 * jsonFieldToValidator({ field: field1 })  // "v.any()"
 *
 * const field2 = json({ required: false })
 * jsonFieldToValidator({ field: field2 })  // "v.optional(v.any())"
 * ```
 *
 * @internal - Used by schema generation, not typically called by users
 */
export function jsonFieldToValidator(props: { field: JsonField }): string {
  return applyBaseValidators({
    field: props.field,
    validator: ADMIN_FIELDS.json.validator,
  });
}

/**
 * Types a `json()` field's `validate()` against a real collection and
 * `DataModel`, with `value` fixed to `unknown` — the wrapper `fieldValidator`
 * for this field type. @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function jsonValidator<
  TCollectionSlug extends CollectionSlug,
>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, unknown, JsonField>,
): FieldValidate<TCollectionSlug, unknown> {
  return fieldValidator<TCollectionSlug, unknown, JsonField>(slug, fn);
}
```

#### packages/core/src/fields/json/inputSchema.ts

```ts
import * as z from "zod";
import type { ZodType } from "zod";
import { JsonField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a json field value in the admin form.
 *
 * There is no shape validation — any JSON-serializable value passes. A
 * required field rejects `undefined`/`null` with "This field is required.";
 * a non-required field accepts a missing value and falls back to
 * `field.defaultValue`.
 *
 * @param props - Input props.
 * @param props.field - The resolved json field definition
 * @returns A Zod schema accepting any defined, non-null value when required
 *
 * @example
 * ```ts
 * const field = json({ required: true })
 * jsonFieldToInputSchema({ field })
 * // → z.unknown().refine(...) — rejects undefined/null with "This field is required."
 * ```
 */
export function jsonFieldToInputSchema(props: { field: JsonField }): ZodType {
  const { field } = props;
  const requiredError = "This field is required.";

  const inputSchema: ZodType = field.required
    ? z.unknown().refine((value) => value !== undefined && value !== null, requiredError)
    : z.unknown();

  const finalSchema: ZodType = field.required
    ? inputSchema
    : inputSchema.default(field.defaultValue);

  return applyBaseInputSchemaMeta({ field, inputSchema: finalSchema });
}
```

#### packages/core/src/fields/json/index.ts

```ts
export * from "./config";
export * from "./types";
export * from "./validator";
export * from "./inputSchema";
```

#### packages/core/src/fields/json/config.test.ts

```ts
import { describe, it, expect } from "vitest";
import { json } from "./config";
import { ADMIN_FIELDS } from "../constants";

describe("json()", () => {
  it("defaults type, interfaceType, and required", () => {
    const field = json();
    expect(field.type).toBe("json");
    expect(field.interfaceType).toBe("unknown");
    expect(field.required).toBe(false);
    expect(field.defaultValue).toBeUndefined();
  });

  it("applies admin defaults", () => {
    const field = json();
    expect(field.admin).toMatchObject({
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
    });
  });

  it("carries required and label through to the resolved field", () => {
    const field = json({ label: "Settings", required: true });
    expect(field.label).toBe("Settings");
    expect(field.required).toBe(true);
  });

  it("matches ADMIN_FIELDS.json's declared type/interfaceType/validator", () => {
    expect(ADMIN_FIELDS.json.type).toBe("json");
    expect(ADMIN_FIELDS.json.interfaceType).toBe("unknown");
    expect(ADMIN_FIELDS.json.validator).toBe("v.any()");
  });
});
```

#### packages/core/src/fields/json/validator.test.ts

```ts
import { describe, it, expect } from "vitest";
import { json } from "./config";
import { jsonFieldToValidator } from "./validator";

describe("jsonFieldToValidator", () => {
  it("generates required v.any() validator", () => {
    const field = json({ required: true });
    expect(jsonFieldToValidator({ field })).toBe("v.any()");
  });

  it("generates optional v.optional(v.any()) validator", () => {
    const field = json({ required: false });
    expect(jsonFieldToValidator({ field })).toBe("v.optional(v.any())");
  });

  it("ignores value shape — a plain object and a plain array produce the same validator", () => {
    const objectField = json({ required: true, defaultValue: { a: 1 } });
    const arrayField = json({ required: true, defaultValue: [1, 2, 3] });
    expect(jsonFieldToValidator({ field: objectField })).toBe("v.any()");
    expect(jsonFieldToValidator({ field: arrayField })).toBe("v.any()");
  });
});
```

#### packages/core/src/fields/json/inputSchema.test.ts

```ts
import { describe, it, expect } from "vitest";
import { json } from "./config";
import { jsonFieldToInputSchema } from "./inputSchema";

describe("jsonFieldToInputSchema", () => {
  it("accepts any defined, non-null value", () => {
    const field = json({ required: false });
    const schema = jsonFieldToInputSchema({ field });

    expect(schema.safeParse({ a: 1 }).success).toBe(true);
    expect(schema.safeParse([1, 2, 3]).success).toBe(true);
    expect(schema.safeParse("hello").success).toBe(true);
    expect(schema.safeParse(42).success).toBe(true);
    expect(schema.safeParse(false).success).toBe(true);
  });

  it("accepts a missing value when not required", () => {
    const field = json({ required: false });
    const schema = jsonFieldToInputSchema({ field });

    expect(schema.safeParse(undefined).success).toBe(true);
  });

  it("rejects a missing value on a required field with a 'required' message", () => {
    const field = json({ required: true });
    const schema = jsonFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });

  it("rejects null on a required field with the same 'required' message", () => {
    const field = json({ required: true });
    const schema = jsonFieldToInputSchema({ field });

    const result = schema.safeParse(null);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });

  it("accepts a defined, non-null value on a required field", () => {
    const field = json({ required: true });
    const schema = jsonFieldToInputSchema({ field });

    expect(schema.safeParse({ theme: "dark" }).success).toBe(true);
  });

  it("includes metadata (label, description)", () => {
    const field = json({
      required: true,
      label: "Settings",
      description: "Raw config.",
    });
    const schema = jsonFieldToInputSchema({ field });

    expect(schema._def).toBeDefined();
  });
});
```

#### packages/core/src/fields/constants.ts

**1 edit — add the `json` entry to `ADMIN_FIELDS`, anchored right after the existing `richtext` entry.**

```ts
  richtext: {
    type: "richtext",
    interfaceType: "RichTextDocument",
    validator: "v.array(\nv.any()\n)",
    defaultValue: [],
  },
  json: {
    type: "json",
    interfaceType: "unknown",
    validator: "v.any()",
    defaultValue: undefined,
  },
} as const;
```

#### packages/core/src/fields/types.ts

**1 edit — import `JsonField` and add it to the `AdminField` union, anchored after the `TextareaField` import and the union's `TextareaField<...>` member added by step 3 (`textarea()`).**

```ts
import { TextareaField } from "./textarea";
import { JsonField } from "./json";
```

```ts
  | RichTextField<VexResourceSlug, TFieldMeta>
  | TextareaField<VexResourceSlug, TFieldMeta>
  | JsonField<VexResourceSlug, TFieldMeta>;
```

#### packages/core/src/fields/index.ts

**1 edit — new barrel export, anchored after the existing `export * from "./richtext";` line.**

```ts
export * from "./richtext";
export * from "./json";
```

#### packages/core/src/fields/validators/index.ts

**2 edits.**

**1 — import, anchored after the `textareaFieldToValidator` import added by step 3.**

```ts
import { textareaFieldToValidator } from "../textarea";
import { jsonFieldToValidator } from "../json";
```

**2 — switch case, anchored before the `default:` arm, after the `ADMIN_FIELDS.textarea.type` case added by step 3 (now the last case before `default`).**

```ts
    case ADMIN_FIELDS.textarea.type:
      return textareaFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.json.type:
      return jsonFieldToValidator({ field: props.field });
    default: {
```

#### packages/core/src/fields/inputSchemas/index.ts

**2 edits.**

**1 — import, anchored after the `textareaFieldToInputSchema` import added by step 3.**

```ts
import { textareaFieldToInputSchema } from "../textarea";
import { jsonFieldToInputSchema } from "../json";
```

**2 — switch case, anchored before the `default:` arm, after the `ADMIN_FIELDS.textarea.type` case added by step 3 (now the last case before `default`).**

```ts
    case ADMIN_FIELDS.textarea.type:
      return textareaFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.json.type:
      return jsonFieldToInputSchema({ field: effectiveField });
    default: {
```

#### packages/core/src/collections/interfaceGen.test.ts

**3 edits.**

**1 — import, anchored after the existing `upload` field import.**

```ts
import { upload } from "../fields/upload/config";
import { json } from "../fields/json/config";
```

**2 — new `it`, anchored inside the `describe("ADMIN_FIELDS — interfaceType", ...)` block, after the `select maps to string[]` test.**

```ts
  it("select maps to string[] (always array)", () => {
    expect(ADMIN_FIELDS.select.interfaceType).toBe("string[]");
  });

  it("json maps to unknown", () => {
    expect(ADMIN_FIELDS.json.interfaceType).toBe("unknown");
  });
});
```

**3 — new `it`, anchored inside the `describe("generateVexTypes — document interfaces", ...)` block, after the `generates optional fields with ? modifier` test.**

```ts
  it("generates optional fields with ? modifier", () => {
    const config = defineServerConfig({ config: defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { excerpt: text({ required: false }) },
        }),
      ],
    }) })
    const output = generateVexTypes({ config });
    expect(output).toContain("excerpt?: string");
  });

  it("generates an unknown field for json", () => {
    const config = defineServerConfig({ config: defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { settings: json({ required: false }) },
        }),
      ],
    }) })
    const output = generateVexTypes({ config });
    expect(output).toContain("settings?: unknown");
  });
```

#### packages/core/src/schema/generateVexSchema.test.ts

**2 edits.**

**1 — import, anchored at the existing `../fields` import line.**

```ts
import { url, text, number, checkbox, date, select, json } from "../fields";
```

**2 — new tests, anchored inside `describe("generateVexSchema — field validators", ...)` after the `select` test, before the block's closing.**

```ts
  it("generates required select field as v.array(v.union(...))", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            status: select({
              required: true,
              options: [
                { label: "Draft", value: "draft" },
                { label: "Published", value: "published" },
              ],
            }),
          },
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).toContain(
      'status: v.array(v.union(v.literal("draft"), v.literal("published")))',
    );
  });

  it("generates optional json field as v.optional(v.any())", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { settings: json({ required: false }) },
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).toContain("settings: v.optional(v.any())");
  });

  it("generates required json field as v.any()", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { settings: json({ required: true }) },
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).toContain("settings: v.any()");
  });
});
```

#### pnpm-workspace.yaml

`catalog:` additions (alphabetical) — the CodeMirror 6 packages the react `json()` field's `JsonEditor` depends on.

```yaml
  "@codemirror/commands": 6.11.1
  "@codemirror/lang-json": 6.0.2
  "@codemirror/language": 6.13.1
  "@codemirror/lint": 6.9.7
  "@codemirror/state": 6.7.6
  "@codemirror/view": 6.43.14
  "@lezer/highlight": 1.2.5
```

#### packages/react/package.json

`dependencies` additions (alphabetical), all `catalog:`.

```json
    "@codemirror/commands": "catalog:",
    "@codemirror/lang-json": "catalog:",
    "@codemirror/language": "catalog:",
    "@codemirror/lint": "catalog:",
    "@codemirror/state": "catalog:",
    "@codemirror/view": "catalog:",
    "@lezer/highlight": "catalog:",
```

#### packages/react/src/components/ui/JsonEditor.tsx

```tsx
"use client";

import { Suspense, lazy } from "react";
import { Textarea } from "./textarea";

const JsonEditorView = lazy(() =>
  import("./JsonEditorView").then((mod) => ({ default: mod.JsonEditorView })),
);

/**
 * Props for {@link JsonEditor}, a CodeMirror 6-backed JSON text editor.
 */
export interface JsonEditorProps {
  /** The DOM `id` applied to the editor's editable surface. */
  id: string;
  /** The current JSON text. */
  value: string;
  /** Called with the editor's full document text on every change. */
  onChange: (value: string) => void;
  /** Called when the editor loses focus. */
  onBlur?: () => void;
  /** Disables editing and dims the editor. */
  readOnly?: boolean;
  /** Applies destructive border/ring styling for an invalid value. */
  invalid?: boolean;
  /** `id` of the element that labels this editor. */
  "aria-labelledby"?: string;
  /** Mirrors `aria-required` onto the editor's editable surface. */
  "aria-required"?: boolean;
  /** Placeholder text shown in an empty document. */
  placeholder?: string;
}

/**
 * CodeMirror 6-backed JSON editor with syntax highlighting, line numbers,
 * and inline lint diagnostics.
 *
 * The actual CodeMirror view (`JsonEditorView`) is code-split behind
 * `React.lazy` so `@codemirror/*` never lands in the main bundle; while that
 * chunk loads, a plain `<Textarea>` renders in its place so the field is
 * never unusable.
 */
export function JsonEditor(props: JsonEditorProps) {
  return (
    <Suspense
      fallback={
        <Textarea
          id={props.id}
          value={props.value}
          readOnly
          aria-labelledby={props["aria-labelledby"]}
          placeholder={props.placeholder}
          className="min-h-32 font-mono"
        />
      }
    >
      <JsonEditorView {...props} />
    </Suspense>
  );
}
```

#### packages/react/src/components/ui/JsonEditorView.tsx

```tsx
"use client";

import { useEffect, useRef } from "react";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { linter, lintGutter } from "@codemirror/lint";
import { Compartment, EditorState } from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
  lineNumbers,
  placeholder as placeholderExtension,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { cn } from "../../styles/utils";
import type { JsonEditorProps } from "./JsonEditor";

const highlightStyle = HighlightStyle.define([
  { tag: tags.propertyName, color: "var(--chart-1)" },
  { tag: tags.string, color: "var(--chart-2)" },
  { tag: tags.number, color: "var(--chart-3)" },
  { tag: [tags.bool, tags.null], color: "var(--chart-4)" },
  { tag: [tags.brace, tags.squareBracket, tags.separator], color: "var(--muted-foreground)" },
]);

const theme = EditorView.theme({
  "&": {
    backgroundColor: "var(--card)",
    color: "var(--foreground)",
    fontSize: "13px",
  },
  ".cm-content": {
    fontFamily: "var(--font-mono), ui-monospace, monospace",
    caretColor: "var(--foreground)",
  },
  ".cm-content, .cm-gutter": {
    minHeight: "8rem",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--foreground)",
  },
  ".cm-gutters": {
    backgroundColor: "var(--card)",
    color: "var(--muted-foreground)",
    border: "none",
  },
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-lintRange-error": {
    backgroundImage: "none",
    textDecoration: "underline wavy var(--destructive)",
  },
});

/**
 * CodeMirror 6 JSON editor view. Code-split behind `JsonEditor`'s
 * `React.lazy` boundary — never imported outside it.
 *
 * Creates the `EditorView` once on mount and owns it imperatively from
 * there: external `value` changes are synced in with a dispatched
 * transaction (only when they differ from the editor's own document, so
 * typing doesn't fight itself), `readOnly` is toggled via a `Compartment`
 * reconfiguration, and `onChange` is read through a ref inside a single
 * `EditorView.updateListener`. `onBlur` is wired through
 * `EditorView.domEventHandlers` instead — a real DOM `blur` listener,
 * independent of CodeMirror's own `hasFocus`/`focusChanged` bookkeeping
 * (which requires a genuine prior focus to have been recorded; a
 * synthetic `fireEvent.blur` with no preceding real focus — the shared
 * field-input contract's blur assertion — never produces a `focusChanged`
 * update otherwise).
 */
export function JsonEditorView({
  id,
  value,
  onChange,
  onBlur,
  readOnly = false,
  invalid = false,
  "aria-labelledby": ariaLabelledBy,
  "aria-required": ariaRequired,
  placeholder,
}: JsonEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const readOnlyCompartmentRef = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);

  onChangeRef.current = onChange;
  onBlurRef.current = onBlur;

  useEffect(() => {
    if (!hostRef.current) return;

    const readOnlyCompartment = readOnlyCompartmentRef.current;
    const view = new EditorView({
      doc: value,
      parent: hostRef.current,
      extensions: [
        lineNumbers(),
        foldGutter(),
        lintGutter(),
        drawSelection(),
        highlightActiveLine(),
        history(),
        indentOnInput(),
        bracketMatching(),
        json(),
        linter(jsonParseLinter()),
        syntaxHighlighting(highlightStyle),
        ...(placeholder ? [placeholderExtension(placeholder)] : []),
        keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap]),
        theme,
        readOnlyCompartment.of([
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
        ]),
        EditorView.contentAttributes.of({
          id,
          ...(ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : {}),
          ...(ariaRequired !== undefined ? { "aria-required": String(ariaRequired) } : {}),
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.domEventHandlers({
          blur: () => onBlurRef.current?.(),
        }),
      ],
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentValue = view.state.doc.toString();
    if (currentValue === value) return;
    view.dispatch({
      changes: { from: 0, to: currentValue.length, insert: value },
    });
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: readOnlyCompartmentRef.current.reconfigure([
        EditorState.readOnly.of(readOnly),
        EditorView.editable.of(!readOnly),
      ]),
    });
  }, [readOnly]);

  return (
    <div
      ref={hostRef}
      className={cn(
        "overflow-hidden rounded-sm border border-input bg-card shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        invalid && "border-destructive ring-3 ring-destructive/20",
        readOnly && "opacity-80",
      )}
    />
  );
}
```

#### packages/react/src/components/fields/json/utils.ts

```ts
/**
 * Result of {@link parseJsonFieldText}: either a successful parse (`ok:
 * true`, carrying the parsed `value`) or a failure (`ok: false`, carrying a
 * human-readable `error` message).
 */
export type JsonFieldParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

/**
 * Serializes a JSON field's stored value into editor-displayable text.
 *
 * @param value - The field's current (or stored) value.
 * @returns Two-space-indented JSON text, or `""` for `undefined`.
 */
export function stringifyJsonFieldValue(value: unknown): string {
  return value === undefined ? "" : JSON.stringify(value, null, 2);
}

/**
 * Parses a JSON field's editor text into a committable value.
 *
 * Blank (or whitespace-only) text parses successfully to `undefined`,
 * clearing the field. Anything else is parsed with `JSON.parse`; a failure
 * returns the parser's own message, or `"Invalid JSON."` when the thrown
 * value isn't an `Error`.
 *
 * @param args - The editor text to parse.
 * @returns A discriminated success/failure result.
 */
export function parseJsonFieldText({ text }: { text: string }): JsonFieldParseResult {
  if (text.trim() === "") {
    return { ok: true, value: undefined };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid JSON." };
  }
}
```

#### packages/react/src/components/fields/json/Input.tsx

```tsx
"use client";

import { useState } from "react";
import type { JsonField } from "@vexcms/core";
import { JsonEditor } from "../../ui/JsonEditor";
import { Button } from "../../ui/button";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError } from "../../form/FormError";
import { parseJsonFieldText, stringifyJsonFieldValue } from "./utils";

/**
 * JSON field input component for the admin edit form.
 *
 * Holds the raw editor text in local state and parses it on every change: a
 * valid parse commits the parsed value via `field.handleChange`, an invalid
 * parse leaves the committed form value untouched and shows a local
 * parse-error message styled like `FormError`. The "Format" button
 * re-serializes the current text with two-space indentation and is disabled
 * while the current text doesn't parse. Read-only renders a read-only
 * `JsonEditor` inside a `role="group"` wrapper, mirroring the upload field's
 * multi-state pattern — there is no single focusable control to attach a
 * `<label for>` to. The inner `JsonEditor` gets its own `${name}-editor`
 * id, distinct from the group wrapper's `id={name}`: the shared field-input
 * contract resolves a control by `id` first, and two elements sharing one
 * id would make that lookup non-deterministic.
 *
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<unknown>`) from a `<form.Field>` render prop.
 */
export const JsonFieldInput = createFieldInput<unknown, {}, JsonField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    const isReadOnly = readOnly || fieldDef.admin.readOnly;
    const [text, setText] = useState(() => stringifyJsonFieldValue(field.state.value));
    const [parseError, setParseError] = useState<string | undefined>(undefined);

    if (isReadOnly) {
      return (
        <div
          id={name}
          className="flex flex-col gap-1.5"
          role="group"
          aria-labelledby={`${name}-label`}
          aria-disabled={isReadOnly}
        >
          <span
            id={`${name}-label`}
            className="relative flex items-center gap-2 text-sm leading-none font-medium select-none"
          >
            {index !== undefined ? `[${index + 1}] - ` : ""}
            {fieldDef.label || name}
            {fieldDef.required && <span className="text-red-500">*</span>}
          </span>
          <JsonEditor
            id={`${name}-editor`}
            value={stringifyJsonFieldValue(field.state.value)}
            onChange={() => {}}
            readOnly
            aria-labelledby={`${name}-label`}
          />
          <FormDescription field={fieldDef} />
          <FormError field={field} submissionAttempts={submissionAttempts} />
        </div>
      );
    }

    function parseAndCommit(nextText: string) {
      const result = parseJsonFieldText({ text: nextText });
      if (result.ok) {
        setParseError(undefined);
        field.handleChange(result.value);
      } else {
        setParseError(result.error);
      }
    }

    function handleChange(nextText: string) {
      setText(nextText);
      parseAndCommit(nextText);
    }

    function handleFormat() {
      const result = parseJsonFieldText({ text });
      if (result.ok) {
        setText(stringifyJsonFieldValue(result.value));
        setParseError(undefined);
        field.handleChange(result.value);
      } else {
        setParseError(result.error);
      }
    }

    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <FormLabel index={index} field={fieldDef} name={name} />
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handleFormat}
            disabled={text.trim() === "" || Boolean(parseError)}
          >
            Format
          </Button>
        </div>
        <JsonEditor
          id={name}
          value={text}
          onChange={handleChange}
          onBlur={field.handleBlur}
          invalid={Boolean(parseError)}
          aria-labelledby={`${name}-label`}
          aria-required={fieldDef.required}
          placeholder={fieldDef.admin.placeholder}
        />
        {parseError && <p className="text-[0.8rem] text-destructive">{parseError}</p>}
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
```


#### packages/react/src/components/fields/json/Cell.tsx

```tsx
import { addLeadingSlash, TDocument, type CellComponentProps, type JsonField } from "@vexcms/core";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";

/** Cell preview truncation threshold, in characters of the serialized JSON. */
const JSON_CELL_TRUNCATE_LENGTH = 80;

/**
 * Formats a JSON field's value for the data-table cell: a one-line
 * `JSON.stringify`, cut at {@link JSON_CELL_TRUNCATE_LENGTH} characters.
 *
 * @param value - The field's stored value.
 * @returns The (possibly truncated) one-line JSON preview.
 */
function formatJsonCellPreview(value: unknown): string {
  const serialized = JSON.stringify(value);
  return serialized.length > JSON_CELL_TRUNCATE_LENGTH
    ? `${serialized.slice(0, JSON_CELL_TRUNCATE_LENGTH)}...`
    : serialized;
}

/**
 * JSON field cell component for the data-table list view.
 *
 * Renders a truncated one-line `JSON.stringify` preview of the stored value.
 * Null/undefined values show an em-dash placeholder. The full serialized
 * value is always available on the `title` attribute.
 *
 * @param props - Component props.
 * @param props.value - Raw value from the document (may be null or undefined).
 * @param props.fieldDef - Resolved `JsonField` definition.
 * @returns The Cell component for this field type.
 *
 * @example
 * ```tsx
 * <JsonFieldCell value={doc.settings} fieldDef={settingsField} row={row} />
 * ```
 */
export function JsonFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<JsonField, TData>,
) {
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);
  if (props.value === undefined || props.value === null) return <span>—</span>;
  const serialized = JSON.stringify(props.value);
  const preview = formatJsonCellPreview(props.value);
  if (props.isTitleField) {
    return (
      <VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>
        <span className="font-mono font-bold" title={serialized}>
          {preview}
        </span>
      </VexLink>
    );
  }
  return (
    <span className="font-mono" title={serialized}>
      {preview}
    </span>
  );
}
```

#### packages/react/src/components/fields/json/columnDef.tsx

```tsx
import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, JsonField, TDocument } from "@vexcms/core";
import { JsonFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a json field.
 *
 * Generates column config with proper typing, cell renderer, alignment,
 * and metadata. Uses the registered `JsonFieldCell` component for rendering.
 *
 * @param props - Column generation props.
 * @param props.fieldDef - Resolved json field definition.
 * @param props.fieldKey - Field key from collection.fields.
 * @param props.isTitleField - Whether this is the title field (useAsTitle).
 * @param props.collection - Parent collection config, forwarded to `JsonFieldCell` to build the edit link `href`.
 * @returns TanStack Table column definition.
 *
 * @example
 * ```ts
 * const column = jsonFieldToColumnDef({
 *   fieldDef: collection.fields.settings,
 *   fieldKey: "settings",
 *   isTitleField: false,
 * });
 * ```
 */
export function jsonFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: JsonField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
  type?: TData;
}): ColumnDef<TData, unknown> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey);
      return (
        <JsonFieldCell<TData>
          value={value}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
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
```

#### packages/react/src/components/fields/json/testFixture.ts

```ts
import { ADMIN_FIELDS, json, type JsonField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/**
 * `json` field fixture — drives `runFieldInputContractSuite` in
 * `components/fields/json/Input.test.tsx` and `runFieldCellContractSuite` in
 * `Cell.test.tsx`.
 *
 * `valid` is a plain number (`42`), not an object or array: the shared input
 * contract's `setControlValue` types `String(value)` verbatim into the
 * textarea and expects `JSON.parse` on that exact text to round-trip back to
 * `valid` — true for a bare JSON scalar, not for `String({})` (produces
 * `"[object Object]"`) or `String([1, 2])` (produces `"1,2"`, not valid
 * JSON). The Cell contract's generic truncation assertion can't grow a
 * number fixture the way it grows a string/array/object one, so
 * `Cell.test.tsx` passes `truncates: false` and adds its own dedicated
 * truncation test against a real large object instead.
 */
export const jsonFieldFixture: FieldFixture<JsonField, unknown> = {
  fieldType: ADMIN_FIELDS.json.type,
  fieldDef: json({ label: "Settings", required: true }),
  valid: 42,
  invalid: undefined,
  empty: undefined,
};
```

#### packages/react/src/components/fields/json/index.ts

```ts
export * from "./Input";
export * from "./Cell";
export * from "./columnDef";
export * from "./utils";
```

#### packages/react/src/components/fields/json/utils.test.ts

```ts
import { describe, expect, it } from "vitest";
import { parseJsonFieldText, stringifyJsonFieldValue } from "./utils";

describe("stringifyJsonFieldValue", () => {
  it("serializes a plain object with two-space indentation", () => {
    expect(stringifyJsonFieldValue({ a: 1 })).toBe(JSON.stringify({ a: 1 }, null, 2));
  });

  it("serializes a bare scalar", () => {
    expect(stringifyJsonFieldValue(42)).toBe("42");
  });

  it("returns an empty string for undefined", () => {
    expect(stringifyJsonFieldValue(undefined)).toBe("");
  });

  it("serializes null as the literal 'null'", () => {
    expect(stringifyJsonFieldValue(null)).toBe("null");
  });
});

describe("parseJsonFieldText", () => {
  it("parses a valid JSON object", () => {
    expect(parseJsonFieldText({ text: '{"a":1}' })).toStrictEqual({ ok: true, value: { a: 1 } });
  });

  it("parses a valid bare scalar", () => {
    expect(parseJsonFieldText({ text: "true" })).toStrictEqual({ ok: true, value: true });
  });

  it("parses blank text as undefined", () => {
    expect(parseJsonFieldText({ text: "" })).toStrictEqual({ ok: true, value: undefined });
  });

  it("parses whitespace-only text as undefined", () => {
    expect(parseJsonFieldText({ text: "   \n  " })).toStrictEqual({ ok: true, value: undefined });
  });

  it("returns the parser's own message on invalid JSON", () => {
    const result = parseJsonFieldText({ text: "not valid json" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.length).toBeGreaterThan(0);
    }
  });
});
```

#### packages/react/src/components/ui/JsonEditor.test.tsx

```tsx
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import type { JsonEditorProps } from "./JsonEditor";
import { JsonEditor } from "./JsonEditor";

/**
 * Stubs `JsonEditorView` the same way `fields/json/Input.test.tsx` does.
 * Kept in its own file: `JsonEditor`'s `React.lazy(() =>
 * import("./JsonEditorView"))` is a module-level singleton that, once
 * resolved by any earlier render in the SAME test file, stays resolved for
 * every later render in that file — so observing the Suspense fallback in
 * its unresolved state needs a render that is the first (and only) one to
 * touch this lazy component, which only this file's own module registry
 * guarantees.
 */
vi.mock("./JsonEditorView", () => ({
  JsonEditorView: ({ id, value }: JsonEditorProps) => (
    <textarea data-testid="real-editor" id={id} value={value} readOnly />
  ),
}));

describe("JsonEditor", () => {
  it("shows the Suspense fallback textarea synchronously before the lazy-loaded CodeMirror view resolves", () => {
    const { container } = render(
      <JsonEditor id="settings" value={JSON.stringify({ a: 1 }, null, 2)} onChange={() => {}} />,
    );

    const fallback = container.querySelector('[data-slot="textarea"]');
    expect(fallback).not.toBeNull();
    expect(fallback).toHaveAttribute("readonly");
    expect(fallback).toHaveValue(JSON.stringify({ a: 1 }, null, 2));
    expect(container.querySelector('[data-testid="real-editor"]')).toBeNull();
  });
});
```

#### packages/react/src/components/fields/json/Input.test.tsx

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { adminFieldToInputSchema, json, type CollectionConfig, type JsonField } from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import type { JsonEditorProps } from "../../ui/JsonEditor";
import { jsonFieldFixture } from "./testFixture";
import { JsonFieldInput } from "./Input";

/**
 * Stubs the CodeMirror-backed `JsonEditorView` with a plain controlled
 * textarea mirroring `JsonEditorProps`, so the shared field-input contract
 * suite (and this file's own tests) can drive it with `@testing-library/user-event`
 * the same way every other text-entry field is driven, without mounting
 * real CodeMirror in jsdom.
 */
vi.mock("../../ui/JsonEditorView", () => ({
  JsonEditorView: ({
    id,
    value,
    onChange,
    onBlur,
    readOnly,
    invalid,
    "aria-labelledby": ariaLabelledBy,
    "aria-required": ariaRequired,
    placeholder,
  }: JsonEditorProps) => (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      readOnly={readOnly}
      aria-invalid={invalid}
      aria-labelledby={ariaLabelledBy}
      aria-required={ariaRequired}
      placeholder={placeholder}
    />
  ),
}));

/**
 * Mounts `JsonFieldInput` behind a real `useForm` + `<AppForm>`, wired with
 * the same real `adminFieldToInputSchema`-driven `onSubmit` validator the
 * generic factory uses internally.
 */
function JsonValidationHarness(props: {
  fieldDef: JsonField;
  collection: CollectionConfig;
  initialValue: unknown;
  readOnly?: boolean;
}) {
  const form = useForm({
    defaultValues: { testField: props.initialValue },
    validators: {
      onSubmit: ({ value }) => {
        const schema = adminFieldToInputSchema({ field: props.fieldDef });
        const result = schema.safeParse(value.testField);
        if (result.success) return undefined;
        return { fields: { testField: result.error.issues[0]?.message ?? "Invalid value" } };
      },
    },
  });
  return (
    <AppForm form={form}>
      <JsonFieldInput
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={props.readOnly ?? false}
      />
      <button type="submit">Submit</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: jsonFieldFixture,
  Component: JsonFieldInput,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("json: parse-on-change, Format button, and read-only preview", () => {
      it("commits the parsed value with no local parse-error shown for valid typed JSON", async () => {
        const user = userEvent.setup();
        const fieldDef = json({ label: "Settings" });
        const { container } = render(
          <JsonValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );

        const textarea = await screen.findByLabelText("Settings", { exact: false });
        await user.clear(textarea);
        await user.type(textarea, "true");

        expect(container.querySelectorAll(".text-destructive")).toHaveLength(1);
      });

      it("shows a local parse-error message while the typed text fails to parse", async () => {
        const user = userEvent.setup();
        const fieldDef = json({ label: "Settings" });
        const { container } = render(
          <JsonValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );

        const textarea = await screen.findByLabelText("Settings", { exact: false });
        await user.clear(textarea);
        await user.type(textarea, "not valid json");

        expect(container.querySelectorAll(".text-destructive")).toHaveLength(2);
        expect(textarea).toHaveValue("not valid json");
      });

      it("leaves the committed form value unchanged while the typed text fails to parse", async () => {
        const user = userEvent.setup();
        const fieldDef = json({ label: "Settings", required: true });
        render(<JsonValidationHarness fieldDef={fieldDef} collection={collection} initialValue={42} />);

        const textarea = await screen.findByLabelText("Settings", { exact: false });
        await user.type(textarea, "not valid json");
        await user.click(screen.getByRole("button", { name: /submit/i }));

        expect(screen.queryByText("This field is required.")).not.toBeInTheDocument();
      });

      it("the Format button normalizes the current valid JSON text and commits the parsed value", async () => {
        const user = userEvent.setup();
        const fieldDef = json({ label: "Settings" });
        render(
          <JsonValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );

        const textarea = (await screen.findByLabelText("Settings", {
          exact: false,
        })) as HTMLTextAreaElement;
        await user.type(textarea, "1.500");
        await user.click(screen.getByRole("button", { name: "Format" }));

        expect(textarea.value).toBe("1.5");
      });

      it("disables the Format button while the current text doesn't parse", async () => {
        const user = userEvent.setup();
        const fieldDef = json({ label: "Settings" });
        render(
          <JsonValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );

        const textarea = await screen.findByLabelText("Settings", { exact: false });
        await user.type(textarea, "not valid json");

        expect(screen.getByRole("button", { name: "Format" })).toBeDisabled();
      });

      it("renders a read-only JsonEditor with the pretty-printed value instead of an editable one", async () => {
        const fieldDef = json({ label: "Settings", admin: { readOnly: true } });
        const { container } = render(
          <JsonValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={{ a: 1 }}
            readOnly
          />,
        );

        const group = (await screen.findByText("Settings")).closest('[role="group"]') as HTMLElement;
        const textarea = (await within(group).findByRole("textbox")) as HTMLTextAreaElement;
        expect(textarea).toHaveAttribute("readonly");
        expect(textarea.value).toBe(JSON.stringify({ a: 1 }, null, 2));
        expect(container.querySelector("pre")).toBeNull();
      });
    });
  },
});
```


#### packages/react/src/components/fields/json/Cell.test.tsx

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite, withCellConfig } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { JsonFieldCell } from "./Cell";
import { jsonFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: jsonFieldFixture,
  Component: JsonFieldCell,
  truncates: false,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("json: truncated preview", () => {
      it("truncates a long JSON.stringify preview at 80 characters and keeps the full value on title", () => {
        const longValue = { items: Array.from({ length: 20 }, (_, i) => `item-${i}`) };
        const serialized = JSON.stringify(longValue);
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: longValue });
        const { container } = render(
          withCellConfig(
            <JsonFieldCell
              value={longValue}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        const titled = container.querySelector("[title]");
        expect(titled?.getAttribute("title")).toBe(serialized);
        expect(titled?.textContent).toBe(`${serialized.slice(0, 80)}...`);
      });

      it("shows the full JSON.stringify value untruncated when under 80 characters", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: { a: 1 } });
        const { container } = render(
          withCellConfig(
            <JsonFieldCell
              value={{ a: 1 }}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(container).toHaveTextContent('{"a":1}');
      });
    });
  },
});
```

#### packages/react/src/components/fields/json/columnDef.test.ts

```ts
import { runColumnDefSuite } from "../../../testing/columnDefSuite";
import { jsonFieldFixture } from "./testFixture";

runColumnDefSuite({ fixture: jsonFieldFixture });
```

#### packages/react/src/components/fields/index.tsx

**5 edits.**

**1 — import, anchored after the `./textarea` import added by step 3.**

```ts
import { TextareaFieldCell, TextareaFieldInput, textareaFieldToColumnDef } from "./textarea";
import { JsonFieldCell, JsonFieldInput, jsonFieldToColumnDef } from "./json";
```

**2 — barrel export, anchored after the existing `export * from "./textarea";` line added by step 3.**

```ts
export * from "./textarea";
export * from "./json";
```

**3 — `fieldInputComponents` entry, anchored after the existing `ADMIN_FIELDS.textarea.type` entry added by step 3 (now the last entry before the closing `};`).**

```ts
  [ADMIN_FIELDS.textarea.type]: TextareaFieldInput as ComponentType<
    InputComponentProps<BaseFieldMeta, AdminField>
  >,
  [ADMIN_FIELDS.json.type]: JsonFieldInput as ComponentType<
    InputComponentProps<BaseFieldMeta, AdminField>
  >,
};
```

**4 — `fieldCellComponents` entry, anchored after the existing `ADMIN_FIELDS.textarea.type` entry added by step 3 (now the last entry before the closing `};`).**

```ts
  [ADMIN_FIELDS.textarea.type]: TextareaFieldCell as ComponentType<CellComponentProps<AdminField>>,
  [ADMIN_FIELDS.json.type]: JsonFieldCell as ComponentType<CellComponentProps<AdminField>>,
};
```

**5 — `getCollectionColumnDefs` switch case, anchored before the `default:` arm, after the `ADMIN_FIELDS.textarea.type` case added by step 3 (now the last case before `default`).**

```ts
      case ADMIN_FIELDS.textarea.type:
        columnDefs.push(
          textareaFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.json.type:
        columnDefs.push(
          jsonFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      default: {
```

#### packages/react/src/adapter.ts

**2 edits.**

**1 — import, anchored after the `TextareaFieldInput, TextareaFieldCell` pair added by step 3 to the `./components` import list.**

```ts
  RichTextFieldInput,
  RichTextFieldCell,
  TextareaFieldInput,
  TextareaFieldCell,
  JsonFieldInput,
  JsonFieldCell,
} from "./components";
```

**2 — `reactAdapter.fields` entry, anchored after the existing `ADMIN_FIELDS.textarea.type` entry added by step 3 (now the last entry before the closing `},`).**

```ts
    [ADMIN_FIELDS.textarea.type]: {
      input: TextareaFieldInput,
      cell: TextareaFieldCell,
    },
    [ADMIN_FIELDS.json.type]: {
      input: JsonFieldInput,
      cell: JsonFieldCell,
    },
  },
```

#### packages/react/src/index.ts

**3 edits.**

**1 — pass-through config function export, anchored at the field-config re-export line after steps 2 (`email`) and 3 (`textarea`) have each added themselves to it.**

```ts
export { text, email, textarea, number, select, date, url, checkbox, json, defineConfig } from "@vexcms/core";
```

**2 — resolved type export, anchored at the resolved-type `export type { ... }` list after steps 2 and 3 have each added `EmailField`/`TextareaField` beside `TextField`.**

```ts
export type {
  TextField,
  EmailField,
  TextareaField,
  NumberField,
  SelectField,
  DateField,
  UrlField,
  CheckboxField,
  JsonField,
  AdminField,
  CollectionSlug,
  VexDocument,
  VexConfig,
  VexClientConfig,
  VexClientConfigInput,
  VexServerConfigInput,
  RelationshipPreviewProps,
} from "@vexcms/core";
```

**3 — React component export: a new line appended after steps 2's and 3's own `EmailFieldInput, EmailFieldCell` / `TextareaFieldInput, TextareaFieldCell` export lines (or their merge into one line, however those two reconcile) — a separate `export { ... } from "./components/fields";` line is valid TypeScript regardless.**

```ts
export { JsonFieldInput, JsonFieldCell } from "./components/fields";
```

#### packages/react/src/testing/fixtures/index.ts

**2 edits.**

**1 — import, anchored after the existing `textareaFieldFixture` import added by step 3.**

```ts
import { textareaFieldFixture } from "../../components/fields/textarea/testFixture";
import { jsonFieldFixture } from "../../components/fields/json/testFixture";
```

**2 — registry entry, anchored after the existing `textarea: textareaFieldFixture,` entry added by step 3 (inserted right after `text:`; `richtext` stays further down the object, unaffected).**

```ts
  text: textFieldFixture,
  email: emailFieldFixture,
  textarea: textareaFieldFixture,
  json: jsonFieldFixture,
  number: numberFieldFixture,
```

#### packages/react/src/testing/index.ts

1 edit; everything not shown is unchanged. `runVexReactSuite` (used by app-level `admin.test.ts` suites) runs the shared Cell contract for every registered field type and only skips the generic 77-character truncation check for types in `NO_TRUNCATION_FIELD_TYPES`. The json fixture's `valid` value is a number the generic builder cannot grow, so json must join that set the same way its own `Cell.test.tsx` passes `truncates: false`.

**1 — `NO_TRUNCATION_FIELD_TYPES`: add `"json"` after `"richtext"`, and widen the set's JSDoc.**

```ts
/**
 * The field types whose Cell contract opts out of `runFieldCellContractSuite`'s
 * default truncation assertion — a fixed-format date, a number, a boolean checkbox and a
 * `#rrggbb` color swatch never render an unbounded string; richtext and json assert
 * truncation in their own `Cell.test.tsx`. Mirrors each type's own `Cell.test.tsx` call.
 */
```

```ts
  "richtext",
  // The json fixture's `valid` value is a number (see json/testFixture.ts), which the
  // generic builder cannot grow; json/Cell.test.tsx asserts its 80-character cut directly.
  "json",
]);
```

Verify: pnpm typecheck && pnpm --filter @vexcms/core test -- fields/json && pnpm --filter @vexcms/react test -- fields/json

### Step 5 — `updatedAt` as `date()`; date cell shows time [agent]

`defineCollection`'s auto-injected `updatedAt` field switches from `number()` to
`date()`. The swap is schema/type-invisible: `ADMIN_FIELDS.date` (`packages/core/src/fields/constants.ts:42-47`)
already declares `interfaceType: "number"` and `validator: "v.number()"` — byte-identical
to `ADMIN_FIELDS.number` — and both `generateVexTypes`' `collectionConfigToInterface`
(`packages/core/src/collections/interfaceGen.ts:40`, keyed on `field.interfaceType`) and
`generateVexSchema`'s per-field validator dispatch (`packages/core/src/fields/date/validator.ts:38-40`,
which reads `ADMIN_FIELDS.date.validator`) produce the same output for either field type.
No type-gen or schema-gen code changes; the existing `validator.test.ts` and
`generateVexTypes.test.ts` assertions stay green unmodified and are the proof.

`stampUpdatedAt` (`packages/core/src/api/utils.ts:260-278`) and the better-auth adapter's
`meta.locked` path never special-case the field's `type` — `stampUpdatedAt` only checks
that `collection.fields.updatedAt` exists and reads `meta.locked`, and the better-auth
adapter (`packages/better-auth/src/adapter.ts:319-320`) already maps its own `"date"`
attribute kind to `date(baseOptions)`, independent of this injection. Neither needs a
change for this step.

- [x] `packages/core/src/collections/config.ts` — inject `date({ label: "Updated At", required: false, defaultValue: undefined, admin: { position: "sidebar", readOnly: true }, time: { timePicker: { hour: true, minute: true, second: true } } })`
- [x] `packages/core/src/collections/config.test.ts` — updated/added assertions for the injected field's `type` and `time`
- [x] `packages/react/src/components/fields/date/utils.ts` (new) + `utils.test.ts` (new) — `formatDateFieldValue`
- [x] `packages/react/src/components/fields/date/Cell.tsx` — renders date+time via `formatDateFieldValue` unless `time.hidden`
- [x] `packages/react/src/components/fields/date/Cell.test.tsx` — updated assertions for the new rendering
- [x] `packages/react/src/components/fields/date/index.ts` — barrel export for `utils.ts`
- [x] `packages/react/package.json` — `TZ=UTC` prefix on `test`/`coverage`/`test:watch`

#### packages/core/src/collections/config.ts

Two edits. Everything else in the file (the reserved-key guard, versions guard,
`populateCollectionFieldMeta` call, returned `CollectionConfig` shape) is unchanged.

**1 — import: `number` is no longer used in this file; swap it for `date`.**

```ts
import { ADMIN_FIELDS, AdminField, CollectionFieldMeta, ComponentHKT, date } from "../fields";
```

**2 — `fieldsWithTimestamp`'s injected field, inside `defineCollection`.**

```ts
  const fieldsWithTimestamp = skipInjection
    ? input.fields
    : {
        ...input.fields,
        updatedAt: date({
          label: "Updated At",
          required: false,
          // `date()`'s own default is already `undefined` (`ADMIN_FIELDS.date.defaultValue`);
          // stated explicitly so the intent reads at the call site — an unsaved document has
          // no update time, and epoch is a lie. `getFieldsDefaultValues` yields `undefined`
          // on create and the stored value on edit.
          defaultValue: undefined,
          admin: { position: "sidebar", readOnly: true },
          time: { timePicker: { hour: true, minute: true, second: true } },
        }) as AdminField<TFieldMeta>,
      };
```

#### packages/core/src/collections/config.test.ts

Three edits inside the `describe("defineCollection — updatedAt injection", ...)` block
(`packages/core/src/collections/config.test.ts:7-63`). Every other test in the file —
including the `describe("defineCollection — an already-declared updatedAt is left alone", ...)`
block, which simulates the better-auth adapter's OWN `number()`-typed locked field, a
different field entirely — is unchanged.

**0 — top import gains `DateField` (the union-typed `AdminField` needs a cast to read
`.time`, a `DateField`-only property).**

```ts
import type { AdminField, DateField } from "../fields";
```

**1 — the first test, renamed and asserting `"date"` instead of `"number"`.**

```ts
  it("injects an optional updatedAt date field by default", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    const field = posts.fields.updatedAt;
    expect(field).toBeDefined();
    expect(field?.type).toBe("date");
    expect(field?.required).toBe(false);
  });
```

**2 — new test, inserted directly after the `"marks the injected field read-only so the form cannot edit it"` test.**

```ts
  it("resolves the injected field's time config with seconds visible", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    expect((posts.fields.updatedAt as DateField | undefined)?.time).toEqual({
      hidden: false,
      use12HourFormat: true,
      timePicker: { hour: true, minute: true, second: true },
    });
  });
```

#### packages/react/src/components/fields/date/utils.ts

```ts
import { format } from "date-fns";
import type { DateField } from "@vexcms/core";

/**
 * Formats a date field's Unix-ms value for display — used by the data-table
 * cell and anywhere else a `DateField` value needs a human-readable string.
 *
 * Date-only when `time.hidden`. Otherwise date+time, 12-hour (`h:mm a`) or
 * 24-hour (`HH:mm`) per `time.use12HourFormat`, with `:ss` appended —
 * before the AM/PM marker in 12-hour format — when `time.timePicker.second`.
 *
 * @param props.value - Unix timestamp in milliseconds.
 * @param props.time - The field's resolved `time` config (`DateField["time"]`).
 * @returns The formatted date string.
 *
 * @example
 * ```ts
 * formatDateFieldValue({
 *   value: Date.UTC(2025, 5, 15, 14, 30),
 *   time: { hidden: false, use12HourFormat: true, timePicker: { hour: true, minute: true, second: false } },
 * });
 * // → "Jun 15, 2025 2:30 PM"
 * ```
 */
export function formatDateFieldValue(props: { value: number; time: DateField["time"] }): string {
  const date = new Date(props.value);
  if (props.time.hidden) {
    return format(date, "MMM d, yyyy");
  }
  const timeFormat = props.time.use12HourFormat
    ? props.time.timePicker.second
      ? "h:mm:ss a"
      : "h:mm a"
    : props.time.timePicker.second
      ? "HH:mm:ss"
      : "HH:mm";
  return format(date, `MMM d, yyyy ${timeFormat}`);
}
```

#### packages/react/src/components/fields/date/utils.test.ts

No existing date test pins a timezone (`Input.test.tsx` instead queries the open
calendar dynamically, since its own day-cell assertions tolerate any host TZ). Exact
`format()` output depends on the process's local timezone. jsdom's `Date` reads the host
timezone once when the worker process boots, so setting `process.env.TZ` from inside a
test file (even at module top-level, before `beforeAll`) is too late to affect it — this
file relies on `TZ=UTC` prefixed onto `packages/react/package.json`'s `test`/`coverage`/
`test:watch` scripts instead (see that file's edit below).

```ts
import { describe, expect, it } from "vitest";
import { formatDateFieldValue } from "./utils";

// `TZ=UTC` is set on the `test`/`coverage`/`test:watch` npm scripts
// (`packages/react/package.json`), not here — jsdom's Date implementation
// reads the host timezone once at worker-process boot, so setting
// `process.env.TZ` from inside a test file (even at module top-level) is too
// late to affect it.
const TIMESTAMP = Date.UTC(2025, 5, 15, 14, 30, 45);

describe("formatDateFieldValue", () => {
  it("formats date-only when time.hidden", () => {
    expect(
      formatDateFieldValue({
        value: TIMESTAMP,
        time: { hidden: true, use12HourFormat: true, timePicker: { hour: true, minute: true, second: false } },
      }),
    ).toBe("Jun 15, 2025");
  });

  it("formats date+time in 12-hour format without seconds by default", () => {
    expect(
      formatDateFieldValue({
        value: TIMESTAMP,
        time: { hidden: false, use12HourFormat: true, timePicker: { hour: true, minute: true, second: false } },
      }),
    ).toBe("Jun 15, 2025 2:30 PM");
  });

  it("appends seconds before the AM/PM marker in 12-hour format", () => {
    expect(
      formatDateFieldValue({
        value: TIMESTAMP,
        time: { hidden: false, use12HourFormat: true, timePicker: { hour: true, minute: true, second: true } },
      }),
    ).toBe("Jun 15, 2025 2:30:45 PM");
  });

  it("formats date+time in 24-hour format without seconds", () => {
    expect(
      formatDateFieldValue({
        value: TIMESTAMP,
        time: { hidden: false, use12HourFormat: false, timePicker: { hour: true, minute: true, second: false } },
      }),
    ).toBe("Jun 15, 2025 14:30");
  });

  it("appends seconds in 24-hour format", () => {
    expect(
      formatDateFieldValue({
        value: TIMESTAMP,
        time: { hidden: false, use12HourFormat: false, timePicker: { hour: true, minute: true, second: true } },
      }),
    ).toBe("Jun 15, 2025 14:30:45");
  });
});
```

#### packages/react/src/components/fields/date/Cell.tsx

One edit — the whole `DateFieldCell` function body changes (the local `Date.toDateString()`
rendering is replaced), plus a new import. The `"use client"` directive and the rest of the
imports are unchanged.

**1 — new import, added after the `useVexConfig` import.**

```ts
import { formatDateFieldValue } from "./utils";
```

**2 — `DateFieldCell`, complete (identifier: `export function DateFieldCell`).**

```tsx
/**
 * Date field cell component for the data-table list view.
 *
 * Renders a Unix ms timestamp via {@link formatDateFieldValue} — date-only
 * when `fieldDef.time.hidden`, date+time otherwise.
 *
 * @param props - Component props
 * @param props.value - Raw Unix timestamp in milliseconds from the document
 * @param props.fieldDef - Resolved `DateField` definition
 * @returns The Cell Component for this field type
 *
 * @example
 * ```tsx
 * <DateFieldCell value={doc.publishedAt} fieldDef={publishedAtField} row={row} />
 * ```
 */
export function DateFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<DateField, TData>,
) {
  if (props.value === undefined || props.value === null) return <span>—</span>;
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);
  const content = (
    <span>{formatDateFieldValue({ value: props.value, time: props.fieldDef.time })}</span>
  );
  if (!props.isTitleField) return content;
  return (
    <VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>
      {content}
    </VexLink>
  );
}
```

#### packages/react/src/components/fields/date/Cell.test.tsx

Full file — the two `toDateString()`-based assertions are replaced with exact
`formatDateFieldValue` output (pinned `TZ=UTC`, same convention as `utils.test.ts`:
`TZ=UTC` on the package's npm scripts, not a per-file `beforeAll`), and a new test
covers `time.hidden`.

```tsx
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { date, type TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite, withCellConfig } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { DateFieldCell } from "./Cell";
import { dateFieldFixture } from "./testFixture";

// `TZ=UTC` is set on the `test`/`coverage`/`test:watch` npm scripts
// (`packages/react/package.json`), not here — see `utils.test.ts`.

runFieldCellContractSuite({
  fixture: dateFieldFixture,
  Component: DateFieldCell,
  // A fixed-format date string has no meaningful "longer than N characters" state.
  truncates: false,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    it("renders date+time via formatDateFieldValue, matching the field's default time config", () => {
      const timestamp = Date.UTC(2025, 5, 15, 14, 30, 45);
      const row = makeCellRow<TDocument>({ fieldKey: "field", value: timestamp });
      render(
        withCellConfig(
          <DateFieldCell
            value={timestamp}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        ),
      );
      expect(screen.getByText("Jun 15, 2025 2:30 PM")).toBeInTheDocument();
    });

    it("renders date-only when the field's time.hidden is set", () => {
      const timestamp = Date.UTC(2025, 5, 15, 14, 30, 45);
      const hiddenTimeField = date({
        label: "Published At",
        required: true,
        time: { hidden: true },
      });
      const row = makeCellRow<TDocument>({ fieldKey: "field", value: timestamp });
      render(
        withCellConfig(
          <DateFieldCell
            value={timestamp}
            row={row}
            fieldDef={hiddenTimeField}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        ),
      );
      expect(screen.getByText("Jun 15, 2025")).toBeInTheDocument();
    });

    // `!props.value` treated epoch 0 (1970-01-01, a legitimate date) the same as an
    // absent value. Filed as CELL-4 — a distinct boundary defect from CELL-3's own
    // null/undefined scope, fixed by the same strict guard: `0` is neither `undefined`
    // nor `null`, so it now renders the real date instead of the em-dash placeholder.
    it("renders a date for a timestamp of 0, since it is a valid date, not an absent value", () => {
      const row = makeCellRow<TDocument>({ fieldKey: "field", value: 0 });
      render(
        withCellConfig(
          <DateFieldCell
            value={0}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        ),
      );
      expect(screen.getByText("Jan 1, 1970 12:00 AM")).toBeInTheDocument();
    });
  },
});
```

#### packages/react/src/components/fields/date/index.ts

One edit — add the `utils` barrel export, same position `color/index.ts` uses relative to
its own `columnDef` export.

```ts
export * from "./Input";
export * from "./Cell";
export * from "./columnDef";
export * from "./utils";
```

#### packages/react/package.json

One edit — `TZ=UTC` prefixed onto `test`, `coverage`, and `test:watch`. jsdom's `Date`
implementation reads the host timezone once when the worker process boots; setting
`process.env.TZ` from inside a test file (module top-level or `beforeAll`) runs too late
to affect it, so the pin has to happen before `vitest` itself starts.

```json
    "test": "TZ=UTC NODE_OPTIONS=--disable-warning=ExperimentalWarning vitest run",
    "coverage": "TZ=UTC NODE_OPTIONS=--disable-warning=ExperimentalWarning vitest run --coverage",
    "test:watch": "TZ=UTC NODE_OPTIONS=--disable-warning=ExperimentalWarning vitest"
```

Verify: pnpm --filter @vexcms/core test -- collections && pnpm --filter @vexcms/react test -- fields/date && pnpm --filter @vexcms/core test -- types

### Step 6 — Core layout model: `width`, `admin.layout`, `admin.condition`, `tabs()`/`collapsible()`/`row()` [agent]

- [ ] `packages/core/src/fields/baseTypes.ts` — `width: string` (default `"100%"`), `admin.layout`, `admin.condition`; `"half"`/`"full"` literal removed
- [ ] `packages/core/src/fields/layout/types.ts` — `FIELD_LAYOUT_KINDS`, `FieldLayoutKind`, `FieldLayoutFrame`, `FieldLayoutNode`, `FieldCondition`, `FieldConditionProps`, `UnionToIntersection`
- [ ] `packages/core/src/fields/layout/config.ts` — `tabs`, `collapsible`, `row`
- [ ] `packages/core/src/fields/layout/utils.ts` — `andFieldConditions`, `isFieldConditionMet`, `hasFieldConditions`, `buildFieldLayoutTree`, `resolveRowWidths`
- [ ] `packages/core/src/fields/layout/index.ts` barrel + `config.test.ts` + `utils.test.ts` (incl. a `tabs()` key-inference test)
- [ ] `packages/core/src/fields/index.ts` — export the new barrel
- [ ] every field factory (`text`, `number`, `checkbox`, `color`, `date`, `select`, `url`, `relationship`, `upload`, `richtext`, `array`, `blocks`, `group`, `email`, `textarea`, `json`) resolves `admin.width = "100%"` and `admin.layout = []` by default; `admin.condition` already flows through via the existing `...options?.admin` spread
- [ ] migrate every `width: "half"` / `width: "full"` literal in `packages/core/src/fields/**` (JSDoc examples included) to `"50%"` / the `"100%"` default
- [ ] `packages/react/src/index.ts` — re-export `tabs`, `collapsible`, `row` the way `text` is re-exported

Why: pure core types + helpers + the layout-tree builder; react (step 9) and server (step 7) consume them.

No change is needed in `packages/better-auth/src/adapter.ts`: `betterAuthAttrToVexField` (`packages/better-auth/src/adapter.ts:259-328`) builds a plain `admin: FieldAdminConfigInput` object and passes it straight into `text()`/`select()`/`checkbox()`/`number()`/`date()`/`array()` (`packages/better-auth/src/adapter.ts:273-324`) — the field factories resolve `width`/`layout` defaults themselves, so the new defaults apply automatically with zero auth-adapter changes. Confirmed no `width: "half"`/`"full"` literal exists in `apps/test/src` or `apps/www/src` (only `apps/docs` MDX pages use it, out of scope per the launch-plan — docs land in the commit phase).

#### packages/core/src/fields/layout/types.ts

New file.

```ts
import type { AdminField } from "../types";

/**
 * Discriminant values for the layout containers a field can be wrapped in —
 * `tabs()`, `collapsible()`, `row()`. Backs {@link FieldLayoutKind} and the
 * `kind` field on every {@link FieldLayoutFrame} / {@link FieldLayoutNode}.
 */
export const FIELD_LAYOUT_KINDS = {
  tabs: "tabs",
  collapsible: "collapsible",
  row: "row",
} as const;

/**
 * Union of the layout container kinds a field can be wrapped in (`"tabs"`,
 * `"collapsible"`, `"row"`).
 */
export type FieldLayoutKind = (typeof FIELD_LAYOUT_KINDS)[keyof typeof FIELD_LAYOUT_KINDS];

/**
 * Converts a union type into an intersection of its members. Used by
 * `tabs()` to merge the per-tab field records it accepts into one flat
 * record whose keys are the union of every tab's keys.
 *
 * @typeParam TUnion - The union type to intersect.
 */
export type UnionToIntersection<TUnion> = (
  TUnion extends unknown ? (arg: TUnion) => void : never
) extends (arg: infer TIntersection) => void
  ? TIntersection
  : never;

/**
 * Data and sibling-field values visible to a field's `admin.condition`.
 */
export interface FieldConditionProps {
  /** The whole document currently being edited. */
  data: Record<string, unknown>;
  /**
   * The value at this field's parent path — the whole document for a
   * top-level field, one array item or block item for a nested field.
   */
  siblingData: Record<string, unknown>;
}

/**
 * A pure predicate deciding whether a field is shown and validated. Runs
 * identically on the client (reactive visibility) and the server (skips
 * `required`/`validate()` when false) — collection files are part of the
 * browser bundle (ADR-013). A condition that throws counts as met (`true`) —
 * a failing condition must be visible, never a silent validation skip.
 */
export type FieldCondition = (props: FieldConditionProps) => boolean;

/**
 * One layout container a field is nested inside, stamped onto
 * `field.admin.layout` by `tabs()` / `collapsible()` / `row()`. Frames are
 * PREPENDED outermost-first, so `admin.layout[0]` is the outermost
 * container. `id` identifies the container instance —
 * `${kind}:${firstChildKey}`, where `firstChildKey` is the first field key
 * passed to the helper (the first key of the first tab, for `tabs()`) — so
 * non-contiguous fields produced by the same helper call merge back into one
 * node when the layout tree is rebuilt.
 */
export type FieldLayoutFrame =
  | { kind: "tabs"; id: string; tab: string }
  | { kind: "collapsible"; id: string; label: string; defaultCollapsed: boolean }
  | { kind: "row"; id: string };

/**
 * One node in the tree built from a flat field map's `admin.layout` frames —
 * what a renderer walks to lay out a form. `"field"` is a leaf; `"tabs"` /
 * `"collapsible"` / `"row"` are containers.
 */
export type FieldLayoutNode =
  | { kind: "field"; key: string; field: AdminField }
  | { kind: "tabs"; id: string; tabs: { label: string; children: FieldLayoutNode[] }[] }
  | {
      kind: "collapsible";
      id: string;
      label: string;
      defaultCollapsed: boolean;
      children: FieldLayoutNode[];
    }
  | { kind: "row"; id: string; children: FieldLayoutNode[] };
```

Circular import check: `AdminField` is pulled in with `import type`, which the TypeScript compiler fully erases — no `import`/`require` for `../types` survives into the emitted JS, so the real cycle (`baseTypes.ts` → `layout/types.ts` → `fields/types.ts` → e.g. `number/types.ts` → `baseTypes.ts`) exists only at the type level, never at runtime. `baseTypes.ts` below uses the same `import type` for `FieldCondition`/`FieldLayoutFrame`.

#### packages/core/src/fields/layout/config.ts

New file.

```ts
import type { AdminField } from "../types";
import { FIELD_LAYOUT_KINDS, type FieldCondition, type FieldLayoutFrame, type UnionToIntersection } from "./types";
import { andFieldConditions } from "./utils";

/**
 * Prepends `frame` onto a field's `admin.layout` and AND-s `condition` into
 * its existing `admin.condition`. Shared by `tabs()` / `collapsible()` /
 * `row()`.
 */
function stampLayoutFrame(props: {
  field: AdminField;
  frame: FieldLayoutFrame;
  condition: FieldCondition | undefined;
}): AdminField {
  const { field, frame, condition } = props;
  return {
    ...field,
    admin: {
      ...field.admin,
      layout: [frame, ...field.admin.layout],
      condition: andFieldConditions({ conditions: [field.admin.condition, condition] }),
    },
  } as AdminField;
}

/**
 * Groups fields under admin-form tabs. A spread helper — returns a FLAT
 * record with each field's `admin.layout` prepended with a `"tabs"` frame
 * recording which tab it belongs to, so data, schema, generated types, RBAC
 * and hooks see ordinary fields. Usable in any fields record (collection,
 * global, group, block, array item group).
 *
 * The frame id is `tabs:${firstFieldKeyOfFirstTab}`. `condition` (if given)
 * is AND-ed into every child field's own `admin.condition`.
 *
 * @throws {Error} If `tabs` has no entries, a tab has no fields, or the same
 *   field key appears in more than one tab.
 *
 * @example
 * ```ts
 * defineCollection({
 *   fields: {
 *     ...tabs({
 *       tabs: {
 *         Content: { title: text({ required: true }), body: richtext() },
 *         SEO: { metaTitle: text(), metaDescription: textarea() },
 *       },
 *     }),
 *   },
 * })
 * ```
 */
export function tabs<TTabs extends Record<string, Record<string, AdminField>>>(props: {
  tabs: TTabs;
  condition?: FieldCondition;
}): UnionToIntersection<TTabs[keyof TTabs]> {
  const { tabs: tabsInput, condition } = props;
  const tabLabels = Object.keys(tabsInput);
  if (tabLabels.length === 0) throw new Error("tabs(): requires at least one tab");

  const firstTabFields = tabsInput[tabLabels[0]];
  const firstKey = Object.keys(firstTabFields)[0];
  if (!firstKey) throw new Error("tabs(): the first tab requires at least one field");

  const id = `${FIELD_LAYOUT_KINDS.tabs}:${firstKey}`;
  const result: Record<string, AdminField> = {};

  for (const label of tabLabels) {
    const tabFields = tabsInput[label];
    if (Object.keys(tabFields).length === 0) {
      throw new Error(`tabs(): tab "${label}" requires at least one field`);
    }
    for (const [key, field] of Object.entries(tabFields)) {
      if (key in result) throw new Error(`tabs(): duplicate field key "${key}"`);
      result[key] = stampLayoutFrame({ field, frame: { kind: "tabs", id, tab: label }, condition });
    }
  }

  return result as UnionToIntersection<TTabs[keyof TTabs]>;
}

/**
 * Wraps fields in a collapsible admin-form fieldset. A spread helper — same
 * flat-record contract as `tabs()`: data, schema, generated types, RBAC and
 * hooks see ordinary fields. `condition` (if given) is AND-ed into every
 * child field's own `admin.condition`.
 *
 * @throws {Error} If `fields` is empty.
 *
 * @example
 * ```ts
 * defineCollection({
 *   fields: {
 *     ...collapsible({
 *       label: "SEO",
 *       defaultCollapsed: true,
 *       fields: { metaTitle: text(), metaDescription: textarea() },
 *     }),
 *   },
 * })
 * ```
 */
export function collapsible<TFields extends Record<string, AdminField>>(props: {
  label: string;
  fields: TFields;
  defaultCollapsed?: boolean;
  condition?: FieldCondition;
}): TFields {
  const { label, fields, defaultCollapsed = false, condition } = props;
  const keys = Object.keys(fields);
  if (keys.length === 0) throw new Error("collapsible(): requires at least one field");

  const frame: FieldLayoutFrame = {
    kind: "collapsible",
    id: `${FIELD_LAYOUT_KINDS.collapsible}:${keys[0]}`,
    label,
    defaultCollapsed,
  };
  const result: Record<string, AdminField> = {};
  for (const [key, field] of Object.entries(fields)) {
    result[key] = stampLayoutFrame({ field, frame, condition });
  }
  return result as TFields;
}

/**
 * Lays fields out on one admin-form row instead of each taking a full row. A
 * spread helper — same flat-record contract as `tabs()`. Row widths: if
 * every child's `admin.width` is a `%` value and they sum to 100 (±0.5),
 * those widths are used (`resolveRowWidths`); otherwise every child gets an
 * equal share. Rows stack below the `sm` breakpoint. `condition` (if given)
 * is AND-ed into every child field's own `admin.condition`.
 *
 * @throws {Error} If `fields` is empty.
 *
 * @example
 * ```ts
 * defineCollection({
 *   fields: {
 *     ...row({
 *       fields: {
 *         firstName: text({ admin: { width: "50%" } }),
 *         lastName: text({ admin: { width: "50%" } }),
 *       },
 *     }),
 *   },
 * })
 * ```
 */
export function row<TFields extends Record<string, AdminField>>(props: {
  fields: TFields;
  condition?: FieldCondition;
}): TFields {
  const { fields, condition } = props;
  const keys = Object.keys(fields);
  if (keys.length === 0) throw new Error("row(): requires at least one field");

  const frame: FieldLayoutFrame = { kind: "row", id: `${FIELD_LAYOUT_KINDS.row}:${keys[0]}` };
  const result: Record<string, AdminField> = {};
  for (const [key, field] of Object.entries(fields)) {
    result[key] = stampLayoutFrame({ field, frame, condition });
  }
  return result as TFields;
}
```

#### packages/core/src/fields/layout/utils.ts

New file.

```ts
import { ADMIN_FIELDS } from "../constants";
import type { AdminField } from "../types";
import type { FieldCondition, FieldLayoutFrame, FieldLayoutNode } from "./types";

/**
 * Combines several optional field conditions into one that is met only when
 * every defined condition is met (logical AND). Returns `undefined` when no
 * condition is defined, so a stamped field with no inherited condition keeps
 * `admin.condition` absent rather than becoming an always-true function. A
 * throwing condition counts as met (`true`), matching `isFieldConditionMet`.
 */
export function andFieldConditions(props: {
  conditions: (FieldCondition | undefined)[];
}): FieldCondition | undefined {
  const defined = props.conditions.filter(
    (condition): condition is FieldCondition => condition !== undefined,
  );
  if (defined.length === 0) return undefined;
  return (conditionProps) =>
    defined.every((condition) => {
      try {
        return condition(conditionProps);
      } catch {
        return true;
      }
    });
}

/**
 * Evaluates whether a field's `admin.condition` is currently met. A field
 * with no condition is always met. A condition that throws counts as met —
 * the failure must be visible elsewhere, never a silent validation skip.
 */
export function isFieldConditionMet(props: {
  field: AdminField;
  data: Record<string, unknown>;
  siblingData: Record<string, unknown>;
}): boolean {
  const { field, data, siblingData } = props;
  const condition = field.admin.condition;
  if (!condition) return true;
  try {
    return condition({ data, siblingData });
  } catch {
    return true;
  }
}

/**
 * Whether any field in `fields` — or any of its nested group sub-fields,
 * array item fields, or block fields — declares an `admin.condition`. Used
 * to decide whether a form needs condition-aware re-validation at all.
 */
export function hasFieldConditions(props: { fields: Record<string, AdminField> }): boolean {
  return Object.values(props.fields).some((field) => {
    if (field.admin.condition) return true;
    if (field.type === ADMIN_FIELDS.group.type) {
      return hasFieldConditions({ fields: field.fields });
    }
    if (field.type === ADMIN_FIELDS.array.type) {
      return hasFieldConditions({ fields: { item: field.items } });
    }
    if (field.type === ADMIN_FIELDS.blocks.type) {
      return field.blocks.some((block) => hasFieldConditions({ fields: block.fields }));
    }
    return false;
  });
}

function createFrameNode(frame: FieldLayoutFrame): FieldLayoutNode {
  switch (frame.kind) {
    case "tabs":
      return { kind: "tabs", id: frame.id, tabs: [] };
    case "collapsible":
      return {
        kind: "collapsible",
        id: frame.id,
        label: frame.label,
        defaultCollapsed: frame.defaultCollapsed,
        children: [],
      };
    case "row":
      return { kind: "row", id: frame.id, children: [] };
  }
}

function getFrameChildren(props: { node: FieldLayoutNode; frame: FieldLayoutFrame }): FieldLayoutNode[] {
  const { node, frame } = props;
  if (node.kind === "tabs" && frame.kind === "tabs") {
    let tab = node.tabs.find((entry) => entry.label === frame.tab);
    if (!tab) {
      tab = { label: frame.tab, children: [] };
      node.tabs.push(tab);
    }
    return tab.children;
  }
  if (node.kind === "collapsible" || node.kind === "row") {
    return node.children;
  }
  throw new Error(
    `buildFieldLayoutTree(): frame kind "${frame.kind}" does not match node kind "${node.kind}"`,
  );
}

/**
 * Builds the layout tree a renderer walks from a flat field map — reads each
 * field's `admin.layout` frames (stamped by `tabs()` / `collapsible()` /
 * `row()`, outermost first) and nests fields accordingly. Node order is
 * first appearance: a frame id is assigned a node position the first time
 * any field carrying it is encountered, and every later field sharing that
 * id merges into the same node even when other fields appear in between.
 */
export function buildFieldLayoutTree(props: { fields: Record<string, AdminField> }): FieldLayoutNode[] {
  const roots: FieldLayoutNode[] = [];
  const nodesByFrameId = new Map<string, FieldLayoutNode>();

  for (const [key, field] of Object.entries(props.fields)) {
    let siblings = roots;
    for (const frame of field.admin.layout) {
      let node = nodesByFrameId.get(frame.id);
      if (!node) {
        node = createFrameNode(frame);
        nodesByFrameId.set(frame.id, node);
        siblings.push(node);
      }
      siblings = getFrameChildren({ node, frame });
    }
    siblings.push({ kind: "field", key, field });
  }

  return roots;
}

function formatEqualShare(count: number): string {
  return `${Math.round((100 / count) * 100) / 100}%`;
}

function parsePercentWidth(width: string): number | undefined {
  const match = /^(\d+(?:\.\d+)?)%$/.exec(width);
  return match ? Number(match[1]) : undefined;
}

/**
 * Resolves the widths a `row()` lays its children out with. When every
 * child's `admin.width` is a `%` value and they sum to 100 (±0.5 — floating
 * point rounding slop), those declared widths are used as-is; otherwise
 * every child gets an equal share of the row.
 */
export function resolveRowWidths(props: { widths: string[] }): string[] {
  const { widths } = props;
  const percents = widths.map(parsePercentWidth);
  const allPercent = percents.every((value): value is number => value !== undefined);
  if (allPercent) {
    const sum = percents.reduce<number>((total, value) => total + (value ?? 0), 0);
    if (Math.abs(sum - 100) <= 0.5) return widths;
  }
  const share = formatEqualShare(widths.length);
  return widths.map(() => share);
}
```

#### packages/core/src/fields/layout/index.ts

New file.

```ts
export * from "./types";
export * from "./config";
export * from "./utils";
```

#### packages/core/src/fields/layout/config.test.ts

New file.

```ts
import { describe, it, expect } from "vitest";
import { tabs, collapsible, row } from "./config";
import { text } from "../text/config";
import { defineCollection } from "../../collections/config";

describe("tabs()", () => {
  it("stamps a tabs frame on every field, named after the first tab's first key", () => {
    const fields = tabs({
      tabs: {
        Content: { title: text() },
        SEO: { metaTitle: text() },
      },
    });

    expect(fields.title.admin.layout).toEqual([
      { kind: "tabs", id: "tabs:title", tab: "Content" },
    ]);
    expect(fields.metaTitle.admin.layout).toEqual([
      { kind: "tabs", id: "tabs:title", tab: "SEO" },
    ]);
  });

  it("AND-s its condition into every child field's own condition", () => {
    const child = text({ admin: { condition: () => false } });
    const fields = tabs({
      tabs: { Content: { title: child } },
      condition: () => true,
    });

    expect(fields.title.admin.condition?.({ data: {}, siblingData: {} })).toBe(false);
  });

  it("throws when given no tabs", () => {
    expect(() => tabs({ tabs: {} })).toThrow("tabs(): requires at least one tab");
  });

  it("throws when the first tab has no fields", () => {
    expect(() => tabs({ tabs: { Content: {} } })).toThrow(
      "tabs(): the first tab requires at least one field",
    );
  });

  it("throws on a field key reused across tabs", () => {
    expect(() =>
      tabs({
        tabs: {
          Content: { title: text() },
          SEO: { title: text() },
        },
      }),
    ).toThrow('tabs(): duplicate field key "title"');
  });
});

describe("collapsible()", () => {
  it("stamps a collapsible frame on every field", () => {
    const fields = collapsible({
      label: "SEO",
      defaultCollapsed: true,
      fields: { metaTitle: text(), metaDescription: text() },
    });

    expect(fields.metaTitle.admin.layout).toEqual([
      { kind: "collapsible", id: "collapsible:metaTitle", label: "SEO", defaultCollapsed: true },
    ]);
    expect(fields.metaDescription.admin.layout).toEqual(fields.metaTitle.admin.layout);
  });

  it("defaults defaultCollapsed to false", () => {
    const fields = collapsible({ label: "SEO", fields: { metaTitle: text() } });
    expect(fields.metaTitle.admin.layout[0]).toMatchObject({ defaultCollapsed: false });
  });

  it("throws on an empty field map", () => {
    expect(() => collapsible({ label: "SEO", fields: {} })).toThrow(
      "collapsible(): requires at least one field",
    );
  });
});

describe("row()", () => {
  it("stamps a row frame on every field", () => {
    const fields = row({ fields: { firstName: text(), lastName: text() } });

    expect(fields.firstName.admin.layout).toEqual([{ kind: "row", id: "row:firstName" }]);
    expect(fields.lastName.admin.layout).toEqual([{ kind: "row", id: "row:firstName" }]);
  });

  it("throws on an empty field map", () => {
    expect(() => row({ fields: {} })).toThrow("row(): requires at least one field");
  });
});

describe("nested layout helpers", () => {
  it("prepends frames outermost-first", () => {
    const fields = tabs({
      tabs: {
        Content: { ...row({ fields: { a: text(), b: text() } }) },
      },
    });

    expect(fields.a.admin.layout).toEqual([
      { kind: "tabs", id: "tabs:a", tab: "Content" },
      { kind: "row", id: "row:a" },
    ]);
  });
});

describe("tabs() key inference", () => {
  it("infers the union of every tab's keys and rejects unknown keys", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: {
        ...tabs({
          tabs: {
            Content: { ...row({ fields: { a: text(), b: text() } }), c: text() },
            SEO: { d: text() },
          },
        }),
      },
    });

    expect(posts.fields.a).toBeDefined();
    expect(posts.fields.b).toBeDefined();
    expect(posts.fields.c).toBeDefined();
    expect(posts.fields.d).toBeDefined();
    // @ts-expect-error — "e" was never defined in any tab
    expect(posts.fields.e).toBeUndefined();
  });
});
```

#### packages/core/src/fields/layout/utils.test.ts

New file.

```ts
import { describe, it, expect } from "vitest";
import {
  andFieldConditions,
  isFieldConditionMet,
  hasFieldConditions,
  buildFieldLayoutTree,
  resolveRowWidths,
} from "./utils";
import { tabs, row } from "./config";
import { text } from "../text/config";
import { group } from "../group/config";
import { array } from "../array/config";
import { blocks, defineBlock } from "../blocks/config";

describe("isFieldConditionMet", () => {
  const siblingData = {};

  it("returns true when no condition is set", () => {
    expect(isFieldConditionMet({ field: text(), data: {}, siblingData })).toBe(true);
  });

  it("evaluates the condition function against data", () => {
    const field = text({ admin: { condition: ({ data }) => data.published === true } });

    expect(isFieldConditionMet({ field, data: { published: true }, siblingData })).toBe(true);
    expect(isFieldConditionMet({ field, data: { published: false }, siblingData })).toBe(false);
  });

  it("treats a throwing condition as met", () => {
    const field = text({
      admin: {
        condition: () => {
          throw new Error("boom");
        },
      },
    });

    expect(isFieldConditionMet({ field, data: {}, siblingData })).toBe(true);
  });
});

describe("andFieldConditions", () => {
  const data = {};
  const siblingData = {};

  it("returns undefined when no conditions are defined", () => {
    expect(andFieldConditions({ conditions: [undefined, undefined] })).toBeUndefined();
  });

  it("ANDs every defined condition", () => {
    const condition = andFieldConditions({ conditions: [undefined, () => true, () => false] });
    expect(condition?.({ data, siblingData })).toBe(false);
  });

  it("treats a throwing condition as met", () => {
    const condition = andFieldConditions({
      conditions: [
        () => {
          throw new Error("boom");
        },
        () => true,
      ],
    });
    expect(condition?.({ data, siblingData })).toBe(true);
  });
});

describe("hasFieldConditions", () => {
  it("is false for fields without any condition", () => {
    expect(hasFieldConditions({ fields: { title: text() } })).toBe(false);
  });

  it("is true when a top-level field has a condition", () => {
    expect(
      hasFieldConditions({ fields: { title: text({ admin: { condition: () => true } }) } }),
    ).toBe(true);
  });

  it("recurses into group sub-fields", () => {
    const fields = {
      seo: group({ fields: { title: text({ admin: { condition: () => true } }) } }),
    };
    expect(hasFieldConditions({ fields })).toBe(true);
  });

  it("recurses into array items", () => {
    const fields = { tags: array({ items: text({ admin: { condition: () => true } }) }) };
    expect(hasFieldConditions({ fields })).toBe(true);
  });

  it("recurses into block fields", () => {
    const heroBlock = defineBlock({
      slug: "hero",
      label: "Hero",
      fields: { headline: text({ admin: { condition: () => true } }) },
    });
    const fields = { body: blocks({ blocks: [heroBlock] }) };
    expect(hasFieldConditions({ fields })).toBe(true);
  });
});

describe("buildFieldLayoutTree", () => {
  it("builds a flat list for fields with no layout frames", () => {
    const fields = { title: text(), slug: text() };

    expect(buildFieldLayoutTree({ fields })).toEqual([
      { kind: "field", key: "title", field: fields.title },
      { kind: "field", key: "slug", field: fields.slug },
    ]);
  });

  it("groups contiguous row fields under one row node", () => {
    const fields = { ...row({ fields: { a: text(), b: text() } }), c: text() };

    expect(buildFieldLayoutTree({ fields })).toEqual([
      {
        kind: "row",
        id: "row:a",
        children: [
          { kind: "field", key: "a", field: fields.a },
          { kind: "field", key: "b", field: fields.b },
        ],
      },
      { kind: "field", key: "c", field: fields.c },
    ]);
  });

  it("merges non-contiguous fields sharing the same tab frame id, at the frame's first-appearance position", () => {
    const tabbed = tabs({
      tabs: {
        Content: { a: text() },
        SEO: { b: text() },
      },
    });
    const extra = text();
    const fields = { a: tabbed.a, extra, b: tabbed.b };

    expect(buildFieldLayoutTree({ fields })).toEqual([
      {
        kind: "tabs",
        id: "tabs:a",
        tabs: [
          { label: "Content", children: [{ kind: "field", key: "a", field: tabbed.a }] },
          { label: "SEO", children: [{ kind: "field", key: "b", field: tabbed.b }] },
        ],
      },
      { kind: "field", key: "extra", field: extra },
    ]);
  });
});

describe("resolveRowWidths", () => {
  it("uses declared percent widths that already sum to 100", () => {
    expect(resolveRowWidths({ widths: ["30%", "70%"] })).toEqual(["30%", "70%"]);
  });

  it("tolerates a ±0.5 rounding slop", () => {
    expect(resolveRowWidths({ widths: ["33.4%", "33.4%", "33.5%"] })).toEqual([
      "33.4%",
      "33.4%",
      "33.5%",
    ]);
  });

  it("falls back to an equal share when a width is not a percent", () => {
    expect(resolveRowWidths({ widths: ["240px", "100%"] })).toEqual(["50%", "50%"]);
  });

  it("falls back to an equal share when percents don't sum to 100", () => {
    expect(resolveRowWidths({ widths: ["10%", "10%", "10%"] })).toEqual([
      "33.33%",
      "33.33%",
      "33.33%",
    ]);
  });
});
```

#### packages/core/src/fields/index.ts

1 edit — add the layout barrel beside `utils`.

**1 — after `export * from "./utils";`.**

```ts
export * from "./layout";
```

#### packages/core/src/fields/baseTypes.ts

3 edits.

**1 — new type-only import, after the `VexCallbackApi` import.**

```ts
import type { FieldCondition, FieldLayoutFrame } from "./layout/types";
```

**2 — `FieldAdminConfigInput` (plus its doc block) — full replacement.**

```ts
/**
 * Configuration input for a field's admin panel behavior.
 *
 * Controls how the field appears and behaves in the admin UI — visibility,
 * layout, input styling, and data table presentation. All properties are
 * optional; unset properties fall back to the defaults listed below.
 *
 * **Defaults applied by field config functions** (e.g., `text()`, `number()`):
 * ```ts
 * {
 *   hidden:        false,   // field is visible in the admin form
 *   readOnly:      false,   // field is editable by default
 *   position:      "main",  // placed in the main content column, not the sidebar
 *   width:         "100%",  // spans the full form width
 *   cellAlignment: "left",  // text aligned left in data table cells
 *   layout:        [],      // not nested inside tabs()/collapsible()/row()
 * }
 * ```
 *
 * @example
 * ```ts
 * // Basic usage — all defaults applied
 * title: text({ admin: { width: "50%" } })
 *
 * // Sidebar metadata field
 * publishedAt: date({
 *   description: "Scheduled publish time",
 *   admin: { position: "sidebar" },
 * })
 *
 * // Read-only computed field
 * createdAt: date({
 *   required: true,
 *   admin: { readOnly: true, hidden: false }
 * })
 *
 * // Right-aligned number column in table
 * price: number({
 *   admin: {
 *     cellAlignment: "right",
 *     placeholder: "0.00"
 *   }
 * })
 *
 * // Shown only once the document is published
 * featuredQuote: text({
 *   admin: { condition: ({ data }) => data.status === "published" },
 * })
 * ```
 *
 * @see {@link FieldAdminConfig} for the resolved type after defaults are applied
 */
export interface FieldAdminConfigInput {
  /**
   * Hide this field from the admin form.
   * Hidden fields are still stored in the database.
   *
   * Default: `false`
   */
  hidden?: boolean;
  /**
   * Make this field read-only in the admin form.
   * The value is displayed but cannot be edited.
   *
   * Default: `false`
   */
  readOnly?: boolean;
  /**
   * Position of the field in the form layout.
   *
   * - `"main"` — placed in the main content area
   * - `"sidebar"` — placed in the sidebar panel
   *
   * Honored for TOP-LEVEL collection/global fields only; ignored for nested fields.
   *
   * Default: `"main"`
   */
  position?: "main" | "sidebar";
  /**
   * Width of the field within its row, as any CSS width (`"50%"`, `"240px"`).
   * The form lays fields out with flex-wrap so partial widths share a line;
   * below the `sm` breakpoint every field is full width.
   *
   * Default: `"100%"`
   */
  width?: string;
  /**
   * Placeholder text shown in the input when empty.
   */
  placeholder?: string;
  /**
   * Content alignment in data table cells. 'left' | 'right' | 'center'
   */
  cellAlignment?: Alignment;
  /**
   * Pure predicate deciding whether this field is shown and validated. Runs
   * identically on the client and the server; a hidden field KEEPS its
   * value (not cleared, still submitted) and skips `required`/`validate()`
   * server-side.
   */
  condition?: FieldCondition;
}
```

**3 — `FieldAdminConfig` (plus its doc block) — full replacement.**

```ts
/**
 * Resolved admin configuration for a field, returned after defaults are applied.
 *
 * Properties with defaults (`hidden`, `readOnly`, `position`, `width`, `cellAlignment`, `layout`)
 * are always present. Properties that are meaningless when absent (`placeholder`, `condition`)
 * remain optional — `undefined` means the user did not configure them.
 *
 * @see {@link FieldAdminConfigInput} for the user-facing input type
 */
export interface FieldAdminConfig {
  /** Whether the field is hidden from the admin form. */
  hidden: boolean;
  /** Whether the field is read-only in the admin form. */
  readOnly: boolean;
  /** Position of the field in the form layout — `"main"` or `"sidebar"`. */
  position: "main" | "sidebar";
  /** Width of the field within its row, any CSS width — e.g. `"100%"`, `"50%"`, `"240px"`. */
  width: string;
  /** Text alignment for this field's column in the data table. */
  cellAlignment: Alignment;
  /** Placeholder text shown in the input when empty. */
  placeholder?: string;
  /**
   * The layout containers this field is nested inside, outermost first —
   * written only by `tabs()` / `collapsible()` / `row()`, never set by hand.
   */
  layout: FieldLayoutFrame[];
  /** Pure predicate deciding whether this field is shown and validated. */
  condition?: FieldCondition;
}
```

#### packages/core/src/fields/text/types.ts

1 edit — the `TextFieldInput` doc block's defaults list and `width: "half"` example.

**1 — defaults list + example, anchored by the `**Defaults applied by `text()`:**` block.**

```ts
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "100%",  // spans the full form width
 *     cellAlignment: "left",  // text aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label is inferred from the key ("Title")
 * title: text()
 *
 * // Required slug with length validation and a database index
 * slug: text({ required: true, min: { value: 3 }, max: { value: 100 }, index: "by_slug" })
 *
 * // Author name with a placeholder hint shown in the admin form
 * authorName: text({
 *   required: true,
 *   admin: { width: "50%", placeholder: "e.g. Jane Smith" }
 * })
```

#### packages/core/src/fields/text/config.ts

2 edits.

**1 — JSDoc bullets, anchored by `- `admin.width` — `"full"`` in the `text()` doc comment.**

```ts
 * - `admin.width` — `"100%"`
```

**2 — the example in the same doc comment and the `admin` default object in `text()` — full replacement of the function (defaults list + example + body unchanged otherwise).**

```ts
/**
 * Creates a text field with all defaults applied.
 *
 * Text fields store short, single-line string values.
 * Common uses: titles, names, slugs, URLs, email addresses.
 *
 * Accepts {@link TextFieldInput} (all optional) and returns {@link TextField} with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"100%"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - Text field configuration. All properties are optional.
 * @returns Resolved text field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { text, defineCollection } from '@vexcms/core'
 *
 * posts: defineCollection({
 *   fields: {
 *     // Minimal — label inferred from key ("Title")
 *     title: text(),
 *
 *     // Required slug with length validation and a database index
 *     slug: text({ required: true, min: { value: 3 }, max: { value: 100 }, index: "by_slug" }),
 *
 *     // Author name with a placeholder hint in the admin form
 *     authorName: text({
 *       required: true,
 *       admin: { width: "50%", placeholder: "e.g. Jane Smith" },
 *     }),
 *   }
 * })
 * ```
 *
 * @see {@link TextFieldInput} for the full input type
 * @see {@link TextField} for the resolved output type
 */
export function text<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(options?: TextFieldInput<TCollectionSlug, TFieldMeta>): TextField<TCollectionSlug, TFieldMeta> {
  return {
    type: ADMIN_FIELDS.text.type,
    interfaceType: ADMIN_FIELDS.text.interfaceType,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.text.defaultValue,
    ...options,

    // Admin config with all defaults applied
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      layout: [],
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
```

#### packages/core/src/fields/number/types.ts

1 edit — defaults list + `width: "half"` example, anchored by the `**Defaults applied by `number()`:**` block.

```ts
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "100%",  // spans the full form width
 *     cellAlignment: "left",  // value aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label is inferred from the key ("Price")
 * price: number()
 *
 * // Required quantity with a minimum of 1 and a database index
 * quantity: number({ required: true, min: { value: 1 }, index: "by_quantity" })
 *
 * // Rating capped between 0 and 5 with custom error messages
 * rating: number({
 *   min: { value: 0, error: "Rating cannot be negative" },
 *   max: { value: 5, error: "Rating cannot exceed 5" },
 *   admin: { width: "50%" },
 * })
```

#### packages/core/src/fields/number/config.ts

2 edits.

**1 — JSDoc bullet.**

```ts
 * - `admin.width` — `"100%"`
```

**2 — the `admin` default object in `number()`.**

```ts
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      layout: [],
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
    },
```

#### packages/core/src/fields/checkbox/types.ts

1 edit — defaults list + `width: "half"` example, anchored by the `**Defaults applied by `checkbox()`:**` block.

```ts
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "100%",  // spans the full form width
 *     cellAlignment: "left",  // value aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label inferred from the key ("Published")
 * published: checkbox()
 *
 * // Checked by default when creating a new document
 * featured: checkbox({ defaultValue: true, admin: { width: "50%" } })
 *
 * // Indexed flag for fast admin queries
 * archived: checkbox({ index: "by_archived" })
 * ```
```

#### packages/core/src/fields/checkbox/config.ts

2 edits.

**1 — JSDoc bullet.**

```ts
 * - `admin.width` — `"100%"`
```

**2 — the `admin` default object in `checkbox()`.**

```ts
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      layout: [],
      // Optional admin properties (no defaults)
      ...options?.admin,
    },
```

#### packages/core/src/fields/color/types.ts

1 edit — defaults list + `width: "half"` example, anchored by the `**Defaults applied by `color()`:**` block.

```ts
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "100%",  // spans the full form width
 *     cellAlignment: "left",  // swatch aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label inferred from the key ("Brand Color"), stored as hex
 * brandColor: color()
 *
 * // Stored as oklch, ready to interpolate straight into a CSS custom property
 * primaryLight: color({ format: "oklch", required: true, defaultValue: "oklch(65.7% 0.179 40.9)" })
 *
 * // Half-width, and offer the host app's design tokens as a second tab
 * overlayTint: color({ themeColors: true, admin: { width: "50%" } })
 * ```
```

#### packages/core/src/fields/color/config.ts

2 edits.

**1 — JSDoc bullet.**

```ts
 * - `admin.width` — `"100%"`
```

**2 — the `admin` default object in `color()`.**

```ts
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      layout: [],
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
    },
```

#### packages/core/src/fields/date/types.ts

1 edit — defaults list, anchored by the `**Defaults applied by `date()`:**` block's `admin:` entry.

```ts
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "100%",  // spans the full form width
 *     cellAlignment: "left",  // text aligned left in the data table column
 *   }
 * }
 * ```
```

#### packages/core/src/fields/date/config.ts

3 edits.

**1 — JSDoc bullet.**

```ts
 * - `admin.width` — `"100%"`
```

**2 — the `width: "half"` example, anchored by `admin: { position: "sidebar", width: "half" }` in the `date()` doc comment.**

```ts
 *       time: { use12HourFormat: false },
 *       admin: { position: "sidebar", width: "50%" },
 *     }),
 *   }
 * })
```

**3 — the `admin` default object in `date()`.**

```ts
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      layout: [],
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
    },
```

#### packages/core/src/fields/select/types.ts

1 edit — defaults list, anchored by the `**Defaults applied by `select()`:**` block.

```ts
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "100%",  // spans the full form width
 *     cellAlignment: "left",  // aligned left in the data table column
 *   }
 * }
 * ```
```

#### packages/core/src/fields/select/config.ts

2 edits.

**1 — JSDoc bullet.**

```ts
 * - `admin.width` — `"100%"`
```

**2 — the `admin` default object in `select()`.**

```ts
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      layout: [],
      placeholder: "",
      ...options?.admin,
    },
```

#### packages/core/src/fields/url/types.ts

1 edit — defaults list + `width: "half"` example, anchored by the `**Defaults applied by `url()`:**` block.

```ts
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "100%",  // spans the full form width
 *     cellAlignment: "left",  // text aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label is inferred from the key ("Canonical Url")
 * canonicalUrl: url()
 *
 * // Required website URL with a length cap and a database index
 * website: url({ required: true, max: { value: 2048 }, index: "by_website" })
 *
 * // Social profile URL with a placeholder hint
 * twitterUrl: url({
 *   required: false,
 *   admin: { width: "50%", placeholder: "https://twitter.com/username" }
 * })
```

#### packages/core/src/fields/url/config.ts

3 edits.

**1 — JSDoc bullet.**

```ts
 * - `admin.width` — `"100%"`
```

**2 — the `width: "half"` example, anchored by `admin: { width: "half", placeholder: "https://twitter.com/username" }` in the `url()` doc comment.**

```ts
 *       required: false,
 *       admin: { width: "50%", placeholder: "https://twitter.com/username" },
 *     }),
 *   }
 * })
```

**3 — the `admin` default object in `url()`.**

```ts
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      layout: [],
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
    },
```

#### packages/core/src/fields/relationship/types.ts

1 edit — defaults list, anchored by the `**Defaults applied by `relationship()`:**` block.

```ts
 *   admin: {
 *     hidden:        false,
 *     readOnly:      false,
 *     position:      "main",
 *     width:         "100%",
 *     cellAlignment: "left",
 *   }
 * }
```

#### packages/core/src/fields/relationship/config.ts

2 edits.

**1 — JSDoc bullet.**

```ts
 * - `admin.width` — `"100%"`
```

**2 — the `admin` default object in `relationship()`.**

```ts
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      layout: [],
      placeholder: "",
      components: {},
      ...options?.admin,
    },
```

#### packages/core/src/fields/upload/config.ts

1 edit — the `admin` default object in `upload()` (no JSDoc bullet list exists in this file to update).

```ts
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      layout: [],
      placeholder: "",
      ...options.admin,
    },
```

#### packages/core/src/fields/upload/config.test.ts

1 edit — anchored by `expect(field.admin.width).toBe("full");` in the `"creates an upload field with defaults"` test.

```ts
    expect(field.admin.width).toBe("100%");
    expect(field.admin.layout).toEqual([]);
```

#### packages/core/src/fields/richtext/types.ts

1 edit — defaults list, anchored by the `**Defaults applied by `richtext()`:**` block.

```ts
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "100%",  // spans the full form width
 *     cellAlignment: "left",  // excerpt aligned left in the data table column
 *   }
 * }
 * ```
```

#### packages/core/src/fields/richtext/config.ts

2 edits.

**1 — JSDoc bullet.**

```ts
 * - `admin.width` — `"100%"`
```

**2 — the `admin` default object in `richtext()`.**

```ts
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      layout: [],
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
    },
```

#### packages/core/src/fields/richtext/config.test.ts

1 edit — anchored by the `"applies the same admin defaults as every other field"` test's `expect(field.admin).toEqual({...})`.

```ts
    expect(field.admin).toEqual({
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      layout: [],
      placeholder: "",
    });
```

#### packages/core/src/fields/array/types.ts

1 edit — defaults list, anchored by the `**Defaults applied by `array()`:**` block.

```ts
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "100%",  // spans the full form width
 *     cellAlignment: "left",  // item count aligned left in the data table column
 *   }
 * }
 * ```
```

#### packages/core/src/fields/array/config.ts

2 edits.

**1 — JSDoc bullet.**

```ts
 * - `admin.width` — `"100%"`
```

**2 — the `admin` default object in `array()`.**

```ts
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      layout: [],
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
    },
```

#### packages/core/src/fields/blocks/types.ts

1 edit — defaults list, anchored by the `**Defaults applied by `blocks()`:**` block.

```ts
 *   admin: {
 *     hidden: false, readOnly: false, position: "main", width: "100%",
 *     cellAlignment: "left",
 *   }
 * }
 * ```
```

#### packages/core/src/fields/blocks/config.ts

1 edit — the `admin` default object in `blocks()` (no JSDoc bullet list exists in this file to update).

```ts
    admin: {
      defaultCollapsed: options.admin?.defaultCollapsed ?? false,
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      layout: [],
      placeholder: "",
      ...options?.admin,
    },
```

#### packages/core/src/fields/group/types.ts

1 edit — defaults list, anchored by the `**Defaults applied by `group()`:**` block.

```ts
 *   admin: {
 *     hidden:            false,
 *     readOnly:          false,
 *     position:          "main",
 *     width:             "100%",
 *     cellAlignment:     "left",
 *     defaultCollapsed:  false,
 *   }
 * }
 * ```
```

#### packages/core/src/fields/group/config.ts

2 edits.

**1 — JSDoc bullet.**

```ts
 * - `admin.width` — `"100%"`
```

**2 — the `admin` default object in `group()`.**

```ts
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      layout: [],
      placeholder: "",
      defaultCollapsed: false,
      ...options?.admin,
    },
```

#### packages/react/src/index.ts

1 edit — anchored by `export { text, number, select, date, url, checkbox, defineConfig } from "@vexcms/core";`.

```ts
export {
  text,
  number,
  select,
  date,
  url,
  checkbox,
  tabs,
  collapsible,
  row,
  defineConfig,
} from "@vexcms/core";
```

#### packages/core/src/fields/email/types.ts

1 edit — defaults list, anchored by the `**Defaults applied by `email()`:**` block (step 2).

```ts
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "100%",  // spans the full form width
 *     cellAlignment: "left",  // text aligned left in the data table column
 *   }
 * }
 * ```
```

#### packages/core/src/fields/email/config.ts

2 edits.

**1 — JSDoc bullet.**

```ts
 * - `admin.width` — `"100%"`
```

**2 — the `admin` default object in `email()`.**

```ts
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      layout: [],
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
    },
```

#### packages/core/src/fields/textarea/types.ts

1 edit — defaults list, anchored by the `**Defaults applied by `textarea()`:**` block (step 3).

```ts
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "100%",  // spans the full form width
 *     cellAlignment: "left",  // text aligned left in the data table column
 *   }
 * }
 * ```
```

#### packages/core/src/fields/textarea/config.ts

2 edits.

**1 — JSDoc bullet.**

```ts
 * - `admin.width` — `"100%"`
```

**2 — the `admin` default object in `textarea()`.**

```ts
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      layout: [],
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
    },
```

#### packages/core/src/fields/json/types.ts

1 edit — defaults list, anchored by the `**Defaults applied by `json()`:**` block (step 4).

```ts
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "100%",  // spans the full form width
 *     cellAlignment: "left",  // preview aligned left in the data table column
 *   }
 * }
 * ```
```

#### packages/core/src/fields/json/config.ts

2 edits.

**1 — JSDoc bullet.**

```ts
 * - `admin.width` — `"100%"`
```

**2 — the `admin` default object in `json()`.**

```ts
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      layout: [],
      placeholder: "",
      ...options?.admin,
    },
```

#### packages/core/src/fields/json/config.test.ts

1 edit — anchored by `width: "full",` inside the `"applies admin defaults"` test's `toMatchObject` call.

```ts
      width: "100%",
```

Verify: pnpm typecheck && pnpm --filter @vexcms/core test -- fields/layout

### Step 7 — Server-side condition enforcement [agent]

- [ ] `packages/core/src/fields/inputSchemas/index.ts` — `adminFieldToInputSchema` evaluates each field's own `admin.condition` (via Step 6's `isFieldConditionMet`) before dispatch; condition-false → `z.unknown()`; threads `data`/`siblingData` to `group`/`array`/`blocks`
- [ ] `packages/core/src/fields/utils.ts` — `getFieldsInputSchema({ …, data })` forwards `data`/per-field `siblingData`/`key` into `adminFieldToInputSchema`; `validateFields` skips a field whose condition is false
- [ ] `packages/core/src/fields/group/inputSchema.ts` — threads `data`/`siblingData` to every sub-field (`siblingData[key]`, computed by the caller, IS the group's own resolved value shared by every sub-field)
- [ ] `packages/core/src/fields/array/inputSchema.ts` — threads `data`; when `field.items` (or anything nested in it) declares a condition, re-parses each item in a `superRefine` with that item as its own `siblingData`; otherwise keeps the current static schema
- [ ] `packages/core/src/fields/blocks/inputSchema.ts` — threads `data`; when any block's fields declare a condition, re-parses each item against its matching block's real schema in a `superRefine`, item as `siblingData`; otherwise keeps the current static discriminated-union schema
- [ ] `packages/core/src/api/prepareEdit.ts` — passes `data: transformedFields` to `getFieldsInputSchema`
- [ ] `packages/core/src/fields/utils.test.ts` (Step 1 already creates this file for `resolveFieldLimit` — append a new `describe` block) — hidden-by-condition required field accepted; visible required field still fails, naming it; a throwing condition counts as met; no-`data` call unaffected
- [ ] `packages/core/src/fields/validateFields.test.ts` — a condition-hidden field's `validate()` never runs
- [ ] `packages/core/src/fields/array/inputSchema.test.ts` — sibling-conditioned required field inside an array item (group items), static schema preserved when no condition is present
- [ ] `packages/core/src/fields/blocks/inputSchema.test.ts` — sibling-conditioned required field inside a block item, static schema preserved when no block declares a condition
- [ ] `packages/core/src/api/prepareEdit.test.ts` — `create` with a hidden required field succeeds; `create` with the same field made visible still fails and names it

Why: a required field hidden by its condition must not block `create`, and its `validate()` must not run (interview decision 7). Step 6 defines `admin.condition`/`isFieldConditionMet`/`hasFieldConditions` as pure, data-driven functions; this step is the one place the server actually calls them — everywhere a Zod input schema or a `validate()` hook is built.

**Design note (reported per P-023 — nothing here contradicts the contract, these are internal details the contract left to this step):** `adminFieldToInputSchema`'s fixed signature (`field`, `ignoreRequired?`, `data?`, `siblingData?`) has no way for a `group`'s own builder to know ITS OWN key within whatever object `siblingData` holds — needed to compute its sub-fields' shared `siblingData` (= the group's own resolved value) ahead of time, since a group's shape is fixed at schema-build time. I added an internal `key?: string` parameter to `adminFieldToInputSchema` ONLY (not part of the fixed contract surface, not used by any other step) carrying the field's own key, supplied by whichever loop iterates a keyed field map (`getFieldsInputSchema` for top-level fields, `groupFieldToInputSchema`/the blocks per-item builder for their own sub-fields). `array`/`blocks` items are positional, not keyed, so their own per-sub-field dispatch passes `key: undefined` — the item's resolved value (computed at validate time inside a `superRefine`, not schema-build time, since items repeat) IS directly used as `siblingData`, with no key-indexing needed.

#### packages/core/src/fields/inputSchemas/index.ts

2 edits: add the `zod` and `isFieldConditionMet` imports plus the leaf-field imports Steps 2–4 add ahead of this step, then replace `adminFieldToInputSchema`'s complete body. Dispatch order confirmed against each step's own (re-anchored) section: `email` (step 2) sits right after the `text` case; `textarea` (step 3) is anchored right after the `email` case; `json` (step 4) is anchored right after `textarea` — so the final leaf order is `text, email, textarea, json, number, …`, all four grouped at the top, before every other leaf/container case.

**1 — imports, top of file.**

```ts
import * as z from "zod";
import { ADMIN_FIELDS, type AdminFieldType } from "../constants";
import { AdminField } from "../types";
import { textFieldToInputSchema } from "../text";
import { emailFieldToInputSchema } from "../email";
import { textareaFieldToInputSchema } from "../textarea";
import { jsonFieldToInputSchema } from "../json";
import { numberFieldToInputSchema } from "../number";
import { checkboxFieldToInputSchema } from "../checkbox";
import { dateFieldToInputSchema } from "../date";
import { selectFieldToInputSchema } from "../select";
import { urlFieldToInputSchema } from "../url";
import { colorFieldToInputSchema } from "../color";
import { relationshipFieldToInputSchema } from "../relationship";
import { arrayFieldToInputSchema } from "../array";
import { groupFieldToInputSchema } from "../group";
import { blocksFieldToInputSchema } from "../blocks";
import { uploadFieldToInputSchema } from "../upload";
import { richTextFieldToInputSchema } from "../richtext";
import { isFieldConditionMet } from "../layout";
```

**2 — complete `adminFieldToInputSchema`, replacing the current function (including its JSDoc).**

```ts
/**
 * Converts any field definition to its form input schema using zod.
 *
 * Dispatches to the field-type-specific input schema function based on `field.type`.
 * Used by the admin panel while form rendering to build the form input for individual fields, collections, blocks, and globals.
 *
 * When `data` is given, first checks `field`'s own `admin.condition` against
 * `(data, siblingData)` (Step 6's `isFieldConditionMet` — no condition, or a
 * throwing one, counts as met). A condition-false field short-circuits to
 * `z.unknown().optional()`: present in the schema (so its submitted value,
 * which the client keeps per the contract, still round-trips) but
 * completely unvalidated and allowed to be missing — Zod v4's bare
 * `z.unknown()` is itself non-optional (rejects an absent key with
 * `"expected nonoptional, received undefined"`), so a condition-hidden
 * field would otherwise still fail a required parent object's own parse —
 * `required` and any type/format check are skipped.
 * `data` reproduces today's behavior exactly: every field is built and
 * validated regardless of `admin.condition`.
 *
 * For a field that dispatches into `group`, `siblingData` for that field's
 * OWN sub-fields is this field's resolved value — `siblingData[key]`, where
 * `siblingData` is whatever object contains this field (`data` itself at
 * the top level) and `key` is this field's own key within it. `array`/
 * `blocks` items are positional, not keyed, so their per-item `siblingData`
 * is instead computed at validate time inside
 * `arrayFieldToInputSchema`/`blocksFieldToInputSchema`'s own `superRefine`,
 * directly from the value being parsed — `adminFieldToInputSchema` is still
 * the function that evaluates each of THEIR sub-fields' own conditions, just
 * called with `key: undefined` (the item's value needs no further indexing).
 *
 * @param props - Input props
 * @param props.field - The resolved field definition to convert
 * @param props.ignoreRequired - When true, this field — and, recursively,
 *   every sub-field a container type (`group`/`array`/`blocks`) dispatches
 *   back through this function — is built as if `required: false`, by
 *   overriding `field.required` before dispatch rather than duplicating
 *   per-type builder logic. A configured `min`/`max` still applies to a
 *   non-empty value exactly as it does for an optional field today; only the
 *   "must be present/non-empty" check `required` itself adds is skipped.
 *   Used by `getFieldsInputSchema`'s own `ignoreRequired` for draft saves
 *   (`prepareEdit`, `saveDraft` — a draft may omit required fields at any
 *   depth).
 * @param props.data - The full top-level document, unchanged through every
 *   level of recursion. Omit to skip condition evaluation entirely (today's
 *   behavior). Forwarded as-is to every nested field's own condition check
 *   and to `array`/`blocks`' per-item condition re-parse.
 * @param props.siblingData - The object containing `field`'s true siblings —
 *   `data` itself for a top-level field, a group's own resolved value for
 *   one of its sub-fields, an array/block item for one of ITS sub-fields.
 *   Missing/`undefined` falls back to `{}` so a condition referencing an
 *   absent sibling sees `undefined` rather than throwing.
 * @param props.key - `field`'s own key within `siblingData`, when known
 *   (top-level and group sub-field dispatch supply it; array/blocks item
 *   dispatch does not — an item's resolved value IS its own `siblingData`,
 *   with no extra key to index through). Used only to compute the
 *   `siblingData` this field's OWN sub-fields see, when it is itself a
 *   `group`.
 * @returns A ZodType (e.g. `z.string()`, `z.boolean().optional().default(false)`), or `z.unknown().optional()` when `data` is given and the field's condition is false
 * @throws An Error if an unrecognized field type is given. Reaching this is a
 * compile error: the default arm binds the exhausted union to `never`, so a new
 * member of `AdminField` fails typecheck here until a case is added
 *
 * @see {@link textFieldToInputSchema} for the text field implementation
 * @see {@link numberFieldToInputSchema} for the number field implementation
 * @see {@link checkboxFieldToInputSchema} for the checkbox field implementation
 * @internal
 */
export function adminFieldToInputSchema(props: {
  field: AdminField;
  ignoreRequired?: boolean;
  data?: Record<string, unknown>;
  siblingData?: Record<string, unknown>;
  key?: string;
}) {
  if (
    props.data !== undefined &&
    !isFieldConditionMet({
      field: props.field,
      data: props.data,
      siblingData: props.siblingData ?? {},
    })
  ) {
    return z.unknown().optional();
  }

  const effectiveField: AdminField = props.ignoreRequired
    ? { ...props.field, required: false }
    : props.field;
  // Captured before the switch narrows `effectiveField`: inside the default arm the
  // union is exhausted to `never`, and `never.type` is not a usable string.
  const fieldType: AdminFieldType = effectiveField.type;

  const childSiblingData: Record<string, unknown> | undefined =
    props.data === undefined
      ? undefined
      : props.key !== undefined
        ? (props.siblingData?.[props.key] as Record<string, unknown> | undefined)
        : props.siblingData;

  switch (effectiveField.type) {
    case ADMIN_FIELDS.text.type:
      return textFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.email.type:
      return emailFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.textarea.type:
      return textareaFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.json.type:
      return jsonFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.number.type:
      return numberFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.checkbox.type:
      return checkboxFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.date.type:
      return dateFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.select.type:
      return selectFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.url.type:
      return urlFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.color.type:
      return colorFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.relationship.type:
      return relationshipFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.array.type:
      return arrayFieldToInputSchema({
        field: effectiveField,
        ignoreRequired: props.ignoreRequired,
        data: props.data,
      });
    case ADMIN_FIELDS.group.type:
      return groupFieldToInputSchema({
        field: effectiveField,
        ignoreRequired: props.ignoreRequired,
        data: props.data,
        siblingData: childSiblingData,
      });
    case ADMIN_FIELDS.blocks.type:
      return blocksFieldToInputSchema({
        field: effectiveField,
        ignoreRequired: props.ignoreRequired,
        data: props.data,
      });
    case ADMIN_FIELDS.upload.type:
      return uploadFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.richtext.type:
      return richTextFieldToInputSchema({ field: effectiveField });
    default: {
      const unhandled: never = effectiveField;
      throw new Error(
        `unrecognized field type: ${fieldType} — ${JSON.stringify(unhandled)}`,
      );
    }
  }
}
```

#### packages/core/src/fields/utils.ts

2 edits: add the `isFieldConditionMet` import, then the complete bodies of `getFieldsInputSchema` and `validateFields` (JSDoc included).

**1 — import, after the existing `adminFieldToInputSchema` import.**

```ts
import { ConvexError, type Value } from "convex/values";
import * as z from "zod";
import type { ZodType } from "zod";
import { AdminField } from "./types";
import { adminFieldToInputSchema } from "./inputSchemas";
import { isFieldConditionMet } from "./layout";
import { createVexCallbackApi, type VexCallbackApi } from "../api/server";
import type { VexConfig } from "../config";
import type { TDocument } from "../api/convex";
import type { VexMutationCtx } from "../types/generated";
```

**2 — complete `getFieldsInputSchema`.**

```ts
/**
 * Builds the Zod input schema for a field map — a collection's or a
 * global's `fields`. Hidden fields are skipped.
 *
 * @param props.fields - The resource's resolved field map.
 * @param props.partial - When true, every TOP-LEVEL field becomes optional
 *   (`update`/`saveDraft`'s lenient mode); omit for strict, full-schema
 *   validation (`create`, `publish` — decision 4).
 * @param props.ignoreRequired - When true, every field — at every nesting
 *   depth (group sub-fields, array items, blocks' block fields, and any
 *   further recursion) — is built as if `required: false` (forwarded to
 *   `adminFieldToInputSchema`'s own `ignoreRequired`). A configured
 *   `min`/`max` still applies to a non-empty value exactly as it does for an
 *   optional field today; only the "must be present/non-empty" check
 *   `required` itself adds is skipped. `saveDraft` sets this — a draft may
 *   leave a required field empty at any depth; `publish`/`create`/`update`
 *   do not.
 * @param props.data - The merged document being validated (`prepareEdit`
 *   passes `transformedFields`). When given, every field whose
 *   `admin.condition` evaluates false against `(data, siblingData)` — where
 *   a top-level field's `siblingData` is `data` itself — is built as
 *   `z.unknown()` instead of its real schema: present (so a hidden field's
 *   kept value still round-trips), but neither its `required` check nor any
 *   type/format validation runs. A nested `group`/`array`/`blocks` field
 *   threads `data` through to its own sub-fields/items so a condition
 *   anywhere in the tree is honored, not just at the top level. Omit to
 *   keep today's behavior — every field validated regardless of
 *   `admin.condition` — unchanged, for every caller that doesn't track live
 *   form values.
 * @returns The object schema.
 *
 * @example
 * ```ts
 * const schema = getFieldsInputSchema({ fields: posts.fields, partial: true });
 * ```
 */
export function getFieldsInputSchema(props: {
  fields: Record<string, AdminField>;
  partial?: boolean;
  ignoreRequired?: boolean;
  data?: Record<string, unknown>;
}) {
  const res: Record<string, ZodType> = {};
  for (const [fieldKey, fieldDef] of Object.entries(props.fields)) {
    if (fieldDef.admin.hidden) continue;
    res[fieldKey] = adminFieldToInputSchema({
      field: fieldDef,
      ignoreRequired: props.ignoreRequired,
      data: props.data,
      siblingData: props.data,
      key: fieldKey,
    });
  }
  const schema = z.object({ ...res });
  return props.partial ? schema.partial() : schema;
}
```

**3 — complete `validateFields`.**

```ts
/**
 * Runs each changed field's `validate()` against the merged document, skipping
 * fields whose key isn't in `keys` (unchanged on `update`, every field on
 * `create`), that don't define `validate`, or whose `admin.condition`
 * evaluates false — a condition-hidden field's `validate()` never runs,
 * matching `getFieldsInputSchema`'s schema-level skip (Step 7). `doc` stands
 * in for both `data` and `siblingData` here: `validateFields` only ever runs
 * a TOP-LEVEL field's own `validate()` (a `group`/`array`/`blocks`
 * sub-field's `validate()`, if any, runs through the container field's own
 * value, not individually), so the two are the same object at this depth —
 * exactly like `getFieldsInputSchema`'s top-level fields, where `siblingData`
 * is `data` itself.
 *
 * A field reports failure by **throwing**, not by returning a message: a
 * thrown error carries a stack, can be a project's own error subclass, and can
 * attach arbitrary structured data through `ConvexError`. A returned string
 * could carry none of that, and made the success path (`return undefined`)
 * easy to hit by accident.
 *
 * Whatever a field throws is re-thrown as a `ConvexError` carrying the field
 * key, so the admin panel can attribute the failure to one input. A
 * `ConvexError`'s own `data` is preserved verbatim — an object payload is
 * merged with `field`, a plain-string payload becomes `message` — so a project
 * can surface codes or hints of its own.
 *
 * @param props - The resource's field map (a collection's or a global's), resolved document, changed field keys, mutation
 *   ctx, and resolved config (needed to build the `vex` api each callback receives).
 * @returns Nothing; resolves once every applicable field's `validate()` has passed.
 * @throws {ConvexError} With `{ field, message, ... }` for the first field that throws.
 */
export async function validateFields(props: {
  fields: Record<string, AdminField>;
  doc: Record<string, unknown>;
  keys: Iterable<string>;
  ctx: VexMutationCtx;
  config: VexConfig;
}): Promise<void> {
  const keys = new Set(props.keys);
  // Built once per write, not per field: it closes over nothing field-specific.
  const vex = createVexCallbackApi({ ctx: props.ctx, config: props.config });
  for (const [fieldKey, field] of Object.entries(props.fields)) {
    if (!keys.has(fieldKey) || !field.validate) continue;
    if (!isFieldConditionMet({ field, data: props.doc, siblingData: props.doc })) continue;
    const validate = field.validate as unknown as (props: {
      value: unknown;
      doc: Record<string, unknown>;
      fieldKey: string;
      field: unknown;
      ctx: VexMutationCtx;
      vex: VexCallbackApi;
    }) => Promise<void> | void;

    try {
      await validate({
        value: props.doc[fieldKey],
        doc: props.doc,
        fieldKey,
        field,
        ctx: props.ctx,
        vex,
      });
    } catch (thrown) {
      throw toFieldValidationError({ thrown, fieldKey });
    }
  }
}
```

#### packages/core/src/fields/group/inputSchema.ts

1 edit — complete `groupFieldToInputSchema`, replacing the current function (including its JSDoc).

```ts
/**
 * Builds a Zod schema for validating a group field value in the admin form.
 *
 * Constructs a `z.object({...})` where each key maps to the sub-field's own
 * Zod schema via `adminFieldToInputSchema`; sub-field defaults and
 * optionality are handled recursively. Required groups attach
 * `{ error: "This field is required." }` to the base `z.object()` call and
 * never receive `.default()` — previously an unconditional
 * `.default(field.defaultValue ?? {})` meant a missing group value silently
 * passed the required check (CORE-1). Non-required groups keep
 * `.default(field.defaultValue ?? {})`. The outer object also receives
 * `.optional()` when `field.required` is `false` via
 * `applyBaseInputSchemaMeta`.
 *
 * @param props - Input props.
 * @param props.field - The resolved group field definition.
 * @param props.ignoreRequired - Forwarded to every recursive
 *   `adminFieldToInputSchema({ field: subField })` call so a draft-lenient
 *   pass (`getFieldsInputSchema`'s `ignoreRequired`) reaches every sub-field,
 *   not just this group's own `required` check.
 * @param props.data - The full top-level document, forwarded unchanged to
 *   every sub-field so each can evaluate its own `admin.condition` and, if
 *   it is itself a container, continue threading `data` further down.
 *   Omitted entirely skips condition evaluation (Step 7).
 * @param props.siblingData - This group's OWN resolved value — the object
 *   every one of its sub-fields sees as `siblingData` for its own condition
 *   check, since they are each other's true siblings. Computed by whichever
 *   call dispatched into this function (`adminFieldToInputSchema`, as
 *   `siblingData[key]` where `key` is this group's own key).
 * @returns A Zod object schema with optionality applied.
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
  field: GroupField<VexResourceSlug, TFieldMeta>;
  ignoreRequired?: boolean;
  data?: Record<string, unknown>;
  siblingData?: Record<string, unknown>;
}): ZodType {
  const { field } = props;

  const subSchemas = Object.fromEntries(
    Object.entries(field.fields).map(([key, subField]) => [
      key,
      adminFieldToInputSchema({
        field: subField,
        ignoreRequired: props.ignoreRequired,
        data: props.data,
        siblingData: props.siblingData,
        key,
      }),
    ]),
  );
  const schema: ZodType = field.required
    ? z.object(subSchemas, { error: "This field is required." })
    : z.object(subSchemas).default(field.defaultValue ?? {});

  return applyBaseInputSchemaMeta({ field, inputSchema: schema });
}
```

#### packages/core/src/fields/array/inputSchema.ts

2 edits: add the `hasFieldConditions` import, then the complete `arrayFieldToInputSchema` body (JSDoc included).

**1 — import, after the existing `adminFieldToInputSchema` import.**

```ts
import * as z from "zod";
import type { ZodType } from "zod";
import { ArrayField, ArrayType } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import { adminFieldToInputSchema } from "../inputSchemas";
import { hasFieldConditions } from "../layout";
import type { VexResourceSlug } from "../../types/generated";
```

**2 — complete `arrayFieldToInputSchema`.**

```ts
/**
 * Builds a Zod schema for validating an array field value in the admin form.
 *
 * Wraps the nested item schema (built recursively via `adminFieldToInputSchema`)
 * in `z.array(…)`, then composes `min`/`max` item-count constraints onto the
 * same chain built for `required`, rather than reassigning over it — a
 * required field with `min`/`max` configured keeps every check. Required
 * fields attach `{ error: "This field is required." }` to the base
 * `z.array()` call and add `.min(1, "This field is required.")`, replacing
 * the previous dead `superRefine` (it only ever checked for `undefined`/
 * `null`, which the previously-unconditional `.default()` had already
 * substituted away before the refine ran, and it never checked emptiness at
 * all) (CORE-1). Required fields never receive `.default()`; non-required
 * fields keep `.default(field.defaultValue ?? [])`.
 *
 * `min`/`max` are independent of `required`, but only skip an *empty* array
 * when the field is optional: an optional field's empty/omitted value
 * shouldn't fail its own `min`, but a required field's empty value is
 * already invalid (via `.min(1, requiredError)` above), so its configured
 * `min`/`max` still runs on `[]` too — otherwise a required field's own
 * custom `min`/`max` error message could never surface (an empty array is
 * the only way to violate a `min` in the first place) and only the generic
 * "This field is required." would ever show. A non-empty array — required
 * or not — is always checked against a configured `min`/`max`.
 *
 * When `props.data` is given AND `field.items` (or anything nested inside
 * it) declares an `admin.condition` (`hasFieldConditions`), each array ITEM
 * needs its own `siblingData` — unlike a `group`'s sub-fields, items are
 * positional, not keyed, so there is no single `data[key]` to compute up
 * front at schema-build time (Step 7). The base/outer item schema is built
 * loose (`z.unknown()`) instead of the real item schema — enforcing
 * `required` up front there would reject a condition-hidden field before
 * the real, condition-aware per-item re-parse ever runs — and a
 * `superRefine` re-parses every actual item against a fresh
 * `adminFieldToInputSchema({ field: field.items, data, siblingData: item })`
 * — `item` IS the new `siblingData`, since an array item's resolved value
 * has no extra key to index through, mirroring how `adminFieldToInputSchema`
 * already treats a missing `key` for item dispatch. Issues from that
 * re-parse are re-added through `ctx.addIssue` with the item's index
 * prepended to the path, so a failure still names the right item/field for
 * the admin form. Without conditions anywhere in `field.items`, the item
 * schema stays exactly what it was — a single
 * `adminFieldToInputSchema({ field: field.items, ignoreRequired })` call,
 * no `superRefine`, no added cost.
 *
 * @param props - Input props.
 * @param props.field - The resolved array field definition
 * @param props.ignoreRequired - Forwarded to the recursive
 *   `adminFieldToInputSchema({ field: field.items })` call so a draft-lenient
 *   pass (`getFieldsInputSchema`'s `ignoreRequired`) reaches every item, not
 *   just this array's own `required` check.
 * @param props.data - The full top-level document. Omitted skips condition
 *   evaluation for this array's items entirely (today's behavior).
 * @returns A Zod array schema with item count constraints and optionality applied
 *
 * @example
 * ```ts
 * const field = array({ items: text(), required: true })
 * arrayFieldToInputSchema({ field })
 * // → z.array(z.string(), { error: "This field is required." }).min(1, "This field is required.")
 * ```
 *
 * @example
 * ```ts
 * // Optional field, min/max still enforced once a value is supplied
 * const field = array({ items: number(), min: 2, max: 5 })
 * const schema = arrayFieldToInputSchema({ field })
 * schema.safeParse(undefined)   // → success: [] (skips min/max — empty)
 * schema.safeParse([1])         // → fails: below min
 * schema.safeParse([1, 2])      // → success
 * ```
 */
export function arrayFieldToInputSchema<
  TArrayType extends ArrayType = string,
  TFieldMeta extends {} = {},
>(props: {
  field: ArrayField<VexResourceSlug, TArrayType, TFieldMeta>;
  ignoreRequired?: boolean;
  data?: Record<string, unknown>;
}): ZodType {
  const { field } = props;
  const requiredError = "This field is required.";

  const itemsHaveConditions =
    props.data !== undefined && hasFieldConditions({ fields: { item: field.items } });

  const baseItemSchema = itemsHaveConditions
    ? z.unknown()
    : adminFieldToInputSchema({ field: field.items, ignoreRequired: props.ignoreRequired });

  let arraySchema = field.required
    ? z.array(baseItemSchema, { error: requiredError }).min(1, requiredError)
    : z.array(baseItemSchema);

  if (itemsHaveConditions) {
    arraySchema = arraySchema.superRefine((items, ctx) => {
      items.forEach((item, index) => {
        const itemSchema = adminFieldToInputSchema({
          field: field.items,
          ignoreRequired: props.ignoreRequired,
          data: props.data,
          siblingData: item as Record<string, unknown>,
        });
        const result = itemSchema.safeParse(item);
        if (!result.success) {
          for (const issue of result.error.issues) {
            ctx.addIssue({ code: "custom", message: issue.message, path: [index, ...issue.path] });
          }
        }
      });
    });
  }

  if (field.min) {
    const [min, message] = field.min;
    arraySchema = arraySchema.refine(
      (value) => (!field.required && value.length === 0) || value.length >= min,
      message,
    );
  }
  if (field.max) {
    const [max, message] = field.max;
    arraySchema = arraySchema.refine(
      (value) => (!field.required && value.length === 0) || value.length <= max,
      message,
    );
  }

  const inputSchema: ZodType = field.required
    ? arraySchema
    : arraySchema.default(field.defaultValue ?? []);

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
```

Note: `field.min`/`field.max` are shown destructured as `[min, message]` — Step 1's resolved `FieldLimit = readonly [value: number, error: string]` tuple, which `array`'s own Step 1 edit already lands on this same field.

#### packages/core/src/fields/blocks/inputSchema.ts

2 edits: add the `hasFieldConditions` import and widen the `BlocksField` type import to also bring in `BlockConfig`, then the complete `blocksFieldToInputSchema` body (JSDoc included).

**1 — imports, top of file.**

```ts
import * as z from "zod";
import type { ZodType } from "zod";
import { adminFieldToInputSchema } from "../inputSchemas";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import { hasFieldConditions } from "../layout";
import type { BlockConfig, BlocksField } from "./types";
import type { VexResourceSlug } from "../../types/generated";
```

**2 — complete `blocksFieldToInputSchema`.**

```ts
/**
 * Builds a Zod schema for validating a blocks field value in the admin form.
 *
 * Each block type becomes a `z.object()` with `blockType: z.literal(slug)`,
 * `blockName: z.string().optional()`, and `id: z.string()` as framework
 * keys, plus the block's own sub-field schemas from `adminFieldToInputSchema`.
 * Multiple block types use `z.discriminatedUnion("blockType", [...])`. A
 * single block type uses a plain `z.array(z.object(...))`. Required fields
 * attach `{ error: "This field is required." }` to the base `z.array()` call
 * and add `.min(1, "This field is required.")`, composed onto (not
 * overwriting) the configured `field.min`/`field.max`, so a required blocks
 * field with no length constraint of its own — previously zero enforcement —
 * now rejects a missing or empty value (CORE-1). Required fields never
 * receive `.default()`; non-required fields keep
 * `.default(field.defaultValue ?? [])`.
 *
 * `min`/`max` are independent of `required`: `required` governs whether the
 * field may be *empty*, `min`/`max` govern the block count *once a value is
 * supplied*. An empty array always skips both checks; a non-empty array —
 * required or not — is always checked against a configured `min`/`max`.
 *
 * When `props.data` is given AND any block's own `fields` (recursively)
 * declares an `admin.condition` (`hasFieldConditions`), each block item
 * needs its own `siblingData` the same way an array item does (Step 7) —
 * items are positional, so there is no single schema-build-time
 * `data[key]`. `blockSchemaFor` (the per-block-type `z.object()` builder) is
 * shared between the base pass and the per-item re-parse so block schemas
 * aren't built twice in different shapes. The base/outer schema falls back
 * to a loose `z.looseObject({ blockType: z.string(), id: z.string() })` per
 * item instead of the real discriminated union — enforcing `required` up
 * front there would reject a condition-hidden field before the real,
 * condition-aware per-item re-parse ever runs. A `superRefine` then
 * re-parses every actual item through its matching block's REAL schema
 * (`blockSchemaFor(blockDef, item)`, with `item` itself as `siblingData` —
 * a block item's own fields live directly on it, exactly like a `group`'s
 * resolved value), re-adding any issues through `ctx.addIssue` with the
 * item's index prepended to the path. Without conditions anywhere in any
 * block's `fields`, the item schema stays exactly what it was — the
 * discriminated union (or single block's object schema) built once, no
 * `superRefine`, no added cost.
 *
 * @param props - Input props.
 * @param props.field - The resolved blocks field definition.
 * @param props.ignoreRequired - Forwarded to every recursive
 *   `adminFieldToInputSchema({ field: subField })` call (one per block's own
 *   sub-fields) so a draft-lenient pass (`getFieldsInputSchema`'s
 *   `ignoreRequired`) reaches every block field, not just this field's own
 *   `required` check.
 * @param props.data - The full top-level document. Omitted skips condition
 *   evaluation for every block's fields entirely (today's behavior).
 * @returns A Zod array schema with discriminated-union items.
 *
 * @internal — Used by admin form schema construction via `adminFieldToInputSchema`.
 */
export function blocksFieldToInputSchema<TFieldMeta extends {} = {}>(props: {
  field: BlocksField<VexResourceSlug, TFieldMeta>;
  ignoreRequired?: boolean;
  data?: Record<string, unknown>;
}): ZodType {
  const { field } = props;

  const blockSchemaFor = (
    block: BlockConfig<TFieldMeta>,
    itemSiblingData?: Record<string, unknown>,
  ) => {
    const userSubSchemas = Object.fromEntries(
      Object.entries(block.fields).map(([key, subField]) => [
        key,
        adminFieldToInputSchema({
          field: subField,
          ignoreRequired: props.ignoreRequired,
          data: props.data,
          siblingData: itemSiblingData,
          key,
        }),
      ]),
    );
    return z.object({
      blockType: z.literal(block.blockType),
      blockName: z.string().optional(),
      id: z.string(),
      ...userSubSchemas,
    });
  };

  const blockSchemas = field.blocks.map((block) => blockSchemaFor(block));

  const staticItemSchema =
    blockSchemas.length <= 1
      ? (blockSchemas[0] ?? z.object({ blockType: z.string(), id: z.string() }))
      : // @ts-expect-error mismatched zod types, works in practice
        z.discriminatedUnion("blockType", blockSchemas);

  const blocksHaveConditions =
    props.data !== undefined &&
    field.blocks.some((block) => hasFieldConditions({ fields: block.fields }));

  const itemSchema = blocksHaveConditions
    ? z.looseObject({ blockType: z.string(), id: z.string() })
    : staticItemSchema;

  const requiredError = "This field is required.";
  let arraySchema = field.required
    ? z.array(itemSchema, { error: requiredError }).min(1, requiredError)
    : z.array(itemSchema);

  if (blocksHaveConditions) {
    const blocksByType = new Map(field.blocks.map((block) => [block.blockType, block]));
    arraySchema = arraySchema.superRefine((items, ctx) => {
      items.forEach((item, index) => {
        const candidate = item as Record<string, unknown>;
        const blockType = typeof candidate.blockType === "string" ? candidate.blockType : undefined;
        const blockDef = blockType !== undefined ? blocksByType.get(blockType) : undefined;
        if (!blockDef) return;
        const result = blockSchemaFor(blockDef, candidate).safeParse(item);
        if (!result.success) {
          for (const issue of result.error.issues) {
            ctx.addIssue({ code: "custom", message: issue.message, path: [index, ...issue.path] });
          }
        }
      });
    });
  }

  if (field.min) {
    const [min, message] = field.min;
    arraySchema = arraySchema.refine(
      (value) => (!field.required && value.length === 0) || value.length >= min,
      message,
    );
  }
  if (field.max) {
    const [max, message] = field.max;
    arraySchema = arraySchema.refine(
      (value) => (!field.required && value.length === 0) || value.length <= max,
      message,
    );
  }

  const schema: ZodType = field.required
    ? arraySchema
    : arraySchema.default(field.defaultValue ?? []);

  return applyBaseInputSchemaMeta({ field, inputSchema: schema });
}
```

Note: `field.min`/`field.max` are shown destructured as `[min, message]` — Step 1's resolved `FieldLimit` tuple, which `blocks`'s own Step 1 edit already lands on this same field.

#### packages/core/src/api/prepareEdit.ts

1 edit — add `data: transformedFields` to the `getFieldsInputSchema` call.

**1 — in `prepareEdit`, the `getFieldsInputSchema({ … }).safeParse(transformedFields)` call.**

```ts
  const parsed = getFieldsInputSchema({
    fields: props.target.config.fields,
    partial: props.partial ?? false,
    ignoreRequired: props.action === DRAFT_ACTIONS.saveDraft,
    data: transformedFields,
  }).safeParse(transformedFields);
```

#### packages/core/src/fields/utils.test.ts

Step 1 already creates this file (testing `resolveFieldLimit`). 2 edits: widen its imports, then append a new `describe` block for `getFieldsInputSchema`'s condition-aware behavior.

**1 — imports, top of file (Step 1's version is `import { describe, it, expect } from "vitest";` / `import { resolveFieldLimit } from "./utils";`).**

```ts
import { describe, it, expect } from "vitest";
import { checkbox, defineCollection, text } from "../index";
import { getFieldsInputSchema, resolveFieldLimit } from "./utils";
```

**2 — new `describe` block, appended after the closing `});` of `describe("resolveFieldLimit", …)`.**

```ts
describe("getFieldsInputSchema — admin.condition (data-aware schema)", () => {
  it("keeps a condition-hidden required field out of the required check, still accepting its value", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        showSecret: checkbox(),
        secret: text({
          required: true,
          admin: { condition: ({ siblingData }) => siblingData.showSecret === true },
        }),
      },
    });
    const schema = getFieldsInputSchema({
      fields: collection.fields,
      data: { showSecret: false },
    });
    expect(schema.safeParse({ showSecret: false }).success).toBe(true);
  });

  it("still fails a visible condition-gated required field, naming it in the issue path", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        showSecret: checkbox(),
        secret: text({
          required: true,
          admin: { condition: ({ siblingData }) => siblingData.showSecret === true },
        }),
      },
    });
    const schema = getFieldsInputSchema({
      fields: collection.fields,
      data: { showSecret: true },
    });
    const result = schema.safeParse({ showSecret: true });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "secret")).toBe(true);
    }
  });

  it("treats a throwing condition as met — fails visible, never silently skips validation", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        secret: text({
          required: true,
          admin: {
            condition: () => {
              throw new Error("boom");
            },
          },
        }),
      },
    });
    const schema = getFieldsInputSchema({ fields: collection.fields, data: {} });
    expect(schema.safeParse({}).success).toBe(false);
  });

  it("without `data`, behaves exactly as before — every field validated regardless of its condition", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        secret: text({ required: true, admin: { condition: () => false } }),
      },
    });
    const schema = getFieldsInputSchema({ fields: collection.fields });
    expect(schema.safeParse({}).success).toBe(false);
  });
});
```

#### packages/core/src/fields/validateFields.test.ts

2 edits: widen the `../index` import to add `checkbox`, then append one test to the end of the `describe("validateFields", …)` block.

**1 — import line.**

```ts
import { checkbox, defineCollection, text } from "../index";
```

**2 — new test, appended as the last test in `describe("validateFields", …)`, after `"awaits an async validate() and passes ctx/doc/fieldKey through"` and before the block's closing `});`.**

```ts
  it("skips a field whose condition is false, never calling its validate()", async () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        show: checkbox(),
        secret: text({
          admin: { condition: ({ siblingData }) => siblingData.show === true },
          validate: () => {
            throw new Error("should not run");
          },
        }),
      },
    });
    await expect(
      validateFields({
        fields: collection.fields,
        doc: { show: false, secret: "x" },
        keys: ["secret"],
        ctx: fixtureCtx,
        config: fixtureConfig,
      }),
    ).resolves.toBeUndefined();
  });
```

#### packages/core/src/fields/array/inputSchema.test.ts

2 edits: widen the `../group` import, then append a `describe` block for condition-aware items as the last block inside `describe("arrayFieldToInputSchema", …)`.

**1 — imports, top of file.**

```ts
import { describe, it, expect } from "vitest";
import { text, number } from "../index";
import { array } from "./config";
import { group } from "../group";
import { arrayFieldToInputSchema } from "./inputSchema";
import type { VexResourceSlug } from "../../types/generated";
```

**2 — new `describe` block, appended after `describe("metadata", …)` and before the closing `});` of `describe("arrayFieldToInputSchema", …)`.**

```ts
  describe("condition-aware item fields (data-aware schema)", () => {
    const itemFields = {
      kind: text({ required: true }),
      detail: text({
        required: true,
        admin: { condition: ({ siblingData }) => siblingData.kind === "detailed" },
      }),
    };

    it("skips a hidden sibling-conditioned required field inside an array item", () => {
      const field = array({ items: group({ fields: itemFields }) });
      const schema = arrayFieldToInputSchema({ field, data: {} });
      const result = schema.safeParse([{ kind: "simple" }]);
      expect(result.success).toBe(true);
    });

    it("still fails a visible sibling-conditioned required field inside an array item", () => {
      const field = array({ items: group({ fields: itemFields }) });
      const schema = arrayFieldToInputSchema({ field, data: {} });
      const result = schema.safeParse([{ kind: "detailed" }]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes("detail"))).toBe(true);
      }
    });

    it("keeps the current static schema when item fields declare no conditions, even with data supplied", () => {
      const field = array({ items: text({ required: true }) });
      const schema = arrayFieldToInputSchema({ field, data: {} });
      expect(schema.safeParse(["ok"]).success).toBe(true);
      expect(schema.safeParse([""]).success).toBe(false);
    });
  });
```

#### packages/core/src/fields/blocks/inputSchema.test.ts

1 edit — append a `describe` block for condition-aware block items as the last block inside `describe("blocksFieldToInputSchema", …)`, reusing the file's existing `headingBlock` fixture and `makeItem` helper.

**1 — new `describe` block, appended after the `"rejects an explicit empty array on a required field"` test and before the closing `});` of `describe("blocksFieldToInputSchema", …)`.**

```ts
  describe("condition-aware item fields (data-aware schema)", () => {
    const toggleBlock = defineBlock({
      slug: "toggle",
      label: "Toggle",
      fields: {
        kind: text({ required: true }),
        detail: text({
          required: true,
          admin: { condition: ({ siblingData }) => siblingData.kind === "detailed" },
        }),
      },
    });

    it("skips a hidden sibling-conditioned required field inside a block item", () => {
      const field = blocks({ blocks: [toggleBlock] });
      const schema = blocksFieldToInputSchema({ field, data: {} });
      const result = schema.safeParse([makeItem("toggle", { kind: "simple" })]);
      expect(result.success).toBe(true);
    });

    it("still fails a visible sibling-conditioned required field inside a block item, naming it", () => {
      const field = blocks({ blocks: [toggleBlock] });
      const schema = blocksFieldToInputSchema({ field, data: {} });
      const result = schema.safeParse([makeItem("toggle", { kind: "detailed" })]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes("detail"))).toBe(true);
      }
    });

    it("keeps the current static schema when no block declares a condition, even with data supplied", () => {
      const field = blocks({ blocks: [headingBlock] });
      const schema = blocksFieldToInputSchema({ field, data: {} });
      expect(schema.safeParse([makeItem("heading", { text: "Hi" })]).success).toBe(true);
      expect(schema.safeParse([makeItem("heading", { text: null })]).success).toBe(false);
    });
  });
```

#### packages/core/src/api/prepareEdit.test.ts

2 edits: widen the `../index` import to add `checkbox`, then append two tests to the end of the `describe("prepareEdit", …)` block.

**1 — import line.**

```ts
import { defineCollection, defineGlobal, text, checkbox } from "../index";
```

**2 — new tests, appended after `"an access denial throws VexAccessError before beforeChange or validation run"` and before the closing `});` of `describe("prepareEdit", …)`.**

```ts
  test("create succeeds when a required field is hidden by its own condition", async () => {
    const conditionalPosts = defineCollection({
      slug: "posts",
      fields: {
        showSecret: checkbox(),
        secret: text({
          required: true,
          admin: { condition: ({ siblingData }) => siblingData.showSecret === true },
        }),
      },
    });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await expect(
        prepareEdit({
          ctx,
          config: { collections: [conditionalPosts] } as unknown as VexConfig,
          target: { kind: "collection", config: conditionalPosts },
          action: CRUD_ACTIONS.create,
          storedDoc: undefined,
          changes: { showSecret: false },
          partial: false,
          validateKeys: "all",
        }),
      ).resolves.toBeDefined();
    });
  });

  test("create still rejects the same required field once its condition makes it visible, naming it", async () => {
    const conditionalPosts = defineCollection({
      slug: "posts",
      fields: {
        showSecret: checkbox(),
        secret: text({
          required: true,
          admin: { condition: ({ siblingData }) => siblingData.showSecret === true },
        }),
      },
    });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      let caught: unknown;
      try {
        await prepareEdit({
          ctx,
          config: { collections: [conditionalPosts] } as unknown as VexConfig,
          target: { kind: "collection", config: conditionalPosts },
          action: CRUD_ACTIONS.create,
          storedDoc: undefined,
          changes: { showSecret: true },
          partial: false,
          validateKeys: "all",
        });
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(ConvexError);
      const data = (caught as ConvexError<{ message: string; errors: string }>).data;
      expect(data.errors).toContain("secret");
    });
  });
```

Verify: pnpm --filter @vexcms/core test -- prepareEdit fields

### Step 8 — Input masks: `admin.mask` + `fields.inputMasks` [agent]

- [ ] `pnpm-workspace.yaml` catalog + `packages/react/package.json` — `use-mask-input` (P-015)
- [ ] `packages/core/src/fields/mask/` — `types.ts` (`FieldMaskInput`, `FieldMask`, `MASKABLE_FIELD_TYPES`), `utils.ts` (`resolveFieldMask`), `index.ts` + tests
- [ ] `packages/core/src/fields/index.ts` — export the `mask` barrel
- [ ] text / email / number / url `types.ts` + `config.ts` — `admin.mask`
- [ ] `packages/core/src/config/types.ts` + `config.ts` + `config.test.ts` — `fields.inputMasks` on client config input/resolved
- [ ] `packages/react/src/hooks/useFieldMask.ts` + test — lazy `import("use-mask-input")`, unmask/`storeMasked`
- [ ] `packages/react/src/hooks/index.ts` — export `useFieldMask`
- [ ] text / email / number / url `Input.tsx` — apply mask (number renders `type="text"` when masked, stores a number)

Why: opt-in masks with project-wide defaults; lazy-loaded so unmasked forms pay nothing.

`use-mask-input@3.14.2`'s `useMaskInput`/`withMask` return a plain DOM
`RefCallback` that hands the element straight to Inputmask — Inputmask owns
the element's displayed text and (with `autoUnmask: true`) overrides the
native `value` **getter** so `element.value`/`event.target.value` read the
raw unmasked string even while the screen shows the formatted one (confirmed
in the package's README: `options: { autoUnmask: true, unmaskAsNumber: true
}` makes `input.value` the number `1234.56` while the input displays `R$
1.234,56`). That getter override fights a React **controlled** input:
`value={field.state.value}` writes the unmasked value back into the DOM on
every render, undoing Inputmask's formatting mid-keystroke. `admin.mask`
inputs are therefore rendered **uncontrolled** — `defaultValue` once, `ref`
to Inputmask, `onInput` reading `e.currentTarget.value` (already unmasked
when `storeMasked` is false, per `autoUnmask`) into `field.handleChange`.
Unmasked inputs are untouched (still fully controlled). Two sibling
`<Input>` elements render depending on whether a mask resolved, rather than
toggling `value`/`defaultValue` on one element (React warns/misbehaves on a
controlled↔uncontrolled flip on the same node); `mask` comes from
`resolveFieldMask`, which is a pure function of the field's own
`admin.mask` and the project's `fields.inputMasks[fieldType]` default, so it
cannot change across a single field instance's lifetime.

`admin.mask` is typed only on the four maskable field types — `FieldAdminConfig`
(`packages/core/src/fields/baseTypes.ts`) is shared by every field type
(checkbox, select, group, …), so `mask` is NOT added there. Each maskable
type's own `*FieldInput`/`*Field` interface narrows its inherited `admin`
property with an intersection (`FieldAdminConfigInput & { mask?: … }` /
`FieldAdminConfig & { mask?: … }`) — legal because the intersection is a
subtype of the inherited type. `resolveFieldMask` is NOT called inside the
field factories (`text()`, `number()`, …): those run at collection-definition
time, before `fields.inputMasks` (a client-config concern) exists. The
factories just spread `admin.mask` through unchanged — `config.ts` needs no
functional change, only a doc line noting the property has no default
(contract item 8: opt-in only). Resolution happens in each field's react
`Input.tsx`, the only place both `fieldDef.admin.mask` and
`useVexConfig().fields.inputMasks` are in scope.

No other registration point exists for `admin.mask`: it never reaches
schema/type generation (`generateVexSchema`/`generateVexTypes` never read
`admin.*`), there is no sanitization pass over admin config (grepped, none
found), and it is UI-only — the stored value is a plain `string`/`number`,
identical to the unmasked field.

Email reconciled against Step 2's actual output
(`local://g-step-02.md`): `EmailFieldInput`/`EmailField` do **not** redeclare
an own `admin` property — they inherit `FieldAdminConfigInput`/`FieldAdminConfig`
straight from `BaseFieldInput`/`BaseField`, the same as `url` (not `text`,
which does redeclare it). So email's `admin.mask` edit below ADDS a new
`admin` member (url's pattern), not a type-change to an existing line
(text/number's pattern). Email's `min`/`max` are already `FieldLimitInput`/
`FieldLimit` (step 1's shape, not the old `{ value, error }` object) — inert
for this step, noted only so the import list below matches the real file.

Step 2's `email/Input.tsx` renders a native `type="email"` input (`autoComplete="email"`,
format validation deferred to `emailFieldToInputSchema`). A masked email
input switches to `type="text"` — the browser's own `email` parsing and
Inputmask's character-by-character formatting both fight for the same
keystrokes, the identical conflict a controlled `value` has with autoUnmask
(Why section above). `autoComplete="email"` stays on both branches; it is
inert to Inputmask.

#### pnpm-workspace.yaml

**1 — new catalog entry, alphabetically after `typescript-eslint`.**

```yaml
  typescript-eslint: 8.63.0
  use-mask-input: 3.14.2
  validate-npm-package-name: 5.0.0
```

#### packages/react/package.json

**1 — new `dependencies` entry, alphabetically after `tailwind-merge`.**

```json
    "tailwind-merge": "catalog:",
    "use-mask-input": "catalog:",
    "zod": "catalog:"
```

#### packages/core/src/fields/mask/types.ts

```ts
import { ADMIN_FIELDS } from "../constants";

/**
 * Field types `admin.mask` is available on — the four single-line string/
 * number inputs an input-mask library can usefully format.
 */
export const MASKABLE_FIELD_TYPES = [
  ADMIN_FIELDS.text.type,
  ADMIN_FIELDS.email.type,
  ADMIN_FIELDS.number.type,
  ADMIN_FIELDS.url.type,
] as const;

/** Union of the field type strings `admin.mask` is available on. */
export type MaskableFieldType = (typeof MASKABLE_FIELD_TYPES)[number];

/**
 * User-facing `admin.mask` value — a bare `use-mask-input` mask string, an
 * array of alternative masks (whichever fits what the user types), or an
 * object carrying `storeMasked`/`options` alongside the mask.
 *
 * @example
 * ```ts
 * admin: { mask: "(999) 999-9999" }
 * admin: { mask: ["999-999", "999-999-999"] }
 * admin: { mask: { mask: "decimal", storeMasked: true, options: { radixPoint: "." } } }
 * ```
 */
export type FieldMaskInput =
  | string
  | string[]
  | { mask: string | string[]; storeMasked?: boolean; options?: Record<string, unknown> };

/**
 * Resolved mask configuration after {@link resolveFieldMask} applies
 * defaults — always has every property present.
 */
export interface FieldMask {
  /** The mask pattern(s) passed to `use-mask-input`. */
  mask: string | string[];
  /**
   * Whether the stored value keeps the mask's literal characters.
   * `false` (default) stores the raw unmasked value.
   */
  storeMasked: boolean;
  /** Extra `use-mask-input`/Inputmask options, passed through unchanged. */
  options: Record<string, unknown>;
}
```

#### packages/core/src/fields/mask/utils.ts

```ts
import type { FieldMask, FieldMaskInput, MaskableFieldType } from "./types";

/**
 * Normalizes any {@link FieldMaskInput} shape into a fully-populated
 * {@link FieldMask}.
 *
 * @param input - A bare mask string/array, or the object form.
 * @returns The resolved mask with `storeMasked`/`options` defaults applied.
 */
function normalizeFieldMaskInput(input: FieldMaskInput): FieldMask {
  if (typeof input === "string" || Array.isArray(input)) {
    return { mask: input, storeMasked: false, options: {} };
  }
  return {
    mask: input.mask,
    storeMasked: input.storeMasked ?? false,
    options: input.options ?? {},
  };
}

/**
 * Resolves a field's effective mask from its own `admin.mask` and the
 * project's `fields.inputMasks[fieldType]` default.
 *
 * `fieldMask: false` always disables masking, even when the project
 * configured a default for this field type. `fieldMask: undefined` falls
 * back to the project default, if any. Any other `fieldMask` overrides the
 * project default entirely (contract item 8 — opt-in only, no merging of
 * the two).
 *
 * @param props - Input props.
 * @param props.fieldType - The field's own type, used to look up the project default.
 * @param props.fieldMask - The field's own `admin.mask` value.
 * @param props.inputMasks - The project's `fields.inputMasks` defaults, keyed by field type.
 * @returns The resolved mask, or `undefined` when no mask applies.
 *
 * @example
 * ```ts
 * resolveFieldMask({ fieldType: "number", fieldMask: undefined, inputMasks: { number: "decimal" } })
 * // → { mask: "decimal", storeMasked: false, options: {} }
 *
 * resolveFieldMask({ fieldType: "number", fieldMask: false, inputMasks: { number: "decimal" } })
 * // → undefined
 * ```
 */
export function resolveFieldMask(props: {
  fieldType: MaskableFieldType;
  fieldMask: FieldMaskInput | false | undefined;
  inputMasks: Partial<Record<MaskableFieldType, FieldMaskInput>>;
}): FieldMask | undefined {
  const { fieldType, fieldMask, inputMasks } = props;
  if (fieldMask === false) return undefined;
  if (fieldMask !== undefined) return normalizeFieldMaskInput(fieldMask);
  const projectDefault = inputMasks[fieldType];
  return projectDefault === undefined ? undefined : normalizeFieldMaskInput(projectDefault);
}
```

#### packages/core/src/fields/mask/utils.test.ts

```ts
import { describe, expect, it } from "vitest";
import { resolveFieldMask } from "./utils";

describe("resolveFieldMask", () => {
  it("returns undefined when neither the field nor the project configures a mask", () => {
    expect(resolveFieldMask({ fieldType: "text", fieldMask: undefined, inputMasks: {} })).toBeUndefined();
  });

  it("normalizes a bare string mask", () => {
    expect(
      resolveFieldMask({ fieldType: "text", fieldMask: "(999) 999-9999", inputMasks: {} }),
    ).toEqual({ mask: "(999) 999-9999", storeMasked: false, options: {} });
  });

  it("normalizes an array mask", () => {
    expect(
      resolveFieldMask({
        fieldType: "text",
        fieldMask: ["999-999", "999-999-999"],
        inputMasks: {},
      }),
    ).toEqual({ mask: ["999-999", "999-999-999"], storeMasked: false, options: {} });
  });

  it("normalizes the object form with storeMasked and options", () => {
    expect(
      resolveFieldMask({
        fieldType: "number",
        fieldMask: { mask: "decimal", storeMasked: true, options: { radixPoint: "." } },
        inputMasks: {},
      }),
    ).toEqual({
      mask: "decimal",
      storeMasked: true,
      options: { radixPoint: "." },
    });
  });

  it("falls back to the project default when the field sets no mask", () => {
    expect(
      resolveFieldMask({
        fieldType: "number",
        fieldMask: undefined,
        inputMasks: { number: "decimal" },
      }),
    ).toEqual({ mask: "decimal", storeMasked: false, options: {} });
  });

  it("the field's own mask overrides the project default", () => {
    expect(
      resolveFieldMask({
        fieldType: "number",
        fieldMask: "integer",
        inputMasks: { number: "decimal" },
      }),
    ).toEqual({ mask: "integer", storeMasked: false, options: {} });
  });

  it("admin.mask: false disables masking even with a project default", () => {
    expect(
      resolveFieldMask({
        fieldType: "number",
        fieldMask: false,
        inputMasks: { number: "decimal" },
      }),
    ).toBeUndefined();
  });
});
```

#### packages/core/src/fields/mask/index.ts

```ts
export * from "./types";
export * from "./utils";
```

#### packages/core/src/fields/index.ts

**1 — new export, grouped with the other shared-utility barrels at the top (after `./utils`, before the per-type barrels).**

```ts
export * from "./constants";
export * from "./baseTypes";
export * from "./types";
export * from "./validators";
export * from "./inputSchemas";
export * from "./interfaceGen";
export * from "./utils";
export * from "./mask";

export * from "./text";
```

#### packages/core/src/fields/text/types.ts

**1 — `TextFieldInput`: add an own `admin` override, inserted as the first member right after the interface opens.**

```ts
export interface TextFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TCollectionSlug, TFieldMeta> {
  /**
   * Admin UI configuration, narrowed to add `mask` — an opt-in `use-mask-input`
   * pattern (string, array of alternatives, or `{ mask, storeMasked, options }`).
   * `mask: false` disables the project-wide `fields.inputMasks.text` default
   * for this field. @see {@link FieldMaskInput}
   */
  admin?: FieldAdminConfigInput & { mask?: FieldMaskInput | false };
  /**
   * Pre-filled value shown in the admin form when creating a new field.
   * Does not apply to database values
   *
   */
  defaultValue?: string;
```

**2 — `TextField`: change the existing `admin: FieldAdminConfig;` property's type (same line, no reordering).**

```ts
  /** Resolved admin UI configuration with all defaults applied, narrowed to add `mask`. */
  admin: FieldAdminConfig & { mask?: FieldMaskInput | false };
```

**3 — new import at the top of the file, alongside the existing `baseTypes` import.**

```ts
import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput, FieldAdminConfig, FieldAdminConfigInput, FieldValidateProps } from "../baseTypes";
import type { FieldMaskInput } from "../mask";
import { VexResourceSlug } from "../../types";
```

#### packages/core/src/fields/text/config.ts

**1 — one new bullet in the `text()` docblock's "Defaults applied" list, after `admin.cellAlignment`.**

```ts
 * - `admin.cellAlignment` — `"left"`
 * - `admin.mask` — not set (opt-in; no project-wide default applies unless configured)
```

#### packages/core/src/fields/number/types.ts

**1 — `NumberFieldInput`: add an own `admin` override, first member after the interface opens.**

```ts
export interface NumberFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TCollectionSlug, TFieldMeta> {
  /**
   * Admin UI configuration, narrowed to add `mask` — see
   * {@link TextFieldInput.admin} for the full contract. A masked number
   * field renders `type="text"` and still stores a `number`.
   */
  admin?: FieldAdminConfigInput & { mask?: FieldMaskInput | false };
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * Does not affect database values — only the form's initial state.
   */
  defaultValue?: number;
```

**2 — `NumberField`: change the existing `admin: FieldAdminConfig;` property's type.**

```ts
  /** Resolved admin UI configuration with all defaults applied, narrowed to add `mask`. */
  admin: FieldAdminConfig & { mask?: FieldMaskInput | false };
```

**3 — new import at the top of the file.**

```ts
import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput, FieldAdminConfig, FieldAdminConfigInput, FieldValidateProps } from "../baseTypes";
import type { FieldMaskInput } from "../mask";
import type { VexResourceSlug } from "../../types/generated";
```

#### packages/core/src/fields/number/config.ts

**1 — one new bullet in the `number()` docblock's "Defaults applied" list.**

```ts
 * - `admin.cellAlignment` — `"left"`
 * - `admin.mask` — not set (opt-in; no project-wide default applies unless configured)
```

#### packages/core/src/fields/url/types.ts

**1 — `UrlFieldInput`: add an own `admin` override (neither `UrlFieldInput` nor `UrlField` redeclares `admin` today — both pick it up new).**

```ts
export interface UrlFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TCollectionSlug, TFieldMeta> {
  /**
   * Admin UI configuration, narrowed to add `mask` — see
   * {@link TextFieldInput.admin} for the full contract.
   */
  admin?: FieldAdminConfigInput & { mask?: FieldMaskInput | false };
  /**
   * Pre-filled value shown in the admin form when creating a new field.
   * Does not affect database values.
   */
  defaultValue?: string;
```

**2 — `UrlField`: add an own `admin` override.**

```ts
export interface UrlField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.url.type;
  /** Resolved admin UI configuration with all defaults applied, narrowed to add `mask`. */
  admin: FieldAdminConfig & { mask?: FieldMaskInput | false };
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * `undefined` means no default is applied — the input starts empty.
   */
  defaultValue?: string;
```

**3 — new import at the top of the file.**

```ts
import { ADMIN_FIELDS } from "../constants";
import {
  BaseField,
  BaseFieldInput,
  FieldAdminConfig,
  FieldAdminConfigInput,
  FieldLimit,
  FieldLimitInput,
  FieldValidateProps,
} from "../baseTypes";
import type { FieldMaskInput } from "../mask";
import type { VexResourceSlug } from "../../types/generated";
```

(Step 1 added `FieldLimit, FieldLimitInput` to this file's import and `min`/`max`
properties to both interfaces — this full-import replacement must keep them
alongside the `FieldAdminConfig`/`FieldAdminConfigInput`/`FieldMaskInput`
additions above, or the `min`/`max` properties stop compiling.)

#### packages/core/src/fields/url/config.ts

**1 — one new bullet in the `url()` docblock's "Defaults applied" list.**

```ts
 * - `admin.cellAlignment` — `"left"`
 * - `admin.mask` — not set (opt-in; no project-wide default applies unless configured)
```

#### packages/core/src/fields/email/types.ts

**1 — `EmailFieldInput`: add an own `admin` override, first member after the interface opens (neither `EmailFieldInput` nor `EmailField` redeclares `admin` today — same pattern as `url/types.ts`'s edit 1, not `text`'s).**

```ts
export interface EmailFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TCollectionSlug, TFieldMeta> {
  /**
   * Admin UI configuration, narrowed to add `mask` — see
   * {@link TextFieldInput.admin} for the full contract. A masked email
   * field renders `type="text"` instead of `type="email"`.
   */
  admin?: FieldAdminConfigInput & { mask?: FieldMaskInput | false };
  /**
   * Pre-filled value shown in the admin form when creating a new field.
   * Does not apply to database values.
   */
  defaultValue?: string;
```

**2 — `EmailField`: add an own `admin` override, inserted right after the `readonly type` discriminant.**

```ts
export interface EmailField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.email.type;
  /** Resolved admin UI configuration with all defaults applied, narrowed to add `mask`. */
  admin: FieldAdminConfig & { mask?: FieldMaskInput | false };
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * `undefined` means no default is applied — the input starts empty.
   */
  defaultValue?: string;
```

**3 — new imports: `FieldAdminConfigInput`/`FieldAdminConfig` added to the existing `baseTypes` import, plus a new `mask` import.**

```ts
import { ADMIN_FIELDS } from "../constants";
import {
  BaseField,
  BaseFieldInput,
  FieldAdminConfig,
  FieldAdminConfigInput,
  FieldLimit,
  FieldLimitInput,
  FieldValidateProps,
} from "../baseTypes";
import type { FieldMaskInput } from "../mask";
import { VexResourceSlug } from "../../types";
```

#### packages/core/src/fields/email/config.ts

**1 — one new bullet in the `email()` docblock's "Defaults applied" list, after `admin.cellAlignment`.**

```ts
 * - `admin.cellAlignment` — `"left"`
 * - `admin.mask` — not set (opt-in; no project-wide default applies unless configured)
```

#### packages/core/src/config/types.ts

**1 — new `VexFieldsConfigInput`/`VexFieldsConfig` interfaces, inserted after `ClientUploadMap` (before `VexClientConfigInput`).**

```ts
/**
 * Project-wide `admin.mask` defaults, keyed by maskable field type.
 *
 * A field's own `admin.mask` overrides its entry here entirely; `admin.mask:
 * false` disables the default for that one field (contract item 8).
 *
 * @see {@link VexFieldsConfig} for the resolved type after defaults are applied
 */
export interface VexFieldsConfigInput {
  /**
   * Default `admin.mask` per maskable field type (`text`, `email`, `number`, `url`).
   *
   * Default: `{}` (no project-wide masks).
   */
  inputMasks?: Partial<Record<MaskableFieldType, FieldMaskInput>>;
}

/**
 * Resolved field-wide configuration after `defineConfig()` applies defaults.
 *
 * @see {@link VexFieldsConfigInput} for the user-facing input type
 */
export interface VexFieldsConfig {
  /** Resolved project-wide `admin.mask` defaults. Always present; defaults to `{}`. */
  inputMasks: Partial<Record<MaskableFieldType, FieldMaskInput>>;
}
```

**2 — `VexClientConfigInput`: new `fields?` property, inserted after `editor?: VexEditorAdapter<ComponentHKT>;` (the interface's last member).**

```ts
  editor?: VexEditorAdapter<ComponentHKT>;
  /**
   * Project-wide field behavior defaults.
   *
   * **Defaults applied by `defineConfig()`:**
   * ```ts
   * { inputMasks: {} }
   * ```
   *
   * @see {@link VexFieldsConfigInput} for all available options
   */
  fields?: VexFieldsConfigInput;
}
```

**3 — `VexClientConfig`: new `fields` property, inserted after `editor?: VexEditorAdapter<ComponentHKT>;` (the interface's last member).**

```ts
  editor?: VexEditorAdapter<ComponentHKT>;
  /** Resolved project-wide field behavior defaults — always fully populated. */
  fields: VexFieldsConfig;
}
```

**4 — new import, added to the existing named import from `"../fields"`-equivalent — this file currently has no such import; add a standalone one near the top, after the `VexEditorAdapter` import.**

```ts
import { VexEditorAdapter } from "../editor";
import type { FieldMaskInput, MaskableFieldType } from "../fields/mask";
```

#### packages/core/src/config/config.ts

**1 — `defineConfig`'s return object: add `fields`, anchored after the existing `routes: config?.routes,` line (the last property).**

```ts
    routes: config?.routes,
    fields: {
      inputMasks: config?.fields?.inputMasks ?? {},
    },
  };
}
```

#### packages/core/src/config/config.test.ts

**1 — new `describe` block, inserted after the `"defineConfig — editor"` block (before `// ── Purity ──`).**

```ts
describe("defineConfig — fields.inputMasks", () => {
  it("defaults to an empty map when fields is omitted", () => {
    const config = defineConfig();
    expect(config.fields.inputMasks).toEqual({});
  });

  it("passes through configured project-wide masks unchanged", () => {
    const config = defineConfig({
      fields: { inputMasks: { number: "decimal", text: "(999) 999-9999" } },
    });
    expect(config.fields.inputMasks).toEqual({ number: "decimal", text: "(999) 999-9999" });
  });
});
```

#### packages/react/src/hooks/useFieldMask.ts

```ts
"use client";

import { useCallback, useRef } from "react";
import type { RefCallback } from "react";
import type { FieldMask } from "@vexcms/core";

/**
 * Attaches `use-mask-input` to a text input only when a mask resolved,
 * lazy-loading the library (`import("use-mask-input")`, ~29 KB gz) the first
 * time a masked input actually mounts — an unmasked form never pays for it.
 * The import runs inside the returned ref callback, which only ever fires in
 * the browser, so this is inherently SSR-safe with no environment check.
 *
 * Passes `{ ...mask.options, autoUnmask: !mask.storeMasked }` to
 * `withMask` — `autoUnmask` makes the DOM element's own `value` (and every
 * `input`/`change` event's `target.value`) report the raw unmasked string
 * while the screen keeps showing the formatted one, unless `storeMasked` is
 * set, in which case the formatted value is both shown and stored.
 *
 * @param props - Input props.
 * @param props.mask - The field's resolved mask, or `undefined` for no mask.
 * @returns A ref callback to attach to the `<input>` element, or `undefined`
 *   when `mask` is `undefined` — pass straight through to the `ref` prop.
 */
export function useFieldMask(props: {
  mask: FieldMask | undefined;
}): RefCallback<HTMLInputElement> | undefined {
  const { mask } = props;
  const teardownRef = useRef<(() => void) | undefined>(undefined);

  const maskRef = useCallback<RefCallback<HTMLInputElement>>(
    (node) => {
      teardownRef.current?.();
      teardownRef.current = undefined;
      if (!node || !mask) return;

      let cancelled = false;
      teardownRef.current = () => {
        cancelled = true;
      };

      import("use-mask-input").then(({ withMask }) => {
        if (cancelled) return;
        const applyMask = withMask(mask.mask, { ...mask.options, autoUnmask: !mask.storeMasked });
        applyMask(node);
        teardownRef.current = () => applyMask(null);
      });
    },
    [mask],
  );

  return mask ? maskRef : undefined;
}
```

#### packages/react/src/hooks/useFieldMask.test.ts

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { createElement } from "react";
import type { FieldMask } from "@vexcms/core";
import { useFieldMask } from "./useFieldMask";

const { withMaskMock, applyMaskMock } = vi.hoisted(() => {
  const applyMaskMock = vi.fn();
  return { withMaskMock: vi.fn(() => applyMaskMock), applyMaskMock };
});

vi.mock("use-mask-input", () => ({ withMask: withMaskMock }));

/** Mounts a single masked/unmasked `<input>` driven by `useFieldMask`. */
function MaskedInput(props: { mask: FieldMask | undefined }) {
  const ref = useFieldMask({ mask: props.mask });
  return createElement("input", { "data-testid": "field", ref });
}

describe("useFieldMask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns undefined and never imports use-mask-input when mask is undefined", () => {
    render(createElement(MaskedInput, { mask: undefined }));
    expect(withMaskMock).not.toHaveBeenCalled();
  });

  it("lazily applies the mask to the mounted node", async () => {
    const mask: FieldMask = { mask: "(999) 999-9999", storeMasked: false, options: {} };
    const { getByTestId } = render(createElement(MaskedInput, { mask }));
    await waitFor(() => expect(withMaskMock).toHaveBeenCalledWith("(999) 999-9999", { autoUnmask: true }));
    expect(applyMaskMock).toHaveBeenCalledWith(getByTestId("field"));
  });

  it("passes autoUnmask: false and forwards options when storeMasked is true", async () => {
    const mask: FieldMask = {
      mask: "decimal",
      storeMasked: true,
      options: { radixPoint: "," },
    };
    render(createElement(MaskedInput, { mask }));
    await waitFor(() =>
      expect(withMaskMock).toHaveBeenCalledWith("decimal", { radixPoint: ",", autoUnmask: false }),
    );
  });

  it("tears down the previous mask instance on unmount", async () => {
    const mask: FieldMask = { mask: "decimal", storeMasked: false, options: {} };
    const { unmount } = render(createElement(MaskedInput, { mask }));
    await waitFor(() => expect(applyMaskMock).toHaveBeenCalledTimes(1));
    unmount();
    expect(applyMaskMock).toHaveBeenCalledWith(null);
  });
});
```

#### packages/react/src/hooks/index.ts

**1 — new export, grouped beside `useFieldPermissions`.**

```ts
export * from "./use-mobile";
export * from "./useAutosave";
export * from "./useFieldsForm";
export * from "./usePermission";
export * from "./useFieldPermissions";
export * from "./useFieldMask";
export * from "./useVisibleFields";
```

#### packages/react/src/components/fields/text/Input.tsx

**1 — new imports, after the existing `FormError` import.**

```ts
import { useContext } from "react";
import { resolveFieldMask, type TextField } from "@vexcms/core";
import { Input } from "../../ui/input";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError } from "../../form/FormError";
import { useFieldMask } from "../../../hooks/useFieldMask";
import { VexConfigContext } from "../../../context/VexConfigContext";
```

**2 — the render function: resolve the mask and branch between a masked (uncontrolled) and unmasked (controlled) `<Input>`.**

```ts
export const TextFieldInput = createFieldInput<string, {}, TextField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    const config = useContext(VexConfigContext);
    const mask = resolveFieldMask({
      fieldType: fieldDef.type,
      fieldMask: fieldDef.admin.mask,
      inputMasks: config?.fields.inputMasks ?? {},
    });
    const maskRef = useFieldMask({ mask });
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel index={index} field={fieldDef} name={name} />
        {mask ? (
          <Input
            id={name}
            ref={maskRef}
            disabled={readOnly}
            type="text"
            defaultValue={field.state.value ?? ""}
            onInput={(e) => field.handleChange(e.currentTarget.value)}
            onBlur={field.handleBlur}
            placeholder={fieldDef.admin.placeholder}
            readOnly={fieldDef.admin.readOnly}
            aria-required={fieldDef.required}
          />
        ) : (
          <Input
            id={name}
            disabled={readOnly}
            type="text"
            value={field.state.value ?? ""}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            placeholder={fieldDef.admin.placeholder}
            readOnly={fieldDef.admin.readOnly}
            aria-required={fieldDef.required}
          />
        )}
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
```

#### packages/react/src/components/fields/text/Input.test.tsx

**1 — new imports and mock, after the existing imports.**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import {
  adminFieldToInputSchema,
  defineConfig,
  text,
  type CollectionConfig,
  type TextField,
} from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { VexConfigContext } from "../../../context/VexConfigContext";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { textFieldFixture } from "./testFixture";
import { TextFieldInput } from "./Input";

const { withMaskMock } = vi.hoisted(() => {
  const applyMaskMock = vi.fn();
  return { withMaskMock: vi.fn(() => applyMaskMock) };
});

vi.mock("use-mask-input", () => ({ withMask: withMaskMock }));
```

**2 — new `describe` block, appended after the `runFieldInputContractSuite({ … })` call.**

```ts
describe("text: admin.mask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function TextMaskHarness(props: { fieldDef: TextField }) {
    const form = useForm({ defaultValues: { testField: "" } });
    return (
      <AppForm form={form}>
        <TextFieldInput name="testField" fieldDef={props.fieldDef} readOnly={false} collection={testCollection} />
      </AppForm>
    );
  }

  function renderMasked(fieldDef: TextField) {
    return render(
      <VexConfigContext.Provider value={defineConfig()}>
        <TextMaskHarness fieldDef={fieldDef} />
      </VexConfigContext.Provider>,
    );
  }

  it("lazily applies the mask when admin.mask is set", async () => {
    const fieldDef = text({ label: "Phone", admin: { mask: "(999) 999-9999" } });
    renderMasked(fieldDef);
    await waitFor(() =>
      expect(withMaskMock).toHaveBeenCalledWith("(999) 999-9999", { autoUnmask: true }),
    );
  });

  it("renders the ordinary controlled input when no mask resolves", () => {
    const fieldDef = text({ label: "Title" });
    renderMasked(fieldDef);
    expect(withMaskMock).not.toHaveBeenCalled();
  });
});
```

#### packages/react/src/components/fields/number/Input.tsx

**1 — new imports, after the existing `FormError` import.**

```ts
import { useContext } from "react";
import { resolveFieldMask, type NumberField } from "@vexcms/core";
import { Input } from "../../ui/input";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError } from "../../form/FormError";
import { useFieldMask } from "../../../hooks/useFieldMask";
import { VexConfigContext } from "../../../context/VexConfigContext";
```

**2 — the render function: masked branch renders `type="text"`, parses on input, empty string → `undefined`.**

```ts
export const NumberFieldInput = createFieldInput<number, {}, NumberField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    const config = useContext(VexConfigContext);
    const mask = resolveFieldMask({
      fieldType: fieldDef.type,
      fieldMask: fieldDef.admin.mask,
      inputMasks: config?.fields.inputMasks ?? {},
    });
    const maskRef = useFieldMask({ mask });
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel field={fieldDef} index={index} name={name} />
        {mask ? (
          <Input
            id={name}
            ref={maskRef}
            disabled={readOnly || fieldDef.admin.readOnly}
            type="text"
            defaultValue={field.state.value !== undefined ? String(field.state.value) : ""}
            onInput={(e) => {
              const raw = e.currentTarget.value;
              field.handleChange(raw === "" ? (undefined as unknown as number) : Number(raw));
            }}
            onBlur={field.handleBlur}
            placeholder={fieldDef.admin.placeholder}
            readOnly={fieldDef.admin.readOnly}
            aria-required={fieldDef.required}
          />
        ) : (
          <Input
            id={name}
            disabled={readOnly || fieldDef.admin.readOnly}
            type="number"
            value={field.state.value ?? 0}
            onChange={(e) =>
              field.handleChange(
                e.target.value === "" ? (undefined as unknown as number) : Number(e.target.value),
              )
            }
            onBlur={field.handleBlur}
            placeholder={fieldDef.admin.placeholder}
            readOnly={fieldDef.admin.readOnly}
            aria-required={fieldDef.required}
          />
        )}
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
```

#### packages/react/src/components/fields/number/Input.test.tsx

**1 — new imports and mock, after the existing imports (mirrors text's edit 1, `defineConfig`/`VexConfigContext` added).**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import {
  defineConfig,
  number,
  numberFieldToInputSchema,
  type CollectionConfig,
  type NumberField,
} from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { VexConfigContext } from "../../../context/VexConfigContext";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { numberFieldFixture } from "./testFixture";
import { NumberFieldInput } from "./Input";

const { withMaskMock } = vi.hoisted(() => {
  const applyMaskMock = vi.fn();
  return { withMaskMock: vi.fn(() => applyMaskMock) };
});

vi.mock("use-mask-input", () => ({ withMask: withMaskMock }));
```

**2 — new `describe` block, appended after the `runFieldInputContractSuite({ … })` call.**

```ts
describe("number: admin.mask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function NumberMaskHarness(props: { fieldDef: NumberField }) {
    const form = useForm({ defaultValues: { testField: undefined as number | undefined } });
    return (
      <AppForm form={form}>
        <NumberFieldInput
          name="testField"
          fieldDef={props.fieldDef}
          readOnly={false}
          collection={testCollection}
        />
      </AppForm>
    );
  }

  function renderMasked(fieldDef: NumberField) {
    return render(
      <VexConfigContext.Provider value={defineConfig()}>
        <NumberMaskHarness fieldDef={fieldDef} />
      </VexConfigContext.Provider>,
    );
  }

  it("renders type=text and lazily applies the mask when admin.mask is set", async () => {
    const fieldDef = number({ label: "Amount", admin: { mask: "decimal" } });
    const { container } = renderMasked(fieldDef);
    await waitFor(() => expect(withMaskMock).toHaveBeenCalledWith("decimal", { autoUnmask: true }));
    expect(container.querySelector("input")?.getAttribute("type")).toBe("text");
  });

  it("converts an empty masked input to undefined, not NaN", async () => {
    const fieldDef = number({ label: "Amount", admin: { mask: "decimal" } });
    const { container } = renderMasked(fieldDef);
    await waitFor(() => expect(withMaskMock).toHaveBeenCalled());
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.input(input, { target: { value: "" } });
    expect(input.value).toBe("");
  });

  it("renders the ordinary controlled type=number input when no mask resolves", () => {
    const fieldDef = number({ label: "Amount" });
    const { container } = renderMasked(fieldDef);
    expect(withMaskMock).not.toHaveBeenCalled();
    expect(container.querySelector("input")?.getAttribute("type")).toBe("number");
  });
});
```

#### packages/react/src/components/fields/url/Input.tsx

**1 — new imports, after the existing `FormError` import.**

```ts
import { useContext } from "react";
import { resolveFieldMask, type UrlField } from "@vexcms/core";
import { Input } from "../../ui/input";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError } from "../../form/FormError";
import { useFieldMask } from "../../../hooks/useFieldMask";
import { VexConfigContext } from "../../../context/VexConfigContext";
```

**2 — the render function, same masked/unmasked branch shape as `text/Input.tsx`.**

```ts
export const UrlFieldInput = createFieldInput<string, {}, UrlField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    const config = useContext(VexConfigContext);
    const mask = resolveFieldMask({
      fieldType: fieldDef.type,
      fieldMask: fieldDef.admin.mask,
      inputMasks: config?.fields.inputMasks ?? {},
    });
    const maskRef = useFieldMask({ mask });
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel field={fieldDef} index={index} name={name} />
        {mask ? (
          <Input
            id={name}
            ref={maskRef}
            type="text"
            disabled={readOnly}
            defaultValue={field.state.value ?? ""}
            onInput={(e) => field.handleChange(e.currentTarget.value)}
            onBlur={field.handleBlur}
            placeholder={fieldDef.admin.placeholder}
            readOnly={fieldDef.admin.readOnly}
            aria-required={fieldDef.required}
          />
        ) : (
          <Input
            id={name}
            type="text"
            disabled={readOnly}
            value={field.state.value ?? ""}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            placeholder={fieldDef.admin.placeholder}
            readOnly={fieldDef.admin.readOnly}
            aria-required={fieldDef.required}
          />
        )}
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
```

#### packages/react/src/components/fields/url/Input.test.tsx

**1 — new imports and mock, after the existing imports.**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import {
  defineConfig,
  url,
  urlFieldToInputSchema,
  type CollectionConfig,
  type UrlField,
} from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { VexConfigContext } from "../../../context/VexConfigContext";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { urlFieldFixture } from "./testFixture";
import { UrlFieldInput } from "./Input";

const { withMaskMock } = vi.hoisted(() => {
  const applyMaskMock = vi.fn();
  return { withMaskMock: vi.fn(() => applyMaskMock) };
});

vi.mock("use-mask-input", () => ({ withMask: withMaskMock }));
```

**2 — new `describe` block, appended after the `runFieldInputContractSuite({ … })` call.**

```ts
describe("url: admin.mask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function UrlMaskHarness(props: { fieldDef: UrlField }) {
    const form = useForm({ defaultValues: { testField: "" } });
    return (
      <AppForm form={form}>
        <UrlFieldInput name="testField" fieldDef={props.fieldDef} readOnly={false} collection={testCollection} />
      </AppForm>
    );
  }

  it("lazily applies the mask when admin.mask is set", async () => {
    const fieldDef = url({ label: "Profile", admin: { mask: "url" } });
    render(
      <VexConfigContext.Provider value={defineConfig()}>
        <UrlMaskHarness fieldDef={fieldDef} />
      </VexConfigContext.Provider>,
    );
    await waitFor(() => expect(withMaskMock).toHaveBeenCalledWith("url", { autoUnmask: true }));
  });

  it("falls back to the project-wide default from fields.inputMasks.url", async () => {
    const fieldDef = url({ label: "Profile" });
    render(
      <VexConfigContext.Provider value={defineConfig({ fields: { inputMasks: { url: "url" } } })}>
        <UrlMaskHarness fieldDef={fieldDef} />
      </VexConfigContext.Provider>,
    );
    await waitFor(() => expect(withMaskMock).toHaveBeenCalledWith("url", { autoUnmask: true }));
  });

  it("renders the ordinary controlled input when no mask resolves", () => {
    const fieldDef = url({ label: "Website" });
    render(
      <VexConfigContext.Provider value={defineConfig()}>
        <UrlMaskHarness fieldDef={fieldDef} />
      </VexConfigContext.Provider>,
    );
    expect(withMaskMock).not.toHaveBeenCalled();
  });
});
```

#### packages/react/src/components/fields/email/Input.tsx

**1 — new imports, after the existing `FormError` import.**

```ts
import { useContext } from "react";
import { resolveFieldMask, type EmailField } from "@vexcms/core";
import { Input } from "../../ui/input";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError } from "../../form/FormError";
import { useFieldMask } from "../../../hooks/useFieldMask";
import { VexConfigContext } from "../../../context/VexConfigContext";
```

**2 — the render function: resolve the mask and branch between a masked (uncontrolled, `type="text"`) and unmasked (controlled, `type="email"`) `<Input>`.**

```tsx
export const EmailFieldInput = createFieldInput<string, {}, EmailField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    const config = useContext(VexConfigContext);
    const mask = resolveFieldMask({
      fieldType: fieldDef.type,
      fieldMask: fieldDef.admin.mask,
      inputMasks: config?.fields.inputMasks ?? {},
    });
    const maskRef = useFieldMask({ mask });
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel index={index} field={fieldDef} name={name} />
        {mask ? (
          <Input
            id={name}
            ref={maskRef}
            disabled={readOnly}
            type="text"
            autoComplete="email"
            defaultValue={field.state.value ?? ""}
            onInput={(e) => field.handleChange(e.currentTarget.value)}
            onBlur={field.handleBlur}
            placeholder={fieldDef.admin.placeholder}
            readOnly={fieldDef.admin.readOnly}
            aria-required={fieldDef.required}
          />
        ) : (
          <Input
            id={name}
            disabled={readOnly}
            type="email"
            autoComplete="email"
            value={field.state.value ?? ""}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            placeholder={fieldDef.admin.placeholder}
            readOnly={fieldDef.admin.readOnly}
            aria-required={fieldDef.required}
          />
        )}
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
```

#### packages/react/src/components/fields/email/Input.test.tsx

**1 — new imports and mock, after the existing imports (mirrors `url/Input.test.tsx`'s edit 1).**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import {
  adminFieldToInputSchema,
  defineConfig,
  email,
  type CollectionConfig,
  type EmailField,
} from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { VexConfigContext } from "../../../context/VexConfigContext";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { emailFieldFixture } from "./testFixture";
import { EmailFieldInput } from "./Input";

const { withMaskMock } = vi.hoisted(() => {
  const applyMaskMock = vi.fn();
  return { withMaskMock: vi.fn(() => applyMaskMock) };
});

vi.mock("use-mask-input", () => ({ withMask: withMaskMock }));
```

**2 — new `describe` block, appended after the `runFieldInputContractSuite({ … })` call.**

```ts
describe("email: admin.mask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function EmailMaskHarness(props: { fieldDef: EmailField }) {
    const form = useForm({ defaultValues: { testField: "" } });
    return (
      <AppForm form={form}>
        <EmailFieldInput name="testField" fieldDef={props.fieldDef} readOnly={false} collection={testCollection} />
      </AppForm>
    );
  }

  it("renders type=text instead of type=email and lazily applies the mask when admin.mask is set", async () => {
    const fieldDef = email({ label: "Contact Email", admin: { mask: "email" } });
    const { container } = render(
      <VexConfigContext.Provider value={defineConfig()}>
        <EmailMaskHarness fieldDef={fieldDef} />
      </VexConfigContext.Provider>,
    );
    await waitFor(() => expect(withMaskMock).toHaveBeenCalledWith("email", { autoUnmask: true }));
    expect(container.querySelector("input")?.getAttribute("type")).toBe("text");
  });

  it("renders the ordinary controlled type=email input when no mask resolves", () => {
    const fieldDef = email({ label: "Contact Email" });
    const { container } = render(
      <VexConfigContext.Provider value={defineConfig()}>
        <EmailMaskHarness fieldDef={fieldDef} />
      </VexConfigContext.Provider>,
    );
    expect(withMaskMock).not.toHaveBeenCalled();
    expect(container.querySelector("input")?.getAttribute("type")).toBe("email");
  });
});
```


Verify: pnpm typecheck && pnpm --filter @vexcms/core test -- mask config && pnpm --filter @vexcms/react test -- useFieldMask fields/text fields/number fields/url fields/email

### Step 9 — React layout renderer: `RenderFields`, tabs, collapsible, row, width, sidebar, hidden [agent]

- [ ] `packages/react/src/components/form/constants.ts` — `FORM_URL_PARAMS`
- [ ] `packages/react/src/components/form/RenderFields.tsx` + test — renders `FieldLayoutNode[]`; flex-wrap widths; region filter
- [ ] `packages/react/src/components/form/FormTabs.tsx`, `FormCollapsible.tsx`, `FormRow.tsx` + tests — error-count badges; top-level tab in `?tab=`
- [ ] `packages/react/src/hooks/useFieldErrorCount.ts` + test; `packages/react/src/hooks/index.ts` — re-export
- [ ] `packages/react/src/components/form/DocumentTimestamps.tsx` + test — read-only Created at (`_creationTime`)
- [ ] `packages/react/src/components/form/applyFieldPermissionReadOnly.ts` + test — per-field write-permission → `admin.readOnly` merge (see Design note)
- [ ] `packages/react/src/components/fields/index.tsx` — `RenderFieldInputComponents` removed; `getCollectionColumnDefs` skips `admin.hidden`
- [ ] `packages/react/src/components/fields/index.test.tsx` — `admin.hidden` column-exclusion test
- [ ] `CollectionEditView`, `GlobalEditView`, `MediaCollectionEditView` — main + sidebar columns via `RenderFields`; `admin.hidden` honored; submit-failure jumps to the first errored tab
- [ ] `FormGroup`, `FormBlocks`, `CreateDocumentModal` — switch to `RenderFields`
- [ ] `packages/react/src/components/fields/select/Input.tsx`, `packages/react/src/hooks/useModalSurface.tsx`, `useModalSurface.test.tsx` — stale `RenderFieldInputComponents` doc references fixed

Why: one renderer replaces the four duplicated field loops; consumes step 6's tree.

**Design note — `documentStatus` and per-field permission `readOnly`.**

Two real behaviors the removed loops had, which the contracted `RenderFields`
signature (`fields`, `collection`, `namePrefix`, `readOnly`, `region`,
`fieldKeys`, `isTopLevel`) has no slot for on its own:

1. **`InputComponentProps.documentStatus`** (`packages/core/src/fields/types.ts`)
   is read by `relationship/Input.tsx` to decide `drafts: documentStatus ===
   VERSION_STATUSES.draft.key` on its search query — every edit view passed it
   to every field today. It is a per-CALL constant (same value for the whole
   form), exactly like `collection`, so it is added as an optional
   `documentStatus?: VexVersionStatus` prop on `RenderFields` (and threaded
   through `RenderFieldsContext`) rather than dropped. This is an addition,
   not a change, to the contract's fixed shape.
2. **Per-field write permission** (`!isFieldAllowed(fieldPermissions,
   fieldKey)` in the old loops) is genuinely per-FIELD, so it cannot ride
   `RenderFields`'s one flat `readOnly` boolean. `applyFieldPermissionReadOnly`
   (new, not in the contract's fixed-names list) bakes it into the `fields`
   map before it reaches `RenderFields` — forcing `admin.readOnly: true` on
   every write-denied field — so the contracted signature stays exactly as
   specified and the behavior is preserved at the call site instead.

#### packages/react/src/components/form/constants.ts

```ts
/**
 * URL search params `RenderFields` and its layout widgets read/write via `nuqs`.
 *
 * `tab` persists the active tab label of the first TOP-LEVEL `tabs()` group on
 * a collection or global's own fields (Interview Decision 6) — every other
 * tabs group, nested or a second top-level one, keeps local component state.
 */
export const FORM_URL_PARAMS = { tab: "tab" } as const;

/** Union of the URL parameter strings `FORM_URL_PARAMS` defines. */
export type FormUrlParam = (typeof FORM_URL_PARAMS)[keyof typeof FORM_URL_PARAMS];
```

#### packages/react/src/components/form/RenderFields.tsx

```tsx
"use client";

import { type CSSProperties, type ReactNode, useMemo } from "react";
import {
  buildFieldLayoutTree,
  type AdminField,
  type CollectionConfig,
  type FieldLayoutNode,
  type GlobalConfig,
  type VexVersionStatus,
} from "@vexcms/core";
import { fieldToInputComponent } from "../fields";
import { FormTabs } from "./FormTabs";
import { FormCollapsible } from "./FormCollapsible";
import { FormRow } from "./FormRow";

/**
 * Shared render context threaded through a `FieldLayoutNode` tree — resolved
 * once by {@link RenderFields} and passed down unchanged to every nested node
 * (`FormTabs`/`FormCollapsible`/`FormRow`), so a container never re-derives
 * `collection`/`namePrefix`/`readOnly` for its own children.
 */
export interface RenderFieldsContext {
  /** Forwarded to every rendered field's `InputComponentProps.collection`. */
  collection: CollectionConfig | GlobalConfig;
  /** Dot-prefix for every rendered field's form name. */
  namePrefix?: string;
  /** OR'd with each field's own `admin.readOnly`. */
  readOnly?: boolean;
  /** Forwarded to every rendered field's `InputComponentProps.documentStatus`. */
  documentStatus?: VexVersionStatus;
  /** The id of the one top-level `"tabs"` node allowed to use `?tab=` (set by `RenderFields`, read by `FormTabs`). */
  urlTabsId?: string;
}

/**
 * Resolves the `name` a `"field"` node renders its input under — dot-joined
 * with `context.namePrefix` for a nested call (a group's own fields, one
 * array/blocks item).
 */
export function fieldLayoutNodeName(context: RenderFieldsContext, key: string): string {
  return context.namePrefix ? `${context.namePrefix}.${key}` : key;
}

/**
 * The width a `FieldLayoutNode` occupies in its parent's flex-wrap row — a
 * container node's own width is always `"100%"`; only a `"field"` node
 * carries a resolved `admin.width` (Interview Decision 4).
 */
export function fieldLayoutNodeWidth(node: FieldLayoutNode): string {
  return node.kind === "field" ? node.field.admin.width : "100%";
}

/**
 * Wraps one `FieldLayoutNode`'s rendered content at its resolved width.
 * Below the `sm` breakpoint every field is full width; at `sm` and up it
 * switches to the CSS custom property set here (Interview Decision 4).
 */
export function FieldLayoutItem(props: { width: string; children: ReactNode }): ReactNode {
  return (
    <div
      className="w-full sm:w-(--field-width)"
      style={{ "--field-width": props.width } as CSSProperties}
    >
      {props.children}
    </div>
  );
}

/**
 * Recursively drops `admin.hidden` `"field"` nodes and, when `fieldKeys` is
 * given, any `"field"` node whose own key is outside that subset — matched at
 * every depth, since layout helpers stamp frames onto flat sibling keys of
 * the SAME field map (Interview Decision 6), so there is only one depth of
 * real field keys in a tree built from one `fields` record. A container left
 * with no visible children (or, for `"tabs"`, a tab left with none) is
 * dropped entirely.
 */
export function filterFieldLayoutNodes(props: {
  nodes: FieldLayoutNode[];
  fieldKeys?: readonly string[];
}): FieldLayoutNode[] {
  const { fieldKeys } = props;
  const result: FieldLayoutNode[] = [];
  for (const node of props.nodes) {
    if (node.kind === "field") {
      if (node.field.admin.hidden) continue;
      if (fieldKeys && !fieldKeys.includes(node.key)) continue;
      result.push(node);
      continue;
    }
    if (node.kind === "tabs") {
      const tabs = node.tabs
        .map((tab) => ({
          ...tab,
          children: filterFieldLayoutNodes({ nodes: tab.children, fieldKeys }),
        }))
        .filter((tab) => tab.children.length > 0);
      if (tabs.length > 0) result.push({ ...node, tabs });
      continue;
    }
    const children = filterFieldLayoutNodes({ nodes: node.children, fieldKeys });
    if (children.length > 0) result.push({ ...node, children });
  }
  return result;
}

/** The `"tabs"` member of `FieldLayoutNode`'s discriminated union. */
export type TabsLayoutNode = Extract<FieldLayoutNode, { kind: "tabs" }>;

/**
 * Finds the first `"tabs"` node reachable without crossing into a nested
 * container's own children — the one TOP-LEVEL tabs group that persists its
 * active tab in `?tab=` (Interview Decision 6). `"row"` is a pure width
 * grouping of top-level fields, not real nesting, so the search continues
 * through its children; `"collapsible"` and another `"tabs"` node's own tab
 * content ARE real nesting and stop the search on that branch.
 */
export function findTopLevelTabsNode(nodes: FieldLayoutNode[]): TabsLayoutNode | undefined {
  for (const node of nodes) {
    if (node.kind === "tabs") return node;
    if (node.kind === "row") {
      const found = findTopLevelTabsNode(node.children);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Collects the dot-joined form names of every `"field"` node reachable under
 * `nodes`, for {@link useFieldErrorCount}'s `names` — a tab or collapsible's
 * own error-count badge counts errors anywhere inside it.
 *
 * @param namePrefix - Dot-prefix to apply, matching the enclosing
 *   `RenderFields` call's own `namePrefix` — omit at the top level.
 */
export function collectFieldLayoutNames(nodes: FieldLayoutNode[], namePrefix?: string): string[] {
  const names: string[] = [];
  for (const node of nodes) {
    if (node.kind === "field") {
      names.push(namePrefix ? `${namePrefix}.${node.key}` : node.key);
      continue;
    }
    if (node.kind === "tabs") {
      for (const tab of node.tabs) names.push(...collectFieldLayoutNames(tab.children, namePrefix));
      continue;
    }
    names.push(...collectFieldLayoutNames(node.children, namePrefix));
  }
  return names;
}

/**
 * Finds the label of the first tab — within the TOP-LEVEL tabs group built
 * from `fields` — containing a field with a validation error. The submit-
 * failure handler's "jump to the first errored tab" (step description,
 * backing Interview Decision 6's tab error badges).
 *
 * @param props.fields - The collection/global's own top-level fields.
 * @param props.hasError - Reports whether a given field name currently has
 *   an error — pass `(name) => matchesFieldNamePrefix(errorPaths, [name])`
 *   style matching against the submitting form's own error paths.
 * @returns The errored tab's label, or `undefined` when there is no
 *   top-level tabs group, or none of its tabs contain an error.
 */
export function findErroredTabLabel(props: {
  fields: Record<string, AdminField>;
  hasError: (name: string) => boolean;
}): string | undefined {
  const tabsNode = findTopLevelTabsNode(buildFieldLayoutTree({ fields: props.fields }));
  if (!tabsNode) return undefined;
  for (const tab of tabsNode.tabs) {
    if (collectFieldLayoutNames(tab.children).some((name) => props.hasError(name))) return tab.label;
  }
  return undefined;
}

/**
 * Renders one `FieldLayoutNode`, recursing into `FormTabs`/`FormCollapsible`/
 * `FormRow` for container kinds.
 *
 * @throws {Error} When a `"field"` node's type has no registered input
 *   component (the same failure mode the removed `RenderFieldInputComponents`
 *   and every edit view's own field loop already threw).
 */
export function renderFieldLayoutNode(node: FieldLayoutNode, context: RenderFieldsContext): ReactNode {
  if (node.kind === "field") {
    const InputComponent = fieldToInputComponent(node.field.type);
    if (!InputComponent) {
      throw new Error(`Missing component for field type '${node.field.type}'`);
    }
    return (
      <InputComponent
        name={fieldLayoutNodeName(context, node.key)}
        fieldDef={node.field}
        readOnly={Boolean(context.readOnly) || node.field.admin.readOnly}
        collection={context.collection}
        documentStatus={context.documentStatus}
      />
    );
  }
  if (node.kind === "tabs") {
    return <FormTabs node={node} context={context} useUrlState={node.id === context.urlTabsId} />;
  }
  if (node.kind === "collapsible") {
    return <FormCollapsible node={node} context={context} />;
  }
  return <FormRow node={node} context={context} />;
}

/**
 * Renders a field map's `FieldLayoutNode` tree (`buildFieldLayoutTree`) — the
 * single renderer every field-owning surface (a collection/global's own
 * top-level fields, a `group`'s sub-fields, one `array`/`blocks` item, a
 * create modal's required-only subset) uses in place of the removed
 * `RenderFieldInputComponents`.
 *
 * Siblings lay out in a flex-wrap row at their resolved `admin.width`
 * (`FieldLayoutItem`), collapsing to full width below the `sm` breakpoint
 * (Interview Decision 4). `region`/`isTopLevel` partition a collection or
 * global's OWN top-level fields into the edit view's main/sidebar columns —
 * meaningless, and ignored, for a nested call (Interview Decision 5).
 *
 * @param props.fields - The field map this call renders — a resource's full
 *   field set, or one container's own sub-fields for a nested call.
 * @param props.collection - Forwarded to every `InputComponentProps.collection`.
 * @param props.namePrefix - Dot-prefix for every rendered field's form name —
 *   omit at the top level, pass the parent path for a nested call.
 * @param props.readOnly - OR'd with each field's own `admin.readOnly`.
 * @param props.region - Which top-level partition to render — `"main"`,
 *   `"sidebar"`, or `"all"` (default). Only consulted when `isTopLevel` is set.
 * @param props.fieldKeys - Restricts rendering to this key subset (RBAC-visible
 *   reads, or a create modal's required-only fields).
 * @param props.isTopLevel - Enables the `region` partition and the one
 *   top-level tabs group's `?tab=` URL persistence (Interview Decision 6).
 * @returns The rendered tree, or `null` when every node is filtered out.
 *
 * @example
 * ```tsx
 * <AppForm form={form}>
 *   <RenderFields fields={collection.fields} collection={collection} isTopLevel region="main" />
 * </AppForm>
 * ```
 */
export function RenderFields(props: {
  fields: Record<string, AdminField>;
  collection: CollectionConfig | GlobalConfig;
  namePrefix?: string;
  readOnly?: boolean;
  documentStatus?: VexVersionStatus;
  region?: "main" | "sidebar" | "all";
  fieldKeys?: readonly string[];
  isTopLevel?: boolean;
}): ReactNode {
  const {
    fields,
    collection,
    namePrefix,
    readOnly,
    documentStatus,
    region = "all",
    fieldKeys,
    isTopLevel,
  } = props;

  const tree = useMemo(() => buildFieldLayoutTree({ fields }), [fields]);
  const visible = useMemo(
    () => filterFieldLayoutNodes({ nodes: tree, fieldKeys }),
    [tree, fieldKeys],
  );
  const partitioned =
    isTopLevel && region !== "all"
      ? visible.filter((node) =>
          (node.kind === "field" ? node.field.admin.position : "main") === region,
        )
      : visible;
  const urlTabsId = isTopLevel ? findTopLevelTabsNode(partitioned)?.id : undefined;
  const context: RenderFieldsContext = { collection, namePrefix, readOnly, documentStatus, urlTabsId };

  if (partitioned.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4">
      {partitioned.map((node) => (
        <FieldLayoutItem
          key={node.kind === "field" ? node.key : node.id}
          width={fieldLayoutNodeWidth(node)}
        >
          {renderFieldLayoutNode(node, context)}
        </FieldLayoutItem>
      ))}
    </div>
  );
}
```

#### packages/react/src/components/form/RenderFields.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import {
  buildFieldLayoutTree,
  collapsible,
  defineCollection,
  row,
  tabs,
  text,
  type AdminField,
  type CollectionConfig,
} from "@vexcms/core";
import { AppForm } from "./AppForm";
import {
  collectFieldLayoutNames,
  fieldLayoutNodeWidth,
  filterFieldLayoutNodes,
  findErroredTabLabel,
  findTopLevelTabsNode,
  RenderFields,
} from "./RenderFields";

const baseCollection = defineCollection({
  slug: "render_fields_test",
  fields: { title: text({ required: false }) },
});

/**
 * Mounts `RenderFields` behind a real `useForm` + `<AppForm>`, wrapped in a
 * `NuqsTestingAdapter` — `FormTabs` calls `useQueryState` unconditionally
 * (even when it keeps local state), so it throws without one.
 */
function Harness(props: {
  fields: Record<string, AdminField>;
  collection?: CollectionConfig;
  initialValues?: Record<string, unknown>;
  readOnly?: boolean;
  region?: "main" | "sidebar" | "all";
  fieldKeys?: readonly string[];
  isTopLevel?: boolean;
}) {
  const form = useForm({ defaultValues: props.initialValues ?? {} });
  return (
    <NuqsTestingAdapter hasMemory>
      <AppForm form={form}>
        <RenderFields
          fields={props.fields}
          collection={props.collection ?? baseCollection}
          readOnly={props.readOnly}
          region={props.region}
          fieldKeys={props.fieldKeys}
          isTopLevel={props.isTopLevel}
        />
      </AppForm>
    </NuqsTestingAdapter>
  );
}

describe("RenderFields", () => {
  it("renders one input per field, bound to the field key", () => {
    render(
      <Harness
        fields={{ title: text({ label: "Title" }), slug: text({ label: "Slug" }) }}
        initialValues={{ title: "Hello", slug: "hello" }}
      />,
    );
    expect(screen.getByLabelText("Title")).toHaveValue("Hello");
    expect(screen.getByLabelText("Slug")).toHaveValue("hello");
  });

  it("dot-joins a namePrefix onto every rendered field's form name", () => {
    function PrefixHarness() {
      const form = useForm({ defaultValues: { seo: { title: "Hi" } } });
      return (
        <NuqsTestingAdapter>
          <AppForm form={form}>
            <RenderFields
              fields={{ title: text({ label: "Title" }) }}
              collection={baseCollection}
              namePrefix="seo"
            />
          </AppForm>
        </NuqsTestingAdapter>
      );
    }
    render(<PrefixHarness />);
    expect(screen.getByLabelText("Title")).toHaveValue("Hi");
  });

  it("excludes an admin.hidden field entirely", () => {
    render(
      <Harness
        fields={{
          title: text({ label: "Title" }),
          secret: text({ label: "Secret", admin: { hidden: true } }),
        }}
      />,
    );
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.queryByLabelText("Secret")).not.toBeInTheDocument();
  });

  it("restricts rendering to the given fieldKeys subset", () => {
    render(
      <Harness
        fields={{ title: text({ label: "Title" }), slug: text({ label: "Slug" }) }}
        fieldKeys={["title"]}
      />,
    );
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.queryByLabelText("Slug")).not.toBeInTheDocument();
  });

  it("OR's the readOnly prop onto every field's own admin.readOnly", () => {
    render(<Harness fields={{ title: text({ label: "Title" }) }} readOnly />);
    expect(screen.getByLabelText("Title")).toBeDisabled();
  });

  it("renders nothing when every field is filtered out", () => {
    const { container } = render(
      <Harness fields={{ title: text({ label: "Title", admin: { hidden: true } }) }} />,
    );
    expect(container.querySelector("form")).toBeEmptyDOMElement();
  });

  it("partitions top-level fields into main/sidebar by admin.position, only when isTopLevel is set", () => {
    const fields = {
      title: text({ label: "Title" }),
      summary: text({ label: "Summary", admin: { position: "sidebar" } }),
    };
    const { rerender } = render(
      <Harness fields={fields} region="main" isTopLevel initialValues={{ title: "", summary: "" }} />,
    );
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.queryByLabelText("Summary")).not.toBeInTheDocument();

    rerender(
      <Harness fields={fields} region="sidebar" isTopLevel initialValues={{ title: "", summary: "" }} />,
    );
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Summary")).toBeInTheDocument();
  });

  it("ignores region when isTopLevel is not set (nested call)", () => {
    const fields = {
      title: text({ label: "Title" }),
      summary: text({ label: "Summary", admin: { position: "sidebar" } }),
    };
    render(<Harness fields={fields} region="main" initialValues={{ title: "", summary: "" }} />);
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Summary")).toBeInTheDocument();
  });

  it("sets the --field-width CSS var from admin.width", () => {
    render(<Harness fields={{ title: text({ label: "Title", admin: { width: "30%" } }) }} />);
    const input = screen.getByLabelText("Title");
    const wrapper = input.closest("div[style]");
    expect(wrapper).not.toBeNull();
    expect((wrapper as HTMLElement).style.getPropertyValue("--field-width")).toBe("30%");
  });

  it("renders a tabs() group via FormTabs, switching tabs on click", async () => {
    const user = userEvent.setup();
    const fields = tabs({
      tabs: {
        general: { title: text({ label: "Title" }) },
        advanced: { slug: text({ label: "Slug" }) },
      },
    });
    render(<Harness fields={fields} isTopLevel initialValues={{ title: "", slug: "" }} />);
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.queryByLabelText("Slug")).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "advanced" }));
    // Base UI's Tabs.Panel unmounts the inactive panel after its exit
    // transition, not synchronously on click — same lag the existing
    // relationship/select input tests already wait out.
    await waitFor(() => expect(screen.queryByLabelText("Title")).not.toBeInTheDocument());
    expect(screen.getByLabelText("Slug")).toBeInTheDocument();
  });

  it("renders a collapsible() group via FormCollapsible, open by default", () => {
    const fields = collapsible({ label: "Details", fields: { title: text({ label: "Title" }) } });
    render(<Harness fields={fields} initialValues={{ title: "" }} />);
    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
  });

  it("starts a collapsible() with defaultCollapsed closed, hiding its field", () => {
    const fields = collapsible({
      label: "Details",
      fields: { title: text({ label: "Title" }) },
      defaultCollapsed: true,
    });
    render(<Harness fields={fields} initialValues={{ title: "" }} />);
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
  });

  it("renders a row() group via FormRow", () => {
    const fields = row({
      fields: { title: text({ label: "Title" }), slug: text({ label: "Slug" }) },
    });
    render(<Harness fields={fields} initialValues={{ title: "", slug: "" }} />);
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Slug")).toBeInTheDocument();
  });
});

describe("filterFieldLayoutNodes", () => {
  it("drops a tabs node entirely when every one of its tabs loses all children", () => {
    const fields = tabs({
      tabs: { general: { secret: text({ admin: { hidden: true } }) } },
    });
    const tree = buildFieldLayoutTree({ fields });
    const filtered = filterFieldLayoutNodes({ nodes: tree });
    expect(findTopLevelTabsNode(filtered)).toBeUndefined();
  });
});

describe("findErroredTabLabel", () => {
  it("returns the label of the first tab containing an errored field name", () => {
    const fields = tabs({
      tabs: {
        general: { title: text({ label: "Title" }) },
        advanced: { slug: text({ label: "Slug" }) },
      },
    });
    const label = findErroredTabLabel({ fields, hasError: (name) => name === "slug" });
    expect(label).toBe("advanced");
  });

  it("returns undefined when there is no top-level tabs group", () => {
    const label = findErroredTabLabel({
      fields: { title: text({ label: "Title" }) },
      hasError: () => true,
    });
    expect(label).toBeUndefined();
  });

  it("returns undefined when no tab contains an error", () => {
    const fields = tabs({
      tabs: { general: { title: text({ label: "Title" }) } },
    });
    const label = findErroredTabLabel({ fields, hasError: () => false });
    expect(label).toBeUndefined();
  });
});

describe("collectFieldLayoutNames", () => {
  it("dot-joins a namePrefix onto every collected name", () => {
    const fields = row({ fields: { title: text(), slug: text() } });
    const tree = buildFieldLayoutTree({ fields });
    const names = collectFieldLayoutNames(tree, "seo");
    expect(names.sort()).toEqual(["seo.slug", "seo.title"]);
  });
});

describe("fieldLayoutNodeWidth", () => {
  it("resolves a container node's width to 100% regardless of its children", () => {
    const fields = row({ fields: { title: text({ admin: { width: "30%" } }) } });
    const [rowNode] = buildFieldLayoutTree({ fields });
    expect(fieldLayoutNodeWidth(rowNode)).toBe("100%");
  });
});
```

#### packages/react/src/components/form/FormTabs.tsx

```tsx
"use client";

import { useState } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { useFieldErrorCount } from "../../hooks/useFieldErrorCount";
import { FORM_URL_PARAMS } from "./constants";
import {
  FieldLayoutItem,
  collectFieldLayoutNames,
  fieldLayoutNodeWidth,
  renderFieldLayoutNode,
  type RenderFieldsContext,
  type TabsLayoutNode,
} from "./RenderFields";

/** One tab trigger, badged with `useFieldErrorCount` over its own children. */
function FormTabsTrigger(props: { tab: TabsLayoutNode["tabs"][number]; context: RenderFieldsContext }) {
  const errorCount = useFieldErrorCount({
    names: collectFieldLayoutNames(props.tab.children, props.context.namePrefix),
  });
  return (
    <TabsTrigger value={props.tab.label} className="gap-1.5">
      {props.tab.label}
      {errorCount > 0 && <Badge variant="destructive">{errorCount}</Badge>}
    </TabsTrigger>
  );
}

/**
 * Renders one `"tabs"` `FieldLayoutNode` as a `Tabs` widget — one trigger per
 * tab, each badged with its own error count.
 *
 * Only the one top-level tabs group `RenderFields` identified (`useUrlState`)
 * persists its active tab in the `?tab=` URL param via `nuqs`; every other
 * tabs group — nested, or a second top-level one — keeps local `useState`
 * (Interview Decision 6).
 *
 * @param props.node - The `"tabs"` node to render.
 * @param props.context - The {@link RenderFieldsContext} from the enclosing `RenderFields` call.
 * @param props.useUrlState - Whether this is the one group `?tab=` tracks.
 */
export function FormTabs(props: {
  node: TabsLayoutNode;
  context: RenderFieldsContext;
  useUrlState: boolean;
}) {
  const { node, context, useUrlState } = props;
  const firstLabel = node.tabs[0]?.label ?? "";

  const [urlTab, setUrlTab] = useQueryState(
    FORM_URL_PARAMS.tab,
    parseAsString.withDefault(firstLabel),
  );
  const [localTab, setLocalTab] = useState(firstLabel);
  const activeTab = useUrlState ? urlTab : localTab;

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        if (useUrlState) void setUrlTab(value as string);
        else setLocalTab(value as string);
      }}
    >
      <TabsList>
        {node.tabs.map((tab) => (
          <FormTabsTrigger key={tab.label} tab={tab} context={context} />
        ))}
      </TabsList>
      {node.tabs.map((tab) => (
        <TabsContent key={tab.label} value={tab.label}>
          <div className="flex flex-wrap gap-4">
            {tab.children.map((child) => (
              <FieldLayoutItem
                key={child.kind === "field" ? child.key : child.id}
                width={fieldLayoutNodeWidth(child)}
              >
                {renderFieldLayoutNode(child, context)}
              </FieldLayoutItem>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
```

#### packages/react/src/components/form/FormTabs.test.tsx

```tsx
import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { OnUrlUpdateFunction } from "nuqs/adapters/testing";
import { buildFieldLayoutTree, defineCollection, tabs, text, type AdminField } from "@vexcms/core";
import { AppForm } from "./AppForm";
import type { AnyFormApi } from "./AppFormContext";
import { FormTabs } from "./FormTabs";
import type { TabsLayoutNode } from "./RenderFields";

const baseCollection = defineCollection({
  slug: "form_tabs_test",
  fields: { title: text({ required: false }) },
});

/** Builds a real `TabsLayoutNode` via `tabs()` + `buildFieldLayoutTree`, instead of hand-crafting one. */
function buildTabsNode(fieldsPerTab: Record<string, Record<string, AdminField>>) {
  const fields = tabs({ tabs: fieldsPerTab });
  const tree = buildFieldLayoutTree({ fields });
  const node = tree[0];
  if (!node || node.kind !== "tabs") throw new Error("expected a single tabs node");
  return node;
}

function renderHarness(props: {
  node: TabsLayoutNode;
  useUrlState: boolean;
  defaultValues: Record<string, unknown>;
  onUrlUpdate?: OnUrlUpdateFunction;
}) {
  const formRef: { current: AnyFormApi | undefined } = { current: undefined };
  function Harness() {
    const form = useForm({ defaultValues: props.defaultValues });
    formRef.current = form as AnyFormApi;
    return (
      <AppForm form={form}>
        <FormTabs node={props.node} context={{ collection: baseCollection }} useUrlState={props.useUrlState} />
      </AppForm>
    );
  }
  render(
    <NuqsTestingAdapter hasMemory onUrlUpdate={props.onUrlUpdate}>
      <Harness />
    </NuqsTestingAdapter>,
  );
  return { form: () => formRef.current! };
}

describe("FormTabs", () => {
  it("renders every tab trigger and only the active tab's fields", () => {
    const node = buildTabsNode({
      general: { title: text({ label: "Title" }) },
      advanced: { slug: text({ label: "Slug" }) },
    });
    renderHarness({ node, useUrlState: false, defaultValues: { title: "", slug: "" } });
    expect(screen.getByRole("tab", { name: "general" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "advanced" })).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.queryByLabelText("Slug")).not.toBeInTheDocument();
  });

  it("writes the active tab to ?tab= when useUrlState is true", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn();
    const node = buildTabsNode({
      general: { title: text({ label: "Title" }) },
      advanced: { slug: text({ label: "Slug" }) },
    });
    renderHarness({ node, useUrlState: true, defaultValues: { title: "", slug: "" }, onUrlUpdate });
    await user.click(screen.getByRole("tab", { name: "advanced" }));
    expect(onUrlUpdate).toHaveBeenCalled();
    const lastCall = onUrlUpdate.mock.calls[onUrlUpdate.mock.calls.length - 1][0];
    expect(lastCall.searchParams.get("tab")).toBe("advanced");
  });

  it("never touches the URL when useUrlState is false", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn();
    const node = buildTabsNode({
      general: { title: text({ label: "Title" }) },
      advanced: { slug: text({ label: "Slug" }) },
    });
    renderHarness({ node, useUrlState: false, defaultValues: { title: "", slug: "" }, onUrlUpdate });
    await user.click(screen.getByRole("tab", { name: "advanced" }));
    expect(screen.getByLabelText("Slug")).toBeInTheDocument();
    expect(onUrlUpdate).not.toHaveBeenCalled();
  });

  it("shows an error-count badge only on the tab whose own field has an error", () => {
    const node = buildTabsNode({
      general: { title: text({ label: "Title" }) },
      advanced: { slug: text({ label: "Slug" }) },
    });
    const { form } = renderHarness({ node, useUrlState: false, defaultValues: { title: "", slug: "" } });
    act(() => {
      form().setFieldMeta("slug", (prev) => ({
        ...prev,
        errorMap: { ...prev?.errorMap, onSubmit: "Required" },
      }));
    });
    const generalTab = screen.getByRole("tab", { name: /general/ });
    const advancedTab = screen.getByRole("tab", { name: /advanced/ });
    expect(generalTab.textContent).toBe("general");
    expect(advancedTab.textContent).toBe("advanced1");
  });
});
```

#### packages/react/src/components/form/FormCollapsible.tsx

```tsx
"use client";

import { useState } from "react";
import type { FieldLayoutNode } from "@vexcms/core";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Badge } from "../ui/badge";
import { useFieldErrorCount } from "../../hooks/useFieldErrorCount";
import {
  FieldLayoutItem,
  collectFieldLayoutNames,
  fieldLayoutNodeWidth,
  renderFieldLayoutNode,
  type RenderFieldsContext,
} from "./RenderFields";

/** The `collapsible` member of `FieldLayoutNode`'s discriminated union. */
export type CollapsibleLayoutNode = Extract<FieldLayoutNode, { kind: "collapsible" }>;

/**
 * Renders one `"collapsible"` `FieldLayoutNode` as an accordion section —
 * open by default unless `node.defaultCollapsed`. While collapsed, the
 * trigger shows an error-count badge for any field inside, via
 * `useFieldErrorCount` (Interview Decision 6).
 *
 * @param props.node - The `"collapsible"` node to render.
 * @param props.context - The {@link RenderFieldsContext} from the enclosing `RenderFields` call.
 */
export function FormCollapsible(props: { node: CollapsibleLayoutNode; context: RenderFieldsContext }) {
  const { node, context } = props;
  const [openIds, setOpenIds] = useState<string[]>(node.defaultCollapsed ? [] : [node.id]);
  const isOpen = openIds.includes(node.id);
  const errorCount = useFieldErrorCount({
    names: collectFieldLayoutNames(node.children, context.namePrefix),
  });

  return (
    <Accordion value={openIds} onValueChange={setOpenIds} className="rounded-sm border-2 border-border">
      <AccordionItem value={node.id}>
        <AccordionTrigger className="gap-2 px-3 text-sm font-medium hover:no-underline">
          {node.label}
          {!isOpen && errorCount > 0 && <Badge variant="destructive">{errorCount}</Badge>}
        </AccordionTrigger>
        <AccordionContent className="px-3">
          <div className="flex flex-wrap gap-4">
            {node.children.map((child) => (
              <FieldLayoutItem
                key={child.kind === "field" ? child.key : child.id}
                width={fieldLayoutNodeWidth(child)}
              >
                {renderFieldLayoutNode(child, context)}
              </FieldLayoutItem>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

#### packages/react/src/components/form/FormCollapsible.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { buildFieldLayoutTree, collapsible, defineCollection, text, type AdminField } from "@vexcms/core";
import { AppForm } from "./AppForm";
import type { AnyFormApi } from "./AppFormContext";
import { FormCollapsible } from "./FormCollapsible";
import type { CollapsibleLayoutNode } from "./FormCollapsible";

const baseCollection = defineCollection({
  slug: "form_collapsible_test",
  fields: { title: text({ required: false }) },
});

/** Builds a real `CollapsibleLayoutNode` via `collapsible()` + `buildFieldLayoutTree`. */
function buildCollapsibleNode(props: {
  label: string;
  fields: Record<string, AdminField>;
  defaultCollapsed?: boolean;
}) {
  const fields = collapsible(props);
  const tree = buildFieldLayoutTree({ fields });
  const node = tree[0];
  if (!node || node.kind !== "collapsible") throw new Error("expected a single collapsible node");
  return node;
}

function renderHarness(props: { node: CollapsibleLayoutNode; defaultValues: Record<string, unknown> }) {
  const formRef: { current: AnyFormApi | undefined } = { current: undefined };
  function Harness() {
    const form = useForm({ defaultValues: props.defaultValues });
    formRef.current = form as AnyFormApi;
    return (
      <AppForm form={form}>
        <FormCollapsible node={props.node} context={{ collection: baseCollection }} />
      </AppForm>
    );
  }
  render(<Harness />);
  return { form: () => formRef.current! };
}

describe("FormCollapsible", () => {
  it("starts open and shows the label and every sub-field, by default", () => {
    const node = buildCollapsibleNode({ label: "Details", fields: { title: text({ label: "Title" }) } });
    renderHarness({ node, defaultValues: { title: "" } });
    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
  });

  it("starts closed when defaultCollapsed is true", () => {
    const node = buildCollapsibleNode({
      label: "Details",
      fields: { title: text({ label: "Title" }) },
      defaultCollapsed: true,
    });
    renderHarness({ node, defaultValues: { title: "" } });
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
  });

  it("opens on trigger click, revealing its sub-field", async () => {
    const user = userEvent.setup();
    const node = buildCollapsibleNode({
      label: "Details",
      fields: { title: text({ label: "Title" }) },
      defaultCollapsed: true,
    });
    renderHarness({ node, defaultValues: { title: "" } });
    await user.click(screen.getByText("Details"));
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
  });

  it("shows an error-count badge while collapsed", () => {
    const node = buildCollapsibleNode({
      label: "Details",
      fields: { title: text({ label: "Title" }) },
      defaultCollapsed: true,
    });
    const { form } = renderHarness({ node, defaultValues: { title: "" } });
    act(() => {
      form().setFieldMeta("title", (prev) => ({
        ...prev,
        errorMap: { ...prev?.errorMap, onSubmit: "Required" },
      }));
    });
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("hides the error-count badge once opened", async () => {
    const user = userEvent.setup();
    const node = buildCollapsibleNode({
      label: "Details",
      fields: { title: text({ label: "Title" }) },
      defaultCollapsed: true,
    });
    const { form } = renderHarness({ node, defaultValues: { title: "" } });
    act(() => {
      form().setFieldMeta("title", (prev) => ({
        ...prev,
        errorMap: { ...prev?.errorMap, onSubmit: "Required" },
      }));
    });
    expect(screen.getByText("1")).toBeInTheDocument();
    await user.click(screen.getByText("Details"));
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });
});
```

#### packages/react/src/components/form/FormRow.tsx

```tsx
"use client";

import { resolveRowWidths, type FieldLayoutNode } from "@vexcms/core";
import {
  FieldLayoutItem,
  fieldLayoutNodeWidth,
  renderFieldLayoutNode,
  type RenderFieldsContext,
} from "./RenderFields";

/** The `row` member of `FieldLayoutNode`'s discriminated union. */
export type RowLayoutNode = Extract<FieldLayoutNode, { kind: "row" }>;

/**
 * Renders one `"row"` `FieldLayoutNode` as a flex-wrap sub-row. Children's
 * widths are resolved by `resolveRowWidths` — their own `%` widths when they
 * sum to ~100%, an equal share otherwise (Interview Decision 6).
 *
 * @param props.node - The `"row"` node to render.
 * @param props.context - The {@link RenderFieldsContext} from the enclosing `RenderFields` call.
 */
export function FormRow(props: { node: RowLayoutNode; context: RenderFieldsContext }) {
  const { node, context } = props;
  const widths = resolveRowWidths({ widths: node.children.map(fieldLayoutNodeWidth) });
  return (
    <div className="flex flex-wrap gap-4">
      {node.children.map((child, index) => (
        <FieldLayoutItem
          key={child.kind === "field" ? child.key : child.id}
          width={widths[index] ?? "100%"}
        >
          {renderFieldLayoutNode(child, context)}
        </FieldLayoutItem>
      ))}
    </div>
  );
}
```

#### packages/react/src/components/form/FormRow.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { buildFieldLayoutTree, defineCollection, row, text, type AdminField } from "@vexcms/core";
import { AppForm } from "./AppForm";
import { FormRow } from "./FormRow";
import type { RowLayoutNode } from "./FormRow";

const baseCollection = defineCollection({
  slug: "form_row_test",
  fields: { title: text({ required: false }) },
});

/** Builds a real `RowLayoutNode` via `row()` + `buildFieldLayoutTree`. */
function buildRowNode(fields: Record<string, AdminField>): RowLayoutNode {
  const tree = buildFieldLayoutTree({ fields: row({ fields }) });
  const node = tree[0];
  if (!node || node.kind !== "row") throw new Error("expected a single row node");
  return node;
}

function renderHarness(props: { node: RowLayoutNode; defaultValues: Record<string, unknown> }) {
  function Harness() {
    const form = useForm({ defaultValues: props.defaultValues });
    return (
      <AppForm form={form}>
        <FormRow node={props.node} context={{ collection: baseCollection }} />
      </AppForm>
    );
  }
  render(<Harness />);
}

describe("FormRow", () => {
  it("renders every child field", () => {
    const node = buildRowNode({ title: text({ label: "Title" }), slug: text({ label: "Slug" }) });
    renderHarness({ node, defaultValues: { title: "", slug: "" } });
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Slug")).toBeInTheDocument();
  });

  it("keeps each child's own % width when they sum to 100", () => {
    const node = buildRowNode({
      title: text({ label: "Title", admin: { width: "30%" } }),
      slug: text({ label: "Slug", admin: { width: "70%" } }),
    });
    renderHarness({ node, defaultValues: { title: "", slug: "" } });
    const titleWrapper = screen.getByLabelText("Title").closest("div[style]") as HTMLElement;
    const slugWrapper = screen.getByLabelText("Slug").closest("div[style]") as HTMLElement;
    expect(titleWrapper.style.getPropertyValue("--field-width")).toBe("30%");
    expect(slugWrapper.style.getPropertyValue("--field-width")).toBe("70%");
  });

  it("falls back to an equal share when the children's widths do not sum to 100", () => {
    const node = buildRowNode({
      title: text({ label: "Title", admin: { width: "30%" } }),
      slug: text({ label: "Slug", admin: { width: "30%" } }),
    });
    renderHarness({ node, defaultValues: { title: "", slug: "" } });
    const titleWrapper = screen.getByLabelText("Title").closest("div[style]") as HTMLElement;
    const slugWrapper = screen.getByLabelText("Slug").closest("div[style]") as HTMLElement;
    expect(titleWrapper.style.getPropertyValue("--field-width")).toBe("50%");
    expect(slugWrapper.style.getPropertyValue("--field-width")).toBe("50%");
  });
});
```

Step 6's `resolveRowWidths` formats an equal share as `${Math.round((100 / n) * 100) / 100}%`, so two children resolve to `"50%"`.

#### packages/react/src/hooks/useFieldErrorCount.ts

```ts
"use client";

import { useContext } from "react";
import { useStore } from "@tanstack/react-form";
import { AppFormContext } from "../components/form/AppFormContext";

/**
 * Whether a form field path falls under one of the given name prefixes — the
 * path equals the prefix itself, or continues it with `.` (a group/object
 * sub-field) or `[` (an array/blocks item). Exported so a submit-failure
 * handler (e.g. jumping to the first errored tab) agrees with this hook's
 * own badge count on what counts as "under" a name.
 */
export function matchesFieldNamePrefix(path: string, names: readonly string[]): boolean {
  return names.some((name) => path === name || path.startsWith(`${name}.`) || path.startsWith(`${name}[`));
}

/**
 * Counts the fields with a validation error whose path is one of `names`, or
 * a nested path under one of them — the error-count badge a tab trigger or a
 * collapsed `FormCollapsible` shows (Interview Decision 6).
 *
 * Reads `form.store.state.fieldMeta` (the DERIVED meta store) from the
 * nearest `<AppForm>` — `fieldMetaBase` explicitly excludes derived
 * properties like `errors` (see its own JSDoc in `@tanstack/form-core`), so
 * only `fieldMeta` carries a populated `.errors` array — and re-renders only
 * when a counted field's own error state changes.
 *
 * @param props.names - Field name prefixes to count errors under (e.g. the
 *   top-level keys of one tab's or one collapsible's own children).
 * @returns The number of distinct erroring field paths under `names`.
 * @throws {Error} When called outside `<AppForm>`.
 */
export function useFieldErrorCount(props: { names: readonly string[] }): number {
  const form = useContext(AppFormContext);
  if (!form) {
    throw new Error("useFieldErrorCount must be called inside <AppForm>.");
  }
  const { names } = props;
  return useStore(form.store, (state) => {
    let count = 0;
    for (const [path, meta] of Object.entries(state.fieldMeta)) {
      if (!meta || meta.errors.length === 0) continue;
      if (matchesFieldNamePrefix(path, names)) count += 1;
    }
    return count;
  });
}
```

#### packages/react/src/hooks/useFieldErrorCount.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { AppForm } from "../components/form/AppForm";
import type { AnyFormApi } from "../components/form/AppFormContext";
import { matchesFieldNamePrefix, useFieldErrorCount } from "./useFieldErrorCount";

function Probe(props: { names: string[] }) {
  const count = useFieldErrorCount({ names: props.names });
  return <span data-testid="count">{count}</span>;
}

function renderHarness(props: { names: string[]; defaultValues: Record<string, unknown> }) {
  const formRef: { current: AnyFormApi | undefined } = { current: undefined };
  function Harness() {
    const form = useForm({ defaultValues: props.defaultValues });
    formRef.current = form as AnyFormApi;
    return (
      <AppForm form={form}>
        <Probe names={props.names} />
      </AppForm>
    );
  }
  render(<Harness />);
  return { form: () => formRef.current! };
}

function setError(form: AnyFormApi, field: string, message: string) {
  act(() => {
    form.setFieldMeta(field, (prev) => ({
      ...prev,
      errorMap: { ...prev?.errorMap, onSubmit: message },
    }));
  });
}

describe("useFieldErrorCount", () => {
  it("is 0 when nothing has an error", () => {
    renderHarness({ names: ["title"], defaultValues: { title: "" } });
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("counts a field whose path exactly equals one of names", () => {
    const { form } = renderHarness({ names: ["title"], defaultValues: { title: "" } });
    setError(form(), "title", "Required");
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  it("counts a nested object sub-field path (dot) under its parent name", () => {
    const { form } = renderHarness({
      names: ["seo"],
      defaultValues: { seo: { title: "" } },
    });
    setError(form(), "seo.title", "Required");
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  it("counts a nested array item path (bracket) under its parent name", () => {
    const { form } = renderHarness({
      names: ["tags"],
      defaultValues: { tags: [""] },
    });
    setError(form(), "tags[0]", "Required");
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  it("does not count a field outside every given name", () => {
    const { form } = renderHarness({
      names: ["title"],
      defaultValues: { title: "", slug: "" },
    });
    setError(form(), "slug", "Required");
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("does not count a field whose name merely shares a prefix string (titleTag vs title)", () => {
    const { form } = renderHarness({
      names: ["title"],
      defaultValues: { title: "", titleTag: "" },
    });
    setError(form(), "titleTag", "Required");
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("throws when called outside <AppForm>", () => {
    function Bare() {
      useFieldErrorCount({ names: ["title"] });
      return null;
    }
    expect(() => render(<Bare />)).toThrow("useFieldErrorCount must be called inside <AppForm>.");
  });
});

describe("matchesFieldNamePrefix", () => {
  it("matches an exact path", () => {
    expect(matchesFieldNamePrefix("title", ["title"])).toBe(true);
  });

  it("matches a dot-nested path", () => {
    expect(matchesFieldNamePrefix("seo.title", ["seo"])).toBe(true);
  });

  it("matches a bracket-nested path", () => {
    expect(matchesFieldNamePrefix("tags[0]", ["tags"])).toBe(true);
  });

  it("rejects a path that only shares a string prefix", () => {
    expect(matchesFieldNamePrefix("titleTag", ["title"])).toBe(false);
  });

  it("matches against any of several names", () => {
    expect(matchesFieldNamePrefix("slug", ["title", "slug"])).toBe(true);
  });
});
```

#### packages/react/src/hooks/index.ts

1 edit — add the `useFieldErrorCount` re-export; everything else unchanged.

```ts
export * from "./useFieldCondition";
export * from "./useFieldErrorCount";
```

#### packages/react/src/components/form/DocumentTimestamps.tsx

```tsx
"use client";

import type { ReactNode } from "react";
import { formatDateFieldValue } from "../fields/date/utils";

/** `time` precision `DocumentTimestamps` renders its "Created at" value at — matches the injected `updatedAt` field (Interview Decision 3). */
const CREATED_AT_TIME = {
  hidden: false,
  use12HourFormat: true,
  timePicker: { hour: true, minute: true, second: true },
} as const;

/**
 * Read-only "Created at" shown in an edit view's sidebar for an existing
 * document — the counterpart to the regular, `admin.readOnly` `updatedAt`
 * field injected onto every collection/global (Interview Decision 3), but
 * sourced from `_creationTime` instead of a stored field.
 *
 * @param props.creationTime - The document's `_creationTime`, or `undefined`
 *   before the document exists (a global's first save, a brand-new row).
 * @returns The timestamp block, or `null` when `creationTime` is `undefined`.
 */
export function DocumentTimestamps(props: { creationTime: number | undefined }): ReactNode {
  if (props.creationTime === undefined) return null;
  return (
    <div className="space-y-1 rounded-sm border-2 border-border p-3 text-sm">
      <span className="text-muted-foreground">Created at</span>
      <p>{formatDateFieldValue({ value: props.creationTime, time: CREATED_AT_TIME })}</p>
    </div>
  );
}
```

#### packages/react/src/components/form/DocumentTimestamps.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DocumentTimestamps } from "./DocumentTimestamps";

describe("DocumentTimestamps", () => {
  it("renders nothing when creationTime is undefined", () => {
    const { container } = render(<DocumentTimestamps creationTime={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a 'Created at' label with the formatted timestamp", () => {
    const creationTime = new Date(2026, 0, 15, 14, 30, 0).getTime();
    render(<DocumentTimestamps creationTime={creationTime} />);
    expect(screen.getByText("Created at")).toBeInTheDocument();
    expect(screen.getByText("Jan 15, 2026 2:30:00 PM")).toBeInTheDocument();
  });
});
```

#### packages/react/src/components/form/applyFieldPermissionReadOnly.ts

```ts
import { isFieldAllowed, type AdminField, type ResolvedFieldPermissions } from "@vexcms/core";

/**
 * Forces `admin.readOnly: true` on a single field, preserving its exact
 * `AdminField` union member (e.g. `TextField` stays `TextField`) — spreading
 * onto a plain `AdminField`-typed parameter/return would widen a
 * discriminated-union member back to the full union, losing its `type`-keyed
 * narrowing for every caller downstream. Mirrors the narrowing-preserving
 * generic shape of `resolveFieldLimit`'s per-field transform in
 * `packages/core/src/fields/utils.ts`.
 */
function withReadOnly<T extends AdminField>(field: T): T {
  return { ...field, admin: { ...field.admin, readOnly: true } };
}

/**
 * Forces `admin.readOnly: true` on every field `fieldPermissions` denies
 * write access to, leaving every other field's own `admin.readOnly`
 * untouched.
 *
 * `RenderFields`'s own `readOnly` prop is one flat boolean OR'd onto every
 * field uniformly — it has no per-field channel, unlike the field loops it
 * replaced (`CollectionEditView`/`GlobalEditView`/`MediaCollectionEditView`
 * each read `!isFieldAllowed(fieldPermissions, fieldKey)` per field). Baking
 * the per-field denial into the field map before it reaches `RenderFields`
 * keeps that behavior without widening `RenderFields`'s contracted signature.
 *
 * @param props.fields - The field map to merge permission-driven read-only into.
 * @param props.fieldPermissions - The resolved write permissions to apply.
 * @returns A new field map; fields the caller may write are returned as-is.
 */
export function applyFieldPermissionReadOnly(props: {
  fields: Record<string, AdminField>;
  fieldPermissions: ResolvedFieldPermissions;
}): Record<string, AdminField> {
  const result: Record<string, AdminField> = {};
  for (const [fieldKey, fieldDef] of Object.entries(props.fields)) {
    result[fieldKey] = isFieldAllowed(props.fieldPermissions, fieldKey)
      ? fieldDef
      : withReadOnly(fieldDef);
  }
  return result;
}
```

#### packages/react/src/components/form/applyFieldPermissionReadOnly.test.ts

```ts
import { describe, expect, it } from "vitest";
import { text, type ResolvedFieldPermissions } from "@vexcms/core";
import { applyFieldPermissionReadOnly } from "./applyFieldPermissionReadOnly";

describe("applyFieldPermissionReadOnly", () => {
  it("leaves a field permission allows untouched", () => {
    const fields = { title: text({ label: "Title" }) };
    const fieldPermissions: ResolvedFieldPermissions = { wildcard: true, fields: {} };
    const result = applyFieldPermissionReadOnly({ fields, fieldPermissions });
    expect(result.title).toBe(fields.title);
    expect(result.title.admin.readOnly).toBe(false);
  });

  it("forces admin.readOnly true on a field the wildcard denies", () => {
    const fields = { title: text({ label: "Title" }) };
    const fieldPermissions: ResolvedFieldPermissions = { wildcard: false, fields: {} };
    const result = applyFieldPermissionReadOnly({ fields, fieldPermissions });
    expect(result.title.admin.readOnly).toBe(true);
  });

  it("respects a per-field override beside a wildcard", () => {
    const fields = {
      title: text({ label: "Title" }),
      secret: text({ label: "Secret" }),
    };
    const fieldPermissions: ResolvedFieldPermissions = {
      wildcard: true,
      fields: { secret: false },
    };
    const result = applyFieldPermissionReadOnly({ fields, fieldPermissions });
    expect(result.title.admin.readOnly).toBe(false);
    expect(result.secret.admin.readOnly).toBe(true);
  });

  it("preserves a field's own admin.readOnly when permission already allows it", () => {
    const fields = { title: text({ label: "Title", admin: { readOnly: true } }) };
    const fieldPermissions: ResolvedFieldPermissions = { wildcard: true, fields: {} };
    const result = applyFieldPermissionReadOnly({ fields, fieldPermissions });
    expect(result.title.admin.readOnly).toBe(true);
  });
});
```

#### packages/react/src/components/fields/index.tsx

3 edits.

**1 — the `react` import loses `ComponentPropsWithRef` (only used by the removed `RenderFieldInputComponents`); anchored at the top import block.**

```ts
import { ComponentType } from "react";
```

**2 — delete `RenderFieldInputComponents` in its entirety (its JSDoc through its closing `}`), and the now-unused `import { cn } from "../../styles/utils";` line above it — superseded by `RenderFields`.**

**3 — `getCollectionColumnDefs`'s loop skips an `admin.hidden` field; anchored at `for (const [fieldKey, fieldDef] of Object.entries(collection.fields))`. Docblock above it updated to mention the exclusion.**

```ts
 * Iterates the collection's `fields` map and delegates to the appropriate
 * `*FieldToColumnDef` helper based on `fieldDef.type`. An `admin.hidden`
 * field, and one with an unrecognised type, are both skipped. The resulting
 * array is ready to pass directly to `useReactTable({ columns })`.
 ...
  for (const [fieldKey, fieldDef] of Object.entries(collection.fields)) {
    if (fieldDef.admin.hidden) continue;
    const isTitleField = fieldKey === collection.admin.useAsTitle;
    const fieldType: AdminFieldType = fieldDef.type;
```

#### packages/react/src/components/fields/index.test.tsx

1 edit — new `describe("getCollectionColumnDefs", …)` block appended after the existing `describe("react field registries", …)` block.

```ts
import { describe, it, expect } from "vitest";
import { ADMIN_FIELDS, defineCollection, text } from "@vexcms/core";

import { fieldInputComponents, fieldCellComponents, getCollectionColumnDefs } from "./index";
import { reactAdapter } from "../../adapter";
```

```ts
describe("getCollectionColumnDefs", () => {
  it("excludes an admin.hidden field from the list view's columns", () => {
    const collection = defineCollection({
      slug: "hidden_column_test",
      timestamps: false,
      fields: {
        title: text({ label: "Title" }),
        secret: text({ label: "Secret", admin: { hidden: true } }),
      },
    });
    const columns = getCollectionColumnDefs({ collection });
    expect(columns.map((column) => column.id)).toEqual(["title"]);
  });
});
```

#### packages/react/src/components/form/FormGroup.tsx

2 edits.

**1 — swap the `fieldToInputComponent` import for `RenderFields`; anchored at the `import { fieldToInputComponent } from "../fields";` line.**

```ts
import { RenderFields } from "./RenderFields";
```

**2 — the sub-field loop inside `<AccordionContent>` becomes one `RenderFields` call; anchored at the `{/* Content — all sub-fields */}` comment through the matching `</AccordionContent>`.**

```tsx
        {/* Content — all sub-fields */}
        <AccordionContent className="px-3 pt-3">
          <RenderFields
            fields={fieldDef.fields}
            collection={collection}
            namePrefix={name}
            readOnly={readOnly}
          />
        </AccordionContent>
```

Docblock updated to match (anchored at the "Maps over `fieldDef.fields`" paragraph):

```
 * Maps over `fieldDef.fields` via `RenderFields`, dot-prefixed with `name`
 * (e.g. `"seo.title"`) — TanStack Form v1 resolves dot-notation to nested
 * object values without any special mode.
```

#### packages/react/src/components/form/FormBlocks.tsx

2 edits.

**1 — swap the `fieldToInputComponent` import for `RenderFields`; anchored at `import { fieldToInputComponent } from "../fields";`.**

```ts
import { RenderFields } from "./RenderFields";
```

**2 — the per-block sub-field loop inside `<AccordionContent>` becomes one `RenderFields` call, keeping the "no configurable fields" empty state; anchored at `{/* Sub-fields content */}` through the matching `</AccordionContent>`.**

```tsx
                    {/* Sub-fields content */}
                    <AccordionContent className="px-3 pt-3">
                      <div className="flex flex-col gap-4 pt-3">
                        {subFields.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">
                            This block has no configurable fields.
                          </p>
                        ) : (
                          <RenderFields
                            fields={blockDef.fields}
                            collection={collection}
                            namePrefix={`${name}[${index}]`}
                            readOnly={readOnly}
                          />
                        )}
                      </div>
                    </AccordionContent>
```

(`const subFields = Object.entries(blockDef.fields);` — unchanged, still drives the empty-state check.)

#### packages/react/src/components/modals/CreateDocumentModal.tsx

2 edits.

**1 — swap the `RenderFieldInputComponents` import for `RenderFields`; anchored at `import { RenderFieldInputComponents } from "../fields";`. Docblock's one mention updated alongside.**

```ts
import { RenderFields } from "../form/RenderFields";
```

```
 * Builds a TanStack Form instance via `useFieldsForm`, renders only the
 * collection's required fields with `<RenderFields>` — a quick
```

**2 — the form body swaps the component; anchored at `<RenderFieldInputComponents` through its closing `/>`.**

```tsx
            <RenderFields fields={collection.fields} collection={collection} fieldKeys={fieldKeys} />
```

#### packages/react/src/components/views/CollectionEditView.tsx

4 edits.

**1 — import block: drop `isFieldAllowed` and `fieldToInputComponent`; add `RenderFields`/`findErroredTabLabel`/`DocumentTimestamps`/`applyFieldPermissionReadOnly`/`matchesFieldNamePrefix`/`FORM_URL_PARAMS`/nuqs; anchored at the top `import { … } from "@vexcms/core";` block through the `import { fieldToInputComponent } from "../fields";` line.**

```ts
import {
  CONSTRAINT_COMPARATORS,
  CRUD_ACTIONS,
  DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE,
  DRAFT_ACTIONS,
  getFieldsDefaultValues,
  resolveLivePreviewSettings,
  VERSION_STATUSES,
  vexConvexApi,
} from "@vexcms/core";
import type {
  CollectionConfig,
  CollectionEditViewProps,
  CollectionSlug,
  VexDocument,
} from "@vexcms/core";
import { AppForm } from "../form/AppForm";
import { RevalidateButton } from "../RevalidateButton";
import { Button } from "../ui";
import { findErroredTabLabel, RenderFields } from "../form/RenderFields";
import { DocumentTimestamps } from "../form/DocumentTimestamps";
import { applyFieldPermissionReadOnly } from "../form/applyFieldPermissionReadOnly";
import { matchesFieldNamePrefix } from "../../hooks/useFieldErrorCount";
import { FORM_URL_PARAMS } from "../form/constants";
import { parseAsString, useQueryState } from "nuqs";
import { useFieldsForm } from "../../hooks/useFieldsForm";
```

**2 — `useFieldsForm` gains a `?tab=` setter above it and an `onSubmitInvalid` handler; anchored at `const readableFieldKeys = visibleFields.map(([fieldKey]) => fieldKey);` through the `useFieldsForm({ … })` call's closing `});`.**

```tsx
  const readableFieldKeys = visibleFields.map(([fieldKey]) => fieldKey);

  const [, setErroredTab] = useQueryState(FORM_URL_PARAMS.tab, parseAsString);

  const form = useFieldsForm({
    document: formDocument,
    fields: collection.fields,
    readableFieldKeys,
    onSubmit: async () => {
      const changes = changedValues(form);
      if (Object.keys(changes).length === 0) return;
      await mutateAsync({
        id: currentDocument._id,
        collection: collection.slug,
        data: changes,
      });
      resetWhenSaved(changes);
    },
    onSubmitInvalid: () => {
      const erroredPaths = Object.entries(form.state.fieldMeta)
        .filter(([, meta]) => meta && meta.errors.length > 0)
        .map(([path]) => path);
      const label = findErroredTabLabel({
        fields: collection.fields,
        hasError: (name) => erroredPaths.some((path) => matchesFieldNamePrefix(path, [name])),
      });
      if (label) void setErroredTab(label);
    },
  });
```

**3 — `formContent` becomes the main/sidebar two-column layout; anchored at `const formContent = (` through its closing `);` (the old per-field `.map` loop is fully replaced).**

```tsx
  const hasSidebarFields = Object.values(collection.fields).some(
    (fieldDef) => fieldDef.admin.position === "sidebar",
  );
  const showSidebar = hasSidebarFields || currentDocument._creationTime !== undefined;
  const documentStatus = isVersioned
    ? isDraftDoc
      ? VERSION_STATUSES.draft.key
      : VERSION_STATUSES.published.key
    : undefined;
  const renderedFields = applyFieldPermissionReadOnly({ fields: collection.fields, fieldPermissions });

  const formContent = (
    <div className={showSidebar ? "flex flex-wrap gap-6" : undefined}>
      <div className="min-w-0 flex-1">
        <RenderFields
          fields={renderedFields}
          collection={collection}
          readOnly={!canEdit}
          documentStatus={documentStatus}
          fieldKeys={readableFieldKeys}
          region={showSidebar ? "main" : "all"}
          isTopLevel
        />
      </div>
      {showSidebar && (
        <div className="w-full space-y-4 sm:w-72 sm:shrink-0">
          <DocumentTimestamps creationTime={currentDocument._creationTime} />
          <RenderFields
            fields={renderedFields}
            collection={collection}
            readOnly={!canEdit}
            documentStatus={documentStatus}
            fieldKeys={readableFieldKeys}
            region="sidebar"
            isTopLevel
          />
        </div>
      )}
    </div>
  );
```

**4 — `visibleFields`/`readableFieldKeys` (declared just above edit 2) are unchanged; only their old consumer (the per-field `.map`) moved. No further edits needed elsewhere in the file.**

#### packages/react/src/components/views/GlobalEditView.tsx

3 edits — the same shape as `CollectionEditView`, adapted to globals (`globalDoc` may be `undefined` before the first save; `global` replaces `collection`).

**1 — import block: drop `isFieldAllowed` and `fieldToInputComponent`; add the same new imports; anchored at the top `import { … } from "@vexcms/core";` block through `import { fieldToInputComponent } from "../fields";`.**

```ts
import {
  CONSTRAINT_COMPARATORS,
  CRUD_ACTIONS,
  DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE,
  DRAFT_ACTIONS,
  getFieldsDefaultValues,
  GlobalEditViewProps,
  resolveLivePreviewSettings,
  vexConvexApi,
} from "@vexcms/core";
import { AppForm } from "../form";
import {
  useAutosave,
  useFieldPermissions,
  useFieldsForm,
  useLiveFieldMerge,
  usePermission,
  useResetWhenSaved,
  useVexMutation,
  useVisibleFields,
} from "../../hooks";
import { changedValues } from "../form/changedValues";
import { pickReadableValues } from "../form/readableFields";
import { Button } from "../ui";
import { findErroredTabLabel, RenderFields } from "../form/RenderFields";
import { DocumentTimestamps } from "../form/DocumentTimestamps";
import { applyFieldPermissionReadOnly } from "../form/applyFieldPermissionReadOnly";
import { matchesFieldNamePrefix } from "../../hooks/useFieldErrorCount";
import { FORM_URL_PARAMS } from "../form/constants";
import { parseAsString, useQueryState } from "nuqs";
```

**2 — `useFieldsForm` gains the same `?tab=` setter and `onSubmitInvalid`; anchored at `const readableFieldKeys = visibleFields.map(([fieldKey]) => fieldKey);` through the `useFieldsForm<Record<string, unknown>>({ … })` call's closing `});`.**

```tsx
  const readableFieldKeys = visibleFields.map(([fieldKey]) => fieldKey);

  const [, setErroredTab] = useQueryState(FORM_URL_PARAMS.tab, parseAsString);

  const form = useFieldsForm<Record<string, unknown>>({
    document: formDocument,
    fields: global.fields,
    readableFieldKeys,
    onSubmit: async ({ value }) => {
      // A global has no separate create view: before the first save,
      // `globalDoc` is undefined and `value` carries the field defaults,
      // which a diff (built against those same defaults) would omit.
      if (!globalDoc) {
        await mutateAsync({ slug: global.slug, data: value });
        form.reset();
        return;
      }
      const changes = changedValues(form);
      if (Object.keys(changes).length === 0) return;
      await mutateAsync({ slug: global.slug, data: changes });
      resetWhenSaved(changes);
    },
    onSubmitInvalid: () => {
      const erroredPaths = Object.entries(form.state.fieldMeta)
        .filter(([, meta]) => meta && meta.errors.length > 0)
        .map(([path]) => path);
      const label = findErroredTabLabel({
        fields: global.fields,
        hasError: (name) => erroredPaths.some((path) => matchesFieldNamePrefix(path, [name])),
      });
      if (label) void setErroredTab(label);
    },
  });
```

**3 — `formContent` becomes the main/sidebar two-column layout; anchored at `const formContent = (` through its closing `);`. `showSidebar` falls back to `globalDoc !== undefined` (a global has no timestamps before its first save) instead of `CollectionEditView`'s always-true `_creationTime` check.**

```tsx
  const hasSidebarFields = Object.values(global.fields).some(
    (fieldDef) => fieldDef.admin.position === "sidebar",
  );
  const showSidebar = hasSidebarFields || globalDoc !== undefined;
  const documentStatus =
    hasDrafts && globalDoc ? (isDraftDoc ? "draft" : "published") : undefined;
  const renderedFields = applyFieldPermissionReadOnly({ fields: global.fields, fieldPermissions });

  const formContent = (
    <div className={showSidebar ? "flex flex-wrap gap-6" : undefined}>
      <div className="min-w-0 flex-1">
        <RenderFields
          fields={renderedFields}
          collection={global}
          readOnly={!canEdit}
          documentStatus={documentStatus}
          fieldKeys={readableFieldKeys}
          region={showSidebar ? "main" : "all"}
          isTopLevel
        />
      </div>
      {showSidebar && (
        <div className="w-full space-y-4 sm:w-72 sm:shrink-0">
          <DocumentTimestamps creationTime={globalDoc?._creationTime} />
          <RenderFields
            fields={renderedFields}
            collection={global}
            readOnly={!canEdit}
            documentStatus={documentStatus}
            fieldKeys={readableFieldKeys}
            region="sidebar"
            isTopLevel
          />
        </div>
      )}
    </div>
  );
```

#### packages/react/src/components/views/MediaCollectionEditView.tsx

2 edits.

**1 — import block: drop `isFieldAllowed` and `fieldToInputComponent`; add `RenderFields`/`applyFieldPermissionReadOnly`; anchored at the top `import { CRUD_ACTIONS, isFieldAllowed, vexConvexApi } from "@vexcms/core";` line through `import { fieldToInputComponent } from "../fields";`.**

```ts
import { CRUD_ACTIONS, vexConvexApi } from "@vexcms/core";
import type { MediaCollectionConfig, MediaCollectionSlug, VexMediaDocument } from "@vexcms/core";
import { AppForm } from "../form/AppForm";
import { Button } from "../ui";
import { RenderFields } from "../form/RenderFields";
import { applyFieldPermissionReadOnly } from "../form/applyFieldPermissionReadOnly";
```

**2 — the field loop (with its manual `admin.hidden` filter, now redundant) becomes one `RenderFields` call; anchored at `<div className="space-y-4">` through its matching `</div>`.**

```tsx
      <div className="space-y-4">
        <RenderFields
          fields={applyFieldPermissionReadOnly({ fields: collection.fields, fieldPermissions })}
          collection={collection}
          readOnly={!canEdit}
          fieldKeys={readableFieldKeys}
        />
      </div>
```

#### packages/react/src/components/fields/select/Input.tsx

1 edit — stale doc reference; anchored at "Fields are rendered generically by".

```
 * Fields are rendered generically by `RenderFields`, so there is
```

#### packages/react/src/hooks/useModalSurface.tsx

1 edit — stale doc reference; anchored at "Fields are rendered generically by".

```
 * Fields are rendered generically by `RenderFields`, which has
```

#### packages/react/src/hooks/useModalSurface.test.tsx

1 edit — stale doc reference; anchored at "Fields are rendered generically by".

```
 * Fields are rendered generically by `RenderFields`, so a select
```

Verify: pnpm typecheck && pnpm --filter @vexcms/react test -- form views

### Step 10 — React conditions + condition-aware client validation [agent]

- [ ] `packages/react/src/hooks/useFieldCondition.ts` + `useFieldCondition.test.tsx` — `useFieldCondition` (subscribes to the form store only when `admin.condition` is set), plus `isFieldLayoutNodeVisible`/`useFieldLayoutNodeVisible` (frame-level "any descendant visible" check)
- [ ] `packages/react/src/hooks/index.ts` — barrel export
- [ ] `packages/react/src/components/form/FieldConditionGate.tsx` — the per-field wrapper `renderFieldLayoutNode` mounts around every `"field"` node
- [ ] `packages/react/src/components/form/index.ts` — barrel export
- [ ] `packages/react/src/components/form/RenderFields.tsx` + test — `renderFieldLayoutNode`'s `"field"` branch gates its input through `FieldConditionGate`
- [ ] `packages/react/src/components/form/FormTabs.tsx`, `FormCollapsible.tsx`, `FormRow.tsx` + tests — each renders `null` when `useFieldLayoutNodeVisible` finds no visible descendant
- [ ] `packages/react/src/hooks/useFieldsForm.ts` + `useFieldsForm.test.ts` — validators rebuild the input schema from current values when `hasFieldConditions`

Why: hide fields reactively without re-rendering the whole form on every
keystroke; client Zod must match the server's Step 7 rule (a condition-hidden
required field never blocks submit, on either side).

Step 9 (`local://g-step-09.md`) is the renderer this step wires conditions
into. Every nesting level — `RenderFields` itself, `FormTabs`,
`FormCollapsible`, `FormRow` — renders a `"field"` node through the SAME
shared function, `renderFieldLayoutNode` (exported from `RenderFields.tsx`),
so gating that one function's `"field"` branch covers every depth in a single
edit. The three frame components each get their own one-line visibility
guard, since "hidden when every descendant is hidden" is a per-frame decision
`renderFieldLayoutNode` has no reason to make on their behalf.

#### `packages/react/src/hooks/useFieldCondition.ts`

New file.

```ts
"use client";

import { getBy, useStore } from "@tanstack/react-form";
import { type AdminField, type FieldLayoutNode, isFieldConditionMet } from "@vexcms/core";
import { useAppForm } from "../components/form/AppFormContext";

function getParentPath(name: string): string | undefined {
  const lastDotIndex = name.lastIndexOf(".");
  return lastDotIndex === -1 ? undefined : name.slice(0, lastDotIndex);
}

function siblingDataAt(props: { data: Record<string, unknown>; name: string }): Record<string, unknown> {
  const parentPath = getParentPath(props.name);
  return (parentPath === undefined ? props.data : getBy(props.data, parentPath)) as Record<
    string,
    unknown
  >;
}

/**
 * Whether a field should render, given its `admin.condition`.
 *
 * Reads the form store only when `field.admin.condition` is set — the
 * selector is a cheap `() => true` constant otherwise, so an unconditioned
 * field never re-renders on form changes it has no stake in. `useStore`
 * itself is still called on every render regardless (Rules of Hooks forbid a
 * conditional hook call); only the selector's work is conditional.
 *
 * `siblingData` is the value at `name`'s parent path: `layout[2].title`
 * resolves siblings from `layout[2]`, `seo.title` from `seo`, and a
 * top-level name (no `.`) from the form's whole values — matching
 * `FieldConditionProps`.
 *
 * @param props.field - The field whose `admin.condition` is evaluated.
 * @param props.name - The field's full TanStack Form path.
 * @returns `true` when there is no condition, the condition throws, or it
 *   evaluates truthy; `false` only on a clean falsy result
 *   (`isFieldConditionMet`).
 */
export function useFieldCondition(props: { field: AdminField; name: string }): boolean {
  const form = useAppForm();
  const condition = props.field.admin.condition;

  return useStore(form.store, (state) =>
    condition === undefined
      ? true
      : isFieldConditionMet({
          field: props.field,
          data: state.values as Record<string, unknown>,
          siblingData: siblingDataAt({
            data: state.values as Record<string, unknown>,
            name: props.name,
          }),
        }),
  );
}

/**
 * Whether ANY field inside a layout node is currently visible — the pure,
 * non-hook half of `useFieldLayoutNodeVisible`, kept separate so a frame's
 * whole subtree is checked in one pass instead of one `useFieldCondition`
 * call per leaf (which would vary the hook call count across renders as
 * array/blocks items are added or removed).
 *
 * A `"field"` node is visible when its own condition is met. A frame node
 * (`"tabs"`/`"collapsible"`/`"row"`) is visible when at least one descendant
 * field is — `"tabs"` recurses through every tab's children, not just the
 * active one, so switching tabs never changes a hidden group's visibility.
 *
 * @param props.node - The layout node to check.
 * @param props.namePrefix - The dotted/bracketed path `node` was reached
 *   through, matching `RenderFields`'s own `namePrefix` convention.
 * @param props.data - The form's current values.
 * @returns `false` only when every descendant field's condition is met-false.
 */
export function isFieldLayoutNodeVisible(props: {
  node: FieldLayoutNode;
  namePrefix: string | undefined;
  data: Record<string, unknown>;
}): boolean {
  const { node, namePrefix, data } = props;

  if (node.kind === "field") {
    const name = namePrefix ? `${namePrefix}.${node.key}` : node.key;
    return isFieldConditionMet({
      field: node.field,
      data,
      siblingData: siblingDataAt({ data, name }),
    });
  }

  if (node.kind === "tabs") {
    return node.tabs.some((tab) =>
      tab.children.some((child) => isFieldLayoutNodeVisible({ node: child, namePrefix, data })),
    );
  }

  return node.children.some((child) => isFieldLayoutNodeVisible({ node: child, namePrefix, data }));
}

/**
 * Hook wrapper around `isFieldLayoutNodeVisible` — one `useStore` call per
 * frame component (`FormTabs`/`FormCollapsible`/`FormRow`), called
 * unconditionally once per mounted frame so the variable-descendant-count
 * problem `isFieldLayoutNodeVisible` exists to solve never reaches a hook
 * call site.
 *
 * @param props.node - The layout node (normally a frame) to check.
 * @param props.namePrefix - See `isFieldLayoutNodeVisible`.
 * @returns `false` when the node has no visible descendant field.
 */
export function useFieldLayoutNodeVisible(props: { node: FieldLayoutNode; namePrefix?: string }): boolean {
  const form = useAppForm();
  return useStore(form.store, (state) =>
    isFieldLayoutNodeVisible({
      node: props.node,
      namePrefix: props.namePrefix,
      data: state.values as Record<string, unknown>,
    }),
  );
}
```

#### `packages/react/src/hooks/useFieldCondition.test.tsx`

New file.

```tsx
import { act, renderHook } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { type AdminField, type FieldLayoutNode, text } from "@vexcms/core";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { isFieldLayoutNodeVisible, useFieldCondition } from "./useFieldCondition";
import { AppForm } from "../components/form/AppForm";
import type { AnyFormApi } from "../components/form/AppFormContext";

function renderCondition(props: {
  field: AdminField;
  name: string;
  defaultValues: Record<string, unknown>;
}) {
  let form: AnyFormApi | undefined;

  function Wrapper(wrapperProps: { children: ReactNode }) {
    const f = useForm({ defaultValues: props.defaultValues });
    form = f as AnyFormApi;
    return <AppForm form={f}>{wrapperProps.children}</AppForm>;
  }

  const { result } = renderHook(
    () => useFieldCondition({ field: props.field, name: props.name }),
    { wrapper: Wrapper },
  );

  return { result, getForm: (): AnyFormApi => form! };
}

describe("useFieldCondition", () => {
  it("returns true for a field with no condition", () => {
    const { result } = renderCondition({
      field: text(),
      name: "title",
      defaultValues: { title: "" },
    });
    expect(result.current).toBe(true);
  });

  it("returns true when the condition evaluates truthy", () => {
    const field = text({ admin: { condition: ({ data }) => data.enabled === true } });
    const { result } = renderCondition({
      field,
      name: "secret",
      defaultValues: { enabled: true, secret: "" },
    });
    expect(result.current).toBe(true);
  });

  it("returns false when the condition evaluates falsy", () => {
    const field = text({ admin: { condition: ({ data }) => data.enabled === true } });
    const { result } = renderCondition({
      field,
      name: "secret",
      defaultValues: { enabled: false, secret: "" },
    });
    expect(result.current).toBe(false);
  });

  it("re-evaluates when the form store updates", () => {
    const field = text({ admin: { condition: ({ data }) => data.enabled === true } });
    const { result, getForm } = renderCondition({
      field,
      name: "secret",
      defaultValues: { enabled: false, secret: "" },
    });
    expect(result.current).toBe(false);

    act(() => {
      getForm().setFieldValue("enabled", true);
    });

    expect(result.current).toBe(true);
  });

  it("resolves siblingData from the parent path for a nested name (`seo.title`)", () => {
    const field = text({
      admin: { condition: ({ siblingData }) => siblingData.showTitle === true },
    });
    const { result } = renderCondition({
      field,
      name: "seo.title",
      defaultValues: { seo: { showTitle: true, title: "" } },
    });
    expect(result.current).toBe(true);
  });

  it("uses the whole form values as siblingData for a top-level name", () => {
    const field = text({
      admin: { condition: ({ siblingData }) => siblingData.enabled === true },
    });
    const { result } = renderCondition({
      field,
      name: "enabled",
      defaultValues: { enabled: true },
    });
    expect(result.current).toBe(true);
  });

  it("resolves an array-item parent path (`layout[2].title`)", () => {
    const field = text({
      admin: { condition: ({ siblingData }) => siblingData.kind === "hero" },
    });
    const { result } = renderCondition({
      field,
      name: "layout[2].title",
      defaultValues: {
        layout: [{ kind: "text" }, { kind: "text" }, { kind: "hero", title: "" }],
      },
    });
    expect(result.current).toBe(true);
  });

  it("counts a throwing condition as met", () => {
    const field = text({
      admin: {
        condition: () => {
          throw new Error("boom");
        },
      },
    });
    const { result } = renderCondition({ field, name: "secret", defaultValues: { secret: "" } });
    expect(result.current).toBe(true);
  });
});

describe("isFieldLayoutNodeVisible", () => {
  const data = { enabled: false };

  it("is visible for a field node with no condition", () => {
    const node: FieldLayoutNode = { kind: "field", key: "title", field: text() };
    expect(isFieldLayoutNodeVisible({ node, namePrefix: undefined, data })).toBe(true);
  });

  it("is hidden for a field node whose condition is unmet", () => {
    const field = text({ admin: { condition: ({ data: d }) => d.enabled === true } });
    const node: FieldLayoutNode = { kind: "field", key: "secret", field };
    expect(isFieldLayoutNodeVisible({ node, namePrefix: undefined, data })).toBe(false);
  });

  it("is hidden for a row whose only child is condition-hidden", () => {
    const field = text({ admin: { condition: ({ data: d }) => d.enabled === true } });
    const node: FieldLayoutNode = {
      kind: "row",
      id: "row:secret",
      children: [{ kind: "field", key: "secret", field }],
    };
    expect(isFieldLayoutNodeVisible({ node, namePrefix: undefined, data })).toBe(false);
  });

  it("is visible for a row with at least one visible child", () => {
    const hiddenField = text({ admin: { condition: ({ data: d }) => d.enabled === true } });
    const node: FieldLayoutNode = {
      kind: "row",
      id: "row:mixed",
      children: [
        { kind: "field", key: "secret", field: hiddenField },
        { kind: "field", key: "title", field: text() },
      ],
    };
    expect(isFieldLayoutNodeVisible({ node, namePrefix: undefined, data })).toBe(true);
  });

  it("is visible for tabs when a non-active tab still has a visible child", () => {
    const hiddenField = text({ admin: { condition: ({ data: d }) => d.enabled === true } });
    const node: FieldLayoutNode = {
      kind: "tabs",
      id: "tabs:secret",
      tabs: [
        { label: "general", children: [{ kind: "field", key: "secret", field: hiddenField }] },
        { label: "advanced", children: [{ kind: "field", key: "title", field: text() }] },
      ],
    };
    expect(isFieldLayoutNodeVisible({ node, namePrefix: undefined, data })).toBe(true);
  });

  it("is hidden for tabs when every tab's every field is condition-hidden", () => {
    const hiddenField = text({ admin: { condition: ({ data: d }) => d.enabled === true } });
    const node: FieldLayoutNode = {
      kind: "tabs",
      id: "tabs:secret",
      tabs: [{ label: "general", children: [{ kind: "field", key: "secret", field: hiddenField }] }],
    };
    expect(isFieldLayoutNodeVisible({ node, namePrefix: undefined, data })).toBe(false);
  });
});
```

#### `packages/react/src/hooks/index.ts`

1 edit — everything else unchanged.

**1 — barrel export.** Add next to the other hook exports:

```ts
export * from "./useFieldCondition";
```

#### `packages/react/src/components/form/FieldConditionGate.tsx`

New file.

```tsx
"use client";

import type { ReactNode } from "react";
import type { AdminField } from "@vexcms/core";
import { useFieldCondition } from "../../hooks/useFieldCondition";

/**
 * Renders `children` only while `field`'s `admin.condition` is met.
 *
 * This is the one-hook-call-per-field boundary `renderFieldLayoutNode` wraps
 * each `"field"` layout node's rendered input in: `useFieldCondition` must
 * run the same number of times on every render, which a bare loop over a
 * field map cannot guarantee once the field count itself can change
 * (array/blocks items added or removed). One `FieldConditionGate` instance
 * per field node keeps the call count pinned to "one per mounted node" — the
 * same shape TanStack's own `<form.Field>` uses.
 *
 * A hidden field's value is left untouched in form state; only its rendered
 * input unmounts.
 *
 * @param props.field - The field whose `admin.condition` gates `children`.
 * @param props.name - The field's full TanStack Form path.
 * @param props.children - The field's rendered input (label, control, error).
 * @returns `children`, or `null` while the condition is unmet.
 */
export function FieldConditionGate(props: {
  field: AdminField;
  name: string;
  children: ReactNode;
}): ReactNode {
  const visible = useFieldCondition({ field: props.field, name: props.name });
  return visible ? props.children : null;
}
```

#### `packages/react/src/components/form/index.ts`

1 edit — everything else unchanged.

**1 — barrel export.** Add next to the other form component exports:

```ts
export * from "./FieldConditionGate";
```

#### `packages/react/src/components/form/RenderFields.tsx`

Builds on Step 9's file (`local://g-step-09.md`) — 2 edits; everything else
unchanged.

**1 — import.** Add after `import { FormRow } from "./FormRow";`:

```tsx
import { FieldConditionGate } from "./FieldConditionGate";
```

**2 — `renderFieldLayoutNode`'s `"field"` branch.** `fieldLayoutNodeName` is
already computed once and reused for both the gate and the input's own
`name`. Replace the function in full:

```tsx
export function renderFieldLayoutNode(node: FieldLayoutNode, context: RenderFieldsContext): ReactNode {
  if (node.kind === "field") {
    const InputComponent = fieldToInputComponent(node.field.type);
    if (!InputComponent) {
      throw new Error(`Missing component for field type '${node.field.type}'`);
    }
    const name = fieldLayoutNodeName(context, node.key);
    return (
      <FieldConditionGate field={node.field} name={name}>
        <InputComponent
          name={name}
          fieldDef={node.field}
          readOnly={Boolean(context.readOnly) || node.field.admin.readOnly}
          collection={context.collection}
          documentStatus={context.documentStatus}
        />
      </FieldConditionGate>
    );
  }
  if (node.kind === "tabs") {
    return <FormTabs node={node} context={context} useUrlState={node.id === context.urlTabsId} />;
  }
  if (node.kind === "collapsible") {
    return <FormCollapsible node={node} context={context} />;
  }
  return <FormRow node={node} context={context} />;
}
```

#### `packages/react/src/components/form/RenderFields.test.tsx`

1 edit — add one `it` inside the existing `describe("RenderFields", ...)`
block, after the last test (`"renders a row() group via FormRow"`); every
import it needs (`useForm`, `AppForm`, `NuqsTestingAdapter`, `text`,
`RenderFields`, `userEvent`, `baseCollection`, `render`, `screen`) is already
imported by Step 9's file.

```tsx
  it("hides and reactively shows a field whose admin.condition depends on a sibling", async () => {
    const user = userEvent.setup();
    function ConditionHarness() {
      const form = useForm({ defaultValues: { enabled: false, secret: "" } });
      return (
        <NuqsTestingAdapter hasMemory>
          <AppForm form={form}>
            <RenderFields
              fields={{
                secret: text({
                  label: "Secret",
                  admin: { condition: ({ data }) => data.enabled === true },
                }),
              }}
              collection={baseCollection}
            />
            <button type="button" onClick={() => form.setFieldValue("enabled", true)}>
              Enable
            </button>
          </AppForm>
        </NuqsTestingAdapter>
      );
    }
    render(<ConditionHarness />);
    expect(screen.queryByLabelText("Secret")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Enable" }));
    expect(screen.getByLabelText("Secret")).toBeInTheDocument();
  });
```

#### `packages/react/src/components/form/FormTabs.tsx`

1 edit — everything else unchanged.

**1 — visibility guard.** Add the import next to the other `"./RenderFields"`
import, and replace the function in full:

```tsx
import { useFieldLayoutNodeVisible } from "../../hooks/useFieldCondition";
```

```tsx
export function FormTabs(props: {
  node: TabsLayoutNode;
  context: RenderFieldsContext;
  useUrlState: boolean;
}) {
  const { node, context, useUrlState } = props;
  const firstLabel = node.tabs[0]?.label ?? "";

  const [urlTab, setUrlTab] = useQueryState(
    FORM_URL_PARAMS.tab,
    parseAsString.withDefault(firstLabel),
  );
  const [localTab, setLocalTab] = useState(firstLabel);
  const activeTab = useUrlState ? urlTab : localTab;
  const visible = useFieldLayoutNodeVisible({ node, namePrefix: context.namePrefix });

  if (!visible) return null;

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        if (useUrlState) void setUrlTab(value as string);
        else setLocalTab(value as string);
      }}
    >
      <TabsList>
        {node.tabs.map((tab) => (
          <FormTabsTrigger key={tab.label} tab={tab} context={context} />
        ))}
      </TabsList>
      {node.tabs.map((tab) => (
        <TabsContent key={tab.label} value={tab.label}>
          <div className="flex flex-wrap gap-4">
            {tab.children.map((child) => (
              <FieldLayoutItem
                key={child.kind === "field" ? child.key : child.id}
                width={fieldLayoutNodeWidth(child)}
              >
                {renderFieldLayoutNode(child, context)}
              </FieldLayoutItem>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
```

#### `packages/react/src/components/form/FormTabs.test.tsx`

1 edit — add one `it` inside `describe("FormTabs", ...)`, after the last test
(the error-count badge test); uses only `buildTabsNode`/`renderHarness`,
already defined in Step 9's file.

```tsx
  it("renders nothing when every field across every tab is condition-hidden", () => {
    const node = buildTabsNode({
      general: {
        secret: text({ admin: { condition: ({ data }) => data.enabled === true } }),
      },
    });
    renderHarness({ node, useUrlState: false, defaultValues: { enabled: false, secret: "" } });
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
  });
```

#### `packages/react/src/components/form/FormCollapsible.tsx`

1 edit — everything else unchanged.

**1 — visibility guard.** Add the import next to the `useFieldErrorCount`
import, and replace the function in full:

```tsx
import { useFieldLayoutNodeVisible } from "../../hooks/useFieldCondition";
```

```tsx
export function FormCollapsible(props: { node: CollapsibleLayoutNode; context: RenderFieldsContext }) {
  const { node, context } = props;
  const [openIds, setOpenIds] = useState<string[]>(node.defaultCollapsed ? [] : [node.id]);
  const isOpen = openIds.includes(node.id);
  const errorCount = useFieldErrorCount({
    names: collectFieldLayoutNames(node.children, context.namePrefix),
  });
  const visible = useFieldLayoutNodeVisible({ node, namePrefix: context.namePrefix });

  if (!visible) return null;

  return (
    <Accordion value={openIds} onValueChange={setOpenIds} className="rounded-sm border-2 border-border">
      <AccordionItem value={node.id}>
        <AccordionTrigger className="gap-2 px-3 text-sm font-medium hover:no-underline">
          {node.label}
          {!isOpen && errorCount > 0 && <Badge variant="destructive">{errorCount}</Badge>}
        </AccordionTrigger>
        <AccordionContent className="px-3">
          <div className="flex flex-wrap gap-4">
            {node.children.map((child) => (
              <FieldLayoutItem
                key={child.kind === "field" ? child.key : child.id}
                width={fieldLayoutNodeWidth(child)}
              >
                {renderFieldLayoutNode(child, context)}
              </FieldLayoutItem>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

#### `packages/react/src/components/form/FormCollapsible.test.tsx`

1 edit — add one `it` inside `describe("FormCollapsible", ...)`, after the
last test (`"hides the error-count badge once opened"`); uses only
`buildCollapsibleNode`/`renderHarness`, already defined in Step 9's file.

```tsx
  it("renders nothing (not even its label) when every sub-field is condition-hidden", () => {
    const node = buildCollapsibleNode({
      label: "Details",
      fields: { secret: text({ admin: { condition: ({ data }) => data.enabled === true } }) },
    });
    renderHarness({ node, defaultValues: { enabled: false, secret: "" } });
    expect(screen.queryByText("Details")).not.toBeInTheDocument();
  });
```

#### `packages/react/src/components/form/FormRow.tsx`

1 edit — everything else unchanged.

**1 — visibility guard.** Add the import next to the `"./RenderFields"`
import, and replace the function in full:

```tsx
import { useFieldLayoutNodeVisible } from "../../hooks/useFieldCondition";
```

```tsx
export function FormRow(props: { node: RowLayoutNode; context: RenderFieldsContext }) {
  const { node, context } = props;
  const widths = resolveRowWidths({ widths: node.children.map(fieldLayoutNodeWidth) });
  const visible = useFieldLayoutNodeVisible({ node, namePrefix: context.namePrefix });

  if (!visible) return null;

  return (
    <div className="flex flex-wrap gap-4">
      {node.children.map((child, index) => (
        <FieldLayoutItem
          key={child.kind === "field" ? child.key : child.id}
          width={widths[index] ?? "100%"}
        >
          {renderFieldLayoutNode(child, context)}
        </FieldLayoutItem>
      ))}
    </div>
  );
}
```

#### `packages/react/src/components/form/FormRow.test.tsx`

1 edit — add one `it` inside `describe("FormRow", ...)`, after the last test
(the equal-share fallback test). `FormRow` has no chrome of its own besides
the wrapper `<div>`, so this test checks the whole container — not just the
field — to prove the frame-level guard fired rather than only
`FieldConditionGate`. Uses only `buildRowNode`/`baseCollection`, already
defined in Step 9's file; `useForm`, `AppForm`, `FormRow`, `text`, `render`
are already imported.

```tsx
  it("renders nothing (not even its own wrapper) when every child field is condition-hidden", () => {
    const node = buildRowNode({
      secret: text({ label: "Secret", admin: { condition: ({ data }) => data.enabled === true } }),
    });
    function Harness() {
      const form = useForm({ defaultValues: { enabled: false, secret: "" } });
      return (
        <AppForm form={form}>
          <FormRow node={node} context={{ collection: baseCollection }} />
        </AppForm>
      );
    }
    const { container } = render(<Harness />);
    expect(container.querySelector("form")).toBeEmptyDOMElement();
  });
```

#### `packages/react/src/hooks/useFieldsForm.ts`

2 edits — `FieldsFormOptions<TData>` and the JSDoc `@example` block are
unchanged; everything else in this file not shown is unchanged.

**1 — new imports.** Replace the two existing import statements:

```ts
import {
  type FormAsyncValidateOrFn,
  type FormOptions,
  type FormValidateOrFn,
  type StandardSchemaV1,
  standardSchemaValidators,
  useForm,
} from "@tanstack/react-form";
import {
  type AdminField,
  getFieldsDefaultValues,
  getFieldsInputSchema,
  hasFieldConditions,
  type TDocument,
} from "@vexcms/core";
import type { AnyFormApi } from "../components/form/AppFormContext";
import { pickReadableSchema, pickReadableValues } from "../components/form/readableFields";
```

**2 — condition-aware validators.** Replace the `useFieldsForm` function in
full:

```ts
/**
 * Creates a TanStack Form instance driven by a field map.
 *
 * Sets `defaultValues` from the fields' defaults (overlaid with `document`
 * when editing) and wires the fields' Zod input schema as the `onBlur` and
 * `onSubmitAsync` validators. Resource-agnostic: a collection, a global, or
 * any other owner of a field map passes its `fields` (ADR-014).
 *
 * When any field (at any depth) declares `admin.condition`
 * (`hasFieldConditions`), the static schema is replaced by a validator
 * FUNCTION that rebuilds `getFieldsInputSchema({ fields, data: value })` from
 * the form's current values on every blur/submit — mirroring the server's
 * Step 7 rule exactly: a condition-hidden field becomes `z.unknown()`
 * (value kept, unvalidated), so it can never block submission. Forms with no
 * conditioned field keep the original static-schema-as-validator path
 * unchanged (no per-validation rebuild cost).
 *
 * @param props - Hook props.
 * @param props.fields - The field map that drives the form shape.
 * @param props.document - Optional existing document to pre-populate
 *   `defaultValues` when editing.
 * @param props.readableFieldKeys - Field keys the caller may READ when
 *   field-level permissions narrow them. Omit when unrestricted.
 * @returns A TanStack Form instance compatible with `<AppForm>`.
 *
 * @example
 * ```ts
 * // Create mode — defaultValues come from field defaults
 * const form = useFieldsForm({ fields: postsCollection.fields });
 *
 * // Edit mode, with the submitted value typed to the document shape
 * const form = useFieldsForm<Post>({
 *   fields: postsCollection.fields,
 *   document: doc,
 *   onSubmit: async ({ value }) => { await save(value) },
 * });
 * ```
 */
export function useFieldsForm<TData = TDocument>(
  props: {
    fields: Record<string, AdminField>;
    document?: TDocument | Record<string, unknown> | null;
    /**
     * Field keys the caller may READ, when field-level permissions narrow them.
     *
     * A read-denied field is kept out of the form entirely — out of
     * `defaultValues` and out of the validation schema — so it cannot be seen,
     * cannot be submitted, and cannot block submission when it is required.
     * Omit when unrestricted.
     */
    readableFieldKeys?: readonly string[];
  } & FieldsFormOptions<TData>,
): AnyFormApi {
  const { fields, document, validators, readableFieldKeys, ...formOptions } = props;
  // The schema and defaults are both built from the field map at runtime;
  // `TData` is the caller's static description of that same shape, which the
  // compiler cannot connect to the field map's `Record<string, unknown>`.
  const defaultValues = pickReadableValues(
    getFieldsDefaultValues({ fields, document }),
    readableFieldKeys,
  ) as unknown as TData;

  function buildSchema(data?: Record<string, unknown>) {
    return pickReadableSchema(getFieldsInputSchema({ fields, data }), readableFieldKeys);
  }

  let onBlur: FormValidateOrFn<TData>;
  let onSubmitAsync: FormAsyncValidateOrFn<TData>;

  if (hasFieldConditions({ fields })) {
    onBlur = ((validatorProps: { value: TData }) =>
      standardSchemaValidators.validate(
        { value: validatorProps.value, validationSource: "form" },
        buildSchema(validatorProps.value as Record<string, unknown>) as unknown as StandardSchemaV1,
      )) as FormValidateOrFn<TData>;
    onSubmitAsync = ((validatorProps: { value: TData }) =>
      standardSchemaValidators.validateAsync(
        { value: validatorProps.value, validationSource: "form" },
        buildSchema(validatorProps.value as Record<string, unknown>) as unknown as StandardSchemaV1,
      )) as FormAsyncValidateOrFn<TData>;
  } else {
    const schema = buildSchema() as unknown as FormValidateOrFn<TData> & FormAsyncValidateOrFn<TData>;
    onBlur = schema;
    onSubmitAsync = schema;
  }

  return useForm({
    defaultValues,
    ...formOptions,
    validators: {
      onSubmitAsync,
      onBlur,
      ...validators,
    },
  }) as AnyFormApi;
}
```

#### `packages/react/src/hooks/useFieldsForm.test.ts`

New file.

```ts
import { act, renderHook } from "@testing-library/react";
import { checkbox, text } from "@vexcms/core";
import { describe, expect, it, vi } from "vitest";
import { useFieldsForm } from "./useFieldsForm";

describe("useFieldsForm", () => {
  it("blocks submission on a required field with no conditions", async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useFieldsForm({
        fields: { title: text({ required: true }) },
        onSubmit,
      }),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits once the required field is filled, no conditions", async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() =>
      useFieldsForm({
        fields: { title: text({ required: true }) },
        document: { title: "Hello" },
        onSubmit,
      }),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("skips validation on a condition-hidden required field (hasFieldConditions)", async () => {
    const onSubmit = vi.fn();
    const fields = {
      enabled: checkbox(),
      secret: text({
        required: true,
        admin: { condition: ({ data }) => data.enabled === true },
      }),
    };
    const { result } = renderHook(() =>
      useFieldsForm({
        fields,
        document: { enabled: false, secret: "" },
        onSubmit,
      }),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("still validates a condition-visible required field (hasFieldConditions)", async () => {
    const onSubmit = vi.fn();
    const fields = {
      enabled: checkbox(),
      secret: text({
        required: true,
        admin: { condition: ({ data }) => data.enabled === true },
      }),
    };
    const { result } = renderHook(() =>
      useFieldsForm({
        fields,
        document: { enabled: true, secret: "" },
        onSubmit,
      }),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("re-evaluates the condition against the latest value, not a stale snapshot", async () => {
    const onSubmit = vi.fn();
    const fields = {
      enabled: checkbox(),
      secret: text({
        required: true,
        admin: { condition: ({ data }) => data.enabled === true },
      }),
    };
    const { result } = renderHook(() =>
      useFieldsForm({
        fields,
        document: { enabled: false, secret: "" },
        onSubmit,
      }),
    );

    act(() => {
      result.current.setFieldValue("enabled", true);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

Verify: `pnpm --filter @vexcms/react test -- useFieldCondition RenderFields useFieldsForm`

### Step 11 — `usePaginatedSearch` + upload picker fixes [agent]

- [ ] `packages/react/src/hooks/usePaginatedSearch.ts` + `usePaginatedSearch.test.tsx` (new, thin — mirrors `usePaginatedQuery.test.tsx`'s `runHooksSuite({ only: [...] })` one-liner; without it `describePaginatedSearch` in `hooksSuite.tsx` never actually executes) + the describe block itself (in `packages/react/src/testing/hooksSuite.tsx`)
- [ ] `packages/react/src/hooks/index.ts` — export the new hook
- [ ] `packages/react/src/components/fields/upload/utils.ts` (new) — `matchesAcceptPattern` / `fileMatchesAccept`, shared by `EmptyInput` and `usePaginatedSearch`
- [ ] `packages/react/src/components/fields/upload/EmptyInput.tsx` — use the shared util
- [ ] `packages/react/src/components/media/MediaLibaryGrid.tsx` — use `usePaginatedSearch`; real pagination; MIME filter from `accept` + a working Type menu; placeholder fix
- [ ] `packages/react/src/components/media/MediaPicker.tsx` — selection footer copy, upload-tab back handler, pass `accept` to the grid
- [ ] `packages/react/src/components/media/MediaPicker.test.tsx` (new) — covers the two fixed no-ops
- [ ] `packages/react/src/components/fields/upload/FilledInput.tsx` — single-mode Replace; `n/max` counter via `FieldLimit`; stable `Droppable` id
- [ ] `packages/react/src/components/fields/upload/Input.test.tsx` — single-mode Replace regression test
- [ ] `packages/react/src/testing/mediaSuite.tsx` — real-pagination, Type-filter, and placeholder regression tests

Why: shared search/pagination hook both pickers need; fixes dead "Load more", MIME filter TODO, broken placeholder, no-op handlers.

`find`/`search` (`packages/core/src/api/convex.ts`) have no server-side MIME/`where` argument — only `paginationOpts`
(cursor-based `numItems`/`cursor`) and, for `search`, a single `searchField`/`searchIndexName`. Adding a `mimeTypes` arg
to the core validators would touch `packages/core/src/api/**`, which is outside this step's (and this spec's `touches`
list's) scope. `usePaginatedSearch` therefore filters `mimeTypes` **client-side** and keeps requesting further server
pages on its own — via the same `continueCursor` a manual `loadMore()` would use — until a filtered page of `pageSize`
documents is assembled or the server itself runs out of pages (G-10's "client-side filter, load-more-until-filled").

Verify: `pnpm --filter @vexcms/react test -- usePaginatedSearch media fields/upload`

#### packages/react/src/hooks/usePaginatedSearch.ts

```ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useDebounceValue } from "@ts-hooks-kit/core";
import type {
  CollectionConfig,
  MediaCollectionConfig,
  PaginationResult,
  VexDocument,
  VexMediaDocument,
} from "@vexcms/core";
import { vexConvexApi, resolveTitleSearchIndex } from "@vexcms/core";
import { matchesAcceptPattern } from "../components/fields/upload/utils";

/** Props for {@link usePaginatedSearch}. */
export interface UsePaginatedSearchProps {
  /** The target collection (regular or media) to query. */
  collection: CollectionConfig | MediaCollectionConfig;
  /** Raw search text; debounced 200ms before it reaches the query. `""` lists recent documents. */
  query: string;
  /** Documents per server page / per `loadMore()` call. @default 24 */
  pageSize?: number;
  /** Whether the underlying query should run at all. @default true */
  enabled?: boolean;
  /** Include draft versions of versioned documents. */
  drafts?: boolean;
  /**
   * Media-only accept patterns (`image/*`, `.pdf`, `application/pdf`) every
   * returned document must match. `find`/`search` have no server-side MIME
   * filter, so each server page is filtered client-side and the hook keeps
   * requesting further server pages on its own until a filtered page of
   * `pageSize` documents is assembled or the server itself runs out of
   * pages.
   */
  mimeTypes?: string[];
}

/** Return value of {@link usePaginatedSearch}. */
export interface UsePaginatedSearchReturn<TDocument extends VexDocument = VexDocument> {
  /** Documents accumulated across the current query and every `loadMore()`/auto-fill page. */
  documents: TDocument[];
  /** Whether the first page of the current query is still in flight. */
  isPending: boolean;
  /** Whether the current query rejected. */
  isError: boolean;
  /** The rejection reason, when `isError` is `true`. */
  error: unknown;
  /** Whether another server page remains. */
  hasMore: boolean;
  /** Whether a page beyond the first is in flight, from `loadMore()` or the `mimeTypes` auto-fill. */
  isLoadingMore: boolean;
  /** Fetches the next server page and appends its (filtered) documents. */
  loadMore: () => void;
}

/**
 * Debounced, cursor-paginated search over a VexCMS collection or media
 * collection — the hook both the relationship picker (step 12) and the
 * media library grid use, so pagination, debouncing, and MIME-type
 * filtering are implemented once.
 *
 * Uses `vexConvexApi.search` against the index `resolveTitleSearchIndex`
 * resolves for `collection` (the `useAsTitle` field's own `searchIndex` when
 * it declares one, else the auto `search_<useAsTitle>` name) when that
 * resolution succeeds and the debounced query is non-empty; falls back to
 * `vexConvexApi.find` otherwise — including when `useAsTitle` is a system
 * field or a non-searchable field type — which also lists recent documents
 * for an empty query.
 *
 * @param props - Hook configuration.
 * @returns Accumulated documents plus pagination/loading state.
 */
export function usePaginatedSearch<TDocument extends VexDocument = VexDocument>({
  collection,
  query,
  pageSize = 24,
  enabled = true,
  drafts,
  mimeTypes,
}: UsePaginatedSearchProps): UsePaginatedSearchReturn<TDocument> {
  const [debouncedQuery] = useDebounceValue(query, 200);
  const titleSearchIndex = resolveTitleSearchIndex({ collection });
  const useSearch = titleSearchIndex !== undefined && debouncedQuery.length > 0;
  const mimeTypesKey = mimeTypes?.join(",") ?? "";

  const [cursor, setCursor] = useState<string | null>(null);
  const [documents, setDocuments] = useState<TDocument[]>([]);
  const [isDone, setIsDone] = useState(false);

  const resetKey = `${collection.slug}|${useSearch}|${debouncedQuery}|${drafts}|${mimeTypesKey}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setCursor(null);
    setDocuments([]);
    setIsDone(false);
  }

  const args =
    useSearch && titleSearchIndex !== undefined
      ? {
          collection: collection.slug,
          searchIndexName: titleSearchIndex.indexName,
          searchField: titleSearchIndex.searchField,
          query: debouncedQuery,
          drafts,
          paginationOpts: { numItems: pageSize, cursor },
        }
      : {
          collection: collection.slug,
          drafts,
          paginationOpts: { numItems: pageSize, cursor },
        };

  const {
    data,
    isPending: isQueryPending,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...convexQuery(useSearch ? vexConvexApi.search : vexConvexApi.find, args as never),
    enabled,
  });

  const result = useMemo<PaginationResult<TDocument>>(() => {
    const empty = { page: [] as TDocument[], continueCursor: "", isDone: false };
    if (isLoading || isError || !data) return empty;
    if (Array.isArray(data)) return { ...empty, page: data as TDocument[], isDone: true };
    return data as PaginationResult<TDocument>;
  }, [data, isLoading, isError]);

  useEffect(() => {
    const pageDocuments =
      mimeTypesKey.length > 0
        ? (result.page as unknown as VexMediaDocument[]).filter((doc) =>
            matchesAcceptPattern({ filename: doc.filename, mimeType: doc.mimeType, accept: mimeTypesKey }),
          )
        : result.page;
    setDocuments((prev) =>
      cursor === null ? (pageDocuments as TDocument[]) : [...prev, ...(pageDocuments as TDocument[])],
    );
    setIsDone(result.isDone);
  }, [result.page, result.isDone, cursor, mimeTypesKey]);

  useEffect(() => {
    if (mimeTypesKey.length === 0) return;
    if (isQueryPending || isDone) return;
    if (documents.length >= pageSize) return;
    if (!result.continueCursor) return;
    setCursor(result.continueCursor);
  }, [documents.length, isQueryPending, isDone, result.continueCursor, mimeTypesKey, pageSize]);

  function loadMore() {
    if (isDone || !result.continueCursor) return;
    setCursor(result.continueCursor);
  }

  const isAutoFilling =
    mimeTypesKey.length > 0 && !isDone && documents.length < pageSize && cursor !== null;

  return {
    documents,
    isPending: isQueryPending && cursor === null,
    isError,
    error,
    hasMore: !isDone,
    isLoadingMore: (isQueryPending && cursor !== null) || isAutoFilling,
    loadMore,
  };
}
```

#### packages/react/src/hooks/usePaginatedSearch.test.tsx

New file. Thin entry point mirroring `usePaginatedQuery.test.tsx`'s
one-liner — without it, `describePaginatedSearch` (registered in
`hooksSuite.tsx` below) never actually runs as part of the suite.

```tsx
import { runHooksSuite } from "../testing/hooksSuite";

runHooksSuite({ only: ["usePaginatedSearch"] });
```

#### packages/react/src/hooks/index.ts

**Edit 1** — add the export, anchored after the existing `usePaginatedQuery` barrel line:

```ts
export * from "./usePaginatedQuery";
export * from "./usePaginatedSearch";
```

#### packages/react/src/components/fields/upload/utils.ts

New file — `fileMatchesAccept` moves here unchanged (behavior-wise) from `EmptyInput.tsx`, generalized to
`matchesAcceptPattern` so `usePaginatedSearch` can reuse the same matching semantics against a `VexMediaDocument`
(`filename`/`mimeType`) instead of a `File`.

```ts
/** Props for {@link matchesAcceptPattern}. */
export interface MatchesAcceptPatternProps {
  /** The candidate's filename, e.g. `"photo.png"`. */
  filename: string;
  /** The candidate's MIME type, e.g. `"image/png"`. */
  mimeType: string;
  /** Comma-separated `accept` pattern list — file extensions, MIME types, or `type/*` wildcards. */
  accept: string;
}

/**
 * Checks whether a filename/MIME-type pair matches an HTML `accept`
 * attribute pattern list — mirrors the native `<input type="file"
 * accept="...">` matching semantics (comma-separated file extensions, MIME
 * types, or `type/*` wildcards).
 *
 * Shared by `EmptyInput`'s dropzone filter and `usePaginatedSearch`'s
 * client-side MIME filtering for the media library grid.
 *
 * @param props - The candidate filename/MIME type and the `accept` pattern list.
 * @returns `true` when `accept` is empty or the candidate matches one of its patterns.
 */
export function matchesAcceptPattern(props: MatchesAcceptPatternProps): boolean {
  const patterns = props.accept
    .split(",")
    .map((pattern) => pattern.trim().toLowerCase())
    .filter(Boolean);
  if (patterns.length === 0) return true;

  const fileName = props.filename.toLowerCase();
  const mimeType = props.mimeType.toLowerCase();
  const mimeCategory = mimeType.split("/")[0];

  return patterns.some((pattern) => {
    if (pattern.startsWith(".")) return fileName.endsWith(pattern);
    if (pattern.endsWith("/*")) return mimeCategory === pattern.slice(0, -2);
    return mimeType === pattern;
  });
}

/**
 * Checks whether a dropped/selected `File` matches an HTML `accept`
 * attribute pattern list.
 *
 * @param file - The candidate file.
 * @param accept - The `accept` attribute value, e.g. `"image/*, .pdf"`.
 * @returns `true` when `accept` is empty or the file matches one of its patterns.
 */
export function fileMatchesAccept(file: File, accept: string): boolean {
  return matchesAcceptPattern({ filename: file.name, mimeType: file.type, accept });
}
```

#### packages/react/src/components/fields/upload/EmptyInput.tsx

**Edit 1** — add the import, anchored above the existing `import { useCallback } from "react";` line:

```ts
import { fileMatchesAccept } from "./utils";
import { useCallback } from "react";
```

**Edit 2** — delete the local `fileMatchesAccept` function and its doc comment (the block currently anchored by the
`fileMatchesAccept` identifier, between `UploadEmptyProps` and `UploadEmpty`) entirely; nothing replaces it in that
spot — the import above supplies the name. `handleDrop`'s own `fileMatchesAccept(file, fieldDef.accept)` call is
unchanged.

#### packages/react/src/components/media/MediaLibaryGrid.tsx

`MediaDocumentPreview` is unchanged. Everything else — imports, `MediaLibraryGridProps`, and the `MediaLibraryGrid`
function body — is shown complete below (anchored at the existing `export interface MediaLibraryGridProps` /
`export function MediaLibraryGrid` identifiers).

```tsx
"use client";

import { useMemo, useState } from "react";
import { type MediaCollectionConfig, type VexMediaDocument, formatBytes, formatMimeType } from "@vexcms/core";
import {
  Button,
  Input,
  Icon,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui";
import { FilePreview } from "./FilePreview";
import { usePaginatedSearch } from "../../hooks";
import { cn } from "../../styles/utils";

/**
 * Props for the MediaLibraryGrid component.
 */
export interface MediaLibraryGridProps {
  /** The media collection slug. */
  targetCollectionConfig: MediaCollectionConfig;
  /** Whether to allow multi-select (checkmarks on multiple items). */
  multi: boolean;
  /** Callback when user selects items (single or multiple IDs). */
  onSelect: (ids: string[]) => void;
  /** Currently selected media IDs (for checkmark display). */
  selectedIds?: string[];
  /**
   * The owning upload field's `accept` pattern list. Restricts both the
   * grid's results and the Type filter menu's options; omit to browse every
   * file in the collection and offer the generic Images/Videos/Audio/PDF
   * categories instead.
   */
  accept?: string;
}

const DEFAULT_TYPE_OPTIONS = ["image/*", "video/*", "audio/*", "application/pdf"] as const;

/**
 * Formats an accept pattern (`"image/*"`, `".pdf"`, `"application/pdf"`) as
 * a Type-menu label.
 *
 * @param pattern - One accept pattern.
 * @returns A human-readable label for the Type filter menu.
 */
function formatTypeOption(pattern: string): string {
  if (pattern === "audio/*") return "Audio";
  if (pattern.endsWith("/*")) {
    const category = pattern.slice(0, -2);
    return `${category.charAt(0).toUpperCase()}${category.slice(1)}s`;
  }
  if (pattern.startsWith(".")) return pattern.toUpperCase();
  return formatMimeType(pattern);
}

/**
 * Reusable grid component for the media library tab.
 *
 * Shows thumbnails with filename + MIME/size metadata. Supports single/multi-select
 * with checkmarks, a debounced server-side search bar, a Type filter menu (client-side
 * MIME match over the field's `accept` patterns, via `usePaginatedSearch`'s `mimeTypes`),
 * and real cursor pagination with a working "Load more".
 *
 * Matches the `MediaPicker` / `MediaModalLibrary` design: search bar + Type filter button,
 * 4-column grid with tiles showing FilePreview + filename + metadata.
 *
 * @param props - Component props.
 * @returns The search bar + Type filter, results grid with selection state, and a "Load more" button when there are more results.
 */
export function MediaLibraryGrid({
  targetCollectionConfig,
  multi,
  onSelect,
  selectedIds = [],
  accept,
}: MediaLibraryGridProps) {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const acceptPatterns = useMemo(
    () =>
      (accept ?? "")
        .split(",")
        .map((pattern) => pattern.trim())
        .filter(Boolean),
    [accept],
  );
  const typeOptions = acceptPatterns.length > 0 ? acceptPatterns : [...DEFAULT_TYPE_OPTIONS];
  const mimeTypes = useMemo(() => {
    if (selectedType !== "all") return [selectedType];
    return acceptPatterns.length > 0 ? acceptPatterns : undefined;
  }, [selectedType, acceptPatterns]);

  const { documents, isPending, hasMore, isLoadingMore, loadMore } = usePaginatedSearch<VexMediaDocument>({
    collection: targetCollectionConfig,
    query: search,
    mimeTypes,
  });

  const handleItemClick = (id: string) => {
    if (multi) {
      const newSelection = selectedIds.includes(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id];
      onSelect(newSelection);
    } else {
      onSelect([id]);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 pb-2">
        <Input
          className="vex-input sm"
          placeholder={`Search ${targetCollectionConfig.labels.plural} by filename or alt…`}
          value={search}
          isPending={search.length > 0 && isPending}
          iconLeft={{ name: "Search" }}
          onChange={(e) => setSearch(e.target.value)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" icon="ListFilter">
                {selectedType === "all" ? "Type" : formatTypeOption(selectedType)}
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup value={selectedType} onValueChange={setSelectedType}>
              <DropdownMenuRadioItem value="all">All types</DropdownMenuRadioItem>
              {typeOptions.map((pattern) => (
                <DropdownMenuRadioItem key={pattern} value={pattern}>
                  {formatTypeOption(pattern)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden">
        {documents.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {isPending
              ? "Loading..."
              : search.length > 0
                ? "No media files match your search"
                : "No media files yet"}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {documents.map((mediaDoc) => (
              <MediaDocumentPreview
                key={mediaDoc._id}
                mediaDoc={mediaDoc}
                selectedIds={selectedIds}
                handleItemClick={handleItemClick}
              />
            ))}
          </div>
        )}
      </div>
      {hasMore && (
        <div className="px-5 pb-3 pt-2">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </>
  );
}
```

#### packages/react/src/components/media/MediaPicker.tsx

The whole `MediaPicker` function changes (controlled tab state replaces `handleBackToLibrary`'s no-op body, the
footer copy's duplicate-branch ternary is replaced, `accept` is threaded to the grid) — shown complete, anchored at
the existing `export function MediaPicker` identifier. Imports and `MediaPickerProps` are unchanged.

```tsx
export function MediaPicker({
  field,
  fieldDef,
  targetCollection,
  multi,
  defaultTab = "library",
  stagedFiles: stagedFiles = [],
  onSelect,
  onCancel,
}: MediaPickerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(field.state.value ?? []);
  const [activeTab, setActiveTab] = useState<"library" | "upload">(defaultTab);

  const config = useVexConfig();
  const targetCollectionConfig = config.mediaCollections.find((mc) => mc.slug === targetCollection);
  if (!targetCollectionConfig) {
    throw new Error(`Media collection "${targetCollection}" not found in config.`);
  }

  const handleSelect = () => {
    onSelect(selectedIds);
    setSelectedIds([]);
  };

  function handleUploadComplete(mediaIds: string[]) {
    onSelect(mediaIds);
    setSelectedIds([]);
  }

  function handleBackToLibrary() {
    setActiveTab("library");
  }

  const label = fieldDef.hasMany
    ? targetCollectionConfig.labels.plural
    : targetCollectionConfig.labels.singular;
  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="w-[90svw] !max-w-6xl">
        <div className="items-center flex gap-4">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded bg-accent text-accent-foreground">
            <Icon name="Image" size={20} />
          </div>
          <div className="text">
            <h1 className="font-mono">
              Select {label} - <b className="text-primary">{fieldDef.label}</b>
            </h1>
            <p className="text-xs">Choose from the list below, or upload more</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "library" | "upload")}>
          <TabsList>
            <TabsTrigger
              value="library"
              render={
                <Button variant="ghost" icon="Folder">
                  Library
                </Button>
              }
            />
            <TabsTrigger
              value="upload"
              render={
                <Button variant="ghost" icon="Plus">
                  Upload
                </Button>
              }
            />
          </TabsList>

          <TabsContent value="library">
            <MediaLibraryGrid
              targetCollectionConfig={targetCollectionConfig}
              multi={multi}
              onSelect={setSelectedIds}
              selectedIds={selectedIds}
              accept={fieldDef.accept}
            />
            <div className="flex items-center justify-between pt-4">
              <p className="pt-2">
                {selectedIds.length} {selectedIds.length === 1 ? "item" : "items"} selected
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSelect} disabled={selectedIds.length === 0}>
                  {multi && selectedIds.length > 1 ? `Select ${selectedIds.length}` : "Select"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-0">
            <MediaUploadForm
              fieldDef={fieldDef}
              stagedFiles={stagedFiles}
              collectionConfig={targetCollectionConfig}
              multi={fieldDef.hasMany}
              onComplete={handleUploadComplete}
              onCancel={handleBackToLibrary}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

#### packages/react/src/components/media/MediaPicker.test.tsx

New file. Mirrors `Input.test.tsx`'s pending-`queryFn` harness (no real convex-test backend needed — only tab/copy
behavior is under test, never resolved query data).

```tsx
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { defineConfig } from "@vexcms/core";
import type { MediaCollectionConfig, VexClientConfig } from "@vexcms/core";
import { describe, expect, it } from "vitest";
import type { TypedFieldApi } from "../form";

import { uploadFieldFixture } from "../fields/upload/testFixture";
import { VexConfigContext } from "../../context";
import { MediaPicker } from "./MediaPicker";

function makeMockMediaCollection(): MediaCollectionConfig {
  return {
    slug: "images",
    fields: {},
    labels: { singular: "Image", plural: "Images" },
    admin: { useAsTitle: "_id", components: {} },
    meta: { storageAdapter: "convex" },
  } as unknown as MediaCollectionConfig;
}

const stubClientConfig: VexClientConfig = defineConfig({
  mediaCollections: [makeMockMediaCollection()],
  storage: { clientUploads: { convex: async () => ({ storageId: "stub-id" }) } },
});

function Harness({ defaultTab }: { defaultTab?: "library" | "upload" }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { queryFn: () => new Promise<never>(() => {}) } },
  });
  const convexClient = new ConvexReactClient("https://example.convex.cloud");
  const field = { state: { value: [] } } as unknown as TypedFieldApi<string[]>;
  return (
    <ConvexProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>
        <VexConfigContext.Provider value={stubClientConfig}>
          <MediaPicker
            field={field}
            fieldDef={uploadFieldFixture.fieldDef}
            targetCollection="images"
            multi={uploadFieldFixture.fieldDef.hasMany}
            defaultTab={defaultTab}
            onSelect={() => {}}
            onCancel={() => {}}
          />
        </VexConfigContext.Provider>
      </QueryClientProvider>
    </ConvexProvider>
  );
}

describe("MediaPicker", () => {
  it("returns to the Library tab when Upload's own Cancel is clicked, instead of doing nothing", async () => {
    render(<Harness defaultTab="upload" />);
    expect(screen.getByText("Drop Files here, or click to choose")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() =>
      expect(screen.queryByText("Drop Files here, or click to choose")).not.toBeInTheDocument(),
    );
    expect(screen.getByPlaceholderText("Search Images by filename or alt…")).toBeInTheDocument();
  });

  it("shows pluralized selection copy in the Library footer instead of the dead duplicate-branch ternary", () => {
    render(<Harness />);
    expect(screen.getByText("0 items selected")).toBeInTheDocument();
  });

  it("passes the upload field's accept patterns to the grid's Type filter instead of letting it fall back to the generic categories", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Type" }));
    await screen.findByRole("menu");

    expect(screen.getByRole("menuitemradio", { name: "Images" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitemradio", { name: "PDF" })).not.toBeInTheDocument();
  });
});
```

`TypedFieldApi` is a form-layer type, not part of `@vexcms/core`'s public surface — import it from `"../form"`
(mirrors how `MediaPicker.tsx` itself imports it), not `"@vexcms/core"`. This package's `tsconfig.check.json` has no
`vitest/globals` ambient types, so `describe`/`expect`/`it` (and `fireEvent`/`waitFor` above) must be imported
explicitly, matching every other `*.test.tsx` in this package (e.g. `MediaUploadForm.test.tsx`).

#### packages/react/src/components/fields/upload/FilledInput.tsx

Builds on top of step 1's edits to this file (which already changed `atLimit` and the `n/max` span to read
`fieldDef.max[0]`) — both anchors below are step 1's OUTPUT, not the original repo line, so there is no overlap.

**1 — stable `Droppable` id**, instead of the field's display label (anchor: the `<Droppable id={` line, which
step 1 leaves untouched):

```tsx
        <Droppable id={`upload-${fieldApi.name}`} onReorder={onReorder}>
```

**2 — single mode gets a Replace button mirroring multi mode's Edit button**, replacing the dead end where a
single-file field had no way back into the picker (anchor: step 1's `{fieldDef.max && (` span closes the
`{fieldDef.hasMany && (` block at `</div>\n      )}` — replace that whole
`{fieldDef.hasMany && ( … )}` expression, unchanged inside, with the ternary below):

```tsx
      {fieldDef.hasMany ? (
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={openPicker}
            disabled={readOnly || atLimit}
            icon="FilePenLine"
          >
            Edit {targetCollectionConfig.labels.plural}
          </Button>
          <Button
            variant="ghost"
            className="transition-all duration-300 hover:text-destructive"
            size="sm"
            onClick={() => fieldApi.setValue([])}
            disabled={readOnly || mediaIds.length === 0}
            icon="X"
          >
            Clear
          </Button>
          {fieldDef.max && (
            <span
              className={`${atLimit ? "text-destructive" : "text-muted-foreground"} ml-auto font-mono
              text-[11px]`}
            >
              {mediaIds.length}/{fieldDef.max[0]}
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={openPicker}
            disabled={readOnly}
            icon="FilePenLine"
          >
            Replace
          </Button>
        </div>
      )}
```

#### packages/react/src/components/fields/upload/Input.test.tsx

**Edit** — add a new `it` inside the existing `describe("upload field: filled-state file management", …)` block,
directly after the `"disables 'Edit …' once mediaIds.length reaches fieldDef.max, and shows the exact n/max count"`
test (anchored by that test's name):

```ts
it("opens the picker via the single-mode 'Replace' button when hasMany is false", () => {
  const singleFieldDef = { ...fixture.fieldDef, hasMany: false };
  render(<Harness fieldDef={singleFieldDef} readOnly={false} initialValue={["images_1"]} />);

  expect(screen.queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Replace" }));

  expect(screen.getByRole("heading", { name: /Select Image/ })).toBeInTheDocument();
});
```

#### packages/react/src/testing/hooksSuite.tsx

**Edit 1** — imports: thread `seedMedia`/`TestMediaInput` from the existing `./convex/schema` import, add the new
hook import, and add `CollectionConfig`/`MediaCollectionConfig` type imports, anchored around the existing
`usePaginatedQuery` import line:

```tsx
import schema, { seedDocuments, seedMedia, testModules, type TestMediaInput } from "./convex/schema";
import { useTableSelection } from "../hooks/useTableSelection";
import { usePaginatedQuery } from "../hooks/usePaginatedQuery";
import { usePaginatedSearch } from "../hooks/usePaginatedSearch";
import type { CollectionConfig, MediaCollectionConfig } from "@vexcms/core";
```

**Edit 2** — the member-name union, anchored at `HooksSuiteMember`:

```ts
export type HooksSuiteMember = "useTableSelection" | "usePaginatedQuery" | "usePaginatedSearch";
```

**Edit 3** — new fixtures + describe block, anchored directly above the existing
`export function runHooksSuite` declaration:

```tsx
/**
 * A `CollectionConfig` fixture over this kit's own `documents` table
 * (`search_title` index, `title` field) — `usePaginatedSearch`'s non-media
 * describe block queries it directly, the same way `usePaginatedQuery`'s own
 * tests do via the bare `"documents"` collection slug.
 *
 * @returns A `CollectionConfig` usable as `usePaginatedSearch`'s `collection` prop.
 */
function makeDocumentsCollection(): CollectionConfig {
  return {
    slug: "documents",
    fields: {},
    labels: { singular: "Document", plural: "Documents" },
    admin: { useAsTitle: "title", components: {} },
    meta: {},
  } as unknown as CollectionConfig;
}

/**
 * A `MediaCollectionConfig` fixture over this kit's own `media` table —
 * `usePaginatedSearch`'s `mimeTypes` auto-fill test seeds mixed-type rows
 * into it directly.
 *
 * @returns A `MediaCollectionConfig` usable as `usePaginatedSearch`'s `collection` prop.
 */
function makeImagesCollection(): MediaCollectionConfig {
  return {
    slug: "images",
    fields: {},
    labels: { singular: "Image", plural: "Images" },
    admin: { useAsTitle: "filename", components: {} },
    meta: { storageAdapter: "convex" },
  } as unknown as MediaCollectionConfig;
}

/**
 * Registers the `usePaginatedSearch` describe block, driven by real seeded
 * rows through the convex-test bridge — same no-module-mock rationale as
 * `usePaginatedQuery`'s own block above.
 *
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describePaginatedSearch() {
  describe("usePaginatedSearch", () => {
    it("lists the first page via find for an empty query, and loadMore reveals further pages", async () => {
      const t = convexTest(schema, testModules);
      await seedDocuments(t, 5);
      const { queryClient } = buildQueryClient(t);
      const collection = makeDocumentsCollection();

      const { result } = renderHook(
        () => usePaginatedSearch({ collection, query: "", pageSize: 2 }),
        { wrapper: makeWrapper(queryClient) },
      );

      await waitFor(() => expect(result.current.isPending).toBe(false));
      expect(result.current.documents.map((doc) => doc.title)).toEqual(["Doc 0", "Doc 1"]);
      expect(result.current.hasMore).toBe(true);

      act(() => result.current.loadMore());
      await waitFor(() =>
        expect(result.current.documents.map((doc) => doc.title)).toEqual([
          "Doc 0",
          "Doc 1",
          "Doc 2",
          "Doc 3",
        ]),
      );
      expect(result.current.hasMore).toBe(true);

      act(() => result.current.loadMore());
      await waitFor(() =>
        expect(result.current.documents.map((doc) => doc.title)).toEqual([
          "Doc 0",
          "Doc 1",
          "Doc 2",
          "Doc 3",
          "Doc 4",
        ]),
      );
      expect(result.current.hasMore).toBe(false);
    });

    it("debounces then dispatches to the search_<useAsTitle> index for a non-empty query", async () => {
      // `withSearchIndex` is not implemented by convex-test v0.0.38 — it
      // always resolves an empty result set here regardless of seeded
      // content (see `api/search/server.test.ts`'s own "non-empty query
      // does not throw" workaround for the same limitation). This test can
      // only prove the hook settles into the search branch without
      // erroring; it cannot assert real match content until convex-test
      // supports search indexes.
      const t = convexTest(schema, testModules);
      await seedDocuments(t, 5);
      const { queryClient } = buildQueryClient(t);
      const collection = makeDocumentsCollection();

      const { result } = renderHook(
        () => usePaginatedSearch({ collection, query: "Doc 2" }),
        { wrapper: makeWrapper(queryClient) },
      );

      await waitFor(() => expect(result.current.isPending).toBe(false));
      expect(result.current.isError).toBe(false);
      expect(result.current.documents).toEqual([]);
      expect(result.current.hasMore).toBe(false);
    });

    it("applies mimeTypes as a client-side filter, auto-fetching further server pages to fill the page", async () => {
      const t = convexTest(schema, testModules);
      const rows: Array<Partial<TestMediaInput>> = [
        { filename: "a.png", mimeType: "image/png" },
        { filename: "b.pdf", mimeType: "application/pdf" },
        { filename: "c.png", mimeType: "image/png" },
        { filename: "d.pdf", mimeType: "application/pdf" },
      ];
      await seedMedia(t as never, rows);
      const { queryClient } = buildQueryClient(t);
      const collection = makeImagesCollection();

      const { result } = renderHook(
        () =>
          usePaginatedSearch({
            collection,
            query: "",
            pageSize: 2,
            mimeTypes: ["application/pdf"],
          }),
        { wrapper: makeWrapper(queryClient) },
      );

      await waitFor(() =>
        expect(result.current.documents.map((doc) => doc.filename)).toEqual(["b.pdf", "d.pdf"]),
      );
      expect(result.current.hasMore).toBe(false);
    });
  });
}
```

**Edit 4** — `runHooksSuite`, anchored at its body:

```ts
export function runHooksSuite(options?: { only?: HooksSuiteMember[] }): void {
  const only = options?.only ?? ["useTableSelection", "usePaginatedQuery", "usePaginatedSearch"];

  if (only.includes("useTableSelection")) {
    describe("useTableSelection", () => {
      // … unchanged …
    });
  }
  // … usePaginatedQuery block unchanged …
  if (only.includes("usePaginatedSearch")) describePaginatedSearch();
}
```

#### packages/react/src/testing/mediaSuite.tsx

**Edit 1** — `renderGrid` threads a new `accept` seed option through to the grid, anchored at the existing
`async function renderGrid` declaration inside `describeMediaLibraryGrid`:

```tsx
async function renderGrid(options: {
  rows?: Array<Partial<TestMediaInput>>;
  multi?: boolean;
  onSelect?: (ids: string[]) => void;
  selectedIds?: string[];
  accept?: string;
}): Promise<{ utils: RenderResult; ids: string[] }> {
  const t = convexTest(schema, testModules);
  const ids = await seedMedia(t as never, options.rows ?? []);
  const { queryClient, convexClient } = buildConvexStack(t);
  const utils = renderWithVexProviders(
    <ConvexProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>
        <MediaLibraryGrid
          targetCollectionConfig={targetCollectionConfig}
          multi={options.multi ?? false}
          onSelect={options.onSelect ?? (() => {})}
          selectedIds={options.selectedIds}
          accept={options.accept}
        />
      </QueryClientProvider>
    </ConvexProvider>,
    { access },
  );
  return { utils, ids };
}
```

**Edit 2** — new tests, anchored directly after the existing
`"renders a filename containing unicode/emoji and one containing markup characters as plain text, with no injection"`
test and before the single-select test:

```tsx
it("shows the collection's plural label in the search placeholder, not the raw config object", async () => {
  await renderGrid({ rows: [] });
  expect(
    screen.getByPlaceholderText("Search Images by filename or alt…"),
  ).toBeInTheDocument();
});

it("paginates via a real 'Load more' click, fetching and rendering the next server page", async () => {
  const rows = Array.from({ length: 26 }, (_, i) => ({ filename: `file-${i}.png` }));
  const { utils } = await renderGrid({ rows });

  await waitFor(() => expect(utils.container.querySelectorAll(".grid > button")).toHaveLength(24));
  const loadMoreButton = screen.getByRole("button", { name: "Load more" });

  fireEvent.click(loadMoreButton);

  await waitFor(() => expect(utils.container.querySelectorAll(".grid > button")).toHaveLength(26));
  expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
});

it("derives the Type menu from accept, and selecting a type filters results client-side across server pages", async () => {
  const rows: Array<Partial<TestMediaInput>> = [
    ...Array.from({ length: 24 }, (_, i) => ({ filename: `img-${i}.png`, mimeType: "image/png" })),
    { filename: "doc-a.pdf", mimeType: "application/pdf" },
    { filename: "doc-b.pdf", mimeType: "application/pdf" },
  ];
  const user = userEvent.setup();
  await renderGrid({ rows, accept: "image/*,application/pdf" });

  await waitFor(() => expect(screen.getByText("img-0.png")).toBeInTheDocument());

  await user.click(screen.getByRole("button", { name: "Type" }));
  await screen.findByRole("menu");
  await user.click(screen.getByRole("menuitemradio", { name: "PDF" }));

  await waitFor(() =>
    expect(screen.getByText("doc-a.pdf")).toBeInTheDocument(),
  );
  expect(screen.getByText("doc-b.pdf")).toBeInTheDocument();
  expect(screen.queryByText("img-0.png")).not.toBeInTheDocument();
});
```

`mediaSuite.tsx`'s top import line (`import { describe, expect, it, vi } from "vitest";`) and its
`@testing-library/react` import need `fireEvent`/`waitFor` already present — add
`import userEvent from "@testing-library/user-event";` as a new import line alongside them.

Verify: `pnpm --filter @vexcms/react test -- usePaginatedSearch media fields/upload`

### Step 12 — Relationship field overhaul [agent]

- [ ] `packages/react/src/components/relationship/RelationshipPicker.tsx` — dialog: Select / Create tabs
- [ ] `packages/react/src/components/relationship/RelationshipDocumentList.tsx` — search + paginated list via `usePaginatedSearch`
- [ ] `packages/react/src/components/relationship/index.ts` — barrel
- [ ] `packages/react/src/components/relationship/RelationshipPicker.test.tsx`
- [ ] `packages/react/src/components/relationship/RelationshipDocumentList.test.tsx`
- [ ] `packages/react/src/components/modals/CreateDocumentForm.tsx` — extracted from `CreateDocumentModal`, used by it and the picker
- [ ] `packages/react/src/components/modals/CreateDocumentForm.test.tsx`
- [ ] `packages/react/src/components/modals/CreateDocumentModal.tsx` — refactored onto `CreateDocumentForm`
- [ ] `packages/react/src/components/modals/constants.ts` — `MODALS.relationshipPicker`
- [ ] `packages/react/src/components/modals/index.tsx` — export `CreateDocumentForm`
- [ ] `packages/react/src/components/fields/relationship/Input.tsx` — read-only / empty / filled state switch, draft gate
- [ ] `packages/react/src/components/fields/relationship/EmptyInput.tsx` — `RelationshipEmpty`
- [ ] `packages/react/src/components/fields/relationship/FilledInput.tsx` — `RelationshipFilledState`
- [ ] `packages/react/src/components/fields/relationship/types.ts` — drop the dead `RelationshipOption`
- [ ] `packages/react/src/components/fields/relationship/index.ts` — export `EmptyInput`/`FilledInput`
- [ ] `packages/react/src/components/fields/relationship/testFixture.ts` — drop the `useRelationshipPickerOptions`-specific fixture/docs
- [ ] `packages/react/src/components/fields/relationship/Input.test.tsx` — rewritten for the new state-switch surface
- [ ] `packages/react/src/components/fields/relationship/EmptyInput.test.tsx`
- [ ] `packages/react/src/components/fields/relationship/FilledInput.test.tsx`
- [ ] delete `packages/react/src/hooks/useRelationshipPickerOptions.ts`
- [ ] `packages/react/src/hooks/index.ts` — drop its barrel export
- [x] `packages/core/src/collections/validator.ts` — `resolveTitleSearchIndex` helper + `collectionConfigToVexSchema` emits the auto `search_<useAsTitle>` index only when the title field has no own `searchIndex`
- [x] `packages/core/src/collections/validator.test.ts` — `resolveTitleSearchIndex` unit tests; updated auto-search-index tests for the new by-field dedupe rule

Why: the named offender (launch-plan v0.1.0 item). The combobox popover had no
loading skeleton, no access-error state, no drag reorder, no limit counter, and
no way to create a target document without leaving the field. Copied from
upload's three-state pattern (`Input` switches read-only/empty/filled; `Empty`
is a dashed box with Select/Create buttons; `Filled` is draggable rows with
Edit/Clear) per contract Decision 9 — relationship and upload share no field
code, only `usePaginatedSearch` (Step 11). `useRelationshipPickerOptions` is
deleted; its search/list query is now `usePaginatedSearch`, owned and tested by
Step 11; this step's own tests cover what is new here (the list's selection/
checkbox/max-disable logic, the picker's tab switching, the empty/filled/
draft-gated states) rather than re-proving the shared hook's debounce/branch
behavior.

`collectionConfigToVexSchema` previously auto-generated `.searchIndex("search_<useAsTitle>",
…)` whenever another collection pointed at a collection, detecting an existing index by
matching the generated STRING `.searchIndex("search_<useAsTitle>", {` against every emitted
index — so a `useAsTitle` field with its own differently-named `searchIndex` got a second,
redundant auto index, and the picker always queried the hardcoded `search_<useAsTitle>` name
regardless of which index actually existed. `resolveTitleSearchIndex({ collection })` (exported
from `packages/core/src/collections/validator.ts`, re-exported from the collections and core
barrels) is now the single source of truth both schema generation and `usePaginatedSearch`
(Step 11) consult: it resolves the `useAsTitle` field BY REFERENCE (not by name) — reusing that
field's own `searchIndex` name when it declares one, falling back to the auto `search_<useAsTitle>`
name only when it doesn't — and returns `undefined` when `useAsTitle` is a Convex system field or
a field type that doesn't declare `searchIndex` support (number, date, checkbox, …), so no second
index is ever emitted on the same field and a non-searchable title never gets an invalid index.
`defineConfig` does NOT gain a new warn/throw for a relationship targeting a non-searchable title:
the old code could only ever emit a VALID index (or none), and the fix doesn't change that —
`usePaginatedSearch`'s existing `find()` fallback already covers this case cleanly, so there is no
"would otherwise produce an invalid index" scenario to guard against.

#### packages/react/src/components/relationship/RelationshipDocumentList.tsx

```tsx
"use client";

import { useState } from "react";
import { useDebounceValue } from "@ts-hooks-kit/core";
import type { CollectionConfig, RelationshipField, VexDocument } from "@vexcms/core";
import { Button, Input, Skeleton } from "../ui";
import { usePaginatedSearch } from "../../hooks";
import { resolveRelationshipPreview } from "../fields/relationship/preview";
import { getVexErrorMessage } from "../../lib/errors";

/**
 * Props for {@link RelationshipDocumentList}.
 */
export interface RelationshipDocumentListProps {
  /** The resolved relationship field definition driving preview + limit rules. */
  fieldDef: RelationshipField;
  /** The target collection documents are searched/listed against. */
  targetCollection: CollectionConfig;
  /** Currently selected document ids, used for checkmarks and the max-selection gate. */
  selectedIds: string[];
  /** Whether draft target documents are visible (mirrors the editing document's own draft status). */
  drafts: boolean;
  /** Called with the next selection whenever a row is toggled. */
  onSelectionChange: (ids: string[]) => void;
}

/**
 * Searchable, paginated list of candidate documents for the relationship
 * picker's Select tab.
 *
 * Single-select (`!fieldDef.hasMany`) rows replace the whole selection on
 * click (re-clicking the selected row clears it). Multi-select rows toggle
 * via a checkbox-styled marker and are disabled once `selectedIds.length`
 * reaches `fieldDef.max`.
 *
 * @param props - Component props.
 * @returns The search box, the result list (skeleton rows while pending, an
 *   error message, "No documents found", or the rows), and a "Load more"
 *   button when `usePaginatedSearch` reports `hasMore`.
 */
export function RelationshipDocumentList({
  fieldDef,
  targetCollection,
  selectedIds,
  drafts,
  onSelectionChange,
}: RelationshipDocumentListProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounceValue(search, 200);

  const { documents, isPending, isError, error, hasMore, isLoadingMore, loadMore } =
    usePaginatedSearch<VexDocument>({
      collection: targetCollection,
      query: debouncedSearch,
      drafts,
    });

  const Preview = resolveRelationshipPreview({ fieldDef, targetCollection });
  const atMax = fieldDef.max !== undefined && selectedIds.length >= fieldDef.max[0];
  const targetLabel = targetCollection.labels.plural;

  function toggle(docId: string) {
    if (fieldDef.hasMany) {
      if (selectedIds.includes(docId)) {
        onSelectionChange(selectedIds.filter((id) => id !== docId));
      } else if (!atMax) {
        onSelectionChange([...selectedIds, docId]);
      }
    } else {
      onSelectionChange(selectedIds[0] === docId ? [] : [docId]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="border-b border-border p-2">
        <Input
          type="text"
          placeholder={`Search ${targetLabel}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          isPending={isPending}
          autoFocus
        />
      </div>

      {isPending ? (
        <div className="flex flex-col gap-2 py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="p-4 text-center text-xs text-destructive">{getVexErrorMessage(error)}</p>
      ) : documents.length === 0 ? (
        <p className="p-4 text-center text-xs text-muted-foreground">No documents found</p>
      ) : (
        <div className="max-h-[360px] overflow-y-auto">
          {documents.map((doc) => {
            const docId = doc._id as string;
            const isSelected = selectedIds.includes(docId);
            const disabled = fieldDef.hasMany && !isSelected && atMax;
            return (
              <button
                key={docId}
                type="button"
                onClick={() => toggle(docId)}
                disabled={disabled}
                className={`${isSelected ? "bg-accent text-accent-foreground" : ""} flex w-full items-center
                    gap-2 rounded px-3 py-1.5 text-left text-[13px] hover:bg-accent hover:text-accent-foreground
                  disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {fieldDef.hasMany && (
                  <span
                    className={`${
                      isSelected ? "bg-primary text-primary-foreground" : "border-input"
                    } grid h-4 w-4 flex-shrink-0 place-items-center rounded-sm border border-primary`}
                  >
                    {isSelected && <span className="text-[10px]">✓</span>}
                  </span>
                )}
                <span className="flex-1 truncate">
                  <Preview doc={doc} fieldKey="_id" config={targetCollection as never} />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={loadMore}
          isPending={isLoadingMore}
          className="self-center"
        >
          Load more
        </Button>
      )}
    </div>
  );
}
```

#### packages/react/src/components/relationship/RelationshipPicker.tsx

```tsx
"use client";

import { useState } from "react";
import type { CollectionConfig, RelationshipField } from "@vexcms/core";
import { Button, Dialog, DialogContent, Icon, Tabs, TabsContent, TabsList, TabsTrigger } from "../ui";
import { RelationshipDocumentList } from "./RelationshipDocumentList";
import { CreateDocumentForm } from "../modals/CreateDocumentForm";

/**
 * Props for {@link RelationshipPicker}.
 */
export interface RelationshipPickerProps {
  /** The resolved relationship field definition. */
  fieldDef: RelationshipField;
  /** The target collection documents are picked from or created in. */
  targetCollection: CollectionConfig;
  /** The field's current value when the picker opened. */
  selectedIds: string[];
  /** Whether draft target documents are visible. */
  drafts: boolean;
  /** Which tab opens first. @defaultValue "select" */
  defaultTab?: "select" | "create";
  /** Called with the confirmed selection when the picker commits. */
  onSelect: (ids: string[]) => void;
  /** Called when the picker is dismissed without committing. */
  onCancel: () => void;
}

/**
 * Relationship field picker dialog — Select (search + paginated list) and
 * Create (a standalone create form) tabs.
 *
 * Selection is held locally until "Select" is clicked, so navigating between
 * tabs never loses in-progress picks. Creating a document while `hasMany` is
 * true auto-selects it and returns to the Select tab instead of closing;
 * single-select calls `onSelect` immediately (Decision 9 — a created document
 * is auto-selected). The dialog refuses to close (Escape/backdrop/Cancel)
 * while `CreateDocumentForm` reports an in-flight submit via
 * `onSubmittingChange`, same guard `CreateDocumentModal` applies.
 *
 * @param props - Component props.
 * @returns A `Dialog` with Select/Create tabs.
 */
export function RelationshipPicker({
  fieldDef,
  targetCollection,
  selectedIds: initialSelectedIds,
  drafts,
  defaultTab = "select",
  onSelect,
  onCancel,
}: RelationshipPickerProps) {
  const [activeTab, setActiveTab] = useState<"select" | "create">(defaultTab);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const label = fieldDef.hasMany ? targetCollection.labels.plural : targetCollection.labels.singular;

  function handleCreated(id: string) {
    if (fieldDef.hasMany) {
      setSelectedIds((current) => [...current, id]);
      setActiveTab("select");
    } else {
      onSelect([id]);
    }
  }

  function handleCancel() {
    if (isSubmitting) return;
    onCancel();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="w-[90svw] !max-w-4xl">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded bg-accent text-accent-foreground">
            <Icon name="Link" size={20} />
          </div>
          <div className="text">
            <h1 className="font-mono">
              Select {label} - <b className="text-primary">{fieldDef.label}</b>
            </h1>
            <p className="text-xs">Choose from the list below, or create a new one</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "select" | "create")}>
          <TabsList>
            <TabsTrigger
              value="select"
              render={
                <Button variant="ghost" icon="Search">
                  Select
                </Button>
              }
            />
            <TabsTrigger
              value="create"
              render={
                <Button variant="ghost" icon="Plus">
                  Create
                </Button>
              }
            />
          </TabsList>

          <TabsContent value="select">
            <RelationshipDocumentList
              fieldDef={fieldDef}
              targetCollection={targetCollection}
              selectedIds={selectedIds}
              drafts={drafts}
              onSelectionChange={setSelectedIds}
            />
            <div className="flex items-center justify-between pt-4">
              <p className="pt-2 text-xs text-muted-foreground">{selectedIds.length} selected</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={() => onSelect(selectedIds)}>
                  {fieldDef.hasMany && selectedIds.length > 1 ? `Select ${selectedIds.length}` : "Select"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="create" className="mt-0">
            <CreateDocumentForm
              collection={targetCollection}
              onCreated={handleCreated}
              onCancel={handleCancel}
              onSubmittingChange={setIsSubmitting}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

#### packages/react/src/components/relationship/index.ts

```ts
export * from "./RelationshipPicker";
export * from "./RelationshipDocumentList";
```

#### packages/react/src/components/relationship/RelationshipDocumentList.test.tsx

```tsx
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CollectionConfig, VexDocument } from "@vexcms/core";
import { relationshipFieldFixture, relationshipTargetCollection } from "../fields/relationship/testFixture";
import { RelationshipDocumentList } from "./RelationshipDocumentList";

const { usePaginatedSearchMock } = vi.hoisted(() => ({ usePaginatedSearchMock: vi.fn() }));

vi.mock("../../hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../hooks")>();
  return { ...actual, usePaginatedSearch: usePaginatedSearchMock };
});

function makeDoc(id: string, title: string): VexDocument {
  return { _id: id, _creationTime: 0, title } as unknown as VexDocument;
}

function baseResult(overrides: Partial<ReturnType<typeof usePaginatedSearchMock>> = {}) {
  return {
    documents: [],
    isPending: false,
    isError: false,
    error: undefined,
    hasMore: false,
    isLoadingMore: false,
    loadMore: vi.fn(),
    ...overrides,
  };
}

const targetCollection = relationshipTargetCollection as CollectionConfig;

describe("RelationshipDocumentList", () => {
  it("renders skeleton rows while pending", () => {
    usePaginatedSearchMock.mockReturnValue(baseResult({ isPending: true }));
    const { container } = render(
      <RelationshipDocumentList
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        onSelectionChange={vi.fn()}
      />,
    );
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it("renders an error message when the query fails", () => {
    usePaginatedSearchMock.mockReturnValue(baseResult({ isError: true, error: new Error("boom") }));
    render(
      <RelationshipDocumentList
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        onSelectionChange={vi.fn()}
      />,
    );
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("renders 'No documents found' for an empty result set", () => {
    usePaginatedSearchMock.mockReturnValue(baseResult());
    render(
      <RelationshipDocumentList
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        onSelectionChange={vi.fn()}
      />,
    );
    expect(screen.getByText("No documents found")).toBeInTheDocument();
  });

  it("hasMany: clicking an unselected row adds it to the selection", async () => {
    const user = userEvent.setup();
    usePaginatedSearchMock.mockReturnValue(
      baseResult({ documents: [makeDoc("a", "Alpha"), makeDoc("b", "Bravo")] }),
    );
    const onSelectionChange = vi.fn();
    render(
      <RelationshipDocumentList
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /alpha/i }));
    expect(onSelectionChange).toHaveBeenCalledWith(["a"]);
  });

  it("hasMany: disables unselected rows once the selection is at max", () => {
    usePaginatedSearchMock.mockReturnValue(
      baseResult({ documents: [makeDoc("a", "Alpha"), makeDoc("b", "Bravo")] }),
    );
    const fieldDef = { ...relationshipFieldFixture.fieldDef, max: [1, "Too many"] as const };
    render(
      <RelationshipDocumentList
        fieldDef={fieldDef}
        targetCollection={targetCollection}
        selectedIds={["a"]}
        drafts={false}
        onSelectionChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /alpha/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /bravo/i })).toBeDisabled();
  });

  it("single-select: choosing the already-selected document clears the selection", async () => {
    const user = userEvent.setup();
    usePaginatedSearchMock.mockReturnValue(baseResult({ documents: [makeDoc("a", "Alpha")] }));
    const onSelectionChange = vi.fn();
    const fieldDef = { ...relationshipFieldFixture.fieldDef, hasMany: false };
    render(
      <RelationshipDocumentList
        fieldDef={fieldDef}
        targetCollection={targetCollection}
        selectedIds={["a"]}
        drafts={false}
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /alpha/i }));
    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });

  it("renders a Load more button wired to loadMore when hasMore is true", async () => {
    const user = userEvent.setup();
    const loadMore = vi.fn();
    usePaginatedSearchMock.mockReturnValue(
      baseResult({ documents: [makeDoc("a", "Alpha")], hasMore: true, loadMore }),
    );
    render(
      <RelationshipDocumentList
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        onSelectionChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Load more" }));
    expect(loadMore).toHaveBeenCalledTimes(1);
  });
});
```

#### packages/react/src/components/relationship/RelationshipPicker.test.tsx

```tsx
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CollectionConfig } from "@vexcms/core";
import { relationshipFieldFixture, relationshipTargetCollection } from "../fields/relationship/testFixture";
import { RelationshipPicker } from "./RelationshipPicker";

vi.mock("./RelationshipDocumentList", () => ({
  RelationshipDocumentList: ({
    selectedIds,
    onSelectionChange,
  }: {
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
  }) => (
    <div>
      <p>document list ({selectedIds.length} selected)</p>
      <button type="button" onClick={() => onSelectionChange([...selectedIds, "doc-new"])}>
        pick doc-new
      </button>
    </div>
  ),
}));

vi.mock("../modals/CreateDocumentForm", () => ({
  CreateDocumentForm: ({
    onCreated,
    onCancel,
    onSubmittingChange,
  }: {
    onCreated: (id: string) => void;
    onCancel: () => void;
    onSubmittingChange?: (isSubmitting: boolean) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onCreated("doc-created")}>
        finish create
      </button>
      <button type="button" onClick={onCancel}>
        cancel create
      </button>
      <button type="button" onClick={() => onSubmittingChange?.(true)}>
        start submit
      </button>
      <button type="button" onClick={() => onSubmittingChange?.(false)}>
        end submit
      </button>
    </div>
  ),
}));

const targetCollection = relationshipTargetCollection as CollectionConfig;

describe("RelationshipPicker", () => {
  it("opens on the Select tab by default and lists the document picker", () => {
    render(
      <RelationshipPicker
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        onSelect={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("document list (0 selected)")).toBeInTheDocument();
  });

  it('opens directly on the Create tab when defaultTab is "create"', () => {
    render(
      <RelationshipPicker
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        defaultTab="create"
        onSelect={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "finish create" })).toBeInTheDocument();
  });

  it("calls onSelect with the current selection when Select is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <RelationshipPicker
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={["doc-1"]}
        drafts={false}
        onSelect={onSelect}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "pick doc-new" }));
    await user.click(screen.getByRole("button", { name: "Select 2" }));

    expect(onSelect).toHaveBeenCalledWith(["doc-1", "doc-new"]);
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <RelationshipPicker
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        onSelect={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("hasMany: creating a document auto-selects it and returns to the Select tab instead of closing", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <RelationshipPicker
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        defaultTab="create"
        onSelect={onSelect}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "finish create" }));

    expect(onSelect).not.toHaveBeenCalled();
    expect(await screen.findByText("document list (1 selected)")).toBeInTheDocument();
  });

  it("single-select: creating a document calls onSelect immediately instead of returning to Select", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const singleFieldDef = { ...relationshipFieldFixture.fieldDef, hasMany: false };
    render(
      <RelationshipPicker
        fieldDef={singleFieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        defaultTab="create"
        onSelect={onSelect}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "finish create" }));
    expect(onSelect).toHaveBeenCalledWith(["doc-created"]);
  });

  it("blocks dismissal while CreateDocumentForm reports an in-flight submit", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <RelationshipPicker
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        selectedIds={[]}
        drafts={false}
        defaultTab="create"
        onSelect={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "start submit" }));
    await user.keyboard("{Escape}");
    expect(onCancel).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "end submit" }));
    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
```

#### packages/react/src/components/modals/CreateDocumentForm.tsx

Extracted from `CreateDocumentModal`'s body — same quick-create behavior (required
fields only, double-submit guard), now usable standalone inside the relationship
picker's Create tab.

```tsx
"use client";

import { useRef, useState } from "react";
import { Button, DialogFooter } from "../ui";
import type { CollectionConfig } from "@vexcms/core";
import { vexConvexApi } from "@vexcms/core";
import { AppForm } from "../form/AppForm";
import { RenderFields } from "../form/RenderFields";
import { useFieldsForm, useVexMutation } from "../../hooks";

/**
 * Props for {@link CreateDocumentForm}.
 */
export interface CreateDocumentFormProps {
  /** The collection the new document will be created in. */
  collection: CollectionConfig;
  /** Called with the new document's id once the create mutation resolves. */
  onCreated: (id: string) => void;
  /** Called when the form is cancelled. */
  onCancel: () => void;
  /**
   * Called whenever the in-flight submit state changes — lets a host (a
   * modal, the relationship picker's Create tab) veto its own dismissal
   * while a create is in flight, the same guard `CreateDocumentModal` had
   * before this form was extracted.
   */
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

/**
 * Quick-create form for a single document — renders only `collection`'s
 * required fields (non-required fields keep their configured defaults and are
 * filled in later from the edit view) and calls the Convex `create` mutation
 * on submit.
 *
 * Guards against a second submit firing while the first is still in flight:
 * `onSubmitCapture` on the wrapping `<div>` runs in the capture phase, ahead
 * of `AppForm`'s own `onSubmit`, so the second event never reaches
 * `form.handleSubmit()`.
 *
 * @param props - Component props.
 * @returns The field inputs plus a Create/Cancel footer.
 */
export function CreateDocumentForm({
  collection,
  onCreated,
  onCancel,
  onSubmittingChange,
}: CreateDocumentFormProps) {
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const endSubmit = () => {
    isSubmittingRef.current = false;
    setIsSubmitting(false);
    onSubmittingChange?.(false);
  };

  const { mutateAsync, isPending } = useVexMutation({
    collection: collection.slug,
    getChanges: ({ args, result }) => [{ after: { ...args.data, _id: result } }],
    mutationFn: vexConvexApi.create,
    operation: "create",
    errorToast: { message: `Failed to create ${collection.labels.singular}` },
  });

  const fieldKeys = Object.entries(collection.fields)
    .filter(([, fieldDef]) => fieldDef.required)
    .map(([fieldKey]) => fieldKey);

  const form = useFieldsForm({
    fields: collection.fields,
    readableFieldKeys: fieldKeys,
    onSubmit: async ({ value }) => {
      let id: string;
      try {
        id = await mutateAsync({ collection: collection.slug, data: value });
      } finally {
        endSubmit();
      }
      onCreated(id);
    },
    onSubmitInvalid: endSubmit,
  });

  return (
    <div
      onSubmitCapture={(event) => {
        if (isSubmittingRef.current) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        isSubmittingRef.current = true;
        setIsSubmitting(true);
        onSubmittingChange?.(true);
      }}
    >
      <AppForm form={form} className="flex h-full flex-col overflow-hidden">
        <div className="flex grow flex-col gap-2 overflow-y-auto px-2">
          <RenderFields fields={collection.fields} collection={collection} fieldKeys={fieldKeys} />
        </div>
        <DialogFooter className="p-1">
          <Button isPending={isPending || isSubmitting} type="submit">
            Create
          </Button>
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
        </DialogFooter>
      </AppForm>
    </div>
  );
}
```

#### packages/react/src/components/modals/CreateDocumentModal.tsx

Existing file — by this step, Step 9 has already swapped this file's
`RenderFieldInputComponents` import/usage for `RenderFields` (its own two-edit
change to this file). The whole `CreateDocumentModal` function body is
replaced here — it now resolves the collection and delegates everything else
(fields, `RenderFields` call, form, mutation, double-submit guard) to
`CreateDocumentForm`, keeping the `dismissible={!isSubmitting}` guard wired
through `CreateDocumentForm`'s `onSubmittingChange`. Every other top-of-file
import not shown below is dropped (`useFieldsForm`, `useVexMutation`,
`RenderFields`, `vexConvexApi`).

```tsx
"use client";

import { useRef, useState } from "react";
import { DialogContent, DialogHeader } from "../ui";
import { Modal } from "./BaseModal";
import { type CollectionSlug } from "@vexcms/core";
import { MODALS } from "./constants";
import { CreateDocumentForm } from "./CreateDocumentForm";
import { useVexConfig } from "../../context/VexConfigContext";
import { parseAsBoolean, useQueryState } from "nuqs";

/**
 * Modal for creating a new document in a collection.
 *
 * Opens when `?createNew=true` is in the URL (see `MODALS.createDocument`).
 * Renders `CreateDocumentForm`, closing by clearing the URL param on both
 * create and cancel.
 *
 * @param props - Component props.
 * @param props.collection - The slug of the collection the new document will be created in.
 * @returns A URL-state-driven `<Modal>` containing the creation form, or `null`
 *   when `collection` does not resolve against the current config.
 * @throws Never — resolution failure renders `null` instead of throwing.
 */
export function CreateDocumentModal(props: { collection: CollectionSlug }) {
  const config = useVexConfig();
  const collection = config.collections.find((c) => c.slug === props.collection);

  // eslint-disable-next-line no-unused-vars
  const [_, setOpen] = useQueryState(MODALS.createDocument.urlParam, parseAsBoolean);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  if (!collection) {
    return null;
  }

  return (
    <Modal urlParam={MODALS.createDocument.urlParam} dismissible={!isSubmitting}>
      <DialogContent
        ref={dialogRef}
        initialFocus={dialogRef}
        className="flex h-[80svh] w-full flex-col sm:h-[50svh] sm:w-[50svw]"
      >
        <DialogHeader className="px-2 pb-4">Create {collection.labels.singular}</DialogHeader>
        <CreateDocumentForm
          collection={collection}
          onCreated={() => setOpen(null)}
          onCancel={() => setOpen(null)}
          onSubmittingChange={setIsSubmitting}
        />
      </DialogContent>
    </Modal>
  );
}
```

#### packages/react/src/components/modals/constants.ts

**1 — `MODALS`.** Adds `relationshipPicker`, mirroring `editMedia` (Decision 9: a
URL param holding the field `name` currently being edited, not a boolean).
Anchored on the `editBlocks` entry, the last one before the closing `} as const`.

```ts
export const MODALS = {
  createDocument: {
    /** URL search param that controls the create-document modal (`?createNew=true`). */
    urlParam: "createNew",
    /** Label for the create-document modal's submit button. */
    label: "Create",
  },
  uploadMedia: {
    /** URL search param that controls the media upload modal (`?upload=true`). */
    urlParam: "upload",
    /** Label for the media upload modal's primary action. */
    label: "Upload",
  },
  editMedia: {
    urlParam: "editMedia",
    label: "Edit",
  },
  editBlocks: {
    urlParam: "editBlocks",
    label: "Edit",
  },
  relationshipPicker: {
    /** URL search param holding the name of the relationship field currently being edited. */
    urlParam: "relationship",
    label: "Select",
  },
} as const;

/** Union of all URL parameter strings used to control admin modals. */
export type ModalURLParam = (typeof MODALS)[keyof typeof MODALS]["urlParam"];
```

#### packages/react/src/components/modals/index.tsx

**1 — add the `CreateDocumentForm` export**, alongside the existing
`CreateDocumentModal` export.

```tsx
export * from "./constants";
export * from "./BaseModal";
export * from "./CreateDocumentModal";
export * from "./CreateDocumentForm";
export * from "./CreateMediaModal";
```

#### packages/react/src/components/modals/CreateDocumentForm.test.tsx

```tsx
import "@testing-library/jest-dom/vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider, type ConvexReactClient } from "convex/react";
import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { defineCollection, defineConfig, text } from "@vexcms/core";

import { renderWithVexProviders, testCollection } from "../../testing/harness/accessFixtures";
import { createFakeConvexClient, type ConvexTestInstance } from "../../testing/convex/bridge";
import schema, { readTable, testModules } from "../../testing/convex/schema";
import { CreateDocumentForm } from "./CreateDocumentForm";

/**
 * Same shape as `modalSuite.tsx`'s `createModalTestCollection`: `status` is
 * required so there is a control to type into and submit through — a quick
 * create renders only required fields.
 */
const createFormTestCollection = defineCollection({
  slug: testCollection.slug,
  fields: {
    status: text({ index: "by_status", required: true }),
    title: text({ required: false }),
  },
});

function buildConvexStack(t: ConvexTestInstance): {
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
} {
  const convexClient = createFakeConvexClient(t) as ConvexReactClient;
  const convexQueryClient = new ConvexQueryClient(convexClient);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { queryFn: convexQueryClient.queryFn(), retry: false } },
  });
  convexQueryClient.connect(queryClient);
  return { queryClient, convexClient };
}

function renderForm(
  overrides: {
    onCreated?: (id: string) => void;
    onCancel?: () => void;
    onSubmittingChange?: (isSubmitting: boolean) => void;
  } = {},
) {
  const t = convexTest(schema, testModules);
  const { queryClient, convexClient } = buildConvexStack(t);
  const onCreated = overrides.onCreated ?? vi.fn();
  const onCancel = overrides.onCancel ?? vi.fn();
  const utils = renderWithVexProviders(
    <ConvexProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>
        <CreateDocumentForm
          collection={createFormTestCollection}
          onCreated={onCreated}
          onCancel={onCancel}
          onSubmittingChange={overrides.onSubmittingChange}
        />
      </QueryClientProvider>
    </ConvexProvider>,
    { config: defineConfig({ collections: [createFormTestCollection] }) },
  );
  return { ...utils, t, onCreated, onCancel };
}

function createdDocuments(t: ConvexTestInstance) {
  return readTable(t as never, "documents");
}

describe("CreateDocumentForm", () => {
  it("renders a control for the required field only", () => {
    renderForm();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^title/i)).not.toBeInTheDocument();
  });

  it("creates the document and calls onCreated with the new id", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    const { t } = renderForm({ onCreated });

    await user.type(screen.getByLabelText(/status/i), "draft");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    const docs = await createdDocuments(t);
    expect(docs).toHaveLength(1);
    expect(docs[0]?.status).toBe("draft");
    expect(onCreated).toHaveBeenCalledWith(docs[0]?._id);
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderForm({ onCancel });

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("reports isSubmitting true around the create mutation, then false once it resolves", async () => {
    const user = userEvent.setup();
    const onSubmittingChange = vi.fn();
    renderForm({ onSubmittingChange });

    await user.type(screen.getByLabelText(/status/i), "draft");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(onSubmittingChange).toHaveBeenLastCalledWith(false));
    expect(onSubmittingChange).toHaveBeenCalledWith(true);
    expect(onSubmittingChange.mock.calls.map((call) => call[0])).toEqual([true, false]);
  });

  it("ignores a second rapid submit while the first is still in flight", async () => {
    const onCreated = vi.fn();
    const { t } = renderForm({ onCreated });

    await userEvent.type(screen.getByLabelText(/status/i), "draft");
    const form = screen.getByRole("button", { name: "Create" }).closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    const docs = await createdDocuments(t);
    expect(docs).toHaveLength(1);
  });
});
```

#### packages/react/src/components/fields/relationship/types.ts

Existing file. Drops `RelationshipOption` — it was only the old popover
combobox's chip-row type; nothing in the new Empty/Filled/picker surface uses
it (rows resolve full `VexDocument`s directly through `get`/`usePaginatedSearch`).

```ts
export type { RelationshipPreviewProps } from "@vexcms/core";
```

#### packages/react/src/components/fields/relationship/EmptyInput.tsx

```tsx
"use client";

import { Button } from "../../ui";
import type { CollectionConfig, RelationshipField } from "@vexcms/core";

/**
 * Props for {@link RelationshipEmpty}.
 */
export interface RelationshipEmptyProps {
  /** The resolved relationship field definition. */
  fieldDef: RelationshipField;
  /** The resolved target collection. */
  targetCollection: CollectionConfig;
  /** Whether the field is non-editable. */
  readOnly: boolean;
  /** Opens the picker dialog on the given tab. */
  onPickerOpen: (defaultTab: "select" | "create") => void;
}

/**
 * Empty state for the relationship field — a dashed dropzone-style box with
 * "Select …" (opens the picker's Select tab) and "Create …" (opens its Create
 * tab) buttons. Matches `UploadEmpty`'s layout.
 *
 * @param props - Component props.
 * @returns The empty-state box.
 */
export function RelationshipEmpty({
  fieldDef,
  targetCollection,
  readOnly,
  onPickerOpen,
}: RelationshipEmptyProps) {
  const label = fieldDef.hasMany ? targetCollection.labels.plural : targetCollection.labels.singular;
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-input p-8 text-center">
      <p className="text-sm text-muted-foreground">No {label.toLowerCase()} selected</p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          icon="Search"
          onClick={() => onPickerOpen("select")}
          disabled={readOnly}
        >
          Select {label}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon="Plus"
          onClick={() => onPickerOpen("create")}
          disabled={readOnly}
        >
          Create {targetCollection.labels.singular}
        </Button>
      </div>
    </div>
  );
}
```

#### packages/react/src/components/fields/relationship/FilledInput.tsx

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { GenericId } from "convex/values";
import {
  type CollectionConfig,
  type CollectionSlug,
  type DateField,
  type RelationshipField,
  type VexDocument,
  VexAccessError,
} from "@vexcms/core";
import { Button, Draggable, DragHandle, Droppable, Skeleton } from "../../ui";
import { get } from "../../../client";
import { resolveRelationshipPreview } from "./preview";
import { formatDateFieldValue } from "../date/utils";
import { cn } from "../../../styles/utils";

/**
 * Resolved `time` config matching `updatedAt`'s injected definition
 * (`packages/core/src/collections/config.ts`, Decision 3) — the only shape a
 * target document's `updatedAt` can ever carry.
 */
const UPDATED_AT_TIME: DateField["time"] = {
  hidden: false,
  use12HourFormat: true,
  timePicker: { hour: true, minute: true, second: true },
};

/**
 * Props for {@link RelationshipFilledState}.
 */
export interface RelationshipFilledStateProps {
  /** The resolved relationship field definition. */
  fieldDef: RelationshipField;
  /** The resolved target collection. */
  targetCollection: CollectionConfig;
  /** Selected document ids, in display order. */
  docIds: string[];
  /** Whether draft target documents are visible. */
  drafts: boolean;
  /** Whether the field is non-editable. */
  readOnly?: boolean;
  /** Removes a single document from the selection. */
  onRemove: (docId: string) => void;
  /** Reorders the selection (multi only). Omit to disable drag reorder. */
  onReorder?: (from: number, to: number) => void;
  /** Clears the selection entirely. */
  onClear: () => void;
  /** Opens the picker dialog (Edit button). */
  openPicker: () => void;
}

/**
 * Filled state for the relationship field — handles both single and multi
 * selection, mirroring `UploadFilledState`.
 *
 * Each row independently resolves its document via `get` (pending skeleton,
 * access-error message, or the resolved preview + "Updated …" line when the
 * target collection declares `updatedAt`), exactly like `UploadItemRow`.
 * Multi mode additionally shows drag-to-reorder handles (when `onReorder` is
 * provided) and an Edit/Clear/`n/max` footer.
 *
 * @param props - Component props.
 * @returns The list of item rows plus Edit/Clear controls and a count indicator.
 */
export function RelationshipFilledState({
  fieldDef,
  targetCollection,
  docIds,
  drafts,
  readOnly = false,
  onRemove,
  onReorder,
  onClear,
  openPicker,
}: RelationshipFilledStateProps) {
  const atLimit = fieldDef.max !== undefined && docIds.length >= fieldDef.max[0];
  const label = fieldDef.hasMany ? targetCollection.labels.plural : targetCollection.labels.singular;

  return (
    <div className="flex flex-col gap-2">
      {fieldDef.hasMany && onReorder ? (
        <Droppable id={`relationship-${fieldDef.label}`} onReorder={onReorder}>
          {docIds.map((id, index) => (
            <Draggable key={id} id={id} index={index}>
              <RelationshipItemRow
                readOnly={readOnly}
                docId={id}
                fieldDef={fieldDef}
                targetCollection={targetCollection}
                drafts={drafts}
                onRemove={() => onRemove(id)}
                showDragHandle
              />
            </Draggable>
          ))}
        </Droppable>
      ) : (
        <div className="flex flex-col gap-2">
          {docIds.map((id) => (
            <RelationshipItemRow
              readOnly={readOnly}
              key={id}
              docId={id}
              fieldDef={fieldDef}
              targetCollection={targetCollection}
              drafts={drafts}
              onRemove={() => onRemove(id)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={openPicker}
          disabled={readOnly || atLimit}
          icon="FilePenLine"
        >
          Edit {label}
        </Button>
        <Button
          variant="ghost"
          className="transition-all duration-300 hover:text-destructive"
          size="sm"
          onClick={onClear}
          disabled={readOnly || docIds.length === 0}
          icon="X"
        >
          Clear
        </Button>
        {fieldDef.max && (
          <span
            className={`${atLimit ? "text-destructive" : "text-muted-foreground"} ml-auto font-mono text-[11px]`}
          >
            {docIds.length}/{fieldDef.max[0]}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Individual item row in the relationship field — resolves its own document
 * via `get`, mirroring `UploadItemRow`'s skeleton/access-error pattern.
 *
 * @param props - Component props.
 * @returns The row's drag handle, preview (or skeleton/access-error), the
 *   "Updated …" line when the target has `updatedAt`, and a remove button.
 */
function RelationshipItemRow({
  docId,
  fieldDef,
  targetCollection,
  drafts,
  readOnly,
  onRemove,
  showDragHandle = false,
}: {
  docId: string;
  fieldDef: RelationshipField;
  targetCollection: CollectionConfig;
  drafts: boolean;
  readOnly: boolean;
  onRemove: () => void;
  showDragHandle?: boolean;
}) {
  const { data: doc, error } = useQuery({
    ...get({ id: docId as GenericId<CollectionSlug>, collection: targetCollection.slug, drafts }),
  });
  const document = doc as VexDocument | null | undefined;

  const accessError = (error as ReturnType<typeof useQuery<any, VexAccessError>>["error"])?.data;
  const Preview = resolveRelationshipPreview({ fieldDef, targetCollection });
  const updatedAt =
    document &&
    "updatedAt" in targetCollection.fields &&
    typeof (document as Record<string, unknown>).updatedAt === "number"
      ? ((document as Record<string, unknown>).updatedAt as number)
      : undefined;

  return (
    <div className="flex items-center justify-between rounded border-2 border-border px-2">
      <div className="flex w-full items-center gap-2 font-mono">
        <DragHandle
          className={cn(!showDragHandle && "opacity-0 pointer-events-none")}
          disabled={readOnly || Boolean(accessError)}
        />
        {!document ? (
          !accessError ? (
            <Skeleton className="h-10 w-10" />
          ) : (
            <p className="w-full text-center text-destructive">{accessError.message}</p>
          )
        ) : (
          <div className="flex min-w-0 flex-col py-1.5">
            <span className="truncate">
              <Preview doc={document} fieldKey="_id" config={targetCollection as never} />
            </span>
            {updatedAt !== undefined && (
              <span className="text-xs text-muted-foreground">
                Updated {formatDateFieldValue({ value: updatedAt, time: UPDATED_AT_TIME })}
              </span>
            )}
          </div>
        )}
        {!document && !accessError && <Skeleton className="h-4 w-xs" />}
      </div>
      <Button
        variant="ghost"
        className="transition-colors duration-300 hover:text-destructive"
        type="button"
        title="Remove"
        onClick={onRemove}
        disabled={readOnly || Boolean(accessError)}
        icon="X"
        iconPosition="center"
      />
    </div>
  );
}
```

#### packages/react/src/components/fields/relationship/Input.tsx

```tsx
"use client";

import { useState } from "react";
import { parseAsString, useQueryState } from "nuqs";
import type { CollectionFieldMeta, RelationshipField, VexResourceSlug } from "@vexcms/core";
import { VERSION_STATUSES } from "@vexcms/core";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormError } from "../../form/FormError";
import { useVexConfig } from "../../../context/VexConfigContext";
import { RelationshipPicker } from "../../relationship";
import { MODALS } from "../../modals/constants";
import { RelationshipEmpty } from "./EmptyInput";
import { RelationshipFilledState } from "./FilledInput";

/**
 * Relationship field input — empty / filled / read-only state switch, mirroring
 * `UploadFieldInput` (Decision 9).
 *
 * The picker dialog is driven by `MODALS.relationshipPicker`'s URL param
 * (`?relationship=<field name>`), the same `activeField === name` pattern the
 * upload field uses for `editMedia`. Target drafts are visible only while the
 * document being edited is itself a draft (`documentStatus === "draft"`) —
 * carried over unchanged from the previous combobox implementation.
 *
 * Renders inside a `role="group" aria-labelledby` wrapper in every state
 * (LABEL-1), same reasoning as `UploadFieldInput`: once the field has more
 * than one focusable control, a single `<label htmlFor>` can't associate with
 * all of them.
 *
 * @param props - Field input component props.
 * @returns The relationship field input element.
 */
export const RelationshipFieldInput = createFieldInput<
  string[],
  CollectionFieldMeta,
  RelationshipField<VexResourceSlug, CollectionFieldMeta>
>(({ name, readOnly, fieldDef, field, index, submissionAttempts, documentStatus }) => {
  const config = useVexConfig();
  const [activeField, setActiveField] = useQueryState(
    MODALS.relationshipPicker.urlParam,
    parseAsString,
  );
  const [defaultTab, setDefaultTab] = useState<"select" | "create">("select");
  const isOpen = activeField === name;
  const isReadOnly = readOnly || fieldDef.admin.readOnly;
  const drafts = documentStatus === VERSION_STATUSES.draft.key;
  const value: string[] = field.state.value ?? [];

  const targetCollection = config.collections.find((c) => c.slug === fieldDef.collection.slug);

  const label = (
    <span
      id={`${name}-label`}
      className="relative flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
    >
      {index !== undefined ? `[${index + 1}] - ` : ""}
      {fieldDef.label || name}
      {fieldDef.required && <span className="text-red-500">*</span>}
    </span>
  );

  if (!targetCollection) {
    return (
      <div className="flex flex-col gap-1.5" role="group" aria-labelledby={`${name}-label`}>
        {label}
        <p className="text-xs text-destructive">
          Unknown collection: <code>{fieldDef.collection.slug}</code>
        </p>
      </div>
    );
  }

  async function openPicker(tab: "select" | "create" = "select") {
    setDefaultTab(tab);
    await setActiveField(name);
  }

  async function closePicker() {
    await setActiveField(null);
  }

  function handleSelect(ids: string[]) {
    field.handleChange(ids);
    void closePicker();
  }

  function handleRemove(docId: string) {
    field.handleChange(value.filter((id) => id !== docId));
  }

  function handleClear() {
    field.handleChange([]);
  }

  function handleReorder(from: number, to: number) {
    field.moveValue(from, to);
  }

  if (isReadOnly) {
    return (
      <div
        className="flex flex-col gap-1.5"
        role="group"
        aria-labelledby={`${name}-label`}
        aria-disabled={isReadOnly}
      >
        {label}
        {value.length > 0 ? (
          <RelationshipFilledState
            fieldDef={fieldDef}
            targetCollection={targetCollection}
            docIds={value}
            drafts={drafts}
            readOnly
            onRemove={handleRemove}
            onClear={handleClear}
            openPicker={() => void openPicker()}
          />
        ) : (
          <div className="text-sm text-muted-foreground">—</div>
        )}
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-1.5"
      role="group"
      aria-labelledby={`${name}-label`}
      aria-disabled={isReadOnly}
    >
      {label}
      {value.length === 0 ? (
        <RelationshipEmpty
          fieldDef={fieldDef}
          targetCollection={targetCollection}
          readOnly={isReadOnly}
          onPickerOpen={(tab) => void openPicker(tab)}
        />
      ) : (
        <RelationshipFilledState
          fieldDef={fieldDef}
          targetCollection={targetCollection}
          docIds={value}
          drafts={drafts}
          readOnly={isReadOnly}
          onRemove={handleRemove}
          onReorder={fieldDef.hasMany ? handleReorder : undefined}
          onClear={handleClear}
          openPicker={() => void openPicker()}
        />
      )}
      <FormDescription field={fieldDef} />
      <FormError field={field} submissionAttempts={submissionAttempts} />
      {isOpen && (
        <RelationshipPicker
          fieldDef={fieldDef}
          targetCollection={targetCollection}
          selectedIds={value}
          drafts={drafts}
          defaultTab={defaultTab}
          onSelect={handleSelect}
          onCancel={() => void closePicker()}
        />
      )}
    </div>
  );
});
```

#### packages/react/src/components/fields/relationship/index.ts

**1 — add `EmptyInput`/`FilledInput` exports.**

```ts
export * from "./Input";
export * from "./Cell";
export * from "./columnDef";
export * from "./types";
export * from "./EmptyInput";
export * from "./FilledInput";
```

#### packages/react/src/components/fields/relationship/testFixture.ts

Existing file. Drops `relationshipTargetCollectionByCreationTime` — it existed
only to exercise `useRelationshipPickerOptions`'s now-deleted searchable/
non-searchable branch split, which is `usePaginatedSearch`'s own concern (Step
11) now, not this field's. `relationshipTargetCollection`/`relationshipFieldFixture`
are unchanged except for their doc comments, which no longer reference the
deleted hook or the old popover combobox.

```ts
import {
  defineCollection,
  relationship,
  text,
  type CollectionFieldMeta,
  type RelationshipField,
} from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";
import { testCollection } from "../../../testing/harness/accessFixtures";
import type { VexResourceSlug } from "@vexcms/core";

/**
 * Target collection for the relationship picker under test. Its slug
 * ("documents") and `admin.useAsTitle: "title"` match the `documents` table
 * and `search_title` index seeded by the convex-test bridge
 * (`testing/convex/schema.ts`). Labels are set explicitly rather than
 * relying on `defineCollection`'s auto-pluralization of an already-plural
 * slug.
 */
export const relationshipTargetCollection = defineCollection({
  slug: "documents",
  labels: { singular: "Document", plural: "Documents" },
  fields: { title: text({ required: true }) },
  admin: { useAsTitle: "title" },
});

/**
 * `meta.collectionSlug` mirrors what `defineCollection` stamps onto every
 * field it owns (`populateCollectionFieldMeta` in `collections/config.ts`) —
 * here, the shared harness's `testCollection` ("posts"), standing in for
 * the collection this relationship field is rendered as part of.
 */
const fieldDef = relationship<VexResourceSlug, CollectionFieldMeta>({
  collection: { slug: "documents" },
  hasMany: true,
  required: true,
  meta: { collectionSlug: testCollection.slug },
});

/**
 * `valid`/`invalid`/`empty` only exercise the shared contract's generic
 * assertions — `runFieldInputContractSuite`'s bare `<AppForm>` harness
 * doesn't wire `VexConfigContext`, so those generic states render
 * `RelationshipFieldInput`'s "Unknown collection" guard regardless of the
 * value. The real empty/filled/picker surface is covered by this field's own
 * `Input.test.tsx`/`EmptyInput.test.tsx`/`FilledInput.test.tsx` and
 * `components/relationship/*.test.tsx`, rendered with `VexConfigContext` and
 * the convex-test bridge wired in against real seeded documents.
 */
export const relationshipFieldFixture: FieldFixture<RelationshipField<VexResourceSlug, CollectionFieldMeta>, string[]> = {
  fieldType: "relationship",
  fieldDef,
  valid: ["kg2fake00000000000000001;documents"],
  invalid: undefined,
  empty: [],
};
```

#### packages/react/src/components/fields/relationship/EmptyInput.test.tsx

```tsx
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CollectionConfig } from "@vexcms/core";
import { relationshipFieldFixture, relationshipTargetCollection } from "./testFixture";
import { RelationshipEmpty } from "./EmptyInput";

const targetCollection = relationshipTargetCollection as CollectionConfig;

describe("RelationshipEmpty", () => {
  it("renders Select/Create buttons labeled with the target collection's labels", () => {
    render(
      <RelationshipEmpty
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        readOnly={false}
        onPickerOpen={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Select Documents" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Document" })).toBeInTheDocument();
  });

  it("calls onPickerOpen with the matching tab for each button", async () => {
    const user = userEvent.setup();
    const onPickerOpen = vi.fn();
    render(
      <RelationshipEmpty
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        readOnly={false}
        onPickerOpen={onPickerOpen}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Select Documents" }));
    expect(onPickerOpen).toHaveBeenLastCalledWith("select");

    await user.click(screen.getByRole("button", { name: "Create Document" }));
    expect(onPickerOpen).toHaveBeenLastCalledWith("create");
  });

  it("disables both buttons when readOnly", () => {
    render(
      <RelationshipEmpty
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        readOnly
        onPickerOpen={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Select Documents" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Create Document" })).toBeDisabled();
  });
});
```

#### packages/react/src/components/fields/relationship/FilledInput.test.tsx

```tsx
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider, type ConvexReactClient } from "convex/react";
import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import type { CollectionConfig, CollectionFieldMeta, RelationshipField, VexResourceSlug } from "@vexcms/core";

import { createFakeConvexClient } from "../../../testing/convex/bridge";
import schema, { testModules } from "../../../testing/convex/schema";
import { relationshipFieldFixture, relationshipTargetCollection } from "./testFixture";
import { RelationshipFilledState } from "./FilledInput";
import { DndProvider } from "../../ui/dnd";

const targetCollection = relationshipTargetCollection as CollectionConfig;

async function renderFilled(
  overrides: {
    fieldDef?: RelationshipField<VexResourceSlug, CollectionFieldMeta>;
    docIds?: string[];
    readOnly?: boolean;
    onReorder?: (from: number, to: number) => void;
  } = {},
) {
  const t = convexTest(schema, testModules);
  const seededIds: string[] = [];
  await t.run(async (ctx) => {
    for (const title of ["Alpha", "Bravo"]) {
      seededIds.push(await ctx.db.insert("documents", { title }));
    }
  });

  const convexClient = createFakeConvexClient(t) as ConvexReactClient;
  const convexQueryClient = new ConvexQueryClient(convexClient);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { queryFn: convexQueryClient.queryFn(), retry: false } },
  });
  convexQueryClient.connect(queryClient);

  const onRemove = vi.fn();
  const onClear = vi.fn();
  const openPicker = vi.fn();

  const utils = render(
    <ConvexProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>
        <DndProvider>
          <RelationshipFilledState
            fieldDef={overrides.fieldDef ?? relationshipFieldFixture.fieldDef}
            targetCollection={targetCollection}
            docIds={overrides.docIds ?? seededIds}
            drafts={false}
            readOnly={overrides.readOnly ?? false}
            onRemove={onRemove}
            onReorder={overrides.onReorder}
            onClear={onClear}
            openPicker={openPicker}
          />
        </DndProvider>
      </QueryClientProvider>
    </ConvexProvider>,
  );

  return { ...utils, seededIds, onRemove, onClear, openPicker };
}

describe("RelationshipFilledState", () => {
  it("shows a skeleton before each row's document resolves, then its preview", async () => {
    await renderFilled();
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(await screen.findByText("Alpha")).toBeInTheDocument();
    expect(await screen.findByText("Bravo")).toBeInTheDocument();
  });

  it("shows the n/max counter and disables Edit once at max", async () => {
    const fieldDef = { ...relationshipFieldFixture.fieldDef, max: [2, "Too many"] as const };
    await renderFilled({ fieldDef });
    expect(await screen.findByText("2/2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit documents/i })).toBeDisabled();
  });

  it("calls onRemove with the row's document id", async () => {
    const user = userEvent.setup();
    const { onRemove, seededIds } = await renderFilled();
    await screen.findByText("Alpha");

    await user.click(screen.getAllByTitle("Remove")[0]!);
    expect(onRemove).toHaveBeenCalledWith(seededIds[0]);
  });

  it("calls onClear when Clear is clicked", async () => {
    const user = userEvent.setup();
    const { onClear } = await renderFilled();
    await screen.findByText("Alpha");

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("renders a drag handle per row when hasMany and onReorder are both provided", async () => {
    const { container } = await renderFilled({ onReorder: vi.fn() });
    await screen.findByText("Alpha");
    expect(container.querySelectorAll(".cursor-grab").length).toBe(2);
  });

  it("renders no interactive drag handle when onReorder is omitted", async () => {
    const { container } = await renderFilled({ onReorder: undefined });
    await screen.findByText("Alpha");
    expect(container.querySelectorAll(".cursor-grab").length).toBe(0);
  });
});
```

#### packages/react/src/components/fields/relationship/Input.test.tsx

```tsx
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider, type ConvexReactClient } from "convex/react";
import { convexTest } from "convex-test";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, test, vi } from "vitest";
import {
  defineConfig,
  type CollectionFieldMeta,
  type RelationshipField,
  type VexClientConfig,
  type VexResourceSlug,
} from "@vexcms/core";

import { AppForm } from "../../form/AppForm";
import { VexConfigContext } from "../../../context/VexConfigContext";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { createFakeConvexClient } from "../../../testing/convex/bridge";
import schema, { testModules } from "../../../testing/convex/schema";
import { relationshipFieldFixture, relationshipTargetCollection } from "./testFixture";
import { RelationshipFieldInput } from "./Input";

vi.mock("../../relationship", () => ({
  RelationshipPicker: ({
    fieldDef,
    defaultTab,
    onSelect,
    onCancel,
  }: {
    fieldDef: RelationshipField;
    defaultTab?: "select" | "create";
    onSelect: (ids: string[]) => void;
    onCancel: () => void;
  }) => (
    <div role="dialog" aria-label="relationship picker stub">
      <p>tab: {defaultTab ?? "select"}</p>
      <button type="button" onClick={() => onSelect(["picked-id"])}>
        confirm pick
      </button>
      <button type="button" onClick={onCancel}>
        dismiss picker
      </button>
      <p>hasMany: {String(fieldDef.hasMany)}</p>
    </div>
  ),
}));

/**
 * Seeds `seedTitles` into a fresh convex-test instance, wires the fake convex
 * client through a real `ConvexQueryClient` + `QueryClient`, and renders
 * `RelationshipFieldInput` behind `AppForm` + `VexConfigContext` +
 * `NuqsTestingAdapter` (the picker's open state is URL-driven, `RelationshipPicker`
 * itself is mocked above so this file only exercises `Input.tsx`'s own
 * empty/filled/read-only/draft-gate logic).
 */
async function renderRelationship(
  overrides: {
    fieldDef?: RelationshipField<VexResourceSlug, CollectionFieldMeta>;
    config?: VexClientConfig;
    initialValue?: string[] | ((seededIds: string[]) => string[]);
    readOnly?: boolean;
    documentStatus?: "draft" | "published";
    seedTitles?: string[];
  } = {},
) {
  const t = convexTest(schema, testModules);
  const seededIds: string[] = [];
  await t.run(async (ctx) => {
    for (const title of overrides.seedTitles ?? ["Alpha", "Bravo"]) {
      seededIds.push(await ctx.db.insert("documents", { title }));
    }
  });

  const convexClient = createFakeConvexClient(t) as ConvexReactClient;
  const convexQueryClient = new ConvexQueryClient(convexClient);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { queryFn: convexQueryClient.queryFn(), retry: false } },
  });
  convexQueryClient.connect(queryClient);

  const config = overrides.config ?? defineConfig({ collections: [relationshipTargetCollection] });
  const fieldDef = overrides.fieldDef ?? relationshipFieldFixture.fieldDef;
  const initialValue =
    typeof overrides.initialValue === "function"
      ? overrides.initialValue(seededIds)
      : (overrides.initialValue ?? []);

  function Harness() {
    const form = useForm({ defaultValues: { testField: initialValue } });
    return (
      <ConvexProvider client={convexClient}>
        <QueryClientProvider client={queryClient}>
          <NuqsTestingAdapter>
            <VexConfigContext.Provider value={config}>
              <AppForm form={form}>
                <RelationshipFieldInput
                  name="testField"
                  fieldDef={fieldDef}
                  collection={testCollection}
                  readOnly={overrides.readOnly ?? false}
                  documentStatus={overrides.documentStatus}
                />
              </AppForm>
            </VexConfigContext.Provider>
          </NuqsTestingAdapter>
        </QueryClientProvider>
      </ConvexProvider>
    );
  }

  return { ...render(<Harness />), queryClient, seededIds };
}

function FieldLevelPreview({ doc }: { doc: unknown }) {
  return <span>Field preview: {String((doc as Record<string, unknown>).title)}</span>;
}

runFieldInputContractSuite({
  fixture: relationshipFieldFixture,
  Component: RelationshipFieldInput,
  extra: () => {
    describe("relationship state switch", () => {
      test("renders the missing-target-collection error instead of crashing when the field's target slug isn't registered", async () => {
        await renderRelationship({ config: defineConfig({ collections: [testCollection] }) });

        expect(await screen.findByText(/unknown collection/i)).toBeInTheDocument();
        expect(screen.getByText("documents", { selector: "code" })).toBeInTheDocument();
      });

      test("empty value renders RelationshipEmpty with Select/Create buttons", async () => {
        await renderRelationship({ initialValue: [] });

        expect(await screen.findByRole("button", { name: /select documents/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /create document/i })).toBeInTheDocument();
      });

      test("clicking Select opens the picker on the select tab", async () => {
        const user = userEvent.setup();
        await renderRelationship({ initialValue: [] });

        await user.click(await screen.findByRole("button", { name: /select documents/i }));

        expect(await screen.findByRole("dialog", { name: "relationship picker stub" })).toBeInTheDocument();
        expect(screen.getByText("tab: select")).toBeInTheDocument();
      });

      test("clicking Create opens the picker on the create tab", async () => {
        const user = userEvent.setup();
        await renderRelationship({ initialValue: [] });

        await user.click(await screen.findByRole("button", { name: /create document/i }));

        expect(await screen.findByText("tab: create")).toBeInTheDocument();
      });

      test("picker confirm writes the selection and closes the dialog", async () => {
        const user = userEvent.setup();
        await renderRelationship({ initialValue: [] });

        await user.click(await screen.findByRole("button", { name: /select documents/i }));
        await user.click(await screen.findByRole("button", { name: "confirm pick" }));

        await waitFor(() =>
          expect(screen.queryByRole("dialog", { name: "relationship picker stub" })).not.toBeInTheDocument(),
        );
      });

      test("non-empty value renders RelationshipFilledState with the resolved preview and an Edit button", async () => {
        await renderRelationship({
          seedTitles: ["Alpha"],
          initialValue: (seededIds) => [seededIds[0]!],
        });

        expect(await screen.findByText("Alpha")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /edit documents/i })).toBeInTheDocument();
      });

      test("read-only with an empty value renders an em dash and no Select/Create buttons", async () => {
        await renderRelationship({ readOnly: true, initialValue: [] });

        expect(await screen.findByText("—")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /select documents/i })).not.toBeInTheDocument();
      });

      test("read-only with a value renders RelationshipFilledState in its disabled form", async () => {
        await renderRelationship({
          readOnly: true,
          seedTitles: ["Alpha"],
          initialValue: (seededIds) => [seededIds[0]!],
        });

        expect(await screen.findByText("Alpha")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /edit documents/i })).toBeDisabled();
      });

      test("field-level admin.components.preview overrides the default preview in RelationshipFilledState", async () => {
        const fieldDefWithPreview: RelationshipField<VexResourceSlug, CollectionFieldMeta> = {
          ...relationshipFieldFixture.fieldDef,
          admin: {
            ...relationshipFieldFixture.fieldDef.admin,
            components: { preview: FieldLevelPreview },
          },
        };
        await renderRelationship({
          fieldDef: fieldDefWithPreview,
          seedTitles: ["Alpha"],
          initialValue: (seededIds) => [seededIds[0]!],
        });

        expect(await screen.findByText("Field preview: Alpha")).toBeInTheDocument();
      });
    });
  },
});
```

Verify: `pnpm --filter @vexcms/react test -- fields/relationship relationship`

#### packages/react/src/hooks/useRelationshipPickerOptions.ts

Deleted — its search/list query is `usePaginatedSearch` (Step 11); the relationship
field's picker (`RelationshipDocumentList`) calls that hook directly instead.

#### packages/react/src/hooks/index.ts

**1 — drop the `useRelationshipPickerOptions` barrel export.** (Step 11 already
added `export * from "./usePaginatedSearch";` after `usePaginatedQuery`, kept
unchanged below.)

```ts
export * from "./use-mobile";
export * from "./useAutosave";
export * from "./useFieldsForm";
export * from "./usePermission";
export * from "./useFieldPermissions";
export * from "./useFieldMask";
export * from "./useVisibleFields";
export * from "./useLiveFieldMerge";
export * from "./useResetWhenSaved";
export * from "./useFrameworkComponents";
export * from "./useTableSelection";
export * from "./usePaginatedQuery";
export * from "./usePaginatedSearch";
export { useCanAccessAdminPanel } from "./useCanAccessAdminPanel";
export { ModalSurfaceProvider, useModalSurface } from "./useModalSurface";
export * from "./useVexMutation";
export * from "./useVexRevalidate";
export * from "./useFieldCondition";
```

#### packages/core/src/collections/validator.ts

**1 — add `resolveTitleSearchIndex`, anchored before `collectionConfigToVexSchema`.**

```ts
/**
 * The search index a relationship/upload picker should query when listing
 * candidates from `collection`, derived from that collection's
 * `admin.useAsTitle`.
 */
export interface ResolvedTitleSearchIndex {
  /** The Convex `.searchIndex()` name to query. */
  indexName: string;
  /** The field key the index was built on — always equal to `useAsTitle`. */
  searchField: string;
}

/**
 * Resolves the search index backing a collection's `useAsTitle` field, for
 * use by both schema generation (`collectionConfigToVexSchema`) and the
 * admin picker (`usePaginatedSearch`), so the two agree on a single name.
 *
 * `useAsTitle` is searchable only when it names a field whose type declares
 * `searchIndex` support — `text`, `textarea`, `email` (narrowed via
 * `field.type`, never `"searchIndex" in field`: the factories only ever
 * materialize the `searchIndex` key when one was actually configured, so a
 * presence check alone cannot tell "not this field type" apart from
 * "this type, just unconfigured"). When that field configures its own
 * `searchIndex` (any name), that index is reused as-is. Otherwise the field
 * is searchable but has no manual index, so the auto-generated
 * `search_<useAsTitle>` name is returned. A `useAsTitle` pointing at a
 * Convex system field (`_id`, `_creationTime`) or at a non-searchable field
 * type (number, date, …) returns `undefined` — the picker falls back to
 * `find()`.
 *
 * @param props - Input props.
 * @param props.collection - The collection whose `useAsTitle` is resolved.
 * @returns The index name + search field to query, or `undefined` when
 *   `useAsTitle` has no backing search index.
 */
export function resolveTitleSearchIndex(props: {
  collection: CollectionConfig;
}): ResolvedTitleSearchIndex | undefined {
  const useAsTitle = props.collection.admin.useAsTitle;
  const coreAdminFields: string[] = Object.values(CONVEX_SYSTEM_FIELDS).map((f) => f.slug);
  if (coreAdminFields.includes(useAsTitle)) return undefined;
  const field = props.collection.fields[useAsTitle];
  if (
    field === undefined ||
    (field.type !== ADMIN_FIELDS.text.type &&
      field.type !== ADMIN_FIELDS.textarea.type &&
      field.type !== ADMIN_FIELDS.email.type)
  ) {
    return undefined;
  }
  if (field.searchIndex) {
    return { indexName: field.searchIndex.name, searchField: useAsTitle };
  }
  return { indexName: `search_${useAsTitle}`, searchField: useAsTitle };
}
```

**2 — `collectionConfigToVexSchema` consults the helper instead of string-matching a
generated name.** Anchored at the `relationships.forEach(...)` block that previously
built the auto search index; the rest of the function (field loop, index building,
versions, return) is unchanged.

```ts
  const relationships = getIncomingRelationships({
    collection: props.collection,
    config: props.config,
  });
  if (relationships.length > 0) {
    const titleSearchIndex = resolveTitleSearchIndex({ collection: props.collection });
    if (titleSearchIndex !== undefined) {
      const titleField = props.collection.fields[titleSearchIndex.searchField];
      const hasOwnSearchIndex =
        titleField !== undefined && "searchIndex" in titleField && titleField.searchIndex !== undefined;
      if (!hasOwnSearchIndex) {
        searchIndexes.push(`\t.searchIndex("${titleSearchIndex.indexName}", {\n
        searchField: "${titleSearchIndex.searchField}",\n
        filterFields: []
      })`);
      }
    }
  }
```

#### packages/core/src/collections/validator.test.ts

**1 — the `"emits manual searchIndex with a different name alongside auto search index"`
test (anchored at that `it(...)` title) is replaced** — a custom-named `searchIndex` on the
title field is now reused instead of co-existing with a redundant auto index:

```ts
  it("custom-named searchIndex on the title field is reused — no auto index, exactly one emitted", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: {
        name: text({
          required: true,
          searchIndex: { name: "search_authors_by_name", filterFields: [] },
        }),
      },
      admin: { useAsTitle: "name" },
    });
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: { slug: "authors" } }) },
    });
    const config = defineConfig({ collections: [posts, authors] });
    const output = collectionConfigToVexSchema({ collection: authors, config });
    expect(output).toContain('.searchIndex("search_authors_by_name"');
    expect(output).not.toContain('.searchIndex("search_name"');
    const count = (output.match(/searchIndex/g) ?? []).length;
    expect(count).toBe(1);
  });
```

**2 — two new tests for a non-string `useAsTitle`, anchored after the email-searchIndex
test at the end of the `"collectionConfigToVexSchema — auto search index"` describe block:**

```ts
  it("does NOT emit a search index when useAsTitle is a non-string field (number)", () => {
    const products = defineCollection({
      slug: "products",
      fields: { price: number({ required: true }) },
      admin: { useAsTitle: "price" },
    });
    const orders = defineCollection({
      slug: "orders",
      fields: { product: relationship({ collection: { slug: "products" } }) },
    });
    const config = defineConfig({ collections: [orders, products] });
    const output = collectionConfigToVexSchema({ collection: products, config });
    expect(output).not.toContain(".searchIndex(");
  });

  it("does NOT emit a search index when useAsTitle is a non-string field (date)", () => {
    const events = defineCollection({
      slug: "events",
      fields: { startsAt: date({ required: true }) },
      admin: { useAsTitle: "startsAt" },
    });
    const tickets = defineCollection({
      slug: "tickets",
      fields: { event: relationship({ collection: { slug: "events" } }) },
    });
    const config = defineConfig({ collections: [tickets, events] });
    const output = collectionConfigToVexSchema({ collection: events, config });
    expect(output).not.toContain(".searchIndex(");
  });
```

**3 — a new `"resolveTitleSearchIndex"` describe block, anchored after the
`"collectionConfigToVexSchema — auto search index"` describe block closes:**

```ts
describe("resolveTitleSearchIndex", () => {
  it("returns the auto search_<useAsTitle> name when the title field has no own searchIndex", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text({ required: true }) },
      admin: { useAsTitle: "name" },
    });
    expect(resolveTitleSearchIndex({ collection: authors })).toEqual({
      indexName: "search_name",
      searchField: "name",
    });
  });

  it("returns the field's own searchIndex name when configured", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: {
        name: text({
          required: true,
          searchIndex: { name: "search_authors_by_name", filterFields: [] },
        }),
      },
      admin: { useAsTitle: "name" },
    });
    expect(resolveTitleSearchIndex({ collection: authors })).toEqual({
      indexName: "search_authors_by_name",
      searchField: "name",
    });
  });

  it("returns undefined when useAsTitle is a Convex system field", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text({ required: true }) },
    });
    expect(resolveTitleSearchIndex({ collection: authors })).toBeUndefined();
  });

  it("returns undefined when useAsTitle is a non-searchable field type", () => {
    const products = defineCollection({
      slug: "products",
      fields: { price: number({ required: true }) },
      admin: { useAsTitle: "price" },
    });
    expect(resolveTitleSearchIndex({ collection: products })).toBeUndefined();
  });
});
```

The test file's import line gains `number`, `date`, and `resolveTitleSearchIndex`:

```ts
import { email, text, textarea, number, date } from "../fields";
import { collectionConfigToVexSchema, getIncomingRelationships, resolveTitleSearchIndex } from "./validator";
```

Verify: `pnpm --filter @vexcms/core test -- validator`


Verify: `pnpm --filter @vexcms/react test -- fields/relationship relationship`

### Step 13 — Blocks + array editing actions [agent]

- [ ] `packages/core/src/fields/blocks/utils.ts` — `buildDefaultBlock`, `cloneBlockWithFreshIds`, `coerceBlockToDefinition`
- [ ] `packages/core/src/fields/blocks/utils.test.ts`
- [ ] `packages/core/src/fields/blocks/index.ts` — export the new module
- [ ] `packages/react/src/components/form/BlockActionsMenu.tsx`
- [ ] `packages/react/src/components/form/BlockActionsMenu.test.tsx`
- [ ] `packages/react/src/components/form/FormBlocks.tsx` — menu, insert-at-index picker, collapse/expand all, error marker, `n/max`, per-block `defaultCollapsed`, resolved `canEdit` NOTE, stale comments removed
- [ ] `packages/react/src/components/form/FormBlocks.test.tsx`
- [ ] `packages/react/src/components/form/FormArray.tsx` — duplicate, move up/down, stable item keys
- [ ] `packages/react/src/components/form/FormArray.test.tsx`
- [ ] `packages/react/src/components/fields/blocks/Input.test.tsx` — 2 edits for the `blockName` default-placeholder fix and the actions-menu remove path
- [ ] `packages/react/src/testing/nestedFieldContainer.ts` — 3 edits: the "blocks" `blockName` matcher, the "removes a seeded item" remove path, the readOnly-cascade check exempting the per-block actions menu trigger (step 14 stops disabling it so `Copy` stays reachable)
- [ ] `pnpm --filter @vexcms/core test -- fields/blocks && pnpm --filter @vexcms/react test -- FormBlocks FormArray fields/blocks fields/array`

Why: duplicate / insert above-below / move / collapse-expand all / error markers; per-block `defaultCollapsed` honored.

Depends on step 1 (`fieldDef.max` is already the `FieldLimit` tuple `readonly [value, error]` by this step — every `max`/`min` read below uses `fieldDef.max?.[0]`, not a bare number or a `{ value }` object) and step 9 (`RenderFields` already exists — `FormBlocks`' per-block sub-field loop renders through it, exactly like `FormGroup`'s own sub-field loop, instead of hand-mapping `Object.entries(blockDef.fields)` with `fieldToInputComponent`).

Reads first: `form/FormBlocks.tsx` (519 lines), `form/FormArray.tsx`, `fields/blocks/Input.tsx`, `ui/dropdown-menu.tsx`, `ui/dnd/*`, `core/src/fields/blocks/{types,config}.ts`. `buildDefaultBlock` moves out of `FormBlocks.tsx` into core (contract) and stops seeding `blockName` from the block's `label` — that was swallowing the `placeholder` (`blockDef.label ?? blockDef.blockType`) on every freshly-added block, since the input's `value` was never empty. The `canEdit` NOTE at the old `FormBlocks.tsx:318-325` is resolved by hoisting ONE `usePermission({ resource: collection.slug, action: CRUD_ACTIONS.update, scope: PERMISSION_SCOPES.any })` call — `scope: "any"` (optimistic) because `FormBlocks` has no document in scope, matching `CollectionListView`'s own list-wide/no-document `usePermission` calls, not the per-document `CollectionEditView`/`GlobalEditView` pattern (which has `data` to check against and omits `scope`). The per-block accordion row becomes its own component (`BlockAccordionItem`) so `useFieldErrorCount` — one call per block — stays legal under Rules of Hooks even though `items.length` changes across renders (a hook call inside `.map` would violate it; a hook call inside a per-item component instance does not). `FormArray` gets a `useRef`-held parallel key array because its items are raw values (`string | number | boolean | object`), not `GenericBlock`s with an `id` — every push/duplicate/remove/move/reorder updates both the TanStack Form array and the key array in the same synchronous step.

#### packages/core/src/fields/blocks/utils.ts

New file.

```ts
import { nanoid } from "nanoid";
import { ADMIN_FIELDS } from "../constants";
import { RESERVED_BLOCK_FIELD_NAMES } from "./types";
import type { BlockConfig, GenericBlock } from "./types";
import type { AdminField } from "../types";

/**
 * Builds the default value for a new block of the given type.
 *
 * @param props - Input props.
 * @param props.blockDef - The block type to build a default value for.
 * @returns A new block object with a fresh `id`, `blockType`, and each
 *   sub-field initialised to its `defaultValue` (or `null`). `blockName` is
 *   left unset so the admin UI's placeholder (the block's label) shows.
 */
export function buildDefaultBlock(props: { blockDef: BlockConfig }): GenericBlock {
  const { blockDef } = props;
  const fieldDefaults = Object.fromEntries(
    Object.entries(blockDef.fields).map(([key, subField]) => [key, subField.defaultValue ?? null]),
  );
  return {
    id: nanoid(),
    blockType: blockDef.blockType,
    ...fieldDefaults,
  };
}

/**
 * Recursively regenerates ids on every nested block item reachable through
 * `field` — a nested `blocks()` field, directly or wrapped in `group()`/`array()`.
 * Leaf fields and unrecognised nested `blockType`s are returned unchanged.
 *
 * @param props - Input props.
 * @param props.value - The current value at `field`'s path.
 * @param props.field - The field definition describing `value`'s shape.
 * @returns `value`, with every nested block's `id` (and ITS nested blocks) replaced.
 */
function cloneNestedBlockIds(props: { value: unknown; field: AdminField }): unknown {
  const { value, field } = props;
  if (value == null) return value;
  if (field.type === ADMIN_FIELDS.blocks.type) {
    const blockDefMap = new Map(field.blocks.map((blockDef) => [blockDef.blockType, blockDef]));
    return (value as GenericBlock[]).map((item) => {
      const itemBlockDef = blockDefMap.get(item.blockType as string);
      return itemBlockDef ? cloneBlockWithFreshIds({ block: item, blockDef: itemBlockDef }) : item;
    });
  }
  if (field.type === ADMIN_FIELDS.group.type) {
    const groupValue = (value ?? {}) as Record<string, unknown>;
    const result: Record<string, unknown> = { ...groupValue };
    for (const [key, subField] of Object.entries(field.fields)) {
      if (key in groupValue) {
        result[key] = cloneNestedBlockIds({ value: groupValue[key], field: subField });
      }
    }
    return result;
  }
  if (field.type === ADMIN_FIELDS.array.type) {
    return (value as unknown[]).map((item) => cloneNestedBlockIds({ value: item, field: field.items }));
  }
  return value;
}

/**
 * Clones a block item with a fresh `id`, recursively regenerating ids on
 * every nested block reachable through its own fields.
 *
 * @param props - Input props.
 * @param props.block - The block item to clone.
 * @param props.blockDef - The block type definition `block.blockType` resolves to.
 * @returns A new block object: the same keys as `block`, a fresh top-level
 *   `id`, and fresh ids on every nested block item.
 */
export function cloneBlockWithFreshIds(props: { block: GenericBlock; blockDef: BlockConfig }): GenericBlock {
  const { block, blockDef } = props;
  const cloned: GenericBlock = { ...block, id: nanoid() };
  for (const [key, subField] of Object.entries(blockDef.fields)) {
    if (!(key in cloned)) continue;
    cloned[key] = cloneNestedBlockIds({ value: cloned[key], field: subField });
  }
  return cloned;
}

/**
 * Coerces an arbitrary object (e.g. pasted from the block clipboard) into a
 * valid block of `blockDef`'s shape: a fresh `id`, keys `blockDef` does not
 * declare dropped, and keys it declares but `block` is missing filled with
 * their field default. `blockName` is kept when present and a string. Every
 * nested block reachable through `blockDef`'s own fields also gets a fresh id.
 *
 * @param props - Input props.
 * @param props.block - The untrusted candidate block object.
 * @param props.blockDef - The target field's block type definition to coerce against.
 * @returns The coerced block plus the keys from `block` that were dropped.
 */
export function coerceBlockToDefinition(props: {
  block: Record<string, unknown>;
  blockDef: BlockConfig;
}): { block: GenericBlock; droppedKeys: string[] } {
  const { block, blockDef } = props;
  const droppedKeys: string[] = [];
  const coerced: GenericBlock = {
    id: nanoid(),
    blockType: blockDef.blockType,
    ...Object.fromEntries(
      Object.entries(blockDef.fields).map(([key, subField]) => [key, subField.defaultValue ?? null]),
    ),
  };
  if (typeof block.blockName === "string") {
    coerced.blockName = block.blockName;
  }
  for (const key of Object.keys(block)) {
    if ((RESERVED_BLOCK_FIELD_NAMES as readonly string[]).includes(key)) continue;
    const subField = blockDef.fields[key];
    if (!subField) {
      droppedKeys.push(key);
      continue;
    }
    coerced[key] = cloneNestedBlockIds({ value: block[key], field: subField });
  }
  return { block: coerced, droppedKeys };
}
```

#### packages/core/src/fields/blocks/utils.test.ts

New file.

```ts
import { describe, it, expect } from "vitest";
import { defineBlock, blocks } from "./config";
import { text } from "../text";
import { group } from "../group";
import type { GenericBlock } from "./types";
import { buildDefaultBlock, cloneBlockWithFreshIds, coerceBlockToDefinition } from "./utils";

const paragraphBlock = defineBlock({
  slug: "paragraph",
  label: "Paragraph",
  fields: { text: text() },
});

const itemBlock = defineBlock({
  slug: "item",
  label: "Item",
  fields: { label: text() },
});

const galleryBlock = defineBlock({
  slug: "gallery",
  label: "Gallery",
  fields: {
    items: blocks({ label: "Items", blocks: [itemBlock] }),
    meta: group({ label: "Meta", fields: { inner: blocks({ label: "Inner", blocks: [itemBlock] }) } }),
  },
});

describe("buildDefaultBlock", () => {
  it("seeds a fresh id, the blockType, each field's default, and leaves blockName unset", () => {
    const block = buildDefaultBlock({ blockDef: paragraphBlock });
    expect(block.blockType).toBe("paragraph");
    expect(block.blockName).toBeUndefined();
    expect(typeof block.id).toBe("string");
    expect(block.text).toBe("");
  });

  it("gives two blocks distinct ids", () => {
    const a = buildDefaultBlock({ blockDef: paragraphBlock });
    const b = buildDefaultBlock({ blockDef: paragraphBlock });
    expect(a.id).not.toBe(b.id);
  });
});

describe("cloneBlockWithFreshIds", () => {
  it("clones a flat block with a fresh id, keeping its other fields", () => {
    const source: GenericBlock = { id: "p1", blockType: "paragraph", blockName: "Intro", text: "Hello" };
    const cloned = cloneBlockWithFreshIds({ block: source, blockDef: paragraphBlock });
    expect(cloned.id).not.toBe("p1");
    expect(cloned.blockName).toBe("Intro");
    expect(cloned.text).toBe("Hello");
  });

  it("regenerates ids on a nested blocks field's own items", () => {
    const source: GenericBlock = {
      id: "g1",
      blockType: "gallery",
      items: [{ id: "i1", blockType: "item", label: "A" }],
      meta: { inner: [{ id: "i2", blockType: "item", label: "B" }] },
    };
    const cloned = cloneBlockWithFreshIds({ block: source, blockDef: galleryBlock });
    expect(cloned.id).not.toBe("g1");
    const items = cloned.items as GenericBlock[];
    expect(items).toHaveLength(1);
    expect(items[0]?.id).not.toBe("i1");
    expect(items[0]?.label).toBe("A");
    const inner = (cloned.meta as { inner: GenericBlock[] }).inner;
    expect(inner).toHaveLength(1);
    expect(inner[0]?.id).not.toBe("i2");
    expect(inner[0]?.label).toBe("B");
  });

  it("leaves an unrecognised nested blockType untouched", () => {
    const source: GenericBlock = {
      id: "g1",
      blockType: "gallery",
      items: [{ id: "i1", blockType: "not-registered", label: "A" }],
      meta: { inner: [] },
    };
    const cloned = cloneBlockWithFreshIds({ block: source, blockDef: galleryBlock });
    const items = cloned.items as GenericBlock[];
    expect(items[0]?.id).toBe("i1");
  });
});

describe("coerceBlockToDefinition", () => {
  it("drops keys the block definition does not declare and reports them", () => {
    const { block, droppedKeys } = coerceBlockToDefinition({
      block: { id: "x", blockType: "paragraph", text: "Hello", extra: "nope" },
      blockDef: paragraphBlock,
    });
    expect(droppedKeys).toEqual(["extra"]);
    expect(block.text).toBe("Hello");
    expect(block.id).not.toBe("x");
    expect("extra" in block).toBe(false);
  });

  it("fills a missing declared key with its field default", () => {
    const { block, droppedKeys } = coerceBlockToDefinition({
      block: { id: "x", blockType: "paragraph" },
      blockDef: paragraphBlock,
    });
    expect(droppedKeys).toEqual([]);
    expect(block.text).toBe("");
  });

  it("keeps a string blockName and regenerates nested block ids", () => {
    const { block } = coerceBlockToDefinition({
      block: {
        id: "x",
        blockType: "gallery",
        blockName: "My Gallery",
        items: [{ id: "i1", blockType: "item", label: "A" }],
        meta: { inner: [] },
      },
      blockDef: galleryBlock,
    });
    expect(block.blockName).toBe("My Gallery");
    const items = block.items as GenericBlock[];
    expect(items[0]?.id).not.toBe("i1");
  });

  it("drops a non-string blockName", () => {
    const { block } = coerceBlockToDefinition({
      block: { id: "x", blockType: "paragraph", blockName: 42 },
      blockDef: paragraphBlock,
    });
    expect(block.blockName).toBeUndefined();
  });
});
```

#### packages/core/src/fields/blocks/index.ts

1 edit — add the `utils` re-export; everything else unchanged.

```ts
// Re-export the factory function
export * from "./config";
export * from "./types";
export * from "./validator";
export * from "./inputSchema";
export * from "./utils";
```

#### packages/react/src/components/form/BlockActionsMenu.tsx

New file.

```tsx
"use client";

import {
  CopyIcon,
  ArrowUpToLineIcon,
  ArrowDownToLineIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

/**
 * Per-block actions menu — duplicate, insert above/below, move up/down, remove.
 *
 * Rendered as a sibling of the block's `AccordionPrimitive.Trigger`, never
 * nested inside it (the trigger is itself a button).
 *
 * @param props - Component props.
 * @returns The actions dropdown trigger and its menu content.
 */
export function BlockActionsMenu(props: {
  index: number;
  count: number;
  readOnly: boolean;
  canAdd: boolean;
  blockLabel: string;
  onDuplicate: () => void;
  onInsertAbove: () => void;
  onInsertBelow: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const { index, count, readOnly, canAdd, blockLabel } = props;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={readOnly}
            icon="EllipsisVertical"
            iconPosition="center"
            className="shrink-0 text-muted-foreground"
            aria-label={`${blockLabel} actions`}
          />
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={!canAdd} onClick={props.onDuplicate}>
          <CopyIcon className="size-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canAdd} onClick={props.onInsertAbove}>
          <ArrowUpToLineIcon className="size-4" />
          Insert above
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canAdd} onClick={props.onInsertBelow}>
          <ArrowDownToLineIcon className="size-4" />
          Insert below
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={index === 0} onClick={props.onMoveUp}>
          <ArrowUpIcon className="size-4" />
          Move up
        </DropdownMenuItem>
        <DropdownMenuItem disabled={index === count - 1} onClick={props.onMoveDown}>
          <ArrowDownIcon className="size-4" />
          Move down
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={props.onRemove}>
          <TrashIcon className="size-4" />
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### packages/react/src/components/form/BlockActionsMenu.test.tsx

New file.

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BlockActionsMenu } from "./BlockActionsMenu";

const baseProps = {
  index: 1,
  count: 3,
  readOnly: false,
  canAdd: true,
  blockLabel: "Heading",
  onDuplicate: vi.fn(),
  onInsertAbove: vi.fn(),
  onInsertBelow: vi.fn(),
  onMoveUp: vi.fn(),
  onMoveDown: vi.fn(),
  onRemove: vi.fn(),
};

async function openMenu() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Heading actions" }));
  await screen.findByRole("menu");
  return user;
}

describe("BlockActionsMenu", () => {
  it("invokes each handler when its menu item is clicked", async () => {
    const props = {
      ...baseProps,
      onDuplicate: vi.fn(),
      onInsertAbove: vi.fn(),
      onInsertBelow: vi.fn(),
      onMoveUp: vi.fn(),
      onMoveDown: vi.fn(),
      onRemove: vi.fn(),
    };
    render(<BlockActionsMenu {...props} />);

    let user = await openMenu();
    await user.click(screen.getByRole("menuitem", { name: "Duplicate" }));
    expect(props.onDuplicate).toHaveBeenCalledTimes(1);

    user = await openMenu();
    await user.click(await screen.findByRole("menuitem", { name: "Insert above" }));
    expect(props.onInsertAbove).toHaveBeenCalledTimes(1);

    user = await openMenu();
    await user.click(await screen.findByRole("menuitem", { name: "Insert below" }));
    expect(props.onInsertBelow).toHaveBeenCalledTimes(1);

    user = await openMenu();
    await user.click(await screen.findByRole("menuitem", { name: "Move up" }));
    expect(props.onMoveUp).toHaveBeenCalledTimes(1);

    user = await openMenu();
    await user.click(await screen.findByRole("menuitem", { name: "Move down" }));
    expect(props.onMoveDown).toHaveBeenCalledTimes(1);

    user = await openMenu();
    await user.click(await screen.findByRole("menuitem", { name: "Remove" }));
    expect(props.onRemove).toHaveBeenCalledTimes(1);
  });

  it("does not invoke onMoveUp when the block is already first", async () => {
    const onMoveUp = vi.fn();
    render(<BlockActionsMenu {...baseProps} index={0} count={3} onMoveUp={onMoveUp} />);
    const user = await openMenu();
    await user.click(screen.getByRole("menuitem", { name: "Move up" }));
    expect(onMoveUp).not.toHaveBeenCalled();
  });

  it("does not invoke onMoveDown when the block is already last", async () => {
    const onMoveDown = vi.fn();
    render(<BlockActionsMenu {...baseProps} index={2} count={3} onMoveDown={onMoveDown} />);
    const user = await openMenu();
    await user.click(screen.getByRole("menuitem", { name: "Move down" }));
    expect(onMoveDown).not.toHaveBeenCalled();
  });

  it("does not invoke onDuplicate/onInsertAbove/onInsertBelow when canAdd is false", async () => {
    const onDuplicate = vi.fn();
    render(<BlockActionsMenu {...baseProps} canAdd={false} onDuplicate={onDuplicate} />);
    const user = await openMenu();
    await user.click(screen.getByRole("menuitem", { name: "Duplicate" }));
    expect(onDuplicate).not.toHaveBeenCalled();
  });

  it("disables the trigger, so the menu cannot be opened, when readOnly", () => {
    render(<BlockActionsMenu {...baseProps} readOnly />);
    expect(screen.getByRole("button", { name: "Heading actions" })).toBeDisabled();
  });
});
```

#### packages/react/src/components/form/FormBlocks.tsx

Full replacement.

```tsx
"use client";

import { ComponentPropsWithRef, useContext, useRef, useState } from "react";
import {
  type BlocksField,
  type BlockConfig,
  type InputComponentProps,
  type GenericBlock,
  BaseFieldMeta,
  buildDefaultBlock,
  cloneBlockWithFreshIds,
  CRUD_ACTIONS,
  PERMISSION_SCOPES,
} from "@vexcms/core";
import type { TypedFieldApi } from "./createFieldInput";
import { AppFormContext } from "./AppFormContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { TrashIcon, LayersIcon, ChevronDownIcon, ChevronUpIcon, CircleAlert } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { RenderFields } from "./RenderFields";
import { Icon } from "../Icon";
import { cn } from "../../styles/utils";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { Accordion, AccordionContent, AccordionItem } from "../ui/accordion";
import { FormError } from "./FormError";
import { Draggable, DragHandle, Droppable } from "../ui/dnd";
import { usePermission, useFieldErrorCount } from "../../hooks";
import { BlockActionsMenu } from "./BlockActionsMenu";
import type { VexResourceSlug } from "@vexcms/core";

/**
 * Props for the `FormBlocks` component.
 *
 * @see {@link FormBlocks}
 */
export interface FormBlocksProps<TFieldMeta extends BaseFieldMeta = BaseFieldMeta>
  extends InputComponentProps<TFieldMeta, BlocksField<VexResourceSlug, TFieldMeta>> {
  /**
   * The TanStack Form array field API in `mode="array"`.
   *
   * `field.state.value` is the block item array. `pushValue`/`insertValue`/
   * `removeValue`/`moveValue` handle add, insert-at-index, remove, and reorder.
   */
  field: TypedFieldApi<GenericBlock[]>;
  /** Number of form submissions — passed through for validation error display. */
  submissionAttempts: number;
  /** Additional class names for the outer container. */
  className?: string;
  /** Whether the block editor modal is open (driven by URL param). */
  modalOpen: boolean;
  /** Opens the block editor modal (sets URL param). */
  openEditor: () => void;
  /** Closes the block editor modal (clears URL param). */
  closeEditor: () => void;
}

/**
 * Computes which block IDs should start open in the accordion.
 *
 * A block starts closed when the field's own `admin.defaultCollapsed` is
 * true, OR when that specific block type's `admin.defaultCollapsed` is true.
 *
 * @param props - Input props.
 * @returns The block IDs that should be open by default.
 */
function computeDefaultOpenBlocks(props: {
  items: GenericBlock[];
  fieldDefaultCollapsed: boolean;
  blockDefMap: Map<string, BlockConfig>;
}): string[] {
  const { items, fieldDefaultCollapsed, blockDefMap } = props;
  if (fieldDefaultCollapsed) return [];
  return items
    .filter((item) => !blockDefMap.get(item.blockType as string)?.admin?.defaultCollapsed)
    .map((item) => item.id as string);
}

// ---------------------------------------------------------------------------
// Block Picker Dialog
// ---------------------------------------------------------------------------

function BlockPickerDialog(props: {
  blockDefs: BlockConfig[];
  open: boolean;
  multiselect?: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (blockDef: BlockConfig) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set());
  const filtered = props.blockDefs.filter(
    (b) =>
      b.label?.toLowerCase().includes(search.toLowerCase()) ||
      b.blockType.toLowerCase().includes(search.toLowerCase()),
  );

  function toggleBlock(blockType: string) {
    setSelectedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockType)) {
        next.delete(blockType);
      } else {
        next.add(blockType);
      }
      return next;
    });
  }

  function handleAddBlocks() {
    const selectedBlockDefs = props.blockDefs.filter((b) => selectedBlocks.has(b.blockType));
    selectedBlockDefs.forEach((blockDef) => props.onSelect(blockDef));
    setSelectedBlocks(new Set());
    setSearch("");
    props.onOpenChange(false);
  }

  function handleAddBlock(blockDef: BlockConfig) {
    props.onSelect(blockDef);
    props.onOpenChange(false);
    setSearch("");
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="w-full max-w-sm p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Add block</DialogTitle>
          <DialogDescription>
            {props.multiselect ? "Select one or more blocks" : "Select a block"}
          </DialogDescription>
        </DialogHeader>
        <div className="px-4 pb-2">
          <Input
            iconLeft={{ name: "Search" }}
            placeholder="Search blocks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-72 overflow-y-auto px-2 pb-3">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No blocks found</p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((blockDef) => {
                const isSelected = selectedBlocks.has(blockDef.blockType);
                return (
                  <button
                    key={blockDef.blockType}
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-muted transition-colors",
                      isSelected && "bg-muted",
                    )}
                    onClick={() => {
                      if (props.multiselect) {
                        toggleBlock(blockDef.blockType);
                      } else {
                        handleAddBlock(blockDef);
                      }
                    }}
                  >
                    {props.multiselect && (
                      <div
                        className={cn(
                          "size-4 rounded border border-input flex items-center justify-center shrink-0",
                          isSelected && "bg-primary border-primary",
                        )}
                      >
                        {isSelected && (
                          <Icon name="Check" className="size-3 text-primary-foreground" />
                        )}
                      </div>
                    )}
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-muted">
                      {blockDef.admin?.icon ? (
                        <Icon
                          name={blockDef.admin.icon as any}
                          className="size-4 text-muted-foreground"
                        />
                      ) : (
                        <LayersIcon className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{blockDef.label}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {blockDef.blockType}
                        {Object.keys(blockDef.fields).length > 0 &&
                          ` · ${Object.keys(blockDef.fields).length} field${
                            Object.keys(blockDef.fields).length === 1 ? "" : "s"
                          }`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {props.multiselect && selectedBlocks.size > 0 && (
          <div className="flex items-center justify-between border-t px-4 pt-2 pb-4">
            <span className="text-sm text-muted-foreground">{selectedBlocks.size} selected</span>
            <Button onClick={handleAddBlocks} size="sm">
              Add {selectedBlocks.size} block{selectedBlocks.size === 1 ? "" : "s"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Block Accordion Item
// ---------------------------------------------------------------------------

/**
 * Renders one block's accordion item: drag handle, order number, type badge,
 * a collapsed-with-errors marker, the `blockName` input, and the per-block
 * `BlockActionsMenu`.
 *
 * Its own component — one instance per block — so `useFieldErrorCount` can
 * be called unconditionally regardless of how many sibling blocks exist
 * (a hook call inside the parent's `.map` would violate Rules of Hooks
 * whenever a block is added or removed).
 *
 * @param props - Component props.
 * @returns The block's `AccordionItem`, wrapped in a `Draggable`.
 */
function BlockAccordionItem(props: {
  name: string;
  index: number;
  count: number;
  item: GenericBlock;
  blockDef: BlockConfig;
  collection: InputComponentProps["collection"];
  readOnly: boolean;
  canAdd: boolean;
  isOpen: boolean;
  onUpdateBlockName: (blockName: string) => void;
  onDuplicate: () => void;
  onInsertAbove: () => void;
  onInsertBelow: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const { name, index, count, item, blockDef, collection, readOnly, canAdd, isOpen } = props;
  const itemKey = item.id as string;
  const errorCount = useFieldErrorCount({ names: [`${name}[${index}]`] });
  const subFields = Object.entries(blockDef.fields);

  return (
    <Draggable id={`${name}-${itemKey}`} index={index} isDragDisabled={readOnly}>
      <AccordionItem
        value={itemKey}
        className={cn(
          "rounded-sm border-t border-r-2 border-l-2 border-border bg-background overflow-hidden",
          index === 0 && "border-t-2",
          index === count - 1 && "border-b-2",
        )}
      >
        <AccordionPrimitive.Header className="flex items-center gap-2 bg-muted/40 px-3 py-2">
          <DragHandle disabled={readOnly} />
          <AccordionPrimitive.Trigger
            data-slot="accordion-trigger"
            className="group/accordion-trigger flex flex-1 items-center gap-2 rounded-md border border-transparent outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            <span className="w-4 shrink-0 text-center font-mono text-xs text-muted-foreground tabular-nums">
              {index + 1}
            </span>
            <div className="shrink-0 p-0.5">
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {blockDef.blockType}
              </span>
            </div>
            {!isOpen && errorCount > 0 && <CircleAlert className="size-3.5 shrink-0 text-destructive" />}
            <div className="min-w-[50%] flex-1 sm:min-w-[60%]">
              <Input
                type="text"
                value={(item.blockName as string) ?? ""}
                onChange={(e) => props.onUpdateBlockName(e.target.value)}
                disabled={readOnly}
                placeholder={blockDef.label ?? blockDef.blockType}
                className="w-full truncate border-none bg-transparent p-0 text-sm font-medium outline-none placeholder:text-muted-foreground focus:ring-0 disabled:opacity-50"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <ChevronDownIcon className="pointer-events-none ml-auto size-4 shrink-0 self-center text-muted-foreground group-aria-expanded/accordion-trigger:hidden" />
            <ChevronUpIcon className="pointer-events-none hidden size-4 shrink-0 self-center text-muted-foreground group-aria-expanded/accordion-trigger:inline" />
          </AccordionPrimitive.Trigger>
          <BlockActionsMenu
            index={index}
            count={count}
            readOnly={readOnly}
            canAdd={canAdd}
            blockLabel={blockDef.label ?? blockDef.blockType}
            onDuplicate={props.onDuplicate}
            onInsertAbove={props.onInsertAbove}
            onInsertBelow={props.onInsertBelow}
            onMoveUp={props.onMoveUp}
            onMoveDown={props.onMoveDown}
            onRemove={props.onRemove}
          />
        </AccordionPrimitive.Header>

        <AccordionContent className="px-3 pt-3">
          <div className="flex flex-col gap-4 pt-3">
            {subFields.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                This block has no configurable fields.
              </p>
            ) : (
              <RenderFields
                fields={blockDef.fields}
                collection={collection}
                namePrefix={`${name}[${index}]`}
                readOnly={readOnly}
              />
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Draggable>
  );
}

// ---------------------------------------------------------------------------
// FormBlocks
// ---------------------------------------------------------------------------

/**
 * Renders a blocks field as a simple accordion list with a searchable block
 * picker, per-block duplicate/insert/move/remove actions, collapse-all/
 * expand-all controls, and an `n/max` block-count indicator.
 *
 * All blocks share a single `Accordion multiple={true}` — multiple items can
 * be open at the same time. Each block is an `AccordionItem` with its `id`
 * as the item value (stable across reorders).
 *
 * A block starts collapsed when the field's own `admin.defaultCollapsed` is
 * true, or when that block type's own `admin.defaultCollapsed` is true.
 *
 * Opening a block is NAVIGATION, not editing — the accordion trigger is
 * never disabled. Every other control (drag handle, blockName input, the
 * actions menu, Add, Collapse/Expand all) is disabled when `readOnly` OR the
 * current caller lacks update permission on `collection`.
 *
 * `blockType`, `blockName`, and `id` are never rendered as editable sub-field inputs.
 *
 * @param props - Component props.
 * @returns The accordion of blocks with a searchable block picker for adding new ones.
 * @throws {Error} When rendered outside `<AppForm>` and no form context is available.
 */
export function FormBlocks<TFieldMeta extends BaseFieldMeta = BaseFieldMeta>({
  collection,
  name,
  field,
  fieldDef,
  readOnly,
  submissionAttempts,
  className,
  modalOpen,
  openEditor,
  closeEditor,
}: FormBlocksProps<TFieldMeta> & ComponentPropsWithRef<"div">) {
  const form = useContext(AppFormContext);

  if (!form) {
    throw new Error(
      `FormBlocks "${name}" must be rendered inside <AppForm> or have a form context available.`,
    );
  }

  const items = (field.state.value ?? []) as GenericBlock[];
  const blockDefMap = new Map(fieldDef.blocks.map((b) => [b.blockType, b]));
  const { singular, plural } = fieldDef.labels;
  const maxValue = fieldDef.max?.[0];
  const atMax = maxValue !== undefined && items.length >= maxValue;

  const canEdit = usePermission({
    resource: collection.slug,
    action: CRUD_ACTIONS.update,
    scope: PERMISSION_SCOPES.any,
  });
  const effectiveReadOnly = readOnly || !canEdit;

  const itemIdsKey = items.map((item) => item.id as string).join(",");
  const [openBlockIds, setOpenBlockIds] = useState<string[]>(() =>
    computeDefaultOpenBlocks({
      items,
      fieldDefaultCollapsed: fieldDef.admin.defaultCollapsed,
      blockDefMap,
    }),
  );
  const [trackedIdsKey, setTrackedIdsKey] = useState(itemIdsKey);
  if (itemIdsKey !== trackedIdsKey) {
    const trackedIds = new Set(trackedIdsKey ? trackedIdsKey.split(",") : []);
    const newItems = items.filter((item) => !trackedIds.has(item.id as string));
    setTrackedIdsKey(itemIdsKey);
    if (newItems.length > 0 && !fieldDef.admin.defaultCollapsed) {
      const newOpenIds = newItems
        .filter((item) => !blockDefMap.get(item.blockType as string)?.admin?.defaultCollapsed)
        .map((item) => item.id as string);
      if (newOpenIds.length > 0) {
        setOpenBlockIds((prev) => [...prev, ...newOpenIds]);
      }
    }
  }

  const insertCursorRef = useRef<number | undefined>(undefined);

  function requestInsert(index: number | undefined) {
    insertCursorRef.current = index;
    if (fieldDef.blocks.length === 1) {
      handleAddBlock(fieldDef.blocks[0]!);
      return;
    }
    openEditor();
  }

  function handleAddBlock(blockDef: BlockConfig) {
    const insertAt = insertCursorRef.current;
    if (insertAt === undefined) {
      field.pushValue(buildDefaultBlock({ blockDef }));
      return;
    }
    field.insertValue(insertAt, buildDefaultBlock({ blockDef }));
    insertCursorRef.current = insertAt + 1;
  }

  function updateBlockName(index: number, blockName: string) {
    const current = items[index];
    if (!current) return;
    const updated = [...items];
    updated[index] = { ...current, blockName };
    field.handleChange(updated);
  }

  function handleDuplicate(index: number) {
    const source = items[index];
    const blockDef = source ? blockDefMap.get(source.blockType as string) : undefined;
    if (!source || !blockDef) return;
    field.insertValue(index + 1, cloneBlockWithFreshIds({ block: source, blockDef }));
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    field.moveValue(index, index - 1);
  }

  function handleMoveDown(index: number) {
    if (index === items.length - 1) return;
    field.moveValue(index, index + 1);
  }

  function handleRemove(index: number) {
    field.removeValue(index);
  }

  function handleCollapseAll() {
    setOpenBlockIds([]);
  }

  function handleExpandAll() {
    setOpenBlockIds(items.map((item) => item.id as string));
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {items.length === 0 && (
        <div className="rounded-sm border-2 border-dashed border-border py-8 text-center">
          <LayersIcon className="mx-auto mb-2 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No {plural} yet.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {items.length}
            {maxValue !== undefined ? `/${maxValue}` : ""} {plural}
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={effectiveReadOnly}
              onClick={handleCollapseAll}
            >
              Collapse all
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={effectiveReadOnly}
              onClick={handleExpandAll}
            >
              Expand all
            </Button>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <Accordion multiple={true} value={openBlockIds} onValueChange={setOpenBlockIds} className="w-full">
          <Droppable
            id={name}
            div={{ className: "gap-0" }}
            onReorder={(from, to) => {
              field.moveValue(from, to);
            }}
          >
            {items.map((item, index) => {
              const blockSlug = item.blockType as string;
              const blockDef = blockDefMap.get(blockSlug);
              const itemKey = (item.id as string) ?? String(index);

              if (!blockDef) {
                return (
                  <div
                    key={itemKey}
                    className="rounded-sm border border-destructive/40 px-3 py-2 text-sm text-destructive"
                  >
                    Unknown block type: <code>{blockSlug}</code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={effectiveReadOnly}
                      onClick={() => field.removeValue(index)}
                      className="ml-2"
                    >
                      <TrashIcon className="size-3.5" />
                    </Button>
                  </div>
                );
              }

              return (
                <BlockAccordionItem
                  key={itemKey}
                  name={name}
                  index={index}
                  count={items.length}
                  item={item}
                  blockDef={blockDef}
                  collection={collection}
                  readOnly={effectiveReadOnly}
                  canAdd={!atMax}
                  isOpen={openBlockIds.includes(itemKey)}
                  onUpdateBlockName={(blockName) => updateBlockName(index, blockName)}
                  onDuplicate={() => handleDuplicate(index)}
                  onInsertAbove={() => requestInsert(index)}
                  onInsertBelow={() => requestInsert(index + 1)}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                  onRemove={() => handleRemove(index)}
                />
              );
            })}
          </Droppable>
        </Accordion>
      )}

      {!effectiveReadOnly && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => requestInsert(undefined)}
            disabled={atMax}
            icon="Plus"
          >
            Add {singular}
          </Button>
          {atMax && (
            <span className="text-xs text-muted-foreground">
              Maximum {maxValue} {plural} reached
            </span>
          )}
        </div>
      )}

      <FormError field={field} submissionAttempts={submissionAttempts} />

      <BlockPickerDialog
        blockDefs={fieldDef.blocks}
        open={modalOpen}
        onOpenChange={(open) => {
          if (open) {
            openEditor();
            return;
          }
          insertCursorRef.current = undefined;
          closeEditor();
        }}
        onSelect={handleAddBlock}
        multiselect={true}
      />
    </div>
  );
}
```

#### packages/react/src/components/form/FormBlocks.test.tsx

New file.

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import {
  blocks,
  defineBlock,
  text,
  type BlocksField,
  type CollectionConfig,
  type GenericBlock,
} from "@vexcms/core";
import { AppForm } from "./AppForm";
import { FormBlocks } from "./FormBlocks";
import {
  testCollection,
  testAccess,
  testUsers,
  renderWithVexProviders,
} from "../../testing/harness/accessFixtures";

const paragraphBlock = defineBlock({ slug: "paragraph", label: "Paragraph", fields: { text: text() } });
const headingBlock = defineBlock({
  slug: "heading",
  label: "Heading",
  fields: { text: text({ required: true }) },
});

function FormBlocksHarness(props: {
  fieldDef: BlocksField;
  collection?: CollectionConfig;
  initialValue: GenericBlock[];
  readOnly?: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <form.Field name="testField" mode="array">
        {(field) => (
          <FormBlocks
            name="testField"
            field={field}
            fieldDef={props.fieldDef}
            collection={props.collection ?? testCollection}
            readOnly={props.readOnly ?? false}
            submissionAttempts={0}
            modalOpen={modalOpen}
            openEditor={() => setModalOpen(true)}
            closeEditor={() => setModalOpen(false)}
          />
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.values.testField}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </AppForm>
  );
}

describe("FormBlocks", () => {
  it("duplicates a block via its actions menu, inserting a copy right after it with a fresh id", async () => {
    const user = userEvent.setup();
    const fieldDef = blocks({ label: "Body", blocks: [paragraphBlock] });
    render(
      <FormBlocksHarness
        fieldDef={fieldDef}
        initialValue={[{ id: "b1", blockType: "paragraph", text: "Hello" }]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Paragraph actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Duplicate" }));

    const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as GenericBlock[];
    expect(values).toHaveLength(2);
    expect(values[0]?.id).toBe("b1");
    expect(values[1]?.id).not.toBe("b1");
    expect(values[1]?.text).toBe("Hello");
  });

  it("inserts a block above via the actions menu, for a single-type field (skipping the picker)", async () => {
    const user = userEvent.setup();
    const fieldDef = blocks({ label: "Body", blocks: [paragraphBlock] });
    render(
      <FormBlocksHarness
        fieldDef={fieldDef}
        initialValue={[{ id: "b1", blockType: "paragraph", text: "Existing" }]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Paragraph actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Insert above" }));

    const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as GenericBlock[];
    expect(values).toHaveLength(2);
    expect(values[1]?.id).toBe("b1");
    expect(values[0]?.id).not.toBe("b1");
  });

  it("moves a block up and down via the actions menu", async () => {
    const user = userEvent.setup();
    const fieldDef = blocks({ label: "Body", blocks: [paragraphBlock] });
    render(
      <FormBlocksHarness
        fieldDef={fieldDef}
        initialValue={[
          { id: "b1", blockType: "paragraph", text: "First" },
          { id: "b2", blockType: "paragraph", text: "Second" },
        ]}
      />,
    );

    const secondMenuButtons = screen.getAllByRole("button", { name: "Paragraph actions" });
    await user.click(secondMenuButtons[1]!);
    await user.click(await screen.findByRole("menuitem", { name: "Move up" }));

    const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as GenericBlock[];
    expect(values.map((b) => b.id)).toEqual(["b2", "b1"]);
  });

  it("removes a block via the actions menu", async () => {
    const user = userEvent.setup();
    const fieldDef = blocks({ label: "Body", blocks: [headingBlock, paragraphBlock] });
    render(
      <FormBlocksHarness
        fieldDef={fieldDef}
        initialValue={[
          { id: "h1", blockType: "heading", blockName: "Heading", text: "Welcome" },
          { id: "p1", blockType: "paragraph", blockName: "Paragraph", text: "Body copy" },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Heading actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Remove" }));

    const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as GenericBlock[];
    expect(values).toHaveLength(1);
    expect(values[0]?.blockType).toBe("paragraph");
  });

  it("collapses and expands every block via the header controls", async () => {
    const user = userEvent.setup();
    const fieldDef = blocks({ label: "Body", blocks: [paragraphBlock] });
    render(
      <FormBlocksHarness
        fieldDef={fieldDef}
        initialValue={[
          { id: "b1", blockType: "paragraph", text: "First" },
          { id: "b2", blockType: "paragraph", text: "Second" },
        ]}
      />,
    );

    const triggers = () => screen.getAllByText(/^paragraph$/).map((el) => el.closest("[aria-expanded]")!);
    expect(triggers().every((t) => t.getAttribute("aria-expanded") === "true")).toBe(true);

    await user.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(triggers().every((t) => t.getAttribute("aria-expanded") === "false")).toBe(true);

    await user.click(screen.getByRole("button", { name: "Expand all" }));
    expect(triggers().every((t) => t.getAttribute("aria-expanded") === "true")).toBe(true);
  });

  it("starts a block collapsed when its own admin.defaultCollapsed is true, even though the field's is false", () => {
    const collapsedParagraph = defineBlock({
      slug: "paragraph",
      label: "Paragraph",
      admin: { defaultCollapsed: true },
      fields: { text: text() },
    });
    const fieldDef = blocks({ label: "Body", blocks: [headingBlock, collapsedParagraph] });
    render(
      <FormBlocksHarness
        fieldDef={fieldDef}
        initialValue={[
          { id: "h1", blockType: "heading", text: "Welcome" },
          { id: "p1", blockType: "paragraph", text: "Body copy" },
        ]}
      />,
    );

    const headingTrigger = screen.getByText("heading").closest("[aria-expanded]")!;
    const paragraphTrigger = screen.getByText("paragraph").closest("[aria-expanded]")!;
    expect(headingTrigger).toHaveAttribute("aria-expanded", "true");
    expect(paragraphTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("disables every mutating menu action and the header controls when the caller lacks update permission", async () => {
    const user = userEvent.setup();
    const fieldDef = blocks({ label: "Body", blocks: [paragraphBlock] });
    renderWithVexProviders(
      <FormBlocksHarness
        fieldDef={fieldDef}
        collection={testCollection}
        initialValue={[{ id: "b1", blockType: "paragraph", text: "Hello" }]}
      />,
      { access: testAccess.denied, auth: { user: testUsers.denied } },
    );

    expect(screen.getByRole("button", { name: "Collapse all" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Expand all" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Add Block" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Paragraph actions" }));
    const duplicateItem = await screen.findByRole("menuitem", { name: "Duplicate" });
    expect(duplicateItem).toHaveAttribute("aria-disabled", "true");
  });
});
```

#### packages/react/src/components/form/FormArray.tsx

Full replacement.

```tsx
"use client";

import {
  type ArrayField,
  type ArrayType,
  type BaseFieldMeta,
  type InputComponentProps,
} from "@vexcms/core";
import type { TypedFieldApi } from "./createFieldInput";
import { useContext, useRef } from "react";
import { AppFormContext } from "./AppFormContext";
import { Button } from "../ui/button";
import { Droppable, Draggable, DragHandle } from "../ui/dnd";
import { TrashIcon, CopyIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { fieldToInputComponent } from "../fields";
import { FormError } from "./FormError";
import { FormDescription } from "./FormDescription";
import type { VexResourceSlug } from "@vexcms/core";

/**
 * Renders an array field as a dynamic list with add/duplicate/move/remove controls.
 *
 * This component renders inside an `ArrayFieldInput` (which wraps a TanStack Form
 * array field with `mode="array"`). It maps over `field.state.value` and renders
 * each item as a sub-field using `form.Field name={\`${name}[${i}]\`}`.
 *
 * Array items are raw values (string/number/boolean/object), not objects with a
 * stable `id` — unlike `FormBlocks`' `GenericBlock` items. A `useRef`-held parallel
 * key array supplies stable React/drag identity per slot: every push, duplicate,
 * remove, move, and reorder updates the key array in lockstep with the TanStack
 * Form array mutation, in the same synchronous step.
 *
 * @example
 * ```tsx
 * const ArrayFieldInput = createFieldInput<ArrayType[], ArrayField<VexResourceSlug, ArrayType>>(
 *   ({ name, fieldDef, field, submissionAttempts }) => (
 *     <div className="flex flex-col gap-1.5">
 *       <FormArray
 *         name={name}
 *         field={field}
 *         fieldDef={fieldDef}
 *         readOnly={fieldDef.admin.readOnly}
 *         submissionAttempts={submissionAttempts}
 *       />
 *     </div>
 *   ),
 *   "array" // mode
 * )
 * ```
 *
 * @param props - Component props.
 * @returns The array's items list (draggable, with per-item duplicate/move/remove
 *   controls and an add button), or a "No items yet." message when empty.
 * @throws {Error} When rendered outside `<AppForm>`, or when `fieldDef.items.type`
 *   has no registered input component.
 */
export function FormArray<
  TArrayType extends ArrayType = string,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>({
  collection,
  name,
  field,
  fieldDef,
  index,
  readOnly,
  submissionAttempts,
}: InputComponentProps<TFieldMeta, ArrayField<VexResourceSlug, TArrayType, TFieldMeta>> & {
  field: TypedFieldApi<TArrayType[]>;
  submissionAttempts: number;
}) {
  const form = useContext(AppFormContext);

  if (!form) {
    throw new Error(
      `FormArray "${name}" must be rendered inside <AppForm> or have a form context available.`,
    );
  }

  const itemFieldDef = fieldDef.items;
  const ItemInput = fieldToInputComponent(itemFieldDef.type);

  if (!ItemInput) {
    throw new Error("invalid array.items field type set");
  }

  function getNewItemDefault() {
    return itemFieldDef.defaultValue as TArrayType;
  }

  const items = field.state.value ?? [];
  const maxValue = fieldDef.max?.[0];
  const atMax = maxValue !== undefined && items.length >= maxValue;

  const keysRef = useRef<string[]>([]);
  if (keysRef.current.length < items.length) {
    keysRef.current = [
      ...keysRef.current,
      ...Array.from({ length: items.length - keysRef.current.length }, () => crypto.randomUUID()),
    ];
  } else if (keysRef.current.length > items.length) {
    keysRef.current = keysRef.current.slice(0, items.length);
  }

  function handleAdd() {
    keysRef.current = [...keysRef.current, crypto.randomUUID()];
    field.pushValue(getNewItemDefault());
  }

  function handleDuplicate(itemIndex: number) {
    const source = items[itemIndex];
    const duplicate =
      typeof source === "object" && source !== null ? { ...(source as object) } : source;
    const newKeys = [...keysRef.current];
    newKeys.splice(itemIndex + 1, 0, crypto.randomUUID());
    keysRef.current = newKeys;
    field.insertValue(itemIndex + 1, duplicate as TArrayType);
  }

  function handleRemove(itemIndex: number) {
    const newKeys = [...keysRef.current];
    newKeys.splice(itemIndex, 1);
    keysRef.current = newKeys;
    field.removeValue(itemIndex);
  }

  function handleMoveUp(itemIndex: number) {
    if (itemIndex === 0) return;
    const newKeys = [...keysRef.current];
    [newKeys[itemIndex - 1], newKeys[itemIndex]] = [newKeys[itemIndex]!, newKeys[itemIndex - 1]!];
    keysRef.current = newKeys;
    field.moveValue(itemIndex, itemIndex - 1);
  }

  function handleMoveDown(itemIndex: number) {
    if (itemIndex === items.length - 1) return;
    const newKeys = [...keysRef.current];
    [newKeys[itemIndex + 1], newKeys[itemIndex]] = [newKeys[itemIndex]!, newKeys[itemIndex + 1]!];
    keysRef.current = newKeys;
    field.moveValue(itemIndex, itemIndex + 1);
  }

  function handleReorder(from: number, to: number) {
    const newKeys = [...keysRef.current];
    const [moved] = newKeys.splice(from, 1);
    newKeys.splice(to, 0, moved!);
    keysRef.current = newKeys;
    field.moveValue(from, to);
  }

  return (
    <div
      role="group"
      aria-labelledby={`${name}-label`}
      aria-disabled={readOnly}
      className="flex flex-col gap-3 rounded-sm border-2 p-2"
    >
      <div className="flex gap-3">
        <div>
          <span
            id={`${name}-label`}
            className="relative flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
          >
            {index !== undefined ? `[${index + 1}] - ` : ""}
            {fieldDef.label || name}
            {fieldDef.required && <span className="text-red-500">*</span>}
          </span>
          <FormDescription field={fieldDef} />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            disabled={readOnly || atMax}
            variant="outline"
            size="sm"
            onClick={handleAdd}
            icon="Plus"
          >
            Add {fieldDef.labels.singular}
          </Button>
          {atMax && (
            <span className="text-xs text-muted-foreground">
              Maximum {maxValue} {fieldDef.labels.plural} reached
            </span>
          )}
        </div>
      </div>
      {items.length > 0 ? (
        <Droppable id={name} wrapperKey={name} onReorder={handleReorder}>
          {items.map((_, itemIndex) => {
            const itemKey = keysRef.current[itemIndex] ?? String(itemIndex);
            return (
              <Draggable key={itemKey} id={`${name}-${itemKey}`} index={itemIndex} isDragDisabled={readOnly}>
                <div className="flex items-center gap-2 px-2">
                  <DragHandle disabled={readOnly} />
                  <div className="flex-1">
                    <form.Field name={`${name}[${itemIndex}]`}>
                      {(subField) => (
                        <ItemInput
                          name={`${subField.name}`}
                          collection={collection}
                          fieldDef={itemFieldDef}
                          readOnly={readOnly}
                        />
                      )}
                    </form.Field>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={readOnly || atMax}
                    onClick={() => handleDuplicate(itemIndex)}
                    className="text-muted-foreground hover:text-foreground shrink-0 transition-all duration-300"
                    aria-label={`Duplicate item ${itemIndex + 1} from ${fieldDef.label || name}`}
                  >
                    <CopyIcon className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={readOnly || itemIndex === 0}
                    onClick={() => handleMoveUp(itemIndex)}
                    className="text-muted-foreground hover:text-foreground shrink-0 transition-all duration-300"
                    aria-label={`Move item ${itemIndex + 1} up`}
                  >
                    <ArrowUpIcon className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={readOnly || itemIndex === items.length - 1}
                    onClick={() => handleMoveDown(itemIndex)}
                    className="text-muted-foreground hover:text-foreground shrink-0 transition-all duration-300"
                    aria-label={`Move item ${itemIndex + 1} down`}
                  >
                    <ArrowDownIcon className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={readOnly}
                    onClick={() => handleRemove(itemIndex)}
                    className="text-muted-foreground hover:text-destructive shrink-0 transition-all duration-300"
                    aria-label={`Remove item ${itemIndex + 1} from ${fieldDef.label || name}`}
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                </div>
              </Draggable>
            );
          })}
        </Droppable>
      ) : (
        <p className="text-muted-foreground text-sm">No items yet.</p>
      )}

      <FormError field={field} submissionAttempts={submissionAttempts} />
    </div>
  );
}
```

#### packages/react/src/components/form/FormArray.test.tsx

New file.

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import {
  array,
  text,
  type ArrayField,
  type ArrayType,
  type CollectionConfig,
  type VexResourceSlug,
} from "@vexcms/core";
import { AppForm } from "./AppForm";
import { FormArray } from "./FormArray";
import { testCollection } from "../../testing/harness/accessFixtures";

function FormArrayHarness(props: {
  fieldDef: ArrayField<VexResourceSlug, ArrayType>;
  collection?: CollectionConfig;
  initialValue: unknown[];
  readOnly?: boolean;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <form.Field name="testField" mode="array">
        {(field) => (
          <FormArray
            name="testField"
            field={field as any}
            fieldDef={props.fieldDef}
            collection={props.collection ?? testCollection}
            readOnly={props.readOnly ?? false}
            submissionAttempts={0}
          />
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.values.testField}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </AppForm>
  );
}

const fieldDef = array({ label: "Tags", items: text({ label: "Tag", required: true }) });

describe("FormArray", () => {
  it("duplicates an item immediately after itself", async () => {
    const user = userEvent.setup();
    render(<FormArrayHarness fieldDef={fieldDef} initialValue={["a", "b"]} />);

    await user.click(screen.getByRole("button", { name: "Duplicate item 1 from Tags" }));

    const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as string[];
    expect(values).toEqual(["a", "a", "b"]);
  });

  it("moves an item up, swapping it with its predecessor", async () => {
    const user = userEvent.setup();
    render(<FormArrayHarness fieldDef={fieldDef} initialValue={["a", "b", "c"]} />);

    await user.click(screen.getByRole("button", { name: "Move item 2 up" }));

    const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as string[];
    expect(values).toEqual(["b", "a", "c"]);
  });

  it("moves an item down, swapping it with its successor", async () => {
    const user = userEvent.setup();
    render(<FormArrayHarness fieldDef={fieldDef} initialValue={["a", "b", "c"]} />);

    await user.click(screen.getByRole("button", { name: "Move item 2 down" }));

    const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as string[];
    expect(values).toEqual(["a", "c", "b"]);
  });

  it("disables moving the first item up and the last item down", () => {
    render(<FormArrayHarness fieldDef={fieldDef} initialValue={["a", "b"]} />);

    expect(screen.getByRole("button", { name: "Move item 1 up" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move item 2 down" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move item 1 down" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Move item 2 up" })).not.toBeDisabled();
  });

  it("disables duplicate once the max item count is reached", () => {
    const boundaryFieldDef = array({ label: "Tags", items: text({ label: "Tag" }), max: 2 });
    render(<FormArrayHarness fieldDef={boundaryFieldDef} initialValue={["a", "b"]} />);

    expect(screen.getByRole("button", { name: "Duplicate item 1 from Tags" })).toBeDisabled();
  });

  it("keeps each item's stable key travelling with it across a duplicate, so the untouched item does not remount", async () => {
    const user = userEvent.setup();
    render(<FormArrayHarness fieldDef={fieldDef} initialValue={["a", "b"]} />);

    const secondInputBefore = screen.getAllByRole("textbox")[1] as HTMLInputElement;
    const draggableIdBefore = secondInputBefore
      .closest("[data-rfd-draggable-id]")
      ?.getAttribute("data-rfd-draggable-id");

    await user.click(screen.getByRole("button", { name: "Duplicate item 1 from Tags" }));

    const thirdInputAfter = screen.getAllByRole("textbox")[2] as HTMLInputElement;
    const draggableIdAfter = thirdInputAfter
      .closest("[data-rfd-draggable-id]")
      ?.getAttribute("data-rfd-draggable-id");

    expect(draggableIdAfter).toBe(draggableIdBefore);
  });
});
```

#### packages/react/src/components/fields/blocks/Input.test.tsx

2 edits inside the existing `describe("blocks: the block-type picker, blockName/id generation, removal, …")` block — everything else in the file (including `twoBlockFieldDef`, `boundaryFieldDef`, `BlocksHarness`) is unchanged.

Edit 1 — the `it("seeds a new block's blockName from the block definition's label and gives it a fresh, unique id", …)` block now asserts `buildDefaultBlock`'s fixed behavior (no `blockName` default, so the placeholder shows):

```tsx
it("seeds a new block with a fresh, unique id and no blockName, so the block definition's label shows as a placeholder", async () => {
  const user = userEvent.setup();
  // Single registered block type — Add bypasses the picker dialog entirely.
  render(<BlocksHarness fieldDef={blocksFieldFixture.fieldDef} initialValue={[]} />);
  const addButton = screen.getByRole("button", { name: `Add ${blocksFieldFixture.fieldDef.labels.singular}` });
  await user.click(addButton);
  await user.click(addButton);

  const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as {
    id: string;
    blockName?: string;
  }[];
  expect(values).toHaveLength(2);
  expect(values[0]?.blockName).toBeUndefined();
  expect(values[1]?.blockName).toBeUndefined();
  expect(values[0]?.id).toEqual(expect.any(String));
  expect(values[0]?.id).not.toBe(values[1]?.id);
  expect(screen.getAllByPlaceholderText("Paragraph")).toHaveLength(2);
});
```

Edit 2 — the `it("removes one block by its own labeled button, …")` block now removes via `BlockActionsMenu`:

```tsx
it("removes one block via its actions menu, leaving a differently-typed sibling block's field values untouched", async () => {
  const user = userEvent.setup();
  const seeded: GenericBlock[] = [
    { id: "h1", blockType: "heading", blockName: "Heading", text: "Welcome" },
    { id: "p1", blockType: "paragraph", blockName: "Paragraph", text: "Body copy" },
  ];
  render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={seeded} />);

  await user.click(screen.getByRole("button", { name: "Heading actions" }));
  await user.click(await screen.findByRole("menuitem", { name: "Remove" }));

  const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as {
    blockType: string;
    text?: string;
  }[];
  expect(values).toHaveLength(1);
  expect(values[0]?.blockType).toBe("paragraph");
  expect(values[0]?.text).toBe("Body copy");
});
```

#### packages/react/src/testing/nestedFieldContainer.ts

3 edits — everything else unchanged.

Edit 1 — `buildAddedItemMatcher` no longer expects `blockName` (fixed `buildDefaultBlock` leaves it unset):

```ts
function buildAddedItemMatcher(props: { container: "array" | "blocks"; childFixture: FieldFixture }): unknown {
  const childDefault = props.childFixture.fieldDef.defaultValue;
  if (props.container === "array") return childDefault;
  return expect.objectContaining({
    blockType: BLOCK_SLUG,
    [CHILD_KEY]: childDefault ?? null,
  });
}
```

Edit 2 — the `it("removes a seeded item, returning to the empty state", …)` block removes a `"blocks"` item through `BlockActionsMenu` instead of a standalone labeled button (the synthetic block's `label` is `"Block"`, set by `buildItemContainerFieldDef`):

```ts
          it("removes a seeded item, returning to the empty state", async () => {
            const user = userEvent.setup();
            const seeded = buildSeededValue({ container, childFixture });
            const { formRef } = renderContainer({
              Component,
              fieldDef,
              readOnly: false,
              initialValue: seeded,
            });

            if (container === "array") {
              await user.click(screen.getByRole("button", { name: "Remove item 1 from Items" }));
            } else {
              await user.click(screen.getByRole("button", { name: "Block actions" }));
              await user.click(await screen.findByRole("menuitem", { name: "Remove" }));
            }

            expect(await screen.findByText(emptyMessage)).toBeInTheDocument();
            expect(formRef.current?.state.values).toEqual({ [FIELD_NAME]: emptyValue });
          });
```

Edit 3 — the "cascades readOnly to every nested control" test exempts the per-block actions menu trigger and the field-level "Copy all" button: step 14 stops disabling the trigger under `readOnly` and never gates "Copy all" on it either, since copying never mutates the field (every mutating item/control is still gated individually):

```ts
          it("cascades readOnly to every nested control", async () => {
            const seeded = buildSeededValue({ container, childFixture });
            const { container: dom } = renderContainer({
              Component,
              fieldDef,
              readOnly: true,
              initialValue: seeded,
            });
            // Same post-render Base UI dialog settle as the `group` branch above.
            await act(async () => {});
            const controls = dom.querySelectorAll("button, input, select, textarea");
            expect(controls.length).toBeGreaterThan(0);
            controls.forEach((el) => {
              if (isDisclosureTrigger(el)) return;
              // The per-block actions menu trigger (`BlockActionsMenu`) and the
              // field-level "Copy all" button stay enabled under readOnly too —
              // copying never mutates the field, so both must stay reachable;
              // every mutating control is still gated individually.
              if (el.getAttribute("aria-label")?.endsWith(" actions")) return;
              if (el.textContent === "Copy all") return;
              // Same Base UI "focusable-when-disabled" pattern as the `group`
              // branch above: both spellings of inert count.
              const inert =
                el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true";
              expect(inert).toBe(true);
            });
          });
```


Verify: `pnpm --filter @vexcms/core test -- fields/blocks && pnpm --filter @vexcms/react test -- FormBlocks FormArray fields/blocks fields/array`

### Step 14 — Block clipboard (copy/paste across fields, documents, collections) [agent]

- [ ] `packages/react/src/hooks/useBlockClipboard.ts` + test — `vex:block-clipboard` envelope, cross-tab `storage` sync
- [ ] `packages/react/src/hooks/index.ts` — barrel export
- [ ] `packages/react/src/components/form/BlockActionsMenu.tsx` — `onCopy` / `onPasteAbove` / `onPasteBelow` / `canPaste`
- [ ] `packages/react/src/components/form/BlockActionsMenu.test.tsx` — step 13's file updated for the four new props and the trigger no longer being disabled when `readOnly`
- [ ] `packages/react/src/components/form/FormBlocks.tsx` — header Copy all / Paste (append) / Replace all; per-block copy/paste wiring; paste resolved against the target field's block definitions; `max`/`canEdit` gating; toast summary
- [ ] `packages/react/src/components/form/FormBlocks.test.tsx` — paste accepted / skipped / at-max / no-permission

Why: localStorage admin clipboard; paste gated on `canEdit` and validated against the target block definition.

Verify: `pnpm --filter @vexcms/react test -- useBlockClipboard FormBlocks`

#### packages/react/src/hooks/useBlockClipboard.ts

New file.

```ts
"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { GenericBlock } from "@vexcms/core";

/**
 * `localStorage` key for the admin block clipboard. Same origin means the
 * same deployment, so relationship/upload ids referenced by copied blocks
 * stay valid — the clipboard works across fields, documents and collections
 * within one deployment, and across browser tabs via the `storage` event.
 */
export const BLOCK_CLIPBOARD_STORAGE_KEY = "vex:block-clipboard";

/**
 * The envelope persisted at {@link BLOCK_CLIPBOARD_STORAGE_KEY}.
 */
export interface BlockClipboard {
  version: 1;
  copiedAt: number;
  blocks: GenericBlock[];
}

const BLOCK_CLIPBOARD_EVENT = "vex:block-clipboard-change";

let cachedRaw: string | null | undefined;
let cachedClipboard: BlockClipboard | null = null;

function isBlockClipboard(value: unknown): value is BlockClipboard {
  return (
    !!value &&
    typeof value === "object" &&
    (value as BlockClipboard).version === 1 &&
    typeof (value as BlockClipboard).copiedAt === "number" &&
    Array.isArray((value as BlockClipboard).blocks)
  );
}

function readClipboard(): BlockClipboard | null {
  if (typeof window === "undefined") return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(BLOCK_CLIPBOARD_STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw === cachedRaw) return cachedClipboard;
  cachedRaw = raw;
  if (raw === null) {
    cachedClipboard = null;
    return cachedClipboard;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    cachedClipboard = isBlockClipboard(parsed) ? parsed : null;
  } catch {
    cachedClipboard = null;
  }
  return cachedClipboard;
}

const getServerSnapshot = (): BlockClipboard | null => null;

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(BLOCK_CLIPBOARD_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(BLOCK_CLIPBOARD_EVENT, onStoreChange);
  };
}

/**
 * Reads and writes the admin block clipboard. SSR-safe (`getServerSnapshot`
 * returns `null`; every `localStorage` access is guarded and a blocked/
 * unavailable store resolves to a no-op rather than throwing).
 *
 * `clipboard` updates on `storage` events (another tab writing the same key)
 * and on a same-tab custom event dispatched by {@link useBlockClipboard}'s
 * own writers — `storage` alone never fires in the tab that performed the
 * write. Malformed JSON, or JSON that does not match {@link BlockClipboard}'s
 * shape, reads back as `null` rather than throwing.
 *
 * @returns The current clipboard (or `null`), plus `copyBlocks` and
 *   `clearClipboard` writers.
 */
export function useBlockClipboard(): {
  clipboard: BlockClipboard | null;
  copyBlocks: (props: { blocks: GenericBlock[] }) => void;
  clearClipboard: () => void;
} {
  const clipboard = useSyncExternalStore(subscribe, readClipboard, getServerSnapshot);

  const copyBlocks = useCallback((props: { blocks: GenericBlock[] }) => {
    if (typeof window === "undefined") return;
    const envelope: BlockClipboard = {
      version: 1,
      copiedAt: Date.now(),
      blocks: props.blocks,
    };
    try {
      window.localStorage.setItem(BLOCK_CLIPBOARD_STORAGE_KEY, JSON.stringify(envelope));
    } catch {
      return;
    }
    window.dispatchEvent(new Event(BLOCK_CLIPBOARD_EVENT));
  }, []);

  const clearClipboard = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(BLOCK_CLIPBOARD_STORAGE_KEY);
    } catch {
      return;
    }
    window.dispatchEvent(new Event(BLOCK_CLIPBOARD_EVENT));
  }, []);

  return { clipboard, copyBlocks, clearClipboard };
}
```

#### packages/react/src/hooks/useBlockClipboard.test.ts

New file.

```ts
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BLOCK_CLIPBOARD_STORAGE_KEY, useBlockClipboard } from "./useBlockClipboard";
import type { GenericBlock } from "@vexcms/core";

const heroBlock: GenericBlock = { id: "block-1", blockType: "hero", heading: "Hello" };

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe("useBlockClipboard", () => {
  it("starts with a null clipboard when localStorage is empty", () => {
    const { result } = renderHook(() => useBlockClipboard());
    expect(result.current.clipboard).toBeNull();
  });

  it("copyBlocks stores the exact envelope JSON and updates the clipboard", () => {
    const { result } = renderHook(() => useBlockClipboard());

    act(() => {
      result.current.copyBlocks({ blocks: [heroBlock] });
    });

    const raw = window.localStorage.getItem(BLOCK_CLIPBOARD_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw as string);
    expect(stored.version).toBe(1);
    expect(typeof stored.copiedAt).toBe("number");
    expect(stored.blocks).toEqual([heroBlock]);

    expect(result.current.clipboard).toEqual({
      version: 1,
      copiedAt: stored.copiedAt,
      blocks: [heroBlock],
    });
  });

  it("clearClipboard removes the stored key and resets the clipboard to null", () => {
    const { result } = renderHook(() => useBlockClipboard());

    act(() => {
      result.current.copyBlocks({ blocks: [heroBlock] });
    });
    expect(result.current.clipboard).not.toBeNull();

    act(() => {
      result.current.clearClipboard();
    });

    expect(window.localStorage.getItem(BLOCK_CLIPBOARD_STORAGE_KEY)).toBeNull();
    expect(result.current.clipboard).toBeNull();
  });

  it("resolves malformed JSON to null instead of throwing", () => {
    window.localStorage.setItem(BLOCK_CLIPBOARD_STORAGE_KEY, "{not json");

    const { result } = renderHook(() => useBlockClipboard());

    expect(result.current.clipboard).toBeNull();
  });

  it("resolves JSON that does not match the BlockClipboard shape to null", () => {
    window.localStorage.setItem(BLOCK_CLIPBOARD_STORAGE_KEY, JSON.stringify({ foo: "bar" }));

    const { result } = renderHook(() => useBlockClipboard());

    expect(result.current.clipboard).toBeNull();
  });

  it("picks up a cross-tab write via the storage event", () => {
    const { result } = renderHook(() => useBlockClipboard());
    expect(result.current.clipboard).toBeNull();

    const envelope = { version: 1, copiedAt: 1234, blocks: [heroBlock] };
    window.localStorage.setItem(BLOCK_CLIPBOARD_STORAGE_KEY, JSON.stringify(envelope));

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: BLOCK_CLIPBOARD_STORAGE_KEY,
          newValue: JSON.stringify(envelope),
        }),
      );
    });

    expect(result.current.clipboard).toEqual(envelope);
  });
});
```

#### packages/react/src/hooks/index.ts

Barrel export, anchored after the existing `useVexRevalidate` export line.

```ts
export * from "./useVexRevalidate";
export * from "./useBlockClipboard";
```

#### packages/react/src/components/form/BlockActionsMenu.tsx

Builds on step 13's file. The `BlockActionsMenuProps` interface and the component body both change throughout (four new items interleaved with the six step-13 items), so the whole function is shown — anchored by the `BlockActionsMenu` identifier.

```tsx
"use client";

import { EllipsisVerticalIcon, CopyIcon, ClipboardPasteIcon, TrashIcon } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

/**
 * Props for {@link BlockActionsMenu}.
 */
export interface BlockActionsMenuProps {
  index: number;
  count: number;
  readOnly: boolean;
  canAdd: boolean;
  blockLabel: string;
  onDuplicate: () => void;
  onInsertAbove: () => void;
  onInsertBelow: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  /** Copies this single block to the block clipboard. Never gated on `readOnly` — copying does not mutate the field. */
  onCopy: () => void;
  /** Pastes the current block clipboard contents above this block. */
  onPasteAbove: () => void;
  /** Pastes the current block clipboard contents below this block. */
  onPasteBelow: () => void;
  /** Whether the clipboard has at least one block this field accepts and pasting it would not exceed `max`. */
  canPaste: boolean;
}

/**
 * Per-block actions menu — duplicate, copy, paste above/below, insert
 * above/below, move up/down, delete.
 *
 * @param props - See {@link BlockActionsMenuProps}.
 * @returns A `DropdownMenu` trigger button and its menu content.
 */
export function BlockActionsMenu(props: BlockActionsMenuProps) {
  const isFirst = props.index === 0;
  const isLast = props.index === props.count - 1;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0 text-muted-foreground"
            aria-label={`${props.blockLabel} actions`}
          >
            <EllipsisVerticalIcon className="size-3.5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={props.readOnly || !props.canAdd} onClick={props.onDuplicate}>
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={props.onCopy}>
          <CopyIcon /> Copy
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={props.readOnly || !props.canPaste}
          onClick={props.onPasteAbove}
        >
          <ClipboardPasteIcon /> Paste above
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={props.readOnly || !props.canPaste}
          onClick={props.onPasteBelow}
        >
          <ClipboardPasteIcon /> Paste below
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={props.readOnly || !props.canAdd} onClick={props.onInsertAbove}>
          Insert above
        </DropdownMenuItem>
        <DropdownMenuItem disabled={props.readOnly || !props.canAdd} onClick={props.onInsertBelow}>
          Insert below
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={props.readOnly || isFirst} onClick={props.onMoveUp}>
          Move up
        </DropdownMenuItem>
        <DropdownMenuItem disabled={props.readOnly || isLast} onClick={props.onMoveDown}>
          Move down
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled={props.readOnly} onClick={props.onRemove}>
          <TrashIcon /> Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```


#### packages/react/src/components/form/BlockActionsMenu.test.tsx

Builds on step 13's file. `baseProps` gains the four new required props; the
trigger is no longer disabled when `readOnly` (Copy must stay reachable), so
the last test is replaced with one asserting mutating actions are blocked
while Copy still fires.

```tsx
const baseProps = {
  index: 1,
  count: 3,
  readOnly: false,
  canAdd: true,
  blockLabel: "Heading",
  onDuplicate: vi.fn(),
  onInsertAbove: vi.fn(),
  onInsertBelow: vi.fn(),
  onMoveUp: vi.fn(),
  onMoveDown: vi.fn(),
  onRemove: vi.fn(),
  onCopy: vi.fn(),
  onPasteAbove: vi.fn(),
  onPasteBelow: vi.fn(),
  canPaste: true,
};
```

Replace step 13's last test (`"disables the trigger, so the menu cannot be opened, when readOnly"`) with:

```tsx
  it("disables mutating actions, but not Copy, when readOnly", async () => {
    const onRemove = vi.fn();
    const onCopy = vi.fn();
    render(<BlockActionsMenu {...baseProps} readOnly onRemove={onRemove} onCopy={onCopy} />);
    const user = await openMenu();
    await user.click(screen.getByRole("menuitem", { name: "Remove" }));
    expect(onRemove).not.toHaveBeenCalled();

    await user.click(screen.getByRole("menuitem", { name: "Copy" }));
    expect(onCopy).toHaveBeenCalledTimes(1);
  });
```

#### packages/react/src/components/form/FormBlocks.tsx

Builds on step 13's file (header toolbar with `maxValue`/`atMax`/Collapse-all/Expand-all, the hoisted `canEdit`/`effectiveReadOnly`, and the per-block `BlockAccordionItem` sub-component rendering `BlockActionsMenu` — see step 13). All edits below are additions on top of that shape.

**1. Imports** — anchored at the existing `lucide-react` import line; add the clipboard hook, core block-paste utils, `sonner`, and the alert-dialog primitives.

```ts
import { TrashIcon, LayersIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { toast } from "sonner";
import { useBlockClipboard } from "../../hooks";
import { coerceBlockToDefinition, cloneBlockWithFreshIds } from "@vexcms/core";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
```

**2. Paste resolution + toast summary helpers** — new module-level functions, anchored after `computeDefaultOpenBlocks`.

```ts
/**
 * Matches clipboard blocks against the target field's block definitions by
 * `blockType`. Unknown `blockType`s are skipped; known blocks are coerced to
 * the target definition (unknown keys dropped, missing keys defaulted) and
 * get fresh ids (nested blocks too) so pasting never collides with an
 * existing item's id — including re-pasting into the field it was copied
 * from.
 *
 * @param props - The clipboard's blocks and the target field's block
 *   definitions keyed by `blockType`.
 * @returns The accepted, paste-ready blocks plus counts for the paste's
 *   toast summary.
 */
function resolvePasteCandidates(props: {
  blocks: GenericBlock[];
  blockDefMap: Map<string, BlockConfig>;
}): { accepted: GenericBlock[]; skipped: number; droppedKeys: number } {
  let skipped = 0;
  let droppedKeys = 0;
  const accepted: GenericBlock[] = [];
  for (const block of props.blocks) {
    const blockDef = props.blockDefMap.get(block.blockType as string);
    if (!blockDef) {
      skipped += 1;
      continue;
    }
    const coerced = coerceBlockToDefinition({ block, blockDef });
    droppedKeys += coerced.droppedKeys.length;
    accepted.push(cloneBlockWithFreshIds({ block: coerced.block, blockDef }));
  }
  return { accepted, skipped, droppedKeys };
}

/**
 * Summarizes a paste outcome as a single toast — accepted count, plus how
 * many clipboard blocks were skipped (unsupported `blockType`) and how many
 * fields were dropped off the accepted blocks (not part of the target
 * block's definition).
 *
 * @param props - The paste outcome to summarize.
 */
function toastPasteOutcome(props: { acceptedCount: number; skipped: number; droppedKeys: number }): void {
  if (props.acceptedCount === 0) {
    toast.error("Nothing in the clipboard matches this field's block types.");
    return;
  }
  const parts = [`Pasted ${props.acceptedCount} block${props.acceptedCount === 1 ? "" : "s"}.`];
  if (props.skipped > 0) {
    parts.push(`Skipped ${props.skipped} unsupported block${props.skipped === 1 ? "" : "s"}.`);
  }
  if (props.droppedKeys > 0) {
    parts.push(
      `Dropped ${props.droppedKeys} field${props.droppedKeys === 1 ? "" : "s"} not in this block's definition.`,
    );
  }
  toast(parts.join(" "));
}
```

**3. Clipboard state, paste candidates and gating** — anchored after `atMax`/`maxValue` (step 13).

```ts
const { clipboard, copyBlocks } = useBlockClipboard();
const [replaceAllOpen, setReplaceAllOpen] = useState(false);
const pasteCandidates = resolvePasteCandidates({
  blocks: clipboard?.blocks ?? [],
  blockDefMap,
});
const pasteWouldExceedMax =
  maxValue !== undefined && items.length + pasteCandidates.accepted.length > maxValue;
const replaceWouldExceedMax = maxValue !== undefined && pasteCandidates.accepted.length > maxValue;
const canPaste = !effectiveReadOnly && pasteCandidates.accepted.length > 0 && !pasteWouldExceedMax;
const canReplaceAll =
  !effectiveReadOnly && pasteCandidates.accepted.length > 0 && !replaceWouldExceedMax;
```

**4. Copy/paste handlers** — anchored after `updateBlockName`.

```ts
function handleCopyAll() {
  copyBlocks({ blocks: items });
  toast(`Copied ${items.length} block${items.length === 1 ? "" : "s"}.`);
}

function handleCopyBlock(block: GenericBlock) {
  copyBlocks({ blocks: [block] });
  toast(`Copied "${(block.blockName as string) || (block.blockType as string)}".`);
}

function handlePasteAppend() {
  if (!canPaste) return;
  field.handleChange([...items, ...pasteCandidates.accepted]);
  toastPasteOutcome({
    acceptedCount: pasteCandidates.accepted.length,
    skipped: pasteCandidates.skipped,
    droppedKeys: pasteCandidates.droppedKeys,
  });
}

function handlePasteAt(index: number, position: "above" | "below") {
  if (!canPaste) return;
  const insertIndex = position === "above" ? index : index + 1;
  const updated = [...items];
  updated.splice(insertIndex, 0, ...pasteCandidates.accepted);
  field.handleChange(updated);
  toastPasteOutcome({
    acceptedCount: pasteCandidates.accepted.length,
    skipped: pasteCandidates.skipped,
    droppedKeys: pasteCandidates.droppedKeys,
  });
}

function handleReplaceAll() {
  if (!canReplaceAll) return;
  field.handleChange(pasteCandidates.accepted);
  setReplaceAllOpen(false);
  toastPasteOutcome({
    acceptedCount: pasteCandidates.accepted.length,
    skipped: pasteCandidates.skipped,
    droppedKeys: pasteCandidates.droppedKeys,
  });
}
```

**5. Empty state** — anchored at the `{items.length === 0 && (...)}` block; adds a Paste affordance so an empty field can be seeded from the clipboard (there is nothing yet to Copy/Replace).

```tsx
{items.length === 0 && (
  <div className="rounded-sm border-2 border-dashed border-border py-8 text-center">
    <LayersIcon className="mx-auto mb-2 size-8 text-muted-foreground" />
    <p className="text-sm text-muted-foreground">No {plural} yet.</p>
    {canPaste && (
      <Button type="button" variant="outline" size="sm" className="mt-3" onClick={handlePasteAppend}>
        Paste {pasteCandidates.accepted.length} {plural}
      </Button>
    )}
  </div>
)}
```

**6. Header toolbar** — anchored at step 13's toolbar button group (the `<div className="flex items-center gap-1">` containing the Collapse all / Expand all buttons); insert Copy all / Paste / Replace all as its first three children, before Collapse all.

```tsx
<Button
  type="button"
  variant="ghost"
  size="sm"
  onClick={handleCopyAll}
  disabled={items.length === 0}
>
  Copy all
</Button>
<Button type="button" variant="ghost" size="sm" onClick={handlePasteAppend} disabled={!canPaste}>
  Paste
</Button>
<AlertDialog open={replaceAllOpen} onOpenChange={setReplaceAllOpen}>
  <AlertDialogTrigger
    render={
      <Button type="button" variant="ghost" size="sm" disabled={!canReplaceAll}>
        Replace all
      </Button>
    }
  />
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Replace all {plural}?</AlertDialogTitle>
      <AlertDialogDescription>
        This replaces all {items.length} current {items.length === 1 ? singular : plural} with{" "}
        {pasteCandidates.accepted.length} from the clipboard. This cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleReplaceAll}>Replace all</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**7. Per-block wiring** — anchored at the `<BlockAccordionItem ... />` invocation inside the block `.map()` (step 13), alongside its six existing handler props (`onDuplicate`, `onInsertAbove`, `onInsertBelow`, `onMoveUp`, `onMoveDown`, `onRemove`); add:

```tsx
onCopy={() => handleCopyBlock(item)}
onPasteAbove={() => handlePasteAt(index, "above")}
onPasteBelow={() => handlePasteAt(index, "below")}
canPaste={canPaste}
```

`BlockAccordionItem` forwards these four straight through to its own `<BlockActionsMenu>` render, exactly like the six it already forwards.

#### packages/react/src/components/form/FormBlocks.test.tsx

Builds on step 13's file (which establishes `FormBlocksHarness` — a real `useForm()` + `<AppForm>` + `<form.Field name="testField" mode="array">` wrapper around `FormBlocks`, with a local `useState` standing in for the URL-driven `modalOpen`/`openEditor`/`closeEditor`, reusing `testCollection`/`testAccess`/`testUsers`/`renderWithVexProviders` from `testing/harness/accessFixtures.ts`). Append the following `describe` block at the end of the file.

```tsx
describe("FormBlocks: block clipboard paste", () => {
  const heroBlock = defineBlock({
    slug: "hero",
    label: "Hero",
    fields: { heading: text({ label: "Heading", required: true }) },
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("pastes an accepted clipboard block appended to the field", async () => {
    const user = userEvent.setup();
    const fieldDef = blocks({ label: "Body", blocks: [heroBlock] });
    window.localStorage.setItem(
      BLOCK_CLIPBOARD_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        copiedAt: 1,
        blocks: [{ id: "clip-1", blockType: "hero", blockName: "Hero", heading: "From clipboard" }],
      }),
    );

    render(
      <FormBlocksHarness
        fieldDef={fieldDef}
        initialValue={[{ id: "b1", blockType: "hero", blockName: "Hero", heading: "Existing" }]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Paste" }));

    const value = JSON.parse(screen.getByTestId("value-probe").textContent as string) as GenericBlock[];
    expect(value).toHaveLength(2);
    expect(value[0]).toMatchObject({ id: "b1", heading: "Existing" });
    expect(value[1]).toMatchObject({ blockType: "hero", heading: "From clipboard" });
    expect(value[1]!.id).not.toBe("clip-1");
  });

  it("skips clipboard blocks whose blockType the target field does not accept and drops unknown keys", async () => {
    const user = userEvent.setup();
    const fieldDef = blocks({ label: "Body", blocks: [heroBlock] });
    window.localStorage.setItem(
      BLOCK_CLIPBOARD_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        copiedAt: 1,
        blocks: [
          { id: "clip-1", blockType: "quote", blockName: "Quote", text: "Unsupported here" },
          {
            id: "clip-2",
            blockType: "hero",
            blockName: "Hero",
            heading: "Accepted",
            notAFieldOnThisBlock: "dropped",
          },
        ],
      }),
    );

    render(<FormBlocksHarness fieldDef={fieldDef} initialValue={[]} />);

    await user.click(screen.getByRole("button", { name: /^Paste/ }));

    const value = JSON.parse(screen.getByTestId("value-probe").textContent as string) as GenericBlock[];
    expect(value).toHaveLength(1);
    expect(value[0]).toMatchObject({ blockType: "hero", heading: "Accepted" });
    expect(value[0]).not.toHaveProperty("notAFieldOnThisBlock");
  });

  it("disables Paste and Replace all when pasting would exceed the field's max", () => {
    const fieldDef = blocks({ label: "Body", blocks: [heroBlock], max: 1 });
    window.localStorage.setItem(
      BLOCK_CLIPBOARD_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        copiedAt: 1,
        blocks: [{ id: "clip-1", blockType: "hero", blockName: "Hero", heading: "From clipboard" }],
      }),
    );

    render(
      <FormBlocksHarness
        fieldDef={fieldDef}
        initialValue={[{ id: "b1", blockType: "hero", blockName: "Hero", heading: "Existing" }]}
      />,
    );

    expect(screen.getByRole("button", { name: "Paste" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Replace all" })).toBeEnabled();
  });

  it("disables Paste and Replace all when the current user lacks update permission", () => {
    const fieldDef = blocks({ label: "Body", blocks: [heroBlock] });
    window.localStorage.setItem(
      BLOCK_CLIPBOARD_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        copiedAt: 1,
        blocks: [{ id: "clip-1", blockType: "hero", blockName: "Hero", heading: "From clipboard" }],
      }),
    );

    renderWithVexProviders(
      <FormBlocksHarness
        fieldDef={fieldDef}
        collection={testCollection}
        initialValue={[{ id: "b1", blockType: "hero", blockName: "Hero", heading: "Existing" }]}
      />,
      { access: testAccess.denied, auth: { user: testUsers.denied } },
    );

    expect(screen.getByRole("button", { name: "Paste" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Replace all" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Copy all" })).toBeEnabled();
  });
});
```

Add the matching imports to the top of the file alongside step 13's: `BLOCK_CLIPBOARD_STORAGE_KEY` from `"../../hooks"`, and `beforeEach`/`afterEach` from `"vitest"` (step 13's own cases may already import these; do not duplicate the specifier).

Verify: `pnpm --filter @vexcms/react test -- useBlockClipboard FormBlocks`

### Step 15 — Per-input polish + state sweep [agent]

- [ ] `packages/core/src/fields/number/types.ts` — `step?: number` on `NumberFieldInput`/`NumberField`
- [ ] `packages/core/src/fields/select/types.ts` — `SELECT_DISPLAYS`, `SelectDisplay`, `SelectFieldAdminConfigInput`/`SelectFieldAdminConfig` (`searchable`, `display`)
- [ ] `packages/core/src/fields/select/config.ts` — `admin.searchable`/`admin.display` defaults
- [ ] `packages/react/src/components/form/FormError.tsx` — `isFieldShowingError` extracted and reused
- [ ] `packages/react/src/components/fields/text/Input.tsx` — character counter when `max` set, `aria-invalid`, both-source `disabled` (masked + unmasked branches)
- [ ] `packages/react/src/components/fields/email/Input.tsx` — same counter + `aria-invalid` + both-source `disabled` treatment as `text`
- [ ] `packages/react/src/components/fields/number/Input.tsx` — `step`/`min`/`max` HTML attributes (unmasked branch only), `aria-invalid`
- [ ] `packages/react/src/components/fields/url/Input.tsx` — open-link button, `aria-invalid`, both-source `disabled` (masked + unmasked branches)
- [ ] `packages/react/src/components/fields/select/Input.tsx` — `admin.searchable`, `admin.display: "radio"` (checkbox list when `hasMany`), `aria-invalid`, real both-source `disabled`
- [ ] `packages/react/src/components/fields/color/Input.tsx` — `aria-invalid`
- [ ] `packages/react/src/components/fields/checkbox/Input.tsx` — `aria-invalid`
- [ ] `packages/react/src/components/ui/multi-select.tsx` — `aria-invalid` styling on `MultiSelectTrigger`
- [ ] `packages/react/src/components/ui/data-table/DataTable.tsx` — apply column `meta.align` to header + cells
- [ ] `packages/react/src/testing/fieldInputContract.ts` — read-only + error rendered together, for every field type
- [ ] `packages/react/src/testing/dataTableSuite.tsx` — alignment assertion
- [ ] `packages/react/src/components/fields/{text,email,number,url,select}/Input.test.tsx` — new/updated `extra` coverage
- [ ] `packages/react/src/components/fields/array/Input.test.tsx` — update the readOnly-source test now that text's `disabled` ORs both sources
- [ ] `pnpm --filter @vexcms/react test -- fields DataTable`

Why: closes the remaining "half-built" inputs and ignored `cellAlignment`, and the
state sweep surfaces defects the per-type contract tests never caught because they
individually pass (`hasInertSignal` accepts ANY inert signal, so a passive
`aria-readonly` counted the same as a real `disabled`) while the visible behavior
disagrees across types.

**This step builds on Steps 1, 2, 3, 6 and 8 as landed, not on today's repo.** In
particular: `text`/`number`/`email`/`url` all carry Step 1's `FieldLimit` tuples
(`field.min`/`field.max` are `readonly [value, error] | undefined`, never the old
`{ value, error }` object); `email()` exists (Step 2) with the same `FieldLimit`
min/max semantics as `text`; `textarea()` exists (Step 3) and its counter markup
(`components/fields/textarea/Input.tsx`) is what `text`'s counter below reuses
verbatim — same `<p className="self-end text-[0.8rem] text-muted-foreground
tabular-nums">{value.length}/{fieldDef.max[0]}</p>`; `FieldAdminConfigInput`/
`FieldAdminConfig` (`baseTypes.ts`) carry Step 6's `width: string` (default
`"100%"`) and `layout: FieldLayoutFrame[]` (default `[]`) — every field's `admin`
defaults object below already includes `width: "100%", layout: []`, not the
pre-Step-6 `width: "full"`; and `text`/`email`/`number`/`url` each render **two**
branches from Step 8's `admin.mask` support — a masked, uncontrolled `<Input
ref={maskRef} defaultValue={…} onInput={…}>` and an unmasked, controlled `<Input
value={…} onChange={…}>` — so every fix below (both-source `disabled`,
`aria-invalid`) is applied to **both** branches, and `step`/`min`/`max` HTML
attributes are applied **only** to number's unmasked `type="number"` branch (a
masked number renders `type="text"`, where those attributes are inert). `select`
is untouched by Steps 1/2/3/8 (not maskable, no `min`/`max`) — its edits below are
unaffected by any of this and match what was already written against the
pre-mask repo.

**Audit findings (file:line as read against the Step-8-landed tree; ordered by
severity):**

1. **`packages/react/src/components/fields/select/Input.tsx:75-77`** — real functional
   bug, not just visual. `fieldDef.admin.readOnly` only set `aria-readonly` on
   `MultiSelectTrigger`, a plain informational ARIA attribute `PopoverTrigger` (a
   button) never enforces — the popover still opened and selections still worked
   with `admin.readOnly: true` and the `readOnly` prop `false`. Only the `readOnly`
   *prop* actually disabled the control (`disabled={readOnly}`). Fixed: both sources
   now drive `disabled`, matching every other field type's own OR-composition
   (already documented at `upload/Input.tsx:42-45`).
2. **No field `Input.tsx` ever sets `aria-invalid`** — `text`, `email`, `number`,
   `url`, `select`, `color` (`Input.tsx:186-197`), `checkbox` (`Input.tsx:45-54`).
   The base `Input`/`Checkbox`/`Button` primitives already ship
   `aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20`
   (`ui/input.tsx:54`, `ui/checkbox.tsx:12`) — dead CSS, because nothing ever set the
   attribute. `FormError` shows the message; the control itself never visually
   agreed. Fixed for the seven single-control types this step owns via a new shared
   `isFieldShowingError` helper (`form/FormError.tsx`), using the exact same
   touched/submissionAttempts timing `FormError` already uses, so the ring and the
   message always appear together — wired onto **both** the masked and unmasked
   `<Input>` branches for `text`/`email`/`number`/`url` (Step 8).
3. **`packages/react/src/components/ui/multi-select.tsx:138-141`** — `MultiSelectTrigger`
   carried no `aria-invalid:*` variant at all (unlike `ui/input.tsx`/`ui/checkbox.tsx`/
   `ui/button.tsx`), so even after (2) nothing would have rendered. Fixed alongside (2).
4. **`packages/react/src/components/fields/text/Input.tsx:786,798`,
   `url/Input.tsx:1065,1077`, `email/Input.tsx:1204,1217`** (Step-8-landed line
   numbers, both the masked and unmasked `<Input>`) — `disabled={readOnly}` only;
   `fieldDef.admin.readOnly` was forwarded solely as the native HTML `readonly`
   attribute, which blocks editing but carries none of
   `disabled:opacity-50 disabled:cursor-not-allowed` — a field marked
   `admin.readOnly: true` looked fully active. `number`'s own Step-8 output already
   uses `disabled={readOnly || fieldDef.admin.readOnly}` on both branches (not part
   of this defect); `text`/`email`/`url` now match it.
5. **`packages/react/src/components/ui/data-table/DataTable.tsx:239-258`** — every
   `*FieldToColumnDef` factory sets `meta.align` from `fieldDef.admin.cellAlignment`
   (e.g. `text/columnDef.tsx:60-64`), and `TableHead`/`TableCell` take a `className`
   (`ui/table.tsx`), but `DataTable` never reads `column.columnDef.meta` at all. Fixed.
6. **Deferred, not fixed in this step (out of this step's `touches`, flagged for a
   follow-up once the owning steps land):** `date/Input.tsx`'s `DateTimePicker`
   trigger and `richtext/Input.tsx` also set no `aria-invalid`, but fixing them means
   editing the large vendored `ui/datetime/date-picker.tsx`
   (~1040 lines, not part of this spec's `touches`) and the richtext editor-adapter
   contract respectively. `upload/Input.tsx` and `relationship/Input.tsx` are
   three-state `role="group"` fields the shared contract's own `hasInertSignal`/
   `getControl` helpers already exempt from the single-control assertions
   (`fieldInputContract.ts:649,882`); `relationship/Input.tsx` is also about to be
   replaced wholesale by Step 12 — auditing its pre-overhaul code would be moot.
   `textarea/Input.tsx` (Step 3) is a brand-new file this step did not touch; it
   shares `text`'s `aria-invalid` gap but is out of this step's declared scope.

#### packages/core/src/fields/number/types.ts

Two edits — `step` lives beside `min`/`max` (Step 1's `FieldLimit`/`FieldLimitInput`
tuples), unaffected by Step 8's unrelated `admin` override (inserted as the first
member of each interface, well before `max`).

**1 — `NumberFieldInput`'s `max` property: insert `step` immediately after it, before `validate`.**

```ts
  /**
   * Step increment for the number input's native spinner/validation
   * (the HTML `step` attribute). Purely a UI affordance — submitted values
   * are never rounded or rejected against it.
   */
  step?: number;
```

**2 — `NumberField`'s `max` property (resolved): insert `step` immediately after it, before `validate`.**

```ts
  /**
   * Step increment for the number input's native spinner/validation
   * (the HTML `step` attribute). Purely a UI affordance — submitted values
   * are never rounded or rejected against it.
   */
  step?: number;
```

#### packages/core/src/fields/select/types.ts

`select` is not in Step 8's `MASKABLE_FIELD_TYPES`, so it carries no `admin` override
yet — these edits add the first one. `FieldAdminConfigInput`/`FieldAdminConfig`
(from `../baseTypes`) already carry Step 6's `width: string`/`layout`/`condition`,
inherited automatically through `extends`.

**1 — import line: add `FieldAdminConfig`, `FieldAdminConfigInput` to the existing `../baseTypes` import.**

```ts
import { ADMIN_FIELDS } from "../constants";
import {
  BaseField,
  BaseFieldInput,
  FieldAdminConfig,
  FieldAdminConfigInput,
  FieldValidateProps,
} from "../baseTypes";
import type { VexResourceSlug } from "../../types/generated";
```

**2 — insert before `export interface SelectFieldInput`.**

```ts
/** Display modes a `select()` field's admin input can render as. */
export const SELECT_DISPLAYS = {
  dropdown: "dropdown",
  radio: "radio",
} as const;

/** `"dropdown" | "radio"` — see {@link SELECT_DISPLAYS}. */
export type SelectDisplay = (typeof SELECT_DISPLAYS)[keyof typeof SELECT_DISPLAYS];

/**
 * 'admin' field configuration input for a `select()` field.
 */
export interface SelectFieldAdminConfigInput extends FieldAdminConfigInput {
  /**
   * Shows a search box inside the options popover. Only meaningful when
   * `display` is `"dropdown"` (the default) — the `"radio"` display has no
   * popover to search.
   *
   * Default: `false`
   */
  searchable?: boolean;
  /**
   * How the field renders its options.
   *
   * - `"dropdown"` — a searchable-optional popover trigger (`MultiSelect`).
   * - `"radio"` — an inline list with no popover: radio buttons when
   *   `hasMany` is `false`, checkboxes when `hasMany` is `true`.
   *
   * Default: `"dropdown"`
   */
  display?: SelectDisplay;
}

/**
 * Resolved 'admin' field configuration for a `select()` field.
 */
export interface SelectFieldAdminConfig extends FieldAdminConfig {
  /** Whether the options popover shows a search box (`"dropdown"` display only). */
  searchable: boolean;
  /** How the field renders its options — `"dropdown"` or `"radio"`. */
  display: SelectDisplay;
}
```

**3 — `SelectFieldInput`'s `optionInterfaceName?: string;` line: insert `admin` immediately after it, before `validate`.**

```ts
  admin?: SelectFieldAdminConfigInput;
```

**4 — `SelectField`'s `readonly type: typeof ADMIN_FIELDS.select.type;` line: insert `admin` immediately after it.**

```ts
  /** Resolved admin UI configuration with all defaults applied. */
  admin: SelectFieldAdminConfig;
```

#### packages/core/src/fields/select/config.ts

**1 — import line: pull in `SELECT_DISPLAYS`.**

```ts
import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import type { VexResourceSlug } from "../../types/generated";
import type { SelectFieldInput, SelectField } from "./types";
import { SELECT_DISPLAYS } from "./types";
```

**2 — the admin defaults object inside `select()` (post-Step-6 shape — `width: "100%"`,
`layout: []` already present): insert `searchable`/`display` after `placeholder: ""`.**

```ts
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      layout: [],
      placeholder: "",
      searchable: false,
      display: SELECT_DISPLAYS.dropdown,
      ...options?.admin,
    },
```

#### packages/react/src/components/form/FormError.tsx

Entire file, replacing the existing implementation (untouched by Steps 1/2/3/6/8) —
`isFieldShowingError` is the same touched/submissionAttempts timing `FormError`
already computed inline, now exported so every field `Input.tsx` can drive its
control's `aria-invalid` off the identical rule the visible message uses, instead
of each type reimplementing it (or, as found above, never implementing it at all).

```tsx
import { TypedFieldApi } from "./createFieldInput";
import { Activity, ComponentPropsWithRef } from "react";
import { cn } from "../../styles/utils";

/**
 * Extracts a field's current validation-error message, if any. TanStack Form
 * v1 stores Standard Schema issue objects in `errors[]`, not strings — this
 * reads `.message` when the error is an object (Zod v4 issues carry
 * `{ origin, code, minimum, inclusive, path, message }`).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFieldErrorMessage(field: TypedFieldApi<any>): string | undefined {
  const rawError = field.state.meta.errors[0];
  return typeof rawError === "string"
    ? rawError
    : (rawError as { message?: string } | undefined)?.message;
}

/**
 * Whether a field should currently present as invalid — touched or a
 * submission has been attempted, and a real error is present. The exact
 * timing `FormError` uses to decide whether to render its message; field
 * inputs call this to set `aria-invalid` on their control so the control's
 * own destructive-ring styling (`ui/input.tsx`, `ui/checkbox.tsx`,
 * `ui/button.tsx`, `ui/multi-select.tsx`) activates in lockstep with the
 * visible message, rather than the message being the only signal.
 */
export function isFieldShowingError(props: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: TypedFieldApi<any>;
  submissionAttempts: number;
}): boolean {
  const errorMessage = getFieldErrorMessage(props.field);
  return Boolean(
    (props.field.state.meta.isTouched || props.submissionAttempts > 0) && errorMessage,
  );
}

// eslint-disable-next-line jsdoc/require-jsdoc
export function FormError({
  field,
  submissionAttempts,
  className,
  ...pProps
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: TypedFieldApi<any>;
  submissionAttempts: number;
} & ComponentPropsWithRef<"p">) {
  const errorMessage = getFieldErrorMessage(field);
  const showError = isFieldShowingError({ field, submissionAttempts });

  return (
    <Activity mode={showError ? "visible" : "hidden"}>
      <p
        className={cn("text-[0.8rem] text-destructive", className)}
        {...pProps}
      >
        {errorMessage}
      </p>
    </Activity>
  );
}
```

#### packages/react/src/components/fields/text/Input.tsx

Entire file, replacing the Step-8-landed implementation — the render function's
body changes throughout (counter, `aria-invalid`, both-source `disabled` on both
the masked and unmasked `<Input>`), so it is shown complete per the repo
convention.

```tsx
"use client";

import { useContext } from "react";

import { resolveFieldMask, type TextField } from "@vexcms/core";
import { Input } from "../../ui/input";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError, isFieldShowingError } from "../../form/FormError";
import { useFieldMask } from "../../../hooks/useFieldMask";
import { VexConfigContext } from "../../../context/VexConfigContext";

/**
 * Text field input component for the admin edit form.
 *
 * Built with `createFieldInput` — handles TanStack Form wiring automatically.
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<string>`) from a `<form.Field>` render prop.
 *
 * Renders a masked, uncontrolled `<Input>` when `fieldDef.admin.mask` (or the
 * project's `fields.inputMasks.text` default) resolves, and an unmasked,
 * controlled `<Input>` otherwise — see `useFieldMask`'s JSDoc for why the two
 * cannot share one element.
 *
 * Shows a live `length/max` character counter below the input whenever
 * `fieldDef.max` is set — purely informational, matching `url`/`number`'s own
 * no-client-side-enforcement rule: length limits are still enforced only by
 * `textFieldToInputSchema` at submit time. The same markup is reused by
 * `textarea/Input.tsx`'s own counter.
 *
 * The `name` prop is the field key from the collection config (e.g. `"title"`).
 * It connects the input to the form field with that key in `form.defaultValues`.
 *
 * @example
 * ```tsx
 * // Inside CollectionEditView — AppForm provides context
 * <AppForm form={form}>
 *   <TextFieldInput name="title" fieldDef={titleField} readOnly={false} />
 * </AppForm>
 *
 * // Explicit field prop — TypedFieldApi<string>, works outside AppForm
 * <form.Field name="title">
 *   {(field) => (
 *     <TextFieldInput
 *       name="title"
 *       fieldDef={titleField}
 *       readOnly={false}
 *       field={field}
 *     />
 *   )}
 * </form.Field>
 * ```
 */
export const TextFieldInput = createFieldInput<string, {}, TextField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    const config = useContext(VexConfigContext);
    const mask = resolveFieldMask({
      fieldType: fieldDef.type,
      fieldMask: fieldDef.admin.mask,
      inputMasks: config?.fields.inputMasks ?? {},
    });
    const maskRef = useFieldMask({ mask });
    const value = field.state.value ?? "";
    const isInvalid = isFieldShowingError({ field, submissionAttempts });
    const isDisabled = readOnly || fieldDef.admin.readOnly;
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel index={index} field={fieldDef} name={name} />
        {mask ? (
          <Input
            id={name}
            ref={maskRef}
            disabled={isDisabled}
            type="text"
            defaultValue={value}
            onInput={(e) => field.handleChange(e.currentTarget.value)}
            onBlur={field.handleBlur}
            placeholder={fieldDef.admin.placeholder}
            readOnly={fieldDef.admin.readOnly}
            aria-required={fieldDef.required}
            aria-invalid={isInvalid}
          />
        ) : (
          <Input
            id={name}
            disabled={isDisabled}
            type="text"
            value={value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            placeholder={fieldDef.admin.placeholder}
            readOnly={fieldDef.admin.readOnly}
            aria-required={fieldDef.required}
            aria-invalid={isInvalid}
          />
        )}
        {fieldDef.max && (
          <p className="self-end text-[0.8rem] text-muted-foreground tabular-nums">
            {value.length}/{fieldDef.max[0]}
          </p>
        )}
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
```

#### packages/react/src/components/fields/email/Input.tsx

Entire file, replacing the Step-8-landed implementation — same counter and
`aria-invalid`/`disabled` treatment as `text/Input.tsx` above, requested
explicitly so `email` doesn't fall behind `text`'s polish. Keeps Step 8's
`type="email"`/`type="text"` branch split and `autoComplete="email"` on both.

```tsx
"use client";

import { useContext } from "react";

import { resolveFieldMask, type EmailField } from "@vexcms/core";
import { Input } from "../../ui/input";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError, isFieldShowingError } from "../../form/FormError";
import { useFieldMask } from "../../../hooks/useFieldMask";
import { VexConfigContext } from "../../../context/VexConfigContext";

/**
 * Email field input component for the admin edit form.
 *
 * Built with `createFieldInput` — handles TanStack Form wiring automatically.
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<string>`) from a `<form.Field>` render prop.
 *
 * Renders a masked, uncontrolled `type="text"` `<Input>` when
 * `fieldDef.admin.mask` (or the project's `fields.inputMasks.email` default)
 * resolves, and an unmasked, controlled native `type="email"` `<Input>`
 * otherwise — see `useFieldMask`'s JSDoc for why the two cannot share one
 * element. `autoComplete="email"` is set on both branches.
 *
 * Shows a live `length/max` character counter below the input whenever
 * `fieldDef.max` is set, identical markup to `text/Input.tsx`'s own counter —
 * purely informational; length limits are still enforced only by
 * `emailFieldToInputSchema` at submit time.
 *
 * The `name` prop is the field key from the collection config (e.g. `"contactEmail"`).
 * It connects the input to the form field with that key in `form.defaultValues`.
 *
 * @example
 * ```tsx
 * // Inside CollectionEditView — AppForm provides context
 * <AppForm form={form}>
 *   <EmailFieldInput name="contactEmail" fieldDef={contactEmailField} readOnly={false} />
 * </AppForm>
 * ```
 */
export const EmailFieldInput = createFieldInput<string, {}, EmailField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    const config = useContext(VexConfigContext);
    const mask = resolveFieldMask({
      fieldType: fieldDef.type,
      fieldMask: fieldDef.admin.mask,
      inputMasks: config?.fields.inputMasks ?? {},
    });
    const maskRef = useFieldMask({ mask });
    const value = field.state.value ?? "";
    const isInvalid = isFieldShowingError({ field, submissionAttempts });
    const isDisabled = readOnly || fieldDef.admin.readOnly;
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel index={index} field={fieldDef} name={name} />
        {mask ? (
          <Input
            id={name}
            ref={maskRef}
            disabled={isDisabled}
            type="text"
            autoComplete="email"
            defaultValue={value}
            onInput={(e) => field.handleChange(e.currentTarget.value)}
            onBlur={field.handleBlur}
            placeholder={fieldDef.admin.placeholder}
            readOnly={fieldDef.admin.readOnly}
            aria-required={fieldDef.required}
            aria-invalid={isInvalid}
          />
        ) : (
          <Input
            id={name}
            disabled={isDisabled}
            type="email"
            autoComplete="email"
            value={value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            placeholder={fieldDef.admin.placeholder}
            readOnly={fieldDef.admin.readOnly}
            aria-required={fieldDef.required}
            aria-invalid={isInvalid}
          />
        )}
        {fieldDef.max && (
          <p className="self-end text-[0.8rem] text-muted-foreground tabular-nums">
            {value.length}/{fieldDef.max[0]}
          </p>
        )}
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
```

#### packages/react/src/components/fields/number/Input.tsx

Entire file, replacing the Step-8-landed implementation. `step`/`min`/`max` HTML
attributes apply only to the unmasked `type="number"` branch — a masked number
renders `type="text"` (Step 8), where `step`/`min`/`max` are inert; `number`'s
`disabled` was already both-source on both branches pre-this-step, so no change
there.

```tsx
"use client";

import { useContext } from "react";

import { resolveFieldMask, type NumberField } from "@vexcms/core";
import { Input } from "../../ui/input";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError, isFieldShowingError } from "../../form/FormError";
import { useFieldMask } from "../../../hooks/useFieldMask";
import { VexConfigContext } from "../../../context/VexConfigContext";

/**
 * Number field input component for the admin edit form.
 *
 * Built with `createFieldInput` — handles TanStack Form wiring automatically.
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<number>`) from a `<form.Field>` render prop.
 *
 * Renders a masked, uncontrolled `type="text"` `<Input>` when
 * `fieldDef.admin.mask` (or the project's `fields.inputMasks.number` default)
 * resolves — still storing a `number` — and an unmasked, controlled
 * `type="number"` `<Input>` otherwise.
 *
 * `fieldDef.step`/`fieldDef.min`/`fieldDef.max` are forwarded as the native
 * `step`/`min`/`max` HTML attributes on the unmasked branch only — UI
 * affordances (spinner increment, browser validity styling), never
 * client-side clamping; range enforcement stays entirely in
 * `numberFieldToInputSchema`.
 *
 * The `name` prop is the field key from the collection config (e.g. `"price"`).
 * It connects the input to the form field with that key in `form.defaultValues`.
 *
 * @example
 * ```tsx
 * // Inside CollectionEditView — AppForm provides context
 * <AppForm form={form}>
 *   <NumberFieldInput name="price" fieldDef={priceField} readOnly={false} />
 * </AppForm>
 * ```
 */
export const NumberFieldInput = createFieldInput<number, {}, NumberField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    const config = useContext(VexConfigContext);
    const mask = resolveFieldMask({
      fieldType: fieldDef.type,
      fieldMask: fieldDef.admin.mask,
      inputMasks: config?.fields.inputMasks ?? {},
    });
    const maskRef = useFieldMask({ mask });
    const isInvalid = isFieldShowingError({ field, submissionAttempts });
    const isDisabled = readOnly || fieldDef.admin.readOnly;
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel field={fieldDef} index={index} name={name} />
        {mask ? (
          <Input
            id={name}
            ref={maskRef}
            disabled={isDisabled}
            type="text"
            defaultValue={field.state.value !== undefined ? String(field.state.value) : ""}
            onInput={(e) => {
              const raw = e.currentTarget.value;
              field.handleChange(raw === "" ? (undefined as unknown as number) : Number(raw));
            }}
            onBlur={field.handleBlur}
            placeholder={fieldDef.admin.placeholder}
            readOnly={fieldDef.admin.readOnly}
            aria-required={fieldDef.required}
            aria-invalid={isInvalid}
          />
        ) : (
          <Input
            id={name}
            disabled={isDisabled}
            type="number"
            step={fieldDef.step}
            min={fieldDef.min?.[0]}
            max={fieldDef.max?.[0]}
            value={field.state.value ?? 0}
            onChange={(e) =>
              field.handleChange(
                e.target.value === "" ? (undefined as unknown as number) : Number(e.target.value),
              )
            }
            onBlur={field.handleBlur}
            placeholder={fieldDef.admin.placeholder}
            readOnly={fieldDef.admin.readOnly}
            aria-required={fieldDef.required}
            aria-invalid={isInvalid}
          />
        )}
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
```

#### packages/react/src/components/fields/url/Input.tsx

Entire file, replacing the Step-8-landed implementation. The open-link button
sits outside the mask branch — it reads `field.state.value` directly, which
stays the live, reactive form value in both the masked (uncontrolled DOM,
`onInput` still calls `field.handleChange`) and unmasked cases.

```tsx
"use client";

import { useContext } from "react";
import { resolveFieldMask, type UrlField } from "@vexcms/core";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError, isFieldShowingError } from "../../form/FormError";
import { useFieldMask } from "../../../hooks/useFieldMask";
import { VexConfigContext } from "../../../context/VexConfigContext";

/**
 * Whether `value` parses as an absolute URL (`new URL()` succeeds). Used only
 * to enable/disable the open-link button below — format validation for
 * submission stays entirely in `urlFieldToInputSchema`, never here.
 */
function isParseableUrl(value: string): boolean {
  if (!value) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * URL field input component for the admin edit form.
 *
 * Renders a masked, uncontrolled `<Input>` when `fieldDef.admin.mask` (or the
 * project's `fields.inputMasks.url` default) resolves, and an unmasked,
 * controlled `<Input type="text">` otherwise — URL format validation is
 * handled by `urlFieldToInputSchema` at submit time either way, never by the
 * browser's built-in `type="url"` input. Built with `createFieldInput`, which
 * handles TanStack Form wiring automatically.
 *
 * An open-link button sits beside the input, enabled only while the current
 * value parses as an absolute URL (`isParseableUrl`); it opens the value in a
 * new tab with `rel="noopener noreferrer"`.
 *
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<string>`) from a `<form.Field>` render prop.
 *
 * The `name` prop is the field key from the collection config (e.g. `"website"`).
 * It connects the input to the form field with that key in `form.defaultValues`.
 *
 * @example
 * ```tsx
 * // Inside CollectionEditView — AppForm provides context
 * <AppForm form={form}>
 *   <UrlFieldInput name="website" fieldDef={websiteField} readOnly={false} />
 * </AppForm>
 * ```
 */
export const UrlFieldInput = createFieldInput<string, {}, UrlField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    const config = useContext(VexConfigContext);
    const mask = resolveFieldMask({
      fieldType: fieldDef.type,
      fieldMask: fieldDef.admin.mask,
      inputMasks: config?.fields.inputMasks ?? {},
    });
    const maskRef = useFieldMask({ mask });
    const value = field.state.value ?? "";
    const isValidUrl = isParseableUrl(value);
    const isInvalid = isFieldShowingError({ field, submissionAttempts });
    const isDisabled = readOnly || fieldDef.admin.readOnly;
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel field={fieldDef} index={index} name={name} />
        <div className="flex items-center gap-2">
          {mask ? (
            <Input
              id={name}
              ref={maskRef}
              type="text"
              disabled={isDisabled}
              defaultValue={value}
              onInput={(e) => field.handleChange(e.currentTarget.value)}
              onBlur={field.handleBlur}
              placeholder={fieldDef.admin.placeholder}
              readOnly={fieldDef.admin.readOnly}
              aria-required={fieldDef.required}
              aria-invalid={isInvalid}
            />
          ) : (
            <Input
              id={name}
              type="text"
              disabled={isDisabled}
              value={value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder={fieldDef.admin.placeholder}
              readOnly={fieldDef.admin.readOnly}
              aria-required={fieldDef.required}
              aria-invalid={isInvalid}
            />
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            nativeButton={false}
            disabled={!isValidUrl}
            aria-label="Open link in new tab"
            icon="ExternalLink"
            iconPosition="center"
            render={
              <a href={isValidUrl ? value : undefined} target="_blank" rel="noopener noreferrer" />
            }
          />
        </div>
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
```

#### packages/react/src/components/fields/select/Input.tsx

Entire file, replacing the existing implementation. `select` is untouched by
Steps 1/2/3/8. Step 9 (`g-step-09.md:1835-1841`) makes one isolated edit to the
pre-this-step file — the JSDoc line `Fields are rendered generically by
\`RenderFieldInputComponents\`, so there is` → `` `RenderFields`, so there is ``
(`RenderFieldInputComponents` is removed in Step 9). This full-file rewrite
already carries the post-Step-9 wording verbatim in its JSDoc below (see
"Fields are rendered generically by `RenderFields`, so there is no prop
channel…"), so no further re-anchoring is needed — the entire-file replacement
subsumes Step 9's one-line edit.

```tsx
"use client";

import { SELECT_DISPLAYS, type SelectField } from "@vexcms/core";
import { useModalSurface } from "../../../hooks/useModalSurface";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError, isFieldShowingError } from "../../form/FormError";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "../../ui/multi-select";

/**
 * Select field input component for the admin edit form.
 *
 * Built with `createFieldInput` — handles TanStack Form wiring automatically.
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<string[]>`) from a `<form.Field>` render prop.
 *
 * The `name` prop is the field key from the collection config (e.g. `"status"`).
 * It connects the input to the form field with that key in `form.defaultValues`.
 * When `fieldDef.hasMany` is `false`, only one option may be selected at a time.
 *
 * `fieldDef.admin.display` picks the rendering: the default `"dropdown"` is a
 * popover (`MultiSelect`), optionally searchable via `fieldDef.admin.searchable`;
 * `"radio"` renders an inline list with no popover — radio buttons when
 * `hasMany` is `false`, checkboxes when `hasMany` is `true` — and ignores
 * `searchable`, which only applies to the popover.
 *
 * Fields are rendered generically by `RenderFields`, so there is no prop
 * channel to tell this input it sits in a dialog. It reads `useModalSurface()`
 * instead, which `Modal` provides: inside a dialog the popover joins that
 * surface's focus trap, and everywhere else it stays non-modal so it does not
 * lock page scroll and snap the view to the top. Only the `"dropdown"` display
 * has a popover to apply this to.
 *
 * @example
 * ```tsx
 * // Inside CollectionEditView — AppForm provides context
 * <AppForm form={form}>
 *   <SelectFieldInput name="status" fieldDef={statusField} readOnly={false} />
 * </AppForm>
 *
 * // Explicit field prop — TypedFieldApi<string[]>, works outside AppForm
 * <form.Field name="tags">
 *   {(field) => (
 *     <SelectFieldInput
 *       name="tags"
 *       fieldDef={tagsField}
 *       readOnly={false}
 *       field={field}
 *     />
 *   )}
 * </form.Field>
 * ```
 */
export const SelectFieldInput = createFieldInput<string[], {}, SelectField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    const isOnModalSurface = useModalSurface();
    const isReadOnly = readOnly || fieldDef.admin.readOnly;
    const isInvalid = isFieldShowingError({ field, submissionAttempts });

    function handleOptionToggle(value: string) {
      const current = field.state.value ?? [];
      if (fieldDef.hasMany) {
        field.handleChange(
          current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
        );
      } else {
        field.handleChange(current.includes(value) ? [] : [value]);
      }
    }

    if (fieldDef.admin.display === SELECT_DISPLAYS.radio) {
      return (
        <div className="flex flex-col gap-1.5">
          <span
            id={`${name}-label`}
            className="relative flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
          >
            {index !== undefined ? `[${index + 1}] - ` : ""}
            {fieldDef.label || name}
            {fieldDef.required && <span className="text-red-500">*</span>}
          </span>
          <div
            role="group"
            aria-labelledby={`${name}-label`}
            aria-disabled={isReadOnly}
            className="flex flex-col gap-2"
          >
            {fieldDef.options.map((option, optionIndex) => (
              <label
                key={`${name}-option-${optionIndex}`}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type={fieldDef.hasMany ? "checkbox" : "radio"}
                  name={name}
                  value={option.value}
                  checked={(field.state.value ?? []).includes(option.value)}
                  disabled={isReadOnly}
                  onChange={() => handleOptionToggle(option.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                  className="size-4 shrink-0 rounded-sm border border-input accent-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
                />
                {option.label}
              </label>
            ))}
          </div>
          <FormDescription field={fieldDef} />
          <FormError field={field} submissionAttempts={submissionAttempts} />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel field={fieldDef} index={index} name={name} />
        <MultiSelect
          modal={isOnModalSurface}
          onValuesChange={field.handleChange}
          single={!fieldDef.hasMany}
          values={field.state.value}
        >
          <MultiSelectTrigger
            id={name}
            className="w-full"
            onBlur={field.handleBlur}
            name={name}
            aria-required={fieldDef.required}
            aria-invalid={isInvalid}
            disabled={isReadOnly}
          >
            <MultiSelectValue placeholder={fieldDef.admin.placeholder} />
          </MultiSelectTrigger>
          <MultiSelectContent
            onBlur={field.handleBlur}
            className="w-full"
            search={fieldDef.admin.searchable}
          >
            <MultiSelectGroup>
              {fieldDef.options.map((o, i) => (
                <MultiSelectItem value={o.value} key={`multi-select-item-${name}-${i}`}>
                  {o.label}
                </MultiSelectItem>
              ))}
            </MultiSelectGroup>
          </MultiSelectContent>
        </MultiSelect>
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
```

#### packages/react/src/components/fields/color/Input.tsx

Untouched by Steps 1/2/3/6/8 — same edit as against the pre-mask repo.

**1 — import line: `FormError` → add `isFieldShowingError`.**

```ts
import { FormError, isFieldShowingError } from "../../form/FormError";
```

**2 — the text `<Input id={name} ...>` control (the one carrying `aria-required={fieldDef.required}`): insert `aria-invalid` immediately after it.**

```tsx
          <Input
            id={name}
            type="text"
            className="font-mono"
            disabled={disabled}
            value={value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            placeholder={fieldDef.admin.placeholder || FORMAT_PLACEHOLDERS[fieldDef.format]}
            readOnly={fieldDef.admin.readOnly}
            aria-required={fieldDef.required}
            aria-invalid={isFieldShowingError({ field, submissionAttempts })}
          />
```

#### packages/react/src/components/fields/checkbox/Input.tsx

Untouched by Steps 1/2/3/6/8 — same edit as against the pre-mask repo.

**1 — import line: `FormError` → add `isFieldShowingError`.**

```ts
import { FormError, isFieldShowingError } from "../../form/FormError";
```

**2 — the `<Checkbox>` control: insert `aria-invalid` immediately after `onBlur={field.handleBlur}`.**

```tsx
          <Checkbox
            id={name}
            aria-labelledby={`${name}-label`}
            required={fieldDef.required}
            readOnly={readOnly || fieldDef.admin.readOnly}
            disabled={readOnly || fieldDef.admin.readOnly}
            checked={field.state.value ?? false}
            onCheckedChange={(checked) => field.handleChange(checked)}
            onBlur={field.handleBlur}
            aria-invalid={isFieldShowingError({ field, submissionAttempts })}
          />
```

#### packages/react/src/components/ui/multi-select.tsx

Untouched by Steps 1/2/3/6/8 — same edit as against the pre-mask repo.

**1 — `MultiSelectTrigger`'s className string: insert `aria-invalid:*` variants after `disabled:opacity-50`, before the `[&_svg]` selectors.**

```ts
      className={cn(
        "flex h-auto min-h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
```

#### packages/react/src/components/ui/data-table/DataTable.tsx

Untouched by Steps 1/2/3/6/8 — same edit as against the pre-mask repo.

**1 — imports: widen the `@vexcms/core` import.**

```ts
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table";
import { VexDocument, type Alignment } from "@vexcms/core";
import { useMemo, useState } from "react";
import { Checkbox } from "../checkbox";
import { Button } from "../button";
import { BulkDeleteModal } from "./DeleteManyModal";
import { DataTableBulkActions } from "./DataTableBulkActions";
```

**2 — insert before `export interface DataTableProps`: the local column-meta shape every `*FieldToColumnDef` factory already assigns (`ColumnDef.meta` is TanStack Table's empty declaration-merge extension point, never augmented in this package — same read-back pattern `testing/columnDefSuite.ts`'s `CellColumnMeta` already uses), plus the alignment→class map.**

```ts
/**
 * `ColumnDef.meta`'s actual shape in this package — every `*FieldToColumnDef`
 * factory (`components/fields/<type>/columnDef.tsx`) sets `label`/`align`/
 * `isTitleField`, read back through this local type since the library's own
 * `ColumnMeta` is an empty interface this package never augments.
 */
interface DataTableColumnMeta {
  align?: Alignment;
}

/** Tailwind text-alignment class per {@link Alignment}, applied to both the header and data cells of a column. */
const ALIGNMENT_CLASS: Record<Alignment, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};
```

**3 — the header row's `<TableHead>`: apply the column's alignment class.**

```tsx
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={
                    ALIGNMENT_CLASS[
                      (header.column.columnDef.meta as DataTableColumnMeta | undefined)?.align ??
                        "left"
                    ]
                  }
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
```

**4 — the body row's `<TableCell>`: apply the same alignment class.**

```tsx
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={
                    ALIGNMENT_CLASS[
                      (cell.column.columnDef.meta as DataTableColumnMeta | undefined)?.align ??
                        "left"
                    ]
                  }
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
```

#### packages/react/src/testing/fieldInputContract.ts

Untouched by Steps 1/2/3/6/8 — same edit as against the pre-mask repo.

**1 — insert a new section before the `extra?.(options);` line that closes the `describe` block (after section "10. Accessibility").** Type-agnostic: every field type's `onSubmit` validator runs the same real schema regardless of `readOnly`/`admin.readOnly`, and `hasInertSignal` is already proven to hold for both sources by the existing section 4 tests, so these two hold for every current and future field type without per-type exceptions.

```ts
    // ── 11. Read-only + error rendered together ─────────────────────────────
    it("still shows the validation error after submission when the field is read-only via the `readOnly` prop", async () => {
      const errorMessage = deriveInvalidErrorMessage();
      const user = userEvent.setup();
      const { container } = renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: true,
        initialValue: fixture.invalid,
      });

      await user.click(screen.getByRole("button", { name: /submit/i }));

      expect(await screen.findByText(errorMessage)).toBeVisible();
      expect(hasInertSignal(getControl(container, label))).toBe(true);
    });

    it("still shows the validation error after submission when the field is read-only via fieldDef.admin.readOnly", async () => {
      const errorMessage = deriveInvalidErrorMessage();
      const user = userEvent.setup();
      const fieldDef = withFieldDef(fixture.fieldDef, { admin: { readOnly: true } });
      const { container } = renderField({
        Component,
        fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.invalid,
      });

      await user.click(screen.getByRole("button", { name: /submit/i }));

      expect(await screen.findByText(errorMessage)).toBeVisible();
      expect(hasInertSignal(getControl(container, label))).toBe(true);
    });

```

#### packages/react/src/testing/dataTableSuite.tsx

Untouched by Steps 1/2/3/6/8 — same edit as against the pre-mask repo.

**1 — insert a new test inside the `"DataTable"` describe block, immediately after `"renders the header label and every row's cell"`'s closing `});`, before `"hides Load More..."`.**

```ts
      it("applies the column's meta.align to both the header cell and every row's data cell", () => {
        const alignedColumns: ColumnDef<Row>[] = [
          { accessorKey: "title", header: "Title", meta: { align: "right" } },
        ];
        render(<DataTable data={ROWS} columns={alignedColumns} />);

        expect(screen.getByRole("columnheader", { name: "Title" })).toHaveClass("text-right");
        for (const row of ROWS) {
          expect(screen.getByRole("cell", { name: row.title })).toHaveClass("text-right");
        }
      });

```

#### packages/react/src/components/fields/text/Input.test.tsx

Step 8 only APPENDS a new top-level `describe("text: admin.mask", ...)` after the
`runFieldInputContractSuite({ … })` call closes — the `extra` callback's own body,
including `describe("text: length boundaries...")`, is untouched, so this anchor
still applies.

**1 — insert a new `describe` inside `extra`, immediately after the existing `describe("text: length boundaries...")` block's closing `});`.**

```tsx
    describe("text: character counter", () => {
      it("renders no counter when fieldDef.max is not set", () => {
        render(
          <TextValidationHarness
            fieldDef={text({ label: "Bio" })}
            collection={collection}
            initialValue=""
          />,
        );
        expect(screen.queryByText(/^\d+\/\d+$/)).not.toBeInTheDocument();
      });

      it("shows current length / max once fieldDef.max is set", () => {
        const fieldDef = text({ label: "Bio", max: [10, "Too long"] });
        render(
          <TextValidationHarness fieldDef={fieldDef} collection={collection} initialValue="Hi" />,
        );
        expect(screen.getByText("2/10")).toBeInTheDocument();
      });

      it("updates live as the user types", async () => {
        const user = userEvent.setup();
        const fieldDef = text({ label: "Bio", max: [10, "Too long"] });
        render(
          <TextValidationHarness fieldDef={fieldDef} collection={collection} initialValue="" />,
        );
        const input = screen.getByLabelText("Bio", { exact: false });
        await user.type(input, "Hello");
        expect(screen.getByText("5/10")).toBeInTheDocument();
      });
    });

```

#### packages/react/src/components/fields/email/Input.test.tsx

Mirrors `text/Input.test.tsx`'s edit above, inside the same `extra` callback. Step
8 only appends a new top-level `describe("email: admin.mask", ...)` after the
`runFieldInputContractSuite({ … })` call closes (Step 8, `g-step-08.md:1267-1298`)
— `extra`'s own body is untouched, so this anchor applies cleanly. `email` already
imports `email`, `EmailValidationHarness`; no new imports needed.

**1 — insert a new `describe` inside `extra`, immediately after the existing `describe("email: native input type, format validation, and length boundaries", ...)` block's closing `});` (Step 2, `g-step-02.md:958-1006`).**

```tsx
    describe("email: character counter", () => {
      it("renders no counter when fieldDef.max is not set", () => {
        render(
          <EmailValidationHarness
            fieldDef={email({ label: "Contact Email" })}
            collection={collection}
            initialValue=""
          />,
        );
        expect(screen.queryByText(/^\d+\/\d+$/)).not.toBeInTheDocument();
      });

      it("shows current length / max once fieldDef.max is set", () => {
        const fieldDef = email({ label: "Contact Email", max: [20, "Too long"] });
        render(
          <EmailValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue="a@b.com"
          />,
        );
        expect(screen.getByText("7/20")).toBeInTheDocument();
      });

      it("updates live as the user types", async () => {
        const user = userEvent.setup();
        const fieldDef = email({ label: "Contact Email", max: [20, "Too long"] });
        render(
          <EmailValidationHarness fieldDef={fieldDef} collection={collection} initialValue="" />,
        );
        const input = screen.getByLabelText("Contact Email", { exact: false });
        await user.type(input, "a@b.com");
        expect(screen.getByText("7/20")).toBeInTheDocument();
      });
    });

```

#### packages/react/src/components/fields/number/Input.test.tsx

`number` is already imported by Step 8's own edit to this file
(`g-step-08.md:963-969`) — no new import needed here.

**1 — replace the `it("does not forward fieldDef.min/max as native HTML attributes and does not clamp typed values...")` test (the one inside `describe("number: numeric coercion, decimal/negative handling, and the ?? 0 empty fallback", ...)`) with the following — min/max/step ARE now forwarded on the unmasked branch; clamping is still never applied client-side. The field def below carries no `admin.mask`, so `NumberHarness` renders the unmasked `type="number"` branch.**

```tsx
      it("forwards fieldDef.min/max/step as native HTML attributes but still does not clamp a typed value — range enforcement stays the schema's job", async () => {
        const user = userEvent.setup();
        const fieldDef = number({
          label: "Quantity",
          min: [0, "Quantity cannot be negative."],
          max: [100, "Quantity cannot exceed 100."],
          step: 5,
        });
        render(
          <NumberHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(fieldDef.label, { exact: false });
        expect(input).toHaveAttribute("min", "0");
        expect(input).toHaveAttribute("max", "100");
        expect(input).toHaveAttribute("step", "5");
        await user.clear(input);
        await user.type(input, "999");
        expect(input).toHaveValue(999);
        expect(screen.getByTestId("value-probe").textContent).toBe("999");
      });
```

#### packages/react/src/components/fields/url/Input.test.tsx

`url` is already imported by Step 8's own edit to this file (`g-step-08.md:1103-1109`,
though these new tests don't need it — they construct no inline `url()` fieldDefs).
Step 8 appends `describe("url: admin.mask", ...)` after `runFieldInputContractSuite`
closes; `extra`'s body is untouched.

**1 — insert a new `describe` inside `extra`, immediately after `describe("url: urlFieldToInputSchema...")`'s closing `});`.**

```tsx
    describe("url: open-link button", () => {
      it("disables the open-link button when the field is empty", () => {
        render(
          <UrlHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue=""
          />,
        );
        expect(screen.getByRole("button", { name: "Open link in new tab" })).toHaveAttribute(
          "aria-disabled",
          "true",
        );
      });

      it("disables the open-link button while the value does not parse as a URL", async () => {
        const user = userEvent.setup();
        render(
          <UrlHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.type(input, "not-a-valid-url");
        expect(screen.getByRole("button", { name: "Open link in new tab" })).toHaveAttribute(
          "aria-disabled",
          "true",
        );
      });

      it("enables the open-link button once the value parses as a URL, pointing at it with target=_blank and rel=noopener", async () => {
        const user = userEvent.setup();
        render(
          <UrlHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.type(input, options.fixture.valid);
        const link = screen.getByRole("button", { name: "Open link in new tab" });
        expect(link).toHaveAttribute("href", options.fixture.valid);
        expect(link).toHaveAttribute("target", "_blank");
        expect(link.getAttribute("rel")).toContain("noopener");
      });
    });

```

#### packages/react/src/components/fields/select/Input.test.tsx

Untouched by Steps 1/2/3/6/8 — same edit as against the pre-mask repo.

**1 — import line: add `SELECT_DISPLAYS` to the `@vexcms/core` import.**

```ts
import { select, SELECT_DISPLAYS, type SelectField } from "@vexcms/core";
```

**3 — the pre-existing `it("opens without crashing and lists no options when fieldDef.options is empty", ...)` test (inside `describe("select field", ...)`): its `waitFor` assertion pinned the reveal effect's focus target to `command-input`, which was always correct while `MultiSelectContent`'s `search` prop had no caller-supplied value and defaulted to `true`. `fixture.fieldDef` here carries no `admin.searchable` override, so it now resolves `select()`'s new default (`false` — edit 2 above), and the reveal effect focuses the sr-only `[data-multiselect-focus]` button instead (`ui/multi-select.tsx:352-363`), not `command-input`. Replace the `await waitFor(...)` call.**

```tsx
        await user.click(screen.getByRole("combobox"));
        // No option ever appears to `findByRole` on, so wait on the reveal
        // effect's own side effect instead — the popup's initial focus
        // target taking focus, same assertion `ui/multi-select.test.tsx`
        // uses to pin that effect. `admin.searchable` defaults to `false`
        // (Step 15), so the focus target is the sr-only
        // `[data-multiselect-focus]` button, not the search `command-input`.
        await waitFor(() =>
          expect(document.activeElement?.hasAttribute("data-multiselect-focus")).toBe(true),
        );
```

**2 — insert two new `describe` blocks inside `extra`, immediately after the existing `describe("select field", ...)` block's closing `});`.**

```tsx
    describe("select: admin.searchable", () => {
      it("renders no search box by default (admin.searchable: false)", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);
        await user.click(screen.getByRole("combobox"));
        expect(document.querySelector('[data-slot="command-input"]')).not.toBeInTheDocument();
      });

      it("renders a search box when admin.searchable is true", async () => {
        const user = userEvent.setup();
        const searchableFieldDef = select({
          label: "Status",
          hasMany: true,
          options: fixture.fieldDef.options,
          admin: { searchable: true },
        });
        render(<SelectHarness fieldDef={searchableFieldDef} initialValue={[]} />);
        await user.click(screen.getByRole("combobox"));
        await waitFor(() =>
          expect(document.activeElement?.getAttribute("data-slot")).toBe("command-input"),
        );
        expect(document.activeElement).toHaveAttribute("data-slot", "command-input");
      });
    });

    describe("select: admin.display radio/checkbox list", () => {
      it("renders radio inputs instead of the dropdown when hasMany is false and display is radio", () => {
        const radioFieldDef = select({
          label: "Status",
          hasMany: false,
          options: fixture.fieldDef.options,
          admin: { display: SELECT_DISPLAYS.radio },
        });
        render(<SelectHarness fieldDef={radioFieldDef} initialValue={[]} />);
        expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
        for (const option of radioFieldDef.options) {
          expect(screen.getByRole("radio", { name: option.label })).toBeInTheDocument();
        }
      });

      it("renders checkboxes instead of radios when hasMany is true and display is radio", () => {
        const checkboxFieldDef = select({
          label: "Status",
          hasMany: true,
          options: fixture.fieldDef.options,
          admin: { display: SELECT_DISPLAYS.radio },
        });
        render(<SelectHarness fieldDef={checkboxFieldDef} initialValue={[]} />);
        for (const option of checkboxFieldDef.options) {
          expect(screen.getByRole("checkbox", { name: option.label })).toBeInTheDocument();
        }
      });

      it("selects a single value by clicking its radio, replacing any previous selection", async () => {
        const user = userEvent.setup();
        const radioFieldDef = select({
          label: "Status",
          hasMany: false,
          options: fixture.fieldDef.options,
          admin: { display: SELECT_DISPLAYS.radio },
        });
        render(<SelectHarness fieldDef={radioFieldDef} initialValue={["draft"]} />);
        await user.click(screen.getByRole("radio", { name: "Published" }));
        expect(screen.getByTestId("value-probe").textContent).toBe(
          JSON.stringify(["published"]),
        );
      });

      it("accumulates checked values by clicking multiple checkboxes when hasMany and display is radio", async () => {
        const user = userEvent.setup();
        const checkboxFieldDef = select({
          label: "Status",
          hasMany: true,
          options: fixture.fieldDef.options,
          admin: { display: SELECT_DISPLAYS.radio },
        });
        render(<SelectHarness fieldDef={checkboxFieldDef} initialValue={[]} />);
        await user.click(screen.getByRole("checkbox", { name: "Draft" }));
        await user.click(screen.getByRole("checkbox", { name: "Published" }));
        expect(screen.getByTestId("value-probe").textContent).toBe(
          JSON.stringify(["draft", "published"]),
        );
      });
    });

```

#### packages/react/src/components/fields/array/Input.test.tsx

Pre-existing test, not authored by any step — documented the pre-Step-15 defect
(audit finding 4: `text`'s `disabled` was forwarded from the `readOnly` prop
only, never OR-ed with the item's own `fieldDef.admin.readOnly`). `text/Input.tsx`'s
rewrite above now ORs both sources into `disabled` on every branch, so the
array item's control IS now disabled when only its own `admin.readOnly` is
true (the array's `readOnly` prop stays its own, separate source — still
ungated by an item's `admin.readOnly`, per the array's own Add-button
assertion below, unchanged).

**1 — the `it("honors the item field's own admin.readOnly independently of the array's readOnly prop...")` test body: `expect(input).not.toBeDisabled()` → `expect(input).toBeDisabled()`, with an updated comment.**

```tsx
        const input = screen
          .getAllByLabelText("Score", { exact: false })
          .find((el): el is HTMLInputElement => el.tagName === "INPUT")!;
        // TextFieldInput now ORs both readOnly sources into `disabled` (Step
        // 15 fix #4) — the PROP is `false` here (FormArray forwarded
        // `readOnly={false}` unmodified), but the item's own
        // `fieldDef.admin.readOnly` alone is enough to disable the control,
        // and still sets the native `readonly` HTML attribute too.
        expect(input).toBeDisabled();
        expect(input).toHaveAttribute("readonly");
        await user.type(input, "!");
        expect(input.value).toBe("x");

        // The array's own Add control is unaffected — only the array's OWN
        // readOnly source gates it, not an item's admin.readOnly.
        expect(
          screen.getByRole("button", { name: `Add ${readOnlyItemFieldDef.labels.singular}` }),
        ).not.toBeDisabled();
```

Verify: `pnpm --filter @vexcms/react test -- fields DataTable`

### Step 16 — Dogfood in `apps/test` + plan bookkeeping [dev]

- [ ] `apps/test/src/vexcms/blocks/CTA/config.ts` — `linkType` select + conditional `internalPage` relationship / `externalUrl` url pair
- [ ] `apps/test/src/vexcms/blocks/CTA/index.tsx` — resolve the new action shape into an `href`
- [ ] `apps/test/src/vexcms/collections/pages.ts` — `email()`, `textarea()`, `json()`, `...tabs()`, `...collapsible()`, `...row()` with `%` widths, masked phone field, sidebar fields
- [ ] `apps/test/src/vex.config.ts` — `fields.inputMasks.number` project-wide default
- [ ] regenerate schema + types (`vex generate`)
- [ ] browser smoke checklist recorded
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md` — G re-scoped/in-progress; block items removed from H; non-goals updated
- [ ] `.agent/docs/product/roadmap.md` — drop the `json`/`email`/`textarea`/`tabs` deferral

Why: proves every new path (steps 1–15) end-to-end against the developer's running
deployment (P-024: attach, never start) and leaves the launch-plan/roadmap docs
honest about G's re-scope.

#### apps/test/src/vexcms/blocks/CTA/config.ts
Anchored edits against the file read in step research (`defineBlock({ slug: BLOCK_SLUG_CTA, … })`).

**Edit 1 — imports.** Replace the single import line with:
```ts
import { array, defineBlock, group, relationship, select, text, url } from "@vexcms/core"

import { TABLE_SLUG_PAGES } from "~/db/constants"

import { BLOCK_SLUG_CTA } from "../constants"
```

**Edit 2 — the `actions` field,** anchored on `actions: array({`. `href` is replaced by a
`linkType` select plus a conditional `internalPage` relationship / `externalUrl` url pair,
each hidden in the admin form and skipped by server validation when its `linkType` branch
isn't selected:
```ts
    actions: array({
      label: "Actions",
      items: group({
        label: "Action",
        fields: {
          label: text({ label: "Button Label", required: true }),
          linkType: select({
            label: "Link Type",
            defaultValue: ["external"],
            options: [
              { label: "External URL", value: "external" },
              { label: "Internal Page", value: "internal" },
            ],
          }),
          internalPage: relationship({
            label: "Internal Page",
            collection: {
              slug: TABLE_SLUG_PAGES,
            },
            admin: {
              condition: ({ siblingData }) =>
                (siblingData.linkType as string[] | undefined)?.[0] === "internal",
            },
          }),
          externalUrl: url({
            label: "External URL",
            admin: {
              condition: ({ siblingData }) =>
                (siblingData.linkType as string[] | undefined)?.[0] === "external",
            },
          }),
        },
      }),
      defaultValue: [
        { label: "Get Started", linkType: ["external"], externalUrl: "https://docs.vexcms.dev/guides/quickstart/" },
        { label: "View on GitHub", linkType: ["external"], externalUrl: "https://github.com/ianyimi/vex" },
      ],
    }),
```

#### apps/test/src/vexcms/blocks/CTA/index.tsx
Anchored edit replacing the `href={action.href}` line. `internalPage`'s stored value is
always `Id<"pages">[]` (relationship's generated `interfaceType`, regardless of `hasMany`
— `packages/core/src/fields/relationship/config.ts`), so the first id is the target.

**Edit — add `resolveHref` above the component and use it in the `Link`:**
```tsx
function resolveHref(action: NonNullable<CtaBlock["actions"]>[number]): string {
  if (action.linkType?.[0] === "internal") {
    return `/${action.internalPage?.[0] ?? ""}`
  }
  return action.externalUrl ?? "#"
}

export default function CTABlock({ block }: BlockComponentProps) {
  const { actions, heading, subheading } = block as CtaBlock
  const items = actions ?? []

  return (
    <section className="border-y border-border bg-card py-16 text-center md:py-24 xl:py-32">
      <Container>
        <h2 className="mx-auto max-w-[24ch] text-[28px] leading-[1.12] font-bold tracking-[-0.03em] text-balance text-foreground md:text-4xl xl:text-[40px]">
          {heading}
        </h2>

        {subheading ? (
          <p className="mx-auto mt-5 max-w-[60ch] text-[17px] leading-[1.6] text-pretty text-muted-foreground">
            {subheading}
          </p>
        ) : null}

        {items.length > 0 ? (
          <div className="mx-auto mt-9 flex w-full max-w-[320px] flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center">
            {items.map((action, index) => (
              <Link
                className={cn(
                  buttonVariants({
                    size: "lg",
                    variant: index === 0 ? "default" : "outline",
                  }),
                  "active:translate-y-px"
                )}
                href={resolveHref(action)}
                key={`${action.label}-${index}`}
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  )
}
```

#### apps/test/convex/seed.ts
The CTA block's `actions` shape changed from `{ label, href }` to
`{ label, linkType, internalPage?, externalUrl? }` (CTA/config.ts edit above). The seed
data has three occurrences of hardcoded CTA `actions` arrays (home page, and the two
other seeded pages reusing the same CTA block) that still used the removed `href` key —
fix required for `pnpm --filter test typecheck` to pass against the regenerated
`CtaBlock` type. Anchored on each `actions: [` array whose items have `label` +
`href` pointing at `docs.vexcms.dev/guides/quickstart`, `github.com/ianyimi/vex`, or
`docs.convex.dev/realtime` (three occurrences — do not touch the header/footer `links`/
`menuItems`/`actionButtons`/`socialLinks` arrays, which keep `href` unchanged):
```ts
          { label: "Get started", linkType: ["external"], externalUrl: "https://docs.vexcms.dev/guides/quickstart/" },
          { label: "View on GitHub", linkType: ["external"], externalUrl: "https://github.com/ianyimi/vex" },
          { label: "Why Convex", linkType: ["external"], externalUrl: "https://docs.convex.dev/realtime" },
```


#### apps/test/src/vexcms/collections/pages.ts
Anchored edits against the file read in step research (`export const pages = defineCollection({ … })`).

**Edit 1 — imports.** Replace the import block with:
```ts
import {
  array,
  blocks,
  collapsible,
  defineCollection,
  email,
  group,
  json,
  number,
  relationship,
  row,
  tabs,
  text,
  textarea,
  upload,
  url,
} from "@vexcms/core";
import { ConvexError } from "convex/values";

import { TABLE_SLUG_IMAGES, TABLE_SLUG_PAGES, TABLE_SLUG_THEMES } from "~/db/constants";
import { resolvePagePath } from "~/lib/resolvePagePath";
import { pageBlocks } from "~/vexcms/blocks/config";
```

**Edit 2 — the `fields` object,** anchored on `fields: {` (the whole block, since it is
restructured into tabs top to bottom): `title`/`slug`/`content`/`blocks` move into a
"Content" tab; `metaTitle`/`metaDescription` move into a 60/40 `row()` and, with `ogImage`,
into an "SEO" tab (still `position: "sidebar"` — `tabs()`/`row()` stamp layout frames on
the same top-level field, they do not nest it, so sidebar placement still applies per the
contract); a new "Advanced" tab holds the three new leaf fields, the masked phone field,
and the legacy test fields behind a collapsed `collapsible()`:
```ts
  fields: {
    ...tabs({
      tabs: {
        Content: {
          title: text({
            label: "Title",
            required: true,
            description: "Display title shown as the page heading and in browser tabs (as fallback).",
          }),
          slug: text<typeof TABLE_SLUG_PAGES>({
            description: "URL-friendly page path",
            index: "by_slug",
            label: "Slug",
            required: true,
            validate: async ({ value, doc, vex }) => {
              const [existing] = await vex.find({
                collection: TABLE_SLUG_PAGES,
                withIndex: {
                  name: "by_slug",
                  range: (q) => q.eq("slug", value),
                },
                limit: 1,
              });
              if (existing && existing._id !== doc._id) {
                throw new ConvexError({
                  code: "SLUG_CONFLICT",
                  conflictingPageId: existing._id,
                  message: `This slug is already in use by the page '${existing.title}'.`,
                });
              }
            },
          }),
          content: text({
            label: "Content",
            description: "Page body content. Legacy field — use the blocks field for new pages.",
          }),
          blocks: blocks({
            admin: {
              defaultCollapsed: true,
            },
            blocks: pageBlocks,
            interfaceName: "PageBlock",
            label: "Content",
            labels: {
              singular: "Block",
              plural: "Blocks",
            },
            min: 1,
          }),
        },
        SEO: {
          ...row({
            fields: {
              metaTitle: text({
                label: "Meta Title",
                description: "Custom <title> tag. Falls back to page title if empty.",
                admin: {
                  width: "60%",
                  position: "sidebar",
                },
              }),
              metaDescription: text({
                label: "Meta Description",
                description: "Custom meta description for search results.",
                admin: {
                  width: "40%",
                  position: "sidebar",
                },
              }),
            },
          }),
          ogImage: upload({
            to: TABLE_SLUG_IMAGES,
            label: "OG Image",
            admin: { position: "sidebar" },
          }),
        },
        advanced: {
          contactEmail: email({
            label: "Contact Email",
            description: "Dogfood field for the email() leaf type — cell renders a mailto: link.",
          }),
          contactPhone: text({
            label: "Contact Phone",
            description: "Masked text field — this field's admin.mask overrides the project default.",
            admin: {
              mask: "(999) 999-9999",
            },
          }),
          notes: textarea({
            label: "Internal Notes",
            rows: 6,
            max: 2000,
            description: "Dogfood field for the textarea() leaf type.",
          }),
          customData: json({
            label: "Custom Data",
            description: "Dogfood field for the json() leaf type — no shape validation.",
          }),
          ...collapsible({
            label: "Legacy Test Fields",
            defaultCollapsed: true,
            fields: {
              test: array({
                label: "Test Array",
                items: text({ label: "test array header" }),
                description: "some test description.",
              }),
              test2: array({
                label: "Test Array 2",
                labels: {
                  singular: "array",
                  plural: "arrays",
                },
                items: array({
                  items: number({ label: "nested nested number field" }),
                  label: "SubList",
                  labels: {
                    singular: "SubArray",
                    plural: "SubArrays",
                  },
                }),
                description: "some test number array description",
              }),
              seo: group({
                label: "SEO",
                interfaceName: "SEO",
                description: "seo metadata",
                fields: {
                  metaTitle: text({ label: "Meta Title" }),
                  metaDescription: text({ label: "Meta Description" }),
                  ogImage: url({ label: "OG Image" }),
                },
              }),
              anotherTest: group({
                label: "test nested things",
                interfaceName: "AnotherGroupNames",
                fields: {
                  title: text(),
                  subtitle: text(),
                  list: array({
                    label: "test list in group field",
                    items: group({
                      label: "Group",
                      interfaceName: "InnerGroup",
                      admin: {
                        defaultCollapsed: false,
                      },
                      fields: {
                        title: text({ description: "test field description", label: "Title" }),
                        description: text({ label: "description", description: "another test description" }),
                        queue: array({
                          label: "sub group array list",
                          items: group({
                            label: "sub group array sub group",
                            fields: {
                              title: text({ label: "Title" }),
                              description: text({ label: "Description" }),
                            },
                          }),
                        }),
                      },
                    }),
                  }),
                },
              }),
            },
          }),
        },
      },
    }),

    testImage: upload({
      to: TABLE_SLUG_IMAGES,
      label: "Test Image",
      hasMany: true,
      accept: "image/*",
    }),

    themes: relationship({
      collection: {
        slug: TABLE_SLUG_THEMES,
      },
    }),
  },
```

#### apps/test/src/vex.config.ts
Anchored edit: add a project-wide number mask default as a sibling of `admin` on the
object passed to `defineConfig` (`admin: { sidebar: … }` currently starts the config body).

**Edit — insert a `fields` key before `admin`:**
```ts
const vexConfig = defineConfig({
  access,
  authCollections: betterAuthCollections(authSchema),
  editor: plateEditor(),
  fields: {
    inputMasks: {
      number: "999-999-9999",
    },
  },
  admin: {
```

#### Regenerate schema + types
```sh
pnpm --filter test vex:generate
```
This runs `vex dev --once` (`apps/test/package.json#scripts.vex:generate`), regenerating
the Convex schema and `vex.types.ts` for `pages` (new `email`/`textarea`/`json` fields,
`tabs`/`row`/`collapsible` layout, `linkType`/`internalPage`/`externalUrl` on the CTA
block) and for every other collection affected by steps 1–15 (`updatedAt` as `date()`,
the `FieldLimit` tuple shape, relationship's unchanged `Id<…>[]` storage).

#### Browser smoke checklist
Attach to the running `apps/test` admin — **do not start a server** (P-024); the dev
script binds `next dev --port=3020`, so attach at `http://localhost:3020/admin`
(`apps/test/package.json#scripts.dev`). Record pass/fail per item against the `pages`
collection's edit view unless noted.

1. **Step 1 (limits)** — on the `blocks` field, add more than `max` blocks (if set on a
   block's array sub-field) or hit the `test`/`test2` array `min`/`max` if configured;
   confirm the error message is the value-aware default, not a stale `{ value, error }`
   render.
2. **Step 2 (email)** — open the Advanced tab, type an invalid value into Contact Email
   (e.g. `not-an-email`), confirm a format error; save a valid address, confirm the list
   view and any email-field cell render a `mailto:` link.
3. **Step 3 (textarea)** — type into Internal Notes past 2000 characters; confirm the
   character counter and the max-length error; confirm `rows` renders a 6-row textarea.
4. **Step 4 (json)** — type invalid JSON into Custom Data; confirm a parse-error state
   and that the last valid value is NOT submitted; type valid JSON, save, reload, confirm
   the cell shows a truncated one-line preview.
5. **Step 5 (dates)** — open any existing page, confirm the sidebar shows a read-only
   "Updated At" with date **and** time, plus a separate read-only "Created at" from
   `DocumentTimestamps`.
6. **Step 6/9 (layout)** — confirm the edit view renders "Content" / "SEO" / "Advanced"
   tabs with the URL reflecting `?tab=` on the top-level group; switch tabs and confirm
   state persists on reload; confirm Meta Title / Meta Description render side-by-side at
   roughly 60/40 width in the sidebar and stack below the `sm` breakpoint (narrow the
   browser); expand/collapse "Legacy Test Fields".
7. **Step 7/10 (conditions)** — in a CTA block action, toggle Link Type: selecting
   "External URL" shows only External URL; selecting "Internal Page" shows only Internal
   Page and hides External URL without losing the other field's typed value; submit with
   an empty required field under the hidden branch and confirm no validation error blocks
   save.
8. **Step 8 (masks)** — type into Contact Phone, confirm it masks as `(999) 999-9999`
   while typing; add a `number` field value elsewhere (or use an existing number field)
   and confirm it now masks as `999-999-9999` via the project-wide default from
   `fields.inputMasks.number`, while still storing/submitting a plain number.
9. **Step 11 (search/upload)** — open the OG Image or Test Image upload picker, type a
   search query, confirm results page via "Load more" and the MIME filter matches
   `accept: "image/*"`.
10. **Step 12 (relationship)** — on the CTA action's Internal Page relationship (visible
    with Link Type = Internal Page), open the picker; confirm Select/Create tabs, that a
    created page is auto-selected, and the Themes relationship on the page itself shows
    consistent empty/filled states.
11. **Step 13/14 (blocks)** — on the page's `blocks` field, duplicate a block, insert
    above/below, move up/down, collapse/expand all, then copy a block and paste it above
    in a different block field or a different document tab; confirm pasted ids are fresh
    and unknown keys are dropped if pasting into a different block type.
12. **Step 15 (polish)** — confirm Contact Phone's character counter (if `max` set)
    matches `max`; confirm any `number` field shows `step`/min/max HTML attributes via
    browser devtools; confirm a `url` field (e.g. External URL) shows an open-link button;
    confirm the `linkType` select's `admin.display`/`admin.searchable` (if configured)
    render correctly; confirm `DataTable` column alignment matches each column's
    `cellAlignment`.

#### .agent/docs/product/v0.1.0-launch-plan.md
Anchored edits against the sections read in step research.

**Edit 1 — status table row 7 (`| 7 | **G**`):**
```md
| 7 | **G** — Field input consistency pass | No input looks half-built | ◐ re-scoped, 2026-10-16 — spec `2026-10-16-field-input-consistency-pass` (16 task groups); absorbs H's block-editing items plus `email`/`textarea`/`json`/`tabs`; implementation not started |
```

**Edit 2 — status table row 8 (`| 8 | **H**`):**
```md
| 8 | **H** — Edit-view overhaul | Editing is not hostile | ☐ not started — block-editing items (duplicate block, reorder, collapse all) moved to G, 2026-10-16 |
```

**Edit 3 — the `## G` section,** anchored on `## G — Field input consistency pass`
through (not including) `## H`:
```md
## G — Field input consistency pass

> **Re-scoped 2026-10-16** in the dev-spec interview — spec
> `2026-10-16-field-input-consistency-pass`. Absorbs H's block-editing items
> (duplicate/insert/move/collapse-all, per-block actions) and the previously
> deferred `email()` / `textarea()` / `json()` leaf fields and `tabs`/`collapsible`/`row`
> layout helpers; see the 16-step task list for the full breakdown.

Every field type has an input and a cell component
(`react/src/components/fields/index.tsx:45-276`), but quality is uneven.

### Scope

- **`relationship`** is the named offender: unlike the media picker it has no
  consistent picker surface, no loading states, and looks rudimentary. Copied from
  upload's three-state pattern, not shared code.
- Sweep all 16 inputs (12 original + richtext from D + the new `email`/`textarea`/`json`)
  for: loading/pending states, empty states, error display, keyboard access, focus rings,
  disabled/read-only rendering, and `admin.placeholder` / `admin.width` /
  `admin.cellAlignment` honoring.
- Add the server-only async validation error path from F.
- **MIME filter in the media library grid** — `MediaLibaryGrid.tsx:36` carries a
  TODO and `upload()` already accepts `accept` (`fields/upload/config.ts:6-40`),
  so the field declares a constraint the picker ignores.
- **Conditional fields (`admin.condition`)** — a pure predicate, same function on client
  and server; hidden fields keep their values and skip `required`/`validate()` server-side.
  `linkType: internal | external` is the canonical use case.
- **Layout**: `width` becomes any CSS width string; `tabs()` / `collapsible()` / `row()`
  layout helpers, flat-record, usable anywhere a fields record is.
- **Masks**: opt-in `admin.mask` + project-wide `fields.inputMasks` defaults.
- **Blocks/array editing**: per-block menu (duplicate, insert above/below, move up/down,
  delete), collapse/expand all, error markers, `n/max` counters, and a clipboard
  (copy/paste blocks across fields, documents, and collections via `localStorage`).

**Acceptance:** every input renders correct empty / loading / error / read-only
states; the a11y assertions already in the field suites extended to cover them; no
field visually inconsistent with its siblings; `apps/test` dogfoods every new field,
layout helper, condition, and block-editing action end-to-end.

---

## H — Edit-view overhaul

### Scope

- **Unsaved-changes navigation guard.** Dirty state currently only disables the
  Save button (`CollectionEditView.tsx:63-73`); nothing blocks navigating away.
  Losing work on a misclick is the worst first impression per line of code saved.
- **Duplicate document** — absent from every edit view; trivial against existing
  `create`.
- Validation error summary at document level, jump-to-field.
- Keep the sticky header work already landed.

**Out of scope:** concurrent-edit conflict resolution. Already specified in
`backlog.md` ("Concurrent-edit conflict-resolution UX") as three separable pieces
with a design; it needs its own spec and is not a 0.1.0 gate. Duplicate block and the
other block-editing patterns moved to G, 2026-10-16 — `blocks`' per-block actions and
the multi-field editing surface are field-input concerns, not edit-view chrome.

**Acceptance:** navigating away from a dirty form prompts; duplicating a document
works and is covered by `viewSuite`.

---
```

**Edit 4 — the "Explicit 0.1.0 non-goals" section's first bullet** (anchored on
`- **\`ui\` and \`tabs\` fields.**`):
```md
- **`ui` field.** Cut with reason in the launch-readiness spec (D8): it changes a core
  invariant rather than adding a leaf — non-persisted, must be skipped by schema
  generation, form validation, *and* column generation. Not a polish item.
  `textarea`, `email`, `json`, and the `tabs`/`collapsible`/`row` layout helpers are no
  longer deferred — they shipped in spec G (`2026-10-16-field-input-consistency-pass`).
```

#### .agent/docs/product/roadmap.md
Anchored edit replacing the "Deferred out of 0.1.0" line:
```md
Deferred out of 0.1.0 with reasons: PDF block · block group categorization.
```

Verify: pnpm --filter test typecheck && pnpm --filter www typecheck; browser smoke on the running admin of every changed input

## Verification

Run after every step and once at the end:

```bash
pnpm typecheck
pnpm test
pnpm --filter test typecheck
pnpm --filter www typecheck
```

Then the Step 16 browser smoke checklist against the developer's running `apps/test` admin
(P-024 — attach, never start a dev server). The spec is done when all four commands are green
and every checklist item is recorded as passing.
