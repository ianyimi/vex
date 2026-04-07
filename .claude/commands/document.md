# Document — JSDoc Writer for Vex

Write or update JSDoc comments for a target in this codebase.

## Usage

```
/document <target> [in <file>]
```

**Examples:**
- `/document TextFieldInput`
- `/document all fields in packages/core/src/fields/text/types.ts`
- `/document the text() function`
- `/document BaseFieldInput and FieldAdminConfigInput`

---

## Instructions

You are writing JSDoc comments for the Vex CMS codebase. Your job is to read the implementation, understand what things actually do, and write accurate, developer-facing docs that work equally well as IDE hover text and as Starlight reference pages.

### Step 1 — Locate and read the target

The user will name a function, interface, type, or set of fields. Find it:
- Start in the file the user specifies, or search the `packages/` directory
- Read the full file the target lives in
- Follow any imports that are directly relevant to understanding the target's shape or behaviour

### Step 2 — Gather context

Before writing a single word of docs, understand:
- **What the thing is** — its purpose in the system, not just what its fields are
- **How it is used** — check for usages in the same package (`grep` imports of the symbol)
- **What the resolved/default version looks like** — if there's a corresponding config function (e.g. `text()`) or a `Required<>` derived type, read it to know the defaults
- **The parent interface** — if documenting individual fields, always read the full interface first so each field's description is informed by the broader context

### Step 3 — Write the docs

Follow all of these rules exactly.

#### Interfaces and types

The interface-level JSDoc must include:

1. **One-sentence summary** — what this type represents and when a developer encounters it
2. **Defaults block** — only for `*Input` types (user-facing config). Show the full resolved default object with an inline `//` comment on every property explaining what that specific value means in practice. Do not just repeat the property name.
3. **`@example`** — 1–2 examples as a guideline; complex features may warrant more. Most fields need a single minimal example showing typical usage. Skip entirely if the field is self-evident. Use your judgement — if a feature has non-obvious behaviour, add examples until it's clear. Never use examples that don't make sense for the field type (e.g. don't use a `text()` field for something that would obviously be a `select()` or `number()`).
4. **`@see`** references to the resolved type, config function, and any closely related types

```ts
/**
 * Configuration input for a `text()` field.
 *
 * Text fields store short, single-line string values — titles, slugs, URLs,
 * author names, etc. All properties are optional; unset properties fall back
 * to the defaults listed below.
 *
 * **Defaults applied by `text()`:**
 * ```ts
 * {
 *   type:     "text",
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
 * // Minimal — label is inferred from the key ("Title")
 * title: text()
 *
 * // Required slug with length validation and a database index
 * slug: text({ required: true, minLength: 3, maxLength: 100, index: "by_slug" })
 *
 * // Author name with a placeholder hint shown in the admin form
 * authorName: text({
 *   required: true,
 *   admin: { width: "half", placeholder: "e.g. Jane Smith" }
 * })
 * ```
 *
 * @see {@link TextField} for the resolved type after defaults are applied
 * @see {@link text} for the config function that applies defaults
 * @see {@link BaseFieldInput} for shared properties
 */
```

#### Input types vs resolved types

Every config type in this codebase exists in two forms:

- **`*Input`** (e.g. `FieldAdminConfigInput`, `TextFieldInput`) — the user-facing type. This is what developers write. **Give it the full treatment**: detailed summary, defaults block with inline comments, concrete `@example` usage, `@see` references.
- **Resolved** (e.g. `FieldAdminConfig`, `TextField`) — the internal type after defaults are applied. Developers rarely interact with this directly. **Keep it short**: one-sentence summary, one-line property docs, `@see` pointing back to the input type. No examples, no defaults block.

```ts
// Input type — full docs
/**
 * Configuration input for a field's admin panel behaviour.
 * All properties are optional; unset properties fall back to the defaults below.
 *
 * **Defaults applied:**
 * ```ts
 * { hidden: false, readOnly: false, position: "main", ... }
 * ```
 * @example ...
 */
export interface FieldAdminConfigInput { ... }

// Resolved type — short docs
/**
 * Resolved admin configuration after defaults are applied.
 * @see {@link FieldAdminConfigInput} for the user-facing input type
 */
export interface FieldAdminConfig { ... }
```

#### Individual fields on an interface

Each property JSDoc must be:
- **One sentence max** for simple fields
- **Concrete about values** — if the type is a union, explain what each value does in plain English, not just list them
- **Informed by context** — a field on `FieldAdminConfigInput` must be explained in terms of what it controls in the admin panel, not in the abstract
- Never nest into sub-type explanations — if a property's type has its own JSDoc, trust that; just explain what setting this property does

```ts
/**
 * Position of the field in the admin form layout.
 *
 * - `"main"` — placed in the primary content column (default)
 * - `"sidebar"` — placed in the narrower sidebar panel, useful for metadata
 */
position?: "main" | "sidebar";
```

#### Functions

Must include:
1. Summary sentence — what it does and returns
2. `@param` for every parameter (skip if the type is self-evident and there is only one)
3. `@returns` describing the output
4. `@example` with at least one realistic call

**Destructured object parameters:** If a function uses a named object parameter (e.g. `props: { field, validator }`), document the wrapper as `@param props - Input props.` (the description "Input props." satisfies the linter), then document each property as `@param props.field - ...`, `@param props.validator - ...`, etc. If the parameter uses anonymous destructuring (e.g. `{ field, validator }: { ... }`), flag it for renaming to a named parameter so the same pattern can apply.

#### Do not

- Do not add docs that restate the type signature in prose (`label is a string`)
- Do not use vague filler (`This function handles...`, `Used for...`)
- Do not document things that are obvious from the name alone (e.g. `/** The name. */ name: string`)
- Do not invent behaviour that isn't visible in the implementation or types
- Do not add `@throws` unless you can see an actual throw in the implementation

### Step 4 — Apply the docs

Edit the file in place. Do not reformat surrounding code, rename anything, or change logic. Only add or replace the JSDoc comment blocks for the requested targets.

After editing, read the file back and confirm the comments render correctly (no broken `*/` inside code blocks, no mismatched backticks).
