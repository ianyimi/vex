---
applies_to: ["apps/www/src/app/globals.css", "packages/react/src/styles/**", "packages/next/src/**", "**/*.css"]
---
# CSS & Design Tokens (Tailwind 4)

- Tailwind v4 is CSS-first: tokens are native CSS variables in
  `apps/www/src/app/globals.css` (`:root` + `.dark` scopes, OKLCH color space).
  Semantic names: `--background`, `--foreground`, `--card`, `--primary(-hover/-pressed)`,
  `--accent(-fg/-tint)`, `--border`, `--ring`, sidebar token block.
- Design source of truth: `.pi/design/claude-design/` (Stark x Ember: graphite + ember
  orange, Geist, 2/4px radii). Claude Design CSS files (`admin.css`, `site.css`) use
  DIFFERENT token names — translate via the table in `.pi/design/claude-design/README.md`,
  NEVER copy directly. Read `.pi/design/README.md` before any UI work.
- Package-level CSS defaults ship inside `@layer base { :root { } }` — unlayered `:root`
  declarations in the consuming app automatically win, no `!important`. This is the
  override contract for `@vexcms/react/styles` and `@vexcms/next/styles`.
- Tailwind `@source` directives for workspace packages point at package SOURCE
  (`../../packages/react/src/**/*.{ts,tsx}`), never `node_modules/**/dist` — symlinked
  workspace packages have no dist during dev.
- Dark mode: `.dark` class on the root element; theming via the package's own
  `ThemeProvider` (`packages/react/src/components/ui/ThemeProvider.tsx`) — framework
  agnostic, does NOT depend on next-themes. No shadows in dark mode (design contract).
- Conditional classes always through `cn()` from `packages/react/src/styles/utils.ts`.
