# Feature backlog

Assessed work that is **deliberately deferred** — each entry has been
investigated enough to know what it costs and why it is not being done now.

This is not `tasks.md` and not `roadmap.md`:

- **`tasks.md`** — the working kanban. What is in progress right now, what is
  queued next, what just landed. Entries are one-liners.
- **`roadmap.md`** — milestone commitments. What ships in which release, ordered
  by dependency.
- **`backlog.md`** (this file) — deferred features with a recorded assessment.
  Nothing here is scheduled. An entry earns its place by being *understood*:
  the lift is measured, the blockers are named, and the reason for waiting is
  written down. Promote to `roadmap.md` or `tasks.md` when it becomes work.

## Entry format

Each entry states: what it is · why we want it · measured lift · what blocks it ·
why it is deferred · where the detail lives. Keep the entry short and put the
real design in a linked doc — an entry that grows past a screen belongs in
`.agent/docs/research/` with a pointer from here.

---

## Tag-based cache control (`cacheComponents` + `revalidateTag`)

**What.** Expose the full Next.js cache surface — `cacheTag`, `cacheLife`,
`'use cache'`, `revalidateTag`/`updateTag` — on top of the path-based
revalidation that shipped in
`2026-09-04-seo-prerendering-and-lifecycle-hooks`.

**Why.** Path-only invalidation requires `routes.map` to know every URL that
renders a document. That is true for `pages` and false for anything
one-to-many: category listings, a nav built from a collection, "related posts"
widgets. Tags invert the dependency so the page declares what it read.

Second payoff: `cacheComponents` **forbids** `export const revalidate`, moving
lifetime to a runtime `cacheLife()` call — which means cache TTL becomes
configurable from `vex.config.ts`. It is impossible today, and that is exactly
why `revalidateSeconds` was removed from `VexRoutesConfig`.

**Lift.** ~2–3 days. Measured, not estimated: `cacheComponents: true` was
enabled on `apps/www` and built until every class of error was enumerated.
Four blockers, all with known remedies, none architectural.

**Blockers.** 7 incompatible route segment configs · `cookies()` prerender
rejection swallowed in `getCurrentUser()` · `Math.random()` in our sidebar
skeleton (**fixed 2026-09-06**) · `Math.random()` inside Convex's own React
client, needing a `<Suspense>` boundary.

**Why deferred.** `cacheComponents` is an app-wide switch that also enables
Partial Prerendering, so it changes how every route renders — including the
whole cookie-driven admin panel. It cannot be adopted per route. That migration
deserves its own spec and its own gates rather than riding along behind a
caching feature. Tags are purely additive: nothing about `routes.map` or the
revalidate route has to change to add them later, so waiting costs nothing.

**Detail.** `.agent/docs/research/nextjs-cache-components-and-tags.md`

---

## Server-side revalidation dispatch (no admin panel open)

**What.** Purge cached paths for writes that never pass through the admin
panel — Convex dashboard edits, `npx convex import`, streaming import, or a tab
that closed before its fire-and-forget purge landed.

**Why.** Today those writes are covered only by the 1-hour ISR backstop and the
manual **Revalidate** button. Nothing purges automatically, because Convex has
no database-level trigger that can reach a Next route.

**Lift.** Unassessed. Depends on which mechanism Convex exposes — a scheduled
function polling for changes, `convex-helpers` `Triggers` on the write path, or
the Data Sync API (which needs a Pro plan and a deploy key, so it cannot be the
default for an open-source CMS).

**Why deferred.** Ratified out of scope during the parent spec. The only design
that gave a CLI a session was an admin service-account password in CI env,
which is strictly worse than the shared secret the session-only route was built
to avoid. Needs a real design, not an increment.

**Detail.** Out of Scope section of
`.agent/docs/specs/2026-09-04-seo-prerendering-and-lifecycle-hooks/spec.md`

---

## Collapse pre-existing duplicate types

**What.** Three pairs of exported types that describe the same shape under two
names:

- `VexMediaCreateMediaDocumentArgs` (`core/src/api/convex.ts:176`) vs
  `CreateMediaDocumentClientArgs` (`core/src/media/api/types.ts:156`) —
  identical 8 members
- `FrameworkProps` vs `FrameworkComponents` — both `{ Image, Link }`
- `DraggableContextValue` vs `DragHandleContextValue` — both
  `{ dragHandleProps, isDragging }`

**Why.** Two names for one concept forces every reader to prove they are the
same thing, and lets them drift apart silently.

**Lift.** Small — likely under an hour each, mechanical with `lsp rename`.

**Why deferred.** All three predate the SEO spec and were found by a structural
duplicate scan while auditing it. Kept out of that change deliberately to keep
its diff reviewable.

**Detail.** Found via a member-set scan over all 148 exported interfaces in
`packages/*/src`; re-runnable if more are suspected.
