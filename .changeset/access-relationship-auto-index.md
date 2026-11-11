---
"@vexcms/core": patch
---

`indexedOwnerCheck`/`ownerPredicateCheck`/`indexedEqCheck` now resolve a field's index
through the same `resolveCollectionIndexes` result the schema generator uses, instead of
reading only the field's own `index` option. A relationship field's automatic `by_<field>`
index is now visible to these checks without adding `index: "by_<field>"` by hand; an
explicit field-level `index` still wins, and a collection-level `indexes` entry that
replaces an automatic name wins over the automatic one too.
