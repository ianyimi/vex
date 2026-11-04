---
status: draft
spec_id: 2026-11-02-www-live-demo-admin-content
touches:
  - apps/www/src/db/constants/index.ts
  - apps/www/src/components/TestimonialFeatureRowAction.tsx
  - apps/www/src/components/TestimonialBulkApproveAction.tsx
  - apps/www/src/vexcms/collections/**
  - apps/www/src/vex.config.ts
  - apps/www/src/auth/access.ts
  - apps/www/convex/seed.ts
  - apps/www/convex/vex.schema.ts
prompt_version: 1
---

# 2026-11-02-www-live-demo-admin-content — Tasks

Launch-track adjacent: gives `apps/www`'s anonymous `/admin` demo (launch plan § S hardens it;
this spec fills it with content). **Prerequisite:** implementation waits until the developer
confirms the `apps/test` root-level `@auth` parallel/intercepting route modal AND it is ported
to `apps/www` — this spec never touches `apps/www/src/app/**`, but the demo entry flow
(`AdminDemoButton` → `/admin`, sign-in interception) must be verified on the post-move tree.

## Step 1 — Demo-collection constants [agent]
Why: every later file imports the table slugs and option maps.
Verify: `pnpm --filter www typecheck`
- [x] `apps/www/src/db/constants/index.ts` — add `TABLE_SLUG_TESTIMONIALS`, `TABLE_SLUG_PRODUCTS`, `TABLE_SLUG_LEADS`, and the `as const` option maps `TESTIMONIAL_SOURCES`, `PRODUCT_STATUSES`, `LEAD_SOURCES`, `LEAD_STATUSES` with derived unions (P-003)

## Step 2 — Testimonial list-action components [agent]
Why: `testimonials.ts` (Step 3) imports both components in `admin.components`; LSP-clean ordering puts them first. Ported from `apps/test` with only the import paths changed.
Verify: `pnpm --filter www typecheck`
- [x] `apps/www/src/components/TestimonialFeatureRowAction.tsx` — port of `apps/test/src/components/TestimonialFeatureRowAction.tsx`
- [x] `apps/www/src/components/TestimonialBulkApproveAction.tsx` — port of `apps/test/src/components/TestimonialBulkApproveAction.tsx`

## Step 3 — Collections, config registration, schema generation [agent]
Why: the three demo collections are the spec's core; registering them in `vex.config.ts` and regenerating makes the Convex tables and types exist, so access (Step 4) and seed (Step 5) compile against real slugs.
Verify: `pnpm --filter www typecheck`; the regenerated `apps/www/convex/vex.schema.ts` contains `testimonials`, `products`, `leads` tables with `by_source`, `by_status`, and the declared search indexes
- [x] `apps/www/src/vexcms/collections/testimonials.ts` — port of `apps/test`'s proven list-view showcase: `commitTs` `updatedAt` default sort, pinned/resized/hidden columns, `searchFields`, indexed `source` select, 2 relationships, 3 `admin.views` presets (`featured`, `with-contributor`, `needs-review` hidden-`where` on `internalScore`), row/bulk action contributions
- [x] `apps/www/src/vexcms/collections/products.ts` — new marketing collection covering the field types testimonials/pages don't: `date`, `color`, `url`, `email`, `json`, `group`, `array`, `upload`; `description` ships as `textarea` (developer decision 2026-11-02 — richtext swap is a post-launch-item-D follow-up, see spec Out of Scope); `admin.views` column presets (`catalog`, `pricing`)
- [x] `apps/www/src/vexcms/collections/leads.ts` — new hidden-fields showcase: `email`, `score`, `internalNotes` exist for admins, denied to the demo role in Step 4; `admin.views` presets (`hot-leads` hidden-`where` on `score`, `newsletter`)
- [x] `apps/www/src/vexcms/collections/index.ts` — barrel exports for the three new files
- [x] `apps/www/src/vex.config.ts` — `collections` array += `testimonials`, `products`, `leads`
- [x] Run `vex generate` (`pnpm --filter www vex:generate`) and commit the regenerated `convex/vex.schema.ts` / type output

## Step 4 — Access: anonymous demo role, read-only + hidden fields [dev]
Why: this is the security boundary of the live demo — the anonymous visitor (`anonRole` → `user`, already wired end-to-end) must read the new collections plus headers/footers, see preset views, and never see `internalScore` / `email` / `score` / `internalNotes` or any mutation path.
Verify: `pnpm --filter www typecheck && pnpm --filter www test` (the `admin.test.ts` shell suite validates the real `access` config)
- [x] `apps/www/src/auth/access.ts` — `resources` += `headers`, `footers`, `testimonials`, `products`, `leads`; `user`-role entries: `testimonials` (read minus `internalScore`, `readViews`), `products` (full read + `readViews`, the contrast case), `leads` (read minus `email`/`score`/`internalNotes`, `readViews`), `headers`/`footers` read-only (developer decision 2026-11-02), `user` collection read map `{ name: true }` so relationship cells resolve titles without exposing emails

## Step 5 — Seed: demo rows [agent]
Why: an empty demo shows nothing; 200 testimonials prove count/pagination/filter behavior, products/leads give every shipped field type and both hidden-`where` views real data.
Verify: `pnpm --filter www typecheck`; then from a terminal against the dev deployment run pnpm seed and confirm the report lists `testimonials x200`, `products x10`, `leads x60`; a second run reports all three as skipped
- [x] `apps/www/convex/seed.ts` — three new sections in `runSeed` before the return: deterministic batch inserts, insert-if-missing by count (mode-independent, matching `apps/test`'s testimonials section), `contributorId` only when users exist (never throw — www seeds before first sign-in)

## Step 6 — Verification
Why: proves the demo end to end as an anonymous visitor and as admin, and settles the select-`eq` question live.
Verify: `pnpm --filter www typecheck && pnpm --filter www test`; manual browser walkthrough per spec § Verification
- [ ] Run build + tests; walk the anonymous and admin checklists in `spec.md` § Verification
- [x] Select-`eq` probe (developer decision 2026-11-02): as admin, manually filter Leads on `status` = `won`; if it matches the array-stored select, add the "Won" preset to `leads.ts` and re-verify, otherwise record the finding in spec.md Design Decision 8 — **resolved** (follow-up, 2026-11-03): fixed at the core query-translation layer (`normalizeArrayStoredWhere`, `packages/core/src/db/queryArgs.ts`); re-verified live, "Won" preset added to `leads.ts`, Design Decision 8 updated with the fix
