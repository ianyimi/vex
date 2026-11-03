---
"@vexcms/core": patch
---

**Breaking: `readViews`/`createView`/`updateView`/`deleteView` (`VIEW_ACTIONS`) no longer
type-accept a field-permission map or a `{ where, filter, withIndex }` constrained-query
object** — both forms were always meaningless for them (a saved view is one whole
collection-level row in `vex_views`, never read or written per-field or per-document). The new
`ViewPermissionCheck<TUser, TOrg>` type is `boolean | ((props: { user, organization? }) =>
boolean | undefined)` only — a single props object, matching every other permission callback's
shape (no `data`), so a future per-view property can be added later without another breaking
change.

**Migration:** a view action already returning a plain boolean or a boolean-returning callback
reading only `user`/`organization` needs no change. One that returned a field-permission map or
a constrained-query object now fails to typecheck — replace it with a boolean or a callback
that computes one. If such a config somehow reaches runtime anyway (an untyped config, an `as`
cast), it now fails closed with a dev-only console warning instead of being read as an implicit
allow.
