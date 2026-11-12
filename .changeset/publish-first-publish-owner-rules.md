---
"@vexcms/core": patch
---

Owner-scoped `publish` rules now work on a document's first-ever publish. `publish` authorized
against the published row's fields, which don't exist before the first publish, so an owner rule
reading the stored document (`data.author`) saw `{}` and denied every first publish while allowing
republishes. Authorization now falls back to the draft row — the same row `saveDraft` already
authorizes against — when no published row exists; republish behavior is unchanged.
