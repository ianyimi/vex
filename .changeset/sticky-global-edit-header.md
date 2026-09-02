---
"@vexcms/react": patch
---

`GlobalEditView`'s header and form controls are now sticky, matching
`CollectionEditView`: the title row pins below the admin top bar (`sticky top-12`
over an opaque `bg-background`) so Save/Reset stay reachable while scrolling a
long global — previously they scrolled away, which a global like `siteSettings`
hits immediately once it carries SEO, theme, and social field groups.
