---
"@vexcms/core": patch
"@vexcms/react": patch
---

The document peek panel is now resizable on desktop: a drag handle on its left edge (same
look and keyboard behavior as a `DataTable` column resize — full-height highlight on
hover/focus/drag, a grip, `role="separator"`, `ArrowLeft`/`ArrowRight`), clamped to
`[320px, 60vw]`. The width persists per view, mirroring `pageSize`'s own mechanics — but ONLY
for a view that has its own saved width: that view shows "Modified" when the current width
differs and Reset restores the saved one, while a view with no saved width (the default "All"
view and any config view that never set one included) never shows "Modified" for peek width
and Reset leaves it alone — it's just a remembered preference there, not view state. Saving a
view that has no saved width only starts saving one if you resized the peek while that view
was active. It survives a reload via the same admin preference cookie every other
per-collection UI preference uses.

The panel is also now structurally ONE element at every viewport width, switching between a
full-width bottom sheet and a fixed right panel via plain CSS instead of two separately
mounted layouts, and now renders BEFORE the table in DOM order — both changes together are
the confirmed, controlled fix for a hard browser freeze that could occur opening or navigating
the peek on certain rows (reduced from two separate, structurally different root causes found
across this investigation, not a single simple bug).

A few smaller peek changes land in the same pass: Previous/Next now WRAP within the loaded
rows (Previous on the first row jumps to the last, Next on the last jumps to the first) instead
of disabling at either end; the header's edit-page link reads "Edit" instead of the previously
ambiguous "Open" (the row ⋯ menu's matching action was renamed the same way); the panel's
sidebar offset now animates in lockstep with the admin sidebar's own toggle instead of jumping
instantly; the JSON tab now reads from a dedicated raw (depth-0) fetch instead of the same
populated row the Fields tab uses, so a relationship/upload field shows its actual stored id(s)
there, not a populated document; and the panel remembers which tab (Fields or JSON) you last
had open, admin-wide, the same way density/sidebar-collapsed state already persist.

No public API change — this is an internal implementation change to an existing component
(`ListPeek`) with new persisted user preference state, not a new prop or exported type.
