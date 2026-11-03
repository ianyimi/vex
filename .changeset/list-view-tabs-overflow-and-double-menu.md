---
"@vexcms/react": patch
---

Fixed the list view's view-tab row (`ListViewTabs`):

- **Double menu on click.** Clicking the "All views" overflow trigger could open two menus
  at once — one correctly positioned, one at the viewport's top-left corner. Root cause: up
  to four per-breakpoint overflow triggers could be mounted simultaneously (depending on how
  many saved views a collection had), all sharing one `open` boolean — opening the
  CSS-visible one also opened every other mounted trigger's popover, including a CSS-hidden
  one whose zero-size anchor portalled its content to the top-left corner. Fixed by
  collapsing to exactly one trigger, always, with no per-breakpoint duplicates.
- **Tab overflow is now content-aware**, not a fixed per-breakpoint guess. The tab row wraps
  via `flex-wrap` inside a fixed one-line-height, `overflow-hidden` container — whatever
  doesn't fit the first line wraps onto an invisible second-plus line and is fully clipped
  (never partially cut, never scrolled). Every saved view's tab is reachable from the "All
  views" menu regardless of whether its own tab fits. Pure CSS/container-query, zero
  `ResizeObserver` measurement, no layout shift.
- **Tabs size to their own content on medium/large screens**, not stretched to fill the row —
  Save view/⋯/the views trigger sit right after the tabs, not pushed to the far edge. The
  tab-wrap container can still shrink (triggering the clip-and-overflow behavior above) but
  no longer grows to fill available space.
- **The view-switcher trigger's label**: a static "All views" on medium/large screens (where
  the tab row itself is visible, so the active tab's own underline already shows which view
  is active) — only below a narrow container breakpoint, where the tab row and Save
  view/⋯ hide and the trigger is the only thing left, does the label become the active
  view's own name (e.g. "Published"), so the caller can still tell which view is active.
  Both labels render unconditionally in the markup; pure CSS (container-query classes)
  decides which is visible, so the server-rendered HTML is identical to the hydrated DOM.
- **SSR-correct**, including for an active SHARED view. `ListViewTabs` no longer splits its
  tab strip into a `useSuspenseQuery`-inside-`<Suspense>` piece — that split existed only to
  stream shared views in once `NextAdminPage`'s `listViews` prefetch was deliberately
  un-awaited; that prefetch is now unconditionally awaited (an earlier fix), so by render
  time the data is always already resolved, and the nested Suspense boundary turned out to
  have a cost of its own even then (React's streaming SSR ships a nested boundary's fallback
  in the first flush regardless of whether the underlying query had to wait at all). Reverted
  to the plain `useListViews()` hook everywhere; confirmed via curl that the raw SSR HTML for
  a shared-view URL now contains that view's real name in the trigger directly, no
  flash-then-swap.
- **The shared-views error notice still works.** Removing the `<QueryErrorBoundary>` (part
  of the now-retired Suspense split) could have dropped the existing "Couldn't load shared
  views · Retry" toast — it didn't: `useListViews` now exposes `isError`/`error`/`refetch`
  directly, and `ListViewTabs` surfaces the same notice from a plain `useEffect`, with the
  tab row falling back to its default/config/local-only shape (same as a loading state —
  zero shift) and Retry calling the query's own `refetch`.
