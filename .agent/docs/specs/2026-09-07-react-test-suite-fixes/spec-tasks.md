---
status: draft
spec_id: 2026-09-07-react-test-suite-fixes
touches: []
prompt_version: 1
---

# 2026-09-07-react-test-suite-fixes — Tasks

## Step 1 — Core input-schema required enforcement (CORE-1, CORE-2, CORE-3 schema half)
Why: One ADR-worthy pattern (gate `.default()`/`.default(x)` behind `!field.required`, compose min/max onto a required-aware base instead of reassigning, add `.min(1)` where no length check exists at all) applied uniformly across all 12 `packages/core/src/fields/*/inputSchema.ts`. Closes the 40-row CORE-1 bucket plus CORE-2 (url error ordering) and CORE-3's schema half (date min/max). Foundational — no React dependency, and the audit (all 12 types probed against `undefined` via vitest) is already done.
Verify:
- [x] `pnpm --filter @vexcms/core exec vitest run src/fields --coverage.enabled=false`
- [x] `pnpm --filter @vexcms/core typecheck`

## Step 2 — React shared form primitives (PKG-1, FormLabel id plumbing)
Why: `AppFormContext.ts`'s `AnyFormApi` generics get their AP-006 fix (default each validator slot to its own bound, not `undefined`) — a correct, standalone type fix. The 3 `AppFormBoundary` casts stay in place: verified against the installed `@tanstack/react-form` that a deeper `createElement`-generic-erasure issue (plus TanStack's own `UnwrapFormValidateOrFnForInner` collapsing abstract validator bounds) blocks removal regardless of `AnyFormApi`'s defaults; comments updated in place to record the finding. `FormLabel.tsx` gains an `id` prop (defaulting to `${name}-label`) so A11Y-2 (checkbox `aria-labelledby`) and every container's fieldset/legend group label (Steps 9–11) have something to point at. `testing/fieldInputContract.ts`'s shared label-association tests are extended to accept a `role="group"`/`aria-labelledby` pattern alongside `<label for>`, needed by Steps 9–11. Independent of Step 1 (different package); lands before every other React step since they consume this API.
Verify:
- [x] `pnpm --filter @vexcms/react typecheck`
- [x] `pnpm --filter @vexcms/react exec vitest run src/testing/rbacState.test.ts --coverage.enabled=false`

## Step 3 — date field (LABEL-1, CORE-3 UI half, UI-5, A11Y-1)
Why: `DateTimePickerProps` gains `id`, forwarded to its trigger button (LABEL-1's largest single sub-case). `date/Input.tsx` forwards `fieldDef.min`/`fieldDef.max` to the picker (CORE-3's UI half — the schema half landed in Step 1), removes the `if (date)` guard that swallows Clear (UI-5), and adds `aria-required` (A11Y-1). Same two files own all four defects — one pass.
Verify:
- [x] `pnpm --filter @vexcms/react exec vitest run src/components/fields/date/Input.test.tsx --coverage.enabled=false`

## Step 4 — select field (LABEL-1, A11Y-4, A11Y-1)
Why: `MultiSelectTrigger` forwards `id` to its underlying button (LABEL-1); `MultiSelectValue`'s remove badges get `aria-label={`Remove ${option.label}`}` (A11Y-4, matching FormArray's existing remove-button convention); `select/Input.tsx` adds `aria-required` (A11Y-1).
Verify:
- [x] `pnpm --filter @vexcms/react exec vitest run src/components/fields/select/Input.test.tsx --coverage.enabled=false`

## Step 5 — checkbox field (A11Y-2, UI-3, A11Y-1)
Why: Base UI's `Checkbox.Root` (default `nativeButton: false`) renders `role="checkbox"` on a `<span>`, which isn't an HTML labelable element — `<label for>` cannot compute its accessible name even though `id` matches. Wire `aria-labelledby` from `Checkbox` to `FormLabel`'s new `id` (Step 2). Remove `hideRequired` so checkbox shows the required asterisk like every other field (UI-3), and add `aria-required` (A11Y-1, closing the last of the 11 A11Y-1 rows since checkbox was the one type not forwarding it).
Verify:
- [x] `pnpm --filter @vexcms/react exec vitest run src/components/fields/checkbox/Input.test.tsx --coverage.enabled=false`

## Step 6 — upload field (LABEL-1, UI-6, UI-7, UI-8, A11Y-1)
Why: The dropzone's `<input type="file">` in `EmptyInput.tsx` becomes the field's one real control (`id={name}`) that `FormLabel` in every state points at (LABEL-1). `Input.tsx`'s readOnly branch gets its missing `return` (UI-7, currently dead code that falls through to the fully interactive dropzone). All 3 return branches gain `FormDescription`/`FormError` and an `index`-aware `FormLabel` (UI-6). `EmptyInput.tsx`'s `handleDrop` filters dropped files against `fieldDef.accept` (UI-8, matching the OS picker's existing filter). `aria-required` added (A11Y-1).
Verify:
- [x] `pnpm --filter @vexcms/react exec vitest run src/components/fields/upload/Input.test.tsx --coverage.enabled=false`

## Step 7 — number field (UI-2, UI-4, A11Y-1)
Why: `value={field.state.value ?? 0}` and `Number(e.target.value)` silently turn a cleared field into `0` (UI-2, compounds with CORE-1: a cleared required number now needs to actually fail, not save a valid-looking `0`). No `min`/`max` forwarded to the native input (UI-4). `aria-required` added (A11Y-1).
Verify:
- [x] `pnpm --filter @vexcms/react exec vitest run src/components/fields/number/Input.test.tsx --coverage.enabled=false`

## Step 8 — relationship field (UI-10, UI-13, ARCH-1, A11Y-1)
Why: Chip remove button's `disabled` condition is inverted relative to `handleRemove`'s own guard (UI-10 — selected relationships currently cannot be removed). `useRelationshipPickerOptions` gains `placeholderData: keepPreviousData` so the debounced search doesn't flash empty/Loading between keystrokes (UI-13). `resolveRelationshipPreview` drops its unreachable collection-level precedence branch (`sanitizeConfigForClient` strips it before any client component sees it); `CollectionConfig`/`CollectionConfigInput`'s `admin.components.preview` is removed from `packages/core/src/collections/types.ts` and `apps/docs/src/content/docs/fields/relationship.mdx` is updated to document field-level as the only supported location (ARCH-1 — confirmed no live `apps/*`/`packages/create-vexcms` config uses the collection-level slot, only docs). `aria-required` added (A11Y-1).
Verify:
- [x] `pnpm --filter @vexcms/react exec vitest run src/components/fields/relationship/Input.test.tsx --coverage.enabled=false`
- [x] `pnpm --filter @vexcms/core typecheck`

## Step 9 — array container (LABEL-1, UI-11, UI-12, A11Y-1)
Why: `FormArray`'s top-level `FormLabel htmlFor={name}` points at nothing (no single control in a repeatable list) — switch to `role="group" aria-labelledby` fieldset/legend semantics (LABEL-1, Open Q3). Add the same `atMax` guard + message `FormBlocks` already has (UI-11, currently nothing stops adding past `fieldDef.max`). Stop passing `index` to each item's `ItemInput` so items are findable by their own label, matching `FormBlocks`' sibling pattern (UI-12). `aria-required` on the group wrapper (A11Y-1 — valid on `role="group"` per WAI-ARIA).
Verify:
- [x] `pnpm --filter @vexcms/react exec vitest run src/components/fields/array/Input.test.tsx --coverage.enabled=false`

## Step 10 — group container (LABEL-1, UI-9, A11Y-1)
Why: `FormGroup`'s `FormLabel htmlFor={name}` inside its `AccordionTrigger` points at nothing usable via `<label for>` semantics for a group of sub-fields — switch to fieldset/legend semantics (LABEL-1). Base UI's `AccordionItem` already supports a `disabled` prop (focusable-when-disabled, `aria-disabled` via `useButton`) but `FormGroup` never passes it — wire `disabled={readOnly}` onto `AccordionItem` (UI-9, mirrors `DragHandle`'s existing `disabled` prop pattern elsewhere in the codebase). `aria-required` on the group wrapper (A11Y-1).
Verify:
- [x] `pnpm --filter @vexcms/react exec vitest run src/components/fields/group/Input.test.tsx --coverage.enabled=false`

## Step 11 — blocks container (LABEL-1, UI-9, A11Y-1)
Why: `blocks/Input.tsx`'s standalone `FormLabel htmlFor={name}` points at nothing — same fieldset/legend fix as Steps 9–10 (LABEL-1). `FormBlocks`' per-block `AccordionItem` never receives `disabled` — wire `disabled={readOnly}` (UI-9, same Base UI mechanism as Step 10). `aria-required` on the group wrapper (A11Y-1).
Verify:
- [x] `pnpm --filter @vexcms/react exec vitest run src/components/fields/blocks/Input.test.tsx --coverage.enabled=false`

## Step 12 — text/url/color A11Y-1 sweep
Why: The 3 remaining field types (text, url, color) only need `aria-required={fieldDef.required}` forwarded to their native `<input>` — the last of the 11 A11Y-1 rows not covered by Steps 3–11 (date/select/checkbox/upload/number/relationship/array/group/blocks). Trivial, bundled into one step since each file gets exactly one line changed.
Verify:
- [x] `pnpm --filter @vexcms/react exec vitest run src/components/fields/text/Input.test.tsx src/components/fields/url/Input.test.tsx src/components/fields/color/Input.test.tsx --coverage.enabled=false`

## Step 13 — Full-suite verification
Why: Every prior step verified its own file(s) in isolation; this step proves the aggregate — `packages/react`'s full suite, the published-subpath consumers (`apps/test`, `apps/www`), and `packages/core`'s regression suite all green, plus `node scripts/record-test-findings.mjs` per field type shows `findings.md` shrinking toward zero as directed in the handoff.
Verify:
- [x] `pnpm --filter @vexcms/react test`
- [x] `pnpm --filter test exec vitest run src/vexcms/admin.test.ts --coverage.enabled=false`
- [x] `pnpm --filter www test`
- [x] `pnpm --filter @vexcms/core test`
- [x] `pnpm test` (whole monorepo)
