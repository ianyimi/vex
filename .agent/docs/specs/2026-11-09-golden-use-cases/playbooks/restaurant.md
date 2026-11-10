# Restaurant — playbook

Private. D2 alternate (`launch-kit.md` § Day facts, Design Decision 3): menu + hours global live
preview, where magazine's D2 clip used an article.

## Stage tags

`restaurant/01-scaffold` … `restaurant/06-deployed`, then `restaurant/07-v0.1.0` after Release
(Step 27). The 15-minute script scaffolds live, then resumes from `02-collections` /
`03-access` / `04-seed`; `pnpm seed:reset` restores the start state between takes (Design
Decision 9).

## Accounts

| Role | Email | Password | Can |
|---|---|---|---|
| admin | `$DEMO_ADMIN_EMAIL` | `$DEMO_ADMIN_PASSWORD` | everything |
| staff | `$DEMO_STAFF_EMAIL` | `$DEMO_STAFF_PASSWORD` | edit `menus`, read `locations`/`images`/`themes`, no `hours` |

Created by `pnpm demo:accounts` (`scripts/create-demo-accounts.mjs` → `demoAccounts:setRoles`).
Credentials live in the gitignored `.env.local`, never committed (`.env.example` lists the names).

## Seed data

- Themes: Stark × Ember (scaffold default, inactive here), **Downtown Amber**, **Riverside Teal**
- Locations: **Downtown** (118 Market St, brand theme Downtown Amber), **Riverside** (42 Harbor Ln,
  brand theme Riverside Teal)
- Menus: Downtown's **Dinner Menu** (year-round, Starters/Mains), Riverside's **Summer Menu**
  (season Summer, seasonal until 2027-09-01, Small Plates/Entrées)
- Hours & Banner: Mon–Sun weekly hours, banner "Now taking holiday reservations — call your
  nearest location." on `#b45309`

## Launch day

D2 alternate. Paired with magazine's own D2 clip (live preview) in the same day's posts — this
scenario's clip shows the SAME feature (F33/F34 live preview) from a structured-data angle
(array/group menu sections, a global banner) instead of richtext.

## Start state + reset

Start every script from `restaurant/05-front-end` with `pnpm seed` already run. `pnpm seed:reset`
between scripts: patches the 2 themes/2 locations/2 menus/hours back to seed values, then deletes
any location or menu a take created that isn't one of the 4 seeded documents.

## 5-minute script

| # | Budget | Start (tag) | On screen | Proves (F-id + doc link) | Gap callout |
|---|---|---|---|---|---|
| 1 | 0:30 | `05-front-end` | `/locations/downtown` → `/locations/downtown/menu` | F49, F50 ([Local API](https://docs.vexcms.dev/guides/local-api/), [Caching, sitemaps & revalidation](https://docs.vexcms.dev/guides/caching-and-seo/)) | |
| 2 | 1:00 | — | Downtown's amber theme vs. `/locations/riverside`'s teal theme, side by side | F18, F48 ([Theming](https://docs.vexcms.dev/guides/theming/)) | |
| 3 | 1:30 | — | `/admin` sign in as staff; Menus list shows only what staff can edit; Hours & Banner absent from the sidebar | F39/F40 ([Access Control](https://docs.vexcms.dev/guides/access-control/)) | |
| 4 | 1:30 | — | Open Downtown's Dinner Menu, change "Braised Short Rib" to \$34 in the split-pane editor — `/locations/downtown/menu` updates before Save | F33, F46 ([Live Preview](https://docs.vexcms.dev/guides/live-preview/), [Admin Customization](https://docs.vexcms.dev/guides/admin-customization/) — the price field's formatted-currency `Input` override) | |
| 5 | 0:30 | — | admin → Hours & Banner global, change banner text/color — `/` banner updates live, no reload | F3, F34 ([Globals](https://docs.vexcms.dev/guides/globals/), [Live Preview](https://docs.vexcms.dev/guides/live-preview/)) | A visitor-submitted online-order form would need the form builder — `inventory.md` "Not shipped", #57 |

## 15-minute script

| # | Budget | Start (tag) | On screen | Proves (F-id + doc link) | Gap callout |
|---|---|---|---|---|---|
| 1 | 2:00 | — (scaffold live) | `pnpm create vexcms@alpha restaurant`, 8 prompts answered, port 3230 | F55, F1, F52 ([Quickstart](https://docs.vexcms.dev/guides/quickstart/)) | |
| 2 | 2:30 | `02-collections` | `locations`/`menus` in `vex.config.ts` → `convex/vex.schema.ts`/`vex.types.ts` regenerate; admin shows Locations/Menus/Hours & Banner | F1, F2, F15, F16, F3 ([Fields: array](https://docs.vexcms.dev/fields/array/), [group](https://docs.vexcms.dev/fields/group/), [Globals](https://docs.vexcms.dev/guides/globals/)) | |
| 3 | 2:00 | `03-access` | `access.ts`'s `staff` role; `PriceInput.tsx`'s currency preview; duplicate Downtown's Dinner Menu via the ⋯ menu's Duplicate for "next season" | F39, F40, F46, F29 ([Access Control](https://docs.vexcms.dev/guides/access-control/), [Admin Customization](https://docs.vexcms.dev/guides/admin-customization/)) | |
| 4 | 2:00 | `04-seed` | `pnpm seed`, `pnpm seed:reinit` after a hand-edit, `pnpm seed:reset` after duplicating a menu, `pnpm demo:accounts` | F55 scaffold lifecycle | |
| 5 | 2:00 | `05-front-end` | both locations' theme CSS, the live-preview menu edit and hours-banner edit from the 5-minute script | F18, F33, F34, F48 | same #57 callout as the 5-minute script, plus: a reservations integration would need outbound webhooks — `inventory.md` "Not shipped", #60 |
| 6 | 3:00 | — | Step 25's run-through transcript (`golden-runthrough.md` § restaurant), narrated from the recording — never a live prod deploy (Design Decision 11) | F53, F55 ([Deployment guide](https://docs.vexcms.dev/guides/deployment/)) | |

## Shot list

| File | ≤ 60 s | Shows | From | Day |
|---|---|---|---|---|
| `restaurant-live-preview.mp4` | yes | Editing a menu item's price, `/locations/downtown/menu` updating before Save | 5-min #4 | D2 |
| `restaurant-banner-live.mp4` | yes | Editing the hours banner, `/` updating without reload | 5-min #5 | D2 |
| `restaurant-brand-themes.mp4` | yes | Downtown (amber) vs. Riverside (teal) side by side | 5-min #2 | D2 |
| `restaurant-duplicate-menu.mp4` | yes | ⋯ menu → Duplicate on a menu, staff-role sidebar missing Hours & Banner | 15-min #3 | D2 |

Encoded per `media-session.md`'s rules: H.264, no audio track, ≤ 60 s, ≤ 10 MB, silent (no spoken
sentences recorded — the developer narrates live, Design Decision 11).

## Run status notes (local run, 2026-11-10)

All beats ran and passed against the real local app — see `runthrough-restaurant.md`. Two defects
found and fixed in the example during this run (not spec/package bugs unless noted there):
the `seasonalUntil` conditional-field check compared the `season` select's array value against a
bare string (always true, never hid the field) and `menus` had no `admin.livePreview.url`, so the
split-pane preview never appeared until an async `server` resolver was added. One VexCMS-level
cascade interaction was found and worked around locally — `ThemeLive`'s unconditional site-theme
re-application beats any page-level theme override once hydration completes; `LocationThemeStyle`
now emits at the `"admin"` (higher-specificity) scope to win regardless of DOM order — see the
run-through for the full symptom and file:line.
