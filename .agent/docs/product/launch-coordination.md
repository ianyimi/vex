# Launch implementation — coordination board

Four sessions implement four specs **at the same time, in one working tree**. This file is how
they coordinate. It's the only file every session writes to. Binding together with
`launch-cross-spec-decisions.md`.

| Session | Spec | Owns rows in § Status |
|---|---|---|
| QP | `.agent/docs/specs/2026-11-06-quality-pass/` | QP-* |
| LI | `.agent/docs/specs/2026-11-06-launch-infrastructure/` | LI-* |
| PP | `.agent/docs/specs/2026-11-06-public-presence/` | PP-* |
| LK | `.agent/docs/specs/2026-11-06-launch-kit-final-review/` | LK-* |

## Rules

1. **Re-read this file before every step and after every wait.** Only the session's lead agent
   edits it. Subagents report to their lead; they never edit this file.
2. **Edit only your own rows**, plus § Locks and § Human queue (append only). Keep the edits
   small and surgical: re-read the file, then change one row, so you don't overwrite a sibling's
   concurrent edit.
3. **A step starts only when every entry in its "Waits for" cell is `done`.** "Waits for" lists
   cross-spec and human dependencies. The order inside a spec is the spec's own order.
4. **Status values:** `todo` · `in-progress` · `done` · `waiting` (and the Notes cell says on
   what) · `human` (only the developer can do it; see § Human queue).
5. **Blocked?** Skip ahead to the next step in your spec whose dependencies are met. When every
   remaining step is blocked, wait without burning tokens: a single shell loop
   (`sleep 300`, re-check this file's dependency rows, up to the 3600 s tool limit), repeated
   until something unblocks. Don't end the session while your spec has steps that are not
   `done`/`human`, except for the final stop in rule 11.
6. **Shared files need a lock** (§ Locks) for the duration of the edit, plus the checks that
   verify it. Re-read the row, add `LOCKED <session> <step> <ISO time>`, edit, verify, then
   set it back to `free`. A lock older than 2 hours with no matching `in-progress` row is stale:
   note it in § Log and take it.
7. **Other sessions' half-finished work is not yours.** If typecheck, test or lint fails only in
   files that another session's `in-progress` step touches, don't fix it. Wait for that step,
   then re-run. Fix only failures in your own files.
8. **No dev servers** (P-024). www runs on :3030 and `apps/test` on its usual port; attach
   to them. No `git commit`, `git stash`, `git checkout -- <path>`, reset or branch switch
   (`commit_mode: message-only`). The developer commits.
9. **M (telemetry) is "committed"** when `git log --oneline -- packages/telemetry` shows a
   commit and `git status --short packages/cli packages/telemetry packages/create-vexcms`
   is empty. Until then, don't touch those paths or `apps/test`, `packages/core/src/config/config.ts`
   or `scripts/` files M changed.
10. **Human-only work** goes in § Human queue with what it unblocks, and the row is set to
    `human`. Keep going with everything else. When a queue item is checked off, the owning
    session resumes the dependent step.
11. **When done:** set the remaining rows to `done` or `human`, append a § Log line, then stop.

## Locks

| Shared file / area | Lock |
|---|---|
| `apps/www/convex/seed.ts` | free |
| `apps/test/convex/seed.ts` | free |
| `apps/test/**` (ports: QP-12, LI-16, seed mirrors) | free |
| `pnpm-workspace.yaml` + `pnpm-lock.yaml` + any `package.json` (`pnpm install`) | free |
| `eslint.config.mjs` | free |
| `.github/workflows/*` | free |
| `apps/www/src/app/layout.tsx` | free |
| `apps/www/next.config.ts` | free |
| `apps/www/e2e/routes.ts` | free |
| `apps/docs/astro.config.mjs` | free |
| `apps/www/vitest.config.ts` | free |
| `.agent/docs/product/v0.1.0-launch-plan.md` + `backlog.md` | free |

## Status

### QP — quality pass

| Row | Step | Waits for | Status | Notes |
|---|---|---|---|---|
| QP-0 | Write `spec.md` from `spec-tasks.md` (dev-spec step 6) | — | todo | |
| QP-1 | Inventory | QP-0 | todo | |
| QP-2 | Audit tooling, non-blocking | QP-1 | todo | |
| QP-3 | Baseline run + findings | QP-2 | todo | |
| QP-4 | Document shell | QP-3, PP-14, LI-13 | todo | runs over the final set of www pages |
| QP-5 | UI primitives vs APG | QP-3 | todo | |
| QP-6 | Admin views, fields, widths | QP-5 | todo | |
| QP-7 | www pages, blocks, images, perf | QP-4, PP-10, PP-13, PP-14, LI-10, LI-13 | todo | |
| QP-8 | Security + caching headers | QP-7, LI-11 | todo | the preview check needs a pushed branch → human queue |
| QP-9 | Manual pass | QP-8 | todo | agent writes `manual-checklist.md`, then the row → `human` |
| QP-10 | CI gates | QP-8 | todo | bypass secret + branch protection → human queue |
| QP-11 | Accessibility statement | PP-1, PP-2 (`hello@` address decided) | todo | |
| QP-12 | Port www fixes → `apps/test` | QP-11, LI-16, M committed | todo | `apps/test/**` lock |
| QP-13 | K conformance review (widened) | QP-12, LI-7, PP-14, M committed | todo | |
| QP-14 | Bookkeeping | QP-13 | todo | |

### LI — launch infrastructure

| Row | Step | Waits for | Status | Notes |
|---|---|---|---|---|
| LI-1 | Roles hotfix | — | todo | **first**; deploy → human queue |
| LI-2 | www Convex test harness + rate limiter | LI-1 | todo | |
| LI-3 | Read-only access suite | LI-2 | todo | |
| LI-4 | Bootstrap subscription fix | — | todo | |
| LI-5 | Anonymous purge + cron | LI-2 | todo | |
| LI-6 | Auth rate limits | LI-2 | todo | the secret → human queue |
| LI-7 | Roles guard in core | M committed | todo | |
| LI-8 | Live read-only proof on production | LI-1…7, human: prod deploy + CLI access | todo | |
| LI-9 | Convex Starter + sizing | human: plan upgrade | todo | agent measures after |
| LI-10 | `/tour` fallback | — | todo | recapture → LK-8 |
| LI-11 | Speed Insights | — | todo | |
| LI-12 | Web Analytics on docs | — | todo | enabling it on Vercel → human queue |
| LI-13 | `/privacy` | PP-1, PP-2 | todo | |
| LI-14 | Docs: page analytics | — | todo | |
| LI-15 | Vercel Pro + uptime | human | todo | agent writes the `operations.md` template |
| LI-16 | Port → `apps/test` | LI-13, M committed | todo | `apps/test/**` lock |
| LI-17 | N: sync templates | QP-12, QP-13, PP-10, PP-13, PP-14, M committed | todo | LK-9 is **not** required: posts and `launch-week` are excluded from the templates (decision 6), and L checks the scaffold |
| LI-18 | N: scaffold from tarballs | LI-17 | todo | |
| LI-19 | N: run-through per template | LI-18, human: fresh Convex projects + dev servers | todo | |
| LI-20 | N: README + quickstart | LI-19 | todo | |
| LI-21 | Bookkeeping | LI-20 | todo | |

### PP — public presence

| Row | Step | Waits for | Status | Notes |
|---|---|---|---|---|
| PP-1 | `public-copy.md` | — | todo | **first**; gates LI-13, QP-11 |
| PP-2 | Accounts + addresses | human | todo | usernames gate PP-8/10/11 hrefs |
| PP-3 | Labels + sync script | PP-1 | todo | `--prune` run → human queue |
| PP-4 | Issue forms + PR template | PP-3 | todo | |
| PP-5 | CONTRIBUTING / CoC / SECURITY | PP-1 | todo | |
| PP-6 | Repo settings | human | todo | |
| PP-7 | Starter issues | PP-3 | todo | agent drafts; filing → human queue |
| PP-8 | FUNDING.yml + Sponsors profile | PP-2 | todo | |
| PP-9 | Docs roadmap | PP-1 | todo | issue links fill in after PP-7 is filed |
| PP-10 | Seed copy: roadmap, FAQ, footer | PP-1, PP-2 (usernames) | todo | `apps/test` half waits for M |
| PP-11 | Docs header + slim README | PP-1, PP-2 | todo | |
| PP-12 | Comparison page | PP-1 | todo | |
| PP-13 | Brand kit + `/brand` | PP-10 | todo | |
| PP-14 | www posts + announcement | PP-13 | todo | |
| PP-15 | Private docs out of the repo | human, after all four sessions stop | todo | |
| PP-16 | Demo media | LK-8 | todo | the shared media session |
| PP-17 | README quick start | LI-19 | todo | |
| PP-18 | Release notes (draft) / Release | everything else | todo | release-time parts → human queue |
| PP-19 | Bookkeeping | PP-17 | todo | |

### LK — launch kit + final review

| Row | Step | Waits for | Status | Notes |
|---|---|---|---|---|
| LK-1 | Channel sources | — | done | |
| LK-2 | Accounts | human | todo | |
| LK-3 | Kit skeleton, briefs, fact sheet | — | todo | |
| LK-4 | Prepared-answer fact sheets | LK-3 | todo | |
| LK-5 | Schedule, submissions, checklists | LK-3 | todo | |
| LK-6 | Hand-written posts | human | todo | HN rule: the developer writes every public sentence |
| LK-7 | Draft lint | LK-6 | todo | |
| LK-8 | Shared media session | QP-6, QP-7, human | todo | covers the PP-16 media and the LI-10 recapture |
| LK-9 | Seed launch-week posts + recap | PP-14, LK-7, M committed (`apps/test` half) | todo | |
| LK-10 | Schedule lock + listings | human, after QP/LI/PP are done | todo | |
| LK-11 | `copy-flip.patch` | QP-14, LI-21, PP-19 | todo | the agent prepares it; L reviews it |
| LK-12 | L: inventory refresh | LK-11 | todo | agent prep for the developer's review |
| LK-13 | L: evidence pre-pass | LK-12 | todo | agent; then the session stops |
| LK-14…22 | L: the developer's read-through | human | todo | |
| LK-23 | Bookkeeping | LK-22 | todo | |

## Human queue

Append-only. Format: `- [ ] <session>-<step>: <what to do> → unblocks <rows>`.

## Log

Append-only. One line per notable event: step done, lock taken over, a wait over 1 hour, a spec
deviation.
