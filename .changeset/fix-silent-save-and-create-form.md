---
"@vexcms/react": patch
---

Fixes five issues found in the 2026-11-09 `create-vexcms` run-through and its follow-up polish pass:

- **Silent save failures.** `DocumentSaveAction`'s non-versioned update/upsert path had no
  try/catch — a rejected `update`/`upsert` mutation propagated out of `handleSave` as an
  unhandled promise rejection, and `runtime.onSaved` never ran. Now caught and routed through
  `applyVexFieldErrors`, mirroring the versioned (draft) path and `VersionPublishAction`; the
  mutation's own `useVexMutation` `onError` still shows the visible toast. Audited every other
  admin mutation call site for the same missing-catch pattern and fixed the same way:
  `VersionUnpublishAction`, `ListViewBulkDeleteAction`, `ListViewRowDeleteAction`,
  `MediaCollectionListView`'s bulk delete, and `MediaUploadDropzone`/`MediaUploadForm` (the
  latter two previously had no visible error at all on an upload failure — `generateUploadUrl`
  is a plain `useMutation` with no `onError`). Both `createMediaDocument` calls now also pass
  `errorToast: false`: without it, a rejected create fired its own catch-and-toast AND
  `useVexMutation`'s default "Request failed" toast — two toasts for one failure.
- **Create dialog overflow.** `ListViewCreateDocumentForm`'s wrapping element had no flex sizing,
  so `DialogFooter` sat outside the scrollable region on a long form and spilled below the
  panel. The wrapper now fills the dialog's remaining height (`flex min-h-0 flex-1 flex-col`) —
  fields scroll inside the dialog, header and footer stay pinned.
- **Read-only fields in create forms.** `ListViewCreateDocumentForm` picked `required` fields
  without excluding `admin.readOnly` — a create form asked for a value it could never persist
  (e.g. Better Auth's `emailVerified`/`createdAt`/`updatedAt`). Excluded in both `"required"`
  and `"all"` fieldsMode.
- **Hide "New" on the auth user collection (decision D2).** Added top-level `disableCreate` to
  `CollectionConfig` (`@vexcms/core`) — hides the list view's "+ New" action
  (toolbar and empty state) and blocks `?createNew=true` outright, even hand-typed. Set from
  `@vexcms/better-auth`'s adapter on the user collection only: users arrive via sign-up, never
  an admin-authored create form.
- **`disableCreate` gap in relationship fields and Duplicate.** Decision D2's gate only
  covered the list view's own "+ New"/`?createNew=true` entry points — `RelationshipPicker`
  still rendered a working Create tab (`ListViewCreateDocumentForm`) for a `disableCreate`
  target collection, reachable from both its own tab trigger and `EmptyInput`'s "Create …"
  button, which now hides too. `CollectionDuplicateMenuItem`'s "Duplicate" had the
  same gap for its own collection: offered a working admin-authored create (via its all-fields
  conflict-fallback dialog) on a collection that explicitly has none. All three now check
  `disableCreate` and render nothing / Select-only, the same gate `ListViewCreateAction`/
  `ListViewCreateDocumentModal` already applied.

