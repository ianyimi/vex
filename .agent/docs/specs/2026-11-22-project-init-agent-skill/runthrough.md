# Run-through — `vexcms-project-init`, 2026-11-22

A subagent was given only the output of
`npx skills@1.9.0 use ./skills/vexcms-project-init` (a local path stands in for GitHub until the
skill reaches `master`) and followed it as the user's agent, playing the user from a scripted
persona. It ran under the developer's scoped P-024 exception: `~/tmp/vex-skill-runthrough`, port
3300, a new Convex project `vex-skill-runthrough` (team `isaiah-anyimi-83b5b`, dev deployment
`quaint-narwhal-438`). Published packages: `create-vexcms`/`@vexcms/*` `0.1.0-alpha.39`.

Persona: marketing starter, no orgs, port 3300 (so the step 3b path, the interactive CLI driven in a
PTY, install yes), Convex AI files yes, content model yes (a blog: `posts` with drafts plus
`authors`).

## Result

- Reached `/admin` as the first user. `npx convex data user` → `roles: ["user","admin"]`.
- Content model: `posts` and `authors` written, registered and generated (`[vex] Added to
  schema.ts: posts, authors`). Both appear in the `/admin` sidebar. One author and one draft post
  linked to it were created in the browser and confirmed with `npx convex data`.
- Timing: scaffold with install ~46 s, `ai-files install` ~7 s, `vex:dev` ready ~4 s, first `curl`
  200 ~14 s (cold Turbopack compile).
- Observed output: `vex:dev` prints `✔ Convex functions ready!`; `pnpm dev` prints `✓ Ready in …`;
  `ai-files install` created `AGENTS.md`, `CLAUDE.md`, `convex/_generated/ai/guidelines.md` and
  `.agents/skills/`; the interactive CLI made the commit `Initial commit from create-vexcms`.
- Cleanup: both processes stopped, port 3300 free, folder deleted. The Convex project is left for
  the developer to delete (§ Human queue).

## Findings → skill changes

| # | Class | Finding | Change |
| - | ----- | ------- | ------ |
| 1 | WRONG | A bare `npx convex dev --once` in an agent shell (no TTY) silently created a **local anonymous** deployment (`CONVEX_DEPLOYMENT=anonymous:…`, `http://127.0.0.1:3210`), even though the CLI was logged in. The "no `placeholder.convex` left" check passed anyway. | Step 5 now runs `npx convex dev --once --configure new --project <name> --dev-deployment cloud` (the run-through's working command; no team prompt on a single-team account). The done check requires `CONVEX_DEPLOYMENT=dev:…` and a `.convex.cloud` URL; `anonymous:` means log in and rerun. Troubleshooting row updated. Guide step 5 updated. |
| 2 | GAP | The interactive CLI never asks for the starter, so a bare project needs `--bare` on the 3b command. | 3b says so and lists the prompts in order (install defaults to no). |
| 3 | GAP | `richtext()` needs `@vexcms/richtext-plate` plus `editor: plateEditor()`; without them the admin shows a configuration error. The subagent found this only by reading the field page. | `content-model.md` step 2 gained a **Rich text** bullet. |
| 4 | WRONG | "`pnpm typecheck` passes" failed on an untouched marketing scaffold after codegen: `src/lib/metadata.ts(31,21): TS2352 … 'PagesDocument[]' to type 'Record<string, unknown>[]'`. The same error showed with and without the content-model edits (checked by stashing them). A fresh `--yes` scaffold typechecks before codegen. | `content-model.md` step 3 checks only the files the agent wrote and takes a baseline before step 2. The scaffold bug itself is reported to the developer and not fixed here (template code, outside this spec). |
| 5 | UNCLEAR | "Sign in → Sign up in the header": **Sign Up** sits inside the sign-in form, not in the header. | Step 8 reworded. |
| 6 | UNCLEAR | The first `curl` took ~14 s. | Step 7 notes 15–30 s for the first request. |

Also checked after the fixes: `pnpm create vexcms@alpha yes-check --yes` (step 3a) → git commit
`Initial commit from create-vexcms`, `.env.local` with placeholders, `dev` on `--port=3010`,
`pnpm install` and `pnpm typecheck` clean. Folder deleted.

Not exercised: the GitHub-hosted commands (`npx skills add ianyimi/vex …`,
`npx skills use ianyimi/vex@vexcms-project-init`, the raw.githubusercontent fallback in
`agent-setup.md`) work only once `skills/` is on `master`. The § Human queue item covers the
post-merge check.
