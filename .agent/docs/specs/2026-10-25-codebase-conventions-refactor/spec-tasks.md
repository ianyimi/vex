---
status: draft
spec_id: 2026-10-25-codebase-conventions-refactor
touches:
  - scripts/export-names.mjs
  - scripts/move-modules.mjs
  - packages/core/src/**
  - packages/core/package.json
  - packages/core/tsup.config.ts
  - packages/react/src/**
  - packages/react/package.json
  - packages/react/tsup.config.ts
  - packages/next/src/**
  - packages/richtext-plate/src/**
  - packages/better-auth/src/**
  - packages/file-storage-convex/src/**
  - packages/create-vexcms/templates/**
  - apps/test/**
  - apps/www/**
  - apps/docs/src/content/docs/**
  - apps/docs/astro.config.mjs
  - .changeset/codebase-conventions-refactor.md
  - .agent/docs/standards/**
---

# 2026-10-25-codebase-conventions-refactor — Tasks

Launch-plan § K (`.agent/docs/product/v0.1.0-launch-plan.md`) holds the findings and the 12
interview decisions this spec implements. Steps 0–7 are core, 8–19 React (8–14 the form
layer, 15–19 the move to top-level feature folders via `scripts/move-modules.mjs`), 21 is the
smoke pass, 22 the first review. Each review round appends a `Pass N decisions` step group after
step 22 and before step 23; step 23 (record + enforce) runs once, after the last round.

## Step 0 — Export-name baseline script [agent]
Why: the `@vexcms/core/server` / `@vexcms/core` public surface must be provably unchanged by the moves (decision 4: only `./convex` disappears).
Verify: `node scripts/export-names.mjs --write` writes `.agent/docs/specs/2026-10-25-codebase-conventions-refactor/export-names.baseline.json`; `node scripts/export-names.mjs --check` exits 0.
- [x] `scripts/export-names.mjs` — builds core + react, imports every package entry, writes/compares sorted export-name lists
- [x] baseline JSON committed

## Step 1 — `src/documents/`: all document types out of `api/convex.ts` [agent]
Why: decision 5; `VexDocument`/`TDocument`/`VexVersionDocument`/`VexMediaDocument` all move to `documents/types.ts`, which breaks the `api/convex.ts:5` ↔ `versions/model.ts` cycle without moving any version constant — `documents/types.ts` reads `VERSION_SYSTEM_FIELDS`/`VexVersionStatus` directly from `../versions/constants`, never the `../versions` barrel.
Verify: `pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/core test`
- [x] `packages/core/src/documents/types.ts` (+ `index.ts`) — `VexDocument`/`TDocument`/`VexVersionDocument`/`VexMediaDocument` moved from `api/convex.ts`
- [x] `packages/core/src/versions/index.ts` — explicit re-export of `VexVersionDocument` from `../documents/types`
- [x] `packages/core/src/media/index.ts` — explicit re-export of `VexMediaDocument` from `../documents/types`
- [x] `api/convex.ts` trimmed to its remaining per-domain arg types and `vexConvexApi` (both move out in Steps 3–7); import header updated
- [x] every importer of `VexDocument`/`TDocument`/`VexVersionDocument`/`VexMediaDocument` from `api/convex` repointed (`collections/types.ts`, `editor/types.ts`, `fields/*`, `livePreview/`, `revalidate/`, `routes/types.ts`, `types/generated.ts`, `versions/model.ts`, `src/index.ts`)
## Step 2 — `src/db/` read/write pipeline; access dispatchers into `access/` [agent]
Why: decision 2; `prepareEdit`, `populate`, `depth`, `queryArgs`, `triggers`, ctx narrowing and `stampUpdatedAt` are the shared pipeline every domain `api/` calls.
Verify: `pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/core test`
- [x] `git mv` `api/{prepareEdit,populate,depth,queryArgs,triggers}.ts` (+ tests) → `db/`
- [x] `api/utils.ts` split: `toVexQueryCtx`, `toVexMutationCtx`, `stampUpdatedAt`, `resolveCollectionSlug`, `readableDocuments` → `db/context.ts` / `db/documents.ts`; `resolveAccessCall`, `resolveReadCall` → `access/resolveAccessCall.ts`, `access/resolveReadCall.ts` (+ split tests)
- [x] cross-domain API types (`VexApiAuth`, `PaginationResult`, `PopulateShape`, `AccessCallOptions`, call-action types) → `db/types.ts`; `VexCallbackApi` stays with the entry (step 7)
- [x] `api/test/` (convex-test fixture) → `db/test/`; `standards/testing/convex-integration-testing.md` path updated
- [x] `db/index.ts` barrel; importers repointed (`versions/{publish,saveDraft,unpublish}.ts`, `media/api/*`, `livePreview/resolveUrl.server.ts`, `access/*`, `fields/*`)
## Step 3 — `collections/api/` [agent]
Why: decision 1; collection operations live with the collection domain under `<op>/server.ts`.
Verify: `pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/core test`
- [x] `git mv` `api/{find,get,search,create,update,remove,publishedSlugs}/` → `collections/api/`
- [x] `collections/api/types.ts` — `git mv` of the Step-2-trimmed `api/types.ts`, plus `VexFindArgs`/`VexFindPaginatedArgs`/`VexGetArgs`/`VexSearchArgs`/`VexCreateArgs`/`VexUpdateArgs`/`VexRemoveArgs` cut from `api/convex.ts`
- [x] `collections/api/collectionsApi.ts` — `collectionsApi` moved out of `api/server.ts:408`
- [x] `collections/api/index.ts` barrel
## Step 4 — `globals/api/` [agent]
Why: decision 1; globals ops converted from `<op>.server.ts` to `<op>/server.ts`; decision 5 moves the `VexGlobals*` arg types here from `api/convex.ts`.
Verify: `pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/core test`
- [x] `api/globals/{find,get,upsert}.server.ts` (+ tests) → `globals/api/{find,get,upsert}/server.ts`
- [x] `api/globals/{types,utils}.ts` → `globals/api/`; `VexGlobalsGetArgs`/`VexGlobalsFindArgs`/`VexGlobalsUpdateArgs` cut from `api/convex.ts` appended to `globals/api/types.ts`
- [x] `globals/api/globalsApi.ts` — from `api/server.ts:626`; `globals/api/index.ts`
## Step 5 — `versions/api/` [agent]
Why: decisions 1 + 3 + 5; dispatchers beside the domain write logic they call, and the `VexSaveDraft*`/`VexPublish*`/`VexUnpublish*`/`VexListVersions*`/`VexGetVersionSnapshot*`/`VexDeleteVersion*` arg types land in this domain's own `api/types.ts` instead of `api/convex.ts`.
Verify: `pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/core test`
- [x] `api/versions/<op>.server.ts` (+ tests) → `versions/api/<op>/server.ts` for `saveDraft`, `publish`, `unpublish`, `listVersions`, `getVersionSnapshot`, `deleteVersion`, `backfillStatus`, `history`
- [x] `api/versions/types.ts` → `versions/api/types.ts`, plus `VexSaveDraftArgs`/`VexPublishArgs`/`VexUnpublishArgs`/`VexListVersionsArgs`/`VexGetVersionSnapshotArgs`/`VexDeleteVersionArgs` cut from `api/convex.ts`
- [x] `versions/api/versionsApi.ts` — from `api/server.ts:741`; `versions/api/index.ts`
- [x] `api/convex.test.ts` → `versions/api/versionsApi.test.ts`
## Step 6 — `media/api/` to the same scheme [agent]
Why: decision 1; the third scheme (`queries.ts` / `mutations.ts`) goes; decision 5 moves the `VexMedia*` arg/return types here from `api/convex.ts`.
Verify: `pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/core test`
- [x] each query/mutation in `media/api/{queries,mutations}.ts` → `media/api/<op>/server.ts` (+ tests split from `mutations.test.ts`)
- [x] `media/api/server.ts` → `media/api/mediaApi.ts`; `index.ts` re-exports only
- [x] `VexMediaGenerateUploadUrlArgs`/`VexMediaGenerateUploadUrlReturn`/`VexMediaCreateMediaDocumentArgs`/`VexMediaCreateMediaDocumentReturn`/`VexMediaDeleteMediaArgs`/`VexMediaDeleteMediaReturn`/`VexMediaGetUrlArgs`/`VexMediaGetUrlReturn` cut from `api/convex.ts` appended to `media/api/types.ts`
## Step 7 — Entry `src/server.ts`, delete `src/api/`, drop `./convex`, `vexConvexApi` → its own file [agent]
Why: decision 4 (one server entry, `src/api/` gone, the alias removed) and decision 5 (`api/convex.ts`'s last remaining export, `vexConvexApi`, gets a file named after it rather than surviving as a renamed `documents/types.ts` leftover).
Verify: `pnpm --filter @vexcms/core build && node scripts/export-names.mjs --check` (diff = `./convex` entry only) `&& pnpm typecheck && pnpm test`
- [x] `src/server.ts` — the barrel from `api/server.ts:67-120` repointed + `createVexCallbackApi`, `vexServerApi`, `resolveGetAuth`, bound types; `src/server.test.ts`
- [x] `src/vexConvexApi.ts` — `vexConvexApi` moved out of `api/convex.ts`, the file then deleted
- [x] `api/convex.test.ts` already moved to `versions/api/versionsApi.test.ts` in Step 5 — nothing left to delete here beyond `api/convex.ts` itself
- [x] `packages/core/package.json` `exports`: `./server` → `src/server.ts`, `./convex` removed; `tsup.config.ts` entry
- [x] `src/index.ts` re-export paths; `vexConvexApi` re-exported from `./vexConvexApi`
- [x] every `@vexcms/core/convex` import in packages, apps, templates, docs → `@vexcms/core/server`
- [x] `.changeset/codebase-conventions-refactor.md` — core: `./convex` removed
- [x] baseline JSON regenerated
## Step 8 — App form foundation: `@vexcms/react/form` [agent]
Why: decisions 7–8; the app form's context, `useAppForm`, field layout, control contract, `AppForm` and the shared form helpers it needs, as their own entry.
Verify: `pnpm --filter @vexcms/react build` emits `dist/form/index.js`; `pnpm --filter @vexcms/react test`
- [x] `packages/react/src/components/ui/field.tsx` (+ barrel export) — shadcn field primitives ported from maprios-app
- [x] `packages/react/src/forms/formContext.ts` — `createFormHookContexts`
- [x] `packages/react/src/forms/types.ts` — `FieldControlProps` (incl. `describedBy`), `RenderControl`, `BaseFormFieldProps`
- [x] `packages/react/src/forms/FormFieldLayout.tsx` (+ test) — label, required marker, description, error (`isFieldShowingError` moved in), `fieldDescribedBy` (derives `${id}-description`/`${id}-error`, shared with field components building `FieldControlProps`), `before`/`after` nodes, built on `components/ui/field.tsx`; `aria-invalid`/`aria-describedby` land on the control, not the `role="group"` wrapper
- [x] `packages/react/src/forms/FormCompactContext.tsx`, `packages/react/src/forms/ArrayItemHeaderContext.ts` — moved from `components/form/`; every importer repointed
- [x] `packages/react/src/forms/AppForm.tsx` (+ test) — ported from `components/form/AppForm.tsx`, providing the app form's `formContext` instead of `AppFormContext`
- [x] `packages/react/src/forms/changedValues.ts` (+ test) — moved from `components/form/`; every importer repointed; not re-exported from `forms/index.ts`
- [x] `packages/react/src/forms/useAppForm.ts` — `createFormHook` (field components registered in steps 9–10)
- [x] `packages/react/src/forms/index.ts`; `package.json` `exports["./form"]`; `tsup.config.ts` entry
## Step 9 — App form leaf fields [agent]
Why: decision 7; every scalar field as a `useFieldContext` app-form component with plain props and `renderControl`.
Verify: `pnpm --filter @vexcms/react test`
- [x] `forms/{TextField,TextareaField,EmailField,UrlField,NumberField,CheckboxField,SelectField,DateField,ColorField,JsonField}.tsx` + colocated tests (rendered under a bare `useAppForm`, no `VexConfigProvider`); every default control's `aria-invalid` paired with `aria-describedby` from `fieldDescribedBy`
- [x] registered in `useAppForm.ts` `fieldComponents`
## Step 10 — App form list + container fields [agent]
Why: decision 7; generic list mechanics from `FormArray` / `FormBlocks` without `fieldDef`, config or permissions.
Verify: `pnpm --filter @vexcms/react test`
- [x] `forms/useArrayItems.ts` (+ test) — stable keys, add / insert / duplicate / remove / move / reorder, `atMax`
- [x] `forms/useFieldErrorCount.ts` — the counting/attempt logic `BlocksField` needs, read off `useFormContext()`; a temporary parallel copy of `hooks/useFieldErrorCount.ts`'s pure/context logic, consolidated into one file in step 12 once the admin tree itself mounts under the new form context — `hooks/useFieldErrorCount.ts` cannot be git-mv'd here, since `FormTabs`/`FormCollapsible` (unmigrated until step 13) are still mounted under the old `AppFormContext` at this point in the sequence
- [x] `forms/FormCompactContext.tsx`, `forms/ArrayItemHeaderContext.ts` moved from `components/form/`
- [x] `forms/ArrayField.tsx` (+ test) — header, items, `renderItem`, `itemActions` / `headerActions` slots, collapse/expand all, empty state, add, max, error
- [x] `forms/BlocksField.tsx` (+ test) — accordion items, `blockTypes`, `renderBlock`, optional `cloneBlock` prop (built-in Duplicate only when given), picker (controlled or not), slots, error badge + open-on-failed-submit; items carry `GenericBlockItem`'s `blockType`/`blockName`
- [x] `forms/GroupField.tsx` (+ test) — fieldset layout with `children`
- [x] `components/ui/ActionsMenu.tsx` moved from `components/form/`
## Step 11 — Core: `Input` and `Field` override contracts (additive) [agent]
Why: decision 5; the two override slots exist before the admin fields consume them.
Verify: `pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/core test`
- [x] `packages/core/src/fields/types.ts` — `FieldControlProps` (Input override, now including `describedBy`) and `FieldComponentProps<TField>` (Field override) beside `InputComponentProps`
- [x] `packages/core/src/fields/baseTypes.ts` — `admin.components.Field` override chain beside `Input`; `resolveFieldComponents` carries it
- [x] `packages/core/src/components/types.ts` — slot id for `Field`
- [x] `packages/core/src/framework.ts` — `FieldComponentMap`'s `input` key renamed to `field`
## Step 12 — Admin leaf fields: `fields/<type>/Field.tsx` [agent]
Why: decisions 6–7; admin fields map `fieldDef` → the app form's plain props; the form runs on `useAppForm`.
Verify: `pnpm --filter @vexcms/react typecheck && pnpm --filter @vexcms/react test`
- [x] `packages/react/src/hooks/useFieldControlOverride.ts` — composes `admin.components.Input` (root per-type + field-instance) into one `renderControl`
- [x] `components/fields/<type>/Input.tsx` → `Field.tsx` for text, textarea, email, url, number, checkbox, select, date, color, json (+ tests renamed `Field.test.tsx`); exported component renamed `<Type>FieldAdmin`; every `aria-invalid={controlProps.invalid}` paired with `aria-describedby={controlProps.describedBy}` (no prop destructuring)
- [x] `components/fields/{RenderFields,FieldConditionGate,applyFieldPermissionReadOnly,readableFields}` moved from `components/form/`
- [x] `fields/registry.ts` + `slots/resolveFieldComponent.tsx` (renamed from `resolveFieldInputComponent.tsx`) resolve `Field`; `fields/index.tsx` re-export updated
- [x] `hooks/useFieldsForm.ts` wraps `useAppForm`; `hooks/useVexForm.ts` reads `../form`'s `useFormContext`; admin views import `AppForm` from `../../form`
- [x] `hooks/useFieldErrorCount.ts` deleted; its context-reading/pure logic consolidates into `forms/useFieldErrorCount.ts` (step 10's temporary parallel copy) — every admin importer (`RenderFields.tsx`, and `FormTabs.tsx`/`FormCollapsible.tsx`, unmigrated until step 13 but now mounted under the real `useAppForm` tree as of this step) repointed to it
- [x] `adapter.ts` — every leaf field's `fields[ADMIN_FIELDS.<type>.type]` entry's `input:` key renamed to `field:`, pointing at the new `<Type>FieldAdmin` export
## Step 13 — Admin list, container, layout and custom-widget fields [agent]
Why: decision 7; array / blocks / group / layout / relationship / upload / richtext on the app form.
Verify: `pnpm --filter @vexcms/react test && pnpm --filter @vexcms/richtext-plate test`
- [x] `fields/array/Field.tsx` — `ArrayFieldAdmin` + `PrimitiveArrayItemControl` + registry item render + `array.itemActions` slot (built-ins ported from `FormArray.tsx:65-119`)
- [x] `fields/blocks/Field.tsx` — `BlocksFieldAdmin` + URL picker + permissions + clipboard actions + `cloneBlock={(block) => cloneBlockWithFreshIds(...)}` (matched to the item's `blockType`); `BlockActionsMenu.tsx` + `clipboard.ts` (ported from `FormBlocks.tsx:90-250`) → `fields/blocks/`
- [x] `fields/group/Field.tsx` — `GroupFieldAdmin`; `FormTabs`/`FormCollapsible`/`FormRow`/`FormUI` → `fields/{tabs,collapsible,row,ui}/Field.tsx`
- [x] `fields/relationship/`, `fields/upload/`, `fields/richtext/` — `Field.tsx` (renamed from `Input.tsx`, prop destructuring removed, exported component renamed `RelationshipFieldAdmin`/`UploadFieldAdmin`/`RichTextFieldAdmin`) + custom control files unchanged; `InputTag.tsx` → `components/ui/InputTag.tsx`
- [x] `adapter.ts` — the six composite/custom types' `fields[...]` entries repoint `field:` from the step 12 placeholder components to this step's `ArrayFieldAdmin`/`BlocksFieldAdmin`/`GroupFieldAdmin`/`RelationshipFieldAdmin`/`UploadFieldAdmin`/`RichTextFieldAdmin`
- [x] `packages/richtext-plate/src/editor/PlateEditorField.tsx` confirmed on the control contract (no edit)
## Step 14 — Remove the old form layer; public exports [agent]
Why: clean cutover — no `createFieldInput` path beside the new one.
Verify: `pnpm typecheck && pnpm test && node scripts/export-names.mjs --check`
- [x] delete ALL of `components/form/`, with no exceptions — `AppForm.tsx`, `changedValues.ts` and `index.ts` included, since both already moved to `forms/` (steps 8/10) and every admin importer already repoints to `../../form` / `../form` (steps 8/10/12/13); also `createFieldInput`, `AppFormContext`, `FormLabel`, `FormError`, `FormDescription`, `FormArray`, `FormBlocks`, `FormGroup`, `FormTabs`, `FormCollapsible`, `FormRow`, `FormUI`, `BlockActionsMenu`, `InputTag`, `ActionsMenu`, `FormCompactContext`, `ArrayItemHeaderContext`, `RenderFields`, `FieldConditionGate`, `DocumentTimestamps`, `FieldController` + every colocated test — each already moved by step 8/10/12/13, verify each one is moved or superseded before deleting its original
- [x] `InputComponentProps` removed from core; `testing/fieldInputContract.ts` runs against `Field.tsx`
- [x] `DocumentTimestamps.tsx` → `components/views/`; `packages/react/src/components/form/` directory no longer exists
- [x] `packages/react/src/index.ts` exports: `*FieldInput` renamed `*FieldAdmin` for every admin field component; changeset: react form API + `@vexcms/react/form`
- [x] JSDoc examples, `apps/docs` guides (`admin-customization.mdx`) on the new override contracts
## Step 15 — Move script; shared `ui/`, `utils/`, `config/`, `auth/`, `access/` [agent]
Why: decision 18; the React package moves from `components/`/`context/`/`lib/`/`hooks/` into top-level feature folders mirroring core, via one mechanical codemod reused by steps 15–18.
Verify: `pnpm --filter @vexcms/react typecheck && pnpm --filter @vexcms/react test`
- [x] `scripts/move-modules.mjs` — `git mv`s a `{ from, to }` JSON mapping, then rewrites every relative `import`/`export`/`import()`/`vi.mock()` specifier under `packages/react/src/**/*.{ts,tsx}` that resolves to a moved file, both the moved file's own outgoing imports and every importer that references it; `--dry-run` prints the edits with no write
- [x] `scripts/move-modules.test.mjs` — moved file's own outgoing import, an importer's import, a directory-index import, a `vi.mock` path, all rewritten; `--dry-run` performs no `git mv`/write
- [x] `components/ui/**` (+ `Icon.tsx`) → `ui/`; `styles/utils.ts`'s `cn` → `utils/cn.ts`; `lib/errors.ts` → `utils/errors.ts`; `context/VexConfigContext.tsx` + `useFrameworkComponents.ts` → `config/`; `context/VexAuthContext.tsx` → `auth/`; `usePermission`/`useVexPermissions`/`useCanAccessAdminPanel`/`useFieldPermissions` → `access/`
## Step 16 — `slots/`, `modals/`, `livePreview/`, `revalidate/` [agent]
Why: decision 18; the four cross-cutting infrastructure folders.
Verify: `pnpm --filter @vexcms/react typecheck && pnpm --filter @vexcms/react test`
- [x] `components/slots/**` → `slots/`; `components/modals/{BaseModal,constants.ts}` + `useModalSurface` → `modals/` (`CreateDocumentForm`/`CreateDocumentModal`/`CreateMediaModal` move in step 18)
- [x] `components/livePreview/LivePreviewPanel`, `context/{LivePreviewContext,livePreviewProtocol}`, `useLivePreview*` → `livePreview/`
- [x] `components/RevalidateButton`, `context/VexRevalidateContext`, `useVexRevalidate` → `revalidate/`
## Step 17 — `fields/` + `forms/useVexForm` [agent]
Why: decision 18; every field-type folder and its infrastructure, plus the one hook `forms/` owns beside the app form.
Verify: `pnpm --filter @vexcms/react typecheck && pnpm --filter @vexcms/react test`
- [x] `components/fields/**` → `fields/`; `components/RenderBlocks` → `fields/blocks/`; `components/relationship/**` → `fields/relationship/` (its barrel merged into `fields/relationship/index.ts`, the pre-existing one deleted)
- [x] `useFieldCondition`/`useFieldMask`/`useFieldsForm`/`useLiveFieldMerge`/`useVisibleFields`/`useFieldControlOverride` → `fields/`; `useBlockClipboard` → `fields/blocks/`; `useVexForm` → `forms/`
## Step 18 — `collections/`, `globals/`, `versions/`, `media/`, incl. client ops [agent]
Why: decisions 18–19; the four document-shaped domains, each gaining `api/<op>/client.ts` beside core's `api/<op>/server.ts`.
Verify: `pnpm --filter @vexcms/react typecheck && pnpm --filter @vexcms/react test`
- [x] `client/{find,get,search,create,update,remove}/client.ts` + `client/whereArg.ts` → `collections/api/<op>/client.ts` + `collections/api/whereArg.ts`; `client/globals/<op>.client.ts` → `globals/api/<op>/client.ts`; `client/versions/<op>.client.ts` → `versions/api/<op>/client.ts`; `client/index.ts`'s re-exports confirmed still matching `package.json` `exports["./client"]`
- [x] `CollectionEditView`/`CollectionListView`/`CreateDocumentForm`/`CreateDocumentModal`/`usePaginatedQuery`/`usePaginatedSearch`/`useTableSelection` → `collections/`
- [x] `GlobalEditView`/`GlobalsListView` → `globals/`
- [x] `components/drafts/**`/`useAutosave`/`useResetWhenSaved`/`DocumentTimestamps` (shared by collection + global edit views) → `versions/`
- [x] `components/media/**`/`MediaCollectionEditView`/`MediaCollectionListView`/`CreateMediaModal` → `media/`
## Step 19 — `admin/` + leftover hooks; barrels, deletions, `harness struct` [agent]
Why: decision 18; the last domain folder, the hooks no feature owns, and the cleanup the mechanical moves can't do themselves.
Verify: `pnpm --filter @vexcms/react typecheck && pnpm --filter @vexcms/react test && harness struct --check`
- [x] `AdminLayout`/`AdminSidebar`/`AdminTopNav`/`DashboardView`/`UnauthorizedView`/`views/utils.ts`/`usePreservedScrollTop`/`adminHref` → `admin/`
- [x] every new top-level folder's `index.ts` authored; stale barrels deleted (`hooks/index.ts` trimmed to `use-mobile`/`useVexMutation` only, `context/index.ts`, `components/index.ts`, `components/types.ts`, `components/views/index.tsx`, `components/modals/index.tsx`); `components/`, `context/`, `lib/`, `styles/` deleted
- [x] `packages/react/src/index.ts` and `testing/**` import paths confirmed repointed (auto-rewritten by steps 15–18's script runs)
- [x] `naming-conventions.md` rule `scope`s pointed off the deleted `components/**` at the new top-level folders, so `harness struct --check` passes against the new tree (the new `react-feature-folders` rule itself lands in step 20)
## Step 20 — Known violations + rule updates [agent]
Why: pass 1 scope; the flagged names and the stale rules.
Verify: `harness struct --check && pnpm typecheck`
- [x] `slots/resolveFieldComponent.tsx` / `slots/resolveFieldCellComponent.tsx` → `.ts` if JSX-free, else the rule gains a `resolve*` exemption (decided in the step)
- [x] `media/MediaLibaryGrid.tsx` → `MediaLibraryGrid.tsx`
- [x] `naming-conventions.md`: `vexcms-resource-defs` narrowed to `collections/**`, new `vexcms-block-module` rule; `api-operation-split` → `<domain>/api/<op>/server.ts` + `<domain>Api.ts`; `react-field-module` → `Field.tsx`; new `react-app-form` rule; `react-components-pascal` scope repointed off the deleted `components/**`; new `react-feature-folders` rule for the flat top-level layout

## Step 21 — Browser smoke in `apps/test` [agent]
Why: the form layer is rewritten; tests alone are not proof.
Verify: manual
- [x] create + save a document using every field type; validation error shown on blur and on submit
- [x] array (`tagList`, `gridItems`) + blocks (`content`): add, reorder, duplicate, remove, copy/paste, picker via URL
- [x] one `admin.components.Input` override confirming `{ id, value, onChange, onBlur, readOnly, invalid, describedBy }` and one `admin.components.Field` override (`apps/test`)
- [x] read-only document and permission-denied field
- [x] executed by an agent with the browser tool against the developer's already-running dev server (P-024 — never start one); results recorded in the session log
## Step 22 — Pass 2 review [agent]
Why: derive the conventions from the refactored tree (launch plan § K, "Pass 2 — the review method").
Verify: `review-1.md` exists with every finding classified; developer decisions recorded.
- [x] one reviewer per package/app → `review-1.md` (convention / violation / gap, paths + counts)
- [x] developer decides each violation and gap → `Pass 1 decisions` step group appended below

<!-- Pass N decisions step groups are appended here, one per review round. -->

## Step 24 — Pass 1 decisions [agent]
Why: developer decisions on review-1.md violations/gaps (2026-10-26).
Verify: `pnpm typecheck && pnpm test && harness struct --check && pnpm --filter docs build`
- [x] delete empty files: `packages/core/src/globals/config/{config,types}.ts` (+ dir if empty), `packages/better-auth/src/utils.ts`, `packages/file-storage-convex/src/adapter/types.ts` (review-1 core gap, better-auth + file-storage-convex violations)
- [x] core: `versions/publish.ts` (and any other `versions/*.ts` domain-root file) stops importing from `versions/api/` — move the shared piece down into the domain layer (review-1 core violation "versions layer imports api")
- [x] core: codify `access/` → `collections/`/`globals/` imports (AccessResource, resolveCollectionIndexes) as the documented RBAC exception in `naming-conventions.md` (review-1 core violation "access imports from domains")
- [x] apps/test, apps/www, both create-vexcms templates: rename `component-example.tsx`/`example.tsx` to PascalCase or delete if unused; `motion-primitives/{animated-group,text-effect}.tsx` → PascalCase; update importers (review-1 apps/test, apps/www, create-vexcms naming violations)
- [x] codify app layer folders as the app convention in `naming-conventions.md`: `components/` (PascalCase, `ui/` shadcn kebab), `lib/` (camelCase utils/hooks), `components/providers/` fixed roles (`client`/`server`/`auth`/`convex`), `context/` for `*Context.tsx` (apps/www `CodeHighlightContext.tsx` moves to `context/`); no restructure to feature folders (review-1 create-vexcms layering violations, apps/test + apps/www gaps)
- [x] react: codify as-is — field module may hold `utils.ts` and helper widget components; layout fields (`tabs`/`row`/`collapsible`/`ui`) are `Field.tsx` only; `BlocksField.cloneBlock` stays optional (review-1 react gaps)
- [x] next: codify as-is — root `Next*.tsx` components + capability folders `cache/`, `seo/`, `testing/` (review-1 next gaps)
- [x] docs: add `apps/docs/src/content/docs/fields/richtext.mdx` documenting the richtext field via `@vexcms/richtext-plate` (review-1 apps/docs gap)
- [x] review-2 (Step 22-shaped) over the post-pass-3 tree returns zero open violations/gaps, else append `Pass 2 decisions`

## Step 25 — Pass 2 decisions [agent]
Why: developer decisions on review-2.md violations/gaps (2026-10-26).
Verify: `pnpm typecheck && pnpm test && harness struct --check && node scripts/export-names.mjs --check`
- [x] core: move `flattenGlobalRow` from `globals/api/utils.ts` to `globals/utils.ts`; repoint `db/triggers.ts` and api importers; document db→globals domain-layer import as an exception alongside the access RBAC exception in `naming-conventions.md` (review-2 core violation)
- [x] core: flatten layout fields `fields/ui/{ui,tabs,collapsible,row}/` → `fields/{ui,tabs,collapsible,row}/`; fix barrels/importers; public export names unchanged (review-2 core gap)
- [x] react: delete empty `fields/relationship/utils.ts`, `fields/select/utils.ts` (review-2 react violation; Pass 1 empty-file decision)
- [x] move `CodeHighlightContext.tsx` from `src/components/` to `src/context/` in `apps/test` and `templates/marketing-site`; repoint importers (review-2 apps/test + create-vexcms violation)
- [x] extend `host-app-*` / `react-context-suffix` rule scopes in `naming-conventions.md` to `packages/create-vexcms/templates/*/src/**` per the Pass 1 decision covering templates (review-2 create-vexcms gap)
- [x] file-storage-convex: add `src/adapter/uploadFile.test.ts` (review-2 file-storage-convex gap)
- [x] review-3 over the post-pass tree returns zero open violations/gaps, else append `Pass 3 decisions`

## Step 26 — Pass 3 decisions [agent]
Why: review-3.md violations; both apply codified rules with one obvious fix (2026-10-26).
Verify: `pnpm typecheck && pnpm test && harness struct --check`
- [x] richtext-plate: `editor/components/editorElements.tsx` → `EditorElements.tsx`; repoint importers (review-3 richtext-plate violation)
- [x] marketing-site template: `motion-primitives/{AnimatedGroup,TextEffect}.tsx` import `cn` from `@vexcms/react` (review-3 create-vexcms violation)
- [x] richtext-plate: `render/components/{elements,leaves}.tsx` → `Elements.tsx`/`Leaves.tsx`; extend `react-components-pascal` scope to `packages/richtext-plate/src/**/*.tsx` (review-4 richtext-plate violation)
- [x] review-4 over richtext-plate + create-vexcms (only packages changed since review-3) (+ review-5 richtext-plate after the review-4 fix) returns zero open violations/gaps

## Step 23 — Record and enforce [agent]
Why: decision 10; conventions documented once, enforced by `harness struct --check`.
Verify: `pnpm --filter docs build && harness struct --check && harness doctor`
- [x] `apps/docs/src/content/docs/dev/` — `project-structure.mdx`, `package-layout.mdx`, `naming-conventions.mdx`, `adding-a-field-type.mdx`; `astro.config.mjs` sidebar group
- [x] `.agent/docs/standards/` — `naming-conventions.md` (rules only, links to docs), `frontend/forms.md`, `core/adding-a-field-type.md`, `testing/convex-integration-testing.md`
- [x] `harness struct` regenerated; `tech-stack.md` refreshed; `harness sync`
