# Conference playbook

Private. D3/D4 alternate (`launch-kit.md` day themes): config → blocks + global, cross-document
validation.

## Stage tags

`conference/01-scaffold`, `02-collections`, `03-access`, `04-seed`, `05-front-end`, `06-deployed`,
`07-v0.1.0` (Step 27).

## Accounts

One admin (first sign-up, email/password) plus GitHub OAuth sign-in on the same admin user — no
second role: `sessions`/`speakers`/`eventSettings` are read-only for everyone else via `anonRole`,
so there is no editor/author pair to demo. `scripts/create-demo-accounts.mjs` creates the one admin
(`DEMO_ADMIN_EMAIL`/`DEMO_ADMIN_PASSWORD`, `.env.local`, gitignored) via the running app's
`/api/auth/sign-up/email` route, then `npx convex run demoAccounts:setRoles`.

## Seed data

- Speakers: Ada Okafor, Marcus Chen, Priya Natarajan (name, slug, bio, `sessionCount` computed from
  the sessions below).
- Sessions: "Opening Keynote: The Next Decade of Convex" (keynote, Hall A, Engineering), "Building
  Realtime Admin Panels" (Hall B, Engineering), "Designing for Product-Led Growth" (Hall A, Product),
  "Panel: Scaling Open Source CMS" (Hall B, Product, all three speakers).
- Event settings: "VexConf 2026", two-day dates, Fog City Convention Center.

## Launch day

D3/D4 (config → collections/blocks/global; RBAC + cross-document validation).

## Start state + reset

Live demos start from `05-front-end` with `pnpm seed` already run. `pnpm seed:reset` between takes:
reinserts/patches every seeded speaker and session, deletes any speaker or session a take created
that is not in the seed, and restores `eventSettings` to the seeded dates/venue.

## 5-minute script

Starts from `05-front-end`, seeded data already live. One live change: edit `eventSettings`'s dates
in the admin panel and watch `/schedule`'s countdown and header update without a save.

| # | Budget | Start (tag) | On screen | Proves (F-id + doc link) | Gap callout |
|---|---|---|---|---|---|
| 1 | 30s | `05-front-end` | `/schedule` — seeded sessions grouped by time, each linking out | F49/F50 Local API front end, prerender — https://docs.vexcms.dev/guides/local-api/ | — |
| 2 | 45s | same | `/admin`, signed out → GitHub sign-in → `/admin` | F38 OAuth — https://docs.vexcms.dev/guides/auth/ | — |
| 3 | 45s | same | Open a private tab, visit `/admin` anonymously — Speakers/Sessions/Event settings visible, every row read-only, no "+ New" | F41 `anonRole` read-only admin — https://docs.vexcms.dev/guides/access-control/ | — |
| 4 | 60s | same | Admin → Event Settings → edit `dates.startDate`; `/schedule` in a second tab updates the countdown/header live, no save | F3/F34 globals + global live preview — https://docs.vexcms.dev/guides/live-preview/ | — |
| 5 | 60s | same | Admin → Sessions → new session, same room + overlapping time as an existing one → save rejected with the room-clash message | F43/F45 `beforeChange`/`validate()` — https://docs.vexcms.dev/guides/lifecycle-hooks/ | — |
| 6 | 60s | same | Pick a non-conflicting slot, save → speaker's `sessionCount` increments on their Speakers row; delete the session → decrements | F44/F43 `afterChange`/`afterDelete` triggers — https://docs.vexcms.dev/guides/lifecycle-hooks/ | — |

## 15-minute script

Scaffolds live, then resumes from tags; ends on the deploy beat shown from this step's run-through
transcript and the live production URL (decision 6) — never a live deploy on camera.

| # | Budget | Start (tag) | On screen | Proves (F-id + doc link) | Gap callout |
|---|---|---|---|---|---|
| 1 | 90s | — (scaffold live) | `pnpm create vexcms@alpha conference`, marketing-site, GitHub at the OAuth prompt | F55 `create-vexcms` — https://docs.vexcms.dev/guides/quickstart/ | — |
| 2 | 2m | `01-scaffold` | `src/vexcms/collections/{speakers,sessions}.ts`, `globals/eventSettings.ts` written; `vex dev` regenerates schema/types; admin shows the three new resources | F1/F2/F52 config + codegen — https://docs.vexcms.dev/guides/quickstart/ | — |
| 3 | 90s | same | `isKeynote` checkbox, `resources` json, `eventSettings.countdown` ui field shown in the admin form | F12 json, F6 checkbox, F21 ui — https://docs.vexcms.dev/fields/ui/ | — |
| 4 | 90s | `02-collections` | `ScheduleEmbed` block added to a page's blocks field; Copy/Paste the block via the clipboard onto a second page | F17 blocks + clipboard — https://docs.vexcms.dev/fields/blocks/ | — |
| 5 | 2m | `03-access` | `access.ts` edit (resources + `adminPanel.access: true`), room-clash `validate()`, sessionCount triggers — same beats as the 5-minute script's #3/#5/#6 | F41, F43/F45, F44/F43 (see above) | — |
| 6 | 90s | `05-front-end` | GitHub sign-in beat (5-minute script #2), `/schedule`/`/sessions/[slug]`/`/speakers/[slug]` | F38, F49/F50 (see above) | — |
| 7 | 90s | same | `pnpm test` — kit suite green in the terminal (not narrated, just shown running) | F58 test kit — none (roadmap line only) | no docs page for `@vexcms/react/testing` yet → `backlog.md` |
| 8 | 2m | `06-deployed` (transcript only) | Step 21's run-through: production build log, prod URL 200, GitHub sign-in on prod, sign-up lockdown check | F53 `vex deploy` + Vercel production — https://docs.vexcms.dev/guides/deployment/ | — |

## Shot list

Silent H.264, no audio track, ≤ 60s, ≤ 10MB (`media-session.md` encode rules).

| File | ≤ 60s | Shows | From | Day |
|---|---|---|---|---|
| `conference-schedule-live-preview.mp4` | 45s | Editing `eventSettings` dates, `/schedule` updating live in a second pane | 5-min #4 | D3 |
| `conference-room-clash.mp4` | 30s | A room-clash save rejected with the validation message | 5-min #5 | D3 |
| `conference-anon-admin.mp4` | 30s | Anonymous `/admin` visit, read-only Speakers/Sessions/Event settings, no "+ New" | 5-min #3 | D4 |
| `conference-github-signin.mp4` | 30s | Signed out → GitHub OAuth → `/admin` | 5-min #2 | D3 |

## Run status notes (local run, 2026-11-10)

GitHub OAuth app not created (human item) — the OAuth wiring is in place (prompt answered
"GitHub" at scaffold time, `socialProviders.github` configured, `AuthViewProvider` lists
`"github"`), but `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` are placeholders (no real OAuth app
exists yet), so every GitHub-sign-in beat in both scripts is **blocked — OAuth app not created**
until the developer creates the app and swaps in real credentials. Every other beat ran and
passed against the real local app — see `runthrough-conference.md`.
