---
"www": patch
"create-vexcms": patch
---

Fix dark-mode focus rings silently disappearing on `variant="outline"` buttons (and anything
else carrying `shadow-xs`). Tailwind v4 composes `box-shadow` as a 5-layer `var()` list; a bare
`none` keyword for any one layer is invalid inside a comma-separated shadow list, so the whole
composed declaration fails to parse at compute time and `box-shadow` collapses to its initial
value — silently eating the valid `focus-visible:ring-3` layer along with the (deliberately
absent) elevation shadow. `--shadow-xs-val`/`--shadow-sm-val`/`--shadow-md-val`/
`--shadow-lg-val` now resolve to `0 0 #0000` (zero-spread, transparent — visually identical to
`none`, but valid inside the composed list) in dark mode, in `apps/www/src/app/globals.css` and
both `create-vexcms` templates (`base-nextjs`, `marketing-site`).
