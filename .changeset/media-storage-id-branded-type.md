---
"@vexcms/file-storage-convex": patch
---

**Breaking:** `defineMediaCollection`'s generated `storageId` field is now typed
`Id<"_storage">` instead of `string`. It is built from a plain `text()` leaf (the Convex
validator stays `v.string()` — a branded id is a plain string at runtime, so `v.string()`
already accepts it on write), but every consumer reading `storageId` off a real generated
media document — including every example's `convex/seedImages.ts` — needed
`ctx.storage.getUrl(doc.storageId as never)`/`ctx.storage.delete(doc.storageId as never)` to
bridge the mismatch with `ctx.storage`'s own `Id<"_storage">`-typed overload. The field now
overrides its generated interface type the same way `upload()`/`relationship()` already
override theirs with a target-collection-specific `Id<"...">` (`interfaceGen.ts` reads
`field.interfaceType` per-instance, not a fixed type-to-string lookup).

Also removed a now-provably-unnecessary `args.storageId as never` inside
`createMediaDocument` (`adapter/methods.ts`): `ctx.storage.getUrl` carries a deprecated
overload accepting a plain `string`, so the cast never did anything even before this fix.
The `mediaDoc.storageId as never` casts in `deleteMedia`/`getUrl` are unrelated and stay —
`mediaDoc` there comes from a `GenericDataModel`-typed `ctx.db.get`, whose fields resolve to
Convex's generic `Value` (including `null`), not this project's real schema.

No runtime change.
