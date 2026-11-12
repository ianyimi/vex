---
"@vexcms/core": patch
---

A field's `validate()` gains `dependsOn`: other field keys whose change also re-runs this
field's validator on a partial write (`update`/`saveDraft`). Previously `validate()` only ran
for a field whose own key changed, so a validator checking ANOTHER field's value (a room/time
overlap check, an end date that must follow a start date) never re-ran when only that other
field changed. `dependsOn` only widens WHEN `validate()` runs — not what it validates: the
callback still only receives and reports on the field's own key/value, and is unaffected on
the strict pass (`create`/`publish`, where every field's own key is already in the changed
set). Resolved against the collection's/global's own top-level field keys — the same universe
`index`'s `additionalFields` checks against — and validated at `defineCollection`/
`defineGlobal` time: an unknown key throws a `VexConfigError`.
