---
"@vexcms/core": patch
---

`admin.view.searchFields: []` (or omitted) is now enforced server-side, not just hidden
client-side: the search endpoint returns `SEARCH_FIELD_NOT_ALLOWED` for a collection with no
declared search fields, regardless of what a client sends. Hiding the search bar was never
itself a security boundary.
