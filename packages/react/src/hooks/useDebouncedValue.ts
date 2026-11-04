"use client";

import { useEffect, useState } from "react";

/**
 * Returns `value`, delayed by `delayMs` of inactivity — the standard React debounce
 * pattern, not a wrapper over `@ts-hooks-kit/core`'s `useDebounceValue`/`debounce()`.
 *
 * That library's own `debounce()` has a genuine bug (confirmed directly in its
 * `dist/index.js`): its internal `lastCallTime`
 * is only updated the FIRST time a call starts a new window, not on every subsequent call
 * within it — so a "250ms debounce" actually fires 250ms after the FIRST call in a burst,
 * not the MOST RECENT one, behaving like a throttle at the original interval rather than a
 * true debounce. Confirmed live: typing at a realistic ~150ms/key pace still fired the
 * debounced callback roughly every 250–300ms DURING typing instead of once after the user
 * actually stopped.
 *
 * This hook's own `useEffect` cleanup unconditionally clears the PREVIOUS render's timer
 * before a new one is set — that reset-on-every-call behavior (not anything the prior
 * library lacked by design, it simply implemented it incorrectly) is what makes a window
 * restart on every keystroke rather than drifting from the first one.
 *
 * Every real call site in this package that debounces a value for a search/query (`ListViewSearch`,
 * `RelationshipDocumentList`, `richtext/Field`'s media picker, `usePaginatedSearch`) should go
 * through this hook instead of re-implementing the effect+timer pattern inline or reaching for
 * the buggy library again.
 *
 * @typeParam T - The value's type.
 * @param value - The live, un-debounced value (e.g. an input's current text).
 * @param delayMs - Milliseconds of inactivity before `value` propagates to the returned one.
 * @returns `value`, delayed by `delayMs` — starts equal to the first `value` passed in (no
 *   artificial initial delay before the first render has anything to debounce).
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebouncedValue(search, 200);
 * const { documents } = usePaginatedSearch({ collection, query: debouncedSearch });
 * ```
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
