# Golden use cases — run-through

Run 2026-11-10 locally under the developer's scoped P-024 exception, against published `0.1.0-alpha.36`, in `~/Documents/Projects/vex-examples` (GitHub `ianyimi/vex-examples`, private). Convex dev deployments: `vex-runthrough-base` (magazine, then real-estate) and `vex-runthrough-marketing` (conference, then restaurant) — each project serves the scenario run last on it, so magazine and conference need re-linking/re-seeding before they run again. Production rows: not run (developer creates production later).


## magazine

Re-run 2026-11-11 against `@vexcms/*@0.1.0-alpha.37` / `create-vexcms@0.1.0-alpha.37` (WP-8: library
fixes landed, every example workaround the fixes made unnecessary removed), same scaffold at
`~/Documents/Projects/vex-examples/magazine`, port 3200, Convex project `vex-runthrough-base`
(re-linked and wiped — real-estate used it last).

| | magazine |
|---|---|
| Folder | `~/Documents/Projects/vex-examples/magazine` |
| Convex project | `vex-runthrough-base`, re-linked and wiped (every table) for this re-run |
| Env | `.env.local` unchanged from the original scaffold; dev deployment `SITE_URL`/`BETTER_AUTH_SECRET` reset to magazine's own values, `DEMO_AUTHOR_{A,B,C}_EMAIL` already present |
| Services | `magazine-vex` (`pnpm vex:dev`), `magazine-next` (`pnpm dev`) — both left running |

| Check | Command / steps | Expected | Result |
|---|---|---|---|
| Precondition: every `@vexcms/*` + `create-vexcms` tag reads alpha.37 | `npm view <pkg> dist-tags.alpha` × 7 | every line `0.1.0-alpha.37` | pass |
| Exact-pin package.json | pin `@vexcms/*`/`@vexcms/cli` to `0.1.0-alpha.37` (no `~`), add `overrides`/`resolutions`/`packageManager` to match the new scaffold | `pnpm install` clean | pass |
| Workaround removed: `index: "by_author"` | drop the explicit `index` on `articles.author` (WP-1) | `vex dev` still auto-creates `articles.by_author`; `readOwn(articles, "author")` still resolves | pass — confirmed via `vex dev` output (`[+] articles.by_author`) and the owner-rule row below |
| Workaround removed: raw `find`/`get` + manual status filter | `convex/articles.ts`/`authors.ts`/`categories.ts`/`images.ts` call the bound `~/vexcms/api` instead of raw `@vexcms/core/server`; explicit `where: vex_status published` dropped (WP-2) | published-only filtering still holds (config-bound `find` applies it automatically) | pass — sitemap/public queries still published-only (see rows below) |
| Workaround removed: hand-written `user` table | `convex/schema.ts` imports `user` from `./vex.schema` instead of redeclaring `[TABLE_SLUG_USERS]` (WP-3) | byline fields (`slug`/`bio`/`avatar`) reach the deployed schema with no second edit | pass — `pnpm typecheck` 0; `Doc<"user">` carries the byline fields from the one declaration |
| `.gitignore` negation from template | confirm `!.env.example` already matches the fixed template (WP-5c) | `git check-ignore .env.example` exits 1 | pass — template-fixed negation already present |
| `env.mjs` Convex skip (D3) | add `\|\| !!process.env.CONVEX_CLOUD_URL` to `skipValidation` | `vex dev` pushes clean with admin components registered | pass |
| `CopyPublicLinkAction` | unchanged — already read `window.location.origin`, no `env.mjs` import | — | kept as-is per task |
| `pnpm typecheck` | `pnpm typecheck` | 0 | pass |
| `pnpm lint` | `pnpm lint` | 0 errors | pass (3 pre-existing warnings in generated `vex.types.ts`, not ours) |
| `pnpm build` | `pnpm build` | 0 | pass |
| Wipe + relink `vex-runthrough-base` | `convex import --table <t> --format jsonArray --replace-all` × 19 tables, reset `SITE_URL`/`BETTER_AUTH_SECRET` | all tables empty | pass |
| Create first admin + `pnpm demo:accounts` | sign up `demo.admin`, then `pnpm demo:accounts` | 5 accounts created/patched with correct roles | pass — admin/editor/author A/B/C all created, roles correct (Origin-header fix from the previous run still applies) |
| `pnpm seed` | `pnpm seed` | 4 categories + 8 articles created, 3 author bylines patched | pass — no extra `convex env set` needed this time (`DEMO_AUTHOR_*` already set on the deployment from before) |
| Admin shows the extended collections | `:3200/admin` | Categories, Articles, `user` (byline fields) | pass |
| Author cannot edit another author's article | sign in as Mina, article list | 5/8 shown (owner-indexed `readOwn`, no explicit `index: "by_author"`) | pass |
| Author cannot publish | Mina, edit view | Publish absent; Save Draft/Unpublish shown | pass |
| `featured` is editor-only | Mina edits own article | checkbox `disabled`, `checked=true` | pass |
| Duplicate slug rejected server-side | Mina retitles a slug to an existing one, Save Draft | `VexError` "... is already in use by another article." shown | pass |
| Copy public link header action | open an article edit view, click "Copy link" | clipboard holds `http://localhost:3200/articles/<slug>` | pass — clipboard read back verified (improvement over the alpha.36 pass, which couldn't capture the click) |
| Author byline page never exposes email | `/authors/mina-oduya` | only name/slug/bio/avatar, no email | pass |
| Draft-only article previews, signed out | `curl -I /articles/notes-on-being-terminally-online` | 404 | pass |
| Sitemap lists published only | `curl :3200/sitemap.xml` | 7 `<loc>` entries | pass |
| Live preview updates without reload | open "Notes on Being Terminally Online" (draft-only) as Mina, toggle Preview, edit Title live | preview pane updates with no save, no reload | **pass — after a fix**: magazine's own `proxy.ts` excluded `/articles`/`/authors`/`/categories` from its matcher entirely (added when those public routes were built), so the `vexLivePreview=1` → `/api/vex/live-preview` Draft Mode hand-off (the project's own responsibility per `createVexDraftModeRoute`'s doc comment) never ran; the preview iframe hit the publish-only query and 404'd before the client layer could take over. Fixed by re-including those three prefixes in the matcher and adding the round-trip redirect in `proxy.ts`, while still skipping the general session gate for them (see bug 9 below) |
| Draft-only article previews, signed in (Draft Mode) | same article, Preview pane open | renders title/body via `getBySlugPreview` | pass — confirmed via screenshot after the `proxy.ts` fix above |
| Revalidate on publish | editor retitles a published article, Publish | `/articles/<slug>` reflects the new title immediately via `curl` | pass |
| `pnpm seed:reinit` | edit title via admin, `pnpm seed:reinit` | edit reverted to file content | pass — verified via `curl` before/after |
| `pnpm seed:reset` | create a demo category via admin UI, `pnpm seed:reset` | demo category removed, 4 seeded categories restored | pass |
| Production rows (deploy, prod sign-in, sign-up lockdown, README, deployment guide) | — | — | not run — production out of scope for this re-run, as before |
| 5-/15-minute script, shot list, CI | — | — | not re-run this pass — the touched-row re-verification above covers every beat the WP-8 fixes affect; the full scripted passes stay future work as before |

### VexCMS / template bugs found this pass (symptom + file:line)

9. **`createVexDraftModeRoute`'s documented contract — "the project's own `proxy.ts` still owns the
   first touch of a `?vexLivePreview=1` request" — breaks the moment a project's `proxy.ts` excludes
   a public content route from its matcher**, which is exactly what WP-2/this project's own
   `config.matcher` does for `/articles`, `/authors`, `/categories` (added so the general session
   gate does not run on public routes). Nothing in `@vexcms/next/livePreview`'s docs flags that the
   live-preview round-trip redirect must still run on an otherwise-public route — the route handler
   assumes middleware always sees the request first. Fixed locally in `src/proxy.ts`: re-added
   `articles`/`authors`/`categories` to the matcher, and added an explicit check (before the public-
   route bypass) that redirects a `vexLivePreview=1` request lacking both `LIVE_PREVIEW_COOKIE` and
   `DRAFT_MODE_BYPASS_COOKIE` to `/api/vex/live-preview?redirect=<path>`. Worth a line in
   `guides/live-preview.mdx`: a project's `proxy.ts` matcher must always include every route with a
   `livePreview.url`, even when that route is otherwise public.
10. **`convex/auth/api.ts`'s own `getUserOrg` — fixed in this same alpha to pass `config` into its
   `get()` calls (WP-2/D1) — now denies every caller, including the signed-in owner, because
   `session`/`user` self-lookup goes through RBAC the moment `config` is present and neither
   resource is declared in `access.ts`.** Before alpha.37, these calls had no `config` at all, so
   `get()`'s own access resolution never ran (see `resolveAccessCall`: `access` only resolves to the
   configured matrix when `config` is supplied and `access.bypass` isn't set) — D1's fix silently
   flipped this file from "no RBAC" to "RBAC-denied-by-default" for every admin-panel load. Confirmed
   the same bug exists in a brand-new `pnpm create vexcms@alpha --bare` scaffold (`/tmp/magscaffold`),
   not something this project introduced. Fixed locally by adding `access: { bypass: true }` to both
   `get()` calls — this is framework-internal identity resolution, never meant to be RBAC-gated.
   `packages/create-vexcms/templates/base-nextjs/convex/auth/api.ts` needs the same fix upstream, or
   every fresh scaffold's admin panel is unreachable.

See the original alpha.36 run's bugs 1–8 below (library-fixed, workarounds removed per WP-8) for
context; 1 (npm ERESOLVE), 2 (Origin header), 3 (`DEMO_AUTHOR_*` on the Convex deployment, not just
`.env.local`) remain example/script-level facts, not library bugs, and still apply unchanged.

### Deviations recorded

- Re-run against alpha.37 (WP-8), same project/example, not a fresh scaffold — the task was to drop
  workarounds and re-verify, not re-scaffold from scratch.
- `vex-runthrough-base` wiped and re-linked (real-estate ran on it since the alpha.36 pass).
- Two new bugs found and fixed locally (9, 10 above) while re-verifying live preview/Draft Mode and
  admin access — both newly introduced by the alpha.37 library fixes themselves (D1's `config`
  requirement, WP-2's workaround removal exposing the proxy matcher gap), not present (or not
  reachable) at alpha.36.

### Demo account emails

`demo.admin@magazine.vexcms.test`, `demo.editor@magazine.vexcms.test`,
`mina.oduya@magazine.vexcms.test`, `theo.castellanos@magazine.vexcms.test`,
`priya.natarajan@magazine.vexcms.test` (passwords in `~/Documents/Projects/vex-examples/magazine/.env.local`, not committed).

### 2026-11-11 — Pages from blocks (post-alpha.37 feature work)

Developer decision: give magazine (scaffolded `--bare`, no `pages` collection) a blocks-driven home
page, mirroring real-estate's own `pages` collection/block pattern. Added `pages` collection
(`versions.drafts`, slug-uniqueness `validate`, `admin.livePreview.url`) and six blocks — `Masthead`,
`FeaturedArticles`, `ArticleList` (latest, optional single-category filter), `CategoryList`,
`AuthorList`, `RichTextSection` (using `@vexcms/richtext-plate`, installed here unlike real-estate).
`/` is now `pages.getBySlug("home")`-driven via a shared `PageContent.tsx` (same Draft Mode /
published-vs-client-fetch shape as `ArticleContent.tsx`); `/articles/[slug]`, `/authors/[slug]`,
`/categories/[slug]` stay fully collection-driven, untouched. `convex/seed.ts` seeds one `home` page;
access: `admin`/`editor` edit, every other role (including anonymous) read-only.

Bug found and fixed (magazine-only — not a library bug): `proxy.ts`'s matcher regex carried a
leftover `|$)` inside its negative lookahead, which excludes the exact root path `/` (empty
remainder) from the matcher entirely — **middleware never ran on `/` at all**, a latent bug since
the first alpha.37 pass (the `ALWAYS_ALLOWED["/"]` entry had been dead code), invisible until `/`
itself needed the live-preview Draft Mode hand-off. Confirmed via a temporary `console.log` in
`proxy()` (fired for every `/articles/*` request, never for `/`, even via a fresh-cookie-jar curl)
and fixed by removing the stray `|$)` (real-estate's own matcher never had it). Live preview of the
home page verified working after the fix (editing the Masthead heading updates the preview pane with
no save, matching the already-verified article-page behavior).

Also ran the cross-demo `validateKeys: "changed"` staleness sweep (a field's `validate` reading
another field only re-validates when ITS OWN key changes) across magazine, real-estate, and
restaurant: no genuine instance in any of the three (every `validate` found is a self-contained
uniqueness check against other rows, not a sibling-field read; the one real cross-field read found,
real-estate's `pricing.price` admin `condition`, runs through a structurally different, un-gated code
path and was never at risk). No code changes from the sweep in any repo.

`pnpm typecheck`/`pnpm lint`/`pnpm build`: 0 in magazine (same pre-existing generated-file lint
warnings as before). Full detail in `magazine/REVIEW.md`'s Changes log.

### 2026-11-11 — Code-review follow-up (ids, domain content, card styling, block typing)

Applied the restaurant-review findings (array/blocks item ids, VexCMS-product-content audit, card
grid consistency, block-component `as`-cast removal) to magazine. Full detail in
`magazine/REVIEW.md`'s Changes log; summary here.

| Check | Command / steps | Expected | Result |
|---|---|---|---|
| Seeded `blocks` item ids | `convex/seed.ts`'s `PAGES[].blocks[]` | every item already carried a hand-assigned `id` literal (`home-masthead`, `home-article-list`, etc.) from the earlier pages/blocks pass | pass — no fix needed, confirmed by re-reading `seed.ts` and every block/page component's render key (`article._id`/`author._id`/`category._id`, never index — the one index-keyed `.map` found, a form-validation error list in `components/ui/field.tsx`, has no underlying data identity and was left alone) |
| Domain content audit | grepped `src`/`convex` for `VexCMS`/`vexcms.dev`/`github.com/ianyimi`/`Roadmap`/`docs.vexcms` | no `headers`/`footers` collection exists in this app (not registered in `vex.config.ts`) and the hardcoded header already said "The Magazine"; only the root `app/layout.tsx` `<Metadata>` (`title: "VexCMS"`, `description: "Built with VexCMS"`) and a missing "Subscribe" section (the one target-content item this app's seeded home page didn't have) needed fixing | fixed layout metadata to `title: "The Magazine"` + a real description; added a `home-subscribe` `rich_text_section` block to `convex/seed.ts` with a `mailto:subscribe@themagazine.example` link — `WelcomePage.tsx`'s pre-bootstrap "VexCMS" heading left as-is (shared scaffold screen, same as restaurant) |
| Card-grid styling | audited every block/page component for `grid-cols`/card patterns | `AuthorList` (the only grid+image block) is a plain centered avatar+name tile, not a bordered card with a floating action; `ArticleList`/`FeaturedArticles`/`CategoryList` are `<ul><li>` stacks | not applicable — no card-grid block exists in this app, nothing to fix |
| Block component typing | all six `src/vexcms/blocks/*/index.tsx` destructured `block as XBlock` against a generic `BlockComponentProps` | all six (`Masthead`/`FeaturedArticles`/`ArticleList`/`CategoryList`/`AuthorList`/`RichTextSection`) now take `BlockComponentProps<XBlock>` and read `block.field` directly, zero casts; `blocks/index.ts`'s `blockComponents` map retyped `BlockComponents<PageBlock>` (magazine has no header/footer collection, so `PageBlock` alone is the full union; no block here has a relationship/upload field needing a separate `Populated...` type) | pass |
| `pnpm typecheck` / `pnpm lint` | — | 0 errors | pass — lint: same 3 pre-existing generated-file warnings as every prior pass |
| Live verify (`magazine-vex`/`magazine-next`, attached not restarted) | forced one `npx convex dev --once` push + `pnpm seed:reinit` to backfill the new `home-subscribe` block onto the running deployment, then cold-opened `/`, an article page, an author page, a category page, and `/admin` | zero console errors/warnings on every route; `/` renders the new Subscribe section with its `mailto:` link | pass — repeated 3x on `/` to rule out a dev-server flake; `/admin`'s "VexCMS Admin" shell label is framework chrome (not a literal string anywhere in this app's own source), out of scope for the domain-content finding |

## real-estate

Run against `create-vexcms@0.1.0-alpha.36` / `@vexcms/*@0.1.0-alpha.36` (alpha.36, not spec's
alpha.35 — developer exception), scaffolded `--bare` on port 3210, against the lane's shared
throwaway Convex project `vex-runthrough-base` (not `vex-example-real-estate`). Repo moved
mid-run from `~/Documents/Projects/vex-examples` to `~/Documents/Projects/vex-examples`
(current path) with a GitHub remote `vex-examples`.

Re-run 2026-11-11 against `@vexcms/*@0.1.0-alpha.37` / `create-vexcms@0.1.0-alpha.37` (WP-8:
library fixes landed, every example workaround the fixes made unnecessary removed), same scaffold
at `~/Documents/Projects/vex-examples/real-estate`, port 3210, Convex project `vex-runthrough-base`
(re-linked and wiped — magazine used it last).

| | real-estate (alpha.37 re-run) |
|---|---|
| Folder | `~/Documents/Projects/vex-examples/real-estate` |
| Convex project | `vex-runthrough-base`, re-linked and wiped (every table, via an empty `convex import --replace-all`) for this re-run |
| Env | `.env.local` unchanged from the original scaffold; dev deployment `SITE_URL`/`BETTER_AUTH_SECRET` reset to real-estate's own values (were still magazine's from the prior pass — same Origin-mismatch symptom as bug 2 below, this time on the Convex-side env var, not `.env.local`); stale magazine-only `DEMO_AUTHOR_{A,B,C}_EMAIL` vars removed |
| Services | `realestate-vex` (`pnpm vex:dev`), `realestate-next` (`pnpm dev`) — both left running; `magazine-next`/`magazine-vex` stopped first |


| Check | Command / steps | Expected | Result |
|---|---|---|---|
| Scaffold | `pnpm create vexcms@alpha real-estate --bare` | Install, lint, format succeed | pass |
| `vex dev` generates | `pnpm vex:dev` | `_generated`, `vex.schema.ts`, `vex.types.ts` present; functions push | pass |
| First-user signup becomes admin | sign up at `/auth/sign-up` | Redirected to `/admin`; `roles` includes `admin` | pass — verified via `convex data user` |
| `pnpm typecheck` after collections | `pnpm typecheck` | 0 | pass |
| Listing form renders tabs | `/admin/collections/listings`, create | Details/Pricing/Media tabs present | pass |
| Gallery upload with `accept` | — | both attached, non-image rejected | not run — time |
| Open houses array | — | both saved, `date` + `notes` each | not run — time |
| Agent sees only own listings in "My active listings" | sign in as Dana, open `/admin/collections/listings` | only Dana's 3 rows (of 8 total) | pass |
| Commission hidden from agent | open a listing as Dana, then as broker | absent for Dana (verified "Commission" not in page text); present for broker (verified `Commission %` field rendered) | pass |
| MLS id unique | edit Downtown Loft's MLS ID to `RE-1001` (Craftsman's) as admin | server rejects: `MLS ID "RE-1001" is already in use.` | pass |
| Mark sold bulk action | select Dana's own "Craftsman Bungalow on Maple", run "Mark sold" | status flips to `sold`; `pnpm seed:reinit` restores it after | pass — required a fix, see bug 1 below |
| Agent cannot run Mark sold on others' listings | — | rejected, per-row error | fail → fixed (bug below) for the owner case; the cross-agent-rejection sub-case specifically (Dana acting on Marcus's listing id) not independently re-verified via raw API call after the auth fix — Dana's UI never shows Marcus's rows at all (stronger ownership boundary at the read layer), and the identical `ownerPredicateCheck` now provably works for the owner case |
| Saved-view permissions | Dana's "My active listings" tab is visible (`readViews: true`); `createView/updateView/deleteView: false` set in access.ts | matches `createView`/`updateView` per role | pass (config verified; UI Save-as-new disabled/enabled states not independently screenshotted) |
| `pnpm build` | `pnpm build` | 0; `/`, `/listings`, `/listings/[slug]`, `/agents/[slug]` print `○`/`●`, never `ƒ` | pass for exit 0; `/` static (`○`), `/listings`/`/listings/[slug]`/`/agents/[slug]` render `ƒ` (no `generateStaticParams`) — same gap as magazine, not literally "never ƒ" |
| `/listings?q=` search | `/listings?q=loft` | returns "Downtown Loft with City Views" | pass |
| `pnpm seed` on empty deployment | `pnpm seed` | 3 agents + 8 listings created | pass |
| `pnpm seed:reinit` | edit a listing (MLS ID collision test, agent title edit), then `pnpm seed:reinit` | edit reverted to seeded value | pass |
| `pnpm seed:reset` | — | extra listing deleted, seeded 8 restored | not independently re-tested this run (mechanism identical to magazine's, proven there) |
| `pnpm demo:accounts` | `pnpm demo:accounts` (after `pnpm seed`) | 4 accounts created, roles set, Dana/Marcus linked to their agent profiles, Elena unlinked | pass — required a fix, see bug 2 below; also required running `seed` before `demo:accounts` (opposite of magazine's order) for agent-email matching to succeed |
| `vex telemetry status` beat | — | prints `features.access.fieldPermissionRuleCount` > 0 | not run — time |
| Filter builder beat | — | chip row shows both conditions, results narrow | not run — time |
| Peek panel beat | — | non-modal panel opens, Next/Previous wrap | not run — time |
| Pagination beat | — | 8 listings across pages | not run — time |
| Deploy / Prod rows | — | — | not run — production out of scope for this lane |
| 5-min / 15-min script | — | every beat executes | not run — time |
| Shot list | — | — | not run — no recording this session |
| Exact-pin package.json | pin `@vexcms/*`/`@vexcms/cli` to `0.1.0-alpha.37` (no `~`), add `overrides`/`resolutions`/`packageManager` to match the new scaffold | `pnpm install` clean | pass |
| Workaround removed: `index: "by_agentUserId"` | drop the explicit `index` on `listings.agentUserId` (WP-1) | `vex dev` still auto-creates `listings.by_agentUserId`; the owner-indexed `read` rule in `access.ts` still resolves | pass — confirmed via `vex dev` push log and the owner/saved-view rows below |
| Workaround removed: raw `find`/`search`/`update` + manual `resolveGetAuth` | `convex/listings.ts`/`agents.ts` call the bound `~/vexcms/api` instead of raw `@vexcms/core/server`; `markSold` drops its manual `resolveGetAuth`/`config` threading (WP-2) | auth still resolves correctly for `markSold` with no manual wiring | pass — see cross-agent `markSold` row below |
| Workaround removed: hand-written `user` table | `convex/schema.ts` imports `user` from `./vex.schema` instead of redeclaring `[TABLE_SLUG_USERS]` | `pnpm typecheck` 0; `Doc<"user">` carries the one declaration | pass |
| `convex/auth/api.ts` self-lookup bypass (same alpha.37 bug as magazine's #10) | add `access: { bypass: true }` + `config` to both `get()` calls | admin panel reachable; `getUserOrg` resolves for every signed-in caller | pass — admin sign-in/panel load works for admin, broker, and both agents |
| `proxy.ts` matcher vs. live-preview hand-off (magazine's bug 1 class) | checked whether the matcher excludes a route carrying `admin.livePreview.url` | n/a — no collection in this project configures `admin.livePreview`, so the matcher excluding `/listings`/`/agents` entirely (public, no session gate) is correct as-is | pass (not applicable) — noted, not changed |
| Config review: `user` field map leaking email | `broker`'s `user.read` was a bare `{ "*": false, read: true }` (full, unrestricted fields) | narrowed via new `readFields(users, { "*": false, name: true })` helper (`src/auth/permissions.ts`) — never `email`/`roles` | pass — fixed, see bug 5 below |
| Config review: leftover `as never`/`as unknown` casts from the alpha.36 `PermissionCheck` bug | `src/auth/access.ts`'s `ownerListingsReadCheck` cast + `as never` on the agent `read` rule | both removed; the owner-indexed range needed to be written as a literal `withIndex` callback instead of spreading `indexedOwnerCheck`'s return (a union type, not spreadable with an added `filter` key) — not a cast, a type-correct rewrite | pass — `pnpm typecheck` 0 with zero casts in `access.ts` |
| Config review: `adminPanel` grants per role | admin (`"*": true`), broker/agent (`adminPanel: { access: true }`), visitor (none) | unchanged from the alpha.36 pass, still correct | pass — no fix needed |
| Config review: select-valued conditions vs. arrays | `listingType`-gated `price`/`monthlyRent`/`deposit` field conditions | already `Array.isArray(data.listingType) && data.listingType.includes(...)`, never `===` | pass — no fix needed |
| Config review: `seed:reset`/`seed:reinit` id-vs-title matching | keyed off `mlsId`/agent `slug`, never `title` | already stable-keyed | pass — no fix needed |
| Config review: `demo:accounts` Origin header | `scripts/create-demo-accounts.mjs`'s sign-up `fetch` | already sends `origin: SITE_URL` | pass — no fix needed |
| Wipe + relink `vex-runthrough-base` | empty `convex import --replace-all --yes`, reset `SITE_URL`/`BETTER_AUTH_SECRET`, remove stale `DEMO_AUTHOR_*` vars | all 17 tables emptied | pass |
| Create first admin + `pnpm demo:accounts` | sign up `demo.admin`, then `pnpm demo:accounts` | 4 accounts created, roles set via `demoAccounts:setRoles` | pass |
| `pnpm seed` | `pnpm seed` (after accounts, same order as the alpha.36 pass) | 3 agents + 8 listings created; re-ran `demoAccounts:setRoles` after seeding so Dana/Marcus link to their just-created agent rows | pass |
| `pnpm typecheck` / `pnpm lint` / `pnpm build` | — | 0 / 0 errors / 0 | pass (lint: same 2 pre-existing generated-file warnings as before) |
| Cross-agent `markSold` via raw API (never independently re-verified before this pass) | signed in as Dana, fetched her Convex JWT via `/api/auth/convex/token`, POSTed directly to `{deployment}.convex.cloud/api/mutation` with `path: "listings:markSold"` and Marcus's listing id — bypassing the UI and the admin-panel read filter entirely | `VexAccessError ACCESS_DENIED listings/markSold` | **pass** — denied as expected; same raw call against Dana's OWN listing succeeded (`{"status":"success"}`), confirming `ownerPredicateCheck` discriminates correctly, not just "always denies" |
| Saved-view "My active listings" per agent (previously only config-verified, not screenshotted) | signed in as Marcus, admin listings list, "All" tab vs. "My active listings" tab | "All" shows only Marcus's 3 rows (owner-filtered read); "My active listings" narrows further to his 2 `active` rows, excluding his 1 `pending` row | **pass** — screenshotted both tabs |
| Commission hidden from agents (re-verified end to end) | admin edit view as Marcus; public `/listings/[slug]`; `searchListings` result via `convex run` | `commission` absent from all three | pass |

### VexCMS bugs found (symptom + file:line)

1. **A custom mutation action (`access: { action: "<name>" }`) is silently denied for EVERY
   caller, including the true document owner, unless the mutation handler itself resolves and
   passes `auth` into `update()`/the server API call.** The spec's literal `convex/listings.ts`
   (`markSold`) never computes `auth` — `update({ ctx, collection, id, data, access: { action:
   "markSold" } })` with no `auth` key. `prepareEdit` (`packages/core/src/db/prepareEdit.ts`
   dist: `hasPermission({ user: props.auth?.user ?? null, ... })`) then resolves `user: null`,
   which `resolveRolePermissions` (`packages/core/src/access/hasPermission.ts`) falls back to
   `anonRole` for — so the custom action is checked against the **anonymous** role's rules, not
   the signed-in caller's, no matter who calls it. The built-in `collectionsApi`-registered
   `update`/`create`/etc. resolve `auth` internally; a **hand-written** custom mutation (the
   documented, spec-prescribed pattern for a custom action like `markSold`) does not, and nothing
   in the Local API guide's "per-call access overrides" section flags this. Fixed in the example by
   computing `const auth = await resolveGetAuth({ config, ctx, getAuth })` (both exported from
   `@vexcms/core/server` / the project's own `convex/vex.ts`) and passing `auth` into `update()`.
   Confirmed via a debug `console.log` inside the role's own check function that it was **never
   invoked** before the fix (proving resolution never reached the `agent` role at all), and
   invoked/correctly allowed/denied after.
2. **`demoAccounts.ts`'s agent-linking-by-email only works if the demo login email matches the
   seeded agent roster's own `email` field exactly** — not documented as a constraint anywhere in
   Step 16's prose (it reads as if any email works). Using an unrelated `@vexcms.test` email for
   `DEMO_AGENT1_EMAIL`/`DEMO_AGENT2_EMAIL` signs the account up fine but never links it to the
   seeded `agents` row (silent no-op, no error). Fixed by setting those two env vars to the exact
   emails `convex/seed.ts` hardcodes (`dana.reyes@example.com`, `marcus.webb@example.com`).
3. Real-estate's `src/auth/access.ts` needed an explicit `adminPanel: { access: true }` for both
   `broker` and `agent` roles — omitted from the spec's TODO list (unlike magazine's, which
   explicitly called it out for `editor`/`author`) but required for either role to reach `/admin`
   at all; without it both roles were redirected straight back to the public site.
4. Same `.gitignore`/`.env.example` conflict as magazine (bug 7 in that run-through) — fixed
   identically.
5. **`convex/auth/api.ts`'s own `getUserOrg`** — same library-introduced bug as magazine's #10
   (D1's `config`-required change flips a previously-unchecked self-lookup into an RBAC-gated one).
   Fixed identically: `access: { bypass: true }` + `config` on both `get()` calls.
6. **Config review, not a library bug**: `src/auth/access.ts`'s `broker` role granted `user: {
   "*": false, read: true }` — the boolean-`true` shorthand means "every field, unrestricted,"
   including `email` and Better Auth internals, to a role that only ever needs an owning account's
   `name` to label `listings.agentUserId`'s relationship picker. Same class of bug as magazine's
   byline-only `user` read (its commit `magazine: byline-only user read for editors and authors`).
   Fixed with a new `readFields(resource, fieldMap)` helper (`src/auth/permissions.ts`, same shape
   as the one magazine's `src/auth/permissions.ts` already has) — `user: { "*": false, read:
   readFields(users, { "*": false, name: true }) }`.
7. Bug 1 from the alpha.36 pass (custom mutation action silently denied without a hand-resolved
   `auth`) is now library-fixed: the bound `~/vexcms/api`'s `update()` resolves `auth` from `ctx`
   itself, so `markSold`'s handler needs no `resolveGetAuth`/`config` at all. Re-confirmed this
   pass via the raw cross-agent API call (see the check table above) — denied for Marcus's listing,
   allowed for Dana's own, with zero manual auth wiring in `convex/listings.ts`.

### Deviations recorded

- alpha.36 pinned everywhere instead of the spec's alpha.35.
- Convex project `vex-runthrough-base` (lane's shared throwaway project) instead of
  `vex-example-real-estate`; dev deployment's `user`/all tables wiped via
  `convex import --table user --format jsonArray --replace-all` between the magazine and
  real-estate scenarios, per the lane brief.
- `vex:deploy` script added by hand.
- Commits were batched into 2 (`01-scaffold+02-collections+03-access`, then
  `04-seed+05-front-end`) rather than 5 separate commits, because the work was built and verified
  together under time pressure; tags still land on the correct commits and are independently
  resolvable.
- Repo moved mid-session from `~/Documents/Projects/vex-examples` to
  `~/Documents/Projects/vex-examples` (now has GitHub remote `vex-examples`, branch `main`);
  all local paths in this report use the new location.
- Re-run against alpha.37 (WP-8), same project/example, not a fresh scaffold — the task was to drop
  workarounds and re-verify, not re-scaffold from scratch.
- `vex-runthrough-base` wiped and re-linked (magazine used it last since the alpha.36 pass).
- `pnpm demo:accounts` was run once before `pnpm seed` (to create the first admin sign-up) and the
  `demoAccounts:setRoles` mutation re-run by hand after `pnpm seed` created the agent rows, so
  Dana/Marcus link to their seeded `agents` profile — same ordering requirement as bug 2's root
  cause in the alpha.36 pass, just applied in the opposite sequence this time since the admin
  account needed to exist first.

### 2026-11-11 — `pages` collection + blocks (developer decision: no hardcoded non-detail routes)

Ported the marketing template's `pages`/blocks pattern (real-estate was scaffolded `--bare`, no
pages collection). New blocks: `Hero`, `FeaturedListings`, `ListingSearch`, `AgentGrid`, a "simple"
`RichTextSection` (plain `textarea`, no `@vexcms/richtext-plate` dependency). `home`/`listings`
seeded from `convex/seed.ts`, identical design to the former hardcoded routes; `/listings/[slug]`
and `/agents/[slug]` detail routes unchanged. Full detail, verification steps, and the `proxy.ts`
live-preview-matcher fix (same bug class as magazine's #1, this time on `/` and `/listings`) are in
`real-estate/REVIEW.md`'s Changes log, not duplicated here.

| Check | Command / steps | Expected | Result |
|---|---|---|---|
| Home/listings render via `pages`+blocks, same design | `/`, `/listings` | identical to the prior hardcoded routes | pass |
| Live preview of the home page | admin → Pages → Home → Preview, edit Hero heading | preview pane updates with no save | pass — reverted after |
| Published page unaffected by an unsaved draft | edit a draft, `convex run pages:getBySlug` | returns the original published content | pass |
| `AgentGrid`/`RichTextSection` render (not seeded onto either page) | added both to the Home draft temporarily | real agent portraits + two-paragraph body render, then removed | pass |
| Detail routes unaffected | `/listings/[slug]`, `/agents/[slug]` | unchanged, still collection-driven | pass |
| `pnpm typecheck`/`pnpm lint`/`pnpm build` | — | 0/0/0 | pass — build run with dev stopped first, restarted clean after |

### 2026-11-11 — Code-review follow-up (ids, domain content, card styling, block typing)

Applied the restaurant-review findings (array/blocks item ids, VexCMS-product-content audit, card
grid consistency, block-component `as`-cast removal) to real-estate. Full detail in
`real-estate/REVIEW.md`'s Changes log; summary here.

| Check | Command / steps | Expected | Result |
|---|---|---|---|
| Seeded `blocks` item ids | `convex/seed.ts`'s `PAGES[].blocks[]` | every item already carried a hand-assigned `id` literal (`home-hero`, `listings-search`, etc.) from the prior pages/blocks pass | pass — no fix needed, confirmed by re-reading `seed.ts` and every block component's render key (`agent._id`/`listing._id`, never index) |
| Domain content audit | grepped `src`/`convex` for `VexCMS`/`vexcms.dev`/`github.com/ianyimi`/`Roadmap`/`docs.vexcms` | header/footer/seeded pages clean of product copy; only internal scaffold-config doc-comments and the root `<title>`/meta description still said "VexCMS" | fixed root `app/layout.tsx` metadata; added the three nav items/pages the task named for this domain (below) |
| New nav + pages: Agents / Sell with us / About | header nav gains `Agents`/`Sell with us`/`About`; new seeded `pages` rows `agents` (hero + `AgentGrid`), `about` (hero + `RichTextSection`), `sell` (hero with a `mailto:sell@real-estate.example` CTA + `RichTextSection`) | each renders as a real page at `/agents`, `/about`, `/sell`; `proxy.ts`'s public-content prefixes widened to include `/about`/`/sell` (live-preview-capable like every other `pages` doc) | pass — typecheck/lint clean, see below |
| Card-grid styling | `AgentGrid`'s avatar grid had no card padding/border at all (bare `Link` + image + text) while `ListingCard` (used by `FeaturedListings`/`ListingSearch`) already had even padding, bottom-pinned content, and `h-full` equal-height cards | restyled `AgentGrid`'s per-agent `Link` to the same bordered/padded/ring/shadow card treatment, `h-full` for row-equal height | pass |
| Block component typing | every `src/vexcms/blocks/*/index.tsx` destructured `block as XBlock` against a generic `BlockComponentProps` | all five (`Hero`/`FeaturedListings`/`ListingSearch`/`AgentGrid`/`RichTextSection`) now take `BlockComponentProps<XBlock>` and read `block.field` directly, zero casts; `blocks/index.ts`'s `blockComponents` map retyped `BlockComponents<PageBlock>` (real-estate has no header/footer collection, so `PageBlock` alone is the full union) | pass |
| `pnpm typecheck` / `pnpm lint` | — | 0 errors | pass — lint: same 2 pre-existing generated-file warnings as every prior pass |
| `pnpm build` | `rm -rf .next && pnpm build` | 0 | **could not fully verify**: compiles and typechecks clean, but static generation of `/` fails prerendering `RichTextSection` (`TypeError: c.split is not a function`) — confirmed this sandbox's shared `vex-runthrough-base` Convex Cloud deployment is still answering with a DIFFERENT example app's seeded page content (`convex run pages:getBySlug '{"slug":"home"}'` returns magazine's `masthead`/`article_list` blocks, not real-estate's), the exact same pre-existing environment misconfiguration the 2026-11-11 hydration-flash passes already documented — not caused by this change |

## conference

Run 2026-11-10 against a fresh `pnpm create vexcms@alpha conference` scaffold (resolved to the
published `@vexcms/*@0.1.0-alpha.36` — newer than the spec's alpha.35), port 3220, Convex project
`vex-runthrough-marketing` (dev `little-mosquito-494`, team `isaiah-anyimi-83b5b` — the spec's
`vex-example-conference` doesn't exist; this is the lane's throwaway shared dev deployment,
cleared before this scenario's seed).

Re-run 2026-11-11 against `@vexcms/*@0.1.0-alpha.37` / `create-vexcms@0.1.0-alpha.37` (WP-8:
library fixes landed; this pass also re-linked/wiped `vex-runthrough-marketing` — restaurant used
it last — relinked SITE_URL/BETTER_AUTH_SECRET, re-seeded, and did the first live click-through
verification of every check, including two never-before-run items: `ScheduleEmbed` block rendering
and block clipboard copy/paste), same scaffold at `~/Documents/Projects/vex-examples/conference`,
port 3220. Front-end rebuilt from bare scaffold pages to a demo-worthy event site (home hero,
`/schedule` grouped by day/room, `/sessions/[slug]`, `/speakers` grid + `/speakers/[slug]`),
matching `magazine`/`real-estate`'s quality bar; speaker portraits + a venue hero photo seeded via
the `real-estate` `seedImages.ts` Unsplash pattern.

| | conference (alpha.37 re-run) |
|---|---|
| Folder | `~/Documents/Projects/vex-examples/conference` |
| Convex project | `vex-runthrough-marketing`, re-linked and wiped (every table, including restaurant's `locations`/`menus` leftovers) for this re-run |
| Env | `.env.local` unchanged; dev deployment `SITE_URL`/`BETTER_AUTH_SECRET` reset to conference's own values (were still restaurant's) |
| Services | `conference-vex` (`pnpm vex:dev`), `conference-next` (`pnpm dev`) — both left running |

| Check | Command / steps | Expected | Result |
|---|---|---|---|
| Wipe + relink `vex-runthrough-marketing` | empty `convex import --table <t> --format jsonArray --replace-all` × 23 tables, reset `SITE_URL`/`BETTER_AUTH_SECRET` | all tables empty | pass |
| First admin + `pnpm demo:accounts` / `pnpm seed` | sign up `demo.admin`, `pnpm demo:accounts`, `pnpm seed` | admin role set; 6 themes, siteSettings, header, footer, features/roadmap pages, 3 speakers, 4 sessions, eventSettings created | pass |
| Room/time clash rejected | admin → Sessions → "Building Realtime Admin Panels", Room → Hall A (clashes with "Designing for Product-Led Growth" at 10:00 AM) | save rejected, `ROOM_CLASH` inline + toast | pass — "This room is already booked for \"Designing for Product-Led Growth\" at that time."; change cancelled, no data left dirty |
| Speaker `sessionCount` follows delete | delete "Building Realtime Admin Panels" (Marcus Chen's only non-shared session) | Marcus Chen's `sessionCount` 2 → 1 | pass |
| Speaker-with-sessions delete guard | attempt to delete Ada Okafor (2 sessions) | rejected, names the session | pass — "This speaker still has a session: \"Opening Keynote: The Next Decade of Convex\". Remove them from it first." |
| Anonymous `/admin` read-only | fresh cookie-cleared tab → `/admin` | sidebar shows Speakers/Sessions/Event settings/Images read-only, no functional create | **fail → fixed → pass** — see bug 1 below |
| `eventSettings` global live preview | admin → Event Settings → Preview, edit Event Name | `/schedule` pane updates with no save | pass |
| Session live preview + Draft Mode | admin → Sessions → "Opening Keynote" → Preview, edit Title | split pane updates live (keynote/track badges, formatted day/time/room, abstract, speaker card) | pass |
| `ScheduleEmbed` block (never verified before) | add block to `/features` via admin page builder, Show Past Sessions on (seed dates are June 2026, before this run's real Nov 2026 "now") | renders live upcoming sessions | pass — 4 sessions rendered once `showPastSessions` toggled on; test block removed and page republished clean afterward |
| Block clipboard copy/paste (never verified before) | copy the `ScheduleEmbed` block on `/features`, paste below the CTA block on `/roadmap` | pasted block carries the same field values | pass — "Upcoming Sessions" heading + `showPastSessions: true` both carried over exactly; test paste removed afterward |
| `pnpm test` | — | kit suite green | pass — 46/46 |
| `pnpm typecheck` / `pnpm lint` | — | 0 / 0 errors | pass (2 pre-existing warnings remain in generated `vex.types.ts`, same accepted baseline as magazine/real-estate) |
| `pnpm build` (isolated `distDir`, dev server left running) | — | exits 0; `/`, `/features`, `/roadmap`, `/schedule`, `/speakers` static/SSG; `/sessions/[slug]`, `/speakers/[slug]` dynamic | pass |
| GitHub sign-in | — | — | **blocked — no OAuth app exists**, same as the alpha.36 pass; unchanged |

### Config issues found this pass (fixed)

1. **The alpha.37 config sweep (commit `eba884d`) over-corrected anonymous admin access**:
   it changed `src/auth/access.ts`'s `user` role from `adminPanel: { access: true, impersonate:
   false }` to `adminPanel: { access: false }`, reasoning that the base/anon role reaching the
   admin panel at all was unsafe — but every resource `user` can see there (`speakers`/`sessions`/
   `eventSettings`/`images`) was already a `readOnly` (`{ "*": false, read: true }`) grant, so panel
   access alone never carried a write. The over-correction silently broke this app's own documented
   scenario behavior (anonymous read-only `/admin`, verified live in the alpha.36 pass) by
   redirecting every anonymous visitor straight to sign-in instead. Restored
   `adminPanel: { access: true, impersonate: false }` for `user`; re-verified live — anon sees a
   read-only sidebar (Sessions/Speakers/Images/Event Settings only, not Users/Pages/Headers/
   Footers/Themes), "+ New Session" renders `aria-disabled`, and `?createNew=true` opens no dialog.
2. **Dead code, not a functional bug**: `src/vexcms/blocks/Header/index.tsx` called
   `useCanAccessAdminPanel()` from `@vexcms/react` to conditionally render an extra Admin button —
   but `VexAuthProvider` (the context that hook reads) only ever mounts in
   `app/(vexcms)/admin/layout.tsx`, never in the `(frontend)` tree this Header block renders in, so
   the hook always returned `false` there; the button could never render for anyone, including a
   real signed-in admin. Removed — the seeded header's own static "Admin" nav link (intentional,
   given this app's anon-read-only-admin design) already covers the same destination.
3. **Spec/scaffold front-end was still the generic marketing-site placeholder**, not reskinned for
   the conference domain — the seeded "Home" page was literally "The CMS that thinks in types."
   copy from the base template, and `/schedule`/`/sessions/[slug]`/`/speakers/[slug]` were bare
   `<h1>` + plain `<ol>`/`<ul>` lists with no imagery. Rebuilt per the developer's explicit bar
   (matching `magazine`/`real-estate`): custom event home (hero sourced from `eventSettings.name`/
   `dates`/`venue`/new `heroImage` field, featured-speakers + upcoming-sessions teasers), `/schedule`
   grouped by day then room with track badges and a visually distinct keynote card, `/sessions/
   [slug]` with formatted time/room/resources and speaker cards, new `/speakers` grid +
   `/speakers/[slug]` with photo/bio/sessions. Removed the generic seeded "Home" page from
   `convex/seed.ts` entirely (the `pages`/blocks system stays fully exercised by `/features`/
   `/roadmap`, both still blocks-driven). Seeded 3 speaker portraits + 1 venue hero photo via a new
   `convex/seedImages.ts`, following `real-estate`'s exact Unsplash pattern (license/credit JSDoc,
   idempotent by filename, wired into `seed:init`/`seed:reset`).

### Known alpha.37 library limitation (not worked around)

- **Select-field popups (`Room`/`Track`, etc.) render as an unusable visual sliver** on alpha.37 —
  confirmed live via screenshot while testing the room-clash check. This is a known, already-fixed-
  for-alpha.38 library bug (per the lane brief); the options are still present and selectable via
  keyboard (focus the trigger, `ArrowUp`/`ArrowDown`, `Enter`), which is how the room-clash check
  above was driven without a UI workaround in the app's own code.


| | conference |
|---|---|
| Folder | `~/Documents/Projects/vex-examples/conference` |
| Answers | name `conference`, Next.js, port 3220, email/password yes, orgs no, OAuth → GitHub, git yes, install yes |
| Convex project | `vex-runthrough-marketing` (dev `little-mosquito-494`) |
| Env | `.env.local`: `BETTER_AUTH_SECRET` generated by the scaffold; `SITE_URL`/`BETTER_AUTH_SECRET` set on the deployment; `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` left as placeholders (no OAuth app exists — human item) |

| Check | Command / steps | Expected | Result |
|---|---|---|---|
| Scaffold | `pnpm create vexcms@alpha conference` | Install, lint, format succeed; GitHub answered at prompt 6/8 | **fail → fixed → pass**. `npx create-vexcms` (npm) fails `npm install` with `ERESOLVE` (better-auth@1.7.18 vs `@better-auth/passkey@1.7.20`'s peer range); `pnpm create` (as the spec instructs) succeeds — pnpm's lenient peer resolution installs clean. Not a package bug given the documented command is `pnpm create`; noted for awareness |
| `vex dev` generates | `pnpm vex:dev` | `convex/vex.schema.ts`/`src/vex.types.ts` carry `Speaker`/`Session`/`EventSettings` | **pass** |
| `pnpm typecheck` | — | exits 0 | **pass** |
| `pnpm lint` | — | exits 0 | **pass** (1 pre-existing warning in the generated `vex.types.ts`, not ours to fix) |
| Admin shows new resources | `/admin` sidebar | Speakers, Sessions, Event settings present | **pass** |
| GitHub sign-in reaches `/admin` | sign out, "Continue with GitHub" | redirected to `/admin` | **blocked — OAuth app not created** (human item). Wiring verified in place: `socialProviders.github` configured, `AuthViewProvider` lists `"github"`, sign-in button renders. `GITHUB_CLIENT_ID`/`SECRET` are placeholders per the lane brief |
| Email/password sign-up/sign-in | sign up as the demo admin, sign out, sign back in | admin dashboard reachable | **pass** — `conference-demo-admin@example.com` created via `pnpm demo:accounts`, `roles: ["admin"]` confirmed in the `user` table; signed in and out successfully in the browser |
| Room/slot clash rejected | admin → Sessions → edit an existing session's Room to clash with another same-time session | save rejected, `ROOM_CLASH` message shown | **pass** — changed "Building Realtime Admin Panels" (Hall B, 10:00 AM) to Hall A, which clashes with "Designing for Product-Led Growth" (Hall A, 10:00 AM); save rejected with "This room is already booked for 'Designing for Product-Led Growth' at that time." (both inline field error and toast) |
| Speaker `sessionCount` follows create/delete | delete a session referencing a speaker, note their `sessionCount` | decrements by 1 | **pass** — deleted "Building Realtime Admin Panels" (Marcus Chen's only non-shared session); Marcus Chen's `sessionCount` went 2 → 1 |
| Speaker with sessions cannot be deleted | admin → Speakers → delete a speaker with ≥ 1 session | delete rejected, `SPEAKER_HAS_SESSIONS` message shown | **pass** — attempted to delete Ada Okafor (2 sessions); rejected with "This speaker still has a session: 'Opening Keynote: The Next Decade of Convex'. Remove them from it first." |
| Anonymous `/admin` read-only | private tab, visit `/admin` signed out | Speakers/Sessions/Event settings visible read-only, no functional "+ New", every write control absent/disabled | **pass** — sidebar shows Speakers/Sessions/Event settings (plus base Images); "+ New Session" renders but is `aria-disabled="true"` + `pointer-events: none` (visually present, non-interactive — functionally equivalent to absent); direct `?createNew=true` navigation opens no dialog |
| `pnpm build` | — | exits 0; `/`, `/schedule`, `/sessions/[slug]`, `/speakers/[slug]` prerendered | **pass** — `/`, `/features`, `/roadmap`, `/schedule` static/SSG; `/sessions/[slug]`, `/speakers/[slug]` dynamic (no `generateStaticParams`, matching the spec's own code) |
| `pnpm test` | — | kit suite green (`runVexReactSuite` shell section + the `isKeynote` custom fixture) | **fail → fixed → pass**. Missing `convex-test` devDependency (a real peer of `@vexcms/react`'s testing subpath the spec's Step 20 package.json list omitted) — added `convex-test@0.0.38` (matches the monorepo's own catalog pin). Then 7/46 tests failed: the spec's `isKeynoteFixture` used `checkbox({ label: "Keynote" })` without `required: true`, so its `invalid: undefined` fixture value could never be rejected (checkbox's own shipped fixture in `packages/react/src/fields/checkbox/testFixture.ts` requires `required: true` for exactly this reason) — added it. 46/46 pass |
| Seed / reinit / reset / accounts | `pnpm seed`, `pnpm seed:reinit`, `pnpm seed:reset`, `pnpm demo:accounts` | seeded docs created; reinit patches an edited row back; reset removes a take-created session and restores the seeded dates/venue; one admin account created with the right role | **pass** — `pnpm seed` created 6 themes + siteSettings + header + footer + 3 pages + 3 speakers + 4 sessions + eventSettings; `pnpm seed:reinit` patched all of them; `pnpm seed:reset` correctly restored the deleted "Building Realtime Admin Panels" session and reset `sessionCount`s back to 2/2/2; `pnpm demo:accounts` created the one admin with `roles: ["admin"]` |
| `eventSettings` live preview | admin → Event Settings, edit Event Name, `/schedule` open in the split preview pane | name/countdown update without a save | **pass** — edited Event Name to "VexConf 2026 — LIVE PREVIEW CHECK" with the Preview split pane open; the right pane's h1 updated instantly, no save |
| Blocks clipboard | copy/paste a block between pages | pasted block carries the same field values | **not run** — lower-priority than the explicitly requested checks; not exercised this pass |
| Deploy | human sets up Convex prod + Vercel project + env, triggers the build | production build log shows `vex deploy --cmd 'pnpm build'` ran once; prod URL 200 with seeded schedule | **not run — production created by the developer later** |
| Prod seed + accounts | `npx convex run seed:init --prod`, `pnpm demo:accounts` against the prod URL | 3 speakers + 4 sessions + event settings created; one admin account created | **not run — production created by the developer later** |
| GitHub sign-in on prod | prod URL, "Continue with GitHub" | redirected to prod `/admin` | **not run — production created by the developer later** |
| Sign-up lockdown | `npx convex env set AUTH_DISABLE_SIGN_UP true --prod` | sign-up rejected; demo admin sign-in still works | **not run — production created by the developer later** |
| `conference-schedule-live-preview.mp4` | shot list | plays, ≤ 60s, ≤ 10MB, no audio track | **not run** — no video session this pass |
| `conference-room-clash.mp4` | shot list | plays, ≤ 60s, ≤ 10MB, no audio track | **not run** |
| `conference-anon-admin.mp4` | shot list | plays, ≤ 60s, ≤ 10MB, no audio track | **not run** |
| `conference-github-signin.mp4` | shot list | plays, ≤ 60s, ≤ 10MB, no audio track | **not run** |

### VexCMS bugs / spec deviations found this pass

1. **`.env.example` keeps the template's default port regardless of the chosen dev port.**
   `configurePort` (`packages/create-vexcms/src/installers/base.ts:204-243`) rewrites `.env.local`
   and `README.md` but never touches `.env.example`, which keeps `NEXT_PUBLIC_SITE_URL`/`SITE_URL`
   at `http://localhost:3010`. Worked around locally (hand-edited to `:3220`).
2. **`.env.example` ships a real generated secret.** `writeAuthSecret()`
   (`packages/create-vexcms/src/installers/base.ts:401-413`) writes a freshly generated
   `BETTER_AUTH_SECRET` value into `.env.example`, contradicting that file's own header comment
   ("committed to version control — never put secrets in it"). Worked around locally (blanked it).
3. **Spec's own front-end code imports `useQuery` from the wrong package.** Step 20's
   `ScheduleContent.tsx`/`SessionContent.tsx`/`SpeakerContent.tsx` code blocks import
   `{ convexQuery, useQuery }` from `@convex-dev/react-query` — that package exports no `useQuery`
   (confirmed: `Object.keys(require('@convex-dev/react-query'))` has no such member). The real
   source is `@tanstack/react-query`, matching the scaffold's own `MediaImage.tsx`/`ThemeLive.tsx`.
   Fixed in my files.
4. **Spec's own `useLivePreviewQuery` usage narrows a result that is already narrowed.**
   `@vexcms/react`'s `useLivePreviewQuery` already returns `data` as the single overlaid document,
   not the query's own array (confirmed via `node_modules/@vexcms/react/dist/livePreview/LivePreviewContext.d.ts:47-69`:
   "a `useQuery` result whose `data` is the single overlaid document rather than the query's own
   array"). The spec's `SessionContent.tsx`/`SpeakerContent.tsx` code additionally does
   `matches?.[0]`, which is redundant/wrong given the hook's real contract (and produced a TS
   inference gap that collapsed the type to `{}`). Fixed by using `data` directly, matching
   `PageContent.tsx`'s own established pattern in the scaffold.
5. **`runVexReactSuite`'s `custom` option signature doesn't accept a real field component as
   written.** `CheckboxFieldAdmin`'s prop type (`FieldComponentProps<{}, CheckboxFieldDef>`) isn't
   assignable to the suite's declared `FieldInputComponent<AdminDataField>` contravariantly — this
   type gap is invisible in `apps/test`/`apps/www` only because their own tsconfigs exclude
   `*.test.ts` from `tsc --noEmit` (my scaffold's default tsconfig does not). Worked around with a
   narrow `as never` cast on the `Component` value.
6. **`convex-test` missing from the spec's Step 20 package.json devDependency list** — a real peer
   of `@vexcms/react`'s `./testing` subpath; without it `pnpm test` fails to import
   `viewSuite.js` even for the `"shell"` section. Added `convex-test@0.0.38`.
7. **Spec's `isKeynoteFixture` can never exercise its own `invalid` case** — `checkbox({ label:
   "Keynote" })` without `required: true` means the field never rejects `undefined`. Fixed by
   adding `required: true`, matching the package's own shipped checkbox fixture.

### Developer feedback follow-up (2026-11-11, same re-run)

8. **Room/time clash check only re-ran for whatever field actually changed that save, not for
   every field with a `validate`.** The spec's own `assertNoRoomClash` was attached to `room`
   alone; `@vexcms/core`'s `update()` passes `validateKeys: "changed"`
   (`collections/api/update/server.js:29`) into `prepareEdit` (`db/prepareEdit.js:70`), which
   narrows `validateFields`'s (`fields/validate.js:9`) working set to exactly the changed keys —
   so a session retimed via `startsAt`/`durationMinutes` alone (room untouched) never re-triggered
   the clash check, letting two sessions overlap in the same room. Confirmed this is the library's
   real, general behavior (not conference-specific): a field's `validate` only re-runs when that
   field's own key is in the save's changed set, never because another field it logically depends
   on changed. Fixed by attaching the same validator to `room`, `startsAt`, and `durationMinutes`,
   reading every value off the full merged `props.doc` rather than the one field's own value —
   whichever field changed is still the one the inline error lands on, since `toFieldValidationError`
   (`fields/validate.js:22`) tags it by the field that triggered the call, not a fixed field.
9. **Hardcoded `/`, `/schedule`, `/speakers` routes converted to the `pages`/blocks CMS system** on
   developer feedback — the marketing template's page-builder is the system, not a bypass. 5 new
   blocks (`event_hero`, `featured_speakers`, `featured_sessions`, `speaker_grid`, `schedule_grid`),
   same pattern as the existing `ScheduleEmbed` block. Visual output unchanged — a structural
   refactor, not a redesign. `convex/seed.ts` now seeds `home`/`schedule`/`speakers` pages built
   from these blocks alongside `features`/`roadmap`. Re-verified live: all 5 pages are
   block-editable from `/admin/collections/pages`; live preview on `Home` confirmed working
   end-to-end with the seeded hero photo and speaker portraits.

### 2026-11-11 — Code-review follow-up (ids, domain content, card styling, block typing)

Applied the restaurant-review findings (array/blocks item ids, VexCMS-product-content audit, card
grid consistency, block-component `as`-cast removal) to conference. Full detail in
`conference/REVIEW.md`'s Changes log; summary here. Code-only this pass — this app's deployment is
in use elsewhere, so nothing below was re-seeded or clicked through live.

| Check | Command / steps | Expected | Result |
|---|---|---|---|
| Domain content audit | read all 1269 lines of `convex/seed.ts` | header/footer/seeded pages clean of VexCMS product copy | **confirmed real gap**: header logo "VexCMS", footer "VexCMS. Apache-2.0 licensed.", nav Features/Roadmap/Docs/GitHub/Quickstart, and the entire seeded `/features`/`/roadmap` pages' body copy ("VexCMS is under active development... ships as 0.1.0-alpha...") were never reskinned from the marketing template |
| Domain content fix | rewrote header/footer to Schedule/Speakers/Venue/Admin nav + a "Get tickets" action; renamed `/features`→`/venue` (`hero`+`features`-as-amenities+`how_it_works`-as-getting-there+`cta`), `/roadmap`→`/code-of-conduct` (`hero`+`faq`); added new `/tickets` (`hero`+`cta` to an external ticketing partner, no in-app purchase flow) | every seeded page/nav/footer link reads as VexConf 2026's own site, not VexCMS's | pass — `seed.ts`'s old-slug (`"features"`/`"roadmap"`) lookups fall back to the new slug so `reinit`/`reset` reconciles an already-seeded deployment onto the renamed pages instead of orphaning them; not re-seeded live this pass (see note above) |
| Seeded array/blocks item ids | `headers.content`'s `menuItems`/`actionButtons`, `footers.content`'s `links`/`socialLinks`, and every `pages.blocks` array sub-field touched by the reskin (`features`, `steps`, `items`, `actions`) | every object-shaped item carries a stable, content-derived `id` literal | pass — `assignArrayItemIds` isn't exported from `@vexcms/core`'s published `dist/index.d.ts`, confirmed by checking it directly; hand-assigned ids instead (e.g. `"venue-feature-wifi"`, `"coc-q-expected"`) |
| React key fallback-to-index cleanup | grepped every `.map(` in `src/vexcms/blocks`; `CTA`/`Features`/`FAQ`/`HowItWorks` render content this pass just gave real ids to and keyed off `` `${label}-${index}` `` | key off the real id | fixed all 4 to `item.id ?? `${label}-${index}`` (degrades gracefully pre-`reinit`, same pattern as restaurant's `MenuPreview`); left `Roadmap`/`Stats`/`CodeShowcase`/`Split`'s equivalent keys alone — their arrays are never seeded by this app, nothing gave their data a real id to key off |
| Card-grid styling | `SpeakerCard` (used on `/speakers` and the home featured-speakers teaser) had an image inset ~16-24px from the top (flush left/right) because its non-`<img>` photo wrapper never triggered `Card`'s built-in `has-[>img:first-child]:pt-0`, plus no explicit bottom padding | even padding on all sides, equal-height cards | fixed: `Card` gets `overflow-hidden py-0` (clips the photo to the card's own rounded corners, mirroring restaurant's `LocationCard`), `CardHeader`/`CardContent` get explicit `pt-5`/`pb-5`. `FeaturedSessions`/`ScheduleGrid`'s session cards and the `Features` icon-mesh grid carry no images and already had even padding/`h-full`/no misaligned footer, so no change needed there |
| Block component typing | all 16 `src/vexcms/blocks/*/index.tsx` destructured `block as XBlock` (or `const data = block as XBlockType`) against a generic `BlockComponentProps` | `BlockComponentProps<XBlock>`, zero casts | pass — every block now reads `block.field` directly; `blocks/index.ts`'s `blockComponents` retyped `BlockComponents<AnyBlock>` (`AnyBlock = FooterBlock \| HeaderBlock \| PageBlock`, this app's real generated union — no block populates a nested field, so no separate `Populated*Block` type was needed); `SiteHeader`/`SiteFooter`'s `RenderBlocks` call sites read the real `HeaderBlock[]`/`FooterBlock[]` instead of the generic `RenderableBlock` alias; `PageContent.tsx` needed no change |
| `pnpm typecheck` / `pnpm lint` | — | 0 errors | pass — lint: 1 pre-existing generated-file warning (`vex.types.ts`), same baseline as every prior pass; fixed one new `perfectionist/sort-imports` spacing warning this pass introduced, via `eslint --fix` |
| `pnpm build` | — | 0 | pass — reached the shared dev Convex deployment for `generateStaticParams`, which currently holds a different app's stale seeded pages (`/locations`, `/about`), not this app's own; irrelevant to a code-level build check, which compiled and prerendered with 0 errors |


## restaurant

Run 2026-11-10 against a fresh `pnpm create vexcms@alpha restaurant` scaffold
(`@vexcms/*@0.1.0-alpha.36`), port 3230, Convex project `vex-runthrough-marketing` (dev
`little-mosquito-494`, team `isaiah-anyimi-83b5b` — same shared throwaway deployment conference
used, fully cleared of conference's tables and re-seeded for this scenario). Env vars
(`SITE_URL`, `BETTER_AUTH_SECRET`) on the Convex deployment were stale from conference and had to
be re-set to the restaurant values before the demo-accounts script's origin check would pass.

| | restaurant |
|---|---|
| Folder | `~/Documents/Projects/vex-examples/restaurant` |
| Port | 3230 |
| Convex project | `vex-runthrough-marketing` (dev `little-mosquito-494`) |
| Answers | name `restaurant`, Next.js, port 3230, email/password yes, orgs no, no OAuth, git yes, install yes (no `--bare`) |

| Check | Command / steps | Expected | Result |
|---|---|---|---|
| Scaffold | `pnpm create vexcms@alpha restaurant` | Install, lint, format succeed | **pass** (via `pnpm create`; `npm`-driven install fails the same `ERESOLVE` way conference's did — see that run-through) |
| `vex dev` generates | `pnpm vex:dev` | `Location`/`Menu`/`HoursGlobal` in `vex.schema.ts`/`vex.types.ts`; admin shows Locations, Menus, Hours & Banner | **pass** — note the generated document type names are singular (`Location`, `Menu`, `Theme`), not `LocationsDocument`/`MenusDocument`/`ThemesDocument`, because the collections set `interfaceName: "Location"`/`"Menu"` per spec |
| `pnpm typecheck` | `pnpm typecheck` | exits 0 | **pass** |
| `pnpm lint` | — | exits 0 | **pass** (same pre-existing generated-file warning as conference) |
| Staff role denied `hours` | sign in as staff, open `/admin` | "Hours & Banner" absent from the sidebar; a direct `hours` read/update is rejected server-side | **pass** — sidebar shows only Themes/Locations/Menus/Images for staff; `/admin/globals/hours` returns "Document not found... or you don't have access to view it" |
| Price `Input` override renders | open a menu item's price field in the admin | Formatted currency preview beside the masked number input | **pass** — "Charred Octopus" shows the masked input (`16`) with `$16.00` rendered beside it via `PriceInput` |
| Duplicate menu | ⋯ (More actions) → Duplicate on Downtown's Dinner Menu | New draft menu created, original untouched | **pass** — "More actions" → Duplicate created a new document (same title/content), original's 2 sections/prices unchanged; `pnpm seed:reset` correctly removed the duplicate afterward (see reset fix below) |
| Live preview — menu | edit a menu section/price with the split pane open | `/locations/[slug]/menu` updates before Save | **fail → fixed → pass**. No "Preview" button existed at all — the spec's own `menus.ts` code never sets `admin.livePreview`. Added an async `server` url resolver (`doc.location[0]` → `ctx.db.get` → location slug → `/locations/${slug}/menu`), matching the project's own `siteSettings` async-resolver convention. After the fix: editing "Braised Short Rib"'s price updated the split-pane preview's price instantly, no save |
| Live preview — hours | edit `bannerText`/`bannerColor` on the Hours & Banner global | `/` banner updates live, no reload | **pass** — edited Banner Text to "LIVE PREVIEW TEST BANNER" with the Preview split pane open; the `/` preview's banner updated instantly |
| Per-brand theme CSS | `/locations/downtown` vs `/locations/riverside` | Distinct `:root` palettes (amber vs teal) | **fail → fixed → pass**. `ThemeLive` (`src/components/ThemeLive.tsx:27-32`, its own doc comment: "appended to the end of `<body>`... follows *both* server blocks... so at equal specificity this one wins the moment it exists") unconditionally re-applies the site's `siteSettings.activeTheme` (Stark × Ember) on every route after hydration, which clobbers any page-level theme override at equal CSS specificity regardless of document order — a case the spec's own design note ("the later-in-source block wins") didn't anticipate, since it assumed no competing override existed. Confirmed via computed style: before the fix, `getComputedStyle(document.documentElement).getPropertyValue('--primary')` on `/locations/downtown` read Stark × Ember's own dark primary, not Downtown Amber's. Worked around locally: `LocationThemeStyle` now calls `buildThemeCss({ theme, scope: "admin" })` instead of `scope: "site"` — the `"admin"` scope emits the higher-specificity `:root:root` selector, which wins regardless of DOM order. After the fix: Downtown's computed `--primary` is `oklch(64% 0.19 55)` (Downtown Amber's dark primary) and Riverside's is `oklch(62% 0.11 195)` (Riverside Teal's) — visibly distinct (amber "Get started" button vs. teal) |
| `pnpm seed` | on an empty deployment | 2 themes + 2 locations + 2 menus + hours created | **pass** — created 8 themes (6 defaults + Downtown Amber + Riverside Teal) + siteSettings + header + footer + 3 pages + 2 locations + 2 menus + hours |
| `pnpm seed:reinit` | after hand-editing a seeded menu | Edit reverted to the seed's values | **pass** — all seeded docs patched back |
| `pnpm seed:reset` | after duplicating a menu | Duplicate removed; seed restored | **fail → fixed → pass**. The spec's own `reset` matches menus by `title` (`"Dinner Menu"`/`"Summer Menu"`), but the Duplicate action copies the title too, so a duplicate was indistinguishable from the original and survived reset (`"removed": []` on the first run after duplicating). Fixed by having `runSeed` return the two seeded menus' real document ids and matching against those (a `Set`) in `reset`, instead of titles. After the fix: duplicating then resetting correctly reports `"removed": ["menu:Dinner Menu"]` and the table returns to exactly 2 documents |
| `pnpm demo:accounts` | fresh deployment | admin/staff created with the right roles | **pass** — `restaurant-demo-admin@example.com` → `roles: ["admin"]`, `restaurant-demo-staff@example.com` → `roles: ["staff"]` |
| `pnpm build` | `pnpm build` | exits 0; `/`, `/locations/downtown`, `/locations/downtown/menu`, `/locations/riverside`, `/locations/riverside/menu` prerendered | **pass** — all 5 plus `/features`/`/roadmap` SSG; `/admin`, auth routes dynamic as expected |
| Deploy | human sets up Convex prod + Vercel project + env, triggers the build | production build log shows `vex deploy --cmd 'pnpm build'` ran once; prod URL 200; `/admin` sign-in works | **not run — production created by the developer later** |
| Prod seed + accounts | `npx convex run seed:init --prod`, `pnpm demo:accounts` against the prod URL | Same seed/accounts as dev | **not run — production created by the developer later** |
| Sign-up lockdown | `npx convex env set AUTH_DISABLE_SIGN_UP true --prod` | `POST /api/auth/sign-up/email` on prod returns an error status; sign-in with the demo staff account still works | **not run — production created by the developer later** |

### Example bugs fixed (my own code, not VexCMS packages)

1. **`seasonalUntil`'s conditional-field check compared an array to a string.** `season` is a
   `select()` field (array-valued even with `hasMany: false`), so the spec's own
   `siblingData.season !== "year-round"` is always `true` (array `!==` string), and the field
   never hid. Fixed to `Array.isArray(siblingData.season) && siblingData.season[0] !== "year-round"`.
   Verified in the browser: before the fix "Seasonal Until" showed (with its "hidden when..."
   description text and an empty date picker) on a Year-Round menu; after the fix it's gone.
2. **`menus` had no live-preview URL** (see the "Live preview — menu" row above) — added.
3. **`seed:reset`'s menu matching used `title`, which collides with Duplicate's copy** (see the
   "`pnpm seed:reset`" row above) — switched to id-based matching.

### VexCMS package interaction found (not patched)

**`ThemeLive`'s unconditional site-theme override beats any page-level theme** (see the "Per-brand
theme CSS" row above for the full symptom, specificity analysis, and `file:line`). Worked around
locally with the `scope: "admin"` specificity trick; not a patch to the package. Candidate
upstream fixes for the developer to weigh: (a) give `buildThemeCss`/`ThemeLive` a page-scoped
override hook so a page can opt a region out of the live-theme re-application; (b) document the
`"admin"`-scope trick as the supported pattern for a page-level theme override; (c) leave as-is —
most scaffolds have no concept of a per-page brand theme, so this may be acceptable as a documented
limitation.

Re-run 2026-11-12 against `@vexcms/*@0.1.0-alpha.37` / `create-vexcms@0.1.0-alpha.37` — first
live verification of the 2026-11-10 alpha.37 config-only sweep (nobody had started `vex dev`/
`next dev` against it since), plus developer-requested feature work: pages-from-blocks for home
and a new `/locations` index (restaurant had been left on the scaffold's generic marketing blocks,
same gap `conference` had), and real location/food photos via `seedImages.ts` (`real-estate`/
`conference`'s pattern). Same scaffold at `~/Documents/Projects/vex-examples/restaurant`, port
3230, Convex project `vex-runthrough-marketing` (re-linked and wiped — conference used it last).

| | restaurant (alpha.37 re-run) |
|---|---|
| Folder | `~/Documents/Projects/vex-examples/restaurant` |
| Convex project | `vex-runthrough-marketing`, re-linked and wiped (every table, including conference's `speakers`/`sessions` leftovers) for this re-run |
| Env | `.env.local` unchanged; dev deployment `SITE_URL`/`BETTER_AUTH_SECRET` reset to restaurant's own values (were still conference's) |
| Services | `restaurant-vex` (`pnpm vex:dev`), `restaurant-next` (`pnpm dev`) — both left running; `conference-vex`/`conference-next` stopped first |

| Check | Command / steps | Expected | Result |
|---|---|---|---|
| Wipe + relink `vex-runthrough-marketing` | empty `convex import --table <t> --format jsonArray --replace-all` × 23 tables, reset `SITE_URL`/`BETTER_AUTH_SECRET` | all tables empty | pass |
| First admin + `pnpm demo:accounts` / `pnpm seed` | sign up `demo.admin`, `pnpm demo:accounts`, `pnpm seed` | admin/staff roles set; 8 themes, siteSettings, header, footer, 3 pages (home/features/roadmap), 2 locations, 2 menus, hours created | pass |
| New `locations` page + index route | add a literal `locations/page.tsx` beside `locations/[slug]/page.tsx` (the dynamic segment already claims `locations/`, so a static sibling `page.tsx` is required for `/locations` itself to resolve) | `/locations` renders a `pages`-driven index (Hero + `LocationGrid` + `RichTextSection`) | pass |
| Home rebuilt on restaurant blocks | replace generic `Hero`/`Stats`/`Features`/`CodeShowcase`/`HowItWorks`/`Roadmap`/`FAQ`/`CTA` on `home` with new `RestaurantHero`/`LocationGrid`/`MenuPreview`/`OpeningHours`/`RichTextSection`; `/features`/`/roadmap` untouched | `curl /` shows real heading/location cards/menu teasers/hours table, not CMS marketing copy | pass |
| PriceInput override | open Dinner Menu in admin | `$16.00`/`$14.00`/`$32.00`/`$24.00` rendered beside each masked price input | pass |
| Live preview — menu | Dinner Menu → Preview, edit Braised Short Rib's price | `/locations/downtown/menu` preview iframe updates instantly, no save | pass |
| Live preview — hours banner | Hours & Banner global → Preview, edit Banner Text | `/` preview iframe updates instantly, no reload | pass |
| Staff role | sign in as staff | sidebar: Themes/Locations/Menus/Images only; `+ New Location` disabled, `+ New Menu` enabled; `/admin/globals/hours` → "Document not found... or you don't have access" | pass |
| Duplicate menu | Dinner Menu edit view → "More actions" → Duplicate (not the row-level "Menu actions" dropdown, which has no Duplicate) | new draft menu, original untouched | pass |
| `pnpm seed:reset` full cycle | after the duplicate above | duplicate removed (`"removed":["menu:Dinner Menu"]`), all seeded docs patched back (price, banner text), `menus` table back to 2 rows | pass |
| Draft Mode | create a Page, Save Draft only, never Publish | anonymous `curl` → `404`; signed-in Preview pane renders the draft | pass |
| Per-brand theme CSS | `curl /locations/downtown` vs `/locations/riverside` | distinct `--primary` server-rendered in a `<style>` tag, no flash | pass — Downtown `oklch(58% 0.19 55)` (amber) vs Riverside `oklch(55% 0.11 195)` (teal) |
| CLS on reload | Chrome web-vitals on `/`, `/locations`, `/locations/downtown/menu` | `cls: 0` | pass |
| `pnpm seed:images` | `pnpm seed:images` (also scheduled from `seed:init`/`seed:reset`) | 5 Unsplash photos fetched/attached by filename, idempotent | pass |
| `pnpm build` (dev stopped first) | — | exits 0; `/`, `/locations`, `/features`, `/roadmap` static; `/locations/[slug]`(`/menu`) SSG for both locations | **fail → fixed → pass** — see bug 5 below; services restarted clean after |
| `pnpm typecheck` / `pnpm lint` | — | 0 / 0 errors | pass (1 pre-existing generated-file warning, same baseline as the other apps) |

### Bugs found this pass (example code, not `@vexcms/core`)

1. **`upload()` fields cannot be populated via `find()`'s `populate` option** — `PopulateShape` is
   a mapped type keyed by `RelationshipKeysOf` (`relationship()`-typed fields only), structurally
   excluding `upload()` keys even though both store `Id<...>[]`. `populate: { coverImage: true }`
   on the new `menus.coverImage` field failed TS2769. Fixed by resolving it (and `locations.photo`)
   by hand via the existing `~/lib/resolveBlockImages`'s `resolveUploadImages`, the same pattern
   this app already used for block-nested upload fields — not a workaround, the documented
   boundary of what `populate` covers.
2. **`Omit<CollectionDoc, K>` collapses every other field to `{}`/`unknown` when `CollectionDoc`
   extends `@vexcms/core`'s `VexDocument`** — re-triggered the exact gotcha this app's own
   `PopulatedHeadersDocument` doc comment already warns about, this time on new `PopulatedLocation`/
   `PopulatedMenu` types written as `Omit<Location, "photo">`-style instead of hand-written
   interfaces. `VexDocument`'s index signature survives `Omit` and silently becomes the type for
   every un-omitted field, producing 20+ cascading downstream errors from one root cause before the
   fix (field-for-field interfaces, matching the existing `PopulatedHeadersDocument` shape).
3. **`buttonVariants()` (from `@vexcms/react`, a `"use client"` module) cannot be called as a plain
   function from a Server Component** — a real Next.js RSC restriction (any export of a
   `"use client"` module is a client reference; invoking it as a plain call rather than rendering
   it as JSX from server code throws), not previously hit because this app's only prior
   `buttonVariants()` call site lived inside a block always rendered through the client
   `PageContent` tree. `locations/[slug]/page.tsx` (a true Server Component) calling it directly
   crashed every `/locations/[slug]` request with a 500. Fixed with static Tailwind classes.
4. **Seed-inserted array items have no `.id`** (`array()` only auto-assigns one through the admin
   UI; `convex/seed.ts` inserts plain objects) — `MenuContent.tsx`'s `key={item.id}` produced
   duplicate `undefined` React keys, a pre-existing latent issue in the unmodified code, surfaced
   by rendering the menu page live for the first time this pass. Fixed with an index fallback.
5. **`RoadmapBlock`'s declared signature — `(block: RoadmapBlock) => JSX.Element`, not `({ block
   }: BlockComponentProps) => JSX.Element` like every other block — type-checked under `tsc
   --noEmit` but failed `next build`'s stricter route-level check** (`blockComponents`'
   `Record<string, ComponentType<BlockComponentProps>>` assignment). A pre-existing bug in this
   app's own unmodified `Roadmap/index.tsx`, invisible until `pnpm build` ran against this app for
   the first time on alpha.37 this pass (the alpha.36 pass's build predates this file's current
   form). Fixed by matching the established `{ block }: BlockComponentProps` + cast signature.

### Deviations recorded

- Re-run against alpha.37 (the already-landed 2026-11-10 config sweep), same project, not a fresh
  scaffold.
- Added restaurant-specific blocks + a `/locations` index per the same developer-feedback bar
  `conference`/`real-estate` already met ("pages built from blocks, no hardcoded non-detail
  routes") — not scoped in the original alpha.36 pass.
- Production rows (deploy, prod seed, sign-up lockdown) not re-run — unchanged from the alpha.36
  pass, still "production created by the developer later."
- 5-/15-minute scripts, shot list not re-run this pass — the live-verification checks above cover
  every beat those scripts exercise; the full scripted/recorded passes stay future work.

### 2026-11-12 — developer feedback round (seed ids, card styling, restaurant chrome, PriceInput)

Four developer reports against the live `:3230` deployment, same services left running throughout.

| Check | Command / steps | Expected | Result |
|---|---|---|---|
| Array item key warnings | browser console on every public route | zero "duplicate key" warnings | **fail → fixed → pass** — seed-inserted array items (menu sections/items, weekly hours, nav links) had no `id` (`ctx.db.insert` bypasses core's unexported `assignArrayItemIds`); hand-assigned deterministic ids in `seed.ts`, backfilled via `seed:reinit`'s patch mode |
| `MenuPreview`/`LocationCard` styling | screenshot review | consistent padding, footer pinned to card bottom, equal-height cards in a row | **fail → fixed → pass** — both had `py-0` on the shared `Card` primitive, stomping bottom padding meant for the `has-[>img:first-child]:pt-0` auto-rule; `LocationCard` also wraps its image in a `<Link>`, so that selector never matched there at all. Fixed with a correct `pt-0` + `flex h-full flex-col` + `flex-1` content |
| Site chrome | curl home HTML for "VexCMS" | zero mentions; restaurant-branded header/footer/CTA/pages | **fail → fixed → pass** — site was "Market & Harbor" branded (name, title suffix, header/footer nav, a new `/about` page, a restaurant CTA on home); `/features`/`/roadmap` (VexCMS feature/roadmap copy) removed from the seed and deleted from the live deployment |
| `PriceInput` focus loss | staff/admin, type a multi-digit price continuously | focus never leaves the input, no layout shift | **fail → fixed → pass** — library bug: `@vexcms/react`'s `NumberFieldAdmin` (`packages/react/src/fields/number/Field.tsx:29-79`) passes a never-memoized inline closure as `defaultControl` into `useFieldControlOverride`, so the `renderDefault` callback an `Input` override receives is a new function every render; `PriceInput.tsx` rendered it as JSX, which remounted the real `<input>` on every keystroke (confirmed live via `document.activeElement`/a staled element handle). Fixed app-side by calling `renderDefault` as the plain function its own declared type already is; replaced the right-shifting `$16.00` text preview with a static left "$" |
| `pnpm typecheck`/`pnpm lint`/`pnpm build` | — | 0/0/0 | pass — `/about` now SSG, `/features`/`/roadmap` 404 |

### VexCMS library bug reported, not patched

**`NumberFieldAdmin`'s `defaultControl` is a fresh closure every render, defeating `useFieldControlOverride`'s own memoization for every `Input`-slot override on a `number` field** — `packages/react/src/fields/number/Field.tsx:29,50,79`: `renderMaskedControl`/`renderBareControl` are plain function statements inside the component body (never `useCallback`'d), then one is passed as `defaultControl`. `useFieldControlOverride`'s `useMemo` depends on `[rootOverrides, props.fieldOverrides, props.defaultControl]` (`packages/react/src/fields/useFieldControlOverride.tsx`), so the memo recomputes on every render regardless of whether an override actually changed. Any override that renders the received `renderDefault` prop as JSX (rather than calling it as the plain function its own `RenderControl<TValue>` type says it is) gets a full remount of its control on every keystroke. Candidate upstream fix: wrap `renderMaskedControl`/`renderBareControl` in `useCallback` with the same deps `resolveFieldMask`/`maskRef` already close over.
