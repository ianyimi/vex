---
"@vexcms/core": patch
"@vexcms/cli": patch
---

Remove the unimplemented auto-migration helpers from the public API.

`diffSchema`, `planMigration`, `makeFieldsOptional` and `addRemovedFieldsAsOptional` were
exported from `@vexcms/core` but stubbed — `diffSchema` returned an empty diff for every
input and `planMigration` an empty operation list, so any caller silently migrated nothing.
They now live on a new `@vexcms/core/internal` subpath that exists for sibling `@vexcms/*`
packages only and carries no stability guarantee; `@vexcms/cli` is repointed at it.

`schema.autoMigrate: true` now throws at `defineConfig()` instead of silently doing nothing.
`autoMigrate` was never declared on `SchemaConfigInput`, so a TypeScript config could not set
it; the guard covers untyped and spread configs. The default is unchanged.

`SchemaConfigInput` and `TypesConfigInput` JSDoc no longer advertise `autoMigrate` /
`autoRemove` defaults that never existed, and `TypesConfigInput` now states its real default
(`/src/vex.types.ts`, not `/convex/vex.schema.ts`).
