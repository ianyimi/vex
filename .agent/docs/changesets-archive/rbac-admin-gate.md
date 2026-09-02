---
"@vexcms/core": minor
"@vexcms/react": minor
"@vexcms/better-auth": patch
"@vexcms/cli": patch
"@vexcms/richtext-plate": patch
"create-vexcms": patch
---

Enforce the `adminPanel` access gate, fix two authorization defects, and add a single switch for
turning RBAC off.

- `@vexcms/core`: new `canAccessAdminPanel()` answers the `adminPanel.access` gate without
  callers hand-typing the subject and action — nothing consulted that subject before, so any
  authenticated caller reached the admin panel regardless of the matrix. `defineAccess()` gains
  `enabled` (default `true`), checked inside `hasPermission`, so one field on the resolved config
  turns access control off for the server guards and the admin UI together. **Security fix:**
  `update` authorized against the caller-supplied patch rather than the stored document, letting
  a per-document rule be satisfied by the request body; it now fetches and checks the stored row,
  matching `get`/`find`/`remove`. `deleteMedia` now passes the stored document too, so
  per-document delete rules are satisfiable.
- `@vexcms/react`: new `UnauthorizedView` for callers who fail an access check. `Button` gains
  `aria-disabled:*` variants so a link-rendered button (`nativeButton={false}`) actually greys
  out and stops responding — `disabled:*` never matched the rendered `<a>`. `CollectionListView`
  had its create button's `disabled` prop inverted; bulk delete is now permission-gated in both
  the collection and media list views.
- `@vexcms/cli`: removed the unimplemented `schema/generateSchema.ts` stub (superseded by core's
  `generateVexSchema`, and already excluded from the package's own test run). JSDoc completed
  across the package; a `pushSchemaStandalone` description that claimed to run `convex deploy`
  now matches its actual `dev --once` behavior.
- `@vexcms/better-auth`, `@vexcms/richtext-plate`, `create-vexcms`: JSDoc completed on exported
  symbols; unused imports and bindings removed. No behavior changes.
