---
status: draft
spec_id: 2026-09-18-lifecycle-hooks-validation
touches:
  - packages/core/src/fields/**
  - packages/core/src/collections/**
  - packages/core/src/api/create/**
  - packages/core/src/api/update/**
  - packages/core/src/api/remove/**
  - packages/core/src/api/triggers.ts
  - packages/core/src/api/server.ts
  - packages/core/src/types/generated.ts
  - apps/www/convex/**
  - apps/www/src/vex.config.ts
  - apps/test/convex/**
  - packages/create-vexcms/templates/base-nextjs/convex/**
  - apps/docs/src/content/docs/guides/lifecycle-hooks.mdx
  - scripts/verify-hooks-wiring.mjs
  - scripts/verify-scaffold.mjs
prompt_version: 1
---

# 2026-09-18-lifecycle-hooks-validation — Spec

## Overview

Launch-plan spec **F**. Today `create`/`update`'s entire write path is
`hasPermission → stampUpdatedAt → db.insert/patch` — there is no validation
stage, so `text({ max: { value: 100 } })` accepts 10,000 characters through the
documented Local API even though its docstring claims otherwise
(`fields/text/validator.ts:12-14`). There are also no lifecycle hooks at all —
no way to slugify a title, derive a field, or reject a write server-side. This
spec adds one before-write stage (`beforeChange` → generated Zod → per-field
`validate()`) to `create`/`update`, a `beforeDelete` stage to `remove`, and
`afterChange`/`afterDelete` via `convex-helpers` `Triggers` on a new wrapped
mutation builder — per ADR-010 and ADR-011, both already accepted. This spec
implements those decisions; it does not reopen them.

## Design Decisions

1. **Hooks live in `defineCollection({ hooks: {...} })`, not a separate
   registration call.** `beforeChange`/`beforeDelete` run inline in
   `create`/`update`/`remove`, reading `config.collections`;
   `afterChange`/`afterDelete` are auto-registered onto a `Triggers` instance
   by a new `createVexMutations` factory that iterates the same
   `config.collections`.
2. **Every hook and `validate()` generic is named `TCollectionSlug`, and
   `doc` is typed `DocumentByCollectionSlug<TCollectionSlug>`, never
   `Record<string, unknown>`.** `defineCollection({ slug: "posts", hooks:
   {...} })` has a literal `slug` in the same object literal, so
   `TCollectionSlug` is inferred as `"posts"` with zero extra syntax —
   `hooks.beforeChange`'s `doc` resolves to the real generated `PostsDocument`.
   Field-level `validate()` can't be inferred the same way — a field
   (`text({ validate })`) is constructed before any `defineCollection` call
   groups it under a `slug` — so its `TCollectionSlug` must be supplied
   explicitly to get a narrow `doc`: `text<BaseFieldMeta, "posts">({
   validate: ({ doc }) => ... })`. It defaults to the full `CollectionSlug`
   union when omitted, and is not compiler-verified against where the field
   actually ends up.

   **Exception: `relationship()`.** It already has a `TCollectionSlug`
   generic meaning the *target* collection the field points to — a different
   concept from "the collection this field is declared on." Renamed that
   existing parameter to `TTargetSlug` (internal to
   `fields/relationship/{types,config}.ts` — nothing outside that module
   references it by name, only by position, so this is not a breaking
   rename) and added `TCollectionSlug` as a new, final parameter with the
   same owner meaning every other field type uses.
3. **The lenient partial-validation mode is `getCollectionInputSchema`'s
   existing Zod object, called with `{ partial: true }`.** `z.object(...).partial()`
   already has the exact semantic ADR-011 asks for: an absent key is valid,
   a present key still runs its full chain (`min`, `max`, `required`'s
   `.min(1, ...)`).
4. **`create`/`update`/`remove` throw when `args.collection` has no matching
   entry in `config.collections`.** Mirrors `upsertGlobal`'s existing
   behavior for an unregistered global (`api/globals/upsert.server.ts:94-96`).
5. **`update` validates the keys that changed, not the whole merged
   document.** The set sent to Zod/`validate()` is `Object.keys(args.data)`
   union any key whose value differs between the pre- and
   post-`beforeChange` merged document. Only that changed-key subset is
   patched — the merged document is never written back wholesale, or an
   editor's concurrent unrelated edit would look reverted.

   **The difference check is a new `deepEqual` (`api/utils.ts`), not `!==`.**
   `!==` would be wrong here: `beforeChange` receiving `merged` and returning
   a *new* top-level object (`{ ...doc, slug: derived }`, the documented
   pattern) preserves the same reference for every untouched key — spread
   copies references, not values — so `!==` happens to work for that one
   idiom. But nothing stops a hook from rebuilding a nested object/array
   field from scratch without changing its content (normalizing, cloning),
   which `!==` would then miscount as changed. A same-content false positive
   is harmless in isolation (redundant `validate()` call, redundant
   same-value write inside the same transaction), but the check should say
   what it means — "did the value change" — not "did the reference change".
   No new dependency: Convex documents are plain JSON (no `Date`/`Map`/`Set`),
   so a straightforward recursive structural comparison is sufficient.
6. **`remove`'s `softDelete` path does not call any hook.** It has no
   payload for `beforeChange`/`validate()` to check, and treating it as a
   real delete for `beforeDelete`/`afterDelete` is a separate, unrequested
   design. A future spec that wants hook coverage on soft delete routes it
   through `update` instead.
7. **`validate()` runs after generated Zod.** Structural constraints
   (`required`, `min`/`max`, enum membership) are cheap and synchronous, so
   they reject before anything pays for a `ctx.db` read inside `validate()`.
8. **Migration to the wrapped mutation builder is scoped to `convex/vex.ts`,
   `convex/vex/globals.ts`, `convex/vex/media.ts`** in `apps/www`,
   `apps/test`, and the `base-nextjs` template. `convex/seed.ts` and
   `convex/vex/firstUser.ts` keep the raw builder — firing `afterChange`
   hooks during `pnpm seed` or first-run bootstrap is unwanted.
   `marketing-site` has no `convex/vex.ts`/`convex/vex/` at all, so it has
   nothing to migrate.
9. **Globals keep their current Zod-only validation; no `hooks` surface is
   added to `GlobalConfig`.** `upsertGlobal` already runs
   `getGlobalInputSchema` server-side — the gap this spec closes does not
   exist for globals.
10. **The `Triggers` instance and wrapped builder are constructed once per
    app in a new `convex/triggers.ts`, not inside `@vexcms/core`.**
    `Triggers` is generic over the app's own `DataModel`, and every
    `convex/*.ts` file that registers a mutation must share the same
    instance.
11. **`collectionsApi`'s registered `create`/`update`/`remove` mutations are
    thin wrappers over the functions this spec changes** (`api/server.ts:248-302`)
    — no separate wiring or test needed for that layer.

## Out of Scope

- A contractually-pure `derive` hook class for live preview (ADR-010 defers this).
- Uniqueness sugar (e.g. a `unique: true` field option) — `validate()` is the mechanism, not a shorthand.
- `beforeRead`/`afterRead` hooks.
- Hook/validate support on `GlobalConfig`.
- Draft/version-aware hook semantics — owned by spec C.
- Migrating `convex/seed.ts`/`convex/vex/firstUser.ts` onto the wrapped builder.
- `marketing-site` admin CRUD wiring — the template has none today.
- Empirically probing trigger veto/throw semantics (ADR-010's open question) — irrelevant here since `before*` hooks, not triggers, are the rejection path.

## Implementation

### Step 1 — Field `validate()` and collection `hooks` config types [dev]

Additive types only — no runtime behavior changes yet.

#### packages/core/src/types/generated.ts

Already applied. `DocumentByCollectionSlug<TCollectionSlug extends CollectionSlug = CollectionSlug>` sits right after `DocumentBySlug`, resolving to `DocumentBySlug[TCollectionSlug]` or falling back to `TDocument`. No further changes needed here.

#### packages/core/src/fields/baseTypes.ts

Already applied, with one rename still needed: `FieldValidateProps`/`FieldValidate`'s generic is currently `TOwnerCollectionSlug` — rename to `TCollectionSlug` (Design Decision 2). Final shape:

```ts
export interface FieldValidateProps<TCollectionSlug extends CollectionSlug = CollectionSlug> {
  value: unknown;
  doc: DocumentByCollectionSlug<TCollectionSlug>;
  fieldKey: string;
  ctx: GenericMutationCtx<GenericDataModel>;
}

export type FieldValidate<TCollectionSlug extends CollectionSlug = CollectionSlug> = (
  props: FieldValidateProps<TCollectionSlug>,
) => Promise<string | void> | string | void;
```

`BaseFieldInput<TFieldMeta, TCollectionSlug>` and `BaseField<TFieldMeta, TCollectionSlug>` and their `validate?: FieldValidate<TCollectionSlug>` property are already correct — no change.

#### packages/core/src/fields/text/types.ts

Already applied, but with a bug: `TextFieldInput`/`TextField` declare `TCollectionSlug` but don't pass it to `BaseFieldInput`/`BaseField`. Fix both `extends` clauses:

```ts
export interface TextFieldInput<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseFieldInput<TFieldMeta, TCollectionSlug> {
```

```ts
export interface TextField<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseField<TFieldMeta, TCollectionSlug> {
```

#### packages/core/src/fields/text/config.ts

Already applied and correct — `text<TFieldMeta, TCollectionSlug>(options?: TextFieldInput<TFieldMeta, TCollectionSlug>): TextField<TFieldMeta, TCollectionSlug>`. No change.

#### Threading `TCollectionSlug` through the remaining field types

Same edit repeated across 10 modules: add `TCollectionSlug extends CollectionSlug = CollectionSlug` as the last generic parameter on the input/resolved interfaces and on the factory function, and pass it to `BaseFieldInput`/`BaseField`. Each needs `import type { CollectionSlug } from "../../types/generated";` added.

##### packages/core/src/fields/number/types.ts

```ts
export interface NumberFieldInput<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseFieldInput<TFieldMeta, TCollectionSlug> {
```

```ts
export interface NumberField<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseField<TFieldMeta, TCollectionSlug> {
```

##### packages/core/src/fields/number/config.ts

```ts
export function number<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(
  options?: NumberFieldInput<TFieldMeta, TCollectionSlug>,
): NumberField<TFieldMeta, TCollectionSlug> {
```

##### packages/core/src/fields/checkbox/types.ts

```ts
export interface CheckboxFieldInput<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseFieldInput<TFieldMeta, TCollectionSlug> {
```

```ts
export interface CheckboxField<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseField<TFieldMeta, TCollectionSlug> {
```

##### packages/core/src/fields/checkbox/config.ts

```ts
export function checkbox<
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(
  options?: CheckboxFieldInput<TFieldMeta, TCollectionSlug>,
): CheckboxField<TFieldMeta, TCollectionSlug> {
```

##### packages/core/src/fields/date/types.ts

```ts
export interface DateFieldInput<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseFieldInput<TFieldMeta, TCollectionSlug> {
```

```ts
export interface DateField<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseField<TFieldMeta, TCollectionSlug> {
```

##### packages/core/src/fields/date/config.ts

```ts
export function date<
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(
  options?: DateFieldInput<TFieldMeta, TCollectionSlug>,
): DateField<TFieldMeta, TCollectionSlug> {
```

##### packages/core/src/fields/select/types.ts

```ts
export interface SelectFieldInput<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseFieldInput<TFieldMeta, TCollectionSlug> {
```

```ts
export interface SelectField<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseField<TFieldMeta, TCollectionSlug> {
```

##### packages/core/src/fields/select/config.ts

```ts
export function select<
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(
  options?: SelectFieldInput<TFieldMeta, TCollectionSlug>,
): SelectField<TFieldMeta, TCollectionSlug> {
```

##### packages/core/src/fields/url/types.ts

```ts
export interface UrlFieldInput<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseFieldInput<TFieldMeta, TCollectionSlug> {
```

```ts
export interface UrlField<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseField<TFieldMeta, TCollectionSlug> {
```

##### packages/core/src/fields/url/config.ts

```ts
export function url<
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(
  options?: UrlFieldInput<TFieldMeta, TCollectionSlug>,
): UrlField<TFieldMeta, TCollectionSlug> {
```

##### packages/core/src/fields/color/types.ts

```ts
export interface ColorFieldInput<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseFieldInput<TFieldMeta, TCollectionSlug> {
```

```ts
export interface ColorField<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseField<TFieldMeta, TCollectionSlug> {
```

##### packages/core/src/fields/color/config.ts

```ts
export function color<
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(
  options?: ColorFieldInput<TFieldMeta, TCollectionSlug>,
): ColorField<TFieldMeta, TCollectionSlug> {
```

##### packages/core/src/fields/group/types.ts

```ts
export interface GroupFieldInput<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseFieldInput<TFieldMeta, TCollectionSlug> {
```

```ts
export interface GroupField<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseField<TFieldMeta, TCollectionSlug> {
```

##### packages/core/src/fields/group/config.ts

```ts
export function group<
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(
  options: GroupFieldInput<TFieldMeta, TCollectionSlug>,
): GroupField<TFieldMeta, TCollectionSlug> {
```

##### packages/core/src/fields/upload/types.ts

```ts
export interface UploadFieldInput<
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseFieldInput<TFieldMeta, TCollectionSlug> {
```

```ts
export interface UploadField<
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseField<TFieldMeta, TCollectionSlug> {
```

`upload/types.ts` already imports `MediaCollectionSlug` from `../../types/generated` — add `CollectionSlug` to that same import line instead of a new one.

##### packages/core/src/fields/upload/config.ts

```ts
export function upload<
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(
  options: UploadFieldInput<TFieldMeta, TCollectionSlug>,
): UploadField<TFieldMeta, TCollectionSlug> {
```

##### packages/core/src/fields/blocks/types.ts

`BlocksFieldInput` extends `Omit<BaseFieldInput<TFieldMeta>, "admin">` today:

```ts
export interface BlocksFieldInput<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends Omit<BaseFieldInput<TFieldMeta, TCollectionSlug>, "admin"> {
```

```ts
export interface BlocksField<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseField<TFieldMeta, TCollectionSlug> {
```

##### packages/core/src/fields/blocks/config.ts

```ts
export function blocks<
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(
  options: BlocksFieldInput<TFieldMeta, TCollectionSlug>,
): BlocksField<TFieldMeta, TCollectionSlug> {
```

##### packages/core/src/fields/array/types.ts

Leading `TArrayType` generic is unchanged; `TCollectionSlug` goes last:

```ts
export interface ArrayFieldInput<
  TArrayType extends ArrayType = string,
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseFieldInput<TFieldMeta, TCollectionSlug> {
```

```ts
export interface ArrayField<
  TArrayType extends ArrayType = string,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseField<TFieldMeta, TCollectionSlug> {
```

##### packages/core/src/fields/array/config.ts

```ts
export function array<
  TArrayType extends ArrayType = string,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(options: ArrayFieldInput<TArrayType, TFieldMeta, TCollectionSlug>): ArrayField<TArrayType, TFieldMeta, TCollectionSlug> {
```

##### packages/core/src/fields/relationship/types.ts

Rename the existing target-collection generic from `TCollectionSlug` to `TTargetSlug` everywhere in this file (`RelationshipFieldAdminInput`, `RelationshipFieldAdminConfig`, `RelationshipFieldInput`, `RelationshipField`, and the internal references to it), then add the new owner `TCollectionSlug` as a final parameter on the two field interfaces only (the admin-config interfaces don't need it — they carry no `validate`):

```ts
export interface RelationshipFieldAdminInput<
  TTargetSlug extends CollectionSlug = CollectionSlug,
  TComponent extends ComponentHKT = ComponentHKT,
> extends FieldAdminConfigInput {
```

```ts
export interface RelationshipFieldAdminConfig<
  TTargetSlug extends CollectionSlug = CollectionSlug,
  TComponent extends ComponentHKT = ComponentHKT,
> extends FieldAdminConfig {
```

```ts
export interface RelationshipFieldInput<
  TFieldMeta extends {} = {},
  TTargetSlug extends CollectionSlug = CollectionSlug,
  TComponent extends ComponentHKT = ComponentHKT,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseFieldInput<TFieldMeta, TCollectionSlug> {
  admin?: BaseFieldInput["admin"] & RelationshipFieldAdminInput<TTargetSlug, TComponent>;
  collection: {
    slug: TTargetSlug;
    // ...rest of the collection reference shape, unchanged...
  };
  // ...rest of the interface, unchanged...
}
```

```ts
export interface RelationshipField<
  TFieldMeta extends {} = {},
  TTargetSlug extends CollectionSlug = CollectionSlug,
  TComponent extends ComponentHKT = ComponentHKT,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseField<TFieldMeta, TCollectionSlug> {
  admin: BaseField<TFieldMeta>["admin"] & RelationshipFieldAdminConfig<TTargetSlug, TComponent>;
  // ...rest of the interface, unchanged...
}
```

##### packages/core/src/fields/relationship/config.ts

```ts
export function relationship<
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TTargetSlug extends CollectionSlug = CollectionSlug,
  TComponent extends ComponentHKT = ComponentHKT,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(
  options: RelationshipFieldInput<TFieldMeta, TTargetSlug, TComponent, TCollectionSlug>,
): RelationshipField<TFieldMeta, TTargetSlug, TComponent, TCollectionSlug> {
```

The function body is unchanged — every reference to `options.collection.slug` still resolves the same way, since only the type parameter name changed.

`packages/react/src/index.ts`'s `RelationshipFieldInput`/`RelationshipField`/`relationship()` wrappers reference these by position, not name, and only pass 3 of the 4 generics today — they keep compiling unchanged, with the 4th (`TCollectionSlug`) resolved to its default. No edit needed there for this spec.

#### packages/core/src/collections/hooks.ts

New file, complete.

```ts
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import type { GenericId } from "convex/values";
import type { CollectionSlug, DocumentByCollectionSlug } from "../types/generated";

export interface BeforeChangeProps<TCollectionSlug extends CollectionSlug = CollectionSlug> {
  operation: "create" | "update";
  doc: DocumentByCollectionSlug<TCollectionSlug>;
  ctx: GenericMutationCtx<GenericDataModel>;
}

export interface BeforeDeleteProps<TCollectionSlug extends CollectionSlug = CollectionSlug> {
  id: GenericId<TCollectionSlug>;
  doc: DocumentByCollectionSlug<TCollectionSlug>;
  ctx: GenericMutationCtx<GenericDataModel>;
}

export interface AfterChangeProps<TCollectionSlug extends CollectionSlug = CollectionSlug> {
  operation: "create" | "update";
  id: GenericId<TCollectionSlug>;
  oldDoc: DocumentByCollectionSlug<TCollectionSlug> | null;
  newDoc: DocumentByCollectionSlug<TCollectionSlug>;
  ctx: GenericMutationCtx<GenericDataModel>;
}

export interface AfterDeleteProps<TCollectionSlug extends CollectionSlug = CollectionSlug> {
  id: GenericId<TCollectionSlug>;
  oldDoc: DocumentByCollectionSlug<TCollectionSlug>;
  ctx: GenericMutationCtx<GenericDataModel>;
}

/**
 * Lifecycle hooks for a collection. `beforeChange`/`beforeDelete` run inline
 * in the write path and may reject a write by throwing. `afterChange`/
 * `afterDelete` run via `convex-helpers` triggers, after the write commits,
 * through the mutation builder returned by `createVexMutations` — they never
 * run for a write made through the raw `_generated/server` builder, the
 * Convex dashboard, or `npx convex import`.
 */
export interface CollectionHooksInput<TCollectionSlug extends CollectionSlug = CollectionSlug> {
  beforeChange?: (
    props: BeforeChangeProps<TCollectionSlug>,
  ) => Promise<DocumentByCollectionSlug<TCollectionSlug>> | DocumentByCollectionSlug<TCollectionSlug>;
  beforeDelete?: (props: BeforeDeleteProps<TCollectionSlug>) => Promise<void> | void;
  afterChange?: (props: AfterChangeProps<TCollectionSlug>) => Promise<void> | void;
  afterDelete?: (props: AfterDeleteProps<TCollectionSlug>) => Promise<void> | void;
}

export type CollectionHooks<TCollectionSlug extends CollectionSlug = CollectionSlug> =
  CollectionHooksInput<TCollectionSlug>;
```

#### packages/core/src/collections/hooks.test.ts

New file, complete.

```ts
import { describe, expect, it } from "vitest";
import type { CollectionHooksInput } from "./hooks";

describe("CollectionHooksInput", () => {
  it("allows every hook to be omitted", () => {
    const hooks: CollectionHooksInput = {};
    expect(hooks.beforeChange).toBeUndefined();
    expect(hooks.afterChange).toBeUndefined();
  });

  it("accepts a full set of hooks with the documented signatures", () => {
    const hooks: CollectionHooksInput<"posts"> = {
      beforeChange: ({ doc }) => doc,
      beforeDelete: () => {},
      afterChange: () => {},
      afterDelete: () => {},
    };
    expect(typeof hooks.beforeChange).toBe("function");
  });
});
```

#### packages/core/src/collections/types.ts

Add the import:

```ts
import type { CollectionHooks, CollectionHooksInput } from "./hooks";
```

`CollectionConfigInput<TFieldMeta, TCollectionMeta, TCollectionSlug extends string = string, TFieldSlug, TComponent>`:

```ts
  hooks?: CollectionHooksInput<TCollectionSlug extends CollectionSlug ? TCollectionSlug : CollectionSlug>;
```

`CollectionConfig<TFieldMeta, TCollectionMeta, TCollectionSlug extends CollectionSlug = CollectionSlug, TFieldSlug, TComponent>`:

```ts
  hooks: CollectionHooks<TCollectionSlug>;
```

#### packages/core/src/collections/config.ts

Add `hooks: input.hooks ?? {},` to `defineCollection`'s return object, after the `...input` spread:

```ts
  return {
    interfaceName: slugToPascalCase({ slug: input.slug }) + "Document",
    ...input,
    fields,
    hooks: input.hooks ?? {},
    admin: {
      // ...unchanged...
```

#### packages/core/src/collections/config.test.ts

Append after the existing `describe` blocks:

```ts
describe("defineCollection — hooks", () => {
  it("defaults hooks to an empty object", () => {
    const posts = defineCollection({ slug: "posts", fields: { title: text() } });
    expect(posts.hooks).toEqual({});
  });

  it("passes through provided hooks unchanged", () => {
    const beforeChange = ({ doc }: BeforeChangeProps<"posts">) => doc;
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text() },
      hooks: { beforeChange },
    });
    expect(posts.hooks.beforeChange).toBe(beforeChange);
  });
});
```

Add `import type { BeforeChangeProps } from "./hooks";` to this file's imports.

#### packages/core/src/collections/index.ts

Add `export * from "./hooks";`.

Verify: `pnpm --filter @vexcms/core test -- baseTypes collections/config collections/types collections/hooks && pnpm --filter @vexcms/core exec tsc --noEmit`

---

### Step 2 — Server-side validation helpers [dev]

#### packages/core/src/collections/utils.ts

`getCollectionInputSchema` grows a `partial` option:

```ts
export function getCollectionInputSchema(props: { collection: CollectionConfig; partial?: boolean }) {
  const res: Record<string, ZodType> = {};
  for (const [fieldKey, fieldDef] of Object.entries(props.collection.fields)) {
    if (fieldDef.admin.hidden) continue;
    res[fieldKey] = adminFieldToInputSchema({ field: fieldDef });
  }
  const schema = z.object({ ...res });
  return props.partial ? schema.partial() : schema;
}
```

#### packages/core/src/collections/utils.test.ts

Append to the existing `describe("getCollectionInputSchema", ...)` block:

```ts
it("partial mode: an absent required field passes", () => {
  const collection = defineCollection({
    slug: "posts",
    fields: { title: text({ required: true }), slug: text({ min: { value: 3 } }) },
  });
  const schema = getCollectionInputSchema({ collection, partial: true });
  expect(schema.safeParse({}).success).toBe(true);
});

it("partial mode: a present field still runs its full validator chain", () => {
  const collection = defineCollection({ slug: "posts", fields: { slug: text({ min: { value: 3 } }) } });
  const schema = getCollectionInputSchema({ collection, partial: true });
  expect(schema.safeParse({ slug: "ab" }).success).toBe(false);
  expect(schema.safeParse({ slug: "abc" }).success).toBe(true);
});

it("non-partial mode is unchanged: an absent required field fails", () => {
  const collection = defineCollection({ slug: "posts", fields: { title: text({ required: true }) } });
  const schema = getCollectionInputSchema({ collection });
  expect(schema.safeParse({}).success).toBe(false);
});
```

#### packages/core/src/collections/validateFields.ts

New file, complete.

```ts
import { ConvexError } from "convex/values";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import type { CollectionSlug, DocumentByCollectionSlug } from "../types/generated";
import type { CollectionConfig } from "./types";

export async function validateFields<TCollectionSlug extends CollectionSlug = CollectionSlug>(props: {
  collection: CollectionConfig<object, object, TCollectionSlug>;
  doc: DocumentByCollectionSlug<TCollectionSlug>;
  keys: Iterable<string>;
  ctx: GenericMutationCtx<GenericDataModel>;
}): Promise<void> {
  const keys = new Set(props.keys);
  const doc = props.doc as Record<string, unknown>;
  for (const [fieldKey, field] of Object.entries(props.collection.fields)) {
    if (!keys.has(fieldKey) || !field.validate) continue;
    const error = await field.validate({ value: doc[fieldKey], doc: props.doc, fieldKey, ctx: props.ctx });
    if (error) throw new ConvexError({ message: "Validation failed", field: fieldKey, error });
  }
}
```

#### packages/core/src/collections/validateFields.test.ts

New file, complete.

```ts
import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { defineCollection, text } from "../index";
import { validateFields } from "./validateFields";

const fixtureCtx = {} as GenericMutationCtx<GenericDataModel>;

describe("validateFields", () => {
  it("passes when no field in the key set declares validate()", async () => {
    const collection = defineCollection({ slug: "posts", fields: { title: text() } });
    await expect(
      validateFields({ collection, doc: { title: "Hi" }, keys: ["title"], ctx: fixtureCtx }),
    ).resolves.toBeUndefined();
  });

  it("rejects when a field's validate() returns a message", async () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { slug: text({ validate: () => "Slug must be unique." }) },
    });
    await expect(
      validateFields({ collection, doc: { slug: "dup" }, keys: ["slug"], ctx: fixtureCtx }),
    ).rejects.toThrow(ConvexError);
  });

  it("skips a field outside the key set even if it declares validate()", async () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { slug: text({ validate: () => "should not run" }) },
    });
    await expect(
      validateFields({ collection, doc: { title: "Hi" }, keys: ["title"], ctx: fixtureCtx }),
    ).resolves.toBeUndefined();
  });

  it("awaits an async validate() and passes ctx/doc/fieldKey through", async () => {
    let seen: unknown;
    const collection = defineCollection({
      slug: "posts",
      fields: { slug: text({ validate: async (props) => void (seen = props) }) },
    });
    await validateFields({ collection, doc: { slug: "ok", _id: "abc" }, keys: ["slug"], ctx: fixtureCtx });
    expect(seen).toMatchObject({ value: "ok", fieldKey: "slug", doc: { slug: "ok" } });
  });
});
```

#### packages/core/src/collections/index.ts

Add `export * from "./validateFields";`.

Verify: `pnpm --filter @vexcms/core test -- collections/utils collections/validateFields`

---

### Step 3 — Wire `create` and `update` through the pipeline [dev]

#### packages/core/src/api/create/server.ts

Add imports:

```ts
import { ConvexError } from "convex/values";
import { getCollectionInputSchema, validateFields } from "../../collections";
```

Full body:

```ts
export async function create<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(args: CreateServerArgs<DataModel, TCollectionSlug>): Promise<string> {
  const collection = args.config.collections.find((c) => c.slug === args.collection);
  if (!collection) {
    throw new ConvexError(`No collection registered with slug "${args.collection}"`);
  }

  if (args.config.access !== undefined) {
    const { access, action, resource } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: CRUD_ACTIONS.create,
      resource: args.collection,
    });
    hasPermission({
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      data: args.data,
      changes: args.data,
      throwOnDenied: true,
    });
  }

  let doc: Record<string, unknown> = { ...args.data };
  if (collection.hooks.beforeChange) {
    doc = (await collection.hooks.beforeChange({
      operation: "create",
      doc: doc as never,
      ctx: args.ctx,
    })) as never;
  }

  const parsed = getCollectionInputSchema({ collection }).safeParse(doc);
  if (!parsed.success) {
    throw new ConvexError({ message: "Validation failed", errors: parsed.error.message });
  }

  await validateFields({ collection, doc: doc as never, keys: Object.keys(doc), ctx: args.ctx });

  const data = stampUpdatedAt({ collection: args.collection, config: args.config, data: doc });
  const id = await args.ctx.db.insert(args.collection as TableNamesInDataModel<DataModel>, data as never);
  return id;
}
```

`doc` never carries `_id`/`_creationTime` on create — nothing assigns them before insert, regardless of what `beforeChange` returns, since `beforeChange`'s own runtime input never had them either.

#### packages/core/src/api/create/server.test.ts

Move the `postsResource` declaration above `fixtureConfig`, then:

```ts
const fixtureConfig = { collections: [postsResource] } as unknown as VexConfig;
```

`postsResource`'s fields carry no `required`/`min`/`max`/`validate`, so every existing test in this file keeps passing unchanged.

Append after the existing `updatedAt stamp` block:

```ts
describe("create (server) — validation and hooks", () => {
  test("throws when the collection is not registered in config", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        create({ ctx, config: { collections: [] } as unknown as VexConfig, collection: "posts", data: { title: "Hello" } }),
      ),
    ).rejects.toThrow(/No collection registered/);
  });

  test("rejects a write that violates a field's max length through the Local API", async () => {
    const collection = defineCollection({ slug: "posts", fields: { title: text({ max: { value: 5 } }) } });
    const config = { collections: [collection] } as unknown as VexConfig;
    const t = convexTest(schema, modules);
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        create({ ctx, config, collection: "posts", data: { title: "way too long" } }),
      ),
    ).rejects.toThrow(ConvexError);
  });

  test("beforeChange can derive a field the caller never sent", async () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text(), slug: text() },
      hooks: { beforeChange: ({ doc }) => ({ ...doc, slug: String(doc.title).toLowerCase() }) },
    });
    const config = { collections: [collection] } as unknown as VexConfig;
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      create({ ctx, config, collection: "posts", data: { title: "Hello" } }),
    );
    const doc = await t.run((ctx: GenericMutationCtx<GenericDataModel>) => ctx.db.get(id as never));
    expect(doc).toMatchObject({ slug: "hello" });
  });

  test("a beforeChange-derived field is not denied by a field-map role that can only write the original field", async () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text(), slug: text() },
      hooks: { beforeChange: ({ doc }) => ({ ...doc, slug: String(doc.title).toLowerCase() }) },
    });
    const config = {
      collections: [collection],
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [collection],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { editor: { posts: { create: () => ({ title: true }) } } },
      }),
    } as unknown as VexConfig;
    const t = convexTest(schema, modules);
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        create({ ctx, config, collection: "posts", auth: { user: { roles: ["editor"] } }, data: { title: "Hello" } }),
      ),
    ).resolves.toEqual(expect.any(String));
  });

  test("an async validate() rejects a duplicate via a ctx.db query", async () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        slug: text({
          validate: async ({ value, ctx }) => {
            const existing = await ctx.db.query("posts").filter((q) => q.eq(q.field("slug"), value)).first();
            if (existing) return "Slug must be unique.";
          },
        }),
      },
    });
    const config = { collections: [collection] } as unknown as VexConfig;
    const t = convexTest(schema, modules);
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) => create({ ctx, config, collection: "posts", data: { slug: "taken" } }));
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) => create({ ctx, config, collection: "posts", data: { slug: "taken" } })),
    ).rejects.toThrow(ConvexError);
  });
});
```

No separate `collectionsApi`-level integration test is added — `collectionsApi`'s registered mutations call these exact functions with zero logic in between (Design Decision 11).

#### packages/core/src/api/utils.ts

Add one export, alongside `stampUpdatedAt`. `merged`/`transformed` fields are
plain JSON-shaped values (Convex documents contain no `Date`/`Map`/`Set`), so
a straightforward structural comparison is sufficient — no dependency needed.

```ts
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return false;

  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, i) => deepEqual(item, b[i]));
  }

  const aKeys = Object.keys(a as Record<string, unknown>);
  const bKeys = Object.keys(b as Record<string, unknown>);
  return (
    aKeys.length === bKeys.length &&
    aKeys.every((key) => deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]))
  );
}
```

#### packages/core/src/api/utils.test.ts

Append:

```ts
describe("deepEqual", () => {
  it("treats two objects with the same content as equal regardless of reference", () => {
    expect(deepEqual({ a: 1, b: [1, 2] }, { a: 1, b: [1, 2] })).toBe(true);
  });

  it("detects a changed nested value", () => {
    expect(deepEqual({ a: 1, b: [1, 2] }, { a: 1, b: [1, 3] })).toBe(false);
  });

  it("treats primitives by value", () => {
    expect(deepEqual("x", "x")).toBe(true);
    expect(deepEqual(1, 2)).toBe(false);
  });

  it("treats null and undefined as unequal to each other and to objects", () => {
    expect(deepEqual(null, undefined)).toBe(false);
    expect(deepEqual(null, {})).toBe(false);
  });
});
```

#### packages/core/src/api/update/server.ts

Same imports as `create/server.ts`, plus `deepEqual` from `../utils` (already
imported there for `resolveAccessCall`/`stampUpdatedAt`). Full body:

```ts
export async function update<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(args: UpdateServerArgs<DataModel, TCollectionSlug>): Promise<void> {
  const collection = args.config.collections.find((c) => c.slug === args.collection);
  if (!collection) {
    throw new ConvexError(`No collection registered with slug "${args.collection}"`);
  }

  const stored = await args.ctx.db.get(args.id);
  if (args.config.access !== undefined) {
    const { access, action, resource } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: CRUD_ACTIONS.update,
      resource: args.collection,
    });
    hasPermission({
      throwOnDenied: true,
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      data: stored ?? undefined,
      changes: args.data,
    });
  }

  const { _id, _creationTime, ...storedFields } = (stored ?? {}) as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...storedFields, ...args.data };

  let transformed = merged;
  if (collection.hooks.beforeChange) {
    transformed = (await collection.hooks.beforeChange({
      operation: "update",
      doc: merged as never,
      ctx: args.ctx,
    })) as never;
  }

  const changedKeys = new Set(Object.keys(args.data));
  for (const key of Object.keys(transformed)) {
    if (!deepEqual(transformed[key], merged[key])) changedKeys.add(key);
  }

  const parsed = getCollectionInputSchema({ collection, partial: true }).safeParse(transformed);
  if (!parsed.success) {
    throw new ConvexError({ message: "Validation failed", errors: parsed.error.message });
  }

  await validateFields({ collection, doc: transformed as never, keys: changedKeys, ctx: args.ctx });

  const patch: Record<string, unknown> = {};
  for (const key of changedKeys) patch[key] = transformed[key];

  const data = stampUpdatedAt({ collection: args.collection, config: args.config, data: patch });
  await args.ctx.db.patch(args.id, data as never);
}
```

#### packages/core/src/api/update/server.test.ts

Same fixture reorder as `create/server.test.ts`. Append:

```ts
describe("update (server) — validation and hooks", () => {
  test("a partial update touching one field does not trip required on absent fields", async () => {
    const collection = defineCollection({ slug: "posts", fields: { title: text({ required: true }), body: text({ required: true }) } });
    const config = { collections: [collection] } as unknown as VexConfig;
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) => ctx.db.insert("posts", { title: "Hi", body: "Body" } as never));
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) => update({ ctx, config, collection: "posts", id: id as never, data: { title: "Hi 2" } })),
    ).resolves.toBeUndefined();
  });

  test("rejects a present field that violates its constraint on a partial update", async () => {
    const collection = defineCollection({ slug: "posts", fields: { title: text({ max: { value: 5 } }) } });
    const config = { collections: [collection] } as unknown as VexConfig;
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) => ctx.db.insert("posts", { title: "Hi" } as never));
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) => update({ ctx, config, collection: "posts", id: id as never, data: { title: "way too long" } })),
    ).rejects.toThrow(ConvexError);
  });

  test("beforeChange sees the merged document, so a cross-field rule works on a partial write", async () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { startDate: text(), endDate: text() },
      hooks: {
        beforeChange: ({ doc }) => {
          if (doc.endDate && doc.startDate && doc.endDate <= doc.startDate) {
            throw new Error("endDate must be after startDate");
          }
          return doc;
        },
      },
    });
    const config = { collections: [collection] } as unknown as VexConfig;
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { startDate: "2026-01-01", endDate: "2026-02-01" } as never),
    );
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) => update({ ctx, config, collection: "posts", id: id as never, data: { endDate: "2025-01-01" } })),
    ).rejects.toThrow(/endDate must be after startDate/);
  });
});
```

#### packages/core/src/fields/text/validator.ts

Replace the docstring line `* - Validation happens in the admin panel and mutation handlers` with:

```ts
 * - Validation happens in the admin panel (client Zod) and in every mutation
 *   built through `create`/`update` (server Zod, run via the shared write pipeline)
```

#### packages/core/src/fields/number/validator.ts

Same docstring correction.

Verify: `pnpm --filter @vexcms/core test -- api/create/server api/update/server api/utils`

---

### Step 4 — Wire `beforeDelete` into `remove` [dev]

#### packages/core/src/api/remove/server.ts

Add imports:

```ts
import { ConvexError } from "convex/values";
```

`removeById`'s body:

```ts
async function removeById(id: GenericId<TCollectionSlug>): Promise<void> {
  const doc = await args.ctx.db.get(id);
  if (args.config.access !== undefined) {
    const { access, action, resource } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: CRUD_ACTIONS.delete,
      resource: args.collection,
    });
    hasPermission({
      throwOnDenied: true,
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      data: doc ?? undefined,
    });
  }

  if (args.softDelete) {
    return await args.ctx.db.patch(args.collection, id, { [args.softDelete as never]: true });
  }

  const collection = args.config.collections.find((c) => c.slug === args.collection);
  if (!collection) {
    throw new ConvexError(`No collection registered with slug "${args.collection}"`);
  }

  if (collection.hooks.beforeDelete && doc) {
    await collection.hooks.beforeDelete({ id: id as never, doc: doc as never, ctx: args.ctx });
  }

  return await args.ctx.db.delete(args.collection, id);
}
```

#### packages/core/src/api/remove/server.test.ts

Fixture updates matching Step 3. Append:

```ts
describe("remove (server) — beforeDelete", () => {
  test("beforeDelete throwing aborts the delete", async () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text() },
      hooks: { beforeDelete: () => { throw new Error("cannot delete"); } },
    });
    const config = { collections: [collection] } as unknown as VexConfig;
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) => ctx.db.insert("posts", { title: "Hi" } as never));
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) => remove({ ctx, config, collection: "posts", ids: [id as never] })),
    ).rejects.toThrow(/cannot delete/);
    const stillThere = await t.run((ctx: GenericMutationCtx<GenericDataModel>) => ctx.db.get(id as never));
    expect(stillThere).not.toBeNull();
  });

  test("a soft delete does not run beforeDelete", async () => {
    let called = false;
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text(), deleted: text() },
      hooks: { beforeDelete: () => { called = true; } },
    });
    const config = { collections: [collection] } as unknown as VexConfig;
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) => ctx.db.insert("posts", { title: "Hi" } as never));
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) => remove({ ctx, config, collection: "posts", ids: [id as never], softDelete: "deleted" }));
    expect(called).toBe(false);
  });
});
```

Verify: `pnpm --filter @vexcms/core test -- api/remove/server`

---

### Step 5 — Triggers integration: wrapped mutation builder [dev]

#### packages/core/src/api/triggers.ts

New file, complete.

```ts
import type { FunctionVisibility, GenericDataModel, MutationBuilder } from "convex/server";
import { Triggers } from "convex-helpers/server/triggers";
import { customCtx, customMutation } from "convex-helpers/server/customFunctions";
import type { VexConfig } from "../config";

export function createVexMutations<
  DataModel extends GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>(props: {
  config: VexConfig;
  mutation: MutationBuilder<DataModel, Visibility>;
  internalMutation: MutationBuilder<DataModel, "internal">;
}): {
  mutation: MutationBuilder<DataModel, Visibility>;
  internalMutation: MutationBuilder<DataModel, "internal">;
} {
  const triggers = new Triggers<DataModel>();

  for (const collection of props.config.collections) {
    const { afterChange, afterDelete } = collection.hooks;
    if (!afterChange && !afterDelete) continue;

    triggers.register(collection.slug as never, async (ctx, change) => {
      if (change.operation === "delete") {
        await afterDelete?.({ id: change.id as never, oldDoc: change.oldDoc as never, ctx });
        return;
      }
      await afterChange?.({
        operation: change.operation === "insert" ? "create" : "update",
        id: change.id as never,
        oldDoc: (change.oldDoc ?? null) as never,
        newDoc: change.newDoc as never,
        ctx,
      });
    });
  }

  return {
    mutation: customMutation(props.mutation, customCtx(triggers.wrapDB)) as MutationBuilder<DataModel, Visibility>,
    internalMutation: customMutation(props.internalMutation, customCtx(triggers.wrapDB)) as MutationBuilder<DataModel, "internal">,
  };
}
```

#### packages/core/src/api/triggers.test.ts

New file. Registers a real mutation through the wrapped builder against the existing `api/test/convex` fixture and confirms `afterChange` fires with the committed document.

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";
import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import type { VexConfig } from "../config";
import { defineCollection, text } from "../index";
import { create } from "./create/server";
import { createVexMutations } from "./triggers";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("createVexMutations", () => {
  test("afterChange fires after a write made through the wrapped mutation commits", async () => {
    const seen: unknown[] = [];
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text() },
      hooks: { afterChange: (props) => void seen.push(props) },
    });
    const config = { collections: [collection] } as unknown as VexConfig;
    const t = convexTest(schema, modules);

    const { mutation } = createVexMutations({
      config,
      mutation: (t as never as { mutation: never }).mutation,
      internalMutation: (t as never as { mutation: never }).mutation,
    });
    void mutation;

    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await create({ ctx, config, collection: "posts", data: { title: "Hi" } });
    });

    expect(seen).toHaveLength(0);
  });

  test("a collection with no afterChange/afterDelete registers no trigger", () => {
    const collection = defineCollection({ slug: "posts", fields: { title: text() } });
    const config = { collections: [collection] } as unknown as VexConfig;
    expect(() =>
      createVexMutations({ config, mutation: (() => {}) as never, internalMutation: (() => {}) as never }),
    ).not.toThrow();
  });
});
```

The first test's assertion (`seen` stays empty) is deliberate and documents a real limitation, not a bug: `t.run` bypasses every registered mutation and calls `ctx.db` directly, so `create()` called inside `t.run` never goes through the `Triggers`-wrapped `ctx.db` — only a write made through a mutation *registered with* the wrapped builder (`mutation({ handler: ... })`, called via `t.mutation`) fires triggers. `api/test/convex/` has no registered mutation to exercise this against yet; add one (`packages/core/src/api/test/convex/testMutations.ts`, a thin `export const create = mutation({ args: { collection: v.string(), data: v.any() }, handler: (ctx, args) => create({ ctx, config: testConfig, ...args }) })` wired through `createVexMutations`) before finalizing this test, then assert `seen` has length 1 with the inserted document. Flagging this rather than shipping the weaker assertion silently.

#### packages/core/src/api/server.ts

Add `export { createVexMutations } from "./triggers";` alongside the other `export { X } from "./y"` lines.

Verify: `pnpm --filter @vexcms/core test -- api/triggers`

---

### Step 6 — Wire `apps/www` and `apps/test` onto the wrapped builder [agent]

#### apps/www/convex/triggers.ts

New file, complete.

```ts
import { createVexMutations } from "@vexcms/core/server";

import config from "~/vex.config.server";

import { internalMutation, mutation } from "./_generated/server";

export const { mutation: wrappedMutation, internalMutation: wrappedInternalMutation } = createVexMutations({
  config,
  mutation,
  internalMutation,
});

export { wrappedMutation as mutation, wrappedInternalMutation as internalMutation };
```

#### apps/www/convex/vex.ts

```ts
import { query } from "./_generated/server";
import { mutation } from "./triggers";
```

#### apps/www/convex/vex/globals.ts

Same import change.

#### apps/www/convex/vex/media.ts

Same import change.

#### apps/test/convex/triggers.ts

Identical to `apps/www/convex/triggers.ts`.

#### apps/test/convex/vex.ts

Same import change.

#### apps/test/convex/vex/globals.ts

Same import change.

#### apps/test/convex/vex/media.ts

Same import change.

#### scripts/verify-hooks-wiring.mjs

New file, complete.

```js
#!/usr/bin/env node
import { readFileSync } from "node:fs";

const CHECKED_FILES = ["convex/vex.ts", "convex/vex/globals.ts", "convex/vex/media.ts"];

const apps = process.argv.slice(2);
if (apps.length === 0) {
  console.error("usage: verify-hooks-wiring.mjs <app-dir> [<app-dir> ...]");
  process.exit(2);
}

let failed = false;
for (const app of apps) {
  for (const relPath of CHECKED_FILES) {
    const path = `${app}/${relPath}`;
    let source;
    try {
      source = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    const importLine = source.match(/import\s*\{([^}]*)\}\s*from\s*["']\.\/(\.\.\/)?_generated\/server["']/);
    if (importLine && /\bmutation\b/.test(importLine[1])) {
      console.error(`${path}: imports "mutation" from _generated/server — expected "./triggers"`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log(`verify-hooks-wiring: OK (${apps.length} app${apps.length === 1 ? "" : "s"})`);
```

Verify: `pnpm --filter www test && pnpm --filter www exec tsc --noEmit && pnpm --filter test test && pnpm --filter test exec tsc --noEmit && node scripts/verify-hooks-wiring.mjs apps/www apps/test`

---

### Step 7 — Wire the `base-nextjs` template [agent]

#### packages/create-vexcms/templates/base-nextjs/convex/triggers.ts

Identical to `apps/www/convex/triggers.ts`, adjusted for the template's own `vex.config.server` import path.

#### packages/create-vexcms/templates/base-nextjs/convex/vex.ts

Same import change as `apps/www/convex/vex.ts`.

#### packages/create-vexcms/templates/base-nextjs/convex/vex/globals.ts

Same import change.

#### packages/create-vexcms/templates/base-nextjs/convex/vex/media.ts

Same import change.

#### scripts/verify-scaffold.mjs

Add a call to the same check `verify-hooks-wiring.mjs` performs, against the freshly scaffolded project directory.

Verify: `pnpm verify:scaffold`

---

### Step 8 — Docs and changeset [dev]

#### apps/docs/src/content/docs/guides/lifecycle-hooks.mdx

New file. Covers the four hooks and their signatures, the two-tier validation model (client+server generated Zod vs. server-only `validate()`), the coverage limit (hooks fire only on writes through the vexcms API), BFS trigger recursion, and that `beforeChange` does not run against live-preview unsaved form state.

#### .changeset/lifecycle-hooks-validation.md

New file, complete.

```md
---
"@vexcms/core": minor
---

Collection writes through `create`/`update` now run each field's declared
`min`/`max`/`required`/etc. constraints server-side, not just in the admin
form — a write that violates a constraint through the documented Local API
now throws instead of silently succeeding. Collections can also declare
`hooks: { beforeChange, beforeDelete, afterChange, afterDelete }` and fields
can declare an async `validate()`. See the "Lifecycle hooks" guide.

**This is a behavior change for existing alpha consumers**: a write that
previously succeeded despite violating a field constraint will now be
rejected.
```

Verify: `pnpm changeset status`

## Verification

`pnpm build && pnpm test` at the repo root, then `pnpm verify:scaffold`.
