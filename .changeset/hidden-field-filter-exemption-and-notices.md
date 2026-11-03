---
"@vexcms/core": patch
"@vexcms/react": patch
---

Declared (config/default) and shared-view filters behave consistently around field
readability, closing several gaps the new access-system-fields rules exposed.

A config/default view's own hidden `where`, and an ACTIVE, UNMODIFIED shared view's own saved
`where`, both still apply server-side regardless of whether the current viewer can read the
field they reference (same treatment `vex_status`'s draft/publish filtering already had) — the
viewer never sees the value (no column, chip, or peek row for it), the view shows its
hidden-filter badge, and the viewer can't add their own filter on that field. The moment a
caller edits a shared view's own filter, it becomes their own and is checked like any other
user-supplied condition.

A user-added (URL or local-view) filter condition on a field the caller can no longer read is
now dropped BEFORE the query is built, not just hidden from the chip row after the fact — the
server already rejected it, so a dropped-but-still-sent condition used to produce a silently
broken or empty query with no visible chip to remove it. A small dismissible toolbar notice
explains the drop, naming the field's display label (aligned with the existing stale
sort/search notices, which also now show the label instead of the raw key).

**Bug fix:** a fully readable shared view's own saved filter now renders as normal, editable
chips (previously invisible for every caller, since an unmodified shared-view link carries no
URL-embedded filter state to read from) — new `resolveEffectiveFilterWhere` resolves the
right source (URL override, else the active shared view's own `where`, else nothing) for the
chip row, the visibility toggle, and the filter count badge alike.
