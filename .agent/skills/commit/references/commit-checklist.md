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
