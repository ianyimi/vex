# alpha.38 replay — every fix to re-apply across all four examples

Trigger: the developer says alpha.38 (or later) is published. Then, per example (`magazine`,
`real-estate`, `conference`, `restaurant` in `~/Documents/Projects/vex-examples`), in one pass:
bump, remove workarounds, apply lessons, verify locally, push. After that, the live deployments
(`deploy-today.md`). Then the developer re-reviews against each `<slug>/REVIEW.md`.

Everything app-level from the review iterations is ALREADY COMMITTED in the examples repo (see each
`REVIEW.md` Changes log). This file lists what changes because of the new library version, plus
lessons that must hold in every app.

## 1. Library fixes shipping in alpha.38 (monorepo, uncommitted until the developer commits)

| Fix | Changeset | What the examples must do |
|---|---|---|
| Owner checks find a relationship's automatic index | `access-relationship-auto-index` | drop explicit `index: "by_<field>"` added only for owner rules |
| `config` required on raw Local API server fns; base template ships bound `src/vexcms/api.ts` | (WP-2 changeset; verify it exists) | use the bound api everywhere; no manual `resolveGetAuth`, no manual `vex_status` filters |
| User table single source | `schema-user-table-single-source` | `convex/schema.ts` imports generated `user` |
| `convex/auth/api.ts` self-lookups bypass access | `auth-api-self-lookup-bypass` | template now has it; keep/confirm |
| Scaffolder hygiene + Convex-safe env | `scaffold-hygiene-and-convex-safe-env` | `.env.example` port/secret, `.gitignore` negation, `packageManager`, npm overrides |
| `vex deploy` flag passthrough; `vex:deploy` script | `cli-deploy-flag-passthrough`, `create-vexcms-deploy-script` | build command `pnpm vex:deploy --cmd 'pnpm build'` |
| Hidden linked docs: lock rows (relationship/upload edit + list + peek) | `relationship-hidden-item-row` | none |
| Populate applies target read rules (HiddenDocument) | `populate-rbac-target-read-rules` | renderers handle HiddenDocument (library does for admin; check example front ends never assume full docs for denied roles) |
| Nested populate (blocks/arrays/groups), `getGlobal` populate types, closed generated doc interfaces | (PopulateGaps changesets incl. `closed-generated-document-interfaces`) | remove `resolveBlockImages` / `resolveUploadImages` hand-resolvers and hand-written `Populated*` interfaces where populate now covers it; re-check upload-field populate typing (restaurant reported upload fields not accepted by `PopulateShape`) |
| First-ever publish respects owner rules | `publish-first-publish-owner-rules` | magazine authors can first-publish (re-test) |
| Admin topbar `UserDisplay`, padding, peek offset | `admin-topbar-user-and-padding` | none |
| Select popup full width + row click | (MultiSelectAnchor changeset) | re-test every select |
| Row hides conditional children's slots | (RowHiddenSlot changeset) | real-estate pricing row may return to a single row |
| List toolbar selection order; select-all removed; loaded count | (ToolbarSelectionOrder changeset) | none |
| Media list overflow | `media-list-overflow-wrapper` | re-test Images list signed out (conference) |
| Sidebar skeleton counts + disabled theme toggle | `admin-sidebar-skeleton-counts` | none |
| Form error scroll/focus (Save via handleSubmit, full error paths, array item markers) | (FormErrorScroll changeset) | re-test empty array item save in each app |
| Validator `dependsOn` | (ValidateDependsOn changeset) | conference room clash → one validator with `dependsOn: ["startsAt","durationMinutes"]` (or keep triple attach — pick dependsOn) |
| Stable `renderDefault`; masked numbers left-aligned | `stable-render-default-and-left-aligned-masks` | restaurant PriceInput: either call style works; remove any `rightAlign` config workaround |
| `disableLivePreview` moved to `@vexcms/next/livePreview/client` (server entry imports `next/headers`) | `next-live-preview-client-entry` | update any sign-out button import to `@vexcms/next/livePreview/client` |
| Validate-keys, deploy guide, docs | docs only | — |
| Masked number caret resets to 0 every keystroke (`number()` + `admin.mask: "decimal"`) | `masked-number-caret-reset` | restaurant number+decimal price field: typing in order now stays in order, caret stays at end |
| Admin sign-out lingered (shell stayed mounted/anonymous for seconds); sign-in after sign-out sometimes silently stuck on the sign-in page | `admin-sign-out-hard-navigation` | sign-out now hard-navigates to `config.auth.signOut.redirectTo` (default `"/"`) immediately; sign-in (modal + full page) hard-navigates on success too — re-test sign-out/sign-in cycle in every example |
| List view peek: Suspense-fallback skeleton was structurally unrelated to the settled panel (no header/tabs/field labels); header position text ("Label · N of M") shifted the title in/out with no reserved space | `list-peek-skeleton-and-header-shift` | none — re-open a peek on a slow connection/deep link and confirm the fallback shows the same header/tabs/field rows as settled, and the title never shifts |

## 2. Per-example replay

- **All:** pin exact alpha.38 (+ overrides/resolutions/packageManager), `pnpm install`, regenerate
  (`pnpm vex:dev` once linked), typecheck/lint/build (dev stopped for build), zero console errors on
  every public route and admin.
- **All:** seed array/blocks item ids via `assignArrayItemIds` (exported from `@vexcms/core`) instead
  of hand-rolled ids; `seed:reinit` patches missing ids.
- **All:** pages built from `pages` blocks; content + images server-rendered (curl proves); CLS 0;
  block spacing token; header pattern (Admin left of nav, fixed slots); domain chrome (no VexCMS
  www content); block components typed via `BlockComponents<…>` with no casts; cross-field
  validators via `dependsOn`.
- **magazine:** re-test author first-publish; byline-only user read; Copy link; dot-leader bylines.
- **real-estate:** fix `.env.local` Convex URL on relink; re-test cross-agent Mark sold, commission
  map, saved view, select popup, pricing row; images via nested populate.
- **conference:** room clash via `dependsOn`; Images list signed out (overflow fix); anonymous
  read-only admin; GitHub OAuth still blocked unless the developer creates an app.
- **restaurant:** PriceInput (focus, left-aligned, caret order — re-test after the caret
  investigation); `resolveBlockImages`/`resolveUploadImages` → nested populate; staff vs hours.

## 3. Known open items (not yet fixed)

- Restaurant price caret jumps before digits on alpha.37 — under investigation (RestaurantReview);
  confirm whether alpha.38's library fixes resolve it.
- `RenderBlocks` passes `{ block }` rather than flat props — library change only if the developer asks.
- `buttonVariants()` from `@vexcms/react` can't be called in server components.
- `upload` fields vs `PopulateShape` typing (restaurant report) — verify against the nested-populate work.
