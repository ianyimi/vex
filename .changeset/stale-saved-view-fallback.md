---
"@vexcms/core": patch
"@vexcms/react": patch
---

A saved (shared or local) view whose `sort.field` or `searchField` no longer exists, is no
longer indexed, or is no longer searchable now falls back to the collection's own default for
just that one part — identically on the server and the client, so there's no
first-paint/hydration mismatch — and shows a small, dismissible toolbar notice ("This view's
sort on 'X' is no longer available").

The saved view itself is never silently rewritten by this fallback; it only changes if the
user explicitly saves over it.
