---
status: draft
spec_id: 2026-08-12-rbac-access-control
touches:
  - "packages/core/src/access/**"
  - "packages/core/src/config/types.ts"
  - "packages/core/src/config/config.ts"
  - "packages/core/src/config/sanitizeConfig.ts"
  - "packages/core/src/api/server.ts"
  - "packages/core/src/index.ts"
  - "apps/www/src/vexcms/access.ts"
  - "apps/www/src/vex.config.ts"
  - "apps/www/src/auth/permissions.ts"
  - "apps/www/convex/vex/**"
prompt_version: 1
---

# 2026-08-12-rbac-access-control — Spec

## Overview

Reimplements RBAC from scratch for the rebuild (no master merge planned; rebuild will be
promoted). New `packages/core/src/access/` module: roles x subjects x actions permission
matrix authored as one typed constant, checked at runtime by a pure, synchronous
`hasPermission({...}) => boolean | field-map`. Unlike master, every checkable thing is a
*subject*: collections and globals (CRUD + draft actions), the core-provided `adminPanel`
subject, and arbitrary user-declared `customResources` with their own action unions.
Enforcement lands once, in the server API factories (`queryApi`/`mutationApi`/`globalsApi`)
via an optional `getAuth` seam. Design rationale and variant comparison:
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
    seedData: ["reset"],                       // arbitrary non-collection subject
    // reviews: { actions: ["approve"], data: dataType<{ queue: string }>() },
  },
  userCollection: { slug: TABLE_SLUG_USERS },
  defaults: "allow",
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
explicit action > subject `"*"` > role `"*"` > `defaults`.

### hasPermission — one call shape for collections, globals, admin panel, custom gates

```ts
// Before (master) — separate checkAdminAccess() + magic `admin` key in the matrix
checkAdminAccess({ access, user, userRoles })

// After — everything is a subject; action unions are typed per subject
hasPermission({ access, user, userRoles, resource: "pages", action: "update" })            // boolean
hasPermission({ access, user, userRoles, resource: "adminPanel", action: "access" })       // boolean
hasPermission({ access, user, userRoles, resource: "seedData", action: "reset" })          // boolean
hasPermission({ access, user, userRoles, resource: "pages", action: "publish" })           // draft action (versions.drafts)
hasPermission({ access, user, userRoles, resource: "user", action: "update",
  fields: ["name", "email"] })                                       // → { name: boolean, email: boolean }
hasPermission({ access, user, userRoles, resource: "pages", action: "delete",
  data: page, throwOnDenied: true })                                 // throws VexAccessError on deny
```

### Server factories — enforcement lands once, via the getAuth seam

```ts
// Before — apps/www/convex/vex.ts: no access control anywhere
export const { find, get, search } = queryApi(config, query)

// After — same factories, one optional options param; omitted = behavior unchanged
import { getAuth } from "./vex/auth"
export const { find, get, search } = queryApi(config, query, { getAuth })
export const { create, update, remove } = mutationApi(config, mutation, { getAuth })
export const { get: globalGet, find: globalFind, upsert } = globalsApi(config, query, mutation, { getAuth })
// writes throw VexAccessError on deny; reads filter denied docs / return null
```

### Client boundary — access never ships to the browser

```ts
// sanitizeConfigForClient(config) → ClientVexConfig has NO access key
// (callbacks don't serialize; permission rules are not client data)
```

## API Surface

| Import | Symbol | Signature | Purpose |
| --- | --- | --- | --- |
| `@vexcms/core` | `defineAccess` | `(props: VexAccessInput<…>) => VexAccessConfig<SubjectMap<…>>` | Build the typed access config constant |
| `@vexcms/core` | `hasPermission` | `(props: { access, user, userRoles, resource, action, data?, organization?, fields?, throwOnDenied? }) => boolean \| ResolvedFieldPermissions` | Pure sync permission check; field map when `fields` passed |
| `@vexcms/core` | `dataType` | `<T>() => DataTypeCarrier<T>` | Phantom data-type carrier for `customResources` |
| `@vexcms/core` | `resolvePermissionCheck` / `mergeRolePermissions` | see Step 3 | Advanced: single-check resolution / multi-role OR merge |
| `@vexcms/core` | `VexAccessError` | `new (message, { resource, action, field? })` | Thrown by `throwOnDenied`; structured denial context |
| `@vexcms/core` | `VexAccessConfigError` | `new (message)` | Thrown by `defineAccess` on hard config errors |
| `@vexcms/core/server` | `queryApi` / `mutationApi` | `(config, builder, options?: VexApiOptions)` | Factories gain optional enforcement seam (3rd param) |
| `@vexcms/core/server` | `globalsApi` | `(config, query, mutation, options?: VexApiOptions)` | Same seam, 4th param |
| `@vexcms/core/server` | `VexApiAuth` / `VexApiOptions` | `{ user, roles }` / `{ getAuth?: (ctx) => Promise<VexApiAuth \| null> }` | Auth resolution contract for the factories |

## Progress Checklist

- [ ] Step 1 — Access module types + errors (`access/types.ts`)
- [ ] Step 2 — `defineAccess` builder + tests (`access/config.ts`)
- [ ] Step 3 — `hasPermission` resolver + tests (`access/hasPermission.ts`, `access/index.ts`)
- [ ] Step 4 — Config integration + public exports (VexConfig `access`, sanitize strip, `index.ts`)
- [ ] Step 5 — Server API enforcement seam (`api/types.ts`, `api/server.ts`, `api/access.test.ts`)
- [ ] Step 6 — www wiring + stub removal (`access.ts`, `vex.config.ts`, `convex/vex/auth.ts`, delete `permissions.ts`)

## Design Decisions

1. **Variant B — unified subjects.** One vocabulary: `hasPermission({ resource, action })`
   for collections, globals, admin panel, and custom gates alike. Why: one mental model,
   typed action unions per subject, master-parity call ergonomics.
2. **`customResources`, not `custom`.** Declares non-collection subjects
   (array shorthand `["create", "revoke"]` or `{ actions, data: dataType<T>() }`). Why: the
   check site reads `resource:`, so declaring them as resources keeps the vocabulary honest.
3. **Typed `data` flows end-to-end.** A `dataType<T>()` carrier on a custom resource types
   both the callback's `data` prop AND the `data` argument `hasPermission` accepts for that
   subject. Why: compile-time proof the caller passes what checks consume.
4. **Callbacks allowed on every subject** (collections, globals, customResources). A callback
   is just one kind of `PermissionCheck`. Why: row-level *logic* without row-level storage.
5. **`adminPanel` built-in subject replaces master's `adminRoles` + `checkAdminAccess`.**
   Actions: `access`, `impersonate`. Why: adminRoles duplicated what permissions already
   express; one fewer concept.
6. **Draft actions ride the resource subject.** `readDrafts | saveDraft | publish | unpublish`
   auto-added to subjects whose config has `versions.drafts: true` (globals today;
   collections when Spec 36 lands — machinery is forward-compatible). Why: draft gating is
   naturally per-collection; no separate "drafts" concept to configure.
7. **`defaults: "allow" | "deny"`, default `"allow"`.** Master parity by default; deny
   posture opt-in for hardened configs. Undeclared role/subject/action resolves to this.
   Why: a forgotten `dangerZone` declaration shouldn't silently allow — but flipping the
   default would break master-shaped mental models.
8. **Single input type, optional `organizationCollection`.** No with/without-org overload
   pair (master had two). When present, `organization` is typed in every callback; when
   absent it is `never`. No `userOrgField` (master used it only for a dev warning).
   Why: half the generic surface for the same capability.
9. **Multi-role merge: OR, allow wins over deny** — per action and per field. Empty or
   all-unknown `userRoles` deny. `access: undefined` allows everything (system off).
   Why: master parity; its 1272-line test suite encodes these semantics and ports directly.
10. **Enforcement in the API factories, not generated files.** `queryApi`/`mutationApi`/
    `globalsApi` accept `options?: { getAuth }`; omitted = behavior unchanged. Why: one seam
    covers every collection and global; master's per-generated-file guards were N copies of
    the same block.
11. **Read filtering is post-query.** Convex cannot push predicates into indexes; `find` is
    limit-based (not `paginationOpts`), so filtering denied docs is safe here. Why: honest
    about the platform; the paginated-admin-list story belongs to the admin enforcement spec.
12. **`access` stripped from client config entirely.** Server-only; the admin UI will get a
    computed permission snapshot in a follow-up spec. Why: callbacks don't serialize, and
    permission rules are not client data.
13. **Config stays one typed constant** imported into `vex.config.ts`. Per-collection/global
    inline `access` is intentionally unsupported. Why: developer preference — single place to
    audit; forces every project into the same auditable layout.
14. **Matrix shape stays serialization-compatible** (callbacks are the only non-data checks).
    Why: keeps the future DB-stored-roles path (`buildAccess(roleDocs)`) additive — same
    evaluator, no rewrite.

15. **Wildcards at two levels, one resolver util.** Role-level `"*": boolean` (covers
    undeclared subjects); action-level `"*": PermissionCheck` inside a per-action map
    (covers undeclared actions on that subject — booleans, mode objects, and callbacks all
    valid, enabling `pages: { "*": true, delete: cb }`). Precedence: explicit action >
    subject `"*"` > role `"*"` > `defaults`; wildcards never cross subject boundaries.
    Role-level stays boolean-only because a role-wide callback would receive a union of
    every subject's `data`. Why: "everything except X" is otherwise inexpressible, and the
    whole feature is one module-private util (`resolveActionCheck`), not a new layer.

## Out of Scope

- Row-level ACL storage (per-document permission configs) — rejected; callbacks + userland
  `acl` fields cover it (research doc §row-level).
- DB-stored roles / role-editor tooling (`vex_roles`, `buildAccess`) — future spec; design
  keeps the seam.
- Admin panel UI enforcement (nav hiding, field readOnly, impersonation UI) and the client
  permission snapshot (`resolvePermissionSnapshot`) — follow-up spec.
- Field-level enforcement in form rendering.
- Drafts/versioning enforcement semantics beyond declaring the action unions (Spec 36 owns
  the verbs and storage).
- Org-aware www wiring (www config omits `organizationCollection` for now; core supports it).
- Migration of master apps — the rebuild replaces master wholesale.

## Implementation

### Step 1 — Access module types + errors [agent]

Create `packages/core/src/access/types.ts`: subject registry machinery, permission check types, error classes.

- [x] Create `packages/core/src/access/types.ts`
- [x] Implement all contract types: `CrudAction`, `DraftAction`, `AccessDefaults`, `FieldPermissionResult`, `ResolvedFieldPermissions`, `PermissionCallbackProps`, `PermissionCheck`, `SubjectEntry`, `SubjectMap`
- [x] Implement `dataType()` function and `DataTypeCarrier` phantom type
- [x] Implement input/config types: `CustomResourceInput`, `VexAccessInput`, `VexAccessConfig`
- [x] Implement error classes: `VexAccessError`, `VexAccessConfigError`
- [x] JSDoc every exported symbol (TypeDoc-clean, zero warnings)
- [x] Run build: `pnpm --filter @vexcms/core build` ✓ Success
- [x] **Registry-based inference:** Data/field types read from `DocumentBySlug`, `GlobalDocumentBySlug`, `CollectionsFieldTypeMap`, `GlobalsFieldTypeMap` via GeneratedVexTypes augmentation; fallbacks until `vex generate` runs.
- [x] **Structural resource bounds:** `TResources extends readonly { slug: string; versions?: { drafts?: boolean } }[]` permits full configs AND minimal inline objects like `{ slug: "user" }`; DraftAction gated on `versions.drafts` flag.

**Implementation notes:**

- **Registry-based inference (replacement for placeholders):** Data types inferred from `DocumentBySlug[slug]` (collections) and `GlobalDocumentBySlug[slug]` (globals) via the GeneratedVexTypes augmented registry. Field keys extracted as value union from `CollectionsFieldTypeMap[slug]` / `GlobalsFieldTypeMap[slug]` (all field names across all field types). Falls back to `Record<string, unknown>` and `string` before `vex generate` augments the registry — no compile errors pre-generation.
- **Structural resource bounds:** `TResources extends readonly { slug: string; versions?: { drafts?: boolean } }[]` allows full `CollectionConfig` / `GlobalConfig` objects AND minimal inline `{ slug: "user" }` shapes (for better-auth adapter-owned tables). DraftAction included in action union when the resource entry's `versions.drafts === true`.
- **User/org callback types:** `PermissionCallbackProps` uses registry: `data: DocumentBySlug[TUserCollection["slug"]]` for user docs, `organization: DocumentBySlug[TOrgCollection["slug"]]` for org docs. Typing comes from registry; object only carries the slug.
- **Phantom type pattern:** `VexAccessConfig.__subjects` (declare readonly) carries `SubjectMap` for hasPermission inference without runtime footprint.
- **Error classes:** Follow auth module pattern: extend Error, set name property in constructor, carry structured fields.

```typescript
import type { CollectionConfig } from "../collections";
import type { GlobalConfig } from "../globals";
import type {
  DocumentBySlug,
  GlobalDocumentBySlug,
  CollectionsFieldTypeMap,
  GlobalsFieldTypeMap,
} from "../types/generated";

/**
 * CRUD action set — the four core database operations.
 *
 * All resource subjects (collections and globals) support these actions.
 * Draft actions ({@link DraftAction}) are added conditionally when a resource
 * has `versions.drafts === true`.
 */
export type CrudAction = "create" | "read" | "update" | "delete";

/**
 * Draft-specific actions — conditional, only present on resources with versioning.
 *
 * Collections and globals that declare `versions.drafts: true` gain this set
 * of actions for controlling read access to unpublished versions and draft
 * publication/unpublication workflows.
 */
export type DraftAction = "readDrafts" | "saveDraft" | "publish" | "unpublish";

/**
 * Default permission posture when a role, subject, or action is not explicitly
 * declared in the permission matrix.
 *
 * - `"allow"` (default): undeclared = allow.
 * - `"deny"`: undeclared = deny, require explicit permission.
 */
export type AccessDefaults = "allow" | "deny";

/**
 * Single permission check result — boolean (shorthand: all fields or no fields)
 * or field-mode object (restrict to named fields).
 *
 * @typeParam TFieldKeys - Union of valid field keys for this resource.
 */
export type FieldPermissionResult<TFieldKeys extends string> =
  | boolean
  | { mode: "allow" | "deny"; fields: TFieldKeys[] };

/**
 * Resolved field-level permissions after a check with fields requested.
 *
 * A map of field name → access boolean (true = allowed, false = denied).
 */
export type ResolvedFieldPermissions = Record<string, boolean>;

/**
 * Props passed to a permission callback — typed conditionally based on resource
 * and organization support.
 *
 * When `TData` is `never`, the `data` key is omitted.
 * When `TOrg` is `never`, the `organization` key is omitted.
 *
 * @typeParam TData - Document type for the resource; `never` if not applicable.
 * @typeParam TUser - User object shape.
 * @typeParam TOrg - Organization object shape; `never` if not configured.
 */
export type PermissionCallbackProps<TData, TUser, TOrg> = {
  ...(TData extends never ? {} : { data: TData }),
  user: TUser,
  ...(TOrg extends never ? {} : { organization: TOrg }),
};

/**
 * A single permission check — static boolean, field-mode object, or callback.
 *
 * The callback receives context (user, data, organization) and may return a field
 * permission result or `undefined` (interpreted as deny).
 *
 * @typeParam TData - Document type for the resource.
 * @typeParam TUser - User object shape.
 * @typeParam TOrg - Organization object shape; `never` if not configured.
 * @typeParam TFieldKeys - Union of valid field keys for this resource.
 */
export type PermissionCheck<TData, TUser, TOrg, TFieldKeys extends string> =
  | FieldPermissionResult<TFieldKeys>
  | ((props: PermissionCallbackProps<TData, TUser, TOrg>) => FieldPermissionResult<TFieldKeys> | undefined);

/**
 * A subject entry — the union of possible actions and the shape of data and
 * field names for a single checkable resource or gate.
 *
 * All subjects carry an `action` union (set of checkable action strings),
 * a `data` type (the document shape if data-aware, or `never` if not),
 * and a `fields` union (field names available in field-level checks).
 */
export interface SubjectEntry {
  /** Union of actions this subject supports (e.g., `"read" | "write" | "delete"`). */
  action: string;
  /** Document or context type; `never` for contexts without data. */
  data: unknown;
  /** Union of field keys; `never` for non-field-aware subjects. */
  fields: string;
}

// ──── Inference helpers (registry-based via GeneratedVexTypes augmentation) ────

/**
 * Extract the slug from a resource config (collection or global, or minimal { slug }).
 *
 * @internal
 */
type ExtractSlug<T> = T extends { slug: infer S extends string } ? S : never;

/**
 * Infer the document type from a resource slug via the generated registry.
 *
 * Reads `DocumentBySlug[slug]` for collections, `GlobalDocumentBySlug[slug]` for globals,
 * falling back to `Record<string, unknown>` before the build generates types.
 *
 * @internal
 */
type InferDocType<T> = T extends { slug: infer S extends string }
  ? S extends keyof DocumentBySlug
    ? DocumentBySlug[S]
    : S extends keyof GlobalDocumentBySlug
      ? GlobalDocumentBySlug[S]
      : Record<string, unknown>
  : Record<string, unknown>;

/**
 * Extract the union of all field keys for a resource slug via CollectionsFieldTypeMap or GlobalsFieldTypeMap.
 *
 * Returns the union of all field names (all values across all field types in the map).
 * Falls back to `string` when the slug is not yet augmented by `vex generate`.
 *
 * @internal
 */
type ExtractFieldKeys<T> = T extends { slug: infer S extends string }
  ? S extends keyof CollectionsFieldTypeMap
    ? CollectionsFieldTypeMap[S][keyof CollectionsFieldTypeMap[S]] & string
    : S extends keyof GlobalsFieldTypeMap
      ? GlobalsFieldTypeMap[S][keyof GlobalsFieldTypeMap[S]] & string
      : string
  : string;

/**
 * Test whether a resource config has versioning with drafts enabled.
 *
 * @internal
 */
type HasDrafts<T> = T extends { versions?: { drafts?: infer D extends boolean } }
  ? D extends true
    ? true
    : false
  : false;

/**
 * The complete subject registry — a record mapping resource slugs and custom
 * subject names to their entry (action union, data type, field keys).
 *
 * Includes:
 * - All resources (collections + globals) keyed by slug, with conditional
 *   DraftAction inclusion gated on `versions.drafts` flag.
 * - Custom subjects, each with its declared action union and no data/fields.
 * - The built-in `adminPanel` subject (actions: `"access" | "impersonate"`).
 *
 * @typeParam TResources - Tuple of resource configs ({ slug: string; versions?: { drafts?: boolean } }).
 * @typeParam TCustom - Record of custom subject names to action-union arrays.
 */
export type SubjectMap<
  TResources extends readonly { slug: string; versions?: { drafts?: boolean } }[],
  TCustom extends Record<string, readonly unknown[]>
> =
  // Resources: map each to its subject entry
  & {
    [R in TResources[number] as ExtractSlug<R>]: {
      action: CrudAction | (HasDrafts<R> extends true ? DraftAction : never);
      data: InferDocType<R>;
      fields: ExtractFieldKeys<R>;
    };
  }
  // Custom resources: map action arrays
  & {
    [K in keyof TCustom]: {
      action: TCustom[K][number];
      data: never;
      fields: never;
    };
  }
  // Built-in admin subject
  & {
    adminPanel: {
      action: "access" | "impersonate";
      data: never;
      fields: never;
    };
  };

/**
 * Phantom type carrier for custom resource data types.
 *
 * Used internally to preserve type information when declaring custom resources
 * in shorthand (action list) vs. long form (actions + optional dataType).
 * Runtime: returns an empty object; this type is compiled away.
 *
 * @typeParam T - The data type this carrier represents.
 *
 * @example
 * ```ts
 * customResources: {
 *   apiKey: {
 *     actions: ["create", "revoke"],
 *     data: dataType<{ key: string; secret: string }>(),
 *   },
 * }
 * ```
 *
 * @ignore
 */
export interface DataTypeCarrier<T = never> {
  readonly __phantom?: T;
}

/**
 * Custom resource input — shorthand or full form.
 *
 * - Shorthand: a list of action strings (e.g., `["create", "revoke"]`).
 * - Full: an object with `actions` (required) and optional `data` type carrier.
 */
export type CustomResourceInput =
  | readonly string[]
  | { actions: readonly string[]; data?: DataTypeCarrier<unknown> };

/**
 * Create a data-type carrier for use in custom resource declarations.
 *
 * This function has no runtime implementation; it exists solely to carry
 * type information. Call it with a generic type parameter to create a
 * carrier that preserves the type for callbacks and field inference.
 *
 * @typeParam T - The data type for this custom resource.
 * @returns A carrier object (purely for type inference).
 *
 * @example
 * ```ts
 * customResources: {
 *   audit: {
 *     actions: ["read", "export"],
 *     data: dataType<AuditLog>(),
 *   },
 * }
 * ```
 */
export function dataType<T>(): DataTypeCarrier<T> {
  return {};
}

/**
 * Per-role permission matrix, typed against the resolved {@link SubjectMap}.
 *
 * Each subject key accepts:
 * - `boolean` — resource-level shorthand (all actions allowed/denied).
 * - A per-action map whose keys are that subject's action union, plus the
 *   action-level wildcard `"*"` — each value is a full {@link PermissionCheck}
 *   (boolean, field-mode object, or callback). `"*"` sets the check for every
 *   action not explicitly declared on that subject, enabling
 *   "everything except X": `pages: { "*": true, delete: cb }`.
 *
 * The role-level wildcard `"*"` is boolean-only: a role-wide callback would
 * receive a union of every subject's `data`, which is deliberately unsupported.
 *
 * @typeParam TSubjects - The resolved {@link SubjectMap}.
 * @typeParam TUser - User doc type (registry lookup on the user collection slug).
 * @typeParam TOrg - Organization doc type, or `never` when no
 *   `organizationCollection` is configured.
 */
export type RolePermissions<
  TSubjects extends Record<string, SubjectEntry>,
  TUser,
  TOrg,
> = {
  [S in keyof TSubjects]?:
    | boolean
    | ({
        [A in TSubjects[S]["action"]]?: PermissionCheck<
          TSubjects[S]["data"], TUser, TOrg, TSubjects[S]["fields"]
        >;
      } & {
        "*"?: PermissionCheck<TSubjects[S]["data"], TUser, TOrg, TSubjects[S]["fields"]>;
      });
} & {
  /** Role-level wildcard: covers subjects this role never declares. Boolean only. */
  "*"?: boolean;
};

/**
 * Input shape for the `defineAccess` builder.
 *
 * Specifies roles, resources (collections + globals), custom subjects, user/org
 * collection bindings, and the permission matrix.
 *
 * @typeParam TRoles - Union of valid role names (inferred from `roles` array).
 * @typeParam TResources - Tuple of resource configs with `{ slug: string; versions?: { drafts?: boolean } }` shape.
 * @typeParam TCustom - Record of custom subject names → action arrays.
 * @typeParam TUserCollection - User resource with `{ slug: string }` shape (types inferred from registry).
 * @typeParam TOrgCollection - Organization resource with `{ slug: string }` shape; `undefined` if omitted.
 *
 * @see {@link VexAccessConfig} for the resolved runtime shape.
 */
export interface VexAccessInput<
  TRoles extends readonly string[],
  TResources extends readonly { slug: string; versions?: { drafts?: boolean } }[] = readonly [],
  TCustom extends Record<string, readonly unknown[]> = {},
  TUserCollection extends { slug: string } = { slug: string },
  TOrgCollection extends { slug: string } | undefined = undefined,
> {
  /**
   * List of role identifiers in this system.
   *
   * Role names are used as keys in the `permissions` matrix.
   * Example: `["admin", "editor", "viewer"]`.
   */
  roles: TRoles;

  /**
   * Resource configs (collections and globals) to include in the subject registry.
   *
   * Each resource contributes a subject keyed by its slug.
   */
  resources: TResources;

  /**
   * Custom, non-resource subjects with arbitrary action unions.
   *
   * Each entry is a subject name → action array mapping.
   * Actions are strings; the runtime does not restrict them.
   * Example: `{ apiKeys: ["create", "revoke"], analytics: ["view", "export"] }`.
   */
  customResources?: TCustom;

  /**
   * Collection config used to identify users and bind to the `organization` context.
   *
   * Callback permissions may reference `user` (a doc from this collection).
   */
  userCollection: TUserCollection;

  /**
   * Collection config for organizations (if applicable).
   *
   * When provided, the `organization` context is available in permission callbacks.
   * When omitted, organization context is never available.
   */
  organizationCollection?: TOrgCollection;

  /**
   * Default permission posture for undeclared subjects, actions, or fields.
   *
   * - `"allow"` (default): assume allow when no explicit rule is declared.
   * - `"deny"`: assume deny when no explicit rule is declared (whitelist model).
   *
   * @defaultValue `"allow"`
   */
  defaults?: AccessDefaults;

  /**
   * Permission matrix: role name → subject name → per-action checks.
   *
   * Typed via {@link RolePermissions} against the resolved {@link SubjectMap}:
   * subject keys, per-subject action unions, callback `data`/`organization`
   * props, and field-mode field keys are all compile-checked.
   *
   * Wildcards, by level:
   * - Role level — `"*": boolean` covers subjects the role never declares.
   * - Action level — `"*": PermissionCheck` inside a per-action map covers
   *   actions not explicitly declared on that subject (callbacks allowed).
   * Precedence: explicit action > subject `"*"` > role `"*"` > `defaults`.
   *
   * Example:
   * ```ts
   * permissions: {
   *   admin: { "*": true },
   *   editor: {
   *     pages: {
   *       "*": true,                                              // all actions…
   *       delete: ({ data }) => !["home", "pricing"].includes(data.slug), // …except this
   *     },
   *     adminPanel: false,
   *   },
   * }
   * ```
   */
  permissions: Record<
    TRoles[number],
    RolePermissions<
      SubjectMap<TResources, TCustom>,
      InferDocType<TUserCollection>,
      TOrgCollection extends { slug: string } ? InferDocType<TOrgCollection> : never
    >
  >;
}

/**
 * Resolved access configuration — the runtime shape returned by `defineAccess`.
 *
 * This type is intentionally minimal and type-erased at the value level; most
 * inference happens via the phantom `TSubjects` type parameter, which the builder
 * uses to preserve subject shape for `hasPermission` inference.
 *
 * The runtime config carries: roles, defaults, user/org collections, and the
 * permission matrix in normalized form.
 *
 * @typeParam TSubjects - Phantom type parameter: the resolved {@link SubjectMap}.
 *   Used for inference in {@link hasPermission}} signatures; erased at runtime.
 *
 * @see {@link VexAccessInput} for the input shape.
 * @see {@link hasPermission} for how this config is consumed.
 */
export interface VexAccessConfig<TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>> {
  /**
   * List of role names in this system.
   *
   * @internal
   */
  roles: readonly string[];

  /**
   * Default permission posture.
   *
   * @internal
   */
  defaults: AccessDefaults;

  /**
   * The user collection config bound to this access system.
   *
   * @internal
   */
  userCollection: unknown;

  /**
   * Organization collection config (if configured).
   *
   * @internal
   */
  organizationCollection?: unknown;

  /**
   * Permission matrix in normalized form.
   *
   * @internal
   */
  permissions: Record<string, Record<string, unknown>>;

  /**
   * Phantom field: carries the {@link SubjectMap} type for inference.
   *
   * This field is declared but never assigned or read at runtime.
   * TypeScript uses it to infer subject shape in {@link hasPermission}} overloads.
   *
   * @internal
   */
  declare readonly __subjects: TSubjects;
}

/**
 * Runtime error thrown when a permission check fails with `throwOnDenied: true`.
 *
 * Carries the resource, action, and (if applicable) the first denied field name.
 *
 * @example
 * ```ts
 * try {
 *   hasPermission({
 *     access, user, userRoles,
 *     resource: "pages", action: "delete",
 *     data: page,
 *     throwOnDenied: true,
 *   });
 * } catch (err) {
 *   if (err instanceof VexAccessError) {
 *     console.error(`Access denied: ${err.resource}.${err.action} on field ${err.field || "(all)"}`);
 *   }
 * }
 * ```
 */
export class VexAccessError extends Error {
  /**
   * The resource on which access was denied.
   */
  resource: string;

  /**
   * The action on the resource that was denied.
   */
  action: string;

  /**
   * The first field that was denied (if `fields` were checked); undefined otherwise.
   */
  field?: string;

  /**
   * @param message — Human-readable error message.
   * @param options — Additional error details.
   * @param options.resource — Resource name.
   * @param options.action — Action name.
   * @param options.field — First denied field name (optional).
   */
  constructor(
    message: string,
    options: {
      resource: string;
      action: string;
      field?: string;
    }
  ) {
    super(message);
    this.name = "VexAccessError";
    this.resource = options.resource;
    this.action = options.action;
    this.field = options.field;
  }
}

/**
 * Error thrown when access configuration is invalid.
 *
 * Raised by `defineAccess` when builders detects invalid input: role mismatches,
 * missing collections, or misconfigured resource/organization bindings.
 *
 * @example
 * ```ts
 * try {
 *   defineAccess({
 *     roles: ["admin"],
 *     resources: [pages, posts],
 *     permissions: {
 *       admin: { unknown_resource: true }, // unknown_resource not in resources
 *     },
 *   });
 * } catch (err) {
 *   if (err instanceof VexAccessConfigError) {
 *     console.error("Access config is invalid:", err.message);
 *   }
 * }
 * ```
 */
export class VexAccessConfigError extends Error {
  /**
   * @param message — Human-readable description of the configuration error.
   */
  constructor(message: string) {
    super(message);
    this.name = "VexAccessConfigError";
  }
}
```

Verify: `pnpm --filter @vexcms/core build`

### Step 2 — defineAccess builder + tests [dev]

- [ ] `packages/core/src/access/config.ts` (NEW)
- [ ] `packages/core/src/access/config.test.ts` (NEW)

`defineAccess` mirrors `defineCollection` (`collections/config.ts`) and `defineGlobal`
(`globals/config.ts`): one builder function, a single `props` object, full JSDoc, dev-only
`console.warn` validation. Unlike master's `defineAccess`, there is **no org / no-org
overload pair** — Variant B is a single input type; `organizationCollection` is just an
optional field (ratified decision, do not reopen). `TUserCollection`/`TOrgCollection` are
bound to the minimal `{ slug: string }` shape — matching master's own `defineAccess.ts`,
*not* a full `CollectionConfig` — so a project can pass a real `defineCollection()` result
**or** a plain `{ slug: "user" }` literal when no collection backs the user table (e.g. an
auth-adapter-owned table with no VexCMS collection, as in `apps/www`).

#### `packages/core/src/access/config.ts`

```ts
import type { CollectionConfig } from "../collections";
import type { GlobalConfig } from "../globals";
import {
  VexAccessConfigError,
  type CustomResourceInput,
  type SubjectMap,
  type VexAccessConfig,
  type VexAccessInput,
} from "./types";

/**
 * Defines the RBAC configuration for a VexCMS project.
 *
 * This is a builder function (like `defineCollection`/`defineGlobal`) that infers a
 * per-subject action/data/field union — the `SubjectMap` — from `resources` and
 * `customResources`, so `hasPermission()` calls against the returned config are fully
 * typed. Validates the matrix in non-production and returns a frozen, type-erased
 * `VexAccessConfig` for `defineConfig({ access })`.
 *
 * @typeParam TRoles - Tuple of role name string literals.
 * @typeParam TResources - Tuple of collection/global configs contributing CRUD (+ draft,
 * when `versions.drafts: true`) subjects.
 * @typeParam TCustom - Map of custom subject name to its action list — shorthand
 * `readonly string[]` or the full `{ actions, data? }` object form.
 * @typeParam TUserCollection - Minimal `{ slug }` shape backing `userCollection` — accepts
 * a real `CollectionConfig` or a plain literal when no collection exists for the user table.
 * @typeParam TOrgCollection - Minimal `{ slug }` shape backing `organizationCollection`,
 * when the project is multi-tenant.
 * @param props - The raw access configuration supplied by the caller.
 * @param props.roles - All role names the matrix may reference.
 * @param props.resources - Collections/globals to turn into subjects, keyed by slug.
 * @param props.customResources - Non-resource subjects (e.g. `apiKeys`), keyed by name.
 * @param props.userCollection - `{ slug }` stored as the resolved config's `userCollection`.
 * @param props.organizationCollection - Optional `{ slug }` enabling org-scoped checks.
 * @param props.defaults - Posture for undeclared role/subject/action combinations.
 * Defaults to `"allow"`.
 * @param props.permissions - Per-role subject matrix; see `SubjectMap` for subject shapes,
 * `"*"` for the role-level wildcard (allow/deny everything not otherwise declared).
 * @returns A frozen, type-erased `VexAccessConfig` carrying `TSubjects` for
 * `hasPermission()` inference.
 * @throws {VexAccessConfigError} When a `customResources` key collides with a resource
 * slug, or a `customResources` entry declares an empty `actions` array.
 *
 * @example
 * ```ts
 * export const access = defineAccess({
 *   roles: ["admin", "editor"] as const,
 *   resources: [pages, users],
 *   customResources: { apiKeys: ["create", "revoke"] },
 *   userCollection: users,
 *   permissions: {
 *     admin: { "*": true },
 *     editor: { pages: { read: true, update: true }, apiKeys: false },
 *   },
 * });
 * ```
 *
 * @see {@link VexAccessInput} for the user-facing input type
 * @see {@link VexAccessConfig} for the resolved return type
 */
export function defineAccess<
  const TRoles extends readonly string[],
  const TResources extends readonly (
    | CollectionConfig<any, any, any, any, any>
    | GlobalConfig<any, any, any, any, any>
  )[],
  const TCustom extends Record<string, CustomResourceInput> = Record<string, never>,
  TUserCollection extends { slug: string } = { slug: string },
  TOrgCollection extends { slug: string } | undefined = undefined,
>(
  props: VexAccessInput<TRoles, TResources, TCustom, TUserCollection, TOrgCollection>,
): VexAccessConfig<SubjectMap<TResources, TCustom>> {
  // 1. Normalize `customResources` shorthand to `{ actions }` form.
  //    a. For each `[key, value]` in `Object.entries(props.customResources ?? {})`:
  //       - `Array.isArray(value)` → `{ actions: value }`
  //       - otherwise → `value` unchanged (already `{ actions, data? }`)
  //    → `normalizedCustomResources: Record<string, { actions: readonly string[] }>`

  // 2. Hard validation — always runs, unconditional on `NODE_ENV`.
  //    a. `resourceSlugs = new Set(props.resources.map((r) => r.slug))`.
  //    b. For each `key` in `Object.keys(normalizedCustomResources)`:
  //       - `resourceSlugs.has(key)` → throw `VexAccessConfigError`
  //         (`customResources key "${key}" collides with a resource slug`)
  //       - `normalizedCustomResources[key].actions.length === 0` → throw
  //         `VexAccessConfigError` (`customResources "${key}" must declare at least one action`)

  // 3. Dev-only validation warnings — skipped when `process.env.NODE_ENV === "production"`.
  //    a. `knownSubjects = new Set([...resourceSlugs, ...Object.keys(normalizedCustomResources), "adminPanel"])`
  //    b. `rolesSet = new Set(props.roles)`.
  //    c. For each `role` in `Object.keys(props.permissions)`:
  //       - `role` ∉ `rolesSet` → `console.warn` (`permission role "${role}" not in roles array`)
  //       - else for each `subjectKey` in `Object.keys(props.permissions[role])`:
  //         - `subjectKey === "*"` → skip (role-level wildcard, always valid)
  //         - `subjectKey` ∉ `knownSubjects` → `console.warn` (`permission subject
  //           "${subjectKey}" not found in resources, customResources, or adminPanel`)
  //    d. `props.organizationCollection && !props.organizationCollection.slug` →
  //       `console.warn` (`organizationCollection must have a slug`)

  // 4. Build and freeze the runtime config.
  //    → `Object.freeze({`
  //         `roles: props.roles,`
  //         `defaults: props.defaults ?? "allow",`
  //         `userCollection: props.userCollection.slug,`
  //         `organizationCollection: props.organizationCollection?.slug,`
  //         `permissions: props.permissions,`
  //       `})` cast to `VexAccessConfig<SubjectMap<TResources, TCustom>>`

  // Edge cases:
  // - `props.customResources` omitted → normalize to `{}`; steps 2b/3a operate on an
  //   empty map, no warnings/errors from that source.
  // - A key present as both a resource slug AND a `customResources` key → step 2b throws
  //   before any dev warnings run (hard error takes precedence over validation warnings).
  // - `permissions[role]` has `"*": true` alongside explicit subject keys → both are
  //   valid; `"*"` is resolved at `hasPermission()` call time, not expanded here.
  // - `defaults` explicitly `"deny"` → passed through unchanged; only `undefined` falls
  //   back to `"allow"`.
  // - `props.organizationCollection` omitted entirely → step 3d and the runtime
  //   `organizationCollection` field are both skipped (`undefined`), not an error.

  throw new Error("Not implemented");
}
```

#### `packages/core/src/access/config.test.ts`

```ts
import { describe, expect, it, vi } from "vitest";
import { defineCollection, text } from "../index";
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

const users = defineCollection({
  slug: "users",
  fields: { name: text({ required: true }) },
});

describe("defineAccess — runtime passthrough", () => {
  it("passes the permissions matrix through unchanged", () => {
    const permissions = {
      admin: { "*": true },
      editor: {
        posts: { create: true, read: true, update: true, delete: false },
      },
    };
    const access = defineAccess({
      roles: ["admin", "editor"] as const,
      resources: [posts, users],
      userCollection: users,
      permissions,
    });
    expect(access.roles).toEqual(["admin", "editor"]);
    expect(access.userCollection).toBe("users");
    expect(access.permissions).toEqual(permissions);
    expect(access.organizationCollection).toBeUndefined();
  });

  it("accepts a minimal { slug } userCollection with no backing CollectionConfig", () => {
    const access = defineAccess({
      roles: ["admin"] as const,
      resources: [posts],
      userCollection: { slug: "user" },
      permissions: { admin: { "*": true } },
    });
    expect(access.userCollection).toBe("user");
  });

  it("resolves organizationCollection to its slug when provided", () => {
    const organizations = defineCollection({
      slug: "organizations",
      fields: { name: text({ required: true }) },
    });
    const access = defineAccess({
      roles: ["admin"] as const,
      resources: [users],
      userCollection: users,
      organizationCollection: organizations,
      permissions: { admin: { "*": true } },
    });
    expect(access.organizationCollection).toBe("organizations");
  });
});

describe("defineAccess — defaults", () => {
  it('falls back to "allow" when defaults is omitted', () => {
    const access = defineAccess({
      roles: ["admin"] as const,
      resources: [users],
      userCollection: users,
      permissions: { admin: { "*": true } },
    });
    expect(access.defaults).toBe("allow");
  });

  it('passes through an explicit "deny" default', () => {
    const access = defineAccess({
      roles: ["admin"] as const,
      resources: [users],
      userCollection: users,
      defaults: "deny",
      permissions: { admin: { "*": true } },
    });
    expect(access.defaults).toBe("deny");
  });
});

describe("defineAccess — customResources shorthand normalization", () => {
  it("normalizes array-shorthand customResources so referencing them does not warn", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("development", () => {
      defineAccess({
        roles: ["admin"] as const,
        resources: [users],
        customResources: { apiKeys: ["create", "revoke"] },
        userCollection: users,
        permissions: { admin: { apiKeys: { create: true, revoke: false } } },
      });
    });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("rejects an empty-array customResources shorthand with VexAccessConfigError", () => {
    expect(() =>
      defineAccess({
        roles: ["admin"] as const,
        resources: [users],
        customResources: { apiKeys: [] },
        userCollection: users,
        permissions: { admin: {} },
      }),
    ).toThrow(VexAccessConfigError);
  });

  it("rejects an empty actions array in object-form customResources with VexAccessConfigError", () => {
    expect(() =>
      defineAccess({
        roles: ["admin"] as const,
        resources: [users],
        customResources: { apiKeys: { actions: [] } },
        userCollection: users,
        permissions: { admin: {} },
      }),
    ).toThrow(VexAccessConfigError);
  });
});

describe("defineAccess — dev-mode warnings", () => {
  it("warns when a permission role key is not in roles", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("development", () => {
      defineAccess({
        roles: ["admin"] as const,
        resources: [users],
        userCollection: users,
        permissions: {
          admin: { "*": true },
          superuser: { "*": true },
        } as any,
      });
    });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("superuser"));
    warnSpy.mockRestore();
  });

  it("warns when a permission subject key is unknown", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("development", () => {
      defineAccess({
        roles: ["admin"] as const,
        resources: [users],
        userCollection: users,
        permissions: { admin: { nonexistent: { read: true } } } as any,
      });
    });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("nonexistent"));
    warnSpy.mockRestore();
  });

  it("does not warn on the reserved adminPanel or wildcard subject keys", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("development", () => {
      defineAccess({
        roles: ["admin"] as const,
        resources: [users],
        userCollection: users,
        permissions: {
          admin: { adminPanel: { access: true, impersonate: false }, "*": true } as any,
        },
      });
    });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("warns when organizationCollection has no slug", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("development", () => {
      defineAccess({
        roles: ["admin"] as const,
        resources: [users],
        userCollection: users,
        organizationCollection: {} as any,
        permissions: { admin: { "*": true } },
      });
    });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("organizationCollection"));
    warnSpy.mockRestore();
  });

  it("does not warn in production even for unknown roles or subjects", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("production", () => {
      defineAccess({
        roles: ["admin"] as const,
        resources: [users],
        userCollection: users,
        permissions: {
          admin: { "*": true },
          superuser: { nonexistent: true },
        } as any,
      });
    });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("defineAccess — VexAccessConfigError", () => {
  it("rejects a customResources key that collides with a resource slug", () => {
    expect(() =>
      defineAccess({
        roles: ["admin"] as const,
        resources: [users],
        customResources: { users: ["create"] },
        userCollection: users,
        permissions: { admin: {} },
      }),
    ).toThrow(VexAccessConfigError);
  });
});

describe("defineAccess — type-level", () => {
  it("rejects an unknown role key in permissions", () => {
    defineAccess({
      roles: ["admin"] as const,
      resources: [posts, users],
      userCollection: users,
      permissions: {
        admin: { "*": true },
        // @ts-expect-error — "superuser" is not in `roles`
        superuser: { "*": true },
      },
    });
  });

  it("rejects an unknown action for a resource subject", () => {
    defineAccess({
      roles: ["admin"] as const,
      resources: [posts, users],
      userCollection: users,
      permissions: {
        admin: {
          posts: {
            create: true,
            read: true,
            update: true,
            delete: true,
            // @ts-expect-error — "archive" is not a CrudAction
            archive: true,
          },
        },
      },
    });
  });

  it("rejects a field-mode object on a custom resource", () => {
    defineAccess({
      roles: ["admin"] as const,
      resources: [posts, users],
      customResources: { apiKeys: ["create", "revoke"] },
      userCollection: users,
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

Verify: `pnpm --filter @vexcms/core test -- access/config`

### Step 3 — hasPermission resolver + tests [dev]

Create `packages/core/src/access/hasPermission.ts` (guided stub: `hasPermission`, `resolvePermissionCheck`,
`mergeRolePermissions`), `packages/core/src/access/hasPermission.test.ts` (full test suite porting master's
edge-case matrix plus the v2-only cases), and `packages/core/src/access/index.ts` (barrel). This is the single
runtime entry point — every server API guard (Step 5), admin panel gate, and custom-subject check calls
`hasPermission`; the resolution order below is binding (see contract) and every branch is exercised by a test.

- [ ] Create `packages/core/src/access/hasPermission.ts`
- [ ] Create `packages/core/src/access/hasPermission.test.ts`
- [ ] Create `packages/core/src/access/index.ts`

#### `packages/core/src/access/hasPermission.ts` (NEW)

```ts
import type {
  VexAccessConfig,
  SubjectEntry,
  PermissionCheck,
  FieldPermissionResult,
  ResolvedFieldPermissions,
} from "./types";
import { VexAccessError } from "./types";

/**
 * Resolves runtime role-based access for a single subject + action, merging
 * every role the user holds into one decision.
 *
 * This is the single entry point every server API guard, admin panel gate,
 * and custom-subject check calls. When `fields` is provided, resolves and
 * returns a per-field permission map instead of a single boolean.
 *
 * @param props.access - The resolved access config from `defineAccess()`. `undefined` disables
 *   access control entirely (no `access` configured) — every check passes.
 * @param props.user - The authenticated user document (from `access.userCollection`).
 * @param props.userRoles - Role names held by `user`. Roles absent from `access.roles` are ignored.
 * @param props.resource - Subject name — a resource slug, `"adminPanel"`, or a custom resource name.
 * @param props.action - Action on `resource`. Typed per-subject via `TSubjects[TSubject]["action"]`.
 * @param props.data - Document/context passed to permission callbacks. Omit for subjects with `data: never`.
 * @param props.organization - The organization document passed to callbacks. Only surfaces in callback
 *   props when `access.organizationCollection` is configured.
 * @param props.fields - When provided, restricts (and shapes) the result to a per-field permission map.
 * @param props.throwOnDenied - When `true`, throws `VexAccessError` instead of returning `false`/a
 *   partially-`false` field map. Default `false`.
 * @returns `boolean` when `fields` is omitted; `ResolvedFieldPermissions` (one entry per requested
 *   field) when `fields` is provided.
 * @throws {VexAccessError} When `throwOnDenied` is `true` and access is denied — carries `resource`,
 *   `action`, and (for field checks) the first denied field.
 *
 * @example
 * ```ts
 * hasPermission({ access, user, userRoles, resource: "posts", action: "update" }); // boolean
 * hasPermission({ access, user, userRoles, resource: "posts", action: "update",
 *   fields: ["title", "slug"] }); // { title: boolean, slug: boolean }
 * ```
 */
export function hasPermission<
  TSubjects extends Record<string, SubjectEntry>,
  TSubject extends keyof TSubjects & string,
>(props: {
  access: VexAccessConfig<TSubjects> | undefined;
  user: Record<string, unknown>;
  userRoles: string[];
  resource: TSubject;
  action: TSubjects[TSubject]["action"];
  data?: TSubjects[TSubject]["data"];
  organization?: Record<string, unknown>;
  fields?: TSubjects[TSubject]["fields"][];
  throwOnDenied?: boolean;
}): boolean | ResolvedFieldPermissions {
  // TODO: implement
  // 1. Destructure props (`throwOnDenied` defaults to `false`).
  // 2. `access === undefined` → the system has no access control configured:
  //    a. → build the allow result (`true`, or `{ [field]: true }` for every
  //       requested field when `fields` is provided) and return it directly —
  //       skip `throwOnDenied` entirely, nothing was ever denied.
  // 3. Filter `userRoles` down to roles present in `access.roles`; unknown role
  //    names are dropped silently.
  //    a. If the filtered list is empty → every role was unknown or none were
  //       supplied → build the deny result (`false`, or `{ [field]: false }`
  //       for every requested field) and go to step 6.
  // 4. For each remaining (known) role, resolve that role's check for
  //    `resource`/`action`:
  //    a. Read `roleEntry = access.permissions[role]`.
  //    b. If `roleEntry[resource]` is declared (regardless of role-level `"*"`) →
  //       - `typeof roleEntry[resource] === "boolean"` → that boolean is the
  //         resolved check for every action on this subject (resource-level
  //         shorthand — the per-action `PermissionCheck` path is skipped).
  //       - Otherwise it's a per-action map → resolve via the shared util
  //         `resolveActionCheck({ subjectEntry, action })`:
  //         i.  `subjectEntry[action]` declared → that check.
  //         ii. else `subjectEntry["*"]` declared → that check (action-level
  //             wildcard — a full `PermissionCheck`, so booleans, mode objects,
  //             and callbacks all work; enables "everything except X":
  //             `pages: { "*": true, delete: cb }`).
  //         iii. else `undefined` → caller falls through to `access.defaults`
  //             (an explicitly declared subject never falls back to the
  //             role-level wildcard, only to its own `"*"` or `defaults`).
  //    c. Else if `resource` has no entry at all on this role AND
  //       `roleEntry["*"]` is declared → that boolean is the resolved check
  //       for every action (the role-level wildcard covers only subjects the
  //       role never mentions).
  //    d. Else (neither `resource` nor `"*"` declared) → resolved check =
  //       `access.defaults === "deny" ? false : true`.
  //    e. If the resolved check is a function, call `resolvePermissionCheck()`
  //       with `{ check, user, data, organization: access.organizationCollection
  //       !== undefined ? organization : undefined }` — this also normalizes a
  //       callback returning `undefined` to `false` (deny).
  // 5. Merge every role's resolved check with `mergeRolePermissions({ resolved,
  //    fields })` → OR across roles, allow wins over deny, per field when
  //    `fields` is provided.
  // 6. `throwOnDenied` check:
  //    a. `fields` omitted and the merged result is `false` → throw
  //       `new VexAccessError(...)` with `{ resource, action }`.
  //    b. `fields` provided → find the first field (in `fields` array order)
  //       whose merged value is `false` → throw `new VexAccessError(...)` with
  //       `{ resource, action, field }`. No `false` entries → don't throw.
  // 7. Return the merged result.
  //
  // Edge cases:
  // - Field-map edge semantics (no `fields` param): allow-mode w/ nonempty
  //   `fields` → `true`; allow-mode w/ empty `fields` → `false`; deny-mode
  //   w/ nonempty `fields` → `false`; deny-mode w/ empty `fields` → `true`.
  // - `"*": true` only ever fills in for subjects the role never declares — it
  //   grants access to custom resources and other undeclared subjects, but
  //   never overrides an explicit per-subject `false`/deny entry.
  // - `"*": false` denies every undeclared subject, but an explicit per-subject
  //   entry on the same role (even one nested under a per-action map) still wins.
  // - Action-level `"*"` inside a per-action map is consulted BETWEEN the
  //   explicit action key and `defaults`; it never leaks across subjects.
  //   Precedence: explicit action > subject `"*"` > role `"*"` (undeclared
  //   subjects only) > `defaults`.
  // - Role-level `"*"` is boolean-only; action-level `"*"` is any
  //   `PermissionCheck` (a role-wide callback would receive a union of every
  //   subject's `data` — deliberately unsupported).
  // - `access.defaults: "deny"` flips every undeclared role/subject/action from
  //   allow to deny — it does not affect subjects that ARE declared.
  // - A callback resolving to `undefined` is deny, distinct from a subject/action
  //   never being declared (which resolves via `defaults`, not deny-by-default).
  throw new Error("Not implemented");
}

/**
 * Resolves a single role's `PermissionCheck` into a concrete
 * `FieldPermissionResult` — invoking the callback (if it is one) with the
 * caller's `user`/`data`/`organization` context.
 *
 * Advanced/testing use: `hasPermission()` calls this once per role per check;
 * exported so callers can resolve one role's check in isolation (e.g. to
 * preview what a specific role would allow, without merging).
 *
 * @param props.check - The check to resolve — a boolean, a `{ mode, fields }` object, a callback,
 *   or `undefined` (subject/action not declared — the caller applies the `defaults` posture).
 * @param props.user - Passed to the callback as `props.user`.
 * @param props.data - Passed to the callback as `props.data` when defined; omitted from the
 *   callback's props object otherwise.
 * @param props.organization - Passed to the callback as `props.organization` when defined;
 *   omitted from the callback's props object otherwise.
 * @returns The resolved `FieldPermissionResult`, or `undefined` when `props.check` itself was
 *   `undefined` (caller must apply the config's `defaults` posture). A callback that returns
 *   `undefined` resolves to `false`, never to `undefined` — only an undeclared check propagates
 *   `undefined` out of this function.
 *
 * @example
 * ```ts
 * resolvePermissionCheck({ check: true, user }); // → true
 * resolvePermissionCheck({
 *   check: ({ data, user }) => data.authorId === user._id,
 *   user, data: post,
 * }); // → boolean returned by the callback
 * ```
 */
export function resolvePermissionCheck<
  TData = unknown,
  TUser extends Record<string, unknown> = Record<string, unknown>,
  TOrg extends Record<string, unknown> = Record<string, unknown>,
  TFieldKeys extends string = string,
>(props: {
  check: PermissionCheck<TData, TUser, TOrg, TFieldKeys> | undefined;
  user: TUser;
  data?: TData;
  organization?: TOrg;
}): FieldPermissionResult<TFieldKeys> | undefined {
  // TODO: implement
  // 1. `props.check === undefined` → return `undefined` unchanged (nothing to
  //    resolve — signals "not declared" up to `hasPermission`, which applies
  //    `defaults`).
  // 2. `typeof props.check !== "function"` → it's already a boolean or a
  //    `{ mode, fields }` object → return it as-is.
  // 3. It's a callback:
  //    a. Build the callback props: start with `{ user: props.user }`, then
  //       spread in `data: props.data` only when `props.data !== undefined`,
  //       then spread in `organization: props.organization` only when
  //       `props.organization !== undefined` → matches
  //       `PermissionCallbackProps<TData, TUser, TOrg>`'s conditional shape.
  //    b. Call `props.check(callbackProps)`.
  //    c. Callback returned `undefined` → return `false` (deny) — NOT
  //       `undefined` (that would be misread by the caller as "not declared").
  //    d. Otherwise return the callback's `FieldPermissionResult` unchanged.
  //
  // Edge cases:
  // - Distinguish "no check configured" (`undefined` in → `undefined` out) from
  //   "callback denied" (`undefined` out of the callback → `false` out of this
  //   function). Collapsing these would make undeclared actions deny-by-default
  //   instead of falling through to `defaults`.
  throw new Error("Not implemented");
}

/**
 * Merges one resolved `FieldPermissionResult` per role into a single result,
 * OR-ing across roles so that any role granting access wins (allow beats deny).
 *
 * @param props.resolved - One resolved check per role the user holds (already run through
 *   `resolvePermissionCheck` + the `defaults` fallback — no raw `undefined` entries).
 * @param props.fields - When provided, the field map to compute; the returned
 *   `ResolvedFieldPermissions` has exactly these keys. Omit to get a single overall boolean.
 * @returns `boolean` when `props.fields` is omitted; `ResolvedFieldPermissions` otherwise.
 *
 * @example
 * ```ts
 * mergeRolePermissions({
 *   resolved: [
 *     { mode: "allow", fields: ["title"] },
 *     { mode: "deny", fields: ["slug"] },
 *   ],
 *   fields: ["title", "slug", "status"],
 * });
 * // → { title: true, slug: true, status: true }
 * // (role A allows "title"; role B denies "slug" but allows everything else —
 * // allow wins per field across roles)
 * ```
 */
export function mergeRolePermissions<TFieldKeys extends string = string>(props: {
  resolved: Array<FieldPermissionResult<TFieldKeys>>;
  fields?: TFieldKeys[];
}): boolean | ResolvedFieldPermissions {
  // TODO: implement
  // 1. `props.fields` is `undefined` → compute one boolean per role (step 2,
  //    overall-boolean variant), then OR them together (`some(Boolean)`) →
  //    return the single boolean.
  //    a. `props.fields` is provided → for each field in `props.fields`,
  //       compute one boolean per role for THAT field (step 2, per-field
  //       variant), OR them together → build a `ResolvedFieldPermissions`
  //       keyed by exactly the requested fields (fields not requested never
  //       appear in the result, even if an underlying mode object mentions them).
  // 2. Per-role, per-check boolean collapse (used by both branches above):
  //    a. `check` is a plain `boolean` → that value, for every field.
  //    b. `check` is `{ mode: "allow", fields }`:
  //       - Overall-boolean branch (no specific field being asked) → `fields`
  //         non-empty → `true`; `fields` empty → `false`.
  //       - Per-field branch, asking about field `f` → `fields.includes(f)`.
  //    c. `check` is `{ mode: "deny", fields }`:
  //       - Overall-boolean branch → `fields` non-empty → `false`; `fields`
  //         empty → `true`.
  //       - Per-field branch for field `f` → `!fields.includes(f)`.
  // 3. Return the OR-merged boolean (step 1) or field map (step 1a).
  //
  // Edge cases:
  // - Mixed booleans and mode objects across roles merge fine — step 2 collapses
  //   every role to a boolean (per field or overall) before the OR in step 1.
  // - `props.resolved` is never empty when called from `hasPermission()` (an
  //   empty `userRoles` short-circuits before reaching this function), but an
  //   empty array here still has a well-defined answer: no role to grant access
  //   → `false` (or an all-`false` field map).
  throw new Error("Not implemented");
}


/**
 * Resolves a single action's check from a per-action map, consulting the
 * action-level wildcard `"*"` when the explicit action is not declared.
 *
 * Used internally by `hasPermission` to flatten a per-action map into
 * a single `PermissionCheck` for a given action, enabling "everything
 * except X" patterns like `pages: { "*": true, delete: cb }`.
 *
 * @param props.subjectEntry - The per-action map for a subject
 *   (already validated to be an object, not a boolean shorthand).
 * @param props.action - The action name to resolve.
 * @returns The resolved `PermissionCheck`, or `undefined` if neither the
 *   explicit action nor `"*"` are declared on this subject.
 *
 * @internal Exported for testing only.
 */
export function resolveActionCheck<TAction extends string>(props: {
  subjectEntry: Record<string, unknown>;
  action: TAction;
}): PermissionCheck<any, any, any, any> | undefined {
  // TODO: implement
  // 1. Check `props.subjectEntry[props.action]` — if declared, return it.
  // 2. Else check `props.subjectEntry["*"]` — if declared, return it.
  // 3. Else return `undefined` (neither action nor wildcard declared).
  throw new Error("Not implemented");
}
```

#### `packages/core/src/access/index.ts` (NEW)

```ts
export * from "./types";
export * from "./config";
export * from "./hasPermission";
```

---

#### Action-level Wildcard Test Suite

Add to `packages/core/src/access/hasPermission.test.ts`:

```ts
// ────────────────────────────────────────────────────────────────────────
// Action-level wildcard `"*"` — enables "everything except X" patterns
// ────────────────────────────────────────────────────────────────────────

describe("action-level wildcard", () => {
  it("covers undeclared actions inside a per-action map", () => {
    const access = defineAccess({
      roles: ["editor"],
      resources: [posts],
      userCollection: { slug: "users" },
      permissions: {
        editor: {
          posts: {
            "*": true,  // allow all actions (create, read, update, delete, etc.)
            delete: false,  // except delete
          },
        },
      },
    });

    const user = { _id: "u1", name: "Alice" };
    const userRoles = ["editor"];

    expect(hasPermission({ access, user, userRoles, resource: "posts", action: "create" }))
      .toBe(true);
    expect(hasPermission({ access, user, userRoles, resource: "posts", action: "read" }))
      .toBe(true);
    expect(hasPermission({ access, user, userRoles, resource: "posts", action: "update" }))
      .toBe(true);
    // Explicit action beats wildcard
    expect(hasPermission({ access, user, userRoles, resource: "posts", action: "delete" }))
      .toBe(false);
  });

  it("wildcard can be a callback (data-aware deny)", () => {
    const access = defineAccess({
      roles: ["editor"],
      resources: [posts],
      userCollection: { slug: "users" },
      permissions: {
        editor: {
          posts: {
            "*": ({ data }) => data.status !== "published",  // wildcard callback
            delete: false,  // still explicitly denied
          },
        },
      },
    });

    const user = { _id: "u1", name: "Alice" };
    const userRoles = ["editor"];

    expect(hasPermission({
      access, user, userRoles, resource: "posts", action: "create",
      data: { title: "Draft", status: "draft" }
    })).toBe(true);

    expect(hasPermission({
      access, user, userRoles, resource: "posts", action: "update",
      data: { title: "Published", status: "published" }
    })).toBe(false);  // wildcard callback denies

    expect(hasPermission({
      access, user, userRoles, resource: "posts", action: "delete",
      data: { title: "Draft", status: "draft" }
    })).toBe(false);  // explicit delete deny, wildcard doesn't matter
  });

  it("explicit action takes precedence over subject wildcard", () => {
    const access = defineAccess({
      roles: ["viewer"],
      resources: [posts],
      userCollection: { slug: "users" },
      permissions: {
        viewer: {
          posts: {
            "*": false,  // deny all actions by default
            read: true,  // except read
          },
        },
      },
    });

    const user = { _id: "u1", name: "Alice" };
    const userRoles = ["viewer"];

    expect(hasPermission({ access, user, userRoles, resource: "posts", action: "read" }))
      .toBe(true);
    expect(hasPermission({ access, user, userRoles, resource: "posts", action: "create" }))
      .toBe(false);
  });

  it("wildcard callbacks can return field-mode objects", () => {
    const access = defineAccess({
      roles: ["editor"],
      resources: [posts],
      userCollection: { slug: "users" },
      permissions: {
        editor: {
          posts: {
            "*": { mode: "allow", fields: ["title", "status"] },  // update default
            delete: false,
          },
        },
      },
    });

    const user = { _id: "u1", name: "Alice" };
    const userRoles = ["editor"];

    expect(hasPermission({
      access, user, userRoles, resource: "posts", action: "update",
      fields: ["title", "status", "slug"]
    })).toEqual({ title: true, status: true, slug: false });
  });

  it("precedence: explicit action > subject wildcard > role wildcard > defaults", () => {
    const access = defineAccess({
      roles: ["contributor"],
      resources: [posts],
      userCollection: { slug: "users" },
      defaults: "allow",  // base default
      permissions: {
        contributor: {
          "*": false,  // role wildcard denies undeclared subjects
          posts: {
            "*": true,  // subject wildcard allows all actions
            delete: false,  // explicit action beats subject wildcard
            publish: ({ data }) => data.status === "reviewed",  // callback beats subject wildcard
          },
        },
      },
    });

    const user = { _id: "u1", name: "Alice" };
    const userRoles = ["contributor"];

    expect(hasPermission({ access, user, userRoles, resource: "posts", action: "create" }))
      .toBe(true);  // subject wildcard
    expect(hasPermission({
      access, user, userRoles, resource: "posts", action: "publish",
      data: { title: "T", status: "reviewed" }
    })).toBe(true);  // explicit callback wins
    expect(hasPermission({
      access, user, userRoles, resource: "posts", action: "publish",
      data: { title: "T", status: "draft" }
    })).toBe(false);  // explicit callback wins
    expect(hasPermission({ access, user, userRoles, resource: "posts", action: "delete" }))
      .toBe(false);  // explicit action beats subject wildcard
  });

  it("multiple roles: OR merge applies per action (action-level wildcards included)", () => {
    const access = defineAccess({
      roles: ["viewer", "editor"],
      resources: [posts],
      userCollection: { slug: "users" },
      permissions: {
        viewer: {
          posts: { read: true, "*": false },  // read only
        },
        editor: {
          posts: {
            "*": true,  // all actions
            delete: false,  // except delete
          },
        },
      },
    });

    const user = { _id: "u1", name: "Alice" };
    const viewerAndEditor = ["viewer", "editor"];

    // Viewer denies create via "*": false; Editor allows via "*": true → allow wins
    expect(hasPermission({
      access, user, userRoles: viewerAndEditor, resource: "posts", action: "create"
    })).toBe(true);

    // Both allow read
    expect(hasPermission({
      access, user, userRoles: viewerAndEditor, resource: "posts", action: "read"
    })).toBe(true);

    // Both deny delete (viewer via "*": false, editor via explicit delete: false)
    expect(hasPermission({
      access, user, userRoles: viewerAndEditor, resource: "posts", action: "delete"
    })).toBe(false);
  });
});
```

 * Resolves the effective check for one action inside a per-action map,
 * honoring the action-level wildcard.
 *
 * Module-private — the wildcard precedence lives in exactly one place so
 * `hasPermission` (and any future evaluator, e.g. DB-backed roles) shares it.
 *
 * @param props.subjectEntry - The per-action map declared for a subject
 *   (already known not to be a boolean shorthand).
 * @param props.action - The action being checked.
 * @returns The declared check for `action`, else the subject's `"*"` check,
 *   else `undefined` (caller falls through to `access.defaults`).
 */
function resolveActionCheck(props: {
  subjectEntry: Record<string, unknown>;
  action: string;
}): unknown {
  // TODO: implement
  // 1. `props.action in props.subjectEntry` → return `props.subjectEntry[props.action]`.
  //    (An explicit key wins even when its value is `false` or a deny-mode
  //    object — presence, not truthiness, decides.)
  // 2. `"*" in props.subjectEntry` → return `props.subjectEntry["*"]`.
  // 3. Return `undefined`.
  //
  // Edge cases:
  // - `"*"` value may be any `PermissionCheck` (boolean, mode object, callback)
  //   — callers treat it exactly like an explicit action's check.
  // - An explicit `action: undefined` key (unlikely, but possible via spread)
  //   counts as declared in step 1 and resolves as deny downstream — matches
  //   the callback-returning-undefined posture.
  throw new Error("Not implemented");
}
```

#### `packages/core/src/access/index.ts` (NEW)

```ts
export * from "./types";
export * from "./config";
export * from "./hasPermission";
```

#### `packages/core/src/access/hasPermission.test.ts` (NEW)

```ts
import { describe, it, expect } from "vitest";
import { defineCollection } from "../collections";
import { defineGlobal } from "../globals";
import { text } from "../fields";
import { defineAccess } from "./config";
import { dataType, VexAccessError } from "./types";
import { hasPermission } from "./hasPermission";

// ────────────────────────────────────────────────────────────────────────
// Fixtures
//
// `data`/`fields` types fall back to their wide defaults here (this test
// file does not augment `GeneratedVexTypes` — see
// `packages/core/src/api/test/convex/schema.ts` for the augmentation
// pattern every other `@vexcms/core` fixture that needs narrowed types
// uses). Runtime behavior below is exercised with plain object literals
// regardless; only `dataType()`-carried custom-resource data (declared
// inline, independent of the generated registry) is narrowly typed.
// ────────────────────────────────────────────────────────────────────────

const posts = defineCollection({
  slug: "posts",
  fields: {
    title: text({ required: true }),
    slug: text({ required: true }),
    status: text(),
  },
});

const users = defineCollection({
  slug: "users",
  fields: {
    name: text({ required: true }),
    email: text({ required: true }),
  },
});

const siteSettings = defineGlobal({
  slug: "siteSettings",
  label: "Site Settings",
  fields: {
    siteName: text({ required: true }),
  },
  versions: { drafts: true },
});

const PROTECTED_SLUGS = ["home", "pricing"];

/**
 * Primary shared fixture — exercises the realistic surface: role-level
 * wildcard, boolean shorthand, per-action maps, field-mode objects,
 * callbacks (incl. a drafts-enabled global and two custom resources, one
 * with a typed `dataType()` carrier).
 */
const access = defineAccess({
  roles: ["admin", "editor", "viewer", "restricted", "poweruser", "noOrgSupport", "callbackUndefined"],
  resources: [posts, users, siteSettings],
  customResources: {
    apiKeys: ["create", "revoke"],
    reviewQueue: {
      actions: ["approve", "reject"],
      data: dataType<{ id: string; status: string }>(),
    },
  },
  userCollection: users,
  permissions: {
    // "*": true — wildcard-allow-all; nothing else is declared for "admin",
    // so every subject (incl. adminPanel and both custom resources) resolves
    // through the wildcard.
    admin: {
      "*": true,
    },
    editor: {
      adminPanel: { access: true, impersonate: false },
      posts: {
        create: true,
        read: true,
        // field-level: only "title" is directly editable.
        update: { mode: "allow", fields: ["title"] },
        delete: ({ data }) => !PROTECTED_SLUGS.includes((data as { slug: string }).slug),
      },
      users: {
        // self-read only; create/update/delete intentionally left
        // UNDECLARED — demonstrates "action undeclared for a declared
        // subject" falling through to `defaults`.
        read: ({ data, user }) => (data as { _id: string })._id === (user as { _id: string })._id,
      },
      siteSettings: {
        read: true,
        readDrafts: true,
        publish: false,
        // create/update/delete/saveDraft/unpublish left undeclared → `defaults`.
      },
      apiKeys: { create: true, revoke: false },
      reviewQueue: {
        approve: ({ data }) => data?.status === "pending",
        reject: ({ data }) => data?.status === "pending",
      },
    },
    viewer: {
      posts: { read: true },
      users: false, // resource-level boolean shorthand — deny every action
      siteSettings: { read: true },
    },
    // "*": false — deny every subject NOT explicitly declared below; "posts"
    // IS declared, so its explicit entry wins over the wildcard.
    restricted: {
      "*": false,
      posts: { read: true },
    },
    // resource-level boolean shorthand — allow every action on "posts".
    poweruser: {
      posts: true,
    },
    // Probes for the organization-context and undefined-callback edge cases.
    noOrgSupport: {
      posts: { read: (callbackProps) => "organization" in callbackProps },
    },
    callbackUndefined: {
      posts: { read: () => undefined },
    },
  },
});

/**
 * Isolated fixture for field-map resolution + multi-role merge semantics —
 * kept separate from `access` so each role demonstrates exactly one
 * mode/empty-fields combination without the primary fixture's noise.
 */
const mergeFixtureAccess = defineAccess({
  roles: [
    "roleAllowTitle",
    "roleDenySlug",
    "roleAllowStatus",
    "roleDenyTitle",
    "allowEmptyFields",
    "denyEmptyFields",
    "boolTrue",
  ],
  resources: [posts, users],
  userCollection: users,
  permissions: {
    roleAllowTitle: { posts: { update: { mode: "allow", fields: ["title"] } } },
    roleDenySlug: { posts: { update: { mode: "deny", fields: ["slug"] } } },
    roleAllowStatus: { posts: { update: { mode: "allow", fields: ["status"] } } },
    roleDenyTitle: { posts: { update: { mode: "deny", fields: ["title"] } } },
    allowEmptyFields: { posts: { update: { mode: "allow", fields: [] } } },
    denyEmptyFields: { posts: { update: { mode: "deny", fields: [] } } },
    boolTrue: { posts: true },
  },
});

/** Isolated fixture for `defaults: "deny"` — undeclared flips to deny. */
const accessDenyDefaults = defineAccess({
  roles: ["editor"],
  resources: [posts, users],
  userCollection: users,
  defaults: "deny",
  permissions: {
    editor: {
      posts: { read: true },
    },
  },
});

/** Isolated fixture for organization-aware callbacks. */
const organizations = defineCollection({
  slug: "organizations",
  fields: {
    name: text({ required: true }),
  },
});

const accessWithOrg = defineAccess({
  roles: ["orgMember", "orgProbe", "callbackModeObject"],
  resources: [posts, users],
  userCollection: users,
  organizationCollection: organizations,
  permissions: {
    orgMember: {
      posts: {
        read: ({ data, organization }) =>
          organization !== undefined &&
          (data as { orgId?: string })?.orgId === (organization as { _id?: string })?._id,
      },
    },
    orgProbe: {
      posts: { read: (callbackProps) => "organization" in callbackProps },
    },
    callbackModeObject: {
      users: { update: () => ({ mode: "allow" as const, fields: ["name"] }) },
    },
  },
});

// ────────────────────────────────────────────────────────────────────────

describe("hasPermission — permissive defaults", () => {
  it("allows everything when access is undefined (system disabled)", () => {
    expect(
      hasPermission({
        access: undefined,
        user: {},
        userRoles: ["editor"],
        resource: "posts",
        action: "delete",
        data: { slug: "home" },
      }),
    ).toBe(true);
  });

  it("resolves every requested field to true when access is undefined, even with no roles", () => {
    expect(
      hasPermission({
        access: undefined,
        user: {},
        userRoles: [],
        resource: "posts",
        action: "delete",
        fields: ["title", "slug"],
      }),
    ).toEqual({ title: true, slug: true });
  });

  it("falls through to `defaults` when a role never declares the subject at all", () => {
    // "viewer" declares posts/users/siteSettings but never "apiKeys".
    expect(
      hasPermission({
        access,
        user: {},
        userRoles: ["viewer"],
        resource: "apiKeys",
        action: "create",
      }),
    ).toBe(true);
  });

  it("falls through to `defaults` when the action is undeclared on a declared subject", () => {
    // "editor" declares siteSettings.read/readDrafts/publish but not "create".
    expect(
      hasPermission({
        access,
        user: {},
        userRoles: ["editor"],
        resource: "siteSettings",
        action: "create",
      }),
    ).toBe(true);
  });
});

describe("hasPermission — field-map resolution (no fields param)", () => {
  it("allow-mode with nonempty fields resolves to true", () => {
    expect(
      hasPermission({
        access: mergeFixtureAccess,
        user: {},
        userRoles: ["roleAllowTitle"],
        resource: "posts",
        action: "update",
      }),
    ).toBe(true);
  });

  it("allow-mode with empty fields resolves to false", () => {
    expect(
      hasPermission({
        access: mergeFixtureAccess,
        user: {},
        userRoles: ["allowEmptyFields"],
        resource: "posts",
        action: "update",
      }),
    ).toBe(false);
  });

  it("deny-mode with empty fields resolves to true", () => {
    expect(
      hasPermission({
        access: mergeFixtureAccess,
        user: {},
        userRoles: ["denyEmptyFields"],
        resource: "posts",
        action: "update",
      }),
    ).toBe(true);
  });

  it("deny-mode with nonempty fields resolves to false", () => {
    expect(
      hasPermission({
        access: mergeFixtureAccess,
        user: {},
        userRoles: ["roleDenySlug"],
        resource: "posts",
        action: "update",
      }),
    ).toBe(false);
  });
});

describe("hasPermission — boolean resource shorthand", () => {
  it("resource: true allows every action", () => {
    expect(
      hasPermission({ access, user: {}, userRoles: ["poweruser"], resource: "posts", action: "delete" }),
    ).toBe(true);
  });

  it("resource: true with fields maps every requested field to true", () => {
    expect(
      hasPermission({
        access,
        user: {},
        userRoles: ["poweruser"],
        resource: "posts",
        action: "delete",
        fields: ["title", "slug"],
      }),
    ).toEqual({ title: true, slug: true });
  });

  it("resource: false denies every action", () => {
    expect(hasPermission({ access, user: {}, userRoles: ["viewer"], resource: "users", action: "read" })).toBe(
      false,
    );
  });

  it("resource: false with fields maps every requested field to false", () => {
    expect(
      hasPermission({
        access,
        user: {},
        userRoles: ["viewer"],
        resource: "users",
        action: "read",
        fields: ["name", "email"],
      }),
    ).toEqual({ name: false, email: false });
  });
});

describe("hasPermission — multi-role merge", () => {
  it("OR logic: any role granting access wins", () => {
    expect(
      hasPermission({
        access: mergeFixtureAccess,
        user: {},
        userRoles: ["roleAllowTitle", "roleDenySlug"],
        resource: "posts",
        action: "update",
      }),
    ).toBe(true);
  });

  it("merges two restrictive roles allowing different fields", () => {
    expect(
      hasPermission({
        access: mergeFixtureAccess,
        user: {},
        userRoles: ["roleAllowTitle", "roleAllowStatus"],
        resource: "posts",
        action: "update",
        fields: ["title", "status", "slug"],
      }),
    ).toEqual({ title: true, status: true, slug: false });
  });

  it("allow wins over deny across roles for the same field", () => {
    expect(
      hasPermission({
        access: mergeFixtureAccess,
        user: {},
        userRoles: ["roleAllowTitle", "roleDenyTitle"],
        resource: "posts",
        action: "update",
        fields: ["title"],
      }),
    ).toEqual({ title: true });
  });

  it("allow wins over deny across roles for the overall boolean too", () => {
    expect(
      hasPermission({
        access: mergeFixtureAccess,
        user: {},
        userRoles: ["roleAllowTitle", "roleDenyTitle"],
        resource: "posts",
        action: "update",
      }),
    ).toBe(true);
  });

  it("a boolean-true role wins over a deny-mode field map from another role", () => {
    expect(
      hasPermission({
        access: mergeFixtureAccess,
        user: {},
        userRoles: ["boolTrue", "roleDenySlug"],
        resource: "posts",
        action: "update",
        fields: ["slug"],
      }),
    ).toEqual({ slug: true });
  });
});

describe("hasPermission — unknown & empty userRoles", () => {
  it("denies when every supplied role is unknown", () => {
    expect(hasPermission({ access, user: {}, userRoles: ["ghost"], resource: "posts", action: "read" })).toBe(
      false,
    );
  });

  it("denies every requested field when every supplied role is unknown", () => {
    expect(
      hasPermission({
        access,
        user: {},
        userRoles: ["ghost"],
        resource: "posts",
        action: "read",
        fields: ["title"],
      }),
    ).toEqual({ title: false });
  });

  it("ignores unknown roles mixed with a known role — the known role still grants access", () => {
    expect(
      hasPermission({
        access,
        user: {},
        userRoles: ["editor", "ghost"],
        resource: "posts",
        action: "create",
      }),
    ).toBe(true);
  });

  it("denies everything when userRoles is empty", () => {
    expect(hasPermission({ access, user: {}, userRoles: [], resource: "posts", action: "read" })).toBe(false);
  });

  it("denies every requested field when userRoles is empty", () => {
    expect(
      hasPermission({ access, user: {}, userRoles: [], resource: "posts", action: "read", fields: ["title"] }),
    ).toEqual({ title: false });
  });
});

describe("hasPermission — dynamic callbacks & organization context", () => {
  it("resolves a callback comparing data to the acting user", () => {
    expect(
      hasPermission({
        access,
        user: { _id: "u1" },
        userRoles: ["editor"],
        resource: "users",
        action: "read",
        data: { _id: "u1" },
      }),
    ).toBe(true);

    expect(
      hasPermission({
        access,
        user: { _id: "u1" },
        userRoles: ["editor"],
        resource: "users",
        action: "read",
        data: { _id: "u2" },
      }),
    ).toBe(false);
  });

  it("resolves a callback comparing document data against a protected-slugs list", () => {
    expect(
      hasPermission({
        access,
        user: {},
        userRoles: ["editor"],
        resource: "posts",
        action: "delete",
        data: { slug: "home" },
      }),
    ).toBe(false);

    expect(
      hasPermission({
        access,
        user: {},
        userRoles: ["editor"],
        resource: "posts",
        action: "delete",
        data: { slug: "my-post" },
      }),
    ).toBe(true);
  });

  it("passes `organization` to the callback only when configured AND passed", () => {
    expect(
      hasPermission({
        access: accessWithOrg,
        user: {},
        userRoles: ["orgProbe"],
        resource: "posts",
        action: "read",
        organization: { _id: "org_1" },
      }),
    ).toBe(true);

    expect(
      hasPermission({
        access: accessWithOrg,
        user: {},
        userRoles: ["orgProbe"],
        resource: "posts",
        action: "read",
      }),
    ).toBe(false);
  });

  it("omits `organization` from callback props when the config never configured organizationCollection", () => {
    // "access" (primary fixture) has no organizationCollection — even though
    // the caller passes one here, "noOrgSupport" must never see it.
    expect(
      hasPermission({
        access,
        user: {},
        userRoles: ["noOrgSupport"],
        resource: "posts",
        action: "read",
        organization: { _id: "org_1" },
      }),
    ).toBe(false);
  });

  it("resolves an org-aware callback using both data and organization", () => {
    expect(
      hasPermission({
        access: accessWithOrg,
        user: {},
        userRoles: ["orgMember"],
        resource: "posts",
        action: "read",
        data: { orgId: "org_1" },
        organization: { _id: "org_1" },
      }),
    ).toBe(true);

    expect(
      hasPermission({
        access: accessWithOrg,
        user: {},
        userRoles: ["orgMember"],
        resource: "posts",
        action: "read",
        data: { orgId: "org_1" },
        organization: { _id: "org_2" },
      }),
    ).toBe(false);
  });

  it("resolves a callback that dynamically returns a field-mode object", () => {
    expect(
      hasPermission({
        access: accessWithOrg,
        user: {},
        userRoles: ["callbackModeObject"],
        resource: "users",
        action: "update",
        fields: ["name", "email"],
      }),
    ).toEqual({ name: true, email: false });
  });
});

describe("hasPermission — callback returning undefined", () => {
  it("treats undefined returned by a callback as deny", () => {
    expect(
      hasPermission({
        access,
        user: {},
        userRoles: ["callbackUndefined"],
        resource: "posts",
        action: "read",
      }),
    ).toBe(false);
  });

  it("treats undefined returned by a callback as deny for every requested field", () => {
    expect(
      hasPermission({
        access,
        user: {},
        userRoles: ["callbackUndefined"],
        resource: "posts",
        action: "read",
        fields: ["title", "slug"],
      }),
    ).toEqual({ title: false, slug: false });
  });
});

describe("hasPermission — field subset checking", () => {
  it("returns a result entry only for requested fields", () => {
    expect(
      hasPermission({
        access,
        user: {},
        userRoles: ["editor"],
        resource: "posts",
        action: "update",
        fields: ["title", "slug", "status"],
      }),
    ).toEqual({ title: true, slug: false, status: false });
  });

  it("a smaller subset omits fields entirely, even ones the matrix mentions", () => {
    expect(
      hasPermission({
        access,
        user: {},
        userRoles: ["editor"],
        resource: "posts",
        action: "update",
        fields: ["title", "status"],
      }),
    ).toEqual({ title: true, status: false });
  });
});

describe('hasPermission — role wildcard ("*")', () => {
  it('"*": true allows subjects the role never declares, including custom resources', () => {
    expect(
      hasPermission({ access, user: {}, userRoles: ["admin"], resource: "apiKeys", action: "create" }),
    ).toBe(true);
    expect(
      hasPermission({ access, user: {}, userRoles: ["admin"], resource: "reviewQueue", action: "approve" }),
    ).toBe(true);
    expect(
      hasPermission({ access, user: {}, userRoles: ["admin"], resource: "adminPanel", action: "impersonate" }),
    ).toBe(true);
  });

  it('"*": false denies subjects the role never declares', () => {
    expect(hasPermission({ access, user: {}, userRoles: ["restricted"], resource: "users", action: "read" })).toBe(
      false,
    );
  });

  it('"*": false does not override an explicitly declared subject/action', () => {
    expect(hasPermission({ access, user: {}, userRoles: ["restricted"], resource: "posts", action: "read" })).toBe(
      true,
    );
  });

  it('an undeclared action on an explicitly declared subject falls through to `defaults`, not "*"', () => {
    // "restricted" declares "posts" (only "read"); "create" is undeclared on
    // that subject and must resolve via `defaults` ("allow"), not "*": false.
    expect(
      hasPermission({ access, user: {}, userRoles: ["restricted"], resource: "posts", action: "create" }),
    ).toBe(true);
  });
});

/**
 * Isolated fixture for the action-level wildcard — `"*"` inside a
 * per-action map applies to every action not explicitly declared on that
 * subject. Precedence: explicit action > subject `"*"` > role `"*"` > defaults.
 */
const actionWildcardAccess = defineAccess({
  roles: ["editor", "owner"],
  resources: [posts, users],
  userCollection: users,
  defaults: "deny",
  permissions: {
    editor: {
      // allow everything on posts EXCEPT delete.
      posts: { "*": true, delete: false },
    },
    owner: {
      // wildcard callback: owner-only for every action, but read stays public.
      posts: {
        "*": ({ data, user }) =>
          (data as { ownerId?: string }).ownerId === (user as { _id: string })._id,
        read: true,
      },
    },
  },
});

describe('hasPermission — action-level wildcard ("*" inside a per-action map)', () => {
  it('"*": true covers actions not explicitly declared on the subject', () => {
    expect(
      hasPermission({ access: actionWildcardAccess, user: {}, userRoles: ["editor"], resource: "posts", action: "update" }),
    ).toBe(true);
  });

  it("an explicit action key wins over the subject wildcard", () => {
    expect(
      hasPermission({ access: actionWildcardAccess, user: {}, userRoles: ["editor"], resource: "posts", action: "delete" }),
    ).toBe(false);
  });

  it('"*" accepts a callback and passes it data/user like any check', () => {
    const user = { _id: "u1" };
    expect(
      hasPermission({
        access: actionWildcardAccess, user, userRoles: ["owner"],
        resource: "posts", action: "update", data: { ownerId: "u1" },
      }),
    ).toBe(true);
    expect(
      hasPermission({
        access: actionWildcardAccess, user, userRoles: ["owner"],
        resource: "posts", action: "update", data: { ownerId: "u2" },
      }),
    ).toBe(false);
  });

  it("explicit read: true bypasses the wildcard callback", () => {
    expect(
      hasPermission({
        access: actionWildcardAccess, user: { _id: "u1" }, userRoles: ["owner"],
        resource: "posts", action: "read", data: { ownerId: "someone-else" },
      }),
    ).toBe(true);
  });

  it("subject wildcard does not leak to other subjects (defaults still apply)", () => {
    // "users" is undeclared for "editor"; with defaults: "deny" it must deny —
    // the posts-level "*" never crosses subject boundaries.
    expect(
      hasPermission({ access: actionWildcardAccess, user: {}, userRoles: ["editor"], resource: "users", action: "read" }),
    ).toBe(false);
  });
});

describe('hasPermission — defaults: "deny"', () => {
  it("still allows explicitly declared subjects/actions", () => {
    expect(
      hasPermission({
        access: accessDenyDefaults,
        user: {},
        userRoles: ["editor"],
        resource: "posts",
        action: "read",
      }),
    ).toBe(true);
  });

  it("denies an undeclared action on a declared subject", () => {
    expect(
      hasPermission({
        access: accessDenyDefaults,
        user: {},
        userRoles: ["editor"],
        resource: "posts",
        action: "update",
      }),
    ).toBe(false);
  });

  it("denies an entirely undeclared subject", () => {
    expect(
      hasPermission({
        access: accessDenyDefaults,
        user: {},
        userRoles: ["editor"],
        resource: "users",
        action: "read",
      }),
    ).toBe(false);
  });
});

describe("hasPermission — adminPanel built-in subject", () => {
  it("resolves via role wildcard", () => {
    expect(
      hasPermission({ access, user: {}, userRoles: ["admin"], resource: "adminPanel", action: "access" }),
    ).toBe(true);
  });

  it("resolves via an explicit per-action declaration", () => {
    expect(
      hasPermission({ access, user: {}, userRoles: ["editor"], resource: "adminPanel", action: "access" }),
    ).toBe(true);
    expect(
      hasPermission({ access, user: {}, userRoles: ["editor"], resource: "adminPanel", action: "impersonate" }),
    ).toBe(false);
  });

  it("falls through to `defaults` when never declared for the role", () => {
    expect(
      hasPermission({ access, user: {}, userRoles: ["viewer"], resource: "adminPanel", action: "access" }),
    ).toBe(true);
  });
});

describe("hasPermission — custom resources", () => {
  it("resolves per-action boolean checks on a plain (no-dataType) custom resource", () => {
    expect(hasPermission({ access, user: {}, userRoles: ["editor"], resource: "apiKeys", action: "create" })).toBe(
      true,
    );
    expect(hasPermission({ access, user: {}, userRoles: ["editor"], resource: "apiKeys", action: "revoke" })).toBe(
      false,
    );
  });

  it("passes the typed `data` argument through to a dataType()-carrying custom resource's callback", () => {
    expect(
      hasPermission({
        access,
        user: {},
        userRoles: ["editor"],
        resource: "reviewQueue",
        action: "approve",
        data: { id: "rq_1", status: "pending" },
      }),
    ).toBe(true);

    expect(
      hasPermission({
        access,
        user: {},
        userRoles: ["editor"],
        resource: "reviewQueue",
        action: "approve",
        data: { id: "rq_1", status: "approved" },
      }),
    ).toBe(false);
  });

  it("denies when no data is passed to a callback that depends on it", () => {
    expect(hasPermission({ access, user: {}, userRoles: ["editor"], resource: "reviewQueue", action: "reject" })).toBe(
      false,
    );
  });
});

describe("hasPermission — throwOnDenied", () => {
  it("throws VexAccessError when denied with no fields", () => {
    expect(() =>
      hasPermission({
        access,
        user: { _id: "u1" },
        userRoles: ["editor"],
        resource: "users",
        action: "read",
        data: { _id: "u2" },
        throwOnDenied: true,
      }),
    ).toThrow(VexAccessError);
  });

  it("throws with resource, action, and the first denied field when fields are checked", () => {
    let caught: unknown;
    try {
      hasPermission({
        access,
        user: {},
        userRoles: ["editor"],
        resource: "posts",
        action: "update",
        fields: ["title", "slug", "status"],
        throwOnDenied: true,
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(VexAccessError);
    const error = caught as VexAccessError;
    expect(error.resource).toBe("posts");
    expect(error.action).toBe("update");
    expect(error.field).toBe("slug");
  });

  it("throws when userRoles is empty", () => {
    expect(() =>
      hasPermission({
        access,
        user: {},
        userRoles: [],
        resource: "posts",
        action: "read",
        throwOnDenied: true,
      }),
    ).toThrow(VexAccessError);
  });

  it("does not throw when access is allowed", () => {
    let result: boolean | undefined;
    expect(() => {
      result = hasPermission({
        access,
        user: {},
        userRoles: ["editor"],
        resource: "posts",
        action: "read",
        throwOnDenied: true,
      }) as boolean;
    }).not.toThrow();
    expect(result).toBe(true);
  });

  it("silently returns false when denied and throwOnDenied is left at its default (false)", () => {
    expect(() =>
      hasPermission({ access, user: {}, userRoles: ["viewer"], resource: "users", action: "read" }),
    ).not.toThrow();
    expect(hasPermission({ access, user: {}, userRoles: ["viewer"], resource: "users", action: "read" })).toBe(
      false,
    );
  });
});
```

Verify: `pnpm --filter @vexcms/core test -- access`

### Step 4 — Config integration + public exports [agent]

- [ ] `packages/core/src/config/types.ts` — add VexAccessConfig import
- [ ] `packages/core/src/config/types.ts` — add `access` field to VexConfigInput
- [ ] `packages/core/src/config/types.ts` — add `access` field to VexConfig
- [ ] `packages/core/src/config/config.ts` — pass `access` through in defineConfig return
- [ ] `packages/core/src/config/sanitizeConfig.ts` — update ClientVexConfig type to Omit access
- [ ] `packages/core/src/config/sanitizeConfig.ts` — update sanitizeConfigForClient to exclude access
- [ ] `packages/core/src/index.ts` — add access module exports
- [ ] `packages/core/src/config/sanitizeConfig.test.ts` — add test for access stripping
- [ ] `pnpm --filter @vexcms/core test -- sanitizeConfig`
- [ ] `pnpm --filter @vexcms/core build`

#### 1. Add VexAccessConfig import (packages/core/src/config/types.ts)

**Insert after line 5:**

```ts
import { VexAccessConfig } from "../access/types";
```

**Location context (lines 1–6 from types.ts):**

```ts
import { CollectionConfig } from "../collections";
import { VexAuthAdapter } from "../auth/types";
import { MediaCollectionConfig, VexStorageAdapter } from "../media";
import { StorageAdapterSlug } from "../types";
import { GlobalConfig } from "../globals";
import { VexAccessConfig } from "../access/types";
```

#### 2. Add `access` to VexConfigInput (packages/core/src/config/types.ts)

**Insertion after storage field, before closing brace:**

```ts
  /**
   * Access control configuration — role-based permissions matrix.
   *
   * When provided, runtime permission checks (via `hasPermission`) enforce
   * the declared roles, resources, actions, and field-level permissions across
   * all API operations. `access` is server-side only and is stripped from
   * `ClientVexConfig` during sanitization.
   *
   * Omit this field to disable access control entirely — all checks will pass
   * (allow-all default).
   *
   * @see {@link defineAccess} to build an access config
   * @see {@link hasPermission} for runtime resolution
   * @see {@link VexAccessConfig} for the resolved type
   */
  access?: VexAccessConfig;
```

**Location context (surrounding lines 279–283 from types.ts):**

```ts
  storage?: {
    /** Storage adapters configured for the project. */
    adapters: VexStorageAdapter[];
  };
  access?: VexAccessConfig;
}
```

#### 3. Add `access` to VexConfig (packages/core/src/config/types.ts)

**Insertion after mediaCollections field, before closing brace:**

```ts
  /**
   * Access control configuration — role-based permissions matrix.
   *
   * When provided, runtime permission checks (via `hasPermission`) enforce
   * the declared roles, resources, actions, and field-level permissions across
   * all API operations. `access` is server-side only and is stripped from
   * `ClientVexConfig` during sanitization.
   *
   * Omit this field to disable access control entirely — all checks will pass
   * (allow-all default).
   *
   * @see {@link defineAccess} to build an access config
   * @see {@link hasPermission} for runtime resolution
   * @see {@link VexAccessConfig} for the resolved type
   */
  access?: VexAccessConfig;
```

**Location context (surrounding lines 320–327 from types.ts):**

```ts
  /**
   * Media collections — processed by storage adapters and stored separately
   * from user-defined `collections`. These appear in the admin panel under a
   * dedicated "Media" section. Each collection is tagged with
   * `meta.storageAdapterName` indicating which adapter owns it.
   */
  mediaCollections: MediaCollectionConfig[];
  access?: VexAccessConfig;
}
```

#### 4. Pass `access` through in defineConfig (packages/core/src/config/config.ts)

**Modification to the return object (line 59–85, change return statement):**

```ts
  return {
    basePath: "/admin",
    ...config,
    auth: config?.authAdapter,
    storage: {
      adapters: config?.storage?.adapters ?? [],
    },
    collections,
    globals: config?.globals ?? [],
    mediaCollections,
    access: config?.access,
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
```

**Exact insertion point (after line 68, before admin block on line 69):**

```ts
    mediaCollections,
    access: config?.access,
    admin: {
```

#### 5. Exclude `access` from ClientVexConfig type (packages/core/src/config/sanitizeConfig.ts)

**Replace line 14:**

```ts
export type ClientVexConfig = Omit<Sanitized<VexConfig>, "access">;
```

**Original (line 14):**
```ts
export type ClientVexConfig = Sanitized<VexConfig>;
```

#### 6. Strip `access` key in sanitizeConfigForClient (packages/core/src/config/sanitizeConfig.ts)

**Modification to function body (lines 134–139):**

```ts
export function sanitizeConfigForClient(config: VexConfig): ClientVexConfig {
  // Drop storageAdapters and access up front (they hold adapter class instances
  // and permission callbacks that cannot be serialized), then recursively strip
  // any remaining non-serializable leaves from the rest.
  const { storage, access, ...rest } = config;
  return stripNonSerializable(rest) as ClientVexConfig;
}
```

**Exact change (line 137, add `access` to destructuring):**

```ts
  const { storage, access, ...rest } = config;
```

#### 7. Export access module from packages/core/src/index.ts

**Add new section after AUTH section (insert after line 46):**

```ts
// ============================================================================
// ACCESS CONTROL
// ============================================================================

export { defineAccess, hasPermission, dataType, resolvePermissionCheck, mergeRolePermissions } from "./access";
export type {
  VexAccessConfig,
  VexAccessInput,
  VexAccessError,
  VexAccessConfigError,
  CrudAction,
  DraftAction,
  AccessDefaults,
  FieldPermissionResult,
  ResolvedFieldPermissions,
  PermissionCallbackProps,
  PermissionCheck,
  SubjectEntry,
  SubjectMap,
  CustomResourceInput,
} from "./access";

```

**Location context (lines 41–48 from index.ts):**

```ts
// ============================================================================
// AUTH
// ============================================================================

export { type VexAuthAdapter, type AuthCollectionConfig, VexAuthConfigError } from "./auth/types";
export { mergeAuthCollections } from "./auth/mergeCollections";

// ============================================================================
// ACCESS CONTROL
// ============================================================================

export { defineAccess, hasPermission, dataType, resolvePermissionCheck, mergeRolePermissions } from "./access";
export type {
  VexAccessConfig,
  VexAccessInput,
  VexAccessError,
  VexAccessConfigError,
  CrudAction,
  DraftAction,
  AccessDefaults,
  FieldPermissionResult,
  ResolvedFieldPermissions,
  PermissionCallbackProps,
  PermissionCheck,
  SubjectEntry,
  SubjectMap,
  CustomResourceInput,
} from "./access";

// ============================================================================
// MEDIA / STORAGE ADAPTER
// ============================================================================
```

#### 8. Add test for access stripping in sanitizeConfig.test.ts

**Add new test block after the existing sanitizeConfigForClient test suite (after line 284):**

```ts
  it("excludes access config from client config", () => {
    // Create a config with a mock access object containing functions
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text({ required: true }) },
        }),
      ],
      access: {
        roles: ["user", "admin"],
        defaults: "allow",
        permissions: {},
      } as any, // type-cast since we're testing the runtime behavior
    });

    const client = sanitizeConfigForClient(config);

    // The client config must not have an access property
    expect(client).not.toHaveProperty("access");
    // Other properties should still be present and intact
    expect(client.collections).toHaveLength(1);
    expect(client.collections[0].slug).toBe("posts");
  });
```

**Placement: add to the `describe("sanitizeConfigForClient — strips non-serializable values", () => {` block before its closing brace (after the last existing test).**

Verify: `pnpm --filter @vexcms/core test -- sanitizeConfig && pnpm --filter @vexcms/core build`

### Step 5 — Server API enforcement seam `[dev]`

Extends `queryApi` / `mutationApi` / `globalsApi` in `packages/core/src/api/server.ts` with an
optional 4th-or-3rd `options` param (real param count differs per factory — see below) that wires
`hasPermission` into every read and write path. No `getAuth` (or no `config.access`) ⇒ every
handler behaves exactly as it does today — this is a pure additive seam, not a rewrite of any
existing query/mutation logic.

**Type placement:** `VexApiAuth` / `VexApiOptions<DataModel>` land in `packages/core/src/api/types.ts`,
not `server.ts`. Rationale: `types.ts` is already the home for cross-cutting base shapes shared by
all three factories (`GenericQueryServerParams`, `GenericMutationServerParams`) and is barrel-exported
wholesale (`packages/core/src/index.ts` does `export * from "./api/types"`) — placing the new types
there means `@vexcms/core` (root) picks them up for free. `server.ts` only ever re-exports
per-operation arg types that are co-located with their function (`FindServerArgs` next to `find`,
etc.); `VexApiAuth`/`VexApiOptions` describe the factories themselves, not one operation, so they
don't belong in an operation-specific file. `server.ts` gains one new re-export line so
`@vexcms/core/server` consumers (this is the subpath the JSDoc examples import `queryApi` from) get
the option type alongside the factory, without a second import from the package root.

- [ ] `packages/core/src/api/types.ts` — add `VexApiAuth`, `VexApiOptions<DataModel>` (full code)
- [ ] `packages/core/src/api/server.ts` — add `options?` param to `queryApi` / `mutationApi` /
      `globalsApi`; add `resolveCollectionSlug` / `hasReadPermission` / `assertWritePermission`
      module-private helpers; guard every handler (guided stubs)
- [ ] `packages/core/src/api/access.test.ts` — new file, RBAC enforcement tests (full code)

#### 1. `packages/core/src/api/types.ts` — new types `[agent]`

Append near the other `Generic*ServerParams` base shapes (after `GenericMutationServerParams`,
around line 170):

```ts
// ── RBAC enforcement seam ───────────────────────────────────────────────────
//
// Consumed by `queryApi` / `mutationApi` / `globalsApi` in `./server`. Kept here
// (not `./server`) because these describe the factories collectively, not one
// operation, and this file is barrel-exported from the package root.

/**
 * The resolved caller identity RBAC guards check against. Returned by a
 * user-supplied `getAuth` callback.
 *
 * @see {@link VexApiOptions} for where `getAuth` is configured.
 */
export type VexApiAuth = {
  /** Passed as `hasPermission`'s `user` — shape is caller-defined. */
  user: Record<string, unknown>;
  /** Role keys checked against the resolved `VexAccessConfig`. Empty array denies everything. */
  roles: string[];
};

/**
 * Optional 4th (`globalsApi`) or 3rd (`queryApi`, `mutationApi`) param enabling
 * per-request RBAC enforcement. Omitting `getAuth` — or omitting `options`
 * entirely — leaves every factory's behavior unchanged: no permission checks
 * run, matching pre-RBAC behavior exactly.
 *
 * @typeParam DataModel - The Convex data model (inferred from the factory's `query`/`mutation` builder).
 */
export type VexApiOptions<DataModel extends GenericDataModel> = {
  /**
   * Resolves the current request's caller. Called once per query/mutation
   * invocation (not once per document) when `config.access` is configured.
   * Returning `null` (no session) is treated as `{ roles: [] }` — every
   * `hasPermission` check for that request denies.
   *
   * @param ctx - The active query or mutation context. Mutation handlers pass
   *   their `GenericMutationCtx`, which is structurally a superset of
   *   `GenericQueryCtx` — the same `getAuth` works for both read and write guards.
   */
  getAuth?: (ctx: GenericQueryCtx<DataModel>) => Promise<VexApiAuth | null>;
};
```

#### 2. `packages/core/src/api/server.ts` — guarded factories `[dev]`

New/changed imports (added lines only — `internalMutationGeneric` … `RegisteredQuery` and the
`./convex` import block are unchanged):

```ts
import type {
  GenericQueryCtx, // NEW — resolveCollectionSlug / VexApiOptions ctx param
  MutationBuilder,
  RegisteredMutation,
  FunctionVisibility,
  GenericDataModel,
  QueryBuilder,
  RegisteredQuery,
} from "convex/server";
import { ConvexError, GenericId, v } from "convex/values";
import type { VexConfig } from "../config";
import type { CollectionSlug, GlobalSlug, VexDocumentGlobal } from "../types/generated";
import { hasPermission } from "../access"; // NEW
import type { VexApiAuth, VexApiOptions } from "./types"; // NEW
import { find } from "./find/server";
// … get / search / create / update / remove / globals imports unchanged …
```

Add `export type { VexApiAuth, VexApiOptions } from "./types";` next to the other re-export lines
(after `export { upsertGlobal } from "./globals/update.server";`), so `@vexcms/core/server`
consumers can build the `options` object without a second import from the package root.

Three module-private helpers, inserted above `queryApi` (after the imports/exports, before line 61's
`queryApi` JSDoc):

```ts
/**
 * Resolves the collection slug that owns a document `id` by probing
 * `ctx.db.normalizeId` against every registered collection.
 *
 * A Convex `Id` does not expose its table name at runtime. `get/server.ts`'s
 * D12 comment documents the same constraint for depth-populate, where
 * degrading to "unresolvable" is safe (populate is simply skipped). It is
 * NOT safe here — `get`, `update`, and `remove` gate a real permission
 * check — so this resolves the slug via the `ctx.db.normalizeId(tableName, id)`
 * syscall instead of string-parsing the id. Unlike the D12 trick, this works
 * identically in `convex-test` and production Convex.
 *
 * @param props.ctx - Query or mutation context — only `ctx.db.normalizeId` is used.
 * @param props.config - The resolved `VexConfig`, to enumerate candidate collections.
 * @param props.id - The document id to resolve.
 * @returns The owning collection's slug, or `undefined` if no registered collection claims it.
 */
function resolveCollectionSlug<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>;
  config: VexConfig;
  id: GenericId<CollectionSlug>;
}): CollectionSlug | undefined {
  // TODO: implement
  // 1. For each `c` of `props.config.collections`:
  //    a. `if (props.ctx.db.normalizeId(c.slug, props.id) !== null) return c.slug;`
  // 2. No collection claimed the id → return `undefined`.
  // Edge cases:
  // - `config.collections` is small and `normalizeId` is a local syscall (no DB round trip) —
  //   looping it once per `get` / `update` / `remove` request is cheap.
  // - An id for a table outside `config.collections` (e.g. `vex_globals`, or a stale id from a
  //   deleted collection) resolves to `undefined` — callers treat that as "cannot resolve
  //   resource" (see each handler's TODO below for the fail-open behavior this implies).
  throw new Error("Not implemented");
}

/**
 * Evaluates a single-document read check. Returns `true` when `doc` should
 * be visible to the resolved caller.
 *
 * @param props.config - The resolved `VexConfig` (`config.access` may be `undefined`).
 * @param props.auth - The already-resolved `VexApiAuth`, or `null` for no session.
 * @param props.resource - The subject key `doc` belongs to (a collection or global slug).
 * @param props.doc - The candidate document, passed through as `hasPermission`'s `data`.
 * @returns Whether `action: "read"` is allowed for this doc.
 */
function hasReadPermission(props: {
  config: VexConfig;
  auth: VexApiAuth | null;
  resource: string;
  doc: Record<string, unknown>;
}): boolean {
  // TODO: implement
  // 1. `return hasPermission({ access: props.config.access, user: props.auth?.user ?? {},
  //      userRoles: props.auth?.roles ?? [], resource: props.resource, action: "read",
  //      data: props.doc }) as boolean;` — no `fields` param passed, so `hasPermission`
  //    resolves to `boolean` (not the field-map overload).
  // Edge cases:
  // - `props.auth === null` (no session / `getAuth` resolved `null`) → `userRoles: []` →
  //   `hasPermission` denies per its resolution order step 2 (empty roles → deny), regardless
  //   of the config's `defaults` posture.
  throw new Error("Not implemented");
}

/**
 * Asserts a write is permitted. Delegates the throw to `hasPermission`'s
 * `throwOnDenied` — returns normally on allow, never returns a value to branch on.
 *
 * @param props.config - The resolved `VexConfig`.
 * @param props.auth - The already-resolved `VexApiAuth`, or `null`.
 * @param props.resource - The subject key being written.
 * @param props.action - `"create" | "update" | "delete"`.
 * @param props.data - The data role callbacks see — the incoming payload for `create` /
 *   globals `upsert`, the pre-write DB row for `update` / `remove`.
 * @throws {VexAccessError} When the resolved permission denies the action.
 */
function assertWritePermission(props: {
  config: VexConfig;
  auth: VexApiAuth | null;
  resource: string;
  action: "create" | "update" | "delete";
  data: Record<string, unknown>;
}): void {
  // TODO: implement
  // 1. `hasPermission({ access: props.config.access, user: props.auth?.user ?? {},
  //      userRoles: props.auth?.roles ?? [], resource: props.resource, action: props.action,
  //      data: props.data, throwOnDenied: true });`
  // 2. Discard the return value — a denial throws `VexAccessError` inside `hasPermission`;
  //    it never returns `false` here, nothing else to branch on.
  throw new Error("Not implemented");
}
```

`queryApi` — signature gains `options` as the **3rd** param (the factory only had 2: `config`,
`query`):

```ts
/**
 * Registers `find`, `get`, and `search` as Convex query endpoints.
 * … (existing JSDoc paragraphs unchanged) …
 *
 * @param config - The user's `VexConfig`. Also supplies `config.access` for RBAC.
 * @param query - The user's `query` builder. Defaults to `internalQueryGeneric`.
 * @param options - Optional `{ getAuth }` to enable RBAC read guards. Omit to leave
 *   `find` / `get` / `search` unguarded (pre-RBAC behavior).
 * @returns Registered `find` / `get` / `search` Convex queries.
 */
export function queryApi<
  DataModel extends GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>(
  config: VexConfig,
  query: QueryBuilder<DataModel, Visibility> = internalQueryGeneric as never,
  options?: VexApiOptions<DataModel>,
) {
  return {
    find: query({
      args: {
        collection: v.string(),
        populate: v.optional(v.any()),
        depth: v.optional(v.number()),
        limit: v.optional(v.number()),
        paginationOpts: v.optional(
          paginationOptsValidator.extend({ totalDocs: v.optional(v.boolean()) }),
        ),
      },
      handler: async (ctx, args) => {
        const result = await find({
          ctx,
          collection: args.collection as CollectionSlug,
          populate: args.populate,
          depth: args.depth,
          config,
          limit: args.limit,
          paginationOpts: args.paginationOpts,
        } as any);
        /**
         * TODO: RBAC read filter.
         * 1. (a) `!config.access || !options?.getAuth` → return `result` unchanged (skip auth
         *    resolution entirely — avoids calling `getAuth`, often a session/DB lookup, when
         *    there is no access config to enforce, even though `hasPermission`'s own
         *    undefined-`access` branch would resolve to allow regardless).
         * 2. (b) `const auth = (await options.getAuth(ctx)) ?? null;`
         * 3. (d) Resolve the array to filter — `find` returns either the raw array or a
         *    `PaginationResult` (`.page`) depending on `paginationOpts`:
         *    `const docs = Array.isArray(result) ? result : result.page;`
         *    `const filtered = docs.filter((doc) => hasReadPermission({ config, auth,
         *       resource: args.collection, doc: doc as Record<string, unknown> }));`
         * 4. Rebuild `result` with `filtered` in place of the array/page and return it:
         *    non-paginated → return `filtered` directly; paginated → return
         *    `{ ...result, page: filtered }` (`isDone` / `continueCursor` / `totalDocs` are left
         *    as Convex computed them pre-filter).
         * Edge cases:
         * - Paginated pages can come back with fewer than `paginationOpts.numItems` visible rows
         *   after filtering — this is the same tradeoff master already ships (see
         *   research.md "Row-level auth configs: skip — confirmed"): Convex cannot push a
         *   `hasPermission` predicate into the index, so filtering is necessarily post-query.
         * - `args.collection` is used as `resource` for every doc in this call — `find` is
         *   single-collection by construction, so unlike `get` / `update` / `remove` no
         *   per-doc `resolveCollectionSlug` call is needed.
         */
        throw new Error("Not implemented");
      },
    }) as RegisteredQuery<Visibility, VexFindArgs, VexDocument[]>,

    get: query({
      args: {
        id: v.string(),
        populate: v.optional(v.any()),
        depth: v.optional(v.number()),
      },
      handler: async (ctx, args) => {
        const doc = await get({
          ctx,
          id: args.id as GenericId<CollectionSlug>,
          populate: args.populate,
          depth: args.depth,
          config,
        });
        /**
         * TODO: RBAC read guard (single doc → `null` on denial, not filtered).
         * 1. (a) `!config.access || !options?.getAuth || doc === null` → return `doc` unchanged.
         * 2. (b) `const auth = (await options.getAuth(ctx)) ?? null;`
         * 3. `get`'s args carry no `collection` (unlike `find` / `search`) — resolve it:
         *    `const resource = resolveCollectionSlug({ ctx, config, id: args.id as GenericId<CollectionSlug> });`
         *    `if (resource === undefined) return doc;` — id doesn't belong to any registered
         *    collection; fail open rather than hide a doc no access rule can even name.
         * 4. (d) `return hasReadPermission({ config, auth, resource, doc: doc as Record<string, unknown> })
         *      ? doc : null;`
         * Edge cases:
         * - Do NOT reuse `get/server.ts`'s `__tableName` / semicolon-split `tableSlug`
         *   extraction (see its D12 comment) — it degrades to `undefined` on real production
         *   Convex ids, which is "safe" there because it only skips depth-populate. Silently
         *   skipping a permission check on that same degradation would be a security hole, so
         *   this guard goes through `resolveCollectionSlug` (`ctx.db.normalizeId`) instead.
         */
        throw new Error("Not implemented");
      },
    }) as RegisteredQuery<Visibility, VexGetArgs, VexDocument[]>,

    search: query({
      args: {
        collection: v.string(),
        searchIndexName: v.string(),
        searchField: v.string(),
        query: v.string(),
        limit: v.optional(v.number()),
        populate: v.optional(v.any()),
        depth: v.optional(v.number()),
        paginationOpts: v.optional(
          paginationOptsValidator.extend({ totalDocs: v.optional(v.boolean()) }),
        ),
      },
      handler: async (ctx, args) => {
        const result = await search({
          ctx,
          collection: args.collection as CollectionSlug,
          query: args.query,
          searchIndexName: args.searchIndexName,
          searchField: args.searchField,
          limit: args.limit,
          populate: args.populate,
          depth: args.depth,
          paginationOpts: args.paginationOpts,
          config,
        } as any);
        /**
         * TODO: RBAC read filter — identical shape to `find`'s guard above (same steps
         * 1–4, same paginated-`.page` handling). `resource` is `args.collection`, same
         * single-collection reasoning as `find`.
         */
        throw new Error("Not implemented");
      },
    }) as RegisteredQuery<Visibility, VexSearchArgs, VexDocument[]>,
  };
}
```

`mutationApi` — signature gains `options` as the **3rd** param; `_config` becomes `config` (no
longer unused — the leading underscore convention only applies to genuinely-unused params):

```ts
/**
 * Registers `create`, `update`, and `remove` as Convex mutation endpoints.
 * … (existing JSDoc paragraphs unchanged) …
 *
 * @param config - The user's `VexConfig`. Also supplies `config.access` for RBAC.
 * @param mutation - The user's `mutation` builder from `convex/_generated/server`.
 *   Defaults to `internalMutationGeneric`.
 * @param options - Optional `{ getAuth }` to enable RBAC write guards. Omit to leave
 *   `create` / `update` / `remove` unguarded (pre-RBAC behavior).
 * @returns Registered `create` / `update` / `remove` Convex mutations.
 */
export function mutationApi<
  DataModel extends GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>(
  config: VexConfig,
  mutation: MutationBuilder<DataModel, Visibility> = internalMutationGeneric as never,
  options?: VexApiOptions<DataModel>,
) {
  return {
    create: mutation({
      args: {
        collection: v.string(),
        data: v.any(),
      },
      returns: v.string(),
      handler: async (ctx, args) => {
        /**
         * TODO: RBAC write guard — check BEFORE inserting.
         * 1. (a) `!config.access || !options?.getAuth` → skip straight to step 4.
         * 2. (b) `const auth = (await options.getAuth(ctx)) ?? null;`
         * 3. (c) `assertWritePermission({ config, auth, resource: args.collection, action: "create",
         *      data: args.data as Record<string, unknown> });` — throws `VexAccessError` on
         *    denial, aborting before any write (Convex mutations are transactional; nothing
         *    is committed).
         * 4. Proceed to the existing `create({ ctx, collection: args.collection as CollectionSlug,
         *      data: args.data })` call, unchanged, and return its result.
         * Edge cases:
         * - `data` checked is the INCOMING payload (`args.data`) — there is no existing document
         *   yet for `create`.
         */
        throw new Error("Not implemented");
      },
    }) as RegisteredMutation<Visibility, never, never>,

    update: mutation({
      args: {
        id: v.string(),
        data: v.any(),
      },
      handler: async (ctx, args) => {
        /**
         * TODO: RBAC write guard — check against the EXISTING doc, not the patch payload.
         * 1. (a) `!config.access || !options?.getAuth` → skip straight to step 6.
         * 2. (b) `const auth = (await options.getAuth(ctx)) ?? null;`
         * 3. `const existing = await ctx.db.get(args.id as GenericId<CollectionSlug>);`
         *    `if (existing === null)` → skip the permission check and fall through to step 6 —
         *    the existing `update()` call throws Convex's own "nonexistent document" error from
         *    `ctx.db.patch`, matching current unguarded behavior for a bad id.
         * 4. `const resource = resolveCollectionSlug({ ctx, config, id: args.id as GenericId<CollectionSlug> });`
         *    (defined whenever `existing` is non-null — the id resolved to a real row.)
         * 5. (c) `assertWritePermission({ config, auth, resource: resource as string, action: "update",
         *      data: existing as unknown as Record<string, unknown> });`
         * 6. Proceed to the existing `update({ ctx, id: args.id as GenericId<CollectionSlug>,
         *      data: args.data })` call, unchanged.
         * Edge cases:
         * - The permission callback sees the PRE-patch document — a role that can only update
         *   its own docs checks e.g. `data.author` on the row as it exists NOW, not the patched
         *   result (matches master's `update` semantics — see master-report.md).
         */
        throw new Error("Not implemented");
      },
    }) as RegisteredMutation<Visibility, never, never>,

    remove: mutation({
      args: {
        ids: v.array(v.string()),
        softDelete: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        /**
         * TODO: RBAC write guard — one check per id, existing doc as data.
         * 1. (a) `!config.access || !options?.getAuth` → skip straight to step 4.
         * 2. (b) `const auth = (await options.getAuth(ctx)) ?? null;`
         * 3. For EACH id in `args.ids`, sequentially (`for...of`, not `Promise.all` — a thrown
         *    `VexAccessError` must abort before any further checks or the delete itself):
         *    a. `const existing = await ctx.db.get(id as GenericId<CollectionSlug>);`
         *       `if (existing === null) continue;` — already-gone id, same no-op treatment
         *       `remove()` gives it today.
         *    b. `const resource = resolveCollectionSlug({ ctx, config, id: id as GenericId<CollectionSlug> });`
         *    c. `assertWritePermission({ config, auth, resource: resource as string, action: "delete",
         *         data: existing as unknown as Record<string, unknown> });`
         * 4. All ids passed the guard (or RBAC disabled) → proceed to the existing
         *    `remove({ ctx, ids: args.ids as GenericId<CollectionSlug>[], softDelete: args.softDelete })`
         *    call, unchanged.
         * Edge cases:
         * - A denial on the 3rd of 5 ids throws before ids 4–5 are even checked, and before any
         *   of the 5 are deleted — Convex mutations run in one transaction, so the whole call
         *   rolls back atomically. Bulk delete is all-or-nothing under RBAC, not best-effort.
         */
        throw new Error("Not implemented");
      },
    }) as RegisteredMutation<Visibility, never, never>,
  };
}
```

`globalsApi` — signature gains `options` as the **4th** param (this factory already had 3:
`config`, `query`, `mutation` — this is the one case where "4th param" is literal):

```ts
/**
 * Registers `globals.get`, `globals.find`, and `globals.update` as Convex
 * query and mutation endpoints under `api.vex.globals.*`.
 * … (existing JSDoc paragraphs unchanged) …
 *
 * @param config - The resolved `VexConfig`. Also supplies `config.access` for RBAC.
 * @param query - Convex `query` builder. Defaults to `internalQueryGeneric`.
 * @param mutation - Convex `mutation` builder. Defaults to `internalMutationGeneric`.
 * @param options - Optional `{ getAuth }` to enable RBAC guards. Omit to leave
 *   `globals.get` / `globals.find` / `globals.upsert` unguarded (pre-RBAC behavior).
 * @returns `{ globals }` with `.get`, `.find`, `.update` registered handlers.
 */
export function globalsApi<
  DataModel extends GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>(
  config: VexConfig,
  query: QueryBuilder<DataModel, Visibility> = internalQueryGeneric as never,
  mutation: MutationBuilder<DataModel, Visibility> = internalMutationGeneric as never,
  options?: VexApiOptions<DataModel>,
) {
  return {
    get: query({
      args: {
        slug: v.string(),
        populate: v.optional(v.any()),
      },
      handler: async (ctx, args) => {
        const doc = await getGlobal({
          ctx,
          slug: args.slug as GlobalSlug,
          populate: args.populate,
          config,
        });
        /**
         * TODO: RBAC read guard — same shape as collection `get`, but `resource` is the slug
         * directly (globals don't need `resolveCollectionSlug` — the arg already names the subject).
         * 1. (a) `!config.access || !options?.getAuth || doc === null` → return `doc` unchanged.
         * 2. (b) `const auth = (await options.getAuth(ctx)) ?? null;`
         * 3. (d) `return hasReadPermission({ config, auth, resource: args.slug,
         *      doc: doc as unknown as Record<string, unknown> }) ? doc : null;`
         */
        throw new Error("Not implemented");
      },
    }) as RegisteredQuery<Visibility, VexGlobalsGetArgs, VexDocumentGlobal | null>,

    find: query({
      args: {},
      handler: async (ctx) => {
        const docs = await findGlobals({ ctx });
        /**
         * TODO: RBAC read filter — `resource` varies PER DOC (`doc._slug`), unlike collection
         * `find`, where `resource` is one fixed `args.collection` for the whole call.
         * 1. (a) `!config.access || !options?.getAuth` → return `docs` unchanged.
         * 2. (b) `const auth = (await options.getAuth(ctx)) ?? null;`
         * 3. (d) `return docs.filter((doc) => hasReadPermission({ config, auth, resource: doc._slug,
         *      doc: doc as unknown as Record<string, unknown> }));`
         */
        throw new Error("Not implemented");
      },
    }) as RegisteredQuery<Visibility, VexGlobalsFindArgs, VexDocumentGlobal[]>,

    upsert: mutation({
      args: {
        slug: v.string(),
        data: v.any(),
      },
      returns: v.string(),
      handler: async (ctx, args) => {
        const globalConfig = config.globals.find((g) => g.slug === args.slug);
        if (!globalConfig) {
          throw new ConvexError(`No global registered with slug "${args.slug}"`);
        }
        /**
         * TODO: RBAC write guard — resource is the global's own slug, action always "update"
         * (globals have no separate create/update distinction at the API level — `upsertGlobal`
         * inserts or patches transparently).
         * 1. (a) `!config.access || !options?.getAuth` → skip straight to step 4.
         * 2. (b) `const auth = (await options.getAuth(ctx)) ?? null;`
         * 3. (c) `assertWritePermission({ config, auth, resource: args.slug, action: "update",
         *      data: args.data as Record<string, unknown> });`
         * 4. Proceed to the existing `upsertGlobal({ ctx, slug: args.slug as GlobalSlug,
         *      data: args.data as Record<string, unknown>, globalConfig })` call, unchanged.
         * Edge cases:
         * - Checked against the INCOMING payload, not a loaded existing row — a global may not
         *   have been saved yet (first save = insert inside `upsertGlobal`), so there is no
         *   guaranteed existing doc to load, unlike collection `update`.
         */
        throw new Error("Not implemented");
      },
    }) as RegisteredMutation<Visibility, VexGlobalsUpdateArgs, string>,
  };
}
```

#### 3. `packages/core/src/api/access.test.ts` — RBAC enforcement tests `[agent]`

New file (not folded into an existing `*/server.test.ts`, since it exercises the three top-level
factories in `server.ts` rather than one operation's server function — mirrors how `server.ts`
itself is a separate module from `find/server.ts` etc. per the `api-operation-split` naming rule).

Existing tests in this package call the plain server functions (`find`, `get`, `create`, …)
directly via `t.run(ctx => fn({ ctx, ... }))`, bypassing Convex's `query()`/`mutation()`
registration entirely (see `find/server.test.ts`, `globals/get.server.test.ts`). The RBAC guard
lives *inside* `queryApi`/`mutationApi`/`globalsApi`'s handler closures, so this file needs to
invoke those handlers directly too. `query()`/`mutation()` builders accept any function matching
`QueryBuilder`/`MutationBuilder`; passing an identity builder that returns `handler` unwrapped
(instead of `internalQueryGeneric`/`internalMutationGeneric`) gets a plain `(ctx, args) => Promise<...>`
callable straight from `t.run`, with no need for a real registered Convex module.

```ts
import { convexTest } from "convex-test";
import type {
  GenericDataModel,
  GenericMutationCtx,
  MutationBuilder,
  QueryBuilder,
} from "convex/server";
import { describe, expect, it } from "vitest";

import { defineAccess } from "../access/config";
import { VexAccessError } from "../access/types";
import type { VexConfig } from "../config";
import { text } from "../fields";
import { defineGlobal } from "../globals/config";
import * as generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import { globalsApi, mutationApi, queryApi } from "./server";
import type { VexApiAuth } from "./types";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(generatedApi),
};

/**
 * Identity `query`/`mutation` builders — return the raw `handler` instead of a
 * Convex-registered function, so tests can call `(fn as UnwrappedHandler)(ctx, args)`
 * directly via `t.run` without a real registered Convex module (mirrors the
 * `t.run(ctx => find({ ctx, ... }))` pattern the rest of this package's tests use,
 * one layer further out at the factory boundary).
 */
const passthroughQuery = ((def: { handler: (...args: never[]) => unknown }) =>
  def.handler) as unknown as QueryBuilder<GenericDataModel, "public">;
const passthroughMutation = ((def: { handler: (...args: never[]) => unknown }) =>
  def.handler) as unknown as MutationBuilder<GenericDataModel, "public">;

type UnwrappedHandler = (
  ctx: GenericMutationCtx<GenericDataModel>,
  args: Record<string, unknown>,
) => Promise<unknown>;

// ── Fixture collections (mirrors find/server.test.ts's fixtureConfig shape) ──
const postsCollection = {
  slug: "posts",
  fields: {
    title: { type: "text" },
    author: { type: "relationship", collection: { slug: "authors" } },
  },
  labels: { singular: "Post", plural: "Posts" },
  admin: { useAsTitle: "title" },
};

const authorsCollection = {
  slug: "authors",
  fields: { name: { type: "text" } },
  labels: { singular: "Author", plural: "Authors" },
  admin: { useAsTitle: "name" },
};

const siteSettingsGlobal = defineGlobal({
  slug: "siteSettings",
  label: "Site Settings",
  fields: { siteName: text({ label: "Site Name", required: true }) },
});

// editor: full posts CRUD + can save site settings.
// viewer: read-only on posts, restricted to docs they authored; cannot write
// posts or site settings at all.
const access = defineAccess({
  roles: ["editor", "viewer"],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resources: [postsCollection, siteSettingsGlobal] as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userCollection: authorsCollection as any,
  permissions: {
    editor: {
      posts: { create: true, read: true, update: true, delete: true },
      siteSettings: { update: true },
    },
    viewer: {
      posts: {
        create: false,
        read: ({ data, user }: { data: unknown; user: Record<string, unknown> }) => {
          const author = (data as { author?: unknown }).author;
          return Array.isArray(author) && author.includes(user._id);
        },
        update: false,
        delete: false,
      },
      siteSettings: { update: false },
    },
  },
});

function fixtureConfig(withAccess: boolean): VexConfig {
  return {
    collections: [postsCollection, authorsCollection],
    globals: [siteSettingsGlobal],
    access: withAccess ? access : undefined,
  } as unknown as VexConfig;
}

describe("RBAC server API enforcement", () => {
  it("no options.getAuth configured → every operation is unguarded", async () => {
    const t = convexTest(schema, modules);
    const config = fixtureConfig(true); // access IS configured...
    const { find } = queryApi(config, passthroughQuery); // ...but no options passed
    const { create } = mutationApi(config, passthroughMutation);

    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      (create as unknown as UnwrappedHandler)(ctx, { collection: "posts", data: { title: "Hi" } }),
    );
    expect(typeof id).toBe("string");

    const docs = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      (find as unknown as UnwrappedHandler)(ctx, { collection: "posts" }),
    )) as { title: string }[];
    expect(docs).toHaveLength(1);
    expect(docs[0].title).toBe("Hi");
  });

  it("getAuth resolving to null denies writes and empties reads", async () => {
    const t = convexTest(schema, modules);
    const config = fixtureConfig(true);
    const getAuth = async (): Promise<VexApiAuth | null> => null;
    const { create } = mutationApi(config, passthroughMutation, { getAuth });
    const { find, get } = queryApi(config, passthroughQuery, { getAuth });

    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        (create as unknown as UnwrappedHandler)(ctx, {
          collection: "posts",
          data: { title: "Hi" },
        }),
      ),
    ).rejects.toThrow(VexAccessError);

    // Seed a post directly, bypassing the guarded mutation, so the read guards
    // have something to filter/deny.
    const postId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "Existing" }),
    );

    const docs = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      (find as unknown as UnwrappedHandler)(ctx, { collection: "posts" }),
    );
    expect(docs).toEqual([]);

    const doc = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      (get as unknown as UnwrappedHandler)(ctx, { id: postId }),
    );
    expect(doc).toBeNull();
  });

  it("viewer role (posts.delete: false) → remove throws VexAccessError", async () => {
    const t = convexTest(schema, modules);
    const config = fixtureConfig(true);
    const authorId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("authors", { name: "Lena" }),
    );
    const postId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "Mine", author: [authorId] }),
    );
    const getAuth = async (): Promise<VexApiAuth | null> => ({
      user: { _id: authorId },
      roles: ["viewer"],
    });
    const { remove } = mutationApi(config, passthroughMutation, { getAuth });

    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        (remove as unknown as UnwrappedHandler)(ctx, { ids: [postId] }),
      ),
    ).rejects.toThrow(VexAccessError);

    const stillExists = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.get(postId),
    );
    expect(stillExists).not.toBeNull();
  });

  it("owner-only read callback filters find() to only the caller's docs", async () => {
    const t = convexTest(schema, modules);
    const config = fixtureConfig(true);
    const authorAId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("authors", { name: "A" }),
    );
    const authorBId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("authors", { name: "B" }),
    );
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A's post", author: [authorAId] });
      await ctx.db.insert("posts", { title: "B's post", author: [authorBId] });
    });
    const getAuth = async (): Promise<VexApiAuth | null> => ({
      user: { _id: authorAId },
      roles: ["viewer"],
    });
    const { find } = queryApi(config, passthroughQuery, { getAuth });

    const docs = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      (find as unknown as UnwrappedHandler)(ctx, { collection: "posts" }),
    )) as { title: string }[];
    expect(docs).toHaveLength(1);
    expect(docs[0].title).toBe("A's post");
  });

  it("viewer role (siteSettings.update: false) → globals upsert throws VexAccessError", async () => {
    const t = convexTest(schema, modules);
    const config = fixtureConfig(true);
    const getAuth = async (): Promise<VexApiAuth | null> => ({
      user: { _id: "viewer-1" },
      roles: ["viewer"],
    });
    const { globals } = globalsApi(config, passthroughQuery, passthroughMutation, { getAuth });

    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        (globals.upsert as unknown as UnwrappedHandler)(ctx, {
          slug: "siteSettings",
          data: { siteName: "Nope" },
        }),
      ),
    ).rejects.toThrow(VexAccessError);

    const rows = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    );
    expect(rows).toHaveLength(0);
  });
});
```

Verify: `pnpm --filter @vexcms/core test -- api`

### Step 6 — www wiring + stub removal `[dev]`

Wires the access module into the real app: `apps/www/src/vexcms/access.ts` (the
authored config — full code, mostly declarative), `apps/www/src/vex.config.ts`
(registration), `apps/www/convex/vex/auth.ts` (`getAuth` — genuinely ambiguous
session resolution, guided stub), and the two Convex registration points that
receive `{ getAuth }`. Ends with deleting the now-dead app-level permission stub.

- [ ] `apps/www/src/vexcms/access.ts` — new file, full code.

  There is no `defineCollection` for the better-auth `user` table in this app
  (`authOptions.user.modelName` in `apps/www/src/auth/options.ts` points
  better-auth straight at the `TABLE_SLUG_USERS` table) — but it's still a
  real *resource* here: `apps/www/src/vex.types.ts`'s generated
  `DocumentBySlug` registry already maps slug `"user"` to `UserDocument`
  (better-auth-merged tables are generated too, not just vexcms
  collections — see `vex.types.ts:308` `UserDocument`, `:494` the
  `DocumentBySlug` entry). So `{ slug: TABLE_SLUG_USERS }` goes straight
  into `resources` alongside the real collections, and the self-read/update
  check from the deleted stub becomes a normal per-action CRUD map on that
  subject — `data` comes back typed as `UserDocument` from the registry, no
  `dataType()` carrier needed. `seedData` is the one `customResources`
  entry (array-shorthand form, ties to the real `apps/www/convex/seed.ts`);
  a commented-out line illustrates the object/`dataType()` form since
  nothing in this app needs a non-collection typed custom resource today.

  ```ts
  // apps/www/src/vexcms/access.ts
  import { defineAccess } from "@vexcms/core";

  import { TABLE_SLUG_USERS, USER_ROLES } from "~/db/constants";

  import { footers, headers, pages, siteSettings, themes } from "./collections";
  import { nav } from "./globals/nav";

  /**
   * RBAC configuration for the demo/development site.
   *
   * Two roles (`USER_ROLES.admin` / `USER_ROLES.user` —
   * `apps/www/src/db/constants/auth.ts`): `admin` gets the `"*"` wildcard
   * (every subject, every action). `user` gets admin-panel access plus
   * read/update on their own account only — same ownership check
   * (`user._id === data._id`) and create/delete posture as the deleted
   * `~/auth/permissions.ts` stub. Every other subject (all collections +
   * `nav`) falls through to this config's `defaults` posture ("allow", the
   * system default) for the `user` role.
   *
   * The better-auth-owned `user` table has no `defineCollection` in this
   * app, but `apps/www/src/vex.types.ts`'s generated `DocumentBySlug`
   * registry maps slug `"user"` to `UserDocument`, so `{ slug:
   * TABLE_SLUG_USERS }` is enough for the `user`-role callbacks below to
   * get `data: UserDocument` for free.
   *
   * `images` is intentionally excluded from `resources`, same as it's
   * excluded from `vex.config.ts`'s `collections:` array — media collections
   * are served by `mediaQueryApi`/`mediaMutationApi`, not `queryApi`/
   * `mutationApi`/`globalsApi`, so they sit outside this RBAC seam.
   *
   * @see defineAccess in @vexcms/core
   * @see apps/www/src/vex.config.ts for registration
   */
  export const access = defineAccess({
    roles: [USER_ROLES.admin, USER_ROLES.user],
    resources: [
      pages,
      headers,
      footers,
      themes,
      siteSettings,
      nav,
      { slug: TABLE_SLUG_USERS },
    ],
    userCollection: { slug: TABLE_SLUG_USERS },
    customResources: {
      // array shorthand: bare action list, no `data` typing needed.
      seedData: ["reset"],
      // object form illustration (unused here — every real subject in this
      // app is already typed via the DocumentBySlug registry above):
      //   analytics: { actions: ["view"], data: dataType<AnalyticsSnapshot>() }
    },
    permissions: {
      [USER_ROLES.admin]: {
        "*": true,
      },
      [USER_ROLES.user]: {
        adminPanel: {
          access: true,
        },
        [TABLE_SLUG_USERS]: {
          "*": false, // action-level wildcard — deny everything not declared below
          read: ({ data, user }) => user._id === data._id,
          update: ({ data, user }) => user._id === data._id,
        },
      },
    },
  });
  ```

- [ ] `apps/www/src/vex.config.ts` — add `access` import + field.

  ```ts
  // apps/www/src/vex.config.ts
  import { betterAuthAdapter } from "@vexcms/better-auth";
  import { defineConfig } from "@vexcms/core";
  import { convexFileStorage } from "@vexcms/file-storage-convex";

  import { authOptions } from "~/auth/options";
  import { footers, headers, images, pages, siteSettings, themes } from "~/vexcms/collections";

  import { access } from "./vexcms/access";
  import { nav } from "./vexcms/globals/nav";

  const vexConfig = defineConfig({
    admin: {
      sidebar: {
        side: "right",
      },
    },
    access,
    authAdapter: betterAuthAdapter({ config: authOptions }),
    storage: {
      adapters: [convexFileStorage({ mediaCollections: [images] })],
    },
    collections: [pages, headers, footers, themes, siteSettings],
    globals: [nav],
  });

  export default vexConfig;
  ```

- [ ] `apps/www/convex/vex/auth.ts` — new file, guided stub.

  `getAuth` runs inside `GenericQueryCtx` — no request cookies, so the
  Next.js-side session-token flow (`getSessionWithUser` +
  `apps/www/src/auth/serverUtils.ts`'s `cookies()` read) doesn't apply here.
  The only auth surface a Convex ctx has is `ctx.auth.getUserIdentity()`,
  already used (unparsed) by `apps/www/convex/auth/api.ts`'s
  `identifyCurrentUser`. Its `identity.subject` format for this
  `@convex-dev/better-auth` "convex" plugin version isn't established
  anywhere in the repo — the TODOs below name the real candidates and leave
  that call to whoever implements this.

  ```ts
  // apps/www/convex/vex/auth.ts
  import type { VexApiAuth } from "@vexcms/core/server";
  import type { GenericQueryCtx } from "convex/server";

  import type { DataModel } from "../_generated/dataModel";

  /**
   * Resolves `{ user, roles }` for RBAC enforcement inside the Convex
   * functions registered by `queryApi`/`mutationApi`/`globalsApi`
   * (`apps/www/convex/vex.ts`, `apps/www/convex/vex/globals.ts`).
   *
   * @param ctx - Convex query context. A mutation ctx satisfies this too
   *   (`GenericMutationCtx` extends `GenericQueryCtx`).
   * @returns `{ user, roles }` for an authenticated session backed by an
   *   existing `user` doc, else `null`. `hasPermission` treats `null` as
   *   `userRoles: []` (deny).
   */
  export async function getAuth(
    ctx: GenericQueryCtx<DataModel>,
  ): Promise<VexApiAuth | null> {
    // TODO: implement
    // 1. Resolve the Convex-native identity for this request:
    //      const identity = await ctx.auth.getUserIdentity()
    //    → populated via the @convex-dev/better-auth "convex" plugin
    //      (apps/www/convex/auth/plugins/index.ts) + the customJwt provider
    //      in apps/www/convex/auth.config.ts. This is the only identity
    //      source available in a GenericQueryCtx.
    //   a. identity === null → not authenticated → return null.
    // 2. Resolve the app's `user` doc from the identity:
    //   a. TODO(dev): confirm whether `identity.subject` is the raw `user`
    //      table `_id` or some composite string for the installed
    //      @convex-dev/better-auth version — there's no in-repo precedent
    //      (identifyCurrentUser in apps/www/convex/auth/api.ts never parses
    //      `subject`); check the plugin's source/docs before wiring this up.
    //   b. await ctx.db.get(userId as Id<typeof TABLE_SLUG_USERS>) — same
    //      lookup as getSessionWithUser (apps/www/convex/auth/sessions.ts:32).
    //   c. Doc missing (deleted account, stale token) → return null.
    // 3. Read `roles` off the resolved doc — added via
    //    authOptions.user.additionalFields.roles
    //    (apps/www/src/auth/options.ts:27-34), default [USER_ROLES.user].
    //   a. Missing/empty roles → use [], NOT [USER_ROLES.user] — never
    //      silently upgrade a role-less doc to the default role.
    // 4. → { user, roles }.
    //
    // Edge cases:
    // - No identity → null.
    // - Identity resolves but the `user` doc no longer exists → null.
    // - `user.roles` undefined/empty → roles: [] (hasPermission denies empty
    //   role sets — see the access-control contract's resolution order).
    throw new Error("Not implemented");
  }
  ```

- [ ] `apps/www/convex/vex/globals.ts` — pass `{ getAuth }` to `globalsApi`.

  ```ts
  // apps/www/convex/vex/globals.ts
  import { globalsApi } from "@vexcms/core/server";

  import config from "~/vex.config";

  import { mutation, query } from "../_generated/server";
  import { getAuth } from "./auth";

  export const { get, find, upsert } = globalsApi(config, query, mutation, { getAuth });
  ```

- [ ] `apps/www/convex/vex.ts` — pass `{ getAuth }` to `queryApi`/`mutationApi`
      (the only other registration point — `apps/www/convex/vex/media.ts` uses
      the separate `mediaQueryApi`/`mediaMutationApi`, out of scope here).

  ```ts
  // apps/www/convex/vex.ts
  import { mutationApi, queryApi } from "@vexcms/core/server";

  import config from "~/vex.config";

  import { mutation, query } from "./_generated/server";
  import { getAuth } from "./vex/auth";

  export const { find, get, search } = queryApi(config, query, { getAuth });
  export const { create, update, remove } = mutationApi(config, mutation, { getAuth });
  ```

- [ ] DELETE `apps/www/src/auth/permissions.ts` — zero callsites (verified:
      no import of `~/auth/permissions` or relative equivalent anywhere under
      `apps/www/src` or `apps/www/convex`). After deletion, the
      `auth-file-roles` naming rule (`.agent/docs/standards/naming-conventions.md`)
      still holds for everything left in `apps/www/src/auth/`:
      `client.tsx`, `server.ts`, `serverUtils.ts`, `options.ts`, `types.ts` —
      `permissions.ts` was the one file in that fixed role set this spec removes.

Verify: `pnpm --filter www typecheck && pnpm --filter www build`

## Verification

- `pnpm --filter @vexcms/core test` — full core suite green (access, config, api groups).
- `pnpm --filter @vexcms/core build` — clean build, no TypeDoc warnings on new exports.
- `pnpm --filter www typecheck && pnpm --filter www build` — www compiles with access wired
  and the permissions stub deleted.
- Smoke: with a `user`-role session, a denied write (e.g. `users` delete) through the Convex
  API throws `VexAccessError`; `find` on a read-restricted collection returns only permitted
  docs; admin role unaffected.
