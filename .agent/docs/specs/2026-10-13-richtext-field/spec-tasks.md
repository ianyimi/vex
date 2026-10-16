---
status: draft
spec_id: 2026-10-13-richtext-field
touches:
  - "packages/core/src/editor/**"
  - "packages/core/src/fields/richtext/**"
  - "packages/core/src/fields/constants.ts"
  - "packages/core/src/fields/types.ts"
  - "packages/core/src/fields/index.ts"
  - "packages/core/src/fields/validators/index.ts"
  - "packages/core/src/fields/inputSchemas/index.ts"
  - "packages/core/src/types/generateVexTypes*.ts"
  - "packages/core/src/config/**"
  - "packages/core/src/media/config.ts"
  - "packages/core/src/index.ts"
  - "packages/core/README.md"
  - "packages/react/src/index.ts"
  - "packages/react/src/adapter.ts"
  - "packages/react/src/components/fields/index.tsx"
  - "packages/react/src/components/fields/richtext/**"
  - "packages/react/src/testing/**"
  - "packages/richtext-plate/**"
  - "apps/test/package.json"
  - "apps/test/src/vex.config.ts"
  - "apps/test/src/vexcms/collections/posts.ts"
  - "apps/test/convex/posts.ts"
  - "apps/test/src/app/(frontend)/(site)/posts/**"
  - "apps/docs/src/content/docs/fields/richtext.mdx"
  - "apps/docs/src/content/docs/fields/coming-soon.mdx"
  - "scripts/check-packed-manifests.mjs"
  - ".changeset/*.md"
  - ".agent/docs/product/v0.1.0-launch-plan.md"
prompt_version: 1
---

# 2026-10-13-richtext-field — Tasks

> Launch-plan spec **D** (`.agent/docs/product/v0.1.0-launch-plan.md`). Re-verified
> against source 2026-10-13 — the plan's "two missing core types" is six:
> `RichTextDocument`, `RichTextElement`, `RichTextText`, `VexEditorComponentProps`,
> `VexEditorAdapter`, `VexRenderComponentProps`. Core is react-free (`@vexcms/react/client`
> split), so the editor adapter is typed through the existing `ComponentHKT` /
> `ApplyComponent` machinery, mirroring `relationship` `admin.components.preview`.
> B2 (localization ADR) was never written; this spec proceeds on an explicit
> no-localization assumption (Design Decision 1). Original steps 3 and 4 merged during
> spec writing — see Step 3's Spec note.

## Step 1 — Core richtext value + editor adapter types [agent]
Why: every later step and all four `@ts-nocheck` files import these; leaves first.
Verify: pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/core test
- [x] `packages/core/src/fields/richtext/types.ts` — `RichTextText`, `RichTextElement`, `RichTextDocument`
- [x] `packages/core/src/editor/types.ts` — `VexEditorComponentProps`, `VexRenderComponentProps`, `VexEditorAdapter<TComponent extends ComponentHKT>`
- [x] `packages/core/src/editor/index.ts` barrel + `packages/core/src/index.ts` export

## Step 2 — `editor` on the client config [dev]
Why: the admin Input (step 4) reads the adapter from config; the key must exist first.
Verify: pnpm --filter @vexcms/core test -- config && pnpm --filter @vexcms/react typecheck
- [x] `packages/core/src/config/types.ts` — `editor?: VexEditorAdapter<TComponent>` on `VexClientConfigInput` / `VexClientConfig`
- [x] `packages/core/src/config/config.ts` — `defineConfig` passes `editor` through unchanged
- [x] `packages/core/src/config/config.test.ts` — passthrough + absent case
- [x] `packages/react/src/index.ts` — `VexEditorAdapter` re-export bound to `ReactHKT`

## Step 3 — `richtext()` field: core module, registration, admin components [dev]
Why: `ADMIN_FIELDS.richtext` widens `AdminFieldType`, breaking react's exhaustive Records until the react side exists — module and registration must land as one step to keep the build green (no throwaway constant, P-010).
Verify: pnpm typecheck && pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test -- fields/richtext
- [x] `packages/core/src/fields/constants.ts` — replace commented placeholder with real `richtext` entry
- [x] `packages/core/src/fields/richtext/types.ts` — add `RichTextFieldInput`, `RichTextField`
- [x] `packages/core/src/fields/richtext/config.ts` + `config.test.ts` — `richtext()` factory
- [x] `packages/core/src/fields/richtext/validator.ts` + `validator.test.ts` — `v.array(v.any())`
- [x] `packages/core/src/fields/richtext/inputSchema.ts` + `inputSchema.test.ts` — shallow node check, `ignoreRequired`
- [x] `packages/core/src/fields/richtext/utils.ts` + `utils.test.ts` — `richTextToPlainText`
- [x] `packages/core/src/fields/richtext/index.ts` barrel
- [x] `packages/core/src/fields/types.ts` — `RichTextField` joins `AdminField`
- [x] `packages/core/src/fields/index.ts` — `export * from "./richtext"`
- [x] `packages/core/src/fields/validators/index.ts` + `inputSchemas/index.ts` — new cases
- [x] `packages/core/src/types/generateVexTypes.ts` + test — import `RichTextDocument` in generated types when a richtext field exists
- [x] `packages/react/src/components/fields/richtext/` — `Input.tsx`, `Cell.tsx`, `columnDef.tsx`, `testFixture.ts`, `index.ts` + `Input.test.tsx`, `Cell.test.tsx`, `columnDef.test.ts`
- [x] `packages/react/src/components/fields/index.tsx` — both registries + column-def switch
- [x] `packages/react/src/adapter.ts` — `reactAdapter.fields.richtext`
- [x] `packages/react/src/testing/fixtures/index.ts` — aggregate the fixture
- [x] `packages/react/src/testing/fieldInputContract.ts` — stub `editor` adapter on the shared test config

## Step 4 — `richtext-plate` typed against core, exported from root [dev]
Why: closes the `@ts-nocheck` hole and makes the editor reachable; needs steps 1–2 types.
Verify: pnpm --filter @vexcms/richtext-plate typecheck && pnpm --filter @vexcms/richtext-plate build && ! grep -r "@ts-nocheck" packages/richtext-plate/src
- [x] remove `@ts-nocheck` from `types.ts`, `editor/PlateEditorField.tsx`, `editor/plateEditor.ts`, `render/RichText.tsx`; fix every error they hid
- [x] `plateEditor()` returns `VexEditorAdapter<ReactHKT>`
- [x] `editor/components/image/useImageUpload.ts` + `ImageUpload.tsx` — `mediaCollection` → `mediaCollectionSlug`, core `VexMediaDocument` replaces local `MediaDoc` (P-010)
- [x] `tsconfig.check.json` — drop the `exclude` list that hid the four files from typecheck
- [x] `src/index.ts` exports `plateEditor`, `RichText`, feature types
- [x] `package.json` — `@vexcms/core` / `@vexcms/react` as `workspace:^` peers + `catalog:`/workspace devDeps (P-013/P-014)

## Step 5 — Inline images through the media collection [dev]
Why: decided in-scope; react Input supplies the media props `PlateEditorField` already accepts.
Verify: pnpm --filter @vexcms/react test -- fields/richtext && pnpm --filter @vexcms/richtext-plate typecheck
- [x] `RichTextFieldInput.mediaCollectionSlug?: MediaCollectionSlug` (core types + factory + test)
- [x] react richtext `Input.tsx` wires media search/pagination, `generateUploadUrl`, `createMediaDocument` from the existing upload/MediaPicker hooks
- [x] `useImageUpload.ts` — fix returned `url` to the stored media URL (not a temp blob URL)
- [x] image feature hidden when `mediaCollectionSlug` is absent
- [x] `packages/core/src/media/config.ts` + `packages/core/src/config/config.test.ts` — unknown `mediaCollectionSlug` throws `VexStorageConfigError`

## Step 6 — Dogfood in `apps/test` [dev]
Why: proves schema gen → type gen → admin form → cell → front-end render against a real deployment.
Verify: `pnpm --filter test typecheck && pnpm --filter test build`; manual: create/edit a post body in the running admin (P-024 — attach, never start a dev server), save draft, publish, view the rendered page
- [ ] `apps/test/package.json` — `@vexcms/richtext-plate: workspace:*`
- [ ] `apps/test/src/vex.config.ts` — `editor: plateEditor()`
- [ ] `apps/test/src/vexcms/collections/posts.ts` — `body: richtext({ label: "Body", mediaCollectionSlug: "images" })`
- [ ] `apps/test/convex/posts.ts` — `getBySlug` query for the public page
- [ ] regenerate schema + types (`vex generate`)
- [ ] `apps/test/src/app/(frontend)/(site)/posts/[slug]/page.tsx` — renders `body` with `RichText`

## Step 7 — Docs, README, packed-tarball probe, changeset [agent]
Why: acceptance criteria — public docs stop saying richtext doesn't exist; consumers typecheck against the published artifact.
Verify: `node scripts/check-packed-manifests.mjs --richtext` passes; `node scripts/check-packed-manifests.mjs --richtext --richtext-negative` exits non-zero (AP-013); `pnpm --filter docs build`
- [ ] `apps/docs/src/content/docs/fields/richtext.mdx` new; `coming-soon.mdx` drops richtext
- [ ] `packages/core/README.md` — remove the three "no richtext" statements
- [ ] `packages/richtext-plate/README.md` — install + `editor: plateEditor()` + `RichText` render
- [ ] `scripts/check-packed-manifests.mjs` — packed-tarball consumer probe importing `richtext()`, `plateEditor`, `RichText`
- [ ] `.changeset/*.md` — `patch` for core, react, richtext-plate (P-025)
- [ ] launch plan: D status → done
