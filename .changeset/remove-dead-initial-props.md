---
"@vexcms/core": patch
"@vexcms/react": patch
---

Removed `CollectionListViewProps.initialData`/`.initialQueryError`/`.initialViews`/
`.initialPeekDoc` and `ListPeek.initialDoc`, along with the client branches that only existed
to support them (e.g. the `hasLiveQueryResultRef` fallback) and their tests. Nothing in the
codebase wrote to any of them — `NextAdminPage` and every other caller already seed the
TanStack Query cache instead.

**Migration:** if you were passing any of these props from a non-Next integration, prefetch
through the query cache instead — call the same query (`useVexListQuery`'s underlying
`findPaginated`/`search`, or the single doc-query key builder for a peek/edit view) on the
server and hydrate the `QueryClient` you hand to the client tree, the same way `NextAdminPage`
does. There is no `initial*`-prop seeding path left to fall back to.
