---
"@vexcms/react": patch
---

The list view's title link (the `useAsTitle` cell in every data-table row) now has a 44px-tall
tap area, matching the Apple HIG / Android touch-target guidance. Previously the link rendered
at its text line box (~16px). The link uses a minimum height with a matching negative vertical
margin, so row height and desktop density are unchanged.
