# Init Phases — Questions and Data Shapes

Every phase ends with `harness init write-phase <n> --data -` receiving the JSON shape shown.
Ask only what inference (see inference.md) could not answer.

## Phase 1 — Project Identity

Detect first, confirm: project name, one-line description, primary language, repo type.
Data: `{ "project": "<kebab-name>", "description": "<one line>", "language": "<lang>", "repo_type": "standard" | "bare-git-worktrees" }`

## Phase 2 — Project Purpose + Team

Ask: What does this project do? Who works on it (solo / small team / open source)?
Data: `{ "purpose": "<sentence>", "team": "solo" | "small-team" | "open-source" }`

## Phase 3 — Domains + Standards Folders

Propose domains from the detected stack; NEVER propose a domain the project doesn't need.
Present the ✅/❌ list for correction before creating anything.
Data: `{ "domains": ["backend", "frontend", ...] }` (kebab-case)

## Phase 4 — Tech Stack

Present detected stack (deps from manifest files) as a draft tech-stack.md. Ask only about
ambiguous choices. The CLI adds `verified_at` frontmatter itself.
Data: `{ "tech_stack_md": "<full markdown body>" }`

## Phase 5 — Dev Processes + Environment

Detect scripts; ask about ports, tmux layout, verification commands, and required env vars.
Data: `{ "dev_processes_md": "<markdown>", "env_vars": [{ "name": "VAR", "desc": "<what>", "required": true }] }`

## Phase 6 — Key Dependencies for Source Cloning

Present top deps; ask which are open source and worth cloning (recommend by integration depth).
None is a valid answer.
Data: `{ "dependencies": [{ "package": "<npm name>", "version": "<pin>", "repo": "github.com/org/repo" }] }`

## Phase 7 — Workflow + Modules + Manifest

Ask: developer implements all code (high-care) or agent implements (low-care)? High-importance
(enables polish)? Commit mode? Propose modules by project type. This phase assembles and writes
manifest.json.
Data:
```json
{
  "platforms": { "active": ["omp", "claude"] },
  "workflow": { "default_tier": "high-care", "importance": "medium", "developer_implements": true, "post_implement_polish": false, "commit_mode": "message-only" },
  "modules": { "specs": true, "tasks": true, "session_log": true, "roadmap": false, "design": false, "decisions": true, "research": true, "env_manifest": true, "naming_conventions": true }
}
```

## Phase 8 — Naming Conventions (high-care)

Infer patterns from existing code first; interview only the gaps (see naming-interview.md).
Data: `{ "naming_conventions_md": "<markdown with rules yaml block>" }` ("" to skip)

## Phase 9 — Mission + Roadmap

Ask: mission in one paragraph; next 3 milestones (only if roadmap module enabled).
Data: `{ "mission_md": "<markdown>", "roadmap_md": "<markdown, optional>" }`

## Phase 10 — Generate + Sync

No data — run `harness init finish`, then sync/index if available.

## Questions that remain under a template

| Phase | Under a template |
|---|---|
| 1 | Name + description — always asked |
| 2 | Purpose + team — asked (unless a hand-edited template pins `team`) |
| 3 | Confirm-only (staged domains) |
| 4 | Tech-stack confirm — inference-driven, always |
| 5 | Env var names, ports, dev commands — always asked |
| 6 | Dependency VERSION confirm — names/repos staged, versions re-resolved here |
| 7 | Confirm-only (staged workflow/modules/platforms) |
| 8 | Naming CONFIRMATION — the seeded naming-conventions.md is presented for confirm-or-edit |
| 9 | Mission + roadmap — always asked |
