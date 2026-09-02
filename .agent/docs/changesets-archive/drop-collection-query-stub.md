---
"@vexcms/core": patch
---

Remove the dead `generateCollectionQueries` stub and its `GENERATED_HEADER`/
`CollectionQueryImports` exports. Rebuild's runtime API is factory-registered
(`collectionsApi`, globals/media factories) — nothing consumed the per-collection generator,
which only ever returned `{}`.
