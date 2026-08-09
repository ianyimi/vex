---
name: sync-spec
description: Run AFTER implementation and BEFORE commit on high-care projects. Aligns the
  spec with what was actually built and harvests patterns into the standards files.
  Triggers on "sync spec", "update the spec", "extract patterns", "/sync-spec".
---

# Sync Spec

## Preflight
1. If `.agent/manifest.json` is missing → stop; tell the user to run `harness init`.
2. Run `harness doctor`. Fix 🔴 errors before proceeding.
3. Run `harness state` and read the output.

## Steps
1. **Identify** — `harness spec list`; confirm with the developer which spec was implemented.
2. **Diff** — compare the implemented code (git diff + files matched by the spec's `touches`
   globs) against the spec's code blocks. Load `references/pattern-extraction.md`; classify
   every deviation: naming, structure, API shape, style, scope.
3. **Update the spec** — edit spec.md until it matches reality; tick finished boxes in
   spec-tasks.md; all boxes checked → set frontmatter `status: done` in both files, then run
   `harness tasks move "<spec title>" --to done` (skip when it reports task-not-found).
4. **Preferences** — for each style deviation seen ≥2 times (or stated explicitly): append ONE
   line to `docs/standards/preferences.md` in exactly the format `- P-NNN (YYYY-MM-DD) <rule>`
   — NNN = highest existing id + 1 (never reuse ids), date = the HEAD commit date
   (`git log -1 --format=%cs`), never the wall clock. A rule replacing an old one appends
   ` [supersedes P-MMM]` instead of editing the old entry. If doctor reports
   preferences-over-budget → run `harness pref compact` (see `references/compaction-rules.md`)
   — never hand-compact.
5. **Anti-patterns** — every corrected agent mistake appends to `docs/standards/anti-patterns.md`
   as `- AP-NNN (YYYY-MM-DD, seen 1x) <rule>`, or bumps an existing entry's `seen Nx` counter.
   NEVER compact or delete from this file.
6. **Naming** — the developer renamed something the spec generated? Update
   `naming-conventions.md` (fix the rule's pattern/examples, or record the identifier
   convention in prose), then run `harness struct` so directory-structure.md re-annotates.
   Multi-file impact? Load `.agent/skills/shared-references/cascade-checks.md` first.
7. **Structure + index** — new files or folders? `harness struct`. Standards files added or
   changed? `harness index rebuild`.
8. **Report** — list every file updated and every P-/AP- entry added. Nothing is changed
   silently. (Session-log entry: the commit skill's job — spec 03.)
