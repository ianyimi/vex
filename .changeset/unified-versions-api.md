---
"@vexcms/core": minor
"@vexcms/react": minor
---

Unified `versions.saveDraft` to cover both collections and globals through
one endpoint, and `globals.upsert` no longer writes a draft row.

**Breaking:** `vexConvexApi.versions.saveDraft`'s wire args changed from
`{ collection, id, data, restoredFrom? }` to a union —
`{ collection, id, data, restoredFrom? } | { global, data }`. The server
`saveDraft({ ctx, config, ... })` helper and the client `saveDraft()` mutation
factory (`@vexcms/core/server` / `@vexcms/core/client`) take the same union
now; regenerate `convex/vex/versions.ts` against the new `versionsApi` if you
copied it from an older template (no changes needed — `versionsApi` already
registers the updated args shape).

**Breaking:** `upsertGlobal` (`globals.upsert`) on a versioned global
(`versions.drafts: true`) now writes the PUBLISHED row directly — same as
`update()` on a versioned collection — instead of bootstrapping/patching a
draft row. Save a global's draft through `versions.saveDraft({ global, data })`
instead; `upsertGlobal` never touches a global's draft row anymore.
`GlobalEditView`'s "Save Draft" button already calls the new endpoint.

Also new on versioned collections:
- `create()` now honors the resolved `versions.defaultStatus` ("draft" by
  default, configurable per collection via `versions: { defaultStatus }`):
  a `"published"` default also stamps `vex_publishedAt`, a `"draft"` default
  inserts a draft-only row. Either way, one history row is recorded.
- `update()` now rejects a draft-row `id` with a `ConvexError` pointing the
  caller at `versions.saveDraft`, and records a `"published"`-status history
  row after every write to a versioned collection's published row.
