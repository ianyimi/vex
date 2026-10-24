---
status: draft
spec_id: 2026-10-16-field-input-consistency-pass
touches:
  - ".agent/docs/product/roadmap.md"
  - ".agent/docs/product/v0.1.0-launch-plan.md"
  - "apps/test/convex/seed.ts"
  - "apps/test/src/vex.config.ts"
  - "apps/test/src/vexcms/blocks/CTA/config.ts"
  - "apps/test/src/vexcms/blocks/CTA/index.tsx"
  - "apps/test/src/vexcms/blocks/Testimonial/config.ts"
  - "apps/test/src/vexcms/collections/pages.ts"
  - "apps/test/src/vexcms/collections/pages.typecheck.ts"
  - "packages/core/src/access/validateAccessConstraints.ts"
  - "packages/core/src/api/create/server.test.ts"
  - "packages/core/src/api/prepareEdit.test.ts"
  - "packages/core/src/api/prepareEdit.ts"
  - "packages/core/src/api/update/server.test.ts"
  - "packages/core/src/auth/types.ts"
  - "packages/core/src/collections/config.test.ts"
  - "packages/core/src/collections/config.ts"
  - "packages/core/src/collections/indexFields.ts"
  - "packages/core/src/collections/interfaceGen.test.ts"
  - "packages/core/src/collections/interfaceGen.ts"
  - "packages/core/src/collections/types.ts"
  - "packages/core/src/collections/utils.test.ts"
  - "packages/core/src/collections/validator.test.ts"
  - "packages/core/src/collections/validator.ts"
  - "packages/core/src/components/builtinIds.ts"
  - "packages/core/src/components/index.ts"
  - "packages/core/src/components/resolve.test.ts"
  - "packages/core/src/components/resolve.ts"
  - "packages/core/src/components/types.ts"
  - "packages/core/src/config/config.test.ts"
  - "packages/core/src/config/config.ts"
  - "packages/core/src/config/types.ts"
  - "packages/core/src/fields/array/config.ts"
  - "packages/core/src/fields/array/index.ts"
  - "packages/core/src/fields/array/inputSchema.test.ts"
  - "packages/core/src/fields/array/inputSchema.ts"
  - "packages/core/src/fields/array/types.ts"
  - "packages/core/src/fields/array/utils.test.ts"
  - "packages/core/src/fields/array/utils.ts"
  - "packages/core/src/fields/array/validator.test.ts"
  - "packages/core/src/fields/array/validator.ts"
  - "packages/core/src/fields/baseTypes.ts"
  - "packages/core/src/fields/blocks/config.ts"
  - "packages/core/src/fields/blocks/index.ts"
  - "packages/core/src/fields/blocks/inputSchema.test.ts"
  - "packages/core/src/fields/blocks/inputSchema.ts"
  - "packages/core/src/fields/blocks/types.ts"
  - "packages/core/src/fields/blocks/utils.test.ts"
  - "packages/core/src/fields/blocks/utils.ts"
  - "packages/core/src/fields/checkbox/config.ts"
  - "packages/core/src/fields/checkbox/types.ts"
  - "packages/core/src/fields/color/config.ts"
  - "packages/core/src/fields/color/types.ts"
  - "packages/core/src/fields/constants.ts"
  - "packages/core/src/fields/date/config.ts"
  - "packages/core/src/fields/date/inputSchema.ts"
  - "packages/core/src/fields/date/types.ts"
  - "packages/core/src/fields/email/config.ts"
  - "packages/core/src/fields/email/index.ts"
  - "packages/core/src/fields/email/inputSchema.test.ts"
  - "packages/core/src/fields/email/inputSchema.ts"
  - "packages/core/src/fields/email/types.ts"
  - "packages/core/src/fields/email/validator.test.ts"
  - "packages/core/src/fields/email/validator.ts"
  - "packages/core/src/fields/group/config.ts"
  - "packages/core/src/fields/group/inputSchema.ts"
  - "packages/core/src/fields/group/types.ts"
  - "packages/core/src/fields/index.ts"
  - "packages/core/src/fields/inputSchemas/index.ts"
  - "packages/core/src/fields/json/config.test.ts"
  - "packages/core/src/fields/json/config.ts"
  - "packages/core/src/fields/json/index.ts"
  - "packages/core/src/fields/json/inputSchema.test.ts"
  - "packages/core/src/fields/json/inputSchema.ts"
  - "packages/core/src/fields/json/types.ts"
  - "packages/core/src/fields/json/validator.test.ts"
  - "packages/core/src/fields/json/validator.ts"
  - "packages/core/src/fields/ui/collapsible/config.test.ts"
  - "packages/core/src/fields/ui/collapsible/config.ts"
  - "packages/core/src/fields/ui/collapsible/index.ts"
  - "packages/core/src/fields/ui/collapsible/types.ts"
  - "packages/core/src/fields/ui/index.ts"
  - "packages/core/src/fields/ui/row/config.test.ts"
  - "packages/core/src/fields/ui/row/config.ts"
  - "packages/core/src/fields/ui/row/index.ts"
  - "packages/core/src/fields/ui/row/types.ts"
  - "packages/core/src/fields/ui/tabs/config.test.ts"
  - "packages/core/src/fields/ui/tabs/config.ts"
  - "packages/core/src/fields/ui/tabs/index.ts"
  - "packages/core/src/fields/ui/tabs/types.ts"
  - "packages/core/src/fields/ui/types.ts"
  - "packages/core/src/fields/ui/ui/config.test.ts"
  - "packages/core/src/fields/ui/ui/config.ts"
  - "packages/core/src/fields/ui/ui/index.ts"
  - "packages/core/src/fields/ui/ui/types.ts"
  - "packages/core/src/fields/ui/utils.test.ts"
  - "packages/core/src/fields/ui/utils.ts"
  - "packages/core/src/fields/mask/index.ts"
  - "packages/core/src/fields/mask/types.ts"
  - "packages/core/src/fields/mask/utils.test.ts"
  - "packages/core/src/fields/mask/utils.ts"
  - "packages/core/src/fields/number/config.ts"
  - "packages/core/src/fields/number/inputSchema.test.ts"
  - "packages/core/src/fields/number/inputSchema.ts"
  - "packages/core/src/fields/number/types.ts"
  - "packages/core/src/fields/number/validator.test.ts"
  - "packages/core/src/fields/number/validator.ts"
  - "packages/core/src/fields/relationship/config.ts"
  - "packages/core/src/fields/relationship/inputSchema.test.ts"
  - "packages/core/src/fields/relationship/inputSchema.ts"
  - "packages/core/src/fields/relationship/types.ts"
  - "packages/core/src/fields/richtext/config.test.ts"
  - "packages/core/src/fields/richtext/config.ts"
  - "packages/core/src/fields/richtext/types.ts"
  - "packages/core/src/fields/select/config.ts"
  - "packages/core/src/fields/select/types.ts"
  - "packages/core/src/fields/text/config.ts"
  - "packages/core/src/fields/text/inputSchema.test.ts"
  - "packages/core/src/fields/text/inputSchema.ts"
  - "packages/core/src/fields/text/types.ts"
  - "packages/core/src/fields/text/validator.test.ts"
  - "packages/core/src/fields/text/validator.ts"
  - "packages/core/src/fields/textarea/config.ts"
  - "packages/core/src/fields/textarea/index.ts"
  - "packages/core/src/fields/textarea/inputSchema.test.ts"
  - "packages/core/src/fields/textarea/inputSchema.ts"
  - "packages/core/src/fields/textarea/types.ts"
  - "packages/core/src/fields/textarea/validator.test.ts"
  - "packages/core/src/fields/textarea/validator.ts"
  - "packages/core/src/fields/types.ts"
  - "packages/core/src/fields/upload/config.test.ts"
  - "packages/core/src/fields/upload/config.ts"
  - "packages/core/src/fields/upload/inputSchema.test.ts"
  - "packages/core/src/fields/upload/inputSchema.ts"
  - "packages/core/src/fields/upload/types.ts"
  - "packages/core/src/fields/url/config.ts"
  - "packages/core/src/fields/url/inputSchema.test.ts"
  - "packages/core/src/fields/url/inputSchema.ts"
  - "packages/core/src/fields/url/types.ts"
  - "packages/core/src/fields/url/validator.test.ts"
  - "packages/core/src/fields/url/validator.ts"
  - "packages/core/src/fields/utils.test.ts"
  - "packages/core/src/fields/utils.ts"
  - "packages/core/src/fields/validateFields.test.ts"
  - "packages/core/src/fields/validators/adminFieldToValidator.test.ts"
  - "packages/core/src/fields/validators/index.ts"
  - "packages/core/src/globals/config.ts"
  - "packages/core/src/globals/interfaceGen.ts"
  - "packages/core/src/globals/types.ts"
  - "packages/core/src/media/types.ts"
  - "packages/core/src/schema/generateVexSchema.test.ts"
  - "packages/core/src/types/generateVexTypes.test.ts"
  - "packages/core/src/versions/assertNoDraftRelationships.ts"
  - "packages/core/src/versions/statusConstraint.ts"
  - "packages/react/package.json"
  - "packages/react/src/adapter.ts"
  - "packages/react/src/components/AdminSidebar.tsx"
  - "packages/react/src/components/AdminTopNav.tsx"
  - "packages/react/src/components/fields/array/Cell.tsx"
  - "packages/react/src/components/fields/array/Input.test.tsx"
  - "packages/react/src/components/fields/array/testFixture.ts"
  - "packages/react/src/components/fields/blocks/Cell.tsx"
  - "packages/react/src/components/fields/blocks/Input.test.tsx"
  - "packages/react/src/components/fields/checkbox/Cell.tsx"
  - "packages/react/src/components/fields/checkbox/Input.tsx"
  - "packages/react/src/components/fields/color/Cell.tsx"
  - "packages/react/src/components/fields/color/Input.tsx"
  - "packages/react/src/components/fields/date/Cell.test.tsx"
  - "packages/react/src/components/fields/date/Cell.tsx"
  - "packages/react/src/components/fields/date/Input.test.tsx"
  - "packages/react/src/components/fields/date/Input.tsx"
  - "packages/react/src/components/fields/date/index.ts"
  - "packages/react/src/components/fields/date/utils.test.ts"
  - "packages/react/src/components/fields/date/utils.ts"
  - "packages/react/src/components/fields/email/Cell.test.tsx"
  - "packages/react/src/components/fields/email/Cell.tsx"
  - "packages/react/src/components/fields/email/Input.test.tsx"
  - "packages/react/src/components/fields/email/Input.tsx"
  - "packages/react/src/components/fields/email/columnDef.test.ts"
  - "packages/react/src/components/fields/email/columnDef.tsx"
  - "packages/react/src/components/fields/email/index.ts"
  - "packages/react/src/components/fields/email/testFixture.ts"
  - "packages/react/src/components/fields/group/Cell.tsx"
  - "packages/react/src/components/fields/index.test.tsx"
  - "packages/react/src/components/fields/index.tsx"
  - "packages/react/src/components/fields/json/Cell.test.tsx"
  - "packages/react/src/components/fields/json/Cell.tsx"
  - "packages/react/src/components/fields/json/Input.test.tsx"
  - "packages/react/src/components/fields/json/Input.tsx"
  - "packages/react/src/components/fields/json/columnDef.test.ts"
  - "packages/react/src/components/fields/json/columnDef.tsx"
  - "packages/react/src/components/fields/json/index.ts"
  - "packages/react/src/components/fields/json/testFixture.ts"
  - "packages/react/src/components/fields/number/Cell.tsx"
  - "packages/react/src/components/fields/number/Input.test.tsx"
  - "packages/react/src/components/fields/number/Input.tsx"
  - "packages/react/src/components/fields/number/testFixture.ts"
  - "packages/react/src/components/fields/registry.ts"
  - "packages/react/src/components/fields/relationship/Cell.tsx"
  - "packages/react/src/components/fields/relationship/EmptyInput.test.tsx"
  - "packages/react/src/components/fields/relationship/EmptyInput.tsx"
  - "packages/react/src/components/fields/relationship/FilledInput.test.tsx"
  - "packages/react/src/components/fields/relationship/FilledInput.tsx"
  - "packages/react/src/components/fields/relationship/Input.test.tsx"
  - "packages/react/src/components/fields/relationship/Input.tsx"
  - "packages/react/src/components/fields/relationship/index.ts"
  - "packages/react/src/components/fields/relationship/testFixture.ts"
  - "packages/react/src/components/fields/relationship/types.ts"
  - "packages/react/src/components/fields/richtext/Cell.tsx"
  - "packages/react/src/components/fields/select/Cell.tsx"
  - "packages/react/src/components/fields/select/Input.test.tsx"
  - "packages/react/src/components/fields/select/Input.tsx"
  - "packages/react/src/components/fields/text/Cell.tsx"
  - "packages/react/src/components/fields/text/Input.test.tsx"
  - "packages/react/src/components/fields/text/Input.tsx"
  - "packages/react/src/components/fields/textarea/Cell.test.tsx"
  - "packages/react/src/components/fields/textarea/Cell.tsx"
  - "packages/react/src/components/fields/textarea/Input.test.tsx"
  - "packages/react/src/components/fields/textarea/Input.tsx"
  - "packages/react/src/components/fields/textarea/columnDef.test.ts"
  - "packages/react/src/components/fields/textarea/columnDef.tsx"
  - "packages/react/src/components/fields/textarea/index.ts"
  - "packages/react/src/components/fields/textarea/testFixture.ts"
  - "packages/react/src/components/fields/upload/Cell.tsx"
  - "packages/react/src/components/fields/upload/EmptyInput.tsx"
  - "packages/react/src/components/fields/upload/FilledInput.tsx"
  - "packages/react/src/components/fields/upload/Input.test.tsx"
  - "packages/react/src/components/fields/upload/utils.ts"
  - "packages/react/src/components/fields/url/Cell.tsx"
  - "packages/react/src/components/fields/url/Input.test.tsx"
  - "packages/react/src/components/fields/url/Input.tsx"
  - "packages/react/src/components/form/BlockActionsMenu.test.tsx"
  - "packages/react/src/components/form/BlockActionsMenu.tsx"
  - "packages/react/src/components/form/DocumentTimestamps.test.tsx"
  - "packages/react/src/components/form/DocumentTimestamps.tsx"
  - "packages/react/src/components/form/FieldConditionGate.tsx"
  - "packages/react/src/components/form/FormArray.test.tsx"
  - "packages/react/src/components/form/FormArray.tsx"
  - "packages/react/src/components/form/FormBlocks.test.tsx"
  - "packages/react/src/components/form/FormBlocks.tsx"
  - "packages/react/src/components/form/FormCollapsible.test.tsx"
  - "packages/react/src/components/form/FormCollapsible.tsx"
  - "packages/react/src/components/form/FormError.tsx"
  - "packages/react/src/components/form/FormGroup.tsx"
  - "packages/react/src/components/form/FormRow.test.tsx"
  - "packages/react/src/components/form/FormRow.tsx"
  - "packages/react/src/components/form/FormTabs.test.tsx"
  - "packages/react/src/components/form/FormTabs.tsx"
  - "packages/react/src/components/form/FormUI.test.tsx"
  - "packages/react/src/components/form/FormUI.tsx"
  - "packages/react/src/components/form/RenderFields.test.tsx"
  - "packages/react/src/components/form/RenderFields.tsx"
  - "packages/react/src/components/form/applyFieldPermissionReadOnly.test.ts"
  - "packages/react/src/components/form/applyFieldPermissionReadOnly.ts"
  - "packages/react/src/components/form/constants.ts"
  - "packages/react/src/components/form/index.ts"
  - "packages/react/src/components/media/MediaLibaryGrid.tsx"
  - "packages/react/src/components/media/MediaPicker.test.tsx"
  - "packages/react/src/components/media/MediaPicker.tsx"
  - "packages/react/src/components/modals/CreateDocumentForm.test.tsx"
  - "packages/react/src/components/modals/CreateDocumentForm.tsx"
  - "packages/react/src/components/modals/CreateDocumentModal.tsx"
  - "packages/react/src/components/modals/constants.ts"
  - "packages/react/src/components/modals/index.tsx"
  - "packages/react/src/components/relationship/RelationshipDocumentList.test.tsx"
  - "packages/react/src/components/relationship/RelationshipDocumentList.tsx"
  - "packages/react/src/components/relationship/RelationshipPicker.test.tsx"
  - "packages/react/src/components/relationship/RelationshipPicker.tsx"
  - "packages/react/src/components/relationship/index.ts"
  - "packages/react/src/components/slots/ComponentErrorBoundary.test.tsx"
  - "packages/react/src/components/slots/ComponentErrorBoundary.tsx"
  - "packages/react/src/components/slots/SlotOutlet.test.tsx"
  - "packages/react/src/components/slots/SlotOutlet.tsx"
  - "packages/react/src/components/slots/SlotOverrideOutlet.test.tsx"
  - "packages/react/src/components/slots/SlotOverrideOutlet.tsx"
  - "packages/react/src/components/slots/index.ts"
  - "packages/react/src/components/slots/resolveFieldCellComponent.test.ts"
  - "packages/react/src/components/slots/resolveFieldCellComponent.ts"
  - "packages/react/src/components/slots/resolveFieldInputComponent.test.ts"
  - "packages/react/src/components/slots/resolveFieldInputComponent.ts"
  - "packages/react/src/components/ui/data-table/DataTable.tsx"
  - "packages/react/src/components/ui/multi-select.tsx"
  - "packages/react/src/components/views/CollectionEditView.tsx"
  - "packages/react/src/components/views/CollectionListView.tsx"
  - "packages/react/src/components/views/DashboardView.tsx"
  - "packages/react/src/components/views/GlobalEditView.tsx"
  - "packages/react/src/components/views/GlobalsListView.tsx"
  - "packages/react/src/components/views/MediaCollectionEditView.tsx"
  - "packages/react/src/components/views/MediaCollectionListView.tsx"
  - "packages/react/src/hooks/index.ts"
  - "packages/react/src/hooks/useBlockClipboard.test.ts"
  - "packages/react/src/hooks/useBlockClipboard.ts"
  - "packages/react/src/hooks/useFieldCondition.test.tsx"
  - "packages/react/src/hooks/useFieldCondition.ts"
  - "packages/react/src/hooks/useFieldErrorCount.test.tsx"
  - "packages/react/src/hooks/useFieldErrorCount.ts"
  - "packages/react/src/hooks/useFieldMask.test.ts"
  - "packages/react/src/hooks/useFieldMask.ts"
  - "packages/react/src/hooks/useFieldsForm.test.ts"
  - "packages/react/src/hooks/useFieldsForm.ts"
  - "packages/react/src/hooks/useModalSurface.test.tsx"
  - "packages/react/src/hooks/useModalSurface.tsx"
  - "packages/react/src/hooks/usePaginatedSearch.test.tsx"
  - "packages/react/src/hooks/usePaginatedSearch.ts"
  - "packages/react/src/hooks/useRelationshipPickerOptions.ts"
  - "packages/react/src/hooks/useVexForm.test.tsx"
  - "packages/react/src/hooks/useVexForm.ts"
  - "packages/react/src/hooks/useVexPermissions.test.tsx"
  - "packages/react/src/hooks/useVexPermissions.ts"
  - "packages/react/src/index.ts"
  - "packages/react/src/testing/dataTableSuite.tsx"
  - "packages/react/src/testing/fieldInputContract.ts"
  - "packages/react/src/testing/fixtures/index.ts"
  - "packages/react/src/testing/hooksSuite.tsx"
  - "packages/react/src/testing/mediaSuite.tsx"
  - "packages/react/src/testing/nestedFieldContainer.ts"
  - "packages/react/src/utils/adminHref.test.ts"
  - "packages/react/src/utils/adminHref.ts"
  - "pnpm-workspace.yaml"
prompt_version: 1
---

# 2026-10-16-field-input-consistency-pass — Tasks

> Launch-plan spec **G**, re-scoped 2026-10-16 in the dev-spec interview. Absorbs H's
> block-editing items and the previously deferred `email()` / `textarea()` / `json()`
> leaf fields and `tabs`. Docs pages, changesets, `create-vexcms` templates and the CLI
> are deliberately NOT here — they land in the commit phase after `apps/www` adopts the
> new fields (Out of Scope). Every step leaves `pnpm typecheck && pnpm test` green.

## Step 1 — `min`/`max` become `number | [number, string]` everywhere [agent]
Why: one limit shape before any new field (textarea) or UI (counters) consumes it; breaking change pre-0.1.0.
Verify: pnpm typecheck && pnpm --filter @vexcms/core test -- fields && pnpm --filter @vexcms/react test -- fields
- [x] `packages/core/src/fields/baseTypes.ts` — `FieldLimitInput`, `FieldLimit`
- [x] `packages/core/src/fields/utils.ts` + `utils.test.ts` — `resolveFieldLimit`
- [x] text, number, url, array, relationship, upload, blocks, date — `types.ts`, `config.ts` (value-aware default messages), `inputSchema.ts`, and their tests
- [x] react consumers of `.min`/`.max` (`FormArray`, `FormBlocks`, upload `FilledInput`, relationship `Input`) + affected tests/fixtures
- [x] `apps/test` and `apps/www` field configs migrated

## Step 2 — `email()` field [agent]
Why: leaf field; needed by masks (step 10) and dogfood; registering it touches every exhaustive registry.
Verify: pnpm typecheck && pnpm --filter @vexcms/core test -- fields/email && pnpm --filter @vexcms/react test -- fields/email
- [x] `packages/core/src/fields/baseTypes.ts` — `FieldSearchIndex` (shared by text/textarea/email; not a base option)
- [x] `packages/core/src/fields/email/` — types (incl. `searchIndex`), config, validator, inputSchema (format check), index + tests
- [x] `packages/core/src/collections/validator.ts` + test — emit `.searchIndex()` for any field declaring one
- [x] core registration: constants, `AdminField` union, `fields/index.ts`, validators + inputSchemas dispatch, type gen + schema gen paths + tests
- [x] `packages/react/src/components/fields/email/` — Input, Cell (mailto link), columnDef, testFixture, index + tests
- [x] react registration: both registries + column-def switch, `adapter.ts`, `src/index.ts`, testing fixtures aggregate

## Step 3 — `textarea()` field [agent]
Why: leaf field with `rows` and text's min/max length semantics (uses step 1 limits).
Verify: pnpm typecheck && pnpm --filter @vexcms/core test -- fields/textarea && pnpm --filter @vexcms/react test -- fields/textarea
- [x] `packages/core/src/fields/textarea/` — full module (incl. `searchIndex`) + tests
- [x] core registration (same points as step 2)
- [x] `packages/react/src/components/fields/textarea/` — Input (`rows`, character counter), Cell (truncated), columnDef, testFixture, index + tests
- [x] react registration (same points as step 2)

## Step 4 — `json()` field [agent]
Why: leaf field; `v.any()` storage, parse-checked input, truncated cell preview.
Verify: pnpm typecheck && pnpm --filter @vexcms/core test -- fields/json && pnpm --filter @vexcms/react test -- fields/json
- [x] `packages/core/src/fields/json/` — full module + tests (interfaceType `unknown`)
- [x] core registration (same points as step 2)
- [x] `packages/react/src/components/fields/json/` — Input (textarea editor, parse error state, format button), Cell, columnDef, testFixture, index + tests
- [x] react registration (same points as step 2)
- [x] `packages/react/src/testing/index.ts` — add `"json"` to `NO_TRUNCATION_FIELD_TYPES` (app-level `runVexReactSuite` cell contract)
- [x] `json` Input upgraded from a plain `<Textarea>` to a CodeMirror 6 `JsonEditor`/`JsonEditorView` (syntax highlighting, line numbers, fold/lint gutters), lazy-loaded via `React.lazy`/`Suspense` so `@codemirror/*` stays out of the main `@vexcms/react` bundle (verified: present only in the dynamically-imported chunk); `testing/fieldInputContract.ts` updated for lazy-loaded + `contenteditable` controls

## Step 5 — `updatedAt` as `date()`; date cell shows time [agent]
Why: readable timestamps in edit + list views with zero schema change (`v.optional(v.number())` either way).
Verify: pnpm --filter @vexcms/core test -- collections && pnpm --filter @vexcms/react test -- fields/date && pnpm --filter @vexcms/core test -- types
- [x] `packages/core/src/collections/config.ts` + test — inject `date({ label: "Updated At", admin: { readOnly: true, position: "sidebar" }, time: { timePicker: { second: true } } })`
- [x] generated schema/type output unchanged for `updatedAt` (assert in existing gen tests)
- [x] `packages/react/src/components/fields/date/utils.ts` + test — `formatDateFieldValue`
- [x] `packages/react/src/components/fields/date/Cell.tsx` + test — date+time unless `time.hidden`

## Step 6 — UI fields as real fields: `tabs()`, `collapsible()`, `row()`, `ui()`, `getDataFields()` [agent]
Why: tabs/collapsible/row/ui become `kind: "ui"` entries in a collection's/global's `fields` record, exactly
like data fields are `kind: "data"` entries; `getDataFields({ fields })` is the single place every
non-rendering consumer flattens them back down to data fields (drops `ui()`, hoists unnamed tab/row/collapsible
children, turns a named tab into a group-shaped data field, AND-s `condition` and ORs `hidden`/`readOnly` into
every field it flattens).
Verify: pnpm typecheck && pnpm --filter @vexcms/core test -- fields/ui collections globals
- [ ] `packages/core/src/fields/constants.ts` — `ADMIN_FIELDS.tabs`/`.collapsible`/`.row`/`.ui`, each `kind: "ui"`
- [ ] `packages/core/src/fields/baseTypes.ts` — `width: string` (default `"100%"`); `FieldAdminConfigInput`/`FieldAdminConfig` stay NON-generic, no `condition` (every data field type declares its own `<Type>FieldAdminInput<TCollectionSlug>` with method-shorthand `condition`, precedent: `RelationshipFieldAdminInput`); new NON-generic `UIKindFieldAdminConfigInput`/`UIKindFieldAdminConfig` and `BaseUIFieldInput`/`BaseUIField`
- [ ] `packages/core/src/fields/ui/types.ts` — `FieldCondition`, `FieldConditionProps`, `DataFieldSlug<TFields>`
- [ ] `packages/core/src/fields/ui/utils.ts` + `utils.test.ts` — `andFieldConditions`, `isFieldConditionMet`, `hasFieldConditions`, `resolveRowWidths`, `getDataFields` (condition AND, hidden/readOnly OR)
- [ ] `packages/core/src/fields/ui/tabs/` — `types.ts` (`TabAdminInput<TCollectionSlug>`, `TabInput<TCollectionSlug>`, `TabsFieldAdminInput`/`Config`), `config.ts` (`tabs<TCollectionSlug, const TTabs>()`), `index.ts` + `config.test.ts`
- [ ] `packages/core/src/fields/ui/collapsible/` — `types.ts` (`CollapsibleFieldAdminInput`/`Config` with `defaultCollapsed`), `config.ts` (`collapsible<TCollectionSlug, const TFields>()`), `index.ts` + `config.test.ts`
- [ ] `packages/core/src/fields/ui/row/` — `types.ts` (`RowFieldAdminInput`/`Config`), `config.ts` (`row<TCollectionSlug, const TFields>()`), `index.ts` + `config.test.ts`
- [ ] `packages/core/src/fields/ui/ui/` — `types.ts` (`UIFieldAdminInput`/`Config`, `UIFieldComponentProps`, `UIFieldCellProps`), `config.ts` (`ui<TCollectionSlug, TComponent>()`), `index.ts` + `config.test.ts`
- [ ] `packages/core/src/fields/ui/index.ts` — barrel
- [ ] `packages/core/src/fields/types.ts` — `AdminField` union gains `TabsField | CollapsibleField | RowField | UIField`; `AdminDataField`/`AdminUIField`/`DataFieldType`/`UIFieldType` derived from `ADMIN_FIELDS[type].kind`
- [ ] `packages/core/src/fields/index.ts` — `export * from "./ui"`
- [ ] `packages/core/src/fields/utils.ts` — `getFieldsInputSchema`, `getFieldsDefaultValues`, `fieldsToFieldTypeMap`, `validateFields` walk `getDataFields({ fields })`
- [ ] every DATA field type's `types.ts` (`text`, `email`, `textarea`, `json`, `number`, `checkbox`, `date`, `select`, `color`, `url`, `relationship`, `upload`, `richtext`, `array`, `group`, `blocks`) — adds its own `<Type>FieldAdminInput<TCollectionSlug>`/`<Type>FieldAdminConfig<TCollectionSlug>` (or widens its pre-existing admin type) with `condition`, overrides `admin?:`/`admin:` on its own `<Type>FieldInput`/`<Type>Field`
- [ ] every field factory — `width: "full"` → `"100%"`, `width: "half"` → `"50%"`
- [ ] `packages/core/src/collections/types.ts` + `config.ts` — `TFieldSlug` → `TFields`; `DataFieldSlug<TFields>` for `useAsTitle`/`indexes[].fields`; `populateCollectionFieldMeta` stamps `meta.collectionSlug` on every field; duplicate-key guard via `getDataFields`
- [ ] `packages/core/src/collections/interfaceGen.ts`, `validator.ts`, `indexFields.ts` — walk `getDataFields`
- [ ] `packages/core/src/globals/types.ts` + `config.ts` + `interfaceGen.ts` — mirror collections' `TFields`/`DataFieldSlug`/`getDataFields` changes
- [ ] `packages/core/src/auth/types.ts`, `packages/core/src/media/types.ts` — `TFieldSlug` → `TFields` rename
- [ ] `packages/core/src/access/validateAccessConstraints.ts`, `packages/core/src/versions/assertNoDraftRelationships.ts`, `packages/core/src/versions/statusConstraint.ts` — walk `getDataFields`
- [ ] `packages/react/src/components/fields/index.tsx` — `getCollectionColumnDefs` walks `getDataFields`
- [ ] `packages/react/src/index.ts` — re-export `tabs`/`collapsible`/`row`/`ui`; `TFieldSlug` → `TFields` rename on wrapper types
- [ ] `packages/file-storage-convex/src/mediaCollection.ts` — `TFieldSlug` → `TFields` rename

## Step 7 — Core extension-point model: slot IDs, contribution types, resolution [agent]
Why: admin extension points (slots) are built into G now, not retrofitted post-0.1.0 (plugin-system stem, decisions S1-S14); G owns field-level slots and blocks/array action slots only.
Verify: pnpm typecheck && pnpm --filter @vexcms/core test -- components fields config
- [ ] `packages/core/src/components/types.ts` — `SLOT_IDS`, `SlotId`, `ComponentContributionInput`/`ResolvedComponentContribution`, `ComponentOverrideInput`/`ResolvedComponentOverride`, `SlotAccessPredicate`/`SlotAccessContext`, `VexComponentConfigError`
- [ ] `packages/core/src/components/builtinIds.ts` — `BUILTIN_CONTRIBUTION_IDS` (`vex.` prefix) for G's blocks/array action built-ins
- [ ] `packages/core/src/components/resolve.ts` + test — `resolveComponentContributions` (hide-matching, duplicate-id error, order/before/after sort), `resolveComponentOverrides` (duplicate-id error, array order)
- [ ] `packages/core/src/components/index.ts` — barrel
- [ ] `packages/core/src/fields/baseTypes.ts` — `FieldAdminConfigInput`/`FieldAdminConfig` gain a `TComponent extends ComponentHKT = ComponentHKT` generic and a `components` slot (`Input`/`Cell`/`Label`/`Description` override chains, `beforeInput`/`afterInput` contribution lists) — inherited by default (`TComponent` defaults to `ComponentHKT`) via each field type's own Step 6 `<Type>FieldAdminInput`/`Config` wrapper, no per-type edit needed for `components` itself
- [ ] `packages/core/src/fields/relationship/types.ts` — reconcile `RelationshipFieldAdminInput`/`Config.components` (today `{ preview }` only) to extend the base `FieldSlotComponentsInput` shape instead of replacing it
- [ ] `packages/core/src/fields/utils.ts` — `resolveFieldComponents` helper, called by every field factory at the same spread point Step 6 added `layout: []`
- [ ] `packages/core/src/config/types.ts` — `AdminConfigInput.components` (`fields.<type>.{Input,Cell}` override chains; `blocks.itemActions`/`blocks.headerActions`/`array.itemActions` contribution lists), type-erased to `ComponentHKT` like `editor`
- [ ] `packages/core/src/config/config.ts` + test — `defineConfig` resolves root-level slot lists (merges `BUILTIN_CONTRIBUTION_IDS` defaults with user contributions via `resolveComponentContributions`/`resolveComponentOverrides`)
- [ ] `packages/core/src/index.ts` — export the new `components` module
- [ ] `packages/core/src/fields/text/config.ts` (representative) + every other field factory — `admin.components` default resolved; apps/test/www untouched (no project configures slots yet)

## Step 8 — React slot primitives + single field registry [agent]
Why: one registry (S6) replaces `fieldInputComponents`/`fieldCellComponents` duplicating `reactAdapter.fields`; the renderer composes override chains and gates `access`/`condition` (S3, S10, S11) before `RenderFields` (step 11) consumes it.
Verify: pnpm typecheck && pnpm --filter @vexcms/react test -- fields/index slots
- [ ] `packages/react/src/components/fields/registry.ts` (new) — `fieldToInputComponent`/`fieldToCellComponent` derived from `reactAdapter.fields`, replacing the two hand-written maps in `components/fields/index.tsx`
- [ ] `packages/react/src/components/fields/index.tsx` — drop `fieldInputComponents`/`fieldCellComponents`, re-export from `registry.ts`; `getCollectionColumnDefs` unchanged call site now resolves `field.cell` overrides for free
- [ ] `packages/react/src/components/fields/index.test.tsx` — registry-parity test (every `ADMIN_FIELDS` type has an entry) kept, now asserting against `reactAdapter.fields`
- [ ] `packages/react/src/components/slots/ComponentErrorBoundary.tsx` + test — per-contribution boundary naming the id (S10)
- [ ] `packages/react/src/components/slots/formData.ts` + test — `resolveSiblingData`, `useSlotConditionData` (live `data`/`siblingData` from the enclosing `<AppForm>`, built on `useVexForm`; moved here so Step 12 reuses it instead of re-declaring its own copy)
- [ ] `packages/react/src/components/slots/SlotOutlet.tsx` + test — additive-slot renderer: gates `access`/`condition` against real form data via `useSlotConditionData` (never fabricated data), wraps each contribution
- [ ] `packages/react/src/components/slots/SlotOverrideOutlet.tsx` + test — override-chain renderer (field.label/field.description/per-type/per-field Input/Cell)
- [ ] `packages/react/src/components/slots/resolveFieldInputComponent.ts` + test — composes built-in → root per-type chain → per-field chain via `renderDefault`
- [ ] `packages/react/src/components/slots/resolveFieldCellComponent.ts` + test — same composition for `field.cell`
- [ ] `packages/react/src/hooks/useVexPermissions.ts` + test — S5 context hook (`hasPermission` bound to the current user) backing `SlotAccessContext`
- [ ] `packages/react/src/hooks/useVexForm.ts` + test — S5 context hook exposing the TanStack `AppFormContext` form instance to slot contributions (data this step has; `useVexDocument`/`useVexCollection` deferred to H's edit-view context, which owns the live document query — noted in spec)
- [ ] `packages/react/src/components/slots/index.ts` — barrel
- [ ] `packages/react/src/index.ts` — export `SlotOutlet`, `SlotOverrideOutlet`, `useVexPermissions`, `useVexForm`, `SLOT_IDS`, `BUILTIN_CONTRIBUTION_IDS` (re-exported from core)

## Step 9 — Server-side condition enforcement [agent]
Why: a required field hidden by its condition must not block `create`, and its `validate()` must not run.
Verify: pnpm --filter @vexcms/core test -- prepareEdit fields generateVexTypes generateVexSchema
- [ ] `packages/core/src/fields/utils.ts` — `getFieldsInputSchema({ …, data })` skips condition-false fields (nested group/array/blocks via per-item `siblingData`); `validateFields` skips them
- [ ] `packages/core/src/fields/{group,array,blocks}/inputSchema.ts` — thread `data`
- [ ] `packages/core/src/api/prepareEdit.ts` — pass `transformedFields` as `data`
- [ ] `prepareEdit.test.ts` + `utils.test.ts` — create with hidden required field succeeds; visible required field still fails; nested block sibling condition
- [ ] `packages/core/src/fields/array/{types,config,validator,utils}.ts` + tests — stored `id: v.optional(v.string())` on object-shaped (`group()`) array items: reserved name, validator/inputSchema/type-gen injection, `isObjectShapedArrayItem`/`withArrayItemId`/`assignArrayItemIds`
- [ ] `packages/core/src/api/prepareEdit.ts` + test — `mergedFields` backfilled via `assignArrayItemIds` before `beforeChange`/validation
- [ ] `packages/core/src/types/generateVexTypes.test.ts`, `packages/core/src/schema/generateVexSchema.test.ts` — array-of-group id coverage

## Step 10 — Input masks: `admin.mask` + `fields.inputMasks` [agent]
Why: opt-in masks with project-wide defaults; lazy-loaded so unmasked forms pay nothing.
Verify: pnpm typecheck && pnpm --filter @vexcms/core test -- mask config && pnpm --filter @vexcms/react test -- useFieldMask fields/text fields/number
- [ ] `pnpm-workspace.yaml` catalog + `packages/react/package.json` — `use-mask-input` (P-015)
- [ ] `packages/core/src/fields/constants.ts` — `inputMasks: boolean` added to every `ADMIN_FIELDS` entry (`true` for text/email/number/url, `false` otherwise)
- [ ] `packages/core/src/fields/mask/` — `types.ts` (`FieldMaskInput`, `FieldMask`, `MaskableFieldType` derived from `ADMIN_FIELDS`), `utils.ts` (`resolveFieldMask`), `index.ts` + tests
- [ ] text / email / number / url `types.ts` + `config.ts` — `admin.mask`
- [ ] `packages/core/src/config/types.ts` + `config.ts` + test — `fields.inputMasks` on client config input/resolved
- [ ] `packages/react/src/hooks/useFieldMask.ts` + test — lazy `import("use-mask-input")`, unmask/`storeMasked`
- [ ] text / email / number / url `Input.tsx` — apply mask (number renders `type="text"` when masked, stores a number)

## Step 11 — React layout renderer: `RenderFields`, tabs, collapsible, row, width, sidebar, hidden [agent]
Why: one renderer replaces the four duplicated field loops; consumes step 6's tree.
Verify: pnpm typecheck && pnpm --filter @vexcms/react test -- form views
- [ ] `packages/react/src/components/form/RenderFields.tsx` + test — renders `FieldLayoutNode[]`; flex-wrap widths; region filter
- [ ] `packages/react/src/components/form/FormTabs.tsx`, `FormCollapsible.tsx`, `FormRow.tsx` + tests — error-count badges; top-level tab in `?tab=`
- [ ] `packages/react/src/hooks/useFieldErrorCount.ts` + test
- [ ] `packages/react/src/components/form/DocumentTimestamps.tsx` — read-only Created at (`_creationTime`)
- [ ] `CollectionEditView`, `GlobalEditView`, `MediaCollectionEditView` — main + sidebar columns via `RenderFields`; `admin.hidden` honored
- [ ] `FormGroup`, `FormBlocks`, `CreateDocumentModal`, `fields/index.tsx` (`RenderFieldInputComponents` removed) — switch to `RenderFields`
- [ ] `packages/react/src/components/modals/constants.ts` — `MODALS`-style `?tab=` param constant
- [ ] `packages/react/src/components/form/RenderFields.tsx` — `"field"` nodes render through a new `FieldSlotOutlet` (`packages/react/src/components/slots/`): resolves `field.input` via `resolveFieldInputComponent` (step 8), renders `field.beforeInput`/`field.afterInput` contributions (gated against real `data`/`siblingData` via `conditionName={inputProps.name}`) and the (currently built-in-less) `field.label`/`field.description` override slots around it

## Step 12 — React conditions + condition-aware client validation [agent]
Why: hide fields reactively without re-rendering the form; client Zod must match the server's step-9 rule.
Verify: pnpm --filter @vexcms/react test -- useFieldCondition RenderFields useFieldsForm
- [ ] `packages/react/src/hooks/useFieldCondition.ts` + test — subscribes only when `admin.condition` exists; imports `resolveSiblingData` from step 8's `components/slots/formData.ts` instead of re-declaring it
- [ ] `RenderFields` — conditional fields; frames with no visible children hidden
- [ ] `packages/react/src/hooks/useFieldsForm.ts` + test — validators rebuild schema from current values when `hasFieldConditions`

## Step 13 — `usePaginatedSearch` + upload picker fixes [agent]
Why: shared search/pagination hook both pickers need; fixes dead "Load more", MIME filter TODO, broken placeholder, no-op handlers.
Verify: pnpm --filter @vexcms/react test -- usePaginatedSearch media fields/upload
- [ ] `packages/react/src/hooks/usePaginatedSearch.ts` + test
- [ ] `packages/react/src/components/media/MediaLibaryGrid.tsx` — use hook; real pagination; MIME filter from `accept` + type menu; placeholder fix
- [ ] `packages/react/src/components/media/MediaPicker.tsx` — selection footer copy, upload-tab back handler
- [ ] `packages/react/src/components/fields/upload/FilledInput.tsx` — single-mode Replace; `n/max` counter via `FieldLimit`

## Step 14 — Relationship field overhaul [agent]
Why: the named offender; copied from upload's three-state pattern, not shared code.
Verify: pnpm --filter @vexcms/react test -- fields/relationship relationship
- [ ] `packages/react/src/components/relationship/` — `RelationshipPicker.tsx` (dialog: Select / Create tabs), `RelationshipDocumentList.tsx`, `RelationshipCreateForm.tsx`, `index.ts` + tests
- [ ] `packages/react/src/components/fields/relationship/` — `Input.tsx` (state switch), `EmptyInput.tsx`, `FilledInput.tsx` (draggable rows, Clear, `n/max`), tests
- [ ] `packages/react/src/components/modals/constants.ts` — relationship picker URL param
- [ ] delete `packages/react/src/hooks/useRelationshipPickerOptions.ts` (+ barrel export, tests) — replaced by `usePaginatedSearch`
- [x] `packages/core/src/collections/validator.ts` + test — `resolveTitleSearchIndex` helper; the `useAsTitle` field's own `searchIndex` (any name) is reused instead of always auto-generating `search_<useAsTitle>`; non-searchable `useAsTitle` (system field or non-string field type) emits no search index and the picker falls back to `find()`

## Step 15 — Blocks + array editing actions [agent]
Why: duplicate / insert above-below / move / collapse-expand all / error markers; per-block `defaultCollapsed` honored.
Verify: pnpm --filter @vexcms/core test -- fields/blocks && pnpm --filter @vexcms/react test -- FormBlocks FormArray fields/blocks fields/array
- [ ] `packages/core/src/fields/blocks/utils.ts` + test — `cloneBlockWithFreshIds`, `coerceBlockToDefinition`
- [ ] `packages/react/src/components/form/BlockActionsMenu.tsx` + test
- [ ] `packages/react/src/components/form/FormBlocks.tsx` + test — menu, insert-at-index picker, collapse/expand all, error marker, `n/max`, per-block `defaultCollapsed`; stale comments removed
- [ ] `packages/react/src/components/form/FormArray.tsx` + test — duplicate, move up/down, stable item keys
- [ ] `packages/core/src/components/builtinIds.ts` — block/array action ids consumed below (`vex.block.duplicate`, `vex.block.insertAbove`, `vex.block.insertBelow`, `vex.block.moveUp`, `vex.block.moveDown`, `vex.block.remove`, `vex.array.duplicate`, `vex.array.moveUp`, `vex.array.moveDown`, `vex.array.remove`)
- [ ] `packages/react/src/components/form/BlockActionsMenu.tsx` — the six menu items become `ComponentContributionInput` built-ins rendered through `SlotOutlet` at `SLOT_IDS.blocks.itemActions`, gated against real `data`/`siblingData` via a new `itemPath` prop (`conditionName={props.itemPath}`), merged with `fieldDef.admin.components.beforeInput`-style per-field/root additions (step 7's config-level `blocks.itemActions` resolution)
- [ ] `packages/react/src/components/form/FormArray.tsx` — the four per-item buttons (Duplicate/Move up/Move down/Remove) become built-ins at `SLOT_IDS.array.itemActions`, gated via `conditionName={\`${name}[${itemIndex}]\`}`, same `SlotOutlet` pattern
- [ ] `packages/react/src/components/form/FormArray.tsx` — object-shaped items key by stored `id` when present (step 9's `isObjectShapedArrayItem`); `handleAdd`/`handleDuplicate` assign one via `withArrayItemId`, fresh on duplicate

## Step 16 — Block clipboard (copy/paste across fields, documents, collections) [agent]
Why: localStorage admin clipboard; paste gated on `canEdit` and validated against the target block definition.
Verify: pnpm --filter @vexcms/react test -- useBlockClipboard FormBlocks
- [ ] `packages/react/src/hooks/useBlockClipboard.ts` + test — `vex:block-clipboard` envelope, cross-tab `storage` sync
- [ ] `BlockActionsMenu` — Copy block / Paste above / Paste below
- [ ] `FormBlocks` header — Copy all / Paste (append) / Replace all; disabled when not accepted, at max, or no `canEdit`
- [ ] `BlockActionsMenu` / `FormBlocks` header — Copy/Paste/Replace-all join the same `blocks.item.actions`/`blocks.header.actions` contribution lists as step 15's built-ins (`vex.block.copy`, `vex.block.pasteAbove`, `vex.block.pasteBelow`, `vex.blocksHeader.copyAll`, `vex.blocksHeader.pasteAppend`, `vex.blocksHeader.replaceAll`)

## Step 17 — Per-input polish + state sweep [agent]
Why: closes the remaining "half-built" inputs and ignored `cellAlignment`.
Verify: pnpm --filter @vexcms/react test -- fields DataTable adminHref AdminSidebar AdminTopNav DashboardView GlobalsListView CollectionListView MediaCollectionListView
- [ ] text — character counter when `max` set
- [ ] number — `step` option (core + input), `min`/`max` HTML attributes
- [ ] url — open-link button via `VexLink`
- [ ] select — `admin.searchable`, `admin.display: "radio"` (core + input; `RadioGroup`/`RadioGroupItem` + `Checkbox` primitives)
- [ ] `DataTable.tsx` — apply column `align` (`cellAlignment`) to header + cells
- [ ] every Input: empty / loading / error / read-only / focus-ring states consistent (contract test extended)
- [ ] `packages/react/src/testing/fieldInputContract.ts` — new shared assertion: a per-field `admin.components.Input` override renders in place of the built-in, and its `renderDefault` prop re-renders the built-in unchanged
- [ ] `packages/react/src/testing/dataTableSuite.tsx` — asserts a per-type `admin.components.fields.<type>.Cell` override renders in `getCollectionColumnDefs` output (no `DataTable.tsx` change needed — `fieldToCellComponent` already resolves overrides via step 8's registry)
- [ ] `packages/react/src/components/ui/radio-group.tsx` (new) — `RadioGroup`/`RadioGroupItem` built on Base UI `RadioGroup`/`Radio`; exported from `ui/index.ts`
- [ ] `packages/react/src/utils/adminHref.ts` + test — `adminHref({ type, slug?, id? }, basePath)`, replacing every hand-built admin link
- [ ] `packages/react/src/components/fields/{array,blocks,checkbox,color,date,email,group,json,number,relationship,richtext,select,text,textarea,upload,url}/Cell.tsx` — title-column link via `adminHref`
- [ ] `packages/react/src/components/AdminSidebar.tsx`, `AdminTopNav.tsx` — nav links + breadcrumb trail via `adminHref`
- [ ] `packages/react/src/components/views/{DashboardView,GlobalsListView,CollectionListView,MediaCollectionListView}.tsx` — card/button links via `adminHref` (fixes the latter four ignoring a custom `basePath`)
- [ ] `packages/react/src/index.ts` — export `adminHref`, `AdminHrefTarget`

## Step 18 — Dogfood in `apps/test` + plan bookkeeping [dev]
Why: proves every new path end-to-end against the developer's running deployment (P-024: attach, never start).
Verify: pnpm --filter test typecheck && pnpm --filter www typecheck; browser smoke on the running admin of every changed input
- [ ] `apps/test` collections — new fields, `tabs`/`collapsible`/`row`, conditions, masks, `fields.inputMasks`
- [ ] regenerate schema + types (`vex generate`)
- [ ] browser smoke checklist recorded
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md` — G re-scoped/in-progress; block items removed from H; non-goals updated
- [ ] `.agent/docs/product/roadmap.md` — drop the `json`/`email`/`textarea`/`tabs` deferral
- [ ] `apps/test/src/vex.config.ts` — root `admin.components.fields.text.Input` per-type override example
- [ ] `apps/test/src/vexcms/collections/pages.ts` — one field with a per-field `admin.components.Input` override wrapping the built-in via `renderDefault`, and a `field.beforeInput` contribution
- [ ] `apps/test/src/vexcms/blocks/CTA/config.ts` — `admin.components.blocks.itemActions` hides one built-in block action (`{ id: "vex.block.duplicate", hidden: true }`)
- [ ] plugin-system stem bookkeeping (`.agent/docs/specs/2026-10-21-plugin-system/stem.md` "G placement" note) — mark G's slot groundwork (steps 7-8, 11, 15-17) done, out of this spec's touched-files list
