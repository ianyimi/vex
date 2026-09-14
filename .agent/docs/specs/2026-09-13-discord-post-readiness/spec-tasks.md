---
status: draft
spec_id: 2026-09-13-discord-post-readiness
touches:
  - packages/react/src/components/ui/data-table/DataTable.tsx
  - packages/react/src/components/ui/data-table/DataTableBulkActions.tsx
  - packages/react/src/components/views/**
  - packages/react/src/testing/**
  - packages/react/src/components/**
  - packages/core/src/index.ts
  - packages/core/src/config/**
  - packages/core/README.md
  - packages/cli/src/lib/generateSchema.ts
  - apps/www/src/**
  - packages/create-vexcms/templates/marketing-site/**
  - packages/create-vexcms/templates/base-nextjs/**
  - .agent/docs/harness-changelog.md
  - .changeset/**
prompt_version: 1
---

# 2026-09-13-discord-post-readiness — Tasks

Everything that must be true before the project is posted in the Convex Discord
show-and-tell channel. Scoped to what a visitor touches in the first minute:
the OG card, the marketing site, the public read-only admin panel, the quickstart,
and the published package exports.

Ordered so build + test stay green after every step.

## Step 1 — Make bulk selection reachable and permission-gated
Why: `enableRowSelection={true}` is unconditional, so an anonymous demo visitor can tick
checkboxes and nothing happens. It is the one broken interaction reachable from the public
demo, and the post invites people into that demo.
Verify: pnpm --filter @vexcms/react test src/components/ui/data-table src/testing
- [x] `ui/data-table/DataTableBulkActions.tsx` — replace the `selection: UseTableSelectionReturn`
      prop with the count/callback shape `DataTable` can actually supply
      (`selectedCount`, `onDelete`, `onClear`, `isDeleting`); drop the `all`/`inverse`
      mode badges, which were unreachable without a select-all-across-pages control.
- [x] `ui/data-table/DataTable.tsx` — uncomment and wire the bulk-actions bar; render it only
      when a bulk action is actually available.
- [x] `views/CollectionListView.tsx` — gate `enableRowSelection` and `enableBulkActions` on
      `canDelete` so an anonymous visitor sees no checkboxes rather than dead ones.
- [x] `views/MediaCollectionListView.tsx` — same gating.
- [x] `testing/dataTableSuite.tsx` — delete the unreachability comment at lines 112-119 and
      assert the bar renders, deletes, and clears.
- [x] `testing/dataTableSuite.tsx` — rewrite the `DataTableBulkActions` describe block for the
      new prop shape.
- [x] `testing/viewSuite.ts` — delete the absence-assertion and its WIRING FINDING comment at
      lines 155-160 and 214-219; assert selection is absent for a role without delete and
      present for one with it.
- [x] `.changeset/` — patch entry; `DataTableBulkActionsProps` is a published export.

## Step 2 — Stop exporting the auto-migration no-ops
Why: This audience reads package exports. `diffSchema` returning an empty diff for every input
is the worst thing to be caught shipping, and `core/README.md` currently documents it as usable.
Verify: pnpm --filter @vexcms/core build && pnpm --filter @vexcms/cli typecheck
- [x] `core/src/index.ts` — remove `diffSchema`, `planMigration`, `makeFieldsOptional`,
      `addRemovedFieldsAsOptional` from the public surface; keep them importable internally
      for `packages/cli`.
- [x] `core/src/config/**` — make `schema.autoMigrate: true` throw a clear not-implemented
      error naming the release at config resolution. Default stays `false`.
- [x] `core/README.md` — delete the `### Auto-Migration` section (lines 169-182).
- [x] `.changeset/` — patch entry noting the removed exports and the new guard.

## Step 3 — Admin panel mobile pass (375 / 390 / 768 / 1024)
Why: `apps/www` sets `anonRole: user`, so `/admin` is a public read-only demo and the post
invites people to open it. Discord traffic is heavily mobile.
Verify: manual
Manual check: audit matrix committed under the spec directory; no horizontal overflow, no clipped control, no unreachable primary action at any of the four widths.
clipped control, no unreachable primary action at any of the four widths.
- [x] Audit anonymous surfaces against `apps/www/admin`: `DashboardView`,
      `CollectionListView`, `CollectionEditView`, `MediaCollectionListView`,
      `MediaCollectionEditView`, `GlobalsListView`, `GlobalEditView`, `UnauthorizedView`.
- [x] Audit authenticated surfaces against `apps/test`: `CreateDocumentModal`,
      `CreateMediaModal`, `MediaUploadForm` (both steps), `MediaLibaryGrid`, and a save flow.
- [x] Audit the shell at each width: `AdminLayout`, `AdminSidebar`, `AdminTopNav` breadcrumbs,
      and the 768 boundary in both directions — `use-mobile.ts` flips the sidebar between an
      inline rail and a `Sheet` there.
- [x] Audit all 12 field inputs in an edit view, `group`/`array`/`blocks` nesting included.
- [x] Fix findings with Tailwind class changes only.
- [x] File anything needing a component rewrite in `.agent/docs/product/backlog.md`.

## Step 4 — Marketing site mobile pass (375 / 390 / 768 / 1024)
Why: The site link is what gets clicked first, and it is the project's shopfront.
Verify: manual
Manual check: audit matrix committed; every route clean at all four widths.
- [x] Audit every route in `apps/www`: `/`, `/features`, and the rest of the site nav.
- [x] Audit every block renderer under `apps/www/src/vexcms/blocks/`.
- [x] Fix with Tailwind class changes only.
- [x] Spot-check `apps/docs` at 390 — Starlight is responsive by default, so this is a
      confirmation, not a pass.

## Step 5 — Mirror the fixes into the create-vexcms templates
Why: The templates are hand-maintained copies with no extraction layer. A visitor who runs
`pnpm create vexcms@alpha` gets the scaffold, not `apps/www` — so an unmirrored mobile fix
means the defect still ships to every new project. Follow the `template-sync` skill; do not
improvise a mapping.
Verify: node scripts/scaffold-smoke.mjs --bare && node scripts/scaffold-smoke.mjs
- [x] Read the app→template translation table in
      `.agent/docs/specs/2026-08-31-wp2-cli-templates/spec.md` first — it is authoritative.
- [x] `node scripts/template-diff.mjs --app apps/www` to identify drift from Step 4.
- [x] Mirror Step 4's Tailwind fixes into `templates/marketing-site` — block renderers map
      1:1 (both trees carry the same 11 blocks), so classify by the base-vs-overlay boundary,
      not by guesswork.
- [x] Preserve `{{PROJECT_NAME}}` and other installer markers, and underscore-renamed
      dotfiles, on every file overwritten wholesale.
- [x] Mirror any Step 8 README correction into `templates/base-nextjs/README.md`.
- [x] Prohibited-pattern sweep on every translated file — `ui(`, `tabs(`, `richtext(`,
      `livePreview`, scalar `select` `defaultValue`, `_vexDrafts`, and the rest of the skill's
      list.
- [x] `node scripts/sync-template-versions.mjs` — Steps 1-2 bump `@vexcms/*`, and templates
      pin literal versions, never `workspace:`.
- [x] Append one line to `.agent/docs/harness-changelog.md` per the skill's record step.

## Step 6 — Social card content — [dev]
Why: The OG card renders before anyone clicks either link. The plumbing is already complete
and content-driven, so this is admin-panel data entry, not code.
Verify: manual
Manual check: paste both URLs into a Discord DM to yourself; both render a card with an image.
- [x] Produce a 1200×630 OG image from page screenshots.
- [x] Upload it and set `siteSettings.ogImage` — the site-wide default consumed at
      `apps/www/src/lib/metadata.ts:78`.
- [x] Set `pages.ogImage` on the home page if it should differ from the site default
      (page-level wins, `metadata.ts:77`).
- [x] Set `siteSettings.twitterHandle` — without it no `summary_large_image` card is emitted
      at all (`metadata.ts:98-100`).
- [x] Confirm `siteSettings.metaTitle` and `metaDescription` read the way you want in a card.
- [x] Upload a 1280×640 GitHub social preview in the repo settings — carried over from
      WP-4 step 7 in `tasks.md`.

## Step 7 — Walk the quickstart on a clean machine — [dev]
Why: The post will invite people to run `pnpm create vexcms@alpha`. The `convex env set` step
is still missing from the root README; nothing has been re-walked since the last alpha.
Verify: manual
Manual check: a scratch project reaches a successful first login with no undocumented step.
- [x] `pnpm create vexcms@alpha` in an empty directory, following only `README.md`.
- [x] Note every point where the README is wrong, out of order, or silent; fix `README.md`.
- [x] Confirm the first login succeeds — the 403 documented at
      `packages/create-vexcms/templates/base-nextjs/README.md:45` is the failure this guards.
- [x] Any README correction that belongs to the scaffold goes back through Step 5.

## Step 8 — Verification
Why: A red build the night before a public post costs more than any unshipped feature.
Verify: pnpm build && pnpm typecheck && pnpm test && node scripts/verify-scaffold.mjs && node scripts/scaffold-smoke.mjs --bare && node scripts/scaffold-smoke.mjs && node scripts/check-packed-manifests.mjs --packed
- [x] `pnpm build`
- [x] `pnpm typecheck`
- [x] `pnpm test`
- [x] `node scripts/verify-scaffold.mjs`
- [x] `node scripts/scaffold-smoke.mjs --bare` and `node scripts/scaffold-smoke.mjs`
- [x] `node scripts/check-packed-manifests.mjs --packed`
- [x] `harness doctor` — no errors.
