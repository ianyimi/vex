---
"@vexcms/react": patch
---

Admin edit-form fixes found while dogfooding a live scaffold post-alpha.5.

`FormBlocks` and `MediaUploadForm`'s block/file accordions are now controlled
(`value`/`onValueChange`) instead of recomputing an uncontrolled `defaultValue`
from live item state every render. Base UI's Accordion logs "A component is
changing the default value state of an uncontrolled Accordion after being
initialized" whenever that recomputed array differs from what it captured at
mount — real whenever items load asynchronously (the owning document arriving
after first mount) or files are appended after the accordion already
mounted (multi-select "Add more" / a second drag-drop). Newly-appeared item
ids still open according to `admin.defaultCollapsed`, and the user's manual
toggles persist.

`DragHandle` no longer throws `useDraggableInstanceContext must be called
from within a Draggable component` when it renders outside a `Draggable`
ancestor — e.g. `FilledInput`'s single-value (non-`hasMany`) upload rows,
which render a `DragHandle` for layout alignment but were never wrapped in
`Draggable`. It now reads the ancestor context directly (nullable) and falls
back to the same static/inert render already used when DnD isn't mounted or
the handle is disabled, instead of requiring every caller to guarantee a
`Draggable` wrapper.
