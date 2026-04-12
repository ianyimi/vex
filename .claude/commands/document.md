# Document — JSDoc Writer for Vex

Write or update JSDoc comments for a target in this codebase.

## Usage

```
/document [<target>] [in <file>]
```

**Examples:**
- `/document` — documents all uncommitted changes (staged + unstaged)
- `/document TextFieldInput`
- `/document all fields in packages/core/src/fields/text/types.ts`
- `/document the text() function`
- `/document BaseFieldInput and FieldAdminConfigInput`

---

## Instructions

You are writing JSDoc comments for the Vex CMS codebase. Your job is to read the implementation, understand what things actually do, and write accurate, developer-facing docs that work equally well as IDE hover text and as Starlight reference pages.

### Step 1 — Locate and read the target

**If no target was specified**, run `git diff --name-only && git diff --cached --name-only` to get all uncommitted changed files (unstaged and staged). Include all `.ts`, `.tsx`, and `.test.ts` source files under `packages/` and `apps/`. Skip only: `tsup.config.ts`, `package.json`, `tsconfig*.json`, `.md` files, and lock files. **Test files (`.test.ts`, `.test.tsx`) must be included** — check every test file for stale describe names, wrong type assertions, wrong expected values, and test cases that no longer match the implementation. Document (or fix) every changed source file.

**If a target was specified**, the user will name a function, interface, type, or set of fields. Find it:
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

#### Full-depth coverage on critical interfaces

For the following interfaces, **every property at every nesting level must have a JSDoc comment** — including inline object types and their sub-properties. A developer must be able to hover any field at any depth in a `defineConfig()` or `defineCollection()` call and get a useful description.

**Critical interfaces that require full-depth coverage:**

- `VexConfigInput` / `VexConfig` — top-level CMS config passed to `defineConfig()`
- `AdminConfigInput` / `AdminConfig` — admin panel config nested under `vexConfig.admin`
- `CollectionConfigInput` / `CollectionConfig` — collection config passed to `defineCollection()`
- `BaseFieldInput` / `BaseField` — base properties shared by all field types
- `FieldAdminConfigInput` / `FieldAdminConfig` — admin UI config nested under any field's `.admin`
- Any field-type-specific `*Input` interface (e.g. `TextFieldInput`, `NumberFieldInput`)

**Rules for nested inline object types:**

When a property's type is an inline object literal (not a named interface), the **property itself** gets the full JSDoc treatment — acting as both the property doc and the container doc. Its sub-properties each get their own one-line JSDoc. For example:

```ts
/**
 * Navigation sidebar configuration for the admin panel.
 *
 * Controls the sidebar that houses collection links and navigation items.
 * All properties are optional; omitted values fall back to the defaults below.
 *
 * **Defaults applied by `defineConfig()`:**
 * ```ts
 * { side: "left" } // sidebar rendered on the left side of the viewport
 * ```
 */
sidebar?: {
  /**
   * Which side of the viewport the admin sidebar is anchored to.
   *
   * - `"left"` — sidebar sits on the left (default)
   * - `"right"` — sidebar sits on the right
   */
  side?: "left" | "right";
};
```

When you encounter any of the critical interfaces above, audit every property — including inline sub-objects — and add JSDoc where it is missing before moving on.

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

### Step 5 — Verify typecheck and tests pass

After all edits, determine which packages contain the files you changed. For each affected package, run its `typecheck` and `test` scripts from the package directory:

```
cd packages/<name> && pnpm typecheck
cd packages/<name> && pnpm test
```

**If a check fails:**
- Read the error carefully. Determine whether it is caused by a change you made.
- **If you caused it** — fix it immediately, then re-run the check to confirm it passes.
- **If you did not cause it** — do not attempt to fix it. Report it to the user at the end with the exact error message and file location so they can address it. Continue with the remaining checks.

At the end of your response, report:
- Which packages passed typecheck and tests
- Any pre-existing failures you did not cause, with the exact error
