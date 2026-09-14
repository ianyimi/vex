---
status: draft
spec_id: 2026-09-13-discord-post-readiness
touches:
  - packages/react/src/components/ui/data-table/DataTable.tsx
  - packages/react/src/components/ui/data-table/DataTableBulkActions.tsx
  - packages/react/src/components/views/CollectionListView.tsx
  - packages/react/src/components/views/MediaCollectionListView.tsx
  - packages/react/src/testing/dataTableSuite.tsx
  - packages/react/src/testing/viewSuite.ts
  - packages/core/src/index.ts
  - packages/core/src/config/config.ts
  - packages/core/src/config/types.ts
  - packages/core/README.md
  - packages/create-vexcms/templates/marketing-site/**
  - packages/create-vexcms/templates/base-nextjs/README.md
  - packages/create-vexcms/templates/**/package.json
  - .agent/docs/harness-changelog.md
  - apps/www/src/**
  - README.md
  - .changeset/**
  - .agent/docs/product/backlog.md
prompt_version: 1
---

# 2026-09-13-discord-post-readiness — Spec

## Overview

The project is being posted in the Convex Discord show-and-tell channel tomorrow.
This spec covers only what a visitor touches in the first minute: the OG card that
renders before anyone clicks, the marketing site, the **public read-only admin
panel** (`apps/www` sets `anonRole: user`, so `/admin` is a live anonymous demo),
the quickstart, and the published package exports.

It deliberately pulls two items forward out of the v0.1.0 launch track — the
unreachable bulk-selection bar from spec A and the exported auto-migration no-ops
from spec B1 — because both are reachable by a visitor. It also pulls the admin
half of spec J forward at phone and tablet widths only.

Everything else in the launch track stays where it is.

## Design Decisions

1. **`DataTableBulkActions` takes a count and callbacks, not a `useTableSelection`
   object.** The commented-out block in `DataTable.tsx` was written against an older
   prop shape (`selectedCount`/`onDelete`/`isDeleting`); the component has since been
   rewritten to consume `selection: UseTableSelectionReturn`. `DataTable` drives
   selection through TanStack's own `rowSelection` state and has no
   `useTableSelection` instance, so uncommenting alone does not typecheck. Adapting
   the *component* is a few lines; adopting `useTableSelection` inside `DataTable`
   means replacing the checkbox column, the row-id derivation, and every selection
   assertion in two suites. Not the night before a post.
2. **The `all` and `inverse` mode badges are dropped, not preserved.** They are
   unreachable: nothing renders a select-all-across-pages control, so
   `selection.state.mode` is permanently `"page"`. Spec I reintroduces
   `useTableSelection` when it builds that control.
3. **`useTableSelection` becomes explicitly production-dead, and that is recorded
   rather than hidden.** After this spec its only consumers are tests. Spec I is its
   intended consumer. Do not delete it.
4. **Selection is gated on `canDelete`, in both the view and the bar.** The views
   already compute `canDelete` and already pass `onBulkDelete={canDelete ? … :
   undefined}`, so restoring the bar without gating would show an anonymous visitor a
   Delete button wired to `undefined`. That is worse than the current no-op
   checkboxes. Gate at the view (no checkbox column at all) and defensively in
   `DataTable` (no bar without a handler).
5. **The auto-migration functions are un-exported, not deleted.**
   `cli/src/lib/generateSchema.ts:131-217` is a complete orchestration built on them
   — diff, make optional, write interim schema, deploy, migrate, write final. Deleting
   the exports would mean deleting real work that only fails because `diffSchema`
   always returns an empty diff.
6. **`autoMigrate: true` throws instead of silently no-opping.** It defaults to
   `false` (`config/types.ts:96`), so the error only fires on explicit opt-in.
7. **Mobile scope is 375 / 390 / 768 / 1024.** Phone and tablet only. 640, 1280 and
   1536 stay in spec J. 768 is mandatory in both directions because
   `use-mobile.ts` flips the sidebar between an inline rail and a `Sheet` exactly
   there (`ui/sidebar.tsx:69, 93-94`).
8. **Authenticated admin surfaces are audited in `apps/test`, anonymous ones in
   `apps/www`.** An anonymous visitor cannot open `CreateDocumentModal` or the media
   upload flow, so those need a real session, and `apps/test` is the sandbox for it.
9. **Social card work is content entry, not code.** The plumbing is complete and
   content-driven: `siteSettings.ogImage` and `pages.ogImage` are `upload()` fields
   resolved to URLs at `apps/www/src/lib/metadata.ts:77-80`, and the Twitter card is
   emitted only when `siteSettings.twitterHandle` is set (`:98-100`). Nothing to
   build; something to fill in.
10. **Every fix is mirrored into the `create-vexcms` templates in this spec, not as a
    follow-up.** The templates are hand-maintained copies with no extraction layer, so
    an unmirrored mobile fix means the defect keeps shipping to every new project —
    and a scaffold is exactly what the post invites people to generate. Steps 1-3 need
    no file mirroring (they live in published packages the templates consume by pinned
    version), but Step 4's `apps/www` fixes and any Step 7 README correction do.
11. **A red build cancels the post, not the other way round.** Step 8 is a gate. If
    it fails and cannot be fixed, post from the last green commit.

## Out of Scope

- The config client/server restructure. It ships as its own spec after this one.
- Live preview, versioning/drafts, richtext, lifecycle hooks — the launch track.
- The rest of spec A: the dead `admin.table` config, the `_createdAt` default, the
  `vex_` table convention.
- Spec B2's localization ADR.
- The 640 / 1280 / 1536 widths and the docs-site mobile pass beyond a spot-check.
- `www` site copy — the developer is reviewing and editing that in a parallel
  session.
- Any responsive finding that needs a component rewrite. File it in `backlog.md`.

## Implementation

### Step 1 — Make bulk selection reachable and permission-gated

`[agent]`

- [ ] `ui/data-table/DataTableBulkActions.tsx` — new prop shape
- [ ] `ui/data-table/DataTable.tsx` — wire the bar
- [ ] `views/CollectionListView.tsx` — gate selection on `canDelete`
- [ ] `views/MediaCollectionListView.tsx` — gate selection on `canDelete`
- [ ] `testing/dataTableSuite.tsx` — assert the bar; rewrite the bulk-actions block
- [ ] `testing/viewSuite.ts` — replace the absence-assertions
- [ ] `.changeset/` — patch entry

#### packages/react/src/components/ui/data-table/DataTableBulkActions.tsx

Two edits; everything not shown is unchanged.

**1 — props.** Replace `DataTableBulkActionsProps` entirely. The `selection` prop and
the `UseTableSelectionReturn` import both go; `DataTable` supplies a count and
callbacks.

```tsx
/**
 * Props for DataTableBulkActions component.
 */
export interface DataTableBulkActionsProps {
  /** Number of currently selected rows. The bar renders nothing when this is 0. */
  selectedCount: number;
  /** Invoked when the delete button is pressed — opens the confirmation modal. */
  onDelete: () => void;
  /** Invoked when the clear button is pressed — drops the current selection. */
  onClear: () => void;
  /** Whether a bulk delete is in progress; disables both buttons. */
  isDeleting?: boolean;
}
```

**2 — component.** Replace the whole function. The `all`/`inverse` badges are removed
per DD 2 — `selection.state.mode` was permanently `"page"`.

The bar is `fixed` and horizontally centred, so it is a Step 3 surface: at 375px the
count text plus two labelled buttons will not fit on one line. Leave the layout fix
to Step 3 rather than guessing at it here.

```tsx
/**
 * Floating bulk action bar, shown while one or more rows are selected.
 *
 * Rendered by {@link DataTable} only when a bulk action is actually available —
 * a caller whose role cannot delete passes no handler, so no bar appears.
 *
 * @param props - Component props.
 * @param props.selectedCount - Number of selected rows; 0 renders nothing.
 * @param props.onDelete - Opens the bulk-delete confirmation modal.
 * @param props.onClear - Clears the current selection.
 * @param props.isDeleting - Disables both buttons while a delete is in flight.
 * @returns The action bar, or `null` when nothing is selected.
 *
 * @example
 * ```tsx
 * <DataTableBulkActions
 *   selectedCount={selectedIds.length}
 *   onDelete={() => setDeleteModalOpen(true)}
 *   onClear={() => setRowSelection({})}
 *   isDeleting={isDeleting}
 * />
 * ```
 */
export function DataTableBulkActions({
  selectedCount,
  onDelete,
  onClear,
  isDeleting,
}: DataTableBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-lg border bg-background px-4 py-3 shadow-lg animate-in slide-in-from-bottom-5">
      <span className="text-sm font-medium">
        {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
      </span>
      <div className="flex items-center gap-2">
        <Button variant="destructive" size="sm" onClick={onDelete} disabled={isDeleting}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
        <Button variant="outline" size="sm" onClick={onClear} disabled={isDeleting}>
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  );
}
```

#### packages/react/src/components/ui/data-table/DataTable.tsx

Three edits; everything not shown is unchanged.

**1 — import.** Add beside the existing `BulkDeleteModal` import.

```tsx
import { DataTableBulkActions } from "./DataTableBulkActions";
```

**2 — the bar.** Replace the commented-out block (the seven `{/* … */}` lines between
the wrapper `<div>` and `<Table>`) with a live render. The `onBulkDelete` check is the
defensive half of DD 4: no handler means no bar, regardless of what the caller passed
for `enableBulkActions`.

```tsx
{enableBulkActions && onBulkDelete && (
  <DataTableBulkActions
    selectedCount={selectedIds.length}
    onDelete={() => setDeleteModalOpen(true)}
    onClear={() => setRowSelection({})}
    isDeleting={isDeleting}
  />
)}
```

**3 — JSDoc.** The component docblock's `@see DataTableBulkActions` line still reads
"exported for callers to render themselves; not yet wired into this component's own
selection UI". Replace that parenthetical — it is now wired.

#### packages/react/src/components/views/CollectionListView.tsx

One edit; everything not shown is unchanged.

**1 — gate selection.** On the `<DataTable>` element, `enableRowSelection` and
`enableBulkActions` are both hardcoded `true`. Drive both from the existing
`canDelete` value computed above, so a role without delete gets no checkbox column
instead of dead ones.

```tsx
enableRowSelection={canDelete}
enableBulkActions={canDelete}
```

#### packages/react/src/components/views/MediaCollectionListView.tsx

One edit; everything not shown is unchanged.

**1 — gate selection.** Same change on this view's `<DataTable>`, where the two props
are currently passed bare (`enableRowSelection` / `enableBulkActions`).

```tsx
enableRowSelection={canDelete}
enableBulkActions={canDelete}
```

#### packages/react/src/testing/dataTableSuite.tsx

Two edits; everything not shown is unchanged.

**1 — the unreachability comment.** Delete the comment block explaining that
"`DataTable`'s own bulk-delete trigger is unreachable through its rendered UI" and add
real assertions in its place inside the `DataTable` describe block. The bar is only
rendered when `onBulkDelete` is supplied, so both branches need covering.

```tsx
test("renders no bulk-actions bar when no rows are selected", () => {
  renderDataTable({ enableRowSelection: true, enableBulkActions: true, onBulkDelete: vi.fn() });
  expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
});

test("selecting a row reveals the bar, and confirming deletes the selected ids", async () => {
  const user = userEvent.setup();
  const onBulkDelete = vi.fn().mockResolvedValue(undefined);
  renderDataTable({ enableRowSelection: true, enableBulkActions: true, onBulkDelete });

  await user.click(screen.getAllByRole("checkbox")[1]!);
  expect(screen.getByText("1 item selected")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /delete/i }));
  await user.click(screen.getByRole("button", { name: /confirm|delete/i }));

  expect(onBulkDelete).toHaveBeenCalledWith(["doc_1"]);
});

test("clear drops the selection and hides the bar", async () => {
  const user = userEvent.setup();
  renderDataTable({ enableRowSelection: true, enableBulkActions: true, onBulkDelete: vi.fn() });

  await user.click(screen.getAllByRole("checkbox")[1]!);
  await user.click(screen.getByRole("button", { name: /clear/i }));

  expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
});

test("renders no bar without a bulk-delete handler, even when bulk actions are enabled", async () => {
  const user = userEvent.setup();
  renderDataTable({ enableRowSelection: true, enableBulkActions: true });

  await user.click(screen.getAllByRole("checkbox")[1]!);
  expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
});
```

Adjust the seeded row ids and the `renderDataTable` helper name to match whatever this
suite already uses — the assertions above name exact expected values (`"1 item
selected"`, `["doc_1"]`) and those must match the fixture.

**2 — the `DataTableBulkActions` describe block.** It currently drives a real
`useTableSelection` through a `renderWithSelection` helper. That hook is no longer a
prop, so replace the block with direct renders against the new shape: zero count
renders nothing, a non-zero count renders the pluralised label, `isDeleting` disables
both buttons, and `onClear` fires. Drop the `useTableSelection` and
`UseTableSelectionReturn` imports if nothing else in the file uses them.

#### packages/react/src/testing/viewSuite.ts

Two edits; everything not shown is unchanged.

**1 — the `canDelete` explanation.** Delete the comment block stating that
"`canDelete`'s only possible consumer is `DataTable`'s bulk-delete confirmation, but
`DataTable.tsx`'s bulk-actions bar … is commented out". It is no longer true.

**2 — the absence-assertion.** Replace the `expect(utils.queryByRole("button", { name:
/delete/i })).toBeNull()` assertion and its WIRING FINDING comment with the real
permission behaviour — this is the assertion that comment asked a future implementer to
write.

```tsx
test("a role without delete permission gets no selection checkboxes", async () => {
  const utils = await renderCollectionListView({ canDelete: false });
  expect(utils.container.querySelector('thead [data-slot="checkbox"]')).toBeNull();
});

test("a role with delete permission gets selection checkboxes", async () => {
  const utils = await renderCollectionListView({ canDelete: true });
  expect(utils.container.querySelector('thead [data-slot="checkbox"]')).not.toBeNull();
});
```

Match the suite's existing render helper and its permission-override mechanism; this
suite already drives permissions per-test elsewhere.

#### .changeset/bulk-selection-reachable.md

New file.

```md
---
"@vexcms/react": patch
---

Make the data-table bulk-actions bar reachable, and gate row selection on delete permission.

The bar was mounted but unreachable — `DataTable` never rendered it, so selecting rows did
nothing. Selection was also enabled unconditionally, which showed checkboxes to roles that
cannot delete.

`DataTableBulkActionsProps` is a breaking change for anyone rendering the component directly:
it now takes `selectedCount`, `onDelete`, `onClear` and `isDeleting` instead of a
`selection` object from `useTableSelection`. The `all` and `inverse` mode badges are removed;
they were unreachable without a select-all-across-pages control.
```

Verify: `pnpm --filter @vexcms/react test src/components/ui/data-table src/testing`

### Step 2 — Stop exporting the auto-migration no-ops

`[agent]`

- [ ] `core/src/index.ts` — drop the four exports
- [ ] `core/src/config/**` — throw on `autoMigrate: true`
- [ ] `core/README.md` — delete the Auto-Migration section
- [ ] `.changeset/` — patch entry

#### packages/core/src/index.ts

One edit; everything not shown is unchanged.

**1 — remove the exports.** Drop `diffSchema`, `planMigration`, `makeFieldsOptional`
and `addRemovedFieldsAsOptional` from the public surface. `packages/cli` imports them
from `@vexcms/core` today (`cli/src/lib/generateSchema.ts:9-14`) and must be repointed
at the internal module path in the same step so the CLI still typechecks. Keep the
`SchemaDiff`, `NeedsMigrationField`, `RemovedFieldInfo` and `MigrationOp` **types**
exported if anything outside core references them; drop them too if nothing does.

#### packages/core/src/config/config.ts

One edit; everything not shown is unchanged.

**1 — guard `autoMigrate`.** In `defineConfig`, where `schema` defaults are applied,
throw when the caller opts in. Placed at config resolution so it fails at module load
rather than mid-deploy.

```ts
if (input.schema?.autoMigrate === true) {
  throw new Error(
    "defineConfig: schema.autoMigrate is not implemented. Schema diffing and field " +
      "backfill are deferred past v0.1.0 — diffSchema currently returns an empty diff " +
      "for every input, so enabling this would silently migrate nothing. Remove the " +
      "option and apply schema changes manually.",
  );
}
```

#### packages/core/src/config/types.ts

One edit; everything not shown is unchanged.

**1 — document the guard.** The `autoMigrate` JSDoc currently describes it as a working
toggle. Note that setting it `true` throws, and that the option is retained so the
eventual implementation is not a new API.

#### packages/core/README.md

One edit; everything not shown is unchanged.

**1 — delete the section.** Remove `### Auto-Migration` in full, including its
`diffSchema`/`planMigration` code block. It documents a now-private API.

#### .changeset/defer-auto-migration.md

New file.

```md
---
"@vexcms/core": patch
---

Remove the unimplemented auto-migration helpers from the public API.

`diffSchema`, `planMigration`, `makeFieldsOptional` and `addRemovedFieldsAsOptional` were
exported but stubbed — `diffSchema` returned an empty diff for every input and
`planMigration` an empty operation list, so any caller silently migrated nothing. They are
now internal to the CLI.

`schema.autoMigrate: true` throws at config resolution instead of silently doing nothing.
The default is unchanged (`false`), so only an explicit opt-in is affected.
```

Verify: `pnpm --filter @vexcms/core build && pnpm --filter @vexcms/cli typecheck`

### Step 3 — Admin panel mobile pass (375 / 390 / 768 / 1024)

`[agent]`

`apps/www` sets `anonRole: USER_ROLES.user` (`src/auth/access.ts:25`), so `/admin` is a
live anonymous read-only demo and the post invites people into it.

Method: drive real Chromium with the `browser` tool, one `tab.screenshot()` and one
`tab.ariaSnapshot()` per surface per width. Commit the matrix under this spec's
directory. Responsively is the developer's own cross-check, not the audit — it is an
Electron app and an agent cannot drive it.

- [ ] Anonymous surfaces against `apps/www/admin`: `DashboardView`,
      `CollectionListView`, `CollectionEditView`, `MediaCollectionListView`,
      `MediaCollectionEditView`, `GlobalsListView`, `GlobalEditView`,
      `UnauthorizedView`
- [ ] Authenticated surfaces against `apps/test` (DD 8): `CreateDocumentModal`,
      `CreateMediaModal`, `MediaUploadForm` step 1 and step 2, `MediaLibaryGrid`,
      and one save flow
- [ ] Shell at each width: `AdminLayout`, `AdminSidebar`, `AdminTopNav`
- [ ] The 768 boundary crossed in both directions
- [ ] All 12 field inputs in an edit view, including `group` / `array` / `blocks` nesting
- [ ] Tailwind-only fixes
- [ ] Rewrite-scale findings filed in `backlog.md`

Known suspects, from reading the code — audit these first:

1. **`DataTable`'s horizontal scroll.** The wrapper is `overflow-x-auto`
   (`DataTable.tsx:225`), which is a fallback rather than a mobile design. A
   many-column collection at 375px is the worst case in the product.
2. **The new bulk-actions bar from Step 1.** `fixed bottom-4 left-1/2` with a count
   label and two labelled buttons will not fit one line at 375px.
3. **Sticky edit-view headers.** `CollectionEditView`, `MediaCollectionEditView` and
   `GlobalEditView` all carry a sticky header with Save/Cancel; vertical space is
   scarce at 375.
4. **`AdminTopNav` breadcrumbs.** A three-level trail whose chevron direction flips
   with `sidebar.side` (`:113-115`); overflow behaviour is untested.
5. **The two-step media upload accordion**, with a metadata form per file.
6. **The 768 sidebar flip** — inline rail to `Sheet` overlay.

Verify: screenshot matrix committed; at every width, no horizontal overflow outside the
data table's deliberate scroll region, no clipped control, no unreachable primary
action, no overlapping text.

### Step 4 — Marketing site mobile pass (375 / 390 / 768 / 1024)

`[agent]`

Same method as Step 3.

- [ ] Every route in `apps/www`: `/`, `/features`, and the rest of the site nav
- [ ] Every block renderer under `apps/www/src/vexcms/blocks/`
- [ ] Tailwind-only fixes
- [ ] `apps/docs` spot-check at 390 — Starlight is responsive by default, so this
      confirms rather than audits

Verify: screenshot matrix committed; every route clean at all four widths.

### Step 5 — Mirror the fixes into the create-vexcms templates

`[agent]`

Per DD 10. `apps/www` is the marketing overlay's source of truth and `apps/test` is
base's; the templates are hand-maintained copies with **no extraction layer**, so
nothing propagates on its own. A visitor running `pnpm create vexcms@alpha` receives
the scaffold, not `apps/www` — an unmirrored fix keeps shipping the defect.

**Follow the `template-sync` skill.** The steps below are its shape applied to this
spec's diff, not a replacement for it.

- [ ] Read the app→template translation table in
      `.agent/docs/specs/2026-08-31-wp2-cli-templates/spec.md` before touching
      anything — it is the authoritative source-path → template-path mapping. If a
      file touched here has no entry, extend that table first rather than inventing a
      mapping.
- [ ] `node scripts/template-diff.mjs --app apps/www` to surface Step 4's drift.
      Advisory only — it cannot tell an intentional template customisation from an
      unsynced fix, so cross-check against Step 4's own diff.
- [ ] Mirror Step 4's Tailwind fixes into `templates/marketing-site`
- [ ] Mirror any Step 7 README correction into `templates/base-nextjs/README.md`
- [ ] Preserve installer markers and underscore-renamed dotfiles
- [ ] Prohibited-pattern sweep
- [ ] `node scripts/sync-template-versions.mjs`
- [ ] Append one line to `.agent/docs/harness-changelog.md`

**Ownership is already settled for this spec's diff.** Both trees carry the same
eleven blocks (`CTA CodeShowcase FAQ Features Footer Header Hero HowItWorks Roadmap
Split Stats`), so Step 4's block-renderer fixes map 1:1 into the overlay. Per the
skill's boundary, `marketing-site` owns the blocks, the frontend routes that render
them, `src/app/globals.css` and `src/app/layout.tsx`; `base-nextjs` owns auth, the
admin panel, media, users, and env plumbing — so the scaffold README correction is
base's.

**Steps 1-3 need no file mirroring.** They live in `packages/react` and
`packages/core`, which the templates consume as pinned `@vexcms/*` versions. They
arrive in a scaffold through the version bump, which is why
`sync-template-versions.mjs` is in the checklist — templates pin literal versions and
must never contain `workspace:` or `catalog:`.

**Two traps the skill calls out that apply here.** Overwriting a template file
wholesale silently drops any `{{PROJECT_NAME}}` / OAuth / org / env marker it carried,
which ships a literal `{{PROJECT_NAME}}` to a user's project — diff before
overwriting, and check marker names against
`packages/create-vexcms/src/installers/{base,nextjs,providers,string-utils}.ts`. And
the overlay **cannot delete**: `overlayTemplate` only adds and overwrites, so anything
requiring removal of a base file or a `package.json` edit belongs in
`VexFrameworkInstaller.finalizeMarketingOverlay()`.

Nothing in this spec's diff is expected to need a deletion or a schema regeneration —
no collection, block config, or field changes — so the generated-artifact rule
(`convex/_generated/*` + `convex/vex.schema.ts` + `src/vex.types.ts` moving together)
should not fire. If Step 4 turns out to touch a block *config* rather than only its
renderer, it does fire, and all three must be regenerated rather than hand-edited.

Verify: `node scripts/scaffold-smoke.mjs --bare` and `node scripts/scaffold-smoke.mjs`
both exit 0. Both runs are required even though only overlay files changed — the
overlay is applied on top of base and can surface a base regression the bare run
alone would miss.

### Step 6 — Social card content

`[dev]`

No code. The plumbing is complete and content-driven — `siteSettings.ogImage` and
`pages.ogImage` are `upload()` fields resolved to URLs at
`apps/www/src/lib/metadata.ts:77-80`, page-level winning over site-level.

- [ ] Produce a 1200×630 OG image from page screenshots
- [ ] Upload it and set `siteSettings.ogImage` — the site-wide default
- [ ] Set `pages.ogImage` on the home page only if it should differ
- [ ] Set `siteSettings.twitterHandle` — without it, **no** `summary_large_image` card
      is emitted at all (`metadata.ts:98-100`)
- [ ] Read `siteSettings.metaTitle` and `metaDescription` as they will appear in a card
- [ ] Upload the 1280×640 GitHub social preview in repo settings — carried over from
      WP-4 step 7 in `tasks.md`

Note the empty-string trap already handled in code: optional text fields seed as `""`,
not `undefined`, which is why `firstNonBlank` exists (`metadata.ts:21-28`). A field that
looks blank in the admin is an empty string and will correctly fall through to the site
default — but a field set to a single space will not.

Verify: paste both the site URL and the repo URL into a Discord DM to yourself; each
renders a card with an image, the intended title, and the intended description.

### Step 7 — Walk the quickstart on a clean machine

`[dev]`

- [ ] `pnpm create vexcms@alpha` in an empty directory, following **only** `README.md`
- [ ] Record every point where the README is wrong, out of order, or silent
- [ ] Fix `README.md`
- [ ] Confirm first login succeeds
- [ ] Route any scaffold-owned README correction back through Step 5

The known failure this guards is the 403 on first login when `SITE_URL` and
`BETTER_AUTH_SECRET` are unset — documented at
`packages/create-vexcms/templates/base-nextjs/README.md:45` and in the docs quickstart,
and **still absent from the root README** — adding it is this step.

Verify: a scratch project reaches a successful first login with no step the README
omitted.

### Step 8 — Verification

`[dev]`

- [ ] `pnpm build`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `node scripts/verify-scaffold.mjs`
- [ ] `node scripts/scaffold-smoke.mjs --bare` and `node scripts/scaffold-smoke.mjs`
- [ ] `node scripts/check-packed-manifests.mjs --packed`
- [ ] `harness doctor` — no errors

`verify-scaffold` is the load-bearing one: it packs all 8 tarballs, scaffolds both
templates from them, installs, typechecks, builds, and asserts the prerender manifest
plus `/sitemap.xml` and `/robots.txt`. It is the closest thing to what a visitor
running `pnpm create vexcms@alpha` will experience.

`check-packed-manifests --packed` fails on any unresolved `catalog:` or `workspace:`
in a packed manifest, which is the exact failure mode Step 5's version sync can
introduce.

Per DD 11: if this step fails and cannot be fixed in time, post from the last green
commit rather than posting a red repo.

## Verification

Run `pnpm build`, `pnpm typecheck`, `pnpm test`, `node scripts/verify-scaffold.mjs` and
both `scaffold-smoke.mjs` runs from the repo root. Baseline before this spec is 947
tests passing and 14 typecheck targets clean; Step 1 changes test counts in
`dataTableSuite` and `viewSuite`, and those are the only suites expected to move.

Fix every failure before considering the spec done.
