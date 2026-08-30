---
status: in-progress
spec_id: 2026-08-25-access-constraint-builder
touches: []
prompt_version: 1
---

# 2026-08-25-access-constraint-builder — Tasks

Replaces an access rule's opaque `withIndex.range` **callback** with declarative
**constraints** whose type encodes Convex's rules and whose output is data. One
declaration compiles to a `withIndex` range, a `FilterBuilder` expression, or a JS
predicate — which is what a closure could never do.

The authoring shape mirrors Convex's own query API: each algebra gets its own
callback with its own builder, so they never meet in one expression.

Type-level feasibility is proven, not assumed — `type-proofs.builder.ts` and
`type-proofs.array.ts` in this directory both compile clean against
`packages/core/tsconfig.json`, including every negative case behind
`@ts-expect-error`.

## Starting point — re-verified 2026-08-27 (rev 6)

**621 tests passing, 0 type errors.** `apps/www` regenerated and typechecking clean;
lint clean across `access/` and `api/find/`. Steps 1-8 are implemented; Step 9 is next.

Two notes for whoever picks this up:
- `vex generate` writes collection API files ONLY. `vex.types.ts` and the Convex
  schema come from `vex dev`, which also deploys. A stale `vex.types.ts` shows up as
  `AccessQueryBuilder<Doc, Record<string, readonly string[]>>` — the fallback index
  map — and as missing editor completion for field names.
- `packages/core/dist` shadows `src` for editors that resolve through
  `package.json#exports` rather than the app's tsconfig `paths`. A stale `dist` makes
  completion flicker between correct and wrong.

`ground-truth.md` is a generated dump of the current export surface. It wins over any
prose here that has drifted.

The authoring shape, which mirrors Convex's own query API:

```ts
// index + predicate
read: {
  constraints: ({ user, q }) =>
    q.withIndex("by_author", (ix) => ix.eq("authorId", user._id))
     .filter((f) => f.neq("archived", true)),
}
// predicate only
read: { constraints: ({ q }) => q.filter((f) => f.or(f.eq("authorId", u), f.eq("isPublic", true))) }
// mutation action — same shape, no withIndex
update: { constraints: ({ q }) => q.filter((f) => f.eq("authorId", u)) }
```

Implemented and green:
- `types/generated.ts` + `generateVexTypes.ts` — `IndexFieldsBySlug`, `IndexNameFor`,
  `IndexFieldsFor` and their emitters
- `access/constraintTypes.ts` — both operator unions, the `ConstraintField` /
  `ConstraintValue` degradation helpers, `AccessIndexConstraint` (flat) and
  `AccessFilterConstraint` (tree), the two nominal terminals `ConstraintResult`
  (an expression) and `AccessConditionResult` (a whole condition), the positional
  state machine, `FilterConstraintBuilder`, `AccessPredicateBuilder`,
  `AccessQueryBuilder`, `IndexedAccessCondition`
- `access/createIndexConstraintBuilder.ts` — pure, zero-argument, plus
  `readIndexConstraints`
- `access/createFilterConstraintBuilder.ts` — pure; its nodes ARE the tree
- `access/createAccessQueryBuilder.ts` — composes both without letting them mix;
  `AccessCondition` + `readAccessCondition`
- `access/types.ts` — one-shape `ConstrainedPermissionCheck`, per-action `q` via `TQ`,
  `SubjectEntry.indexFields`, `ExtractIndexFields`, `PreGenerationIndexFields`
- `access/compileConstraints.ts` — five compilers across the two algebras, plus
  `CONSTRAINT_COMPARATORS` and `FILTER_COMPARATORS`
- `access/validateAccessConstraints.ts` + its `defineAccess` wiring in `config.ts`
- `access/resolveAccessRule.ts` — `resolveAccessIndex`, `resolveAccessConstraint`,
  `selectSingleCondition`; and `pickQueryIndex.ts`

Superseded, and gone from the tree:
- `AccessIndex`'s `{ name, range }` callback, the deprecated `IndexedPermissionCheck`
  member, and the `AccessIndexBySlug` / `AccessIndexNameFor` chain — **deleted in
  Step 7**, ahead of Step 13, because the resolver could not straddle two shapes
- `IndexesBySlug` name unions → `IndexFieldsBySlug` field tuples
- `ConstraintFieldSlots` → the range callback binds the index's real tuple
- `ConstraintBuilderHandle`, then the `{ into }` sink that replaced it → pure builders
- `RecordedAccessConstraints` → `AccessCondition`; the "recording" vocabulary is
  retired, since the payload is a condition on which documents are readable and
  naming it for its mechanism leaked implementation
- every `withIndex`-as-a-check-property encoding, and the chained
  `q.withIndex(name).eq(…)` form → a required range callback

Still present, removed later:
- field mode (`{ mode, fields }`, `FieldPermissionResult`, `ResolvedFieldPermissions`,
  `hasPermission`'s `fields`, `VexAccessError.field`) → Step 14, which can also
  collapse `TFieldKeys`

Out of scope here (owned by `2026-08-23-access-index-resolution` Steps 6-10):
`totalDocs` split, bounded `loadMore`, dev warnings, its www wiring.

## Step 1 — `IndexFieldsBySlug` registry `[dev]` — [x] DONE

Why: Every builder type resolves its field tuple through this; nothing else can be
typed until the registry carries order.
- [x] `packages/core/src/types/generated.ts` — add `IndexFieldsBySlug` (slug →
      index name → readonly field tuple). Redefine `IndexNameFor<S>` as
      `keyof IndexFieldsBySlug[S]` so one registry entry serves both. Add
      `IndexFieldsFor<S, N>`. Keep `AccessIndexBySlug` / `AccessIndexNameFor`
      unchanged. Map-level `infer` constraints only (AP-003).
- [x] `packages/core/src/types/generateVexTypes.ts` — emit field tuples instead of
      name unions. A table with no indexes emits `{}` (today it emits `never` for
      the name union — verify the `keyof {}` fallback still widens correctly).
- [x] `packages/core/src/types/generateVexTypes.test.ts` — tuples emitted in
      declaration order; multi-field index preserved; index-less table emits `{}`.
- [x] `pnpm --filter www vex generate` — regenerate `apps/www/src/vex.types.ts`.
- Verify: `pnpm --filter @vexcms/core test && pnpm --filter www typecheck`

## Step 2 — Constraint types `[agent]` — [x] DONE

Why: Pure types with no runtime; every later step imports them.
- [x] `packages/core/src/access/constraintTypes.ts` — `IndexOp` derived as
      `Extract<keyof IndexRangeBuilder<GenericDocument, string[], 0>, string>` so a
      new Convex builder method appears automatically; `AccessIndexConstraint`;
      `ConstraintResult` (nominal); `ConstraintBuilder` /
      `LowerBoundConstraintBuilder` / `UpperBoundConstraintBuilder` /
      `NextConstraintBuilder`; local `PlusOne`.
- [x] `packages/core/src/access/constraintTypes.test.ts` — port every case from
      `type-proofs.builder.ts`: `eq` chains, prefixes, `eq…gte`, `gte…lte`; and
      reject `eq` after a bound, two lower bounds, anything after an upper bound,
      wrong field for position, skipped field, wrong value type, past end of index,
      forged `ConstraintResult`.
- [x] **Rev 2:** add `FilterOp`, `AccessFilterConstraint<TDoc>`, and
      `FilterConstraintBuilder<TDoc>` for unindexed constraints (DD 13) — comparisons
      plus `neq`/`and`/`or`/`not` over any `keyof TDoc`, no positional tracking, no
      terminal states. Tests: any field in any order accepted; absent field and wrong
      value type rejected.
- Verify: `pnpm --filter @vexcms/core test`

## Step 3 — Runtime builder `[dev]` — [x] DONE

Why: The value the config callback actually receives; the compilers consume its output.
- [x] `access/createIndexConstraintBuilder.ts` — zero-argument and PURE: each method
      returns a new node carrying the accumulated list, so a discarded chain leaves
      nothing behind. `readIndexConstraints` reads it back, module-private via a
      symbol key.
- [x] `access/createFilterConstraintBuilder.ts` — already pure; its combinators take
      values, so the returned node IS the tree root. Adds `neq`, `and`, `or`, `not`.
- [x] `access/createAccessQueryBuilder.ts` — composes both without letting them mix.
      `withIndex(name, range)` runs the range callback against a fresh positional
      builder; `filter(predicate)` runs its callback against a fresh flat builder.
      Neither escapes its callback, so an index expression cannot reach a boolean
      combinator. Produces `AccessCondition`, read back via `readAccessCondition`.
- Verify: `pnpm --filter @vexcms/core test`

## Step 4 — Rule shape `[dev]` — [x] DONE

Why: The public API change. Later steps branch on which form a rule used.
- [x] **Rev 2 shape.** The object form is a two-branch union discriminated on the
      presence of `withIndex`: the `withIndex` branch types `q` as
      `ConstraintBuilder<IndexFieldsFor<S, N>, TDoc>`, the branch without it as
      `FilterConstraintBuilder<TDoc>` (DD 13). Valid on EVERY action; only the
      `withIndex` branch is gated on `QueryAction` (DD 14). `CustomResourceInput`
      gains `queryActions?: readonly string[]`; the custom `SubjectMap` branch keeps
      `indexes: never`, so its indexed branch is uninhabitable (DD 15).
- [x] `packages/core/src/access/types.ts` — a query-shaped action accepts:
      a `constraints` callback receiving `{ user, organization?, q }`; a `filter`
      callback receiving `{ data, user, organization? }`; or
      `{ constraints, filter? }`. Per the design discussion, model the callback as
      **one signature returning `boolean | ConstraintResult`** rather than a union
      of function types — a union breaks contextual typing of destructured params
      and silently infers `any`. Mark `AccessIndex` deprecated, retained until Step 13.
- [x] `packages/core/src/access/types.test.ts` — extend: constraints form accepted
      on `read`, rejected on `create`/`update`/`delete`; filter-only still accepted
      everywhere; object form accepted.
- Verify: `pnpm --filter @vexcms/core test`

## Step 5 — Compilers `[dev]` — [x] DONE

Why: One declaration, several compile targets — the reason data replaces a closure.
- [x] Flat list (an index range): `accessConstraintsToIndexRange` (→ `IndexRangeFn`),
      `accessConstraintsToFilter` (→ a `FilterBuilder` expression, `and`-ed),
      `accessConstraintsToPredicate` (→ `(doc) => boolean`).
- [x] Tree (a predicate): `accessFilterTreeToFilter`, `accessFilterTreeToPredicate`.
- [x] `FILTER_COMPARATORS` spreads `CONSTRAINT_COMPARATORS` and adds `neq`, so the two
      algebras cannot drift on a shared operator — the mechanism behind "agree by
      construction" rather than by intention.
- [x] `accessConstraintsToFilter` throws a plain `Error` on an empty list: it runs at
      QUERY time, so a config-error type would misattribute a framework bug to the
      user's `defineAccess`. The tree compilers have no empty case — absence is a
      missing `filter`, not an empty node.
- Verify: `pnpm --filter @vexcms/core test`

## Step 6 — `defineAccess` validation `[dev]` — [x] DONE

Why: Config-time backstop for constraints built by hand or through an `as any`
escape, and for op sequencing the array form cannot type.
- [x] **Rev 2:** validation runs on the `withIndex` branch ONLY. Unindexed rules need
      none — `FilterConstraintBuilder` imposes neither field order nor operator
      sequencing because `.filter()` imposes neither (DD 13).
- [x] `packages/core/src/access/validateAccessConstraints.ts` — one pass per indexed rule:
      fields form a prefix of the named index in order; ops are `eq`* then at most
      one lower bound then at most one upper bound; bounds pin the same field.
      Throws `VexAccessConfigError` naming role, resource, action, and the offending
      constraint position.
- [x] `packages/core/src/access/config.ts` — call it from `defineAccess` so failure
      happens at module load, never at query time.
- [x] `packages/core/src/access/validateAccessConstraints.test.ts` — one case per rule
      above, each asserting the exact message.
- Verify: `pnpm --filter @vexcms/core test`

## Step 7 — `resolveAccessIndex` consumes constraints `[dev]` — [x] DONE

Why: Turns a recorded condition into the index a query actually uses.
- [x] `access/resolveAccessRule.ts` — `classifyRole` now RUNS the rule's callback and
      classifies on the OUTCOME, which is strictly more precise: a callback resolving
      to `true` is genuinely unrestricted for this caller, `false` genuinely denies,
      and only a real condition becomes a candidate. `selectSingleCondition` keeps the
      OR-merge safety rule (exactly one contributing role; any `unrestricted` or
      `opaque` role forbids narrowing). `resolveAccessIndex` returns
      `{ name, range }` when the condition chose an index.
- [x] `access/resolveAccessRule.ts` — `resolveAccessConstraint` compiles to an
      `AccessFilterFn` for surfaces with no `withIndex` slot, and **`and`s BOTH halves
      when both are present** — an index range plus a predicate is
      `.withIndex(name, range).filter(expr)`, not a conflict. Compiling one and
      dropping the other would silently discard half the rule.
- [x] `access/resolveAccessRule.test.ts` — fixtures migrated to the two-callback form,
      permissions inlined so `q` is contextually typed, and 4 cases added for the
      boolean short-circuit paths.
- [x] Deleted here, ahead of Step 13, because the resolver could not straddle two
      check shapes: `AccessIndex`, the deprecated `IndexedPermissionCheck` member,
      `PermissionCheck`'s `TIndexName`, and the whole `AccessIndexBySlug` /
      `AccessIndexNameFor` chain with its emitter and three generator tests.
- Verify: `pnpm --filter @vexcms/core test`

## Step 8 — `find` integration `[dev]` — [x] DONE

Why: The surface where narrowing actually pays — full pages instead of ragged ones.
- [x] `api/find/server.ts` — `resolveAccessIndex` → `pickQueryIndex` arbitrates the
      single `withIndex` slot against the caller's, unchanged.
- [x] `resolveAccessConstraint` is now called **unconditionally**, with
      `indexAlreadyApplied` set when the access index won the slot. It previously ran
      only on the displaced branch, which silently skipped two cases: a rule with no
      index at all (the flat algebra — and the only form an action-level wildcard can
      express) never reached the query, and a rule with index AND filter lost its
      filter half whenever the access index won. Both were invisible because the
      per-document `hasPermission` pass still rejected the rows: correct results,
      ragged pages.
- [x] `resolveAccessConstraint` gained `indexAlreadyApplied?: boolean` — omits the
      index half so a range already pushed into `.withIndex` is not re-checked per row.
- [x] `api/find/server.test.ts` — three tests that fail on regression: a filter-only
      rule fills a page; an index+filter rule excludes the filtered row; and the
      filter half reaches the QUERY rather than only the per-document pass (page size
      is what separates those two).
- Verify: `pnpm --filter @vexcms/core test`


## Step 9 — `search` integration `[dev]` — [ ]

Why: The reason a filter target exists. Search has no `withIndex` slot, so
constraints could not previously apply at all.

Rev 2: both branches compile to the same filter expression here, so this step needs
no discrimination between them.
- [x] `packages/core/src/api/search/server.ts` — `and` the compiled filter
      expression into the search query's `.filter()`. Do **not** attempt to compose
      onto `SearchFilterFinalizer` — `SearchFilter` and `IndexRange` are distinct
      nominal types with different operator sets, which is exactly why the earlier
      attempt failed to typecheck.
- [x] `packages/core/src/api/search/server.test.ts` — a constrained role's search
      excludes non-permitted hits inside the query, not after it.
- Verify: `pnpm --filter @vexcms/core test`

## Step 10 — `get` and client-side interpretation `[dev]` — [ ]

Why: Closes the loop so a constraint rule is enforceable everywhere a callback was.
- [x] `packages/core/src/access/hasPermission.ts` — when a resolved check is the
      constraints form and `data` is supplied, evaluate via
      `constraintsToPredicate`. This is what keeps `usePermission` working on an
      already-fetched document (design invariant: a descriptor is bidirectional,
      a callback is not).
- [x] `packages/core/src/access/hasPermission.test.ts` — a constraints-only rule
      resolves correctly for a document that satisfies it and one that does not.
- Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react build`

## Step 11 — Composable access checks `[dev]` — [x] DONE

Why: Lets one piece of access logic be reused across resources and roles without
restating it. Originally attempted as rule factories in core; those were built,
measured, and deleted — a check has to name the project's user/org document types, so
it belongs in the project, and core's job is to export the derivations that keep it
honest (DD 29-34).
- [x] `packages/core/src/access/types.ts` — export `AccessCheckFor`,
      `AccessMutationCheckFor`, `AccessDocFor`, `AccessFieldKeysFor`,
      `AccessIndexFieldsFor`. Slug-keyed, so a project helper resolves exactly what
      `defineAccess` expects.
- [x] Field keys derived from the DOCUMENT, not the field-type maps (DD 37) — brings
      `_creationTime` (and `_slug` on globals) into the field-key union, collapses
      `ExtractFieldKeys` to a one-line reuse, and drops the synthetic `id: "_id"`
      entry from both generated maps. `keyof AccessDocFor<S>` and
      `AccessFieldKeysFor<S>` now agree, so hand-derivation stops being a trap.
- [x] `apps/www/src/auth/permissions.ts` — the project's checks: `readWhere`,
      `readOwn`, `readPublished`, `readAny`, `readRaw` (query-shaped); `ownOnly`,
      `anyOne` (single-document). Each takes the collection config, which binds the
      slug and types the field argument, document, and builder. Replaced the file's
      previous contents, a pre-RBAC permission map with zero importers.
- [x] `apps/www/src/auth/access.ts` — one line per resource per action; no grouping
      helpers, no wrapper property. Helper calls, bare booleans, plain callbacks, and
      inline `{ constraints, filter }` objects coexist with no seam.
- [x] DELETED — `packages/core/src/access/defineRules.ts` (+ tests, barrel line),
      the shared-rule blocks in `api/find/server.test.ts`, and
      `apps/www/src/auth/editorialRules.ts`. ~1,220 lines out, ~290 in.
- [x] `DeclaredDoc` applied to `SubjectMap.data` (DD 35) — `VexDocument`'s index
      signature no longer makes every property name readable in a permission callback,
      including in the plain inline config form.
- [x] `packages/core/src/access/buildChecks.ts` — `indexedEqCheck`,
      `indexedOwnerCheck`, `ownerPredicateCheck`. These own the casts a generic check
      builder cannot avoid (DD 39), so the project's own checks carry none.
- [x] Registry carries the auth slugs (DD 38) — `AccessCheck<S>` /
      `AccessMutationCheck<S>` take one type parameter, so
      `apps/www/src/auth/permissions.ts` has ZERO local type definitions and one cast
      (`readPublished`'s literal, which no boundary can move — DD 39).
- [x] Core aliases so nothing is re-derived project-side: `AccessIndexedFieldFor`,
      `AccessIndexNameFor`, `AccessFieldValueFor`, `AccessIndexedFieldWithValue`,
      `AccessResourceRef`, `AccessDocFieldFor` (DD 40).
- [x] Coverage hardening + field-mode removal (DD 42-45). Seven parallel test slices
      took core from 643 to 797 tests and surfaced four real bugs, all fixed:
      structural equality in the JS predicate (both directions of the bidirectionality
      guarantee disagreed on array-valued fields); `create` not passing the payload;
      config-time validation ignoring the index NAME; a non-condition `constraints`
      return silently accepted as "excludes nothing". `packages/react` gained its first
      tests (32) covering `usePermission` through the real provider tree.
- [x] OPEN QUESTION: action names are never cross-checked against a subject's declared
      action list at `defineAccess` time — for any subject, not just `adminPanel`.
      TypeScript catches it for a statically-authored config; a dynamically-built one
      would not be caught. One `it.skip` in `config.test.ts` documents this. Decide
      whether to validate action names at runtime, as index names now are.
- Verify: `pnpm --filter @vexcms/core test` — 643 passing, 0 type errors; `vex generate`
  loads the config, so `defineAccess` executes every helper-built constraints callback
  at config time.

## Step 12 — `apps/www` migration `[dev]` — [ ]

Why: Proves the API against a real schema and populates `AccessIndexBySlug`, which
currently emits `{}` for every slug because no rule declares an index.
- [x] `apps/www/src/auth/access.ts` — migrate at least one role to `constraints`,
      keep one callback rule as the documented escape hatch.
- [x] `pnpm --filter www vex generate` — regenerate types.
- Verify: `pnpm --filter www typecheck && pnpm --filter www build`

## Step 13 — Remove the deprecated range callback + docs `[dev]` — [ ] (types already deleted in Step 7; docs remain)

Why: Clean cutover. Leaving both forms is the dual-expression footgun the design
set out to remove.
- [x] `packages/core/src/access/types.ts` — delete `AccessIndex` and the
      `withIndex: { name, range }` form.
- [x] `packages/core/src/access/pickQueryIndex.ts` — `composeRanges` survives
      unchanged; confirm no reference to the deleted type remains.
- [ ] `apps/docs/src/content/docs/guides/access-control.mdx` — constraints as the
      recommended form; the callback escape hatch and its ragged-page consequence;
      the indexable/non-indexable boundary (`FilterBuilder` has no array
      membership, string ops, or cross-table reads); fragment composition and its
      index-specificity; that capability differences belong in roles, not branches.
- [ ] `apps/docs` — remove every remaining field-mode reference; the generated API pages come from JSDoc, so re-run TypeDoc rather than hand-editing.
- Verify: `pnpm --filter @vexcms/core test && pnpm --filter docs build`

## Step 14 — Remove the field-mode permission API `[dev]` — [ ]

Why: `{ mode, fields }` was never enforceable — Convex has no `select` on document
queries, so reads always returned whole documents and the field list only gated a
post-hoc boolean. Withdrawn rather than left as a half-promise. Runs LAST, after the
constraint API is working end to end, so this is a clean subtraction from a green
tree — Steps 4-13 leave the field-mode branch and `TFieldKeys` threading untouched.

`TFieldKeys` CAN be collapsed here, reversing an earlier note. It was kept because
`ConstraintFieldSlots<TFieldKeys>` needed it; that type is deleted, so once this step
removes `FieldPermissionResult` the generic has no consumers — drop it from
`BasePermissionCheck` / `ConstrainedPermissionCheck` / `AnyActionPermissionCheck` /
`PermissionCheck`, along with `SubjectEntry.fields` and `ExtractFieldKeys`.
KEEP `PERMISSION_MODES` /
`PermissionMode` — they type `defaultPermissionMode`. KEEP `PERMISSION_SCOPES`
entirely — `doc`/`any`/`all` is an unrelated quantifier.

- [x] `packages/core/src/access/types.ts` — delete `FieldPermissionResult` and
      `ResolvedFieldPermissions`; drop the `{ mode, fields }` member from the check
      union; delete `VexAccessError.field` and its constructor option; update the
      union and `permissions` matrix JSDoc.
- [ ] `packages/core/src/access/constants.ts` — JSDoc only: `PERMISSION_MODES` and
      `PermissionMode` now document the undeclared-permission posture, not fields.
- [x] `packages/core/src/access/hasPermission.ts` — delete the `fields` parameter
      (return is always `boolean`), the field-map AND branch, `mergeRolePermissions`'s
      `fields` param and `collapse` helper, the `FieldPermissionResult` casts, and the
      `check.mode === PERMISSION_MODES.allow` branch. Update JSDoc + `@example`.
- [x] `packages/core/src/access/resolveAccessRule.ts` — comment-only: `opaque` branch
      note and `isIndexedCheck` JSDoc cite field-mode as a case to distinguish.
- [x] `packages/core/src/access/hasPermission.test.ts` — delete the `fields` suite and
      6 role fixtures; delete 3 cross-role field cases, 2 error-shape cases, 1
      system-off case; repair the mixed `mergeAccess` fixture. Match on `describe`/`it`
      text, not line offsets. ~140 lines.
- [x] `packages/core/src/access/config.test.ts` — delete
      `it("rejects a field-mode object on a custom resource")`.
- [ ] `packages/core/README.md` — delete the field-level permission example.
- [x] `packages/react` — no change; `usePermission` forwards to `hasPermission` and no
      in-repo caller passes `fields`.
- Verify: `pnpm --filter @vexcms/core test`; no `FieldPermissionResult` or
  `ResolvedFieldPermissions` symbol remains.

## Step 15 — Verification `[dev]` — [ ]

- [x] `pnpm build && pnpm test && pnpm lint` clean across the workspace.
- [x] No `FieldPermissionResult` / `ResolvedFieldPermissions` symbol anywhere in `packages` or `apps` (excluding `apps/docs/dist`).
- [ ] Manual: a contributor role with `constraints` sees only its own rows in the
      admin list; the Convex dashboard shows reads scaling with page size, not
      table size; the same role's search excludes non-permitted hits; an
      intentionally mis-ordered constraint set fails at `defineAccess`, not at
      query time.
- [x] Manual: passing `fields:` to `hasPermission` or declaring `{ mode, fields }`
      in `defineAccess` fails to compile.
- Verify: `pnpm build && pnpm test`
