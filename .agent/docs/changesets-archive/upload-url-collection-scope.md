---
"@vexcms/core": minor
"@vexcms/react": minor
---

`generateUploadUrl` now carries the target collection: `VexMediaGenerateUploadUrlArgs` gains a
required `collection` field, and `MediaUploadForm`/`MediaUploadDropzone` pass the target
collection slug through, so storage adapters can scope upload URLs per collection.
`FormBlocks` also fixes the inverted drag-handle guard (`disabled={!readOnly}` →
`disabled={readOnly}`), which disabled block reordering exactly when the form was editable.
