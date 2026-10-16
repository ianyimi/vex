---
"@vexcms/core": patch
"@vexcms/react": patch
"@vexcms/richtext-plate": patch
---

Richtext field shipped end to end (`richtext()`, root `editor:` adapter contract,
inline images through the media collection, image resize/crop, upload-from-editor),
and unpublish reworked to demote-and-promote: no history row is written; the
previous published version's snapshot is promoted onto the live row in place, the
taken-down version loses its `publishedAt`, and a confirmation dialog names the
version that will take over. Old versions can be republished (or restored as the
current draft) verbatim without creating new history rows; the new
`vex_activeVersion` live-row pointer drives the history dropdown's Active marker.
