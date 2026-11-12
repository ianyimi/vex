---
"@vexcms/core": patch
"@vexcms/react": patch
---

**Breaking: a populated relationship/upload target is now access-checked against its OWN
collection's `read` rule and field-permission map, instead of being returned unconditionally.**
`populateDocs` (used by `find`/`get`/`search`/`globals.get`, via `populate` and `depth`)
previously resolved every relationship/upload field's target id(s) with a raw, unchecked
`ctx.db` batch fetch — a caller who could read the document the field lives on got the full
target document back regardless of whether they could read the TARGET collection at all.
Populate now applies that target's own `read` rule (and field-permission map) exactly as a
direct `get({ collection: <target> })` would — resolved once per target collection per call,
then evaluated per document, since a per-document rule reads that document's own data:

- A target the caller may not read at all becomes a new `HiddenDocument` placeholder in its
  place — `{ _id, code: "ACCESS_DENIED", resource, action: "read" }` — never the target's own
  fields. The `Populated<...>` type now includes this placeholder in every populated array's
  element type.
- A target the caller may read, but not every field on, keeps its denied fields stripped —
  unchanged target shape, same `stripDeniedFields` treatment a direct read already gets.
- `access: { bypass: true }` on the top-level call still populates every target in full —
  bypass propagates, it is never re-decided per target collection.
- Draft-exclusion behavior (a populated target's own `vex_status` filtering) is unchanged.

**Migration:** if your config declares `access` and a role could previously read a document
with a populated relationship/upload field pointing at a collection that role canNOT read,
that field's items are now `HiddenDocument` placeholders instead of full documents — audit
`access.ts` for any resource your roles read only *through* a relationship, not directly, and
grant `read` on the target collection if the populated value should stay visible.

**Client (`@vexcms/react`):** the relationship field's list-view cell
(`fields/relationship/Cell.tsx`) and its read-only peek-panel display
(`fields/relationship/Display.tsx`) render a denied target as a locked row — reusing
`AccessDeniedItemRow` (full-width list cell) and a new compact `AccessDeniedChip` (inline
among the peek panel's other chips) instead of attempting the target's preview component on a
placeholder that carries none of its fields.
