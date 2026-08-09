# Agent Harness Guide — vexcms

> Read this before editing ANY part of `.agent/`. It explains how this project's harness is
> organized, where each kind of knowledge goes, and how the pieces link together.

## Layout — generated vs authored vs learned

| Path | Kind | Regenerate with |
|---|---|---|
| `manifest.json`, `AGENTS.md`, this guide | authored once (init), then maintained | — |
| `docs/product/*` (mission, tech-stack, dev-processes) | authored at init, kept current | verified_at sha checked by doctor |
| `docs/standards/anti-patterns.md` | LEARNED — append-only, never compacted | — |
| `docs/standards/preferences.md` | LEARNED — compacted mechanically | `harness pref compact` |
| `docs/standards/naming-conventions.md` | LEARNED — rules block + prose | — |
| `docs/standards/<domain>/*.md` | LEARNED — practices with `applies_to` globs | — |
| `docs/standards/directory-structure.md` | GENERATED | `harness struct` |
| `docs/standards/index.yml` | GENERATED | `harness index rebuild` |
| `context-rules.yaml`, `.sync-manifest.json`, bridges (`.omp/`, `.claude/`) | GENERATED | `harness sync` |
| `docs/state.md` | GENERATED | `harness state` |
| `docs/session-log/**` | append-only diary | `harness log append` |
| `docs/harness-changelog.md` | LEARNED — append-only audit of harness changes (advisor-maintained) | — |

Never hand-edit a GENERATED file — run its command instead.

## Where knowledge goes

| New knowledge | Destination |
|---|---|
| A corrected agent mistake | `anti-patterns.md` — `- AP-NNN (date, seen Nx) rule` (append-only) |
| A style/API pattern seen ≥2× | `preferences.md` — `- P-NNN (date) rule` |
| A naming pattern | `naming-conventions.md` rules block, then `harness struct` |
| An architectural decision | `docs/decisions/ADR-NNN.md` |
| A coding practice for an area | `docs/standards/<domain>/<topic>.md` **with `applies_to` globs** |
| A dependency insight | `docs/research/` (research/learn skills) |
| A required env var | `env.manifest.md` |
| What happened this session | `harness log append` |
| A harness change made from developer feedback | `docs/harness-changelog.md` (one line: date, file, change, trigger quote) + relay to the developer |

## The code map

Standards files carry `applies_to: ["globs"]`; naming rules carry `scope:` globs. `harness sync`
compiles them into `context-rules.yaml`. Agents query it with
`harness context --for "<task>"` (OMP also injects automatically via `.omp/instructions/`).
**A standards file without `applies_to` is invisible to the map — always set it.**

## Active configuration

- Standards domains: frontend, backend, core, testing, tooling, docs
- Modules on: specs, tasks, session_log, roadmap, design, decisions, research, env_manifest, naming_conventions
- Modules off: (none)
- Budgets: `manifest.json#doctor.budgets`

## Editing rules

1. Edit `.agent/` sources, then run `harness sync` — bridges are throwaway output.
2. `harness doctor` tells you what is stale; run it after any manual surgery.
3. Renames/deletions with downstream impact: load
   `.agent/skills/shared-references/cascade-checks.md` and present the full change set first.
4. The commit gate (`.agent/skills/commit/references/commit-checklist.md`) is the final check
   before anything goes upstream — keep it current as the project's definition of "ready".
