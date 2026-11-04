---
"@vexcms/core": patch
---

A custom `admin.view.pageSize` now appears in the list's "N per load" picker when `pageSizeOptions` is left unset: the defaults plus `pageSize`, sorted (`pageSize: 20` → `10, 20, 25, 50, 100`). Saved views without their own `pageSizeOptions` inherit the same list. Explicit `pageSizeOptions` are used exactly as given, and `[]` still hides the picker.
