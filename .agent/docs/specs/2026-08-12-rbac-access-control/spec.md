---
status: in-progress
spec_id: 2026-08-12-rbac-access-control
touches:
  - "packages/core/src/access/**"
  - "packages/core/src/config/{types,config,sanitizeConfig}.ts"
  - "packages/core/src/api/**"
  - "packages/core/src/media/api/**"
  - "packages/core/src/index.ts"
  - "packages/better-auth/src/convex/getAuth.ts"
  - "packages/next/src/NextAdminPage.tsx"
  - "packages/react/src/components/{AdminSidebar,AdminTopNav}.tsx"
  - "packages/react/src/components/views/**"
  - "packages/react/src/context/**"
  - "apps/www/src/auth/access.ts"
  - "apps/www/src/vex.config.ts"
  - "apps/www/convex/vex.ts"
  - "apps/www/convex/vex/**"
prompt_version: 1
---

# 2026-08-12-rbac-access-control — Spec

## Overview

Reimplements RBAC from scratch for the rebuild (no master merge planned; rebuild will be
promoted). New `packages/core/src/access/` module: roles x subjects x actions permission
matrix authored as one typed constant, checked at runtime by a pure, synchronous
`hasPermission({...}) => boolean`. Unlike master, every checkable thing is a
_subject_: collections and globals (CRUD + draft actions), the core-provided `adminPanel`
subject, and arbitrary user-declared `customResources` with their own action unions.
Enforcement lands once, in the server API factories (`collectionsApi` / `globalsApi` / media)
via an optional server-resolved `getAuth` seam. Design rationale and variant comparison:
`.agent/docs/research/rbac-v2-design.md`.

## Code Effect Preview

### defineAccess — one typed constant, arbitrary subjects beside collections

```ts
// Before — app-level stub, users only, no framework integration (DELETED by this spec)
// apps/www/src/auth/permissions.ts
const ROLES = { admin: { [TABLE_SLUG_USERS]: { create: true, ... } } } as const satisfies RolesWithPermissions

// After — apps/www/src/vexcms/access.ts, wired into vex.config.ts
export const access = defineAccess({
  roles: [USER_ROLES.admin, USER_ROLES.user],
  resources: [pages, headers, footers, themes, siteSettings, nav, { slug: TABLE_SLUG_USERS }],
  customResources: {
    seedData: { actions: ["reset"] },          // arbitrary non-collection subject
    // reviews: { actions: ["approve"], data: dataType<{ queue: string }>() },
  },
  userCollectionSlug: TABLE_SLUG_USERS,
  userRolesField: "roles",                     // field on the user doc holding string | string[]
  defaultPermissionMode: PERMISSION_MODES.allow,   // optional — this is already the default
  permissions: {
    admin: { "*": true },
    user: {
      adminPanel: { access: true, impersonate: false },   // core built-in subject
      [TABLE_SLUG_USERS]: {
        "*": false,                                       // action-level wildcard: deny…
        read: ({ data, user }) => user._id === data._id,  // …except these (registry-typed data)
        update: ({ data, user }) => user._id === data._id,
      },
      seedData: false,
    },
  },
})
```

Wildcards compose at two levels — role (`admin: { "*": true }`, boolean only) and action
(`pages: { "*": true, delete: cb }`, any `PermissionCheck` incl. callbacks). Precedence:
explicit action > subject `"*"` > role `"*"` > `defaultPermissionMode`.

### hasPermission — one call shape for collections, globals, admin panel, custom gates

```ts
// Before (master) — separate checkAdminAccess() + user AND userRoles both required
checkAdminAccess({ access, user, userRoles });

// After — everything is a subject; roles ride the user document (access.userRolesField)
hasPermission({ access, user, resource: "pages", action: "update" }); // boolean
hasPermission({ access, user, resource: "adminPanel", action: "access" }); // boolean
hasPermission({ access, user, resource: "seedData", action: "reset" }); // boolean
hasPermission({ access, user, resource: "pages", action: "publish" }); // draft action (versions.drafts)
hasPermission({
  access,
  user,
  resource: "user",
  action: "update",
  fields: ["name", "email"],
}); // → { name: boolean, email: boolean }
hasPermission({
  access,
  user,
  resource: "pages",
  action: "delete",
  data: page,
  throwOnDenied: true,
}); // throws VexAccessError on deny

// App-level wrappers (www, not core): fetch the current session when user is omitted
await hasServerPermission({ resource: "pages", action: "update" }); // server helper
useHasPermission({ resource: "adminPanel", action: "access" }); // client hook
```

### Server factories — enforcement lands once, via the getAuth seam

```ts
// Before — apps/www/convex/vex.ts: no access control anywhere
export const { find, get, search } = queryApi(config, query);

// After — one unified factory with the getAuth seam; identity resolved server-side
import { createGetAuth } from "@vexcms/better-auth";
const getAuth = createGetAuth({
  userCollectionSlug,
  orgCollectionSlug,
  sessionCollectionSlug,
  resolveOrgs: true,
});
export const { find, get, search, create, update, remove } = collectionsApi({
  config,
  query,
  mutation,
  getAuth,
});
export const {
  get: globalGet,
  find: globalFind,
  upsert,
} = globalsApi({
  config,
  query,
  mutation,
  getAuth,
});
// writes throw VexAccessError on deny; single-doc reads return null; lists filter denied docs
```

### Client boundary — access never ships to the browser

```ts
// sanitizeConfigForClient(config) → ClientVexConfig has NO access key
// (callbacks don't serialize; permission rules are not client data)
```

## API Surface

| Import                | Symbol                                                                                           | Signature                                                                                                                             | Purpose                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `@vexcms/core`        | `defineAccess`                                                                                   | `(props: VexAccessConfigInput<TRoles, TResources, TCustom, TUserSlug, TOrgSlug>) => VexAccessConfig<SubjectMap<TResources, TCustom>>` | Build the typed access config constant                                                          |
| `@vexcms/core`        | `hasPermission`                                                                                  | `(props: { access?, user, organization?, resource, action, data?, mode?, throwOnDenied? }) => boolean`                                | Pure sync check → boolean; roles from `access.userRolesField`; `mode: "action" \| "capability"` |
| `@vexcms/core`        | `dataType`                                                                                       | `<T>() => DataTypeCarrier<T>`                                                                                                         | Phantom data-type carrier for `customResources`                                                 |
| `@vexcms/core`        | `CRUD_ACTIONS` / `DRAFT_ACTIONS` / `PERMISSION_MODES` / `WILDCARD_KEY` / `ADMIN_CUSTOM_SUBJECTS` | `as const` maps + `"*"`                                                                                                               | Access constants; all module types derive from these                                            |
| `@vexcms/core`        | `VexAccessError`                                                                                 | `new (message, { resource, action, field? })`                                                                                         | Thrown by `throwOnDenied`; structured denial context                                            |
| `@vexcms/core`        | `VexAccessConfigError`                                                                           | `new (message)`                                                                                                                       | Thrown by `defineAccess` on hard config errors                                                  |
| `@vexcms/core/server` | `collectionsApi` / `globalsApi`                                                                  | `({ config, query, mutation, getAuth })`                                                                                              | Unified factories; server-resolved enforcement seam                                             |
| `@vexcms/core/server` | `resolveGetAuth` / `VexApiAuth`                                                                  | `({ ctx, config, getAuth }) => Promise<VexApiAuth \| undefined>` / `{ user: … \| null; organization? }`                               | Auth resolution; `user: null` = unauthenticated → deny                                          |
| `@vexcms/better-auth` | `createGetAuth`                                                                                  | `({ userCollectionSlug, orgCollectionSlug, sessionCollectionSlug, resolveOrgs? }) => getAuth`                                         | Better-auth `getAuth` resolver (user + active org)                                              |

`resolvePermissionCheck`, `mergeRolePermissions`, and `resolveActionCheck` are module-private
helpers inside `hasPermission.ts` — `hasPermission` is the only runtime entry point.

## Progress Checklist

- [x] Step 1 — Access constants + types + errors (`access/constants.ts`, `access/types.ts`)
- [x] Step 2 — `defineAccess` builder + tests (`access/config.ts`)
- [x] Step 3 — `hasPermission` resolver + tests (`access/hasPermission.ts`, `access/index.ts`)
- [x] Step 4 — Config integration + public exports (`defineConfig`-time access validation still open — see Step 4 / Step 10)
- [x] Step 5 — Server API enforcement (`collectionsApi` + `globalsApi` + media factories, `resolveGetAuth`, `me`, nullable `user`)
- [x] Step 6 — www wiring (`@vexcms/better-auth` `createGetAuth`, `convex/vex.ts`, token through `NextAdminPage`)
- [ ] Step 7 — Capability mode in `hasPermission` (`mode: "action" | "capability"`)
- [ ] Step 8 — Client permission context (`VexAccessProvider`/`useVexAuth`/`usePermission` → sidebar/nav)
- [ ] Step 9 — View-level action enforcement (create/save/delete buttons, readonly inputs)
- [ ] Step 10 — Cleanup: drop field-mode objects, `get`/`getGlobal` null-on-deny, `defineConfig`-time validation
- [ ] Step 11 — Comprehensive test plan (all code paths)

## Design Decisions

1. **Variant B — unified subjects.** One vocabulary: `hasPermission({ resource, action })`
   for collections, globals, admin panel, and custom gates alike. Why: one mental model,
   typed action unions per subject, master-parity call ergonomics.
2. **`customResources`, not `custom`.** Declares non-collection subjects — one canonical
   object form: `{ actions: ["create", "revoke"], data?: dataType<T>() }` (no array
   shorthand — one shape, no normalization step). Why: the check site reads `resource:`,
   so declaring them as resources keeps the vocabulary honest.
3. **Typed `data` flows end-to-end.** A `dataType<T>()` carrier on a custom resource types
   both the callback's `data` prop AND the `data` argument `hasPermission` accepts for that
   subject. Why: compile-time proof the caller passes what checks consume.
4. **Callbacks allowed on every subject** (collections, globals, customResources). A callback
   is just one kind of `PermissionCheck`. Why: row-level _logic_ without row-level storage.
5. **`adminPanel` built-in subject replaces master's `adminRoles` + `checkAdminAccess`.**
   Actions: `access`, `impersonate`. Why: adminRoles duplicated what permissions already
   express; one fewer concept.
6. **Draft actions ride the resource subject.** `readDrafts | saveDraft | publish | unpublish`
   auto-added to subjects whose config has `versions.drafts: true` (globals today;
   collections when Spec 36 lands — machinery is forward-compatible). Why: draft gating is
   naturally per-collection; no separate "drafts" concept to configure.
7. **`defaultPermissionMode: PermissionMode`, default `PERMISSION_MODES.allow`.** Reuses the
   same `PERMISSION_MODES` constant used by field-mode objects — no separate `ACCESS_DEFAULTS`
   enum for what is semantically the same allow/deny choice. Master parity by default; deny
   posture opt-in for hardened configs. Undeclared role/subject/action resolves to this.
   Why: a forgotten `dangerZone` declaration shouldn't silently allow — but flipping the
   default would break master-shaped mental models.
8. **Single input type, optional `orgCollectionSlug`.** No with/without-org overload
   pair (master had two). When present, `organization` is typed in every callback; when
   absent it is `never`. No `userOrgField` (master used it only for a dev warning).
   Why: half the generic surface for the same capability.
9. **Multi-role merge: OR, allow wins over deny** — per action and per field. Roles are
   derived from the user document (`access.userRolesField`); a missing/empty/unknown roles
   value denies. `access: undefined` allows everything (system off). Why: master parity on
   merge semantics; its 1272-line test suite ports directly.
10. **Enforcement in the API factories, not generated files.** `collectionsApi`/`globalsApi`/
    media factories take `{ getAuth }`; omitted = behavior unchanged. Why: one seam
    covers every collection and global; master's per-generated-file guards were N copies of
    the same block.
11. **Read filtering is post-query.** Convex cannot push predicates into indexes; `find` is
    limit-based (not `paginationOpts`), so filtering denied docs is safe here. Why: honest
    about the platform; the paginated-admin-list story belongs to the admin enforcement spec.
12. **`access` stripped from the _serialized_ client config.** `sanitizeConfigForClient` drops
    it — callbacks don't serialize and permission rules aren't config data. The admin UI gets
    `access` a different way (Step 8): a direct client-bundle import into `VexAccessProvider`,
    not through the serialized prop. Why: keeps the serialized boundary clean while still
    enabling direct client `hasPermission`.
13. **Config stays one typed constant** imported into `vex.config.ts`. Per-collection/global
    inline `access` is intentionally unsupported. Why: developer preference — single place to
    audit; forces every project into the same auditable layout.
14. **Matrix shape stays serialization-compatible** (callbacks are the only non-data checks).
    Why: keeps the future DB-stored-roles path (`buildAccess(roleDocs)`) additive — same
    evaluator, no rewrite.

15. **Wildcards at two levels, one resolver util.** Role-level `"*": boolean` (covers
    undeclared subjects); action-level `"*": PermissionCheck` inside a per-action map
    (covers undeclared actions on that subject — booleans and callbacks; field-mode
    objects are being dropped, see decision 20), enabling `pages: { "*": true, delete: cb }`.
    Precedence: explicit action >
    subject `"*"` > role `"*"` > `defaultPermissionMode`; wildcards never cross subject boundaries.
    Role-level stays boolean-only because a role-wide callback would receive a union of
    every subject's `data`. Why: "everything except X" is otherwise inexpressible, and the
    whole feature is one module-private util (`resolveActionCheck`), not a new layer.

16. **Roles ride the user document — `userRolesField` (required).** `defineAccess` names
    the field on the user doc holding role(s); `string` and `string[]` both work
    (normalized inside `hasPermission`). No `userRoles` parameter anywhere. Why: roles are
    always on the user object already; a second parameter was redundant state to keep in
    sync.
17. **Core `hasPermission` requires `user`; runtime wrappers live in the app.** Core stays
    pure and synchronous (an auto-fetching core would be async and runtime-aware). The www
    app ships thin wrappers — `hasServerPermission` (server helpers) and `useHasPermission`
    (client hook) — that fetch the current session user + active organization when omitted
    and forward to core. Why: each runtime fetches auth its own way; core shouldn't know any
    of them.
18. **Constants-first, minimal surface.** Every literal (actions, modes, wildcard, built-in
    subjects) lives in `access/constants.ts` as `as const` maps — `PERMISSION_MODES`
    supplies `defaultPermissionMode`, so there is no separate
    "defaults" constant bucket; types derive from the constants, runtime code never inlines
    magic strings. `hasPermission` is the only runtime function exported from
    `hasPermission.ts` — the merge/resolve helpers are module-private.
    Why: project convention (`USER_ROLES`, `ADMIN_FIELDS`), and a smaller public API is
    easier to keep stable.
19. **User/org bindings are plain slugs; document types resolve from the registry.**
    `userCollectionSlug` / `orgCollectionSlug` are strings — the merged user collection
    (auth-adapter fields included) does not exist at `defineAccess` authoring time, so a
    full config can never be passed. Callback `user`/`organization` types come from
    `InferDocTypeFromSlug<TUserSlug>` (registry lookup). `resources` still take full
    configs (draft-action narrowing via `versions.drafts` needs the config type).
    Field-existence validation of `userRolesField` cannot happen in `defineAccess` and
    belongs in `defineConfig` (which sees the merged collections). Generated
    `UserCollectionDocument`/`OrgCollectionDocument` registry types remain deferred —
    an additive future migration.
20. **Field-mode objects dropped — `PermissionCheck = boolean | callback`.** The API is
    whole-document (Convex is a document DB; no field-level API support), so `{ mode: "allow"
| "deny", fields }` objects are removed from `PermissionCheck`/`FieldPermissionResult`
    and from `mergeRolePermissions`. Why: the runtime already collapses to a boolean; the
    mode-object type surface promised granularity the API never delivered. Field-level can
    return later as its own designed feature.
21. **Read-deny returns `null` for single-doc reads.** `get`/`getGlobal` return `null` on a
    denied read (never throw); lists (`find`/`findGlobals`/`search`) filter denied docs.
    Why: composable — the UI treats "no access" like "not found," and a denied read never
    crashes a server render (the globals-preload bug).
22. **Capability mode on `hasPermission` (`mode: "action" | "capability"`, default
    `"action"`).** A data-less check against a _callback_ permission is ambiguous: `"action"`
    throws `VexAccessError` (pass `data` or switch mode — no silent `undefined.x` crash);
    `"capability"` resolves callbacks to `true` (the user is _capable_; per-doc filtering
    happens downstream). Static checks resolve concretely in both modes (explicit `false`
    still denies). Why: subject-level UI visibility ("can this user reach Pages at all")
    needs a doc-independent answer; concrete per-doc checks stay `"action"` mode with `data`.
23. **Admin-UI enforcement is subject-level (capability), not row-count.** Sidebar/nav
    visibility asks "can the user reach this subject" — a visible link may lead to a
    fully-filtered empty list, which is correct. Edit views have the concrete doc, so their
    affordances (readonly inputs, Save) use exact `"action"`-mode checks with `data`. Why:
    "hide link unless ≥1 visible row" would require a per-request scan of every collection —
    expensive and unnecessary; empty-list UX is standard.
24. **The client evaluates `hasPermission` directly — no server snapshot.** `access` reaches
    the client via a **direct client-bundle import** (a `"use client"` module imports
    `~/auth/access` → `VexAccessProvider`; callbacks survive because it's a bundler import, not
    the serialized-config strip), and `user`/`organization` arrive as serializable props from
    the server layout. Both are synchronous at first render → no FOUC, so a server-computed
    boolean snapshot buys nothing (batching N cheap sync calls saves nothing) and is dropped.
    Tradeoff: the permission rules ship in the client bundle — acceptable for _advisory_ UI
    gating (server guards remain the enforcement; CASL et al. do the same), and it requires
    `access` + its imported configs to stay client-safe. A snapshot returns only if a future
    requirement forbids shipping `access` to the client.

## Out of Scope

- Row-level ACL storage (per-document permission _configs_ stored in the DB) — rejected;
  doc-aware callbacks + a userland `acl` field cover it (research doc §row-level).
- DB-stored roles / role-editor tooling (`vex_roles`, `buildAccess`) — future spec; the
  matrix shape stays serialization-compatible so the seam remains.
- Field-level access (per-field read/write) — removed for now (decision 20); the API is
  whole-document. A future feature, not this spec.
- Row-count-aware navigation ("hide a link unless the user has ≥1 visible row") — rejected
  (decision 23); visibility is subject-level capability, empty lists are expected.
- Drafts/versioning enforcement semantics beyond declaring the action unions (Spec 36 owns
  the verbs and storage).
- Impersonation UI and audit logging — future work.
- Migration of master apps — the rebuild replaces master wholesale.

## Implementation

### Step 1 — Access module constants + types + errors [agent]

**Status: implemented and verified** (63 access tests, tsc clean)

Creates `packages/core/src/access/constants.ts` (all literal values live here — no magic
strings anywhere else in the module) and `packages/core/src/access/types.ts` (subject
registry machinery, permission check types, error classes; every literal union derived
from the constants).

- [x] Create `packages/core/src/access/constants.ts` — `CRUD_ACTIONS`, `DRAFT_ACTIONS`,
      `PERMISSION_MODES`, `WILDCARD_KEY`, `ADMIN_CUSTOM_SUBJECTS`
- [x] Create/revise `packages/core/src/access/types.ts` — all types derive from constants;
      `userRolesField` on input + config; fixed `PermissionCallbackProps`; object-only
      `CustomResourceInput`
- [x] JSDoc every exported symbol (TypeDoc-clean, zero warnings)
- [x] Verify: `pnpm --filter @vexcms/core build`

**Implementation notes:**

- **Constants-first (project convention, cf. `USER_ROLES` / `AUTH_ACTIONS` in www and
  `ADMIN_FIELDS` in fields):** `{ key: "key" } as const` maps + types derived via
  `keyof typeof`. Runtime code references `PERMISSION_MODES.allow` / `WILDCARD_KEY` —
  never inline `"allow"` / `"*"` literals. There is no separate `ACCESS_DEFAULTS`
  constant: `defaultPermissionMode` (the undeclared-permission posture, on both
  `VexAccessConfigInput` and `VexAccessConfig`) is itself typed `PermissionMode` and
  derives from `PERMISSION_MODES` — the "posture" concept and the field-mode-object
  "mode" concept share one `allow | deny` vocabulary, so one constant covers both.
- **Registry-based inference:** `InferDocTypeFromSlug<S>` resolves a document type
  directly from a slug literal via `DocumentBySlug` / `GlobalDocumentBySlug`;
  `InferDocType<T>` wraps it for resource configs (`{ slug }` → `ExtractSlug` →
  `InferDocTypeFromSlug`). Field keys come from `ExtractFieldKeys<T>` — the value union
  of `CollectionsFieldTypeMap[slug]` / `GlobalsFieldTypeMap[slug]` — run through
  `FieldKeysOrWide<TKeys>`, a never-collapse guard that widens to `string` when the
  registry lookup produces `never` (the pre-`vex generate` index-signature fallback
  swallows the slug and its value union is empty; without the guard every field-mode
  check would type as `fields: never[]`, permanently unusable pre-generation).
- **User/org bindings are plain slugs, not refs:** `userCollectionSlug` / `orgCollectionSlug`
  are plain strings, not `{ slug }` refs or full configs — the merged user collection
  (auth-adapter fields included) does not exist at `defineAccess` authoring time, so a
  full config can never be passed for it. The slug literal alone drives the
  `InferDocTypeFromSlug` registry lookup that types callback `user`/`organization` props.
  `resources` (collections/globals contributing subjects) still take full `AccessResource`
  configs (`CollectionConfig | GlobalConfig`) — draft-action narrowing via
  `HasDrafts<T>`/`versions.drafts` needs the config type, not just a slug.
- **Structural resource bounds:** `TResources extends readonly AccessResource[]` — real
  `defineCollection()`/`defineGlobal()` results only; the old minimal-`{ slug }`-ref
  shorthand only ever applied to the user/org bindings, which are slugs now, not resources.
- **`userRolesField` (required):** names the field on the user document holding roles
  (`string | string[]`). `hasPermission` derives roles from it — callers never pass roles.
- **Phantom type:** `VexAccessConfig.__subjects?` is optional + never assigned; keeps the
  builder's return cast single (`as VexAccessConfig<…>`), no double cast. `VexAccessConfig`
  takes exactly **one** generic (`TSubjects`) — its JSDoc documents why: the config is
  deliberately VALUE-LEVEL TYPE-ERASED (stored fields are wide; every call-site guarantee
  rides the phantom `TSubjects` parameter). That's what lets any concrete `defineAccess()`
  result assign to the plain `VexAccessConfig` on `VexConfig.access` — permission callbacks
  are contravariant in their `data` parameter, so a fully-generic config type (multiple
  independent type parameters carried into the stored shape) would be unassignable to any
  common supertype.
- **Error classes:** module `types.ts`, extend `Error`, set `name`, carry structured fields
  (mirrors `VexAuthConfigError`, `VexStorageConfigError`).
- `packages/core/src/types/generated.ts` was **not modified** — `DocumentBySlug` /
  `GlobalDocumentBySlug` / `CollectionsFieldTypeMap` / `GlobalsFieldTypeMap` are consumed
  as-is; registry augmentation remains `vex generate`'s job, untouched by this spec.

**Implemented — deviations from original spec:**

- No `ACCESS_DEFAULTS` constant and no `AccessDefaults` type. Collapsed into
  `PERMISSION_MODES` / `PermissionMode` — one `allow | deny` vocabulary for both the
  field-mode object mode and the undeclared-permission posture. The input/output field
  also renamed `defaults` → `defaultPermissionMode`.
- `userCollection: { slug }` / `organizationCollection: { slug }` → `userCollectionSlug:
string` / `orgCollectionSlug?: string`. Plain slugs, not `{ slug }` refs — decision 19
  already called for slug-driven inference; the input properties say so directly instead
  of accepting (and unwrapping) a ref object.
- `VexAccessConfig<TSubjects>` ships with exactly one generic, as designed; the JSDoc adds
  the contravariance rationale for why the stored shape must stay value-level type-erased.

#### `packages/core/src/access/constants.ts` (IMPLEMENTED)

```typescript
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

#### `packages/core/src/access/types.ts` (IMPLEMENTED)

````typescript
import { CollectionConfig } from "../types";
import { GlobalConfig } from "../globals";
import type {
  DocumentBySlug,
  GlobalDocumentBySlug,
  CollectionsFieldTypeMap,
  GlobalsFieldTypeMap,
} from "../types/generated";
import {
  ADMIN_CUSTOM_SUBJECTS,
  WILDCARD_KEY,
  type PermissionMode,
  type CrudAction,
  type DraftAction,
  type AdminCustomSubjectSlug,
} from "./constants";

/**
 * Any config that may contribute a resource subject: a collection or a global.
 * Structural — the slug literal (and `versions.drafts`, when present) is all
 * the type system reads from it.
 */
export type AccessResource = CollectionConfig | GlobalConfig;

/**
 * Single permission check result — boolean shorthand (all/none) or a
 * field-mode object restricting the check to named fields.
 *
 * @typeParam TFieldKeys - Union of valid field keys for this resource.
 */
export type FieldPermissionResult<TFieldKeys extends string> =
  boolean | { mode: PermissionMode; fields: TFieldKeys[] };

/**
 * Resolved field-level permissions — one boolean per requested field.
 * Returned by `hasPermission` when `fields` is passed.
 */
export type ResolvedFieldPermissions = Record<string, boolean>;

/**
 * Props passed to a permission callback.
 *
 * The `data` key exists only for data-carrying subjects; the `organization`
 * key exists only when `orgCollectionSlug` is configured. Built with
 * intersections (not conditional property types) so the keys are truly
 * absent — not present-but-`never` — when unavailable.
 *
 * @typeParam TData - Document type for the subject; `never` when the subject has no data.
 * @typeParam TUser - User document shape (registry lookup on the user collection slug).
 * @typeParam TOrg - Organization document shape; `never` when not configured.
 */
export type PermissionCallbackProps<
  TData = unknown,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
> = {
  user: TUser;
} & ([TData] extends [never] ? unknown : { data: TData }) &
  ([TOrg] extends [never] ? unknown : { organization: TOrg });

/**
 * A single permission check — static boolean, field-mode object, or callback.
 *
 * A callback returning `undefined` is treated as deny.
 *
 * @typeParam TData - Document type for the subject.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape; `never` if not configured.
 * @typeParam TFieldKeys - Union of valid field keys for this subject.
 */
export type PermissionCheck<
  TData = unknown,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
  TFieldKeys extends string = string,
> =
  | FieldPermissionResult<TFieldKeys>
  | ((
      props: PermissionCallbackProps<TData, TUser, TOrg>,
    ) => FieldPermissionResult<TFieldKeys> | undefined);

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
}

// ── Inference helpers (registry-based via GeneratedVexTypes augmentation) ──

/** Extract the slug literal from a resource config. @internal */
type ExtractSlug<T> = T extends { slug: infer S extends string } ? S : never;

/**
 * Document type for a slug via the generated registry (collections, then
 * globals; wide fallback pre-generation). @internal
 */
type InferDocTypeFromSlug<S extends string> = S extends keyof DocumentBySlug
  ? DocumentBySlug[S]
  : S extends keyof GlobalDocumentBySlug
    ? GlobalDocumentBySlug[S]
    : Record<string, unknown>;

/**
 * Document type for a resource config via its slug literal. @internal
 */
type InferDocType<T> = T extends { slug: infer S extends string }
  ? InferDocTypeFromSlug<S>
  : Record<string, unknown>;

/**
 * Widens a field-key union to `string` when the registry lookup collapsed to
 * `never` — happens when an index-signature fallback (pre-`vex generate`)
 * swallows the slug and its value union is empty. @internal
 */
type FieldKeysOrWide<TKeys> = [TKeys] extends [never] ? string : TKeys & string;

/**
 * Union of all field keys for a resource slug via the generated field-type
 * maps (wide `string` fallback pre-generation). @internal
 */
type ExtractFieldKeys<T> = T extends { slug: infer S extends string }
  ? S extends keyof CollectionsFieldTypeMap
    ? FieldKeysOrWide<
        CollectionsFieldTypeMap[S][keyof CollectionsFieldTypeMap[S]]
      >
    : S extends keyof GlobalsFieldTypeMap
      ? FieldKeysOrWide<GlobalsFieldTypeMap[S][keyof GlobalsFieldTypeMap[S]]>
      : string
  : string;

/** True when a resource config declares `versions.drafts: true`. @internal */
type HasDrafts<T> = T extends {
  versions?: { drafts?: infer D extends boolean };
}
  ? D extends true
    ? true
    : false
  : false;

/**
 * The complete subject registry: resources (keyed by slug, CRUD + conditional
 * draft actions), custom resources, and the core built-in subjects from
 * {@link ADMIN_CUSTOM_SUBJECTS}.
 *
 * @typeParam TResources - Structural resource tuple (`{ slug, versions? }`).
 * @typeParam TCustom - Custom resource declarations.
 */
export type SubjectMap<
  TResources extends readonly AccessResource[],
  TCustom extends Record<string, CustomResourceInput>,
> = {
  [R in TResources[number] as ExtractSlug<R>]: {
    action: CrudAction | (HasDrafts<R> extends true ? DraftAction : never);
    data: InferDocType<R>;
    fields: ExtractFieldKeys<R>;
  };
} & {
  [K in keyof TCustom]: {
    action: TCustom[K]["actions"][number];
    data: TCustom[K]["data"] extends DataTypeCarrier<infer D> ? D : never;
    fields: never;
  };
} & {
  [K in AdminCustomSubjectSlug]: {
    action: (typeof ADMIN_CUSTOM_SUBJECTS)[K]["actions"][number];
    data: never;
    fields: never;
  };
};

/**
 * Phantom carrier for a custom resource's `data` type. Created by
 * {@link dataType}; never inspected at runtime.
 */
export interface DataTypeCarrier<T = never> {
  readonly __phantom?: T;
}

/**
 * Declares the data type callbacks (and `hasPermission` callers) receive for a
 * custom resource.
 *
 * @example
 * ```ts
 * customResources: {
 *   reviews: { actions: ["approve", "reject"], data: dataType<{ queue: string }>() },
 * }
 * ```
 * @returns a plain object '{}'
 */
export function dataType<T>(): DataTypeCarrier<T> {
  return {};
}

/**
 * A custom (non-collection) subject declaration: its action list and an
 * optional typed data carrier. One canonical form — no array shorthand.
 */
export type CustomResourceInput = {
  actions: readonly string[];
  data?: DataTypeCarrier<unknown>;
};

/**
 * Per-role permission matrix, typed against the resolved {@link SubjectMap}.
 *
 * Each subject key accepts `boolean` (all actions) or a per-action map whose
 * keys are that subject's action union plus the action-level wildcard
 * ({@link WILDCARD_KEY}) — each value a full {@link PermissionCheck}.
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
        [A in TSubjects[S]["action"]]?: PermissionCheck<
          TSubjects[S]["data"],
          TUser,
          TOrg,
          TSubjects[S]["fields"]
        >;
      } & {
        [W in typeof WILDCARD_KEY]?: PermissionCheck<
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

/**
 * Input shape for the `defineAccess` builder.
 *
 * @typeParam TRoles - Tuple of role name literals.
 * @typeParam TResources - Structural resource tuple (`{ slug, versions? }`).
 * @typeParam TCustom - Custom resource declarations.
 * @typeParam TUserCollection - `{ slug }` shape naming the user collection.
 * @typeParam TOrgCollection - `{ slug }` shape naming the org collection; `undefined` if absent.
 *
 * @see {@link VexAccessConfig} for the resolved runtime shape.
 */
export interface VexAccessConfigInput<
  TRoles extends readonly string[],
  TResources extends readonly AccessResource[] = readonly AccessResource[],
  TCustom extends Record<string, CustomResourceInput> = {},
  TUserSlug extends string = string,
  TOrgSlug extends string | undefined = undefined,
> {
  /** Role identifiers; keys of the `permissions` matrix. */
  roles: TRoles;

  /** Collections/globals contributing subjects, keyed by slug. */
  resources: TResources;

  /**
   * Custom, non-resource subjects with arbitrary action unions and optional
   * typed data. Example: `{ apiKeys: { actions: ["create", "revoke"] } }`.
   */
  customResources?: TCustom;

  /**
   * Slug of the collection whose documents are `user` in callbacks. A plain
   * slug string — the full collection often does not exist at authoring time
   * (auth-adapter collections merge later, inside `defineConfig`); the
   * document type resolves from the generated registry by slug.
   */
  userCollectionSlug: TUserSlug;

  /**
   * REQUIRED. The field on the user document that holds the user's role(s).
   * Value may be `string` or `string[]`; `hasPermission` normalizes both.
   * Callers never pass roles separately — they always ride the user document.
   */
  userRolesField: string;

  /**
   * Slug of the organization collection. When present, `organization` is
   * available (typed via the registry) in every permission callback; when
   * omitted, callbacks have no `organization` key.
   */
  orgCollectionSlug?: TOrgSlug;

  /**
   * Posture for undeclared role/subject/action combinations.
   * @defaultValue `PERMISSION_MODES.allow`
   */
  defaultPermissionMode?: PermissionMode;

  /**
   * Permission matrix: role → subject → check. See {@link RolePermissions}
   * for shapes and wildcard semantics.
   */
  permissions: Record<
    TRoles[number],
    RolePermissions<
      SubjectMap<TResources, TCustom>,
      InferDocTypeFromSlug<TUserSlug>,
      TOrgSlug extends string ? InferDocTypeFromSlug<TOrgSlug> : never
    >
  >;
}

/**
 * Resolved access configuration returned by `defineAccess` — the runtime
 * shape consumed by `hasPermission`.
 *
 * Deliberately VALUE-LEVEL TYPE-ERASED: every call-site guarantee
 * (`resource`/`action` unions, callback `data` types, field keys) rides the
 * phantom `TSubjects` parameter, while the stored fields are wide. This is
 * what lets any concrete config assign to plain `VexAccessConfig` (e.g. the
 * `access` field on `VexConfig`) — a fully-generic config type would be
 * unassignable to any common supertype, because permission callbacks are
 * contravariant in their `data` parameter.
 *
 * @typeParam TSubjects - Phantom {@link SubjectMap} carried for `hasPermission` inference.
 */
export interface VexAccessConfig<
  TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>,
> {
  /** Role names known to the system. */
  roles: readonly string[];

  /** Undeclared-permission posture. */
  defaultPermissionMode: PermissionMode;

  /** Slug of the user collection. */
  userCollectionSlug: string;

  /** Field on the user document holding role(s) (`string | string[]`). */
  userRolesField: string;

  /** Slug of the organization collection, when configured. */
  orgCollectionSlug?: string;

  /**
   * The permission matrix as authored (checks may be booleans, field-mode
   * objects, or callbacks). Type-erased for storage; `defineAccess` fully
   * type-checks it at authoring time.
   */
  permissions: Record<string, Record<string, unknown>>;

  /**
   * Phantom field carrying {@link SubjectMap} for inference. Optional and
   * never assigned at runtime.
   */
  readonly __subjects?: TSubjects;
}

/**
 * Thrown by `hasPermission` when `throwOnDenied: true` and access is denied.
 * Carries the subject, action, and (for field checks) the first denied field.
 */
export class VexAccessError extends Error {
  /** The subject on which access was denied. */
  resource: string;

  /** The denied action. */
  action: string;

  /** First denied field (field checks only). */
  field?: string;

  /**
   * @param message — Human-readable error message.
   * @param options — Structured denial context.
   * @param options.resource — Subject name.
   * @param options.action — Action name.
   * @param options.field — First denied field, when a `fields` check denied.
   */
  constructor(
    message: string,
    options: { resource: string; action: string; field?: string },
  ) {
    super(message);
    this.name = "VexAccessError";
    this.resource = options.resource;
    this.action = options.action;
    this.field = options.field;
  }
}

/**
 * Thrown by `defineAccess` on hard configuration errors (custom resource key
 * colliding with a resource slug; empty `actions` array).
 */
export class VexAccessConfigError extends Error {
  /** @param message — Human-readable description of the configuration error. */
  constructor(message: string) {
    super(message);
    this.name = "VexAccessConfigError";
  }
}
````

Verify: `pnpm --filter @vexcms/core build` — clean, zero TypeDoc warnings.

### Step 2 — defineAccess builder + tests [dev]

**Status: implemented and verified** (63 access tests, tsc clean)

- [x] `packages/core/src/access/config.ts` (NEW)
- [x] `packages/core/src/access/config.test.ts` (NEW)

`defineAccess` mirrors `defineCollection` (`collections/config.ts`) and `defineGlobal`
(`globals/config.ts`) — builder pattern with input validation, dev warnings via
`console.warn`. Unlike master's `defineAccess`, there is **no org / no-org
overload pair** — Variant B is a single input type; `orgCollectionSlug` is just an
optional field (ratified decision, do not reopen). `TUserSlug` and `TOrgSlug` are plain
slug-literal type parameters (not `{ slug }` shapes); their document types resolve via
`InferDocTypeFromSlug`, which looks them up in the generated registry and falls back to
`Record<string, unknown>` pre-generation.

`TRoles` / `TResources` / `TCustom` are **`const` type parameters** (as on master's
`defineAccess`). Without `const`, an inline literal like `{ slug: "posts" }` in the
`resources` array infers as `{ slug: string }` — the literal widens, the `SubjectMap`
key collapses, and typing silently degrades. `const` preserves literals with no
`as const` at the call site. Full `defineCollection()`/`defineGlobal()` results are
unaffected either way (their types already carry the slug literal). `resources` only
accepts real `AccessResource` configs now — the minimal `{ slug }` shorthand moved to
the user/org bindings, which are plain slug strings (`userCollectionSlug`,
`orgCollectionSlug`), not resources.

Validation is limited to the config's own shape: `userCollectionSlug` and
`userRolesField` must be non-empty; a `customResources` key colliding with a resource
slug or declaring an empty `actions` array throws. **Field-existence validation of
`userRolesField`** (does the named field actually exist on the user collection, and is
it a text/array-typed field?) **cannot happen here** — the merged user collection
(auth-adapter fields included) doesn't exist until `defineConfig` assembles it. That
check is a Step 4 leftover: `defineConfig` sees the fully merged collections and is
where it belongs.

#### `packages/core/src/access/config.ts` (IMPLEMENTED)

````ts
import {
  PERMISSION_MODES,
  ADMIN_CUSTOM_SUBJECTS,
  WILDCARD_KEY,
} from "./constants";
import {
  VexAccessConfigError,
  type AccessResource,
  type CustomResourceInput,
  type SubjectMap,
  type VexAccessConfig,
  type VexAccessConfigInput,
} from "./types";

/**
 * Defines the RBAC configuration for a VexCMS project.
 *
 * Builder in the `defineCollection`/`defineGlobal` family: infers the
 * per-subject action/data/field registry (`SubjectMap`) from `resources` and
 * `customResources` so `hasPermission()` calls against the returned config are
 * fully typed; validates the matrix in dev; returns a frozen `VexAccessConfig`
 * for `defineConfig({ access })`.
 *
 * @typeParam TRoles - Tuple of role name literals.
 * @typeParam TResources - Tuple of collection/global configs contributing subjects.
 * @typeParam TCustom - Custom subject declarations (`{ actions, data? }`).
 * @typeParam TUserSlug - Slug literal of the user collection; drives the callback
 *   `user` type via the generated registry.
 * @typeParam TOrgSlug - Slug literal of the organization collection, when
 *   multi-tenant. Presence gates the `organization` callback key; `undefined`
 *   when single-tenant.
 * @param props - The access configuration.
 * @param props.roles - All role names the matrix may reference.
 * @param props.resources - Collections/globals to expose as subjects, keyed by slug.
 * @param props.customResources - Non-resource subjects, keyed by name.
 * @param props.userCollectionSlug - Slug of the collection whose documents are
 *   `user` in callbacks. A plain string — the merged user collection
 *   (auth-adapter fields included) does not exist yet at authoring time; the
 *   document type resolves from the generated registry by slug.
 * @param props.userRolesField - Field on the user document holding role(s)
 *   (`string` or `string[]` value); `hasPermission` reads roles from it.
 * @param props.orgCollectionSlug - Optional org collection slug enabling
 *   org-scoped callbacks.
 * @param props.defaultPermissionMode - Undeclared-permission posture; defaults to
 *   `PERMISSION_MODES.allow`.
 * @param props.permissions - Role → subject → check matrix (see `RolePermissions`).
 * @returns Frozen `VexAccessConfig` carrying the `SubjectMap` phantom for inference.
 * @throws {VexAccessConfigError} When `userCollectionSlug` or `userRolesField` is
 *   empty, when a `customResources` key collides with a resource slug, or when a
 *   `customResources` entry declares an empty `actions` array.
 *
 * @example
 * ```ts
 * export const access = defineAccess({
 *   roles: ["admin", "editor"],
 *   resources: [pages, users],
 *   customResources: { apiKeys: { actions: ["create", "revoke"] } },
 *   userCollectionSlug: "users",
 *   userRolesField: "roles",
 *   permissions: {
 *     admin: { [WILDCARD_KEY]: true },
 *     editor: { pages: { read: true, update: true }, apiKeys: false },
 *   },
 * });
 * ```
 *
 * @see {@link VexAccessConfigInput} for the input type
 * @see {@link VexAccessConfig} for the resolved return type
 */
export function defineAccess<
  const TRoles extends readonly string[],
  const TResources extends readonly AccessResource[],
  const TCustom extends Record<string, CustomResourceInput> = {},
  const TUserSlug extends string = string,
  const TOrgSlug extends string | undefined = undefined,
>(
  props: VexAccessConfigInput<TRoles, TResources, TCustom, TUserSlug, TOrgSlug>,
): VexAccessConfig<SubjectMap<TResources, TCustom>> {
  // Hard errors — always run, regardless of NODE_ENV. The user collection
  // itself cannot be validated here (auth-adapter fields merge later, inside
  // `defineConfig`), so validation is limited to the config's own shape.
  if (props.userCollectionSlug.length === 0) {
    throw new VexAccessConfigError(`userCollectionSlug must not be empty`);
  }
  if (props.userRolesField.length === 0) {
    throw new VexAccessConfigError(`userRolesField must not be empty`);
  }

  const resourceSlugs = new Set<string>(
    props.resources.map((resource) => resource.slug),
  );
  for (const [key, customResource] of Object.entries(
    props.customResources ?? {},
  )) {
    if (resourceSlugs.has(key)) {
      throw new VexAccessConfigError(
        `customResources "${key}" collides with a resource slug`,
      );
    }
    if (customResource.actions.length === 0) {
      throw new VexAccessConfigError(
        `customResources "${key}" must declare at least one action`,
      );
    }
  }

  // Dev-only validation warnings — a typo'd role or subject would otherwise
  // silently resolve via `defaultPermissionMode` at runtime.
  if (process.env.NODE_ENV !== "production") {
    const knownSubjects = new Set<string>([
      ...resourceSlugs,
      ...Object.keys(props.customResources ?? {}),
      ...Object.keys(ADMIN_CUSTOM_SUBJECTS),
    ]);
    const roleSet = new Set<string>(props.roles);
    for (const [role, subjects] of Object.entries(props.permissions)) {
      if (!roleSet.has(role)) {
        console.warn(`permission role "${role}" not in roles array`);
        continue;
      }
      for (const subjectKey of Object.keys(
        subjects as Record<string, unknown>,
      )) {
        if (subjectKey !== WILDCARD_KEY && !knownSubjects.has(subjectKey)) {
          console.warn(
            `permission subject "${subjectKey}" not found in resources, customResources, or adminPanel`,
          );
        }
      }
    }
    if (
      props.orgCollectionSlug !== undefined &&
      props.orgCollectionSlug.length === 0
    ) {
      console.warn(`orgCollectionSlug must not be empty`);
    }
  }

  return Object.freeze({
    roles: props.roles,
    defaultPermissionMode:
      props.defaultPermissionMode ?? PERMISSION_MODES.allow,
    userCollectionSlug: props.userCollectionSlug,
    userRolesField: props.userRolesField,
    orgCollectionSlug: props.orgCollectionSlug,
    permissions: props.permissions,
  });
}
````

#### `packages/core/src/access/config.test.ts` (IMPLEMENTED)

```ts
import { describe, expect, it, vi } from "vitest";
import { defineCollection, text } from "../index";
import { PERMISSION_MODES, WILDCARD_KEY } from "./constants";
import { defineAccess } from "./config";
import { VexAccessConfigError } from "./types";

function withNodeEnv<T>(env: string, run: () => T): T {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = env;
  try {
    return run();
  } finally {
    process.env.NODE_ENV = original;
  }
}

const posts = defineCollection({
  slug: "posts",
  fields: { title: text({ required: true }) },
});

// `roles` / `accountRoles` are text fields — defineAccess validates that
// `userRolesField` exists on the user collection and is a text/array field.
const users = defineCollection({
  slug: "users",
  fields: {
    name: text({ required: true }),
    roles: text(),
    accountRoles: text(),
  },
});

/** Shared valid base — spread into calls, override per test. */
const baseInput = {
  roles: ["admin"] as const,
  resources: [users],
  userCollectionSlug: "users",
  userRolesField: "roles",
} as const;

describe("defineAccess — runtime passthrough", () => {
  it("passes the permissions matrix through unchanged", () => {
    const permissions = {
      admin: { [WILDCARD_KEY]: true },
      editor: {
        posts: { create: true, read: true, update: true, delete: false },
      },
    };
    const access = defineAccess({
      ...baseInput,
      roles: ["admin", "editor"] as const,
      resources: [posts, users],
      permissions,
    });
    expect(access.roles).toEqual(["admin", "editor"]);
    expect(access.userCollectionSlug).toBe("users");
    expect(access.userRolesField).toBe("roles");
    expect(access.permissions).toEqual(permissions);
    expect(access.orgCollectionSlug).toBeUndefined();
  });

  it("throws when userCollectionSlug is empty", () => {
    expect(() =>
      defineAccess({
        ...baseInput,
        userCollectionSlug: "",
        permissions: { admin: { [WILDCARD_KEY]: true } },
      }),
    ).toThrow(VexAccessConfigError);
  });

  it("stores the org collection slug when provided", () => {
    const access = defineAccess({
      ...baseInput,
      orgCollectionSlug: "organizations",
      permissions: { admin: { [WILDCARD_KEY]: true } },
    });
    expect(access.orgCollectionSlug).toBe("organizations");
  });
});

describe("defineAccess — defaults", () => {
  it("falls back to allow when defaults is omitted", () => {
    const access = defineAccess({
      ...baseInput,
      permissions: { admin: { [WILDCARD_KEY]: true } },
    });
    expect(access.defaultPermissionMode).toBe(PERMISSION_MODES.allow);
  });

  it("passes through an explicit deny default", () => {
    const access = defineAccess({
      ...baseInput,
      defaultPermissionMode: PERMISSION_MODES.deny,
      permissions: { admin: { [WILDCARD_KEY]: true } },
    });
    expect(access.defaultPermissionMode).toBe(PERMISSION_MODES.deny);
  });
});

describe("defineAccess — userRolesField", () => {
  it("stores the userRolesField on the resolved config", () => {
    const access = defineAccess({
      ...baseInput,
      userRolesField: "accountRoles",
      permissions: { admin: { [WILDCARD_KEY]: true } },
    });
    expect(access.userRolesField).toBe("accountRoles");
  });

  it("rejects an empty userRolesField with VexAccessConfigError", () => {
    expect(() =>
      defineAccess({
        ...baseInput,
        userRolesField: "",
        permissions: { admin: { [WILDCARD_KEY]: true } },
      }),
    ).toThrow(VexAccessConfigError);
  });
});

describe("defineAccess — customResources", () => {
  it("does not warn when referencing a declared custom resource", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("development", () => {
      defineAccess({
        ...baseInput,
        customResources: { apiKeys: { actions: ["create", "revoke"] } },
        permissions: { admin: { apiKeys: { create: true } } },
      });
    });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("rejects an empty actions array with VexAccessConfigError", () => {
    expect(() =>
      defineAccess({
        ...baseInput,
        customResources: { apiKeys: { actions: [] } },
        permissions: { admin: { [WILDCARD_KEY]: true } },
      }),
    ).toThrow(VexAccessConfigError);
  });

  it("rejects a customResources key that collides with a resource slug", () => {
    expect(() =>
      defineAccess({
        ...baseInput,
        customResources: { users: { actions: ["create"] } },
        permissions: { admin: { [WILDCARD_KEY]: true } },
      }),
    ).toThrow(VexAccessConfigError);
  });
});

describe("defineAccess — dev-mode warnings", () => {
  it("warns when a permission role key is not in roles", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("development", () => {
      defineAccess({
        ...baseInput,
        permissions: {
          admin: { [WILDCARD_KEY]: true },
          superuser: { [WILDCARD_KEY]: true },
        } as never,
      });
    });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("superuser"));
    warnSpy.mockRestore();
  });

  it("warns when a permission subject key is unknown", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("development", () => {
      defineAccess({
        ...baseInput,
        permissions: { admin: { nonexistent: true } } as never,
      });
    });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("nonexistent"),
    );
    warnSpy.mockRestore();
  });

  it("does not warn on the reserved adminPanel or wildcard subject keys", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("development", () => {
      defineAccess({
        ...baseInput,
        permissions: {
          admin: {
            adminPanel: { access: true, impersonate: false },
            [WILDCARD_KEY]: true,
          },
        },
      });
    });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("warns exactly once when orgCollectionSlug is empty", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("development", () => {
      defineAccess({
        ...baseInput,
        roles: ["admin", "editor"] as const,
        orgCollectionSlug: "",
        permissions: {
          admin: { [WILDCARD_KEY]: true },
          editor: { [WILDCARD_KEY]: true },
        },
      });
    });
    const orgWarnings = warnSpy.mock.calls.filter(([msg]) =>
      String(msg).includes("orgCollectionSlug"),
    );
    expect(orgWarnings).toHaveLength(1); // once total — not once per role
    warnSpy.mockRestore();
  });

  it("does not warn in production even for unknown roles or subjects", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("production", () => {
      defineAccess({
        ...baseInput,
        permissions: {
          admin: { nonexistent: true },
          superuser: { [WILDCARD_KEY]: true },
        } as never,
      });
    });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("defineAccess — type-level", () => {
  it("rejects an unknown role key in permissions", () => {
    defineAccess({
      ...baseInput,
      roles: ["admin"] as const,
      resources: [posts, users],
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        // @ts-expect-error — "superuser" is not in `roles`
        superuser: { [WILDCARD_KEY]: true },
      },
    });
  });

  it("rejects an unknown action for a resource subject", () => {
    defineAccess({
      ...baseInput,
      resources: [posts, users],
      permissions: {
        admin: {
          // @ts-expect-error — "publish" requires versions.drafts on the resource
          posts: { publish: true },
        },
      },
    });
  });

  it("rejects a field-mode object on a custom resource", () => {
    defineAccess({
      ...baseInput,
      resources: [posts, users],
      customResources: { apiKeys: { actions: ["create", "revoke"] } },
      permissions: {
        admin: {
          // @ts-expect-error — custom resource subjects have `fields: never`, no field-mode object
          apiKeys: { mode: "allow", fields: ["create"] },
        },
      },
    });
  });
});
```

Verify: `pnpm --filter @vexcms/core test -- access/config` — 18 tests, all green.

### Step 3 — hasPermission resolver + tests [dev]

**Status: implemented and verified** (63 access tests, tsc clean)

`packages/core/src/access/hasPermission.ts` is the single runtime entry point — every
server API guard (Step 5), admin panel gate, and custom-subject check calls it; the
resolution helpers (`resolvePermissionCheck`, `mergeRolePermissions`, `resolveActionCheck`)
are module-private and exercised only through `hasPermission`'s tests.
`packages/core/src/access/hasPermission.test.ts` is the full test suite (45 tests) — every
resolution branch and the full multi-role merge matrix. `packages/core/src/access/index.ts`
is the barrel.

- [x] Create `packages/core/src/access/hasPermission.ts`
- [x] Create `packages/core/src/access/hasPermission.test.ts`
- [x] Create `packages/core/src/access/index.ts`

#### `packages/core/src/access/hasPermission.ts` (IMPLEMENTED)

````ts
import { PERMISSION_MODES, WILDCARD_KEY } from "./constants";
import { VexAccessError } from "./types";
import type {
  FieldPermissionResult,
  PermissionCallbackProps,
  PermissionCheck,
  ResolvedFieldPermissions,
  SubjectEntry,
  VexAccessConfig,
} from "./types";

/**
 * Resolves runtime role-based access for a single subject + action, merging
 * every role the user holds into one decision.
 *
 * This is the single runtime entry point — every server API guard, admin panel
 * gate, and custom-subject check calls it; the resolution helpers below are
 * module-private. When `fields` is provided, returns a per-field permission
 * map instead of a single boolean.
 *
 * Resolution, per role, first hit wins: subject boolean shorthand → explicit
 * action key → subject-level `WILDCARD_KEY` → role-level `WILDCARD_KEY`
 * (undeclared subjects only) → `defaultPermissionMode`. Roles then OR-merge:
 * any role allowing (per field, when `fields` is given) allows.
 *
 * @param props.access - The resolved config from `defineAccess()`. `undefined`
 *   disables access control entirely — every check passes.
 * @param props.user - The authenticated user document. Roles are derived from
 *   `user[access.userRolesField]` (`string` or `string[]`); a missing or empty
 *   value denies. There is no separate roles parameter.
 * @param props.organization - The organization document forwarded to callbacks.
 *   Only surfaces when `access.orgCollectionSlug` is configured.
 * @param props.resource - Subject name — a resource slug, a built-in subject
 *   (e.g. `"adminPanel"`), or a custom resource name.
 * @param props.action - Action on `resource`, typed per subject.
 * @param props.data - Document/context forwarded to permission callbacks.
 * @param props.fields - When provided, shapes the result into a per-field map
 *   covering exactly these fields.
 * @param props.throwOnDenied - When `true`, throws `VexAccessError` instead of
 *   returning `false` / a partially-`false` field map. Default `false`.
 * @returns `boolean` when `fields` is omitted; `ResolvedFieldPermissions`
 *   (one entry per requested field) when `fields` is provided.
 * @throws {VexAccessError} When `throwOnDenied` is `true` and access is denied —
 *   carries `resource`, `action`, and (for field checks) the first denied field.
 *
 * @example
 * ```ts
 * hasPermission({ access, user, resource: "posts", action: "update" }); // boolean
 * hasPermission({ access, user, resource: "posts", action: "delete",
 *   data: post, throwOnDenied: true }); // throws VexAccessError on deny
 * hasPermission({ access, user, resource: "posts", action: "update",
 *   fields: ["title", "slug"] }); // { title: boolean, slug: boolean }
 * ```
 */
export function hasPermission<
  TSubjects extends Record<string, SubjectEntry>,
  TSubject extends keyof TSubjects & string,
>(props: {
  access?: VexAccessConfig<TSubjects>;
  user: Record<string, unknown>;
  organization?: Record<string, unknown>;
  resource: TSubject;
  action: TSubjects[TSubject]["action"];
  data?: TSubjects[TSubject]["data"];
  fields?: TSubjects[TSubject]["fields"][];
  throwOnDenied?: boolean;
}): boolean | ResolvedFieldPermissions {
  const { access } = props;

  if (!access) {
    return buildFieldPermissions({ allowed: true, fields: props.fields });
  }

  const rawRoles = props.user[access.userRolesField];
  const userRoles =
    typeof rawRoles === "string"
      ? [rawRoles]
      : Array.isArray(rawRoles)
        ? rawRoles.filter((role): role is string => typeof role === "string")
        : [];
  const knownRoles = userRoles.filter((role) => access.roles.includes(role));

  const defaultAllowed =
    access.defaultPermissionMode === PERMISSION_MODES.allow;
  let allPermissions: boolean | ResolvedFieldPermissions;

  if (knownRoles.length === 0) {
    allPermissions = buildFieldPermissions({
      allowed: false,
      fields: props.fields,
    });
  } else {
    const resolved = knownRoles.map(
      (userRole): FieldPermissionResult<string> => {
        const role = access.permissions[userRole];
        const resource = role?.[props.resource];

        let check: PermissionCheck;
        if (typeof resource === "boolean") {
          // { posts: true }
          check = resource;
        } else if (
          resource !== null &&
          resource !== undefined &&
          typeof resource === "object"
        ) {
          // { posts: { "*": true, update: () => {}, delete: false } }
          check =
            resolveActionCheck({
              resource: resource as Record<string, unknown>,
              action: props.action,
            }) ?? defaultAllowed;
        } else {
          // { posts: undefined }
          const roleWildcard = role?.[WILDCARD_KEY];
          check =
            typeof roleWildcard === "boolean" ? roleWildcard : defaultAllowed;
        }

        return (
          resolvePermissionCheck({
            check,
            user: props.user,
            data: props.data,
            organization:
              access.orgCollectionSlug !== undefined
                ? props.organization
                : undefined,
          }) ?? defaultAllowed
        );
      },
    );

    allPermissions = mergeRolePermissions({ resolved, fields: props.fields });
  }

  if (props.throwOnDenied) {
    if (allPermissions === false) {
      throw new VexAccessError("Access Denied.", {
        resource: props.resource,
        action: props.action,
      });
    }
    if (typeof allPermissions === "object") {
      const deniedField = props.fields?.find(
        (field) => allPermissions[field] === false,
      );
      if (deniedField !== undefined) {
        throw new VexAccessError("Access Denied.", {
          resource: props.resource,
          action: props.action,
          field: deniedField,
        });
      }
    }
  }

  return allPermissions;
}

/**
 * Builds an all-`true` or all-`false` result in the caller's requested shape:
 * a bare boolean, or a field map covering exactly the requested fields.
 *
 * Module-private.
 *
 * @returns `props.allowed` as-is when no fields are requested; otherwise a
 *   field map with every requested field set to `props.allowed`.
 */
function buildFieldPermissions(props: {
  allowed: boolean;
  fields?: readonly string[];
}): boolean | ResolvedFieldPermissions {
  if (props.fields === undefined) {
    return props.allowed;
  }
  const fieldPermissions: ResolvedFieldPermissions = {};
  for (const field of props.fields) {
    fieldPermissions[field] = props.allowed;
  }
  return fieldPermissions;
}

/**
 * Resolves one role's `PermissionCheck` into a concrete result: booleans and
 * mode objects pass through; callbacks are invoked with `{ user, data?,
 * organization? }`.
 *
 * Module-private. The caller resolves "not declared" to the configured
 * `defaultPermissionMode` BEFORE calling — `check` is always a real check
 * here. A callback returning `undefined` resolves to `false` (deny), so an
 * inconclusive callback can never be mistaken for an undeclared action.
 *
 * @returns The check's boolean or field-mode object; for callbacks, the
 *   callback's result with `undefined` normalized to `false`.
 */
function resolvePermissionCheck<
  TData,
  TUser,
  TOrg,
  TFieldKeys extends string,
>(props: {
  check: PermissionCheck;
  user: TUser;
  data?: TData;
  organization?: TOrg;
}): FieldPermissionResult<TFieldKeys> {
  if (typeof props.check !== "function") {
    return props.check as FieldPermissionResult<TFieldKeys>;
  }
  const callbackProps = {
    user: props.user,
    data: props.data !== undefined ? props.data : undefined,
    organization:
      props.organization !== undefined ? props.organization : undefined,
  } as PermissionCallbackProps;
  const result = props.check(callbackProps);
  return result === undefined
    ? false
    : (result as FieldPermissionResult<TFieldKeys>);
}

/**
 * Merges one resolved `FieldPermissionResult` per role into a single result —
 * OR across roles (allow wins over deny), per field when `fields` is given.
 *
 * Module-private. Field-map semantics with no `fields` param: allow-mode with
 * nonempty `fields` → `true` ("can touch something"); allow-mode with empty
 * `fields` → `false`; deny-mode with nonempty `fields` → `false` ("something
 * is denied"); deny-mode with empty `fields` → `true`.
 *
 * @returns A single OR-merged boolean when `fields` is omitted; otherwise a
 *   field map keyed by exactly the requested fields.
 */
function mergeRolePermissions<TFieldKeys extends string>(props: {
  resolved: Array<FieldPermissionResult<TFieldKeys>>;
  fields?: TFieldKeys[];
}): boolean | ResolvedFieldPermissions {
  const collapse = (
    check: FieldPermissionResult<TFieldKeys>,
    field?: TFieldKeys,
  ): boolean => {
    if (typeof check === "boolean") {
      return check;
    }
    if (check.mode === PERMISSION_MODES.allow) {
      return field === undefined
        ? check.fields.length > 0
        : check.fields.includes(field);
    }
    return field === undefined
      ? check.fields.length === 0
      : !check.fields.includes(field);
  };

  if (props.fields === undefined) {
    return props.resolved.some((check) => collapse(check));
  }
  const result: ResolvedFieldPermissions = {};
  for (const field of props.fields) {
    result[field] = props.resolved.some((check) => collapse(check, field));
  }
  return result;
}

/**
 * Resolves a single action's check from a per-action map, consulting the
 * action-level wildcard when the explicit action isn't declared.
 *
 * Module-private — the wildcard precedence lives in exactly one place so
 * `hasPermission` (and any future evaluator, e.g. DB-backed roles) shares it.
 * Presence, not truthiness, decides: an explicit `false` still wins over the
 * wildcard.
 *
 * @returns The declared check for `action`, else the wildcard's check, else
 *   `undefined` (caller falls through to `defaultPermissionMode`).
 */
function resolveActionCheck(props: {
  resource: Record<string, unknown>;
  action: string;
}): PermissionCheck | undefined {
  if (props.action in props.resource) {
    return props.resource[props.action] as PermissionCheck;
  }
  if (WILDCARD_KEY in props.resource) {
    return props.resource[WILDCARD_KEY] as PermissionCheck;
  }
  return undefined;
}
````

#### `packages/core/src/access/index.ts` (IMPLEMENTED)

Star-export from every module — `resolvePermissionCheck`, `mergeRolePermissions`, and
`resolveActionCheck` never reach the barrel because they are not `export`ed from
`hasPermission.ts`; `hasPermission` is the only runtime symbol this file contributes to
the public surface.

```ts
export * from "./constants";
export * from "./types";
export * from "./config";
export * from "./hasPermission";
```

**Implemented — deviations from original spec:**

- **Single throw site, no double-optional check type.** The stub's private-helper
  signatures took `check: PermissionCheck | undefined` and `PermissionCheck<...> |
undefined`, pushing the "not declared" `undefined` sentinel through every helper. The
  real `hasPermission` resolves "not declared" to `defaultAllowed` (the boolean form of
  `defaultPermissionMode`) at each of its three branches (subject boolean, per-action map
  via `resolveActionCheck`, role wildcard) _before_ calling `resolvePermissionCheck` — so
  `resolvePermissionCheck`'s `check` param is a non-optional `PermissionCheck`, never
  returns `undefined`, and the "callback returning `undefined` → `false`" rule is its only
  `undefined` handling. `throwOnDenied` is still applied exactly once, after
  `mergeRolePermissions`, in `hasPermission` itself.
- **Helpers stay function declarations, not arrow-typed private exports** — matches the
  stub's intent (module-private, not part of the public API) with no behavioral change;
  `resolveActionCheck` takes `{ resource, action }` (not `{ subjectEntry, action }`) to
  match the call sites' naming.
- The worked `@example` in the original stub's JSDoc (a long walkthrough numbering five
  call shapes against a hypothetical `posts` config) is trimmed to four inline one-liners
  in the real file — the full walkthrough now lives as executable test cases in
  `hasPermission.test.ts` instead of prose; the code + tests are the documentation.

#### `packages/core/src/access/hasPermission.test.ts` (IMPLEMENTED)

```ts
import { describe, expect, it } from "vitest";
import { defineCollection, text } from "../index";
import { PERMISSION_MODES, WILDCARD_KEY } from "./constants";
import { defineAccess } from "./config";
import { hasPermission } from "./hasPermission";
import { dataType, VexAccessError } from "./types";

// Core tests run with an unaugmented GeneratedVexTypes registry, so callback
// `data` params are the wide fallback (`Record<string, unknown>`) — the casts
// inside callbacks below are expected and disappear in apps after
// `vex generate` augments the registry.

const articles = defineCollection({
  slug: "articles",
  fields: { title: text({ required: true }), slug: text(), status: text() },
});

const users = defineCollection({
  slug: "users",
  fields: { name: text({ required: true }), roles: text() },
});

const PROTECTED_SLUGS = ["home", "pricing"];

/**
 * Primary fixture: role wildcard, boolean shorthand, per-action maps,
 * action-level wildcard, field-mode objects, callbacks, custom resources
 * (one with a typed dataType carrier), and the built-in adminPanel subject.
 */
const access = defineAccess({
  roles: [
    "admin",
    "editor",
    "viewer",
    "restricted",
    "poweruser",
    "owner",
    "callbackUndefined",
  ] as const,
  resources: [articles, users],
  customResources: {
    apiKeys: { actions: ["create", "revoke"] },
    reviewQueue: {
      actions: ["approve", "reject"],
      data: dataType<{ status: string }>(),
    },
  },
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    // Role-level wildcard: everything, including custom resources.
    admin: { [WILDCARD_KEY]: true },
    editor: {
      adminPanel: { access: true, impersonate: false },
      articles: {
        create: true,
        read: true,
        update: { mode: PERMISSION_MODES.allow, fields: ["title", "status"] },
        delete: ({ data }) => {
          // Registry is unaugmented in core tests — fixture data is wide.
          const post = data as { slug: string };
          return !PROTECTED_SLUGS.includes(post.slug);
        },
      },
      users: {
        // Only `read` declared — other actions fall through to the default.
        read: ({ data, user }) => {
          // Registry is unaugmented in core tests — fixture docs are wide.
          const target = data as { _id: string };
          const currentUser = user as { _id: string };
          return target._id === currentUser._id;
        },
      },
      apiKeys: { create: true, revoke: false },
      reviewQueue: {
        approve: ({ data }) => data?.status === "pending",
        reject: false,
      },
    },
    viewer: {
      articles: { read: true },
      users: false, // resource-level boolean shorthand — deny every action
    },
    // Role wildcard false: deny every subject NOT explicitly declared.
    restricted: {
      [WILDCARD_KEY]: false,
      articles: { read: true },
    },
    // Resource-level boolean shorthand — allow every action on articles.
    poweruser: {
      articles: true,
    },
    // Action-level wildcard with a callback; explicit `read` bypasses it.
    owner: {
      articles: {
        [WILDCARD_KEY]: ({ data, user }) => {
          // Registry is unaugmented in core tests — fixture docs are wide.
          const post = data as { ownerId?: string };
          const currentUser = user as { _id: string };
          return post.ownerId === currentUser._id;
        },
        read: true,
      },
    },
    callbackUndefined: {
      articles: { read: () => undefined },
    },
  },
});

/** Deny-posture fixture: undeclared role/subject/action resolves to deny. */
const accessDenyDefaults = defineAccess({
  roles: ["editor"] as const,
  resources: [articles, users],
  userCollectionSlug: "users",
  userRolesField: "roles",
  defaultPermissionMode: PERMISSION_MODES.deny,
  permissions: {
    editor: { articles: { read: true } },
  },
});

/** Org-aware fixture: organization is configured, so callbacks receive it. */
const accessWithOrg = defineAccess({
  roles: ["member"] as const,
  resources: [articles, users],
  userCollectionSlug: "users",
  userRolesField: "roles",
  orgCollectionSlug: "organizations",
  permissions: {
    member: {
      articles: {
        read: (props) => {
          if (!("organization" in props)) {
            return false;
          }
          // Registry is unaugmented in core tests — the org doc is wide.
          const organization = props.organization as
            { _id: string } | undefined;
          return organization?._id === "org1";
        },
      },
    },
  },
});

/** Merge fixture: one mode/boolean combination per role. */
const mergeAccess = defineAccess({
  roles: [
    "roleAllowTitle",
    "roleDenySlug",
    "roleAllowStatus",
    "roleDenyTitle",
    "allowEmptyFields",
    "denyEmptyFields",
    "boolTrue",
    "boolFalse",
  ] as const,
  resources: [articles, users],
  userCollectionSlug: "users",
  userRolesField: "roles",
  defaultPermissionMode: PERMISSION_MODES.deny,
  permissions: {
    roleAllowTitle: {
      articles: { update: { mode: PERMISSION_MODES.allow, fields: ["title"] } },
    },
    roleDenySlug: {
      articles: { update: { mode: PERMISSION_MODES.deny, fields: ["slug"] } },
    },
    roleAllowStatus: {
      articles: {
        update: { mode: PERMISSION_MODES.allow, fields: ["status"] },
      },
    },
    roleDenyTitle: {
      articles: { update: { mode: PERMISSION_MODES.deny, fields: ["title"] } },
    },
    allowEmptyFields: {
      articles: { update: { mode: PERMISSION_MODES.allow, fields: [] } },
    },
    denyEmptyFields: {
      articles: { update: { mode: PERMISSION_MODES.deny, fields: [] } },
    },
    boolTrue: { articles: true },
    boolFalse: { articles: false },
  },
});

const asUser = (roles: string | string[] | number, _id = "u1") => ({
  _id,
  roles,
});

describe("hasPermission — no access config", () => {
  it("allows everything when access is undefined", () => {
    expect(
      hasPermission({
        access: undefined,
        user: {},
        resource: "articles",
        action: "read",
      } as never),
    ).toBe(true);
  });

  it("returns an all-true field map when fields are requested", () => {
    expect(
      hasPermission({
        access: undefined,
        user: {},
        resource: "articles",
        action: "update",
        fields: ["title", "slug"],
      } as never),
    ).toEqual({ title: true, slug: true });
  });

  it("never throws, even with throwOnDenied", () => {
    expect(
      hasPermission({
        access: undefined,
        user: {},
        resource: "articles",
        action: "delete",
        throwOnDenied: true,
      } as never),
    ).toBe(true);
  });
});

describe("hasPermission — roles derivation from userRolesField", () => {
  it("accepts a single string role value", () => {
    expect(
      hasPermission({
        access,
        user: asUser("admin"),
        resource: "articles",
        action: "read",
      }),
    ).toBe(true);
  });

  it("accepts a string[] role value", () => {
    expect(
      hasPermission({
        access,
        user: asUser(["admin"]),
        resource: "articles",
        action: "read",
      }),
    ).toBe(true);
  });

  it("denies when the roles field is missing from the user document", () => {
    expect(
      hasPermission({
        access,
        user: { _id: "u1" },
        resource: "articles",
        action: "read",
      }),
    ).toBe(false);
  });

  it("denies when the roles array is empty", () => {
    expect(
      hasPermission({
        access,
        user: asUser([]),
        resource: "articles",
        action: "read",
      }),
    ).toBe(false);
  });

  it("denies when the roles value is not a string or string[]", () => {
    expect(
      hasPermission({
        access,
        user: asUser(42),
        resource: "articles",
        action: "read",
      }),
    ).toBe(false);
  });

  it("ignores unknown roles; all-unknown denies", () => {
    expect(
      hasPermission({
        access,
        user: asUser(["ghost", "phantom"]),
        resource: "articles",
        action: "read",
      }),
    ).toBe(false);
  });

  it("ignores unknown roles but honors known ones alongside them", () => {
    expect(
      hasPermission({
        access,
        user: asUser(["ghost", "viewer"]),
        resource: "articles",
        action: "read",
      }),
    ).toBe(true);
  });
});

describe("hasPermission — boolean shorthand and per-action checks", () => {
  it("resource-level `true` allows every action", () => {
    expect(
      hasPermission({
        access,
        user: asUser("poweruser"),
        resource: "articles",
        action: "delete",
      }),
    ).toBe(true);
  });

  it("resource-level `false` denies every action", () => {
    expect(
      hasPermission({
        access,
        user: asUser("viewer"),
        resource: "users",
        action: "read",
      }),
    ).toBe(false);
  });

  it("explicit per-action booleans resolve directly", () => {
    expect(
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "articles",
        action: "create",
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "apiKeys",
        action: "revoke",
      }),
    ).toBe(false);
  });

  it("an undeclared action on a declared subject falls through to the default (allow)", () => {
    // editor declares only `read` on users; `create` is undeclared.
    expect(
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "users",
        action: "create",
      }),
    ).toBe(true);
  });
});

describe("hasPermission — callbacks", () => {
  it("passes data and user to the callback", () => {
    const owner = asUser("editor", "u1");
    expect(
      hasPermission({
        access,
        user: owner,
        resource: "users",
        action: "read",
        data: { _id: "u1" } as never,
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access,
        user: owner,
        resource: "users",
        action: "read",
        data: { _id: "someone-else" } as never,
      }),
    ).toBe(false);
  });

  it("supports data-driven deny on protected documents", () => {
    expect(
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "articles",
        action: "delete",
        data: { slug: "home" } as never,
      }),
    ).toBe(false);
    expect(
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "articles",
        action: "delete",
        data: { slug: "blog-post" } as never,
      }),
    ).toBe(true);
  });

  it("passes typed data to custom resource callbacks", () => {
    expect(
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "reviewQueue",
        action: "approve",
        data: { status: "pending" },
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "reviewQueue",
        action: "approve",
        data: { status: "resolved" },
      }),
    ).toBe(false);
  });

  it("treats a callback returning undefined as deny — not as undeclared", () => {
    // Undeclared would resolve via the default (allow); this must be false.
    expect(
      hasPermission({
        access,
        user: asUser("callbackUndefined"),
        resource: "articles",
        action: "read",
      }),
    ).toBe(false);
  });

  it("passes organization to callbacks only when organizationCollection is configured", () => {
    expect(
      hasPermission({
        access: accessWithOrg,
        user: asUser("member"),
        organization: { _id: "org1" },
        resource: "articles",
        action: "read",
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access: accessWithOrg,
        user: asUser("member"),
        organization: { _id: "org2" },
        resource: "articles",
        action: "read",
      }),
    ).toBe(false);
  });

  it("withholds organization from callbacks when no organizationCollection is configured", () => {
    // Primary fixture has no organizationCollection; the owner wildcard
    // callback never sees `organization` even though the caller passed one.
    expect(
      hasPermission({
        access,
        user: asUser("owner", "u1"),
        organization: { _id: "org1" },
        resource: "articles",
        action: "update",
        data: { ownerId: "u1" } as never,
      }),
    ).toBe(true);
  });
});

describe("hasPermission — role-level wildcard", () => {
  it("`true` covers subjects the role never declares, including custom resources", () => {
    expect(
      hasPermission({
        access,
        user: asUser("admin"),
        resource: "apiKeys",
        action: "create",
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access,
        user: asUser("admin"),
        resource: "adminPanel",
        action: "impersonate",
      }),
    ).toBe(true);
  });

  it("`false` denies subjects the role never declares", () => {
    expect(
      hasPermission({
        access,
        user: asUser("restricted"),
        resource: "users",
        action: "read",
      }),
    ).toBe(false);
  });

  it("`false` does not override an explicitly declared subject", () => {
    expect(
      hasPermission({
        access,
        user: asUser("restricted"),
        resource: "articles",
        action: "read",
      }),
    ).toBe(true);
  });

  it("a declared subject's undeclared action falls to the default, not the role wildcard", () => {
    // restricted declares articles (only read); create is undeclared on that
    // subject and resolves via the default (allow) — NOT the role's `false`.
    expect(
      hasPermission({
        access,
        user: asUser("restricted"),
        resource: "articles",
        action: "create",
      }),
    ).toBe(true);
  });
});

describe("hasPermission — action-level wildcard", () => {
  it("covers actions not explicitly declared on the subject", () => {
    expect(
      hasPermission({
        access,
        user: asUser("owner", "u1"),
        resource: "articles",
        action: "delete",
        data: { ownerId: "u1" } as never,
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access,
        user: asUser("owner", "u1"),
        resource: "articles",
        action: "delete",
        data: { ownerId: "u2" } as never,
      }),
    ).toBe(false);
  });

  it("an explicit action key bypasses the wildcard", () => {
    // read: true is explicit; the owner-only wildcard callback must not run.
    expect(
      hasPermission({
        access,
        user: asUser("owner", "u1"),
        resource: "articles",
        action: "read",
        data: { ownerId: "someone-else" } as never,
      }),
    ).toBe(true);
  });
});

describe("hasPermission — defaultPermissionMode: deny", () => {
  it("still allows explicitly declared subject/action", () => {
    expect(
      hasPermission({
        access: accessDenyDefaults,
        user: asUser("editor"),
        resource: "articles",
        action: "read",
      }),
    ).toBe(true);
  });

  it("denies an undeclared action on a declared subject", () => {
    expect(
      hasPermission({
        access: accessDenyDefaults,
        user: asUser("editor"),
        resource: "articles",
        action: "create",
      }),
    ).toBe(false);
  });

  it("denies an undeclared subject", () => {
    expect(
      hasPermission({
        access: accessDenyDefaults,
        user: asUser("editor"),
        resource: "users",
        action: "read",
      }),
    ).toBe(false);
  });
});

describe("hasPermission — field maps", () => {
  it("returns a per-field map covering exactly the requested fields", () => {
    expect(
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "articles",
        action: "update",
        fields: ["title", "slug", "status"],
      }),
    ).toEqual({ title: true, slug: false, status: true });
  });

  it("requests a subset — unrequested fields never appear", () => {
    expect(
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "articles",
        action: "update",
        fields: ["title"],
      }),
    ).toEqual({ title: true });
  });

  it("boolean checks fan out to every requested field", () => {
    expect(
      hasPermission({
        access,
        user: asUser("poweruser"),
        resource: "articles",
        action: "update",
        fields: ["title", "slug"],
      }),
    ).toEqual({ title: true, slug: true });
  });

  it("no fields param: allow-mode with nonempty fields is true, empty is false", () => {
    expect(
      hasPermission({
        access: mergeAccess,
        user: asUser("roleAllowTitle"),
        resource: "articles",
        action: "update",
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access: mergeAccess,
        user: asUser("allowEmptyFields"),
        resource: "articles",
        action: "update",
      }),
    ).toBe(false);
  });

  it("no fields param: deny-mode with nonempty fields is false, empty is true", () => {
    expect(
      hasPermission({
        access: mergeAccess,
        user: asUser("roleDenySlug"),
        resource: "articles",
        action: "update",
      }),
    ).toBe(false);
    expect(
      hasPermission({
        access: mergeAccess,
        user: asUser("denyEmptyFields"),
        resource: "articles",
        action: "update",
      }),
    ).toBe(true);
  });
});

describe("hasPermission — multi-role merge (OR, allow wins)", () => {
  it("any allowing role wins over a denying one", () => {
    // viewer denies users entirely; admin's wildcard allows.
    expect(
      hasPermission({
        access,
        user: asUser(["viewer", "admin"]),
        resource: "users",
        action: "delete",
      }),
    ).toBe(true);
  });

  it("merges field allow-lists across roles per field", () => {
    expect(
      hasPermission({
        access: mergeAccess,
        user: asUser(["roleAllowTitle", "roleAllowStatus"]),
        resource: "articles",
        action: "update",
        fields: ["title", "slug", "status"],
      }),
    ).toEqual({ title: true, slug: false, status: true });
  });

  it("allow wins over deny for the same field across roles", () => {
    // roleDenyTitle denies title but allows everything else (deny-mode);
    // roleAllowTitle allows only title. Union: everything.
    expect(
      hasPermission({
        access: mergeAccess,
        user: asUser(["roleAllowTitle", "roleDenyTitle"]),
        resource: "articles",
        action: "update",
        fields: ["title", "slug"],
      }),
    ).toEqual({ title: true, slug: true });
  });

  it("a boolean true role overrides field restrictions from another role", () => {
    expect(
      hasPermission({
        access: mergeAccess,
        user: asUser(["allowEmptyFields", "boolTrue"]),
        resource: "articles",
        action: "update",
        fields: ["title", "slug"],
      }),
    ).toEqual({ title: true, slug: true });
  });

  it("all-denying roles merge to deny", () => {
    expect(
      hasPermission({
        access: mergeAccess,
        user: asUser(["boolFalse", "allowEmptyFields"]),
        resource: "articles",
        action: "update",
      }),
    ).toBe(false);
  });
});

describe("hasPermission — throwOnDenied", () => {
  it("throws VexAccessError with resource and action on a denied boolean check", () => {
    let caught: unknown;
    try {
      hasPermission({
        access,
        user: asUser("viewer"),
        resource: "users",
        action: "read",
        throwOnDenied: true,
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(VexAccessError);
    expect((caught as VexAccessError).resource).toBe("users");
    expect((caught as VexAccessError).action).toBe("read");
    expect((caught as VexAccessError).field).toBeUndefined();
  });

  it("throws with the first denied field in fields order", () => {
    let caught: unknown;
    try {
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "articles",
        action: "update",
        fields: ["title", "slug", "status"],
        throwOnDenied: true,
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(VexAccessError);
    expect((caught as VexAccessError).field).toBe("slug");
  });

  it("throws when the user has no known roles", () => {
    expect(() =>
      hasPermission({
        access,
        user: { _id: "u1" },
        resource: "articles",
        action: "read",
        throwOnDenied: true,
      }),
    ).toThrow(VexAccessError);
  });

  it("does not throw when access is granted", () => {
    expect(
      hasPermission({
        access,
        user: asUser("admin"),
        resource: "articles",
        action: "delete",
        throwOnDenied: true,
      }),
    ).toBe(true);
  });

  it("returns false silently by default", () => {
    expect(
      hasPermission({
        access,
        user: asUser("viewer"),
        resource: "users",
        action: "read",
      }),
    ).toBe(false);
  });
});

describe("hasPermission — built-in adminPanel subject", () => {
  it("checks adminPanel access like any other subject", () => {
    expect(
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "adminPanel",
        action: "access",
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access,
        user: asUser("editor"),
        resource: "adminPanel",
        action: "impersonate",
      }),
    ).toBe(false);
  });
});
```

Verify: `pnpm --filter @vexcms/core test -- access` — 45 tests in `hasPermission.test.ts`
(63 total across the `access` group), all green.

### Step 4 — Config integration + public exports [agent]

- [x] `packages/core/src/config/types.ts` — add `VexAccessConfig` import
- [x] `packages/core/src/config/types.ts` — add `access` field to `VexConfigInput`
- [x] `packages/core/src/config/types.ts` — add `access` field to `VexConfig`
- [x] `packages/core/src/config/config.ts` — pass `access` through in `defineConfig` return
- [x] `packages/core/src/config/sanitizeConfig.ts` — `ClientVexConfig` omits `access`
- [x] `packages/core/src/config/sanitizeConfig.ts` — `sanitizeConfigForClient` strips `access`
- [x] `packages/core/src/index.ts` — access module exports
- [x] `packages/core/src/config/sanitizeConfig.test.ts` — test for access stripping
- [ ] `packages/core/src/config/config.ts` — defineConfig-time access validation (warn on
      unknown `userCollectionSlug` / missing-or-mistyped `userRolesField`) — see #9 below
- [x] `pnpm --filter @vexcms/core test -- sanitizeConfig`
- [x] `pnpm --filter @vexcms/core build`

**Implemented — deviations from original spec:**

- `access` on `VexConfigInput`/`VexConfig` carries Step 1/2's final `VexAccessConfig` shape —
  single generic, value-level type-erased (see Step 1/2's own deviation notes for
  `userCollectionSlug`/`defaultPermissionMode`/`PERMISSION_MODES` reuse). Nothing config-layer
  specific changed there; listed here only for continuity.
- `VexAccessConfig` imports from `"../access"` (the module barrel), not `"../access/types"` —
  matches every other cross-module import in `config/types.ts` (`VexAuthAdapter`,
  `MediaCollectionConfig`, …), none of which reach into a submodule's internal `types.ts`.
- The `access?: VexAccessConfig;` field lands right after `admin` on both `VexConfigInput` and
  `VexConfig` (top of the interface, no JSDoc block) — not after `storage`/`mediaCollections` at
  the bottom as originally guided. Every other field in these two interfaces is a bare
  passthrough line with no per-field doc comment; `access` follows that convention rather than
  becoming the one heavily-documented field.
- `defineConfig`'s return spreads `access: config?.access,` immediately after `...config,` —
  next to `auth: config?.authAdapter,`, not down by `mediaCollections`.
- `ClientVexConfig = Sanitized<Omit<VexConfig, "access">>` — `Omit` wraps `VexConfig` BEFORE
  `Sanitized` runs (guided stub had the order flipped: `Omit<Sanitized<VexConfig>, "access">`).
  Omitting first means `access` is never walked into a nulled-callback shape at all — it's
  simply not a key on the type.
- `packages/core/src/index.ts` re-exports the whole access module with one line —
  `export * from "./access";` under the existing "CONFIG BUILDERS" banner, right after
  `export * from "./config";` — not the hand-maintained selective `export { ... } from
"./access"` / `export type { ... } from "./access"` block the guided stub spelled out. Every
  other module in `index.ts` (`./collections`, `./globals`, `./fields`, `./config`, `./schema`,
  `./types`, …) is already re-exported the same wildcard way, and `access/index.ts` itself is
  four `export * from` lines (Step 3) — access follows the file's own convention. `ACCESS_DEFAULTS`
  / `AccessDefaults` never existed to export (see Step 1's deviation note).

#### 1. `VexAccessConfig` import (`packages/core/src/config/types.ts`)

**Line 6, after the `GlobalConfig` import:**

```ts
import { VexAccessConfig } from "../access";
```

**Full import header (lines 1–6):**

```ts
import { CollectionConfig } from "../collections";
import { VexAuthAdapter } from "../auth/types";
import { MediaCollectionConfig, VexStorageAdapter } from "../media";
import { StorageAdapterSlug } from "../types";
import { GlobalConfig } from "../globals";
import { VexAccessConfig } from "../access";
```

#### 2. `access` on `VexConfigInput` (`packages/core/src/config/types.ts`)

**Right after `admin?: AdminConfigInput;`:**

```ts
export interface VexConfigInput {
  /**
   * Admin panel configuration. All properties are optional — omitted values fall back to defaults.
   * …
   * @see {@link AdminConfigInput} for all available options
   */
  admin?: AdminConfigInput;
  access?: VexAccessConfig;
  /** Content collections to register with the CMS. Defaults to `[]` if omitted. */
  collections?: CollectionConfig[];
  /** Singleton global documents. Each produced by `defineGlobal()`. Slugs must be unique. */
  globals?: GlobalConfig[];
  // … basePath, authAdapter, schema, types, storage — unchanged …
}
```

No JSDoc on the `access` field itself — bare passthrough, same treatment as `collections`/
`globals` immediately below it.

#### 3. `access` on `VexConfig` (`packages/core/src/config/types.ts`)

**Right after `admin: AdminConfig;`:**

```ts
export interface VexConfig {
  /** Resolved admin panel configuration — always fully populated after defaults are applied. */
  admin: AdminConfig;
  access?: VexAccessConfig;
  /** All registered content collections — always an array after defaults are applied. */
  collections: CollectionConfig[];
  /** Resolved global configs. Always present; defaults to `[]`. */
  globals: GlobalConfig[];
  // … basePath, auth, storage, mediaCollections, schema, types — unchanged …
}
```

#### 4. Pass `access` through in `defineConfig` (`packages/core/src/config/config.ts`)

```ts
export function defineConfig(config?: VexConfigInput): VexConfig {
  const userCollections = config?.collections ?? [];
  const authCollections = config?.authAdapter?.collections ?? [];
  const collections = mergeAuthCollections({
    authCollections,
    userCollections,
  }).concat(internalCollections);

  const { mediaCollections } = validateAndMergeStorageConfig({
    collections: collections,
    storageAdapters: config?.storage?.adapters,
  });

  return {
    basePath: "/admin",
    ...config,
    access: config?.access,
    auth: config?.authAdapter,
    storage: {
      adapters: config?.storage?.adapters ?? [],
    },
    collections,
    globals: config?.globals ?? [],
    mediaCollections,
    admin: {
      ...config?.admin,
      sidebar: {
        side: "left",
        collapsible: "offcanvas",
        ...config?.admin?.sidebar,
      },
    },
    schema: {
      outputPath: "/convex/vex.schema.ts",
      ...config?.schema,
    },
    types: {
      outputPath: "/src/vex.types.ts",
      ...config?.types,
    },
  };
}
```

#### 5. `ClientVexConfig` excludes `access` (`packages/core/src/config/sanitizeConfig.ts`)

```ts
export type ClientVexConfig = Sanitized<Omit<VexConfig, "access">>;
```

#### 6. `sanitizeConfigForClient` strips `access` (`packages/core/src/config/sanitizeConfig.ts`)

```ts
export function sanitizeConfigForClient(config: VexConfig): ClientVexConfig {
  // Drop storage adapters (class instances) and the access config up front.
  // Access is deliberately server-only: its callbacks cannot serialize (a
  // nulled matrix would misresolve in hasPermission), client checks are
  // advisory at best, and permission policy should not ship to the browser.
  const { storage, access, ...rest } = config;
  return stripNonSerializable(rest) as ClientVexConfig;
}
```

#### 7. Export the access module from `packages/core/src/index.ts`

**Under the existing "CONFIG BUILDERS" section, right after the `./config` re-export:**

```ts
// ============================================================================
// CONFIG BUILDERS
// ============================================================================

export * from "./config";

export * from "./access";

// ============================================================================
// SCHEMA GENERATION
// ============================================================================
```

One wildcard re-export — `access/index.ts` already does `export * from "./constants"` /
`"./types"` / `"./config"` / `"./hasPermission"` (Step 3), so the package root picks up every
public symbol (`defineAccess`, `hasPermission`, `dataType`, `CRUD_ACTIONS`, `DRAFT_ACTIONS`,
`PERMISSION_MODES`, `WILDCARD_KEY`, `ADMIN_CUSTOM_SUBJECTS`, `VexAccessConfig`,
`VexAccessConfigInput`, `VexAccessError`, `VexAccessConfigError`, `CrudAction`, `DraftAction`,
`PermissionMode`, `AccessResource`, `FieldPermissionResult`, `ResolvedFieldPermissions`,
`PermissionCallbackProps`, `PermissionCheck`, `SubjectEntry`, `SubjectMap`, `RolePermissions`,
`CustomResourceInput`, `AdminCustomSubjectSlug`, `DataTypeCarrier`) for free. `resolvePermissionCheck`,
`mergeRolePermissions`, and `resolveActionCheck` are module-private inside `hasPermission.ts` and
were never exported — `hasPermission` is the only runtime entry point.

#### 8. Test: access stripping (`packages/core/src/config/sanitizeConfig.test.ts`)

**Added to the `describe("sanitizeConfigForClient — strips non-serializable values", ...)` block,
after the last existing test:**

```ts
it("excludes the access config from the client config entirely", () => {
  const users = defineCollection({
    slug: "users",
    fields: { name: text(), roles: text() },
  });
  // Authored standalone (as in real apps) — inlining defineAccess inside the
  // defineConfig literal makes contextual typing collapse TCustom to its
  // constraint instead of its `{}` default.
  const access = defineAccess({
    roles: ["admin"],
    resources: [users],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      // A callback in the matrix — must never reach the client, even nulled.
      admin: { users: { read: ({ user }) => user !== undefined } },
    },
  });
  const config = defineConfig({ collections: [users], access });
  const client = sanitizeConfigForClient(config);
  // The key is absent — not present-with-nulled-callbacks. A stripped
  // matrix would misresolve in hasPermission; policy stays server-only.
  expect(client).not.toHaveProperty("access");
  expect(client.collections).toHaveLength(1);
});
```

File-level imports gain `defineAccess`:

```ts
import { defineAccess, defineConfig, defineCollection } from "../index";
```

#### 9. `defineConfig`-time access validation [dev]

Guided stub — not yet implemented. `defineAccess` cannot validate `userCollectionSlug` /
`userRolesField` against the real user collection because the merged collection (auth-adapter
fields included) doesn't exist until `defineConfig` runs `mergeAuthCollections` (decision 19).
`defineConfig` is the first place both `config.access` and the merged `collections` array exist
together, so the check belongs here — dev-only, mirroring `defineAccess`'s own
`process.env.NODE_ENV !== "production"` warnings (never a thrown error; a misconfigured
`userRolesField` degrades to "every check denies" at runtime, not a build failure).

```ts
export function defineConfig(config?: VexConfigInput): VexConfig {
  const userCollections = config?.collections ?? [];
  const authCollections = config?.authAdapter?.collections ?? [];
  const collections = mergeAuthCollections({
    authCollections,
    userCollections,
  }).concat(internalCollections);

  // TODO: implement (dev-only, mirrors defineAccess's own NODE_ENV guard)
  // 1. `if (config?.access && process.env.NODE_ENV !== "production") { ... }`
  // 2. `const userCollection = collections.find((c) => c.slug === config.access!.userCollectionSlug);`
  //    a. `undefined` → `console.warn(`access.userCollectionSlug "${...}" matches no registered
  //       collection (after auth-adapter merge)`)` — nothing else to check; stop here.
  // 3. Else resolve the field: `const field = userCollection.fields[config.access!.userRolesField];`
  //    a. `undefined` → `console.warn(`access.userRolesField "${...}" is not a field on the
  //       "${userCollection.slug}" collection`)`.
  //    b. defined but `field.type !== "text" && field.type !== "array"` → `console.warn(`access.userRolesField
  //       "${...}" must be a text or array field, got "${field.type}"`)` — `hasPermission` reads
  //       `string | string[]` off it; any other field type can never hold a role value.
  // Edge cases:
  // - `config.access` undefined → skip entirely, no warnings (access control is off).
  // - Runs against `collections` (post-merge), not `config.collections` — the whole point is
  //   catching auth-adapter-only slugs/fields `defineAccess` itself could never see.

  const { mediaCollections } = validateAndMergeStorageConfig({
    collections: collections,
    storageAdapters: config?.storage?.adapters,
  });

  return {
    // … unchanged, see #4 above …
  };
}
```

**Test cases:**

1. `access.userCollectionSlug` names a slug absent from the merged `collections` array → warns
   once, naming the slug.
2. `userCollectionSlug` resolves, but `userRolesField` is missing from that collection's `fields`
   (or resolves to a field whose `type` is neither `"text"` nor `"array"`) → warns once.
3. A valid `{ userCollectionSlug, userRolesField }` pair (slug matches a merged collection, field
   exists and is `type: "text"` or `type: "array"`) → no warnings.

Verify: `pnpm --filter @vexcms/core test -- sanitizeConfig && pnpm --filter @vexcms/core build`

### Step 5 — Server API enforcement `[dev]`

**Status: implemented and verified** (api suites green, tsc clean, www typecheck clean).

Enforcement lives in the server API factories and per-operation server functions — one seam
covers every collection, global, and media operation. Identity is resolved server-side from
`ctx.auth` and **never** accepted as a client argument.

- [x] `packages/core/src/api/types.ts` — `VexApiAuth = { user: Record<string, unknown> | null; organization?: Record<string, unknown> }` (nullable `user`; roles ride the user doc).
- [x] `packages/core/src/api/server.ts` — `collectionsApi({ config, query, mutation, getAuth })` (unified find/get/search/create/update/remove), `globalsApi({ config, query, mutation, getAuth })`, and the shared `resolveGetAuth({ ctx, config, getAuth })` helper.
- [x] `me: query(() => resolveGetAuth(...))` — client-UI convenience (current user/roles); NOT part of enforcement.
- [x] `packages/core/src/api/{create,update,remove,get,find,search}/server.ts` — per-op guards.
- [x] `packages/core/src/api/globals/{get,find,upsert}.server.ts` — globals guards.
- [x] `packages/core/src/media/api/{mutations,queries}.ts` — media guards.
- Verify: `pnpm --filter @vexcms/core test -- api` ✓

**As-built contract:**

- **`resolveGetAuth`** — the single auth-resolution point. `config.access` undefined → returns
  `undefined` (RBAC off, no check). `config.access` set but no `getAuth` → throws
  `VexAccessConfigError` (misconfig, loud). Otherwise returns `getAuth(ctx)` — `{ user }` for a
  resolved user, `{ user: null }` for an unauthenticated caller.
- **Fail-closed via nullable `user`** — every guard runs `hasPermission` with
  `user: args.auth?.user ?? {}` (or `args.auth.user`, which is `null` for unauthenticated).
  A `null`/`{}` user derives no roles → deny. There is no "skip the check because no
  credentials" path.
- **Reads** — `get`/`getGlobal` return `null` on deny (decision 21); `find`/`findGlobals`/
  `search` filter denied docs (per-doc, and per-global for `findGlobals`). List filtering is
  post-query (Convex can't push predicates into indexes) and `find` is limit-based.
- **Writes** — `create`/`update`/`remove`/`upsertGlobal` call `hasPermission(..., throwOnDenied:
true)`; `update`/`remove` load the existing doc and pass it as `data` for doc-aware
  callbacks; Convex transactionality means a thrown guard mid-`Promise.all` rolls back.
- **Media action mapping** — `getUrl`/`listMedia`/`searchMedia` → `read`;
  `generateUploadUrl`/`createMediaDocument` → `create`; `deleteMedia` → `delete`.
- **Deviations from the original stub spec:** `queryApi`/`mutationApi` merged into
  `collectionsApi`; the `hasReadPermission`/`assertWritePermission` helpers were not extracted
  (guards inline per op); `VexApiAuth` carries `user | null` (not the original `{ user, roles }`).

### Step 6 — www wiring `[dev]`

**Status: implemented and verified** (www typecheck clean; toggling a matrix line flips the
list view between 0 and N documents).

The resolver lives in the auth plugin package; the app wires it once and threads the JWT to
server-side fetches.

- [x] `packages/better-auth/src/convex/getAuth.ts` — `createGetAuth({ userCollectionSlug, orgCollectionSlug, sessionCollectionSlug, resolveOrgs? })`. Resolves `ctx.auth.getUserIdentity()` → user doc via `identity.subject`; org via `identity.sessionId` → session doc → `activeOrganizationId` → org doc. Unauthenticated or deleted user → `{ user: null }`.
- [x] `apps/www/src/auth/access.ts` — authored `defineAccess` config (slug-based, typed callbacks).
- [x] `apps/www/src/vex.config.ts` — `access` wired into `defineConfig`.
- [x] `apps/www/convex/vex.ts` — `collectionsApi({ config, query, mutation, getAuth: createGetAuth({...}) })`.
- [x] `apps/www/convex/vex/globals.ts` — `globalsApi({ ..., getAuth })`.
- [x] `packages/next/src/NextAdminPage.tsx` — accepts `token`; passes `{ token }` as the 3rd arg to every server-side `fetchQuery` so `getAuth` resolves the real user (fixes the unauthenticated-preload deny).
- [x] `apps/www/src/app/(vexcms)/admin/[[...path]]/page.tsx` — sources the JWT via `getToken()` and passes `token` into `NextAdminPage`.
- Verify: `pnpm --filter www typecheck && pnpm --filter www build` ✓

**As-built notes:**

- **Token threading is the crux of server-side fetches.** Client `useQuery` gets identity from
  the authenticated ConvexProvider automatically; server `fetchQuery`/`preloadQuery` must be
  passed `{ token }` explicitly, or `getAuth` sees an unauthenticated `ctx` and denies.
- **`createGetAuth` uses `identity.sessionId`** (appended to every JWT by the `convex()`
  better-auth plugin; present at runtime via `UserIdentity`'s custom-claim index signature) to
  read the live active org from the session doc — never trusting a stale org claim.
- **Deviations from the original spec:** the resolver is `createGetAuth` in `@vexcms/better-auth`,
  not a hand-written `convex/vex/auth.ts`; the `hasServerPermission`/`useHasPermission` wrappers
  were not needed (queries self-resolve auth via the factory `getAuth`); `me` is kept as a
  client convenience, not deleted.

### Step 7 — Capability mode in `hasPermission` `[dev]`

Adds `mode?: "action" | "capability"` (default `"action"`) to `hasPermission`. Today, a
function check resolved with no `data` silently does `undefined.someField` inside the
callback and throws an opaque `TypeError` — there is no way to ask "can this role touch
this subject at all" without fabricating a fake document. `mode: "capability"` answers
exactly that question (used by Step 8's nav snapshot); `mode: "action"` (the default,
current behavior otherwise) now fails loudly instead of throwing an unrelated `TypeError`
when a caller forgets `data`. This step assumes `PermissionCheck<TData, TUser, TOrg> =
boolean | ((props: PermissionCallbackProps<TData, TUser, TOrg>) => boolean | undefined)` —
the field-mode object variant is gone (dropped earlier in this spec's rework); nothing
below references `{ mode: "allow" | "deny", fields }`.

Do not confuse the new `PERMISSION_EVAL_MODES` with the existing `PERMISSION_MODES`
(`allow`/`deny` — still used by `defaultPermissionMode`, unrelated and untouched here).

- [ ] `packages/core/src/access/constants.ts` — add `PERMISSION_EVAL_MODES` + `PermissionEvalMode`
- [ ] `packages/core/src/access/hasPermission.ts` — `mode` prop + `resolvePermissionCheck` delta
- [ ] `packages/core/src/access/hasPermission.test.ts` — new `describe` block (below)

#### 1. New constant

```ts
// packages/core/src/access/constants.ts

/**
 * How `hasPermission` resolves a function check when no `data` is supplied.
 *
 * - `action` (default) — a function check with no `data` is a caller bug: the
 *   check needs a document to evaluate and none was given. Throws
 *   `VexAccessError` instead of letting the callback crash on `undefined`.
 * - `capability` — resolves a function check to `true` without invoking it.
 *   Answers "can this role do this at all" (nav/list-level gating); per-document
 *   filtering still happens downstream in `find`/`get`. Static boolean checks
 *   are unaffected by either mode.
 */
export const PERMISSION_EVAL_MODES = {
  action: "action",
  capability: "capability",
} as const;
/** Permission evaluation mode, derived from {@link PERMISSION_EVAL_MODES}. */
export type PermissionEvalMode =
  (typeof PERMISSION_EVAL_MODES)[keyof typeof PERMISSION_EVAL_MODES];
```

#### 2. `hasPermission` signature/JSDoc delta

Add one prop and one `@param`; nothing else in the exported signature changes.

```ts
export function hasPermission<
  TSubjects extends Record<string, SubjectEntry>,
  TSubject extends keyof TSubjects & string,
  TData extends {},
>(props: {
  access?: VexAccessConfig<TSubjects>;
  user: Record<string, unknown> | null;
  organization?: Record<string, unknown>;
  resource: TSubject;
  action: TSubjects[TSubject]["action"];
  data?: TData;
  fields?: TSubjects[TSubject]["fields"][];
  throwOnDenied?: boolean;
  /**
   * How to resolve a role's check when it is a function and `data` is
   * omitted. `"action"` (default) throws `VexAccessError` — pass `data` for
   * an exact per-document decision, or `"capability"` to ask "can this role
   * do this at all" (nav/list gating; row-level filtering happens
   * separately in `find`/`get`). Has no effect on static boolean checks, and
   * no effect when `data` is provided (always resolves the function against
   * it, in either mode).
   * @default "action"
   */
  mode?: PermissionEvalMode;
}): boolean;
```

TODOs (numbered, `hasPermission`'s body):

1. Default `const mode = props.mode ?? PERMISSION_EVAL_MODES.action;` near the top, beside the
   existing `defaultAllowed` derivation.
2. Thread `mode`, `props.resource`, and `props.action` into every `resolvePermissionCheck(...)`
   call inside the `knownRoles.map(...)` loop (currently only `check`, `user`, `data`,
   `organization` are passed) — `resolvePermissionCheck` needs `resource`/`action` to build the
   thrown `VexAccessError`'s context.
3. Multi-role OR merge (`mergeRolePermissions` / whatever it collapses to post field-drop) is
   **unchanged** — it merges the already-resolved per-role booleans; it never sees `mode`.

#### 3. `resolvePermissionCheck` — modified stub

```ts
/**
 * Resolves one role's `PermissionCheck` into a concrete boolean. Static
 * booleans pass through unchanged in both modes. Function checks:
 *
 * - `data` provided → always invoked against it, in either mode (unchanged
 *   from today). A callback returning `undefined` resolves to `false`
 *   (deny) — inconclusive is never mistaken for "undeclared".
 * - `data` omitted, `mode: "action"` → throws `VexAccessError` instead of
 *   invoking the callback (it would otherwise read fields off `undefined`).
 * - `data` omitted, `mode: "capability"` → resolves to `true` without
 *   invoking the callback. The role is *capable* of the action in the
 *   abstract; whether a specific document passes is a separate, later
 *   check (row-level filtering in `find`/`get`, or the exact per-doc check
 *   in Step 9's edit views).
 *
 * Module-private. The caller resolves "not declared" to the configured
 * `defaultPermissionMode` BEFORE calling — `check` is always a real check
 * here.
 *
 * @throws {VexAccessError} `mode: "action"` (default), function check, no `data`.
 */
function resolvePermissionCheck<TData, TUser, TOrg>(props: {
  check: PermissionCheck<TData, TUser, TOrg>;
  user: TUser;
  data?: TData;
  organization?: TOrg;
  mode: PermissionEvalMode;
  resource: string;
  action: string;
}): boolean {
  if (typeof props.check !== "function") {
    return props.check;
  }

  if (props.data === undefined) {
    // TODO 1: capability mode → the role can perform this action in the
    // abstract; return true without invoking the callback (it has nothing
    // to evaluate against).
    if (props.mode === PERMISSION_EVAL_MODES.capability) {
      return true;
    }
    // TODO 2: action mode (default) → this used to silently crash inside
    // the callback (`undefined.someField`) as an opaque TypeError. Throw a
    // named, actionable error instead.
    throw new VexAccessError({
      resource: props.resource,
      action: props.action,
      message:
        `hasPermission: "${props.resource}.${props.action}" resolves to a function check, ` +
        `but no "data" was passed. Pass "data" for an exact per-document check, or call ` +
        `with mode: "capability" to ask whether the user can perform this action at all ` +
        `(nav/list-level gating — row-level filtering happens separately in find/get).`,
    });
  }

  // TODO 3: data provided → unchanged in both modes, run the callback for real.
  const callbackProps = {
    user: props.user,
    data: props.data,
    organization: props.organization,
  } as PermissionCallbackProps<TData, TUser, TOrg>;
  const result = props.check(callbackProps);
  return result === undefined ? false : result;
}
```

#### 4. Tests — full code (append to `hasPermission.test.ts`)

Add a fixture near the other module-level `defineAccess(...)` consts (reuses the existing
`articles` collection and `asUser` helper already in the file):

```ts
/** Capability-mode fixture: one function-check role, one explicit-deny role. */
const capabilityAccess = defineAccess({
  roles: ["reviewer", "denier", "viewer"] as const,
  resources: [articles],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    reviewer: {
      articles: {
        update: ({ data }) => (data as { ownerId?: string })?.ownerId === "u1",
      },
    },
    denier: {
      articles: { update: false },
    },
    viewer: {
      articles: { read: true },
    },
  },
});
```

Then a new `describe` block:

```ts
describe("hasPermission — mode: capability vs action", () => {
  it("capability mode resolves a function check to true without invoking it", () => {
    expect(
      hasPermission({
        access: capabilityAccess,
        user: asUser("reviewer"),
        resource: "articles",
        action: "update",
        mode: "capability",
      }),
    ).toBe(true);
  });

  it("capability mode still resolves a static false check to false", () => {
    expect(
      hasPermission({
        access: capabilityAccess,
        user: asUser("denier"),
        resource: "articles",
        action: "update",
        mode: "capability",
      }),
    ).toBe(false);
  });

  it("action mode (default) throws VexAccessError when a function check has no data", () => {
    let caught: unknown;
    try {
      hasPermission({
        access: capabilityAccess,
        user: asUser("reviewer"),
        resource: "articles",
        action: "update",
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(VexAccessError);
    expect((caught as VexAccessError).resource).toBe("articles");
    expect((caught as VexAccessError).action).toBe("update");
    expect((caught as Error).message).toMatch(/mode: "capability"|data/);
  });

  it("action mode runs the callback normally once data is provided", () => {
    expect(
      hasPermission({
        access: capabilityAccess,
        user: asUser("reviewer"),
        resource: "articles",
        action: "update",
        data: { ownerId: "u1" } as never,
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access: capabilityAccess,
        user: asUser("reviewer"),
        resource: "articles",
        action: "update",
        data: { ownerId: "someone-else" } as never,
      }),
    ).toBe(false);
  });

  it("multi-role OR merge under capability mode: one capable role wins over an explicit deny", () => {
    expect(
      hasPermission({
        access: capabilityAccess,
        user: asUser(["denier", "reviewer"]),
        resource: "articles",
        action: "update",
        mode: "capability",
      }),
    ).toBe(true);
  });
});
```

**Verify:** `pnpm --filter @vexcms/core test -- access`

---

### Step 8 — Client permission context (sidebar/nav visibility) `[dev]`

The client evaluates `hasPermission` **directly** — no server-computed snapshot. Two inputs
reach the client without crossing a serialization boundary, so both are available
synchronously on first render (no FOUC):

- **`access`** (callbacks intact) via a **direct client-bundle import** — the app imports
  `~/auth/access` inside a `"use client"` module and hands it to a provider. This bypasses the
  RSC/`sanitizeConfigForClient` strip entirely (that strip only governs the _serialized_ config
  prop; a bundler import keeps functions). `access` and the collection configs it imports must
  stay client-safe (they already are — the admin UI renders those same configs).
- **`user` / `organization`** as serializable props from the server layout (which already
  resolves `user` via `getCurrentUser()`; add `organization`). Plain docs, no callbacks —
  serialize fine, present at hydration.

A snapshot is intentionally NOT used (Decision 23): batching N cheap synchronous
`hasPermission` calls saves nothing, and shipping `access` client-side is already accepted for
direct evaluation. Client checks are advisory UX; the Step 5 server guards remain enforcement.

- [x] `packages/react/src/context/VexAccessContext.tsx` (new) — `VexAccessProvider` +
      `useVexAccess()`; holds the raw `VexAccessConfig` (with callbacks). Fail-closed default
      (`undefined` → deny).
- [x] `packages/react/src/context/VexAuthContext.tsx` (new) — `useVexAuth()` →
      `{ user, organization }`; seeded by `AdminLayout` from server-passed props.
- [x] `packages/react/src/hooks/usePermission.ts` (new) — composes the two contexts + calls
      `hasPermission`.
- [x] `packages/react/src/context/index.ts` + package root — export the providers/hooks.
- [x] `packages/react/src/components/AdminLayout.tsx` — accept `user`/`organization` props,
      wrap children in `VexAuthContext.Provider` (beside the existing `VexConfigContext`).
- [x] `packages/next/src/NextAdminLayout.tsx` — forward server-resolved `user`/`organization`.
- [x] `packages/react/src/components/AdminSidebar.tsx` — filter collection/global/media links
      by `usePermission({ resource: slug, action: "read", mode: "capability" })`; hide the
      admin entry when `adminPanel`/`access` is false.
- [ ] `packages/react/src/components/AdminTopNav.tsx` — suppress a crumb for a denied subject.
- [x] App wiring: `apps/www/src/app/(vexcms)/admin/clientProviders.tsx` imports `access` and
      renders `<VexAccessProvider access={access}>`; `admin/layout.tsx` passes `organization`.
- Verify: `pnpm --filter @vexcms/react build && pnpm --filter www typecheck`.

#### 1. `VexAccessContext` (react) — client import of the raw config

```ts
// packages/react/src/context/VexAccessContext.tsx
"use client";
import { createContext, useContext } from "react";
import type { VexAccessConfig } from "@vexcms/core";

/** The raw access config (callbacks intact), provided from a client-bundle import in the
 *  app — NOT from the sanitized server config prop (which strips `access`). */
const VexAccessContext = createContext<VexAccessConfig | undefined>(undefined);

/** @returns the access config for the session, or `undefined` (→ every check denies). */
export function useVexAccess(): VexAccessConfig | undefined {
  return useContext(VexAccessContext);
}

/** Wrap the admin UI; the app supplies `access` from a `"use client"` import of
 *  `~/auth/access` so its callbacks survive into the client bundle. */
export function VexAccessProvider(props: { access?: VexAccessConfig; children: React.ReactNode }) {
  return <VexAccessContext.Provider value={props.access}>{props.children}</VexAccessContext.Provider>;
}
```

#### 2. `VexAuthContext` (react) — server-resolved caller

```ts
// packages/react/src/context/VexAuthContext.tsx
"use client";
import { createContext, useContext } from "react";

export interface VexAuth {
  user: Record<string, unknown> | null;      // null → unauthenticated → no roles → deny
  organization?: Record<string, unknown>;
}
const VexAuthContext = createContext<VexAuth>({ user: null });

/** @returns the current caller `{ user, organization }` from the server layout. */
export function useVexAuth(): VexAuth {
  return useContext(VexAuthContext);
}
export function VexAuthProvider(props: { value: VexAuth; children: React.ReactNode }) {
  return <VexAuthContext.Provider value={props.value}>{props.children}</VexAuthContext.Provider>;
}
```

#### 3. `usePermission` (react) — the one hook every affordance uses

```ts
// packages/react/src/hooks/usePermission.ts
"use client";
import { hasPermission } from "@vexcms/core";
import { useVexAccess } from "../context/VexAccessContext";
import { useVexAuth } from "../context/VexAuthContext";

/**
 * Client-side permission check for UI affordances (advisory — server guards enforce).
 *
 * @param props.resource - Subject slug (collection/global/media/`adminPanel`).
 * @param props.action - Action to check.
 * @param props.data - The concrete document for an exact per-doc check (edit views). Omit for
 *   subject-level "capability" checks (sidebar/list/create), which pass `mode: "capability"`.
 * @returns boolean — `false` when no `access`/`user` (fail-closed).
 */
export function usePermission(props: {
  resource: string;
  action: string;
  data?: Record<string, unknown>;
}): boolean {
  const access = useVexAccess();
  const { user, organization } = useVexAuth();
  // TODO: capability mode when no `data` (subject-level); action mode when `data` given.
  return hasPermission({
    access,
    user,
    organization,
    resource: props.resource as never,
    action: props.action as never,
    data: props.data as never,
    mode: props.data === undefined ? "capability" : "action",
  } as never);
}
```

#### 4. Sidebar / topnav — filter by capability

`AdminSidebar`/`AdminTopNav` map over `useVexConfig().collections/globals/mediaCollections`;
wrap each rendered link in `usePermission({ resource: slug, action: "read", mode: "capability" })`
(a helper component or a filtered list, since hooks can't be called in a `.map` callback
conditionally — compute a `visible` array up front). Hide the admin/dashboard entry when
`usePermission({ resource: "adminPanel", action: "access" })` is false.

> **Capability ≠ row count.** A visible link means "you can reach this subject"; the list it
> opens may be empty after per-doc filtering (Step 5). That's correct and expected — see
> Decision 23. `access` + `user` are both synchronous at first render, so no flash.

### Step 9 — View-level action enforcement `[dev]`

Gates the action affordances (Create / Save / bulk-delete / readonly inputs) using the same
`usePermission()` hook from Step 8 — every check is a **direct client-side `hasPermission`
call**, no `canUpdate` prop forwarded from the server. Two check shapes:

- **List/create surfaces have no specific document** → `usePermission({ resource, action })`
  with no `data` (capability mode): `CollectionListView` Create/bulk-delete, `CreateDocumentModal`,
  `MediaCollectionListView`, `GlobalEditView` update gate.
- **Edit views have the loaded document** → `usePermission({ resource, action: "update", data:
currentDocument })` (action mode, exact). Because `currentDocument` is the live
  `useQuery`-subscribed doc, the check **re-evaluates reactively** if a permission-relevant
  field changes — no stale server-computed value. This is strictly better than the earlier
  `canUpdate`-prop design, which is why that prop and the `NextAdminPage` per-doc computation
  are dropped.

A disabled button is UX, not security — the Step 5 server guards enforce; the read guards
(`get`/`getGlobal` → `null` on deny, Step 10) already make a denied user who types a URL land
on an empty/not-found view, so no separate server route-guard is needed.

- [ ] `packages/react/src/components/views/CollectionListView.tsx` — Create button + bulk-delete.
- [ ] `packages/react/src/components/modals/CreateDocumentModal.tsx` — submit gate (defense-in-depth; the modal opens off a `?createDocument=true` URL param).
- [ ] `packages/react/src/components/views/CollectionEditView.tsx` — exact per-doc Save gate + readonly inputs.
- [ ] `packages/react/src/components/views/GlobalEditView.tsx` — capability update gate.
- [ ] `packages/react/src/components/views/MediaCollectionListView.tsx` — mirrors list view.
- [ ] `packages/react/src/components/views/MediaCollectionEditView.tsx` — mirrors edit view.
- Verify: `pnpm --filter @vexcms/react build && pnpm --filter www typecheck && pnpm --filter www build`.

#### 1. `CollectionListView` — Create + bulk-delete

```ts
const collection = /* … unchanged … */;
const canCreate = usePermission({ resource: collection.slug, action: CRUD_ACTIONS.create });
const canDelete = usePermission({ resource: collection.slug, action: CRUD_ACTIONS.delete });
```

1. Wrap the `"+ New {label}"` `<Button>` in `{canCreate && (...)}` — hide, don't disable (no
   actionable next step for a user who can't create).
2. `<DataTable ... enableRowSelection={canDelete} enableBulkActions={canDelete} />` — row
   selection today exists only to drive bulk-delete.

#### 2. `CreateDocumentModal` — submit gate

The trigger is hidden per #1, but the modal is always mounted and opens off a URL param a
denied user can type. `const canCreate = usePermission({ resource: collection.slug, action:
CRUD_ACTIONS.create });` → `disabled={!canCreate}` on the submit `<Button>`. Backstop is still
the server `create` guard.

#### 3. `CollectionEditView` — exact per-doc Save + readonly inputs

```ts
const { data: currentDocument } = useQuery({/* … unchanged … */});
if (!currentDocument) {
  /* … unchanged … */
}
const canUpdate = usePermission({
  resource: props.collectionSlug,
  action: CRUD_ACTIONS.update,
  data: currentDocument, // exact per-doc check, reactive to live doc changes
});
```

1. `<Button type="submit" disabled={isDefaultValue || !canUpdate}>` — extend the existing
   expression.
2. `readOnly={field.admin.readOnly || !canUpdate}` on every `<InputComponent>` in the fields map.

#### 4. `GlobalEditView` — capability update gate

Singletons have no distinct "specific document" case; a plain capability check suffices:
`const canUpdate = usePermission({ resource: global.slug, action: CRUD_ACTIONS.update });` →
same Save `disabled` + `readOnly` edits as #3.

#### 5. Media views

- `MediaCollectionListView` mirrors #1 (`create`/`delete` on the media slug); wrap `"+ Upload"`
  in `{canCreate && ...}`, gate `enableRowSelection`/`enableBulkActions` on `canDelete`.
  `CreateMediaModal` needs no internal gate — no distinct Save action; the dropzone hits the
  server-guarded `generateUploadUrl` (`create`).
- `MediaCollectionEditView` mirrors #3 — `usePermission({ resource: slug, action: "update",
data: currentDocument })`, Save + readonly.

**Verify:** `pnpm --filter @vexcms/react build && pnpm --filter www typecheck && pnpm --filter www build`

### Step 10 — Cleanup `[dev]`

Loose ends surfaced during the build, batched so none is forgotten. Each is small and
independently verifiable.

- [ ] **Drop field-mode objects.** Remove `{ mode, fields }` from `FieldPermissionResult` /
      `PermissionCheck` (`access/types.ts`) and the mode-object branch from
      `mergeRolePermissions` (`access/hasPermission.ts`) → `PermissionCheck = boolean |
callback`. Remove the `@ts-expect-error` field-mode test in `config.test.ts`. Why: the
      API is whole-document; the type promised granularity the runtime never delivered
      (Decision 20).
- [ ] **`get` / `getGlobal` return `null` on read-deny** instead of throwing `VexAccessError`
      (`api/get/server.ts`, `api/globals/get.server.ts`). Lists already filter; this makes
      single-doc reads composable and stops denied server-renders crashing (Decision 21).
- [ ] **`defineConfig`-time access validation** (the open Step 4 item): after
      `mergeAuthCollections`, when `config.access` is set, `console.warn` if
      `userCollectionSlug` matches no merged collection, or `userRolesField` is missing / not a
      `text`/`array` field on it. Warn, don't throw (config still returns).
- [ ] **Docs:** `me` documented as client-UI convenience (not enforcement); `resolveCollectionSlug`
      JSDoc already matches its throw (done). Grep the module for any remaining
      `ResolvedFieldPermissions` return-type mentions once field-mode is dropped.
- Verify: `pnpm --filter @vexcms/core test && pnpm --filter www typecheck`

## Test Plan

Exhaustive branch coverage for RBAC — every resolution path, every guard call site, every
deny/allow/throw/null/filter outcome. Grouped by area; each file's cases are additions unless
marked **(new file)**. Reflects target behavior for not-yet-built Steps 7–10 (capability mode,
permission context, view enforcement, field-mode removal + null-on-deny) alongside the shipped
Steps 3–6 surface — this section **is** Step 11.

### 1. `hasPermission` core — `packages/core/src/access/hasPermission.test.ts` (extend)

- [ ] `access: undefined` → `true` for every `{resource, action}` combination, including an
      unregistered/made-up resource string and a `user: null` caller (system fully off).
- [ ] `user: null` → empty role list → deny, regardless of `defaultPermissionMode`.
- [ ] `user: {}` (no `userRolesField` key present) → empty role list → deny.
- [ ] `user[access.userRolesField]` is a single string not in `access.roles` → deny (unknown
      role filtered out of `knownRoles`).
- [ ] `user[access.userRolesField]` is `[]` → deny.
- [ ] `user[access.userRolesField]` is a plain string (e.g. `"admin"`) → normalized to `["admin"]`
      and resolved.
- [ ] `user[access.userRolesField]` is `string[]` with a mix of known/unknown roles → only known
      roles participate in the OR-merge.
- [ ] `user[access.userRolesField]` is `string[]` containing non-string entries (e.g. numbers) →
      non-string entries filtered out before role-known-ness check.
- [ ] Boolean shorthand: `{ [role]: { posts: true } }` → allow; `{ [role]: { posts: false } }` →
      deny, for every action on `posts` (shorthand is action-independent).
- [ ] Per-action map: `{ posts: { read: true, update: false } }` → `read` allows, `update` denies,
      an action absent from the map falls through to the action-level wildcard or
      `defaultPermissionMode`.
- [ ] Action-level wildcard `"*"`: `{ posts: { "*": true, delete: false } }` → `delete` (explicit)
      denies even though the wildcard allows; `create`/`read`/`update` (undeclared) fall through
      to the wildcard and allow. Presence (not truthiness) wins: `{ "*": true, delete: false }`
      vs `{ "*": true }` with no `delete` key must differ.
- [ ] Role-level wildcard: `{ [role]: { [WILDCARD_KEY]: true } }` → every **undeclared** subject
      allows; a subject with an explicit entry (including explicit `false`) is NOT overridden by
      the role wildcard — explicit subject entry always wins.
- [ ] `defaultPermissionMode: "allow"` vs `"deny"`: a known role with no entry at all for the
      requested resource (`role[resource]` is `undefined`, no role wildcard) resolves to the
      configured default in both directions.
- [ ] Callback check: returns `true` → allow; returns `false` → deny; returns `undefined` → deny
      (per `resolvePermissionCheck`'s "inconclusive callback never mistaken for undeclared"
      contract — must differ observably from an undeclared-action test only via the callback
      actually being invoked, e.g. via a spy).
- [ ] Callback receives exactly `{ user, data?, organization? }` — `organization` is `undefined`
      when `access.orgCollectionSlug` is not configured even if the caller passed one; present
      and forwarded verbatim when it is configured.
- [ ] Multi-role OR-merge: role A denies (`false`), role B allows (`true`) → overall allow;
      both deny → overall deny; order of roles in the array does not affect the result.
- [ ] `throwOnDenied: true` + denied → throws `VexAccessError` carrying `{ resource, action }`
      (no `field`, since no `fields` was requested).
- [ ] `throwOnDenied: false` (default) + denied → returns `false`, never throws.
- [ ] `throwOnDenied: true` + allowed → returns `true`, never throws (throw path only reachable
      on deny).
- [ ] **`mode: "capability"`** — resolved check is a function → resolves to `true` without regard
      to `data` (function is never invoked, or is invoked and its result discarded — assert via
      spy that it is NOT invoked, since capability mode means "skip data-dependent evaluation").
- [ ] **`mode: "capability"`** — resolved check is a static `false` → still resolves `false`
      (explicit deny is not overridden by capability mode).
- [ ] **`mode: "capability"`** — resolved check is a static `true` → resolves `true`.
- [ ] **`mode: "capability"`** — multi-role OR-merge unchanged: one role's function check
      (→ `true` under capability mode) ORs with another role's static `false` → overall `true`.
- [ ] **`mode: "action"` (default, or explicit)** + resolved check is a function + `data` is
      `undefined` → throws `VexAccessError` whose message instructs the caller to pass `data` or
      use `mode: "capability"`; throws even when `throwOnDenied` is `false` (this throw is a
      programmer-error guard, not the normal deny path).
- [ ] `mode: "action"` + function check + `data` provided → unchanged existing behavior (resolves
      the callback's boolean normally, no throw).
- [ ] `mode: "action"` + **static** boolean/wildcard check (no function involved) + `data`
      `undefined` → resolves normally, no throw (the throw is specific to unresolved function
      checks, not to `data` being absent in general).
- [ ] `mode: "action"` + multi-role: one role's check is a static allow, another role's check is
      a function with `data` undefined → short-circuits to `true` **without** throwing (an
      already-decided OR-merge must not force evaluation of an ambiguous sibling role).
- [ ] `mode: "action"` + multi-role: every role whose check would resolve needs a function with
      no `data`, and none is a static allow → throws.
- [ ] Boolean-only `fields` param (field-mode objects removed): passing `fields: ["title","slug"]`
      against a plain boolean/callback check applies the single resolved boolean uniformly to
      every requested field (AND-over-requested degenerates to the one merged value — verify it
      is neither dropped nor produces a mismatched per-field result now that no per-field
      resolution mechanism exists).
- [ ] `fields` omitted but `data` provided → `data`'s own keys drive the same AND-over-fields
      pass-through described above (still yields a single boolean, using `Object.keys(data)`).
- [ ] Built-in `adminPanel` subject: `hasPermission({ resource: "adminPanel", action: "access" })`
      resolves through the identical role/wildcard/default machinery as a real resource (boolean
      shorthand, per-action map, role wildcard, `defaultPermissionMode` all apply); `impersonate`
      action covered separately from `access`.
- [ ] Org-aware fixture: `access.orgCollectionSlug` configured + `organization` passed → callback
      receives it; `access.orgCollectionSlug` undefined + `organization` passed anyway →
      callback still receives `undefined` (org is stripped, not merely optional).

### 2. Collections API guards — `packages/core/src/api/access.test.ts` **(new file)**

Using `convex-test` against `create`/`update`/`remove`/`get`/`find`/`search` in
`packages/core/src/api/{create,update,remove,get,find,search}/server.ts`.

- [ ] `create`: denied role → throws `VexAccessError` (action `"create"`); allowed role → resolves
      the new id and the document is actually present via a follow-up `ctx.db.get`.
- [ ] `create`: `args.auth` omitted entirely (no RBAC / `config.access` on but no auth passed) →
      `user: args.auth?.user ?? {}` = `{}` → treated as authenticated-with-no-roles, not a bypass.
- [ ] `create`: `args.auth = { user: null }` (unauthenticated, per `VexApiAuth`) → `user ?? {}` =
      `{}` → empty role list → deny → throws, for every configured role's permission matrix.
- [ ] `create`: `config.access === undefined` → no `hasPermission` call at all (assert via spy /
      by using a config with `access` unset and a `user` that would fail every role) — insert
      always succeeds.
- [ ] `update`: denied → throws `VexAccessError` (action `"update"`); allowed → document patched
      with exactly the merged fields.
- [ ] `update`: `hasPermission` is called with `data: args.data` — the **incoming patch payload**,
      not the pre-existing document (confirm a callback keyed on the new values, e.g.
      `update: ({ data }) => data.status !== "locked"`, sees the patch, not the stored doc).
- [ ] `update`: unauthenticated (`auth: { user: null }`) → denies for every role.
- [ ] `remove`: denied → throws `VexAccessError` (action `"delete"`); allowed → document removed
      (hard delete) or `softDelete` field flipped to `true` when `softDelete` is provided.
- [ ] `remove`: `hasPermission` is called with `data: doc ?? undefined` — the **existing document**
      fetched via `ctx.db.get(id)` before deletion (confirm a callback keyed on stored fields,
      e.g. ownership check `data.authorId === user._id`, sees the pre-delete doc).
- [ ] `remove`: id that no longer resolves to a document (`ctx.db.get` returns `null`) →
      `hasPermission` called with `data: undefined`; a callback that only handles `data` present
      must resolve per its own `undefined`-handling (denies unless it explicitly allows).
- [ ] `remove`: bulk `ids` array with a per-doc callback that allows doc A and denies doc B →
      the whole call throws on the first denied id (`Promise.all` + `throwOnDenied: true`) and
      doc A is NOT removed either (no partial application — see Regression guard, item 10).
- [ ] `remove`: unauthenticated → denies for every role.
- [ ] `get`: denied (post-populate `hasPermission` check) → **returns `null`**, does not throw
      (target Step 10 behavior — replaces today's `throwOnDenied: true`); allowed → returns the
      populated document.
- [ ] `get`: document not found (`ctx.db.get` returns `null`) → returns `null` before any
      permission check runs (no `hasPermission` call for a nonexistent doc).
- [ ] `get`: `config.access === undefined` → returns the document unconditionally, no check run.
- [ ] `get`: unauthenticated → `null` for every collection with any role requirement.
- [ ] `find` (no pagination): denied docs are filtered out of the returned array; count of
      returned docs equals count of docs the resolved role can read, not the total row count.
- [ ] `find` (no pagination): mixed allow/deny — some docs pass a callback (e.g.
      `read: ({ data, user }) => data.ownerId === user._id`) and others don't → only the
      caller-owned docs are returned; `hasPermission` is called per-doc (no `throwOnDenied`,
      filter never throws even on deny).
- [ ] `find` with `limit`: filtering happens on the already-`take`n page (post-fetch filter, not
      pre-fetch) — verify a `limit: 2` request against 3 total docs where 1 of the first 2 is
      denied returns only 1 doc (limit is not compensated after filtering).
- [ ] `find` with `paginationOpts` (no `totalDocs`): `page` is filtered; `isDone`/`continueCursor`
      pass through from the underlying Convex pagination untouched.
- [ ] `find` with `paginationOpts.totalDocs: true` and `cursor` unset, `isDone: true` →
      `totalDocs` equals `finalDocs.length` (the filtered page, not a separate count query).
- [ ] `find` with `paginationOpts.totalDocs: true`, not done → runs a second full `collect()` +
      filter for the count; `totalDocs` equals the filtered count, independent of `page`'s size.
- [ ] `find` with `paginationOpts.totalDocs: true`, count `collect()` throws (simulate >32k rows
      or a thrown error) → caught, `totalDocs: null`, `page` still returned.
- [ ] `find`: `config.access === undefined` → no filtering, full page/array returned unchanged.
- [ ] `search`: identical filter/count matrix as `find` — unfiltered `collect()`/`take()`/
      `paginate()` branches, `totalDocs` short-circuit on `isDone` unavailable (search always
      re-`collect()`s for the count, verify the re-query uses the same search params), thrown
      count query → `totalDocs: null`.
- [ ] Guard called with no `access` config present at all on a subject that isn't in
      `access.roles`/`permissions` (e.g. a resource string with zero matrix entries) → resolves
      through `defaultPermissionMode`, not a crash.

### 3. Globals — `packages/core/src/api/globals/{get,find,upsert}.server.test.ts`

- [ ] `get.server.test.ts` — `getGlobal`: denied → **returns `null`** (target Step 10 behavior,
      replaces today's `throwOnDenied: true`); allowed → returns the flattened document.
- [ ] `get.server.test.ts` — `getGlobal`: no row for `slug` → returns `null` before any permission
      check (mirrors collection `get`'s not-found short-circuit).
- [ ] `get.server.test.ts` — `getGlobal`: unauthenticated (`auth: { user: null }`) → `null` for a
      global whose config requires a role.
- [ ] `get.server.test.ts` — `getGlobal`: `config.access === undefined` → returns unconditionally.
- [ ] `find.server.test.ts` — `findGlobals`: **mixed allow/deny across different globals** — e.g.
      role can read `siteSettings` but not `secretsGlobal` — only the allowed global's row is
      returned; the check runs per-row filter (`Array.filter`), so a denied row is silently
      dropped, **never throws** even though other API surfaces use `throwOnDenied`.
- [ ] `find.server.test.ts` — `findGlobals`: filter uses `resource: r.slug` (per-row, not a single
      resource) — verify a role allowed on global A and denied on global B, both present in
      `vex_globals`, returns exactly `[A]`.
- [ ] `find.server.test.ts` — `findGlobals`: unauthenticated → empty array when every global
      requires a role; `config.access === undefined` → all rows returned unfiltered.
- [ ] `upsert.server.test.ts` — `upsertGlobal`: denied → throws `VexAccessError` (action
      `"update"`) **before** Zod validation and before any DB write — assert the row is unchanged
      / not created (see Regression guard, item 10).
- [ ] `upsert.server.test.ts` — `upsertGlobal`: allowed → patches an existing row or inserts a new
      one; unauthenticated → denies (throws) regardless of `globalConfig` existing.
- [ ] `upsert.server.test.ts` — `upsertGlobal`: unregistered `slug` (no matching `globalConfig`)
      throws `ConvexError` **before** the permission check runs — order matters, verify via a
      denied-role + bad-slug combination that the `ConvexError` (not `VexAccessError`) surfaces.

### 4. Media — `packages/core/src/media/api/{mutations,queries}.test.ts` **(new files)**

- [ ] `mutations.test.ts` — `generateUploadUrl`: denied → throws `VexAccessError` (action
      `"create"`, `resource: args.collection`); allowed → returns `{ url }` from the resolved
      adapter.
- [ ] `mutations.test.ts` — `generateUploadUrl`: unauthenticated → denies; `config.access ===
undefined` → skips the check entirely, still resolves the adapter and errors with
      `VexStorageConfigError` if the adapter name doesn't match (permission and storage-config
      errors are independent failure modes — verify order: permission check runs first).
- [ ] `mutations.test.ts` — `createMediaDocument`: denied → throws `VexAccessError` (action
      `"create"`); allowed → adapter's `createMediaDocument` invoked with the full field set
      (`storageId`, `filename`, `mimeType`, `size`, `alt`, `adapterFields`).
- [ ] `mutations.test.ts` — `deleteMedia`: denied → throws `VexAccessError` (action `"delete"`,
      `resource` = the slug resolved via `resolveCollectionSlug` from `args.mediaId`, not a
      hardcoded media collection name); allowed → adapter's `deleteMedia` invoked, respects
      `softDelete`.
- [ ] `mutations.test.ts` — `deleteMedia`: `resolveCollectionSlug` returns `undefined` (id doesn't
      match any registered collection) → `hasPermission` called with `resource: undefined` —
      verify this denies (unknown/undefined resource never matches a configured role's matrix)
      rather than throwing a lookup error or silently allowing.
- [ ] `mutations.test.ts` — unauthenticated → denies on all three mutations.
- [ ] `queries.test.ts` — `getUrl`: denied → throws `VexAccessError` (action `"read"`); allowed →
      returns the adapter's resolved URL.
- [ ] `queries.test.ts` — `getUrl`: `config.access === undefined` → skips the check; adapter not
      found → returns `{ error: "Adapter \"<name>\" not found" }` (not a thrown error) — verify
      this returns even when access is on and the check passed.
- [ ] `queries.test.ts` — `getUrl`: unauthenticated → denies.

### 5. `resolveGetAuth` — `packages/core/src/api/server.test.ts` **(new file)**

- [ ] `config.access === undefined` → returns `undefined` **without ever invoking** `getAuth`
      (assert via spy — zero auth overhead when RBAC is off, per the function's own contract).
- [ ] `config.access` set, `getAuth` omitted → throws `VexAccessConfigError` with a message
      naming `collectionsApi`/`vex.ts` misconfiguration.
- [ ] `config.access` set, `getAuth` provided, authenticated → returns exactly what `getAuth(ctx)`
      resolved (`{ user, organization? }`), forwarded unmodified.
- [ ] `config.access` set, `getAuth` provided, unauthenticated (`getAuth` resolves `{ user: null }`
      or `undefined`) → `resolveGetAuth` returns that value as-is; downstream guards are what
      turn it into a deny (this function does not itself default `user` to `{}`).
- [ ] `collectionsApi`/`globalsApi` end-to-end: each returned handler (`find`, `get`, `search`,
      `create`, `update`, `remove`, `get`/`find`/`upsert` on globals) calls `resolveGetAuth`
      exactly once per invocation and forwards the result as `auth` to the underlying server
      function — verify via a `getAuth` spy call-count per handler invocation, not per document.

### 6. `createGetAuth` — `packages/better-auth/src/convex/getAuth.test.ts` **(new file)**

- [ ] `ctx.auth.getUserIdentity()` resolves `null` (no session) → returns `{ user: null }`.
- [ ] Valid `identity.subject` but `ctx.db.get(userCollectionSlug, id)` resolves `null` (token for
      a deleted user) → returns `{ user }` where `user` is `null` (not `{}` — matches the deleted
      user still-null contract).
- [ ] Valid identity, `resolveOrgs` omitted/`false` → returns `{ user }` only, **no** `organization`
      key at all (not `organization: undefined` vs the key being absent — assert with
      `"organization" in result` if the distinction matters to consumers, else `toEqual`).
- [ ] Valid identity, `resolveOrgs: true`, `identity.sessionId` present, session doc has
      `activeOrganizationId` → returns `{ user, organization }` with the resolved org document.
- [ ] Valid identity, `resolveOrgs: true`, `identity.sessionId` **absent** → `session` lookup
      skipped (`sessionId ? ... : null`), returns `{ user, organization: undefined }`.
- [ ] Valid identity, `resolveOrgs: true`, session exists but has no `activeOrganizationId` →
      `organization: undefined`.
- [ ] Valid identity, `resolveOrgs: true`, `activeOrganizationId` points at a deleted org
      (`ctx.db.get` returns `null`) → `organization: undefined` (the `?? undefined` fallback,
      not a thrown error).
- [ ] Documents are read fresh per call — two consecutive calls after a role change on the user
      doc between them return different `user.roles` (guards against any caching assumption).

### 7. `me` endpoint — `packages/core/src/api/server.test.ts`

- [ ] Authenticated caller → `me` resolves the same `{ user, organization? }` shape
      `resolveGetAuth`/`getAuth` produced for that request (no additional transformation/leakage
      of fields beyond what `getAuth` returned).
- [ ] Unauthenticated caller → `me` resolves `{ user: null }` (never throws — this is a read of
      "who am I," not a gated resource; there is no `VexAccessError` path here).
- [ ] `config.access === undefined` (RBAC off) → `me` still resolves the raw `getAuth` result if
      `getAuth` is configured independently, or a defined "RBAC off" shape if not — pin down
      whichever this factory settles on and assert it explicitly (this is the one endpoint whose
      contract does NOT gate on `config.access`, since callers need `me` to bootstrap admin UI
      permission state before any resource check runs).
- [ ] `me` never accepts a client-supplied identity argument — its validator takes no `user`/
      `organization` args (mirrors `collectionsApi`'s "identity never crosses the wire" guarantee
      for every other endpoint); assert the generated function's arg validator is `{}`.

### 8. Client permission context + `usePermission` (Steps 8–9) — `packages/react/src/hooks/usePermission.test.tsx` **(new)**

- [ ] `usePermission({ resource, action })` (no `data`, capability mode) returns `true` for a
      role with a data-dependent callback on that action; `false` for an explicit deny/static
      `false`; `false` when `access` is `undefined` OR `user` is `null` (fail-closed default).
- [ ] `usePermission({ resource, action: "update", data: doc })` (action mode) returns the
      exact per-doc result — `true` for a matching owner-callback doc, `false` for a
      non-matching one; changing the passed `data` flips the result (reactivity contract).
- [ ] `adminPanel`/`access`: allowed vs. denied fixtures drive show/hide of the admin entry.
- [ ] `VexAccessProvider` value is the raw config WITH callbacks (a bundler import), not the
      sanitized `ClientVexConfig` — a callback-bearing role resolves correctly through the hook
      (guards that `access` is NOT stripped on this path).
- [ ] `VexAuthContext` default `{ user: null }` → every `usePermission` denies until seeded.
- [ ] `AdminSidebar`/`AdminTopNav`: given contexts where collection X's `read` capability is
      `false`, its nav link is omitted; `true` → rendered. Cover a collection, a global, and a
      media collection; plus `adminPanel.access` false → admin entry hidden.
- [ ] `CollectionEditView`/`GlobalEditView`: `usePermission` update-denied → Save `disabled` and
      inputs `readOnly`; allowed → interactive. `CollectionListView`/`MediaCollectionListView`:
      create-denied → Create button absent; delete-denied → row selection/bulk actions off.
- [ ] No FOUC: with `access` (import) and `user` (prop) both present at first render, the
      sidebar renders its filtered set on the initial pass — assert no all-links-then-filtered
      transition (e.g. first committed render already excludes denied links).

### 9. `defineConfig`-time access validation (Step 4/10 open item) — `packages/core/src/config/config.test.ts`

- [ ] `config.access.userCollectionSlug` names a slug absent from the merged `collections` array
      → `console.warn` called exactly once, message names the offending slug; `defineConfig`
      still returns a config (warning, not a thrown error).
- [ ] `userCollectionSlug` resolves to a real collection, but `userRolesField` is missing from
      that collection's `fields` → warns once, naming both the field and the collection slug.
- [ ] `userCollectionSlug` resolves, `userRolesField` resolves to a field whose `type` is neither
      `"text"` nor `"array"` (e.g. `"number"` or `"boolean"`) → warns once, message states the
      required types and the field's actual type.
- [ ] Valid `{ userCollectionSlug, userRolesField: "text"-typed field }` → no warning.
- [ ] Valid `{ userCollectionSlug, userRolesField: "array"-typed field }` → no warning.
- [ ] `config.access` entirely absent → no validation runs, no warnings, `getAuth`/roles machinery
      untouched.
- [ ] Validation only runs when `process.env.NODE_ENV !== "production"` (mirrors `defineAccess`'s
      own dev-only warnings) — set `NODE_ENV=production` and assert zero `console.warn` calls
      even with an invalid `userCollectionSlug`/`userRolesField` pair.
- [ ] Warnings never throw and never mutate the returned config's `access` object — a
      misconfigured `userRolesField` degrades to "every check denies" at runtime (per
      `hasPermission`'s empty-roles path), not a build failure.

### 10. Regression guard — denied write never mutates the DB

Cross-cutting: for every mutation path above, pair the "denied → throws" assertion with a direct
DB-state check taken before and after the call.

- [ ] `create` (denied): `ctx.db.query(collection).collect()` row count is unchanged after the
      thrown call (no partial insert).
- [ ] `update` (denied): re-`ctx.db.get(id)` after the thrown call returns the document
      byte-for-byte equal to its pre-call state (no partial patch).
- [ ] `remove` (denied, single id): `ctx.db.get(id)` after the thrown call still resolves the
      document (not deleted, not soft-deleted).
- [ ] `remove` (denied, bulk `ids` with one allowed + one denied): **neither** document is
      removed — the allowed one is not committed just because it was processed before the
      denied one threw (`Promise.all` short-circuits the whole batch on first rejection; no
      compensating rollback is needed only because nothing committed).
- [ ] `upsertGlobal` (denied): the `vex_globals` row for that slug (if it existed) is unchanged;
      if it didn't exist, no row is created.
- [ ] `createMediaDocument` / `generateUploadUrl` (denied): no media document row created, no
      adapter method invoked (assert via spy that the adapter's `generateUploadUrl`/
      `createMediaDocument` is never called when the permission check throws first).
- [ ] `deleteMedia` (denied): underlying storage file/document untouched, adapter's `deleteMedia`
      never invoked.

## Verification

- `pnpm --filter @vexcms/core test` — full core suite green (access, config, api groups).
- `pnpm --filter @vexcms/core build` — clean build, no TypeDoc warnings on new exports.
- `pnpm --filter www typecheck && pnpm --filter www build` — www compiles with access wired
  and the permissions stub deleted.
- Smoke: with a `user`-role session, a denied write (e.g. `users` delete) through the Convex
  API throws `VexAccessError`; `find` on a read-restricted collection returns only permitted
  docs; admin role unaffected.
