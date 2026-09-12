---
"@vexcms/core": minor
"@vexcms/react": minor
"@vexcms/next": patch
---

A permission check's filter callback may now return a **field map** instead of a
boolean — `update: () => ({ "*": false, adminTheme: true })` — whether written
bare on the action or as the `filter` beside a `constraints` descriptor. Nothing
new may be written directly ON an action, which is what keeps a document free to
own fields named `constraints` or `filter`: a returned object is always a map, so
there is nothing to disambiguate. A map may carry a `"*"` wildcard or be partial;
an omitted key resolves to denied.

**`hasPermission` stays the single gate and still returns `boolean`.** It folds a
resolved map by what the caller says about the operation: with `changes`, every
CHANGED key must be permitted — a field resent unchanged is not a write to it,
which is what lets a full-form submit succeed while still rejecting a real edit
to a denied field; with only `data` the map projects rather than denies, so a
read is shaped instead of refused; with neither, the existing `scope` decides. A
role with no field map anywhere takes the same paths as before, so existing call
sites are unaffected.

**New in `@vexcms/core`:** `resolveFieldPermissions` answers the read-only
"which fields may this caller touch?" question and shares `hasPermission`'s role
walk, so the two cannot drift. `isFieldAllowed` and `stripDeniedFields` shape a
response; `VexAccessError` gained an optional `field`. `ValidateFieldMaps` type-
checks every map against the subject's own document at the `defineAccess` call
site with no `satisfies`, return annotation, or wrapper — a misspelling reports
`✖ field map returns a field not on this resource: "admnTheme"` at the exact
property. System keys (`_id`, `_creationTime`, `_slug`) are never gateable and
never stripped.

**Enforcement is server-side.** `create`, `update`, `upsertGlobal` and
`createMediaDocument` authorize the payload; `find`, `get`, `search`,
`globals/get` and `globals/find` strip denied keys from every returned document.
As with `hasPermission` today, this is enforced in the generated Convex
functions and the admin-panel bundle — a hand-rolled function calling `ctx.db`
directly bypasses it the same way it already bypasses `hasPermission`.

**New in `@vexcms/react`:** `useFieldPermissions` and `useVisibleFields` gate the
admin panel client-side (advisory; the server remains the enforcement point).
Read-denied fields are HIDDEN in every edit view and kept out of the form's
default values and validation schema, so they cannot be seen or submitted and a
required one cannot block Save; update-denied fields stay visible and read-only.
List views filter their columns the same way. The three edit views now submit
only the fields the user actually changed, and `useLiveFieldMerge` keeps
untouched fields in sync with the live document — together these stop two
editors on one document from reverting each other's untouched fields.

BREAKING CHANGE: `upsertGlobal` now authorizes `create`/`update` instead of
`read`. A global is a singleton, so the verb depends on existence: the first save
authorizes as `create`, every later one as `update`. A role that relied on a
global's `read` grant to WRITE it must now be given `create` and/or `update`
explicitly — previously `siteSettings.read: true` was enough to overwrite the
entire global. `upsertGlobal` also merges its payload into the stored `data` blob
rather than replacing it, so a caller that depended on replacement to CLEAR
omitted fields must now send those fields explicitly.
