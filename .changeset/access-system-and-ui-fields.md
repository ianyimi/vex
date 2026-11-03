---
"@vexcms/core": patch
"@vexcms/react": patch
---

Bumped `patch` despite being breaking, per this track's own `config-client-server-split`
convention — see that changeset's note on the `alpha` pre-release base.

**Breaking: a field-permission map that lists only some fields now ALSO hides system fields
and UI (`ui()`-type) fields it doesn't list, the same "hidden unless listed" rule that
already applied to data fields.** Field-permission maps accept the real system field names as
keys now — `_creationTime`, `updatedAt`, and `vex_status` (the last only on a
versioned/drafts-enabled collection) — plus `ui()`-type fields (e.g. a computed `wordCount`),
typed per collection. `_id` stays the one permanently ungateable key, always readable, never a
valid map entry. The wildcard key (`"*"`) covers system and UI fields too, same as before.
Stripping runs on every read path: `find`, `get`, `search`, and the versions endpoints.

**Migration:** a partial field-permission map that previously implicitly showed
`_creationTime`/`updatedAt`/`vex_status`/every `ui()` field (since there was no key to gate
them on) now hides them unless you add the key, or switch that map to `'*'`. Audit every role
in your `access.ts` after upgrading — `apps/test`'s and `apps/www`'s own configs needed exactly
this audit (e.g. a `guest` role's `posts` map gained an explicit `updatedAt` entry to keep
showing it, while deliberately leaving `vex_status`/`_creationTime` hidden).

One carve-out, unchanged: sorting by `_creationTime` is always allowed, even when its own
value is hidden from that caller — this was already correct before this change and is now
covered by an explicit regression test.

**Client:** a new `useCanReadField` hook (`@vexcms/react`) lets a component check "can I read
field X" for system/UI fields the same way it already could for data fields — used by the
peek's Created row, JSON tab, and hidden-fields notice.
