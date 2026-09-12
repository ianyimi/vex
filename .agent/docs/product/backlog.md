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

---

## `CodePane` as a sync, pre-highlighted component (async Server Component inside a live-reactive Client tree)

**What.** `apps/www/src/components/CodePane.tsx` is a deliberately-async Server
Component — its own JSDoc: "shiki runs here and the client receives only
markup." It's rendered by `CodeShowcaseBlock` and `Split`
(`apps/www/src/vexcms/blocks/{CodeShowcase,Split}/index.tsx`), both dispatched
generically by `RenderBlocks` from inside `PageContent.tsx` — which is
`"use client"` (line 1), for its live Convex `useQuery`. An async component
reachable from a Client Component subtree (not passed down as pre-rendered
`children` from an ancestor Server Component) is unsupported: React logs
`<CodePane> is an async Client Component. Only Server Components can be async
at the moment`, plus a `suspended by an uncached promise` warning per call
(`highlightCode(...)` creates a fresh, uncached promise every invocation).

**Why.** Confirmed non-fatal today — loaded the dev server and both code panes
on `/` render fully, correctly highlighted (verified in the DOM). It works
because the first render happens during SSR, before hydration. React's own
wording ("not yet supported **at the moment**") flags this as a real crack
that a future React/Next upgrade could turn into an actual failure, not a
false alarm.

**Lift.** ~6 files in `apps/www` — `CodePane.tsx` (drop `async`, accept
pre-rendered `html` instead of `code`+`language`), `CodeShowcase/index.tsx`
and `Split/index.tsx` (thread `html` through instead of raw fields), both
`(site)/page.tsx` routes (pre-highlight every code pane in `initialData` via a
new server-side helper before handing it to `PageContent`), and
`PageContent.tsx` (carry the pre-highlighted data down). Same change then
needs mirroring into `packages/create-vexcms/templates/marketing-site` per
the template-sync convention (`apps/www` is that template's source of truth).

**Why deferred.** The fix has a real behavior tradeoff, not just a
refactor: code panes stop being live-reactive — editing a
CodeShowcase/Split block's code in the admin panel would not re-highlight
until the next full page load/revalidation, since highlighting moves to
request-time server rendering instead of running on every client re-render.
Developer chose to defer rather than accept that tradeoff inside an unrelated
commit.

**Detail.** Found while investigating a developer-reported console error
during the 2026-09-08 SSG-parity session; no dedicated research doc yet — the
diagnosis above is the full assessment.

---

## Decorative-image escape hatch for media alt text

**What.** A distinct way to declare `alt=""` as *deliberately* decorative — not
just "nobody filled this in yet" — on `VexMediaDocument`.

**Why.** `MEDIA-2`
(`.agent/docs/specs/2026-09-08-react-coverage-expansion/BUGS-REPORT.md`) fixed
`FilePreview`'s dead alt-text fallback (`??` never firing on a required
`string`, so every unset-alt image rendered `alt=""`) by falling back to the
filename whenever `alt` is empty: `mediaDoc.alt || mediaDoc.filename`. That
fix is unconditional — it also overwrites a real, W3C-recommended `alt=""` on
a genuinely decorative image (a divider, a background texture) with the
filename, which screen readers then read aloud. Empty string is the only
value `alt` can hold today, so "unset" and "deliberately decorative" are
indistinguishable and the fix necessarily picks one meaning.

**Lift.** Unassessed. The type change alone is small — `VexMediaDocument.alt`
would need a way to express "decorative" distinct from `""` (e.g.
`alt: string | null` with `null` reserved for decorative, matching the
report's own suggestion) — but it is a breaking change to a published type,
touches the upload path that seeds `alt` from the filename at creation
time (`MediaUploadDropzone.tsx`), and needs an admin-panel affordance for a
user to actually mark an image decorative rather than just leaving the field
blank.

**Why deferred.** Report open question #4, ratified out of scope for the
`2026-09-08-react-bug-fixes` fix spec: fixing the dead fallback was in scope,
designing a new "decorative" signal on top of it was not. The fallback fix
ships now because it strictly improves the common case (alt text nobody
filled in); the escape hatch needs its own design pass.

**Detail.** `MEDIA-2` in
`.agent/docs/specs/2026-09-08-react-coverage-expansion/BUGS-REPORT.md`, open
question #4 in the same file.

---

## Generic type-narrowing on server API signatures for field-level RBAC

**What.** `find`/`get`/`create`/`update` return and argument types keep describing the
full document type, regardless of which fields a caller's role can actually read or
write. A caller who knows a field is restricted for the current role has no way to
narrow the return/argument type themselves — it would need to be caller-asserted, since
the server cannot statically know per-request role.

**Why.** Field-level permissions (`2026-09-07-field-level-rbac-permissions`) enforces
restrictions at runtime — stripping denied read fields, denying denied write keys — but
the TypeScript types on the Local API surface never shrink to match. A caller may
receive or be allowed fewer keys than the type promises for their role.

**Lift.** Unassessed. Needs a design for how a generic type parameter would carry
per-role field visibility through `find`/`get`/`create`/`update`'s signatures without
requiring per-call-site ceremony.

**Why deferred.** DD 15 (`2026-09-07-field-level-rbac-permissions`): type narrowing is
deferred, not attempted, in favor of shipping runtime enforcement first. Ratified as its
own follow-up rather than folded into that spec's diff.

**Detail.** DD 15 and Out of Scope,
`.agent/docs/specs/2026-09-07-field-level-rbac-permissions/spec.md`.

---

## Field-map key checking for untyped consumers

**What.** Promote the dev-mode `console.warn` that fires when a returned field map
names a key that isn't a real field on the resource — for callers `ValidateFieldMaps`
cannot check statically, i.e. a plain-JS `vex.config.js` or a permissions matrix
assembled at runtime — into a hard `VexAccessConfigError`.

**Why.** `ValidateFieldMaps` (a TypeScript compile-time check) catches an unknown field
key in every TypeScript config. A plain-JS config or a matrix built dynamically at
runtime has no compiler to catch it, so those consumers only get a warning today — a
typo like `admnTheme` silently does nothing instead of failing loudly.

**Lift.** Unassessed pending the design question below.

**Why deferred.** Promoting the warning to a hard error needs a decision about
dynamic/legacy document fields first — a key the map names that isn't in the
TypeScript document type may still be a legitimate dynamic/legacy field at runtime,
which a warning currently sidesteps by not blocking anything. Throwing unconditionally
would need that distinction resolved first.

**Detail.** Step 9, `.agent/docs/specs/2026-09-07-field-level-rbac-permissions/spec.md`.

---

## Versioning/drafts write paths need `changes` for field permissions

**What.** When versioning/drafts lands, its write paths — `saveDraft`, `publish`,
`unpublish` — must pass `changes` to `hasPermission` the way `create`/`update`/
`upsertGlobal` already do, or field maps will not be enforced on a draft save.

**Why.** Field-level RBAC denies a write by inspecting the `changes` argument against a
resolved field map. `DRAFT_ACTIONS` already exists as an action union, but no write
path implements it yet, so nothing is wired to `changes` today — a role restricting a
field on `update` gets no equivalent restriction on a draft save until that path exists
and is built to pass `changes`.

**Lift.** Nothing to do now — no code exists to change. Whoever implements draft write
paths must include this in that spec's own design, not treat it as a follow-up.

**Why deferred.** Versioning/drafts itself is not shipped (`packages/core/README.md`'s
"Versioning & Drafts" section: `versions.drafts` parses but is not enforced). This entry
exists so that future spec doesn't silently drop field-permission parity.

**Detail.** Step 9, `.agent/docs/specs/2026-09-07-field-level-rbac-permissions/spec.md`.

---

## Concurrent-edit conflict-resolution UX

**What.** One future spec, scoped strictly to fields with outstanding unsaved edits.
Field-level RBAC's Step 7 already handles every other field: an untouched field whose
value changes elsewhere is adopted silently and becomes the new default, so the editor
simply sees it update — no icon, no banner, no prompt, because there is no competing
version. What's left is the genuinely ambiguous case: a field the editor has edited AND
someone else has changed. Three pieces:

1. **Per-field conflict affordance.** When the live document changes a field the editor
   has unsaved edits in, mark that field with an info/notice icon and let them switch
   between the two versions — keep mine, or take the live one and re-apply their edit on
   top. Both values are already available: the editor's is `form.state.values[key]`, the
   live one is `options.defaultValues[key]`, which tracks the server (`FormApi.js:92-93`).
   The detection predicate is the inverse of `useLiveFieldMerge`'s skip condition — a
   field that is dirty AND whose live value moved is exactly a conflicted field, so the
   two should share one helper rather than deriving it twice.
2. **Review-before-save banner.** While any field is conflicted, show a document-level
   banner and block **Save** until each one is resolved. Resolution is per field, so the
   banner needs a count and ideally jump-to-field.
3. **Optimistic-concurrency guard**, to close the window the UI cannot: two editors
   resolving simultaneously still ends in last-write-wins. A compare-and-swap is
   feasible for collections, which already carry an auto-maintained `updatedAt`
   (`defineCollection` injects it, `create`/`update` stamp it), and would need a new
   field for globals, which deliberately have none (`upsert.server.ts` docstring).
   Rejecting a stale write turns the race into a retry the banner can drive.

**Why.** Without this, two editors saving the same field at nearly the same time
silently overwrite each other with no signal to either.

**Lift.** Unassessed — three separable pieces (affordance, banner, CAS guard), each
independently buildable.

**Why deferred.** Out of scope for `2026-09-07-field-level-rbac-permissions`, which only
needed to prove untouched fields adopt live changes silently. The conflicted-field case
is a distinct, harder problem that deserves its own spec.

**Detail.** Step 9, `.agent/docs/specs/2026-09-07-field-level-rbac-permissions/spec.md`.
Scoped deliberately without presence: no viewer-visibility UI, no new
package installs, nothing beyond the three pieces above. See "Presence, live
cursors, and per-field collaborative indicators" below for the related but
separately-scheduled feature this pairs with conceptually.

---

## Presence, live cursors, and per-field collaborative indicators

**What.** A Google-Docs/Figma-style collaborative layer for the admin
edit view, in three independently-costed pieces:

1. **Viewer facepile.** Avatar stack (max 5 + overflow count) on the
   collection/global/media edit-view header showing who else has this
   document open, click → `nuqs`-driven modal listing everyone present.
   Edit views only, not list views.
2. **Per-field active-editor indicator.** Border/badge on a field another
   signed-in user currently has focused — the visual complement to the
   conflict-resolution feature above.
3. **Live cursors, visible ambiently, not just to the person editing.** A
   Figma-style pointer overlay across the form canvas (rides presence
   directly). Separately: character-level collaborative cursors inside
   rich-text content — buildable via Plate's own official `@platejs/yjs` +
   `@slate-yjs/core` (Yjs CRDT + `Awareness`-based cursors already shipped
   by Plate) paired with a **new, hand-built Convex Yjs-sync provider** for
   the content channel — Convex has no first-party Yjs product, so this is
   real component work, but not a research problem: the CRDT and cursor
   logic already exist upstream, we would only build the transport. Three
   connection tiers, not one on/off: **ambient** (read + awareness, any
   viewer with the document open sees everyone's cursor/live edits inline,
   no fullscreen or focus required — same cost class as the document's own
   existing live subscription), **hover** (local-only prefetch, unchanged),
   **authoring** (write authority + local cursor broadcast, gated on field
   `focus`/`blur`; fullscreen is an independent bigger-viewport view-mode on
   the same session, not a connection trigger). A collab-enabled field
   becomes effectively autosaved once opened, which exempts it from the
   per-field conflict affordance above (Yjs already merges concurrent edits,
   so there is no local-draft-vs-live fork to present). Blocked until the
   richtext field itself ships (currently commented out,
   `packages/core/src/fields/constants.ts:85-89`).
4. **Follow mode**, including exact scroll-position mirroring, not just
   jump-to-field. Click another viewer's avatar to track whichever field
   they have focused; while following, mirror their scroll position inside
   that field's own bounded scroll container (not the whole page) via a
   normalized value (scroll fraction or topmost visible node, not raw
   pixels, so it's independent of the follower's viewport size) carried on
   the same throttled `Awareness` payload as their cursor — no new
   transport. Simplified by item 3's ambient tier: the follower is already
   connected to every field on the document regardless of who they follow,
   so following is purely "where to point the viewport," not "what to
   connect to." Real scope of its own: a spectate-not-steal-focus default,
   and breaking follow on local scroll/click-away.

**Why.** Two editors on the same document today have no signal anyone else is
even there, let alone which field. Industry-standard affordance for exactly
this gap.

**Lift.** Unassessed at the implementation level, but the shape is clear:
facepile and the per-field indicator both ride on the same presence
subscription (~2-3 days each, mostly UI); the pointer overlay is a similar
size add-on; the in-editor Yjs-sync provider is the one genuinely large,
separately-scoped piece — a real Convex component (update batching, snapshot
compaction, reconnect catch-up, GC) with no official reference to copy. It
also has two prerequisites of its own, both unrelated to collab: the richtext
field isn't wired into `@vexcms/core` yet (`VexEditorAdapter`/
`VexEditorComponentProps` don't exist there, `plateEditor()` has no call
sites), and `@platejs/yjs` needs `platejs >=53.0.0` while the workspace
catalog pins `52.3.21` across every `@platejs/*` package.

**Why deferred.** Post-0.1.0. Ships as an **opt-in install**
(`@convex-dev/presence`, a real Convex component), matching how
`@vexcms/file-storage-convex` and `@vexcms/better-auth` are already opt-in
adapters — `@vexcms/core` takes on no presence-aware code, no schema changes.
Two things need their own design before this is buildable end-to-end: (a) a
field-input shared wrapper, since today every field type
(`packages/react/src/components/fields/*/Input.tsx`) assembles its own chrome
independently — the per-field indicator needs one injection point, not ten;
(b) `create-vexcms`'s two fixed templates have no variant/flag mechanism for
"preconfigured with presence" vs. not, so a template offering this needs that
system built first. Anonymous-user coverage is feasible later without new
backend work — `defineAccess({ anonRole })` + `anonRoleDatabaseHook` are
already shipped and proven in `apps/www` (today gating an admin-panel demo
login, not default-anonymous marketing-site visitors) — but is out of scope
until this feature actually needs anonymous viewers.

**Detail.** `.agent/docs/research/edit-view-presence-and-viewer-facepile.md`.

---

## `ui` and `tabs` field types

**What.** Two field types from the master-branch API that the rebuild never
reimplemented: `ui` — a non-persisted field rendering a display or action
affordance in the form — and `tabs`, which groups child fields into tabbed
sections while hoisting them into the parent's storage shape.

**Why we want them.** `tabs` is the standard affordance for a long content model;
`group` produces a collapsible section instead, which is a weaker answer for a
document with 40 fields. `ui` is how you put a "import theme from JSON" button or
an inline explanation between fields.

**Measured lift.** Not a leaf-field addition — both change core invariants, which
is why they cost far more than their surface suggests:

- `ui` is **non-persisted**, so it must be skipped by schema generation, by form
  validation, *and* by column generation. Every one of those three pipelines
  currently assumes `fields` maps one-to-one onto stored keys. Adding a field that
  is not a key means a discriminator threaded through all three.
- `tabs` **hoists child fields to the parent**. Unlike `group`, whose children
  nest under one object key, `tabs` children are siblings of the tabs field
  itself — so schema generation, type generation, default-value collection,
  `changedValues` diffing, and field-level RBAC's field-map resolution all need to
  flatten through it.

Measured usage when the decision was taken: `color` 57 call sites, `ui` 3, `tabs`
1, `richtext` 0 across the marketing template.

**What blocks it.** Nothing external — it is purely a question of whether the
core-invariant change is worth it. The three `ui()` call sites in the master
template were the theme-import affordance and were dropped outright; the single
`tabs` call site was substituted with `group`.

**Why deferred.** Cut with reason in the launch-readiness spec (decision D8) and
re-ratified for the v0.1.0 track in `v0.1.0-launch-plan.md`'s non-goals. A field
type that rewrites three pipelines is not a polish item and should not ride along
behind a release. `textarea`, `email`, and `json` are genuine leaf fields and are
the cheap way to raise the field count — they are on the public roadmap as
Planned, while `ui`/`tabs` are published under **Not planned** so users stop
asking.

**Detail.** Decision D8 and the Non-goals section of
`.agent/docs/specs/2026-08-30-launch-readiness/spec.md`; the API-delta table in
the same file records the master→rebuild substitutions.
