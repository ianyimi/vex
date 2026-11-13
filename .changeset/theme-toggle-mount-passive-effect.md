---
"@vexcms/react": patch
---

`ThemeProvider`'s `mounted`-flip effect (gates `ThemeToggle`'s enable/icon-switch) now runs
via a plain `useEffect` instead of `useIsomorphicLayoutEffect`/`useLayoutEffect`. Developer-
reported bug: on a real streamed admin page (sidebar resolved via `use(authPromise)` inside a
`<Suspense>` boundary), `ThemeToggle` stayed disabled indefinitely even once the real,
permission-filtered nav had settled — `mounted` never flipped, reproducible only with a real
streamed/hydrated render (never with a synchronous CSR-only render). A layout effect is
scheduled as part of the same commit as any sibling Suspense boundary and React defers/re-
fires layout effects around that boundary's reveal; a passive effect is not. This specific
effect has no paint-timing requirement (`ThemeToggle`'s own doc comment: the enable/icon-
switch is never visible as a layout shift), so there is no correctness cost to the swap. The
theme-class-applying effect (FOUC-sensitive) stays a layout effect.
