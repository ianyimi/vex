title: Show a toast when media upload fails instead of only logging to console
labels: good first issue, type: bug, area: ui

## Context

`MediaUploadForm.tsx`'s submit handler catches a failed upload (network error, storage error) with
only `console.error("Upload failed:", error)` — nothing tells the person using the admin panel that
anything went wrong. The rest of the admin panel uses `sonner`'s `toast` for exactly this (see
`packages/react/src/documents/DocumentSaveAction.tsx` or `packages/react/src/versions/VersionHistoryPanel.tsx`
for the established pattern, including `getVexErrorMessage(error)` for a readable message). A test for
this is already written and skipped: `packages/react/src/fields/upload/Field.test.tsx`, the
`it.skip("[finding] recovers from a failed storage upload...")` case, with a comment pointing at the
exact fix needed.

## Scope

Replace the `console.error` + `// TODO: Show error toast` in `packages/react/src/media/MediaUploadForm.tsx`'s
catch block with `toast.error(getVexErrorMessage(error))`, matching the pattern used elsewhere in the
package. Un-skip the existing test.

## Acceptance criteria

- [ ] A failed upload shows an accessible error toast (not just a console log)
- [ ] The skipped test in `Field.test.tsx` is un-skipped and passes
- [ ] A changeset is added for `@vexcms/react`

## Out of scope

Retry-on-failure behavior — the test's own comment notes the staged file survives for a retry already;
this issue is only about surfacing the error.
