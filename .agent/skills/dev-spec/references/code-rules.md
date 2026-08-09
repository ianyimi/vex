# Code Rules — for All Spec Code Blocks

## Naming

- Every file, folder, function, type, and variable name satisfies the machine-readable rules
  block AND the identifier conventions in `docs/standards/naming-conventions.md`.
- Run the naming pass (skill step 7) before presenting — mismatches are spec bugs.

## Standards

- Follow every entry in `docs/standards/preferences.md`.
- Never contradict `docs/standards/anti-patterns.md` — those are paid-for lessons.

## Guided stubs (high-care / [dev] steps)

- Signature + complete JSDoc (`@param props.x` with description, `@returns`, `@throws`).
- Numbered `// TODO: implement` pseudo-code inside the body: steps 1, 2, 3…, lettered
  sub-steps for branches, `→` for what each step produces or throws.
- An `// Edge cases:` list when there are non-obvious cases.
- End with `throw new Error("Not implemented")` so the code compiles but fails at runtime.

## General

- Single `props` object parameter on exported functions and class methods.
- Tests carry exact expected values — the test IS the spec of correct behavior.
- No speculative code: if nothing in this spec calls it, it doesn't go in.
- Every step leaves the LSP clean: no imports of files that don't exist yet.
