---
status: draft
spec_id: 2026-11-22-project-init-agent-skill
touches: ["skills/**", "apps/docs/src/content/docs/guides/agent-skills.mdx", "apps/docs/public/agent-setup.md", "apps/docs/astro.config.mjs", "apps/docs/src/content/docs/dev/naming-conventions.mdx", "apps/docs/src/content/docs/dev/project-structure.mdx", ".agent/docs/standards/naming-conventions.md"]
prompt_version: 1
---

# 2026-11-22-project-init-agent-skill — Tasks

Launch plan item 20 (SKILL, `v0.1.0-final-sprint.md` § 3b). Adds one installable Agent Skill,
`vexcms-project-init`. A user's coding agent follows it to take an empty folder to a running
VexCMS project with a signed-in admin, then asks whether to continue into the content model. The
skill lives in a public root `skills/` folder built for more numbered skills, uses the format
Convex's `convex/agent-skills` uses, installs with `npx skills add ianyimi/vex`, and is documented
at `/guides/agent-skills/`. A Convex-style `agent-setup.md` is served at
`docs.vexcms.dev/agent-setup.md`, and both are wired into llms.txt. Agent-implemented (developer
delegated).

## Step 1 — `skills/` folder and the `vexcms-project-init` skill [agent]
Why: the skill is the deliverable. A root `skills/` folder is where `npx skills` looks, and it keeps
the harness's internal `.agent/skills/` out of what users can install. The numbered index plus the
naming rule let skill 02 and later follow without anyone redesigning the folder.
Verify: from the repo root, `npx skills add . --list` lists exactly `vexcms-project-init`;
`npx skills use ./skills/vexcms-project-init` prints the skill and a path to its `references/`;
`harness doctor` shows no naming-violation for `skills/*`.
- [x] `skills/README.md`: numbered index (01 `vexcms-project-init`), install line, rules for adding a skill
- [x] `skills/vexcms-project-init/SKILL.md`: the quickstart flow, the Ask/User stops, the troubleshooting table and the content-model checkpoint
- [x] `skills/vexcms-project-init/references/content-model.md`: the phase after the checkpoint
- [x] `.agent/docs/standards/naming-conventions.md`: `agent-skill-folders` rule
- [x] `apps/docs/src/content/docs/dev/naming-conventions.mdx`: `#### agent-skill-folders` entry
- [x] `apps/docs/src/content/docs/dev/project-structure.mdx`: one paragraph on `skills/`

## Step 2 — Docs guide, `agent-setup.md`, llms.txt wiring [agent]
Why: users and agents need one public page that explains how to install the skill (COPY's README
line links `/guides/agent-skills/`), plus a single URL an agent can be pointed at (Convex's
`agent-setup.md` pattern). The llms.txt indexes are where agents already go first.
Verify: `pnpm --filter docs build` green. `dist/llms.txt` has the agent-setup line, the guide is
listed in `dist/llms.txt` and is in `llms-small.txt`, `dist/agent-setup.md` is served byte for
byte, and `git apply --check` of LK's `copy-flip.patch` still passes.
- [x] `apps/docs/src/content/docs/guides/agent-skills.mdx`
- [x] `apps/docs/public/agent-setup.md`
- [x] `apps/docs/astro.config.mjs` (lock): `details` line + `promote` entry

## Step 3 — Agent run-through and bookkeeping [agent]
Why: Convex's rule for skills is to validate them by running them for real in a throwaway project,
not by reading them. The developer granted a P-024 exception for this, scoped to the run-through:
`~/tmp/vex-skill-runthrough`, port 3300, and a new Convex project `vex-skill-runthrough`.
Verify: a subagent given only `npx skills use` output reaches `/admin` as the first admin
(`roles` contains `admin`), the content-model phase adds a collection that appears in `/admin` and
passes `pnpm typecheck`, and every fix it shows up is applied to the skill. Servers stopped and the
folder deleted afterwards; deleting the Convex project goes to the human queue.
- [x] run-through log `runthrough.md` in this spec folder; skill fixes applied
- [x] board: SK rows + log lines (P-024 exception scope, copy-flip heads-up for LK)
- [x] launch plan item 20 + final-sprint § 3b SKILL ticked (lock)
- [x] session log entry with the guide's final URL for COPY
- [x] `harness tasks`, `harness struct`
