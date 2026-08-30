---
status: in-progress
spec_id: 2026-08-23-access-index-resolution
touches:
  - packages/core/src/access/**
  - packages/core/src/types/generated.ts
  - packages/core/src/types/generateVexTypes.ts
  - packages/core/src/api/find/**
  - packages/core/src/api/get/server.ts
  - packages/core/src/api/search/server.ts
  - packages/core/src/api/convex.ts
  - packages/core/src/config/types.ts
  - packages/core/src/config/config.ts
  - packages/react/src/hooks/usePaginatedQuery.ts
  - apps/www/src/auth/access.ts
  - apps/www/convex/vex.schema.ts
  - apps/docs/src/content/docs/guides/access-control.mdx
prompt_version: 1
---

# 2026-08-23-access-index-resolution — Spec

## Overview

Row-level read rules are evaluated in JS against documents Convex has **already
fetched** (`api/find/server.ts:193-227`), so a rule that permits 3 of 50,000 rows still
reads a full page to discard it — and returns short pages. This spec lets an access rule
contribute a Convex **index** to the query the framework builds, so the database returns
only rows the caller can see.

The mechanism mirrors `find`'s own API: a read rule may declare
`{ filter, withIndex }`, where `filter` is the existing per-document callback and
`withIndex` is `{ name, range }`. `filter` remains the authority; `withIndex` only
reduces what gets read.

This is a pre-existing RBAC defect, independent of drafts — it fires today for any
per-document read callback. It is specced first because
`2026-08-23-versioning-drafts` needs it: that spec's published-only filter is a
framework-supplied access index.

Full design, including the ten worked scenarios: `access-index-design.md` (this
directory).

## Design Decisions

1. **`filter` is the rule; `withIndex` is a hint.** The object form requires both.
   `withIndex`-only is not a valid shape — `hasPermission` is called where there is no
   query at all (`usePermission` on a fetched document, `get`/`update`/`remove`, the
   per-document pass in `find`), and with no `filter` those sites have nothing to
   evaluate. Returning `true` there would be a security hole; `false` would break
   legitimate access.
2. **The per-document pass always runs.** No `needsFilter` flag and no equivalence
   assertion, because proving a JS closure equals an index range is not possible. When
   the index expresses the rule the filter rejects nothing and pages stay full; pages are
   short only when the filter is genuinely stricter, which is unavoidable in any design.
3. **`resolveAccessIndex` is a sibling of `hasPermission`, not a mode of it.**
   `hasPermission` answers "may this user do X to _this document_"; pushdown asks "what
   index narrows _this query_". `hasPermission` ships, is heavily tested, and has six
   call sites — a param that changed its return shape would force every caller to narrow
   a union it does not care about.
4. **`name` is a static literal; only `range` is dynamic.** The index name must be known
   at the type level for §8's parameter typing, so the declaration is an object rather
   than a resolver returning a whole descriptor.
5. **`range` is required and never returns `undefined`.** A user attribute that switches
   someone between "sees own" and "sees all" is a capability level, which is what roles
   are for — `hasPermission` already OR-merges, so an extra role yields "sees all"
   natively. Allowing `undefined` would also make a falsy bug degrade a 3-row indexed
   read into a full scan silently.
6. **One form, `{ name, range }`; `range`'s parameter depends on `name`.** Matching the
   access index ⇒ `range` receives `access`, the builder positioned after the access
   prefix. Differing ⇒ it receives a fresh `q`. Exactly one is coherent per case, so
   there is no `{ access, q }` props object: a fresh `q` on a matching index could only
   replace the access prefix (guaranteed-empty, since the filter then rejects every row),
   and `access` on a differing index has no prefix to continue.
7. **An index may only be applied when every contributing role agrees on it.** Roles
   OR-merge (`hasPermission.ts:294`, `:298`), so narrowing on one role's index would hide
   rows another role permits. Unrestricted role present, or two roles with differing
   indexes ⇒ no index. Fails open to scanning, never to intersecting.
8. **The caller's `withIndex` wins the slot.** Convex permits one index per query. A
   caller-supplied index is an explicit, usually highly selective lookup, and the access
   `filter` still enforces the rule — so displacement costs reads, never correctness. Same
   name ⇒ ranges merge. Free slot ⇒ access claims it, which is the list-view case
   (`CollectionListView.tsx:60-72` passes neither `withIndex` nor `order`).
9. **Index names are typed from the generated schema.** `vex_generate` emits
   `IndexesBySlug` and `AccessIndexBySlug` into the existing registry, resolved with the
   same infer-or-widen shape as `CollectionSlug` (`types/generated.ts:60-64`). A
   collection with no access rule is absent from `AccessIndexBySlug`, so its
   `AccessIndexNameFor` is `never` and `range` always receives a fresh `q`.
10. **The object form is valid only on query-shaped actions.** `create`/`update`/`delete`
    authorize a single document, so a `withIndex` there is a silent no-op — restricted in
    `RolePermissions` to be a compile error.
11. **`totalDocs` becomes its own query function.** Today the page fetch and the count run
    in one body (`find/server.ts:194` + `:257`), sharing one read budget, so a count
    failure can take the page down with it. Splitting gives each its own budget.
12. **Bounds make the slow path visible, not impossible.** Un-indexable rules keep
    working. `loadMore` gains an iteration cap (default 5, configurable) because an
    unbounded loop is ~2,000 round trips for a sparse rule on a large table, and dev
    warnings name the collection, role, and field to index — so raising the cap reads as
    the second thing to try.

## Out of Scope

- **Continuing the access range** (design doc §8 Case A — `range: (access) => access.eq(…)`).
  Needs `AccessIndexNameFor`/`AccessRangeFor` threaded to the `find` call site through the
  `__subjects` phantom (P-002), and §6 arbitration is already correct without it. Only
  pays off when a rule names a compound index. Ship the plain form, prove the API, then add it.
- **A server-side pagination refill loop.** Superseded by pushdown: an indexed predicate
  returns a full first page, so there is nothing to refill.
- **Replacing permission closures with a declarative filter DSL.** That is an API break on
  `defineAccess` and the only way to compile _arbitrary_ rules; out of scope permanently
  unless the closure form proves insufficient.
- **A count strategy for unscoped collections.** Splitting the query (Decision 11) fixes
  the shared-budget hazard, but counting all rows of a 12,000-asset media library still
  reads all of them and no index can help — there is no predicate to index and Convex has
  no count aggregate. Deciding between "return `null` and say _many_" and a denormalized
  counter is separate work.
- **An ACL junction table.** The only architecture that beats the read floor for arbitrary
  rules, at the cost of maintaining it on every write and permission change.
- **Index selection for compound access+sort indexes.** Not needed until the data table
  gains column sorting, at which point access field + sort field contend for the one slot.
- Anything in `2026-08-23-versioning-drafts`.

## Implementation

### Cross-step conventions

**Type placement.** Every type crossing a module boundary lives in
`packages/core/src/access/types.ts`, declared in Step 1:

| Type                                                         | Declared in                | Consumed by              |
| ------------------------------------------------------------ | -------------------------- | ------------------------ |
| `AccessIndex`, `IndexedPermissionCheck`, `QueryShapedAction` | `access/types.ts` (Step 1) | `defineAccess` authoring |
| `IndexRangeFn`, `QueryIndex`                                 | `access/types.ts` (Step 1) | Steps 3, 4, 5, 6         |

Steps 3–6 import these from `./types` rather than declaring them locally — three
modules and both `find` and `count` consume them, so a local declaration would force a
cross-module import from an implementation file.

### Step 1 — Access index types + constants `[agent]`

- [x] `packages/core/src/access/constants.ts` — add `QUERY_SHAPED_ACTIONS` (`as const`
      map → `QueryShapedAction`, per P-003). Members: `read`, `readDrafts`.
- [x] `packages/core/src/access/types.ts` — `AccessIndex`, `IndexedPermissionCheck`;
      widen `PermissionCheck` to include the object form; add `indexes` to `SubjectEntry`
      and to the `SubjectMap` resource branch; restrict the object form to
      `QueryShapedAction` keys in `RolePermissions`.
- [x] `packages/core/src/access/types.test.ts` — type-level assertions: object form
      accepted on `read`, rejected on `create`/`update`/`delete`.

#### `packages/core/src/access/constants.ts`

```ts
/**
 * CRUD actions available on every resource subject (collections and globals).
 *
 * Draft actions ({@link DRAFT_ACTIONS}) are added conditionally when a resource
 * declares `versions.drafts: true`.
 */
export const CRUD_ACTIONS = {
  create: "create",
  read: "read",
  update: "update",
  delete: "delete",
} as const;
/** CRUD action union, derived from {@link CRUD_ACTIONS}. */
export type CrudAction = (typeof CRUD_ACTIONS)[keyof typeof CRUD_ACTIONS];

/**
 * Draft workflow actions — present on a resource subject only when its config
 * declares `versions.drafts: true` (globals today; collections with Spec 36).
 */
export const DRAFT_ACTIONS = {
  readDrafts: "readDrafts",
  saveDraft: "saveDraft",
  publish: "publish",
  unpublish: "unpublish",
} as const;
/** Draft action union, derived from {@link DRAFT_ACTIONS}. */
export type DraftAction = (typeof DRAFT_ACTIONS)[keyof typeof DRAFT_ACTIONS];

/**
 * Actions whose read shape is a query rather than a single-document check —
 * the only actions an indexed `{ filter, withIndex }` permission check may
 * target (design doc §3: `withIndex` on `create`/`update`/`delete` would
 * narrow nothing, since those authorize one document, not a range).
 */
export const QUERY_SHAPED_ACTIONS = {
  read: "read",
  readDrafts: "readDrafts",
} as const;
/** Query-shaped action union, derived from {@link QUERY_SHAPED_ACTIONS}. */
export type QueryShapedAction =
  (typeof QUERY_SHAPED_ACTIONS)[keyof typeof QUERY_SHAPED_ACTIONS];

/**
 * Field-mode object modes: `allow` = only the listed fields, `deny` = all but
 * the listed fields.
 */
export const PERMISSION_MODES = {
  allow: "allow",
  deny: "deny",
} as const;
/** Field-mode object mode, derived from {@link PERMISSION_MODES}. */
export type PermissionMode =
  (typeof PERMISSION_MODES)[keyof typeof PERMISSION_MODES];

/**
 * How `hasPermission` answers a *quantified* question: when no `data` is
 * supplied and a role's check is a callback that needs the document, the scope
 * decides what "yes" would even mean.
 *
 * - `doc` — "may they do this to THIS document?" `data` is required; a callback
 *   that needs it and does not get it throws {@link VexAccessError}. Opt into
 *   this in edit views and row actions, where a silent `false` would surface as
 *   a permanently disabled control and read like a misconfigured matrix.
 * - `any` — "may they do this to AT LEAST ONE document?" Resolves such a callback
 *   to `true` without invoking it. Use for nav/sidebar/list gating; per-document
 *   filtering still happens downstream in `find`/`get`.
 * - `all` (default) — "may they do this to EVERY document?" Resolves such a
 *   callback to `false`: a per-document condition cannot hold for all of them.
 *   Fail-closed, so omitting `scope` never throws and never over-permits.
 *
 * Static boolean checks are unaffected by scope, and any scope evaluates the
 * callback normally once `data` is supplied.
 */
export const PERMISSION_SCOPES = {
  doc: "doc",
  any: "any",
  all: "all",
} as const;
/** Permission evaluation scope, derived from {@link PERMISSION_SCOPES}. */
export type PermissionScope =
  (typeof PERMISSION_SCOPES)[keyof typeof PERMISSION_SCOPES];

/**
 * Wildcard key usable at two matrix levels: role level (`admin: { [WILDCARD_KEY]:
 * true }`, boolean only) and action level inside a per-action map (any
 * `PermissionCheck`). Precedence: explicit action > subject wildcard > role
 * wildcard > `defaults`.
 */
export const WILDCARD_KEY = "*" as const;

/**
 * Built-in non-resource subjects contributed by core. Every entry becomes a
 * subject in the {@link SubjectMap} exactly like a user-declared custom
 * resource (no data, no fields).
 */
export const ADMIN_CUSTOM_SUBJECTS = {
  adminPanel: {
    key: "adminPanel",
    actions: ["access", "impersonate"],
  },
} as const;

/** Union of built-in subject slugs (currently `"adminPanel"`). */
export type AdminCustomSubjectSlug = keyof typeof ADMIN_CUSTOM_SUBJECTS;
```

#### `packages/core/src/access/types.ts`

Five edits. Everything not shown is unchanged.

**1 — imports.** Add `IndexNameFor` to the existing `../types/generated` type import,
`QueryShapedAction` to the existing `./constants` import, and one new import line:

```ts
import type { IndexRange, IndexRangeBuilder } from "convex/server";
```

**2 — extract `BasePermissionCheck`, then re-point `PermissionCheck` at it.** The
current `PermissionCheck` body becomes `BasePermissionCheck` verbatim; `PermissionCheck`
becomes a union of that plus the new object form. Replace the existing
`export type PermissionCheck<…>` declaration (and its doc comment) with all four
declarations below, in this order:

```ts
/**
 * The plain permission check shapes shared by every action: static
 * boolean/field-mode result or a callback. No `withIndex` — see
 * {@link IndexedPermissionCheck} for the object form. @internal
 */
type BasePermissionCheck<TData, TUser, TOrg, TFieldKeys extends string> =
  | FieldPermissionResult<TFieldKeys>
  | ((
      props: PermissionCallbackProps<TData, TUser, TOrg>,
    ) => FieldPermissionResult<TFieldKeys> | undefined);

/**
 * The index an access rule declares — what the user authors inside
 * {@link IndexedPermissionCheck.withIndex}.
 *
 * `name` is a static literal, checked against the generated
 * {@link IndexNameFor} union for the resource — a misspelled name is a
 * compile error once `vex generate` has run. `range` is a hint, never
 * authorization: the paired `filter` always runs (design doc §1).
 *
 * Contrast {@link QueryIndex}, the index a *query* ends up using: this type's
 * `range` is a function **of the caller** (`(props) => (q) => …`) and its
 * `name` is narrowed to the resource's index union. Resolving one binds the
 * caller in and widens `name` to `string`, producing a `QueryIndex`. This is
 * the template; that is the template applied to one caller.
 *
 * **Both members are required.** Unlike `find`'s `withIndex` — where a caller
 * may legitimately name an index with no range purely to order results — an
 * access rule has no business dictating sort order, and an index with no range
 * excludes no rows. A range-less access index would read the whole table and
 * filter per document: exactly the behavior this type exists to prevent, and
 * silently. Callers who only want ordering use `find`'s own `withIndex`.
 *
 * @typeParam TIndexName - Union of index names declared on the resource;
 *   widens to `string` pre-generation.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape; `never` if not configured.
 */
export type AccessIndex<
  TIndexName extends string = string,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
> = {
  /** Static index name — must exist on the resource's index union. */
  name: TIndexName;
  /**
   * Builds the range for this rule from the caller. No `data` — this runs
   * once per query, before any document is read. Required: see the type doc.
   */
  range: (
    props: PermissionCallbackProps<never, TUser, TOrg>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => (q: IndexRangeBuilder<any, any>) => IndexRange;
};

/**
 * The indexed object form of a permission check: `filter` is the rule
 * (authoritative, always runs); `withIndex` is a hint that narrows the query
 * before `filter` runs. `withIndex`-only is not a valid shape — design doc
 * §1. Valid only on {@link QueryShapedAction} actions ({@link RolePermissions}
 * restricts every other action to the plain check shapes).
 *
 * @typeParam TData - Document type for the subject.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape; `never` if not configured.
 * @typeParam TFieldKeys - Union of valid field keys for this subject.
 * @typeParam TIndexName - Union of index names declared on the resource.
 */
export type IndexedPermissionCheck<
  TData = unknown,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
  TFieldKeys extends string = string,
  TIndexName extends string = string,
> = {
  /** The rule. Authoritative — always runs, even when `withIndex` narrows first. */
  filter: BasePermissionCheck<TData, TUser, TOrg, TFieldKeys>;
  /** A hint. Narrows what gets read; never carries authorization on its own. */
  withIndex: AccessIndex<TIndexName, TUser, TOrg>;
};

/**
 * A single permission check — static boolean, field-mode object, callback,
 * or (query-shaped actions only, see {@link RolePermissions}) the indexed
 * object form pairing a `filter` with a `withIndex` hint
 * ({@link IndexedPermissionCheck}).
 *
 * A callback returning `undefined` is treated as deny.
 *
 * @typeParam TData - Document type for the subject.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape; `never` if not configured.
 * @typeParam TFieldKeys - Union of valid field keys for this subject.
 * @typeParam TIndexName - Union of index names declared on the resource;
 *   widens to `string` pre-generation.
 */
export type PermissionCheck<
  TData = unknown,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
  TFieldKeys extends string = string,
  TIndexName extends string = string,
> =
  | BasePermissionCheck<TData, TUser, TOrg, TFieldKeys>
  | IndexedPermissionCheck<TData, TUser, TOrg, TFieldKeys, TIndexName>;
```

Also add the resolved-side types here rather than in the Step 3/4 modules that consume
them (see _Cross-step conventions_):

```ts
/** A range callback as applied to a Convex query. @internal */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IndexRangeFn = (q: IndexRangeBuilder<any, any>) => IndexRange;

/**
 * An unconstrained range — the whole index, in index order.
 *
 * Valid because `IndexRangeBuilder` extends `LowerBoundIndexRangeBuilder`
 * extends `UpperBoundIndexRangeBuilder` extends `IndexRange`
 * (`convex/src/server/index_range_builder.ts:139-142`), so returning the
 * builder unchanged applies no constraints. Semantically identical to calling
 * `withIndex(name)` with no range at all.
 *
 * Used by `pickQueryIndex` to normalize a caller's ordering-only index, so
 * {@link QueryIndex.range} can be required everywhere downstream.
 */
export const UNCONSTRAINED_RANGE: IndexRangeFn = (q) => q;

/**
 * A concrete index a query will use: the output of `resolveAccessIndex` and,
 * after arbitration, of `pickQueryIndex`. Both stages produce the same shape,
 * so there is one type for both.
 *
 * Distinct from {@link AccessIndex}, which is what the user *authors*: an
 * `AccessIndex` carries a `range` that is a function **of the caller**
 * (`(props) => (q) => …`) and a `name` typed against the resource's generated
 * index union. Resolving one binds the caller in, leaving the plain
 * `(q) => …` builder here and widening `name` to `string` — by resolve time
 * the resource generic is gone. `AccessIndex` is the template; this is that
 * template applied to one caller.
 *
 * `range` is **required**. A caller may legitimately pass `find` a range-less
 * index purely to order results, but `pickQueryIndex` normalizes that to
 * {@link UNCONSTRAINED_RANGE} rather than propagating an optional — so no
 * consumer needs a null check for a value that is only ever absent in one
 * upstream branch.
 */
export interface QueryIndex {
  /** Index name to query. */
  name: string;
  /** Range to apply. Always present — see {@link UNCONSTRAINED_RANGE}. */
  range: IndexRangeFn;
}
```

**3 — `SubjectEntry` gains `indexes`.** Add one member to the existing interface:

```ts
/** Union of access-index names declared on this resource; `never` for non-indexable subjects. */
indexes: string;
```

**4 — new inference helper.** Add beside the existing `ExtractFieldKeys` / `HasDrafts`
helpers in the inference-helpers block:

```ts
/**
 * Index-name union for a resource config via its slug literal, from the
 * generated {@link IndexNameFor} registry (wide `string` fallback
 * pre-generation). @internal
 */
type ExtractIndexNames<T> = T extends { slug: infer S extends string }
  ? IndexNameFor<S>
  : string;
```

**5 — `SubjectMap` and `RolePermissions`.** In `SubjectMap`, add one line to each of the
three mapped-type branches:

```ts
// resource branch — beside `fields: ExtractFieldKeys<R>;`
indexes: ExtractIndexNames<R>;

// custom-resource branch and ADMIN_CUSTOM_SUBJECTS branch — beside `fields: never;`
indexes: never;
```

In `RolePermissions`, the per-action map becomes conditional on the action, and the
action-level wildcard narrows to the base shapes. Replace the mapped type's body — the
two lines of its doc comment describing action shapes should be updated too:

```ts
  [S in keyof TSubjects]?:
    | boolean
    | ({
        [A in TSubjects[S]["action"]]?: A extends QueryShapedAction
          ? PermissionCheck<
              TSubjects[S]["data"],
              TUser,
              TOrg,
              TSubjects[S]["fields"],
              TSubjects[S]["indexes"]
            >
          : BasePermissionCheck<TSubjects[S]["data"], TUser, TOrg, TSubjects[S]["fields"]>;
      } & {
        [W in typeof WILDCARD_KEY]?: BasePermissionCheck<
          TSubjects[S]["data"],
          TUser,
          TOrg,
          TSubjects[S]["fields"]
        >;
      });
```

Why the wildcard is `BasePermissionCheck` and not `PermissionCheck`: `*` may cover
non-query-shaped actions, where a `withIndex` narrows nothing (design doc §3). The
role-level wildcard stays boolean-only and is unchanged.

#### `packages/core/src/access/types.test.ts`

```ts
import { describe, it } from "vitest";
import { defineCollection, text } from "../index";
import { WILDCARD_KEY } from "./constants";
import { defineAccess } from "./config";

// Core tests run with an unaugmented GeneratedVexTypes registry, so callback
// `data`/`user` params are the wide pre-generation fallback — the `typeof`/`in`
// guards below are expected and disappear in apps after `vex generate`
// augments the registry.

const pages = defineCollection({
  slug: "pages",
  fields: { title: text({ required: true }), authorId: text() },
});

const users = defineCollection({
  slug: "users",
  fields: { name: text({ required: true }), roles: text() },
});

/** Shared valid base — spread into calls, override per test. */
const baseInput = {
  roles: ["admin", "contributor"] as const,
  resources: [pages, users],
  userCollectionSlug: "users",
  userRolesField: "roles",
} as const;

describe("PermissionCheck — indexed object form", () => {
  it("accepts { filter, withIndex } on a query-shaped action (read)", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            read: {
              filter: ({ data, user }: { data: unknown; user: unknown }) =>
                typeof data === "object" &&
                data !== null &&
                "authorId" in data &&
                typeof user === "object" &&
                user !== null &&
                "_id" in user
                  ? data.authorId === user._id
                  : false,
              withIndex: {
                name: "by_author",
                range:
                  ({ user }: { user: unknown }) =>
                  (q: any) =>
                    q.eq(
                      "authorId",
                      typeof user === "object" && user !== null && "_id" in user
                        ? user._id
                        : undefined,
                    ),
              },
            },
          },
        },
      },
    });
  });

  it("rejects the object form on create — not a query-shaped action", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            create: {
              // @ts-expect-error — object form is only valid on query-shaped actions (read/readDrafts)
              filter: () => true,
              withIndex: { name: "by_author" },
            },
          },
        },
      },
    });
  });

  it("rejects the object form on update — not a query-shaped action", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            update: {
              // @ts-expect-error — object form is only valid on query-shaped actions (read/readDrafts)
              filter: () => true,
              withIndex: { name: "by_author" },
            },
          },
        },
      },
    });
  });

  it("rejects the object form on delete — not a query-shaped action", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            delete: {
              // @ts-expect-error — object form is only valid on query-shaped actions (read/readDrafts)
              filter: () => true,
              withIndex: { name: "by_author" },
            },
          },
        },
      },
    });
  });

  it("rejects withIndex without filter — filter is required, not a hint (design doc §1)", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            // @ts-expect-error — `filter` is required; `withIndex`-only is not a valid shape
            read: {
              withIndex: { name: "by_author" },
            },
          },
        },
      },
    });
  });
});
```

Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/core typecheck`

### Step 2 — Generated index registry `[agent]`

- [x] `packages/core/src/types/generated.ts` — `IndexesBySlug`, `IndexNameFor<S>`,
      `AccessIndexBySlug`, `AccessIndexNameFor<S, A>`. Map-level `infer` constraints
      only (AP-003).
- [x] `packages/core/src/types/generateVexTypes.ts` — emit both registry entries into
      the `declare module` block; index names read from the generated schema, access
      index names from the resolved access config.
- [x] `packages/core/src/types/generateVexTypes.test.ts` — emitted output contains both
      maps; collections with no access rule are absent from `AccessIndexBySlug`.

#### `packages/core/src/types/generated.ts`

Insert the four new exports directly
after the existing `DocumentBySlug` type (`IndexesBySlug`/`IndexNameFor` immediately
after `DocumentBySlug`, `AccessIndexBySlug`/`AccessIndexNameFor` after those); every
other export in this file (`GeneratedVexTypes`, `CollectionSlug`, `DocumentBySlug`,
`MediaCollectionSlug`, `StorageAdapterSlug`, `CollectionsFieldTypeMap`, `GlobalSlug`,
`GlobalDocumentBySlug`, `GlobalsFieldTypeMap`, `VexDocumentGlobal`,
`GlobalRelationshipKeysOf`, `GlobalPopulateShape`, `GlobalPopulated`) is unchanged:

```ts
/**
 * Maps each collection slug to the union of index names declared on its
 * Convex table (`.index(name, [...])` — search indexes excluded, since
 * `withIndex` never targets those).
 *
 * - **Before `vex generate`:** resolves to `Record<string, string>`.
 * - **After `vex generate`:** e.g. `{ pages: "by_slug" | "by_author" }`.
 */
export type IndexesBySlug = GeneratedVexTypes extends {
  IndexesBySlug: infer I extends Record<string, string>;
}
  ? I
  : Record<string, string>;

/** Index-name union for one slug; widens to `string` pre-generation. @internal */
export type IndexNameFor<S extends string> = S extends keyof IndexesBySlug
  ? IndexesBySlug[S]
  : string;

/**
 * Maps each collection slug to the access-index name declared by an access
 * rule's `withIndex`, per query-shaped action. A slug (or action) absent
 * from the map declares no access index — see {@link AccessIndexNameFor}.
 *
 * - **Before `vex generate`:** resolves to `Record<string, Record<string, string>>`.
 * - **After `vex generate`:** e.g. `{ pages: { read: "by_author" } }` — `media`
 *   absent means no access index on any action.
 */
export type AccessIndexBySlug = GeneratedVexTypes extends {
  AccessIndexBySlug: infer A extends Record<string, Record<string, string>>;
}
  ? A
  : Record<string, Record<string, string>>;

/**
 * The access index name for a slug + action, or `never` when none is
 * declared. Powers the `range`-parameter typing on `IndexRangeBuilder`
 * consumers (design doc §7–8): a caller's `withIndex.name` matching this
 * continues the access-rule's index prefix instead of starting at position 0.
 *
 * @typeParam S - Collection slug.
 * @typeParam A - Action name.
 */
export type AccessIndexNameFor<
  S extends string,
  A extends string,
> = S extends keyof AccessIndexBySlug
  ? A extends keyof AccessIndexBySlug[S]
    ? AccessIndexBySlug[S][A]
    : never
  : never;
```

#### `packages/core/src/types/generateVexTypes.ts`

Full file:

````ts
import {
  collectionConfigToFieldTypeMap,
  collectionConfigToInterface,
} from "../collections/interfaceGen";
import type { CollectionConfig } from "../collections/types";
import type { SubjectEntry, VexAccessConfig } from "../access/types";
import type { VexConfig } from "../config/types";
import { ADMIN_FIELDS } from "../fields/constants";
import {
  globalConfigToFieldTypeMap,
  globalConfigToInterface,
} from "../globals";
import { STORAGE_ADAPTER_PROTOCOLS } from "../media";

/**
 * Index names declared on a collection's Convex table — the same
 * computation `collectionConfigToVexSchema` uses for its `.index()` chain
 * (`collections/validator.ts:114-118`): an explicit `field.index`, or an
 * auto `by_<fieldKey>` for every relationship field. Search indexes are
 * excluded — `withIndex` never targets those.
 *
 * @param props - Input props.
 * @param props.collection - The collection to read index-bearing fields from.
 * @returns The collection's declared Convex index names, in field order.
 * @internal
 */
function collectIndexNames(props: { collection: CollectionConfig }): string[] {
  const names: string[] = [];
  for (const [fieldKey, field] of Object.entries(props.collection.fields)) {
    if (field.index) {
      names.push(field.index);
    } else if (field.type === ADMIN_FIELDS.relationship.type) {
      names.push(`by_${fieldKey}`);
    }
  }
  return names;
}

/**
 * Narrows a type-erased permission check ({@link VexAccessConfig.permissions}
 * entry) to its `withIndex.name`, when the check is the indexed object form.
 *
 * @param check - A single role's type-erased permission check value.
 * @returns The declared `withIndex.name`, or `undefined` when `check` isn't
 *   the indexed object form.
 * @internal
 */
function extractWithIndexName(check: unknown): string | undefined {
  if (typeof check !== "object" || check === null || !("withIndex" in check))
    return undefined;
  const { withIndex } = check;
  if (
    typeof withIndex !== "object" ||
    withIndex === null ||
    !("name" in withIndex)
  )
    return undefined;
  const { name } = withIndex;
  return typeof name === "string" ? name : undefined;
}

/**
 * Access-index names declared per collection + query-shaped action, read
 * from the resolved access config's type-erased `permissions` matrix.
 * Roles that declare different names for the same resource + action union
 * together in the emitted type — `AccessIndexNameFor` only gates the
 * `range`-continuation typing (design doc §7–8); picking a winner between
 * conflicting roles is `resolveAccessIndex`'s runtime concern, not this
 * static registry's.
 *
 * @param props - Input props.
 * @param props.access - Resolved access config; absent ⇒ empty map.
 * @returns Resource slug → action → set of declared `withIndex` names.
 * @internal
 */
function collectAccessIndexNames<
  TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>,
>(props: {
  access?: VexAccessConfig<TSubjects>;
}): Map<string, Map<string, Set<string>>> {
  const bySlug = new Map<string, Map<string, Set<string>>>();
  const permissions = props.access?.permissions;
  if (!permissions) return bySlug;
  for (const subjectChecks of Object.values(permissions)) {
    for (const [resource, actionChecks] of Object.entries(subjectChecks)) {
      if (typeof actionChecks !== "object" || actionChecks === null) continue;
      let actions = bySlug.get(resource);
      if (!actions) {
        actions = new Map<string, Set<string>>();
        bySlug.set(resource, actions);
      }
      for (const [action, check] of Object.entries(actionChecks)) {
        const indexName = extractWithIndexName(check);
        if (indexName === undefined) continue;
        let names = actions.get(action);
        if (!names) {
          names = new Set<string>();
          actions.set(action, names);
        }
        names.add(indexName);
      }
    }
  }
  return bySlug;
}

/**
 * Generates the full contents of `vex.types.ts` from a resolved `VexConfig`.
 *
 * When there are no collections, returns only the auto-generated header.
 * When collections are present, the output contains:
 * - Imports for `Id` (from `@convex/_generated/dataModel`) and `VexDocument` (from `@vexcms/core`)
 * - One `export interface` per collection, extending `VexDocument` with a branded `Id<"slug">` for `_id`
 * - `export type CollectionSlug` — union of all collection slugs
 * - `export type DocumentBySlug` — map of slug to document interface
 * - `declare module '@vexcms/core'` block that augments `GeneratedVexTypes`, narrowing
 *   `CollectionSlug` and `DocumentBySlug` inside `@vexcms/core` itself, plus
 *   `IndexesBySlug` (every collection's declared index names) and
 *   `AccessIndexBySlug` (the index name each access rule's `withIndex`
 *   declares, per collection + query-shaped action)
 *
 * @param props - Input props.
 * @param props.config - The fully resolved Vex configuration.
 * @returns The complete TypeScript source string to write to `vex.types.ts`.
 *
 * @example
 * ```ts
 * const config = defineConfig({
 *   collections: [
 *     defineCollection({ slug: "posts", fields: { title: text({ required: true }) } }),
 *   ],
 * });
 * const contents = generateVexTypes({ config });
 * // Writes to vex.types.ts:
 * // import type { Id } from "@convex/_generated/dataModel"
 * // import type { VexDocument } from "@vexcms/core"
 * // export interface PostsDocument extends VexDocument { _id: Id<"posts">; title: string }
 * // export type CollectionSlug = "posts"
 * // export type DocumentBySlug = { posts: PostsDocument }
 * // declare module "@vexcms/core" { interface GeneratedVexTypes { ... } }
 * ```
 *
 * @see {@link collectionConfigToInterface} for the per-collection interface builder
 * @see {@link VexConfig} for the resolved config shape
 */
export function generateVexTypes(props: { config: VexConfig }): string {
  const { config } = props;
  const typesHeader = `// ⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️
    // Run 'vex dev' or 'vex generate' to update this file.\n
    /* eslint-disable perfectionist/sort-union-types */
    /* eslint-disable perfectionist/sort-interfaces */
    /* eslint-disable perfectionist/sort-modules */\n\n
    import type { Id } from "@convex/_generated/dataModel"
    import type { VexDocument, VexDocumentGlobal } from "@vexcms/core"\n
  `;

  const allCollections = config.collections.concat(config.mediaCollections);
  const hasCollections = allCollections.length > 0;
  const hasGlobals = config.globals.length > 0;

  const interfaceBlocks = allCollections
    .map((collection) => collectionConfigToInterface({ collection }))
    .concat(
      config.globals.map((global) => globalConfigToInterface({ global })),
    );

  const collectionSlugs = !hasCollections
    ? "never"
    : allCollections.map((c) => `"${c.slug}"`).join(" | ");
  const collectionSlugType = `export type CollectionSlug = ${collectionSlugs}`;

  const mediaCollectionSlugs = !hasCollections
    ? `""`
    : config.mediaCollections.map((mc) => `"${mc.slug}"`).join(" | ");
  const mediaCollectionSlugType = `export type MediaCollectionSlug = ${mediaCollectionSlugs}`;

  const globalSlugs = !hasGlobals
    ? "never"
    : config.globals.map((g) => `"${g.slug}"`).join(" | ");
  const globalSlugType = `export type GlobalSlug = ${globalSlugs}`;

  const globalDocumentsBySlug = config.globals
    .map((g) => `\t${g.slug}: ${g.interfaceName}`)
    .join("\n");
  const globalDocumentBySlugType = !hasGlobals
    ? undefined
    : `export type GlobalDocumentBySlug = {\n${globalDocumentsBySlug}\n}`;

  const documentsBySlug = allCollections
    .map((c) => `\t${c.slug}: ${c.interfaceName}`)
    .join("\n");
  const documentBySlugType = `export type DocumentBySlug = {\n${documentsBySlug}\n}`;

  const collectionsFieldTypeMap = allCollections
    .map((c) => collectionConfigToFieldTypeMap({ collection: c }))
    .join("\n");

  const globalsFieldTypeMap = config.globals
    .map((g) => globalConfigToFieldTypeMap({ global: g }))
    .join("\n");

  const storageAdapterSlugs =
    config.storage?.adapters
      .filter((a) => a.type === STORAGE_ADAPTER_PROTOCOLS.presignedUrl)
      .map((a) => `"${a.name}"`)
      .join(" | ") ?? "never";
  const storageAdapterSlugType = `export type StorageAdapterSlug = ${storageAdapterSlugs}`;

  const indexesBySlugEntries = allCollections
    .map((c) => {
      const names = collectIndexNames({ collection: c });
      return `\t${c.slug}: ${names.length > 0 ? names.map((n) => `"${n}"`).join(" | ") : "never"}`;
    })
    .join("\n");

  const accessIndexBySlug = collectAccessIndexNames({ access: config.access });
  const accessIndexBySlugEntries = [...accessIndexBySlug.entries()]
    .map(([slug, actions]) => {
      const actionEntries = [...actions.entries()]
        .map(
          ([action, names]) =>
            `${action}: ${[...names].map((n) => `"${n}"`).join(" | ")}`,
        )
        .join("; ");
      return `\t${slug}: { ${actionEntries} }`;
    })
    .join("\n");

  const declareModule = `declare module "@vexcms/core" {
    \tinterface GeneratedVexTypes {
    \t\tCollectionSlug: ${collectionSlugs}
    \t\tGlobalSlug: ${globalSlugs}
    \t\tMediaCollectionSlug: ${mediaCollectionSlugs}
    \t\tStorageAdapterSlug: ${storageAdapterSlugs}
    \t\tDocumentBySlug: {\n${documentsBySlug}\n}
    \t\tGlobalDocumentBySlug: {\n${globalDocumentsBySlug}\n}
    \t\tCollectionsFieldTypeMap: {\n${collectionsFieldTypeMap}\n}
    \t\tGlobalsFieldTypeMap: {\n${globalsFieldTypeMap}\n}
    \t\tIndexesBySlug: {\n${indexesBySlugEntries}\n}
    \t\tAccessIndexBySlug: {\n${accessIndexBySlugEntries}\n}
    \t}
  \n}`;

  return [
    typesHeader,
    "",
    ...interfaceBlocks,
    "",
    collectionSlugType,
    "",
    globalSlugType,
    "",
    mediaCollectionSlugType,
    "",
    storageAdapterSlugType,
    "",
    documentBySlugType,
    "",
    globalDocumentBySlugType,
    "",
    declareModule,
  ].join("\n");
}
````

#### `packages/core/src/types/generateVexTypes.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { defineCollection, defineConfig } from "../index";
import { defineAccess } from "../access/config";
import { WILDCARD_KEY } from "../access/constants";
import { text } from "../fields/text/config";
import { relationship } from "../fields/relationship/config";
import { generateVexTypes } from "./generateVexTypes";

describe("generateVexTypes — IndexesBySlug", () => {
  it("includes an explicit field.index in the collection's index union", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "pages",
          fields: { slug: text({ index: "by_slug" }) },
        }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain(`IndexesBySlug:`);
    expect(output).toContain(`pages: "by_slug"`);
  });

  it("auto-indexes relationship fields as by_<fieldKey>", () => {
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
    expect(output).toContain(`posts: "by_author"`);
  });

  it("unions multiple index names on the same collection", () => {
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
    expect(output).toContain(`pages: "by_slug" | "by_status"`);
  });

  it("emits 'never' for a collection with no indexed fields", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "pages", fields: { title: text() } }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain(`pages: never`);
  });
});

describe("generateVexTypes — AccessIndexBySlug", () => {
  it("includes the withIndex name declared by an access rule's read check", () => {
    const pages = defineCollection({
      slug: "pages",
      fields: {
        title: text({ required: true }),
        authorId: text({ index: "by_author" }),
      },
    });
    const users = defineCollection({
      slug: "users",
      fields: { name: text({ required: true }), roles: text() },
    });
    const access = defineAccess({
      roles: ["admin", "contributor"] as const,
      resources: [pages, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            read: {
              filter: () => true,
              withIndex: { name: "by_author" },
            },
          },
        },
      },
    });
    const config = defineConfig({ collections: [pages, users], access });
    const output = generateVexTypes({ config });
    expect(output).toContain(`AccessIndexBySlug:`);
    expect(output).toContain(`pages: { read: "by_author" }`);
  });

  it("omits a collection with no access-index rule from AccessIndexBySlug", () => {
    const media = defineCollection({
      slug: "media",
      fields: { filename: text({ required: true }) },
    });
    const users = defineCollection({
      slug: "users",
      fields: { name: text({ required: true }), roles: text() },
    });
    const access = defineAccess({
      roles: ["admin"] as const,
      resources: [media, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        admin: { [WILDCARD_KEY]: true },
      },
    });
    const config = defineConfig({ collections: [media, users], access });
    const output = generateVexTypes({ config });
    expect(output).not.toContain(`media: { read`);
  });

  it("emits an empty AccessIndexBySlug when access is not configured", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "pages", fields: { title: text() } }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain(`AccessIndexBySlug: {\n\n}`);
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 3 — `resolveAccessIndex` + tests `[dev]`

- [ ] `packages/core/src/access/resolveAccessIndex.ts`
- [ ] `packages/core/src/access/resolveAccessIndex.test.ts` — the §5 matrix: unrestricted
      role ⇒ no index; single restrictive role ⇒ index; restrictive + permissive ⇒ no
      index; two differing restrictive roles ⇒ no index; anon via `anonRole`; access
      disabled ⇒ no index.
- [ ] `packages/core/src/access/index.ts` — export `resolveAccessIndex`.

#### `packages/core/src/access/resolveAccessIndex.ts`

New file. `IndexRangeFn` and `QueryIndex` now live in `packages/core/src/access/types.ts`
(added in Step 1) — this file imports them instead of declaring them locally.

```ts
import type { QueryIndex, SubjectEntry, VexAccessConfig } from "./types";

/**
 * Resolves the index an access rule contributes to a query, if any.
 *
 * Called once per query, before the Convex query is built. Mirrors
 * `hasPermission`'s role resolution and OR-merge semantics
 * (`hasPermission.ts:96-105`, `:294`), but answers a query-scoped question
 * ("which index narrows this query?") rather than a document-scoped one
 * ("may they read this row?").
 *
 * Never authorizes. The declaring role's `filter` still runs per document via
 * `hasPermission`, so a missing or overly-broad index can only cost reads,
 * never admit a row a role does not permit.
 *
 * @param props.access - Resolved access config; absent or `enabled: false` ⇒ no index.
 * @param props.user - Caller, or `null` for anonymous (resolves through `access.anonRole`).
 * @param props.organization - Active organization, forwarded to a role's `withIndex.range`.
 * @param props.resource - Subject slug (a collection or global slug).
 * @param props.action - Query-shaped action (`"read"` | `"readDrafts"`).
 * @returns The index to apply, or `undefined` to scan unindexed.
 *
 * @typeParam TSubjects - Resolved {@link SubjectMap}, inferred from `access`.
 *   Generic for the same reason {@link HasPermissionProps} is: a concrete
 *   `SubjectMap<…>` instantiation is NOT assignable to the erased
 *   `VexAccessConfig<Record<string, SubjectEntry>>` default — callback
 *   contravariance makes instantiations mutually unassignable (P-002). Pinning
 *   the default here would reject every real `defineAccess()` result.
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
  // TODO: implement
  // 1. `!props.access || !props.access.enabled` → return undefined. Access
  //    control is off, so there is nothing to narrow by (`hasPermission`
  //    already treats this as "everything allowed").
  //
  // 2. Derive the caller's known roles — MUST reproduce `hasPermission.ts:96-105`
  //    exactly (same anonRole fallback, same `access.roles` filter), so a
  //    role that could never pass `hasPermission` never contributes an index:
  //    a. Read `props.user?.[access.userRolesField]`; normalize to a
  //       `string[]` (`string` → `[string]`, `string[]` → filtered to string
  //       entries, else `[]`).
  //    b. Roles empty AND `access.anonRole` is declared → effectiveRoles =
  //       `[access.anonRole]`.
  //    c. knownRoles = effectiveRoles filtered to `access.roles`.
  //    d. `knownRoles.length === 0` → return undefined (no role grants
  //       anything; `filter` will reject every row regardless of index).
  //
  // 3. For EACH known role, resolve what it declares for `props.resource` /
  //    `props.action` using the SAME precedence `hasPermission` uses —
  //    explicit action key → subject-level wildcard (`WILDCARD_KEY`) →
  //    role-level wildcard → `access.defaultPermissionMode`
  //    (`hasPermission.ts:113-132`). Never invoke a resolved `filter` here —
  //    this function only ever reads the SHAPE of the check, never runs it.
  //    Classify the resolved check into exactly one bucket:
  //    a. `false` (or a denying default) → role does not contribute this
  //       action at all. Skip it.
  //    b. `true` (or an allowing default) → role contributes an UNRESTRICTED
  //       grant → mark `sawUnrestricted = true`.
  //    c. The indexed object form (has a `withIndex` key — the
  //       `IndexedPermissionCheck` shape from `./types`) → role contributes
  //       `withIndex`. Call `withIndex.range?.({ user: props.user, organization:
  //       props.organization })` to bind it to THIS caller, producing a plain
  //       `IndexRangeFn`; record `{ name: withIndex.name, range }`.
  //    d. Anything else (a bare callback, or a field-mode `{ mode, fields }`
  //       object) → the role governs this action but declares NO index for
  //       it → mark `sawUnrestricted = true`, exactly like (b). A callback
  //       might deny some rows, but it might also permit rows no index could
  //       describe — fail OPEN to scanning, never to a range narrower than
  //       what the role actually permits.
  //
  // 4. Combine every contributing role (OR-merge — mirrors
  //    `mergeRolePermissions` / `hasPermission.ts:294`, over indexes instead
  //    of booleans):
  //    a. `sawUnrestricted` → return undefined. ⚠️ THE ONE CASE A BUG HERE
  //       SILENTLY HIDES DOCUMENTS: applying a restrictive role's index while
  //       another role permits unrestricted read would drop rows that
  //       second role's caller is entitled to see. Check this FIRST, before
  //       looking at recorded indexes at all.
  //    b. No role recorded a `withIndex` (every contributor hit 3a) → return
  //       undefined — nothing to narrow by.
  //    c. Every recorded index has the SAME `name` → return that one
  //       `{ name, range }` (ranges never need merging across roles — only
  //       `pickQueryIndex` merges against a CALLER's index; two roles with
  //       the same name only ever produced one range, since a `name` is a
  //       static literal per role).
  //    d. Recorded indexes DIFFER in `name` → return undefined. OR is not an
  //       intersection: Convex allows exactly one range per query, so two
  //       roles narrowing by different fields cannot both be expressed.
  //       Fails open to scanning; `filter` still enforces every role's rule
  //       per document, so correctness never depends on this branch.
  //
  // Edge cases:
  // - `props.user === null` with no `access.anonRole` configured → step 2
  //   yields no known roles → undefined (matches `hasPermission`'s
  //   deny-by-default for a sessionless caller).
  // - A resolved check that is a field-mode object (`{ mode, fields }`) is
  //   NOT field-scoped here — query-shaped actions don't take `fields` in
  //   this signature. Treat it as bucket 3d; never branch on `.fields`.
  // - `access.defaultPermissionMode` affects the undeclared-action fallback
  //   exactly as it does in `hasPermission` — resolve through the default,
  //   never treat "undeclared" as an automatic skip.
  throw new Error("Not implemented");
}
```

#### `packages/core/src/access/resolveAccessIndex.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { defineCollection, text } from "../index";
import { WILDCARD_KEY } from "./constants";
import { defineAccess } from "./config";
import { resolveAccessIndex } from "./resolveAccessIndex";

// Core tests run with an unaugmented GeneratedVexTypes registry, so callback
// `data`/`user` params are the wide pre-generation fallback — the `typeof`/`in`
// guards below are expected and disappear in apps after `vex generate`
// augments the registry (see `hasPermission.test.ts`'s equivalent note).

const pages = defineCollection({
  slug: "pages",
  fields: { title: text({ required: true }), authorId: text(), status: text() },
});

const users = defineCollection({
  slug: "users",
  fields: { name: text({ required: true }), roles: text() },
});

const asUser = (roles: string | string[], _id = "u1") => ({ _id, roles });

/**
 * Mirrors the design doc's §9.0 setup: `contributor` reads only its own rows
 * via an indexed `by_author` rule; `editor` is unrestricted; `reviewer`'s
 * rule is array membership on the user and declares no index at all;
 * `auditor` is restrictive AND indexed, but by a DIFFERENT field than
 * `contributor` (`by_status`) — the "two differing indexed roles" case;
 * `anon` resolves through the fallback role and is itself indexed.
 */
const rolePermissions = {
  admin: { [WILDCARD_KEY]: true },
  editor: { pages: true },
  contributor: {
    pages: {
      read: {
        filter: ({ data, user }: { data: unknown; user: unknown }) =>
          typeof data === "object" &&
          data !== null &&
          "authorId" in data &&
          typeof user === "object" &&
          user !== null &&
          "_id" in user
            ? data.authorId === user._id
            : false,
        withIndex: {
          name: "by_author",
          range:
            ({ user }: { user: unknown }) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (q: any) =>
              q.eq(
                "authorId",
                typeof user === "object" && user !== null && "_id" in user
                  ? user._id
                  : undefined,
              ),
        },
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
        filter: ({ data }: { data: unknown }) =>
          typeof data === "object" && data !== null && "status" in data
            ? data.status === "published"
            : false,
        withIndex: {
          name: "by_status",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          range: () => (q: any) => q.eq("status", "published"),
        },
      },
    },
  },
  anon: {
    pages: {
      read: {
        filter: ({ data }: { data: unknown }) =>
          typeof data === "object" && data !== null && "status" in data
            ? data.status === "published"
            : false,
        withIndex: {
          name: "by_status",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          range: () => (q: any) => q.eq("status", "published"),
        },
      },
    },
  },
};

const access = defineAccess({
  roles: [
    "admin",
    "editor",
    "contributor",
    "reviewer",
    "auditor",
    "anon",
  ] as const,
  resources: [pages, users],
  anonRole: "anon",
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: rolePermissions,
});

const disabledAccess = defineAccess({
  enabled: false,
  roles: [
    "admin",
    "editor",
    "contributor",
    "reviewer",
    "auditor",
    "anon",
  ] as const,
  resources: [pages, users],
  anonRole: "anon",
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: rolePermissions,
});

describe("resolveAccessIndex — access absent or disabled", () => {
  it("returns undefined when access is not configured", () => {
    expect(
      resolveAccessIndex({
        access: undefined,
        user: asUser("contributor"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });

  it("returns undefined when access.enabled is false", () => {
    expect(
      resolveAccessIndex({
        access: disabledAccess,
        user: asUser("contributor"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveAccessIndex — single restrictive role", () => {
  it("resolves the indexed role's withIndex", () => {
    expect(
      resolveAccessIndex({
        access,
        user: asUser("contributor"),
        resource: "pages",
        action: "read",
      }),
    ).toEqual({ name: "by_author", range: expect.any(Function) });
  });

  it("binds range to the caller's user id", () => {
    const resolved = resolveAccessIndex({
      access,
      user: asUser("contributor", "dana"),
      resource: "pages",
      action: "read",
    });
    const calls: unknown[][] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q: any = { eq: (...args: unknown[]) => (calls.push(args), q) };
    resolved?.range?.(q);
    expect(calls).toEqual([["authorId", "dana"]]);
  });
});

describe("resolveAccessIndex — unrestricted role", () => {
  it("admin's role-level wildcard is unrestricted ⇒ no index", () => {
    expect(
      resolveAccessIndex({
        access,
        user: asUser("admin"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveAccessIndex — restrictive + permissive ⇒ no index", () => {
  it("editor's unrestricted grant removes contributor's index", () => {
    expect(
      resolveAccessIndex({
        access,
        user: asUser(["contributor", "editor"]),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveAccessIndex — two differing restrictive roles ⇒ no index", () => {
  it("an un-indexable callback role forces scanning even alongside an indexed role", () => {
    expect(
      resolveAccessIndex({
        access,
        user: asUser(["contributor", "reviewer"]),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });

  it("two indexed roles naming different indexes cannot both apply — one range per query", () => {
    expect(
      resolveAccessIndex({
        access,
        user: asUser(["contributor", "auditor"]),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveAccessIndex — anon via anonRole", () => {
  it("a sessionless caller resolves through access.anonRole", () => {
    expect(
      resolveAccessIndex({
        access,
        user: null,
        resource: "pages",
        action: "read",
      }),
    ).toEqual({ name: "by_status", range: expect.any(Function) });
  });
});
```

#### `packages/core/src/access/index.ts`

```ts
export * from "./constants";
export * from "./types";
export * from "./config";
export * from "./hasPermission";
export * from "./canAccessAdminPanel";
export * from "./resolveAccessIndex";
```

Verify: `pnpm --filter @vexcms/core test`

### Step 4 — `pickQueryIndex` + tests `[dev]`

- [ ] `packages/core/src/access/pickQueryIndex.ts`
- [ ] `packages/core/src/access/pickQueryIndex.test.ts` — free slot ⇒ access claims it;
      same name ⇒ ranges merge; different name ⇒ caller wins and warns once; no access
      index ⇒ caller passthrough.

#### `packages/core/src/access/pickQueryIndex.ts`

New file. `IndexRangeFn`, `QueryIndex`, and `UNCONSTRAINED_RANGE` live in
`packages/core/src/access/types.ts` (added in Step 1) — this file imports them instead
of declaring them locally.

```ts
import { UNCONSTRAINED_RANGE } from "./types";
import type { IndexRangeFn, QueryIndex } from "./types";

/**
 * Chooses the single index a query will use, arbitrating between an
 * access-contributed index and whatever the caller explicitly requested.
 * Convex permits exactly one `withIndex` per query, so exactly one of these
 * wins the slot.
 *
 * 1. Caller's index wins the slot when it names a DIFFERENT index — usually
 *    a highly selective lookup; the access `filter` still enforces the rule
 *    per document (`hasPermission`), so this only ever costs reads, never
 *    correctness.
 * 2. Same name ⇒ ranges merge, so the compound constraint (access's prefix
 *    AND the caller's) is served by one query, no degradation.
 * 3. Free slot (no caller index) ⇒ the access index claims it — the common
 *    list-view case.
 *
 * @param props.accessIndex - `resolveAccessIndex`'s result for this query, if any.
 * @param props.callerIndex - The index the caller explicitly requested, if any.
 * @returns The index to apply, or `undefined` when neither side supplies one (today's un-narrowed scan).
 */
export function pickQueryIndex(props: {
  accessIndex?: QueryIndex;
  callerIndex?: { name: string; range?: IndexRangeFn };
}): QueryIndex | undefined {
  // TODO: implement
  // 1. Neither `props.accessIndex` nor `props.callerIndex` supplied → return
  //    undefined. Nothing to narrow by — identical to today's behavior for
  //    an unindexed collection/action.
  //
  // 2. `props.callerIndex` absent, `props.accessIndex` present → FREE SLOT:
  //    → return `props.accessIndex` as the selection. This is the list-view
  //      case — the caller asked for nothing, so the access index gets the
  //      slot outright.
  //
  // 3. `props.accessIndex` absent, `props.callerIndex` present → PASSTHROUGH:
  //    → return `{ name: callerIndex.name, range: callerIndex.range ?? UNCONSTRAINED_RANGE }`.
  //      No access index exists for this resource/action (or resolution already
  //      fell back to scanning), so there is nothing to arbitrate — but the
  //      caller's `range` is optional and `QueryIndex.range` is not, so an
  //      ordering-only caller index normalizes here.
  //
  // 4. Both present, `props.callerIndex.name === props.accessIndex.name` →
  //    MERGE:
  //    a. Build a single combined range: run `accessIndex.range` (always
  //       present) to get the access-narrowed builder, then run
  //       `callerIndex.range` on THAT result to continue narrowing. A caller
  //       with no `range` contributes nothing to this stage.
  //    b. → return `{ name: accessIndex.name, range: <combined> }` — one
  //       index expresses both constraints, no read-cost degradation.
  //
  // 5. Both present, names DIFFER → CALLER WINS:
  //    a. Emit a dev-only, warn-ONCE notice naming the compound index that
  //       would let one query serve both — dedupe by the
  //       `(accessIndex.name, callerIndex.name)` pair (module-level `Set`,
  //       never cleared — this is a fixed, small key space per process), and
  //       skip entirely in production (`process.env.NODE_ENV === "production"`).
  //       Message MUST name both index names, per §9.5.
  //    b. → return `{ name: callerIndex.name, range: callerIndex.range ?? UNCONSTRAINED_RANGE }`. The
  //       access `filter` still runs per document over whatever the
  //       caller's index yields, so this displaces performance, never
  //       correctness.
  //
  // Edge cases:
  // - The warn-once dedupe key MUST be the ORDERED pair, not a single flag —
  //   two different displaced pairs (e.g. `by_status`+`by_slug` vs
  //   `by_author`+`by_updated`) each warn independently.
  // - Never mutate `props.accessIndex` / `props.callerIndex` — branch 2 returns
  //   the access index as-is; branches 3/4/5 construct a new object.
  // - `QueryIndex.range` is required, so every returned selection carries one.
  //   `accessIndex.range` is always present by construction (`AccessIndex`);
  //   a caller's optional `range` is normalized with `?? UNCONSTRAINED_RANGE`.
  throw new Error("Not implemented");
}
```

#### `packages/core/src/access/pickQueryIndex.test.ts`

```ts
import { describe, expect, it, vi } from "vitest";
import { pickQueryIndex } from "./pickQueryIndex";

function recordingBuilder() {
  const calls: Array<[string, unknown]> = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    eq: (field: string, value: unknown) => {
      calls.push([field, value]);
      return builder;
    },
    gte: (field: string, value: unknown) => {
      calls.push([field, value]);
      return builder;
    },
  };
  return { builder, calls };
}

describe("pickQueryIndex — free slot", () => {
  it("gives the access index the slot when the caller supplies none", () => {
    const accessIndex = {
      name: "by_author",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      range: (q: any) => q.eq("authorId", "dana"),
    };
    expect(pickQueryIndex({ accessIndex })).toEqual(accessIndex);
  });
});

describe("pickQueryIndex — same name merges ranges", () => {
  it("composes access's range then the caller's range on the same builder", () => {
    const selection = pickQueryIndex({
      accessIndex: {
        name: "by_author_category",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        range: (q: any) => q.eq("authorId", "dana"),
      },
      callerIndex: {
        name: "by_author_category",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        range: (q: any) => q.eq("categoryId", "news"),
      },
    });
    expect(selection?.name).toBe("by_author_category");
    const { builder, calls } = recordingBuilder();
    selection?.range?.(builder);
    expect(calls).toEqual([
      ["authorId", "dana"],
      ["categoryId", "news"],
    ]);
  });
});

describe("pickQueryIndex — different name: caller wins and warns once", () => {
  it("gives the slot to the caller's index and warns exactly once for the same pair", () => {
    const warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const accessIndex = {
      name: "by_status",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      range: (q: any) => q.eq("status", "published"),
    };
    const callerIndex = {
      name: "by_slug",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      range: (q: any) => q.eq("slug", "about"),
    };

    const first = pickQueryIndex({ accessIndex, callerIndex });
    const second = pickQueryIndex({ accessIndex, callerIndex });

    expect(first).toEqual(callerIndex);
    expect(second).toEqual(callerIndex);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const [message] = warnSpy.mock.calls[0] as [string];
    expect(message).toContain("by_status");
    expect(message).toContain("by_slug");
    warnSpy.mockRestore();
  });

  it("warns independently for a different displaced pair", () => {
    const warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    pickQueryIndex({
      accessIndex: {
        name: "by_region",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        range: (q: any) => q.eq("region", "us"),
      },
      callerIndex: {
        name: "by_locale",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        range: (q: any) => q.eq("locale", "en"),
      },
    });
    pickQueryIndex({
      accessIndex: {
        name: "by_team",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        range: (q: any) => q.eq("team", "eng"),
      },
      callerIndex: {
        name: "by_priority",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        range: (q: any) => q.eq("priority", "high"),
      },
    });

    expect(warnSpy).toHaveBeenCalledTimes(2);
    warnSpy.mockRestore();
  });
});

describe("pickQueryIndex — no access index: caller passthrough", () => {
  it("returns the caller's index unchanged when there is no access index", () => {
    const callerIndex = {
      name: "by_updated",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      range: (q: any) => q.gte("updatedAt", 100),
    };
    expect(pickQueryIndex({ callerIndex })).toEqual(callerIndex);
  });
});

describe("pickQueryIndex — nothing supplied", () => {
  it("returns undefined when neither an access index nor a caller index applies", () => {
    expect(pickQueryIndex({})).toBeUndefined();
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 5 — Wire into `find` / `get` / `search` `[dev]`

- [ ] `packages/core/src/api/find/server.ts` — resolve + pick before `buildQuery`;
      `buildQuery` takes `resolvedIndex`; the `hasPermission` pass stays unconditional.
- [ ] `packages/core/src/api/get/server.ts`, `packages/core/src/api/search/server.ts` —
      same resolution; `get` narrows only when it already builds a query.
- [ ] `packages/core/src/access/index.ts` — export `pickQueryIndex` (Step 4 landed the
      module but not the barrel export; `find`/`search` are the first consumers).
- [ ] `packages/core/src/api/test/convex/schema.ts` — add `.index("by_slug", ["slug"])`
      on `posts` so the displacement test has a second real index to name.
- [ ] `packages/core/src/api/find/server.test.ts` — indexed rule reads only permitted
      rows and returns a full page; caller index displaces the access index and the
      filter still rejects.

#### `packages/core/src/api/find/server.ts`

Three edits. Everything not shown is unchanged.

**1 — imports.** Add `resolveAccessIndex` and `pickQueryIndex` to the existing
`../../access` import, and a new type import:

```ts
import {
  CRUD_ACTIONS,
  hasPermission,
  resolveAccessIndex,
  pickQueryIndex,
} from "../../access";
import type { QueryIndex } from "../../access";
```

**2 — resolve + pick before `buildQuery`.** In the implementation signature of `find`
(the overload with the full JSDoc above it), replace the existing
`const findQuery = buildQuery<DataModel, TCollectionSlug, TPopulate, D>(args);` line —
the first statement in the function body — with:

```ts
// TODO: implement — resolve which index (if any) narrows this query for
// the caller, and arbitrate it against any caller-supplied `withIndex`,
// BEFORE building the query. Everything below this point (paginate/take/
// collect, populate, the pagination-result shaping) is existing, working
// code — shown for context, not something this step re-derives.
// 1. accessIndex = resolveAccessIndex({
//      access: args.config?.access,
//      user: args.auth?.user ?? null,
//      organization: args.auth?.organization,
//      resource: args.collection,
//      action: CRUD_ACTIONS.read,
//    })
//    → the Step 3 resolver; mirrors `hasPermission`'s role/OR-merge
//      semantics but answers "which index narrows this query", never
//      authorizes anything itself.
// 2. resolvedIndex = pickQueryIndex({ accessIndex, callerIndex: args.withIndex })
//    → the Step 4 arbitrator: free slot ⇒ access claims it (the list-view
//      case), same name ⇒ merge, different name ⇒ caller wins (displaces
//      the access index — reads more, never less correct).
// Edge cases:
// - No `config.access` → `resolveAccessIndex` returns `undefined` →
//   `pickQueryIndex` passes `args.withIndex` straight through — byte-for-
//   byte today's behavior when RBAC is off.
// - `args.auth` is `undefined` (RBAC off entirely) → pass `user: null`;
//   `resolveAccessIndex` already short-circuits on a missing/disabled
//   `access` config before it would ever read `user`.
const resolvedIndex: QueryIndex | undefined = undefined; // placeholder — see TODO above
throw new Error("Not implemented: resolve + pick the access index (Step 5)");

const findQuery = buildQuery<DataModel, TCollectionSlug, TPopulate, D>({
  ...args,
  resolvedIndex,
});
```

Everything from the `paginate`/`take`/`collect` branches onward — including all three
`hasPermission` filters — is untouched: they stay unconditional, exactly as today.

**3 — `buildQuery` reads the resolved index.** Replace the whole `buildQuery` function
(immediately below `find`) — its args parameter is now intersected with a
`resolvedIndex` field, and the `withIndex` step reads that instead of `args.withIndex`
directly:

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
    /** Winner of `pickQueryIndex` (Step 4) — replaces reading `args.withIndex` directly. */
    resolvedIndex?: QueryIndex;
  },
): QueryInitializer<NamedTableInfo<DataModel, TCollectionSlug>> {
  const tableName = args.collection;
  let q = args.ctx.db.query(tableName);

  // 1. withIndex — narrows the scan (most efficient). Reads the ARBITRATED
  //    index (access + caller, already merged/displaced by `pickQueryIndex`)
  //    instead of `args.withIndex` directly — that raw arg is now only an
  //    INPUT to arbitration, never applied on its own.
  if (args.resolvedIndex) {
    // @ts-expect-error building query piece by piece from query args
    q = args.resolvedIndex.range
      ? q.withIndex(args.resolvedIndex.name, args.resolvedIndex.range)
      : q.withIndex(args.resolvedIndex.name);
  }
  // 2. order — applied after index selection. Unchanged.
  // @ts-expect-error building query piece by piece from query args
  if (args.order) q = q.order(args.order);
  // 3. filter — secondary predicate, full range scan. Unchanged.
  if (args.filter) q = q.filter(args.filter);

  return q;
}
```

#### `packages/core/src/api/get/server.ts`

No functional change — `get` fetches by `Id` directly (`ctx.db.get`), never builds a
query, so there is nothing for `resolveAccessIndex` to narrow. Design doc §10:
`hasPermission({ data: doc, throwOnDenied: true })` is already exact for a single
document. Documents the decision so a future reader doesn't wonder why `get` was
skipped:

```ts
/**
 * Fetches a single document by its `Id<TCollectionSlug>`. Server-side only.
 * ...existing prose unchanged...
 *
 * Does not resolve an access index (design doc §10) — a point lookup has no
 * range to narrow, and `hasPermission({ data: doc })` below is already exact.
 *
 * ...existing @typeParam / @param / @returns / @example unchanged...
 */
export async function get<...>(...): Promise<GetReturn<...>> {
  // ...unchanged body — still `ctx.db.get(args.id)` then the same
  // unconditional `hasPermission({ throwOnDenied: true, ... })` call.
}
```

#### `packages/core/src/api/search/server.ts`

Three edits. Everything not shown is unchanged.

**1 — imports.** Add `resolveAccessIndex` to the existing `../../access` import, and a
new type import:

```ts
import { CRUD_ACTIONS, hasPermission, resolveAccessIndex } from "../../access";
import type { QueryIndex } from "../../access";
```

**2 — resolve before `buildQuery`.** In the implementation signature of `search` (the
overload with the full JSDoc above it), replace the existing
`const searchQuery = buildQuery(args);` line — the first statement in the function
body — with:

```ts
// TODO: implement — resolve the access index for this caller before
// building the query. `search` has no `withIndex` argument (Convex search
// queries run through `.withSearchIndex()`, a different query mode from
// `.withIndex()`), so there is no caller index to arbitrate against —
// `pickQueryIndex` (Step 4) is NOT called here, unlike `find`/Step 5.
// 1. accessIndex = resolveAccessIndex({
//      access: args.config?.access,
//      user: args.auth?.user ?? null,
//      organization: args.auth?.organization,
//      resource: args.collection,
//      action: CRUD_ACTIONS.read,
//    })
// 2. Pass it straight to `buildQuery` as `resolvedIndex` — see `buildQuery`
//    below for how it composes onto the search filter.
// Edge cases:
// - `args.query === ""` → `buildQuery` skips `.withSearchIndex()` entirely
//   (today's behavior — list recent docs via `.collect()`/`.take()`).
//   `resolvedIndex` has nothing to attach to in that branch; the
//   unconditional `hasPermission` pass below still enforces the rule.
const accessIndex: QueryIndex | undefined = undefined; // placeholder — see TODO above
throw new Error(
  "Not implemented: resolve the access index before buildQuery (Step 5)",
);

const searchQuery = buildQuery({ ...args, resolvedIndex: accessIndex });
```

Everything from the `paginate`/`take`/`collect` branches onward — including all three
`hasPermission` filters — is untouched: unconditional, same invariant as `find`.

**3 — `buildQuery` composes the resolved index onto the search filter.** Replace the
whole `buildQuery` function (immediately below `search`) — it gains a `resolvedIndex`
field on its args, and the search-index callback parameter changes from `q` to `sq` so
it can build a named `filter` and compose the access index's range onto it:

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
    /** `resolveAccessIndex`'s result — composed onto the search filter, not a `.withIndex()` slot. */
    resolvedIndex?: QueryIndex;
  },
): QueryInitializer<NamedTableInfo<DataModel, TCollectionSlug>> {
  let q = args.ctx.db.query(args.collection);
  if (args.query) {
    // @ts-expect-error building query piece by piece from query args
    q = q.withSearchIndex(args.searchIndexName, (sq) => {
      let filter = sq.search(args.searchField, args.query);
      // An access index's `range` is `(q) => q.eq(field, value)`-shaped
      // (§2/§9 of the design doc — every example is a single equality
      // constraint). Convex's `SearchFilterFinalizer.eq(field, value)` has
      // the IDENTICAL call signature, so a single-field access index
      // composes directly onto the search filter — no translation layer.
      // A compound or range-bound (`.gte()`/`.lt()`) access index throws
      // here (that shape has no `.gte()` on a search filter) — NOT
      // indexable for search, and deliberately not swallowed: a rule that
      // silently no-ops on `search` would be a correctness surprise
      // disguised as a performance one.
      // @ts-expect-error access index range composed onto a search filter —
      // same `.eq(field, value)` call shape, different builder type.
      if (args.resolvedIndex?.range) filter = args.resolvedIndex.range(filter);
      return filter;
    });
  }
  return q;
}
```

#### `packages/core/src/access/index.ts`

```ts
export * from "./constants";
export * from "./types";
export * from "./config";
export * from "./hasPermission";
export * from "./canAccessAdminPanel";
export * from "./resolveAccessIndex";
export * from "./pickQueryIndex";
```

#### `packages/core/src/api/test/convex/schema.ts`

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
    .index("by_slug", ["slug"]), // access-index displacement fixture (Step 5)
```

#### `packages/core/src/api/find/server.test.ts`

```ts
// Added imports, alongside the existing ones at the top of the file:
import { defineAccess, defineCollection, text } from "../../index";

// A role that may only read `featured` posts, expressed as an object-form
// rule so `resolveAccessIndex` has something to resolve. `by_featured` is
// declared on the fixture schema (`test/convex/schema.ts`).
const postsResource = defineCollection({
  slug: "posts",
  fields: { title: text({ required: true }), slug: text(), featured: text() },
  labels: { singular: "Post", plural: "Posts" },
  admin: { useAsTitle: "title" },
});

const contributorAccess = defineAccess({
  roles: ["contributor"] as const,
  resources: [postsResource],
  userCollectionSlug: "authors",
  userRolesField: "roles",
  permissions: {
    contributor: {
      posts: {
        read: {
          filter: ({ data }: { data: { featured?: boolean } }) =>
            data.featured === true,
          withIndex: {
            name: "by_featured",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            range: () => (q: any) => q.eq("featured", true),
          },
        },
      },
    },
  },
});

const accessFixtureConfig = {
  ...fixtureConfig,
  access: contributorAccess,
} as unknown as VexConfig;

const contributorAuth = { user: { _id: "u1", roles: ["contributor"] } };

// Append as a new describe block, after the existing "find (server)" and
// "find (server) — depth auto-populate" blocks.
describe("find (server) — access index resolution", () => {
  test("indexed access rule reads only permitted rows and returns a full page", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        // 20 rows the caller may NOT read, inserted FIRST — an unindexed scan
        // would exhaust `numItems` on these before ever reaching a permitted
        // row, so a naive (un-narrowed) implementation returns a SHORT page
        // here. An indexed implementation reads only the `featured` range and
        // returns a FULL page.
        for (let i = 0; i < 20; i++) {
          await ctx.db.insert("posts", {
            title: `Other ${i}`,
            slug: `other-${i}`,
            featured: false,
          });
        }
        for (let i = 0; i < 3; i++) {
          await ctx.db.insert("posts", {
            title: `Mine ${i}`,
            slug: `mine-${i}`,
            featured: true,
          });
        }
        return find({
          ctx,
          collection: "posts",
          config: accessFixtureConfig,
          auth: contributorAuth,
          paginationOpts: { numItems: 3, cursor: null },
        });
      },
    );
    expect(result.page).toHaveLength(3);
    expect(result.page.every((d) => d.featured === true)).toBe(true);
    expect(result.isDone).toBe(true);
  });

  test("caller-supplied index displaces the access index; a permitted row still returns", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await ctx.db.insert("posts", {
          title: "Mine",
          slug: "mine-slug",
          featured: true,
        });
        await ctx.db.insert("posts", {
          title: "Other",
          slug: "other-slug",
          featured: false,
        });
        return find({
          ctx,
          collection: "posts",
          config: accessFixtureConfig,
          auth: contributorAuth,
          withIndex: {
            name: "by_slug",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            range: (q: any) => q.eq("slug", "mine-slug"),
          },
          limit: 1,
        });
      },
    );
    expect(docs).toHaveLength(1);
    expect(docs[0].slug).toBe("mine-slug");
  });

  test("caller-supplied index displaces the access index; the filter still rejects an unpermitted row", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await ctx.db.insert("posts", {
          title: "Mine",
          slug: "mine-slug",
          featured: true,
        });
        await ctx.db.insert("posts", {
          title: "Other",
          slug: "other-slug",
          featured: false,
        });
        return find({
          ctx,
          collection: "posts",
          config: accessFixtureConfig,
          auth: contributorAuth,
          withIndex: {
            name: "by_slug",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            range: (q: any) => q.eq("slug", "other-slug"),
          },
          limit: 1,
        });
      },
    );
    // `by_slug` reads the row (caller's index won the slot); `hasPermission`
    // still rejects it — the filter is the rule regardless of which index ran.
    expect(docs).toHaveLength(0);
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 6 — Split `totalDocs` into its own query `[dev]`

- [ ] `packages/core/src/api/find/count.server.ts` — count-only handler, access index applied.
- [ ] `packages/core/src/api/find/server.ts` — drop the inline `totalDocs` branch.
- [ ] `packages/core/src/api/convex.ts` — register `findCount`.
- [ ] `packages/core/src/api/server.ts` — register `findCount` as a Convex query in
      `collectionsApi`, alongside `find`/`get`/`search` (required for
      `anyApi.vex.findCount` to resolve at runtime; not a new arg shape, same
      registration pattern as the other four endpoints).
- [ ] `packages/react/src/hooks/usePaginatedQuery.ts` — `useTotalDocs` calls the new
      query instead of reading the field off the page result.
- [ ] `packages/core/src/api/find/count.server.test.ts` — count respects the access
      index; oversized collection returns `null` rather than throwing.

#### `packages/core/src/api/find/count.server.ts`

```ts
import type { GenericDataModel } from "convex/server";
import {
  CRUD_ACTIONS,
  hasPermission,
  resolveAccessIndex,
  pickQueryIndex,
} from "../../access";
import type { CollectionSlug } from "../../types/generated";
import type { FindServerArgs } from "./server";

/**
 * Server-side args for `findCount` — the same query-shaping fields as `find`
 * (Step 5), minus pagination: a count always reads to completion.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 */
export type FindCountServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> = Pick<
  FindServerArgs<DataModel, TCollectionSlug, Record<string, never>, 0>,
  "ctx" | "auth" | "config" | "collection" | "filter" | "withIndex"
>;

/**
 * Counts documents in a collection, applying the same access-index narrowing
 * as `find` (Step 5) — the count reflects rows the CALLER may read, not the
 * table size. Registered as its own Convex query (`api.vex.findCount`) so a
 * count no longer shares one invocation's read budget with a page fetch
 * (`design-review.md` §5.6a fix 3) — a count failure can no longer take a
 * page down with it, and vice versa.
 *
 * @param args - Same collection/config/auth/filter/withIndex shape as `find`;
 *   no `paginationOpts` — this always reads to completion (or fails trying).
 * @returns The count of documents the caller may read, or `null` when the
 *   collection is too large to count in one execution (mirrors `find`'s
 *   today-existing >32k-document behavior, `find/server.ts:273-280`).
 */
export async function findCount<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(
  args: FindCountServerArgs<DataModel, TCollectionSlug>,
): Promise<number | null> {
  // TODO: implement
  // 1. Resolve + pick the index exactly like `find` (Step 5):
  //    a. accessIndex = resolveAccessIndex({ access: args.config?.access,
  //         user: args.auth?.user ?? null, organization: args.auth?.organization,
  //         resource: args.collection, action: CRUD_ACTIONS.read })
  //    b. resolvedIndex = pickQueryIndex({ accessIndex, callerIndex: args.withIndex })
  // 2. Build the SAME query shape `find` would (withIndex → order → filter —
  //    reuse `find/server.ts`'s exported `buildQuery` rather than
  //    reimplementing the composition order a second time; export it from
  //    `./server` if it is not already):
  //    → query = buildQuery({ ...args, resolvedIndex })
  // 3. try {
  //      a. docs = await query.collect()
  //      b. → return docs.filter(d => hasPermission({
  //           access: args.config?.access, resource: args.collection,
  //           action: CRUD_ACTIONS.read, data: d, user: args.auth?.user ?? {},
  //           organization: args.auth?.organization,
  //         })).length
  //         — the `hasPermission` pass stays UNCONDITIONAL, same invariant as
  //         `find`/`search` (design doc §1): the index only narrows candidates,
  //         `filter` is still what's actually counted.
  //    } catch (error) {
  //      a. console.warn("Failed to count documents:", error)
  //      b. → return null — SIGNALS "too large to count", never throws to the
  //         caller (today's `find/server.ts:273-280` contract, preserved).
  //    }
  // Edge cases:
  // - No `config.access` → `resolveAccessIndex` returns `undefined`, count
  //   runs un-narrowed — identical cost to today's inline branch.
  // - An access-restricted collection with NO index (bare-callback rule) —
  //   `resolvedIndex` is `undefined`, `.collect()` still reads and filters
  //   the whole table. Same floor as before the split (design doc §13); the
  //   split isolates the read BUDGET, it does not remove the cost.
  throw new Error("Not implemented");
}
```

#### `packages/core/src/api/find/server.ts`

One edit. Everything not shown is unchanged — `resolveAccessIndex`/`pickQueryIndex`
wiring from Step 5 is real code by this point (no longer a stub), and `buildQuery` is
unchanged from Step 5.

**1 — drop the inline `totalDocs` branch.** Inside `find`'s trailing
`if (args.paginationOpts && convexPaginationResult) { ... }` block, delete the whole
`if (args.paginationOpts.totalDocs && !args.paginationOpts.cursor) { ... }` branch —
its `try`/`catch` and the second `buildQuery` count call it makes — now that counting
lives in its own query (`findCount`, this step's `count.server.ts`). Replace the
`// Return Convex pagination result directly with populated docs` comment that sits
above the block's trailing `return { ...convexPaginationResult, page: finalDocs };`
with:

```ts
// `totalDocs` is no longer computed here — call `findCount` (this step,
// `count.server.ts`) as its own query instead. `args.paginationOpts.totalDocs`
// is now read only by the CLIENT (`usePaginatedQuery`) to decide whether
// to issue that second query; `find` itself never reads it.
```

The `return { ...convexPaginationResult, page: finalDocs };` line and the final
`return finalDocs;` are unchanged.

#### `packages/core/src/api/convex.ts`

```ts
/** Args for `api.vex.findCount`. */
export interface VexFindCountArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: CollectionSlug;
}
```

Add alongside the other `Vex*Args` interfaces (after `VexFindPaginatedArgs`), and add the
reference next to `find` / `findPaginated` inside `vexConvexApi`:

```ts
  /**
   * Counts documents the caller may read — the access-index-narrowed total,
   * not the table size (Step 6). Registered as its own query so a count no
   * longer shares read budget with `find`'s page fetch.
   * Called by {@link react/src!usePaginatedQuery} in `@vexcms/react`.
   */
  findCount: anyApi.vex.findCount as FunctionReference<
    "query",
    "public",
    VexFindCountArgs,
    number | null
  >,
```

#### `packages/core/src/api/server.ts`

Add the import/export alongside the existing `find` ones near the top of the file:

```ts
import { findCount } from "./find/count.server";
// ...
export { findCount } from "./find/count.server";
export type { FindCountServerArgs } from "./find/count.server";
```

Add the registration inside `collectionsApi`'s returned object, after the `find` query:

```ts
    findCount: query({
      args: {
        collection: v.string(),
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await findCount({
          ctx,
          auth,
          collection: args.collection as CollectionSlug,
          config,
        });
      },
    }),
```

#### `packages/react/src/hooks/usePaginatedQuery.ts`

```ts
// useTotalDocs after Step 6 — takes the collection instead of reading
// `totalDocs` off the page result, and calls `vexConvexApi.findCount`.
function useTotalDocs<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(props: {
  /** Collection to count — same slug the page-fetch query is running against. */
  collection: TCollectionSlug;
  /** Mirrors the caller's `paginationOpts.totalDocs` flag — gates the query. */
  enabled?: boolean;
  /** SSR-preloaded count, when the caller supplies one. */
  initialData?: number | null;
}): { totalDocs: number | null | undefined } {
  // TODO: implement
  // 1. `!props.enabled` → return `{ totalDocs: undefined }` immediately —
  //    matches today's contract (`includeTotalCount: false` ⇒ `undefined`,
  //    never `null`), and skips issuing the query at all.
  // 2. Otherwise:
  //    a. `useQuery({ ...convexQuery(vexConvexApi.findCount, { collection: props.collection }),
  //         ...(props.initialData !== undefined ? { initialData: props.initialData } : {}) })`
  //       — same `convexQuery` + tanstack-query pattern the page-fetch
  //       `useQuery` above already uses.
  //    b. → return `{ totalDocs: data }`. `data` is `number | null | undefined`
  //       straight from the query — no local state to sync: tanstack-query
  //       caches by query key, so (unlike today's `useEffect`-gated capture)
  //       a `collection` change re-fetches instead of freezing the first value.
  // Edge cases:
  // - `findCount` itself returns `null` for an oversized collection (Step 6,
  //   `count.server.ts`) — pass it through unchanged, never coerce to `0`.
  throw new Error("Not implemented");
}
```

Update the call site inside `usePaginatedQuery`:

```ts
const { totalDocs } = useTotalDocs({
  collection: query.collection,
  enabled: query.paginationOpts?.totalDocs,
  initialData: initialData?.totalDocs,
});
```

#### `packages/core/src/api/find/count.server.test.ts`

```ts
import { convexTest } from "convex-test";
import type {
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
} from "convex/server";
import { describe, expect, test } from "vitest";

import { defineAccess, defineCollection, text } from "../../index";
import type { VexConfig } from "../../config";
import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import { findCount } from "./count.server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

const postsResource = defineCollection({
  slug: "posts",
  fields: { title: text({ required: true }), slug: text(), featured: text() },
  labels: { singular: "Post", plural: "Posts" },
  admin: { useAsTitle: "title" },
});

const contributorAccess = defineAccess({
  roles: ["contributor"] as const,
  resources: [postsResource],
  userCollectionSlug: "authors",
  userRolesField: "roles",
  permissions: {
    contributor: {
      posts: {
        read: {
          filter: ({ data }: { data: { featured?: boolean } }) =>
            data.featured === true,
          withIndex: {
            name: "by_featured",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            range: () => (q: any) => q.eq("featured", true),
          },
        },
      },
    },
  },
});

const accessFixtureConfig = {
  access: contributorAccess,
} as unknown as VexConfig;

describe("findCount", () => {
  test("counts only the caller's permitted rows via the access index", async () => {
    const t = convexTest(schema, modules);
    const count = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        for (let i = 0; i < 5; i++) {
          await ctx.db.insert("posts", {
            title: `Other ${i}`,
            slug: `other-${i}`,
            featured: false,
          });
        }
        for (let i = 0; i < 2; i++) {
          await ctx.db.insert("posts", {
            title: `Mine ${i}`,
            slug: `mine-${i}`,
            featured: true,
          });
        }
        return findCount({
          ctx,
          collection: "posts",
          config: accessFixtureConfig,
          auth: { user: { _id: "u1", roles: ["contributor"] } },
        });
      },
    );
    // 2 featured rows, not the 7 total — the access index narrowed the count.
    expect(count).toBe(2);
  });

  test("returns null when the collection is too large to count, instead of throwing", async () => {
    // A minimal ctx whose query object rejects on `.collect()` — exercises the
    // same >32k-document failure path `find/server.ts:273-280` already
    // handles, without actually inserting 32k+ documents in a test.
    const throwingCtx = {
      db: {
        query: () => ({
          collect: () =>
            Promise.reject(
              new Error("Too many bytes read in a single function execution"),
            ),
        }),
      },
    } as unknown as GenericQueryCtx<GenericDataModel>;

    const count = await findCount({ ctx: throwingCtx, collection: "posts" });
    expect(count).toBeNull();
  });
});
```

Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react build`

### Step 7 — Bounded `loadMore` `[dev]`

- [ ] `packages/core/src/config/types.ts`

#### `packages/core/src/config/types.ts`

Three edits. Everything not shown is unchanged.

**1 — new `ApiConfigInput`/`ApiConfig` pair.** Insert after `TypesConfig`, before
`ClientUploadMap`, mirroring the `SchemaConfigInput`/`SchemaConfig` pair above it (same
Input/Resolved JSDoc shape):

````ts
/**
 * User-facing API behavior configuration for `defineConfig()`.
 *
 * All properties are optional; omitted values fall back to the defaults below.
 *
 * **Defaults applied by `defineConfig()`:**
 * ```ts
 * {
 *   pagination: {
 *     maxLoadMoreIterations: 5, // bounded auto-continuations per loadMore() call
 *   },
 * }
 * ```
 *
 * @see {@link ApiConfig} for the resolved type after defaults are applied
 */
export interface ApiConfigInput {
  /**
   * Client-side pagination behavior.
   *
   * All properties are optional; omitted values fall back to the defaults below.
   *
   * **Defaults applied by `defineConfig()`:**
   * ```ts
   * { maxLoadMoreIterations: 5 }
   * ```
   */
  pagination?: {
    /**
     * Maximum number of server round trips `usePaginatedQuery`'s `loadMore`
     * will chain automatically to fill one client-side page window.
     *
     * A row-level `read` rule with no matching `withIndex` is post-filtered:
     * a page can come back shorter than the requested window even though
     * more permitted rows exist further down the cursor. This bound closes
     * that gap for the caller without letting a sparse rule over a large
     * table degrade into thousands of unbounded round trips.
     *
     * Raising this is the *second* thing to try — declaring `withIndex` on
     * the rule is the first; see the access-control guide.
     *
     * @defaultValue 5
     */
    maxLoadMoreIterations?: number;
  };
}

/**
 * Resolved API behavior configuration after defaults are applied.
 *
 * @see {@link ApiConfigInput} for the user-facing input type
 */
export interface ApiConfig {
  /** Client-side pagination behavior — always fully populated after defaults are applied. */
  pagination: {
    /** @see {@link ApiConfigInput.pagination} */
    maxLoadMoreIterations: number;
  };
}
````

**2 — `VexConfigInput` gains `api`.** Add after the existing `types?: TypesConfigInput;`
member:

```ts
  /**
   * API behavior configuration — pagination bounds and other runtime knobs.
   * All properties are optional; omitted values fall back to defaults.
   *
   * @see {@link ApiConfigInput} for all available options
   */
  api?: ApiConfigInput;
```

**3 — `VexConfig` gains the resolved `api`.** Add after the existing
`types: TypesConfig;` member:

```ts
/** Resolved API behavior configuration — always fully populated after defaults are applied. */
api: ApiConfig;
```

Add the property to `VexConfigInput` (after `types?: TypesConfigInput;`):

```ts
  /**
   * API behavior configuration — pagination bounds and other runtime knobs.
   * All properties are optional; omitted values fall back to defaults.
   *
   * @see {@link ApiConfigInput} for all available options
   */
  api?: ApiConfigInput;
```

Add the resolved property to `VexConfig` (after `types: TypesConfig;`):

```ts
/** Resolved API behavior configuration — always fully populated after defaults are applied. */
api: ApiConfig;
```

- [ ] `packages/core/src/config/config.ts`

#### `packages/core/src/config/config.ts`

Add to the object `defineConfig()`
returns, after the existing `types: { ... }` block:

```ts
    api: {
      pagination: {
        maxLoadMoreIterations: config?.api?.pagination?.maxLoadMoreIterations ?? 5,
      },
    },
```

- [ ] `packages/react/src/hooks/usePaginatedQuery.ts`

#### `packages/react/src/hooks/usePaginatedQuery.ts`

Bound the automatic
continuation of short pages. Add the import:

```ts
import { useVexConfig } from "../context/VexConfigContext";
```

Add a new private helper below `useTotalDocs` — the decision logic behind the
bound, guided as a stub:

```ts
/**
 * Decides whether `usePaginatedQuery` should keep chaining server fetches
 * automatically and, if so, which cursor to fetch next.
 *
 * A row-level `read` rule with no matching `withIndex` post-filters every
 * page server-side — `hasPermission` rejects rows after the query already
 * read them — so a page can come back shorter than the requested window even
 * though more permitted rows exist further down the cursor. Called after
 * each page arrives so the hook can close that gap on the caller's behalf
 * instead of rendering an under-filled first page.
 *
 * Bounded by `maxLoadMoreIterations` so a rule with almost nothing to return
 * (a sparse filter over a large table) can't chain indefinitely — an
 * unbounded loop over a sparse rule on a large table is on the order of
 * thousands of round trips. Each iteration here is exactly one `find()`
 * round trip.
 *
 * @param props.accumulatedCount - Documents accumulated so far across all pages.
 * @param props.windowSize - Documents the current client-side window needs to display.
 * @param props.isDone - Whether the server reports no further pages exist.
 * @param props.continueCursor - Cursor for the next page, or `null`/`""` when there is none.
 * @param props.iterationsSoFar - Automatic continuations already chained since
 *   the current `loadMore` invocation (or the last query change) reset the count.
 * @param props.maxLoadMoreIterations - Resolved `api.pagination.maxLoadMoreIterations`.
 * @returns The cursor to fetch next, or `undefined` to stop — the window is
 *   already full, the server is done, or the cap was hit.
 */
function resolveNextLoadMoreCursor(props: {
  accumulatedCount: number;
  windowSize: number;
  isDone: boolean;
  continueCursor: string | null;
  iterationsSoFar: number;
  maxLoadMoreIterations: number;
}): string | undefined {
  // TODO: implement
  // 1. If `props.isDone` → no further pages exist server-side.
  //    → return undefined (stop).
  // 2. Else if `props.accumulatedCount >= props.windowSize` → the current
  //    window is already full; nothing more is needed for this render.
  //    → return undefined (stop).
  // 3. Else if `props.iterationsSoFar >= props.maxLoadMoreIterations` → the
  //    cap is hit. Stop chaining and let the short page render — the next
  //    manual `loadMore()` click continues from here with a fresh budget.
  //    → return undefined (stop).
  // 4. Else if `props.continueCursor` is falsy → nothing to advance to even
  //    though `isDone` said otherwise; treat as done rather than loop.
  //    → return undefined (stop).
  // 5. Otherwise the window isn't full, more pages exist, and there's
  //    budget left.
  //    → return props.continueCursor (advance).
  // Edge cases:
  // - `continueCursor === ""` is this hook's own empty-state placeholder
  //   (see the `result` memo — never a real cursor), not a value to advance
  //   to; step 4 covers it since it's falsy.
  throw new Error("Not implemented");
}
```

Add the iteration counter state (with the existing `clientPageIndex` state):

```ts
const [autoFetchIterations, setAutoFetchIterations] = useState(0);
```

Reset the budget on every manual invocation — update `loadMore`:

```ts
function loadMore() {
  setAutoFetchIterations(0);
  if (needsServerFetch && result.continueCursor) {
    setCursor(result.continueCursor);
  } else {
    setClientPageIndex((prev) => prev + 1);
  }
}
```

Add a new effect after the existing accumulation effect, wiring the resolved
config bound to the decision helper:

```ts
const {
  api: {
    pagination: { maxLoadMoreIterations },
  },
} = useVexConfig();

// Auto-continue short pages up to the bound, so a caller doesn't have to
// click "Load More" repeatedly just to fill the first window.
useEffect(() => {
  const nextCursor = resolveNextLoadMoreCursor({
    accumulatedCount: allResults.length,
    windowSize: endIndex,
    isDone: result.isDone,
    continueCursor: result.continueCursor || null,
    iterationsSoFar: autoFetchIterations,
    maxLoadMoreIterations,
  });
  if (nextCursor !== undefined) {
    setCursor(nextCursor);
    setAutoFetchIterations((n) => n + 1);
  }
}, [
  result.page,
  result.isDone,
  result.continueCursor,
  endIndex,
  allResults.length,
  autoFetchIterations,
  maxLoadMoreIterations,
]);
```

- [ ] `packages/react/src/hooks/usePaginatedQuery.test.tsx`

#### `packages/react/src/hooks/usePaginatedQuery.test.tsx`

```tsx
import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { defineConfig, sanitizeConfigForClient } from "@vexcms/core";
import type {
  ClientVexConfig,
  PaginationResult,
  VexDocument,
} from "@vexcms/core";
import { VexConfigContext } from "../context/VexConfigContext";
import { usePaginatedQuery } from "./usePaginatedQuery";

interface TestDoc extends VexDocument {
  title: string;
}

function doc(id: string): TestDoc {
  return { _id: id, _creationTime: 0, title: id };
}

/** Cursor → page fixture, keyed by cursor (`"null"` for the first page). Reset per test via `setPages`. */
let pagesByCursor: Record<string, PaginationResult<TestDoc>> = {};
let fetchCount = 0;

function setPages(pages: Record<string, PaginationResult<TestDoc>>) {
  pagesByCursor = pages;
  fetchCount = 0;
}

vi.mock("@convex-dev/react-query", () => ({
  convexQuery: (
    _fn: unknown,
    args: { paginationOpts: { cursor: string | null } },
  ) => {
    const key = args.paginationOpts.cursor ?? "null";
    return {
      queryKey: ["findPaginated", key],
      queryFn: async () => {
        fetchCount += 1;
        const page = pagesByCursor[key];
        if (!page) {
          throw new Error(
            `usePaginatedQuery.test: no fixture page for cursor "${key}"`,
          );
        }
        return page;
      },
    };
  },
}));

function createWrapper(maxLoadMoreIterations?: number) {
  const config: ClientVexConfig = sanitizeConfigForClient(
    defineConfig(
      maxLoadMoreIterations === undefined
        ? undefined
        : { api: { pagination: { maxLoadMoreIterations } } },
    ),
  );
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <VexConfigContext.Provider value={config}>
          {children}
        </VexConfigContext.Provider>
      </QueryClientProvider>
    );
  };
}

describe("usePaginatedQuery — bounded loadMore", () => {
  it("chains short pages automatically until the client window fills", async () => {
    setPages({
      null: { page: [doc("a")], continueCursor: "c1", isDone: false },
      c1: { page: [doc("b")], continueCursor: "c2", isDone: false },
      c2: { page: [doc("c")], continueCursor: "c3", isDone: false },
    });

    const { result } = renderHook(
      () =>
        usePaginatedQuery<TestDoc>({
          query: {
            collection: "posts",
            paginationOpts: { numItems: 3, cursor: null },
          },
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.results).toHaveLength(3));
    expect(result.current.results.map((d) => d._id)).toEqual(["a", "b", "c"]);
    // Filled by three chained fetches, not a single short page.
    expect(fetchCount).toBe(3);
  });

  it("stops at maxLoadMoreIterations when pages never fill the window or finish", async () => {
    setPages({
      null: { page: [doc("a")], continueCursor: "c1", isDone: false },
      c1: { page: [doc("b")], continueCursor: "c2", isDone: false },
      c2: { page: [doc("c")], continueCursor: "c3", isDone: false },
      c3: { page: [doc("d")], continueCursor: "c4", isDone: false },
      c4: { page: [doc("e")], continueCursor: "c5", isDone: false },
    });

    const { result } = renderHook(
      () =>
        usePaginatedQuery<TestDoc>({
          query: {
            collection: "posts",
            paginationOpts: { numItems: 100, cursor: null },
          },
        }),
      { wrapper: createWrapper(2) },
    );

    // 1 initial fetch + 2 bounded auto-continuations = 3 total.
    await waitFor(() => expect(fetchCount).toBe(3));
    expect(result.current.results).toHaveLength(3);
    expect(result.current.isDone).toBe(false);

    // Give a runaway auto-fetch effect a chance to fire, then confirm it didn't.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fetchCount).toBe(3);
  });
});
```

Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test`

### Step 8 — Dev warnings `[agent]`

- [ ] `packages/core/src/access/warnUnindexedRule.ts`

#### `packages/core/src/access/warnUnindexedRule.ts`

```ts
import { WILDCARD_KEY } from "./constants";
import type { PermissionCheck, SubjectEntry, VexAccessConfig } from "./types";

/** Row count above which a bare-callback `read` rule triggers the warning. */
const UNINDEXED_RULE_WARNING_ROW_THRESHOLD = 1000;

/** `"<resource>:<role>"` pairs already warned about this process. */
const warnedRules = new Set<string>();

/**
 * Warns once, in dev only, when a role's `read` (or `readDrafts`) rule on a
 * collection is a bare callback — no `withIndex` — and the query it governs
 * is large enough that per-document post-filtering will scale with table
 * size instead of page size.
 *
 * Callers already know the two facts this needs: `resolveAccessIndex` found
 * no index for `resource`/`action` under a single restrictive `role` (§5 of
 * the design doc — multi-role OR-merges are never the reason this fires, an
 * unindexed callback is), and the row count the un-indexed query just read.
 * This re-derives only whether that role's specific check is a bare callback
 * (rather than the indexed object form, a static boolean, or a field-mode
 * object) — the one fact "no index resolved" doesn't by itself distinguish
 * from "this role has no rule for this action at all".
 *
 * Silent when `NODE_ENV === "production"`, when `rowCount` is at or below the
 * threshold, or when this exact collection+role pair already warned once
 * this process.
 *
 * @param props.access - Resolved access config. Absent ⇒ nothing to check.
 * @param props.role - The single role whose rule governs this query.
 * @param props.resource - Collection slug the rule governs.
 * @param props.action - The query-shaped action being read (`read` | `readDrafts`).
 * @param props.rowCount - Rows the un-indexed query read.
 * @param props.rowThreshold - Row count above which the warning fires.
 * @defaultValue 1000
 */
export function warnUnindexedRule<
  TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>,
>(props: {
  access?: VexAccessConfig<TSubjects>;
  role: string;
  resource: string;
  action: string;
  rowCount: number;
  rowThreshold?: number;
}): void {
  if (process.env.NODE_ENV === "production") return;
  if (!props.access) return;

  const threshold = props.rowThreshold ?? UNINDEXED_RULE_WARNING_ROW_THRESHOLD;
  if (props.rowCount <= threshold) return;

  const check = resolveRoleActionCheck(
    props.access,
    props.role,
    props.resource,
    props.action,
  );
  if (typeof check !== "function") return;

  const key = `${props.resource}:${props.role}`;
  if (warnedRules.has(key)) return;
  warnedRules.add(key);

  console.warn(
    `[vexcms] Role "${props.role}" governs ${props.action} on "${props.resource}" (${props.rowCount.toLocaleString()} rows) with a per-document callback and no withIndex. Pages will be short and reads scale with table size. Add an index on the field this rule tests and declare it via access.permissions.${props.role}.${props.resource}.${props.action}.withIndex.`,
  );
}

/**
 * Looks up one role's check for one resource+action, applying the same
 * action-then-wildcard precedence as `hasPermission`'s internal
 * `resolveActionCheck` (`hasPermission.ts:315-326`) — duplicated locally
 * because that helper is module-private and this is a diagnostic read, not
 * an authorization decision.
 *
 * @returns The resolved check, or `undefined` when the role has no rule at
 *   all for this resource (nothing to warn about — that's a permission gap,
 *   not an indexing gap).
 */
function resolveRoleActionCheck<
  TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>,
>(
  access: VexAccessConfig<TSubjects>,
  role: string,
  resource: string,
  action: string,
): PermissionCheck | undefined {
  const roleRules = access.permissions[role];
  const subject = roleRules?.[resource];
  if (
    subject === null ||
    subject === undefined ||
    typeof subject !== "object"
  ) {
    // Boolean shorthand (`{ posts: true }`) or absent — never a bare
    // callback, so never a warning candidate.
    return undefined;
  }
  const subjectRules = subject as Record<string, unknown>;
  if (action in subjectRules) {
    return subjectRules[action] as PermissionCheck;
  }
  if (WILDCARD_KEY in subjectRules) {
    return subjectRules[WILDCARD_KEY] as PermissionCheck;
  }
  return undefined;
}
```

- [ ] `packages/core/src/access/pickQueryIndex.ts`

#### `packages/core/src/access/pickQueryIndex.ts`

Step 4 already added the
once-per-pair guard (`warnedDisplacedIndexes`, a module-level `Set<string>`)
in the "different name ⇒ caller wins" branch of `pickQueryIndex`. Update only
the warning message inside that branch so it names the compound index to add:

```ts
// Case 3 — different names: caller wins, the access index is dropped
// from this query (its rule's `filter` still enforces it per document —
// this only costs reads, never correctness). Warn once per
// (access, caller) name pair, naming the compound index that would keep
// the query narrowed too.
const displacedWarningKey = `${accessIndex.name}:${callerIndex.name}`;
if (!warnedDisplacedIndexes.has(displacedWarningKey)) {
  warnedDisplacedIndexes.add(displacedWarningKey);
  console.warn(
    `[vexcms] Query index "${callerIndex.name}" displaced the access index "${accessIndex.name}" — reads are now filtered per document instead of narrowed by role. Add a compound index combining "${callerIndex.name}" and "${accessIndex.name}" and pass it as withIndex to keep this query both indexed and access-narrowed.`,
  );
}
```

- [ ] `packages/core/src/access/warnUnindexedRule.test.ts`

#### `packages/core/src/access/warnUnindexedRule.test.ts`

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineCollection, text } from "../index";
import { defineAccess } from "./config";
import { warnUnindexedRule } from "./warnUnindexedRule";

// One collection per scenario keeps each test's "<resource>:<role>" warn-once
// key independent of execution order and of the other scenarios below.
const postsA = defineCollection({ slug: "postsA", fields: { title: text() } });
const postsB = defineCollection({ slug: "postsB", fields: { title: text() } });
const postsC = defineCollection({ slug: "postsC", fields: { title: text() } });
const postsD = defineCollection({ slug: "postsD", fields: { title: text() } });
const postsE = defineCollection({ slug: "postsE", fields: { title: text() } });
const postsF = defineCollection({ slug: "postsF", fields: { title: text() } });

const access = defineAccess({
  roles: ["reviewer", "contributor", "editor", "viewer"] as const,
  resources: [postsA, postsB, postsC, postsD, postsE, postsF],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    reviewer: {
      postsA: { read: () => true },
      postsB: { read: () => true },
      postsC: { read: () => true },
      postsF: { read: () => true },
    },
    contributor: {
      postsA: { read: () => true },
    },
    editor: {
      postsD: { read: { filter: () => true, withIndex: { name: "by_x" } } },
    },
    viewer: {
      postsE: { read: true },
    },
  },
});

describe("warnUnindexedRule", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it("warns once for a bare-callback read rule past the row threshold, naming the collection and role", () => {
    warnUnindexedRule({
      access,
      role: "reviewer",
      resource: "postsA",
      action: "read",
      rowCount: 50000,
    });
    warnUnindexedRule({
      access,
      role: "reviewer",
      resource: "postsA",
      action: "read",
      rowCount: 50000,
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      '[vexcms] Role "reviewer" governs read on "postsA" (50,000 rows) with a per-document callback and no withIndex. Pages will be short and reads scale with table size. Add an index on the field this rule tests and declare it via access.permissions.reviewer.postsA.read.withIndex.',
    );
  });

  it("fires again for a different role and for a different collection — each is a distinct pair", () => {
    warnUnindexedRule({
      access,
      role: "reviewer",
      resource: "postsA",
      action: "read",
      rowCount: 5000,
    });
    warnUnindexedRule({
      access,
      role: "contributor",
      resource: "postsA",
      action: "read",
      rowCount: 5000,
    });
    warnUnindexedRule({
      access,
      role: "reviewer",
      resource: "postsB",
      action: "read",
      rowCount: 5000,
    });

    expect(warnSpy).toHaveBeenCalledTimes(3);
  });

  it("stays silent at or below the row threshold", () => {
    warnUnindexedRule({
      access,
      role: "reviewer",
      resource: "postsC",
      action: "read",
      rowCount: 1000,
    });
    expect(warnSpy).not.toHaveBeenCalled();

    warnUnindexedRule({
      access,
      role: "reviewer",
      resource: "postsC",
      action: "read",
      rowCount: 1001,
    });
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("stays silent for an indexed object-form rule regardless of row count", () => {
    warnUnindexedRule({
      access,
      role: "editor",
      resource: "postsD",
      action: "read",
      rowCount: 100000,
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("stays silent for a static boolean rule", () => {
    warnUnindexedRule({
      access,
      role: "viewer",
      resource: "postsE",
      action: "read",
      rowCount: 100000,
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("stays silent in production regardless of threshold", () => {
    vi.stubEnv("NODE_ENV", "production");
    warnUnindexedRule({
      access,
      role: "reviewer",
      resource: "postsF",
      action: "read",
      rowCount: 100000,
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 9 — `apps/www` wiring + docs `[dev]`

- [ ] `apps/www/src/auth/access.ts`

#### `apps/www/src/auth/access.ts`

Every `images` document already carries a
real `deleted: boolean` (never `undefined` — `defineMediaCollection`'s create
path always writes `deleted: false`, `packages/file-storage-convex/src/adapter/methods.ts:44`),
and the generated schema already indexes it (`by_deleted`,
`apps/www/convex/vex.schema.ts:330`). Replace the commented-out
`// read: true,` line inside `permissions[USER_ROLES.user].images` with the
first indexed row-level rule in this codebase:

```ts
      images: {
        "*": false,
        read: {
          // TODO: implement
          // 1. Return `true` only for images that are not soft-deleted.
          //    → data.deleted === false
          filter: ({ data }) => {
            throw new Error("Not implemented");
          },
          withIndex: {
            name: "by_deleted",
            // TODO: implement
            // 1. Narrow the query to the exact predicate `filter` checks
            //    above — a `withIndex` looser or stricter than its `filter`
            //    is a bug (see the access-control guide): looser costs
            //    reads, stricter silently hides permitted rows.
            //    → (q) => q.eq("deleted", false)
            range: () => {
              throw new Error("Not implemented");
            },
          },
        },
        update: ({ data: image }) => {
          return !image.src.includes("https://maprios.com");
        },
      },
```

- [ ] `apps/www/convex/vex.schema.ts`

#### `apps/www/convex/vex.schema.ts`

No change. The `images` table already
carries the index this rule names:

```ts
export const images = defineTable({
  filename: v.string(),
  alt: v.string(),
  mimeType: v.string(),
  size: v.number(),
  storageId: v.string(),
  deleted: v.optional(v.boolean()),
  src: v.string(),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
})
  .index("by_deleted", ["deleted"])
  .searchIndex("search_filename", {
    searchField: "filename",
    filterFields: ["alt"],
  });
```

Run `vex generate` (or `vex dev`) after the `access.ts` change anyway — it is
what regenerates the access-index type registry (`AccessIndexBySlug` /
`AccessIndexNameFor`, Step 2) so `withIndex: { name: "by_deleted" }` is
checked against the real schema instead of the pre-generation wide fallback.

- [ ] `apps/docs/src/content/docs/guides/access-control.mdx`

#### `apps/docs/src/content/docs/guides/access-control.mdx`

````mdx
---
title: Access Control
description: Row-level read rules that narrow the query VexCMS builds, instead of reading every row and discarding what the caller can't see.
---

VexCMS's RBAC layer (`defineAccess`) authorizes every action through
`hasPermission`. For the two query-shaped actions — `read` and `readDrafts` —
a rule can _also_ contribute an index to the query the framework builds, so a
list view reads only the rows the caller can see instead of reading the whole
table and discarding the rest.

## The object form

A bare callback still works exactly as before — it runs per document, after
the query already read the row:

```ts
pages: {
  read: ({ data, user }) => user.assignedTeams.includes(data.teamId),
},
```

A `read` (or `readDrafts`) rule can instead declare both a `filter` and a
`withIndex`:

```ts
pages: {
  read: {
    filter: ({ data, user }) => data.authorId === user._id,
    withIndex: {
      name: "by_author",
      range: ({ user }) => (q) => q.eq("authorId", user._id),
    },
  },
},
```

**`filter` is the rule. It always runs, for every document, exactly like the
bare-callback form.** `withIndex` is a hint that narrows what the query reads
_before_ `filter` ever sees a row. When the index range already expresses the
rule, `filter` rejects nothing and pages come back full. When it can only
partially express the rule, pages come back short — correct, just not free.

`withIndex` alone (no `filter`) is not a valid shape: `hasPermission` is also
called with no query in play at all — checking an already-fetched document on
the client, or authorizing a single `get`/`update`/`remove` — and those call
sites have nothing to narrow. `filter` is what they evaluate.

Object form is valid only on `read` and `readDrafts` — every other action
(`create`, `update`, `delete`) authorizes a single document with no range to
narrow, so a `withIndex` there would be a silent no-op. This is enforced at
compile time: a `withIndex` on `update`/`delete`/`create` is a type error.

## The one way to misuse this API

**`filter` and `withIndex` must express the same predicate.** They are
allowed to diverge in one direction only:

- **`withIndex` looser than `filter`** — the index narrows partially, `filter`
  refines the rest. Pages come back short. Correct, just not free. This is
  expected whenever the rule can't be fully expressed as an index range (see
  below).
- **`withIndex` _stricter_ than `filter`** — the index excludes rows `filter`
  would have permitted. **This silently hides permitted rows with no error.**
  It is the one genuine footgun in this API, because nothing else in the
  system can detect it: the index and the filter are two independently
  authored expressions, and Convex has no way to prove one implies the other.

  ```ts
  // Bug: filter permits drafts too, but the index only ever reads published rows.
  // Draft rows this caller is allowed to see never make it out of the query.
  read: {
    filter: ({ data }) => data.authorId === "me" || data.status === "published",
    withIndex: { name: "by_status", range: () => (q) => q.eq("status", "published") },
  },
  ```

  Always ask: "does the index range express _at least_ everything the filter
  allows?" If narrowing by the index could ever exclude a row the filter
  alone would have kept, the index is too strict.

## What can and can't be indexed

An index range is an equality or range comparison on **a document field
against a value known when the query runs** (a literal, or something off
`user`/`organization`) — the same shape a hand-written
`.withIndex((q) => q.eq(...))` call already needs.

**Indexable:**

- Equality: `data.authorId === user._id` → `q.eq("authorId", user._id)`
- Range: `data.publishedAt >= cutoff` → `q.gte("publishedAt", cutoff)`
- A prefix of a compound index, same as any other Convex query

**Not indexable** — write these as a bare callback; they'll be post-filtered,
correctly, just not narrowed:

- Array membership: `user.assignedTeams.includes(data.teamId)`
- String methods: `data.title.startsWith("Draft:")`
- Regex: `/^internal-/.test(data.slug)`
- Cross-table lookups: anything that reads a second collection inside the
  callback

Convex allows exactly one `withIndex` per query. When a caller's own `find()`
call already needs a different index (a sorted list, a slug lookup, a
relationship picker), the caller's index wins — the access rule's `filter`
still runs and still enforces the rule, so this only costs reads, never
correctness. If both the access rule and a common caller query want their own
index on the same collection, add a **compound index** covering both, and
declare it in `withIndex`.

## Capability differences are roles, not branches

If some users under a role should see more than others, that's a second
role — not a conditional inside one rule's `filter`. `hasPermission` OR-merges
every role a user holds, so the broader grant simply wins:

```ts
// Do this:
permissions: {
  contributor: {
    pages: { read: { filter: ({ data, user }) => data.authorId === user._id, withIndex: { /* … */ } } },
  },
  editor: {
    pages: { read: true },
  },
},
// A user with both roles sees everything — the editor grant wins, and the
// index vanishes from that query too (an unrestricted role can't be scanned
// through an index built for a restrictive one).

// Not this — it's a role that was never declared, and it defeats index
// narrowing because the range can't vary per caller:
permissions: {
  contributor: {
    pages: {
      read: ({ data, user }) => user.isSenior || data.authorId === user._id,
    },
  },
},
```

## Dev-time visibility

In development, VexCMS warns (once per collection+role) when a bare-callback
`read` rule governs a collection past a row threshold, naming the collection,
the role, and pointing at the `withIndex` you need to declare. Raising
`api.pagination.maxLoadMoreIterations` (default `5`) is the _second_ thing to
try if a list view is still short after that — not the first.
````

Verify: `pnpm --filter www typecheck && pnpm --filter www build && pnpm --filter docs build`

### Step 10 — Verification `[dev]`

- [ ] `pnpm build && pnpm test && pnpm lint` clean across the workspace.
- [ ] Manual: contributor role sees only own rows in the admin list; Convex dashboard shows reads scaling with page size, not table size.

Verify: `pnpm build && pnpm test`
