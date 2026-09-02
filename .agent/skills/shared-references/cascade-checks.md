# Cascade Checks

When a change to any harness-tracked file or name affects others, find EVERY downstream impact
first, then present ONE confirmation block before applying ANY of them. Never apply a subset
silently.

## Checklist — run the row(s) matching your change

- [ ] **Function/type renamed** → grep every `docs/specs/*/spec.md` + `spec-tasks.md` whose
      frontmatter `touches:` overlaps the changed path; list each file + line to update.
- [ ] **New package added to monorepo** → `docs/product/tech-stack.md` (Packages section),
      `docs/product/dev-processes.md` (commands), then `harness sync` (regenerates
      `context-rules.yaml`).
- [ ] **New env var added** → `.agent/env.manifest.md` entry; verify with `harness env check`.
- [ ] **Decision superseded** → `tech-stack.md` (drop/replace the package), every spec citing
      the old decision (grep the ADR id), the ADR's own `status:` frontmatter.
- [ ] **Standards domain renamed/deleted** → `manifest.json#standards_domains`, then
      `harness sync` (context-rules) + `harness index rebuild`; grep specs citing
      `docs/standards/<domain>/`.
- [ ] **Naming convention changed** → `docs/standards/naming-conventions.md` (rules block +
      examples), every OPEN spec's identifiers (`harness spec list`), then `harness struct`.
- [ ] **Dep version upgraded** → `dependencies/registry.md` pin, then prompt the developer to
      run `harness deps sync`.

## Confirmation block format (verbatim shape)

    This change has downstream impacts. Confirm this full set before I apply anything:

    1. <the primary change>
    2. <impact — file (line) — what changes>
    3. <impact …>

    Apply all N? (yes / review each / skip downstream)

"review each" → walk items one by one. "skip downstream" → apply only item 1 and append a task:
`harness tasks add "Cascade follow-up: <summary>" --to inbox`.
