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
