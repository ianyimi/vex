---
"@vexcms/react": patch
"@vexcms/richtext-plate": patch
"create-vexcms": patch
---

Accessibility pass on the admin panel against WCAG 2.2 AA and the WAI-ARIA APG patterns.
Sidebar actions, multi-select chips, pagination, date/time pickers, resizable panels and
data-table labels expose correct names, roles and keyboard support; data-table column
resize is keyboard-operable (arrows, Home/End) and capped at 90% of the table container.
Array fields, timestamps, media and relationship inputs, and the richtext toolbar gain
accessible names and status regions; dialogs set initial focus; `ThemeProvider` applies
the stored theme before paint in client-only renders.

Both `create-vexcms` templates are re-synced from the reference apps: production-only CSP
and security headers, root `not-found` pages, drafts and live preview on the
marketing-site `pages` collection, and a session button in the site header.
