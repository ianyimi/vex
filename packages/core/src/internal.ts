/**
 * `@vexcms/core/internal` — surface shared with sibling `@vexcms/*` packages only.
 *
 * Nothing here is public API. The packages in this monorepo version together as one
 * fixed changeset group, so a symbol may change shape or disappear in any release
 * without a deprecation cycle. Application code must import from `@vexcms/core`,
 * `@vexcms/core/server` or `@vexcms/core/client` instead.
 *
 * Currently carries the schema-diffing and migration-planning helpers consumed by
 * `@vexcms/cli`'s auto-migration orchestration. They are placeholders — `diffSchema`
 * returns an empty diff and `planMigration` an empty operation list for every input —
 * which is exactly why they no longer ship from the package root.
 */
export * from "./schema/migrate"
