---
name: JSDoc conventions for VexCMS packages
description: Comprehensive JSDoc patterns enforced by the project's ESLint config. Covers single-overload functions, function overloads, interfaces/types, and the recurring failure modes that produce LSP errors.
type: standard
applies_to: ["packages/*/src/**/*.ts", "packages/*/src/**/*.tsx"]
---

# JSDoc conventions for VexCMS packages

The project enforces JSDoc via `eslint-plugin-jsdoc` on every exported symbol
in `packages/*/src/`. **Every error in this doc is one I've seen produced by
real code** — patterns are grounded in actual ESLint output, not generic
advice. Read this whenever you're writing or editing JSDoc and you'll save
a typecheck-fix cycle.

## What's enforced (the rules that fire)

These rules are `error` (not warning) in `eslint.config.mjs`:

| Rule                              | What triggers it                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `jsdoc/require-jsdoc`             | Any exported function/class/method/type/interface/var without JSDoc.                                            |
| `jsdoc/require-description`       | JSDoc block that has tags but no prose description above them.                                                  |
| `jsdoc/require-param`             | Function with parameters but no `@param` for one of them. (Nested `args.foo` checks are off — see § *Functions taking object args*.) |
| `jsdoc/require-param-description` | `@param foo` with no description text after the name.                                                            |
| `jsdoc/require-returns`           | Function that returns a value without `@returns`.                                                                |
| `jsdoc/require-returns-description` | `@returns` with no description text.                                                                            |
| `jsdoc/check-param-names`         | `@param fooz` when the actual param is `foo` (typo or rename mismatch).                                          |
| `jsdoc/check-tag-names`           | Unknown tag name. Allowed extras: `@typeParam`, `@defaultValue`, `@expand`, `@ignore`.                           |

**`@typescript-eslint/no-redeclare`** and **`@typescript-eslint/no-unused-vars`**
are also enforced and DO understand TS function overloads — if they fire on
your overloads, something else is wrong (you may have actually duplicate
declarations, not just overload signatures).

## Templates by symbol type

### 1. Plain function (single signature)

```ts
/**
 * Walks `docs` and replaces each relationship field listed in `populate` with
 * the resolved target doc(s). Returns a shallow-copied array; original docs
 * are not mutated.
 *
 * @param ctx - The Convex query context (any DataModel).
 * @param docs - Documents to populate.
 * @param populate - Relationship fields to resolve, optionally nested.
 * @returns Same docs with relationship Id arrays replaced by Doc arrays.
 */
export async function populateDocs<DataModel extends GenericDataModel>(
  ctx: GenericQueryCtx<DataModel>,
  docs: ReadonlyArray<Record<string, unknown>>,
  populate: PopulateShape,
): Promise<ReadonlyArray<Record<string, unknown>>> {
  // ...
}
```

Required pieces, in order:
1. Block description (one+ sentences explaining what + when to use).
2. `@param` per declared parameter, with a description.
3. `@returns` with a description (omit only for `void` functions).

`@typeParam` is optional but recommended for non-obvious generics.

### 2. Function overloads (the critical pattern)

TypeScript function overloads appear in source as multiple declarations + one
implementation. **Each overload AND the implementation needs its own
JSDoc block**, or `jsdoc/require-jsdoc` fires.

```ts
/**
 * Lists documents (client overload, returns tanstack-query options).
 *
 * @typeParam TSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @param args - Client args: `{ slug, populate?, limit? }`. Must NOT include `ctx`.
 * @returns Tanstack-query `queryOptions` for `useQuery`/`useSuspenseQuery`.
 * @example
 * ```tsx
 * const { data } = useQuery(vex.find({ slug: "posts" }));
 * ```
 */
export function find<
  TSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TSlug> = Record<string, never>,
>(
  args: FindClientArgs<TSlug, TPopulate>,
): ReturnType<typeof convexQuery>;
/**
 * Lists documents (server overload, runs inside a Convex query handler).
 *
 * Same join logic as the client overload. Returns docs directly.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @param args - Server args: `{ ctx, slug, populate?, limit? }`. `ctx` required.
 * @returns Promise resolving to the populated docs.
 */
export function find<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TSlug> = Record<string, never>,
>(
  args: FindServerArgs<DataModel, TSlug, TPopulate>,
): Promise<ReadonlyArray<Populated<TSlug, TPopulate>>>;
/**
 * `find` implementation — discriminates on `args.ctx` presence. Type signatures
 * for callers come from the two overloads above; this signature is internal.
 *
 * @param args - The merged args object; runtime branches on `args.ctx`.
 * @returns Either tanstack-query options (client path) or a Promise (server path).
 */
export function find(args: {
  ctx?: unknown;
  slug: string;
  populate?: unknown;
  limit?: number;
}): unknown {
  // implementation
}
```

Three JSDoc blocks for two overloads + one implementation. The implementation
block can be terse (it's never seen by callers — it's the union of all
overloads), but it MUST exist or `jsdoc/require-jsdoc` fires.

### 3. Functions taking object args (no nested @param required)

When a function accepts a single object param whose properties are documented
on a TypeScript interface, **don't write nested `@param args.foo` docs**.
The project's ESLint config disables `checkDestructured` on
`jsdoc/require-param` for exactly this reason — interface JSDoc is the single
source of truth for property docs.

```ts
/**
 * Server-side args for `vex.find`. Extends {@link GenericQueryServerParams}
 * to inherit `ctx: GenericQueryCtx<DataModel>` and `populate?: TPopulate`.
 * Adds `slug` and `limit` (find-specific).
 */
export interface FindServerArgs<...> {
  /** The collection slug to fetch from. */
  slug: TSlug;
  /** Maximum results returned. */
  limit?: number;
}

/**
 * @param args - Server args: `{ ctx, slug, populate?, limit? }`. `ctx` required.
 *   See {@link FindServerArgs}.
 */
export function find(args: FindServerArgs<...>): ... { /* ... */ }
```

The function's `@param args` description briefly summarizes the shape and
points at the interface for full prop docs. Detailed docs live on the
interface properties, not duplicated in every function that takes the
interface.

### 4. Interface / type declaration

```ts
/**
 * Base shape for client-side args of a `vex.*` query function.
 *
 * Carries the `ctx?: never` discriminator and the `populate` field, since
 * every query function that returns documents supports relationship
 * population (the only outlier is `count`, which overrides `populate?: never`).
 *
 * @typeParam TSlug - Collection slug; used to narrow `populate` keys.
 * @typeParam TPopulate - Populate object.
 *
 * @example
 * ```ts
 * interface FindClientArgs<TSlug, TPopulate>
 *   extends GenericQueryClientParams<TSlug, TPopulate> {
 *   slug: TSlug;
 *   limit?: number;
 * }
 * ```
 */
export interface GenericQueryClientParams<...> {
  /** Discriminator: client args MUST NOT supply `ctx`. */
  ctx?: never;
  /** Recursive populate object, type-narrowed against `RelationshipKeysOf<TSlug>`. */
  populate?: TPopulate;
}
```

Required:
1. Block description on the interface.
2. `@typeParam` for each generic.
3. **Per-property JSDoc** (single-line `/** ... */` is fine).

`@example` is recommended when the interface has non-obvious instantiation
(generic constraints, intended composition pattern).

### 5. Type alias

```ts
/**
 * Result type of a populated query — `Doc<TSlug>` with each key listed in
 * `TPopulate` replaced from `Id<TargetSlug>[]` to `Doc<TargetSlug>[]`.
 * Recurses if the populate value has a nested `populate` field (D12).
 *
 * @typeParam TSlug - The collection slug.
 * @typeParam TPopulate - The populate object.
 */
export type Populated<
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
> = TSlug extends keyof DocumentBySlug ? { /* ... */ } : never;
```

No `@param` / `@returns` (it's a type, not a function). `@typeParam` is
recommended for non-obvious generics.

## Recurring failure modes (and the fix)

### Failure: "Missing JSDoc comment" on overload signatures

```
46:1   error  Missing JSDoc comment    jsdoc/require-jsdoc
96:8   error  Missing JSDoc comment    jsdoc/require-jsdoc
96:17  error  'find' is already defined    no-redeclare
```

**Cause:** You wrote one big JSDoc block above the first overload signature
and stopped. ESLint demands JSDoc on every function declaration.

**Fix:** Add a JSDoc block above EACH overload signature AND the
implementation. Yes, three blocks for two overloads + one impl. Each can be
focused on its specific shape. See § *Function overloads* template above.

### Failure: "Missing JSDoc @param 'foo' declaration"

```
45:1   error  Missing JSDoc @param "args" declaration    jsdoc/require-param
45:1   error  Missing JSDoc @returns declaration         jsdoc/require-returns
```

**Cause:** Function has parameters but the JSDoc block omits `@param foo` or
`@returns`.

**Fix:** Add `@param argName - description` for every declared param, and
`@returns description` if the function returns anything (omit only for
`void`).

### Failure: "Missing @param 'args.ctx'" / "Missing @param 'args.id'"

This used to fire on inline-typed object params. **The project's ESLint
config disables `checkDestructured` on both `jsdoc/require-param` and
`jsdoc/check-param-names` to suppress this.** If you see these errors, the
config has regressed — restore the `checkDestructured: false` /
`checkDestructuredRoots: false` settings in `eslint.config.mjs`.

### Failure: "'foo' is already defined" (no-redeclare on overloads)

```
89:17  error  'find' is already defined    no-redeclare
```

**Cause:** The base `no-redeclare` ESLint rule doesn't understand TypeScript
function overloads (each signature looks like a redeclaration).

**Fix:** The project's config disables `no-redeclare` and enables
`@typescript-eslint/no-redeclare` (which understands overloads). If you see
this error, the TS-aware variant is missing — restore both lines in
`eslint.config.mjs`.

### Failure: "'args' is defined but never used" (no-unused-vars on overloads)

```
87:3  error  'args' is defined but never used    no-unused-vars
```

**Cause:** Same as above — base `no-unused-vars` doesn't understand that
overload signature args are deliberately unused.

**Fix:** Use `@typescript-eslint/no-unused-vars` (which skips overloads).
For implementation signatures where you genuinely don't use a param, prefix
with underscore (`_args`).

### Failure: "Missing JSDoc block description"

```
40:1  error  Missing JSDoc block description    jsdoc/require-description
```

**Cause:** JSDoc block has tags (`@param`, `@returns`) but no prose
description above them.

**Fix:** Add at least one sentence of prose at the top of the JSDoc block,
before any tag.

```ts
// ❌ Wrong — tags only
/**
 * @param foo - the foo
 */

// ✅ Right — description first
/**
 * Computes something specific that's worth describing.
 * @param foo - the foo
 */
```

### Failure: "Missing JSDoc @param 'foo' description"

```
51:1  error  Missing JSDoc @param "props" description    jsdoc/require-param-description
```

**Cause:** `@param foo` has no description text after the name.

**Fix:** Always include a description after the dash:

```ts
// ❌ Wrong
@param props

// ✅ Right
@param props - The component's render props.
```

### Failure: Type instantiation is excessively deep

Not an ESLint rule — a TypeScript compiler error from recursive types like
`Populated<TSlug, TPopulate>`. Mostly outside JSDoc concerns but worth noting:
if your generic recursion is deep, the JSDoc on the recursive type should
explain the natural bounds (TS recursion limit, runtime data limits) so
implementers know when to stop nesting.

## Order of tags within a JSDoc block

When a block has many tags, this is the conventional order:

1. Block description (no tag — just prose)
2. `@typeParam` (one per generic)
3. `@param` (one per parameter)
4. `@returns`
5. `@throws` (if applicable)
6. `@example` (one or more)
7. `@see` (cross-references)
8. `@deprecated` / `@internal` (if applicable)

## Cross-references

- Project's "live" pattern reference (legacy):
  [`feedback_jsdoc_patterns.md`](./memory/feedback_jsdoc_patterns.md). That
  file has the higher-level guidance on Input vs resolved types and field
  doc style; this file is the **lint-rule-grounded reference** for the
  exact patterns that pass `eslint .` clean.
- ESLint config: `eslint.config.mjs` (project root).
- Allowed non-standard tags: `@typeParam`, `@defaultValue`, `@expand`,
  `@ignore`. Anything else fires `jsdoc/check-tag-names`.

## Canonical examples in the codebase

When in doubt, copy-modify from these files (they pass `eslint .` clean as
of spec 23 implementation):

- **Function with simple params:** `packages/core/src/api/populate.ts`
- **Function with overloads:** `packages/core/src/api/find.ts` (3 JSDoc blocks
  for 2 overloads + 1 impl)
- **Interface with generics:** `packages/core/src/api/types.ts`
  (`GenericQueryClientParams`, `FindClientArgs`)
- **Recursive type alias:** `packages/core/src/api/types.ts` (`Populated`)
