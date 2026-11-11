---
"@vexcms/core": patch
---

Raw `@vexcms/core/server` calls now require `config`: `PublishedSlugsServerArgs.config` and
`GenericQueryServerParams.config` (behind `find`/`get`/`search`) are no longer optional, so a
raw call omitting it is a type error instead of silently skipping `versions.drafts` filtering
and `depth` population. Calls through `vexServerApi()`'s bound functions are unaffected — the
factory threads `config` for you. The server JSDoc examples now pass `config` and point at the
bound API.
