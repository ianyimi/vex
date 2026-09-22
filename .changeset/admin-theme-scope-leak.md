---
"create-vexcms": patch
---

`marketing-site`: the admin theme no longer follows the visitor back to the
public site.

`<ThemeStyle scope="admin" />` rendered its block with `href` + `precedence`,
which makes it a React 19 stylesheet *resource* — react-dom keeps resources in
`<head>` for the life of the document and, on unmount, only decrements their
refcount (`commitDeletionEffectsOnFiber`, fiber tag 26). The admin layout's
`:root:root` block therefore outlived the admin layout: navigate from `/admin`
back to `/` with the in-panel "View site" link and the marketing site rendered
in the admin palette until a full reload. Only the admin scope was affected —
the site block is document-wide, so keeping it is correct.

The admin block now renders in place inside the admin layout, so React removes
it with that layout. Nothing about first paint changes: it still streams ahead
of any admin markup, and `:root:root` outranks the site's `:root` wherever both
apply, whatever the document order.

`<ThemeLive />` follows: it appends its `<style>` to the end of `<body>` rather
than `<head>`, the one position that follows both server blocks — the hoisted
site block in `<head>` and the admin layout's in-tree block — so live theme
edits still win at equal specificity.
