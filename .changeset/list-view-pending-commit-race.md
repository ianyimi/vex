---
"@vexcms/react": patch
---

Fixed a latent race in `usePaginatedQuery`, `useVexListQuery`'s search-mode branch, and `usePaginatedSearch`: `isPending` used to come straight off TanStack Query's own raw fetch status, which can flip to `false` one render before the hook's own sync effect has actually committed the resolved page into `results`/`documents` — a real render with `isPending: false` and an empty array even though the query has rows. Rare locally, but reliable on a slower CI runner (surfaced as a flaky `useSavedListViews.loadMoreParity.test.tsx` failure). `isPending` now stays `true` until the first page for the current query identity has genuinely been committed; Load More, view/sort/filter switches, and auth transitions keep their existing "dim the current rows, don't skeleton" behavior unchanged.
