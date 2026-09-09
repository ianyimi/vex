# `@vexcms/react` Test Suite — Bug Report

> **Purpose.** Triaged, root-caused output of the `2026-09-04-react-test-suite` spec
> (all 16 task groups, 49/49 steps complete). Written to be fed straight into `/dev-spec`
> to produce a **fix** spec.
>
> Raw machine output: `findings.md` (generated, 353 rows). This file is the analysis.
>
> **Read `P1` → `P3`.** Two root causes — `LABEL-1` and `CORE-1` — account for **225 of
> the 353 rows**. Fixing those two is most of the value in this report.

## Final numbers

| Surface | Tests | Failing | Notes |
|---|---|---|---|
| `packages/react` field suites (12 types) | 819 | 353 | The defect list below |
| `apps/test` via `@vexcms/next/testing` | 711 | 326 | Same defects, seen through the published subpath |
| `apps/www` via `@vexcms/next/testing` | 27 | 6 | `includeCore: false` smoke wiring |
| `packages/core` (regression check) | 924 | **0** | Untouched |

Green at close: `@vexcms/react` build + typecheck · `@vexcms/next` build + typecheck ·
`apps/test` + `apps/www` typecheck · `harness doctor` 0 errors.

Coverage baseline before this work: **16.84% statements / 10.7% branches**. Post-suite
coverage is only measurable on a green run (vitest suppresses the summary when tests fail),
so it becomes available once these defects are fixed.

### Failure distribution

| Count | Class | Finding |
|---|---|---|
| 185 | `Found a label ... however no form control was found` | **LABEL-1** |
| 40 | `schema ACCEPTS its own invalid fixture value` (text 20, date 20) | **CORE-1** |
| 18 | axe violations | **A11Y-3** |
| 11 | `expect(element).toBeDisabled()` | **UI-9** |
| 11 | `expected false to be true` (required for AT) | **A11Y-1** |
| 8 | `Unable to find a label with the text` | **LABEL-1** |
| 8 | `Unable to find an element with the text: Invalid…` | **UI-6** |
| 5 | `Unable to find an accessible element with role "checkbox"` | **A11Y-2** |
| ~67 | long-tail per-type assertions | see P3 |

## Severity key

- **P1** — silent data/validation correctness, or a control a user cannot operate.
- **P2** — accessibility defect. Works with a mouse, fails with assistive tech.
- **P3** — inconsistency, dead code, or a decision to make.

---

## P1 — Correctness

### LABEL-1 — Six field types render a label bound to no control

**185 + 8 = 193 rows. The single largest defect in the codebase.**

`FormLabel` renders `<label for="{name}">`, but these field types never put `id={name}` on
any element they render. RTL states it exactly: `"Found a label with the text of: Status,
however no form element with the id ... was found"`.

User-visible consequences:
- **Clicking the label does nothing** — there is no associated control to focus.
- **Screen readers announce an orphaned label** and a separate unnamed control.
- Every contract assertion that must first locate the control fails as collateral, which
  is why one defect produces ~193 rows.

| Field | Specific cause |
|---|---|
| `select` | The combobox trigger `<button>` takes a Base-UI-generated id (`base-ui-_r_5_`) and carries only `name="testField"` |
| `date` | `Input.tsx` passes no `id` to `<DateTimePicker>`, **and `DateTimePicker` has no `id`/`aria-labelledby` prop at all** — currently unwireable from outside |
| `upload` | Neither `EmptyInput`'s `<input type="file">` nor `FilledInput`'s rows set it; axe independently flags "Form elements must have labels" |
| `array` / `group` / `blocks` | The container's own top-level `FormLabel` sets `htmlFor={name}` while only nested per-item controls carry ids (`testField[0]`) |

**Files:** `packages/react/src/components/fields/{select,date,upload,array,group,blocks}/Input.tsx`,
`packages/react/src/components/form/{FormArray,FormGroup,FormBlocks}.tsx`,
`packages/react/src/components/ui/datetime/date-picker.tsx` (needs an `id` prop first),
`packages/react/src/components/ui/multi-select.tsx`.

**Direction.** Thread `id={name}` to the focusable control in each type. `date` is the
largest — `DateTimePicker` must accept and forward `id` before its field can be wired. For
the three containers, decide what the container-level label should point at (likely the
Add button or the first item's control) — a container has no single input, so this is a
design decision, not a mechanical fix. Worth enforcing centrally afterwards: a field
rendering a `FormLabel` with no matching control id should fail loudly.

### CORE-1 — `required: true` is unenforceable on five field types

**40 rows.** A `@vexcms/core` defect; the React inputs are innocent. A field declared
`required: true` accepts a missing value at the schema level, so nothing prevents saving an
empty required field.

Verified by executing the real schemas, not inferred:

```
text({ required: true })                      -> ACCEPTS undefined
text({ required: true, min: { value: 3 } })   -> ACCEPTS undefined
text({ required: true, max: { value: 10 } })  -> ACCEPTS undefined
number({ required: true, min: 0, max: 100 })  -> ACCEPTS undefined, coerced to 0
checkbox({ required: true })                  -> ACCEPTS undefined, coerced to false
date({ required: true })                      -> ACCEPTS undefined
```

Also confirmed for `relationship` and `group` (5 rows each) — **seven of twelve field
types**. The remaining five are untested for this specific property; audit them.

Two distinct root causes:

1. **Unconditional `.default(field.defaultValue)`** at the end of *every* branch in
   `number/inputSchema.ts`, `checkbox/inputSchema.ts` (and others). Unlike
   `applyBaseInputSchemaMeta`'s `.optional()`, it is never gated behind `!field.required`,
   so a missing value is replaced by the default and validated as *that*. For `checkbox`
   this means **no value of any kind can fail** — `true`, `false`, `undefined` all pass.
2. **Sibling `if (field.min)` / `else if (field.max)` blocks reassigning the schema
   unconditionally** in `text/inputSchema.ts`, discarding the `required` branch that ran
   first. Measured: `required`+`min` reports the min message; `required`+`max` **passes
   entirely** (the required check is dropped, not just its message); `required` alone still
   accepts `undefined`.

**Files:** `packages/core/src/fields/*/inputSchema.ts`,
`packages/core/src/fields/inputSchemas/utils.ts`.

**Direction.** Settle the contract first (see Open Questions #1) — is `required` an
input-schema concern at all, or the Convex validator's job? Then gate `.default()` behind
`!field.required` and *compose* min/max refinements onto the required-aware base rather
than reassigning over it. One ADR covering all twelve types, not five patches.

### CORE-2 — `url` reports "Invalid URL" instead of "This field is required."

An empty required `url` shows the wrong error. The required branch is
`z.url().min(1, "This field is required.")`; the format check runs **before** the length
check and `new URL("")` throws, so `issues[0]` — the only issue `FormError` shows — is
always `"Invalid URL"`.

**File:** `packages/core/src/fields/url/inputSchema.ts`.

*Verified as intended while testing (pin before changing):* `z.url()` trims whitespace;
imposes **no** protocol restriction (`mailto:`/`ftp://` pass); requires an absolute URL.

### CORE-3 — `date` ignores `min`/`max` at both layers

`dateFieldToInputSchema` builds a bare `z.number()` and never reads `field.min`/`field.max`,
so out-of-range timestamps validate. `Input.tsx` also never forwards those bounds to
`<DateTimePicker>`, so the calendar doesn't disable out-of-range days. `min`/`max` on a date
field is **inert config** — unenforced in the UI and at submit.

**Files:** `packages/core/src/fields/date/inputSchema.ts`,
`packages/react/src/components/fields/date/Input.tsx`.

### UI-5 — `date`'s Clear button cannot clear the field

`Input.tsx` guards its handler with `if (date) { … }`, swallowing the picker's
`onChange(undefined)`. The field never empties and the placeholder never returns — a
visible, dead control.

**File:** `packages/react/src/components/fields/date/Input.tsx`.

### UI-7 — `upload`'s readOnly branch is dead code

`if (readOnly) { <>…</>; }` builds the "—" placeholder JSX but never `return`s it, so
execution falls through to the fully interactive dropzone. **A read-only upload field is
still editable.**

**File:** `packages/react/src/components/fields/upload/Input.tsx`.

### UI-10 — `relationship`'s chip remove button is disabled exactly when it should work

`disabled={!readOnly || fieldDef.admin.readOnly}` is inverted relative to `handleRemove`'s
own guard (`if (readOnly || fieldDef.admin.readOnly) return;`). In an editable render the
remove button is disabled; the only state where it enables is one where the handler
refuses to act. **Selected relationships cannot be removed via the chip.**

**File:** `packages/react/src/components/fields/relationship/Input.tsx`.

### ARCH-1 — Collection-level custom relationship previews can never render

`sanitizeConfigForClient` (called unconditionally by `NextAdminLayout`/`NextAdminPage`
before any `ClientVexConfig` reaches a client component) strips all functions and React
components — including `admin.components.preview` — from every entry in
`config.collections`. `RelationshipFieldInput` resolves `targetCollection` from
`useVexConfig()`, i.e. the already-sanitized config, so
`resolveRelationshipPreview`'s collection-level precedence branch is **unreachable in
production**. The field-level preview path works only because `fieldDef` arrives as a prop,
bypassing sanitization.

A documented feature that cannot work. **Files:** `packages/core` (sanitizer),
`packages/react/src/components/fields/relationship/preview.tsx`.
**Direction.** Either thread the unsanitized component slot to the client another way, or
remove the collection-level precedence branch and document field-level as the only
supported location.

### PKG-1 — `<AppForm>` cannot accept a form carrying validators

`AppForm`'s `form` prop is `AnyFormApi`, whose validator generic slots default to
`undefined`. A form with an `onSubmit` validator instantiates them as `unknown` and is not
assignable — and neither is a bare `AnyFormApi`, because those narrow defaults don't satisfy
the instantiation `AppForm` infers. This is the **`AP-006` pattern** exactly.

Every pre-existing test passed a validator-less form, which is why it never surfaced. Any
consumer wiring real validation into `<AppForm>` hits it immediately.

**Worked around** in three places with a documented `AppFormBoundary` cast
(`testing/fieldInputContract.ts`, `testing/nestedFieldContainer.ts`,
`testing/rbacState.test.ts`) — **delete those casts when this is fixed.**
**Direction.** Default the validator parameters to their full bound and pin with a
concrete→bare assignability test (the documented AP-006 remedy).

---

## P2 — Accessibility

### A11Y-1 — No field type marks its control as required for assistive tech

**11 rows.** Not one field forwards `required` or `aria-required`. A screen-reader user
cannot distinguish a required field; the visual asterisk is the only signal.

**Direction.** Forward `aria-required={fieldDef.required}` once from the shared
`createFieldInput` wrapper — the prop is already in scope there — rather than in 12 files.

### A11Y-2 — `checkbox`'s control is not findable by its own label

**5 rows.** `getByRole("checkbox", { name: fieldDef.label })` finds nothing. Base UI's
`Checkbox.Root` puts `role="checkbox"` on the visible element while `FormLabel`'s `htmlFor`
targets the visually-hidden native input, so the role-bearing element has no accessible
name. Corroborated by A11Y-3 (checkbox is one of the components with real axe violations).

**Files:** `fields/checkbox/Input.tsx`, `ui/checkbox.tsx`.

### A11Y-3 — 18 real axe violations across rendered field states

Surfaced with `color-contrast`/`target-size`/`region` already disabled (jsdom cannot
evaluate those), so these are **structural**, not false positives. Concentrated in
`checkbox`, `select` and `upload`.

### A11Y-4 — `select`'s remove-value badges have no accessible name

axe `button-name`. The per-value remove ("×") buttons in `MultiSelectValue` expose no name,
so a screen-reader user cannot tell what any of them removes. Fires in default, read-only
and error states.

**File:** `ui/multi-select.tsx`. **Direction.** `aria-label={`Remove ${option.label}`}`.

### UI-9 — Accordion triggers signal disabled only via `aria-disabled`

**11 rows.** Base UI's Accordion trigger (used by `FormGroup`/`FormBlocks` for
collapse/expand) sets `aria-disabled` but not the native `disabled` property when
`readOnly` cascades. It is functionally inert but not programmatically disabled — the same
shape of gap as the `DragHandle` case. Assistive tech and native form semantics disagree.

---

## P3 — Inconsistency, dead config, decisions

- **UI-1 — description paragraph stays visible when unset.** `FormDescription` should hide
  when `fieldDef.description` is absent; the paragraph remains visible and occupies layout.
  Also note it reads `field.description` (top-level `BaseField`), **not**
  `field.admin.description` where every other presentational flag lives.
- **UI-2 — `number` silently converts a cleared field to `0`.** `Number("") === 0`, and the
  input renders `0` rather than blank for `undefined`. With CORE-1 this means clearing a
  required numeric field saves a valid-looking `0`. Fix alongside CORE-1 or the empty value
  is just defaulted back.
- **UI-3 — `checkbox` hides the required asterisk** via `hideRequired`, so required-ness is
  invisible on it both visually and (per A11Y-1) to assistive tech, while every other field
  shows it.
- **UI-4 — `number` doesn't forward `min`/`max` to the DOM**, so there is no native
  affordance and nothing constrains input until submit. Decide and document.
- **UI-6 — `upload` never renders `FormDescription` or `FormError`** (8 rows). Zero
  references in `upload/{Input,EmptyInput,FilledInput}.tsx`: `description` is dropped and
  **validation errors are never shown to the user at all**. It also doesn't forward its
  `index` prop to `FormLabel`, so nested labels lose the `[N] - ` prefix.
- **UI-8 — `upload`'s drag-and-drop ignores `accept`.** `handleDrop` never checks
  `file.type`; only the OS picker filters. Drag-and-drop stages any file.
- **UI-11 — `FormArray` has no `atMax` guard** on its Add button, unlike `FormBlocks`. You
  can add past `max`.
- **UI-12 — `FormArray` always passes `index` to item inputs**, so an item's accessible
  name is `[1] - Tag` rather than `Tag`. Deliberate or not, it makes items unfindable by
  their own label.
- **UI-13 — `relationship`'s debounced search is not atomic.** After the 200ms debounce
  fires, stale rows clear and the picker shows "Loading…" before the new match appears,
  rather than converging directly.

---

## Not defects — harness bugs found and fixed during implementation

Recorded so a fix spec doesn't chase them, and so the traps are recognisable later. Each
was masquerading as a product defect.

| Symptom | Real cause | Fix |
|---|---|---|
| 10 × `Invalid Chai property: toHaveValue` | jest-dom never registered; pre-existing tests only used `textContent` | `import "@testing-library/jest-dom/vitest"` in `testing/setup.ts` + `setupFiles` |
| 15 × `Found multiple elements: Brand Color` | `getByLabelText(label, { exact: false })` substring-matched the field label *and* `color`'s swatch (`aria-label="Pick a colour for Brand Color"`) | Exported `getControl(container, label)` querying the id the factory assigns |
| Description assert hit the wrong node | Bare `.text-muted-foreground` also matched `select`'s badge svgs | Qualified to `p.text-muted-foreground` |
| `date` calendar queries found nothing | `DateTimePicker`'s popover portals into `document.body`, outside RTL's `container` | Scoped those queries to `document.body` |
| `upload` two-render tests cross-contaminated | RTL's `screen.*` binds to `document.body`, so render #1 leaked into render #2 | `cleanup()` between renders |
| 208 × `nuqs requires an adapter` | `blocks` reads `useQueryState`; the shared mount had no adapter | `NuqsTestingAdapter` in the shared `renderField` |
| 78 × `Media collection "images" not found` | `upload` resolves its target from `useVexConfig()`; only the *nested* factory provided it | Stub `ClientVexConfig` in the shared `renderField` |
| 52 × `No QueryClient set` | `upload`/`relationship` fetch via TanStack Query + Convex | `QueryClientProvider` + `ConvexProvider` in the shared `renderField` |
| `Verify: pnpm --filter <pkg> test -- <pattern>` ran the FULL suite | pnpm doesn't forward the positional pattern to vitest; steps 2/3/10 were silently whole-suite runs that passed only while everything was green | Rewritten to `exec vitest run <file>` |
| `convexTest(schema)` threw `import.meta.glob is not a function` | A Vite build-time macro that stays literal inside convex-test's prebuilt `dist`; core's own suite always passes an explicit modules map | Added `testModules` to `testing/convex/schema.ts` |
| A `.test.ts` containing JSX failed to transform | esbuild's `.ts` loader rejects JSX | JSX test files are `.tsx` |

### Two packaging defects found and fixed in production config

Both are real and were introduced/exposed during this work — they are **already fixed**,
but a fix spec should know the reasoning so nobody reverts them.

1. **`.` and `./testing` were separate tsup bundles, so each evaluated its own
   `createContext`.** A consumer importing `TextFieldInput` from `.` and `AppForm` from
   `./testing` got two distinct `AppFormContext` instances, and every mounted component
   threw "must be rendered inside `<AppForm>`" — measured 26/27 failures in `apps/www`.
   **Fixed** by folding to one tsup config with `splitting: true`, emitting a shared chunk.
   `"use client"` now stamps the testing bundle too, which is inert in a vitest process.
   *Do not split these back into two configs.*
2. **A circular import between `components/fields/index.tsx` and `components/form/index.ts`.**
   `FormArray`/`FormGroup`/`FormBlocks` import `fieldToInputComponent` from `../fields`,
   while every field's `Input.tsx` imported `createFieldInput` from the `../../form`
   *barrel*. Latent under separate bundles; under shared-chunk splitting esbuild resolved
   it in the wrong order, `fieldToInputComponent("text")` returned `undefined`, and suite
   collection crashed with **zero tests collected**. **Fixed** by pointing all 14 field
   files at leaf modules (`../../form/createFieldInput`, `../../form/FormLabel`, …) instead
   of the barrel. Import paths only, zero behavior change. *The cycle is real — do not
   reintroduce barrel imports inside `fields/`.*

**Standing rule:** a failure whose message is about the *test framework* rather than the
component is a harness bug. Fix it in the suite; never record it as a product defect.

---

## Open questions a fix spec must answer

1. **Is `required` an input-schema concern at all,** or is the Convex validator the sole
   enforcement layer? CORE-1's entire fix shape depends on this. One ADR.
2. **Should `.default(defaultValue)` survive on a required field?** It is what makes
   required unenforceable, but removing it changes what every create-form submits.
3. **What should a container's (`array`/`group`/`blocks`) top-level label point at?** There
   is no single input; LABEL-1 needs a design answer for these three, not a mechanical fix.
4. **Is `field.description` vs `field.admin.description` deliberate** (UI-1)?
5. **Should `checkbox` keep `hideRequired`** (UI-3)?
6. **Do the remaining five field types share CORE-1's patterns?** Seven of twelve are
   confirmed; the audit is part of the fix.
7. **Is `ARCH-1` fixable, or should collection-level relationship previews be removed** from
   the documented API?

---

## Reproducing any of this

```bash
# One field type, with findings recorded
node scripts/record-test-findings.mjs packages/react/src/components/fields/select/Input.test.tsx

# Whole kit from a consumer's perspective (the published subpath)
pnpm --filter test exec vitest run src/vexcms/admin.test.ts --coverage.enabled=false

# One field in isolation
pnpm --filter @vexcms/react exec vitest run src/components/fields/date/Input.test.tsx --coverage.enabled=false
```

`scripts/record-test-findings.mjs` exits **0** when tests ran (appending failures to
`findings.md`) and non-zero **only** when a file cannot collect or yields zero tests — so a
fix spec's implementation loop will not halt on the defects it is fixing.
