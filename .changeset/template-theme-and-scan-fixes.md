---
"create-vexcms": patch
---

Template iteration round proven in a live scaffold: the marketing overlay wires the theme
system end to end (overlay root layout + admin layout with scoped `ThemeStyle`/`ThemeLive`,
`ThemeScript` in base kills the light-mode flash) and gains a headless `FirstAdminBootstrap`;
`next.config.ts` pins `turbopack.root` so scaffolds nested inside an outer monorepo stop
adopting the outer lockfile; Tailwind's `@source` scan narrows to package `dist` output and
excludes `public/`; the users collection gains a `name` field with `useAsTitle`; marketing
seed data adds features/roadmap pages and corrects block defaults (GitHub links, alpha badge).
