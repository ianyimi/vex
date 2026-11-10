# Real estate — playbook

## Stage tags

`real-estate/01-scaffold`, `02-collections`, `03-access`, `04-seed`, `05-front-end`, `06-deployed`
(`07-v0.1.0` after Release). The 15-minute script scaffolds live, then resumes from a tag;
`pnpm seed:reset` restores the tagged stage's data between takes.

## Accounts

| Role | Env var | Sees |
|---|---|---|
| Admin | `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD` | Everything |
| Broker (Priya Shah) | `DEMO_BROKER_EMAIL` / `DEMO_BROKER_PASSWORD` | Every listing + agent, commission included |
| Agent (Dana Reyes) | `DEMO_AGENT1_EMAIL` / `DEMO_AGENT1_PASSWORD` | Own listings only, no commission |
| Agent (Marcus Webb) | `DEMO_AGENT2_EMAIL` / `DEMO_AGENT2_PASSWORD` | Own listings only, no commission |

Created by `pnpm demo:accounts`. Elena Castillo is a seeded agent profile with no login — she
owns 2 of the 8 seeded listings, demonstrating a roster entry that predates any account link.

## Seed data

3 agents: Dana Reyes, Marcus Webb, Elena Castillo.

8 listings: Craftsman Bungalow on Maple (sale, active, Dana), Downtown Loft with City Views
(rent, active, Dana), Lakeside Cottage Retreat (sale, pending, Marcus), Modern Townhome Near
Transit (rent, active, Marcus), Historic Victorian Restoration (sale, sold, Dana), Garden-Level
Studio (rent, active, Elena), Ranch House with Acreage (sale, active, Marcus), Riverside Duplex
Investment (sale, pending, Elena).

## Launch day

D4 alternate (owner rules, field maps, saved views, bulk action).

## Start state + reset

`pnpm seed:reset` between every script and every shot — deletes any listing/agent a take
created that isn't in `convex/seed.ts`'s own arrays, then reconciles the 3 agents + 8 listings
back to seeded values. Re-run `pnpm demo:accounts` only after a full redeploy (accounts persist
across a `reset`, roles don't need resetting).

## 5-minute script

Starts from `05-front-end` with seeded data; one live change.

| # | Budget | Start (tag) | On screen | Proves (F-id + doc link) | Gap callout |
|---|---|---|---|---|---|
| 1 | 0:30 | `05-front-end` | `/listings`, type "loft" in the search box | F28, F49 — [Pagination](https://docs.vexcms.dev/guides/pagination/), [Local API](https://docs.vexcms.dev/guides/local-api/) | — |
| 2 | 1:00 | — | `/admin` as Dana — "My active listings" tab, only Dana's rows | F24–F26, F39 — [List views](https://docs.vexcms.dev/guides/list-views/), [Access control](https://docs.vexcms.dev/guides/access-control/) | — |
| 3 | 1:00 | — | Open the "Lakeside Cottage Retreat" edit form as Dana — no Commission field; switch to broker, same document, Commission visible | F40 — [Access control § Field-level permissions](https://docs.vexcms.dev/guides/access-control/#field-level-permissions) | — |
| 4 | 1:00 | — | Select 2 of Dana's own listings, run "Mark sold"; select one of Marcus's as Dana, run it again — rejected | F27, F42, F25 — [List views § Slot contributions](https://docs.vexcms.dev/guides/list-views/#slot-contributions), [Access control](https://docs.vexcms.dev/guides/access-control/) | No enquiry form on `/listings/[slug]` — visitors have no way to contact an agent in-app (#57) |
| 5 | 1:30 | — | Change `price` on an active sale listing in the admin, switch `listingType` to "rent" live, watch Pricing tab swap to Monthly Rent/Deposit | F20, F22 — [tabs](https://docs.vexcms.dev/fields/tabs/), [Conditional fields & masks](https://docs.vexcms.dev/guides/conditional-fields-and-masks/) | — |

## 15-minute script

Scaffolds live, jumps across tags, ends on the deploy beat (shown from this step's run-through
transcript, never a live prod deploy).

| # | Budget | Start (tag) | On screen | Proves (F-id + doc link) | Gap callout |
|---|---|---|---|---|---|
| 1 | 1:30 | — | `pnpm create vexcms@alpha real-estate --bare`, first sign-up | F55, F37 — [Quickstart](https://docs.vexcms.dev/guides/quickstart/), [Auth](https://docs.vexcms.dev/guides/auth/) | — |
| 2 | 2:30 | `02-collections` (resume) | `src/vexcms/collections/listings.ts` — tabs/row/collapsible, `listingType` select, conditional Pricing tab, masked Price/Rent, upload gallery with `accept` | F20, F22, F14/F36 — [tabs](https://docs.vexcms.dev/fields/tabs/), [upload](https://docs.vexcms.dev/fields/upload/) | No geo/map search on `/listings` — the search box matches titles only, never a radius or map draw |
| 3 | 2:00 | `03-access` (resume) | `src/auth/access.ts` — the agent role's owner `withIndex` + `commission` field map; `vex telemetry status` in a terminal beside it, showing the config's `features.access.fieldPermissionRuleCount` | F39, F40, F54 — [Access control](https://docs.vexcms.dev/guides/access-control/), [Telemetry](https://docs.vexcms.dev/guides/telemetry/) | — |
| 4 | 2:00 | — | `/admin/collections/listings` as broker — open the Filter popover, build an AND/OR filter on `status` + `listingType`, then open a row's peek panel | F24, F26 — [List views § Filtering](https://docs.vexcms.dev/guides/list-views/#filtering), [§ The peek panel](https://docs.vexcms.dev/guides/list-views/#the-peek-inspect-panel) | — |
| 5 | 1:30 | — | "Mark sold" bulk action, own listing succeeds, another agent's rejects | F27, F42 | No enquiry form (#57) |
| 6 | 2:00 | `05-front-end` (resume) | `/listings?q=`, `/listings/[slug]` gallery, `/agents/[slug]` | F49, F50 — [Local API](https://docs.vexcms.dev/guides/local-api/), [Caching, sitemaps and revalidation](https://docs.vexcms.dev/guides/caching-and-seo/) | — |
| 7 | 2:30 | `06-deployed` (resume, from transcript) | Step 17's run-through: production build log, prod URL open in a browser, sign-up lockdown check | F53 — [Deployment](https://docs.vexcms.dev/guides/deployment/) | — |

## Shot list

| File | ≤ 60 s | Shows | From | Day |
|---|---|---|---|---|
| `real-estate-tabbed-listing-form.mp4` | ✓ | `listingType` toggled sale ↔ rent, the Pricing tab's fields swapping, a masked price typed | `/admin/collections/listings/<id>` edit view, :3210 | D4 alt |
| `real-estate-owner-rules-bulk-action.mp4` | ✓ | Dana's "My active listings" tab, Commission absent from her edit form, "Mark sold" rejected on another agent's row then succeeding on her own | `/admin`, two signed-in sessions, :3210 | D4 alt |
| `real-estate-search-and-gallery.mp4` | ✓ | `/listings?q=` returning a match, the result's `/listings/[slug]` gallery | :3210, public site | D4 alt |

Silent clips only (no audio track), H.264, ≤ 10 MB — `media-session.md`'s encode rules.
