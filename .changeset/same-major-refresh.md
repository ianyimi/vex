---
"@vexcms/react": patch
"create-vexcms": patch
---

Same-major dependency refresh. `@vexcms/react`: `@codemirror/view` 6.43.14 → 6.43.15,
`@tanstack/react-form` 1.33.1 → 1.33.5, `@uiw/react-color-sketch` 2.9.6 → 2.10.3,
`tailwind-merge` 3.5.0 → 3.7.0, `use-mask-input` 3.14.2 → 3.14.3, `@base-ui/react` 1.2.0 →
1.9.0; no import or prop changes. `@vexcms/react`'s testing setup (`@vexcms/react/testing`)
now polyfills `window.PointerEvent` when jsdom has none, since Base UI 1.9's keyboard
activation dispatches a real `PointerEvent` before the synthetic click.
`create-vexcms`: `fs-extra` 11.3.6 → 11.4.1, `yaml` 2.9.0 → 2.9.1, and new projects scaffold
with `convex` 1.49.0, React 19.2.9, TanStack Query 5.106.1 and Form 1.33.5, `convex-helpers`
0.1.134, `nuqs` 2.10.2, `@base-ui/react` 1.9.0 and (marketing scaffolds) `shiki` 4.6.0.
`convex` 1.49 requires Node.js 22 or newer.
