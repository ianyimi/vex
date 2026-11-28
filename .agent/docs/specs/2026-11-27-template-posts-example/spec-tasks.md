---
status: in-progress
spec_id: 2026-11-27-template-posts-example
touches:
  - packages/create-vexcms/templates/base-nextjs/**
  - packages/create-vexcms/templates/marketing-site/**
  - apps/test/src/db/constants/auth.ts
  - apps/test/src/auth/access.ts
  - .agent/docs/specs/2026-08-31-wp2-cli-templates/spec.md
  - .agent/docs/harness-changelog.md
prompt_version: 1
---

# 2026-11-27-template-posts-example — Tasks

## Step 1 — Base template: roles, posts example, Plate
Why: a fresh scaffold has no collection showing the config API beyond `users`/`images`, and
only `admin`/`user` roles, so access examples have nothing to show.
Verify: `node scripts/regen-template-schema.mjs packages/create-vexcms/templates/base-nextjs` exits 0;
prohibited-pattern sweep is clean.
- [ ] `src/db/constants/auth.ts`: add `editor`, `viewer` to `USER_ROLES`
- [ ] `src/db/constants/index.ts`: add `TABLE_SLUG_POSTS`
- [ ] `src/vexcms/collections/posts.ts` (new example collection)
- [ ] `src/vexcms/collections/index.ts`: `export * from "./posts"`
- [ ] `src/vex.config.ts`: `editor: plateEditor()`, register `posts`
- [ ] `src/auth/access.ts`: `posts` resource; `editor`/`viewer` permission blocks
- [ ] `convex/schema.ts`: `posts` table import
- [ ] `package.json`: `@vexcms/richtext-plate` dependency + `vex:update` script
- [ ] Regenerate `convex/vex.schema.ts`, `src/vex.types.ts`, `convex/_generated/*`

## Step 2 — Marketing overlay: register posts beside pages
Why: the overlay replaces base's `collections/index.ts`, `vex.config.ts` and `convex/schema.ts`
but keeps base's `access.ts`, which now names `posts`; without this the marketing scaffold fails
typecheck.
Verify: `node scripts/scaffold-smoke.mjs` exits 0.
- [ ] `src/vexcms/collections/index.ts`: `export * from "./posts"`
- [ ] `src/vex.config.ts`: `editor: plateEditor()`, register `posts`
- [ ] `convex/schema.ts`: `posts` table import
- [ ] Regenerate overlay `convex/vex.schema.ts`, `src/vex.types.ts`, `convex/_generated/*` via a scaffold

## Step 3 — apps/test mirror, records, verification
Why: apps/test is base's source of truth; role constants must match. The template's posts.ts
is template-authored (apps/test's `posts` is a draft-workflow test surface) and the
translation table must say so.
Verify: `pnpm --filter test typecheck`; `node scripts/scaffold-smoke.mjs --bare`;
`node scripts/scaffold-smoke.mjs`; `node scripts/verify-scaffold.mjs`.
- [ ] `apps/test/src/db/constants/auth.ts`: add `viewer`
- [ ] `apps/test/src/auth/access.ts`: `viewer` permission block
- [ ] wp2 spec translation table: posts.ts row, auth.ts/access.ts/index.ts/vex.config.ts notes
- [ ] `.agent/docs/harness-changelog.md` entry
