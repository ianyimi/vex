# Commit Checklist

> Customized during `harness init`'s commit-gate step; edit freely — the commit skill runs
> every line, every time, and blocks the commit message until "Must pass" items pass (or the
> developer explicitly waives them; waivers are logged).

## Must pass

- [ ] `harness doctor` exits 0
- [ ] `pnpm typecheck` passes (full workspace)
- [ ] `pnpm test` passes (full workspace)
- [ ] `pnpm build` passes (full workspace — includes `apps/docs` build, which runs TypeDoc with `treatWarningsAsErrors`; catches tsup/exports breakage and any broken `{@link}`/undocumented type)
- [ ] `pnpm lint` passes (eslint-plugin-jsdoc — every export documented)
- [ ] `harness struct --check` reports no naming violations
- [ ] `pnpm install --frozen-lockfile` passes — this is how CI and Vercel install. A `package.json` dependency edit that was never followed by an install leaves `pnpm-lock.yaml` stale, and `.npmrc`'s `shamefully-hoist=true` hides it locally: the package resolves from the hoisted root and every other check passes. CI then fails with `ERR_PNPM_OUTDATED_LOCKFILE`. Run it whenever any `package.json` changed, and commit the resulting `pnpm-lock.yaml`.
- [ ] `pnpm check:vercel` passes when `apps/www` or any package it imports changed — a pristine copy of tracked + untracked files, `pnpm install --frozen-lockfile`, then the real `vercel.json` build. Catches faults invisible in this working copy (missing `packages/*/dist`, stale lockfile, unbuilt workspace deps). Needs network: a pristine tree has no `.next/cache`, so `next/font` fetches Geist from `fonts.googleapis.com` and the build fails offline — that failure is environmental, not a code fault.
- [ ] No unintended files staged (review `git status` before committing)

## Must be current

- [ ] Changeset created for any change to a published package (`pnpm changeset` — `@vexcms/*`, `create-vexcms`)
- [ ] JSDoc present on new/changed exported symbols, and every `{@link}` resolves in TypeDoc
- [ ] Today's session-log entry is filled in (what/decisions/problems/left-off)
- [ ] `docs/tasks.md` reflects finished work (`harness tasks move … --to done`)
- [ ] `harness struct` run if files were added or moved
- [ ] `harness state` regenerated
- [ ] Completed milestones ticked in `docs/product/roadmap.md`
- [ ] New architectural decisions captured as ADRs
- [ ] **Public-facing surfaces are consistent with the committed code.** For every behavior, API, config option, field, or CLI change in the working tree, check and update the places a user reads: `apps/docs` (guides, field pages, roadmap), package `README.md`s, the root `README.md`, and `apps/www` marketing copy (blocks, seed content, feature lists). A shipped change with a stale doc, or a doc claiming something the code does not do, is a gate failure — fix the text or the code, never leave the reader wrong.
- [ ] **`apps/www` / `apps/test` changes considered for `template-sync`.** `apps/www` is the source of truth for `templates/marketing-site` and `apps/test` for `templates/base-nextjs`; nothing propagates automatically. Run `node scripts/template-diff.mjs --app apps/www` (and `--app apps/test`). Structural and code fixes are mirrored via the `template-sync` skill; vexcms-specific marketing copy and seed content is *not* (the template ships generic starter content). Record what was mirrored and what was deliberately left in the commit body.
- [ ] **`llms.txt` / `llms-small.txt` / `llms-full.txt` are current and still describe the project.** They are BUILD ARTIFACTS: `starlight-llms-txt` regenerates all three (plus the `_llms-txt/*.txt` custom sets) into the gitignored `apps/docs/dist/` on every `pnpm --filter docs build`, and Vercel serves them from that build — so there is nothing to commit and nothing to hand-edit. What can rot is the hand-written framing in `apps/docs/astro.config.mjs`'s `starlightLlmsTxt({ … })` block: `description`, the `details` interpretation notes (alpha status, the `vex.config.ts` / `vex.config.server.ts` split, generated schema/types, what `/api/**` is), `optionalLinks`, `customSets` (one per docs directory), and `exclude`/`promote`/`demote`. When this commit changes an architectural fact named in `details`, adds or removes a docs directory, or renames a promoted page, update that block in the same commit. Then confirm currency rather than assuming it: after the checklist's `pnpm build`, grep the regenerated `apps/docs/dist/llms-full.txt` for one distinctive string this commit ADDED to the docs and one it REMOVED — the added string must appear, the removed one must be gone (use `grep -F`; an unanchored `.` in a name like `vex.auth` also matches `vex/auth` and reads as a false positive). Also sanity-check that `llms-small.txt` stays a small fraction of `llms-full.txt` (currently ~181 KB vs ~1.26 MB): the two converge when `exclude` stops covering the generated `api/**` tree, which silently makes the abridged set useless.
