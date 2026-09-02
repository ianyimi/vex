---
"@vexcms/core": minor
"@vexcms/react": minor
"@vexcms/next": minor
"@vexcms/better-auth": minor
---

Add RBAC access control (spec 2026-08-12), a config/auth-bound server API, and per-slug return
type narrowing for the client wrappers.

- `@vexcms/core`: new `access/` module — `defineAccess()` builds a role → subject → action matrix
  typed from the registered collections and globals; `hasPermission()` resolves it at runtime and
  merges every role the caller holds. `PERMISSION_SCOPES` (`doc` / `any` / `all`) decides how a
  check that inspects the document is answered when no `data` is supplied — `any` → `true` for
  nav/list gating, `all` → `false` for bulk affordances (the default, fail-closed), `doc` throws.
  Every server guard enforces access via `resolveGetAuth`. `vexServerApi()` binds `config` once
  and resolves `auth` per call so call sites pass neither, with `skipAccess: true` as the
  explicit opt-out for public reads. Client wrappers (`get`/`find`/`search`/`globals.get`) now
  narrow to the document of the `collection` slug passed in, honouring `populate` and literal
  `depth`; `find`/`search` gained array-vs-paginated overloads. Relationship and upload fields
  generate `Id<"target">[]` instead of `Id<CollectionSlug>[]`, which is what makes populated
  fields resolve to `Doc<target>[]`.
- `@vexcms/react`: `VexAccessContext`, `VexAuthContext`, and `usePermission`; `AdminSidebar`
  filters collections, globals, and media collections with `scope: "any"`.
- `@vexcms/better-auth`: `createGetAuth()` resolves the caller (user + active organization) from
  the Convex `ctx` for use as `vexServerApi`/`collectionsApi`'s `getAuth`.
- `@vexcms/next`: admin layout/page pass the server-resolved caller into the admin UI.

BREAKING: the globals mutation `globals.update` is renamed `globals.upsert` (endpoint, server
function `upsertGlobal`, and client wrapper). Bumped `minor` rather than `major` because these
packages are pre-1.0 alpha, consistent with the globals-system changeset.
