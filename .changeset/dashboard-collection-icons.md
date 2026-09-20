---
"@vexcms/react": patch
---

`DashboardView` now renders a collection's or global's configured `admin.icon` beside its
title on each dashboard card, matching how the sidebar already presents them. Cards for
entries with no `admin.icon` are unchanged.
