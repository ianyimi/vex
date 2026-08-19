# Deferred: `usePermission` / `hasPermission` type-inference fixes

**Status:** ✅ **RESOLVED** (2026-08-18). Kept for the root-cause analysis; every
item below has landed. What changed relative to this document:

- Core relaxed the bound from `SubjectMap` to `Record<string, SubjectEntry>` in
  `HasPermissionProps` / `hasPermission` (fix 2A, core half) — this also cleared the
  ~12 core-internal errors listed below. The same fix was applied to
  `packages/react/src/hooks/usePermission.ts`, which had the identical latent bug.
- `hasPermission`'s generic order is now `<TSubjects, TSubject, TData>`, so the
  mis-ordered call site described below no longer applies.
- The app-side hook was fixed (`TSubjects` became a fixed alias, not a type
  parameter), then removed entirely: `apps/www/src/hooks/` is gone, `useAuth` now
  lives in `src/context/AuthContext.tsx` and is resolved **server-side** via
  `api.auth.api.getUserOrg`, which also made the `isPending` concern moot.
- The `mode` footgun (item 1 under "Also found") is fixed by a different design
  than proposed here: `mode` → `scope`, `PERMISSION_EVAL_MODES` →
  `PERMISSION_SCOPES` with `doc` / `any` / `all`, and the **default is `all`**
  (fail-closed, never throws). Only `scope: "doc"` throws. See
  `packages/core/src/access/constants.ts`.
- Fix 2B (`SubjectsOf<A>` / `createPermissionChecker`) was **not** implemented and
  is no longer needed for `apps/www`.

---


## Symptom

`usePermission({ resource, action })` in `apps/www` gives **no LSP hints** for `resource`, and no
per-resource narrowing of `action`. Autocomplete is empty; wrong values are not rejected.

Reproduced at `apps/www/src/app/PageContent.tsx:31`:

```ts
const canSave = usePermission({ resource: "edit", action: "save" });
```

## Root causes (three layers — the bottom one is a core bug)

### 1. `apps/www/src/hooks/usePermission.ts` — unconstrained generic (blocking)

```ts
export function usePermission<TData extends object = object, TSubjects = typeof access.__subjects>(
```

`__subjects` is **optional** on `VexAccessConfig` (`packages/core/src/access/types.ts:365`), so
`typeof access.__subjects` includes `undefined`, and `TSubjects` has **no constraint**. Result —
present in the baseline `tsc --noEmit`:

```
src/hooks/usePermission.ts(26,24): error TS2344: Type 'TSubjects' does not satisfy the constraint 'SubjectMap'.
src/hooks/usePermission.ts(32,24): error TS2344: Type 'TSubjects' does not satisfy the constraint 'SubjectMap'.
```

Once the props type fails to instantiate, the whole signature collapses → zero hints.

### 2. Same file — type arguments passed in the wrong order, and no per-resource narrowing

`hasPermission`'s declared order is `<TSubjects, TData, TSubject>`
(`packages/core/src/access/hasPermission.ts:88-92`), but the call site passes
`<TSubjects, keyof TSubjects, TData>` — `TData` lands in the `TSubject` slot.

Separately, using a bare `keyof TSubjects` as the subject means `action` resolves to the **union of
every subject's actions** rather than narrowing to the chosen `resource`. Narrowing requires an
*inferred* generic: `TSubject extends keyof Subjects & string`.

### 3. `@vexcms/core` — wrong generic constraint (blocking; cannot be fixed from `apps/www`)

`HasPermissionProps` and `hasPermission` constrain `TSubjects extends SubjectMap`
(`packages/core/src/access/hasPermission.ts:44`, `:89`).

`SubjectMap`'s **default instantiation** is "every registered resource". After `vex generate`
augments the registry, that is all **17** collections in `apps/www`. But an access config registers
only the resources it names — `apps/www/src/auth/access.ts` registers **7**. A 7-key subject map
does not `extends` a 17-key map, so every project that selects a subset of collections fails the
constraint. Probe-confirmed:

```
error TS2344: Type '{ footers: {...}; headers: {...}; ... } & {...} & {...}'
  does not satisfy the constraint 'SubjectMap'.
```

`SubjectMap<TResources, TCustom>` is a **builder/instantiation helper** for `defineAccess`. It is
not a valid *bound*. The bound should be structural: `Record<string, SubjectEntry>`.

**Same root cause** produces the ~12 pre-existing errors inside core sources that pollute
`apps/www`'s typecheck (www consumes core from source via `customConditions: ["source"]`):

```
packages/core/src/api/create/server.ts(63,7)      packages/core/src/api/remove/server.ts(80,9)
packages/core/src/api/find/server.ts(228,9)       packages/core/src/api/search/server.ts(152,9)
packages/core/src/api/find/server.ts(239,9)       packages/core/src/api/globals/find.server.ts(38,9)
packages/core/src/api/find/server.ts(250,9)       packages/core/src/api/globals/get.server.ts(124,7)
packages/core/src/api/find/server.ts(290,15)      packages/core/src/api/globals/upsert.server.ts(72,7)
packages/core/src/api/get/server.ts(98,7)         (+ search/server.ts siblings)
```

All of the form `VexAccessConfig<Record<string, SubjectEntry>>` not assignable to
`VexAccessConfig<SubjectMap>` — the erased config stored on `VexConfig` vs. the now-concrete
post-augmentation default.

### Not a cause (ruled out)

- The generated registry is **healthy**. `access.__subjects` itself infers correctly — probe of
  `Subjects["edit"]` returned `{ action: "save" | "download"; data: never; fields: never }`.
- No slug mismatch. `TABLE_SLUG_ORGANIZATIONS = "organization"` (better-auth singular) matches
  `DocumentBySlug` in `apps/www/src/vex.types.ts:498`. An earlier `"organizations"` probe error was
  a typo in the probe, not a real defect.

## Fix 2A — recommended

### Core (`packages/core`)

Relax the bound from `SubjectMap` to `Record<string, SubjectEntry>`, keeping `SubjectMap` as the
builder type `defineAccess` returns:

- `src/access/hasPermission.ts:44` — `HasPermissionProps<TSubjects extends Record<string, SubjectEntry>, ...>`
- `src/access/hasPermission.ts:89` — same on the `hasPermission` function generic
- internal guard call sites that pass an erased config: `src/api/{create,find,get,remove,search}/server.ts`,
  `src/api/globals/{find,get,upsert}.server.ts`

Expected side effect: the ~12 core-internal errors above clear.

### App (`apps/www/src/hooks/usePermission.ts`)

```ts
type Subjects = NonNullable<typeof access.__subjects>;

export function usePermission<
  TSubject extends keyof Subjects & string,
  TData extends object = object,
>(
  props: Omit<HasPermissionProps<Subjects, TSubject, TData>, "access" | "organization" | "user">,
): boolean {
  const { user, organization } = useAuth();
  return hasPermission({ access, user, organization, ...props }); // inference; no explicit type args
}
```

Drop the explicit type arguments on the inner call — they were mis-ordered, and inference is correct.

### Verified behaviour (probe, `tsc --noEmit`, clean)

| Call | Result |
| --- | --- |
| `{ resource: "edit", action: "save" }` | accepted |
| `{ resource: "edit", action: "read" }` | **rejected** — action narrowed to `"save" \| "download"` |
| `{ resource: "nope", action: "read" }` | **rejected** — unknown resource |
| `{ resource: "pages", action: "update" }` | accepted (CRUD action) |
| `{ resource: "adminPanel", action: "access" }` | accepted (built-in subject) |

## Fix 2B — optional DX layer, on top of 2A

Stop making consumers poke the phantom (`NonNullable<typeof access.__subjects>`). Core exports either:

```ts
export type SubjectsOf<A> = A extends VexAccessConfig<infer S> ? S : never;
```

…or a bound factory so no generics appear in app code at all:

```ts
const checker = createPermissionChecker(access); // fully typed closure
```

Reduces the www hook to a two-liner and gives every future consumer project hints for free.

## Also found while reviewing (separate from typing — worth a look)

1. **Runtime footgun in `apps/www/src/hooks/usePermission.ts`.** Its JSDoc claims subject-level
   checks pass `mode: "capability"`, but the hook **never passes `mode`**. Per `hasPermission`'s
   contract, a *callback* check evaluated with no `data` in default `"action"` mode **throws
   `VexAccessError`** instead of returning a boolean. The current `edit.save` call is safe (static
   `true`), but the sidebar/list/create capability cases the JSDoc describes are not — e.g. the
   callback checks in `apps/www/src/auth/access.ts` (`images.update`, `footers["*"]`).
2. **`apps/www/src/hooks/useAuth.ts` JSDoc is copy-pasted from `usePermission`** — documents
   `props.resource` / `props.action` / `props.data` params that `useAuth()` does not take.
3. `useAuth` returns `user: session?.user ?? {}`. An empty object has no `roles`, which per
   `VexApiAuth`'s contract resolves to an empty role list and denies every check — fail-closed, so
   correct, but `null` would express the intent more directly than `{}`.
