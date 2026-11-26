---
"@vexcms/react": patch
---

Admin support for `@vexcms/core`'s new nullable/storage-override/field-type coverage:

- A **Null** switch appears in the header row of any `nullable` field with no natural empty
  input state (`group`, `array`, `blocks`, `json`, `richtext`, `keyValue`, `variant`,
  `checkbox`); other nullable fields clear to `null` on an empty save the same way they always
  cleared to their type's empty value.
- `number`, `select`, `relationship`, and `upload` inputs, cells, and filters bind a scalar
  value (`bigint`, a literal/string, or a bare `Id`/string) instead of an array wherever
  `schema.validator` is set, with `hasMany: false`.
- Two new field types: `bytes()` (a file/hex two-tab input, size + download + clear, byte-size
  cell) and `keyValue()` (a key + value row list with unique-key enforcement) and `variant()` (a
  variant/type picker — with a **None** option for an optional variant with no member
  preselected — plus the active member's input), each with a list-view cell, a read-only
  display, and nested support inside `group`/`array`/`blocks`/`keyValue`/`variant`.
- `forms/changedValues.ts`, the group/array/blocks cells and peek JSON tab, and the block
  clipboard are `bigint`/`ArrayBuffer`-safe end to end (display stringify, lossless copy/paste,
  deep-equal change detection) — no more throwing or false-positive diffs on an int64 or bytes
  value.
- A keyValue field's row value no longer leaks as a top-level key, and the relationship/upload
  picker's open state is local to the picker — a sibling picker no longer resets another on
  open, and a picker no longer reopens on browser back/forward after mount.
- `keyValue` and `variant` render in a collapsible accordion like `group`, with the Null toggle
  in the header; both accept `admin.defaultCollapsed`. A new keyValue row or variant member starts
  with an empty number input, and masked number inputs select their text on focus. A primitive
  variant keeps the chosen member when its input is cleared.
- **Duplicate** now always opens the create dialog prefilled with every value from the source
  document and the title renamed (`Name` → `Name (2)`, `Name (x)` → `Name (x+1)`); fields the
  dialog doesn't show are still copied, and the dialog says so.
- Publish is enabled for a saved draft that differs from the published version and disabled
  when the form matches it (also while viewing a history version, and for a never-published
  draft with no edits). The version-history dialog follows the live document's active version,
  and a fresh load of a nullable field no longer marks the form dirty.
- The list view peek's JSON tab is no longer dimmed, and the edit view keeps its scroll position
  across a refresh (per document, for the browser session).
- The admin top bar keeps every section on one line with ellipsis truncation; below 1024px the
  Sign out button and the user block collapse to icons.

- Polish: keyValue rows, variant selection and the int64 input stay in sync with external value
  changes (version switch, reset, live merge, null restore); clearing a scalar select saves it as
  unset; bytes file reads and hex edits can't race each other, and an emptied hex textarea clears
  the value; the edit view's scroll restore moved to a head-level `ScrollRestoreScript` exported
  from `@vexcms/react/server` (render it in the root layout next to `ThemeScript`), so it no
  longer causes a hydration mismatch; `clearEditScrollStorage()` (call it on sign-out) clears the
  saved offsets.

- Test kit: `extraFieldFixtures` also runs int64 `number()`, a scalar `select()` and a scalar
  `relationship()` through the contract suites, and a `FieldFixture` can opt out of the cell
  truncation check with `cellTruncates: false`. An int64 input's whole-number error clears when
  the value changes from outside the input.

No migration: every change is additive to existing field types, or new field types with no
prior behavior to preserve.
