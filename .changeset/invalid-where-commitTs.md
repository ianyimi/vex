---
"@vexcms/core": patch
---

A `where` clause comparing a `commitTs` field against a non-integer or non-finite number
(`NaN`, `Infinity`, `1.5`, …) now throws `VexError({ code: "INVALID_WHERE" })`, naming the
field, instead of silently coercing the value or matching nothing. `commitTs`'s underlying
`int64` comparison has no meaningful fractional value.
