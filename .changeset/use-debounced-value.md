---
"@vexcms/react": patch
---

New `useDebouncedValue` hook (`@vexcms/react`), replacing every internal call site that used
`@ts-hooks-kit/core`'s `useDebounceValue`: the list search box, the relationship picker's
search, the rich text editor's inline media picker search, and the shared
search-pagination hook under the media library grid.

The third-party hook had a real bug — its internal "last call" timer only updated on the
FIRST call of a burst, not on every subsequent one, so a 250ms debounce window tracked 250ms
after the first keystroke rather than the most recent one, behaving like a throttle at the
original interval instead of a true debounce. Typing at a normal pace fired a search roughly
every 250–300ms DURING typing instead of once after the user stopped, visibly swapping rows
mid-type.

No API change for existing callers beyond the swap — `useDebouncedValue(value, delayMs)`
returns the debounced value, same shape as the hook it replaces.
