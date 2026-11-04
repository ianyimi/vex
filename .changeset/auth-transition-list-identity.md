---
"@vexcms/core": patch
"@vexcms/react": patch
---

Lists now stay correct while the user signs in or out.

- `PaginationResult` gains `viewerId: string | null`. `find`/`search` set it to the id of the identity the page was read as (`null` for anonymous).
- New public `AuthTransitionProvider` / `useAuthTransition` (`@vexcms/react`), plus an `AuthTransitionState` type. It tracks the identity the client is moving to while the Convex socket re-authenticates.
- `usePaginatedQuery` / `useVexListQuery` changes:
  - A page whose `viewerId` doesn't match the expected identity during a transition is ignored.
  - The identity is part of the reset key.
  - A page is never committed while the query is in error. Previously an error wiped the visible rows.
  - An `InvalidCursor` error is recovered during render.
- `DataTableBody`'s loading skeleton is capped at the known row count.
