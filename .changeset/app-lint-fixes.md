---
"create-vexcms": patch
---

Fixed lint errors in the scaffolded `src/components/providers/convex.tsx`
(`@typescript-eslint/no-empty-function` on the no-op `onChange` passed to
`convex.setAuth()`; `@typescript-eslint/no-unnecessary-type-assertion` on
`session?.user?.id`, whose type is already `string | undefined`) and
`src/lib/useSitePreviewMode.ts` (`react-hooks/set-state-in-effect`: replaced
the `useState` + `useEffect(() => setPreviewMode(...))` pattern with
`useSyncExternalStore`, matching the SSR-safe `() => false` server snapshot).
Scaffolded projects now pass `eslint .` out of the box.
