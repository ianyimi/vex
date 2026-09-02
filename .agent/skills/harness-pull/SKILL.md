---
name: harness-pull
description: Pull newer paradigms from the upstream (main) harness into THIS project's harness,
  the way `git pull` brings changes from origin into a local clone. Triggers on "/harness-pull",
  "pull harness updates", "update the harness", "sync harness changes", "refresh a skill". Merges
  by hand — never overwrites project-specific config.
---

# Harness Pull

Bring updates from the **upstream harness** (the shared source in the developer's
dotfiles/chezmoi) into **this project's harness** under `.agent/`.

Mental model — it's `git` for the harness:
- The upstream/main harness is **origin**. This project's `.agent/` is the **local clone**.
- `harness fetch` is the read side (like `git fetch` + `git diff origin`): it reports what
  upstream would change, and writes nothing.
- **This skill is the merge** (the pull): an agent with full project context integrates the
  incoming changes, keeping everything this project has hardened.

**The developer never runs a raw update CLI.** They invoke `/harness-pull` from their agent IDE
so the agent — which holds the project's context — decides what merges and what stays. Wholesale
overwrites (`install --refresh-skill`, blind `sync`) are NOT how this project takes updates;
they can silently drop context-critical customizations.

## Preflight
1. If `.agent/manifest.json` is missing → stop; tell the developer to run `harness install`.
2. Run `harness doctor` and read `harness state` so you know the project's current shape.

## Steps

1. **Fetch (read-only).** Run `harness fetch` for a summary of skills with incoming changes,
   then `harness fetch <skill>` (add `--json`) for the file-level plan. Nothing is written —
   each entry is `new` / `changed` / `same` with the project path and the upstream source path.

2. **Diff both sides of every `changed` file.** Open the `upstreamPath` (the new version) AND
   the project file. Separate the *paradigm update* (new guidance, renamed steps, new
   references) from *this project's customizations* (hardened checklists, project-specific
   commands, rules tightened at init or since).

3. **Merge, don't replace.** Write the reconciled result into the project file:
   - Adopt the upstream update's substance (new sections, corrected instructions, new refs).
   - Preserve every project-specific customization. A `changed` file that is purely the
     project's hardened version (e.g. a customized `commit-checklist.md`) takes *only* the
     genuinely-new upstream items, or nothing — never lose the hardening.
   - `new` files (no project copy) can be copied in as-is unless they conflict with how this
     project already does things.
   Use your knowledge of THIS project (manifest, standards, prior decisions) for every call.

4. **Preview bridge changes (read-only).** Run `harness fetch sync` (add `--json`) to see what
   a re-sync WOULD do to the generated bridges (`.omp/`, `.claude/`, `.gitignore` block,
   context-rules) after your skill/standards merges. `CONFLICT` lines are user-modified managed
   files sync won't touch — resolve them by moving the edits into `.agent/` first. This is the
   same propose-then-apply model as skills, now for bridges.

5. **Apply generated artifacts.** Once the bridge plan looks right, run `harness index rebuild`
   and `harness sync` to regenerate bridges from the updated `.agent/`, then `harness doctor`
   to confirm health.

6. **Report.** Per file: adopted-as-is / merged (what was taken vs kept) / skipped (why).
   Flag anything the developer should review — especially where a project customization
   diverged from an upstream paradigm and you kept the customization.

## Notes
- Safe counterpart to `harness install --refresh-skill <name>` (which overwrites). Always
  prefer this pull flow when a project may carry customizations.
- `harness fetch` reads skill/reference source; `harness fetch sync` reads bridge/sync output.
  Both are read-only — you merge/apply by hand, keeping project config sovereign.
