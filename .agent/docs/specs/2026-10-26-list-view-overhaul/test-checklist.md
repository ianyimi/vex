# List-view overhaul — manual test checklist

Covers everything shipped by this spec, `2026-10-28-committs-field`, and every polish round
(Polish Decisions 52–78). Run against a live dev deployment: `apps/test` on `:3020`, `apps/www`
on `:3030`. "Signed in" means an authenticated session with the role named; "anonymous" means
no session at all (tests `anonRole` — `guest` on `apps/test`).

**Keyboard shortcuts are deferred** — the core set (`/`, `Esc`, arrows, `Enter`, `Space`, `X`,
`Shift+X`) shipped with Step 9 and isn't re-tested item-by-item here; nothing new landed for
them this round.

## List basics

- [ ] `localhost:3020/admin/collections/posts`, hard reload — table renders fully server-side (view, raw HTML fetch, zero client JS). Signed in, admin.
- [ ] Same reload, compare settled vs. first-paint `getBoundingClientRect()` on title/tabs/toolbar/table/footer — zero shift. Signed in, admin.
- [ ] Columns menu → toggle Comfortable/Compact density — row height changes immediately, persists across reload (cookie). Signed in, admin.
- [ ] Change page size in the footer selector — reflects in `?size=`, persists per view. Signed in, admin.
- [ ] Load More — appends rows, keeps scroll position, no flash. Signed in, admin.
- [ ] `localhost:3020/admin/collections/testimonials` — footer shows the exact total ("Showing 100 of 200"). The `countLimit: 50` demo cap was removed (developer, 2026-11-02); the large-collection cap redesign is in `backlog.md` § "Total-count cap for large collections". Signed in, admin.

## Search

- [ ] `localhost:3020/admin/collections/posts`, type in the search box — previous rows stay visible (dimmed) while the debounced search resolves; no skeleton or empty-state flash mid-type. Signed in, admin.
- [ ] Same search — an in-input spinner shows while settling, clears once results land. Signed in, admin.
- [ ] Search field picker (multi-field collection) — switching the target field re-runs the search against the new field, URL's `?qf=` updates. Signed in, admin.
- [ ] Resize the browser below the toolbar's collapse breakpoint — search input never collapses into the ⋯ overflow menu (only Copy link/Columns/rows-per-load do). Signed in, admin.

## Sort

- [ ] `testimonials`'s default view — sorted by `updatedAt` desc on first paint (the auto-injected `commitTs()` field) — confirm via row order, no client-side re-sort after hydration. Signed in, admin.
- [ ] Click the "Updated At" column header on a sortable field — toggles asc/desc/unsorted; inspect `aria-sort` on the `<th>` at each state (`"ascending"`/`"descending"`/`"none"`, attribute absent entirely on a non-sortable column). Signed in, admin.
- [ ] Sort by `testimonials`'s `source` field (indexed, `enableSorting: true`) — confirm via Convex dashboard/network tab that the query uses the `by_source` index, not a full scan (index pushdown). Signed in, admin.
- [ ] Hard-reload `?sort=title.asc` on `posts` (`title` has no declared index) — `ListViewQueryError`'s "Can't sort by Title yet" message + a working "Remove sort" button, server-rendered (raw `fetch`, zero JS, confirms it on first paint, not a client-side correction). Signed in, admin.

## Filter builder + chips

- [ ] Open the filter popover with no active filter — one empty row pre-seeded, no "Add filter" click needed; the row stays incomplete (URL unchanged) until filled. Signed in, admin.
- [ ] Add a second row within a group ("+ AND condition") and a second group ("+ OR conditions") — confirm the renamed labels (not "Add condition"/"Add OR group"). Signed in, admin.
- [ ] Per-field value inputs: a `relationship`/`upload` field opens the real picker and shows the picked document's title (not raw id) in both the row and the resulting chip. Signed in, admin.
- [ ] `json`/`array`/`blocks`/`group`/`richtext` fields in the filter builder offer only `isEmpty`/`isNotEmpty` — no value input, no `eq`/`neq`. Signed in, admin.
- [ ] Every stale-field notice (sort/search/filter) shows the field's display LABEL, not its raw key (e.g. "Internal Score", not `internalScore`). Signed in, with a role denied that field.
- [ ] Narrow the toolbar to ~1100–1568px with an active filter — chips wrap using the toolbar's full width (not a narrow column under the Filter button), vertically centered with the eye toggle/"Clear all". Signed in, admin.
- [ ] Hard-reload a `?filter=` URL naming a relationship/upload id — correct resolved title shows on first paint (no id-then-title flash). Signed in, admin.

## Columns

- [ ] Hard-reload `testimonials`'s default view (`cols=` unset) — `customerName` pinned left, exact widths from config, in the declared order, on first paint. Signed in, admin.
- [ ] Drag-reorder a column via the Columns menu — order persists in `?cols=` and across reload. Signed in, admin.
- [ ] Hide a column via its checkbox — disappears from the table, `?cols=` reflects `:h`. Signed in, admin.
- [ ] Pin a column left and another right via the Columns menu's 3-state control — both stick correctly while scrolling horizontally, correct `:pl`/`:pr` offset, no shift on reload. Signed in, admin.
- [ ] Drag a column's header-edge resize handle — width changes live, commits to `?cols=:w<px>`, survives hard reload. Signed in, admin.
- [ ] Keyboard-focus a resize handle, press `ArrowLeft`/`ArrowRight` — width adjusts by a fixed step, same as drag. Signed in, admin.
- [ ] Inspect column dividers/resize grips at rest and on hover — a divider between every column, grip always visible (not hover-only), full-height highlight on hover/focus/drag. Signed in, admin.
- [ ] Compare the header row's background to body rows — header is `bg-muted/50`, visibly distinct from body rows (was plain `bg-background`). Signed in, admin.

## Views

- [ ] `testimonials` — default/config (`Featured`/`From Contributors`/`Needs Review`)/shared/local tabs all render, default first. Signed in, admin.
- [ ] Save/Rename/Delete a shared view (admin role) — all three work via the view's own ⋯ menu; a local view's menu never shows Rename/Promote to a role without `updateView`/`createView`. Signed in, admin.
- [ ] "Promote to shared" on a local view — confirm dialog copy, URL's `view=local:` becomes `view=shared:` with the SAME id, local entry removed. Signed in, admin.
- [ ] Diverge a view's sort/filter/columns/peek width from its saved state — "Modified: …" + Reset + Save appear inline in the toolbar; Reset restores the saved state exactly. Signed in, admin.
- [ ] A config view with a declared hidden `where` (`testimonials`' `Needs Review`) — shows the "N hidden filter(s)" lock badge, popover shows its description. Signed in, admin.
- [ ] Narrow the browser until view tabs overflow — collapses into a single-line "All views" trigger showing the active view's own name, not a generic label. Signed in, admin.
- [ ] A local view's own index (name, viewId) is still present after a hard reload before `localStorage` hydrates (server-rendered cookie index). Signed in, admin.
- [ ] Toggle `access.organizations: true` + `orgCollectionSlug` on a test config (temporary) — an org-less caller sees zero shared views and can't save/remove any (same not-found error for cross-org/org-less/missing); revert after. Signed in, two different orgs.

## The peek

- [ ] Double-click a `testimonials` row — peek opens instantly from the loaded row. Signed in, admin.
- [ ] Click the peek header's "Edit" link (not "Open") — navigates to the document's edit page. Signed in, admin.
- [ ] Previous/Next arrows WRAP: Previous on the first loaded row jumps to the last, Next on the last jumps to the first; both disabled only with a single loaded row or a deep-linked peek outside the loaded page. Signed in, admin.
- [ ] Fields tab vs. JSON tab on a row with a `relationship`/`upload` field: Fields shows the resolved title/filename, JSON shows the raw stored id(s) — confirm they genuinely differ (depth-0 fetch for JSON). Signed in, admin.
- [ ] Open the peek on `fields` collection's `test@proton.me` row — confirm the `display` slot renders per type: `json` via the real `JsonEditor` (read-only), `richtext` via the real editor's static render, `relationship`/`upload` as title/filename chips, `group`/`array`/`blocks` recursing into sub-fields. Signed in, admin.
- [ ] Click a copy button (Fields row or "Copy JSON") — success toast ("Copied …"); a copy button next to an empty value is disabled/greyed, no click handler. Signed in, admin.
- [ ] Drag the peek's own left-edge resize handle — width changes, full-height highlight, grip visible; double-click the handle (or the Reset control on handle hover) restores the default. Signed in, admin.
- [ ] A view with its OWN saved peek width shows "Modified: preview width" when you resize away from it, and Reset restores it; the default "All" view (no saved width) never shows Modified for peek width regardless of the live width. Signed in, admin.
- [ ] Toggle the admin sidebar open/closed while the peek is open (right-docked) — the peek's own `right` offset animates in lockstep with the sidebar, no instant jump. Signed in, admin.
- [ ] Switch to the JSON tab, close the peek, reopen it on a different row — it reopens on the JSON tab (remembered admin-wide, not per-view). Signed in, admin.
- [ ] A role missing read access to some fields — peek shows a hidden-fields notice naming the count; the ID row always shows; the Created row only shows when `_creationTime` is readable. Signed in, a role with a partial field map (e.g. `guest`).
- [ ] **Critical regression check:** open the peek on a `posts`/`fields` row with a populated rich-text field, arrow Next/Previous repeatedly across 8+ rows including ones with BOTH `json` and `richtext` populated — zero freezes, tab stays responsive throughout. Signed in, admin.

## Access

- [ ] `localhost:3020/admin`, no session cookie — loads 200, read-only, scoped to `guest`'s grants (`adminPanel.access` via `anonRole`). Anonymous.
- [ ] Same anonymous session, `posts`/`fields` columns — only the fields `guest`'s field map lists are visible (confirm against `access.ts`); an unlisted system field (`vex_status`, `_creationTime`) or unlisted `ui()` field is hidden, not just unreadable-but-shown. Anonymous.
- [ ] `guest`'s `testimonials` role — `internalScore` column/chip/peek row never appears anywhere; `Status`/`Created`-equivalent columns follow the same gating. Anonymous, and signed in as `contributor`/`user`.
- [ ] Create (or reuse) a shared "Published" view filtering on `vex_status` — an anonymous/`guest` caller still gets the correctly-filtered rows (declared-filter exemption), and the `vex_status` VALUE itself never appears in their response. Anonymous.
- [ ] As `guest`/`user`, add a URL filter naming a field you can't read (e.g. `?filter=(internalScore.lt.50)`) — the condition is dropped before the query runs, with a dismissible stale-filter notice naming the field's label; results show as if the filter weren't present. Signed in, `user`/`contributor`, or anonymous.

## Row/bulk actions

- [ ] `testimonials` row ⋯ menu — a custom "Feature" row action is present alongside the built-ins; its own action fires correctly. Signed in, admin/editor.
- [ ] Select several `testimonials` rows — a custom "Approve" bulk action is available in the toolbar alongside Delete; fires correctly for the selection. Signed in, admin/editor.
- [ ] Any collection's row ⋯ menu — the first item reads "Edit" (not "Open"); same destination/icon as before. Signed in, admin.

## The top bar

- [ ] Default sidebar side (left) — the sign-in/out control sits on the FAR RIGHT, after "View site", with label text ("Sign in"/"Sign out") and the icon to its right. Both signed-in and anonymous.
- [ ] `defineConfig({ admin: { sidebar: { side: "right" } } })` (temporary test config) — the control flips to the far left, opposite the sidebar-trigger/breadcrumb cluster. Revert after.
- [ ] Click "Sign out" while signed in — session clears, control flips to "Sign in", page reflects the new (anonymous) grants without a full reload glitch.
- [ ] An anonymous session shows "Sign in", never "Sign out" (Better Auth anonymous sessions count as signed out too).

## `/admin/collections` + `/admin/globals`

- [ ] `localhost:3020/admin/collections` — collections-only index, same card-grid style as the dashboard; set matches the sidebar's own Collections group exactly (including auth tables). Signed in, admin.
- [ ] `localhost:3020/admin/globals` — now permission-filtered; a role denied every global sees the new empty state, not a title with nothing below it. Signed in, a role with zero global grants (or anonymous, if `guest` has none).
- [ ] Breadcrumbs on both pages show "Home / Collections" and "Home / Globals" respectively.
- [ ] A not-found collection/global's back link points at `/admin/collections`/`/admin/globals` (not the dashboard).

## Not-found pages, error states, publish flow, commitTs

- [ ] `localhost:3020/admin/collections/doesnotexist` — `AdminNotFound` (icon, title, detail, "Back to collections" button), server-rendered, same frame size as a real list. Signed in, admin.
- [ ] `localhost:3020/admin/collections/posts/doesnotexist` — `AdminNotFound` (document variant), back link goes to the collection's own list. Signed in, admin.
- [ ] Hard-reload a stale `?sort=` naming an unindexed field — region-specific `ListViewQueryError`, not a 500 or a blank page (see Sort section above).
- [ ] Hard-reload `?peek=` naming an id the caller can't read, or that doesn't exist — peek shows "Can't show this document" either way (no distinction leaked). Signed in, a restricted role.
- [ ] Temporarily break a Convex query (or throttle network) on the table — `ListViewQueryError`'s generic "Couldn't load …" + Retry renders in place, same frame size, toolbar stays usable.
- [ ] A shared-view tab fetch failure — default/config/local tabs still render; the shared slot alone shows "Couldn't load shared views · Retry".
- [ ] Open an edit view, force a doc-fetch failure — inline error state with Retry, not a blank form.
- [ ] Create a `posts` document, Publish it, edit again, Publish (republish) — `updatedAt` advances each time (real `commitTs()` stamp), visible in the list column and peek.
- [ ] Filter `posts` by `updatedAt` with the date+time picker — operator defaults to `≥`/`≤` only (no `eq`/`neq` on a commitTs field); a non-integer/non-finite value is rejected server-side.

## Workspace gates

- [ ] `pnpm typecheck` — clean, root.
- [ ] `pnpm lint` — 0 errors.
- [ ] `pnpm test` — full suite green.
- [ ] `pnpm check:vercel` — clean build from a pristine tree.
