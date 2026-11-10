---
"@vexcms/core": patch
"@vexcms/react": patch
---

`buildThemeCss` accepts a region scope — `scope: { selector }` scopes the theme to
one wrapper element (`[data-vex-theme="…"]`, light at that selector, dark at
`.dark ${selector}`) instead of `:root`, for a page carrying its own palette
distinct from the rest of the site.

`useLivePreviewQuery`/`useLivePreviewDocumentQuery` no longer require a
`convexQuery(...) as never` cast at the call site: their query-key type
parameter is erased to `any` rather than threaded through as its own generic,
which TypeScript stopped inferring the moment an earlier type parameter
(`TCollectionSlug`) was given explicitly.

`runVexReactSuite`'s `custom[].Component` option now accepts a real
`admin.components.Field` export (e.g. `CheckboxFieldAdmin`) directly, aligned
with `FieldComponentProps` instead of a narrower hand-rolled shape.
