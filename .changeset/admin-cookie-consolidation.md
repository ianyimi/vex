---
"@vexcms/react": patch
"@vexcms/next": patch
---

The admin panel's per-browser UI preferences (table row density, a collection's filter-chip
visibility, local saved views, last-seen row counts, the live-preview panel's open/closed
state and split width, the sidebar's collapsed state) consolidate from up to seven
separately-named cookies down to exactly two: `vex-admin` (shared, collection-agnostic) and
`vex-admin:<collection>` (one per collection). Both are scoped to `Path=<basePath>` (the
project's `VexClientConfig.basePath`, `/admin` by default) instead of the whole domain — a
public page never sends either cookie.

Retires `vex-list-density`, `vex-list-chips:<collection>`, `vex-list-views:<collection>`,
`vex-list-rows:<collection>`, `vex-live-preview-panel:<slug>`, `vex-live-preview-layout:<slug>`
(all previously at `path=/`), and the sidebar's own `sidebar_state`. `AdminLayout` clears every
retired name, best-effort, the first time a returning browser's admin shell mounts — nothing
to do on your end, and a visitor who never opens `/admin` keeps the old cookies around
harmlessly until they do.

Each project-scoped cookie stays well under the ~4KB browser cap: `localViews` entry names
longer than 40 characters are truncated, `rowCounts` is dropped first if the cookie would
still exceed the cap, then the oldest `localViews` entries one at a time — a dropped entry's
full view still exists in `localStorage`, only its first-paint tab placeholder disappears.
See the new `apps/docs/src/content/docs/guides/admin-cookies.mdx` guide for the full shape.
