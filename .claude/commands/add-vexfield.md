# New Field — Align a Copied Field Directory

After copying an existing field's directory, update all stale references and verify full feature parity. Fixes docs, tests, and naming automatically. Warns about missing implementations and logic bugs.

## Usage

```
/new-field <NewField> [copied from <SourceField>]
```

**Examples:**
- `/new-field number copied from text`
- `/new-field checkbox`
- `/new-field date copied from number`

If "copied from" is omitted, infer the source by looking at what names/strings are stale in the files.

---

## Instructions

### Step 0 — Discover all files

Before touching anything, enumerate every file that exists in both the source and new field directories:

```
packages/core/src/fields/<sourceField>/      ← list every file
packages/core/src/fields/<newField>/         ← list every file
packages/react/src/components/fields/<sourceField>/   ← list every file (may not exist)
packages/react/src/components/fields/<newField>/      ← list every file (may not exist)
```

Also read these shared files to understand current registration state:
- `packages/core/src/fields/constants.ts` — `ADMIN_FIELDS` registry
- `packages/core/src/fields/index.ts` — core package barrel export (re-exports every field directory)
- `packages/core/src/fields/types.ts` — `AdminField` union
- `packages/core/src/fields/validators/index.ts` — `adminFieldToValidator` dispatch switch
- `packages/core/src/fields/inputSchemas/index.ts` — `adminFieldToInputSchema` dispatch switch
- `packages/react/src/components/fields/index.tsx` — `fieldInputComponents` map and barrel exports
- `packages/react/src/adapter.ts` — `reactAdapter.fields` map

Read every file you just enumerated. Do not skip any file.

### Step 1 — Gather spec context

Check if a dev spec exists for the new field:
- Look for any plan files referencing the field name
- Look in `.claude/` for any active spec

If a spec exists, read it now. The spec governs what the field *should* do — it takes precedence over what was copied from the source.

If no spec exists, infer semantics from the field name and `ADMIN_FIELDS` entry (type string, validator, defaultValue). Document your inferences before proceeding so the user can correct them.

### Step 2 — Feature parity audit

For every file the source field has, check whether the new field has an equivalent. Build two lists:

**Present but may need updating** — files that exist in the new field directory (copied or written). These get fixed in Steps 3–5.

**Missing entirely** — files that exist in the source field but are absent in the new field. These are flagged to the user as "not yet implemented." Do not create them speculatively.

Use this checklist per package:

**Core** (`packages/core/src/fields/<newField>/`):
- [ ] `config.ts` — factory function `<newField>()`
- [ ] `types.ts` — `<NewField>FieldInput` and `<NewField>Field` interfaces
- [ ] `inputSchema.ts` — `<newField>FieldToInputSchema()` function
- [ ] `validator.ts` — `<newField>FieldToValidator()` function
- [ ] `index.ts` — re-exports config, types, validator, inputSchema
- [ ] `inputSchema.test.ts` — tests covering required, optional, min, max, custom errors, metadata
- [ ] `validator.test.ts` — tests covering required, optional, constraints ignored

**Core registration**:
- [ ] `constants.ts` — `ADMIN_FIELDS.<newField>` entry with correct `type`, `validator`, `defaultValue`
- [ ] `fields/index.ts` — barrel export `export * from "./<newField>"` present
- [ ] `types.ts` (fields root) — `<NewField>Field` included in `AdminField` union
- [ ] `validators/index.ts` — `adminFieldToValidator` switch has a `case ADMIN_FIELDS.<newField>.type:` branch calling `<newField>FieldToValidator`
- [ ] `inputSchemas/index.ts` — `adminFieldToInputSchema` switch has a `case ADMIN_FIELDS.<newField>.type:` branch calling `<newField>FieldToInputSchema`

**React** (`packages/react/src/components/fields/<newField>/`):
- [ ] `Cell.tsx` — `<NewField>FieldCell` component
- [ ] `Input.tsx` — `<NewField>FieldInput` component
- [ ] `columnDef.tsx` — `<newField>FieldToColumnDef()` function
- [ ] `index.ts` — re-exports Cell, Input, and columnDef

**React registration**:
- [ ] `fields/index.tsx` — `fieldInputComponents` map includes `[ADMIN_FIELDS.<newField>.type]: <NewField>FieldInput as ComponentType<InputComponentProps<AdminField>>`
- [ ] `fields/index.tsx` — barrel export `export * from "./<newField>"`
- [ ] `adapter.ts` — `reactAdapter.fields.<newField>` has `input: <NewField>FieldInput` and `cell: <NewField>FieldCell`

Report the missing items to the user at the end as warnings (see Step 6). Do not block on them — continue fixing what is present.

### Step 3 — Fix naming and types (all present files)

For every file that exists in the new field directory, replace all stale source-field references. Work one file at a time: read → identify all issues → single edit.

**In every file**, replace:
- Any occurrence of `<sourceField>` (camelCase function name) → `<newField>`
- Any occurrence of `<SourceField>` (PascalCase type/component name) → `<NewField>`
- Any occurrence of `<SourceField>Field` type → `<NewField>Field`
- Any occurrence of `<SourceField>FieldInput` type → `<NewField>FieldInput`
- Any occurrence of `<sourceField>FieldToInputSchema` → `<newField>FieldToInputSchema`
- Any occurrence of `<sourceField>FieldToValidator` → `<newField>FieldToValidator`
- Any occurrence of `<sourceField>FieldToColumnDef` → `<newField>FieldToColumnDef`
- Any occurrence of `<SourceField>FieldCell` → `<NewField>FieldCell`
- Any occurrence of `<SourceField>FieldInput` (component) → `<NewField>FieldInput`
- `ADMIN_FIELDS.<sourceField>` → `ADMIN_FIELDS.<newField>` (in config, validator — everywhere it appears)

### Step 4 — Logic audit (per file)

After fixing names, audit the actual implementation logic in each file. Do not assume the copy-paste was semantically correct — check every logic decision against the new field's data type.

#### `config.ts` — logic checks
- The `type` property references `ADMIN_FIELDS.<newField>.type` (not the source field's type)
- The `defaultValue` references `ADMIN_FIELDS.<newField>.defaultValue` and matches the field's data type
- The optional properties spread at the bottom only include properties the new field actually supports — remove any the source field has but the new field doesn't (e.g. `searchIndex` if the spec says this field type doesn't support it)
- The `admin` spread includes `placeholder` only if the field type uses placeholder text in the UI

#### `types.ts` — logic checks
- `defaultValue` type in `<NewField>FieldInput` matches the field's actual JS type (e.g. `number`, `boolean`, `string`)
- `defaultValue` type in `<NewField>Field` is non-optional and matches the field's JS type
- The `readonly type` in `<NewField>Field` points to `ADMIN_FIELDS.<newField>.type`
- `min`/`max` property JSDoc accurately describes what is being constrained — "character length" is wrong for number/date fields; "numeric value" is wrong for string fields
- Any type-specific properties (e.g. `precision` for a decimal field, `format` for a date field) exist per the spec

#### `inputSchema.ts` — logic checks (highest risk of logic bugs)
- The Zod base type matches the field's data type: `z.string()` for text, `z.number()` for number, `z.boolean()` for checkbox, etc.
- **Required check**: `z.string().min(1)` is correct for strings (empty string = invalid required). But for number fields, `z.number().min(1)` is WRONG — it rejects 0, which is a valid required number. For number fields, required-ness must be handled entirely by `applyBaseInputSchemaMeta`, not by a `.min()` call on the schema. For boolean fields, there is no "required" analog — every boolean has a value. Check the required handling is appropriate for the actual type.
- Error messages for `min`/`max` failures are semantically correct:
  - String fields: "too short" / "too long"
  - Number fields: "too small" / "too large"
  - Date fields: "too early" / "too late"
- The `min`/`max` constraint logic correctly applies `.min()` and `.max()` to the right Zod type
- `applyBaseInputSchemaMeta` is still called and receives the correct `field` and `inputSchema`

#### `validator.ts` — logic checks
- `ADMIN_FIELDS.<newField>.validator` is the correct validator string for this field type
- No hardcoded validator strings from the source field remain

#### `fields/index.ts` (core barrel) — logic checks
- A `export * from "./<newField>"` line is present
- It sits alongside the other field barrel exports (text, number, etc.) — not mixed in with the utility exports at the top

#### `validators/index.ts` — logic checks (shared dispatch)
- A `case ADMIN_FIELDS.<newField>.type:` branch exists in the `adminFieldToValidator` switch
- It calls `<newField>FieldToValidator({ field: props.field })` and returns the result
- The import for `<newField>FieldToValidator` is present at the top of the file
- The `@see` JSDoc links include the new validator function

#### `inputSchemas/index.ts` — logic checks (shared dispatch)
- A `case ADMIN_FIELDS.<newField>.type:` branch exists in the `adminFieldToInputSchema` switch
- It calls `<newField>FieldToInputSchema({ field: props.field })` and returns the result
- The import for `<newField>FieldToInputSchema` is present at the top of the file
- The `default:` branch still throws — do not remove it

#### `inputSchema.test.ts` — logic checks
- The "required" test verifies that the schema rejects the correct values. For numbers, a required schema should accept `0` (not reject it). For strings, a required schema should reject `""`.
- The "optional with default" test uses the correct default value for the type (e.g. `0` for number, `false` for boolean, not `""`)
- `safeParse(...)` calls in min/max tests use values of the correct type — numeric values for number fields, strings for text fields
- The "ignores constraints" validator test uses the correct expected validator string
- Tests that check for specific schema behavior (`.min(1)` for required) should be removed or rewritten if they don't apply to this field type

#### `Cell.tsx` — logic checks (React)
- The component receives `CellComponentProps<<NewField>Field>` — typed to the correct field type
- The rendering logic is appropriate for the value type:
  - String values: truncation at N chars is reasonable
  - Numeric values: no character truncation; may format with `toLocaleString()` or similar
  - Boolean values: render a checkmark/icon or "Yes"/"No", not the raw string
  - Date values: render a formatted date string, not a raw timestamp
- The null/undefined fallback (em-dash `—` or similar) is still present
- No logic remains that makes sense only for the source field type (e.g. `props.value.length > 80` check on a number cell)

#### `Input.tsx` — logic checks (React)
- `createFieldInput` generics use the correct value type: `createFieldInput<number, NumberField>`, not `createFieldInput<string, NumberField>`
- The `<input>` element's `type` attribute matches the field: `type="number"` for numbers, `type="checkbox"` for booleans, `type="text"` for strings
- `field.state.value ?? <default>` uses the correct default for the type (`?? 0` for numbers, `?? false` for booleans, `?? ""` for strings)
- The `onChange` handler converts the raw input value to the correct JS type:
  - Number: `field.handleChange(Number(e.target.value))` or `parseFloat`
  - Boolean: `field.handleChange(e.target.checked)`
  - String: `field.handleChange(e.target.value)`
- `placeholder` is only rendered if the field type actually has a `placeholder` property in its admin config

#### `columnDef.tsx` — logic checks (React)
- `ColumnDef<VexDocument, <ValueType>>` uses the correct value type generic
- `row.getValue(...)` is cast to the correct type (`as number | undefined`, not `as string | undefined`)
- The `value ?? <default>` fallback matches the field's default type
- The cell renders the correct component: `<NewField>FieldCell`, not `<SourceField>FieldCell`

#### `<newField>/index.ts` — logic checks (React field barrel)
- Exports `Cell.tsx`, `Input.tsx`, AND `columnDef.tsx` — all three: `export * from "./Cell"`, `export * from "./Input"`, `export * from "./columnDef"`
- Missing any of these three silently breaks consumers that import the column def from the package barrel

#### `fields/index.tsx` — logic checks (React registration)
- Each entry in `fieldInputComponents` uses `as ComponentType<InputComponentProps<AdminField>>`. This cast is required because each input component is typed to its specific field (e.g. `InputComponentProps<NumberField>`), which is not assignable to the wider `InputComponentProps<AdminField>` union due to contravariance. The map is a type-unsafe dispatch table by design — the caller always passes a field matching the key, so the cast is safe.
- The `<NewField>FieldInput` import is present
- The barrel export `export * from "./<newField>"` is present

#### `adapter.ts` — logic checks (React adapter)
- `reactAdapter.fields.<newField>` exists with both `input` and `cell` keys
- `input` is `<NewField>FieldInput` and `cell` is `<NewField>FieldCell`
- Both components are imported from `"./components"`

### Step 5 — Rewrite JSDoc (all present files)

After logic is correct, apply the `/document` conventions to all JSDoc blocks. Follow the full rules from `/document` — do not summarize them here, apply them directly.

Key rules for field-specific docs:
- **`config.ts` function**: Summary names the field type and its common uses. Examples use realistic values for this field (not string placeholders for a number field). All examples use `<newField>()`.
- **`*FieldInput` interface**: Full treatment — summary, defaults block with inline `//` comments explaining each value, 2–3 examples, `@see` links to resolved type and config function.
- **`*Field` interface**: Short — one-sentence summary, `@see` links only. No examples, no defaults block.
- **`inputSchema.ts` function**: `@returns` describes the correct Zod type. `@example` shows the correct function name and realistic constraint values for this field type.
- **`validator.ts` function**: `@returns` shows the correct validator strings. All examples use the correct field function and expected outputs.
- **React components**: JSDoc describes the new field's rendering behavior specifically, not the source field's.

### Step 6 — Report to user

After all edits, output a structured report:

#### ✅ Fixed automatically
List every file that was updated, with a one-line summary of what changed.

#### ⚠️ Logic issues fixed
Call out any logic bugs that were found and corrected (e.g. "Removed `z.number().min(1)` required check — 0 is a valid required number value").

#### 🚧 Not yet implemented
List every missing file or registration from the feature parity checklist. For each, say what it should contain when implemented. Example:

```
- packages/react/src/components/fields/number/Cell.tsx
  → NumberFieldCell component rendering the numeric value with a null fallback
- packages/react/src/components/fields/number/Input.tsx
  → NumberFieldInput using createFieldInput<number, NumberField> with type="number"
- packages/react/src/components/fields/number/columnDef.tsx
  → numberFieldToColumnDef() returning ColumnDef<VexDocument, number>
- packages/react/src/components/fields/number/index.ts
  → Re-exports NumberFieldCell and NumberFieldInput
- fields/index.tsx — fieldInputComponents map
  → Add [ADMIN_FIELDS.number.type]: NumberFieldInput
- fields/index.tsx — barrel export
  → Add export * from "./number"
```

#### 🔍 Remaining stale strings (if any)
Search for any leftover source-field references in the new field's files. Report them if found.

---

## Key Principles

- **Spec governs semantics.** The source field is a structural template, not a semantic one. Number fields are not text fields with different names.
- **Logic bugs are the priority.** Naming and docs can be wrong without breaking anything at runtime. Logic bugs (wrong Zod type, wrong required check, wrong onChange handler) ship as silent breakage. Catch these first.
- **Don't invent features.** Only add what the field actually has per the spec and existing files. Flag missing features, don't stub them.
- **One file at a time.** Read → identify all issues (naming + logic + docs) → single edit.
- **Don't touch source field files.** Only edit files in the new field's directory and the shared registration files.
- **Flag instead of guess.** If a decision is ambiguous (e.g. should this field support `searchIndex`?), leave a `// TODO:` comment and note it in the report.
