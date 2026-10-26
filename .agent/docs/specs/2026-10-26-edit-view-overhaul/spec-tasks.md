---
status: draft
spec_id: 2026-10-26-edit-view-overhaul
touches:
  - ".agent/docs/product/v0.1.0-launch-plan.md"
  - ".changeset/admin-collections-route.md"
  - ".changeset/duplicate-document.md"
  - ".changeset/edit-view-slots.md"
  - ".changeset/unsaved-changes-guard.md"
  - "apps/docs/src/content/docs/guides/admin-customization.mdx"
  - "apps/docs/src/content/docs/guides/framework-adapters.md"
  - "apps/test/src/vex.config.ts"
  - "apps/test/src/vexcms/collections/posts.ts"
  - "apps/test/src/vexcms/collections/users.ts"
  - "apps/test/src/vexcms/components/CachePurgeNote.tsx"
  - "apps/test/src/vexcms/components/EditorialChecklist.tsx"
  - "apps/test/src/vexcms/components/EnvironmentBadge.tsx"
  - "apps/test/src/vexcms/components/SaveWithAnalytics.tsx"
  - "apps/test/src/vexcms/globals/siteSettings.ts"
  - "packages/core/src/collections/api/create/server.ts"
  - "packages/core/src/collections/types.ts"
  - "packages/core/src/components/builtinIds.ts"
  - "packages/core/src/components/resolve.test.ts"
  - "packages/core/src/components/resolve.ts"
  - "packages/core/src/components/types.ts"
  - "packages/core/src/config/config.ts"
  - "packages/core/src/config/types.ts"
  - "packages/core/src/documents/cloneDocumentForDuplicate.test.ts"
  - "packages/core/src/documents/cloneDocumentForDuplicate.ts"
  - "packages/core/src/globals/types.ts"
  - "packages/next/package.json"
  - "packages/next/src/NextAdminLayoutClient.tsx"
  - "packages/next/src/NextAdminPage.test.ts"
  - "packages/next/src/NextAdminPage.tsx"
  - "packages/next/src/navigation/index.ts"
  - "packages/next/src/navigation/useNextNavigate.ts"
  - "packages/next/src/navigation/useNextNavigationBlocker.test.ts"
  - "packages/next/src/navigation/useNextNavigationBlocker.ts"
  - "packages/react/src/admin/adminHref.test.ts"
  - "packages/react/src/admin/adminHref.ts"
  - "packages/react/src/collections/CollectionDeleteAction.tsx"
  - "packages/react/src/collections/CollectionDuplicateAction.tsx"
  - "packages/react/src/collections/CollectionEditView.test.tsx"
  - "packages/react/src/collections/CollectionEditView.tsx"
  - "packages/react/src/collections/CreateDocumentForm.tsx"
  - "packages/react/src/collections/CreateDocumentModal.tsx"
  - "packages/react/src/collections/index.ts"
  - "packages/react/src/collections/useDuplicateCollectionDocument.ts"
  - "packages/react/src/config/index.ts"
  - "packages/react/src/config/useFrameworkComponents.ts"
  - "packages/react/src/config/useVexNavigate.test.tsx"
  - "packages/react/src/config/useVexNavigate.ts"
  - "packages/react/src/documents/DocumentEditRuntimeContext.tsx"
  - "packages/react/src/documents/DocumentEditSlotOutlet.test.tsx"
  - "packages/react/src/documents/DocumentEditSlotOutlet.tsx"
  - "packages/react/src/documents/DocumentSaveAction.tsx"
  - "packages/react/src/documents/VexDocumentContext.test.tsx"
  - "packages/react/src/documents/VexDocumentContext.tsx"
  - "packages/react/src/documents/documentEditBuiltinContributions.ts"
  - "packages/react/src/documents/index.ts"
  - "packages/react/src/forms/UnsavedChangesDialog.tsx"
  - "packages/react/src/forms/useUnsavedChangesGuard.test.tsx"
  - "packages/react/src/forms/useUnsavedChangesGuard.ts"
  - "packages/react/src/globals/GlobalEditView.tsx"
  - "packages/react/src/index.ts"
  - "packages/react/src/livePreview/LivePreviewToggleAction.tsx"
  - "packages/react/src/livePreview/index.ts"
  - "packages/react/src/slots/ComponentErrorBoundary.test.tsx"
  - "packages/react/src/slots/ComponentErrorBoundary.tsx"
  - "packages/react/src/slots/SlotOverrideOutlet.test.tsx"
  - "packages/react/src/slots/SlotOverrideOutlet.tsx"
  - "packages/react/src/slots/resolveFieldCellComponent.test.tsx"
  - "packages/react/src/slots/resolveFieldCellComponent.tsx"
  - "packages/react/src/slots/resolveFieldComponent.test.tsx"
  - "packages/react/src/slots/resolveFieldComponent.tsx"
  - "packages/react/src/testing/fieldCellContract.ts"
  - "packages/react/src/versions/DraftToolbar.tsx"
  - "packages/react/src/versions/VersionHistoryAction.tsx"
  - "packages/react/src/versions/VersionPublishAction.tsx"
  - "packages/react/src/versions/VersionUnpublishAction.tsx"
  - "packages/react/src/versions/index.ts"
  - "packages/react/src/versions/useAutosave.test.tsx"
  - "packages/react/src/versions/useAutosave.tsx"
prompt_version: 1
---

# 2026-10-26-edit-view-overhaul — Tasks

> Launch-plan spec **H**, interviewed 2026-10-26. Builds on G's slot layer (`6764c26`) and
> K's form layer (`f837f20`). High-care: the developer implements, and `spec.md` gives guided stubs.
> Every step leaves `pnpm typecheck && pnpm test` green.
>
> **Dropped from the brief:** the document-level error summary. Jump-to-first-error already
> ships (`forms/AppForm.tsx` `focusFirstFieldError` plus the tab/collapsible reveal), and the
> duplicate fallback reuses it.
> **Out of scope:** concurrent-edit conflicts, server-component slots (S14), `list.*` and shell
> slots, the TanStack Start adapter implementation, per-field duplicate opt-out, and an
> error-summary banner.

## Step 1 — Collections move to `/admin/collections/<slug>` [agent]
Why: small, isolated breaking change. Later steps (duplicate navigation, guard tests) build URLs through the final helper.
Verify: pnpm typecheck && pnpm --filter @vexcms/react test -- adminHref && pnpm --filter @vexcms/next test -- NextAdminPage; in the browser, `/admin/collections/posts` renders and `/admin/posts` returns 404
- [ ] `packages/react/src/admin/adminHref.ts` + `adminHref.test.ts`: collection targets emit `/<base>/collections/<slug>[/<id>]`
- [ ] `packages/next/src/NextAdminPage.tsx` + `NextAdminPage.test.ts`: parse `collections/<slug>[/<id>]` and `globals/<slug>`; any other first segment returns `notFound()`
- [ ] Sweep hardcoded `/admin/<slug>` strings across `packages/*/src`, `apps/test`, `apps/www` and the templates so they use `adminHref`
- [ ] `.changeset/admin-collections-route.md`: breaking, old URLs 404

## Step 2 — Core edit-view slot model [dev]
Why: S12 says slot IDs, prop types and config keys live in core. Every React step that follows renders against them.
Verify: pnpm typecheck && pnpm --filter @vexcms/core test -- components config
- [ ] `packages/core/src/components/types.ts`: add `edit.header.actions`, `edit.header.before`, `edit.header.after`, `edit.beforeFields`, `edit.afterFields`, `edit.sidebar.before` and `edit.sidebar.after` to `SLOT_IDS`, plus `EditSlotProps`
- [ ] `packages/core/src/components/builtinIds.ts`: `edit.{save, publish, unpublish, delete, duplicate, versionHistory, livePreview}` → `vex.*`
- [ ] Config inputs: `admin.components.edit.*` on root `AdminComponentsInput`, collection and global admin config; resolved shapes in `config.ts`
- [ ] Built-in wrapping by id (S3/S9): `admin.components.edit.header.overrides: { [builtinId]: ComponentOverrideInput[] }`, a sibling of `header.actions`, which is the only slot carrying built-ins. The key is the built-in being wrapped; each entry's `id` names the wrapper. Array order = composition order (first = outermost); each wrapper receives `renderDefault`. An override keyed by an id that isn't in the resolved list is a `VexComponentConfigError`. Core `resolveEditSlot` merges builtins → root → resource per flat slot id.
- [ ] Override `id` semantics unchanged from G: author-chosen, unique per chain (duplicate → `VexComponentConfigError`), used for `displayName` and error messages
- [ ] `packages/core/src/components/resolve.ts` + `resolve.test.ts`: merge root, then resource-level lists, with ordering, hide and wrap across levels

## Step 3 — `useVexDocument` + document context [dev]
Why: S5 hook that built-in and third-party contributions read. Must exist before the built-ins are extracted.
Verify: pnpm --filter @vexcms/react test -- useVexDocument
- [ ] `packages/react/src/documents/VexDocumentContext.tsx` + test: `{ kind, slug, id?, saved, isDirty, status?, canEdit }`; throws outside the provider
- [ ] Export from the package barrel alongside `useVexPermissions`

## Step 4 — Edit-view slots + built-in actions as contributions [dev]
Why: first visual result. Both edit views render through `SlotOutlet`, and the duplicate and guard steps plug into this structure.
Verify: pnpm --filter @vexcms/react test -- CollectionEditView GlobalEditView slots viewSuite; in `apps/test`, header actions render unchanged
- [ ] `packages/react/src/documents/DocumentEditRuntimeContext.tsx`: view-local state (viewed version, post-save id repoint, live-preview toggle) that `useVexDocument` omits
- [ ] `packages/react/src/documents/DocumentEditSlotOutlet.tsx` + test: resolves one `edit.*` slot via `resolveEditSlot`, applies `header.overrides`
- [ ] `packages/react/src/documents/DocumentSaveAction.tsx`, `packages/react/src/versions/{VersionPublishAction,VersionUnpublishAction,VersionHistoryAction}.tsx`, `packages/react/src/livePreview/LivePreviewToggleAction.tsx`, `packages/react/src/collections/CollectionDeleteAction.tsx` + `packages/react/src/documents/documentEditBuiltinContributions.ts` (`documentEditBuiltinContributions()`, shared built-ins only). `vex.delete` is new, collection-only, and appended directly by `CollectionEditView.tsx` rather than returned by `documentEditBuiltinContributions`
- [ ] Mount `VexDocumentProvider`, `DocumentEditRuntimeProvider` and all seven outlets in both edit views; keep the sticky header; delete `versions/DraftToolbar.tsx` (`StatusBadge` stays inline)
- [ ] Tests: root, collection and global contributions render in order/before/after; a built-in is hidden, reordered and wrapped by id; a throwing contribution shows inline and the view survives
- [ ] `packages/react/src/slots/ComponentErrorBoundary.tsx` (optional `fallback`) + `SlotOverrideOutlet.tsx` + `resolveFieldComponent.tsx` + `resolveFieldCellComponent.tsx`: each override layer gets its own `ComponentErrorBoundary` keyed by the override `id`. On a throw, render the layer beneath plus an inline error naming the id. Update G's override tests; add a case for a throwing wrapper on a field and on `vex.save`

## Step 5 — Core duplicate payload [dev]
Why: pure leaf the React action consumes. Item-id regeneration and stripping framework fields are testable without UI.
Verify: pnpm --filter @vexcms/core test -- duplicate
- [ ] `packages/core/src/documents/cloneDocumentForDuplicate.ts` + test: strip `_id`, `_creationTime`, the `vex_*` version fields (`removeVexFields`) and `updatedAt`; regenerate array/block item ids (reuse `cloneBlockWithFreshIds`); walk nested group/tabs/blocks
- [ ] `packages/core/src/collections/api/create/server.ts`: optional `status` arg so a duplicate can force a draft

## Step 6 — Duplicate action + fallback modal [dev]
Why: user-facing duplicate. On success, create and navigate; on failure, open a full prefilled form that auto-submits so the failing field is focused.
Verify: pnpm --filter @vexcms/react test -- CollectionEditView CreateDocumentForm CreateDocumentModal; in the browser, duplicate a post and land on the new id; duplicate with a unique-slug conflict, the modal opens and focuses the slug
- [ ] `packages/react/src/collections/useDuplicateCollectionDocument.ts` + `CollectionDuplicateAction.tsx`: `vex.duplicate` in `edit.header.actions` (non-media collections only; gated on `create` permission; appended directly by `CollectionEditView.tsx`). Step 6 navigates with `window.location.assign`; Step 7 swaps it
- [ ] `CreateDocumentForm`/`CreateDocumentModal`: `fieldsMode?: "required" | "all"`, `initialValues?`, `submitOnOpen?`
- [ ] `packages/react/src/collections/CollectionEditView.test.tsx`: duplicate cases (success, conflict fallback, versioned → draft). Not `viewSuite.ts`, whose shared kit cannot host a module-level `vi.mock`

## Step 7 — Navigation-guard adapter contract + React guard + `useVexNavigate` [dev]
Why: `@vexcms/react` defines interception and programmatic navigation framework-neutrally. Testable with a fake adapter before Next implements it.
Verify: pnpm --filter @vexcms/react test -- useUnsavedChangesGuard useVexNavigate useAutosave
- [ ] `packages/react/src/config/useFrameworkComponents.ts`: `navigationBlocker?` and `useNavigate?` on `FrameworkComponents`; barrel exports
- [ ] `packages/react/src/versions/useAutosave.tsx` + tests: `hasUnsavedChanges` (debounce pending, saving, or error)
- [ ] `packages/react/src/forms/useUnsavedChangesGuard.ts` + `UnsavedChangesDialog.tsx` + tests: dirty = `!isDefaultValue`, or `hasUnsavedChanges` on autosave docs; `beforeunload` while blocking; `UnsavedChangesGuardContext` carries `release` + `attemptNavigation`
- [ ] `packages/react/src/config/useVexNavigate.ts` + tests: consults the guard, falls back to `window.location.assign`
- [ ] Wire into both edit views; `CollectionDeleteAction.tsx` and `useDuplicateCollectionDocument.ts` swap to `useVexNavigate`, calling `release()` first

## Step 8 — Next.js navigation-guard implementation [dev]
Why: real interception for the only shipped adapter. Covers link clicks and back/forward, and implements `useNavigate`. No `pushState` patching (spec decision 3).
Verify: pnpm --filter @vexcms/next test; browser smoke on a dirty form: sidebar link → dialog; Back → dialog, Stay keeps the URL; reload → native prompt; saved autosave doc → no prompt; delete → no prompt
- [ ] `packages/next/src/navigation/useNextNavigationBlocker.ts` + test: document capture-phase click interception + popstate sentinel
- [ ] `packages/next/src/navigation/useNextNavigate.ts` + `index.ts`
- [ ] `packages/next/src/NextAdminLayoutClient.tsx`: provide both; `packages/next/package.json`: jsdom/testing-library devDependencies

## Step 9 — Dogfood, docs, bookkeeping [dev]
Why: proves the acceptance criteria end-to-end and documents the new public surface.
Verify: pnpm build && pnpm test; manual smoke of every acceptance bullet in `apps/test`
- [ ] `apps/test`: one contribution each at root, collection and global level; one hidden and one wrapped built-in
- [ ] `apps/docs/src/content/docs/guides/admin-customization.mdx`: edit-view slots, built-in ids, `header.overrides`, `useVexDocument`, `useVexNavigate`; `framework-adapters.md`: `navigationBlocker` + `useNavigate`
- [ ] Changesets for slots, duplicate and guard
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md`: mark G done, H done, note the dropped error summary

## Step 10 — Regression review against origin/dev [agent]
Why: H moves the edit views' controls into built-ins spread across `documents/`, `versions/`, `livePreview/` and `collections/`. Prove nothing was lost (tests, Tailwind styles, exported API/features) — only additions.
Verify: the Findings table in `spec.md`'s Step 10 is empty, and `pnpm typecheck && pnpm test && pnpm build` is green
- [ ] `git fetch origin dev`; `git diff --stat origin/dev...HEAD`
- [ ] Tests: `git diff --name-status origin/dev...HEAD -- '*.test.*'` has no `D` (renames listed as `R`); per-surviving-file `it(`/`test(` count on HEAD `>=` on `origin/dev`; the only allowed drops are cases covering the retired `DraftToolbar.tsx`, each paired with its replacement (decision 16)
- [ ] Tailwind: for every changed `.tsx` under `packages/react/src`, diff `className`/`cn()`/`cva()` token sets against `origin/dev` (throwaway node script, not committed); every token removed from `CollectionEditView.tsx`, `GlobalEditView.tsx` or `versions/DraftToolbar.tsx` must reappear in the built-in that took over that markup — map sticky header, button variants, responsive classes explicitly; report leftovers
- [ ] Features/API: diff the export lists of `packages/{core,react,next}/src/index.ts` and every changed component's props type against `origin/dev`; each removal needs a numbered spec decision or it's a finding
- [ ] `pnpm typecheck && pnpm test && pnpm build`
- [ ] Record findings in `spec.md`'s `#### Findings` table; fixes restore what was lost only (no refactors, no new features); repeat until the table is empty
