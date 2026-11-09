---
"@vexcms/react": patch
---

The six remaining "TODO: add not found view" placeholders in the collection, global, and media edit views now render the shared `AdminNotFound` state instead of a bare `<p>` line. Each shows the caller-supplied slug or id in its detail line. A missing collection or global links back to the dashboard. A missing document links back to its collection's list.
