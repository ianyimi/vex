---
"@vexcms/react": patch
---

Fixed the media collection list view (`/admin/collections/<slug>` for an upload collection,
e.g. Images) widening the whole admin main column past the viewport — the table's left edge
pushed off-screen and the topbar got cut off on the right. `MediaCollectionListView` wrapped
its `DataTable` in a `grid place-items-center` container; as an uncentered grid item, `DataTable`
sized to its full unclamped intrinsic width (every column's declared/default pixel width summed)
and was then centered, overflowing the viewport equally on both sides whenever that sum exceeded
the available width — most visible for an anonymous session, which has no saved per-field
column-width cookie and so renders every column at its 192px default. The wrapper div is removed
(matching `CollectionListView`'s own un-wrapped `DataTable`); `DataTable`'s own root already
supplies the `rounded-md border` and owns its own horizontal scroll containment, so the table now
always scrolls inside its own frame instead of widening the page.
