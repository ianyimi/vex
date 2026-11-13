---
"@vexcms/core": patch
"@vexcms/react": patch
---

Bumped `patch` despite being breaking, per this track's own `config-client-server-split`
convention — see that changeset's note on the `alpha` pre-release base.

`@vexcms/core` now exports `vexFindQuery`/`vexGetQuery`/`vexSearchQuery` — typed, zero-cast
direct network calls to `find`/`get`/`search` for any plain `{ query(ref, args) }` client
(`VexServerClient` from `@vexcms/next`, `ConvexHttpClient`, `ConvexReactClient`), mirroring
`@vexcms/react/client`'s `find`/`get`/`search` without a TanStack Query dependency. Also
exports the underlying `findFuncRef`/`getFuncRef`/`searchFuncRef`/`buildFindArgs`/
`buildSearchArgs`/`buildGetQuery` builders and the `FindClientArgs`/`FindClientPaginatedArgs`/
`GetClientArgs`/`SearchClientArgs`/`SearchClientPaginatedArgs`/`VexNetworkQueryClient` types
(moved here from `@vexcms/react`, which now re-exports them for backwards compatibility).
`@vexcms/react/client`'s `find`/`get`/`search` are unchanged at the call site; internally
they now delegate to the same core builders instead of duplicating the funcRef cast.

**Breaking:** `buildThemeCss`'s `theme` prop is now typed `object` instead of
`Record<string, unknown>` — a closed, generated per-collection document (`vex generate`'s
`ThemeDocument extends VexDocumentShape`, no index signature) was never assignable to
`Record<string, unknown>` even though every property is `unknown`-compatible; callers reading
a real generated `Theme` document needed `theme as Record<string, unknown>` to call this. The
`Record<string, unknown>` cast moved inside `buildThemeCss` itself. No runtime change.

`AccessIndexedFieldWithValue<S, V>` now intersects its output with
`AccessIndexedFieldFor<S>`, so a field it resolves is provably assignable where
`AccessIndexedFieldFor<S>` is expected (`readWhere`/`indexedEqCheck`'s own `field` param) —
previously this required a cast at the call site (an unbound generic `F` couldn't be proven
to extend `AccessIndexedFieldFor<S>` without evaluating the mapped type). No runtime change.
