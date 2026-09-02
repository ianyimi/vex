---
applies_to: ["packages/*/src/**/*.ts", "packages/*/src/**/*.tsx"]
---
# JSDoc Conventions

Every exported symbol needs JSDoc (eslint-plugin-jsdoc, `eslint.config.mjs:40-135`).
JSDoc is the source of truth: ESLint enforces presence/shape; starlight-typedoc renders it
into the docs site (`apps/docs`). BOTH gates must pass — lint clean AND TypeDoc warning-free.

## Shape rules (ESLint-enforced)

- **Input types (user-facing config): full treatment** — prose summary, a fenced
  `**Defaults applied by <fn>():**` code block with inline comments per property,
  `@example` blocks, `@see {@link <Resolved>}` (`packages/core/src/fields/text/types.ts:6-40`).
- **Resolved types: one-liners** — one-sentence block, per-property one-line docs,
  `@see {@link <Input>}` + `@see {@link <fn>}` back-references
  (`packages/core/src/fields/text/types.ts:48-70`). Input teaches; resolved references
  back. No duplication.
- **Overloads:** EVERY overload signature AND the implementation get their own JSDoc block
  (`jsdoc/require-jsdoc` fires per declaration; `packages/core/src/api/types.ts:40-110`).
- **Object params:** `checkDestructured: false` — do NOT write nested `@param args.foo`;
  the interface's property JSDoc is the single source of truth.
- **Generics:** `@typeParam TName - description` on every exported generic
  (`packages/core/src/api/types.ts:265-280`).
- **Allowed custom tags:** `@typeParam`, `@defaultValue`, `@expand`, `@ignore`
  (`eslint.config.mjs:86-89`). Use `@ignore` (not `@internal`) to exclude from API refs.
- Common failures → fixes: missing block description → add prose before tags;
  `check-param-names` mismatch → sync `@param` with the real parameter name; missing
  `@returns` → required for any non-void return.

## Link hygiene (TypeDoc-enforced — ZERO warnings, `treatWarningsAsErrors`)

Every `{@link X}` MUST resolve in the rendered docs. The docs build documents all
implemented library packages (core, react, next, better-auth, file-storage-convex) as one
program, and `treatWarningsAsErrors` makes any unresolved link fail the build.

- **Same-package, in-scope symbol** → plain `{@link Symbol}`. Works when the symbol is
  imported/declared in the file the comment lives in.
- **Cross-package (or cross-module, not imported in this file)** → use the module-qualified
  form `{@link <pkg>/src!Symbol}`. The module name is the entry path TypeDoc assigns, e.g.
  `{@link better-auth/src!betterAuthAdapter}`, `{@link file-storage-convex/src!convexFileStorage}`,
  `{@link core/src!CollectionConfig}`, `{@link react/src!usePaginatedQuery}`. Unqualified
  cross-package links fail because TypeDoc's TS resolver only sees the local file's imports.
- **Target must be exported from its package barrel.** If you want to link a symbol, export
  it from that package's `src/index.ts` (that's why `usePaginatedQuery` is exported). If it
  should stay internal, use a plain code span `` `Symbol` `` instead of a link.
- **Never `{@link}` unexported internals** (e.g. `applyBaseInputSchemaMeta`, internal
  components like `NextAdminLayoutClient`) — code-span them, or export if they're real API.
- **Exported types must not leak unexported types** in their public signature — TypeDoc
  warns "X is referenced by Y but not included". Export the referenced type via the barrel
  or restructure so the public surface is self-contained. (`intentionallyNotExported` is a
  last resort; prefer exporting or inlining.)
- **External-library symbols** (lucide `Icon`, etc.) → code spans, not links.
- Verify before commit: `pnpm --filter docs build` must pass (it will fail on any TypeDoc
  warning). Adding a new documented package? Add its `src/index.ts` to `entryPoints` in
  `apps/docs/astro.config.mjs`.
