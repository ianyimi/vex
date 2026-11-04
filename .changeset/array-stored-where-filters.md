---
"@vexcms/core": patch
---

Filtering on `select`, `relationship`, and `upload` fields now matches. Convex stores these field types as arrays even when `hasMany` is off, but a filter leaf compares a single value, so an `eq`/`neq` leaf compared a bare scalar against an array and never matched (`?filter=(status.eq.won)` returned zero rows). `find`/`search` now run the `where` tree through `normalizeArrayStoredWhere` (`db/queryArgs.ts`) first: `eq`/`neq` wrap the value in an array, and empty/not-empty checks compare against `[]`.
