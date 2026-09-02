# RBAC v2 Design — Rebuild Access Control

> Research + design variants for the rebuild's RBAC system. Full examples per variant below;
> sources and code refs at the end.

## Question

Design the rebuild's RBAC so that: (1) `hasPermission({...args}) => boolean` ergonomics from
master are preserved; (2) arbitrary non-resource subjects (admin panel, drafts, user-defined
gates) are checkable through the same API; (3) config stays a single typed constant imported
into `vex.config.ts` (per-collection `access` intentionally NOT supported); (4) code lives in
`packages/core` so auth plugins can import it. Open sub-questions: row-level (per-document)
auth configs — worth it? DB-stored roles (project users build their own role editors) — build
now, later, or never?

---

## Variants at a glance

| | A: gates | B: unified subjects ★ | C: rule objects |
|---|---|---|---|
| Closeness to master | **Closest — master + a `gates` section** | Close — master's matrix, generalized subjects | Furthest — different authoring model |
| DX | Two call shapes; boolean-only gates | One shape; typed actions everywhere | DSL to learn; verbose; weak condition typing |
| Custom gates | Boolean + context hack | First-class, own action unions | First-class |
| Doc-aware callbacks | Yes | Yes | No (or leaky escape hatch) |
| Drafts gating | Global gate w/ context | Per-collection actions, automatic | Per-collection actions |
| Client UI checks | Server snapshot | Server snapshot | Native (rules serialize) |
| DB-stored roles later | No real path | Via internal-rules seam (subset) | Native |
| Perf | In-memory, O(roles) | In-memory, O(roles) | In-memory O(rules); +1 query if DB-backed |
| Lift | S | M | L |

Runtime perf is a non-factor across all three: sync in-memory map lookups are noise next to
any Convex query, same as master. The only perf-relevant decision is DB-backed roles
(+1 cached query per request) — which none of these forces on you.

### Short descriptions — what each is, how they differ

**Variant A — Resource matrix + `gates` namespace.** *The most master-like option.* Master's
role → resource → action matrix, verbatim, plus a new `gates: {...}` section for non-resource
checks (admin panel, drafts, custom gates). It's master's magic `admin` key generalized into a
namespace. Differs from B/C in that gates are a *second* vocabulary: a gate is a single
boolean check (`hasPermission({ gate: "drafts", context })`), not a subject with actions.

**Variant B — Unified subjects with per-subject action unions (recommended).** Everything is
a subject: collections/globals get CRUD actions (+ auto-added draft actions when
`versions.drafts: true`), core ships built-in subjects (`adminPanel: access | impersonate`),
and users declare arbitrary custom subjects with arbitrary action arrays (better-auth's
`createAccessControl` statements pattern). Still master's role → subject → action → check
matrix and the same `hasPermission({ resource, action })` call — migration is mechanical
(`admin: true` → `adminPanel: { access: true }`). Differs from A in having ONE vocabulary:
custom gates are real subjects with their own typed actions. Differs from C in keeping
free-form JS callbacks.

**Variant C — Serializable rule objects.** CASL/Directus-style: roles are arrays of
`{ subject, actions, where?, fields? }` data rules; conditions are a query-ish DSL
(`{ slug: { nin: [...] } }`, `$user._id` refs) instead of functions. Least like master —
different authoring shape, callbacks replaced by the DSL. Its unique win: rules are pure data,
so DB-stored roles and client-side checks work natively.

### Recommendation (up front)

**Variant B as the authored API, compiled internally to Variant C's normalized rule form.**
`defineAccess` flattens the matrix into normalized checks; `hasPermission` evaluates the
normalized form; a callback is simply a check that happens to be non-serializable. B's DX now
for size-M effort; when user-buildable RBAC is wanted, `buildAccess(rules) + vex_roles` is an
additive tool over the same evaluator — not a rewrite.

---

## Answers to the two open sub-questions

### Row-level auth configs: skip — confirmed

Master's doc-aware callbacks (`delete: ({ data }) => !PROTECTED_SLUGS.includes(data.slug)`)
already give row-level *logic* for free. What row-level configs would add is row-level *data*
— an ACL stored per document — which needs:

- storage schema per collection,
- an ACL editing UI on every document,
- list-query filtering that Convex **cannot push into indexes** — you'd post-filter every
  page, which breaks `paginationOpts` guarantees (master already has this wart in its
  read-filtered list queries: pages come back partially emptied).

Payload gets away with doc-level access via query constraints because SQL/Mongo can push
predicates down; Convex can't. The escape hatch is free: a user who really wants per-doc ACLs
adds an `acl` field to their collection and writes a callback that reads `data.acl` —
row-level auth in userland, zero core code.

### User-buildable RBAC (roles in Convex): don't build now, keep the seam open

The pattern — used by CASL persisted permissions, Directus policies, and better-auth dynamic
access control — is to keep `hasPermission` **sync and pure over a rules object**, and make
*acquiring* the rules the async part:

```ts
const roleDocs = await ctx.db.query("vex_roles").collect() // 1 query/request, Convex-cached
const access = buildAccess({ roles: roleDocs })
hasPermission({ access, ... })                              // same sync check as static config
```

Not a lookup per check — a lookup per request. Two real costs, known up front:

1. DB-stored roles can only use the *serializable subset* (no JS callbacks — better-auth has
   the identical restriction on dynamic AC roles).
2. Client-side checks need a server round-trip or snapshot (better-auth documents this exact
   caveat: `checkRolePermission` doesn't work for dynamic roles).

---

## Shared foundation (all variants)

- Lives in `packages/core/src/access/` — pure, zero Convex imports, exported from
  `@vexcms/core`. Auth plugins import it; nothing imports back.
- Single typed constant in `src/vexcms/access.ts` → `defineConfig({ access })`.
  Per-collection/global `access` config **intentionally unsupported** — one convention, one
  place to audit. (Payload's inline model is the thing we're deliberately not doing.)
- Master semantics preserved: multi-role OR merge (allow wins over deny), field-level
  `{mode: "allow"|"deny", fields}` objects, permissive defaults, `throwOnDenied` →
  `VexAccessError`, `access` stripped by `sanitizeConfigForClient`.

---

## Variant A — Resource matrix + `gates` namespace (minimal evolution, most master-like)

Bolt a `gates` section beside the resource matrix. Two call shapes.

### `apps/www/src/vexcms/access.ts`

```ts
import { defineAccess, gate } from "@vexcms/core"
import { footers, headers, pages, themes, users } from "~/vexcms/collections"
import { nav } from "~/vexcms/globals"

export const access = defineAccess({
  roles: ["admin", "editor", "viewer"],
  resources: [pages, headers, footers, themes, users, nav],
  gates: {
    adminPanel: gate(),
    drafts: gate<{ collection: string }>(),   // typed context
    exportData: gate(),
  },
  userCollection: users,
  permissions: {
    admin: {
      pages: true, headers: true, footers: true, themes: true, users: true, nav: true,
      gates: { adminPanel: true, drafts: true, exportData: true },
    },
    editor: {
      pages: {
        create: true, read: true, update: true,
        delete: ({ data }) => !["home", "pricing"].includes(data.slug),
      },
      users: { read: ({ data, user }) => data._id === user._id },
      gates: {
        adminPanel: true,
        drafts: ({ context }) => context.collection !== "themes",
        exportData: false,
      },
    },
    viewer: {
      pages: { read: true }, users: false,
      gates: { adminPanel: true, drafts: false, exportData: false },
    },
  },
})
```

### Usage

```ts
hasPermission({ access, user, userRoles, resource: "pages", action: "update" })          // boolean
hasPermission({ access, user, userRoles, gate: "drafts", context: { collection: "pages" } }) // boolean
```

### Core

Master's files nearly verbatim + `gates` types and a `gate` branch in `hasPermission`.

### Tradeoffs

Smallest lift (S), near-zero migration from master. But: two vocabularies
(`resource/action` vs `gate/context`) in one API; gates are boolean-only — when you want
`drafts: read` vs `drafts: publish` you're minting `draftsRead`/`draftsPublish` gates or
overloading `context`; and `gates` is a reserved key inside the role matrix, the same wart
class as master's magic `admin` key.

---

## Variant B — Unified subjects with per-subject action unions ★ recommended

Everything is a subject. Collections/globals are subjects with CRUD actions; collections with
`versions.drafts: true` automatically gain `readDrafts | saveDraft | publish | unpublish`;
core contributes built-in subjects (`adminPanel`); users declare arbitrary custom subjects
with arbitrary action arrays. This is better-auth's `createAccessControl` statements pattern —
and the typing mechanism is literally the `Permissions` type-map already in
`apps/www/src/auth/permissions.ts:16-34`, generalized. Still master's matrix shape and call
signature — second-closest to master after A.

### `apps/www/src/vexcms/access.ts`

```ts
import { defineAccess } from "@vexcms/core"
import { footers, headers, pages, themes, users } from "~/vexcms/collections"
import { nav } from "~/vexcms/globals"

const PROTECTED_SLUGS = ["home", "pricing"]

export const access = defineAccess({
  roles: ["admin", "editor", "viewer"],
  resources: [pages, headers, footers, themes, users, nav],
  // arbitrary non-resource subjects: name → action strings
  customResources: {
    apiKeys: ["create", "revoke"],
    analytics: ["view"],
    dangerZone: ["wipeSite"],
  },
  adminRoles: ["admin", "editor", "viewer"],
  userCollection: users,
  permissions: {
    admin: {
      // "*" wildcard — everything, incl. custom subjects
      "*": true,
    },
    editor: {
      adminPanel: { access: true, impersonate: false },   // core built-in subject
      pages: {
        create: true, read: true, update: true,
        delete: ({ data }) => !PROTECTED_SLUGS.includes(data.slug),
        // draft actions live on the resource itself — per-collection by construction
        readDrafts: true, saveDraft: true, publish: false,
      },
      users: {
        read: ({ data, user }) => data._id === user._id,
        update: { mode: "allow", fields: ["name", "image"] },  // field-level, unchanged
      },
      nav: { read: true, update: true, publish: false },
      apiKeys: false,
      analytics: { view: true },
      dangerZone: false,
    },
    viewer: {
      adminPanel: { access: true },
      pages: { read: true, readDrafts: false },
      users: false, apiKeys: false, dangerZone: false,
    },
  },
})
```

### Usage — one call shape everywhere

```ts
// Convex mutation guard (identical to master ergonomics)
hasPermission({
  access, user, userRoles: user.roles,
  resource: "pages", action: "publish", data: page, throwOnDenied: true,
})

// admin layout gate — checkAdminAccess is now just sugar for this
hasPermission({ access, user, userRoles, resource: "adminPanel", action: "access" })

// user-defined gate — same call, fully typed: action: "wipeSite" only
hasPermission({ access, user, userRoles, resource: "dangerZone", action: "wipeSite" })

// field map (master overload preserved)
hasPermission({ access, user, userRoles, resource: "users", action: "update",
  fields: ["name", "email"] })  // → { name: boolean, email: boolean }
```

### Key core files

```ts
// packages/core/src/access/types.ts
export type CrudAction = "create" | "read" | "update" | "delete"
export type DraftAction = "readDrafts" | "saveDraft" | "publish" | "unpublish"

/** Subject registry: resources + core built-ins + user custom, each carrying
 *  its action union, doc type, and field keys. Same mechanism as the
 *  Permissions map in apps/www/src/auth/permissions.ts, generalized. */
export type SubjectMap<
  TResources extends readonly AnyResourceConfig[],
  TCustom extends Record<string, readonly string[]>,
> =
  & { [R in TResources[number] as ExtractSlug<R>]: {
      action: CrudAction | (HasDrafts<R> extends true ? DraftAction : never)
      data: InferDocType<R>
      fields: ExtractFieldKeys<R>
    } }
  & { [K in keyof TCustom]: { action: TCustom[K][number]; data: never; fields: never } }
  & { adminPanel: { action: "access" | "impersonate"; data: never; fields: never } }

export type PermissionCheck<TSubject extends SubjectEntry, TUser> =
  | boolean
  | { mode: "allow" | "deny"; fields: TSubject["fields"][] }        // resource subjects only
  | ((props: { data: TSubject["data"]; user: TUser }) => boolean | FieldResult)

// packages/core/src/access/hasPermission.ts — master signature, subject-typed
export function hasPermission<
  TAccess extends VexAccessConfig,
  TSubject extends keyof SubjectsOf<TAccess>,
>(props: {
  access: TAccess | undefined
  user: Record<string, unknown>
  userRoles: string[]
  resource: TSubject
  action: SubjectsOf<TAccess>[TSubject]["action"]   // ← per-subject union
  data?: SubjectsOf<TAccess>[TSubject]["data"]
  fields?: SubjectsOf<TAccess>[TSubject]["fields"][]
  throwOnDenied?: boolean
}): boolean | Record<string, boolean>

// packages/core/src/access/snapshot.ts — for the admin UI (access never ships to client)
/** Resolves doc-independent checks to booleans; doc-dependent → "conditional".
 *  Serializable; computed server-side per user; drives nav/button hiding. */
export function resolvePermissionSnapshot(props: {
  access: VexAccessConfig; user: ...; userRoles: string[]
}): Record<string, Record<string, boolean | "conditional">>
```

### Tradeoffs

One mental model, one call signature; arbitrary gates get real typed actions instead of
boolean-only; draft permissions land per-collection automatically (no separate "drafts"
concept to configure); statement shape aligns with better-auth so `@vexcms/better-auth` could
translate to/from `createAccessControl` if ever useful. Migration from master is mechanical
(`admin: true` → `adminPanel: { access: true }`, drafts checks appear as new actions).
Lift: M — mostly type machinery; the runtime is master's resolver with a subject registry
in front.

---

## Variant C — Serializable rule objects (CASL/Directus-style, least master-like)

Roles are arrays of data rules; conditions are a DSL, not functions.

### `apps/www/src/vexcms/access.ts`

```ts
export const access = defineAccess({
  customResources: { apiKeys: ["create", "revoke"] },
  userCollection: users,
  roles: {
    admin: { label: "Administrator", rules: [{ subject: "*", actions: "*" }] },
    editor: {
      label: "Editor",
      rules: [
        { subject: "adminPanel", actions: ["access"] },
        { subject: "pages", actions: ["create", "read", "update", "readDrafts", "saveDraft"] },
        { subject: "pages", actions: ["delete"],
          where: { slug: { nin: ["home", "pricing"] } } },
        { subject: "users", actions: ["read", "update"],
          where: { _id: { eq: "$user._id" } },              // $user.* refs
          fields: { mode: "allow", keys: ["name", "image"] } },
      ],
    },
  },
})
```

Because rules are pure data, the DB path is native:

```ts
// convex — roles created/edited by your project's users in a role-editor UI
const roleDocs = await ctx.db.query("vex_roles").collect()   // 1 query, Convex-cached
const access = buildAccess({ roles: roleDocs })
hasPermission({ access, user, userRoles, resource: "pages", action: "update", data: page })
```

### Tradeoffs

Only variant where DB-stored roles and client-side checks work natively (rules serialize;
ship them anywhere). But the cost is real: the `where` DSL is a mini-language you must design,
implement, document, and type (`eq/ne/in/nin/gt/lt/exists`, `$user` path refs — and it *will*
grow operators forever); free-form callbacks are gone, or become an escape hatch that
reintroduces the exact serializable/non-serializable split you were avoiding; authoring in a
config file is verbose and conditions are far less type-safe than a lambda. Lift: L. This is
Directus's model — note Directus is a *database* product; it can push `where` rules into
queries. You can't in Convex, so you pay the DSL cost without its biggest benefit.

---

## Recommendation details

**Variant B as the authored API, compiled internally to Variant C's normalized rule form.**
`defineAccess` flattens the matrix into normalized checks; `hasPermission` evaluates the
normalized form; a callback is simply a check that happens to be non-serializable. You ship
B's DX now for size-M effort, and the moment you want user-buildable RBAC,
`buildAccess(rules) + vex_roles` is an additive tool over the same evaluator rather than a
rewrite — static config keeps callbacks, DB roles use the serializable subset, and both flow
through the identical `hasPermission`.

Two smaller calls embedded in this to ratify:

1. **Permissive defaults** — master treats undeclared resource/action as *allow*. Convenient,
   but with custom gates in play, add `defaults: "allow" | "deny"` on `defineAccess`
   (default `"allow"` for master parity). A `dangerZone` gate someone forgets to declare on a
   role shouldn't silently allow.
2. **Org overloads** — master's with/without-org `defineAccess` overload pair. Defer until a
   rebuild app actually uses orgs; it doubles the generic surface for zero current consumers.

Next step once a variant is chosen: `/dev-spec` for `packages/core/src/access/` — master's
1600+ lines of tests encode the merge/default edge cases and port almost directly.

---

## Sources

- Master implementation: `/Users/zaye/Documents/Projects/vex.git/agents/packages/core/src/access/`
  (types.ts, defineAccess.ts, hasPermission.ts, checkAdminAccess.ts), test suites
  hasPermission.test.ts (1272 lines) / defineAccess.test.ts (374 lines); real configs at
  `agents/apps/demo/src/vexcms/access.ts`, `agents/apps/www/src/vexcms/access.ts`.
- Rebuild state: `packages/core/src/{config,collections,globals,auth}/`,
  `apps/www/src/auth/permissions.ts` (app-level stub whose `Permissions` type-map is the
  typing mechanism Variant B generalizes), `.agent/specs/35-globals-system/`,
  `.agent/specs/36-versioning-drafts/`.
- better-auth access control (statements/`createAccessControl`/`newRole`):
  https://better-auth.com/docs/plugins/admin — arbitrary resource keys → action arrays,
  `as const` inference.
- better-auth dynamic access control (DB-stored org roles + client-check caveat):
  https://better-auth.com/docs/plugins/organization
- Payload CMS access control (per-collection/field access functions — the model we
  intentionally do NOT adopt; also doc-level via query constraints):
  https://payloadcms.com/docs/access-control/overview
- CASL (claim-based arbitrary subjects; serializable rules → persisted permissions):
  https://casl.js.org / https://github.com/stalniy/casl
- Directus v11 policies (additive DB-stored policies, junction table, recursive role
  resolution): https://directus.io/blog/v11-release-notes

## Code references

- Master `hasPermission` signature: `agents/packages/core/src/access/hasPermission.ts` —
  `{access, user, userRoles, resource, action, data?, organization?, fields?, throwOnDenied?}`
  → `boolean | Record<string, boolean>`.
- Master merge semantics: OR across roles, allow-wins-over-deny
  (hasPermission.test.ts:1004–1145). Unknown roles filtered; empty roles = deny
  (test.ts:675–681, 1147–1172). Missing access config = allow-all (test.ts:643–651).
- Rebuild stub type mechanism: `apps/www/src/auth/permissions.ts:16-34` —
  `Permissions` map keyed by subject with `{action, dataType}`; generalizes to arbitrary
  subjects.
- Client sanitization: `packages/core/src/config/sanitizeConfig.ts` (rebuild) strips
  functions; master stripped `access` entirely.

## Open questions

1. Default posture for undeclared subject/action per role: keep master's permissive default,
   or add `defaults: "allow" | "deny"` on `defineAccess`?
2. Draft actions: confirm the auto-added action set (`readDrafts`, `saveDraft`, `publish`,
   `unpublish`) once Spec 36 lands its verbs.
3. Org support: carry master's with/without-org overload pair forward as-is, or defer until
   an org-using app exists in the rebuild?
4. Snapshot shape for admin UI (`resolvePermissionSnapshot`): per-subject-action
   `true | false | "conditional"` — needs a spec when admin enforcement is wired.
