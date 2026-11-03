---
"@vexcms/core": patch
"@vexcms/react": patch
---

New optional `display` field component slot, beside `field`/`cell`/`filterInput`.

`reactAdapter.fields[type]` now accepts a `display` component — a read-only
presentation of a field's value, used anywhere a value needs to be shown
without a form around it (the collection list's row-inspect peek is the
first consumer). `DisplayComponentProps<TField>` (new, `packages/core`):
`field`, `value`, `document`, `collection` — no table row, title-link
behavior, or column key, unlike `CellComponentProps`.

New `fieldToDisplayComponent(type)` (`@vexcms/react`) resolves a type's
registered `display`, falling back to its registered `cell` (adapted,
`isTitleField` forced `false`) when no `display` is registered — every data
field type resolves to something.

Nine built-in types register a dedicated `display`: `text`/`textarea` (full
value, unlike their `cell`'s truncation), `json` (the real `JsonEditor`,
read-only), `richtext` (the configured editor adapter's own
`renderComponent`, falling back to plain text with no adapter configured),
`relationship`/`upload` (one chip per related doc/file, titled, with the raw
id always reachable), and `group`/`array`/`blocks` (recurse into their own
sub-fields' `display`s, via the new shared `fields/DisplayFieldList.tsx`).
Every other data field type (`date`/`commitTs`/`checkbox`/`select`/
`number`/`email`/`url`/`color`) registers none — its `cell` is already a
reasonable read-only presentation.
