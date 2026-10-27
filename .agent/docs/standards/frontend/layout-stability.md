---
applies_to: ["packages/react/src/**/*.tsx", "packages/next/src/**/*.tsx", "apps/*/src/**/*.tsx", "packages/create-vexcms/templates/*/src/**/*.tsx"]
---
# Layout stability — zero layout shift

Minimizing layout shift is a primary product goal: the first paint must already be the settled UI.
Review every UI change against these rules; `polish` checks them as BLOCKING.

- **Prefetch what decides layout.** Server components prefetch the exact query the client will
  run (same args, so hydrated `initialData` seeds the same query key — see
  `packages/next/src/NextAdminPage.tsx` and its prefetch-args test). Never let a region appear,
  grow, or swap content after hydration because the server skipped its data.
- **Layout state lives where the server can read it.** Anything that changes dimensions or which
  controls render (density, panel open/closed, active tab/view, column visibility, sidebar
  state) is read from the URL or a cookie on the server — the live-preview panel cookie
  (`readLivePreviewPanelCookie`) is the precedent. `localStorage` is only for state that does
  not affect first-paint layout.
- **Reserve space for async content.** Lists, counts, badges, and menus render at their final
  size: fixed or min heights, skeletons that match the settled dimensions, and fixed-height
  scroll containers (`ui/scroll-area.tsx`) instead of content that grows the page.
- **States swap in place.** Loading, empty, error, and filled states share outer dimensions;
  toggled UI (selection bars, chips, modified indicators) replaces content in a reserved slot
  instead of pushing siblings.
- **Responsive variants render correctly first.** Prefer CSS container queries (render-time,
  no JS) over `useIsMobile`/`ResizeObserver` branches for layout. When a JS-measured switch is
  unavoidable, its server render must match the common case and the switch must not move
  content the user is looking at.
