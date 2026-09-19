---
"@vexcms/core": patch
"@vexcms/react": patch
"@vexcms/next": patch
"@vexcms/cli": patch
"@vexcms/better-auth": patch
"@vexcms/file-storage-convex": patch
"create-vexcms": patch
---

Add lifecycle hooks and server-side field validation (ADR-010, ADR-011).

**`@vexcms/core`.** Collections gain `beforeChange`/`beforeDelete` (run inline in the write
path, may reject a write by throwing) and `afterChange`/`afterDelete` (run via
`convex-helpers` triggers, after the write commits). Author them inline in
`defineCollection({ hooks: {...} })` or via the new `beforeChangeHook`/`beforeDeleteHook`/
`afterChangeHook`/`afterDeleteHook` factories (`packages/core/src/collections/hooks.ts`),
which type `doc`/`ctx`/`collection` against the real `DataModel` and collection config
without a cast. `after*` hooks require wrapping the app's Convex `mutation`/`internalMutation`
builders with the new `createVexMutations` (`@vexcms/core/server`) — they never fire for a
write through the raw `_generated/server` builder, the dashboard, or `npx convex import`.
Shared hook plumbing (`BaseHookProps`) moves to a new `hooks/` package folder so upcoming
global and media-collection hooks can share it.

Fields gain an async, server-only `validate()` — run after the generated Zod schema passes,
with `ctx` for a uniqueness check via `ctx.db.query(...).withIndex(...)` inside the mutation's
transaction. Each field type's own `validator.ts` exports a typed wrapper (`textValidator`,
`numberValidator`, `arrayValidator`, etc., built on the shared `fieldValidator` factory) so
`value`, `doc`, and `field` are typed against the real collection/`DataModel`/field config
instead of `unknown`.

**Fix:** `min`/`max` on `array`/`blocks`/`upload`/`relationship` (new on the latter) previously
either ignored `required` entirely or coupled to it incorrectly — an optional field's own
empty/default value could fail its own `min`, or a required field's custom `min`/`max` message
could be unreachable when its threshold matched the required floor. `min`/`max` now runs
whenever a value is supplied; only an empty array on an *optional* field skips the check.

**`@vexcms/react`.** `useVexMutation`'s `onError` now surfaces a toast (via `sonner`) for any
rejected write, including the new validation `ConvexError`s — `getVexErrorMessage` extracts
the most specific available message. `AdminLayout` mounts the shared `<Toaster>`, which
detects an ancestor `<Toaster>` (rendered by the host app) and skips mounting a duplicate.
`CreateDocumentModal` now renders only a collection's required fields (a quick create);
`RenderFieldInputComponents` gained a `fieldKeys` filter to support it.

**`create-vexcms`.** The `base-nextjs` template's `convex/vex.ts`/`vex/globals.ts`/
`vex/media.ts` now wrap their mutation builders with `createVexMutations`, so a freshly
scaffolded project gets `afterChange`/`afterDelete` by default instead of needing to
discover the wrapper by hand. The `marketing-site` overlay's `pages.ts` also gets a
`textValidator` uniqueness check on `slug`, matching `apps/www`'s.
