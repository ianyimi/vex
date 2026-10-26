---
applies_to: ["packages/core/src/api/**", "apps/test/convex/**"]
---
# Convex Function & API Patterns

- Factories: `queryApi(config, query?)` and `mutationApi(config, mutation?)` wrap server
  functions with validators and return registered query/mutation objects
  (`packages/core/src/api/server.ts:38-80` find/get/search; `:120-152` create/update/remove).
  Host apps call each factory once and re-export (`apps/test/convex/vex.ts:1-6`).
- Factories are co-located with their domain's operations (`collections/api/collectionsApi.ts`,
  `globals/api/globalsApi.ts`, `versions/api/versionsApi.ts`, `media/api/mediaApi.ts`), each
  re-exported through `@vexcms/core/server` (`src/server.ts`). `vexConvexApi` — the typed
  cross-domain `anyApi` references used by `@vexcms/react` — lives at `src/vexConvexApi.ts`,
  named after its one export.
- Naming: param is `collection: v.string()` (never `table`, never `slug`); mutation payload
  is `data: v.any()` (never `fields`); document params are `id`/`ids`.
- `populate` and `depth` args are mutually exclusive and optional. Search queries take
  `searchIndexName` + `searchField`.
- Server `find` exposes the full Convex query chain as optional args: `filter?`, `order?`,
  `withIndex?` alongside `populate?`/`limit?` — users never bypass the API for
  expressiveness; the API stays the interception point for future hooks.
- Soft delete: `RemoveServerArgs.softDelete?: string` names the boolean field to set true;
  omit for hard delete (`packages/core/src/api/remove/server.ts:14-17`).
- Bridging `string` → `CollectionSlug` at validator/URL boundaries uses
  `as CollectionSlug`, NEVER `as never` (collapses conditional return types).
- Convex IDs are phantom-typed strings: `__tableName` does not exist at runtime. To get a
  table name from an ID use the convex-test heuristic `(id as string).split(";").at(-1)`
  with `__tableName` as fallback; degrades safely in production.
- Populate typing: `const TPopulate` generic + `[TPopulate] extends [Record<string, never>]`
  discriminator + `Prettify<Populated<TSlug, TPopulate>>` — no `Id[] | Doc[]` unions leak.
