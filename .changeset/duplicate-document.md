---
"@vexcms/core": patch
"@vexcms/react": patch
---

Duplicate document. A `vex.duplicate` built-in, gated on the `create` permission, clones the
current document on every non-media collection (not globals, not media) — stripping `_id`,
`_creationTime`, `_status`, `_version` and timestamps and regenerating array/block item ids —
and creates it. On success it navigates to the new document; on a unique-value conflict it
opens a create modal prefilled with every field (`CreateDocumentForm`/`CreateDocumentModal`
gain `fields: "all"`, `initialValues`, and `submitOnOpen`) and submits immediately, so the
existing failed-submit focus/reveal behavior lands on the conflicting field. A duplicated
document in a versioned collection always creates as a draft.

Duplicate renders alongside a manual Revalidate purge (`vex.revalidate`) in the new
`edit.actionsMenu` ⋯ menu to the left of the status badge, not in `edit.header.actions` —
developer feedback after the initial header-actions placement moved both out of the primary
button row.
