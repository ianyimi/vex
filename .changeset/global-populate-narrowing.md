---
"@vexcms/core": patch
---

Fix `getGlobal` (and the `globals.get` client wrapper) losing a populated/depth-populated
relationship field's real target type. `GlobalPopulated` detected "is this a relationship
field" by checking whether the global's own declared field type was `string | undefined` —
a global relationship field is actually stored (and typed) as `Id<Target>[]`, same as a
collection's, so that check never matched and the branch that would have narrowed to the
resolved target document was unreachable: every populated global relationship resolved to
the widened `Record<string, unknown>[]` at the type level regardless of its real target,
even though the runtime always returned the correct document.

`GlobalPopulated` now resolves a populated global relationship to the real target
COLLECTION's document (`Populated`/`PopulateShape` from the collection side, recursed through
`{ populate }` the same way), and `GetGlobalReturn`'s `depth` branch — previously widened
outright (`VexDocumentGlobal & Record<string, unknown>`) — narrows the same way through a new
`GlobalDepthPopulate` type, which hands off into the target collection's own `DepthPopulate`
once it crosses from the global into a collection (so depth also reaches a target's own
nested `blocks()`/`array()`/`group()` fields).

No runtime change — `getGlobal`'s resolved values were already correct; only the compile-time
type is fixed.
