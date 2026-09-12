# Edit-view presence ("who else is viewing this document")

**Date:** 2026-09-12 · **Status:** researched, deferred to backlog (post-0.1.0)
**Decision (2026-09-12):** presence facepile + full collaborative editing does
**not** ship as part of the pre-0.1.0 conflict-resolution work. It is added to
`backlog.md` as its own future entry — see "Presence, live cursors, and
per-field collaborative indicators" below this entry. The pre-0.1.0 scope for
"Concurrent-edit conflict-resolution UX" stays exactly as originally written:
per-field conflict affordance + review banner + CAS guard, no presence
component, no new installs.
**Backlog entries:** `.agent/docs/product/backlog.md` → "Concurrent-edit
conflict-resolution UX" (pre-0.1.0, unaffected by this doc) and "Presence,
live cursors, and per-field collaborative indicators" (post-0.1.0, this doc).

## Question

Show, on **edit views only** (not list views), an avatar stack of the other
users currently viewing this document — max 5 faces, click to open a
`nuqs`-driven modal listing everyone present.

1. Does Convex expose an API for "who is subscribed to this query/document"?
2. Is there a `convex-helpers` for it?
3. Or must we write our own table of view metadata?

## Answer

1. **No.** Convex has no public API — client or server — that enumerates the
   subscribers of a query or the readers of a document. Subscriptions are an
   internal implementation detail of the sync protocol; nothing in `convex@1.44.0`
   surfaces connected-client identity. Presence must be **explicitly published**
   by the client.
2. **Not in `convex-helpers`.** `convex-helpers/convex/presence.ts` exists but is
   the *demo* backing the 2023 Stack article "Implementing Presence with Convex" —
   a naive heartbeat table, not a shipped helper export. The supported successor is
   the **first-party Convex component `@convex-dev/presence`** (v0.4.0,
   `github.com/get-convex/presence`), peer `convex ^1.36.1` → compatible with our
   pinned 1.44.0.
3. **A custom table is the wrong build.** The component already solves the two
   hard parts (see below). Use it; do not hand-roll.

Industry standard for this UI is the **facepile / avatar stack + overflow
counter** (Google Docs, Figma, Notion, Linear): N max faces, `+X` overflow chip,
click → full list. The component even ships a reference `FacePile`, but we style
our own — theirs is unstyled-by-our-standards and imports its own CSS file.

## Why the component instead of our own presence table

Naive presence = a `presence` table with a `lastSeen` timestamp, a client
heartbeat every ~10s, and a query filtering `lastSeen > now - timeout`. Two
things break:

- **Every heartbeat invalidates every subscriber's query.** A row write per user
  per 10s re-runs the room query for all viewers, even though the *visible* state
  (who is here) did not change. `@convex-dev/presence` splits the write path from
  the read path: `list` is keyed by an opaque `roomToken`, so heartbeats do not
  dirty it and all viewers of a room **share one query cache entry**.
- **Timeouts need a scheduler, and the naive one is O(heartbeats).** The
  component runs a single deployment-wide `@convex-dev/batch-worker` loop that
  sleeps until the next session deadline, so a user going offline is a real
  event, not something each client polls for. Disconnect is also *graceful*:
  the hook fires `navigator.sendBeacon(`${convexUrl}/api/mutation`, …)` on
  unload plus a `visibilitychange` handler, so closing a tab removes the face
  immediately instead of after a 25s timeout.

Component tables (`presence`, `sessions`, `roomTokens`, `sessionTokens`) live in
the component's **own isolated schema** — they do **not** enter
`convex/vex.schema.ts` and therefore need **zero changes to the schema
generator** (`packages/core/src/schema/generateVexSchema.ts`,
`packages/cli/src/lib/generateSchema.ts`).

## API surface (verified against the published package types)

`@convex-dev/presence@0.4.0`, `dist/client/index.d.ts`:

```ts
class Presence<RoomId extends string, UserId extends string> {
  heartbeat(ctx, roomId, userId, sessionId, interval)
    : Promise<{ roomToken: string; sessionToken: string }>;
  list(ctx, roomToken, limit?)
    : Promise<Array<{ userId; online: boolean; lastDisconnected: number; data?: unknown }>>;
  updateRoomUser(ctx, roomId, userId, data?): Promise<null>;
  disconnect(ctx, sessionToken): Promise<null>;
  listRoom(ctx, roomId, onlineOnly?, limit?);   // no auth of its own
  listUser(ctx, userId, onlineOnly?, limit?);   // "is this user online anywhere"
  removeRoomUser(ctx, roomId, userId);
  removeRoom(ctx, roomId);
}
```

Client (`@convex-dev/presence/react`):

```ts
usePresence(presenceApi, roomId, userId, interval = 10_000, convexUrl?)
  : PresenceState[] | undefined
// PresenceState = { userId; online; lastDisconnected; data?; name?; image? }
```

The hook owns the session id, the heartbeat interval, visibility pausing and the
unload beacon. We only supply `roomId` + `userId` and render the array.

### The one real gotcha: `list` returns `userId`, not a user

`PresenceState` declares optional `name`/`image`, but the **component never
populates them** — they are there for the caller to fill. Two options:

- **Join in our `list` wrapper** (read each user doc). Rejected: the component's
  own docstring warns *"Avoid adding per-user reads so all subscriptions can
  share same cache"* — a per-user read makes the query cache per-caller and
  undoes the main efficiency win.
- **Publish name + image as `data`** on the presence row, once, via
  `updateRoomUser` (or inside our authenticated `heartbeat` wrapper). The data
  is already in hand: `useVexAuth()` → `{ user: { name?, email?, image? } }`
  (`packages/react/src/context/VexAuthContext.tsx:1-35`, shape at
  `packages/react/src/components/AdminLayout.tsx:24-37`). **Take this one.**

## Ship as an opt-in package, not a core dependency

Confirmed against the two adapters vexcms already ships this way —
`@vexcms/file-storage-convex` and `@vexcms/better-auth`:

- Core never imports either package. It only knows a **structural interface**
  (`VexStorageAdapter` — `packages/core/src/media/types.ts:113-127`;
  `VexAuthAdapter` — `packages/core/src/auth/types.ts:59-87`) and routes on
  `adapter.name`/duck typing, not on the package existing.
- Wiring is **100% manual, in app code**: the app imports the factory
  (`convexFileStorage(...)`, `betterAuthAdapter(...)`), passes the instance
  into `vex.config.ts` (`storage.adapters`), and separately re-exports the
  package's own Convex functions into its own `convex/` tree by hand
  (`apps/test/convex/auth/db.ts:1-21` imports `authDbApi` and calls it
  directly — no generation step).
- The CLI (`packages/cli`, `generateSchema.ts`) **never writes into
  `convex.config.ts`**; it only emits `vex.schema.ts`. `app.use(...)` calls are
  hand-authored today (currently empty in every app —
  `apps/test/convex/convex.config.ts`, `apps/www/convex/convex.config.ts`,
  `packages/create-vexcms/templates/base-nextjs/convex/convex.config.ts`).

Presence fits this precedent but is a **new kind of adapter**: the other two
are plain factory objects; `@convex-dev/presence` is an actual Convex
*component*, requiring `app.use(presence)` — a mechanism nothing in this repo
uses yet. There is no `VexComponentAdapter` interface to conform to, and
building one for a single component would be speculative generality. Concretely,
opt-in means:

| Layer | Change |
| --- | --- |
| `@vexcms/core` | **none.** No presence-aware code, no schema changes, no `vexConvexApi` entries. |
| App installs `@convex-dev/presence` | app's own `package.json` |
| App `convex/convex.config.ts` | app hand-adds `app.use(presence)` |
| App `convex/presence.ts` | app hand-writes `heartbeat`/`list`/`disconnect` wrappers per the component's own README pattern, with its own auth check (mirrors `apps/test/convex/vex.ts:9-20`'s `collectionsApi` shape but is not a core export) |
| `@vexcms/react` | a **documented pattern**, not a shipped hook — `useDocumentPresence`/`<ViewerFacePile>`/`<ViewersModal>` ship as copy-paste guide content (docs site) or, if reused across our own apps, as a *separate* opt-in package (e.g. `@vexcms/presence-react`) that itself only activates when the app supplies its presence API reference. Either way, `@vexcms/react` core exports stay untouched. |
| `create-vexcms` templates | at most one template variant preconfigures it; see below |

`create-vexcms` today has exactly **two fixed templates**
(`base-nextjs`, `marketing-site`; `packages/create-vexcms/src/index.ts:1-50`),
no variant/flag system beyond `--bare`. "Different preconfigured setups" (one
template with presence wired, one without) is a real, separable feature —
either a third template or a prompt-driven flag that conditionally copies the
presence files — not something this research assumes exists; flag as its own
backlog/roadmap line when you're ready to design it.

## Full collaborative editing: live cursors + per-field "someone is editing this"

Split into two independently-costed pieces — they are not the same problem.

### Per-field active-editor border/badge — buildable today, moderate cost

Mechanically identical to the facepile: publish `{ activeField: string }` as
the presence row's `data` via `updateRoomUser` on field focus/blur, and every
other viewer's `list()` subscription already carries it. Signed-in only is free
— `userId` in `heartbeat` comes from `useVexAuth()`, so an anonymous caller
never has an identity to publish under.

The real cost is not presence, it's the **field-input layer**: there is no
shared field wrapper to inject a border into once. Every field type
independently assembles its own chrome via `createFieldInput`
(`packages/react/src/components/form/createFieldInput.tsx:121-180`) — text
(`fields/text/Input.tsx:35-49`), select (`fields/select/Input.tsx:34-53`), and
every other field type render `FormLabel`/input/`FormDescription`/`FormError`
independently. A collaborative border touches **every field-input component**
(~10+) unless a shared wrapper is introduced first as a prerequisite refactor
— which is itself a legitimate, separately-schedulable piece of work.

### Live cursors — one part is easy, one part is real work, neither is a dead end

- **Pointer position over the form canvas** (a Figma-style colored cursor with
  a name tag following someone's mouse around the page): buildable today with
  the same presence `data` payload (`{x, y}` or field-relative coordinates,
  throttled `mousemove`). Moderate cost, no new infra.
- **Live cursor position inside a rich-text field's content** (character-level,
  Google-Docs-style): **correction from this doc's first pass — this is
  buildable**, but not via `prosemirror-sync`'s approach and not without new
  work. Verified from the published packages:
  - **Plate already ships full Yjs + cursor support**: `@platejs/yjs`
    (peer `platejs >=53.0.0`) wraps `@slate-yjs/core`'s `withYjs`/`withCursors`.
    Cursors ride Yjs's standard `Awareness` protocol
    (`y-protocols/awareness`) — `CursorEditor.sendCursorPosition`/
    `sendCursorData`, remote state via `CursorEditor.cursorStates` — the exact
    mechanism every Yjs-based editor uses for live cursors. This is a real,
    current (`54.0.0-beta.0` latest) Plate-official plugin, not a
    community fork.
  - **The transport is pluggable by design.** `@platejs/yjs` ships Hocuspocus/
    WebRTC/IndexedDB providers out of the box, but its own types export
    `registerProviderType(type, providerClass)` and a `UnifiedProvider`
    interface (`{ awareness, document: Y.Doc, connect/disconnect/destroy,
    isConnected, isSynced }`). A **Convex-backed provider implementing that
    interface is a legitimate, scoped, missing piece** — not a request to
    reinvent Slate's operational-transform algorithm from scratch (that would
    be the wrong comparison; Yjs's CRDT merge logic already exists inside
    `yjs`/`@slate-yjs/core`, we would only be writing the sync transport).
  - **Convex has no first-party Yjs product** (confirmed: what search surfaces —
    `pyrocat101/convex-yjs`, `trestleinc/replicate` — are third-party
    community projects, not `@convex-dev/*`). `@convex-dev/prosemirror-sync`'s
    own README says so explicitly in "Missing features": *"Syncing Yjs
    documents instead of ProseMirror steps. That would be done by a different
    Yjs-specific component,"* and *"Syncing presence \[…] is another thing a
    Yjs-oriented ProseMirror component could tackle."* Nobody has shipped that
    component yet, for any editor — building it for Plate would be filling a
    real gap, not working around a solved problem.
  - **Two independent channels, two different costs:**
    1. **Content CRDT sync** — persist and fan out the Y.Doc's binary update
       stream through Convex (a mutation to append an update + a query/
       subscription to stream them, periodically compacted into a snapshot so
       new clients don't replay full history — the same shape
       `prosemirror-sync` uses for its steps/snapshot debounce, just carrying
       Yjs binary deltas instead of ProseMirror steps). This is the
       distributed-systems-shaped part: update batching, snapshot compaction,
       catching up a reconnecting client, garbage-collecting old updates.
    2. **Cursor/awareness sync** — Yjs `Awareness` state is small and
       ephemeral (no durability requirement, matches presence's shape
       exactly). This can plausibly **reuse the presence component itself**:
       broadcast each user's `Awareness` update through `updateRoomUser`'s
       `data` field instead of building a second ephemeral channel.
  - **Sequencing blocker, unchanged:** none of this matters until the richtext
    field ships — it's still commented out in
    `packages/core/src/fields/constants.ts:85-89`.

**Revised recommendation for the backlog entry:** field-border indicators and
page-level cursor overlays ride the presence component directly. In-editor
collaborative text cursors need (a) the richtext field shipped, and (b) a
**new, hand-built Convex Yjs-sync provider** (content channel) potentially
paired with presence (awareness/cursor channel) — real, non-trivial component
work with no official reference to lean on (prosemirror-sync is architecturally
adjacent but OT-based, not a template to copy), but not the CRDT-research
project this doc originally implied. Track it as its own component build.

### Making it automatic: wiring `@platejs/yjs` into `plateEditor()` itself

The plugin's own API is fully scriptable — nothing about it requires the app
author to hand-configure Yjs per field:

```tsx
YjsPlugin.configure({
  render: { afterEditable: RemoteCursorOverlay },   // shipped shadcn-style component, copy-paste like our other ui/ primitives
  options: {
    cursors: { data: { name, image } },             // from useVexAuth(), same source as the presence facepile
    providers: [{ type: "convex", options: { roomId, convexUrl } }], // our custom UnifiedProvider, registered via registerProviderType("convex", ConvexYjsProvider)
  },
});
// editor created with skipInitialization: true
editor.getApi(YjsPlugin).yjs.init({ id: roomId, value: initialValue }); // on mount
editor.getApi(YjsPlugin).yjs.destroy();                                 // on unmount
```

That means the collab wiring can live entirely inside
`packages/richtext-plate/src/editor/plateEditor.ts`'s factory — e.g.
`plateEditor({ collab: true })` — so an app gets it by flipping one field
option, matching the "opt-in, automatic once enabled" ask. Concretely:

- **Room id must be per-field, not per-document.** Unlike presence (one room
  per document), each richtext field has its own `Y.Doc`. Use
  `"<collectionSlug>:<documentId>:<fieldKey>"`.
- **User identity for cursors is cosmetic only** — `cursors.data` is
  client-asserted display info (name/image from `useVexAuth()`), not an auth
  boundary. The real identity check happens server-side in the Convex
  provider's mutations via `ctx.auth.getUserIdentity()`, same as every other
  authenticated Convex function in this codebase.

### Session boundary: field focus/blur, not fullscreen — revised from the first pass

**Correction from this doc's earlier design**, which gated the whole Yjs
session to a fullscreen modal's open/close. Gating on the field's own
`focus`/`blur` instead is strictly better, for reasons that also rule out
hover (below) without hover's problems:

- **Matches actual edit intent.** Clicking into the field *is* "I am now
  editing this," the same signal the per-field active-editor indicator
  (above) already keys off. No separate "did they also open fullscreen"
  branch to reconcile against that indicator — they're the same event.
- **Works across every input modality.** `focus` fires for mouse click, tab
  key navigation, and touch tap alike. Hover-based triggers do not (see
  below).
- **Fires once, not per-pixel.** Unlike `mouseenter`/`mouseleave`, `focus`/
  `blur` do not churn — no debounce needed to filter noise.
- **Fullscreen becomes an orthogonal view-mode, not a connection gate.**
  Fullscreen is still worth keeping — more screen real estate for a long
  document — but it now just opens a bigger viewport onto the *same* live
  session that inline focus already started. Opening fullscreen re-focuses
  the field (no new connect); closing fullscreen returns to the inline view
  without disconnecting as long as the field is still focused.

**Value/onChange reconciliation no longer needs to be blur-gated at all**,
given the ambient tier below — it can just be "update on every Yjs
observer event, local or remote," which is simpler than gating to a
lifecycle edge. `PlateEditorField` is a plain controlled `value`/`onChange`
field today (confirmed: standard prop wiring from `createFieldInput`/
`AppFormContext`, no existing hook for an external source of truth); once
collab is on, treat the Yjs-bound content as authoritative and mirror it
into `field.handleChange(newValue)` on every shared-type change, not just at
blur.

**This changes the surrounding form's contract for a collab-enabled field,
and needs explicit sign-off, not just implementation:** while connected, the
field's committed Yjs updates are already persisted to Convex continuously —
that is the entire point of a shared CRDT, other collaborators are reading
that same persisted stream in real time. The field is therefore
**effectively autosaved** the moment collab is enabled on it; it stops being
"pending until the document's Save button is clicked" the way every other
field in the form still is. Two consequences worth deciding up front, not
discovering late:
- The per-field conflict affordance (this backlog's sibling entry,
  "Concurrent-edit conflict-resolution UX") **does not apply** to a
  collab-enabled field — there is no local-draft-vs-live-value fork to
  present, because Yjs already merges concurrent edits continuously. The
  conflict UI's detection predicate should simply skip fields with
  `collab: true`.
- The document's Save button, for a collab field, is submitting a value
  that (if the field was ever open) is already live on the server. That's
  harmless — the submit is idempotent — but worth stating so it isn't
  mistaken for a bug (clicking Save "does nothing" for that field is
  expected, not broken).

### Three connection tiers — this is what makes ambient, whole-document cursor visibility possible

Asked: can another user's cursor and live edits show up **even when the
field isn't fullscreen, and even for a viewer who never focused or hovered
that field themselves** — i.e., does watching someone type inline "just
work" for anyone who has the document open?

**Not automatically from `@platejs/yjs` alone** — a client only renders
remote cursors/content for a room it is itself connected to; a viewer whose
own field instance never connected sees only the last-synced static value.
Getting ambient, whole-screen visibility is a design choice on our side, not
a library default, but it composes cleanly out of what's already specified
by splitting "connected" into three independent tiers instead of one
focus-gated on/off:

1. **Ambient (read + awareness, no local write authority).** Established the
   moment a collab-enabled field is mounted in the current edit view — for
   *any* viewer who has the document open, not just the person typing.
   Cheap: it's a passive Convex subscription plus rendering incoming
   `Awareness` state, the same shape as the presence facepile's own `list`
   subscription. This tier alone is what makes "see someone else's cursor
   and live edits inline, without fullscreen, without focusing" work for
   every other viewer — it is the direct answer to the question asked here.
2. **Hover (prefetch, local-only, unchanged from the prior design).** For
   *this* viewer's own eventual authoring, debounced hover (~150–300ms)
   remains worth keeping as a signal to warm anything specific to becoming
   a writer — heavier toolbar/plugin assets, connection priority — layered
   on top of tier 1, not competing with it. Still unsuitable as the *write*
   trigger for the same five reasons as before (churn, async-destroy races,
   remote-cursor flicker, excludes non-pointer input, cost scales with
   mouse movement, not intent).
3. **Authoring (write authority + local cursor broadcast).** Gated on
   `focus`, exactly as designed above — flips the local Plate editor's
   `readOnly` off and starts sending this user's own cursor position via
   `CursorEditor.sendCursorPosition`. `blur` flips `readOnly` back on but
   does **not** tear down the tier-1 connection — the field keeps rendering
   everyone else's live edits ambiently, it just stops accepting local
   input and stops broadcasting the local user's cursor.

**Cost, addressed directly:** tier 1 means every collab-enabled field on an
open document carries a live subscription for every concurrent viewer of
that document — bounded by (fields × concurrent viewers of *that one
document*), not by mouse movement or page count. That is the same cost
category as the document's own live `vexConvexApi.get` subscription every
edit view already holds today, not a new class of scaling risk.

### Follow mode — possible, and it composes for free from what's already planned

Asked: could a user click another viewer's avatar (from the facepile/viewers
modal) and have their own view automatically track wherever that user is
editing — entering and leaving fields as the followed user does, Figma-style?

**Yes, and it needs no new server-side infrastructure beyond what this doc
already specifies.** The two primitives it composes are both already
designed above:

1. **Document-level presence's `activeField` data** (the per-field
   active-editor indicator) already tells every subscriber, in real time,
   which field each other user currently has focused.
2. **The per-field connect/disconnect lifecycle is already a plain
   programmatic API** (`editor.api.yjs.connect()`/`disconnect()`, or our own
   thin wrapper around it) — nothing about it requires the trigger to be a
   local DOM event. A remote presence update is just as valid a caller.

A `useFollowUser(targetUserId)` hook is the shape of the actual work:
subscribe to the target's presence stream; on every `activeField` change,
scroll that field into view. **Simpler than the first draft of this
section** now that tier 1 (ambient read + awareness) connects every
collab-enabled field the moment the document is open: follow doesn't need
to manage connect/disconnect of the room itself at all — the follower is
already ambiently connected to every field on the document regardless of
who they're following. "Following" reduces to *where to point the
follower's viewport*, not *what to connect to*. Real design decisions this
still surfaces, scoped as their own increment, not free:

- **Scroll-position mirroring, asked directly: yes, exact-position following
  is buildable, not just "jump to the field."** `PlateEditorField` renders
  its content inside its own bounded, independently-scrollable
  `EditorContainer` (`max-height: 500px`, confirmed in the field's current
  implementation) — the natural, bounded scope for mirroring is that
  container's internal scroll position, not the whole page's scroll (page-
  level position only needs the one-time "scroll this field into view" jump
  when the followed user switches fields, already covered above). Broadcast
  the followed user's scroll position as part of the same per-field
  `Awareness` payload already carrying their cursor — throttled (e.g. one
  update per animation frame or ~100ms, matching how cursor-position updates
  are already throttled in every Yjs editor), as a **normalized** value
  (fraction of `scrollHeight`, or the id of the topmost visible Slate node)
  rather than a raw pixel `scrollTop` — normalized so it maps correctly
  regardless of the follower's window size, zoom level, or font rendering
  differences, none of which raw pixels account for. The follower's client
  applies it to their own `EditorContainer.scrollTop` on receipt. This rides
  the same channel and same throttling discipline as the cursor broadcast —
  no new transport, just a second field in the same awareness payload.
- **Spectate vs. take over.** Entering a field via follow should default to
  a read-only "watch" state (see their cursor and live content, do not steal
  local form focus or let an accidental keystroke start co-editing) —
  matching Figma's follow, not Google Docs' cursor list. Promoting to actual
  co-editing should be a second, deliberate action (click into the field
  yourself, which is tier 3 above and independent of the follow relationship).
- **Breaking follow.** Any local scroll/click away from the mirrored
  position should end follow mode, same convention as Figma — otherwise the
  user loses control of their own viewport.
- **Affordance.** A "Follow" action on each avatar in the viewer facepile/
  modal (`ViewersModal` from the presence design above), plus a persistent
  "Following <name> — Stop" indicator while active.

This is client-side orchestration logic on top of already-planned
primitives — no new Convex tables, no new component, no schema changes.
Scope it as a distinct increment within the same backlog entry: it is
genuinely optional on top of presence + per-field collab, not a prerequisite
for either.

### Two blockers to building this today (verified, not from the plan)

1. **Plate is pinned below the required peer.** `@platejs/yjs` requires
   `platejs >=53.0.0`. The workspace catalog pins `platejs: 52.3.21` and every
   `@platejs/*` package to the 52.x line (`pnpm-workspace.yaml`). Adopting
   `@platejs/yjs` means bumping Plate across `richtext-plate` and re-verifying
   every existing plugin (`@platejs/basic-nodes`, `code-block`, `link`, `list`,
   `media`, `table`) against 53/54 — a real upgrade, not a side effect of
   adding one package.
2. **The richtext field isn't wired into `@vexcms/core` at all yet**, not just
   "commented out" as a field type. `richtext-plate`'s `plateEditor()` factory
   imports `VexEditorAdapter`/`VexEditorComponentProps` from `@vexcms/core`,
   but neither type exists there — `packages/core/src/types/editor.ts`
   (per a legacy spec) was never written. `plateEditor()` has zero call sites
   in any app's `vex.config.ts`. Collab is a layer on top of a field that, as
   shipped today, an app cannot actually register.

**Sequencing, updated:** (1) finish the core richtext-field integration
(`VexEditorAdapter`/`VexEditorComponentProps`, a call site in at least one
app) — pre-existing, unrelated-to-collab work; (2) bump Plate to 53+ across
`richtext-plate`; (3) build the Convex `UnifiedProvider` (content channel,
the real component work described above); (4) wire `collab: true` into
`plateEditor()` per this section, gated to field focus/blur. None of this
blocks shipping the plain richtext field or the presence facepile, which have
no dependency on Plate 53 or the Yjs provider.

## Anonymous users — the plumbing already exists, but not for this

`defineAccess({ anonRole })` is not hypothetical: it is shipped and wired
today in `apps/www`.

- `defineAccess`'s `anonRole` fills in whenever a caller's resolved roles are
  empty (`packages/core/src/access/hasPermission.ts:33-34,234-236`).
- `@vexcms/better-auth` ships `anonRoleDatabaseHook(role)`
  (`packages/better-auth/src/convex/anonRole.ts:38-52`), which stamps that role
  onto every user Better Auth's `anonymous()` plugin creates — otherwise an
  anon-plugin user gets the same default role as a real signup and the
  empty-roles fallback never fires.
- `apps/www` wires all of it: `anonymous()` plugin registered
  (`apps/www/convex/auth/plugins/index.ts:23`), the hook applied
  (`apps/www/convex/auth/options.ts:25`), and `anonRole: USER_ROLES.user` set
  in `apps/www/src/auth/access.ts:16,25`.

**The nuance:** today this exists to gate a **read-only admin-panel demo**, not
to make every marketing-site visitor anonymous by default. `AdminDemoButton`
calls `signIn.anonymous()` **on click**
(`apps/www/src/components/AdminDemoButton.tsx:70-73`) specifically so an
unauthenticated visitor can preview `/admin` without a real account;
`LogoutButton.tsx:42-45` documents the same plugin issuing that session.
Nothing today calls `signIn.anonymous()` unprompted on page load.

So: the backend half (anon role, hook, access rules) is already proven in this
exact codebase — reusing it for "every `www` visitor is anonymous unless they
sign in" is a small, well-understood addition (auto-call `signIn.anonymous()`
on mount if no session exists), not new architecture. It is still correctly
scoped as future work: nothing forces it now, and it should land together with
the presence/collab backlog entry it's meant to feed, since anonymous
*editors* only matter once presence is extended past admin auth.
