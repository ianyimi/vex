---
name: critique
description: Review developer-written code for improvements and silly mistakes — a fresh-eyes
  critique of a named file, feature, or the uncommitted diff. Triggers on "critique",
  "/critique", "review my changes", "check my work", "did I miss anything". Read-only by
  default; grounds every finding in the real code, the active spec, and test/typecheck runs.
---

# Critique

Review code the developer wrote (or heavily edited) and report improvements and mistakes.
This is NOT a fix pass: analyze, verify, report. Only change code if the developer asks.

## Preflight
1. If `.agent/manifest.json` is missing → stop; tell the user to run `harness init`.
2. Run `harness state` — note the active spec; it is the contract the code answers to.

## Steps

1. **Identify the subject.** The developer names files/a feature, else take the uncommitted
   work: `git status --short` + `git diff` (and `git diff --stat` to scope). Distinguish THEIR
   changes from prior agent work — critique what they wrote.
2. **Ground before judging.** Read every changed file IN FULL, plus its immediate contracts:
   the types it implements, callers (`lsp` references for exported symbols — missed callsites
   are findings), sibling implementations of the same pattern, and the tests that cover it.
   Never critique from the diff alone — the bug is usually in the interaction with unchanged
   code.
3. **Load the project contract.** Active spec's `spec.md` + `spec-tasks.md` (deviations from
   ratified decisions are findings — but deliberate improvements are credits; ask which when
   unclear), `docs/standards/anti-patterns.md` (violations are findings by definition),
   `preferences.md`, `naming-conventions.md`, and `harness context --for "<topic>"`.
4. **Verify with tools, not opinions.** Run the narrowest real checks: the touched package's
   tests (targeted dir first, then package), `tsc --noEmit`, lint on the touched files. A
   failing test or type error is a confirmed finding; a passing suite bounds how bad anything
   can be. Quote actual output.
5. **Hunt the silly-mistake catalog** (each of these has shipped before):
   - Async handler computes a result but never `return`s it.
   - Guard gated on the wrong condition — presence of *data* instead of presence of *config*
     (fail-open for unauthenticated/unconfigured paths). Check every guard's negative space:
     who reaches the operation when the condition is false?
   - Early exit inside a loop that aggregates (merge/OR/AND semantics inverted by returning
     on the first element's result).
   - Dead code: helpers written but never wired at the call site; leftover debug/no-op
     statements; unreachable stub comments after a `throw`.
   - `!x` conflating `false` with `undefined` where the two mean different things
     (explicit deny vs undeclared).
   - Required context not threaded: a function gained a param but one caller doesn't pass it.
   - Type-level: generic defaults that create index signatures (`Record<string, never>`),
     constraints on map-shaped `infer`s, literal widening from missing `const` type params,
     casts that paper over a contract change.
   - Doc drift: JSDoc/`@param`/`@example` contradicting the current signature or behavior;
     error messages with wrong paths/names.
   - Tests not updated for an API change (or worse: updated to pass without testing the
     new behavior).
6. **Report, severity-ordered.** For each finding: `file:line`, what's wrong, WHY (the
   failure it causes, with a concrete scenario), and the shape of the fix. Order: correctness
   bugs/regressions → security/fail-open → semantic gaps vs spec → consistency with sibling
   code → type-safety erosion → doc drift → nits. Lead with what's GOOD and worth keeping —
   the developer needs to know which parts not to churn. Be candid about "silly" mistakes;
   they asked.

## Project Context Map (vexcms — where to look before judging)

- **Active spec** = the contract: `.agent/docs/specs/<id>/spec.md` (via `harness state`).
  Completed steps embed the verified reference implementation — diff against it.
- **Type paradigm — the generated registry**: `packages/core/src/types/generated.ts` defines
  `DocumentBySlug`/`CollectionsFieldTypeMap` etc. as conditionals over `GeneratedVexTypes`,
  augmented by `vex generate` into the app (`apps/www/src/vex.types.ts`). Two invariants:
  registry-map `infer` constraints describe the MAP, never the entry type (a failed
  constraint silently collapses the whole registry, errors surface far away); wide fallbacks
  pre-generation are intentional (`Record<string, unknown>`/`string`), and `never`-collapse
  must be guarded (`FieldKeysOrWide` pattern).
- **Access module invariants** (`packages/core/src/access/`): multi-role merge is OR (deny is
  only knowable AFTER all roles — early deny-exit is a bug); ONE throw site (`throwOnDenied`);
  helpers module-private, `hasPermission` sole runtime export; `VexAccessConfig` is
  value-level type-erased with one phantom generic (threading more generics breaks
  assignability via callback contravariance); constants-first (`PERMISSION_MODES`,
  `WILDCARD_KEY` — never inline literals).
- **Server identity**: NEVER a client argument. Identity = `ctx.auth.getUserIdentity()` via
  the `getAuth` seam in `collectionsApi` (`packages/core/src/api/server.ts`). Custom JWT
  claims (e.g. `sessionId`) exist at runtime via `UserIdentity`'s index signature even though
  the LSP won't autocomplete them.
- **Convex semantics that change verdicts**: mutations are transactional (a throw rolls back
  earlier writes — `Promise.all` + guard-throw is safe); list post-filtering can shorten
  paginated pages (accepted wart, spec decision 11); point-reads are cheap.
- **Verify commands**: `pnpm --filter @vexcms/core test -- <dir>` (access: 63, api suites),
  `pnpm exec tsc --noEmit` in `packages/core`, `pnpm --filter www typecheck`,
  `pnpm exec eslint <files>` (JSDoc rules are errors: `@returns` required).
- **Auth file naming**: `apps/www/src/auth/**` allows only
  `{client,server,serverUtils,options,permissions,types}.*` (naming-conventions.md) — new
  files there are findings.
