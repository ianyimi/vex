# Tasks: propagate the `get` return-type fix to all remaining API functions

**Status:** ✅ **COMPLETE** (2026-08-18) — `find`, `search`, and globals all mirror `get`.
One item deferred with reason; see "Not done" at the bottom.
**Reference implementation:** `packages/core/src/api/get/client.ts`.

## Final verification

| Check | Result |
| --- | --- |
| `packages/core` tsc | **0 errors** |
| `packages/core` vitest | **474 passed** (49 files) |
| `packages/react` own sources | **0 errors** |
| `apps/www` tsc | **0 errors** |
| `grep ReturnType<typeof convexQuery>` | **none remaining** |
| `packages/next` | 275 errors, **all TS6059 `rootDir` config** — pre-existing, no type errors. `NextAdminPage.tsx` is type-checked inside www's program (via its paths mapping) and passes. |

Measured narrowing after the change:

| Call | Data type |
| --- | --- |
| `find({ collection: "pages" })` | `Page[]` |
| `find({ …, paginationOpts })` → `.page` | `Page[]` (paginated overload) |
| `find({ …, populate: { themes: true } })` → `.themes` | `Theme[]` |
| `find({ …, depth: 1 })` → `.themes` | `Theme[]` |
| `find({ …, depth: runtimeNumber })` | degrades to `VexDocument` |
| `search({ … })` | `Page[]` |
| `getGlobal({ slug: "nav" })` | `NavGlobal` |
| `findGlobals()` | `VexDocumentGlobal<"nav">[]` (un-narrowed by design) |
| invalid populate key / unknown collection | rejected |
**Decision resolved:** union-typed endpoint **rejected** (collection docs carry no runtime
discriminant, so a union cannot be narrowed, and it breaks react's runtime-slug views).
Per-collection codegen deemed unnecessary for the chosen usage pattern — client wrappers on the
client, server API inside custom Convex functions.

## The pattern being replicated (from `get`)

1. **Extract** the module-private return type out of `*/server.ts` into `api/types.ts` as an
   exported name; server imports it back. (`get` did this for `GetReturn`, built on the shared
   `DocReturnItem`.)
2. **Thread `D`** — add `D extends number = 0` to the client args interface so `depth` narrows.
   The base `GenericQueryClientParams` already defaults `D = number`, which is what keeps
   un-threaded wrappers behaviour-identical. **Do not change that default.**
3. **Cast the funcRef** per instantiation to `FunctionReference<"query","public",TArgs,TReturn>`
   and annotate the wrapper `VexQueryOptions<TArgs, TReturn>` — never
   `ReturnType<typeof convexQuery>` (that instantiates the adapter's generics at their constraints
   and collapses query data to `any`; it also violates the repo's `ts-no-return-type` rule).

---

## Phase 1 — `find`

- [ ] Extract from `packages/core/src/api/find/server.ts:127-151` into `api/types.ts`:
      `FindReturn<S,P,D> = DocReturnItem<S,P,D>[]` and
      `FindReturnPaginated<S,P,D> = PaginationResult<DocReturnItem<S,P,D>>`.
      Delete the module-private `FindReturnItem`/`FindReturn`/`FindReturnPaginated`; the body is
      already identical to `DocReturnItem` — **do not add a fourth copy**.
- [ ] Remove imports orphaned by that deletion (`get` orphaned `DocumentBySlug`, `DepthPopulated`,
      `Populated`, `Prettify` — check each).
- [ ] Update the two `find` server overloads + implementation signature to the shared names.
- [ ] `api/find/client.ts`: add `D extends number = 0` to **both** `FindClientArgs` and
      `FindClientPaginatedArgs`.
- [ ] `api/find/client.ts`: replace `ReturnType<typeof convexQuery>` (**line 62**) with two
      overloads mirroring the server (`find/server.ts:153-175`):
      - no `paginationOpts` (`& { paginationOpts?: never }`) → `VexQueryOptions<VexFindArgs, FindReturn<…>>`
      - with `paginationOpts` → `VexQueryOptions<VexFindPaginatedArgs, FindReturnPaginated<…>>`
      Overloads matter: without them every callsite hand-narrows an array-vs-`PaginationResult` union.
- [ ] ⚠️ **Verify `find.queryKey` survives overloading.** It is an expando property assigned to a
      function declaration (`find/client.ts:84-95`). If TS rejects the expando on an overloaded
      declaration, export a standalone `findQueryKey` and keep `find.queryKey` as an alias —
      it is called by cache invalidation, so it must not disappear.
- [ ] Fallout: `packages/react/src/hooks/usePaginatedQuery.ts:164` calls `find({…})` and takes
      `FindClientPaginatedArgs`. It is generic over the slug — expect the same impedance mismatch
      `CollectionEditView` hit; see "runtime-slug callsites" below.

## Phase 2 — `search`

- [ ] Extract from `packages/core/src/api/search/server.ts:65-83` into `api/types.ts`:
      `SearchReturn<S,P,D> = DocReturnItem<S,P,D>[]` and
      `SearchReturnPaginated<S,P,D> = PaginationResult<DocReturnItem<S,P,D>>`.
      Delete the private `SearchReturnItem`/`SearchReturnPaginated` (identical body again).
- [ ] Update server overloads + implementation (`search/server.ts:85-107`) to the shared names.
- [ ] `api/search/client.ts`: add `D extends number = 0` to `SearchClientArgs` and
      `SearchClientPaginatedArgs`.
- [ ] `api/search/client.ts`: replace `ReturnType<typeof convexQuery>` (**line 68**) with the same
      two overloads + funcRef cast (`VexSearchArgs`).
- [ ] No internal consumers found in `packages/react` / `packages/next` — lowest-risk of the three.

## Phase 3 — globals

Different failure mode from `find`/`search`: these already return a **real** type (no
`ReturnType<…>`, so no `any`), but it is the endpoint's monomorphic baked type — **not narrowed by
slug**. The fix is the funcRef cast only.

- [ ] `api/globals/get.server.ts:57` — change `type GetGlobalReturn` to **`export type`**. Single
      definition, so no extraction/dedupe needed; leave it in place.
- [ ] `api/globals/get.client.ts`: cast the funcRef and annotate
      `VexQueryOptions<VexGlobalsGetArgs, GetGlobalReturn<TSlug, TPopulate, 0>>`.
      `GetGlobalClientArgs` has **no `depth`** — pass `0`, do **not** add a `D` generic.
- [ ] `api/globals/find.client.ts`: annotate
      `VexQueryOptions<VexGlobalsFindArgs, VexDocumentGlobal[]>` + cast.
      Stays un-narrowed by design — it returns a mixed-slug list. Globals *do* carry a runtime
      `_slug` discriminator (`types/generated.ts:257`), so consumers can narrow this one safely.
- [ ] Fallout: `packages/react/src/components/views/GlobalEditView.tsx:14` calls
      `getGlobal({ slug: global.slug })`. Check whether `global.slug` is a literal or a runtime
      value there — if runtime, apply the runtime-slug treatment below.

## Phase 4 — mutations (scope-limited on purpose)

`create`/`update`/`remove`/`updateGlobal` **already** return correctly typed mutation functions —
`vexConvexApi.create` etc. are cast at `api/convex.ts:291-324`. So there is no `any` to fix.

- [ ] Confirm only: `create` → `string` (new id), `update`/`remove` → `void`. No change expected.
- [ ] `VexUpdateArgs.data` was already narrowed `any` → `Record<string, unknown>` (done with `get`).
- [ ] **Explicitly deferred:** correlating mutation `data` with the collection slug. Needs generated
      **input** types (create-shape ≠ doc-shape: no `_id`/`_creationTime`, different
      required/optional). Tracked as open question #2 in
      `.agent/docs/research/per-collection-convex-codegen-design.md`.
- [ ] Optional, low value: brand `id`/`ids` per slug via an explicit generic. Rejected for now —
      `create()`/`update()` take no args at hook-call time, so `TSlug` cannot be inferred and
      callers would have to write `update<"pages">()`. Revisit with per-collection codegen.

## Phase 5 — runtime-slug callsites (the recurring fallout)

Any component generic over the slug (`TSlug extends CollectionSlug`) cannot benefit from per-slug
narrowing — the slug is a runtime value there. Point these at the **generic** endpoint
(`convexQuery(vexConvexApi.<op>, …)`), which is what the wrappers did internally while they
returned `any`. Precedent already applied for `get`: `CollectionEditView.tsx`,
`MediaCollectionEditView.tsx`.

- [ ] `packages/react/src/hooks/usePaginatedQuery.ts` (`find`)
- [ ] `packages/react/src/components/views/CollectionListView.tsx:61` (passes `depth: 1`)
- [ ] `packages/react/src/components/views/MediaCollectionListView.tsx:79` (passes `depth: 1`)
- [ ] `packages/next/src/NextAdminPage.tsx:177` (passes `depth: 1`)
- [ ] `packages/react/src/components/views/GlobalEditView.tsx:14` (if runtime slug)
- [ ] Watch for the `unknown` → `ReactNode` class of error: once data stops being `any`, rendering a
      dynamically-keyed value fails because `VexDocument`'s index signature yields `unknown`.
      Fixed in `CollectionEditView.tsx:89` with `String(… ?? "")`; expect more in list/cell views.

## Phase 6 — exports, tests, verification

- [ ] Export every new type name from `api/types.ts` (auto-exported from the package root via
      `src/index.ts:26 export * from "./api/types"`).
- [ ] Re-export from `api/client.ts` for the `@vexcms/core/client` subpath — extend the existing
      `export type { DocReturnItem, GetReturn, VexQueryOptions }` line.
- [ ] Grep must come back empty: `ReturnType<typeof convexQuery>` anywhere under `packages/core/src`.
- [ ] Add type-level regression tests (vitest `expectTypeOf`) per wrapper: raw doc / populated /
      literal depth / non-literal depth degrades to `VexDocument` / invalid populate key rejected.
      The `get` behaviour these must match is recorded in the verification table below.
- [ ] `cd packages/core && vitest run` — baseline is **474 passing**.
- [ ] `cd packages/react && tsc --noEmit` — react's own sources must stay at **0** errors.
- [ ] `cd apps/www && tsc --noEmit` — must not add errors beyond the known RBAC ones.
- [ ] Confirm the three `depth: 1` callsites still compile (they are the reason
      `GenericQueryClientParams` defaults `D = number`).

## Verification table `get` established (match this for each function)

| Call | Expected data type |
| --- | --- |
| no populate / no depth | `Doc<slug> \| null` |
| `populate: { rel: true }` | populated shape, `rel` → `Doc<target>[]` |
| `depth: 1` (literal) | depth-populated shape |
| `depth: someNumber` (non-literal) | `VexDocument \| null` — graceful, matches `DepthPopulated`'s guard |
| `populate: { textField: true }` | compile error (not a relationship key) |

## Gotchas banked from doing `get`

1. **`| null` placement.** The private `GetReturnItem` put `| null` *inside* each branch, so an
   unregistered slug yielded `never`, not `null`. `GetReturn` preserves that with
   `[DocReturnItem<…>] extends [never] ? never : DocReturnItem<…> | null`. Apply the same care to
   any nullable operation (`find`/`search` return arrays, so this only matters for `get`-likes).
2. **Do not copy the server's `populate`/`depth` mutual exclusivity to the client.** The server
   makes them `never` for each other; the client deliberately does not, because
   `@vexcms/react` passes `depth` freely. `DocReturnItem` already prefers `populate` when both exist.
3. **`as never` on `paginationOpts`** appears in the server implementations — keep it; the overloads
   carry the real types.
4. Relationship/upload `interfaceType` now emits the literal target slug
   (`fields/relationship/config.ts`, `fields/upload/config.ts`). Populate narrowing depends on it —
   if a populated field ever shows a union of every doc type again, that is the regression to check
   first (`collections/interfaceGen.test.ts` guards it).

### ⚠️ Type *display* is part of the contract (DX regression + fix)

First cut of `find`/`search` returned the named aliases `FindReturn<…>` / `SearchReturn<…>`.
Everything type-checked and narrowed correctly, but hover became **useless**:

```
const session: FindReturn<"session", Record<string, never>, 0>   // ← before
const session: SessionDocument[]                                  // ← after
```

**Rule discovered:** TypeScript prints a referenced **non-conditional** alias by *name*, and only
resolves an alias whose body is a **top-level conditional**. That is the entire reason `GetReturn`
read cleanly from day one (`[X] extends [never] ? never : X | null`) while `FindReturn`
(`DocReturnItem<…>[]`) did not.

**Rejected fix:** wrapping the alias bodies in a no-op `[X] extends [infer T] ? T[] : never`. It
does force clean display, but a deferred conditional is **not assignable while the type params are
still generic**, so all 4 `find` + 4 `search` implementation sites then failed to compile and would
each need an `as` cast — the price `get` already pays at `get/server.ts` (`as unknown as GetReturn<…>`).

**Applied fix:** keep the alias bodies **plain** (assignable, no casts) and **inline**
`DocReturnItem<…>[]` / `PaginationResult<DocReturnItem<…>>` in the overload return positions, which
are what drive hover at the callsite. Clean display *and* no casts. The aliases stay exported as
documented contracts for consumers.

Verified: server `find` → `SessionDocument[]`, paginated → `PaginationResult<SessionDocument>`,
`search` → `Page[]`, client `find` data → `Page[]`, `populate` → `Theme[]`.

**Do not** replace those inlined signature types with the alias names to "clean up" — it silently
regresses hover for every consumer. The rationale is duplicated in a comment block in
`packages/core/src/api/types.ts` above the four aliases.

---

## Outcome notes (write-up of what actually happened)

### Design correction made during implementation

The per-operation client-args interfaces (`FindClientArgs`, `FindClientPaginatedArgs`,
`SearchClientArgs`, `SearchClientPaginatedArgs`) default **`D extends number = number`**, not `0`.
Defaulting them to `0` broke every callsite that uses the interface as a *standalone prop type*
rather than inferring it from a call — `usePaginatedQuery`'s `query: FindClientPaginatedArgs<TSlug>`
made `depth?: 0`, so `depth: 1` failed with `Type '1' is not assignable to type '0'`
(`CollectionListView:61`, `MediaCollectionListView:79`).

The two defaults play different roles, and both are needed:
- **interface** `D = number` → "depth unknown" for standalone prop types.
- **function** `D = 0` → "no depth passed"; inference from `depth: 1` overrides it regardless of
  the interface default, so call-site narrowing is unaffected.

### Overload return types are not mutually assignable

`VexQueryOptions<TArgs, TReturn>` places `TReturn` inside the `queryKey` tuple
(`FunctionReference<…, TReturn>`), an invariant position. So `VexQueryOptions<A, X | Y>` is
assignable to neither `VexQueryOptions<A, X>` nor vice versa, and an implementation signature
returning the union fails TS2394. Fix: the implementation returns a **union of the two option
types**, not one option type over a union return.

### `find.queryKey` under overloads

Expando properties are rejected on an overloaded function declaration. Resolved by exporting a
standalone **`findQueryKey`** and assigning `find.queryKey = findQueryKey` after the declaration,
so both call forms keep working. `findQueryKey` is exported from `@vexcms/core/client`.

### Latent bugs surfaced (both previously masked by `any`)

1. `usePaginatedQuery` used `continueCursor: null` as its "no further pages" sentinel, but Convex
   types the field as `string`. It compiled only because `return data` was `any`, which collapsed
   the memo's union. Kept the runtime value (`null`, read only for truthiness in `loadMore`) and
   asserted the empty-state literal — switching to `""` would change runtime behaviour.
2. `CollectionEditView` rendered a dynamically-keyed value into JSX; `VexDocument`'s index
   signature yields `unknown`, which is not a `ReactNode`. Fixed with `String(… ?? "")`.

Expect this class of error (`unknown` leaking where `any` used to flow) at any callsite that
indexes a document by a runtime key.

### Runtime-slug callsites migrated to the generic endpoint

Per Phase 5 — these are generic over the slug, so per-slug narrowing cannot serve them:
`CollectionEditView`, `MediaCollectionEditView` (with `get`), `usePaginatedQuery`
(now `vexConvexApi.findPaginated`), `GlobalEditView` (now `vexConvexApi.globals.get`).
`CollectionListView` / `MediaCollectionListView` / `NextAdminPage` needed **no** change once the
interface `D` default was corrected.

### Not done — deferred with reason

**Type-level regression tests (`expectTypeOf`) for the narrowing table.** They cannot live in
`packages/core`: its test program has no `GeneratedVexTypes` augmentation, so `DocumentBySlug`
resolves to the wide fallback and every per-slug assertion would trivially pass. They belong in a
consumer with a generated registry (`apps/www`), which currently has no test runner configured.
The narrowing was verified by throwaway `tsc` probes in `apps/www` (results in the table above);
that evidence is **not** captured as a permanent guard. Wire a test runner in `apps/www` — or add a
fixture registry to core's test tsconfig — to close this.
