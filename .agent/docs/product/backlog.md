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

## Lazy config-referenced components

**What.** Defer loading a component that a `vex.config.ts` references by identity — for
example `www`'s config naming `TextFieldAdmin` directly as a field override — until the page
that needs it actually renders, instead of pulling it in through the client config bundle
every page loads via `ClientProviders`/`VexConfigProvider`.

**Why.** `VexConfigProvider` mounts once at the app root (see the framework-adapters guide's
"Wiring it into an app"), so a client `vex.config.ts` that imports an admin component by
reference — `www`'s config imports `TextFieldAdmin` from `@vexcms/react/admin` to override a
field's admin render — ships that component's whole module graph to every page the config is
read on, public pages included, the same way any other root-level import does.

**Lift.** Unassessed. Needs a design for how a config can name a component lazily (a dynamic
`import()` thunk instead of a direct reference, most likely) without breaking the config's own
type-checking of field overrides, or how `defineConfig`/the admin's own consumption of the
config would resolve a lazy reference before rendering.

**Why deferred.** Ratified out of scope during the tree-shakeable-package interview
(2026-11-08): the measured cost today is small — `TextFieldAdmin` is one field override in
one config, not the panel's full surface — and the site bundle gate (`scripts/
check-site-bundle.mjs`, same spec, Step 8) already catches it growing past budget on any
route, so nothing regresses silently while this waits for its own design pass.

**Detail.** `.agent/docs/specs/2026-11-08-tree-shakeable-react-package/spec.md`, Step 8.

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

**Why.** **Now fatal, not a crack (2026-09-14).** Non-fatal only while the first
render is SSR: the moment the live `useQuery` in `PageContent` delivers a
document whose `split` or `code_showcase` block differs from the prerendered
one — a reseed, or any admin edit to a code block while a visitor has the page
open — React re-renders the async `CodePane` inside the client tree and throws
**React error #482** ("An unknown Component is an async Client Component"),
crashing every open tab ~2s after hydration. Reproduced on production after
`seed:reinit` swapped the home page onto the Split block; a Vercel rebuild
"fixes" it only because it bakes the new block into the static HTML, until the
next live change. Note this also means the live-reactivity that motivated
deferring the fix never actually worked for code panes. Diagnosis:
`.agent/docs/session-log/2026/09/2026-09-14.log.md`.

**Scope note.** Entirely an `apps/www` (a user project) defect — `RenderBlocks`
dispatches correctly and nothing in `packages/*` is involved. Workaround until
fixed: do not edit code blocks in the admin while the site has visitors.

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

**Why deferred.** Cut from the v0.1.0 track in the launch-readiness spec
(decision D8) and re-ratified in `v0.1.0-launch-plan.md`'s non-goals. A field
type that rewrites three pipelines is not a polish item and should not ride along
behind a release. `textarea`, `email`, and `json` are genuine leaf fields and are
the cheap way to raise the field count, so they come first.

**Published status: Planned, not excluded** (corrected 2026-09-15 — the docs
roadmap had them under **Not planned**, contradicting
`apps/docs/src/content/docs/fields/coming-soon.mdx`, which lists both as
near-term field types). Deferred past v0.1.0 is not the same as declined; the
roadmap says so explicitly, with the core-invariant cost named as the reason
they are scheduled behind the leaf fields.

**Detail.** Decision D8 and the Non-goals section of
`.agent/docs/specs/2026-08-30-launch-readiness/spec.md`; the API-delta table in
the same file records the master→rebuild substitutions.

---

## List-view title links are 16px-tall touch targets

**What.** The `useAsTitle` link in every data-table row (`td[table-cell] > a`) renders
at 16px tall — the text's line box, with no padding — so on a phone the tap target is
well under the 44px (Apple) / 48dp (Android) guidance. Measured on `/admin/pages` and
`/admin/themes` at 375 and 390 during the pre-Discord mobile audit
(`specs/2026-09-13-discord-post-readiness/audit/admin-mobile-matrix.json`).

**Why.** Row titles are the primary navigation into a document; on mobile they are
the thing people miss-tap.

**Lift.** Small in code — padding or `min-h` on the title link, or making the whole
cell the link — but it changes row density on desktop too, which is a design call,
not a Tailwind tweak.

**Why deferred.** The pre-Discord pass was scoped to overflow, clipping, and
reachability, with Tailwind-only fixes. This is a hit-area decision that belongs
with spec G (field input consistency) or I (list-view overhaul), where row layout is
being reconsidered anyway.

**Detail.** `packages/react/src/components/fields/*/Cell.tsx` `isTitleField` branch;
audit JSON above.

---

## Type generation and schema generation are separate code paths

**What.** `generateVexTypes.ts` and `generateVexSchema.ts` walk the field tree independently, so a new field type (or a change to a composite one) can produce a `vex.types.ts` shape that disagrees with `vex.schema.ts`. The last divergence was the cut `tabs` field emitting `Record<string, unknown>` in types but a nested object in the schema, which broke autocomplete in access rules.

**Why.** Every field type added on the launch track (`richtext`, later `json`/`email`/`textarea`) has to be implemented twice and can drift silently.

**Lift.** Unassessed. Either derive `vex.types.ts` from the generated Convex schema, or unify both generators into one walk emitting both outputs.

**Why deferred.** Carried over from a retired Claude Code memory note (`project_type_schema_unification.md`) during the 2026-09-14 repo cleanup; no spec has picked it up. The per-field `validator.test.ts` / `inputSchema.test.ts` pairs are the current guard.

**Detail.** `packages/core/src/schema/generateVexSchema.ts`, `packages/core/src/types/generateVexTypes.ts`.

---

## Multi-adapter media collections

**What.** Allow a single media collection to route uploads to multiple storage adapters (e.g.,
local dev to file-storage-local, prod to Convex).

**Why.** Current implementation routes by collection slug at
`packages/core/src/media/api/mutations.ts:57,113`; supporting multiple adapters per collection
requires per-document adapter routing and a new `meta.storageAdapterForDocument` field or
similar to guide the client uploader.

**Lift.** Unassessed.

**Why deferred.** Low priority; the current single-adapter-per-collection model has proved
workable in practice.

**Detail.** `packages/core/src/media/api/mutations.ts:57,113`.

---

## `vex_status` as a search-index `filterField` for versioned collections

**What.** Declare `vex_status` as a Convex search-index `filterField` on the
auto-generated `search_<useAsTitle>` index (`collectionConfigToVexSchema`,
`validator.ts`) for a collection with `versions.drafts: true`, and have
`search/server.ts`'s status exclusion push through `.withSearchIndex()`'s own
`.eq("vex_status", "published")` filter instead of a post-search `.filter()`.

**Why.** `2026-09-20-versioning-drafts` Step 10 excludes draft rows from `search`
results correctly today via a generic post-search `.filter()` — this is already
correct, not a bug. Declaring the field as an indexed `filterField` would let Convex
push the exclusion into the search index lookup itself, avoiding wasted
relevance-ranked result slots on excluded drafts when a search term matches many
draft rows alongside published ones — a real optimization with no functional
difference, since Convex search indexes already support `filterFields` (used
today by a `text()` field's own manually-configured `searchIndex.filterFields`,
`fields/text/types.ts`).

**Lift.** Unassessed. Touches `collections/validator.ts` (the auto-generated
`search_<useAsTitle>` index currently always emits `filterFields: []`; would need
to conditionally include `"vex_status"` for a versioned collection) and
`api/search/server.ts` (its status condition would need a second code path using
`.withSearchIndex()`'s native filter instead of always folding into `.filter()`).

**Why deferred.** Developer decision during `2026-09-20-versioning-drafts`'s
revision round: no measured search-performance problem motivates it yet, and it
is a pure optimization on top of an already-correct mechanism. Revisit if search
latency on a versioned, draft-heavy collection is ever measured as a real problem.

**Detail.** Step 10, `.agent/docs/specs/2026-09-20-versioning-drafts/spec.md`.

---

## Enterprise content branching (named branches, merge, commit-graph view)

**What.** Named content branches spanning many documents — work a set of changes on
a branch, preview the whole site as of that branch, merge it into trunk — plus a
git-style commit-graph UI over `vex_versions`.

**Why.** Anticipated paid/enterprise tier. Recorded here because the question
"should `2026-09-20-versioning-drafts` be designed around this as the end goal?" was
asked and answered **no**, and the reasoning is worth not re-deriving.

**Assessment — the storage shape already fits, so nothing needs pre-building.**
The shipped two-row draft model IS an overlay model with exactly one implicit,
unnamed branch: a draft row is a sparse override carrying `vex_publishedId` back to
its trunk row, and reads resolve trunk-or-override. A named branch is the same
structure with a name — a `vex_branch?: string` (absent ⇒ trunk) plus an index on it.
That is an additive field and an index, not a restructure. It is also what the CMS
field converged on independently: Sanity resolves ID-prefixed version documents
(`drafts.<id>`, `versions.<release>.<id>`) by "perspective"; Contentful environments
are copy-on-write clones behind an alias. Both are overlays, because content branches
are *sparse* — a branch touches a handful of documents out of thousands.

**Assessment — do NOT adopt a Merkle/content-addressed model.** Git's
"change a leaf ⇒ rewrite its tree ⇒ every ancestor tree ⇒ the commit" bubble-up is
inherent to content addressing, and git pays it to buy deduplication (identical
subtrees shared by reference across every commit) and integrity. On Convex neither
is needed: rows are stored and indexed individually, there is no packfile, and this
is not a distributed-trust problem. Adopting it would buy nothing and make every
write touch a root object. Note also what git does NOT do: it does not store deltas
logically — every commit references a complete tree; delta compression is a separate
physical packfile layer (bounded by `pack.depth`, default 50) invisible to the object
model. The equivalent choice here is already made: whole-document snapshots
(spec decision 3), which is the read-optimal end of the snapshot-vs-delta tradeoff.

**Assessment — the index is the materialized tree.** The instinct to store a
materialized "state of the tree" on each version so a branch's documents list in one
read is correct in goal and unnecessary in mechanism: a Convex index on
`(branch, documentId)` gives the same O(1)-list property, maintained incrementally by
the database instead of by hand, with no bubble-up on write. Hand-materialized tree
state is what you build when the store *cannot* index for you.

**Assessment — read cost is already O(1) queries, not O(N).** `listVersions` is one
index range read on `by_document_version` returning metadata only (`VersionSummary`
deliberately excludes `snapshot`), capped at `DEFAULT_VERSION_LIST_LIMIT = 50`;
`getVersionSnapshot` is one point lookup. Against Convex's per-transaction budget
(16 MiB read, 32,000 documents scanned, 4,096 index ranges) a full history page is
roughly one index range and ~50 small rows. The "one query per edit" cost the
snapshot model avoids only appears in a delta-chain design.

**What the hard part actually is (the real blocker).** Not storage, not traversal —
**merge semantics**. Merging two divergent versions of one document means field-level
three-way merge plus a conflict-resolution UI, which is the same unsolved problem as
the "Concurrent-edit conflict-resolution UX" entry above, at a larger scope. That
cannot be designed before the product requirement exists, and no amount of
pre-building in the versioning spec makes it easier.

**Traversal, if the graph ever gets deep.** Git's own answer is the `commit-graph`
file (Git 2.18+): precomputed commit metadata with **generation numbers**
(topological levels) so ancestry questions are answered without walking history, plus
changed-path Bloom filters (2.27+) for path-scoped log. GitHub additionally never
returns an unbounded history — the commits UI and the REST/GraphQL APIs paginate.
The cheap local equivalent would be a generation number on each version row.
**Deliberately not added now**: with a linear chain, generation IS the version number,
so it would be pure duplication today, and it is derivable for existing rows later —
which means it fails the spec's own "only record what cannot be reconstructed" test
(decision 11).

**Lift.** Unassessed for the feature itself. The versioning spec's contribution is
already complete: every lifecycle event is an attributed history node with a real
parent edge, `version` is a document-scoped monotonic integer (a stable DAG node id
that stays valid once branches exist), and snapshots make any future diff or graph
view computable retroactively.

**Why deferred.** Merge semantics are undesigned, no customer requirement is defined,
and every structural prerequisite is additive with no backfill. Building any of it
now would be dead code by this project's own rules.

**Detail.** Design Decision 11, `.agent/docs/specs/2026-09-20-versioning-drafts/spec.md`;
UI options (`@gitgraph/core` as a layout engine behind a custom renderer) assessed in
the 2026-09-21 session.

---

## Git as the versioning store (rejected as backend; viable as a one-way mirror)

**What.** Two separable ideas, assessed together because they get conflated: (a) make
a git repo the source of truth for content versions — commit every edit, read history
back out of git; (b) project already-stored `vex_versions` rows into a git repo as a
one-way mirror.

**(a) As a backend — no.** Six findings, ordered by how decisive they are:

1. **It does not solve the problem that motivated it.** Git's attraction was branching
   and merge. Git merges *text lines*; vexcms documents are structured JSON (block
   arrays, rich text, relationship id arrays). Line-based three-way merge over
   serialized JSON either conflicts on nearly every concurrent edit or silently
   produces a document that no longer validates. A field-aware structured merge still
   has to be written — so the hard part is untouched.
2. **Rate limits make the draft path structurally impossible.** GitHub allows 500
   content-generating requests per hour and 80 per minute, shared across the token/
   installation and counting web-UI actions too; writes also cost 5 points against the
   900-points-per-minute secondary limit. Autosave debounces at
   `DEFAULT_AUTOSAVE_DEBOUNCE_MS = 1000`, so one actively-typing editor can produce
   ~3,600 saves/hour — roughly 7x the hourly ceiling, before a second editor exists.
3. **Transactionality breaks.** Convex queries/mutations are deterministic and
   sandboxed with no network access, so every git call must be an `action`, which is
   not transactional with the document write. That is a dual write: the row commits and
   the push fails (or the reverse), and content and history disagree with no rollback.
   Convex's OCC retry — which `createVersion`'s read-modify-write already depends on —
   does not extend across an external API.
4. **Reactivity is lost.** The edit view, list views, version dropdown and live preview
   are all live Convex subscriptions. Git is poll-only, so a git-backed history
   dropdown stops updating on its own and needs manual invalidation — a regression
   against what Step 13 gets for free.
5. **RBAC cannot follow.** Field-level permissions are enforced server-side in Convex,
   and history reads are gated on `readDrafts`/`deleteVersions`. Git has repo-level
   access only, so it could never serve gated reads; the Convex read path would remain,
   making git a redundant second copy rather than a replacement.
6. **Ops and positioning.** Every install would need a second repo plus a credential,
   where today a deploy needs only a Convex deployment — and it makes a git host a hard
   dependency for an open-source, self-hostable CMS.

   Framing: git-backed CMSs (Tina, Decap, Keystatic) work because they target
   markdown/static-site content where a document *is* a file, line diffs are meaningful,
   and there is no live multi-user editing or per-field RBAC. Adopting git as the
   backend is choosing to be that product instead of this one.

**(b) As a one-way mirror — plausible, and a real enterprise selling point.** "Your
content history lives in your own git repo" buys audit/compliance, PR-style review of
content, an exit/migration path, and disaster recovery. It also sidesteps every
objection above: it runs async on a schedule rather than on the write path (batch a
day of versions into one commit — orders of magnitude under 500/hour), it is a
projection rather than a source of truth (so a failed push means the mirror lags, not
that data is lost), it needs no reactivity, and gating stays in Convex because the
exporter only ever reads what it is permitted to.

**Lift.** Unassessed. Roughly: a scheduled Convex action, a serializer from
`vex_versions` rows to a file tree, and credential storage per deployment.

**Why deferred.** Needs no changes to the versioning spec to remain possible:
`vex_versions` is already append-only, attributed (`createdBy`), parent-linked, and
stores whole-document snapshots — exactly the input a commit projection needs (author,
parent, full tree state per node). It is a pure read-side consumer, so building any of
it now would be speculative.

**Detail.** Design Decision 11, `.agent/docs/specs/2026-09-20-versioning-drafts/spec.md`;
assessed in the 2026-09-21 session.

---

## Richtext editor scroll position survives a refresh

**What.** Remember each richtext field's scroll offset inside its editor box
(`PlateEditorField`'s `maxHeight: 500; overflowY: auto` wrapper) in
`localStorage`, restore it on load, and delete the entry when the field is
scrolled back to the top.

**Why.** Long richtext bodies scroll inside their own box; a refresh (or the
admin re-mounting the form) drops the editor back to the top, losing the
editor's place.

**Design (approved shape, 2026-10-14).**
- Key: `vex-richtext-scroll:<collection>:<documentId>:<fieldPath>`
  (`fieldPath` = the form field `name`, so nested fields like
  `sections.2.body` stay distinct). No key in create mode (no id) → nothing
  persisted.
- Plumbing: optional `persistenceKey?: string` on core
  `VexEditorComponentProps` (adapters may ignore it); a small
  document-identity context provided by `CollectionEditView`/`GlobalEditView`
  (field inputs don't receive the document id today —
  `InputComponentProps` only carries the collection); the react richtext
  `Input` builds the key and passes it to the editor.
- Save: `onScrollEnd` on the scroll box (React 19) — `scrollTop > 0` →
  write, `0` → remove. Fallback for browsers without `onscrollend`: a ~150ms
  debounced `scroll` handler running the same function.
- Restore: read once after mount; content height grows after mount (lazy
  editor chunk, images loading), so re-apply via a `ResizeObserver` on the
  content until the target is reachable, the user scrolls, or ~2s pass. A
  `restoring` guard ignores scroll-end events until then, or the initial
  `scrollTop = 0` would delete the entry before it's restored.

**Lift.** Small — three packages, ~1 hook plus a context:
`packages/core/src/editor/types.ts`, `@vexcms/react` (context + richtext
`Input`), `packages/richtext-plate/src/editor/PlateEditorField.tsx`.

**Blockers / open question.** Which document id keys the entry: the first
autosave of a published document creates a draft row with a different id
(`setActiveDocumentId(draftId)` in `CollectionEditView`). The key must use the
id a refresh reopens (the URL's) or the saved offset is orphaned after the
first autosave — verify which id the URL holds before implementing.

**Why deferred.** Nice-to-have UX; developer wants to decide later.
`localStorage` chosen over a cookie: the value is client-only (the editor
renders client-side, and restoring must wait for images anyway), so a cookie
would only add request weight.

---

## Richtext video (and wider media) nodes

**What.** Let the richtext editor insert video — and potentially audio, file
attachments, and URL embeds — alongside images.

**Why.** The storage pipeline is already media-agnostic (`generateUploadUrl`/
`createMediaDocument`/media collections store any MIME type); only the richtext
integration is image-only. Editors will eventually want video in body content.

**Assessment (2026-10-14).** Plate imposes no limit: `@platejs/media` (already
a dependency) ships `VideoPlugin`, `AudioPlugin`, `FilePlugin`, and
`MediaEmbedPlugin` next to the `ImagePlugin` we register. The image-only
restriction lives entirely in `richtext-plate`:
- `features`: only `ImageFeature`; `createPlugins` registers only `ImagePlugin`.
- Paste/drop handlers and the popover's Upload tab filter `image/*`.
- The popover's Media Library tab filters results to image MIME types.
- Only an `img` node has editor + static-renderer components.

**Lift (video-only scope).** Moderate, one package plus the static renderer:
`VideoFeature` + `video` element components (editor + `render/components/
elements.tsx`, `<video controls>` with the image treatment for width/align);
popover accepts `video/*` and shows videos in the library tab; paste/drop MIME
branch inserts a `video` node. Embeds/audio/files deliberately excluded —
each is its own feature decision.

**Blockers / open questions.**
- Resize/crop is image-specific (`object-fit: cover` crops an `<img>`); a
  `<video>` can reuse the width handle but crop needs its own decision.
- No transcoding/adaptive streaming: Convex serves the file as uploaded;
  large videos hit storage/bandwidth directly.
- Possibly a `richtext({ mediaMimeTypes })` option for per-field control.

**Why deferred.** Image support just shipped (spec 2026-10-13-richtext-field);
developer explicitly keeps the popover image-only for now (Upload tab and
library select restricted to `image/*`, tooltip "Insert image").

---

## Convex function bundle size (dead auth/admin code)

**What.** Keep code that never runs in the Convex runtime out of the Convex
function bundle. Measured 2026-10-16 with esbuild using Convex's own bundler
settings (`conditions: ["convex","module"]`, splitting, minified syntax and
identifiers) over `apps/test/convex/*.ts`. Three sources found:

1. **Admin UI via the richtext editor — fixed.** `vex.config.ts` →
   `plateEditor()` lazy-imported `PlateEditorField` → `@vexcms/react` + Plate +
   Slate + lucide + Base UI. esbuild bundles lazy chunks even though they never
   run. Fixed by a `"convex"` export condition on `@vexcms/richtext-plate`
   (`src/server.ts`, inert adapter): 7,955 → 2,372 KB unminified.
2. **`nextCookies()` — fixed in `apps/test` and `apps/www`; still in the
   `base-nextjs` template.** Better Auth runs only in Convex here
   (`convexBetterAuthNextJs` proxies), so both of the plugin's hooks fail on
   `next/headers` and return. It pulled 36 Next server files: 2,211 → 2,059 KB
   (−152 KB). The plugin has no schema, so removal doesn't affect auth tables.
   Template: `packages/create-vexcms/templates/base-nextjs/convex/auth/plugins/index.ts`.
3. **Kysely via the full `better-auth` entry — open.** ~391 KB. Vex passes an
   adapter and never runs Better Auth migrations, so `better-auth/minimal`
   (no Kysely: no direct DB connection, no `runMigrations()`) would be
   functionally sufficient. But switching `createAuth` alone saves only ~11 KB:
   `@better-auth/api-key` imports `BetterAuthError` from the root
   `better-auth` entry, which keeps the full entry and Kysely in the bundle.

**Why.** A smaller bundle means faster deploys and less code to load per
function cold start [INFERENCE — cold-start effect not measured]. No
correctness impact found for any item.

**Lift.** Item 2's template: one line plus a template-sync run. Item 3: blocked
upstream; revisit when `@better-auth/api-key` imports from a subpath, or if the
API-key plugin is dropped (then switch `convex/auth/index.ts` to
`better-auth/minimal` and re-measure).

**Why deferred.** Items 1–2 are done in the apps; item 3's saving is gated on
an upstream change. Developer asked to keep it on record to revisit.

**Detail.** Re-measure with an esbuild metafile build of `apps/test/convex/*.ts`
using the conditions/options in `convex/dist/cjs/bundler/debugBundle.js:73-90`,
then reverse-walk importers of the module family in question.

---

## Database adapters (`@vexcms/convex` split, then Supabase/Postgres)

**What.** Move every Convex-specific piece of `@vexcms/core` (the `api/*` query and write
paths, `versions/*` writes, media queries, `convex-helpers` triggers, `v.*` schema codegen)
behind a database-adapter interface, ship it as `@vexcms/convex`, and later add
`@vexcms/postgres` (Drizzle) + `@vexcms/supabase`, with MongoDB last. Non-Convex adapters
expose fewer guarantees (live queries, catch-all after-hooks, migration-free schema).

**Why.** Today the market is capped at the Convex ecosystem (~10k paying teams). Supabase
alone has ~100k customers and recovers most Convex features (Realtime, Storage, `pg_cron`).
It also answers the "platform risk" investor objection.

**Measured lift.** ~52% of core LOC (58 of 199 non-test files) imports Convex. The public API
also exposes Convex's execution model (`ctx`-taking server API). The access layer already
compiles a backend-neutral constraint tree (`access/compileConstraints.ts`), which is the
template for other compilers. Estimate: 4–8 weeks for the split with no behaviour change,
plus 10–16 weeks for a Supabase MVP (feasibility doc §4).

**What blocks it.** Nothing technical. Two prerequisites keep the split non-breaking:
launch-plan item **B3** (spec `.agent/docs/specs/2026-10-21-backend-neutral-query-args/`, before
0.1.0), which removes Convex builder types from the public query and access APIs; and the
adapter-readiness items (spec stem `.agent/docs/specs/2026-10-21-adapter-readiness/stem.md`,
before Track PL ships): neutral field storage kinds, `vex` in hook props, a serializable
`where`, and one data seam shared with Convex-component collections.

**Why deferred / when.** Scheduled as Track DB in `post-v0.1.0-plan.md`: after the Enterprise
tier, Supabase as the second backend, and community adapters only after two first-party ones.

**Detail.** `.agent/docs/research/db-adapter-feasibility.md` (coupling inventory, parity
matrix, phase estimates, market math).

---

## Custom server components in admin slots

**What.** Let admin slot contributions be React Server Components declared in
`vex.config.server.ts`, rendered by `@vexcms/next` and handed to the client views by
contribution ID — for custom UI that must fetch data or use secrets on the server.

**Why.** Some integrations need server-only work at render time (server-side SDKs,
RSC-only libraries). Payload supports server components in custom admin components;
plugin authors coming from Payload will expect it.

**Lift.** Unassessed; the path is clear. `NextAdminPage` (`packages/next/src/NextAdminPage.tsx`)
is already an async server component that receives the server config and prefetches Convex
data with the request token, so it can render server contributions for the current route and
pass the output into the client views' slot outlets (G steps 7–8).

**Blockers / limits.**
- Only page-level slots make sense (edit header / before-fields, list before-table, dashboard,
  custom routes). Per-field, per-row, per-block and modal slots stay client-only — N rows would
  mean N server renders.
- Output renders per request / navigation: it cannot react to unsaved form edits or live
  Convex updates without a refresh.
- Framework-specific: the TanStack Start adapter would need its own equivalent.
- Most Convex data needs are already met by reactive client queries, or by actions for
  secrets.

**Why deferred.** Decision S14 in `.agent/docs/specs/2026-10-21-plugin-system/stem.md`:
0.1.0 slots are client-only to avoid a second, untested render path in H / I. Adding server
contributions later is additive (a new server-config key), so waiting costs nothing.
Revisit with Track PL.

**Detail.** Stem decision S14; `.agent/docs/research/plugin-system-design.md` (Payload's
import map exists because its config lives on the server).

---

## Config toggle: stop persisting array item / block ids

**What.** A project-level setting (e.g. `fields.persistItemIds: false` in `vex.config.ts`,
default `true`) that stops VexCMS storing the generated `id` on every object-shaped `array()`
item and every `blocks()` item. Ids would be generated in the admin only, never saved.

**Why.** Each id is ~21 chars (~30 bytes with its key) per array item / block, so storage
grows with content. Some projects want the smallest documents and don't need item identity
outside the editor.

**Lift.** Medium. Audited 2026-10-24 (field-input-consistency-pass session):
- Ids are written by `withArrayItemId` / `assignArrayItemIds` (`packages/core/src/fields/array/utils.ts`,
  backfilled server-side in `api/prepareEdit.ts`) and by `buildDefaultBlock` / `cloneBlockWithFreshIds`
  (`fields/blocks/utils.ts`); declared in `fields/array/validator.ts` (`id: v.optional`),
  `fields/blocks/validator.ts` (`id: v.string()`) and the generated types (`array/config.ts`,
  `blocks/config.ts`). With the toggle off, all of these skip the id.
- Admin consumers move to a client-only key list per array/blocks path, held at form level (in
  `AppForm`'s provider) and moved by add/duplicate/move/remove/drag: `FormArray` keys,
  `FormGroup`'s `accordionStoreKey`, `FormBlocks`' `openBlockIds`. Scalar arrays already work this
  way (`FormArray` `keysRef`). Keys never reach the DOM before DnD mounts, so SSR, hydration and
  page refresh are unaffected.
- Nothing server-side reads item ids (saves, live-field merge and versions treat the array as one
  value).
- A one-time migration strips ids when a project switches the toggle off (Convex rejects
  undeclared keys once the schema stops declaring `id`).

**Tradeoffs the user opts into.**
- No stable item/block identity outside the admin: no `#block-…` anchors, cross-version item
  tracking, comments or translation tooling keyed to a block.
- `RenderBlocks` keys by index, so in live preview a reorder doesn't carry component state (an
  open FAQ panel stays at its position). Published pages unaffected.

**Why deferred.** Low priority; the storage saving is small, and ids stay the default because
they enable those identity features. Revisit whenever document size becomes a user concern.

## Per-view access for saved views (role-scoped views)

**What.** Restrict which roles can see and use a saved view — and therefore its hidden filter —
instead of every role that can read the collection seeing every view.

**Why.** Technical users build views for specific audiences (support triage, finance review);
today (spec `2026-10-26-list-view-overhaul`) any role with `readViews` sees every shared and
config view, and the declared-filter allow-list accepts any view's hidden filter.

**Lift.** Small and additive. As of the 2026-11 polish round, view actions (`readViews` / `createView` /
`updateView` / `deleteView`) return only `boolean` (field-permission maps are a type error and fail
closed at runtime), and their callbacks take a single props object (`({ user, organization }) =>
boolean`), so adding a `view` prop is non-breaking. `vex_views` rows already store `createdBy`
(user id, `""` for anonymous); `organizationId` is stamped under `access.organizations`.
- Data: add `updatedBy` (optional; existing rows lack it) and an `updatedAt` via `commitTs()` to
  `vex_views` in `generateVexSchema`; stamp both in `saveView`.
- Types: view-action callbacks gain `view` (the stored row: `createdBy`, `updatedBy`,
  `organizationId`, `name`, `state`…); `createView` receives the view about to be stored.
- Server: `listViews` evaluates `readViews` per shared row (it can't be pushed to an index;
  fine at tens of views); `saveView`/`removeView` evaluate `updateView`/`deleteView` against the
  existing row; `loadSharedSavedListViewWheres` trusts only views the caller can read (so the
  declared-filter exemption follows per-view access).
- Config views: an optional `access` on `admin.views[]` entries, checked by `toClientSavedListViewConfig`
  consumers and by `matchDeclaredSavedListViewFilter` before trusting a hidden filter.
- UI: per-view Rename/Delete/Promote enabled by the same callback (e.g. "only the creator can
  delete"), hidden tabs for unreadable views, and optionally a role picker in the save dialog.
- Tests + the access docs (`access-control.mdx`) + a changeset.

**Blocks.** Nothing.

**Why deferred.** Not needed for v0.1.0. The developer asked (2026-11-01) to future-proof the
callback shape now and build this later.

## Admin-wide keyboard shortcut pass (list + edit views)

**What.** One coherent keyboard-shortcut layer across the admin panel: the list
view's core set from the list-view spec's Step 15 (`/` focus search, `Esc`
layering, `↑`/`↓` row focus, `Enter` open, `Space` peek, `X`/`Shift+X`
selection via a `listView/useListShortcuts` hook on `useEventListener`), plus
an equivalent pass over the edit view, designed together so bindings and the
input-focus/dialog/composition guards are consistent.

**Why.** Developer call (2026-10-28): shortcuts should ship as one
cross-view pass, not per-view fragments.

**Blocks.** Nothing — purely additive; Step 16 of
`2026-10-26-list-view-overhaul` explicitly doesn't depend on Step 15.

**Why deferred.** Deferred out of `2026-10-26-list-view-overhaul` (Step 15
unimplemented) so the list view ships; the full design lives in that spec's
Step 15 section (spec.md § "Step 15 — Keyboard shortcuts", Decision 30).

---

## React hooks lint pass (deferred)

**What.** Enable `eslint-plugin-react-hooks` in the root `eslint.config.mjs`
(`react-hooks/rules-of-hooks: error`, `react-hooks/exhaustive-deps: warn`,
matching the plugin's own `recommended` severities) and fix/triage every
finding it surfaces across `packages/*/src`.

**Why.** The root config currently has no `react-hooks` plugin registered at
all — confirmed by investigation, not assumed. Several files carry
`// eslint-disable-next-line react-hooks/exhaustive-deps` comments that
pre-date this gap and error as "unknown rule" directives; those 14 invalid
directives were already removed (see below). With the plugin OFF, neither
`rules-of-hooks` (conditional/early-return-gated hook calls — real bugs) nor
`exhaustive-deps` (stale-closure risk) is checked at all right now.

**Lift.** Attempted and fully reverted this session (2026-11) after the
developer flagged that hook-rule violations are deliberate in some places and
the plugin should not land as a side effect of an unrelated JSDoc lint pass.
Everything below was found, triaged, and (for `rules-of-hooks`) fixed once —
the fixes are not preserved, but the investigation is, so a future pass starts
from a known list instead of re-discovering it.

**`rules-of-hooks` findings (all real bugs — hooks called after an early
return or inside a loop/callback; every one of these needs restructuring, not
a disable):**

- `admin/AdminSidebar.tsx` L74,81,88 — `usePermission` called inside three
  `.filter()` callbacks (hook-in-loop; count varies with
  `config.collections/globals/mediaCollections.length`). Fix shape: hoist
  `useVexAccess()`/`useVexAuth()` once, call the plain `hasPermission()`
  predicate (not the `usePermission` hook) inside each filter.
- `collections/editView/CollectionEditView.tsx` L127 — `useState` called
  after `if (!collection) return <p>...</p>`. Fix shape: hoist the `useState`
  above the guard (it doesn't depend on `collection`).
- `collections/listView/CollectionListView.tsx` — ~19 hooks (`useState`×4,
  `useRef`, `useEffect`, `useFieldPermissions`, `useMemo`×3,
  `useColumnsWithActions`, `useListViewPrefetch`, `useListViews`,
  `useListUrlState`, `usePermission`×2, `useQueryState`) all called after
  `if (!collection) return <AdminNotFound .../>`. Fix shape: split into an
  early-return-only wrapper plus an inner component that receives the
  resolved `collection` as a prop and runs every hook unconditionally (same
  pattern as `CollectionEditView.tsx`'s existing
  `CollectionEditView`/`CollectionEditViewData` split).
- `fields/array/Cell.tsx` L37, `fields/checkbox/Cell.tsx` L30,
  `fields/color/Cell.tsx` L32, `fields/commitTs/Cell.tsx` L26,
  `fields/date/Cell.tsx` L33, `fields/email/Cell.tsx` L31,
  `fields/number/Cell.tsx` L29, `fields/select/Cell.tsx` L30,
  `fields/url/Cell.tsx` L29 — same pattern across all 9 field cell
  components: `useVexConfig()` called after an early `return <span>—</span>`
  for a null/undefined/empty value. Fix shape: move `useVexConfig()` above
  the early return in each (trivial, no dependency on `props.value`).
- `fields/relationship/Field.tsx` L129-130 — `useFormContext()`/`useStore()`
  called after `if (!targetCollection) return <div>...</div>`. Fix shape:
  hoist both above the guard.
- `fields/richtext/Field.tsx` L204-205 — same pattern, guard is
  `if (!config.editor) return <FieldGroupBox>...</FieldGroupBox>`.
- `media/CreateMediaModal.tsx` L39,44 — `useQueryState`/`useRef` called after
  `if (!collection) return null`. Fix shape: hoist both above the guard.
- `media/MediaCollectionListView.tsx` L102,104,110,121,126 — same
  early-return-before-hooks pattern as `CollectionListView.tsx` (smaller:
  `useState`, `useFieldPermissions`, `useMemo`, `usePermission`×2). Fix
  shape: same wrapper/inner-component split.
- `slots/formData.ts` L60 — `useStore` called conditionally:
  `form ? useStore(form.store, selector) : undefined`. No trivial hoist
  fix — needs a stable fallback "store" object (`{get, subscribe}` shape,
  per `@tanstack/react-store`'s actual minimal requirement for `useStore`'s
  first argument — no need to depend on `@tanstack/store` directly) so
  `useStore` can run unconditionally. **Pitfall hit and fixed once already:**
  the fallback's `get()` must return the SAME cached reference every call,
  not a fresh object/array literal — otherwise `useSyncExternalStoreWithSelector`
  never settles and the component infinite-loops ("Maximum update depth
  exceeded"), which happened live on `:3020` this session when the fix
  briefly had this bug (caught via the `slots/*.test.tsx` suite, not live
  monitoring — see `.agent/docs/session-log/` around 2026-11-01 for the
  incident writeup if still present).

**`exhaustive-deps` findings: 44 total**, reviewed in detail for 17 of them
(verdicts recorded, not preserved in code):

- Deliberate (ref-guarded one-time effects, two-way sync guards,
  notify-parent-on-value-only effects, TanStack Form's stable-instance
  guarantee, narrow-primitive-over-whole-object deps) — 15 sites across
  `admin/AdminLayout.tsx` L166, `collections/editView/CollectionEditView.tsx`
  L330, `collections/listView/CollectionListView.tsx` L447/L872/L875,
  `collections/listView/ListFilterBuilder.tsx` L530,
  `collections/listView/ListSearch.tsx` L79/L90,
  `collections/listView/ListViewTabs.tsx` L633,
  `collections/listView/listViewStore.ts` L268/L286,
  `collections/listView/useListViews.ts` L371,
  `fields/relationship/FilterInput.tsx` L58, `fields/upload/FilterInput.tsx`
  L51, `livePreview/useLivePreviewPanelState.ts` L171.
- Real bugs, fixed once — `collections/listView/CollectionListView.tsx` L916
  (`emptyState` `useMemo` reads `props.urlState.setQf/setQ/setFilter` inside
  closures but didn't depend on `props.urlState`, which itself changes
  identity whenever `viewState` changes — add `props.urlState` to the deps,
  no loop risk since it's a `useMemo` not an effect) and
  `collections/listView/useListViews.ts` L423 (`const sharedViews =
  (sharedQuery.data ?? []) as ...` created a fresh `[]` every render while
  `sharedQuery.data` was falsy, defeating the `views` `useMemo`'s own
  memoization downstream — wrap `sharedViews` in its own `useMemo` keyed on
  `sharedQuery.data`).
- Not yet investigated (27 sites, subagents were mid-triage when this pass
  was reverted) — `fields/collapsible/Field.tsx` L54, `fields/date/Field.tsx`
  L78, `fields/tabs/Field.tsx` L121, `fields/useLiveFieldMerge.ts` L59,
  `forms/AppForm.tsx` L92, `forms/BlocksField.tsx` L238,
  `forms/GroupField.tsx` L57 (⚠ no deps array at all on an effect that calls
  `setOpenValue` — ESLint's own infinite-loop warning, investigate first) and
  L67, `globals/GlobalEditView.tsx` L278, `media/MediaUploadDropzone.tsx`
  L100/L124, `ui/JsonEditorView.tsx` L152, `ui/datetime/date-picker.tsx`
  L274/L512/L524/L649/L678, `ui/datetime/input.tsx` L165/L172/L496 (deps
  list not a static array literal), `ui/datetime/time-picker.tsx` L121,
  `ui/multi-select.tsx` L337 (ref read in cleanup, not the ref snapshot from
  the effect body), `versions/VersionPublishAction.tsx` L72 (same
  memo-defeat shape as `useListViews.ts` L423 above), `versions/useResetWhenSaved.ts`
  L73, `richtext-plate/src/editor/PlateEditorField.tsx` L150 (likely
  deliberate — existing comment already explains keying on `plugins` only).
  The `ui/datetime/*` cluster (11 of the 27) is the highest-risk group: a
  picker's displayed state not re-deriving from `value`/`hour`/`minute`/etc.
  is a real, user-visible bug class, but several of these effects both read
  AND set the same state they're missing from deps — blind dep-adding risks
  the same infinite-loop class as the `formData.ts` incident above; restructure
  (derive via `useMemo` keyed on external inputs only) rather than just adding
  deps.

**Blocks.** Nothing technically — purely additive once scoped correctly.

**Why deferred.** Developer decision: the plugin is not part of this change
set because hook-rule violations are deliberate in some places in the
current codebase, and enabling it needs its own scoped pass (with the
`rules-of-hooks` fixes reviewed individually, not bundled behind an
unrelated JSDoc lint cleanup).

**Detail.** No separate doc — this entry is the full record. When picked
back up: re-add `eslint-plugin-react-hooks` to `pnpm-workspace.yaml`'s
catalog if dropped (it was already catalogued at `7.1.1` when this was
tried) and to root `package.json#devDependencies`, register it in
`eslint.config.mjs`'s `packages/*/src` block, then work the two finding
lists above top to bottom. Smoke-test each `rules-of-hooks` restructuring
and each real `exhaustive-deps` fix against a live admin session before
moving to the next one — `packages/react/src/**` edits hot-reload instantly
into any running `apps/test`/`apps/www` dev server via
`next.config.ts`'s `workspaceSourceAliases()` (Turbopack `source` export
condition), so a broken intermediate state is live immediately, not just in
the editor.

## HTTP API for vex server functions (API-key auth)

**What.** An exported helper (e.g. `registerVexHttpRoutes(http, { internal, verifyKey, basePath: "/api/vex" })`)
that apps call from `convex/http.ts` to expose REST routes over the vex server API, authenticated by
API keys that act as their creating user (same `hasPermission`/field maps/row rules).

**Why.** External services and scripts need data access without a browser session; the access layer
already enforces everything from a resolved `VexApiAuth`, so HTTP becomes a transport, not a second
permission system.

**What exists already.** Both apps run better-auth's `apiKey()` plugin (key create/hash/verify/revoke,
the `apikey` table, `apiKeyClient`); `convex/http.ts` exists (auth routes only); permissions resolve
from the user's CURRENT roles per request, so a key loses access when its user does.

**The constraint.** Convex `httpAction`s have no `ctx.db`; they can only `ctx.runQuery`/`runMutation`,
and inside those `ctx.auth` is the request's identity (none for an API key). So:
1. `vexServerApi` also registers INTERNAL variants (`internal.vex.find`, `get`, `create`, …) that take a
   pre-resolved `auth` arg instead of reading `ctx.auth`. Internal functions aren't client-callable, so
   the arg can't be spoofed.
2. The router helper, per request: verify `Authorization: Bearer <key>` (better-auth) → load the user
   → resolve the organization (stored on the key at creation, or an `X-Organization-Id` header validated
   against memberships) → parse args (reuse the list URL codec: `filter`/`sort`/`cols`/`q`/`size`) → run
   the internal function → map errors (access → 403, not found → 404, `INVALID_*` → 400).
3. Routes: `GET/POST /collections/:slug`, `GET/PATCH/DELETE /collections/:slug/:id`, the same for
   globals; `depth`, `drafts`, cursor pagination.
4. Admin key management: create (shown once)/name/expire/revoke; `createdBy`, `lastUsedAt`.

**Open decisions.** Scoped keys (key scopes ∩ the user's permissions, recommended, vs the user's full
permissions); how a key picks its organization; rate limiting (`@convex-dev/rate-limiter`); CORS;
media uploads (two-step upload-URL flow); optional OpenAPI generation from the vex config.

**Phasing.** Phase 1, read-only: internal variants + the router helper + key auth + GET routes + error
mapping + tests (~2–3 agent-days). Phase 2: writes, scoped keys, org selection, the key UI, rate
limiting, uploads, docs (~1–2 weeks).

**Blocks.** Nothing; purely additive.

**Why deferred.** Developer request (2026-11-01): design captured now, built later.

## Define `vex_versions` / `vex_views` as internal collections

**What.** Move the hard-coded `vex_versions` and `vex_views` table strings out of
`packages/core/src/schema/generateVexSchema.ts` into collection definitions in
`packages/core/src/collections/internal/index.ts`, so schema (and optionally types) generate from the
same pipeline as user collections.

**Why.** Less hand-written schema in the generator; one source of truth for field/index shape.

**What it takes** (not just a move: `internalCollections` is appended to `config.collections` today,
so an internal collection is treated like any collection):
- An internal-collection flag that keeps it OUT of the admin UI (sidebar, `/admin/collections`,
  dashboard, list/edit routes), the generated public client API (`find`/`create`/… must NOT be
  exposed for `vex_views`/`vex_versions`; views stay reachable only via `listViews`/`saveView`/
  `removeView`, which enforce org scoping, `INVALID_VIEW` and creator stamping), and the access
  resources, while still emitting its schema.
- An exemption from the reserved `vex_` slug rule and from the injected `updatedAt` (`timestamps: false`).
- Field mappings that reproduce the exact schema: `v.any()` (`snapshot`/`state`), the
  version-status literal union, optional numbers/strings, and the indexes (`by_document_version`
  on 3 fields, `by_collection`, `by_collection_org`, `by_view_id`).
- A snapshot test proving the generated `vex.schema.ts` is byte-identical before/after.
- `vex_globals` stays as is (its version fields are conditional).

**Effort.** ~0.5–1 agent-day; pure refactor, no behavior change.

**Why deferred.** Developer decision (2026-11-02): not before release.

---

## Total-count cap for large collections (`admin.view.countLimit`, redesign)

**What.** A proper large-collection story for the list footer's total. Today
`admin.view.countLimit` (Decision 35, `packages/core/src/collections/types.ts`)
makes `find` count with `take(countLimit + 1)` and shows "X of N+" once hit,
with a silent default of `1000`. The redesign should cap only when a count is
genuinely expensive. Show the exact total by default up to what one Convex query
can scan (~32k documents), and use a cap or an alternative (aggregate component,
maintained counter, estimated count) beyond that. It should fit the current
features: views (`view.state.countLimit`), filters, search, and the draft-pair
merge.

**Why.** Developer expectation (2026-11-02): collections under ~32k docs should
show their real `totalDocs`. The 1000 default and the per-collection `50` demo
cap on `testimonials` (now removed) both read as wrong totals, not as an
optimization.

**Blocks.** Nothing. It touches `find`/`search` server count paths,
`resolveCountCap`, `usePaginatedQuery`'s `totalDocsCapped`, and the
`DataTable` footer.

**Why deferred.** Developer decision (2026-11-02): implement properly later,
not as a tweak during the list-view overhaul.

---

## Link telemetry snapshots to issue reports

**What.** A "Project shape" field in the GitHub bug-report issue template where
reporters may paste the output of `vex telemetry status --json`. That output is
the same anonymized payload the CLI sends: numbered names, counts, booleans and
fixed literals, plus `projectId`. With it, an issue can be matched to its config
shape (and, if the reporter includes `projectId`, to that project's
`telemetryProjects` row), so bugs can be grouped by configuration (drafts, RBAC
query constraints, hooks, framework) and weighed against feature usage.

**Why.** Telemetry shows which features are used; issues show where they break.
Joining the two points 0.1.x work at the configurations that fail most.

**Lift.** Small: one issue-template field, a docs line on the telemetry page, and
optionally a `projectId` text filter on `telemetryProjects`.

**Blocks.** Build-time telemetry (spec `2026-10-26-build-time-telemetry`) must ship first.

**Why deferred.** Developer decision (2026-11-04): pasting is voluntary, so
anonymity holds, but it is outside the telemetry spec's scope.

---

## Array-membership (`contains`) filter operator

**What.** A `contains` operator in core's where/filter system (`VexWhere`, `queryConstraintTypes.ts` `FilterOp`, the Convex compiler, `validateSavedListViewConfig`, the list-view filter builder) that matches when an array-stored value includes the given value. `hasMany` select fields (and every select, since selects store arrays) need it for "has option X" filters.

**Why.** `telemetryProjects.fieldTypes` (a `hasMany` select of every field type a project uses) can be displayed but not filtered: `eq` against an array-stored `hasMany` field never matches (`queryArgs.ts` deliberately leaves `hasMany` out of the `eq`→array rewrite; `valuesEqual` needs both sides to be arrays). Views like "Uses Richtext" wait on this. The same gap affects every user's `hasMany` select filters.

**Lift.** Medium: new op through where-node types, the index/filter compiler (filter-only, never an index range), saved-view validation, URL state grammar, and a filter-builder operator for `hasMany` selects, with tests at each layer.

**Blocks.** Nothing.

**Why deferred.** Developer decision (2026-11-05): a core change outside the telemetry spec.

---

## Richtext editor keyboard parity (image select/resize, table-size picker)

**What.** Three `@vexcms/richtext-plate` editor interactions are pointer-only: selecting an
inline image (`EditorElements.tsx` `handleSelect` keeps local `useState` instead of Slate's
`useSelected()`/`useFocused()`, so arrowing onto the image void never reveals its align/resize
controls), resizing it (three `<div onMouseDown>` width/height/aspect handles with no keyboard
equivalent), and picking table dimensions (the `Toolbar.tsx` table-size grid uses
`onMouseEnter`/`onMouseDown` only).

**Why.** WCAG 2.2 2.1.1 Keyboard and 2.5.7 Dragging Movements (AA): an editor using only a
keyboard can't resize images or insert a table of a chosen size. Evidence: quality-pass
`findings.md` F-007, F-041, F-042 (jsx-a11y `click-events-have-key-events` /
`no-static-element-interactions`, confirmed by reading the handlers).

**Lift.** Medium: drive image selection from Slate selection state, add arrow-key step resize
on a selected image (plus numeric width/height inputs as the single-pointer alternative), and
give the table-size picker an APG Grid keyboard model (arrows move, Enter inserts).

**Blocks.** Nothing.

**Why deferred.** Beyond the quality pass's fix boundary (≤ ~30 lines, no structural change);
each needs its own interaction design.

## LLC billing stack for paid tiers (ENT-0 prerequisite)

**What.** The corporate billing layer for Pro / Agency / Enterprise sign-ups: Stripe (or
equivalent) on the LLC (the existing uifoundry.dev entity, reused for VexCMS), a
`billing@vexcms.dev` mailbox (Google Workspace secondary domain on the LLC's existing
Workspace — never a primary-domain rename), terms of sale, and invoices issued by the LLC.

**Why we want it.** Paid-tier revenue must flow through the corporate entity for tax
control (developer decision, 2026-11-07). The donation stream stays separate and personal
forever: GitHub Sponsors on `ianyimi` and Buy Me a Coffee stay personal; Sponsors profiles
are non-transferable, which is acceptable only because donations never need to move.
Buttondown (release emails, registered as `vexcms`) is subscriber data, not money, and is
transferable whenever needed.

**Lift.** Unassessed; standard SaaS billing setup plus legal copy.

**Blocks.** The first paid signup. Nothing in the 0.1.0 launch track.

**Why deferred.** Post-launch: business-tier design is ENT-0 (`post-v0.1.0-plan.md`), and no
paid product exists at 0.1.0. Fold this into the ENT-0 spec's scope so the entity layer
exists before the first paid customer.

**Detail.** 2026-11-07 session discussion (launch coordination); `post-v0.1.0-plan.md` § ENT-0.

---

## `@daveyplate/better-auth-ui` unlabelled controls and invalid nesting

**What.** Three defects on `/auth/sign-in`/`/auth/sign-up`, all rendered entirely inside
`node_modules/@daveyplate/better-auth-ui`'s own bundled components. **Two are now fixed**
via `patches/@daveyplate__better-auth-ui@3.4.0.patch` (registered in root `package.json`
`pnpm.patchedDependencies`): the password-visibility toggle's icon-only `<button>` now
carries `aria-label` (F-071), and the footer link's `<a href="..."><button>...</button></a>`
nesting (Nu: "the element `button` must not appear as a descendant of the `a` element") is
now `<Button asChild><Link>...</Link></Button>`, the standard Radix `Slot` pattern (F-072,
button-in-link half). **What remains**: `/auth/sign-up` still emits a `<style>` element after
other body content with an IE/Edge-only `::-ms-reveal`/`::-ms-clear` rule outside an `@scope`
block (Nu: 2 errors, confirmed on both `apps/www/audit/www-nu.json` and
`apps/test/audit/test-nu.json`) — repositioning an inline `<style>` tag inside the vendored
bundle is a larger change than this patch or the quality-pass fix boundary covers.

**Why.** HTML content-model validity (Nu) for the remaining `<style>` placement; the WCAG
4.1.2 name and nested-interactive defects above are resolved.

**Lift.** Unassessed. The style tag is emitted by the same vendored `dist/index.js` already
patched once — a second, narrower patch hunk repositioning it is plausible, but risks
fighting the library's own build output on every version bump; filing upstream is the
alternative.

**Why deferred.** Outside the quality pass's fix boundary (a markup change inside a
third-party bundle, not an in-repo file). The two higher-severity defects were worth a
patch; this validity-only one is deferred pending an upstream fix or a dedicated follow-up
patch.

**Detail.** `findings.md` F-071, F-072 (`2026-11-06-quality-pass`); the fixed portions
verified via `patches/@daveyplate__better-auth-ui@3.4.0.patch` + root `package.json`
`patchedDependencies`; the remaining Nu errors in `apps/www/audit/www-nu.json` and
`apps/test/audit/test-nu.json`.

---

## Cap heading levels offered by the richtext toolbar

**What.** `packages/richtext-plate`'s `getStaticComponents()` (`render/staticComponents.ts`)
registers the same `HeadingElementStatic` for `h1` through `h6` uniformly, and the editor-side
toolbar offers the same range. Every page that embeds a richtext field under its own
page-level `<h1>` — `/posts/[slug]`'s `PostContent.tsx`: `<h1>{post.title}</h1>` then
`<RichText content={post.body} />` — lets an editor pick "Heading 1" inside the body and
duplicate that `<h1>`.

**Why.** Two `<h1>`s on one page fails WCAG 1.3.1/2.4.6 heading-structure expectations and
confuses screen-reader users navigating by heading.

**Lift.** Unassessed. The toolbar's option set lives in the shared editor package, consumed
by every richtext field in every app (admin page bodies, posts, any future user collection)
— capping it globally could be wrong for a field with no page-level heading of its own.

**Why deferred.** Needs a design decision (global cap vs. a per-field
`editor.headingLevels` option) rather than a markup fix; out of the quality-pass fix
boundary (classes/attributes/markup only).

**Detail.** `packages/richtext-plate/src/render/staticComponents.ts`;
`apps/www/src/app/(frontend)/(site)/posts/[slug]/PostContent.tsx`.

---

## Sidebar rail tooltips on keyboard focus (`collapsible="icon"`)

**What.** `SidebarMenuButton`'s `tooltip` shows its label on hover only; keyboard focus never
opens it. The tooltip only renders when the sidebar is collapsed to the icon rail
(`collapsible="icon"`), which no shipped app config uses (the admin default is `"offcanvas"`).

**Why.** WCAG 2.2 1.4.13 Content on Hover or Focus and 2.4.6: a sighted keyboard user on an
icon rail sees icons without their labels. Screen readers are unaffected (the link keeps its
name). Evidence: quality-pass `findings.md` F-099 (keyboard sweep, 2026-11-08).

**Lift.** Small once a config uses the icon rail: open the Base UI tooltip on focus-visible in
`packages/react/src/ui/sidebar.tsx` and add a keyboard test against `collapsible="icon"`.

**Blocks.** Nothing.

**Why deferred.** Not reproducible in any shipped configuration, so it can't be verified live
within the quality pass.

---

## Data-table row checkboxes named by the row's title

**What.** Each data-table row's selection checkbox is named "Select row <_id>"
(`packages/react/src/ui/data-table/DataTable/index.tsx`). A screen-reader user moving through
checkboxes hears raw document ids instead of the row's title.

**Why.** WCAG 2.2 2.4.6 Headings and Labels / 4.1.2: the name is valid but not meaningful.
Evidence: quality-pass `findings.md` F-116 (polish review, 2026-11-08).

**Lift.** Small: an optional `getRowLabel?: (row) => string` on `DataTableProps`, passed by
`CollectionListView` from the collection's `useAsTitle` field, falling back to `_id`.

**Blocks.** Nothing.

**Why deferred.** A new public prop on `DataTable` — outside the quality pass's fix boundary
(no public API change).

---

## `apps/test` Convex test harness

**What.** `apps/test` has no `convex-test` harness and its `vitest.config.ts` lacks the
`@convex` alias `apps/www` has, so nothing there that imports Convex-generated types can be
unit-tested (e.g. the ported `convex/images.ts` `getById` and `components/MediaImage.tsx`).

**Why.** The two apps are meant to stay in step; `apps/www` covers these with
`convex/images.test.ts` and `components/MediaImage.test.tsx`, `apps/test` can't. Evidence:
quality-pass polish fixes (2026-11-08), `findings.md` F-120/F-121.

**Lift.** Small: mirror `apps/www/src/testing/createConvexTest.ts`, the `convex` vitest
project and the `@convex` alias, then copy the two test files.

**Blocks.** Nothing.

**Why deferred.** Test infrastructure in `apps/test`, outside the polish slice.

---

## Back/forward cache for live-data pages

**What.** Every `apps/www` site page keeps the Convex client's WebSocket open for live
content, and Chrome won't put a page with an open WebSocket in the back/forward cache
(Lighthouse `bf-cache`: "Pages with WebSocket can't enter back/forward cache", failure type
"Pending browser support"). Back/forward navigation reloads the page instead of restoring it.

**Why.** Instant back/forward is a large perceived-speed win on a marketing site, and
Lighthouse reports it on every audited URL. Evidence: PR #69 Lighthouse runs (2026-11-08);
`apps/www/lighthouserc.cjs` holds `bf-cache` at `warn` until this lands.

**Lift.** Small to medium. Close the Convex client (or pause its socket) on `pagehide`, reopen
on `pageshow` when `event.persisted`, and re-subscribe active queries. Needs a check that
react-query caches and live-preview overlays survive the restore. Mirror into `apps/test` and
the `base-nextjs` provider.

**Blocks.** Nothing; `ConvexReactClient` exposes `close()`, and a new client per restore
fits `getClients()` in `components/providers/convex.tsx`.

**Why deferred.** It's a behaviour change in the shared Convex provider. It's out of scope
for getting the quality checks green, and `bf-cache` stays reported in CI meanwhile.

## Hydration cost on site pages

**What.** Every `apps/www` site page blocks the main thread longer than Lighthouse's mobile
target (TBT ≤ 200 ms): 143–371 ms in CI at the default 4×, ~420–740 ms emulating a mid-tier
phone on fixed hardware. Most of it is script evaluation in the React DOM / Next.js framework
chunk (~770 ms on `/privacy` at the mid-tier slowdown), with the page's own client components
next (~230 ms long task). That's the cost of hydrating the page, not CMS or admin code: the
per-module split already keeps those off site pages. Performance (≥ 0.9) and LCP (≤ 2500 ms)
pass in CI at 4× and are gated, except LCP on `/tour`. That page's screenshot is its LCP
element, and Lighthouse charges it the ~500 KB of JS requested before it paints (simulated
1.8–4.4 s, observed ~200 ms), so it warns until this lands.

**Why.** Real mid-tier phones see this blocking time. The `quality` workflow reports TBT
as a warning (`apps/www/lighthouserc.cjs`; per-route table in the job summary) because it
is too noisy on shared runners to gate. Evidence, 2026-11-08: calibrated local LHCI
runs (benchmarkIndex ~4000, 14.7×) measured TBT ~420–740 ms. Two calibrated CI runs
(5.7× and 7.8×) measured `/features` TBT at 295 and 990 ms best-of-3, and `/` at 377 and
976 ms. Uncalibrated 4× runs read 8–77 ms on a fast Mac and 200–480 ms on GitHub runners,
which is why the problem stayed hidden.

**Lift.** Large; needs a spec. Shrink what hydrates on each page: render blocks and layout
chrome as server components, keep client islands to what is actually interactive (the hero
heading animation, theme toggle, session button, live preview), and check what the Convex
provider and `motion` add to the shared chunk. Mirror into `apps/test` and
`templates/marketing-site`. Measure with fixed-hardware runs (local, calibrated) rather than
single CI runs.

**Blocks.** Nothing.

**Why deferred.** It's a design change across every block and the site layout, separate
from making the gate measure honestly.

---

## Brute-force limiting for `/sign-in/email` on Convex

**What.** A per-IP limit on password sign-in for `apps/www` and the templates.
**Why.** Better Auth's built-in limiter uses `memory` storage, which is per Convex isolate and shares nothing across concurrent executions, so its default `/sign-in/email` rule (3 per 10 s) doesn't hold on Convex.
**Lift.** Small: one more `authRateLimiter` limit name and path in `apps/www/convex/auth/rateLimits.ts`, reusing the proxy-attested IP.
**Blocked by.** Nothing.
**Why deferred.** Only the admin signs in to www, and the launch risk was user-table growth, not credential stuffing.
**Where.** `2026-11-06-launch-infrastructure` decision 5, `sources.md` §6, §14.

---

## Rate limiting the telemetry receiver

**What.** A limit on `POST /telemetry/events`.
**Why.** The receiver has no limiter and no attested IP, so a script can fill its tables.
**Lift.** Small once its deployment is fixed: the same `@convex-dev/rate-limiter` component, keyed globally or per hashed IP.
**Blocked by.** M step 10 (the receiver's final home).
**Why deferred.** Out of the launch-infrastructure spec's scope.
**Where.** `2026-10-26-build-time-telemetry`, `2026-11-06-launch-infrastructure` decision 5.

---

## O(1) `isBootstrapped` / `promoteFirstAdmin`

**What.** Read "an admin exists" from an indexed flag instead of `ctx.db.query(user).collect()`.
**Why.** Both still scan the whole user table; the per-visitor subscription is gone, but every signed-in bootstrap check and promotion attempt pays the scan.
**Lift.** Medium: a schema field or `siteSettings` flag, both apps and both templates, regenerated artifacts.
**Blocked by.** Nothing.
**Why deferred.** After the session-gated `"skip"`, only signed-in users run it.
**Where.** `apps/www/convex/vex/firstUser.ts`, `2026-11-06-launch-infrastructure` decision 7.

---

## PostHog for vexcms.dev

**What.** Product analytics (funnels, replay) beside Vercel Web Analytics.
**Why.** Measures conversions once there are any to measure.
**Lift.** Small to wire; a consent banner unless run cookieless.
**Blocked by.** A hosted product with signup.
**Why deferred.** The conversion that matters today (`create-vexcms`) happens in a terminal and is measured by telemetry and npm downloads.
**Where.** `v0.1.0-launch-plan.md` § P.

---

## Admin "New User" dialog needs an auth-collection-aware create form

**What.** The admin "New User" dialog for the `user` collection (a Better Auth-backed auth collection) asks for `emailVerified`/`createdAt`/`updatedAt`, shows "This field is required" on a filled-in email, and its form overflows the dialog panel.
**Why.** The generic create form was built for ordinary collections; auth collections have framework-owned fields (`emailVerified`, `createdAt`, `updatedAt`) that a human should never set by hand, and the dialog's layout was never checked against the user collection's field count.
**Lift.** Unassessed. Needs a design decision on how an admin should create an auth user at all — whether the dialog hides framework-owned fields, or whether user creation goes through a different flow (e.g. an invite) entirely.
**Blocked by.** Nothing technically; needs the design decision above first.
**Why deferred.** Found during the `2026-11-06-launch-infrastructure` N run-through (2026-11-09); edit already works, so it did not block the run-through's pass/fail on create.
**Where.** `.agent/docs/specs/2026-11-06-launch-infrastructure/n-runthrough.md`, base-nextjs run-through, "Create / edit — `user`".

---

## First "Create" click in the new-page dialog does nothing

**What.** In `marketing-site`'s new-page dialog, the first click on "Create" does nothing; a second click creates the page.
**Why.** Unknown — not diagnosed during the run-through, only reproduced.
**Lift.** Unassessed. Needs a repro + stack trace to find the swallowed first click (a submit-handler race or a disabled/pending state resolving one tick late are both plausible, neither confirmed).
**Blocked by.** Nothing.
**Why deferred.** Found during the `2026-11-06-launch-infrastructure` N run-through (2026-11-09); the second click unblocks a stranger, so it did not fail the run-through, but it is a bad first impression.
**Where.** `.agent/docs/specs/2026-11-06-launch-infrastructure/n-runthrough.md`, marketing-site run-through, "Create / edit / publish — `pages`".

---

## Live preview of a never-published draft page shows "Page not found"

**What.** Opening live preview on a `pages` document that has never been published renders "Page not found" instead of the draft content.
**Why.** The preview route resolves through `getBySlugPreview`, which presumably still requires a published base row to overlay the draft onto; a document with no publish history has none.
**Lift.** Unassessed. Needs the preview read path checked against a draft-only (never-published) document.
**Blocked by.** Nothing.
**Why deferred.** Found during the `2026-11-06-launch-infrastructure` N run-through (2026-11-09); previewing an already-published page's edits works, so it did not fail the run-through's pass/fail on live preview.
**Where.** `.agent/docs/specs/2026-11-06-launch-infrastructure/n-runthrough.md`, marketing-site run-through, "Live preview".

---

## Base scaffold's `images` collection shows raw field names and zeroed dimensions

**What.** In the `base-nextjs` scaffold, the admin's `images` collection list/edit labels show raw field names (`filename`, `mimeType`) instead of human labels, and `width`/`height` stay `0` after upload.
**Why.** The base scaffold's `images` collection config was never given `admin.label`s for its upload-derived fields, and whatever populates `width`/`height` from the uploaded file is not wired for this collection (or the upload path never writes them).
**Lift.** Unassessed. Needs the `images` collection config and its upload handler checked against `apps/test`'s dogfood media collection, which presumably gets this right.
**Blocked by.** Nothing.
**Why deferred.** Found during the `2026-11-06-launch-infrastructure` N run-through (2026-11-09); upload and edit both still functionally pass, so it did not fail the run-through, but it is a bad first impression for a default scaffold.
**Where.** `.agent/docs/specs/2026-11-06-launch-infrastructure/n-runthrough.md`, base-nextjs run-through, "Create / edit — `images`".

---

## Purge scan cost for long-lived users

**What.** `anonymousUsers.ts#purgeExpired`'s `.withIndex("by_creation_time", ...).filter(isAnonymous).take(ANONYMOUS_USER_PURGE_BATCH_SIZE)` bounds the number of *matches* it collects per run, not the number of rows it reads — it walks every older row, including non-anonymous ones the filter discards, until it finds `ANONYMOUS_USER_PURGE_BATCH_SIZE` anonymous matches or runs out of older rows.
**Why.** Once a project accumulates a large population of long-lived, non-anonymous users older than the anonymous-user cutoff, every cron run pays the cost of reading past all of them before reaching (or failing to reach) the batch of anonymous rows it actually deletes — a cost that scales with total user count, not with the anonymous backlog the purge exists to drain.
**Lift.** Unassessed. Needs either a compound index that lets the query filter on `isAnonymous` directly (avoiding the post-fetch `.filter`), or a design that caps rows read per run independent of matches found.
**Blocked by.** Nothing technically; needs the index/approach decided first.
**Why deferred.** Developer decision D5 (`2026-11-06-launch-infrastructure` N run-through, 2026-11-09): the JSDoc's claim was wrong, not the behavior — no project has hit this cost yet — so the fix is correcting the doc now and deferring the scan-cost work itself.
**Where.** `apps/www/convex/auth/anonymousUsers.ts`, `purgeExpired` JSDoc.

---

## Upgrade the Better Auth stack (oidc-provider deprecation)

**What.** Bump `@convex-dev/better-auth` and `better-auth` to versions that drop the deprecated `oidc-provider` dependency path currently surfacing a deprecation warning.
**Why.** The current pinned versions pull in `oidc-provider` in a way upstream has since deprecated; staying on the old versions keeps the warning around and leaves the project on an aging auth dependency chain.
**Lift.** Target `@convex-dev/better-auth@0.13.0` (latest on npm, checked 2026-11-09; repo is on 0.11.5): its `convex()` plugin no longer routes through `oidc-provider`, per `.agent/docs/specs/2026-11-07-pre-launch-dependency-upgrades/spec.md`. After the bump, delete the two warning filters added as stopgaps: `packages/cli/src/lib/loadConfig.ts` (around the config import) and the templates'/apps' `convex/http.ts`. Check the changelog for breaking changes to the auth component API this repo's `convex/auth/*` uses.
**Blocked by.** Nothing technically; needs the version bump scheduled.
**Why deferred.** Developer decision D4 (`2026-11-06-launch-infrastructure` N run-through, 2026-11-09): auth stack upgrade is scoped for after launch, not inside this run-through's fix pass.
**Conflict to resolve (2026-11-09).** D4 conflicts with `2026-11-07-pre-launch-dependency-upgrades` step 3, which does this upgrade before launch: better-auth 1.6.x carries critical GHSA-965c-763c-88jm (fixed only in ≥1.7.7, confirmed again by the Dependabot triage), and `catalogs.peers.better-auth` `<1.7.0` stops `@vexcms/better-auth` consumers from taking the fix. Decide which one stands; see `.agent/docs/research/pre-launch-dependency-review.md` § Dependabot triage.
**Where.** `packages/better-auth`, `apps/www/convex/auth/*`.

---

## Repo transfer: `ianyimi/vex` → the `vexcms` org

**What.** Transfer the repository into the `vexcms` GitHub organisation (claimed, not
transferred into, by step 2 of this spec) so the repo URL matches the `@vexcms` npm scope.

**Why.** Developer decision (Design Decision 19): name protection now, transfer later, so
the move doesn't collide with other in-flight repo changes.

**Lift.** Unassessed beyond the known checklist: 9 `package.json#repository` fields point at
`git+https://github.com/ianyimi/vex.git` today (`packages/{core,react,next,cli,better-auth,
file-storage-convex,richtext-plate,create-vexcms,telemetry}/package.json`) and need the new
org slug; the Vercel git integration for `apps/www`'s deployment needs re-pointing; CI/release
secrets (`.github/workflows/release.yml`'s publish token) need re-checking under the new owner;
every changeset changelog link (`@changesets/cli/changelog`, which writes GitHub compare URLs)
needs the new URL going forward. GitHub redirects the old URL, but these four classes of
reference do not follow a redirect automatically.

**Blocked by.** Nothing technically; the checklist above needs working through deliberately,
not folded into an unrelated spec's commit.

**Why deferred.** A deliberate post-launch move, not a technical blocker: the transfer touches
9 `package.json#repository` fields, the Vercel git integration and release secrets, all of
which need re-pointing together in one pass rather than drifting across whatever else lands
between now and launch. Out of scope for this spec per its own Out of Scope list.

**Where.** `2026-11-06-public-presence/spec.md` Design Decision 19 and Out of Scope.

---

## Inline newsletter form (Buttondown)

**What.** An inline Buttondown subscribe form on `apps/www` and/or the docs footer, instead
of the plain hosted-page link this spec ships (Design Decision 10).

**Why.** An inline form saves visitors a click — no navigating away to a hosted subscribe
page — but needs `form-action https://buttondown.com` added to the CSP (flagged in this
spec's Handoff to quality pass) and a `/privacy` update saying the form posts the address to
Buttondown from the site itself. The hosted-page link this spec ships needs no CSP origin and
no script; `/privacy` carries one line on it, `public-copy.md` § Release emails privacy entry
(Design Decision 9, `sources.md` §2).

**Lift.** Unassessed — a `<form>` POSTing to Buttondown's API, a CSP `form-action` directive
added in whichever spec owns the CSP by then, and an edit to the § Release emails privacy entry.

**Blocked by.** Nothing technically; needs the CSP-owning spec identified first.

**Why deferred.** Launch day is the highest-traffic day this project will see for a while;
the hosted page (free, zero code, mandatory double opt-in) is the lower-risk choice for it.
Explicit Out of Scope item in `2026-11-06-public-presence`.

**Where.** `2026-11-06-public-presence/spec.md` Design Decision 10 and Handoff section.

---

## Stop per-package GitHub Releases (`createGithubReleases: false`)

**What.** Set `createGithubReleases: false` on the `changesets/action` step in
`.github/workflows/release.yml:89-92`, so `changeset version`/publish stops creating one
GitHub Release per package per version (8 releases per tag today).

**Why.** `gh api repos/ianyimi/vex/releases/latest` resolves to `@vexcms/cli@0.0.20` today
because the per-package releases outnumber and outdate any single `vX.Y.Z` release — this
spec works around it by publishing a standalone `v0.1.0` Release marked `--latest` (Design
Decision 24) rather than stopping the per-package releases, so the workaround and the root
cause both exist after this ships.

**Lift.** One line in `.github/workflows/release.yml`'s `with:` block. Needs confirming
nothing downstream (dependabot, a package-specific release-notification subscriber) depends
on the per-package release objects before turning them off.

**Blocked by.** Nothing technically.

**Why deferred.** Explicit Out of Scope item in `2026-11-06-public-presence` — the fix is
small, but changing release automation is a separate, deliberate change from shipping a
stop-gap "Latest" marker.

**Where.** `2026-11-06-public-presence/spec.md` Design Decision 24 and Out of Scope.

---

## Generated sponsors image for the README

**What.** A generated SVG/image showing current Sponsors avatars in the README (sponsorkit-
style), instead of (or alongside) the static $50/$250 name listing this spec ships (Design
Decision 8).

**Why.** Vite and tRPC both run a generated sponsors image in CI (refreshed on a schedule),
which keeps the README current without a manual edit per new sponsor; this spec's static
listing needs a hand edit each time a $50+ tier sponsor joins.

**Lift.** Unassessed — a GitHub Action that queries the Sponsors API (or runs a tool like
`sponsorkit`) and commits/caches a generated SVG, plus wiring it into the README.

**Blocked by.** Nothing technically.

**Why deferred.** Not part of the interview; the static listing is enough at zero sponsors.
Revisit once there are sponsors to show.

**Where.** `2026-11-06-public-presence/spec.md` Design Decision 8.

---

## Admin UI for creating users (Better Auth `createUser`)

**What.** A dedicated "Create user" affordance in the admin panel for the auth user
collection, backed by Better Auth's admin plugin `createUser` API instead of the generic
`ListViewCreateDocumentForm` every other collection uses.

**Why.** The generic create form persists whatever fields the merged `user` collection
has, with no hashed password and no verified session — a document created that way has no
working login. `createUser` hashes the password and wires up everything `/sign-up/email`
would, but there is no UI for it today; an admin who needs to create a user must call
Better Auth's API directly (server-side `auth.api.createUser` or client-side
`authClient.admin.createUser`).

**Lift.** Unassessed. Needs a collection-specific create form (distinct from the generic
field-driven one), a server action/endpoint that calls `createUser` instead of the normal
`create()` mutation, and a decision about which `authSchema`-declared `additionalFields`
(e.g. `roles`) the form exposes.

**Blocked by.** Nothing technically — `disableCreate`'s escape hatch
(`disableCreate: false` on a project's own `users.ts`) already proves the generic form can
be re-enabled on this collection; this is about replacing it with a form that produces a
working login, not about unblocking the button.

**Why deferred.** Not part of this change — out of scope for the `disableCreate`
top-level-flag/merge-generalization fix. The escape hatch plus "use Better Auth's admin
plugin" is the documented workaround (see the auth guide's "Creating users as an admin").

**Where.** `apps/docs/src/content/docs/guides/auth.mdx`, "Creating users as an admin".

---

## Admin delete on auth collections leaves sessions/accounts behind

**What.** Deleting a `user` document through the admin panel's standard delete action
(`ListViewRowDeleteAction`/`ListViewBulkDeleteAction`) removes only that document — it does
not cascade to the user's `session`, `account`, or other Better Auth rows that reference it.

**Why.** The auth collections the adapter produces are relational in a way ordinary
collections are not: a `session`/`account` row with no matching `user` is an orphan Better
Auth itself never produces (it always deletes them together), so an admin-panel delete can
put the database in a state Better Auth's own code never has to handle. The orphaned rows
are inert (no live session can authenticate against a user document that no longer exists)
but persist indefinitely, and a slug reused by a later sign-up could collide with stale
data depending on how IDs are generated.

**Lift.** Unassessed. Needs either a cascade delete wired into the auth adapter interface
(so every adapter can declare which other collections to clean up on a user delete) or a
narrower fix scoped to Better Auth's own `user`/`session`/`account`/`verification` shape.

**Blocked by.** Nothing technically — the generic delete action has no concept of
cross-collection cascade today; this would be the first consumer of one.

**Why deferred.** Found while documenting `disableCreate`'s merge behavior for the auth
guide; not part of that change's scope. No report of this causing a real problem yet —
orphaned rows are inert, not actively harmful, until something depends on a `session`
always having a `user`.

**Where.** No existing detail doc; found during the 2026-11-08 `disableCreate` top-level
merge session.


## Docs guide: server-resolved icons (`resolveIconNodes` + `IconNodeProvider`)

**What.** A docs guide showing how a public page renders `<Icon name="…">` with only the
icons it uses, from the server HTML and with no flash:
1. A server component collects the icon names the page renders.
2. It calls `resolveIconNodes({ names })` from `@vexcms/react/server`.
3. It wraps the page in `IconNodeProvider` from `@vexcms/react`.
4. `Icon` inside the provider paints synchronously.

The guide should also cover:
- Nested providers merge, and the inner one wins on a shared name.
- An icon whose name wasn't collected falls back to on-demand loading and flashes until it
  arrives.
- Collecting names is the app's job: the example `collectIconNames` only finds string
  properties named `icon`.
- The admin is different: `AdminLayout` ships lucide's full set via the internal
  `IconComponentsProvider`, so admin icons never flash.

**Why.** Today these APIs appear only in the generated API reference. The only worked
examples are `apps/www/src/lib/iconNodes.ts` (used by the site `layout.tsx` and
`PageContent.tsx`) and the marketing-site template's copy. Users can't discover the
pattern from the guides.

**Lift.** Small: one guide page, adapted from the www example.

**When.** With launch-plan item 17's step L (final review), as part of updating all docs.
Developer request, 2026-11-09.

**Where.** Explained in the 2026-11-09 LI session after the admin icon revert (changeset
`admin-static-icons`).

## Admin error boundary unreachable while Convex is down

**What.** `apps/www/src/app/(vexcms)/admin/error.tsx` (retry + "View the tour") never renders
during a Convex outage: `AdminLayout`'s auth promise rejects ("fetch failed") in the layout, which
sits above that boundary, so Next shows its global error page instead.

**Impact.** Low: in an outage the admin page redirects to `/tour` before rendering, so visitors
never hit it. Only a render error that coincides with an outage reaches the global page.

**Lift.** Catch the rejected auth promise in the sidebar (render the skeleton or a sign-in
prompt), or move a boundary above the layout. Found in the LI-22 D7 run (2026-11-09).
