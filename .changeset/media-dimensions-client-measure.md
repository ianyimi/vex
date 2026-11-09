---
"@vexcms/react": patch
---

`MediaUploadDropzone` and `MediaUploadForm` now measure an uploaded image's pixel
width/height via `createImageBitmap` before creating its media document, and pass them
through to `createMediaDocument`. Previously neither component measured dimensions at
all, so the `width`/`height` fields `@vexcms/file-storage-convex`'s `defineMediaCollection`
declares stayed unset after every upload regardless of the file.

Non-image MIME types and files the browser can't decode are left with `width`/`height`
omitted entirely, matching the fields' existing optional semantics.
