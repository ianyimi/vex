# Naming Interview — Init Phase 8 (High-Care Projects)

Low-care projects may skip with a minimal `rules: []` block. For high-care projects:

## Infer first

Scan existing code before asking anything: component file casing, hook prefixes, test file
suffixes, folder casing, constant casing. Present detected conventions for confirmation.
Only ask about patterns with no examples in the codebase.

## Identifier questions (ask the gaps)

- **Hooks**: `useXxx` / `useXxxState` / `useXxxMutation` — which patterns, when?
- **Event handlers**: `onXxx` for props vs `handleXxx` for internal methods?
- **Booleans**: `isXxx` / `hasXxx` / `canXxx` / `shouldXxx` — which mean what?
- **Components**: suffix conventions — `XxxPanel` / no suffix / `XxxPage` / `XxxLayout`?
- **Types**: plain `Xxx` vs `XxxType` / `XxxT` / `IXxx`? Input vs resolved variants
  (`XxxInput` → `Xxx`)?
- **Constants**: exported (`SCREAMING_SNAKE`?) vs file-local (`camelCase`?) casing?
- **Project-specific**: e.g. Convex query/mutation verb conventions, API route naming.

## File/folder rules

For each major directory, establish the expected basename pattern and turn it into a
machine-readable rule: `id`, `pattern` (regex on basename), `scope` (globs), `description`,
`examples`, `counter_examples`. Fill them into the rules block of
`naming-conventions.template.md`.

## Output

1. Assemble the full naming-conventions.md from the template.
2. Submit: `harness init write-phase 8 --data -` with `{ "naming_conventions_md": "<content>" }`.
3. After init finishes, run `harness struct` to generate the linked directory-structure.md.
