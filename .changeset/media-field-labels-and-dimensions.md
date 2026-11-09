---
"@vexcms/file-storage-convex": patch
---

Fix two media-system defects found in the 2026-11-09 `create-vexcms` run-through.

`defineMediaCollection`'s injected base fields (`filename`, `alt`, `mimeType`, `size`,
`storageId`, `src`, `width`, `height`, `deleted`) carried no `label`, so the admin edit
view fell back to the raw field key (`mimeType *` instead of `MIME type`). Every injected
field now has a human-readable label.

`createMediaDocument` (both the adapter class and its `methods.ts` implementation) never
accepted or persisted `width`/`height`, so an uploaded image's dimension fields stayed
unset regardless of the file's actual size. The adapter now accepts optional `width`/
`height` args and writes them when provided — omitted entirely (not written as
`undefined`) for a non-image upload or when the caller doesn't measure dimensions, so the
fields keep their existing optional semantics.
