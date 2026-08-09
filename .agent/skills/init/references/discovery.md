# Discovery Pass — Full-Codebase Practice Mining

Runs after phase 9 (and the commit-gate step), before `harness init finish`. This is what makes
future agents follow existing practice: sweep the ENTIRE project, record what you observe, and
wire every record into the code map.

## Mine existing agent setups FIRST — verify, never trust

Harvest any previous harness/agent configuration, then **verify every claim against the actual
code before adopting it** (the code is usually newer than the docs — see inference.md's
verify-then-adopt protocol; the developer's trusted documents are the baseline):

- `.pi/agent-docs/**` (product docs, standards, developer-preferences, debug-hierarchy)
- `.claude/commands/*.md`, `CLAUDE.md`, root `AGENTS.md`, `.cursorrules`, similar
- Present a mapping: old file → verified/corrected/dropped → where it lands in `.agent/` (or
  "superseded by skill X"). Migrate only confirmed content; never delete the old files yourself.

## Fan out subagents (default when the platform supports them)

Run the domain sweeps in parallel: **one subagent per domain in `standards_domains`** (plus one
for naming patterns when the module is on). Claude Code: the Task/agent tool; OMP: subagents.
Model economy: with `manifest.json#models.subagent_selection: "dynamic"`, request the CHEAP
tier (`models.tiers.cheap`) for these sweeps — they are read-and-summarize work; reserve
standard/frontier for the reconciliation you do yourself.
Each subagent gets: its domain, the trusted documents, the verified mining notes for that area,
and instructions 1–4 below; it returns proposed `docs/standards/<domain>/*.md` contents with
evidence (file:line references). The MAIN agent reconciles overlaps, writes the files, and runs
the mechanical close — subagents never write to `.agent/` directly. No subagent capability →
run the same sweeps serially.

## Per domain in `standards_domains` (each subagent's brief)

1. **Sample deeply, not exhaustively** — the 5–10 most representative files per area (entry
   points, the largest module, the newest module, one test) plus lint/format configs.
2. **Extract practices worth recording** — the bar: would an agent writing new code here get it
   wrong without this? (error-handling shape, module layout, import conventions, API patterns,
   test structure, fixture patterns). Skip anything a linter already enforces.
3. **Write** `docs/standards/<domain>/<topic>.md` — one topic per file, ≤60 lines, with
   `applies_to: ["<globs>"]` frontmatter scoped to where the practice applies.
   **No applies_to → the map cannot inject it** (harness-guide rule).
4. **Naming**: every observed file-naming pattern gets a rule in the naming-conventions block
   (id / pattern / scope / description / examples). Add what phase 8 missed.

## Mechanical close

1. `harness index rebuild` → `harness struct` → `harness sync` → `harness doctor` (fix findings).
2. Spot-check the map: 2–3 `harness context --for "<real task phrasing>"` queries — confirm the
   right docs come back.
3. Append a `## What discovery found` summary to `docs/setup-report.md`: files written, rules
   added, old-harness content migrated, coverage gaps deliberately left (with why).
