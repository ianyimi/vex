---
"@vexcms/core": patch
"@vexcms/react": patch
---

Edit-view extension points. Eight new slots under `admin.components.edit` — `header.actions`,
`header.before`, `header.after`, `actionsMenu`, `beforeFields`, `afterFields`, `sidebar.before`,
`sidebar.after` — for collections and globals, resolved root → resource level with the same
`order`/`before`/`after`/`hidden`/`access`/`condition` model as every other slot. Save,
Publish, Unpublish, Delete, Cancel and the live-preview toggle are now
`vex.*` built-in contributions in `edit.header.actions`, from `BUILTIN_CONTRIBUTION_IDS.edit`
(left to right: Preview, Save, Publish-or-Unpublish, Cancel, Delete) — hideable,
reorderable, and wrappable through a new per-slot `overrides` map keyed by built-in id
(`overrides: { "vex.save": [...] }`). An override keyed to an id outside that slot's resolved
list throws `VexComponentConfigError`. Save (Draft)/Publish-or-Unpublish/Cancel are always
rendered, greyed out when inapplicable rather than hidden by state (layout never shifts).
`vex.publish`/`vex.unpublish` share one spot — exactly one renders at a time, with a shared
minimum width so the swap never shifts neighbouring buttons. Delete carries a trash icon on
its header button, its collapsed ⋯ menu item, and its confirm dialog's own Delete button.
`vex.versionHistory` ("History") moved out of `edit.header.actions` into the new
`edit.actionsMenu` — see below. A new `edit.actionsMenu` slot holds a ⋯ menu for
less-used actions — see the `duplicate-document` changeset for its other built-ins — rendered by
`DocumentEditActionsMenu`/`EditActionsMenuItem`, with a new `useEditActionsMenuDialog()` hook
for a menu item whose action opens a dialog after the menu has already closed. History renders
through this menu (right after Preview, when Preview is also collapsed in) as
`VersionHistoryMenuItem`, opening the same version list `VersionHistoryDropdown` renders
standalone in a dialog through that hook.

The header row stays on one line at every width instead of wrapping: the title truncates first
(measured, via a new `useHeaderActionsCollapse` hook), and only once it can't shrink any
further does `vex.livePreview`, then `vex.delete`, then (narrower still) `vex.cancel` move into
`edit.actionsMenu` — a versioned document's Save Draft/Publish-or-Unpublish/Cancel/⋯ set alone
can outgrow a ~375px header even with the title and both other candidates already collapsed.

`SlotAccessContext`'s `access` predicate (every `ComponentContributionInput`) gained an optional
`resource?: EditSlotProps`, populated for every `edit.*` slot (`undefined` for field-level
slots, which have no single resource kind) — lets a contribution that only makes sense for one
resource kind (e.g. a collection document's own id) declare that declaratively via `access`
instead of returning `null` at render time, which left a dead, empty ⋯ trigger on a resource
with nothing else in its menu (a project's root-level `edit.actionsMenu` item resolved as
present, even though it always rendered nothing for a global).

New `useVexDocument()` hook (`@vexcms/react`) exposes document-level state — `kind`, `slug`,
`id`, `saved`, `isDirty`, `status`, `canEdit` — to built-in and third-party edit-view
contributions; it throws outside its provider, which both edit views now mount.

Every override layer — in field `Input`/`Cell` chains and in the new edit-slot `overrides` —
now renders inside its own `ComponentErrorBoundary` keyed by the override id; a throwing
wrapper renders the layer beneath it plus an inline error instead of breaking the view. This
changes the field-override error behavior shipped in the field-input-consistency-pass
changeset.
