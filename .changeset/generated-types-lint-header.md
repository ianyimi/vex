---
"@vexcms/core": patch
---

Suppress `@typescript-eslint/no-empty-object-type` and
`perfectionist/sort-object-types` in the generated `vex.types.ts` header.

A generated project reported 2 errors and 94 warnings from its own codegen
output on a first-run `pnpm lint`.

The empty object types are deliberate, not sloppy emission. `CustomActionsBySlug`
resolves to `{}` before any custom action is declared, and core branches on
`[keyof CustomActionsBySlug] extends [never]` to keep the pre-generation action
union permissive. Emitting `Record<string, never>` to satisfy the rule would
make `keyof` resolve to `string`, flip that conditional, and silently break
every caller naming a custom action — so the emitter disables the rule rather
than changing the type.
