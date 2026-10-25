---
"@vexcms/core": patch
"@vexcms/react": patch
"@vexcms/file-storage-convex": patch
"@vexcms/richtext-plate": patch
---

Field input consistency pass. New fields: `email()`, `textarea()`, `json()`, and the
non-stored layout fields `tabs()`, `collapsible()`, `row()` and `ui()` (flattened by
`getDataFields()`; a named tab stores its fields as one group-shaped value). Every field
accepts `admin.condition({ data, siblingData })`, enforced in the admin form and on the
server (a hidden field skips `required`/`validate`). `admin.mask` on text/email/number/url
plus project defaults in `fields.inputMasks`. `min`/`max` take `number | [number, string]`;
`admin.width` takes any CSS width. Experimental extension points: per-field
`admin.components` overrides and contributions, project-wide `fields.<type>` overrides, and
`blocks`/`array` action contribution lists. Admin: responsive form layout driven by the form
column width, array/blocks item actions (duplicate, move, insert, remove, collapse all), a
block clipboard across fields/documents/collections, relationship overhaul, tabs that open on
the first error, and focus on the first invalid field after a failed save.

Breaking: `array()` drops `labels` (its `label` is the plural, `items.label` the singular);
`min`/`max` `{ value, error }` objects and `admin.width: "half" | "full"` are removed;
`FieldAdminConfigInput`/`FieldAdminConfig` take `<TCollectionSlug, TComponent>` and the
per-type admin types that only added `condition` (array, checkbox, color, date, json,
richtext, textarea, upload, row, tabs) are deleted.
