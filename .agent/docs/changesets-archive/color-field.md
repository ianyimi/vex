---
"@vexcms/core": minor
"@vexcms/react": minor
---

Add the `color()` field. Stores a CSS colour string as `v.string()`, with a
swatch picker in the admin form and a swatch cell in the list view.

`format: "hex" | "rgb" | "hsl" | "oklch"` (default `"hex"`) selects the notation
the picker writes; validation accepts all four, so changing `format` never
invalidates existing documents.

`color({ themeColors: true })` adds a picker tab listing the host application's
CSS custom properties; selecting one stores `var(--token)`, so the colour
follows the active colour scheme.

`@vexcms/core` now exports `serializeColor`, `parseColor` and `ColorValue` — a
dependency-free colour conversion layer covering hex, `rgb()`, `hsl()` and
`oklch()`, round-trip exact across the 8-bit sRGB space.

`@vexcms/core` also exports theming utilities from the colour field:
`buildThemeCss({ theme, scope })` turns a stored theme document (`light`/`dark`
token groups plus `radius`/`fontFamily`) into `:root` / `.dark` stylesheet text,
with `scope: "admin"` emitting one specificity rung higher for an admin-panel
override. `THEME_COLOR_TOKENS`, `THEME_SHARED_TOKENS`, `ThemeColorTokenKey` and
`ThemeScope` are exported alongside.

`@vexcms/react` components now use only shadcn's 32 design tokens. The
non-standard `--primary-hover`, `--muted-foreground-subtle` and `--warning`
tokens are replaced by `primary/90`, `muted-foreground` and `destructive`; the
other thirteen were unused and are removed. Host apps whose stylesheets declared
them can delete them.

Field-type dispatch is now exhaustive: `adminFieldToValidator`,
`adminFieldToInputSchema` and `getCollectionColumnDefs` assert their switches
against `never`.
