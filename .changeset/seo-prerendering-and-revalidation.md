---
"@vexcms/core": minor
"@vexcms/next": minor
"@vexcms/react": minor
"@vexcms/file-storage-convex": patch
"create-vexcms": minor
---

Public pages can now be prerendered and cached, and an admin-panel write purges
the paths it invalidated.

**Why they could not be cached before.** A `cookies()` read reached every route
through the root layout's `AuthServerProvider`, and `fetchQuery`
(`convex/nextjs`) hard-codes `cache: "no-store"`. Either alone forces a route
dynamic. `AuthServerProvider` now mounts in `app/(vexcms)/admin/layout.tsx`,
where a cookie read belongs, and server reads go through a new cached client.

**`@vexcms/next` gains two entry points.** `@vexcms/next/cache` exports
`createVexServerClient` — a server-only Convex read client that never sets
`no-store` and dedupes per request via `React.cache`, so a page and its
`generateMetadata` share one round trip — and `createVexRevalidateRoute`, a
session-authorized `POST` handler that purges affected paths. `@vexcms/next/seo`
exports `vexStaticParams`, `createVexSitemap`, `createVexRobots`, and
`vexMetadata`; each tolerates an unreachable deployment so a build with
placeholder env still succeeds.

**`@vexcms/core` gains route mapping and revalidation vocabulary.** `routes.map`
in `vex.config.ts` answers "which public paths render this document?".
`resolveTargets` invokes it once per document *state*, so renaming a slug purges
both the old and the new path. The wire contract
(`VexRevalidateChange`, `VexRevalidateRequest`/`Response`,
`VEX_REVALIDATE_BATCH_SIZE`) lives here because `@vexcms/react` builds it and
`@vexcms/next` parses it, and neither depends on the other. Also new:
`publishedSlugs`, a bypass-access slug reader for sitemaps and
`generateStaticParams`.

**`@vexcms/react` gains the write-side purge.** `useVexMutation` wraps a Convex
mutation and fires a purge after it succeeds — fire-and-forget, because a failed
purge is a stale page but a failed save is lost work. `useVexRevalidate` and
`RevalidateButton` add a user-initiated purge (mounted in `CollectionEditView`
and `CollectionListView`) whose failures surface, covering what a client-driven
purge cannot reach: Convex dashboard edits, `npx convex import`, or a tab closed
mid-request.

**Automatic `updatedAt`.** `defineCollection` now injects an optional
`updatedAt` number field on every content collection, and `create`/`update`
stamp it. Auth-adapter-owned collections (`meta.protected`) and collections
opting out with `{ timestamps: false }` never receive it, and a field the auth
adapter declares itself (`meta.locked`) is never overwritten.

**`create-vexcms`** templates carry all of the above, and
`base-nextjs/package.json` gained the `pnpm.overrides` +
`peerDependencyRules` block the monorepo already used — without it a fresh
scaffold's `pnpm install` failed outright once `@better-auth/passkey` published
a minor whose peer range excluded the pinned `better-auth`.

BREAKING CHANGE: `defineCollection` injects an `updatedAt` field into every
content collection, so `convex/vex.schema.ts` and `src/vex.types.ts` must be
regenerated and the schema pushed — run `vex dev` (or `vex dev --once`) before
the next write, or Convex rejects the stamped column. A collection that already
declares its own field named `updatedAt` is now a compile-time and runtime
error: rename it, or opt the collection out with `{ timestamps: false }`. The
ISR window is not configurable through `vex.config.ts`; Next reads
`export const revalidate` by static analysis before any module executes, so it
must be an inline literal in each route file.
