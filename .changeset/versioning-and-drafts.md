---
"@vexcms/core": patch
"@vexcms/react": patch
"@vexcms/next": patch
"@vexcms/cli": patch
---

**Versioning & drafts.** Opt in per collection or global with `versions: { drafts: true }`.
A versioned document is one published row with a stable `_id` plus at most one draft row
(`vex_publishedId`); every distinct content state is recorded once as an immutable snapshot in
the new `vex_versions` table. See the new "Versioning & Drafts" guide.

- **Schema.** `vex dev` / `vex generate` add `vex_status`, `vex_publishedAt`,
  `vex_publishedId`, the `by_status` / `by_published` indexes, and `vex_versions`. New
  `draftStatus` (`indexes[]`) and `indexDraftStatus` (field) options narrow an index on
  `vex_status` (`true` replaces it, `"both"` adds a twin) so status-filtered reads stay
  index-backed. Unique fields are enforced among published documents only.
- **API.** `versionsApi({ config, query, mutation, getAuth })` from `@vexcms/core/server`
  registers `saveDraft`, `publish`, `unpublish`, `listVersions`, `getVersionSnapshot`, and
  `deleteVersion` (each takes `{ collection, id }` or `{ global }`), gated by the new
  `saveDraft` / `publish` / `unpublish` / `deleteVersions` permissions and `readDrafts` for
  reads. `saveDraft` is lenient (required fields enforced at publish) and accepts
  `restoredFrom` to save edits on top of an older snapshot; `publish` accepts `version` to
  publish a historical snapshot, marking that version row published instead of adding one.
  `get` / `find` / `search` (server and client) take `drafts: true` to read the draft overlay
  when the caller has `readDrafts`, and are published-only otherwise. Deleting a draft also
  deletes its published parent. `backfillStatus` stamps `vex_status` on rows created before a
  collection opted in. Mutation hooks see the new `"unpublish"` operation.
- **Admin (`@vexcms/react`).** Edit views gain Save Draft / Publish / Unpublish via
  `DraftToolbar`, `useAutosave` (`versions.autosave`), and `VersionHistoryDropdown`: view any
  version without saving (`viewingVersion` / `onViewVersion`), unsaved-changes confirmation,
  an **Active** tag on the published version and live draft, delete per row, and the menu
  scrolls to the version on screen. Publish is disabled when the form already matches the
  published document.
- **`@vexcms/next`.** `NextAdminPage` preloads edit and list views with the same `drafts`
  args as the client queries; the revalidate route maps `unpublish` to an update.
- **`@vexcms/cli`.** `vex dev` no longer runs the automatic version-status backfill; call
  `backfillStatus` from an internal mutation instead.
