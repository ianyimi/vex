---
"@vexcms/react": patch
---

Fixed the relationship picker modal reopening itself immediately after the first
selection on a freshly loaded document/global form.

Root cause: every `relationship()` field's picker dialog shares the exact same
`MODALS.relationshipPicker` nuqs url key (only the value — the open field's own
name — distinguishes which one is open), so a document with more than one
`relationship()` field (e.g. `siteSettings.activeTheme` + `siteSettings.adminTheme`,
both pointed at `themes`) has multiple independent `useQueryState` subscriptions
to that same key. `RelationshipFieldAdmin`'s `handleSelect` (`fields/relationship/Field.tsx`)
called `field.handleChange(ids)` — which flips the form from pristine to dirty and
re-renders every sibling field on the page — BEFORE `closePicker()`'s url-clearing
write had settled (`void closePicker()`, never awaited). A sibling relationship
field's own query-state subscription could resync from that still-stale "open" url
during the resulting re-render cascade, reopening the dialog moments after it
closed. Reproduced only on a freshly loaded page (an already-warm page settles the
write well within a render cycle); closing it again, and every subsequent
selection, always worked.

`handleSelect` now `await`s `closePicker()` fully before calling
`field.handleChange`, so the picker's url is already cleared by the time any
sibling field re-renders.
