---
"@vexcms/core": patch
"@vexcms/react": patch
---

Bumped `patch` despite being breaking, per this track's own `config-client-server-split`
convention — see that changeset's note on the `alpha` pre-release base.

`defineCollection`'s auto-injected `updatedAt` field switches from `date({ on: "save" })` to
the new `commitTs({ on: "save" })` field type — Convex's own database-stamped commit
timestamp (`v.commitTs()`), resolved to an `int64` the server converts to a plain Unix-ms
`number` before it's ever visible to a reader. `stampUpdatedAt` is removed entirely, replaced
by `stampCommitTsFields`, which stamps every `commitTs`-typed field (not just `updatedAt`) on
a configurable set of write events (`create`/`update`/`publish`/`unpublish`/`draftSave`, via
each field's own `on` policy).

A `where` clause on a `commitTs` field with a non-integer or non-finite number throws
`VexError({ code: "INVALID_WHERE" })` naming the field.

**No migration path** (pre-release, no-data-loss requirement waived by design): an existing
dev row's numeric `updatedAt` fails Convex schema validation the moment the regenerated
schema (`v.optional(v.commitTs())`) pushes. Unset `updatedAt` on every row before
redeploying, or drop the table. App-facing reads are unaffected — `find`/`get`/`search`
still return `updatedAt` as a plain Unix-ms number; only the write-time field type and the
injection default changed.
