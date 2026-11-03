---
"@vexcms/react": patch
---

**Breaking (narrow): `Button`'s icon+label content is no longer space-between by default.**
Grouped/centered content (icon and label staying together, centered within a stretched-width
button) is now the default; space-between is an explicit opt-in via the new
`contentJustify?: "center" | "between" | "start"` prop (default `"center"`). The previous
default was correct for exactly one caller (a full-width mobile view-switcher wanting a
label-left/icon-right split) and visibly wrong for every other full-width labeled button,
which wants its icon and label to stay grouped together.

**Migration:** a full-width labeled `Button` that relied on the old space-between default
needs `contentJustify="between"` added explicitly to keep that layout — everything else
renders correctly with no change. `"start"` is new, for a left-aligned icon+label pair (e.g. a
menu-style overflow item) that shouldn't center within extra width.

Also fixed in the same pass: `hasLabel` (drives the icon's own margin) now correctly ignores a
raw icon element passed as `children` with no `icon` prop, and respects an explicit
`iconPosition="center"` even when `children` is present (an `sr-only` accessibility label no
longer miscounts as visible label content).
