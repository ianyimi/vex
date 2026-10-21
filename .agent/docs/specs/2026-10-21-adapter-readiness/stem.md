# 2026-10-21-adapter-readiness — Spec stem

> **Not a spec yet.** Input for a future `dev-spec` interview. Collects the work that keeps a
> later database-adapter split (Track DB) **non-breaking for plugin authors**, so it must land
> before Track PL makes the affected surfaces public. That is post-0.1.0 but before
> `definePlugin` ships, not before Track DB.
>
> Prerequisite, before 0.1.0: launch-plan **B3**,
> `specs/2026-10-21-backend-neutral-query-args/` (`where`, Vex-typed `withIndex`, access
> `q.where`, `VexError`, ADR-015).
> Context: `research/db-adapter-feasibility.md` §5, `product/post-v0.1.0-plan.md` Track DB and
> Track PL, `specs/2026-10-21-plugin-system/stem.md`.

## Why this exists

Track DB (adapters) is scheduled after Enterprise. Track PL (plugins) comes first after
0.1.0. Anything a plugin author writes against a Convex-shaped surface becomes third-party
code that breaks at the split. B3 fixes the query arguments before 0.1.0. The items below
fix the remaining surfaces that only become public through plugins.

## Decided (2026-10-21)

| # | Decision | Source |
|---|---|---|
| R1 | `@vexcms/core/server` is the permanent import path for the `ctx`-taking server API. A database adapter plugs in beneath it (adapters ship as plugins, `post-v0.1.0-plan.md` decision 14); `ctx` is typed by the active adapter | ADR-015 (B3) |
| R2 | `where` is the portable predicate on `find`/`search` and in access rules (`q.where`). `withIndex` is Convex-specific on both | ADR-015 (B3) |
| R3 | At the split, `withIndex` moves out of core's declarations (`FindServerArgs`, `AccessQueryBuilder`) into interfaces the Convex adapter augments. Core keeps only `where`. Call sites do not change. Not built before the split, because with one backend the augmentation interface is inert code | ADR-015 (B3) |

## Work items (gate: before Track PL exposes the surface)

### 1. Backend-neutral storage kind on field types

**Today.** `ADMIN_FIELDS` (`packages/core/src/fields/constants.ts`, exported from the root, marked
`@internal`) and the per-field `fields/*/validator.ts` functions carry Convex validator strings
(`validator: "v.string()"`). Schema generation (`schema/generateVexSchema.ts`) concatenates them.

**Why before PL.** Plugin-contributed field types (plugin stem questions 3 and 19) would
otherwise declare Convex `v.*` strings, so every third-party field type breaks at the split.

**Shape to decide.** A storage kind per field type, for example
`{ kind: "string" | "number" | "boolean" | "json" | "ref" | "array" | "object" | "union", … }`,
with `ref` carrying the target collection and `array`/`object`/`union` carrying children. The
Convex `v.*` string is derived from it by a Convex emitter. Pair it with the plugin stem's
question 19 (unify `generateVexTypes` and `generateVexSchema`), because both walk the same
field tree, and the backlog entry "Type generation and schema generation are separate code
paths" already calls for one walker. Plugin field types then supply a storage kind, never a
schema string.

**Not breaking for apps.** `ADMIN_FIELDS` is `@internal`; `@vexcms/react` reads only `.type`
from it.

### 2. `vex` API in lifecycle hook props

**Today.** `BaseHookProps` (`packages/core/src/hooks/types.ts`) carries only
`ctx: GenericMutationCtx`. `validate()` and live-preview resolvers already receive the bound
`vex` API (`createVexCallbackApi`, `api/server.ts`).

**Why before PL.** Plugins are the main authors of hooks. With only `ctx`, every plugin hook
reaches for `ctx.db` and runs only on Convex. With `vex` available and documented as the
default, most plugin hooks are portable as written.

**Shape.** Add `vex: VexCallbackApi` to `BaseHookProps`, built per invocation the way
`validateFields` does. Additive. Decide whether hooks get write methods (`create`/`update`
inside a hook re-enters the write pipeline and its hooks), or stay read-only like `validate()`.
Recursion and transaction-limit rules belong to plugin stem questions 13–14.

### 3. Serializable `where` (the filter tree as data)

**Today, after B3.** `where` is a callback. The recorded output is a plain-data tree
(`AccessFilterConstraint`: `compare` / `and` / `or` / `not`, `access/constraintTypes.ts`).
Client wrappers (`@vexcms/react/client` `find`) accept no filter at all.

**Why before PL.** Launch spec I's `list.filters` slot and saved views, plugin-contributed
list filters (plugin stem S-table), and the client `find` all need a filter that crosses the
network and can be stored. If each invents its own shape, adapters later have to support
several.

**Shape.** Publish the tree as a public type (for example `VexWhereNode<S>`). Accept
`where: VexWhere<S> | VexWhereNode<S>` on the server API (additive union), accept only the
node form on the client and in the generated Convex functions' argument validators, and store
saved views as nodes. One predicate format for queries, access rules, saved views, plugin
filters, the Convex-component data provider (plugin stem question 16), and future adapters.

**Timing note.** Spec I runs before 0.1.0. If I builds filters or saved views, it should
adopt this item's shape then. Otherwise this stays post-0.1.0.

### 4. One data seam for Convex-component collections and database adapters

**Today.** Not built. The plugin stem's question 16 (external collections backed by a
component's API) and Track DB both need a "list / get / create / update / delete given a
filter tree" interface.

**Why before PL.** The Convex-component data provider ships with PL. Designing it without
Track DB in mind produces two seams.

**Shape.** The provider receives the filter tree (item 3), never a compiled Convex filter. B3's
`compileWhere` already builds the tree before compiling, so the provider can take the tree
from there. The interface is designed in the PL spec, reviewed against
`research/db-adapter-feasibility.md` §1's coupling list (pagination cursors, counts, search),
and adopted by Track DB later rather than redesigned.

## Explicitly not in scope

- The adapter split itself, `@vexcms/convex`, or any second backend (Track DB).
- Rewriting versions/drafts writes against a narrow port (feasibility doc §5 item 4). This is
  internal and can be refactored during the split without breaking anyone.
- Moving `withIndex` into an augmentation interface before the split (R3).

## Questions the spec must answer

1. The storage-kind vocabulary: does `json` cover `richtext` and `blocks`, or do blocks keep a
   discriminated `union` kind so SQL adapters can choose `jsonb` vs child tables?
2. Do hooks get the full `vex` API (writes included) or read-only? How is recursion bounded?
3. The serialized `where`: field paths into `group`/`array` values, `in`/`contains` operators
   (needed by list filters, absent today), and how it relates to `ConstraintValue` typing on
   the client.
4. Ownership: does item 4 live in this spec or in the plugin spec, with this stem as the
   checklist?
