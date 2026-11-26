---
"@vexcms/core": patch
---

Every data field now accepts a top-level `nullable: boolean` option, independent of `required`
— `v.nullable(X)`, wrapped in `v.optional(...)` too when the field isn't required, typed
`T | null`. Clearing a nullable field's input writes `null`; containers with no natural empty
input state (`group`, `array`, `blocks`, `json`, `richtext`, `keyValue`, `variant`) and
`checkbox` render a null toggle instead.

Sending `null` for a top-level key in `create`/`update`/`saveDraft`/`publish`/
`globals.upsert`'s `data` argument is now an explicit unset signal for a non-nullable field —
it removes the key, the same as never setting it — instead of being stored or rejected. A
`nullable: true` field is the exception: `null` is a real stored value for it. A required,
non-nullable field still fails validation when `null` is sent.

`number`, `select`, `relationship`, and `upload` gain an opt-in `schema: { validator }` storage
override for adopting an existing Convex table without changing its stored shape: `number`
(`"int64"` → native `bigint`, no ms conversion), `select` (`"literal"` → a scalar literal
union, `"string"` → a scalar `v.string()`), and `relationship`/`upload` (`"id"` → a scalar
`v.id(...)`, `"string"` → a scalar `v.string()`). The override is typed `never` whenever the
field has `hasMany: true` — it only applies to single-value storage — and omitting it leaves
today's default storage unchanged.

Three new fields close the remaining Convex validator gaps: `bytes()` (`v.bytes()`,
`ArrayBuffer`), `keyValue()` (`v.record(keys, values)`, string or id keys, one nested data
field as the value shape — nests anywhere a data field nests), and `variant()` (a single,
non-array object union when `discriminator` is set, or a primitive union of distinct-runtime-
kind members otherwise — also nests anywhere a data field nests). An optional (`required:
false`) `variant()` with no `defaultValue` now defaults to `undefined` with no member
preselected, instead of materializing the first member's empty shape.

No migration: every new option is additive and opt-in. Changing an existing field's
`schema.validator` over a table that already has data is not migrated automatically — match
the override to what's already stored, or migrate the data manually first.

`cloneDocumentForDuplicate` takes an optional `useAsTitle` and renames that field (`Name` →
`Name (2)`, `Name (x)` → `Name (x+1)`); `nextDuplicateTitle` and `resolveDuplicateTitle` are
exported. `keyValue()` and `variant()` accept `admin.defaultCollapsed`.

`number()` no longer defaults to `0` — a field with no explicit `defaultValue` now resolves to
`undefined`, same as `date()`. A brand-new document's optional number renders empty (masked or
not) instead of a pre-filled `0`; an untouched optional number saves absent, and a `nullable`
one saves `null`, through the existing save path. `int64` (`schema: { validator: "int64" }`)
follows the same rule — no implicit `BigInt(0)`. An author's own explicit `defaultValue`
(including `0`/`0n`) still prefills and still clamps into `min`/`max` exactly as before; only
the implicit fallback changed. `keyValue()`'s and `variant()`'s number-specific seed-default
special-casing is removed — both now just read the field's own (now already-correct) default.

An empty string sent for an optional scalar `select()` is now stored as unset, the same way
`null` is. `select({ schema: { validator: "literal" } })` with no options throws a
`VexConfigError`. A stored `0`, `false` or `""` now loads as itself in the admin form instead of
the field's default. A scalar reference that can't be resolved is left as its string during
populate instead of throwing. `keyValue()` values take part in the typed `populate` option.

`variant()` with an empty `variants` record throws a `VexConfigError`. Saving from server code
now backfills item ids for arrays and blocks nested inside a `variant()` member or used as a
`keyValue()` value.
