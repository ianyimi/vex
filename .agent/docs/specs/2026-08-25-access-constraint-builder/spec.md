---
status: in-progress
spec_id: 2026-08-25-access-constraint-builder
touches:
  - packages/core/src/access/**
  - packages/core/src/types/generated.ts
  - packages/core/src/types/generateVexTypes.ts
  - packages/core/src/types/generateVexTypes.test.ts
  - packages/core/src/api/find/server.ts
  - packages/core/src/api/search/server.ts
  - packages/core/src/api/get/server.ts
  - apps/test/src/auth/access.ts
  - apps/test/src/vex.types.ts
  - apps/docs/src/content/docs/guides/access-control.mdx
prompt_version: 1
---

# 2026-08-25-access-constraint-builder — Spec

## Overview

An access rule used to narrow a query through an opaque callback:
`withIndex: { name: "by_author", range: ({ user }) => (q) => q.eq("authorId", user._id) }`.
That callback is bound to one algebra — Convex's `IndexRangeBuilder` — so it can only
ever feed `withIndex`. It cannot narrow a search query (no `withIndex` slot exists
there), it cannot become a `.filter()` predicate when the caller displaces the index,
and it cannot be evaluated against an already-fetched document.

This spec replaces it with two purpose-built **constraint builders**, one per Convex
algebra, composed the way Convex composes its own query surface: each algebra gets its
own callback with its own builder, and the two never meet in one expression.

```ts
// Convex itself
ctx.db.query("pages")
  .withIndex("by_author", (q) => q.eq("authorId", u))
  .filter((q) => q.neq(q.field("archived"), true));

// an access rule — same structure
read: {
  constraints: ({ user, q }) =>
    q.withIndex("by_author", (ix) => ix.eq("authorId", user._id))
     .filter((f) => f.neq("archived", true)),
}

// predicate only, no index
read: { constraints: ({ q }) => q.filter((f) => f.or(f.eq("authorId", u), f.eq("isPublic", true))) }

// a mutation action — identical shape, minus withIndex
update: { constraints: ({ q }) => q.filter((f) => f.eq("authorId", u)) }
```

Index pushdown is opted into **inside** the callback, mirroring Convex's own
`ctx.db.query(…).withIndex(name, (q) => …)`. That placement is not cosmetic: because
`withIndex` is a method with its own type parameter, the literal at the call site binds
`ix` — the range callback's own parameter — to that one index's real field tuple, which
makes Convex's **field order** a compile error. No sibling-property encoding can do
that.

The callback form survives as an escape hatch for rules `FilterBuilder` cannot express.

**Rev 2 (2026-08-25).** `withIndex` became optional, constraints were opened to every
action, and custom resources gained query actions — Design Decisions 13–15.

**Rev 3 (2026-08-21).** The runtime builders take a caller-owned `{ into }` sink
instead of exposing a `constraints()` readout (DD 16), and **field mode is removed**
in a new Step 14, placed deliberately LAST so the removal is a clean subtraction from
a green tree rather than a change entangled with the new design (DD 17).

**Rev 4 (2026-08-21).** The rule shape collapsed to ONE object, `{ constraints,
filter? }`, valid on every action; `withIndex` moved from a check property to a
method on `q`; `SubjectEntry` gained `indexFields`; `ConstraintFieldSlots` was
deleted and positional field order became compile-checked — Design Decisions 18–21.

**Rev 5 (2026-08-21).** Superseded rev 4's single chained `q.withIndex(name).eq(…)`.
The index moved into a REQUIRED range callback, `q.withIndex(name, (ix) => …)`,
mirroring Convex's own `.withIndex(name, (q) => …)` exactly rather than approximating
it with a chained method call. `filter` became a callback SIBLING to `withIndex` —
available both directly on `q` and on the condition `withIndex` returns — so an index
range and a per-document filter compose the way Convex itself composes them,
`.withIndex(…).filter(…)`, instead of forcing a choice between the two. A second
nominal terminal, `AccessConditionResult`, distinct from `ConstraintResult`, closes a
silent-`undefined` hole the old shape left open: an index chain type-checked as an
argument to `FilterBuilder.and`, and the tree compiler's switch — no default branch —
quietly turned that into `undefined` where an `Expression<boolean>` was required, a
rule that appeared to constrain and did not. Both builders also became **pure**:
neither takes a sink or keeps a shared list, so only the value a callback RETURNS
counts — a chain a rule builds and discards contributes nothing, the way any other
dead expression would. This is the shape described above and the one that is built.
Design Decisions 22–26.

**Progress.** Steps 1–7 are implemented and green: the registry, all constraint
types, all three builders, all three compilers, the validator with its
`defineAccess` wiring, and `resolveAccessRule`'s constraint resolution. **611 tests
passing, 0 type errors** in `packages/core`; `apps/www` regenerated and typechecking
clean; lint clean across `access/`. Step 8 is next. Steps 8–15 are not started.
`ground-truth.md` in this directory is a generated dump of the current export
surface; it wins over any prose here that drifts.

**Rev 6 (2026-08-27).** Composability moved OUT of core. Rev 5's rule factories —
`accessRule`, `sharedRule`, `resourceRules`, `roleRules`, `sharedResourceRules`,
`ConstraintFragment` — were built, measured against a real four-collection schema, and
deleted. A check has to name the project's user/organization document types to be
assignable, so it belongs in the project; core's contribution is the slug-keyed
derivations (`AccessCheckFor` and siblings) that keep a project helper from drifting
from what `defineAccess` accepts. A helper now returns a CHECK rather than a branded
rule, which removes the `check` wrapper property, removes the resource list, restores
action-shape gating to `RolePermissions` (DD 14), and makes rev 5's two runtime bugs
unrepresentable rather than guarded against. Measured along the way: type parameters
cannot be inferred from a call's position in the permissions object, and a generic
callback cannot fan a helper across resources — see Step 11. See DD 29-34.

## Design Decisions

1. **The builder's type encodes the full Convex index contract.** A three-interface
   state machine mirroring `convex/src/server/index_range_builder.ts`:
   `ConstraintBuilder` (`eq`, advances the field cursor) extends
   `LowerBoundConstraintBuilder` (`gt`/`gte`) extends `UpperBoundConstraintBuilder`
   (`lt`/`lte`) extends `ConstraintResult` (nominal terminal). Each method's return
   type removes the methods that would now be illegal, so `eq`* → at most one lower
   bound → at most one upper bound is unrepresentable to violate. Verified: field
   order, gaps, arity, value types, operator sequencing, and forged results are all
   rejected at compile time.
2. **`IndexOp` derives from Convex's own interface** —
   `Extract<keyof IndexRangeBuilder<GenericDocument, string[], 0>, string>`. A new
   builder method appears automatically; a renamed one breaks compilation. Private
   nominal markers don't surface in `keyof`, so this yields exactly the five operators.
3. **Constraints are data, so they are bidirectional.** They compile _down_ to a
   Convex expression and interpret _in JS_ against a document. A callback only does
   the latter — which is why the callback form could never serve `usePermission` on a
   fetched document _and_ narrow a query from one declaration.
4. **`IndexFieldsBySlug` replaces `IndexesBySlug`.** The registry must carry field
   _tuples_, not just name unions, for positional typing. `IndexNameFor<S>` becomes
   `keyof IndexFieldsBySlug[S]`, so one registry entry serves both purposes rather
   than maintaining a parallel map.
5. **One callback signature, not a union of function types.** A rule is
   `(props) => boolean | ConstraintResult`. Verified in
   `type-proofs.inference.ts`: this preserves contextual typing of destructured
   params, while offering `constraints` as a _second top-level function alternative_
   beside the existing bare `filter` callback collapses `data`/`user`/`q` to `any`
   for every bare-callback rule already in the tree. So `constraints` is reachable
   only inside the object form, never as a bare alternative — which also keeps every
   existing rule source-compatible. `ConstraintResult` is nominal and `boolean`
   primitive, so runtime discrimination is unambiguous. Cost: a filter callback sees
   an unused `q` and vice versa.

   **Amended by rev 5.** A rule's top-level callback signature is now
   `(props) => boolean | AccessConditionResult` — the SECOND nominal terminal DD 24
   introduces, not `ConstraintResult` (that one now marks a completed expression
   inside one algebra's own callback, never what the rule itself returns). The
   "reachable only inside the object form" argument is unchanged.
6. **Positional index-order safety comes from `ix`, the range callback's own
   parameter — not from the authoring form.** Rev 4 put this on `q.withIndex(name)`
   directly; rev 5 (DD 22) moved the range one level further, into
   `q.withIndex(name, (ix) => …)`, so it never collides with the sibling `filter`
   callback. The mechanism is unchanged either way: because `withIndex` is a METHOD
   with its own type parameter, the literal at the call site resolves
   `TIndexFields[N]` — so `ix` binds to that one index's real field tuple wherever
   the rule is written, raw literal or factory:

   ```ts
   q.withIndex("by_author_category", (ix) => ix.eq("authorId", u).eq("categoryId", "news")) // ok
   q.withIndex("by_author_category", (ix) => ix.eq("categoryId", "news"))                   // error: field 1 before field 0
   q.withIndex("by_author", (ix) => ix.eq("authorId", u).eq("title", "x"))                  // error: index spent
   q.withIndex("by_author", (ix) => ix.neq("authorId", u))                                  // error: no index-range neq
   ```

   The original design had no such site — nothing in `PermissionCheck` named an
   index — so it fell back to `ConstraintFieldSlots<TFieldKeys>`, a fixed-length
   tuple repeating the resource's whole field-key union, which checked names, value
   types and operator sequencing but **not order**. That type is now deleted, and
   composability is project-side sugar again rather than the only safe path (DD 29).
7. **Runtime validation is a genuine backstop now, not the primary order check.**
   Rev 4 amends this: `q.withIndex` checks field order at compile time (DD 6), so
   `validateAccessConstraints` exists for constraints built by hand, assembled from
   data, or reached through `as any` — the cases types cannot see. It still runs once
   inside `defineAccess`, so a malformed rule fails at module load rather than at
   query time, and it still owns the check against the resource's REAL declared
   indexes, which the types only approximate before `vex generate`.
8. **A displaced access index degrades to `.filter()`, not to nothing.** Under the
   callback design, a caller-supplied index that won the slot dropped the access
   constraint entirely, leaving only the per-document check. Compiled constraints can
   be `and`-ed into the query's filter instead — full pages, narrowing preserved.
9. **Search narrows via `.filter()`, never via `SearchFilterFinalizer`.**
   `SearchFilter` and `IndexRange` are distinct nominal abstract classes;
   `SearchFilterFinalizer` offers only `eq`, and only over the search index's declared
   `filterFields`. `withSearchIndex` returns an `OrderedQuery`, which still exposes
   `.filter()` — that is the seam.
10. **Composability comes from functions, not exported type annotations.** P-002
    forbids threading authoring generics through traveling types, so
    `const r: RolePermissions<SubjectMap<…>, …> = …` is both unwritable and fragile.
    A function capturing generics by inference is the way in; rev 6 amends WHERE it
    lives and WHAT it returns — a project-side helper returning a CHECK, not a core
    factory returning a branded rule (DD 29-34). The global `DocumentBySlug` /
    `IndexFieldsBySlug` augmentations are what make standalone definitions possible
    with no bootstrap step.
11. **Clean cutover.** `AccessIndex` and the `withIndex: { name, range }` form —
    the original pre-rev-1 check-property shape — are deleted. This landed during
    Step 7, pulled forward from its original Step 13 target: `resolveAccessRule`
    could not be written against two check shapes at once. Keeping both would have
    preserved the dual-expression footgun — two hand-written expressions of one
    predicate that can silently disagree — which is the specific hazard this design
    removes.
12. **The per-document `hasPermission` pass stays unconditional.** Constraints reduce
    what gets read; they never replace the check. Unchanged from the previous spec.
13. **Calling `q.withIndex(name, range)` selects the algebra, and the range runs
    inside its own callback.** Rev 2 made the index optional; rev 4 moved the choice
    from a check property to a method on `q`; rev 5 gave that method's range its own
    callback parameter (`ix`) rather than returning a chainable `q`:

    | | inside the range callback (`ix`) | `q` as handed in |
    |---|---|---|
    | `q`/`ix` type | `ConstraintBuilder<TIndexFields["by_x"], TDoc, 0>` | `AccessQueryBuilder<TDoc, TIndexFields>` |
    | Operators | `eq` `gt` `gte` `lt` `lte` | `withIndex`, `filter` |
    | Fields | that index's, **in declaration order** | any document field, via `filter`'s own `f` |
    | Sequencing rule | `eq`* → ≤1 lower bound → ≤1 upper bound | none |
    | Compiles to | a `withIndex` range, or `.filter()` when displaced | — |

    `withIndex`'s return, `IndexedAccessCondition`, offers exactly one further method
    — `.filter(predicate)` — so an index condition and a per-document filter compose
    (DD 23) without either builder ever seeing the other's methods. The unindexed
    algebra (`FilterBuilder`, reached through `f` inside `.filter(…)`) is a strict
    **superset** of the index range, because it has boolean composition an index
    range cannot express. So this *shrinks* the callback escape hatch:
    `data.ownerId === user._id || data.isPublic` needs `or` and was previously forced
    to stay a callback; as a `.filter()` constraint it gains both query pushdown (via
    a sibling `.filter()` on an unindexed `q`) and the JS-predicate path. Index
    pushdown is the only capability gated on naming an index, which is true by
    definition.
14. **Constraints are allowed on every action; only `withIndex` is gated on query
    actions — by `q`'s TYPE.** Rev 2 opened the object form to every action; rev 4
    changed how the gate works; rev 5 renamed the mutation-side type without changing
    the mechanism. A query action's `q` is an `AccessQueryBuilder` and has
    `withIndex`; a mutation's `q` is an `AccessPredicateBuilder` — `filter` only, no
    `withIndex` — because it has no query to narrow. So `q.withIndex(…)` on a create
    is a missing-method error at the exact call, rather than a whole-object shape
    rejection pointing at the wrong line. The original restriction — `constraints` on
    `read`/`readDrafts` only — forced a rule covering both `read` and `update` to be
    written twice, once as a constraint and once as a callback, reintroducing the
    dual-expression footgun this design exists to remove.
15. **Custom resources may declare query actions, unindexed only.** Rev 2.
    `CustomResourceInput` gains `queryActions?: readonly string[]`, unlocking
    `{ constraints }` on those actions typed against the resource's `dataType<T>()`
    shape. `SubjectMap`'s custom branch keeps `indexes: never`, so the indexed branch
    is uninhabitable there — correct, since a custom resource has no table to index.
    The payoff is uniformity rather than performance: with no query to narrow, a
    custom-resource constraint is only ever interpreted as a predicate.

16. **Superseded by rev 5's purity requirement (DD 26).** Rev 3's design had the
    builder write into a caller-owned array rather than expose a readout on itself:
    `createIndexConstraintBuilder({ into })` appended to the caller's list and
    returned a plain `ConstraintBuilder`. That replaced an even earlier design that
    exported `ConstraintBuilderHandle` — `ConstraintBuilder & { constraints(): … }`
    — so the framework could drain a list the callback couldn't see. Kept for the
    historical reasoning, which stays correct as far as it goes: the capability
    split was real, but the reason recorded for wanting it was false —
    `constraints()` on `ConstraintBuilder` would NOT have polluted the terminal
    `ConstraintResult`, because `ConstraintBuilder` inherits _from_ it, not into it.
    Rev 5 went a step further than either: no sink AT ALL, caller-owned or
    otherwise. See DD 26.

17. **Field mode is removed.** Rev 3. `{ mode, fields }` promised field-level
    read/write restriction that Convex cannot enforce — there is no `select` on
    document queries, so every read returned whole documents and the field list only
    gated a post-hoc boolean. Rebuilding it properly means projection inside the
    constraint system, a separate design problem, so the API is withdrawn (Step 14,
    last) rather than left as a half-promise.

    **Amended by rev 4: `TFieldKeys` does NOT survive.** This decision originally
    kept `TFieldKeys`, `ExtractFieldKeys` and `SubjectEntry.fields` because
    `ConstraintFieldSlots<TFieldKeys>` needed them to type `q`. That type is deleted
    (DD 6), so `TFieldKeys` now appears only in field-mode types and on the `filter`
    leaf — Step 14 can collapse the generic. What still stays: `PERMISSION_MODES` /
    `PermissionMode`, which also type `defaultPermissionMode`; and `PERMISSION_SCOPES`
    (`doc`/`any`/`all`), an unrelated quantifier, untouched.
18. **The rule shape is ONE object on every action.** Rev 4. `{ constraints,
    filter? }`, full stop — no `withIndex` property, no two-branch union, no
    `IndexedConstraintCheck` / `UnindexedConstraintCheck` pair. Which algebra `q`
    offers is a type parameter (`TQ`), not a member of a union, so there is nothing
    to discriminate at the object level and nothing that can fail to discriminate.

    **Unchanged by rev 5, one clarification.** `TQ` now defaults to
    `AccessPredicateBuilder<TData>` (Step 4) — the narrower, `filter`-only surface —
    rather than defaulting wide; a query-shaped action instantiates it explicitly
    with `AccessQueryBuilder<TData, TIndexFields>`. `filter?` on this object remains
    the separate, OPTIONAL per-document check augmenting `constraints` — never to be
    confused with the `.filter(predicate)` METHOD `constraints`'s own `q` now offers.
19. **A discriminated union of check shapes is unreachable, so the index moved onto
    the builder.** Rev 4, and the finding that forced DD 18. Verified against `tsc`:
    a two-object union `{ withIndex: N; … } | { withIndex?: never; … }` types the
    destructured `q` correctly **on its own**, but adding ANY non-object member
    collapses `q` to `any` — and `PermissionCheck` must contain `boolean` and the
    bare callback. `withIndex?: undefined` and an absent-key variant fail
    identically; only giving each member a key the others lack works, which nesting
    (`withIndex: { name, constraints }`) or renaming (`indexConstraints`) would have
    bought at the cost of a second name for one concept. Putting the choice on `q`
    avoids the union entirely and reads as Convex's own API. Six encodings were
    probed; this is the only one that is both fully safe and needs no union.

    **Extended by rev 5.** Putting the choice on `q` solved the union problem but
    still let one method's return value (a chainable `q`) reach the OTHER algebra's
    methods by accident — the hole DD 24 closes. Nesting the range in its own
    callback (DD 22) confines `ix` so it structurally cannot.
20. **`SubjectEntry` carries index field TUPLES, not just names.** Rev 4, reversing
    the original "`RolePermissions`/`SubjectEntry` are kept exactly as they are"
    constraint. `q.withIndex(name, …)` must resolve that index's field order, so
    `SubjectEntry` gained `indexFields: Record<string, readonly string[]>` and
    `SubjectMap` emits it via `ExtractIndexFields<R>` from the Step 1 registry. This
    is the price of compile-time field order, and it is plumbing rather than new
    machinery — the data already existed in `IndexFieldsBySlug`.
21. **The pre-generation fallback must be a fixed-length tuple.** Rev 4.
    `ConstraintBuilder` — now the type of `ix`, the range callback's own parameter,
    rather than of `q` itself — terminates on `PlusOne<N> extends TFields["length"]`,
    and a plain `readonly string[]` has `length: number`, which satisfies that
    immediately and would end every chain after ONE constraint.
    `PreGenerationIndexFields` is therefore `Record<string, readonly [string × 8]>`:
    chaining behaves identically before and after `vex generate`, and only field
    NAMES and per-field value types widen. The same trap applies to
    `ConstraintValue` / `ConstraintField`, which degrade an unresolved `TDoc` to
    permissive rather than to `never` — without them `keyof unknown` is `never` and
    no constraint is writable at all.
22. **`withIndex` is callable once per query, so the range gets its own callback
    rather than living on `q` itself.** Rev 5. Verified against Convex's own
    `convex/src/server/query.ts`: `withIndex` is a method on `QueryInitializer`, and
    the `Query` it returns has no `withIndex` at all — chaining a second one is
    structurally impossible in Convex, not just discouraged. Rev 4's
    `q.withIndex(name).eq(…)` returned a `q` shaped like Convex's `Query`, so nothing
    stopped a rule from continuing to call comparison methods that read as "more
    index," when Convex itself draws that line at the method call, not at the value
    it returns. Giving `withIndex` its own range callback (`ix`) puts the line back
    where Convex puts it.
23. **Convex supports an index range AND a filter together, so an access rule
    should too.** Rev 5. `Query extends OrderedQuery`, which has `.filter()` — so
    `.withIndex(name, range).filter(expr)` is Convex's own normal pattern, not an
    edge case. Rev 4 forced index XOR filter on one rule (only one of `q.withIndex`'s
    chain or the flat algebra could run), which was strictly less expressive than
    the database underneath it: a rule needing "this index range, AND this
    predicate the range can't describe" had no single-declaration way to say so.
    `IndexedAccessCondition.filter(predicate)` is the fix — the range narrows what
    is READ, the filter rejects rows within it the range cannot describe (`neq`,
    `or`, `not`).
24. **A second nominal terminal, `AccessConditionResult`, closes a silent-`undefined`
    hole that a mislabelled "bug" masked.** Rev 5. The hole: `and` took
    `ConstraintResult[]`, and rev 4's index chain also returned `ConstraintResult`,
    so `f.and(indexChain, node)` type-checked. But the index chain's runtime value
    is a builder with no `kind`, and the tree compiler's `switch` has no default
    branch, so it silently returned `undefined` where an `Expression<boolean>` was
    required — a rule that appeared to constrain and did not. The adjacent
    "`{ index, filter }` both populated" state that earlier notes flagged as a bug
    to reject was in fact the natural encoding of `.withIndex(…).filter(…)` (DD 23);
    the REAL defect was `resolveAccessConstraint` checking `index` first and
    returning early, silently dropping a populated `filter` — fixed by `and`-ing
    both halves together when both are present (Step 7). Closed two ways: by
    CONFINEMENT (`ix` and `f` each live only inside their own callback and never
    escape it, DD 19) and by giving a completed CONDITION its own nominal type,
    `AccessConditionResult`, distinct from `ConstraintResult` (a completed
    EXPRESSION inside one algebra's callback) — so `FilterBuilder.and`, typed to
    take `ConstraintResult`, cannot accept an index condition at the type level at
    all, not merely by convention.
25. **The range callback is REQUIRED — a deliberate divergence from Convex, where it
    is optional.** Rev 5. Convex's own docs are explicit about what an empty range
    means: "If the index range is not specified, all documents in the index will be
    considered," and doing so means "you will be scanning the whole table." A
    range-less `withIndex` therefore excludes NO documents — every row has an index
    entry — so it only re-orders results, never narrows them. Convex allows omitting
    it because a caller may legitimately want that ordering, typically paired with
    `take(n)`. An access rule never wants ordering and has no `take`, so a
    range-less access rule would read as a restriction while being none — the
    opposite of what naming an index is supposed to signal. Requiring the callback
    also guarantees `AccessCondition.index.constraints` is never empty, which
    `validateAccessConstraints` (Step 6) now relies on.
26. **Both builders are pure: only the value a callback RETURNS counts.** Rev 5,
    superseding DD 16. `createIndexConstraintBuilder()` and
    `createAccessQueryBuilder()` both take NO arguments — no `{ into }` sink, no
    caller-owned array of any kind — and every method returns a NEW node carrying
    the accumulated state immutably rather than mutating shared state. So a chain a
    rule builds and discards contributes nothing, exactly like any other dead
    expression; the old sink made a discarded chain apply anyway, which surprised in
    the one direction that matters — a rule doing more than it appeared to. Reading
    the data back out is module-private, through symbol-keyed carriers rather than a
    public method: `readIndexConstraints` (`createIndexConstraintBuilder.ts`) and
    `readAccessCondition` (`createAccessQueryBuilder.ts`), each called by the
    framework on whatever the corresponding callback RETURNED. Both return an
    empty/`undefined` result for a foreign value instead of throwing, so a rule
    reaching past its types cannot silently widen into an unfiltered read.

27. **A constraint must reach the QUERY, not only the per-document pass.** Step 8.
    `find` originally resolved the filter expression only when the access index had
    been displaced by the caller. That silently skipped a rule with no index at all —
    the flat algebra, and the only form an action-level wildcard can express — and
    silently dropped the `filter` half of an index+filter rule whenever the access
    index won the slot. Neither leaked a row, because `hasPermission` still ran per
    document; both defeated the entire point, since Convex counts `numItems` after
    `.filter()` but before a JS post-filter, so the pages went ragged exactly as they
    had under the callback design. The lesson generalises: a narrowing that is only
    enforced after the read is not a narrowing. `resolveAccessConstraint` is now
    called unconditionally and told whether the range was already pushed down, and
    three tests fail if either case regresses — the decisive one asserts a FULL page,
    because page size is the only observable that distinguishes "filtered in the
    query" from "filtered in JS afterwards".
28. **The action-level wildcard resolves at config time too.** Step 8. Its `q` is an
    `AccessPredicateBuilder`, so it can never name an index and the validator has
    nothing to check — but the wildcard was the one place a constraints callback was
    never executed during `defineAccess`, which meant a throwing rule surfaced at
    query time instead of module load. It now runs like any explicit action. The
    role-level wildcard stays boolean-only and is unaffected.
29. **Composable access checks live in the PROJECT, not in core.** A check must name
    the project's user and organization document types to be assignable to
    `permissions[role][resource][action]`, and only the project knows those. Core's
    contribution is the slug-keyed derivations — `AccessCheckFor`,
    `AccessMutationCheckFor`, `AccessDocFor`, `AccessFieldKeysFor`,
    `AccessIndexFieldsFor` — so a project's helpers cannot drift from what
    `defineAccess` accepts. `packages/core/src/access/defineRules.ts` and its rule
    factories (`accessRule`, `sharedRule`, `resourceRules`, `roleRules`,
    `sharedResourceRules`, `ConstraintFragment`) were deleted in favour of this.
30. **A helper returns a CHECK, not a rule — which is what removes the `check`
    property.** The returned value drops straight into the action slot, so a helper
    call, a bare `true`, and a full inline `{ constraints, filter }` object coexist in
    one object with no seam and no second notation. `check` only ever existed because a
    rule factory had to hold `boolean | callback | object` in one property alongside
    `resource`/`action`; nothing in the type system required it.
31. **Type parameters cannot be inferred from the call position.** Measured: a helper
    with five type parameters called at `permissions.contributor.articles.read` infers
    `unknown` for all five, because the contextual type there is a union
    (`PermissionCheck<…> | undefined`) and TypeScript's return-type inference bails on
    union-to-union. The resource therefore has to arrive as a value — passing the
    collection config (`readOwn(articles, "authorId")`) binds the slug and types the
    field argument, the document, and the builder without a hand-written generic.
32. **Branding is unnecessary once the check is typed.** `readOwn(articles, …)` returns
    `Check<"articles">`, so placing it under `case_studies` is a compile error even
    though both collections declare `authorId` and `by_author`. The rule factories
    needed an explicit `resource` brand only because they erased the check's type to
    make it storable — the erasure created the problem the brand solved.
33. **No multi-resource form, deliberately.** Two shapes were built and measured. A
    resource list forces every listed collection to declare the same index name over an
    identical field tuple, which is why `comments` (no `status`) could not join the
    status rules. A generic callback (`forEach(resources, (c) => …)`) does not compile
    at all: inside it `S` is unbound, so `IndexedField<S>` is an unreduced conditional
    and no concrete field name satisfies it. A descriptor form keyed by slug does work
    and is available if wanted. Naming the resource once per line costs a line and
    keeps the whole permission matrix readable, which is the accepted trade.
34. **Action-shape checking belongs to `RolePermissions`, not to the helper.** Verified
    that `update: readOwn(articles, "authorId")` is rejected with no helper-side bound:
    an index-pushing check's `constraints` demands an `AccessQueryBuilder`, a mutation
    slot supplies an `AccessPredicateBuilder`, and parameter contravariance rejects it.
    This is DD 14 doing its job. The `QueryAction` bound and the `withIndex` callback
    adaptation that the deleted factories needed were both fixes to bugs their own
    erasure and callback-splitting created; neither failure mode is representable here.

35. **Permission callbacks read `DeclaredDoc`, not the raw document.** Step 11.
    Generated documents extend `VexDocument`, whose `[key: string]: unknown` made
    `data.anythingAtAll` resolve to `unknown` in every access callback instead of
    erroring — the same leak `ConstraintField` already handled for field NAMES (DD 8),
    now closed for document READS at `SubjectMap`, which covers the inline config form;
    project-side helpers inherit it through `AccessDocFor`.
36. **A `select` field's generated type is an ARRAY, and its option alias is
    qualified by collection.** Step 11 fallout, not access-specific. `select` stores
    `v.array(...)`, but the interface generator substituted the bare option-union name
    and dropped the `[]` — so the generated type promised a scalar the deployed schema
    rejected, and `q.eq("status", "published")` typechecked against a shape no stored
    row can have. The alias is also now `<InterfaceName><FieldKey>Option`: keyed on the
    field alone, `status` on three collections emitted three `StatusOption` aliases and
    broke the generated file with duplicate identifiers. The alias is not exported, so
    qualifying it is invisible to user code.

37. **Field keys ARE the document's keys.** The field-type map is a field-TYPE index,
    and `_id` is not a field type — it was injected as a synthetic `id: "_id"` entry
    for one reason: to get `_id` into the flattened field-key union that
    `filter`'s field-mode object accepts. Nothing else could reach it
    (`FieldKeysOfType` bounds its key to `AdminFieldType`), and nothing read it. The
    side effect was that `_id` could be named in a field permission and
    `_creationTime` could not — an accident of the emitter, not a decision, and the
    same asymmetry made `keyof AccessDocFor<S>` silently non-assignable.
    `AccessFieldKeysFor` now derives from the document, which brings `_creationTime`
    (and `_slug` on globals) with it; `ExtractFieldKeys` collapses to a one-line reuse;
    both generated maps drop the synthetic entry; and `access/types.ts` no longer
    imports `CollectionsFieldTypeMap`/`GlobalsFieldTypeMap` at all.
    `FieldKeysOrWide` still covers the pre-`vex generate` case, where the document is
    `Record<string, unknown>`, its index signature is stripped, and a bare `keyof`
    would collapse to `never` and make every field name unwritable.

38. **`vex generate` emits the auth slugs, so a check type takes ONE parameter.**
    `AccessCheckFor<S, TUser, TOrg>` forced every project to declare two local aliases
    naming its user and organization documents — the last project-specific types in an
    otherwise generic helper file. But `userCollectionSlug`/`orgCollectionSlug` are
    already in `vex.config.ts` at generate time, so the registry now carries
    `AuthSlugs: { user; organization }`, and `AuthUserDocument`/`AuthOrgDocument`
    resolve them through `DocumentBySlug`. `AccessCheck<S>` / `AccessMutationCheck<S>`
    need nothing passed in, and `apps/www/src/auth/permissions.ts` went from ten local
    type definitions to zero. The interim three-parameter aliases (`AccessCheckFor`,
    `AccessMutationCheckFor`) were removed once superseded — the survivors inline
    `PermissionCheck` / `AnyActionPermissionCheck` directly. The same audit deleted
    `apps/www/src/db/types.ts` (pre-RBAC `User` alias file, zero importers) and kept
    www's frontend `hasPermission` wrapper — the frontend tree has no Vex providers —
    after correcting its two stale doc claims (fail-closed on missing access; `"any"`
    as the default scope). Unset or pre-generate resolves to `never`, which widens
    to the same fallbacks every other registry lookup uses. The narrowing helper
    `DocumentForSlug` takes a NAKED type parameter on purpose: TypeScript narrows a
    conditional's checked type only when it is a bare parameter, so the inline form
    fails with "Type 'never' cannot be used as an index type".
39. **Casts in a generic check builder are inherent; their LOCATION is a choice.** A
    function generic over a slug `S` and a field `F` cannot hand a concrete value to
    `AccessFieldValueFor<S, F>`, nor call `ix.eq(field, …)` against
    `AccessIndexFieldsFor<S>[N]` — both are unresolved while the parameters are
    unbound, and TypeScript will not check a value against a type it cannot reduce even
    when a bound plainly guarantees it. `indexedEqCheck`, `indexedOwnerCheck`, and
    `ownerPredicateCheck` own those casts behind fully-checked public signatures, so a
    project's own checks carry none. Call-site safety is unaffected: field-must-lead-an
    -index, value-must-match-field, resource-branding, and action-shape gating are all
    still rejected at the call.
40. **`AccessDocFieldFor` is a separate alias from `AccessFieldKeysFor`, for a
    mechanical reason.** The latter wraps `keyof` in `FieldKeysOrWide`, a conditional
    that cannot reduce while `S` is unbound — so a parameter bounded by it is not
    *provably* a key of the document and `data[field]` fails with "Type 'F' cannot be
    used to index type". `AccessDocFieldFor` is a bare `keyof`, which indexes with no
    cast. Use `AccessFieldKeysFor` for a permission's `fields` array (it stays writable
    pre-`vex generate`); use `AccessDocFieldFor` for a builder that reads a field off a
    document.
41. **The owner comparison shape follows the field's declared type, decided at build
    time from the config.** A relationship field stores `Id<slug>[]` regardless of
    `hasMany`, so an index range must compare `[user._id]`; a plain column compares the
    id. `indexedOwnerCheck` reads `resource.fields[field].type` to choose, which is why
    it is a distinct builder rather than a call to `indexedEqCheck` — the value cannot
    be supplied by the caller, since it depends on the request's user.

42. **The field-mode check form is REMOVED.** `{ mode: "allow" | "deny", fields: [...] }`
    is gone, along with `PermissionMode`'s use as a check mode, `FieldPermissionResult`,
    `ResolvedFieldPermissions`, `mergeRolePermissions`'s field map, `SubjectEntry.fields`,
    `ExtractFieldKeys`, `FieldKeysOrWide`, `AccessFieldKeysFor`, `HasPermissionProps.fields`,
    and the `TFieldKeys` type parameter threaded through every check type. The supported
    forms are now `boolean`, a callback, and `{ constraints, filter? }`. `PERMISSION_MODES`
    survives — it still names `defaultPermissionMode`, an unrelated concept.
    Merging across roles collapses to `resolved.some(Boolean)`.
    This also deleted a latent bug rather than fixing it: `hasPermission` derived the
    gated field set from `Object.keys(props.data)`, and on `update` `props.data` is the
    STORED row — so `{ mode: "deny", fields: ["body"] }` denied every update to any row
    that had a `body`, including patches that never touched it. Two responsibilities
    ("the document to evaluate rules against" and "the fields being gated") were
    conflated in one parameter; removing the form removes the conflation.
    Post-removal audit swept the remains: `VexAccessError.field` (only the deleted
    field-map branch ever set it), the stale `fields` param/example in
    `hasPermission`'s JSDoc, the "deprecated `{ filter, withIndex }` pair" doc on
    `PermissionCheck` (the member itself died in Step 7), and `SubjectEntry`'s
    "field-key union" phrasing.
43. **Equality over Convex values is STRUCTURAL, in both compile targets.** The JS
    predicate used `===` while Convex compares by content, so the two directions of the
    bidirectionality guarantee disagreed for every array-valued field — which is every
    `relationship` and `select` field, since both store `v.array(...)`. The divergence
    was asymmetric and one side was unsafe: `eq` produced a false NEGATIVE (a client
    denied what the server granted — the visible symptom being a permission check
    returning `false` for a row the query had already returned), while `neq` produced a
    false POSITIVE (the predicate admitted a row the query excluded). `CONSTRAINT_COMPARATORS.eq`
    and `FILTER_COMPARATORS.neq` now share one content-equality function. Ordering
    operators are left as JS relational comparisons: they are only ever recorded against
    a single field of one type, and Convex's cross-type total order is deliberately not
    reimplemented.
44. **`create` authorizes against the PAYLOAD.** Every other write authorizes against
    the stored row, because the payload is caller-controlled. `create` has no stored row
    and the payload is exactly what is about to become one, so passing no `data` made
    every payload-dependent rule deny unconditionally: the capability probe saw the
    `data` read and answered the default `scope: "all"` question, "can this hold for
    every document", with `false`. The payload-hijack concern that motivates `update`'s
    behaviour does not apply here — there is nothing yet to misrepresent.
45. **Config-time validation checks the index NAME, and rejects a non-condition.**
    `validateAccessConstraints` only ever inspected the declared tuples' VALUES, so any
    field sequence matching SOME declared index passed regardless of the name the rule
    actually wrote — `q.withIndex("does_not_exist", ix => ix.eq("title", …))` was
    accepted and would fail at query time, which is precisely what this validator
    exists to prevent. It now takes the recorded `indexName`, requires the resource to
    declare it, and narrows the field-prefix check to that index alone. Separately, a
    `constraints` callback returning something not built through `q` (a bare object,
    `undefined`, a number) fell through the `condition?.index === undefined` guard and
    was accepted as "excludes nothing" — the most dangerous possible default, since the
    author believes a restriction exists. It is now a config error. `readAccessCondition`
    is null-safe so a `undefined` return reports as a config error rather than a
    `TypeError`, and `resolveAccessRule` still fails SAFE for the same shape at request
    time: the gate stops authors, the resolver stops everything else.

## Out of Scope

- **`totalDocs` split, bounded `loadMore`, dev warnings, and the www wiring** from
  `2026-08-23-access-index-resolution` Steps 6–10. Independent of the rule shape;
  that spec still owns them.
- **Index-backed search filtering.** If a constrained field is in a search index's
  `filterFields`, `SearchFilterFinalizer.eq()` would beat `.filter()` — but that
  needs a `filterFields` registry, a fourth compile target, and a fallback when the
  field isn't declared. Deferred; Step 9 records it.
- **Compile-time operator sequencing for the plain-array form.** Encoding "everything
  before the last must be `eq`" over a tuple needs another recursion layer for a
  worse error message than the builder already gives. The validator covers it.
- **A recording adapter over the old range callback.** Introspecting a callback by
  passing it a proxy would have avoided the API change, but the builder makes it
  unnecessary and the proxy would break silently whenever Convex adds a method.
- **Cross-index constraint fragments.** "Constrain field 0" is only meaningful
  relative to one index. A fragment generified over `TFields`/`TDoc` is reusable
  across resources whose indexes share a leading field; nothing more general exists.
- **Array membership, string operations, and cross-table reads.** Outside
  `FilterBuilder`'s surface, so they remain callbacks permanently.
- **Reinstating field-level permissions.** Step 14 removes the `{ mode, fields }`
  shape; bringing it back properly means per-field projection, which Convex does not
  offer on document queries. The plausible future shape is a fourth compile target
  that strips non-permitted keys from each returned document _after_ the read, driven
  by the same constraint declaration — not a parallel API. Explicitly deferred, not
  abandoned.
- Anything in `2026-08-23-versioning-drafts`.

## Implementation

### Step 1 — `IndexFieldsBySlug` registry `[dev]` — [x] DONE

- [ ] `packages/core/src/types/generated.ts` — add `IndexFieldsBySlug` (slug →
      index name → readonly field tuple). Redefine `IndexNameFor<S>` as
      `keyof IndexFieldsBySlug[S]` so one registry entry serves both. Add
      `IndexFieldsFor<S, N>`. **`AccessIndexBySlug` / `AccessIndexNameFor` are
      DELETED** (done, ahead of Step 13): they existed only to type the `range`
      continuation on the deprecated `AccessIndex`, and their emitter read
      `check.withIndex.name` — a static property that no longer exists now the index
      is chosen by calling `q.withIndex(…)` inside the callback. Nothing consumed
      either type. Formerly this said keep
      unchanged. Map-level `infer` constraints only (AP-003).
- [ ] `packages/core/src/types/generateVexTypes.ts` — emit field tuples instead of
      name unions. A table with no indexes emits `{}` (today it emits `never` for
      the name union — verify the `keyof {}` fallback still widens correctly).
- [ ] `packages/core/src/types/generateVexTypes.test.ts` — tuples emitted in
      declaration order; multi-field index preserved; index-less table emits `{}`.
- [ ] `pnpm --filter www vex generate` — regenerate `apps/www/src/vex.types.ts`.

#### `packages/core/src/types/generated.ts`

Replace the existing `IndexesBySlug` type and its `IndexNameFor` one-liner —
everything between `DocumentBySlug` above and `AccessIndexBySlug` below, which is
unchanged — with three exports:

```ts
/**
 * Maps each collection slug to its declared Convex indexes, each as a
 * `readonly` tuple of field names in declaration order (`.index(name,
 * [...])` — search indexes excluded, since `withIndex` never targets
 * those). Field order is exactly what `ConstraintBuilder`
 * (`access/constraintTypes.ts`) narrows against, so this registry is the
 * sole source of truth both the constraint builder and `IndexNameFor`
 * resolve through — no parallel name-union map (supersedes the old
 * `IndexesBySlug`).
 *
 * - **Before `vex generate`:** resolves to
 *   `Record<string, Record<string, readonly string[]>>`.
 * - **After `vex generate`:** e.g.
 *   `{ pages: { by_author_category: readonly ["authorId", "categoryId"] } }`.
 *   A collection with NO indexed fields maps to `{}`, never `never` — see
 *   {@link IndexNameFor}.
 */
export type IndexFieldsBySlug = GeneratedVexTypes extends {
  IndexFieldsBySlug: infer I extends Record<
    string,
    Record<string, readonly string[]>
  >;
}
  ? I
  : Record<string, Record<string, readonly string[]>>;

/**
 * Index-name union for one slug — the keys of its {@link IndexFieldsBySlug}
 * entry. Widens to `string` pre-generation. An index-less slug's entry is
 * `{}`, and `keyof {}` is `never`, so this still correctly yields `never`
 * for that slug post-generation — the same result the old name-union form
 * gave by emitting `never` directly, reached here through an empty object
 * instead (an empty object stays a well-typed `keyof` target; a bare
 * `never` union would not, if `IndexFieldsFor` ever needed to index into
 * it).
 *
 * @internal
 */
export type IndexNameFor<S extends string> = S extends keyof IndexFieldsBySlug
  ? keyof IndexFieldsBySlug[S]
  : string;

/**
 * The field tuple for one slug + index name, in declaration order — what
 * `ConstraintBuilder<TFields, TDoc>` (`access/constraintTypes.ts`) is
 * instantiated with.
 *
 * @typeParam S - Collection slug.
 * @typeParam N - Index name declared on `S` (a member of `IndexNameFor<S>`).
 * @see {@link IndexFieldsBySlug}
 */
export type IndexFieldsFor<
  S extends keyof IndexFieldsBySlug,
  N extends keyof IndexFieldsBySlug[S],
> = IndexFieldsBySlug[S][N] extends readonly string[]
  ? IndexFieldsBySlug[S][N]
  : never;
```

#### `packages/core/src/types/generateVexTypes.ts`

Three edits. Everything not shown — `extractWithIndexName`, `collectAccessIndexNames`,
every other local (`collectionSlugs`, `documentsBySlug`, `accessIndexBySlug`, …) — is
unchanged.

**1 — `collectIndexNames` → `collectIndexFields`, plus a new `formatIndexFieldsEntry`.**
Replace the existing `collectIndexNames` function (the block directly above
`extractWithIndexName`) with two functions: the same field-scanning loop, now grouping
by index name instead of flattening to a name list, and a new formatter that handles
the `{}` edge case:

```ts
/**
 * Groups a collection's index-bearing fields by declared index name, in
 * field declaration order — the same computation `collectionConfigToVexSchema`
 * uses for its `.index()` chain (`collections/validator.ts:114-118`): an
 * explicit `field.index`, or an auto `by_<fieldKey>` for every relationship
 * field. Search indexes are excluded — `withIndex` never targets those.
 * Two fields declaring the SAME `field.index` value group into one compound
 * entry, fields in the order they appear on the collection.
 *
 * @param props - Input props.
 * @param props.collection - The collection to read index-bearing fields from.
 * @returns Map of index name → field keys, in declaration order. Empty when
 *   the collection declares no indexed fields.
 * @internal
 */
function collectIndexFields(props: {
  collection: CollectionConfig;
}): Map<string, string[]> {
  // TODO: implement
  // 1. `const fields = new Map<string, string[]>()`.
  // 2. Iterate `Object.entries(props.collection.fields)` — same loop
  //    `collectIndexNames` used, in declaration order.
  // 3. Resolve this field's index name: `field.index` if set, else
  //    `by_${fieldKey}` when `field.type === ADMIN_FIELDS.relationship.type`,
  //    else `continue` — this field contributes no index.
  // 4. `fields.get(indexName)` — if present, push `fieldKey` onto the
  //    existing array (this is what groups two fields sharing one
  //    `field.index` into a compound tuple); else
  //    `fields.set(indexName, [fieldKey])`.
  // 5. Return `fields`.
  //
  // Edge cases:
  // - A collection with no indexed fields returns an EMPTY map, never
  //   `undefined` — `formatIndexFieldsEntry` (below) is what turns that
  //   into the `{}` string.
  // - Two fields with the SAME `field.index` are a compound index —
  //   `Object.entries` iterates in declaration order, so the resulting
  //   tuple is positionally correct with no separate ordering pass.
  throw new Error("Not implemented");
}

/**
 * Formats one collection's `IndexFieldsBySlug` entry: a `readonly`
 * field-tuple per declared index name, or `{}` when the collection
 * declares none — the edge case `IndexNameFor` (`types/generated.ts`)
 * depends on: `keyof {}` still resolves to `never`, so an index-less slug
 * widens identically to the old `never`-union form while staying a valid
 * object type `IndexFieldsFor` can index into.
 *
 * @param props - Input props.
 * @param props.slug - The collection slug this entry is keyed under.
 * @param props.indexFields - This collection's `collectIndexFields()` result.
 * @returns One `\t<slug>: { ... }` (or `\t<slug>: {}`) line for the
 *   `IndexFieldsBySlug` block of the `declare module` augmentation.
 * @internal
 */
function formatIndexFieldsEntry(props: {
  slug: string;
  indexFields: Map<string, string[]>;
}): string {
  // TODO: implement
  // 1. `props.indexFields.size === 0` → return `\t${props.slug}: {}` —
  //    the edge case above. NEVER emit `never` here; that was the old
  //    name-union encoding and no longer round-trips through `keyof`.
  // 2. Otherwise, for each `[indexName, fieldKeys]` entry (Map iteration
  //    order = insertion order = field declaration order), format
  //    `${indexName}: readonly [${fieldKeys.map((f) => `"${f}"`).join(", ")}]`
  //    — a `readonly` TUPLE, not a union: this is the field-order encoding
  //    `ConstraintBuilder` (`access/constraintTypes.ts`, Step 2) narrows
  //    against, so a single-field index still emits a 1-tuple
  //    (`readonly ["slug"]`) — never collapse it to a bare string.
  // 3. Join the per-index entries with `"; "` and return
  //    `\t${props.slug}: { ${entries} }`.
  //
  // Edge cases:
  // - A single collection with two DIFFERENT index names (e.g. `by_slug`
  //   and `by_status`) emits both as separate `; `-joined members of the
  //   SAME object literal — never two lines for one slug.
  throw new Error("Not implemented");
}
```

**2 — `indexFieldsBySlug` computation.** Replace the existing `indexesBySlug` local
(the block that calls `collectIndexNames` inside `generateVexTypes`) with:

```ts
const indexFieldsBySlug = allCollections
  .map((c) =>
    formatIndexFieldsEntry({
      slug: c.slug,
      indexFields: collectIndexFields({ collection: c }),
    }),
  )
  .join("\n");
```

**3 — `declareModule` key rename.** In the `declareModule` template literal, replace
the existing `\t\tIndexesBySlug: {\n${indexesBySlug}\n}` line with:

```ts
    \t\tIndexFieldsBySlug: {\n${indexFieldsBySlug}\n}
```

Run `pnpm --filter www vex generate` after this step lands — it regenerates
`apps/www/src/vex.types.ts` from the new emitter, which is what makes `IndexFieldsFor`
resolve to real tuples for the app's collections instead of the pre-generation fallback.

#### `packages/core/src/types/generateVexTypes.test.ts`

One edit. Replace the whole `describe("generateVexTypes — IndexesBySlug", ...)` block
(between the `DocumentBySlug` describe block above and the `AccessIndexBySlug` describe
block below — unchanged) with:

```ts
describe("generateVexTypes — IndexFieldsBySlug", () => {
  it("emits an explicit field.index as a readonly one-tuple", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "pages",
          fields: { slug: text({ index: "by_slug" }) },
        }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain(`IndexFieldsBySlug:`);
    expect(output).toContain(`pages: { by_slug: readonly ["slug"] }`);
  });

  it("groups two fields sharing the same index name into one compound tuple, in declaration order", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "pages",
          fields: {
            authorId: text({ index: "by_author_category" }),
            categoryId: text({ index: "by_author_category" }),
          },
        }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain(
      `pages: { by_author_category: readonly ["authorId", "categoryId"] }`,
    );
  });

  it("auto-indexes relationship fields as a readonly by_<fieldKey> one-tuple", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "authors", fields: { name: text() } }),
        defineCollection({
          slug: "posts",
          fields: { author: relationship({ collection: { slug: "authors" } }) },
        }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain(`posts: { by_author: readonly ["author"] }`);
  });

  it("joins multiple distinct index names on the same collection into one object", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "pages",
          fields: {
            slug: text({ index: "by_slug" }),
            status: text({ index: "by_status" }),
          },
        }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain(
      `pages: { by_slug: readonly ["slug"]; by_status: readonly ["status"] }`,
    );
  });

  it("emits '{}' — never 'never' — for a collection with no indexed fields", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "pages", fields: { title: text() } }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain(`pages: {}`);
    expect(output).not.toContain(`pages: never`);
  });
});
```

Verify: `pnpm --filter @vexcms/core test && pnpm --filter www typecheck`

### Step 2 — Constraint types `[agent]` — [x] DONE

Built on schedule, then carried three revisions past the original scope: rev 2
added the flat, permissive `FilterConstraintBuilder` for unindexed rules (DD 13);
rev 4 added `AccessQueryBuilder` — the actual `q` a query-shaped rule receives,
layering `withIndex` over the flat algebra as a method rather than a sibling
property (DD 18, DD 19); and rev 5 split query narrowing into two callbacks,
mirroring Convex's own query surface. `withIndex`'s range now runs inside its own
callback rather than chaining onto `q` itself (DD 22), that callback is REQUIRED
rather than optional (DD 25), and its result composes with a trailing
`.filter(predicate)` (DD 23) through a second nominal terminal,
`AccessConditionResult` — distinct from `ConstraintResult` and introduced
specifically to close a silent-`undefined` hole a mislabelled "bug" had masked
(DD 24). All of it is on disk in `packages/core/src/access/constraintTypes.ts`
and green.

- [x] `packages/core/src/access/constraintTypes.ts` — `IndexOp` (derived from
      Convex's `IndexRangeBuilder`) and `FilterOp` (`IndexOp | "neq"`); the
      degradation helpers `ConstraintField` / `ConstraintValue`;
      `AccessFilterConstraint` (recursive tree) and `AccessIndexConstraint` (flat
      positional record); `ConstraintResult` (nominal terminal for a completed
      expression inside one algebra's own callback); the three-interface
      positional state machine `UpperBoundConstraintBuilder` →
      `LowerBoundConstraintBuilder` → `ConstraintBuilder`, plus
      `NextConstraintBuilder` and the local `PlusOne`; `FilterConstraintBuilder`;
      `AccessConditionResult` (the second nominal terminal, for a completed
      condition on the query as a whole); `IndexedAccessCondition`, `withIndex`'s
      return type, which adds one more `.filter(predicate)` method;
      `AccessPredicateBuilder`, the `q` a mutation action receives; and
      `AccessQueryBuilder`, which extends `AccessPredicateBuilder` and adds
      `withIndex(name, range)`, whose `range` callback parameter is required.
- [x] `packages/core/src/access/constraintTypes.test.ts` — every case ported from
      `type-proofs.builder.ts` for the indexed chain (`eq` sequencing, bounds,
      every illegal transition, a forged `ConstraintResult`), plus
      `AccessIndexConstraint` / `IndexOp` shape checks. Scoped to the low-level
      positional builder only — the two-callback `AccessQueryBuilder` surface's
      own type-level negatives (a range-less `withIndex`, `withIndex` on a
      mutation action, an index condition forced into `and`, a chained second
      `withIndex`) live in `types.test.ts` (Step 4), against the `constraints`
      callback the rule shape actually exposes.

#### `packages/core/src/access/constraintTypes.ts`

On disk, in this shape. What follows walks the file in expository order — a few
symbols land in a different sequence on disk than below; each excerpt is quoted
with its real line number so the two can be cross-checked directly.

**`IndexOp`**, derived rather than hand-listed:

```ts
export type IndexOp = Extract<keyof IndexRangeBuilder<GenericDocument, string[], 0>, string>;
```

(`constraintTypes.ts:19`) — pulled straight from Convex's own `IndexRangeBuilder`
(DD 2), so a new upstream builder method appears here automatically and a rename
fails compilation instead of silently drifting. Convex's private nominal markers
never surface in `keyof`, so this resolves to exactly
`"eq" | "gt" | "gte" | "lt" | "lte"`.

**`FilterOp`**, the same set plus one operator Convex's index range has no
equivalent for:

```ts
export type FilterOp = IndexOp | "neq";
```

(`constraintTypes.ts:26`) — `IndexRangeBuilder` has no `neq`; `FilterBuilder`
does, which is exactly the extra expressiveness `FilterConstraintBuilder` (below)
needs to be a strict superset of the indexed builder rather than a parallel one.

**Design note — both runtime builders key off these unions, not a hand-written
method list.** `createIndexConstraintBuilder.ts`'s runtime node type is
`Record<IndexOp, (field: string, value: unknown) => unknown> & { [CONSTRAINTS]:
readonly AccessIndexConstraint<string, TDoc>[] }` (`createIndexConstraintBuilder.ts:15-17`,
Step 3), and `createFilterConstraintBuilder.ts`'s is
`Record<FilterOp, (field: string, value: unknown) => AccessFilterConstraint<TDoc>>`
plus `and`/`or`/`not` (`createFilterConstraintBuilder.ts:70-76`, Step 3). Keying
the *runtime* object's required-method set off the same union the *type-level*
chain interfaces are keyed off means a new Convex index-range method is a
compile error in the runtime builder too — an object literal typed
`Record<IndexOp, …>` is missing a required property the moment `IndexOp` grows a
member — not just a gap in the type-level chain that could go unnoticed until
someone tries to call the new method.

**The degradation helpers, `ConstraintField` and `ConstraintValue`:**

```ts
export type ConstraintField<TDoc> = unknown extends TDoc ? string : keyof TDoc & string;

export type ConstraintValue<TDoc, F extends string> = unknown extends TDoc
  ? unknown
  : F extends keyof TDoc
    ? TDoc[F]
    : never;
```

(`constraintTypes.ts:40`, `:56-60`) — `packages/core` runs against an
*unaugmented* registry: no `vex generate` step has run against it, so every
resource's document type resolves to `unknown`, and `keyof unknown` is `never`.
Without this pair, every constraint's `value` parameter would be typed `never`
and **no constraint could be written at all — including in `packages/core`'s own
test suite**, which is exactly the failure mode these two exist to prevent
(`unknown extends TDoc` is true only for `unknown`/`any`, so both widen exactly
in the pre-generation case and narrow normally the moment a real `TDoc` is
supplied). The `F extends keyof TDoc ? TDoc[F] : never` branch stays even once
`TDoc` is resolved: "you named a field that isn't on this document" remains a
real, `never`-typed error (DD 21) — only the *unresolved-registry* case
degrades, not a genuine typo.

**`AccessFilterConstraint`** (recursive tree) **and `AccessIndexConstraint`**
(flat positional record) — the two shapes a rule's recording ends up as,
depending on which algebra it used:

```ts
export type AccessFilterConstraint<TDoc> =
  | {
      kind: "compare";
      field: ConstraintField<TDoc>;
      op: FilterOp;
      value: ConstraintValue<TDoc, ConstraintField<TDoc>>;
    }
  | { kind: "and"; nodes: AccessFilterConstraint<TDoc>[] }
  | { kind: "or"; nodes: AccessFilterConstraint<TDoc>[] }
  | { kind: "not"; node: AccessFilterConstraint<TDoc> };

export type AccessIndexConstraint<TField extends string, TDoc> = {
  field: TField;
  op: IndexOp;
  value: ConstraintValue<TDoc, TField>;
};
```

(`constraintTypes.ts:69-78`, `:115-119`) — `AccessFilterConstraint` is recursive
because `FilterBuilder` supports `and`/`or`/`not` and an index range does not;
`AccessIndexConstraint` stays flat because an index range is a single ordered
list of per-field bounds, never a tree. Both are what a later compiler step
(`compileConstraints.ts`, Step 5) reads back to build a `withIndex` range, a
`FilterBuilder` expression, or a JS predicate — the same recorded data feeds all
three, which is the reason a builder replaces a callback (DD 3).

**`ConstraintResult`**, the nominal terminal every chain stage shares:

```ts
export declare abstract class ConstraintResult {
  private _isConstraintResult: undefined;
}
```

(`constraintTypes.ts:129-131`) — a private, unimplementable member, so a plain
object literal can never satisfy it; only a real chain call
(`eq`/`gt`/`gte`/`lt`/`lte`/`neq`/`and`/`or`/`not`) can produce one.
`constraintTypes.test.ts` proves this directly (below): assigning a hand-built
`{ field, op, value }` object to `ConstraintResult` is a `@ts-expect-error`. This
is the terminal for a completed EXPRESSION inside one algebra's own callback
(`ix.eq(...)` or `f.eq(...)`) — distinct from `AccessConditionResult` (below),
the terminal for a completed CONDITION on the query as a whole. Keeping the two
separate is DD 24, further down.

**The three-interface positional state machine**, `UpperBoundConstraintBuilder`
→ `LowerBoundConstraintBuilder` → `ConstraintBuilder`, plus
`NextConstraintBuilder` and the local `PlusOne` that advances the field cursor:

```ts
type PlusOne<N extends number> = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15][N];

export interface UpperBoundConstraintBuilder<TDoc, TField extends string> extends ConstraintResult {
  lt<F extends TField>(field: F, value: ConstraintValue<TDoc, F>): ConstraintResult;
  lte<F extends TField>(field: F, value: ConstraintValue<TDoc, F>): ConstraintResult;
}

export interface LowerBoundConstraintBuilder<
  TDoc,
  TField extends string,
> extends UpperBoundConstraintBuilder<TDoc, TField> {
  gt<F extends TField>(
    field: F,
    value: ConstraintValue<TDoc, F>,
  ): UpperBoundConstraintBuilder<TDoc, TField>;
  gte<F extends TField>(
    field: F,
    value: ConstraintValue<TDoc, F>,
  ): UpperBoundConstraintBuilder<TDoc, TField>;
}

export type NextConstraintBuilder<TFields extends readonly string[], TDoc, N extends number> =
  PlusOne<N> extends TFields["length"]
    ? ConstraintResult
    : ConstraintBuilder<TFields, TDoc, PlusOne<N>>;

export interface ConstraintBuilder<
  TFields extends readonly string[],
  TDoc,
  N extends number = 0,
> extends LowerBoundConstraintBuilder<TDoc, TFields[N] & string> {
  eq<F extends TFields[N] & string>(
    field: F,
    value: ConstraintValue<TDoc, F>,
  ): NextConstraintBuilder<TFields, TDoc, N>;
}
```

(`constraintTypes.ts:9`, `:144-147`, `:158-170`, `:182-185`, `:204-213`) — this
mirrors `convex/src/server/index_range_builder.ts` (DD 1): `eq` pins the field
at cursor `N` and advances to `N + 1`; `gt`/`gte` (inherited via
`LowerBoundConstraintBuilder`) pin the *same* field and close the chain to a
single optional upper bound (`lt`/`lte`, via `UpperBoundConstraintBuilder`);
each stage's return type removes the methods that would now be illegal. That
encodes Convex's complete index rule — zero or more `eq`, then at most one
lower bound, then at most one upper bound, fields strictly in index order with
no gaps, each value typed per field — as something unrepresentable to violate,
not something checked after the fact. `NextConstraintBuilder` is where the
state machine terminates: `PlusOne<N> extends TFields["length"]` is only
satisfiable when `TFields["length"]` is a fixed numeric literal, which is why
`TFields` must arrive as a real tuple (`readonly [...]`) rather than
`readonly string[]` — a plain array's `length` is `number`, which would satisfy
that check immediately and end every chain after one constraint (DD 21). Since
rev 5, this is the type of `ix`, the range callback's own parameter passed to
`AccessQueryBuilder.withIndex` (below) — never of `q` itself.

**`FilterConstraintBuilder`** — flat, permissive, and a strict *superset* of the
indexed builder:

```ts
export interface FilterConstraintBuilder<TDoc> {
  eq<F extends ConstraintField<TDoc>>(field: F, value: ConstraintValue<TDoc, F>): ConstraintResult;
  neq<F extends ConstraintField<TDoc>>(field: F, value: ConstraintValue<TDoc, F>): ConstraintResult;
  gt<F extends ConstraintField<TDoc>>(field: F, value: ConstraintValue<TDoc, F>): ConstraintResult;
  gte<F extends ConstraintField<TDoc>>(field: F, value: ConstraintValue<TDoc, F>): ConstraintResult;
  lt<F extends ConstraintField<TDoc>>(field: F, value: ConstraintValue<TDoc, F>): ConstraintResult;
  lte<F extends ConstraintField<TDoc>>(field: F, value: ConstraintValue<TDoc, F>): ConstraintResult;
  and(...nodes: ConstraintResult[]): ConstraintResult;
  or(...nodes: ConstraintResult[]): ConstraintResult;
  not(node: ConstraintResult): ConstraintResult;
}
```

(`constraintTypes.ts:91-101`) — this is the algebra behind `.filter(predicate)`,
whichever surface exposes it: a mutation action's whole `q`
(`AccessPredicateBuilder`, below), a query action's `q` when a rule skips
indexing entirely, or the extra predicate `IndexedAccessCondition.filter` layers
onto an index range (DD 13). Every method takes any `ConstraintField<TDoc>`, in
any order, and returns the same nominal `ConstraintResult`, so the interface
needs no positional tracking and no terminal states — it deliberately enforces
neither field order nor operator sequencing, because it compiles to
`.filter()`, which imposes neither. It has `neq` and `and`/`or`/`not`, which the
indexed builder cannot offer (an index range has no boolean composition), which
is what makes it a *superset* rather than a sibling: nothing expressible with
`ConstraintBuilder` is inexpressible here, and
`data.ownerId === user._id || data.isPublic` — the canonical case that used to
force a callback — is now `f.or(f.eq(...), f.eq(...))`.

**`AccessConditionResult`**, the second nominal terminal rev 5 introduces — the
terminal for a completed CONDITION on the query as a whole, returned by a
rule's top-level `constraints` callback:

```ts
export declare abstract class AccessConditionResult {
  private _isAccessConditionResult: undefined;
}
```

(`constraintTypes.ts:232-234`) — deliberately NOT `ConstraintResult`. Keeping
the two separate is what makes DD 24's hole unrepresentable: `FilterConstraintBuilder.and`
takes `ConstraintResult[]`, so under rev 4 — where `AccessQueryBuilder.withIndex`'s
chain also returned `ConstraintResult` — `f.and(indexChain, node)` type-checked.
The index chain's runtime value is a builder with no `kind`, so the tree
compiler's `switch` had no branch for it and silently produced `undefined`
where an `Expression<boolean>` was required: a rule that appeared to constrain
and did not. With the terminal split, `withIndex`'s result is no longer
assignable to `and`'s parameter type at all, so the mistake fails to compile
instead of compiling to a silent no-op. Nominal for the same reason as
`ConstraintResult`: a plain object literal must not satisfy it, so only a real
`q.withIndex(...)` / `q.filter(...)` call can produce one.

**`IndexedAccessCondition`** — what `withIndex` returns, and the type that lets
an index range and a filter compose on one rule:

```ts
export interface IndexedAccessCondition<TDoc> extends AccessConditionResult {
  filter(
    predicate: (q: FilterConstraintBuilder<TDoc>) => ConstraintResult,
  ): AccessConditionResult;
}
```

(`constraintTypes.ts:245-259`) — extends `AccessConditionResult` directly, so a
rule that only names an index can return `withIndex(...)`'s result as-is, with
no further call required. Its one extra method compiles to Convex's own
`.withIndex(name, range).filter(expr)` shape (DD 23): the range narrows what is
READ, the filter rejects rows within that range the range itself cannot
describe — `neq`, `or`, `not`, everything `FilterConstraintBuilder` has that
the positional `ConstraintBuilder` does not. `filter` here takes the same flat
`FilterConstraintBuilder<TDoc>`, reached through a callback parameter scoped to
this one call — it never sees, and cannot reach, the `ix` that built the range.

**`AccessPredicateBuilder<TDoc>`** — the `q` a rule on a NON-query action (a
mutation) receives:

```ts
export interface AccessPredicateBuilder<TDoc> {
  filter(
    predicate: (q: FilterConstraintBuilder<TDoc>) => ConstraintResult,
  ): AccessConditionResult;
}
```

(`constraintTypes.ts:272-282`) — `filter` only, no `withIndex`: a
create/update/delete has no query to narrow, so index pushdown is absent from
the type entirely rather than present-and-rejected (DD 14 — the gate is `q`'s
type, not a runtime check on the rule). This also doubles as `AccessQueryBuilder`'s
(below) own base interface, so a query-shaped rule's `q` is a strict superset
of a mutation's, and a rule authoring `q.filter(...)` reads identically
whichever action it guards.

**`AccessQueryBuilder<TDoc, TIndexFields>`** — the `q` a query-shaped rule
receives, extending `AccessPredicateBuilder` with one more method:

```ts
export interface AccessQueryBuilder<TDoc, TIndexFields extends Record<string, readonly string[]>>
  extends AccessPredicateBuilder<TDoc> {
  withIndex<N extends keyof TIndexFields & string>(
    name: N,
    range: (ix: ConstraintBuilder<TIndexFields[N], TDoc, 0>) => ConstraintResult,
  ): IndexedAccessCondition<TDoc>;
}
```

(`constraintTypes.ts:319-341`) — mirrors Convex's own query surface one layer
up: each algebra gets its own callback with its own builder, and the two never
meet in one expression, exactly like
`ctx.db.query("pages").withIndex("by_author", (q) => q.eq("authorId", u)).filter((q) => q.neq(...))`.
Calling `withIndex` runs the range callback against a `ConstraintBuilder` bound
to *that one index's* real field tuple, so Convex's index rules — field order
included — become compile errors instead of runtime validation's job alone:

```ts
q.withIndex("by_author_category", (ix) => ix.eq("authorId", u).eq("categoryId", "news")) // ok
q.withIndex("by_author_category", (ix) => ix.eq("categoryId", "news"))                   // error: field 1 before field 0
q.withIndex("by_author", (ix) => ix.eq("authorId", u).eq("title", "x"))                  // error: index is one field
q.withIndex("by_author", (ix) => ix.neq("authorId", u))                                  // error: no index-range `neq`
```

Three things about this shape are load-bearing:

- **Why the range is its own callback, not a chain hanging off `q` itself
  (DD 22).** Rev 4's `q.withIndex(name).eq(...)` returned a `q` shaped like
  Convex's own `Query`, so nothing in the type stopped a rule from continuing
  to call comparison methods that read as "more index." Convex itself draws
  that line at the METHOD CALL, not at the value it returns — verified against
  `convex/src/server/query.ts`: `withIndex` lives on `QueryInitializer`, and the
  `Query` it returns has no `withIndex` at all, so chaining a second one is
  structurally impossible in Convex, not merely discouraged. Nesting the range
  inside its own callback puts that line back where Convex puts it, and
  confines `ix` so it structurally cannot reach `filter`'s own algebra (`f`) by
  accident, or vice versa — the other half of what closes DD 24's hole,
  alongside the nominal-terminal split above.
- **Why the range callback is REQUIRED, unlike Convex's own optional one
  (DD 25).** Convex's docs are explicit about what an empty range means: every
  document in the index is considered, so omitting it doesn't narrow, only
  re-orders — legitimate for a caller pairing it with `take(n)`, never for an
  access rule, which has no `take` and would otherwise read as a restriction
  while being none. Requiring `range` also guarantees
  `AccessCondition.index.constraints` (`createAccessQueryBuilder.ts`, Step 3)
  is never empty, which `validateAccessConstraints` (Step 6) relies on.
- **Why `N` is `withIndex`'s own type parameter, not a sibling property
  (DD 19, DD 6).** Six encodings of "pick this index" at the check-object
  level were tried and rejected during rev 4 — the finding that forced the
  change is a `tsc`-verified result about discriminated unions: a two-member
  union whose branches differ only by whether one carries an index name types
  the destructured `q` correctly **on its own**, when the union has exactly
  two object members. But `PermissionCheck` also has to contain `boolean` and
  a bare callback signature as siblings, and adding *any* non-object member to
  that union collapses the destructured `q`, in every branch, to `any` —
  marking the absent member `?: never`, or simply omitting the key there, both
  fail identically. A method sidesteps the union entirely: `withIndex` is not
  a discriminant on an outer object at all, it is one method with its own type
  parameter `N`, so there is nothing to discriminate and nothing that can fail
  to discriminate. That same parameter is also what makes field order
  reachable at all: the literal string passed at the call site
  (`"by_author_category"`) resolves `TIndexFields[N]` — the real field tuple —
  right there, at the call. A property on a sibling object cannot do this: a
  neighbour key's type cannot see a literal type resolved on another key of
  the same object, so a design that kept index selection as a sibling to the
  callback could only ever offer the resource's *flat* field-key union to that
  callback, never the ordered tuple, deferring field order entirely to
  `validateAccessConstraints` (Step 6) — a runtime check, not a compile error.

Rules on mutation actions receive `AccessPredicateBuilder<TData>` instead of
`AccessQueryBuilder` — no query exists to narrow, so `withIndex` is *absent*
from the type rather than present-and-rejected (DD 14).

#### `packages/core/src/access/constraintTypes.test.ts`

On disk, and green. Builds a real chainable double — every method returns
itself, cast to the typed `ConstraintBuilder` interface — rather than
`type-proofs.builder.ts`'s ambient `declare const`, so the same statements both
typecheck under `tsc` *and* execute under vitest. Positive cases go through an
`acceptsConstraintResult` helper (proves assignability without an unused
binding); negative cases are bare statements with `@ts-expect-error` directly
above the erroring line. This file's scope stopped at the positional
`ConstraintBuilder` chain even after rev 5 — the two-callback shape
(`AccessQueryBuilder.withIndex`'s required `range`, `AccessConditionResult`,
`IndexedAccessCondition.filter`) is exercised where it is actually consumed, in
`types.test.ts` (Step 4), against the `constraints` callback a real rule
authors.

```ts
import { describe, expect, it } from "vitest";
import type { AccessIndexConstraint, ConstraintBuilder, ConstraintResult } from "./constraintTypes";

type PagesDoc = {
  authorId: string;
  categoryId: string;
  score: number;
  title: string;
};

/** Every chain method returns the same object, so a full chain call sequence runs without throwing. */
function fakeConstraintBuilder(): any {
  const chain: any = {
    eq: () => chain,
    gt: () => chain,
    gte: () => chain,
    lt: () => chain,
    lte: () => chain,
  };
  return chain;
}

const q3 = fakeConstraintBuilder() as ConstraintBuilder<
  readonly ["authorId", "categoryId", "score"],
  PagesDoc
>;
const q1 = fakeConstraintBuilder() as ConstraintBuilder<readonly ["authorId"], PagesDoc>;

/** Consumes a chain result to prove it satisfies `ConstraintResult` — the positive-case assertion. */
function acceptsConstraintResult(result: ConstraintResult): void {
  void result;
}

describe("ConstraintBuilder — eq chains", () => {
  it("accepts a single eq() on a compound index's first field", () => {
    acceptsConstraintResult(q3.eq("authorId", "u1"));
  });

  it("accepts eq() chained across two fields, in index order", () => {
    acceptsConstraintResult(q3.eq("authorId", "u1").eq("categoryId", "news"));
  });

  it("accepts eq() chained across all three fields", () => {
    acceptsConstraintResult(q3.eq("authorId", "u1").eq("categoryId", "news").eq("score", 5));
  });

  it("accepts a single-field index's only eq()", () => {
    acceptsConstraintResult(q1.eq("authorId", "u1"));
  });
});

describe("ConstraintBuilder — bounds", () => {
  it("accepts a lower bound after a prefix of eq()", () => {
    acceptsConstraintResult(q3.eq("authorId", "u1").gte("categoryId", "a"));
  });

  it("accepts a lower bound followed by one upper bound on the same field", () => {
    acceptsConstraintResult(q3.eq("authorId", "u1").gte("categoryId", "a").lt("categoryId", "z"));
  });

  it("accepts a lower + upper bound on the index's first field with no eq() at all", () => {
    acceptsConstraintResult(q3.gte("authorId", "a").lte("authorId", "z"));
  });
});

describe("ConstraintBuilder — rejects illegal chains", () => {
  it("rejects eq() after a lower bound", () => {
    // @ts-expect-error `eq` is not available after `gte` — LowerBound stage only exposes bound methods
    q3.eq("authorId", "u1").gte("categoryId", "a").eq("score", 5);
  });

  it("rejects a second lower bound", () => {
    // @ts-expect-error `gte` is not available after `gte` — only one lower bound per chain
    q3.gte("authorId", "a").gte("authorId", "b");
  });

  it("rejects anything after an upper bound", () => {
    // @ts-expect-error the chain is terminal after `lt` — UpperBoundConstraintBuilder has no further methods
    q3.gte("authorId", "a").lt("authorId", "z").eq("categoryId", "x");
  });

  it("rejects the wrong field for the current cursor position", () => {
    // @ts-expect-error field 0 of this index is "authorId", not "categoryId"
    q3.eq("categoryId", "news");
  });

  it("rejects skipping a field", () => {
    // @ts-expect-error field 1 is "categoryId", not "score" — eq() cannot skip ahead
    q3.eq("authorId", "u1").eq("score", 5);
  });

  it("rejects a value of the wrong type for the field", () => {
    // @ts-expect-error `score` is a number field; "5" is a string
    q3.eq("authorId", "u1").eq("categoryId", "news").eq("score", "5");
  });

  it("rejects constraining past the end of a single-field index", () => {
    // @ts-expect-error by_author is spent after one eq() — NextConstraintBuilder terminates at length 1
    q1.eq("authorId", "u1").eq("categoryId", "news");
  });

  it("rejects a plain object literal forging the nominal ConstraintResult", () => {
    const forged: ConstraintResult = {
      // @ts-expect-error ConstraintResult is nominal — only a real chain call can produce one
      field: "authorId",
      op: "eq",
      value: "u1",
    };
    expect(forged).toBeDefined();
  });
});

describe("AccessIndexConstraint / IndexOp", () => {
  it("accepts a record shaped from a real op literal and the field's own value type", () => {
    const constraint: AccessIndexConstraint<"authorId", PagesDoc> = {
      field: "authorId",
      op: "eq",
      value: "u1",
    };
    expect(constraint).toEqual({ field: "authorId", op: "eq", value: "u1" });
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 3 — Runtime builder `[dev]` — [x] DONE

All three builders are on disk and green: `createIndexConstraintBuilder`
(indexed positional builder), `createFilterConstraintBuilder` (unindexed, rev
2, untouched by rev 5), and `createAccessQueryBuilder` (composes the two into
the `ix`/`f` two-callback `q` a query-shaped rule receives, rev 5).

Rev 5's purity requirement (DD 26) landed on the first and third of these.
`createIndexConstraintBuilder` and `createAccessQueryBuilder` both dropped
their `{ into }` sink and now take **zero arguments**: every method returns a
brand-new node carrying its accumulated state immutably, keyed behind a
module-private symbol (`CONSTRAINTS` in the former, `CONDITION` in the
latter) rather than a caller-owned array or an exported readout method. A
rule's return value is the only thing that counts — a chain built and
discarded contributes nothing, the way any other dead expression would.
Reading the data back out is `readIndexConstraints` / `readAccessCondition`,
module-private in spirit though both are exported (the framework is their
only sanctioned caller): each reads whatever the corresponding callback
RETURNED, and each returns an empty/`undefined` result for a value it did not
build rather than throwing. `createFilterConstraintBuilder` needed none of
this — it already took no arguments and kept no state, rev 2's original
design.

- [x] `packages/core/src/access/createIndexConstraintBuilder.ts` — takes no
      arguments and returns a `ConstraintBuilder` positioned at field 0. Each
      of its five methods (`eq`/`gt`/`gte`/`lt`/`lte`) returns a NEW node
      carrying the accumulated list, keyed behind the module-private
      `CONSTRAINTS` symbol. `readIndexConstraints` reads that key off
      whatever a range callback returned; `[]` for anything else, never
      throws.
- [x] `packages/core/src/access/createIndexConstraintBuilder.test.ts` —
      asserts on the callback's return value through `readIndexConstraints`,
      never on a shared array: accumulation in call order, each operator's
      own literal, purity (a chain built on a builder and discarded leaves
      that builder carrying nothing; two branches off one shared prefix each
      carry only their own suffix; the prefix carries only what it did), two
      builders never sharing state, and `readIndexConstraints` on a foreign
      value.
- [x] `packages/core/src/access/createFilterConstraintBuilder.ts` —
      unchanged: returns a `FilterConstraintBuilder<TDoc>` with no sink and
      no state. Comparisons produce a `compare` node; `and`/`or`/`not` wrap
      the nodes their arguments produced; the callback's own return value is
      the tree root.
- [x] `packages/core/src/access/createFilterConstraintBuilder.test.ts` —
      unchanged: a flat comparison records one node; combinators record
      children in argument order and preserve nesting; statelessness across
      calls and across builder instances.
- [x] `packages/core/src/access/createAccessQueryBuilder.ts` — takes no
      arguments. Composes `createFilterConstraintBuilder` /
      `createIndexConstraintBuilder` internally, per call, never letting `ix`
      or `f` escape their own callback. `withIndex(name, range)` runs the
      REQUIRED range callback against a fresh positional builder and reads it
      via `readIndexConstraints`; its return, an `IndexedAccessCondition`,
      offers its own `.filter(predicate)` so a range and a per-document
      filter compose. `q`'s own bare `.filter(predicate)` builds a
      filter-only condition. Both wrap an `AccessCondition` behind the
      module-private `CONDITION` symbol; `readAccessCondition` reads it back,
      `undefined` for a foreign value.
- [x] `packages/core/src/access/createAccessQueryBuilder.test.ts` —
      `withIndex` carries the chosen index name and the range the callback
      built, and leaves `filter` absent; the bare `.filter` carries the
      predicate tree and leaves `index` absent; chaining `.filter` off
      `withIndex`'s return carries both, Convex's own
      `.withIndex(range).filter(expr)` shape, without disturbing the
      index-only value the rule already held; only the returned value
      counts, so a discarded outer chain and a discarded inner range chain
      both contribute nothing; two builders never share state; and
      `readAccessCondition` on a foreign value returns `undefined`.

#### `packages/core/src/access/createIndexConstraintBuilder.ts`

Pure now, and zero-argument: every one of `eq`/`gt`/`gte`/`lt`/`lte` returns a
brand-new node built from `[...accumulated, next]`, never mutating the node
it was called on. The accumulated list travels on the node behind a
module-private symbol, `CONSTRAINTS`, so it exists on the runtime object but
not on the exported `ConstraintBuilder` type — a rule's `ix` still has no way
to read, clear, or re-order what it built, because the public type says
nothing is there. `readIndexConstraints` is the only way back in, and it has
exactly one sanctioned caller: `createAccessQueryBuilder`, on whatever a
range callback returned.

**Rev 3 rationale (DD 16), now itself superseded by rev 5's purity
requirement (DD 26), kept for the record.** Rev 3 replaced
`ConstraintBuilderHandle`, a `ConstraintBuilder & { constraints(): … }`
intersection the framework held onto while the callback saw only the
narrower `ConstraintBuilder` view, with a caller-owned `{ into }` array the
factory appended to. The capability split was real — the callback genuinely
should not be able to read back what it recorded — but rev 3's stated reason
was wrong: putting `constraints()` on `ConstraintBuilder` would not have
polluted the terminal `ConstraintResult`, because `ConstraintBuilder`
inherits **from** `ConstraintResult`, not the other way around. Rev 5 went a
step further than either design: no sink at all, caller-owned or otherwise. A
`{ into }` array made a chain the rule built and discarded apply anyway — the
array kept growing regardless of what the callback returned — which
surprised in the one direction that matters, a rule doing more than it
appeared to. Purity closes that: only the node actually returned carries any
constraints, exactly like any other expression. `ConstraintBuilderHandle` and
the `{ into }` sink no longer exist anywhere in this package.

```ts
import type {
  AccessIndexConstraint,
  ConstraintBuilder,
  ConstraintResult,
  IndexOp,
} from "./constraintTypes";

/**
 * Key the accumulated constraint list is carried on. A symbol so it cannot collide
 * with a field name and does not appear in the builder's public type.
 */
const CONSTRAINTS = Symbol("vex.access.indexConstraints");

/** The runtime shape behind a positional chain: methods, plus its own accumulation. */
type IndexChainNode<TDoc> = Record<IndexOp, (field: string, value: unknown) => unknown> & {
  [CONSTRAINTS]: readonly AccessIndexConstraint<string, TDoc>[];
};

/**
 * Creates a positional constraint builder — the `ix` a rule receives inside
 * `q.withIndex(name, (ix) => …)`.
 *
 * **Pure.** Every method returns a NEW builder carrying the accumulated list; there
 * is no shared array and no caller-owned sink. That is what makes "only the value
 * the callback RETURNS counts" true rather than aspirational: a chain the rule
 * builds and discards leaves nothing behind, exactly like any other dead expression.
 * The earlier `{ into }` sink made discarded chains apply anyway, which surprised in
 * the one direction that matters — a rule doing more than it appeared to.
 *
 * The TYPE narrows per call — {@link ConstraintBuilder}'s three-interface state
 * machine only exposes the methods still legal at each position. The RUNTIME object
 * does not: each node carries all five methods, cast to the narrowing type on
 * return. Type safety is enforced entirely at the call site, never here.
 *
 * @typeParam TFields - The index's field tuple, in declaration order.
 * @typeParam TDoc - The document shape constraint values are typed from.
 * @returns A builder positioned at field 0, with nothing accumulated.
 */
export function createIndexConstraintBuilder<
  TFields extends readonly string[],
  TDoc,
>(): ConstraintBuilder<TFields, TDoc> {
  /**
   * Builds one node over an accumulated list.
   *
   * Keying the methods off {@link IndexOp} means a new Convex index-range method
   * becomes a compile error here rather than a silently unrecorded operator.
   *
   * @param constraints - Everything accumulated so far, in call order.
   * @returns A node exposing all five operators, each extending the list.
   */
  function node(constraints: readonly AccessIndexConstraint<string, TDoc>[]): IndexChainNode<TDoc> {
    /**
     * Appends one constraint and returns the next node.
     *
     * The cast erases per-field narrowing the runtime cannot re-derive:
     * `AccessIndexConstraint`'s `value` is `TField extends keyof TDoc ? … : never`,
     * a call-site typing device, while these parameters are `string`/`unknown`.
     *
     * @param op - The method's own name, matching {@link IndexOp} exactly.
     * @param field - Field name being constrained.
     * @param value - Constraint value, already validated at the call site.
     * @returns The next node in the chain.
     */
    const extend = (op: IndexOp, field: string, value: unknown): IndexChainNode<TDoc> =>
      node([
        ...constraints,
        { field, op, value } as AccessIndexConstraint<string, TDoc>,
      ]);

    return {
      eq: (field, value) => extend("eq", field, value),
      gt: (field, value) => extend("gt", field, value),
      gte: (field, value) => extend("gte", field, value),
      lt: (field, value) => extend("lt", field, value),
      lte: (field, value) => extend("lte", field, value),
      [CONSTRAINTS]: constraints,
    };
  }

  // The one sanctioned cast: the runtime shape (five methods, always present) does
  // not match the narrowing interface shape (each stage exposes a different subset).
  return node([]) as unknown as ConstraintBuilder<TFields, TDoc>;
}

/**
 * Reads the constraints a returned positional chain accumulated.
 *
 * The counterpart to the cast above: `ConstraintResult` is nominal and carries no
 * public shape, so only this module can get the list back out. Called by
 * `createAccessQueryBuilder` on whatever the range callback returned — which is why
 * a discarded chain contributes nothing.
 *
 * @typeParam TDoc - The document shape constraint values are typed from.
 * @param result - The value a range callback returned.
 * @returns Its accumulated constraints, in call order. `[]` when `result` did not
 *   come from this module — unreachable through the types, and treated as "no
 *   constraints" rather than throwing, since `validateAccessConstraints` owns
 *   diagnosing a rule that reached past them.
 * @internal
 */
export function readIndexConstraints<TDoc>(
  result: ConstraintResult,
): readonly AccessIndexConstraint<string, TDoc>[] {
  const carried = (result as unknown as Partial<IndexChainNode<TDoc>>)[CONSTRAINTS];
  return carried ?? [];
}
```

(`createIndexConstraintBuilder.ts:1-107`, full file.)

#### `packages/core/src/access/createIndexConstraintBuilder.test.ts`

On disk, and green. No `into` array anywhere — every test asserts on the
value a chain call returns, read through `readIndexConstraints`.
Accumulation is covered in call order and per-operator. Purity is covered
from three angles: a chain built on a builder and then discarded (the
builder itself carries nothing afterward, because the `eq` call above
produced a NEW node and the original was never touched), two branches built
off one shared prefix (each carries only its own suffix, and the shared
prefix carries only what it did before either branch), and two fully
independent builders. `readIndexConstraints` on a value this module never
built — a plain `{}` — reports `[]` rather than throwing.

```ts
import { describe, expect, it } from "vitest";
import {
  createIndexConstraintBuilder,
  readIndexConstraints,
} from "./createIndexConstraintBuilder";

type PagesDoc = { authorId: string; categoryId: string; score: number };

/** A fresh builder over a three-field index. */
function chain() {
  return createIndexConstraintBuilder<
    readonly ["authorId", "categoryId", "score"],
    PagesDoc
  >();
}

describe("createIndexConstraintBuilder — accumulates in call order", () => {
  it("carries a single eq on the value it returns", () => {
    expect(readIndexConstraints(chain().eq("authorId", "u1"))).toEqual([
      { field: "authorId", op: "eq", value: "u1" },
    ]);
  });

  it("carries a chained sequence in call order", () => {
    const built = chain().eq("authorId", "u1").eq("categoryId", "news").gte("score", 3);
    expect(readIndexConstraints(built)).toEqual([
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "eq", value: "news" },
      { field: "score", op: "gte", value: 3 },
    ]);
  });

  it("records each operator with its own op literal", () => {
    const one = createIndexConstraintBuilder<readonly ["score"], PagesDoc>;
    expect(readIndexConstraints(one().gt("score", 1))).toEqual([
      { field: "score", op: "gt", value: 1 },
    ]);
    expect(readIndexConstraints(one().gte("score", 2))).toEqual([
      { field: "score", op: "gte", value: 2 },
    ]);
    expect(readIndexConstraints(one().lt("score", 9))).toEqual([
      { field: "score", op: "lt", value: 9 },
    ]);
    expect(readIndexConstraints(one().lte("score", 8))).toEqual([
      { field: "score", op: "lte", value: 8 },
    ]);
  });

  it("carries nothing when no method was called — the range callback returned the bare builder", () => {
    expect(readIndexConstraints(chain() as never)).toEqual([]);
  });
});

describe("createIndexConstraintBuilder — purity", () => {
  it("does not mutate the builder it was called on", () => {
    const start = chain();
    start.eq("authorId", "u1");
    // `start` is unchanged: the eq above produced a NEW node and was discarded.
    expect(readIndexConstraints(start as never)).toEqual([]);
  });

  it("branches independently from a shared prefix", () => {
    const prefix = chain().eq("authorId", "u1");
    const news = prefix.eq("categoryId", "news");
    const blog = prefix.eq("categoryId", "blog");

    expect(readIndexConstraints(news)).toEqual([
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "eq", value: "news" },
    ]);
    expect(readIndexConstraints(blog)).toEqual([
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "eq", value: "blog" },
    ]);
    // The shared prefix is untouched by either branch.
    expect(readIndexConstraints(prefix as never)).toHaveLength(1);
  });

  it("keeps two builders fully independent", () => {
    const a = chain().eq("authorId", "u1");
    const b = chain().eq("authorId", "u2");
    expect(readIndexConstraints(a)).toEqual([{ field: "authorId", op: "eq", value: "u1" }]);
    expect(readIndexConstraints(b)).toEqual([{ field: "authorId", op: "eq", value: "u2" }]);
  });
});

describe("readIndexConstraints — foreign values", () => {
  it("reports no constraints for a value this module did not build", () => {
    expect(readIndexConstraints({} as never)).toEqual([]);
  });
});
```

#### `packages/core/src/access/createFilterConstraintBuilder.ts`

This module is untouched by rev 5 — it already took no arguments and kept no
state, since rev 2. Unlike the indexed builder, it never had a flat sequence
to accumulate in the first place: the combinators consume `ConstraintResult`
values and return `ConstraintResult` values, so the callback's own return
value already *is* the root of the tree — there is nothing to accumulate and
nowhere to accumulate it. Two calls to this factory cannot interfere with
each other because there is nothing to interfere with: every node is a
freshly allocated object, reachable only through what the caller was handed
back.

```ts
import type {
  AccessFilterConstraint,
  ConstraintField,
  ConstraintResult,
  ConstraintValue,
  FilterConstraintBuilder,
  FilterOp,
} from "./constraintTypes";

/**
 * Creates a fresh unindexed constraint builder: the `q` a rule receives when it
 * declares no `withIndex` (DD 13). Comparisons produce a `compare` node;
 * `and`/`or`/`not` wrap the nodes their arguments produced, so a whole
 * expression evaluates bottom-up into one tree.
 *
 * Unlike {@link createIndexConstraintBuilder} this takes **no sink and keeps no
 * state**. The indexed builder records a flat sequence, so someone has to own the
 * list; here the combinators consume values and return values, which means the
 * callback's own return value already *is* the root of the tree. Two calls to this
 * factory cannot interfere because there is nothing to interfere with — every node
 * is freshly allocated and reachable only through what the caller was handed.
 *
 * The framework reads the result by reinterpreting the returned
 * {@link ConstraintResult} as {@link AccessFilterConstraint} — the same erasure this
 * module performs internally on combinator arguments. `ConstraintResult` is nominal
 * precisely so a rule cannot hand back a hand-built object literal; only a real
 * chain call can produce one.
 *
 * @typeParam TDoc - Document shape for the resource this rule governs.
 * @returns A stateless builder. Every call returns an independent object, and
 *   nothing is shared between them.
 */
export function createFilterConstraintBuilder<TDoc>(): FilterConstraintBuilder<TDoc> {
  /**
   * Reinterprets a combinator argument as the node it actually is at runtime.
   * `ConstraintResult`'s nominal private member exists to stop callers forging a
   * result; it carries no runtime representation, so this is an identity cast.
   *
   * @param result - A value returned by an earlier chain call on this builder.
   * @returns The same object, typed as the tree node it is.
   */
  const asFilterConstraint = (result: ConstraintResult): AccessFilterConstraint<TDoc> =>
    result as unknown as AccessFilterConstraint<TDoc>;

  /**
   * Builds one comparison method. The casts erase per-field narrowing that the
   * runtime cannot re-derive: `AccessFilterConstraint`'s `field` is
   * `keyof TDoc & string` and its `value` is indexed from `TDoc`, while these
   * parameters are `string` and `unknown`. The call site already checked both.
   *
   * @param op - The method's own name, matching {@link FilterOp} exactly so a
   *   later compile step can switch on it.
   * @returns A method recording one `compare` node under `op`.
   */
  const compare =
    (op: FilterOp) =>
    (field: string, value: unknown): AccessFilterConstraint<TDoc> => ({
      kind: "compare",
      field: field as ConstraintField<TDoc>,
      op,
      value: value as ConstraintValue<TDoc, ConstraintField<TDoc>>,
    });

  /**
   * Positionless runtime shape. Keying the comparisons off {@link FilterOp} means a
   * new operator there becomes a compile error here rather than a silently missing
   * method — the same discipline `createIndexConstraintBuilder` applies to
   * {@link FilterOp}'s index-only counterpart.
   */
  const builder: Record<
    FilterOp,
    (field: string, value: unknown) => AccessFilterConstraint<TDoc>
  > & {
    and: (...nodes: ConstraintResult[]) => AccessFilterConstraint<TDoc>;
    or: (...nodes: ConstraintResult[]) => AccessFilterConstraint<TDoc>;
    not: (node: ConstraintResult) => AccessFilterConstraint<TDoc>;
  } = {
    eq: compare("eq"),
    neq: compare("neq"),
    gt: compare("gt"),
    gte: compare("gte"),
    lt: compare("lt"),
    lte: compare("lte"),
    and: (...nodes) => ({ kind: "and", nodes: nodes.map(asFilterConstraint) }),
    or: (...nodes) => ({ kind: "or", nodes: nodes.map(asFilterConstraint) }),
    not: (node) => ({ kind: "not", node: asFilterConstraint(node) }),
  };

  // The one sanctioned cast in this module: every public method is declared to
  // return the nominal `ConstraintResult`, while the runtime returns the real node.
  // Erasing that here means no per-method cast and no way for a caller to reach the
  // node's shape without going through the framework's own reinterpretation.
  return builder as unknown as FilterConstraintBuilder<TDoc>;
}
```

(`createFilterConstraintBuilder.ts:1-94`, full file.) Note the JSDoc's own
`{@link createIndexConstraintBuilder}` cross-reference — the two modules are
written to be read side by side.

#### `packages/core/src/access/createFilterConstraintBuilder.test.ts`

On disk, and green. Comparisons, each operator's own `op` literal (including
`neq`, which the indexed builder cannot express), `and`/`or`/`not` including
a nested combinator and a zero-argument `and`, and three statelessness cases:
a later call never mutates an earlier result, two builder instances share
nothing, and a node built by one builder is accepted by another's combinator
because nodes are plain values, not bound to an instance.

```ts
import { describe, expect, it } from "vitest";
import { createFilterConstraintBuilder } from "./createFilterConstraintBuilder";
import type { AccessFilterConstraint, ConstraintResult } from "./constraintTypes";

type PagesDoc = {
  authorId: string;
  categoryId: string;
  score: number;
  isPublic: boolean;
};

/**
 * Reinterprets a chain result as the tree node it is at runtime — exactly what the
 * framework does when it consumes a rule's return value. `ConstraintResult` is
 * nominal so a rule cannot forge one; it has no runtime representation.
 *
 * @param result - Value returned by a chain call.
 * @returns The same object, typed as a constraint node.
 */
function tree(result: ConstraintResult): AccessFilterConstraint<PagesDoc> {
  return result as unknown as AccessFilterConstraint<PagesDoc>;
}

describe("createFilterConstraintBuilder — comparisons", () => {
  it("records a flat comparison as one compare node", () => {
    const q = createFilterConstraintBuilder<PagesDoc>();
    expect(tree(q.eq("authorId", "u1"))).toEqual({
      kind: "compare",
      field: "authorId",
      op: "eq",
      value: "u1",
    });
  });

  it("records each operator with its own op literal", () => {
    const q = createFilterConstraintBuilder<PagesDoc>();
    expect(tree(q.eq("score", 1))).toMatchObject({ op: "eq", value: 1 });
    expect(tree(q.neq("score", 2))).toMatchObject({ op: "neq", value: 2 });
    expect(tree(q.gt("score", 3))).toMatchObject({ op: "gt", value: 3 });
    expect(tree(q.gte("score", 4))).toMatchObject({ op: "gte", value: 4 });
    expect(tree(q.lt("score", 5))).toMatchObject({ op: "lt", value: 5 });
    expect(tree(q.lte("score", 6))).toMatchObject({ op: "lte", value: 6 });
  });

  it("supports `neq`, which the indexed builder cannot express", () => {
    const q = createFilterConstraintBuilder<PagesDoc>();
    expect(tree(q.neq("isPublic", false))).toEqual({
      kind: "compare",
      field: "isPublic",
      op: "neq",
      value: false,
    });
  });
});

describe("createFilterConstraintBuilder — combinators", () => {
  it("records `and` children in argument order", () => {
    const q = createFilterConstraintBuilder<PagesDoc>();
    expect(tree(q.and(q.eq("authorId", "u1"), q.gt("score", 3)))).toEqual({
      kind: "and",
      nodes: [
        { kind: "compare", field: "authorId", op: "eq", value: "u1" },
        { kind: "compare", field: "score", op: "gt", value: 3 },
      ],
    });
  });

  it("records `or` children in argument order", () => {
    const q = createFilterConstraintBuilder<PagesDoc>();
    expect(tree(q.or(q.eq("authorId", "u1"), q.eq("isPublic", true)))).toEqual({
      kind: "or",
      nodes: [
        { kind: "compare", field: "authorId", op: "eq", value: "u1" },
        { kind: "compare", field: "isPublic", op: "eq", value: true },
      ],
    });
  });

  it("preserves tree shape for a nested `or` inside an `and`", () => {
    const q = createFilterConstraintBuilder<PagesDoc>();
    const result = q.and(
      q.eq("categoryId", "news"),
      q.or(q.eq("authorId", "u1"), q.eq("isPublic", true)),
    );
    expect(tree(result)).toEqual({
      kind: "and",
      nodes: [
        { kind: "compare", field: "categoryId", op: "eq", value: "news" },
        {
          kind: "or",
          nodes: [
            { kind: "compare", field: "authorId", op: "eq", value: "u1" },
            { kind: "compare", field: "isPublic", op: "eq", value: true },
          ],
        },
      ],
    });
  });

  it("wraps exactly one node in `not`", () => {
    const q = createFilterConstraintBuilder<PagesDoc>();
    expect(tree(q.not(q.eq("isPublic", false)))).toEqual({
      kind: "not",
      node: { kind: "compare", field: "isPublic", op: "eq", value: false },
    });
  });

  it("records a zero-argument `and` as an empty node list — the identity case", () => {
    const q = createFilterConstraintBuilder<PagesDoc>();
    expect(tree(q.and())).toEqual({ kind: "and", nodes: [] });
  });
});

describe("createFilterConstraintBuilder — statelessness", () => {
  it("returns a fresh node per call — an earlier result is never mutated by a later one", () => {
    const q = createFilterConstraintBuilder<PagesDoc>();
    const first = tree(q.eq("authorId", "u1"));
    q.eq("authorId", "u2");
    expect(first).toEqual({ kind: "compare", field: "authorId", op: "eq", value: "u1" });
  });

  it("does not share state between two builders — a combinator only sees what it was passed", () => {
    const a = createFilterConstraintBuilder<PagesDoc>();
    const b = createFilterConstraintBuilder<PagesDoc>();
    a.eq("authorId", "u1");
    expect(tree(b.and(b.eq("score", 9)))).toEqual({
      kind: "and",
      nodes: [{ kind: "compare", field: "score", op: "eq", value: 9 }],
    });
  });

  it("accepts a node built by a DIFFERENT builder — nodes are plain values, not bound to an instance", () => {
    const a = createFilterConstraintBuilder<PagesDoc>();
    const b = createFilterConstraintBuilder<PagesDoc>();
    expect(tree(a.not(b.eq("isPublic", true)))).toEqual({
      kind: "not",
      node: { kind: "compare", field: "isPublic", op: "eq", value: true },
    });
  });
});
```

#### `packages/core/src/access/createAccessQueryBuilder.ts`

Composes the two builders above into the `q` a query-shaped rule actually
receives, mirroring Convex's own two-callback query shape: `withIndex` runs
its range callback against a fresh `createIndexConstraintBuilder()`, `filter`
runs its predicate callback against a fresh `createFilterConstraintBuilder()`,
and neither builder ever escapes its own callback — an index expression can
never reach a boolean combinator, structurally, not by convention. Zero
arguments, same purity as `createIndexConstraintBuilder`: nothing
accumulates outside a callback's own return, so a rule that builds a chain
and discards it contributes nothing.

**`AccessCondition<TDoc>`, replacing `RecordedAccessConstraints`.** Either
branch may be present, and **both together is the normal case, not a
conflict** — it is exactly `.withIndex(name, range).filter(expr)`, Convex's
own shape: the range narrows what is READ, the filter rejects rows within
that range which the range cannot describe (`neq`, `or`, `not`).

```ts
export interface AccessCondition<TDoc> {
  /** The index the rule chose, and the range it built on it. */
  index?: {
    /** Declared index name passed to `q.withIndex(…)`. */
    name: string;
    /** The range, in call order. Never empty — the range callback is required. */
    constraints: readonly AccessIndexConstraint<string, TDoc>[];
  };
  /** Root of the predicate tree, when the rule added or used `filter`. */
  filter?: AccessFilterConstraint<TDoc>;
}
```

(`createAccessQueryBuilder.ts:26-36`) — `index.constraints` is never empty,
because `withIndex`'s range callback is required (DD 25); `filter` is
whatever a `.filter()` predicate callback returned, whether called on `q`
directly or chained off `withIndex`'s return. Neither branch present means
the callback returned a condition that excludes nothing; absence of a
condition altogether is `undefined`, not an empty `AccessCondition`. This is
carried behind the nominal `AccessConditionResult` terminal on a
module-private symbol, `CONDITION` — the same discipline
`createIndexConstraintBuilder` applies to `CONSTRAINTS`.

```ts
import type {
  AccessConditionResult,
  AccessFilterConstraint,
  AccessIndexConstraint,
  AccessQueryBuilder,
  FilterConstraintBuilder,
  IndexedAccessCondition,
} from "./constraintTypes";
import { createFilterConstraintBuilder } from "./createFilterConstraintBuilder";
import { createIndexConstraintBuilder, readIndexConstraints } from "./createIndexConstraintBuilder";

/**
 * What a rule's `constraints` callback resolved to: the condition on which
 * documents the caller may read.
 *
 * Either half may be present, and **both together is the normal case, not a
 * conflict** — it is exactly `.withIndex(name, range).filter(expr)`, Convex's own
 * shape. The range narrows what is READ; the filter rejects rows within that range
 * which the range cannot describe (`neq`, `or`, `not`).
 *
 * Neither present means the callback returned a condition that excludes nothing.
 * Absence of a condition altogether is `undefined`, not an empty object.
 *
 * @typeParam TDoc - Document shape the values are typed against.
 */
export interface AccessCondition<TDoc> {
  /** The index the rule chose, and the range it built on it. */
  index?: {
    /** Declared index name passed to `q.withIndex(…)`. */
    name: string;
    /** The range, in call order. Never empty — the range callback is required. */
    constraints: readonly AccessIndexConstraint<string, TDoc>[];
  };
  /** Root of the predicate tree, when the rule added or used `filter`. */
  filter?: AccessFilterConstraint<TDoc>;
}

/** Key an `AccessCondition` is carried on behind the nominal terminal. */
const CONDITION = Symbol("vex.access.condition");

/** The runtime value behind {@link AccessConditionResult}. */
type ConditionNode<TDoc> = { [CONDITION]: AccessCondition<TDoc> };

/**
 * Creates the `q` a query-shaped rule receives.
 *
 * Composes the two algebras without letting them mix: `withIndex` runs its range
 * callback against a fresh positional builder and reads the result; `filter` runs
 * its predicate callback against a fresh flat builder. Neither builder escapes its
 * callback, so an index expression can never reach a boolean combinator.
 *
 * **Pure, and only the returned value counts.** Nothing accumulates outside a
 * callback's own return, so a rule that builds a chain and discards it contributes
 * nothing — dead code behaves like dead code.
 *
 * @typeParam TDoc - Document shape constraint values are typed from.
 * @typeParam TIndexFields - The resource's index name → field tuple map.
 * @returns A builder whose `withIndex` / `filter` results carry the condition.
 */
export function createAccessQueryBuilder<
  TDoc,
  TIndexFields extends Record<string, readonly string[]>,
>(): AccessQueryBuilder<TDoc, TIndexFields> {
  /**
   * Wraps a condition in the nominal terminal the callback returns.
   *
   * @param condition - The condition to carry.
   * @returns A value satisfying `AccessConditionResult` at the type level.
   */
  const conditionNode = (condition: AccessCondition<TDoc>): ConditionNode<TDoc> => ({
    [CONDITION]: condition,
  });

  /**
   * Runs a predicate callback against a fresh flat builder.
   *
   * @param predicate - The rule's predicate callback.
   * @returns The tree it returned.
   */
  const runFilter = (
    predicate: (q: FilterConstraintBuilder<TDoc>) => unknown,
  ): AccessFilterConstraint<TDoc> =>
    predicate(createFilterConstraintBuilder<TDoc>()) as AccessFilterConstraint<TDoc>;

  const builder = {
    withIndex: (name: string, range: (ix: unknown) => never) => {
      const built = range(createIndexConstraintBuilder<readonly string[], TDoc>());
      const constraints = readIndexConstraints<TDoc>(built);
      const base: AccessCondition<TDoc> = { index: { name, constraints } };

      return {
        ...conditionNode(base),
        // Continuing with `.filter(…)` produces a NEW condition carrying both
        // halves; the index-only value the rule already holds is unchanged.
        filter: (predicate: (q: FilterConstraintBuilder<TDoc>) => unknown) =>
          conditionNode({ ...base, filter: runFilter(predicate) }),
      };
    },
    filter: (predicate: (q: FilterConstraintBuilder<TDoc>) => unknown) =>
      conditionNode({ filter: runFilter(predicate) }),
  };

  return builder as unknown as AccessQueryBuilder<TDoc, TIndexFields>;
}

/**
 * Reads the condition a returned terminal carries.
 *
 * The counterpart to the casts above: `AccessConditionResult` is nominal and has no
 * public shape, so only this module can get the condition back out.
 *
 * @typeParam TDoc - Document shape the values are typed against.
 * @param result - The value a rule's `constraints` callback returned.
 * @returns Its condition, or `undefined` when `result` did not come from this
 *   module — unreachable through the types, and treated as "no condition" so a rule
 *   that reached past them cannot silently widen into an unfiltered read.
 */
export function readAccessCondition<TDoc>(
  result: AccessConditionResult,
): AccessCondition<TDoc> | undefined {
  return (result as unknown as Partial<ConditionNode<TDoc>>)[CONDITION];
}

/** Re-exported so the type name travels with its reader. */
export type { IndexedAccessCondition };
```

(`createAccessQueryBuilder.ts:1-125`, full file including the
`AccessCondition` declaration above.) `withIndex` stamps a base condition
with the chosen name and the range's constraints, then hands back an object
satisfying `IndexedAccessCondition`: the condition itself, plus its own
`.filter(predicate)`, which builds a NEW condition carrying both halves
without touching the one the rule already holds. The bare `filter` on `q`
builds a filter-only condition directly, with no index half at all.
`readAccessCondition` is the counterpart to `readIndexConstraints`: called by
the framework on whatever a rule's `constraints` callback returned,
`undefined` for a value this module did not build. The trailing
`export type { IndexedAccessCondition }` re-exports the type so it travels
alongside its reader.

#### `packages/core/src/access/createAccessQueryBuilder.test.ts`

On disk, and green. `withIndex` carries the chosen index name and the range
the callback built, in call order, and leaves `filter` absent; the bare
`.filter` carries the predicate tree — including nested combinators — and
leaves `index` absent. Chaining `.filter` off `withIndex`'s return carries
BOTH halves, Convex's own `.withIndex(range).filter(expr)` shape, and does
not disturb the index-only condition the rule already held (continuing
produces a new condition, never a mutation of the old one). Only the value
actually returned counts: a chain built and discarded off `q` contributes
nothing even when a *different* chain off that same `q` is what gets
returned, and a constraint built and discarded INSIDE a range callback is
dropped in favor of whatever that callback actually returned. Two builders
never share state, and `readAccessCondition` on a value this module did not
build — a plain `{}` — returns `undefined` rather than throwing.

```ts
import { describe, expect, it } from "vitest";
import { createAccessQueryBuilder, readAccessCondition } from "./createAccessQueryBuilder";

type PagesDoc = { authorId: string; categoryId: string; score: number; archived: boolean };
type PagesIndexes = {
  by_author: readonly ["authorId"];
  by_author_category: readonly ["authorId", "categoryId"];
};

/** A fresh `q`, as a rule receives it on a query action. */
const q = () => createAccessQueryBuilder<PagesDoc, PagesIndexes>();

describe("createAccessQueryBuilder — withIndex", () => {
  it("carries the index name and the range the callback built", () => {
    const condition = readAccessCondition<PagesDoc>(
      q().withIndex("by_author_category", (ix) =>
        ix.eq("authorId", "u1").eq("categoryId", "news"),
      ),
    );
    expect(condition).toEqual({
      index: {
        name: "by_author_category",
        constraints: [
          { field: "authorId", op: "eq", value: "u1" },
          { field: "categoryId", op: "eq", value: "news" },
        ],
      },
    });
  });

  it("leaves the filter half absent when only an index was used", () => {
    const condition = readAccessCondition<PagesDoc>(
      q().withIndex("by_author", (ix) => ix.eq("authorId", "u1")),
    );
    expect(condition?.filter).toBeUndefined();
  });
});

describe("createAccessQueryBuilder — filter", () => {
  it("carries the predicate tree when no index was used", () => {
    const condition = readAccessCondition<PagesDoc>(q().filter((f) => f.neq("archived", true)));
    expect(condition).toEqual({
      filter: { kind: "compare", field: "archived", op: "neq", value: true },
    });
  });

  it("preserves combinator nesting", () => {
    const condition = readAccessCondition<PagesDoc>(
      q().filter((f) => f.and(f.eq("authorId", "u1"), f.or(f.gte("score", 5), f.neq("archived", true)))),
    );
    expect(condition?.filter).toEqual({
      kind: "and",
      nodes: [
        { kind: "compare", field: "authorId", op: "eq", value: "u1" },
        {
          kind: "or",
          nodes: [
            { kind: "compare", field: "score", op: "gte", value: 5 },
            { kind: "compare", field: "archived", op: "neq", value: true },
          ],
        },
      ],
    });
  });

  it("leaves the index half absent when only a filter was used", () => {
    const condition = readAccessCondition<PagesDoc>(q().filter((f) => f.eq("authorId", "u1")));
    expect(condition?.index).toBeUndefined();
  });
});

describe("createAccessQueryBuilder — index AND filter together", () => {
  it("carries both halves — Convex's .withIndex(range).filter(expr) shape", () => {
    const condition = readAccessCondition<PagesDoc>(
      q()
        .withIndex("by_author", (ix) => ix.eq("authorId", "u1"))
        .filter((f) => f.neq("archived", true)),
    );
    expect(condition).toEqual({
      index: { name: "by_author", constraints: [{ field: "authorId", op: "eq", value: "u1" }] },
      filter: { kind: "compare", field: "archived", op: "neq", value: true },
    });
  });

  it("does not disturb the index-only value the rule already held", () => {
    const indexed = q().withIndex("by_author", (ix) => ix.eq("authorId", "u1"));
    indexed.filter((f) => f.neq("archived", true));
    // Continuing produced a NEW condition; `indexed` is still index-only.
    expect(readAccessCondition<PagesDoc>(indexed)?.filter).toBeUndefined();
  });
});

describe("createAccessQueryBuilder — only the returned value counts", () => {
  it("ignores a chain the rule built and discarded", () => {
    const builder = q();
    // Dead code: built, never returned.
    builder.withIndex("by_author", (ix) => ix.eq("authorId", "u1"));
    builder.filter((f) => f.neq("archived", true));
    // The rule returns a different condition entirely.
    const condition = readAccessCondition<PagesDoc>(builder.filter((f) => f.eq("categoryId", "news")));
    expect(condition).toEqual({
      filter: { kind: "compare", field: "categoryId", op: "eq", value: "news" },
    });
  });

  it("ignores an inner chain the range callback built and discarded", () => {
    const condition = readAccessCondition<PagesDoc>(
      q().withIndex("by_author_category", (ix) => {
        ix.eq("authorId", "discarded");
        return ix.eq("authorId", "kept");
      }),
    );
    expect(condition?.index?.constraints).toEqual([
      { field: "authorId", op: "eq", value: "kept" },
    ]);
  });

  it("keeps two builders independent", () => {
    const a = readAccessCondition<PagesDoc>(q().filter((f) => f.eq("authorId", "u1")));
    const b = readAccessCondition<PagesDoc>(
      q().withIndex("by_author", (ix) => ix.eq("authorId", "u2")),
    );
    expect(a?.index).toBeUndefined();
    expect(b?.filter).toBeUndefined();
    expect(b?.index?.name).toBe("by_author");
  });
});

describe("readAccessCondition — foreign values", () => {
  it("returns undefined for a value this module did not build", () => {
    expect(readAccessCondition({} as never)).toBeUndefined();
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 4 — Rule shape `[dev]` — [x] DONE

Why: The public API change. Later steps branch on which form a rule used.

This is now a record of what shipped, not a plan — the rule shape collapsed
further than the version this step originally described, and rev 5 then
reshaped `q` itself on top of that. There is **no** `withIndex` property
anywhere on a check, no two-branch union, no `IndexedConstraintCheck` /
`UnindexedConstraintCheck` pair. Every action gets **one** object shape,
`{ constraints, filter? }` ({@link ConstrainedPermissionCheck} below); which
algebra `constraints`' `q` offers — a predicate-only builder (one method,
`.filter((f) => …)`) or that builder plus `.withIndex(name, (ix) => …)` — is a
type parameter (`TQ`), resolved per action, never a member of a union (DD 18).
`q` itself no longer carries the flat comparison methods (`eq`/`neq`/`gt`/…)
directly — rev 5 moved those one level down, onto `f`/`ix`, the builders `q`'s
own two methods hand to their own callbacks, mirroring Convex's own
`.withIndex(name, (q) => …).filter((q) => …)` shape one layer up (DD 22, DD 23).

`AccessIndex` and its deprecated `IndexedPermissionCheck` partner (the
`{ filter, withIndex: AccessIndex }` pair) are gone from the file already —
**not** "kept until Step 13," which is what the original version of this note
said and is now simply wrong. `resolveAccessRule` (Step 7) could not be
written against two check shapes — the deprecated pair and the
constraint-builder object — at once, so Step 7 pulled both deletions forward
from their originally planned Step 13 target (DD 11). `types.ts` on disk today
declares no `AccessIndex`, no `IndexedPermissionCheck`, and no `TIndexName`
type parameter anywhere; `PermissionCheck`'s union below is two members, not
three.

- [x] `packages/core/src/access/types.ts` — **shipped shape.** `q`'s type is
      what gates index pushdown per action, not an object-shape branch (DD 14):
      `ConstraintsCallbackProps<TData, TUser, TOrg, TQ>` carries `q: TQ`, and
      `PermissionCheck` (query-shaped actions) instantiates
      `ConstrainedPermissionCheck`'s `TQ` with `AccessQueryBuilder<TData,
      TIndexFields>`, while `AnyActionPermissionCheck` (every other action)
      instantiates it with `AccessPredicateBuilder<TData>` — also `TQ`'s
      default, so a check written with no fourth argument at all is a
      non-query check by default. A mutation's `q` simply has no `withIndex`
      method — `q.withIndex(…)` on a `create` is a missing-method error at the
      exact call, not a whole-object shape rejection (DD 14). The
      `constraints` callback itself returns `boolean | AccessConditionResult`,
      never `ConstraintResult` — that name now marks a completed expression
      inside `f`'s or `ix`'s own callback, not what a rule's top-level
      `constraints` function hands back (DD 24).
- [x] `packages/core/src/access/types.ts` — `SubjectEntry` gained `indexFields:
      Record<string, readonly string[]>` (name → field tuple, in declaration
      order); `{}` for custom resources and admin subjects. `SubjectMap` emits
      it via a new `ExtractIndexFields<T>` helper, backed by the registry's
      `IndexFieldsBySlug` (Step 1) with a fixed-length-tuple pre-generation
      fallback, `PreGenerationIndexFields`. `RolePermissions`' per-action
      branch threads `TSubjects[S]["indexFields"]` through to `PermissionCheck`
      alongside the existing `indexes` union — this is the reopening the design
      note below explains.
- [x] `packages/core/src/access/types.ts` — **correction to the original
      plan:** `CustomResourceInput` did **not** gain a `queryActions` field.
      `SubjectMap`'s custom branch keeps `indexes: never` / `indexFields: {}`
      unconditionally (no table to index, so `q.withIndex` has zero keys to
      resolve against — vacuously uncallable rather than type-rejected), but
      its `action` union is whatever the caller declared in
      `actions: readonly string[]`. `RolePermissions` gates the query-shaped
      tier purely on `A extends QueryAction` — so a custom resource that
      happens to declare an action literally named `"read"` or `"readDrafts"`
      gets the full `PermissionCheck` (including `q.withIndex`, which is then
      simply uncallable) the same way a collection subject does, with no
      separate per-resource opt-in.
- [x] `packages/core/src/access/types.test.ts` — two `describe` blocks (below):
      the constraint-builder object form accepted on every action, written
      against the two-callback shape (`q.filter((f) => …)` /
      `q.withIndex(name, (ix) => …)`); `q.withIndex` accepted on `read`,
      type- and runtime-rejected on `create`/`update`; an operator that exists
      only on `f`, forced past `ix` via `@ts-expect-error`, throws
      `VexAccessConfigError` from `defineAccess`'s recording pass (the
      callback runs at module load — see Step 6); a bare `filter`-only object
      rejected. The `describe("PermissionCheck — indexed object form", …)`
      block that used to precede these two is gone from the file, not merely
      "untouched" — Step 7's pulled-forward deletion of `AccessIndex` /
      `IndexedPermissionCheck` took that block's own suite with it, and a
      one-line comment recording why sits in its place (quoted below). That
      removal is Step 7's doing, noted here only because it lands in the same
      file this bullet describes.

#### packages/core/src/access/types.ts

**Why `constraints` is reachable only through `{ constraints, filter? }`,
never as a second bare alternative** (unchanged from the original design,
confirmed by the shipped code). `hasPermission.test.ts` and
`apps/www/src/auth/permissions.ts` already bind a bare callback straight to a
query action (`read: ({ data, user }) => …`) — that is `BasePermissionCheck`'s
own function member, already part of the union. Adding `ConstraintsCallback`
as a second, differently-shaped function alternative at that same slot
reproduces the exact failure the "one signature" rule exists to prevent:
verified against `tsc` that the moment a second, differently-shaped function
type joins one property's union, **every** bare callback assigned there — old
call sites included — loses its parameter types to `any`, not just the new
one. Nesting `constraints` inside its own object property keeps both forms
sound at once and costs nothing: `{ constraints: fn }` (with `filter`
omitted) is exactly as terse as a bare callback would have been. This is DD 5
in the design log, and it is why `ConstraintsCallback` — quoted below — states
it as "ONE signature returning `boolean | AccessConditionResult`, never a
union of two function types" (the shipped doc comment on that type still says
`ConstraintResult` here — see the doc-rot note at the end of this
subsection).

`filter` stays optional, additive, and never a substitute for `constraints`:
a rule that declares only `constraints` is already checked per-document too,
via `accessConstraintsToPredicate` inside `hasPermission` (Step 10). A bare
`filter`-only object is rejected — a callback with no descriptor cannot
narrow a query, so a rule that wants only a per-document check is written as
a bare callback and accepts the full scan knowingly, the same posture
`IndexedPermissionCheck`'s bare-`withIndex` rejection always had, with the
required/optional roles of the two properties swapped.

**Correction to the original design note on positional field order.** The
original text here argued positional safety for one specific declared index
was out of reach "without reopening" `SubjectEntry` / `RolePermissions` —
because, at the time, "nothing in the new shape names an index
(`RolePermissions`/`SubjectEntry` are kept exactly as they are — no slug or
field-tuple map reaches `PermissionCheck`)." That premise no longer holds:
**this revision reopens exactly those two files**, and doing so is what buys
compile-time field order. `SubjectEntry` gained `indexFields: Record<string,
readonly string[]>`; `SubjectMap` emits it via `ExtractIndexFields<T>`;
`RolePermissions`' per-action branch threads it into `PermissionCheck`'s
`TIndexFields` parameter (DD 20). `AccessQueryBuilder.withIndex<N>(name: N,
range)` then resolves `TIndexFields[N]` — that one index's real field tuple —
because `N` is the METHOD's own type parameter, so the literal at the call
site binds it, not a type parameter fixed once for the whole check object.
That is what makes `q.withIndex("by_author_category", (ix) =>
ix.eq("categoryId", "news"))` (field 1 before field 0) a compile error where
nothing in the old shape could see it.

The three alternative encodings the original note tried and rejected remain
rejected, for the reasons already given — reopening `SubjectEntry` did not
change any of them, because the failure was never about which files were
open, it was about where in `PermissionCheck` the index identity lived:

- A plain `TFieldKeys[]` — a non-tuple array's `.length` is the type
  `number`, so `NextConstraintBuilder`'s `PlusOne<N> extends
  TFields["length"]` termination check is satisfied immediately and the chain
  always ends after the first call.
- A union of the resource's declared index tuples fed into **one**
  `ConstraintBuilder` instantiation — collapses `.length` to a
  numeric-literal union, which the same termination check treats as
  already-satisfied the instant the *shortest* candidate tuple is spent.
- A union of *separately instantiated* `ConstraintBuilder`s, one per declared
  index — loses the `eq`/`gt`/… methods entirely the moment any candidate
  reaches its terminal `ConstraintResult`, because a method must exist on
  every union member to be callable at all.

None of this was a modeling mistake — Convex's own `IndexRangeBuilder` has
the identical requirement (a literal-length field tuple), which is exactly
why `find`'s `withIndex` always binds to one concrete, named index. What
changed is *where* the index name is bound: not as a `PermissionCheck`-level
type parameter fixed for the whole check (which is what all three failed
encodings, and `ConstraintFieldSlots`, tried to do), but as `withIndex`'s own
call-site literal, resolved fresh each call against `SubjectEntry.indexFields`
(DD 19, DD 6). **`ConstraintFieldSlots` — the fixed-length, repeated-field-key
tuple, its eight-slot ceiling, and its "cannot enforce field order" caveat —
is deleted.** `validateAccessConstraints` (Step 6) is now a genuine backstop
for constraints built by hand, assembled from data, or forced through
`as any` — the cases types cannot see — rather than the primary field-order
check.

**1 — constraint-type imports.** `types.ts` imports from `./constraintTypes`:

```ts
import type {
  AccessConditionResult,
  AccessPredicateBuilder,
  AccessQueryBuilder,
} from "./constraintTypes";
```

Neither `ConstraintResult` nor `FilterConstraintBuilder` is imported directly
by this file anymore — `types.ts` never names the flat algebra itself, only
the two builders `f`/`ix` live inside (`AccessPredicateBuilder`,
`AccessQueryBuilder`) and the completed-condition terminal
(`AccessConditionResult`) their own methods return.

**2 — the constraint-builder callback types, parameterized on `TQ`.** These
sit directly after `QueryIndex` in the file — there is no
`IndexedPermissionCheck` left for them to follow:

```ts
/**
 * Props for a rule's `constraints` callback: the caller, optionally the
 * organization, and `q` — the builder the rule records onto. No `data`:
 * constraints run once per query, before any document is read (contrast
 * {@link PermissionCallbackProps}, which the sibling `filter` property uses).
 *
 * `q`'s TYPE is what gates index pushdown per action (DD 14). A query-shaped
 * action gets an {@link AccessQueryBuilder} — the filter algebra plus
 * `withIndex`; every other action gets a bare {@link FilterConstraintBuilder},
 * so `q.withIndex` is simply absent where there is no query to narrow. One
 * property, two builder types, and nothing to discriminate at the object level.
 *
 * @typeParam TData - Document type constraints are typed against.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape; `never` if not configured.
 * @typeParam TQ - The builder for this action: `AccessQueryBuilder` on query
 *   actions, `FilterConstraintBuilder` on mutations.
 */
export type ConstraintsCallbackProps<
  TData = unknown,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
  TQ = AccessPredicateBuilder<TData>,
> = {
  user: TUser;
  q: TQ;
} & ([TOrg] extends [never] ? unknown : { organization: TOrg });

/**
 * A rule's constraint-recording callback.
 *
 * ONE signature returning `boolean | ConstraintResult`, never a union of two
 * function types: verified against `tsc` that a union of differently-shaped
 * callbacks breaks contextual typing of the destructured `props` — every
 * parameter infers `any` instead of TypeScript picking a member. `boolean` is
 * primitive and `ConstraintResult` is nominal, so discriminating the RESULT at
 * runtime (`typeof result === "boolean"`) stays unambiguous.
 *
 * @typeParam TData - Document type constraints are typed against.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape; `never` if not configured.
 * @typeParam TQ - The builder for this action.
 */
export type ConstraintsCallback<
  TData = unknown,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
  TQ = AccessPredicateBuilder<TData>,
> = (props: ConstraintsCallbackProps<TData, TUser, TOrg, TQ>) => boolean | AccessConditionResult;

/**
 * The constraint-builder object form of a permission check — ONE shape for every
 * action.
 *
 * `constraints` narrows what gets read: compiled to a `withIndex` range when the
 * rule called `q.withIndex(…)`, otherwise to a `.filter()` expression, and in
 * either case interpreted per-document as a JS predicate
 * (`compileConstraints`). `filter` is an OPTIONAL additional per-document check
 * for what constraints cannot express — array membership, string operations,
 * cross-table reads, all outside `FilterBuilder`'s surface, so they stay
 * callbacks permanently.
 *
 * `filter` augments `constraints`; it never replaces it. A rule that declares
 * only `constraints` is already checked per-document too, via
 * `constraintsToPredicate` in `hasPermission`. A bare `filter`-only shape is
 * therefore rejected — a callback with no descriptor cannot narrow a query, so
 * write it as a bare callback instead and accept the full scan knowingly.
 *
 * Index pushdown is opted into INSIDE the callback
 * ({@link AccessQueryBuilder.withIndex}), not by a sibling property. That is
 * what lets `q` bind to one index's real field tuple and check field ORDER at
 * compile time; a sibling property cannot be seen by its neighbour's callback
 * type.
 *
 * @typeParam TData - Document type for the subject.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape; `never` if not configured.
 * @typeParam TFieldKeys - Union of valid field keys for this subject.
 * @typeParam TQ - The builder for this action.
 */
export interface ConstrainedPermissionCheck<
  TData = unknown,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
  TFieldKeys extends string = string,
  TQ = AccessPredicateBuilder<TData>,
> {
  /** Narrows what gets read. Required — see the type doc. */
  constraints: ConstraintsCallback<TData, TUser, TOrg, TQ>;
  /** Optional per-document check augmenting `constraints`. Never a substitute. */
  filter?: BasePermissionCheck<TData, TUser, TOrg, TFieldKeys>;
}
```

`TFieldKeys` survives here only for the `filter` leaf's
`BasePermissionCheck<TData, TUser, TOrg, TFieldKeys>` — it no longer shapes
`q` (that was `ConstraintFieldSlots`'s job, and it is deleted). DD 17's
original rationale for keeping `TFieldKeys` — that `ConstraintFieldSlots`
needed it — no longer applies; the generic is now vestigial outside the
field-mode types and this one leaf, which is exactly what makes it a Step 14
cleanup rather than something this step needs to touch.

**3 — `AnyActionPermissionCheck`, the non-query-action tier.** New relative
to the original plan — it did not exist before this shape landed. Sits after
`ConstrainedPermissionCheck`:

```ts
/**
 * Every check shape valid on **any** action, query-shaped or not: the plain leaf
 * shapes plus the constraint-builder object form (DD 14).
 *
 * This is the tier `RolePermissions` hands a non-query action. The only thing a
 * query-shaped action adds on top is {@link IndexedPermissionCheck}'s `withIndex`
 * hint — see {@link PermissionCheck}, which is exactly this union plus that.
 *
 * **Why `ConstrainedPermissionCheck` sits here rather than inside
 * {@link BasePermissionCheck}.** Both are now valid on every action, so folding
 * them looks tempting. It cannot be done: `BasePermissionCheck` is also the type of
 * the `filter` property *inside* both object forms, so folding the composite into
 * it makes `filter` able to hold another whole constrained check —
 * `{ constraints, filter: { constraints, filter: … } }` — an infinite regress the
 * compiler accepts and `hasPermission`'s resolver has no meaning for. `filter` is
 * the per-document escape hatch for what constraints cannot express; a constraints
 * object is not a leaf check. "Base" stays the irreducible shapes — a value or a
 * function — and the composites point at it, never the other way round.
 *
 * @typeParam TData - Document type for the subject.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape; `never` if not configured.
 * @typeParam TFieldKeys - Union of valid field keys for this subject.
 */
export type AnyActionPermissionCheck<
  TData = unknown,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
  TFieldKeys extends string = string,
> =
  | BasePermissionCheck<TData, TUser, TOrg, TFieldKeys>
  | ConstrainedPermissionCheck<
      TData,
      TUser,
      TOrg,
      TFieldKeys,
      AccessPredicateBuilder<TData>
    >;
```

**4 — `PermissionCheck`'s union.** Two members, not three — `TIndexName` and
the deprecated `IndexedPermissionCheck` arm are both already gone (Step 7):

```ts
/**
 * A single permission check on a **query-shaped** action: the plain leaf shapes,
 * the constraint form with `q` upgraded to an {@link AccessQueryBuilder} so
 * `q.withIndex(…)` is available, and the deprecated `{ filter, withIndex }` pair.
 *
 * The ONLY difference from {@link AnyActionPermissionCheck} is `q`'s type (plus the
 * deprecated member). Index pushdown is gated by giving a query action a builder
 * that HAS `withIndex` and a mutation one that does not — so writing
 * `q.withIndex(…)` on a create is a missing-method error at the exact call, rather
 * than a whole-object shape rejection pointing at the wrong line (DD 14).
 *
 * A callback returning `undefined` is treated as deny.
 *
 * @typeParam TData - Document type for the subject.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape; `never` if not configured.
 * @typeParam TFieldKeys - Union of valid field keys for this subject.
 * @typeParam TIndexFields - The resource's index name → field tuple map, which
 *   `q.withIndex` resolves against.
 */
export type PermissionCheck<
  TData = unknown,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
  TFieldKeys extends string = string,
  TIndexFields extends Record<string, readonly string[]> = Record<string, readonly string[]>,
> =
  | BasePermissionCheck<TData, TUser, TOrg, TFieldKeys>
  | ConstrainedPermissionCheck<
      TData,
      TUser,
      TOrg,
      TFieldKeys,
      AccessQueryBuilder<TData, TIndexFields>
    >;
```

**5 — `SubjectEntry` gains `indexFields`.**

```ts
/**
 * One entry in the subject registry: the action union, the data shape passed
 * to callbacks, and the field-key union for field-level checks.
 */
export interface SubjectEntry {
  /** Union of actions this subject supports. */
  action: string;
  /** Document/context type; `never` for subjects without data. */
  data: unknown;
  /** Union of field keys; `never` for non-field-aware subjects. */
  fields: string;
  /** Union of access-index names declared on this resource; `never` for non-indexable subjects. */
  indexes: string;
  /**
   * The resource's declared indexes as name → field tuple, in declaration order.
   * `{}` for subjects with no table to index (custom resources, admin subjects),
   * which makes `q.withIndex` uncallable there rather than absent.
   *
   * Carries TUPLES, not just the names in `indexes`, because
   * {@link AccessQueryBuilder.withIndex} binds `q` to one index's real field order
   * — that is what makes positional constraint typing reachable.
   */
  indexFields: Record<string, readonly string[]>;
}
```

**6 — `ExtractIndexFields` and its pre-generation fallback.** `@internal`
helpers `SubjectMap` reads from:

```ts
/**
 * The declared-index field-tuple map for a resource config's slug — the shape
 * {@link AccessQueryBuilder.withIndex} resolves against. `{}` pre-generation, so
 * `withIndex` accepts nothing rather than accepting anything. @internal
 */
type ExtractIndexFields<T> = T extends { slug: infer S extends string }
  ? S extends keyof IndexFieldsBySlug
    ? IndexFieldsBySlug[S]
    : PreGenerationIndexFields
  : PreGenerationIndexFields;

/**
 * Pre-generation fallback for {@link ExtractIndexFields}: any index name, and a
 * FIXED-LENGTH tuple of eight `string` slots per index.
 *
 * The length matters more than it looks. `ConstraintBuilder` terminates its chain
 * on `PlusOne<N> extends TFields["length"]`, and a plain `readonly string[]` has
 * `length: number` — which that test treats as already satisfied, so the chain would
 * end after ONE constraint. A fixed-length tuple keeps `length` a numeric literal,
 * so chaining behaves the same before and after `vex generate`; only field NAMES and
 * per-field value types widen. Eight comfortably exceeds any realistic compound
 * index. @internal
 */
type PreGenerationIndexFields = Record<
  string,
  readonly [string, string, string, string, string, string, string, string]
>;
```

This is the same trap `ConstraintValue<TDoc, F>` / `ConstraintField<TDoc>`
(`constraintTypes.ts`) guard against for an unresolved `TDoc`: degrading to
`unknown`/`string` keeps every method callable pre-`vex generate`, where
degrading to `never` would make no constraint writable at all.
`PreGenerationIndexFields` is the same idea applied to `.length` instead of
to a value type.

**7 — `SubjectMap` emits `indexFields` for every branch.**

```ts
export type SubjectMap<
  TResources extends readonly AccessResource[] = AccessResource[],
  TCustom extends Record<string, CustomResourceInput> = Record<string, CustomResourceInput>,
> = {
  [R in TResources[number] as ExtractSlug<R>]: {
    action: CrudAction | (HasDrafts<R> extends true ? DraftAction : never);
    data: InferDocType<R>;
    fields: ExtractFieldKeys<R>;
    indexes: ExtractIndexNames<R>;
    indexFields: ExtractIndexFields<R>;
  };
} & {
  [K in keyof TCustom]: {
    action: TCustom[K]["actions"][number];
    data: TCustom[K]["data"] extends DataTypeCarrier<infer D> ? D : never;
    fields: never;
    indexes: never;
    indexFields: {};
  };
} & {
  [K in AdminCustomSubjectSlug]: {
    action: (typeof ADMIN_CUSTOM_SUBJECTS)[K]["actions"][number];
    data: never;
    fields: never;
    indexes: never;
    indexFields: {};
  };
};
```

`CustomResourceInput` itself is unchanged — one canonical shape, no
`queryActions`:

```ts
export type CustomResourceInput = {
  actions: readonly string[];
  data?: DataTypeCarrier<unknown>;
};
```

**8 — `RolePermissions`' per-action branch threads `indexFields` through.**
This is the reopening the design note above refers to — the only change to
`RolePermissions` itself is the extra generic argument on the query-action
arm:

```ts
/**
 * Per-role permission matrix, typed against the resolved {@link SubjectMap}.
 *
 * Each subject key accepts `boolean` (all actions) or a per-action map whose
 * keys are that subject's action union plus the action-level wildcard
 * ({@link WILDCARD_KEY}).
 *
 * **Only `withIndex` is gated on {@link QueryAction}** (DD 14). A query-shaped
 * action gets the full {@link PermissionCheck}, including
 * {@link IndexedPermissionCheck}'s `withIndex` hint — there is a query to narrow.
 * Every other action gets the plain shapes plus
 * {@link ConstrainedPermissionCheck}: a create/update/delete has no query to
 * narrow, but its constraints are still meaningful, interpreted per-document via
 * `constraintsToPredicate`. Restricting the object form to query actions is what
 * used to force a read+update pair to express one predicate twice — once as a
 * constraint, once as a hand-written callback — which is the dual-expression
 * footgun this design removes.
 *
 * The action-level wildcard stays plain: it spans actions of mixed shape, so a
 * constraint written there could not be typed against one document consistently.
 * The role-level wildcard is boolean-only.
 * Precedence: explicit action > subject wildcard > role wildcard > `defaults`.
 *
 * @typeParam TSubjects - The resolved {@link SubjectMap}.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape, or `never`.
 */
export type RolePermissions<
  TSubjects extends Record<string, SubjectEntry>,
  TUser = Record<string, unknown>,
  TOrg = never,
> = {
  [S in keyof TSubjects]?:
    | boolean
    | ({
        [A in TSubjects[S]["action"]]?: A extends QueryAction
          ? PermissionCheck<
              TSubjects[S]["data"],
              TUser,
              TOrg,
              TSubjects[S]["fields"],
              TSubjects[S]["indexFields"]
            >
          : AnyActionPermissionCheck<
              TSubjects[S]["data"],
              TUser,
              TOrg,
              TSubjects[S]["fields"]
            >;
      } & {
        [W in typeof WILDCARD_KEY]?: BasePermissionCheck<
          TSubjects[S]["data"],
          TUser,
          TOrg,
          TSubjects[S]["fields"]
        >;
      });
} & {
  /** Role-level wildcard: covers subjects this role never declares. Boolean only. */
  [W in typeof WILDCARD_KEY]?: boolean;
};
```

Note `PermissionCheck`'s query-action instantiation above passes five
arguments, not six — `TSubjects[S]["indexes"]` (the old `TIndexName` slot) is
gone along with the type parameter it used to fill; only `indexFields` is
threaded through now.

`A extends QueryAction` — not a per-resource `queryActions` declaration — is
the entire gate: any action literally named `"read"` or `"readDrafts"`
(`QUERY_ACTIONS`, `constants.ts`) gets `PermissionCheck`; everything else gets
`AnyActionPermissionCheck`. This applies identically to collection subjects
and custom resources, which is why custom resources needed no new input
field to participate.

**Known doc rot in this file, flagged rather than silently "corrected" above.**
Every code block quoted in this subsection is copied verbatim from
`types.ts` as it stands on disk, including several doc comments that no
longer match the code they sit on — leftovers from Step 7's pulled-forward
deletion of `AccessIndex` / `IndexedPermissionCheck` and from this step's own
later `TQ`-default change (`FilterConstraintBuilder` → `AccessPredicateBuilder`)
that never got a matching doc-comment pass. None of these are proposed fixes;
they are what actually ships today, called out so this spec doesn't imply a
cleanup that hasn't happened:

- `BasePermissionCheck`'s doc — "No `withIndex` — see
  `{@link IndexedPermissionCheck}` for the object form" — points at a deleted
  type; should say `{@link ConstrainedPermissionCheck}`.
- `ConstraintsCallbackProps`'s doc — "every other action gets a bare
  `{@link FilterConstraintBuilder}`" and its `@typeParam TQ` line — both still
  name `FilterConstraintBuilder`, but the actual default (and what a mutation
  action's `q` really is) is `AccessPredicateBuilder<TData>`.
- `ConstraintsCallback`'s doc — "ONE signature returning `boolean |
  ConstraintResult`" and "`ConstraintResult` is nominal" — the type's real
  return is `boolean | AccessConditionResult`; `ConstraintResult` is a
  different, narrower terminal now (DD 24).
- `AnyActionPermissionCheck`'s doc — "The only thing a query-shaped action
  adds on top is `{@link IndexedPermissionCheck}`'s `withIndex` hint" — that
  type is gone; the real remaining difference is `q`'s type
  (`AccessPredicateBuilder` vs `AccessQueryBuilder`), which `PermissionCheck`'s
  doc below also gets wrong the same way.
- `PermissionCheck`'s doc — "the deprecated `{ filter, withIndex }` pair" and
  "(plus the deprecated member)" — the union below has two members, not
  three; there is no deprecated member left to add.
- `RolePermissions`'s doc — "including `{@link IndexedPermissionCheck}`'s
  `withIndex` hint" — same dangling reference, same fix.

Six spots, one root cause (a type deletion whose doc comments weren't swept
along with it), left for whichever step next does a documentation pass on
this file rather than patched here — this section's job is to describe the
shipped *types*, and the quotes above are exact.

#### packages/core/src/access/types.test.ts

Two `describe` blocks now sit where a third one used to come first —
`describe("PermissionCheck — indexed object form", …)`, the deprecated
`{ filter, withIndex: AccessIndex }` pair's own suite. That block is gone
outright, not merely untouched: Step 7 deleted `AccessIndex` and
`IndexedPermissionCheck` ahead of its originally planned Step 13 slot, and
the suite testing them went with the types. In its place, immediately above
the two surviving blocks, sits a comment recording why — quoted verbatim,
including its own reference to the single-argument `q.withIndex(name)` call
rev 4 used, which is itself now one call form behind the shipped
`q.withIndex(name, (ix) => …)` shape (another small, unfixed doc-comment
lag, same kind as the six above):

```ts
// The former `describe("PermissionCheck — indexed object form")` block is gone with
// the shape it tested: `AccessIndex` and the deprecated `{ filter, withIndex }` pair
// were deleted early (Step 13's type work, pulled forward) because `resolveAccessRule`
// could not be written against two shapes at once. Its replacements live in the
// constraint-builder block below — `q.withIndex(name)` inside the callback.
```

The two surviving blocks themselves:

```ts
describe("PermissionCheck — constraint builder object form", () => {
  it("accepts { constraints, filter? } on a query-shaped action (read)", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            read: {
              constraints: ({ user, q }) =>
                typeof user === "object" && user !== null && "_id" in user
                  ? q.filter((f) => f.eq("authorId", user._id))
                  : false,
              filter: ({ data, user }: { data: unknown; user: unknown }) =>
                typeof data === "object" &&
                data !== null &&
                "authorId" in data &&
                typeof user === "object" &&
                user !== null &&
                "_id" in user
                  ? data.authorId === user._id
                  : false,
            },
          },
        },
      },
    });
  });

  it("accepts constraints without filter — filter is optional", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            read: {
              constraints: ({ q }) => q.filter((f) => f.eq("authorId", "u1")),
            },
          },
        },
      },
    });
  });

  it("accepts unindexed constraints on create — the object form is valid on every action (DD 14)", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            create: {
              constraints: ({ q }) => q.filter((f) => f.eq("authorId", "u1")),
            },
          },
        },
      },
    });
  });

  it("accepts unindexed constraints on update — replaces the old read+update duplication", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            update: {
              constraints: ({ q }) => q.filter((f) => f.eq("authorId", "u1")),
            },
          },
        },
      },
    });
  });

  it("accepts unindexed constraints on delete", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            delete: {
              constraints: ({ q }) => q.filter((f) => f.eq("authorId", "u1")),
            },
          },
        },
      },
    });
  });

  it("accepts q.withIndex on read — index pushdown is opted into inside the callback", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            read: {
              constraints: ({ q }) => q.withIndex("by_author", (ix) => ix.eq("authorId", "u1")),
            },
          },
        },
      },
    });
  });

  it("rejects a filter-only operator after q.withIndex, and surfaces a config error if forced through", () => {
    // Two layers, both asserted. The type rejects `neq` inside the range callback;
    // and because `defineAccess` RUNS the callback to record it, a caller who forced
    // this through still gets a `VexAccessConfigError` naming the rule rather than
    // a bare `TypeError` from the missing method.
    expect(() =>
      defineAccess({
        ...baseInput,
        permissions: {
          admin: { [WILDCARD_KEY]: true },
          contributor: {
            pages: {
              read: {
                // @ts-expect-error — `neq` exists only on `f`; inside `withIndex`'s range callback, `ix` is positional
                constraints: ({ q }) => q.withIndex("by_author", (ix) => ix.neq("authorId", "u1")),
              },
            },
          },
        },
      }),
    ).toThrow(VexAccessConfigError);
  });

  // NOTE: an unknown index NAME is not rejected here. `IndexFieldsBySlug` is
  // unaugmented in core's own suite (see the file header), so `q.withIndex` accepts
  // any name and each index resolves to eight `string` slots. Name and per-field
  // value checking bite after `vex generate`; `defineAccess`'s runtime validator
  // catches a bad name either way, against the resource's REAL declared indexes.

  it("rejects q.withIndex on create — no query exists to narrow (DD 14)", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            create: {
              // @ts-expect-error — a mutation action's `q` is the predicate-only builder; it has no `withIndex`
              constraints: ({ q }) => q.withIndex("by_author", (ix) => ix.eq("authorId", "u1")),
            },
          },
        },
      },
    });
  });

  it("rejects q.withIndex on update — the error lands on the call, not the object", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            update: {
              // @ts-expect-error — a mutation action's `q` is the predicate-only builder; it has no `withIndex`
              constraints: ({ q }) => q.withIndex("by_author", (ix) => ix.eq("authorId", "u1")),
            },
          },
        },
      },
    });
  });

  it("still accepts the flat algebra on a mutation action", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            update: { constraints: ({ q }) => q.filter((f) => f.neq("authorId", "u1")) },
          },
        },
      },
    });
  });

  it("rejects filter without constraints — constraints is required, filter is not a substitute (inverts the old withIndex/filter rule)", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            // @ts-expect-error — `constraints` is required; a bare `filter`-only object is not a valid shape
            read: {
              filter: ({ data }: { data: unknown }) =>
                typeof data === "object" && data !== null && "authorId" in data,
            },
          },
        },
      },
    });
  });
});

describe("PermissionCheck — bare filter callback stays valid alongside constraints", () => {
  it("still accepts a bare callback on read — the new constraints form did not disturb it", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            read: ({ data, user }: { data: unknown; user: unknown }) =>
              typeof data === "object" &&
              data !== null &&
              "authorId" in data &&
              typeof user === "object" &&
              user !== null &&
              "_id" in user
                ? data.authorId === user._id
                : false,
          },
        },
      },
    });
  });

  it("still accepts a bare callback on create — non-query actions were never part of this change", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            create: ({ data }: { data: unknown }) =>
              typeof data === "object" && data !== null && "authorId" in data,
          },
        },
      },
    });
  });
});
```

The `pages` fixture these tests share (top of the file) declares a real
index — `fields: { title: text({ required: true }), authorId: text({ index:
"by_author" }) }` — deliberately: `defineAccess` validates constraint field
order against the resource's DECLARED indexes (Step 6), so a type-rejection
test naming a nonexistent index would fail for the wrong reason.

Verify: `pnpm --filter @vexcms/core test` — this file's suite is green, part
of the 611/611 passing overall now that Step 7 has landed (earlier drafts of
this note cited 607/610 with 3 failures pending Step 7; that gap is closed).

### Step 5 — Compilers `[dev]` — [x] DONE

Why: Five leaf functions across two algebras — one per recorded shape, one
per compile target. Everything downstream calls these.

`createAccessQueryBuilder`'s `AccessCondition<TDoc>` (Step 3) has two
independent halves that may combine on one condition, not a mutually
exclusive choice, and each still needed its own compiler pair: `index` — a
flat, ordered `AccessIndexConstraint<string, TDoc>[]`, present when the
rule's `constraints` callback returns an `AccessConditionResult` whose
underlying `AccessCondition` carries an `index` field — populated when the
rule calls `q.withIndex(name, range)` and the range callback's return value
is read off via `readIndexConstraints` — and `filter` — a recursive
`AccessFilterConstraint<TDoc>` tree (`kind: "compare" | "and" | "or" |
"not"`), populated when the rule's `filter(predicate)` callback runs its own
`FilterConstraintBuilder`, never `q` itself. The first three functions
below, compiling the flat list, landed first and were briefly believed to
close this step. They did not: `createFilterConstraintBuilder` and
`createAccessQueryBuilder`'s `filter` branch (Step 3, already shipped)
record the TREE shape, and nothing compiled it — `AccessFilterConstraint` had
exactly one producer (`createFilterConstraintBuilder.ts`) and one consumer
(its own test, reinterpreting the type for assertions). An unindexed rule had
no compile target at all. `accessFilterTreeToFilter` and
`accessFilterTreeToPredicate` close that gap, in the same file, and are now
implemented and green alongside the flat trio — confirmed directly (`vitest
run src/access/compileConstraints.test.ts`, 20/20 passing) while writing this
record.

- [x] `packages/core/src/access/compileConstraints.ts` — the flat-list
      compilers: `accessConstraintsToIndexRange` (→ `IndexRangeFn`),
      `accessConstraintsToFilter` (→ a `FilterBuilder` expression, `and`-ed),
      `accessConstraintsToPredicate` (→ `(doc) => boolean`), sharing
      `CONSTRAINT_COMPARATORS`.
- [x] `packages/core/src/access/compileConstraints.ts` — the filter-tree
      compilers: `FILTER_COMPARATORS` (`CONSTRAINT_COMPARATORS` plus `neq`),
      `accessFilterTreeToFilter` (→ a `FilterBuilder` expression, recursing
      `compare`/`and`/`or`/`not`), `accessFilterTreeToPredicate` (→ `(doc) =>
      boolean`, the same recursion in JS).
- [x] `packages/core/src/access/compileConstraints.test.ts` — flat targets:
      `eq`-only, mixed `eq` + bound, bound-only, boundary values (`gte`/`lte`
      include the boundary, `gt`/`lt` exclude it), a missing field treated as
      unsatisfied, predicate/filter agreement including AT the boundary, and
      the empty-list caller-contract throw. Tree targets: a nested
      `and(or(…), not(…))` shape including `neq`; empty-`and` (vacuously
      true) vs empty-`or` (false) — the two identities; predicate/filter
      agreement on the same tree.

#### packages/core/src/access/compileConstraints.ts

Two proofs of agreement, not one, because there are two independent
algebras compiling to the same two targets (`.filter()` and a JS predicate).
**Within** the flat trio, `accessConstraintsToFilter` and
`accessConstraintsToPredicate` agree by construction: both walk the same
ordered list and both dispatch on the same operator set,
`CONSTRAINT_COMPARATORS`, whose keys are `IndexOp`'s literal values — which
are themselves `FilterBuilder`'s own comparison method names, by
`IndexOp`'s derivation from Convex's `IndexRangeBuilder`
(`constraintTypes.ts`). **Within** the tree pair, `accessFilterTreeToFilter`
and `accessFilterTreeToPredicate` agree the same way: both recurse the exact
same `kind` union in the exact same order and both dispatch comparisons
through `FILTER_COMPARATORS`. That map is deliberately a *spread* of
`CONSTRAINT_COMPARATORS` plus `neq` (`{ ...CONSTRAINT_COMPARATORS, neq: … }`)
rather than a second, independently-written map — the mechanism that makes
"agree by construction" a structural guarantee rather than an aspirational
one: a shared operator like `gte` is defined in exactly one place, so the
flat and tree algebras cannot drift apart on it even by accident. There is no
single "all five agree" claim, because the flat trio and the tree pair
compile different halves of one `AccessCondition` — `index` vs `filter` —
and, per `resolveAccessConstraint`, those halves are the common case
together, not mutually exclusive: a rule that both narrows through
`.withIndex(name, range)` and adds a `.filter(expr)` populates both, and
`resolveAccessConstraint` compiles and `and`s each half through its own pair
rather than forcing a single proof across both algebras.

None of the five ever receives a `boolean` — the constraints callback's
boolean shorthand is resolved by its caller (`resolveAccessIndex`,
`hasPermission`) before a compiler is ever invoked, so every list/tree here
is already non-empty proof of a real constraint chain, or explicitly empty
(meaning "no restriction") where emptiness is representable.

**The empty-collection asymmetry is intentional, and tested on both sides.**
`accessConstraintsToFilter` throws on an empty flat list — a caller-contract
violation, since an unrestricted rule resolves to its boolean shorthand
upstream and should never reach a compile target with `[]`. The tree
compilers have no equivalent empty-tree guard, because emptiness is not
representable the same way: an `AccessCondition`'s `filter` is `undefined`
when a rule never called `.filter(...)`, not an empty node — the absence
check happens one level up, in `resolveAccessConstraint`, on
`condition.filter !== undefined` (and, symmetrically, `resolveAccessIndex`'s
`condition?.index === undefined`), before either tree compiler is ever
called. What IS representable, and does occur, is an empty `nodes` array
*inside* an `and`/`or` node — produced by calling `.and()` / `.or()` with
zero arguments on the `filter` callback's own `FilterConstraintBuilder` —
and there the two combinators keep their normal boolean identities rather
than being special-cased: an empty `and` is vacuously true (`Array#every` on
`[]`), an empty `or` is false (`Array#some` on `[]`), and the builder records
whichever the rule actually called rather than second-guessing it.

```ts
import type {
  DocumentByInfo,
  Expression,
  FilterBuilder,
  GenericDocument,
  GenericTableInfo,
  IndexRange,
} from "convex/server";
import type {
  AccessFilterConstraint,
  AccessIndexConstraint,
  FilterOp,
  IndexOp,
} from "./constraintTypes";
import type { IndexRangeFn } from "./types";

/**
 * JS-side comparator per {@link IndexOp}, used by `constraintsToPredicate`.
 * `as never` narrows past `unknown` for the ordering operators only —
 * `eq` never needs it. Exported so a caller building its own predicate logic
 * (or a future compile target) reuses the same five comparisons rather than
 * re-deriving them.
 */
export const CONSTRAINT_COMPARATORS = {
  eq: (a: unknown, b: unknown) => a === b,
  gt: (a: unknown, b: unknown) => (a as never) > (b as never),
  gte: (a: unknown, b: unknown) => (a as never) >= (b as never),
  lt: (a: unknown, b: unknown) => (a as never) < (b as never),
  lte: (a: unknown, b: unknown) => (a as never) <= (b as never),
} as const satisfies Record<IndexOp, (a: unknown, b: unknown) => boolean>;

/**
 * Compiles a recorded constraint list to a `withIndex` range function.
 *
 * @param props - Input props.
 * @param props.constraints - The rule's recorded constraints, in the order
 *   they were built. May be empty — an unrestricted range.
 * @returns A function usable directly as `find`'s `withIndex` range: applies
 *   each constraint's operator to the builder in order and returns the
 *   result as an `IndexRange`.
 */
export function accessConstraintsToIndexRange<
  TDocument extends GenericDocument = GenericDocument,
>(props: { constraints: readonly AccessIndexConstraint<string, TDocument>[] }): IndexRangeFn {
  return (q) =>
    props.constraints.reduce<unknown>(
      (builder, c) =>
        // Convex's `IndexRangeBuilder` narrows its RETURN TYPE per call, exactly as
        // `ConstraintBuilder` does — so a dynamic reduce over an untyped op string
        // needs one cast at this boundary. The static safety already happened when
        // the rule's `constraints` callback was type-checked, and again at
        // `defineAccess` time in `validateAccessConstraints`.
        (builder as Record<IndexOp, (field: string, value: unknown) => unknown>)[c.op](
          c.field,
          c.value,
        ),
      q,
      // Every `IndexRangeBuilder` structurally extends `IndexRange`, including one
      // with zero calls applied — so an empty constraint list returns `q` itself,
      // matching Convex's own "no restriction" semantics.
    ) as IndexRange;
}

/**
 * Compiles a recorded constraint list to a single `FilterBuilder` expression,
 * `and`-ing multiple constraints together.
 *
 * @param props - Input props.
 * @param props.constraints - The rule's recorded constraints, in the order
 *   they were built. Must be non-empty.
 * @param props.q - The query's own `FilterBuilder`, from `.filter((q) => …)`.
 * @returns A boolean expression usable directly as (or `and`-ed into) a
 *   `.filter()` predicate. A single constraint returns its own expression
 *   unwrapped; two or more are combined with `and`.
 * @throws {Error} When `props.constraints` is empty — a caller contract
 *   violation, not a config-authoring mistake. An unrestricted rule resolves to
 *   its boolean shorthand upstream and never reaches a compile target.
 */
export function accessConstraintsToFilter<
  TTableInfo extends GenericTableInfo,
  TDocument extends DocumentByInfo<TTableInfo> = DocumentByInfo<TTableInfo>,
>(props: {
  constraints: readonly AccessIndexConstraint<string, TDocument>[];
  q: FilterBuilder<TTableInfo>;
}): Expression<boolean> {
  // `c.op`'s literal values are `FilterBuilder`'s own method names by construction
  // (`IndexOp` derives from `IndexRangeBuilder`, whose comparison methods
  // `FilterBuilder` mirrors), so this dispatches correctly. The cast exists only
  // because the compiler cannot narrow `c.op` per array element.
  const q = props.q as unknown as Record<
    IndexOp,
    (left: unknown, right: unknown) => Expression<boolean>
  > & {
    field: (path: string) => unknown;
    and: (...exprs: Expression<boolean>[]) => Expression<boolean>;
  };

  const [first, ...rest] = props.constraints.map((c) => q[c.op](q.field(c.field), c.value));

  if (first === undefined) {
    // A caller contract violation, not a config-authoring mistake — hence a plain
    // `Error` rather than `VexAccessConfigError`. This function runs at QUERY time,
    // called by `find`/`search`; a config-error type here would misattribute a
    // framework bug to the user's `defineAccess`. An unconstrained rule resolves to
    // its boolean shorthand upstream and never reaches a compile target, so an
    // empty list means the caller skipped that resolution.
    throw new Error(
      "accessConstraintsToFilter: `constraints` must be non-empty — an unrestricted " +
        "rule is resolved to a boolean before it reaches a compile target.",
    );
  }

  // One expression stands alone: wrapping a single predicate in `and()` would add a
  // node for Convex to walk and read no differently.
  return rest.length === 0 ? first : q.and(first, ...rest);
}

/**
 * Compiles a recorded constraint list to a JS predicate, for interpreting
 * constraints against an already-fetched document (`hasPermission`,
 * client-side `usePermission`).
 *
 * The third compile target for the SAME recorded list, and it agrees with
 * `accessConstraintsToFilter` by construction: both walk the constraints in order
 * and both dispatch on the operator set {@link CONSTRAINT_COMPARATORS} defines, one
 * in JS and one as a Convex expression. `compileConstraints.test.ts` asserts that
 * agreement on a matching and a non-matching document.
 *
 * @param props - Input props.
 * @param props.constraints - The rule's recorded constraints, in the order
 *   they were built. May be empty — an unrestricted predicate.
 * @returns A function returning `true` when `doc` satisfies every constraint.
 */
export function accessConstraintsToPredicate<TDoc extends GenericDocument>(props: {
  constraints: readonly AccessIndexConstraint<string, TDoc>[];
}): (doc: TDoc) => boolean {
  // An empty constraint list yields a predicate that is vacuously true
  // (`Array#every` on an empty array), matching
  // `accessConstraintsToIndexRange`'s "no restriction" semantics for the same input.
  return (doc) =>
    props.constraints.every((c) => CONSTRAINT_COMPARATORS[c.op](doc[c.field], c.value));
}

/**
 * JS-side comparator per {@link FilterOp} — {@link CONSTRAINT_COMPARATORS} plus
 * `neq`, which `FilterBuilder` has and `IndexRangeBuilder` does not.
 *
 * Used by {@link accessFilterTreeToPredicate}. Kept as an extension of the index
 * map rather than a parallel one so the two algebras cannot drift on a shared
 * operator: change `gte` once and both compile targets follow.
 */
export const FILTER_COMPARATORS = {
  ...CONSTRAINT_COMPARATORS,
  neq: (a: unknown, b: unknown) => a !== b,
} as const satisfies Record<FilterOp, (a: unknown, b: unknown) => boolean>;

/**
 * Compiles a recorded constraint TREE to a single `FilterBuilder` expression.
 *
 * The tree counterpart of {@link accessConstraintsToFilter}: that one walks the
 * flat positional list an indexed rule records, this one walks the recursive
 * `compare`/`and`/`or`/`not` shape an unindexed rule records. Both target the
 * same `.filter()` slot.
 *
 * There is no empty-tree case to guard. A rule that recorded nothing leaves
 * `RecordedAccessConstraints.filter` as `undefined`, so absence is represented by
 * the field being missing rather than by an empty node — unlike the flat list,
 * where `[]` is representable and has to be rejected.
 *
 * @typeParam TTableInfo - Convex table info for the query being filtered.
 * @typeParam TDoc - Document shape the recorded values are typed against.
 * @param props - Input props.
 * @param props.node - Root of the recorded tree.
 * @param props.q - The query's own `FilterBuilder`, from `.filter((q) => …)`.
 * @returns A boolean expression usable directly as (or `and`-ed into) a
 *   `.filter()` predicate.
 */
export function accessFilterTreeToFilter<
  TTableInfo extends GenericTableInfo,
  TDoc extends DocumentByInfo<TTableInfo> = DocumentByInfo<TTableInfo>,
>(props: { node: AccessFilterConstraint<TDoc>; q: FilterBuilder<TTableInfo> }): Expression<boolean> {
  // `FilterOp`'s literals are `FilterBuilder`'s own comparison method names by
  // construction, and its combinators are `and`/`or`/`not`. The cast exists only
  // because the compiler cannot narrow the operator per node.
  const q = props.q as unknown as Record<
    FilterOp,
    (left: unknown, right: unknown) => Expression<boolean>
  > & {
    field: (path: string) => unknown;
    and: (...exprs: Expression<boolean>[]) => Expression<boolean>;
    or: (...exprs: Expression<boolean>[]) => Expression<boolean>;
    not: (expr: Expression<boolean>) => Expression<boolean>;
  };

  /**
   * Compiles one node, recursing through combinators.
   *
   * @param node - The node to compile.
   * @returns Its Convex expression.
   */
  function compile(node: AccessFilterConstraint<TDoc>): Expression<boolean> {
    switch (node.kind) {
      case "compare":
        return q[node.op](q.field(node.field), node.value);
      case "and":
        return q.and(...node.nodes.map(compile));
      case "or":
        return q.or(...node.nodes.map(compile));
      case "not":
        return q.not(compile(node.node));
    }
  }

  return compile(props.node);
}

/**
 * Compiles a recorded constraint TREE to a JS predicate, for interpreting an
 * unindexed rule against an already-fetched document.
 *
 * The tree counterpart of {@link accessConstraintsToPredicate}, and it agrees with
 * {@link accessFilterTreeToFilter} by construction: both walk the same nodes in the
 * same order and both dispatch comparisons through {@link FILTER_COMPARATORS}, one
 * in JS and one as a Convex expression.
 *
 * @typeParam TDoc - Document shape the recorded values are typed against.
 * @param props - Input props.
 * @param props.node - Root of the recorded tree.
 * @returns A function returning `true` when `doc` satisfies the tree.
 */
export function accessFilterTreeToPredicate<TDoc extends GenericDocument>(props: {
  node: AccessFilterConstraint<TDoc>;
}): (doc: TDoc) => boolean {
  /**
   * Evaluates one node against `doc`, recursing through combinators.
   *
   * @param node - The node to evaluate.
   * @param doc - The document under test.
   * @returns Whether `doc` satisfies `node`.
   */
  function evaluate(node: AccessFilterConstraint<TDoc>, doc: TDoc): boolean {
    switch (node.kind) {
      case "compare":
        return FILTER_COMPARATORS[node.op](doc[node.field], node.value);
      case "and":
        // An empty `and()` is vacuously true, matching `Array#every` and the flat
        // compilers' treatment of an empty constraint list.
        return node.nodes.every((child) => evaluate(child, doc));
      case "or":
        // An empty `or()` is false — the identity of OR. Reachable only by calling
        // `q.or()` with no arguments, which denies everything; the builder records
        // it faithfully rather than second-guessing the author.
        return node.nodes.some((child) => evaluate(child, doc));
      case "not":
        return !evaluate(node.node, doc);
    }
  }

  return (doc) => evaluate(props.node, doc);
}
```

The empty-list branch's `@throws` tag and its inline comment agree with the
actual `throw` now: a plain `Error`, not `VexAccessConfigError` — the file no
longer imports `VexAccessConfigError` at all. An earlier draft of this
function threw `VexAccessConfigError` while the doc comment already argued
for a plain `Error`; that mismatch is now resolved in favor of the comment's
reasoning, restated more precisely in the code itself:
`accessConstraintsToFilter` runs at QUERY time, invoked by `find`/`search`,
not at `defineAccess` config time, so a `VexAccessConfigError` here would
misattribute a framework bug — a caller skipping the upstream
boolean-shorthand resolution — to the user's `defineAccess` call.
`compileConstraints.test.ts`'s own assertion still only matches the message
(`/must be non-empty/`), not the class, so nothing currently depends on which
`Error` subclass this is — but the code and its own doc comment no longer
disagree about which one it should be.

**Mutation-testing finding, recorded because it changed the test file.** The
original flat-compiler suite passed in full with `gte` mutated to `gt` in
`CONSTRAINT_COMPARATORS` — no case exercised a value sitting exactly on a
bound, so `>=` and `>` were indistinguishable to every assertion. Boundary
cases were added (`compileConstraints.test.ts`, both in
`describe("constraintsToPredicate", …)` and in a dedicated "agree AT the
boundary" case) that pin the boundary value itself: `gte`/`lte` must include
it, `gt`/`lt` must exclude it. `gte`→`gt` and `lte`→`lt` mutations both fail
the suite now.

#### packages/core/src/access/compileConstraints.test.ts

```ts
import { describe, expect, it } from "vitest";
import type { AccessFilterConstraint, AccessIndexConstraint } from "./constraintTypes";
import {
  accessConstraintsToFilter,
  accessConstraintsToIndexRange,
  accessConstraintsToPredicate,
  accessFilterTreeToFilter,
  accessFilterTreeToPredicate,
} from "./compileConstraints";
import { GenericDocument } from "convex/server";

type TestDoc = GenericDocument & { authorId: string; score: number; title: string };

/** Records every `eq`/`gt`/`gte`/`lt`/`lte` call, chaining like the real `IndexRangeBuilder`. */
function recordingRangeBuilder() {
  const calls: Array<[string, string, unknown]> = [];

  const builder: any = {};
  for (const op of ["eq", "gt", "gte", "lt", "lte"] as const) {
    builder[op] = (field: string, value: unknown) => {
      calls.push([op, field, value]);
      return builder;
    };
  }
  return { builder, calls };
}

/** Records every `FilterBuilder` call by method name, without evaluating. */
function recordingFilterBuilder() {
  const calls: string[] = [];

  const builder: any = { field: (path: string) => ({ __field: path }) };
  for (const op of ["eq", "gt", "gte", "lt", "lte", "and"] as const) {
    builder[op] = (...args: unknown[]) => {
      calls.push(op);
      return { __expr: op, args };
    };
  }
  return { builder, calls };
}

/** A `FilterBuilder` double that evaluates against `doc` instead of building an AST. */
function evaluatingFilterBuilder(doc: TestDoc) {
  return {
    field: (path: keyof TestDoc) => doc[path],
    eq: (l: unknown, r: unknown) => l === r,
    gt: (l: unknown, r: unknown) => (l as number) > (r as number),
    gte: (l: unknown, r: unknown) => (l as number) >= (r as number),
    lt: (l: unknown, r: unknown) => (l as number) < (r as number),
    lte: (l: unknown, r: unknown) => (l as number) <= (r as number),
    and: (...exprs: boolean[]) => exprs.every(Boolean),
  } as any;
}

describe("constraintsToIndexRange", () => {
  it("applies a single eq constraint", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
    ];
    const { builder, calls } = recordingRangeBuilder();
    accessConstraintsToIndexRange({ constraints })(builder);
    expect(calls).toEqual([["eq", "authorId", "u1"]]);
  });

  it("applies eq then a lower bound in order", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "score", op: "gte", value: 5 },
    ];
    const { builder, calls } = recordingRangeBuilder();
    accessConstraintsToIndexRange({ constraints })(builder);
    expect(calls).toEqual([
      ["eq", "authorId", "u1"],
      ["gte", "score", 5],
    ]);
  });

  it("applies a lower bound then an upper bound on the same field", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "score", op: "gte", value: 1 },
      { field: "score", op: "lt", value: 10 },
    ];
    const { builder, calls } = recordingRangeBuilder();
    accessConstraintsToIndexRange({ constraints })(builder);
    expect(calls).toEqual([
      ["gte", "score", 1],
      ["lt", "score", 10],
    ]);
  });

  it("returns the builder unchanged for an empty constraint list", () => {
    const { builder, calls } = recordingRangeBuilder();
    expect(accessConstraintsToIndexRange({ constraints: [] })(builder)).toBe(builder);
    expect(calls).toEqual([]);
  });
});

describe("constraintsToFilter", () => {
  it("returns a single expression for one constraint, without wrapping in and", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
    ];
    const { builder, calls } = recordingFilterBuilder();
    accessConstraintsToFilter({ constraints, q: builder });
    expect(calls).toEqual(["eq"]);
  });

  it("ands an eq and a lower bound together", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "score", op: "gte", value: 5 },
    ];
    const { builder, calls } = recordingFilterBuilder();
    accessConstraintsToFilter({ constraints, q: builder });
    expect(calls).toEqual(["eq", "gte", "and"]);
  });

  it("ands a lower and an upper bound on the same field", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "score", op: "gte", value: 1 },
      { field: "score", op: "lt", value: 10 },
    ];
    const { builder, calls } = recordingFilterBuilder();
    accessConstraintsToFilter({ constraints, q: builder });
    expect(calls).toEqual(["gte", "lt", "and"]);
  });
});

describe("constraintsToPredicate", () => {
  it("accepts a matching document and rejects a non-matching one, eq-only", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
    ];
    const predicate = accessConstraintsToPredicate({ constraints });
    expect(predicate({ authorId: "u1", score: 1, title: "x" })).toBe(true);
    expect(predicate({ authorId: "u2", score: 1, title: "x" })).toBe(false);
  });

  it("evaluates a lower bound then an upper bound on the same field", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "score", op: "gte", value: 1 },
      { field: "score", op: "lt", value: 10 },
    ];
    const predicate = accessConstraintsToPredicate({ constraints });
    expect(predicate({ authorId: "u1", score: 5, title: "x" })).toBe(true);
    expect(predicate({ authorId: "u1", score: 10, title: "x" })).toBe(false);
    expect(predicate({ authorId: "u1", score: 0, title: "x" })).toBe(false);
  });

  it("returns true for an empty constraint list", () => {
    expect(
      accessConstraintsToPredicate({ constraints: [] })({
        authorId: "u1",
        score: 1,
        title: "x",
      }),
    ).toBe(true);
  });

  it("includes the boundary for gte and lte, excludes it for gt and lt", () => {
    const doc: TestDoc = { authorId: "u1", score: 5, title: "x" };
    const at = (op: AccessIndexConstraint<string, TestDoc>["op"]) =>
      accessConstraintsToPredicate<TestDoc>({ constraints: [{ field: "score", op, value: 5 }] })(
        doc,
      );
    expect(at("gte")).toBe(true);
    expect(at("lte")).toBe(true);
    expect(at("gt")).toBe(false);
    expect(at("lt")).toBe(false);
    expect(at("eq")).toBe(true);
  });

  it("treats a missing field as unsatisfied rather than throwing", () => {
    const predicate = accessConstraintsToPredicate<TestDoc>({
      constraints: [{ field: "absent", op: "eq", value: "x" }],
    });
    expect(predicate({ authorId: "u1", score: 1, title: "x" })).toBe(false);
  });

  it("requires EVERY constraint to hold, not just one", () => {
    const predicate = accessConstraintsToPredicate<TestDoc>({
      constraints: [
        { field: "authorId", op: "eq", value: "u1" },
        { field: "score", op: "gte", value: 5 },
      ],
    });
    expect(predicate({ authorId: "u1", score: 5, title: "x" })).toBe(true);
    expect(predicate({ authorId: "u1", score: 4, title: "x" })).toBe(false);
    expect(predicate({ authorId: "u2", score: 9, title: "x" })).toBe(false);
  });
});

describe("constraintsToPredicate and constraintsToFilter agree", () => {
  it("agree on a matching and a non-matching document for a mixed eq + bound constraint set", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "score", op: "gte", value: 5 },
    ];
    const matching: TestDoc = { authorId: "u1", score: 10, title: "x" };
    const nonMatching: TestDoc = { authorId: "u1", score: 1, title: "x" };
    for (const doc of [matching, nonMatching]) {
      const viaPredicate = accessConstraintsToPredicate({ constraints })(doc);
      const viaFilter = accessConstraintsToFilter({
        constraints,
        q: evaluatingFilterBuilder(doc),
      });
      expect(viaFilter).toBe(viaPredicate);
    }
  });

  it("agree AT the boundary — the case that distinguishes gte from gt", () => {
    const constraints: AccessIndexConstraint<string, TestDoc>[] = [
      { field: "score", op: "gte", value: 5 },
      { field: "score", op: "lte", value: 5 },
    ];
    const onBoundary: TestDoc = { authorId: "u1", score: 5, title: "x" };
    const justOutside: TestDoc = { authorId: "u1", score: 6, title: "x" };
    for (const doc of [onBoundary, justOutside]) {
      expect(
        accessConstraintsToFilter({ constraints, q: evaluatingFilterBuilder(doc) }),
      ).toBe(accessConstraintsToPredicate({ constraints })(doc));
    }
    // And pin the expected answers, so both agreeing on a WRONG value still fails.
    expect(accessConstraintsToPredicate({ constraints })(onBoundary)).toBe(true);
    expect(accessConstraintsToPredicate({ constraints })(justOutside)).toBe(false);
  });
});

describe("constraintsToFilter — caller contract", () => {
  it("throws on an empty constraint list — an unrestricted rule never reaches a compile target", () => {
    const { builder } = recordingFilterBuilder();
    expect(() => accessConstraintsToFilter({ constraints: [], q: builder })).toThrow(
      /must be non-empty/,
    );
  });
});

describe("filter tree compilers", () => {
  /** A `FilterBuilder` double that evaluates a tree instead of building an AST. */
  function evaluatingTreeBuilder(doc: TestDoc) {
    return {
      field: (path: keyof TestDoc) => doc[path],
      eq: (l: unknown, r: unknown) => l === r,
      neq: (l: unknown, r: unknown) => l !== r,
      gt: (l: unknown, r: unknown) => (l as number) > (r as number),
      gte: (l: unknown, r: unknown) => (l as number) >= (r as number),
      lt: (l: unknown, r: unknown) => (l as number) < (r as number),
      lte: (l: unknown, r: unknown) => (l as number) <= (r as number),
      and: (...e: boolean[]) => e.every(Boolean),
      or: (...e: boolean[]) => e.some(Boolean),
      not: (e: boolean) => !e,
    } as any;
  }

  const nested: AccessFilterConstraint<TestDoc> = {
    kind: "and",
    nodes: [
      { kind: "compare", field: "authorId", op: "eq", value: "u1" },
      {
        kind: "or",
        nodes: [
          { kind: "compare", field: "score", op: "gte", value: 5 },
          { kind: "not", node: { kind: "compare", field: "title", op: "neq", value: "x" } },
        ],
      },
    ],
  };

  it("evaluates a nested and/or/not tree as a predicate", () => {
    const predicate = accessFilterTreeToPredicate({ node: nested });
    expect(predicate({ authorId: "u1", score: 9, title: "z" })).toBe(true);
    expect(predicate({ authorId: "u1", score: 1, title: "x" })).toBe(true);
    expect(predicate({ authorId: "u1", score: 1, title: "z" })).toBe(false);
    expect(predicate({ authorId: "u2", score: 9, title: "z" })).toBe(false);
  });

  it("supports neq, which the flat index compilers cannot express", () => {
    const predicate = accessFilterTreeToPredicate<TestDoc>({
      node: { kind: "compare", field: "authorId", op: "neq", value: "u1" },
    });
    expect(predicate({ authorId: "u2", score: 1, title: "x" })).toBe(true);
    expect(predicate({ authorId: "u1", score: 1, title: "x" })).toBe(false);
  });

  it("treats an empty and as true and an empty or as false — the operators' identities", () => {
    expect(accessFilterTreeToPredicate<TestDoc>({ node: { kind: "and", nodes: [] } })({
      authorId: "u1",
      score: 1,
      title: "x",
    })).toBe(true);
    expect(accessFilterTreeToPredicate<TestDoc>({ node: { kind: "or", nodes: [] } })({
      authorId: "u1",
      score: 1,
      title: "x",
    })).toBe(false);
  });

  it("agrees with the filter-expression compiler on the same tree", () => {
    for (const doc of [
      { authorId: "u1", score: 9, title: "z" },
      { authorId: "u1", score: 1, title: "x" },
      { authorId: "u1", score: 1, title: "z" },
      { authorId: "u2", score: 9, title: "z" },
    ] satisfies TestDoc[]) {
      expect(accessFilterTreeToFilter({ node: nested, q: evaluatingTreeBuilder(doc) })).toBe(
        accessFilterTreeToPredicate({ node: nested })(doc),
      );
    }
  });
});
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/access/compileConstraints.test.ts` — 20/20 passing (confirmed directly while writing this record). Full-suite `pnpm --filter @vexcms/core test` was green for this file; the 3 failures in the then-607/610 overall count were unrelated, in `resolveAccessRule.ts`'s in-progress Step 7 work — since resolved (Step 7, `[x] DONE`); the suite is 611/611 today.

### Step 6 — `defineAccess` validation `[dev]` — [x] DONE

Why: Config-time backstop for constraints built by hand or through an `as any`
escape, and for op sequencing the array form cannot type.

- [x] `packages/core/src/access/validateAccessConstraints.ts` — validates an
      `AccessIndexConstraint[]` list against a resource's declared indexes. The
      list comes from the `index` half of an `AccessCondition` — the value
      `readAccessCondition` extracts from whatever a rule's `constraints`
      callback returned, specifically `condition.index.constraints` when the
      rule chose `q.withIndex(name, (ix) => …)`. One pass: fields form an
      in-order prefix of a declared index; ops are `eq`* then at most one lower
      bound then at most one upper bound; bounds pin the same field. Throws
      `VexAccessConfigError` naming role, resource, action, and the offending
      constraint's 1-based position. **Rules that used a plain `.filter(...)`
      predicate instead need no validation** — `condition.index` is `undefined`
      for them, so `defineAccess`'s loop skips this validator entirely; a
      `FilterConstraintBuilder` imposes neither field order nor operator
      sequencing, because `.filter()` imposes neither (DD 13).
- [x] `packages/core/src/access/config.ts` — called from inside `defineAccess`'s
      hard-error section (unconditional, not `NODE_ENV`-gated) so failure happens
      at module load, never at query time. Walks roles → resources → actions,
      skips wildcards and non-objects, invokes each rule's `constraints`
      callback, reads its return value through `readAccessCondition`, and
      validates only rules whose resolved condition carries an `index` half.
- [x] `packages/core/src/access/validateAccessConstraints.test.ts` — one case
      per rule below, each asserting the exact message; plus a case proving an
      empty constraint list (an unrestricted range) is accepted rather than
      rejected. The validator itself never receives an empty list through the
      real `q.withIndex(name, (ix) => …)` path any more — `withIndex`'s range
      callback is required, so `readIndexConstraints` always returns at least
      one entry for anything the builder produced — but the function still
      takes a bare `AccessIndexConstraint[]` and is exercised directly, and a
      hand-built array (or one reached via `as any`) can still be empty, so the
      early-return stays and the test still pins it.

Under rev 3, `q.withIndex(name, (ix) => …)` binds the range callback's `ix` to
that ONE index's real field tuple (`ConstraintBuilder<TIndexFields[N], TDoc,
0>`), so writing a field out of order, continuing past a spent index, or
calling a bound method the index doesn't support are now **compile errors at
the call site** — Step 2/4's job, not this validator's. `ConstraintFieldSlots`,
the 8-slot repeated-field-key tuple Step 2 originally proposed for exactly
this, is gone; the real field order is enforced structurally instead. So
`validateAccessConstraints` is no longer "the ONLY place field order is
checked" — it is a **genuine backstop**, not the primary check, for
constraints that never touched the builder's type machinery at all: a
hand-built `AccessIndexConstraint[]` array assigned in place of a real chain,
or a rule that reached past its types via `as any`. The compiler cannot see
either of those; this validator is what still catches them, once, loudly, at
boot — not intermittently, for whichever request happens to hit a malformed
rule first.

#### packages/core/src/access/validateAccessConstraints.ts

```ts
import { type GenericDocument } from "convex/server";
import type { AccessIndexConstraint } from "./constraintTypes";
import { VexAccessConfigError } from "./types";

/**
 * Validates one rule's recorded constraint list against its resource's
 * declared Convex indexes. Called once per constraints-bearing rule from
 * `defineAccess`, so a malformed rule fails at module load.
 *
 * @param props - Input props.
 * @param props.role - Role name the rule belongs to (for the error message).
 * @param props.resource - Resource slug the rule guards (for the error message).
 * @param props.action - Action name the rule guards (for the error message).
 * @param props.constraints - The rule's recorded constraint list, already
 *   produced by invoking its `constraints` callback with a fresh builder.
 * @param props.indexFields - The resource's declared indexes, index name →
 *   field tuple in declaration order. The caller derives this from real
 *   Convex index declarations (`defineAccess` reads it off `field.index` /
 *   relationship auto-index the same way `collectIndexNames`,
 *   `types/generateVexTypes.ts`, builds `.index()` calls) — every declared
 *   index is single-field today, but this validator is written generically
 *   and stays correct if compound indexes are ever declarable.
 * @returns Nothing; throws on violation.
 * @throws {VexAccessConfigError} When the constraint fields are not an
 *   in-order prefix of a declared index, when an `eq` follows a bound, when
 *   a second lower bound appears, when anything follows an upper bound, or
 *   when a lower/upper bound pair targets different fields — naming the
 *   role, resource, action, and the 1-based position of the offending
 *   constraint.
 */
export function validateAccessConstraints<
  TDocument extends GenericDocument = GenericDocument,
>(props: {
  role: string;
  resource: string;
  action: string;
  constraints: readonly AccessIndexConstraint<string, TDocument>[];
  indexFields: Readonly<Record<string, readonly string[]>>;
}): void {
  if (props.constraints.length === 0) return;

  const where = `role "${props.role}" on ${props.resource}.${props.action}`;

  // ── 1. Field sequence ──────────────────────────────────────────────────────
  // A lower bound immediately followed by an upper bound on the SAME field is the
  // only case Convex allows two constraints to share one index position, so the
  // pair collapses to a single logical field. Every other constraint is its own
  // position.
  const fields: string[] = [];
  for (let i = 0; i < props.constraints.length; i += 1) {
    const current = props.constraints[i]!;
    const next = props.constraints[i + 1];
    fields.push(current.field);
    if (isLowerBound(current.op) && next !== undefined && isUpperBound(next.op) && next.field === current.field) {
      i += 1;
    }
  }

  // ── 2. In-order prefix of some declared index ──────────────────────────────
  const matchesSomeIndex = Object.values(props.indexFields).some(
    (tuple) =>
      tuple.length >= fields.length && fields.every((field, at) => tuple[at] === field),
  );
  if (!matchesSomeIndex) {
    throw new VexAccessConfigError(
      `${where}: constraint fields [${fields.join(", ")}] are not an in-order prefix of any declared index`,
    );
  }

  // ── 3. Convex's operator rule ──────────────────────────────────────────────
  // Check ORDER is load-bearing: one constraint can violate several rules at
  // once, and the most specific diagnosis must win. `eq` after `lt` breaks both
  // "nothing follows an upper bound" and "eq precedes every bound"; the former is
  // the more precise complaint, so it is tested first. Likewise a second lower
  // bound on a different field would also read as a mismatched bound pair, so the
  // second-bound check precedes the same-field check. Reordering these silently
  // changes which message an author sees — `validateAccessConstraints.test.ts`
  // pins each one exactly.
  let lowerBoundSeen = false;
  let upperBoundSeen = false;
  let lastBoundField: string | undefined;

  for (const [index, constraint] of props.constraints.entries()) {
    const position = index + 1;
    const at = `${where}: constraint ${position} ("${constraint.field}")`;

    if (upperBoundSeen) {
      throw new VexAccessConfigError(
        `${at} follows an upper bound — nothing may follow lt/lte`,
      );
    }
    if (constraint.op === "eq" && (lowerBoundSeen || upperBoundSeen)) {
      throw new VexAccessConfigError(
        `${at} uses "eq" after a bound — eq must precede every gt/gte/lt/lte`,
      );
    }
    if (isLowerBound(constraint.op) && lowerBoundSeen) {
      throw new VexAccessConfigError(
        `${at} is a second lower bound — at most one gt/gte is allowed`,
      );
    }
    if (
      isUpperBound(constraint.op) &&
      lastBoundField !== undefined &&
      lastBoundField !== constraint.field
    ) {
      throw new VexAccessConfigError(
        `${at} is a bound on a different field than the prior bound ("${lastBoundField}") — bounds must pin the same field`,
      );
    }

    if (isLowerBound(constraint.op)) {
      lowerBoundSeen = true;
      lastBoundField = constraint.field;
    } else if (isUpperBound(constraint.op)) {
      upperBoundSeen = true;
      lastBoundField = constraint.field;
    }
  }
}

/**
 * Whether `op` opens a range from below.
 */
function isLowerBound(op: AccessIndexConstraint<string, GenericDocument>["op"]): boolean {
  return op === "gt" || op === "gte";
}

/**
 * Whether `op` closes a range from above.
 */
function isUpperBound(op: AccessIndexConstraint<string, GenericDocument>["op"]): boolean {
  return op === "lt" || op === "lte";
}
```

The function itself is unchanged by the rev 5 cutover — it still takes a bare
`readonly AccessIndexConstraint[]` and still short-circuits on an empty one.
What changed is what the caller passes it: `config.ts` no longer reads a
`recorded.index.constraints` sink populated by a `{ into }` builder; it reads
`condition.index.constraints` off the `AccessCondition` that
`readAccessCondition` extracts from the callback's own return value (see
below). Because `withIndex`'s range callback is now required, that list is
never empty when it arrives from a real rule — but the validator makes no
assumption either way, so a hand-built or `as any` empty array is still
accepted rather than rejected, same as before.

#### packages/core/src/access/validateAccessConstraints.test.ts

```ts
import { describe, expect, it } from "vitest";
import type { AccessIndexConstraint } from "./constraintTypes";
import { validateAccessConstraints } from "./validateAccessConstraints";
import { GenericDocument } from "convex/server";

type Doc = GenericDocument & { authorId: string; categoryId: string; score: number };

/** A nested index family: by_author ⊂ by_author_category ⊂ by_author_category_score. */
const indexFields = {
  by_author: ["authorId"],
  by_author_category: ["authorId", "categoryId"],
  by_author_category_score: ["authorId", "categoryId", "score"],
} as const;

const base = { role: "contributor", resource: "pages", action: "read" };

describe("validateAccessConstraints — valid shapes", () => {
  it("accepts an eq-only prefix of a declared index", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
    ];
    expect(() => validateAccessConstraints({ ...base, constraints, indexFields })).not.toThrow();
  });

  it("accepts a lower bound followed by an upper bound on the same field", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "eq", value: "news" },
      { field: "score", op: "gte", value: 1 },
      { field: "score", op: "lt", value: 10 },
    ];
    expect(() => validateAccessConstraints({ ...base, constraints, indexFields })).not.toThrow();
  });

  it("accepts an empty constraint list — an unrestricted range", () => {
    expect(() =>
      validateAccessConstraints({ ...base, constraints: [], indexFields }),
    ).not.toThrow();
  });
});

describe("validateAccessConstraints — field sequence must be an in-order prefix of a declared index", () => {
  it("throws when no declared index has this field prefix", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "categoryId", op: "eq", value: "news" },
    ];
    expect(() => validateAccessConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint fields [categoryId] are not an in-order prefix of any declared index',
    );
  });
});

describe("validateAccessConstraints — operator sequencing", () => {
  it("throws on eq after a bound", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "gte", value: "a" },
      { field: "score", op: "eq", value: 5 },
    ];
    expect(() => validateAccessConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint 3 ("score") uses "eq" after a bound — eq must precede every gt/gte/lt/lte',
    );
  });

  it("throws on a second lower bound", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "gte", value: "a" },
      { field: "categoryId", op: "gte", value: "b" },
    ];
    expect(() => validateAccessConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint 2 ("categoryId") is a second lower bound — at most one gt/gte is allowed',
    );
  });

  it("throws on anything after an upper bound", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "lt", value: "z" },
      { field: "score", op: "eq", value: 5 },
    ];
    expect(() => validateAccessConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint 3 ("score") follows an upper bound — nothing may follow lt/lte',
    );
  });

  it("throws when a lower and upper bound pin different fields", () => {
    const constraints: AccessIndexConstraint<string, Doc>[] = [
      { field: "authorId", op: "eq", value: "u1" },
      { field: "categoryId", op: "gte", value: "a" },
      { field: "score", op: "lt", value: 10 },
    ];
    expect(() => validateAccessConstraints({ ...base, constraints, indexFields })).toThrow(
      'role "contributor" on pages.read: constraint 3 ("score") is a bound on a different field than the prior bound ("categoryId") — bounds must pin the same field',
    );
  });
});
```

Two collisions are worth naming explicitly, because the load-bearing check
order above (upper-bound-follows, then eq-after-bound, then second-lower-bound,
then mismatched-bound-field) is what resolves them: `eq` immediately after a
`lt`/`lte` matches BOTH "follows an upper bound" and "eq after a bound" — the
upper-bound check runs first, so that's the message an author sees, not the
more generic eq one. And a second lower bound on a field DIFFERENT from the
first also matches BOTH "second lower bound" and "bound pin mismatch" — the
second-lower-bound check runs first, so that wins over the field-mismatch
message. Reordering any of the four checks changes which message a malformed
rule reports, and `validateAccessConstraints.test.ts` pins each exact string,
so a reorder is a test failure, not a silent behavior change.

#### packages/core/src/access/config.ts

**1 — imports.** Added alongside the existing imports.

```ts
import { ADMIN_FIELDS } from "../fields/constants";
import { createAccessQueryBuilder, readAccessCondition } from "./createAccessQueryBuilder";
import type { AccessConditionResult } from "./constraintTypes";
import { validateAccessConstraints } from "./validateAccessConstraints";
import { GenericDocument } from "convex/server";
```

`createAccessQueryBuilder` and `readAccessCondition` are both zero-argument
imports now — there is no `{ into }` sink type to import alongside them.
`RecordedAccessConstraints` is gone; the type the loop below deals with is
`AccessConditionResult`, the callback's own return type, decoded after the
fact by `readAccessCondition` rather than accumulated into a caller-owned
object during the call.

**2 — index-field helper.** Module-level function, above `defineAccess`.

```ts
/**
 * Declared Convex index name → field tuple for one resource, read the same
 * way `collectIndexNames` (`types/generateVexTypes.ts`) builds `.index()`
 * calls: one index per `field.index`, or an auto `by_<fieldKey>` for
 * relationship fields. Every declared index is single-field today; this
 * returns single-element tuples accordingly and stays correct if a
 * compound-index authoring mechanism lands later. @internal
 * @param resource @see {@link AccessResource} the collection / resource
 * @returns Record<string, readonly string[]> A record of indexes to fields
 */
function collectResourceIndexFields(resource: AccessResource): Record<string, readonly string[]> {
  const indexFields: Record<string, readonly string[]> = {};
  for (const [fieldKey, field] of Object.entries(resource.fields)) {
    if (field.index) {
      indexFields[field.index] = [fieldKey];
    } else if (field.type === ADMIN_FIELDS.relationship.type) {
      indexFields[`by_${fieldKey}`] = [fieldKey];
    }
  }
  return indexFields;
}
```

**3 — validate constraints.** Inside `defineAccess`, after the
`customResources` validation loop and before the `NODE_ENV` dev-only warnings
block — unconditional, like the hard errors above it, not gated behind
`NODE_ENV`.

```ts
// Constraint validation — always runs, not dev-only: a malformed
// constraint-builder rule must fail here, at module load, never silently
// at query time. See `validateAccessConstraints` for why this backstop is
// necessary even though Step 2's types already cover operator sequencing
// and per-field value types for the builder form.
const resourcesBySlug = new Map<string, AccessResource>(
  props.resources.map((resource) => [resource.slug, resource]),
);
for (const [role, subjects] of Object.entries(props.permissions)) {
  if (typeof subjects !== "object" || subjects === null) continue;
  for (const [resourceSlug, actions] of Object.entries(subjects as Record<string, unknown>)) {
    const resource = resourcesBySlug.get(resourceSlug);
    // Custom resources and admin subjects carry no declared indexes and
    // are skipped here — see `validateAccessConstraints`'s edge cases.
    if (resource === undefined || typeof actions !== "object" || actions === null) continue;
    for (const [action, check] of Object.entries(actions as Record<string, unknown>)) {
      if (action === WILDCARD_KEY || typeof check !== "object" || check === null) continue;
      if (!("constraints" in check)) continue;
      let outcome: boolean | AccessConditionResult;
      try {
        outcome = (
          check as {
            constraints: (
              callbackProps: Record<string, unknown>,
            ) => boolean | AccessConditionResult;
          }
        ).constraints({
          user: {},
          organization: {},
          q: createAccessQueryBuilder(),
        });
      } catch (error) {
        // Resolving a rule means RUNNING its callback at module load, so a rule
        // that reached past its types — `as any`, a hand-built object, a method
        // the builder does not have — surfaces here as whatever it threw. Rethrow
        // as a config error so every `defineAccess` failure has one shape and
        // names the offending rule, instead of leaking a bare `TypeError` with no
        // indication of which role or action produced it.
        throw new VexAccessConfigError(
          `role "${role}" on ${resourceSlug}.${action}: the constraints callback threw ` +
            `while being resolved — ${error instanceof Error ? error.message : String(error)}. ` +
            `Constraints must be a pure chain on the supplied "q"; they run once at ` +
            `config time with no documents and no database access.`,
        );
      }
      // A rule that short-circuits to a flat allow/deny has no condition to check.
      if (typeof outcome === "boolean") continue;
      const condition = readAccessCondition<GenericDocument>(outcome);
      // This validator enforces Convex's INDEX rules — field order and operator
      // sequencing — so it applies only when the rule chose an index. A predicate
      // compiles to `.filter()`, which imposes neither.
      if (condition?.index === undefined) continue;
      validateAccessConstraints({
        role,
        resource: resourceSlug,
        action,
        constraints: condition.index.constraints,
        indexFields: collectResourceIndexFields(resource),
      });
    }
  }
}
```

The rule's own `constraints` callback runs exactly the same way it does at
request time — with a fresh, zero-argument `createAccessQueryBuilder()`, a
placeholder `user`/`organization`, and no document — and its return value is
decoded exactly the same way `resolveAccessConstraint` (Step 7) decodes it:
`readAccessCondition(outcome)`. There is no separate `{ into }` object for
`defineAccess` to populate and inspect afterward; the callback's return value
IS the thing both call sites read, so this loop and the real runtime path
cannot diverge on how a condition is extracted.

The `try`/`catch` around the callback invocation exists for a reason distinct
from `validateAccessConstraints` itself: validating a rule means *executing*
its `constraints` callback at module load with `user: {}`/`organization: {}`
placeholders and no document. A rule that reaches past its compile-time types
— `as any`, a hand-built `q`, calling a method the builder doesn't have —
would otherwise surface as a bare `TypeError` (`q.withIndex is not a
function`, `Cannot read properties of undefined`) with no indication of which
role, resource, or action produced it, since the throw happens deep inside
`Object.entries(props.permissions)` iteration. Wrapping it and rethrowing as
`VexAccessConfigError` gives every `defineAccess` failure — hard errors,
callback failures, and constraint-shape failures alike — one exception type
and one naming convention.

**4 — `@throws` doc.** `defineAccess`'s JSDoc `@throws {VexAccessConfigError}`
line already lists the pre-existing hard errors (`userCollectionSlug`,
`userRolesField`, `customResources` collisions) alongside both throw sites
this section adds — a rule's constraints failing `validateAccessConstraints`
and a `constraints` callback throwing while being resolved. This was
documentation debt at an earlier point in the effort; it is not any longer —
the comment in the real source is current with the loop above, so there is
nothing left to extend here.

Verify: `pnpm --filter @vexcms/core test`

### Step 7 — `resolveAccessIndex` consumes constraints `[dev]` — [x] DONE

- [x] `packages/core/src/access/resolveAccessRule.ts` — `classifyRole` runs a
      constrained check's `constraints` callback against a fresh, zero-argument
      `createAccessQueryBuilder()` — the two-callback builder needs no
      caller-owned sink to record into — and classifies the role by the
      callback's OUTCOME rather than by its declaration: `true`/`false`
      short-circuits straight to `unrestricted`/`deny`; anything else is read
      back through `readAccessCondition`, and a condition it can read becomes
      `RoleContribution`'s renamed fourth variant, `{ kind: "conditional";
      condition }` (was `{ kind: "recorded"; recorded }`); a foreign/forged
      result `readAccessCondition` cannot read becomes `opaque`.
- [x] `packages/core/src/access/resolveAccessRule.ts` — `selectSingleCondition`
      (renamed from `selectSingleIndexedCheck`) applies the unchanged OR-merge
      safety rule over `classifyRole`'s output and returns the single
      `AccessCondition` that may safely narrow the query, or `undefined`.
- [x] `packages/core/src/access/resolveAccessRule.ts` — `resolveAccessIndex`
      compiles the winning condition's `index` half via
      `accessConstraintsToIndexRange`. `resolveAccessConstraint` (new export)
      compiles the same condition to a `.filter()` expression and, when BOTH
      `index` and `filter` are populated on one `AccessCondition`, `and`s the
      compiled range-as-filter together with the compiled filter tree — fixing
      the earlier design's real defect, which checked `index` first and
      returned early, silently dropping a populated `filter` (DD 24).
- [x] `packages/core/src/access/resolveAccessRule.test.ts` — `access`'s
      `permissions` matrix rewritten to the two-callback shape
      (`constraints: ({ user, q }) => q.withIndex("by_author", (ix) =>
      ix.eq("authorId", user._id))`), plus two new roles, `escalating` and
      `selfDenying`, whose callbacks resolve to a flat `true`/`false` for every
      caller, to exercise the outcome-based short-circuit; every pre-existing
      assertion kept.

**Classification runs the callback against a bare builder — there is no sink
to inspect afterward.** `classifyRole` invokes a constrained check's
`constraints` with `q: createAccessQueryBuilder()` — zero arguments, matching
the factory's own zero-argument signature — rather than handing it a
caller-owned object to write into. The callback's RETURN value is now the
entire record: a `boolean` short-circuits directly, and anything else is
`readAccessCondition`'s problem, not this function's. This is what makes
`ix`/`f` unable to leak past their own callback (DD 19's confinement) — there
is no sink for a leaked builder to still be useful against.

**`RoleContribution`'s fourth variant carries a condition, not a raw
result.** Renamed from `{ kind: "recorded"; recorded:
RecordedAccessConstraints<GenericDocument> }` to `{ kind: "conditional";
condition: AccessCondition<GenericDocument> }`. `condition` is what
`readAccessCondition` extracted from the callback's `AccessConditionResult`,
not the return value itself — a role whose callback returns something
`readAccessCondition` cannot resolve (a forged or foreign value) classifies as
`opaque`, the same as a bare callback, rather than as an uninspectable
`conditional`.

**`isConstrainedCheck` still does not mean "indexed."** Every check that
carries a `constraints` callback has the identical `{ constraints, filter? }`
shape, whether the callback ends up calling `q.withIndex(…)` or using the flat
filter algebra directly. There is nothing on the check OBJECT to tell those
apart; only running the callback and reading whether the resulting
`AccessCondition` has an `index` (via `resolveAccessIndex`/
`resolveAccessConstraint`, downstream of `classifyRole`) answers that.

**`selectSingleCondition` (renamed from `selectSingleIndexedCheck`).** Same OR-
merge safety rule as before, unchanged: a role that denies is skipped; a role
that is `unrestricted` or `opaque` makes narrowing unsound and the whole
resolution bails to `undefined`; more than one `conditional` role also bails,
because the caller's permitted set is then a union of two conditions and
neither alone is correct. Exactly one `conditional` role, with every other
role denying, is the only case that returns a value — that value is now an
`AccessCondition`, not a `ConstrainedPermissionCheck`.

**`filter` is not yet redundant.** `ConstrainedPermissionCheck.filter` is
optional in the type, but `hasPermission.ts`'s `resolvePermissionCheck` does
not interpret a `{ constraints, filter? }` object at all today — it only
special-cases `function` checks, and passes anything else (including this
object) straight through as if it were a `FieldPermissionResult`. Deriving the
equivalent per-document predicate from `constraints` via
`accessConstraintsToPredicate` (already written, exercised only by
`compileConstraints.test.ts` so far) is Step 10's job, not started. Until
then, a rule that wants correct per-document enforcement — not just
query-time narrowing — still needs an explicit `filter`; the test fixture
below keeps it on every constrained role for that reason.

**The both-halves AND fix (DD 24).** An `AccessCondition` with both `index`
and `filter` populated is not a conflict to reject — it is the natural
encoding of `.withIndex(name, range).filter(expr)`, Convex's own shape (DD
23): the range narrows what is READ, the filter rejects rows within it the
range cannot describe (`neq`, `or`, `not`). The real defect this step fixes is
that `resolveAccessConstraint` used to check `index` first and return early,
silently dropping a populated `filter` — a rule that appeared to constrain by
both did not. It now `and`s the compiled range-as-filter together with the
compiled filter tree whenever both are present, so neither half is ever
discarded.

#### packages/core/src/access/resolveAccessRule.ts

**1 — imports.**

```ts
import type { GenericDocument } from "convex/server";
import { PERMISSION_MODES, WILDCARD_KEY } from "./constants";
import { resolveActionCheck } from "./hasPermission";
import type { AccessConditionResult } from "./constraintTypes";
import { createAccessQueryBuilder, readAccessCondition } from "./createAccessQueryBuilder";
import type { AccessCondition } from "./createAccessQueryBuilder";
import {
  accessConstraintsToFilter,
  accessConstraintsToIndexRange,
  accessFilterTreeToFilter,
} from "./compileConstraints";
import type {
  AccessFilterFn,
  PermissionCheck,
  QueryIndex,
  SubjectEntry,
  VexAccessConfig,
} from "./types";
```

**2 — `RoleContribution`.** The fourth variant's payload is now an
`AccessCondition`, read back off the callback's result rather than recorded
into a sink the caller owned.

```ts
/**
 * How one role's rule bears on whether a query may be narrowed.
 *
 * - `deny` — the role refuses this action, statically or by its constraints
 *   callback returning `false`. It contributes nothing and is skipped.
 * - `unrestricted` — the role allows the action outright, statically or by its
 *   callback returning `true`. Narrowing would hide rows it permits, so nothing
 *   may be applied.
 * - `opaque` — the role allows conditionally through a bare callback (or, until
 *   Step 14, a field-mode object). Which rows it permits is unknowable before
 *   reading them, so again nothing may be applied.
 * - `recorded` — the role's constraints callback ran and recorded something. The
 *   recording says which compile targets are available; it does NOT by itself
 *   mean an index was chosen.
 *
 * @internal
 */
type RoleContribution =
  | { kind: "deny" }
  | { kind: "unrestricted" }
  | { kind: "opaque" }
  | { kind: "conditional"; condition: AccessCondition<GenericDocument> };
```

**3 — `isConstrainedCheck`.** Same runtime test as before (`"constraints" in
check`); still deliberately does not claim to identify "indexed" — see the
design note above.

```ts
/**
 * True when a resolved check is the constraint object form rather than a boolean,
 * a bare callback, or (until Step 14) a field-mode object.
 *
 * Distinguished by the presence of `constraints`. Note this is the ONLY thing a
 * type predicate can settle here: whether the rule turns out to be *indexed* is a
 * RUNTIME outcome of invoking the callback, since every check now has the same
 * `{ constraints, filter? }` shape and the index is chosen inside it by calling
 * `q.withIndex(…)`. That is why classification below runs the callback rather than
 * inspecting the object further.
 *
 * @param check - The resolved check for one role + action.
 * @returns `true` when `check` carries a `constraints` callback.
 * @internal
 */
function isConstrainedCheck(
  check: PermissionCheck,
): check is Extract<PermissionCheck, { constraints: unknown }> {
  return typeof check === "object" && check !== null && "constraints" in check;
}
```

**4 — `classifyRole`.** Same resolution order as `hasPermission` (subject
boolean shorthand, explicit action key or action-level wildcard via
`resolveActionCheck`, role-level wildcard, `defaultPermissionMode`). A
constrained check is the only case that now runs code: the callback executes
against a bare `createAccessQueryBuilder()`, and its outcome — not its
declaration — decides the classification.

```ts
function classifyRole(props: {
  access: VexAccessConfig;
  role: string;
  resource: string;
  action: string;
  user: Record<string, unknown> | null;
  organization?: Record<string, unknown>;
}): RoleContribution {
  const defaultAllowed = props.access.defaultPermissionMode === PERMISSION_MODES.allow;
  const roleRules = props.access.permissions[props.role];
  const subject = roleRules?.[props.resource];

  let check: PermissionCheck;
  if (typeof subject === "boolean") {
    check = subject;
  } else if (subject !== null && subject !== undefined && typeof subject === "object") {
    check =
      resolveActionCheck({
        resource: subject as Record<string, unknown>,
        action: props.action,
      }) ?? defaultAllowed;
  } else {
    const roleWildcard = roleRules?.[WILDCARD_KEY];
    check = typeof roleWildcard === "boolean" ? roleWildcard : defaultAllowed;
  }

  if (check === false) return { kind: "deny" };
  if (check === true) return { kind: "unrestricted" };
  if (!isConstrainedCheck(check)) return { kind: "opaque" };

  const outcome: boolean | AccessConditionResult = check.constraints({
    user: props.user ?? {},
    q: createAccessQueryBuilder(),
    ...(props.access.orgCollectionSlug !== undefined
      ? { organization: props.organization }
      : {}),
  } as unknown as Parameters<typeof check.constraints>[0]);

  // The callback may short-circuit to a flat allow/deny instead of returning a
  // condition — a rule reading `({ user, q }) => user.isAdmin || q.filter(…)` is the
  // common case. Classifying on the OUTCOME is strictly more precise than
  // classifying on the declaration: a rule that resolves to `true` for this caller
  // is genuinely unrestricted, and one that resolves to `false` genuinely denies.
  if (outcome === true) return { kind: "unrestricted" };
  if (outcome === false) return { kind: "deny" };

  const condition = readAccessCondition<GenericDocument>(outcome);
  // A condition this module cannot read did not come from `q` — treat it as
  // describing nothing rather than assuming it describes everything.
  if (condition === undefined) return { kind: "opaque" };

  return { kind: "conditional", condition };
}
```

**5 — `selectSingleCondition`.** Renamed from `selectSingleIndexedCheck`; the
OR-merge safety rule it applies is untouched — only its output type changed,
from a `ConstrainedPermissionCheck` (the un-run check) to an `AccessCondition`
(the check's already-run, already-classified result).

```ts
/**
 * Selects the single recording that safely narrows one query, or `undefined` when
 * no sound narrowing exists.
 *
 * Shared by {@link resolveAccessIndex} and {@link resolveAccessConstraint} — both
 * need the identical safety rule, and a divergence between them would be a silent
 * permission difference between `find`'s indexed path and its displaced/search
 * paths. Narrowing is only sound when exactly one contributing role records
 * anything and every other role either denies outright or is itself undescribable
 * (`unrestricted` or `opaque`).
 *
 * @param props - Input props.
 * @param props.access - Resolved, enabled access config.
 * @param props.user - Caller, or `null` for anonymous (resolves through `access.anonRole`).
 * @param props.organization - Active organization, when configured.
 * @param props.resource - Subject slug.
 * @param props.action - Query-shaped action.
 * @returns The one recording that safely narrows this query, or `undefined`.
 * @internal
 */
function selectSingleCondition(props: {
  access: VexAccessConfig;
  user: Record<string, unknown> | null;
  organization?: Record<string, unknown>;
  resource: string;
  action: string;
}): AccessCondition<GenericDocument> | undefined {
  const { access } = props;

  const rawRoles = props.user ? props.user[access.userRolesField] : [];
  const userRoles =
    typeof rawRoles === "string"
      ? [rawRoles]
      : Array.isArray(rawRoles)
        ? rawRoles.filter((role): role is string => typeof role === "string")
        : [];
  const effectiveRoles =
    userRoles.length === 0 && access.anonRole !== undefined ? [access.anonRole] : userRoles;
  const knownRoles = effectiveRoles.filter((role) => access.roles.includes(role));

  // No recognized role ⇒ `hasPermission` denies outright. There is no result set to
  // narrow, so narrowing is moot.
  if (knownRoles.length === 0) return undefined;

  const candidates: AccessCondition<GenericDocument>[] = [];
  for (const role of knownRoles) {
    const contribution = classifyRole({
      access,
      role,
      resource: props.resource,
      action: props.action,
      user: props.user,
      organization: props.organization,
    });
    if (contribution.kind === "deny") continue;
    // Either of these permits rows no constraint can describe.
    if (contribution.kind === "unrestricted" || contribution.kind === "opaque") return undefined;
    candidates.push(contribution.condition);
  }

  // Zero ⇒ every role denied; nothing to narrow. More than one ⇒ the caller's
  // permitted set is a union, and neither candidate alone is correct.
  if (candidates.length !== 1) return undefined;
  return candidates[0];
}
```

**6 — `resolveAccessIndex`.** Compiles the winning condition's `index` half,
when present, via `accessConstraintsToIndexRange`. Returns `undefined` both
when there is no single winning condition and when there is one but it
recorded only through `.filter()` — a rule that never called `q.withIndex(…)`
has no index for this function to give the caller; `resolveAccessConstraint`
is the sibling that can still use it.

````ts
/**
 * Resolves the index an access rule contributes to a query, if any.
 *
 * Called once per query, before the Convex query is built. Answers a query-scoped
 * question ("which index narrows this query?") rather than the document-scoped one
 * `hasPermission` answers ("may they read this row?").
 *
 * **Never authorizes.** The per-document `hasPermission` pass still runs, so a
 * missing or broader-than-necessary index can only cost reads — it can never admit
 * a row a role does not permit. Failing to find an index is always safe; wrongly
 * applying one is not, which is why every ambiguous case resolves to `undefined`
 * (scan) rather than to a guess.
 *
 * Returns `undefined` when the single contributing rule used the FLAT algebra
 * rather than calling `q.withIndex(…)`: there is a describable constraint, but no
 * index to push it into. {@link resolveAccessConstraint} is the export that can
 * still use it.
 *
 * @param props - Input props.
 * @param props.access - Resolved access config; absent or `enabled: false` ⇒ no index.
 * @param props.user - Caller, or `null` for anonymous (resolves through `access.anonRole`).
 * @param props.organization - Active organization, forwarded to the rule's callback.
 * @param props.resource - Subject slug (a collection or global slug).
 * @param props.action - Query-shaped action (`"read"` | `"readDrafts"`).
 * @returns The index to apply, or `undefined` to scan unnarrowed.
 *
 * @typeParam TSubjects - Resolved `SubjectMap`, inferred from `access`. Generic for
 *   the same reason `HasPermissionProps` is: a concrete `SubjectMap<…>`
 *   instantiation is not assignable to the erased
 *   `VexAccessConfig<Record<string, SubjectEntry>>` default, because callback
 *   contravariance makes instantiations mutually unassignable (P-002). Pinning the
 *   default would reject every real `defineAccess()` result.
 *
 * @example
 * ```ts
 * const index = resolveAccessIndex({
 *   access, user, resource: "pages", action: CRUD_ACTIONS.read,
 * });
 * // → { name: "by_author", range: (q) => q.eq("authorId", "u1") }
 * ```
 */
export function resolveAccessIndex<
  TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>,
>(props: {
  access?: VexAccessConfig<TSubjects>;
  user: Record<string, unknown> | null;
  organization?: Record<string, unknown>;
  resource: string;
  action: string;
}): QueryIndex | undefined {
  const access = props.access as VexAccessConfig | undefined;
  if (!access || !access.enabled) return undefined;

  const condition = selectSingleCondition({
    access,
    user: props.user,
    organization: props.organization,
    resource: props.resource,
    action: props.action,
  });

  if (condition?.index === undefined) return undefined;

  return {
    name: condition.index.name,
    range: accessConstraintsToIndexRange({ constraints: condition.index.constraints }),
  };
}
````

**7 — `resolveAccessConstraint` (new export).** The sibling of
`resolveAccessIndex`, for query shapes with no `withIndex` slot (`search`) or
where the caller's own index already claimed it (`find`'s displaced branch).
Both share `selectSingleCondition`, so they cannot disagree about which rule
applies. Unlike `resolveAccessIndex` this succeeds for either half of a
condition, and — the fix this step ships — for BOTH halves at once, `and`-ed
together, rather than silently keeping only one.

```ts
/**
 * Resolves an access rule to a `.filter()` expression, if any.
 *
 * The sibling of {@link resolveAccessIndex}, for query shapes with no `withIndex`
 * slot to claim (`search`) or where the caller's own index already claimed it
 * (`find`'s displaced branch). Both share {@link selectSingleCondition}, so they
 * cannot disagree about which rule applies.
 *
 * Unlike `resolveAccessIndex` this succeeds for BOTH recordings: an indexed rule's
 * positional constraints compile to a filter expression just as well as they do to
 * a range — that is the whole point of recording data rather than a callback — and
 * a flat rule's tree compiles here too.
 *
 * @param props - Input props.
 * @param props.access - Resolved access config; absent or `enabled: false` ⇒ no filter.
 * @param props.user - Caller, or `null` for anonymous (resolves through `access.anonRole`).
 * @param props.organization - Active organization, forwarded to the rule's callback.
 * @param props.resource - Subject slug.
 * @param props.action - Query-shaped action.
 * @returns A thunk taking the query's own `FilterBuilder`, or `undefined` when no
 *   sound narrowing exists.
 */
export function resolveAccessConstraint<
  TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>,
>(props: {
  access?: VexAccessConfig<TSubjects>;
  user: Record<string, unknown> | null;
  organization?: Record<string, unknown>;
  resource: string;
  action: string;
}): AccessFilterFn | undefined {
  const access = props.access as VexAccessConfig | undefined;
  if (!access || !access.enabled) return undefined;

  const condition = selectSingleCondition({
    access,
    user: props.user,
    organization: props.organization,
    resource: props.resource,
    action: props.action,
  });
  if (condition === undefined) return undefined;

  const { index, filter } = condition;

  // An index with no constraints is an ordering-only opt-in: it excludes no rows, so
  // it contributes nothing to a filter expression.
  const indexConstrains = index !== undefined && index.constraints.length > 0;

  // BOTH branches may be populated, and that is not a conflict — it is
  // `.withIndex(name, range).filter(expr)`, which is Convex's own shape. Compiling
  // only one would silently discard half the rule, so when both are present they are
  // `and`-ed into a single expression.
  if (indexConstrains && filter !== undefined) {
    return (q) =>
      q.and(
        accessConstraintsToFilter({ constraints: index.constraints, q }),
        accessFilterTreeToFilter({ node: filter, q }),
      );
  }
  if (indexConstrains) {
    return (q) => accessConstraintsToFilter({ constraints: index.constraints, q });
  }
  if (filter !== undefined) {
    return (q) => accessFilterTreeToFilter({ node: filter, q });
  }
  // Recorded nothing that excludes rows.
  return undefined;
}
```

#### packages/core/src/access/resolveAccessRule.test.ts

**1 — fixture resources.** `pages` declares both fields the fixture indexes
on with real Convex indexes, so `defineAccess`'s Step 6 validation (which
checks every recorded constraint set against the resource's DECLARED indexes)
accepts the fixture rather than rejecting it for naming an index that doesn't
exist.

```ts
const pages = defineCollection({
  slug: "pages",
  // Both fields declare real indexes: `defineAccess` validates every recorded
  // constraint set against the resource's DECLARED indexes, so a fixture naming an
  // index that does not exist would fail at config time for the wrong reason.
  fields: {
    title: text({ required: true }),
    authorId: text({ index: "by_author" }),
    status: text({ index: "by_status" }),
  },
});

const users = defineCollection({
  slug: "users",
  fields: { name: text({ required: true }), roles: text() },
});

const asUser = (roles: string | string[], _id = "u1") => ({ _id, roles });
```

**2 — the `access` config.** The `permissions` matrix is built inline inside
one `defineAccess()` call, not as a separate object, because the two-callback
`q` types are contextually inferred from the call site — there is no standalone
`rolePermissions` fixture object to migrate onto a new shape, as an earlier
version of this note described. `contributor` reads only its own rows via
`q.withIndex("by_author", …)`; `editor` is unrestricted; `escalating` and
`selfDenying` are new — their `constraints` callbacks ignore `q` entirely and
resolve to a flat `true`/`false`, exercising `classifyRole`'s short-circuit
path directly; `reviewer`'s rule is a bare callback and records nothing, so it
is unindexable; `auditor` is restrictive AND indexed, but names a DIFFERENT
index (`by_status`) than `contributor` — the "two differing indexed roles"
case; `anon` resolves through the fallback role and shares `auditor`'s shape.
Every constrained role keeps its `filter` — see "`filter` is not yet
redundant" above — since `hasPermission` does not interpret `constraints` yet.

```ts
const access = defineAccess({
  roles: ["admin", "editor", "contributor", "reviewer", "auditor", "anon", "escalating", "selfDenying"] as const,
  resources: [pages, users],
  anonRole: "anon",
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
  admin: { [WILDCARD_KEY]: true },
  editor: { pages: true },
  contributor: {
    pages: {
      read: {
        constraints: ({ user, q }) =>
          q.withIndex("by_author", (ix) =>
            ix.eq(
              "authorId",
              typeof user === "object" && user !== null && "_id" in user
                ? user._id
                : undefined,
            ),
          ),
        filter: ({ data, user }: { data: unknown; user: unknown }) =>
          typeof data === "object" &&
          data !== null &&
          "authorId" in data &&
          typeof user === "object" &&
          user !== null &&
          "_id" in user
            ? data.authorId === user._id
            : false,
      },
    },
  },
  // A constraints callback that resolves to a flat allow for this caller. It
  // recorded nothing, so there is nothing to narrow BY — and narrowing anyway would
  // hide rows the role permits.
  escalating: {
    pages: {
      read: {
        constraints: () => true,
      },
    },
  },
  // The mirror case: resolves to a flat deny, so the role contributes nothing and
  // must not block another role's index.
  selfDenying: {
    pages: {
      read: {
        constraints: () => false,
      },
    },
  },
  reviewer: {
    pages: {
      read: ({ data }: { data: unknown }) =>
        typeof data === "object" && data !== null && "status" in data
          ? data.status === "published"
          : false,
    },
  },
  auditor: {
    pages: {
      read: {
        constraints: ({ q }) => q.withIndex("by_status", (ix) => ix.eq("status", "published")),
        filter: ({ data }: { data: unknown }) =>
          typeof data === "object" && data !== null && "status" in data
            ? data.status === "published"
            : false,
      },
    },
  },
  anon: {
    pages: {
      read: {
        constraints: ({ q }) => q.withIndex("by_status", (ix) => ix.eq("status", "published")),
        filter: ({ data }: { data: unknown }) =>
          typeof data === "object" && data !== null && "status" in data
            ? data.status === "published"
            : false,
      },
    },
  },
  },
});

/**
 * The same config with the kill switch off. Derived by spread rather than a second
 * `defineAccess` call: the permission matrix has to be written inline to get
 * contextual typing for `q`, and writing it twice invites the two copies to drift.
 */
const disabledAccess = { ...access, enabled: false };
```

**3 — assertions.** The `describe` blocks for "access absent or disabled",
"single restrictive role", "unrestricted role", "restrictive + permissive ⇒ no
index", "two differing restrictive roles ⇒ no index", and "anon via anonRole"
keep asserting on `resolveAccessIndex`'s output, `{ name, range }` or
`undefined` — unchanged in shape, since `resolveAccessIndex` binds
`selectSingleCondition`'s result to `accessConstraintsToIndexRange` internally
and callers never see the classification machinery underneath. The "binds
range to the caller's user id" test calls `resolved?.range?.(q)` on
`resolveAccessIndex`'s *output* only, so it needed no edit for this step.

A new `describe` block exercises the outcome-based classification directly —
this behavior did not exist before `classifyRole` started running constrained
callbacks rather than only inspecting their declared shape:

```ts
describe("resolveAccessIndex — a constraints callback that short-circuits", () => {
  it("returns undefined when the callback resolves to true — an unrestricted caller must not be narrowed", () => {
    expect(
      resolveAccessIndex({
        access,
        user: asUser("escalating"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });

  it("does not let a true-resolving role ride along with an indexed one", () => {
    expect(
      resolveAccessIndex({
        access,
        user: asUser(["contributor", "escalating"]),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });

  it("skips a false-resolving role entirely, leaving another role's index intact", () => {
    expect(
      resolveAccessIndex({
        access,
        user: asUser(["contributor", "selfDenying"]),
        resource: "pages",
        action: "read",
      }),
    ).toEqual({ name: "by_author", range: expect.any(Function) });
  });

  it("returns undefined when the only role resolves to false — nothing is readable to narrow", () => {
    expect(
      resolveAccessIndex({
        access,
        user: asUser("selfDenying"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});
```

Verify: `pnpm --filter @vexcms/core exec vitest run src/access/resolveAccessRule.test.ts` — 13/13 passing (confirmed directly while writing this record). Full-suite `pnpm --filter @vexcms/core test` is green.

### Step 8 — `find` integration `[dev]` — [x] DONE

- [ ] `packages/core/src/api/find/server.ts` — when `pickQueryIndex` gives the slot to the access index, use it as today (unchanged). When the caller displaces it, `and` the compiled `accessConstraintsToFilter` expression into the query's `.filter()` rather than dropping the constraint. The `hasPermission` per-document pass stays unconditional (unchanged) — constraints reduce what gets read, never what gets checked.
- [ ] `packages/core/src/api/find/server.test.ts` — indexed rule returns a full page; displaced rule still narrows via filter and returns a full page.
- [ ] `packages/core/src/api/test/convex/schema.ts` — `posts` currently declares one index (`by_featured`); the displacement test needs a second, differently-named index for the caller to explicitly request. Adds `by_slug` on the existing `slug` field — additive, does not change any other test's behavior.
- Verify: `pnpm --filter @vexcms/core test`

#### packages/core/src/api/find/server.ts

**1 — imports.** Add `resolveAccessConstraint` to the existing `../../access` import (`packages/core/src/api/find/server.ts:26-33`). `resolveAccessConstraint` is Step 7's sibling export on `resolveAccessRule.ts`: where `resolveAccessIndex` walks every contributing role's rule and, when exactly one role narrows and the rest are consistent with it, compiles that role's recorded index constraints to an `IndexRangeFn`, `resolveAccessConstraint` runs the identical resolution and compiles to a `.filter()`-shaped callback instead — the two share the safety rule (narrowing is only sound when no other contributing role is unrestricted or opaque), they just target different compile functions (`accessConstraintsToIndexRange` vs. `accessConstraintsToFilter`) on the same recorded condition. Each resolver runs the role's `constraints` callback itself, fresh, inside its own `selectSingleCondition` call, against a freshly-created `createAccessQueryBuilder()` — there is no shared cache between the two calls. So when displacement happens and `find()` calls both resolvers, the callback runs twice for that request; the two runs agree not because either remembers the other's result, but because `selectSingleCondition`'s exact-one-role safety rule is deterministic given the same `access`, `user`, `organization`, `resource`, and `action`.

```ts
import {
  CRUD_ACTIONS,
  hasPermission,
  type IndexRangeFn,
  pickQueryIndex,
  type QueryIndex,
  resolveAccessConstraint,
  resolveAccessIndex,
} from "../../access";
```

**2 — inside `find()`, before `buildQuery` is called (`packages/core/src/api/find/server.ts:195-213`).** `accessIndex`, `callerIndex`, and `resolvedIndex` are unchanged. New: detect displacement and, when it happened, resolve the same rule as a filter instead.

```ts
const accessIndex = resolveAccessIndex({
  access: args.config?.access,
  user: args.auth?.user ?? null,
  organization: args.auth?.organization,
  resource: args.collection,
  action: CRUD_ACTIONS.read,
});
// `FindServerArgs.withIndex` is a conditional type over `TCollectionSlug`,
// which is still an unresolved type parameter here — TypeScript cannot reduce
// it, so it stays opaque and will not assign to a concrete object type. The
// runtime shape is exactly `{ name, range? }`, which is what `pickQueryIndex`
// takes; the index name and range are already checked against the collection
// at the public call site.
const callerIndex = args.withIndex as
  { name: string; range?: IndexRangeFn } | undefined;
const resolvedIndex = pickQueryIndex({ accessIndex, callerIndex });

// A displaced access index (the caller's differently-named index won the
// `withIndex` slot) still narrows the read set via `.filter()` — see
// `buildQuery` — instead of the constraint being dropped and `hasPermission`
// left as the only backstop.
const accessFilter =
  accessIndex !== undefined && resolvedIndex?.name !== accessIndex.name
    ? resolveAccessConstraint({
        access: args.config?.access,
        user: args.auth?.user ?? null,
        organization: args.auth?.organization,
        resource: args.collection,
        action: CRUD_ACTIONS.read,
      })
    : undefined;

const findQuery = buildQuery<DataModel, TCollectionSlug, TPopulate, D>({
  ...args,
  resolvedIndex,
  accessFilter,
});
```

The `totalDocs` counting path further down (`const countQuery = buildQuery(args);`, `packages/core/src/api/find/server.ts:281`) is left as-is — it already omits `resolvedIndex` too, for the same reason: an accurate table-wide count needs the full scan, and `hasPermission`'s per-document pass still excludes non-permitted rows there regardless of what narrowed the read. Correctness doesn't depend on `accessFilter` reaching that path, only cost does, matching the existing `resolvedIndex` omission.

**3 — `buildQuery`** (`packages/core/src/api/find/server.ts:319-346`). `withIndex` and `order` are unchanged. `filter` gains the displaced-constraint branch.

```ts
function buildQuery<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<
    string,
    never
  >,
  const D extends number = 0,
>(
  args: FindServerArgs<DataModel, TCollectionSlug, TPopulate, D> & {
    resolvedIndex?: QueryIndex;
    accessFilter?: ReturnType<typeof resolveAccessConstraint>;
  },
): QueryInitializer<NamedTableInfo<DataModel, TCollectionSlug>> {
  const tableName = args.collection;
  let q = args.ctx.db.query(tableName);

  // 1. withIndex — narrows the scan (most efficient).
  if (args.resolvedIndex) {
    // @ts-expect-error building query piece by piece from query args
    q = args.resolvedIndex.range
      ? q.withIndex(args.resolvedIndex.name, args.resolvedIndex.range)
      : q.withIndex(args.resolvedIndex.name);
  }
  // 2. order — applied after index selection.
  // @ts-expect-error building query piece by piece from query args
  if (args.order) q = q.order(args.order);
  // 3. filter — caller's own predicate, `and`-ed with a displaced access
  //    constraint when one applies, instead of the constraint being dropped.
  if (args.accessFilter) {
    q = args.filter
      ? // Caller ALSO supplied `filter`: both must narrow, so `and` them into
        // one callback, invoked with the SAME `filterQ` — `accessFilter` and
        // `args.filter` are each `(q: FilterBuilder<…>) => ExpressionOrValue<boolean>`;
        // never call one with a different builder instance than the other.
        q.filter((filterQ) =>
          filterQ.and(args.accessFilter!(filterQ), args.filter!(filterQ)),
        )
      : // No caller `filter`: apply the compiled constraint alone.
        q.filter(args.accessFilter);
  } else if (args.filter) {
    q = q.filter(args.filter);
  }

  return q;
}
```

#### packages/core/src/api/test/convex/schema.ts

**1 — `posts` table.** Adds `by_slug`, additive.

```ts
  posts: defineTable({
    title: v.string(),
    slug: v.string(),
    body: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    deleted: v.optional(v.boolean()), // For soft delete tests
    author: v.optional(v.array(v.id("authors"))),
    parent: v.optional(v.array(v.id("posts"))), // self-ref for depth tests
  })
    .searchIndex("search_title", { searchField: "title" })
    .index("by_featured", ["featured"])
    .index("by_slug", ["slug"]),
```

#### packages/core/src/api/find/server.test.ts

**1 — imports.** Add the access-config builders used by the new fixture, matching the convention already established in `get/server.test.ts`.

```ts
import { defineCollection, text, checkbox } from "../../index";
import { defineAccess } from "../../access/config";
```

**2 — new fixture + describe block, appended after the existing `describe("find (server) — depth auto-populate", …)` block.** The rule uses the current two-callback shape: one `constraints` callback, no sibling `withIndex` property; opting into the index happens inside the callback by calling `q.withIndex("by_featured", (ix) => ix.eq("featured", true))` — the range lives in its own callback argument, the same as Convex's own `.withIndex(name, (q) => …)`, not chained directly off `q`.

```ts
// ── Access-constraint narrowing fixture ────────────────────────────────────
const constrainedPostsResource = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text(), featured: checkbox() },
});

const constrainedAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [constrainedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        posts: {
          read: {
            constraints: (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              { q }: { q: any },
            ) => q.withIndex("by_featured", (ix) => ix.eq("featured", true)),
          },
        },
      },
    },
  }),
} as unknown as VexConfig;

const contributorAuth = { user: { _id: "u1", roles: "contributor" } };

describe("find (server) — access constraints", () => {
  test("access index claims a free slot: returns a full page of only permitted rows", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await ctx.db.insert("posts", {
          title: "Featured 1",
          slug: "f1",
          featured: true,
        });
        await ctx.db.insert("posts", {
          title: "Featured 2",
          slug: "f2",
          featured: true,
        });
        await ctx.db.insert("posts", {
          title: "Featured 3",
          slug: "f3",
          featured: true,
        });
        await ctx.db.insert("posts", {
          title: "Draft 1",
          slug: "d1",
          featured: false,
        });
        return find({
          ctx,
          collection: "posts",
          config: constrainedAccess,
          auth: contributorAuth,
          limit: 3,
        } as any);
      },
    );
    expect(docs).toHaveLength(3);
    expect(docs.every((d: any) => d.featured)).toBe(true);
  });

  test("caller's index displaces the access index: constraint still narrows via filter, full page", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        // Insertion/slug order deliberately interleaves non-featured docs
        // ahead of featured ones, so a naive `.take(3)` in slug order (without
        // the compiled constraint in `.filter()`) would read "a","b","c" — two
        // non-featured — and `hasPermission` would strip them afterward,
        // producing a page of length 1.
        await ctx.db.insert("posts", {
          title: "a",
          slug: "a",
          featured: false,
        });
        await ctx.db.insert("posts", {
          title: "b",
          slug: "b",
          featured: false,
        });
        await ctx.db.insert("posts", { title: "c", slug: "c", featured: true });
        await ctx.db.insert("posts", { title: "d", slug: "d", featured: true });
        await ctx.db.insert("posts", { title: "e", slug: "e", featured: true });
        return find({
          ctx,
          collection: "posts",
          config: constrainedAccess,
          auth: contributorAuth,
          // Names a DIFFERENT index than the access rule's `by_featured` —
          // `pickQueryIndex` gives the `withIndex` slot to this caller index.
          withIndex: { name: "by_slug" },
          limit: 3,
        } as any);
      },
    );
    // With the constraint `and`-ed into `.filter()` before `.take(3)`, only
    // featured docs are ever read — a full page, in slug order.
    expect(docs).toHaveLength(3);
    expect(docs.every((d: any) => d.featured)).toBe(true);
    expect(docs.map((d: any) => d.slug)).toEqual(["c", "d", "e"]);
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 9 — `search` integration `[dev]`

**Search has no `withIndex` slot to arbitrate.** `find` chooses between the access index and a caller index via `pickQueryIndex`; `search`'s `buildQuery` (`packages/core/src/api/search/server.ts:220-234`) only ever calls `.withSearchIndex(…)`, which is a different, orthogonal narrowing mechanism than `db.query(...).withIndex(…)`. So this step doesn't discriminate on whether the rule's `constraints` callback called `q.withIndex(name, (ix) => …)` — both an indexed and an unindexed rule compile to the same `.filter()`-shaped expression here, via `resolveAccessConstraint`, and `search` composes it the same way regardless of which branch produced it.

- [ ] `packages/core/src/api/search/server.ts` — `and` the compiled filter expression into the search query's `.filter()`. Do **not** attempt to compose onto `SearchFilterFinalizer` — `SearchFilter` and `IndexRange` are distinct nominal types with different operator sets, which is exactly why the earlier attempt failed to typecheck.
- [ ] `packages/core/src/api/search/server.test.ts` — a constrained role's search excludes non-permitted hits inside the query, not after it.
- Verify: `pnpm --filter @vexcms/core test`

**Why not `SearchFilterFinalizer`.** `SearchFilter` and `IndexRange` are distinct nominal abstract classes in `convex/server` with different operator sets — `SearchFilterFinalizer` (what `.withSearchIndex(name, q => q.search(...).eq(...))` builds against) exposes only `.eq()`, and only over fields the search index declares as `filterFields`. Composing a constraint's `IndexRange`-shaped output onto it is exactly the type error the earlier attempt at this hit: `IndexRange is missing eq, _isSearchFilter`. The two abstractions don't share a supertype because Convex's search filters and index ranges are genuinely different query primitives — one is a search-index-scoped equality filter, the other is a range over an ordered B-tree index.

The seam that _does_ exist: `.withSearchIndex(...)` returns an `OrderedQuery`, and `OrderedQuery` still exposes `.filter()` — the same general-purpose predicate slot every other query has, independent of the search filter mechanism. `accessConstraintsToFilter`'s output already targets exactly that slot (Step 8 uses the same compiler, via `resolveAccessConstraint`, against a plain `Query`'s `.filter()`), so no new compile target is needed here; `search` just composes onto a slot it already has, which `find` also uses.

**Deferred: index-backed search filtering.** If the constrained field happens to be declared in the search index's `filterFields`, `SearchFilterFinalizer.eq()` on that field would beat a post-hoc `.filter()` scan — Convex can apply it as part of the search index lookup itself rather than filtering candidates afterward. Composing it requires knowing, per search index, which fields are declared as `filterFields` — a registry this spec doesn't build (see spec.md "Out of Scope"), and it would need a fourth compile target (`accessConstraintsToSearchFilter`, alongside `accessConstraintsToIndexRange`/`accessConstraintsToFilter`/`accessConstraintsToPredicate`) that only some constrained fields could ever use. `.filter()` remains correct in every case, including this one; the registry would only be a performance improvement for the subset of constrained fields that are also declared search filter fields.

#### packages/core/src/api/search/server.ts

**1 — imports.** Add `resolveAccessConstraint` (`packages/core/src/api/search/server.ts:20`).

```ts
import {
  CRUD_ACTIONS,
  hasPermission,
  resolveAccessConstraint,
} from "../../access";
```

**2 — inside `search()`, before `buildQuery` is called** (`packages/core/src/api/search/server.ts:108-118`). Resolved once and threaded to both `buildQuery` call sites (the main query and the `totalDocs` count query, `packages/core/src/api/search/server.ts:177`) — unlike `find`'s count-query gap, search's count must reflect the same narrowing as its main query, since search has no index-based narrowing to fall back to at all.

```ts
export async function search<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: SearchServerArgs<DataModel, TCollectionSlug, TPopulate, D>,
): Promise<
  SearchReturn<TCollectionSlug, TPopulate, D> | SearchReturnPaginated<TCollectionSlug, TPopulate, D>
> {
  // Search has no `withIndex` slot at all, so there is no arbitration step
  // (`pickQueryIndex`) the way `find` has — a constrained role's rule always
  // narrows here via `.filter()` when it applies.
  const accessFilter = resolveAccessConstraint({
    access: args.config?.access,
    user: args.auth?.user ?? null,
    organization: args.auth?.organization,
    resource: args.collection,
    action: CRUD_ACTIONS.read,
  });
  const searchQuery = buildQuery({ ...args, accessFilter });
  ...
```

(The body from `let docs: …` through the pagination branches is unchanged — only the `buildQuery(args)` call on the count-query path, further down, changes:)

```ts
// Build same search query but collect all to count
const countQuery = buildQuery({ ...args, accessFilter }); // Same search params + narrowing
```

**3 — `buildQuery`** (`packages/core/src/api/search/server.ts:220-234`). `withSearchIndex` is unchanged. New: `.filter()` with the compiled constraint.

```ts
function buildQuery<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<
    string,
    never
  >,
  const D extends number = 0,
>(
  args: SearchServerArgs<DataModel, TCollectionSlug, TPopulate, D> & {
    accessFilter?: ReturnType<typeof resolveAccessConstraint>;
  },
): QueryInitializer<NamedTableInfo<DataModel, TCollectionSlug>> {
  let q = args.ctx.db.query(args.collection);
  if (args.query) {
    // @ts-expect-error building query piece by piece from query args
    q = q.withSearchIndex(args.searchIndexName, (sq) =>
      sq.search(args.searchField, args.query),
    );
  }
  // `withSearchIndex` returns an `OrderedQuery`, which still exposes
  // `.filter()` — composing here (never on `SearchFilterFinalizer`, see the
  // file-level note above `search()`) is what lets an access constraint
  // narrow a query with no `withIndex` slot at all.
  if (args.accessFilter) {
    q = q.filter(args.accessFilter);
  }
  return q;
}
```

#### packages/core/src/api/search/server.test.ts

**1 — imports.**

```ts
import { defineCollection, text, checkbox } from "../../index";
import { defineAccess } from "../../access/config";
```

**2 — new fixture + describe block, appended after the existing `describe("search (server) — depth auto-populate", …)` block.** Uses the empty-query `.take()` path (`query: ""`), not a real full-text search — `convex-test` v0.0.38 doesn't implement `withSearchIndex` (see the existing "non-empty query does not throw" test, unshown), but `buildQuery`'s `.filter()` composition runs identically on both paths, so this exercises the exact same narrowing without depending on unsupported test infrastructure. The rule deliberately does **not** call `q.withIndex(…)` — search has no `withIndex` slot to give it, so the natural rule to write here is the unindexed, predicate-only form: a single `.filter((f) => …)` callback with no `withIndex` companion.

```ts
// ── Access-constraint narrowing fixture ────────────────────────────────────
const constrainedPostsResource = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text(), featured: checkbox() },
});

const constrainedAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [constrainedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        posts: {
          read: {
            constraints: (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              { q }: { q: any },
            ) => q.filter((f: any) => f.eq("featured", true)),
          },
        },
      },
    },
  }),
} as unknown as VexConfig;

const contributorAuth = { user: { _id: "u1", roles: "contributor" } };

describe("search (server) — access constraints", () => {
  test("excludes non-permitted hits inside the query: full page, not a ragged one", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        // Insertion order interleaves non-featured docs ahead of featured
        // ones — a `.take(3)` without the constraint composed into `.filter()`
        // would read "a","b","c" (two non-featured), and the per-document
        // `hasPermission` pass afterward would strip them, producing a page of
        // length 1 instead of 3.
        await ctx.db.insert("posts", {
          title: "a",
          slug: "a",
          featured: false,
        });
        await ctx.db.insert("posts", {
          title: "b",
          slug: "b",
          featured: false,
        });
        await ctx.db.insert("posts", { title: "c", slug: "c", featured: true });
        await ctx.db.insert("posts", { title: "d", slug: "d", featured: true });
        await ctx.db.insert("posts", { title: "e", slug: "e", featured: true });
        return search({
          ctx,
          collection: "posts",
          query: "",
          searchIndexName: "search_title",
          searchField: "title",
          config: constrainedAccess,
          auth: contributorAuth,
          limit: 3,
        } as any);
      },
    );
    expect(docs).toHaveLength(3);
    expect(docs.every((d: any) => d.featured)).toBe(true);
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 10 — `get` and client-side interpretation `[dev]`

- [ ] `packages/core/src/access/hasPermission.ts` — when a resolved check is the constraints form (`ConstrainedPermissionCheck`) and `data` is supplied, call its `constraints` callback with a fresh `createAccessQueryBuilder()` and read what it returned via `readAccessCondition`, then interpret that condition directly as a JS predicate — `accessConstraintsToPredicate` for the index half, `accessFilterTreeToPredicate` for the filter half, `and`-ed together when both are present (mirrors `resolveAccessConstraint`'s compile-time AND for the query path). This is what keeps `usePermission` working on an already-fetched document — a rule's `constraints` resolve to a value, not a callback, so unlike a plain callback (the branch below it, unchanged) there is exactly one thing to compile it to per consumer: a `withIndex` range for `resolveAccessIndex`, a `.filter()` expression for `resolveAccessConstraint`, and now a predicate here (design invariant: a condition is bidirectional, a callback is not).
- [ ] `packages/core/src/access/hasPermission.test.ts` — a constraints-only rule (no `filter`) resolves correctly for a document that satisfies it and one that does not.
- Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react build`

**Why no `get/server.ts` or client-code changes.** `get`'s RBAC check (`hasPermission({ throwOnDenied: true, ..., data: doc })`, unshown, already in place) and `packages/react`'s `usePermission` hook both call `hasPermission` directly with `data` already in hand — per P-004, RBAC runs client-side by calling `hasPermission` the same way the server does, no server-computed snapshot. `get` fetches a single document, not a query — there is no `withIndex` slot and nothing to page, so it goes straight to the predicate compile target; it never touches `accessConstraintsToIndexRange` or `accessConstraintsToFilter` at all. Neither call site special-cases the constraints form today; fixing `hasPermission` itself is sufficient to close the loop everywhere a callback used to be the only option. This is the design invariant this whole spec turns on (spec.md decision 3): a `constraints` descriptor is _data_, so it compiles down to a Convex expression (Steps 7–9) **and** interprets directly in JS against an already-fetched document (this step) — the same returned condition serves both, which is exactly what a callback cannot do.

#### packages/core/src/access/hasPermission.ts

**1 — imports.** Add a type-only `GenericDocument` import, `AccessConditionResult` (from `./constraintTypes`), `createAccessQueryBuilder` and the new `readAccessCondition` (from `./createAccessQueryBuilder`), `accessConstraintsToPredicate` and the new `accessFilterTreeToPredicate` (from `./compileConstraints`), and `ConstrainedPermissionCheck` added to the existing type-only import from `./types` (`packages/core/src/access/hasPermission.ts:1-10`).

```ts
import type { GenericDocument } from "convex/server";
import { PERMISSION_MODES, PERMISSION_SCOPES, PermissionScope, WILDCARD_KEY } from "./constants";
import { VexAccessError } from "./types";
import type { AccessConditionResult } from "./constraintTypes";
import { createAccessQueryBuilder, readAccessCondition } from "./createAccessQueryBuilder";
import { accessConstraintsToPredicate, accessFilterTreeToPredicate } from "./compileConstraints";
import type {
  ConstrainedPermissionCheck,
  FieldPermissionResult,
  PermissionCallbackProps,
  PermissionCheck,
  ResolvedFieldPermissions,
  SubjectEntry,
  VexAccessConfig,
} from "./types";
```

**2 — `isConstrainedCheck` (new, module-private).** Same discriminator as `resolveAccessRule.ts`'s own `isConstrainedCheck`, kept independent rather than imported — `hasPermission.ts` sits _below_ `resolveAccessRule.ts` in the dependency order (`resolveAccessRule.ts` already imports `resolveActionCheck` from here), so importing back would invert it for a three-line predicate. `field`-mode is still a valid member of `BasePermissionCheck` until Step 14, so this only needs to separate the one object shape that has `constraints` from every other shape — booleans, callbacks, and field-mode objects alike.

```ts
/**
 * True when a resolved check is the constraint-builder object form
 * (`{ constraints, filter? }`) rather than a boolean, a callback, or a
 * field-mode object.
 * @internal
 */
function isConstrainedCheck(
  check: PermissionCheck,
): check is ConstrainedPermissionCheck {
  return typeof check === "object" && check !== null && "constraints" in check;
}
```

**3 — `resolvePermissionCheck`** (`packages/core/src/access/hasPermission.ts:199-265`). New branch inserted before the existing `typeof props.check !== "function"` check; that check and everything below it (the callback capability-probe machinery) is unchanged.

```ts
function resolvePermissionCheck<TData, TUser, TOrg, TFieldKeys extends string>(props: {
  check: PermissionCheck;
  user: TUser;
  data?: TData;
  organization?: TOrg;
  resource: string;
  action: string;
  scope: PermissionScope;
}): FieldPermissionResult<TFieldKeys> {
  if (isConstrainedCheck(props.check)) {
    if (props.data === undefined) {
      // A constraint predicate always needs the document to evaluate — the
      // `constraints` callback never reads `data` at all (it builds a query
      // condition, not a per-document check), so unlike the plain-callback
      // branch below there is nothing to probe: this is unconditional, not a
      // fallback for a callback that *might* touch data.
      if (props.scope === PERMISSION_SCOPES.any) return true as FieldPermissionResult<TFieldKeys>;
      if (props.scope === PERMISSION_SCOPES.all) return false as FieldPermissionResult<TFieldKeys>;
      throw new VexAccessError({
        resource: props.resource,
        action: props.action,
        message:
          `hasPermission: "${props.resource}.${props.action}" needs a "data" object ` +
          `(its check is a constraints rule). Pass "data" for an exact check, or use ` +
          `scope: "any" (nav/list gating) or scope: "all" (bulk actions).`,
      });
    }

    // Re-run the rule's `constraints` callback against a FRESH builder to
    // recover what it returned — `defineAccess` ran it once at module load
    // only to validate it eagerly (Step 6's `validateAccessConstraints` wiring); a fresh `q` is needed
    // per call since `hasPermission` may see a different document each time
    // and the returned condition never depends on `data` in the first place,
    // so re-invoking is cheap and pure (`createAccessQueryBuilder` composes
    // its own index/filter builders per call and never lets them escape
    // their own callback).
    const outcome: boolean | AccessConditionResult = props.check.constraints({
      user: props.user,
      q: createAccessQueryBuilder(),
      ...(props.organization !== undefined ? { organization: props.organization } : {}),
    } as Parameters<typeof props.check.constraints>[0]);

    // The callback may short-circuit to a flat allow/deny instead of
    // returning a condition — a rule reading
    // `({ user, q }) => user.isAdmin || q.filter(…)` is the common case.
    // `resolveAccessRule.ts`'s `classifyRole` handles the identical shape for
    // the query path; mirrored here so a callback answers the same way
    // whichever consumer runs it.
    if (typeof outcome === "boolean") {
      if (!outcome) return false as FieldPermissionResult<TFieldKeys>;
    } else {
      const condition = readAccessCondition<GenericDocument>(outcome);
      // A condition this module cannot read did not come from `q` — treat it
      // as describing nothing rather than assuming it describes everything,
      // same as `classifyRole`'s "opaque" branch. Neither half present (or no
      // condition at all) means the rule excludes nothing here, so the
      // predicates below simply have nothing to reject.
      if (condition !== undefined) {
        const { index, filter } = condition;
        // BOTH halves may be populated, and that is not a conflict — it is
        // `.withIndex(name, range).filter(expr)`, Convex's own shape.
        // `accessConstraintsToPredicate` interprets the index half (never
        // empty — the range callback is required); `accessFilterTreeToPredicate`
        // interprets the filter half's full tree, `and`/`or`/`not` included.
        // ANDing both here mirrors `resolveAccessConstraint`'s compile-time
        // AND for the query path, so the per-document answer and the query
        // narrowing never disagree.
        const indexPermitted =
          index === undefined ||
          accessConstraintsToPredicate({ constraints: index.constraints })(
            props.data as never,
          );
        const filterPermitted =
          filter === undefined ||
          accessFilterTreeToPredicate({ node: filter })(props.data as never);
        if (!indexPermitted || !filterPermitted) {
          return false as FieldPermissionResult<TFieldKeys>;
        }
      }
    }

    // `filter` is optional and additive, not a duplicate expression of the
    // same rule — when present, recurse so the existing callback/boolean/
    // field-mode handling below evaluates it. `props.check.filter` may itself
    // be a boolean, a callback, or (until Step 14 removes it) a field-mode
    // object — the recursive call already handles all three via the
    // `typeof check !== "function"` branch just below, so nothing here needs
    // to know which it got.
    if (props.check.filter !== undefined) {
      return resolvePermissionCheck({ ...props, check: props.check.filter });
    }
    // No `filter`: the constraint alone is authoritative.
    return true as FieldPermissionResult<TFieldKeys>;
  }

  if (typeof props.check !== "function") {
    return props.check as FieldPermissionResult<TFieldKeys>;
  }

  const callbackProps = {
    user: props.user,
    data: props.data !== undefined ? props.data : undefined,
    organization: props.organization !== undefined ? props.organization : undefined,
  } as PermissionCallbackProps;
  if (props.data !== undefined) {
    const result = props.check(callbackProps);
    return result === undefined ? false : (result as FieldPermissionResult<TFieldKeys>);
  }

  try {
    // no data → probe whether the callback DEPENDS on data (throws the sentinel on ANY access;
    // Proxy is truthy so `?.` doesn't short-circuit, unlike a bare `undefined`)
    const probe = new Proxy(
      {},
      {
        get() {
          throw { [CAPABILITY_PROBE]: true };
        },
        has() {
          throw { [CAPABILITY_PROBE]: true };
        },
        ownKeys() {
          throw { [CAPABILITY_PROBE]: true };
        },
      },
    );
    const result = props.check({ ...callbackProps, data: probe });
    return result === undefined ? false : (result as FieldPermissionResult<TFieldKeys>);
  } catch (e) {
    const touchedData =
      typeof e === "object" &&
      e !== null &&
      (e as Record<symbol, unknown>)[CAPABILITY_PROBE] === true;
    if (!touchedData) throw e; // a real error from the callback body — never swallow it
    // The callback needs the document and none was supplied — answer the
    // quantified question the caller asked for. See `PERMISSION_SCOPES`.
    if (props.scope === PERMISSION_SCOPES.any) {
      // "at least one document" — a per-doc condition may hold for some row.
      return true;
    }
    if (props.scope === PERMISSION_SCOPES.all) {
      // "every document" — a per-doc condition means it cannot hold for all.
      return false;
    }
    throw new VexAccessError({
      resource: props.resource,
      action: props.action,
      message:
        `hasPermission: "${props.resource}.${props.action}" needs a "data" object (its check reads the document). ` +
        `Pass "data" for an exact check, or use scope: "any" (nav/list gating) or scope: "all" (bulk actions).`,
    });
  }
}
```

#### packages/core/src/access/hasPermission.test.ts

**1 — new fixture + describe block, appended at the end of the file.** `articles` and `asUser` are the existing top-of-file fixtures (unshown, unchanged) — `read` is a query-shaped action, so the constraint-builder object form is valid there per `RolePermissions`'s gating.

```ts
/**
 * Constraints-only fixture: a query-shaped `read` rule declared purely as
 * `{ constraints }`, no `filter` — proves `hasPermission` derives the
 * per-document check from the SAME declaration `resolveAccessIndex` compiles
 * to a range from (design invariant: one condition, two consumers).
 */
const constraintsOnlyAccess = defineAccess({
  roles: ["contributor"] as const,
  resources: [articles],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    contributor: {
      articles: {
        read: {
          constraints: (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { q }: { q: any },
          ) => q.withIndex("by_status", (ix) => ix.eq("status", "published")),
        },
      },
    },
  },
});

describe("hasPermission — constraints-only rule (no filter)", () => {
  it("allows a document that satisfies the constraint", () => {
    expect(
      hasPermission({
        access: constraintsOnlyAccess,
        user: asUser("contributor"),
        resource: "articles",
        action: "read",
        data: { title: "Live", slug: "live", status: "published" } as never,
      }),
    ).toBe(true);
  });

  it("denies a document that does not satisfy the constraint", () => {
    expect(
      hasPermission({
        access: constraintsOnlyAccess,
        user: asUser("contributor"),
        resource: "articles",
        action: "read",
        data: { title: "Draft", slug: "draft", status: "draft" } as never,
      }),
    ).toBe(false);
  });
});
```

Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react build`

### Step 11 — Composable access checks `[dev]` — DONE (rev 6)

Goal: define one piece of access logic and reuse it across resources and roles
without restating it, while a call site still reads like the inline object it
replaces.

**Rev 6 replaces rev 5's approach.** Rev 5 built rule factories in core —
`accessRule`, `sharedRule`, `resourceRules`, `roleRules`, `sharedResourceRules`,
`ConstraintFragment`. They worked and were deleted. What follows is the shipped
design and the measurements that produced it.

#### Files

- `packages/core/src/access/types.ts` — exports `AccessCheckFor`,
  `AccessMutationCheckFor`, `AccessDocFor`, `AccessFieldKeysFor`,
  `AccessIndexFieldsFor`.
- `apps/www/src/auth/permissions.ts` — the project's checks.
- `apps/www/src/auth/access.ts` — one line per resource per action.

#### Why the helpers live in the project

A check must name the project's user and organization document types to be
assignable to `permissions[role][resource][action]`. Core cannot know them, and
threading them through a core factory reintroduces exactly the generic-plumbing
P-002 forbids. So core exports the slug-keyed derivations and the project writes
six small functions.

`AccessFieldKeysFor` originally earned its keep by papering over a discrepancy: the
framework's field-key union came from the generated field-type maps — declared
fields plus a synthetic `id: "_id"` entry — and excluded `_creationTime`, so
`keyof AccessDocFor<S>` produced a union that looked identical and would not
assign, with the cause buried six levels deep under `fields` inside the field-mode
object. That trap cost a debugging cycle. Rev 6 removed the discrepancy itself
rather than the symptom (DD 37): field keys are now derived FROM the document, the
two agree, and the alias is a convenience pointing at the framework's definition.

#### The surface

| Check | Shape | Compiles to |
|---|---|---|
| `readWhere(c, field, value)` | query | `q.withIndex(index, ix => ix.eq(field, value))` |
| `readOwn(c, field)` | query | same, with `[user._id]` built per request |
| `readPublished(c, field)` | query | `readWhere` with `[CONTENT_STATUS.published]` |
| `readAny(c)` | query | `true` |
| `readRaw(c, constraints)` | query | the caller's own callback, unwrapped |
| `ownOnly(c, field)` | mutation | per-document predicate on the owner field |
| `anyOne(c)` | mutation | `true` |

Each takes the collection config first. That value binds `S`, which types the
field argument (`IndexedField<S>` — fields that LEAD a declared index), the
document, and the builder. The index NAME is recovered at runtime from
`collection.fields[field].index`, with a throw for the case the types already
exclude — a silent full scan while the author believes their rule was pushed down
is the worse failure.

`StatusField<S>` narrows `readPublished`'s field to indexed fields holding
`ContentStatus` values, so `readPublished(articles, "authorId")` cannot compile
into a comparison that matches nothing.

#### Measured limits

1. **Type parameters cannot be inferred from the call position.** A helper with
   five type parameters called at `permissions.contributor.articles.read` infers
   `unknown` for all five: the contextual type is a union
   (`PermissionCheck<…> | undefined`) and TypeScript's return-type inference bails
   on union-to-union. Hence the collection-as-argument.
2. **A generic callback cannot be used to fan out.**
   `forEach(resources, (c) => ({ read: readOwn(c, "authorId") }))` does not
   compile — inside the callback `S` is unbound, `IndexedField<S>` is an unreduced
   conditional, and no concrete field name satisfies it. Same wall as rev 5's
   generic `ConstraintFragment`.
3. **A descriptor form DOES work**, if fan-out is ever wanted: pass the
   per-resource variation as data keyed by slug
   (`{ ownerField: { articles: "authorId", comments: "authorId" } }`), and the
   helper call happens inside with a concrete `S`. Per-key negatives are rejected.
   Not adopted: one line per resource is preferred for readability.
4. **`keyof`-based field unions tolerate an unbound `S`** where mapped-tuple
   conditionals do not — `ownOnly` compiles inside a generic callback, `readOwn`
   does not. The limitation is specific to index-derived unions.

#### What the shape buys over rev 5

- **No `check` property.** A helper returns the check, so it drops into the action
  slot directly. Rev 5's `check` existed only because a rule object had to hold
  `boolean | callback | object` in one property alongside `resource`/`action`.
- **No resource list.** Rev 5's `sharedRule` required every listed resource to
  declare the same index name over an identical field tuple, which is why
  `comments` (no `status`) could not join the status rules. A per-resource call
  takes the field name as an argument, so `authorId` here and `ownerId` there both
  work.
- **No `q: any` failure mode.** Rev 5's `accessRule` was overloaded, so a typo'd
  index collapsed overload resolution, stripped `q`'s contextual type, and reported
  `No overload matches this call` at the call rather than at the typo. The helpers
  are single-signature, and the named ones never expose `q` at all.
- **Branding for free.** `readOwn(articles, …)` returns `Check<"articles">`, so
  placing it under `case_studies` is rejected even though both declare `authorId`
  and `by_author`. Rev 5 needed an explicit `resource` brand because its erasure
  destroyed the type that already carried this.
- **Action-shape checking back where it belongs.** `update: readOwn(…)` is rejected
  by `RolePermissions` (DD 14) with no helper-side bound: an index-pushing check
  demands an `AccessQueryBuilder`, a mutation slot supplies an
  `AccessPredicateBuilder`, and parameter contravariance does the rest.

#### Two rev-5 bugs that are now unrepresentable

Both were consequences of the factory shape, not of the framework:

- The `QueryAction` bound. Rev 5 erased `check`'s type to make a rule storable,
  which blinded `RolePermissions`' own action gate — so an indexed rule on `update`
  compiled and then called `q.withIndex` on a builder without it. The bound was a
  hand-rolled replacement for a guard the framework already had.
- The `withIndex` adaptation. Rev 5 let the caller author only the index RANGE and
  bridged it into a full `constraints` callback. The bridge forwarded instead of
  adapting, so `q` arrived `undefined` and threw on first use. `defineAccess`
  caught it at config time, but only once a rule was registered — and a unit test
  asserting `withIndex` was *called* without invoking the range it was handed had
  passed over it.

#### Deleted

`packages/core/src/access/defineRules.ts` (683 lines) and its test (290), the
barrel line, the shared-rule blocks in `api/find/server.test.ts` (~90), and
`apps/www/src/auth/editorialRules.ts` (163). Gone with them: `accessRule`,
`sharedRule`, `resourceRules`, `roleRules`, `sharedResourceRules`,
`ConstraintFragment`, `ResourceRuleSet`, `RoleRuleSet`, `SharedAccessRule`.

#### Verification

- `pnpm --filter @vexcms/core test` — 629 passing, 0 type errors.
- `pnpm --filter www typecheck` — 0 errors.
- `vex generate` loads `vex.config.ts`, so `defineAccess` executes every
  helper-built constraints callback through `validateAccessConstraints` at config
  time. A malformed check fails there, before any request.
- Runtime narrowing was proven during development against the `convexTest` harness
  (index pushdown, ragged-page discriminator, cross-resource reuse on differing
  fields, mutation-tested). Those probes were removed with the factories; `apps/www`
  has no test harness, so the shipped permanent coverage is the config-time
  validation above plus core's existing inline-`constraints` tests, which exercise
  the identical check shape. **Gap: no permanent test of `indexNameFor` or the
  `[user._id]` array wrapping.**

### Step 12 — `apps/www` migration `[dev]`

- [ ] `apps/www/src/auth/access.ts` — migrate at least one role to `constraints`,
      keep one callback rule as the documented escape hatch.
- [ ] `pnpm --filter www vex generate` — regenerate types.

`pages` declares two indexes today — an explicit `slug: text({ index: "by_slug" })`
and an auto-generated `by_themes` index for the `themes` relationship field (every
relationship field gets an implicit `by_<fieldKey>` index unless it declares its own,
per `collectResourceIndexFields`) — but no per-author or per-organization field exists
on the collection yet, so this migration scopes the `user` role to a single named page
rather than inventing a field that is out of scope for this spec (a real per-author
scope would need Step 11's `accessRule` against a genuine ownership field once one
exists). `images.update`'s existing `!image.src.includes("https://maprios.com")` check
is KEPT UNCHANGED as the documented escape hatch — string `.includes()` has no
`FilterBuilder` equivalent (Step 13's docs page), so it stays a callback by design, not
by omission.

#### `apps/www/src/auth/access.ts`

One edit — everything else (`edit`, `headers`, `footers`, `adminPanel`, `nav`, and the
`images.update` callback) is unchanged.

**1 — `pages.read` migrates from an unrestricted grant to `constraints`.** Replace the
existing `read: true,` line inside the `user` role's `pages` block with:

```ts
        read: {
          constraints: ({ q }) => q.withIndex("by_slug", (ix) => ix.eq("slug", "home")),
        },
```

`IndexFieldsBySlug["pages"]` is already populated at schema-generation time regardless
of whether any access rule references it — from `slug`'s declared index and the
`themes` relationship's auto `by_themes` index, the same way `collectResourceIndexFields`
reads it for the `AccessQueryBuilder`'s `TIndexFields` generic. What `vex generate`
changes here is narrower: `pages.read`'s `withIndex("by_slug", …)` call now
type-checks its first argument against `keyof IndexFieldsBySlug["pages"]` —
`withIndex("by_author", …)` would be a compile error, since `pages` declares no such
index. It's the first rule in this project to call `withIndex` at all.

Verify: `pnpm --filter www typecheck && pnpm --filter www build`

### Step 13 — Remove the deprecated range callback + docs `[dev]`

> **The type deletion in this step is already DONE**, pulled forward during Step 7.
> `resolveAccessRule` could not be written against two check shapes at once, so
> `AccessIndex`, the deprecated `IndexedPermissionCheck` member, `PermissionCheck`'s
> `TIndexName` parameter, and the whole `AccessIndexBySlug` / `AccessIndexNameFor`
> chain (type, emitter, and its three generator tests) were deleted together. What
> remains here is the DOCS work below.

- [ ] `packages/core/src/access/types.ts` — verification + doc cleanup, no type
      edit: `AccessIndex` and `IndexedPermissionCheck` are already gone, but four
      `{@link AccessIndex}` / `{@link IndexedPermissionCheck}` doc-comment
      cross-references and one orphaned `@typeParam TIndexName` block still point
      at declarations TypeDoc can no longer resolve.
- [ ] `packages/core/src/access/pickQueryIndex.ts` — `composeRanges` survives
      unchanged; confirm no reference to the deleted type remains.
- [ ] `packages/core/src/access/resolveAccessRule.ts` — verification-only: Step 7
      already migrated `classifyRole`/`isConstrainedCheck` off
      `IndexedPermissionCheck` onto the `AccessCondition` a rule's `constraints`
      callback returns, so this step's doc cleanup in `types.ts` should find
      nothing left to break here; confirm.
- [ ] `apps/docs/src/content/docs/guides/access-control.mdx` — constraints as the
      recommended form, authored in the two-callback shape; the callback escape
      hatch and its ragged-page consequence; the indexable boundary, now enforced
      by CONFINEMENT between the `.filter(...)` and `withIndex(...)` callbacks
      rather than by narrowing a single builder's type; fragment composition,
      now entered through the range callback's own `ix`; that capability
      differences belong in roles, not branches.

#### `packages/core/src/access/types.ts`

No type declaration to delete — `AccessIndex`, `IndexedPermissionCheck`, and
`PermissionCheck`'s `TIndexName` parameter are already gone (Step 7);
`PermissionCheck` is already the two-way union `BasePermissionCheck |
ConstrainedPermissionCheck<TData, TUser, TOrg, TFieldKeys,
AccessQueryBuilder<TData, TIndexFields>>`. What Step 7's type-level cutover left
behind is doc-comment prose that still narrates the shape it replaced — four
dangling `{@link}` cross-references and one orphaned `@typeParam` block, each
pointing at a declaration TypeDoc can no longer resolve (`jsdoc-conventions.md`'s
link-hygiene rule fails the build on exactly this). Five fixes, all prose:

**1 — `BasePermissionCheck`'s doc.** "No `withIndex` — see `{@link
IndexedPermissionCheck}` for the object form." → repoint at `{@link
ConstrainedPermissionCheck}`, the shape that actually carries `constraints` now.

**2 — `QueryIndex`'s doc.** Delete the "Distinct from `{@link AccessIndex}`…" and
"…guaranteed on `{@link AccessIndex}` rather than restated…" paragraphs outright —
nothing replaces them. `QueryIndex` (the resolved, per-caller shape `resolveAccessIndex`
and `pickQueryIndex` produce) no longer has an authored counterpart to contrast
itself against by name; the guarantee that an access-sourced range is never absent
already lives where it belongs, on `AccessQueryBuilder.withIndex`'s own doc
(`constraintTypes.ts`) — restating it here would just be a second dangling link
away from going stale again.

**3 — `AnyActionPermissionCheck`'s doc.** "The only thing a query-shaped action
adds on top is `{@link IndexedPermissionCheck}`'s `withIndex` hint — see `{@link
PermissionCheck}`, which is exactly this union plus that." → rewrite to name the
real remaining difference: "The only thing a query-shaped action adds on top is
`q`'s type — see `{@link PermissionCheck}`, whose `ConstrainedPermissionCheck`
member upgrades `q` from `{@link AccessPredicateBuilder}` to `{@link
AccessQueryBuilder}` so `withIndex` is reachable."

**4 — `RolePermissions`'s doc.** "a query-shaped action gets the full `{@link
PermissionCheck}`, including `{@link IndexedPermissionCheck}`'s `withIndex` hint —
there is a query to narrow." → same fix: "a query-shaped action gets the full
`{@link PermissionCheck}`, whose `q` is upgraded to an `{@link
AccessQueryBuilder}` — there is a query to narrow."

**5 — `PermissionCheck`'s own doc.** Two more casualties of the same Step 7 edit,
neither caught by name in Step 7's changeset because neither is a `{@link}`: "and
the deprecated `{ filter, withIndex }` pair" in the opening paragraph, and "(plus
the deprecated member)" in the paragraph naming the difference from
`AnyActionPermissionCheck`, both describe the third union member Step 7 already
removed — drop both clauses. And the `@typeParam TIndexName` block ("Union of
index names declared on the resource… Used only by the deprecated member.")
documents a parameter `PermissionCheck`'s signature no longer has —
`TData, TUser, TOrg, TFieldKeys, TIndexFields`, no `TIndexName` — so it comes out
too.

Whether the near-duplication between `PermissionCheck` and
`AnyActionPermissionCheck` (identical apart from `q`'s type) is worth collapsing
into one generic type parameterized on `TQ` is a real decision, but it is THIS
step's decision, not this spec's: flag it in the PR rather than resolving it here.

#### `packages/core/src/access/pickQueryIndex.ts`

No code change. `composeRanges` and `pickQueryIndex` import only `IndexRangeFn` and
`QueryIndex` from `./types` — neither references `AccessIndex`, and grepping this
package for the bare identifier `AccessIndex` (not `resolveAccessIndex`,
`warnDisplacedAccessIndex`, or the `accessIndex`/`accessIndexName` variables/params
that merely contain the substring) turns up nothing at all: the declaration itself
is gone, and nothing in this file ever referenced it as a type. This step is a
verification-only checkbox for that file.

#### `packages/core/src/access/resolveAccessRule.ts`

Also verification-only, and for the same reason. By the time this step runs, Step 7
has already rewired `classifyRole` to route through `isConstrainedCheck` — the type
predicate that replaced `isIndexedCheck`, since every check now shares one `{
constraints, filter? }` shape and "is this rule indexed" is a RUNTIME outcome of
running `constraints`, not something a type predicate can settle upfront — and to
read the callback's result back via `readAccessCondition` instead of
`IndexedPermissionCheck.withIndex`. This file should hold no reference to either
`IndexedPermissionCheck` or `AccessIndex` by construction — confirm rather than
assume, and fix any surviving mention (a stray comment, most likely, not a type
reference: the compiler would already refuse to build otherwise).

#### `apps/docs/src/content/docs/guides/access-control.mdx`

````mdx
---
title: Access Control
description: Scope who can read, write, and search your collections with constraints, and know when to reach for a callback instead.
---

VexCMS's RBAC matrix (`defineAccess`) checks every action, but query-shaped actions
(`read`, `readDrafts`) have a second job: deciding what a role's _query_ is even
allowed to read, before any document is fetched. **Constraints** are the recommended
way to answer that — a typed builder that both narrows the underlying Convex query and
governs per-document access, compiled to whichever target the call site needs.

## Constraints — the recommended form

```ts
pages: {
  read: {
    constraints: ({ user, q }) =>
      q.withIndex("by_author", (ix) => ix.eq("authorId", user._id as string)),
  },
},
```

`q` on a query-shaped action is an `AccessQueryBuilder`: `.filter((f) => …)` hands its
callback the flat filter algebra — `f.eq`/`neq`/`gt`/`gte`/`lt`/`lte`/`and`/`or`/`not`,
mirroring Convex's own `FilterBuilder` — while `.withIndex(name, (ix) => …)` opts into
index pushdown, handing ITS callback a positional builder typed against THAT ONE
index's real field tuple. Each gets its own callback with its own builder, `ix` and `f`
never sharing scope — mirroring Convex's own two-callback query shape one layer up
(`ctx.db.query(...).withIndex(name, (q) => …).filter((q) => …)`). Author the range the
way you'd author Convex's own `withIndex` callback (`eq` for equality, then at most one
`gt`/`gte`, then at most one `lt`/`lte`, fields strictly in the index's declared order;
violating any of that is a compile error, never a runtime one) — with one difference
from Convex: the range callback here is REQUIRED, never optional, since a range-less
`withIndex` excludes no documents (every row has an index entry) and an access rule
that means to restrict should never be able to skip it by accident. This indexed form
is the recommended one: it's the only shape that reaches an actual index seek rather
than a table scan with a predicate attached.

The compiler behind `constraints` is the whole point: the SAME recorded condition
becomes a `withIndex` range for `find` (an index seek — reads scale with the page, not
the table), a `.filter()` expression for `search` (which has no `withIndex` slot at
all), and a JS predicate for `hasPermission`'s client-side, already-fetched-document
check (`usePermission`). Author it once; every consumer compiles it to what it needs. A
rule that never calls `q.withIndex(...)` compiles the same way to `.filter()` and a
predicate — just not to an index range; see "The indexable boundary" below for when
staying on the flat algebra is the right trade.

`filter` — the sibling property next to `constraints`, not `q`'s own
`.filter(predicate)` method used to build `constraints` in the first place — is
optional and additive: an extra per-document check ANDed onto the compiled constraints
wherever the target can express it. It never REPLACES the constraints; a rule that only
narrows by `filter` and declares no `constraints` reads the whole table and rejects
rows one at a time — exactly what constraints exist to avoid.

## The callback escape hatch

A rule may also be a bare boolean or callback, with no `constraints` at all:

```ts
images: {
  update: ({ data: image }) => !image.src.includes("https://maprios.com"),
},
```

This is not deprecated — it is the documented way to express a check `constraints`
cannot: see "The indexable boundary" below. The trade-off is real, though: with no
`constraints`, `find` cannot narrow the underlying query at all, so a restrictive
callback-only role reads through the whole table applying the callback per document.
For a small or admin-only collection that cost is invisible. For a large,
broadly-readable collection it produces a **ragged page** — Convex returns a full
page of _raw_ rows, the callback then rejects some of them, and the caller gets back
fewer rows than it asked for (or, at a page boundary, zero) even though more permitted
rows exist further in the table. `find`'s pagination happily continues past that short
page on the next cursor, but a UI naively treating "fewer than requested" as
end-of-list will stop early. Constraints do not have this problem — the compiled range
only ever produces permitted rows, so a full page is always a full page.

## The indexable boundary

`constraints` compiles to a Convex `FilterBuilder` expression as one of its three
targets (`search`'s `.filter()`), and `FilterBuilder` has a fixed operator set:
equality/ordering comparisons, arithmetic, and boolean logic on a SINGLE document's
fields — nothing else. That means the following are permanently out of reach for
`constraints`, no matter how the builder evolves, and belong in a `filter` callback
instead:

- **Array membership** — `user.assignedTeams.includes(data.teamId)`. `FilterBuilder`
  has no `.includes()`/`.some()`; there is no expression for "is this value a member of
  that array".
- **String operations** — `data.slug.startsWith("draft-")`. No `.startsWith()`,
  `.includes()`, or regex on `FilterBuilder` string values.
- **Cross-table reads** — anything that needs a second `ctx.db.get(...)` or a join.
  `FilterBuilder` expressions evaluate against ONE document from the query's own table;
  they cannot dereference a foreign key into another table's row.

There is a SECOND boundary now, between the two callbacks themselves rather than
inside one shared `q`: `neq`, `and`, `or`, and `not` live on `f` — the predicate
builder `.filter(...)` hands its callback — reachable ONLY from inside that callback.
The range callback `withIndex(name, ...)` hands its callback a different builder, `ix`,
and `ix` simply has no `neq`/`and`/`or`/`not` methods to call — not a narrowed builder
tripped by a runtime check, but an absence baked into `ConstraintBuilder`'s own
declared shape (it exposes only `eq`, repeatable while index fields remain, then at
most one `gt`/`gte`, then at most one `lt`/`lte`). This mirrors Convex's own index
range, which has no inequality or boolean-combination operator either:

```ts
q.withIndex("by_author", (ix) => ix.neq("authorId", user._id as string)); // ⛔ compile error — `ix` has no `neq`
```

So a rule that genuinely needs `neq`/`or`/`not` on an otherwise-indexable field has a
real choice to make: reach for `.filter(...)` for that check instead — either alone
(stays on the flat algebra, still compiles to `.filter()` and a predicate, just not an
index seek), or ANDed onto an index range by continuing off `withIndex`'s own result
(`q.withIndex(name, (ix) => …).filter((f) => …)`, Convex's own `.withIndex(...)
.filter(...)` shape: the range narrows what is READ, the filter rejects rows within it
the range cannot describe) — or restructure, e.g. two indexed rules OR'd across roles
instead of one rule with an internal `or`. Either way the choice is a compile error
away from being made by accident: nothing silently downgrades an indexed constraint
into a table scan, and `ix`/`f` can never meet in one expression to begin with.

If a rule needs array membership, string operations, or a cross-table read,
`constraints` (or a `constraints` + `filter` pair) is the wrong shape for that action —
use a plain callback and accept the ragged-page trade-off above, or restructure the
data so the check becomes an equality/range comparison (e.g. denormalize a computed
boolean field instead of checking array membership per read).

## Fragment composition

A `constraints` callback can call out to a plain function instead of writing every
`.eq()`/`.gte()` inline — `ConstraintFragment<TFields, TDoc, N, TOut>` names that
function's shape: it consumes a builder already advanced to field `N` and returns
either a terminal result or a further builder (positioned at field `N + 1`) another
fragment continues from.

```ts
const scopeToOwner: ConstraintFragment<
  IndexFieldsFor<"pages", "by_author_category">,
  PagesDoc,
  0
> = (ix) => ix.eq("authorId", user._id as string);

const scopeToCategory: ConstraintFragment<
  IndexFieldsFor<"pages", "by_author_category">,
  PagesDoc,
  1
> = (ix) => ix.eq("categoryId", "news");

// fragment → fragment, composed inside the range callback q.withIndex(...) takes
const scoped = ({ user, q }) =>
  q.withIndex("by_author_category", (ix) => scopeToCategory(scopeToOwner(ix)));
```

A fragment's ENTRY POINT changes again: `ix`, the parameter the range callback passed
to `q.withIndex(name, range)` receives, is what a field-0 fragment consumes now —
composition happens INSIDE that callback, not by chaining onto whatever
`q.withIndex(name)` itself used to return (there is no such builder to chain onto any
more; `withIndex` takes the whole range callback and returns a completed
`IndexedAccessCondition` in one call). `TFields` is unchanged by this: still the
index's REAL declared tuple (`IndexFieldsFor<slug, "by_author_category">`, the same
one `q.withIndex`'s own `N` type parameter resolves against), so the index-specificity
limit sits exactly where it always did: a fragment fixed to one resource's literal
field tuple only reuses across indexes sharing that exact tuple. Generified over
`TFields`/`TDoc` instead, it reuses across every resource whose index shares the same
LEADING field — a fragment scoping by `"authorId"` at field 0 works for any index that
starts with `authorId`, regardless of what follows. Past the shared prefix, tuples
diverge fast (one index continues with `categoryId`, another has no second field at
all), so this reuse has a real ceiling; most fragments stay pinned to one resource's
exact tuple, and that is the expected common case, not a workaround.
`packages/core/src/access/defineRules.ts` has the full generic example.

Use `accessRule`/`resourceRules`/`roleRules` (`defineRules.ts`) to compose whole rules
the same way — each factory infers its generics from the resource/action/index
LITERALS you pass and returns a value branded to that resource, so assembling a role
from rules written in different files still fails to typecheck if a rule meant for one
resource is placed under another.

## Capability differences belong in roles, not branches

A single rule should never branch on "which role is this, really":

```ts
// Don't:
read: ({ user, q }) =>
  user.role === "admin"
    ? true
    : q.withIndex("by_author", (ix) => ix.eq("authorId", user._id as string)),
```

`defineAccess` already has a mechanism for "different roles get different treatment":
separate role entries in the permissions matrix. The rule above is invisible to
`resolveAccessIndex` — it cannot tell that admins are actually unrestricted, so it
narrows by `by_author` for EVERY caller, including admins, silently hiding rows an
admin is entitled to see. Express it as two roles instead:

```ts
admin: { pages: { read: true } },
contributor: {
  pages: {
    read: {
      constraints: ({ user, q }) =>
        q.withIndex("by_author", (ix) => ix.eq("authorId", user._id as string)),
    },
  },
},
```

Now each role's shape is legible on its own, and `resolveAccessIndex`'s OR-merge across
a caller's roles (an unrestricted grant from any role always wins) does the right thing
automatically.
````

Verify: `pnpm --filter @vexcms/core test && pnpm --filter docs build`

### Step 14 — Remove the field-mode permission API `[dev]`

Why: Field mode lets a role declare `{ mode: "allow", fields: ["title","slug"] }` —
which document fields it may read or write. Convex has no `select` on document
queries, so this was never enforceable at the query layer: every read returns whole
documents and the field list only ever gated a post-hoc boolean. Folding real
field-level restriction into the constraint system is a separate design problem
(it would need per-field projection the database does not offer), so the API is
withdrawn rather than left as a half-promise.

**Runs last, deliberately.** Every earlier step leaves the field-mode branch alone and
threads `TFieldKeys` exactly as it does today, so the constraint API is proven working
before anything is subtracted. That ordering costs one thing worth naming: Steps 4-13
are written against the union that still carries `{ mode, fields }`, so this step
revisits `types.ts` and `hasPermission.ts` after they have already been edited. The
trade is deliberate — a removal applied to a green tree is easy to verify and easy to
revert, whereas removing it first would have entangled a subtraction with the new
design and left no clean baseline to compare against.

**`TFieldKeys` goes away too now — this reverses an earlier correction.** An earlier
pass over this spec argued `TFieldKeys` had to survive field-mode removal because
`ConstraintFieldSlots<TFieldKeys>` (the original Step 4 design) used it to type `q`'s
field names for the raw-literal authoring tier. That reason no longer exists: rev 3
replaced `ConstraintFieldSlots` with `q.withIndex(name)` binding to the index's own
real, generated tuple (`ConstraintBuilder<TFields, TDoc, N>`) — nothing downstream
reads `TFieldKeys` for field-name typing anymore. `ExtractFieldKeys`/`FieldKeysOrWide`
and `SubjectEntry.fields` are the machinery that PRODUCES `TFieldKeys`, and
`BasePermissionCheck`'s `FieldPermissionResult<TFieldKeys>` branch was its only
remaining CONSUMER — and this step deletes that branch anyway. So after this step's
core deletion, `TFieldKeys` has no consumer left at all, on any type. This step
therefore also collapses the parameter itself, not just the `{ mode, fields }` value
shape it used to type: drop `TFieldKeys` from `BasePermissionCheck`,
`ConstrainedPermissionCheck`, `AnyActionPermissionCheck`, and `PermissionCheck`; delete
`SubjectEntry.fields` and the `ExtractFieldKeys`/`FieldKeysOrWide` helpers in
`types.ts`; and update every call site that threads `TSubjects[S]["fields"]` into those
types (`RolePermissions`'s per-action branch, `HasPermissionProps`) to stop passing it.
This is also where Step 13's flagged `PermissionCheck`/`AnyActionPermissionCheck`
collapse decision gets easiest to resolve, since dropping `TFieldKeys` removes the last
parameter those two types differed on besides `q`'s own type — worth deciding here
rather than carrying the near-duplication further.

**`PERMISSION_MODES` / `PermissionMode` are also kept.** They are dual-purpose: the
same two strings type `defaultPermissionMode`, the posture for undeclared
role/subject/action combinations (`config.ts:130`, `hasPermission.ts:107`,
`resolveAccessRule.ts:72`). Only their JSDoc — which currently describes field mode —
changes. **`PERMISSION_SCOPES` is untouched**: `doc`/`any`/`all` is the quantifier for
callbacks evaluated without `data`, unrelated to field mode. Do not conflate them.

- [ ] `packages/core/src/access/types.ts` — delete `FieldPermissionResult` and
      `ResolvedFieldPermissions` outright. Drop the `{ mode, fields }` member from
      `BasePermissionCheck` so a check is `boolean | callback` (plus
      `ConstrainedPermissionCheck`, the sole remaining object form now that
      `IndexedPermissionCheck` was already removed in Step 7). Delete the
      `TFieldKeys` type parameter from `BasePermissionCheck`,
      `ConstrainedPermissionCheck`, `AnyActionPermissionCheck`,
      and `PermissionCheck` — reversing the earlier "keep every `TFieldKeys`
      parameter" instruction, since nothing reads it once `FieldPermissionResult` is
      gone. Delete `SubjectEntry.fields` and the `ExtractFieldKeys`/`FieldKeysOrWide`
      helpers, and their three call sites inside `SubjectMap` (`fields:
      ExtractFieldKeys<R>` and the two `fields: never` branches). Update
      `RolePermissions`'s per-action branch to stop passing `TSubjects[S]["fields"]`
      into `PermissionCheck`/`AnyActionPermissionCheck`. Delete `VexAccessError`'s
      `field` property and its constructor option; update the class JSDoc that
      advertises it. Update the union JSDoc and the `permissions` matrix JSDoc that
      name "field-mode objects".
- [ ] `packages/core/src/access/constants.ts` — rewrite the doc block above
      `PERMISSION_MODES` and the `PermissionMode` JSDoc: both currently describe
      "the listed fields". They now document only the undeclared-permission posture.
      No value or type change.
- [ ] `packages/core/src/access/hasPermission.ts` — delete the `fields` request
      parameter and the `TSubjects[TSubject]["fields"]` generic it read; the return
      type is now always `boolean`, never a per-field record. Delete the field-map
      AND branch (every requested field must be allowed). `mergeRolePermissions`
      becomes a plain OR-merge over `boolean[]` — no `fields` parameter, no
      `collapse` helper, no result object. `resolvePermissionCheck` returns
      `boolean`; drop its `FieldPermissionResult` casts and the
      `check.mode === PERMISSION_MODES.allow` branch. Update the JSDoc paragraph and
      `@example` that describe `fields`.
- [ ] `packages/core/src/access/resolveAccessRule.ts` — comment-only, if anything
      remains: by this point Step 7 has already replaced `isIndexedCheck` with
      whatever reads the `constraints` sink, so there may be nothing left here that
      cites field-mode objects; confirm rather than assume, and fix any surviving
      mention.
- [ ] `packages/core/src/access/hasPermission.test.ts` — delete the field-mode suite
      and cases (see the itemised list below). Repair the one mixed fixture that uses
      a field-mode object for an unrelated assertion.
- [ ] `packages/core/src/access/config.test.ts` — delete
      `it("rejects a field-mode object on a custom resource")`. It asserts a rejection
      that is now structural rather than a rule.
- [ ] `packages/core/README.md` — delete the field-level permission example.
- [ ] `apps/docs` — remove every remaining field-mode reference: the check-shape
      list and any `{ mode, fields }` example in
      `src/content/docs/guides/access-control.mdx`. The generated API pages
      (`src/content/docs/api/core/.../hasPermission.md` and friends) come from
      JSDoc, so this step's own doc edits land there on the next TypeDoc run —
      re-run it rather than hand-editing, and confirm the `fields:` example is
      gone from the output. Step 13 rewrote this guide for constraints and left
      the field-mode passages in place precisely so this step owns them.
- [ ] `packages/react` — **no change required.** `usePermission` forwards props to
      `hasPermission`; once `fields` is gone from that signature, a caller passing
      `fields` gets an excess-property error. That breakage is intended and there are
      no in-repo callers.

**Test removals, itemised.** All in `packages/core/src/access/hasPermission.test.ts`:

| Lines | What | Action |
|---|---|---|
| ~105-106 | field-mode object inside the `mergeAccess` fixture | rewrite to a boolean or callback — the surrounding test is about role merging, not fields |
| ~210-215 | `roleAllowTitle`, `roleDenySlug`, `roleAllowStatus`, `roleDenyTitle`, `allowEmptyFields`, `denyEmptyFields` | delete all six role fixtures |
| ~230-240 | `it("returns true when fields are requested (boolean-only API, system off)")` | delete |
| ~597-682 | `describe("hasPermission — fields (boolean AND: every requested field must be allowed)")` | delete the whole suite |
| ~696-742 | field-list merging across roles; allow-wins-over-deny per field; boolean `true` overriding field restrictions | delete all three |
| ~776-790 | `it("throws with the first denied field in fields order")` | delete |
| ~851-867 | `it("field-level denial carries the field and stays serializable")` | delete |

Line numbers are approximate and will drift as earlier deletions land — match on the
`describe`/`it` text, not the offset. Roughly 140 lines net.

**What must NOT be deleted.** Tests that mention fields incidentally while asserting
something else: the whole `scope` suite (`doc`/`any`/`all`), `defaultPermissionMode`
coverage, wildcard precedence, and `VexAccessError`'s serialisability for
non-field denials. Only the rows above are field-mode-specific.

Verify: `pnpm --filter @vexcms/core test` — the suite must be green with no
`FieldPermissionResult`, `ResolvedFieldPermissions`, or field-mode `TFieldKeys` symbol
anywhere: `grep -rn "FieldPermissionResult\|ResolvedFieldPermissions\|fields:"
packages/core/src/access/` should return NOTHING. It used to be allowed to still hit
`ConstraintFieldSlots`-related lines; that type was itself deleted back in Step 4's
rev 3 rewrite, so there is no longer a legitimate survivor to carve out — a clean grep
is now the whole bar.

### Step 15 — Verification `[dev]`

- [ ] `pnpm build && pnpm test && pnpm lint` clean across the workspace.
- [ ] `grep -rn "FieldPermissionResult\|ResolvedFieldPermissions" packages apps --include=*.ts --include=*.tsx --include=*.mdx` returns nothing outside `apps/docs/dist` (stale build output) — proves Step 14's cutover was not partially reintroduced by a later step.
- [ ] `grep -rn "RecordedAccessConstraints\|ConstraintBuilderHandle\|ConstraintFieldSlots\|IndexedConstraintCheck\|UnindexedConstraintCheck\|AccessIndexBySlug\|AccessIndexNameFor\|\bAccessIndex\b" packages apps --include=*.ts --include=*.tsx --include=*.mdx` returns nothing outside `apps/docs/dist` (stale build output) and outside comments that narrate a deletion in the past tense (`types.test.ts`'s "the former … block is gone with the shape it tested: `AccessIndex` … were deleted early"; `generateVexTypes.test.ts`'s "`AccessIndexBySlug` / `AccessIndexNameFor` existed only to … which is deleted") — proves none of the superseded rev-1/rev-2/pre-rev-5 spellings (the 8-slot repeated-field-key tuple, the builder's old `constraints()` readout, the two-shape indexed/unindexed check split, the deleted per-index-name registry types, and the pre-rev-5 recorded-constraints readout name) survive as a *current-fact* claim anywhere in the merged tree. The `\bAccessIndex\b` word boundary is deliberate: it must not false-positive on `AccessIndexConstraint` (a current, unchanged export) or on any other identifier that merely contains the substring. Any hit asserting one of these names as present-tense current behavior — not narrating its removal — is a real leftover, not a false positive, and must be fixed before this item is checked off; as of this writing that includes `compileConstraints.ts`'s doc comment (`` `RecordedAccessConstraints.filter` `` should read `` `AccessCondition.filter` ``) and `types.ts`'s `QueryIndex` doc comment, which still describes `{@link AccessIndex}` as something a caller currently authors rather than a deleted type.
- [ ] `grep -rn "withIndex:" packages/core/src/access apps --include=*.ts --include=*.tsx --include=*.mdx` — the only legitimate survivors are `createAccessQueryBuilder.ts`'s own object-literal method definition (`withIndex: (name, range) => …`, the implementation of the method itself, not a check shape) and `find`'s unrelated `withIndex` query-hint parameter/fixtures under `api/find/`. Every `withIndex: { name, range }` or `withIndex: AccessIndex<...>` spelling — `withIndex` as a sibling PROPERTY on a check object rather than a method CALL on `q` — must be gone.
- [ ] Manual: a contributor role with `constraints` sees only its own rows in the
      admin list; the Convex dashboard shows reads scaling with page size, not
      table size; the same role's search excludes non-permitted hits; an
      intentionally mis-ordered constraint set fails at `defineAccess`, not at
      query time.
- [ ] Manual: a config that still passes `fields:` to `hasPermission`, or declares
      `{ mode, fields }` in `defineAccess`, fails to compile — the field-mode removal
      is a real type-level cutover, not a silently-ignored property.
- [ ] Manual: on a mutation action (`create`/`update`/`delete`), `constraints: ({ q })
      => q.withIndex(...)` fails to compile — the mutation tier's `q` is an
      `AccessPredicateBuilder`, which has no `withIndex` method at all (DD 14) —
      while `constraints: ({ q }) => q.filter((f) => f.eq("authorId", u))` on that
      same action still compiles and still narrows the per-document check.
      `types.test.ts`'s own type-proof suite already exercises both halves of this
      ("rejects `q.withIndex` on update", "still accepts the flat algebra on a
      mutation action"); this is a reconfirmation after the full cutover, not a new
      mechanism.
- [ ] Manual: `constraints: ({ q }) => q.withIndex("by_author")`, with no second
      argument, fails to compile — unlike Convex's own `.withIndex(name, range?)`,
      `AccessQueryBuilder.withIndex`'s range callback is REQUIRED, because
      `AccessCondition["index"]["constraints"]` must never be empty; an index chosen
      with no range would silently authorize the whole table under the pretense of
      a narrowed query.
- [ ] Manual: `constraints: ({ q }) => q.filter((f) => f.and(q.withIndex("by_author",
      (ix) => ix.eq("authorId", u)), f.eq("archived", false)))` fails to compile —
      threading the `AccessConditionResult` that `withIndex` returns into `f.and`,
      which wants a `ConstraintResult`, is rejected even though both are opaque
      wrapper values with no visible fields. `AccessConditionResult` is the nominal
      terminal for a completed CONDITION (a rule's top-level return); `ConstraintResult`
      is the nominal terminal for a completed EXPRESSION inside one algebra's own
      callback (`ix.eq(...)` / `f.eq(...)`). They are distinct types on purpose and
      never interchangeable.
- [ ] Manual: a rule whose range callback calls `ix.eq("authorId", u)` but returns
      `ix` (or nothing) instead of the call's result, or whose filter predicate
      builds a tree with `f.and(...)` and discards it rather than returning it,
      compiles cleanly and authorizes nothing extra at query time — `readIndexConstraints`
      and `readAccessCondition` only ever see what the callback RETURNED, never a
      shared accumulator, so the abandoned call is dead code. Confirm against rows
      the discarded condition would have excluded: they still come back, proving
      the discarded chain contributed nothing to the compiled query.

Verify: `pnpm build && pnpm test`
