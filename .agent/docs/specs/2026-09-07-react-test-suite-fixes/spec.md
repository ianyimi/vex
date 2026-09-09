---
status: draft
spec_id: 2026-09-07-react-test-suite-fixes
touches: ["packages/core/src/fields/**", "packages/core/src/collections/**", "packages/react/src/components/**", "packages/react/src/hooks/useRelationshipPickerOptions.ts", "packages/react/src/testing/**", "apps/docs/src/content/docs/fields/relationship.mdx"]
prompt_version: 1
---

# 2026-09-07-react-test-suite-fixes — Spec

## Overview

Fixes the ~20 product defects catalogued in `.agent/docs/specs/2026-09-04-react-test-suite/BUGS-REPORT.md`, root-caused from the 353 assertions the `2026-09-04-react-test-suite` spec's component test kit left red on purpose. Spans `@vexcms/core` (required-field enforcement, `date` min/max, relationship-preview reachability) and `@vexcms/react` (label association, ARIA, form-generic typing, and a dozen smaller per-field UI bugs). Every fix approach below was confirmed defect-by-defect with the developer via `AskUserQuestion`, each carrying evidence gathered by reading the real source and, for CORE-1, by executing the actual schema functions against `undefined`/`[]` in an isolated vitest probe rather than inferring behavior. Low-care override for this spec: the developer implements nothing here, every step ships full code.

## Design Decisions

1. **CORE-1's fix lives entirely in the Zod input-schema layer.** Convex's generated validator (`packages/core/src/fields/*/validator.ts`) already gates *presence* off the same `field.required` flag (`v.string()` vs `v.optional(v.string())`) — confirmed correct and untouched. A Convex validator has no primitive for *emptiness* (`""`/`[]` are well-typed), so the Zod layer is the only place capable of rejecting an empty-but-present required value.
2. **`.default()`/`.default(x)` is gated behind `!field.required` on all 12 field types**, matching `applyBaseInputSchemaMeta`'s existing `.optional()` gate. Verified via `getCollectionDefaultValues`/`getGlobalDefaultValues` (`packages/core/src/collections/utils.ts`, `globals/utils.ts`) that the admin form's initial values are built from `field.defaultValue` directly, entirely independent of the Zod schema's own `.default()` — removing it from required fields changes nothing a user sees.
3. **`required` on `select`/`array`/`blocks`/`upload` now also means "≥ 1 item," not just "key present."** These four had zero length enforcement before this spec (confirmed by executing their schemas against an explicit `[]`, not just `undefined`) — `.min(1, "This field is required.")` is added, composed onto any configured `min`/`max`, never replacing it.
4. **`relationship`'s `required` stays presence-only** — a document may legitimately reference zero related items; only `select`/`array`/`blocks`/`upload` needed the "≥ 1" extension.
5. **`url`'s empty-required message is fixed by checking emptiness before format** (`z.string({error}).min(1,{error}).pipe(z.url())`), not by touching `z.url()`'s pinned behavior (trims whitespace, no protocol restriction, absolute-URL-only).
6. **`date` gets both layers**: schema-level `.min()`/`.max()` (Step 1, core) and calendar-level day forwarding (Step 3, react) — not schema-only.
7. **`AnyFormApi`'s validator-slot generics default to their own declared bound instead of `undefined`** (AP-006) — a correct, standalone type fix, applied regardless of whether it unlocks anything downstream.
8. **The 3 `AppFormBoundary` casts stay in place.** Verified against the installed `@tanstack/react-form` in an isolated worktree: `createElement(AppForm, props)` (the `.ts`-only test harnesses can't use JSX) erases *every* one of `AppForm`'s generics — including `TFormData` itself — to `unknown` before checking `props`, and separately TanStack's own `UnwrapFormValidateOrFnForInner` collapses any abstract validator-slot bound to `undefined` when deriving `FormState.errorMap`. Neither is reachable by widening `AnyFormApi`'s defaults. Documented in place; not removed.
9. **LABEL-1's three mechanical types** (select, date, upload) get `id={name}` threaded onto their real focusable control — `MultiSelectTrigger`'s button, `DateTimePicker`'s new `id` prop, the upload dropzone's file input.
10. **LABEL-1's three containers** (array, group, blocks) drop the single-control `<label for>` pattern entirely for `role="group"` + `aria-labelledby` — none has one natural focusable target. `testing/fieldInputContract.ts`'s shared label-association tests are *extended*, not replaced, to accept either pattern (a correction made mid-spec after tracing the real `getControl`/`getByLabelText` failure path — see Step 2).
11. **checkbox gets `aria-labelledby`, not just a matching `id`/`htmlFor` pair** — Base UI's `role="checkbox"` element is a `<span>` (confirmed by reading `CheckboxRoot.js`), not an HTML labelable element, so `<label for>` cannot compute its accessible name even with a matching id.
12. **`aria-required={fieldDef.required}` is forwarded from every field type's own `Input.tsx`**, not centralized in `createFieldInput` (which never renders the control). checkbox drops `hideRequired` so it shows the asterisk like every other type.
13. **ARCH-1: the collection-level relationship-preview precedence branch is removed**, not reimplemented via a client-bundle-import registry — `admin.components.preview` becomes field-level only. No live `apps/*`/`packages/create-vexcms` config used the collection-level slot, only `apps/docs`.
14. **number preserves a cleared field as `undefined`, not `0`**, and forwards `min`/`max` to the native input — required + CORE-1 now correctly reject a cleared required number instead of silently saving `0`.
15. **FormArray gets the same `atMax` guard FormBlocks already has**, and drops the `index` prop passed to items, matching FormBlocks' sibling pattern.
16. **`FormGroup`/`FormBlocks` forward `disabled={readOnly}` to Base UI's `AccordionItem`**, whose own `disabled` prop already produces correct `aria-disabled`/`data-disabled` semantics — a missing wire-up, not a new mechanism.
17. **`useRelationshipPickerOptions` adds `placeholderData: keepPreviousData`** so the debounced search doesn't flash empty/loading between keystrokes.
18. **Tier: low-care override for this spec** (agent implements, full code) — does not change the manifest's high-care default for future specs.

## Out of Scope

- `pnpm check:vercel`'s pre-existing `notFound()` failure on empty `initialData` in a fresh no-Convex-data tree — verified pre-existing on clean `HEAD` by stashing; unrelated to this work.
- A11Y-3's exact 18-violation enumeration — not pre-listed. The `vitest-axe` suite (already wired per `testing/a11y.ts`) drives verification after LABEL-1/A11Y-1/A11Y-2/A11Y-4 land (Steps 3–12); any still-failing violation is this spec's own closing checklist item (Step 13), not a separately catalogued defect.
- Changeset + version bump — lands with the eventual green-suite commit per the developer's standing decision, not with this spec.
- Re-splitting `packages/react/tsup.config.ts` into two configs, or reintroducing `../../form` barrel imports inside `components/fields/` — both explicitly prohibited (ADR-009 / P-022).
- Removing the 3 `AppFormBoundary` casts — verified not achievable; see Design Decision 8.

## Implementation

### Step 1 — Core input-schema required enforcement (CORE-1, CORE-2, CORE-3 schema half)

One pattern, applied uniformly to all twelve `packages/core/src/fields/*/inputSchema.ts` files: Convex's generated validator (`packages/core/src/fields/*/validator.ts`) already gates *presence* correctly off the same `field.required` flag — `v.string()` vs `v.optional(v.string())`, `v.boolean()` vs `v.optional(v.boolean())`, and so on, confirmed in `text/validator.ts`, `checkbox/validator.ts` and `select/validator.ts`'s own doc comments — but a Convex validator cannot express *emptiness* (an explicit `""` or `[]` submitted by a form is a perfectly well-typed `v.string()`/`v.array(...)`). The Zod input-schema layer is therefore the only layer that can reject an empty-but-present required value, and today it does neither job reliably: every field's required branch ends in an unconditional `.default(field.defaultValue)` that is never gated behind `!field.required` the way `applyBaseInputSchemaMeta`'s `.optional()` already is, so a missing value is silently replaced by the default and validated as *that* — for `checkbox` this means no value of any kind can fail. The fix is two-part and identical across all twelve types: (1) a required field's base Zod type call gets `{ error: "This field is required." }` — a required field never receives `.default()` at all, matching the `.optional()` gate exactly, and the base-type `error` override means a genuinely missing (`undefined`) value reports "This field is required." instead of Zod's generic "expected X, received undefined"; (2) for the five types where an explicitly-*empty*-but-present value is a distinct, checkable failure mode (`text`, `select`, `array`, `blocks`, `upload` — all backed by length-bearing string/array primitives), `.min(1, "This field is required.")` is composed onto the same chain rather than replacing it, so a required field with `min`/`max` also configured keeps every check instead of the sibling-`if`/`else-if` reassignment bug that previously dropped the required check the moment `min` or `max` was set. `number`, `date`, `checkbox`, `group`, `relationship` have no meaningful "empty" state distinct from "missing" (`0`, a timestamp, `false`, `{}`, and — by product decision — `[]` for `relationship` are all legitimate values), so those five get only the `.default()` gate and the base-type `error`, never a `.min(1)`. `url` and `color` get the same `.default()` gate, plus their own already-present `.min(1)`/`.regex()` composition reordered so length is checked before format (`url`'s CORE-2) or unconditionally (`color`). `date` additionally gains `field.min`/`field.max` (Unix-ms timestamps, confirmed as plain `number` properties on `DateField` in `date/types.ts`, not the `{ value, error }` shape `text`/`number`/`array` use) as `.min()`/`.max()` checks — CORE-3's schema half; previously they were read nowhere.

Three existing tests directly pinned the CORE-1 defect as "expected" behaviour for their field type — `date`'s `required schema provides a numeric default (Date.now())`, `relationship`'s `defaults undefined to [] for required fields`, `array`'s `generates required array schema` (its own comment reads *"Zod arrays accept undefined by default (known limitation)"*), and `color`'s `applies an explicit default on a required field`. Each is corrected below to assert the fixed behaviour instead of the bug; every other existing test was verified against the new schemas and needs no change. All new/corrected tests use `toMatch(/required/i)` rather than `toBe("This field is required.")` except where an existing test already pinned the exact string, since the literal wording is an implementation choice, not part of the contract being defended.

- [ ] [agent] Edit `packages/core/src/fields/text/inputSchema.ts` — compose min/max onto the required branch, gate `.default()`
- [ ] [agent] Edit `packages/core/src/fields/text/inputSchema.test.ts` — add required-rejects-undefined test
- [ ] [agent] Edit `packages/core/src/fields/number/inputSchema.ts` — compose min/max onto the required branch, gate `.default()`, clamp optional default
- [ ] [agent] Edit `packages/core/src/fields/number/inputSchema.test.ts` — add required-rejects-undefined test
- [ ] [agent] Edit `packages/core/src/fields/checkbox/inputSchema.ts` — gate `.default()` behind `!field.required`
- [ ] [agent] Edit `packages/core/src/fields/checkbox/inputSchema.test.ts` — add required-rejects-undefined test
- [ ] [agent] Edit `packages/core/src/fields/date/inputSchema.ts` — gate `.default()`, add CORE-3 `min`/`max` timestamp checks
- [ ] [agent] Edit `packages/core/src/fields/date/inputSchema.test.ts` — correct the defect-pinning default test
- [ ] [agent] Edit `packages/core/src/fields/relationship/inputSchema.ts` — gate `.default()` behind `!field.required`
- [ ] [agent] Edit `packages/core/src/fields/relationship/inputSchema.test.ts` — correct the defect-pinning default test
- [ ] [agent] Edit `packages/core/src/fields/group/inputSchema.ts` — gate `.default()` behind `!field.required`
- [ ] [agent] Edit `packages/core/src/fields/group/inputSchema.test.ts` — add required-rejects-undefined test
- [ ] [agent] Edit `packages/core/src/fields/select/inputSchema.ts` — gate `.default()`, add `.min(1)` when required
- [ ] [agent] Edit `packages/core/src/fields/select/inputSchema.test.ts` — add required-rejects-undefined and required-rejects-empty-array tests
- [ ] [agent] Edit `packages/core/src/fields/blocks/inputSchema.ts` — gate `.default()`, add `.min(1)` when required, composed with configured min/max
- [ ] [agent] Edit `packages/core/src/fields/blocks/inputSchema.test.ts` — add required-rejects-undefined and required-rejects-empty-array tests
- [ ] [agent] Edit `packages/core/src/fields/array/inputSchema.ts` — replace dead `superRefine` with composed `.min(1)`, gate `.default()`
- [ ] [agent] Edit `packages/core/src/fields/array/inputSchema.test.ts` — correct the defect-pinning required test
- [ ] [agent] Edit `packages/core/src/fields/upload/inputSchema.ts` — add `.min(1)` when required
- [ ] [agent] Edit `packages/core/src/fields/upload/inputSchema.test.ts` — add required-rejects-undefined-message and required-rejects-empty-array tests
- [ ] [agent] Edit `packages/core/src/fields/url/inputSchema.ts` — reorder emptiness before format check (CORE-2), gate `.default()`
- [ ] [agent] Edit `packages/core/src/fields/url/inputSchema.test.ts` — add required-rejects-undefined and CORE-2 message-ordering tests
- [ ] [agent] Edit `packages/core/src/fields/color/inputSchema.ts` — drop conditional default-when-required, add base-type `error`
- [ ] [agent] Edit `packages/core/src/fields/color/inputSchema.test.ts` — correct the defect-pinning explicit-default test

#### packages/core/src/fields/text/inputSchema.ts
1 edit, everything else unchanged.

**1 — `textFieldToInputSchema` rewritten to compose min/max onto the required branch and gate `.default()`.**
```ts
/**
 * Builds a Zod schema for validating a text field value in the admin form.
 *
 * Applies `min`/`max` character-length constraints by composing them onto
 * the same schema chain built for `required`, rather than reassigning over
 * it — a required field with `min`/`max` configured keeps every check
 * (CORE-1). Required fields attach `{ error: "This field is required." }` to
 * the base `z.string()` call and add `.min(1, "This field is required.")` so
 * a missing value and an explicit empty string report the same message; they
 * never receive `.default()`, matching `applyBaseInputSchemaMeta`'s
 * `.optional()` gate. Non-required fields keep `.default(field.defaultValue)`.
 *
 * @param props - Input props.
 * @param props.field - The resolved text field definition
 * @returns A Zod string schema with length constraints and optionality applied
 *
 * @example
 * ```ts
 * const field = text({ required: true, min: { value: 3 }, max: { value: 100 } })
 * textFieldToInputSchema({ field })
 * // → z.string({ error: "This field is required." }).min(1, "...").min(3).max(100)
 * ```
 */
export function textFieldToInputSchema(props: { field: TextField }): ZodType {
  const { field } = props;

  const fieldMinError = field.min?.error ?? "This field is too short.";
  const fieldMaxError = field.max?.error ?? "This field is too long.";
  const requiredError = "This field is required.";

  let inputSchema = field.required
    ? z.string({ error: requiredError }).min(1, requiredError)
    : z.string();

  if (field.min) {
    inputSchema = inputSchema.min(field.min.value, fieldMinError);
  }
  if (field.max) {
    inputSchema = inputSchema.max(field.max.value, fieldMaxError);
  }

  const finalSchema: ZodType = field.required
    ? inputSchema
    : inputSchema.default(field.defaultValue);

  return applyBaseInputSchemaMeta({ field, inputSchema: finalSchema });
}
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/text/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/text/inputSchema.test.ts
1 edit, everything else unchanged.

**1 — Add a new test after `includes metadata (label, description)`, inside the existing `describe("textFieldToInputSchema", ...)` block.**
```ts
  it("rejects a missing value on a required field with a 'required' message", () => {
    const field = text({ required: true, defaultValue: "test" });
    const schema = textFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/text/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/number/inputSchema.ts
1 edit, everything else unchanged.

**1 — `numberFieldToInputSchema` rewritten to compose min/max onto the required branch, gate `.default()`, and clamp the optional-path default.**
```ts
/**
 * Builds a Zod schema for validating a number field value in the admin form.
 *
 * Applies `min`/`max` constraints by composing them onto the same schema
 * chain built for `required`, rather than reassigning over it — a required
 * field with `min`/`max` configured keeps every check (CORE-1). Required
 * fields attach `{ error: "This field is required." }` to the base
 * `z.number()` call and never receive `.default()`, matching
 * `applyBaseInputSchemaMeta`'s `.optional()` gate — a number has no "empty"
 * state distinct from "missing", so no `.min(1)` is added (unlike `text`).
 * Only non-required fields get a `.default()`, clamped into the configured
 * `min`/`max` range.
 *
 * @param props - Input props.
 * @param props.field - The resolved number field definition
 * @returns A Zod number schema with range constraints and optionality applied
 *
 * @example
 * ```ts
 * const field = number({ required: true, min: { value: 0 }, max: { value: 100 } })
 * numberFieldToInputSchema({ field })
 * // → z.number({ error: "This field is required." }).min(0).max(100)
 * ```
 */
export function numberFieldToInputSchema(props: {
  field: NumberField;
}): ZodType {
  const { field } = props;

  const fieldMinError = field.min?.error ?? "This field is too small.";
  const fieldMaxError = field.max?.error ?? "This field is too large.";
  const requiredError = "This field is required.";

  let inputSchema = field.required
    ? z.number({ error: requiredError })
    : z.number();

  if (field.min) {
    inputSchema = inputSchema.min(field.min.value, fieldMinError);
  }
  if (field.max) {
    inputSchema = inputSchema.max(field.max.value, fieldMaxError);
  }

  if (field.required) {
    return applyBaseInputSchemaMeta({ field, inputSchema });
  }

  let defaultValue = field.defaultValue;
  if (field.min && defaultValue < field.min.value) {
    defaultValue = field.min.value;
  }
  if (field.max && defaultValue > field.max.value) {
    defaultValue = field.max.value;
  }

  return applyBaseInputSchemaMeta({
    field,
    inputSchema: inputSchema.default(defaultValue),
  });
}
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/number/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/number/inputSchema.test.ts
1 edit, everything else unchanged.

**1 — Add a new test after `includes metadata (label, description)`, inside the existing `describe("numberFieldToInputSchema", ...)` block.**
```ts
  it("rejects a missing value on a required field with a 'required' message", () => {
    const field = number({ required: true, defaultValue: 0 });
    const schema = numberFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/number/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/checkbox/inputSchema.ts
1 edit, everything else unchanged.

**1 — `checkboxFieldToInputSchema` rewritten to gate `.default()` behind `!field.required`.**
```ts
/**
 * Builds a Zod schema for validating a checkbox field value in the admin form.
 *
 * Checkbox fields are always boolean. Required fields attach
 * `{ error: "This field is required." }` to the base `z.boolean()` call and
 * never receive `.default()` — previously an unconditional
 * `.default(field.defaultValue)` meant `true`, `false`, *and* a missing value
 * all passed a "required" checkbox (CORE-1). Optional fields keep
 * `.default(field.defaultValue)`.
 *
 * @param props - Input props.
 * @param props.field - The resolved checkbox field definition
 * @returns A Zod boolean schema with optionality and default applied
 *
 * @example
 * ```ts
 * const field = checkbox({ required: true })
 * checkboxFieldToInputSchema({ field })
 * // → z.boolean({ error: "This field is required." })
 *
 * const optionalField = checkbox()
 * checkboxFieldToInputSchema({ field: optionalField })
 * // → z.boolean().default(false)
 * ```
 */
export function checkboxFieldToInputSchema(props: {
  field: CheckboxField;
}): ZodType {
  const { field } = props;

  const inputSchema = field.required
    ? z.boolean({ error: "This field is required." })
    : z.boolean().default(field.defaultValue);

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/checkbox/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/checkbox/inputSchema.test.ts
1 edit, everything else unchanged.

**1 — Add a new test after `includes metadata (label, description)`, inside the existing `describe("checkboxFieldToInputSchema", ...)` block.**
```ts
  it("rejects a missing value on a required field with a 'required' message", () => {
    const field = checkbox({ required: true });
    const schema = checkboxFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/checkbox/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/date/inputSchema.ts
1 edit, everything else unchanged.

**1 — `dateFieldToInputSchema` rewritten to gate `.default()` and add CORE-3's `min`/`max` timestamp checks.**
```ts
/**
 * Builds a Zod schema for validating a date field value in the admin form.
 *
 * Date values are Unix timestamps in milliseconds, so the base schema is
 * `z.number()`. Required fields attach `{ error: "This field is required." }`
 * to the base call so a missing value is rejected with a "required" message
 * instead of Zod's generic type-mismatch text, and never receive a
 * `.default()` — matching `applyBaseInputSchemaMeta`'s `.optional()` gate,
 * and unlike the previous `.default(Date.now())` that made a missing value
 * indistinguishable from "now" (CORE-1). `field.min`/`field.max` — Unix
 * millisecond timestamps — are enforced via `.min()`/`.max()` when set
 * (CORE-3); previously they were read nowhere in the schema.
 *
 * @param props - Input props.
 * @param props.field - The resolved date field definition
 * @returns A Zod number schema with range constraints and optionality applied
 *
 * @example
 * ```ts
 * const field = date({ required: true, min: 1700000000000 })
 * dateFieldToInputSchema({ field })
 * // → z.number({ error: "This field is required." }).min(1700000000000, ...)
 * ```
 */
export function dateFieldToInputSchema(props: { field: DateField }): ZodType {
  const { field } = props;

  const requiredError = "This field is required.";
  const minError = "Date must not be earlier than the minimum allowed date.";
  const maxError = "Date must not be later than the maximum allowed date.";

  let inputSchema = field.required
    ? z.number({ error: requiredError })
    : z.number();

  if (field.min !== undefined) {
    inputSchema = inputSchema.min(field.min, minError);
  }
  if (field.max !== undefined) {
    inputSchema = inputSchema.max(field.max, maxError);
  }

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
```

Note the `ZodNumber`/`ZodDefault` type imports from the original file are no longer used — the import line becomes `import { z, ZodType } from "zod";`.

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/date/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/date/inputSchema.test.ts
1 edit, everything else unchanged.

**1 — Replace the `required schema provides a numeric default (Date.now())` test — it directly pinned the CORE-1 defect (BUGS-REPORT: `date({ required: true }) -> ACCEPTS undefined`) as expected behaviour.**
```ts
  it("rejects a missing value on a required field with a 'required' message (CORE-1)", () => {
    const field = date({ required: true });
    const schema = dateFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/date/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/relationship/inputSchema.ts
1 edit, everything else unchanged.

**1 — `relationshipFieldToInputSchema` rewritten to gate `.default()` behind `!field.required`.**
```ts
/**
 * Builds a Zod schema for validating a relationship field value in the admin form.
 *
 * Convex document IDs are strings at the form boundary, always validated as
 * `z.array(z.string())` — `hasMany` is a UI-only hint and does not change the
 * shape. Required fields attach `{ error: "This field is required." }` to the
 * base `z.array()` call and never receive `.default()`; an empty array is
 * still a valid value for a required relationship (a document may
 * legitimately have zero related items) — `required` only rules out an
 * absent value here, unlike `select`/`array`/`blocks`/`upload` (CORE-1).
 * Non-required fields keep `.default([])`.
 *
 * @param props - Input props.
 * @param props.field - The resolved relationship field definition.
 * @returns A Zod schema for the relationship value.
 *
 * @example
 * ```ts
 * // Single, optional (default)
 * relationshipFieldToInputSchema({ field: relationship({ collection: { slug: "authors" } }) })
 * // → z.array(z.string()).default([])
 *
 * // Multi, required
 * relationshipFieldToInputSchema({ field: relationship({ collection: { slug: "tags" }, hasMany: true, required: true }) })
 * // → z.array(z.string(), { error: "This field is required." })
 * ```
 *
 * @internal
 */
export function relationshipFieldToInputSchema(props: {
  field: RelationshipField;
}): ZodType {
  const { field } = props;

  const inputSchema = field.required
    ? z.array(z.string(), { error: "This field is required." })
    : z.array(z.string()).default(ADMIN_FIELDS.relationship.defaultValue);

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/relationship/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/relationship/inputSchema.test.ts
1 edit, everything else unchanged.

**1 — Replace the `defaults undefined to [] for required fields` test — it directly pinned the CORE-1 defect (BUGS-REPORT: relationship confirmed alongside `group` as accepting undefined on a required field) as expected behaviour.**
```ts
  it("rejects a missing value on a required field with a 'required' message (CORE-1)", () => {
    const field = relationship({
      collection: { slug: "authors" },
      required: true,
    });
    const schema = relationshipFieldToInputSchema({ field });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/relationship/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/group/inputSchema.ts
1 edit, everything else unchanged.

**1 — `groupFieldToInputSchema` rewritten to gate `.default()` behind `!field.required`.**
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
  field: GroupField<TFieldMeta>;
}): ZodType {
  const { field } = props;

  const subSchemas = Object.fromEntries(
    Object.entries(field.fields).map(([key, subField]) => [
      key,
      adminFieldToInputSchema({ field: subField }),
    ]),
  );

  const schema: ZodType = field.required
    ? z.object(subSchemas, { error: "This field is required." })
    : z.object(subSchemas).default(field.defaultValue ?? {});

  return applyBaseInputSchemaMeta({ field, inputSchema: schema });
}
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/group/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/group/inputSchema.test.ts
1 edit, everything else unchanged.

**1 — Add a new test after `defaults to {} when field is optional and value is undefined`, inside the existing `describe("groupFieldToInputSchema", ...)` block.**
```ts
  it("rejects a missing value on a required field with a 'required' message", () => {
    const field = group({
      required: true,
      fields: { title: text({ required: true }) },
    });
    const schema = groupFieldToInputSchema({ field });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/group/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/select/inputSchema.ts
1 edit, everything else unchanged.

**1 — `selectFieldToInputSchema` rewritten to gate `.default()` and add `.min(1)` when required.**
```ts
/**
 * Builds a Zod schema for validating a select field value in the admin form.
 *
 * Validates that submitted values are arrays containing only defined option
 * values. When `hasMany` is false, limits the array to a maximum of one
 * item. Required fields attach `{ error: "This field is required." }` to the
 * base `z.array()` call and add `.min(1, "This field is required.")`, so a
 * missing value *and* an explicitly-submitted empty array are both rejected —
 * select previously had zero length enforcement for required fields
 * (CORE-1). Required fields never receive `.default()`; non-required fields
 * keep `.default(field.defaultValue)`.
 *
 * @param props - Input props.
 * @param props.field - The resolved select field definition
 * @returns A Zod array schema constrained to valid option values, with optionality applied
 *
 * @example
 * ```ts
 * const field = select({ required: true, options: [{ label: "Free", value: "free" }, { label: "Pro", value: "pro" }] })
 * selectFieldToInputSchema({ field })
 * // → z.array(z.enum(["free", "pro"]), { error: "This field is required." }).min(1, "This field is required.")
 *
 * const singleField = select({ hasMany: false, options: [{ label: "Free", value: "free" }] })
 * selectFieldToInputSchema({ field: singleField })
 * // → z.array(z.enum(["free"])).max(1, "Only one value may be selected.").default([])
 * ```
 */
export function selectFieldToInputSchema(props: {
  field: SelectField;
}): ZodType {
  const { field } = props;

  const optionValues = field.options.map((o) => o.value);
  // z.enum requires at least one element; fall back to z.string() when no options are configured yet
  const itemSchema =
    optionValues.length > 0
      ? z.enum(optionValues as [string, ...string[]])
      : z.string();

  const requiredError = "This field is required.";
  let inputSchema = field.required
    ? z.array(itemSchema, { error: requiredError }).min(1, requiredError)
    : z.array(itemSchema);

  if (!field.hasMany) {
    inputSchema = inputSchema.max(1, "Only one value may be selected.");
  }

  if (field.required) {
    return applyBaseInputSchemaMeta({ field, inputSchema });
  }

  return applyBaseInputSchemaMeta({
    field,
    inputSchema: inputSchema.default(field.defaultValue),
  });
}
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/select/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/select/inputSchema.test.ts
1 edit, everything else unchanged.

**1 — Add two new tests after `includes metadata (label, description)`, inside the existing `describe("selectFieldToInputSchema", ...)` block.**
```ts
  it("rejects a missing value on a required field with a 'required' message", () => {
    const field = select({ required: true, options: OPTIONS });
    const schema = selectFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });

  it("rejects an explicit empty array on a required field", () => {
    const field = select({ required: true, hasMany: true, options: OPTIONS });
    const schema = selectFieldToInputSchema({ field });

    const result = schema.safeParse([]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/select/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/blocks/inputSchema.ts
1 edit, everything else unchanged.

**1 — `blocksFieldToInputSchema` rewritten to gate `.default()` and add `.min(1)` when required, composed with the existing configured `min`/`max`.**
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
 * @param props - Input props.
 * @param props.field - The resolved blocks field definition.
 * @returns A Zod array schema with discriminated-union items.
 *
 * @internal — Used by admin form schema construction via `adminFieldToInputSchema`.
 */
export function blocksFieldToInputSchema<TFieldMeta extends {} = {}>(props: {
  field: BlocksField<TFieldMeta>;
}): ZodType {
  const { field } = props;

  const blockSchemas = field.blocks.map((block) => {
    const userSubSchemas = Object.fromEntries(
      Object.entries(block.fields).map(([key, subField]) => [
        key,
        adminFieldToInputSchema({ field: subField }),
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
    arraySchema = arraySchema.min(
      field.min,
      `At least ${field.min} ${field.labels.plural} required.`,
    );
  }
  if (field.max) {
    arraySchema = arraySchema.max(
      field.max,
      `No more than ${field.max} ${field.labels.plural} allowed.`,
    );
  }

  const schema: ZodType = field.required
    ? arraySchema
    : arraySchema.default(field.defaultValue ?? []);

  return applyBaseInputSchemaMeta({ field, inputSchema: schema });
}
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/blocks/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/blocks/inputSchema.test.ts
1 edit, everything else unchanged.

**1 — Add two new tests after `enforces max constraint`, inside the existing `describe("blocksFieldToInputSchema", ...)` block, reusing the file's existing `headingBlock` fixture.**
```ts
  it("rejects a missing value on a required field with a 'required' message", () => {
    const field = blocks({ blocks: [headingBlock], required: true });
    const schema = blocksFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });

  it("rejects an explicit empty array on a required field", () => {
    const field = blocks({ blocks: [headingBlock], required: true });
    const schema = blocksFieldToInputSchema({ field });

    const result = schema.safeParse([]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/blocks/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/array/inputSchema.ts
1 edit, everything else unchanged.

**1 — `arrayFieldToInputSchema` rewritten to replace the dead `superRefine` with a composed `.min(1)` and gate `.default()`.**
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
 * @param props - Input props.
 * @param props.field - The resolved array field definition
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
 * const field = array({ items: number(), min: { value: 1 }, max: { value: 5 } })
 * arrayFieldToInputSchema({ field })
 * // → z.array(z.number()).min(1).max(5).default([])
 * ```
 */
export function arrayFieldToInputSchema<
  TArrayType extends ArrayType = string,
  TFieldMeta extends {} = {},
>(props: { field: ArrayField<TArrayType, TFieldMeta> }): ZodType {
  const { field } = props;

  const fieldMinError = field.min?.error ?? "This field is too short.";
  const fieldMaxError = field.max?.error ?? "This field is too long.";
  const requiredError = "This field is required.";

  const itemsInputSchema = adminFieldToInputSchema({ field: field.items });

  let arraySchema = field.required
    ? z.array(itemsInputSchema, { error: requiredError }).min(1, requiredError)
    : z.array(itemsInputSchema);

  if (field.min) {
    arraySchema = arraySchema.min(field.min.value, fieldMinError);
  }
  if (field.max) {
    arraySchema = arraySchema.max(field.max.value, fieldMaxError);
  }

  const inputSchema: ZodType = field.required
    ? arraySchema
    : arraySchema.default(field.defaultValue ?? []);

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/array/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/array/inputSchema.test.ts
1 edit, everything else unchanged.

**1 — Replace the `generates required array schema` test — its own comment (`"Zod arrays accept undefined by default (known limitation)"`) directly pinned the CORE-1 defect as expected behaviour.**
```ts
    it("rejects a missing or empty value on a required field with a 'required' message (CORE-1)", () => {
      const itemsField = text({ required: true });
      const field = array({ required: true, items: itemsField });
      const schema = arrayFieldToInputSchema({ field });

      // Should accept valid arrays
      expect(schema.safeParse(["hello"]).success).toBe(true);

      // A required array field now rejects a missing value...
      const missing = schema.safeParse(undefined);
      expect(missing.success).toBe(false);
      if (!missing.success) {
        expect(missing.error.issues[0].message).toMatch(/required/i);
      }

      // ...and an explicit empty array, the same way a required text field
      // rejects an empty string.
      const empty = schema.safeParse([]);
      expect(empty.success).toBe(false);
      if (!empty.success) {
        expect(empty.error.issues[0].message).toMatch(/required/i);
      }

      // Zod arrays still reject null outright.
      expect(schema.safeParse(null).success).toBe(false);
    });
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/array/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/upload/inputSchema.ts
1 edit, everything else unchanged.

**1 — `uploadFieldToInputSchema` rewritten to add `.min(1)` when required.**
```ts
/**
 * Generates the Zod input schema for an upload field.
 *
 * The form stores an array of media document ID strings. The upload
 * component validates that each ID points to an existing media document at
 * the UI level (by querying the media collection); the Zod schema only
 * checks shape and, for required fields, non-emptiness. Required fields
 * attach `{ error: "This field is required." }` to the base `z.array()` call
 * and add `.min(1, "This field is required.")` — previously a required
 * upload field had zero length enforcement and accepted `[]` (CORE-1).
 *
 * @param props — Input schema generation options.
 * @param props.field — The resolved upload field definition.
 * @returns Zod schema for the form field value.
 */
export function uploadFieldToInputSchema(props: { field: UploadField }): ZodType {
  const { field } = props;

  const requiredError = "This field is required.";
  const inputSchema = field.required
    ? z.array(z.string(), { error: requiredError }).min(1, requiredError)
    : z.array(z.string());

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/upload/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/upload/inputSchema.test.ts
1 edit, everything else unchanged.

**1 — Add two new tests after `returns z.array().optional for optional field`, inside the existing `describe("uploadFieldToInputSchema", ...)` block.**
```ts
  it("rejects a missing value on a required field with a 'required' message", () => {
    const field = upload({ to: "images", required: true });
    const schema = uploadFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });

  it("rejects an explicit empty array on a required field", () => {
    const field = upload({ to: "images", required: true });
    const schema = uploadFieldToInputSchema({ field });

    const result = schema.safeParse([]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/upload/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/url/inputSchema.ts
1 edit, everything else unchanged.

**1 — `urlFieldToInputSchema` rewritten to check emptiness before URL format (CORE-2) and drop the conditional default-when-required path.**
```ts
/**
 * Builds a Zod schema for validating a URL field value in the admin form.
 *
 * Required fields check emptiness *before* URL format:
 * `z.string({ error: "This field is required." }).min(1, "This field is
 * required.").pipe(z.url())` — the `.min(1)` stage runs on the plain string
 * and short-circuits the pipe, so an empty required field reports "This
 * field is required." instead of "Invalid URL" (CORE-2; previously
 * `z.url().min(1, ...)` ran the format check first, and `new URL("")`
 * always threw before `.min()` ever ran). Required fields never receive
 * `.default()` — unlike `text()`, the url field has no implicit
 * empty-string default even when non-required. `.default(field.defaultValue)`
 * is applied only for non-required fields with an explicit `defaultValue`.
 * Wraps in `.optional()` for non-required fields via
 * `applyBaseInputSchemaMeta`.
 *
 * *Pinned, unchanged behaviour* (verified before and after this fix):
 * `z.url()` trims whitespace, imposes no protocol restriction (`mailto:`/
 * `ftp://` pass), and requires an absolute URL.
 *
 * @param props - Input props.
 * @param props.field - The resolved URL field definition.
 * @returns A Zod URL schema. Optional fields are wrapped in `.optional()`. A
 * `.default()` is only added when `field.defaultValue` is not `undefined`.
 *
 * @example
 * ```ts
 * // Required — rejects a missing/empty value with "This field is required.", not "Invalid URL"
 * urlFieldToInputSchema({ field: url({ required: true }) })
 *
 * // Optional with explicit default
 * urlFieldToInputSchema({ field: url({ required: false, defaultValue: "https://example.com" }) })
 * // → z.union([z.url(), z.literal("")]).default("https://example.com")
 * ```
 */
export function urlFieldToInputSchema(props: { field: UrlField }): ZodType {
  const { field } = props;
  const requiredError = "This field is required.";

  if (field.required) {
    return applyBaseInputSchemaMeta({
      field,
      inputSchema: z
        .string({ error: requiredError })
        .min(1, requiredError)
        .pipe(z.url()),
    });
  }

  const inputSchema =
    field.defaultValue !== undefined
      ? z.union([z.url(), z.literal("")]).default(field.defaultValue)
      : z.url();

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
```

The original `ZodDefault`, `ZodLiteral`, `ZodUnion`, `ZodURL` type imports are no longer referenced — the import line becomes `import { z, type ZodType } from "zod";`.

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/url/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/url/inputSchema.test.ts
1 edit, everything else unchanged.

**1 — Add two new tests after `generates optional URL schema — accepts valid URLs when provided`, inside the existing `describe("urlFieldToInputSchema", ...)` block.**
```ts
  it("rejects a missing value on a required field with a 'required' message", () => {
    const field = url({ required: true });
    const schema = urlFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });

  it("reports 'required' rather than 'Invalid URL' on an empty required field (CORE-2)", () => {
    const field = url({ required: true });
    const schema = urlFieldToInputSchema({ field });

    const result = schema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("This field is required.");
    }
  });
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/url/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/color/inputSchema.ts
1 edit, everything else unchanged (`colorPattern`, `colorMessage`, `FORMAT_EXAMPLES` and all imports are untouched).

**1 — `colorFieldToInputSchema` rewritten to drop the conditional default-when-required path and attach a base-type `error`.**
```ts
/**
 * Builds a Zod schema for validating a colour field value in the admin form.
 *
 * Accepts hex, `rgb()`, `hsl()` and `oklch()` notation — plus `var(--token)`
 * when the field enables `themeColors`. Required fields attach
 * `{ error: "This field is required." }` to the base `z.string()` call and
 * add `.min(1, "This field is required.")` before the notation `.regex()`
 * check, so an empty or missing required field reports "required" rather
 * than a notation complaint. Required fields never receive `.default()` —
 * previously a `defaultValue` on a required field was applied via
 * `.default()` anyway, so a missing value silently passed as that default
 * (CORE-1). Optional fields accept the empty string and keep
 * `.default(field.defaultValue)`, since `color()` defaults `defaultValue` to
 * `""` and a cleared picker must round-trip.
 *
 * @param props - Input props.
 * @param props.field - The resolved colour field definition.
 * @returns A Zod string schema. Optional fields are wrapped in `.optional()`
 * by `applyBaseInputSchemaMeta`.
 *
 * @example
 * ```ts
 * // Required — rejects a missing/empty value with "This field is required.", ignoring defaultValue
 * colorFieldToInputSchema({ field: color({ required: true }) })
 *
 * // themeColors — additionally accepts "var(--primary)"
 * colorFieldToInputSchema({ field: color({ required: true, themeColors: true }) })
 * ```
 */
export function colorFieldToInputSchema(props: { field: ColorField }): ZodType {
  const { field } = props;
  const pattern = colorPattern({ themeColors: field.themeColors });
  const message = colorMessage({ field });
  const requiredError = "This field is required.";

  if (field.required) {
    const inputSchema = z
      .string({ error: requiredError })
      .min(1, requiredError)
      .regex(pattern, message);
    return applyBaseInputSchemaMeta({ field, inputSchema });
  }

  const inputSchema =
    field.defaultValue !== undefined
      ? z
          .union([z.string().regex(pattern, message), z.literal("")])
          .default(field.defaultValue)
      : z.string().regex(pattern, message);

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/color/inputSchema.test.ts --coverage.enabled=false`

#### packages/core/src/fields/color/inputSchema.test.ts
1 edit, everything else unchanged.

**1 — Replace the `applies an explicit default on a required field` test — it directly pinned the CORE-1 defect (a required field's `.default()` swallowing a missing value) as expected behaviour.**
```ts
  it("a required field's defaultValue does not exempt it from the required check (CORE-1)", () => {
    const schema = colorFieldToInputSchema({
      field: color({ required: true, defaultValue: "#E8622A" }),
    });
    const result = schema.safeParse(undefined);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("This field is required.");
    }
  });
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/fields/color/inputSchema.test.ts --coverage.enabled=false`

Verify (whole step): `pnpm --filter @vexcms/core exec vitest run src/fields --coverage.enabled=false && pnpm --filter @vexcms/core typecheck`

### Step 2 — React shared form primitives (PKG-1, FormLabel id plumbing, LABEL-1 container test-contract extension)

- [ ] [agent] `packages/react/src/components/form/AppFormContext.ts` — widen `AnyFormApi`'s validator-slot generic defaults to their own declared bound (AP-006)
- [ ] [agent] `packages/react/src/components/form/FormLabel.tsx` — add `id` prop, default `${name}-label`, forwarded to `<Label>`
- [ ] [agent] `packages/react/src/testing/fieldInputContract.ts` — update `AppFormBoundary`'s explanatory comment with the AP-006 finding (cast itself retained); extend the shared label-association tests to accept `role="group"`/`aria-labelledby` alongside `<label for>` (needed by Steps 9–11's container fix)
- [ ] [agent] `packages/react/src/testing/nestedFieldContainer.ts` — same comment update, cross-referencing `fieldInputContract.ts`
- [ ] [agent] `packages/react/src/testing/rbacState.test.ts` — same comment update, cross-referencing `fieldInputContract.ts`
- [ ] [agent] Run `pnpm --filter @vexcms/react typecheck && pnpm --filter @vexcms/react exec vitest run src/testing/rbacState.test.ts --coverage.enabled=false`

#### packages/react/src/components/form/AppFormContext.ts
1 edit, everything else unchanged.

**1 — the `AnyFormApi` type declaration.** Each of the 10 validator-slot generics defaults to its own declared bound (`undefined | FormValidateOrFn<TFormData>` / `undefined | FormAsyncValidateOrFn<TFormData>`) instead of the narrow `undefined` — the AP-006 pattern: a type parameter appearing in the interface body must default to its full bound, never a value narrower than every concrete instantiation. `TFormData` and `TSubmitMeta` already defaulted to `any` (already the widest possible type) and are unchanged. `AppFormContext = createContext<AnyFormApi<...>>` and `useAppForm`'s return type already hardcode `any` for every forwarded slot (not the narrow `undefined`), so neither needs this fix — `any` is already wider than the bound-widened default.
```ts
export type AnyFormApi<
  TFormData extends any = any,
  TOnMount extends undefined | FormValidateOrFn<TFormData> = undefined | FormValidateOrFn<TFormData>,
  TOnChange extends undefined | FormValidateOrFn<TFormData> = undefined | FormValidateOrFn<TFormData>,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined | FormAsyncValidateOrFn<TFormData>,
  TOnBlur extends undefined | FormValidateOrFn<TFormData> = undefined | FormValidateOrFn<TFormData>,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined | FormAsyncValidateOrFn<TFormData>,
  TOnSubmit extends undefined | FormValidateOrFn<TFormData> = undefined | FormValidateOrFn<TFormData>,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined | FormAsyncValidateOrFn<TFormData>,
  TOnDynamic extends undefined | FormValidateOrFn<TFormData> = undefined | FormValidateOrFn<TFormData>,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined | FormAsyncValidateOrFn<TFormData>,
  TOnServer extends undefined | FormAsyncValidateOrFn<TFormData> = undefined | FormAsyncValidateOrFn<TFormData>,
  TSubmitMeta extends any = any,
> = ReactFormExtendedApi<
  TFormData,
  TOnMount,
  TOnChange,
  TOnChangeAsync,
  TOnBlur,
  TOnBlurAsync,
  TOnSubmit,
  TOnSubmitAsync,
  TOnDynamic,
  TOnDynamicAsync,
  TOnServer,
  TSubmitMeta
>;
```

#### packages/react/src/components/form/FormLabel.tsx
1 edit, everything else unchanged.

**1 — the `FormLabel` function.** Accepts an optional `id`, defaulting to `` `${name}-label` `` when the caller doesn't pass one explicitly, applied to the rendered `<Label id={...}>`. `htmlFor` is untouched — it still points at `name` (the control this label describes); the new `id` is what OTHER elements point AT via `aria-labelledby`, unrelated to `htmlFor`. `id` was already structurally part of `ComponentPropsWithRef<"label">` and previously flowed through untouched via `...labelProps` with no default — it's now pulled into the named destructure so the default applies.
```tsx
export function FormLabel({
  name,
  field,
  index,
  hideRequired = false,
  id = `${name}-label`,
  className,
  ...labelProps
}: {
  name: string;
  field: AdminField;
  index?: number;
  hideRequired?: boolean;
} & ComponentPropsWithRef<"label">) {
  const label = field.label || name;
  const numeric = index !== undefined ? `[${index + 1}] - ` : "";
  return (
    <Label id={id} htmlFor={name} className={cn("relative", className)} {...labelProps}>
      {numeric}
      {label}
      {!hideRequired && field.required && (
        <span className="text-red-500">*</span>
      )}
    </Label>
  );
}
```

#### packages/react/src/testing/fieldInputContract.ts
2 edits, everything else unchanged.

**1 — the JSDoc comment above `const AppFormBoundary = AppForm as unknown as ComponentType<{ form: unknown; children: ReactNode }>;`.**
```ts
/**
 * `AppForm` narrowed to the two props this harness passes.
 *
 * Spec 2026-09-07 Step 2 widened `AnyFormApi`'s validator-slot generics to
 * default to their own declared bound (`undefined | FormValidateOrFn<TFormData>`)
 * instead of the narrower `undefined`, per AP-006 — see `AppFormContext.ts`.
 * That fix does not reach this cast. `createElement(AppForm, props)` passes
 * `AppForm` as a bare, uninstantiated generic function reference; TypeScript
 * resolves `createElement`'s own type parameter by erasing EVERY one of
 * `AppForm`'s generics — including `TFormData` itself, not just the
 * validator slots — to `unknown` before it ever looks at the `props`
 * argument. A concrete form's `options.validators.onSubmit: (props: { value:
 * { title: string } }) => ...` then fails against the erased `(props: {
 * value: unknown }) => ...` on the contravariant `value` parameter,
 * regardless of what `AnyFormApi` declares as its default. Verified directly
 * against the installed `@tanstack/react-form` version in an isolated
 * checkout: even a direct, non-`createElement` assignment of a form carrying
 * an actual validator (`const wide: AnyFormApi = formWithOnSubmitValidator`)
 * still fails separately, because TanStack's own `UnwrapFormValidateOrFnForInner`
 * collapses any abstract, non-literal validator-generic bound to `undefined`
 * when computing `FormState.errorMap` — so a real validator's return type
 * (e.g. `"required" | undefined`) is never assignable back to it, no matter
 * how `AnyFormApi`'s type parameters default. JSX (`<AppForm form={form}>`)
 * never hits either problem — it infers `AppForm`'s generics straight from
 * the concrete `form` argument — but this harness is a `.ts` file building a
 * dynamic component tree and cannot use JSX syntax. Retyping `AppForm`/
 * `AnyFormApi` to route around TanStack's internal error-extraction is
 * production work and stays out of this spec's scope.
 */
```

**2 — extend the shared label-association assertions (the `describe(\`${fixture.fieldType} field input contract\`, ...)` block's `"── 1. Label"` section) to accept either a single-control `<label for>` pair OR a container's `role="group"`/`aria-labelledby` pair.** Array/group/blocks (Steps 9–11) drop the single-control `<label for={name}>` pattern entirely — none of them has one natural focusable target — in favor of `role="group"` wrapping an `aria-labelledby`-referenced plain label node. The existing tests hardcoded the single-control shape; add a `getLabelNode` helper right above the `describe(...)` block (near the existing `getControl` export) and route the label-text assertions through it instead of a bare `container.querySelector("label")`. The very first test additionally needs its own branch, since it also has to prove the group-labelled shape itself is correctly wired (`role="group"` present, `aria-labelledby` resolving, containing the field's label text) rather than just reading label text off it.
```ts
/**
 * Resolves the accessible label node for either labelling pattern this suite
 * supports: a single-control field's `<label for={FIELD_NAME}>` (`FormLabel`),
 * or a container field's `role="group"` wrapper whose `aria-labelledby`
 * resolves to a plain labelled node (array/group/blocks — no single control
 * for `htmlFor` to point at). Returns `null` if neither pattern is present.
 */
function getLabelNode(container: HTMLElement): HTMLElement | null {
  const labelEl = container.querySelector<HTMLElement>("label");
  if (labelEl) return labelEl;

  const group = container.querySelector<HTMLElement>('[role="group"]');
  const labelledBy = group?.getAttribute("aria-labelledby");
  if (!labelledBy) return null;
  return container.querySelector<HTMLElement>(`#${labelledBy}`);
}
```
```ts
    it('renders a label associated with the input via htmlFor/id, or (for container fields with no single control) a labelled role="group"', () => {
      const { container } = renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.valid,
      });

      const labelEl = container.querySelector("label");
      if (labelEl) {
        expect(labelEl).toHaveAttribute("for", FIELD_NAME);
        expect(getControl(container, label)).toHaveAttribute("id", FIELD_NAME);
        return;
      }

      const group = container.querySelector('[role="group"]');
      expect(group).not.toBeNull();
      const labelledBy = group?.getAttribute("aria-labelledby");
      expect(labelledBy).toBeTruthy();
      const labelNode = labelledBy ? container.querySelector(`#${labelledBy}`) : null;
      expect(labelNode).not.toBeNull();
      expect(labelNode?.textContent).toContain(label);
    });

    it("falls back to the field name when fieldDef.label is empty", () => {
      const fieldDef = withFieldDef(fixture.fieldDef, { label: "" });
      renderField({ Component, fieldDef, collection, readOnly: false, initialValue: fixture.valid });

      expect(screen.getByLabelText(FIELD_NAME, { exact: false })).toBeInTheDocument();
    });

    it("prefixes the label with a 1-based index when `index` is supplied (nested rendering)", () => {
      const { container } = renderField({
        Component,
        fieldDef: fixture.fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.valid,
        index: 2,
      });

      const expected = `[3] - ${label}${fixture.fieldDef.required ? "*" : ""}`;
      expect(getLabelNode(container)?.textContent).toBe(expected);
    });

    it("shows a required-asterisk in the label when the field is required", () => {
      const fieldDef = withFieldDef(fixture.fieldDef, { required: true });
      const { container } = renderField({
        Component,
        fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.valid,
      });

      expect(getLabelNode(container)?.textContent).toBe(
        `${fieldDef.label || FIELD_NAME}*`,
      );
    });

    it("hides the required-asterisk in the label when the field is not required", () => {
      const fieldDef = withFieldDef(fixture.fieldDef, { required: false });
      const { container } = renderField({
        Component,
        fieldDef,
        collection,
        readOnly: false,
        initialValue: fixture.valid,
      });

      expect(getLabelNode(container)?.textContent).toBe(fieldDef.label || FIELD_NAME);
    });
```

#### packages/react/src/testing/nestedFieldContainer.ts
1 edit, everything else unchanged. The `AppFormBoundary` constant and cast are unchanged.

**1 — the JSDoc comment above `const AppFormBoundary = AppForm as unknown as ComponentType<{ form: unknown; children: ReactNode }>;`.**
```ts
/**
 * `AppForm` narrowed to the two props this harness passes — the same
 * documented AP-006 boundary cast as `fieldInputContract.ts`'s own
 * `AppFormBoundary`, including its Step 2 finding: widening `AnyFormApi`'s
 * validator-slot defaults does not unlock removing this cast, because
 * `createElement(AppForm, props)` erases ALL of `AppForm`'s generics —
 * `TFormData` included — to `unknown` before checking `props`, independent
 * of what `AnyFormApi` declares as a default. See `fieldInputContract.ts`
 * for the full write-up and the verified TanStack Form internals
 * (`UnwrapFormValidateOrFnForInner`) that independently block it.
 */
```

#### packages/react/src/testing/rbacState.test.ts
1 edit, everything else unchanged. The `AppFormBoundary` constant and cast are unchanged.

**1 — the JSDoc comment above `const AppFormBoundary = AppForm as unknown as ComponentType<{ form: unknown; children: ReactNode }>;`.**
```ts
/**
 * `AppForm` narrowed to the two props this harness passes — same documented
 * AP-006 boundary cast `fieldInputContract.ts` uses, including its Step 2
 * finding: widening `AnyFormApi`'s validator-slot defaults does not unlock
 * removing this cast, because `createElement(AppForm, props)` erases ALL of
 * `AppForm`'s generics — `TFormData` included — to `unknown` before checking
 * `props`, independent of what `AnyFormApi` declares as a default. See
 * `fieldInputContract.ts` for the full write-up.
 */
```

**Finding — the requested cast removal and a new bare-supertype test are not achievable; verified, not assumed.** Two things the interview asked for turned out to be blocked by evidence gathered while building this step, both checked against the actual installed `@tanstack/react-form@1.33.1` in an isolated `git worktree`:

1. **Cast removal.** `createElement(AppForm, { form, children })` (no cast) fails with `TS2769: No overload matches this call`, bottoming out at `Type 'unknown' is not assignable to type '{ title: string }'` — `TFormData` itself resolves to `unknown` when a generic component is passed to `createElement` by bare reference, a `createElement`-vs-JSX generic-inference gap unrelated to `AnyFormApi`'s validator-slot defaults. JSX call sites elsewhere in the codebase (e.g. `text/Input.test.tsx`, `array/Input.test.tsx`) already mount validator-bearing forms into `<AppForm form={form}>` with zero cast, because JSX infers `AppForm`'s generics directly from the concrete `form` value — the gap is specific to the `.ts`-only, `createElement`-based test harnesses.
2. **New bare-supertype test.** `const wide: AnyFormApi = useForm({ validators: { onSubmit: (...) => "required" } })` also fails to compile: TanStack's own `UnwrapFormValidateOrFnForInner` computes `FormState.errorMap`'s per-slot error type via a non-distributing conditional that collapses ANY abstract union bound — including the widened default from this step — to `undefined`, while a concrete validator's real return type does not collapse. `"required" | undefined` is never assignable to `undefined`, so the test would not compile regardless of `AnyFormApi`'s declared defaults.

The `AnyFormApi` widening itself is still applied as instructed — a real, correct AP-006 fix to the type's own declared shape, confirmed clean via `pnpm --filter @vexcms/react typecheck` in the isolated worktree. It has no reachable, testable effect through TanStack Form's derived types beyond that, which is why no new passing test accompanies it.

Verify: `pnpm --filter @vexcms/react typecheck && pnpm --filter @vexcms/react exec vitest run src/testing/rbacState.test.ts --coverage.enabled=false`

### Step 3 — date field (LABEL-1, CORE-3 UI half, UI-5, A11Y-1)

- [ ] [agent] Edit `packages/react/src/components/ui/datetime/date-picker.tsx` — add `id`/`aria-required` to `DateTimePickerProps`, destructure them, forward both onto the default trigger `<div>`
- [ ] [agent] Edit `packages/react/src/components/fields/date/Input.tsx` — widen the field value type to `number | undefined`, forward `id`/`min`/`max`/`aria-required` to `DateTimePicker`, fix `handleChange` to stop swallowing `Clear`

#### packages/react/src/components/ui/datetime/date-picker.tsx
3 edits, everything else unchanged.

**1 — `DateTimePickerProps`: add `id` and `aria-required`, forwarded to the trigger element.** Insert after the `modal` property.
```ts
  /**
   * The `id` attribute applied to the trigger element that opens the picker —
   * pair with an external `<label htmlFor>` pointing at the same value.
   */
  id?: string;
  /**
   * Marks the trigger element as required for assistive technology.
   * @default false
   */
  "aria-required"?: boolean;
```

**2 — `DateTimePicker` function signature: destructure `id` and `aria-required` so they don't leak into the `...props` spread onto `DayPicker`.**
```tsx
export function DateTimePicker({
  value,
  onChange,
  renderTrigger,
  min,
  max,
  timezone,
  hideTime,
  use12HourFormat,
  disabled,
  clearable,
  classNames,
  timePicker,
  modal = false,
  id,
  "aria-required": ariaRequired,
  ...props
}: DateTimePickerProps & CalendarProps) {
```

**3 — Default (non-`renderTrigger`) trigger `<div>`: apply `id` and `aria-required`.** This is the branch `DateFieldInput` actually renders through (it never passes `renderTrigger`), so it's the element `getControl` and screen readers resolve as the field's control.
```tsx
            : (props) => (
                <div
                  {...props}
                  id={id}
                  aria-required={ariaRequired}
                  className={cn(
                    "flex w-full cursor-pointer items-center h-9 ps-3 pe-1 font-normal border border-input rounded-md text-sm shadow-sm",
                    !displayValue && "text-muted-foreground",
                    (!clearable || !value) && "pe-3",
                    disabled && "opacity-50 cursor-not-allowed",
                    classNames?.trigger,
                    props.className,
                  )}
                >
```

#### packages/react/src/components/fields/date/Input.tsx
4 edits, everything else unchanged.

**1 — JSDoc `@example`: the explicit-`field`-prop comment now reads `TypedFieldApi<number | undefined>`.** Anchor: the `// Explicit field prop —` comment line above `<form.Field name="publishedAt">`.
```ts
 * // Explicit field prop — TypedFieldApi<number | undefined>, works outside AppForm
```

**2 — `DateFieldInput`: widen the value generic to `number | undefined` so `handleChange(undefined)` (Clear) type-checks.** Anchor: the `createFieldInput<number, {}, DateField>(` call.
```ts
export const DateFieldInput = createFieldInput<number | undefined, {}, DateField>(
```

**3 — `minDate`/`maxDate` memos and `handleChange`: forward `fieldDef.min`/`fieldDef.max` as `Date`s (CORE-3 UI half — `DateTimePickerProps.min`/`max` are already `Date | undefined`, matching directly), and stop swallowing `Clear` (UI-5).** Anchor: the `dateValue` memo through the end of the existing `handleChange` callback.
```tsx
    const dateValue = useMemo(
      () => (field.state.value ? new Date(field.state.value) : undefined),
      [field.state.value],
    );

    const minDate = useMemo(
      () => (fieldDef.min !== undefined ? new Date(fieldDef.min) : undefined),
      [fieldDef.min],
    );

    const maxDate = useMemo(
      () => (fieldDef.max !== undefined ? new Date(fieldDef.max) : undefined),
      [fieldDef.max],
    );

    const handleChange = useCallback((date: Date | undefined) => {
      fieldRef.current.handleChange(date ? date.getTime() : undefined);
    }, []);
```

**4 — `<DateTimePicker>` JSX: wire `id` (LABEL-1), `min`/`max` (CORE-3 UI half), and `aria-required` (A11Y-1).** Anchor: the `<DateTimePicker … />` element.
```tsx
        <DateTimePicker
          id={name}
          value={dateValue}
          onChange={handleChange}
          disabled={readOnly || fieldDef.admin.readOnly}
          clearable
          hideTime={fieldDef.time.hidden}
          use12HourFormat={fieldDef.time.use12HourFormat}
          timePicker={fieldDef.time.timePicker}
          min={minDate}
          max={maxDate}
          aria-required={fieldDef.required}
        />
```

Verify: `pnpm --filter @vexcms/react exec vitest run src/components/fields/date/Input.test.tsx --coverage.enabled=false`

### Step 4 — select field (LABEL-1, A11Y-4, A11Y-1)

- [ ] [agent] Modify `packages/react/src/components/ui/multi-select.tsx` — add an `aria-label` to each removable selected-value badge in `MultiSelectValue`
- [ ] [agent] Modify `packages/react/src/components/fields/select/Input.tsx` — wire `id`/`aria-required` onto `MultiSelectTrigger`

#### packages/react/src/components/ui/multi-select.tsx
`MultiSelectTrigger` already forwards an `id` prop correctly — it only destructures `className` and `children` out of its props, so an `id` passed by a caller stays in `...props` and flows through to `PopoverTrigger` (Base UI's `Popover.Trigger`), which merges `id` onto the real rendered `<button>`. No change is needed there; `SelectFieldInput` just needs to actually pass one (see the `Input.tsx` edit below).

`MultiSelectValue`'s per-value badge is the removable chip itself (there is no separate inner remove button) — clicking the whole `<Badge>` calls `toggleValue(value)` when `clickToRemove` is true, and the `XIcon` next to the label is purely decorative. Give that clickable badge an `aria-label` describing the remove action so screen readers announce it as more than a bare label string.

1 edit, everything else unchanged.

**1 — `MultiSelectValue`'s selected-value `.map` callback gains a `label` local and an `aria-label` on the remove `Badge`.**
```tsx
  return (
    <div
      {...props}
      ref={handleResize}
      className={cn(
        "flex flex-1 min-w-0 gap-1.5 overflow-hidden",
        shouldWrap && "h-full flex-wrap",
        className,
      )}
    >
      {[...selectedValues].map((value) => {
        const label = items.get(value) ?? value;
        return (
          <Badge
            variant="outline"
            data-selected-item
            className="group flex items-center gap-1"
            key={value}
            aria-label={clickToRemove ? `Remove ${label}` : undefined}
            onClick={
              clickToRemove
                ? (e) => {
                    e.stopPropagation();
                    toggleValue(value);
                  }
                : undefined
            }
          >
            {label}
            {clickToRemove && (
              <XIcon className="size-2 text-muted-foreground group-hover:text-destructive" />
            )}
          </Badge>
        );
      })}
      <Badge
        style={{
          display: overflowAmount > 0 && !shouldWrap ? "block" : "none",
        }}
        variant="outline"
        ref={overflowRef}
      >
        +{overflowAmount}
      </Badge>
    </div>
  );
```

#### packages/react/src/components/fields/select/Input.tsx
Threads the field's `id` (matching `FormLabel`'s `htmlFor={name}`) and `aria-required` onto the trigger button so the label associates with the combobox and assistive tech announces required state.

1 edit, everything else unchanged.

**1 — `SelectFieldInput`'s `<MultiSelectTrigger>` gains `id` and `aria-required`.**
```tsx
          <MultiSelectTrigger
            id={name}
            className="w-full"
            onBlur={field.handleBlur}
            name={name}
            aria-readonly={fieldDef.admin.readOnly}
            aria-required={fieldDef.required}
            disabled={readOnly}
          >
            <MultiSelectValue placeholder={fieldDef.admin.placeholder} />
          </MultiSelectTrigger>
```

Verify: `pnpm --filter @vexcms/react exec vitest run src/components/fields/select/Input.test.tsx --coverage.enabled=false`

### Step 5 — checkbox field (A11Y-2, UI-3, A11Y-1)

- [ ] [agent] Modify `packages/react/src/components/fields/checkbox/Input.tsx`

#### packages/react/src/components/fields/checkbox/Input.tsx
3 edits, everything else unchanged.

**1 — `<Checkbox>` element: add `aria-labelledby` wired to `FormLabel`'s default id and `aria-required` forwarding `fieldDef.required` (A11Y-2, A11Y-1).**
```tsx
          <Checkbox
            id={name}
            aria-labelledby={`${name}-label`}
            aria-required={fieldDef.required}
            readOnly={readOnly || fieldDef.admin.readOnly}
            disabled={readOnly || fieldDef.admin.readOnly}
            checked={field.state.value}
            onCheckedChange={(checked) => field.handleChange(checked)}
            onBlur={field.handleBlur}
          />
```

**2 — `<FormLabel>` render: drop `hideRequired` so the required asterisk shows like every other field type (UI-3).**
```tsx
          <FormLabel field={fieldDef} index={index} name={name} />
```

No third edit is needed to `packages/react/src/components/ui/checkbox.tsx` — its `Checkbox` component already destructures only `className` and spreads the rest (`{...props}`, typed as `CheckboxPrimitive.Root.Props`) onto `CheckboxPrimitive.Root`, so `aria-labelledby` and `aria-required` pass straight through to the underlying Base UI root element without any change there.

Verify: `pnpm --filter @vexcms/react exec vitest run src/components/fields/checkbox/Input.test.tsx --coverage.enabled=false`

### Step 6 — upload field (LABEL-1, UI-6, UI-7, UI-8, A11Y-1)

- [ ] [agent] `packages/react/src/components/fields/upload/EmptyInput.tsx` — thread `name` through `UploadEmptyProps`, apply `id`/`aria-required` to the dropzone `<input>`, filter dropped files against `fieldDef.accept`
- [ ] [agent] `packages/react/src/components/fields/upload/Input.tsx` — fix dead `readOnly` branch's missing `return`, destructure `index`/`submissionAttempts`, add `index` to every `FormLabel`, add `FormDescription`/`FormError` to all three branches, pass `name` into `UploadEmpty`

#### packages/react/src/components/fields/upload/EmptyInput.tsx
4 edits, everything else unchanged.

**1 — `UploadEmptyProps` gains a `name` field.** The dropzone's native `<input type="file">` needs the field's `name` to serve as its `id`, matching the `FormLabel`'s `htmlFor={name}` rendered above it in `Input.tsx` (LABEL-1).
```ts
export interface UploadEmptyProps {
  /** The field's name — applied as the dropzone input's `id` so the `FormLabel` (`htmlFor={name}`) associates with it. */
  name: string;
  /** Callback to open the media picker modal. */
  onPickerOpen: () => void;
  /** Callback when files are selected via dropzone (NOT uploaded yet). */
  onFilesSelected: (files: File[]) => Promise<void>;
  /** The UploadField of the field being uploaded to. */
  fieldDef: UploadField;
  /** The media collection slug for the upload. */
  targetCollectionConfig: MediaCollectionConfig;
  /** Whether the field is read-only. */
  readOnly?: boolean;
}
```

**2 — `UploadEmpty` destructures `name` and gains a module-private accept-matching helper.** Add the helper directly above the component so `handleDrop` can filter dropped files with the same semantics as the native `accept` attribute (comma-separated extensions, MIME types, or `type/*` wildcards) before handing them to `onFilesSelected` — the OS file picker already does this filtering for the `<input type="file">` path via its own `accept` attribute, but a drag-and-drop never goes through that native gate (UI-8).
```ts
/**
 * Checks whether a file matches an HTML `accept` attribute pattern list —
 * mirrors the native `<input type="file" accept="...">` matching semantics
 * (comma-separated file extensions, MIME types, or `type/*` wildcards).
 *
 * @param file - The candidate file.
 * @param accept - The `accept` attribute value, e.g. `"image/*, .pdf"`.
 * @returns `true` when `accept` is empty or the file matches one of its patterns.
 */
function fileMatchesAccept(file: File, accept: string): boolean {
  const patterns = accept
    .split(",")
    .map((pattern) => pattern.trim().toLowerCase())
    .filter(Boolean);
  if (patterns.length === 0) return true;

  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();
  const mimeCategory = mimeType.split("/")[0];

  return patterns.some((pattern) => {
    if (pattern.startsWith(".")) {
      return fileName.endsWith(pattern);
    }
    if (pattern.endsWith("/*")) {
      return mimeCategory === pattern.slice(0, -2);
    }
    return mimeType === pattern;
  });
}

export function UploadEmpty({
  name,
  onPickerOpen,
  onFilesSelected,
  fieldDef,
  targetCollectionConfig,
  readOnly,
}: UploadEmptyProps) {
```

**3 — `handleDrop` filters dropped files against `fieldDef.accept`.**
```ts
  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (readOnly) return;

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        fileMatchesAccept(file, fieldDef.accept),
      );
      if (files.length > 0) {
        await onFilesSelected(files);
      }
    },
    [fieldDef.accept, onFilesSelected, readOnly],
  );
```

**4 — the dropzone `<input type="file">` gets `id` and `aria-required`.**
```tsx
        <input
          id={name}
          type="file"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={readOnly}
          accept={fieldDef.accept}
          aria-required={fieldDef.required}
        />
```

#### packages/react/src/components/fields/upload/Input.tsx
5 edits, everything else unchanged.

**1 — imports gain `FormDescription` and `FormError` beside the existing `FormLabel` import.**
```ts
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError } from "../../form/FormError";
```

**2 — the `UploadFieldInput` render function destructures `index` and `submissionAttempts` from `createFieldInput`'s render props.**
```ts
  ({ name, collection, fieldDef, field, readOnly, index, submissionAttempts }) => {
```

**3 — the `readOnly` branch's dead JSX-expression-statement becomes a real `return`, gains `index` on `FormLabel`, and gains `FormDescription`/`FormError` (UI-7, UI-6, LABEL-1).**
```tsx
    if (readOnly) {
      return (
        <>
          <FormLabel name={name} field={fieldDef} index={index} />
          {value.length > 0 ? (
            <UploadFilledState
              collection={collection}
              readOnly={readOnly}
              mediaIds={value}
              fieldApi={field}
              fieldDef={fieldDef}
              onRemove={handleRemove}
              openPicker={openPicker}
            />
          ) : (
            <div className="text-sm text-muted-foreground">—</div>
          )}
          <FormDescription field={fieldDef} />
          <FormError field={field} submissionAttempts={submissionAttempts} />
        </>
      );
    }
```

**4 — the empty (`value.length === 0`) branch passes `index` to `FormLabel`, passes `name` into `UploadEmpty`, and adds `FormDescription`/`FormError` after the dropzone.**
```tsx
    if (value.length === 0) {
      return (
        <>
          <FormLabel name={name} field={fieldDef} index={index} />
          <UploadEmpty
            name={name}
            readOnly={readOnly}
            onPickerOpen={openPicker}
            fieldDef={fieldDef}
            targetCollectionConfig={targetCollectionConfig}
            onFilesSelected={handleFilesSelected}
          />
          <FormDescription field={fieldDef} />
          <FormError field={field} submissionAttempts={submissionAttempts} />
          {isOpen && (
            <MediaPicker
              field={field}
              fieldDef={fieldDef}
              targetCollection={fieldDef.to}
              multi={fieldDef.hasMany}
              onSelect={handleSelect}
              onCancel={closePicker}
              defaultTab={defaultTab}
              stagedFiles={stagedFiles}
            />
          )}
        </>
      );
    }
```

**5 — the filled (final) return passes `index` to `FormLabel` and adds `FormDescription`/`FormError` after `UploadFilledState`.**
```tsx
    return (
      <>
        <FormLabel name={name} field={fieldDef} index={index} />
        <UploadFilledState
          readOnly={readOnly}
          collection={collection}
          mediaIds={value}
          fieldApi={field}
          fieldDef={fieldDef}
          onRemove={handleRemove}
          onReorder={handleReorder}
          openPicker={openPicker}
        />
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
        {isOpen && (
          <MediaPicker
            field={field}
            fieldDef={fieldDef}
            targetCollection={fieldDef.to}
            multi={fieldDef.hasMany}
            onSelect={handleSelect}
            onCancel={closePicker}
          />
        )}
      </>
    );
  },
);
```

Verify: `pnpm --filter @vexcms/react exec vitest run src/components/fields/upload/Input.test.tsx --coverage.enabled=false`

### Step 7 — number field (UI-2, UI-4, A11Y-1)

- [ ] [agent] Update `packages/react/src/components/fields/number/Input.tsx` — empty-value handling, min/max forwarding, `aria-required`

#### packages/react/src/components/fields/number/Input.tsx
The whole `NumberFieldInput` render body changes: the `value` prop no longer coerces a cleared field to `0` (which masked CORE-1's empty-string/`undefined` handling upstream), `onChange` only calls `Number(...)` for non-empty strings and otherwise clears the field to `undefined`, the native `<input type="number">` now forwards `min`/`max` from `fieldDef.min?.value` / `fieldDef.max?.value` (per `NumberField` in `packages/core/src/fields/number/types.ts`), and the control gets `aria-required={fieldDef.required}`.
```tsx
export const NumberFieldInput = createFieldInput<number, {}, NumberField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel field={fieldDef} index={index} name={name} />
        <Input
          id={name}
          disabled={readOnly}
          type="number"
          value={field.state.value ?? ""}
          onChange={(e) =>
            field.handleChange(
              e.target.value === "" ? undefined : Number(e.target.value),
            )
          }
          onBlur={field.handleBlur}
          placeholder={fieldDef.admin.placeholder}
          readOnly={fieldDef.admin.readOnly}
          min={fieldDef.min?.value}
          max={fieldDef.max?.value}
          aria-required={fieldDef.required}
        />
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
```

Verify: `pnpm --filter @vexcms/react exec vitest run src/components/fields/number/Input.test.tsx --coverage.enabled=false`

### Step 8 — relationship field (UI-10, UI-13, ARCH-1, A11Y-1)

- [ ] [agent] Edit `packages/react/src/components/fields/relationship/Input.tsx` — fix inverted chip-remove `disabled` guard (UI-10) and add `aria-required` to the trigger (A11Y-1)
- [ ] [agent] Edit `packages/react/src/hooks/useRelationshipPickerOptions.ts` — add `placeholderData: keepPreviousData` to the picker query (UI-13)
- [ ] [agent] Edit `packages/react/src/components/fields/relationship/preview.tsx` — drop the dead target-collection preview fallback (ARCH-1)
- [ ] [agent] Edit `packages/react/src/components/fields/relationship/Input.test.tsx` — retire the collection-level precedence test and correct the now-stale UI-10 "expected to fail" comment
- [ ] [agent] Edit `packages/core/src/collections/types.ts` — remove `admin.components.preview` from both the collection config input and resolved types (ARCH-1)
- [ ] [agent] Edit `packages/core/src/collections/config.ts` — drop the now-nonexistent `components: {}` admin default that `AdminCollectionConfig`'s type change makes an excess property
- [ ] [agent] Edit `packages/core/src/fields/relationship/types.ts` — correct the field-level `components` doc comments that referenced the removed collection-level precedence
- [ ] [agent] Edit `apps/docs/src/content/docs/fields/relationship.mdx` — replace the collection-level preview example with prose explaining field-level `admin.components.preview` is the only supported location

#### packages/react/src/components/fields/relationship/Input.tsx
2 edits, everything else unchanged.

**1 — Chip remove `<button>`'s `disabled` prop.** The current `disabled={!readOnly || fieldDef.admin.readOnly}` inverts the `readOnly` check, so the button is disabled in the normal editable case and stays enabled when the field actually is read-only. `handleRemove` already guards itself with `if (readOnly || fieldDef.admin.readOnly) return;` (unchanged) — the JSX now matches that guard exactly (UI-10):
```tsx
              <button
                type="button"
                onClick={() => handleRemove(doc._id)}
                className="hover:text-destructive"
                disabled={readOnly || fieldDef.admin.readOnly}
              >
                <X className="h-3 w-3" />
              </button>
```

**2 — `Button` rendered by `PopoverTrigger`'s `render` prop.** Adds `aria-required` so assistive tech announces the picker as required in sync with every other field input (A11Y-1):
```tsx
            <Button
              variant="outline"
              disabled={readOnly || fieldDef.admin.readOnly}
              aria-required={fieldDef.required}
              className="w-full justify-between font-normal"
            />
```

Verify: `pnpm --filter @vexcms/react exec vitest run src/components/fields/relationship/Input.test.tsx --coverage.enabled=false`

#### packages/react/src/hooks/useRelationshipPickerOptions.ts
2 edits, everything else unchanged.

**1 — Import.** `keepPreviousData` joins the existing `useQuery` import:
```ts
import { keepPreviousData, useQuery } from "@tanstack/react-query";
```

**2 — `useQuery` options object.** Keeps the previous page's results on screen while a new search/query is in flight, instead of flashing to an empty/loading list on every keystroke (UI-13):
```ts
  const { data, isPending, isError, error } = useQuery({
    ...convexQuery(
      isSearchable ? vexConvexApi.search : vexConvexApi.find,
      args as never,
    ),
    enabled: opts?.enabled ?? true,
    placeholderData: keepPreviousData,
  });
```

Verify: `pnpm --filter @vexcms/react exec vitest run src/components/fields/relationship/Input.test.tsx --coverage.enabled=false`

#### packages/react/src/components/fields/relationship/preview.tsx
1 edit — `resolveRelationshipPreview`'s body and doc comment change throughout, shown complete.

**1 — `resolveRelationshipPreview`.** Drops the `props.targetCollection?.admin.components?.preview` fallback. It was already permanently dead in the browser: `targetCollection` comes from `useVexConfig()`'s `ClientVexConfig`, which is produced by `sanitizeConfigForClient` — `stripNonSerializable` (`packages/core/src/config/sanitizeConfig.ts`) replaces every function value, including component references, with `null` before the sanitized config ever reaches a client component. So `targetCollection.admin.components.preview` was always `null` on the client; the field-level override was the only branch that could ever resolve to a real component (ARCH-1):
```tsx
/**
 * Resolves which preview component to use for a relationship rendering context.
 *
 * Precedence: field-level override, else the default text preview. Target
 * collections do not support their own preview override — `targetCollection`
 * is sourced from the sanitized `ClientVexConfig` (`sanitizeConfigForClient`
 * strips every function, including component references, before the config
 * reaches the client), so a collection-level `admin.components.preview`
 * could never resolve to a real component in the browser. The default
 * renders `doc[useAsTitle] ?? doc._id` as plain text.
 *
 * @param props - Input props.
 * @param props.fieldDef - The resolved relationship field definition.
 * @param props.targetCollection - The resolved target collection config, or `undefined` in list-cell context.
 * @returns A `ComponentType` ready to render with `RelationshipPreviewProps`.
 */
export function resolveRelationshipPreview(props: {
  fieldDef: RelationshipField;
  targetCollection: CollectionConfig | undefined;
}): ComponentType<RelationshipPreviewProps> {
  return (props.fieldDef.admin.components?.preview ??
    DefaultRelationshipPreview) as ComponentType<RelationshipPreviewProps>;
}
```

Verify: `pnpm --filter @vexcms/react exec vitest run src/components/fields/relationship/Input.test.tsx --coverage.enabled=false`

#### packages/react/src/components/fields/relationship/Input.test.tsx
4 edits, everything else unchanged. The `targetCollection`-level precedence branch removed above is exercised by this file's `resolveRelationshipPreview precedence (Decision 11)` describe block, and the chip-remove `disabled` fix above flips a currently-failing assertion to passing — both need updating for the suite to stay green.

**1 — Import block.** `defineCollection` and `text` were only used to build the now-deleted collection-level-preview fixture; drop them:
```tsx
import {
  defineConfig,
  sanitizeConfigForClient,
  type ClientVexConfig,
  type CollectionFieldMeta,
  type RelationshipField,
  type RelationshipPreviewProps,
} from "@vexcms/core";
```

**2 — Comment above the `removeButton` query in `"hasMany: the chip's own remove (×) button removes the selected document from the value"`.** Previously documented the UI-10 defect as an intentional, currently-failing assertion; now documents the fixed invariant:
```tsx
          // The chip's × button is icon-only (lucide `X`, `aria-hidden`) with no
          // accessible name of its own, so it's queried by its distinguishing
          // class rather than role/name. Enabled while the field is editable,
          // disabled only when `readOnly` or `fieldDef.admin.readOnly` is true —
          // mirrors `handleRemove`'s own guard
          // (`if (readOnly || fieldDef.admin.readOnly) return;`) exactly (UI-10).
```

**3 — `CollectionLevelPreview` fixture function.** No longer referenced once the collection-level precedence test is removed below; delete it (`FieldLevelPreview` directly above it is unchanged and stays).

**4 — `describe("resolveRelationshipPreview precedence (Decision 11)", ...)` block.** Collapses to a single test proving the field-level override still wins over the default preview — the collection-level branch it used to contrast against no longer exists (ARCH-1). Reuses `relationshipTargetCollection` (already the harness's default target, `useAsTitle: "title"`) instead of building a throwaway collection, so `renderRelationship` doesn't need a `config` override:
```tsx
      describe("resolveRelationshipPreview (ARCH-1)", () => {
        test("field-level admin.components.preview overrides the default text preview", async () => {
          const user = userEvent.setup();
          const fieldDefWithPreview: RelationshipField<CollectionFieldMeta> = {
            ...relationshipFieldFixture.fieldDef,
            admin: {
              ...relationshipFieldFixture.fieldDef.admin,
              components: { preview: FieldLevelPreview },
            },
          };
          await renderRelationship({
            fieldDef: fieldDefWithPreview,
            seedTitles: ["Alpha"],
          });

          await user.click(screen.getByRole("button", { name: /select document/i }));
          expect(await screen.findByText("Field preview: Alpha")).toBeInTheDocument();
          expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
        });
      });
```

Verify: `pnpm --filter @vexcms/react exec vitest run src/components/fields/relationship/Input.test.tsx --coverage.enabled=false`

#### packages/core/src/collections/types.ts
3 edits, everything else unchanged.

**1 — Import.** `ApplyComponent` becomes unused once both `components` properties below are removed; `ComponentHKT` stays (still constrains `TComponent` on every collection-admin generic):
```ts
import type { ComponentHKT } from "../fields";
```

**2 — `AdminCollectionConfigInput` — remove the `components` slot and its doc comment.** `components` held only `preview`, so the whole key goes, along with the JSDoc block that solely documented it:
```ts
export interface AdminCollectionConfigInput<
  TFieldSlug extends string = CoreAdminField,
  TComponent extends ComponentHKT = ComponentHKT,
> {
  /**
   * The field whose value is displayed as the document's human-readable title
   * throughout the admin panel (list rows, breadcrumbs, relation pickers).
   *
   * Accepts any user-defined field slug from this collection, or a built-in
   * Convex system field (`"_id"` | `"_creationTime"`). Setting a user-defined
   * field also auto-generates a database index (`by_<field>`) and a search
   * index (`search_<field>`) for fast admin queries. Omit to fall back to `"_id"`.
   */
  useAsTitle?: CoreAdminField | NoInfer<TFieldSlug>;
  /**
   * A valid Lucide icon name for this collection in the admin sidebar
   * See https://lucide.dev/icons/
   */
  icon?: LucideIconName;
  /**
   * Data table configuration for list view.
   */
  table?: CollectionTableConfigInput;
}
```

**3 — `AdminCollectionConfig` — remove the resolved `components` slot.** Same property, resolved form, no attached doc comment to remove:
```ts
export interface AdminCollectionConfig<
  TFieldSlug extends string = CoreAdminField,
  TComponent extends ComponentHKT = ComponentHKT,
> {
  /** The field used as the document's human-readable title in the admin panel. */
  useAsTitle: CoreAdminField | NoInfer<TFieldSlug>;
  icon?: LucideIconName;
  /**
   * Data table configuration for list view.
   */
  table: CollectionTableConfig;
}
```

Verify: `pnpm --filter @vexcms/core typecheck`

#### packages/core/src/collections/config.ts
1 edit, everything else unchanged.

**1 — `defineCollection`'s resolved `admin` default.** `AdminCollectionConfig` no longer declares `components`, so the `components: {}` default here is now an excess property — `defineCollection` would fail to typecheck without removing it:
```ts
    admin: {
      useAsTitle: "_id",
      ...input.admin,
      table: {
        defaultPageSize: 10,
        serverPageSize: 100,
        pageSizeOptions: [10, 25, 50, 100],
        defaultColumns: [],
        ...input.admin?.table,
        bulkActions: {
          delete: true,
          ...input.admin?.table?.bulkActions,
        },
        defaultSort: {
          field: "_createdAt",
          order: "desc",
          ...input.admin?.table?.defaultSort,
        },
      },
    },
```

Verify: `pnpm --filter @vexcms/core typecheck`

#### packages/core/src/fields/relationship/types.ts
3 edits, everything else unchanged. These doc comments described the field-level override as taking "precedence over the target collection's `admin.components.preview`" — now stale since that collection-level slot no longer exists.

**1 — `RelationshipFieldAdminInput`'s top doc comment.**
```ts
/**
 * Admin configuration input specific to a relationship field instance.
 *
 * Extends {@link FieldAdminConfigInput} with a `components` slot that lets a
 * single field override the preview renderer. This is the only supported
 * location for a relationship preview override (ARCH-1) — target collections
 * do not have their own `admin.components.preview`.
 *
 * @typeParam TCollectionSlug - The target collection slug, inferred from the field's `collection` option.
 * @see {@link RelationshipFieldAdminConfig} for the resolved type after defaults are applied
 * @see {@link FieldAdminConfigInput} for the base admin properties
 */
```

**2 — `RelationshipFieldAdminInput.components`.**
```ts
  /**
   * Custom component overrides specific to this relationship field instance.
   * `preview` is currently the only supported override.
   */
  components?: {
    /**
     * Per-field override for rendering this relationship's docs — the only
     * supported location for a custom preview (ARCH-1: target collections do
     * not support their own `admin.components.preview`). `TCollectionSlug` is
     * the *target* slug (`fieldDef.collection.slug`).
     */
    preview?: ApplyComponent<TComponent, RelationshipPreviewProps<TCollectionSlug>>;
  };
```

**3 — `RelationshipFieldAdminConfig.components`.** Same wording, resolved (non-optional) form:
```ts
  /**
   * Custom component overrides specific to this relationship field instance.
   * `preview` is currently the only supported override.
   */
  components: {
    /**
     * Per-field override for rendering this relationship's docs — the only
     * supported location for a custom preview (ARCH-1: target collections do
     * not support their own `admin.components.preview`). `TCollectionSlug` is
     * the *target* slug (`fieldDef.collection.slug`).
     */
    preview?: ApplyComponent<TComponent, RelationshipPreviewProps<TCollectionSlug>>;
  };
```

Verify: `pnpm --filter @vexcms/core typecheck`

#### apps/docs/src/content/docs/fields/relationship.mdx
2 edits, everything else unchanged.

**1 — Config options table row for `admin.components.preview`.** No longer "wins over" a collection-level default, because that default was removed:
```md
| `admin.components.preview` | Component | — | Per-field override for the relationship preview renderer — the only supported location for a custom preview. |
```

**2 — "Custom preview component" section.** Removes the collection-level example (`admin.components.preview` on a `defineCollection()` call) and explains why only the field-level override is supported — `sanitizeConfigForClient` strips every function from the client-serialized collection config before any client component sees it, so a collection-level override could never resolve to a real component in the browser:
````md
## Custom preview component

By default the picker and list table show the target document's `useAsTitle`
field. Override the renderer via `admin.components.preview` on the
`relationship()` field itself — this is the only supported override location.
A target collection cannot set its own default preview: the admin panel reads
collection configs from `ClientVexConfig`, which `sanitizeConfigForClient`
produces by replacing every function — including component references —
with `null` before the config ever reaches a client component. A
collection-level `admin.components.preview` would therefore always resolve to
`null` in the browser, so the field is the only place a custom preview can
live.

```ts
// Field-level override — only applies to the `author` field on `posts`
const posts = defineCollection({
  slug: "posts",
  fields: {
    author: relationship({
      collection: { slug: "authors" },
      admin: {
        components: { preview: CompactAuthorPreview },
      },
    }),
  },
});
```
````

Verify: `pnpm --filter @vexcms/react exec vitest run src/components/fields/relationship/Input.test.tsx --coverage.enabled=false && pnpm --filter @vexcms/core typecheck`

### Step 9 — array container (LABEL-1, UI-11, UI-12, A11Y-1)

- [ ] [agent] Update `packages/react/src/components/form/FormArray.tsx` — group semantics, max-length guard, drop stray `index` prop

#### packages/react/src/components/form/FormArray.tsx
The array container currently renders `<FormLabel htmlFor={name} ...>` inside a plain `<div>` that has no element with `id={name}` anywhere in it — a `<label>` pointed at nothing (LABEL-1). Per Design Decision 10, it drops `FormLabel` entirely (no natural single control exists to point `htmlFor` at) in favor of `role="group"` on the outer wrapper with `aria-labelledby` pointing at a plain labelled `<span>`, reproducing `FormLabel`'s visual output (numeric index prefix, label text, required asterisk, and its base `Label` classes) without a dangling `<label for>`. A new `atMax` guard disables the Add button and shows a "Maximum N reached" message once the array hits `fieldDef.max.value`, mirroring `FormBlocks`' existing pattern exactly (UI-11). The per-item `<ItemInput>` no longer receives a stray `index` prop it has no contract for (UI-12).

1 edit — the whole file's imports and the `FormArray` function's return JSX change, shown complete; everything else (the throw guards, `getNewItemDefault`) is unchanged.

**1 — imports: `FormLabel` is replaced by `FormDescription`.**
```tsx
"use client";

import {
  type ArrayField,
  type ArrayType,
  type BaseFieldMeta,
  type InputComponentProps,
} from "@vexcms/core";
import type { TypedFieldApi } from "./createFieldInput";
import { useContext } from "react";
import { AppFormContext } from "./AppFormContext";
import { Button } from "../ui/button";
import { Droppable, Draggable, DragHandle } from "../ui/dnd";
import { TrashIcon } from "lucide-react";
import { fieldToInputComponent } from "../fields";
import { FormError } from "./FormError";
import { FormDescription } from "./FormDescription";
```

**2 — `FormArray`'s return JSX.**
```tsx
  return (
    <div
      role="group"
      aria-labelledby={`${name}-label`}
      aria-required={fieldDef.required}
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
            onClick={() => field.pushValue(getNewItemDefault())}
            icon="Plus"
          >
            Add {fieldDef.labels.singular}
          </Button>
          {atMax && (
            <span className="text-xs text-muted-foreground">
              Maximum {fieldDef.max?.value} {fieldDef.labels.plural} reached
            </span>
          )}
        </div>
      </div>
      {items.length > 0 ? (
        <Droppable
          id={name}
          wrapperKey={name}
          onReorder={(from, to) => {
            field.moveValue(from, to);
          }}
        >
          {items.map((_, index) => (
            <Draggable key={index} id={`${name}[${index}]`} index={index}>
              <div className="flex items-center gap-2 px-2">
                <DragHandle disabled={readOnly} />
                <div className="flex-1">
                  <form.Field name={`${name}[${index}]`}>
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
                  disabled={readOnly}
                  onClick={() => field.removeValue(index)}
                  className="text-muted-foreground hover:text-destructive shrink-0 transition-all duration-300"
                  aria-label={`Remove item ${index + 1}`}
                >
                  <TrashIcon className="size-4" />
                </Button>
              </div>
            </Draggable>
          ))}
        </Droppable>
      ) : (
        <p className="text-muted-foreground text-sm">No items yet.</p>
      )}

      <FormError field={field} submissionAttempts={submissionAttempts} />
    </div>
  );
```

**3 — one new local before the `return`: `atMax`, computed alongside the existing `items` local.**
```tsx
  const items = field.state.value ?? [];
  const atMax = !!fieldDef.max && items.length >= fieldDef.max.value;
```

Verify: `pnpm --filter @vexcms/react exec vitest run src/components/fields/array/Input.test.tsx --coverage.enabled=false`

### Step 10 — group container (LABEL-1, UI-9, A11Y-1)

- [ ] [agent] `packages/react/src/components/form/FormGroup.tsx` — drop `FormLabel` for a `role="group"`/`aria-labelledby` label, add `disabled={readOnly}` to `AccordionItem`

#### packages/react/src/components/form/FormGroup.tsx
Same fieldset/legend-equivalent pattern as `FormArray` (Step 9) — `FormLabel`'s `htmlFor={name}` inside the `AccordionTrigger` pointed at nothing (LABEL-1), replaced by `role="group"` + `aria-labelledby` on the `Accordion` root (which forwards arbitrary `<div>` props, confirmed via `AccordionRootProps extends BaseUIComponentProps<'div', AccordionRoot.State>`) and a plain labelled `<span>` reproducing `FormLabel`'s visual output. Separately, `AccordionItem` never forwarded `readOnly` into Base UI's own `disabled` prop, so a read-only group field's trigger stayed keyboard-focusable and toggleable even though every sub-field inside it was disabled (UI-9) — Base UI's `AccordionItemProps` extends `Partial<Pick<useCollapsibleRoot.Parameters, 'disabled'>>` and its internal `useButton` already produces correct `aria-disabled`/`data-disabled` semantics once the prop is passed, so this is a one-line wire-up, not a new implementation.

2 edits, everything else unchanged.

**1 — imports: `FormLabel` is replaced by nothing (removed); `FormDescription`/`FormError` imports are unchanged.**
```tsx
"use client";

import { ComponentPropsWithRef, useContext } from "react";
import type { BaseFieldMeta, GroupField, InputComponentProps } from "@vexcms/core";
import { AppFormContext } from "./AppFormContext";
import { fieldToInputComponent } from "../fields";
import { cn } from "../../styles/utils";
import { TypedFieldApi } from "./createFieldInput";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { FormDescription } from "./FormDescription";
import { FormError } from "./FormError";
import { useAccordionDndState } from "../ui/dnd";
```

**2 — the returned `<Accordion>`/`<AccordionItem>`/`<AccordionTrigger>` JSX.**
```tsx
  return (
    <Accordion
      className={cn("rounded-sm border-2 border-border", className)}
      value={openItems}
      onValueChange={handleValueChange}
      role="group"
      aria-labelledby={`${name}-label`}
      aria-required={fieldDef.required}
    >
      <AccordionItem value={itemValue} disabled={readOnly}>
        {/* Trigger — label + sub-field count */}
        <AccordionTrigger className="flex gap-4 px-3 text-sm font-medium hover:no-underline">
          <div className="flex flex-col self-center">
            <span className="flex items-center gap-2">
              <span
                id={`${name}-label`}
                className="relative flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
              >
                {index !== undefined ? `[${index + 1}] - ` : ""}
                {fieldDef.label || name}
                {fieldDef.required && <span className="text-red-500">*</span>}
              </span>
              <span className="text-muted-foreground text-xs font-normal">
                {subFieldCount} {subFieldCount === 1 ? "field" : "fields"}
              </span>
            </span>
            <FormDescription field={fieldDef} />
          </div>
        </AccordionTrigger>

        {/* Content — all sub-fields */}
        <AccordionContent className="px-3 pt-3">
          <div className="flex flex-col gap-4">
            {subFields.map(([fieldKey, subFieldDef]) => {
              const SubInput = fieldToInputComponent(subFieldDef.type);
              if (!SubInput) return null;
              return (
                <SubInput
                  key={fieldKey}
                  name={`${name}.${fieldKey}`}
                  collection={collection}
                  fieldDef={subFieldDef}
                  readOnly={readOnly || subFieldDef.admin.readOnly}
                />
              );
            })}
          </div>
        </AccordionContent>
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </AccordionItem>
    </Accordion>
  );
```

Verify: `pnpm --filter @vexcms/react exec vitest run src/components/fields/group/Input.test.tsx --coverage.enabled=false`

### Step 11 — blocks container (LABEL-1, UI-9, A11Y-1)

- [ ] [agent] Edit `packages/react/src/components/form/FormBlocks.tsx` — add `disabled={readOnly}` to the block's `AccordionItem`
- [ ] [agent] Edit `packages/react/src/components/fields/blocks/Input.tsx` — replace the dangling `FormLabel htmlFor` with a `role="group"`/`aria-labelledby` wrapper and a plain label span (LABEL-1 + A11Y-1)

#### packages/react/src/components/form/FormBlocks.tsx
1 edit, everything else unchanged.

**1 — The `<AccordionItem value={itemKey} className={cn(...)}>` element inside the `items.map(...)` render.** Base UI's `Accordion.Item` forwards `disabled` straight into its internal `useButton`, which already produces the correct `data-disabled`/`aria-disabled` wiring on the trigger button — the same mechanism used for `FormGroup`'s accordion in Step 10 — so a read-only blocks field now visibly and semantically disables collapsing.
```tsx
                  <AccordionItem
                    value={itemKey}
                    disabled={readOnly}
                    className={cn(
                      "rounded-sm border-t border-r-2 border-l-2 border-border bg-background overflow-hidden",
                      index === 0 && "border-t-2",
                      index === items.length - 1 && "border-b-2",
                    )}
                  >
```

#### packages/react/src/components/fields/blocks/Input.tsx
2 edits, everything else unchanged.

**1 — The `FormLabel` import.** Blocks has no single focusable container-level control for `FormLabel`'s `htmlFor={name}` to point at (`FormBlocks` renders a list of `AccordionItem`s, not one input), so the dangling `<label htmlFor>` is dropped in favor of a `role="group"` wrapper with a plain label span, matching the pattern used for `FormArray`/`FormGroup` in Steps 9–10. `FormLabel` becomes unused and its import is removed.
```tsx
import type { BlocksField, GenericBlock } from "@vexcms/core";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormError } from "../../form/FormError";
import { FormBlocks } from "../../form/FormBlocks";
import { parseAsString, useQueryState } from "nuqs";
import { MODALS } from "../../modals";
```

**2 — The outer `<div className="flex flex-col gap-1.5">` wrapper and the `<FormLabel field={fieldDef} name={name} />` line in the returned JSX.** The wrapper becomes an ARIA group whose label is `aria-labelledby`-referenced by id, with `aria-required` set directly on the group (there is no single native control to carry it), and the visible label text is a plain `<span>` reproducing `FormLabel`'s classes instead of rendering an unusable `<label htmlFor>`.
```tsx
      <div
        className="flex flex-col gap-1.5"
        role="group"
        aria-labelledby={`${name}-label`}
        aria-required={fieldDef.required}
      >
        <span
          id={`${name}-label`}
          className="relative flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          {fieldDef.label || name}
          {fieldDef.required && <span className="text-red-500">*</span>}
        </span>
```

Verify: `pnpm --filter @vexcms/react exec vitest run src/components/fields/blocks/Input.test.tsx --coverage.enabled=false`

### Step 12 — text/url/color A11Y-1 sweep

- [ ] [agent] Edit `packages/react/src/components/fields/text/Input.tsx` — add `aria-required={fieldDef.required}` to `<Input>`
- [ ] [agent] Edit `packages/react/src/components/fields/url/Input.tsx` — add `aria-required={fieldDef.required}` to `<Input>`
- [ ] [agent] Edit `packages/react/src/components/fields/color/Input.tsx` — add `aria-required={fieldDef.required}` to the value `<Input>`

#### packages/react/src/components/fields/text/Input.tsx
1 edit, everything else unchanged.

**1 — the `<Input>` element inside `TextFieldInput`.**
```tsx
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
```

#### packages/react/src/components/fields/url/Input.tsx
1 edit, everything else unchanged.

**1 — the `<Input>` element inside `UrlFieldInput`.**
```tsx
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
```

#### packages/react/src/components/fields/color/Input.tsx
1 edit, everything else unchanged.

**1 — the value `<Input>` element inside `ColorFieldInput` (the one bound to `field`, with `id={name}` — not the theme-token search `<Input>` inside the popover, which has no `field` binding).**
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
/>
```

Verify: `pnpm --filter @vexcms/react exec vitest run src/components/fields/text/Input.test.tsx src/components/fields/url/Input.test.tsx src/components/fields/color/Input.test.tsx --coverage.enabled=false`

### Step 13 — Full-suite verification

- [ ] [agent] Run every command below in order; fix any surfacing regression before considering the spec done.

Every prior step verified its own file(s) in isolation; this step proves the aggregate — `packages/react`'s full suite, the published-subpath consumers (`apps/test`, `apps/www`), and `packages/core`'s regression suite all green, plus `node scripts/record-test-findings.mjs` per field type shows `findings.md` shrinking toward zero as directed in the original handoff.

Verify:
```bash
pnpm --filter @vexcms/react test
pnpm --filter test exec vitest run src/vexcms/admin.test.ts --coverage.enabled=false
pnpm --filter www test
pnpm --filter @vexcms/core test
pnpm test
```

## Verification

Run, in order, after every step above lands:
1. `pnpm --filter @vexcms/core exec vitest run src/fields --coverage.enabled=false && pnpm --filter @vexcms/core typecheck` — Step 1.
2. `pnpm --filter @vexcms/react typecheck` — Steps 2–12 compile cleanly against the widened `AnyFormApi` and the new `FormLabel`/`fieldInputContract.ts` contract.
3. `pnpm --filter @vexcms/react test` — the full `packages/react` suite (819 tests, target: 0 failing, down from 353).
4. `pnpm --filter test exec vitest run src/vexcms/admin.test.ts --coverage.enabled=false` — `apps/test`'s consumption of `@vexcms/next/testing`'s published subpath (711 tests, target: 0 failing, down from 326).
5. `pnpm --filter www test` — `apps/www`'s smoke wiring (27 tests, target: 0 failing, down from 6).
6. `pnpm --filter @vexcms/core test` — regression check, must stay at 0 failing (924 tests, untouched by this work except Step 1's own additions).
7. `pnpm test` — whole-monorepo gate.
8. `harness doctor` — 0 errors.
