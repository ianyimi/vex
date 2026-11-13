---
"@vexcms/react": patch
---

Bumped `patch` despite being breaking, per this track's own `config-client-server-split`
convention — see that changeset's note on the `alpha` pre-release base.

**Breaking:** `useLivePreviewQuery`'s and `useLivePreviewDocumentQuery`'s overridable `TData`
generic no longer `extends` the raw `DocumentByResourceSlug<TCollectionSlug>[]`/
`DocumentByResourceSlug<TCollectionSlug> | null`. A `populate`-resolved Convex query handler
can (and routinely does) declare a return type like `Promise<PopulatedHeadersDocument>` whose
fields are never assignable to their raw, un-populated counterparts — an upload/relationship
field resolves to the real referenced document (`logoImage: Image[]`), not the `Id<"images">[]`
the raw generated interface still declares. The CONSTRAINED override generic added by
`react-theme-region-scope-and-live-preview-inference` rejected exactly the populated types it
exists for, so every consumer backing either hook with a populated query still needed
`convexQuery(...) as never` on the call and a second cast on the destructured result — the
`alpha38-replay.md` note calling this "a different, still-open gap … confirmed NOT fixed" is
now resolved.

`TData` still defaults to the raw document type when not given explicitly, so every
unparameterized call site is source-compatible. `LivePreviewQueryResult`'s/
`LivePreviewDocumentQueryResult`'s `data` field now derives from `TData` (`TData[number]`/
`Exclude<TData, null>`) instead of always being the raw document, so a consumer overriding
`TData` gets the destructured result correctly typed too — no second cast.

```tsx
const { data: header } = useLivePreviewDocumentQuery<"headers", PopulatedHeadersDocument | null>(
  { ...convexQuery(api.headers.getFirst, {}), initialData },
  "headers",
);
// `header` is `PopulatedHeadersDocument | undefined` — no cast on the call or the result.
```

No runtime change.
